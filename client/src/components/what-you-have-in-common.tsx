import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MapPin, Calendar, Plane, Shield, User } from "lucide-react";

interface WhatYouHaveInCommonProps {
  currentUserId: number;
  otherUserId: number;
}

interface MatchData {
  userId: number;
  score: number;
  reasons: string[];
  compatibilityLevel: 'high' | 'medium' | 'low';
  sharedInterests: string[];
  sharedActivities?: string[];
  sharedEvents?: string[];
  sharedCityActivities?: string[];
  locationOverlap: boolean;
  dateOverlap: boolean;
  userTypeCompatibility: boolean;
  sharedSexualPreferences?: string[];
  bothVeterans?: boolean;
  bothActiveDuty?: boolean;
  sharedLanguages?: string[];
  sharedCountries?: string[];
  otherCommonalities?: string[];
}

interface User {
  id: number;
  username: string;
  interests?: string[];
  activities?: string[];
  events?: string[];
  localActivities?: string[];
  localEvents?: string[];
  sexualPreference?: string[];
  isVeteran?: boolean;
  isActiveDuty?: boolean;
  languagesSpoken?: string[];
  countriesVisited?: string[];
  hometownCity?: string;
  age?: number;
  gender?: string;
  travelStyle?: string[];
  travelWhy?: string;
  travelHow?: string;
  travelBudget?: string;
  travelGroup?: string;
  travelWhat?: string[];
}

interface SharedTripData {
  destination: string;
  dateOverlap: boolean;
  startDate?: string;
  endDate?: string;
}

interface TravelPlan {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  userId: number;
}

