import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
const localsHeaderImage = "/ChatGPT Image Jul 23, 2025, 01_18_34 PM_1753301968074.png";

export default function LocalsLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      


      {/* Landing Navbar */}
      <header className="sticky top-12 z-[55] bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
        <div className="pt-2">
          <LandingNavbar />
        </div>
      </header>
      
      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900 border border-white/30 dark:border-gray-300/20">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src={localsHeaderImage}
                alt="Locals sharing food and experiences"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-4 mx-auto max-w-full sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Share your city's secrets.</span>
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Meet incredible travelers and locals right now, today!!!</span>
                      </h1>
                      
                      {/* Local Benefits */}
                      <div className="mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl animate-zoom-in" style={{animationDelay: '0.3s'}}>
                        <p className="text-xl text-white leading-relaxed">
                          <span className="text-white font-bold">"Turn your neighborhood knowledge into amazing friendships.</span>
                          <span className="text-white"> Show travelers the REAL your city while meeting like-minded locals and creating unforgettable memories together."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg">— Be the Local Guide You'd Want to Meet</p>
                          <p className="text-white text-sm">Share hidden gems • Build global friendships • Host amazing experiences</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary signup CTA */}
                    <div className="mt-12 mb-8 px-4">
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-colors duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
                        style={{
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                          minHeight: 'clamp(60px, 12vw, 80px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 2.5s ease-in-out infinite',
                        }}
                      >
                        JOIN AS A LOCAL NOW!!!
                      </Button>
                      <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Share your city • Connect today • Build friendships</p>
                    </div>

                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Local Experiences Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Host Amazing Local Experiences
            </h2>
            <p className="text-xl text-gray-600">
              Real locals. Real experiences. Zero tourist nonsense.
            </p>
          </div>
          
          {/* Local Experience Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Hidden Gems Tour */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-400 to-purple-500">
                <img 
                  src="/image_1754973365104.png" 
                  alt="Local hidden gems experience" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Hidden Gems Walking Tour</h3>
                  <p className="text-sm text-gray-600">Share your secret neighborhood spots</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Local Guide</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Walking</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Culture</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Show travelers the REAL city - those amazing spots only locals know about. Build friendships while sharing your favorite places.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold mt-auto"
                >
                  START HOSTING
                </Button>
              </div>
            </div>
            
            {/* Local Food Experience */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col" style={{animationDelay: '0.2s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/beach travel_1754973619241.jpg" 
                  alt="Local food experience" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Authentic Food Adventure</h3>
                  <p className="text-sm text-gray-600">Your favorite local eats & hangouts</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Local Spots</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Take travelers to your favorite local restaurants and food spots. Share the authentic flavors and stories of your city.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold mt-auto"
                >
                  HOST FOOD TOURS
                </Button>
              </div>
            </div>
            
            {/* Meet Fellow Locals */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col" style={{animationDelay: '0.4s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-green-400 to-teal-500">
                <img 
                  src="/travelers together hugging_1754971726997.avif" 
                  alt="Locals meeting other locals" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Meet Fellow Locals</h3>
                  <p className="text-sm text-gray-600">Connect with like-minded neighbors</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Local Friends</span>
                  <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">Community</span>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">Meetups</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Connect with other locals in your city who share your interests. Build your local social circle and discover new friendships.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold mt-auto"
                >
                  MEET LOCALS
                </Button>
              </div>
            </div>
          </div>

          {/* Mid-section CTA */}
          <div className="text-center mb-16">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-black text-xl px-12 py-4 rounded-2xl shadow-xl transition-all duration-200"
              style={{
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                animation: 'gentle-pulse 3s ease-in-out infinite',
              }}
            >
              START HOSTING EXPERIENCES TODAY
            </Button>
            <p className="text-gray-600 mt-3 text-lg">Join thousands of locals building global friendships</p>
          </div>
        </div>
      </div>

      {/* Why Locals Love It - Modern Cards */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Why Locals Are Obsessed with Nearby Traveler
            </h2>
            <p className="text-xl text-gray-600">Turn your city knowledge into amazing friendships</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Share Your Secret Spots</h3>
              <p className="text-gray-700 text-lg">Show off those hidden gems only locals know. From secret viewpoints to hole-in-the-wall restaurants - share what makes your city special.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Meet Amazing People</h3>
              <p className="text-gray-700 text-lg">Connect with curious travelers AND like-minded locals. Build friendships that span the globe while discovering your own city.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Instant Social Life</h3>
              <p className="text-gray-700 text-lg">Create "meet now" events when you want to hang out. Always have someone interesting to explore your city with.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Modern Steps */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Start Hosting in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">From signup to hosting amazing experiences in minutes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Create Your Local Profile</h3>
              <p className="text-gray-700 text-lg leading-relaxed">Show off your city knowledge, interests, and favorite activities. Let travelers and locals know what makes you the perfect local connection.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Host Experiences</h3>
              <p className="text-gray-700 text-lg leading-relaxed">Create meetups, share hidden gems, or organize local adventures. Host experiences that showcase the real side of your city.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Build Global Friendships</h3>
              <p className="text-gray-700 text-lg leading-relaxed">Connect with amazing travelers and locals. Build lasting friendships while sharing what you love about your city.</p>
            </div>
          </div>
          
          {/* Another CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-black text-xl px-16 py-5 rounded-2xl shadow-2xl transition-all duration-200"
              style={{
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                animation: 'gentle-pulse 2.5s ease-in-out infinite',
              }}
            >
              BECOME A LOCAL HOST NOW
            </Button>
            <p className="text-gray-600 mt-4 text-lg">Free to join • Start hosting today • Build amazing friendships</p>
          </div>
        </div>
      </div>

      {/* Final Power CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black text-white mb-6">
            Ready to Transform Your Social Life?
          </h2>
          <p className="text-2xl text-white mb-12 leading-relaxed">
            Join thousands of locals building global friendships, sharing their cities, and creating unforgettable experiences every single day.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-white text-blue-600 font-black text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-200"
              style={{
                boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
              }}
            >
              JOIN AS A LOCAL NOW
            </Button>
            <Button
              onClick={() => setLocation('/auth')}
              size="lg"
              className="border-4 border-white text-white font-black text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              SIGN IN TO START
            </Button>
          </div>
          
          <p className="text-xl text-white/90">
            🏠 Free to join • 🌍 Global community • ⚡ Start hosting today
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}