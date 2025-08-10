// Using OpenAI API for consistent AI functionality across the platform
import type { InsertAiRecommendation, InsertAiConversation } from '@shared/schema';

interface TravelPreferences {
  budgetPreference?: string;
  travelStyle?: string[];
  preferredCategories?: string[];
  dislikedCategories?: string[];
  dietaryRestrictions?: string[];
  mobilityNeeds?: string[];
  groupType?: string;
  timePreferences?: string[];
  avoidCrowds?: boolean;
  localInteraction?: boolean;
  sustainableTourism?: boolean;
}

interface RecommendationRequest {
  location: string;
  userId: number;
  preferences?: TravelPreferences;
  conversationContext?: string;
  specificRequest?: string;
}

export class AITravelCompanion {
  async generateHiddenGemRecommendations(request: RecommendationRequest): Promise<InsertAiRecommendation[]> {
    const { location, userId, preferences, specificRequest } = request;
    
    const prompt = this.buildRecommendationPrompt(location, preferences, specificRequest);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('AI service not available');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          max_tokens: 2048,
          messages: [
            {
              role: 'system',
              content: `You are a local travel expert AI companion that specializes in discovering authentic hidden gems and local favorites. Your goal is to provide personalized recommendations that go beyond typical tourist attractions.

Guidelines:
- Focus on authentic, lesser-known places that locals love
- Consider the user's preferences and travel style
- Provide practical details like opening hours, price ranges, and insider tips
- Include accessibility information when relevant
- Suggest the best times to visit to avoid crowds
- Always include a compelling reason why this place is special
- Format response as a JSON object with "recommendations" as the root key`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('Empty response from AI service');
      }

      const recommendations = this.parseRecommendations(responseText, userId, location);
      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw new Error('Failed to generate travel recommendations');
    }
  }

  private buildRecommendationPrompt(
    location: string, 
    preferences?: TravelPreferences, 
    specificRequest?: string
  ): string {
    let prompt = `I'm looking for hidden gem recommendations in ${location}. `;
    
    if (specificRequest) {
      prompt += `Specifically, I'm interested in: ${specificRequest}. `;
    }
    
    if (preferences) {
      prompt += this.formatPreferences(preferences);
    }
    
    prompt += `
Please provide 5-8 hidden gem recommendations that locals would know about but tourists might miss. For each recommendation, include:

1. Category (restaurants, attractions, nightlife, nature, culture, shopping)
2. Title/Name
3. Detailed description (what makes it special)
4. Approximate address or area
5. Price range ($, $$, $$$, $$$$)
6. Best time to visit
7. Insider tip from locals
8. Why you're recommending it based on my preferences
9. Estimated visit duration
10. Any accessibility considerations

Format as JSON array with these fields:
- category
- title
- description
- address
- priceRange
- rating (estimated 1-5)
- tags (array of relevant tags)
- reasonForRecommendation
- localInsiderTip
- bestTimeToVisit
- averageVisitDuration
- accessibility
- sourceReliability (confidence score 0-1)

Focus on authentic, unique experiences that showcase the real character of ${location}.`;

    return prompt;
  }

  private formatPreferences(preferences: TravelPreferences): string {
    let prefText = "\nMy preferences: ";
    
    if (preferences.budgetPreference) {
      prefText += `Budget: ${preferences.budgetPreference}. `;
    }
    
    if (preferences.travelStyle?.length) {
      prefText += `Travel style: ${preferences.travelStyle.join(', ')}. `;
    }
    
    if (preferences.preferredCategories?.length) {
      prefText += `Interested in: ${preferences.preferredCategories.join(', ')}. `;
    }
    
    if (preferences.dislikedCategories?.length) {
      prefText += `Please avoid: ${preferences.dislikedCategories.join(', ')}. `;
    }
    
    if (preferences.dietaryRestrictions?.length) {
      prefText += `Dietary needs: ${preferences.dietaryRestrictions.join(', ')}. `;
    }
    
    if (preferences.groupType) {
      prefText += `Traveling: ${preferences.groupType}. `;
    }
    
    if (preferences.avoidCrowds) {
      prefText += `Prefer less crowded places. `;
    }
    
    if (preferences.localInteraction) {
      prefText += `Enjoy interacting with locals. `;
    }
    
    if (preferences.sustainableTourism) {
      prefText += `Prefer sustainable/eco-friendly options. `;
    }
    
    return prefText;
  }

  private parseRecommendations(
    responseText: string, 
    userId: number, 
    location: string
  ): InsertAiRecommendation[] {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const parsedRecommendations = JSON.parse(jsonMatch[0]);
      
      return parsedRecommendations.map((rec: any) => ({
        userId,
        location,
        category: rec.category || 'general',
        title: rec.title || 'Unnamed Recommendation',
        description: rec.description || '',
        address: rec.address || null,
        coordinates: null, // Could be enhanced with geocoding
        priceRange: rec.priceRange || null,
        rating: rec.rating || null,
        tags: rec.tags || [],
        reasonForRecommendation: rec.reasonForRecommendation || '',
        localInsiderTip: rec.localInsiderTip || null,
        bestTimeToVisit: rec.bestTimeToVisit || null,
        averageVisitDuration: rec.averageVisitDuration || null,
        difficulty: null,
        accessibility: rec.accessibility || null,
        imageUrl: null,
        sourceReliability: rec.sourceReliability || 0.8,
        isVerified: false,
        userPreferencesMatched: rec.userPreferencesMatched || [],
      }));
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  async generateConversationResponse(
    userMessage: string,
    location: string,
    userId: number,
    conversationContext?: string
  ): Promise<{ response: string; recommendationIds?: number[] }> {
    const prompt = `Location context: ${location}
    ${conversationContext ? `Previous conversation: ${conversationContext}` : ''}
    
    User message: ${userMessage}
    
    As an AI travel companion, provide a helpful, conversational response about travel in ${location}. 
    If the user is asking for recommendations, you can suggest using the recommendation feature.
    Keep responses friendly, informative, and focused on enhancing their travel experience.`;

    if (!process.env.OPENAI_API_KEY) {
      return {
        response: "AI travel companion is currently unavailable. Please check back later.",
        recommendationIds: []
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          max_tokens: 1024,
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable, friendly AI travel companion. You help travelers discover amazing experiences and provide practical travel advice. Keep responses conversational and helpful.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('Empty response from AI service');
      }

      return {
        response: responseText,
        recommendationIds: [], // For future enhancement
      };
    } catch (error) {
      console.error('Error generating conversation response:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

export const aiTravelCompanion = new AITravelCompanion();