import Logo from "@/components/logo";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Main footer content */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          
          {/* Left side - Logo */}
          <div className="flex flex-col lg:max-w-sm">
            <Logo variant="black-navbar" />
          </div>

          {/* Right side - Links organized in columns - moved closer to logo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 lg:ml-12">
            
            {/* Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Platform</h3>
              <ul className="space-y-1">
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">Home</Link></li>
                <li><Link href="/events" className="text-gray-300 hover:text-white transition-colors text-sm">Events</Link></li>
                <li><Link href="/matches" className="text-gray-300 hover:text-white transition-colors text-sm">Connect</Link></li>
                <li><Link href="/discover" className="text-gray-300 hover:text-white transition-colors text-sm">Discover</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Company</h3>
              <ul className="space-y-1">
                <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-300 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Contact</h3>
              <div className="space-y-1 text-gray-400 text-sm">
                <p>Aaron@thenearbytraveler.com</p>
                <div>
                  <p>32 Gould Street</p>
                  <p>Sheridan, WY 82801</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-800 mt-4 pt-2 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Nearby Traveler, Inc. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span className="text-gray-500 text-xs">Made with ❤️ for travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}