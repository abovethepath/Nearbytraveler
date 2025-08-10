
import React from "react";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
import eventHeaderImage from "@assets/server/static/logo.png";

export default function EventsLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <LandingNavbar />
      
      {/* Hero Section with Beach BBQ Photo */}
      <div className="relative">
        <div className="relative h-[70vh] overflow-hidden">
          <img 
            src="/placeholder-events.svg" 
            alt="Beach BBQ Party with Friends" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                Discover & Create Events
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto text-white">
                Host unforgettable gatherings, join local meetups, and create lasting connections. From beach bonfires to city adventures - your next amazing experience awaits!
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-16">
        {/* Why Events Section */}
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Why Events on Nearby Traveler?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🏖️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Beach Bonfires & BBQs</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Host or join amazing beach gatherings, sunset BBQs, and campfire sessions just like the one above!</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Meetups</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Create spontaneous "meet now" events for instant connections when you're in a new city.</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Hidden Gems</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Discover secret local spots and authentic experiences that guidebooks never mention.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Local Connections</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Build lasting friendships with locals who share your interests and travel style.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Host Events</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Host events and activities you love doing in your city to meet like-minded locals and travelers.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Authentic Culture</h3>
              <p className="text-white sm:text-gray-700 sm:dark:text-gray-300">Experience authentic local culture through community-organized events and gatherings.</p>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-orange-600 text-white p-12 rounded-2xl shadow-2xl max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', WebkitTextStroke: '1px black', textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black'}}>
              Ready to Join and Create Local Events?
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of travelers and locals creating unforgettable memories together. From beach bonfires to city adventures - your community awaits!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/join"
                className="px-10 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:scale-105 hover:shadow-2xl transition transform text-lg"
              >
                Join Nearby Traveler
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
