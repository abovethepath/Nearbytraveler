// Ticketmaster Discovery API Integration for City-Specific Events
// Free tier: 5,000 calls/day, comprehensive event coverage

import { resolveStateForCity } from '../../shared/cityStateResolver';

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        stateCode?: string;
        postalCode?: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  url: string;
  info?: string;
}

export async function fetchTicketmasterEvents(city: string = 'Los Angeles'): Promise<any[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  
  if (!apiKey) {
    console.log('🎫 TICKETMASTER: API key not provided');
    return [];
  }

  try {
    // Get current date for filtering future events only
    const today = new Date();
    const startDateTime = today.toISOString().split('T')[0] + 'T00:00:00Z';
    
    // City-specific search - determine state from city using shared resolver
    const stateCode = resolveStateForCity(city);
    
    const params = new URLSearchParams({
      apikey: apiKey,
      city: city,
      stateCode: stateCode,
      countryCode: 'US',
      size: '50', // Get more events to filter duplicates
      sort: 'date,asc',
      startDateTime: startDateTime // Only get future events
    });

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    console.log(`🎫 TICKETMASTER: Requesting URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🎫 TICKETMASTER: API request failed with status ${response.status}:`, errorText);
      return [];
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    
    console.log(`🎫 TICKETMASTER: Successfully fetched ${events.length} events for ${city}`);

    // Transform to our standard format with correct city mapping
    const cityStateMap: { [key: string]: string } = {
      'Austin': 'TX',
      'Los Angeles': 'CA', 
      'Las Vegas': 'NV',
      'New York': 'NY',
      'Chicago': 'IL',
      'Miami': 'FL',
      'San Francisco': 'CA',
      'Seattle': 'WA',
      'Denver': 'CO',
      'Atlanta': 'GA'
    };
    
    const transformedEvents = events.map((event: TicketmasterEvent) => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];
      const image = event.images?.find(img => img.width >= 300) || event.images?.[0];
      const classification = event.classifications?.[0];

      return {
        id: `ticketmaster-${event.id}`,
        title: event.name,
        description: event.info || 'Event details available on Ticketmaster',
        date: event.dates.start.localTime 
          ? `${event.dates.start.localDate}T${event.dates.start.localTime}`
          : `${event.dates.start.localDate}T19:00:00`, // Default to 7 PM if no time
        venue: venue?.name || 'Venue TBD',
        address: venue?.address ? 
          [venue.address.line1, venue.address.line2, venue.address.city]
            .filter(Boolean).join(', ') : 'Address TBD',
        city: venue?.address?.city || city, // Use requested city as fallback
        state: venue?.address?.stateCode || cityStateMapping[city.toLowerCase()] || 'TX', // Map city to state
        organizer: 'Ticketmaster',
        category: classification?.segment?.name || classification?.genre?.name || 'Entertainment',
        url: event.url,
        price: priceRange ? `$${priceRange.min}-$${priceRange.max}` : 'Price varies',
        image: image?.url || null,
        coordinates: venue?.location ? {
          lat: parseFloat(venue.location.latitude),
          lng: parseFloat(venue.location.longitude)
        } : null,
        source: 'ticketmaster'
      };
    });

    // Deduplicate events based on title, date, and venue
    const seenEvents = new Set<string>();
    const uniqueEvents = transformedEvents.filter((event: any) => {
      const eventKey = `${event.title}-${event.date}-${event.venue}`.toLowerCase().replace(/\s+/g, '');
      if (seenEvents.has(eventKey)) {
        return false; // Skip duplicate
      }
      seenEvents.add(eventKey);
      return true;
    });

    console.log(`🎫 TICKETMASTER: Filtered from ${transformedEvents.length} to ${uniqueEvents.length} unique events`);
    
    // Return only the first 20 unique events
    return uniqueEvents.slice(0, 20);

  } catch (error) {
    console.error('🎫 TICKETMASTER: Error fetching events:', error);
    return [];
  }
}