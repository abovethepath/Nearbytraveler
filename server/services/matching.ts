import { storage } from "../storage";
import type { User, TravelPlan } from "@shared/schema";

export interface MatchScore {
  userId: number;
  score: number; // 0-1 for compatibility level
  matchCount: number; // Raw count: "5 things", "22 things", etc.
  reasons: string[];
  compatibilityLevel: 'high' | 'medium' | 'low';
  sharedInterests: string[];
  sharedActivities: string[];
  sharedEvents: string[];
  sharedTravelIntent: string[];
  sharedSexualPreferences: string[];
  locationOverlap: boolean;
  dateOverlap: boolean;
  userTypeCompatibility: boolean;
  travelIntentCompatibility: boolean;
  bothVeterans: boolean;
  bothActiveDuty: boolean;
  sameFamilyStatus: boolean;
  sameAge: boolean;
  sameGender: boolean;
  sharedLanguages: string[];
  sharedCountries: string[];
}

export interface MatchingPreferences {
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelStyle?: string[];
  interests?: string[];
  ageRange?: { min: number; max: number };
  userTypes?: ('traveler' | 'local' | 'business')[];
  maxDistance?: number; // km for location-based matching
}

export class TravelMatchingService {
  /**
   * Find compatible travel connections for a user
   */
  async findMatches(userId: number, preferences?: MatchingPreferences): Promise<MatchScore[]> {
    const startTime = Date.now();
    console.log(`⏱️ MATCHING: Starting findMatches for user ${userId}`);
    
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');
    console.log(`⏱️ MATCHING: Got user in ${Date.now() - startTime}ms`);

    const userTravelPlans = await storage.getUserTravelPlans(userId);
    console.log(`⏱️ MATCHING: Got user travel plans in ${Date.now() - startTime}ms`);
    
    // If we have a target destination preference, filter users by location first
    let potentialMatches: any[];
    if (preferences?.destination) {
      // Use location-filtered search for destination-specific matching
      potentialMatches = await storage.searchUsersByLocation(preferences.destination, undefined);
      // Remove the requesting user from results
      potentialMatches = potentialMatches.filter(match => match.id !== userId);
    } else {
      // Use all users for general matching
      potentialMatches = await this.getAllPotentialMatches(userId);
    }
    console.log(`⏱️ MATCHING: Got ${potentialMatches.length} potential matches in ${Date.now() - startTime}ms`);
    
    const matches: MatchScore[] = [];

    for (const potentialMatch of potentialMatches) {
      const matchTravelPlans = await storage.getUserTravelPlans(potentialMatch.id);
      const score = await this.calculateCompatibilityScore(
        user, 
        potentialMatch, 
        userTravelPlans, 
        matchTravelPlans, 
        preferences
      );
      
      if (score.matchCount >= 1) { // At least 1 thing in common
        matches.push(score);
      }
    }
    
    console.log(`⏱️ MATCHING: Completed scoring ${potentialMatches.length} users in ${Date.now() - startTime}ms, found ${matches.length} matches`);

    // Sort by match count descending (22 things > 6 things > 5 things)
    return matches.sort((a, b) => b.matchCount - a.matchCount);
  }

