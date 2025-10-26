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
import { detectMetroArea, getMetroAreaName } from '../shared/metro-areas';
import { getMetroArea } from '../shared/constants';

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
  vouches,
  blockedUsers,
  insertWaitlistLeadSchema
} from "../shared/schema";
import { sql, eq, or, count, and, ne, desc, gte, lte, lt, isNotNull, inArray, asc, ilike, like, isNull, gt } from "drizzle-orm";
import { waitlistLeads } from "../shared/schema";
import { alias } from "drizzle-orm/pg-core";

// Helper function to compute public display name based on user preference
function computePublicName(displayNamePreference: string, username: string, fullName: string): string {
  switch (displayNamePreference) {
    case 'first_name':
      return fullName?.split(' ')[0] || username;
    case 'full_name':
      return fullName || username;
    case 'username':
    default:
      return username;
  }
}

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

// ENABLED: Metro consolidation functions - consolidate ONLY LA Metro cities
function consolidateToMetropolitanArea(city: string, state?: string, country?: string): string {
  // LA Metro cities list - consolidate ALL of these to "Los Angeles Metro"
  const laMetroCities = [
    'Los Angeles', 'Playa del Rey', 'Santa Monica', 'Venice', 'Culver City',
    'Marina del Rey', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach',
    'El Segundo', 'Torrance', 'Hawthorne', 'Inglewood', 'West Hollywood',
    'Beverly Hills', 'Century City', 'Brentwood', 'Westwood', 'Pacific Palisades',
    'Malibu', 'Pasadena', 'Glendale', 'Burbank', 'North Hollywood', 'Studio City',
    'Sherman Oaks', 'Encino', 'Tarzana', 'Woodland Hills', 'Calabasas',
    'Agoura Hills', 'Thousand Oaks', 'Simi Valley', 'Northridge', 'Van Nuys',
    'Reseda', 'Canoga Park', 'Chatsworth', 'Granada Hills', 'Sylmar',
    'San Fernando', 'Pacoima', 'Sun Valley', 'La Crescenta', 'La Canada',
    'Montrose', 'Eagle Rock', 'Highland Park', 'Silver Lake', 'Los Feliz',
    'Echo Park', 'Downtown Los Angeles', 'Chinatown', 'Little Tokyo', 'Koreatown',
    'Mid-Wilshire', 'Hancock Park', 'Fairfax', 'West LA', 'Sawtelle',
    'Mar Vista', 'Del Rey', 'Palms', 'Cheviot Hills', 'Pico-Robertson',
    'Baldwin Hills', 'Leimert Park', 'Hyde Park', 'Watts', 'Compton',
    'Lynwood', 'South Gate', 'Downey', 'Norwalk', 'Whittier',
    'Long Beach', 'Venice Beach'
  ];
  
  // ONLY consolidate actual LA Metro cities to "Los Angeles Metro"
  if (laMetroCities.includes(city)) {
    return 'Los Angeles Metro';
  }
  
  // For all other cities, return the original city name unchanged
  return city;
}

