import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRegionForCity, isStateOptionalForCountry } from "@/lib/locationHelpers";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";

type SmartLocationInputProps = {
  city?: string;
  state?: string;
  country?: string;
  onLocationChange?: (loc: { city: string; state: string; country: string }) => void;
  onLocationSelect?: (loc: { city: string; state: string; country: string }) => void;
  required?: boolean;
  label?: string;
  placeholder?: string | { country: string; state: string; city: string };
  className?: string;
  "data-testid"?: string;
};

function normalizeOption(o: any): { value: string; label: string } {
  if (typeof o === "string") return { value: o, label: o };
  if (o?.value && o?.label) return { value: String(o.value), label: String(o.label) };
  if (o?.name) return { value: String(o.name), label: String(o.name) };
  return { value: String(o), label: String(o) };
}

export function SmartLocationInput({
  city: propCity,
  state: propState,
  country: propCountry,
  onLocationChange,
  onLocationSelect,
  required = false,
  label,
  placeholder,
  className = "",
  "data-testid": dataTestId,
}: SmartLocationInputProps) {
  // Use undefined (not empty string) when there's no selection yet
  const [country, setCountry] = useState<string | undefined>(propCountry || undefined);
  const [city, setCity] = useState<string | undefined>(propCity || undefined);
  const [state, setState] = useState<string | undefined>(propState || undefined);
  const [isStateOptional, setIsStateOptional] = useState(false);
  const [stateLabel, setStateLabel] = useState("State/Province/Region");

  // Sync when props change
  useEffect(() => {
    setCountry(propCountry || undefined);
    setCity(propCity || undefined);
    setState(propState || undefined);
  }, [propCountry, propCity, propState]);

  // Country → state requirement + label
  useEffect(() => {
    if (!country) return;
    const optional = isStateOptionalForCountry(country);
    setIsStateOptional(optional);
    if (country === "United States") setStateLabel(required ? "State *" : "State");
    else if (country === "Canada") setStateLabel("Province");
    else if (country === "Australia") setStateLabel("State/Territory");
    else setStateLabel(optional ? "Region (Optional)" : "Region");
  }, [country, required]);

  const countries = useMemo(
    () => (Array.isArray(COUNTRIES) ? COUNTRIES.map(normalizeOption) : []),
    []
  );

  const citiesForCountry = useMemo(() => {
    if (!country) return [];
    const raw = (CITIES_BY_COUNTRY as any)[country] || [];
    return (Array.isArray(raw) ? raw : []).map(normalizeOption);
  }, [country]);

  const onChange = (loc: { city: string; state: string; country: string }) => {
    onLocationChange?.(loc);
    onLocationSelect?.(loc);
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCity(undefined);
    setState(undefined);
    onChange({ city: "", state: "", country: newCountry });
  };

  const handleCityChange = (newCity: string) => {
    let newState = state;
    // Auto-fill state/region if we can
    if (country) {
      const auto = getRegionForCity(newCity, country);
      if (auto) {
        newState = auto;
        setState(auto);
      }
    }
    setCity(newCity);
    onChange({ city: newCity, state: newState || "", country: country || "" });
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    onChange({ city: city || "", state: newState, country: country || "" });
  };

  // Helper placeholders
  const phCountry =
    typeof placeholder === "string" ? "Select country" : placeholder?.country || "Select country";
  const phCity =
    typeof placeholder === "string" ? "Select city" : placeholder?.city || "Select city";
  const phState =
    typeof placeholder === "string"
      ? "Select state/region"
      : placeholder?.state || "Select state/region";

  return (
    <div className={`space-y-4 ${className}`} data-testid={dataTestId}>
      {label && <h3 className="text-lg font-semibold">{label}</h3>}

      {/* Country */}
      <div>
        <Label htmlFor="country-select" className="text-left text-gray-900 dark:text-white">
          Country {required ? "*" : ""}
        </Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger
            id="country-select"
            className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <SelectValue placeholder={phCountry} />
          </SelectTrigger>
          <SelectContent
            // Make sure it appears above everything in Replit preview
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-[50vh] overflow-y-auto z-[2000]"
            position="popper"
          >
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value} className="px-3 py-2">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      {country && (
        <div>
          <Label htmlFor="city-select" className="text-left text-gray-900 dark:text-white">
            City {required ? "*" : ""}
          </Label>

          {citiesForCountry.length > 0 ? (
            <Select value={city} onValueChange={handleCityChange}>
              <SelectTrigger
                id="city-select"
                className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <SelectValue placeholder={phCity} />
              </SelectTrigger>
              <SelectContent
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-[50vh] overflow-y-auto z-[2000]"
                position="popper"
              >
                {citiesForCountry.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="px-3 py-2">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Fallback when we don't have data for this country
            <Input
              value={city || ""}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="Type your city"
              className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              autoCapitalize="words"
              autoComplete="address-level2"
              inputMode="text"
            />
          )}
        </div>
      )}

      {/* State/Region */}
      {country && city && (
        <div>
          <Label htmlFor="state-select" className="text-left text-gray-900 dark:text-white">
            {stateLabel}
          </Label>

          {country === "United States" || country === "Canada" ? (
            <Select value={state} onValueChange={handleStateChange}>
              <SelectTrigger
                id="state-select"
                className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <SelectValue placeholder={phState} />
              </SelectTrigger>
              <SelectContent
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-[50vh] overflow-y-auto z-[2000]"
                position="popper"
              >
                {(country === "United States"
                  ? [
                      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
                    ]
                  : [
                      "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon",
                    ]
                ).map((s) => (
                  <SelectItem key={s} value={s} className="px-3 py-2">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // For other countries, let users type a region (optional in many cases)
            <Input
              value={state || ""}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder={isStateOptional ? "Region (optional)" : "Region"}
              className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              autoCapitalize="words"
              autoComplete="address-level1"
              inputMode="text"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default SmartLocationInput;