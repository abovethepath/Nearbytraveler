import React from "react";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
import localsHeaderImage from "@assets/ChatGPT Image Jul 23, 2025, 01_18_34 PM_1753301968074.png";

export default function LocalsLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <LandingNavbar />
      
      {/* Hero Section */}
      <div className="relative">
        <div className="relative h-[70vh] overflow-hidden">
          <img 
            src={localsHeaderImage} 
            alt="Locals sharing food and laughs together" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 drop-shadow-2xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                Nearby Traveler For Locals
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-8 drop-shadow-xl max-w-3xl mx-auto">
                Share your city's hidden gems, meet like-minded travelers, meet like-minded locals and transform your neighborhood knowledge into meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-16">
        {/* Why Locals Love Nearby Traveler */}
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Why Locals Choose Nearby Traveler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Share Local Secrets</h3>
              <p className="text-gray-700 dark:text-gray-300">Showcase your neighborhood's hidden gems, secret spots, and authentic experiences that only locals know about.</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Meet Global Friends</h3>
              <p className="text-gray-700 dark:text-gray-300">Connect with travelers from around the world and build lasting international friendships right in your hometown.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Host Events</h3>
              <p className="text-gray-700 dark:text-gray-300">Organize meetups, cultural exchanges, and local experiences that bring your community together.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Cultural Exchange</h3>
              <p className="text-gray-700 dark:text-gray-300">Learn about different cultures while sharing yours, creating meaningful cross-cultural connections.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Build Reputation</h3>
              <p className="text-gray-700 dark:text-gray-300">Earn aura points and get references from travelers and locals to create a trusted community.</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Matching</h3>
              <p className="text-gray-700 dark:text-gray-300">Our AI matches you with locals and travelers based on shared interests, travel dates, and compatibility.</p>
            </div>
          </div>
        </div>

        {/* How It Works for Locals */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            How It Works for Locals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Create Your Profile</h3>
              <p className="text-gray-700 dark:text-gray-300">Sign up as a local and showcase your city knowledge, interests, and the unique experiences you can offer.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Connect & Host</h3>
              <p className="text-gray-700 dark:text-gray-300">Meet travelers visiting your city and host events, meetups, or experiences that showcase your local expertise.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Earn & Grow</h3>
              <p className="text-gray-700 dark:text-gray-300">Build your reputation, earn references, and turn your local knowledge into lasting friendships and meaningful connections.</p>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-orange-600 text-white p-12 rounded-2xl shadow-2xl max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              Ready to Share Your City?
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of locals who are building international friendships, creating meaningful connections, and showcasing their cities to the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/join"
                className="px-10 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:scale-105 hover:shadow-2xl transition transform text-lg"
              >
                Sign Up as A Local
              </a>
              <a
                href="/auth"
                className="px-10 py-4 border-2 border-white text-white font-bold rounded-xl shadow-xl hover:bg-white/20 backdrop-blur-sm transition text-lg"
              >
                Sign In to Start
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}