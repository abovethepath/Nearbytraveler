import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface InterestSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minRequired?: number;
  maxAllowed?: number;
  showCategories?: boolean;
  placeholder?: string;
  className?: string;
  extraSelectedCount?: number;
}

const INTEREST_CATEGORIES: Record<string, string[]> = {
  "🍽️ Food & Dining": [
    "Restaurants & Food Scene", "Brunch Spots", "Street Food", "Coffee Shops & Cafes",
    "Late Night Eats", "Vegan/Vegetarian", "Food Tours", "Bakeries & Desserts",
    "Ethnic Cuisine", "Farm-to-Table Dining", "Food Trucks", "Fine Dining", "Cheap Eats"
  ],
  "🍺 Bars & Nightlife": [
    "Happy Hour", "Craft Beer & Breweries", "Wine Bars & Vineyards", "Nightlife & Dancing",
    "Rooftop Bars", "Cocktail Bars & Speakeasies", "Hookah Lounges", "Jazz Clubs",
    "Karaoke", "Trivia Nights"
  ],
  "🎵 Entertainment": [
    "Live Music", "Comedy Shows", "Theater", "Performing Arts", "Film Festivals",
    "Electronic/DJ Scene"
  ],
  "🏛️ Culture & Sightseeing": [
    "Local Hidden Gems", "Historical Sites & Tours", "Museums", "Cultural Experiences",
    "Photography & Scenic Spots", "Local Markets & Bazaars", "Architecture", "Street Art",
    "Ghost Tours", "Religious & Spiritual Sites"
  ],
  "🏃 Sports & Fitness": [
    "Beach Activities", "Water Sports", "Hiking", "Fitness Classes", "Working Out",
    "Golf", "Pickleball", "Tennis", "Running & Jogging", "Team Sports", "Yoga & Meditation",
    "Extreme Sports", "Rock Climbing", "Surfing", "Skiing & Snowboarding", "Scuba Diving",
    "Cycling & Biking", "Sailing & Boating", "Kayaking & Canoeing", "Beach Volleyball"
  ],
  "👥 Social & Community": [
    "Meeting New People", "Open to Dating", "LGBTQIA+", "Family-Oriented",
    "Volunteering", "Activism", "Animal Rescue & Shelters", "Pet Lovers",
    "Sports Events", "Street Festivals", "Community Events", "Parenting Meetups"
  ],
  "🌿 Lifestyle": [
    "Sober/Alcohol-Free Lifestyle", "420-Friendly", "Wellness & Mindfulness",
    "Luxury Experiences", "Budget Travel", "Smoke-Free Environments",
    "Health-Conscious/Vaccinated", "Digital Nomads"
  ],
  "🎨 Hobbies & Interests": [
    "Arts", "Crafts", "Fashion & Style", "Classical Music", "Indie Music Scene",
    "Vintage & Thrift Shopping", "Antiques & Collectibles", "Book Clubs", "Reading",
    "Tech Meetups", "Innovation", "Blogging", "Sunset Watching", "Stargazing"
  ],
  "👨‍👩‍👧 Family": [
    "Kid-Friendly Activities", "Family Travel"
  ],
  "🏕️ Outdoor & Adventure": [
    "Camping & RV Travel", "Nature Walks", "Hot Air Balloons", "Frisbee & Disc Golf",
    "Fishing", "Outdoor BBQ", "Park Picnics"
  ],
  "🎉 Events & Festivals": [
    "Food & Wine Festivals", "Beer Festivals", "Pop-up Restaurants"
  ]
};

function categorizeInterest(interest: string): string {
  const lowerInterest = interest.toLowerCase();
  for (const [category, items] of Object.entries(INTEREST_CATEGORIES)) {
    if (items.some(item => item.toLowerCase() === lowerInterest)) {
      return category;
    }
  }
  return "✨ Other";
}

export function InterestSelector({
  options,
  selected,
  onChange,
  minRequired = 0,
  maxAllowed = Infinity,
  showCategories = true,
  placeholder = "Search interests...",
  className = "",
  extraSelectedCount = 0
}: InterestSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const groupedOptions = useMemo(() => {
    if (!showCategories) return { "All": filteredOptions };
    
    const groups: Record<string, string[]> = {};
    filteredOptions.forEach(option => {
      const category = categorizeInterest(option);
      if (!groups[category]) groups[category] = [];
      groups[category].push(option);
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "✨ Other") return 1;
      if (b === "✨ Other") return -1;
      return a.localeCompare(b);
    });
    
    const sortedGroups: Record<string, string[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key].sort();
    });
    
    return sortedGroups;
  }, [filteredOptions, showCategories]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const isCategoryExpanded = (category: string) => {
    if (searchQuery.trim()) return true;
    return expandedCategories.has(category);
  };

  const selectAllInCategory = (category: string, items: string[]) => {
    const unselectedItems = items.filter(item => !selected.includes(item));
    const newSelected = [...selected, ...unselectedItems].slice(0, maxAllowed);
    onChange(newSelected);
  };

  const countSelectedInCategory = (items: string[]) => {
    return items.filter(item => selected.includes(item)).length;
  };

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

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {selected.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => handleClick(interest)}
              onTouchEnd={(e) => handleTouch(e, interest)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-full"
              style={{ touchAction: 'manipulation' }}
            >
              {interest}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1" style={{ touchAction: 'pan-y' }}>
        {Object.entries(groupedOptions).map(([category, items]) => (
          <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {showCategories && category !== "All" && (
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                onTouchEnd={(e) => { 
                  if (!searchQuery.trim()) {
                    e.preventDefault(); 
                    toggleCategory(category); 
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {category}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({countSelectedInCategory(items)}/{items.length})
                  </span>
                </span>
                {searchQuery.trim() ? null : (
                  isCategoryExpanded(category) ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )
                )}
              </button>
            )}
            
            {isCategoryExpanded(category) && (
              <div className="p-2 flex flex-wrap gap-1.5 bg-white dark:bg-gray-900">
                {items.map(interest => {
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
            )}
          </div>
        ))}
        
        {filteredOptions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No interests match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
