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
          {filteredOptions.map(interest => {
            const isSelected = selected.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => handleClick(interest)}
                onTouchEnd={(e) => handleTouch(e, interest)}
                disabled={!isSelected && selected.length >= maxAllowed}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
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
