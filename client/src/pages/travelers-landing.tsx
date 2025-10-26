import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
const travelersHeaderImage = "/assets/travelers_1756778615408.jpg";

export default function TravelersLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);
  
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = ["Adventure Awaits Everywhere.", "The World Is Your Playground.", "Travel Like a Local."];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  return (
    <div className="bg-white font-sans">
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'travelers_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-join-now"
        >
          Join Now
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      <div className="w-full">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-8 sm:pt-8 sm:pb-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:gap-8 lg:gap-12 lg:grid-cols-2 items-center">
              
              {/* Left text side */}
              <div className="order-2 lg:order-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6 sm:mb-8">
                  Travel Like a Local
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Connect with locals and travelers for authentic experiences. Build real friendships that last a lifetime.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={() => {
                      trackEvent('signup_cta_click', 'travelers_landing', 'main_cta');
                      setLocation('/launching-soon');
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-main-cta"
                  >
                    Join Now
                  </Button>
                  <Button
                    onClick={() => {
                      trackEvent('learn_more_click', 'travelers_landing', 'see_how_it_works');
                      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
                    data-testid="button-learn-more"
                  >
                    See How It Works
                  </Button>
                </div>
              </div>

              {/* Right image side */}
              <div className="order-1 lg:order-2 flex flex-col items-center">
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 italic px-2">
                    Travel doesn't change you.<br />
                    The people you meet do.
                  </p>
                </div>
                
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  <img
                    src={travelersHeaderImage}
                    alt="Travelers connecting with arms around each other"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
                  />
                </div>
                
                <p className="mt-3 sm:mt-4 text-sm sm:text-base italic text-orange-600 text-center font-medium">
                  Where Local Experiences Meet Worldwide Connections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">

        {/* Core Features */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-black">Instant Meetups</h3>
              <p className="text-black mb-3">Create "meet now" events for instant connections.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Spontaneous adventures</li>
                <li>• Skip the planning stress</li>
                <li>• Connect in real-time</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-black">Local Connections</h3>
              <p className="text-black mb-3">Connect with locals for authentic experiences.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Skip tourist traps</li>
                <li>• Insider knowledge</li>
                <li>• Authentic cultural exchange</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-black">Real-Time Chat</h3>
              <p className="text-black mb-3">Instant messaging with full features.</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Group conversations</li>
                <li>• Photo & location sharing</li>
                <li>• Coordinated meetups</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Share Your Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add travel dates, interests, and what you want to explore</p>
            </div>
            <div>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Get Matched</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find compatible travelers and locals based on your interests</p>
            </div>
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Connect & Explore</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Join events, create meetups, and make lasting friendships</p>
            </div>
          </div>
        </div>

        {/* Founder Story */}
        <div className="max-w-4xl mx-auto mb-12 text-center px-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">From the Founder</h2>
          <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 mb-4">
            "After hosting 400+ travelers from 50 countries, I learned that one connection can change everything. Travelers spend billions on flights and hotels, yet the most valuable part—the people you meet—is left to chance. I built the solution I wished existed."
          </blockquote>
          <p className="text-sm text-gray-600 dark:text-gray-400">— Aaron Lefkowitz, Founder, Nearby Traveler</p>
        </div>

        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Why Choose Nearby Traveler?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-200 dark:bg-emerald-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Quality Over Quantity</h3>
              <p className="text-gray-700 dark:text-white flex-grow">We focus on meaningful connections, not endless swiping. Every match is based on genuine compatibility and shared interests.</p>
            </div>
            <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Safe & Verified</h3>
              <p className="text-gray-700 dark:text-white flex-grow">All users are verified for safety. Meet in public places and trust your instincts - we provide the tools for safe connections.</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Connect Before You Arrive</h3>
              <p className="text-gray-700 dark:text-white flex-grow">Meet locals and travelers before your trip starts. Plan meetups, get insider tips, and hit the ground running.</p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Know When Friends Are Nearby</h3>
              <p className="text-gray-700 dark:text-white flex-grow">Reconnect when paths cross again. See when someone you met in Barcelona shows up in Tokyo.</p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Join Weekly Sponsored Events</h3>
              <p className="text-gray-700 dark:text-white flex-grow">Free and low-cost events every week. From beach bonfires to taco tours—authentic experiences hosted by passionate locals.</p>
            </div>
            <div className="bg-pink-200 dark:bg-pink-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Real-Time Coordination</h3>
              <p className="text-gray-700 dark:text-white flex-grow">Full-featured chat with photos, location sharing, and group conversations. No more juggling apps.</p>
            </div>
            <div className="bg-rose-200 dark:bg-rose-600 p-6 rounded-xl shadow-lg flex flex-col h-full">
              <div className="text-3xl mb-4">❤️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Friendships That Last</h3>
              <p className="text-gray-700 dark:text-white flex-grow">Build a global network of real connections. These aren't just travel buddies—they're lifelong friends.</p>
            </div>
          </div>
        </div>

        {/* Community Events Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Join Authentic Experiences Every Week
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Every week, Nearby Traveler sponsors authentic local experiences. From cultural adventures to food tours, these events bring our community together.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Beach Bonfire & BBQ</h3>
              <p className="text-sm font-semibold text-orange-600 mb-3">Free</p>
              <p className="text-gray-700">Sunset gathering with locals—authentic LA beach culture, music, and new friends.</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Taco Tuesday</h3>
              <p className="text-sm font-semibold text-orange-600 mb-3">$1.50</p>
              <p className="text-gray-700">Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Hollywood Sign Hike</h3>
              <p className="text-sm font-semibold text-orange-600 mb-3">Free</p>
              <p className="text-gray-700">Saturday morning hikes with locals and travelers—amazing views, great photos, real LA.</p>
            </div>
          </div>
        </div>

        {/* Perfect For Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Perfect For</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🎒</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Solo Travelers</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Turn exploring alone into shared adventures</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">👨‍👩‍👧</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Families</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Connect with local families and fellow travelers with kids</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">💼</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Business Travelers</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Make work trips more than just meetings</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🆕</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">New in Town</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Moving to a new city? Find your tribe fast</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🌍</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Digital Nomads</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Build community wherever you land</p>
            </div>
          </div>
        </div>
        
        {/* Get Started */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white py-12 rounded-2xl shadow-lg mb-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Travel Like a Local?</h2>
            <p className="text-lg mb-6 text-white/90">Join thousands of travelers who've turned solo trips into lifelong friendships. Your next adventure starts with the people you'll meet.</p>
            <p className="text-xl mb-6 text-white/90">✈️ Free to join • 🌍 Global community</p>
            <Button
              onClick={() => setLocation('/launching-soon')}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold px-8 py-3 rounded-lg"
              data-testid="button-get-started"
            >
              Join Now
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}