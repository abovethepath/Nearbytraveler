import { Skeleton } from "@/components/ui/skeleton";

type FullPageSkeletonVariant = "page" | "cards" | "chat";

export function FullPageSkeleton({ variant = "page" }: { variant?: FullPageSkeletonVariant }) {
  if (variant === "chat") {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/5" />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showCards = variant === "cards";
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-56 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            {showCards && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

