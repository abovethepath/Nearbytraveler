import { storage } from "./storage";

interface ChatroomRecommendation {
  chatroomId: number;
  chatroomName: string;
  city: string;
  score: number;
  reasoning: string;
  category: 'hometown' | 'travel_destination' | 'interest_based' | 'activity_based';
}

export class ChatroomRecommendationEngine {
  /**
   * Check if user is currently traveling based on travel dates
   */
  private getCurrentTravelDestination(user: any): string | null {
    if (!user) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user has active travel plans
    if (user.travelStartDate && user.travelEndDate && user.travelDestination) {
      const startDate = new Date(user.travelStartDate);
      const endDate = new Date(user.travelEndDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      if (today >= startDate && today <= endDate) {
        return user.travelDestination;
      }
    }
    
    return null;
  }

  /**
   * Generate personalized chatroom recommendations for a user
   */
  async generateRecommendations(userId: number): Promise<ChatroomRecommendation[]> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return [];

      const travelPlans = await storage.getUserTravelPlans(userId);
      
      // Check if user is currently traveling
      const currentTravelDestination = this.getCurrentTravelDestination(user);
      
      // Get all relevant cities with priority
      const cities = new Set<string>();
      const priorityCities = new Set<string>();
      
      // Add hometown
      if (user.hometownCity) {
        cities.add(user.hometownCity);
        if (!currentTravelDestination) {
          priorityCities.add(user.hometownCity); // Prioritize hometown when not traveling
        }
      }
      
      // Add current travel destination with highest priority
      if (currentTravelDestination) {
        const currentCity = currentTravelDestination.split(',')[0].trim();
        cities.add(currentCity);
        priorityCities.add(currentCity);
      }
      
      // Add other travel destinations
      travelPlans.forEach(plan => {
        if (plan.destination) {
          const cityName = plan.destination.split(',')[0].trim();
          cities.add(cityName);
        }
      });

      // Get chatrooms from all relevant cities
      const allChatrooms: any[] = [];
      for (const city of cities) {
        try {
          const cityChat = await storage.getCityChatrooms(city, undefined, undefined, userId);
          allChatrooms.push(...cityChat);
        } catch (error) {
          console.error(`Error fetching chatrooms for ${city}:`, error);
        }
      }

      // Generate recommendations with location-aware scoring
      const recommendations: ChatroomRecommendation[] = [];
      
      for (const chatroom of allChatrooms) {
        let score = 10; // Base score
        let reasoning = 'Active local community chatroom';
        let category: 'hometown' | 'travel_destination' | 'interest_based' | 'activity_based' = 'interest_based';

        // Boost score for current travel destination
        if (currentTravelDestination && chatroom.city === currentTravelDestination.split(',')[0].trim()) {
          score += 50;
          reasoning = `High priority - you're currently traveling to ${currentTravelDestination}`;
          category = 'travel_destination';
        }
        // Boost score for hometown when not traveling
        else if (!currentTravelDestination && chatroom.city === user.hometownCity) {
          score += 30;
          reasoning = `Hometown community - connect with locals in ${user.hometownCity}`;
          category = 'hometown';
        }
        // Medium boost for planned travel destinations
        else if (travelPlans.some(plan => plan.destination?.split(',')[0].trim() === chatroom.city)) {
          score += 20;
          reasoning = `Upcoming travel destination - prepare for your trip to ${chatroom.city}`;
          category = 'travel_destination';
        }

        // Interest and activity matching
        const userInterests = [...(user.interests || []), ...(user.localExpertise || [])];
        const userActivities = [...(user.localActivities || []), ...(user.preferredActivities || [])];
        
        // Check chatroom name for interest/activity matches
        const chatroomText = chatroom.name.toLowerCase();
        const interestMatch = userInterests.some(interest => 
          chatroomText.includes(interest.toLowerCase())
        );
        const activityMatch = userActivities.some(activity => 
          chatroomText.includes(activity.toLowerCase())
        );
        
        if (interestMatch) {
          score += 15;
          reasoning += ` - matches your interest in ${userInterests.find(i => chatroomText.includes(i.toLowerCase()))}`;
          category = 'interest_based';
        }
        
        if (activityMatch) {
          score += 10;
          reasoning += ` - matches your activity preference for ${userActivities.find(a => chatroomText.includes(a.toLowerCase()))}`;
          category = 'activity_based';
        }

        // Hometown bonus when not traveling
        if (!currentTravelDestination && user.hometownCity && chatroom.city === user.hometownCity) {
          score += 30;
          category = 'hometown';
          reasoning = `Located in your hometown ${user.hometownCity}`;
        }
        
        // Travel destination bonus
        for (const plan of travelPlans) {
          if (plan.destination && plan.destination.includes(chatroom.city)) {
            score += 25;
            category = 'travel_destination';
            reasoning = `You're traveling to ${chatroom.city}`;
            break;
          }
        }

        // Interest matching
        if (user.interests && Array.isArray(user.interests)) {
          const nameWords = chatroom.name.toLowerCase().split(' ');
          for (const interest of user.interests) {
            if (nameWords.some((word: string) => 
              interest.toLowerCase().includes(word) || word.includes(interest.toLowerCase())
            )) {
              score += 15;
              reasoning = `Matches your interest in ${interest}`;
              break;
            }
          }
        }

        recommendations.push({
          chatroomId: chatroom.id,
          chatroomName: chatroom.name,
          city: chatroom.city,
          score,
          reasoning,
          category
        });
      }

      // Sort by score and return top 10
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
}

export const chatroomRecommendationEngine = new ChatroomRecommendationEngine();