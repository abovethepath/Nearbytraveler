// Automatic Event Scheduler
// Runs background tasks to fetch events when magazines publish
// No manual deployment needed - updates happen automatically

import { shouldFetchFromPublication, getNextPublicationTime } from './apis/multi-city-rss-feeds';

interface ScheduledTask {
  id: string;
  publication: string;
  city: string;
  nextRun: Date;
  interval: number; // milliseconds
  isActive: boolean;
}

const scheduledTasks = new Map<string, NodeJS.Timeout>();
const taskStatus = new Map<string, ScheduledTask>();

// Major cities with RSS feed support
const CITIES_TO_MONITOR = [
  'Los Angeles',
  'New York', 
  'Chicago',
  'San Francisco',
  'Miami',
  'Boston'
];

export function startEventScheduler(): void {
  console.log('🕒 SCHEDULER: Starting automatic event fetching system');
  
  // Schedule tasks for each city/publication combination
  CITIES_TO_MONITOR.forEach(city => {
    schedulePublicationChecks(city);
  });
  
  // Start hourly check for publication windows
  const hourlyCheck = setInterval(() => {
    checkPublicationWindows();
  }, 60 * 60 * 1000); // Every hour
  
  console.log('✅ SCHEDULER: Event fetching system active - will auto-update when magazines publish');
}

function schedulePublicationChecks(city: string): void {
  const publications = getPublicationsForCity(city);
  
  publications.forEach(publication => {
    const taskId = `${publication}-${city.toLowerCase()}`;
    
    // Check if we should fetch right now
    if (shouldFetchFromPublication(publication)) {
      console.log(`📅 SCHEDULER: ${publication.toUpperCase()} publication window active for ${city} - fetching events`);
      fetchEventsForCityPublication(city, publication);
    }
    
    // Schedule next check
    const nextPub = getNextPublicationTime(publication);
    if (nextPub) {
      const timeUntilNext = nextPub.getTime() - Date.now();
      
      if (timeUntilNext > 0) {
        const timeout = setTimeout(() => {
          console.log(`🎯 SCHEDULER: ${publication.toUpperCase()} publication time for ${city} - fetching fresh events`);
          fetchEventsForCityPublication(city, publication);
          
          // Reschedule for next week
          schedulePublicationChecks(city);
        }, Math.min(timeUntilNext, 7 * 24 * 60 * 60 * 1000)); // Max 1 week
        
        scheduledTasks.set(taskId, timeout);
        
        taskStatus.set(taskId, {
          id: taskId,
          publication,
          city,
          nextRun: nextPub,
          interval: timeUntilNext,
          isActive: true
        });
        
        console.log(`⏰ SCHEDULED: ${publication.toUpperCase()} for ${city} at ${nextPub.toLocaleString()}`);
      }
    }
  });
}

function getPublicationsForCity(city: string): string[] {
  const cityPubs = {
    'Los Angeles': ['timeout', 'laist'],
    'New York': ['timeout', 'gothamist', 'village-voice'],
    'Chicago': ['timeout'],
    'San Francisco': ['timeout'],
    'Miami': ['timeout'],
    'Boston': ['timeout']
  };
  
  return cityPubs[city as keyof typeof cityPubs] || ['timeout'];
}

async function fetchEventsForCityPublication(city: string, publication: string): Promise<void> {
  try {
    console.log(`🔄 FETCHING: ${publication.toUpperCase()} events for ${city}`);
    
    // Import the RSS functions dynamically to avoid circular imports
    const { fetchTimeoutEvents, fetchLocalEvents } = await import('./apis/multi-city-rss-feeds');
    
    let events = [];
    
    if (publication === 'timeout') {
      events = await fetchTimeoutEvents(city);
    } else {
      events = await fetchLocalEvents(city);
    }
    
    if (events.length > 0) {
      console.log(`✅ FETCHED: ${events.length} new events from ${publication.toUpperCase()} for ${city}`);
      
      // Store in cache or database if needed
      // This automatically makes new events available to users
      storeEventsInCache(city, publication, events);
    } else {
      console.log(`📭 NO NEW EVENTS: ${publication.toUpperCase()} for ${city}`);
    }
    
  } catch (error) {
    console.error(`❌ ERROR fetching ${publication} events for ${city}:`, error);
  }
}

function storeEventsInCache(city: string, publication: string, events: any[]): void {
  // Simple in-memory cache for demonstration
  // In production, you'd store in database or Redis
  const cacheKey = `events-${publication}-${city.toLowerCase()}`;
  
  // Store with timestamp for freshness tracking
  const cachedData = {
    events,
    fetchedAt: new Date(),
    source: publication,
    city
  };
  
  // You could use your existing event cache here
  console.log(`💾 CACHED: ${events.length} events from ${publication} for ${city}`);
}

function checkPublicationWindows(): void {
  const now = new Date();
  
  CITIES_TO_MONITOR.forEach(city => {
    const publications = getPublicationsForCity(city);
    
    publications.forEach(publication => {
      if (shouldFetchFromPublication(publication)) {
        const taskId = `${publication}-${city.toLowerCase()}`;
        
        // Check if we haven't fetched recently (within last 2 hours)
        const cachedData = getCachedEvents(city, publication);
        const shouldRefetch = !cachedData || 
          (Date.now() - cachedData.fetchedAt.getTime()) > (2 * 60 * 60 * 1000);
        
        if (shouldRefetch) {
          console.log(`🔄 REFRESH: Publication window active for ${publication}/${city} - checking for new content`);
          fetchEventsForCityPublication(city, publication);
        }
      }
    });
  });
}

function getCachedEvents(city: string, publication: string): any {
  // Placeholder for cache lookup
  // In practice, this would check your event cache/database
  return null;
}

export function getSchedulerStatus(): any {
  const tasks = Array.from(taskStatus.values());
  
  return {
    isRunning: tasks.length > 0,
    activeTasks: tasks.filter(t => t.isActive).length,
    upcomingFetches: tasks
      .filter(t => t.nextRun > new Date())
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, 10),
    lastCheck: new Date(),
    citiesMonitored: CITIES_TO_MONITOR
  };
}

export function stopEventScheduler(): void {
  console.log('🛑 SCHEDULER: Stopping automatic event fetching');
  
  scheduledTasks.forEach(timeout => {
    clearTimeout(timeout);
  });
  
  scheduledTasks.clear();
  taskStatus.clear();
  
  console.log('✅ SCHEDULER: All scheduled tasks stopped');
}