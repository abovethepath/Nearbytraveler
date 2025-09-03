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
  // DISABLED: Do not generate any fake events
  console.log(`⚠️ AI EVENT GENERATION DISABLED - refusing to create fake events for ${cityName}`);
  return [];
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

// DISABLED: Never create fake events claiming users as organizers
export async function createAIEventsInDatabase(cityName: string, state: string = 'TX', country: string = 'USA') {
  console.log(`⚠️ AI EVENT GENERATION DISABLED - refusing to create fake events for ${cityName}`);
  return [];
}