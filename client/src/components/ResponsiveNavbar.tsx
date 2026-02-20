import React, { useState } from "react";
import { isNativeIOSApp } from "@/lib/nativeApp";

export default function ResponsiveNavbar() {
  if (isNativeIOSApp()) return null;
  const [open, setOpen] = useState(false);
  if (isNativeIOSApp()) return null;

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/70">
      <div className="container-default">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="text-lg font-bold text-left text-gray-900 dark:text-white">Nearby Traveler</a>

          <button
            className="inline-flex items-center justify-center rounded-md p-2 md:hidden text-gray-900 dark:text-gray-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {/* simple hamburger */}
            <div className="space-y-1">
              <span className="block h-0.5 w-6 bg-gray-900 dark:bg-gray-100" />
              <span className="block h-0.5 w-6 bg-gray-900 dark:bg-gray-100" />
              <span className="block h-0.5 w-6 bg-gray-900 dark:bg-gray-100" />
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <a className="text-sm text-gray-700 dark:text-gray-200 hover:underline" href="/events">Events</a>
            <a className="text-sm text-gray-700 dark:text-gray-200 hover:underline" href="/discover">People</a>
            <a className="text-sm text-gray-700 dark:text-gray-200 hover:underline" href="/messages">Messages</a>
            <a className="pill" href="/signup">Join</a>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="container-default py-3 space-y-2">
            <a className="block text-base text-gray-900 dark:text-gray-100" href="/events">Events</a>
            <a className="block text-base text-gray-900 dark:text-gray-100" href="/discover">People</a>
            <a className="block text-base text-gray-900 dark:text-gray-100" href="/messages">Messages</a>
            <a className="pill inline-block" href="/signup">Join</a>
          </div>
        </div>
      )}
    </header>
  );
}