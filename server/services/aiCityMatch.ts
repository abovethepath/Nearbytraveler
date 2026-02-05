// AI City Match Service
// Provides AI-powered features for the Match in City page:
// 1. Activity Suggestions - personalized activity ideas based on user interests
// 2. Matching Insights - explain compatibility with other users
// 3. City Guide - travel tips and local insights for the city

interface UserData {
  id: number;
  username: string;
  userType: string;
  interests?: string[];
  activities?: string[];
  customInterests?: string;
  travelStyle?: string[];
  languagesSpoken?: string[];
}

interface CityActivitySuggestion {
  activityName: string;
  description: string;
  whyRecommended: string;
}

interface MatchingInsight {
  compatibilityScore: number;
  sharedInterests: string[];
  conversationStarters: string[];
  whyYoullConnect: string;
}

interface CityGuideContent {
  overview: string;
  localTips: string[];
  bestTimeToVisit: string;
  hiddenGems: string[];
  foodRecommendations: string[];
  safetyTips: string[];
  specificEvents?: string[];
}

export class AiCityMatchService {
  
  // Generate personalized activity suggestions based on user's interests
  async generateActivitySuggestions(
    userData: UserData, 
    cityName: string,
    existingActivities: string[]
  ): Promise<{ suggestions: CityActivitySuggestion[]; success: boolean; error?: string }> {
    
    const userInterests = [
      ...(userData.interests || []),
      ...(userData.activities || []),
      ...(userData.customInterests?.split(',').map(s => s.trim()).filter(Boolean) || [])
    ];

    if (userInterests.length === 0) {
      return {
        suggestions: [],
        success: false,
        error: "Please add some interests to your profile first so I can suggest personalized activities."
      };
    }

    const prompt = `You are a travel activity expert. Generate 5 unique activity suggestions for ${cityName} based on the user's interests.

User's interests: ${userInterests.join(', ')}
User type: ${userData.userType === 'local' ? 'local resident' : 'traveler'}
${userData.travelStyle?.length ? `Travel style: ${userData.travelStyle.join(', ')}` : ''}

Existing activities in this city (avoid duplicates): ${existingActivities.slice(0, 20).join(', ')}

Return ONLY a valid JSON array with exactly 5 objects, each with these fields:
- activityName: short name (2-5 words)
- description: one sentence describing the activity
- whyRecommended: brief reason why this matches their interests

Example format:
[{"activityName":"Beach Volleyball","description":"Play casual games at the local beach courts.","whyRecommended":"Matches your interest in sports and outdoor activities."}]`;

    try {
      const response = await this.callAI(prompt);
      const suggestions = this.parseJsonArray<CityActivitySuggestion>(response);
      
      if (suggestions.length === 0) {
        return { suggestions: [], success: false, error: "Could not generate suggestions. Please try again." };
      }
      
      return { suggestions, success: true };
    } catch (error) {
      console.error('AI activity suggestions error:', error);
      return { suggestions: [], success: false, error: "AI service temporarily unavailable." };
    }
  }

  // Generate insights about why two users would be compatible
  async generateMatchingInsight(
    currentUser: UserData,
    matchedUser: UserData,
    cityName: string
  ): Promise<{ insight: MatchingInsight | null; success: boolean; error?: string }> {
    
    const currentInterests = [
      ...(currentUser.interests || []),
      ...(currentUser.activities || [])
    ];
    
    const matchedInterests = [
      ...(matchedUser.interests || []),
      ...(matchedUser.activities || [])
    ];

    const sharedInterests = currentInterests.filter(i => 
      matchedInterests.some(m => m.toLowerCase() === i.toLowerCase())
    );

    const prompt = `You are a social connection expert. Analyze why these two users would connect well in ${cityName}.

User 1 (current user):
- Username: ${currentUser.username}
- Type: ${currentUser.userType === 'local' ? 'local resident' : 'traveler'}
- Interests: ${currentInterests.join(', ') || 'Not specified'}
${currentUser.languagesSpoken?.length ? `- Languages: ${currentUser.languagesSpoken.join(', ')}` : ''}

User 2 (potential match):
- Username: ${matchedUser.username}
- Type: ${matchedUser.userType === 'local' ? 'local resident' : 'traveler'}
- Interests: ${matchedInterests.join(', ') || 'Not specified'}
${matchedUser.languagesSpoken?.length ? `- Languages: ${matchedUser.languagesSpoken.join(', ')}` : ''}

Shared interests: ${sharedInterests.join(', ') || 'None identified'}

Return ONLY a valid JSON object with these fields:
- compatibilityScore: number 1-100 based on shared interests and complementary traits
- sharedInterests: array of their common interests (use the ones I provided or identify more)
- conversationStarters: array of 3 topic suggestions to break the ice
- whyYoullConnect: one paragraph explaining the connection potential

Example format:
{"compatibilityScore":75,"sharedInterests":["hiking","photography"],"conversationStarters":["Ask about their favorite hiking trail","Share photography tips","Discuss local hidden gems"],"whyYoullConnect":"You both love outdoor activities..."}`;

    try {
      const response = await this.callAI(prompt);
      const insight = this.parseJsonObject<MatchingInsight>(response);
      
      if (!insight) {
        return { insight: null, success: false, error: "Could not generate insight. Please try again." };
      }
      
      return { insight, success: true };
    } catch (error) {
      console.error('AI matching insight error:', error);
      return { insight: null, success: false, error: "AI service temporarily unavailable." };
    }
  }

