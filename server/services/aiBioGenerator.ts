// AI Bio Generator Service
// Uses user's existing profile data (interests, activities, travel style, etc.) to generate a personalized bio

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

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

    // Use Anthropic Claude (claude-sonnet-4-6) consistently with rest of codebase
    if (process.env.ANTHROPIC_API_KEY?.trim()) {
      try {
        console.log('Attempting bio generation with Anthropic (claude-sonnet-4-6)...');
        return await this.generateWithAnthropic(context);
      } catch (error) {
        console.error('Anthropic bio generation failed:', error);
      }
    }

    return {
      bio: "",
      success: false,
      error: "AI service temporarily unavailable. Please set ANTHROPIC_API_KEY or write your bio manually."
    };
  }

  private async generateWithAnthropic(context: { prompt: string }): Promise<GeneratedBio> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    const anthropic = new Anthropic({ apiKey: apiKey.trim() });
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: context.prompt }],
    });
    const text = response.content.find((block): block is { type: "text"; text: string } => block.type === "text");
    const bio = text?.text?.trim();
    if (!bio) {
      throw new Error("Empty response from Anthropic");
    }
    console.log('Bio generated successfully with Anthropic');
    return { bio, success: true };
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

}

export const aiBioGenerator = new AiBioGenerator();
