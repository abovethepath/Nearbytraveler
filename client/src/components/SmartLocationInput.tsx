import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRegionForCity, isStateOptionalForCountry, validateLocationForCountry, type LocationData } from "@/lib/locationHelpers";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";

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
  const [customCity, setCustomCity] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

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

  // Sync component state when props change (important for edit mode)
  useEffect(() => {
    if (city) {
      setCustomCity(city);
      setIsCustomMode(!CITIES_BY_COUNTRY[country]?.includes(city));
    }
  }, [city, country]);

  // Auto-populate state when city and country are selected (only if state is empty)
  useEffect(() => {
    if (city && country && !state) {
      const autoRegion = getRegionForCity(city, country);
      if (autoRegion) {
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

  const citiesForCountry = country ? Array.from(new Set(CITIES_BY_COUNTRY[country] || [])) : [];
  const validation = validateLocationForCountry({ city, state, country });

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-lg font-semibold">{label}</h3>
      )}

      {/* Country Selection */}
      <div>
        <Label htmlFor="country" className="text-left dark:text-white">
          Country {required ? "*" : ""}
        </Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <SelectValue placeholder={placeholder?.country || "Select country"} />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
            {COUNTRIES.map((countryOption) => (
              <SelectItem key={countryOption} value={countryOption} className="dark:text-white dark:hover:bg-gray-600">
                {countryOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection - Use dropdown for consistency */}
      {country && (
        <div>
          <Label htmlFor="city" className="text-left dark:text-white">
            City {required ? "*" : ""}
          </Label>
          <Select value={city} onValueChange={handleCityChange}>
            <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder={placeholder?.city || "Select city"} />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:border-gray-600 max-h-96 overflow-y-auto scroll-smooth">
              {citiesForCountry.map((cityOption) => (
                <SelectItem key={cityOption} value={cityOption} className="dark:text-white dark:hover:bg-gray-600">
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
          <Label htmlFor="state" className="text-left dark:text-white">
            {stateLabel}
          </Label>
          <Select 
            value={state} 
            onValueChange={handleStateChange}
          >
            <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder={
                country === "United States" 
                  ? "Select state" 
                  : isStateOptional 
                  ? "Optional - select region"
                  : "Select region/province"
              } />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:border-gray-600 max-h-96 overflow-y-auto scroll-smooth">
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
                <SelectItem key={stateOption} value={stateOption} className="dark:text-white dark:hover:bg-gray-600">
                  {stateOption}
                </SelectItem>
              ))}
              {country === "Canada" && [
                "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
                "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
                "Quebec", "Saskatchewan", "Yukon"
              ].map((provinceOption) => (
                <SelectItem key={provinceOption} value={provinceOption} className="dark:text-white dark:hover:bg-gray-600">
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

      {/* Location Preview */}
      {city && country && (
        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <strong>Location Preview:</strong> {city}{state ? `, ${state}` : ""}, {country}
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