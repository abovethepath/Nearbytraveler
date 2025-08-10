// Expanded Publication Scheduler for ALL City RSS Feeds
// Manages when to fetch events from publications across multiple cities

import { CITY_RSS_FEEDS, processRSSFeedForEvents, getCityFeeds } from './expanded-city-rss-feeds';

interface ExpandedSchedule {
  id: string;
  publication: string;
  city: string;
  category: string;
  nextRun: Date;
  interval: number;
  isActive: boolean;
  lastFetch?: Date;
}

// Global scheduler state
const schedulerTasks = new Map<string, NodeJS.Timeout>();
const lastFetchTimes = new Map<string, Date>();

export function startExpandedScheduler(): void {
  console.log('🚀 Starting Expanded Publication Scheduler...');
  
  // Stop any existing tasks
  stopExpandedScheduler();
  
  // Create schedules for all active RSS feeds
  for (const feed of CITY_RSS_FEEDS.filter(f => f.isActive)) {
    scheduleRSSFeed(feed);
  }
  
  console.log(`📅 Scheduled ${schedulerTasks.size} RSS feed monitoring tasks`);
}

function scheduleRSSFeed(feed: any): void {
  const scheduleId = `${feed.id}-${feed.city.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Calculate next run time based on publication schedule
  const nextRun = calculateNextRun(feed);
  const interval = calculateInterval(feed);
  
  console.log(`📰 Scheduling ${feed.publication} (${feed.city}) - Next: ${nextRun.toISOString()}`);
  
  // Set initial timeout
  const timeUntilRun = nextRun.getTime() - Date.now();
  
  const timeoutId = setTimeout(async () => {
    await executeRSSFetch(feed);
    
    // Set up recurring interval
    const intervalId = setInterval(async () => {
      if (shouldFetchNow(feed)) {
        await executeRSSFetch(feed);
      }
    }, interval);
    
    schedulerTasks.set(scheduleId, intervalId);
  }, Math.max(0, timeUntilRun));
  
  schedulerTasks.set(scheduleId, timeoutId);
}

function calculateNextRun(feed: any): Date {
  const now = new Date();
  
  if (!feed.publishDays || !feed.publishTime) {
    // Default: next hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  
  // Parse publish time (e.g., "10:00" -> 10:00 EST)
  const [hours, minutes = 0] = feed.publishTime.split(':').map(Number);
  
  // Find next publish day
  const today = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let daysUntilNext = 7; // Default to next week
  
  for (const publishDay of feed.publishDays) {
    const publishDayIndex = dayNames.indexOf(publishDay);
    if (publishDayIndex !== -1) {
      let daysAhead = publishDayIndex - today;
      if (daysAhead < 0) daysAhead += 7;
      if (daysAhead === 0) {
        // Today - check if time has passed
        const publishTimeToday = new Date(now);
        publishTimeToday.setHours(hours, minutes, 0, 0);
        if (publishTimeToday > now) {
          daysAhead = 0; // Later today
        } else {
          daysAhead = 7; // Next week
        }
      }
      daysUntilNext = Math.min(daysUntilNext, daysAhead);
    }
  }
  
  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + daysUntilNext);
  nextRun.setHours(hours, minutes, 0, 0);
  
  return nextRun;
}

function calculateInterval(feed: any): number {
  if (!feed.publishDays) {
    return 24 * 60 * 60 * 1000; // Daily
  }
  
  // Weekly interval for most publications
  return 7 * 24 * 60 * 60 * 1000;
}

function shouldFetchNow(feed: any): boolean {
  const now = new Date();
  const lastFetch = lastFetchTimes.get(feed.id);
  
  // Don't fetch if we fetched recently (within 6 hours)
  if (lastFetch && (now.getTime() - lastFetch.getTime()) < 6 * 60 * 60 * 1000) {
    return false;
  }
  
  if (!feed.publishDays || !feed.publishTime) {
    return true; // Always fetch for feeds without schedule
  }
  
  // Check if it's a publish day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[now.getDay()];
  
  if (!feed.publishDays.includes(today)) {
    return false; // Not a publish day
  }
  
  // Check if it's within the active window (publish time + 3 days)
  const [hours, minutes = 0] = feed.publishTime.split(':').map(Number);
  const publishTime = new Date(now);
  publishTime.setHours(hours, minutes, 0, 0);
  
  const activeWindow = 3 * 24 * 60 * 60 * 1000; // 3 days
  const timeSincePublish = now.getTime() - publishTime.getTime();
  
  return timeSincePublish >= 0 && timeSincePublish <= activeWindow;
}

async function executeRSSFetch(feed: any): Promise<void> {
  try {
    console.log(`📰 Fetching RSS: ${feed.publication} (${feed.city})`);
    
    const eventsCreated = await processRSSFeedForEvents(feed);
    lastFetchTimes.set(feed.id, new Date());
    
    console.log(`✅ RSS Fetch Complete: ${feed.publication} - ${eventsCreated} events processed`);
  } catch (error) {
    console.error(`❌ RSS Fetch Error: ${feed.publication} - ${error.message}`);
  }
}

export function stopExpandedScheduler(): void {
  console.log('🛑 Stopping Expanded Publication Scheduler...');
  
  for (const [id, timeoutId] of schedulerTasks) {
    clearTimeout(timeoutId);
    clearInterval(timeoutId);
  }
  
  schedulerTasks.clear();
  console.log('✅ All RSS scheduler tasks stopped');
}

export function getExpandedSchedulerStatus(): any {
  const activeTasks = Array.from(schedulerTasks.keys());
  
  const upcomingFetches = CITY_RSS_FEEDS
    .filter(f => f.isActive)
    .map(feed => ({
      id: `${feed.id}-${feed.city.toLowerCase().replace(/\s+/g, '-')}`,
      publication: feed.publication,
      city: feed.city,
      category: feed.category,
      nextRun: calculateNextRun(feed),
      isActive: schedulerTasks.has(`${feed.id}-${feed.city.toLowerCase().replace(/\s+/g, '-')}`),
      lastFetch: lastFetchTimes.get(feed.id)
    }))
    .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  
  return {
    isRunning: schedulerTasks.size > 0,
    activeTasks: schedulerTasks.size,
    totalFeeds: CITY_RSS_FEEDS.filter(f => f.isActive).length,
    upcomingFetches,
    citiesMonitored: [...new Set(CITY_RSS_FEEDS.filter(f => f.isActive).map(f => f.city))],
    lastCheck: new Date().toISOString()
  };
}

// Manual fetch function for testing
export async function manualFetchCity(cityName: string): Promise<any> {
  console.log(`🧪 Manual fetch requested for: ${cityName}`);
  
  const cityFeeds = getCityFeeds(cityName);
  if (cityFeeds.length === 0) {
    throw new Error(`No RSS feeds found for city: ${cityName}`);
  }
  
  const results = [];
  
  for (const feed of cityFeeds) {
    try {
      const eventsCreated = await processRSSFeedForEvents(feed);
      results.push({
        publication: feed.publication,
        category: feed.category,
        eventsCreated,
        status: 'success'
      });
    } catch (error) {
      results.push({
        publication: feed.publication,
        category: feed.category,
        eventsCreated: 0,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return {
    city: cityName,
    feedsProcessed: cityFeeds.length,
    results,
    totalEvents: results.reduce((sum, r) => sum + r.eventsCreated, 0)
  };
}

// Test function to fetch from all cities
export async function testAllCityFeeds(): Promise<void> {
  console.log('🧪 Testing RSS feeds for all cities...');
  
  const cities = [...new Set(CITY_RSS_FEEDS.filter(f => f.isActive).map(f => f.city))];
  
  for (const city of cities.slice(0, 3)) { // Test first 3 cities
    try {
      console.log(`\n🏙️ Testing ${city}...`);
      const result = await manualFetchCity(city);
      console.log(`✅ ${city}: ${result.totalEvents} total events from ${result.feedsProcessed} feeds`);
    } catch (error) {
      console.log(`❌ ${city}: ${error.message}`);
    }
  }
}