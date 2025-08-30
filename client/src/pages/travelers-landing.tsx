import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/footer";
import { trackEvent } from "@/lib/analytics";
import backgroundImage from "@assets/image_1755178154302.png";
const travelersHeaderImage = "/attached_assets/travelers together hugging_1754971726997.avif";

export default function TravelersLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Rotating wisdom sayings above the photo
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = [
    "Adventure Awaits Around Every Corner.",
    "The World Is Your Playground.",
    "Travel Deeper, Connect Stronger.",
    "Explore Like You Live There.",
    "Every Journey Starts With Hello.",
    "Adventure Meets Real Connection."
  ];
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "Adventure Awaits Everywhere.",
    "The World Is Your Playground.",
    "Travel Deeper, Connect More.",
    "Explore Like a Local.",
    "Every Journey Starts With Hello.",
    "Wanderlust Meets Connection."
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
    <div className="bg-white dark:bg-gray-900 font-sans" key="travelers-landing-v2">
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'travelers_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-8 bg-white dark:bg-gray-900">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[90px] sm:h-[100px] md:h-[120px] lg:h-[140px]">
                  <h1 className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                    Travel Like a Local
                  </h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[80px] sm:h-[100px] md:h-[120px]">
                  <p className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                    Skip the tourist traps and connect with nearby travelers and locals for authentic experiences
                  </p>
                </div>
              </div>
            
              {/* Right image side */}
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
                    src={travelersHeaderImage}
                    alt="Travelers connecting and exploring together"
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
                Travel Like a Local
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Skip the tourist traps and connect with nearby travelers and locals for authentic experiences
              </p>
              
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                Join the Journey
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xl text-gray-800 dark:text-gray-300 leading-relaxed font-light">
            "Connect with real locals who'll show you the hidden gems, secret bars, and authentic experiences that make travel unforgettable."
          </p>
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-white text-base">— Real Travelers, Real Experiences</p>
          </div>
        </div>
      </div>


      <main className="flex-1 px-4 py-16">
        {/* Why Travelers Love Nearby Traveler */}
        <div className="max-w-6xl mx-auto text-center mb-20">
          <h2 className="text-2xl font-light mb-16 text-gray-900 dark:text-white">
            Why Travelers Choose Nearby Traveler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Hidden Gems</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Discover secret spots, local hangouts, and authentic experiences that guidebooks never mention.</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Local Connections</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Connect with locals who share your interests and get insider tips from people who actually live there.</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Smart Matching</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Our AI matches you with locals and travelers based on shared interests, travel dates, and compatibility.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg border dark:border-purple-700/50">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Instant Meetups</h3>
              <p className="text-black dark:text-white">Create "meet now" events for instant connections when you arrive in a new city and want to explore.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 p-6 rounded-xl shadow-lg border dark:border-pink-700/50">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Cultural Immersion</h3>
              <p className="text-black dark:text-white">Experience authentic local culture through community events and personal connections with residents.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-6 rounded-xl shadow-lg border dark:border-teal-700/50">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Personalized Tips</h3>
              <p className="text-black dark:text-white">Get customized recommendations based on your interests, budget, and travel style from real locals.</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-6 rounded-xl shadow-lg border dark:border-indigo-700/50">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Real-Time Messaging</h3>
              <p className="text-black dark:text-white">Instant messaging with typing indicators, read receipts, and online status like AOL Messenger.</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-6 rounded-xl shadow-lg border dark:border-yellow-700/50">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Travel Date Matching</h3>
              <p className="text-black dark:text-white">Find travelers with overlapping dates in the same destination for coordinated adventures.</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-6 rounded-xl shadow-lg border dark:border-cyan-700/50">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Travel Memories</h3>
              <p className="text-black dark:text-white">Photo sharing, travel stories, and memory timeline to document your adventures.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-6 rounded-xl shadow-lg border dark:border-emerald-700/50">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Travel Aura System</h3>
              <p className="text-black dark:text-white">Earn points for participating, sharing photos, and connecting with other travelers who share your interests.</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-6 rounded-xl shadow-lg border dark:border-violet-700/50">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Safety & References</h3>
              <p className="text-black dark:text-white">Reference system, user verification, and safety features to ensure trustworthy connections.</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 p-6 rounded-xl shadow-lg border dark:border-rose-700/50">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Better Networking Events</h3>
              <p className="text-black dark:text-white">Transform shallow networking into meaningful connections. Pre-match with attendees who share your interests, plan meetups before events, and continue conversations that matter.</p>
            </div>
          </div>
        </div>

        {/* How It Works for Travelers */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            How It Works for Travelers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Plan Your Trip</h3>
              <p className="text-gray-700 dark:text-gray-300">Add your travel dates and destinations to find locals and other travelers who'll be there at the same time.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Get Matched</h3>
              <p className="text-gray-700 dark:text-gray-300">Our smart algorithm connects you with compatible locals and travelers based on interests and travel overlap.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Experience & Connect</h3>
              <p className="text-gray-700 dark:text-gray-300">Join local events, create meetups, and build lasting connections that enhance your travel experience.</p>
            </div>
          </div>
        </div>

        {/* Advanced Travel Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Advanced Travel Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-purple-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Surprise Me Feature</h3>
              <p className="text-black dark:text-white">Let locals surprise you with spontaneous activities and hidden gems you'd never discover on your own.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-teal-200 dark:border-gray-400">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Location Intelligence</h3>
              <p className="text-black dark:text-white">Smart location detection shows you nearby travelers, events, and meetup opportunities in real-time.</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-indigo-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Global Community</h3>
              <p className="text-black dark:text-white">Starting our beta launch in Los Angeles, growing to connect travelers worldwide with authentic local experiences.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-emerald-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Trip Synchronization</h3>
              <p className="text-black dark:text-white">Automatically sync your travel plans across devices and share itineraries with travel companions.</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-rose-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Interest Targeting</h3>
              <p className="text-black dark:text-white">Precision matching based on 100+ interests and activities to find your perfect travel companions.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-amber-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Event Discovery</h3>
              <p className="text-black dark:text-white">Access exclusive local events, festivals, and cultural experiences only available to community members.</p>
            </div>
          </div>
        </div>
        
        {/* Get Started Section - Enhanced with Multiple CTAs */}
        <div className="bg-gray-100 dark:bg-gradient-to-r dark:from-orange-600 dark:to-blue-600 text-gray-900 dark:text-white py-16 rounded-2xl shadow-lg dark:shadow-2xl mb-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Explore Like a Local?</h2>
            <p className="text-xl mb-8 text-gray-700 dark:text-white dark:opacity-90">Start your journey of authentic local connections and experiences.</p>
            
            {/* Single CTA Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                🚀 Join Nearby Traveler
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}