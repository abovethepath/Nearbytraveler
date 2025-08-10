export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <i className="fas fa-map-marker-alt text-primary-400 text-2xl"></i>
              <span className="text-2xl font-bold">Nearby Traveler</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Connecting travelers with locals worldwide. Experience authentic travel through meaningful connections and insider knowledge.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-twitter">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-facebook">
                <i className="fab fa-facebook text-xl"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Platform</h4>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-how-it-works">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-features">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-pricing">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-mobile-app">Mobile App</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-help-center">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-safety">Safety</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors" data-testid="link-contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Nearby Traveler. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="link-terms">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="link-privacy-footer">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors" data-testid="link-cookies">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
