import { db } from './db';
import { users, businessOffers, events } from '../shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

export interface BusinessRecommendation {
  businessId: number;
  businessName: string;
  businessType: string;
  title: string;
  description: string;
  location: string;
  category: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  validUntil?: Date;
  imageUrl?: string;
  
  // Contextual scoring
  relevanceScore: number;
  contextualFactors: {
    locationMatch: number;        // 0-1 proximity score
    interestMatch: number;        // 0-1 interest alignment
    timeRelevance: number;        // 0-1 time-based relevance
    weatherRelevance: number;     // 0-1 weather appropriateness
    travelContext: number;        // 0-1 travel plan alignment
    socialProof: number;          // 0-1 based on connections
    personalHistory: number;      // 0-1 based on past behavior
  };
  
  // Recommendation reasoning
  recommendationReason: string;
  contextualTags: string[];
}

export interface UserContext {
  userId: number;
  currentLocation: string;
  interests: string[];
  activities: string[];
  isCurrentlyTraveling: boolean;
  travelDestination?: string;
  travelStartDate?: Date;
  travelEndDate?: Date;
  userType: 'traveler' | 'local' | 'business';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  weather?: {
    condition: string;
    temperature: number;
    isRaining: boolean;
  };
}

export class ContextualBusinessRecommendationEngine {
  
  /**
   * Generate personalized business recommendations based on comprehensive user context
   */
  async generateRecommendations(
    context: UserContext, 
    limit: number = 10
  ): Promise<BusinessRecommendation[]> {
    
    console.log(`🎯 CONTEXTUAL RECOMMENDATIONS: Generating ${limit} personalized recommendations for user ${context.userId}`);
    
    // Get all available business offers
    const businessOffers = await this.getAvailableBusinessOffers(context.currentLocation);
    
    // Score each business based on contextual factors
    const scoredRecommendations = await Promise.all(
      businessOffers.map(async (offer) => {
        const contextualFactors = await this.calculateContextualFactors(offer, context);
        const relevanceScore = this.calculateOverallRelevance(contextualFactors);
        
        return {
          ...offer,
          relevanceScore,
          contextualFactors,
          recommendationReason: this.generateRecommendationReason(contextualFactors, context),
          contextualTags: this.generateContextualTags(contextualFactors, context)
        } as BusinessRecommendation;
      })
    );
    
    // Sort by relevance score and return top recommendations
    const topRecommendations = scoredRecommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    console.log(`✅ CONTEXTUAL RECOMMENDATIONS: Generated ${topRecommendations.length} recommendations with average score ${this.calculateAverageScore(topRecommendations)}`);
    
    return topRecommendations;
  }
  
