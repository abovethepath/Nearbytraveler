// Eventbrite API Integration for Los Angeles Community Events
// Good for local community events, workshops, and networking

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description?: {
    text: string;
  };
  start: {
    local: string;
    timezone: string;
  };
  end?: {
    local: string;
  };
  venue?: {
    name?: string;
    address?: {
      address_1?: string;
      address_2?: string;
      city?: string;
      region?: string;
      postal_code?: string;
    };
    latitude?: string;
    longitude?: string;
  };
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
  url: string;
  logo?: {
    url: string;
  };
  ticket_availability?: {
    minimum_ticket_price?: {
      display: string;
      value: number;
    };
  };
  organizer?: {
    name: string;
  };
}

export async function fetchEventbriteEvents(city: string = 'Los Angeles'): Promise<any[]> {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  
  if (!apiKey) {
    console.log('🎪 EVENTBRITE: API key not provided');
    return [];
  }

  try {
    // Los Angeles area search - focus on community events
    const params = new URLSearchParams({
      'location.address': 'Los Angeles, CA',
      'location.within': '25mi', // 25 mile radius around LA
      'start_date.range_start': new Date().toISOString(),
      'start_date.range_end': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ahead
      'sort_by': 'date',
      'expand': 'venue,organizer,category,subcategory,ticket_availability'
    });

    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 8000
      }
    );

    if (!response.ok) {
      console.error(`🎪 EVENTBRITE: API request failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data.events || [];
    
    console.log(`🎪 EVENTBRITE: Successfully fetched ${events.length} LA community events`);

    // Transform to our standard format
    return events.map((event: EventbriteEvent) => {
      const venue = event.venue;
      const address = venue?.address;
      const ticketPrice = event.ticket_availability?.minimum_ticket_price;

      return {
        id: `eventbrite-${event.id}`,
        title: event.name.text,
        description: event.description?.text || 'Community event details on Eventbrite',
        date: event.start.local,
        endDate: event.end?.local || null,
        venue: venue?.name || 'Venue TBD',
        address: address ? 
          [address.address_1, address.address_2, address.city]
            .filter(Boolean).join(', ') : 'Address TBD',
        city: address?.city || 'Los Angeles',
        state: address?.region || 'CA',
        organizer: event.organizer?.name || 'Eventbrite Organizer',
        category: event.category?.name || event.subcategory?.name || 'Community',
        url: event.url,
        price: ticketPrice ? ticketPrice.display : 'Check event details',
        image: event.logo?.url || null,
        coordinates: venue?.latitude && venue?.longitude ? {
          lat: parseFloat(venue.latitude),
          lng: parseFloat(venue.longitude)
        } : null,
        source: 'eventbrite'
      };
    });

  } catch (error) {
    console.error('🎪 EVENTBRITE: Error fetching events:', error);
    return [];
  }
}