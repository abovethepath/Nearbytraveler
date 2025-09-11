import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Home, Heart, Plane, Calendar, Shield } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingNew() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGetStarted = () => {
    trackEvent('landing_page_cta_clicked', {
      source: 'hero_section',
      cta_text: 'Start Connecting Now'
    });
    setLocation('/join');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <LandingHeader />
      <LandingHeaderSpacer />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Turn every trip into
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent block mt-2">
              meaningful connections
            </span>
            that last
          </h1>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleGetStarted}
            data-testid="button-hero-cta"
          >
            Start Connecting Now
          </Button>
        </div>
      </section>

      {/* Why Nearby Traveler */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Why Nearby Traveler
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Before You Go</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Meet locals and travelers before your trip starts — no more wandering alone in new cities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Discover Hidden Gems</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access authentic spots locals actually love, not tourist traps from guidebooks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Stay Connected Globally</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get notified when friends from past trips are in your next destination.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create & Join Local Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Host experiences in your city or join authentic local gatherings anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* From the Founder */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">From the Founder</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              "After hosting 400+ travelers from 50 countries, I learned that one connection can change everything. 
              Travelers spend billions on flights and hotels, yet the most valuable part — the people you meet — is left to chance. 
              I built the solution I wished existed."
            </p>
            <p className="text-lg font-bold">— Aaron Lefkowitz, Founder</p>
          </div>
        </div>
      </section>

      {/* When Travelers Meet Locals */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            When Travelers Meet Locals, Magic Happens
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Home className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Meet local families</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Coffee className="w-6 h-6 text-orange-500 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Join authentic social scenes</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Globe className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Practice language exchange</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Plane className="w-6 h-6 text-orange-500 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Discover day trip adventures</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Heart className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Find meaningful relationships</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <Users className="w-6 h-6 text-orange-500 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium">Experience real culture</span>
            </div>
          </div>

          <p className="text-xl font-bold text-gray-900 dark:text-white">
            This isn't just travel. This is transformation.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share Your Vibe</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tell us your interests and destination.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Authentically</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Meet verified locals and travelers who match your energy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Epic Memories</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join experiences and build friendships that last.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community in Action */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            See Our Community in Action
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Beach Bonfire & BBQ</h3>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">Free</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Sunset gathering with locals — authentic LA beach culture, music, and new friends.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Taco Tuesday</h3>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">$1.50</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hollywood Sign Hike</h3>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">Free</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Everyone's Welcome */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-orange-500">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-16">
            Everyone's Welcome
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Solo Travelers</h3>
              <p className="text-sm">Turn exploring alone into shared adventures</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Families</h3>
              <p className="text-sm">Connect with local families and fellow travelers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Locals</h3>
              <p className="text-sm">Share your city and meet the world</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">New in Town</h3>
              <p className="text-sm">Find your tribe fast</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Business Travelers</h3>
              <p className="text-sm">Make work trips more than meetings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Join thousands who've discovered that the best part of any journey is the people you meet along the way.
          </p>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-12 py-4 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleGetStarted}
            data-testid="button-final-cta"
          >
            Start Connecting Now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}