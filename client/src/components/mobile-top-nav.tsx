import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import Logo from "@/components/logo";

export default function MobileTopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation - FORCED VISIBLE */}
      <nav className="sticky top-0 z-40 bg-red-600 border-b-4 border-black shadow-2xl block" style={{ display: 'block !important' }}>
        <div className="flex items-center justify-between h-16 px-4 bg-red-600">
          <Link href="/" className="flex items-center">
            <div className="text-white font-bold text-xl">NEARBY TRAVELER</div>
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-white hover:text-yellow-200 hover:bg-red-700 transition-colors touch-manipulation font-bold"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="px-4 py-3 space-y-3">
              <Link 
                href="/locals-landing" 
                className="block py-2 text-gray-700 dark:text-gray-300 font-medium touch-manipulation"
                onClick={() => setIsOpen(false)}
              >
                For Locals
              </Link>
              <Link 
                href="/travelers-landing" 
                className="block py-2 text-gray-700 dark:text-gray-300 font-medium touch-manipulation"
                onClick={() => setIsOpen(false)}
              >
                For Travelers
              </Link>
              <Link 
                href="/events-landing" 
                className="block py-2 text-gray-700 dark:text-gray-300 font-medium touch-manipulation"
                onClick={() => setIsOpen(false)}
              >
                Events
              </Link>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <Link
                  href="/auth"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/join"
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-center py-3 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  JOIN NOW
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}