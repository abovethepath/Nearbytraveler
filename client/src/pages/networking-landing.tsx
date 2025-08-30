import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/footer";
import { trackEvent } from "@/lib/analytics";
import NetworkingHero from "@/components/NetworkingHero";

export default function NetworkingLanding() {
  const [, setLocation] = useLocation();
  
  // Check URL for layout parameter - default to Airbnb style
  const urlParams = new URLSearchParams(window.location.search);
  const isAirbnbStyle = urlParams.get('layout') !== 'centered';

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'networking_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>
      
      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <NetworkingHero isAirbnbStyle={isAirbnbStyle} />

      {/* Quote Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="p-8">
            <p className="text-xl text-gray-800 dark:text-gray-300 leading-relaxed text-center font-light">
              "Thanks to Nearby Traveler, You can meet half your conference before even landing. An event can feel like a reunion, not a room full of strangers."
            </p>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-white text-base">— Aaron, Founder</p>
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
              Turn Conferences Into Communities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Before Events */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Before Events</h3>
              <ul className="space-y-3 text-left list-disc list-inside">
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Browse profiles of fellow attendees heading to the same city/event</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Break the ice with quick intros or group plans</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Arrive already connected and confident</li>
              </ul>
            </div>
            
            {/* During Events */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">During Events</h3>
              <ul className="space-y-3 text-left list-disc list-inside">
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Spot familiar faces instantly</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Skip awkward small talk</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Share updates, live moments, and create memories together</li>
              </ul>
            </div>
            
            {/* After Events */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">After Events</h3>
              <ul className="space-y-3 text-left list-disc list-inside">
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Keep your new contacts alive</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Plan future meetups or trips</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Instantly recognize connections at future events</li>
              </ul>
            </div>
          </div>
        </div>

        {/* WHY NETWORKING IS BROKEN */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-12">
              Why Traditional Networking Falls Short
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Traditional Approach</h3>
              <ul className="space-y-4 list-disc list-inside">
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Cold introductions & random encounters</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Awkward small talk</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Business cards that get lost</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">No way to keep in touch after</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Our Approach</h3>
              <ul className="space-y-4 list-disc list-inside">
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Warm connections before the event</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Shared context, stories & interests</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Real friendships and professional contacts</li>
                <li className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Easy reconnection anytime, anywhere</li>
              </ul>
            </div>
          </div>
        </div>

        {/* REAL-LIFE EXAMPLE STORY */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center py-12">
            <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-6">
              Connections That Cross Continents
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light max-w-3xl mx-auto">
              Imagine meeting someone at a startup mixer in New York… and then bumping into them at a food festival in Barcelona months later. With Nearby Traveler, you'll instantly recognize each other and pick up right where you left off.
            </p>
          </div>
        </div>

        {/* WHY PROFESSIONALS LOVE IT */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Professionals Love It
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Better than Business Cards</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Real profiles with photos & stories that create lasting impressions</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Pre-Networking Made Easy</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Walk in with warm intros instead of cold conversations</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Connections That Last</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Friendships & business contacts beyond the event</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
            >
              Start Networking Smarter
            </Button>
          </div>
        </div>


        {/* CLOSING CTA BANNER */}
        <div className="bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 text-black dark:text-white py-20 border-t border-gray-200 dark:border-0">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-light mb-6 text-gray-900 dark:text-white">Ready to Make Your Next Event Count?</h2>
            <p className="text-lg mb-8 text-gray-600 dark:opacity-90 font-light">Don't just show up. Arrive connected.</p>
            
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
            >
              Join the Network
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}