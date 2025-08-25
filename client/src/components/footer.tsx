import Logo from "@/components/logo";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700 dark:border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Main footer content */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
          
          {/* Left side - Logo */}
          <div className="flex flex-col lg:max-w-sm mb-6 lg:mb-0">
            <Logo variant="black-navbar" />
          </div>

          {/* Right side - Links organized in columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 w-full">
            
            {/* Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-white">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">Home</Link></li>
                <li><Link href="/events" className="text-gray-300 hover:text-white transition-colors text-sm">Events</Link></li>
                <li><Link href="/matches" className="text-gray-300 hover:text-white transition-colors text-sm">Connect</Link></li>
                <li><Link href="/discover" className="text-gray-300 hover:text-white transition-colors text-sm">Discover</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-300 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-semibold mb-4 text-white">Contact</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div>
                  <p className="break-words">Aaron@thenearbytraveler.com</p>
                </div>
                <div className="space-y-1">
                  <p>322 Gould Street</p>
                  <p>Sheridan, WY 82801</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-3 sm:pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
            © 2025 Nearby Traveler, Inc. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-1 sm:mt-0">
            <span className="text-gray-500 text-xs">Made with ❤️ for travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}