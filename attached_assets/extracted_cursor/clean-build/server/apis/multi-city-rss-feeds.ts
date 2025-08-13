// Multi-City RSS Feed Integration
// Provides authentic, curated events for major US cities (LA, NYC, Chicago, etc.)
// Supports Timeout Magazine, LAist, Gothamist, and Village Voice

import { load } from 'cheerio';

// Publication schedules for magazine websites
const PUBLICATION_SCHEDULES = {
  'timeout': {
    frequency: 'weekly',
    day: 'tuesday', // Timeout typically publishes new weekly guides on Tuesdays
    time: '09:00',
    timezone: 'EST'
  },
  'village-voice': {
    frequency: 'weekly', 
    day: 'wednesday', // Village Voice publishes weekly on Wednesdays
    time: '10:00',
    timezone: 'EST'
  },
  'gothamist': {
    frequency: 'daily', // Gothamist publishes daily but event roundups weekly
    day: 'thursday', // Event roundups typically Thursday
    time: '11:00',
    timezone: 'EST'
  },
  'laist': {
    frequency: 'weekly',
    day: 'friday', // LAist weekend guides typically Friday
    time: '12:00',
    timezone: 'PST'
  }
};

interface CuratedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  address: string;
  url: string;
  category: string;
  source: 'timeout' | 'laist' | 'gothamist' | 'village-voice';
  location: string;
  city: string;
}

// City-specific RSS feed configurations
const CITY_FEEDS = {
  'los angeles': {
    timeout: 'https://www.timeout.com/los-angeles/blog/feed.rss',
    local: 'https://laist.com/rss-feed',
    localName: 'LAist',
    schedules: ['timeout', 'laist']
  },
  'new york': {
    timeout: 'https://www.timeout.com/newyork/blog/feed.rss',
    local: 'https://gothamist.com/rss/index.xml',
    localName: 'Gothamist',
    alternative: 'https://www.villagevoice.com/feed/',
    alternativeName: 'Village Voice',
    schedules: ['timeout', 'gothamist', 'village-voice']
  },
  'chicago': {
    timeout: 'https://www.timeout.com/chicago/blog/feed.rss',
    local: null,
    localName: null,
    schedules: ['timeout']
  },
  'san francisco': {
    timeout: 'https://www.timeout.com/san-francisco/blog/feed.rss',
    local: null,
    localName: null,
    schedules: ['timeout']
  },
  'miami': {
    timeout: 'https://www.timeout.com/miami/blog/feed.rss',
    local: null,
    localName: null,
    schedules: ['timeout']
  },
  'boston': {
    timeout: 'https://www.timeout.com/boston/blog/feed.rss',
    local: null,
    localName: null,
    schedules: ['timeout']
  }
};

// Helper function to check if it's time to fetch from a specific publication
export function shouldFetchFromPublication(publicationKey: string): boolean {
  const schedule = PUBLICATION_SCHEDULES[publicationKey as keyof typeof PUBLICATION_SCHEDULES];
  if (!schedule) return true; // If no schedule defined, allow fetching
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  
  // Convert publication day to number
  const pubDayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  const pubDay = pubDayMap[schedule.day as keyof typeof pubDayMap];
  const pubHour = parseInt(schedule.time.split(':')[0]);
  
  if (schedule.frequency === 'weekly') {
    // For weekly publications, check if it's publication day and after publication time
    // Or if it's within 3 days after publication (to catch fresh content)
    const daysSincePublication = (dayOfWeek - pubDay + 7) % 7;
    
    if (dayOfWeek === pubDay && currentHour >= pubHour) {
      console.log(`📅 ${publicationKey.toUpperCase()}: Publication day, fetching fresh content`);
      return true;
    } else if (daysSincePublication <= 3) {
      console.log(`📅 ${publicationKey.toUpperCase()}: Within 3 days of publication, content likely fresh`);
      return true;
    } else {
      console.log(`📅 ${publicationKey.toUpperCase()}: Not publication window, skipping to save resources`);
      return false;
    }
  } else if (schedule.frequency === 'daily') {
    // For daily publications, check if it's after publication time today
    return currentHour >= pubHour;
  }
  
  return true; // Default to allow fetching
}

