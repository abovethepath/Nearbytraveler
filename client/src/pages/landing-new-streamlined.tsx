import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Fixed CTA Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setLocation('/auth')}
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition-all duration-300 hover:scale-105 px-6 py-3 rounded-full"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950 rounded-3xl mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Skip the Tourist Traps.<br />
              Find Real People.<br />
              <span className="text-teal-600 dark:text-teal-400">Create Lifelong Friends.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Meet locals and travelers before your trip, join authentic events, and keep connections forever.
            </p>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              Join Nearby Traveler Now
            </Button>
          </div>
        </section>

        {/* From the Founder */}
        <section className="py-16 bg-white dark:bg-gray-800 rounded-2xl mb-16 shadow-sm">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">From the Founder</h2>
            <blockquote className="text-lg md:text-xl text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
              "For over 15 years, I've hosted more than 400 travelers from 50+ countries. I discovered the best part of travel isn't the sights—it's the people you meet. I built Nearby Traveler so everyone can have that same experience: real locals, real adventures, and friendships that last."
            </blockquote>
            <cite className="text-gray-600 dark:text-gray-400 font-medium">— Aaron Lefkowitz, Founder</cite>
            <div className="flex justify-center items-center gap-8 mt-8 text-teal-600 dark:text-teal-400 font-semibold">
              <span>400+ Travelers</span>
              <span>•</span>
              <span>50+ Countries</span>
              <span>•</span>
              <span>15+ Years</span>
            </div>
          </div>
        </section>

        {/* Featured Experiences */}
        <section className="py-16 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Experiences</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">✨ Just a few ways our community connects:</p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Beach Bonfire & BBQ</h3>
                <p className="text-gray-600 dark:text-gray-400">Sunset gathering with music and friends</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Taco Tuesday</h3>
                <p className="text-gray-600 dark:text-gray-400">$1.50 authentic street tacos, every Tuesday</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Hollywood Sign Hike</h3>
                <p className="text-gray-600 dark:text-gray-400">Weekly hike with epic views and photos</p>
              </div>
            </div>

            <Button 
              onClick={() => setLocation('/events')}
              variant="outline"
              className="text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
            >
              See All Events
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How It Works</h2>
            <p className="text-center text-xl text-gray-600 dark:text-gray-400 mb-12">Three simple steps to turn travel into connection:</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Join the Movement</h3>
                <p className="text-gray-600 dark:text-gray-400">Share your interests and destinations. Our matching connects you with like-minded locals and travelers.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Make Real Connections</h3>
                <p className="text-gray-600 dark:text-gray-400">Chat and meet people who share your vibe. No awkward small talk—just shared adventures.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Epic Memories</h3>
                <p className="text-gray-600 dark:text-gray-400">Join authentic experiences, discover hidden gems, and turn strangers into friends.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Who It's For</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Locals */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Locals</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Turn your city into lasting friendships. Share your favorite spots, create events, and connect with travelers and fellow locals.</p>
                <Button 
                  onClick={() => setLocation('/locals-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Locals
                </Button>
              </div>

              {/* Travelers */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Travelers</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Skip the tourist traps. Meet locals who know the real city, join authentic events, and find travel buddies who share your interests.</p>
                <Button 
                  onClick={() => setLocation('/travelers-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Travelers
                </Button>
              </div>

              {/* Businesses */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Businesses</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Whether you run a bar, café, co-working space, or event venue—connect with travelers and locals looking for authentic experiences.</p>
                <Button 
                  onClick={() => setLocation('/business-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore for Businesses
                </Button>
              </div>

              {/* Networking */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Networking</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Heading to a conference, festival, or business trip? Connect before you arrive, meet like-minded people, and keep connections alive.</p>
                <Button 
                  onClick={() => setLocation('/networking-landing')}
                  variant="outline" 
                  className="w-full text-teal-600 border-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-950"
                >
                  Explore Networking
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-16 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Adventure</h2>
            <p className="text-xl mb-8">Join thousands of locals, travelers, and businesses already making real connections.</p>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              Join Nearby Traveler Now
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}