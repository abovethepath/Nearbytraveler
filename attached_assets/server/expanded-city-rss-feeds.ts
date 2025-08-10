const axios = require('axios');
const cheerio = require('cheerio');
// Database will be imported when needed

interface RSSFeed {
  id: string;
  city: string;
  publication: string;
  feedUrl: string;
  category: string;
  description: string;
  publishDays?: string[];  // Days of week when they typically publish
  publishTime?: string;     // Time they typically publish (EST)
  isActive: boolean;
}

// Comprehensive RSS feeds for all major cities
export const CITY_RSS_FEEDS: RSSFeed[] = [
  // LAS VEGAS
  {
    id: 'las-vegas-weekly',
    city: 'Las Vegas',
    publication: 'Las Vegas Weekly',
    feedUrl: 'https://lasvegasweekly.com/rss/',
    category: 'entertainment',
    description: 'Arts, entertainment, attractions, dining, nightlife',
    publishDays: ['Wednesday', 'Thursday'],
    publishTime: '10:00',
    isActive: true
  },
  {
    id: 'las-vegas-magazine-events',
    city: 'Las Vegas',
    publication: 'LV Magazine',
    feedUrl: 'https://www.lvmagazine.com/rss/category/events',
    category: 'events',
    description: 'Local events and activities',
    publishDays: ['Tuesday', 'Friday'],
    publishTime: '12:00',
    isActive: true
  },
  {
    id: 'las-vegas-magazine-calendar',
    city: 'Las Vegas',
    publication: 'LV Magazine',
    feedUrl: 'https://www.lvmagazine.com/rss/category/calendar',
    category: 'calendar',
    description: 'Event calendar and schedules',
    publishDays: ['Monday'],
    publishTime: '09:00',
    isActive: true
  },
  {
    id: 'las-vegas-review-journal',
    city: 'Las Vegas',
    publication: 'Las Vegas Review-Journal',
    feedUrl: 'https://reviewjournal.com/feed/',
    category: 'news',
    description: 'Local news with entertainment coverage',
    publishDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    publishTime: '06:00',
    isActive: true
  },

  // CHICAGO
  {
    id: 'chicago-tribune-entertainment',
    city: 'Chicago',
    publication: 'Chicago Tribune',
    feedUrl: 'https://www.chicagotribune.com/entertainment/rss2.0.xml',
    category: 'entertainment',
    description: 'Arts, entertainment, movies, music, theater',
    publishDays: ['Thursday', 'Friday'],
    publishTime: '11:00',
    isActive: true
  },
  {
    id: 'chicago-reader',
    city: 'Chicago',
    publication: 'Chicago Reader',
    feedUrl: 'https://chicagoreader.com/feed/',
    category: 'culture',
    description: 'Alternative weekly arts and culture',
    publishDays: ['Wednesday'],
    publishTime: '12:00',
    isActive: true
  },
  {
    id: 'chicago-sun-times',
    city: 'Chicago',
    publication: 'Chicago Sun-Times',
    feedUrl: 'https://chicago.suntimes.com/feed/',
    category: 'news',
    description: 'Local news and entertainment',
    publishDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    publishTime: '07:00',
    isActive: true
  },

  // NEW ORLEANS
  {
    id: 'nola-com-entertainment',
    city: 'New Orleans',
    publication: 'NOLA.com',
    feedUrl: 'https://www.nola.com/entertainment_life/?f=rss',
    category: 'entertainment',
    description: 'Entertainment and local events',
    publishDays: ['Thursday', 'Friday'],
    publishTime: '10:00',
    isActive: true
  },
  {
    id: 'wwno-events',
    city: 'New Orleans',
    publication: 'WWNO Public Radio',
    feedUrl: 'https://www.wwno.org/news?f=rss',
    category: 'culture',
    description: 'NPR news, culture, and local events',
    publishDays: ['Monday', 'Wednesday', 'Friday'],
    publishTime: '08:00',
    isActive: true
  },
  {
    id: 'nola-gambit',
    city: 'New Orleans',
    publication: 'Gambit Weekly',
    feedUrl: 'https://www.bestofneworleans.com/news/rss.xml',
    category: 'entertainment',
    description: 'Alternative weekly entertainment guide',
    publishDays: ['Tuesday'],
    publishTime: '13:00',
    isActive: true
  },

  // MIAMI
  {
    id: 'miami-new-times',
    city: 'Miami',
    publication: 'Miami New Times',
    feedUrl: 'https://www.miaminewtimes.com/eventseeker/rss',
    category: 'entertainment',
    description: 'Alternative weekly events and culture',
    publishDays: ['Wednesday'],
    publishTime: '11:00',
    isActive: true
  },
  {
    id: 'miami-herald-entertainment',
    city: 'Miami',
    publication: 'Miami Herald',
    feedUrl: 'https://www.miamiherald.com/entertainment/?f=rss',
    category: 'entertainment',
    description: 'Entertainment news and events',
    publishDays: ['Thursday', 'Friday'],
    publishTime: '09:00',
    isActive: true
  },
  {
    id: 'ocean-drive-magazine',
    city: 'Miami',
    publication: 'Ocean Drive Magazine',
    feedUrl: 'https://oceandrive.com/feed/',
    category: 'lifestyle',
    description: 'Luxury lifestyle and events',
    publishDays: ['Friday'],
    publishTime: '14:00',
    isActive: true
  },

  // BOSTON
  {
    id: 'boston-com',
    city: 'Boston',
    publication: 'Boston.com',
    feedUrl: 'https://www.boston.com/entertainment/?f=rss',
    category: 'entertainment',
    description: 'Local entertainment and events',
    publishDays: ['Thursday', 'Friday'],
    publishTime: '10:00',
    isActive: true
  },
  {
    id: 'dig-boston',
    city: 'Boston',
    publication: 'DigBoston',
    feedUrl: 'https://digboston.com/feed/',
    category: 'culture',
    description: 'Alternative weekly arts and events',
    publishDays: ['Wednesday'],
    publishTime: '12:00',
    isActive: true
  },
  {
    id: 'boston-herald',
    city: 'Boston',
    publication: 'Boston Herald',
    feedUrl: 'https://www.bostonherald.com/entertainment/?f=rss',
    category: 'entertainment',
    description: 'Entertainment news and events',
    publishDays: ['Thursday'],
    publishTime: '08:00',
    isActive: true
  },

  // SAN FRANCISCO
  {
    id: 'sfist',
    city: 'San Francisco',
    publication: 'SFist',
    feedUrl: 'https://sfist.com/rss/',
    category: 'culture',
    description: 'Local culture, events, and news',
    publishDays: ['Monday', 'Wednesday', 'Friday'],
    publishTime: '11:00',
    isActive: true
  },
  {
    id: 'sf-funcheap',
    city: 'San Francisco',
    publication: 'Funcheap SF',
    feedUrl: 'https://sf.funcheap.com/feed/',
    category: 'events',
    description: 'Cheap and free local events',
    publishDays: ['Monday'],
    publishTime: '09:00',
    isActive: true
  },
  {
    id: 'sf-7x7-magazine',
    city: 'San Francisco',
    publication: '7x7 Magazine',
    feedUrl: 'https://7x7.com/feeds/feed.rss',
    category: 'lifestyle',
    description: 'Local insider stories and events',
    publishDays: ['Tuesday'],
    publishTime: '13:00',
    isActive: true
  },
  {
    id: 'sf-48hills',
    city: 'San Francisco',
    publication: '48 Hills',
    feedUrl: 'https://48hills.org/feed/',
    category: 'culture',
    description: 'Independent community news and culture',
    publishDays: ['Monday', 'Wednesday', 'Friday'],
    publishTime: '10:00',
    isActive: true
  }
];

