// AI Bio Generator Service
// Uses user's existing profile data (interests, activities, travel style, etc.) to generate a personalized bio

interface UserProfileData {
  userType: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  interests?: string[];
  activities?: string[];
  travelStyle?: string[];
  languagesSpoken?: string[];
  countriesVisited?: string[];
  travelingWithChildren?: boolean;
  isNewToTown?: boolean;
  gender?: string;
  customInterests?: string;
  customActivities?: string;
}

interface GeneratedBio {
  bio: string;
  success: boolean;
  error?: string;
}

export class AiBioGenerator {
  
  async generateBio(userData: UserProfileData): Promise<GeneratedBio> {
    // Build context from user's profile data
    const context = this.buildContext(userData);
    
    if (!context.hasEnoughData) {
      return {
        bio: "",
        success: false,
        error: "Please select at least 3 interests or activities first so I can write a bio that reflects who you are."
      };
    }

    // Try Anthropic first (primary AI)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        return await this.generateWithAnthropic(context);
      } catch (error) {
        console.error('Anthropic bio generation failed:', error);
      }
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.generateWithOpenAI(context);
      } catch (error) {
        console.error('OpenAI bio generation failed:', error);
      }
    }

    return {
      bio: "",
      success: false,
      error: "AI service temporarily unavailable. Please write your bio manually."
    };
  }

  private buildContext(userData: UserProfileData): { prompt: string; hasEnoughData: boolean } {
    const parts: string[] = [];
    
    // User type context
    if (userData.userType === 'local') {
      parts.push(`User type: A local resident`);
    } else if (userData.userType === 'traveler') {
      parts.push(`User type: A traveler`);
    }

    // Location
    if (userData.hometownCity) {
      const location = [userData.hometownCity, userData.hometownState, userData.hometownCountry]
        .filter(Boolean).join(', ');
      parts.push(`Home base: ${location}`);
    }

    // New to town status
    if (userData.isNewToTown) {
      parts.push(`Recently moved to their city (new to town)`);
    }

    // Interests (main matching data)
    const allInterests = [
      ...(userData.interests || []),
      ...(userData.customInterests?.split(',').map(s => s.trim()).filter(Boolean) || [])
    ];
    if (allInterests.length > 0) {
      parts.push(`Interests: ${allInterests.join(', ')}`);
    }

    // Activities
    const allActivities = [
      ...(userData.activities || []),
      ...(userData.customActivities?.split(',').map(s => s.trim()).filter(Boolean) || [])
    ];
    if (allActivities.length > 0) {
      parts.push(`Activities they enjoy: ${allActivities.join(', ')}`);
    }

    // Travel style
    if (userData.travelStyle && userData.travelStyle.length > 0) {
      parts.push(`Travel style: ${userData.travelStyle.join(', ')}`);
    }

    // Languages
    if (userData.languagesSpoken && userData.languagesSpoken.length > 0) {
      parts.push(`Languages: ${userData.languagesSpoken.join(', ')}`);
    }

    // Countries visited
    if (userData.countriesVisited && userData.countriesVisited.length > 0) {
      parts.push(`Countries visited: ${userData.countriesVisited.join(', ')}`);
    }

    // Family travel
    if (userData.travelingWithChildren) {
      parts.push(`Travels with children / family-oriented`);
    }

    // Check if we have enough data
    const totalItems = allInterests.length + allActivities.length;
    const hasEnoughData = totalItems >= 3;

    const prompt = `You are writing a short, friendly bio for a social travel networking app called Nearby Traveler. 
This app connects travelers with locals and other travelers.

Based on this user's profile data, write a natural, warm, first-person bio (50-120 words). 
Make it conversational and inviting - like something you'd write on a dating app or social profile.
Don't just list their interests - weave them into a narrative that shows personality.
Don't use emojis. Don't be cheesy or use clichés like "wanderlust" or "adventure awaits".
End with something that invites connection (e.g., "always down to..." or "let's grab coffee if...").

User profile data:
${parts.join('\n')}

Write the bio now (first-person, 50-120 words):`;

    return { prompt, hasEnoughData };
  }

  private async generateWithAnthropic(context: { prompt: string }): Promise<GeneratedBio> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: context.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const bio = data.content?.[0]?.text?.trim();

    if (!bio) {
      throw new Error('Empty response from Anthropic');
    }

    return { bio, success: true };
  }

  private async generateWithOpenAI(context: { prompt: string }): Promise<GeneratedBio> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: context.prompt
          }
        ],
        max_tokens: 300,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const bio = data.choices?.[0]?.message?.content?.trim();

    if (!bio) {
      throw new Error('Empty response from OpenAI');
    }

    return { bio, success: true };
  }
}

export const aiBioGenerator = new AiBioGenerator();
