import { useState } from "react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-red-600 text-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className="transform scale-150">
                  <Logo variant="navbar" />
                </div>
                <span className="ml-8 text-white text-sm font-bold uppercase tracking-wide bg-white/20 px-2 py-1 rounded">BETA</span>
              </Link>
            </div>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
              <Link href="/" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link href="/locals-landing" className="border-transparent text-white/80 hover:border-white/50 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Locals
              </Link>
              <Link href="/travelers-landing" className="border-transparent text-white/80 hover:border-white/50 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Travelers
              </Link>
              <Link href="/events-landing" className="border-transparent text-white/80 hover:border-white/50 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-white/80 hover:border-white/50 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Businesses
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link href="/auth" className="mr-4 bg-white text-red-600 hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
              Sign In
            </Link>
            <Link href="/join" className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
              Join Nearby Traveler
            </Link>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button" 
              className="inline-flex items-center justify-center p-3 rounded-xl text-white hover:text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white active:scale-95 transition-all duration-200 touch-manipulation"
              style={{ minHeight: '48px', minWidth: '48px' }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {!mobileMenuOpen ? (
                <svg className="block h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-red-600 shadow-lg">
          <div className="pt-3 pb-3 space-y-1 px-4">
            <Link href="/" 
              className="bg-white/20 border-l-4 border-white text-white block pl-4 pr-4 py-4 text-lg font-medium rounded-r-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
            <Link href="/locals-landing" 
              className="border-transparent text-white/80 hover:bg-white/10 hover:border-white/30 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              🗺️ For Locals
            </Link>
            <Link href="/travelers-landing" 
              className="border-transparent text-white/80 hover:bg-white/10 hover:border-white/30 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✈️ For Travelers
            </Link>
            <Link href="/events-landing" 
              className="border-transparent text-white/80 hover:bg-white/10 hover:border-white/30 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              📅 Events
            </Link>
            <Link href="/business-landing" 
              className="border-transparent text-white/80 hover:bg-white/10 hover:border-white/30 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              💼 For Businesses
            </Link>
          </div>
          <div className="pt-4 pb-6 border-t border-white/20 px-4">
            <div className="flex flex-col space-y-3">
              <Link href="/auth" 
                className="bg-white text-red-600 hover:bg-white/90 text-center px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/join" 
                className="bg-orange-500 hover:bg-orange-600 text-black text-center px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Nearby Traveler
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}