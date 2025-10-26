import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
import localsHeaderImage from "../../assets/locals_1756777112458.png";

export default function LocalsLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);
  
  // Rotating wisdom sayings above the photo
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = [
    "Your City Needs Your Voice.",
    "Share What Only Locals Know.",
    "Share Your Hidden Gems.",
    "Local Knowledge Is Power.",
    "Every City Has Stories to Share.",
    "Locals Make Travel Authentic."
  ];
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "Your City Needs You.",
    "Share Local Secrets.",
    "Share Your Hidden Gems.",
    "Local Knowledge Is Power.",
    "Every City Has Secrets.",
    "Locals Make Travel Real."
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'locals_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          JOIN NOW
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 sm:pt-4 sm:pb-6 bg-white dark:bg-gray-900">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-4 grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[90px] sm:h-[100px] md:h-[120px] lg:h-[140px]">
                  <h1 className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                    Turn Your City Knowledge Into Global Friendships
                  </h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[80px] sm:h-[100px] md:h-[120px]">
                  <p className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                    Connect with curious travelers and like-minded locals while sharing what makes your city special
                  </p>
                </div>
              </div>
            
              {/* Right image side */}
              <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
                {/* Rotating wisdom sayings above static quote */}
                <div className="mb-1 text-center w-full overflow-hidden relative h-[40px] sm:h-[48px] md:h-[56px]">
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
                  <p className="text-sm md:text-lg lg:text-xl font-bold text-zinc-800 dark:text-zinc-200 italic px-2">
                    Travel doesn't change you.<br />
                    The people you meet do.
                  </p>
                </div>
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                  <img
                    src={localsHeaderImage}
                    alt="Locals sharing experiences and welcoming travelers"
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
                Turn Your City Knowledge Into Global Friendships
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Connect with curious travelers and like-minded locals while sharing what makes your city special
              </p>
              
              <Button
                onClick={() => setLocation('/launching-soon')}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                JOIN NOW
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Value Proposition - Fill the dead space */}
      <div className="py-3 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🗺️</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Share Your Secret Spots</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Show off those hidden gems only locals know — from secret viewpoints to hole-in-the-wall restaurants.</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Meet Amazing People</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connect with curious travelers and like-minded neighbors who share your interests.</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Instant Social Life</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Create "meet now" events anytime you want to hang out or explore your own city.</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Stay Connected Globally</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Keep friendships alive as your traveler friends move to new cities around the world.</p>
            </div>
          </div>
        </div>
      </div>

        {/* FOUNDER STORY SECTION - Consistent with main page */}
        <div className="relative z-10 py-6 overflow-hidden mb-4">
          {/* Clean background for light mode */}
          <div className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-orange-500"></div>
          
          <div className="relative">
            <section className="relative isolate mx-auto w-full max-w-4xl px-4 md:px-6 py-4">
              {/* subtle background accent */}
              <div className="absolute inset-x-4 -inset-y-1 -z-10 rounded-2xl bg-gradient-to-b from-orange-50/70 to-blue-50/70 dark:from-orange-500/5 dark:to-blue-500/5" />

              <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 p-4 sm:p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
                <div className="text-center space-y-4">
                  {/* Title */}
                  <h3 className="inline-block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
                    From the Founder
                  </h3>

                  {/* Quote */}
                  <blockquote className="text-balance text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 md:text-xl max-w-3xl mx-auto">
                    "I have friends spanning across the globe now. Connect with genuine travelers who want authentic local experiences, not tourist traps. Be the local friend you'd want to meet."
                  </blockquote>

                  {/* Attribution */}
                  <div className="pt-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      — Aaron Lefkowitz, Founder, Nearby Traveler
                    </p>
                  </div>

                  {/* Tagline */}
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-orange-500 to-blue-600" />
                    <p className="text-xl md:text-2xl font-bold italic text-zinc-700 dark:text-zinc-300">
                      Real Locals, Real Connections
                    </p>
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-orange-500 to-blue-600" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

      {/* Live Local Experiences Section */}
      <div className="py-6 sm:py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight px-2">
              Build Your Local Community & Welcome Travelers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Connect with neighbors. Welcome visitors. Share your city's best secrets.
            </p>
          </div>
          


          {/* Unique Features Section */}
          <div className="max-w-6xl mx-auto px-4 text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              Why Locals Choose Nearby Traveler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              <div className="bg-emerald-200 dark:bg-emerald-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Authentic Local Experiences</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Skip tourist traps and discover hidden gems with locals who know the city best.
                </p>
              </div>
              <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Real Friendships & Connections</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Meet people who share your interests and travel style — friendships that last beyond the trip.
                </p>
              </div>
              <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Host or Join Events</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Create or join activities you love — from rooftop parties and food tours to hikes and art walks.
                </p>
              </div>
              <div className="bg-purple-200 dark:bg-purple-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Interest-Based Matching</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Connect with travelers who share your hobbies and interests. Find hiking buddies, food lovers, art enthusiasts, and adventure seekers in your city.
                </p>
              </div>
              <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Your Social Travel Calendar</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Sync trips, events, and connections into one calendar so you never miss a chance to meet up.
                </p>
              </div>
              <div className="bg-rose-200 dark:bg-rose-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">💕</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Lasting Memories & Stories</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Create unforgettable moments and collect amazing stories from every connection you make around the world.
                </p>
              </div>
              <div className="bg-yellow-200 dark:bg-yellow-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🎟️</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Weekly Sponsored Events</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Every week, Nearby Traveler sponsors authentic local experiences. Host sponsored events or join curated activities that bring our community together.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>



      {/* Why Locals Love It - Modern Cards */}
      <div className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              How Locals Connect with Amazing Travelers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Turn your city knowledge into amazing friendships</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Share Your Secret Spots</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Show off those hidden gems only locals know. From secret viewpoints to hole-in-the-wall restaurants - share what makes your city special.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Meet Amazing People</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Connect with curious travelers AND like-minded locals. Build friendships that span the globe while discovering your own city.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Instant Social Life</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Create "meet now" events when you want to hang out. Always have someone interesting to explore your city with.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Modern Steps */}
      <div className="py-6 sm:py-12 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              How It Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Your Local Profile</h3>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Share your interests, favorite spots, and what makes you the perfect local connection.
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Host Experiences</h3>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Organize meetups, share hidden gems, or create local adventures that showcase the real side of your city.
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Build Global Friendships</h3>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Connect with amazing travelers and locals — friendships that span the globe while you discover your own city.
              </p>
            </div>
          </div>
          
          {/* Perfect For Section */}
          <div className="mt-16 mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Perfect For</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">City Enthusiasts</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Show off your knowledge and meet people who appreciate the real local scene</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Social Locals</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Expand your friend circle with interesting people from around the world</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">New Residents</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Share what you're discovering while meeting established locals and fellow newcomers</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Business Hosts</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Welcome colleagues and clients with authentic local experiences</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Adventure Seekers</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Find people to try new restaurants, events, and activities in your own city</p>
              </div>
            </div>
          </div>

          {/* Another CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              style={{
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                animation: 'gentle-pulse 2.5s ease-in-out infinite',
              }}
            >
BECOME A NEARBY LOCAL NOW
            </Button>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-lg">Free to join • Start connecting today • Build amazing friendships</p>
          </div>
        </div>
      </div>

      {/* Final Power CTA Section */}
      <div className="py-20 bg-gray-100 dark:bg-gradient-to-r dark:from-blue-600 dark:via-purple-600 dark:to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6">
            Ready to Share Your City?
          </h2>
          <p className="text-2xl text-gray-700 dark:text-white mb-12 leading-relaxed">
            Be part of a new way for locals to build global friendships while sharing what they love about their city.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              style={{
                boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
              }}
            >
              BECOME A NEARBY LOCAL
            </Button>
          </div>
          
          <p className="text-xl text-gray-600 dark:text-white/90">
            🏠 Free to join • 🌍 Global community
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}