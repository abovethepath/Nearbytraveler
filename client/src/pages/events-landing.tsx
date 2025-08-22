
import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
const eventHeaderImage = "/event page bbq party_1753299541268.png";

export default function EventsLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Top sticky banner */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[70] bg-orange-500 text-black py-3 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <span className="font-bold text-sm">🎆 Join Amazing Events with Locals & Travelers!</span>
          <Button
            onClick={() => setLocation("/join")}
            className="bg-black text-orange-400 font-bold px-3 py-2 rounded-lg hover:bg-gray-800 shrink-0"
          >
            JOIN NOW
          </Button>
        </div>
      </div>

      {/* Landing Navbar under banner on mobile */}
      <header className="sticky top-[52px] md:top-0 z-[60] w-full bg-white shadow-sm">
        <div className="w-full bg-white">
          <LandingNavbar />
        </div>
      </header>
      
      {/* HERO SECTION */}
      <div className="relative z-0">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
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
                    "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0))"
                }}
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight px-2 sm:px-4 leading-relaxed">
                        <span className="block font-black text-white">
                          Join User Created Events
                        </span>
                        <span className="block font-black">
                          <span className="text-amber-300 sm:text-orange-500">and Make Real Connections </span>
                          <span className="text-blue-300 sm:text-blue-600">with Nearby Travelers, </span>
                          <span className="text-white sm:text-black">While Connecting with Other Locals.</span>
                        </span>
                      </h1>
                      
                      {/* Event value proposition – below image on mobile, overlaid on md+ */}
                      <div className="mt-6 md:mt-0">
                        <div className="md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[min(92vw,720px)]">
                          <div className="bg-black/60 md:bg-black/50 text-white rounded-2xl border border-white/20 backdrop-blur p-4 sm:p-6 shadow-xl">
                            <p className="text-sm sm:text-base md:text-lg leading-relaxed break-words">
                              <span className="text-orange-300 font-semibold">
                                "Join beach bonfires, parties, food tours, and adventures.
                              </span>
                              <span className="text-white">
                                {" "}Every event is a chance to meet amazing locals and travelers who become lifelong friends."
                              </span>
                            </p>
                            <div className="mt-3 text-center">
                              <p className="text-white font-bold">— Your Community Awaits</p>
                              <p className="text-orange-200 text-xs sm:text-sm">From beach BBQs to secret speakeasies - join the fun today</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse border-4 border-white"
        >
          🎪 JOIN EVENTS
        </Button>
      </div>

      {/* Primary signup CTA - Moved to bottom of hero */}
      <div className="bg-white py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Button
            onClick={() => setLocation('/join')}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition-all duration-200 w-full"
          >
            🎉 Join Nearby Traveler NOW!!!!
          </Button>
          <p className="text-gray-600 mt-3 text-base sm:text-lg font-semibold px-2">Join amazing events today</p>
        </div>
      </div>

      <main className="flex-1 px-4 py-16">
        
        {/* Multiple CTA Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Join the Fun?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Choose your adventure and start making connections today!</p>
            
            {/* Primary CTA Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🌍 JOIN AS TRAVELER
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🏠 JOIN AS LOCAL
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🎉 CREATE EVENT
              </Button>
            </div>
            
            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🎪 Tonight's Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🍕 Food Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🏖️ Beach Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🎵 Music Events
              </Button>
            </div>
          </div>
        </div>

        
        {/* Sample Events Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Upcoming Local Events & Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Venice Beach Dance Party */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
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

            {/* BBQ Event */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-green-400 to-teal-500">
                <img 
                  src="/beach-bbq-bonfire.png" 
                  alt="Beach BBQ event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight">Beach BBQ & Bonfire</h3>
                  <p className="text-sm text-gray-600">Sunset BBQ with new friends</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">BBQ</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow leading-relaxed">Join our monthly beach BBQ where we pass a guitar, sing songs, bring pot luck food and meet new friends. Sometimes we even jump in the ocean</p>
                <a
                  href="/join"
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded text-center transition duration-200"
                >
                  JOIN BBQ
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
            <div className="bg-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold mb-3 text-white">Epic Experiences</h3>
              <p className="text-white">From beach bonfires to rooftop parties - join unforgettable events created by passionate locals who know the best spots.</p>
            </div>
            <div className="bg-teal-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold mb-3 text-white">Instant Connections</h3>
              <p className="text-white">Meet amazing travelers and locals who share your interests. Every event is a chance to make lifelong friendships.</p>
            </div>
            <div className="bg-orange-700 p-6 rounded-xl shadow-lg text-white">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3 text-white">Local Secrets</h3>
              <p className="text-white">Discover hidden gems and authentic experiences that tourists never find. Access the real side of every city.</p>
            </div>
          </div>
        </div>

        {/* Get Started Section - Enhanced with Multiple CTAs */}
        <div className="bg-gradient-to-r from-orange-600 to-blue-600 text-white py-16 rounded-2xl shadow-2xl mb-16">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-4">Ready to Join Events Only The Nearby Traveler Community Knows About?</h2>
            <p className="text-xl mb-8 opacity-90">Join others already creating unforgettable experiences together.</p>
            
            {/* Primary CTA Row */}
            <div className="mb-8 flex justify-center">
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-2 border-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🎯 Join Nearby Traveler Today!!!
              </Button>
            </div>
            
            {/* Additional Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                🏖️ Beach Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                🍕 Food Tours
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                🎵 Music Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                🎪 Night Life
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
