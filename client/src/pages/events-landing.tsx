
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
      
      {/* Orange announcement banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-black py-3 px-4 shadow-lg">
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <div className="flex-1 text-center">
            <span className="font-bold text-lg">🔥 Connect with Locals and Travelers TODAY - Sign Up Now!</span>
          </div>
          <Button
            onClick={() => setLocation('/join')}
            className="bg-black text-orange-400 font-bold px-6 py-2 rounded-lg hover:bg-gray-800 ml-4"
          >
            SIGN UP NOW
          </Button>
        </div>
      </div>

      {/* Landing Navbar */}
      <header className="sticky top-12 z-[55] bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
        <div className="pt-2">
          <LandingNavbar />
        </div>
      </header>
      
      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src={eventHeaderImage}
                alt="Beach BBQ Party with Friends"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Join User Created Events</span>
                        <span className="block font-black" style={{fontFamily: '"Inter", sans-serif'}}>
                          <span className="text-orange-400">and Make Real Connections </span>
                          <span style={{color: '#3b82f6'}}>with Nearby Travelers, </span>
                          <span className="text-white">While Connecting with Other Locals.</span>
                        </span>
                      </h1>
                      
                      {/* Event value proposition */}
                      <div className="mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 animate-zoom-in" style={{animationDelay: '0.3s'}}>
                        <p className="text-xl text-white leading-relaxed">
                          <span className="text-orange-300 font-bold">"Join beach bonfires, rooftop parties, food tours, and adventures.</span>
                          <span className="text-white"> Every event is a chance to meet amazing locals and travelers who become lifelong friends."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg">— Your Community Awaits</p>
                          <p className="text-orange-200 text-sm">From beach BBQs to secret speakeasies - join the fun today</p>
                        </div>
                      </div>
                      
                      {/* Hero CTA */}
                      <div className="mt-8">
                        <Button
                          onClick={() => setLocation('/join')}
                          size="lg"
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 animate-pulse-glow"
                        >
                          🎉 Join Nearby Traveler NOW!!!!
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

      {/* Sticky CTA Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse border-4 border-white"
        >
          🎪 JOIN EVENTS
        </Button>
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
                  src="/beach travel_1754973619241.jpg" 
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
                  src="/beach travel_1754973619241.jpg" 
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
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Experience authentic local restaurants and food spots. Taste the real flavors and stories of the city with friendly locals.</p>
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
                  src="/travelers together hugging_1754971726997.avif" 
                  alt="Beach BBQ event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Beach BBQ & Bonfire</h3>
                  <p className="text-sm text-gray-600">Sunset BBQ with new friends</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">BBQ</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join our weekly beach BBQ gatherings. Meet amazing locals and travelers while enjoying great food and beautiful sunsets.</p>
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
            <h2 className="text-4xl font-bold mb-4">Ready to Make Epic Memories?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands already creating unforgettable experiences together.</p>
            
            {/* Primary CTA Row */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:justify-center mb-8">
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
              >
                🚀 Join Event Community
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
              >
                🎉 Create Your Event
              </Button>
            </div>
            
            {/* Additional Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🏖️ Beach Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🍕 Food Tours
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
              >
                🎵 Music Events
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg text-sm"
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
