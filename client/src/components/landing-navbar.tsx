import { useState } from "react";
import { Link, useLocation } from "wouter";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <nav className="bg-transparent relative z-10 block w-full" style={{display: 'block', visibility: 'visible', minHeight: '64px'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4" style={{display: 'flex', minHeight: '64px'}}>
          
          {/* Logo Section - Fixed Width */}
          <div className="flex-shrink-0 flex items-center justify-start" style={{display: 'flex', alignItems: 'center'}}>
            <Link href="/" className="flex items-center text-left">
              <div className="transform scale-100 sm:scale-110 pt-2">
                <Logo variant="navbar" />
              </div>
            </Link>
          </div>

          {/* Navigation Links - Flexible Width with Smart Sizing */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
            <div className="flex space-x-1 xl:space-x-2 2xl:space-x-4">
              <Link href="/" className="border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:text-gray-900 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Home
              </Link>
              <Link href="/locals-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Locals
              </Link>
              <Link href="/travelers-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Travelers
              </Link>
              <Link href="/events-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Business
              </Link>
              <Link href="/cs" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Couchsurfer
              </Link>
            </div>
          </div>

          {/* CTA Buttons - Fixed Width, Always Right */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />
            <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full font-medium">
              Beta Launch
            </span>
            <button 
              onClick={() => setLocation('/signin')}
              className="bg-gray-100 dark:bg-blue-600 hover:bg-gray-200 dark:hover:bg-blue-700 text-black dark:text-white border-2 border-gray-300 dark:border-transparent px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap"
            >
              Sign In
            </button>
            <button 
              onClick={() => setLocation('/launching-soon')}
              className="bg-orange-500 dark:bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-600 text-white dark:text-white border-2 border-orange-500 dark:border-orange-500 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap"
            >
              Join Now
            </button>
          </div>

          {/* Mobile Menu Button with Beta Badge */}
          <div className="flex items-center lg:hidden gap-2">
            <ThemeToggle />
            <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full font-medium">
              Beta Launch
            </span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🍔 Hamburger clicked, current state:', mobileMenuOpen);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              type="button" 
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 active:scale-95 transition-all duration-200 touch-manipulation bg-gray-50 relative z-50"
              style={{ minHeight: '48px', minWidth: '48px', display: 'flex', visibility: 'visible' }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              data-testid="mobile-menu-button"
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
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-lg max-h-screen overflow-y-auto">
          <div className="pt-3 pb-3 space-y-1 px-4">
            <Link href="/" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
            <Link href="/locals-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={(e) => {
                console.log('🗺️ Locals link clicked!');
                setMobileMenuOpen(false);
              }}
              data-testid="mobile-locals-link"
            >
              🗺️ For Locals
            </Link>
            <Link href="/travelers-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✈️ For Travelers
            </Link>
            <Link href="/events-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              📅 For Events
            </Link>
            <Link href="/business-landing" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              💼 For Businesses
            </Link>
            <Link href="/cs" 
              className="border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 block pl-3 pr-3 py-2 border-l-4 text-sm font-medium rounded-r-lg transition-all duration-200 touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              🛋️ Couchsurfer
            </Link>
          </div>
          <div className="pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 px-4">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLocation('/launching-soon');
                }}
                className="bg-orange-500 dark:bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-600 text-white dark:text-white border-2 border-orange-500 dark:border-orange-500 text-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation mb-2"
              >
                Join Now
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLocation('/signin');
                }}
                className="bg-gray-100 dark:bg-blue-600 hover:bg-gray-200 dark:hover:bg-blue-700 text-black dark:text-white border-2 border-gray-300 dark:border-transparent text-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom CSS for ultra-wide screen handling */}
      <style>{`
        /* Ensure proper spacing on ultra-wide screens */
        @media (min-width: 1920px) {
          .navbar-container {
            max-width: 1800px;
            margin: 0 auto;
          }
        }
        
        /* Fine-tune navigation spacing for different screen sizes */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .nav-links {
            gap: 0.25rem;
          }
        }
        
        @media (min-width: 1280px) and (max-width: 1535px) {
          .nav-links {
            gap: 0.5rem;
          }
        }
        
        @media (min-width: 1536px) {
          .nav-links {
            gap: 1rem;
          }
        }
      `}</style>
    </nav>
  );
}