import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, Plane, Building2, Handshake } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function LandingMinimal() {
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
    <div className="bg-white min-h-screen font-sans">
      {/* Force light mode by using white background */}
      
      {/* Fixed CTA Button - Single color */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:scale-105 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION - Clean white background */}
        <div className="relative z-10">
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="relative bg-white pb-32 overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 h-full min-h-[600px]">
                <img
                  src="/travelers together hugging_1754971726997.avif"
                  alt="Travel experience"
                  className="w-full h-full object-cover opacity-30"
                  style={{ objectPosition: 'center 70%' }}
                />
                <div
                  className="absolute inset-0 bg-white/60"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                  <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32 mx-auto max-w-full px-4">
                    <div className="text-center">
                      <div className="max-w-4xl mx-auto">
                        <h1 className="px-3 leading-tight sm:leading-snug" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          <span className="block font-bold text-[clamp(1.5rem,6vw,2.25rem)] text-gray-900" style={{ fontWeight: '700', letterSpacing: '-0.02em' }}>
                            Skip the Tourist Traps, Connect Before Your Trip, Keep Connections Forever and Create Lifelong Friends
                          </span>
                          <span className="block font-bold text-[clamp(1.25rem,5.5vw,2rem)] mt-4 text-gray-800" style={{ fontWeight: '700', letterSpacing: '-0.02em' }}>
                            Meet Locals and Other Nearby Travelers Right Now, Today
                          </span>
                        </h1>
                        
                        {/* Primary signup CTA - Clean single color */}
                        <div className="mt-20 mb-8 px-4">
                          <Button
                            onClick={() => {
                              trackEvent('signup_cta_click', 'landing_page', 'main_hero_button');
                              setLocation('/join');
                            }}
                            size="lg"
                            className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 max-w-md mx-auto"
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                            }}
                          >
                            JOIN NEARBY TRAVELER NOW
                          </Button>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOUNDER QUOTE HIGHLIGHT - Clean version */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-8">
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <blockquote className="text-lg sm:text-xl text-gray-900 leading-relaxed mb-4 text-center font-medium">
                "I was tired of touring cities alone while amazing people walked past me every day. Travelers spend billions on flights, hotels, and tours — yet the most valuable part of a trip, the people you meet, is left to chance."
              </blockquote>
              <div className="text-center">
                <p className="text-gray-700 font-semibold">
                  — Aaron Lefkowitz, Founder Nearby Traveler, Inc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FROM THE FOUNDER SECTION - Clean minimal version */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-16">
          <div className="bg-white">
            <div className="relative max-w-4xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  From the Founder
                </h2>
                <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                  <span className="font-bold text-gray-900">
                    I BUILT THE SOLUTION I WISHED EXISTED
                  </span>
                  <br />
                  After years of solo travel and missed connections, I created Nearby Traveler to help people find authentic experiences and real relationships while exploring the world.
                </p>
              </div>

              {/* Three boxes - clean version */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">For Locals</h3>
                  <p className="text-gray-700 text-sm">Connect with travelers and fellow locals in your city</p>
                </div>

                <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="h-8 w-8 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">For Travelers</h3>
                  <p className="text-gray-700 text-sm">Meet locals and other travelers wherever you go</p>
                </div>

                <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">For Businesses</h3>
                  <p className="text-gray-700 text-sm">Reach nearby travelers and locals with your offerings</p>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    trackEvent('signup_cta_click', 'landing_page', 'founder_section');
                    setLocation('/join');
                  }}
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl"
                >
                  Start Connecting Today
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* BENEFITS SECTION - Clean version */}
        <div className="relative z-10 py-16 sm:py-20 mb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Connect. Experience. Belong.
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                Transform your travel experience from tourist to local insider
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Real Connections</h3>
                <p className="text-gray-700">
                  Skip superficial tourist interactions. Meet locals and travelers who share your interests and create meaningful friendships that last beyond your trip.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Authentic Experiences</h3>
                <p className="text-gray-700">
                  Discover hidden gems and local favorites that guidebooks miss. Experience destinations like a local, not a tourist.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Safe & Trusted</h3>
                <p className="text-gray-700">
                  Connect with verified community members. Our platform prioritizes safety and authentic connections over random encounters.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Global Community</h3>
                <p className="text-gray-700">
                  Join a worldwide network of travelers and locals. Maintain connections across cities and countries as you explore the world.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL CTA SECTION */}
        <div className="relative z-10 py-16 sm:py-20 mb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-gray-50 rounded-2xl p-8 sm:p-12 border border-gray-200">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Travel?
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Join thousands of travelers and locals creating authentic connections worldwide.
              </p>
              
              <Button
                onClick={() => {
                  trackEvent('signup_cta_click', 'landing_page', 'final_cta');
                  setLocation('/join');
                }}
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-12 py-4 rounded-xl text-lg"
              >
                Join Nearby Traveler
              </Button>
              
              <p className="text-sm text-gray-600 mt-4">
                Free to join • Connect instantly • Start today
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}