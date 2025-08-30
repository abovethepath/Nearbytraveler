
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { trackEvent } from "@/lib/analytics";
const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Rotating wisdom sayings above the photo
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = [
    "Every Customer Has a Story.",
    "Connection Drives Commerce.",
    "Local Roots, Global Reach.",
    "Build Relationships, Not Just Sales.",
    "Community Creates Loyalty.",
    "Your Business Shapes Experiences."
  ];
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "Every Customer Has a Story.",
    "Connection Drives Commerce.",
    "Local Roots, Global Reach.",
    "Build Relationships, Not Sales.",
    "Community Creates Loyalty.",
    "Your Business Shapes Lives."
  ];
  
  // Check URL for layout parameter - default to Airbnb style
  const urlParams = new URLSearchParams(window.location.search);
  const isAirbnbStyle = urlParams.get('layout') !== 'centered';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotating wisdom sayings effect
  useEffect(() => {
    const rotateWisdom = () => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    };

    const timeout = setTimeout(rotateWisdom, 10000); // 10 seconds
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>

      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />

      {/* HERO SECTION */}
      <div className="pt-20 pb-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          {isAirbnbStyle ? (
            // Airbnb-style split layout (for professor)
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            {/* Left side - Content */}
            <div className="md:col-span-3 space-y-8">
              <div>
                <div className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-6">
                  <h1>Bring Travelers to Your Doorstep</h1>
                </div>
                <div className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
                  <p>Connect with locals and nearby travelers who are already looking for your products and services</p>
                </div>
              </div>
              
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
              >
                Join the Journey
              </Button>
            </div>
            
            {/* Right side - Hero Image */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              {/* Rotating wisdom sayings above static quote */}
              <div className="mb-1 text-center w-full overflow-hidden relative h-[20px] sm:h-[24px] md:h-[28px]">
                <p 
                  key={currentWisdom}
                  className="absolute top-0 left-0 w-full text-xs md:text-sm font-medium text-zinc-800 dark:text-zinc-200 italic animate-in slide-in-from-right-full fade-in duration-700 px-2"
                >
                  <span className="sm:hidden">{wisdomSayingsMobile[currentWisdom]}</span>
                  <span className="hidden sm:inline">{wisdomSayings[currentWisdom]}</span>
                </p>
              </div>
              
              {/* Static powerful quote */}
              <div className="mb-2 text-center w-full">
                <p className="text-xs md:text-sm font-medium text-zinc-800 dark:text-zinc-200 italic px-2">
                  <span className="sm:hidden">Travel doesn't change you — people do.</span>
                  <span className="hidden sm:inline">Travel doesn't change you — the people you meet do.</span>
                </p>
              </div>
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={businessHeaderPhoto}
                  alt="Business connections and partnerships"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                />
              </div>
              <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                Where Local Experiences Meet Worldwide Connections
              </p>
            </div>
          </div>
          ) : (
            // Original centered layout (for investors)
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
                Bring Travelers to Your Doorstep
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Connect with locals and nearby travelers who are already looking for your products and services
              </p>
              
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
              >
                Join the Journey
              </Button>
            </div>
          )}
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
          className="bg-black hover:bg-gray-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
        >
          Join the Journey
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
                className="bg-black hover:bg-gray-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium py-6 px-8 rounded-lg text-lg shadow-lg transition-all duration-200"
              >
                Join the Journey
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                📈 CREATE OFFERS
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🎉 HOST EVENTS
              </Button>
            </div>
            
            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🍽️ Restaurants
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🏨 Hotels
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl text-sm"
              >
                🎨 Tours
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-2xl text-sm"
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
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-2xl shadow-lg text-black dark:text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Target Real Customers</h3>
              <p className="text-gray-700 dark:text-gray-300">Reach travelers and locals actively seeking authentic experiences in your area. No fake engagement - real people, real connections.</p>
            </div>
            <div className="bg-gray-200 dark:bg-gray-600 p-6 rounded-2xl shadow-lg text-black dark:text-white">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Instant Growth</h3>
              <p className="text-gray-700 dark:text-gray-300">Create time-limited offers and events that attract both tourists and locals. See immediate results from your marketing efforts.</p>
            </div>
            <div className="bg-gray-300 dark:bg-gray-500 p-6 rounded-2xl shadow-lg text-black dark:text-white">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Smart Analytics</h3>
              <p className="text-gray-700 dark:text-gray-300">Access detailed insights about customer engagement and offer performance. Make data-driven decisions to grow your business.</p>
            </div>
          </div>

          {/* Get Started Section - Consolidated */}
          <div className="bg-white dark:bg-gray-800 text-black dark:text-white py-16 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto text-center px-6">
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">Ready to Grow Your Business?</h2>
              <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">Join thousands of businesses already connecting with travelers and locals.</p>
              
              {/* Primary CTA Row */}
              <div className="mb-12 flex justify-center">
                <Button
                  onClick={() => setLocation('/join')}
                  size="lg"
                  className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-green-500 dark:to-teal-500 dark:hover:from-green-600 dark:hover:to-teal-600 text-white border-2 border-gray-300 dark:border-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg transition-all duration-200"
                >
                  Join the Journey
                </Button>
              </div>
              
              {/* Business Types */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-white">Perfect for All Business Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🍽️</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Restaurants</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🏨</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Hotels</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Tours</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🛍️</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Retail</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing Widget */}
        <div className="mt-16 mb-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Simple Business Pricing</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
                <div className="text-5xl font-black text-black dark:text-white mb-2">$50</div>
                <div className="text-xl text-gray-600 dark:text-gray-300 mb-2">per month</div>
                <div className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-4">+ $100 Sign Up Fee</div>
                <div className="bg-gray-600 dark:bg-gray-500 text-white font-bold py-2 px-6 rounded-full text-lg mb-4 inline-block">
                  🎉 FREE DURING BETA
                </div>
                <div className="text-gray-700 dark:text-gray-300 mb-6">
                  <p>✅ Business offers and promotions</p>
                  <p>✅ Event hosting capabilities</p>
                  <p>✅ Direct messaging with customers</p>
                  <p>✅ Analytics dashboard</p>
                  <p>✅ Customer targeting tools</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold text-xl px-12 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
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
                <div className="w-8 h-8 bg-blue-600 dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 rounded-full"></div>
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
