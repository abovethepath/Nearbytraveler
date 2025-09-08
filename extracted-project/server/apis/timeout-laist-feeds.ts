// Timeout, LAist, and Village Voice RSS Feed Integration
// Provides authentic, curated events for major US cities (LA, NYC, etc.)

import { load } from 'cheerio';

interface CuratedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  address: string;
  url: string;
  category: string;
  source: 'timeout' | 'laist' | 'village-voice';
  location: string;
  city: string;
}

// City-specific RSS feed configurations
const CITY_FEEDS = {
  'los angeles': {
    timeout: 'https://www.timeout.com/los-angeles/blog/feed.rss',
    local: 'https://laist.com/rss-feed'
  },
  'new york': {
    timeout: 'https://www.timeout.com/newyork/blog/feed.rss',
    local: 'https://gothamist.com/rss/index.xml'
  },
  'chicago': {
    timeout: 'https://www.timeout.com/chicago/blog/feed.rss',
    local: null
  },
  'san francisco': {
    timeout: 'https://www.timeout.com/san-francisco/blog/feed.rss',
    local: null
  },
  'miami': {
    timeout: 'https://www.timeout.com/miami/blog/feed.rss',
    local: null
  }
};

export async function fetchTimeoutEvents(city: string): Promise<CuratedEvent[]> {
  try {
    const normalizedCity = city.toLowerCase();
    const cityConfig = CITY_FEEDS[normalizedCity as keyof typeof CITY_FEEDS];
    
    if (!cityConfig) {
      console.log(`🕒 TIMEOUT: No RSS feed configured for ${city}`);
      return [];
    }

    const timeoutResponse = await fetch(cityConfig.timeout);
    
    if (!timeoutResponse.ok) {
      console.error(`Failed to fetch Timeout ${city} RSS feed`);
      return [];
    }

    const timeoutXml = await timeoutResponse.text();
    const timeoutEvents = parseTimeoutRSS(timeoutXml, city);

    console.log(`🕒 TIMEOUT ${city.toUpperCase()}: Fetched ${timeoutEvents.length} curated events`);
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

    const localResponse = await fetch(cityConfig.local);
    
    if (!localResponse.ok) {
      console.error(`Failed to fetch local ${city} RSS feed`);
      return [];
    }

    const localXml = await localResponse.text();
    const localEvents = parseLocalRSS(localXml, city);

    console.log(`📰 LOCAL ${city.toUpperCase()}: Fetched ${localEvents.length} local event stories`);
    return localEvents;

  } catch (error) {
    console.error(`Error fetching local ${city} events:`, error);
    return [];
  }
}

function parseTimeoutRSS(xml: string, city: string): CuratedEvent[] {
  const events: TimeoutLAEvent[] = [];
  
  try {
    const $ = load(xml, { xmlMode: true });
    
    $('item').each((index, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();
      
      // Filter for event-related content
      const eventKeywords = ['event', 'concert', 'festival', 'show', 'exhibition', 'performance', 'theater', 'music', 'art', 'food', 'market', 'party', 'celebration'];
      const isEventRelated = eventKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
      );

      if (isEventRelated && title && link) {
        const event: TimeoutLAEvent = {
          id: `timeout-${link.split('/').pop() || index}`,
          title: title.replace(/^\[.*?\]\s*/, ''), // Remove category prefixes
          description: description.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
          date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          venue: 'Los Angeles',
          address: 'Various LA locations',
          url: link,
          category: 'Arts & Culture',
          source: 'timeout-la',
          location: 'Los Angeles'
        };
        events.push(event);
      }
    });

  } catch (error) {
    console.error('Error parsing Timeout LA RSS:', error);
  }

  return events.slice(0, 15); // Limit to 15 events
}

function parseLAistRSS(xml: string): TimeoutLAEvent[] {
  const events: TimeoutLAEvent[] = [];
  
  try {
    const $ = load(xml, { xmlMode: true });
    
    $('item').each((index, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();
      
      // Filter for event-related content
      const eventKeywords = ['event', 'festival', 'concert', 'show', 'opening', 'celebration', 'market', 'fair', 'exhibit', 'performance', 'theater', 'music', 'art', 'food', 'party'];
      const isEventRelated = eventKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
      );

      if (isEventRelated && title && link) {
        const event: TimeoutLAEvent = {
          id: `laist-${link.split('/').pop() || index}`,
          title: title,
          description: description.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
          date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          venue: 'Los Angeles Area',
          address: 'Various LA locations',
          url: link,
          category: 'Community & Culture',
          source: 'laist',
          location: 'Los Angeles'
        };
        events.push(event);
      }
    });

  } catch (error) {
    console.error('Error parsing LAist RSS:', error);
  }

  return events.slice(0, 10); // Limit to 10 events
}

export async function getCombinedTimeoutLAistEvents(): Promise<TimeoutLAEvent[]> {
  try {
    const [timeoutEvents, laistEvents] = await Promise.all([
      fetchTimeoutLAEvents(),
      fetchLAistEvents()
    ]);

    const combinedEvents = [...timeoutEvents, ...laistEvents];
    
    // Sort by date (newest first)
    combinedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`🎭 CURATED EVENTS: Combined ${combinedEvents.length} events from Timeout LA + LAist`);
    return combinedEvents;

  } catch (error) {
    console.error('Error combining Timeout LA and LAist events:', error);
    return [];
  }
}