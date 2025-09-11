import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
import travelersHeaderImage from "../../assets/travelers_1756778615408.jpg";

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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 sm:pt-4 sm:pb-6 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-4 grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                <h1>Travel Like a Local</h1>
              </div>
              <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300">
                <p>Never explore alone again — join events with locals and fellow solo travelers</p>
              </div>
            </div>
          
            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              <div className="mb-2 text-center w-full">
                <p className="text-xs md:text-sm font-medium text-zinc-800 italic px-2">
                  {wisdomSayings[currentWisdom]}
                </p>
                <p className="text-sm md:text-lg font-bold text-zinc-800 italic px-2 mt-1">
                  Travel doesn't change you — people you meet do.
                </p>
              </div>
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={travelersHeaderImage}
                  alt="Travelers connecting and exploring together"
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

        {/* What Makes Us Different */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Constant events happening</h3>
              <p className="text-gray-700 dark:text-gray-300">Multiple weekly events hosted by locals and our community — from morning hikes to sunset happy hours.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Connect Before You Arrive</h3>
              <p className="text-gray-700 dark:text-gray-300">Meet your connections before landing — no more awkward first days wondering where to go.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Meetups</h3>
              <p className="text-gray-700 dark:text-gray-300">Create "meet now" events for spontaneous adventures and real-time connections.</p>
            </div>
          </div>
        </div>

        {/* From the Founder */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              From the Founder
            </h2>
            <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 text-center mb-4">
              "I was tired of touring cities alone while amazing people walked past me every day. After hosting 400+ solo travelers from 50 countries, I saw how one connection transforms an entire trip. I built the solution I wished existed — a way to never explore alone again."
            </blockquote>
            <p className="text-center text-gray-600 dark:text-gray-400 font-medium">
              — Aaron Lefkowitz, Founder
            </p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Find compatible solo travelers and locals based on your interests</p>
            </div>
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Connect & Explore</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Join daily events, create meetups, and make lasting friendships</p>
            </div>
          </div>
        </div>

        {/* Solo Travel, But Never Alone */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Solo Travel, But Never Alone
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🍻</div>
              <p className="text-gray-700 dark:text-gray-300">Join authentic social scenes</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🚗</div>
              <p className="text-gray-700 dark:text-gray-300">Share day trip adventures and costs</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">💬</div>
              <p className="text-gray-700 dark:text-gray-300">Practice languages with patient locals</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">💕</div>
              <p className="text-gray-700 dark:text-gray-300">Find meaningful connections naturally</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🌍</div>
              <p className="text-gray-700 dark:text-gray-300">Experience real culture, not tourist shows</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🏠</div>
              <p className="text-gray-700 dark:text-gray-300">Meet local families who welcome you</p>
            </div>
          </div>
          <p className="text-center text-lg font-medium text-gray-900 dark:text-white mt-8">
            This isn't just solo travel. This is confident exploration.
          </p>
        </div>

        {/* Perfect For Solo Travelers */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Perfect For Solo Travelers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-bold mb-3 text-blue-900 dark:text-blue-400">First-Time Solo Travelers</h3>
              <p className="text-blue-800 dark:text-blue-300">Skip the anxiety with instant connections and daily activities</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <h3 className="text-xl font-bold mb-3 text-green-900 dark:text-green-400">Experienced Solo Travelers</h3>
              <p className="text-green-800 dark:text-green-300">Find your tribe faster and access the real local scene</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-bold mb-3 text-purple-900 dark:text-purple-400">Business Travelers</h3>
              <p className="text-purple-800 dark:text-purple-300">Turn work trips into adventures with after-hours events</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
              <h3 className="text-xl font-bold mb-3 text-orange-900 dark:text-orange-400">Digital Nomads</h3>
              <p className="text-orange-800 dark:text-orange-300">Build community instantly in every new city</p>
            </div>
          </div>
        </div>
        
        {/* Get Started */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white py-8 rounded-2xl shadow-lg mb-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Travel Like a Local?</h2>
            <p className="text-lg mb-6 text-white/90">Join other travelers who've discovered that with daily events and instant connections, you're never really traveling alone.</p>
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