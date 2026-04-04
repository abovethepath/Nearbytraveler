import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRegionForCity, isStateOptionalForCountry } from "@/lib/locationHelpers";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { US_STATE_NAMES, CANADIAN_PROVINCES, US_CITIES_BY_STATE } from "../../../shared/locationData";

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

function norm(o: any): { value: string; label: string } {
  if (typeof o === "string") return { value: o, label: o };
  if (o?.value && o?.label) return { value: String(o.value), label: String(o.label) };
  if (o?.name) return { value: String(o.name), label: String(o.name) };
  return { value: String(o), label: String(o) };
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

  const countries = useMemo(
    () => (Array.isArray(COUNTRIES) ? COUNTRIES.map(norm) : []),
    []
  );

  // Does this country have state-level data that should show before city?
  const hasStateFirst = country === "United States";
  const hasStateDropdown = country === "United States" || country === "Canada";

  // For US: filter cities by selected state; for others: show all cities for country
  const citiesForDisplay = useMemo(() => {
    if (!country) return [];
    if (hasStateFirst && state) {
      const stateCities = US_CITIES_BY_STATE[state] || [];
      return stateCities.map(norm);
    }
    if (hasStateFirst && !state) {
      // US but no state selected yet — don't show cities
      return [];
    }
    const raw = (CITIES_BY_COUNTRY as any)[country] || [];
    return (Array.isArray(raw) ? raw : []).map(norm);
  }, [country, state, hasStateFirst]);

  const phCountry =
    typeof placeholder === "string" ? "Select country" : placeholder?.country || "Select country";
  const phCity =
    typeof placeholder === "string" ? "Select city" : placeholder?.city || "Select city";
  const phState =
    typeof placeholder === "string"
      ? "Select state/region"
      : placeholder?.state || "Select state/region";

  const emit = (loc: { city: string; state: string; country: string }) => {
    console.log('📍 SmartLocationInput emitting:', loc);
    onLocationChange?.(loc);
    onLocationSelect?.(loc);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    setCity("");
    setState("");
    emit({ city: "", state: "", country: newCountry });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.value;
    setState(newState);
    // Reset city when state changes (for US state-first flow)
    if (hasStateFirst) {
      setCity("");
      emit({ city: "", state: newState, country });
    } else {
      emit({ city, state: newState, country });
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    const newCity = e.target.value;
    setCity(newCity);

    if (hasStateFirst) {
      // State is already selected, just emit
      emit({ city: newCity, state, country });
    } else {
      // Auto-fill region/state from lookup
      let nextState = "";
      if (country) {
        const auto = getRegionForCity(newCity, country);
        if (auto) nextState = auto;
      }
      setState(nextState);
      emit({ city: newCity, state: nextState, country });
    }
  };

  // US/CA lists — imported from shared/locationData.ts (single source of truth)
  const US_STATES = US_STATE_NAMES;
  const CA_PROVINCES = CANADIAN_PROVINCES;

  const selectStyles = {
    backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px 16px",
    appearance: "none" as const
  };

  const selectClassName = `mt-1 block w-full rounded-xl border-2 border-orange-200 dark:border-orange-600
    bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
    text-gray-900 dark:text-white px-4 py-3.5 pr-10 text-base
    shadow-sm hover:border-orange-400 dark:hover:border-orange-500
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none
    transition-all duration-200 cursor-pointer font-medium`;

  // Render State/Province/Region field
  const renderStateField = () => (
    <div>
      <Label htmlFor="state-native" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
        <span className="text-orange-500">🗺️</span> {stateLabel}
      </Label>

      {country === "United States" ? (
        <select
          id="state-native"
          value={state}
          onChange={handleStateChange}
          className={selectClassName}
          style={selectStyles}
        >
          <option value="" disabled>
            {phState}
          </option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : country === "Canada" ? (
        <select
          id="state-native"
          value={state}
          onChange={handleStateChange}
          className={selectClassName}
          style={selectStyles}
        >
          <option value="" disabled>
            {phState}
          </option>
          {CA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id="state-native"
          value={state}
          onChange={handleStateChange}
          placeholder={isStateOptional ? "Region (optional)" : "Region"}
          className="mt-1 rounded-xl border-2 border-orange-200 dark:border-orange-600
            bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
            text-gray-900 dark:text-white px-4 py-3.5 text-base
            shadow-sm hover:border-orange-400 dark:hover:border-orange-500
            focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium"
          autoCapitalize="words"
          autoComplete="address-level1"
          inputMode="text"
        />
      )}
    </div>
  );

  // Render City field
  const renderCityField = () => (
    <div>
      <Label htmlFor="city-native" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
        <span className="text-orange-500">📍</span> City {required ? "*" : ""}
      </Label>

      {citiesForDisplay.length > 0 ? (
        <select
          id="city-native"
          value={city}
          onChange={handleCityChange}
          className={selectClassName}
          style={selectStyles}
        >
          <option value="" disabled>
            {phCity}
          </option>
          {citiesForDisplay.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id="city-native"
          value={city}
          onChange={handleCityChange}
          placeholder="Type your city"
          className="mt-1 rounded-xl border-2 border-orange-200 dark:border-orange-600
            bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
            text-gray-900 dark:text-white px-4 py-3.5 text-base
            shadow-sm hover:border-orange-400 dark:hover:border-orange-500
            focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium"
          autoCapitalize="words"
          autoComplete="address-level2"
          inputMode="text"
        />
      )}
    </div>
  );

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`} data-testid={dataTestId}>
      {label && <h3 className="text-lg font-semibold">{label}</h3>}

      {/* Country (always first) */}
      <div>
        <Label htmlFor="country-native" className="text-left text-gray-900 dark:text-white font-semibold mb-1 flex items-center gap-2">
          <span className="text-orange-500">🌍</span> Country {required ? "*" : ""}
        </Label>
        <select
          id="country-native"
          value={country}
          onChange={handleCountryChange}
          className={selectClassName}
          style={selectStyles}
        >
          <option value="" disabled>
            {phCountry}
          </option>
          {countries.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* US: State → City (state filters cities) */}
      {/* Non-US with state dropdown (Canada): City → State */}
      {/* Other countries: City → free-text Region */}
      {country && hasStateFirst && (
        <>
          {renderStateField()}
          {state && renderCityField()}
        </>
      )}

      {country && !hasStateFirst && (
        <>
          {renderCityField()}
          {city && renderStateField()}
        </>
      )}
    </div>
  );
}

export default SmartLocationInput;
