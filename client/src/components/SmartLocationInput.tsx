import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { getRegionForCity, isStateOptionalForCountry } from "@/lib/locationHelpers";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { US_STATE_NAMES, CANADIAN_PROVINCES } from "../../../shared/locationData";
import { SearchableSelect } from "@/components/SearchableSelect";

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
  "data-testid": dataTestId,
}: SmartLocationInputProps) {
  const [country, setCountry] = useState<string>(propCountry);
  const [city, setCity] = useState<string>(propCity);
  const [state, setState] = useState<string>(propState);
  const [isStateOptional, setIsStateOptional] = useState(false);
  const [stateLabel, setStateLabel] = useState("State/Province/Region");

  // Keep internal state in sync with props
  useEffect(() => {
    setCountry(propCountry || "");
    setCity(propCity || "");
    setState(propState || "");
  }, [propCountry, propCity, propState]);

  // Update requirement label when country changes
  useEffect(() => {
    if (!country) {
      setIsStateOptional(false);
      setStateLabel("State/Province/Region");
      return;
    }
    const optional = isStateOptionalForCountry(country);
    setIsStateOptional(optional);
    if (country === "United States") setStateLabel(required ? "State *" : "State");
    else if (country === "Canada") setStateLabel("Province");
    else if (country === "Australia") setStateLabel("State/Territory");
    else setStateLabel(optional ? "Region (Optional)" : "Region");
  }, [country, required]);

  const countryList = useMemo(() => (Array.isArray(COUNTRIES) ? [...COUNTRIES] : []), []);

  const cityList = useMemo(() => {
    if (!country) return [];
    const raw = (CITIES_BY_COUNTRY as any)[country] || [];
    return Array.isArray(raw) ? raw.map((c: any) => (typeof c === "string" ? c : String(c?.name || c?.value || c))) : [];
  }, [country]);

  const stateList = useMemo(() => {
    if (country === "United States") return [...US_STATE_NAMES];
    if (country === "Canada") return [...CANADIAN_PROVINCES];
    return [];
  }, [country]);

  const phCountry = typeof placeholder === "string" ? "Select country" : placeholder?.country || "Select country";
  const phCity = typeof placeholder === "string" ? "Select city" : placeholder?.city || "Select city";
  const phState = typeof placeholder === "string" ? "Select state/region" : placeholder?.state || "Select state/region";

  const emit = (loc: { city: string; state: string; country: string }) => {
    onLocationChange?.(loc);
    onLocationSelect?.(loc);
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCity("");
    setState("");
    emit({ city: "", state: "", country: newCountry });
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    let nextState = "";
    if (country) {
      const auto = getRegionForCity(newCity, country);
      if (auto) nextState = auto;
    }
    setState(nextState);
    emit({ city: newCity, state: nextState, country });
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    emit({ city, state: newState, country });
  };

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`} data-testid={dataTestId}>
      {label && <h3 className="text-lg font-semibold">{label}</h3>}

      {/* Country — searchable with custom entry */}
      <div>
        <Label htmlFor="country-search" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
          <span className="text-orange-500">🌍</span> Country {required ? "*" : ""}
        </Label>
        <SearchableSelect
          id="country-search"
          value={country}
          options={countryList}
          onChange={handleCountryChange}
          placeholder={phCountry}
          allowCustom={true}
        />
      </div>

      {/* City — searchable with custom entry */}
      {country && (
        <div>
          <Label htmlFor="city-search" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
            <span className="text-orange-500">📍</span> City {required ? "*" : ""}
          </Label>
          <SearchableSelect
            id="city-search"
            value={city}
            options={cityList}
            onChange={handleCityChange}
            placeholder={phCity}
            allowCustom={true}
          />
        </div>
      )}

      {/* State/Region — searchable for US/CA, free text for others */}
      {country && city && (
        <div>
          <Label htmlFor="state-search" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
            <span className="text-orange-500">🗺️</span> {stateLabel}
          </Label>
          {stateList.length > 0 ? (
            <SearchableSelect
              id="state-search"
              value={state}
              options={stateList}
              onChange={handleStateChange}
              placeholder={phState}
              allowCustom={true}
            />
          ) : (
            <input
              id="state-search"
              type="text"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder={isStateOptional ? "Region (optional)" : "Region"}
              className="mt-1 w-full rounded-xl border-2 border-orange-200 dark:border-orange-600
                bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
                text-gray-900 dark:text-white px-4 py-3.5 text-base
                shadow-sm hover:border-orange-400 dark:hover:border-orange-500
                focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none
                transition-all duration-200 font-medium"
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
