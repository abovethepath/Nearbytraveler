import { useState, useRef, useEffect, useMemo } from "react";

interface SearchableSelectProps {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
}

const MAX_VISIBLE = 15;

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Search...",
  className = "",
  allowCustom = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Show NOTHING until user types at least 1 character — prevents rendering
  // 500+ items on open which freezes mobile. Then show max 15 matches.
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [] as string[];
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, MAX_VISIBLE);
  }, [options, search]);

  const hasExactMatch = filtered.some((o) => o.toLowerCase() === search.toLowerCase().trim());
  const showCustom = allowCustom && search.trim().length > 0 && !hasExactMatch;

  const handleSelect = (val: string) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  const inputClass = `w-full mt-1 rounded-xl border-2 border-orange-200 dark:border-orange-600
    bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
    text-gray-900 dark:text-white px-4 py-3.5 text-base
    shadow-sm hover:border-orange-400 dark:hover:border-orange-500
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none
    transition-all duration-200 font-medium`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        value={open ? search : value}
        placeholder={value || placeholder}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => { setOpen(true); setSearch(""); }}
        className={inputClass}
        autoComplete="off"
        autoCapitalize="words"
        inputMode="text"
      />

      {open && (
        <div
          className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-600 rounded-xl shadow-xl overflow-y-auto"
          style={{ maxHeight: "min(320px, 50vh)" }}
        >
          {showCustom && (
            <button
              type="button"
              className="w-full text-left px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-b border-orange-100 dark:border-orange-800"
              onClick={() => handleSelect(search.trim())}
            >
              Use '{search.trim()}'
            </button>
          )}

          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                item === value
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold"
                  : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleSelect(item)}
            >
              {item}
            </button>
          ))}

          {filtered.length === 0 && !showCustom && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {search.trim() ? "No matches found" : "Start typing to search..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
