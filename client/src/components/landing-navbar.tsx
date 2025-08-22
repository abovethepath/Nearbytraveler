import { useEffect, useState } from "react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scroll while mobile menu is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className="bg-white dark:bg-gray-800 shadow-sm relative z-[60] block w-full"
      style={{ minHeight: 64 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* left */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className="transform scale-125 sm:scale-150">
                  <Logo variant="navbar" />
                </div>
              </Link>
            </div>

            <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
              <Link href="/" className="border-teal-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link href="/locals-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Locals
              </Link>
              <Link href="/travelers-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Travelers
              </Link>
              <Link href="/events-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Businesses
              </Link>
            </div>
          </div>

          {/* right */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link href="/auth" className="mr-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
              Sign In
            </Link>
            <Link href="/join" className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition">
              Join Nearby Traveler
            </Link>
          </div>

          {/* hamburger */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              type="button"
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-gray-50"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {!mobileMenuOpen ? (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              ) : (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* full-screen mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <Logo variant="navbar" />
                <span className="sr-only">Nearby Traveler</span>
              </Link>
              <button
                className="p-2 rounded-lg bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close"
              >
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block text-white/90 text-lg p-3 rounded-lg hover:bg-white/10">🏠 Home</Link>
              <Link href="/locals-landing" onClick={() => setMobileMenuOpen(false)} className="block text-white/90 text-lg p-3 rounded-lg hover:bg-white/10">🗺️ For Locals</Link>
              <Link href="/travelers-landing" onClick={() => setMobileMenuOpen(false)} className="block text-white/90 text-lg p-3 rounded-lg hover:bg-white/10">✈️ For Travelers</Link>
              <Link href="/events-landing" onClick={() => setMobileMenuOpen(false)} className="block text-white/90 text-lg p-3 rounded-lg hover:bg-white/10">🎪 For Events</Link>
              <Link href="/business-landing" onClick={() => setMobileMenuOpen(false)} className="block text-white/90 text-lg p-3 rounded-lg hover:bg-white/10">💼 For Businesses</Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">Sign In</Link>
              <Link href="/join" onClick={() => setMobileMenuOpen(false)} className="text-center bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold">Join Nearby Traveler</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}