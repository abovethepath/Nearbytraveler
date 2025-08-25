import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRegionForCity, isStateOptionalForCountry, validateLocationForCountry } from "@/lib/locationHelpers";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { METRO_AREAS, isLAMetroCity, getMetroArea } from "../../../shared/constants";

interface SmartLocationInputProps {
  city?: string;
  state?: string;
  country?: string;
  onLocationChange?: (location: { city: string; state: string; country: string }) => void;
  onLocationSelect?: (location: { city: string; state: string; country: string }) => void;
  required?: boolean;
  label?: string;
  placeholder?: string | {
    country: string;
    state: string;
    city: string;
  };
  className?: string;
  "data-testid"?: string;
}

export function SmartLocationInput({ 
  city: propCity = "", 
  state: propState = "", 
  country: propCountry = "", 
  onLocationChange, 
  onLocationSelect,
  required = false, 
  label, 
  placeholder,
  className = "",
  "data-testid": dataTestId
}: SmartLocationInputProps) {
  const [country, setCountry] = useState(propCountry);
  const [city, setCity] = useState(propCity);
  const [state, setState] = useState(propState);
  const [isStateOptional, setIsStateOptional] = useState(false);
  const [stateLabel, setStateLabel] = useState("State/Province/Region");

  // Update state requirements when country changes
  useEffect(() => {
    if (country) {
      const optional = isStateOptionalForCountry(country);
      setIsStateOptional(optional);
      
      // Update label based on country
      if (country === "United States") {
        setStateLabel(required ? "State *" : "State");
      } else if (country === "Canada") {
        setStateLabel("Province");
      } else if (country === "Australia") {
        setStateLabel("State/Territory");
      } else {
        setStateLabel(optional ? "Region (Optional)" : "Region");
      }
    }
  }, [country]);

  // Auto-populate state when city and country are selected (only if state is empty)
  useEffect(() => {
    if (city && country && !state) {
      const autoRegion = getRegionForCity(city, country);
      if (autoRegion) {
        setState(autoRegion);
        const newLocation = { city, state: autoRegion, country };
        if (onLocationChange && typeof onLocationChange === 'function') {
          onLocationChange(newLocation);
        }
        if (onLocationSelect && typeof onLocationSelect === 'function') {
          onLocationSelect(newLocation);
        }
      }
    }
  }, [city, country, state, onLocationChange, onLocationSelect]);

  const handleCountryChange = (newCountry: string) => {
    console.log('🌍 SmartLocationInput: Country changed to:', newCountry);
    // Reset city and state when country changes
    setCountry(newCountry);
    setCity("");
    setState("");
    const newLocation = { city: "", state: "", country: newCountry };
    if (onLocationChange && typeof onLocationChange === 'function') {
      onLocationChange(newLocation);
    }
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(newLocation);
    }
  };

  const handleCityChange = (newCity: string) => {
    console.log('🏙️ SmartLocationInput: City changed to:', newCity);
    setCity(newCity);
    
    let newState = state;
    // Auto-populate state if we know it
    if (country) {
      const autoRegion = getRegionForCity(newCity, country);
      if (autoRegion) {
        newState = autoRegion;
        setState(autoRegion);
      }
    }
    
    const newLocation = { city: newCity, state: newState, country };
    if (onLocationChange && typeof onLocationChange === 'function') {
      onLocationChange(newLocation);
    }
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(newLocation);
    }
  };

  const handleStateChange = (newState: string) => {
    console.log('📍 SmartLocationInput: State changed to:', newState);
    setState(newState);
    const newLocation = { city, state: newState, country };
    if (onLocationChange && typeof onLocationChange === 'function') {
      onLocationChange(newLocation);
    }
    if (onLocationSelect && typeof onLocationSelect === 'function') {
      onLocationSelect(newLocation);
    }
  };

  // Get cities for country WITH ALL METRO consolidation
  const getCitiesForCountry = () => {
    if (!country) return [];
    
    const baseCities = CITIES_BY_COUNTRY[country] || [];
    
    if (country === "United States") {
      // Collect ALL metro cities from ALL metro areas
      const allMetroCities = new Set<string>();
      const mainMetroCities: string[] = [];
      
      Object.values(METRO_AREAS).forEach(metro => {
        // Add the main city first
        if (baseCities.includes(metro.mainCity)) {
          mainMetroCities.push(metro.mainCity);
        }
        // Add all metro cities to the set
        metro.cities.forEach(city => {
          if (baseCities.includes(city)) {
            allMetroCities.add(city);
          }
        });
      });
      
      const topCities = ["Los Angeles", "Las Vegas", "Miami", "Nashville", "New Orleans", "Austin", "Chicago", "New York City"];
      
      return [
        // Top priority cities first
        ...topCities.filter(c => baseCities.includes(c)),
        // ALL Metro area cities prominently displayed (excluding main cities to avoid duplication)
        ...Array.from(allMetroCities).filter(city => !topCities.includes(city)),
        // Rest of US cities (non-metro, non-top)
        ...baseCities.filter(city => {
          const isTopCity = topCities.includes(city);
          const isMetroCity = allMetroCities.has(city);
          return !isTopCity && !isMetroCity;
        })
      ];
    }
    
    return baseCities;
  };

  const citiesForCountry = getCitiesForCountry();
  const validation = validateLocationForCountry({ city, state, country });

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-lg font-semibold">{label}</h3>
      )}

      {/* Country Selection */}
      <div>
        <Label htmlFor="country" className="text-left text-gray-900 dark:text-white">
          Country {required ? "*" : ""}
        </Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <SelectValue placeholder={typeof placeholder === 'object' ? placeholder?.country : "Select country"} />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-700 dark:border-gray-600 bg-white">
            {COUNTRIES.map((countryOption) => (
              <SelectItem key={countryOption} value={countryOption} className="text-gray-900 dark:text-white dark:hover:bg-gray-600">
                {countryOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      {country && (
        <div>
          <Label htmlFor="city" className="text-left text-gray-900 dark:text-white">
            City {required ? "*" : ""}
          </Label>
          <Select value={city} onValueChange={handleCityChange}>
            <SelectTrigger className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder={typeof placeholder === 'object' ? placeholder?.city : "Select city"} />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:border-gray-600 bg-white max-h-96 overflow-y-auto">
              {citiesForCountry.map((cityOption) => (
                <SelectItem key={cityOption} value={cityOption} className="text-gray-900 dark:text-white dark:hover:bg-gray-600">
                  {cityOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* State/Region Selection */}
      {country && city && (
        <div>
          <Label htmlFor="state" className="text-left text-gray-900 dark:text-white">
            {stateLabel}
          </Label>
          <Select 
            value={state} 
            onValueChange={handleStateChange}
          >
            <SelectTrigger className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder={
                country === "United States" 
                  ? "Select state" 
                  : isStateOptional 
                  ? "Optional - select region"
                  : "Select region/province"
              } />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:border-gray-600 bg-white max-h-96 overflow-y-auto">
              {/* Add state/region options based on country */}
              {country === "United States" && [
                "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
                "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
                "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
                "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
                "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
                "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
                "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
                "Wisconsin", "Wyoming"
              ].map((stateOption) => (
                <SelectItem key={stateOption} value={stateOption} className="text-gray-900 dark:text-white dark:hover:bg-gray-600">
                  {stateOption}
                </SelectItem>
              ))}
              {country === "Canada" && [
                "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
                "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
                "Quebec", "Saskatchewan", "Yukon"
              ].map((provinceOption) => (
                <SelectItem key={provinceOption} value={provinceOption} className="text-gray-900 dark:text-white dark:hover:bg-gray-600">
                  {provinceOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isStateOptional && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Don't know the region? That's fine - leave it blank!
            </p>
          )}
        </div>
      )}

      {/* Location Preview with LA Metro indication */}
      {city && country && (
        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <strong>Location:</strong> {city}{state ? `, ${state}` : ""}, {country}
          {isLAMetroCity(city) && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              🌟 Part of Los Angeles Metro area
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {!validation.isValid && validation.message && (
        <p className="text-xs text-red-500">{validation.message}</p>
      )}
    </div>
  );
}

export default SmartLocationInput;