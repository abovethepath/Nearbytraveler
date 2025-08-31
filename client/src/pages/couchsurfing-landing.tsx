import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Calendar } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import couchsurfingHeroImage from "@assets/image_1756515286749.png";

export default function CouchsurfingLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'couchsurfing_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION - ABOVE THE FOLD */}
        <div className="pt-8 pb-12 sm:pt-12 sm:pb-16 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
            {/* Strong Headline */}
            <div className="mb-6 inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-4 sm:px-6 py-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <span className="inline w-4 h-4 mr-2">❤️</span>
              Same Spirit, Less Hassle
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
              Love Couchsurfing?
              <br className="hidden sm:block" />
              <span className="text-blue-600">You'll Love This.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Meet travelers and locals through shared interests — whether you can host or not.
            </p>
            
            {/* Clear CTA Button */}
            <div className="mb-12">
              <Button 
                onClick={() => {
                  trackEvent('signup_cta_click', 'couchsurfing_landing', 'hero_join_now');
                  setLocation('/join');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Join for Free
              </Button>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
                No strings attached. Same values you love.
              </p>
            </div>
            
            {/* Hero Image */}
            <div className="max-w-2xl mx-auto">
              <img
                src={couchsurfingHeroImage}
                alt="Travelers connecting over coffee"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* WHY COUCHSURFERS LOVE NT - SOCIAL PROOF SECTION */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-2xl mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Why Couchsurfers Love Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              From a fellow 15-year Couchsurfing veteran who gets it.
            </p>
          </div>
          
          {/* Founder Testimonial */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-lg border-l-4 border-blue-500">
            <blockquote className="text-lg sm:text-xl text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6 italic">
              "I've hosted 400+ travelers from 50 countries. The magic isn't the couch — it's the connections. 
              I created Nearby Traveler because I realized I couldn't always host, but I always wanted to meet travelers. 
              Now you can keep the spirit alive, whether you have space or not."
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Aaron Lefkowitz</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Founder & 15-Year Couchsurfing Host</p>
              </div>
            </div>
          </div>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Coffee className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Same Values</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Cultural exchange, genuine connections, and sharing local insights</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <MapPin className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">More Flexibility</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Meet at cafes, events, or local spots — host when you want</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Globe className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Better Matching</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Connect based on shared interests, not just accommodation needs</p>
            </div>
          </div>
        </section>
        
        {/* HOW IT WORKS - 3 SIMPLE STEPS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400">
              Three simple steps to meaningful connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Share Your Interests</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tell us what you love — food, culture, nightlife, outdoor activities, or unique experiences
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Get Matched</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                We connect you with travelers and locals who share your passions and travel style
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Meet & Connect</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Host, meet for coffee, explore together, or attend events — however feels right
              </p>
            </div>
          </div>
        </section>

        {/* REPEAT CTA - BOTTOM */}
        <section className="text-center py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Connect?
            </h2>
            <p className="text-lg sm:text-xl mb-8 px-4 leading-relaxed opacity-90">
              Join thousands of travelers and locals who've discovered the same spirit of Couchsurfing, 
              but with more flexibility and better connections.
            </p>
            <Button 
              onClick={() => {
                trackEvent('signup_cta_click', 'couchsurfing_landing', 'bottom_join_now');
                setLocation('/join');
              }}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 text-lg transform hover:scale-105"
            >
              Join Nearby Traveler Today
            </Button>
            <p className="text-sm opacity-75 mt-4">
              Free to join • Same values • Better connections
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}