  // Generate a city guide with local insights
  async generateCityGuide(
    cityName: string,
    userData?: UserData
  ): Promise<{ guide: CityGuideContent | null; success: boolean; error?: string }> {
    
    const userContext = userData ? `
The user is a ${userData.userType === 'local' ? 'local resident' : 'traveler'}.
Their interests include: ${[...(userData.interests || []), ...(userData.activities || [])].join(', ') || 'general exploration'}
${userData.travelStyle?.length ? `Travel style: ${userData.travelStyle.join(', ')}` : ''}` : '';

    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    const prompt = `You are a knowledgeable local guide for ${cityName}. Create a helpful city guide with SPECIFIC events and activities happening in ${cityName}.
${userContext}

IMPORTANT: Include real, specific events, festivals, markets, and recurring activities that actually happen in ${cityName}. Think about what's happening there around ${currentMonth} - seasonal events, weekly markets, popular venues, recurring meetups, local festivals, etc.

Return ONLY a valid JSON object with these fields:
- overview: 2-3 sentences about what makes ${cityName} special
- specificEvents: array of 5 specific events, festivals, markets, or recurring activities in ${cityName} (e.g. "First Fridays Art Walk on Abbot Kinney Blvd - monthly art and food event", "Santa Monica Farmers Market - Wednesdays & Saturdays at Arizona Ave"). Include real venue names and locations within ${cityName}.
- localTips: array of 4 practical tips only locals would know
- bestTimeToVisit: one sentence about optimal visiting times
- hiddenGems: array of 3 lesser-known spots worth visiting
- foodRecommendations: array of 3 local food/dining suggestions
- safetyTips: array of 2 practical safety considerations

Focus on authentic, real, city-specific information. The specificEvents should be REAL events and activities that happen in ${cityName}, not generic suggestions.

Example format:
{"overview":"City overview here...","specificEvents":["Venice Beach Drum Circle - every Saturday at sunset on the boardwalk","First Fridays Art Walk on Abbot Kinney Blvd","Santa Monica Pier Twilight Concert Series - summer Thursday evenings","Culver City Art Walk - second Saturday of every month","Playa Vista Farmers Market - Saturdays 9am-2pm"],"localTips":["Tip 1","Tip 2","Tip 3","Tip 4"],"bestTimeToVisit":"Best time info...","hiddenGems":["Gem 1","Gem 2","Gem 3"],"foodRecommendations":["Food 1","Food 2","Food 3"],"safetyTips":["Safety 1","Safety 2"]}`;

    try {
      const response = await this.callAI(prompt);
      const guide = this.parseJsonObject<CityGuideContent>(response);
      
      if (!guide) {
        return { guide: null, success: false, error: "Could not generate city guide. Please try again." };
      }
      
      return { guide, success: true };
    } catch (error) {
      console.error('AI city guide error:', error);
      return { guide: null, success: false, error: "AI service temporarily unavailable." };
    }
  }

  // Main AI call method - uses Replit AI Integration
  private async callAI(prompt: string): Promise<string> {
    // Use Replit AI Integration (uses Replit credits)
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      try {
        console.log('Calling Replit AI Integration for city match feature...');
        return await this.callReplitAI(prompt);
      } catch (error) {
        console.error('Replit AI failed:', error);
      }
    }

    throw new Error('No AI service available');
  }

  private async callReplitAI(prompt: string): Promise<string> {
    const response = await fetch(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns only valid JSON. Never include markdown code blocks or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Replit AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // Parse JSON array from AI response (handles markdown code blocks)
  private parseJsonArray<T>(response: string): T[] {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();
      
      // Find array boundaries
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON array:', error, 'Response:', response);
      return [];
    }
  }

  // Parse JSON object from AI response (handles markdown code blocks)
  private parseJsonObject<T>(response: string): T | null {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();
      
      // Find object boundaries
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON object:', error, 'Response:', response);
      return null;
    }
  }
}

export const aiCityMatchService = new AiCityMatchService();
