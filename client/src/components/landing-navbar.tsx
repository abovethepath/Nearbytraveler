import { useState } from "react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-transparent relative z-10 block w-full" style={{display: 'block', visibility: 'visible', minHeight: '64px'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16" style={{display: 'flex', minHeight: '64px'}}>
          <div className="flex min-w-0 flex-1">
            <div className="flex-shrink-0 flex items-center" style={{display: 'flex', alignItems: 'center'}}>
              <Link href="/" className="flex items-center">
                <div className="transform scale-125 sm:scale-150">
                  <Logo variant="navbar" />
                </div>
                <span className="ml-4 sm:ml-8 text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">BETA</span>
              </Link>
            </div>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-4 xl:space-x-6">
              <Link href="/" className="border-teal-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link href="/locals-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap">
                For Locals
              </Link>
              <Link href="/travelers-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap">
                For Travelers
              </Link>
              <Link href="/events-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap">
                For Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap">
                For Businesses
              </Link>
            </div>
          </div>
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-3 flex-shrink-0">
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/join" className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap">
              Join Now
            </Link>
          </div>
          <div className="-mr-2 flex items-center lg:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button" 
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 active:scale-95 transition-all duration-200 touch-manipulation bg-gray-50"
              style={{ minHeight: '48px', minWidth: '48px', display: 'flex', visibility: 'visible' }}
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
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-lg">
          <div className="pt-3 pb-3 space-y-1 px-4">
            <Link href="/" 
              className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 block pl-4 pr-4 py-4 text-lg font-medium rounded-r-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
            <Link href="/locals-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              🗺️ For Locals
            </Link>
            <Link href="/travelers-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✈️ For Travelers
            </Link>
            <Link href="/events-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              📅 For Events
            </Link>
            <Link href="/business-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-4 pr-4 py-4 border-l-4 text-lg font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              💼 For Businesses
            </Link>
          </div>
          <div className="pt-4 pb-6 border-t border-gray-200 dark:border-gray-700 px-4">
            <div className="flex flex-col space-y-3">
              <Link href="/auth" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/join" 
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-center px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
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