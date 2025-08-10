import { useState } from "react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Logo variant="navbar" />
                <span className="ml-2 text-red-600 dark:text-red-400 text-sm font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">BETA</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
                Events
              </Link>
              <Link href="/business-landing" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                For Businesses
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-3">
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/join" className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out whitespace-nowrap">
              Sign Up
            </Link>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button" 
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 active:scale-95 transition-all duration-200 touch-manipulation"
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
        <div className="sm:hidden bg-white dark:bg-gray-800 shadow-lg">
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
              📅 Events
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
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}