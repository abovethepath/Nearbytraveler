import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { db, withRetry } from "./db";
import { eventReminderService } from "./services/eventReminderService";
import { TravelMatchingService } from "./services/matching";
import { businessProximityEngine } from "./businessProximityNotificationEngine";
import { 
  secretLocalExperienceLikes, 
  connections, 
  users, 
  messages, 
  travelPlans, 
  eventParticipants, 
  quickMeetupParticipants, 
  instagramPosts, 
  events, 
  quickMeetups, 
  cityPhotos,
  citychatrooms,
  chatroomMembers,
  businessOffers,
  cityPages,
  cityActivities,
  userCityInterests,
  businessInterestNotifications,
  references,
  userReferences,
  travelPersonalityProfiles
} from "../shared/schema";
import { sql, eq, or, count, and, ne, desc, gte, lte, lt, isNotNull, inArray, asc, ilike, like, isNull, gt } from "drizzle-orm";
import locationWidgetsRouter from "./routes/locationWidgets";
import { generateCityActivities } from './ai-city-activities.js';
import { ensureCityHasActivities, enhanceExistingCityWithMoreActivities } from './auto-city-setup.js';

// GLOBAL METROPOLITAN AREA CONSOLIDATION SYSTEM
// Comprehensive mapping of metropolitan areas worldwide

interface MetropolitanArea {
  mainCity: string;
  state?: string;
  country: string;
  cities: string[];
}

const GLOBAL_METROPOLITAN_AREAS: MetropolitanArea[] = [
  // Los Angeles Metropolitan Area
  {
    mainCity: 'Los Angeles',
    state: 'California',
    country: 'United States',
    cities: [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 
      'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 
      'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 
      'Compton', 'Downey', 'Pomona', 'Playa del Rey', 'Redondo Beach',
      'Culver City', 'Marina del Rey', 'Hermosa Beach', 'Hawthorne',
      'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier', 'Montebello',
      'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
      'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
      'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge',
      'Malibu', 'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City',
      'West LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz',
      'Silver Lake', 'Echo Park', 'Downtown LA', 'Arts District', 'Little Tokyo',
      'Chinatown', 'Boyle Heights', 'East LA', 'Highland Park', 'Eagle Rock',
      'Atwater Village', 'Glassell Park', 'Mount Washington', 'Cypress Park',
      'Sun Valley', 'Pacoima', 'Sylmar', 'Granada Hills', 'Porter Ranch',
      'Chatsworth', 'Canoga Park', 'Woodland Hills', 'Tarzana', 'Panorama City',
      'Mission Hills', 'Sepulveda', 'Arleta', 'San Pedro', 'Wilmington',
      'Harbor City', 'Harbor Gateway', 'Watts', 'South LA', 'Crenshaw',
      'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
    ]
  },
  
  // New York Metropolitan Area
  {
    mainCity: 'New York City',
    state: 'New York',
    country: 'United States',
    cities: [
      'New York City', 'New York', 'NYC', 'Manhattan', 'Brooklyn', 'Queens', 
      'Bronx', 'Staten Island', 'Long Island City', 'Astoria', 'Flushing',
      'Jamaica', 'Forest Hills', 'Williamsburg', 'Park Slope', 'DUMBO',
      'Brooklyn Heights', 'Red Hook', 'Greenpoint', 'Bushwick', 'Crown Heights',
      'Bay Ridge', 'Bensonhurst', 'Coney Island', 'Brighton Beach', 'Sheepshead Bay',
      'Harlem', 'East Harlem', 'Washington Heights', 'Inwood', 'Upper East Side',
      'Upper West Side', 'Midtown', 'Lower East Side', 'SoHo', 'Tribeca',
      'Greenwich Village', 'East Village', 'Chelsea', 'Hell\'s Kitchen', 'Financial District'
    ]
  },

  // San Francisco Bay Area
  {
    mainCity: 'San Francisco',
    state: 'California',
    country: 'United States',
    cities: [
      'San Francisco', 'Oakland', 'Berkeley', 'San Jose', 'Palo Alto', 'Mountain View',
      'Redwood City', 'Sunnyvale', 'Santa Clara', 'Fremont', 'Hayward', 'Richmond',
      'Daly City', 'South San Francisco', 'Pacifica', 'Half Moon Bay', 'San Mateo',
      'Foster City', 'Belmont', 'San Carlos', 'Menlo Park', 'Atherton', 'Portola Valley',
      'Los Altos', 'Cupertino', 'Campbell', 'Los Gatos', 'Saratoga', 'Monte Sereno',
      'Milpitas', 'Union City', 'Newark', 'Alameda', 'Emeryville', 'Piedmont',
      'Albany', 'El Cerrito', 'San Rafael', 'Novato', 'Mill Valley', 'Sausalito',
      'Tiburon', 'Corte Madera', 'Larkspur', 'San Anselmo', 'Fairfax', 'Ross'
    ]
  },

  // London Metropolitan Area
  {
    mainCity: 'London',
    country: 'United Kingdom',
    cities: [
      'London', 'Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets',
      'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth', 'Hammersmith',
      'Fulham', 'Kensington', 'Chelsea', 'City of London', 'Canary Wharf',
      'Shoreditch', 'Hoxton', 'Dalston', 'Clapham', 'Brixton', 'Putney',
      'Richmond', 'Kingston', 'Wimbledon', 'Croydon', 'Bromley', 'Bexley',
      'Dartford', 'Orpington', 'Beckenham', 'Crystal Palace', 'Dulwich',
      'Peckham', 'New Cross', 'Deptford', 'Bermondsey', 'London Bridge',
      'Borough', 'Elephant and Castle', 'Vauxhall', 'Battersea', 'Nine Elms'
    ]
  },

  // Paris Metropolitan Area
  {
    mainCity: 'Paris',
    country: 'France',
    cities: [
      'Paris', 'Versailles', 'Saint-Denis', 'Boulogne-Billancourt', 'Montreuil',
      'Nanterre', 'Créteil', 'Argenteuil', 'Levallois-Perret', 'Issy-les-Moulineaux',
      'Antony', 'Neuilly-sur-Seine', 'Clichy', 'Colombes', 'Aulnay-sous-Bois',
      'Rueil-Malmaison', 'Champigny-sur-Marne', 'Saint-Maur-des-Fossés', 'Asnières-sur-Seine',
      'Courbevoie', 'La Défense', 'Puteaux', 'Suresnes', 'Gennevilliers',
      'Vitry-sur-Seine', 'Ivry-sur-Seine', 'Le Kremlin-Bicêtre', 'Villejuif',
      'Cachan', 'Arcueil', 'Gentilly', 'Montrouge', 'Malakoff', 'Vanves',
      'Châtillon', 'Clamart', 'Meudon', 'Sèvres', 'Saint-Cloud', 'Garches'
    ]
  },

  // Tokyo Metropolitan Area
  {
    mainCity: 'Tokyo',
    country: 'Japan',
    cities: [
      'Tokyo', 'Shibuya', 'Shinjuku', 'Harajuku', 'Ginza', 'Akihabara',
      'Roppongi', 'Asakusa', 'Ueno', 'Ikebukuro', 'Akasaka', 'Marunouchi',
      'Nihonbashi', 'Tsukiji', 'Odaiba', 'Shinagawa', 'Meguro', 'Setagaya',
      'Shibuya-ku', 'Minato-ku', 'Chuo-ku', 'Chiyoda-ku', 'Taito-ku', 'Sumida-ku',
      'Koto-ku', 'Shinagawa-ku', 'Meguro-ku', 'Ota-ku', 'Setagaya-ku', 'Shibuya-ku',
      'Nakano-ku', 'Suginami-ku', 'Toshima-ku', 'Kita-ku', 'Arakawa-ku', 'Itabashi-ku',
      'Nerima-ku', 'Adachi-ku', 'Katsushika-ku', 'Edogawa-ku', 'Yokohama',
      'Kawasaki', 'Saitama', 'Chiba', 'Funabashi', 'Matsudo', 'Ichikawa'
    ]
  },

  // Madrid Metropolitan Area
  {
    mainCity: 'Madrid',
    country: 'Spain',
    cities: [
      'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés',
      'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas',
      'Las Rozas de Madrid', 'Pozuelo de Alarcón', 'San Sebastián de los Reyes',
      'Rivas-Vaciamadrid', 'Majadahonda', 'Coslada', 'Valdemoro', 'Arganda del Rey',
      'Collado Villalba', 'Boadilla del Monte', 'Pinto', 'San Fernando de Henares',
      'Tres Cantos', 'Mejorada del Campo', 'Velilla de San Antonio', 'Paracuellos de Jarama',
      'Daganzo de Arriba', 'Algete', 'El Escorial', 'San Lorenzo de El Escorial',
      'Galapagar', 'Torrelodones', 'Hoyo de Manzanares', 'Colmenar Viejo',
      'Miraflores de la Sierra', 'Soto del Real', 'Guadalix de la Sierra', 'Pedrezuela'
    ]
  },

  // Rome Metropolitan Area
  {
    mainCity: 'Rome',
    country: 'Italy',
    cities: [
      'Rome', 'Roma', 'Vatican City', 'Tivoli', 'Frascati', 'Albano Laziale',
      'Marino', 'Genzano di Roma', 'Velletri', 'Ciampino', 'Pomezia', 'Ardea',
      'Anzio', 'Nettuno', 'Aprilia', 'Latina', 'Guidonia Montecelio', 'Monterotondo',
      'Mentana', 'Fonte Nuova', 'Riano', 'Sacrofano', 'Formello', 'Campagnano di Roma',
      'Capena', 'Fiano Romano', 'Morlupo', 'Castelnuovo di Porto', 'Ponzano Romano',
      'Civitella San Paolo', 'Sant\'Oreste', 'Filacciano', 'Torrita Tiberina', 'Poggio Mirteto',
      'Fara in Sabina', 'Montopoli di Sabina', 'Poggio Nativo', 'Stimigliano', 'Tarano'
    ]
  },

  // Chicago Metropolitan Area
  {
    mainCity: 'Chicago',
    state: 'Illinois',
    country: 'United States',
    cities: [
      'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Peoria',
      'Elgin', 'Waukegan', 'Cicero', 'Champaign', 'Bloomington', 'Arlington Heights',
      'Evanston', 'Schaumburg', 'Bolingbrook', 'Palatine', 'Skokie', 'Des Plaines',
      'Orland Park', 'Tinley Park', 'Oak Lawn', 'Berwyn', 'Mount Prospect',
      'Normal', 'Wheaton', 'Hoffman Estates', 'Oak Park', 'Downers Grove',
      'Elmhurst', 'Glenview', 'Lombard', 'Buffalo Grove', 'Bartlett', 'Urbana',
      'Crystal Lake', 'Quincy', 'Streamwood', 'Carol Stream', 'Romeoville',
      'Plainfield', 'Hanover Park', 'Carpentersville', 'Wheeling', 'Park Ridge'
    ]
  },

  // Boston Metropolitan Area
  {
    mainCity: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    cities: [
      'Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford',
      'Brockton', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Lawrence',
      'Somerville', 'Framingham', 'Haverhill', 'Waltham', 'Malden', 'Brookline',
      'Plymouth', 'Medford', 'Taunton', 'Chicopee', 'Weymouth', 'Revere',
      'Peabody', 'Methuen', 'Barnstable', 'Pittsfield', 'Attleboro', 'Everett',
      'Salem', 'Westfield', 'Leominster', 'Fitchburg', 'Beverly', 'Holyoke',
      'Marlborough', 'Woburn', 'Amherst', 'Braintree', 'Shrewsbury', 'Chelsea'
    ]
  }
];

// Global metropolitan area consolidation function
function consolidateToMetropolitanArea(city: string, state?: string, country?: string): string {
  if (!city) return city;
  
  // Find matching metropolitan area
  for (const metro of GLOBAL_METROPOLITAN_AREAS) {
    // Check if this city belongs to this metropolitan area
    const cityMatch = metro.cities.some(metroCity => 
      metroCity.toLowerCase() === city.toLowerCase()
    );
    
    if (cityMatch) {
      // Additional validation for state/country if provided
      if (state && metro.state && metro.state.toLowerCase() !== state.toLowerCase()) {
        continue;
      }
      if (country && metro.country.toLowerCase() !== country.toLowerCase()) {
        continue;
      }
      
      console.log(`🌍 METRO CONSOLIDATION: ${city} → ${metro.mainCity}`);
      return metro.mainCity;
    }
  }
  
  // Return original city if no metropolitan area found
  return city;
}

// Get all cities in a metropolitan area
function getMetropolitanAreaCities(mainCity: string, state?: string, country?: string): string[] {
  for (const metro of GLOBAL_METROPOLITAN_AREAS) {
    if (metro.mainCity.toLowerCase() === mainCity.toLowerCase()) {
      // Additional validation for state/country if provided
      if (state && metro.state && metro.state.toLowerCase() !== state.toLowerCase()) {
        continue;
      }
      if (country && metro.country.toLowerCase() !== country.toLowerCase()) {
        continue;
      }
      
      return metro.cities;
    }
  }
  
  // Return just the main city if no metropolitan area found
  return [mainCity];
}

// Legacy functions for backwards compatibility
function consolidateToLAMetro(city: string, state?: string): string {
  return consolidateToMetropolitanArea(city, state, 'United States');
}

function getLAMetroCities(): string[] {
  const laMetro = GLOBAL_METROPOLITAN_AREAS.find(metro => 
    metro.mainCity === 'Los Angeles' && metro.country === 'United States'
  );
  return laMetro ? laMetro.cities : [];
}

// Instagram posting helper functions
async function handleInstagramPost(event: any, organizerId: number) {
  try {
    // Get user information
    const user = await storage.getUser(organizerId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create single Instagram post record for dual posting (user + @nearbytraveler)
    const instagramPost = await storage.createInstagramPost({
      eventId: event.id,
      userId: organizerId,
      postContent: generateEventCaption(event),
      imageUrl: event.imageUrl || null,
      userPostStatus: 'pending',
      nearbytravelerPostStatus: 'pending'
    });

    console.log('Instagram post created for dual posting event:', event.id);
    return instagramPost;
  } catch (error) {
    console.error('Failed to handle Instagram posting:', error);
    throw error;
  }
}

function generateEventCaption(event: any): string {
  return `🎉 ${event.title}\n\n📍 ${event.city}, ${event.state}\n📅 ${new Date(event.date).toLocaleDateString()}\n\n${event.description || 'Join us for an amazing event!'}\n\n#NearbyTraveler #${event.city.replace(/\s+/g, '')} #${event.category.replace(/\s+/g, '')}`;
}

function generateNearbytravelerCaption(event: any, user: any): string {
  return `🌟 Exciting event happening in ${event.city}!\n\n🎉 ${event.title}\n📍 ${event.city}, ${event.state}\n📅 ${new Date(event.date).toLocaleDateString()}\n👤 Organized by @${user.username}\n\n${event.description || 'Don\'t miss out on this amazing local experience!'}\n\n#NearbyTraveler #${event.city.replace(/\s+/g, '')} #TravelCommunity #LocalEvents`;
}

function generateEventHashtags(event: any): string[] {
  const baseHashtags = ['NearbyTraveler', 'TravelCommunity', 'LocalEvents'];
  const locationHashtags = [
    event.city.replace(/\s+/g, ''),
    event.state.replace(/\s+/g, ''),
    `${event.city.replace(/\s+/g, '')}${event.state.replace(/\s+/g, '')}`
  ];
  const categoryHashtags = [event.category.replace(/\s+/g, '')];

  return [...baseHashtags, ...locationHashtags, ...categoryHashtags];
}

// Get timezone for user's hometown city
function getUserTimezone(userCity?: string, userState?: string): string {
  if (!userCity) return 'America/Los_Angeles';

  const city = userCity.toUpperCase();
  const state = userState?.toUpperCase();

  // US timezone mapping by city and state
  const timezoneMap: Record<string, string> = {
    'LOS ANGELES': 'America/Los_Angeles',
    'SAN FRANCISCO': 'America/Los_Angeles', 
    'SEATTLE': 'America/Los_Angeles',
    'PORTLAND': 'America/Los_Angeles',
    'LAS VEGAS': 'America/Los_Angeles',
    'PHOENIX': 'America/Phoenix',
    'DENVER': 'America/Denver',
    'CHICAGO': 'America/Chicago',
    'AUSTIN': 'America/Chicago',
    'DALLAS': 'America/Chicago',
    'HOUSTON': 'America/Chicago',
    'NASHVILLE': 'America/Chicago',
    'NEW YORK': 'America/New_York',
    'BOSTON': 'America/New_York',
    'PHILADELPHIA': 'America/New_York',
    'MIAMI': 'America/New_York',
    'ATLANTA': 'America/New_York',
    'LONDON': 'Europe/London',
    'PARIS': 'Europe/Paris',
    'ROME': 'Europe/Rome',
    'BERLIN': 'Europe/Berlin',
    'MADRID': 'Europe/Madrid',
    'TOKYO': 'Asia/Tokyo',
    'SYDNEY': 'Australia/Sydney',
    'TORONTO': 'America/Toronto',
    'VANCOUVER': 'America/Vancouver'
  };

  // Check state-based defaults for US cities
  if (state) {
    const stateTimezones: Record<string, string> = {
      'CALIFORNIA': 'America/Los_Angeles',
      'WASHINGTON': 'America/Los_Angeles', 
      'OREGON': 'America/Los_Angeles',
      'NEVADA': 'America/Los_Angeles',
      'ARIZONA': 'America/Phoenix',
      'COLORADO': 'America/Denver',
      'ILLINOIS': 'America/Chicago',
      'TEXAS': 'America/Chicago',
      'TENNESSEE': 'America/Chicago',
      'NEW YORK': 'America/New_York',
      'MASSACHUSETTS': 'America/New_York',
      'PENNSYLVANIA': 'America/New_York',
      'FLORIDA': 'America/New_York',
      'GEORGIA': 'America/New_York'
    };
    return stateTimezones[state] || timezoneMap[city] || 'America/Los_Angeles';
  }

  return timezoneMap[city] || 'America/Los_Angeles';
}

// Get tomorrow end-of-day in user's hometown timezone
function getTomorrowInUserTimezone(userCity?: string, userState?: string): Date {
  const timezone = getUserTimezone(userCity, userState);

  // Get current time in user's timezone
  const nowInUserTz = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));

  // Add one day and set to end of day (23:59:59.999)
  const tomorrow = new Date(nowInUserTz);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  return tomorrow;
}

import { insertUserSchema, insertConnectionSchema, insertMessageSchema, insertEventSchema, insertUserPhotoSchema, insertTravelPlanSchema, insertEventParticipantSchema, insertAiRecommendationSchema, insertCityLandmarkSchema, insertLandmarkRatingSchema, insertUserTravelPreferencesSchema } from "@shared/schema";
import { recommendationService } from "./services/recommendations";
import { matchingService } from "./services/matching";
import { aiTravelCompanion } from "./services/aiTravelCompanion";
import { AiRecommendationService } from "./services/aiRecommendationService";
import { UserTransitionService } from "./services/user-transition";
import { TravelStatusService } from "./services/travel-status-service";
import { aiEventGenerator } from "./aiEventGenerator";
import { aiBusinessGenerator } from "./aiBusinessGenerator";
import { z } from "zod";
import OpenAI from "openai";
import { normalizeLocation } from "./locationNormalizer";

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

// AI content generation function using OpenAI API
async function generateCityContent(location: string, topic: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `Information about ${topic} in ${location} will be added by community members.`;
  }

  try {
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
            content: 'You are a travel guide expert. Provide accurate, helpful, and current information about destinations. Write in a friendly but informative tone suitable for travelers. Include specific names, locations, and practical details.'
          },
          {
            role: 'user',
            content: `Write a comprehensive guide about ${topic} in ${location}. Include specific recommendations with names and locations. Keep it informative but engaging, around 200-300 words. Focus on current, accurate information.`
          }
        ],
        max_tokens: 400,
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || `Information about ${topic} in ${location} will be added by community members.`;
  } catch (error) {
    console.error('Error generating AI content:', error);
    return `Information about ${topic} in ${location} will be added by community members.`;
  }
}