// Get next publication time for a given publication
export function getNextPublicationTime(publicationKey: string): Date | null {
  const schedule = PUBLICATION_SCHEDULES[publicationKey as keyof typeof PUBLICATION_SCHEDULES];
  if (!schedule) return null;
  
  const now = new Date();
  const pubDayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  const pubDay = pubDayMap[schedule.day as keyof typeof pubDayMap];
  const pubHour = parseInt(schedule.time.split(':')[0]);
  
  const nextPub = new Date();
  nextPub.setHours(pubHour, 0, 0, 0);
  
  // If it's weekly, find next occurrence of publication day
  if (schedule.frequency === 'weekly') {
    const daysUntilPub = (pubDay - now.getDay() + 7) % 7;
    if (daysUntilPub === 0 && now.getHours() >= pubHour) {
      // If it's publication day but already past publication time, schedule for next week
      nextPub.setDate(nextPub.getDate() + 7);
    } else {
      nextPub.setDate(nextPub.getDate() + daysUntilPub);
    }
  }
  
  return nextPub;
}

export async function fetchTimeoutEvents(city: string): Promise<CuratedEvent[]> {
  try {
    const normalizedCity = city.toLowerCase();
    const cityConfig = CITY_FEEDS[normalizedCity as keyof typeof CITY_FEEDS];
    
    if (!cityConfig) {
      console.log(`🕒 TIMEOUT: No RSS feed configured for ${city}`);
      return [];
    }

    // Check if it's the right time to fetch from Timeout
    if (!shouldFetchFromPublication('timeout')) {
      const nextPub = getNextPublicationTime('timeout');
      console.log(`🕒 TIMEOUT: Not publication window for ${city}. Next content expected: ${nextPub?.toLocaleDateString()}`);
      return [];
    }

    const timeoutResponse = await fetch(cityConfig.timeout);
    
    if (!timeoutResponse.ok) {
      console.error(`Failed to fetch Timeout ${city} RSS feed`);
      return [];
    }

    const timeoutXml = await timeoutResponse.text();
    const timeoutEvents = parseTimeoutRSS(timeoutXml, city);

    console.log(`🕒 TIMEOUT ${city.toUpperCase()}: Fetched ${timeoutEvents.length} curated events (publication window active)`);
    return timeoutEvents;

  } catch (error) {
    console.error(`Error fetching Timeout ${city} events:`, error);
    return [];
  }
}

