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

/**
 * Searchable dropdown with:
 * - Type-to-filter (filters as you type)
 * - Alphabet section headers for quick scanning
 * - Custom entry fallback ("Use '[typed]'" when no match)
 * - Keyboard & touch friendly for mobile
 */
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Filter + group by first letter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  // Group by first letter for alphabet headers
  const grouped = useMemo(() => {
    const groups: { letter: string; items: string[] }[] = [];
    let currentLetter = "";
    for (const item of filtered) {
      const letter = item.charAt(0).toUpperCase();
      if (letter !== currentLetter) {
        currentLetter = letter;
        groups.push({ letter, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [filtered]);

  // Unique alphabet letters for the jump bar
  const letters = useMemo(() => grouped.map((g) => g.letter), [grouped]);

  const jumpToLetter = (letter: string) => {
    const el = listRef.current?.querySelector(`[data-letter="${letter}"]`);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  const handleInputFocus = () => {
    setOpen(true);
    setSearch("");
  };

  const hasExactMatch = filtered.some((o) => o.toLowerCase() === search.toLowerCase().trim());
  const showCustom = allowCustom && search.trim().length > 0 && !hasExactMatch;

  const selectStyles = `w-full rounded-xl border-2 border-orange-200 dark:border-orange-600
    bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-gray-700
    text-gray-900 dark:text-white px-4 py-3.5 text-base
    shadow-sm hover:border-orange-400 dark:hover:border-orange-500
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none
    transition-all duration-200 font-medium`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display input — shows selected value or search text */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={open ? search : value}
        placeholder={value || placeholder}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={handleInputFocus}
        className={`${selectStyles} mt-1`}
        autoComplete="off"
        autoCapitalize="words"
        inputMode="text"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-600 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: "min(320px, 50vh)" }}
        >
          <div className="flex">
            {/* Main list */}
            <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: "min(320px, 50vh)" }}>
              {/* Custom entry option */}
              {showCustom && (
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-b border-orange-100 dark:border-orange-800"
                  onClick={() => handleSelect(search.trim())}
                >
                  Use &lsquo;{search.trim()}&rsquo;
                </button>
              )}

              {filtered.length === 0 && !showCustom && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No matches found</div>
              )}

              {grouped.map((group) => (
                <div key={group.letter}>
                  <div
                    data-letter={group.letter}
                    className="sticky top-0 px-3 py-1 text-xs font-bold text-orange-500 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700"
                  >
                    {group.letter}
                  </div>
                  {group.items.map((item) => (
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
                </div>
              ))}
            </div>

            {/* Alphabet jump bar — only show when list is long enough */}
            {letters.length > 5 && (
              <div className="flex flex-col items-center py-1 px-1 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                {letters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    className="text-[10px] font-bold text-orange-500 hover:text-orange-700 dark:hover:text-orange-300 px-1 py-0.5 leading-tight"
                    onClick={() => jumpToLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
