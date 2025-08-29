import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, Plane, Building2, Handshake } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force light mode when component mounts (like yesterday)
  useEffect(() => {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }, [setTheme]);

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-black dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 hover:bg-gray-800 dark:hover:from-blue-700 dark:hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold border border-gray-300 dark:border-none"
        >
          Join Now
        </Button>
      </div>

      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION - With Original Photo */}
        <div className="relative z-10">
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-orange-500 shadow-lg rounded-lg">
            <div className="relative bg-white dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 h-full min-h-[600px]">
                <img
                  src="/travelers together hugging_1754971726997.avif"
                  alt="Travel experience"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 70%' }}
                />
                <div
                  className="absolute inset-0 dark:bg-gradient-to-b dark:from-black/55 dark:via-black/25 dark:to-transparent"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.5), rgba(255,255,255,0.1))"
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                  <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32 mx-auto max-w-full px-4">
                    <div className="text-center">
                      <div className="max-w-4xl mx-auto">
                        <h1 className="px-3 leading-tight sm:leading-snug" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          <span className="block font-bold text-[clamp(1.5rem,6vw,2.25rem)] text-black dark:text-white" style={{ fontWeight: '700', textShadow: 'none', letterSpacing: '-0.02em' }}>
                            Skip the Tourist Traps, Connect Before Your Trip, Keep Connections Forever and Create Lifelong Friends!!!
                          </span>
                          <span className="block font-bold text-[clamp(1.25rem,5.5vw,2rem)] mt-4" style={{ fontWeight: '700', textShadow: '1px 1px 3px rgba(0,0,0,0.7)', letterSpacing: '-0.02em' }}>
                            <span className="text-black dark:text-amber-300 dark:sm:text-orange-500">Meet Locals and Other </span>
                            <span className="text-black dark:text-blue-300 dark:sm:text-blue-600">Nearby Travelers </span>
                            <span className="text-black dark:text-white">Right Now, Today!!!</span>
                          </span>
                        </h1>
                        
                        {/* Primary signup CTA - Lowered and reasonably sized */}
                        <div className="mt-32 mb-8 px-4">
                          <Button
                            onClick={() => {
                              trackEvent('signup_cta_click', 'landing_page', 'main_hero_button');
                              setLocation('/join');
                            }}
                            size="lg"
                            className="bg-black dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 hover:bg-gray-800 dark:hover:from-blue-700 dark:hover:to-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 border-2 border-gray-300 dark:border-white max-w-md mx-auto"
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            }}
                          >
                            JOIN NEARBY TRAVELER NOW
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


        {/* FOUNDER QUOTE HIGHLIGHT */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-8">
          {/* Clean background for light mode */}
          <div className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-orange-500"></div>
          
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 dark:border-none">
              <blockquote className="text-lg sm:text-xl text-black dark:text-white leading-relaxed mb-4 text-center font-medium">
                "I was tired of touring cities alone while amazing people walked past me every day. Travelers spend billions on flights, hotels, and tours — yet the most valuable part of a trip, the people you meet, is left to chance."
              </blockquote>
              <div className="text-center">
                <p className="text-black dark:text-gray-300 font-semibold">
                  — Aaron Lefkowitz, Founder Nearby Traveler, Inc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FROM THE FOUNDER SECTION - Original with 3 Icons */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-16">
          {/* Clean background for light mode */}
          <div className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-orange-500"></div>
          
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '900', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.02em' }}>
                From the Founder
              </h2>
              <div className="w-24 h-1 bg-black dark:bg-gradient-to-r dark:from-white dark:to-blue-300 mx-auto rounded-full"></div>
            </div>
            
            {/* Main content with better readability */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-lg sm:text-xl text-black dark:text-white leading-relaxed font-medium mb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '500', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.01em' }}>
                  "After 15 years of hosting 400+ travelers from 50 countries, I saw first-hand how one single connection can change everything."
                </p>
                <p className="text-lg sm:text-xl text-black dark:text-white leading-relaxed font-medium mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '500', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.01em' }}>
                  "I built Nearby Traveler to make those connections possible for everyone — travelers and locals alike."
                </p>
                <p className="text-2xl sm:text-3xl text-black dark:text-orange-300 font-black leading-tight mb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '900', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.02em', textShadow: 'none' }}>
                  "I BUILT THE SOLUTION I WISHED EXISTED."
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-gray-200 dark:border-none">
                <p className="text-lg text-black dark:text-white leading-relaxed mb-6 text-center font-medium">
                  Nearby Traveler connects travelers and locals through shared interests, activities, demographics, and events—transforming random encounters into life-changing connections.
                </p>
                
                {/* Benefits with orange and blue theme */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-gray-300 dark:border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">🤝</div>
                    <p className="font-bold text-black dark:text-white text-sm">Connect with like-minded people</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-gray-300 dark:border-blue-300 shadow-lg">
                    <div className="text-3xl mb-3">💎</div>
                    <p className="font-bold text-black dark:text-white text-sm">Discover hidden gems</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-gray-300 dark:border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">✨</div>
                    <p className="font-bold text-black dark:text-white text-sm">Create unforgettable memories</p>
                  </div>
                </div>
                
                <p className="text-lg text-black dark:text-white leading-relaxed text-center mb-6 font-medium">
                  It's more than just travel—it's about real community, wherever you are.
                </p>
                
                {/* Founder signature with orange and blue accents */}
                <div className="text-center pt-6 border-t border-gray-300 dark:border-blue-600">
                  <p className="text-lg text-black dark:text-gray-200 mb-3 font-medium">Thanks for being part of the journey.</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div>
                      <p className="text-xl font-black text-black dark:text-white">Aaron Lefkowitz</p>
                      <p className="text-black dark:text-blue-600 font-bold">Founder, Nearby Traveler, Inc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Experiences - With Original Photos */}
        <div className="relative z-10 py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-normal px-2">
                Real Connections Happen Here
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-2">
                ✨ See how our community turns strangers into lifelong friends:
              </p>
            </div>
            
            {/* Event Cards - Original Style with Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-12">

              {/* Beach Bonfire Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                  <img 
                    src="/event page bbq party_1753299541268.png" 
                    alt="Beach bonfire event" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sunset gathering on the beach</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-8 flex-grow leading-relaxed">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>
              
              {/* Taco Tuesday Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                  <img 
                    src="/image_1754973365104.png" 
                    alt="Authentic taco stand with vintage neon sign" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Tuesday • $1.50 tacos</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$1.50</span>
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-8 flex-grow leading-relaxed">Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>
              
              {/* Hollywood Sign Hike Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                  <img 
                    src="/image_1754974796221.png" 
                    alt="Hollywood Sign at sunrise with mountain views" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Hollywood Sign Hike</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Saturday • 9:00 AM</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Hiking</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-8 flex-grow">Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>

            </div>

            <div className="text-center">
              <Button 
                onClick={() => setLocation('/events')}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950"
              >
                See All Events
              </Button>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS SECTION - Original Blue/Orange Design */}
        <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-orange-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-800 text-sm font-bold rounded-full mb-4">
                HOW IT WORKS
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                Turn Travel into <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Real Connections</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Three simple steps that transform your travel experience from ordinary to extraordinary
              </p>
            </div>
            
            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                <div className="h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 rounded-full opacity-30"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {/* Step 1: Join */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-blue-800">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <span className="text-white text-2xl font-black">1</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Start Your Journey
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                      Share your interests and where you're traveling. We connect you with locals and travelers who share your vibe—whether for business or pleasure.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Connect */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-purple-100 dark:border-purple-800">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <span className="text-white text-2xl font-black">2</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Make Real Connections
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                      Chat with locals who know secret spots and fellow travelers heading to your destination. No awkward small talk - just shared adventures.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Explore */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-orange-100 dark:border-orange-800">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <span className="text-white text-2xl font-black">3</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Create Epic Memories
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                      Join authentic experiences, discover hidden gems, and turn strangers into lifelong friends. This is travel the way it's meant to be.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Button 
                onClick={() => setLocation('/auth')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Start Your Adventure Now
              </Button>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Join thousands of travelers already making connections
              </p>
            </div>
          </div>
        </div>

        {/* Everyone Welcome Section */}
        <section className="py-12 sm:py-16 lg:py-20 mb-8 sm:mb-12 lg:mb-16 bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl sm:rounded-3xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                Everyone's <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Welcome Here</span>
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
                No matter who you are or why you're traveling - this is your community for making real connections
              </p>
            </div>

            {/* Dynamic Story Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Solo Traveler */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:to-blue-600 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">✈️</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Solo Traveler?</h3>
                <p className="text-black dark:text-blue-100 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">Turn that lonely hotel room into lifelong friendships. Meet locals who'll show you their secret spots and fellow travelers who get your wanderlust.</p>
                <Button 
                  onClick={() => setLocation('/travelers-landing')}
                  className="bg-black dark:bg-white text-white dark:text-blue-600 hover:bg-gray-800 dark:hover:bg-blue-50 font-bold w-full border border-gray-300"
                >
                  Find Your Travel Crew
                </Button>
              </div>

              {/* Local */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-green-500 dark:to-teal-600 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">🏠</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Love Your City?</h3>
                <p className="text-black dark:text-green-100 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">Share your favorite coffee shop, that hidden beach, or weekly trivia night. Turn your hometown knowledge into amazing new friendships.</p>
                <Button 
                  onClick={() => setLocation('/locals-landing')}
                  className="bg-black dark:bg-white text-white dark:text-green-600 hover:bg-gray-800 dark:hover:bg-green-50 font-bold w-full border border-gray-300"
                >
                  Share Your World
                </Button>
              </div>

              {/* Business Traveler */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-orange-500 dark:to-red-600 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">💼</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Traveling for Work?</h3>
                <p className="text-black dark:text-orange-100 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">Turn boring business trips into networking goldmines. Meet professionals, find conference buddies, or just grab dinner with cool people.</p>
                <Button 
                  onClick={() => setLocation('/networking-landing')}
                  className="bg-black dark:bg-white text-white dark:text-orange-600 hover:bg-gray-800 dark:hover:bg-orange-50 font-bold w-full border border-gray-300"
                >
                  Network Like a Pro
                </Button>
              </div>

              {/* Business Owner */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-purple-500 dark:to-pink-600 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">🎯</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Run a Business?</h3>
                <p className="text-black dark:text-purple-100 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">Whether you own a bar, café, or co-working space - connect with travelers and locals looking for authentic experiences at your spot.</p>
                <Button 
                  onClick={() => setLocation('/business-landing')}
                  className="bg-black dark:bg-white text-white dark:text-purple-600 hover:bg-gray-800 dark:hover:bg-purple-50 font-bold w-full border border-gray-300"
                >
                  Grow Your Community
                </Button>
              </div>

              {/* Event Lover */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-600 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">🎉</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Love Events?</h3>
                <p className="text-black dark:text-indigo-100 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">From beach bonfires to art gallery walks - discover events you'd never find on tourist sites and meet people who share your interests.</p>
                <Button 
                  onClick={() => setLocation('/events-landing')}
                  className="bg-black dark:bg-white text-white dark:text-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-50 font-bold w-full border border-gray-300"
                >
                  Find Your Scene
                </Button>
              </div>

              {/* Anyone Else */}
              <div className="group relative bg-white dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 p-6 sm:p-8 rounded-2xl text-black dark:text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-300 dark:border-none">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-3xl opacity-80">🌟</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 pr-8">Just Want Friends?</h3>
                <p className="text-black dark:text-gray-200 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">New to town? Feeling lonely? Want to try something new? Everyone needs community - and that's exactly what we're here for.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="bg-black dark:bg-white text-white dark:text-gray-700 hover:bg-gray-800 dark:hover:bg-gray-50 font-bold w-full border border-gray-300"
                >
                  Start Connecting
                </Button>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center">
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-4">
                Whatever brings you here, you belong here. 
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Join Your People Today
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 sm:py-16 bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 text-black dark:text-white rounded-2xl mb-8 sm:mb-16 border-2 border-gray-300 dark:border-none">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Start Your Adventure</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 px-4">Join thousands of locals, travelers, and businesses already making real connections.</p>
            <Button 
              onClick={() => setLocation('/join')}
              className="bg-black dark:bg-white text-white dark:text-blue-600 hover:bg-gray-800 dark:hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105 border border-gray-300"
            >
              Join Nearby Traveler Now
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}