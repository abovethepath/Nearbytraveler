// Using OpenAI API for consistent AI functionality across the platform

export interface HiddenGem {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string;
  tags: string[];
  whyRecommended: string;
  localTip: string;
  bestTimeToVisit: string;
  estimatedCost: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  openingHours?: string;
  website?: string;
  userPreferencesMatched: string[];
}

export interface UserProfile {
  interests: string[];
  travelStyle: string[];
  budget?: string;
  previousDestinations?: string[];
  preferredActivities?: string[];
  currentLocation: string;
}

export class HiddenGemsDiscovery {
  
  async discoverHiddenGems(
    userProfile: UserProfile,
    destination: string,
    preferences: {
      radius?: number;
      categories?: string[];
      maxResults?: number;
      excludePopular?: boolean;
    } = {}
  ): Promise<HiddenGem[]> {
    
    const {
      radius = 25,
      categories = [],
      maxResults = 10,
      excludePopular = true
    } = preferences;

    // Create personalized discovery prompt
    const prompt = this.buildDiscoveryPrompt(
      userProfile,
      destination,
      { radius, categories, maxResults, excludePopular }
    );

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are a local travel expert and hidden gems curator. Your expertise is discovering authentic, lesser-known places that locals love but tourists rarely find. 

Guidelines:
- Focus on genuine local favorites, not tourist traps
- Include specific local tips and insider knowledge
- Provide practical information (costs, timing, access)
- Match recommendations to user's specific interests and travel style
- Include diverse categories (food, culture, nature, activities)
- Ensure locations are accessible and currently operational
- Rate difficulty level realistically
- Provide actionable local tips

Return response as valid JSON with array of hidden gems.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      // Transform and enrich the response
      return this.enrichHiddenGems(data.hiddenGems || [], userProfile);
      
    } catch (error) {
      console.error('Error discovering hidden gems:', error);
      throw new Error('Failed to discover hidden gems. Please try again.');
    }
  }

  private buildDiscoveryPrompt(
    userProfile: UserProfile,
    destination: string,
    preferences: any
  ): string {
    const interests = userProfile.interests.join(', ');
    const travelStyle = userProfile.travelStyle.join(', ');
    
    return `Discover ${preferences.maxResults} hidden gems in ${destination} for a traveler with these preferences:

TRAVELER PROFILE:
- Interests: ${interests}
- Travel Style: ${travelStyle}
- Budget: ${userProfile.budget || 'Moderate'}
- Previous Destinations: ${userProfile.previousDestinations?.join(', ') || 'Not specified'}

REQUIREMENTS:
- Search radius: ${preferences.radius}km from ${destination} center
- ${preferences.excludePopular ? 'Exclude mainstream tourist attractions' : 'Include mix of known and unknown places'}
- Focus on authentic local experiences
- Include practical details (opening hours, costs, access)
- Provide insider tips only locals would know

RESPONSE FORMAT (JSON):
{
  "hiddenGems": [
    {
      "id": "unique_id",
      "name": "Place Name",
      "description": "Detailed description of what makes this special",
      "location": {
        "address": "Full address",
        "coordinates": {"lat": 0.0, "lng": 0.0}
      },
      "category": "Food/Culture/Nature/Activity/Shopping/Nightlife",
      "tags": ["tag1", "tag2", "tag3"],
      "whyRecommended": "Why this matches their interests",
      "localTip": "Insider knowledge only locals know",
      "bestTimeToVisit": "When to go for best experience",
      "estimatedCost": "$/$$/$$$ with explanation",
      "difficulty": "Easy/Moderate/Challenging",
      "rating": 4.5,
      "reviewCount": 23,
      "openingHours": "Days and times",
      "website": "url if available",
      "userPreferencesMatched": ["interest1", "style1"]
    }
  ]
}`;
  }

  private enrichHiddenGems(gems: any[], userProfile: UserProfile): HiddenGem[] {
    return gems.map((gem, index) => ({
      id: gem.id || `gem_${Date.now()}_${index}`,
      name: gem.name || 'Hidden Gem',
      description: gem.description || '',
      location: {
        address: gem.location?.address || '',
        coordinates: gem.location?.coordinates || undefined
      },
      category: gem.category || 'Activity',
      tags: Array.isArray(gem.tags) ? gem.tags : [],
      whyRecommended: gem.whyRecommended || '',
      localTip: gem.localTip || '',
      bestTimeToVisit: gem.bestTimeToVisit || '',
      estimatedCost: gem.estimatedCost || '$',
      difficulty: gem.difficulty || 'Easy',
      imageUrl: gem.imageUrl || this.getDefaultImageForCategory(gem.category),
      rating: gem.rating || 4.0,
      reviewCount: gem.reviewCount || 1,
      openingHours: gem.openingHours || '',
      website: gem.website || '',
      userPreferencesMatched: Array.isArray(gem.userPreferencesMatched) 
        ? gem.userPreferencesMatched 
        : []
    }));
  }

  private getDefaultImageForCategory(category: string): string {
    const categoryImages: { [key: string]: string } = {
      'Food': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      'Culture': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
      'Nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      'Activity': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'Shopping': 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop',
      'Nightlife': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop'
    };
    
    return categoryImages[category] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
  }

  async getFeedbackBasedRecommendations(
    userProfile: UserProfile,
    previousGems: HiddenGem[],
    feedback: {
      liked: string[];
      disliked: string[];
      visited: string[];
      comments?: string;
    }
  ): Promise<HiddenGem[]> {
    
    const prompt = `Based on user feedback, refine hidden gem recommendations:

USER PROFILE:
- Interests: ${userProfile.interests.join(', ')}
- Travel Style: ${userProfile.travelStyle.join(', ')}

PREVIOUS RECOMMENDATIONS:
${previousGems.map(gem => `- ${gem.name} (${gem.category}): ${gem.whyRecommended}`).join('\n')}

USER FEEDBACK:
- Liked: ${feedback.liked.join(', ')}
- Disliked: ${feedback.disliked.join(', ')}
- Visited: ${feedback.visited.join(', ')}
- Comments: ${feedback.comments || 'None'}

Generate 5 new hidden gem recommendations that:
1. Learn from what they liked/disliked
2. Avoid similar places to what they disliked
3. Build on successful recommendations
4. Introduce variety while respecting preferences

Use same JSON format as before.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are a personalized travel curator that learns from user feedback to improve recommendations. Analyze patterns in their preferences and adapt accordingly.`,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      return this.enrichHiddenGems(data.hiddenGems || [], userProfile);
      
    } catch (error) {
      console.error('Error getting feedback-based recommendations:', error);
      throw new Error('Failed to generate refined recommendations.');
    }
  }

  async getSeasonalRecommendations(
    userProfile: UserProfile,
    destination: string,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): Promise<HiddenGem[]> {
    
    const prompt = `Discover 8 seasonal hidden gems in ${destination} for ${season}:

TRAVELER PROFILE:
- Interests: ${userProfile.interests.join(', ')}
- Travel Style: ${userProfile.travelStyle.join(', ')}

SEASONAL FOCUS:
- Season: ${season}
- Focus on activities/places that are particularly special during this time
- Include weather-appropriate recommendations
- Highlight seasonal events, foods, or natural phenomena
- Consider seasonal accessibility and operating hours

Provide authentic local experiences that showcase the destination's character during ${season}.

Use same JSON format as before.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are a seasonal travel expert who knows the best times to experience different places. Focus on unique seasonal aspects that make each recommendation special.`,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      return this.enrichHiddenGems(data.hiddenGems || [], userProfile);
      
    } catch (error) {
      console.error('Error getting seasonal recommendations:', error);
      throw new Error('Failed to generate seasonal recommendations.');
    }
  }
}

export const hiddenGemsDiscovery = new HiddenGemsDiscovery();