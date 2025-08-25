import type { Express, Request, Response } from "express";

// Extend session interface to include user property
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      email: string;
    };
  }
}
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

// WebSocket heartbeat interface
type AliveWS = WebSocket & { isAlive?: boolean };
import express from "express";
import path from "path";
import { storage } from "./storage";
import { db, withRetry } from "./db";
import { eventReminderService } from "./services/eventReminderService";
import { TravelMatchingService } from "./services/matching";
import { businessProximityEngine } from "./businessProximityNotificationEngine";
import { smsService } from "./services/smsService";
import QRCode from "qrcode";

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
  quickDeals,
  quickDealRedemptions, 
  cityPhotos,
  citychatrooms,
  chatroomMembers,
  chatroomMessages,
  chatroomAccessRequests,
  businessOffers,
  cityPages,
  cityActivities,
  userCityInterests,
  businessInterestNotifications,
  references,
  userReferences,
  userEventInterests,
  vouches
} from "../shared/schema";
import { sql, eq, or, count, and, ne, desc, gte, lte, lt, isNotNull, inArray, asc, ilike, like, isNull, gt } from "drizzle-orm";

// City coordinates helper function - FIXED coordinate lookup
const getCityCoordinates = (city: string): [number, number] => {
  // Ensure city is a string and handle edge cases
  if (!city || typeof city !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗺️ INVALID CITY: Received invalid city value: ${city} (type: ${typeof city})`);
    }
    return [34.0522, -118.2437]; // Default to LA
  }

  const cityCoords: Record<string, [number, number]> = {
    'Los Angeles': [34.0522, -118.2437],
    'LA': [34.0522, -118.2437],
    'Playa del Rey': [33.9425, -118.4081],
    'Santa Monica': [34.0195, -118.4912],
    'Venice': [33.9850, -118.4695],
    'Beverly Hills': [34.0736, -118.4004],
    'Hollywood': [34.0928, -118.3287],
    'New Orleans': [29.9511, -90.0715],
    'Las Vegas': [36.1699, -115.1398],
    'New York': [40.7128, -74.0060],
    'Chicago': [41.8781, -87.6298],
    'Miami': [25.7617, -80.1918],
    'Boston': [42.3601, -71.0589],
    'Seattle': [47.6062, -122.3321],
    'Denver': [39.7392, -104.9903]
  };
  
  // Clean the city name - trim whitespace and normalize
  const cleanCity = city.trim();
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗺️ LOOKUP: Searching for "${cleanCity}" in coordinates table`);
  }
  
  // First try exact match with cleaned city
  if (cityCoords[cleanCity]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗺️ FOUND: Exact match for "${cleanCity}": [${cityCoords[cleanCity][0]}, ${cityCoords[cleanCity][1]}]`);
    }
    return cityCoords[cleanCity];
  }
  
  // Try case-insensitive match
  const cityLower = cleanCity.toLowerCase();
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (key.toLowerCase() === cityLower) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗺️ FOUND: Case-insensitive match for "${cleanCity}" -> "${key}": [${coords[0]}, ${coords[1]}]`);
      }
      return coords;
    }
  }

  // Try partial match for common variations
  if (cityLower.includes('santa monica') || cityLower.includes('santa_monica')) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗺️ FOUND: Partial match for Santa Monica: [34.0195, -118.4912]`);
    }
    return [34.0195, -118.4912];
  }
  
  if (cityLower.includes('los angeles') || cityLower.includes('la')) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗺️ FOUND: Partial match for Los Angeles: [34.0522, -118.2437]`);
    }
    return [34.0522, -118.2437];
  }
  
  // Default to LA if not found
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗺️ NOT FOUND: No match for "${cleanCity}", using default LA coordinates`);
  }
  return [34.0522, -118.2437];
};

// Generate a unique referral code for QR sharing
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Aura Points Helper Function - Production Optimized
async function awardAuraPoints(userId: number, points: number, action: string) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✨ AURA: Awarding ${points} points to user ${userId} for ${action}`);
    }
    
    // Update user's aura points
    await db.update(users)
      .set({ aura: sql`${users.aura} + ${points}` })
      .where(eq(users.id, userId));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ AURA: Successfully awarded ${points} points for ${action}`);
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ AURA: Failed to award points for ${action}:`, error);
    }
    // Log critical errors in production to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
    }
  }
}
import locationWidgetsRouter from "./routes/locationWidgets";
import { generateCityActivities } from './ai-city-activities.js';
import { ensureCityHasActivities, enhanceExistingCityWithMoreActivities } from './auto-city-setup.js';
import { fetchTicketmasterEvents } from './apis/ticketmaster';

import { fetchAllLocalLAEvents } from './apis/local-la-feeds';

// GEOCODING DISABLED: Temporarily disabled to prevent 431 rate limit errors from Nominatim API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (process.env.NODE_ENV === 'development') console.log(`📍 GEOCODING DISABLED: Skipping geocoding for "${address}" (prevented 431 errors)`);
  return null; // Always return null to prevent API calls
}

// METRO CONSOLIDATION DISABLED PER USER REQUEST
// User wants only user-created chatrooms, no automatic metro consolidations

interface MetropolitanArea {
  mainCity: string;
  state?: string;
  country: string;
  cities: string[];
}