export async function fetchLocalEvents(city: string): Promise<CuratedEvent[]> {
  try {
    const normalizedCity = city.toLowerCase();
    const cityConfig = CITY_FEEDS[normalizedCity as keyof typeof CITY_FEEDS];
    
    if (!cityConfig?.local) {
      console.log(`📰 LOCAL: No local RSS feed configured for ${city}`);
      return [];
    }

    // Check publication schedules for local sources
    const localSourceKey = cityConfig.localName?.toLowerCase().replace(/[^a-z]/g, '') as string;
    
    // Fetch primary local source
    let localEvents: CuratedEvent[] = [];
    if (shouldFetchFromPublication(localSourceKey)) {
      try {
        const localResponse = await fetch(cityConfig.local);
        if (localResponse.ok) {
          const localXml = await localResponse.text();
          localEvents = parseLocalRSS(localXml, city, cityConfig.localName);
          console.log(`📰 ${cityConfig.localName?.toUpperCase()}: Fetched ${localEvents.length} local event stories for ${city} (publication window active)`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${cityConfig.localName} for ${city}:`, error);
      }
    } else {
      const nextPub = getNextPublicationTime(localSourceKey);
      console.log(`📰 ${cityConfig.localName?.toUpperCase()}: Not publication window for ${city}. Next content expected: ${nextPub?.toLocaleDateString()}`);
    }

    // For NYC, also try Village Voice as alternative source
    if (normalizedCity === 'new york' && (cityConfig as any).alternative) {
      if (shouldFetchFromPublication('village-voice')) {
        try {
          const altResponse = await fetch((cityConfig as any).alternative);
          if (altResponse.ok) {
            const altXml = await altResponse.text();
            const altEvents = parseLocalRSS(altXml, city, (cityConfig as any).alternativeName);
            localEvents = [...localEvents, ...altEvents];
            console.log(`📰 ${(cityConfig as any).alternativeName?.toUpperCase()}: Fetched ${altEvents.length} alternative event stories for ${city} (publication window active)`);
          }
        } catch (error) {
          console.error(`Failed to fetch ${(cityConfig as any).alternativeName} for ${city}:`, error);
        }
      } else {
        const nextPub = getNextPublicationTime('village-voice');
        console.log(`📰 VILLAGE VOICE: Not publication window for ${city}. Next content expected: ${nextPub?.toLocaleDateString()}`);
      }
    }

    return localEvents;

  } catch (error) {
    console.error(`Error fetching local ${city} events:`, error);
    return [];
  }
}

export async function fetchCombinedCuratedEvents(city: string): Promise<CuratedEvent[]> {
  try {
    console.log(`🎭 CURATED EVENTS: Fetching combined events for ${city}`);
    
    // Map LA metro area cities to "Los Angeles" for RSS feeds
    let feedCity = city;
    const laMetroCities = [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 
      'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank', 
      'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey', 
      'Pomona', 'Playa del Rey', 'Redondo Beach', 'Culver City', 'Marina del Rey',
      'Hermosa Beach', 'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk',
      'Whittier', 'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra',
      'South Pasadena', 'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
      'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu',
      'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City', 'West LA',
      'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz', 'Silver Lake',
      'Echo Park', 'Downtown LA', 'Arts District', 'Little Tokyo', 'Chinatown',
      'Boyle Heights', 'Highland Park', 'Eagle Rock', 'Atwater Village',
      'Glassell Park', 'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima',
      'Sylmar', 'Granada Hills', 'Porter Ranch', 'Chatsworth', 'Canoga Park',
      'Woodland Hills', 'Tarzana', 'Panorama City', 'Mission Hills', 'Sepulveda',
      'Arleta', 'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway',
      'Watts', 'South LA', 'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills',
      'Ladera Heights'
    ];

    // NYC metro area cities to "New York"
    const nycMetroCities = [
      'New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
      'Jersey City', 'Newark', 'Hoboken', 'Yonkers', 'Mount Vernon', 'New Rochelle',
      'White Plains', 'Stamford', 'Norwalk', 'Bridgeport'
    ];

    // Check if city is in LA metro area  
    if (laMetroCities.includes(city) || laMetroCities.some(laCity => laCity.toLowerCase() === city.toLowerCase())) {
      feedCity = 'Los Angeles';
      console.log(`🌍 CURATED METRO: ${city} → Los Angeles for RSS feeds`);
    } 
    // Check if city is in NYC metro area
    else if (nycMetroCities.includes(city) || nycMetroCities.some(nycCity => nycCity.toLowerCase() === city.toLowerCase())) {
      feedCity = 'New York';
      console.log(`🌍 CURATED METRO: ${city} → New York for RSS feeds`);
    }
    
    const [timeoutEvents, localEvents] = await Promise.all([
      fetchTimeoutEvents(feedCity),
      fetchLocalEvents(feedCity)
    ]);

    const combinedEvents = [...timeoutEvents, ...localEvents];
    
    console.log(`🎭 CURATED EVENTS: Combined ${combinedEvents.length} events from Timeout + Local sources for ${city} (using ${feedCity} feeds)`);
    return combinedEvents;

  } catch (error) {
    console.error(`Error fetching combined curated events for ${city}:`, error);
    return [];
  }
}

function parseTimeoutRSS(xml: string, city: string): CuratedEvent[] {
  const events: CuratedEvent[] = [];
  
  try {
    const $ = load(xml, { xmlMode: true });
    
    $('item').each((index, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();
      const content = $(element).find('content\\:encoded').text();
      
      // Filter for event-related content
      const eventKeywords = [
        'event', 'concert', 'festival', 'show', 'exhibition', 'performance',
        'party', 'nightlife', 'theater', 'music', 'art', 'gallery', 'museum',
        'restaurant', 'bar', 'club', 'dance', 'comedy', 'food', 'drink',
        'opening', 'weekend', 'things to do', 'activities', 'entertainment'
      ];
      
      const isEventRelated = eventKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
      );

      if (isEventRelated && title && link) {
        // Try to extract real dates from content
        let eventDate: Date | null = null;
        
        // Look for specific date patterns in content and description
        const fullText = (content + ' ' + description).toLowerCase();
        const datePatterns = [
          // Month day patterns
          /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+2025)?/gi,
          // Month day, year patterns  
          /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+2025/gi,
          // Numeric date patterns
          /\d{1,2}\/\d{1,2}\/2025/gi,
          /\d{1,2}-\d{1,2}-2025/gi,
          // Through/until patterns
          /through\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
          /until\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi
        ];
        
        for (const pattern of datePatterns) {
          const matches = fullText.match(pattern);
          if (matches && matches.length > 0) {
            const dateStr = matches[0].replace(/st|nd|rd|th/gi, '');
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
              eventDate = parsedDate;
              break;
            }
          }
        }
        
        // If no future date found, skip this item since it's likely expired or news
        if (!eventDate) {
          return;
        }
        
        const event: CuratedEvent = {
          id: `timeout-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}-${Date.now().toString(36)}`,
          title: title.replace(/^\[.*?\]\s*/, ''), // Remove category prefixes
          description: description.replace(/<[^>]*>/g, '').substring(0, 300) + (description.length > 300 ? '...' : ''),
          date: eventDate.toISOString(),
          venue: city,
          address: `Various ${city} locations`,
          url: link,
          category: 'Cultural Event',
          source: 'timeout',
          location: `${city}, ${getStateAbbr(city)}`,
          city: city
        };
        events.push(event);
      }
    });

  } catch (error) {
    console.error(`Error parsing Timeout ${city} RSS:`, error);
  }

  return events.slice(0, 15); // Limit to 15 events
}

function parseLocalRSS(xml: string, city: string, sourceName?: string): CuratedEvent[] {
  const events: CuratedEvent[] = [];
  
  try {
    const $ = load(xml, { xmlMode: true });
    
    $('item').each((index, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();
      
      // Filter for event-related content
      const eventKeywords = [
        'event', 'festival', 'concert', 'show', 'opening', 'celebration', 
        'market', 'fair', 'exhibit', 'performance', 'theater', 'music', 
        'art', 'food', 'party', 'nightlife', 'entertainment'
      ];
      
      const isEventRelated = eventKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
      );

      if (isEventRelated && title && link) {
        const sourceKey = sourceName?.toLowerCase().replace(/[^a-z]/g, '') || 'local';
        
        // Try to extract real dates from content
        let eventDate: Date | null = null;
        const fullText = (description).toLowerCase();
        
        // Look for date patterns in the content
        const datePatterns = [
          /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+2025)?/gi,
          /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+2025/gi,
          /\d{1,2}\/\d{1,2}\/2025/gi,
          /\d{1,2}-\d{1,2}-2025/gi
        ];
        
        for (const pattern of datePatterns) {
          const matches = fullText.match(pattern);
          if (matches && matches.length > 0) {
            const dateStr = matches[0].replace(/st|nd|rd|th/gi, '');
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
              eventDate = parsedDate;
              break;
            }
          }
        }
        
        // Skip if no future date found
        if (!eventDate) {
          return;
        }
        
        const event: CuratedEvent = {
          id: `${sourceKey}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}-${Date.now().toString(36)}`,
          title: title,
          description: description.replace(/<[^>]*>/g, '').substring(0, 300) + (description.length > 300 ? '...' : ''),
          date: eventDate.toISOString(),
          venue: `${city} Area`,
          address: `Various ${city} locations`,
          url: link,
          category: 'Community & Culture',
          source: sourceKey === 'laist' ? 'laist' : sourceKey === 'gothamist' ? 'gothamist' : 'village-voice',
          location: `${city}, ${getStateAbbr(city)}`,
          city: city
        };
        events.push(event);
      }
    });

  } catch (error) {
    console.error(`Error parsing ${sourceName} ${city} RSS:`, error);
  }

  return events.slice(0, 10); // Limit to 10 events
}

function getStateAbbr(city: string): string {
  const stateMap: { [key: string]: string } = {
    'Los Angeles': 'CA',
    'New York': 'NY',
    'Chicago': 'IL',
    'San Francisco': 'CA',
    'Miami': 'FL',
    'Boston': 'MA'
  };
  return stateMap[city] || 'US';
}

// Export for backward compatibility with existing routes
export const fetchTimeoutLAEvents = () => fetchTimeoutEvents('Los Angeles');
export const fetchLAistEvents = () => fetchLocalEvents('Los Angeles');