import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ModernCardSkeleton() {
  return (
    <Card className="relative overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-700/60 to-transparent"></div>
      
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-gray-200/80 dark:bg-gray-700/80"></div>
          
          {/* Name and location skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded-md w-32"></div>
            <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-24"></div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Bio skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-full"></div>
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-5/6"></div>
        </div>
        
        {/* Interests skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200/80 dark:bg-gray-700/80 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200/80 dark:bg-gray-700/80 rounded-full w-24"></div>
          <div className="h-6 bg-gray-200/80 dark:bg-gray-700/80 rounded-full w-16"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModernEventSkeleton() {
  return (
    <Card className="relative overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-700/60 to-transparent"></div>
      
      <CardHeader className="space-y-3">
        {/* Event title skeleton */}
        <div className="h-5 bg-gray-200/80 dark:bg-gray-700/80 rounded-md w-4/5"></div>
        
        {/* Date and location skeleton */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-24"></div>
          <div className="h-4 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-32"></div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-full"></div>
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-3/4"></div>
        </div>
        
        {/* Attendees skeleton */}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-gray-700/80"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-gray-700/80"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-gray-700/80"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModernListSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-4">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-700/60 to-transparent"></div>
      
      <div className="flex items-center gap-4">
        {/* Icon skeleton */}
        <div className="w-10 h-10 rounded-lg bg-gray-200/80 dark:bg-gray-700/80"></div>
        
        {/* Text skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded-md w-40"></div>
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-md w-24"></div>
        </div>
      </div>
    </div>
  );
}
