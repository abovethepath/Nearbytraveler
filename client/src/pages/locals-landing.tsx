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
                    Share Your City, Build Your World
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
                    <span className="sm:hidden">Travel doesn't change you — people you meet do.</span>
                    <span className="hidden sm:inline">Travel doesn't change you — the people you meet do.</span>
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

      {/* Key Features */}
      <div className="py-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Share Your Secret Spots</h3>
              <p className="text-gray-600 dark:text-gray-300">Show off those hidden gems only locals know — from secret viewpoints to hole-in-the-wall restaurants.</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Meet Amazing People</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect with curious travelers and like-minded neighbors who share your interests.</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Instant Social Life</h3>
              <p className="text-gray-600 dark:text-gray-300">Create "meet now" events anytime you want to hang out or explore your own city.</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Stay Connected Globally</h3>
              <p className="text-gray-600 dark:text-gray-300">Keep friendships alive as your traveler friends move to new cities around the world.</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🎟️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Host Sponsored Events</h3>
              <p className="text-gray-600 dark:text-gray-300">Every week, Nearby Traveler sponsors authentic local experiences — host your own or join curated community activities.</p>
            </div>
          </div>
        </div>
      </div>

        {/* From the Founder */}
        <div className="py-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              From the Founder
            </h2>
            <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              "I have friends spanning across the globe now. Connect with genuine travelers who want authentic local experiences, not tourist traps. Be the local friend you'd want to meet."
            </blockquote>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              — Aaron Lefkowitz, Founder
            </p>
          </div>
        </div>

      {/* How It Works */}
      <div className="py-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              How It Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Your Local Profile</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share your interests, favorite spots, and what makes you the perfect local connection.
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Host Experiences</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Organize meetups, share hidden gems, or create local adventures that showcase the real side of your city.
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Build Global Friendships</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with amazing travelers and locals — friendships that span the globe while you discover your own city.
              </p>
            </div>
          </div>
        </div>
      </div>
          
      {/* Perfect For */}
      <div className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">City Enthusiasts</h3>
              <p className="text-gray-600 dark:text-gray-300">Show off your knowledge and meet people who appreciate the real local scene</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Social Locals</h3>
              <p className="text-gray-600 dark:text-gray-300">Expand your friend circle with interesting people from around the world</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">New Residents</h3>
              <p className="text-gray-600 dark:text-gray-300">Share what you're discovering while meeting established locals and fellow newcomers</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Business Hosts</h3>
              <p className="text-gray-600 dark:text-gray-300">Welcome colleagues and clients with authentic local experiences</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Adventure Seekers</h3>
              <p className="text-gray-600 dark:text-gray-300">Find people to try new restaurants, events, and activities in your own city</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Families with Young Children</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect with traveling families for playground meetups, children's activities, and family-friendly local adventures</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg mb-6 text-gray-600 dark:text-gray-400">
            Be part of a new way for locals to build global friendships while sharing what they love about their city.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="text-2xl">🏠</span>
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="text-2xl">🌍</span>
              <span>Start connecting today</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="text-2xl">⚡</span>
              <span>Build amazing friendships</span>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/launching-soon')}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-lg shadow-lg transition-all duration-200"
            >
              BECOME A NEARBY LOCAL
            </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}