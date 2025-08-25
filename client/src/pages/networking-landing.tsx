import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";

export default function NetworkingLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Sticky CTA - Always Visible */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          size="lg"
          className="bg-purple-500 hover:bg-purple-600 text-white font-black px-8 py-4 rounded-2xl shadow-2xl transition-colors duration-200 border-3 border-white"
          style={{
            boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9)',
            animation: 'gentle-pulse 2.5s ease-in-out infinite',
          }}
        >
          JOIN NETWORK
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="relative z-0">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-purple-500 shadow-lg">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900"></div>
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
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.5rem)] text-white mb-4">
                          ✨ Network Smarter — Before, During, and After Every Event ✨
                        </span>
                      </h1>
                      
                      {/* Hero subtext */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed px-2">
                          Whether you're flying in for a conference or exploring a new city, Nearby Traveler helps you connect before you arrive, meet with purpose during the event, and stay in touch long after it's over.
                        </p>
                      </div>
                    </div>
                    
                    {/* Hero CTAs */}
                    <div className="mt-12 mb-8 px-4 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:justify-center">
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-purple-500 hover:bg-purple-600 text-white font-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl shadow-xl transition-all duration-200 w-full sm:w-auto"
                      >
                        👉 Start Networking Now
                      </Button>
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl shadow-xl transition-all duration-200 w-full sm:w-auto"
                      >
                        📅 See Who's Going
                      </Button>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-16">
        
        {/* HOW IT WORKS - TIMELINE */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Connect before, during, and after every event
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Before Events */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl p-8 shadow-lg text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-black mb-6">Before Events</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Browse profiles of fellow attendees heading to the same city/event</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Break the ice with quick intros or group plans</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Arrive already connected and confident</span>
                </div>
              </div>
            </div>
            
            {/* During Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-purple-200 dark:border-purple-600 text-center">
              <div className="text-4xl mb-4">💫</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">During Events</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Spot familiar faces instantly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Skip awkward small talk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Share updates, live moments, and create memories together</span>
                </div>
              </div>
            </div>
            
            {/* After Events */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl p-8 shadow-lg text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-black mb-6">After Events</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Keep your new contacts alive</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Plan future meetups or trips</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Instantly recognize connections at future events</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHY NETWORKING IS BROKEN */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Networking is Broken
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">❌ Old Way</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Cold introductions & random encounters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Awkward small talk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Business cards that get lost</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>No way to keep in touch after</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">✅ Nearby Traveler Way</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Warm connections before the event</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Shared context, stories & interests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Real friendships and professional contacts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>•</span>
                    <span>Easy reconnection anytime, anywhere</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-LIFE EXAMPLE STORY */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-8 shadow-lg border border-indigo-200 dark:border-indigo-700">
            <div className="text-center">
              <div className="text-5xl mb-6">🌟</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connections That Cross Continents
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "Imagine meeting someone at a startup mixer in New York… and then bumping into them at a food festival in Barcelona months later. With Nearby Traveler, you'll instantly recognize each other and pick up right where you left off. That's the power of lasting connections."
              </p>
            </div>
          </div>
        </div>

        {/* WHY PROFESSIONALS LOVE IT */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Professionals Love It
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg border dark:border-purple-700/50">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-black">Better than Business Cards</h3>
              <p className="text-black">Real profiles with photos & stories that create lasting impressions</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-6 rounded-xl shadow-lg border dark:border-indigo-700/50">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-black">Pre-Networking Made Easy</h3>
              <p className="text-black">Walk in with warm intros instead of cold conversations</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg border dark:border-purple-700/50">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold mb-3 text-black">Connections That Last</h3>
              <p className="text-black">Friendships & business contacts beyond the event</p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-lg"
            >
              🚀 Start Networking Smarter
            </Button>
          </div>
        </div>

        {/* SOCIAL PROOF - Future Ready */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What Our Network Says
              </h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-4">
                  "Thanks to Nearby Traveler, I met half my conference crew before I even landed. The event felt like a reunion, not a room full of strangers."
                </p>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  — Alex, Startup Founder
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CLOSING CTA BANNER */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16 rounded-2xl shadow-2xl">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-4">💼 Ready to Make Your Next Event Count?</h2>
            <p className="text-xl mb-8 opacity-90">Don't just show up. Arrive connected.</p>
            
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-xl px-12 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              👉 Join the Network
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}