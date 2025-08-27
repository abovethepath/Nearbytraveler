import OpenAI from "openai";
import { storage } from './storage';

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
  city: string;
  state: string;
  country: string;
  zipcode?: string;
  maxParticipants: number;
  tags: string[];
  isPublic: boolean;
}

export async function generateCitySpecificEvents(cityName: string, state: string = 'TX', country: string = 'USA'): Promise<CityEvent[]> {
  try {
    console.log(`🤖 AI EVENT GENERATION: Creating events for ${cityName}, ${state}, ${country}`);
    
    // Create city-specific prompts for major cities
    let citySpecificExamples = '';
    if (cityName.toLowerCase().includes('new york') || cityName === 'NYC') {
      citySpecificExamples = `Examples for NYC:
      - "Empire State Building Evening Tour" at Empire State Building
      - "High Line Sunset Walk" along High Line Park  
      - "Madison Square Garden Knicks Game" at Madison Square Garden
      - "Central Park Picnic & Games" in Central Park
      - "Brooklyn Bridge Photography Walk" at Brooklyn Bridge
      - "Broadway Show: Hamilton" at Richard Rodgers Theatre
      - "MET Museum Modern Art Tour" at Metropolitan Museum`;
    } else if (cityName.toLowerCase().includes('los angeles') || cityName === 'LA') {
      citySpecificExamples = `Examples for Los Angeles:
      - "Dodgers vs Giants Baseball Game" at Dodger Stadium
      - "Lakers vs Warriors Basketball Game" at Crypto.com Arena
      - "Hollywood Sign Hiking Tour" at Griffith Park
      - "Santa Monica Pier Sunset Festival" at Santa Monica Pier
      - "Griffith Observatory Stargazing Night" at Griffith Observatory
      - "Venice Beach Volleyball Tournament" at Venice Beach
      - "Hollywood Walk of Fame Tour" on Hollywood Boulevard`;
    } else if (cityName.toLowerCase().includes('chicago')) {
      citySpecificExamples = `Examples for Chicago:
      - "Cubs Baseball Game" at Wrigley Field
      - "Bulls Basketball Game" at United Center  
      - "Navy Pier Fireworks Show" at Navy Pier
      - "Millennium Park Concert" at Millennium Park
      - "Art Institute of Chicago Tour" at Art Institute
      - "Chicago Architecture Boat Tour" on Chicago River
      - "Deep Dish Pizza Tour" in Lincoln Park`;
    } else {
      citySpecificExamples = `Focus on local landmarks, attractions, and cultural events specific to ${cityName}`;
    }
    
    const locationString = [cityName, state, country].filter(Boolean).join(', ');
    
    const prompt = `Generate 8-10 authentic, realistic events for ${locationString}. Include a mix of:

${citySpecificExamples}

CRITICAL REQUIREMENTS:
1. Events MUST be specific to ${cityName}'s unique culture, landmarks, and character
2. Use actual venue names and realistic locations in ${cityName}
3. Include exact addresses with realistic street names for ${cityName}
4. Set dates within the next 4 weeks (January-February 2025)
5. Make events diverse: sports, culture, food, outdoor, entertainment, community

For each event, provide realistic details:
- Specific venue names (real or believable)
- Exact street addresses appropriate for ${cityName}
- Appropriate pricing for the location and event type
- Realistic participant limits
- Relevant tags that include city-specific terms

Return ONLY valid JSON:

{
  "events": [
    {
      "title": "Event Name",
      "description": "Detailed description of the event and what to expect",
      "category": "Sports & Recreation|Arts & Culture|Food & Dining|Music & Concerts|Community & Social|Business & Networking|Tourism",
      "location": "Full venue address",
      "street": "123 Street Name",
      "city": "${cityName}",
      "state": "${state}",
      "country": "${country}",
      "zipcode": "12345",
      "date": "2025-01-XX",
      "endDate": "2025-01-XX",
      "price": 25,
      "maxParticipants": 100,
      "tags": ["${cityName.toLowerCase()}", "local", "specific-tag"],
      "isPublic": true
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are a local events expert who creates realistic, authentic events for specific cities. Always respond with valid JSON only."
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
      price: event.price || Math.floor(Math.random() * 50) + 15,
      city: cityName,
      state: state,
      country: country,
      zipcode: event.zipcode || '00000',
      maxParticipants: event.maxParticipants || 50,
      tags: Array.isArray(event.tags) ? event.tags : [cityName.toLowerCase(), 'local'],
      isPublic: event.isPublic !== false
    }));

  } catch (error) {
    console.error(`🚫 AI EVENT GENERATION ERROR for ${cityName}:`, error);
    return getFallbackEvents(cityName, state, country);
  }
}

function getRandomFutureDate(): string {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * (28 * 24 * 60 * 60 * 1000)); // Next 4 weeks
  return futureDate.toISOString();
}

function getFallbackEvents(cityName: string, state?: string, country?: string): CityEvent[] {
  // Fallback events if AI fails - handle undefined/null city names
  const safeCityName = cityName && cityName !== 'undefined' && cityName !== 'null' ? cityName : 'Local';
  
  return [
    {
      title: `${safeCityName} Community Meetup`,
      description: `Join locals for a community gathering in ${safeCityName}`,
      location: `${safeCityName} Community Center`,
      category: 'Community & Social',
      date: getRandomFutureDate(),
      price: 10,
      city: safeCityName,
      state: state || '',
      country: country || '',
      maxParticipants: 30,
      tags: [safeCityName.toLowerCase(), 'community'],
      isPublic: true
    },
    {
      title: `${safeCityName} Local Food Tour`,
      description: `Discover the best local cuisine ${safeCityName} has to offer`,
      location: `Downtown ${safeCityName}`,
      category: 'Food & Dining',
      date: getRandomFutureDate(),
      price: 35,
      city: safeCityName,
      state: state || '',
      country: country || '',
      maxParticipants: 20,
      tags: [safeCityName.toLowerCase(), 'food', 'local'],
      isPublic: true
    }
  ];
}

// Create events in database
export async function createAIEventsInDatabase(cityName: string, state: string = 'TX', country: string = 'USA') {
  try {
    console.log(`📅 Creating AI events in database for ${cityName}`);
    
    const aiEvents = await generateCitySpecificEvents(cityName, state, country);
    
    // Create events in database
    for (const aiEvent of aiEvents) {
      await storage.createEvent({
        title: aiEvent.title,
        description: aiEvent.description,
        location: aiEvent.location,
        city: aiEvent.city,
        state: aiEvent.state,
        zipcode: aiEvent.zipcode || '00000',
        date: new Date(aiEvent.date),
        endDate: aiEvent.endDate ? new Date(aiEvent.endDate) : null,
        category: aiEvent.category,
        imageUrl: null,
        organizerId: 1, // AI-generated events use system organizer ID
        maxParticipants: aiEvent.maxParticipants,
        isPublic: aiEvent.isPublic,
        tags: aiEvent.tags,
        requirements: '',
        street: aiEvent.street || ''
      });
    }
    
    console.log(`✅ Created ${aiEvents.length} AI-generated events for ${cityName}`);
    return aiEvents;
    
  } catch (error) {
    console.error(`❌ Error creating AI events for ${cityName}:`, error);
    return [];
  }
}