  /**
   * Get available business offers filtered by location
   */
  private async getAvailableBusinessOffers(location: string) {
    try {
      console.log(`🔍 RECOMMENDATIONS: Fetching business offers for location: ${location}`);
      
      // Simplified query to avoid circular reference issues
      const offers = await db
        .select()
        .from(businessOffers)
        .where(
          and(
            eq(businessOffers.isActive, true),
            sql`${businessOffers.city} ILIKE ${`%${location.split(',')[0]}%`}` // Match city name from offers
          )
        )
        .limit(20); // Limit results to prevent overwhelming processing
      
      console.log(`✅ RECOMMENDATIONS: Found ${offers.length} business offers`);
      
      // Map to expected format
      return offers.map(offer => ({
        businessId: offer.businessId,
        businessName: offer.businessName || 'Unknown Business',
        businessType: offer.businessType || 'General',
        title: offer.title,
        description: offer.description,
        location: offer.businessLocation || `${offer.city}, ${offer.state}`,
        category: offer.category,
        originalPrice: offer.originalPrice,
        discountedPrice: offer.discountedPrice,
        discountPercentage: offer.discountPercentage,
        validUntil: offer.validUntil,
        imageUrl: offer.imageUrl,
        isActive: offer.isActive
      }));
      
    } catch (error) {
      console.error('❌ RECOMMENDATIONS: Error fetching business offers:', error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Calculate contextual factors for business-user matching
   */
  private async calculateContextualFactors(
    offer: any, 
    context: UserContext
  ): Promise<BusinessRecommendation['contextualFactors']> {
    
    // 1. Location Match (0-1)
    const locationMatch = this.calculateLocationMatch(offer.location, context);
    
    // 2. Interest Match (0-1)
    const interestMatch = this.calculateInterestMatch(offer, context);
    
    // 3. Time Relevance (0-1)
    const timeRelevance = this.calculateTimeRelevance(offer, context);
    
    // 4. Weather Relevance (0-1)
    const weatherRelevance = this.calculateWeatherRelevance(offer, context);
    
    // 5. Travel Context (0-1)
    const travelContext = this.calculateTravelContext(offer, context);
    
    // 6. Social Proof (0-1)
    const socialProof = await this.calculateSocialProof(offer, context);
    
    // 7. Personal History (0-1)
    const personalHistory = await this.calculatePersonalHistory(offer, context);
    
    return {
      locationMatch,
      interestMatch,
      timeRelevance,
      weatherRelevance,
      travelContext,
      socialProof,
      personalHistory
    };
  }
  
  /**
   * Calculate location proximity match
   */
  private calculateLocationMatch(offerLocation: string, context: UserContext): number {
    const userLocation = context.currentLocation.toLowerCase();
    const businessLocation = offerLocation.toLowerCase();
    
    // Exact city match
    if (businessLocation.includes(userLocation.split(',')[0])) {
      return 1.0;
    }
    
    // State/region match
    if (userLocation.split(',').length > 1 && 
        businessLocation.includes(userLocation.split(',')[1])) {
      return 0.7;
    }
    
    // Country match
    if (userLocation.split(',').length > 2 && 
        businessLocation.includes(userLocation.split(',')[2])) {
      return 0.4;
    }
    
    return 0.1; // Default minimal score
  }
  
  /**
   * Calculate interest alignment score
   */
  private calculateInterestMatch(offer: any, context: UserContext): number {
    const relevantInterests = [
      ...context.interests,
      ...context.activities
    ].map(i => i.toLowerCase());
    
    let matchScore = 0;
    
    // Category-based matching
    const categoryKeywords = this.getCategoryKeywords(offer.category);
    categoryKeywords.forEach(keyword => {
      if (relevantInterests.some(interest => 
          interest.includes(keyword) || keyword.includes(interest))) {
        matchScore += 0.3;
      }
    });
    
    // Title and description keyword matching
    const offerText = `${offer.title} ${offer.description}`.toLowerCase();
    relevantInterests.forEach(interest => {
      if (offerText.includes(interest)) {
        matchScore += 0.2;
      }
    });
    
    return Math.min(matchScore, 1.0);
  }
  
  /**
   * Calculate time-based relevance
   */
  private calculateTimeRelevance(offer: any, context: UserContext): number {
    let score = 0.5; // Base score
    
    // Time of day relevance
    const timeBoosts = {
      'morning': ['coffee', 'breakfast', 'brunch', 'morning runs'],
      'afternoon': ['lunch', 'sightseeing', 'museums', 'shopping'],
      'evening': ['dinner', 'happy hour', 'entertainment'],
      'night': ['nightlife', 'bars', 'clubs', 'late night']
    };
    
    const relevantKeywords = timeBoosts[context.timeOfDay] || [];
    const offerText = `${offer.title} ${offer.description} ${offer.category}`.toLowerCase();
    
    relevantKeywords.forEach(keyword => {
      if (offerText.includes(keyword)) {
        score += 0.2;
      }
    });
    
    // Weekend vs weekday relevance
    const isWeekend = ['Saturday', 'Sunday'].includes(context.dayOfWeek);
    if (isWeekend && offerText.includes('weekend')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate weather appropriateness
   */
  private calculateWeatherRelevance(offer: any, context: UserContext): number {
    if (!context.weather) return 0.5;
    
    let score = 0.5;
    const offerText = `${offer.title} ${offer.description} ${offer.category}`.toLowerCase();
    
    // Rain-based recommendations
    if (context.weather.isRaining) {
      const indoorKeywords = ['indoor', 'museum', 'shopping', 'restaurant', 'cafe', 'cinema'];
      indoorKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.2;
      });
    } else {
      const outdoorKeywords = ['outdoor', 'beach', 'hiking', 'park', 'walking', 'tours'];
      outdoorKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.2;
      });
    }
    
    // Temperature-based recommendations
    if (context.weather.temperature > 25) { // Hot weather
      const hotWeatherKeywords = ['ice cream', 'swimming', 'air conditioning', 'cold drinks'];
      hotWeatherKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.15;
      });
    } else if (context.weather.temperature < 10) { // Cold weather
      const coldWeatherKeywords = ['hot drinks', 'warm food', 'indoor', 'heating'];
      coldWeatherKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.15;
      });
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate travel context relevance
   */
  private calculateTravelContext(offer: any, context: UserContext): number {
    let score = 0.5;
    
    if (context.isCurrentlyTraveling) {
      // Boost travel-relevant categories
      const travelKeywords = [
        'tourist', 'visitor', 'sightseeing', 'local experience', 
        'authentic', 'traditional', 'must-see', 'popular'
      ];
      
      const offerText = `${offer.title} ${offer.description} ${offer.category}`.toLowerCase();
      travelKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.15;
      });
      
      // Travel duration consideration
      if (context.travelStartDate && context.travelEndDate) {
        const tripLength = (context.travelEndDate.getTime() - context.travelStartDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (tripLength <= 3) { // Short trip - prioritize must-sees
          if (offerText.includes('must-see') || offerText.includes('essential')) {
            score += 0.2;
          }
        } else if (tripLength > 7) { // Long trip - diverse experiences
          score += 0.1; // General boost for longer stays
        }
      }
    } else {
      // Local user - boost local/hidden gems
      const localKeywords = ['local', 'hidden gem', 'off the beaten path', 'locals only'];
      const offerText = `${offer.title} ${offer.description} ${offer.category}`.toLowerCase();
      localKeywords.forEach(keyword => {
        if (offerText.includes(keyword)) score += 0.2;
      });
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate social proof based on connections
   */
  private async calculateSocialProof(offer: any, context: UserContext): Promise<number> {
    // Placeholder for social proof calculation
    // In real implementation, would check:
    // - Friends who visited this business
    // - Reviews from connections
    // - Similar users' preferences
    
    return 0.5; // Default neutral score
  }
  
  /**
   * Calculate personal history relevance
   */
  private async calculatePersonalHistory(offer: any, context: UserContext): Promise<number> {
    // Placeholder for personal history calculation
    // In real implementation, would check:
    // - Past business interactions
    // - Similar categories visited
    // - Feedback patterns
    
    return 0.5; // Default neutral score
  }
  
  /**
   * Calculate overall relevance score from contextual factors
   */
  private calculateOverallRelevance(factors: BusinessRecommendation['contextualFactors']): number {
    // Weighted average of all factors
    const weights = {
      locationMatch: 0.25,      // 25% - Location is crucial
      interestMatch: 0.20,      // 20% - Interest alignment important  
      timeRelevance: 0.15,      // 15% - Time context matters
      weatherRelevance: 0.10,   // 10% - Weather consideration
      travelContext: 0.15,      // 15% - Travel vs local context
      socialProof: 0.10,        // 10% - Social validation
      personalHistory: 0.05     // 5% - Past behavior
    };
    
    const weightedScore = 
      factors.locationMatch * weights.locationMatch +
      factors.interestMatch * weights.interestMatch +
      factors.timeRelevance * weights.timeRelevance +
      factors.weatherRelevance * weights.weatherRelevance +
      factors.travelContext * weights.travelContext +
      factors.socialProof * weights.socialProof +
      factors.personalHistory * weights.personalHistory;
    
    return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Generate human-readable recommendation reason
   */
  private generateRecommendationReason(
    factors: BusinessRecommendation['contextualFactors'], 
    context: UserContext
  ): string {
    const reasons = [];
    
    if (factors.locationMatch > 0.8) {
      reasons.push("perfect location match");
    } else if (factors.locationMatch > 0.6) {
      reasons.push("great location");
    }
    
    if (factors.interestMatch > 0.7) {
      reasons.push("matches your interests perfectly");
    } else if (factors.interestMatch > 0.5) {
      reasons.push("aligns with your preferences");
    }
    
    if (factors.timeRelevance > 0.7) {
      reasons.push(`perfect for ${context.timeOfDay} time`);
    }
    
    if (factors.weatherRelevance > 0.7 && context.weather) {
      if (context.weather.isRaining) {
        reasons.push("great indoor option for rainy weather");
      } else {
        reasons.push("perfect for today's weather");
      }
    }
    
    if (factors.travelContext > 0.7) {
      if (context.isCurrentlyTraveling) {
        reasons.push("ideal for travelers");
      } else {
        reasons.push("perfect local experience");
      }
    }
    
    return reasons.length > 0 
      ? `Recommended because: ${reasons.join(', ')}`
      : "Good match for your profile";
  }
  
  /**
   * Generate contextual tags for the recommendation
   */
  private generateContextualTags(
    factors: BusinessRecommendation['contextualFactors'], 
    context: UserContext
  ): string[] {
    const tags = [];
    
    if (factors.locationMatch > 0.8) tags.push("📍 Perfect Location");
    if (factors.interestMatch > 0.7) tags.push("❤️ Interest Match");
    if (factors.timeRelevance > 0.7) tags.push("⏰ Perfect Timing");
    if (factors.weatherRelevance > 0.7) tags.push("🌤️ Weather Appropriate");
    if (factors.travelContext > 0.7) {
      tags.push(context.isCurrentlyTraveling ? "✈️ Traveler Friendly" : "🏠 Local Favorite");
    }
    if (factors.socialProof > 0.7) tags.push("👥 Socially Validated");
    
    return tags;
  }
  
  /**
   * Get category-specific keywords for matching
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'food': ['restaurant', 'dining', 'cuisine', 'meal', 'food', 'eat'],
      'entertainment': ['show', 'music', 'performance', 'fun', 'entertainment'],
      'shopping': ['shop', 'store', 'buy', 'retail', 'market'],
      'tourism': ['tour', 'sightseeing', 'attraction', 'visit', 'explore'],
      'fitness': ['workout', 'exercise', 'gym', 'fitness', 'health'],
      'nightlife': ['bar', 'club', 'drink', 'nightlife', 'party'],
      'culture': ['art', 'museum', 'culture', 'history', 'gallery'],
      'nature': ['park', 'outdoor', 'nature', 'hiking', 'beach']
    };
    
    return categoryMap[category.toLowerCase()] || [category.toLowerCase()];
  }
  
  /**
   * Calculate average recommendation score
   */
  private calculateAverageScore(recommendations: BusinessRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const totalScore = recommendations.reduce((sum, rec) => sum + rec.relevanceScore, 0);
    return Math.round((totalScore / recommendations.length) * 100) / 100;
  }
}

// Export singleton instance
export const contextualBusinessRecommendationEngine = new ContextualBusinessRecommendationEngine();