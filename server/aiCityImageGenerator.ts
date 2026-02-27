import Anthropic from "@anthropic-ai/sdk";

// NOTE: OpenAI image generation has been replaced with Anthropic Claude.
// OpenAI references intentionally kept (commented) for rollback.
// import OpenAI from "openai";
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function svgToDataUrl(svg: string): string {
  const cleaned = svg.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`;
}

async function generateCityCoverSvg(prompt: string): Promise<string> {
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1200,
    system:
      "You generate a single safe inline SVG image (no scripts). Output ONLY the raw <svg>...</svg> markup. " +
      "Style should feel like a modern travel app hero: clean gradients, simple shapes, subtle skyline/landmark hints. " +
      "No external images, no foreignObject, no embedded fonts.",
    messages: [
      {
        role: "user",
        content:
          "Create an SVG cover image that matches this city image prompt:\n\n" +
          prompt +
          "\n\nConstraints:\n- 1200x600 viewBox\n- Include a subtle top-to-bottom gradient background\n- Add 2-4 abstract landmark/silhouette elements\n- Keep text out of the SVG\n- Output only <svg> markup",
      },
    ],
  });
  return response.content?.[0]?.text ?? "";
}

export class AICityImageGenerator {
  async generateCityImage(city: string, state: string, country: string): Promise<string | null> {
    try {
      // Create a descriptive prompt for the city
      const prompt = this.createCityImagePrompt(city, state, country);
      
      // Generate an SVG cover image using Claude (returned as data URL)
      const svg = await generateCityCoverSvg(prompt);
      if (!svg || !svg.includes("<svg")) return null;
      return svgToDataUrl(svg);
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