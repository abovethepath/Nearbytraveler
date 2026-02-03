import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface InterestSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minRequired?: number;
  maxAllowed?: number;
  placeholder?: string;
  className?: string;
  extraSelectedCount?: number;
}

export function InterestSelector({
  options,
  selected,
  onChange,
  minRequired = 0,
  maxAllowed = Infinity,
  placeholder = "Search interests...",
  className = "",
  extraSelectedCount = 0
}: InterestSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [touchedRecently, setTouchedRecently] = useState(false);

  const totalSelected = selected.length + extraSelectedCount;

  const toggleInterest = (interest: string, fromTouch = false) => {
    if (fromTouch) {
      setTouchedRecently(true);
      setTimeout(() => setTouchedRecently(false), 300);
    }
    if (selected.includes(interest)) {
      onChange(selected.filter(i => i !== interest));
    } else if (selected.length < maxAllowed) {
      onChange([...selected, interest]);
    }
  }

  const handleClick = (interest: string) => {
    if (!touchedRecently) {
      toggleInterest(interest, false);
    }
  }

  const handleTouch = (e: React.TouchEvent, interest: string) => {
    e.preventDefault();
    toggleInterest(interest, true);
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(query));
  }, [options, searchQuery]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white dark:bg-gray-800"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            onTouchEnd={(e) => { e.preventDefault(); setSearchQuery(""); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
        <span>
          {totalSelected} selected
          {extraSelectedCount > 0 && (
            <span className="text-gray-500 ml-1">
              ({selected.length} + {extraSelectedCount} custom)
            </span>
          )}
          {minRequired > 0 && totalSelected < minRequired && (
            <span className="text-orange-600 ml-1">
              (need {minRequired - totalSelected} more)
            </span>
          )}
        </span>
        {maxAllowed < Infinity && (
          <span>Max: {maxAllowed}</span>
        )}
      </div>


      <div className="max-h-[400px] overflow-y-auto pr-1" style={{ touchAction: 'pan-y' }}>
        <div className="flex flex-wrap gap-1.5 p-2">
          {filteredOptions.map((interest, index) => {
            const isSelected = selected.includes(interest);
            // Colorful backgrounds for unselected pills - rotating through vibrant colors
            const colorVariants = [
              'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 border-rose-300 dark:border-rose-700 hover:bg-rose-200 dark:hover:bg-rose-800/50',
              'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/50',
              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50',
              'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-800/50',
              'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200 border-teal-300 dark:border-teal-700 hover:bg-teal-200 dark:hover:bg-teal-800/50',
              'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-800/50',
              'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 border-sky-300 dark:border-sky-700 hover:bg-sky-200 dark:hover:bg-sky-800/50',
              'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 border-violet-300 dark:border-violet-700 hover:bg-violet-200 dark:hover:bg-violet-800/50',
              'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800/50',
              'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 border-pink-300 dark:border-pink-700 hover:bg-pink-200 dark:hover:bg-pink-800/50',
            ];
            const colorClass = colorVariants[index % colorVariants.length];
            return (
              <button
                key={interest}
                type="button"
                onClick={() => handleClick(interest)}
                onTouchEnd={(e) => handleTouch(e, interest)}
                disabled={!isSelected && selected.length >= maxAllowed}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md border-transparent'
                    : colorClass
                } ${!isSelected && selected.length >= maxAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                {interest}
              </button>
            );
          })}
        </div>
        
        {filteredOptions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No interests match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