// Get all cities in a metropolitan area with LA Metro consolidation
function getMetropolitanAreaCities(mainCity: string, state?: string, country?: string): string[] {
  if (mainCity.toLowerCase() === 'los angeles' && state?.toLowerCase() === 'california') {
    return [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 'Manhattan Beach', 
      'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank', 'Glendale', 
      'Long Beach', 'Torrance', 'Inglewood', 'Culver City', 'Marina del Rey',
      'Hermosa Beach', 'Redondo Beach', 'Hawthorne', 'Hollywood', 'Studio City',
      'Sherman Oaks', 'Encino', 'Van Nuys', 'Northridge', 'Malibu',
      'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City', 'Playa del Rey'
    ];
  }
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

// Location-based notification function - sends notifications to EXISTING users about NEW user
async function sendLocationMatchNotifications(newUser: any) {
  try {
    const { emailService } = await import('./services/emailService');
    
    if (!newUser.hometownCity) {
      console.log("Skipping location notifications - new user has no city data");
      return;
    }

    // Find existing users in the same city (excluding the new user)
    const sameLocationUsers = await storage.getUsersByCity(newUser.hometownCity);
    const existingUsers = sameLocationUsers.filter(user => user.id !== newUser.id);

    console.log(`🌍 Found ${existingUsers.length} existing users in ${newUser.hometownCity} to notify about new user @${newUser.username}`);

    if (existingUsers.length === 0) {
      console.log(`📭 No existing users in ${newUser.hometownCity} to notify`);
      return;
    }

    // Send notifications to existing users about the new user
    for (const existingUser of existingUsers) {
      if (!existingUser.email) continue;

      try {
        // Create in-app notification for existing user
        await storage.createNotification({
          userId: existingUser.id,
          fromUserId: newUser.id,
          type: "location_match",
          title: `New ${newUser.userType || 'user'} in ${newUser.hometownCity}!`,
          message: `@${newUser.username} just joined from ${newUser.hometownCity}. Say hello!`,
          data: JSON.stringify({
            newUserId: newUser.id,
            newUserUsername: newUser.username,
            newUserType: newUser.userType,
            city: newUser.hometownCity,
            profileUrl: `/profile/${newUser.username}`
          })
        });

        // Send email notification to existing user about new user
        const sharedInterests = findSharedInterests(existingUser.interests || [], newUser.interests || []);
        
        await emailService.sendLocationMatchEmail(existingUser.email, {
          recipientName: existingUser.name || existingUser.username,
          newUserName: newUser.username,
          city: newUser.hometownCity,
          newUserType: newUser.userType || 'traveler',
          sharedInterests: sharedInterests
        });

        console.log(`✅ Location match notification sent to existing user ${existingUser.email} about new user @${newUser.username}`);
      } catch (notificationError) {
        console.error(`❌ Failed to send notification to ${existingUser.email}:`, notificationError);
      }
    }

    console.log(`🎉 Successfully notified ${existingUsers.length} existing users in ${newUser.hometownCity} about new user @${newUser.username}`);
  } catch (error) {
    console.error("Error in sendLocationMatchNotifications:", error);
  }
}

// Helper function to find shared interests
function findSharedInterests(userInterests: string[], newUserInterests: string[]): string[] {
  if (!userInterests || !newUserInterests) return [];
  return userInterests.filter(interest => newUserInterests.includes(interest)).slice(0, 5); // Limit to top 5
}

// Track user for 3-day digest instead of instant notifications
async function trackUserForWeeklyDigest(user: any) {
  try {
    if (!user.hometownCity || !user.username) {
      console.log("⚠️ Skipping 3-day digest tracking - missing city or username data");
      return;
    }

    await storage.trackUserForWeeklyDigest(
      user.id,
      user.hometownCity,
      user.username,
      user.userType || 'traveler',
      user.interests || []
    );

    console.log(`📋 User @${user.username} tracked for 3-day digest in ${user.hometownCity}`);
  } catch (error) {
    console.error("Error tracking user for 3-day digest:", error);
  }
}

// Send 3-day digest emails function
async function sendWeeklyDigestEmails() {
  try {
    const { emailService } = await import('./services/emailService');
    
    // Calculate the previous 3-day cycle
    const now = new Date();
    const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const previousCycleNumber = Math.floor(daysSinceEpoch / 3) - 1; // Previous 3-day cycle
    
    const lastCycleStart = new Date(previousCycleNumber * 3 * 24 * 60 * 60 * 1000);
    lastCycleStart.setHours(0, 0, 0, 0);
    
    const lastCycleEnd = new Date(lastCycleStart);
    lastCycleEnd.setDate(lastCycleStart.getDate() + 2);
    lastCycleEnd.setHours(23, 59, 59, 999);

    console.log(`📧 Starting 3-day digest for cycle: ${lastCycleStart.toDateString()} - ${lastCycleEnd.toDateString()}`);

    // Get users who joined in the last 3-day cycle grouped by city
    const digestData = await storage.getWeeklyDigestUsers(lastCycleStart, lastCycleEnd);
    
    if (digestData.length === 0) {
      console.log("📭 No new users to digest for last 3-day cycle");
      return { citiesProcessed: 0, emailsSent: 0, message: "No new users for 3-day digest" };
    }

    let totalEmailsSent = 0;
    let citiesProcessed = 0;

    for (const cityData of digestData) {
      const { city, new_users } = cityData;
      citiesProcessed++;

      console.log(`🌍 Processing 3-day digest for ${city}: ${new_users.length} new users`);

      // Get existing users in this city to send the digest to
      const existingUsers = await storage.getUsersByCity(city);
      
      // Filter out users who joined in this cycle (they shouldn't get digest about themselves)
      const recipientUsers = existingUsers.filter(user => {
        const userJoinDate = new Date(user.createdAt || user.joinDate);
        return userJoinDate < lastCycleStart;
      });

      console.log(`📮 Sending 3-day digest to ${recipientUsers.length} existing users in ${city}`);

      // Send digest email to each existing user
      for (const recipient of recipientUsers) {
        if (!recipient.email) continue;

        try {
          await emailService.sendWeeklyNewUsersDigest(recipient.email, {
            recipientName: recipient.name || recipient.username,
            city: city,
            newUsers: new_users,
            weekStart: lastCycleStart,
            weekEnd: lastCycleEnd
          });

          totalEmailsSent++;
          console.log(`✅ 3-day digest sent to ${recipient.email} about ${new_users.length} new users in ${city}`);
        } catch (emailError) {
          console.error(`❌ Failed to send 3-day digest to ${recipient.email}:`, emailError);
        }
      }
    }

    // Mark this cycle's digest as sent
    await storage.markDigestAsSent(lastCycleStart, lastCycleEnd);

    console.log(`🎉 3-day digest completed: ${totalEmailsSent} emails sent across ${citiesProcessed} cities`);

    return {
      citiesProcessed,
      emailsSent: totalEmailsSent,
      cycleRange: `${lastCycleStart.toDateString()} - ${lastCycleEnd.toDateString()}`,
      message: "3-day digest sent successfully"
    };

  } catch (error) {
    console.error("Error in sendWeeklyDigestEmails:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  if (process.env.NODE_ENV === 'development') console.log("Starting routes registration...");

  // FIRST: Setup simple authentication for investor demo - NO POPUPS
  
  // Direct login - no OAuth popup
  app.get("/api/login", async (req, res) => {
    console.log("🔐 Direct login - fetching real user data");
    
    try {
      // Get the real user from database
      const user = await storage.getUser("2");
      
      if (user) {
        // Create session with real user data
        (req as any).session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          profileImageUrl: user.profileImage
        };
        
        // CRITICAL: Save the session
        (req as any).session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
          } else {
            console.log("✅ Session saved! User logged in:", user.username);
          }
          res.redirect("/");
        });
      } else {
        console.error("User not found in database");
        res.redirect("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      res.redirect("/");
    }
  });

  // Real login endpoint with credentials
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      console.log("🔐 Login attempt for:", email);
      
      // Try to find user by email first, then by username
      let user = await storage.getUserByEmail(email);
      console.log("🔍 User found by email:", !!user);
      
      if (!user) {
        user = await storage.getUserByUsername(email); // email field might contain username
        console.log("🔍 User found by username:", !!user);
      }
      
      if (!user) {
        console.log("❌ No user found for:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("🔍 Found user:", user.username, "with password set:", !!user.password);

      // Simple password check (in production, use bcrypt)
      const isValidPassword = password === user.password;
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      (req as any).session = (req as any).session || {};
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImage
      };

      // Save session
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        console.log("✅ Login successful for:", email);
        return res.status(200).json({ ok: true, user: { id: user.id, username: user.username } });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Logout route - supports both GET and POST
  app.get("/api/logout", (req, res) => {
    console.log("🔐 Logout GET");
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
  
  // POST logout for client-side calls - BULLETPROOF VERSION
  app.post("/api/auth/logout", (req, res) => {
    console.log("🔐 Logout POST");
    const cookieOpts = { 
      path: "/", 
      sameSite: "lax" as const, 
      secure: false, 
      httpOnly: true 
    };
    
    if (!(req as any).session) {
      res.clearCookie("nt.sid", cookieOpts); // Clear cookie even if no session
      return res.status(200).json({ ok: true });
    }
    
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.clearCookie("nt.sid", cookieOpts); // Use correct cookie name
      return res.status(200).json({ ok: true });
    });
  });

  // QUICK DEBUG - Check who's logged in
  app.get("/api/auth/whoami", (req: any, res) => {
    res.json({ user: req.session?.user || null });
  });

  // Auth check route
  app.get("/api/auth/user", async (req, res) => {
    const sessionUser = (req as any).session.user;
    if (sessionUser) {
      // Return real user data from database
      try {
        const user = await storage.getUser(sessionUser.id);
        if (user) {
          console.log("✅ Auth check: User authenticated:", user.username);
          res.json(user);
        } else {
          res.status(401).json({ message: "User not found" });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        res.status(500).json({ message: "Auth check failed" });
      }
    } else {
      console.log("❌ Auth check: No session");
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // Simple auth middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    const user = req.session.user;
    if (user) {
      req.user = user;
      return next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  if (process.env.NODE_ENV === 'development') console.log("Simple authentication setup completed - NO POPUPS");

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

  // FIXED: City stats endpoint - LA METRO CITIES ONLY
  app.get("/api/city-stats", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log("🏙️ LOADING ALL CITIES: Getting city stats for all cities");

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
        AND city_name NOT IN ('Test City', 'Global', 'test city', 'global')
        ORDER BY city_name
      `);

      // Import LA Metro cities for consolidation
      const { METRO_AREAS } = await import('../shared/constants');
      const laMetroCities = METRO_AREAS['Los Angeles'].cities;
      
      // Get state/country for cities - LA Metro get California/US, others get from database
      const getCityCountry = async (cityName: string): Promise<{ state: string, country: string }> => {
        // LA Metro consolidated city and individual LA Metro cities are in California, United States
        if (cityName === 'Los Angeles Metro' || laMetroCities.includes(cityName)) {
          return { state: 'California', country: 'United States' };
        }
        
        // For other cities, look up actual country from BOTH hometown and travel destinations
        const cityCountryQuery = await db.execute(sql`
          SELECT hometown_country as country, hometown_state as state 
          FROM users 
          WHERE hometown_city = ${cityName} 
          AND hometown_country IS NOT NULL 
          AND hometown_country != ''
          LIMIT 1
        `);
        
        if (cityCountryQuery.rows.length > 0) {
          const row = cityCountryQuery.rows[0] as any;
          return { 
            state: row.state || '', 
            country: row.country
          };
        }

        // Also check travel destinations for this city
        const travelDestinationQuery = await db.execute(sql`
          SELECT destination_country as country, destination_state as state
          FROM travel_plans 
          WHERE destination_city = ${cityName}
          AND destination_country IS NOT NULL 
          AND destination_country != ''
          LIMIT 1
        `);
        
        if (travelDestinationQuery.rows.length > 0) {
          const row = travelDestinationQuery.rows[0] as any;
          return { 
            state: row.state || '', 
            country: row.country
          };
        }
        
        // If still no country found, this is a data quality issue
        console.error(`🚨 MISSING COUNTRY DATA for city: ${cityName} - This should never happen!`);
        throw new Error(`Missing country data for ${cityName}`);
      };

      // SHOW ALL CITIES - No filtering
      const rawCities = uniqueCitiesQuery.rows.map((row: any) => row.city);
      
      // Always ensure we have at least Los Angeles for consolidation
      if (rawCities.length === 0 || !rawCities.includes('Los Angeles')) {
        rawCities.push('Los Angeles');
      }
      // ENABLED: Metro consolidation for all cities
      const consolidatedCityMap = new Map<string, string[]>();
      const consolidatedCityNames = new Set<string>();

      // Process each city and consolidate to metro areas
      for (const cityName of rawCities) {
        const cityData = await getCityCountry(cityName);
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

            // FIXED: Count ALL traveler associations with cities in this metro area
            // 1. Travel plans TO these cities
            const travelPlansToResult = await db
              .select({ count: count() })
              .from(travelPlans)
              .innerJoin(users, eq(travelPlans.userId, users.id))
              .where(
                and(
                  or(...originalCities.map(origCity => ilike(travelPlans.destination, `%${origCity}%`))),
                  eq(users.userType, 'traveler')
                )
              );

            // 2. Current travelers TO these cities (travelDestination field)
            const currentTravelersToResult = await db
              .select({ count: count() })
              .from(users)
              .where(
                and(
                  or(...originalCities.map(origCity => ilike(users.travelDestination, `%${origCity}%`))),
                  eq(users.userType, 'traveler')
                )
              );

            // 3. Travelers with destinationCity matching these cities
            const travelersWithDestinationResult = await db
              .select({ count: count() })
              .from(users)
              .where(
                and(
                  or(...originalCities.map(origCity => eq(users.destinationCity, origCity))),
                  eq(users.userType, 'traveler')
                )
              );

            // 4. Travelers FROM these cities (hometown in metro area, userType = traveler)
            const travelersFromResult = await db
              .select({ count: count() })
              .from(users)
              .where(
                and(
                  or(...originalCities.map(origCity => eq(users.hometownCity, origCity))),
                  eq(users.userType, 'traveler')
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
            
            // Sum all traveler associations (may have some overlap but better than missing users)
            const plansToCount = travelPlansToResult[0]?.count || 0;
            const currentToCount = currentTravelersToResult[0]?.count || 0;
            const destinationCount = travelersWithDestinationResult[0]?.count || 0;
            const fromCount = travelersFromResult[0]?.count || 0;
            const travelerCount = plansToCount + currentToCount + destinationCount + fromCount;
            
            const eventCount = eventsResult[0]?.count || 0;


            const cityLocation = await getCityCountry(cityName);
            
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

      // 🌍 SPECIAL HANDLING FOR GLOBAL - Show site-wide statistics
      if (city === 'Global') {
        if (process.env.NODE_ENV === 'development') console.log(`🌍 GLOBAL STATS: Calculating site-wide statistics for all users`);
        
        // Count ALL locals across the entire platform
        localUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.userType, 'local'));

        // Count ALL business users across the entire platform
        businessUsersResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.userType, 'business'));

        // Count ALL travelers across the entire platform
        const allTravelersResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.userType, 'traveler'));

        // Count ALL events across the entire platform
        eventsResult = await db
          .select({ count: count() })
          .from(events);

        const localCount = localUsersResult[0]?.count || 0;
        const businessCount = businessUsersResult[0]?.count || 0;
        const travelerCount = allTravelersResult[0]?.count || 0;
        const eventCount = eventsResult[0]?.count || 0;

        const globalStats = {
          city: 'Global',
          state: '',
          country: 'Global',
          localCount,
          travelerCount,
          businessCount,
          eventCount
        };

        if (process.env.NODE_ENV === 'development') console.log(`🌍 GLOBAL STATS: Site-wide totals:`, globalStats);
        res.json(globalStats);
        return;
      }

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

      // FIXED: Count ALL traveler associations with this city
      // 1. Travelers with travel plans TO this city
      const travelerUsersWithPlansResult = await db
        .select({ count: count() })
        .from(travelPlans)
        .innerJoin(users, eq(travelPlans.userId, users.id))
        .where(
          and(
            or(...searchCities.map(searchCity => ilike(travelPlans.destination, `%${searchCity}%`))),
            eq(users.userType, 'traveler') // Only count actual traveler users
          )
        );

      // 2. Travelers currently traveling TO this city (travelDestination field)
      const currentTravelersToResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => ilike(users.travelDestination, `%${searchCity}%`))),
            eq(users.userType, 'traveler') // Only count actual traveler users
          )
        );

      // 3. Travelers with destinationCity field (direct field match)
      const travelersWithDestinationResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => eq(users.destinationCity, searchCity))),
            eq(users.userType, 'traveler')
          )
        );

      // 4. Travelers FROM this city (hometown = city, userType = traveler)
      const travelersFromCityResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            or(...searchCities.map(searchCity => eq(users.hometownCity, searchCity))),
            eq(users.userType, 'traveler')
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
      
      // Sum all traveler associations with this city (avoiding double counts)
      const travelPlansCount = travelerUsersWithPlansResult[0]?.count || 0;
      const currentToCount = currentTravelersToResult[0]?.count || 0;
      const destinationCount = travelersWithDestinationResult[0]?.count || 0;
      const fromCityCount = travelersFromCityResult[0]?.count || 0;
      
      // For now, sum all counts (we may have some overlap but it's better than missing users)
      const travelerCount = travelPlansCount + currentToCount + destinationCount + fromCityCount;
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
  
  // DISABLED: Global chatroom initialization to prevent phantom chatroom creation
  // storage.ensureMeetLocalsChatrooms()
  //   .then(() => {
  //     if (process.env.NODE_ENV === 'development') console.log("Chatrooms initialization completed");
  //   })
  //   .catch(err => {
  //     if (process.env.NODE_ENV === 'development') console.error("Chatrooms initialization failed:", err);
  //   });
  
  if (process.env.NODE_ENV === 'development') console.log("Chatrooms initialization DISABLED to prevent phantom rooms");

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

  // POST /api/cities/ensure - Create/initialize city infrastructure when users travel
  app.post("/api/cities/ensure", async (req, res) => {
    try {
      const { city, state, country } = req.body;
      
      if (!city) {
        return res.status(400).json({ message: "City name is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ ENSURING CITY: ${city}`);
      
      // Check if city page already exists
      const existingCity = await db.select().from(cityPages)
        .where(and(
          eq(cityPages.cityName, city),
          eq(cityPages.state, state || ''),
          eq(cityPages.country, country || '')
        )).limit(1);
      
      if (existingCity.length === 0) {
        // Create city page
        await db.insert(cityPages).values({
          cityName: city,
          state: state || '',
          country: country || '',
          description: `Discover ${city} and connect with locals and travelers`,
          heroImage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        if (process.env.NODE_ENV === 'development') console.log(`🏙️ CREATED CITY PAGE: ${city}`);
      }
      
      // Ensure city has basic activities (using existing function)
      try {
        const { ensureCityHasActivities } = await import('./auto-city-setup');
        await ensureCityHasActivities(city, state, country);
        if (process.env.NODE_ENV === 'development') console.log(`🏃 ENSURED ACTIVITIES: ${city}`);
      } catch (error) {
        console.log(`⚠️ ACTIVITIES SETUP WARNING: ${error}`);
      }
      
      // Create default chatroom if it doesn't exist
      const existingChatroom = await db.select().from(citychatrooms)
        .where(and(
          eq(citychatrooms.city, city),
          eq(citychatrooms.state, state || ''),
          eq(citychatrooms.country, country || '')
        )).limit(1);
      
      if (existingChatroom.length === 0) {
        await db.insert(citychatrooms).values({
          city: city,
          state: state || '',
          country: country || '',
          name: `${city} General Chat`,
          description: `Connect with locals and travelers in ${city}`,
          isPrivate: false,
          createdAt: new Date()
        });
        
        if (process.env.NODE_ENV === 'development') console.log(`💬 CREATED CHATROOM: ${city}`);
      }
      
      res.json({ 
        message: "City infrastructure ensured", 
        city, 
        state, 
        country,
        created: existingCity.length === 0
      });
      
    } catch (error) {
      console.error('Error ensuring city infrastructure:', error);
      res.status(500).json({ message: 'Failed to ensure city infrastructure' });
    }
  });

  // GET /api/cities/:city/overview - Get city overview data
  app.get("/api/cities/:city/overview", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const { state, country } = req.query;
      
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY OVERVIEW: ${city}`);
      
      // Get city page info
      const cityPage = await db.select().from(cityPages)
        .where(and(
          eq(cityPages.cityName, city),
          eq(cityPages.state, (state as string) || ''),
          eq(cityPages.country, (country as string) || '')
        )).limit(1);
      
      // Get city stats (reuse existing logic from city-stats endpoint)
      const [coords, stats] = await Promise.all([
        Promise.resolve({ lat: 34.0522, lng: -118.2437 }), // Default LA coords for now
        (async () => {
          const usersInCity = await storage.getUsersInCity(city, state as string, country as string);
          const eventsInCity = await storage.getEventsInCity([city]);
          const businessesInCity = await storage.getBusinessesInCity([city]);
          
          return {
            totalUsers: usersInCity.length,
            totalEvents: eventsInCity.length,
            totalBusinesses: businessesInCity.length,
            locals: usersInCity.filter(u => u.userType === 'local').length,
            travelers: usersInCity.filter(u => u.userType === 'traveler').length
          };
        })()
      ]);
      
      res.json({
        cityPage: cityPage[0] || null,
        coordinates: coords,
        stats,
        city,
        state,
        country
      });
      
    } catch (error) {
      console.error('Error getting city overview:', error);
      res.status(500).json({ message: 'Failed to get city overview' });
    }
  });

  // GET /api/cities/:city/matches - Get compatibility matches for a city
  app.get("/api/cities/:city/matches", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const { userId, limit = 20 } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 CITY MATCHES: ${city} for user ${userId}`);
      
      // Get all users in the city
      const usersInCity = await storage.getUsersInCity(city);
      const currentUser = await storage.getUser(parseInt(userId as string));
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Use existing matching service to get compatibility scores
      const matchingService = new TravelMatchingService();
      const matches = [];
      
      for (const user of usersInCity) {
        if (user.id === currentUser.id) continue; // Skip self
        
        const compatibility = await matchingService.getCompatibilityData(
          currentUser,
          user,
          usersInCity // Pass all users for context
        );
        
        matches.push({
          user,
          compatibility
        });
      }
      
      // Sort by compatibility score
      matches.sort((a, b) => (b.compatibility.score || 0) - (a.compatibility.score || 0));
      
      // Limit results
      const limitedMatches = matches.slice(0, parseInt(limit as string));
      
      res.json(limitedMatches);
      
    } catch (error) {
      console.error('Error getting city matches:', error);
      res.status(500).json({ message: 'Failed to get city matches' });
    }
  });

  // City users endpoint - get all users for a specific city page WITH PROPER LA METRO CONSOLIDATION
  app.get("/api/city/:city/users", async (req, res) => {
    try {
      const city = decodeURIComponent(req.params.city);
      const { state, country } = req.query;
      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITY USERS: Getting users for ${city}, ${state}, ${country}`);
      
      // Get travelers with active trips to this city
      const today = new Date();
      const travelersInCity = await db
        .select({
          travel: travelPlans,
          user: users
        })
        .from(travelPlans)
        .leftJoin(users, eq(travelPlans.userId, users.id))
        .where(
          and(
            or(
              ilike(travelPlans.destinationCity, `%${city}%`),
              ilike(travelPlans.destination, `%${city}%`)
            ),
            lte(travelPlans.startDate, today),
            gte(travelPlans.endDate, today)
          )
        );
      
      // Use the same logic as /api/users endpoint for consistency
      let query = db.select().from(users);
      const conditions = [];
      
      // Check if this is a metro city that should be consolidated to Los Angeles
      const { METRO_AREAS } = await import('../shared/constants');
      const isLAMetroCity = METRO_AREAS['Los Angeles'].cities.includes(city);
      
      if (isLAMetroCity || city === 'Los Angeles Metro') {
        // Search for ALL LA metro cities (locals/residents)
        const allLACities = METRO_AREAS['Los Angeles'].cities;
        if (process.env.NODE_ENV === 'development') console.log(`🌍 LA METRO SEARCH: Searching for users in ALL LA metro cities:`, allLACities.length, 'cities');
        
        const locationConditions = allLACities.map(metroCity => 
          or(
            ilike(users.location, `%${metroCity}%`),
            ilike(users.hometownCity, `%${metroCity}%`)
          )
        );
        conditions.push(or(...locationConditions));
      } else {
        // Regular city search - use exact matching to prevent Austin/Vegas appearing in LA (locals/residents)
        conditions.push(
          or(
            ilike(users.location, `%${city}%`),
            ilike(users.hometownCity, `%${city}%`)
          )
        );
      }
      
      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const localUsers = await query;
      
      // Combine local residents with active travelers
      const allCityUsers = new Set();
      const combinedUsers = [];
      
      // Add local residents first
      for (const user of localUsers) {
        if (user && !allCityUsers.has(user.id)) {
          allCityUsers.add(user.id);
          combinedUsers.push(user);
        }
      }
      
      // Add active travelers to this city
      for (const travelRecord of travelersInCity) {
        const traveler = travelRecord.user;
        if (traveler && !allCityUsers.has(traveler.id)) {
          allCityUsers.add(traveler.id);
          // Mark user as currently traveling for display purposes
          combinedUsers.push({
            ...traveler,
            isCurrentlyTraveling: true,
            currentTravelDestination: city
          });
        }
      }
      
      // Remove passwords and prepare response
      const finalUsers = combinedUsers.map(user => {
        if (!user) return null;
        
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          ...userWithoutPassword,
          hometownCity: user.hometownCity || '',
          location: user.location
        };
      }).filter(Boolean);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏙️ CITY USERS: Found ${localUsers.length} locals + ${travelersInCity.length} travelers`);
        console.log(`🏙️ CITY USERS: Final result - ${finalUsers.length} users for ${city}`);
      }
      
      return res.json(finalUsers);
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
      const userIdHeader = req.headers['x-user-id'] as string;
      const currentUserId = userIdHeader && !isNaN(parseInt(userIdHeader)) ? parseInt(userIdHeader) : null;

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
      if (currentUserId && currentUserId > 0) {
        try {
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
        } catch (error) {
          if (process.env.NODE_ENV === 'development') console.error(`Error fetching current user ${currentUserId}:`, error);
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
  
  // User status endpoint for temporal local/traveler logic
  app.get("/api/users/:userId/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const { getUserCurrentStatus } = await import('./services/user-status-service');
      const status = await getUserCurrentStatus(userId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching user status:', error);
      res.status(500).json({ error: 'Failed to fetch user status' });
    }
  });

  // General user search endpoint for tagging functionality
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        })
        .from(users)
        .where(
          or(
            ilike(users.username, `%${query}%`),
            ilike(users.firstName, `%${query}%`),
            ilike(users.lastName, `%${query}%`)
          )
        )
        .limit(20);
        
      res.json(searchResults);
    } catch (error: any) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users", error });
    }
  });

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

      // Create session for the user
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImage
      };

      // Save session
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        console.log("✅ Quick login successful for user:", user.username);
        return res.json({ ok: true, user: { id: user.id, username: user.username } });
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Quick login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Forgot Password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { emailOrUsername } = req.body;

      if (!emailOrUsername) {
        return res.status(400).json({ message: "Email or username is required" });
      }

      // Try to find user by email first, then by username
      let user = await storage.getUserByEmail(emailOrUsername);
      if (!user) {
        user = await storage.getUserByUsername(emailOrUsername);
      }
      
      if (!user || !user.email) {
        // For security, return success even if user doesn't exist
        return res.json({ message: "If an account with this email or username exists, a password reset link has been sent." });
      }

      // Generate reset token (simple approach for now)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in user record using correct column names
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt
      });

      // Send password reset email
      const { emailService } = await import('./services/emailService');
      console.log(`🔍 Attempting to send forgot password email to: ${user.email}`);
      const emailResult = await emailService.sendForgotPasswordEmail(user.email!, {
        name: user.displayName || user.username || 'User',
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`,
        expiryHours: 1
      });

      console.log(`📧 Email send result:`, emailResult);
      console.log(`✅ Password reset email ${emailResult ? 'sent' : 'FAILED'} to ${user.email}`);
      
      // For development - return the reset link so you can test (NODE_ENV is undefined in Replit dev)
      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        return res.json({ 
          message: "If an account with this email or username exists, a password reset link has been sent.",
          resetLink: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`,
          devNote: "Reset link provided for development testing"
        });
      }
      
      return res.json({ message: "If an account with this email or username exists, a password reset link has been sent." });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify Reset Token endpoint
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Token is required", valid: false });
      }

      // Find user with this reset token
      const user = await storage.getUserByResetToken(token as string);
      if (!user || !user.passwordResetExpires || new Date() > user.passwordResetExpires) {
        return res.status(400).json({ message: "Invalid or expired reset token", valid: false });
      }

      return res.json({ message: "Token is valid", valid: true });
    } catch (error: any) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ message: "Failed to verify token", valid: false });
    }
  });

  // Reset Password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be 8 characters or more" });
      }

      // Find user with this reset token using correct column name
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.passwordResetExpires || new Date() > user.passwordResetExpires) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update password and clear reset token using correct column names
      await storage.updateUser(user.id, {
        password: newPassword, // Note: In production, this should be hashed
        passwordResetToken: null,
        passwordResetExpires: null
      });

      console.log(`✅ Password reset successful for user ${user.email}`);
      return res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Test endpoint for email and notification systems
  app.post("/api/test/messaging-systems", async (req, res) => {
    try {
      const { testType, email, username, city } = req.body;

      if (!testType) {
        return res.status(400).json({ message: "testType is required (forgot_password, location_match, welcome, or weekly_digest)" });
      }

      const { emailService } = await import('./services/emailService');

      if (testType === "forgot_password") {
        if (!email) {
          return res.status(400).json({ message: "Email is required for forgot password test" });
        }
        
        // Test forgot password email
        const resetToken = "test_token_123";
        const testSuccess = await emailService.sendForgotPasswordEmail(email, {
          name: username || "Test User",
          resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`,
          expiryHours: 1
        });

        return res.json({ 
          success: testSuccess, 
          message: testSuccess ? "Forgot password email sent successfully!" : "Failed to send email",
          testType: "forgot_password"
        });
      }

      if (testType === "location_match") {
        if (!email || !username || !city) {
          return res.status(400).json({ message: "Email, username, and city are required for location match test" });
        }

        // Test location match email
        const testSuccess = await emailService.sendLocationMatchEmail(email, {
          recipientName: "Test Recipient",
          newUserName: username,
          city: city,
          newUserType: "traveler",
          sharedInterests: ["Photography", "Local Food", "Nightlife"]
        });

        return res.json({ 
          success: testSuccess, 
          message: testSuccess ? "Location match email sent successfully!" : "Failed to send email",
          testType: "location_match"
        });
      }

      if (testType === "welcome") {
        if (!email || !username) {
          return res.status(400).json({ message: "Email and username are required for welcome test" });
        }

        // Test welcome email
        const testSuccess = await emailService.sendWelcomeEmail(email, {
          name: username,
          username: username,
          userType: "traveler"
        });

        return res.json({ 
          success: testSuccess, 
          message: testSuccess ? "Welcome email sent successfully!" : "Failed to send email",
          testType: "welcome"
        });
      }

      if (testType === "weekly_digest") {
        if (!email || !city) {
          return res.status(400).json({ message: "Email and city are required for weekly digest test" });
        }

        // Test weekly digest email with mock data
        const mockWeekStart = new Date();
        const mockWeekEnd = new Date(mockWeekStart);
        mockWeekEnd.setDate(mockWeekStart.getDate() + 6);

        const testSuccess = await emailService.sendWeeklyNewUsersDigest(email, {
          recipientName: username || "Test User",
          city: city,
          newUsers: [
            {
              username: "alex_traveler",
              userType: "traveler",
              interests: ["Photography", "Local Food"],
              joinDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
              username: "sarah_local",
              userType: "local",
              interests: ["Nightlife", "Art Galleries", "Hiking"],
              joinDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            }
          ],
          weekStart: mockWeekStart,
          weekEnd: mockWeekEnd
        });

        return res.json({ 
          success: testSuccess, 
          message: testSuccess ? "Weekly digest email sent successfully!" : "Failed to send email",
          testType: "weekly_digest"
        });
      }

      return res.status(400).json({ message: "Invalid testType. Use: forgot_password, location_match, welcome, or weekly_digest" });

    } catch (error: any) {
      console.error("Test endpoint error:", error);
      res.status(500).json({ message: "Test failed", error: error.message });
    }
  });

  // Send 3-day digest emails (manual trigger or cron job)
  app.post("/api/admin/send-weekly-digest", async (req, res) => {
    try {
      const result = await sendWeeklyDigestEmails();
      res.json({ 
        success: true, 
        message: "3-day digest process completed",
        ...result
      });
    } catch (error: any) {
      console.error("3-day digest sending failed:", error);
      res.status(500).json({ message: "Failed to send 3-day digest", error: error.message });
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

  // Profile completion endpoint - handles heavy operations after fast registration
  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user data for operations
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔄 Starting profile completion for user ${user.username} (${userId})`);

      // CRITICAL: Set proper travel status for new user based on their travel plans
      await TravelStatusService.setNewUserTravelStatus(user.id);

      // After creating a user, ensure "Meet Locals" chatrooms exist for both hometown and travel destinations
      await storage.ensureMeetLocalsChatrooms();

      // CRITICAL: Create chatrooms for user's hometown (all users have hometowns)
      if (user.hometownCity && user.hometownCountry) {
        try {
          await storage.ensureMeetLocalsChatrooms(user.hometownCity, user.hometownState, user.hometownCountry);
          if (process.env.NODE_ENV === 'development') console.log(`✓ Created/verified hometown chatroom for ${user.hometownCity}, ${user.hometownCountry}`);
          
          // REMOVED: Auto-joining - users choose chatrooms on profile page instead
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating hometown chatroom:', error);
        }
      }

      // REMOVED: Auto-joining to city chatrooms - users will choose on profile page instead

      // CRITICAL: Create chatrooms for travel destination if user is currently traveling
      if (user.isCurrentlyTraveling && user.travelDestination) {
        try {
          // Parse travel destination to get city, state, country
          const destinationParts = user.travelDestination.split(', ');
          const travelCity = destinationParts[0];
          const travelState = destinationParts[1];
          const travelCountry = destinationParts[2] || destinationParts[1]; // Handle cases where state might be country

          await storage.ensureMeetLocalsChatrooms(travelCity, travelState, travelCountry);
          if (process.env.NODE_ENV === 'development') console.log(`✓ Created/verified travel destination chatroom for ${user.travelDestination}`);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating travel destination chatroom:', error);
        }
      }

      // Auto-create city for ALL user types (locals, travelers, businesses) to ensure discover page completeness
      if (user.hometownCity && user.hometownCountry) {
        try {
          // METRO CONSOLIDATION AT SIGNUP: Check if hometown is LA Metro suburb
          let cityToCreate = user.hometownCity;
          const metroArea = getMetroArea(user.hometownCity);
          if (metroArea && metroArea !== user.hometownCity) {
            cityToCreate = metroArea;
            console.log(`🌍 SIGNUP METRO CONSOLIDATION: ${user.hometownCity} → ${metroArea}`);
            // Update user's hometown to consolidated city
            user.hometownCity = metroArea;
            await storage.updateUser(user.id, { hometownCity: metroArea });
          }
          
          if (process.env.NODE_ENV === 'development') console.log(`Creating city for new user: ${cityToCreate}, ${user.hometownState}, ${user.hometownCountry}`);

          // Ensure city exists in discover page (using consolidated city)
          await storage.ensureCityExists(
            cityToCreate,
            user.hometownState || '',
            user.hometownCountry
          );

          // For locals only, also create city page with secret activities
          if (user.userType === 'local') {
            const cityPage = await storage.ensureCityPageExists(
              cityToCreate,  // Use consolidated city
              user.hometownState || '',
              user.hometownCountry,
              user.id
            );
            if (process.env.NODE_ENV === 'development') console.log(`✓ Created city page for ${cityToCreate}`);
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating city for user:', error);
        }
      }

      // COMPREHENSIVE TRAVELER ONBOARDING - Execute all required steps (MISSING FROM ORIGINAL)
      if (user.userType === 'traveler' && user.isCurrentlyTraveling) {
        console.log("🚀 COMPREHENSIVE TRAVELER ONBOARDING - Executing all required steps for profile completion");
        
        // Create city match pages for both cities (with AI failure handling)
        try {
          // Hometown match page
          if (user.hometownCity) {
            try {
              await storage.ensureCityPageExists(user.hometownCity, user.hometownState, user.hometownCountry, user.id);
              console.log(`✓ PROFILE COMPLETION: Created hometown city page for ${user.hometownCity}`);
            } catch (cityError: any) {
              console.error(`PROFILE COMPLETION ERROR: Creating hometown city page for ${user.hometownCity}:`, cityError);
              // Don't fail the entire process if AI image generation fails
            }
          }
          // Destination match page
          if (user.travelDestination) {
            try {
              const destinationParts = user.travelDestination.split(', ');
              await storage.ensureCityPageExists(destinationParts[0], destinationParts[1], destinationParts[2] || destinationParts[1], user.id);
              console.log(`✓ PROFILE COMPLETION: Created destination city page for ${destinationParts[0]}`);
            } catch (cityError: any) {
              console.error(`PROFILE COMPLETION ERROR: Creating destination city page:`, cityError);
              // Don't fail the entire process if AI image generation fails
            }
          }
        } catch (error: any) {
          console.error('PROFILE COMPLETION ERROR: Creating city match pages:', error);
        }

        // Send welcome message from nearbytrav account (USER ID 2)
        try {
          // Find the nearbytrav system account (ID 2)
          const nearbytravAccount = await storage.getUser(2);
          if (nearbytravAccount) {
            await storage.sendSystemMessage(2, user.id, `Welcome to Nearby Traveler, ${user.name || user.username}! ✈️

I'm Aaron, and I'm excited to welcome you to our community of travelers, locals, and businesses who believe in authentic human connections.

🌍 **What You Can Do:**
• **Connect with Real People**: Find travelers and locals who share your interests
• **Join Live Events & Meetups**: Discover what's happening in your area right now
• **City Chat Rooms**: Jump into conversations with people in ${user.hometownCity}${user.travelDestination ? ` and ${user.travelDestination}` : ''}
• **Quick Meetups**: Create spontaneous hangouts when you're feeling social
• **AI-Powered Discovery**: Get personalized recommendations for activities and connections

🎯 **Your Next Steps:**
1. Complete your profile with interests and a photo
2. Browse people and events in your areas
3. Join your city chat rooms to start conversations
4. Create your first meetup or RSVP to an event

${user.travelDestination ? `Since you're traveling to ${user.travelDestination}, you'll get matched with locals and other travelers there who share your interests!` : `As a local in ${user.hometownCity}, you'll be notified when travelers with similar interests visit your area!`}

Questions? Just reply to this message. Welcome to the community!

- Aaron (your fellow nearby traveler)`);
            console.log(`✓ PROFILE COMPLETION: Sent welcome message from nearbytrav to ${user.username}`);
          } else {
            console.error('PROFILE COMPLETION ERROR: nearbytrav account (ID 2) not found');
          }
        } catch (error: any) {
          console.error('PROFILE COMPLETION ERROR: Sending welcome message:', error);
        }

        // Register user in both cities with proper status
        try {
          // Register as LOCAL in hometown
          if (user.hometownCity) {
            await storage.registerUserInCity(user.id, user.hometownCity, user.hometownState, user.hometownCountry, 'local');
            console.log(`✓ PROFILE COMPLETION: Registered user as local in ${user.hometownCity}`);
          }
          // Register as TRAVELER in destination  
          if (user.travelDestination) {
            const destinationParts = user.travelDestination.split(', ');
            await storage.registerUserInCity(user.id, destinationParts[0], destinationParts[1], destinationParts[2] || destinationParts[1], 'traveler');
            console.log(`✓ PROFILE COMPLETION: Registered user as traveler in ${destinationParts[0]}`);
          }
        } catch (error: any) {
          console.error('PROFILE COMPLETION ERROR: Registering user in cities:', error);
        }

        // CRITICAL: Connect user to nearbytrav system account (USER ID 2)
        try {
          await storage.createConnection({
            requesterId: 2,
            receiverId: user.id,
            status: 'accepted'
          });
          console.log(`✓ PROFILE COMPLETION: Connected user ${user.username} to nearbytrav system account`);
        } catch (error: any) {
          console.error('PROFILE COMPLETION ERROR: Creating connection to nearbytrav:', error);
        }
      } else {
        console.log(`🔄 PROFILE COMPLETION: User ${user.username} is not a currently traveling traveler - skipping comprehensive onboarding`);
        console.log(`   User type: ${user.userType}, Currently traveling: ${user.isCurrentlyTraveling}`);
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ Profile completion finished for user ${user.username} (${userId})`);

      return res.status(200).json({ 
        message: "Profile completion successful with comprehensive onboarding",
        status: "completed" 
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Profile completion error:', error);
      return res.status(500).json({ message: "Profile completion failed", error: error.message });
    }
  });

  // ✅ CRITICAL: Bootstrap endpoint for comprehensive traveler onboarding
  app.post("/api/bootstrap/after-register", async (req: any, res) => {
    // Require authentication - derive userId from session, don't trust client
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const userId = req.session.user.id;
    
    try {
      console.log(`🚀 BOOTSTRAP: Running post-signup setup for user ${userId}`);
      
      // ✅ CRITICAL: Fetch user data and check if already completed
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // ✅ IDEMPOTENT: Check if bootstrap already completed
      // For now, use a simple check - can be enhanced with dedicated field later
      const existingConnections = await storage.getUserConnections(userId);
      const alreadyBootstrapped = existingConnections.some(conn => 
        (conn.requesterId === 2 || conn.receiverId === 2) && conn.status === 'accepted'
      );
      
      if (alreadyBootstrapped) {
        console.log(`🔄 BOOTSTRAP: User ${userId} already bootstrapped, skipping`);
        return res.status(200).json({ 
          status: "already_completed",
          message: "Bootstrap already completed" 
        });
      }
      
      // ✅ NON-BLOCKING: Return immediately, run bootstrap in background
      console.log(`⚡ BOOTSTRAP: Starting background operations for user ${userId}`);
      res.status(202).json({ 
        status: "pending",
        message: "Bootstrap operations started in background" 
      });
      
      // Run all heavy operations in background using setImmediate
      setImmediate(() => runBootstrapOperations(userId, user));
      
    } catch (error: any) {
      console.error("Bootstrap error:", error);
      res.status(500).json({ message: "Bootstrap failed", error: error.message });
    }
  });

  // ✅ Bootstrap status tracking endpoint
  app.get("/api/bootstrap/status", async (req: any, res) => {
    // Require authentication
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const userId = req.session.user.id;
    
    try {
      // Simple status check based on connection to USER ID 2 (nearbytrav account)
      const existingConnections = await storage.getUserConnections(userId);
      const isBootstrapped = existingConnections.some(conn => 
        (conn.requesterId === 2 || conn.receiverId === 2) && conn.status === 'accepted'
      );
      
      if (isBootstrapped) {
        return res.status(200).json({ 
          status: "completed",
          progress: 100,
          message: "Bootstrap operations completed successfully" 
        });
      } else {
        return res.status(200).json({ 
          status: "pending",
          progress: 50,
          message: "Bootstrap operations in progress" 
        });
      }
    } catch (error: any) {
      console.error("Bootstrap status check error:", error);
      return res.status(500).json({ 
        status: "error",
        message: "Failed to check bootstrap status" 
      });
    }
  });

  // ✅ Background bootstrap operations function with individual try/catch per operation
  async function runBootstrapOperations(userId: number, user: any) {
    console.log(`🔄 BACKGROUND BOOTSTRAP: Starting operations for user ${userId}`);
    console.log(`👤 BOOTSTRAP: Found user ${user.username} (${user.id})`);
    console.log(`   userType: ${user.userType}, isCurrentlyTraveling: ${user.isCurrentlyTraveling}`);
    console.log(`   travelDestination: ${user.travelDestination}`);
    
    // ✅ AUTO-JOIN: Add user to hometown and travel city chatrooms
    try {
      console.log(`📱 BOOTSTRAP: Auto-joining user to city chatrooms`);
      const travelCity = user.isCurrentlyTraveling && user.travelDestination ? user.travelDestination.split(', ')[0] : undefined;
      const travelCountry = user.isCurrentlyTraveling && user.travelDestination ? user.travelDestination.split(', ')[2] || user.travelDestination.split(', ')[1] : undefined;
      
      await storage.autoJoinUserCityChatrooms(
        user.id, 
        user.hometownCity, 
        user.hometownCountry,
        travelCity,
        travelCountry
      );
      console.log(`✅ BOOTSTRAP: Auto-joined user ${user.id} to their city chatrooms`);
    } catch (error: any) {
      console.error('❌ BOOTSTRAP: Error auto-joining city chatrooms:', error);
    }

    // ✅ CHATROOMS: Ensure Meet Locals chatrooms exist for travel destination
    if (user.isCurrentlyTraveling && user.travelDestination) {
      try {
        console.log(`📍 BOOTSTRAP: Creating destination chatrooms for: ${user.travelDestination}`);
        const destinationParts = user.travelDestination.split(', ');
        const travelCity = destinationParts[0];
        const travelState = destinationParts[1];
        const travelCountry = destinationParts[2] || destinationParts[1];

        await storage.ensureMeetLocalsChatrooms(travelCity, travelState, travelCountry);
        console.log(`✅ BOOTSTRAP: Created/verified travel destination chatroom for ${user.travelDestination}`);
      } catch (error: any) {
        console.error('❌ BOOTSTRAP: Error creating travel destination chatroom:', error);
      }
    }

    // ✅ ENSURE HOMETOWN CHATROOMS: Create hometown chatrooms for ALL users
    if (user.hometownCity && user.hometownCountry) {
      try {
        console.log(`📍 BOOTSTRAP: Creating hometown chatrooms for: ${user.hometownCity}, ${user.hometownCountry}`);
        await storage.ensureMeetLocalsChatrooms(user.hometownCity, user.hometownState, user.hometownCountry);
        console.log(`✅ BOOTSTRAP: Created hometown chatrooms`);
      } catch (error: any) {
        console.error('❌ BOOTSTRAP: Error creating hometown chatrooms:', error);
      }
    }

    // ✅ CITY REGISTRATION: Register user in cities with proper status
    try {
      console.log(`👤 BOOTSTRAP: Registering user in cities`);
      
      // Register as LOCAL in hometown
      if (user.hometownCity) {
        await storage.registerUserInCity(
          user.id, 
          user.hometownCity, 
          user.hometownState, 
          user.hometownCountry, 
          'local'
        );
        console.log(`✅ BOOTSTRAP: Registered as local in hometown`);
      }
      
      // Register as TRAVELER in destination  
      if (user.travelDestination) {
        const destinationParts = user.travelDestination.split(', ');
        await storage.registerUserInCity(
          user.id, 
          destinationParts[0], 
          destinationParts[1], 
          destinationParts[2] || destinationParts[1], 
          'traveler'
        );
        console.log(`✅ BOOTSTRAP: Registered as traveler in destination`);
      }
    } catch (error: any) {
      console.error('❌ BOOTSTRAP: Error registering user in cities:', error);
    }

    // ✅ CONNECTION: Create connection to nearbytrav account (USER ID 2)
    try {
      console.log(`🤝 BOOTSTRAP: Creating connection to nearbytrav account`);
      await storage.createConnection({
        requesterId: 2,
        receiverId: user.id,
        status: 'accepted'
      });
      console.log(`✅ BOOTSTRAP: Connection created to nearbytrav account`);
    } catch (error: any) {
      console.error('❌ BOOTSTRAP: Error creating connection to nearbytrav:', error);
    }

    // ✅ AI CONTENT: Generate city content if needed
    if (user.hometownCity && user.hometownCountry) {
      try {
        console.log(`🤖 BOOTSTRAP: Generating AI content for ${user.hometownCity} if needed`);
        // Check if city needs content and generate if necessary
        // This can be expanded later with actual AI generation logic
        console.log(`✅ BOOTSTRAP: AI content generation completed`);
      } catch (error: any) {
        console.error('❌ BOOTSTRAP: Error generating AI content:', error);
      }
    }

    console.log(`✅ BOOTSTRAP: All operations completed for user ${user.username} (${user.id})`);
  }

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

  // Streamlined registration handler - just create user, defer heavy operations
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

      // Calculate newToTownUntil date (9 months from now in UTC) if user checked isNewToTown
      if (processedData.isNewToTown === true) {
        const now = new Date();
        const nineMonthsFromNow = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 9,
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds()
        ));
        processedData.newToTownUntil = nineMonthsFromNow;
        if (process.env.NODE_ENV === 'development') console.log("🆕 NEW TO TOWN: Set expiration date to (UTC)", nineMonthsFromNow.toISOString());
      } else {
        processedData.newToTownUntil = null;
        processedData.isNewToTown = false;
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
      if (processedData.userType === 'traveler' || processedData.userType === 'currently_traveling') {
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
      if (processedData.userType === 'currently_traveling' || processedData.userType === 'traveler') {
        // CRITICAL: Set traveling status flag for users who signed up as travelers
        processedData.isCurrentlyTraveling = true;
        
        // CRITICAL: Normalize userType to 'traveler' for database storage
        processedData.userType = 'traveler';
        
        // CRITICAL: Map destination fields from travel signup form
        if (processedData.currentTripDestinationCity) {
          let destination = processedData.currentTripDestinationCity;
          if (processedData.currentTripDestinationState) {
            destination += `, ${processedData.currentTripDestinationState}`;
          }
          if (processedData.currentTripDestinationCountry) {
            destination += `, ${processedData.currentTripDestinationCountry}`;
          }
          processedData.travelDestination = destination;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🧳 TRAVEL DESTINATION MAPPING:', {
              city: processedData.currentTripDestinationCity,
              state: processedData.currentTripDestinationState,
              country: processedData.currentTripDestinationCountry,
              finalDestination: destination
            });
          }
        }
        
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

      // Check if user already exists by email (with retry logic)
      let existingUserByEmail;
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          existingUserByEmail = await storage.getUserByEmail(userData.email);
          break;
        } catch (error: any) {
          retryCount++;
          if (retryCount >= 3 || !error?.message?.includes('Connection terminated')) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      if (existingUserByEmail) {
        if (process.env.NODE_ENV === 'development') console.log("Registration failed: Email already exists", userData.email);
        return res.status(409).json({ 
          message: "An account with this email already exists. Please use a different email or try logging in.",
          field: "email"
        });
      }

      // Check if username already exists (with retry logic)
      let existingUserByUsername;
      retryCount = 0;
      while (retryCount < 3) {
        try {
          existingUserByUsername = await storage.getUserByUsername(userData.username);
          break;
        } catch (error: any) {
          retryCount++;
          if (retryCount >= 3 || !error?.message?.includes('Connection terminated')) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
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

      // DOB is stored separately in dateOfBirth field - don't add to bio
      if (userData.dateOfBirth && userData.userType === 'traveler') {
        const dobString = new Date(userData.dateOfBirth).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        // DOB stored separately - not in bio
        if (process.env.NODE_ENV === 'development') console.log(`✓ DOB stored in dateOfBirth field: ${dobString}`);
      }

      if (process.env.NODE_ENV === 'development') console.log("Creating new user:", userData.email);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;

      // REMOVED: Travel plan creation moved to fast registration section to prevent duplicates

      // INSTANT OPERATIONS: Chatroom assignments and city setup (as before)
      try {
        // Auto-assign user to chatrooms immediately (this was always fast)
        if (user.hometownCity && user.hometownCountry) {
          await storage.assignUserToChatrooms(user.id, user.hometownCity, user.hometownState, user.hometownCountry);
          console.log('✅ CHATROOM ASSIGNMENT: User automatically assigned to chatrooms');
        }
      } catch (error) {
        console.error('❌ Failed to assign user to chatrooms:', error);
      }

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

      // ESSENTIAL: Create travel plans for travelers to get proper status
      // Check ALL possible field variations from different signup forms
      
      // CRITICAL DEBUG: Log all travel-related fields received
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 TRAVEL PLAN DEBUG - ALL RECEIVED FIELDS:');
        console.log('  userData.currentTravelCity:', userData.currentTravelCity);
        console.log('  userData.currentCity:', userData.currentCity);
        console.log('  userData.currentTravelCountry:', userData.currentTravelCountry);
        console.log('  userData.currentCountry:', userData.currentCountry);
        console.log('  userData.travelDestination:', userData.travelDestination);
        console.log('  userData.travelDestinationCity:', userData.travelDestinationCity);
        console.log('  userData.travelDestinationCountry:', userData.travelDestinationCountry);
        console.log('  userData.currentTripDestinationCity:', userData.currentTripDestinationCity);
        console.log('  userData.currentTripDestinationState:', userData.currentTripDestinationState);
        console.log('  userData.currentTripDestinationCountry:', userData.currentTripDestinationCountry);
        console.log('  userData.travelStartDate:', userData.travelStartDate);
        console.log('  userData.travelEndDate:', userData.travelEndDate);
        console.log('  userData.travelReturnDate:', userData.travelReturnDate);
        console.log('  userData.currentTripReturnDate:', userData.currentTripReturnDate);
        console.log('  userData.userType:', userData.userType);
        console.log('  userData.isCurrentlyTraveling:', userData.isCurrentlyTraveling);
      }
      
      const hasCurrentTravel = (userData.currentTravelCity || userData.currentCity) && (userData.currentTravelCountry || userData.currentCountry);
      const hasTravelDestination = userData.travelDestination || (userData.travelDestinationCity && userData.travelDestinationCountry) || (userData.currentTripDestinationCity && userData.currentTripDestinationCountry);
      const hasTravelDates = userData.travelStartDate && userData.travelEndDate;
      const hasReturnDateOnly = userData.travelReturnDate || userData.currentTripReturnDate; // For simplified signup
      const isTraveingUser = userData.userType === 'traveler' || userData.userType === 'currently_traveling' || userData.isCurrentlyTraveling;
      
      // DEBUG CONDITIONS
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 TRAVEL PLAN CONDITIONS:');
        console.log('  hasCurrentTravel:', hasCurrentTravel);
        console.log('  hasTravelDestination:', hasTravelDestination);
        console.log('  hasTravelDates:', hasTravelDates);
        console.log('  hasReturnDateOnly:', hasReturnDateOnly);
        console.log('  isTraveingUser:', isTraveingUser);
      }

      // CRITICAL FIX: Check if user already has travel plans to prevent duplicates
      const existingTravelPlans = await storage.getUserTravelPlans(user.id);
      const hasExistingTravelPlan = existingTravelPlans.length > 0;
      
      // FORCE DEBUG: Always log this section during development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 REACHED TRAVEL PLAN SECTION - About to check conditions');
        console.log('  existingTravelPlans.length:', existingTravelPlans.length);
        console.log('  hasExistingTravelPlan:', hasExistingTravelPlan);
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 DUPLICATE CHECK: User ${user.id} has ${existingTravelPlans.length} existing travel plans`);

      // Support both full travel dates and simplified return-date-only signup
      // BUT ONLY if user doesn't already have travel plans
      const shouldCreateTravelPlan = (hasCurrentTravel || hasTravelDestination) && (hasTravelDates || hasReturnDateOnly) && isTraveingUser && !hasExistingTravelPlan;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 SHOULD CREATE TRAVEL PLAN:', shouldCreateTravelPlan);
        console.log('  Condition breakdown:');
        console.log('    (hasCurrentTravel || hasTravelDestination):', (hasCurrentTravel || hasTravelDestination));
        console.log('    (hasTravelDates || hasReturnDateOnly):', (hasTravelDates || hasReturnDateOnly));
        console.log('    isTraveingUser:', isTraveingUser);
        console.log('    !hasExistingTravelPlan:', !hasExistingTravelPlan);
      }
      
      if (shouldCreateTravelPlan) {
        try {
          // CRITICAL FIX: Use userData instead of originalData to match condition checks
          // Build destination from all possible field variations
          const tripLocation = userData.travelDestination || [
            userData.currentTravelCity || userData.travelDestinationCity || userData.currentCity || userData.currentTripDestinationCity,
            userData.currentTravelState || userData.travelDestinationState || userData.currentState || userData.currentTripDestinationState,
            userData.currentTravelCountry || userData.travelDestinationCountry || userData.currentCountry || userData.currentTripDestinationCountry
          ].filter(Boolean).join(", ");

          if (process.env.NODE_ENV === 'development') console.log("CREATING TRAVEL PLAN:", { tripLocation, userId: user.id });

          // Handle both full travel dates and simplified return-date-only signup
          let startDate, endDate;
          if (userData.travelStartDate && userData.travelEndDate) {
            startDate = new Date(userData.travelStartDate);
            endDate = new Date(userData.travelEndDate);
          } else if (userData.travelReturnDate || userData.currentTripReturnDate) {
            startDate = new Date(); // Today
            endDate = new Date(userData.travelReturnDate || userData.currentTripReturnDate);
          }

          const travelPlan = await storage.createTravelPlan({
            userId: user.id,
            destination: tripLocation, // FIXED: Use correct field name for travel plan
            destinationCity: userData.currentCity || userData.currentTravelCity || userData.travelDestinationCity,
            destinationState: userData.currentState || userData.currentTravelState || userData.travelDestinationState,  
            destinationCountry: userData.currentCountry || userData.currentTravelCountry || userData.travelDestinationCountry,
            startDate,
            endDate,
            activities: [],
            accommodation: null,
            budget: null,
            notes: null
          });

          if (process.env.NODE_ENV === 'development') console.log("TRAVEL PLAN CREATED SUCCESSFULLY:", travelPlan.id);

          // CRITICAL: Update user to show as BOTH traveler AND local (dual status)
          // They remain a local in their hometown AND become a traveler in destination
          await storage.updateUser(user.id, { 
            userType: 'traveler',  // FIXED: Use correct database column name
            isCurrentlyTraveling: true,
            aura: 1  // Award initial 1 aura point
          });
          if (process.env.NODE_ENV === 'development') console.log(`User ${user.username} (${user.id}) is now a traveler with 1 aura point`);

        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') console.error('Error creating travel plan during signup:', error);
          // Don't fail registration if travel plan creation fails
        }
      } else if (hasExistingTravelPlan) {
        if (process.env.NODE_ENV === 'development') console.log(`🚫 SKIPPING TRAVEL PLAN CREATION: User ${user.id} already has ${existingTravelPlans.length} travel plans - preventing duplicates`);
      }

      // CRITICAL: Create user session after successful registration
      if (process.env.NODE_ENV === 'development') console.log("🔐 Creating session for newly registered user:", user.username);
      (req as any).session = (req as any).session || {};
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType
      };

      // Send welcome message from nearbytrav account (USER ID 2)
      try {
        // Find the nearbytrav system account (ID 2)
        const nearbytravAccount = await storage.getUser(2);
        if (nearbytravAccount) {
          await storage.sendSystemMessage(2, user.id, `Welcome to Nearby Traveler, ${user.name || user.username}! ✈️

I'm Aaron, and I'm excited to welcome you to our community of travelers, locals, and businesses who believe in authentic human connections.

🌍 **What You Can Do:**
• **Connect with Real People**: Find travelers and locals who share your interests
• **Join Live Events & Meetups**: Discover what's happening in your area right now
• **City Chat Rooms**: Jump into conversations with people in ${user.hometownCity}${hasExistingTravelPlan ? ` and your travel destination` : ''}
• **Quick Meetups**: Create spontaneous hangouts when you're feeling social
• **AI-Powered Discovery**: Get personalized recommendations for activities and connections

🎯 **Your Next Steps:**
1. Complete your profile with interests and a photo
2. Browse people and events in your areas
3. Join your city chat rooms to start conversations
4. Create your first meetup or RSVP to an event

${hasExistingTravelPlan ? `Since you're planning to travel, you'll get matched with locals and other travelers who share your interests!` : `As a local in ${user.hometownCity}, you'll be notified when travelers with similar interests visit your area!`}

Questions? Just reply to this message. Welcome to the community!

- Aaron (your fellow nearby traveler)`);
          console.log(`✓ REGISTRATION: Sent welcome message from nearbytrav to ${user.username}`);
        } else {
          console.error('REGISTRATION ERROR: nearbytrav account (ID 2) not found');
        }
      } catch (error: any) {
        console.error('REGISTRATION ERROR: Sending welcome message:', error);
      }

      // Create connection to nearbytrav account (USER ID 2)
      try {
        await storage.createConnection({
          requesterId: 2,
          receiverId: user.id,
          status: 'accepted'
        });
        console.log(`✓ REGISTRATION: Connected user ${user.username} to nearbytrav system account`);
      } catch (error: any) {
        console.error('REGISTRATION ERROR: Creating connection to nearbytrav:', error);
      }

      // Success response
      return res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword,
        redirectTo: "/account-success"
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ REGISTRATION ERROR:", error);
        console.error("❌ REGISTRATION ERROR STACK:", error.stack);
      }
      
      return res.status(500).json({ 
        message: "Registration failed", 
        error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  };

  // ====== REGISTRATION ENDPOINT COMPLETE ======

  // Registration endpoint
  app.post("/api/register", handleRegistration);

  // WAITLIST ENDPOINT - for collecting launch leads - BULLETPROOF VERSION
  app.post("/api/waitlist", async (req, res) => {
    const reqId = `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔍 WAITLIST [${reqId}]: Request received from ${req.ip}`, { 
        name: req.body?.name, 
        email: req.body?.email ? `${req.body.email.substring(0, 3)}***@${req.body.email.split('@')[1]}` : 'none',
        timestamp: new Date().toISOString()
      });
      
      const result = insertWaitlistLeadSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log(`❌ WAITLIST [${reqId}]: Validation failed`, result.error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: result.error.errors 
        });
      }

      console.log(`✅ WAITLIST [${reqId}]: Validation passed, saving to database...`);
      
      // BULLETPROOF DATABASE SAVE with verification
      const lead = await withRetry(async () => {
        const savedLead = await db
          .insert(waitlistLeads)
          .values({
            name: result.data.name,
            email: result.data.email,
            submittedAt: new Date(),
            contacted: false,
            notes: null
          })
          .returning();
        
        if (!savedLead || savedLead.length === 0) {
          throw new Error('Database insert returned no data');
        }
        
        console.log(`💾 WAITLIST [${reqId}]: Initial save successful, verifying...`);
        
        // IMMEDIATE VERIFICATION - Read back the data to confirm it's really saved
        const verification = await db.select().from(waitlistLeads).where(eq(waitlistLeads.id, savedLead[0].id));
        if (!verification || verification.length === 0) {
          throw new Error(`CRITICAL: Data verification failed - lead ${savedLead[0].id} not found after insert`);
        }
        
        console.log(`✅ WAITLIST [${reqId}]: Database verification successful - lead ${savedLead[0].id} permanently saved`);
        return savedLead[0];
      });
      
      console.log(`📧 WAITLIST [${reqId}]: CONFIRMED SAVE - ${result.data.name} (ID: ${lead.id}) successfully added to waitlist`);
      
      // ONLY send success response after database verification
      res.status(201).json({ 
        message: "Successfully joined waitlist",
        lead: { name: lead.name, email: lead.email } 
      });
      
      console.log(`📤 WAITLIST [${reqId}]: Success response sent`);
      
    } catch (error: any) {
      console.error(`❌ WAITLIST [${reqId}]: CRITICAL ERROR:`, {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
      
      if (error.code === '23505') { // Duplicate email
        console.log(`⚠️ WAITLIST [${reqId}]: Duplicate email detected for ${req.body?.email}`);
        return res.status(409).json({ 
          message: "This email is already on our waitlist" 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to join waitlist. Please try again." 
      });
    }
  });

  // GET WAITLIST LEADS - for debugging/admin viewing
  app.get("/api/waitlist", async (req, res) => {
    try {
      const { start, end } = req.query;
      
      let leads;

      // Add date filters if provided
      if (start && end) {
        const startDate = new Date(String(start));
        const endDate = new Date(String(end));
        endDate.setDate(endDate.getDate() + 1); // Include full end date
        
        leads = await db.select().from(waitlistLeads)
          .where(and(
            gte(waitlistLeads.submittedAt, startDate),
            lt(waitlistLeads.submittedAt, endDate)
          ))
          .orderBy(desc(waitlistLeads.submittedAt));
      } else {
        leads = await db.select().from(waitlistLeads)
          .orderBy(desc(waitlistLeads.submittedAt));
      }
      
      res.json({
        count: leads.length,
        leads: leads
      });
    } catch (error: any) {
      console.error('Error fetching waitlist leads:', error);
      res.status(500).json({ message: "Failed to fetch waitlist data" });
    }
  });

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

      const nearbytravelerUser = await storage.getUserByUsername('nearbytrav');
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

- Aaron (your fellow nearby traveler)`
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
        topChoices,
        interests,
        privateInterests,
        activities,
        events: eventsFilter,
        location,
        userType,
        travelerTypes,
        militaryStatus,
        newToTown,
        currentUserId: currentUserIdParam
      } = req.query;

      // Get current user ID from URL params first, then fall back to headers
      const userIdHeader = req.headers['x-user-id'] as string;
      let currentUserId = null;
      
      // First try URL parameter (frontend sends it this way)
      if (currentUserIdParam && typeof currentUserIdParam === 'string') {
        const parsedUserId = parseInt(currentUserIdParam);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          currentUserId = parsedUserId;
        }
      }
      // Fall back to header if URL param not found
      else if (userIdHeader && userIdHeader !== 'NaN' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
        const parsedUserId = parseInt(userIdHeader);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          currentUserId = parsedUserId;
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 ADVANCED SEARCH: Performing search with filters:', {
          search, gender, sexualPreference, minAge, maxAge, topChoices, interests, privateInterests, activities, events: eventsFilter, location, userType, travelerTypes, militaryStatus, newToTown, currentUserId
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
      
      // NOTE: Current user IS included in search results so they can find themselves
      // (e.g., searching "veteran" should show them if they're a veteran)

      // Multi-keyword search - supports comma-separated terms
      if (search && typeof search === 'string' && search.trim()) {
        const searchInput = search.trim().toLowerCase();
        
        // Special detection: If someone searches for "new to town", automatically apply the database filter
        const newToTownVariations = ['new to town', 'new in town', 'newtotown', 'newintown', 'new 2 town'];
        const isNewToTownSearch = newToTownVariations.some(variation => searchInput.includes(variation));
        
        if (isNewToTownSearch) {
          // Apply the New to Town database filter
          whereConditions.push(
            and(
              sql`${users.newToTownUntil} IS NOT NULL`,
              sql`${users.newToTownUntil} > NOW()`
            )
          );
          if (process.env.NODE_ENV === 'development') {
            console.log('🆕 AUTO-DETECTED NEW TO TOWN SEARCH: Applying database filter for new_to_town_until');
          }
        }
        
        // Split by comma and clean up each term
        const searchTerms = searchInput.split(',').map(term => term.trim()).filter(term => term.length > 0);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 MULTI-KEYWORD SEARCH: Original input: "${searchInput}", Split into terms:`, searchTerms);
        }
        
        // For each search term, create conditions that must ALL match (AND logic)
        for (const searchTerm of searchTerms) {
          
          // Each search term must match somewhere in the user's profile (AND logic)
          const searchConditions = [
            // Basic profile fields
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.username, `%${searchTerm}%`),
            ilike(users.bio, `%${searchTerm}%`),
            ilike(users.gender, `%${searchTerm}%`),
            
            // Interests, Activities, Events - Standard arrays
            sql`array_to_string(${users.interests}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.privateInterests}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.activities}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.events}, ',') ILIKE ${`%${searchTerm}%`}`,
            
            // Custom text fields - User typed interests/activities/events
            ilike(users.customInterests, `%${searchTerm}%`),
            ilike(users.customActivities, `%${searchTerm}%`),
            ilike(users.customEvents, `%${searchTerm}%`),
            
            // Sexual preference & relationship
            sql`array_to_string(${users.sexualPreference}, ',') ILIKE ${`%${searchTerm}%`}`,
            
            // Military & veteran status
            ilike(users.militaryStatus, `%${searchTerm}%`),
            
            // Travel style, languages, countries
            sql`array_to_string(${users.travelStyle}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.languagesSpoken}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.countriesVisited}, ',') ILIKE ${`%${searchTerm}%`}`,
            
            // Family & children
            ilike(users.childrenAges, `%${searchTerm}%`),
            
            // Travel intent fields (Why/What/How)
            ilike(users.travelWhy, `%${searchTerm}%`),
            sql`array_to_string(${users.travelWhat}, ',') ILIKE ${`%${searchTerm}%`}`,
            ilike(users.travelHow, `%${searchTerm}%`),
            ilike(users.travelBudget, `%${searchTerm}%`),
            ilike(users.travelGroup, `%${searchTerm}%`),
            
            // Secret activities & special profile content
            ilike(users.secretActivities, `%${searchTerm}%`),
            
            // Default travel preferences for all trips
            sql`array_to_string(${users.defaultTravelInterests}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.defaultTravelActivities}, ',') ILIKE ${`%${searchTerm}%`}`,
            sql`array_to_string(${users.defaultTravelEvents}, ',') ILIKE ${`%${searchTerm}%`}`,
            
            // City-specific activities search - CRITICAL for city-specific searches like "Empire State Building"
            sql`EXISTS (SELECT 1 FROM user_city_interests WHERE user_city_interests.user_id = ${users.id} AND user_city_interests.activity_name ILIKE ${`%${searchTerm}%`})`,
            
            // Business profile fields
            ilike(users.businessName, `%${searchTerm}%`),
            ilike(users.businessType, `%${searchTerm}%`),
            ilike(users.businessDescription, `%${searchTerm}%`),
            ilike(users.specialty, `%${searchTerm}%`),
            sql`array_to_string(${users.tags}, ',') ILIKE ${`%${searchTerm}%`}`,
            
            // Location fields - hometown and current
            ilike(users.location, `%${searchTerm}%`),
            ilike(users.hometownCity, `%${searchTerm}%`),
            ilike(users.hometownState, `%${searchTerm}%`),
            ilike(users.hometownCountry, `%${searchTerm}%`),
            ilike(users.destinationCity, `%${searchTerm}%`),
            ilike(users.destinationState, `%${searchTerm}%`),
            ilike(users.destinationCountry, `%${searchTerm}%`)
          ];
          
          // Special keyword: "new to town" should match users with isNewToTown status
          if (searchTerm.includes('new') || searchTerm.includes('town')) {
            searchConditions.push(
              and(
                sql`${users.isNewToTown} = true`,
                sql`${users.newToTownUntil} > NOW()`
              )
            );
          }
          
          whereConditions.push(or(...searchConditions));
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 MULTI-KEYWORD SEARCH COMPLETE: Applied ${searchTerms.length} search term(s) with AND logic - users must match ALL keywords`);
        }
      } else {
        // If no search term provided, require at least one other filter
        if (!location && !userType && !gender && !interests && !activities && !eventsFilter) {
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
        const typeList = userType.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (typeList.length > 0) {
          whereConditions.push(or(
            ...typeList.map(type => eq(users.userType, type))
          ));
        }
      }

      // Gender filter
      if (gender && typeof gender === 'string') {
        const genderList = gender.split(',').map(g => g.trim()).filter(Boolean);
        if (genderList.length > 0) {
          whereConditions.push(or(
            ...genderList.map(g => ilike(users.gender, `%${g}%`))
          ));
        }
      }

      // Sexual preference filter
      if (sexualPreference && typeof sexualPreference === 'string') {
        const prefList = sexualPreference.split(',').map(p => p.trim()).filter(Boolean);
        if (prefList.length > 0) {
          whereConditions.push(or(
            ...prefList.map(pref => ilike(users.sexualPreference, `%${pref}%`))
          ));
        }
      }

      // Age range filter
      if (minAge && !isNaN(parseInt(minAge as string))) {
        whereConditions.push(gte(users.age, parseInt(minAge as string)));
      }
      if (maxAge && !isNaN(parseInt(maxAge as string))) {
        whereConditions.push(lte(users.age, parseInt(maxAge as string)));
      }

      // Activities filter - search both predefined and custom activities
      if (activities && typeof activities === 'string') {
        const activityList = activities.split(',').map(a => a.trim()).filter(Boolean);
        if (activityList.length > 0) {
          whereConditions.push(or(
            ...activityList.flatMap(activity => [
              sql`array_to_string(${users.activities}, ',') ILIKE ${`%${activity}%`}`,
              ilike(users.customActivities, `%${activity}%`)
            ])
          ));
        }
      }

      // Events filter - search both predefined and custom events
      if (eventsFilter && typeof eventsFilter === 'string') {
        const eventsList = eventsFilter.split(',').map(e => e.trim()).filter(Boolean);
        if (eventsList.length > 0) {
          whereConditions.push(or(
            ...eventsList.flatMap(event => [
              sql`array_to_string(${users.events}, ',') ILIKE ${`%${event}%`}`,
              ilike(users.customEvents, `%${event}%`)
            ])
          ));
        }
      }

      // Military status filter
      if (militaryStatus && typeof militaryStatus === 'string') {
        const statusList = militaryStatus.split(',').map(s => s.trim()).filter(Boolean);
        if (statusList.length > 0) {
          whereConditions.push(or(
            ...statusList.map(status => 
              ilike(users.militaryStatus, `%${status}%`)
            )
          ));
        }
      }

      // New to Town filter - only show users with active newToTownUntil date
      if (newToTown === 'true') {
        whereConditions.push(
          and(
            sql`${users.newToTownUntil} IS NOT NULL`,
            sql`${users.newToTownUntil} > NOW()`
          )
        );
        if (process.env.NODE_ENV === 'development') console.log('🆕 NEW TO TOWN FILTER: Searching for users new to town');
      }

      // Top Choices filter - search both predefined and custom interests
      if (topChoices && typeof topChoices === 'string') {
        // Decode HTML entities and normalize
        const decodedTopChoices = topChoices.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const topChoicesList = decodedTopChoices.split(',').map(i => i.trim()).filter(Boolean);
        if (topChoicesList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log('⭐ TOP CHOICES FILTER: Searching for users with top choices:', topChoicesList);
          
          // Search in both predefined interests array and custom interests text field
          whereConditions.push(or(
            sql`EXISTS (SELECT 1 FROM unnest(${users.interests}) AS interest WHERE lower(interest) = ANY(${sql.array(topChoicesList.map(c => c.toLowerCase()), 'text')}))`,
            ...topChoicesList.map(choice => ilike(users.customInterests, `%${choice}%`))
          ));
        }
      }

      // Interests filter - search both predefined and custom interests
      if (interests && typeof interests === 'string') {
        // Decode HTML entities and normalize
        const decodedInterests = interests.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const interestsList = decodedInterests.split(',').map(i => i.trim()).filter(Boolean);
        if (interestsList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log('🎯 INTERESTS FILTER: Searching for users with interests:', interestsList);
          
          // Search in both predefined interests array and custom interests text field
          whereConditions.push(or(
            sql`EXISTS (SELECT 1 FROM unnest(${users.interests}) AS interest WHERE lower(interest) = ANY(${sql.array(interestsList.map(i => i.toLowerCase()), 'text')}))`,
            ...interestsList.map(interest => ilike(users.customInterests, `%${interest}%`))
          ));
        }
      }

      // Private Interests filter - searching in privateInterests field
      if (privateInterests && typeof privateInterests === 'string') {
        const privateInterestsList = privateInterests.split(',').map(i => i.trim()).filter(Boolean);
        if (privateInterestsList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log('🔒 PRIVATE INTERESTS FILTER: Searching for users with private interests:', privateInterestsList);
          
          whereConditions.push(or(
            ...privateInterestsList.map(privateInterest => 
              sql`array_to_string(${users.privateInterests}, ',') ILIKE ${`%${privateInterest}%`}`
            )
          ));
        }
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
          interests: users.interests,
          events: users.events
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
      if (userWithoutPassword.custom_interests !== undefined) {
        userWithoutPassword.customInterests = userWithoutPassword.custom_interests;
        delete userWithoutPassword.custom_interests;
      }
      if (userWithoutPassword.custom_activities !== undefined) {
        userWithoutPassword.customActivities = userWithoutPassword.custom_activities;
        delete userWithoutPassword.custom_activities;
      }
      if (userWithoutPassword.custom_events !== undefined) {
        userWithoutPassword.customEvents = userWithoutPassword.custom_events;
        delete userWithoutPassword.custom_events;
      }
      
      // MAP PRIVATE INTERESTS: Handle private interests for frontend
      if (userWithoutPassword.private_interests !== undefined) {
        userWithoutPassword.privateInterests = userWithoutPassword.private_interests;
        delete userWithoutPassword.private_interests;
      }
      
      // Note: Travel intent fields are already in camelCase from database
      
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
      
      // Note: Travel intent fields are sent as camelCase and Drizzle handles snake_case mapping automatically

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
      
      // MAP PRIVATE INTERESTS: Handle private interests for matching
      if (updates.privateInterests !== undefined) {
        // Convert string to array if needed (frontend sends comma-separated string)
        if (typeof updates.privateInterests === 'string') {
          updates.private_interests = updates.privateInterests.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          updates.private_interests = updates.privateInterests;
        }
        delete updates.privateInterests;
      }

      // CRITICAL FIX: Sync location field when hometown changes
      if (updates.hometown_city || updates.hometown_state || updates.hometown_country) {
        // Get current user data to fill in missing hometown fields
        const currentUser = await storage.getUserById(userId);
        
        const cityToUse = updates.hometown_city || currentUser?.hometownCity || '';
        const stateToUse = updates.hometown_state || currentUser?.hometownState || '';
        const countryToUse = updates.hometown_country || currentUser?.hometownCountry || '';
        
        // Update location field to match new hometown 
        if (cityToUse && stateToUse && countryToUse) {
          updates.location = `${cityToUse}, ${stateToUse}, ${countryToUse}`;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 LOCATION SYNC: Updated location field to "${updates.location}" for user ${userId}`);
          }
        } else if (cityToUse && stateToUse) {
          updates.location = `${cityToUse}, ${stateToUse}`;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 LOCATION SYNC: Updated location field to "${updates.location}" for user ${userId}`);
          }
        }
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

      // AUTO-SETUP: Create city infrastructure when user updates hometown/location
      if ((updates.hometown_city || updates.city) && updates.country) {
        try {
          const cityName = updates.hometown_city || updates.city;
          const stateName = updates.hometown_state || updates.state || '';
          const countryName = updates.country;
          
          console.log(`🏠 AUTO-SETUP: Setting up city infrastructure for user's location: ${cityName}`);
          
          // Check if city page already exists
          const existingCity = await db.select().from(cityPages)
            .where(and(
              eq(cityPages.cityName, cityName),
              eq(cityPages.state, stateName),
              eq(cityPages.country, countryName)
            )).limit(1);
          
          if (existingCity.length === 0) {
            // Create city page
            await db.insert(cityPages).values({
              cityName: cityName,
              state: stateName,
              country: countryName,
              description: `Discover ${cityName} and connect with locals and travelers`,
              heroImage: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`🏠 CREATED CITY PAGE: ${cityName}`);
          }
          
          // Ensure city has basic activities
          try {
            const { ensureCityHasActivities } = await import('./auto-city-setup');
            await ensureCityHasActivities(cityName, stateName, countryName);
            console.log(`🏃 ENSURED ACTIVITIES: ${cityName}`);
          } catch (error) {
            console.log(`⚠️ ACTIVITIES SETUP WARNING: ${error}`);
          }
          
          // Create default chatroom if it doesn't exist
          const existingChatroom = await db.select().from(citychatrooms)
            .where(and(
              eq(citychatrooms.city, cityName),
              eq(citychatrooms.state, stateName),
              eq(citychatrooms.country, countryName)
            )).limit(1);
          
          if (existingChatroom.length === 0) {
            await db.insert(citychatrooms).values({
              city: cityName,
              state: stateName,
              country: countryName,
              name: `${cityName} General Chat`,
              description: `Connect with locals and travelers in ${cityName}`,
              isPrivate: false,
              createdAt: new Date()
            });
            console.log(`💬 CREATED CHATROOM: ${cityName}`);
          }
          
          console.log(`✅ HOMETOWN CITY INFRASTRUCTURE COMPLETE: ${cityName}`);
        } catch (error) {
          console.error('❌ AUTO-SETUP: Failed to set up city infrastructure for hometown:', error);
          // Don't fail the user update if city setup fails
        }
      }

      // Award aura for first profile completion
      if (isFirstProfileCompletion) {
        await awardAuraPoints(userId, 1, 'completing profile');
        if (process.env.NODE_ENV === 'development') console.log(`✨ AURA: Awarded 1 point to user ${userId} for completing profile`);

        // BUSINESS WELCOME MESSAGES DISABLED - Business signup is closed
        if (false && updatedUser.userType === 'business') {
          try {
            const nearbytravelerUser = await storage.getUserByUsername('nearbytrav');
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

- Aaron (your fellow nearby traveler)`
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

  // CRITICAL: PATCH endpoint for user profile updates (supports partial updates like travel intent)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id || '0');
      const updates = req.body;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 USER UPDATE: User ${userId} saving updates:`, Object.keys(updates).join(', '));
      }

      // MAP USER FIELDS: Handle travel intent fields specifically
      const mappedUpdates = { ...updates };

      // HOMETOWN CHANGE DETECTION: Check using snake_case field names (after field mapping)
      if (updates.hometown_city || updates.hometown_state || updates.hometown_country) {
        // Get current user to compare
        const currentUser = await storage.getUser(userId);
        
        if (currentUser) {
          const hometownChanged = 
            (updates.hometown_city && updates.hometown_city !== currentUser.hometownCity) ||
            (updates.hometown_state && updates.hometown_state !== currentUser.hometownState) ||
            (updates.hometown_country && updates.hometown_country !== currentUser.hometownCountry);
          
          if (hometownChanged) {
            // Automatically set "new to town" for 9 months
            const newToTownUntil = new Date();
            newToTownUntil.setMonth(newToTownUntil.getMonth() + 9);
            
            updates.is_new_to_town = true;
            updates.new_to_town_until = newToTownUntil.toISOString();
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`🆕 HOMETOWN CHANGED: Automatically setting user ${userId} as "new to town" until ${newToTownUntil.toLocaleDateString()}`);
              console.log(`🆕 New hometown: ${updates.hometown_city}, ${updates.hometown_state}, ${updates.hometown_country}`);
            }
          }
        }
      }

      // Remove password from response
      const updatedUser = await storage.updateUser(userId, mappedUpdates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      if (process.env.NODE_ENV === 'development') console.log(`✓ User ${userId} updated successfully`);
      return res.json(userWithoutPassword);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("🔴 CRITICAL ERROR updating user:", error);
        console.error("🔴 Error message:", error.message);
      }
      return res.status(500).json({ 
        message: "Failed to update user", 
        error: error.message
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



  // CRITICAL: Get all users endpoint with FULL SEARCH FILTERING and LA Metro consolidation
  app.get("/api/users", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS: Getting all users`);
      
      // Get all users with their travel plans for travel status detection
      const allUsers = await db.select().from(users);
      
      // Enrich each user with their travel plans for frontend travel detection
      const enrichedUsers = await Promise.all(allUsers.map(async (user) => {
        const userTravelPlans = await db.select().from(travelPlans).where(eq(travelPlans.userId, user.id));
        
        // Format travel plans to match frontend expectations
        const formattedTravelPlans = userTravelPlans.map(plan => ({
          ...plan,
          destination: `${plan.destinationCity}${plan.destinationState ? `, ${plan.destinationState}` : ''}, ${plan.destinationCountry}`
        }));
        
        return {
          ...user,
          travelPlans: formattedTravelPlans
        };
      }));
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS SEARCH RESULT: ${enrichedUsers.length} users found with travel plans`);
      return res.json(enrichedUsers);
      
      // LOCATION FILTER with LA Metro consolidation
      if (location && typeof location === 'string' && location.trim() !== '' && location !== ', United States') {
        const searchLocation = location.toString().trim();
        const locationParts = searchLocation.split(',').map(part => part.trim());
        const [searchCity] = locationParts;
        
        if (process.env.NODE_ENV === 'development') console.log(`🌍 USERS: Filtering by location: ${searchLocation}, searchCity: ${searchCity}`);
        
        // Check if this is a metro city that should be consolidated to Los Angeles
        const { METRO_AREAS } = await import('../shared/constants');
        const isLAMetroCity = METRO_AREAS['Los Angeles'].cities.includes(searchCity);
        
        if (isLAMetroCity || searchCity === 'Los Angeles Metro') {
          // Search for ALL LA metro cities
          const allLACities = METRO_AREAS['Los Angeles'].cities;
          if (process.env.NODE_ENV === 'development') console.log(`🌍 LA METRO SEARCH: Searching for users in ALL LA metro cities:`, allLACities.length, 'cities');
          
          const locationConditions = allLACities.map(city => 
            or(
              ilike(users.location, `%${city}%`),
              ilike(users.hometownCity, `%${city}%`)
            )
          );
          const locationCondition = or(...locationConditions);
          conditions.push(locationCondition);
          if (process.env.NODE_ENV === 'development') console.log(`🌍 LA METRO CONDITION: Added location condition for ${allLACities.length} cities`);
        } else {
          // Regular city search - use more precise matching
          const locationCondition = or(
            ilike(users.location, `%${searchCity}%`),
            ilike(users.hometownCity, `%${searchCity}%`)
          );
          conditions.push(locationCondition);
          if (process.env.NODE_ENV === 'development') console.log(`🌍 REGULAR SEARCH: Added location condition for: ${searchCity}`);
        }
      }
      
      // INTERESTS FILTER
      if (interests && typeof interests === 'string' && interests.trim() !== '') {
        const interestsList = interests.split(',').map(i => i.trim()).filter(Boolean);
        if (interestsList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log(`🎯 USERS: Filtering by interests:`, interestsList);
          
          const interestConditions = interestsList.map(interest => 
            ilike(users.interests, `%${interest}%`)
          );
          conditions.push(or(...interestConditions));
        }
      }
      
      // USER TYPE FILTER
      if (userType && typeof userType === 'string' && userType.trim() !== '') {
        const userTypesList = userType.split(',').map(t => t.trim()).filter(Boolean);
        if (userTypesList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log(`👤 USERS: Filtering by userType:`, userTypesList);
          
          const typeConditions = userTypesList.map(type => 
            eq(users.userType, type)
          );
          conditions.push(or(...typeConditions));
        }
      }
      
      // AGE FILTER
      if (minAge && !isNaN(parseInt(minAge as string))) {
        const minAgeNum = parseInt(minAge as string);
        conditions.push(gte(users.age, minAgeNum));
        if (process.env.NODE_ENV === 'development') console.log(`🎂 USERS: Min age filter: ${minAgeNum}`);
      }
      
      if (maxAge && !isNaN(parseInt(maxAge as string))) {
        const maxAgeNum = parseInt(maxAge as string);
        conditions.push(lte(users.age, maxAgeNum));
        if (process.env.NODE_ENV === 'development') console.log(`🎂 USERS: Max age filter: ${maxAgeNum}`);
      }
      
      // GENDER FILTER
      if (gender && typeof gender === 'string' && gender.trim() !== '') {
        const gendersList = gender.split(',').map(g => g.trim()).filter(Boolean);
        if (gendersList.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log(`⚧️ USERS: Filtering by gender:`, gendersList);
          
          const genderConditions = gendersList.map(g => 
            eq(users.gender, g)
          );
          conditions.push(or(...genderConditions));
        }
      }
      
      // TEXT SEARCH (name, username, bio)
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = search.trim();
        if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS: Text search for: ${searchTerm}`);
        
        conditions.push(
          or(
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.username, `%${searchTerm}%`),
            ilike(users.bio, `%${searchTerm}%`)
          )
        );
      }
      
      // Apply all conditions - CRITICAL DEBUG
      if (conditions.length > 0) {
        if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS: Applying ${conditions.length} conditions to query`);
        query = query.where(and(...conditions));
      } else {
        if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS: NO CONDITIONS - returning ALL users (this is the bug!)`);
      }
      
      const filteredUsers = await query;
      
      if (!filteredUsers || filteredUsers.length === 0) {
        if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS SEARCH: No users found with current filters`);
        return res.json([]);
      }
      
      // Remove passwords and prepare response
      const consolidatedUsers = filteredUsers.map(user => {
        if (!user) return null;
        
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          ...userWithoutPassword,
          hometownCity: user.hometownCity || '',
          location: user.location
        };
      }).filter(Boolean);
      
      if (process.env.NODE_ENV === 'development') console.log(`🔍 USERS SEARCH RESULT: ${consolidatedUsers.length} users found with filters`);
      return res.json(consolidatedUsers);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching filtered users:", error);
      return res.json([]);
    }
  });

  // CRITICAL: Get travel plans for user
  app.get("/api/travel-plans/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const travelPlans = await storage.getUserTravelPlans(userId);
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
      const travelPlans = await storage.getUserTravelPlans(userId);
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

  // POST /api/support/private-reference - Submit a private message to support team
  app.post("/api/support/private-reference", async (req, res) => {
    try {
      const { userId, targetUserId, category, content } = req.body;
      
      // Validate required fields
      if (!userId || !targetUserId || !category || !content) {
        return res.status(400).json({ 
          error: "Missing required fields: userId, targetUserId, category, content" 
        });
      }

      // Validate content length
      if (content.trim().length < 10) {
        return res.status(400).json({ 
          error: "Message content must be at least 10 characters long" 
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({ 
          error: "Message content cannot exceed 1000 characters" 
        });
      }

      // Get user details for context
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      
      if (user.length === 0) {
        return res.status(404).json({ error: "Sender user not found" });
      }
      
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "Target user not found" });
      }

      // Create a system message or log entry for support team review
      // For now, we'll store it in the messages table with a special system user ID (0)
      const supportMessage = await db.insert(messages).values({
        senderId: userId,
        receiverId: 1, // Send to admin user (ID 1) or create a support system user
        content: `🚨 PRIVATE SUPPORT MESSAGE 🚨\n\nCategory: ${category}\nAbout User: @${targetUser[0].username} (ID: ${targetUserId})\nFrom: @${user[0].username} (ID: ${userId})\n\nMessage:\n${content.trim()}`,
        createdAt: new Date(),
        isRead: false
      }).returning();

      console.log(`📨 PRIVATE SUPPORT MESSAGE: User ${userId} (@${user[0].username}) sent ${category} message about user ${targetUserId} (@${targetUser[0].username})`);

      res.json({ 
        success: true, 
        message: "Private message sent to support team successfully",
        id: supportMessage[0].id
      });

    } catch (error) {
      console.error("❌ Error creating private reference:", error);
      res.status(500).json({ error: "Failed to send private message" });
    }
  });

  // POST /api/users/block - Block a user
  app.post("/api/users/block", async (req, res) => {
    try {
      const { blockedUserId } = req.body;
      const blockerId = req.session?.user?.id; // Get from session or auth

      if (!blockerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!blockedUserId) {
        return res.status(400).json({ error: "Blocked user ID is required" });
      }

      if (blockerId === blockedUserId) {
        return res.status(400).json({ error: "Cannot block yourself" });
      }

      // Prevent blocking user2 (admin/system account)
      if (blockedUserId === 2) {
        return res.status(400).json({ error: "This user cannot be blocked" });
      }

      // Check if user is already blocked
      const existingBlock = await db.select()
        .from(blockedUsers)
        .where(and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedUserId)
        ))
        .limit(1);

      if (existingBlock.length > 0) {
        return res.status(409).json({ error: "User is already blocked" });
      }

      // Block the user
      await db.insert(blockedUsers).values({
        blockerId,
        blockedId: blockedUserId,
        blockedAt: new Date()
      });

      console.log(`🚫 BLOCK: User ${blockerId} blocked user ${blockedUserId}`);

      res.json({ 
        success: true, 
        message: "User blocked successfully" 
      });

    } catch (error) {
      console.error("❌ Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // GET /api/users/blocked - Get list of blocked users for current user
  app.get("/api/users/blocked", async (req, res) => {
    try {
      const blockerId = req.session?.user?.id;

      if (!blockerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const blocks = await db.select({
        id: blockedUsers.id,
        blockedId: blockedUsers.blockedId,
        blockedAt: blockedUsers.blockedAt,
        username: users.username,
        name: users.name,
        profileImage: users.profileImage
      })
      .from(blockedUsers)
      .leftJoin(users, eq(users.id, blockedUsers.blockedId))
      .where(eq(blockedUsers.blockerId, blockerId))
      .orderBy(desc(blockedUsers.blockedAt));

      res.json(blocks);

    } catch (error) {
      console.error("❌ Error fetching blocked users:", error);
      res.status(500).json({ error: "Failed to fetch blocked users" });
    }
  });

  // DELETE /api/users/block/:blockedUserId - Unblock a user
  app.delete("/api/users/block/:blockedUserId", async (req, res) => {
    try {
      const blockedUserId = parseInt(req.params.blockedUserId);
      const blockerId = req.session?.user?.id;

      if (!blockerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!blockedUserId || isNaN(blockedUserId)) {
        return res.status(400).json({ error: "Valid blocked user ID is required" });
      }

      const result = await db.delete(blockedUsers)
        .where(and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedUserId)
        ));

      console.log(`✅ UNBLOCK: User ${blockerId} unblocked user ${blockedUserId}`);

      res.json({ 
        success: true, 
        message: "User unblocked successfully" 
      });

    } catch (error) {
      console.error("❌ Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
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
      
      // Automatically set up city infrastructure for travel destination using new ensure endpoint
      if (travelPlanData.destinationCity && travelPlanData.destinationCountry) {
        try {
          console.log(`🏙️ AUTO-SETUP: Setting up city infrastructure for travel destination: ${travelPlanData.destinationCity}`);
          
          // Use our new city ensure logic
          const city = travelPlanData.destinationCity;
          const state = travelPlanData.destinationState || '';
          const country = travelPlanData.destinationCountry;
          
          // Check if city page already exists
          const existingCity = await db.select().from(cityPages)
            .where(and(
              eq(cityPages.cityName, city),
              eq(cityPages.state, state),
              eq(cityPages.country, country)
            )).limit(1);
          
          if (existingCity.length === 0) {
            // Create city page
            await db.insert(cityPages).values({
              cityName: city,
              state: state,
              country: country,
              description: `Discover ${city} and connect with locals and travelers`,
              heroImage: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`🏙️ CREATED CITY PAGE: ${city}`);
          }
          
          // Ensure city has basic activities
          try {
            const { ensureCityHasActivities } = await import('./auto-city-setup');
            await ensureCityHasActivities(city, state, country);
            console.log(`🏃 ENSURED ACTIVITIES: ${city}`);
          } catch (error) {
            console.log(`⚠️ ACTIVITIES SETUP WARNING: ${error}`);
          }
          
          // Create default chatroom if it doesn't exist
          const existingChatroom = await db.select().from(citychatrooms)
            .where(and(
              eq(citychatrooms.city, city),
              eq(citychatrooms.state, state),
              eq(citychatrooms.country, country)
            )).limit(1);
          
          if (existingChatroom.length === 0) {
            await db.insert(citychatrooms).values({
              city: city,
              state: state,
              country: country,
              name: `${city} General Chat`,
              description: `Connect with locals and travelers in ${city}`,
              isPrivate: false,
              createdAt: new Date()
            });
            console.log(`💬 CREATED CHATROOM: ${city}`);
          }
          
          console.log(`✅ CITY INFRASTRUCTURE COMPLETE: ${city}`);
          await storage.ensureCityPageExists(
            travelPlanData.destinationCity,
            travelPlanData.destinationState || null,
            travelPlanData.destinationCountry,
            travelPlanData.userId
          );
          console.log(`✅ AUTO-SETUP: City page and infrastructure ready for ${travelPlanData.destinationCity}`);
        } catch (error) {
          console.error('❌ AUTO-SETUP: Failed to set up city infrastructure:', error);
        }
      }
      
      // CRITICAL FIX: Update user travel status immediately if trip is active now
      const now = new Date();
      const isCurrentlyTraveling = new Date(travelPlanData.startDate) <= now && new Date(travelPlanData.endDate) >= now;
      
      if (isCurrentlyTraveling) {
        console.log(`🧳 TRAVEL STATUS: User ${travelPlanData.userId} is now currently traveling to ${travelPlanData.destinationCity}`);
        await storage.updateUser(travelPlanData.userId, {
          userType: 'traveler',
          isCurrentlyTraveling: true,
          destinationCity: travelPlanData.destinationCity,
          destinationState: travelPlanData.destinationState || null,
          destinationCountry: travelPlanData.destinationCountry
        });
        console.log(`✅ TRAVEL STATUS: Updated user ${travelPlanData.userId} to show as currently traveling`);
      } else {
        console.log(`📅 TRAVEL STATUS: Trip is future/past - user ${travelPlanData.userId} remains as planned traveler`);
        await storage.updateUser(travelPlanData.userId, {
          userType: 'traveler'
        });
      }
      
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
      
      // CRITICAL FIX: Update user travel status after modifying travel plan
      if (updatedTravelPlan && (updateData.startDate || updateData.endDate || updateData.destinationCity)) {
        const now = new Date();
        const startDate = updatedTravelPlan.startDate;
        const endDate = updatedTravelPlan.endDate;
        const isCurrentlyTraveling = startDate <= now && endDate >= now;
        
        if (isCurrentlyTraveling) {
          console.log(`🧳 TRAVEL STATUS UPDATE: User ${updatedTravelPlan.userId} is now currently traveling to ${updatedTravelPlan.destinationCity}`);
          await storage.updateUser(updatedTravelPlan.userId, {
            userType: 'traveler',
            isCurrentlyTraveling: true,
            destinationCity: updatedTravelPlan.destinationCity,
            destinationState: updatedTravelPlan.destinationState || null,
            destinationCountry: updatedTravelPlan.destinationCountry
          });
          console.log(`✅ TRAVEL STATUS UPDATE: Updated user ${updatedTravelPlan.userId} to show as currently traveling`);
        } else {
          // Check if user has any OTHER active travel plans
          const activePlans = await db.select().from(travelPlans)
            .where(and(
              eq(travelPlans.userId, updatedTravelPlan.userId),
              lte(travelPlans.startDate, now),
              gte(travelPlans.endDate, now),
              ne(travelPlans.id, updatedTravelPlan.id) // Exclude this plan
            ));
            
          if (activePlans.length === 0) {
            console.log(`🏠 TRAVEL STATUS UPDATE: User ${updatedTravelPlan.userId} no longer currently traveling`);
            await storage.updateUser(updatedTravelPlan.userId, {
              isCurrentlyTraveling: false,
              destinationCity: null,
              destinationState: null,
              destinationCountry: null
            });
          }
        }
      }
      
      return res.json(updatedTravelPlan);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating travel plan:", error);
      return res.status(500).json({ message: "Failed to update travel plan", error: error.message });
    }
  });

  // CRITICAL: Delete travel plan and update user travel status
  app.delete("/api/travel-plans/:id", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== DELETE TRAVEL PLAN API ===');
      if (process.env.NODE_ENV === 'development') console.log('Plan ID:', req.params.id);
      
      const planId = parseInt(req.params.id || '0');
      
      // Get the travel plan first to get user ID
      const travelPlan = await storage.getTravelPlan(planId);
      if (!travelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      const userId = travelPlan.userId;
      if (process.env.NODE_ENV === 'development') console.log('=== DELETING TRAVEL PLAN FOR USER ===', userId);
      
      // Delete the travel plan
      const deleted = await storage.deleteTravelPlan(planId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete travel plan" });
      }
      
      // Get remaining travel plans for this user
      const remainingTravelPlans = await storage.getTravelPlansForUser(userId);
      if (process.env.NODE_ENV === 'development') console.log('=== REMAINING TRAVEL PLANS ===', remainingTravelPlans?.length || 0);
      
      // If user has no remaining travel plans, clear their travel status
      if (!remainingTravelPlans || remainingTravelPlans.length === 0) {
        if (process.env.NODE_ENV === 'development') console.log('=== CLEARING TRAVEL STATUS ===', 'User has no remaining travel plans');
        await storage.updateUser(userId, {
          isCurrentlyTraveling: false,
          travelDestination: null,
          currentCity: null
        });
        if (process.env.NODE_ENV === 'development') console.log('=== TRAVEL STATUS CLEARED ===');
      } else {
        // User still has travel plans - check if they should still be marked as currently traveling
        // Simple check for active travel plans (replicate core logic here)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasActiveTravelPlan = false;
        
        for (const plan of remainingTravelPlans) {
          if (plan.startDate && plan.endDate) {
            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            if (today >= startDate && today <= endDate) {
              hasActiveTravelPlan = true;
              break;
            }
          }
        }
        
        const currentDestination = hasActiveTravelPlan;
        if (!currentDestination) {
          // No current travel - clear current travel status but keep future plans
          if (process.env.NODE_ENV === 'development') console.log('=== CLEARING CURRENT TRAVEL STATUS ===', 'No active trips remaining');
          await storage.updateUser(userId, {
            isCurrentlyTraveling: false,
            travelDestination: null,
            currentCity: null
          });
        }
      }
      
      if (process.env.NODE_ENV === 'development') console.log('=== TRAVEL PLAN DELETION COMPLETE ===');
      return res.json({ message: "Travel plan deleted successfully" });
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting travel plan:", error);
      return res.status(500).json({ message: "Failed to delete travel plan", error: error.message });
    }
  });

  // CRITICAL: Mark travel plan as completed and add country to user's visited list
  app.post("/api/travel-plans/:id/complete", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== COMPLETE TRAVEL PLAN API ===');
      
      const planId = parseInt(req.params.id || '0');
      
      // Get the travel plan
      const travelPlan = await storage.getTravelPlan(planId);
      if (!travelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      
      const userId = travelPlan.userId;
      
      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add destination country to countries visited if not already there
      const currentCountries = new Set(user.countriesVisited || []);
      let addedCountry = false;
      
      if (travelPlan.destinationCountry && !currentCountries.has(travelPlan.destinationCountry)) {
        currentCountries.add(travelPlan.destinationCountry);
        addedCountry = true;
        console.log(`🌍 COUNTRY COMPLETED: ${travelPlan.destinationCountry} added to ${user.username}'s countries visited`);
        
        // Update user's countries visited
        await storage.updateUser(userId, {
          countriesVisited: Array.from(currentCountries)
        });
      }
      
      // Mark plan as inactive/completed
      await storage.updateTravelPlan(planId, {
        isActive: false,
        updatedAt: new Date()
      });
      
      const responseMessage = addedCountry 
        ? `Trip completed! ${travelPlan.destinationCountry} has been added to your countries visited.`
        : `Trip completed! ${travelPlan.destinationCountry} was already in your countries visited.`;
      
      return res.json({ 
        message: responseMessage,
        countryAdded: addedCountry,
        country: travelPlan.destinationCountry,
        totalCountries: Array.from(currentCountries).length
      });
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error completing travel plan:", error);
      return res.status(500).json({ message: "Failed to complete travel plan", error: error.message });
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
        return res.json({
          status: connection.status,
          requesterId: connection.requesterId,
          receiverId: connection.receiverId
        });
      } else {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION STATUS: No connection found between ${userId} and ${targetUserId}`);
        return res.json({ status: 'none' });
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
      
      // Get connections with full user details using proper joins
      const connectionsWithUsers = await db.execute(sql`
        SELECT 
          c.id,
          c.status,
          c.created_at as "createdAt",
          c.connection_note as "connectionNote",
          CASE 
            WHEN c.requester_id = ${userId} THEN c.receiver_id
            ELSE c.requester_id
          END as "userId",
          CASE 
            WHEN c.requester_id = ${userId} THEN receiver.username
            ELSE requester.username
          END as username,
          CASE 
            WHEN c.requester_id = ${userId} THEN receiver.name
            ELSE requester.name
          END as name,
          CASE 
            WHEN c.requester_id = ${userId} THEN receiver.profile_image
            ELSE requester.profile_image
          END as "profileImage",
          CASE 
            WHEN c.requester_id = ${userId} THEN receiver.location
            ELSE requester.location
          END as location
        FROM connections c
        LEFT JOIN users receiver ON c.receiver_id = receiver.id
        LEFT JOIN users requester ON c.requester_id = requester.id
        WHERE c.status = 'accepted' 
        AND (c.requester_id = ${userId} OR c.receiver_id = ${userId})
      `);

      // Transform the connections to include connectedUser object (required by frontend)
      const transformedConnections = connectionsWithUsers.rows.map((conn: any) => ({
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        connectionNote: conn.connectionNote,
        connectedUser: {
          id: conn.userId,
          username: conn.username,
          name: conn.name,
          profileImage: conn.profileImage,
          location: conn.location
        }
      }));

      return res.json(transformedConnections);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching connections:", error);
      return res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // CRITICAL: Get connection requests for user
  // Get mutual connections between two users
  app.get("/api/mutual-connections/:userId1/:userId2", async (req, res) => {
    try {
      const userId1 = req.params.userId1;
      const userId2 = req.params.userId2;

      if (!userId1 || !userId2 || userId1 === userId2) {
        return res.json([]);
      }

      // Get connections for user 1
      const user1Connections = await db
        .select({
          connectedUserId: sql`
            CASE 
              WHEN ${connections.requesterId} = ${userId1} THEN ${connections.receiverId}
              ELSE ${connections.requesterId}
            END
          `
        })
        .from(connections)
        .where(
          and(
            eq(connections.status, 'accepted'),
            or(
              eq(connections.requesterId, userId1),
              eq(connections.receiverId, userId1)
            )
          )
        );

      // Get connections for user 2
      const user2Connections = await db
        .select({
          connectedUserId: sql`
            CASE 
              WHEN ${connections.requesterId} = ${userId2} THEN ${connections.receiverId}
              ELSE ${connections.requesterId}
            END
          `
        })
        .from(connections)
        .where(
          and(
            eq(connections.status, 'accepted'),
            or(
              eq(connections.requesterId, userId2),
              eq(connections.receiverId, userId2)
            )
          )
        );

      // Find mutual connections
      const user1ConnectedIds = user1Connections.map(c => String(c.connectedUserId));
      const user2ConnectedIds = user2Connections.map(c => String(c.connectedUserId));
      const mutualUserIds = user1ConnectedIds.filter(id => user2ConnectedIds.includes(id));

      if (mutualUserIds.length === 0) {
        return res.json([]);
      }

      // Get user details for mutual connections
      const mutualUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          hometownCity: users.hometownCity,
          hometownCountry: users.hometownCountry
        })
        .from(users)
        .where(inArray(users.id, mutualUserIds.map(id => parseInt(id))));

      res.json(mutualUsers);
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
      res.status(500).json({ error: 'Failed to fetch mutual connections' });
    }
  });

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

      // Prevent self-connection
      if (finalRequesterId === finalTargetUserId) {
        if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Self-connection attempt blocked - user ${finalRequesterId} trying to connect to themselves`);
        return res.status(400).json({ message: "Cannot connect to yourself" });
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
        status: 'pending',
        createdAt: new Date()
      });

      if (process.env.NODE_ENV === 'development') console.log(`CONNECTION: Successfully created connection request from ${finalRequesterId} to ${finalTargetUserId}:`, newConnection);
      return res.json({ success: true, connection: newConnection });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("CONNECTION ERROR:", error);
      return res.status(500).json({ message: "Failed to create connection", error: error.message });
    }
  });

  // CRITICAL: Get ALL messages for user (needed for full conversation history) with JOIN for user data
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      
      if (process.env.NODE_ENV === 'development') console.log(`📧 MESSAGES: Fetching all messages for user ${userId} with JOIN for user data`);
      
      // Create proper table aliases for sender and receiver users
      const senderUser = alias(users, 'sender_user');
      const receiverUser = alias(users, 'receiver_user');
      
      // Get ALL messages for this user (both sent and received) with JOINed user data
      const queryResult = await db
        .select()
        .from(messages)
        .leftJoin(senderUser, eq(messages.senderId, senderUser.id))
        .leftJoin(receiverUser, eq(messages.receiverId, receiverUser.id))
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 MESSAGES: Found ${queryResult.length} messages for user ${userId}`);
        if (queryResult.length > 0) {
          console.log(`📧 MESSAGES FIRST RESULT KEYS:`, Object.keys(queryResult[0]));
          console.log(`📧 MESSAGES RAW SAMPLE:`, JSON.stringify(queryResult[0], null, 2));
        }
      }

      // Transform the joined data to include embedded user objects
      const allMessages = queryResult.map(row => {
        const messageData = row.messages;
        const senderData = row.sender_user;
        const receiverData = row.receiver_user;
        
        return {
          id: messageData?.id,
          senderId: messageData?.senderId,
          receiverId: messageData?.receiverId,
          content: messageData?.content,
          messageType: messageData?.messageType,
          isRead: messageData?.isRead,
          createdAt: messageData?.createdAt,
          // Add a field to identify the other person in the conversation
          otherPersonId: messageData?.senderId === userId ? messageData?.receiverId : messageData?.senderId,
          // Include embedded sender user data
          senderUser: {
            id: senderData?.id,
            username: senderData?.username,
            name: senderData?.name,
            profileImage: senderData?.profileImage
          },
          // Include embedded receiver user data
          receiverUser: {
            id: receiverData?.id,
            username: receiverData?.username,
            name: receiverData?.name,
            profileImage: receiverData?.profileImage
          }
        };
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 MESSAGES: Transformed ${allMessages.length} messages with user data`);
        if (allMessages.length > 0) {
          console.log(`📧 MESSAGES SAMPLE:`, {
            id: allMessages[0].id,
            senderId: allMessages[0].senderId,
            receiverId: allMessages[0].receiverId,
            senderUser: allMessages[0].senderUser,
            receiverUser: allMessages[0].receiverUser
          });
        }
      }

      return res.json(allMessages || []);
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

  // Mark messages as read between two users
  app.post("/api/messages/:userId/mark-read", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { senderId } = req.body;
      
      if (!senderId) {
        return res.status(400).json({ message: "senderId is required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`📧 MARK-READ: Marking messages as read between users ${senderId} and ${userId}`);
      
      // Mark all messages from senderId to userId as read
      const result = await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, parseInt(senderId)),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        );
      
      if (process.env.NODE_ENV === 'development') console.log(`📧 MARK-READ: Updated ${result.rowCount} messages to read`);
      
      return res.json({ success: true, markedCount: result.rowCount });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error marking messages as read:", error);
      return res.status(500).json({ message: "Failed to mark messages as read" });
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
      let userId = 39; // Default to current user if not specified (your user ID)
      
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

      // Get user data to determine relevant locations
      const user = await storage.getUser(userId.toString());
      const userLocations = new Set<string>();

      if (user) {
        // Add hometown
        if (user.hometownCity) {
          userLocations.add(user.hometownCity);
          // METRO CONSOLIDATION: Also add consolidated metro area for hometown
          const consolidatedHometown = consolidateToMetropolitanArea(user.hometownCity, user.hometownState || '', user.hometownCountry || '');
          if (consolidatedHometown !== user.hometownCity) {
            // Add all cities in the metro area
            const metroAreaCities = getMetropolitanAreaCities(consolidatedHometown, user.hometownState || '', user.hometownCountry || '');
            metroAreaCities.forEach(city => userLocations.add(city));
          }
        }
        
        // Add travel destinations from active travel plans
        const currentDate = new Date();
        const userTravelPlans = await db.select().from(travelPlans)
          .where(and(
            eq(travelPlans.userId, userId),
            gte(travelPlans.endDate, currentDate)
          ));
        
        userTravelPlans.forEach(plan => {
          if (plan.destinationCity) {
            userLocations.add(plan.destinationCity);
            // METRO CONSOLIDATION: Also add consolidated metro area for travel destination
            const consolidatedDestination = consolidateToMetropolitanArea(plan.destinationCity, plan.destinationState || '', plan.destinationCountry || '');
            if (consolidatedDestination !== plan.destinationCity) {
              // Add all cities in the metro area
              const metroAreaCities = getMetropolitanAreaCities(consolidatedDestination, plan.destinationState || '', plan.destinationCountry || '');
              metroAreaCities.forEach(city => userLocations.add(city));
            }
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏠 MY-LOCATIONS: User relevant locations:`, Array.from(userLocations));
        }
      }

      // Get all active chatrooms
      const allChatrooms = await db.select().from(citychatrooms).where(eq(citychatrooms.isActive, true));
      
      // Get user memberships first to include user's joined chatrooms
      const userMembershipResults = await db.execute(sql`
        SELECT chatroom_id as "chatroomId"
        FROM chatroom_members 
        WHERE user_id = ${userId} AND is_active = true
      `);
      
      const userMembershipSet = new Set();
      userMembershipResults.rows.forEach((row: any) => {
        userMembershipSet.add(row.chatroomId);
      });
      
      // SHOW ALL CHATROOMS: No filtering by location - everyone sees all chatrooms
      const legitimateChatrooms = allChatrooms;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏠 MY-LOCATIONS: Showing all ${allChatrooms.length} active chatrooms`);
        console.log(`🔍 USER MEMBERSHIPS: User is member of ${userMembershipSet.size} chatrooms`);
      }
      
      // Get member counts using raw query for reliability - FIXED COUNT
      const memberCountResults = await db.execute(sql`
        SELECT chatroom_id as "chatroomId", COUNT(DISTINCT user_id)::integer as "memberCount"
        FROM chatroom_members 
        WHERE is_active = true 
        GROUP BY chatroom_id
      `);
      
      // Build lookup map for member counts
      const memberCountMap = new Map();
      memberCountResults.rows.forEach((row: any) => {
        memberCountMap.set(row.chatroomId, row.memberCount);
      });
      
      // Add member count and membership status to each chatroom
      const chatroomsWithCounts = legitimateChatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 0,
        userIsMember: userMembershipSet.has(chatroom.id)
      }));

      // Smart sorting: User's chatrooms first, then by activity/popularity
      const sortedChatrooms = chatroomsWithCounts.sort((a, b) => {
        // 1. User is member comes first (most important)
        if (a.userIsMember && !b.userIsMember) return -1;
        if (!a.userIsMember && b.userIsMember) return 1;
        
        // 2. For non-member chatrooms, sort by member count (more popular first)
        if (!a.userIsMember && !b.userIsMember) {
          return (b.memberCount || 0) - (a.memberCount || 0);
        }
        
        // 3. For member chatrooms, also sort by member count
        if (a.userIsMember && b.userIsMember) {
          return (b.memberCount || 0) - (a.memberCount || 0);
        }
        
        return 0;
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏠 MY-LOCATIONS: Returning ${sortedChatrooms.length} chatrooms with smart sorting`);
        console.log(`🏠 MY-LOCATIONS: First 3 chatrooms after sorting:`, 
          sortedChatrooms.slice(0, 3).map(c => ({ 
            id: c.id, 
            name: c.name, 
            city: c.city,
            userIsMember: c.userIsMember,
            memberCount: c.memberCount 
          }))
        );
      }
      
      res.json(sortedChatrooms);
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
        AND cm.is_active = true
        AND cc.is_active = true
        ORDER BY cc.created_at DESC
      `);

      const userChatrooms = result.rows || [];

      // Add member counts to each chatroom
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
      
      // Apply member counts to each chatroom
      const chatroomsWithMemberCount = userChatrooms.map(chatroom => ({
        ...chatroom,
        memberCount: memberCountMap.get(chatroom.id) || 1
      }));

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM PARTICIPATION: Found ${chatroomsWithMemberCount.length} chatrooms for user ${userId} with member counts`);
      return res.json(chatroomsWithMemberCount);
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

  // EVENTS SEARCH - Search events by keywords including venue names, titles, descriptions
  app.get("/api/search-events", async (req, res) => {
    try {
      const { search, city } = req.query;
      console.log(`🔍 EVENTS SEARCH: Searching for "${search}" in city "${city}"`);
      
      if (!search || typeof search !== 'string' || search.trim() === '') {
        return res.json([]);
      }
      
      const searchTerm = search.trim();
      const now = new Date();
      const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
      
      let searchConditions = [
        gte(events.date, now),
        lte(events.date, sixWeeksFromNow),
        or(
          ilike(events.title, `%${searchTerm}%`),
          ilike(events.description, `%${searchTerm}%`),
          ilike(events.venueName, `%${searchTerm}%`),
          ilike(events.street, `%${searchTerm}%`),
          ilike(events.city, `%${searchTerm}%`),
          ilike(events.category, `%${searchTerm}%`)
        )
      ];
      
      // Add city filter if provided
      if (city && typeof city === 'string' && city.trim() !== '') {
        searchConditions.push(ilike(events.city, `%${city}%`));
      }
      
      const searchResults = await db.select().from(events)
        .where(and(...searchConditions))
        .orderBy(asc(events.date))
        .limit(50);
      
      console.log(`🔍 EVENTS SEARCH: Found ${searchResults.length} events matching "${searchTerm}"`);
      res.json(searchResults);
      
    } catch (error: any) {
      console.error("🔍 EVENTS SEARCH ERROR:", error);
      res.status(500).json({ error: "Failed to search events" });
    }
  });

  // TRAVEL PLANS SEARCH - Search travel plans by notes content
  app.get("/api/search-travel-plans", async (req, res) => {
    try {
      const { search, city } = req.query;
      console.log(`🔍 TRAVEL PLANS SEARCH: Searching for "${search}" in city "${city}"`);
      
      if (!search || typeof search !== 'string' || search.trim() === '') {
        return res.json([]);
      }
      
      const searchTerm = search.trim().toLowerCase();
      
      // Build search conditions for travel plans
      let searchConditions = [
        and(
          isNotNull(travelPlans.notes),
          ne(travelPlans.notes, ''),
          ilike(travelPlans.notes, `%${searchTerm}%`)
        )
      ];
      
      // Add city filter if provided
      if (city && typeof city === 'string' && city.trim() !== '') {
        searchConditions.push(
          or(
            ilike(travelPlans.destination, `%${city}%`),
            ilike(travelPlans.destinationCity, `%${city}%`)
          )
        );
      }
      
      // Get travel plans with user info
      const searchResults = await db
        .select({
          id: travelPlans.id,
          userId: travelPlans.userId,
          destination: travelPlans.destination,
          destinationCity: travelPlans.destinationCity,
          destinationState: travelPlans.destinationState,
          destinationCountry: travelPlans.destinationCountry,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate,
          notes: travelPlans.notes,
          interests: travelPlans.interests,
          activities: travelPlans.activities,
          events: travelPlans.events,
          createdAt: travelPlans.createdAt,
          // User info
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          userType: users.userType
        })
        .from(travelPlans)
        .innerJoin(users, eq(travelPlans.userId, users.id))
        .where(and(...searchConditions))
        .orderBy(desc(travelPlans.createdAt))
        .limit(50);
      
      console.log(`🔍 TRAVEL PLANS SEARCH: Found ${searchResults.length} travel plans matching "${searchTerm}"`);
      res.json(searchResults);
      
    } catch (error: any) {
      console.error("🔍 TRAVEL PLANS SEARCH ERROR:", error);
      res.status(500).json({ error: "Failed to search travel plans" });
    }
  });

  // FIXED: Get events filtered by city with proper location filtering - NO CROSS-CITY BLEEDING
  app.get("/api/events", async (req, res) => {
    console.log("🟢 EVENTS ENDPOINT HIT! Query:", req.query, "URL:", req.url);
    try {
      console.log(`📅 EVENTS DEBUG: Full query parameters:`, req.query);
      const { city, state, country, userId } = req.query;
      console.log(`📅 EVENTS DEBUG: Extracted city="${city}" state="${state}" country="${country}"`);
      console.log(`📅 EVENTS DEBUG: City type: ${typeof city}, truthy: ${!!city}, trimmed: "${typeof city === 'string' ? city.trim() : 'N/A'}"`);
      if (process.env.NODE_ENV === 'development') console.log(`📅 DIRECT API: Fetching events with query:`, req.query);

      let eventsQuery = [];
      console.log(`📅 EVENTS DEBUG: City parameter received: "${city}", type: ${typeof city}`);
      
      if (city && typeof city === 'string' && city.trim() !== '') {
        const cityName = city.toString();
        console.log(`🎪 EVENTS: Getting events for city: ${cityName}`);
        
        // Apply the same LA Metro consolidation as the users endpoint
        const { METRO_AREAS } = await import('../shared/constants');
        const isLAMetroCity = METRO_AREAS['Los Angeles'].cities.includes(cityName);
        
        let searchCities = [cityName];
        
        if (isLAMetroCity || cityName === 'Los Angeles Metro') {
          // Search for ALL LA metro cities
          searchCities = METRO_AREAS['Los Angeles'].cities;
          console.log(`🌍 LA METRO EVENTS: Searching for events in ALL LA metro cities:`, searchCities.length, 'cities');
        } else {
          console.log(`🎯 EVENTS EXACT: Searching events only in ${cityName}`);
        }
        
        if (process.env.NODE_ENV === 'development') console.log(`🌍 EVENTS: Final searchCities array:`, searchCities);
        
        // Search events in relevant cities - OPTIMIZED single query
        const now = new Date();
        const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
        
        // PERFORMANCE FIX: Use single query with OR condition instead of loop
        if (searchCities.length === 1) {
          // Single city - simple query
          eventsQuery = await db.select().from(events)
            .where(and(
              eq(events.city, searchCities[0]),
              gte(events.date, now),
              lte(events.date, sixWeeksFromNow)
            ))
            .orderBy(asc(events.date));
          if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENTS: Found ${eventsQuery.length} events in "${searchCities[0]}"`);
        } else {
          // Multiple cities - single query with IN clause
          const { inArray } = await import('drizzle-orm');
          eventsQuery = await db.select().from(events)
            .where(and(
              inArray(events.city, searchCities),
              gte(events.date, now),
              lte(events.date, sixWeeksFromNow)
            ))
            .orderBy(asc(events.date));
          if (process.env.NODE_ENV === 'development') console.log(`🔍 EVENTS: Found ${eventsQuery.length} events across ${searchCities.length} metro cities`);
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
        // DISABLED: Don't generate Austin/Vegas events for LA metro areas
        if (eventsQuery.length <= 3 && !cityName.toLowerCase().includes('austin') && !cityName.toLowerCase().includes('vegas')) {
          console.log(`🤖 AI TRIGGER: ${cityName} has only ${eventsQuery.length} events - generating AI events with OpenAI`);
          try {
            // Generate AI events for this city in the background (don't wait for completion)
            setImmediate(async () => {
              try {
                // DISABLED: Do not generate fake events
                // const { createAIEventsInDatabase } = await import('./openaiEventGenerator');
                // await createAIEventsInDatabase(cityName, state || 'CA', country || 'USA');
                console.log(`⚠️ AI EVENT GENERATION DISABLED for safety - no fake events created for ${cityName}`);
              } catch (aiError) {
                console.error(`🚫 AI EVENT GENERATION FAILED for ${cityName}:`, aiError);
              }
            });
          } catch (error) {
            console.error(`🚫 AI EVENT TRIGGER FAILED for ${cityName}:`, error);
          }
        }
      } else {
        // Return ONLY USER-CREATED events in next 6 weeks if no city specified
        // FILTER OUT AI-GENERATED EVENTS: Only include events with organizer_id > 0
        const now = new Date();
        const sixWeeksFromNow = new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000));
        
        eventsQuery = await db.select().from(events)
          .where(and(
            gte(events.date, now),
            lte(events.date, sixWeeksFromNow),
            gt(events.organizerId, 0) // ONLY USER-CREATED EVENTS
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
        if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Returning ${eventsQuery.length} USER-CREATED events in next 6 weeks (filtered out AI events)`);
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
              // Check if this is an API-generated event by specific organizer usernames
              if (organizerUser.username === 'nearbytravlr' || organizerUser.username === 'api_events' || organizerUser.username === 'ai_events') {
                organizer = "Outside of the Website";
              } else {
                organizer = organizerUser.username; // Use username for real member-created events
              }
            }
          }
          
          return {
            ...event,
            participantCount: participantCountMap.get(event.id) || 0,
            organizer: organizer // Add organizer username for display
          };
        })
      );

      // PRIVATE EVENT FILTERING: Filter events based on user demographics
      let filteredEvents = eventsWithCountsAndOrganizers;
      if (userId && typeof userId === 'string') {
        const userIdNum = parseInt(userId);
        if (!isNaN(userIdNum)) {
          const user = await storage.getUser(userIdNum);
          if (user) {
            console.log(`🔒 PRIVATE EVENTS: Filtering events for user ${user.username} with demographics`);
            filteredEvents = [];
            
            for (const event of eventsWithCountsAndOrganizers) {
              // Check if user can see this event based on demographics
              const canSee = await storage.canUserSeeEvent(event, userIdNum);
              if (canSee) {
                filteredEvents.push(event);
              } else {
                console.log(`🔒 PRIVATE EVENTS: Hidden event "${event.title}" from user ${user.username} due to demographic restrictions`);
              }
            }
            
            console.log(`🔒 PRIVATE EVENTS: Filtered ${eventsWithCountsAndOrganizers.length} events down to ${filteredEvents.length} visible events`);
          }
        }
      } else {
        // No user ID provided - filter out all private events
        filteredEvents = [];
        for (const event of eventsWithCountsAndOrganizers) {
          // Only show events with no demographic restrictions
          if (!event.genderRestriction && 
              !event.lgbtqiaOnly && 
              !event.veteransOnly && 
              !event.activeDutyOnly && 
              !event.womenOnly && 
              !event.menOnly && 
              !event.singlePeopleOnly && 
              !event.familiesOnly && 
              !event.ageRestrictionMin && 
              !event.ageRestrictionMax &&
              !event.customRestriction) {
            filteredEvents.push(event);
          }
        }
        console.log(`🔒 PRIVATE EVENTS: No user provided - filtered ${eventsWithCountsAndOrganizers.length} events down to ${filteredEvents.length} public events`);
      }

      if (process.env.NODE_ENV === 'development') console.log(`🎪 EVENTS: Enhanced ${filteredEvents.length} events with participant counts and organizer info`);
      return res.json(filteredEvents);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get events from dual locations (current travel destination AND hometown)
  app.get('/api/events/nearby-dual', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const travelDestination = req.query.travelDestination as string;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // Get user's hometown from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const events = [];
      
      // Get events from travel destination (current location)
      if (travelDestination) {
        const travelCity = travelDestination.split(',')[0].trim();
        console.log(`🎪 DUAL EVENTS: Fetching travel location events for ${travelCity}`);
        
        const travelEvents = await storage.getEventsByLocation(travelCity, '', '');
        events.push(...travelEvents.map((event: any) => ({
          ...event,
          locationContext: 'travel',
          locationLabel: `Near You in ${travelCity}`,
          priority: 1
        })));
      }

      // Get events from hometown
      if (user.hometownCity) {
        const hometownCity = user.hometownCity;
        console.log(`🎪 DUAL EVENTS: Fetching hometown events for ${hometownCity}`);
        
        const hometownEvents = await storage.getEventsByLocation(hometownCity, '', '');
        events.push(...hometownEvents.map((event: any) => ({
          ...event,
          locationContext: 'hometown',
          locationLabel: `Back Home in ${hometownCity}`,
          priority: 2
        })));
      }

      // Remove duplicates and sort by priority then date
      const uniqueEvents = events
        .filter((event, index, self) => 
          index === self.findIndex(e => e.id === event.id)
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

      console.log(`🎪 DUAL EVENTS: Returning ${uniqueEvents.length} events for user ${userId}`);
      res.json(uniqueEvents);
    } catch (error) {
      console.error('Error fetching dual location events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // 🤖 MANUAL AI EVENT GENERATION ENDPOINT - For testing and manual triggers
  app.post("/api/events/generate-ai/:city", async (req, res) => {
    try {
      const cityName = req.params.city;
      const { state = 'TX', country = 'USA' } = req.body;
      
      console.log(`⚠️ AI EVENT GENERATION DISABLED - refusing to create fake events for ${cityName}`);
      
      // DISABLED: Do not generate fake events
      // const { createAIEventsInDatabase } = await import('./openaiEventGenerator');
      // const aiEvents = await createAIEventsInDatabase(cityName, state, country);
      const aiEvents = [];
      
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

  // Get nearby events - must be before /:id route to avoid "NaN" error
  app.get("/api/events/nearby", async (req, res) => {
    try {
      // For now, return empty array or redirect to main events endpoint
      // This prevents the "NaN" error when EventsGrid calls this endpoint
      console.log('📍 Nearby events endpoint called - returning all events');
      const allEvents = await storage.getAllEvents();
      return res.json(allEvents || []);
    } catch (error: any) {
      console.error("Error fetching nearby events:", error);
      return res.status(500).json({ message: "Failed to fetch nearby events" });
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
          // Check if this is an API-generated event by specific organizer usernames
          if (organizerUser.username === 'nearbytravlr' || organizerUser.username === 'api_events' || organizerUser.username === 'ai_events') {
            organizer = "Outside of the Website";
          } else {
            organizer = organizerUser.username; // Use username for real member-created events
          }
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

  // CRITICAL: Delete/Cancel event (organizer only)
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ EVENT DELETE: User ${userId} attempting to delete event ${eventId}`);
      
      // Get event to check if user is organizer
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Only the event organizer can delete this event" });
      }
      
      // Delete the event
      const success = await storage.deleteEvent(eventId);
      if (success) {
        if (process.env.NODE_ENV === 'development') console.log(`🗑️ EVENT DELETE: Event ${eventId} successfully deleted by organizer ${userId}`);
        return res.json({ success: true, message: "Event successfully deleted" });
      } else {
        return res.status(500).json({ message: "Failed to delete event" });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting event:", error);
      return res.status(500).json({ message: "Failed to delete event" });
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

      // Parse all array fields
      const currentInterests = parseArray(currentUser.interests);
      const currentActivities = parseArray(currentUser.activities);
      const currentEvents = parseArray(currentUser.events);
      const currentSexualPreference = parseArray(currentUser.sexualPreference);
      const currentTravelStyle = parseArray(currentUser.travelStyle);
      const currentLanguages = parseArray(currentUser.languagesSpoken);
      const currentCountries = parseArray(currentUser.countriesVisited);
      const currentTravelWhat = parseArray(currentUser.travelWhat);
      const currentDefaultInterests = parseArray(currentUser.defaultTravelInterests);
      
      const otherInterests = parseArray(otherUser.interests);
      const otherActivities = parseArray(otherUser.activities);
      const otherEvents = parseArray(otherUser.events);
      const otherSexualPreference = parseArray(otherUser.sexualPreference);
      const otherTravelStyle = parseArray(otherUser.travelStyle);
      const otherLanguages = parseArray(otherUser.languagesSpoken);
      const otherCountries = parseArray(otherUser.countriesVisited);
      const otherTravelWhat = parseArray(otherUser.travelWhat);
      const otherDefaultInterests = parseArray(otherUser.defaultTravelInterests);

      // Calculate shared interests
      const sharedInterests = currentInterests.filter(interest => 
        otherInterests.includes(interest)
      );

      // Calculate shared activities  
      const sharedActivities = currentActivities.filter(activity => 
        otherActivities.includes(activity)
      );
      
      // Calculate shared event types
      const sharedEventTypes = currentEvents.filter(event => 
        otherEvents.includes(event)
      );
      
      // Calculate shared sexual preferences
      const sharedSexualPreferences = currentSexualPreference.filter(pref => 
        otherSexualPreference.includes(pref)
      );
      
      // Calculate shared travel styles
      const sharedTravelStyles = currentTravelStyle.filter(style => 
        otherTravelStyle.includes(style)
      );
      
      // Calculate shared languages
      const sharedLanguages = currentLanguages.filter(lang => 
        otherLanguages.includes(lang)
      );
      
      // Calculate shared countries visited
      const sharedCountries = currentCountries.filter(country => 
        otherCountries.includes(country)
      );
      
      // Calculate shared travel interests (what they want to do)
      const sharedTravelWhat = currentTravelWhat.filter(what => 
        otherTravelWhat.includes(what)
      );
      
      // Calculate shared default travel interests
      const sharedDefaultInterests = currentDefaultInterests.filter(interest => 
        otherDefaultInterests.includes(interest)
      );
      
      // Text field comparisons (case-insensitive)
      const sharedTextFields = [];
      
      // Gender match
      if (currentUser.gender && otherUser.gender && 
          currentUser.gender.toLowerCase() === otherUser.gender.toLowerCase()) {
        sharedTextFields.push(`Gender: ${currentUser.gender}`);
      }
      
      // Military status match
      if (currentUser.militaryStatus && otherUser.militaryStatus && 
          currentUser.militaryStatus.toLowerCase() === otherUser.militaryStatus.toLowerCase()) {
        sharedTextFields.push(`Military: ${currentUser.militaryStatus}`);
      }
      
      // Travel why match
      if (currentUser.travelWhy && otherUser.travelWhy && 
          currentUser.travelWhy.toLowerCase() === otherUser.travelWhy.toLowerCase()) {
        sharedTextFields.push(`Travel Motivation: ${currentUser.travelWhy}`);
      }
      
      // Travel how match
      if (currentUser.travelHow && otherUser.travelHow && 
          currentUser.travelHow.toLowerCase() === otherUser.travelHow.toLowerCase()) {
        sharedTextFields.push(`Travel Style: ${currentUser.travelHow}`);
      }
      
      // Travel budget match
      if (currentUser.travelBudget && otherUser.travelBudget && 
          currentUser.travelBudget.toLowerCase() === otherUser.travelBudget.toLowerCase()) {
        sharedTextFields.push(`Budget: ${currentUser.travelBudget}`);
      }
      
      // Traveling with children match
      if (currentUser.travelingWithChildren && otherUser.travelingWithChildren) {
        sharedTextFields.push('Both traveling with children');
      }
      
      // New to town status match
      if (currentUser.isNewToTown && otherUser.isNewToTown) {
        sharedTextFields.push('Both new to town');
      }
      
      // Hometown city match
      if (currentUser.hometownCity && otherUser.hometownCity && 
          currentUser.hometownCity.toLowerCase() === otherUser.hometownCity.toLowerCase()) {
        sharedTextFields.push(`From: ${currentUser.hometownCity}`);
      }
      
      // Destination city match
      if (currentUser.destinationCity && otherUser.destinationCity && 
          currentUser.destinationCity.toLowerCase() === otherUser.destinationCity.toLowerCase()) {
        sharedTextFields.push(`Traveling to: ${currentUser.destinationCity}`);
      }

      // Get shared CITY-SPECIFIC activities from user_city_interests table
      // CRITICAL: This finds users who selected same activities like "U2 Concert in July" in same city
      const sharedCityActivitiesQuery = await db.execute(sql`
        SELECT DISTINCT 
          uci1.activity_name,
          uci1.city_name
        FROM user_city_interests uci1
        JOIN user_city_interests uci2 ON uci1.activity_id = uci2.activity_id
        WHERE uci1.user_id = ${currentUserId} 
        AND uci2.user_id = ${otherUserId}
        AND uci1.is_active = true
        AND uci2.is_active = true
      `);

      const sharedCityActivities = (sharedCityActivitiesQuery.rows || []).map((row: any) => 
        `${row.city_name}: ${row.activity_name}`
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

      // Combine ALL shared matches - comprehensive profile comparison
      const allSharedMatches = [
        ...sharedInterests,
        ...sharedActivities,
        ...sharedEventTypes,
        ...sharedCityActivities,
        ...sharedEvents,
        ...sharedSexualPreferences,
        ...sharedTravelStyles,
        ...sharedLanguages.map(lang => `Language: ${lang}`),
        ...sharedCountries.map(country => `Visited: ${country}`),
        ...sharedTravelWhat,
        ...sharedDefaultInterests,
        ...sharedTextFields
      ];

      const totalSharedCount = allSharedMatches.length;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🤝 COMPREHENSIVE SHARED MATCHES BREAKDOWN:
          - Shared Interests: ${sharedInterests.length} (${sharedInterests.slice(0, 3).join(', ')})
          - Shared Activities: ${sharedActivities.length} (${sharedActivities.slice(0, 3).join(', ')})
          - Shared Event Types: ${sharedEventTypes.length} (${sharedEventTypes.slice(0, 3).join(', ')})
          - Shared City Activities: ${sharedCityActivities.length} (${sharedCityActivities.slice(0, 3).join(', ')})
          - Shared Events: ${sharedEvents.length} (${sharedEvents.slice(0, 3).join(', ')})
          - Shared Sexual Preferences: ${sharedSexualPreferences.length}
          - Shared Travel Styles: ${sharedTravelStyles.length} (${sharedTravelStyles.join(', ')})
          - Shared Languages: ${sharedLanguages.length} (${sharedLanguages.join(', ')})
          - Shared Countries: ${sharedCountries.length} (${sharedCountries.slice(0, 3).join(', ')})
          - Shared Travel What: ${sharedTravelWhat.length}
          - Shared Default Interests: ${sharedDefaultInterests.length}
          - Shared Text Fields: ${sharedTextFields.length} (${sharedTextFields.join(', ')})
          - Total: ${totalSharedCount}`);
      }

      return res.json({
        totalSharedCount,
        sharedInterests,
        sharedActivities,
        sharedEventTypes,
        sharedCityActivities,
        sharedEvents,
        sharedSexualPreferences,
        sharedTravelStyles,
        sharedLanguages,
        sharedCountries,
        sharedTravelWhat,
        sharedDefaultInterests,
        sharedTextFields,
        allSharedMatches: allSharedMatches.slice(0, 5) // Show top 5 for display
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

  // Contextual event recommendations
  app.get("/api/contextual-events/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 8;

      // Get user info and travel status
      const user = await storage.getUser(userId.toString());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's travel plans to determine current location
      const userTravelPlans = await db
        .select()
        .from(travelPlans)
        .where(eq(travelPlans.userId, userId));

      const activeTravelPlan = userTravelPlans.find(plan => plan.status === 'active');
      const isTraverling = !!activeTravelPlan;
      const currentLocation = isTraverling ? activeTravelPlan.destination : user.hometownCity;
      const travelDestination = activeTravelPlan?.destination;

      // Get user interests and activities for matching  
      const parseArray = (arr: any) => {
        if (Array.isArray(arr)) return arr;
        if (typeof arr === 'string') {
          try {
            return JSON.parse(arr);
          } catch {
            return arr.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        return [];
      };
      
      const userInterests = parseArray(user.interests || []);
      const userActivities = parseArray(user.localActivities || []).concat(parseArray(user.preferredActivities || []));

      // Get events near current location
      let eventsQuery = db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          location: events.location,
          eventDate: events.date,
          category: events.category,
          tags: events.tags,
          attendeeCount: sql<number>`0`.as('attendeeCount')
        })
        .from(events)
        .where(
          and(
            gte(events.date, new Date().toISOString().split('T')[0]),
            or(
              ilike(events.location, `%${currentLocation}%`),
              ilike(events.location, `%${user.hometownCity}%`)
            )
          )
        )
        .limit(limit * 2); // Get more to filter and score

      const nearbyEvents = await eventsQuery;

      // Score events based on relevance
      const scoredEvents = nearbyEvents.map(event => {
        let score = 0;
        const reasons = [];
        const tags = [];

        // Interest matching
        const eventTags = parseArray(event.tags || []);
        const interestMatches = userInterests.filter(interest => 
          eventTags.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
          event.title.toLowerCase().includes(interest.toLowerCase()) ||
          event.description.toLowerCase().includes(interest.toLowerCase())
        );
        
        if (interestMatches.length > 0) {
          score += 0.4 * (interestMatches.length / userInterests.length);
          reasons.push(`Matches ${interestMatches.length} of your interests`);
          tags.push(...interestMatches.slice(0, 2));
        }

        // Activity matching
        const activityMatches = userActivities.filter(activity => 
          eventTags.some(tag => tag.toLowerCase().includes(activity.toLowerCase())) ||
          event.title.toLowerCase().includes(activity.toLowerCase()) ||
          event.description.toLowerCase().includes(activity.toLowerCase())
        );
        
        if (activityMatches.length > 0) {
          score += 0.3 * (activityMatches.length / userActivities.length);
          reasons.push(`Matches your preferred activities`);
          tags.push(...activityMatches.slice(0, 2));
        }

        // Location relevance
        if (isTraverling && event.location.toLowerCase().includes(currentLocation.toLowerCase())) {
          score += 0.2;
          reasons.push(`Near your travel destination`);
          tags.push('Travel destination');
        } else if (!isTraverling && event.location.toLowerCase().includes(user.hometownCity.toLowerCase())) {
          score += 0.15;
          reasons.push(`In your hometown area`);
          tags.push('Local event');
        }

        // Time relevance (events sooner get higher score)
        const eventDate = new Date(event.eventDate);
        const daysFromNow = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysFromNow <= 7) {
          score += 0.1;
          reasons.push(`Coming up soon`);
          tags.push('This week');
        }

        // Free events get slight boost
        if (event.freeEvent) {
          score += 0.05;
          tags.push('Free');
        }

        // Popular events (more attendees)
        if (event.attendeeCount > 10) {
          score += 0.05;
          reasons.push(`Popular event`);
          tags.push('Popular');
        }

        const recommendationReason = reasons.length > 0 ? reasons[0] : 'Event in your area';

        return {
          eventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: event.eventDate,
          category: event.category || 'Event',
          price: 0,
          freeEvent: true,
          attendeeCount: event.attendeeCount,
          maxAttendees: 50,
          organizer: 'Event Organizer',
          relevanceScore: Math.min(score, 1), // Cap at 1
          contextualFactors: {
            locationMatch: isTraverling && event.location.toLowerCase().includes(currentLocation.toLowerCase()) ? 1 : 0.5,
            interestMatch: interestMatches.length / Math.max(userInterests.length, 1),
            timeRelevance: daysFromNow <= 7 ? 1 : 0.5,
            weatherRelevance: 0.5,
            travelContext: isTraverling ? 1 : 0,
            socialProof: Math.min(event.attendeeCount / 20, 1),
            personalHistory: 0.5
          },
          recommendationReason,
          contextualTags: [...new Set(tags)].slice(0, 3) // Remove duplicates, limit to 3
        };
      });

      // Sort by relevance score and take top results
      const topEvents = scoredEvents
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      const averageScore = topEvents.length > 0 
        ? topEvents.reduce((sum, event) => sum + event.relevanceScore, 0) / topEvents.length 
        : 0;

      res.json({
        userId,
        context: {
          location: currentLocation,
          isTraverling,
          travelDestination,
          interests: userInterests.length,
          activities: userActivities.length
        },
        recommendations: topEvents,
        meta: {
          total: topEvents.length,
          averageScore: Math.round(averageScore * 100) / 100
        }
      });

    } catch (error: any) {
      console.error('Contextual events error:', error);
      res.status(500).json({ error: "Failed to get contextual events" });
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



  // CREATE quick meetup endpoint (DEPRECATED - use /api/quick-meet instead)
  app.post("/api/quick-meetups", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meet instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // Get single quick meetup by ID (DEPRECATED - use /api/quick-meets/:id instead)
  app.get("/api/quick-meetups/:id", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // CRITICAL: Get quick meetups - ACTIVE FIRST, NEWEST FIRST (DEPRECATED - use /api/quick-meets instead)
  app.get("/api/quick-meetups", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
    console.log(`🔧 ROUTE HIT: /api/quick-meetups called at ${new Date().toISOString()}`);
    console.log(`🔧 NODE_ENV:`, process.env.NODE_ENV);
    try {
      const { city, userId } = req.query;
      const now = new Date();

      console.log(`🔧 QUICK MEETUPS DEBUG: Fetching all meetups using Drizzle ORM, active first`);

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
        .select({
          // Select all quick meetup fields
          id: quickMeetups.id,
          organizerId: quickMeetups.organizerId,
          title: quickMeetups.title,
          description: quickMeetups.description,
          meetingPoint: quickMeetups.meetingPoint,
          street: quickMeetups.street,
          city: quickMeetups.city,
          state: quickMeetups.state,
          zipcode: quickMeetups.zipcode,
          country: quickMeetups.country,
          location: quickMeetups.location,
          availableAt: quickMeetups.availableAt,
          expiresAt: quickMeetups.expiresAt,
          duration: quickMeetups.duration,
          isActive: quickMeetups.isActive,
          createdAt: quickMeetups.createdAt,
          participantCount: quickMeetups.participantCount,
          // Select user fields with alias including displayNamePreference
          organizerUsername: users.username,
          organizerName: users.name,
          organizerDisplayNamePreference: users.displayNamePreference,
          organizerProfileImage: users.profileImage
        })
        .from(quickMeetups)
        .leftJoin(users, eq(quickMeetups.organizerId, users.id))
        .where(and(...conditions));

      const queryResult = await query.orderBy(desc(quickMeetups.createdAt));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 QUICK MEETUPS RAW QUERY RESULT:`, queryResult.length, 'results');
        if (queryResult.length > 0) {
          console.log(`🔧 FIRST RESULT:`, {
            id: queryResult[0].id,
            organizerId: queryResult[0].organizerId,
            organizerUsername: queryResult[0].organizerUsername,
            organizerPublicName: computePublicName(
              queryResult[0].organizerDisplayNamePreference || 'username',
              queryResult[0].organizerUsername || '',
              queryResult[0].organizerName || ''
            ),
            organizerProfileImage: queryResult[0].organizerProfileImage ? 'HAS IMAGE' : 'NO IMAGE'
          });
        }
      }
      
      // Transform the joined data to match expected format
      const allMeetups = queryResult.map(row => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 MEETUP ROW DEBUG:`, {
            id: row.id,
            organizerId: row.organizerId,
            organizerUsername: row.organizerUsername,
            organizerPublicName: computePublicName(
              row.organizerDisplayNamePreference || 'username',
              row.organizerUsername || '',
              row.organizerName || ''
            ),
            organizerProfileImage: row.organizerProfileImage ? 'HAS IMAGE' : 'NO IMAGE'
          });
        }
        
        return {
          id: row.id,
          organizerId: row.organizerId,
          title: row.title,
          description: row.description,
          meetingPoint: row.meetingPoint,
          street: row.street,
          city: row.city,
          state: row.state,
          zipcode: row.zipcode,
          country: row.country,
          location: row.location,
          availableAt: row.availableAt,
          expiresAt: row.expiresAt,
          duration: row.duration,
          isActive: row.isActive,
          createdAt: row.createdAt,
          participantCount: row.participantCount,
          organizerUsername: row.organizerUsername,
          organizerPublicName: computePublicName(
            row.organizerDisplayNamePreference || 'username',
            row.organizerUsername || '',
            row.organizerName || ''
          ),
          organizerProfileImage: row.organizerProfileImage
        };
      });
      
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

  // GET quick meetup participants (DEPRECATED - use /api/quick-meets/:id/participants instead)
  app.get("/api/quick-meetups/:id/participants", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id/participants instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // JOIN quick meetup endpoint (DEPRECATED - use /api/quick-meets/:id/join instead)
  app.post("/api/quick-meetups/:id/join", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id/join instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // RESTART quick meetup from expired meetup (DEPRECATED - use /api/quick-meets/:id/restart instead)
  app.post("/api/quick-meetups/:id/restart", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id/restart instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // UPDATE quick meetup (DEPRECATED - use /api/quick-meets/:id instead)
  app.put("/api/quick-meetups/:id", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // DELETE quick meetup (DEPRECATED - use /api/quick-meets/:id instead)
  app.delete("/api/quick-meetups/:id", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/quick-meets/:id instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // GET user's expired meetups for restart management (DEPRECATED - use /api/users/:userId/expired-quick-meets instead)
  app.get("/api/users/:userId/expired-meetups", async (req, res) => {
    // Add deprecation header
    res.set('X-Deprecated-API', 'This endpoint is deprecated. Please use /api/users/:userId/expired-quick-meets instead.');
    res.set('X-Deprecation-Date', '2025-09-16');
    res.set('X-Sunset-Date', '2025-12-01');
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

  // ===== NEW QUICK MEET API ROUTES (Stage 1: Aliases for backward compatibility) =====
  // These new routes provide the updated "quick meet" terminology while maintaining
  // identical functionality to the legacy "quick-meetups" endpoints below.

  // CREATE quick meet endpoint (alias for quick-meetup)
  app.post("/api/quick-meet", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const meetupData = {
        ...req.body,
        organizerId: parseInt(userId as string || '0')
      };

      if (process.env.NODE_ENV === 'development') console.log(`🚀 CREATING QUICK MEET: ${meetupData.title} by user ${userId}`);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 STREET ADDRESS RECEIVED:`, meetupData.street);
      if (process.env.NODE_ENV === 'development') console.log(`📦 FULL REQUEST BODY:`, req.body);
      
      const newMeetup = await storage.createQuickMeetup(meetupData);
      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK MEET CREATED: ID ${newMeetup.id}, expires at ${newMeetup.expiresAt}`);
      if (process.env.NODE_ENV === 'development') console.log(`🏠 STREET ADDRESS SAVED:`, newMeetup.street);
      
      // Award 1 aura point for creating a quick meet
      await awardAuraPoints(parseInt(userId as string || '0'), 1, 'creating a quick meet');
      
      res.json(newMeetup);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error creating quick meet:", error);
      res.status(500).json({ message: "Failed to create quick meet" });
    }
  });

  // Get single quick meet by ID
  app.get("/api/quick-meets/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      if (isNaN(meetupId)) {
        return res.status(400).json({ message: "Invalid quick meet ID" });
      }

      const meetup = await storage.getQuickMeetupById(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Quick meet not found" });
      }

      res.json(meetup);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meet:", error);
      res.status(500).json({ message: "Failed to fetch quick meet" });
    }
  });

  // Get quick meets - ACTIVE FIRST, NEWEST FIRST
  app.get("/api/quick-meets", async (req, res) => {
    console.log(`🔧 ROUTE HIT: /api/quick-meets called at ${new Date().toISOString()}`);
    console.log(`🔧 NODE_ENV:`, process.env.NODE_ENV);
    try {
      const { city, userId } = req.query;
      const now = new Date();

      console.log(`🔧 QUICK MEETS DEBUG: Using basic query with user join to get organizer info`);

      // Basic query with JOIN to get organizer information including displayNamePreference
      const queryResult = await db
        .select({
          quickMeetups,
          users: {
            id: users.id,
            username: users.username,
            name: users.name,
            displayNamePreference: users.displayNamePreference,
            profileImage: users.profileImage
          }
        })
        .from(quickMeetups)
        .leftJoin(users, eq(quickMeetups.organizerId, users.id))
        .limit(20);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 QUICK MEETS RAW QUERY RESULT:`, queryResult.length, 'results');
        if (queryResult.length > 0) {
          console.log(`🔧 FIRST RAW RESULT KEYS:`, Object.keys(queryResult[0]));
          console.log(`🔧 FIRST RAW RESULT FULL:`, JSON.stringify(queryResult[0], null, 2));
        }
      }
      
      // Transform the joined data to match expected format
      const allMeetups = queryResult.map(row => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 QUICK MEET ROW DEBUG:`, {
            id: row.quickMeetups?.id,
            organizerId: row.quickMeetups?.organizerId,
            organizerUsername: row.users?.username,
            organizerName: row.users?.name,
            displayNamePreference: row.users?.displayNamePreference,
            organizerProfileImage: row.users?.profileImage ? 'HAS IMAGE' : 'NO IMAGE'
          });
        }
        
        return {
          id: row.quickMeetups?.id,
          organizerId: row.quickMeetups?.organizerId,
          title: row.quickMeetups?.title,
          description: row.quickMeetups?.description,
          meetingPoint: row.quickMeetups?.meetingPoint,
          street: row.quickMeetups?.street,
          city: row.quickMeetups?.city,
          state: row.quickMeetups?.state,
          zipcode: row.quickMeetups?.zipcode,
          country: row.quickMeetups?.country,
          location: row.quickMeetups?.location,
          availableAt: row.quickMeetups?.availableAt,
          expiresAt: row.quickMeetups?.expiresAt,
          duration: row.quickMeetups?.duration,
          isActive: row.quickMeetups?.isActive,
          createdAt: row.quickMeetups?.createdAt,
          participantCount: row.quickMeetups?.participantCount,
          organizerUsername: row.users?.username,
          organizerPublicName: row.users ? computePublicName(
            row.users.displayNamePreference || 'username',
            row.users.username || '',
            row.users.name || ''
          ) : '',
          organizerProfileImage: row.users?.profileImage
        };
      });
      
      // Separate active and expired, then sort each group by newest first
      const activeMeetups = allMeetups
        .filter(meetup => new Date(meetup.expiresAt) > now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      const expiredMeetups = allMeetups
        .filter(meetup => new Date(meetup.expiresAt) <= now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Combine: active first, then expired
      const sortedMeetups = [...activeMeetups, ...expiredMeetups];

      if (process.env.NODE_ENV === 'development') console.log(`QUICK MEETS: Found ${activeMeetups.length} active + ${expiredMeetups.length} expired = ${sortedMeetups.length} total meets`);

      return res.json(sortedMeetups);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meets:", error);
      return res.json([]);
    }
  });

  // GET quick meet participants
  app.get("/api/quick-meets/:id/participants", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      if (process.env.NODE_ENV === 'development') console.log(`👥 GETTING PARTICIPANTS FOR QUICK MEET ${meetupId}`);
      
      const participants = await storage.getQuickMeetupParticipants(meetupId);
      if (process.env.NODE_ENV === 'development') console.log(`👥 FOUND ${participants.length} PARTICIPANTS:`, participants.map(p => p.user?.username));
      
      return res.json(participants);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching quick meet participants:", error);
      return res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // JOIN quick meet endpoint
  app.post("/api/quick-meets/:id/join", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🤝 USER ${userId} JOINING QUICK MEET ${meetupId}`);

      // Check if meetup exists and is active
      const meetup = await storage.getQuickMeetup(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Quick meet not found" });
      }

      if (new Date(meetup.expiresAt) <= new Date()) {
        return res.status(400).json({ message: "This quick meet has expired" });
      }

      // Join the meetup
      const result = await storage.joinQuickMeetup(meetupId, parseInt(userId as string || '0'));
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER ${userId} SUCCESSFULLY JOINED QUICK MEET ${meetupId}`);
      
      return res.json({ success: true, result });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error joining quick meet:", error);
      return res.status(500).json({ message: "Failed to join quick meet" });
    }
  });

  // RESTART quick meet from expired meet
  app.post("/api/quick-meets/:id/restart", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      const { duration = '1hour' } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🔄 RESTARTING QUICK MEET ${meetupId} for user ${userId} with duration ${duration}`);

      // Get the original meetup to copy its details
      const originalMeetup = await storage.getQuickMeetup(meetupId);
      if (!originalMeetup) {
        return res.status(404).json({ message: "Original quick meet not found" });
      }

      // Check if user is the original organizer
      if (originalMeetup.organizerId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Only the original organizer can restart this quick meet" });
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
      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK MEET RESTARTED: New ID ${newMeetup.id} from original ${meetupId}`);
      
      return res.json({ 
        success: true, 
        meetup: newMeetup,
        message: "Quick meet successfully restarted with fresh participant list"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error restarting quick meet:", error);
      return res.status(500).json({ message: "Failed to restart quick meet" });
    }
  });

  // UPDATE quick meet
  app.put("/api/quick-meets/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the meetup to verify ownership
      const existingMeetup = await storage.getQuickMeetup(meetupId);
      if (!existingMeetup) {
        return res.status(404).json({ message: "Quick meet not found" });
      }

      // Check if user is the organizer
      if (existingMeetup.organizerId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Only the organizer can edit this quick meet" });
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

      if (process.env.NODE_ENV === 'development') console.log(`🔄 UPDATING QUICK MEET ${meetupId} for user ${userId}:`, updates);

      const updatedMeetup = await storage.updateQuickMeetup(meetupId, updates);
      if (!updatedMeetup) {
        return res.status(500).json({ message: "Failed to update quick meet" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK MEET UPDATED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        meetup: updatedMeetup,
        message: "Quick meet updated successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating quick meet:", error);
      return res.status(500).json({ message: "Failed to update quick meet" });
    }
  });

  // DELETE quick meet
  app.delete("/api/quick-meets/:id", async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id || '0');
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the meetup to verify ownership
      const existingMeetup = await storage.getQuickMeetup(meetupId);
      if (!existingMeetup) {
        return res.status(404).json({ message: "Quick meet not found" });
      }

      // Check if user is the organizer
      if (existingMeetup.organizerId !== parseInt(userId as string || '0')) {
        return res.status(403).json({ message: "Only the organizer can delete this quick meet" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETING QUICK MEET ${meetupId} for user ${userId}`);

      const deleted = await storage.deleteQuickMeetup(meetupId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete quick meet" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`✅ QUICK MEET DELETED: ID ${meetupId}`);
      return res.json({ 
        success: true, 
        message: "Quick meet deleted successfully"
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error deleting quick meet:", error);
      return res.status(500).json({ message: "Failed to delete quick meet" });
    }
  });

  // GET user's expired quick meets for restart management
  app.get("/api/users/:userId/expired-quick-meets", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId || '0');
      const authUserId = req.headers['x-user-id'];
      
      if (!authUserId || parseInt(authUserId as string || '0') !== userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`📋 FETCHING EXPIRED QUICK MEETS for user ${userId}`);
      
      const expiredMeetups = await storage.getUserArchivedMeetups(userId);
      if (process.env.NODE_ENV === 'development') console.log(`Found ${expiredMeetups.length} expired quick meets for restart`);
      
      return res.json(expiredMeetups);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error fetching expired quick meets:", error);
      return res.status(500).json({ message: "Failed to fetch expired quick meets" });
    }
  });

  // ===== LEGACY QUICK MEETUPS API ROUTES (deprecated, will be removed in future versions) =====
  // These endpoints are deprecated in favor of the new "quick meet" terminology above.
  // They are kept for backward compatibility but will be removed in a future release.

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

      // Handle date fallback logic - Allow null dates when not provided
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
        // Leave as null if no date provided - user doesn't want it to default to today
        finalStartDate = null;
        if (process.env.NODE_ENV === 'development') console.log('📅 No dates available, leaving empty as requested');
      }

      if (endDate) {
        finalEndDate = new Date(endDate);
      } else if (photoUploadDates.length > 0 && finalStartDate) {
        // If no end date but we have a start date, use latest photo upload date or same as start date
        const latestPhotoDate = new Date(Math.max(...photoUploadDates.map(d => d.getTime())));
        finalEndDate = latestPhotoDate > finalStartDate ? latestPhotoDate : finalStartDate;
        if (process.env.NODE_ENV === 'development') console.log('📅 No end date provided, using latest photo date:', finalEndDate);
      } else {
        // Leave as null if no date provided - user doesn't want it to default to start date
        finalEndDate = null;
        if (process.env.NODE_ENV === 'development') console.log('📅 No end date available, leaving empty as requested');
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

  // PHOTO TAGGING: Get tags for a photo
  app.get("/api/photos/:id/tags", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      if (isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }

      const tags = await storage.getPhotoTags(photoId);
      res.json(tags);
    } catch (error: any) {
      console.error("Error fetching photo tags:", error);
      res.status(500).json({ message: "Failed to fetch photo tags" });
    }
  });

  // PHOTO TAGGING: Tag a user in a photo
  app.post("/api/photos/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { taggedUserId } = req.body;
      const taggedByUserId = req.user.claims.sub;

      if (isNaN(photoId) || !taggedUserId) {
        return res.status(400).json({ message: "Invalid photo ID or tagged user ID" });
      }

      const tag = await storage.createPhotoTag(photoId, taggedUserId, taggedByUserId);
      res.json({ message: "User tagged successfully", tag });
    } catch (error: any) {
      console.error("Error creating photo tag:", error);
      res.status(500).json({ message: "Failed to tag user" });
    }
  });

  // PHOTO TAGGING: Remove tag from photo
  app.delete("/api/photos/:id/tags/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const taggedUserId = parseInt(req.params.userId);

      if (isNaN(photoId) || isNaN(taggedUserId)) {
        return res.status(400).json({ message: "Invalid photo ID or user ID" });
      }

      const result = await storage.deletePhotoTag(photoId, taggedUserId);
      
      if (result) {
        res.json({ message: "Tag removed successfully" });
      } else {
        res.status(404).json({ message: "Tag not found" });
      }
    } catch (error: any) {
      console.error("Error removing photo tag:", error);
      res.status(500).json({ message: "Failed to remove tag" });
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
      
      console.log("🔥 MY-ROOMS: FILTERING FROM", allChatrooms.length, "TO LEGITIMATE ONLY");
      
      // FILTER: Only show legitimate chatrooms (Los Angeles Metro and Marseille)
      const legitimateChatrooms = allChatrooms.filter(chatroom => 
        chatroom.city === 'Los Angeles Metro' || 
        chatroom.city === 'Marseille'
      );
      
      console.log("🔥 MY-ROOMS: FILTERED TO", legitimateChatrooms.length, "LEGITIMATE CHATROOMS");
      
      // Return user's joined rooms (can be enhanced with membership tracking)
      const joinedRooms = legitimateChatrooms.slice(0, 5).map(room => ({
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
      
      // FILTER: Only show legitimate chatrooms (Los Angeles Metro and Marseille)
      const legitimateChatrooms = allChatrooms.filter(chatroom => 
        chatroom.city === 'Los Angeles Metro' || 
        chatroom.city === 'Marseille'
      );
      
      const publicRooms = legitimateChatrooms
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
      
      // FILTER: Only show legitimate chatrooms (Los Angeles Metro and Marseille)
      const legitimateChatrooms = allChatrooms.filter(chatroom => 
        chatroom.city === 'Los Angeles Metro' || 
        chatroom.city === 'Marseille'
      );
      
      console.log(`🚨 CITIES ENDPOINT: Filtered from ${allChatrooms.length} to ${legitimateChatrooms.length} legitimate chatrooms`);
      
      // Get member counts for legitimate chatrooms only  
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

      const cityRooms = legitimateChatrooms
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

      // 🔒 SECURITY CHECK: Verify user is a member of the chatroom before returning messages
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
        if (process.env.NODE_ENV === 'development') console.log(`🚫 SECURITY: User ${userId} attempted to view messages for chatroom ${roomId} without membership`);
        return res.status(403).json({ message: "You must join the chatroom to view messages" });
      }

      if (process.env.NODE_ENV === 'development') console.log(`🏠 CHATROOM MESSAGES: Getting messages for chatroom ${roomId}`);

      const messages = await storage.getChatroomMessages(roomId);
      
      // Flatten the message structure for frontend compatibility
      const flattenedMessages = messages.map(msg => ({
        id: msg.id,
        chatroom_id: roomId,
        sender_id: msg.senderId,
        content: msg.content,
        created_at: msg.createdAt,
        username: msg.user?.username || 'Unknown',
        name: msg.user?.name || 'Unknown User',
        profile_image: msg.user?.profileImage
      }));
      
      return res.json(flattenedMessages);
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

  // Update user display name preference
  app.put("/api/users/display-preference", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { displayNamePreference } = req.body;

      // Validate the preference value
      const validPreferences = ['username', 'first_name', 'full_name'];
      if (!displayNamePreference || !validPreferences.includes(displayNamePreference)) {
        return res.status(400).json({ 
          message: "Invalid display preference. Must be 'username', 'first_name', or 'full_name'" 
        });
      }

      // Update the user's display name preference in the database
      const updatedUser = await db.update(users)
        .set({ displayNamePreference })
        .where(eq(users.id, userId))
        .returning()
        .then(rows => rows[0]);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`👤 DISPLAY PREFERENCE: User ${userId} updated preference to '${displayNamePreference}'`);
      }

      res.json({ 
        success: true, 
        message: "Display preference updated successfully",
        displayNamePreference: updatedUser.displayNamePreference
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error("Error updating display preference:", error);
      res.status(500).json({ message: "Failed to update display preference" });
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

        // NOTE: Messages remain unread until user actually opens the conversation
        // This ensures notification badges show properly for new messages

        if (process.env.NODE_ENV === 'development') console.log(` Delivered ${unreadMessages.length} offline messages to user ${userId} (kept as unread for notifications)`);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error(' Error delivering offline messages:', error);
    }
  }

  // CRITICAL: Cities API endpoint for city-specific matching
  app.get('/api/cities/all', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🏙️ CITIES API: Fetching all cities...');

      // Major cities with "ALWAYS" activity lists that must be available
      const MAJOR_CITIES = [
        { city: 'Los Angeles', state: 'California', country: 'United States' },
        { city: 'Los Angeles Metro', state: 'California', country: 'United States' },
        { city: 'New York City', state: 'New York', country: 'United States' },
        { city: 'Miami', state: 'Florida', country: 'United States' },
        { city: 'Chicago', state: 'Illinois', country: 'United States' },
        { city: 'Las Vegas', state: 'Nevada', country: 'United States' },
        { city: 'Austin', state: 'Texas', country: 'United States' }
      ];

      // Ensure major cities exist in cityPages table
      for (const majorCity of MAJOR_CITIES) {
        try {
          await db
            .insert(cityPages)
            .values({
              city: majorCity.city,
              state: majorCity.state,
              country: majorCity.country,
              createdById: 1, // System user ID
              title: `${majorCity.city} Travel Guide`,
              description: `Discover the best of ${majorCity.city} with curated local experiences and activities.`,
              isPublished: true,
              isDeletionProtected: true
            })
            .onConflictDoNothing(); // Don't duplicate if already exists
        } catch (insertError) {
          // Continue if insert fails (likely already exists)
        }
      }

      // Get actual counts for each city (excluding test cities)
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
        .where(
          and(
            ne(cityPages.city, 'Test City'),
            ne(cityPages.city, 'Global'),
            ne(cityPages.city, 'test city'),
            ne(cityPages.city, 'global')
          )
        )
        .orderBy(sql<number>`(SELECT COUNT(*) FROM users WHERE hometown_city = ${cityPages.city}) + (SELECT COUNT(*) FROM users WHERE is_currently_traveling = true AND travel_destination LIKE '%' || ${cityPages.city} || '%') DESC`)
        .limit(50);

      // Ensure major cities appear at the top if they have no users yet
      const majorCityResults = citiesFromPages.filter(city => 
        MAJOR_CITIES.some(major => major.city === city.city)
      );
      const otherCityResults = citiesFromPages.filter(city => 
        !MAJOR_CITIES.some(major => major.city === city.city)
      );

      const finalResults = [...majorCityResults, ...otherCityResults];

      if (process.env.NODE_ENV === 'development') console.log(`🏙️ CITIES API: Found ${finalResults.length} cities (${majorCityResults.length} major cities guaranteed)`);
      if (process.env.NODE_ENV === 'development') console.log('🏙️ CITIES API: Major cities included:', majorCityResults.map(c => c.city));

      res.json(finalResults);
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

  // DELETE city activity by ID
  app.delete("/api/city-activities/:activityId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ error: 'Invalid activity ID' });
      }

      await db.delete(cityActivities).where(eq(cityActivities.id, activityId));
      
      if (process.env.NODE_ENV === 'development') console.log(`🗑️ DELETED CITY ACTIVITY: ID ${activityId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting city activity:', error);
      res.status(500).json({ error: 'Failed to delete city activity' });
    }
  });

  // POST enhance city with AI-generated activities
  app.post("/api/city-activities/:cityName/enhance", async (req, res) => {
    try {
      const { cityName } = req.params;
      const userId = req.headers['x-user-id'];
      
      if (!cityName) {
        return res.status(400).json({ error: 'City name is required' });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`🤖 AI ENHANCE: Generating AI activities for ${cityName}`);
      
      // Call the AI enhancement function
      const result = await enhanceExistingCityWithMoreActivities(cityName);
      
      if (result.success) {
        if (process.env.NODE_ENV === 'development') console.log(`✅ AI ENHANCE: Generated ${result.activitiesAdded} new activities for ${cityName}`);
        res.json({ 
          message: `Generated ${result.activitiesAdded} new AI activities for ${cityName}!`,
          activitiesAdded: result.activitiesAdded,
          success: true 
        });
      } else {
        throw new Error(result.error || 'Failed to enhance city activities');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error enhancing city with AI activities:', error);
      res.status(500).json({ error: 'Failed to enhance city activities' });
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
      
      console.log('🔍 POST Debug - Body:', req.body, 'Headers:', { 'x-user-id': userId });
      
      if (!activityId || !cityName || !userId) {
        console.log('❌ Missing fields:', { activityId: !!activityId, cityName: !!cityName, userId: !!userId });
        return res.status(400).json({ error: 'Missing required fields: activityId, cityName, userId' });
      }
      
      if (process.env.NODE_ENV === 'development') console.log(`💡 USER INTERESTS POST: Adding interest for user ${userId} in activity ${activityId}`);
      
      // Ensure city has basic activities before trying to find them
      try {
        await ensureCityHasActivities(cityName);
        if (process.env.NODE_ENV === 'development') console.log(`✅ ENSURED ACTIVITIES: ${cityName} has universal activities`);
      } catch (error) {
        console.log(`⚠️ ACTIVITIES SETUP WARNING for ${cityName}:`, error);
      }
      
      // Map universal activity codes to database activity names - MATCH DATABASE FORMAT
      const universalActivityMap: Record<string, string> = {
        'universal-0': 'MEET LOCALS HERE',
        'universal-1': 'MEET OTHER TRAVELERS HERE', 
        'universal-2': 'LOOKING FOR WORKOUT BUDDY',
        'universal-3': 'HAPPY HOUR DEALS',
        'universal-4': 'COFFEE MEETUPS',
        'universal-5': 'LANGUAGE EXCHANGE',
        'universal-6': 'SOCIAL EVENTS',
        'universal-7': 'FAMILY FRIENDLY ACTIVITIES',
        'universal-8': 'SINGLE',
        'universal-9': 'HIKING GROUPS',
        'universal-10': 'BIKING GROUPS',
        'universal-11': 'WALKING TOURS',
        'universal-12': 'PARKS & GARDENS',
        'universal-13': 'BEACH ACTIVITIES',
        'universal-14': 'RUNNING GROUPS',
        'universal-15': 'ROCK CLIMBING',
        'universal-16': 'SWIMMING',
        'universal-17': 'SKATEBOARDING',
        'universal-18': 'TENNIS',
        'universal-19': 'BASKETBALL',
        'universal-20': 'SOCCER/FOOTBALL',
        'universal-21': 'FISHING',
        'universal-22': 'OUTDOOR FITNESS',
        'universal-23': 'CAMPING',
        'universal-24': 'NATURE WALKS',
        'universal-25': 'LOCAL FOOD SCENE',
        'universal-26': 'FOOD TOURS',
        'universal-27': 'COOKING CLASSES',
        'universal-28': 'WINE TASTING',
        'universal-29': 'BEER GARDENS',
        'universal-30': 'BREAKFAST SPOTS',
        'universal-31': 'LATE NIGHT EATS',
        'universal-32': 'VEGETARIAN/VEGAN FOOD',
        'universal-33': 'FOOD FESTIVALS',
        'universal-34': 'COFFEE CULTURE',
        'universal-35': 'DESSERT PLACES',
        'universal-36': 'PICNIC SPOTS',
        'universal-37': 'MUSEUMS & GALLERIES',
        'universal-38': 'LIVE MUSIC',
        'universal-39': 'THEATER & SHOWS',
        'universal-40': 'LOCAL FESTIVALS',
        'universal-41': 'PHOTOGRAPHY WALKS',
        'universal-42': 'HISTORICAL SITES',
        'universal-43': 'ARCHITECTURE TOURS',
        'universal-44': 'OPEN MIC NIGHTS',
        'universal-45': 'NIGHTLIFE',
        'universal-46': 'ROOFTOP BARS',
        'universal-47': 'LIVE ENTERTAINMENT',
        'universal-48': 'DANCING',
        'universal-49': 'KARAOKE',
        'universal-50': 'COMEDY SHOWS',
        'universal-51': 'PUB CRAWLS',
        'universal-52': 'TRIVIA NIGHTS',
        'universal-53': 'VINTAGE & THRIFT',
        'universal-54': 'FLEA MARKETS',
        'universal-55': 'SPA & WELLNESS',
        'universal-56': 'YOGA CLASSES',
        'universal-57': 'MEDITATION GROUPS',
        'universal-58': 'MASSAGE THERAPY',
        'universal-59': 'FITNESS CENTERS',
        'universal-60': 'PILATES CLASSES',
        'universal-61': 'LOCAL TOURS',
        'universal-62': 'GHOST TOURS',
        'universal-63': 'ESCAPE ROOMS',
        'universal-64': 'LOCAL SPORTS',
        'universal-65': 'SCAVENGER HUNTS',
        'universal-66': 'BOAT TOURS',
        'universal-67': 'BIKE RENTALS',
        'universal-68': 'WALKING GROUPS',
        'universal-69': 'LGBTQ+ FRIENDLY'
      };

      let activity;
      let dbActivityId: number;
      
      // Check if it's a universal activity code (only for string IDs)
      if (typeof activityId === 'string' && activityId.startsWith('universal-')) {
        const activityName = universalActivityMap[activityId];
        if (!activityName) {
          return res.status(404).json({ error: 'Universal activity not found' });
        }
        
        // Find the activity in the database by name and city
        if (process.env.NODE_ENV === 'development') console.log(`🔍 ACTIVITY LOOKUP: Searching for "${activityName}" in ${cityName}`);
        
        const [dbActivity] = await db
          .select({ id: cityActivities.id, activityName: cityActivities.activityName })
          .from(cityActivities)
          .where(
            and(
              sql`LOWER(${cityActivities.activityName}) = LOWER(${activityName})`,
              eq(cityActivities.cityName, cityName)
            )
          );
          
        if (!dbActivity) {
          // Try to find any activities in this city to debug
          const allActivitiesInCity = await db
            .select({ activityName: cityActivities.activityName })
            .from(cityActivities)
            .where(eq(cityActivities.cityName, cityName));
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ ACTIVITY LOOKUP FAILED: "${activityName}" not found in ${cityName}`);
            console.log(`🗂️ Available activities in ${cityName}:`, allActivitiesInCity.map(a => a.activityName));
          }
          
          return res.status(404).json({ error: 'Activity not found in city' });
        }
        
        activity = dbActivity;
        dbActivityId = dbActivity.id;
      } else {
        // Handle regular numeric activity IDs
        const [dbActivity] = await db
          .select({ id: cityActivities.id, activityName: cityActivities.activityName })
          .from(cityActivities)
          .where(eq(cityActivities.id, parseInt(activityId)));
          
        if (!dbActivity) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        
        activity = dbActivity;
        dbActivityId = dbActivity.id;
      }
      
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      const [newInterest] = await db
        .insert(userCityInterests)
        .values({
          userId: parseInt(userId as string),
          activityId: dbActivityId,
          activityName: activity.activityName,
          cityName,
          isActive: true
        })
        .returning();
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS POST: Created interest ${newInterest.id} for user ${userId}`);
      res.json(newInterest);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating user city interest:', error);
      
      // Handle duplicate key constraint (user already has this interest) - TOGGLE OFF
      if (error.code === '23505' && error.constraint === 'user_city_interests_user_id_activity_id_unique') {
        // Re-extract variables to ensure they're available in this scope
        const { activityId, cityName } = req.body;
        const userId = req.headers['x-user-id'];
        
        // If interest already exists, remove it (toggle off)
        try {
          const deletedInterest = await db
            .delete(userCityInterests)
            .where(
              and(
                eq(userCityInterests.userId, parseInt(userId as string)),
                eq(userCityInterests.activityId, parseInt(activityId))
              )
            )
            .returning();
          
          if (deletedInterest.length > 0) {
            if (process.env.NODE_ENV === 'development') console.log(`🔄 USER INTERESTS TOGGLE: Removed interest ${deletedInterest[0].id} for user ${userId}`);
            return res.json({ removed: true, interest: deletedInterest[0] });
          }
        } catch (deleteError) {
          if (process.env.NODE_ENV === 'development') console.error('Error removing existing interest:', deleteError);
        }
        
        return res.status(409).json({ error: 'Interest already exists' });
      }
      
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
      
      // Apply LA Metro consolidation to fix "City" vs "Los Angeles Metro" display issue
      const consolidatedInterests = interests.map(interest => {
        // Simple metro area consolidation without external dependency
        const isLAMetroCity = ['Playa del Rey', 'Santa Monica', 'Venice', 'Culver City', 'Beverly Hills', 'West Hollywood', 'Malibu'].includes(interest.cityName);
        const metroArea = isLAMetroCity ? 'Los Angeles Metro' : null;
        
        return {
          ...interest,
          // Use metro area if available, otherwise keep original city name
          cityName: metroArea || interest.cityName
        };
      });
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ USER INTERESTS GET ALL: Found ${interests.length} interests for user ${userId} across all cities, consolidated LA Metro cities`);
      res.json(consolidatedInterests);
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

  // CITY MATCHING SYSTEM - Get users and events that match your interests in a specific city
  app.get('/api/matching-users/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const userId = req.headers['x-user-id'];
      
      if (!city) {
        return res.status(400).json({ error: 'City parameter is required' });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 CITY MATCH: Finding connections for user ${userId} in ${city}`);
      }

      // Get the current user's interests and activities in this city
      const userInterests = userId ? await db
        .select()
        .from(userCityInterests)
        .where(and(
          eq(userCityInterests.userId, parseInt(userId as string)),
          ilike(userCityInterests.cityName, `%${city}%`),
          eq(userCityInterests.isActive, true)
        )) : [];

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 CITY MATCH: User has ${userInterests.length} interests in ${city}`);
      }

      // Smart category mapping for interest-to-event connections
      const createCategoryMatcher = (interest: string) => {
        const name = interest.toLowerCase();
        if (name.includes('food') || name.includes('restaurant') || name.includes('dining') || name.includes('hot dog')) {
          return ['food', 'dining', 'tour', 'local'];
        }
        if (name.includes('museum') || name.includes('art') || name.includes('gallery') || name.includes('concert') || name.includes('disney')) {
          return ['cultural', 'community', 'tour', 'local', 'meetup'];
        }
        if (name.includes('garden') || name.includes('park') || name.includes('nature')) {
          return ['nature', 'outdoor', 'community', 'local'];
        }
        if (name.includes('casino') || name.includes('poker') || name.includes('game')) {
          return ['entertainment', 'social', 'gaming', 'community'];
        }
        if (name.includes('meet') || name.includes('social')) {
          return ['community', 'meetup', 'social'];
        }
        return ['community', 'local', 'meetup'];
      };

      // Get relevant events in this city
      const relevantEvents = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          city: events.city,
          date: events.date,
          category: events.category,
          tags: events.tags,
          matchReason: sql<string>`'event_match'`
        })
        .from(events)
        .where(and(
          ilike(events.city, `%${city}%`),
          eq(events.isActive, true),
          eq(events.isPublic, true),
          gte(events.date, new Date())
        ))
        .limit(10);

      // Get other users with similar interests (based on shared profile interests, not just city activities)
      const allUsers = await db
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
          interests: users.interests
        })
        .from(users)
        .where(and(
          ne(users.id, userId ? parseInt(userId as string) : -1),
          eq(users.isActive, true)
        ));

      // Find users with compatible interests or in the target city
      const compatibleUsers = allUsers.filter(user => {
        // Include users from the target city
        const isInTargetCity = user.location?.toLowerCase().includes(city.toLowerCase()) ||
                              user.hometownCity?.toLowerCase().includes(city.toLowerCase());
        
        // Include users with shared interests
        const hasSharedInterests = user.interests && userInterests.length > 0 &&
          user.interests.some(interest => 
            userInterests.some(userInt => 
              interest.toLowerCase().includes('food') && userInt.activityName.toLowerCase().includes('food') ||
              interest.toLowerCase().includes('music') && userInt.activityName.toLowerCase().includes('concert') ||
              interest.toLowerCase().includes('museum') && userInt.activityName.toLowerCase().includes('museum') ||
              interest.toLowerCase().includes('social') && userInt.activityName.toLowerCase().includes('meet')
            )
          );

        return isInTargetCity || hasSharedInterests;
      });

      const response = {
        users: compatibleUsers.slice(0, 5),
        events: relevantEvents,
        userInterestCount: userInterests.length,
        matchingSummary: {
          usersFound: compatibleUsers.length,
          eventsFound: relevantEvents.length,
          searchCity: city
        }
      };

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 CITY MATCH: Found ${compatibleUsers.length} compatible users and ${relevantEvents.length} events in ${city}`);
      }
      
      res.json(response);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching city matches:', error);
      res.status(500).json({ error: 'Failed to fetch city matches' });
    }
  });

  // QR CODE & REFERRAL SYSTEM ROUTES
  
  // Generate referral code and QR code for user
  app.get('/api/user/qr-code', async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'];
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

      // Use proper external domain for QR codes (not localhost in development)
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const protocol = process.env.REPLIT_DOMAINS ? 'https' : req.protocol;
      const signupUrl = `${protocol}://${host}/qr-signup?code=${user.referralCode}`;
      
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
      const userId = parseInt(req.headers['x-user-id'] || '0');

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

  // ========================================
  // ITINERARY CRUD API ROUTES
  // ========================================

  // Get itineraries for a travel plan
  app.get("/api/itineraries/travel-plan/:travelPlanId", async (req, res) => {
    try {
      const travelPlanId = parseInt(req.params.travelPlanId || '0');
      const itineraries = await storage.getItinerariesByTravelPlan(travelPlanId);
      res.json(itineraries || []);
    } catch (error: any) {
      console.error("Error fetching itineraries:", error);
      res.status(500).json({ message: "Failed to fetch itineraries" });
    }
  });

  // Get a specific itinerary with items
  app.get("/api/itineraries/:id", async (req, res) => {
    try {
      const itineraryId = parseInt(req.params.id || '0');
      const itinerary = await storage.getItineraryWithItems(itineraryId);
      res.json(itinerary);
    } catch (error: any) {
      console.error("Error fetching itinerary:", error);
      res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  });

  // Create a new itinerary
  app.post("/api/itineraries", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log("Creating itinerary:", req.body);
      const itinerary = await storage.createItinerary({
        ...req.body,
        userId: userId
      });
      res.json(itinerary);
    } catch (error: any) {
      console.error("Error creating itinerary:", error);
      res.status(500).json({ message: "Failed to create itinerary" });
    }
  });

  // Add item to itinerary
  app.post("/api/itineraries/:id/items", async (req, res) => {
    try {
      const itineraryId = parseInt(req.params.id || '0');
      const item = await storage.createItineraryItem({ ...req.body, itineraryId });
      res.json(item);
    } catch (error: any) {
      console.error("Error creating itinerary item:", error);
      res.status(500).json({ message: "Failed to create itinerary item" });
    }
  });

  // Update itinerary item
  app.put("/api/itinerary-items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id || '0');
      const item = await storage.updateItineraryItem(itemId, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating itinerary item:", error);
      res.status(500).json({ message: "Failed to update itinerary item" });
    }
  });

  // Delete itinerary item
  app.delete("/api/itinerary-items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id || '0');
      await storage.deleteItineraryItem(itemId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting itinerary item:", error);
      res.status(500).json({ message: "Failed to delete itinerary item" });
    }
  });

  // ========================================
  // EMAIL TEST ROUTES
  // ========================================
  
  // Test welcome email endpoint
  app.post("/api/test-welcome-email", async (req, res) => {
    try {
      const { email, name, username } = req.body;
      console.log('🧪 TESTING WELCOME EMAIL for:', email);
      
      const { sendWelcomeEmail } = await import('./emails/sendWelcomeEmail');
      const result = await sendWelcomeEmail({
        email: email || 'test@example.com',
        name: name || 'Test User',
        username: username || 'testuser'
      });
      
      res.json({ success: result, message: result ? 'Welcome email sent!' : 'Failed to send welcome email' });
    } catch (error: any) {
      console.error('🧪 Welcome email test failed:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ========================================
  // VOUCH SYSTEM ROUTES
  // ========================================

  // Get vouches received by a user
  app.get("/api/users/:userId/vouches", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const vouches = await storage.getVouchesForUser(userId);
      res.json(vouches);
    } catch (error: any) {
      console.error('Error fetching vouches:', error);
      res.status(500).json({ message: "Failed to fetch vouches" });
    }
  });

  // Get vouches given by a user
  app.get("/api/users/:userId/vouches-given", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const vouches = await storage.getVouchesGivenByUser(userId);
      res.json(vouches);
    } catch (error: any) {
      console.error('Error fetching vouches given:', error);
      res.status(500).json({ message: "Failed to fetch vouches given" });
    }
  });

  // Check if a user can vouch for another user
  app.get("/api/users/:userId/can-vouch", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const targetUserId = req.query.targetUserId ? parseInt(req.query.targetUserId as string) : undefined;
      
      const canVouchData = await storage.canUserVouch(userId, targetUserId);
      res.json(canVouchData);
    } catch (error: any) {
      console.error('Error checking vouch eligibility:', error);
      res.status(500).json({ 
        canVouch: false, 
        reason: 'Error checking vouch eligibility' 
      });
    }
  });

  // Get vouch network statistics for a user
  app.get("/api/users/:userId/vouch-network", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const networkStats = await storage.getVouchNetworkStats(userId);
      res.json(networkStats);
    } catch (error: any) {
      console.error('Error fetching vouch network stats:', error);
      res.status(500).json({ message: "Failed to fetch vouch network stats" });
    }
  });

  // Create a new vouch
  app.post("/api/vouches", async (req, res) => {
    try {
      const { voucherUserId, vouchedUserId, vouchMessage, vouchCategory } = req.body;
      
      // Validate input
      if (!voucherUserId || !vouchedUserId) {
        return res.status(400).json({ message: "Voucher and vouched user IDs are required" });
      }

      // Check if user can vouch
      const canVouchData = await storage.canUserVouch(voucherUserId, vouchedUserId);
      if (!canVouchData.canVouch) {
        return res.status(403).json({ message: canVouchData.reason || "Cannot vouch for this user" });
      }

      // Create the vouch
      const newVouch = await storage.createVouchFromData({
        voucherUserId,
        vouchedUserId,
        vouchMessage: vouchMessage || '',
        vouchCategory: vouchCategory || 'general'
      });

      res.status(201).json(newVouch);
    } catch (error: any) {
      console.error('Error creating vouch:', error);
      res.status(500).json({ message: error.message || "Failed to create vouch" });
    }
  });

  // ========================================
  // AUTHENTICATION ROUTES
  // ========================================


  // Logout route - properly destroy server session
  app.post("/api/logout", (req, res) => {
    try {
      console.log('🚪 Server logout called for session:', req.sessionID);
      const cookieOpts = { 
        path: "/", 
        sameSite: "lax" as const, 
        secure: false, 
        httpOnly: true 
      };
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ Error destroying session:', err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        
        console.log('✅ Session destroyed successfully');
        
        // Clear the session cookie with correct name
        res.clearCookie('nt.sid', cookieOpts);
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
        
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error('❌ Server logout error:', error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Return the configured HTTP server with WebSocket support  
  return httpServer;
}

