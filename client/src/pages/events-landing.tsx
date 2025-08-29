
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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="relative z-0">
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-orange-500 shadow-lg">
          <div className="relative bg-white dark:bg-gray-900 pb-32 overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 h-full min-h-[400px]">
              <img
                src={eventHeaderImage}
                alt="Beach BBQ Party with Friends"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,.3), rgba(255,255,255,.2), rgba(255,255,255,0))"
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 dark:block hidden"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.4), rgba(0,0,0,0.2))"
                }}
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-black dark:text-white animate-slide-in-1">
                          Join User Created Events
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)] animate-slide-in-2">
                          <span className="text-black dark:text-white">and Make Real Connections </span>
                          <span className="text-black dark:text-white">with Nearby Travelers, </span>
                          <span className="text-black dark:text-white">While Connecting with Other Locals.</span>
                        </span>
                      </h1>
                      
                      
                      {/* Primary signup CTA */}
                      <div className="mt-32 mb-8 px-4">
                        <Button
                          onClick={() => setLocation('/join')}
                          size="lg"
                          className="bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 hover:bg-gray-100 dark:hover:from-blue-700 dark:hover:to-orange-600 text-black dark:text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 border-2 border-black dark:border-white max-w-md mx-auto"
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                          }}
                        >
                          JOIN NEARBY TRAVELER NOW
                        </Button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <p className="text-lg text-black dark:text-gray-300 leading-relaxed">
              <span className="text-black dark:text-orange-500 font-bold">"Join beach bonfires, rooftop parties, food tours, and adventures.</span>
              <span className="text-black dark:text-gray-300"> Every event is a chance to meet amazing locals and travelers who become lifelong friends."</span>
            </p>
            <div className="mt-4 text-center">
              <p className="text-black dark:text-white font-bold text-lg">— Your Community Awaits</p>
              <p className="text-black dark:text-orange-400 text-sm">From beach BBQs to secret speakeasies - join the fun today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Events Section */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Upcoming Local Events & Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
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
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            What Makes Our Events Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Epic Experiences</h3>
              <p className="text-black dark:text-white">From beach bonfires to rooftop parties - join unforgettable events created by passionate locals who know the best spots.</p>
            </div>
            <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Instant Connections</h3>
              <p className="text-black dark:text-white">Meet amazing travelers and locals who share your interests. Every event is a chance to make lifelong friendships.</p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-700 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">Local Secrets</h3>
              <p className="text-black dark:text-white">Discover hidden gems and authentic experiences that tourists never find. Access the real side of every city.</p>
            </div>
          </div>
        </div>

        {/* Get Started Section - Professional Light Mode */}
        <div className="bg-gray-100 dark:bg-gradient-to-r dark:from-orange-600 dark:to-blue-600 py-16 rounded-2xl shadow-lg dark:shadow-2xl mb-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Join Events Only The Nearby Traveler Community Knows About?</h2>
            <p className="text-xl mb-8 text-gray-700 dark:text-white dark:opacity-90">Join others already creating unforgettable experiences together.</p>
            
            {/* Single Professional CTA */}
            <div className="flex justify-center">
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 hover:bg-gray-100 dark:hover:from-blue-600 dark:hover:to-orange-600 text-black dark:text-white font-bold text-xl px-12 py-6 rounded-xl shadow-lg transition-all duration-200 border-2 border-black dark:border-white"
              >
                🎯 Join Nearby Traveler
              </Button>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