  /**
   * Get destination-specific matches for location-based discovery
   */
  async findDestinationMatches(
    userId: number, 
    destination: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<MatchScore[]> {
    const preferences: MatchingPreferences = {
      destination,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    };

    return this.findMatches(userId, preferences);
  }

  /**
   * Calculate comprehensive compatibility score between two users
   */
  public async calculateCompatibilityScore(
    user1: User, 
    user2: User, 
    user1Plans: TravelPlan[], 
    user2Plans: TravelPlan[],
    preferences?: MatchingPreferences
  ): Promise<MatchScore> {
    const reasons: string[] = [];
    let matchCount = 0; // Count of things in common - no point system

    // Calculate shared items - each shared item = 1 thing
    const sharedInterests = this.getSharedInterests(user1, user2);
    const sharedActivities = this.getSharedActivities(user1, user2);
    const sharedEvents = await this.getSharedEvents(user1, user2);
    const sharedCityActivities = await this.getSharedCityActivities(user1, user2);
    
    matchCount += sharedInterests.length + sharedActivities.length + sharedEvents.length + sharedCityActivities.length;
    
    if (sharedInterests.length > 0 || sharedActivities.length > 0 || sharedEvents.length > 0 || sharedCityActivities.length > 0) {
      reasons.push(`${matchCount} things in common`);
      
      if (sharedCityActivities.length > 0) {
        const cityCounts: { [city: string]: number } = {};
        sharedCityActivities.forEach(item => {
          cityCounts[item.city] = (cityCounts[item.city] || 0) + 1;
        });
        Object.entries(cityCounts).forEach(([city, count]) => {
          reasons.push(`${count} shared interests in ${city}`);
        });
      }
      
      if (sharedInterests.length > 0) {
        reasons.push(`${sharedInterests.length} shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
      }
      if (sharedActivities.length > 0) {
        reasons.push(`${sharedActivities.length} shared activities: ${sharedActivities.slice(0, 3).join(', ')}`);
      }
      if (sharedEvents.length > 0) {
        reasons.push(`${sharedEvents.length} shared events: ${sharedEvents.slice(0, 3).join(', ')}`);
      }
    }

    // Location overlap - 1 thing
    const locationScore = this.calculateLocationCompatibility(
      user1Plans, 
      user2Plans, 
      preferences?.destination
    );
    if (locationScore.hasOverlap) {
      matchCount += 1;
      reasons.push(...locationScore.reasons);
    }

    // User type compatible - 1 thing
    const userTypeScore = this.calculateUserTypeCompatibility(user1, user2);
    if (userTypeScore.isCompatible) {
      matchCount += 1;
      reasons.push(...userTypeScore.reasons);
    }

    // Shared languages (excluding English) - each = 1 thing
    const sharedLanguages = this.getSharedLanguages(user1, user2);
    matchCount += sharedLanguages.length;
    if (sharedLanguages.length > 0) {
      reasons.push(`${sharedLanguages.length} shared language${sharedLanguages.length > 1 ? 's' : ''}: ${sharedLanguages.slice(0, 3).join(', ')}`);
    }

    // Same hostel - 1 thing
    const hostelScore = this.calculateHostelCompatibility(user1Plans, user2Plans);
    if (hostelScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...hostelScore.reasons);
    }

    // Travel intent matches - each factor (why, how, budget, group, travelWhat) = 1 thing
    const travelIntentScore = this.calculateTravelIntentCompatibility(user1, user2);
    matchCount += travelIntentScore.reasons.length;
    if (travelIntentScore.reasons.length > 0) reasons.push(...travelIntentScore.reasons);

    // Sexual preference - each shared = 1 thing
    const sharedSexualPrefs = this.getSharedSexualPreferences(user1, user2);
    matchCount += sharedSexualPrefs.length;
    if (sharedSexualPrefs.length > 0) {
      reasons.push(`${sharedSexualPrefs.length} shared sexual preference${sharedSexualPrefs.length > 1 ? 's' : ''}: ${sharedSexualPrefs.slice(0, 3).join(', ')}`);
    }

    // Countries visited - each = 1 thing
    const sharedCountries = this.getSharedCountries(user1, user2);
    matchCount += sharedCountries.length;
    if (sharedCountries.length > 0) {
      reasons.push(`${sharedCountries.length} countries in common: ${sharedCountries.slice(0, 3).join(', ')}`);
    }

    // Travel style - each = 1 thing
    const sharedTravelStyle = this.getSharedTravelStyle(user1, user2);
    matchCount += sharedTravelStyle.length;
    if (sharedTravelStyle.length > 0) {
      reasons.push(`${sharedTravelStyle.length} shared travel style: ${sharedTravelStyle.slice(0, 2).join(', ')}`);
    }

    // Tags - each = 1 thing
    const sharedTags = this.getSharedTags(user1, user2);
    matchCount += sharedTags.length;
    if (sharedTags.length > 0) reasons.push(`${sharedTags.length} shared tags`);

    // Local expertise - each = 1 thing
    const sharedExpertise = this.getSharedLocalExpertise(user1, user2);
    matchCount += sharedExpertise.length;
    if (sharedExpertise.length > 0) reasons.push(`${sharedExpertise.length} shared local expertise`);

    // Both veterans or both active duty - 1 thing
    const veteranScore = this.calculateVeteranStatusCompatibility(user1, user2);
    if (veteranScore.bothVeterans || veteranScore.bothActiveDuty) {
      matchCount += 1;
      reasons.push(...veteranScore.reasons);
    }

    // Age compatibility - 1 thing
    const ageScore = this.calculateAgeCompatibility(user1, user2);
    if (ageScore.sameAge || ageScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...ageScore.reasons);
    }

    // Both traveling with children - 1 thing
    if (user1.travelingWithChildren && user2.travelingWithChildren) {
      matchCount += 1;
      reasons.push('Both traveling with kids');
    }

    // Profile location overlap - 1 thing
    const profileLocationScore = this.calculateProfileLocationOverlap(user1, user2);
    if (profileLocationScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...profileLocationScore.reasons);
    }

    // Custom activities - each = 1 thing
    const sharedCustomActivities = this.getSharedCustomActivities(user1, user2);
    matchCount += sharedCustomActivities.length;
    if (sharedCustomActivities.length > 0) reasons.push(`${sharedCustomActivities.length} shared custom activities`);

    // Custom events - each = 1 thing
    const sharedCustomEvents = this.getSharedCustomEvents(user1, user2);
    matchCount += sharedCustomEvents.length;
    if (sharedCustomEvents.length > 0) reasons.push(`${sharedCustomEvents.length} shared custom events`);

    // Default travel interests - each = 1 thing
    const sharedDefaultInterests = this.getSharedDefaultTravelInterests(user1, user2);
    matchCount += sharedDefaultInterests.length;
    if (sharedDefaultInterests.length > 0) reasons.push(`${sharedDefaultInterests.length} shared travel interests`);

    // Travel plan overlap - 1 thing
    const travelPlanScore = this.calculateTravelPlanOverlap(user1Plans, user2Plans);
    if (travelPlanScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...travelPlanScore.reasons);
    }

    // Same gender - 1 thing
    if (this.haveSameGender(user1, user2)) {
      matchCount += 1;
      reasons.push('Same gender');
    }

    // Secret activities - each = 1 thing
    const sharedSecretActivities = this.getSharedSecretActivities(user1, user2);
    matchCount += sharedSecretActivities.length;
    if (sharedSecretActivities.length > 0) reasons.push(`${sharedSecretActivities.length} shared secret activities`);

    // Both new to town - 1 thing
    const newToTownScore = this.calculateNewToTownCompatibility(user1, user2);
    if (newToTownScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...newToTownScore.reasons);
    }

    // Children ages overlap - 1 thing
    const childrenAgesScore = this.calculateChildrenAgesCompatibility(user1, user2);
    if (childrenAgesScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...childrenAgesScore.reasons);
    }

    // Business compatibility - 1 thing
    const businessScore = this.calculateBusinessCompatibility(user1, user2);
    if (businessScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...businessScore.reasons);
    }

    // Bio overlap - 1 thing
    const bioScore = this.calculateBioCompatibility(user1, user2);
    if (bioScore.reasons.length > 0) {
      matchCount += 1;
      reasons.push(...bioScore.reasons);
    }

    // Add or update the "things in common" summary with final count
    const thingsIdx = reasons.findIndex(r => r.includes('things in common'));
    if (thingsIdx >= 0) {
      reasons[thingsIdx] = `${matchCount} things in common`;
    } else if (matchCount > 0) {
      reasons.unshift(`${matchCount} things in common`);
    }

    // Score as 0-1 for compatibility level (matchCount / 30 = 100% at 30+ things)
    const normalizedScore = Math.min(matchCount / 30, 1);
    
    return {
      userId: user2.id,
      score: normalizedScore,
      matchCount,
      reasons: reasons.filter(r => r.length > 0),
      compatibilityLevel: this.getCompatibilityLevel(normalizedScore),
      sharedInterests: sharedInterests,
      sharedActivities: sharedActivities,
      sharedEvents: sharedEvents,
      sharedTravelIntent: this.getSharedTravelIntent(user1, user2),
      sharedSexualPreferences: this.getSharedSexualPreferences(user1, user2),
      locationOverlap: locationScore.hasOverlap,
      dateOverlap: false, // Simplified for now
      userTypeCompatibility: userTypeScore.isCompatible,
      travelIntentCompatibility: travelIntentScore.isCompatible,
      bothVeterans: veteranScore.bothVeterans,
      bothActiveDuty: veteranScore.bothActiveDuty,
      sameFamilyStatus: !!(user1.travelingWithChildren && user2.travelingWithChildren),
      sameAge: ageScore.sameAge,
      sameGender: this.haveSameGender(user1, user2),
      sharedLanguages: this.getSharedLanguages(user1, user2),
      sharedCountries: this.getSharedCountries(user1, user2)
    };
  }

  /**
   * Calculate interest-based compatibility (includes custom interests)
   * Note: privateInterests removed for Apple App Store compliance (January 2025)
   */
  private calculateInterestCompatibility(user1: User, user2: User) {
    // Combine regular and custom interests for comprehensive matching
    const user1Interests = [
      ...this.parseInterests(user1.interests),
      ...this.parseCustomInterests(user1.customInterests)
    ];
    const user2Interests = [
      ...this.parseInterests(user2.interests),
      ...this.parseCustomInterests(user2.customInterests)
    ];
    
    // Top Choices for Most Travelers - these get bonus points for matching
    const topChoicesInterests = [
      "single and looking", "craft beer & breweries", "coffee culture", "cocktails & bars",
      "nightlife & dancing", "photography", "street art", "food trucks", 
      "rooftop bars", "pub crawls & bar tours", "local food specialties", "walking tours",
      "happy hour deals", "discounts for travelers", "boat & water tours", "food tours",
      "adventure tours", "city tours & sightseeing", "hiking & nature", "museums",
      "local unknown hotspots", "meet locals/travelers", "yoga & wellness", "live music venues",
      "beach activities", "fine dining", "historical tours", "festivals & events"
    ];
    
    const sharedInterests = user1Interests.filter(interest => 
      user2Interests.some(otherInterest => 
        this.areInterestsSimilar(interest, otherInterest)
      )
    );

    // Calculate shared popular interests for bonus scoring
    const sharedPopularInterests = sharedInterests.filter(interest =>
      topChoicesInterests.some(popular => 
        this.areInterestsSimilar(interest, popular)
      )
    );

    // Base scoring: calculate based on overlap percentage of the smaller interest set
    const smallerInterestCount = Math.min(user1Interests.length, user2Interests.length);
    
    // Calculate percentage of shared interests relative to the smaller set
    const overlapPercentage = smallerInterestCount > 0 ? sharedInterests.length / smallerInterestCount : 0;
    
    // Base score from overlap percentage - increased for higher matches
    let score = Math.min(overlapPercentage * 22, 22); // Increased base scoring
    
    // Bonus points for popular interests (up to 8 additional points)
    const popularBonus = Math.min(sharedPopularInterests.length * 1.5, 8);
    score += popularBonus;
    
    // Additional compatibility boost - give minimum points for any shared interests
    if (sharedInterests.length > 0 && score < 15) {
      score = Math.max(score, 15); // Minimum 15 points for any shared interests
    }
    
    const reasons = [];
    if (sharedInterests.length > 0) {
      reasons.push(`${sharedInterests.length} shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    }
    if (sharedPopularInterests.length > 0) {
      reasons.push(`${sharedPopularInterests.length} popular travel interests in common`);
    }

    return { score, reasons };
  }

  /**
   * Calculate activity-based compatibility
   */
  private calculateActivityCompatibility(user1: User, user2: User) {
    const user1Activities = [
      ...this.parseInterests(user1.localActivities),
      ...this.parseInterests(user1.preferredActivities)
    ];
    const user2Activities = [
      ...this.parseInterests(user2.localActivities), 
      ...this.parseInterests(user2.preferredActivities)
    ];
    
    const sharedActivities = user1Activities.filter(activity => 
      user2Activities.some(otherActivity => 
        this.areInterestsSimilar(activity, otherActivity)
      )
    );

    // Fixed scoring: calculate based on overlap percentage of the smaller activity set
    const smallerActivityCount = Math.min(user1Activities.length, user2Activities.length);
    const overlapPercentage = smallerActivityCount > 0 ? sharedActivities.length / smallerActivityCount : 0;
    let score = Math.min(overlapPercentage * 15, 15);
    
    // Boost for any shared activities - minimum 8 points if there's any overlap
    if (sharedActivities.length > 0 && score < 8) {
      score = Math.max(score, 8);
    }
    
    const reasons = sharedActivities.length > 0 
      ? [`${sharedActivities.length} shared activities: ${sharedActivities.slice(0, 3).join(', ')}`]
      : [];

    return { score, reasons };
  }

  /**
   * Calculate event-based compatibility
   */
  private async calculateEventCompatibility(user1: User, user2: User) {
    // Get events they're actually attending from the database
    const user1Participations = await storage.getUserEventParticipations(user1.id);
    const user2Participations = await storage.getUserEventParticipations(user2.id);
    
    // Extract event titles/names from their actual event participations
    const user1AttendingEvents = await Promise.all(
      user1Participations.map(async (participation) => {
        const event = await storage.getEvent(participation.eventId);
        return event?.title || '';
      })
    );
    
    const user2AttendingEvents = await Promise.all(
      user2Participations.map(async (participation) => {
        const event = await storage.getEvent(participation.eventId);
        return event?.title || '';
      })
    );
    
    // Combine profile event interests with actual events they're attending
    const user1Events = [
      ...this.parseInterests(user1.events), // Use the actual 'events' field
      ...this.parseInterests(user1.localEvents),
      ...this.parseInterests(user1.plannedEvents),
      ...user1AttendingEvents.filter(title => title.length > 0) // Add actual events they're attending
    ];
    const user2Events = [
      ...this.parseInterests(user2.events), // Use the actual 'events' field
      ...this.parseInterests(user2.localEvents),
      ...this.parseInterests(user2.plannedEvents),
      ...user2AttendingEvents.filter(title => title.length > 0) // Add actual events they're attending
    ];
    
    const sharedEvents = user1Events.filter(event => 
      user2Events.some(otherEvent => 
        this.areInterestsSimilar(event, otherEvent)
      )
    );

    // Fixed scoring: calculate based on overlap percentage of the smaller event set
    const smallerEventCount = Math.min(user1Events.length, user2Events.length);
    const overlapPercentage = smallerEventCount > 0 ? sharedEvents.length / smallerEventCount : 0;
    let score = Math.min(overlapPercentage * 10, 10);
    
    // Boost for any shared events - minimum 5 points if there's any overlap
    if (sharedEvents.length > 0 && score < 5) {
      score = Math.max(score, 5);
    }
    
    const reasons = sharedEvents.length > 0 
      ? [`${sharedEvents.length} shared events: ${sharedEvents.slice(0, 3).join(', ')}`]
      : [];

    return { score, reasons };
  }

  /**
   * Calculate location/destination compatibility
   */
  private calculateLocationCompatibility(
    user1Plans: TravelPlan[], 
    user2Plans: TravelPlan[], 
    targetDestination?: string
  ) {

    
    let score = 0;
    const reasons: string[] = [];
    let hasOverlap = false;

    // If target destination specified, prioritize matches there
    if (targetDestination) {
      const user1HasDestination = user1Plans.some(plan => 
        this.areLocationsSimilar(plan.destination, targetDestination)
      );
      const user2HasDestination = user2Plans.some(plan => 
        this.areLocationsSimilar(plan.destination, targetDestination)
      );

      if (user1HasDestination && user2HasDestination) {
        score += 30;
        hasOverlap = true;
        reasons.push(`Both planning to visit ${targetDestination}`);
      }
    } else {
      // Check for any overlapping destinations
      for (const plan1 of user1Plans) {
        for (const plan2 of user2Plans) {
          if (this.areLocationsSimilar(plan1.destination, plan2.destination)) {
            score += 15;
            hasOverlap = true;
            reasons.push(`Both visiting ${plan1.destination}`);
            break;
          }
        }
      }
    }

    return { score: Math.min(score, 30), reasons, hasOverlap };
  }

  /**
   * Calculate date overlap compatibility
   */
  private calculateDateCompatibility(
    user1Plans: TravelPlan[], 
    user2Plans: TravelPlan[], 
    targetStartDate?: string, 
    targetEndDate?: string
  ) {
    let score = 0;
    const reasons: string[] = [];
    let hasOverlap = false;

    // If target dates are specified, check overlap with those dates
    if (targetStartDate) {
      for (const plan1 of user1Plans) {
        const overlap = this.calculateDateOverlap(
          plan1.startDate, plan1.endDate,
          targetStartDate, targetEndDate || null
        );
        if (overlap.days > 0) {
          score += Math.min(overlap.days * 3, 25);
          hasOverlap = true;
          reasons.push(`${overlap.days} overlapping days during your planned trip`);
        }
      }
      
      for (const plan2 of user2Plans) {
        const overlap = this.calculateDateOverlap(
          plan2.startDate, plan2.endDate,
          targetStartDate, targetEndDate || null
        );
        if (overlap.days > 0) {
          score += Math.min(overlap.days * 3, 25);
          hasOverlap = true;
          reasons.push(`${overlap.days} overlapping days during your planned trip`);
        }
      }
    }

    // Check for overlapping dates in same destinations
    for (const plan1 of user1Plans) {
      for (const plan2 of user2Plans) {
        if (this.areLocationsSimilar(plan1.destination, plan2.destination)) {
          const overlap = this.calculateDateOverlap(
            plan1.startDate, plan1.endDate,
            plan2.startDate, plan2.endDate
          );

          if (overlap.days > 0) {
            score += Math.min(overlap.days * 2, 25);
            hasOverlap = true;
            const overlapPercentage = this.calculateOverlapPercentage(
              plan1.startDate, plan1.endDate,
              plan2.startDate, plan2.endDate
            );
            reasons.push(`${overlap.days} overlapping days in ${plan1.destination} (${overlapPercentage}% overlap)`);
          }
        }
      }
    }

    // Bonus for similar travel timeframes even in different locations
    for (const plan1 of user1Plans) {
      for (const plan2 of user2Plans) {
        if (!this.areLocationsSimilar(plan1.destination, plan2.destination)) {
          const timeProximity = this.calculateTimeProximity(
            plan1.startDate, plan1.endDate,
            plan2.startDate, plan2.endDate
          );
          if (timeProximity.daysApart <= 7) {
            score += Math.min(5 - timeProximity.daysApart, 5);
            reasons.push(`Traveling within ${timeProximity.daysApart} days of each other`);
          }
        }
      }
    }

    return { score: Math.min(score, 25), reasons, hasOverlap };
  }

  /**
   * Calculate hostel compatibility - only matches if SAME DESTINATION + dates overlap
   * Travelers at the same hostel in the same city with overlapping dates get bonus points
   */
  private calculateHostelCompatibility(
    user1Plans: TravelPlan[], 
    user2Plans: TravelPlan[]
  ) {
    let score = 0;
    const reasons: string[] = [];

    // Check each combination of travel plans for hostel + destination + date overlap
    for (const plan1 of user1Plans) {
      for (const plan2 of user2Plans) {
        // Both need to have a hostel name
        if (!plan1.hostelName || !plan2.hostelName) continue;

        // CRITICAL: Both must be going to the SAME destination
        // This prevents matching "Mosaic Prague" with "Mosaic Amsterdam"
        if (!this.areLocationsSimilar(plan1.destination, plan2.destination)) continue;

        // Normalize hostel names for comparison (case-insensitive, trim whitespace)
        const hostel1 = plan1.hostelName.toLowerCase().trim();
        const hostel2 = plan2.hostelName.toLowerCase().trim();

        // Check if hostels are the same or very similar
        if (hostel1 === hostel2 || this.areHostelsSimilar(hostel1, hostel2)) {
          // Now check if dates overlap - REQUIRED for hostel matching
          const dateOverlap = this.calculateDateOverlap(
            plan1.startDate, plan1.endDate,
            plan2.startDate, plan2.endDate
          );

          if (dateOverlap.days > 0) {
            // Strong match: same hostel + same city + overlapping dates
            score += 15;
            reasons.push(`🏨 Both staying at ${plan1.hostelName} in ${plan1.destination} with ${dateOverlap.days} overlapping days!`);
          }
        }
      }
    }

    return { score: Math.min(score, 15), reasons };
  }

  /**
   * Check if two hostel names are similar enough to be considered the same
   * Handles common variations like "HI Los Angeles" vs "HI LA" or typos
   */
  private areHostelsSimilar(hostel1: string, hostel2: string): boolean {
    // Exact match after normalization
    if (hostel1 === hostel2) return true;

    // One contains the other (handles abbreviations)
    if (hostel1.includes(hostel2) || hostel2.includes(hostel1)) return true;

    // Calculate similarity using Levenshtein-like approach for typo tolerance
    // If difference is less than 20% of the longer string, consider similar
    const maxLen = Math.max(hostel1.length, hostel2.length);
    const minLen = Math.min(hostel1.length, hostel2.length);
    
    // If length difference is too large, not similar
    if (maxLen - minLen > 5) return false;

    // Count matching characters
    let matches = 0;
    const shorter = hostel1.length <= hostel2.length ? hostel1 : hostel2;
    const longer = hostel1.length <= hostel2.length ? hostel2 : hostel1;
    
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    // If 80%+ of characters match, consider similar
    return (matches / maxLen) >= 0.8;
  }

  /**
   * Calculate user type compatibility
   */
  private calculateUserTypeCompatibility(user1: User, user2: User) {
    let score = 0;
    let isCompatible = false;
    const reasons: string[] = [];

    // Enhanced compatibility scoring for all user type combinations
    if (user1.userType === 'traveler' && user2.userType === 'local') {
      score = 10;
      isCompatible = true;
      reasons.push('Traveler-local connection ideal for authentic experiences');
    } else if (user1.userType === 'local' && user2.userType === 'traveler') {
      score = 10;
      isCompatible = true;
      reasons.push('Local expertise meets traveler curiosity');
    } else if (user1.userType === 'currently_traveling' && user2.userType === 'local') {
      score = 10;
      isCompatible = true;
      reasons.push('Current traveler can get local insights');
    } else if (user1.userType === 'local' && user2.userType === 'currently_traveling') {
      score = 10;
      isCompatible = true;
      reasons.push('Local can help current traveler');
    } else if (user1.userType === 'traveler' && user2.userType === 'traveler') {
      score = 8;
      isCompatible = true;
      reasons.push('Fellow travelers can share experiences and costs');
    } else if (user1.userType === 'local' && user2.userType === 'local') {
      score = 8; // Increased from 6 to 8 for better local-to-local matching
      isCompatible = true;
      reasons.push('Local connections for area insights and friendships');
    } else if (user1.userType === 'currently_traveling' && user2.userType === 'currently_traveling') {
      score = 9;
      isCompatible = true;
      reasons.push('Current travelers can meet up and explore together');
    } else {
      // Default compatibility for any other combinations
      score = 5;
      isCompatible = true;
      reasons.push('Compatible for networking and travel connections');
    }

    return { score, reasons, isCompatible };
  }

  /**
   * Calculate travel style compatibility based on bio analysis
   */
  private calculateTravelStyleCompatibility(user1: User, user2: User) {
    const user1Keywords = this.extractTravelKeywords(user1.bio || '');
    const user2Keywords = this.extractTravelKeywords(user2.bio || '');
    
    const sharedKeywords = user1Keywords.filter(keyword => 
      user2Keywords.includes(keyword)
    );

    const score = Math.min(sharedKeywords.length * 2, 10);
    const reasons = sharedKeywords.length > 0 
      ? [`Similar travel style: ${sharedKeywords.slice(0, 2).join(', ')}`]
      : [];

    return { score, reasons };
  }

  /**
   * Calculate travel intent compatibility based on quiz results
   */
  private calculateTravelIntentCompatibility(user1: User, user2: User) {
    let score = 0;
    const reasons: string[] = [];
    let isCompatible = false;

    // Travel Why compatibility (5 points)
    if (user1.travelWhy && user2.travelWhy && user1.travelWhy === user2.travelWhy) {
      score += 5;
      const whyNames = {
        adventure: 'Adventure & Discovery',
        connection: 'Meeting People',
        culture: 'Cultural Immersion',
        relaxation: 'Rest & Recharge'
      };
      reasons.push(`Both travel for ${(whyNames as any)[user1.travelWhy] || user1.travelWhy}`);
    }

    // Travel Style compatibility (5 points)
    if (user1.travelHow && user2.travelHow && user1.travelHow === user2.travelHow) {
      score += 5;
      const styleNames = {
        planner: 'Detailed Planning',
        spontaneous: 'Spontaneous Exploration',
        social: 'Social Group Activities',
        independent: 'Independent Exploration'
      };
      reasons.push(`Both prefer ${(styleNames as any)[user1.travelHow] || user1.travelHow}`);
    }

    // Budget compatibility (3 points)
    if (user1.travelBudget && user2.travelBudget && user1.travelBudget === user2.travelBudget) {
      score += 3;
      const budgetNames = {
        budget: 'Budget-conscious travel',
        moderate: 'Moderate spending',
        premium: 'Premium experiences'
      };
      reasons.push(`Both have ${(budgetNames as any)[user1.travelBudget] || user1.travelBudget} budget`);
    }

    // Group type compatibility (2 points)
    if (user1.travelGroup && user2.travelGroup && user1.travelGroup === user2.travelGroup) {
      score += 2;
      const groupNames = {
        solo: 'Solo travelers',
        couple: 'Couple travel',
        friends: 'Friends group',
        family: 'Family travel'
      };
      reasons.push(`Both are ${(groupNames as any)[user1.travelGroup] || user1.travelGroup}`);
    }

    // Travel interests compatibility (shared interests from quiz)
    if (user1.travelWhat && user2.travelWhat) {
      const user1Interests = Array.isArray(user1.travelWhat) ? user1.travelWhat : [];
      const user2Interests = Array.isArray(user2.travelWhat) ? user2.travelWhat : [];
      
      const sharedTravelInterests = user1Interests.filter(interest => 
        user2Interests.includes(interest)
      );

      if (sharedTravelInterests.length > 0) {
        score += Math.min(sharedTravelInterests.length * 1, 3); // Up to 3 points for shared interests
        reasons.push(`${sharedTravelInterests.length} shared travel interests`);
      }
    }

    isCompatible = score >= 5; // Need at least 5 points for travel intent compatibility

    return { score, reasons, isCompatible };
  }

  /**
   * Get shared travel intent elements for display
   */
  private getSharedTravelIntent(user1: User, user2: User): string[] {
    const shared: string[] = [];

    // Add shared travel why
    if (user1.travelWhy && user2.travelWhy && user1.travelWhy === user2.travelWhy) {
      const whyNames = {
        adventure: 'Adventure & Discovery',
        connection: 'Meeting People',
        culture: 'Cultural Immersion',
        relaxation: 'Rest & Recharge'
      };
      shared.push((whyNames as any)[user1.travelWhy] || user1.travelWhy);
    }

    // Add shared travel style
    if (user1.travelHow && user2.travelHow && user1.travelHow === user2.travelHow) {
      const styleNames = {
        planner: 'Detailed Planning',
        spontaneous: 'Spontaneous Exploration',
        social: 'Social Activities',
        independent: 'Independent Exploration'
      };
      shared.push((styleNames as any)[user1.travelHow] || user1.travelHow);
    }

    // Add shared budget level
    if (user1.travelBudget && user2.travelBudget && user1.travelBudget === user2.travelBudget) {
      const budgetNames = {
        budget: 'Budget-conscious',
        moderate: 'Moderate budget',
        premium: 'Premium budget'
      };
      shared.push((budgetNames as any)[user1.travelBudget] || user1.travelBudget);
    }

    // Add shared travel interests from quiz
    if (user1.travelWhat && user2.travelWhat) {
      const user1Interests = Array.isArray(user1.travelWhat) ? user1.travelWhat : [];
      const user2Interests = Array.isArray(user2.travelWhat) ? user2.travelWhat : [];
      
      const sharedTravelInterests = user1Interests.filter(interest => 
        user2Interests.includes(interest)
      );

      // Convert to display names
      const interestNames = {
        food: 'Foodie experiences',
        art: 'Art & Museums',
        music: 'Music & Nightlife',
        photography: 'Photography',
        coffee: 'Coffee Culture',
        nature: 'Nature & Outdoors'
      };

      sharedTravelInterests.forEach(interest => {
        shared.push((interestNames as any)[interest] || interest);
      });
    }

    return shared;
  }

  /**
   * Helper methods
   */
  private async getAllPotentialMatches(excludeUserId: number): Promise<User[]> {
    // Get users from all relevant cities and filter out the requesting user
    const allUsers = await storage.searchUsers('', undefined);
    return allUsers.filter(user => user.id !== excludeUserId);
  }

  private parseInterests(interests: string[] | null): string[] {
    if (!interests) return [];
    return interests.map(i => i.trim().toLowerCase());
  }

  private parseCustomInterests(customInterests: string | null | undefined): string[] {
    if (!customInterests || typeof customInterests !== 'string') return [];
    return customInterests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
  }

  private areInterestsSimilar(interest1: string, interest2: string): boolean {
    const int1 = interest1.toLowerCase();
    const int2 = interest2.toLowerCase();
    
    // Exact match
    if (int1 === int2) return true;
    
    // Substring matching
    if (int1.includes(int2) || int2.includes(int1)) return true;
    
    // Enhanced semantic similarity mappings for common travel interests
    const similarityMap = {
      'music': ['jazz', 'concerts', 'nightlife', 'dancing', 'clubs', 'jazz clubs', 'music & concerts'],
      'food': ['dining', 'restaurants', 'cuisine', 'cooking', 'culinary', 'food'],
      'adventure': ['hiking', 'extreme sports', 'rock climbing', 'hang gliding', 'adventure'],
      'culture': ['history', 'museums', 'art', 'cultural events', 'lgbtqia+'],
      'nightlife': ['bars', 'clubs', 'happy hours', 'cocktails', 'dancing', 'nightlife', 'craft beer'],
      'social': ['meet locals', 'networking', 'friends', 'volunteering', 'meet locals/travelers', 'freinds'],
      'entertainment': ['shows', 'concerts', 'festivals', 'events', 'underground scene'],
      'nature': ['beach', 'hiking', 'outdoor', 'wildlife', 'dolphin watching', 'beach activities'],
      'shopping': ['vintage shopping', 'markets', 'boutiques', 'shopping'],
      'sports': ['extreme sports', 'rock climbing', 'beach activities'],
      'photography': ['photography', 'art', 'visual arts'],
      'activities': ['language practice', 'walking tours', 'city tours', 'food tours', 'bar hopping']
    };
    
    // Check if interests belong to the same category
    for (const [category, keywords] of Object.entries(similarityMap)) {
      const int1HasKeyword = keywords.some(keyword => int1.includes(keyword));
      const int2HasKeyword = keywords.some(keyword => int2.includes(keyword));
      if (int1HasKeyword && int2HasKeyword) return true;
    }
    
    return false;
  }

  private areLocationsSimilar(location1: string, location2: string): boolean {
    const normalize = (loc: string) => loc.toLowerCase().replace(/[,\s]/g, '');
    return normalize(location1).includes(normalize(location2)) ||
           normalize(location2).includes(normalize(location1));
  }

  private calculateDateOverlap(
    start1: string | Date | null, end1: string | Date | null,
    start2: string | Date | null, end2: string | Date | null
  ): { days: number } {
    if (!start1 || !start2) return { days: 0 };

    const startDate1 = start1 instanceof Date ? start1 : new Date(start1);
    const endDate1 = end1 ? (end1 instanceof Date ? end1 : new Date(end1)) : new Date(startDate1);
    const startDate2 = start2 instanceof Date ? start2 : new Date(start2);
    const endDate2 = end2 ? (end2 instanceof Date ? end2 : new Date(end2)) : new Date(startDate2);

    const overlapStart = new Date(Math.max(startDate1.getTime(), startDate2.getTime()));
    const overlapEnd = new Date(Math.min(endDate1.getTime(), endDate2.getTime()));

    if (overlapStart <= overlapEnd) {
      const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return { days: diffDays };
    }

    return { days: 0 };
  }

  private calculateOverlapPercentage(
    start1: string | Date | null, end1: string | Date | null,
    start2: string | Date | null, end2: string | Date | null
  ): number {
    if (!start1 || !start2) return 0;

    const startDate1 = start1 instanceof Date ? start1 : new Date(start1);
    const endDate1 = end1 ? (end1 instanceof Date ? end1 : new Date(end1)) : new Date(startDate1);
    const startDate2 = start2 instanceof Date ? start2 : new Date(start2);
    const endDate2 = end2 ? (end2 instanceof Date ? end2 : new Date(end2)) : new Date(startDate2);

    const trip1Days = Math.ceil((endDate1.getTime() - startDate1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const trip2Days = Math.ceil((endDate2.getTime() - startDate2.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const overlapDays = this.calculateDateOverlap(start1, end1, start2, end2).days;

    const shorterTrip = Math.min(trip1Days, trip2Days);
    return Math.round((overlapDays / shorterTrip) * 100);
  }

  private calculateTimeProximity(
    start1: string | Date | null, end1: string | Date | null,
    start2: string | Date | null, end2: string | Date | null
  ): { daysApart: number } {
    if (!start1 || !start2) return { daysApart: 999 };

    const startDate1 = start1 instanceof Date ? start1 : new Date(start1);
    const endDate1 = end1 ? (end1 instanceof Date ? end1 : new Date(end1)) : new Date(startDate1);
    const startDate2 = start2 instanceof Date ? start2 : new Date(start2);
    const endDate2 = end2 ? (end2 instanceof Date ? end2 : new Date(end2)) : new Date(startDate2);

    // Calculate the minimum distance between the two trip periods
    const gap1 = Math.abs(endDate1.getTime() - startDate2.getTime()) / (1000 * 60 * 60 * 24);
    const gap2 = Math.abs(endDate2.getTime() - startDate1.getTime()) / (1000 * 60 * 60 * 24);
    
    return { daysApart: Math.round(Math.min(gap1, gap2)) };
  }

  private extractTravelKeywords(bio: string): string[] {
    const keywords = [
      'solo', 'group', 'budget', 'luxury', 'adventure', 'relaxation', 
      'backpacking', 'cultural', 'food', 'nightlife', 'nature', 'history',
      'photography', 'hiking', 'beaches', 'museums', 'local cuisine'
    ];

    return keywords.filter(keyword => 
      bio.toLowerCase().includes(keyword)
    );
  }

  private getSharedInterests(user1: User, user2: User): string[] {
    // Combine all interest sources: interests, custom, subInterests, privateInterests
    const user1Interests = [
      ...this.parseInterests(user1.interests),
      ...this.parseCustomInterests(user1.customInterests),
      ...this.parseInterests(user1.subInterests),
      ...this.parseInterests(user1.privateInterests)
    ];
    const user2Interests = [
      ...this.parseInterests(user2.interests),
      ...this.parseCustomInterests(user2.customInterests),
      ...this.parseInterests(user2.subInterests),
      ...this.parseInterests(user2.privateInterests)
    ];
    
    return user1Interests.filter(interest => 
      user2Interests.some(otherInterest => 
        this.areInterestsSimilar(interest, otherInterest)
      )
    );
  }

  private getSharedActivities(user1: User, user2: User): string[] {
    const user1Activities = [
      ...this.parseInterests(user1.activities),
      ...this.parseInterests(user1.localActivities),
      ...this.parseInterests(user1.preferredActivities),
      ...this.parseInterests(user1.defaultTravelActivities)
    ];
    const user2Activities = [
      ...this.parseInterests(user2.activities),
      ...this.parseInterests(user2.localActivities), 
      ...this.parseInterests(user2.preferredActivities),
      ...this.parseInterests(user2.defaultTravelActivities)
    ];
    
    return user1Activities.filter(activity => 
      user2Activities.some(otherActivity => 
        this.areInterestsSimilar(activity, otherActivity)
      )
    );
  }

  private async getSharedEvents(user1: User, user2: User): Promise<string[]> {
    // Get events they're actually attending from the database
    const user1Participations = await storage.getUserEventParticipations(user1.id);
    const user2Participations = await storage.getUserEventParticipations(user2.id);
    
    // Extract event titles/names from their actual event participations
    const user1AttendingEvents = await Promise.all(
      user1Participations.map(async (participation) => {
        const event = await storage.getEvent(participation.eventId);
        return event?.title || '';
      })
    );
    
    const user2AttendingEvents = await Promise.all(
      user2Participations.map(async (participation) => {
        const event = await storage.getEvent(participation.eventId);
        return event?.title || '';
      })
    );
    
    // Combine profile event interests with actual events they're attending
    const user1Events = [
      ...this.parseInterests(user1.events), // Use the actual 'events' field
      ...this.parseInterests(user1.localEvents),
      ...this.parseInterests(user1.plannedEvents),
      ...this.parseInterests(user1.defaultTravelEvents),
      ...user1AttendingEvents.filter(title => title.length > 0) // Add actual events they're attending
    ];
    const user2Events = [
      ...this.parseInterests(user2.events), // Use the actual 'events' field
      ...this.parseInterests(user2.localEvents), 
      ...this.parseInterests(user2.plannedEvents),
      ...this.parseInterests(user2.defaultTravelEvents),
      ...user2AttendingEvents.filter(title => title.length > 0) // Add actual events they're attending
    ];
    
    return user1Events.filter(event => 
      user2Events.some(otherEvent => 
        this.areInterestsSimilar(event, otherEvent)
      )
    );
  }

  /**
   * Get shared city-specific activities (Things I Want To Do) with city context
   */
  private async getSharedCityActivities(user1: User, user2: User): Promise<{activity: string, city: string}[]> {
    // Get city-specific activities from userCityInterests table
    const user1CityInterests = await storage.getUserActivityMatches(user1.id);
    const user2CityInterests = await storage.getUserActivityMatches(user2.id);
    
    const sharedActivities: {activity: string, city: string}[] = [];
    
    // Find activities they both have in the same cities
    for (const interest1 of user1CityInterests) {
      for (const interest2 of user2CityInterests) {
        // Check if it's the same city and same or similar activity
        if (interest1.cityName === interest2.cityName && 
            this.areInterestsSimilar(interest1.activityName, interest2.activityName)) {
          sharedActivities.push({
            activity: interest1.activityName,
            city: interest1.cityName
          });
        }
      }
    }
    
    return sharedActivities;
  }

  private getCompatibilityLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate sexual preference compatibility
   */
  private calculateSexualPreferenceCompatibility(user1: User, user2: User) {
    const user1Preferences = this.parseInterests(user1.sexualPreference);
    const user2Preferences = this.parseInterests(user2.sexualPreference);
    
    const sharedPreferences = user1Preferences.filter(pref => 
      user2Preferences.some(otherPref => 
        this.areInterestsSimilar(pref, otherPref)
      )
    );

    const score = Math.min(sharedPreferences.length * 2.5, 5); // 2.5 points per shared preference, max 5
    const reasons = sharedPreferences.length > 0 
      ? [`${sharedPreferences.length} shared sexual preference${sharedPreferences.length > 1 ? 's' : ''}: ${sharedPreferences.slice(0, 3).join(', ')}`]
      : [];

    return { score, reasons };
  }

  /**
   * Calculate family status compatibility
   */
  private calculateFamilyStatusCompatibility(user1: User, user2: User) {
    // Family status comparison not available in current schema
    const sameFamilyStatus = false;

    const score = 0;
    const reasons: string[] = [];

    return { score, reasons, sameFamilyStatus };
  }

  /**
   * Calculate veteran status compatibility
   */
  private calculateVeteranStatusCompatibility(user1: User, user2: User) {
    const bothVeterans = user1.isVeteran && user2.isVeteran;
    const bothActiveDuty = user1.isActiveDuty && user2.isActiveDuty;

    let score = 0;
    const reasons = [];

    if (bothVeterans) {
      score += 3;
      reasons.push('Both are veterans');
    }

    if (bothActiveDuty) {
      score += 2;
      reasons.push('Both are active duty');
    }

    return { score, reasons, bothVeterans: !!bothVeterans, bothActiveDuty: !!bothActiveDuty };
  }

  /**
   * Calculate age compatibility
   */
  private calculateAgeCompatibility(user1: User, user2: User) {
    if (!user1.age || !user2.age) {
      return { score: 0, reasons: [], sameAge: false };
    }

    const ageDifference = Math.abs(user1.age - user2.age);
    let score = 0;
    const reasons = [];
    let sameAge = false;

    if (ageDifference === 0) {
      score = 5;
      sameAge = true;
      reasons.push('Same age');
    } else if (ageDifference <= 2) {
      score = 4;
      reasons.push(`Close in age (${ageDifference} year difference)`);
    } else if (ageDifference <= 5) {
      score = 2;
      reasons.push(`Similar age range (${ageDifference} year difference)`);
    }

    return { score, reasons, sameAge };
  }

  /** Languages to exclude from match scoring (everyone has these - don't count as a match) */
  private readonly EXCLUDED_LANGUAGES = ['english', 'en'];

  /**
   * Calculate language compatibility - excludes English since everyone speaks it
   */
  private calculateLanguageCompatibility(user1: User, user2: User) {
    const user1Languages = this.parseInterests(user1.languagesSpoken).filter(
      lang => !this.EXCLUDED_LANGUAGES.includes(lang)
    );
    const user2Languages = this.parseInterests(user2.languagesSpoken).filter(
      lang => !this.EXCLUDED_LANGUAGES.includes(lang)
    );
    
    const sharedLanguages = user1Languages.filter(lang => 
      user2Languages.some(otherLang => 
        this.areInterestsSimilar(lang, otherLang)
      )
    );

    const score = Math.min(sharedLanguages.length * 1.5, 5); // 1.5 points per shared language, max 5
    const reasons = sharedLanguages.length > 0 
      ? [`${sharedLanguages.length} shared language${sharedLanguages.length > 1 ? 's' : ''}: ${sharedLanguages.slice(0, 3).join(', ')}`]
      : [];

    return { score, reasons };
  }

  /**
   * Get shared sexual preferences
   */
  private getSharedSexualPreferences(user1: User, user2: User): string[] {
    const user1Preferences = this.parseInterests(user1.sexualPreference);
    const user2Preferences = this.parseInterests(user2.sexualPreference);
    
    return user1Preferences.filter(pref => 
      user2Preferences.some(otherPref => 
        this.areInterestsSimilar(pref, otherPref)
      )
    );
  }

  /**
   * Get shared languages - excludes English since everyone speaks it
   */
  private getSharedLanguages(user1: User, user2: User): string[] {
    const user1Languages = this.parseInterests(user1.languagesSpoken).filter(
      lang => !this.EXCLUDED_LANGUAGES.includes(lang)
    );
    const user2Languages = this.parseInterests(user2.languagesSpoken).filter(
      lang => !this.EXCLUDED_LANGUAGES.includes(lang)
    );
    
    return user1Languages.filter(lang => 
      user2Languages.some(otherLang => 
        this.areInterestsSimilar(lang, otherLang)
      )
    );
  }

  /**
   * Get shared countries
   */
  private getSharedCountries(user1: User, user2: User): string[] {
    const user1Countries = this.parseInterests(user1.countriesVisited);
    const user2Countries = this.parseInterests(user2.countriesVisited);
    
    return user1Countries.filter(country => 
      user2Countries.some(otherCountry => 
        this.areInterestsSimilar(country, otherCountry)
      )
    );
  }

  /**
   * Get shared travel style (solo, budget, luxury, etc.)
   */
  private getSharedTravelStyle(user1: User, user2: User): string[] {
    const user1Styles = this.parseInterests(user1.travelStyle);
    const user2Styles = this.parseInterests(user2.travelStyle);
    
    return user1Styles.filter(style => 
      user2Styles.some(other => this.areInterestsSimilar(style, other))
    );
  }

  /**
   * Get shared tags
   */
  private getSharedTags(user1: User, user2: User): string[] {
    const user1Tags = this.parseInterests(user1.tags);
    const user2Tags = this.parseInterests(user2.tags);
    
    return user1Tags.filter(tag => 
      user2Tags.some(other => this.areInterestsSimilar(tag, other))
    );
  }

  /**
   * Get shared local expertise
   */
  private getSharedLocalExpertise(user1: User, user2: User): string[] {
    const user1Expertise = this.parseInterests(user1.localExpertise);
    const user2Expertise = this.parseInterests(user2.localExpertise);
    
    return user1Expertise.filter(expertise => 
      user2Expertise.some(other => this.areInterestsSimilar(expertise, other))
    );
  }

  /**
   * Check if users have the same gender
   */
  private haveSameGender(user1: User, user2: User): boolean {
    return !!(user1.gender && user2.gender && 
      user1.gender.toLowerCase() === user2.gender.toLowerCase());
  }

  /**
   * Calculate profile location overlap (hometown, destination, metro area)
   */
  private calculateProfileLocationOverlap(user1: User, user2: User) {
    let score = 0;
    const reasons: string[] = [];
    const normalize = (s: string | null | undefined) => (s || '').toLowerCase().trim();

    if (normalize(user1.hometownCity) && normalize(user2.hometownCity) &&
        this.areLocationsSimilar(user1.hometownCity!, user2.hometownCity!)) {
      score += 1.5;
      reasons.push('Same hometown city');
    }
    if (normalize(user1.destinationCity) && normalize(user2.destinationCity) &&
        this.areLocationsSimilar(user1.destinationCity!, user2.destinationCity!)) {
      score += 1.5;
      reasons.push('Same destination city');
    }
    if (normalize(user1.metroArea) && normalize(user2.metroArea) &&
        user1.metroArea!.toLowerCase() === user2.metroArea!.toLowerCase()) {
      score += 1;
      reasons.push('Same metro area');
    }

    return { score: Math.min(score, 3), reasons };
  }

  /**
   * Get shared custom activities (comma-separated strings)
   */
  private getSharedCustomActivities(user1: User, user2: User): string[] {
    const u1 = this.parseCustomInterests(user1.customActivities);
    const u2 = this.parseCustomInterests(user2.customActivities);
    return u1.filter(a => u2.some(b => this.areInterestsSimilar(a, b)));
  }

  /**
   * Get shared custom events
   */
  private getSharedCustomEvents(user1: User, user2: User): string[] {
    const u1 = this.parseCustomInterests(user1.customEvents);
    const u2 = this.parseCustomInterests(user2.customEvents);
    return u1.filter(e => u2.some(f => this.areInterestsSimilar(e, f)));
  }

  /**
   * Get shared default travel interests
   */
  private getSharedDefaultTravelInterests(user1: User, user2: User): string[] {
    const u1 = this.parseInterests(user1.defaultTravelInterests);
    const u2 = this.parseInterests(user2.defaultTravelInterests);
    return u1.filter(i => u2.some(j => this.areInterestsSimilar(i, j)));
  }

  /**
   * Calculate travel plan overlap (destination, accommodation, transportation - beyond hostel)
   */
  private calculateTravelPlanOverlap(plans1: TravelPlan[], plans2: TravelPlan[]) {
    let score = 0;
    const reasons: string[] = [];

    for (const p1 of plans1) {
      for (const p2 of plans2) {
        if (!this.areLocationsSimilar(p1.destination, p2.destination)) continue;
        if (p1.accommodation && p2.accommodation &&
            this.areInterestsSimilar(p1.accommodation, p2.accommodation)) {
          score += 1;
          reasons.push(`Same accommodation type: ${p1.accommodation}`);
        }
        if (p1.transportation && p2.transportation &&
            this.areInterestsSimilar(p1.transportation, p2.transportation)) {
          score += 1;
          reasons.push(`Same transportation: ${p1.transportation}`);
        }
      }
    }

    return { score: Math.min(score, 3), reasons };
  }

  /**
   * Both new to town - locals who recently moved, great for meeting each other
   */
  private calculateNewToTownCompatibility(user1: User, user2: User) {
    const isNewToTown = (u: User) => {
      if (!u.newToTownUntil) return false;
      const until = u.newToTownUntil instanceof Date ? u.newToTownUntil : new Date(u.newToTownUntil);
      return until > new Date();
    };
    if (isNewToTown(user1) && isNewToTown(user2)) {
      return { score: 2, reasons: ['Both new to town'] };
    }
    return { score: 0, reasons: [] as string[] };
  }

  /**
   * Children ages overlap - when both traveling with kids, similar ages
   */
  private calculateChildrenAgesCompatibility(user1: User, user2: User) {
    if (!user1.travelingWithChildren || !user2.travelingWithChildren) {
      return { score: 0, reasons: [] as string[] };
    }
    const parseAges = (s: string | null | undefined): number[] => {
      if (!s) return [];
      return s.split(/[,;]/).map(a => parseInt(a.trim(), 10)).filter(n => !isNaN(n) && n > 0 && n < 25);
    };
    const ages1 = parseAges(user1.childrenAges);
    const ages2 = parseAges(user2.childrenAges);
    if (ages1.length === 0 || ages2.length === 0) return { score: 0, reasons: [] as string[] };
    const overlap = ages1.some(a1 => ages2.some(a2 => Math.abs(a1 - a2) <= 3));
    if (overlap) {
      return { score: 2, reasons: ['Kids similar ages'] };
    }
    return { score: 0, reasons: [] as string[] };
  }

  /**
   * Business compatibility - specialty, services, target customers overlap
   */
  private calculateBusinessCompatibility(user1: User, user2: User) {
    const getBusinessKeywords = (u: User): string[] => {
      const parts: string[] = [];
      if (u.specialty) parts.push(...this.parseCustomInterests(u.specialty));
      if (u.services) parts.push(...this.parseCustomInterests(u.services));
      if (u.targetCustomers) parts.push(...this.parseCustomInterests(u.targetCustomers));
      if (u.businessType) parts.push(u.businessType.toLowerCase());
      return parts.filter(Boolean);
    };
    const kw1 = getBusinessKeywords(user1);
    const kw2 = getBusinessKeywords(user2);
    if (kw1.length === 0 || kw2.length === 0) return { score: 0, reasons: [] as string[] };
    const overlap = kw1.some(k1 => kw2.some(k2 => this.areInterestsSimilar(k1, k2)));
    if (overlap) {
      return { score: 2, reasons: ['Relevant business match'] };
    }
    return { score: 0, reasons: [] as string[] };
  }

  /**
   * Bio keyword overlap - travel style, interests mentioned in bio
   */
  private calculateBioCompatibility(user1: User, user2: User) {
    const keywords1 = this.extractTravelKeywords(user1.bio || '');
    const keywords2 = this.extractTravelKeywords(user2.bio || '');
    const overlap = keywords1.filter(k => keywords2.includes(k));
    if (overlap.length > 0) {
      return { score: Math.min(overlap.length, 2), reasons: [`Similar bio: ${overlap.slice(0, 2).join(', ')}`] };
    }
    return { score: 0, reasons: [] as string[] };
  }

  /**
   * Get shared secret activities (comma-separated text)
   */
  private getSharedSecretActivities(user1: User, user2: User): string[] {
    const u1 = this.parseCustomInterests(user1.secretActivities);
    const u2 = this.parseCustomInterests(user2.secretActivities);
    return u1.filter(a => u2.some(b => this.areInterestsSimilar(a, b)));
  }

  /**
   * Public method to calculate compatibility between two users
   */
  async calculateCompatibilityBetweenUsers(user1: User, user2: User) {
    try {

      
      // Calculate compatibility without travel plans - focus on interests, activities, events
      const reasons: string[] = [];
      let totalScore = 0;
      const maxScore = 50; // Without travel plans, max is lower
      
      // Interest compatibility (25 points max)
      const interestScore = this.calculateInterestCompatibility(user1, user2);
      totalScore += interestScore.score;
      reasons.push(...interestScore.reasons);
      
      // Activity compatibility (15 points max)
      const activityScore = this.calculateActivityCompatibility(user1, user2);
      totalScore += activityScore.score;
      reasons.push(...activityScore.reasons);
      
      // Event compatibility (10 points max)
      const eventScore = await this.calculateEventCompatibility(user1, user2);
      totalScore += eventScore.score;
      reasons.push(...eventScore.reasons);
      
      // Calculate final percentage
      const finalScore = Math.min(totalScore / maxScore, 1);
      

      
      return {
        score: finalScore,
        level: this.getCompatibilityLevel(finalScore),
        reasons,
        user1: {
          id: user1.id,
          username: user1.username,
          name: user1.name
        },
        user2: {
          id: user2.id,
          username: user2.username,
          name: user2.name
        }
      };
    } catch (error) {
      console.error('Error calculating user compatibility:', error);
      throw error;
    }
  }
}

export const matchingService = new TravelMatchingService();