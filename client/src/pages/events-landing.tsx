
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'events_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-join-now"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />
      
      <div className="w-full">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-8 sm:pt-8 sm:pb-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:gap-8 lg:gap-12 lg:grid-cols-2 items-center">
              
              {/* Left text side */}
              <div className="order-2 lg:order-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6 sm:mb-8">
                  Join User Created Events
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Make real connections with nearby travelers and locals through authentic experiences. Build real friendships that last a lifetime.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={() => {
                      trackEvent('signup_cta_click', 'events_landing', 'main_cta');
                      setLocation('/launching-soon');
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-main-cta"
                  >
                    Join Now
                  </Button>
                  <Button
                    onClick={() => {
                      trackEvent('learn_more_click', 'events_landing', 'see_how_it_works');
                      document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
                    data-testid="button-learn-more"
                  >
                    See How It Works
                  </Button>
                </div>
              </div>

              {/* Right image side */}
              <div className="order-1 lg:order-2 flex flex-col items-center">
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 italic px-2">
                    Travel doesn't change you.<br />
                    The people you meet do.
                  </p>
                </div>
                
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  <img
                    src={eventHeaderImage}
                    alt="People enjoying events and activities together"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
                  />
                </div>
                
                <p className="mt-3 sm:mt-4 text-sm sm:text-base italic text-orange-600 text-center font-medium">
                  Where Shared Experiences Create Lifelong Bonds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Value Prop */}
      <div className="py-3 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            🎯 Create events and connect with nearby travelers and locals • Build real relationships through shared experiences
          </p>
        </div>
      </div>

      {/* Event Features Section - Fill the dead space */}
      <div className="py-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Beyond Event Discovery - We Connect You</h2>
            <p className="text-gray-600 dark:text-gray-300">Create meaningful connections through user-generated events and experiences</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Last-Minute Magic</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Create "meet now" events when you're free. Perfect for spontaneous coffee meetups, quick walks, or impromptu adventures.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Recurring Experiences</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Join weekly hiking groups, monthly food tours, or regular photography walks. Build lasting friendships through consistent connections.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pre-Event Connections</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Connect with fellow travelers before local events and festivals. Turn events into reunions, not rooms full of strangers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Events Section */}
      <div className="px-4 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <h2 className="text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            Upcoming Local Events & Experiences
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Sample events from our LA community. Events available in 50+ cities worldwide.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-6 sm:mb-8">
            
            {/* Venice Beach Dance Party */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-400 to-purple-500">
                <img 
                  src="/venice-beach-dance-party.png" 
                  alt="Venice Beach dance party event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Venice Beach Dance Party</h3>
                  <p className="text-sm text-gray-600">Sunset dancing on the famous boardwalk</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Dancing</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join locals dancing to live music at Venice Beach boardwalk. Experience the authentic LA beach culture with sunset vibes and great people.</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN THE PARTY
                </button>
              </div>
            </div>

            {/* Food Adventure */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/authentic-food-adventure.png" 
                  alt="Local food experience event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Authentic Food Adventure</h3>
                  <p className="text-sm text-gray-600">Discover your local's favorite eats</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Local Spots</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join Locals as they plan meals at awesome hidden food spots like top tacos for a buck, korean bbq, from ethepian to korean and where to find the best burgers in town.</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN FOOD TOUR
                </button>
              </div>
            </div>

            {/* Marina Movie Nights */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-purple-600">
                <img 
                  src={movieImage} 
                  alt="Marina del Rey outdoor movie night at Burton Chace Park" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">Marina Movie Nights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saturday • 8:00 PM • Burton Chace Park</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Movies</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Outdoor</span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Free outdoor movie screenings at Burton Chace Park in Marina del Rey. Bring a blanket, pack a picnic, and enjoy movies under the stars with locals and travelers.</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN MOVIE NIGHT
                </button>
              </div>
            </div>

            {/* Art Gallery Walk */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-purple-400 to-pink-500">
                <img 
                  src={artWalkImage} 
                  alt="First Friday Art Walk in colorful arts district with people walking" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">Art Gallery Walk</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">First Friday • Arts District</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Culture</span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Monthly gallery walk through the Arts District. Meet artists, see local work, and discuss creativity with fellow art lovers and travelers.</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN ART WALK
                </button>
              </div>
            </div>

            {/* Karaoke Night */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-red-500 to-pink-600">
                <img 
                  src={karaokeImage} 
                  alt="Person singing karaoke with silhouette against stage lights" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">Karaoke Night</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wednesday • 8:00 PM</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Fun</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Music</span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Weekly karaoke night where locals and travelers sing, laugh, and bond over terrible singing voices. No talent required - just bring the energy!</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN KARAOKE
                </button>
              </div>
            </div>

            {/* Bike Tour */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-teal-500 to-green-600">
                <img 
                  src={bikeImage} 
                  alt="Group of cyclists with bikes under palm trees in beach setting" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">City Bike Tour</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saturday • 10:00 AM</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Sightseeing</span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Explore the city's best neighborhoods on two wheels. Local guides show hidden spots, street art, and authentic culture you'd never find on your own.</p>
                <button
                  onClick={() => setLocation('/launching-soon')}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN BIKE TOUR
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* What Makes Events Special Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            What Makes Our Events Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">From $1 Taco Tours to Free Beach Parties</h3>
              <p className="text-gray-700 dark:text-white text-sm leading-relaxed">Join unforgettable events created by passionate locals who know the best spots. Every experience is authentic and affordable.</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Meet 5-20 People Per Event</h3>
              <p className="text-gray-700 dark:text-white text-sm leading-relaxed">Every event is a chance to make lifelong friendships. Small groups mean real connections, not anonymous crowds.</p>
            </div>
            <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Hidden Spots Locals Actually Go To</h3>
              <p className="text-gray-700 dark:text-white text-sm leading-relaxed">Discover experiences that tourists never find. Access the real side of every city through insider knowledge.</p>
            </div>
          </div>
        </div>

        {/* Create Your Own Event Section */}
        <div className="mt-16 mb-20 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Have a Great Idea?</h2>
          <h3 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-300">Host Your Own Experience</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Share your passion with travelers and locals. From coffee meetups to hiking adventures—create the event you wish existed.
          </p>
          <Button
            onClick={() => setLocation('/launching-soon')}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-lg mb-4"
          >
            Create an Event
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            2,000+ events created this month by our community
          </p>
        </div>

        {/* Get Started Section - Clean Airbnb Style */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 py-12 rounded-2xl shadow-lg mb-6 sm:mb-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Join Events Only The Nearby Traveler Community Knows About?</h2>
            <p className="text-lg mb-8 text-white/90">Join others already creating unforgettable experiences together.</p>
            
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold px-10 py-3 rounded-lg transition-all duration-200"
            >
              Join Now
            </Button>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
