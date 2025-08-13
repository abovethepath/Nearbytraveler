interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface LocationRecommendation {
  type: 'activity' | 'event' | 'restaurant' | 'attraction';
  title: string;
  description: string;
  location: string;
  category: string;
  estimatedDuration?: string;
  priceRange?: string;
}

export class RecommendationService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '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';
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
  }

  async getLocationRecommendations(
    destination: string,
    startDate?: string,
    endDate?: string
  ): Promise<LocationRecommendation[]> {
    try {
      // For now, return sample recommendations if no API key
      if (!this.apiKey) {
        return this.getSampleRecommendations(destination);
      }
      
      this.validateApiKey();
      const dateContext = startDate && endDate 
        ? `for travel dates between ${startDate} and ${endDate}` 
        : 'for upcoming travel';

      const prompt = `Provide specific travel recommendations for ${destination} ${dateContext}. I need actual names of places, events, and activities - not generic descriptions.

      Include:
      - 4 specific attractions with actual names (e.g., "Empire State Building", "Central Park")
      - 3 specific activities with actual names (e.g., "Broadway Show Hamilton", "High Line Walking Tour")
      - 2 specific current events or festivals with actual names and dates
      - 3 specific restaurants with actual names and locations
      
      Format as valid JSON array with objects containing: type, title, description, location, category, estimatedDuration, priceRange.
      Types must be: 'attraction', 'activity', 'event', 'restaurant'.
      
      Example format:
      [{"type": "attraction", "title": "Statue of Liberty", "description": "Iconic symbol of freedom...", "location": "Liberty Island", "category": "Monument", "estimatedDuration": "3-4 hours", "priceRange": "$18-25"}]`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert providing specific, current recommendations. Always respond with valid JSON array format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false,
          return_related_questions: false,
          search_recency_filter: 'month'
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      console.log('Perplexity API response:', content);

      if (!content) {
        throw new Error('No content received from API');
      }

      // Try to parse as JSON first, then fall back to text parsing
      try {
        // Check if the content contains JSON
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            return parsed.map(item => ({
              type: item.type || 'attraction',
              title: item.title || 'Unknown',
              description: item.description || '',
              location: item.location || destination,
              category: item.category || 'general',
              estimatedDuration: item.estimatedDuration || '1-2 hours',
              priceRange: item.priceRange || 'Varies'
            }));
          }
        }
      } catch (jsonError) {
        console.log('Failed to parse as JSON, falling back to text parsing');
      }

      // Fall back to text parsing
      return this.parseTextRecommendations(content, destination);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Return sample recommendations as fallback
      return this.getSampleRecommendations(destination);
    }
  }

  private parseTextRecommendations(content: string, destination: string): LocationRecommendation[] {
    const recommendations: LocationRecommendation[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Identify section headers
      if (trimmedLine.toLowerCase().includes('attraction') || 
          trimmedLine.toLowerCase().includes('must-see')) {
        currentSection = 'attraction';
        continue;
      } else if (trimmedLine.toLowerCase().includes('activit')) {
        currentSection = 'activity';
        continue;
      } else if (trimmedLine.toLowerCase().includes('restaurant') || 
                 trimmedLine.toLowerCase().includes('dining')) {
        currentSection = 'restaurant';
        continue;
      } else if (trimmedLine.toLowerCase().includes('event') || 
                 trimmedLine.toLowerCase().includes('festival')) {
        currentSection = 'event';
        continue;
      }

      // Extract recommendations from numbered lists or bullet points
      if (trimmedLine.match(/^\d+\./) || trimmedLine.includes('-') || trimmedLine.includes('•')) {
        const cleanLine = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
        
        if (cleanLine.length > 15) {
          const parts = cleanLine.split(':');
          const title = parts[0].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
          const description = parts.slice(1).join(':').trim();
          
          if (title) {
            recommendations.push({
              type: currentSection as any || this.inferType(cleanLine),
              title: title,
              description: description || cleanLine,
              location: destination,
              category: 'general',
              estimatedDuration: '1-2 hours',
              priceRange: 'Varies'
            });
          }
        }
      }
    }

    // If no structured recommendations found, try simpler parsing
    if (recommendations.length === 0) {
      for (const line of lines) {
        if ((line.includes('-') || line.includes('•')) && line.length > 20) {
          const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
          recommendations.push({
            type: this.inferType(cleanLine),
            title: cleanLine.split(':')[0] || cleanLine.substring(0, 50),
            description: cleanLine,
            location: destination,
            category: 'general',
            estimatedDuration: '1-2 hours',
            priceRange: 'Varies'
          });
        }
      }
    }

    return recommendations.slice(0, 12);
  }

  private inferType(text: string): 'activity' | 'event' | 'restaurant' | 'attraction' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('dining')) {
      return 'restaurant';
    }
    if (lowerText.includes('festival') || lowerText.includes('event') || lowerText.includes('concert')) {
      return 'event';
    }
    if (lowerText.includes('museum') || lowerText.includes('temple') || lowerText.includes('landmark')) {
      return 'attraction';
    }
    return 'activity';
  }

  private getSampleRecommendations(destination: string): LocationRecommendation[] {
    const destinationRecommendations: { [key: string]: LocationRecommendation[] } = {
      'Paris': [
        {
          type: 'attraction',
          title: 'Eiffel Tower',
          description: 'Iconic iron tower offering stunning city views from multiple levels',
          location: 'Paris',
          category: 'landmark',
          estimatedDuration: '2-3 hours',
          priceRange: '€29-45'
        },
        {
          type: 'activity',
          title: 'Seine River Cruise',
          description: 'Scenic boat tour showcasing Paris architecture from the water',
          location: 'Paris',
          category: 'sightseeing',
          estimatedDuration: '1 hour',
          priceRange: '€15-25'
        },
        {
          type: 'restaurant',
          title: 'Le Comptoir du Relais',
          description: 'Traditional French bistro known for authentic cuisine',
          location: 'Saint-Germain, Paris',
          category: 'fine dining',
          estimatedDuration: '2 hours',
          priceRange: '€40-60'
        }
      ],
      'Tokyo': [
        {
          type: 'attraction',
          title: 'Senso-ji Temple',
          description: 'Ancient Buddhist temple in Asakusa district',
          location: 'Asakusa, Tokyo',
          category: 'cultural',
          estimatedDuration: '1-2 hours',
          priceRange: 'Free'
        },
        {
          type: 'activity',
          title: 'Tsukiji Outer Market Food Tour',
          description: 'Sample fresh sushi and traditional Japanese street food',
          location: 'Tsukiji, Tokyo',
          category: 'food',
          estimatedDuration: '3 hours',
          priceRange: '¥3000-5000'
        },
        {
          type: 'event',
          title: 'Cherry Blossom Festival',
          description: 'Seasonal celebration of sakura blooms in parks',
          location: 'Various parks, Tokyo',
          category: 'seasonal',
          estimatedDuration: '4 hours',
          priceRange: 'Free'
        }
      ]
    };

    // Return specific recommendations if available, otherwise generic ones
    return destinationRecommendations[destination] || [
      {
        type: 'attraction',
        title: `${destination} City Center`,
        description: 'Explore the main attractions and landmarks in the city center',
        location: destination,
        category: 'sightseeing',
        estimatedDuration: '2-3 hours',
        priceRange: 'Varies'
      },
      {
        type: 'activity',
        title: 'Local Walking Tour',
        description: 'Guided tour highlighting local history and culture',
        location: destination,
        category: 'cultural',
        estimatedDuration: '2 hours',
        priceRange: '$20-40'
      },
      {
        type: 'restaurant',
        title: 'Traditional Local Cuisine',
        description: 'Experience authentic local flavors and specialties',
        location: destination,
        category: 'dining',
        estimatedDuration: '1-2 hours',
        priceRange: '$25-50'
      }
    ];
  }
}

export const recommendationService = new RecommendationService();