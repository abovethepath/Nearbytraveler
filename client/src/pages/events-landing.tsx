
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
import karaokeImage from "@assets/image_1756447354157.png";
import bikeImage from "@assets/image_1756447442403.png";
import artWalkImage from "@assets/image_1756447587360.png";
import movieImage from "@assets/image_1756447721644.png";
const eventHeaderImage = "/event page bbq party_1753299541268.png";

export default function EventsLanding() {
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
    "Every Event Tells a Story.",
    "Where Memories Are Made.",
    "Connect Through Shared Experiences.",
    "Life Happens Together.",
    "Create Moments That Matter.",
    "Events Bring People Together."
  ];
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "Every Event Tells a Story.",
    "Where Memories Are Made.",
    "Connect Through Experiences.",
    "Life Happens Together.",
    "Create Moments That Matter.",
    "Events Bring People Together."
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
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'events_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          JOIN NOW
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="pt-4 pb-2 sm:pt-6 sm:pb-4 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-gray-900">
                  <h1>Join User Created Events</h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-gray-600">
                  <p>Make real connections with nearby travelers and locals through authentic experiences</p>
                </div>
                {/* Desktop CTAs */}
                <div className="hidden sm:flex mt-6 flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      trackEvent('signup_cta_click', 'events_landing', 'join_journey');
                      setLocation('/launching-soon');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto"
                    data-testid="button-join-journey"
                  >
                    JOIN NOW
                  </button>
                  <button 
                    onClick={() => {
                      document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-xl border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800 w-full sm:w-auto"
                    data-testid="button-see-how-it-works"
                  >
                    See How It Works
                  </button>
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
                  <p className="text-sm md:text-lg lg:text-xl font-bold text-gray-800 italic px-2">
                    Travel doesn't change you — people you meet do.
                  </p>
                </div>
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                  <img
                    src={eventHeaderImage}
                    alt="People enjoying events and activities together"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                  />
                </div>
                <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                  Where Shared Experiences Create Lifelong Bonds
                </p>
              </div>
            </div>
          ) : (
            // Original centered layout (for investors)
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
                Join User Created Events
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Make real connections with nearby travelers and locals through authentic experiences
              </p>
              
              <Button
                onClick={() => setLocation('/launching-soon')}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                JOIN NOW
              </Button>
            </div>
          )}
        </div>
      </div>


      {/* Beyond Event Discovery Section */}
      <div className="py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Beyond Event Discovery - We Connect You</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Last-Minute Magic</h3>
              <p className="text-gray-600">Create "meet now" events when you're free. Perfect for spontaneous coffee meetups, quick walks, or impromptu adventures.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recurring Experiences</h3>
              <p className="text-gray-600">Join weekly hiking groups, monthly food tours, or regular photography walks. Build lasting friendships through consistent connections.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pre-Event Connections</h3>
              <p className="text-gray-600">Connect with fellow travelers before local events and festivals. Turn events into reunions, not rooms full of strangers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl text-gray-800 leading-relaxed font-light italic">
            "Thanks to Nearby Traveler, every festival feels like a reunion, not a room full of strangers."
          </blockquote>
        </div>
      </div>

      {/* Sample Events Section */}
      <div className="px-4 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
            Upcoming Local Events & Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-6 sm:mb-8">
            
            {/* Venice Beach Dance Party */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Venice Beach Dance Party • Free</h3>
              <p className="text-gray-600 mb-4">Sunset dancing on the famous boardwalk with live music and authentic LA beach culture.</p>
            </div>

            {/* Authentic Food Adventure */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Authentic Food Adventure • Various Prices</h3>
              <p className="text-gray-600 mb-4">Join locals discovering hidden food spots — from dollar tacos to Korean BBQ and the best burgers in town.</p>
            </div>

            {/* Marina Movie Nights */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Marina Movie Nights • Saturday 8PM • Free</h3>
              <p className="text-gray-600 mb-4">Outdoor movie screenings at Burton Chace Park. Bring a blanket, pack a picnic, enjoy movies under the stars.</p>
            </div>

            {/* Art Gallery Walk */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Art Gallery Walk • First Friday • Free</h3>
              <p className="text-gray-600 mb-4">Monthly walk through the Arts District. Meet artists, see local work, discuss creativity with fellow art lovers.</p>
            </div>

            {/* Karaoke Night */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Karaoke Night • Wednesday 8PM</h3>
              <p className="text-gray-600 mb-4">Weekly karaoke where locals and travelers bond over terrible singing voices. No talent required — just bring energy!</p>
            </div>

            {/* City Bike Tour */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">City Bike Tour • Saturday 10AM</h3>
              <p className="text-gray-600 mb-4">Explore the best neighborhoods on two wheels. Local guides show hidden spots and street art you'd never find alone.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-12 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to join events only the Nearby Traveler community knows about?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join others already creating unforgettable experiences together.
          </p>
          <Button
            onClick={() => setLocation('/launching-soon')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-4 text-lg rounded-lg shadow-lg"
          >
            Join Now
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
