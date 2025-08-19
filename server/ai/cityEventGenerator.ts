import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CityEvent {
  title: string;
  description: string;
  location: string;
  category: string;
  date: string;
  endDate?: string;
  venueName?: string;
  street?: string;
  price?: number;
  imagePrompt?: string;
}

export async function generateCityEvents(cityName: string, state?: string, country?: string): Promise<CityEvent[]> {
  try {
    console.log(`🤖 AI EVENT GENERATION: Creating events for ${cityName}, ${state}, ${country}`);
    
    // Create a comprehensive prompt for city-specific events
    const locationString = [cityName, state, country].filter(Boolean).join(', ');
    
    const prompt = `Generate 8-12 authentic, realistic events for ${locationString}. Include a mix of:
- Famous landmarks and attractions (${cityName === 'New York City' ? 'Empire State Building, High Line, Madison Square Garden' : cityName.includes('Los Angeles') ? 'Hollywood Sign, Dodgers Stadium, Kings games' : 'local landmarks'})
- Professional sports games if applicable
- Cultural events and museums
- Local festivals and community events
- Food and dining experiences
- Outdoor activities specific to the area
- Music and entertainment venues

Make events feel authentic to ${locationString} with real venue names and locations when possible. Set dates within the next 6 weeks.

Respond with valid JSON array:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are a local events expert who creates realistic, authentic events for specific cities. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"events": []}');
    const events = result.events || [];
    
    console.log(`🤖 AI EVENT GENERATION: Generated ${events.length} events for ${cityName}`);
    
    // Process and enhance the events
    return events.map((event: any, index: number) => ({
      title: event.title || `${cityName} Event ${index + 1}`,
      description: event.description || `An exciting event in ${cityName}`,
      location: event.location || event.street || `${cityName}, ${state}`,
      category: event.category || 'Entertainment',
      date: event.date || getRandomFutureDate(),
      endDate: event.endDate || null,
      venueName: event.venueName || event.venue || null,
      street: event.street || event.address || null,
      price: event.price || Math.floor(Math.random() * 100) + 10,
      imagePrompt: event.imagePrompt || `${event.title} in ${cityName}`
    }));

  } catch (error) {
    console.error(`🚫 AI EVENT GENERATION ERROR for ${cityName}:`, error);
    return getFallbackEvents(cityName, state, country);
  }
}

function getRandomFutureDate(): string {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * (42 * 24 * 60 * 60 * 1000)); // Next 6 weeks
  return futureDate.toISOString();
}

function getFallbackEvents(cityName: string, state?: string, country?: string): CityEvent[] {
  // Fallback events if AI fails
  const locationString = [cityName, state].filter(Boolean).join(', ');
  
  return [
    {
      title: `${cityName} Walking Tour`,
      description: `Explore the best of ${cityName} on foot with local guides`,
      location: `Downtown ${cityName}`,
      category: 'Tourism',
      date: getRandomFutureDate(),
      price: 25
    },
    {
      title: `${cityName} Food Festival`,
      description: `Taste local cuisine and specialties from ${cityName}`,
      location: `${cityName} City Center`,
      category: 'Food & Dining',
      date: getRandomFutureDate(),
      price: 35
    },
    {
      title: `${cityName} Art Gallery Opening`,
      description: `Discover local artists and cultural exhibits in ${cityName}`,
      location: `${cityName} Arts District`,
      category: 'Arts & Culture',
      date: getRandomFutureDate(),
      price: 15
    }
  ];
}

// City-specific event templates for major cities
export const CITY_EVENT_TEMPLATES = {
  'New York City': {
    landmarks: ['Empire State Building', 'High Line', 'Central Park', 'Brooklyn Bridge'],
    venues: ['Madison Square Garden', 'Lincoln Center', 'Radio City Music Hall'],
    sports: ['Yankees', 'Mets', 'Knicks', 'Rangers', 'Giants', 'Jets'],
    neighborhoods: ['Times Square', 'SoHo', 'Greenwich Village', 'Williamsburg']
  },
  'Los Angeles': {
    landmarks: ['Hollywood Sign', 'Santa Monica Pier', 'Griffith Observatory', 'Walk of Fame'],
    venues: ['Dodger Stadium', 'Staples Center', 'Hollywood Bowl', 'Greek Theatre'],
    sports: ['Dodgers', 'Lakers', 'Kings', 'Clippers', 'Rams', 'Chargers'],
    neighborhoods: ['Hollywood', 'Santa Monica', 'Venice', 'Beverly Hills']
  },
  'Chicago': {
    landmarks: ['Millennium Park', 'Navy Pier', 'Willis Tower', 'Art Institute'],
    venues: ['Wrigley Field', 'United Center', 'Soldier Field'],
    sports: ['Cubs', 'White Sox', 'Bulls', 'Blackhawks', 'Bears'],
    neighborhoods: ['Loop', 'River North', 'Lincoln Park', 'Wicker Park']
  },
  'Austin': {
    landmarks: ['State Capitol', 'Lady Bird Lake', 'Zilker Park', 'South by Southwest'],
    venues: ['Austin City Limits', 'The Continental Club', 'Mohawk'],
    sports: ['FC Austin', 'Texas Longhorns'],
    neighborhoods: ['Downtown', 'South Austin', 'East Austin', '6th Street']
  }
};