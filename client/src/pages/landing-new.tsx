import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { useTheme } from "@/components/theme-provider";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans" key="landing-optimized">
      {/* Fixed CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/launching-soon')}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-2xl transition-all duration-200"
          style={{
            boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9)',
            animation: 'gentle-pulse 2.5s ease-in-out infinite',
          }}
          data-testid="button-fixed-cta"
        >
          JOIN NOW
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />

      {/* HERO SECTION */}
      <div className="relative z-10">
        <div className="bg-gray-800 border-4 border-orange-500 shadow-lg">
          <div className="relative bg-gray-800 pb-32 overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 h-full min-h-[500px]">
              <img
                src="/travelers together hugging_1754971726997.avif"
                alt="Travel experience"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0))"
                }}
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32 mx-auto max-w-full px-4">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white">
                          Skip Tourist Traps. Connect Before You Go.
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]">
                          <span className="text-amber-300 sm:text-orange-500">Meet Locals & </span>
                          <span className="text-blue-300 sm:text-blue-600">Travelers </span>
                          <span className="text-white">Today!</span>
                        </span>
                      </h1>
                      
                      {/* Condensed Founder Quote */}
                      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-sm sm:text-base md:text-xl text-white leading-relaxed px-1 sm:px-2">
                          <span className="text-orange-300 font-bold">"I've hosted 400+ travelers from 50+ countries. </span>
                          <span className="text-white">Nearby Traveler brings that same magic to everyone."</span>
                        </p>
                        <div className="mt-3 sm:mt-4 text-center">
                          <p className="text-white font-bold text-base sm:text-lg">— Aaron, Founder</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary CTA */}
                    <div className="mt-12 mb-8 px-4">
                      <Button
                        onClick={() => setLocation('/launching-soon')}
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-all duration-200 w-full max-w-lg mx-auto"
                        style={{
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                          minHeight: 'clamp(60px, 12vw, 80px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 3s ease-in-out infinite',
                        }}
                        data-testid="button-hero-cta"
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE EVENTS - Condensed to 3 cards */}
      <div className="relative z-10 py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-normal px-2">
              Live Events Near You
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-2">
              Real people. Real experiences. Zero tourist traps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Beach Bonfire */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <img 
                src="/event page bbq party_1753299541268.png" 
                alt="Beach bonfire event" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Beach Bonfire & BBQ</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Sunset gathering on the beach</p>
                <div className="flex gap-1 mb-4">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Beach</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 flex-grow">Authentic beach bonfire with BBQ, music, and sunset views.</p>
                <Button 
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold"
                  data-testid="button-event-beach"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Taco Tuesday */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <img 
                src="/image_1754973365104.png" 
                alt="Authentic taco stand" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Every Tuesday • $1.50 tacos</p>
                <div className="flex gap-1 mb-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">$1.50</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Food</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 flex-grow">Authentic street tacos at unbeatable prices.</p>
                <Button 
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold"
                  data-testid="button-event-taco"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Hollywood Hike */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <img 
                src="/image_1754974796221.png" 
                alt="Hollywood Sign hike" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Hollywood Sign Hike</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Every Saturday • 9:00 AM</p>
                <div className="flex gap-1 mb-4">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Free</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Hiking</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 flex-grow">Iconic Hollywood Sign hike with amazing city views.</p>
                <Button 
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold"
                  data-testid="button-event-hike"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE PROPOSITION - Simplified */}
      <div className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">Why Nearby Traveler?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">🤝</div>
              <p className="font-bold text-gray-900">Meet Like-Minded People</p>
            </div>
            <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">💎</div>
              <p className="font-bold text-gray-900">Find Hidden Gems</p>
            </div>
            <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">✨</div>
              <p className="font-bold text-gray-900">Create Real Connections</p>
            </div>
          </div>
          
          <p className="text-xl text-white leading-relaxed">
            Skip the tourist traps. Connect before you go. Make memories that last.
          </p>
        </div>
      </div>

      {/* HOW IT WORKS - Streamlined */}
      <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Turn Connections into <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Travel Adventures</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps that transform your travel experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Your City</h3>
              <p className="text-gray-600 text-lg">Sign up and add your interests to find your tribe of travelers and locals.</p>
            </div>

            {/* Step 2 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Matched</h3>
              <p className="text-gray-600 text-lg">Our smart algorithm connects you with compatible people based on location and interests.</p>
            </div>

            {/* Step 3 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explore Together</h3>
              <p className="text-gray-600 text-lg">Join events, create meetups, and build lasting friendships through shared adventures.</p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200"
              data-testid="button-final-cta"
            >
              🚀 START YOUR ADVENTURE
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}