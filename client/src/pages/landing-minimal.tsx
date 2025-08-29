import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, Plane, Building2, Handshake } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingMinimal() {
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

  // Force light mode when component mounts
  useEffect(() => {
    setTheme('light');
    // Also force it on the document element
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, [setTheme]);

  return (
    <div className="bg-gray-50 font-sans">
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION - With Original Photo */}
        <div className="relative z-10">
          <div className="bg-gray-800 border-4 border-orange-500 shadow-lg">
            <div className="relative bg-gray-800 pb-32 overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 h-full min-h-[600px]">
                <img
                  src="/travelers together hugging_1754971726997.avif"
                  alt="Travel experience"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 70%' }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0))"
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                  <main className="mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32 mx-auto max-w-full px-4">
                    <div className="text-center">
                      <div className="max-w-4xl mx-auto">
                        <h1 className="px-3 leading-tight sm:leading-snug" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          <span className="block font-bold text-[clamp(1.5rem,6vw,2.25rem)] text-white" style={{ fontWeight: '700', textShadow: '1px 1px 3px rgba(0,0,0,0.7)', letterSpacing: '-0.02em' }}>
                            Skip the Tourist Traps, Connect Before Your Trip, Keep Connections Forever and Create Lifelong Friends!!!
                          </span>
                          <span className="block font-bold text-[clamp(1.25rem,5.5vw,2rem)] mt-4" style={{ fontWeight: '700', textShadow: '1px 1px 3px rgba(0,0,0,0.7)', letterSpacing: '-0.02em' }}>
                            <span className="text-amber-300 sm:text-orange-500">Meet Locals and Other </span>
                            <span className="text-blue-300 sm:text-blue-600">Nearby Travelers </span>
                            <span className="text-white">Right Now, Today!!!</span>
                          </span>
                        </h1>
                        
                        {/* Primary signup CTA - Lowered and reasonably sized */}
                        <div className="mt-20 mb-8 px-4">
                          <Button
                            onClick={() => {
                              trackEvent('signup_cta_click', 'landing_page', 'main_hero_button');
                              setLocation('/join');
                            }}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 border-2 border-white max-w-md mx-auto"
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
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

        {/* FOUNDER QUOTE HIGHLIGHT */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-8">
          {/* Blue to orange gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>
          
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="bg-gray-100/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl">
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

        {/* FROM THE FOUNDER SECTION - Original with 3 Icons */}
        <div className="relative z-10 py-16 sm:py-20 overflow-hidden mb-16">
          {/* Blue to orange gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>
          
          <div className="relative max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '900', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.02em' }}>
                From the Founder
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-white to-blue-300 mx-auto rounded-full"></div>
            </div>
            
            {/* Main content with better readability */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-lg sm:text-xl text-white leading-relaxed font-medium mb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '500', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.01em' }}>
                  "After 15 years of hosting 400+ travelers from 50 countries, I saw first-hand how one single connection can change everything."
                </p>
                <p className="text-lg sm:text-xl text-white leading-relaxed font-medium mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '500', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.01em' }}>
                  "I built Nearby Traveler to make those connections possible for everyone — travelers and locals alike."
                </p>
                <p className="text-2xl sm:text-3xl text-orange-300 font-black leading-tight mb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: '900', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', letterSpacing: '-0.02em', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  "I BUILT THE SITE I WISHED EXISTED."
                </p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <p className="text-lg text-gray-900 leading-relaxed mb-6 text-center font-medium">
                  Nearby Traveler connects travelers and locals through shared interests, activities, demographics, and events—transforming random encounters into life-changing connections.
                </p>
                
                {/* Benefits with orange and blue theme */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-white rounded-2xl border-2 border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">🤝</div>
                    <p className="font-bold text-gray-900 text-sm">Connect with like-minded people</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border-2 border-blue-300 shadow-lg">
                    <div className="text-3xl mb-3">💎</div>
                    <p className="font-bold text-gray-900 text-sm">Discover hidden gems</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border-2 border-orange-300 shadow-lg">
                    <div className="text-3xl mb-3">✨</div>
                    <p className="font-bold text-gray-900 text-sm">Create unforgettable memories</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-900 leading-relaxed text-center mb-6 font-medium">
                  It's more than just travel—it's about real community, wherever you are.
                </p>
                
                {/* Founder signature with orange and blue accents */}
                <div className="text-center pt-6 border-t border-blue-200">
                  <p className="text-lg text-gray-800 mb-3 font-medium">Thanks for being part of the journey.</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div>
                      <p className="text-xl font-black text-gray-900">Aaron Lefkowitz</p>
                      <p className="text-blue-600 font-bold">Founder, Nearby Traveler, Inc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Experiences - With Original Photos */}
        <div className="relative z-10 py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-normal px-2">
                Real Connections Happen Here
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
                ✨ See how our community turns strangers into lifelong friends:
              </p>
            </div>
            
            {/* Event Cards - Original Style with Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-12">

              {/* Beach Bonfire Event Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                  <img 
                    src="/event page bbq party_1753299541268.png" 
                    alt="Beach bonfire event" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600">Sunset gathering on the beach</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        "Met 6 amazing people from different countries! We're planning a group trip to Costa Rica next month."
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-2">— Sarah M., Traveler</p>
                    </div>
                    <Button 
                      onClick={() => {
                        trackEvent('event_card_click', 'landing_page', 'beach_bonfire');
                        setLocation('/join');
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm py-2"
                    >
                      Find Events Like This
                    </Button>
                  </div>
                </div>
              </div>

              {/* City Walking Tour Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-400 to-purple-500">
                  <img 
                    src="/city walking tour with group_1753299612359.png" 
                    alt="City walking tour" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Hidden Gems Walking Tour</h3>
                    <p className="text-sm text-gray-600">Discover local favorites with insider guides</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$15</span>
                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-xs">Tour</span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        "Best way to see the city! Found my new favorite coffee shop and made local friends who showed me around all week."
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-2">— Marcus T., Local</p>
                    </div>
                    <Button 
                      onClick={() => {
                        trackEvent('event_card_click', 'landing_page', 'walking_tour');
                        setLocation('/join');
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm py-2"
                    >
                      Join Local Tours
                    </Button>
                  </div>
                </div>
              </div>

              {/* Foodie Meetup Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-green-400 to-blue-500">
                  <img 
                    src="/foodie meetup group dinner_1753299649814.png" 
                    alt="Foodie meetup dinner" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Foodie Culture Exchange</h3>
                    <p className="text-sm text-gray-600">Share meals, stories, and traditions</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Potluck</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        "Learned to make authentic Italian pasta from Elena! Now we cook together every Sunday and she's teaching me Italian."
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-2">— David L., Explorer</p>
                    </div>
                    <Button 
                      onClick={() => {
                        trackEvent('event_card_click', 'landing_page', 'foodie_meetup');
                        setLocation('/join');
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-sm py-2"
                    >
                      Find Food Experiences
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main CTA */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-3xl p-8 text-white mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Create Your Own Story?</h3>
                <p className="text-lg mb-6 opacity-90">Join thousands discovering authentic connections worldwide</p>
                <Button 
                  onClick={() => {
                    trackEvent('signup_cta_click', 'landing_page', 'featured_experiences_cta');
                    setLocation('/join');
                  }}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                  }}
                >
                  Start Connecting Today
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}