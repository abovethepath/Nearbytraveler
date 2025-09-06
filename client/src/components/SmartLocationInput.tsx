import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const citiesForCountry = useMemo(() => {
    if (!country) return [];
    const raw = (CITIES_BY_COUNTRY as any)[country] || [];
    return (Array.isArray(raw) ? raw : []).map(norm);
  }, [country]);

  const phCountry =
    typeof placeholder === "string" ? "Select country" : placeholder?.country || "Select country";
  const phCity =
    typeof placeholder === "string" ? "Select city" : placeholder?.city || "Select city";
  const phState =
    typeof placeholder === "string"
      ? "Select state/region"
      : placeholder?.state || "Select state/region";

  const emit = (loc: { city: string; state: string; country: string }) => {
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

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    const newCity = e.target.value;
    setCity(newCity);

    // Try to auto-fill region/state from lookup
    let nextState = state;
    if (country) {
      const auto = getRegionForCity(newCity, country);
      if (auto) {
        nextState = auto;
        setState(auto);
      }
    }
    emit({ city: newCity, state: nextState || "", country });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.value;
    setState(newState);
    emit({ city, state: newState, country });
  };

  // US/CA lists
  const US_STATES = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
  ];
  const CA_PROVINCES = [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"
  ];

  const selectStyles = {
    backgroundColor: "white",
    backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px 16px",
    appearance: "none" as const
  };

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`} data-testid={dataTestId}>
      {label && <h3 className="text-lg font-semibold">{label}</h3>}

      {/* Country (native select) */}
      <div>
        <Label htmlFor="country-native" className="text-left text-gray-900 dark:text-white">
          Country {required ? "*" : ""}
        </Label>
        <select
          id="country-native"
          value={country}
          onChange={handleCountryChange}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                     text-gray-900 dark:text-white px-3 py-3 pr-10 text-base sm:text-sm"
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

      {/* City (native select when we have data; otherwise free text) */}
      {country && (
        <div>
          <Label htmlFor="city-native" className="text-left text-gray-900 dark:text-white">
            City {required ? "*" : ""}
          </Label>

          {citiesForCountry.length > 0 ? (
            <select
              id="city-native"
              value={city}
              onChange={handleCityChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                         text-gray-900 dark:text-white px-3 py-3 pr-10 text-base sm:text-sm"
              style={selectStyles}
            >
              <option value="" disabled>
                {phCity}
              </option>
              {citiesForCountry.map((c) => (
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
              className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 mt-1 py-3 text-base sm:text-sm"
              autoCapitalize="words"
              autoComplete="address-level2"
              inputMode="text"
            />
          )}
        </div>
      )}

      {/* State/Region (native select for US/CA; otherwise free text) */}
      {country && city && (
        <div>
          <Label htmlFor="state-native" className="text-left text-gray-900 dark:text-white">
            {stateLabel}
          </Label>

          {country === "United States" ? (
            <select
              id="state-native"
              value={state}
              onChange={handleStateChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                         text-gray-900 dark:text-white px-3 py-3 pr-10 text-base sm:text-sm"
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
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                         text-gray-900 dark:text-white px-3 py-3 pr-10 text-base sm:text-sm"
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
              className="text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 mt-1 py-3 text-base sm:text-sm"
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