import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AICityImageGenerator {
  async generateCityImage(city: string, state: string, country: string): Promise<string | null> {
    try {
      // Create a descriptive prompt for the city
      const prompt = this.createCityImagePrompt(city, state, country);
      
      // Generate the image using DALL-E 3
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url;
    } catch (error) {
      console.error('Error generating city image:', error);
      return null;
    }
  }

  private createCityImagePrompt(city: string, state: string, country: string): string {
    // Create location-specific prompts for authentic city representations
    const locationKey = `${city.toLowerCase()}, ${country.toLowerCase()}`;
    
    const specificPrompts: Record<string, string> = {
      'brooklyn, united states': 'Beautiful sunset view of Brooklyn Bridge with Manhattan skyline in background, urban photography style, golden hour lighting, iconic NYC architecture, East River waterfront',
      'manhattan, united states': 'Iconic Manhattan skyline with skyscrapers, Times Square energy, yellow taxi cabs, bustling street life, urban metropolis, golden hour lighting',
      'los angeles, united states': 'Los Angeles cityscape with palm trees, Hollywood Hills, sunset over the Pacific, California lifestyle, modern architecture mixed with beaches',
      'rome, italy': 'Ancient Roman architecture, Colosseum in background, historic cobblestone streets, warm Mediterranean lighting, classical Italian city atmosphere',
      'paris, france': 'Eiffel Tower view, charming Parisian streets, café culture, romantic European city atmosphere, golden hour over Seine River',
      'london, united kingdom': 'London cityscape with Big Ben, Thames River, red double-decker buses, British architectural style, dramatic cloudy sky',
      'tokyo, japan': 'Modern Tokyo skyline with neon lights, traditional and modern architecture blend, Mount Fuji in distance, vibrant urban Japanese culture',
      'sydney, australia': 'Sydney Opera House and Harbour Bridge, beautiful harbor views, Australian coastal city atmosphere, bright blue skies',
      'barcelona, spain': 'Gaudí architecture, Park Güell colorful mosaics, Mediterranean coastal city vibes, vibrant Spanish culture, sunny atmosphere',
      'budapest, hungary': 'Danube River with Parliament building, historic European architecture, thermal baths, romantic Central European city atmosphere',
      'prague, czech republic': 'Historic Prague Castle, medieval architecture, Charles Bridge, romantic Central European fairy-tale city atmosphere',
      'austin, texas': 'Austin skyline with modern buildings, live music scene energy, Texas hill country in background, vibrant cultural atmosphere'
    };

    // Use specific prompt if available, otherwise create a generic one
    if (specificPrompts[locationKey]) {
      return specificPrompts[locationKey];
    }

    // Generic prompt for cities not specifically mapped
    const countryStyle = this.getCountryStyle(country);
    return `Beautiful cityscape of ${city}, ${state ? state + ', ' : ''}${country}, ${countryStyle}, professional travel photography, golden hour lighting, authentic local atmosphere, high quality urban landscape`;
  }

  private getCountryStyle(country: string): string {
    const countryStyles: Record<string, string> = {
      'united states': 'modern American architecture, vibrant city life',
      'italy': 'historic Mediterranean architecture, warm Italian atmosphere',
      'france': 'elegant French architecture, romantic European charm',
      'united kingdom': 'classic British architecture, dramatic European sky',
      'japan': 'blend of traditional and modern Japanese architecture',
      'australia': 'modern coastal city atmosphere, bright blue skies',
      'spain': 'vibrant Mediterranean architecture, sunny Spanish atmosphere',
      'germany': 'historic German architecture, Central European charm',
      'hungary': 'historic Central European architecture, Danube River views',
      'czech republic': 'medieval Central European architecture, fairy-tale atmosphere'
    };

    return countryStyles[country.toLowerCase()] || 'beautiful local architecture, authentic cultural atmosphere';
  }
}

export const aiCityImageGenerator = new AICityImageGenerator();