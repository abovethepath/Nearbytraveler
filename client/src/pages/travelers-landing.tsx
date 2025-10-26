import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
const travelersHeaderImage = "/assets/travelers_1756778615408.jpg";

export default function TravelersLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);
  
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = ["Adventure Awaits Everywhere.", "The World Is Your Playground.", "Travel Like a Local."];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  return (
    <div className="bg-white dark:bg-gray-900 font-sans" key="travelers-landing-optimized">
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'travelers_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
          data-testid="button-mobile-cta"
        >
          Join Now
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* DESKTOP FULL-BLEED HERO - Much Larger Image */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 py-8">
        <div className="text-center mb-8">
          <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            <h1>Travel Like a Local</h1>
          </div>
          <div className="text-xl lg:text-2xl text-zinc-600 dark:text-zinc-300 mb-6">
            <p>Connect with locals and travelers for authentic experiences</p>
          </div>
          <p className="text-lg font-medium text-zinc-800 italic mb-2">
            {wisdomSayings[currentWisdom]}
          </p>
          <p className="text-2xl font-bold text-zinc-800 italic mb-8">
            Travel doesn't change you<br />
            The people you meet do.
          </p>
        </div>
        
        {/* Large image for desktop */}
        <div className="flex justify-center max-w-4xl mx-auto">
          <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={travelersHeaderImage}
              alt="Nearby Traveler application interface"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <p className="text-center text-lg italic text-orange-600 mt-8">
          Where Local Experiences Meet Worldwide Connections
        </p>
      </div>

      {/* MOBILE/TABLET HERO - Original smaller version */}
      <div className="block lg:hidden max-w-6xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 sm:pt-4 sm:pb-6 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-4 grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                <h1>Travel Like a Local</h1>
              </div>
              <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300">
                <p>Connect with locals and travelers for authentic experiences</p>
              </div>
            </div>
          
            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              <div className="mb-2 text-center w-full">
                <p className="text-xs md:text-sm font-medium text-zinc-800 italic px-2">
                  {wisdomSayings[currentWisdom]}
                </p>
                <p className="text-sm md:text-lg font-bold text-zinc-800 italic px-2 mt-1">
                  Travel doesn't change you<br />
                  The people you meet do.
                </p>
              </div>
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={travelersHeaderImage}
                  alt="Nearby Traveler application interface"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg"
                />
              </div>
              <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                Where Local Experiences Meet Worldwide Connections
              </p>
            </div>
          </div>
        </div>
      </div>


      <main className="flex-1 px-4 py-6">

        {/* Core Features */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-black">Instant Meetups</h3>
              <p className="text-black mb-3">Create "meet now" events for instant connections.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Spontaneous adventures</li>
                <li>• Skip the planning stress</li>
                <li>• Connect in real-time</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-black">Local Connections</h3>
              <p className="text-black mb-3">Connect with locals for authentic experiences.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Skip tourist traps</li>
                <li>• Insider knowledge</li>
                <li>• Authentic cultural exchange</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-black">Real-Time Chat</h3>
              <p className="text-black mb-3">Instant messaging with full features.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Group conversations</li>
                <li>• Photo & location sharing</li>
                <li>• Coordinated meetups</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Share Your Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add travel dates, interests, and what you want to explore</p>
            </div>
            <div>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Get Matched</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find compatible travelers and locals based on your interests</p>
            </div>
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Connect & Explore</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Join events, create meetups, and make lasting friendships</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Why Choose Nearby Traveler?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Quality Over Quantity</h3>
              <p className="text-gray-700 dark:text-gray-300">We focus on meaningful connections, not endless swiping. Every match is based on genuine compatibility and shared interests.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Safe & Verified</h3>
              <p className="text-gray-700 dark:text-gray-300">All users are verified for safety. Meet in public places and trust your instincts - we provide the tools for safe connections.</p>
            </div>
          </div>
        </div>
        
        {/* Get Started */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white py-8 rounded-2xl shadow-lg mb-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Travel Like a Local?</h2>
            <p className="text-lg mb-6 text-white/90">Join thousands of travelers creating authentic connections worldwide</p>
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold px-8 py-3 rounded-lg"
              data-testid="button-get-started"
            >
              🚀 Start Connecting Now
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}