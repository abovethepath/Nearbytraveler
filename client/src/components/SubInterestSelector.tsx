import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Check, X, Sparkles } from "lucide-react";
import { SUB_INTEREST_CATEGORIES, type SubInterestCategory } from "@shared/base-options";

interface SubInterestSelectorProps {
  selectedSubInterests: string[];
  onSubInterestsChange: (subInterests: string[]) => void;
  maxPerCategory?: number;
  maxTotal?: number;
  showOptionalLabel?: boolean;
}

export default function SubInterestSelector({
  selectedSubInterests,
  onSubInterestsChange,
  maxPerCategory = 3,
  maxTotal = 10,
  showOptionalLabel = true
}: SubInterestSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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
      const categorySubInterests = SUB_INTEREST_CATEGORIES.find(c => c.id === categoryId)?.subInterests || [];
      const selectedInCategory = selectedSubInterests.filter(s => categorySubInterests.includes(s));
      
      if (selectedInCategory.length >= maxPerCategory) {
        return;
      }
      
      if (selectedSubInterests.length >= maxTotal) {
        return;
      }
      
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">
            Get More Specific
          </h3>
          {showOptionalLabel && (
            <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
          )}
        </div>
        {selectedSubInterests.length > 0 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            {selectedSubInterests.length}/{maxTotal} selected
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Tap a category to see specific options. Better matches + personalized local deals.
      </p>
      
      <div className="space-y-2">
        {SUB_INTEREST_CATEGORIES.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const selectedCount = getSelectedCountForCategory(category);
          
          return (
            <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  isExpanded 
                    ? "bg-orange-50 dark:bg-orange-900/20" 
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.emoji}</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                  {selectedCount > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0.5">
                      {selectedCount}
                    </Badge>
                  )}
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
                <div className="p-3 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Pick up to {maxPerCategory} (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.subInterests.map(subInterest => {
                      const isSelected = selectedSubInterests.includes(subInterest);
                      const categorySubInterests = category.subInterests;
                      const selectedInCategory = selectedSubInterests.filter(s => categorySubInterests.includes(s));
                      const isDisabled = !isSelected && (
                        selectedInCategory.length >= maxPerCategory ||
                        selectedSubInterests.length >= maxTotal
                      );
                      
                      return (
                        <button
                          key={subInterest}
                          type="button"
                          onClick={() => toggleSubInterest(subInterest, category.id)}
                          disabled={isDisabled}
                          className={`
                            px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${isSelected 
                              ? "bg-orange-500 text-white shadow-sm" 
                              : isDisabled
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
      
      {selectedSubInterests.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your selections:</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSubInterests.map(subInterest => (
              <Badge
                key={subInterest}
                variant="secondary"
                className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
                onClick={() => {
                  const category = SUB_INTEREST_CATEGORIES.find(c => c.subInterests.includes(subInterest));
                  if (category) {
                    toggleSubInterest(subInterest, category.id);
                  }
                }}
              >
                {subInterest}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
