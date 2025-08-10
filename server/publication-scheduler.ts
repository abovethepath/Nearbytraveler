// Publication Scheduler for Magazine RSS Feeds
// Manages when to fetch events from publications based on their publishing schedules

import { shouldFetchFromPublication, getNextPublicationTime } from './apis/multi-city-rss-feeds';

interface PublicationStatus {
  name: string;
  lastFetch: Date | null;
  nextPublicationTime: Date | null;
  isActiveWindow: boolean;
  city: string;
}

// Cache to track when we last fetched from each publication
const publicationCache = new Map<string, Date>();

export function getPublicationStatus(city: string): PublicationStatus[] {
  const cityFeeds = {
    'los angeles': ['timeout', 'laist'],
    'new york': ['timeout', 'gothamist', 'village-voice'],
    'chicago': ['timeout'],
    'san francisco': ['timeout'],
    'miami': ['timeout'],
    'boston': ['timeout']
  };

  const normalizedCity = city.toLowerCase();
  const publications = cityFeeds[normalizedCity as keyof typeof cityFeeds] || [];

  return publications.map(pub => ({
    name: pub,
    lastFetch: publicationCache.get(`${pub}-${normalizedCity}`) || null,
    nextPublicationTime: getNextPublicationTime(pub),
    isActiveWindow: shouldFetchFromPublication(pub),
    city: city
  }));
}

export function markPublicationFetched(publication: string, city: string): void {
  const key = `${publication}-${city.toLowerCase()}`;
  publicationCache.set(key, new Date());
}

export function getNextPublicationsToFetch(): { publication: string; city: string; nextTime: Date }[] {
  const upcomingPublications: { publication: string; city: string; nextTime: Date }[] = [];
  
  const cities = ['los angeles', 'new york', 'chicago', 'san francisco', 'miami', 'boston'];
  
  for (const city of cities) {
    const statuses = getPublicationStatus(city);
    for (const status of statuses) {
      if (status.nextPublicationTime) {
        upcomingPublications.push({
          publication: status.name,
          city: city,
          nextTime: status.nextPublicationTime
        });
      }
    }
  }
  
  // Sort by next publication time
  return upcomingPublications.sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime());
}

// Function to display publication schedule to users
export function getPublicationScheduleInfo(): string {
  const schedules = [
    "📅 **Magazine Publication Schedule:**",
    "",
    "🕒 **Timeout Magazine** - Tuesdays at 9:00 AM EST",
    "   • Weekly city guides for LA, NYC, Chicago, SF, Miami, Boston",
    "   • Fresh event listings and weekend recommendations",
    "",
    "📰 **Village Voice** - Wednesdays at 10:00 AM EST", 
    "   • NYC nightlife, concerts, and cultural events",
    "   • Weekly arts and entertainment coverage",
    "",
    "🗞️ **Gothamist** - Thursdays at 11:00 AM EST",
    "   • NYC daily news with weekly event roundups",
    "   • Local neighborhood events and activities",
    "",
    "🌴 **LAist** - Fridays at 12:00 PM PST",
    "   • LA weekend guides and local events",
    "   • Arts, food, and entertainment listings",
    "",
    "ℹ️ Events are automatically fetched during publication windows and up to 3 days after to catch fresh content."
  ].join('\n');
  
  return schedules;
}