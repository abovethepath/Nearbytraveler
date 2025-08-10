// Using OpenAI API for consistent AI functionality across the platform

interface GenerateRecommendationsRequest {
  location: string;
  category: string;
  preferences: string;
  userId: number;
}

interface RecommendationData {
  title: string;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  priceRange?: string;
  rating?: number;
  tags: string[];
  aiConfidence: number;
  recommendationReason: string;
  userPreferencesMatched: string[];
}

export class AiRecommendationService {
  async generateRecommendations(request: GenerateRecommendationsRequest): Promise<RecommendationData[]> {
    const { location, category, preferences, userId } = request;
    
    console.log(`Generating AI recommendations for ${location}, category: ${category}`);
    
    // Try AI generation first, fallback only if needed
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        return await this.generateWithAnthropic(location, category, preferences);
      } catch (error) {
        console.error('Anthropic AI failed, falling back to OpenAI:', error);
      }
    }
    
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.generateWithOpenAI(location, category, preferences);
      } catch (error) {
        console.error('OpenAI failed, using fallback:', error);
      }
    }
    
    // Use fallback only if all AI services fail
    console.log('All AI services unavailable, using fallback recommendations');
    return this.getFallbackRecommendations(location, category);
  }

  private async generateWithAnthropic(location: string, category: string, preferences: string): Promise<RecommendationData[]> {
    const prompt = this.buildPrompt(location, category, preferences);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (content) {
      return this.parseAiResponse(content, location, category);
    } else {
      throw new Error('No content received from Anthropic');
    }
  }

  private async generateWithOpenAI(location: string, category: string, preferences: string): Promise<RecommendationData[]> {
    const prompt = this.buildPrompt(location, category, preferences);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable travel expert. Provide detailed, authentic recommendations for real places that exist. Always respond with valid JSON containing an array of recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      return this.parseAiResponse(content, location, category);
    } else {
      throw new Error('No content received from OpenAI');
    }
  }

  private buildPrompt(location: string, category: string, preferences: string): string {
    return `You are a knowledgeable travel expert. Generate 2-3 detailed, authentic travel recommendations for ${category} in ${location}.

Location: ${location}
Category: ${category}
User preferences: ${preferences || 'General recommendations'}

Requirements:
- Recommend REAL, well-established places that have operated for several years in ${location}
- Focus on places that were popular and likely still operating as of your knowledge cutoff
- Include specific details like addresses, hours, prices (add "Please verify current hours and status")
- Explain why each place is worth visiting
- Consider local culture and authentic experiences
- Provide practical information for travelers
- Include verification disclaimers in operating hours and recommendations

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Actual Place Name",
      "description": "Detailed description explaining what makes this place special (2-3 sentences)",
      "address": "Specific street address",
      "latitude": number_or_null,
      "longitude": number_or_null,
      "openingHours": "Actual operating hours (Please verify current hours and status)",
      "priceRange": "$, $$, $$$, or $$$$",
      "rating": 4.2,
      "tags": ["relevant", "descriptive", "tags"],
      "aiConfidence": 0.9,
      "recommendationReason": "Clear explanation of why this place is recommended (verify current status before visiting)",
      "userPreferencesMatched": ["specific", "matched", "preferences"]
    }
  ]
}

Focus on quality over quantity. Each recommendation should be a genuine place that travelers can actually visit in ${location}.`;
  }

  private parseAiResponse(aiResponse: string, location: string, category: string): RecommendationData[] {
    try {
      const parsed = JSON.parse(aiResponse);
      const recommendations = parsed.recommendations || [];
      
      return recommendations.map((rec: any) => ({
        title: rec.title || 'Unknown Place',
        description: rec.description || 'A hidden gem worth discovering.',
        address: rec.address || undefined,
        latitude: rec.latitude || undefined,
        longitude: rec.longitude || undefined,
        openingHours: rec.openingHours || undefined,
        priceRange: rec.priceRange || undefined,
        rating: rec.rating || undefined,
        tags: Array.isArray(rec.tags) ? rec.tags : ['hidden gem'],
        aiConfidence: Math.min(Math.max(rec.aiConfidence || 0.5, 0), 1),
        recommendationReason: rec.recommendationReason || 'Recommended based on your preferences.',
        userPreferencesMatched: Array.isArray(rec.userPreferencesMatched) ? rec.userPreferencesMatched : []
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackRecommendations(location, category);
    }
  }

  private getFallbackRecommendations(location: string, category: string): RecommendationData[] {
    return [
      {
        title: `Connect with ${location} Locals`,
        description: `Join our community to discover authentic ${category.toLowerCase()} recommendations from local residents and fellow travelers in ${location}.`,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        openingHours: undefined,
        priceRange: undefined,
        rating: undefined,
        tags: [category.toLowerCase(), 'community driven', 'local recommendations'],
        aiConfidence: 0.9,
        recommendationReason: 'Community recommendations provide the most authentic local experiences',
        userPreferencesMatched: ['authentic experiences', 'local insights']
      },
      {
        title: `${location} Local Expertise`,
        description: `Our community members in ${location} are ready to share their favorite ${category.toLowerCase()} spots, hidden gems, and insider tips you won't find in guidebooks.`,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        openingHours: undefined,
        priceRange: undefined,
        rating: undefined,
        tags: [category.toLowerCase(), 'hidden gems', 'insider tips'],
        aiConfidence: 0.95,
        recommendationReason: 'Local knowledge beats any algorithm - connect with residents for real recommendations',
        userPreferencesMatched: ['hidden gems', 'local culture']
      }
    ];
  }
}