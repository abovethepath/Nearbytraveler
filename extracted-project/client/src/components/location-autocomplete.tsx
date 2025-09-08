import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import { locationService, type LocationSuggestion, type RecentDestination } from '@/lib/locationService';

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: { city: string; state: string; country: string }) => void;
  required?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  label,
  placeholder = "Search for a city or country",
  value,
  onChange,
  onLocationSelect,
  required = false,
  className = ""
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<RecentDestination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<RecentDestination[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentDestinations(locationService.getRecentDestinations());
    setPopularDestinations(locationService.getPopularDestinations());
  }, []);

  useEffect(() => {
    const searchLocations = async () => {
      if (value.length >= 2) {
        setIsLoading(true);
        try {
          const results = await locationService.searchLocations(value);
          setSuggestions(results);
        } catch (error) {
          console.error('Error searching locations:', error);
          setSuggestions([]);
        }
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleLocationSelect = (suggestion: LocationSuggestion | RecentDestination) => {
    let locationName: string;
    let city: string;
    let country: string;

    if ('description' in suggestion) {
      // LocationSuggestion
      locationName = suggestion.description;
      city = suggestion.structured_formatting.main_text;
      country = suggestion.structured_formatting.secondary_text;
    } else {
      // RecentDestination
      locationName = `${suggestion.name}, ${suggestion.country}`;
      city = suggestion.name;
      country = suggestion.country;
    }

    onChange(locationName);
    setShowDropdown(false);
    setSelectedIndex(-1);

    // Add to recent destinations
    locationService.addRecentDestination(city, country);
    setRecentDestinations(locationService.getRecentDestinations());

    // Call onLocationSelect callback if provided
    if (onLocationSelect) {
      const parsed = locationService.parseLocationString(locationName);
      onLocationSelect(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const allItems = [
      ...recentDestinations,
      ...popularDestinations.slice(0, 4),
      ...suggestions
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleLocationSelect(allItems[selectedIndex] as any);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const renderDestination = (destination: RecentDestination, index: number, type: 'recent' | 'popular') => (
    <div
      key={`${type}-${destination.id}`}
      className={`px-3 py-2 cursor-pointer flex items-center space-x-3 ${
        selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => handleLocationSelect(destination)}
    >
      {type === 'recent' ? (
        <Clock className="w-4 h-4 text-gray-400" />
      ) : (
        <TrendingUp className="w-4 h-4 text-gray-400" />
      )}
      <div className="flex-1">
        <div className="font-medium text-sm">{destination.name}</div>
        <div className="text-xs text-gray-500">{destination.country}</div>
      </div>
    </div>
  );

  const renderSuggestion = (suggestion: LocationSuggestion, index: number) => (
    <div
      key={suggestion.place_id}
      className={`px-3 py-2 cursor-pointer flex items-center space-x-3 ${
        selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => handleLocationSelect(suggestion)}
    >
      <MapPin className="w-4 h-4 text-gray-400" />
      <div className="flex-1">
        <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
        <div className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
      </div>
    </div>
  );

  const showInitialSuggestions = !value && showDropdown;
  const showSearchResults = value.length >= 2 && showDropdown;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor="location-autocomplete">
          {label} {required && '*'}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id="location-autocomplete"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full"
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {(showInitialSuggestions || showSearchResults) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto no-scrollbar"
        >
          {showInitialSuggestions && (
            <>
              {recentDestinations.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                    Recent Destinations
                  </div>
                  {recentDestinations.slice(0, 3).map((destination, index) =>
                    renderDestination(destination, index, 'recent')
                  )}
                </>
              )}
              
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                Popular Destinations
              </div>
              {popularDestinations.slice(0, 4).map((destination, index) =>
                renderDestination(destination, recentDestinations.length + index, 'popular')
              )}
            </>
          )}

          {showSearchResults && (
            <>
              {isLoading && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Searching...
                </div>
              )}

              {!isLoading && suggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No locations found
                </div>
              )}

              {!isLoading && suggestions.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                    Search Results
                  </div>
                  {suggestions.map((suggestion, index) =>
                    renderSuggestion(suggestion, index)
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}