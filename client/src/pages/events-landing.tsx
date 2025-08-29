
import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/footer";
import karaokeImage from "@assets/image_1756447354157.png";
import bikeImage from "@assets/image_1756447442403.png";
import artWalkImage from "@assets/image_1756447587360.png";
import movieImage from "@assets/image_1756447721644.png";
const eventHeaderImage = "/event page bbq party_1753299541268.png";

export default function EventsLanding() {
  const [, setLocation] = useLocation();
  
  // Check URL for layout parameter - default to Airbnb style
  const urlParams = new URLSearchParams(window.location.search);
  const isAirbnbStyle = urlParams.get('layout') !== 'centered';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 md:grid-cols-2 items-center">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <>
            {/* Left text side */}
            <div>
              <div className="mb-4 inline-block rounded-full bg-orange-50 dark:bg-orange-900/30 px-4 py-1 text-sm font-medium text-orange-700 dark:text-orange-400">
                🚀 Now Launching: Be Among the First to Connect Globally
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Join User Created Events
              </h1>
              <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
                Make real connections with nearby travelers and locals through authentic experiences
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setLocation('/join')}
                  className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow hover:bg-zinc-800 w-full sm:w-auto"
                  data-testid="button-join-journey"
                >
                  Join the Journey
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
            <div className="flex justify-center">
              <img
                src={eventHeaderImage}
                alt="People enjoying events and activities together"
                className="rounded-2xl shadow-lg object-cover"
              />
            </div>
            </>
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
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
              >
                Join Nearby Traveler
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xl text-gray-800 dark:text-gray-300 leading-relaxed font-light">
            "Thanks to Nearby Traveler, You can meet half your conference before even landing. An event can feel like a reunion, not a room full of strangers."
          </p>
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-white text-base">— Real connections before you arrive</p>
          </div>
        </div>
      </div>

      {/* Sample Events Section */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-2xl font-light mb-16 text-center text-gray-900 dark:text-white">
            Upcoming Local Events & Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            
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
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN THE PARTY
                </a>
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
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN FOOD TOUR
                </a>
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
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN MOVIE NIGHT
                </a>
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
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN ART WALK
                </a>
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
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN KARAOKE
                </a>
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

        {/* What Makes Events Special Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-2xl font-light mb-16 text-center text-gray-900 dark:text-white">
            What Makes Our Events Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Epic Experiences</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">From beach bonfires to rooftop parties - join unforgettable events created by passionate locals who know the best spots.</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Instant Connections</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Meet amazing travelers and locals who share your interests. Every event is a chance to make lifelong friendships.</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Local Secrets</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Discover hidden gems and authentic experiences that tourists never find. Access the real side of every city.</p>
            </div>
          </div>
        </div>

        {/* Get Started Section - Clean Airbnb Style */}
        <div className="bg-white dark:bg-gradient-to-r dark:from-orange-600 dark:to-blue-600 py-20 border-t border-gray-200 dark:border-0 mb-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-light mb-6 text-gray-900 dark:text-white">Ready to Join Events Only The Nearby Traveler Community Knows About?</h2>
            <p className="text-lg mb-10 text-gray-600 dark:text-white dark:opacity-90 font-light">Join others already creating unforgettable experiences together.</p>
            
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 text-white dark:text-white font-medium text-lg px-10 py-3 rounded-lg transition-all duration-200"
            >
              Join Nearby Traveler
            </Button>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
