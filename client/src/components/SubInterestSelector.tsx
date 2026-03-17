import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, Sparkles } from "lucide-react";
import { SUB_INTEREST_CATEGORIES, type SubInterestCategory } from "@shared/base-options";
import { HOME_PILL_SIZE_CLASSES } from "@/components/InterestPills";

interface SubInterestSelectorProps {
  selectedSubInterests: string[];
  onSubInterestsChange: (subInterests: string[]) => void;
  showOptionalLabel?: boolean;
  variant?: "default" | "dark";
  excludeCategories?: string[];
  /** Sub-interest strings to hide (profile bio deduplication — not used in City Match) */
  excludeSubInterests?: string[];
}

export default function SubInterestSelector({
  selectedSubInterests,
  onSubInterestsChange,
  showOptionalLabel = true,
  variant = "default",
  excludeCategories = [],
  excludeSubInterests = []
}: SubInterestSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const excludeSubSet = new Set(excludeSubInterests);

  const filteredCategories = SUB_INTEREST_CATEGORIES
    .filter(c => excludeCategories.length === 0 || !excludeCategories.includes(c.id))
    .map(c => excludeSubSet.size === 0 ? c : {
      ...c,
      subInterests: c.subInterests.filter(s => !excludeSubSet.has(s))
    })
    .filter(c => c.subInterests.length > 0);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  const toggleSubInterest = (subInterest: string, categoryId: string) => {
    const isSelected = selectedSubInterests.includes(subInterest);
    
    if (isSelected) {
      onSubInterestsChange(selectedSubInterests.filter(s => s !== subInterest));
    } else {
      onSubInterestsChange([...selectedSubInterests, subInterest]);
    }
  };
  
  const getSelectedCountForCategory = (category: SubInterestCategory) => {
    return selectedSubInterests.filter(s => category.subInterests.includes(s)).length;
  };
  
  const clearCategorySelections = (category: SubInterestCategory) => {
    onSubInterestsChange(selectedSubInterests.filter(s => !category.subInterests.includes(s)));
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <h3 className={`font-medium text-sm ${variant === "dark" ? "text-gray-100" : "text-gray-900 dark:text-white"}`}>
          Get More Specific
        </h3>
        {showOptionalLabel && (
          <span className={`text-xs ${variant === "dark" ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>(Optional)</span>
        )}
      </div>
      
      <p className={`text-xs ${variant === "dark" ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
        Tap a category to see specific options. Better matches + personalized local deals.
      </p>
      
      <div className="space-y-2">
        {filteredCategories.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const selectedCount = getSelectedCountForCategory(category);
          
          return (
            <div key={category.id} className={`rounded-lg overflow-hidden ${variant === "dark" ? "border border-slate-600" : "border border-gray-200 dark:border-gray-700"}`}>
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  variant === "dark"
                    ? isExpanded ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"
                    : isExpanded ? "bg-orange-50 dark:bg-orange-900/20" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.emoji}</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCategorySelections(category);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear selections"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className={`p-3 border-t ${variant === "dark" ? "bg-slate-800/80 border-slate-600" : "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex flex-wrap gap-2">
                    {category.subInterests.map(subInterest => {
                      const isSelected = selectedSubInterests.includes(subInterest);
                      
                      return (
                        <button
                          key={subInterest}
                          type="button"
                          onClick={() => toggleSubInterest(subInterest, category.id)}
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          className={`
                            ${HOME_PILL_SIZE_CLASSES} rounded-full font-medium transition-colors
                            ${variant === "dark"
                              ? isSelected 
                                ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-sm border border-orange-400/50" 
                                : "bg-slate-800 text-gray-100 border border-slate-600 hover:border-slate-500"
                              : isSelected 
                                ? "bg-orange-500 text-white shadow-sm" 
                                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            }
                          `}
                        >
                          <span className="flex items-center gap-1">
                            {isSelected && <Check className="w-3 h-3" />}
                            {subInterest}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
