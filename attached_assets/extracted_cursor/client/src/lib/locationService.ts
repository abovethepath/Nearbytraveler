interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface RecentDestination {
  id: string;
  name: string;
  country: string;
  timestamp: number;
  type: 'recent' | 'popular';
}

class LocationService {
  private recentDestinations: RecentDestination[] = [];
  private popularDestinations: RecentDestination[] = [
    { id: 'tokyo', name: 'Tokyo', country: 'Japan', timestamp: Date.now(), type: 'popular' },
    { id: 'paris', name: 'Paris', country: 'France', timestamp: Date.now(), type: 'popular' },
    { id: 'london', name: 'London', country: 'United Kingdom', timestamp: Date.now(), type: 'popular' },
    { id: 'nyc', name: 'New York', country: 'United States', timestamp: Date.now(), type: 'popular' },
    { id: 'barcelona', name: 'Barcelona', country: 'Spain', timestamp: Date.now(), type: 'popular' },
    { id: 'rome', name: 'Rome', country: 'Italy', timestamp: Date.now(), type: 'popular' },
    { id: 'bangkok', name: 'Bangkok', country: 'Thailand', timestamp: Date.now(), type: 'popular' },
    { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', timestamp: Date.now(), type: 'popular' },
  ];

  constructor() {
    this.loadRecentDestinations();
  }

  private loadRecentDestinations() {
    try {
      const stored = localStorage.getItem('recent_destinations');
      if (stored) {
        this.recentDestinations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent destinations:', error);
      this.recentDestinations = [];
    }
  }

  private saveRecentDestinations() {
    try {
      localStorage.setItem('recent_destinations', JSON.stringify(this.recentDestinations));
    } catch (error) {
      console.error('Error saving recent destinations:', error);
    }
  }

  addRecentDestination(name: string, country: string) {
    const id = `${name}-${country}`.toLowerCase().replace(/\s+/g, '-');
    
    // Remove if already exists
    this.recentDestinations = this.recentDestinations.filter(dest => dest.id !== id);
    
    // Add to front
    this.recentDestinations.unshift({
      id,
      name,
      country,
      timestamp: Date.now(),
      type: 'recent'
    });

    // Keep only last 10
    this.recentDestinations = this.recentDestinations.slice(0, 10);
    
    this.saveRecentDestinations();
  }

  getRecentDestinations(): RecentDestination[] {
    return this.recentDestinations;
  }

  getPopularDestinations(): RecentDestination[] {
    return this.popularDestinations;
  }

  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // In a real implementation, you would use Google Places API or similar
      // For now, we'll simulate with a local search through popular destinations
      const filtered = this.popularDestinations
        .filter(dest => 
          dest.name.toLowerCase().includes(query.toLowerCase()) ||
          dest.country.toLowerCase().includes(query.toLowerCase())
        )
        .map(dest => ({
          place_id: dest.id,
          description: `${dest.name}, ${dest.country}`,
          structured_formatting: {
            main_text: dest.name,
            secondary_text: dest.country
          },
          types: ['locality', 'political']
        }));

      // Add some additional common suggestions based on query
      const commonSuggestions = this.getCommonSuggestions(query);
      
      return [...filtered, ...commonSuggestions].slice(0, 8);
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  private getCommonSuggestions(query: string): LocationSuggestion[] {
    const lowerQuery = query.toLowerCase();
    const suggestions: LocationSuggestion[] = [];

    const commonCities = [
      { name: 'Berlin', country: 'Germany' },
      { name: 'Sydney', country: 'Australia' },
      { name: 'Toronto', country: 'Canada' },
      { name: 'Dubai', country: 'United Arab Emirates' },
      { name: 'Singapore', country: 'Singapore' },
      { name: 'Los Angeles', country: 'United States' },
      { name: 'Mumbai', country: 'India' },
      { name: 'Seoul', country: 'South Korea' },
      { name: 'Mexico City', country: 'Mexico' },
      { name: 'Istanbul', country: 'Turkey' },
      { name: 'São Paulo', country: 'Brazil' },
      { name: 'Cairo', country: 'Egypt' },
      { name: 'Buenos Aires', country: 'Argentina' },
      { name: 'Cape Town', country: 'South Africa' },
      { name: 'Prague', country: 'Czech Republic' },
      { name: 'Vienna', country: 'Austria' },
      { name: 'Lisbon', country: 'Portugal' },
      { name: 'Stockholm', country: 'Sweden' },
      { name: 'Warsaw', country: 'Poland' },
      { name: 'Athens', country: 'Greece' },
    ];

    commonCities
      .filter(city => 
        city.name.toLowerCase().includes(lowerQuery) ||
        city.country.toLowerCase().includes(lowerQuery)
      )
      .forEach(city => {
        suggestions.push({
          place_id: `${city.name}-${city.country}`.toLowerCase().replace(/\s+/g, '-'),
          description: `${city.name}, ${city.country}`,
          structured_formatting: {
            main_text: city.name,
            secondary_text: city.country
          },
          types: ['locality', 'political']
        });
      });

    return suggestions;
  }

  parseLocationString(locationString: string): { city: string; state: string; country: string } {
    const parts = locationString.split(',').map(part => part.trim());
    
    if (parts.length === 1) {
      return { city: parts[0], state: '', country: '' };
    } else if (parts.length === 2) {
      return { city: parts[0], state: '', country: parts[1] };
    } else if (parts.length >= 3) {
      return { city: parts[0], state: parts[1], country: parts[2] };
    }
    
    return { city: '', state: '', country: '' };
  }
}

export const locationService = new LocationService();
export type { LocationSuggestion, RecentDestination };