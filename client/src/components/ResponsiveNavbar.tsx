import React, { useState } from "react";

export default function ResponsiveNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-default">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="text-lg font-bold">Nearby Traveler</a>

          <button
            className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {/* simple hamburger */}
            <div className="space-y-1">
              <span className="block h-0.5 w-6 bg-black" />
              <span className="block h-0.5 w-6 bg-black" />
              <span className="block h-0.5 w-6 bg-black" />
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <a className="text-sm hover:underline" href="/events">Events</a>
            <a className="text-sm hover:underline" href="/discover">People</a>
            <a className="text-sm hover:underline" href="/messages">Messages</a>
            <a className="pill" href="/signup">Join</a>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t">
          <div className="container-default py-3 space-y-2">
            <a className="block text-base" href="/events">Events</a>
            <a className="block text-base" href="/discover">People</a>
            <a className="block text-base" href="/messages">Messages</a>
            <a className="pill inline-block" href="/signup">Join</a>
          </div>
        </div>
      )}
    </header>
  );
}