export function WhatYouHaveInCommon({ currentUserId, otherUserId }: WhatYouHaveInCommonProps) {
  // Fetch both users' data to calculate comprehensive commonalities
  const { data: currentUser } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`]
  });

  const { data: otherUser } = useQuery<User>({
    queryKey: [`/api/users/${otherUserId}`]
  });

  // Fetch their city interests
  const { data: currentUserCityInterests = [] } = useQuery({
    queryKey: [`/api/user-city-interests/${currentUserId}`]
  });

  const { data: otherUserCityInterests = [] } = useQuery({
    queryKey: [`/api/user-city-interests/${otherUserId}`]
  });

  // Fetch their travel plans for date overlap analysis
  const { data: currentUserTravelPlans = [] } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/user/${currentUserId}`]
  });

  const { data: otherUserTravelPlans = [] } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/user/${otherUserId}`]
  });

  // Fetch direct compatibility data from the API (consistent with discover page)
  const { data: compatibilityData, isLoading } = useQuery<{
    totalCommonalities: number;
    commonalities: string[];
    sharedInterests: number;
    sharedActivities: number;
    sameCity: boolean;
  }>({
    queryKey: [`/api/compatibility/${currentUserId}/${otherUserId}`],
    enabled: !!currentUserId && !!otherUserId && currentUserId !== otherUserId
  });

  // Fetch matching data from the API (fallback)
  const { data: allMatches, isLoading: matchesLoading } = useQuery<MatchData[]>({
    queryKey: [`/api/users/${currentUserId}/matches`]
  });

  // Find the match data for the specific user
  const matchData = allMatches?.find(match => match.userId === otherUserId);

  // Calculate comprehensive commonalities
  const calculateCommonalities = () => {
    if (!currentUser || !otherUser) return null;

    const commonalities: {
      sharedInterests: string[];
      sharedActivities: string[];
      sharedEvents: string[];
      sharedCityActivities: string[];
      sharedSexualPreferences: string[];
      bothVeterans: boolean;
      bothActiveDuty: boolean;
      sharedLanguages: string[];
      sharedCountries: string[];
      sharedTravelDestinations: string[];
      overlappingTravelDates: Array<{destination: string; overlap: string}>;
      sharedTravelIntent: string[];
      sameHometown: boolean;
      sameAge: boolean;
      sameGender: boolean;
      sameTravelStyle: boolean;
      otherCommonalities: string[];
      totalCount: number;
      compatibilityPercentage: number;
    } = {
      sharedInterests: [],
      sharedActivities: [],
      sharedEvents: [],
      sharedCityActivities: [],
      sharedSexualPreferences: [],
      bothVeterans: false,
      bothActiveDuty: false,
      sharedLanguages: [],
      sharedCountries: [],
      sharedTravelDestinations: [],
      overlappingTravelDates: [],
      sharedTravelIntent: [],
      sameHometown: false,
      sameAge: false,
      sameGender: false,
      sameTravelStyle: false,
      otherCommonalities: [],
      totalCount: 0,
      compatibilityPercentage: 0
    };

    // Shared interests
    if (currentUser.interests && otherUser.interests) {
      commonalities.sharedInterests = currentUser.interests.filter(interest =>
        otherUser.interests?.includes(interest)
      );
    }

    // Shared activities
    if (currentUser.activities && otherUser.activities) {
      commonalities.sharedActivities = currentUser.activities.filter(activity =>
        otherUser.activities?.includes(activity)
      );
    }

    // Shared events
    if (currentUser.events && otherUser.events) {
      commonalities.sharedEvents = currentUser.events.filter(event =>
        otherUser.events?.includes(event)
      );
    }

    // Shared city activities
    const currentCityActivities = Array.isArray(currentUserCityInterests) ? 
      currentUserCityInterests.map((interest: any) => interest.activityName) : [];
    const otherCityActivities = Array.isArray(otherUserCityInterests) ? 
      otherUserCityInterests.map((interest: any) => interest.activityName) : [];
    commonalities.sharedCityActivities = currentCityActivities.filter(activity =>
      otherCityActivities.includes(activity)
    );

    // Shared sexual preferences
    if (currentUser.sexualPreference && otherUser.sexualPreference) {
      commonalities.sharedSexualPreferences = currentUser.sexualPreference.filter(pref =>
        otherUser.sexualPreference?.includes(pref)
      );
    }

    // Military status
    commonalities.bothVeterans = !!(currentUser.isVeteran && otherUser.isVeteran);
    commonalities.bothActiveDuty = !!(currentUser.isActiveDuty && otherUser.isActiveDuty);

    // Shared languages
    if (currentUser.languagesSpoken && otherUser.languagesSpoken) {
      commonalities.sharedLanguages = currentUser.languagesSpoken.filter(lang =>
        otherUser.languagesSpoken?.includes(lang)
      );
    }

    // Shared countries
    if (currentUser.countriesVisited && otherUser.countriesVisited) {
      commonalities.sharedCountries = currentUser.countriesVisited.filter(country =>
        otherUser.countriesVisited?.includes(country)
      );
    }

    // Travel destination matching
    if (currentUserTravelPlans && otherUserTravelPlans) {
      const currentDestinations = currentUserTravelPlans.map(plan => plan.destination);
      const otherDestinations = otherUserTravelPlans.map(plan => plan.destination);
      commonalities.sharedTravelDestinations = currentDestinations.filter(dest =>
        otherDestinations.includes(dest)
      );

      // Check for overlapping travel dates
      currentUserTravelPlans.forEach(currentPlan => {
        otherUserTravelPlans.forEach(otherPlan => {
          if (currentPlan.destination === otherPlan.destination) {
            const currentStart = new Date(currentPlan.startDate);
            const currentEnd = new Date(currentPlan.endDate);
            const otherStart = new Date(otherPlan.startDate);
            const otherEnd = new Date(otherPlan.endDate);

            // Check for date overlap
            if (currentStart <= otherEnd && currentEnd >= otherStart) {
              const overlapStart = new Date(Math.max(currentStart.getTime(), otherStart.getTime()));
              const overlapEnd = new Date(Math.min(currentEnd.getTime(), otherEnd.getTime()));
              
              commonalities.overlappingTravelDates.push({
                destination: currentPlan.destination,
                overlap: `${overlapStart.toLocaleDateString()} - ${overlapEnd.toLocaleDateString()}`
              });
            }
          }
        });
      });
    }

    // Personal compatibility checks
    commonalities.sameHometown = !!(currentUser.hometownCity && otherUser.hometownCity && 
      currentUser.hometownCity === otherUser.hometownCity);
    
    commonalities.sameAge = !!(currentUser.age && otherUser.age && 
      Math.abs((currentUser.age as number) - (otherUser.age as number)) <= 2);
    
    commonalities.sameGender = !!(currentUser.gender && otherUser.gender && 
      currentUser.gender === otherUser.gender);
    
    commonalities.sameTravelStyle = !!(currentUser.travelStyle && otherUser.travelStyle && 
      Array.isArray(currentUser.travelStyle) && Array.isArray(otherUser.travelStyle) &&
      currentUser.travelStyle.some(style => otherUser.travelStyle?.includes(style)));

    // Travel Intent Quiz compatibility
    const travelIntentCommonalities = [];
    
    // Travel Why - handle both field name variants
    const currentTravelWhy = (currentUser as any).travelWhy || (currentUser as any).travel_why;
    const otherTravelWhy = (otherUser as any).travelWhy || (otherUser as any).travel_why;
    
    if (currentTravelWhy && otherTravelWhy && currentTravelWhy === otherTravelWhy) {
      const whyNames = {
        adventure: 'Adventure & Discovery',
        connection: 'Meeting People',
        culture: 'Cultural Immersion',
        relaxation: 'Rest & Recharge'
      };
      travelIntentCommonalities.push(whyNames[currentTravelWhy] || currentTravelWhy);
    }

    // Travel How (style) - handle both field name variants
    const currentTravelHow = (currentUser as any).travelHow || (currentUser as any).travel_how;
    const otherTravelHow = (otherUser as any).travelHow || (otherUser as any).travel_how;
    
    if (currentTravelHow && otherTravelHow && currentTravelHow === otherTravelHow) {
      const styleNames = {
        planner: 'Detailed Planning',
        spontaneous: 'Spontaneous Exploration', 
        social: 'Social Activities',
        independent: 'Independent Exploration'
      };
      travelIntentCommonalities.push(styleNames[currentTravelHow] || currentTravelHow);
    }

    // Travel Budget - handle both field name variants  
    const currentTravelBudget = (currentUser as any).travelBudget || (currentUser as any).travel_budget;
    const otherTravelBudget = (otherUser as any).travelBudget || (otherUser as any).travel_budget;
    
    if (currentTravelBudget && otherTravelBudget && currentTravelBudget === otherTravelBudget) {
      const budgetNames = {
        budget: 'Budget-conscious',
        moderate: 'Moderate budget',
        premium: 'Premium budget'
      };
      travelIntentCommonalities.push(budgetNames[currentTravelBudget] || currentTravelBudget);
    }

    // Travel Group - handle both field name variants
    const currentTravelGroup = (currentUser as any).travelGroup || (currentUser as any).travel_group;
    const otherTravelGroup = (otherUser as any).travelGroup || (otherUser as any).travel_group;
    
    if (currentTravelGroup && otherTravelGroup && currentTravelGroup === otherTravelGroup) {
      const groupNames = {
        solo: 'Solo travelers',
        couple: 'Couple travel',
        friends: 'Friends group',
        family: 'Family travel'
      };
      travelIntentCommonalities.push(groupNames[currentTravelGroup] || currentTravelGroup);
    }

    // Travel What (interests from quiz)
    const currentTravelInterests = (currentUser as any).travelInterests || (currentUser as any).travel_interests;
    const otherTravelInterests = (otherUser as any).travelInterests || (otherUser as any).travel_interests;
    
    if (currentTravelInterests && otherTravelInterests) {
      const currentInterests = Array.isArray(currentTravelInterests) ? currentTravelInterests : [];
      const otherInterests = Array.isArray(otherTravelInterests) ? otherTravelInterests : [];
      
      const sharedTravelInterests = currentInterests.filter(interest => 
        otherInterests.includes(interest)
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
        travelIntentCommonalities.push(interestNames[interest] || interest);
      });
    }

    commonalities.sharedTravelIntent = travelIntentCommonalities;

    // Other commonalities
    if (commonalities.bothVeterans) {
      commonalities.otherCommonalities.push("Both Veterans");
    }
    if (commonalities.bothActiveDuty) {
      commonalities.otherCommonalities.push("Both Active Duty");
    }
    if (commonalities.sameHometown) {
      commonalities.otherCommonalities.push(`Both from ${currentUser.hometownCity}`);
    }
    if (commonalities.sameAge) {
      commonalities.otherCommonalities.push("Similar age");
    }
    if (commonalities.sameGender) {
      commonalities.otherCommonalities.push("Same gender");
    }
    if (commonalities.sameTravelStyle && currentUser.travelStyle && Array.isArray(currentUser.travelStyle)) {
      const commonStyles = currentUser.travelStyle.filter(style => 
        Array.isArray(otherUser.travelStyle) && otherUser.travelStyle.includes(style));
      if (commonStyles.length > 0) {
        commonalities.otherCommonalities.push(`Both love ${commonStyles[0]} travel`);
      }
    }

    // Calculate total count
    commonalities.totalCount = 
      commonalities.sharedInterests.length +
      commonalities.sharedActivities.length +
      commonalities.sharedEvents.length +
      commonalities.sharedCityActivities.length +
      commonalities.sharedSexualPreferences.length +
      commonalities.sharedLanguages.length +
      commonalities.sharedCountries.length +
      commonalities.sharedTravelDestinations.length +
      commonalities.overlappingTravelDates.length +
      commonalities.sharedTravelIntent.length +
      commonalities.otherCommonalities.length;

    // Calculate ASYMMETRIC compatibility percentage based on CURRENT USER'S selections
    // This ensures if you select 5 interests and they all match, you see 100% compatibility
    // But if other user selected 50 interests and only 5 match, they see 10% compatibility
    const currentUserInterests = Math.max((currentUser.interests?.length || 0), 1);
    const currentUserActivities = Math.max((currentUser.activities?.length || 0), 1);
    const currentUserEvents = Math.max((currentUser.events?.length || 0), 1);
    const currentUserCityActivities = Math.max(currentCityActivities.length, 1);

    // Weighted compatibility score calculation (from current user's perspective)
    const interestScore = (commonalities.sharedInterests.length / currentUserInterests) * 30;
    const activityScore = (commonalities.sharedActivities.length / currentUserActivities) * 25;
    const eventScore = (commonalities.sharedEvents.length / currentUserEvents) * 20;
    const cityActivityScore = (commonalities.sharedCityActivities.length / currentUserCityActivities) * 15;
    const personalScore = ((commonalities.sameHometown ? 2 : 0) + (commonalities.sameAge ? 2 : 0) + (commonalities.sameGender ? 1 : 0) + (commonalities.sameTravelStyle ? 2 : 0) + (commonalities.bothVeterans ? 1 : 0) + (commonalities.bothActiveDuty ? 1 : 0)) / 9 * 10;

    commonalities.compatibilityPercentage = Math.round(interestScore + activityScore + eventScore + cityActivityScore + personalScore);

    return commonalities;
  };

  const commonalities = calculateCommonalities();

  // Fetch travel plans for both users to calculate shared trips
  const { data: currentUserPlans = [] } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/${currentUserId}`]
  });

  const { data: otherUserPlans = [] } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans/${otherUserId}`]
  });

  // Calculate shared trips based on overlapping destinations and dates
  const getSharedTrips = (): SharedTripData[] => {
    if (!currentUserPlans || !otherUserPlans) return [];
    
    const sharedTrips: SharedTripData[] = [];
    
    for (const currentPlan of currentUserPlans) {
      for (const otherPlan of otherUserPlans) {
        // Check if destinations are similar
        if (currentPlan.destination && otherPlan.destination &&
            currentPlan.destination.toLowerCase().includes(otherPlan.destination.toLowerCase()) ||
            otherPlan.destination.toLowerCase().includes(currentPlan.destination.toLowerCase())) {
          
          // Check for date overlap
          const currentStart = new Date(currentPlan.startDate);
          const currentEnd = new Date(currentPlan.endDate);
          const otherStart = new Date(otherPlan.startDate);
          const otherEnd = new Date(otherPlan.endDate);
          
          const hasDateOverlap = currentStart <= otherEnd && otherStart <= currentEnd;
          
          sharedTrips.push({
            destination: currentPlan.destination,
            dateOverlap: hasDateOverlap,
            startDate: hasDateOverlap ? Math.max(currentStart.getTime(), otherStart.getTime()).toString() : undefined,
            endDate: hasDateOverlap ? Math.min(currentEnd.getTime(), otherEnd.getTime()).toString() : undefined
          });
        }
      }
    }
    
    return sharedTrips;
  };

  const sharedTrips = getSharedTrips();

  if (isLoading || !currentUser || !otherUser) {
    return (
      <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 dark:border-orange-600 dark:from-orange-900/20 dark:via-blue-900/20 dark:to-orange-900/30 shadow-lg ring-2 ring-orange-200 dark:ring-orange-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-black dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">
            Discover your shared interests and travel experiences
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading compatibility data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!commonalities || commonalities.totalCount === 0) {
    return (
      <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 dark:border-orange-600 dark:from-orange-900/20 dark:via-blue-900/20 dark:to-orange-900/30 shadow-lg ring-2 ring-orange-200 dark:ring-orange-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-black dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">
            Discover your shared interests and travel experiences
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 text-sm italic">
            No commonalities found yet. You might discover shared interests as you both update your profiles!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 dark:border-orange-600 dark:from-orange-900/20 dark:via-blue-900/20 dark:to-orange-900/30 shadow-lg hover:shadow-xl transition-all duration-300 ring-2 ring-orange-200 dark:ring-orange-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-black dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white shadow-md border-green-600 text-lg px-3 py-1 font-bold">
              <span style={{ color: 'white !important' }}>{commonalities.compatibilityPercentage}% Match</span>
            </Badge>
            <Badge className="bg-blue-500 text-white shadow-md border-blue-600 text-sm px-2 py-1 font-medium">
              <span style={{ color: 'white !important' }}>
                {compatibilityData?.totalCommonalities ?? commonalities.totalCount} Things
              </span>
            </Badge>
          </div>
        </div>
        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">
          All your shared interests, activities, and experiences
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shared Interests */}
        {commonalities.sharedInterests.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <Heart className="w-5 h-5 text-red-500" />
              Shared Interests ({commonalities.sharedInterests.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedInterests.map((interest, index) => (
                <div key={`shared-interest-${interest}-${index}`} className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Activities */}
        {commonalities.sharedActivities.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:bg-gradient-to-r dark:from-green-900/30 dark:to-teal-900/30 rounded-lg p-3 border border-green-200 dark:border-green-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <Users className="w-5 h-5 text-green-500" />
              Shared Activities ({commonalities.sharedActivities.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedActivities.map((activity, index) => (
                <div key={`shared-activity-${activity}-${index}`} className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5">
                  {activity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared City Activities */}
        {commonalities.sharedCityActivities.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:bg-gradient-to-r dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <MapPin className="w-5 h-5 text-orange-500" />
              Things You Both Want to Do ({commonalities.sharedCityActivities.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedCityActivities.map((activity, index) => (
                <Badge key={`shared-city-activity-${activity}-${index}`} className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700 font-medium">
                  ✓ {activity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Shared Events */}
        {commonalities.sharedEvents.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <Calendar className="w-5 h-5 text-purple-500" />
              Shared Events ({commonalities.sharedEvents.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedEvents.map((event, index) => (
                <div key={`shared-event-${event}-${index}`} className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1.5">
                  {event}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Travel Intent */}
        {commonalities.sharedTravelIntent.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:bg-gradient-to-r dark:from-indigo-900/30 dark:to-violet-900/30 rounded-lg p-3 border border-indigo-200 dark:border-indigo-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Shared Travel Style ({commonalities.sharedTravelIntent.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedTravelIntent.map((intent, index) => (
                <Badge key={`shared-intent-${intent}-${index}`} className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700 font-medium">
                  ✨ {intent}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Shared Travel Destinations */}
        {commonalities.sharedTravelDestinations.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-blue-900/30 rounded-lg p-3 border border-cyan-200 dark:border-cyan-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <MapPin className="w-5 h-5 text-cyan-500" />
              Shared Travel Destinations ({commonalities.sharedTravelDestinations.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {commonalities.sharedTravelDestinations.map((destination, index) => (
                <Badge key={`shared-destination-${destination}-${index}`} className="bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700 font-medium">
                  ✈️ {destination}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Overlapping Travel Dates */}
        {commonalities.overlappingTravelDates.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:bg-gradient-to-r dark:from-red-900/30 dark:to-orange-900/30 rounded-lg p-3 border border-red-200 dark:border-red-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <Calendar className="w-5 h-5 text-red-500" />
              Overlapping Travel Dates ({commonalities.overlappingTravelDates.length})
            </h5>
            <div className="space-y-2">
              {commonalities.overlappingTravelDates.map((overlap, index) => (
                <div key={`overlap-${index}`} className="bg-red-100 dark:bg-red-900/50 rounded p-2">
                  <div className="font-medium text-red-800 dark:text-red-200">{overlap.destination}</div>
                  <div className="text-sm text-red-600 dark:text-red-300">📅 {overlap.overlap}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Things in Common - Combined Section */}
        {(commonalities.sharedSexualPreferences.length > 0 || 
          commonalities.sharedCountries.length > 0 || 
          commonalities.sharedLanguages.length > 0 || 
          commonalities.otherCommonalities.length > 0) && (
          <div className="bg-gradient-to-r from-gray-700 to-slate-700 dark:bg-gradient-to-r dark:from-gray-800 dark:to-slate-800 rounded-lg p-3 border border-gray-500 dark:border-gray-600">
            <h5 className="font-bold text-white mb-3 flex items-center gap-1 text-base">
              <User className="w-5 h-5 text-gray-300" />
              Other Things in Common ({commonalities.sharedSexualPreferences.length + commonalities.sharedCountries.length + commonalities.sharedLanguages.length + commonalities.otherCommonalities.length})
            </h5>
            <div className="space-y-3">
              {/* Sexual Preferences */}
              {commonalities.sharedSexualPreferences.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-white mb-2">Sexual Preferences</h6>
                  <div className="flex flex-wrap gap-2">
                    {commonalities.sharedSexualPreferences.map((preference, index) => (
                      <Badge key={`shared-preference-${preference}-${index}`} className="bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-medium">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Countries Visited */}
              {commonalities.sharedCountries.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-white mb-2">Countries You've Both Visited</h6>
                  <div className="flex flex-wrap gap-2">
                    {commonalities.sharedCountries.map((country, index) => (
                      <Badge key={`shared-country-${country}-${index}`} className="bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-medium">
                        🌍 {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Languages */}
              {commonalities.sharedLanguages.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-white mb-2">Shared Languages</h6>
                  <div className="flex flex-wrap gap-2">
                    {commonalities.sharedLanguages.map((language, index) => (
                      <Badge key={`shared-language-${language}-${index}`} className="bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-medium">
                        💬 {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Military/Other Status */}
              {commonalities.otherCommonalities.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-white mb-2">Other Things In Common</h6>
                  <div className="flex flex-wrap gap-2">
                    {commonalities.otherCommonalities.map((commonality, index) => (
                      <Badge key={`other-commonality-${commonality}-${index}`} className="bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-medium">
                        🎖️ {commonality}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Shared Trips */}
        {sharedTrips.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-600">
            <h5 className="font-bold text-black dark:text-white mb-3 flex items-center gap-1 text-base">
              <Plane className="w-5 h-5 text-emerald-500" />
              Shared Trips ({sharedTrips.length})
            </h5>
            <div className="space-y-2">
              {sharedTrips.map((trip, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-lg p-3 border border-blue-300 dark:border-blue-600">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-300">{trip.destination}</span>
                    {trip.dateOverlap && (
                      <Badge className="bg-green-500 text-white border-green-600 shadow-md font-medium">
                        Overlapping Dates
                      </Badge>
                    )}
                  </div>
                  {trip.dateOverlap && trip.startDate && trip.endDate && (
                    <p className="text-sm text-black dark:text-white mt-1 font-medium">
                      Overlap: {new Date(parseInt(trip.startDate)).toLocaleDateString()} - {new Date(parseInt(trip.endDate)).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Match Data Display (fallback) */}
        {matchData && matchData.locationOverlap && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
            <h5 className="font-bold text-black dark:text-white mb-2 flex items-center gap-1 text-base">
              <MapPin className="w-5 h-5 text-blue-500" />
              Location Compatibility
            </h5>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 font-medium">
              Similar destinations planned
            </Badge>
          </div>
        )}

        {/* Date Compatibility */}
        {matchData && matchData.dateOverlap && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:bg-gradient-to-r dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
            <h5 className="font-bold text-black dark:text-white mb-2 flex items-center gap-1 text-base">
              <Calendar className="w-5 h-5 text-purple-500" />
              Travel Date Compatibility
            </h5>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 font-medium">
              Overlapping travel dates
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}