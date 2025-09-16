import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useDeviceType';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface InterestPillsProps {
  interests: string[];
  maxVisibleMobile?: number;
  maxVisibleDesktop?: number;
  maxRows?: number; // Limit by number of rows instead of count
  variant?: 'card' | 'profile' | 'inline' | 'compact';
  prioritizedInterests?: string[]; // Interests to show first (e.g., shared with viewer)
  showCommonCount?: boolean;
  className?: string;
}

export function InterestPills({ 
  interests, 
  maxVisibleMobile = 8, 
  maxVisibleDesktop = 12,
  maxRows = 2,
  variant = 'card',
  prioritizedInterests = [],
  showCommonCount = false,
  className = ""
}: InterestPillsProps) {
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();
  
  // Estimate interests per row based on average length and screen width
  const estimatedPerRow = isMobile ? 3 : 4;
  const maxVisible = Math.min(
    isMobile ? maxVisibleMobile : maxVisibleDesktop,
    maxRows * estimatedPerRow
  );
  
  // Sort interests: prioritized first, then alphabetical
  const sortedInterests = [...interests].sort((a, b) => {
    const aIsPrioritized = prioritizedInterests.includes(a);
    const bIsPrioritized = prioritizedInterests.includes(b);
    
    if (aIsPrioritized && !bIsPrioritized) return -1;
    if (!aIsPrioritized && bIsPrioritized) return 1;
    
    return a.localeCompare(b);
  });
  
  const visibleInterests = showAll ? sortedInterests : sortedInterests.slice(0, maxVisible);
  const hiddenCount = Math.max(0, sortedInterests.length - maxVisible);
  const commonCount = prioritizedInterests.length;
  
  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs px-2 py-0.5 h-5';
      case 'profile':
        return 'text-sm px-3 py-1 h-7';
      case 'inline':
        return 'text-xs px-2 py-1 h-6';
      default: // card
        return 'text-xs px-2 py-1 h-6';
    }
  };
  
  const getContainerClasses = () => {
    switch (variant) {
      case 'compact':
        return 'gap-1';
      case 'profile':
        return 'gap-2';
      default:
        return 'gap-1.5';
    }
  };
  
  // Truncate long interest labels for mobile
  const truncateLabel = (label: string, maxLength: number = 15) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 1) + '…';
  };
  
  if (!interests.length) return null;
  
  const InterestsList = () => (
    <div className={`flex flex-wrap ${getContainerClasses()} ${className}`}>
      {visibleInterests.map((interest, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={`${getVariantClasses()} bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 font-medium rounded-full transition-colors`}
        >
          {isMobile && variant === 'card' ? truncateLabel(interest) : interest}
        </Badge>
      ))}
      
      {/* Show more button */}
      {hiddenCount > 0 && (
        <>
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline" 
                  size="sm"
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30 font-medium rounded-full px-4 py-1 h-auto"
                >
                  See {hiddenCount} more
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>All Interests ({interests.length})</SheetTitle>
                  {showCommonCount && commonCount > 0 && (
                    <SheetDescription>
                      {commonCount} in common with you
                    </SheetDescription>
                  )}
                </SheetHeader>
                <div className="flex flex-wrap gap-2 mt-4 max-h-[60vh] overflow-y-auto">
                  {sortedInterests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant={prioritizedInterests.includes(interest) ? "default" : "secondary"}
                      className={`text-sm px-3 py-1.5 ${
                        prioritizedInterests.includes(interest) 
                          ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      } rounded-full`}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="outline" 
              size="sm"
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30 font-medium rounded-full px-4 py-1 h-auto"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `See ${hiddenCount} more`}
            </Button>
          )}
        </>
      )}
    </div>
  );
  
  return (
    <div className="w-full">
      <InterestsList />
      {/* Common interests summary for mobile */}
      {isMobile && showCommonCount && commonCount > 0 && variant === 'card' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {commonCount} in common with you
        </p>
      )}
    </div>
  );
}