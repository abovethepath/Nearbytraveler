import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatPageSkeleton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const bg = variant === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        {/* Top bar */}
        <div className={`px-4 py-3 border-b ${variant === "dark" ? "border-white/10" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-white/10" />
              <Skeleton className="h-3 w-56 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
          <div className="flex justify-start">
            <Skeleton className="h-10 w-64 rounded-2xl bg-white/10" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-48 rounded-2xl bg-white/10" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-16 w-72 rounded-2xl bg-white/10" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-56 rounded-2xl bg-white/10" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-12 w-52 rounded-2xl bg-white/10" />
          </div>
        </div>

        {/* Input bar */}
        <div className={`px-4 py-3 border-t ${variant === "dark" ? "border-white/10" : "border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-md bg-white/10" />
            <Skeleton className="h-10 w-10 rounded-md bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

