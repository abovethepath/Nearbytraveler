import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
const localsHeaderImage = "/ChatGPT Image Jul 23, 2025, 01_18_34 PM_1753301968074.png";

export default function LocalsLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
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
              <div
                className="absolute inset-0 sm:bg-gray-800/70"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0))' }}
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white">
                          Be the Local You'd Want to Meet.
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]">
                          <span className="text-amber-300 sm:text-orange-500">Share Your City's Hidden Gems </span>
                          <span className="text-blue-300 sm:text-blue-600">with Nearby Travelers</span>
                          <span className="text-white sm:text-black"> and Connect with Like-Minded Locals</span>
                        </span>
                      </h1>
                      
                      {/* Local credibility/value proposition (hide on phones so the hero photo is visible) */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-xl text-white leading-relaxed">
                          <span className="text-orange-300 font-bold">"I have friends spanning across the globe now"</span>
                          <span className="text-white"> —Aaron, Founder</span>
                        </p>
                        <div className="mt-6">
                          <p className="text-lg text-white leading-relaxed">
                            <span className="text-orange-300 font-bold">"Share your city's best-kept secrets and hidden gems.</span>
                            <span className="text-white"> Connect with genuine travelers who want authentic local experiences, not tourist traps. Be the local friend you'd want to meet."</span>
                          </p>
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg">— Real Locals, Real Connections</p>
                          <p className="text-orange-200 text-sm">Join others sharing authentic local experiences</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary signup CTA */}
                    <div className="mt-12 mb-8 px-4">
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-transparent hover:bg-white/10 text-white font-bold text-lg px-8 py-3 rounded-full border-2 border-white transition-all duration-200 transform hover:scale-105"
                      >
                        JOIN AS A LOCAL NOW
                      </Button>
                      <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Join the travel community • Connect today</p>
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
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight px-2">
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
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 text-white leading-tight">Beach Bonfires & BBQs</h3>
                <p className="text-white text-sm sm:text-base leading-relaxed">Host or join amazing events such as beach gatherings, sunset BBQs, campfire hikes, bar crawls, and all social gatherings nearby.</p>
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
            <p className="text-gray-600 mt-4 text-lg">Free to join • Start connecting today • Build amazing friendships</p>
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