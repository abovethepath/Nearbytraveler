
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
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-400 to-purple-500">
                <img 
                  src="/venice-beach-dance-party.png" 
                  alt="Venice Beach dance party event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Venice Beach Dance Party • Free</h3>
                  <p className="text-sm text-gray-600">Sunset dancing on the famous boardwalk</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Dancing</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Sunset dancing on the famous boardwalk with live music and authentic LA beach culture.</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN THE PARTY
                </a>
              </div>
            </div>

            {/* Food Adventure */}
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/authentic-food-adventure.png" 
                  alt="Local food experience event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Authentic Food Adventure • Various Prices</h3>
                  <p className="text-sm text-gray-600">Hidden spots from tacos to Korean BBQ</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Local Spots</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join locals discovering hidden food spots — from dollar tacos to Korean BBQ and the best burgers in town.</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN FOOD TOUR
                </a>
              </div>
            </div>

            {/* Marina Movie Nights */}
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-purple-600">
                <img 
                  src={movieImage} 
                  alt="Marina del Rey outdoor movie night at Burton Chace Park" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight">Marina Movie Nights • Saturday 8PM • Free</h3>
                  <p className="text-sm text-gray-600">Burton Chace Park outdoor screenings</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Movies</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Outdoor</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Outdoor movie screenings at Burton Chace Park. Bring a blanket, pack a picnic, enjoy movies under the stars.</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN MOVIE NIGHT
                </a>
              </div>
            </div>

            {/* Art Gallery Walk */}
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-purple-400 to-pink-500">
                <img 
                  src={artWalkImage} 
                  alt="First Friday Art Walk in colorful arts district with people walking" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight">Art Gallery Walk • First Friday • Free</h3>
                  <p className="text-sm text-gray-600">Monthly Arts District exploration</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Culture</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Monthly walk through the Arts District. Meet artists, see local work, discuss creativity with fellow art lovers.</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN ART WALK
                </a>
              </div>
            </div>

            {/* Karaoke Night */}
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-red-500 to-pink-600">
                <img 
                  src={karaokeImage} 
                  alt="Person singing karaoke with silhouette against stage lights" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight">Karaoke Night • Wednesday 8PM</h3>
                  <p className="text-sm text-gray-600">Weekly singing with locals and travelers</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Fun</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Music</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Weekly karaoke where locals and travelers bond over terrible singing voices. No talent required — just bring energy!</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN KARAOKE
                </a>
              </div>
            </div>

            {/* Bike Tour */}
            <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-teal-500 to-green-600">
                <img 
                  src={bikeImage} 
                  alt="Group of cyclists with bikes under palm trees in beach setting" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight">City Bike Tour • Saturday 10AM</h3>
                  <p className="text-sm text-gray-600">Hidden spots and street art tours</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Sightseeing</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Explore the best neighborhoods on two wheels. Local guides show hidden spots and street art you'd never find alone.</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN BIKE TOUR
                </a>
              </div>
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
