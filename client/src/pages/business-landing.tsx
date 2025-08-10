
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import LandingNavbar from "@/components/landing-navbar";
const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      {/* Landing Navbar with Logo */}
      <LandingNavbar />

      {/* Hero Section with Photo Background */}
      <section 
        className="relative overflow-hidden text-white py-20 lg:py-32"
        style={{
          backgroundImage: `url(${businessHeaderPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.3)'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            Nearby Traveler for Businesses
          </h1>
          <p className="text-xl lg:text-2xl max-w-3xl mx-auto mb-8 text-white">
            Connect with travelers and locals who are actively exploring your area and looking for authentic experiences
          </p>
        </div>
      </section>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">

        <section className="mt-16 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Why Join Nearby Traveler Business Network?</h2>
          <ul className="list-disc list-inside text-lg text-white sm:text-gray-700 sm:dark:text-gray-200 space-y-2">
            <li>Reach travelers who are actively exploring your area and looking for authentic local experiences.</li>
            <li>Search and directly target locals and travelers in your area to market your offers and deals to those who express specific interests.</li>
            <li>Create time-limited offers and deals that attract both tourists and locals to your business.</li>
            <li>Host events to showcase your services and build community connections.</li>
            <li>Access detailed analytics about customer engagement and offer performance.</li>
            <li>Build lasting relationships with customers who will recommend you to fellow travelers.</li>
          </ul>
        </section>

        <section className="mt-12 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">1. Register</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Create your business profile and showcase what makes you special.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">2. Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Reach travelers and locals actively seeking your services.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">3. Grow</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Build lasting relationships and grow your customer base.
              </p>
            </div>
          </div>
        </section>

        {/* Business Types Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>Perfect for All Types of Businesses</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">🍽️</div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Restaurants & Cafes</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🏨</div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Hotels & Lodging</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🎨</div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Tours & Activities</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🛍️</div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Retail & Shopping</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-orange-500 text-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>Simple, Transparent Pricing</h2>
          <div className="text-6xl font-bold mb-2">$50</div>
          <div className="text-xl mb-4">per month + $100 sign-up fee</div>
          <div className="text-3xl font-bold mb-6 bg-white bg-opacity-20 px-8 py-4 rounded-full inline-block">
            Currently FREE during beta
          </div>
          <ul className="text-lg space-y-2 mb-6">
            <li>✓ Monthly deal limits</li>
            <li>✓ Event hosting capabilities</li>
            <li>✓ Analytics dashboard</li>
            <li>✓ Customer messaging</li>
            <li>✓ Priority support</li>
          </ul>
          <div className="flex justify-center">
            <a
              href="/signup-business"
              className="px-8 py-3 bg-blue-600 text-black font-bold rounded-lg shadow-lg hover:scale-105 transition"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Nearby Traveler</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Connecting travelers and locals worldwide through authentic experiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">For Businesses</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/business-registration">Register Business</Link></li>
                <li><Link href="/business-dashboard">Dashboard</Link></li>
                <li><Link href="/business-offers">Business Offers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/auth">Sign In</Link></li>
                <li><Link href="/signup-business">Join as Business</Link></li>
                <li><Link href="/events-landing">Events</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Nearby Traveler. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
