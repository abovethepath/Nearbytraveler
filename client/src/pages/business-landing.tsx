
import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingNavbar from "@/components/landing-navbar";
const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      
      {/* Orange announcement banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-black py-2 px-4">
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <div className="flex-1 text-center">
            <span className="font-bold text-lg">🔥 Connect with Locals and Travelers TODAY - Sign Up Now!</span>
          </div>
          <Button
            onClick={() => setLocation('/join')}
            className="bg-black text-orange-400 font-bold px-6 py-2 rounded-lg hover:bg-gray-800 ml-4"
          >
            SIGN UP NOW
          </Button>
        </div>
      </div>

      {/* Landing Navbar */}
      <header className="sticky top-12 z-[55] bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
        <div className="pt-2">
          <LandingNavbar />
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src={businessHeaderPhoto}
                alt="Business connections and partnerships"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Nearby Traveler for Businesses</span>
                      </h1>
                      
                      {/* Subhead */}
                      <div className="mt-8">
                        <p className="text-xl sm:text-2xl leading-relaxed max-w-3xl mx-auto">
                          <span className="text-orange-300">Reach real customers</span>{' '}
                          <span className="text-white">and</span>{' '}
                          <span className="text-blue-300" style={{border: 'none', outline: 'none', boxShadow: 'none'}}>build lasting relationships</span>{' '}
                          <span className="text-black bg-orange-400 px-2 py-1 rounded">today!</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">

        <section className="mt-16 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Why Join Nearby Traveler Business Network?</h2>
          <ul className="list-disc list-inside text-lg text-white sm:text-gray-700 sm:dark:text-gray-200 space-y-2">
            <li>Reach travelers who are actively exploring your area and looking for authentic local experiences.</li>
            <li>Search and directly target locals and travelers in your area to market your offers and deals to those who express specific interests.</li>
            <li>Create time-limited offers and deals that attract both tourists and locals to your business.</li>
            <li>Host events to showcase your services and build community connections.</li>
            <li>Access detailed analytics about customer engagement and offer performance.</li>
            <li>Build lasting relationships with customers who will recommend you to fellow travelers.</li>
          </ul>
        </section>

        <section className="mt-12 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">1. Register</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Create your business profile and showcase what makes you special.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">2. Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Reach travelers and locals actively seeking your services.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">3. Grow</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Build lasting relationships and grow your customer base.
              </p>
            </div>
          </div>
        </section>

        {/* What Makes Business Special Section */}
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            What Makes Nearby Traveler Special for Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">Target Real Customers</h3>
              <p className="text-white">Reach travelers and locals actively seeking authentic experiences in your area. No fake engagement - real people, real connections.</p>
            </div>
            <div className="bg-teal-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-white">Instant Growth</h3>
              <p className="text-white">Create time-limited offers and events that attract both tourists and locals. See immediate results from your marketing efforts.</p>
            </div>
            <div className="bg-orange-700 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Analytics</h3>
              <p className="text-white">Access detailed insights about customer engagement and offer performance. Make data-driven decisions to grow your business.</p>
            </div>
          </div>

          {/* Business Types */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Perfect for All Types of Businesses</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">🍽️</div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Restaurants & Cafes</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🏨</div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Hotels & Lodging</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎨</div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Tours & Activities</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🛍️</div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Retail & Shopping</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-orange-500 text-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>Simple, Transparent Pricing</h2>
          <div className="text-6xl font-bold mb-2">$50</div>
          <div className="text-xl mb-4">per month + $100 sign-up fee</div>
          <div className="text-3xl font-bold mb-6 bg-white bg-opacity-20 px-8 py-4 rounded-full inline-block">
            Currently FREE during beta
          </div>
          <ul className="text-lg space-y-2 mb-6">
            <li>✓ Monthly deal limits</li>
            <li>✓ Event hosting capabilities</li>
            <li>✓ Analytics dashboard</li>
            <li>✓ Customer messaging</li>
            <li>✓ Priority support</li>
          </ul>
          <div className="flex justify-center">
            <a
              href="/signup-business"
              className="px-8 py-3 bg-blue-600 text-black font-bold rounded-lg shadow-lg hover:scale-105 transition"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Nearby Traveler</span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Connecting travelers and locals worldwide through authentic experiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">For Businesses</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/business-registration" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Register Business</a></li>
                <li><a href="/business-dashboard" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="/business-offers" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Business Offers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Support</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/about" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="/terms" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
                <li><a href="/privacy" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Connect</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/auth" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</a></li>
                <li><a href="/signup-business" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Join as Business</a></li>
                <li><a href="/events-landing" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Events</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Nearby Traveler. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
