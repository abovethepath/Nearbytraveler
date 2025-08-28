import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Fixed CTA Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setLocation('/auth')}
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition-all duration-300 hover:scale-105 px-6 py-3 rounded-full"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4">
        {/* HERO SECTION - With Original Photo */}
        <div className="relative z-10">
          <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
            <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 h-full min-h-[600px]">
                <img
                  src="/travelers together hugging_1754971726997.avif"
                  alt="Travel experience"
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
                  <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32 mx-auto max-w-full px-4">
                    <div className="text-center">
                      <div className="max-w-4xl mx-auto">
                        <h1 className="px-3 leading-tight sm:leading-snug">
                          <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white" style={{ fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                            Skip the Tourist Traps, Connect Before Your Trip, Keep Connections Forever Create Lifelong Friends!!!
                          </span>
                          <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)] mt-4" style={{ fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                            <span className="text-amber-300 sm:text-orange-500">Meet Locals and Other </span>
                            <span className="text-blue-300 sm:text-blue-600">Nearby Travelers </span>
                            <span className="text-white">Right Now, Today!!!</span>
                          </span>
                        </h1>
                        
                        {/* Primary signup CTA - Lowered and reasonably sized */}
                        <div className="mt-20 mb-8 px-4">
                          <Button
                            onClick={() => setLocation('/auth')}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 border-2 border-white max-w-md mx-auto"
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

        {/* FROM THE FOUNDER SECTION - Original with 3 Icons */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-16">
          {/* Blue to orange gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>
          
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                From the Founder
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-white to-blue-300 mx-auto rounded-full"></div>
            </div>
            
            {/* Main content with better readability */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-xl sm:text-2xl text-white leading-relaxed font-medium mb-6">
                  "As a traveler and local, I always loved meeting new people—but finding those who truly shared my interests wasn't easy."
                </p>
                <p className="text-2xl sm:text-3xl text-white font-bold leading-relaxed mb-6">
                  That's why I created Nearby Traveler.
                </p>
              </div>
              
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <p className="text-lg text-gray-900 dark:text-white leading-relaxed mb-6 text-center font-medium">
                  Nearby Traveler connects travelers and locals through shared interests, activities, demographics, and events—transforming random encounters into life-changing connections.
                </p>
                
                {/* Benefits with orange and blue theme */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">🤝</div>
                    <p className="font-bold text-black dark:text-white">Connect with like-minded people</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-blue-300 shadow-lg">
                    <div className="text-3xl mb-3">💎</div>
                    <p className="font-bold text-gray-900 dark:text-white">Discover hidden gems</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">✨</div>
                    <p className="font-bold text-black dark:text-white">Create unforgettable memories</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-900 dark:text-white leading-relaxed text-center mb-6 font-medium">
                  It's more than just travel—it's about real community, wherever you are.
                </p>
                
                {/* Founder signature with orange and blue accents */}
                <div className="text-center pt-6 border-t border-blue-200 dark:border-blue-600">
                  <p className="text-lg text-gray-800 dark:text-gray-200 mb-3 font-medium">Thanks for being part of the journey.</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div>
                      <p className="text-xl font-black text-gray-900 dark:text-white">Aaron Lefkowitz</p>
                      <p className="text-blue-600 font-bold">Founder, Nearby Traveler</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Experiences - With Original Photos */}
        <div className="relative z-10 py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-normal px-2">
                Featured Experiences
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-2">
                ✨ Just a few ways our community connects:
              </p>
            </div>
            
            {/* Event Cards - Original Style with Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-12">

              {/* Beach Bonfire Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                  <img 
                    src="/event page bbq party_1753299541268.png" 
                    alt="Beach bonfire event" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sunset gathering on the beach</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-8 flex-grow leading-relaxed">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>
              
              {/* Taco Tuesday Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                  <img 
                    src="/image_1754973365104.png" 
                    alt="Authentic taco stand with vintage neon sign" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Tuesday • $1.50 tacos</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$1.50</span>
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-8 flex-grow leading-relaxed">Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>
              
              {/* Hollywood Sign Hike Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                  <img 
                    src="/image_1754974796221.png" 
                    alt="Hollywood Sign at sunrise with mountain views" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Hollywood Sign Hike</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Saturday • 9:00 AM</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Hiking</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-8 flex-grow">Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    JOIN TO CONNECT
                  </Button>
                </div>
              </div>

            </div>

            <div className="text-center">
              <Button 
                onClick={() => setLocation('/events')}
                variant="outline"
                className="text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
              >
                See All Events
              </Button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How It Works</h2>
            <p className="text-center text-xl text-gray-600 dark:text-gray-400 mb-12">Three simple steps to turn travel into connection:</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Join the Movement</h3>
                <p className="text-gray-600 dark:text-gray-400">Share your interests and destinations. Our matching connects you with like-minded locals and travelers.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Make Real Connections</h3>
                <p className="text-gray-600 dark:text-gray-400">Chat and meet people who share your vibe. No awkward small talk—just shared adventures.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Epic Memories</h3>
                <p className="text-gray-600 dark:text-gray-400">Join authentic experiences, discover hidden gems, and turn strangers into friends.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Who It's For</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Locals */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Locals</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Turn your city into lasting friendships. Share your favorite spots, create events, and connect with travelers and fellow locals.</p>
                <Button 
                  onClick={() => setLocation('/locals-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Locals
                </Button>
              </div>

              {/* Travelers */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Travelers</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Skip the tourist traps. Meet locals who know the real city, join authentic events, and find travel buddies who share your interests.</p>
                <Button 
                  onClick={() => setLocation('/travelers-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Travelers
                </Button>
              </div>

              {/* Businesses */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Businesses</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Whether you run a bar, café, co-working space, or event venue—connect with travelers and locals looking for authentic experiences.</p>
                <Button 
                  onClick={() => setLocation('/business-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Businesses
                </Button>
              </div>

              {/* Networking */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Networking</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Heading to a conference, festival, or business trip? Connect before you arrive, meet like-minded people, and keep connections alive.</p>
                <Button 
                  onClick={() => setLocation('/networking-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore Networking
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-16 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Adventure</h2>
            <p className="text-xl mb-8">Join thousands of locals, travelers, and businesses already making real connections.</p>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              Join Nearby Traveler Now
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}