export async function fetchRSSFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await axios.get(feedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const items: any[] = [];

    $('item').each((i, elem) => {
      const title = $(elem).find('title').text().trim();
      const description = $(elem).find('description').text().trim();
      const link = $(elem).find('link').text().trim();
      const pubDate = $(elem).find('pubDate').text().trim();
      const category = $(elem).find('category').text().trim();

      if (title && link) {
        items.push({
          title,
          description: cleanHTMLContent(description),
          url: link,
          pubDate: new Date(pubDate || Date.now()),
          category: category || 'general'
        });
      }
    });

    return items;
  } catch (error) {
    console.error(`RSS Fetch Error for ${feedUrl}:`, error.message);
    return [];
  }
}

function cleanHTMLContent(content: string): string {
  if (!content) return '';
  
  // Remove HTML tags and decode entities
  const $ = cheerio.load(content);
  let text = $.text().trim();
  
  // Clean up common issues
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\[…\]/g, '');
  text = text.substring(0, 500); // Limit length
  
  return text;
}

export async function processRSSFeedForEvents(feed: RSSFeed): Promise<number> {
  console.log(`📰 Processing RSS feed: ${feed.publication} (${feed.city})`);
  
  try {
    const items = await fetchRSSFeed(feed.feedUrl);
    let eventsCreated = 0;

    for (const item of items) {
      // Check if item appears to be an event
      if (isEventContent(item.title, item.description)) {
        const eventData = await extractEventData(item, feed);
        
        if (eventData) {
          // For now, just count potential events (database insert will be added when integrating)
          eventsCreated++;
          console.log(`✅ Would create event: ${eventData.title}`);
        }
      }
    }

    console.log(`📰 ${feed.publication}: Would create ${eventsCreated} events from ${items.length} items`);
    return eventsCreated;
  } catch (error) {
    console.error(`❌ Error processing RSS feed ${feed.publication}:`, error.message);
    return 0;
  }
}