export async function registerRoutes(app: Express): Promise<Express> {
  console.log("Starting routes registration...");

  // CRITICAL: Register location widgets routes
  app.use(locationWidgetsRouter);
  console.log("Location widgets routes registered");

  // Serve static files from attached_assets directory
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  console.log("Static file serving configured for attached_assets");

  // Weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      const { city, state, country } = req.query;

      if (!city || !country) {
        return res.status(400).json({ message: "City and country parameters are required" });
      }

      console.log(`🌤️ WEATHER: Getting weather for ${city}, ${state}, ${country}`);

      // Use real weather API with the available WEATHER_API_KEY
      const weatherApiKey = process.env.WEATHER_API_KEY;
      
      if (!weatherApiKey) {
        console.error('Weather API key not configured');
        return res.status(500).json({ message: "Weather service not configured" });
      }

      // Build location query - prioritize city, state format for US locations
      let locationQuery = city;
      if (state && (country.toLowerCase().includes('united states') || country.toLowerCase().includes('usa'))) {
        locationQuery = `${city}, ${state}`;
      } else if (country && !city.includes(country)) {
        locationQuery = `${city}, ${country}`;
      }
      
      console.log(`🌤️ WEATHER: Fetching real weather data for "${locationQuery}"`);
      console.log(`🔑 WEATHER: Using API key: ${weatherApiKey ? 'Present' : 'Missing'}`);
      
      // Call WeatherAPI.com (free tier available)
      const weatherApiUrl = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${encodeURIComponent(locationQuery)}&aqi=no`;
      console.log(`🌐 WEATHER: Making request to: ${weatherApiUrl.replace(weatherApiKey, 'API_KEY_HIDDEN')}`);
      
      const weatherResponse = await fetch(weatherApiUrl);
      console.log(`📡 WEATHER: Response status: ${weatherResponse.status} ${weatherResponse.statusText}`);
      
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        console.error(`❌ Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
        console.error(`❌ Weather API response: ${errorText}`);
        throw new Error(`Weather API returned ${weatherResponse.status}: ${errorText}`);
      }
      
      const weatherData = await weatherResponse.json();
      console.log(`✅ WEATHER: Received data for ${weatherData?.location?.name}, temp: ${weatherData?.current?.temp_f}°F`);

      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // FIXED: City stats endpoint based on actual user data
  app.get("/api/city-stats", async (req, res) => {
    try {
      console.log("🏙️ FIXED CITY SYSTEM: Loading cities based on actual user data");

      // Get unique cities where users actually live or are traveling to
      const uniqueCitiesQuery = await db.execute(sql`
        SELECT DISTINCT city_name as city, '' as state, 'United States' as country FROM (
          SELECT DISTINCT hometown_city as city_name FROM users WHERE hometown_city IS NOT NULL AND hometown_city != ''
          UNION
          SELECT DISTINCT substring(destination from '^([^,]+)') as city_name FROM travel_plans WHERE destination IS NOT NULL AND destination != ''
          UNION
          SELECT DISTINCT substring(travel_destination from '^([^,]+)') as city_name FROM users WHERE travel_destination IS NOT NULL AND travel_destination != ''
        ) cities
        WHERE city_name IS NOT NULL AND city_name != ''
        ORDER BY city_name
      `);

      // Consolidate LA metro cities into "Los Angeles"
      const laMetroCities = [
        'Playa del Rey', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
        'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank',
        'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey',
        'Pomona', 'Redondo Beach', 'Culver City', 'Marina del Rey', 'Hermosa Beach',
        'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier',
        'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
        'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City', 'Sherman Oaks',
        'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu', 'Pacific Palisades',
        'Brentwood', 'Westwood', 'Century City', 'West LA', 'Koreatown', 'Mid-City',
        'Miracle Mile', 'Los Feliz', 'Silver Lake', 'Echo Park', 'Downtown LA',
        'Arts District', 'Little Tokyo', 'Chinatown', 'Boyle Heights', 'East LA',
        'Highland Park', 'Eagle Rock', 'Atwater Village', 'Glassell Park',
        'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima', 'Sylmar',
        'Granada Hills', 'Porter Ranch', 'Chatsworth', 'Canoga Park', 'Woodland Hills',
        'Tarzana', 'Panorama City', 'Mission Hills', 'Sepulveda', 'Arleta',
        'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway', 'Watts',
        'South LA', 'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
      ];

      const rawCities = uniqueCitiesQuery.rows.map((row: any) => row.city);
      const consolidatedCities = new Set<string>();
      
      // Check each city and consolidate LA metro
      rawCities.forEach(city => {
        if (laMetroCities.includes(city)) {
          consolidatedCities.add('Los Angeles');
        } else {
          consolidatedCities.add(city);
        }
      });

      const actualCities = Array.from(consolidatedCities);

      const citiesWithStats = await Promise.all(
        actualCities.map(async (cityName: string) => {
          try {
            let localUsersResult, businessUsersResult, travelPlansResult, currentTravelersResult, eventsResult;

            if (cityName === 'Los Angeles') {
              // For Los Angeles, count users from ALL metro cities
              const laMetroCities = [
                'Playa del Rey', 'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
                'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank',
                'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey',
                'Pomona', 'Redondo Beach', 'Culver City', 'Marina del Rey', 'Hermosa Beach',
                'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier',
                'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
                'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City', 'Sherman Oaks',
                'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu', 'Pacific Palisades',
                'Brentwood', 'Westwood', 'Century City', 'West LA', 'Koreatown', 'Mid-City',
                'Miracle Mile', 'Los Feliz', 'Silver Lake', 'Echo Park', 'Downtown LA',
                'Arts District', 'Little Tokyo', 'Chinatown', 'Boyle Heights', 'East LA',
                'Highland Park', 'Eagle Rock', 'Atwater Village', 'Glassell Park',
                'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima', 'Sylmar',
                'Granada Hills', 'Porter Ranch', 'Chatsworth', 'Canoga Park', 'Woodland Hills',
                'Tarzana', 'Panorama City', 'Mission Hills', 'Sepulveda', 'Arleta',
                'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway', 'Watts',
                'South LA', 'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
              ];

              // Count locals from all LA metro cities
              localUsersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    or(
                      ...laMetroCities.map(city => eq(users.hometownCity, city))
                    ),
                    eq(users.userType, 'local')
                  )
                );

              // Count businesses from all LA metro cities
              businessUsersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    or(
                      ...laMetroCities.map(city => eq(users.hometownCity, city))
                    ),
                    eq(users.userType, 'business')
                  )
                );

              // Count travelers to any LA metro city
              travelPlansResult = await db
                .select({ count: count() })
                .from(travelPlans)
                .where(
                  or(
                    ...laMetroCities.map(city => ilike(travelPlans.destination, `%${city}%`))
                  )
                );

              currentTravelersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    or(
                      ...laMetroCities.map(city => ilike(users.travelDestination, `%${city}%`))
                    ),
                    eq(users.isCurrentlyTraveling, true)
                  )
                );

              // Count events in any LA metro city
              eventsResult = await db
                .select({ count: count() })
                .from(events)
                .where(
                  or(
                    ...laMetroCities.map(city => ilike(events.city, `%${city}%`))
                  )
                );
            } else {
              // For non-LA cities, use exact matching
              localUsersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    eq(users.hometownCity, cityName),
                    eq(users.userType, 'local')
                  )
                );

              businessUsersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    eq(users.hometownCity, cityName),
                    eq(users.userType, 'business')
                  )
                );

              travelPlansResult = await db
                .select({ count: count() })
                .from(travelPlans)
                .where(ilike(travelPlans.destination, `%${cityName}%`));

              currentTravelersResult = await db
                .select({ count: count() })
                .from(users)
                .where(
                  and(
                    ilike(users.travelDestination, `%${cityName}%`),
                    eq(users.isCurrentlyTraveling, true)
                  )
                );

              eventsResult = await db
                .select({ count: count() })
                .from(events)
                .where(ilike(events.city, `%${cityName}%`));
            }

            const localCount = localUsersResult[0]?.count || 0;
            const businessCount = businessUsersResult[0]?.count || 0;
            const travelerCount = (travelPlansResult[0]?.count || 0) + (currentTravelersResult[0]?.count || 0);
            const eventCount = eventsResult[0]?.count || 0;

            return {
              city: cityName,
              state: '',
              country: 'United States',
              localCount,
              travelerCount,
              businessCount,
              eventCount,
              description: `Discover ${cityName}`,
              highlights: [`${localCount} locals`, `${travelerCount} travelers`, `${businessCount} businesses`, `${eventCount} events`],
              hasSecretExperiences: true,
              hasChatRooms: true,
              hasPhotos: true
            };
          } catch (error) {
            console.error(`Error processing city ${cityName}:`, error);
            return {
              city: cityName,
              state: '',
              country: 'United States',
              localCount: 0,
              travelerCount: 0,
              businessCount: 0,
              eventCount: 0,
              description: `Discover ${cityName}`,
              highlights: ['0 locals', '0 travelers', '0 events'],
              hasSecretExperiences: true,
              hasChatRooms: true,
              hasPhotos: true
            };
          }
        })
      );

      // Sort by total activity
      citiesWithStats.sort((a, b) => 
        (b.localCount + b.travelerCount + b.eventCount) - (a.localCount + a.travelerCount + a.eventCount)
      );

      console.log(`🏙️ FIXED: Returning ${citiesWithStats.length} cities based on actual user data (LA metro consolidated)`);
      res.json(citiesWithStats);
    } catch (error) {
      console.error("Error fetching working city stats:", error);
      res.status(500).json({ message: "Failed to fetch city statistics", error: error.message });
    }
  });

  // City-specific stats endpoint for individual city pages  
  app.get("/api/city-stats/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const { state, country } = req.query;

      console.log(`🏙️ CITY STATS SPECIFIC: Getting stats for ${city}, ${state}, ${country}`);

      let localUsersResult, businessUsersResult, travelPlansResult, currentTravelersResult, eventsResult;

      if (city === 'Los Angeles') {
        // For Los Angeles city page, include ALL LA metro cities
        const laMetroCities = [
          'Playa del Rey', 'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
          'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank',
          'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey',
          'Pomona', 'Redondo Beach', 'Culver City', 'Marina del Rey', 'Hermosa Beach',
          'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier',
          'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
          'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City', 'Sherman Oaks',
          'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu', 'Pacific Palisades',
          'Brentwood', 'Westwood', 'Century City', 'West LA', 'Koreatown', 'Mid-City',
          'Miracle Mile', 'Los Feliz', 'Silver Lake', 'Echo Park', 'Downtown LA',
          'Arts District', 'Little Tokyo', 'Chinatown', 'Boyle Heights', 'East LA',
          'Highland Park', 'Eagle Rock', 'Atwater Village', 'Glassell Park',
          'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima', 'Sylmar',
          'Granada Hills', 'Porter Ranch', 'Chatsworth', 'Canoga Park', 'Woodland Hills',
          'Tarzana', 'Panorama City', 'Mission Hills', 'Sepulveda', 'Arleta',
          'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway', 'Watts',
          'South LA', 'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
        ];

        // Count locals from all LA metro cities
        localUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              or(
                ...laMetroCities.map(cityName => eq(users.hometownCity, cityName))
              ),
              eq(users.userType, 'local')
            )
          );

        businessUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              or(
                ...laMetroCities.map(cityName => eq(users.hometownCity, cityName))
              ),
              eq(users.userType, 'business')
            )
          );

        travelPlansResult = await db
          .select({ count: count() })
          .from(travelPlans)
          .where(
            or(
              ...laMetroCities.map(cityName => ilike(travelPlans.destination, `%${cityName}%`))
            )
          );

        currentTravelersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              or(
                ...laMetroCities.map(cityName => ilike(users.travelDestination, `%${cityName}%`))
              ),
              eq(users.isCurrentlyTraveling, true)
            )
          );

        eventsResult = await db
          .select({ count: count() })
          .from(events)
          .where(
            or(
              ...laMetroCities.map(cityName => ilike(events.city, `%${cityName}%`))
            )
          );

      } else {
        // For other cities, use exact matching
        localUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              ilike(users.hometownCity, `%${city}%`),
              eq(users.userType, 'local')
            )
          );

        businessUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              ilike(users.hometownCity, `%${city}%`),
              eq(users.userType, 'business')
            )
          );

        travelPlansResult = await db
          .select({ count: count() })
          .from(travelPlans)
          .where(ilike(travelPlans.destination, `%${city}%`));

        currentTravelersResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              ilike(users.travelDestination, `%${city}%`),
              eq(users.isCurrentlyTraveling, true)
            )
          );

        eventsResult = await db
          .select({ count: count() })
          .from(events)
          .where(ilike(events.city, `%${city}%`));
      }

      const localCount = localUsersResult[0]?.count || 0;
      const businessCount = businessUsersResult[0]?.count || 0;
      const travelerCount = (travelPlansResult[0]?.count || 0) + (currentTravelersResult[0]?.count || 0);
      const eventCount = eventsResult[0]?.count || 0;

      const cityStats = {
        city: city,
        state: state || '',
        country: country || '',
        localCount,
        travelerCount,
        businessCount,
        eventCount
      };

      console.log(`🏙️ CITY STATS SPECIFIC: Found stats for ${city}:`, cityStats);
      res.json(cityStats);
    } catch (error) {
      console.error("Error fetching city stats:", error);
      res.status(500).json({ message: "Failed to fetch city stats" });
    }
  });

  // RESTORED: Secret experiences endpoint that was working when locals signed up
  app.get("/api/secret-experiences/:city/", async (req, res) => {
    try {
      const { city } = req.params;
      const { state, country } = req.query;

      console.log(` SECRET EXPERIENCES: Loading for ${city}, ${state}, ${country}`);

      const experiences = await storage.getSecretLocalExperiencesByCity(
        city as string, 
        state as string || null, 
        country as string || null
      );

      console.log(` SECRET EXPERIENCES: Found ${experiences.length} secret activities for ${city}`);
      res.json(experiences);
    } catch (error) {
      console.error("Error fetching secret experiences:", error);
      res.status(500).json({ message: "Failed to fetch secret experiences", error: error.message });
    }
  });

  // RESTORED: Secret experience like endpoint
  app.post("/api/secret-experiences/:experienceId/like", async (req, res) => {
    try {
      const { experienceId } = req.params;
      const { userId } = req.body;

      console.log('🔥 LIKE API: Received like request', { experienceId, userId, type: typeof experienceId });

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const experienceIdNum = parseInt(experienceId);
      const userIdNum = parseInt(userId);

      console.log('🔥 LIKE API: Parsed IDs', { experienceIdNum, userIdNum });

      const updatedExperience = await storage.likeSecretLocalExperience(
        experienceIdNum, 
        userIdNum
      );

      console.log('🔥 LIKE API: Storage result', updatedExperience ? 'SUCCESS' : 'FAILED');

      if (!updatedExperience) {
        return res.status(404).json({ message: "Experience not found or already liked" });
      }

      res.json(updatedExperience);
    } catch (error) {
      console.error("🔥 LIKE API ERROR:", error);
      res.status(500).json({ message: "Failed to like experience", error: error.message });
    }
  });

  // Statistics endpoint - returns real data from database
  app.get("/api/stats/platform", async (req, res) => {
    try {
      // Count successful connections (accepted status)
      const [successfulMatches] = await db
        .select({ count: count() })
        .from(connections)
        .where(eq(connections.status, 'accepted'));

      // Count all users who have joined the platform
      const [activeTravelers] = await db
        .select({ count: count() })
        .from(users);

      // Count unique destinations from travel plans
      const destinationsResult = await db
        .select({ destination: travelPlans.destination })
        .from(travelPlans)
        .groupBy(travelPlans.destination);

      // Count total event participations on the platform
      const [eventsShared] = await db
        .select({ count: count() })
        .from(eventParticipants);

      res.json({
        successfulMatches: successfulMatches.count,
        activeTravelers: activeTravelers.count,
        destinationsCovered: destinationsResult.length,
        eventsShared: eventsShared.count
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  // Initialize chatrooms asynchronously (non-blocking)
  console.log("Starting routes registration...");
  storage.ensureMeetLocalsChatrooms()
    .then(() => console.log("Chatrooms initialization completed"))
    .catch(err => console.error("Chatrooms initialization failed:", err));

  // CRITICAL: Get users by location and type endpoint with LA Metro consolidation - must come before parameterized routes
  app.get("/api/users-by-location/:city/:userType", async (req, res) => {
    try {
      const { city, userType } = req.params;
      const { state, country } = req.query;
      
      console.log(`Users by location endpoint: ${city}, ${userType}, state: ${state}, country: ${country}`);
      
      // Apply global metropolitan area consolidation to search location
      const searchCity = decodeURIComponent(city);
      const consolidatedSearchCity = consolidateToMetropolitanArea(searchCity, state as string, country as string);
      
      // Build location string for search
      let searchLocation = searchCity;
      if (state) searchLocation += `, ${state}`;
      if (country) searchLocation += `, ${country}`;
      
      // If searching for a metro area city, search for the main metropolitan city
      let finalSearchLocation = searchLocation;
      if (consolidatedSearchCity !== searchCity) {
        finalSearchLocation = searchLocation.replace(searchCity, consolidatedSearchCity);
        console.log(`🌍 METRO: Redirecting search from ${searchCity} to ${consolidatedSearchCity}`);
      }
      
      // Get users from primary search
      let users = await storage.getUsersByLocationAndType(
        consolidatedSearchCity,
        state as string || null,
        country as string || null,
        userType
      );
      
      // If searching for a metropolitan area, also search for all cities in that metro area
      if (consolidatedSearchCity !== searchCity) {
        const allMetroUsers = [];
        const allUserIds = new Set(users.map(user => user.id));
        
        for (const metroCity of getMetropolitanAreaCities(consolidatedSearchCity, state as string, country as string)) {
          if (metroCity !== consolidatedSearchCity) {
            const metroUsers = await storage.getUsersByLocationAndType(
              metroCity,
              state as string || null,
              country as string || null,
              userType
            );
            
            // Add only users we haven't seen yet
            for (const user of metroUsers) {
              if (!allUserIds.has(user.id)) {
                allUserIds.add(user.id);
                allMetroUsers.push(user);
              }
            }
          }
        }
        
        // Combine all metro area users while preserving original city names
        users = [...users, ...allMetroUsers];
        console.log(`🌍 METRO: Combined ${users.length} users from all ${consolidatedSearchCity} metro cities`);
        
        // Keep original city names - users maintain their individual identities
      }
      
      console.log(`Found ${users.length} users for location: ${finalSearchLocation}, type: ${userType}`);
      res.json(users);
    } catch (error) {
      console.error("Error in users-by-location endpoint:", error);
      res.status(500).json({ message: "Failed to fetch users by location", error });
    }
  });

  // Search users by location endpoint with LA Metro consolidation - must come before parameterized routes
  app.get("/api/users/search-by-location", async (req, res) => {
    try {
      console.log("Search by location endpoint hit with query:", req.query);
      const { location, userType } = req.query;

      if (!location) {
        return res.status(400).json({ message: "Location is required" });
      }

      // Get current user ID from headers (set by frontend)
      const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string) : null;

      // Apply global metropolitan area consolidation to search location
      const searchLocation = location as string;
      const locationParts = searchLocation.split(',').map(part => part.trim());
      const [searchCity, searchState, searchCountry] = locationParts;
      const consolidatedSearchCity = consolidateToMetropolitanArea(searchCity, searchState, searchCountry);
      
      // If searching for a metro area city, search for the main metropolitan city
      let finalSearchLocation = searchLocation;
      if (consolidatedSearchCity !== searchCity) {
        finalSearchLocation = searchLocation.replace(searchCity, consolidatedSearchCity);
        console.log(`🌍 METRO: Redirecting search from ${searchCity} to ${consolidatedSearchCity}`);
      }
      
      // Use the working direct search method
      let users = await storage.searchUsersByLocationDirect(finalSearchLocation, userType as string);
      
      // If searching for a metropolitan area, also search for all cities in that metro area
      if (consolidatedSearchCity !== searchCity) {
        const allMetroUsers = [];
        const allUserIds = new Set(users.map(user => user.id));
        
        for (const metroCity of getMetropolitanAreaCities(consolidatedSearchCity, searchState, searchCountry)) {
          if (metroCity !== consolidatedSearchCity) {
            const metroCityLocation = finalSearchLocation.replace(consolidatedSearchCity, metroCity);
            const metroUsers = await storage.searchUsersByLocationDirect(metroCityLocation, userType as string);
            
            // Add only users we haven't seen yet
            for (const user of metroUsers) {
              if (!allUserIds.has(user.id)) {
                allUserIds.add(user.id);
                allMetroUsers.push(user);
              }
            }
          }
        }
        
        // Combine all metro area users while preserving their original city names
        users = [...users, ...allMetroUsers];
        console.log(`🌍 METRO: Combined ${users.length} users from all ${consolidatedSearchCity} metro cities`);
        
        // Keep original city names - users maintain their individual identities
      }

      // CRITICAL: Always include current user if they are from this location (hometown search)
      if (currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (currentUser) {
          const userHometown = `${currentUser.hometownCity}, ${currentUser.hometownState}, ${currentUser.hometownCountry}`;
          const currentUserCity = currentUser.hometownCity || '';
          const consolidatedUserCity = consolidateToMetropolitanArea(currentUserCity, currentUser.hometownState || '', currentUser.hometownCountry || '');
          
          // Check if current user should be included in this search
          const shouldIncludeCurrentUser = 
            (consolidatedSearchCity === consolidatedUserCity) ||
            (userHometown.toLowerCase().includes(searchLocation.toLowerCase())) ||
            (searchLocation.toLowerCase().includes(currentUserCity.toLowerCase()));
          
          if (shouldIncludeCurrentUser && !users.some(u => u.id === currentUserId)) {
            console.log(`👤 HOMETOWN SEARCH: Including current user ${currentUser.username} from ${currentUserCity} in ${searchLocation} results`);
            users.unshift(currentUser); // Add current user at the beginning
          }
        }
      }
      
      console.log(`CONNECTIONS FIXED: Found ${users.length} users for location: ${finalSearchLocation}, type: ${userType}`);
      res.json(users);
    } catch (error) {
      console.error("Failed to search users by location:", error);
      res.status(500).json({ message: "Failed to search users by location", error });
    }
  });

  // NOTE: This route moved below to avoid conflict with /api/users/search

  // Initialize sample data route (for restoring lost data)
  app.post("/api/admin/init-data", async (req, res) => {
    try {
      // await storage.initializeSampleData(); // Method not available
      res.json({ message: "Sample data initialized successfully" });
    } catch (error) {
      console.error("Error initializing sample data:", error);
      res.status(500).json({ message: "Failed to initialize sample data", error });
    }
  });

  // Consolidate NYC locations route
  app.post("/api/admin/consolidate-nyc", async (req, res) => {
    try {
      console.log("🗽 Starting NYC location consolidation...");

      // NYC variations to consolidate
      const nycVariations = [
        'Manhattan',
        'Brooklyn', 
        'Queens',
        'Bronx',
        'Staten Island',
        'NYC',
        'New York'
      ];

      let totalUpdated = 0;

      // Update users hometown cities
      for (const variation of nycVariations) {
        const usersToUpdate = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.hometownCity, variation),
              ilike(users.hometownCity, `%${variation}%`)
            )
          );

        if (usersToUpdate.length > 0) {
          await db
            .update(users)
            .set({ 
              hometownCity: 'New York City',
              location: 'New York City, New York',
              hometown: 'New York City, New York, United States'
            })
            .where(
              or(
                eq(users.hometownCity, variation),
                ilike(users.hometownCity, `%${variation}%`)
              )
            );

          console.log(`Updated ${usersToUpdate.length} users from ${variation} to New York City`);
          totalUpdated += usersToUpdate.length;
        }
      }

      console.log("🎉 NYC location consolidation completed!");
      res.json({ 
        message: "NYC locations consolidated successfully", 
        totalUsersUpdated: totalUpdated 
      });
    } catch (error) {
      console.error("Error consolidating NYC locations:", error);
      res.status(500).json({ message: "Failed to consolidate NYC locations", error: error.message });
    }
  });

  // Consolidate Los Angeles metropolitan area locations route
  app.post("/api/admin/consolidate-la", async (req, res) => {
    try {
      console.log("🌴 Starting LA metropolitan area consolidation...");

      let totalUpdated = 0;

      // Update users hometown cities to Los Angeles
      for (const laCity of getMetropolitanAreaCities('Los Angeles', 'California', 'United States')) {
        if (laCity !== 'Los Angeles') { // Don't update users already in Los Angeles
          const usersToUpdate = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.hometownCity, laCity),
                eq(users.hometownState, 'California')
              )
            );

          if (usersToUpdate.length > 0) {
            console.log(`🌴 LA METRO: Updating ${usersToUpdate.length} users from ${laCity} to Los Angeles`);
            
            await db
              .update(users)
              .set({ 
                hometownCity: 'Los Angeles',
                location: 'Los Angeles, California, United States'
              })
              .where(
                and(
                  eq(users.hometownCity, laCity),
                  eq(users.hometownState, 'California')
                )
              );
            
            totalUpdated += usersToUpdate.length;
          }
        }
      }

      // Update business locations
      const businessesToUpdate = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.userType, 'business'),
            eq(users.businessState, 'California'),
            inArray(users.businessCity, getMetropolitanAreaCities('Los Angeles', 'California', 'United States').filter(city => city !== 'Los Angeles'))
          )
        );

      if (businessesToUpdate.length > 0) {
        console.log(`🌴 LA METRO: Updating ${businessesToUpdate.length} business locations to Los Angeles`);
        
        for (const business of businessesToUpdate) {
          await db
            .update(users)
            .set({ businessCity: 'Los Angeles' })
            .where(eq(users.id, business.id));
        }
        
        totalUpdated += businessesToUpdate.length;
      }

      // Update travel plans destination cities
      const travelPlansToUpdate = await db
        .select()
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.destinationState, 'California'),
            inArray(travelPlans.destinationCity, getMetropolitanAreaCities('Los Angeles', 'California', 'United States').filter(city => city !== 'Los Angeles'))
          )
        );

      if (travelPlansToUpdate.length > 0) {
        console.log(`🌴 LA METRO: Updating ${travelPlansToUpdate.length} travel plan destinations to Los Angeles`);
        
        for (const plan of travelPlansToUpdate) {
          await db
            .update(travelPlans)
            .set({ destinationCity: 'Los Angeles' })
            .where(eq(travelPlans.id, plan.id));
        }
      }

      console.log("🌴 LA metropolitan area consolidation completed!");
      res.json({ 
        message: "LA metropolitan area consolidated successfully", 
        totalRecordsUpdated: totalUpdated 
      });
    } catch (error) {
      console.error("Error consolidating LA metropolitan area:", error);
      res.status(500).json({ message: "Failed to consolidate LA metropolitan area", error: error.message });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      console.log("Login attempt for:", email);

      // Try to find user by email or username
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.getUserByUsername(email);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid email/username or password" });
      }

      // For demo purposes, check password directly
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid email/username or password" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
        token: 'auth_token_' + user.id
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(400).json({ message: "Login failed. Please check your credentials." });
    }
  });

  // Email validation endpoint
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "An account with this email already exists. Please use a different email or try logging in.",
          exists: true
        });
      }

      res.json({ exists: false });
    } catch (error) {
      console.error("Email check error:", error);
      res.status(500).json({ message: "Failed to check email availability" });
    }
  });

  // Quick login endpoint for development
  app.post("/api/quick-login/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Quick login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Add city-specific interest to user profile
  app.post("/api/user/add-interest", async (req, res) => {
    try {
      const { userId, type, item } = req.body;

      if (!userId || !type || !item) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current user data
      let currentItems = user[type] || [];

      // Add item if not already present
      if (!currentItems.includes(item)) {
        currentItems = [...currentItems, item];

        // Update user in database
        const updateData = { [type]: currentItems };
        await storage.updateUser(userId, updateData);

        res.json({ 
          success: true, 
          message: `Added "${item}" to your ${type}`,
          updatedItems: currentItems 
        });
      } else {
        res.json({ 
          success: true, 
          message: `"${item}" is already in your ${type}`,
          updatedItems: currentItems 
        });
      }
    } catch (error) {
      console.error("Error adding interest to user:", error);
      res.status(500).json({ message: "Failed to add interest" });
    }
  });

  // Username validation endpoint (GET version for URL params)
  app.get("/api/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Check for username case-insensitively  
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "This username is already taken. Please choose a different one.",
          exists: true,
          available: false
        });
      }

      res.json({ exists: false, available: true });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Username validation endpoint (POST version for body params)
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Check for username case-insensitively  
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "This username is already taken. Please choose a different username.",
          exists: true,
          available: false
        });
      }

      res.json({ exists: false, available: true });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Shared registration handler
  const handleRegistration = async (req: any, res: any) => {
    try {
      console.log("🔍 FULL REGISTRATION DATA RECEIVED:", JSON.stringify(req.body, null, 2));
      console.log("🏠 ORIGINAL LOCATION DATA RECEIVED:", {
        hometownCity: req.body.hometownCity,
        hometownState: req.body.hometownState,
        hometownCountry: req.body.hometownCountry
      });
      console.log("✈️ ORIGINAL TRAVEL DATA RECEIVED:", {
        isCurrentlyTraveling: req.body.isCurrentlyTraveling,
        travelDestination: req.body.travelDestination,
        currentCity: req.body.currentCity,
        currentState: req.body.currentState,
        currentCountry: req.body.currentCountry,
        travelStartDate: req.body.travelStartDate,
        travelEndDate: req.body.travelEndDate
      });

      // Convert date strings to Date objects and map form data to correct schema fields
      const processedData = { ...req.body };
      if (processedData.dateOfBirth && typeof processedData.dateOfBirth === 'string') {
        processedData.dateOfBirth = new Date(processedData.dateOfBirth);
      }
      if (processedData.travelStartDate && typeof processedData.travelStartDate === 'string') {
        processedData.travelStartDate = new Date(processedData.travelStartDate);
      }
      if (processedData.travelEndDate && typeof processedData.travelEndDate === 'string') {
        processedData.travelEndDate = new Date(processedData.travelEndDate);
      }

      // Apply location normalization to prevent community splitting
      if (processedData.hometownCity) {
        // Keep original data and just normalize the city name
        const originalCity = processedData.hometownCity;
        const originalState = processedData.hometownState;  
        const originalCountry = processedData.hometownCountry;
        
        // Actually, don't normalize at all for now - let's preserve the exact original data
        // processedData.hometownCity = normalizeLocation(originalCity);
        processedData.hometownCity = originalCity;
        processedData.hometownState = originalState;
        processedData.hometownCountry = originalCountry;
        
        console.log("🗺️ LOCATION PRESERVED (NO NORMALIZATION):", {
          original: { 
            city: req.body.hometownCity, 
            state: req.body.hometownState, 
            country: req.body.hometownCountry 
          },
          preserved: {
            city: processedData.hometownCity,
            state: processedData.hometownState,
            country: processedData.hometownCountry
          }
        });
      }

      // Map signup form fields to correct database fields for all user types
      if (processedData.userType === 'local') {
        console.log("📍 PROCESSING LOCAL USER - Location mapping:");
        console.log("  Input hometown data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry
        });

        // Always populate location field for locals
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
          console.log("  ✓ Set location field:", processedData.location);
        }

        // Always populate hometown field for locals
        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
          console.log("  ✓ Set hometown field:", processedData.hometown);
        }

        console.log("  Final processed location data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry,
          location: processedData.location,
          hometown: processedData.hometown
        });
      }

      // Map traveler signup fields - CRITICAL for travel data processing
      if (processedData.userType === 'traveler') {
        console.log("✈️ PROCESSING TRAVELER USER - Travel mapping:");
        console.log("  Input travel data:", {
          currentCity: processedData.currentCity,
          currentState: processedData.currentState,
          currentCountry: processedData.currentCountry,
          travelStartDate: processedData.travelStartDate,
          travelEndDate: processedData.travelEndDate,
          isCurrentlyTraveling: processedData.isCurrentlyTraveling,
          travelDestination: processedData.travelDestination
        });

        // Set travel status for travelers
        processedData.isCurrentlyTraveling = true;

        // Build travel destination from current travel location
        if (processedData.currentCity && processedData.currentCountry) {
          const travelDestinationParts = [
            processedData.currentCity,
            processedData.currentState,
            processedData.currentCountry
          ].filter(Boolean);
          processedData.travelDestination = travelDestinationParts.join(', ');
          console.log("  ✓ Set travel destination:", processedData.travelDestination);
        }

        // Always populate hometown and location fields for travelers too
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
          console.log("  ✓ Set location field:", processedData.location);
        }

        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
          console.log("  ✓ Set hometown field:", processedData.hometown);
        }

        console.log("  Final processed traveler data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry,
          location: processedData.location,
          hometown: processedData.hometown,
          isCurrentlyTraveling: processedData.isCurrentlyTraveling,
          travelDestination: processedData.travelDestination,
          travelStartDate: processedData.travelStartDate,
          travelEndDate: processedData.travelEndDate
        });
      }

      // Map business signup fields - CRITICAL for auto-fill and credit card processing
      if (processedData.userType === 'business') {
        console.log("Mapping business fields. Input data:", processedData);

        // Map business location fields from multiple possible sources
        // Check businessCity/businessState/businessCountry from signup-business form
        if (processedData.businessCity) {
          processedData.hometownCity = processedData.businessCity;
        }
        if (processedData.businessState) {
          processedData.hometownState = processedData.businessState;  
        }
        if (processedData.businessCountry) {
          processedData.hometownCountry = processedData.businessCountry;
        }

        // Also check generic city/state/country fields
        if (processedData.city && !processedData.hometownCity) {
          processedData.hometownCity = processedData.city;
        }
        if (processedData.state && !processedData.hometownState) {
          processedData.hometownState = processedData.state;  
        }
        if (processedData.country && !processedData.hometownCountry) {
          processedData.hometownCountry = processedData.country;
        }

        // Map business address fields to user schema fields
        if (processedData.businessAddress) {
          processedData.streetAddress = processedData.businessAddress;
        }
        if (processedData.businessPhone) {
          processedData.phoneNumber = processedData.businessPhone;
        }

        // Populate location and hometown fields for businesses
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
        }

        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
        }

        console.log("Mapped business data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry,
          streetAddress: processedData.streetAddress,
          phoneNumber: processedData.phoneNumber,
          zipCode: processedData.zipCode,
          location: processedData.location,
          hometown: processedData.hometown
        });
      }

      // Map traveler signup fields
      if (processedData.userType === 'current_traveler') {
        // Map localActivities and localEvents to main fields
        if (processedData.localActivities) {
          processedData.activities = processedData.localActivities;
        }
        if (processedData.localEvents) {
          processedData.events = processedData.localEvents;
        }
      }

      // Convert date strings to Date objects before schema validation
      if (processedData.dateOfBirth && typeof processedData.dateOfBirth === 'string') {
        processedData.dateOfBirth = new Date(processedData.dateOfBirth);
      }
      if (processedData.travelStartDate && typeof processedData.travelStartDate === 'string') {
        processedData.travelStartDate = new Date(processedData.travelStartDate);
      }
      if (processedData.travelEndDate && typeof processedData.travelEndDate === 'string') {
        processedData.travelEndDate = new Date(processedData.travelEndDate);
      }

      // For businesses, dateOfBirth is not required, so we'll add a default if missing
      if (processedData.userType === 'business' && !processedData.dateOfBirth) {
        processedData.dateOfBirth = new Date('1990-01-01'); // Default date for businesses
      }

      // Handle business referral tracking
      let referrerUser = null;
      if (processedData.userType === 'business' && processedData.referredByUser) {
        try {
          // Find referring user by username or email
          referrerUser = await storage.getUserByUsernameOrEmail(processedData.referredByUser.trim());
          if (!referrerUser) {
            console.log(`Referrer not found: ${processedData.referredByUser}`);
          }
        } catch (error) {
          console.error("Error finding referrer:", error);
        }
      }

      // CRITICAL: Convert string fields to arrays where schema expects arrays
      if (processedData.sexualPreference && typeof processedData.sexualPreference === 'string') {
        processedData.sexualPreference = [processedData.sexualPreference];
      }
      if (processedData.localActivities && typeof processedData.localActivities === 'string') {
        processedData.localActivities = [processedData.localActivities];
      }

      // CRITICAL: Preserve secret activities from original data before schema parsing
      const preservedSecretActivities = processedData.secretActivities || processedData.secretLocalQuestion;

      console.log(" BEFORE SCHEMA PARSING - processedData location fields:", {
        hometownCity: processedData.hometownCity,
        hometownState: processedData.hometownState,
        hometownCountry: processedData.hometownCountry,
        location: processedData.location,
        hometown: processedData.hometown
      });
      console.log(" BEFORE SCHEMA PARSING - processedData travel fields:", {
        isCurrentlyTraveling: processedData.isCurrentlyTraveling,
        travelDestination: processedData.travelDestination,
        travelStartDate: processedData.travelStartDate,
        travelEndDate: processedData.travelEndDate
      });

      const userData = insertUserSchema.parse(processedData);

      console.log("⚡ AFTER SCHEMA PARSING - userData location fields:", {
        hometownCity: userData.hometownCity,
        hometownState: userData.hometownState,
        hometownCountry: userData.hometownCountry,
        location: userData.location,
        hometown: userData.hometown
      });
      console.log("⚡ AFTER SCHEMA PARSING - userData travel fields:", {
        isCurrentlyTraveling: userData.isCurrentlyTraveling,
        travelDestination: userData.travelDestination,
        travelStartDate: userData.travelStartDate,
        travelEndDate: userData.travelEndDate
      });

      // CRITICAL: Restore secret activities after schema parsing
      if (preservedSecretActivities) {
        userData.secretActivities = preservedSecretActivities;
      }

      // Save signup preferences as default travel preferences for ALL user types
      // This must happen AFTER schema parsing to ensure fields exist
      if (userData.interests) {
        userData.defaultTravelInterests = userData.interests;
      }
      if (userData.activities) {
        userData.defaultTravelActivities = userData.activities;
      }
      if (userData.events) {
        userData.defaultTravelEvents = userData.events;
      }

      // Validate business address requirements for business users
      if (userData.userType === 'business') {
        if (!userData.streetAddress || !userData.zipCode || !userData.phoneNumber) {
          return res.status(400).json({ 
            message: "Business address, zip code, and phone number are required for verification.",
            field: "businessAddress"
          });
        }
      }

      // CRITICAL: Validate minimum 10 total selections for traveler and local users (flexible distribution)
      // Business users have no minimum requirements - they might only offer 1 service
      if (userData.userType !== 'business') {
        const interestCount = (userData.interests && Array.isArray(userData.interests)) ? userData.interests.length : 0;
        const activityCount = (userData.activities && Array.isArray(userData.activities)) ? userData.activities.length : 0;
        const eventCount = (userData.events && Array.isArray(userData.events)) ? userData.events.length : 0;
        const totalSelections = interestCount + activityCount + eventCount;

        if (totalSelections < 10) {
          return res.status(400).json({ 
            message: `Please select at least 10 items total from interests, activities, and events. You have selected ${totalSelections}.`,
            field: "totalSelections"
          });
        }
      }

      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        console.log("Registration failed: Email already exists", userData.email);
        return res.status(409).json({ 
          message: "An account with this email already exists. Please use a different email or try logging in.",
          field: "email"
        });
      }

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        console.log("Registration failed: Username already exists", userData.username);
        return res.status(409).json({ 
          message: "This username is already taken. Please choose a different username.",
          field: "username"
        });
      }

      console.log("🔥 FINAL LOCATION DATA BEING SENT TO DATABASE:", {
        hometownCity: userData.hometownCity,
        hometownState: userData.hometownState,
        hometownCountry: userData.hometownCountry,
        location: userData.location,
        hometown: userData.hometown,
        userType: userData.userType
      });
      console.log("🔥 FINAL TRAVEL DATA BEING SENT TO DATABASE:", {
        isCurrentlyTraveling: userData.isCurrentlyTraveling,
        travelDestination: userData.travelDestination,
        travelStartDate: userData.travelStartDate,
        travelEndDate: userData.travelEndDate
      });

      console.log("Creating new user:", userData.email);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;

      console.log("💾 USER CREATED IN DATABASE - Location data stored:", {
        id: user.id,
        username: user.username,
        hometownCity: user.hometownCity,
        hometownState: user.hometownState,
        hometownCountry: user.hometownCountry,
        location: user.location,
        hometown: user.hometown
      });
      console.log("💾 USER CREATED IN DATABASE - Travel data stored:", {
        id: user.id,
        username: user.username,
        isCurrentlyTraveling: user.isCurrentlyTraveling,
        travelDestination: user.travelDestination,
        travelStartDate: user.travelStartDate,
        travelEndDate: user.travelEndDate
      });

      // IMPORTANT: Award 1 aura point to all new users for signing up
      try {
        await storage.updateUser(user.id, { aura: 1 });
        console.log(`✓ Awarded 1 signup aura point to new user ${user.id} (${user.username})`);
      } catch (auraError) {
        console.error('Error awarding signup aura point:', auraError);
        // Don't fail registration if aura update fails
      }

      // CRITICAL: Set proper travel status for new user based on their travel plans
      await TravelStatusService.setNewUserTravelStatus(user.id);

      // After creating a user, ensure "Meet Locals" chatrooms exist for both hometown and travel destinations
      await storage.ensureMeetLocalsChatrooms();

      // CRITICAL: Create chatrooms for user's hometown (all users have hometowns)
      if (userData.hometownCity && userData.hometownCountry) {
        try {
          await storage.ensureMeetLocalsChatrooms(userData.hometownCity, userData.hometownState, userData.hometownCountry);
          console.log(`✓ Created/verified hometown chatroom for ${userData.hometownCity}, ${userData.hometownCountry}`);
        } catch (error) {
          console.error('Error creating hometown chatroom:', error);
        }
      }

      // CRITICAL: Create chatrooms for travel destination if user is currently traveling
      if (userData.isCurrentlyTraveling && userData.travelDestination) {
        try {
          // Parse travel destination to get city, state, country
          const destinationParts = userData.travelDestination.split(', ');
          const travelCity = destinationParts[0];
          const travelState = destinationParts[1];
          const travelCountry = destinationParts[2] || destinationParts[1]; // Handle cases where state might be country

          await storage.ensureMeetLocalsChatrooms(travelCity, travelState, travelCountry);
          console.log(`✓ Created/verified travel destination chatroom for ${userData.travelDestination}`);
        } catch (error) {
          console.error('Error creating travel destination chatroom:', error);
        }
      }

      // For travelers, automatically create a trip plan from signup data
      // Use original request data since insertUserSchema filters out non-user fields
      const originalData = req.body;

      // Auto-create city for ALL user types (locals, travelers, businesses) to ensure discover page completeness
      if (userData.hometownCity && userData.hometownCountry) {
        try {
          console.log(`Creating city for new user: ${userData.hometownCity}, ${userData.hometownState}, ${userData.hometownCountry}`);

          // Ensure city exists in discover page
          await storage.ensureCityExists(
            userData.hometownCity,
            userData.hometownState || '',
            userData.hometownCountry
          );

          // For locals only, also create city page with secret activities
          if (userData.userType === 'local') {
            const cityPage = await storage.ensureCityPageExists(
              userData.hometownCity,
              userData.hometownState || null,
              userData.hometownCountry,
              user.id
            );

            // Add their secret activities to the city page if they exist
            const secretActivities = userData.secretActivities || originalData.secretLocalQuestion;
            if (cityPage && secretActivities && secretActivities.trim()) {
              await storage.addSecretLocalExperience(
                cityPage.id,
                user.id,
                secretActivities,
                'activity'
              );
              console.log(`✓ Added secret experience for ${userData.hometownCity}: ${secretActivities}`);
            }
          }

          // CRITICAL: Generate AI activities and events for new cities (only if needed)
          const consolidatedCity = consolidateToMetropolitanArea(userData.hometownCity, userData.hometownState, userData.hometownCountry);
          const useOriginalCity = consolidatedCity === userData.hometownCity;
          const targetCity = useOriginalCity ? userData.hometownCity : consolidatedCity;
          
          try {
            // Check if the target city already has sufficient content
            const existingActivities = await db.select().from(cityActivities).where(eq(cityActivities.cityName, targetCity));
            const existingEvents = await storage.getEventsByLocation(targetCity, userData.hometownState || '', userData.hometownCountry);
            
            const needsAIGeneration = existingActivities.length < 10 && existingEvents.length < 2;
            
            if (needsAIGeneration) {
              console.log(`🤖 Generating AI content for ${targetCity} (consolidated from ${userData.hometownCity})...`);
              
              // Generate AI activities for the target city
              const { generateCityActivities } = await import('./ai-city-activities.js');
              const generatedActivities = await generateCityActivities(targetCity);
              
              // Save activities to database
              let savedActivityCount = 0;
              for (const activity of generatedActivities) {
                try {
                  await storage.createCityActivity({
                    city: targetCity,
                    activityName: activity.name,
                    description: activity.description,
                    category: activity.category,
                    state: userData.hometownState || '',
                    country: userData.hometownCountry,
                    createdByUserId: user.id
                  });
                  savedActivityCount++;
                } catch (error) {
                  // Skip duplicate activities
                  console.log(`⚠️ Skipping duplicate activity: ${activity.name}`);
                }
              }
              
              console.log(`✅ Generated ${savedActivityCount} AI activities for ${targetCity}`);
              
              // Generate AI events for the target city
              const { aiEventGenerator } = await import('./aiEventGenerator.js');
              await aiEventGenerator.ensureEventsForLocation(
                targetCity,
                userData.hometownState || '',
                userData.hometownCountry
              );
              
              console.log(`✅ Generated AI events for ${targetCity}`);
            } else {
              console.log(`✅ ${targetCity} already has sufficient content (${existingActivities.length} activities, ${existingEvents.length} events)`);
            }
            
          } catch (error) {
            console.error(`Error generating AI content for ${targetCity}:`, error);
            // Don't fail registration if AI generation fails
          }

          console.log(`✅ Ensured city exists in discover page: ${userData.hometownCity}, ${userData.hometownCountry}`);
        } catch (error) {
          console.error('Error creating city or adding secret experience:', error);
          // Don't fail registration if city creation fails
        }
      }

      // CRITICAL: Create chatrooms for user's hometown for ALL user types
      if (userData.hometownCity && userData.hometownCountry) {
        try {
          await storage.ensureMeetLocalsChatrooms(userData.hometownCity, userData.hometownState, userData.hometownCountry);
          console.log(`✓ Created/verified hometown chatrooms for ${userData.hometownCity}, ${userData.hometownCountry}`);

          // Note: Users manually join chatrooms - no auto-joining
        } catch (error) {
          console.error('Error creating hometown chatrooms:', error);
        }
      }

      console.log("CHECKING TRAVEL PLAN CREATION:", {
        userType: originalData.userType,
        currentTravelCity: originalData.currentTravelCity,
        travelDestination: originalData.travelDestination,
        currentTravelCountry: originalData.currentTravelCountry,
        travelStartDate: originalData.travelStartDate,
        travelEndDate: originalData.travelEndDate,
        isCurrentlyTraveling: originalData.isCurrentlyTraveling
      });

      // Check ALL possible field variations from different signup forms
      const hasCurrentTravel = originalData.currentTravelCity && originalData.currentTravelCountry;
      const hasTravelDestination = originalData.travelDestination || (originalData.travelDestinationCity && originalData.travelDestinationCountry);
      const hasTravelDates = originalData.travelStartDate && originalData.travelEndDate;
      const isTraveingUser = originalData.userType === 'current_traveler' || originalData.isCurrentlyTraveling;

      if ((hasCurrentTravel || hasTravelDestination) && hasTravelDates && isTraveingUser) {

        // CRITICAL: Date validation ONLY applies during signup for current travelers
        // Regular trip planning from Plan Trip page should allow future dates
        // This validation is ONLY for signup forms where users claim to be "currently traveling"

        const startDate = new Date(originalData.travelStartDate);
        const endDate = new Date(originalData.travelEndDate);
        const tomorrow = getTomorrowInUserTimezone(user.hometownCity, user.hometownState);

        // Only validate dates for signup - not for trip planning
        // Users signing up as "current travelers" must have current/past trips
        if (startDate > tomorrow) {
          console.log("BLOCKED: Future travel START date during SIGNUP detected", { 
            startDate: originalData.travelStartDate, 
            endDate: originalData.travelEndDate,
            userHometown: `${user.hometownCity}, ${user.hometownState}`,
            userTimezone: getUserTimezone(user.hometownCity, user.hometownState),
            maxAllowed: tomorrow.toLocaleDateString(),
            context: "signup_validation"
          });
          return res.status(400).json({ 
            message: "For signup as current traveler, your travel start date must be today or in the past (you're already traveling). For future trips, sign up as a local first, then plan trips later.",
            field: "travelDates"
          });
        }

        try {
          // Build destination from all possible field variations
          const tripLocation = originalData.travelDestination || [
            originalData.currentTravelCity || originalData.travelDestinationCity,
            originalData.currentTravelState || originalData.travelDestinationState,
            originalData.currentTravelCountry || originalData.travelDestinationCountry
          ].filter(Boolean).join(", ");

          console.log("CREATING TRAVEL PLAN:", { tripLocation, userId: user.id });

          const tripPlanData = {
            userId: user.id,
            destination: tripLocation,
            destinationCity: originalData.currentTravelCity || originalData.travelDestinationCity,
            destinationState: originalData.currentTravelState || originalData.travelDestinationState,
            destinationCountry: originalData.currentTravelCountry || originalData.travelDestinationCountry,
            startDate: new Date(originalData.travelStartDate),
            endDate: new Date(originalData.travelEndDate),
            interests: userData.interests || [],
            activities: userData.activities || [],
            events: userData.events || [],
            travelStyle: userData.selectedTravelerTypes || userData.travelStyle || [],
            status: 'planned'
          };

          const createdTripPlan = await storage.createTravelPlan(tripPlanData);
          console.log("TRAVEL PLAN CREATED SUCCESSFULLY:", createdTripPlan?.id);

          // CRITICAL: Update user travel status immediately after creating travel plan
          await TravelStatusService.updateUserTravelStatus(user.id);

          // CRITICAL: Generate AI content for travel destination (only if needed)
          const destinationParts = tripLocation.split(', ');
          const travelCity = destinationParts[0];
          const travelState = destinationParts[1];
          const travelCountry = destinationParts[2] || destinationParts[1];
          
          if (travelCity && travelCountry) {
            try {
              // Consolidate travel destination to metropolitan area if applicable
              const consolidatedTravelCity = consolidateToMetropolitanArea(travelCity, travelState, travelCountry);
              const targetTravelCity = consolidatedTravelCity;
              
              // Check if the target travel city already has sufficient content
              const existingTravelActivities = await db.select().from(cityActivities).where(eq(cityActivities.cityName, targetTravelCity));
              const existingTravelEvents = await storage.getEventsByLocation(targetTravelCity, travelState || '', travelCountry);
              
              const needsTravelAIGeneration = existingTravelActivities.length < 10 && existingTravelEvents.length < 2;
              
              if (needsTravelAIGeneration) {
                console.log(`🤖 Generating AI content for travel destination: ${targetTravelCity} (consolidated from ${travelCity})...`);
                
                // Ensure travel destination city exists
                await storage.ensureCityExists(targetTravelCity, travelState || '', travelCountry);
                
                // Generate AI activities for travel destination
                const { generateCityActivities } = await import('./ai-city-activities.js');
                const generatedActivities = await generateCityActivities(targetTravelCity);
                
                // Save activities to database
                let savedActivityCount = 0;
                for (const activity of generatedActivities) {
                  try {
                    await storage.createCityActivity({
                      city: targetTravelCity,
                      activityName: activity.name,
                      description: activity.description,
                      category: activity.category,
                      state: travelState || '',
                      country: travelCountry,
                      createdByUserId: user.id
                    });
                    savedActivityCount++;
                  } catch (error) {
                    // Skip duplicate activities
                    console.log(`⚠️ Skipping duplicate activity: ${activity.name}`);
                  }
                }
                
                console.log(`✅ Generated ${savedActivityCount} AI activities for travel destination: ${targetTravelCity}`);
                
                // Generate AI events for travel destination
                const { aiEventGenerator } = await import('./aiEventGenerator.js');
                await aiEventGenerator.ensureEventsForLocation(targetTravelCity, travelState || '', travelCountry);
                
                console.log(`✅ Generated AI events for travel destination: ${targetTravelCity}`);
              } else {
                console.log(`✅ ${targetTravelCity} already has sufficient content (${existingTravelActivities.length} activities, ${existingTravelEvents.length} events)`);
              }
              
            } catch (error) {
              console.error(`Error generating AI content for travel destination ${travelCity}:`, error);
              // Don't fail registration if AI generation fails
            }
          }

          // Note: Travel destination chatrooms are available for users to manually join

          // Check for business interest matches for travelers
          await storage.checkBusinessInterestMatches(
            user.id,
            userData.interests || [],
            userData.activities || [],
            tripLocation,
            'travel_plan',
            {
              startDate: new Date(originalData.travelStartDate),
              endDate: new Date(originalData.travelEndDate)
            }
          );
        } catch (tripError) {
          console.error("Failed to create initial trip plan:", tripError);
          // Don't fail registration if trip creation fails
        }
      }

      // Check for business interest matches for all user types
      try {
        const userLocation = userData.userType === 'current_traveler' && originalData.currentTravelCity
          ? [originalData.currentTravelCity, originalData.currentTravelState, originalData.currentTravelCountry].filter(Boolean).join(", ")
          : [userData.hometownCity, userData.hometownState, userData.hometownCountry].filter(Boolean).join(", ");

        const matchType = userData.userType === 'current_traveler' ? 'traveler_interest' : 'local_interest';

        if (userLocation && ((userData.interests?.length || 0) > 0 || (userData.activities?.length || 0) > 0)) {
          await storage.checkBusinessInterestMatches(
            user.id,
            userData.interests || [],
            userData.activities || [],
            userLocation,
            matchType
          );
        }
      } catch (matchError) {
        console.error("Failed to check business interest matches:", matchError);
        // Don't fail registration if matching fails
      }

      // Create business referral record if referrer exists
      if (referrerUser && processedData.userType === 'business') {
        try {
          await storage.createBusinessReferral({
            referrerId: referrerUser.id,
            referredBusinessId: user.id,
            businessName: userData.businessName || 'Unnamed Business',
            businessEmail: userData.email,
            status: 'business_signed_up',
            potentialReward: 10000, // $100 in cents
            notes: `Business referral: ${userData.businessName} referred by ${referrerUser.username}`
          });
          console.log(`Created business referral: ${referrerUser.username} -> ${userData.businessName}`);
        } catch (referralError) {
          console.error("Failed to create business referral:", referralError);
        }
      }

      // Award 1 aura point for signing up
      try {
        await storage.updateUser(user.id, { aura: 1 });
        console.log(`Awarded 1 signup aura to new user: ${user.username} (ID: ${user.id})`);
      } catch (auraError) {
        console.error("Failed to award signup aura:", auraError);
        // Don't fail registration if aura award fails
      }

      // AUTOMATICALLY CONNECT ALL NEW USERS TO NEARBYTRAVELER
      try {
        const nearbytravelerUser = await storage.getUserByUsername('nearbytraveler');
        if (nearbytravelerUser && user.username !== 'nearbytraveler') {
          // Create automatic connection between new user and nearbytraveler
          const connectionData = {
            requesterId: nearbytravelerUser.id,
            receiverId: user.id
          };

          // Create the connection record directly without using schema validation
          const [newConnection] = await db
            .insert(connections)
            .values({
              requesterId: parseInt(nearbytravelerUser.id.toString()),
              receiverId: parseInt(user.id.toString()),
              status: 'accepted'
            })
            .returning();

          // Create welcome message from nearbytraveler to the new user
          await storage.createMessage({
            senderId: nearbytravelerUser.id,
            receiverId: user.id,
            content: `Welcome to Nearby Traveler, ${user.name || user.username}! 🌍

I'm excited to have you join our community of travelers, locals, and businesses! Here's how to get the most out of your experience:

🔍 **Discover People**: Use Advanced Search to find travelers and locals who share your interests, activities, and travel destinations. Filter by age, location, traveler type, and more.

🎉 **Join Events**: Browse local events in your area or travel destinations. Create your own events to meet like-minded people and share experiences.

💬 **Connect & Chat**: Send connection requests to people you'd like to meet. Use our instant messaging system to plan meetups and share travel tips.

📍 **Explore Cities**: Check out city pages to discover hidden gems, local activities, and secret spots recommended by locals.

🏨 **Business Offers**: Find exclusive deals and promotions from local businesses in your area or travel destinations.

${user.userType === 'business' ? '🏢 **Business Dashboard**: Access your business dashboard to manage customer notifications, view analytics, and promote your services to travelers and locals.' : user.userType === 'traveler' ? '✈️ **Plan Your Trips**: Use our travel planning tools to create detailed itineraries and connect with locals at your destinations.' : '🏠 **Share Local Knowledge**: Help travelers discover your city by sharing local insights, joining city chatrooms, and attending local events.'}

Ready to start exploring? Connect with fellow community members and dive into the amazing features we've built for authentic travel networking!

Safe travels and happy connecting! 🚀`
          });

          console.log(`✓ Auto-connected new user ${user.username} (ID: ${user.id}) to nearbytraveler with welcome message`);
        }
      } catch (autoConnectError) {
        console.error("Failed to auto-connect new user to nearbytraveler:", autoConnectError);
        // Don't fail registration if auto-connection fails
      }

      res.status(201).json({
        user: userWithoutPassword,
        token: 'auth_token_' + userWithoutPassword.id
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        const field = error.constraint?.includes('email') ? 'email' : 'username';
        return res.status(409).json({ 
          message: field === 'email' 
            ? "An account with this email already exists." 
            : "This username is already taken.",
          field
        });
      }
      res.status(400).json({ message: "Registration failed. Please check your information and try again.", error: error.message });
    }
  };

  // Registration endpoints - both for backward compatibility
  app.post("/api/register", handleRegistration);
  app.post("/api/auth/register", handleRegistration);

  // CRITICAL: Get user by ID endpoint
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // CRITICAL: Update user profile (including avatar upload)
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      console.log(`Updating user ${userId} with:`, Object.keys(updates));

      // Convert dateOfBirth string to Date object if present
      if (updates.dateOfBirth && typeof updates.dateOfBirth === 'string') {
        try {
          updates.dateOfBirth = new Date(updates.dateOfBirth);
        } catch (dateError) {
          console.error('Invalid date format:', updates.dateOfBirth);
          return res.status(400).json({ message: "Invalid date format for dateOfBirth" });
        }
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      console.log(`✓ User ${userId} updated successfully`);
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  // CRITICAL: Profile photo upload endpoint (PUT) - MISSING ENDPOINT
  app.put("/api/users/:id/profile-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      console.log(`PUT: Updating profile photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new profile photo
      const updatedUser = await storage.updateUser(userId, { profileImage: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      console.log(`✓ PUT: Profile photo updated for user ${userId}`);
      return res.json({ 
        message: "Profile photo updated successfully",
        profileImage: updatedUser.profileImage,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("PUT: Error updating profile photo:", error);
      return res.status(500).json({ message: "Failed to update profile photo" });
    }
  });

  // Clear profile photo endpoint (for large image cleanup)
  app.delete("/api/users/profile-photo", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const updatedUser = await storage.updateUser(parseInt(userId as string), { profileImage: null });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`✓ Cleared profile photo for user ${userId}`);
      return res.json({ message: "Profile photo cleared" });
    } catch (error) {
      console.error("Error clearing profile photo:", error);
      return res.status(500).json({ message: "Failed to clear profile photo" });
    }
  });

  // CRITICAL: Cover photo upload endpoint (POST)
  app.post("/api/users/:id/cover-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      console.log(`POST: Updating cover photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new cover photo
      const updatedUser = await storage.updateUser(userId, { coverPhoto: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      console.log(`✓ POST: Cover photo updated for user ${userId}`);
      return res.json({ 
        message: "Cover photo updated successfully",
        coverPhoto: updatedUser.coverPhoto,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("POST: Error updating cover photo:", error);
      return res.status(500).json({ message: "Failed to update cover photo" });
    }
  });

  // CRITICAL: Cover photo upload endpoint (PUT) - MISSING ENDPOINT
  app.put("/api/users/:id/cover-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      console.log(`PUT: Updating cover photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new cover photo
      const updatedUser = await storage.updateUser(userId, { coverPhoto: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      console.log(`✓ PUT: Cover photo updated for user ${userId}`);
      return res.json({ 
        message: "Cover photo updated successfully",
        coverPhoto: updatedUser.coverPhoto,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("PUT: Error updating cover photo:", error);
      return res.status(500).json({ message: "Failed to update cover photo" });
    }
  });



  // CRITICAL: Get all users endpoint with LA Metro consolidation
  app.get("/api/users", async (req, res) => {
    try {
      // Use direct database query since getUsers doesn't exist
      const allUsers = await db.select().from(users);
      if (!allUsers || allUsers.length === 0) {
        return res.json([]);
      }
      
      // Apply LA Metro area consolidation to all users
      const consolidatedUsers = allUsers.map(user => {
        if (!user) return null;
        
        // Remove password
        const { password: _, ...userWithoutPassword } = user;
        
        // Apply LA Metro consolidation to location fields
        const consolidatedUser = {
          ...userWithoutPassword,
          hometownCity: consolidateToMetropolitanArea(user.hometownCity || '', user.hometownState, user.hometownCountry),
          location: user.location ? user.location.replace(/^(Santa Monica|Venice|Venice Beach|El Segundo|Manhattan Beach|Beverly Hills|West Hollywood|Pasadena|Burbank|Glendale|Long Beach|Torrance|Inglewood|Compton|Downey|Pomona|Playa del Rey|Redondo Beach|Culver City|Marina del Rey|Hermosa Beach|Hawthorne|Gardena|Carson|Lakewood|Norwalk|Whittier|Montebello|East Los Angeles|Monterey Park|Alhambra|South Pasadena|San Fernando|North Hollywood|Hollywood|Studio City|Sherman Oaks|Encino|Reseda|Van Nuys|Northridge), California/, 'Los Angeles, California,') : user.location
        };
        
        return consolidatedUser;
      }).filter(Boolean);
      
      console.log(`Users API response: ${consolidatedUsers.length} users for all locations`);
      return res.json(consolidatedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.json([]);
    }
  });

  // CRITICAL: Get travel plans for user
  app.get("/api/travel-plans/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const travelPlans = await storage.getTravelPlansByUserId(userId);
      return res.json(travelPlans);
    } catch (error) {
      console.error("Error fetching travel plans:", error);
      return res.status(500).json({ message: "Failed to fetch travel plans" });
    }
  });

  // Enhanced API to get travel plans with itinerary data
  app.get("/api/travel-plans-with-itineraries/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Update travel plan statuses and save completed itineraries
      await storage.updateTravelPlanStatuses();
      await storage.saveItinerariesToPastTrips();
      
      const enhancedTravelPlans = await storage.getTravelPlansWithItineraries(userId);
      return res.json(enhancedTravelPlans || []);
    } catch (error) {
      console.error("Error fetching travel plans with itineraries:", error);
      return res.status(500).json({ message: "Failed to fetch enhanced travel plans" });
    }
  });

  // Get detailed itinerary data for a specific completed trip
  app.get("/api/travel-plans/:id/itineraries", async (req, res) => {
    try {
      const travelPlanId = parseInt(req.params.id);
      const itineraries = await storage.getCompletedTripItineraries(travelPlanId);
      return res.json(itineraries || []);
    } catch (error) {
      console.error("Error fetching trip itineraries:", error);
      return res.status(500).json({ message: "Failed to fetch trip itineraries" });
    }
  });

  // CRITICAL: Create new travel plan
  app.post("/api/travel-plans", async (req, res) => {
    try {
      console.log('=== CREATE TRAVEL PLAN API ===');
      console.log('Request body:', req.body);
      
      const travelPlanData = { ...req.body };
      
      // Validate required fields
      if (!travelPlanData.userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      if (!travelPlanData.destinationCity) {
        return res.status(400).json({ message: "Destination city is required" });
      }
      if (!travelPlanData.destinationCountry) {
        return res.status(400).json({ message: "Destination country is required" });
      }

      // CRITICAL FIX: Convert string dates to Date objects
      if (travelPlanData.startDate && typeof travelPlanData.startDate === 'string') {
        travelPlanData.startDate = new Date(travelPlanData.startDate);
        console.log('Converted startDate to Date object:', travelPlanData.startDate);
      }
      if (travelPlanData.endDate && typeof travelPlanData.endDate === 'string') {
        travelPlanData.endDate = new Date(travelPlanData.endDate);
        console.log('Converted endDate to Date object:', travelPlanData.endDate);
      }

      // CRITICAL FIX: Ensure accommodation and transportation are properly handled
      if (travelPlanData.accommodation) {
        console.log('Accommodation field:', travelPlanData.accommodation);
      }
      if (travelPlanData.transportation) {
        console.log('Transportation field:', travelPlanData.transportation);
      }

      console.log('=== PROCESSED CREATE DATA ===');
      console.log('Final create data:', travelPlanData);

      const newTravelPlan = await storage.createTravelPlan(travelPlanData);
      console.log('=== TRAVEL PLAN CREATED ===');
      console.log('New travel plan:', newTravelPlan);
      
      return res.status(201).json(newTravelPlan);
    } catch (error) {
      console.error("Error creating travel plan:", error);
      return res.status(500).json({ message: "Failed to create travel plan", error: error.message });
    }
  });

  // CRITICAL: Get single travel plan by ID
  app.get("/api/travel-plans/single/:id", async (req, res) => {
    try {
      console.log('=== GET SINGLE TRAVEL PLAN API ===');
      console.log('Plan ID:', req.params.id);
      
      const planId = parseInt(req.params.id);
      const travelPlan = await storage.getTravelPlan(planId);
      
      if (!travelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      console.log('=== TRAVEL PLAN FOUND ===');
      console.log('Travel plan data:', travelPlan);
      
      return res.json(travelPlan);
    } catch (error) {
      console.error("Error fetching travel plan:", error);
      return res.status(500).json({ message: "Failed to fetch travel plan", error: error.message });
    }
  });

  // CRITICAL: Update existing travel plan
  app.put("/api/travel-plans/:id", async (req, res) => {
    try {
      console.log('=== UPDATE TRAVEL PLAN API ===');
      console.log('Plan ID:', req.params.id);
      console.log('Request body:', req.body);
      
      const planId = parseInt(req.params.id);
      const updateData = { ...req.body };
      
      // CRITICAL FIX: Convert string dates to Date objects
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
        console.log('Converted startDate to Date object:', updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
        console.log('Converted endDate to Date object:', updateData.endDate);
      }
      
      // CRITICAL FIX: Ensure accommodation and transportation are properly handled
      if (updateData.accommodation) {
        console.log('Accommodation field:', updateData.accommodation);
      }
      if (updateData.transportation) {
        console.log('Transportation field:', updateData.transportation);
      }
      
      console.log('=== PROCESSED UPDATE DATA ===');
      console.log('Final update data:', updateData);
      
      const updatedTravelPlan = await storage.updateTravelPlan(planId, updateData);
      
      if (!updatedTravelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      console.log('=== TRAVEL PLAN UPDATED ===');
      console.log('Updated travel plan:', updatedTravelPlan);
      
      return res.json(updatedTravelPlan);
    } catch (error) {
      console.error("Error updating travel plan:", error);
      return res.status(500).json({ message: "Failed to update travel plan", error: error.message });
    }
  });

  // Enhanced: Get conversation data with IM notification support
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Get all users who have messaged this user, with IM indicators
      const conversations = await db
        .select({
          userId: users.id,
          username: users.username,
          profileImage: users.profileImage,
          location: users.hometownCity,
          userType: users.userType
        })
        .from(users)
        .innerJoin(messages, or(
          and(eq(messages.senderId, users.id), eq(messages.receiverId, userId)),
          and(eq(messages.receiverId, users.id), eq(messages.senderId, userId))
        ))
        .where(ne(users.id, userId))
        .groupBy(users.id, users.username, users.profileImage, users.hometownCity, users.userType);

      // Add IM and message data for each conversation
      const enhancedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Get last message
          const lastMessage = await db
            .select()
            .from(messages)
            .where(
              or(
                and(eq(messages.senderId, conv.userId), eq(messages.receiverId, userId)),
                and(eq(messages.senderId, userId), eq(messages.receiverId, conv.userId))
              )
            )
            .orderBy(desc(messages.createdAt))
            .limit(1);

          // Check for unread instant messages
          const unreadIMs = await db
            .select()
            .from(messages)
            .where(
              and(
                eq(messages.receiverId, userId),
                eq(messages.senderId, conv.userId),
                eq(messages.isRead, false),
                eq(messages.messageType, 'instant')
              )
            );

          return {
            userId: conv.userId,
            username: conv.username,
            avatar: conv.profileImage,
            location: conv.location || 'Location not set',
            userType: conv.userType || 'traveler',
            lastMessage: lastMessage[0]?.content || 'No messages yet',
            lastMessageTime: lastMessage[0]?.createdAt,
            hasUnreadIM: unreadIMs.length > 0,
            unreadCount: unreadIMs.length
          };
        })
      );

      return res.json(enhancedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // CRITICAL: Get connection status between two users (MUST BE BEFORE general routes)
  app.get("/api/connections/status/:userId/:targetUserId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const targetUserId = parseInt(req.params.targetUserId);
      
      console.log(`CONNECTION STATUS: Checking connection between ${userId} and ${targetUserId}`);
      
      const connection = await storage.getConnection(userId, targetUserId);
      
      if (connection) {
        console.log(`CONNECTION STATUS: Found connection:`, connection);
        return res.json(connection);
      } else {
        console.log(`CONNECTION STATUS: No connection found between ${userId} and ${targetUserId}`);
        return res.json(null);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      return res.status(500).json({ message: "Failed to check connection status" });
    }
  });

  // CRITICAL: Get connections for user  
  app.get("/api/connections/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const connections = await storage.getUserConnections(userId);
      return res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      return res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // CRITICAL: Get connection requests for user
  app.get("/api/connections/:userId/requests", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getConnectionRequests(userId);
      return res.json(requests);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      return res.status(500).json({ message: "Failed to fetch connection requests" });
    }
  });

  // CRITICAL: Create new connection (send connection request)
  app.post("/api/connections", async (req, res) => {
    try {
      console.log(`CONNECTION REQUEST: Received body:`, req.body);
      const { requesterId, targetUserId, receiverId } = req.body;

      // Handle both old format (requesterId, targetUserId) and new format (receiverId)
      const finalRequesterId = requesterId || 1; // Default to user 1 for now - this should come from auth
      const finalTargetUserId = targetUserId || receiverId;

      if (!finalRequesterId || !finalTargetUserId) {
        console.log(`CONNECTION: Missing data - requesterId: ${finalRequesterId}, targetUserId: ${finalTargetUserId}`);
        return res.status(400).json({ message: "receiverId is required" });
      }

      console.log(`CONNECTION: Checking for existing connection between ${finalRequesterId} and ${finalTargetUserId}`);

      // CRITICAL: Check for existing connection to prevent duplicates
      const existingConnection = await storage.getConnection(parseInt(finalRequesterId), parseInt(finalTargetUserId));
      if (existingConnection) {
        console.log(`CONNECTION: Connection already exists:`, existingConnection);
        return res.status(409).json({ message: "Connection already exists", connection: existingConnection });
      }

      const reqId = parseInt(finalRequesterId);
      const targId = parseInt(finalTargetUserId);
      console.log(`CONNECTION: No existing connection found, creating new request from ${reqId} to ${targId}`);

      console.log(`CONNECTION: Creating new connection request...`);

      // Create new connection request
      const newConnection = await storage.createConnection({
        requesterId: parseInt(finalRequesterId),
        receiverId: parseInt(finalTargetUserId),
        status: 'pending',
        createdAt: new Date()
      });

      console.log(`CONNECTION: Successfully created connection request from ${finalRequesterId} to ${finalTargetUserId}:`, newConnection);
      return res.json({ success: true, connection: newConnection });
    } catch (error) {
      console.error("CONNECTION ERROR:", error);
      return res.status(500).json({ message: "Failed to create connection", error: error.message });
    }
  });

  // CRITICAL: Get messages for user
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Use direct database query
      const userMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));
      return res.json(userMessages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // CRITICAL: Send message for IM system (handles offline message delivery)
  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, content, isInstantMessage } = req.body;

      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ message: "senderId, receiverId, and content are required" });
      }

      console.log(`💬 ${isInstantMessage ? 'IM' : 'REGULAR'} MESSAGE: Storing message from ${senderId} to ${receiverId} for offline delivery`);

      // Store message in database for offline delivery
      const newMessage = await db
        .insert(messages)
        .values({
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          content: content.trim(),
          messageType: isInstantMessage ? 'instant' : 'text',
          isRead: false,
          createdAt: new Date()
        })
        .returning();

      console.log(`💬 IM MESSAGE: Message stored with ID ${newMessage[0]?.id}`);

      // Notify online users via WebSocket (if receiver is online)
      // This will be handled by the WebSocket service

      return res.json({ 
        success: true, 
        message: newMessage[0],
        messageId: newMessage[0]?.id 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // CRITICAL: Get chatrooms for user
  app.get("/api/chatrooms/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Use direct database query - get all chatrooms for now since chatroom participants table may not exist
      const allChatrooms = await db.select().from(citychatrooms);
      return res.json(allChatrooms);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      return res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // Get user's chatroom participation for profile display
  app.get("/api/users/:userId/chatroom-participation", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`🏠 CHATROOM PARTICIPATION: Getting chatroom participation for user ${userId}`);

      // Get chatrooms where user is a member using pool connection for reliability
      const result = await db.execute(sql`
        SELECT 
          cc.id,
          cc.name,
          cc.description,
          cc.city,
          cc.state,
          cc.country,
          cc.created_at,
          cc.is_active
        FROM city_chatrooms cc
        INNER JOIN chatroom_members cm ON cc.id = cm.chatroom_id
        WHERE cm.user_id = ${userId}
        AND cc.is_active = true
        ORDER BY cc.created_at DESC
      `);

      const userChatrooms = result.rows || [];

      console.log(`🏠 CHATROOM PARTICIPATION: Found ${userChatrooms.length} chatrooms for user ${userId}`);
      return res.json(userChatrooms);
    } catch (error) {
      console.error("Error fetching user chatroom participation:", error);
      return res.status(500).json({ message: "Failed to fetch chatroom participation" });
    }
  });

  // ORIGINAL WORKING SYSTEM: Get chatrooms with automatic city filtering
  app.get("/api/chatrooms", async (req, res) => {
    try {
      const { city, state, country, userId } = req.query;

      if (city) {
        // ORIGINAL SYSTEM: Filter chatrooms by city automatically with MEMBER COUNT FIX
        console.log(`🏙️ ORIGINAL: Getting chatrooms for ${city}, ${state}, ${country}`);
        const chatrooms = await storage.getCityChatrooms(
          city as string, 
          state as string || null, 
          country as string || null
        );
        
        // APPLY MEMBER COUNT FIX FOR CITY FILTERING TOO
        const memberCountQuery = await db
          .select({
            chatroomId: chatroomMembers.chatroomId,
            count: sql<string>`COUNT(*)::text`.as('count')
          })
          .from(chatroomMembers)
          .where(eq(chatroomMembers.isActive, true))
          .groupBy(chatroomMembers.chatroomId);
        
        const memberCountMap = new Map();
        memberCountQuery.forEach(mc => {
          memberCountMap.set(mc.chatroomId, parseInt(mc.count) || 1);
        });
        
        // Apply correct member counts to each chatroom
        const chatroomsWithFixedMemberCount = chatrooms.map(chatroom => ({
          ...chatroom,
          memberCount: memberCountMap.get(chatroom.id) || 1 // Use database count or default to 1
        }));
        
        console.log(`🏙️ ORIGINAL: Found ${chatroomsWithFixedMemberCount.length} chatrooms for ${city} with fixed member counts`);
        return res.json(chatroomsWithFixedMemberCount);
      } else if (userId) {
        const userChatrooms = await storage.getCityChatrooms(undefined, undefined, undefined, parseInt(userId as string));
        return res.json(userChatrooms);
      } else {
        // Return all chatrooms if no parameters (for global views)
        const allChatrooms = await db.select().from(citychatrooms);
        return res.json(allChatrooms);
      }
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      return res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // ENHANCED: Get events filtered by city with PARTICIPANT COUNTS and LA METRO CONSOLIDATION
  app.get("/api/events", async (req, res) => {
    try {
      const { city } = req.query;

      let eventsQuery = [];
      if (city) {
        // Apply global metropolitan area consolidation for Events search
        const cityName = city.toString();
        console.log(`🎪 EVENTS: Getting events for city: ${cityName}`);
        
        // Extract location components for proper consolidation
        const cityParts = cityName.split(',').map(part => part.trim());
        const [searchCity, searchState, searchCountry] = cityParts;
        const consolidatedCity = consolidateToMetropolitanArea(searchCity, searchState, searchCountry);
        
        // Get all cities in the metropolitan area for search
        const searchCities = consolidatedCity !== searchCity 
          ? [consolidatedCity, ...getMetropolitanAreaCities(consolidatedCity, searchState, searchCountry)]
          : [cityName];
        
        console.log(`🌍 EVENTS METRO: Searching cities:`, searchCities);
        
        // Search events in all relevant cities
        for (const searchCity of searchCities) {
          const cityEvents = await db.select().from(events)
            .where(eq(events.city, searchCity))
            .orderBy(desc(events.createdAt));
          eventsQuery.push(...cityEvents);
        }
        
        // Remove duplicates based on event ID
        const uniqueEventIds = new Set();
        eventsQuery = eventsQuery.filter(event => {
          if (uniqueEventIds.has(event.id)) {
            return false;
          }
          uniqueEventIds.add(event.id);
          return true;
        });
        
        // Sort by newest first after combining
        eventsQuery.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log(`🎪 EVENTS: Found ${eventsQuery.length} events for ${cityName} (including LA metro)`);
      } else {
        // Return all events if no city specified - NEWEST FIRST
        eventsQuery = await db.select().from(events)
          .orderBy(desc(events.createdAt));
        console.log(`🎪 EVENTS: Returning all ${eventsQuery.length} events`);
      }

      // CRITICAL: Add participant counts to all events
      const participantCounts = await Promise.all(
        eventsQuery.map(async (event) => {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventParticipants)
            .where(eq(eventParticipants.eventId, event.id));
          return { eventId: event.id, count: result?.count || 0 };
        })
      );

      // Create participant count lookup
      const participantCountMap = new Map(participantCounts.map(pc => [pc.eventId, pc.count]));

      // Add participant counts to events
      const eventsWithCounts = eventsQuery.map(event => ({
        ...event,
        participantCount: participantCountMap.get(event.id) || 0
      }));

      console.log(`🎪 EVENTS: Enhanced ${eventsWithCounts.length} events with participant counts`);
      return res.json(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // CRITICAL: Get event details by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log(`🎪 EVENT DETAILS: Getting event ${eventId}`);
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Add participant count
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));
      
      const eventWithCount = {
        ...event,
        participantCount: result?.count || 0
      };

      console.log(`🎪 EVENT DETAILS: Found event ${event.title} with ${eventWithCount.participantCount} participants`);
      return res.json(eventWithCount);
    } catch (error) {
      console.error("Error fetching event details:", error);
      return res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // CRITICAL: Get event participants
  app.get("/api/events/:id/participants", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log(`🎪 EVENT PARTICIPANTS: Getting participants for event ${eventId}`);
      
      const participants = await storage.getEventParticipants(eventId);
      console.log(`🎪 EVENT PARTICIPANTS: Found ${participants.length} participants for event ${eventId}`);
      
      return res.json(participants);
    } catch (error) {
      console.error("Error fetching event participants:", error);
      return res.status(500).json({ message: "Failed to fetch event participants" });
    }
  });

  // CRITICAL: Join event
  app.post("/api/events/:id/join", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { userId, notes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      console.log(`🎪 EVENT JOIN: User ${userId} joining event ${eventId}`);
      
      const participant = await storage.joinEvent(eventId, userId, notes);
      console.log(`🎪 EVENT JOIN: User ${userId} successfully joined event ${eventId}`);
      
      return res.json({ success: true, participant });
    } catch (error) {
      console.error("Error joining event:", error);
      return res.status(500).json({ message: "Failed to join event" });
    }
  });

  // CRITICAL: Leave event
  app.delete("/api/events/:id/leave", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      console.log(`🎪 EVENT LEAVE: User ${userId} leaving event ${eventId}`);
      
      const success = await storage.leaveEvent(eventId, userId);
      if (success) {
        console.log(`🎪 EVENT LEAVE: User ${userId} successfully left event ${eventId}`);
        return res.json({ success: true, message: "Successfully left event" });
      } else {
        return res.status(404).json({ message: "Participation not found" });
      }
    } catch (error) {
      console.error("Error leaving event:", error);
      return res.status(500).json({ message: "Failed to leave event" });
    }
  });

  // CRITICAL: Create new event with enhanced error handling
  app.post("/api/events", async (req, res) => {
    try {
      console.log(`🎪 EVENT CREATE: Creating new event`);
      console.log(`🎪 EVENT DATA: Title: ${req.body.title}, Category: ${req.body.category}, City: ${req.body.city}`);
      
      // Validate required fields with detailed messages
      if (!req.body.title) {
        return res.status(400).json({ 
          message: "Event title is required",
          field: "title"
        });
      }
      
      if (!req.body.organizerId) {
        return res.status(400).json({ 
          message: "Event organizer ID is required",
          field: "organizerId"
        });
      }

      if (!req.body.city) {
        return res.status(400).json({ 
          message: "Event city is required",
          field: "city"
        });
      }

      if (!req.body.date) {
        return res.status(400).json({ 
          message: "Event date is required",
          field: "date"
        });
      }

      // Clean and prepare event data
      const eventData = {
        ...req.body,
        // Ensure required fields are properly set
        organizerId: parseInt(req.body.organizerId),
        date: new Date(req.body.date),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        // CRITICAL: Always preserve imageUrl exactly as uploaded (never null it out)
        imageUrl: req.body.imageUrl
      };

      console.log(`🎪 EVENT CREATE: Cleaned data ready for storage`);
      console.log(`🎪 EVENT CREATE: Image data length: ${eventData.imageUrl ? eventData.imageUrl.length : 'null'}`);
      const newEvent = await storage.createEvent(eventData);
      console.log(`🎪 EVENT CREATE: Successfully created event ${newEvent.id} with organizer ${newEvent.organizerId}`);
      console.log(`🎪 EVENT CREATE: Stored image length: ${newEvent.imageUrl ? newEvent.imageUrl.length : 'null'}`);
      
      return res.json(newEvent);
    } catch (error) {
      console.error("🚨 EVENT CREATE ERROR:", error);
      
      // Return detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const errorDetails = error instanceof Error ? error.stack : "No stack trace available";
      
      console.error("🚨 ERROR DETAILS:", errorDetails);
      
      return res.status(500).json({ 
        message: errorMessage, // Return just the error message, not prefixed
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      });
    }
  });

  // CRITICAL: Update event details
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log(`🎪 EVENT UPDATE: Updating event ${eventId} with data:`, req.body);
      
      // Build update data object only including fields that are provided
      const updateData: any = {};
      
      // Only include fields that have actual values or are explicitly provided
      if (req.body.title !== undefined && req.body.title !== null) updateData.title = req.body.title?.trim();
      if (req.body.description !== undefined && req.body.description !== null) updateData.description = req.body.description?.trim();
      if (req.body.street !== undefined && req.body.street !== null) updateData.street = req.body.street?.trim();
      if (req.body.city !== undefined && req.body.city !== null) updateData.city = req.body.city?.trim();
      if (req.body.state !== undefined && req.body.state !== null) updateData.state = req.body.state?.trim();
      if (req.body.zipcode !== undefined && req.body.zipcode !== null) updateData.zipcode = req.body.zipcode?.trim();
      if (req.body.location !== undefined && req.body.location !== null) updateData.location = req.body.location?.trim();
      if (req.body.date !== undefined && req.body.date !== null) updateData.date = new Date(req.body.date);
      if (req.body.endDate !== undefined && req.body.endDate !== null) updateData.endDate = new Date(req.body.endDate);
      if (req.body.category !== undefined && req.body.category !== null) updateData.category = req.body.category || "Social";
      if (req.body.maxParticipants !== undefined && req.body.maxParticipants !== null) updateData.maxParticipants = parseInt(req.body.maxParticipants);
      if (req.body.requirements !== undefined && req.body.requirements !== null) updateData.requirements = req.body.requirements?.trim();
      if (req.body.tags !== undefined && req.body.tags !== null) updateData.tags = req.body.tags || [];
      if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;
      if (req.body.imageUrl !== undefined && req.body.imageUrl !== null) updateData.imageUrl = req.body.imageUrl;

      console.log(`🎪 EVENT UPDATE: Cleaned update data:`, updateData);
      
      const updatedEvent = await storage.updateEvent(eventId, updateData);
      
      if (!updatedEvent) {
        console.log(`🎪 EVENT UPDATE: ERROR - Event ${eventId} not found in database`);
        return res.status(404).json({ message: "Event not found" });
      }
      
      console.log(`🎪 EVENT UPDATE: SUCCESS - Event ${eventId} updated successfully`);
      return res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      return res.status(500).json({ message: "Failed to update event" });
    }
  });

  // CRITICAL: Update event image
  app.post("/api/events/:id/image", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { imageUrl } = req.body;
      
      console.log(`🖼️ SERVER: Received image update for event ${eventId}`);
      console.log(`🖼️ SERVER: Image data received - length: ${imageUrl ? imageUrl.length : 'null'}`);
      console.log(`🖼️ SERVER: Image preview: ${imageUrl ? imageUrl.substring(0, 50) + '...' : 'null'}`);
      
      if (!imageUrl) {
        console.log(`🖼️ SERVER: WARNING - No image data provided`);
        return res.status(400).json({ message: "No image data provided" });
      }
      
      console.log(`🖼️ SERVER: Calling storage.updateEvent with imageUrl`);
      const updatedEvent = await storage.updateEvent(eventId, { imageUrl });
      
      if (!updatedEvent) {
        console.log(`🖼️ SERVER: ERROR - Event ${eventId} not found in database`);
        return res.status(404).json({ message: "Event not found" });
      }
      
      console.log(`🖼️ SERVER: SUCCESS - Event ${eventId} updated`);
      console.log(`🖼️ SERVER: Updated event imageUrl: ${updatedEvent.imageUrl ? 'HAS IMAGE (' + updatedEvent.imageUrl.length + ' chars)' : 'NO IMAGE'}`);
      
      return res.json(updatedEvent);
    } catch (error) {
      console.error("🚨 SERVER: EVENT IMAGE UPDATE ERROR:", error);
      return res.status(500).json({ message: "Failed to update event image", error: error.message });
    }
  });

  // User Event Interests API endpoints for City Match Events functionality
  
  // Get user's event interests for a specific city
  app.get("/api/user-event-interests/:userId/:city", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cityName = req.params.city;

      console.log(`🎪 USER EVENT INTERESTS: Getting interests for user ${userId} in ${cityName}`);

      const userEventInterests = await db.execute(sql`
        SELECT 
          uei.id,
          uei.user_id as userId,
          uei.event_id as eventId,
          uei.city_name as cityName,
          uei.is_active as isActive,
          uei.created_at as createdAt,
          e.title as eventTitle
        FROM user_event_interests uei
        INNER JOIN events e ON uei.event_id = e.id
        WHERE uei.user_id = ${userId} 
        AND uei.city_name = ${cityName}
        AND uei.is_active = true
        ORDER BY uei.created_at DESC
      `);

      const interests = userEventInterests.rows || [];
      console.log(`🎪 USER EVENT INTERESTS: Found ${interests.length} event interests for user ${userId} in ${cityName}`);
      
      return res.json(interests);
    } catch (error) {
      console.error("Error fetching user event interests:", error);
      return res.status(500).json({ error: "Failed to fetch user event interests" });
    }
  });

  // Add user event interest
  app.post("/api/user-event-interests", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string);
      const { eventId, cityName } = req.body;

      console.log(`🎪 ADD EVENT INTEREST: User ${userId} adding interest in event ${eventId} for ${cityName}`);

      // Check if interest already exists
      const existingInterest = await db.execute(sql`
        SELECT id FROM user_event_interests 
        WHERE user_id = ${userId} 
        AND event_id = ${eventId} 
        AND city_name = ${cityName}
      `);

      if (existingInterest.rows && existingInterest.rows.length > 0) {
        // Reactivate existing interest
        await db.execute(sql`
          UPDATE user_event_interests 
          SET is_active = true, created_at = NOW()
          WHERE user_id = ${userId} 
          AND event_id = ${eventId} 
          AND city_name = ${cityName}
        `);
        
        return res.json({ 
          id: existingInterest.rows[0].id,
          userId,
          eventId,
          cityName,
          isActive: true,
          createdAt: new Date()
        });
      } else {
        // Create new interest
        const newInterest = await db.execute(sql`
          INSERT INTO user_event_interests (user_id, event_id, city_name, is_active, created_at)
          VALUES (${userId}, ${eventId}, ${cityName}, true, NOW())
          RETURNING id, user_id as userId, event_id as eventId, city_name as cityName, is_active as isActive, created_at as createdAt
        `);

        return res.json(newInterest.rows[0]);
      }
    } catch (error) {
      console.error("Error adding user event interest:", error);
      return res.status(500).json({ error: "Failed to add event interest" });
    }
  });

  // Remove user event interest
  app.delete("/api/user-event-interests/:eventId", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string);
      const eventId = parseInt(req.params.eventId);

      console.log(`🎪 REMOVE EVENT INTEREST: User ${userId} removing interest in event ${eventId}`);

      await db.execute(sql`
        UPDATE user_event_interests 
        SET is_active = false
        WHERE user_id = ${userId} 
        AND event_id = ${eventId}
      `);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error removing user event interest:", error);
      return res.status(500).json({ error: "Failed to remove event interest" });
    }
  });

  // CRITICAL: Get business offers with business information
  app.get("/api/business-deals", async (req, res) => {
    try {
      // FORCE NO CACHE TO ENSURE FRESH BUSINESS DATA
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log("🎯 FETCHING ALL BUSINESS OFFERS");
      
      // Get all active business offers with business information in single query
      const offersWithBusiness = await db
        .select({
          // All business offer fields
          id: businessOffers.id,
          businessId: businessOffers.businessId,
          title: businessOffers.title,
          description: businessOffers.description,
          category: businessOffers.category,
          discountType: businessOffers.discountType,
          discountValue: businessOffers.discountValue,
          discountCode: businessOffers.discountCode,
          targetAudience: businessOffers.targetAudience,
          city: businessOffers.city,
          state: businessOffers.state,
          country: businessOffers.country,
          validFrom: businessOffers.validFrom,
          validUntil: businessOffers.validUntil,
          maxRedemptions: businessOffers.maxRedemptions,
          currentRedemptions: businessOffers.currentRedemptions,
          isActive: businessOffers.isActive,
          imageUrl: businessOffers.imageUrl,
          termsConditions: businessOffers.termsConditions,
          contactInfo: businessOffers.contactInfo,
          websiteUrl: businessOffers.websiteUrl,
          tags: businessOffers.tags,
          viewCount: businessOffers.viewCount,
          createdAt: businessOffers.createdAt,
          updatedAt: businessOffers.updatedAt,
          maxRedemptionsPerUser: businessOffers.maxRedemptionsPerUser,
          monthCreated: businessOffers.monthCreated,
          yearCreated: businessOffers.yearCreated,
          autoRenewMonthly: businessOffers.autoRenewMonthly,
          isTemplate: businessOffers.isTemplate,
          pausedDueToPayment: businessOffers.pausedDueToPayment,
          // Business information (COMPLETE INFO FOR CUSTOMERS)
          businessName: users.businessName,
          fallbackName: users.name,
          businessLocation: users.location,
          businessImage: users.profileImage,
          businessPhone: users.phoneNumber,
          businessAddress: users.streetAddress,
          businessWebsite: users.websiteUrl,
        })
        .from(businessOffers)
        .innerJoin(users, eq(businessOffers.businessId, users.id))
        .where(and(
          eq(businessOffers.isActive, true),
          isNotNull(users.businessName)
        ))
        .orderBy(businessOffers.createdAt);
      
      console.log(`🎯 FOUND ${offersWithBusiness.length} ACTIVE BUSINESS OFFERS`);
      console.log(`🔍 FIRST OFFER RAW FROM DB:`, JSON.stringify(offersWithBusiness[0], null, 2));
      
      // Apply fallback logic for business names and log for debugging
      const processedOffers = offersWithBusiness.map(offer => {
        const finalBusinessName = offer.businessName || offer.fallbackName || 'Business Name Missing';
        
        // Log processing for first few offers
        if (offersWithBusiness.indexOf(offer) < 3) {
          console.log(`  - ID: ${offer.id}, Title: ${offer.title}, Business: ${finalBusinessName}, Business ID: ${offer.businessId}`);
          console.log(`  - DEBUG: businessName=${offer.businessName}, businessLocation=${offer.businessLocation}, businessPhone=${offer.businessPhone}, businessAddress=${offer.businessAddress}`);
        }
        
        return {
          ...offer,
          businessName: finalBusinessName,
          fallbackName: undefined // Remove the temporary field
        };
      });
      
      // LOG FINAL API RESPONSE TO DEBUG BUSINESS INFO
      console.log(`📡 API RESPONSE SAMPLE:`, JSON.stringify(processedOffers[0], null, 2));
      console.log(`🔍 BUSINESS FIELDS IN RESPONSE:`, {
        businessName: processedOffers[0]?.businessName,
        businessPhone: processedOffers[0]?.businessPhone,
        businessAddress: processedOffers[0]?.businessAddress,
        businessLocation: processedOffers[0]?.businessLocation
      });
      return res.json(processedOffers);
    } catch (error) {
      console.error("🚨 ERROR fetching business offers:", error);
      return res.status(500).json({ error: "Failed to fetch business offers" });
    }
  });

  // Get business offers for a specific business - WITH BUSINESS INFO
  app.get("/api/business-deals/business/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      
      // Get business offers WITH business information (same as main endpoint)
      const offersWithBusiness = await db
        .select({
          // All business offer fields
          id: businessOffers.id,
          businessId: businessOffers.businessId,
          title: businessOffers.title,
          description: businessOffers.description,
          category: businessOffers.category,
          discountType: businessOffers.discountType,
          discountValue: businessOffers.discountValue,
          discountCode: businessOffers.discountCode,
          targetAudience: businessOffers.targetAudience,
          city: businessOffers.city,
          state: businessOffers.state,
          country: businessOffers.country,
          validFrom: businessOffers.validFrom,
          validUntil: businessOffers.validUntil,
          maxRedemptions: businessOffers.maxRedemptions,
          currentRedemptions: businessOffers.currentRedemptions,
          isActive: businessOffers.isActive,
          imageUrl: businessOffers.imageUrl,
          termsConditions: businessOffers.termsConditions,
          contactInfo: businessOffers.contactInfo,
          websiteUrl: businessOffers.websiteUrl,
          tags: businessOffers.tags,
          viewCount: businessOffers.viewCount,
          createdAt: businessOffers.createdAt,
          updatedAt: businessOffers.updatedAt,
          maxRedemptionsPerUser: businessOffers.maxRedemptionsPerUser,
          monthCreated: businessOffers.monthCreated,
          yearCreated: businessOffers.yearCreated,
          autoRenewMonthly: businessOffers.autoRenewMonthly,
          isTemplate: businessOffers.isTemplate,
          pausedDueToPayment: businessOffers.pausedDueToPayment,
          // Business information
          businessName: users.businessName,
          fallbackName: users.name,
          businessLocation: users.location,
          businessImage: users.profileImage,
          businessPhone: users.phoneNumber,
          businessAddress: users.streetAddress,
          businessWebsite: users.websiteUrl,
        })
        .from(businessOffers)
        .leftJoin(users, eq(businessOffers.businessId, users.id))
        .where(eq(businessOffers.businessId, businessId))
        .orderBy(businessOffers.createdAt);

      // Apply same fallback logic as main endpoint
      const processedOffers = offersWithBusiness.map(offer => ({
        ...offer,
        businessName: offer.businessName || offer.fallbackName || 'Business Name Missing',
        fallbackName: undefined
      }));
      
      console.log(`🏢 BUSINESS OFFERS FOR BUSINESS ${businessId}: Found ${processedOffers.length} offers`);
      return res.json(processedOffers);
    } catch (error) {
      console.error("Error fetching business offers for business:", error);
      return res.json([]);
    }
  });

  // CRITICAL: Create business offer (POST) - SIMPLIFIED FOR INSTANT DEALS
  app.post("/api/business-deals", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const businessId = parseInt(userId as string);
      console.log(`Creating instant deal for business ID: ${businessId}`);

      // Process tags properly
      let tags = [];
      if (req.body.tags && typeof req.body.tags === 'string') {
        tags = req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      // Process targetAudience properly  
      let targetAudience = req.body.targetAudience || ['both'];
      if (!Array.isArray(targetAudience)) {
        targetAudience = [targetAudience];
      }

      // Create instant deal with current time (no date parsing issues)
      const [newOffer] = await db.insert(businessOffers).values({
        businessId,
        title: req.body.title || 'Instant Deal',
        description: req.body.description || 'Limited time offer',
        category: req.body.category || 'instant_deal',
        discountType: req.body.discountType || 'percentage',
        discountValue: req.body.discountValue || '20',
        targetAudience,
        city: req.body.city || 'Los Angeles',
        state: req.body.state || 'California',
        country: req.body.country || 'United States',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        currentRedemptions: 0,
        isActive: true,
        tags
      }).returning();
      
      console.log('✅ INSTANT DEAL CREATED:', newOffer);
      return res.json(newOffer);
      
    } catch (error) {
      console.error("🚨 INSTANT DEAL CREATION ERROR:", error);
      return res.status(500).json({ message: "Failed to create instant deal", error: error.message });
    }
  });

  // PUT: Update business deal
  app.put("/api/business-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      console.log("UPDATE BUSINESS DEAL:", dealId, "by user:", userId);

      const updatedDeal = await db
        .update(businessOffers)
        .set({
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          discountType: req.body.discountType,
          discountValue: req.body.discountValue,
          discountCode: req.body.discountCode,
          validFrom: new Date(req.body.validFrom),
          validUntil: new Date(req.body.validUntil),
          imageUrl: req.body.imageUrl,
          termsConditions: req.body.termsConditions,
        })
        .where(and(
          eq(businessOffers.id, dealId),
          eq(businessOffers.businessId, parseInt(userId))
        ))
        .returning();

      if (updatedDeal.length === 0) {
        return res.status(404).json({ message: "Deal not found or you don't have permission" });
      }

      return res.json(updatedDeal[0]);
    } catch (error) {
      console.error("Failed to update business deal:", error);
      return res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // DELETE: Delete business deal
  app.delete("/api/business-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      console.log("DELETE BUSINESS DEAL:", dealId, "by user:", userId);

      const deletedDeal = await db
        .delete(businessOffers)
        .where(and(
          eq(businessOffers.id, dealId),
          eq(businessOffers.businessId, parseInt(userId))
        ))
        .returning();

      if (deletedDeal.length === 0) {
        return res.status(404).json({ message: "Deal not found or you don't have permission" });
      }

      return res.json({ message: "Deal deleted successfully" });
    } catch (error) {
      console.error("Failed to delete business deal:", error);
      return res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Get business deals analytics
  app.get("/api/business-deals/analytics", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const businessId = parseInt(userId);
      
      // Get analytics for business deals
      const totalOffers = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(eq(businessOffers.businessId, businessId));

      const activeOffers = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(and(
          eq(businessOffers.businessId, businessId),
          eq(businessOffers.isActive, true),
          gt(businessOffers.validUntil, new Date())
        ));

      return res.json({
        totalOffers: totalOffers[0]?.count || 0,
        activeOffers: activeOffers[0]?.count || 0,
        totalViews: 0, // Placeholder for future implementation
        totalRedemptions: 0 // Placeholder for future implementation
      });
    } catch (error) {
      console.error("Failed to get business analytics:", error);
      return res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // NEW: Business Deals API with Complete Information 
  app.get("/api/business-deals", async (req, res) => {
    try {
      console.log("🎯 FETCHING BUSINESS DEALS WITH COMPLETE BUSINESS INFO");
      
      // Get all active business offers with complete business information
      const dealsWithBusinessInfo = await db
        .select({
          // Deal fields
          id: businessOffers.id,
          businessId: businessOffers.businessId,
          title: businessOffers.title,
          description: businessOffers.description,
          category: businessOffers.category,
          discountType: businessOffers.discountType,
          discountValue: businessOffers.discountValue,
          discountCode: businessOffers.discountCode,
          validFrom: businessOffers.validFrom,
          validUntil: businessOffers.validUntil,
          isActive: businessOffers.isActive,
          imageUrl: businessOffers.imageUrl,
          termsConditions: businessOffers.termsConditions,
          city: businessOffers.city,
          state: businessOffers.state,
          country: businessOffers.country,
          // Complete Business Information
          businessName: users.businessName,
          businessDescription: users.businessDescription,
          businessType: users.businessType,
          businessLocation: users.location,
          businessEmail: users.email,
          businessPhone: users.phoneNumber,
          businessImage: users.profileImage,
        })
        .from(businessOffers)
        .innerJoin(users, eq(businessOffers.businessId, users.id))
        .where(and(
          eq(businessOffers.isActive, true),
          eq(users.userType, 'business')
        ))
        .orderBy(desc(businessOffers.createdAt));
      
      console.log(`🎯 FOUND ${dealsWithBusinessInfo.length} BUSINESS DEALS WITH COMPLETE INFO`);
      
      // Format the response for frontend consumption
      const formattedDeals = dealsWithBusinessInfo.map(deal => ({
        // Deal information
        id: deal.id,
        businessId: deal.businessId,
        title: deal.title,
        description: deal.description,
        category: deal.category,
        discountType: deal.discountType,
        discountValue: deal.discountValue,
        discountCode: deal.discountCode,
        validFrom: deal.validFrom,
        validUntil: deal.validUntil,
        isActive: deal.isActive,
        imageUrl: deal.imageUrl,
        termsConditions: deal.termsConditions,
        city: deal.city,
        state: deal.state,
        country: deal.country,
        // Complete business information
        businessName: deal.businessName || 'Business Name',
        businessDescription: deal.businessDescription || '',
        businessType: deal.businessType || '',
        businessLocation: deal.businessLocation || '',
        businessEmail: deal.businessEmail || '',
        businessPhone: deal.businessPhone || '',
        businessImage: deal.businessImage || null,
      }));
      
      console.log(`✅ BUSINESS DEALS API: Returning ${formattedDeals.length} deals with complete business information`);
      return res.json(formattedDeals);
    } catch (error) {
      console.error("Failed to get business deals:", error);
      return res.status(500).json({ message: "Failed to get business deals" });
    }
  });

  // CREATE quick meetup endpoint
  app.post("/api/quick-meetups", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const meetupData = {
        ...req.body,
        organizerId: parseInt(userId as string)
      };

      console.log(`🚀 CREATING QUICK MEETUP: ${meetupData.title} by user ${userId}`);
      console.log(`🏠 STREET ADDRESS RECEIVED:`, meetupData.street);
      console.log(`📦 FULL REQUEST BODY:`, req.body);
      
      const newMeetup = await storage.createQuickMeetup(meetupData);
      console.log(`✅ QUICK MEETUP CREATED: ID ${newMeetup.id}, expires at ${newMeetup.expiresAt}`);
      console.log(`🏠 STREET ADDRESS SAVED:`, newMeetup.street);
      
      res.json(newMeetup);
    } catch (error) {
      console.error("Error creating quick meetup:", error);
      res.status(500).json({ message: "Failed to create quick meetup" });
    }
  });

  // Get single quick meetup by ID
  app.get("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      if (isNaN(meetupId)) {
        return res.status(400).json({ message: "Invalid meetup ID" });
      }

      const meetup = await storage.getQuickMeetupById(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      res.json(meetup);
    } catch (error) {
      console.error("Error fetching quick meetup:", error);
      res.status(500).json({ message: "Failed to fetch meetup" });
    }
  });

  // CRITICAL: Get quick meetups - ACTIVE FIRST, NEWEST FIRST - RAW SQL VERSION
  app.get("/api/quick-meetups", async (req, res) => {
    try {
      const { city } = req.query;
      const now = new Date();

      console.log(`QUICK MEETUPS: Fetching all meetups using Drizzle ORM, active first`);

      // Use Drizzle ORM query builder to avoid Neon parameter binding issues
      let query = db
        .select()
        .from(quickMeetups)
        .leftJoin(users, eq(quickMeetups.organizerId, users.id))
        .where(eq(quickMeetups.isActive, true));

      // Add city filtering if specified with LA Metro consolidation
      if (city) {
        const cityName = city.toString().split(',')[0].trim();
        console.log(`QUICK MEETUPS: Filtering by city: ${cityName}`);
        
        // Apply global metropolitan area consolidation for Quick Meetups search
        const cityParts = cityName.split(',').map(part => part.trim());
        const [searchCity, searchState, searchCountry] = cityParts;
        const consolidatedCity = consolidateToMetropolitanArea(searchCity, searchState, searchCountry);
        
        const searchCities = consolidatedCity !== searchCity 
          ? [consolidatedCity, ...getMetropolitanAreaCities(consolidatedCity, searchState, searchCountry)]
          : [cityName];
        
        console.log(`🌍 QUICK MEETUPS METRO: Searching cities:`, searchCities);
        
        const cityConditions = searchCities.map(searchCity => 
          or(
            ilike(quickMeetups.location, `%${searchCity}%`),
            ilike(quickMeetups.city, `%${searchCity}%`)
          )
        );
        
        query = query.where(
          and(
            eq(quickMeetups.isActive, true),
            or(...cityConditions)
          )
        );
      }

      const queryResult = await query.orderBy(desc(quickMeetups.createdAt));
      
      // Transform the joined data to match expected format
      const allMeetups = queryResult.map(row => ({
        ...row.quick_meetups,
        organizerUsername: row.users?.username || null,
        organizerName: row.users?.name || null,
        organizerProfileImage: row.users?.profileImage || null
      }));
      
      // Separate active and expired, then sort each group by newest first
      const activeMeetups = allMeetups
        .filter(meetup => new Date(meetup.expiresAt) > now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      const expiredMeetups = allMeetups
        .filter(meetup => new Date(meetup.expiresAt) <= now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Combine: active first, then expired
      const sortedMeetups = [...activeMeetups, ...expiredMeetups];

      console.log(`QUICK MEETUPS: Found ${activeMeetups.length} active + ${expiredMeetups.length} expired = ${sortedMeetups.length} total meetups`);

      return res.json(sortedMeetups);
    } catch (error) {
      console.error("Error fetching quick meetups:", error);
      return res.json([]);
    }
  });

  // GET quick meetup participants - CRITICAL MISSING ENDPOINT
  app.get("/api/quick-meetups/:id/participants", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      console.log(`👥 GETTING PARTICIPANTS FOR MEETUP ${meetupId}`);
      
      const participants = await storage.getQuickMeetupParticipants(meetupId);
      console.log(`👥 FOUND ${participants.length} PARTICIPANTS:`, participants.map(p => p.user?.username));
      
      return res.json(participants);
    } catch (error) {
      console.error("Error fetching meetup participants:", error);
      return res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // JOIN quick meetup endpoint - CRITICAL MISSING ENDPOINT
  app.post("/api/quick-meetups/:id/join", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      console.log(`🤝 USER ${userId} JOINING MEETUP ${meetupId}`);

      // Check if meetup exists and is active
      const meetup = await storage.getQuickMeetup(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      if (new Date(meetup.expiresAt) <= new Date()) {
        return res.status(400).json({ message: "This meetup has expired" });
      }

      // Join the meetup
      const result = await storage.joinQuickMeetup(meetupId, parseInt(userId as string));
      console.log(`✅ USER ${userId} SUCCESSFULLY JOINED MEETUP ${meetupId}`);
      
      return res.json({ success: true, result });
    } catch (error) {
      console.error("Error joining quick meetup:", error);
      return res.status(500).json({ message: "Failed to join meetup" });
    }
  });

  // GET quick meetup chatroom
  app.get("/api/quick-meetup-chatrooms/:meetupId", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.meetupId);
      
      if (!meetupId) {
        return res.status(400).json({ message: "Invalid meetup ID" });
      }

      const chatroom = await storage.getQuickMeetupChatroom(meetupId);
      if (!chatroom) {
        // Create chatroom if it doesn't exist
        const newChatroom = await storage.createQuickMeetupChatroom(meetupId);
        return res.json(newChatroom);
      }

      return res.json(chatroom);
    } catch (error) {
      console.error("Error fetching quick meetup chatroom:", error);
      return res.status(500).json({ message: "Failed to fetch chatroom" });
    }
  });

  // GET quick meetup chatroom messages
  app.get("/api/quick-meetup-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const messages = await storage.getQuickMeetupChatroomMessages(chatroomId);
      return res.json(messages);
    } catch (error) {
      console.error("Error fetching quick meetup chatroom messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // POST quick meetup chatroom message
  app.post("/api/quick-meetup-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId);
      const userId = req.headers['x-user-id'];
      const { content } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content required" });
      }

      const message = await storage.createQuickMeetupChatroomMessage(
        chatroomId,
        parseInt(userId as string),
        content.trim()
      );

      return res.json(message);
    } catch (error) {
      console.error("Error creating quick meetup chatroom message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // JOIN quick meetup chatroom
  app.post("/api/quick-meetup-chatrooms/:chatroomId/join", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const result = await storage.joinQuickMeetupChatroom(chatroomId, parseInt(userId as string));
      return res.json(result);
    } catch (error) {
      console.error("Error joining quick meetup chatroom:", error);
      return res.status(500).json({ message: "Failed to join chatroom" });
    }
  });

  // RESTART quick meetup from expired meetup
  app.post("/api/quick-meetups/:id/restart", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      const { duration = '1hour' } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      console.log(`🔄 RESTARTING MEETUP ${meetupId} for user ${userId} with duration ${duration}`);

      // Get the original meetup to copy its details
      const originalMeetup = await storage.getQuickMeetup(meetupId);
      if (!originalMeetup) {
        return res.status(404).json({ message: "Original meetup not found" });
      }

      // Check if user is the original organizer
      if (originalMeetup.organizerId !== parseInt(userId as string)) {
        return res.status(403).json({ message: "Only the original organizer can restart this meetup" });
      }

      // Create new meetup with same details but fresh expiration
      const now = new Date();
      const durationMs = {
        '1hour': 1 * 60 * 60 * 1000,
        '2hours': 2 * 60 * 60 * 1000,
        '3hours': 3 * 60 * 60 * 1000,
        '4hours': 4 * 60 * 60 * 1000,
        '6hours': 6 * 60 * 60 * 1000,
        '12hours': 12 * 60 * 60 * 1000,
        '24hours': 24 * 60 * 60 * 1000
      }[duration] || 1 * 60 * 60 * 1000;

      const newMeetupData = {
        organizerId: originalMeetup.organizerId,
        title: originalMeetup.title,
        description: originalMeetup.description,
        category: originalMeetup.category,
        location: originalMeetup.location,
        meetingPoint: originalMeetup.meetingPoint,
        street: originalMeetup.street,
        city: originalMeetup.city,
        state: originalMeetup.state,
        country: originalMeetup.country,
        zipcode: originalMeetup.zipcode,
        maxParticipants: originalMeetup.maxParticipants,
        minParticipants: originalMeetup.minParticipants,
        responseTime: duration,
        expiresAt: new Date(now.getTime() + durationMs).toISOString(),
        availableAt: now.toISOString()
      };

      const newMeetup = await storage.createQuickMeetup(newMeetupData);
      console.log(`✅ MEETUP RESTARTED: New ID ${newMeetup.id} from original ${meetupId}`);
      
      return res.json({ 
        success: true, 
        meetup: newMeetup,
        message: "Meetup successfully restarted with fresh participant list"
      });
    } catch (error) {
      console.error("Error restarting quick meetup:", error);
      return res.status(500).json({ message: "Failed to restart meetup" });
    }
  });

  // UPDATE quick meetup
  app.put("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the meetup to verify ownership
      const existingMeetup = await storage.getQuickMeetup(meetupId);
      if (!existingMeetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      // Check if user is the organizer
      if (existingMeetup.organizerId !== parseInt(userId as string)) {
        return res.status(403).json({ message: "Only the organizer can edit this meetup" });
      }

      const { title, description, duration } = req.body;
      const updates: any = {};

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      
      // Handle duration extension
      if (duration) {
        const durationMs = {
          '1hour': 1 * 60 * 60 * 1000,
          '2hours': 2 * 60 * 60 * 1000,
          '3hours': 3 * 60 * 60 * 1000,
          '4hours': 4 * 60 * 60 * 1000,
          '6hours': 6 * 60 * 60 * 1000,
          '12hours': 12 * 60 * 60 * 1000,
          '24hours': 24 * 60 * 60 * 1000
        }[duration] || 1 * 60 * 60 * 1000;

        const currentExpiry = new Date(existingMeetup.expiresAt);
        const newExpiry = new Date(currentExpiry.getTime() + durationMs);
        updates.expiresAt = newExpiry.toISOString();
      }

      console.log(`🔄 UPDATING MEETUP ${meetupId} for user ${userId}:`, updates);

      const updatedMeetup = await storage.updateQuickMeetup(meetupId, updates);
      if (!updatedMeetup) {
        return res.status(500).json({ message: "Failed to update meetup" });
      }

      console.log(`✅ MEETUP UPDATED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        meetup: updatedMeetup,
        message: "Meetup updated successfully"
      });
    } catch (error) {
      console.error("Error updating quick meetup:", error);
      return res.status(500).json({ message: "Failed to update meetup" });
    }
  });

  // DELETE quick meetup
  app.delete("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the meetup to verify ownership
      const existingMeetup = await storage.getQuickMeetup(meetupId);
      if (!existingMeetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      // Check if user is the organizer
      if (existingMeetup.organizerId !== parseInt(userId as string)) {
        return res.status(403).json({ message: "Only the organizer can delete this meetup" });
      }

      console.log(`🗑️ DELETING MEETUP ${meetupId} for user ${userId}`);

      const deleted = await storage.deleteQuickMeetup(meetupId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete meetup" });
      }

      console.log(`✅ MEETUP DELETED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        message: "Meetup deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting quick meetup:", error);
      return res.status(500).json({ message: "Failed to delete meetup" });
    }
  });

  // GET user's expired meetups for restart management
  app.get("/api/users/:userId/expired-meetups", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const authUserId = req.headers['x-user-id'];
      
      if (!authUserId || parseInt(authUserId as string) !== userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      console.log(`📋 FETCHING EXPIRED MEETUPS for user ${userId}`);
      
      const expiredMeetups = await storage.getUserArchivedMeetups(userId);
      console.log(`Found ${expiredMeetups.length} expired meetups for restart`);
      
      return res.json(expiredMeetups);
    } catch (error) {
      console.error("Error fetching expired meetups:", error);
      return res.status(500).json({ message: "Failed to fetch expired meetups" });
    }
  });

  // GET businesses by location endpoint with LA Metro consolidation
  app.get("/api/businesses", async (req, res) => {
    try {
      const { city, state, country, category } = req.query;
      
      if (!city) {
        return res.status(400).json({ message: "City parameter is required" });
      }

      console.log(`🏢 FETCHING BUSINESSES: ${city}, ${state}, ${country} ${category ? `(category: ${category})` : ''}`);
      
      // Apply global metropolitan area consolidation to search location
      const searchCity = city as string;
      const consolidatedSearchCity = consolidateToMetropolitanArea(searchCity, state as string, country as string);
      
      let businesses = await storage.getBusinessesByLocation(
        consolidatedSearchCity,
        state as string || '',
        country as string || 'United States',
        category as string
      );

      // If searching for a metropolitan area, also search for all cities in that metro area
      if (consolidatedSearchCity !== searchCity) {
        console.log(`🌍 METRO BUSINESSES: Searching ${consolidatedSearchCity} metro businesses for ${searchCity} user`);
        
        // Also search for businesses in all metro area cities
        const allMetroBusinesses = [];
        const businessIds = new Set(businesses.map(b => b.id));
        
        for (const metroCity of getMetropolitanAreaCities(consolidatedSearchCity, state as string, country as string)) {
          if (metroCity !== consolidatedSearchCity) {
            const metroBusinesses = await storage.getBusinessesByLocation(
              metroCity,
              state as string || '',
              country as string || 'United States',
              category as string
            );
            
            // Add only businesses we haven't seen yet
            for (const business of metroBusinesses) {
              if (!businessIds.has(business.id)) {
                businessIds.add(business.id);
                allMetroBusinesses.push(business);
              }
            }
          }
        }
        
        businesses = [...businesses, ...allMetroBusinesses];
        console.log(`🌍 METRO BUSINESSES: Combined ${businesses.length} businesses from ${consolidatedSearchCity} metro area`);
      }

      console.log(`✅ BUSINESSES API: Found ${businesses.length} businesses for ${searchCity}`);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  // RESTORED: City photos API endpoint with AUTHENTIC user-uploaded photos
  app.get("/api/city-photos", async (req, res) => {
    try {
      const cityPhotos = await storage.getAllCityPhotos();
      console.log('📸 CITY PHOTOS API: Returning', cityPhotos.length, 'photos');
      res.json(cityPhotos);
    } catch (error) {
      console.error("Error fetching city photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  app.get("/api/city-photos/all", async (req, res) => {
    try {
      const cityPhotos = await storage.getAllCityPhotos();
      res.json(cityPhotos);
    } catch (error) {
      console.error("Error fetching city photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  // RESTORED: Upload city photo endpoint
  app.post("/api/city-photos", async (req, res) => {
    try {
      const { cityName, imageData, photographerUsername } = req.body;
      const photo = await storage.createCityPhoto({ cityName, imageData, photographerUsername });
      res.json(photo);
    } catch (error) {
      console.error("Error uploading city photo:", error);
      res.status(500).json({ message: "Failed to upload city photo" });
    }
  });

  // NEW: City photo upload with aura rewards endpoint
  app.post("/api/city-photos/upload", async (req, res) => {
    try {
      const { city, state, country, photographerId, imageData, caption } = req.body;

      if (!city || !country || !photographerId || !imageData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get photographer username
      const photographer = await storage.getUserById(photographerId);
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }

      // Create city photo entry
      const photoData = {
        cityName: city,
        state: state || '',
        country,
        imageData,
        photographerUsername: photographer.username,
        photographerId,
        caption: caption || `Beautiful view of ${city}`,
        createdAt: new Date()
      };

      const photo = await storage.createCityPhoto(photoData);

      // Award aura points (15 points for photo upload)
      const auraAwarded = 15;
      const currentAura = photographer.aura || 0;
      await storage.updateUser(photographerId, { 
        aura: currentAura + auraAwarded 
      });

      console.log(`📸 PHOTO UPLOADED: ${photographer.username} uploaded photo of ${city}, awarded ${auraAwarded} aura`);

      res.json({ 
        success: true,
        photo,
        auraAwarded,
        message: `Photo uploaded successfully! You earned ${auraAwarded} aura points.`
      });
    } catch (error) {
      console.error("Error uploading city photo with aura:", error);
      res.status(500).json({ message: "Failed to upload city photo" });
    }
  });

  // Get city-specific photos endpoint
  app.get("/api/city-photos/:city", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const cityPhotos = await storage.getCityPhotosByCity(city);
      res.json(cityPhotos);
    } catch (error) {
      console.error("Error fetching city-specific photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  // RESTORED: City-specific chatrooms endpoint (CRITICAL FIX WITH MEMBER COUNT)
  app.get("/api/city-chatrooms", async (req, res) => {
    try {
      const { city, state, country } = req.query;
      console.log(`🏙️ CHATROOMS: Getting chatrooms for ${city}, ${state}, ${country}`);

      const chatrooms = await storage.getCityChatrooms(
        city as string, 
        state as string || null, 
        country as string || null
      );

      // APPLY MEMBER COUNT FIX FOR CITY-SPECIFIC CHATROOMS
      const memberCountQuery = await db
        .select({
          chatroomId: chatroomMembers.chatroomId,
          count: sql<string>`COUNT(*)::text`.as('count')
        })
        .from(chatroomMembers)
        .where(eq(chatroomMembers.isActive, true))
        .groupBy(chatroomMembers.chatroomId);
      
      const memberCountMap = new Map();
      memberCountQuery.forEach(mc => {
        memberCountMap.set(mc.chatroomId, parseInt(mc.count) || 1);
      });
      
      // Apply correct member counts to each chatroom
      const chatroomsWithFixedMemberCount = chatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 1 // Use database count or default to 1
      }));

      console.log(`🏙️ CHATROOMS: Found ${chatroomsWithFixedMemberCount.length} chatrooms for ${city} with member counts fixed`);
      res.json(chatroomsWithFixedMemberCount);
    } catch (error) {
      console.error("Error fetching city chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch city chatrooms" });
    }
  });

  // CRITICAL: Get user photos endpoint (MISSING - RESTORED)
  app.get("/api/users/:id/photos", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`📸 PHOTOS: Getting photos for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const photos = await storage.getUserPhotos(userId);
      console.log(`📸 PHOTOS: Found ${photos.length} photos for user ${userId}`);

      return res.json(photos);
    } catch (error) {
      console.error("Error fetching user photos:", error);
      return res.status(500).json({ message: "Failed to fetch user photos" });
    }
  });

  // CRITICAL: Upload user photo endpoint (MISSING - ADDED)
  app.post("/api/users/:id/photos", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { imageData, title, isPublic } = req.body;

      console.log(`📸 UPLOAD: Uploading photo for user ${userId}, title: ${title}, public: ${isPublic}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      // Create the photo record
      const photo = await storage.createUserPhoto({
        userId: userId,
        imageUrl: imageData,
        title: title || null,
        isPublic: isPublic !== false, // Default to true if not specified
        uploadedAt: new Date()
      });

      console.log(`📸 UPLOAD: Successfully created photo ID ${photo.id} for user ${userId}`);

      return res.json({
        message: "Photo uploaded successfully",
        photo: photo
      });
    } catch (error) {
      console.error("Error uploading user photo:", error);
      return res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // CRITICAL: Get user travel memories endpoint (MISSING - RESTORED)
  app.get("/api/users/:id/travel-memories", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`🗺️ MEMORIES: Getting travel memories for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const memories = await storage.getUserTravelMemories(userId);
      console.log(`🗺️ MEMORIES: Found ${memories.length} travel memories for user ${userId}`);

      return res.json(memories);
    } catch (error) {
      console.error("Error fetching user travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch user travel memories" });
    }
  });

  // CRITICAL: Get ALL public travel memories endpoint (MISSING - RESTORED)
  app.get("/api/travel-memories/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      console.log(`🌍 PUBLIC MEMORIES: Getting all public travel memories (limit: ${limit})`);

      const memories = await storage.getPublicTravelMemories(limit);
      console.log(`🌍 PUBLIC MEMORIES: Found ${memories.length} public travel memories`);

      return res.json(memories);
    } catch (error) {
      console.error("Error fetching public travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch public travel memories" });
    }
  });

  // CRITICAL: Get ALL travel memories endpoint (MISSING - RESTORED)
  app.get("/api/travel-memories", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

      if (userId) {
        console.log(`🗺️ MEMORIES: Getting travel memories for user ${userId}`);
        const memories = await storage.getUserTravelMemories(userId);
        console.log(`🗺️ MEMORIES: Found ${memories.length} travel memories for user ${userId}`);
        return res.json(memories);
      } else {
        console.log(`🌍 ALL MEMORIES: Getting all public travel memories`);
        const memories = await storage.getPublicTravelMemories(50);
        console.log(`🌍 ALL MEMORIES: Found ${memories.length} public travel memories`);
        return res.json(memories);
      }
    } catch (error) {
      console.error("Error fetching travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch travel memories" });
    }
  });

  // CRITICAL: Create travel memory endpoint (MISSING - RESTORED)
  app.post("/api/travel-memories", async (req, res) => {
    try {
      console.log('POST /api/travel-memories - Creating travel memory');
      console.log('Request body:', req.body);

      const { userId, destination, city, country, description, date, photos, tags, isPublic, latitude, longitude } = req.body;

      // Validate required fields
      if (!userId || !destination || !description) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, destination, description" 
        });
      }

      const memoryData = {
        userId: parseInt(userId.toString()),
        destination: destination.trim(),
        city: city?.trim() || destination.split(',')[0]?.trim() || 'Unknown',
        country: country?.trim() || destination.split(',')[1]?.trim() || 'Unknown',
        description: description.trim(),
        date: date || new Date().toISOString().split('T')[0],
        photos: Array.isArray(photos) ? photos : [],
        tags: Array.isArray(tags) ? tags : [],
        isPublic: isPublic !== false,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null
      };

      console.log('Creating travel memory with processed data:', memoryData);
      const memory = await storage.createTravelMemory(memoryData);

      return res.status(201).json({
        message: "Travel memory created successfully",
        memory
      });
    } catch (error) {
      console.error("Error creating travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to create travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PHOTO ALBUMS: Get user photo albums endpoint
  app.get("/api/users/:id/photo-albums", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`📸 ALBUMS: Getting photo albums for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const albums = await storage.getUserPhotoAlbums(userId);
      console.log(`📸 ALBUMS: Found ${albums.length} photo albums for user ${userId}`);

      return res.json(albums);
    } catch (error) {
      console.error("Error fetching user photo albums:", error);
      return res.status(500).json({ message: "Failed to fetch user photo albums" });
    }
  });

  // PHOTO ALBUMS: Create photo album endpoint
  app.post("/api/photo-albums", async (req, res) => {
    try {
      console.log('POST /api/photo-albums - Creating photo album');
      console.log('Request body:', req.body);

      const { userId, title, description, date, location, photos, coverPhoto, isPublic } = req.body;

      // Validate required fields
      if (!userId || !title || !photos || photos.length === 0) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, title, photos" 
        });
      }

      const albumData = {
        userId: parseInt(userId.toString()),
        title: title.trim(),
        description: description?.trim() || '',
        date: date || new Date().toISOString().split('T')[0],
        location: location?.trim() || '',
        photos: Array.isArray(photos) ? photos : [],
        coverPhoto: coverPhoto || photos[0],
        isPublic: isPublic !== false
      };

      console.log('Creating photo album with data:', albumData);
      const album = await storage.createPhotoAlbum(albumData);

      return res.status(201).json({
        message: "Photo album created successfully",
        album
      });
    } catch (error) {
      console.error("Error creating photo album:", error);
      return res.status(500).json({ 
        message: "Failed to create photo album",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // CRITICAL: Get user matches and compatibility data 
  app.get("/api/users/:userId/matches", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`MATCHES: Getting compatibility matches for user ${userId}`);

      const matches = await matchingService.findMatches(userId);
      console.log(` MATCHES: Found ${matches.length} compatibility matches`);

      return res.json(matches);
    } catch (error) {
      console.error("Error fetching user matches:", error);
      return res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // RESTORED: City map data endpoint
  app.get("/api/city-map-data", (req, res) => {
    // Static map data for demo purposes
    res.json([
      { id: 1, name: "Central Park", lat: 40.7829, lng: -73.9654, type: "park" },
      { id: 2, name: "Times Square", lat: 40.7580, lng: -73.9855, type: "landmark" },
      { id: 3, name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, type: "bridge" }
    ]);
  });

  // GET /api/auth/user - Emergency auth recovery endpoint
  app.get("/api/auth/user", async (req, res) => {
    try {
      // This endpoint is used by the frontend for emergency auth recovery
      // For now, return empty response since we don't have session-based auth
      res.status(401).json({ message: "No authenticated session found" });
    } catch (error) {
      console.error("Auth user endpoint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Group Chat Rooms API endpoints for instant messaging modals

  // Get user's joined rooms
  app.get("/api/chatrooms/my-rooms", async (req, res) => {
    try {
      const userId = req.session?.user?.id || 1; // Default to nearbytraveler

      const allChatrooms = await db.select().from(citychatrooms);
      // Return user's joined rooms (can be enhanced with membership tracking)
      const joinedRooms = allChatrooms.slice(0, 5).map(room => ({
        ...room,
        isMember: true,
        type: room.tags?.includes('meetup') ? 'meetup' : 'general'
      }));

      res.json(joinedRooms);
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      res.status(500).json({ message: "Failed to fetch user rooms" });
    }
  });

  // Get public chatrooms
  app.get("/api/chatrooms/public", async (req, res) => {
    try {
      const allChatrooms = await db.select().from(citychatrooms);
      const publicRooms = allChatrooms
        .filter(room => room.isPublic)
        .map(room => ({
          ...room,
          isMember: false,
          type: room.tags?.includes('meetup') ? 'meetup' : 'general'
        }));

      res.json(publicRooms);
    } catch (error) {
      console.error("Error fetching public rooms:", error);
      res.status(500).json({ message: "Failed to fetch public rooms" });
    }
  });

  // Get event-based chatrooms
  app.get("/api/chatrooms/events", async (req, res) => {
    try {
      const allChatrooms = await db.select().from(citychatrooms);
      const eventRooms = allChatrooms
        .filter(room => room.tags?.includes('meetup') || room.tags?.includes('event'))
        .map(room => ({
          ...room,
          isMember: false,
          type: 'event'
        }));

      res.json(eventRooms);
    } catch (error) {
      console.error("Error fetching event rooms:", error);
      res.status(500).json({ message: "Failed to fetch event rooms" });
    }
  });

  // Get chatrooms for user's locations (hometown + travel destinations) - FIXED MEMBER COUNT
  app.get("/api/chatrooms/my-locations", async (req, res) => {
    // Disable any caching for debugging
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      console.log("🔥 MY-LOCATIONS ROUTE CALLED! 🔥");
      
      // Get user ID from headers - all users viewing chatrooms are already authenticated
      let userId = 1; // Default to nearbytraveler user if not specified
      const userData = req.headers['x-user-data'];
      if (userData) {
        try {
          userId = JSON.parse(userData as string).id;
        } catch (e) {
          // Use default user ID
        }
      }

      console.log(`🔥 USER ID DETERMINED: ${userId} 🔥`);

      const chatrooms = await storage.getCityChatrooms(undefined, undefined, undefined, userId);
      console.log(`🔥 STORAGE RETURNED: ${chatrooms.length} chatrooms 🔥`);
      
      // DIRECT FIX: Query member counts from database and merge with chatroom data
      const memberCountQuery = await db
        .select({
          chatroomId: chatroomMembers.chatroomId,
          count: sql<string>`COUNT(*)::text`.as('count')
        })
        .from(chatroomMembers)
        .where(eq(chatroomMembers.isActive, true))
        .groupBy(chatroomMembers.chatroomId);
      
      const memberCountMap = new Map();
      memberCountQuery.forEach(mc => {
        memberCountMap.set(mc.chatroomId, parseInt(mc.count) || 1);
      });
      
      // Apply correct member counts to each chatroom
      const chatroomsWithFixedMemberCount = chatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 1 // Use database count or default to 1
      }));
      
      console.log(`🔥 FIXED MEMBER COUNT: First chatroom now has memberCount=${chatroomsWithFixedMemberCount[0]?.memberCount} 🔥`);
      
      res.json(chatroomsWithFixedMemberCount);
    } catch (error) {
      console.error("🔥 ERROR IN MY-LOCATIONS ROUTE:", error);
      res.status(500).json({ message: "Failed to fetch location chatrooms" });
    }
  });

  // Get city-based chatrooms
  app.get("/api/chatrooms/cities", async (req, res) => {
    try {
      const allChatrooms = await db.select().from(citychatrooms);
      const cityRooms = allChatrooms
        .filter(room => room.city && room.city !== '')
        .map(room => ({
          ...room,
          isMember: false,
          type: 'city'
        }));

      res.json(cityRooms);
    } catch (error) {
      console.error("Error fetching city rooms:", error);
      res.status(500).json({ message: "Failed to fetch city rooms" });
    }
  });

  // Join a chatroom
  app.post("/api/chatrooms/:roomId/join", async (req, res) => {
    try {
      // Get user ID from headers - all users viewing chatrooms are already authenticated
      let userId = 1; // Default to nearbytraveler user if not specified
      const userData = req.headers['x-user-data'];
      if (userData) {
        try {
          userId = JSON.parse(userData as string).id;
        } catch (e) {
          // Use default user ID
        }
      }

      // Try other auth methods as fallback
      if (!userId && req.session?.user?.id) {
        userId = req.session.user.id;
      }

      if (!userId && req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string);
      }

      const roomId = parseInt(req.params.roomId);
      console.log(`🏠 CHATROOM JOIN: User ${userId} joining chatroom ${roomId}`);

      // Check if chatroom exists
      const chatroom = await db.select().from(citychatrooms).where(eq(citychatrooms.id, roomId)).limit(1);
      if (chatroom.length === 0) {
        return res.status(404).json({ message: "Chatroom not found" });
      }

      // Check if user is already a member
      const existingMembership = await db.select()
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.chatroomId, roomId),
          eq(chatroomMembers.userId, userId),
          eq(chatroomMembers.isActive, true)
        ))
        .limit(1);

      if (existingMembership.length > 0) {
        console.log(`🏠 CHATROOM JOIN: User ${userId} already member of chatroom ${roomId}`);
        return res.json({ success: true, message: "Already a member" });
      }

      // Add user to chatroom
      await db.insert(chatroomMembers).values({
        chatroomId: roomId,
        userId: userId,
        role: 'member',
        joinedAt: new Date(),
        isActive: true,
        isMuted: false
      });

      console.log(`🏠 CHATROOM JOIN: User ${userId} successfully joined chatroom ${roomId}`);
      res.json({ success: true, message: "Successfully joined room" });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  // Leave a chatroom
  app.post("/api/chatrooms/:roomId/leave", async (req, res) => {
    try {
      // Get user ID from headers - all users viewing chatrooms are already authenticated
      let userId = 1; // Default to nearbytraveler user if not specified
      const userData = req.headers['x-user-data'];
      if (userData) {
        try {
          userId = JSON.parse(userData as string).id;
        } catch (e) {
          // Use default user ID
        }
      }

      // Try other auth methods as fallback
      if (!userId && req.session?.user?.id) {
        userId = req.session.user.id;
      }

      if (!userId && req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string);
      }

      const roomId = parseInt(req.params.roomId);
      console.log(`🏠 CHATROOM LEAVE: User ${userId} leaving chatroom ${roomId}`);

      // Deactivate membership
      await db.update(chatroomMembers)
        .set({ isActive: false })
        .where(and(
          eq(chatroomMembers.chatroomId, roomId),
          eq(chatroomMembers.userId, userId)
        ));

      console.log(`🏠 CHATROOM LEAVE: User ${userId} successfully left chatroom ${roomId}`);
      res.json({ success: true, message: "Successfully left room" });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  // User status and notification settings endpoints
  app.put("/api/users/notification-settings", async (req, res) => {
    try {
      const userId = req.session?.user?.id || 1; // Default to nearbytraveler

      // For now, just return success (can be enhanced with actual settings storage)
      res.json({ success: true, message: "Notification settings updated" });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  app.put("/api/users/status", async (req, res) => {
    try {
      const userId = req.session?.user?.id || 1; // Default to nearbytraveler

      // For now, just return success (can be enhanced with actual status storage)
      res.json({ success: true, message: "Status updated" });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Retroactive aura award system - award missing aura for existing users
  // TODO: Implement retroactive aura award system

  // Set up WebSocket server for instant messaging on a different path
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  interface AuthenticatedWebSocket extends WebSocket {
    userId?: number;
    username?: string;
    isAuthenticated?: boolean;
  }

  const connectedUsers = new Map<number, AuthenticatedWebSocket>();

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log(' New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📥 WebSocket message received:', data);

        switch (data.type) {
          case 'auth':
            ws.userId = data.userId;
            ws.username = data.username;
            ws.isAuthenticated = true;
            connectedUsers.set(data.userId, ws);
            console.log(` User ${data.username} (${data.userId}) authenticated via WebSocket`);

            // Send any pending offline messages when user comes online
            await deliverOfflineMessages(data.userId);
            break;

          case 'instant_message':
            if (!ws.isAuthenticated || !ws.userId) {
              console.log(' Unauthenticated user trying to send message');
              return;
            }

            const { receiverId, content } = data;
            console.log(`💬 Instant message from ${ws.userId} to ${receiverId}: ${content}`);

            // Store IM in database for offline delivery
            try {
              const newMessage = await db.insert(messages).values({
                senderId: ws.userId,
                receiverId,
                content,
                messageType: 'instant',
                isRead: false,
                createdAt: new Date()
              }).returning();

              console.log(`💾 IM stored in database with ID: ${newMessage[0].id}`);
            } catch (error) {
              console.error(' Error storing IM in database:', error);
            }

            // Check if receiver is online for instant delivery
            const receiverWs = connectedUsers.get(receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              // Send instantly to online user
              receiverWs.send(JSON.stringify({
                type: 'instant_message_received',
                message: {
                  senderId: ws.userId,
                  senderUsername: ws.username,
                  content,
                  timestamp: new Date().toISOString()
                }
              }));
              console.log(` Instant message delivered to online user ${receiverId}`);
            } else {
              console.log(`📪 User ${receiverId} is offline - will receive message when they come online`);
            }
            break;

          case 'typing':
            if (!ws.isAuthenticated) return;
            const typingReceiverWs = connectedUsers.get(data.receiverId);
            if (typingReceiverWs && typingReceiverWs.readyState === WebSocket.OPEN) {
              typingReceiverWs.send(JSON.stringify({
                type: 'user_typing',
                senderId: ws.userId,
                senderUsername: ws.username,
                isTyping: data.isTyping
              }));
            }
            break;
        }
      } catch (error) {
        console.error(' WebSocket message parsing error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId && ws.isAuthenticated) {
        connectedUsers.delete(ws.userId);
        console.log(`🔴 User ${ws.username} (${ws.userId}) disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('🔴 WebSocket error:', error);
    });
  });

  // Deliver offline messages when user comes online
  async function deliverOfflineMessages(userId: number) {
    try {
      // Get unread messages for this user
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        )
        .orderBy(asc(messages.createdAt));

      const userWs = connectedUsers.get(userId);
      if (userWs && userWs.readyState === WebSocket.OPEN && unreadMessages.length > 0) {
        console.log(`📬 Delivering ${unreadMessages.length} offline messages to user ${userId}`);

        for (const message of unreadMessages) {
          // Get sender username
          const sender = await db
            .select({ username: users.username })
            .from(users)
            .where(eq(users.id, message.senderId))
            .limit(1);

          userWs.send(JSON.stringify({
            type: 'instant_message_received',
            message: {
              id: message.id,
              senderId: message.senderId,
              senderUsername: sender[0]?.username || 'Unknown',
              content: message.content,
              timestamp: message.createdAt.toISOString(),
              isOfflineDelivery: true
            }
          }));
        }

        // Mark messages as read
        await db
          .update(messages)
          .set({ isRead: true })
          .where(
            and(
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        console.log(` Marked ${unreadMessages.length} messages as read for user ${userId}`);
      }
    } catch (error) {
      console.error(' Error delivering offline messages:', error);
    }
  }

  // CRITICAL: Cities API endpoint for city-specific matching
  app.get('/api/cities/all', async (req, res) => {
    try {
      console.log('🏙️ CITIES API: Fetching all cities...');

      // Get actual counts for each city
      const citiesFromPages = await db
        .select({
          city: cityPages.city,
          state: cityPages.state,
          country: cityPages.country,
          localCount: sql<number>`(SELECT COUNT(*) FROM users WHERE hometown_city = ${cityPages.city})`.as('localCount'),
          travelerCount: sql<number>`(SELECT COUNT(*) FROM users WHERE is_currently_traveling = true AND travel_destination LIKE '%' || ${cityPages.city} || '%')`.as('travelerCount'),
          eventCount: sql<number>`(SELECT COUNT(*) FROM ${events} WHERE ${events.location} LIKE '%' || ${cityPages.city} || '%')`.as('eventCount')
        })
        .from(cityPages)
        .orderBy(sql<number>`(SELECT COUNT(*) FROM users WHERE hometown_city = ${cityPages.city}) + (SELECT COUNT(*) FROM users WHERE is_currently_traveling = true AND travel_destination LIKE '%' || ${cityPages.city} || '%') DESC`)
        .limit(50);

      console.log(`🏙️ CITIES API: Found ${citiesFromPages.length} cities`);
      console.log('🏙️ CITIES API: First 3 cities:', citiesFromPages.slice(0, 3));

      res.json(citiesFromPages);
    } catch (error) {
      console.error('CITIES API ERROR:', error);
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });

  // REMOVED: Duplicate city activities route - using the correct one later in the file

  // REMOVED: Duplicate POST route - using the correct one later in the file

  // REMOVED: Duplicate update/delete routes - using the correct ones later in the file

  // REMOVED: All duplicate detection code with broken references

  // Direct search by city activity interests (toggle button selections)
  app.get('/api/users/search-by-activity-name', async (req, res) => {
    try {
      const { activityName, cityName } = req.query;

      if (!activityName || typeof activityName !== 'string') {
        return res.status(400).json({ error: 'Activity name parameter is required' });
      }

      console.log(`🔍 ACTIVITY NAME SEARCH: Searching for users interested in "${activityName}" ${cityName ? `in ${cityName}` : 'in any city'}`);

      let whereConditions = [
        eq(userCityInterests.isActive, true),
        ilike(userCityInterests.activityName, `%${activityName}%`)
      ];

      if (cityName && typeof cityName === 'string') {
        whereConditions.push(ilike(userCityInterests.cityName, `%${cityName}%`));
      }

      const usersWithActivityInterests = await db
        .select({
          id: users.id,
          username: users.username,  
          name: users.name,
          email: users.email,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          activityName: userCityInterests.activityName,
          cityName: userCityInterests.cityName,
          createdAt: userCityInterests.createdAt
        })
        .from(users)
        .innerJoin(userCityInterests, eq(users.id, userCityInterests.userId))
        .where(and(...whereConditions))
        .orderBy(desc(userCityInterests.createdAt));

      console.log(`✅ ACTIVITY NAME SEARCH: Found ${usersWithActivityInterests.length} users interested in "${activityName}"`);
      
      res.json(usersWithActivityInterests);
    } catch (error) {
      console.error('Error searching users by activity name:', error);
      res.status(500).json({ error: 'Failed to search users by activity name' });
    }
  });

  // Advanced search endpoint with comprehensive filtering
  app.get('/api/users/search', async (req, res) => {
    try {
      const {
        search,
        gender,
        sexualPreference,
        minAge,
        maxAge,
        interests,
        activities,
        events,
        location,
        userType,
        travelerTypes,
        militaryStatus
      } = req.query;

      console.log('🔍 ADVANCED SEARCH: Performing search with filters:', {
        search, gender, sexualPreference, minAge, maxAge, interests, activities, events, location, userType, travelerTypes, militaryStatus
      });

      // Build WHERE conditions
      const whereConditions = [
        ne(users.id, 1) // Exclude system user
      ];

      // Text search in name, username, or bio
      if (search && typeof search === 'string') {
        whereConditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.bio, `%${search}%`)
          )
        );
      }

      // Gender filter
      if (gender && typeof gender === 'string') {
        const genderList = gender.split(',');
        whereConditions.push(inArray(users.gender, genderList));
      }

      // Sexual preference filter
      if (sexualPreference && typeof sexualPreference === 'string') {
        const prefList = sexualPreference.split(',');
        whereConditions.push(inArray(users.sexualPreference, prefList));
      }

      // Age range filter
      if (minAge && typeof minAge === 'string' && minAge !== '' && minAge !== 'undefined') {
        const minAgeNum = parseInt(minAge);
        if (!isNaN(minAgeNum) && minAgeNum > 0) {
          whereConditions.push(gte(users.age, minAgeNum));
        }
      }

      if (maxAge && typeof maxAge === 'string' && maxAge !== '' && maxAge !== 'undefined') {
        const maxAgeNum = parseInt(maxAge);
        if (!isNaN(maxAgeNum) && maxAgeNum > 0) {
          whereConditions.push(lte(users.age, maxAgeNum));
        }
      }

      // User type filter
      if (userType && typeof userType === 'string') {
        const typeList = userType.split(',');
        whereConditions.push(inArray(users.userType, typeList));
      }

      // Location filter with LA Metro consolidation
      if (location && typeof location === 'string') {
        const locationParts = location.split(',').map(part => part.trim());
        const searchCity = locationParts[0];
        
        console.log('🌴 ADVANCED SEARCH LOCATION: Searching for users in:', location);
        
        // Apply LA Metro consolidation
        const citiesToSearch = [];
        if (LA_METRO_CITIES.includes(searchCity)) {
          citiesToSearch.push(...LA_METRO_CITIES);
          console.log('🌴 ADVANCED SEARCH LA METRO: Expanded search to all LA metro cities');
        } else {
          citiesToSearch.push(searchCity);
        }
        
        whereConditions.push(
          or(
            inArray(users.hometownCity, citiesToSearch),
            inArray(users.businessCity, citiesToSearch),
            ...citiesToSearch.map(city => ilike(users.location, `%${city}%`))
          )
        );
      }

      // Military status filter
      if (militaryStatus && typeof militaryStatus === 'string') {
        const statusList = militaryStatus.split(',');
        const militaryConditions = [];
        
        if (statusList.includes('Veteran')) {
          militaryConditions.push(eq(users.isVeteran, true));
        }
        if (statusList.includes('Active Duty')) {
          militaryConditions.push(eq(users.isActiveDuty, true));
        }
        
        if (militaryConditions.length > 0) {
          whereConditions.push(or(...militaryConditions));
        }
      }

      // Interests, activities, events filters (simplified for now - can be enhanced later)
      if (interests && typeof interests === 'string') {
        const interestList = interests.split(',');
        // For now, search in bio - can be enhanced with dedicated interest tables
        const interestConditions = interestList.map(interest => 
          ilike(users.bio, `%${interest.trim()}%`)
        );
        whereConditions.push(or(...interestConditions));
      }

      if (activities && typeof activities === 'string') {
        const activityList = activities.split(',');
        const activityConditions = activityList.map(activity => 
          ilike(users.bio, `%${activity.trim()}%`)
        );
        whereConditions.push(or(...activityConditions));
      }

      if (events && typeof events === 'string') {
        const eventList = events.split(',');
        const eventConditions = eventList.map(event => 
          ilike(users.bio, `%${event.trim()}%`)
        );
        whereConditions.push(or(...eventConditions));
      }

      // Execute search query
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          businessCity: users.businessCity,
          businessState: users.businessState,
          businessCountry: users.businessCountry,
          profileImage: users.profileImage,
          age: users.age,
          gender: users.gender,
          sexualPreference: users.sexualPreference,
          isVeteran: users.isVeteran,
          isActiveDuty: users.isActiveDuty,
          interests: users.interests,
          activities: users.activities,
          events: users.events,
          travelDestination: users.travelDestination,
          travelStartDate: users.travelStartDate,
          travelEndDate: users.travelEndDate,
          isCurrentlyTraveling: users.isCurrentlyTraveling
        })
        .from(users)
        .where(and(...whereConditions))
        .orderBy(desc(users.id))
        .limit(100);

      console.log(`✅ ADVANCED SEARCH: Found ${searchResults.length} users matching criteria`);
      
      res.json(searchResults);
    } catch (error) {
      console.error('Error in advanced search:', error);
      res.status(500).json({ error: 'Failed to perform advanced search' });
    }
  });

  // Global keyword search for users who have matched specific activities
  app.get('/api/users/search-by-keyword', async (req, res) => {
    try {
      const { keyword } = req.query;

      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: 'Keyword parameter is required' });
      }

      console.log(` KEYWORD SEARCH: Searching for users who matched activities containing: "${keyword}"`);

      // Search for activities that match the keyword
      const matchingActivities = await db
        .select({
          id: cityActivities.id,
          activityName: cityActivities.activityName,
          city: cityActivities.city,
          state: cityActivities.state,
          country: cityActivities.country,
          category: cityActivities.category,
          description: cityActivities.description
        })
        .from(cityActivities)
        .where(
          and(
            or(
              ilike(cityActivities.activityName, `%${keyword}%`),
              ilike(cityActivities.description, `%${keyword}%`),
              ilike(cityActivities.category, `%${keyword}%`)
            ),
            eq(cityActivities.isActive, true)
          )
        );

      console.log(` KEYWORD SEARCH: Found ${matchingActivities.length} activities matching "${keyword}"`);

      if (matchingActivities.length === 0) {
        return res.json([]);
      }

      // Get all activity IDs that match the keyword
      const activityIds = matchingActivities.map(activity => activity.id);

      // Find users who have matched these activities via activity matches table
      const usersWithActivityMatches = await db
        .select({
          id: users.id,
          username: users.username,  
          name: users.name,
          email: users.email,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          matchedActivityId: activityMatches.activityId,
          matchedAt: activityMatches.createdAt,
          activityName: cityActivities.activityName,
          activityCity: cityActivities.city,
          activityState: cityActivities.state,
          activityCountry: cityActivities.country,
          matchType: sql<string>`'activity_match'`
        })
        .from(users)
        .innerJoin(activityMatches, eq(users.id, activityMatches.userId))
        .innerJoin(cityActivities, eq(activityMatches.activityId, cityActivities.id))
        .where(inArray(activityMatches.activityId, activityIds))
        .orderBy(desc(activityMatches.createdAt));

      // ENHANCED: Also find users who have selected these activities in city interests (toggle buttons)
      const usersWithCityInterests = await db
        .select({
          id: users.id,
          username: users.username,  
          name: users.name,
          email: users.email,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          matchedActivityId: userCityInterests.activityId,
          matchedAt: userCityInterests.createdAt,
          activityName: userCityInterests.activityName,
          activityCity: userCityInterests.cityName,
          activityState: sql<string>`''`,
          activityCountry: sql<string>`''`,
          matchType: sql<string>`'city_interest'`
        })
        .from(users)
        .innerJoin(userCityInterests, eq(users.id, userCityInterests.userId))
        .where(and(
          inArray(userCityInterests.activityId, activityIds),
          eq(userCityInterests.isActive, true)
        ))
        .orderBy(desc(userCityInterests.createdAt));

      // Combine both result sets
      const allUsersWithMatches = [...usersWithActivityMatches, ...usersWithCityInterests];

      console.log(` KEYWORD SEARCH: Found ${usersWithActivityMatches.length} activity matches + ${usersWithCityInterests.length} city interest matches for "${keyword}"`);

      // Group results by user to avoid duplicates and include all their matching activities
      const userResults = new Map();

      allUsersWithMatches.forEach(userMatch => {
        const userId = userMatch.id;

        if (!userResults.has(userId)) {
          userResults.set(userId, {
            id: userMatch.id,
            username: userMatch.username,
            name: userMatch.name,
            email: userMatch.email,
            userType: userMatch.userType,
            bio: userMatch.bio,
            location: userMatch.location,
            hometownCity: userMatch.hometownCity,
            hometownState: userMatch.hometownState,
            hometownCountry: userMatch.hometownCountry,
            profileImage: userMatch.profileImage,
            matchedActivities: []
          });
        }

        userResults.get(userId).matchedActivities.push({
          activityId: userMatch.matchedActivityId,
          activityName: userMatch.activityName,
          city: userMatch.activityCity,
          state: userMatch.activityState,
          country: userMatch.activityCountry,
          matchedAt: userMatch.matchedAt,
          matchType: userMatch.matchType
        });
      });

      const finalResults = Array.from(userResults.values());

      console.log(` KEYWORD SEARCH: Returning ${finalResults.length} unique users for keyword "${keyword}"`);

      res.json(finalResults);
    } catch (error) {
      console.error('Error searching users by keyword:', error);
      res.status(500).json({ error: 'Failed to search users by keyword' });
    }
  });

  app.post('/api/activity-matches', async (req, res) => {
    try {
      const { activity_id } = req.body;
      // Get user ID from session or header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const newMatch = await storage.createActivityMatch({
        activityId: activity_id,
        userId
      });

      res.json(newMatch);
    } catch (error) {
      console.error('Error creating activity match:', error);
      res.status(500).json({ error: 'Failed to create activity match' });
    }
  });

  app.get('/api/activity-matches/:activityId', async (req, res) => {
    try {
      const { activityId } = req.params;

      const matches = await storage.getActivityMatches(parseInt(activityId));

      res.json(matches);
    } catch (error) {
      console.error('Error fetching activity matches:', error);
      res.status(500).json({ error: 'Failed to fetch activity matches' });
    }
  });

  // Get user's activity matches (things they want to do in cities)
  app.get('/api/users/:userId/activity-matches', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      const matches = await storage.getUserActivityMatches(userId);

      res.json(matches);
    } catch (error) {
      console.error('Error fetching user activity matches:', error);
      res.status(500).json({ error: 'Failed to fetch user activity matches' });
    }
  });

  // Delete activity match (unmatch)
  app.delete('/api/activity-matches/:activityId', async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      // Get user ID from session or header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await storage.deleteActivityMatch(userId, activityId);

      res.json({ success: true, message: 'Activity match removed' });
    } catch (error) {
      console.error('Error deleting activity match:', error);
      res.status(500).json({ error: 'Failed to delete activity match' });
    }
  });

  // ==================== AI CITY ACTIVITIES ROUTES ====================
  
  // Generate AI activities for a city
  app.post('/api/ai-city-activities/:cityName', async (req, res) => {
    try {
      const { cityName } = req.params;
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`🤖 AI GENERATION: Starting AI activity generation for ${cityName}`);
      
      const generatedActivities = await generateCityActivities(cityName);
      
      if (generatedActivities.length === 0) {
        return res.status(500).json({ error: 'Failed to generate activities' });
      }

      console.log(`🤖 AI GENERATION: Generated ${generatedActivities.length} activities for ${cityName}`);
      
      // Save generated activities to database
      const savedActivities = [];
      for (const activity of generatedActivities) {
        try {
          const newActivity = await storage.createCityActivity({
            city: cityName,
            activityName: activity.name,
            description: activity.description,
            category: activity.category,
            state: '', // Will be filled based on city
            country: '', // Will be filled based on city
            createdByUserId: userId
          });
          savedActivities.push(newActivity);
        } catch (error) {
          console.log(`⚠️ Skipping duplicate activity: ${activity.name}`);
        }
      }

      console.log(`✅ AI GENERATION: Saved ${savedActivities.length} new activities to database`);
      
      res.json({
        success: true,
        generated: generatedActivities.length,
        saved: savedActivities.length,
        activities: savedActivities
      });
    } catch (error) {
      console.error('Error generating AI city activities:', error);
      res.status(500).json({ error: 'Failed to generate city activities' });
    }
  });

  // Clean up duplicate activities for a city
  app.post('/api/city-activities/:cityName/cleanup-duplicates', async (req, res) => {
    try {
      const { cityName } = req.params;
      
      console.log(`🧹 CLEANUP: Starting duplicate removal for ${cityName}`);
      
      // Get all activities for the city
      const allActivities = await db.select().from(cityActivities).where(eq(cityActivities.cityName, cityName));
      
      const unique: any[] = [];
      const toDelete: any[] = [];
      
      // Find duplicates using similarity check
      for (const activity of allActivities) {
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const currentName = normalize(activity.name);
        
        const isDuplicate = unique.some(existing => {
          const existingName = normalize(existing.name);
          if (currentName === existingName) return true;
          
          const words1 = currentName.split(/\s+/);
          const words2 = existingName.split(/\s+/);
          const commonWords = words1.filter(word => words2.includes(word));
          const similarity = commonWords.length / Math.max(words1.length, words2.length);
          
          return similarity > 0.8;
        });
        
        if (isDuplicate) {
          toDelete.push(activity);
        } else {
          unique.push(activity);
        }
      }
      
      // Delete duplicates
      for (const duplicate of toDelete) {
        await db.delete(cityActivities).where(eq(cityActivities.id, duplicate.id));
        console.log(`🗑️ CLEANUP: Deleted duplicate activity: "${duplicate.name}"`);
      }
      
      console.log(`✅ CLEANUP: Removed ${toDelete.length} duplicate activities for ${cityName}`);
      
      res.json({
        success: true,
        totalActivities: allActivities.length,
        duplicatesRemoved: toDelete.length,
        remaining: unique.length
      });
    } catch (error) {
      console.error('Error cleaning up duplicate activities:', error);
      res.status(500).json({ error: 'Failed to cleanup duplicates' });
    }
  });

  // Add Barcelona-specific activities
  app.post('/api/city-activities/barcelona/add-specific', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🏛️ BARCELONA SPECIFIC: Adding authentic Barcelona activities`);
      
      const { addBarcelonaSpecificActivities } = await import('./barcelona-specific-activities.js');
      const addedCount = await addBarcelonaSpecificActivities(userId);
      
      res.json({
        success: true,
        cityName: "Barcelona",
        addedActivities: addedCount,
        message: `Added ${addedCount} authentic Barcelona activities including Sagrada Familia, Picasso Museum, Park Güell`
      });
    } catch (error) {
      console.error('Error adding Barcelona-specific activities:', error);
      res.status(500).json({ error: 'Failed to add Barcelona-specific activities' });
    }
  });

  // Add London-specific activities
  app.post('/api/city-activities/london/add-specific', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🇬🇧 LONDON SPECIFIC: Adding authentic London activities`);
      
      const { addLondonSpecificActivities } = await import('./london-specific-activities.js');
      const addedCount = await addLondonSpecificActivities(userId);
      
      res.json({
        success: true,
        cityName: "London",
        addedActivities: addedCount,
        message: `Added ${addedCount} authentic London activities including Big Ben, Tower of London, British Museum`
      });
    } catch (error) {
      console.error('Error adding London-specific activities:', error);
      res.status(500).json({ error: 'Failed to add London-specific activities' });
    }
  });

  // Add Tokyo-specific activities
  app.post('/api/city-activities/tokyo/add-specific', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🏯 TOKYO SPECIFIC: Adding authentic Tokyo activities`);
      
      const { addTokyoSpecificActivities } = await import('./tokyo-specific-activities.js');
      const addedCount = await addTokyoSpecificActivities(userId);
      
      res.json({
        success: true,
        cityName: "Tokyo",
        addedActivities: addedCount,
        message: `Added ${addedCount} authentic Tokyo activities including Tokyo Skytree, Senso-ji Temple, Shibuya Crossing`
      });
    } catch (error) {
      console.error('Error adding Tokyo-specific activities:', error);
      res.status(500).json({ error: 'Failed to add Tokyo-specific activities' });
    }
  });

  // Add Paris-specific activities
  app.post('/api/city-activities/paris/add-specific', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🇫🇷 PARIS SPECIFIC: Adding authentic Paris activities`);
      
      const { addParisSpecificActivities } = await import('./paris-specific-activities.js');
      const addedCount = await addParisSpecificActivities(userId);
      
      res.json({
        success: true,
        cityName: "Paris",
        addedActivities: addedCount,
        message: `Added ${addedCount} authentic Paris activities including Eiffel Tower, Louvre Museum, Notre-Dame`
      });
    } catch (error) {
      console.error('Error adding Paris-specific activities:', error);
      res.status(500).json({ error: 'Failed to add Paris-specific activities' });
    }
  });

  // Add Rome-specific activities
  app.post('/api/city-activities/rome/add-specific', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🏛️ ROME SPECIFIC: Adding authentic Rome activities`);
      
      const { addRomeSpecificActivities } = await import('./rome-specific-activities.js');
      const addedCount = await addRomeSpecificActivities(userId);
      
      res.json({
        success: true,
        cityName: "Rome",
        addedActivities: addedCount,
        message: `Added ${addedCount} authentic Rome activities including Colosseum, Vatican City, Trevi Fountain`
      });
    } catch (error) {
      console.error('Error adding Rome-specific activities:', error);
      res.status(500).json({ error: 'Failed to add Rome-specific activities' });
    }
  });

  // Enhance all cities with comprehensive specific activities
  app.post('/api/admin/enhance-all-cities', async (req, res) => {
    try {
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🌍 ADMIN: Starting comprehensive city enhancement...`);
      
      const { enhanceAllCities } = await import('./enhance-all-cities.js');
      
      // Run enhancement in the background
      enhanceAllCities().catch(error => {
        console.error('Background city enhancement error:', error);
      });
      
      res.json({
        success: true,
        message: 'City enhancement process started in background. Check server logs for progress.',
        status: 'running'
      });
    } catch (error) {
      console.error('Error starting city enhancement:', error);
      res.status(500).json({ error: 'Failed to start city enhancement' });
    }
  });

  // Enhance a specific city with comprehensive activities  
  app.post('/api/admin/enhance-city/:cityName', async (req, res) => {
    try {
      const { cityName } = req.params;
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🎯 ADMIN: Enhancing ${cityName} with specific activities...`);
      
      const { enhanceCity } = await import('./enhance-all-cities.js');
      const addedCount = await enhanceCity(cityName, userId);
      
      res.json({
        success: true,
        message: `Enhanced ${cityName} with ${addedCount} new specific activities`,
        cityName,
        addedCount
      });
    } catch (error) {
      console.error(`Error enhancing ${req.params.cityName}:`, error);
      res.status(500).json({ error: 'Failed to enhance city' });
    }
  });

  // Enhance existing city with more AI-generated activities
  app.post('/api/city-activities/:cityName/enhance', async (req, res) => {
    try {
      const { cityName } = req.params;
      
      // Get user from header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🚀 ENHANCE REQUEST: Adding more activities to ${cityName}`);
      
      const addedCount = await enhanceExistingCityWithMoreActivities(cityName, userId);
      
      res.json({
        success: true,
        cityName,
        addedActivities: addedCount,
        message: `Added ${addedCount} new activities to ${cityName}`
      });
    } catch (error) {
      console.error('Error enhancing city activities:', error);
      res.status(500).json({ error: 'Failed to enhance city activities' });
    }
  });

  // Get activity matches for a user - people who want to do the same things
  app.get('/api/activity-matches/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log(`🔍 ACTIVITY MATCHES: Finding matches for user ${userId}`);

      // Get all activities the user is interested in
      const userInterests = await db.select({
        activityId: userCityInterests.activityId,
        cityName: userCityInterests.cityName,
        activityName: userCityInterests.activityName
      })
      .from(userCityInterests)
      .where(and(
        eq(userCityInterests.userId, userId),
        eq(userCityInterests.isActive, true)
      ));

      if (userInterests.length === 0) {
        return res.json([]);
      }

      // Find other users who have the same interests
      const matches = await db.select({
        userId: userCityInterests.userId,
        activityId: userCityInterests.activityId,
        cityName: userCityInterests.cityName,
        activityName: userCityInterests.activityName,
        username: users.username,
        profileImage: users.profileImage,
        name: users.name,
        bio: users.bio,
        location: users.location
      })
      .from(userCityInterests)
      .innerJoin(users, eq(userCityInterests.userId, users.id))
      .where(and(
        ne(userCityInterests.userId, userId), // Exclude the current user
        eq(userCityInterests.isActive, true),
        inArray(userCityInterests.activityId, userInterests.map(i => i.activityId))
      ));

      // Format the matches to include user data
      const formattedMatches = matches.map(match => ({
        userId: match.userId,
        activityId: match.activityId,
        cityName: match.cityName,
        activityName: match.activityName,
        user: {
          username: match.username,
          profileImage: match.profileImage,
          name: match.name,
          bio: match.bio,
          location: match.location
        }
      }));

      console.log(`✅ ACTIVITY MATCHES: Found ${formattedMatches.length} matches for user ${userId}`);
      
      res.json(formattedMatches);
    } catch (error) {
      console.error('Error getting activity matches:', error);
      res.status(500).json({ error: 'Failed to get activity matches' });
    }
  });

  // Global search for activities and users
  app.get('/api/search/activities', async (req, res) => {
    try {
      const { keyword, location } = req.query;
      
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      console.log(`🔍 GLOBAL ACTIVITY SEARCH: Searching for "${keyword}" ${location ? `in ${location}` : 'globally'}`);

      let query = db.select({
        userId: userCityInterests.userId,
        activityId: userCityInterests.activityId,
        cityName: userCityInterests.cityName,
        activityName: userCityInterests.activityName,
        username: users.username,
        profileImage: users.profileImage,
        name: users.name,
        bio: users.bio,
        location: users.location,
        createdAt: userCityInterests.createdAt
      })
      .from(userCityInterests)
      .innerJoin(users, eq(userCityInterests.userId, users.id))
      .where(and(
        eq(userCityInterests.isActive, true),
        ilike(userCityInterests.activityName, `%${keyword}%`)
      ));

      // Add location filter if provided
      if (location && typeof location === 'string') {
        query = query.where(and(
          eq(userCityInterests.isActive, true),
          ilike(userCityInterests.activityName, `%${keyword}%`),
          ilike(userCityInterests.cityName, `%${location}%`)
        ));
      }

      const results = await query.orderBy(desc(userCityInterests.createdAt));

      // Format the results
      const formattedResults = results.map(result => ({
        userId: result.userId,
        activityId: result.activityId,
        cityName: result.cityName,
        activityName: result.activityName,
        createdAt: result.createdAt,
        user: {
          username: result.username,
          profileImage: result.profileImage,
          name: result.name,
          bio: result.bio,
          location: result.location
        }
      }));

      console.log(`✅ GLOBAL ACTIVITY SEARCH: Found ${formattedResults.length} results for "${keyword}"`);
      
      res.json({
        keyword,
        location: location || null,
        total: formattedResults.length,
        results: formattedResults
      });
    } catch (error) {
      console.error('Error searching activities:', error);
      res.status(500).json({ error: 'Failed to search activities' });
    }
  });

  // ==================== PROXIMITY NOTIFICATION API ROUTES ====================
  
  // Update business location coordinates
  app.post('/api/business/:id/location', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      console.log(`📍 PROXIMITY API: Updating location for business ${businessId} to ${latitude}, ${longitude}`);
      
      await businessProximityEngine.updateBusinessLocation(businessId, latitude, longitude);
      
      res.json({ 
        success: true, 
        message: 'Business location updated successfully',
        coordinates: { latitude, longitude }
      });
    } catch (error) {
      console.error('Error updating business location:', error);
      res.status(500).json({ error: 'Failed to update business location' });
    }
  });

  // Toggle proximity notifications for a business
  app.post('/api/business/:id/proximity-notifications', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Enabled flag must be a boolean' });
      }

      console.log(`🔔 PROXIMITY API: ${enabled ? 'Enabling' : 'Disabling'} proximity notifications for business ${businessId}`);
      
      await businessProximityEngine.toggleProximityNotifications(businessId, enabled);
      
      res.json({ 
        success: true, 
        message: `Proximity notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
        enabled
      });
    } catch (error) {
      console.error('Error toggling proximity notifications:', error);
      res.status(500).json({ error: 'Failed to toggle proximity notifications' });
    }
  });

  // Check proximity for a traveler (called when traveler moves to new location)
  app.post('/api/traveler/:id/check-proximity', async (req, res) => {
    try {
      const travelerId = parseInt(req.params.id);
      const { latitude, longitude, radiusKm = 11.265 } = req.body; // Default 7 miles
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      console.log(`🎯 PROXIMITY API: Checking proximity for traveler ${travelerId} at ${latitude}, ${longitude} within ${radiusKm}km`);
      
      await businessProximityEngine.checkProximityForTraveler(travelerId, latitude, longitude, radiusKm);
      
      res.json({ 
        success: true, 
        message: 'Proximity check completed successfully',
        traveler: { id: travelerId, latitude, longitude, radiusKm }
      });
    } catch (error) {
      console.error('Error checking proximity for traveler:', error);
      res.status(500).json({ error: 'Failed to check proximity for traveler' });
    }
  });

  // ==================== CITY ACTIVITIES ROUTES ====================
  
  // Get city activities for a specific city (with auto-setup for new cities)
  app.get('/api/city-activities/:cityName', async (req, res) => {
    try {
      const { cityName } = req.params;
      
      // Auto-setup activities if city doesn't have any
      await ensureCityHasActivities(cityName);
      
      const activities = await db.select({
        id: cityActivities.id,
        city: cityActivities.cityName,
        state: cityActivities.state,
        country: cityActivities.country,
        activityName: cityActivities.activityName,
        description: cityActivities.description,
        category: cityActivities.category,
        isActive: cityActivities.isActive,
        createdByUserId: cityActivities.createdByUserId,
        createdAt: cityActivities.createdAt
      })
      .from(cityActivities)
      .where(and(
        eq(cityActivities.cityName, cityName),
        eq(cityActivities.isActive, true)
      ))
      .orderBy(asc(cityActivities.activityName));

      console.log(`✅ CITY ACTIVITIES: Returning ${activities.length} activities for ${cityName}`);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching city activities:', error);
      res.status(500).json({ error: 'Failed to fetch city activities' });
    }
  });

  // Create new city activity
  app.post('/api/city-activities', async (req, res) => {
    try {
      const { cityName, activityName, description, category, state, country } = req.body;
      
      // Get user from header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);
      const userDataHeader = req.headers['x-user-data'] as string;
      let username = 'anonymous';
      
      if (userDataHeader) {
        try {
          const userData = JSON.parse(userDataHeader);
          username = userData.username || 'anonymous';
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }

      if (!cityName || !activityName || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Skip duplicate check for now to resolve LOWER() function error

      const [newActivity] = await db.insert(cityActivities).values({
        cityName: cityName,
        state: state || '',
        country: country || '',
        activityName: activityName.trim(),
        description: description.trim(),
        category: category || 'general',
        createdByUserId: userId,
        isActive: true
      }).returning();

      res.json(newActivity);
    } catch (error) {
      console.error('Error creating city activity:', error);
      res.status(500).json({ error: 'Failed to create city activity' });
    }
  });

  // Update city activity
  app.patch('/api/city-activities/:activityId', async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      const { activityName, description, category } = req.body;

      if (!activityName || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [updatedActivity] = await db.update(cityActivities)
        .set({
          activityName: activityName.trim(),
          description: description.trim(),
          category: category || 'general'
        })
        .where(eq(cityActivities.id, activityId))
        .returning();

      if (!updatedActivity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.json(updatedActivity);
    } catch (error) {
      console.error('Error updating city activity:', error);
      res.status(500).json({ error: 'Failed to update city activity' });
    }
  });

  // Delete city activity
  app.delete('/api/city-activities/:activityId', async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);

      // First delete all user interests for this activity
      await db.delete(userCityInterests)
        .where(eq(userCityInterests.activityId, activityId));

      // Then delete the activity
      const [deletedActivity] = await db.delete(cityActivities)
        .where(eq(cityActivities.id, activityId))
        .returning();

      if (!deletedActivity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.json({ success: true, message: 'Activity deleted successfully' });
    } catch (error) {
      console.error('Error deleting city activity:', error);
      res.status(500).json({ error: 'Failed to delete city activity' });
    }
  });

  // ==================== USER CITY INTERESTS ROUTES ====================

  // Get ALL user's city interests (for profile page)
  app.get('/api/user-city-interests/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      const interests = await db.select({
        id: userCityInterests.id,
        userId: userCityInterests.userId,
        cityName: userCityInterests.cityName,
        activityId: userCityInterests.activityId,
        activityName: userCityInterests.activityName,
        isActive: userCityInterests.isActive,
        createdAt: userCityInterests.createdAt
      })
      .from(userCityInterests)
      .where(and(
        eq(userCityInterests.userId, userId),
        eq(userCityInterests.isActive, true)
      ))
      .orderBy(asc(userCityInterests.cityName), asc(userCityInterests.activityName));

      res.json(interests);
    } catch (error) {
      console.error('Error fetching user city interests:', error);
      res.status(500).json({ error: 'Failed to fetch user city interests' });
    }
  });

  // Get user's interests for a specific city
  app.get('/api/user-city-interests/:userId/:cityName', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { cityName } = req.params;

      const interests = await db.select({
        id: userCityInterests.id,
        userId: userCityInterests.userId,
        cityName: userCityInterests.cityName,
        activityId: userCityInterests.activityId,
        activityName: userCityInterests.activityName,
        isActive: userCityInterests.isActive,
        createdAt: userCityInterests.createdAt
      })
      .from(userCityInterests)
      .where(and(
        eq(userCityInterests.userId, userId),
        eq(userCityInterests.cityName, cityName),
        eq(userCityInterests.isActive, true)
      ))
      .orderBy(asc(userCityInterests.activityName));

      res.json(interests);
    } catch (error) {
      console.error('Error fetching user city interests:', error);
      res.status(500).json({ error: 'Failed to fetch user city interests' });
    }
  });

  // Add user interest in city activity
  app.post('/api/user-city-interests', async (req, res) => {
    try {
      const { activityId, cityName } = req.body;
      
      // Get user from header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!activityId || !cityName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get activity details
      const [activity] = await db.select()
        .from(cityActivities)
        .where(eq(cityActivities.id, activityId))
        .limit(1);

      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      // Check if interest already exists
      const existing = await db.select()
        .from(userCityInterests)
        .where(and(
          eq(userCityInterests.userId, userId),
          eq(userCityInterests.activityId, activityId)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Reactivate if it was deactivated
        const [updated] = await db.update(userCityInterests)
          .set({ isActive: true })
          .where(and(
            eq(userCityInterests.userId, userId),
            eq(userCityInterests.activityId, activityId)
          ))
          .returning();

        // Note: userCount is not tracked in current schema

        return res.json(updated);
      }

      // Create new interest
      const [newInterest] = await db.insert(userCityInterests).values({
        userId,
        cityName,
        activityId,
        activityName: activity.activityName,
        isActive: true
      }).returning();

      // Note: userCount is not tracked in current schema

      res.json(newInterest);
    } catch (error) {
      console.error('Error adding user city interest:', error);
      res.status(500).json({ error: 'Failed to add user city interest' });
    }
  });

  // Remove user interest in city activity
  app.delete('/api/user-city-interests/:activityId', async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      // Get user from header
      const userId = req.session?.user?.id || parseInt(req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Remove interest
      const [removed] = await db.delete(userCityInterests)
        .where(and(
          eq(userCityInterests.userId, userId),
          eq(userCityInterests.activityId, activityId)
        ))
        .returning();

      if (removed) {
        // Note: userCount is not tracked in current schema
      }

      res.json({ success: true, message: 'Interest removed successfully' });
    } catch (error) {
      console.error('Error removing user city interest:', error);
      res.status(500).json({ error: 'Failed to remove user city interest' });
    }
  });

  // Get matching users based on shared city interests
  app.get('/api/city-matches/:userId/:cityName', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { cityName } = req.params;

      // Get user's interests in this city
      const userInterests = await db.select()
        .from(userCityInterests)
        .where(and(
          eq(userCityInterests.userId, userId),
          eq(userCityInterests.cityName, cityName),
          eq(userCityInterests.isActive, true)
        ));

      if (userInterests.length === 0) {
        return res.json([]);
      }

      const activityIds = userInterests.map(interest => interest.activityId);

      // Find other users with shared interests
      const matches = await db.select({
        userId: userCityInterests.userId,
        activityId: userCityInterests.activityId,
        activityName: userCityInterests.activityName,
        username: users.username,
        name: users.name,
        profileImage: users.profileImage,
        userType: users.userType
      })
      .from(userCityInterests)
      .innerJoin(users, eq(userCityInterests.userId, users.id))
      .where(and(
        ne(userCityInterests.userId, userId), // Exclude current user
        eq(userCityInterests.cityName, cityName),
        eq(userCityInterests.isActive, true),
        inArray(userCityInterests.activityId, activityIds)
      ));

      // Group by user and count shared interests
      const userMatches = matches.reduce((acc: any, match) => {
        const existingUser = acc.find((u: any) => u.userId === match.userId);
        if (existingUser) {
          existingUser.commonActivities++;
          existingUser.sharedActivityNames.push(match.activityName);
        } else {
          acc.push({
            id: match.userId,
            userId: match.userId,
            username: match.username,
            name: match.name,
            profileImage: match.profileImage,
            userType: match.userType,
            commonActivities: 1,
            sharedActivityNames: [match.activityName]
          });
        }
        return acc;
      }, []);

      // Calculate match strength and sort by it
      userMatches.forEach((user: any) => {
        user.matchStrength = user.commonActivities;
        // Keep only unique activity names
        user.sharedActivityNames = [...new Set(user.sharedActivityNames)];
      });

      // Sort by match strength (number of shared interests) descending
      userMatches.sort((a: any, b: any) => b.matchStrength - a.matchStrength);

      res.json(userMatches);
    } catch (error) {
      console.error('Error fetching city matches:', error);
      res.status(500).json({ error: 'Failed to fetch city matches' });
    }
  });

  // Reddit-style Travel Blog API Routes
  // Create a new travel blog post
  app.post('/api/travel-blog/posts', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const post = await storage.createTravelBlogPost({
        ...req.body,
        userId: userId,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating travel blog post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  // Get all travel blog posts with pagination
  app.get('/api/travel-blog/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const posts = await storage.getTravelBlogPosts(limit, offset);
      
      // Add like status for authenticated users
      const userId = req.session?.user?.claims?.sub;
      if (userId) {
        for (const post of posts) {
          post.isLikedByCurrentUser = await storage.isPostLikedByUser(post.id, userId);
        }
      }

      res.json(posts);
    } catch (error) {
      console.error('Error fetching travel blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Like a travel blog post
  app.post('/api/travel-blog/posts/:postId/like', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const postId = parseInt(req.params.postId);
      await storage.likeTravelBlogPost(postId, userId);

      res.json({ success: true, message: 'Post liked successfully' });
    } catch (error) {
      console.error('Error liking travel blog post:', error);
      if (error.message.includes('already liked')) {
        return res.status(409).json({ error: 'Post already liked' });
      }
      res.status(500).json({ error: 'Failed to like post' });
    }
  });

  // Unlike a travel blog post
  app.delete('/api/travel-blog/posts/:postId/like', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const postId = parseInt(req.params.postId);
      await storage.unlikeTravelBlogPost(postId, userId);

      res.json({ success: true, message: 'Post unliked successfully' });
    } catch (error) {
      console.error('Error unliking travel blog post:', error);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });

  // Delete a travel blog post
  app.delete('/api/travel-blog/posts/:postId', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const postId = parseInt(req.params.postId);
      const success = await storage.deleteTravelBlogPost(postId, userId);

      if (success) {
        res.json({ success: true, message: 'Post deleted successfully' });
      } else {
        res.status(404).json({ error: 'Post not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting travel blog post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  // Get comments for a travel blog post
  app.get('/api/travel-blog/posts/:postId/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getTravelBlogComments(postId);
      
      // Add like status for authenticated users
      const userId = req.session?.user?.claims?.sub;
      if (userId) {
        const addLikeStatus = async (comments: any[]) => {
          for (const comment of comments) {
            comment.isLikedByCurrentUser = await storage.isCommentLikedByUser(comment.id, userId);
            if (comment.replies && comment.replies.length > 0) {
              await addLikeStatus(comment.replies);
            }
          }
        };
        await addLikeStatus(comments);
      }

      res.json(comments);
    } catch (error) {
      console.error('Error fetching travel blog comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // Create a comment on a travel blog post
  app.post('/api/travel-blog/posts/:postId/comments', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const postId = parseInt(req.params.postId);
      const { content, parentCommentId } = req.body;

      const comment = await storage.createTravelBlogComment(postId, userId, content, parentCommentId);

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating travel blog comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  // Like a travel blog comment
  app.post('/api/travel-blog/comments/:commentId/like', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const commentId = parseInt(req.params.commentId);
      await storage.likeTravelBlogComment(commentId, userId);

      res.json({ success: true, message: 'Comment liked successfully' });
    } catch (error) {
      console.error('Error liking travel blog comment:', error);
      res.status(500).json({ error: 'Failed to like comment' });
    }
  });

  // Unlike a travel blog comment
  app.delete('/api/travel-blog/comments/:commentId/like', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const commentId = parseInt(req.params.commentId);
      await storage.unlikeTravelBlogComment(commentId, userId);

      res.json({ success: true, message: 'Comment unliked successfully' });
    } catch (error) {
      console.error('Error unliking travel blog comment:', error);
      res.status(500).json({ error: 'Failed to unlike comment' });
    }
  });

  // Delete a travel blog comment
  app.delete('/api/travel-blog/comments/:commentId', async (req, res) => {
    try {
      const userId = req.session?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const commentId = parseInt(req.params.commentId);
      const success = await storage.deleteTravelBlogComment(commentId, userId);

      if (success) {
        res.json({ success: true, message: 'Comment deleted successfully' });
      } else {
        res.status(404).json({ error: 'Comment not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting travel blog comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // Get user's travel blog posts
  app.get('/api/travel-blog/users/:userId/posts', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getUserTravelBlogPosts(userId);

      res.json(posts);
    } catch (error) {
      console.error('Error fetching user travel blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch user posts' });
    }
  });

  // CRITICAL: Business signup endpoint - was missing!
  app.post("/api/business-signup", async (req, res) => {
    try {
      console.log("🏢 BUSINESS SIGNUP: Received registration data", req.body);
      
      const businessData = req.body;
      
      // Create business user account
      const result = await storage.createBusinessUser(businessData);
      
      console.log("🏢 BUSINESS SIGNUP: Registration successful", result.id);
      
      res.status(201).json({
        message: "Business registration successful",
        user: result,
        token: `temp_token_${result.id}` // Temporary token for demo
      });
    } catch (error) {
      console.error("🏢 BUSINESS SIGNUP ERROR:", error);
      res.status(400).json({ 
        message: error.message || "Business registration failed" 
      });
    }
  });

  // ==========================================
  // REAL-TIME BUSINESS INTEREST MATCHING API
  // ==========================================
  
  // Get business interest notifications (Real-Time Interest Matching)
  app.get('/api/business-notifications/:businessId', async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const unreadOnly = req.query.unread === 'true';
      
      console.log(`🔔 BUSINESS NOTIFICATIONS: Fetching ${unreadOnly ? 'unread' : 'all'} notifications for business ${businessId}`);
      
      // Get notifications with user data
      const notifications = await db
        .select({
          id: businessInterestNotifications.id,
          businessId: businessInterestNotifications.businessId,
          userId: businessInterestNotifications.userId,
          matchType: businessInterestNotifications.matchType,
          matchedInterests: businessInterestNotifications.matchedInterests,
          matchedActivities: businessInterestNotifications.matchedActivities,
          userLocation: businessInterestNotifications.userLocation,
          isRead: businessInterestNotifications.isRead,
          isProcessed: businessInterestNotifications.isProcessed,
          priority: businessInterestNotifications.priority,
          travelStartDate: businessInterestNotifications.travelStartDate,
          travelEndDate: businessInterestNotifications.travelEndDate,
          createdAt: businessInterestNotifications.createdAt,
          // User data
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          userType: users.userType
        })
        .from(businessInterestNotifications)
        .innerJoin(users, eq(businessInterestNotifications.userId, users.id))
        .where(
          unreadOnly 
            ? and(
                eq(businessInterestNotifications.businessId, businessId),
                eq(businessInterestNotifications.isRead, false)
              )
            : eq(businessInterestNotifications.businessId, businessId)
        )
        .orderBy(desc(businessInterestNotifications.createdAt));

      // Format notifications with user data
      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        businessId: notification.businessId,
        userId: notification.userId,
        matchType: notification.matchType,
        matchedInterests: notification.matchedInterests || [],
        matchedActivities: notification.matchedActivities || [],
        userLocation: notification.userLocation,
        isRead: notification.isRead,
        isProcessed: notification.isProcessed,
        priority: notification.priority,
        travelStartDate: notification.travelStartDate,
        travelEndDate: notification.travelEndDate,
        createdAt: notification.createdAt,
        user: {
          id: notification.userId,
          username: notification.username,
          name: notification.name,
          profileImage: notification.profileImage,
          userType: notification.userType
        }
      }));

      console.log(`✅ BUSINESS NOTIFICATIONS: Found ${formattedNotifications.length} notifications for business ${businessId}`);
      res.json(formattedNotifications);
    } catch (error) {
      console.error('Error fetching business notifications:', error);
      res.status(500).json({ error: 'Failed to fetch business notifications' });
    }
  });

  // Mark business notification as read
  app.put('/api/business-notifications/:notificationId/read', async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      const success = await storage.markBusinessNotificationAsRead(notificationId);
      
      if (success) {
        res.json({ success: true, message: 'Notification marked as read' });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Mark business notification as processed
  app.put('/api/business-notifications/:notificationId/processed', async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      const success = await storage.markBusinessNotificationAsProcessed(notificationId);
      
      if (success) {
        res.json({ success: true, message: 'Notification marked as processed' });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error marking notification as processed:', error);
      res.status(500).json({ error: 'Failed to mark notification as processed' });
    }
  });

  // ================================================
  // CONTEXTUAL BUSINESS RECOMMENDATION ENGINE API
  // ================================================
  
  // Get personalized business recommendations based on user context
  app.get('/api/contextual-recommendations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`🎯 CONTEXTUAL RECOMMENDATIONS: Generating basic recommendations for user ${userId}`);
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get business offers from available deals (simplified approach)
      const location = user.location || user.hometownCity || 'Los Angeles';
      const cityName = location.split(',')[0];
      
      console.log(`🔍 CONTEXTUAL RECOMMENDATIONS: Looking for offers in ${cityName}`);
      
      // Simple direct query without complex templating
      const result = await db.execute(sql`
        SELECT id, business_id, title, description, category, city, state, 
               discount_value, valid_until, image_url, website_url
        FROM business_offers 
        WHERE is_active = true 
        AND city ILIKE '%Los Angeles%'
        LIMIT 5
      `);
      
      const offers = result.rows || [];
      console.log(`✅ CONTEXTUAL RECOMMENDATIONS: Found ${offers.length} business offers for ${cityName}`);
      
      // Create simplified recommendations
      const recommendations = offers.map((offer: any) => ({
        businessId: offer.business_id,
        businessName: 'Local Business',
        businessType: 'General',
        title: offer.title,
        description: offer.description,
        location: `${offer.city}, ${offer.state}`,
        category: offer.category,
        originalPrice: null,
        discountedPrice: null,
        discountPercentage: offer.discount_value,
        validUntil: offer.valid_until,
        imageUrl: offer.image_url,
        relevanceScore: 0.75,
        contextualFactors: {
          locationMatch: 1.0,
          interestMatch: 0.6,
          timeRelevance: 0.8,
          weatherRelevance: 0.5,
          travelContext: 0.7,
          socialProof: 0.6,
          personalHistory: 0.5
        },
        recommendationReason: `Great local deal in ${offer.city}`,
        contextualTags: ['📍 Nearby', '🎯 Recommended', '💰 Good Deal']
      }));
      
      console.log(`✅ CONTEXTUAL RECOMMENDATIONS: Generated ${recommendations.length} personalized recommendations`);
      
      res.json({
        userId,
        context: {
          location: location,
          isTraverling: false,
          interests: 0,
          activities: 0
        },
        recommendations,
        meta: {
          total: recommendations.length,
          averageScore: 0.75
        }
      });
    } catch (error) {
      console.error('Error generating contextual recommendations:', error);
      res.status(500).json({ error: 'Failed to generate contextual recommendations' });
    }
  });

  // Helper function to build user context
  async function buildUserContext(user: any) {
    const now = new Date();
    const hour = now.getHours();
    
    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    // Get day of week
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Extract user location
    const currentLocation = user.isCurrentlyTraveling && user.travelDestination
      ? user.travelDestination
      : user.location || `${user.hometownCity}, ${user.hometownState}, ${user.hometownCountry}`;
    
    return {
      userId: user.id,
      currentLocation,
      interests: user.interests || [],
      activities: user.activities || [],
      isCurrentlyTraveling: user.isCurrentlyTraveling || false,
      travelDestination: user.travelDestination,
      travelStartDate: user.travelStartDate ? new Date(user.travelStartDate) : undefined,
      travelEndDate: user.travelEndDate ? new Date(user.travelEndDate) : undefined,
      userType: user.userType,
      timeOfDay,
      dayOfWeek,
      weather: undefined // Could integrate with weather API
    };
  }

  // Test/trigger Real-Time Interest Matching for a specific user
  app.post('/api/business-notifications/trigger/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      console.log(`🔥 REAL-TIME MATCHING: Manually triggering interest matching for user ${userId}`);
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Extract user location (use hometown or current location)
      const userLocation = user.location || `${user.hometownCity}, ${user.hometownState}, ${user.hometownCountry}`;
      
      // Get user interests and activities
      const userInterests = user.interests || [];
      const userActivities = user.activities || [];
      
      if (userInterests.length === 0 && userActivities.length === 0) {
        return res.status(400).json({ error: 'User has no interests or activities to match' });
      }

      // Determine match type based on user travel status
      const matchType = user.isCurrentlyTraveling ? 'traveler_interest' : 'local_interest';
      
      // Travel dates for traveler
      const travelDates = user.isCurrentlyTraveling && user.travelStartDate && user.travelEndDate ? {
        startDate: new Date(user.travelStartDate),
        endDate: new Date(user.travelEndDate)
      } : undefined;

      // Trigger the real-time matching system
      await storage.checkBusinessInterestMatches(
        userId, 
        userInterests, 
        userActivities, 
        userLocation, 
        matchType, 
        travelDates
      );

      console.log(`✅ REAL-TIME MATCHING: Interest matching completed for user ${userId}`);
      res.json({ 
        success: true, 
        message: `Real-time interest matching triggered for ${user.username}`,
        matchType,
        userLocation,
        userInterests,
        userActivities
      });
    } catch (error) {
      console.error('Error triggering business interest matching:', error);
      res.status(500).json({ error: 'Failed to trigger interest matching' });
    }
  });

  // Business subscription status endpoint (STRIPE INTEGRATION READY)
  app.get('/api/business/subscription-status', async (req, res) => {
    try {
      console.log('📊 BUSINESS SUBSCRIPTION: Checking subscription status');
      
      const businessId = req.query.businessId || req.headers['x-user-id'];
      if (!businessId) {
        return res.status(401).json({ error: 'Business ID required' });
      }

      const user = await storage.getUser(parseInt(businessId as string));
      
      if (!user || user.userType !== 'business') {
        return res.status(403).json({ error: 'Access denied: Business accounts only' });
      }

      // Check subscription status and enforce 5-day limit
      const subscriptionLimit = await storage.checkBusinessDayLimit(businessId);
      
      // For SubscriptionStatus component compatibility - return Stripe-compatible format
      // BETA MODE: All businesses get free access during beta testing
      res.json({
        hasSubscription: false, // Currently all businesses are on free plan
        status: 'beta_free', 
        isActive: true, // Always active during beta
        trialActive: true, // Show as beta trial
        trialEnd: null,
        nextBillingDate: null,
        needsPayment: false,
        needsSubscription: false, // BETA: Never require subscription during beta period
        trialExpired: false,
        freeMode: true, // Currently in free mode
        // Additional data for business dashboard
        daysUsed: subscriptionLimit.daysUsed,
        dayLimit: subscriptionLimit.dayLimit,
        allowed: subscriptionLimit.allowed,
        message: subscriptionLimit.message || `You have ${subscriptionLimit.dayLimit - subscriptionLimit.daysUsed} days remaining this month`
      });
    } catch (error) {
      console.error('Error checking business subscription status:', error);
      res.status(500).json({ error: 'Failed to check subscription status' });
    }
  });

  // Track business daily usage
  app.post('/api/business/track-usage', async (req, res) => {
    try {
      const businessId = req.body.businessId || req.headers['x-user-id'];
      if (!businessId) {
        return res.status(401).json({ error: 'Business ID required' });
      }

      const user = await storage.getUser(parseInt(businessId as string));
      
      if (!user || user.userType !== 'business') {
        return res.status(403).json({ error: 'Access denied: Business accounts only' });
      }

      // Track daily usage (increments counter if not already tracked today)
      await storage.trackBusinessDayUsage(businessId);
      
      res.json({ success: true, message: 'Usage tracked successfully' });
    } catch (error) {
      console.error('Error tracking business usage:', error);
      res.status(500).json({ error: 'Failed to track usage' });
    }
  });

  // STRIPE: Create business subscription (READY FOR STRIPE INTEGRATION)
  app.post('/api/business/create-subscription', async (req, res) => {
    try {
      console.log('💳 STRIPE: Creating business subscription');
      
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const businessId = parseInt(userId as string);
      const user = await storage.getUser(businessId);
      
      if (!user || user.userType !== 'business') {
        return res.status(403).json({ error: 'Access denied: Business accounts only' });
      }

      // TODO: Add STRIPE_SECRET_KEY integration here
      // For now, simulate a trial start or upgrade process
      
      console.log('💳 STRIPE: Subscription creation requested for business:', user.businessName || user.name);
      
      // If Stripe was configured, this would:
      // 1. Create Stripe customer
      // 2. Create Stripe subscription with $50/month + $100 setup fee
      // 3. Return clientSecret for Stripe checkout
      
      // For now, return trial start (you can replace this with Stripe integration)
      res.json({
        success: true,
        message: 'Subscription process initiated',
        trialStarted: true,
        // clientSecret: stripe_session.client_secret // Uncomment when Stripe is configured
      });
      
    } catch (error) {
      console.error('Error creating business subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // STRIPE: Cancel business subscription
  app.post('/api/business/cancel-subscription', async (req, res) => {
    try {
      console.log('💳 STRIPE: Canceling business subscription');
      
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const businessId = parseInt(userId as string);
      const user = await storage.getUser(businessId);
      
      if (!user || user.userType !== 'business') {
        return res.status(403).json({ error: 'Access denied: Business accounts only' });
      }

      // TODO: Add Stripe cancellation logic here
      
      console.log('💳 STRIPE: Subscription cancellation requested for business:', user.businessName || user.name);
      
      // For now, simulate cancellation
      res.json({
        success: true,
        message: 'Subscription canceled successfully. Your business profile will remain active until the end of the current billing period.'
      });
      
    } catch (error) {
      console.error('Error canceling business subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // GET /api/users/:userId/references - Get references for a user (from BOTH tables)
  app.get("/api/users/:userId/references", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get references from new references table with reviewer info
      const newReferences = await db.select({
        id: references.id,
        fromUserId: references.fromUserId,
        toUserId: references.toUserId,
        referenceType: references.referenceType,
        category: references.category,
        rating: references.rating,
        title: references.title,
        content: references.content,
        isPublic: references.isPublic,
        createdAt: references.createdAt,
        reviewerId: references.fromUserId,
        revieweeId: references.toUserId,
        experience: references.referenceType,
        reviewer: {
          id: users.id,
          name: users.name,
          username: users.username,
          profileImage: users.profileImage
        }
      })
      .from(references)
      .leftJoin(users, eq(references.fromUserId, users.id))
      .where(eq(references.toUserId, userId));
      
      // Get references from old user_references table with reviewer info using raw SQL to handle snake_case columns
      const oldReferencesRaw = await db.execute(sql`
        SELECT ur.id, ur.reviewer_id, ur.reviewee_id, ur.experience, ur.content, ur.created_at,
               u.id as reviewer_user_id, u.username as reviewer_username, u.name as reviewer_name, u.profile_image as reviewer_profile_image
        FROM user_references ur 
        LEFT JOIN users u ON ur.reviewer_id = u.id 
        WHERE ur.reviewee_id = ${userId}
      `);
      
      const oldReferences = oldReferencesRaw.rows.map((row: any) => ({
        id: row.id,
        reviewerId: row.reviewer_id,
        revieweeId: row.reviewee_id,
        experience: row.experience,
        content: row.content,
        createdAt: row.created_at,
        reviewer: {
          id: row.reviewer_user_id,
          name: row.reviewer_name,
          username: row.reviewer_username,
          profileImage: row.reviewer_profile_image
        }
      }));
      
      // Convert old references to new format
      const convertedOldReferences = oldReferences.map(ref => ({
        id: ref.id,
        fromUserId: ref.reviewerId,
        toUserId: ref.revieweeId,
        reviewerId: ref.reviewerId,
        revieweeId: ref.revieweeId,
        referenceType: ref.experience === 'positive' ? 'positive' : 
                      ref.experience === 'negative' ? 'negative' : 'neutral',
        experience: ref.experience,
        category: 'general',
        rating: ref.experience === 'positive' ? 5 : 
                ref.experience === 'negative' ? 1 : 3,
        title: 'Reference',
        content: ref.content,
        isPublic: true,
        createdAt: ref.createdAt,
        reviewer: ref.reviewer
      }));
      
      // Combine both sets of references
      const allReferences = [...newReferences, ...convertedOldReferences];
      
      console.log(`📋 REFERENCES: Found ${allReferences.length} references for user ${userId} (${newReferences.length} new + ${oldReferences.length} old)`);
      console.log('📋 REFERENCES: oldReferencesRaw.rows sample:', oldReferencesRaw.rows[0]);
      console.log('📋 REFERENCES: oldReferences mapped sample:', oldReferences[0]);
      console.log('📋 REFERENCES: Sample reference with reviewer:', allReferences[0] ? {
        id: allReferences[0].id,
        content: allReferences[0].content.substring(0, 50),
        experience: allReferences[0].experience,
        reviewer: allReferences[0].reviewer
      } : 'No references found');
      res.json(allReferences);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  // POST /api/references - Create a user reference
  app.post("/api/references", async (req, res) => {
    try {
      const { fromUserId, toUserId, referenceType, category, rating, title, content, isPublic } = req.body;
      
      // Validate required fields
      if (!fromUserId || !toUserId || !referenceType || !category || !rating || !title || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Insert reference into database
      const newReference = await db.insert(references).values({
        fromUserId,
        toUserId,
        referenceType,
        category,
        rating,
        title,
        content,
        isPublic: isPublic !== false, // Default to true
      }).returning();

      console.log('Reference created:', newReference[0]);
      res.status(201).json(newReference[0]);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ message: "Failed to create reference" });
    }
  });

  // POST /api/user-references - Create a user reference (using userReferences table)
  app.post("/api/user-references", async (req, res) => {
    try {
      console.log('API: Creating user reference with payload:', req.body);
      
      const { reviewerId, revieweeId, experience, content } = req.body;
      
      // Validate required fields for userReferences table
      if (!reviewerId || !revieweeId) {
        return res.status(400).json({ message: "Missing required fields: reviewerId and revieweeId" });
      }
      
      // Use storage method to create reference
      const newReference = await storage.createUserReference({
        reviewerId,
        revieweeId,
        experience: experience || 'positive',
        content: content || ''
      });

      console.log('API: User reference created successfully:', newReference);
      res.status(201).json(newReference);
    } catch (error) {
      console.error("API: Error creating user reference:", error);
      res.status(500).json({ message: "Failed to create user reference" });
    }
  });

  // Add universal activities endpoint
  app.post('/api/admin/add-universal-activities', async (req, res) => {
    try {
      const { addUniversalActivitiesToAllCities } = await import('./add-universal-activities.js');
      await addUniversalActivitiesToAllCities();
      res.json({ success: true, message: 'Universal activities added to all cities' });
    } catch (error) {
      console.error('Error adding universal activities:', error);
      res.status(500).json({ error: 'Failed to add universal activities' });
    }
  });

  // Travel Personality Assessment API Endpoints
  app.post('/api/users/travel-personality', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const personalityData = {
        userId: parseInt(userId as string),
        ...req.body
      };

      const profile = await storage.createTravelPersonalityProfile(personalityData);
      console.log('Travel personality profile created:', profile.id);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error creating travel personality profile:', error);
      res.status(500).json({ message: 'Failed to create travel personality profile' });
    }
  });

  app.post('/api/users/:userId/personality-profile', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const personalityData = {
        userId,
        ...req.body
      };

      const profile = await storage.createTravelPersonalityProfile(personalityData);
      console.log('Travel personality profile created for user:', userId);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error creating travel personality profile:', error);
      res.status(500).json({ message: 'Failed to create travel personality profile' });
    }
  });

  app.get('/api/users/:userId/personality-profile', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getTravelPersonalityProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: 'Personality profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching travel personality profile:', error);
      res.status(500).json({ message: 'Failed to fetch travel personality profile' });
    }
  });

  console.log("All routes registered successfully");
  return server;
}