import { Skeleton } from "@/components/ui/skeleton";

// ─── Generic primitives ───────────────────────────────────────────────────────

/** Single pulsing line. */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-4 rounded-md ${className}`} />;
}

// ─── User / Profile cards ─────────────────────────────────────────────────────

/**
 * Skeleton for a search-result / discover user card.
 * Avatar circle + 2-3 text lines.
 */
export function SkeletonUserCard() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-48 rounded-md" />
      </div>
    </div>
  );
}

/** A grid of N user-card skeletons. */
export function SkeletonUserCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonUserCard key={i} />
      ))}
    </div>
  );
}

// ─── Full profile page ────────────────────────────────────────────────────────

/**
 * Mimics the profile hero: banner → avatar → username → location lines → tabs.
 */
export function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <Skeleton className="w-full h-48 sm:h-56 rounded-none" />

      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar floated up from banner */}
        <div className="-mt-14 mb-4 flex items-end justify-between">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-900" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>

        {/* Name + badges */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>

        {/* Bio */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[80, 96, 72, 88].map((w, i) => (
            <Skeleton key={i} className={`h-9 w-${w < 80 ? 16 : w < 90 ? 20 : 24} rounded-lg`} style={{ width: w }} />
          ))}
        </div>

        {/* Card rows */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card (generic) ───────────────────────────────────────────────────────────

/** A generic content card skeleton with icon area + 2 lines. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
    </div>
  );
}

/** A vertical list of skeleton cards. */
export function SkeletonList({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Meetup card ──────────────────────────────────────────────────────────────

export function SkeletonMeetupCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-3/4 rounded-md" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonMeetupList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMeetupCard key={i} />
      ))}
    </div>
  );
}

// ─── Chatroom list ────────────────────────────────────────────────────────────

export function SkeletonChatroomCard() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-3 w-56 rounded-md" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg flex-shrink-0" />
    </div>
  );
}

export function SkeletonChatroomList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatroomCard key={i} />
      ))}
    </div>
  );
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

export function SkeletonMessages() {
  return (
    <div className="space-y-3 p-4">
      {[false, true, false, false, true].map((sent, i) => (
        <div key={i} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
          <Skeleton
            className={`rounded-2xl ${sent ? "rounded-tr-sm" : "rounded-tl-sm"}`}
            style={{ height: 40 + (i % 3) * 12, width: 140 + (i % 4) * 40 }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

export function SkeletonEventCard() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

// ─── Full-page centered skeleton (fallback) ───────────────────────────────────

/**
 * Use this as a drop-in replacement for full-page spinner states.
 * Shows a skeleton that fills the screen without looking like an error.
 */
export function SkeletonPage({ className = "" }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 ${className}`}>
      <div className="max-w-2xl mx-auto space-y-4 pt-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
        <div className="mt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
