
import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      
      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />

      {/* HERO SECTION */}
      <div className="relative z-0">
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-orange-500 shadow-lg">
          <div className="relative bg-white dark:bg-gray-900 pb-32 overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 h-full min-h-[400px]">
              <img
                src={businessHeaderPhoto}
                alt="Business connections and partnerships"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.5), rgba(255,255,255,0.1))"
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 dark:block hidden"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.4), rgba(0,0,0,0.2))"
                }}
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white">
                          Grow Your Business. Meet <span className="text-white">Locals</span> and <span className="text-white">Nearby Travelers</span> Who Are Already Looking for Your Products or Services.
                        </span>
                      </h1>
                      
                      
                      {/* Hero CTA */}
                      <div className="mt-8">
                        <Button
                          onClick={() => setLocation('/join')}
                          size="lg"
                          className="bg-black hover:bg-gray-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 animate-pulse-glow"
                        >
                          Start Reaching Customers
                        </Button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Travelers and locals are searching for real local experiences, products, and services. With Nearby Traveler, your business gets discovered the moment interest strikes.
            </p>
            <div className="mt-4 text-center">
              <p className="text-gray-900 dark:text-white font-bold text-lg">— Smart Business, Real Impact</p>
              <p className="text-orange-400 text-sm">Join forward-thinking businesses growing through authentic connections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse border-4 border-white"
        >
          💼 JOIN BUSINESS
        </Button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        
        {/* Multiple CTA Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Grow Your Business?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Choose how you want to connect with travelers and locals!</p>
            
            {/* Primary CTA Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🏢 JOIN AS BUSINESS
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                📈 CREATE OFFERS
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🎉 HOST EVENTS
              </Button>
            </div>
            
            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🍽️ Restaurants
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🏨 Hotels
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🎨 Tours
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🛍️ Retail
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-16 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Why Join Nearby Traveler Business Network?</h2>
          <ul className="list-disc list-inside text-lg text-gray-700 dark:text-gray-200 space-y-2">
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">1. Register</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create your business profile and showcase what makes you special.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">2. Connect</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Reach travelers and locals actively seeking your services.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">3. Grow</h3>
              <p className="text-gray-600 dark:text-gray-300">
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
            <div className="bg-orange-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">Target Real Customers</h3>
              <p className="text-white">Reach travelers and locals actively seeking authentic experiences in your area. No fake engagement - real people, real connections.</p>
            </div>
            <div className="bg-teal-600 p-6 rounded-2xl shadow-lg text-white">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-white">Instant Growth</h3>
              <p className="text-white">Create time-limited offers and events that attract both tourists and locals. See immediate results from your marketing efforts.</p>
            </div>
            <div className="bg-orange-700 p-6 rounded-2xl shadow-lg text-white">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Analytics</h3>
              <p className="text-white">Access detailed insights about customer engagement and offer performance. Make data-driven decisions to grow your business.</p>
            </div>
          </div>

          {/* Get Started Section - Consolidated */}
          <div className="bg-gradient-to-r from-orange-600 to-blue-600 text-white py-16 rounded-2xl shadow-2xl">
            <div className="max-w-4xl mx-auto text-center px-6">
              <h2 className="text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
              <p className="text-xl mb-8 opacity-90">Join thousands of businesses already connecting with travelers and locals.</p>
              
              {/* Primary CTA Row */}
              <div className="mb-12 flex justify-center">
                <Button
                  onClick={() => setLocation('/join')}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-2 border-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  📈 Start Free Trial
                </Button>
              </div>
              
              {/* Business Types */}
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-white">Perfect for All Business Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🍽️</div>
                    <p className="text-white/90 font-medium">Restaurants</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🏨</div>
                    <p className="text-white/90 font-medium">Hotels</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <p className="text-white/90 font-medium">Tours</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🛍️</div>
                    <p className="text-white/90 font-medium">Retail</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing Widget */}
        <div className="mt-16 mb-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white p-8 rounded-2xl shadow-2xl border-4 border-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Simple Business Pricing</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="text-5xl font-black text-white mb-2">$50</div>
                <div className="text-xl text-white/90 mb-2">per month</div>
                <div className="text-2xl font-bold text-orange-200 mb-4">+ $100 Sign Up Fee</div>
                <div className="bg-green-500 text-white font-bold py-2 px-6 rounded-full text-lg mb-4 inline-block">
                  🎉 FREE DURING BETA
                </div>
                <div className="text-white/80 mb-6">
                  <p>✅ Business offers and promotions</p>
                  <p>✅ Event hosting capabilities</p>
                  <p>✅ Direct messaging with customers</p>
                  <p>✅ Analytics dashboard</p>
                  <p>✅ Customer targeting tools</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-xl px-12 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🚀 Start FREE Beta Now
              </Button>
            </div>
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
