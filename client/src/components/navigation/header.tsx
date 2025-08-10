import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-map-marker-alt text-primary-600 text-xl"></i>
              <span className="text-xl font-bold text-gray-900">Nearby Traveler</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-primary-600 font-medium" data-testid="link-discover">
              Discover
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 font-medium" data-testid="link-events">
              Events
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 font-medium" data-testid="link-plan-trip">
              Plan Trip
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 font-medium" data-testid="link-business">
              Business
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-signup-local"
            >
              Sign Up as Local
            </Button>
            <Button 
              variant="ghost"
              className="text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Login
            </Button>
            <button className="md:hidden text-gray-700" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
