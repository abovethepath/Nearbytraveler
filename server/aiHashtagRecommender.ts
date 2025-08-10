import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface HashtagRecommendation {
  hashtags: string[];
  category: string;
  reasoning: string;
}

export class AIHashtagRecommender {
  /**
   * Generate hashtags for local experiences using AI
   */
  async generateHashtagsForExperience(
    experience: string,
    city: string,
    state?: string,
    country?: string,
    category?: string
  ): Promise<HashtagRecommendation> {
    try {
      const locationString = state 
        ? `${city}, ${state}, ${country}`
        : `${city}, ${country}`;

      const prompt = this.createHashtagPrompt(experience, locationString, category);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a social media expert specializing in travel and local experiences. Generate relevant, trending hashtags that would help users discover authentic local content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        hashtags: result.hashtags || [],
        category: result.category || 'local_experience',
        reasoning: result.reasoning || 'Generated based on experience content and location'
      };
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return {
        hashtags: this.getFallbackHashtags(city, category),
        category: category || 'local_experience',
        reasoning: 'Fallback hashtags due to AI generation error'
      };
    }
  }

  /**
   * Generate hashtags for events
   */
  async generateHashtagsForEvent(
    title: string,
    description: string,
    city: string,
    state?: string,
    country?: string,
    eventCategory?: string
  ): Promise<HashtagRecommendation> {
    try {
      const locationString = state 
        ? `${city}, ${state}, ${country}`
        : `${city}, ${country}`;

      const prompt = this.createEventHashtagPrompt(title, description, locationString, eventCategory);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a social media expert specializing in event promotion and local community engagement. Generate hashtags that would maximize event visibility and attendance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        hashtags: result.hashtags || [],
        category: result.category || 'event',
        reasoning: result.reasoning || 'Generated based on event details and location'
      };
    } catch (error) {
      console.error('Error generating event hashtags:', error);
      return {
        hashtags: this.getFallbackEventHashtags(city, eventCategory),
        category: eventCategory || 'event',
        reasoning: 'Fallback hashtags due to AI generation error'
      };
    }
  }

  /**
   * Generate hashtags for travel memories
   */
  async generateHashtagsForMemory(
    description: string,
    destination: string,
    tags: string[],
    city: string,
    country: string
  ): Promise<HashtagRecommendation> {
    try {
      const prompt = this.createMemoryHashtagPrompt(description, destination, tags, city, country);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a travel content creator expert. Generate hashtags that would help travelers share their memories and inspire others to visit similar places."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        hashtags: result.hashtags || [],
        category: result.category || 'travel_memory',
        reasoning: result.reasoning || 'Generated based on memory content and destination'
      };
    } catch (error) {
      console.error('Error generating memory hashtags:', error);
      return {
        hashtags: this.getFallbackMemoryHashtags(city, country),
        category: 'travel_memory',
        reasoning: 'Fallback hashtags due to AI generation error'
      };
    }
  }

  /**
   * Create hashtag generation prompt for experiences
   */
  private createHashtagPrompt(
    experience: string,
    location: string,
    category?: string
  ): string {
    return `Generate 8-12 relevant hashtags for this local experience:

Experience: "${experience}"
Location: ${location}
Category: ${category || 'local_experience'}

Requirements:
- Mix of popular and niche hashtags
- Include location-specific hashtags
- Include activity/experience type hashtags
- Include community/social hashtags
- Avoid overly generic hashtags
- Focus on discoverability and engagement
- Use proper hashtag format (no spaces, appropriate capitalization)

Respond with JSON in this format:
{
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "category": "experience_type",
  "reasoning": "Brief explanation of hashtag selection strategy"
}`;
  }

  /**
   * Create hashtag generation prompt for events
   */
  private createEventHashtagPrompt(
    title: string,
    description: string,
    location: string,
    eventCategory?: string
  ): string {
    return `Generate 10-15 relevant hashtags for this local event:

Event Title: "${title}"
Description: "${description}"
Location: ${location}
Category: ${eventCategory || 'community_event'}

Requirements:
- Include event promotion hashtags
- Include location/city hashtags
- Include activity/theme hashtags
- Include community engagement hashtags
- Include trending social media hashtags
- Mix of broad reach and targeted hashtags
- Focus on driving attendance and shares

Respond with JSON in this format:
{
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "category": "event_type",
  "reasoning": "Brief explanation of hashtag selection strategy"
}`;
  }

  /**
   * Create hashtag generation prompt for travel memories
   */
  private createMemoryHashtagPrompt(
    description: string,
    destination: string,
    tags: string[],
    city: string,
    country: string
  ): string {
    return `Generate 8-12 relevant hashtags for this travel memory:

Memory Description: "${description}"
Destination: ${destination}
Location: ${city}, ${country}
User Tags: ${tags.join(', ')}

Requirements:
- Include destination/location hashtags
- Include experience/activity hashtags
- Include travel inspiration hashtags
- Include memory/nostalgia hashtags
- Mix of popular travel hashtags and location-specific ones
- Focus on inspiring others to visit

Respond with JSON in this format:
{
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "category": "travel_memory",
  "reasoning": "Brief explanation of hashtag selection strategy"
}`;
  }

  /**
   * Fallback hashtags for experiences when AI fails
   */
  private getFallbackHashtags(city: string, category?: string): string[] {
    const cityTag = `#${city.replace(/\s+/g, '').toLowerCase()}`;
    const baseHashtags = [
      cityTag,
      '#localexperience',
      '#hiddengems',
      '#authentic',
      '#localknowledge',
      '#nearbytravel'
    ];

    if (category === 'food') {
      baseHashtags.push('#foodie', '#localfood', '#foodculture', '#eatlocal', '#foodspots');
    } else if (category === 'nightlife') {
      baseHashtags.push('#nightlife', '#localbars', '#nightout', '#drinks', '#cocktails', '#livemusic', '#rooftop', '#dancing');
    } else if (category === 'culture') {
      baseHashtags.push('#culture', '#localculture', '#heritage', '#art', '#museums');
    } else if (category === 'outdoor') {
      baseHashtags.push('#outdoor', '#nature', '#hiking', '#adventure', '#explore');
    } else if (category === 'shopping') {
      baseHashtags.push('#shopping', '#localmarkets', '#boutiques', '#vintage', '#retail');
    }

    // Add city-specific hashtags
    if (city.toLowerCase().includes('los angeles') || city.toLowerCase().includes('la')) {
      baseHashtags.push('#LA', '#SoCal', '#California', '#WestCoast');
      if (category === 'nightlife') {
        baseHashtags.push('#LANightlife', '#HollywoodNights', '#SunsetStrip', '#DTLA', '#WeHo', '#RooftopBars');
      }
    } else if (city.toLowerCase().includes('philadelphia') || city.toLowerCase().includes('philly')) {
      baseHashtags.push('#Philly', '#Philadelphia', '#Pennsylvania', '#EastCoast');
      if (category === 'nightlife') {
        baseHashtags.push('#PhillyNightlife', '#CenterCity', '#NorthernLiberties', '#FishTown');
      }
    } else if (city.toLowerCase().includes('new york') || city.toLowerCase().includes('nyc')) {
      baseHashtags.push('#NYC', '#NewYork', '#Manhattan', '#BigApple');
      if (category === 'nightlife') {
        baseHashtags.push('#NYCNightlife', '#ManhattanNights', '#Brooklyn', '#EastVillage');
      }
    }

    return baseHashtags;
  }

  /**
   * Fallback hashtags for events when AI fails
   */
  private getFallbackEventHashtags(city: string, category?: string): string[] {
    const cityTag = `#${city.replace(/\s+/g, '').toLowerCase()}`;
    const baseHashtags = [
      cityTag,
      '#event',
      '#community',
      '#localevent',
      '#meetup',
      '#social'
    ];

    if (category === 'music') {
      baseHashtags.push('#music', '#livemusic', '#concert');
    } else if (category === 'food') {
      baseHashtags.push('#food', '#foodie', '#dining');
    } else if (category === 'arts') {
      baseHashtags.push('#art', '#culture', '#gallery');
    }

    return baseHashtags;
  }

  /**
   * Fallback hashtags for memories when AI fails
   */
  private getFallbackMemoryHashtags(city: string, country: string): string[] {
    const cityTag = `#${city.replace(/\s+/g, '').toLowerCase()}`;
    const countryTag = `#${country.replace(/\s+/g, '').toLowerCase()}`;
    
    return [
      cityTag,
      countryTag,
      '#travel',
      '#memories',
      '#wanderlust',
      '#travelgram',
      '#explore',
      '#adventure'
    ];
  }
}

export const aiHashtagRecommender = new AIHashtagRecommender();