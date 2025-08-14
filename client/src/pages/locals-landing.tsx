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
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
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
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Be the local you'd want to meet</span>
                      </h1>
                      
                      {/* Subhead */}
                      <div className="mt-8">
                        <p className="text-xl sm:text-2xl leading-relaxed max-w-3xl mx-auto">
                          <span className="text-orange-300">Share your city's hidden gems</span>{' '}
                          <span className="text-white">and connect with</span>{' '}
                          <span className="text-blue-300">travelers and like-minded locals</span>{' '}
                          <span className="text-black bg-orange-400 px-2 py-1 rounded">—today.</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Primary signup CTA */}
                    <div className="mt-12 mb-8 px-4">
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-all duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
                        style={{
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                          minHeight: 'clamp(60px, 12vw, 80px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 2.5s ease-in-out infinite',
                        }}
                      >
                        JOIN AS A LOCAL
                      </Button>
                      <p className="mt-6 text-sm sm:text-base font-medium px-2">
                        <span className="text-orange-300">Share your city</span>{' '}
                        <span className="text-white">•</span>{' '}
                        <span className="text-blue-300">Connect today</span>{' '}
                        <span className="text-white">•</span>{' '}
                        <span className="text-orange-300">Build friendships</span>
                      </p>
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
              Build Your Local Community & Welcome Travelers
            </h2>
            <p className="text-xl text-gray-600">
              Connect with neighbors. Welcome visitors. Share your city's best secrets.
            </p>
          </div>
          


          {/* Unique Features Section */}
          <div className="max-w-6xl mx-auto px-4 text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              What Makes Nearby Traveler Special
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-4xl mb-4">🏖️</div>
                <h3 className="text-xl font-bold mb-3 text-white">Beach Bonfires & BBQs</h3>
                <p className="text-white">Host or join amazing events such as beach gatherings, sunset BBQs, campfire hikes, bar crawls, and all social gatherings nearby.</p>
              </div>
              <div className="bg-teal-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold mb-3 text-white">Local Connections</h3>
                <p className="text-white">Build lasting friendships with locals who share your interests and travel style.</p>
              </div>
              <div className="bg-orange-700 p-6 rounded-xl shadow-lg text-white">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-3 text-white">Join or Host Events</h3>
                <p className="text-white">Host events and activities you love doing in your city to meet like-minded locals and travelers.</p>
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
JOIN THE COMMUNITY TODAY
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
              Join in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">From sign up to creating experiences in minutes</p>
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
BECOME A NEARBY LOCAL NOW
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