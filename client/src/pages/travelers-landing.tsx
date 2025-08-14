import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
const travelersHeaderImage = "/attached_assets/travelers together hugging_1754971726997.avif";

export default function TravelersLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Orange announcement banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-black py-2 px-4">
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
        <div className="bg-gray-800 dark:bg-gray-900">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src={travelersHeaderImage}
                alt="Travelers making connections and sharing experiences"
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
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Nearby Traveler For Travelers</span>
                      </h1>
                      
                      {/* Subhead */}
                      <div className="mt-8">
                        <p className="text-xl sm:text-2xl leading-relaxed max-w-3xl mx-auto">
                          <span className="text-orange-300">Skip the tourist traps</span>{' '}
                          <span className="text-white">and</span>{' '}
                          <span className="text-blue-300" style={{border: 'none', outline: 'none', boxShadow: 'none'}}>explore like a local</span>{' '}
                          <span className="text-black bg-orange-400 px-2 py-1 rounded">right now!</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-16">
        {/* Why Travelers Love Nearby Traveler */}
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Why Travelers Choose Nearby Traveler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-700 to-orange-800 sm:from-orange-50 sm:to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 dark:sm:from-orange-900/30 dark:sm:to-orange-800/30 p-6 rounded-xl shadow-lg border dark:border-orange-700/50">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Hidden Gems</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Discover secret spots, local hangouts, and authentic experiences that guidebooks never mention.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-700 to-blue-800 sm:from-blue-50 sm:to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 dark:sm:from-blue-900/30 dark:sm:to-blue-800/30 p-6 rounded-xl shadow-lg border dark:border-blue-700/50">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Local Connections</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Connect with locals who share your interests and get insider tips from people who actually live there.</p>
            </div>
            <div className="bg-gradient-to-br from-green-700 to-green-800 sm:from-green-50 sm:to-green-100 dark:from-green-900/30 dark:to-green-800/30 dark:sm:from-green-900/30 dark:sm:to-green-800/30 p-6 rounded-xl shadow-lg border dark:border-green-700/50">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Smart Matching</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Our AI matches you with locals and travelers based on shared interests, travel dates, and compatibility.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-700 to-purple-800 sm:from-purple-50 sm:to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 dark:sm:from-purple-900/30 dark:sm:to-purple-800/30 p-6 rounded-xl shadow-lg border dark:border-purple-700/50">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Instant Meetups</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Create "meet now" events for instant connections when you arrive in a new city and want to explore.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-700 to-pink-800 sm:from-pink-50 sm:to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 dark:sm:from-pink-900/30 dark:sm:to-pink-800/30 p-6 rounded-xl shadow-lg border dark:border-pink-700/50">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Cultural Immersion</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Experience authentic local culture through community events and personal connections with residents.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-700 to-teal-800 sm:from-teal-50 sm:to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 dark:sm:from-teal-900/30 dark:sm:to-teal-800/30 p-6 rounded-xl shadow-lg border dark:border-teal-700/50">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Personalized Tips</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Get customized recommendations based on your interests, budget, and travel style from real locals.</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-800 sm:from-indigo-50 sm:to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 dark:sm:from-indigo-900/30 dark:sm:to-indigo-800/30 p-6 rounded-xl shadow-lg border dark:border-indigo-700/50">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Real-Time Messaging</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Instant messaging with typing indicators, read receipts, and online status like AOL Messenger.</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-700 to-yellow-800 sm:from-yellow-50 sm:to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:sm:from-yellow-900/30 dark:sm:to-yellow-800/30 p-6 rounded-xl shadow-lg border dark:border-yellow-700/50">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Travel Date Matching</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Find travelers with overlapping dates in the same destination for coordinated adventures.</p>
            </div>
            <div className="bg-gradient-to-br from-red-700 to-red-800 sm:from-red-50 sm:to-red-100 dark:from-red-900/30 dark:to-red-800/30 dark:sm:from-red-900/30 dark:sm:to-red-800/30 p-6 rounded-xl shadow-lg border dark:border-red-700/50">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">AI Trip Planning</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Claude AI companion creates personalized itineraries based on your interests and travel style.</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-700 to-cyan-800 sm:from-cyan-50 sm:to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:sm:from-cyan-900/30 dark:sm:to-cyan-800/30 p-6 rounded-xl shadow-lg border dark:border-cyan-700/50">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Travel Memories</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Photo sharing with AI analysis, travel stories, and memory timeline to document your adventures.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 sm:from-emerald-50 sm:to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 dark:sm:from-emerald-900/30 dark:sm:to-emerald-800/30 p-6 rounded-xl shadow-lg border dark:border-emerald-700/50">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Travel Aura System</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Earn points for participating, sharing photos, and connecting with other travelers who share your interests.</p>
            </div>
            <div className="bg-gradient-to-br from-violet-700 to-violet-800 sm:from-violet-50 sm:to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 dark:sm:from-violet-900/30 dark:sm:to-violet-800/30 p-6 rounded-xl shadow-lg border dark:border-violet-700/50">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3 text-white sm:!text-black dark:text-white">Safety & References</h3>
              <p className="text-white sm:!text-black dark:text-gray-300">Reference system, user verification, and safety features to ensure trustworthy connections.</p>
            </div>
          </div>
        </div>

        {/* How It Works for Travelers */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            How It Works for Travelers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Plan Your Trip</h3>
              <p className="text-gray-700 dark:text-gray-300">Add your travel dates and destinations to find locals and other travelers who'll be there at the same time.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Get Matched</h3>
              <p className="text-gray-700 dark:text-gray-300">Our smart algorithm connects you with compatible locals and travelers based on interests and travel overlap.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Experience & Connect</h3>
              <p className="text-gray-700 dark:text-gray-300">Join local events, create meetups, and build lasting connections that enhance your travel experience.</p>
            </div>
          </div>
        </div>

        {/* Advanced Travel Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Advanced Travel Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-purple-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold mb-3 text-white">Surprise Me Feature</h3>
              <p className="text-white">Let locals surprise you with spontaneous activities and hidden gems you'd never discover on your own.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-teal-200 dark:border-gray-400">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3 text-white">Location Intelligence</h3>
              <p className="text-white">Smart location detection shows you nearby travelers, events, and meetup opportunities in real-time.</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-indigo-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3 text-white">Global Community</h3>
              <p className="text-white">Starting our beta launch in Los Angeles, growing to connect travelers worldwide with authentic local experiences.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-emerald-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3 text-white">Trip Synchronization</h3>
              <p className="text-white">Automatically sync your travel plans across devices and share itineraries with travel companions.</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-rose-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">Interest Targeting</h3>
              <p className="text-white">Precision matching based on 100+ interests and activities to find your perfect travel companions.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-600 dark:to-gray-500 p-6 rounded-xl shadow-lg border border-amber-200 dark:border-gray-400">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold mb-3 text-white">Event Discovery</h3>
              <p className="text-white">Access exclusive local events, festivals, and cultural experiences only available to community members.</p>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 to-blue-600 text-white p-12 rounded-2xl shadow-2xl max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              Ready for Authentic Travel?
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
              Join millions of travelers discovering the world through local eyes. Your next adventure with real connections awaits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/join"
                className="px-10 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-xl hover:scale-105 hover:shadow-2xl transition transform text-lg"
              >
                Sign up as a Traveler
              </a>
              <a
                href="/auth"
                className="px-10 py-4 border-2 border-white text-white font-bold rounded-xl shadow-xl hover:bg-white/20 backdrop-blur-sm transition text-lg"
              >
                Sign In to Explore
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}