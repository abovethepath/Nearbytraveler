import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/footer";
const localsHeaderImage = "/ChatGPT Image Jul 23, 2025, 01_18_34 PM_1753301968074.png";

export default function LocalsLanding() {
  const [, setLocation] = useLocation();
  
  // Check URL for layout parameter - default to Airbnb style
  const urlParams = new URLSearchParams(window.location.search);
  const isAirbnbStyle = urlParams.get('layout') !== 'centered';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8 grid gap-6 sm:gap-8 md:grid-cols-5 items-center">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <>
            {/* Left text side */}
            <div className="md:col-span-3">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                <h1>Be the Local You'd Want to Meet</h1>
              </div>
              <div className="mt-3 sm:mt-4 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                <p>Share your city's hidden gems with nearby travelers and connect with like-minded locals</p>
              </div>
            </div>
            
            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[250px] sm:h-[300px] md:h-[400px] rounded-2xl">
                <img
                  src={localsHeaderImage}
                  alt="Locals sharing experiences and welcoming travelers"
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                />
              </div>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm italic text-orange-600 text-center">
                Where Local Experiences Meet Worldwide Connections
              </p>
            </div>
            </>
          ) : (
            // Original centered layout (for investors)
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
                Be the Local You'd Want to Meet
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Share your city's hidden gems with nearby travelers and connect with like-minded locals
              </p>
              
              <Button
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                Join the Journey
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xl text-black dark:text-white leading-relaxed">
              <span className="text-black dark:text-orange-500 font-bold">"I have friends spanning across the globe now"</span>
              <span className="text-black dark:text-white"> —Aaron, Founder</span>
            </p>
            <div className="mt-6">
              <p className="text-lg text-black dark:text-gray-300 leading-relaxed">
                <span className="text-black dark:text-orange-500 font-bold">"Share your city's best-kept secrets and hidden gems.</span>
                <span className="text-black dark:text-gray-300"> Connect with genuine travelers who want authentic local experiences, not tourist traps. Be the local friend you'd want to meet."</span>
              </p>
            </div>
            <div className="mt-4 text-center">
              <p className="text-black dark:text-white font-bold text-lg">— Real Locals, Real Connections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Local Experiences Section */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight px-2">
              Build Your Local Community & Welcome Travelers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Connect with neighbors. Welcome visitors. Share your city's best secrets.
            </p>
          </div>
          


          {/* Unique Features Section */}
          <div className="max-w-6xl mx-auto px-4 text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              What Makes Nearby Traveler Special
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              <div className="bg-emerald-200 dark:bg-emerald-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Authentic Local Experiences</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Skip tourist traps and discover hidden gems with locals who know the city best.
                </p>
              </div>
              <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Real Friendships & Connections</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Meet people who share your interests and travel style — friendships that last beyond the trip.
                </p>
              </div>
              <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Host or Join Events</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Create or join activities you love — from rooftop parties and food tours to hikes and art walks.
                </p>
              </div>
              <div className="bg-purple-200 dark:bg-purple-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Pre-Network for Business Events</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  See who's attending conferences, mixers, or meetups before they start. Break the ice early, walk in with warm intros, and keep connections alive afterward.
                </p>
              </div>
              <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Your Social Travel Calendar</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Sync trips, events, and connections into one calendar so you never miss a chance to meet up.
                </p>
              </div>
              <div className="bg-rose-200 dark:bg-rose-600 p-6 rounded-xl shadow-lg text-gray-800 dark:text-white flex flex-col h-full">
                <div className="text-4xl mb-4">💕</div>
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white leading-tight">Lasting Memories & Stories</h3>
                <p className="text-gray-700 dark:text-white text-sm leading-relaxed flex-grow">
                  Create unforgettable moments and collect amazing stories from every connection you make around the world.
                </p>
              </div>
            </div>
          </div>

          {/* Mid-section CTA */}
          <div className="text-center mb-16">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              style={{
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                animation: 'gentle-pulse 3s ease-in-out infinite',
              }}
            >
JOIN THE COMMUNITY TODAY
            </Button>
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-lg">Join thousands of locals building global friendships</p>
          </div>
        </div>
      </div>



      {/* Why Locals Love It - Modern Cards */}
      <div className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              Why Locals Are Obsessed with Nearby Traveler
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Turn your city knowledge into amazing friendships</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Share Your Secret Spots</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Show off those hidden gems only locals know. From secret viewpoints to hole-in-the-wall restaurants - share what makes your city special.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Meet Amazing People</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Connect with curious travelers AND like-minded locals. Build friendships that span the globe while discovering your own city.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Instant Social Life</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">Create "meet now" events when you want to hang out. Always have someone interesting to explore your city with.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Modern Steps */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              Join in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">From sign up to creating experiences in minutes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Your Local Profile</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">Show off your city knowledge, interests, and favorite activities. Let travelers and locals know what makes you the perfect local connection.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Host Experiences</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">Create meetups, share hidden gems, or organize local adventures. Host experiences that showcase the real side of your city.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Build Global Friendships</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">Connect with amazing travelers and locals. Build lasting friendships while sharing what you love about your city.</p>
            </div>
          </div>
          
          {/* Another CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              style={{
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                animation: 'gentle-pulse 2.5s ease-in-out infinite',
              }}
            >
BECOME A NEARBY LOCAL NOW
            </Button>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-lg">Free to join • Start connecting today • Build amazing friendships</p>
          </div>
        </div>
      </div>

      {/* Final Power CTA Section */}
      <div className="py-20 bg-gray-100 dark:bg-gradient-to-r dark:from-blue-600 dark:via-purple-600 dark:to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Social Life?
          </h2>
          <p className="text-2xl text-gray-700 dark:text-white mb-12 leading-relaxed">
            Join thousands of locals building global friendships, sharing their cities, and creating unforgettable experiences every single day.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              style={{
                boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
              }}
            >
              JOIN AS A LOCAL NOW
            </Button>
          </div>
          
          <p className="text-xl text-gray-600 dark:text-white/90">
            🏠 Free to join • 🌍 Global community
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}