function isEventContent(title: string, description: string): boolean {
  const eventKeywords = [
    'concert', 'show', 'festival', 'party', 'event', 'performance',
    'exhibition', 'opening', 'night', 'weekend', 'saturday', 'sunday',
    'tickets', 'live', 'music', 'dance', 'theater', 'comedy',
    'restaurant', 'bar', 'club', 'venue', 'gallery', 'museum',
    'market', 'fair', 'celebration', 'happening', 'experience'
  ];

  const content = (title + ' ' + description).toLowerCase();
  return eventKeywords.some(keyword => content.includes(keyword));
}

async function extractEventData(item: any, feed: RSSFeed) {
  try {
    // Extract date from content or use publication date
    const eventDate = extractDateFromContent(item.description) || item.pubDate || new Date();
    
    // Skip very old events
    const now = new Date();
    const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < -7) { // Skip events older than 1 week
      return null;
    }

    return {
      title: item.title.substring(0, 200),
      description: item.description.substring(0, 1000),
      date: eventDate,
      location: extractLocationFromContent(item.description) || feed.city,
      category: categorizeEvent(item.title, item.description),
      source: 'rss',
      url: item.url,
      tags: extractTagsFromContent(item.title + ' ' + item.description),
      createdAt: new Date(),
      organizerId: 1 // System user
    };
  } catch (error) {
    console.error('Error extracting event data:', error);
    return null;
  }
}

function extractDateFromContent(content: string): Date | null {
  if (!content) return null;

  // Common date patterns
  const datePatterns = [
    /(\w+day),?\s+(\w+)\s+(\d{1,2})/i,  // "Friday, January 15"
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,   // "January 15, 2025"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,     // "1/15/2025"
    /(\d{1,2})-(\d{1,2})-(\d{4})/       // "1-15-2025"
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (error) {
        continue;
      }
    }
  }

  return null;
}

function extractLocationFromContent(content: string): string | null {
  if (!content) return null;

  // Look for venue patterns
  const venuePatterns = [
    /at\s+(.+?)(?:\s|$|,|\.|!|\?)/i,
    /venue:\s*(.+?)(?:\s|$|,|\.|!|\?)/i,
    /location:\s*(.+?)(?:\s|$|,|\.|!|\?)/i
  ];

  for (const pattern of venuePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 100);
    }
  }

  return null;
}

function categorizeEvent(title: string, description: string): string {
  const content = (title + ' ' + description).toLowerCase();

  if (content.includes('music') || content.includes('concert') || content.includes('band')) {
    return 'music';
  } else if (content.includes('food') || content.includes('restaurant') || content.includes('dining')) {
    return 'food';
  } else if (content.includes('art') || content.includes('gallery') || content.includes('museum')) {
    return 'art';
  } else if (content.includes('comedy') || content.includes('laugh')) {
    return 'comedy';
  } else if (content.includes('theater') || content.includes('performance')) {
    return 'theater';
  } else if (content.includes('night') || content.includes('club') || content.includes('party')) {
    return 'nightlife';
  } else if (content.includes('festival') || content.includes('fair')) {
    return 'festival';
  } else {
    return 'general';
  }
}

function extractTagsFromContent(content: string): string[] {
  if (!content) return [];

  const keywords = [
    'music', 'food', 'art', 'comedy', 'theater', 'nightlife', 'festival',
    'concert', 'show', 'performance', 'exhibition', 'party', 'live',
    'weekend', 'free', 'outdoor', 'indoor', 'family', 'adults'
  ];

  const foundTags: string[] = [];
  const lowerContent = content.toLowerCase();

  keywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      foundTags.push(keyword);
    }
  });

  return foundTags.slice(0, 5); // Limit to 5 tags
}

export function getCityFeeds(cityName: string): RSSFeed[] {
  return CITY_RSS_FEEDS.filter(feed => 
    feed.city.toLowerCase() === cityName.toLowerCase() && feed.isActive
  );
}

export function getAllActiveFeeds(): RSSFeed[] {
  return CITY_RSS_FEEDS.filter(feed => feed.isActive);
}

// Test function to validate feeds
export async function testAllFeeds(): Promise<void> {
  console.log('🧪 Testing all RSS feeds...');
  
  for (const feed of CITY_RSS_FEEDS.slice(0, 5)) { // Test first 5 feeds
    try {
      console.log(`\n📰 Testing: ${feed.publication} (${feed.city})`);
      const items = await fetchRSSFeed(feed.feedUrl);
      console.log(`✅ Success: Found ${items.length} items`);
      
      if (items.length > 0) {
        console.log(`   First item: ${items[0].title}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}