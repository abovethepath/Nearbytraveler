import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <nav className="bg-transparent relative z-10 block w-full" style={{display: 'block', visibility: 'visible', minHeight: '64px'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-auto gap-4" style={{display: 'flex', minHeight: '64px'}}>
          
          {/* Logo removed from landing navbar */}
          <div className="flex-shrink-0" />

          {/* Navigation Links - Flexible Width with Smart Sizing */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
            <div className="flex space-x-1 xl:space-x-2 2xl:space-x-4">
              <Link href="/" className="border-transparent text-gray-700 dark:text-white hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-200 inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Home
              </Link>
              <Link href="/locals-landing" className="border-transparent text-gray-500 dark:text-gray-200 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Locals
              </Link>
              <Link href="/travelers-landing" className="border-transparent text-gray-500 dark:text-gray-200 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Travelers
              </Link>
              <Link href="/events-landing" className="border-transparent text-gray-500 dark:text-gray-200 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-gray-500 dark:text-gray-200 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
                Business
              </Link>
              <Link href="/cs" className="border-transparent text-gray-500 dark:text-gray-200 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0">
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
              onClick={() => setLocation('/join')}
              className="navbar-btn-black-text px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap border-2"
              style={{ backgroundColor: '#fb923c', borderColor: '#fb923c' }}
            >
              Sign Up
            </button>
          </div>

          <div className="flex items-center lg:hidden gap-2">
            <ThemeToggle />
            <span className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full font-medium">
              Beta
            </span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              type="button" 
              className="flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
              style={{ width: '44px', height: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              data-testid="mobile-menu-button"
            >
              {!mobileMenuOpen ? (
                <svg className="block" width="22" height="22" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg width="22" height="22" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="lg:hidden shadow-lg max-h-screen overflow-y-auto" style={{ background: 'rgba(255,255,255,0.98)', WebkitOverflowScrolling: 'touch' }}>
          <div className="pt-2 pb-2 space-y-0.5 px-3">
            {[
              { href: "/", label: "Home", icon: "🏠" },
              { href: "/locals-landing", label: "For Locals", icon: "🗺️" },
              { href: "/travelers-landing", label: "For Travelers", icon: "✈️" },
              { href: "/events-landing", label: "For Events", icon: "📅" },
              { href: "/business-landing", label: "For Businesses", icon: "💼" },
              { href: "/cs", label: "Couchsurfer", icon: "🛋️" },
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="flex items-center gap-3 px-4 py-3 text-[15px] text-gray-900 dark:text-gray-900 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                style={{ minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="pt-2 pb-4 border-t border-gray-200/60 dark:border-gray-700/60 px-3">
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setLocation('/join');
              }}
              className="w-full text-center px-4 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Sign Up
            </button>
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