import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import Logo from "@/components/logo";

export default function MobileTopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center">
            <div className="transform scale-125">
              <Logo variant="navbar" />
            </div>
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
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
                  className="block w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-center py-3 rounded-lg font-medium transition-colors touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}