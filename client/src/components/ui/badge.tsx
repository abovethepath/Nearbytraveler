import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border bg-background dark:text-gray-800 dark:bg-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  // RESPECT PILL CLASSES - If pill class is provided, use it instead of auto-enforcement
  const finalClassName = className || '';
  
  // If pill class is explicitly provided, use it and skip ALL auto-enforcement
  if (finalClassName.includes('pill')) {
    return (
      <div className={cn(finalClassName)} {...props} />
    )
  }
  
  // Only apply auto-enforcement for non-pill badges
  let enforcedClassName = finalClassName;
  const content = String(props.children || '').toLowerCase();
  
  // Auto-detect interests, activities, events from common patterns (ONLY for non-pill badges)
  const isInterest = enforcedClassName.includes('blue') || enforcedClassName.includes('interest') || 
                    content.includes('photography') || content.includes('hiking') || content.includes('nightlife') ||
                    content.includes('shopping') || content.includes('music') || content.includes('festivals') ||
                    content.includes('dolphins') || content.includes('single and looking') || content.includes('rooftop') ||
                    content.includes('happy hour') || content.includes('adventure tours') || content.includes('craft beer') ||
                    content.includes('discounts') || content.includes('fine dining') || content.includes('coffee culture') ||
                    content.includes('boat & water') || content.includes('yoga') || content.includes('cocktails') ||
                    content.includes('museums') || content.includes('live music') || content.includes('historical') ||
                    content.includes('pizza');
                    
  const isActivity = enforcedClassName.includes('green') || enforcedClassName.includes('activity') ||
                    content.includes('bar hopping') || content.includes('walking tours') || content.includes('hiking trails') ||
                    content.includes('beach activities') || content.includes('camping') || content.includes('bbq') ||
                    content.includes('skiing') || content.includes('city tours') || content.includes('cycling') ||
                    content.includes('cooking classes') || content.includes('food tours') || content.includes('art classes') ||
                    content.includes('blog writing') || content.includes('road trips') || content.includes('playing poker');
                    
  const isEvent = enforcedClassName.includes('purple') || enforcedClassName.includes('event') ||
                 content.includes('cocktail events') || content.includes('rooftop parties') || content.includes('pool parties') ||
                 content.includes('farmers markets') || content.includes('beach events') || content.includes('music festivals') ||
                 content.includes('karaoke') || content.includes('food trucks') || content.includes('community events') ||
                 content.includes('bar crawls');
  
  // FORCE CORRECT COLORS - OVERRIDE ANY EXISTING CLASSES (only for non-pill badges)
  if (isInterest) {
    enforcedClassName = 'text-xs bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 justify-center';
  } else if (isActivity) {
    enforcedClassName = 'text-xs bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700 justify-center';
  } else if (isEvent) {
    enforcedClassName = 'text-xs bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 justify-center';
  }
  
  return (
    <div className={cn(badgeVariants({ variant }), enforcedClassName)} {...props} />
  )
}

export { Badge, badgeVariants }