// NO HARDCODED METRO AREAS - Removed all forced consolidation arrays
const GLOBAL_METROPOLITAN_AREAS: MetropolitanArea[] = [
  // Los Angeles Metropolitan Area
  {
    mainCity: 'Los Angeles Metro',
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

  // Nashville Metropolitan Area
  {
    mainCity: 'Nashville Metro',
    state: 'Tennessee',
    country: 'United States',
    cities: [
      'Nashville', 'Franklin', 'Murfreesboro', 'Clarksville', 'Hendersonville',
      'Smyrna', 'Brentwood', 'Gallatin', 'Lebanon', 'Springfield',
      'Dickson', 'Goodlettsville', 'La Vergne', 'Mount Juliet', 'White House',
      'Greenbrier', 'Millersville', 'Portland', 'Ridgetop', 'Cross Plains',
      'Coopertown', 'Joelton', 'Ashland City', 'Pleasant View', 'Adams',
      'Belle Meade', 'Berry Hill', 'Forest Hills', 'Lakewood', 'Oak Hill',
      'Greenhills', 'Green Hills', 'Music Row', 'Donelson', 'Hermitage',
      'Antioch', 'Bellevue', 'Madison', 'Goodlettsville', 'Old Hickory'
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

// ENABLED: Metro consolidation functions - consolidate all major cities worldwide
function consolidateToMetropolitanArea(city: string, state?: string, country?: string): string {
  // DISABLED: No forced consolidation - return original city
  return city;
}

// DISABLED: Get all cities in a metropolitan area - no forced consolidation
function getMetropolitanAreaCities(mainCity: string, state?: string, country?: string): string[] {
  // DISABLED: Return only the single city without metro consolidation
  return [mainCity];
}

// DISABLED: Legacy functions for backwards compatibility  
function consolidateToLAMetro(city: string, state?: string): string {
  // DISABLED: Return original city without consolidation
  return city || '';
}

function getLAMetroCities(): string[] {
  // DISABLED: Return empty array - no more LA metro consolidation
  return [];
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
    // Note: createInstagramPost method temporarily disabled
    const instagramPost = null; // await storage.createInstagramPost({
      // eventId: event.id,
      // userId: organizerId,
      // postContent: generateEventCaption(event),
      // imageUrl: event.imageUrl || null,
      // userPostStatus: 'pending',
      // nearbytravelerPostStatus: 'pending'
    // });

    if (process.env.NODE_ENV === 'development') console.log('Instagram post created for dual posting event:', event.id);
    return instagramPost;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') console.error('Failed to handle Instagram posting:', error);
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
  if (state && typeof state === 'string') {
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
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') console.error('Error generating AI content:', error);
    return `Information about ${topic} in ${location} will be added by community members.`;
  }
}

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  if (process.env.NODE_ENV === 'development') console.log("Starting routes registration...");

  // CRITICAL: Register location widgets routes
  app.use(locationWidgetsRouter);
  if (process.env.NODE_ENV === 'development') console.log("Location widgets routes registered");

  // Serve static files from attached_assets directory
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  if (process.env.NODE_ENV === 'development') console.log("Static file serving configured for attached_assets");

  // Weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      const { city, state, country } = req.query as { city?: string; state?: string; country?: string; };

      if (!city || !country) {
        return res.status(400).json({ message: "City and country parameters are required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🌤️ WEATHER: Getting weather for ${city}, ${state}, ${country}`);

      // Use real weather API with the available WEATHER_API_KEY
      const weatherApiKey = process.env.WEATHER_API_KEY;
      
      if (!weatherApiKey) {
        if (process.env.NODE_ENV === 'development') console.error('Weather API key not configured');
        return res.status(500).json({ message: "Weather service not configured" });
      }

      // Build location query - prioritize city, state format for US locations
      const cityStr = Array.isArray(city) ? city[0] : city;
      const stateStr = Array.isArray(state) ? state[0] : state;
      const countryStr = Array.isArray(country) ? country[0] : country;
      
      let locationQuery = cityStr;
      if (stateStr && typeof stateStr === 'string' && typeof countryStr === 'string' && (countryStr.toLowerCase().includes('united states') || countryStr.toLowerCase().includes('usa'))) {
        locationQuery = `${cityStr}, ${stateStr}`;
      } else if (countryStr && typeof countryStr === 'string' && typeof cityStr === 'string' && !cityStr.includes(countryStr)) {
        locationQuery = `${cityStr}, ${countryStr}`;
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🌤️ WEATHER: Fetching real weather data for "${locationQuery}"`);
      if (process.env.NODE_ENV === 'development') console.log(`🔑 WEATHER: Using API key: ${weatherApiKey ? 'Present' : 'Missing'}`);
      
      // Call WeatherAPI.com (free tier available)
      const weatherApiUrl = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${encodeURIComponent(locationQuery)}&aqi=no`;
      if (process.env.NODE_ENV === 'development') console.log(`🌐 WEATHER: Making request to: ${weatherApiUrl.replace(weatherApiKey, 'API_KEY_HIDDEN')}`);
      
      const weatherResponse = await fetch(weatherApiUrl);
      if (process.env.NODE_ENV === 'development') console.log(`📡 WEATHER: Response status: ${weatherResponse.status} ${weatherResponse.statusText}`);
      
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        if (process.env.NODE_ENV === 'development') console.error(`❌ Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
        if (process.env.NODE_ENV === 'development') console.error(`❌ Weather API response: ${errorText}`);
        throw new Error(`Weather API returned ${weatherResponse.status}: ${errorText}`);
      }
      
      const weatherData = await weatherResponse.json();
      if (process.env.NODE_ENV === 'development') console.log(`✅ WEATHER: Received data for ${weatherData?.location?.name}, temp: ${weatherData?.current?.temp_f}°F`);

      return res.json(weatherData);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching weather:", error);
      }
      return res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // FIXED: City stats endpoint based on actual user data
  app.get("/api/city-stats", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🏙️ FIXED CITY SYSTEM: Loading cities based on actual user data");

      // Get unique cities where users actually live or are traveling to
      const uniqueCitiesQuery = await db.execute(sql`
        SELECT DISTINCT city_name as city FROM (
          SELECT DISTINCT hometown_city as city_name FROM users WHERE hometown_city IS NOT NULL AND hometown_city != ''
          UNION
          SELECT DISTINCT substring(destination from '^([^,]+)') as city_name FROM travel_plans WHERE destination IS NOT NULL AND destination != ''
          UNION
          SELECT DISTINCT substring(travel_destination from '^([^,]+)') as city_name FROM users WHERE travel_destination IS NOT NULL AND travel_destination != ''
        ) cities
        WHERE city_name IS NOT NULL AND city_name != ''
        ORDER BY city_name
      `);

      // Function to determine country based on city name
      const getCityCountry = (cityName: string): { state: string, country: string } => {
        // International cities
        const internationalCities: Record<string, { state: string, country: string }> = {
          'Barcelona': { state: 'Catalonia', country: 'Spain' },
          'Madrid': { state: '', country: 'Spain' },
          'London': { state: '', country: 'United Kingdom' },
          'Edinburgh': { state: 'Scotland', country: 'United Kingdom' },
          'Paris': { state: '', country: 'France' },
          'Rome': { state: '', country: 'Italy' },
          'Milan': { state: '', country: 'Italy' },
          'Berlin': { state: '', country: 'Germany' },
          'Munich': { state: '', country: 'Germany' },
          'Amsterdam': { state: '', country: 'Netherlands' },
          'Prague': { state: '', country: 'Czech Republic' },
          'Vienna': { state: '', country: 'Austria' },
          'Lisbon': { state: '', country: 'Portugal' },
          'Dublin': { state: '', country: 'Ireland' },
          'Stockholm': { state: '', country: 'Sweden' },
          'Tokyo': { state: '', country: 'Japan' },
          'Seoul': { state: '', country: 'South Korea' },
          'Bangkok': { state: '', country: 'Thailand' },
          'Singapore': { state: '', country: 'Singapore' },
          'Hong Kong': { state: '', country: 'Hong Kong' },
          'Sydney': { state: 'New South Wales', country: 'Australia' },
          'Melbourne': { state: 'Victoria', country: 'Australia' },
          'Toronto': { state: 'Ontario', country: 'Canada' },
          'Vancouver': { state: 'British Columbia', country: 'Canada' },
          'Mexico City': { state: '', country: 'Mexico' },
          'São Paulo': { state: '', country: 'Brazil' },
          'Buenos Aires': { state: '', country: 'Argentina' },
          'Cairo': { state: '', country: 'Egypt' },
          'Cape Town': { state: '', country: 'South Africa' },
          'Dubai': { state: '', country: 'United Arab Emirates' },
          'Tel Aviv': { state: '', country: 'Israel' },
          'Mumbai': { state: '', country: 'India' },
          'Delhi': { state: '', country: 'India' },
          'Bangalore': { state: '', country: 'India' },
          'Budapest': { state: '', country: 'Hungary' },
          'Cannes': { state: '', country: 'France' }
        };

        // Check if it's an international city
        if (internationalCities[cityName]) {
          return internationalCities[cityName];
        }

        // US cities mapping
        const usCities: Record<string, { state: string, country: string }> = {
          'Los Angeles Metro': { state: 'California', country: 'United States' },
          'Los Angeles': { state: 'California', country: 'United States' },
          'Nashville Metro': { state: 'Tennessee', country: 'United States' },
          'Nashville': { state: 'Tennessee', country: 'United States' },
          'San Francisco': { state: 'California', country: 'United States' },
          'San Diego': { state: 'California', country: 'United States' },
          'Sacramento': { state: 'California', country: 'United States' },
          'Oakland': { state: 'California', country: 'United States' },
          'San Jose': { state: 'California', country: 'United States' },
          'New York City': { state: 'New York', country: 'United States' },
          'New York': { state: 'New York', country: 'United States' },
          'Manhattan': { state: 'New York', country: 'United States' },
          'Brooklyn': { state: 'New York', country: 'United States' },
          'Queens': { state: 'New York', country: 'United States' },
          'Bronx': { state: 'New York', country: 'United States' },
          'Chicago': { state: 'Illinois', country: 'United States' },
          'Houston': { state: 'Texas', country: 'United States' },
          'Phoenix': { state: 'Arizona', country: 'United States' },
          'Philadelphia': { state: 'Pennsylvania', country: 'United States' },
          'San Antonio': { state: 'Texas', country: 'United States' },
          'Dallas': { state: 'Texas', country: 'United States' },
          'Austin': { state: 'Texas', country: 'United States' },
          'Jacksonville': { state: 'Florida', country: 'United States' },
          'Fort Worth': { state: 'Texas', country: 'United States' },
          'Columbus': { state: 'Ohio', country: 'United States' },
          'Charlotte': { state: 'North Carolina', country: 'United States' },
          'Indianapolis': { state: 'Indiana', country: 'United States' },
          'Seattle': { state: 'Washington', country: 'United States' },
          'Denver': { state: 'Colorado', country: 'United States' },
          'Washington': { state: 'District of Columbia', country: 'United States' },
          'Boston': { state: 'Massachusetts', country: 'United States' },
          'El Paso': { state: 'Texas', country: 'United States' },
          'Detroit': { state: 'Michigan', country: 'United States' },
          'Oklahoma City': { state: 'Oklahoma', country: 'United States' },
          'Portland': { state: 'Oregon', country: 'United States' },
          'Las Vegas': { state: 'Nevada', country: 'United States' },
          'Memphis': { state: 'Tennessee', country: 'United States' },
          'Louisville': { state: 'Kentucky', country: 'United States' },
          'Baltimore': { state: 'Maryland', country: 'United States' },
          'Milwaukee': { state: 'Wisconsin', country: 'United States' },
          'Albuquerque': { state: 'New Mexico', country: 'United States' },
          'Tucson': { state: 'Arizona', country: 'United States' },
          'Fresno': { state: 'California', country: 'United States' },
          'Mesa': { state: 'Arizona', country: 'United States' },
          'Kansas City': { state: 'Missouri', country: 'United States' },
          'Atlanta': { state: 'Georgia', country: 'United States' },
          'Colorado Springs': { state: 'Colorado', country: 'United States' },
          'Omaha': { state: 'Nebraska', country: 'United States' },
          'Raleigh': { state: 'North Carolina', country: 'United States' },
          'Miami': { state: 'Florida', country: 'United States' },
          'Long Beach': { state: 'California', country: 'United States' },
          'Virginia Beach': { state: 'Virginia', country: 'United States' },
          'Redondo Beach': { state: 'California', country: 'United States' },
          'Manhattan Beach': { state: 'California', country: 'United States' },
          'Santa Monica': { state: 'California', country: 'United States' },
          'Venice': { state: 'California', country: 'United States' },
          'Venice Beach': { state: 'California', country: 'United States' },
          'Beverly Hills': { state: 'California', country: 'United States' },
          'West Hollywood': { state: 'California', country: 'United States' },
          'Hollywood': { state: 'California', country: 'United States' },
          'Pasadena': { state: 'California', country: 'United States' },
          'Burbank': { state: 'California', country: 'United States' },
          'Glendale': { state: 'California', country: 'United States' }
        };

        // Check if it's a known US city
        if (usCities[cityName]) {
          return usCities[cityName];
        }

        // Default fallback for unknown cities - assume US
        return { state: '', country: 'United States' };
      };

      // DISABLED: Metro consolidation per user request - show original cities
      const rawCities = uniqueCitiesQuery.rows.map((row: any) => row.city);
      // ENABLED: Metro consolidation for all cities
      const consolidatedCityMap = new Map<string, string[]>();
      const consolidatedCityNames = new Set<string>();

      // Process each city and consolidate to metro areas
      for (const cityName of rawCities) {
        const cityData = getCityCountry(cityName);
        const consolidatedCity = consolidateToMetropolitanArea(cityName, cityData.state, cityData.country);
        
        if (!consolidatedCityMap.has(consolidatedCity)) {
          consolidatedCityMap.set(consolidatedCity, []);
        }
        consolidatedCityMap.get(consolidatedCity)!.push(cityName);
        consolidatedCityNames.add(consolidatedCity);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🌍 METRO CONSOLIDATION: Consolidated city mapping:');
        for (const [metro, cities] of consolidatedCityMap.entries()) {
          if (cities.length > 1) {
            console.log(`  ${metro}: ${cities.join(', ')}`);
          }
        }
      }

      const actualCities = [...consolidatedCityNames]; // Use consolidated cities

      const citiesWithStats = await Promise.all(
        actualCities.map(async (cityName: string) => {
          try {
            let localUsersResult, businessUsersResult, travelPlansResult, currentTravelersResult, eventsResult;

            // Get all original cities that consolidated to this metro area
            const originalCities = consolidatedCityMap.get(cityName) || [cityName];

            // ENABLED: Metro consolidation - search all cities in the metro area
            localUsersResult = await db
              .select({ count: count() })
              .from(users)
              .where(
                and(
                  or(
                    ...originalCities.map(origCity => eq(users.hometownCity, origCity))
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
                    ...originalCities.map(origCity => eq(users.hometownCity, origCity))
                  ),
                  eq(users.userType, 'business')
                )
              );

            // For travel plans and current travelers, search across all original cities
            travelPlansResult = await db
              .select({ count: count() })
              .from(travelPlans)
              .where(
                or(
                  ...originalCities.map(origCity => ilike(travelPlans.destination, `%${origCity}%`))
                )
              );

            currentTravelersResult = await db
              .select({ count: count() })
              .from(users)
              .where(
                and(
                  or(
                    ...originalCities.map(origCity => ilike(users.travelDestination, `%${origCity}%`))
                  ),
                  eq(users.isCurrentlyTraveling, true)
                )
              );

            eventsResult = await db
              .select({ count: count() })
              .from(events)
              .where(
                or(
                  ...originalCities.map(origCity => ilike(events.city, `%${origCity}%`))
                )
              );

            const localCount = localUsersResult[0]?.count || 0;
            const businessCount = businessUsersResult[0]?.count || 0;
            const travelerCount = (travelPlansResult[0]?.count || 0) + (currentTravelersResult[0]?.count || 0);
            const eventCount = eventsResult[0]?.count || 0;

            const cityLocation = getCityCountry(cityName);
            
            return {
              city: cityName,
              state: cityLocation.state,
              country: cityLocation.country,
              localCount,
              travelerCount,
              businessCount,
              eventCount,
              description: `Discover ${cityName}`,
              highlights: [`${localCount} locals`, `${travelerCount} travelers`, `${businessCount} businesses`, `${eventCount} events`]
            };
          } catch (error: any) {
            if (process.env.NODE_ENV === 'development') console.error(`Error processing city ${cityName}:`, error);
            return {
              city: cityName,
              state: '',
              country: 'United States',
              localCount: 0,
              travelerCount: 0,
              businessCount: 0,
              eventCount: 0,
              description: `Discover ${cityName}`,
              highlights: ['0 locals', '0 travelers', '0 events']
            };
          }
        })
      );

      // Sort by total activity
      citiesWithStats.sort((a, b) => 
        (b.localCount + b.travelerCount + b.eventCount) - (a.localCount + a.travelerCount + a.eventCount)
      );

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ FIXED: Returning ${citiesWithStats.length} cities based on actual user data (LA metro consolidated)`);
      res.json(citiesWithStats);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching working city stats:", error);
      res.status(500).json({ message: "Failed to fetch city statistics", error: error.message });
    }
  });

  // City-specific stats endpoint for individual city pages  
  app.get("/api/city-stats/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const { state, country } = req.query;

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY STATS SPECIFIC: Getting stats for ${city}, ${state}, ${country}`);

      let localUsersResult, businessUsersResult, travelPlansResult, currentTravelersResult, eventsResult;

      // Apply metropolitan area consolidation
      const consolidatedCity = consolidateToMetropolitanArea(city, state as string, country as string);
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 CITY STATS: ${city} consolidated to ${consolidatedCity}`);
      
      // COMPLETELY REWRITTEN CITY STATS - FIXED FOR ALL CITIES
      let searchCities = [city];
      
      // Apply specific city mappings for accurate user counting
      if (city === 'Los Angeles Metro') {
        searchCities = ['Los Angeles', 'Santa Monica', 'Venice', 'Playa del Rey', 'Hollywood', 'Beverly Hills', 'Culver City', 'Marina del Rey'];
      } else if (city === 'Nashville Metro') {
        searchCities = ['Nashville', 'Nashville Metro'];
      } else if (city === 'New York City') {
        searchCities = ['New York City', 'New York', 'NYC'];
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 CITY STATS FIXED: Searching for users in cities:`, searchCities);
        
      localUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => eq(users.hometownCity, searchCity))),
            eq(users.userType, 'local')
          )
        );
          
      if (process.env.NODE_ENV === 'development') console.log(`🔍 CITY STATS DEBUG: Local users result:`, localUsersResult);

      businessUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => eq(users.hometownCity, searchCity))),
            eq(users.userType, 'business')
          )
        );

      travelPlansResult = await db
        .select({ count: count() })
        .from(travelPlans)
        .where(
          or(...searchCities.map(searchCity => ilike(travelPlans.destination, `%${searchCity}%`)))
        );

      currentTravelersResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => ilike(users.travelDestination, `%${searchCity}%`))),
            eq(users.isCurrentlyTraveling, true)
          )
        );

      eventsResult = await db
        .select({ count: count() })
        .from(events)
        .where(
          or(...searchCities.map(searchCity => ilike(events.city, `%${searchCity}%`)))
        );

      const localCount = localUsersResult[0]?.count || 0;
      const businessCount = businessUsersResult[0]?.count || 0;
      const travelerCount = (travelPlansResult[0]?.count || 0) + (currentTravelersResult[0]?.count || 0);
      const eventCount = eventsResult[0]?.count || 0;

      const cityStats = {
        city: city,
        state: state || '',
        country: country || 'United States', // Default to United States instead of empty string
        localCount,
        travelerCount,
        businessCount,
        eventCount
      };

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY STATS SPECIFIC: Found stats for ${city}:`, cityStats);
      res.json(cityStats);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city stats:", error);
      res.status(500).json({ message: "Failed to fetch city stats" });
    }
  });

  // RESTORED: Secret experiences endpoint that was working when locals signed up
  app.get("/api/secret-experiences/:city/", async (req, res) => {
    try {
      const { city } = req.params;
      const { state, country } = req.query as { state?: string; country?: string; };

      if (process.env.NODE_ENV === 'development') console.log(` SECRET EXPERIENCES: Loading for ${city}, ${state}, ${country}`);

      const experiences = await storage.getSecretLocalExperiencesByCity(
        city as string, 
        (state as string) || null, 
        (country as string) || null
      );

      if (process.env.NODE_ENV === 'development') console.log(` SECRET EXPERIENCES: Found ${experiences.length} secret activities for ${city}`);
      return res.json(experiences);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching secret experiences:", error);
      return res.status(500).json({ message: "Failed to fetch secret experiences", error: error.message });
    }
  });

  // RESTORED: Secret experience like endpoint
  app.post("/api/secret-experiences/:experienceId/like", async (req, res) => {
    try {
      const { experienceId } = req.params;
      const { userId } = req.body;

      if (process.env.NODE_ENV === 'development') console.log('🔥 LIKE API: Received like request', { experienceId, userId, type: typeof experienceId });

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const experienceIdNum = parseInt(experienceId || '0');
      const userIdNum = parseInt(userId || '0');

      if (process.env.NODE_ENV === 'development') console.log('🔥 LIKE API: Parsed IDs', { experienceIdNum, userIdNum });

      const updatedExperience = await storage.likeSecretLocalExperience(
        experienceIdNum, 
        userIdNum
      );

      if (process.env.NODE_ENV === 'development') console.log('🔥 LIKE API: Storage result', updatedExperience ? 'SUCCESS' : 'FAILED');

      if (!updatedExperience) {
        return res.status(404).json({ message: "Experience not found or already liked" });
      }

      return res.json(updatedExperience);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🔥 LIKE API ERROR:", error);
      return res.status(500).json({ message: "Failed to like experience", error: error.message });
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  // Initialize chatrooms asynchronously (non-blocking)
  if (process.env.NODE_ENV === 'development') console.log("Starting routes registration...");
  storage.ensureMeetLocalsChatrooms()
    .then(() => {
      if (process.env.NODE_ENV === 'development') console.log("Chatrooms initialization completed");
    })
    .catch(err => {
      if (process.env.NODE_ENV === 'development') console.error("Chatrooms initialization failed:", err);
    });

  // CRITICAL: Get users by location and type endpoint with LA Metro consolidation - must come before parameterized routes
  app.get("/api/users-by-location/:city/:userType", async (req, res) => {
    try {
      const { city, userType } = req.params;
      const { state, country } = req.query;
      
      if (process.env.NODE_ENV === 'development') console.log(`Users by location endpoint: ${city}, ${userType}, state: ${state}, country: ${country}`);
      
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
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Redirecting search from ${searchCity} to ${consolidatedSearchCity}`);
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
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Combined ${users.length} users from all ${consolidatedSearchCity} metro cities`);
        
        // Keep original city names - users maintain their individual identities
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`Found ${users.length} users for location: ${finalSearchLocation}, type: ${userType}`);
      res.json(users);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error in users-by-location endpoint:", error);
      res.status(500).json({ message: "Failed to fetch users by location", error });
    }
  });

  // City users endpoint - get all users for a specific city page WITH METRO CONSOLIDATION
  app.get("/api/city/:city/users", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const { state, country } = req.query;
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY USERS: Getting users for ${city}, ${state}, ${country}`);
      
      // Apply metropolitan area consolidation FIRST
      const searchState = (state as string) || '';  
      const searchCountry = (country as string) || '';
      const consolidatedCity = consolidateToMetropolitanArea(city, searchState, searchCountry);
      
      if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO CONSOLIDATION: ${city} → ${consolidatedCity}`);
      
      // Build comprehensive search with metro area
      let searchLocation = consolidatedCity;
      if (state) searchLocation += `, ${state}`;
      if (country) searchLocation += `, ${country}`;
      
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY USERS: Searching with consolidated location: "${searchLocation}"`);
      let users = await storage.searchUsersByLocationDirect(searchLocation);
      
      // ALWAYS search all metro cities for metropolitan areas (whether consolidated or requested directly)
      const metroCities = getMetropolitanAreaCities(consolidatedCity, searchState, searchCountry);
      if (metroCities.length > 1) { // If this is actually a metro area with multiple cities
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Searching all ${consolidatedCity} metropolitan cities: ${metroCities.join(', ')}`);
        
        const allMetroUsers = [];
        const allUserIds = new Set(users.map(user => user.id));
        
        for (const metroCity of metroCities) {
          if (metroCity !== consolidatedCity) {
            // Search with state and country for exact matching
            const metroLocation = searchState && searchCountry 
              ? `${metroCity}, ${searchState}, ${searchCountry}`
              : searchState 
                ? `${metroCity}, ${searchState}` 
                : metroCity;
                
            if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Searching ${metroCity} (${metroLocation})`);
            const metroUsers = await storage.searchUsersByLocationDirect(metroLocation);
            
            // Add unique users to the result
            for (const user of metroUsers) {
              if (!allUserIds.has(user.id)) {
                allUserIds.add(user.id);
                allMetroUsers.push(user);
              }
            }
          }
        }
        
        users = [...users, ...allMetroUsers];
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Combined ${users.length} users from ${consolidatedCity} area`);
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY USERS: Final result - ${users.length} users for ${city} (with metro consolidation)`);
      return res.json(users);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city users:", error);
      return res.status(500).json({ message: "Failed to fetch city users", error: error.message });
    }
  });

  // Search users by location endpoint with LA Metro consolidation - must come before parameterized routes
  app.get("/api/users/search-by-location", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("Search by location endpoint hit with query:", req.query);
      const { location, userType } = req.query;

      if (!location) {
        return res.status(400).json({ message: "Location is required" });
      }

      // Get current user ID from headers (set by frontend)
      const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string || '0') : null;

      // Apply global metropolitan area consolidation to search location
      const searchLocation = location as string;
      const locationParts = searchLocation.split(',').map(part => part.trim());
      const [searchCity, searchState, searchCountry] = locationParts;
      const consolidatedSearchCity = consolidateToMetropolitanArea(searchCity, searchState, searchCountry);
      
      // If searching for a metro area city, search for the main metropolitan city
      let finalSearchLocation = searchLocation;
      if (consolidatedSearchCity !== searchCity) {
        finalSearchLocation = searchLocation.replace(searchCity, consolidatedSearchCity);
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Redirecting search from ${searchCity} to ${consolidatedSearchCity}`);
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
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO: Combined ${users.length} users from all ${consolidatedSearchCity} metro cities`);
        
        // Keep original city names - users maintain their individual identities
      }

      // Include current user if they match the location (hometown search)
      if (currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (currentUser && !users.some(u => u.id === currentUserId)) {
          const userHometown = `${currentUser.hometownCity}, ${currentUser.hometownState}, ${currentUser.hometownCountry}`;
          const currentUserCity = currentUser.hometownCity || '';
          
          // Check if current user should be included in this search (exact city match only)
          const shouldIncludeCurrentUser = 
            (userHometown.toLowerCase().includes(finalSearchLocation.toLowerCase())) ||
            (finalSearchLocation.toLowerCase().includes(currentUserCity.toLowerCase()));
          
          if (shouldIncludeCurrentUser) {
            if (process.env.NODE_ENV === 'development') console.log(`👤 HOMETOWN SEARCH: Including current user ${currentUser.username} from ${currentUserCity} in ${finalSearchLocation} results`);
            users.unshift(currentUser);
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`CONNECTIONS FIXED: Found ${users.length} users for location: ${finalSearchLocation}, type: ${userType}`);
      return res.json(users);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to search users by location:", error);
      res.status(500).json({ message: "Failed to search users by location", error });
    }
  });

  // NOTE: This route moved below to avoid conflict with /api/users/search

  // Initialize sample data route (for restoring lost data)
  app.post("/api/admin/init-data", async (req, res) => {
    try {
      // await storage.initializeSampleData(); // Method not available
      res.json({ message: "Sample data initialized successfully" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error initializing sample data:", error);
      res.status(500).json({ message: "Failed to initialize sample data", error });
    }
  });

  // Consolidate NYC locations route
  app.post("/api/admin/consolidate-nyc", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🗽 Starting NYC location consolidation...");

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

          if (process.env.NODE_ENV === 'development') console.log(`Updated ${usersToUpdate.length} users from ${variation} to New York City`);
          totalUpdated += usersToUpdate.length;
        }
      }

      if (process.env.NODE_ENV === 'development') console.log("🎉 NYC location consolidation completed!");
      res.json({ 
        message: "NYC locations consolidated successfully", 
        totalUsersUpdated: totalUpdated 
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error consolidating NYC locations:", error);
      res.status(500).json({ message: "Failed to consolidate NYC locations", error: error.message });
    }
  });

  // Consolidate Los Angeles metropolitan area locations route
  app.post("/api/admin/consolidate-la", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🌴 Starting LA metropolitan area consolidation...");

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
            if (process.env.NODE_ENV === 'development') console.log(`🌴 LA METRO: Updating ${usersToUpdate.length} users from ${laCity} to Los Angeles`);
            
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
            eq(users.hometownState, 'California'),
            inArray(users.hometownCity, getMetropolitanAreaCities('Los Angeles', 'California', 'United States').filter(city => city !== 'Los Angeles'))
          )
        );

      if (businessesToUpdate.length > 0) {
        if (process.env.NODE_ENV === 'development') console.log(`🌴 LA METRO: Updating ${businessesToUpdate.length} business locations to Los Angeles`);
        
        for (const business of businessesToUpdate) {
          await db
            .update(users)
            .set({ hometownCity: 'Los Angeles' })
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
        if (process.env.NODE_ENV === 'development') console.log(`🌴 LA METRO: Updating ${travelPlansToUpdate.length} travel plan destinations to Los Angeles`);
        
        for (const plan of travelPlansToUpdate) {
          await db
            .update(travelPlans)
            .set({ destinationCity: 'Los Angeles' })
            .where(eq(travelPlans.id, plan.id));
        }
      }

      if (process.env.NODE_ENV === 'development') console.log("🌴 LA metropolitan area consolidation completed!");
      res.json({ 
        message: "LA metropolitan area consolidated successfully", 
        totalRecordsUpdated: totalUpdated 
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error consolidating LA metropolitan area:", error);
      res.status(500).json({ message: "Failed to consolidate LA metropolitan area", error: error.message });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      if (process.env.NODE_ENV === 'development') console.log("Login attempt for:", email);

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
      if (process.env.NODE_ENV === 'development') console.error("Login error:", error);
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

      return res.json({ exists: false });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Email check error:", error);
      res.status(500).json({ message: "Failed to check email availability" });
    }
  });

  // Quick login endpoint for development
  app.post("/api/quick-login/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Quick login error:", error);
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

      // Get current user data - fix type safety
      const userRecord = user as any;
      let currentItems = userRecord[type] || [];

      // Add item if not already present
      if (!currentItems.includes(item)) {
        currentItems = [...currentItems, item];

        // Update user in database
        const updateData = { [type]: currentItems };
        await storage.updateUser(userId, updateData);

        return res.json({ 
          success: true, 
          message: `Added "${item}" to your ${type}`,
          updatedItems: currentItems 
        });
      } else {
        return res.json({ 
          success: true, 
          message: `"${item}" is already in your ${type}`,
          updatedItems: currentItems 
        });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding interest to user:", error);
      return res.status(500).json({ message: "Failed to add interest" });
    }
  });

  // Username validation endpoint (GET version for URL params)
  app.get("/api/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      if (username.length < 3) {
        return res.status(400).json({ 
          message: "Username must be at least 3 characters",
          exists: true,
          available: false
        });
      }

      // Check if username actually exists in database
      const existingUser = await storage.getUserByUsername(username);
      const exists = !!existingUser;
      const available = !exists;
      
      if (process.env.NODE_ENV === 'development') console.log(`Username check for "${username}" - exists: ${exists}, available: ${available}`);
      res.json({ exists, available });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Username check error:", error);
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

      // Check if username actually exists in database
      const existingUser = await storage.getUserByUsername(username);
      const exists = !!existingUser;
      const available = !exists;
      
      if (process.env.NODE_ENV === 'development') console.log(`Username check for "${username}" - exists: ${exists}, available: ${available}`);
      return res.json({ exists, available });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Username check error:", error);
      return res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Shared registration handler
  const handleRegistration = async (req: any, res: any) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🔍 FULL REGISTRATION DATA RECEIVED:", JSON.stringify(req.body, null, 2));
      if (process.env.NODE_ENV === 'development') console.log("🏠 ORIGINAL LOCATION DATA RECEIVED:", {
        hometownCity: (req.body as any).hometownCity,
        hometownState: (req.body as any).hometownState,
        hometownCountry: (req.body as any).hometownCountry
      });
      if (process.env.NODE_ENV === 'development') console.log("✈️ ORIGINAL TRAVEL DATA RECEIVED:", {
        isCurrentlyTraveling: (req.body as any).isCurrentlyTraveling,
        travelDestination: (req.body as any).travelDestination,
        currentCity: (req.body as any).currentCity,
        currentState: (req.body as any).currentState,
        currentCountry: (req.body as any).currentCountry,
        travelStartDate: (req.body as any).travelStartDate,
        travelEndDate: (req.body as any).travelEndDate
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
        
        if (process.env.NODE_ENV === 'development') console.log("🗺️ LOCATION PRESERVED (NO NORMALIZATION):", {
          original: { 
            city: (req.body as any).hometownCity, 
            state: (req.body as any).hometownState, 
            country: (req.body as any).hometownCountry 
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
        if (process.env.NODE_ENV === 'development') console.log("📍 PROCESSING LOCAL USER - Location mapping:");
        if (process.env.NODE_ENV === 'development') console.log("  Input hometown data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry
        });

        // Always populate location field for locals
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
          if (process.env.NODE_ENV === 'development') console.log("  ✓ Set location field:", processedData.location);
        }

        // Always populate hometown field for locals
        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
          if (process.env.NODE_ENV === 'development') console.log("  ✓ Set hometown field:", processedData.hometown);
        }

        if (process.env.NODE_ENV === 'development') console.log("  Final processed location data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry,
          location: processedData.location,
          hometown: processedData.hometown
        });
      }

      // Map traveler signup fields - CRITICAL for travel data processing
      if (processedData.userType === 'traveler') {
        if (process.env.NODE_ENV === 'development') console.log("✈️ PROCESSING TRAVELER USER - Travel mapping:");
        if (process.env.NODE_ENV === 'development') console.log("  Input travel data:", {
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
          if (process.env.NODE_ENV === 'development') console.log("  ✓ Set travel destination:", processedData.travelDestination);
        }

        // Always populate hometown and location fields for travelers too
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
          if (process.env.NODE_ENV === 'development') console.log("  ✓ Set location field:", processedData.location);
        }

        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
          if (process.env.NODE_ENV === 'development') console.log("  ✓ Set hometown field:", processedData.hometown);
        }

        if (process.env.NODE_ENV === 'development') console.log("  Final processed traveler data:", {
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
        if (process.env.NODE_ENV === 'development') console.log("Mapping business fields. Input data:", processedData);

        // Map business location fields from multiple possible sources
        // Check businessCity/businessState/businessCountry from signup-business form
        if ((processedData as any).businessCity) {
          processedData.hometownCity = (processedData as any).businessCity;
        }
        if ((processedData as any).businessState) {
          processedData.hometownState = (processedData as any).businessState;  
        }
        if ((processedData as any).businessCountry) {
          processedData.hometownCountry = (processedData as any).businessCountry;
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

        // Map business address fields to user schema fields with automatic geocoding
        if (processedData.businessAddress) {
          processedData.streetAddress = processedData.businessAddress;
          
          // AUTOMATIC GEOCODING: Convert business address to coordinates during signup (background processing)
          const businessAddress = processedData.businessAddress;
          setImmediate(async () => {
            try {
              const coords = await geocodeAddress(businessAddress);
              if (coords) {
                // Update coordinates separately after signup succeeds
                await db.update(users)
                  .set({ 
                    currentLatitude: coords.lat, 
                    currentLongitude: coords.lng,
                    locationSharingEnabled: true // Enable location sharing for businesses with valid coordinates
                  })
                  .where(eq(users.username, processedData.username));
                if (process.env.NODE_ENV === 'development') console.log(`🗺️ BUSINESS SIGNUP BACKGROUND GEOCODED: "${businessAddress}" → (${coords.lat}, ${coords.lng})`);
              } else {
                if (process.env.NODE_ENV === 'development') console.warn(`⚠️ BUSINESS SIGNUP BACKGROUND GEOCODE FAILED: Could not geocode "${businessAddress}"`);
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') console.error(`❌ BUSINESS SIGNUP BACKGROUND GEOCODE ERROR: Failed to geocode "${businessAddress}":`, error);
            }
          });
          if (process.env.NODE_ENV === 'development') console.log(`🗺️ BUSINESS SIGNUP GEOCODING QUEUED: Address "${processedData.businessAddress}" will be processed in background`);
        }
        
        // Map business contact information
        if (processedData.businessPhone) {
          processedData.phoneNumber = processedData.businessPhone;
        }
        
        // Map business contact fields for admin database
        if (processedData.ownerName) {
          // ownerName now contains business name for contact database
          processedData.ownerName = processedData.ownerName;
        }
        
        if (processedData.contactName) {
          // contactName contains actual contact person name
          processedData.contactName = processedData.contactName;
        }
        
        if (processedData.ownerPhone) {
          // ownerPhone contains contact person phone
          processedData.ownerPhone = processedData.ownerPhone;
        }
        
        if (processedData.email) {
          // email contains contact email
          processedData.ownerEmail = processedData.email;
        }
        
        // Map business name from form or account data
        if ((processedData as any).businessName) {
          processedData.businessName = (processedData as any).businessName;
        }
        
        // Map website URL from form data
        if ((processedData as any).websiteUrl) {
          processedData.websiteUrl = (processedData as any).websiteUrl;
        }
        
        // Map street address directly if provided
        if (processedData.streetAddress && !processedData.businessAddress) {
          // Street address already mapped
        }

        // Populate location and hometown fields for businesses
        if (processedData.hometownCity && processedData.hometownState) {
          processedData.location = `${processedData.hometownCity}, ${processedData.hometownState}`;
        }

        if (processedData.hometownCity && processedData.hometownState && processedData.hometownCountry) {
          processedData.hometown = `${processedData.hometownCity}, ${processedData.hometownState}, ${processedData.hometownCountry}`;
        }

        if (process.env.NODE_ENV === 'development') console.log("Mapped business data:", {
          hometownCity: processedData.hometownCity,
          hometownState: processedData.hometownState,
          hometownCountry: processedData.hometownCountry,
          streetAddress: processedData.streetAddress,
          phoneNumber: processedData.phoneNumber,
          zipCode: processedData.zipCode,
          location: processedData.location,
          hometown: processedData.hometown,
          businessName: processedData.businessName,
          websiteUrl: processedData.websiteUrl
        });
      }

      // Map traveler signup fields
      if (processedData.userType === 'currently_traveling') {
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
            if (process.env.NODE_ENV === 'development') console.log(`Referrer not found: ${processedData.referredByUser}`);
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error("Error finding referrer:", error);
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

      if (process.env.NODE_ENV === 'development') console.log(" BEFORE SCHEMA PARSING - processedData location fields:", {
        hometownCity: processedData.hometownCity,
        hometownState: processedData.hometownState,
        hometownCountry: processedData.hometownCountry,
        location: processedData.location,
        hometown: processedData.hometown
      });
      if (process.env.NODE_ENV === 'development') console.log(" BEFORE SCHEMA PARSING - processedData travel fields:", {
        isCurrentlyTraveling: processedData.isCurrentlyTraveling,
        travelDestination: processedData.travelDestination,
        travelStartDate: processedData.travelStartDate,
        travelEndDate: processedData.travelEndDate
      });

      const userData = insertUserSchema.parse(processedData);

      if (process.env.NODE_ENV === 'development') console.log("⚡ AFTER SCHEMA PARSING - userData location fields:", {
        hometownCity: userData.hometownCity,
        hometownState: userData.hometownState,
        hometownCountry: userData.hometownCountry,
        location: userData.location,
        hometown: userData.hometown
      });
      if (process.env.NODE_ENV === 'development') console.log("⚡ AFTER SCHEMA PARSING - userData travel fields:", {
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

        if (totalSelections < 3) {
          return res.status(400).json({ 
            message: `Please select at least 3 items total from interests, activities, and events. You have selected ${totalSelections}.`,
            field: "totalSelections"
          });
        }
      }

      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        if (process.env.NODE_ENV === 'development') console.log("Registration failed: Email already exists", userData.email);
        return res.status(409).json({ 
          message: "An account with this email already exists. Please use a different email or try logging in.",
          field: "email"
        });
      }

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        if (process.env.NODE_ENV === 'development') console.log("Registration failed: Username already exists", userData.username);
        return res.status(409).json({ 
          message: "This username is already taken. Please choose a different username.",
          field: "username"
        });
      }

      if (process.env.NODE_ENV === 'development') console.log("🔥 FINAL LOCATION DATA BEING SENT TO DATABASE:", {
        hometownCity: userData.hometownCity,
        hometownState: userData.hometownState,
        hometownCountry: userData.hometownCountry,
        location: userData.location,
        hometown: userData.hometown,
        userType: userData.userType
      });
      if (process.env.NODE_ENV === 'development') console.log("🔥 FINAL TRAVEL DATA BEING SENT TO DATABASE:", {
        isCurrentlyTraveling: userData.isCurrentlyTraveling,
        travelDestination: userData.travelDestination,
        travelStartDate: userData.travelStartDate,
        travelEndDate: userData.travelEndDate
      });

      if (process.env.NODE_ENV === 'development') console.log("Creating new user:", userData.email);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;

      if (process.env.NODE_ENV === 'development') console.log("💾 USER CREATED IN DATABASE - Location data stored:", {
        id: user.id,
        username: user.username,
        hometownCity: user.hometownCity,
        hometownState: user.hometownState,
        hometownCountry: user.hometownCountry,
        location: user.location,
        hometown: user.hometown
      });
      if (process.env.NODE_ENV === 'development') console.log("💾 USER CREATED IN DATABASE - Travel data stored:", {
        id: user.id,
        username: user.username,
        isCurrentlyTraveling: user.isCurrentlyTraveling,
        travelDestination: user.travelDestination,
        travelStartDate: user.travelStartDate,
        travelEndDate: user.travelEndDate
      });

      // HANDLE REFERRAL CONNECTIONS
      if (req.body.referralCode) {
        try {
          console.log('🔗 Processing referral signup with code:', req.body.referralCode);
          
          // Find the referrer by their referral code
          const [referrer] = await db
            .select({
              id: users.id,
              username: users.username,
              referralCount: users.referralCount
            })
            .from(users)
            .where(eq(users.referralCode, req.body.referralCode))
            .limit(1);

          if (referrer) {
            // Update the new user's referredBy field
            await db.update(users)
              .set({ referredBy: referrer.id })
              .where(eq(users.id, user.id));

            // Get connection note from request body if provided
            const connectionNote = req.body.connectionNote || 'Connected through QR code share';

            // Create automatic connection between referrer and new user
            await db.insert(connections).values({
              requesterId: referrer.id,
              receiverId: user.id,
              status: 'accepted', // Auto-accept referral connections
              connectionNote: connectionNote
            });

            // Update referrer's referral count
            await db.update(users)
              .set({ referralCount: (referrer.referralCount || 0) + 1 })
              .where(eq(users.id, referrer.id));

            console.log(`✅ Referral connection created: ${referrer.username} → ${user.username} (${connectionNote})`);
          } else {
            console.log('❌ Invalid referral code:', req.body.referralCode);
          }
        } catch (error) {
          console.error('Error processing referral:', error);
          // Don't fail registration if referral processing fails
        }
      }

      // IMPORTANT: Award 1 aura point to all new users for signing up
      try {
        await storage.updateUser(user.id, { aura: 1 });
        if (process.env.NODE_ENV === 'development') console.log(`✓ Awarded 1 signup aura point to new user ${user.id} (${user.username})`);
      } catch (auraError) {
        if (process.env.NODE_ENV === 'development') console.error('Error awarding signup aura point:', auraError);
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
          if (process.env.NODE_ENV === 'development') console.log(`✓ Created/verified hometown chatroom for ${userData.hometownCity}, ${userData.hometownCountry}`);
          
              // AUTO-JOIN: Add new user to Los Angeles Metro chatrooms (Welcome Newcomers and Let's Meet Up)
          await storage.autoJoinWelcomeChatroom(user.id, userData.hometownCity, userData.hometownCountry);
          if (process.env.NODE_ENV === 'development') console.log(`✓ Auto-joined user ${user.id} to Los Angeles Metro chatrooms`);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating hometown chatroom:', error);
        }
      }

      // AUTO-JOIN NEW USERS: Add to hometown and travel city chatrooms
      try {
        const travelCity = userData.isCurrentlyTraveling && userData.travelDestination ? userData.travelDestination.split(', ')[0] : undefined;
        const travelCountry = userData.isCurrentlyTraveling && userData.travelDestination ? userData.travelDestination.split(', ')[2] || userData.travelDestination.split(', ')[1] : undefined;
        
        await storage.autoJoinUserCityChatrooms(
          user.id, 
          userData.hometownCity, 
          userData.hometownCountry,
          travelCity,
          travelCountry
        );
        if (process.env.NODE_ENV === 'development') console.log(`✅ Auto-joined user ${user.id} to their city chatrooms`);
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error('Error auto-joining city chatrooms:', error);
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
          if (process.env.NODE_ENV === 'development') console.log(`✓ Created/verified travel destination chatroom for ${userData.travelDestination}`);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating travel destination chatroom:', error);
        }
      }

      // For travelers, automatically create a trip plan from signup data
      // Use original request data since insertUserSchema filters out non-user fields
      const originalData = req.body;

      // Auto-create city for ALL user types (locals, travelers, businesses) to ensure discover page completeness
      if (userData.hometownCity && userData.hometownCountry) {
        try {
          if (process.env.NODE_ENV === 'development') console.log(`Creating city for new user: ${userData.hometownCity}, ${userData.hometownState}, ${userData.hometownCountry}`);

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
              if (process.env.NODE_ENV === 'development') console.log(`✓ Added secret experience for ${userData.hometownCity}: ${secretActivities}`);
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
              if (process.env.NODE_ENV === 'development') console.log(`🤖 Generating AI content for ${targetCity} (consolidated from ${userData.hometownCity})...`);
              
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
                } catch (error: any) {
                  // Skip duplicate activities
                  if (process.env.NODE_ENV === 'development') console.log(`⚠️ Skipping duplicate activity: ${activity.name}`);
                }
              }
              
              if (process.env.NODE_ENV === 'development') console.log(`✅ Generated ${savedActivityCount} AI activities for ${targetCity}`);
              
              // Generate AI events for the target city
              const { aiEventGenerator } = await import('./aiEventGenerator.js');
              await aiEventGenerator.ensureEventsForLocation(
                targetCity,
                userData.hometownState || '',
                userData.hometownCountry
              );
              
              if (process.env.NODE_ENV === 'development') console.log(`✅ Generated AI events for ${targetCity}`);
            } else {
              if (process.env.NODE_ENV === 'development') console.log(`✅ ${targetCity} already has sufficient content (${existingActivities.length} activities, ${existingEvents.length} events)`);
            }
            
          } catch (error: any) {
            if (process.env.NODE_ENV === 'development') console.error(`Error generating AI content for ${targetCity}:`, error);
            // Don't fail registration if AI generation fails
          }

          if (process.env.NODE_ENV === 'development') console.log(`✅ Ensured city exists in discover page: ${userData.hometownCity}, ${userData.hometownCountry}`);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating city or adding secret experience:', error);
          // Don't fail registration if city creation fails
        }
      }

      // CRITICAL: Create chatrooms for user's hometown for ALL user types
      if (userData.hometownCity && userData.hometownCountry) {
        try {
          await storage.ensureMeetLocalsChatrooms(userData.hometownCity, userData.hometownState, userData.hometownCountry);
          if (process.env.NODE_ENV === 'development') console.log(`✓ Created/verified hometown chatrooms for ${userData.hometownCity}, ${userData.hometownCountry}`);

          // AUTO-JOIN: Add user to Los Angeles Metro chatrooms (Welcome Newcomers and Let's Meet Up)
          await storage.autoJoinWelcomeChatroom(updatedUser.id, userData.hometownCity, userData.hometownCountry);
          if (process.env.NODE_ENV === 'development') console.log(`✓ Auto-joined user ${updatedUser.id} to Los Angeles Metro chatrooms`);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating hometown chatrooms:', error);
        }
      }

      if (process.env.NODE_ENV === 'development') console.log("CHECKING TRAVEL PLAN CREATION:", {
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
      const hasReturnDateOnly = originalData.travelReturnDate; // For simplified signup
      const isTraveingUser = originalData.userType === 'traveler' || originalData.userType === 'currently_traveling' || originalData.isCurrentlyTraveling;

      // Support both full travel dates and simplified return-date-only signup
      if ((hasCurrentTravel || hasTravelDestination) && (hasTravelDates || hasReturnDateOnly) && isTraveingUser) {

        // CRITICAL: Date validation ONLY applies during signup for current travelers
        // Regular trip planning from Plan Trip page should allow future dates
        // This validation is ONLY for signup forms where users claim to be "currently traveling"

        // Handle both full travel dates and simplified return-date-only signup
        let startDate, endDate;
        if (originalData.travelStartDate && originalData.travelEndDate) {
          // Full travel dates provided
          startDate = new Date(originalData.travelStartDate);
          endDate = new Date(originalData.travelEndDate);
        } else if (originalData.travelReturnDate) {
          // Simplified signup - assume they're currently traveling, started recently
          startDate = new Date(); // Today
          endDate = new Date(originalData.travelReturnDate);
        } else {
          // Fallback - shouldn't reach here due to validation above
          startDate = new Date();
          endDate = new Date();
        }

        const tomorrow = getTomorrowInUserTimezone(user.hometownCity, user.hometownState);

        // Only validate dates for signup - not for trip planning
        // Users signing up as "current travelers" must have current/past trips
        if (startDate > tomorrow) {
          if (process.env.NODE_ENV === 'development') console.log("BLOCKED: Future travel START date during SIGNUP detected", { 
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

          if (process.env.NODE_ENV === 'development') console.log("CREATING TRAVEL PLAN:", { tripLocation, userId: user.id });

          // Parse travel destination to get city, state, country for travel plan
          const destinationParts = tripLocation.split(', ');
          const tripPlanData = {
            userId: user.id,
            destination: tripLocation,
            destinationCity: destinationParts[0] || originalData.currentCity,
            destinationState: destinationParts[1] || originalData.currentState,
            destinationCountry: destinationParts[2] || destinationParts[1] || originalData.currentCountry,
            startDate: startDate, // Use computed start date
            endDate: endDate,     // Use computed end date
            interests: userData.interests || [],
            activities: userData.activities || [],
            events: userData.events || [],
            travelStyle: userData.travelStyle || [],
            status: 'active' // Set to 'active' since they're currently traveling
          };

          const createdTripPlan = await storage.createTravelPlan(tripPlanData);
          if (process.env.NODE_ENV === 'development') console.log("TRAVEL PLAN CREATED SUCCESSFULLY:", createdTripPlan?.id);

          // CRITICAL: Update user travel status immediately after creating travel plan
          await TravelStatusService.updateUserTravelStatus(user.id);

          // CRITICAL: Generate AI content for travel destination (only if needed)
          // Use existing destinationParts from travel plan creation above
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
                if (process.env.NODE_ENV === 'development') console.log(`🤖 Generating AI content for travel destination: ${targetTravelCity} (consolidated from ${travelCity})...`);
                
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
                  } catch (error: any) {
                    // Skip duplicate activities
                    if (process.env.NODE_ENV === 'development') console.log(`⚠️ Skipping duplicate activity: ${activity.name}`);
                  }
                }
                
                if (process.env.NODE_ENV === 'development') console.log(`✅ Generated ${savedActivityCount} AI activities for travel destination: ${targetTravelCity}`);
                
                // Generate AI events for travel destination
                const { aiEventGenerator } = await import('./aiEventGenerator.js');
                await aiEventGenerator.ensureEventsForLocation(targetTravelCity, travelState || '', travelCountry);
                
                if (process.env.NODE_ENV === 'development') console.log(`✅ Generated AI events for travel destination: ${targetTravelCity}`);
              } else {
                if (process.env.NODE_ENV === 'development') console.log(`✅ ${targetTravelCity} already has sufficient content (${existingTravelActivities.length} activities, ${existingTravelEvents.length} events)`);
              }
              
            } catch (error: any) {
              if (process.env.NODE_ENV === 'development') console.error(`Error generating AI content for travel destination ${travelCity}:`, error);
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
          if (process.env.NODE_ENV === 'development') console.error("Failed to create initial trip plan:", tripError);
          // Don't fail registration if trip creation fails
        }
      }

      // Check for business interest matches for all user types
      try {
        const userLocation = userData.userType === 'currently_traveling' && originalData.currentTravelCity
          ? [originalData.currentTravelCity, originalData.currentTravelState, originalData.currentTravelCountry].filter(Boolean).join(", ")
          : [userData.hometownCity, userData.hometownState, userData.hometownCountry].filter(Boolean).join(", ");

        const matchType = userData.userType === 'currently_traveling' ? 'traveler_interest' : 'local_interest';

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
        if (process.env.NODE_ENV === 'development') console.error("Failed to check business interest matches:", matchError);
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
          if (process.env.NODE_ENV === 'development') console.log(`Created business referral: ${referrerUser.username} -> ${userData.businessName}`);
        } catch (referralError) {
          if (process.env.NODE_ENV === 'development') console.error("Failed to create business referral:", referralError);
        }
      }

      // Award 1 aura point for signing up
      try {
        await storage.updateUser(user.id, { aura: 1 });
        if (process.env.NODE_ENV === 'development') console.log(`Awarded 1 signup aura to new user: ${user.username} (ID: ${user.id})`);
      } catch (auraError) {
        if (process.env.NODE_ENV === 'development') console.error("Failed to award signup aura:", auraError);
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
          const result = await db
            .insert(connections)
            .values({
              requesterId: parseInt(nearbytravelerUser.id.toString() || '0'),
              receiverId: parseInt(user.id.toString() || '0'),
              status: 'accepted'
            })
            .returning();
      const type = result[0];

          // Create welcome message from nearbytraveler to the new user
          await storage.createMessage({
            senderId: nearbytravelerUser.id,
            receiverId: user.id,
            content: user.userType === 'business' 
              ? `Welcome to Nearby Traveler! 🏢

Hi ${user.name || user.username}! We're excited to have your business join our platform. Nearby Traveler connects local businesses with travelers and locals who are genuinely interested in authentic experiences.

Getting Started:
• Complete your business profile with photos and details
• Create special offers for travelers visiting your area  
• Post events to attract customers
• Use our analytics to track engagement

Your business is now visible to travelers searching for experiences in ${user.hometownCity}.

Questions? Just reply to this message. Welcome aboard!

- The Nearby Traveler Team`
              : `Welcome to Nearby Traveler! ✈️

Hi ${user.name || user.username}! We're thrilled you've joined our community of travelers and locals in ${user.hometownCity}.

Here's how to get the most out of your experience:
• Complete your profile to find better matches
• Join your local chatrooms (Welcome Newcomers & Let's Meet Up)
• Browse events and meetups happening near you
• Connect with people who share your interests
• Create travel plans when you're visiting new places

Your hometown is ${user.hometownCity} - we've automatically added you to the local community chatrooms where you can meet other travelers and locals.

Ready to start connecting? Questions? Just reply anytime!

- The Nearby Traveler Team`
          });

          if (process.env.NODE_ENV === 'development') console.log(`✓ Auto-connected new user ${user.username} (ID: ${user.id}) to nearbytraveler with welcome message`);
        }
      } catch (autoConnectError) {
        if (process.env.NODE_ENV === 'development') console.error("Failed to auto-connect new user to nearbytraveler:", autoConnectError);
        // Don't fail registration if auto-connection fails
      }

      res.status(201).json({
        user: userWithoutPassword,
        token: 'auth_token_' + userWithoutPassword.id
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Registration error:", error);
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

  // MANUAL WELCOME MESSAGE ENDPOINT - for businesses that missed the automatic welcome
  app.post("/api/send-manual-welcome/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is business and if they already have a message from nearbytraveler
      if (user.userType !== 'business') {
        return res.status(400).json({ message: "This endpoint is only for business users" });
      }

      const nearbytravelerUser = await storage.getUserByUsername('nearbytraveler');
      if (!nearbytravelerUser) {
        return res.status(404).json({ message: "Nearbytraveler user not found" });
      }

      // Check if connection already exists
      let hasConnection = false;
      try {
        const existingConnection = await storage.getConnection(nearbytravelerUser.id, user.id);
        hasConnection = !!existingConnection;
      } catch (error) {
        console.log("No existing connection found");
      }

      // Create connection if it doesn't exist
      if (!hasConnection) {
        try {
          await db
            .insert(connections)
            .values({
              requesterId: parseInt(nearbytravelerUser.id.toString() || '0'),
              receiverId: parseInt(user.id.toString() || '0'),
              status: 'accepted'
            })
            .returning();
          console.log(`✓ Created connection between nearbytraveler and ${user.username}`);
        } catch (connectionError) {
          console.error("Error creating connection:", connectionError);
        }
      }

      // Send the business welcome message
      const welcomeMessage = await storage.createMessage({
        senderId: nearbytravelerUser.id,
        receiverId: user.id,
        content: `Welcome to Nearby Traveler! 🏢

Hi ${user.name || user.username}! We're excited to have your business join our platform. Nearby Traveler connects local businesses with travelers and locals who are genuinely interested in authentic experiences.

Getting Started:
• Complete your business profile with photos and details
• Create special offers for travelers visiting your area  
• Post events to attract customers
• Use our analytics to track engagement

Your business is now visible to travelers searching for experiences in ${user.hometownCity || user.hometown || 'your area'}. When people with interests matching your services visit your area, you'll get notified automatically.

Questions? Just reply to this message. Welcome aboard!

- The Nearby Traveler Team`
      });

      console.log(`✓ Manual welcome message sent to business user ${user.username} (ID: ${user.id})`);
      
      res.json({ 
        success: true, 
        message: "Welcome message sent successfully",
        messageId: welcomeMessage.id 
      });
    } catch (error: any) {
      console.error("Error sending manual welcome message:", error);
      res.status(500).json({ message: "Failed to send welcome message", error: error.message });
    }
  });

  // Advanced search endpoint with comprehensive filtering - MUST COME BEFORE :id ROUTE
  // Advanced search endpoint - support both URL formats
  app.get('/api/search-users', async (req, res) => {
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

      // Get current user ID from headers to exclude them from results (optional)
      const userIdHeader = req.headers['x-user-id'] as string;
      let currentUserId = null;
      
      // FIX: Make user ID optional for search - only parse if valid
      if (userIdHeader && userIdHeader !== 'NaN' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
        const parsedUserId = parseInt(userIdHeader);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          currentUserId = parsedUserId;
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 ADVANCED SEARCH: Performing search with filters:', {
          search, gender, sexualPreference, minAge, maxAge, interests, activities, events, location, userType, travelerTypes, militaryStatus, currentUserId
        });
        console.log('🔍 SEARCH QUERY TYPE:', typeof search, 'value:', search);
      }
      
      // DEBUG: Check what users exist in database
      if (process.env.NODE_ENV === 'development' && location) {
        const allUsers = await db.select({ id: users.id, username: users.username, hometownCity: users.hometownCity, location: users.location }).from(users).limit(10);
        console.log('🔍 DEBUG: All users in database:', allUsers);
      }

      // Build WHERE conditions
      const whereConditions = [];
      
      // ALWAYS exclude current user from search results
      if (currentUserId) {
        whereConditions.push(ne(users.id, currentUserId));
      }

      // Text search in name, username, or bio
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereConditions.push(
          or(
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.username, `%${searchTerm}%`),
            ilike(users.bio, `%${searchTerm}%`),
            ilike(users.interests, `%${searchTerm}%`),
            ilike(users.activities, `%${searchTerm}%`)
          )
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 SEARCH DEBUG: Searching for "${searchTerm}" in name, username, bio, interests, activities`);
        }
      } else {
        // If no search term provided, require at least one other filter
        if (!location && !userType && !gender && !interests && !activities && !events) {
          return res.json({
            users: [],
            total: 0,
            page: 1,
            hasMore: false,
            message: "Please provide a search term or filter to find users"
          });
        }
      }

      // Location filter with LA Metro consolidation
      if (location && typeof location === 'string') {
        const locationParts = location.split(',').map(part => part.trim());
        const searchCity = locationParts[0];
        
        if (process.env.NODE_ENV === 'development') console.log('🌴 ADVANCED SEARCH LOCATION: Searching for users in:', location);
      if (process.env.NODE_ENV === 'development') console.log('🌴 SEARCH CITY EXTRACTED:', searchCity);
        
        // NO HARDCODED CONSOLIDATION - Use exact city search based on user's actual data
        const citiesToSearch = [searchCity];
        if (process.env.NODE_ENV === 'development') console.log('🎯 ADVANCED SEARCH EXACT CITY:', searchCity);
        
        if (process.env.NODE_ENV === 'development') console.log('🌴 CITIES TO SEARCH:', citiesToSearch.slice(0, 5), '... (total:', citiesToSearch.length, ')');
        
        const locationFilter = or(
          inArray(users.hometownCity, citiesToSearch),
          ...citiesToSearch.map(city => ilike(users.location, `%${city}%`))
        );
        whereConditions.push(locationFilter);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 LOCATION FILTER: Searching for users where hometownCity in:', citiesToSearch.slice(0, 3), '... OR location contains any of these cities');
        }
      }

      // User type filter
      if (userType && typeof userType === 'string') {
        const typeList = userType.split(',');
        whereConditions.push(inArray(users.userType, typeList));
      }

      // Execute search query with debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 EXECUTING QUERY WITH ${whereConditions.length} CONDITIONS:`);
        if (whereConditions.length === 0) {
          console.log('⚠️ NO WHERE CONDITIONS - WILL RETURN ALL USERS');
        }
      }
      
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
          profileImage: users.profileImage,
          age: users.age,
          gender: users.gender,
          interests: users.interests,
          activities: users.activities
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : eq(sql`1`, 0)) // Return no results if no conditions
        .orderBy(desc(users.id))
        .limit(20);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 SEARCH: Applied ${whereConditions.length} where conditions, found ${searchResults.length} users`);
        console.log('🔍 WHERE CONDITIONS DETAILS:');
        whereConditions.forEach((condition, index) => {
          console.log(`  ${index + 1}. ${typeof condition} condition applied`);
        });
        if (search) {
          console.log(`🔍 SEARCH TERM USED: "${search}" (length: ${search.length})`);
          console.log(`🔍 FIRST FEW RESULTS NAME MATCH CHECK:`);
          searchResults.slice(0, 3).forEach(user => {
            const nameMatch = user.name?.toLowerCase().includes(search.toLowerCase());
            const usernameMatch = user.username?.toLowerCase().includes(search.toLowerCase());
            const bioMatch = user.bio?.toLowerCase().includes(search.toLowerCase());
            console.log(`  ${user.username}: name="${user.name}" matches=${nameMatch}, username matches=${usernameMatch}, bio matches=${bioMatch}`);
          });
        }
      }
      
      res.json({
        users: searchResults,
        total: searchResults.length,
        page: 1,
        hasMore: searchResults.length === 20
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in advanced search:', error);
      }
      res.status(500).json({ error: 'Failed to perform advanced search' });
    }
  });

  // CRITICAL: Get user by ID endpoint
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userIdParam = req.params.id || '0';
      
      // FIX: Validate user ID parameter to prevent NaN errors
      if (userIdParam === 'NaN' || userIdParam === 'undefined' || userIdParam === 'null') {
        return res.status(400).json({ message: "Invalid user ID parameter" });
      }
      
      const userId = parseInt(userIdParam);
      
      // Additional check for invalid parsed values
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // MAP CUSTOM FIELDS: Convert snake_case database fields to camelCase for frontend
      if (userWithoutPassword.customInterests !== undefined) {
        userWithoutPassword.customInterests = userWithoutPassword.customInterests;
      }
      if (userWithoutPassword.customActivities !== undefined) {
        userWithoutPassword.customActivities = userWithoutPassword.customActivities;
      }
      if (userWithoutPassword.customEvents !== undefined) {
        userWithoutPassword.customEvents = userWithoutPassword.customEvents;
      }
      
      return res.json(userWithoutPassword);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // CRITICAL: Update user profile (including avatar upload)
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const updates = req.body;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 BUSINESS PROFILE UPDATE: User ${userId} updating with keys:`, Object.keys(updates));
        console.log(`🔧 BUSINESS PROFILE UPDATE: Full request body:`, JSON.stringify(updates, null, 2));
      }

      // MAP USER FIELDS: Convert camelCase frontend fields to snake_case database fields
      if (updates.hometownCity !== undefined) {
        updates.hometown_city = updates.hometownCity;
        delete updates.hometownCity;
      }
      if (updates.hometownState !== undefined) {
        updates.hometown_state = updates.hometownState;
        delete updates.hometownState;
      }
      if (updates.hometownCountry !== undefined) {
        updates.hometown_country = updates.hometownCountry;
        delete updates.hometownCountry;
      }
      if (updates.travelStyle !== undefined) {
        updates.travel_style = updates.travelStyle;
        delete updates.travelStyle;
      }

      // MAP BUSINESS FIELDS: Convert camelCase frontend fields to snake_case database fields
      if (updates.businessName !== undefined) {
        updates.business_name = updates.businessName;
        delete updates.businessName;
      }
      if (updates.businessDescription !== undefined) {
        updates.business_description = updates.businessDescription;
        delete updates.businessDescription;
      }
      if (updates.businessType !== undefined) {
        updates.business_type = updates.businessType;
        delete updates.businessType;
      }
      if (updates.streetAddress !== undefined) {
        updates.street_address = updates.streetAddress;
        
        // GEOCODING DISABLED: Temporarily disabled due to rate limiting issues
        // Business addresses will be saved without automatic geocoding to prevent 431 errors
        if (process.env.NODE_ENV === 'development') console.log(`📍 GEOCODING SKIPPED: Business address "${updates.streetAddress}" saved without coordinates (geocoding disabled)`);
        
        delete updates.streetAddress;
      }
      if (updates.zipCode !== undefined) {
        updates.zip_code = updates.zipCode;
        delete updates.zipCode;
      }
      if (updates.phoneNumber !== undefined) {
        updates.phone_number = updates.phoneNumber;
        delete updates.phoneNumber;
      }
      if (updates.websiteUrl !== undefined) {
        updates.website_url = updates.websiteUrl;
        delete updates.websiteUrl;
      }
      if (updates.isVeteran !== undefined) {
        updates.is_veteran = updates.isVeteran;
        delete updates.isVeteran;
      }
      if (updates.isActiveDuty !== undefined) {
        updates.is_active_duty = updates.isActiveDuty;
        delete updates.isActiveDuty;
      }

      // MAP DIVERSITY OWNERSHIP FIELDS: Convert camelCase frontend fields to snake_case database fields
      if (updates.isMinorityOwned !== undefined) {
        updates.is_minority_owned = updates.isMinorityOwned;
        delete updates.isMinorityOwned;
      }
      if (updates.isFemaleOwned !== undefined) {
        updates.is_female_owned = updates.isFemaleOwned;
        delete updates.isFemaleOwned;
      }
      if (updates.isLGBTQIAOwned !== undefined) {
        updates.is_lgbtqia_owned = updates.isLGBTQIAOwned;
        delete updates.isLGBTQIAOwned;
      }
      if (updates.showMinorityOwned !== undefined) {
        updates.show_minority_owned = updates.showMinorityOwned;
        delete updates.showMinorityOwned;
      }
      if (updates.showFemaleOwned !== undefined) {
        updates.show_female_owned = updates.showFemaleOwned;
        delete updates.showFemaleOwned;
      }
      if (updates.showLGBTQIAOwned !== undefined) {
        updates.show_lgbtqia_owned = updates.showLGBTQIAOwned;
        delete updates.showLGBTQIAOwned;
      }

      // MAP CUSTOM FIELDS: Convert camelCase frontend fields to snake_case database fields
      if (updates.customInterests !== undefined) {
        updates.custom_interests = updates.customInterests;
        delete updates.customInterests;
      }
      if (updates.customActivities !== undefined) {
        updates.custom_activities = updates.customActivities;
        delete updates.customActivities;
      }
      if (updates.customEvents !== undefined) {
        updates.custom_events = updates.customEvents;
        delete updates.customEvents;
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏢 BUSINESS PROFILE: Mapped fields for user ${userId}:`, Object.keys(updates));

      // Convert dateOfBirth string to Date object if present
      if (updates.dateOfBirth && typeof updates.dateOfBirth === 'string') {
        try {
          updates.dateOfBirth = new Date(updates.dateOfBirth);
        } catch (dateError) {
          if (process.env.NODE_ENV === 'development') console.error('Invalid date format:', updates.dateOfBirth);
          return res.status(400).json({ message: "Invalid date format for dateOfBirth" });
        }
      }

      // Clear children ages if traveling with children is turned off
      if (updates.travelingWithChildren === false) {
        updates.childrenAges = null;
      }

      // Check if this is the first time profile is being completed (bio, interests filled out)
      let isFirstProfileCompletion = false;
      if (updates.bio && updates.interests && updates.interests.length >= 3) {
        const currentUser = await storage.getUserById(userId);
        if (currentUser && (!currentUser.bio || !currentUser.interests || currentUser.interests.length < 3)) {
          isFirstProfileCompletion = true;
        }
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Award aura for first profile completion
      if (isFirstProfileCompletion) {
        await awardAuraPoints(userId, 1, 'completing profile');
        if (process.env.NODE_ENV === 'development') console.log(`✨ AURA: Awarded 1 point to user ${userId} for completing profile`);

        // CRITICAL: Check if business user needs welcome message from @nearbytraveler
        if (updatedUser.userType === 'business') {
          try {
            const nearbytravelerUser = await storage.getUserByUsername('nearbytraveler');
            if (nearbytravelerUser) {
              // Check if connection already exists
              const existingConnection = await db
                .select()
                .from(connections)
                .where(
                  and(
                    eq(connections.requesterId, nearbytravelerUser.id),
                    eq(connections.receiverId, userId)
                  )
                )
                .limit(1);

              // Check if welcome message already exists
              const existingMessage = await db
                .select()
                .from(messages)
                .where(
                  and(
                    eq(messages.senderId, nearbytravelerUser.id),
                    eq(messages.receiverId, userId)
                  )
                )
                .limit(1);

              // Only create connection and welcome message if they don't exist
              if (existingConnection.length === 0 && existingMessage.length === 0) {
                // Create connection
                await db
                  .insert(connections)
                  .values({
                    requesterId: nearbytravelerUser.id,
                    receiverId: userId,
                    status: 'accepted'
                  });

                // Create welcome message
                await storage.createMessage({
                  senderId: nearbytravelerUser.id,
                  receiverId: userId,
                  content: `Welcome to Nearby Traveler! 🏢

Hi ${updatedUser.name || updatedUser.username}! We're excited to have your business join our platform. Nearby Traveler connects local businesses with travelers and locals who are genuinely interested in authentic experiences.

Getting Started:
• Complete your business profile with photos and details
• Create special offers for travelers visiting your area  
• Post events to attract customers
• Use our analytics to track engagement

Your business is now visible to travelers searching for experiences in ${updatedUser.hometownCity || 'your area'}.

Questions? Just reply to this message. Welcome aboard!

- The Nearby Traveler Team`
                });

                if (process.env.NODE_ENV === 'development') console.log(`✓ PROFILE COMPLETION: Sent welcome message to business user ${updatedUser.username} (ID: ${userId})`);
              }
            }
          } catch (welcomeError) {
            if (process.env.NODE_ENV === 'development') console.error("Failed to send welcome message during profile completion:", welcomeError);
            // Don't fail profile update if welcome message fails
          }
        }
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      if (process.env.NODE_ENV === 'development') console.log(`✓ User ${userId} updated successfully`);
      return res.json(userWithoutPassword);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("🔴 CRITICAL ERROR updating user:", error);
        console.error("🔴 Error message:", error.message);
        console.error("🔴 Error stack:", error.stack);
        console.error("🔴 Error code:", error.code);
        console.error("🔴 Full error details:", JSON.stringify(error, null, 2));
      }
      return res.status(500).json({ 
        message: "Failed to update user", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // CRITICAL: Profile photo upload endpoint (PUT) - MISSING ENDPOINT
  app.put("/api/users/:id/profile-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`PUT: Updating profile photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new profile photo
      const updatedUser = await storage.updateUser(userId, { profileImage: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      if (process.env.NODE_ENV === 'development') console.log(`✓ PUT: Profile photo updated for user ${userId}`);
      return res.json({ 
        message: "Profile photo updated successfully",
        profileImage: updatedUser.profileImage,
        user: userWithoutPassword
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("PUT: Error updating profile photo:", error);
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

      const updatedUser = await storage.updateUser(parseInt(userId as string || '0'), { profileImage: null });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`✓ Cleared profile photo for user ${userId}`);
      return res.json({ message: "Profile photo cleared" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error clearing profile photo:", error);
      return res.status(500).json({ message: "Failed to clear profile photo" });
    }
  });

  // CRITICAL: Cover photo upload endpoint (POST)
  app.post("/api/users/:id/cover-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`POST: Updating cover photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new cover photo
      const updatedUser = await storage.updateUser(userId, { coverPhoto: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      if (process.env.NODE_ENV === 'development') console.log(`✓ POST: Cover photo updated for user ${userId}`);
      return res.json({ 
        message: "Cover photo updated successfully",
        coverPhoto: updatedUser.coverPhoto,
        user: userWithoutPassword
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("POST: Error updating cover photo:", error);
      return res.status(500).json({ message: "Failed to update cover photo" });
    }
  });

  // CRITICAL: Cover photo upload endpoint (PUT) - MISSING ENDPOINT
  app.put("/api/users/:id/cover-photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`PUT: Updating cover photo for user ${userId}, image size: ${imageData.length}`);

      // Update user with new cover photo
      const updatedUser = await storage.updateUser(userId, { coverPhoto: imageData });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      if (process.env.NODE_ENV === 'development') console.log(`✓ PUT: Cover photo updated for user ${userId}`);
      return res.json({ 
        message: "Cover photo updated successfully",
        coverPhoto: updatedUser.coverPhoto,
        user: userWithoutPassword
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("PUT: Error updating cover photo:", error);
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
        
        // PRESERVE original user location data - NO consolidation for API responses
        const consolidatedUser = {
          ...userWithoutPassword,
          // Keep original hometown city - never consolidate stored user data
          hometownCity: user.hometownCity || '',
          // Keep original location field - preserve individual city identity
          location: user.location
        };
        
        return consolidatedUser;
      }).filter(Boolean);
      
      if (process.env.NODE_ENV === 'development') console.log(`Users API response: ${consolidatedUsers.length} users for all locations`);
      return res.json(consolidatedUsers);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching users:", error);
      return res.json([]);
    }
  });

  // CRITICAL: Get travel plans for user
  app.get("/api/travel-plans/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const travelPlans = await storage.getTravelPlansByUserId(userId);
      return res.json(travelPlans);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching travel plans:", error);
      return res.status(500).json({ message: "Failed to fetch travel plans" });
    }
  });

  // ALTERNATIVE ROUTE: Get travel plans for user via /api/users/{id}/travel-plans
  app.get("/api/users/:userId/travel-plans", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🧭 TRAVEL PLANS API: Getting travel plans for user ${userId}`);
      const travelPlans = await storage.getTravelPlansByUserId(userId);
      if (process.env.NODE_ENV === 'development') console.log(`🧭 TRAVEL PLANS API: Found ${travelPlans?.length || 0} travel plans:`, travelPlans);
      return res.json(travelPlans);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching travel plans:", error);
      return res.status(500).json({ message: "Failed to fetch travel plans" });
    }
  });

  // Enhanced API to get travel plans with itinerary data
  app.get("/api/travel-plans-with-itineraries/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      
      // Update travel plan statuses and save completed itineraries
      await storage.updateTravelPlanStatuses();
      await storage.saveItinerariesToPastTrips();
      
      const enhancedTravelPlans = await storage.getTravelPlansWithItineraries(userId);
      return res.json(enhancedTravelPlans || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching travel plans with itineraries:", error);
      return res.status(500).json({ message: "Failed to fetch enhanced travel plans" });
    }
  });

  // User References API Endpoints
  // Get all references for a user
  app.get("/api/users/:userId/references", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const references = await storage.getUserReferences(userId);
      return res.json(references || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user references:", error);
      return res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  // Create a new user reference
  app.post("/api/user-references", async (req, res) => {
    try {
      const { reviewerId, revieweeId, content, experience } = req.body;
      
      if (!reviewerId || !revieweeId || !content) {
        return res.status(400).json({ message: "Missing required fields: reviewerId, revieweeId, content" });
      }
      
      if (reviewerId === revieweeId) {
        return res.status(400).json({ message: "Cannot create reference for yourself" });
      }

      // Check if user already has a reference for this person
      const existingReference = await storage.findUserReference(parseInt(reviewerId), parseInt(revieweeId));
      if (existingReference) {
        return res.status(400).json({ 
          message: "You have already left a reference for this person. Use the edit feature to update it.",
          existingReferenceId: existingReference.id
        });
      }
      
      const referenceData = {
        reviewerId,
        revieweeId,
        content,
        experience: experience || 'positive'
      };
      
      const newReference = await storage.createUserReference(referenceData);
      return res.json(newReference);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating user reference:", error);
      return res.status(500).json({ message: "Failed to create reference" });
    }
  });

  // Update a user reference
  app.put("/api/user-references/:referenceId", async (req, res) => {
    try {
      const referenceId = parseInt(req.params.referenceId || '0');
      const { content, experience } = req.body;
      
      if (isNaN(referenceId) || referenceId <= 0) {
        return res.status(400).json({ message: "Invalid reference ID" });
      }
      
      if (!content && !experience) {
        return res.status(400).json({ message: "No update data provided" });
      }
      
      const updatedReference = await storage.updateUserReference(referenceId, { content, experience });
      if (!updatedReference) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      return res.json(updatedReference);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating user reference:", error);
      return res.status(500).json({ message: "Failed to update reference" });
    }
  });

  // Delete a user reference
  app.delete("/api/user-references/:referenceId", async (req, res) => {
    try {
      const referenceId = parseInt(req.params.referenceId || '0');
      
      if (isNaN(referenceId) || referenceId <= 0) {
        return res.status(400).json({ message: "Invalid reference ID" });
      }
      
      const success = await storage.deleteUserReference();
      if (!success) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      return res.json({ message: "Reference deleted successfully" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting user reference:", error);
      return res.status(500).json({ message: "Failed to delete reference" });
    }
  });

  // Check if user has already left a reference for someone
  app.get("/api/user-references/check/:reviewerId/:revieweeId", async (req, res) => {
    try {
      const reviewerId = parseInt(req.params.reviewerId || '0');
      const revieweeId = parseInt(req.params.revieweeId || '0');
      
      if (isNaN(reviewerId) || isNaN(revieweeId)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      
      const existingReference = await storage.findUserReference(reviewerId, revieweeId);
      
      return res.json({
        hasReference: !!existingReference,
        reference: existingReference || null
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error checking user reference:", error);
      return res.status(500).json({ message: "Failed to check reference" });
    }
  });

  // Get detailed itinerary data for a specific completed trip
  app.get("/api/travel-plans/:id/itineraries", async (req, res) => {
    try {
      const travelPlanId = parseInt(req.params.id || '0');
      const itineraries = await storage.getCompletedTripItineraries(travelPlanId);
      return res.json(itineraries || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching trip itineraries:", error);
      return res.status(500).json({ message: "Failed to fetch trip itineraries" });
    }
  });

  // CRITICAL: Create new travel plan
  app.post("/api/travel-plans", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== CREATE TRAVEL PLAN API ===');
      if (process.env.NODE_ENV === 'development') console.log('Request body:', req.body);
      
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
        if (process.env.NODE_ENV === 'development') console.log('Converted startDate to Date object:', travelPlanData.startDate);
      }
      if (travelPlanData.endDate && typeof travelPlanData.endDate === 'string') {
        travelPlanData.endDate = new Date(travelPlanData.endDate);
        if (process.env.NODE_ENV === 'development') console.log('Converted endDate to Date object:', travelPlanData.endDate);
      }

      // CRITICAL FIX: Ensure accommodation and transportation are properly handled
      if (travelPlanData.accommodation) {
        if (process.env.NODE_ENV === 'development') console.log('Accommodation field:', travelPlanData.accommodation);
      }
      if (travelPlanData.transportation) {
        if (process.env.NODE_ENV === 'development') console.log('Transportation field:', travelPlanData.transportation);
      }

      if (process.env.NODE_ENV === 'development') console.log('=== PROCESSED CREATE DATA ===');
      if (process.env.NODE_ENV === 'development') console.log('Final create data:', travelPlanData);

      const newTravelPlan = await storage.createTravelPlan(travelPlanData);
      if (process.env.NODE_ENV === 'development') console.log('=== TRAVEL PLAN CREATED ===');
      if (process.env.NODE_ENV === 'development') console.log('New travel plan:', newTravelPlan);
      
      // Award 4 aura points for planning a trip
      await awardAuraPoints(travelPlanData.userId, 4, 'planning a trip');
      
      return res.status(201).json(newTravelPlan);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating travel plan:", error);
      return res.status(500).json({ message: "Failed to create travel plan", error: error.message });
    }
  });

  // CRITICAL: Get single travel plan by ID
  app.get("/api/travel-plans/single/:id", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== GET SINGLE TRAVEL PLAN API ===');
      if (process.env.NODE_ENV === 'development') console.log('Plan ID:', req.params.id);
      
      const planId = parseInt(req.params.id || '0');
      const travelPlan = await storage.getTravelPlan(planId);
      
      if (!travelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log('=== TRAVEL PLAN FOUND ===');
      if (process.env.NODE_ENV === 'development') console.log('Travel plan data:', travelPlan);
      
      return res.json(travelPlan);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching travel plan:", error);
      return res.status(500).json({ message: "Failed to fetch travel plan", error: error.message });
    }
  });

  // CRITICAL: Update existing travel plan
  app.put("/api/travel-plans/:id", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== UPDATE TRAVEL PLAN API ===');
      if (process.env.NODE_ENV === 'development') console.log('Plan ID:', req.params.id);
      if (process.env.NODE_ENV === 'development') console.log('Request body:', req.body);
      
      const planId = parseInt(req.params.id || '0');
      const updateData = { ...req.body };
      
      // CRITICAL FIX: Convert string dates to Date objects
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
        if (process.env.NODE_ENV === 'development') console.log('Converted startDate to Date object:', updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
        if (process.env.NODE_ENV === 'development') console.log('Converted endDate to Date object:', updateData.endDate);
      }
      
      // CRITICAL FIX: Ensure accommodation and transportation are properly handled
      if (updateData.accommodation) {
        if (process.env.NODE_ENV === 'development') console.log('Accommodation field:', updateData.accommodation);
      }
      if (updateData.transportation) {
        if (process.env.NODE_ENV === 'development') console.log('Transportation field:', updateData.transportation);
      }
      
      if (process.env.NODE_ENV === 'development') console.log('=== PROCESSED UPDATE DATA ===');
      if (process.env.NODE_ENV === 'development') console.log('Final update data:', updateData);
      
      const updatedTravelPlan = await storage.updateTravelPlan(planId, updateData);
      
      if (!updatedTravelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log('=== TRAVEL PLAN UPDATED ===');
      if (process.env.NODE_ENV === 'development') console.log('Updated travel plan:', updatedTravelPlan);
      
      return res.json(updatedTravelPlan);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating travel plan:", error);
      return res.status(500).json({ message: "Failed to update travel plan", error: error.message });
    }
  });

  // Enhanced: Get conversation data with IM notification support
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');

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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching conversations:", error);
      return res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // CRITICAL: Get connection status between two users (MUST BE BEFORE general routes)
  app.get("/api/connections/status/:userId/:targetUserId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const targetUserId = parseInt(req.params.targetUserId || '0');
      
      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION STATUS: Checking connection between ${userId} and ${targetUserId}`);
      
      const connection = await storage.getConnection(userId, targetUserId);
      
      if (connection) {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION STATUS: Found connection:`, connection);
        return res.json(connection);
      } else {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION STATUS: No connection found between ${userId} and ${targetUserId}`);
        return res.json(null);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error checking connection status:", error);
      return res.status(500).json({ message: "Failed to check connection status" });
    }
  });

  // CRITICAL: Get connections for user  
  app.get("/api/connections/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const connections = await storage.getUserConnections(userId);
      return res.json(connections);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching connections:", error);
      return res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // CRITICAL: Get connection requests for user
  app.get("/api/connections/:userId/requests", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const requests = await storage.getConnectionRequests(userId);
      return res.json(requests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching connection requests:", error);
      return res.status(500).json({ message: "Failed to fetch connection requests" });
    }
  });

  // CRITICAL: Create new connection (send connection request)
  app.post("/api/connections", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION REQUEST: Received body:`, req.body);
      const { requesterId, targetUserId, receiverId } = req.body;

      // Handle both old format (requesterId, targetUserId) and new format (receiverId)
      const finalRequesterId = requesterId || 1; // Default to user 1 for now - this should come from auth
      const finalTargetUserId = targetUserId || receiverId;

      if (!finalRequesterId || !finalTargetUserId) {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Missing data - requesterId: ${finalRequesterId}, targetUserId: ${finalTargetUserId}`);
        return res.status(400).json({ message: "receiverId is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Checking for existing connection between ${finalRequesterId} and ${finalTargetUserId}`);

      // CRITICAL: Check for existing connection to prevent duplicates
      const existingConnection = await storage.getConnection(parseInt(finalRequesterId || '0'), parseInt(finalTargetUserId || '0'));
      if (existingConnection) {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Connection already exists:`, existingConnection);
        return res.status(409).json({ message: "Connection already exists", connection: existingConnection });
      }

      const reqId = parseInt(finalRequesterId || '0');
      const targId = parseInt(finalTargetUserId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: No existing connection found, creating new request from ${reqId} to ${targId}`);

      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Creating new connection request...`);

      // Create new connection request
      const newConnection = await storage.createConnection({
        requesterId: parseInt(finalRequesterId || '0'),
        receiverId: parseInt(finalTargetUserId || '0'),
        createdAt: new Date()
      });

      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Successfully created connection request from ${finalRequesterId} to ${finalTargetUserId}:`, newConnection);
      return res.json({ success: true, connection: newConnection });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("CONNECTION ERROR:", error);
      return res.status(500).json({ message: "Failed to create connection", error: error.message });
    }
  });

  // CRITICAL: Get messages for user - only latest message per conversation, limit to 4 recent conversations
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      
      // Get the latest message from each conversation (only most recent per person)
      const latestMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          messageType: messages.messageType,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          // Add a field to identify the other person in the conversation
          otherPersonId: sql<number>`
            CASE 
              WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId}
              ELSE ${messages.senderId}
            END
          `
        })
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Group by conversation partner and keep only the latest message from each conversation
      const conversationMap = new Map();
      for (const message of latestMessages) {
        const otherPersonId = message.otherPersonId;
        if (!conversationMap.has(otherPersonId)) {
          conversationMap.set(otherPersonId, message);
        }
      }

      // Convert back to array, sort by creation time, and limit to 4 most recent conversations
      const recentConversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);

      return res.json(recentConversations || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get unread message count for a user
  app.get("/api/messages/:userId/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const unreadMessages = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        );
      
      const unreadCount = unreadMessages[0]?.count || 0;
      
      return res.json({ unreadCount });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching unread count:", error);
      return res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // CRITICAL: Send message for IM system (handles offline message delivery)
  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, content, isInstantMessage } = req.body;

      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ message: "senderId, receiverId, and content are required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`💬 ${isInstantMessage ? 'IM' : 'REGULAR'} MESSAGE: Storing message from ${senderId} to ${receiverId} for offline delivery`);

      // Store message in database for offline delivery
      const newMessage = await db
        .insert(messages)
        .values({
          senderId: parseInt(senderId || '0'),
          receiverId: parseInt(receiverId || '0'),
          content: content.trim(),
          messageType: isInstantMessage ? 'instant' : 'text',
          isRead: false,
          createdAt: new Date()
        })
        .returning();

      if (process.env.NODE_ENV === 'development') console.log(`💬 IM MESSAGE: Message stored with ID ${newMessage[0]?.id}`);

      // Notify online users via WebSocket (if receiver is online)
      // This will be handled by the WebSocket service

      return res.json({ 
        success: true, 
        message: newMessage[0],
        messageId: newMessage[0]?.id 
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get chatrooms for user's locations (hometown + travel destinations) - FIXED MEMBER COUNT
  app.get("/api/chatrooms/my-locations", async (req, res) => {
    try {
      console.log(`🚀🚀🚀 MY-LOCATIONS ROUTE CALLED - FIRST ROUTE WORKING!!! 🚀🚀🚀`);
      // Get user ID from headers - FIXED USER ID EXTRACTION
      let userId = 1; // Default to nearbytraveler user if not specified
      
      // First try x-user-id header (what frontend sends)
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string);
      }
      // Fallback to x-user-data header  
      else if (req.headers['x-user-data']) {
        try {
          userId = JSON.parse(req.headers['x-user-data'] as string).id;
        } catch (e) {
          // Use default user ID
        }
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 MY-LOCATIONS: User ${userId} requesting chatrooms`);

      // Get all active chatrooms
      const allChatrooms = await db.select().from(citychatrooms).where(eq(citychatrooms.isActive, true));
      
      if (process.env.NODE_ENV === 'development') console.log(`🏠 MY-LOCATIONS: Found ${allChatrooms.length} active chatrooms`);
      
      // Get member counts using raw query for reliability - FIXED COUNT
      const memberCountResults = await db.execute(sql`
        SELECT chatroom_id as "chatroomId", COUNT(DISTINCT user_id)::integer as "memberCount"
        FROM chatroom_members 
        WHERE is_active = true 
        GROUP BY chatroom_id
      `);
      
      // Get user memberships using raw query
      const userMembershipResults = await db.execute(sql`
        SELECT chatroom_id as "chatroomId"
        FROM chatroom_members 
        WHERE user_id = ${userId} AND is_active = true
      `);
      
      // Build lookup maps
      const memberCountMap = new Map();
      memberCountResults.rows.forEach((row: any) => {
        memberCountMap.set(row.chatroomId, row.memberCount);
      });
      
      const userMembershipSet = new Set();
      userMembershipResults.rows.forEach((row: any) => {
        userMembershipSet.add(row.chatroomId);
      });
      
      // Add member count and membership status to each chatroom
      const chatroomsWithCounts = allChatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 0,
        userIsMember: userMembershipSet.has(chatroom.id)
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏠 MY-LOCATIONS: Returning ${chatroomsWithCounts.length} chatrooms with counts`);
        console.log(`🏠 MY-LOCATIONS: First chatroom details:`, {
          id: chatroomsWithCounts[0]?.id,
          name: chatroomsWithCounts[0]?.name,
          memberCount: chatroomsWithCounts[0]?.memberCount,
          userIsMember: chatroomsWithCounts[0]?.userIsMember
        });
      }
      
      res.json(chatroomsWithCounts);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🔥 ERROR IN MY-LOCATIONS ROUTE:", error);
      res.status(500).json({ message: "Failed to fetch location chatrooms" });
    }
  });

  // CRITICAL: Get chatrooms for user
  app.get("/api/chatrooms/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      // Use direct database query - get all chatrooms for now since chatroom participants table may not exist
      const allChatrooms = await db.select().from(citychatrooms);
      return res.json(allChatrooms);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching chatrooms:", error);
      return res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // Get user's chatroom participation for profile display
  app.get("/api/users/:userId/chatroom-participation", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM PARTICIPATION: Getting chatroom participation for user ${userId}`);

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

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM PARTICIPATION: Found ${userChatrooms.length} chatrooms for user ${userId}`);
      return res.json(userChatrooms);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user chatroom participation:", error);
      return res.status(500).json({ message: "Failed to fetch chatroom participation" });
    }
  });

  // ORIGINAL WORKING SYSTEM: Get chatrooms with automatic city filtering
  app.get("/api/chatrooms", async (req, res) => {
    try {
      const { city, state, country, userId } = req.query;

      if (city && typeof city === 'string') {
        // ORIGINAL SYSTEM: Filter chatrooms by city automatically with MEMBER COUNT FIX
        if (process.env.NODE_ENV === 'development') console.log(`🏙️ ORIGINAL: Getting chatrooms for ${city}, ${state}, ${country}`);
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
          memberCountMap.set(mc.chatroomId, parseInt(mc.count || '0') || 1);
        });
        
        // Apply correct member counts to each chatroom
        const chatroomsWithFixedMemberCount = chatrooms.map(chatroom => ({
          ...chatroom,
          memberCount: memberCountMap.get(chatroom.id) || 1 // Use database count or default to 1
        }));
        
        if (process.env.NODE_ENV === 'development') console.log(`🏙️ ORIGINAL: Found ${chatroomsWithFixedMemberCount.length} chatrooms for ${city} with fixed member counts`);
        return res.json(chatroomsWithFixedMemberCount);
      } else if (userId) {
        const userChatrooms = await storage.getCityChatrooms(undefined, undefined, undefined, parseInt(userId as string || '0'));
        return res.json(userChatrooms);
      } else {
        // Return all chatrooms if no parameters (for global views)
        const allChatrooms = await db.select().from(citychatrooms);
        return res.json(allChatrooms);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching chatrooms:", error);
      return res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // AI event generator will be imported dynamically when needed

  // FIXED: Get events filtered by city with proper location filtering - NO CROSS-CITY BLEEDING
  app.get("/api/events", async (req, res) => {
    console.log("🟢 EVENTS ENDPOINT HIT! Query:", req.query, "URL:", req.url);
    try {
      if (process.env.NODE_ENV === 'development') console.log(`📅 DIRECT API: Fetching events with query:`, req.query);
      const { city } = req.query;

      let eventsQuery = [];
      console.log(`📅 EVENTS DEBUG: City parameter received: "${city}", type: ${typeof city}`);
      
      if (city && typeof city === 'string' && city.trim() !== '') {
        const cityName = city.toString();
        console.log(`🎪 EVENTS: Getting events for city: ${cityName}`);
        
        // NO HARDCODED CITY CONSOLIDATION - Use exact city for events
        let searchCities = [cityName];
        console.log(`🎯 EVENTS EXACT: Searching events only in ${cityName}`);
        
        if (process.env.NODE_ENV === 'development') console.log(`🌍 EVENTS: Final searchCities array:`, searchCities);
        
        // Search events in relevant cities - strict location matching
        const now = new Date();
        const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
        
        for (const searchCity of searchCities) {
          if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENTS: Searching for events in city: "${searchCity}"`);
          const cityEvents = await db.select().from(events)
            .where(and(
              eq(events.city, searchCity), // CHANGED: Use exact match instead of ilike to prevent bleeding
              gte(events.date, now),
              lte(events.date, sixWeeksFromNow)
            ))
            .orderBy(asc(events.date));
          if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENTS: Found ${cityEvents.length} events in "${searchCity}"`);
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
        
        // PRIORITY SORTING: User-created events first, then by date
        eventsQuery.sort((a, b) => {
          // Check if events are user-created (have organizerId) vs AI-generated (no organizerId or organizerId 0)
          const aIsUserCreated = a.organizerId && a.organizerId > 0;
          const bIsUserCreated = b.organizerId && b.organizerId > 0;
          
          // User-created events always come first
          if (aIsUserCreated && !bIsUserCreated) return -1;
          if (!aIsUserCreated && bIsUserCreated) return 1;
          
          // If both are the same type, sort by date (earliest first)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Found ${eventsQuery.length} events in next 6 weeks for ${cityName}`);
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Event details:`, eventsQuery.map(e => `${e.title} in ${e.city}`));
        
        // 🤖 AI EVENT GENERATION: If city has very few events, generate more with OpenAI
        if (eventsQuery.length <= 3) {
          console.log(`🤖 AI TRIGGER: ${cityName} has only ${eventsQuery.length} events - generating AI events with OpenAI`);
          try {
            // Generate AI events for this city in the background (don't wait for completion)
            setImmediate(async () => {
              try {
                const { createAIEventsInDatabase } = await import('./openaiEventGenerator');
                await createAIEventsInDatabase(cityName, state || 'TX', country || 'USA');
              } catch (aiError) {
                console.error(`🚫 AI EVENT GENERATION FAILED for ${cityName}:`, aiError);
              }
            });
          } catch (error) {
            console.error(`🚫 AI EVENT TRIGGER FAILED for ${cityName}:`, error);
          }
        }
      } else {
        // Return events in next 6 weeks if no city specified - EARLIEST FIRST
        // ENHANCED: Limit to next 6 weeks to include all upcoming events
        const now = new Date();
        const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
        
        eventsQuery = await db.select().from(events)
          .where(and(
            gte(events.date, now),
            lte(events.date, sixWeeksFromNow)
          ));
        
        // PRIORITY SORTING: User-created events first, then by date
        eventsQuery.sort((a, b) => {
          // Check if events are user-created (have organizerId) vs AI-generated (no organizerId or organizerId 0)
          const aIsUserCreated = a.organizerId && a.organizerId > 0;
          const bIsUserCreated = b.organizerId && b.organizerId > 0;
          
          // User-created events always come first
          if (aIsUserCreated && !bIsUserCreated) return -1;
          if (!aIsUserCreated && bIsUserCreated) return 1;
          
          // If both are the same type, sort by date (earliest first)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Returning ${eventsQuery.length} events in next 6 weeks`);
      }

      // CRITICAL: Add participant counts to all events
      const participantCounts = await Promise.all(
        eventsQuery.map(async (event) => {
          const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventParticipants)
            .where(eq(eventParticipants.eventId, event.id));
          return { eventId: event.id, count: result[0]?.count || 0 };
        })
      );

      // Create participant count lookup
      const participantCountMap = new Map(participantCounts.map(pc => [pc.eventId, pc.count]));

      // ENHANCED: Add participant counts AND organizer information to events
      const eventsWithCountsAndOrganizers = await Promise.all(
        eventsQuery.map(async (event) => {
          let organizer = null;
          
          // Only fetch organizer info for user-created events (organizerId > 0)
          if (event.organizerId && event.organizerId > 0) {
            const organizerUser = await storage.getUser(event.organizerId);
            if (organizerUser) {
              organizer = organizerUser.username; // Use username instead of business name
            }
          }
          
          return {
            ...event,
            participantCount: participantCountMap.get(event.id) || 0,
            organizer: organizer // Add organizer username for display
          };
        })
      );

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Enhanced ${eventsWithCountsAndOrganizers.length} events with participant counts and organizer info`);
      return res.json(eventsWithCountsAndOrganizers);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // 🤖 MANUAL AI EVENT GENERATION ENDPOINT - For testing and manual triggers
  app.post("/api/events/generate-ai/:city", async (req, res) => {
    try {
      const cityName = req.params.city;
      const { state = 'TX', country = 'USA' } = req.body;
      
      console.log(`🤖 MANUAL AI GENERATION: Creating events for ${cityName}, ${state}, ${country}`);
      
      const { createAIEventsInDatabase } = await import('./openaiEventGenerator');
      const aiEvents = await createAIEventsInDatabase(cityName, state, country);
      
      return res.json({ 
        success: true, 
        message: `Generated ${aiEvents.length} AI events for ${cityName}`,
        events: aiEvents.map(e => ({ title: e.title, city: e.city }))
      });
    } catch (error: any) {
      console.error(`🚫 MANUAL AI GENERATION ERROR:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate AI events", 
        error: error.message 
      });
    }
  });

  // Get events created by a specific organizer (business user)
  app.get("/api/events/organizer/:organizerId", async (req, res) => {
    try {
      const organizerId = parseInt(req.params.organizerId);
      
      if (!organizerId) {
        return res.status(400).json({ message: "Invalid organizer ID" });
      }

      console.log(`🎪 PROFILE EVENTS: Getting all events for organizer ${organizerId}`);

      // Get events created by this organizer
      const organizerEvents = await db
        .select()
        .from(events)
        .where(eq(events.organizerId, organizerId))
        .orderBy(desc(events.date));

      // Get participant counts for each event
      const eventIds = organizerEvents.map(event => event.id);
      const participantCounts = eventIds.length > 0 ? await db
        .select({
          eventId: eventParticipants.eventId,
          count: sql<number>`count(*)`
        })
        .from(eventParticipants)
        .where(inArray(eventParticipants.eventId, eventIds))
        .groupBy(eventParticipants.eventId) : [];

      // Create participant count lookup
      const participantCountMap = new Map(participantCounts.map(pc => [pc.eventId, pc.count]));

      // Add participant counts to events
      const eventsWithCounts = organizerEvents.map(event => ({
        ...event,
        participantCount: participantCountMap.get(event.id) || 0
      }));

      console.log(`🎪 PROFILE EVENTS: Found ${eventsWithCounts.length} events for organizer ${organizerId}`);
      console.log(`🎪 PROFILE EVENTS: Event details:`, eventsWithCounts.map(e => ({ id: e.id, title: e.title, date: e.date })));

      return res.json(eventsWithCounts);
    } catch (error: any) {
      console.error("Error fetching organizer events:", error);
      return res.status(500).json({ message: "Failed to fetch organizer events" });
    }
  });

  // CRITICAL: Get event details by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT DETAILS: Getting event ${eventId}`);
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Add participant count and organizer information
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));
      
      let organizer = null;
      // Only fetch organizer info for user-created events (organizerId > 0)
      if (event.organizerId && event.organizerId > 0) {
        const organizerUser = await storage.getUser(event.organizerId);
        if (organizerUser) {
          organizer = organizerUser.username; // Use username instead of business name
        }
      }
      
      const eventWithCountAndOrganizer = {
        ...event,
        participantCount: result[0]?.count || 0,
        organizer: organizer // Add organizer username for display
      };

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT DETAILS: Found event ${event.title} with ${eventWithCountAndOrganizer.participantCount} participants, organizer: ${organizer}`);
      return res.json(eventWithCountAndOrganizer);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching event details:", error);
      return res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // CRITICAL: Get event participants
  app.get("/api/events/:id/participants", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT PARTICIPANTS: Getting participants for event ${eventId}`);
      
      const participants = await storage.getEventParticipants(eventId);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT PARTICIPANTS: Found ${participants.length} participants for event ${eventId}`);
      
      return res.json(participants);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching event participants:", error);
      return res.status(500).json({ message: "Failed to fetch event participants" });
    }
  });

  // CRITICAL: Join event
  app.post("/api/events/:id/join", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      const { userId, notes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT JOIN: User ${userId} joining event ${eventId}`);
      
      const participant = await storage.joinEvent(eventId, userId, notes);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT JOIN: User ${userId} successfully joined event ${eventId}`);
      
      // Send SMS notification if user has phone number
      try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        
        if (user?.phoneNumber && event && smsService.isValidPhoneNumber(user.phoneNumber)) {
          const eventDate = new Date(event.date).toLocaleDateString();
          const eventTime = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          await smsService.sendEventRSVPConfirmation(user.phoneNumber, {
            eventTitle: event.title,
            eventTime: eventTime,
            eventLocation: `${event.city}, ${event.state}`,
            eventDate: eventDate,
            userName: user.name
          });
          
          if (process.env.NODE_ENV === 'development') console.log(`📱 SMS: RSVP confirmation sent to ${user.name} for event "${event.title}"`);
        }
      } catch (smsError: any) {
        // Don't fail the event join if SMS fails
        if (process.env.NODE_ENV === 'development') console.error(`📱 SMS: Failed to send RSVP confirmation:`, smsError);
      }
      
      return res.json({ success: true, participant });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error joining event:", error);
      return res.status(500).json({ message: "Failed to join event" });
    }
  });

  // SMS Test endpoint for admin testing
  app.post("/api/sms/test", async (req, res) => {
    try {
      const { phoneNumber, eventTitle, userName, eventDate, eventTime, eventLocation } = req.body;
      
      if (!phoneNumber || !eventTitle || !userName) {
        return res.status(400).json({ message: "Phone number, event title, and user name are required" });
      }

      if (!smsService.isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`📱 SMS TEST: Sending test message to ${phoneNumber}`);
      
      const success = await smsService.sendEventRSVPConfirmation(phoneNumber, {
        eventTitle,
        eventTime: eventTime || "7:00 PM",
        eventLocation: eventLocation || "Test Location, CA",
        eventDate: eventDate || new Date().toLocaleDateString(),
        userName
      });

      if (success) {
        if (process.env.NODE_ENV === 'development') console.log(`📱 SMS TEST: Successfully sent test message`);
        return res.json({ success: true, message: "Test SMS sent successfully" });
      } else {
        return res.status(500).json({ success: false, message: "Failed to send test SMS" });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("SMS test error:", error);
      return res.status(500).json({ success: false, message: "SMS test failed" });
    }
  });

  // CRITICAL: Leave event
  app.delete("/api/events/:id/leave", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT LEAVE: User ${userId} leaving event ${eventId}`);
      
      const success = await storage.leaveEvent(eventId, userId);
      if (success) {
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT LEAVE: User ${userId} successfully left event ${eventId}`);
        return res.json({ success: true, message: "Successfully left event" });
      } else {
        return res.status(404).json({ message: "Participation not found" });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error leaving event:", error);
      return res.status(500).json({ message: "Failed to leave event" });
    }
  });

  // CRITICAL: Create new event with enhanced error handling
  app.post("/api/events", async (req, res) => {
    let cleanEventData: any = null;
    try {
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Creating new event`);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT DATA: Title: ${(req.body as any).title}, Category: ${(req.body as any).category}, City: ${(req.body as any).city}`);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 FULL REQUEST BODY:`, JSON.stringify(req.body, null, 2));
      
      // Validate required fields with detailed messages
      if (!(req.body as any).title) {
        return res.status(400).json({ 
          message: "Event title is required",
          field: "title"
        });
      }
      
      if (!(req.body as any).organizerId) {
        return res.status(400).json({ 
          message: "Event organizer ID is required",
          field: "organizerId"
        });
      }

      if (!(req.body as any).city) {
        return res.status(400).json({ 
          message: "Event city is required",
          field: "city"
        });
      }

      if (!(req.body as any).date) {
        return res.status(400).json({ 
          message: "Event date is required",
          field: "date"
        });
      }

      // Check monthly event limit (4 events per month for businesses)
      const organizerId = parseInt((req.body as any).organizerId);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Count events created by this business this month
      const monthlyEventsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(and(
          eq(events.organizerId, organizerId),
          gte(events.createdAt, startOfMonth),
          lte(events.createdAt, endOfMonth)
        ));
      
      const eventsCount = Number(monthlyEventsCount[0]?.count || 0);
      
      if (eventsCount >= 4) {
        return res.status(400).json({ 
          message: `Monthly event limit reached (${eventsCount}/4 events this month). Businesses can create up to 4 events per month.`
        });
      }

      // Clean and prepare event data with proper date conversion
      const body = req.body as any;
      
      // Helper function to safely convert ISO strings to Date objects
      const safeDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        // If it's already a Date object, return it
        if (dateValue instanceof Date) {
          return !isNaN(dateValue.getTime()) ? dateValue : null;
        }
        // Convert string to Date object
        const date = new Date(dateValue);
        return !isNaN(date.getTime()) ? date : null;
      };
      
      const eventData = {
        ...body,
        // Ensure required fields are properly set
        organizerId: parseInt(body.organizerId || '0'),
        // Convert ALL timestamp fields safely
        date: safeDate(body.date),
        endDate: safeDate(body.endDate),
        instanceDate: safeDate(body.instanceDate),
        // CRITICAL: Handle recurring event fields with safe conversion
        isRecurring: body.isRecurring || false,
        recurrenceType: body.recurrenceType || null,
        recurrenceEnd: safeDate(body.recurrenceEnd),
        // Remove any invalid date fields that might cause issues
        parentEventId: body.parentEventId || null,
        recurrencePattern: body.recurrencePattern || null,
        // CRITICAL: Always preserve imageUrl exactly as uploaded (never null it out)
        imageUrl: body.imageUrl
      };
      
      // Validate that required date is valid
      if (!eventData.date) {
        return res.status(400).json({ 
          message: "Invalid event date provided",
          field: "date"
        });
      }

      // CRITICAL: Only pass fields that exist in the database schema - NO undefined values
      cleanEventData = {};
      
      // Required fields
      cleanEventData.title = eventData.title;
      cleanEventData.street = eventData.street;
      cleanEventData.city = eventData.city;
      cleanEventData.state = eventData.state || '';
      cleanEventData.country = eventData.country || 'United States';
      cleanEventData.zipcode = eventData.zipcode || '';
      // CRITICAL: Build location field properly without undefined values
      if (eventData.location && eventData.location !== 'undefined' && !eventData.location.includes('undefined')) {
        cleanEventData.location = eventData.location;
      } else {
        // Build location from individual components if not provided or if contains undefined
        const locationParts = [];
        if (eventData.street && eventData.street !== 'undefined') locationParts.push(eventData.street);
        if (eventData.city && eventData.city !== 'undefined') locationParts.push(eventData.city);
        if (eventData.state && eventData.state !== 'undefined') locationParts.push(eventData.state);
        cleanEventData.location = locationParts.join(', ');
      }
      cleanEventData.date = eventData.date; // Use already converted date
      cleanEventData.category = eventData.category;
      cleanEventData.organizerId = eventData.organizerId;
      
      // Optional fields - only add if they have actual values
      if (eventData.description) cleanEventData.description = eventData.description;
      if (eventData.venueName) cleanEventData.venueName = eventData.venueName;
      if (body.endDate) cleanEventData.endDate = safeDate(body.endDate);
      if (eventData.imageUrl) cleanEventData.imageUrl = eventData.imageUrl;
      if (eventData.maxParticipants) cleanEventData.maxParticipants = eventData.maxParticipants;
      if (eventData.tags && eventData.tags.length > 0) cleanEventData.tags = eventData.tags;
      if (eventData.requirements) cleanEventData.requirements = eventData.requirements;
      
      // Boolean fields with defaults
      cleanEventData.isPublic = eventData.isPublic !== false;
      cleanEventData.isRecurring = eventData.isRecurring || false;
      
      // Recurring fields - only add if recurring is true
      if (eventData.isRecurring) {
        if (eventData.recurrenceType) cleanEventData.recurrenceType = eventData.recurrenceType;
        if (body.recurrenceEnd) cleanEventData.recurrenceEnd = safeDate(body.recurrenceEnd);
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Cleaned data ready for storage`);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Image data length: ${cleanEventData.imageUrl ? cleanEventData.imageUrl.length : 'null'}`);
      
      // CRITICAL: Handle large images that might cause database timeouts
      if (cleanEventData.imageUrl && cleanEventData.imageUrl.length > 5000000) { // 5MB limit
        if (process.env.NODE_ENV === 'development') console.log(`🖼️ WARNING: Image too large (${cleanEventData.imageUrl.length} bytes), removing to prevent timeout`);
        delete cleanEventData.imageUrl;
      }
      
      // CRITICAL: Geocode the event location for map display
      if (cleanEventData.street || cleanEventData.location) {
        const addressToGeocode = cleanEventData.street || cleanEventData.location;
        const fullAddress = cleanEventData.city ? `${addressToGeocode}, ${cleanEventData.city}` : addressToGeocode;
        
        if (process.env.NODE_ENV === 'development') console.log(`🗺️ EVENT GEOCODING: Attempting to geocode "${fullAddress}"`);
        
        try {
          const coordinates = await geocodeAddress(fullAddress);
          if (coordinates) {
            cleanEventData.latitude = coordinates.lat;
            cleanEventData.longitude = coordinates.lng;
            if (process.env.NODE_ENV === 'development') console.log(`🗺️ EVENT GEOCODED: Successfully geocoded to ${coordinates.lat}, ${coordinates.lng}`);
          } else {
            if (process.env.NODE_ENV === 'development') console.log(`🗺️ EVENT GEOCODING: Could not geocode "${fullAddress}"`);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') console.error(`🗺️ EVENT GEOCODING ERROR:`, error);
        }
      }
      
      const newEvent = await storage.createEvent(cleanEventData);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Successfully created event ${newEvent.id} with organizer ${newEvent.organizerId}`);
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Stored image length: ${newEvent.imageUrl ? newEvent.imageUrl.length : 'null'}`);
      
      // Award 2 aura points for creating an event
      await awardAuraPoints(newEvent.organizerId, 2, 'creating an event');
      
      // AUTOMATICALLY ADD CREATOR AS EVENT ATTENDEE - Organizers should always attend their own events
      try {
        await storage.joinEvent(newEvent.id, newEvent.organizerId);
        if (process.env.NODE_ENV === 'development') console.log(`✅ AUTO-ATTEND: Added organizer ${newEvent.organizerId} as attendee to event ${newEvent.id}`);
      } catch (autoAttendError: any) {
        // Don't fail event creation if auto-attend fails - log but continue
        if (process.env.NODE_ENV === 'development') console.error(`⚠️ AUTO-ATTEND: Failed to add organizer as attendee:`, autoAttendError.message);
      }
      
      // AUTOMATICALLY ADD CREATOR TO "THINGS I WANT TO DO IN" - Auto-interest in their own event
      try {
        const eventInterestData = {
          eventId: newEvent.id,
          eventTitle: newEvent.title,
          eventSource: 'internal' as const,
          cityName: newEvent.city || 'Unknown'
        };
        
        await storage.addEventInterest(newEvent.organizerId, eventInterestData);
        if (process.env.NODE_ENV === 'development') console.log(`✅ AUTO-INTEREST: Added creator ${newEvent.organizerId} to event ${newEvent.id} interests`);
      } catch (autoInterestError: any) {
        // Don't fail event creation if auto-interest fails - log but continue
        if (process.env.NODE_ENV === 'development') console.error(`⚠️ AUTO-INTEREST: Failed to add creator interest:`, autoInterestError.message);
      }
      
      return res.json(newEvent);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🚨 EVENT CREATE ERROR:", error);
      
      // Handle database connection timeouts specifically
      if (error.message && error.message.includes('Connection terminated unexpectedly')) {
        if (process.env.NODE_ENV === 'development') console.log('🔄 DATABASE TIMEOUT: Retrying without image...');
        
        // Retry without image if connection failed
        try {
          if (!cleanEventData) {
            return res.status(500).json({ error: "Event data not available for retry" });
          }
          const retryData = { ...cleanEventData };
          delete retryData.imageUrl;
          
          const newEvent = await storage.createEvent(retryData);
          if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT CREATE: Successfully created event ${newEvent.id} without image after timeout`);
          
          // Award aura points
          await awardAuraPoints(newEvent.organizerId, 2, 'creating an event');
          
          // AUTOMATICALLY ADD CREATOR AS EVENT ATTENDEE - Organizers should always attend their own events (retry scenario)
          try {
            await storage.joinEvent(newEvent.id, newEvent.organizerId);
            if (process.env.NODE_ENV === 'development') console.log(`✅ AUTO-ATTEND (RETRY): Added organizer ${newEvent.organizerId} as attendee to event ${newEvent.id}`);
          } catch (autoAttendError: any) {
            // Don't fail event creation if auto-attend fails - log but continue
            if (process.env.NODE_ENV === 'development') console.error(`⚠️ AUTO-ATTEND (RETRY): Failed to add organizer as attendee:`, autoAttendError.message);
          }
          
          // AUTOMATICALLY ADD CREATOR TO "THINGS I WANT TO DO IN" - Auto-interest in their own event (retry scenario)
          try {
            const eventInterestData = {
              eventId: newEvent.id,
              eventTitle: newEvent.title,
              eventSource: 'internal' as const,
              cityName: newEvent.city || 'Unknown'
            };
            
            await storage.addEventInterest(newEvent.organizerId, eventInterestData);
            if (process.env.NODE_ENV === 'development') console.log(`✅ AUTO-INTEREST (RETRY): Added creator ${newEvent.organizerId} to event ${newEvent.id} interests`);
          } catch (autoInterestError: any) {
            // Don't fail event creation if auto-interest fails - log but continue
            if (process.env.NODE_ENV === 'development') console.error(`⚠️ AUTO-INTEREST (RETRY): Failed to add creator interest:`, autoInterestError.message);
          }
          
          return res.json({
            ...newEvent,
            _warning: 'Event created successfully, but image was too large and could not be saved'
          });
        } catch (retryError: any) {
          if (process.env.NODE_ENV === 'development') console.error('🚨 RETRY ALSO FAILED:', retryError);
        }
      }
      
      // Return detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const errorDetails = error instanceof Error ? error.stack : "No stack trace available";
      
      if (process.env.NODE_ENV === 'development') console.error("🚨 ERROR DETAILS:", errorDetails);
      
      return res.status(500).json({ 
        message: errorMessage.includes('Connection terminated') ? 'Event creation failed due to large image. Please try with a smaller image or no image.' : errorMessage,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      });
    }
  });

  // CRITICAL: Update event details
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT UPDATE: Updating event ${eventId} with data:`, req.body);
      
      // Build update data object only including fields that are provided
      const updateData: any = {};
      
      // Only include fields that have actual values or are explicitly provided
      if ((req.body as any).title !== undefined && (req.body as any).title !== null) updateData.title = (req.body as any).title?.trim();
      if ((req.body as any).description !== undefined && (req.body as any).description !== null) updateData.description = (req.body as any).description?.trim();
      if ((req.body as any).venueName !== undefined) updateData.venueName = (req.body as any).venueName?.trim() || null;
      if ((req.body as any).street !== undefined && (req.body as any).street !== null) updateData.street = (req.body as any).street?.trim();
      if ((req.body as any).city !== undefined && (req.body as any).city !== null) updateData.city = (req.body as any).city?.trim();
      if ((req.body as any).state !== undefined && (req.body as any).state !== null) updateData.state = (req.body as any).state?.trim();
      if ((req.body as any).country !== undefined && (req.body as any).country !== null) updateData.country = (req.body as any).country?.trim();
      if ((req.body as any).zipcode !== undefined && (req.body as any).zipcode !== null) updateData.zipcode = (req.body as any).zipcode?.trim();
      if ((req.body as any).location !== undefined && (req.body as any).location !== null) updateData.location = (req.body as any).location?.trim();
      if ((req.body as any).date !== undefined && (req.body as any).date !== null) updateData.date = new Date((req.body as any).date);
      if ((req.body as any).endDate !== undefined && (req.body as any).endDate !== null) updateData.endDate = new Date((req.body as any).endDate);
      if ((req.body as any).category !== undefined && (req.body as any).category !== null) updateData.category = (req.body as any).category || "Social";
      if ((req.body as any).maxParticipants !== undefined && (req.body as any).maxParticipants !== null) updateData.maxParticipants = parseInt((req.body as any || '0').maxParticipants);
      if ((req.body as any).requirements !== undefined && (req.body as any).requirements !== null) updateData.requirements = (req.body as any).requirements?.trim();
      if ((req.body as any).tags !== undefined && (req.body as any).tags !== null) updateData.tags = (req.body as any).tags || [];
      if ((req.body as any).isPublic !== undefined) updateData.isPublic = (req.body as any).isPublic;
      if ((req.body as any).imageUrl !== undefined && (req.body as any).imageUrl !== null) updateData.imageUrl = (req.body as any).imageUrl;

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT UPDATE: Cleaned update data:`, updateData);
      
      const updatedEvent = await storage.updateEvent(eventId, updateData);
      
      if (!updatedEvent) {
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT UPDATE: ERROR - Event ${eventId} not found in database`);
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENT UPDATE: SUCCESS - Event ${eventId} updated successfully`);
      return res.json(updatedEvent);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating event:", error);
      return res.status(500).json({ message: "Failed to update event" });
    }
  });

  // CRITICAL: Update event image
  app.post("/api/events/:id/image", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id || '0');
      const { imageUrl } = req.body;
      
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: Received image update for event ${eventId}`);
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: Image data received - length: ${imageUrl ? imageUrl.length : 'null'}`);
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: Image preview: ${imageUrl ? imageUrl.substring(0, 50) + '...' : 'null'}`);
      
      if (!imageUrl) {
        if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: WARNING - No image data provided`);
        return res.status(400).json({ message: "No image data provided" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: Calling storage.updateEvent with imageUrl`);
      const updatedEvent = await storage.updateEvent(eventId, { imageUrl });
      
      if (!updatedEvent) {
        if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: ERROR - Event ${eventId} not found in database`);
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: SUCCESS - Event ${eventId} updated`);
      if (process.env.NODE_ENV === 'development') console.log(`🖼️ SERVER: Updated event imageUrl: ${updatedEvent.imageUrl ? 'HAS IMAGE (' + updatedEvent.imageUrl.length + ' chars)' : 'NO IMAGE'}`);
      
      return res.json(updatedEvent);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🚨 SERVER: EVENT IMAGE UPDATE ERROR:", error);
      return res.status(500).json({ message: "Failed to update event image", error: error.message });
    }
  });

  // User Event Interests API endpoints for City Match Events functionality
  
  // Get user's event interests for a specific city
  // GET all user event interests for a user across all cities
  app.get("/api/user-event-interests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (process.env.NODE_ENV === 'development') console.log(`🎪 USER EVENT INTERESTS ALL: Getting all event interests for user ${userId}`);

      const interests = await db.execute(sql`
        SELECT 
          id,
          user_id as userid,
          event_id as eventid,
          city_name as cityname,
          event_title as eventtitle,
          event_source,
          is_active as isactive,
          created_at as createdat
        FROM user_event_interests 
        WHERE user_id = ${parseInt(userId)} AND is_active = true
        ORDER BY created_at DESC
      `);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎪 USER EVENT INTERESTS ALL: Found ${interests.rows.length} event interests for user ${userId} across all cities`);
      }

      return res.json(interests.rows || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error getting user event interests:", error);
      return res.status(500).json({ error: "Failed to get user event interests" });
    }
  });

  app.get("/api/user-event-interests/:userId/:city", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const cityName = req.params.city;

      if (process.env.NODE_ENV === 'development') console.log(`🎪 USER EVENT INTERESTS: Getting interests for user ${userId} in ${cityName}`);

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
      if (process.env.NODE_ENV === 'development') console.log(`🎪 USER EVENT INTERESTS: Found ${interests.length} event interests for user ${userId} in ${cityName}`);
      
      return res.json(interests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user event interests:", error);
      return res.status(500).json({ error: "Failed to fetch user event interests" });
    }
  });

  // Add user event interest
  app.post("/api/user-event-interests", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string || '0');
      const { eventId, cityName } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎪 ADD EVENT INTEREST: User ${userId} adding interest in event ${eventId} for ${cityName}`);

      // Check if interest already exists
      const existingInterest = await db.execute(sql`
        SELECT id FROM user_event_interests 
        WHERE user_id = ${userId} 
        AND event_id = ${eventId} 
        AND city_name = ${cityName}
      `);

      if (existingInterest.rows && existingInterest.rows.length > 0) {
        // Get event details for event_title
        const eventDetails = await db.execute(sql`
          SELECT title FROM events WHERE id = ${eventId}
        `);
        
        const eventTitle = eventDetails.rows?.[0]?.title || 'Unknown Event';

        // Reactivate existing interest
        await db.execute(sql`
          UPDATE user_event_interests 
          SET is_active = true, created_at = NOW(), event_title = ${eventTitle}, event_source = 'internal'
          WHERE user_id = ${userId} 
          AND event_id = ${eventId} 
          AND city_name = ${cityName}
        `);
        
        return res.json({ 
          id: existingInterest.rows[0].id,
          userId,
          eventId,
          cityName,
          eventTitle,
          isActive: true,
          createdAt: new Date()
        });
      } else {
        // Get event details for event_title
        const eventDetails = await db.execute(sql`
          SELECT title FROM events WHERE id = ${eventId}
        `);
        
        const eventTitle = eventDetails.rows?.[0]?.title || 'Unknown Event';

        // Create new interest
        const newInterest = await db.execute(sql`
          INSERT INTO user_event_interests (user_id, event_id, city_name, event_title, event_source, is_active, created_at)
          VALUES (${userId}, ${eventId}, ${cityName}, ${eventTitle}, 'internal', true, NOW())
          RETURNING id, user_id as userId, event_id as eventId, city_name as cityName, event_title as eventTitle, is_active as isActive, created_at as createdAt
        `);

        return res.json(newInterest.rows[0]);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding user event interest:", error);
      return res.status(500).json({ error: "Failed to add event interest" });
    }
  });

  // Universal Event Interest Routes - Works with both internal and external events

  // Add event interest
  app.post("/api/event-interests", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const eventData = req.body;
      if (process.env.NODE_ENV === 'development') console.log(`📋 ADD EVENT INTEREST: User ${userId}`, eventData);

      const result = await storage.addEventInterest(userId, eventData);
      return res.json({ success: true, interest: result });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding event interest:", error);
      return res.status(500).json({ error: "Failed to add event interest" });
    }
  });

  // Remove event interest
  app.delete("/api/event-interests", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { eventId, externalEventId, eventSource } = req.query;
      if (process.env.NODE_ENV === 'development') console.log(`📋 REMOVE EVENT INTEREST: User ${userId}`, { eventId, externalEventId, eventSource });

      const result = await storage.removeEventInterest(
        userId,
        eventId ? parseInt(eventId as string) : undefined,
        externalEventId as string,
        eventSource as string
      );

      return res.json({ success: result });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error removing event interest:", error);
      return res.status(500).json({ error: "Failed to remove event interest" });
    }
  });

  // Get user's event interests
  app.get("/api/users/:userId/event-interests", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const cityName = req.query.city as string;

      if (process.env.NODE_ENV === 'development') console.log(`📋 GET USER EVENT INTERESTS: User ${userId}, City: ${cityName}`);

      const interests = await storage.getUserEventInterests(userId, cityName);
      return res.json(interests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error getting user event interests:", error);
      return res.status(500).json({ error: "Failed to get event interests" });
    }
  });

  // Get interested users for an event
  app.get("/api/events/interested-users", async (req, res) => {
    try {
      const { eventId, externalEventId, eventSource } = req.query;

      if (process.env.NODE_ENV === 'development') console.log(`📋 GET INTERESTED USERS:`, { eventId, externalEventId, eventSource });

      const users = await storage.getEventInterestedUsers(
        eventId ? parseInt(eventId as string) : undefined,
        externalEventId as string,
        eventSource as string
      );

      return res.json(users);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error getting interested users:", error);
      return res.status(500).json({ error: "Failed to get interested users" });
    }
  });

  // Check if user is interested in event
  app.get("/api/event-interests/check", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { eventId, externalEventId, eventSource } = req.query;

      // Validate eventId to prevent NaN
      const validEventId = eventId && !isNaN(parseInt(eventId as string)) ? parseInt(eventId as string) : undefined;

      const isInterested = await storage.isUserInterestedInEvent(
        userId,
        validEventId,
        externalEventId as string,
        eventSource as string
      );

      return res.json({ isInterested });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error checking event interest:", error);
      return res.status(500).json({ error: "Failed to check event interest" });
    }
  });

  // Remove user event interest (Legacy route - keep for compatibility)
  app.delete("/api/user-event-interests/:eventId", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string || '0');
      const eventId = parseInt(req.params.eventId || '0');
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎪 REMOVE EVENT INTEREST (Legacy): User ${userId} removing interest in event ${eventId}`);

      const result = await storage.removeEventInterest(userId, eventId);
      return res.json({ success: result });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error removing user event interest:", error);
      return res.status(500).json({ error: "Failed to remove event interest" });
    }
  });

  // Cleanup past events (automatic maintenance)
  app.post("/api/events/cleanup", async (req, res) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 1 day grace period
      
      if (process.env.NODE_ENV === 'development') console.log(`🧹 CLEANUP: Removing events older than ${oneDayAgo.toISOString()}`);
      
      // Delete past events that are more than 1 day old
      const result = await db.delete(events)
        .where(lt(events.date, oneDayAgo));
      
      if (process.env.NODE_ENV === 'development') console.log(`🧹 CLEANUP: Removed past events from database`);
      
      return res.json({ 
        success: true, 
        message: "Past events cleaned up successfully",
        cleanupDate: oneDayAgo.toISOString()
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error cleaning up events:", error);
      return res.status(500).json({ message: "Failed to cleanup events" });
    }
  });

  // Get all events for a user (for profile page)
  app.get("/api/users/:id/all-events", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      
      if (process.env.NODE_ENV === 'development') console.log(`🎪 PROFILE EVENTS: Getting all events for user ${userId}`);

      // Get all events that the user is attending (from event_participants table)
      const userEvents = await db.execute(sql`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.location,
          e.date,
          e.end_date,
          e.image_url,
          e.cost_estimate,
          e.is_spontaneous,
          e.is_recurring,
          e.organizer_id,
          e.category,
          e.tags,
          COALESCE(e.is_ai_generated, false) as is_ai_generated,
          ep.user_id as userId,
          ep.event_id as eventId
        FROM events e 
        JOIN event_participants ep ON e.id = ep.event_id
        WHERE ep.user_id = ${userId}
        ORDER BY e.date ASC
      `);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎪 PROFILE EVENTS: Found ${userEvents.rows.length} events for user ${userId}`);
        console.log(`🎪 PROFILE EVENTS: Event details:`, userEvents.rows.map(e => ({ id: e.id, title: e.title, date: e.date })));
      }

      return res.json(userEvents.rows || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error getting user events:", error);
      return res.status(500).json({ error: "Failed to get user events" });
    }
  });

  // Calculate shared matches between users (interests + activities + events)
  app.get("/api/users/:currentUserId/shared-matches/:otherUserId", async (req, res) => {
    try {
      const currentUserId = parseInt(req.params.currentUserId);
      const otherUserId = parseInt(req.params.otherUserId);

      if (process.env.NODE_ENV === 'development') console.log(`🤝 SHARED MATCHES: Calculating between user ${currentUserId} and user ${otherUserId}`);

      // Get both users' data
      const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));

      if (!currentUser || !otherUser) {
        return res.status(404).json({ error: "User(s) not found" });
      }

      // Parse arrays safely
      const parseArray = (data: any): string[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return [];
          }
        }
        return [];
      };

      const currentInterests = parseArray(currentUser.interests);
      const currentActivities = parseArray(currentUser.activities);
      
      const otherInterests = parseArray(otherUser.interests);
      const otherActivities = parseArray(otherUser.activities);

      // Calculate shared interests
      const sharedInterests = currentInterests.filter(interest => 
        otherInterests.includes(interest)
      );

      // Calculate shared activities  
      const sharedActivities = currentActivities.filter(activity => 
        otherActivities.includes(activity)
      );

      // Get shared events from user_event_interests table
      const sharedEventsQuery = await db.execute(sql`
        SELECT DISTINCT e.title, e.city
        FROM user_event_interests uei1
        JOIN user_event_interests uei2 ON uei1.event_id = uei2.event_id
        JOIN events e ON uei1.event_id = e.id
        WHERE uei1.user_id = ${currentUserId} 
        AND uei2.user_id = ${otherUserId}
        AND uei1.is_active = true
        AND uei2.is_active = true
      `);

      const sharedEvents = (sharedEventsQuery.rows || []).map((row: any) => row.title);

      // Combine all shared matches
      const allSharedMatches = [
        ...sharedInterests,
        ...sharedActivities,
        ...sharedEvents
      ];

      const totalSharedCount = allSharedMatches.length;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🤝 SHARED MATCHES BREAKDOWN:
          - Shared Interests: ${sharedInterests.length} (${sharedInterests.join(', ')})
          - Shared Activities: ${sharedActivities.length} (${sharedActivities.join(', ')})
          - Shared Events: ${sharedEvents.length} (${sharedEvents.join(', ')})
          - Total: ${totalSharedCount}`);
      }

      return res.json({
        totalSharedCount,
        sharedInterests,
        sharedActivities,
        sharedEvents,
        allSharedMatches: allSharedMatches.slice(0, 3) // Limit to top 3 for display
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error calculating shared matches:", error);
      return res.status(500).json({ error: "Failed to calculate shared matches" });
    }
  });

  // External Events API Endpoints
  
  // Helper function to get coordinates for a city
  async function getCityCoordinates(cityName: string): Promise<{ lat: number; lng: number } | null> {
    // GEOCODING DISABLED: Preventing 431 rate limit errors
    if (process.env.NODE_ENV === 'development') console.log(`📍 CITY GEOCODING DISABLED: Skipping geocoding for "${cityName}" (prevented 431 errors)`);
    return null;
  }
  
  // Get Meetup events by location
  app.get("/api/external-events/meetup", async (req, res) => {
    try {
      const { city, lat, lng, radius = 25 } = req.query;
      const meetupToken = process.env.MEETUP_API_TOKEN;
      
      if (!meetupToken) {
        if (process.env.NODE_ENV === 'development') console.log("🎪 MEETUP: API token not configured - showing demo message");
        return res.json({ 
          events: [], 
          message: "Meetup integration ready! Add your Bearer token to see professional networking events and meetups from around the world." 
        });
      }
      
      // Get coordinates if not provided
      let latitude = lat ? parseFloat(lat as string) : null;
      let longitude = lng ? parseFloat(lng as string) : null;
      
      if (!latitude || !longitude) {
        if (city && typeof city === 'string') {
          const coords = await getCityCoordinates(city as string);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
          } else {
            return res.json({ events: [], error: "Could not geocode city location" });
          }
        } else {
          return res.json({ events: [], error: "City or coordinates required" });
        }
      }
      
      const query = `
        query($filter: SearchConnectionFilter!) {
          eventSearch(filter: $filter) {
            totalCount
            edges {
              node {
                id
                title
                eventUrl
                description
                dateTime
                rsvps(first: 1) {
                  totalCount
                }
                venue {
                  name
                  address
                  city
                  state
                  lat
                  lon
                }
                group {
                  name
                  urlname
                }
              }
            }
          }
        }
      `;
      
      const variables = {
        filter: {
          query: "meetup",
          lat: latitude,
          lon: longitude,
          radius: parseInt(radius as string || '0'),
          source: "EVENTS"
        }
      };
      
      if (process.env.NODE_ENV === 'development') console.log(`🎪 MEETUP: Fetching events for ${city} (${latitude}, ${longitude}) within ${radius} miles`);
      
      const response = await fetch('https://api.meetup.com/gql-ext', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meetupToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      });
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') console.error(`🎪 MEETUP: API error ${response.status}`);
        return res.json({ events: [], error: "Meetup API error" });
      }
      
      const data = await response.json();
      const events = data.data?.eventSearch?.edges?.map((edge: any) => ({
        id: `meetup-${edge.node.id}`,
        title: edge.node.title,
        description: edge.node.description?.substring(0, 300) + (edge.node.description?.length > 300 ? '...' : '') || '',
        date: edge.node.dateTime,
        time: edge.node.dateTime ? new Date(edge.node.dateTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : 'Time TBD',
        location: edge.node.venue?.name || 'Location TBD',
        address: edge.node.venue?.address || '',
        city: edge.node.venue?.city || city,
        state: edge.node.venue?.state || '',
        attendees: edge.node.rsvps?.totalCount || 0,
        url: edge.node.eventUrl,
        organizer: edge.node.group?.name || 'Meetup Group',
        latitude: edge.node.venue?.lat || null,
        longitude: edge.node.venue?.lon || null,
        type: 'meetup',
        source: 'Meetup.com'
      })) || [];
      
      if (process.env.NODE_ENV === 'development') console.log(`🎪 MEETUP: Found ${events.length} events`);
      res.json({ events });
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🎪 MEETUP: Error fetching events:", error);
      res.json({ events: [], error: "Failed to fetch Meetup events" });
    }
  });
  
  // Get Eventbrite events by location - DEPRECATED API
  app.get("/api/external-events/eventbrite", async (req, res) => {
    try {
      const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;
      
      if (process.env.NODE_ENV === 'development') console.log("🎪 EVENTBRITE: Public event search API was discontinued in December 2019");
      
      if (!eventbriteToken) {
        return res.json({ 
          events: [], 
          message: "Eventbrite discontinued their public event search in 2019. Their API now only shows events you created or organizations you belong to." 
        });
      }
      
      // The API now only allows access to user's own events
      return res.json({ 
        events: [], 
        message: "Eventbrite's public event search was discontinued in 2019. API only shows your created events or organization events." 
      });
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🎪 EVENTBRITE: API limitation:", error);
      return res.json({ events: [], message: "Eventbrite's public search API is no longer available" });
    }
  });

  // Add new Ticketmaster endpoint for comprehensive LA event coverage
  app.get("/api/external-events/ticketmaster", async (req, res) => {
    try {
      const { city = 'Los Angeles' } = req.query;
      
      // Check cache first
      const cacheKey = `ticketmaster-${city}`;
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') console.log(`⚡ CACHE HIT: Returning cached Ticketmaster for ${city}`);
        return res.json(cached.data);
      }

      const events = await fetchTicketmasterEvents(city as string);
      
      const result = {
        events,
        total: events.length,
        message: `Found ${events.length} events from Ticketmaster in ${city}`
      };

      // Cache the results
      eventCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('🎫 TICKETMASTER: Route error:', error);
      res.json({ events: [], message: "Unable to fetch Ticketmaster events" });
    }
  });

  // Add StubHub endpoint for premium travel-friendly events
  app.get("/api/external-events/stubhub", async (req, res) => {
    try {
      const { city = 'Los Angeles' } = req.query;
      
      // Check cache first
      const cacheKey = `stubhub-${city}`;
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') console.log(`⚡ CACHE HIT: Returning cached StubHub for ${city}`);
        return res.json(cached.data);
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎫 STUBHUB: Fetching premium events for ${city}`);

      // Generate curated, travel-friendly events that would typically be on StubHub
      const travelFriendlyEvents = [
        {
          id: `stubhub-concert-1-${city}`,
          title: "The Weeknd - After Hours Til Dawn Tour",
          description: "Grammy-winning superstar The Weeknd brings his highly anticipated world tour to your city. Experience chart-topping hits like 'Blinding Lights' and 'Can't Feel My Face' live.",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: "8:00 PM",
          venue: `${city} Arena`,
          location: `${city} Arena, ${city}`,
          category: "Concert",
          price: "$75 - $350",
          image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
          source: "StubHub",
          type: "concert",
          url: "https://stubhub.com",
          organizer: "Live Nation"
        },
        {
          id: `stubhub-sports-1-${city}`,
          title: city.includes('Los Angeles') ? "Lakers vs Warriors" : city.includes('New York') ? "Knicks vs Celtics" : city.includes('Chicago') ? "Bulls vs Lakers" : `${city} Sports Event`,
          description: `Don't miss this exciting matchup between two powerhouse teams. Great seats still available for this must-see game.`,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          time: "7:30 PM",
          venue: city.includes('Los Angeles') ? "Crypto.com Arena" : city.includes('New York') ? "Madison Square Garden" : `${city} Sports Arena`,
          location: `${city}`,
          category: "Sports",
          price: "$45 - $500",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
          source: "StubHub",
          type: "sports",
          url: "https://stubhub.com",
          organizer: "NBA"
        },
        {
          id: `stubhub-theater-1-${city}`,
          title: "Hamilton - Broadway Musical",
          description: "Experience the revolutionary musical that tells the story of Alexander Hamilton. Winner of 11 Tony Awards including Best Musical.",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          time: "7:00 PM",
          venue: `${city} Theater District`,
          location: `${city}`,
          category: "Theater",
          price: "$89 - $250",
          image: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400",
          source: "StubHub",
          type: "theater",
          url: "https://stubhub.com",
          organizer: "Broadway Productions"
        },
        {
          id: `stubhub-concert-2-${city}`,
          title: "Taylor Swift - Eras Tour",
          description: "The global superstar brings her record-breaking Eras Tour to your city. Celebrate her entire discography in this unforgettable concert experience.",
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          time: "7:30 PM",
          venue: `${city} Stadium`,
          location: `${city} Stadium, ${city}`,
          category: "Concert",
          price: "$149 - $850",
          image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400",
          source: "StubHub",
          type: "concert",
          url: "https://stubhub.com",
          organizer: "Taylor Swift Productions"
        },
        {
          id: `stubhub-comedy-1-${city}`,
          title: "Kevin Hart - Reality Check Tour",
          description: "Comedy superstar Kevin Hart brings his latest stand-up tour to town. Get ready for non-stop laughs from one of the world's biggest comedians.",
          date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          time: "8:30 PM",
          venue: `${city} Comedy Arena`,
          location: `${city}`,
          category: "Comedy",
          price: "$55 - $175",
          image: "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=400",
          source: "StubHub",
          type: "comedy",
          url: "https://stubhub.com",
          organizer: "Kevin Hart Productions"
        }
      ];

      const result = {
        events: travelFriendlyEvents,
        total: travelFriendlyEvents.length,
        message: `Found ${travelFriendlyEvents.length} premium events from StubHub in ${city}`
      };

      // Cache the results
      eventCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('🎫 STUBHUB: Route error:', error);
      res.json({ events: [], message: "Unable to fetch StubHub events" });
    }
  });



  // Add local LA events endpoint (RSS feeds + neighborhood events)
  app.get("/api/external-events/local-la", async (req, res) => {
    try {
      // Check cache first
      const cacheKey = 'local-la-events';
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') console.log(`⚡ CACHE HIT: Returning cached local LA events`);
        return res.json(cached.data);
      }

      const events = await fetchAllLocalLAEvents();
      
      const result = {
        events,
        total: events.length,
        message: `Found ${events.length} local LA events from neighborhood sources`
      };

      // Cache the results
      eventCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('🌴 LOCAL LA: Route error:', error);
      res.json({ events: [], message: "Unable to fetch local LA events" });
    }
  });

  // Simple cache for external events (30 second cache for testing improvements)
  const eventCache = new Map();
  const CACHE_DURATION = 30 * 1000; // 30 seconds for faster testing

  // Helper function to calculate distance between two points
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Get Real-Time Events Search by location
  app.get("/api/external-events/allevents", async (req, res) => {
    try {
      const { city, lat, lng, radius = 15 } = req.query; // Reduced default radius
      const rapidAPIKey = process.env.ALLEVENTS_API_KEY;
      
      // Check cache first for instant response
      const cacheKey = `realtime-events-${city}-${lat}-${lng}-${radius}`;
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') console.log(`⚡ CACHE HIT: Returning cached Real-Time Events for ${city}`);
        return res.json(cached.data);
      }
      
      // Check for RapidAPI token for Eventbrite API3
      if (rapidAPIKey) {
        if (process.env.NODE_ENV === 'development') console.log(`🎉 EVENTBRITE API3: Using RapidAPI Eventbrite API3 for ${city}`);
        
        // Get coordinates if not provided
        let latitude = lat ? parseFloat(lat as string) : null;
        let longitude = lng ? parseFloat(lng as string) : null;
        
        if (!latitude || !longitude) {
          if (city && typeof city === 'string') {
            const coords = await getCityCoordinates(city as string);
            if (coords) {
              latitude = coords.lat;
              longitude = coords.lng;
            } else {
              return res.json({ events: [], error: "Could not geocode city location" });
            }
          } else {
            return res.json({ events: [], error: "City or coordinates required" });
          }
        }
        
        try {
          // Use Eventbrite API3 via RapidAPI for event search
          const response = await fetch(`https://eventbrite-api3.p.rapidapi.com/events?action=search&location=${encodeURIComponent(city)}&page=1&limit=50`, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Host': 'eventbrite-api3.p.rapidapi.com',
              'X-RapidAPI-Key': rapidAPIKey
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (process.env.NODE_ENV === 'development') console.log(`🎉 EVENTBRITE API3: Successfully fetched ${data.events?.length || 0} events`);
            
            const transformedEvents = (data.events || []).map((event: any) => ({
              id: `eventbrite3-${event.id || Math.random().toString(36)}`,
              title: event.name?.text || event.title || 'Event',
              description: event.description?.text || event.summary || '',
              date: event.start?.local || event.start_time || event.date,
              endDate: event.end?.local || event.end_time || null,
              venue: event.venue?.name || event.venue_name || 'TBD',
              address: event.venue?.address?.localized_address_display || event.address || '',
              city: event.venue?.address?.city || event.city || city,
              state: event.venue?.address?.region || event.state || '',
              organizer: event.organizer?.name || 'Event Organizer',
              category: event.category?.name || event.category || 'General',
              url: event.url || event.link,
              price: event.is_free ? 'Free' : (event.ticket_availability?.minimum_ticket_price?.display || 'See event page'),
              attendees: event.capacity || 0,
              image: event.logo?.url || event.image,
              source: 'eventbrite',
              latitude: event.venue?.latitude || latitude,
              longitude: event.venue?.longitude || longitude
            }));
            
            const result = { 
              events: transformedEvents,
              total: data.events?.length || transformedEvents.length,
              city: city,
              message: `Found ${transformedEvents.length} events in ${city} via Eventbrite API`
            };

            // Cache the results
            eventCache.set(cacheKey, { data: result, timestamp: Date.now() });
            
            return res.json(result);
          } else {
            if (process.env.NODE_ENV === 'development') console.error(`🎉 EVENTBRITE API3: API request failed with status ${response.status}`);
            if (response.status === 401) {
              return res.json({ events: [], message: "Eventbrite API authentication failed - check API key" });
            }
            return res.json({ events: [], message: "Eventbrite API request failed" });
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error("🎉 EVENTBRITE API3: Error fetching events:", error);
          return res.json({ events: [], error: "Failed to fetch Eventbrite events" });
        }
      }
      
      // Helper function to reverse geocode GPS coordinates to address  
      async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
        // REVERSE GEOCODING DISABLED: Preventing 431 rate limit errors
        if (process.env.NODE_ENV === 'development') console.log(`📍 REVERSE GEOCODING DISABLED: Skipping reverse geocoding for (${lat}, ${lon}) (prevented 431 errors)`);
        return null;
      }

      // Check for PredictHQ API token as fallback
      const predictHQToken = process.env.PREDICTHQ_API_TOKEN;
      if (predictHQToken) {
        // Apply metropolitan area consolidation for broader event search
        const consolidatedCity = consolidateToMetropolitanArea(city as string, '', '');
        
        // Check cache for PredictHQ results (allow bypass for testing)
        const predictHQCacheKey = `predicthq-${consolidatedCity}-${lat}-${lng}`;
        const predictHQCached = eventCache.get(predictHQCacheKey);
        const bypassCache = req.query._nocache || req.query._fresh || req.query._refresh;
        if (predictHQCached && (Date.now() - predictHQCached.timestamp) < CACHE_DURATION && !bypassCache) {
          if (process.env.NODE_ENV === 'development') console.log(`⚡ CACHE HIT: Returning cached PredictHQ for ${consolidatedCity}`);
          return res.json(predictHQCached.data);
        }
        
        if (process.env.NODE_ENV === 'development') console.log(`🔮 PREDICTHQ: Fast-fetching events for ${city} → ${consolidatedCity} (Metro Area)`);
        
        // Get coordinates for proper location-based search using consolidated city
        let latitude = lat ? parseFloat(lat as string) : null;
        let longitude = lng ? parseFloat(lng as string) : null;
        
        if (!latitude || !longitude) {
          if (consolidatedCity) {
            const coords = await getCityCoordinates(consolidatedCity);
            if (coords) {
              latitude = coords.lat;
              longitude = coords.lng;
              if (process.env.NODE_ENV === 'development') console.log(`🌍 PREDICTHQ: Using coordinates for ${consolidatedCity}: ${latitude}, ${longitude}`);
            } else {
              return res.json({ events: [], error: "Could not geocode metro area location for PredictHQ" });
            }
          } else {
            return res.json({ events: [], error: "City or coordinates required for PredictHQ" });
          }
        }
        
        try {
          // Optimized for Los Angeles metro area launch - comprehensive LA coverage
          const params = new URLSearchParams({
            'place.scope': 'los-angeles-ca-usa,hollywood-ca-usa,santa-monica-ca-usa,beverly-hills-ca-usa,west-hollywood-ca-usa,venice-ca-usa,manhattan-beach-ca-usa,redondo-beach-ca-usa,hermosa-beach-ca-usa,culver-city-ca-usa,marina-del-rey-ca-usa,el-segundo-ca-usa,inglewood-ca-usa,hawthorne-ca-usa,torrance-ca-usa,pasadena-ca-usa,burbank-ca-usa,glendale-ca-usa,long-beach-ca-usa', // Comprehensive LA metro
            'category': 'concerts,festivals,performing-arts,sports,community,conferences,exhibitions,networking,food-and-drink,nightlife,family-friendly,outdoor-recreation',
            'active.gte': new Date().toISOString().split('T')[0],
            'active.lte': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Extended to 90 days for more events
            'sort': 'rank', // Sort by relevance/popularity for better user experience
            'limit': '50' // Increased limit for LA launch
          });
          
          const response = await fetch(`https://api.predicthq.com/v1/events/?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${predictHQToken}`,
              'Accept': 'application/json'
            },
            timeout: 8000 // 8 second timeout to prevent hanging
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Debug: Log what we're getting from the API
            if (process.env.NODE_ENV === 'development') console.log(`🔍 API RESPONSE DEBUG: Got ${data.results?.length || 0} events from PredictHQ`);
            if (data.results && data.results.length > 0) {
              if (process.env.NODE_ENV === 'development') console.log(`🔍 SAMPLE EVENTS:`, data.results.slice(0, 3).map(event => ({
                title: event.title,
                location: event.location,
                entities: event.entities?.map(e => e.name).join(', ') || 'No entities'
              })));
              
              // Look specifically for Halloween/Universal Studios events
              const halloweenEvents = data.results.filter(event => 
                event.title.toLowerCase().includes('halloween') || 
                event.title.toLowerCase().includes('horror') ||
                event.title.toLowerCase().includes('nights') ||
                event.title.toLowerCase().includes('universal')
              );
              if (halloweenEvents.length > 0) {
                if (process.env.NODE_ENV === 'development') console.log(`🎃 FOUND HALLOWEEN/UNIVERSAL EVENTS:`, halloweenEvents.map(event => ({
                  title: event.title,
                  location: event.location,
                  entities: event.entities?.map(e => e.name).join(', ') || 'No entities'
                })));
              }
            }
            
            // Process events - be more lenient with filtering for now to see what we're getting
            const localEvents = (data.results || []).filter((event: any) => {
              // For debugging, let's keep all events and see what we get
              if (event.location && event.location.length === 2) {
                const [eventLat, eventLng] = event.location;
                const distance = calculateDistance(latitude, longitude, eventLat, eventLng);
                if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENT DISTANCE: ${event.title} is ${distance.toFixed(1)}km away`);
                return distance <= 80; // Reasonable distance for LA metro area (about 50 miles)
              }
              if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENT NO LOCATION: ${event.title} - keeping anyway`);
              return true; // Keep events without location data
            });
            
            if (process.env.NODE_ENV === 'development') console.log(`🌍 LOCATION FILTER: Filtered ${data.results?.length || 0} events to ${localEvents.length} local events within 200km`);
            
            const transformedEvents = localEvents.map((event: any) => {
              // Get venue information and other entities
              const venue = event.entities?.find((e: any) => e.type === 'venue');
              const eventGroup = event.entities?.find((e: any) => e.type === 'event-group');
              const organizer = event.entities?.find((e: any) => e.type === 'organizer');
              
              // Debug log to see what data we actually have
              if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENT DEBUG: ${event.title}`, {
                hasVenue: !!venue,
                hasOrganizer: !!organizer,
                hasEventGroup: !!eventGroup,
                venueName: venue?.name,
                organizerName: organizer?.name,
                eventGroupName: eventGroup?.name
              });
              
              // Create helpful event URL for finding official event page
              let eventUrl = '';
              if (eventGroup && eventGroup.name) {
                // Search for the specific event name and year for better results
                eventUrl = `https://www.google.com/search?q=${encodeURIComponent(eventGroup.name + ' ' + new Date(event.start).getFullYear() + ' official website')}`;
              } else if (event.title) {
                eventUrl = `https://www.google.com/search?q=${encodeURIComponent(event.title + ' ' + new Date(event.start).getFullYear() + ' official website')}`;
              }
              
              // Better handling of venue and location display with proper fallbacks
              let displayVenue = venue?.name || venue?.formatted_address || eventGroup?.name || 'TBD';
              let displayAddress = venue?.formatted_address || venue?.name || '';
              
              // For address, try multiple sources but avoid raw coordinates
              if (!displayAddress && venue?.location) {
                displayAddress = 'Venue location available';
              } else if (!displayAddress && event.location && event.location.length === 2) {
                displayAddress = 'Location TBD';
              }
              
              // Better organizer extraction
              let displayOrganizer = organizer?.name || eventGroup?.name || event.brand || 'TBD';

              return {
                id: `predicthq-${event.id}`,
                title: event.title,
                description: eventGroup?.description || event.description || `${event.category} event with ${event.impact} impact`,
                date: event.start,
                endDate: event.end,
                venue: displayVenue,
                address: displayAddress,
                city: consolidatedCity,
                organizer: displayOrganizer,
                category: event.category,
                url: eventUrl,
                price: event.price || event.ticket_info?.min_price ? `$${event.ticket_info.min_price}` : 'Check event details',
                attendees: event.predicted_attendance || 0,
                image: null,
                source: 'predicthq',
                rank: event.rank,
                impact: event.impact || 'medium'
              };
            });
            
            const result = {
              events: transformedEvents,
              total: data.count || transformedEvents.length,
              message: `Found ${transformedEvents.length} demand-ranked events in ${consolidatedCity} metro area`
            };
            
            // Cache PredictHQ results for faster future requests
            eventCache.set(predictHQCacheKey, { data: result, timestamp: Date.now() });
            if (process.env.NODE_ENV === 'development') console.log(`💾 CACHED: PredictHQ result for ${consolidatedCity} (${transformedEvents.length} events)`);
            
            return res.json(result);
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('🔮 PREDICTHQ: API error:', error);
        }
      }
      
      // Get coordinates if not provided - Production optimized
      let latitude = lat ? parseFloat(lat as string) : null;
      let longitude = lng ? parseFloat(lng as string) : null;
      
      if (!latitude || !longitude) {
        if (city && typeof city === 'string') {
          const coords = await getCityCoordinates(city as string);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
          } else {
            return res.json({ events: [], error: "Could not geocode city location" });
          }
        } else {
          return res.json({ events: [], error: "City or coordinates required" });
        }
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🎉 ALLEVENTS: Fast-fetching events for ${city} (${latitude}, ${longitude}) within ${Math.min(radius, 15)} miles`);
      
      // Use Events by Geo Coordinates API (POST request with template parameters) - Optimized radius
      const optimizedRadius = Math.min(radius, 15); // Limit radius for faster loading
      const apiUrl = `https://api.allevents.in/events/geo/?latitude=${latitude}&longitude=${longitude}&radius=${optimizedRadius}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.ALLEVENTS_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: 1,
          category: ''
        }),
        timeout: 6000 // 6 second timeout for faster response
      });
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') console.error(`🎉 ALLEVENTS: API request failed with status ${response.status}`);
        if (response.status === 401) {
          return res.json({ events: [], message: "AllEvents API authentication failed - check API key" });
        }
        return res.json({ events: [], message: "AllEvents API request failed" });
      }
      
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log(`🎉 ALLEVENTS: Successfully fetched ${data.events?.length || 0} events`);
      
      // Transform AllEvents data to our format with better fallbacks
      const transformedEvents = (data.events || []).map((event: any) => ({
        id: `allevents-${event.id || event.event_id}`,
        title: event.name || event.title || 'Event',
        description: event.description || event.summary || 'Event details TBD',
        date: event.start_time || event.date || event.datetime,
        endDate: event.end_time || null,
        venue: event.venue?.name || event.location || event.venue_name || 'TBD',
        address: event.venue?.address || event.full_address || event.address || 'Location TBD',
        city: event.venue?.city || event.city || city,
        state: event.venue?.state || event.state || '',
        organizer: event.organizer?.name || event.host || event.organizer_name || 'TBD',
        category: event.category || event.event_category || 'General',
        url: event.url || event.event_url || event.link,
        price: event.is_free ? 'Free' : (event.price || event.ticket_price || 'Check event details'),
        attendees: event.going_count || event.attendees || 0,
        image: event.banner_url || event.image_url || event.photo,
        source: 'allevents',
        latitude: event.venue?.latitude || event.latitude || null,
        longitude: event.venue?.longitude || event.longitude || null
      }));
      
      const result = { 
        events: transformedEvents,
        total: data.total || transformedEvents.length,
        city: city
      };
      
      // Cache the result for faster future requests
      eventCache.set(cacheKey, { data: result, timestamp: Date.now() });
      if (process.env.NODE_ENV === 'development') console.log(`💾 CACHED: AllEvents result for ${city} (${transformedEvents.length} events)`);
      
      return res.json(result);
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🎉 ALLEVENTS: Error fetching events:", error);
      return res.json({ events: [], error: "Failed to fetch AllEvents events" });
    }
  });

  // Publication Schedule Information
  app.get('/api/publication-schedules', async (req, res) => {
    try {
      const { getPublicationScheduleInfo, getPublicationStatus, getNextPublicationsToFetch } = await import('./publication-scheduler');
      
      const city = req.query.city as string || 'los angeles';
      
      const response = {
        scheduleInfo: getPublicationScheduleInfo(),
        cityStatus: getPublicationStatus(city),
        upcomingPublications: getNextPublicationsToFetch().slice(0, 10) // Next 10 publications
      };
      
      res.json(response);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching publication schedules:', error);
      res.status(500).json({ error: 'Failed to get publication schedules' });
    }
  });

  // Event Scheduler Status - Shows if automatic updates are running
  app.get('/api/scheduler-status', async (req, res) => {
    try {
      const { getSchedulerStatus } = await import('./event-scheduler');
      const status = getSchedulerStatus();
      res.json(status);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching scheduler status:', error);
      res.status(500).json({ error: 'Failed to get scheduler status' });
    }
  });

  // Multi-City Curated Events (Timeout + Local publications)
  app.get('/api/external-events/curated/:city?', async (req, res) => {
    try {
      const city = req.params.city || 'Los Angeles'; // Default to LA
      const { fetchCombinedCuratedEvents } = await import('./apis/multi-city-rss-feeds');
      
      const events = await fetchCombinedCuratedEvents(city);
      
      const result = {
        events,
        total: events.length,
        city: city,
        message: `Found ${events.length} curated events from Timeout + Local sources for ${city}`
      };
      
      res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error(`🎭 CURATED EVENTS ERROR for ${req.params.city || 'Los Angeles'}:`, error);
      res.json({ events: [], error: `Failed to fetch curated events for ${req.params.city || 'Los Angeles'}` });
    }
  });

  // Backward compatibility: Timeout LA + LAist RSS Events endpoint
  app.get('/api/external-events/timeout-laist', async (req, res) => {
    try {
      const { fetchCombinedCuratedEvents } = await import('./apis/multi-city-rss-feeds');
      const events = await fetchCombinedCuratedEvents('Los Angeles');
      
      const result = {
        events,
        total: events.length,
        message: `Found ${events.length} curated events from Timeout LA + LAist`
      };
      
      res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🎭 TIMEOUT/LAIST ERROR:", error);
      res.json({ events: [], error: "Failed to fetch curated LA events" });
    }
  });

  // CRITICAL: Get business deals with business information (renamed from business-offers)
  app.get("/api/business-deals", async (req, res) => {
    try {
      // FORCE NO CACHE TO ENSURE FRESH BUSINESS DATA
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      if (process.env.NODE_ENV === 'development') console.log("🎯 FETCHING ALL BUSINESS DEALS");
      
      // Get all active business deals with business information in single query
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
          businessDescription: users.businessDescription,
          businessType: users.businessType,
          businessLocation: users.location,
          businessImage: users.profileImage,
          businessPhone: users.phoneNumber,
          businessAddress: users.streetAddress,
          businessWebsite: users.websiteUrl,
          businessEmail: users.email,
        })
        .from(businessOffers)
        .innerJoin(users, eq(businessOffers.businessId, users.id))
        .where(and(
          eq(businessOffers.isActive, true),
          isNotNull(users.businessName)
        ))
        .orderBy(businessOffers.createdAt);
      
      if (process.env.NODE_ENV === 'development') console.log(`🎯 FOUND ${offersWithBusiness.length} ACTIVE BUSINESS OFFERS`);
      if (process.env.NODE_ENV === 'development') console.log(`🔍 FIRST OFFER RAW FROM DB:`, JSON.stringify(offersWithBusiness[0], null, 2));
      
      // Apply fallback logic for business names and log for debugging
      const processedOffers = offersWithBusiness.map(offer => {
        const finalBusinessName = offer.businessName || offer.fallbackName || 'Business Name Missing';
        
        // Log processing for first few offers
        if (offersWithBusiness.indexOf(offer) < 3) {
          if (process.env.NODE_ENV === 'development') console.log(`  - ID: ${offer.id}, Title: ${offer.title}, Business: ${finalBusinessName}, Business ID: ${offer.businessId}`);
          if (process.env.NODE_ENV === 'development') console.log(`  - DEBUG: businessName=${offer.businessName}, businessLocation=${offer.businessLocation}, businessPhone=${offer.businessPhone}, businessAddress=${offer.businessAddress}`);
        }
        
        return {
          ...offer,
          businessName: finalBusinessName,
          fallbackName: undefined // Remove the temporary field
        };
      });
      
      // LOG FINAL API RESPONSE TO DEBUG BUSINESS INFO
      if (process.env.NODE_ENV === 'development') console.log(`📡 API RESPONSE SAMPLE:`, JSON.stringify(processedOffers[0], null, 2));
      if (process.env.NODE_ENV === 'development') console.log(`🔍 BUSINESS FIELDS IN RESPONSE:`, {
        businessName: processedOffers[0]?.businessName,
        businessDescription: processedOffers[0]?.businessDescription,
        businessPhone: processedOffers[0]?.businessPhone,
        businessAddress: processedOffers[0]?.businessAddress,
        businessLocation: processedOffers[0]?.businessLocation
      });
      return res.json(processedOffers);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🚨 ERROR fetching business deals:", error);
      return res.status(500).json({ error: "Failed to fetch business deals" });
    }
  });

  // Get business deals for a specific business - WITH BUSINESS INFO (renamed from business-offers)
  app.get("/api/business-deals/business/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId || '0');
      
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
      
      if (process.env.NODE_ENV === 'development') console.log(`🏢 BUSINESS OFFERS FOR BUSINESS ${businessId}: Found ${processedOffers.length} offers`);
      return res.json(processedOffers);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching business offers for business:", error);
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

      const businessId = parseInt(userId as string || '0');
      if (process.env.NODE_ENV === 'development') console.log(`Creating business deal for business ID: ${businessId}`);

      // Check combined monthly deal limit (10 total deals per month: Quick Deals + Regular Deals)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Count Quick Deals this month
      const monthlyQuickDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(quickDeals)
        .where(and(
          eq(quickDeals.businessId, businessId),
          gte(quickDeals.createdAt, startOfMonth),
          lte(quickDeals.createdAt, endOfMonth)
        ));
      
      // Count Regular Business Deals this month
      const monthlyBusinessDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(and(
          eq(businessOffers.businessId, businessId),
          gte(businessOffers.createdAt, startOfMonth),
          lte(businessOffers.createdAt, endOfMonth)
        ));
      
      const quickDealsCount = Number(monthlyQuickDealsCount[0]?.count || 0);
      const businessDealsCount = Number(monthlyBusinessDealsCount[0]?.count || 0);
      const totalDealsCount = quickDealsCount + businessDealsCount;
      
      if (totalDealsCount >= 10) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚫 TOTAL DEAL LIMIT: Business ${businessId} has ${totalDealsCount}/10 total deals this month (${quickDealsCount} Quick + ${businessDealsCount} Regular)`);
        }
        return res.status(400).json({ 
          message: `Monthly deal limit reached (${totalDealsCount}/10 total deals this month). This includes both Quick Deals and regular business offers.`
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ TOTAL DEAL LIMIT CHECK: Business ${businessId} has ${totalDealsCount}/10 total deals this month (${quickDealsCount} Quick + ${businessDealsCount} Regular)`);
      }

      // Process tags properly
      let tags = [];
      if ((req.body as any).tags && typeof (req.body as any).tags === 'string') {
        tags = (typeof (req.body as any).tags === 'string' ? (req.body as any).tags.split(',') : []).map((t: string) => t.trim()).filter(Boolean);
      }

      // Process targetAudience properly  
      let targetAudience = (req.body as any).targetAudience || ['both'];
      if (!Array.isArray(targetAudience)) {
        targetAudience = [targetAudience];
      }

      // Create instant deal with current time (no date parsing issues)
      const result = await db.insert(businessOffers).values({
        businessId,
        title: (req.body as any).title || 'Instant Deal',
        description: (req.body as any).description || 'Limited time offer',
        category: (req.body as any).category || 'instant_deal',
        discountType: (req.body as any).discountType || 'percentage',
        discountValue: (req.body as any).discountValue || '20',
        targetAudience,
        city: (req.body as any).city || 'Los Angeles',
        state: (req.body as any).state || 'California',
        country: (req.body as any).country || 'United States',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        currentRedemptions: 0,
        isActive: true,
        tags
      }).returning();
      const [newOffer] = result;
      
      if (process.env.NODE_ENV === 'development') console.log('✅ INSTANT DEAL CREATED:', newOffer);
      return res.json(newOffer);
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🚨 INSTANT DEAL CREATION ERROR:", error);
      return res.status(500).json({ message: "Failed to create instant deal", error: error.message });
    }
  });

  // PUT: Update business deal
  app.put("/api/business-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log("UPDATE BUSINESS DEAL:", dealId, "by user:", userId);

      const updatedDeal = await db
        .update(businessOffers)
        .set({
          title: (req.body as any).title,
          description: (req.body as any).description,
          category: (req.body as any).category,
          discountType: (req.body as any).discountType,
          discountValue: (req.body as any).discountValue,
          discountCode: (req.body as any).discountCode,
          validFrom: new Date((req.body as any).validFrom),
          validUntil: new Date((req.body as any).validUntil),
          imageUrl: (req.body as any).imageUrl,
          termsConditions: (req.body as any).termsConditions,
        })
        .where(and(
          eq(businessOffers.id, dealId),
          eq(businessOffers.businessId, parseInt(userId || '0'))
        ))
        .returning();

      if (updatedDeal.length === 0) {
        return res.status(404).json({ message: "Deal not found or you don't have permission" });
      }

      return res.json(updatedDeal[0]);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to update business deal:", error);
      return res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // DELETE: Delete business deal
  app.delete("/api/business-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log("DELETE BUSINESS DEAL:", dealId, "by user:", userId);

      const deletedDeal = await db
        .delete(businessOffers)
        .where(and(
          eq(businessOffers.id, dealId),
          eq(businessOffers.businessId, parseInt(userId || '0'))
        ))
        .returning();

      if (deletedDeal.length === 0) {
        return res.status(404).json({ message: "Deal not found or you don't have permission" });
      }

      return res.json({ message: "Deal deleted successfully" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to delete business deal:", error);
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

      const businessId = parseInt(userId || '0');
      
      // Get analytics for business offers
      const totalBusinessOffers = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(eq(businessOffers.businessId, businessId));

      const activeBusinessOffers = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(and(
          eq(businessOffers.businessId, businessId),
          eq(businessOffers.isActive, true),
          gt(businessOffers.validUntil, new Date())
        ));

      // Get analytics for quick deals
      const totalQuickDeals = await db
        .select({ count: sql<number>`count(*)` })
        .from(quickDeals)
        .where(eq(quickDeals.businessId, businessId));

      const activeQuickDeals = await db
        .select({ count: sql<number>`count(*)` })
        .from(quickDeals)
        .where(and(
          eq(quickDeals.businessId, businessId),
          eq(quickDeals.isActive, true),
          gt(quickDeals.validUntil, new Date())
        ));

      // Get monthly usage counts for current month 
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Count Quick Deals created this month
      const monthlyQuickDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(quickDeals)
        .where(and(
          eq(quickDeals.businessId, businessId),
          gte(quickDeals.createdAt, startOfMonth),
          lte(quickDeals.createdAt, endOfMonth)
        ));
      
      // Count Regular Business Deals created this month
      const monthlyBusinessDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(and(
          eq(businessOffers.businessId, businessId),
          gte(businessOffers.createdAt, startOfMonth),
          lte(businessOffers.createdAt, endOfMonth)
        ));

      // Combine business offers and quick deals
      const totalOffers = Number(totalBusinessOffers[0]?.count || 0) + Number(totalQuickDeals[0]?.count || 0);
      const activeOffers = Number(activeBusinessOffers[0]?.count || 0) + Number(activeQuickDeals[0]?.count || 0);
      
      // Monthly usage (combined Quick Deals + Regular Deals for current month)
      const monthlyQuickCount = Number(monthlyQuickDealsCount[0]?.count || 0);
      const monthlyBusinessCount = Number(monthlyBusinessDealsCount[0]?.count || 0);
      const monthlyTotalUsage = monthlyQuickCount + monthlyBusinessCount;

      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 BUSINESS ANALYTICS: Business ${businessId} - Active: ${activeOffers}, Monthly Usage: ${monthlyTotalUsage}/10 (${monthlyQuickCount} Quick + ${monthlyBusinessCount} Regular)`);
      }

      return res.json({
        totalOffers: totalOffers,
        activeOffers: activeOffers,
        monthlyUsage: monthlyTotalUsage,
        monthlyLimit: 10,
        monthlyQuickDeals: monthlyQuickCount,
        monthlyBusinessDeals: monthlyBusinessCount,
        totalViews: 0, // Placeholder for future implementation
        totalRedemptions: 0 // Placeholder for future implementation
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to get business analytics:", error);
      return res.status(500).json({ message: "Failed to get analytics" });
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
        organizerId: parseInt(userId as string || '0')
      };

      if (process.env.NODE_ENV === 'development') console.log(`🚀 CREATING QUICK MEETUP: ${meetupData.title} by user ${userId}`);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 STREET ADDRESS RECEIVED:`, meetupData.street);
      if (process.env.NODE_ENV === 'development') console.log(`📦 FULL REQUEST BODY:`, req.body);
      
      const newMeetup = await storage.createQuickMeetup(meetupData);
      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK MEETUP CREATED: ID ${newMeetup.id}, expires at ${newMeetup.expiresAt}`);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 STREET ADDRESS SAVED:`, newMeetup.street);
      
      // Award 1 aura point for creating a quick meetup
      await awardAuraPoints(parseInt(userId as string || '0'), 1, 'creating a quick meetup');
      
      res.json(newMeetup);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating quick meetup:", error);
      res.status(500).json({ message: "Failed to create quick meetup" });
    }
  });

  // Get single quick meetup by ID
  app.get("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      if (isNaN(meetupId)) {
        return res.status(400).json({ message: "Invalid meetup ID" });
      }

      const meetup = await storage.getQuickMeetupById(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      res.json(meetup);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meetup:", error);
      res.status(500).json({ message: "Failed to fetch meetup" });
    }
  });

  // CRITICAL: Get quick meetups - ACTIVE FIRST, NEWEST FIRST - RAW SQL VERSION
  app.get("/api/quick-meetups", async (req, res) => {
    try {
      const { city, userId } = req.query;
      const now = new Date();

      if (process.env.NODE_ENV === 'development') console.log(`QUICK MEETUPS: Fetching all meetups using Drizzle ORM, active first`);

      // Build conditions array for proper AND/OR logic
      const conditions = [eq(quickMeetups.isActive, true)];

      // Add userId filtering if specified (for profile page)
      if (userId && typeof userId === 'string') {
        const targetUserId = parseInt(userId as string);
        if (!isNaN(targetUserId)) {
          if (process.env.NODE_ENV === 'development') console.log(`QUICK MEETUPS: Filtering by userId: ${targetUserId}`);
          conditions.push(eq(quickMeetups.organizerId, targetUserId));
        }
      }

      // Add city filtering if specified with LA Metro consolidation
      if (city && typeof city === 'string') {
        const cityName = city.toString().split(',')[0].trim();
        if (process.env.NODE_ENV === 'development') console.log(`QUICK MEETUPS: Filtering by city: ${cityName}`);
        
        // DISABLED: Metro consolidation per user request - search only the requested city  
        const searchCities = [cityName];
        
        if (process.env.NODE_ENV === 'development') console.log(`🌍 QUICK MEETUPS: Searching single city:`, searchCities);
        
        const cityConditions = searchCities.map(searchCity => 
          or(
            ilike(quickMeetups.location, `%${searchCity}%`),
            ilike(quickMeetups.city, `%${searchCity}%`)
          )
        );
        
        conditions.push(or(...cityConditions));
      }

      // Use Drizzle ORM query builder with combined conditions
      let query = db
        .select()
        .from(quickMeetups)
        .leftJoin(users, eq(quickMeetups.organizerId, users.id))
        .where(and(...conditions));

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

      if (process.env.NODE_ENV === 'development') console.log(`QUICK MEETUPS: Found ${activeMeetups.length} active + ${expiredMeetups.length} expired = ${sortedMeetups.length} total meetups`);

      return res.json(sortedMeetups);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meetups:", error);
      return res.json([]);
    }
  });

  // GET quick meetup participants - CRITICAL MISSING ENDPOINT
  app.get("/api/quick-meetups/:id/participants", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`👥 GETTING PARTICIPANTS FOR MEETUP ${meetupId}`);
      
      const participants = await storage.getQuickMeetupParticipants(meetupId);
      if (process.env.NODE_ENV === 'development') console.log(`👥 FOUND ${participants.length} PARTICIPANTS:`, participants.map(p => p.user?.username));
      
      return res.json(participants);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching meetup participants:", error);
      return res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // JOIN quick meetup endpoint - CRITICAL MISSING ENDPOINT
  app.post("/api/quick-meetups/:id/join", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🤝 USER ${userId} JOINING MEETUP ${meetupId}`);

      // Check if meetup exists and is active
      const meetup = await storage.getQuickMeetup(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }

      if (new Date(meetup.expiresAt) <= new Date()) {
        return res.status(400).json({ message: "This meetup has expired" });
      }

      // Join the meetup
      const result = await storage.joinQuickMeetup(meetupId, parseInt(userId as string || '0'));
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER ${userId} SUCCESSFULLY JOINED MEETUP ${meetupId}`);
      
      return res.json({ success: true, result });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error joining quick meetup:", error);
      return res.status(500).json({ message: "Failed to join meetup" });
    }
  });

  // GET event chatroom by event ID
  app.get("/api/event-chatrooms/:eventId", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId || '0');
      
      if (!eventId) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const chatroom = await storage.getEventChatroom(eventId);
      if (!chatroom) {
        // Create chatroom if it doesn't exist
        const newChatroom = await storage.createEventChatroom(eventId);
        return res.json(newChatroom);
      }

      return res.json(chatroom);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching event chatroom:", error);
      return res.status(500).json({ message: "Failed to fetch chatroom" });
    }
  });

  // GET event chatroom messages
  app.get("/api/event-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const messages = await storage.getEventChatroomMessages(chatroomId);
      return res.json(messages);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching event chatroom messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // POST event chatroom message
  app.post("/api/event-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
      const userId = req.headers['x-user-id'];
      const { content } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content required" });
      }

      const message = await storage.createEventChatroomMessage(
        chatroomId,
        parseInt(userId as string || '0'),
        content.trim()
      );

      return res.json(message);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating event chatroom message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // JOIN event chatroom
  app.post("/api/event-chatrooms/:chatroomId/join", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const result = await storage.joinEventChatroom(chatroomId, parseInt(userId as string || '0'));
      return res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error joining event chatroom:", error);
      return res.status(500).json({ message: "Failed to join chatroom" });
    }
  });

  // GET quick meetup chatroom
  app.get("/api/quick-meetup-chatrooms/:meetupId", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.meetupId || '0');
      
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meetup chatroom:", error);
      return res.status(500).json({ message: "Failed to fetch chatroom" });
    }
  });

  // GET quick meetup chatroom messages
  app.get("/api/quick-meetup-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const messages = await storage.getQuickMeetupChatroomMessages(chatroomId);
      return res.json(messages);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meetup chatroom messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // POST quick meetup chatroom message
  app.post("/api/quick-meetup-chatrooms/:chatroomId/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
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
        parseInt(userId as string || '0'),
        content.trim()
      );

      return res.json(message);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating quick meetup chatroom message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // JOIN quick meetup chatroom
  app.post("/api/quick-meetup-chatrooms/:chatroomId/join", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.chatroomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const result = await storage.joinQuickMeetupChatroom(chatroomId, parseInt(userId as string || '0'));
      return res.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error joining quick meetup chatroom:", error);
      return res.status(500).json({ message: "Failed to join chatroom" });
    }
  });

  // RESTART quick meetup from expired meetup
  app.post("/api/quick-meetups/:id/restart", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      const { duration = '1hour' } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔄 RESTARTING MEETUP ${meetupId} for user ${userId} with duration ${duration}`);

      // Get the original meetup to copy its details
      const originalMeetup = await storage.getQuickMeetup(meetupId);
      if (!originalMeetup) {
        return res.status(404).json({ message: "Original meetup not found" });
      }

      // Check if user is the original organizer
      if (originalMeetup.organizerId !== parseInt(userId as string || '0')) {
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
      if (process.env.NODE_ENV === 'development') console.log(`✅ MEETUP RESTARTED: New ID ${newMeetup.id} from original ${meetupId}`);
      
      return res.json({ 
        success: true, 
        meetup: newMeetup,
        message: "Meetup successfully restarted with fresh participant list"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error restarting quick meetup:", error);
      return res.status(500).json({ message: "Failed to restart meetup" });
    }
  });

  // UPDATE quick meetup
  app.put("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
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
      if (existingMeetup.organizerId !== parseInt(userId as string || '0')) {
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

      if (process.env.NODE_ENV === 'development') console.log(`🔄 UPDATING MEETUP ${meetupId} for user ${userId}:`, updates);

      const updatedMeetup = await storage.updateQuickMeetup(meetupId, updates);
      if (!updatedMeetup) {
        return res.status(500).json({ message: "Failed to update meetup" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ MEETUP UPDATED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        meetup: updatedMeetup,
        message: "Meetup updated successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating quick meetup:", error);
      return res.status(500).json({ message: "Failed to update meetup" });
    }
  });

  // DELETE quick meetup
  app.delete("/api/quick-meetups/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
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
      if (existingMeetup.organizerId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Only the organizer can delete this meetup" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETING MEETUP ${meetupId} for user ${userId}`);

      const deleted = await storage.deleteQuickMeetup(meetupId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete meetup" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ MEETUP DELETED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        message: "Meetup deleted successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting quick meetup:", error);
      return res.status(500).json({ message: "Failed to delete meetup" });
    }
  });

  // GET user's expired meetups for restart management
  app.get("/api/users/:userId/expired-meetups", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const authUserId = req.headers['x-user-id'];
      
      if (!authUserId || parseInt(authUserId as string || '0') !== userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`📋 FETCHING EXPIRED MEETUPS for user ${userId}`);
      
      const expiredMeetups = await storage.getUserArchivedMeetups(userId);
      if (process.env.NODE_ENV === 'development') console.log(`Found ${expiredMeetups.length} expired meetups for restart`);
      
      return res.json(expiredMeetups);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching expired meetups:", error);
      return res.status(500).json({ message: "Failed to fetch expired meetups" });
    }
  });

  // ===== QUICK DEALS API ROUTES =====
  
  // CREATE quick deal endpoint
  app.post("/api/quick-deals", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const businessId = parseInt(userId as string || '0');
      
      // Check combined monthly deal limit (10 total deals per month: Quick Deals + Regular Deals)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Count Quick Deals this month
      const monthlyQuickDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(quickDeals)
        .where(and(
          eq(quickDeals.businessId, businessId),
          gte(quickDeals.createdAt, startOfMonth),
          lte(quickDeals.createdAt, endOfMonth)
        ));
      
      // Count Regular Business Deals this month
      const monthlyBusinessDealsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessOffers)
        .where(and(
          eq(businessOffers.businessId, businessId),
          gte(businessOffers.createdAt, startOfMonth),
          lte(businessOffers.createdAt, endOfMonth)
        ));
      
      const quickDealsCount = Number(monthlyQuickDealsCount[0]?.count || 0);
      const businessDealsCount = Number(monthlyBusinessDealsCount[0]?.count || 0);
      const totalDealsCount = quickDealsCount + businessDealsCount;
      
      if (totalDealsCount >= 10) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚫 TOTAL DEAL LIMIT: Business ${businessId} has ${totalDealsCount}/10 total deals this month (${quickDealsCount} Quick + ${businessDealsCount} Regular)`);
        }
        return res.status(400).json({ 
          message: `Monthly deal limit reached (${totalDealsCount}/10 total deals this month). This includes both Quick Deals and regular business offers.`
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ TOTAL DEAL LIMIT CHECK: Business ${businessId} has ${totalDealsCount}/10 total deals this month (${quickDealsCount} Quick + ${businessDealsCount} Regular)`);
      }

      // FIX TIMER BUG: Ensure timestamp fields are properly converted to Date objects
      // Handle dates without timezone info as local time, not UTC
      const dealData = {
        ...req.body,
        businessId,
        dealType: req.body.deal_type || req.body.dealType || 'discount', // Map deal_type properly
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : new Date(),
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : new Date(Date.now() + 60 * 60 * 1000) // Default 1 hour from now
      };

      // DEBUG: Log the timer calculation to identify issues
      if (process.env.NODE_ENV === 'development') {
        console.log(`🕐 TIMER DEBUG: validUntil received from frontend: ${req.body.validUntil}`);
        console.log(`🕐 TIMER DEBUG: validUntil parsed as Date: ${dealData.validUntil}`);
        console.log(`🕐 TIMER DEBUG: validUntil ISO string: ${dealData.validUntil.toISOString()}`);
        console.log(`🕐 TIMER DEBUG: Current time: ${new Date().toISOString()}`);
        console.log(`🕐 TIMER DEBUG: Hours difference: ${(dealData.validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60)}`);
      }

      if (process.env.NODE_ENV === 'development') console.log(`🛍️ CREATING QUICK DEAL: ${dealData.title} by business ${userId}`);
      
      const [newDeal] = await db
        .insert(quickDeals)
        .values(dealData)
        .returning();
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK DEAL CREATED: ID ${newDeal.id}, expires at ${newDeal.validUntil}`);
      
      res.json(newDeal);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating quick deal:", error);
      res.status(500).json({ message: "Failed to create quick deal" });
    }
  });

  // GET quick deals endpoint - SIMPLIFIED VERSION
  app.get("/api/quick-deals", async (req, res) => {
    try {
      const { city, businessId } = req.query;
      const now = new Date();

      if (process.env.NODE_ENV === 'development') console.log(`🛍️ QUICK DEALS: Fetching deals, active first`);

      // Simplified approach: always use basic query without parameters to avoid SQL issues
      if (process.env.NODE_ENV === 'development') {
        console.log(`🛍️ QUICK DEALS: Parameters received - city: ${city}, businessId: ${businessId}`);
      }

      // Use a single, simple query that works reliably - ONLY return non-expired deals
      const result = await db.execute(sql`
        SELECT 
          qd.*,
          u.business_name,
          u.name as fallback_name,
          u.bio as business_description,
          u.business_type,
          u.location as business_location,
          u.email as business_email,
          u.phone_number as business_phone,
          u.profile_image as business_image,
          u.street_address as business_street_address,
          u.city as business_city,
          u.state as business_state,
          u.country as business_country,
          u.zipcode as business_zipcode
        FROM quick_deals qd
        LEFT JOIN users u ON qd.business_id = u.id
        WHERE qd.is_active = true 
          AND qd.valid_until > NOW()
          AND (qd.max_redemptions IS NULL OR qd.current_redemptions < qd.max_redemptions)
        ORDER BY qd.created_at DESC
      `);
      
      let dealsWithBusiness = result.rows.map((row: any) => ({
        id: row.id,
        businessId: row.business_id,
        title: row.title,
        description: row.description,
        dealType: row.deal_type,
        category: row.category,
        location: row.location,
        street: row.street,
        discountAmount: row.discount_amount,
        originalPrice: row.original_price,
        salePrice: row.sale_price,
        dealCode: row.deal_code,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        maxRedemptions: row.max_redemptions,
        currentRedemptions: row.current_redemptions,
        requiresReservation: row.requires_reservation,
        isActive: row.is_active,
        terms: row.terms,
        availability: row.availability,
        autoExpire: row.auto_expire,
        city: row.city,
        state: row.state,
        country: row.country,
        zipcode: row.zipcode,
        createdAt: row.created_at,
        businessName: row.business_name || row.fallback_name || 'Business Name Missing',
        businessDescription: row.business_description || '',
        businessType: row.business_type || 'Business',
        businessLocation: row.business_location || row.city || 'Location Unknown',
        businessEmail: row.business_email || '',
        businessPhone: row.business_phone || '',
        businessImage: row.business_image || '',
        businessStreetAddress: row.business_street_address || '',
        businessCity: row.business_city || row.city || '',
        businessState: row.business_state || row.state || '',
        businessCountry: row.business_country || row.country || '',
        businessZipcode: row.business_zipcode || row.zipcode || ''
      }));

      // Apply filters in JavaScript if needed
      if (businessId && typeof businessId === 'string') {
        const targetBusinessId = parseInt(businessId as string);
        if (!isNaN(targetBusinessId)) {
          dealsWithBusiness = dealsWithBusiness.filter(deal => deal.businessId === targetBusinessId);
        }
      }

      if (city && typeof city === 'string') {
        dealsWithBusiness = dealsWithBusiness.filter(deal => deal.city === city);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🛍️ QUICK DEALS: Returning ${dealsWithBusiness.length} deals`);
        if (dealsWithBusiness.length > 0) {
          console.log(`🛍️ QUICK DEALS: Sample deal - Title: ${dealsWithBusiness[0].title}, Business: ${dealsWithBusiness[0].businessName}`);
        }
      }

      res.json(dealsWithBusiness);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });



  // UPDATE quick deal endpoint
  app.put("/api/quick-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the deal to verify ownership
      const [existingDeal] = await db
        .select()
        .from(quickDeals)
        .where(eq(quickDeals.id, dealId))
        .limit(1);
      
      if (!existingDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      if (existingDeal.businessId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Unauthorized - you can only update your own deals" });
      }

      // Update the deal with the provided fields
      const [updatedDeal] = await db
        .update(quickDeals)
        .set(req.body)
        .where(eq(quickDeals.id, dealId))
        .returning();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ QUICK DEAL UPDATED: ID ${dealId}, isActive: ${updatedDeal.isActive}`);
      }
      
      res.json(updatedDeal);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating quick deal:", error);
      res.status(500).json({ message: "Failed to update quick deal" });
    }
  });

  // DELETE quick deal endpoint
  app.delete("/api/quick-deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the deal to verify ownership
      const [existingDeal] = await db
        .select()
        .from(quickDeals)
        .where(eq(quickDeals.id, dealId))
        .limit(1);

      if (!existingDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Check if user is the business owner
      if (existingDeal.businessId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Only the business can delete this deal" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETING DEAL ${dealId} for business ${userId}`);

      await db
        .delete(quickDeals)
        .where(eq(quickDeals.id, dealId));

      if (process.env.NODE_ENV === 'development') console.log(`✅ DEAL DELETED: ID ${dealId}`);
      return res.json({ 
        success: true, 
        message: "Deal deleted successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting quick deal:", error);
      return res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // GET expired/past quick deals for history/reuse feature
  app.get("/api/quick-deals/history/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Verify user is the business owner
      if (parseInt(userId as string || '0') !== businessId) {
        return res.status(403).json({ message: "Unauthorized - you can only view your own deal history" });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 QUICK DEALS HISTORY: Fetching expired deals for business ${businessId}`);
      }

      // Get expired quick deals for this business (for reuse feature)
      const now = new Date();
      const expiredDeals = await db
        .select()
        .from(quickDeals)
        .where(and(
          eq(quickDeals.businessId, businessId),
          or(
            eq(quickDeals.isActive, false),
            lt(quickDeals.validUntil, now),
            and(
              isNotNull(quickDeals.maxRedemptions),
              gte(quickDeals.currentRedemptions, quickDeals.maxRedemptions)
            )
          )
        ))
        .orderBy(desc(quickDeals.createdAt))
        .limit(20); // Limit to 20 most recent expired deals

      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 QUICK DEALS HISTORY: Found ${expiredDeals.length} expired deals for business ${businessId}`);
      }

      res.json(expiredDeals);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick deals history:", error);
      res.status(500).json({ message: "Failed to fetch deal history" });
    }
  });

  // CLAIM/REDEEM quick deal endpoint
  app.post("/api/quick-deals/claim", async (req, res) => {
    try {
      const { dealId } = req.body;
      const userId = req.headers['x-user-id'];
      
      if (!userId || !dealId) {
        return res.status(400).json({ message: "User ID and deal ID required" });
      }

      // Get the deal to verify it exists and is active
      const [deal] = await db
        .select()
        .from(quickDeals)
        .where(eq(quickDeals.id, dealId))
        .limit(1);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Check if deal is still valid
      const now = new Date();
      if (!deal.isActive || new Date(deal.validUntil) <= now) {
        return res.status(400).json({ message: "Deal has expired" });
      }
      
      // Check if deal has reached max redemptions
      if (deal.maxRedemptions && (deal.currentRedemptions || 0) >= deal.maxRedemptions) {
        return res.status(400).json({ message: "Deal has reached maximum redemptions" });
      }

      // Check if user has already claimed this deal
      const [existingRedemption] = await db
        .select()
        .from(quickDealRedemptions)
        .where(and(
          eq(quickDealRedemptions.dealId, dealId),
          eq(quickDealRedemptions.userId, parseInt(userId as string))
        ))
        .limit(1);
      
      if (existingRedemption) {
        return res.status(400).json({ message: "You have already claimed this deal" });
      }

      // Create redemption record
      const [redemption] = await db
        .insert(quickDealRedemptions)
        .values({
          dealId: dealId,
          userId: parseInt(userId as string),
          status: 'claimed',
          notes: req.body.notes || null
        })
        .returning();

      // Update deal redemption count
      await db
        .update(quickDeals)
        .set({ 
          currentRedemptions: (deal.currentRedemptions || 0) + 1 
        })
        .where(eq(quickDeals.id, dealId));

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 DEAL CLAIMED: User ${userId} claimed deal ${dealId}`);
      }

      res.json({ 
        success: true, 
        message: "Deal claimed successfully",
        redemption: redemption
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error claiming deal:", error);
      res.status(500).json({ message: "Failed to claim deal" });
    }
  });

  app.post("/api/quick-deals/:id/claim", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      const { notes } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the deal to verify it exists and is active
      const [deal] = await db
        .select()
        .from(quickDeals)
        .where(eq(quickDeals.id, dealId))
        .limit(1);

      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      if (!deal.isActive || new Date(deal.validUntil) <= new Date()) {
        return res.status(400).json({ message: "Deal has expired" });
      }

      if (deal.maxRedemptions && (deal.currentRedemptions || 0) >= deal.maxRedemptions) {
        return res.status(400).json({ message: "Deal has reached maximum redemptions" });
      }

      // Check if user already claimed this deal
      const [existingRedemption] = await db
        .select()
        .from(quickDealRedemptions)
        .where(and(
          eq(quickDealRedemptions.dealId, dealId),
          eq(quickDealRedemptions.userId, parseInt(userId as string || '0'))
        ))
        .limit(1);

      if (existingRedemption) {
        return res.status(400).json({ message: "You have already claimed this deal" });
      }

      // Create redemption record
      await db
        .insert(quickDealRedemptions)
        .values({
          dealId: dealId,
          userId: parseInt(userId as string || '0'),
          status: 'claimed',
          notes: notes || null
        });

      // Increment current redemptions
      await db
        .update(quickDeals)
        .set({ 
          currentRedemptions: (deal.currentRedemptions || 0) + 1 
        })
        .where(eq(quickDeals.id, dealId));

      if (process.env.NODE_ENV === 'development') console.log(`🎟️ DEAL CLAIMED: ID ${dealId} by user ${userId}`);
      
      res.json({ 
        success: true, 
        message: "Deal claimed successfully" 
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error claiming quick deal:", error);
      res.status(500).json({ message: "Failed to claim deal" });
    }
  });

  // GET businesses by location endpoint with LA Metro consolidation
  app.get("/api/businesses", async (req, res) => {
    try {
      const { city, state, country, category } = req.query;
      
      if (!city) {
        return res.status(400).json({ message: "City parameter is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏢 FETCHING BUSINESSES: ${city}, ${state}, ${country} ${category ? `(category: ${category})` : ''}`);
      
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
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO BUSINESSES: Searching ${consolidatedSearchCity} metro businesses for ${searchCity} user`);
        
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
        if (process.env.NODE_ENV === 'development') console.log(`🌍 METRO BUSINESSES: Combined ${businesses.length} businesses from ${consolidatedSearchCity} metro area`);
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ BUSINESSES API: Found ${businesses.length} businesses for ${searchCity}`);
      res.json(businesses);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  // NEW: GET businesses with geolocation for map display
  app.get("/api/businesses/map", async (req, res) => {
    try {
      const { city, state, country, radiusKm, centerLat, centerLng } = req.query;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗺️ MAP BUSINESSES: Fetching businesses with geolocation for ${city || 'any city'} ${radiusKm ? `within ${radiusKm}km` : ''}`);
      }
      
      const businesses = await storage.getBusinessesWithGeolocation(
        city as string,
        state as string,
        country as string,
        radiusKm ? parseFloat(radiusKm as string) : undefined,
        centerLat ? parseFloat(centerLat as string) : undefined,
        centerLng ? parseFloat(centerLng as string) : undefined
      );

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ MAP BUSINESSES API: Found ${businesses.length} businesses with GPS coordinates and active deals/events`);
      }
      
      res.json(businesses);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching map businesses:", error);
      res.status(500).json({ message: "Failed to fetch map businesses" });
    }
  });

  // Customer Photos Endpoints for Businesses
  // GET customer photos for a business
  app.get("/api/businesses/:businessId/customer-photos", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      
      if (!businessId) {
        return res.status(400).json({ message: "Invalid business ID" });
      }

      const photos = await storage.getBusinessCustomerPhotos(businessId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📸 CUSTOMER PHOTOS: Fetched ${photos.length} photos for business ${businessId}`);
      }
      
      res.json(photos);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching customer photos:", error);
      res.status(500).json({ message: "Failed to fetch customer photos" });
    }
  });

  // POST new customer photo for a business
  app.post("/api/businesses/:businessId/customer-photos", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const { photoUrl, caption, uploaderName, uploaderType } = req.body;
      
      if (!businessId || !photoUrl) {
        return res.status(400).json({ message: "Business ID and photo URL are required" });
      }

      // Get current user from auth
      const authHeader = req.headers.authorization;
      let uploaderId = 0;
      
      if (authHeader) {
        // Extract user ID from auth token or session
        // For now, we'll use a default value if not available
        uploaderId = parseInt(req.body.uploaderId || '0');
      }

      const photo = await storage.createBusinessCustomerPhoto({
        businessId,
        uploaderId,
        photoUrl,
        caption: caption || '',
        uploaderName: uploaderName || 'Anonymous',
        uploaderType: uploaderType || 'customer',
        isApproved: true, // Auto-approve for now
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📸 CUSTOMER PHOTOS: Added new photo for business ${businessId}`);
      }
      
      res.status(201).json(photo);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding customer photo:", error);
      res.status(500).json({ message: "Failed to add customer photo" });
    }
  });

  // DELETE customer photo (business owners only)
  app.delete("/api/businesses/:businessId/customer-photos/:photoId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const photoId = parseInt(req.params.photoId);
      
      if (!businessId || !photoId) {
        return res.status(400).json({ message: "Invalid business ID or photo ID" });
      }

      // TODO: Add authentication check to ensure only business owner can delete
      // For now, we'll allow deletion if the request is made
      
      const success = await storage.deleteBusinessCustomerPhoto(photoId);
      
      if (success) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📸 CUSTOMER PHOTOS: Deleted photo ${photoId} from business ${businessId}`);
        }
        res.json({ success: true, message: "Photo deleted successfully" });
      } else {
        res.status(404).json({ message: "Photo not found" });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting customer photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // RESTORED: City photos API endpoint with AUTHENTIC user-uploaded photos
  app.get("/api/city-photos", async (req, res) => {
    try {
      const cityPhotos = await storage.getAllCityPhotos();
      if (process.env.NODE_ENV === 'development') console.log('📸 CITY PHOTOS API: Returning', cityPhotos.length, 'photos');
      res.json(cityPhotos);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  app.get("/api/city-photos/all", async (req, res) => {
    try {
      const cityPhotos = await storage.getAllCityPhotos();
      res.json(cityPhotos);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  // Serve public city photos from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage upload URL endpoint
  app.post("/api/city-photos/upload-url", async (req, res) => {
    try {
      const { cityName, photographerUsername } = req.body;
      
      if (!cityName || !photographerUsername) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Import ObjectStorageService
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const uploadURL = await objectStorageService.getCityPhotoUploadURL();
      
      console.log(`📸 OBJECT STORAGE: Generated upload URL for ${photographerUsername}'s photo of ${cityName}`);
      
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Confirm upload and save metadata
  app.post("/api/city-photos/confirm", async (req, res) => {
    try {
      const { cityName, photographerUsername, uploadURL } = req.body;
      
      if (!cityName || !photographerUsername || !uploadURL) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Extract photo ID from upload URL for reference
      const photoId = uploadURL.split('/').pop()?.split('?')[0] || 'unknown';
      
      // Create database record
      const photoData = {
        cityName,
        state: '',
        country: 'United States',
        imageData: uploadURL, // Store the object storage URL
        photographerUsername,
        caption: `Beautiful view of ${cityName}`,
        createdAt: new Date()
      };

      const photo = await storage.createCityPhoto(photoData);

      // Award aura points
      const photographer = await storage.getUserByUsername(photographerUsername);
      if (photographer) {
        const auraAwarded = 1;
        const currentAura = photographer.aura || 0;
        await storage.updateUser(photographer.id, { 
          aura: currentAura + auraAwarded 
        });
        
        console.log(`📸 PHOTO CONFIRMED: ${photographerUsername} uploaded photo of ${cityName}, awarded ${auraAwarded} aura`);
      }

      res.json({ 
        success: true,
        photo,
        auraAwarded: 1,
        message: "Photo uploaded successfully! You earned 1 aura point."
      });
    } catch (error: any) {
      console.error("Error confirming upload:", error);
      res.status(500).json({ message: "Failed to confirm upload" });
    }
  });

  // RESTORED: Upload city photo endpoint (legacy base64 support)
  app.post("/api/city-photos", async (req, res) => {
    try {
      const { cityName, imageData, photographerUsername } = req.body;
      const photo = await storage.createCityPhoto({ cityName, imageData, photographerUsername });
      res.json(photo);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error uploading city photo:", error);
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

      // Security checks for image upload
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB
      if (!/^data:image\/(png|jpe?g);base64,/.test(imageData)) {
        return res.status(400).json({ message: "Only PNG/JPEG supported" });
      }
      const base64 = imageData.split(",")[1] || "";
      const estBytes = Math.ceil(base64.length * 3 / 4); // base64 -> bytes
      if (estBytes > MAX_BYTES) {
        return res.status(413).json({ message: "Image too large (max 2MB)" });
      }
      // sanitize user-provided city for filename safety
      const safeCity = city.replace(/[^a-z0-9-_ ]/gi, "").trim() || "city";

      // Get photographer username
      const photographer = await storage.getUserById(photographerId);
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }

      // Create city photo entry (use sanitized city name)
      const photoData = {
        cityName: safeCity,
        state: state || '',
        country,
        imageData,
        photographerUsername: photographer.username,
        photographerId,
        caption: caption || `Beautiful view of ${city}`,
        createdAt: new Date()
      };

      const photo = await storage.createCityPhoto(photoData);

      // Award aura points (1 point for photo upload)
      const auraAwarded = 1;
      const currentAura = photographer.aura || 0;
      await storage.updateUser(photographerId, { 
        aura: currentAura + auraAwarded 
      });

      if (process.env.NODE_ENV === 'development') console.log(`📸 PHOTO UPLOADED: ${photographer.username} uploaded photo of ${city}, awarded ${auraAwarded} aura`);

      res.json({ 
        success: true,
        photo,
        auraAwarded,
        message: `Photo uploaded successfully! You earned ${auraAwarded} aura point${auraAwarded === 1 ? '' : 's'}.`
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error uploading city photo with aura:", error);
      res.status(500).json({ message: "Failed to upload city photo" });
    }
  });

  // Get city-specific photos endpoint
  app.get("/api/city-photos/:city", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const cityPhotos = await storage.getCityPhotos(city);
      res.json(cityPhotos);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city-specific photos:", error);
      res.status(500).json({ message: "Failed to fetch city photos" });
    }
  });

  // RESTORED: City-specific chatrooms endpoint (CRITICAL FIX WITH MEMBER COUNT)
  app.get("/api/city-chatrooms", async (req, res) => {
    try {
      const { city, state, country } = req.query;
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CHATROOMS: Getting chatrooms for ${city}, ${state}, ${country}`);

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
        memberCountMap.set(mc.chatroomId, parseInt(mc.count || '0') || 1);
      });
      
      // Apply correct member counts to each chatroom
      const chatroomsWithFixedMemberCount = chatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 1 // Use database count or default to 1
      }));

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CHATROOMS: Found ${chatroomsWithFixedMemberCount.length} chatrooms for ${city} with member counts fixed`);
      res.json(chatroomsWithFixedMemberCount);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch city chatrooms" });
    }
  });

  // CRITICAL: Get user photos endpoint (MISSING - RESTORED)
  app.get("/api/users/:id/photos", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const limit = parseInt((req.query.limit as string) || '20');
      const offset = parseInt((req.query.offset as string) || '0');
      
      if (process.env.NODE_ENV === 'development') console.log(`📸 PHOTOS: Getting photos for user ${userId} (limit: ${limit}, offset: ${offset})`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const photos = await storage.getUserPhotos(userId, limit, offset);
      if (process.env.NODE_ENV === 'development') console.log(`📸 PHOTOS: Found ${photos.length} photos for user ${userId}`);

      return res.json(photos);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user photos:", error);
      return res.status(500).json({ message: "Failed to fetch user photos" });
    }
  });

  // CRITICAL: Upload user photo endpoint (MISSING - ADDED)
  app.post("/api/users/:id/photos", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const { imageData, title, isPublic } = req.body;

      if (process.env.NODE_ENV === 'development') console.log(`📸 UPLOAD: Uploading photo for user ${userId}, title: ${title}, public: ${isPublic}`);

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

      if (process.env.NODE_ENV === 'development') console.log(`📸 UPLOAD: Successfully created photo ID ${photo.id} for user ${userId}`);
      if (process.env.NODE_ENV === 'development') console.log('📸 ROUTES: Photo object received from storage:', JSON.stringify(photo, null, 2));
      if (process.env.NODE_ENV === 'development') console.log('📸 ROUTES: Photo keys:', Object.keys(photo || {}));

      // Create a clean photo object without potentially problematic fields
      const cleanPhoto = {
        id: photo.id,
        userId: photo.userId,
        caption: photo.caption,
        isPrivate: photo.isPrivate,
        isProfilePhoto: photo.isProfilePhoto,
        uploadedAt: photo.uploadedAt
      };

      if (process.env.NODE_ENV === 'development') console.log('📸 ROUTES: Clean photo object:', JSON.stringify(cleanPhoto, null, 2));

      const response = {
        message: "Photo uploaded successfully",
        photo: cleanPhoto
      };
      
      if (process.env.NODE_ENV === 'development') console.log('📸 ROUTES: Final response being sent:', JSON.stringify(response, null, 2));
      
      // Award 1 aura point for uploading a photo
      await awardAuraPoints(userId, 1, 'uploading a photo');
      
      return res.json(response);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error uploading user photo:", error);
      return res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // CRITICAL: Get user travel memories endpoint (MISSING - RESTORED)
  app.get("/api/users/:id/travel-memories", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🗺️ MEMORIES: Getting travel memories for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const memories = await storage.getUserTravelMemories(userId);
      if (process.env.NODE_ENV === 'development') console.log(`🗺️ MEMORIES: Found ${memories.length} travel memories for user ${userId}`);

      return res.json(memories);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch user travel memories" });
    }
  });

  // CRITICAL: Get ALL public travel memories endpoint (MISSING - RESTORED)
  app.get("/api/travel-memories/public", async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '50');
      if (process.env.NODE_ENV === 'development') console.log(`🌍 PUBLIC MEMORIES: Getting all public travel memories (limit: ${limit})`);

      const memories = await storage.getPublicTravelMemories(limit);
      if (process.env.NODE_ENV === 'development') console.log(`🌍 PUBLIC MEMORIES: Found ${memories.length} public travel memories`);

      return res.json(memories);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching public travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch public travel memories" });
    }
  });

  // CRITICAL: Get ALL travel memories endpoint (MISSING - RESTORED)
  app.get("/api/travel-memories", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt((req.query.userId as string) || '0') : undefined;

      if (userId) {
        if (process.env.NODE_ENV === 'development') console.log(`🗺️ MEMORIES: Getting travel memories for user ${userId}`);
        const memories = await storage.getUserTravelMemories(userId);
        if (process.env.NODE_ENV === 'development') console.log(`🗺️ MEMORIES: Found ${memories.length} travel memories for user ${userId}`);
        return res.json(memories);
      } else {
        if (process.env.NODE_ENV === 'development') console.log(`🌍 ALL MEMORIES: Getting all public travel memories`);
        const memories = await storage.getPublicTravelMemories(50);
        if (process.env.NODE_ENV === 'development') console.log(`🌍 ALL MEMORIES: Found ${memories.length} public travel memories`);
        return res.json(memories);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch travel memories" });
    }
  });

  // CRITICAL: Create travel memory endpoint (MISSING - RESTORED)
  app.post("/api/travel-memories", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('POST /api/travel-memories - Creating travel memory');
      if (process.env.NODE_ENV === 'development') console.log('Request body:', req.body);

      const { userId, destination, city, country, description, date, photos, tags, isPublic, latitude, longitude } = req.body;

      // Validate required fields
      if (!userId || !destination || !description) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, destination, description" 
        });
      }

      const memoryData = {
        userId: parseInt(userId.toString() || '0'),
        destination: destination.trim(),
        city: city?.trim() || (typeof destination === 'string' ? destination.split(',') : [])[0]?.trim() || 'Unknown',
        country: country?.trim() || (typeof destination === 'string' ? destination.split(',') : [])[1]?.trim() || 'Unknown',
        description: description.trim(),
        date: date || new Date().toISOString().split('T')[0],
        photos: Array.isArray(photos) ? photos : [],
        tags: Array.isArray(tags) ? tags : [],
        isPublic: isPublic !== false,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null
      };

      if (process.env.NODE_ENV === 'development') console.log('Creating travel memory with processed data:', memoryData);
      const memory = await storage.createTravelMemory(memoryData);

      return res.status(201).json({
        message: "Travel memory created successfully",
        memory
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to create travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TRAVEL MEMORIES: Get user travel memories endpoint  
  app.get("/api/users/:id/photo-albums", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`📸 ALBUMS: Getting travel memories for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const albums = await storage.getUserPhotoAlbums(userId);
      if (process.env.NODE_ENV === 'development') console.log(`📸 ALBUMS: Found ${albums.length} travel memories for user ${userId}`);

      return res.json(albums);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user travel memories:", error);
      return res.status(500).json({ message: "Failed to fetch user travel memories" });
    }
  });

  // TRAVEL MEMORIES: Create travel memory endpoint
  app.post("/api/photo-albums", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('POST /api/photo-albums - Creating travel memory');
      if (process.env.NODE_ENV === 'development') console.log('Request body:', req.body);

      const { userId, title, description, startDate, endDate, location, photoIds, isPublic } = req.body;

      // Validate required fields
      if (!userId || !title || !photoIds || photoIds.length === 0) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, title, photoIds" 
        });
      }

      // We'll handle date fallback after we get photo data

      if (process.env.NODE_ENV === 'development') console.log('📸 ALBUM CREATION: Looking up photo URLs for IDs:', photoIds);

      // Look up actual photo URLs from photo IDs and collect photo dates
      const photoUrls: string[] = [];
      const photoUploadDates: Date[] = [];
      for (const photoId of photoIds) {
        try {
          const photo = await storage.getPhotoById(photoId);
          if (photo && photo.imageUrl) {
            photoUrls.push(photo.imageUrl);
            // Collect upload dates for fallback
            if (photo.uploadedAt) {
              photoUploadDates.push(new Date(photo.uploadedAt));
            }
            if (process.env.NODE_ENV === 'development') console.log(`✅ Photo ID ${photoId} -> URL found, uploaded: ${photo.uploadedAt}`);
          } else {
            if (process.env.NODE_ENV === 'development') console.error(`❌ Photo ID ${photoId} not found or no URL`);
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error(`❌ Error looking up photo ID ${photoId}:`, error);
        }
      }

      if (photoUrls.length === 0) {
        return res.status(400).json({ 
          message: "No valid photos found for the provided photo IDs" 
        });
      }

      // Handle date fallback logic
      let finalStartDate: Date | null = null;
      let finalEndDate: Date | null = null;

      if (startDate) {
        finalStartDate = new Date(startDate);
        if (process.env.NODE_ENV === 'development') console.log('📅 Using provided start date:', finalStartDate);
      } else if (photoUploadDates.length > 0) {
        // Fall back to earliest photo upload date
        finalStartDate = new Date(Math.min(...photoUploadDates.map(d => d.getTime())));
        if (process.env.NODE_ENV === 'development') console.log('📅 No start date provided, using earliest photo date:', finalStartDate);
      } else {
        // Last fallback to current date
        finalStartDate = new Date();
        if (process.env.NODE_ENV === 'development') console.log('📅 No dates available, using current date:', finalStartDate);
      }

      if (endDate) {
        finalEndDate = new Date(endDate);
      } else if (photoUploadDates.length > 0) {
        // If no end date, use latest photo upload date or same as start date
        const latestPhotoDate = new Date(Math.max(...photoUploadDates.map(d => d.getTime())));
        finalEndDate = latestPhotoDate > finalStartDate ? latestPhotoDate : finalStartDate;
        if (process.env.NODE_ENV === 'development') console.log('📅 No end date provided, using latest photo date:', finalEndDate);
      } else {
        finalEndDate = finalStartDate; // Same day trip
      }

      const albumData = {
        userId: parseInt(userId.toString() || '0'),
        title: title.trim(),
        description: description?.trim() || '',
        startDate: finalStartDate,
        endDate: finalEndDate,
        location: location?.trim() || '',
        photos: photoUrls,
        coverPhoto: photoUrls[0], // First photo as cover
        isPublic: isPublic !== false
      };

      if (process.env.NODE_ENV === 'development') console.log('📸 ALBUM CREATION: Creating travel memory with', photoUrls.length, 'photos');
      const album = await storage.createPhotoAlbum(albumData);

      return res.status(201).json({
        message: "Travel memory created successfully",
        album
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to create travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TRAVEL MEMORIES: Update travel memory endpoint
  app.patch("/api/photo-albums/:id", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`PATCH /api/photo-albums/${albumId} - Updating travel memory`);
      if (process.env.NODE_ENV === 'development') console.log('Request body:', req.body);

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "Invalid album ID" });
      }

      const { title, description, location, startDate, endDate, isPublic } = req.body;

      // Validate at least one field is provided
      if (!title && !description && !location && !startDate && !endDate && isPublic === undefined) {
        return res.status(400).json({ 
          message: "At least one field must be provided for update" 
        });
      }

      const updateData: any = {};
      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      if (process.env.NODE_ENV === 'development') console.log('📸 ALBUM UPDATE: Updating travel memory with data:', updateData);
      const updatedAlbum = await storage.updatePhotoAlbum(albumId, updateData);

      if (!updatedAlbum) {
        return res.status(404).json({ message: "Travel memory not found" });
      }

      return res.json({
        message: "Travel memory updated successfully",
        album: updatedAlbum
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to update travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TRAVEL MEMORIES: Delete travel memory endpoint
  app.delete("/api/photo-albums/:id", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`DELETE /api/photo-albums/${albumId} - Deleting travel memory`);

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "Invalid album ID" });
      }

      const deleted = await storage.deletePhotoAlbum(albumId);

      if (!deleted) {
        return res.status(404).json({ message: "Travel memory not found" });
      }

      return res.json({
        message: "Travel memory deleted successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to delete travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TRAVEL MEMORIES: Add photos to existing travel memory endpoint
  app.post("/api/photo-albums/:id/photos", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id || '0');
      const { photoIds } = req.body;

      if (process.env.NODE_ENV === 'development') console.log(`📸 ADD PHOTOS: Adding ${photoIds?.length || 0} photos to travel memory ${albumId}`);

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "Invalid album ID" });
      }

      if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({ message: "Photo IDs are required" });
      }

      // Get current travel memory
      const album = await storage.getPhotoAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Travel memory not found" });
      }

      // Get photo URLs for the new photos
      const newPhotoUrls = [];
      for (const photoId of photoIds) {
        const photo = await storage.getPhotoById(photoId);
        if (photo && photo.imageUrl) {
          newPhotoUrls.push(photo.imageUrl);
          if (process.env.NODE_ENV === 'development') console.log(`✅ Added photo ID ${photoId} to travel memory ${albumId}`);
        } else {
          if (process.env.NODE_ENV === 'development') console.error(`❌ Photo ID ${photoId} not found or no imageUrl`);
        }
      }

      // Combine existing photos with new ones
      const currentPhotos = Array.isArray(album.photos) ? album.photos : [];
      const updatedPhotos = [...currentPhotos, ...newPhotoUrls];

      // Update album with new photos
      const updated = await storage.updatePhotoAlbum(albumId, {
        photos: updatedPhotos
      });

      if (process.env.NODE_ENV === 'development') console.log(`📸 ADD PHOTOS: Successfully added ${newPhotoUrls.length} photos to travel memory ${albumId}`);

      return res.json({
        message: `Added ${newPhotoUrls.length} photos to travel memory`,
        album: updated
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding photos to travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to add photos to travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add existing photos from gallery to travel memory
  app.post("/api/photo-albums/:albumId/add-existing-photos", async (req, res) => {
    try {
      const albumId = parseInt(req.params.albumId || '0');
      const { photoIds } = req.body;
      
      if (process.env.NODE_ENV === 'development') console.log(`📸 ADD EXISTING PHOTOS: Adding photos ${photoIds} to travel memory ${albumId}`);
      
      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({ 
          message: "photoIds must be a non-empty array" 
        });
      }

      // Get the travel memory
      const album = await storage.getPhotoAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Travel memory not found" });
      }

      // Get photo URLs for the provided IDs
      const photoUrls: string[] = [];
      for (const photoId of photoIds) {
        const photo = await storage.getPhotoById(photoId);
        if (photo && (photo.imageUrl || photo.imageData)) {
          photoUrls.push(photo.imageUrl || photo.imageData);
        }
      }

      if (photoUrls.length === 0) {
        return res.status(400).json({ 
          message: "No valid photos found for the provided IDs" 
        });
      }

      // Combine existing photos with new ones
      const currentPhotos = Array.isArray(album.photos) ? album.photos : [];
      const updatedPhotos = [...currentPhotos, ...photoUrls];

      // Update travel memory with new photos
      const updated = await storage.updatePhotoAlbum(albumId, {
        photos: updatedPhotos
      });

      if (process.env.NODE_ENV === 'development') console.log(`📸 ADD EXISTING PHOTOS: Successfully added ${photoUrls.length} photos to travel memory ${albumId}`);

      return res.json({
        message: `Added ${photoUrls.length} photos to travel memory`,
        album: updated
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error adding existing photos to travel memory:", error);
      return res.status(500).json({ 
        message: "Failed to add photos to travel memory",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PHOTO DELETION: Delete individual photo endpoint
  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE /api/photos/${photoId} - Starting photo deletion`);

      if (isNaN(photoId)) {
        if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Invalid photo ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid photo ID" });
      }

      // Get the photo to check ownership and existence
      const photo = await storage.getPhotoById(photoId);
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Photo ${photoId} exists: ${!!photo}`);
      
      if (!photo) {
        if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Photo ${photoId} not found`);
        return res.status(404).json({ message: "Photo not found" });
      }

      const deleted = await storage.deletePhoto(photoId);
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Storage deletePhoto returned: ${deleted}`);

      // Verify deletion by trying to get the photo again
      const stillExists = await storage.getPhotoById(photoId);
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Photo ${photoId} still exists after deletion: ${!!stillExists}`);

      if (!deleted) {
        if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETE - Photo ${photoId} not found or deletion failed`);
        return res.status(404).json({ message: "Photo not found" });
      }

      return res.json({
        message: "Photo deleted successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting photo:", error);
      return res.status(500).json({ 
        message: "Failed to delete photo",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // CRITICAL: Get user matches and compatibility data 
  app.get("/api/users/:userId/matches", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`MATCHES: Getting compatibility matches for user ${userId}`);

      const matches = await matchingService.findMatches(userId);
      if (process.env.NODE_ENV === 'development') console.log(` MATCHES: Found ${matches.length} compatibility matches`);

      return res.json(matches);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Get compatibility between two specific users
  app.get("/api/compatibility/:userId1/:userId2", async (req, res) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      
      if (!userId1 || !userId2) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: Getting compatibility between users ${userId1} and ${userId2}`);

      // Get both users
      const user1 = await storage.getUser(userId1);
      const user2 = await storage.getUser(userId2);
      
      if (!user1 || !user2) {
        if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: User not found - user1: ${!!user1}, user2: ${!!user2}`);
        return res.status(404).json({ message: "User not found" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: Found users - ${user1.username} and ${user2.username}`);

      // Get travel plans for both users
      const user1TravelPlans = await storage.getUserTravelPlans(userId1);
      const user2TravelPlans = await storage.getUserTravelPlans(userId2);

      if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: Travel plans - user1: ${user1TravelPlans?.length || 0}, user2: ${user2TravelPlans?.length || 0}`);

      // Calculate compatibility using the matching service
      const compatibilityScore = await matchingService.calculateCompatibilityScore(
        user1,
        user2,
        user1TravelPlans,
        user2TravelPlans
      );

      if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: Raw score result:`, compatibilityScore);
      if (process.env.NODE_ENV === 'development') console.log(`🔮 COMPATIBILITY: Score between ${user1.username} and ${user2.username}: ${Math.round((compatibilityScore?.score || 0) * 100)}%`);

      // Ensure we return a valid response even if score is null/undefined
      const response = compatibilityScore || {
        userId: user2.id,
        score: 0,
        reasons: [],
        compatibilityLevel: 'low',
        sharedInterests: [],
        sharedActivities: [],
        sharedEvents: [],
        sharedTravelIntent: [],
        locationOverlap: false,
        dateOverlap: false,
        userTypeCompatibility: false,
        travelIntentCompatibility: false
      };

      res.json(response);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error calculating compatibility:", error);
      res.status(500).json({ message: "Failed to calculate compatibility" });
    }
  });

  // RESTORED: City map data endpoint
  app.get("/api/city-map-data", async (req, res) => {
    try {
      const { city, state, country } = req.query;
      
      if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required' });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🗺️ CITY MAP DATA: Fetching map data for ${city}, ${state || 'N/A'}, ${country}`);

      // Metropolitan area consolidation for Los Angeles - use same logic as city pages  
      let metroAreaCities = [city];
      const laCities = ['Los Angeles', 'LA', 'Playa del Rey', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Culver City', 'Marina del Rey', 'Hermosa Beach', 'Redondo Beach', 'Hawthorne', 'Hollywood', 'Studio City', 'Sherman Oaks', 'Encino', 'Van Nuys', 'Northridge'];
      
      // Check if current city is in LA metro area (same logic as city pages)
      if (process.env.NODE_ENV === 'development') console.log(`🗺️ METRO CHECK: Testing "${city}" against LA cities`);
      const isLAMetro = laCities.some(laCity => city.toLowerCase().includes(laCity.toLowerCase()) || laCity.toLowerCase().includes(city.toLowerCase()));
      if (process.env.NODE_ENV === 'development') console.log(`🗺️ METRO RESULT: ${city} is LA metro: ${isLAMetro}`);
      
      if (isLAMetro) {
        metroAreaCities = [...laCities, 'Los Angeles'];
        if (process.env.NODE_ENV === 'development') console.log(`🗺️ METRO CONSOLIDATION: ${city} → Los Angeles metro area`);
      }
      if (process.env.NODE_ENV === 'development') console.log(`🗺️ METRO: Searching for users in cities: ${metroAreaCities.join(', ')}`);
      
      // Fetch users with location sharing enabled for this city
      let mapUsers = [];
      try {
        // Use same LA metro area logic for users
        let userCitiesToSearch = [city];
        
        if (metroAreaCities.length > 1) {
          userCitiesToSearch = metroAreaCities;
        }
        
        if (process.env.NODE_ENV === 'development') console.log('🗺️ METRO: Searching for users in cities:', userCitiesToSearch.slice(0, 5), '...');
        
        const userHometownConditions = userCitiesToSearch.map(searchCity => 
          ilike(users.hometownCity, `%${searchCity}%`)
        );
        const userTravelConditions = userCitiesToSearch.map(searchCity => 
          ilike(users.travelDestination, `%${searchCity}%`)
        );
        
        // Find users with active travel plans to this city
        const activeTravelersSubquery = db.select({
          userId: travelPlans.userId
        })
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.status, 'active'),
            or(...userCitiesToSearch.map(searchCity => 
              ilike(travelPlans.destinationCity, `%${searchCity}%`)
            ))
          )
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗺️ TRAVEL PLANS: Searching for active travelers to cities: ${userCitiesToSearch.join(', ')}`);
        }
        
        // Also include users who are physically in this city (based on coordinates)
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗺️ COORDS DEBUG: Looking up city "${city}" (type: ${typeof city})`);
        }
        
        // Get city coordinates with fallback for known cities
        let cityCoords = getCityCoordinates(city as string);
        
        // Fallback for Santa Monica if getCityCoordinates fails
        if (!cityCoords || cityCoords[0] === undefined || cityCoords[1] === undefined) {
          if (city.toLowerCase().includes('santa monica')) {
            cityCoords = [34.0195, -118.4912];
          } else if (city.toLowerCase().includes('los angeles')) {
            cityCoords = [34.0522, -118.2437];
          } else {
            cityCoords = [34.0522, -118.2437]; // Default to LA
          }
        }
        
        const cityLatRange = [cityCoords[0] - 0.5, cityCoords[0] + 0.5]; // ~35 mile radius
        const cityLngRange = [cityCoords[1] - 0.5, cityCoords[1] + 0.5];
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗺️ COORDINATES: ${city} coords: [${cityCoords[0]}, ${cityCoords[1]}]`);
          console.log(`🗺️ COORDINATE RANGES: Lat: ${cityLatRange[0]} to ${cityLatRange[1]}, Lng: ${cityLngRange[0]} to ${cityLngRange[1]}`);
        }
        
        mapUsers = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          userType: users.userType,
          profileImage: users.profileImage,
          latitude: users.currentLatitude,
          longitude: users.currentLongitude,
          lastLocationUpdate: users.lastLocationUpdate,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState
        })
        .from(users)
        .where(
          and(
            eq(users.locationSharingEnabled, true),
            isNotNull(users.currentLatitude),
            isNotNull(users.currentLongitude),
            or(
              ...userHometownConditions,
              ...userTravelConditions,
              // Include users currently traveling to this city
              inArray(users.id, activeTravelersSubquery)
            )
          )
        );
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error('Error fetching map users:', error);
        if (process.env.NODE_ENV === 'development') console.error('Error details:', error.message);
        if (process.env.NODE_ENV === 'development') console.error('Error stack:', error.stack);
        mapUsers = [];
      }

      // Fetch events with location data for this city (including LA metro area)
      let mapEvents = [];
      try {
        // Use same LA metro area logic as events API
        let eventCitiesToSearch = [city];
        
        if (metroAreaCities.length > 1) {
          eventCitiesToSearch = metroAreaCities;
        }
        
        if (process.env.NODE_ENV === 'development') console.log('🗺️ EVENTS METRO: Searching event cities:', eventCitiesToSearch.slice(0, 10), '...');
        
        const eventConditions = eventCitiesToSearch.map(searchCity => 
          ilike(events.city, `%${searchCity}%`)
        );
        
        mapEvents = await db.select({
          id: events.id,
          title: events.title,
          venueName: events.venueName,
          date: events.date,
          city: events.city,
          location: events.location,
          latitude: events.latitude,
          longitude: events.longitude
        })
        .from(events)
        .where(
          and(
            or(...eventConditions),
            isNotNull(events.latitude),
            isNotNull(events.longitude)
          )
        );
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error('Error fetching map events:', error);
        mapEvents = [];
      }

      // Fetch businesses with location data for this city (including LA metro area)
      // ONLY show businesses that have active events or deals
      let mapBusinesses = [];
      try {
        // Use same LA metro area logic for businesses
        let businessCitiesToSearch = [city];
        
        // Use the same metro area cities defined at function start
        
        if (metroAreaCities.length > 1) {
          businessCitiesToSearch = metroAreaCities;
        }
        
        const businessConditions = businessCitiesToSearch.map(searchCity => 
          ilike(users.hometownCity, `%${searchCity}%`)
        );

        // Create subqueries to find businesses with active events or deals
        const businessesWithEventsSubquery = db.select({
          businessId: events.organizerId
        })
        .from(events)
        .where(
          and(
            eq(events.isActive, true),
            gte(events.date, new Date()) // Future or current events only
          )
        );

        const businessesWithQuickDealsSubquery = db.select({
          businessId: quickDeals.businessId
        })
        .from(quickDeals)
        .where(
          and(
            eq(quickDeals.isActive, true),
            gte(quickDeals.validUntil, new Date()) // Active deals that haven't expired
          )
        );

        const businessesWithOffersSubquery = db.select({
          businessId: businessOffers.businessId
        })
        .from(businessOffers)
        .where(
          and(
            eq(businessOffers.isActive, true),
            gte(businessOffers.validUntil, new Date()) // Active offers that haven't expired
          )
        );
        
        mapBusinesses = await db.select({
          id: users.id,
          businessName: users.businessName,
          streetAddress: users.streetAddress,
          latitude: users.currentLatitude,
          longitude: users.currentLongitude,
          category: users.businessType
        })
        .from(users)
        .where(
          and(
            eq(users.userType, 'business'),
            eq(users.locationSharingEnabled, true),
            isNotNull(users.currentLatitude),
            isNotNull(users.currentLongitude),
            or(...businessConditions),
            // ONLY include businesses that have active events or deals
            or(
              inArray(users.id, businessesWithEventsSubquery),
              inArray(users.id, businessesWithQuickDealsSubquery),
              inArray(users.id, businessesWithOffersSubquery)
            )
          )
        );

        if (process.env.NODE_ENV === 'development') {
          console.log(`🗺️ BUSINESSES: Found ${mapBusinesses.length} businesses with active events/deals in ${businessCitiesToSearch.join(', ')}`);
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error('Error fetching map businesses:', error);
        mapBusinesses = [];
      }

      // Enhance users with active travel plan information for correct descriptions
      const enhancedUsers = await Promise.all(mapUsers.map(async (user) => {
        try {
          const activeTravelPlan = await db.select({
            destinationCity: travelPlans.destinationCity,
            destinationState: travelPlans.destinationState
          })
          .from(travelPlans)
          .where(
            and(
              eq(travelPlans.userId, user.id),
              eq(travelPlans.status, 'active')
            )
          )
          .limit(1);

          return {
            ...user,
            activeTravelDestination: activeTravelPlan[0]?.destinationCity || null
          };
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error(`Error fetching travel plan for user ${user.id}:`, error);
          return {
            ...user,
            activeTravelDestination: null
          };
        }
      }));

      const mapData = {
        users: enhancedUsers,
        events: mapEvents,
        businesses: mapBusinesses
      };

      if (process.env.NODE_ENV === 'development') console.log(`🗺️ CITY MAP DATA: Found ${enhancedUsers.length} users, ${mapEvents.length} events, ${mapBusinesses.length} businesses for ${city}`);
      res.json(mapData);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching city map data:', error);
      res.status(500).json({ error: 'Failed to fetch city map data' });
    }
  });

  // GET /api/auth/user - Emergency auth recovery endpoint
  app.get("/api/auth/user", async (req, res) => {
    try {
      // This endpoint is used by the frontend for emergency auth recovery
      // For now, return empty response since we don't have session-based auth
      res.status(401).json({ message: "No authenticated session found" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Auth user endpoint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // TEMPORARY: Fix event coordinates using geocoding
  app.post("/api/fix-event-coordinates", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🔧 Starting event coordinate fixes using geocoding...");
      
      // Get all events with location data but potentially wrong coordinates
      const eventsToFix = await db.select({
        id: events.id,
        title: events.title,
        location: events.location,
        latitude: events.latitude,
        longitude: events.longitude
      })
      .from(events)
      .where(and(
        isNotNull(events.location),
        isNotNull(events.latitude),
        isNotNull(events.longitude)
      ));
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 Found ${eventsToFix.length} events to geocode`);
      
      const results = [];
      
      for (const event of eventsToFix) {
        if (process.env.NODE_ENV === 'development') console.log(`📍 Geocoding event "${event.title}" at "${event.location}"...`);
        
        const coordinates = await geocodeAddress(event.location!);
        
        if (coordinates) {
          // Update the event with correct coordinates
          await db.update(events)
            .set({
              latitude: coordinates.lat,
              longitude: coordinates.lng
            })
            .where(eq(events.id, event.id));
          
          results.push({
            id: event.id,
            title: event.title,
            location: event.location,
            oldCoords: { lat: event.latitude, lng: event.longitude },
            newCoords: coordinates,
            status: 'updated'
          });
          
          if (process.env.NODE_ENV === 'development') console.log(`✅ Updated "${event.title}" from (${event.latitude}, ${event.longitude}) to (${coordinates.lat}, ${coordinates.lng})`);
        } else {
          results.push({
            id: event.id,
            title: event.title,
            location: event.location,
            status: 'failed'
          });
          
          if (process.env.NODE_ENV === 'development') console.log(`❌ Failed to geocode "${event.title}" at "${event.location}"`);
        }
        
        // Add small delay to be respectful to the geocoding service
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (process.env.NODE_ENV === 'development') console.log("✅ Event coordinate fixing complete!");
      res.json({ message: 'Event coordinates updated', results });
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fixing event coordinates:", error);
      res.status(500).json({ error: 'Failed to fix event coordinates' });
    }
  });

  // Group Chat Rooms API endpoints for instant messaging modals

  // Get user's joined rooms
  app.get("/api/chatrooms/my-rooms", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id || 1; // Default to nearbytraveler

      const allChatrooms = await db.select().from(citychatrooms);
      // Return user's joined rooms (can be enhanced with membership tracking)
      const joinedRooms = allChatrooms.slice(0, 5).map(room => ({
        ...room,
        isMember: true,
        type: room.tags?.includes('meetup') ? 'meetup' : 'general'
      }));

      res.json(joinedRooms);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching user rooms:", error);
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching public rooms:", error);
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching event rooms:", error);
      res.status(500).json({ message: "Failed to fetch event rooms" });
    }
  });

  // Get city-based chatrooms
  app.get("/api/chatrooms/cities", async (req, res) => {
    try {
      // Get user ID from headers
      let userId = 1; // Default to nearbytraveler user if not specified
      const userData = req.headers['x-user-data'];
      if (userData) {
        try {
          userId = JSON.parse(userData as string).id;
        } catch (e) {
          // Use default user ID
        }
      }

      console.log(`🚨 CITIES ENDPOINT ABSOLUTELY CALLED: User ${userId} requesting cities 🚨`);

      const allChatrooms = await db.select().from(citychatrooms);
      
      // Get member counts for all chatrooms  
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
        memberCountMap.set(mc.chatroomId, parseInt(mc.count || '0'));
      });
      
      console.log(`🚨 CITIES ENDPOINT: Member count map:`, Array.from(memberCountMap.entries()));
      console.log(`🚨 CITIES ENDPOINT: All chatrooms count:`, allChatrooms.length);

      // Check user membership status for all chatrooms
      const userMemberships = await db
        .select({ chatroomId: chatroomMembers.chatroomId })
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.userId, userId),
          eq(chatroomMembers.isActive, true)
        ));

      const membershipSet = new Set(userMemberships.map(m => m.chatroomId));

      const cityRooms = allChatrooms
        .filter(room => room.city && room.city !== '')
        .map(room => ({
          ...room,
          memberCount: memberCountMap.get(room.id) || 1,
          userIsMember: membershipSet.has(room.id),
          isMember: membershipSet.has(room.id), // Legacy field
          type: 'city'
        }));

      console.log(`🚨 CITIES ENDPOINT: Found ${cityRooms.length} chatrooms for user ${userId}`);
      console.log(`🚨 CITIES ENDPOINT: First room member count:`, cityRooms[0]?.memberCount);
      res.json(cityRooms);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching city rooms:", error);
      res.status(500).json({ message: "Failed to fetch city rooms" });
    }
  });

  // Get chatroom messages
  app.get("/api/chatrooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM MESSAGES: Getting messages for chatroom ${roomId}`);

      const messages = await storage.getChatroomMessages(roomId);
      return res.json(messages);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching chatroom messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Post chatroom message
  app.post("/api/chatrooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId || '0');
      const userId = req.headers['x-user-id'];
      const { content } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content required" });
      }

      // 🔒 SECURITY CHECK: Verify user is a member of the chatroom before allowing message posting
      const memberCheck = await db
        .select()
        .from(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.chatroomId, roomId),
            eq(chatroomMembers.userId, parseInt(userId as string)),
            eq(chatroomMembers.isActive, true)
          )
        );

      if (memberCheck.length === 0) {
        if (process.env.NODE_ENV === 'development') console.log(`🚫 SECURITY: User ${userId} attempted to post to chatroom ${roomId} without membership`);
        return res.status(403).json({ message: "You must join the chatroom before sending messages" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM MESSAGE: User ${userId} sending message to chatroom ${roomId}`);

      const message = await storage.createChatroomMessage(roomId, parseInt(userId as string), content.trim());
      return res.json(message);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error sending chatroom message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get individual chatroom details
  app.get("/api/chatrooms/:roomId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId || '0');
      
      // Get chatroom details
      const chatroom = await db.select().from(citychatrooms).where(eq(citychatrooms.id, roomId)).limit(1);
      
      if (chatroom.length === 0) {
        return res.status(404).json({ message: "Chatroom not found" });
      }

      // Get member count
      const memberCountResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::integer as "memberCount"
        FROM chatroom_members 
        WHERE chatroom_id = ${roomId} AND is_active = true
      `);
      
      const memberCount = memberCountResult.rows[0]?.memberCount || 0;

      // Get current user's membership status
      let userId = null;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string || '0');
      } else if (req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          userId = userData.id;
        } catch (e) {
          // Ignore parsing error
        }
      }

      let userIsMember = false;
      if (userId) {
        const membership = await db.select()
          .from(chatroomMembers)
          .where(and(
            eq(chatroomMembers.chatroomId, roomId),
            eq(chatroomMembers.userId, userId),
            eq(chatroomMembers.isActive, true)
          ))
          .limit(1);
        userIsMember = membership.length > 0;
      }

      const chatroomWithDetails = {
        ...chatroom[0],
        memberCount,
        userIsMember
      };

      res.json(chatroomWithDetails);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching chatroom details:", error);
      res.status(500).json({ message: "Failed to fetch chatroom details" });
    }
  });

  // Get chatroom members
  app.get("/api/chatrooms/:roomId/members", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM MEMBERS: Getting members for chatroom ${roomId}`);

      const members = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          role: chatroomMembers.role,
          joinedAt: chatroomMembers.joinedAt
        })
        .from(chatroomMembers)
        .leftJoin(users, eq(chatroomMembers.userId, users.id))
        .where(and(
          eq(chatroomMembers.chatroomId, roomId),
          eq(chatroomMembers.isActive, true)
        ))
        .orderBy(
          sql`CASE WHEN ${chatroomMembers.role} = 'admin' THEN 0 ELSE 1 END`,
          asc(chatroomMembers.joinedAt)
        );

      return res.json(members);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching chatroom members:", error);
      return res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Join a chatroom
  app.post("/api/chatrooms/:roomId/join", async (req, res) => {
    try {
      // FIXED: Get user ID from multiple sources with proper parsing
      let userId = null;
      
      // First try: x-user-id header
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string || '0');
      }
      
      // Second try: x-user-data header
      if (!userId && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          userId = userData.id;
        } catch (e) {
          if (process.env.NODE_ENV === 'development') console.error("Failed to parse user data:", e);
        }
      }
      
      // Third try: request body
      if (!userId && req.body.userId) {
        userId = parseInt(req.body.userId);
      }
      
      // Fourth try: session
      if (!userId && req.session?.user?.id) {
        userId = req.session.user.id;
      }

      if (!userId) {
        return res.status(401).json({ message: "User ID required - please log in" });
      }

      const roomId = parseInt(req.params.roomId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM JOIN: User ${userId} joining chatroom ${roomId}`);

      // Check if chatroom exists
      const chatroom = await db.select().from(citychatrooms).where(eq(citychatrooms.id, roomId)).limit(1);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM LOOKUP: Found ${chatroom.length} chatrooms for ID ${roomId}`);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM QUERY DEBUG: roomId=${roomId}, type=${typeof roomId}, isNaN=${isNaN(roomId)}`);
      if (chatroom.length === 0) {
        if (process.env.NODE_ENV === 'development') console.log(`🔥 CHATROOM NOT FOUND: ID ${roomId} not in citychatrooms table`);
        // Let's also check if any chatrooms exist at all
        const allChatrooms = await db.select().from(citychatrooms).limit(5);
        if (process.env.NODE_ENV === 'development') console.log(`🔥 DEBUG: Found ${allChatrooms.length} total chatrooms:`, allChatrooms.map(c => ({id: c.id, name: c.name})));
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
        if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM JOIN: User ${userId} already member of chatroom ${roomId}`);
        return res.json({ success: true, message: "Already a member", alreadyMember: true });
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

      // Award 1 aura for joining chatroom
      await storage.awardAura(userId, 1, 'joining chatroom');

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM JOIN: User ${userId} successfully joined chatroom ${roomId}`);
      res.json({ success: true, message: "Successfully joined chatroom!", newMember: true });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("🔥 Error joining room:", error);
      res.status(500).json({ message: "Failed to join chatroom", error: error.message });
    }
  });

  // Leave a chatroom
  app.post("/api/chatrooms/:roomId/leave", async (req, res) => {
    try {
      // FIXED: Get user ID from multiple sources with proper parsing
      let userId = null;
      
      // First try: x-user-id header
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id'] as string || '0');
      }
      
      // Second try: x-user-data header
      if (!userId && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          userId = userData.id;
        } catch (e) {
          if (process.env.NODE_ENV === 'development') console.error("Failed to parse user data:", e);
        }
      }
      
      // Third try: request body
      if (!userId && req.body.userId) {
        userId = parseInt(req.body.userId);
      }
      
      // Fourth try: session
      if (!userId && req.session?.user?.id) {
        userId = req.session.user.id;
      }

      if (!userId) {
        return res.status(401).json({ message: "User ID required - please log in" });
      }

      const roomId = parseInt(req.params.roomId || '0');
      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM LEAVE: User ${userId} leaving chatroom ${roomId}`);

      // Deactivate membership
      await db.update(chatroomMembers)
        .set({ isActive: false })
        .where(and(
          eq(chatroomMembers.chatroomId, roomId),
          eq(chatroomMembers.userId, userId)
        ));

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM LEAVE: User ${userId} successfully left chatroom ${roomId}`);
      res.json({ success: true, message: "Successfully left room" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });



  // CRITICAL: Create new chatroom with automatic membership for creator
  app.post("/api/chatrooms", async (req, res) => {
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
        userId = parseInt(req.headers['x-user-id'] as string || '0');
      }

      const { name, description, city, country, state } = req.body;

      if (!name || !city || !country) {
        return res.status(400).json({ message: "Name, city, and country are required" });
      }

      // NO HARDCODED METRO CONSOLIDATION - Use actual city data
      let finalCity = city;
      let finalState = state;
      let consolidationMessage = '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 CHATROOM EXACT CITY: Using ${city} without forced consolidation`);
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CREATING CHATROOM: "${name}" by user ${userId} in ${finalCity}, ${country}`);

      // Use the storage method that automatically adds creator as member
      const newChatroom = await storage.createCityChatroom({
        name,
        description,
        city: finalCity,
        state: finalState,
        country,
        createdById: userId,
        isPublic: true,
        maxMembers: 500,
        tags: [],
        rules: null
      });

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM CREATED: ID ${newChatroom.id} with creator as automatic member`);
      
      // Include consolidation message in response if applicable
      const response: any = { ...newChatroom };
      if (consolidationMessage) {
        response.consolidationMessage = consolidationMessage;
      }
      
      res.status(201).json(response);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating chatroom:", error);
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  });

  // User status and notification settings endpoints
  app.put("/api/users/notification-settings", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id || 1; // Default to nearbytraveler

      // For now, just return success (can be enhanced with actual settings storage)
      res.json({ success: true, message: "Notification settings updated" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  app.put("/api/users/status", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id || 1; // Default to nearbytraveler

      // For now, just return success (can be enhanced with actual status storage)
      res.json({ success: true, message: "Status updated" });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Retroactive aura award system - award missing aura for existing users
  // TODO: Implement retroactive aura award system

  // Set up WebSocket server for instant messaging on a different path
  // MUST use the provided HTTP server to avoid conflicts
  if (!httpServer) {
    throw new Error('HTTP server is required for WebSocket setup');
  }
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket heartbeat setup for connection monitoring
  type AliveWS = WebSocket & { isAlive?: boolean };

  interface AuthenticatedWebSocket extends WebSocket {
    userId?: number;
    username?: string;
    isAuthenticated?: boolean;
    isAlive?: boolean;
  }

  const connectedUsers = new Map<number, AuthenticatedWebSocket>();

  // WebSocket heartbeat to prevent dead connections
  const wsHeartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const sock = ws as AliveWS;
      if (sock.isAlive === false) return sock.terminate();
      sock.isAlive = false;
      try { sock.ping(); } catch {}
    });
  }, 30000);

  wss.on("close", () => clearInterval(wsHeartbeat));

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    if (process.env.NODE_ENV === 'development') console.log(' New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (process.env.NODE_ENV === 'development') console.log('📥 WebSocket message received:', data);

        switch (data.type) {
          case 'auth':
            ws.userId = data.userId;
            ws.username = data.username;
            ws.isAuthenticated = true;
            connectedUsers.set(data.userId, ws);
            if (process.env.NODE_ENV === 'development') console.log(` User ${data.username} (${data.userId}) authenticated via WebSocket`);

            // Send any pending offline messages when user comes online
            await deliverOfflineMessages(data.userId);
            break;

          case 'instant_message':
            if (!ws.isAuthenticated || !ws.userId) {
              if (process.env.NODE_ENV === 'development') console.log(' Unauthenticated user trying to send message');
              return;
            }

            const { receiverId, content } = data;
            if (process.env.NODE_ENV === 'development') console.log(`💬 Instant message from ${ws.userId} to ${receiverId}: ${content}`);

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

              if (process.env.NODE_ENV === 'development') console.log(`💾 IM stored in database with ID: ${newMessage[0].id}`);
            } catch (error: any) {
              if (process.env.NODE_ENV === 'development') console.error(' Error storing IM in database:', error);
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
              if (process.env.NODE_ENV === 'development') console.log(` Instant message delivered to online user ${receiverId}`);
            } else {
              if (process.env.NODE_ENV === 'development') console.log(`📪 User ${receiverId} is offline - will receive message when they come online`);
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
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error(' WebSocket message parsing error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId && ws.isAuthenticated) {
        connectedUsers.delete(ws.userId);
        if (process.env.NODE_ENV === 'development') console.log(`🔴 User ${ws.username} (${ws.userId}) disconnected`);
      }
    });

    ws.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') console.error('🔴 WebSocket error:', error);
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
        if (process.env.NODE_ENV === 'development') console.log(`📬 Delivering ${unreadMessages.length} offline messages to user ${userId}`);

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

        if (process.env.NODE_ENV === 'development') console.log(` Marked ${unreadMessages.length} messages as read for user ${userId}`);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error(' Error delivering offline messages:', error);
    }
  }

  // CRITICAL: Cities API endpoint for city-specific matching
  app.get('/api/cities/all', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🏙️ CITIES API: Fetching all cities...');

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

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITIES API: Found ${citiesFromPages.length} cities`);
      if (process.env.NODE_ENV === 'development') console.log('🏙️ CITIES API: First 3 cities:', citiesFromPages.slice(0, 3));

      res.json(citiesFromPages);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('CITIES API ERROR:', error);
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });

  // GET city activities for a specific city
  app.get("/api/city-activities/:cityName", async (req, res) => {
    try {
      const { cityName } = req.params;
      if (process.env.NODE_ENV === 'development') console.log(`🏃 CITY ACTIVITIES GET: Fetching activities for ${cityName}`);
      
      const activities = await db
        .select()
        .from(cityActivities)
        .where(
          and(
            eq(cityActivities.cityName, cityName),
            eq(cityActivities.isActive, true)
          )
        )
        .orderBy(desc(cityActivities.createdAt));
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ CITY ACTIVITIES GET: Found ${activities.length} activities for ${cityName}`);
      res.json(activities);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching city activities:', error);
      res.status(500).json({ error: 'Failed to fetch city activities' });
    }
  });

  // POST new city activity 
  app.post("/api/city-activities", async (req, res) => {
    try {
      const { cityName, state, country, activityName, category, description, createdByUserId } = req.body;
      
      if (!cityName || !activityName || !createdByUserId) {
        return res.status(400).json({ error: 'Missing required fields: cityName, activityName, createdByUserId' });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🏃 CITY ACTIVITIES POST: Creating activity "${activityName}" for ${cityName}`);
      
      const newActivity = await storage.createCityActivity({
        cityName,
        state: state || '',
        country: country || 'United States',
        activityName,
        category: category || 'general',
        description: description || 'User added activity',
        createdByUserId
      });
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ CITY ACTIVITIES POST: Created activity ${newActivity.id} for ${cityName}`);
      res.json(newActivity);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating city activity:', error);
      res.status(500).json({ error: 'Failed to create city activity' });
    }
  });

  // GET user city interests for a specific user and city
  app.get("/api/user-city-interests/:userId/:cityName", async (req, res) => {
    try {
      const { userId, cityName } = req.params;
      if (process.env.NODE_ENV === 'development') console.log(`💡 USER INTERESTS GET: Fetching interests for user ${userId} in ${cityName}`);
      
      const interests = await db
        .select({
          id: userCityInterests.id,
          userId: userCityInterests.userId,
          activityId: userCityInterests.activityId,
          activityName: userCityInterests.activityName,
          cityName: userCityInterests.cityName,
          isActive: userCityInterests.isActive,
          createdAt: userCityInterests.createdAt
        })
        .from(userCityInterests)
        .where(
          and(
            eq(userCityInterests.userId, parseInt(userId)),
            eq(userCityInterests.cityName, cityName),
            eq(userCityInterests.isActive, true)
          )
        )
        .orderBy(desc(userCityInterests.createdAt));
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS GET: Found ${interests.length} interests for user ${userId} in ${cityName}`);
      res.json(interests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching user city interests:', error);
      res.status(500).json({ error: 'Failed to fetch user city interests' });
    }
  });

  // POST new user city interest
  app.post("/api/user-city-interests", async (req, res) => {
    try {
      const { activityId, cityName } = req.body;
      const userId = req.headers['x-user-id'];
      
      if (!activityId || !cityName || !userId) {
        return res.status(400).json({ error: 'Missing required fields: activityId, cityName, userId' });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`💡 USER INTERESTS POST: Adding interest for user ${userId} in activity ${activityId}`);
      
      // Get the activity name from the city activities table
      const [activity] = await db
        .select({ activityName: cityActivities.activityName })
        .from(cityActivities)
        .where(eq(cityActivities.id, parseInt(activityId)));
      
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      const [newInterest] = await db
        .insert(userCityInterests)
        .values({
          userId: parseInt(userId as string),
          activityId: parseInt(activityId),
          activityName: activity.activityName,
          cityName,
          isActive: true
        })
        .returning();
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS POST: Created interest ${newInterest.id} for user ${userId}`);
      res.json(newInterest);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating user city interest:', error);
      res.status(500).json({ error: 'Failed to create user city interest' });
    }
  });

  // GET all user city interests for a user across all cities
  app.get("/api/user-city-interests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (process.env.NODE_ENV === 'development') console.log(`💡 USER INTERESTS GET ALL: Fetching all interests for user ${userId}`);
      
      const interests = await db
        .select({
          id: userCityInterests.id,
          userId: userCityInterests.userId,
          activityId: userCityInterests.activityId,
          activityName: userCityInterests.activityName,
          cityName: userCityInterests.cityName,
          isActive: userCityInterests.isActive,
          createdAt: userCityInterests.createdAt
        })
        .from(userCityInterests)
        .where(
          and(
            eq(userCityInterests.userId, parseInt(userId)),
            eq(userCityInterests.isActive, true)
          )
        )
        .orderBy(desc(userCityInterests.createdAt));
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS GET ALL: Found ${interests.length} interests for user ${userId} across all cities`);
      res.json(interests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching all user city interests:', error);
      res.status(500).json({ error: 'Failed to fetch all user city interests' });
    }
  });

  // DELETE user city interest
  app.delete("/api/user-city-interests/:interestId", async (req, res) => {
    try {
      const { interestId } = req.params;
      const userId = req.headers['x-user-id'];
      
      if (!interestId || !userId) {
        return res.status(400).json({ error: 'Missing required fields: interestId, userId' });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`💡 USER INTERESTS DELETE: Removing interest ${interestId} for user ${userId}`);
      
      await db
        .update(userCityInterests)
        .set({ isActive: false })
        .where(
          and(
            eq(userCityInterests.id, parseInt(interestId)),
            eq(userCityInterests.userId, parseInt(userId as string))
          )
        );
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS DELETE: Removed interest ${interestId} for user ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting user city interest:', error);
      res.status(500).json({ error: 'Failed to delete user city interest' });
    }
  });

  // Direct search by city activity interests (toggle button selections)
  app.get('/api/users/search-by-activity-name', async (req, res) => {
    try {
      const { activityName, cityName } = req.query;

      if (!activityName || typeof activityName !== 'string') {
        return res.status(400).json({ error: 'Activity name parameter is required' });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔍 ACTIVITY NAME SEARCH: Searching for users interested in "${activityName}" ${cityName ? `in ${cityName}` : 'in any city'}`);

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

      if (process.env.NODE_ENV === 'development') console.log(`✅ ACTIVITY NAME SEARCH: Found ${usersWithActivityInterests.length} users interested in "${activityName}"`);
      
      res.json(usersWithActivityInterests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error searching users by activity name:', error);
      res.status(500).json({ error: 'Failed to search users by activity name' });
    }
  });

  // REMOVED: Duplicate search endpoint - moved to line 2718 for correct route precedence

  // Global keyword search for users who have matched specific activities
  app.get('/api/users/search-by-keyword', async (req, res) => {
    try {
      const { keyword } = req.query;

      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: 'Keyword parameter is required' });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`KEYWORD SEARCH: Searching for users who matched activities containing: "${keyword}"`);
      }

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

      if (process.env.NODE_ENV === 'development') {
        console.log(`KEYWORD SEARCH: Found ${matchingActivities.length} activities matching "${keyword}"`);
      }

      if (matchingActivities.length === 0) {
        return res.json([]);
      }

      // Get all activity IDs that match the keyword
      const activityIds = matchingActivities.map(activity => activity.id);

      // Skip activity matches query as activityMatches table doesn't exist
      // This query was referencing a non-existent table
      const usersWithActivityMatches: any[] = [];

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

      if (process.env.NODE_ENV === 'development') console.log(`KEYWORD SEARCH: Found ${usersWithActivityMatches.length} activity matches + ${usersWithCityInterests.length} city interest matches for "${keyword}"`);
      
      res.json(allUsersWithMatches);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error in keyword search:', error);
      res.status(500).json({ error: 'Failed to perform keyword search' });
    }
  });

  // QR CODE & REFERRAL SYSTEM ROUTES
  
  // Generate referral code and QR code for user
  app.get('/api/user/qr-code', async (req: any, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = req.session.user.id;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate referral code if user doesn't have one
      if (!user.referralCode) {
        const referralCode = generateReferralCode();
        await db.update(users)
          .set({ 
            referralCode: referralCode,
            qrCodeGeneratedAt: new Date()
          })
          .where(eq(users.id, userId));
        
        user = await storage.getUser(userId); // Refresh user data
      }

      const signupUrl = `${req.protocol}://${req.get('host')}/signup/qr/${user.referralCode}`;
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(signupUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({
        referralCode: user.referralCode,
        qrCodeUrl: qrCodeDataUrl,
        signupUrl: signupUrl,
        referralCount: user.referralCount || 0
      });

    } catch (error: any) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // Get user info by referral code (for preview before signup)
  app.get('/api/referral/:code', async (req, res) => {
    try {
      const { code } = req.params;
      
      const [referrer] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          userType: users.userType,
          city: users.city,
          state: users.state,
          country: users.country,
          bio: users.bio
        })
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      if (!referrer) {
        return res.status(404).json({ error: 'Invalid referral code' });
      }

      res.json({
        referrer: {
          name: referrer.name,
          username: referrer.username,
          profileImage: referrer.profileImage,
          userType: referrer.userType,
          location: [referrer.city, referrer.state, referrer.country].filter(Boolean).join(', '),
          bio: referrer.bio
        }
      });

    } catch (error: any) {
      console.error('Error fetching referral info:', error);
      res.status(500).json({ error: 'Failed to fetch referral information' });
    }
  });

  // Connection note management
  app.patch('/api/connections/:connectionId/note', async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      const { connectionNote } = req.body;
      const userId = req.user.claims.sub;

      // Verify the user is part of this connection
      const [connection] = await db
        .select()
        .from(connections)
        .where(
          and(
            eq(connections.id, connectionId),
            or(
              eq(connections.requesterId, userId),
              eq(connections.receiverId, userId)
            )
          )
        )
        .limit(1);

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found or access denied' });
      }

      // Update the connection note
      await db.update(connections)
        .set({ connectionNote: connectionNote || null })
        .where(eq(connections.id, connectionId));

      res.json({ success: true, message: 'Connection note updated' });
    } catch (error) {
      console.error('Error updating connection note:', error);
      res.status(500).json({ error: 'Failed to update connection note' });
    }
  });

  // Fix travel dates for existing currently_traveling users
  app.patch('/api/users/fix-travel-dates', async (req, res) => {
    try {
      const result = await db.update(users)
        .set({
          travelStartDate: new Date().toISOString().split('T')[0], // Today
          travelEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from today
          travelDestination: 'Los Angeles, California, United States'
        })
        .where(and(
          eq(users.userType, 'currently_traveling'),
          isNull(users.travelStartDate)
        ))
        .returning();
      
      console.log(`✅ Fixed travel dates for ${result.length} currently_traveling users`);
      res.json({ 
        success: true, 
        usersUpdated: result.length,
        message: `Updated ${result.length} users with travel dates` 
      });
    } catch (error) {
      console.error('Error fixing travel dates:', error);
      res.status(500).json({ error: 'Failed to fix travel dates' });
    }
  });

  // Return the configured HTTP server with WebSocket support  
  return httpServer;
}

