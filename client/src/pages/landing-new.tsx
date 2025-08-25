import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";

// Helper function for custom icons
const CustomIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  // Fallback to simple SVG icons since step icons may not exist
  const getStepIcon = (stepNumber: string) => {
    if (stepNumber.includes('step1')) {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="50" cy="30" r="15" fill="#0d9488" />
            <path d="M20 80 Q50 60 80 80" stroke="#0d9488" strokeWidth="8" fill="none" />
            <circle cx="35" cy="72" r="6" fill="#0d9488" />
            <circle cx="65" cy="72" r="6" fill="#0d9488" />
            <line x1="25" y1="65" x2="35" y2="80" stroke="#0d9488" strokeWidth="3" />
          </g>
        </svg>
      );
    } else if (stepNumber.includes('step2')) {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="50" cy="50" r="25" stroke="#0d9488" strokeWidth="4" fill="none" />
            <circle cx="35" cy="40" r="3" fill="#0d9488" />
            <circle cx="65" cy="40" r="3" fill="#0d9488" />
            <path d="M35 60 Q50 70 65 60" stroke="#0d9488" strokeWidth="3" fill="none" />
          </g>
        </svg>
      );
    } else {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="40" cy="40" r="25" stroke="#0d9488" strokeWidth="4" fill="none" />
            <line x1="58" y1="58" x2="75" y2="75" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
            <circle cx="30" cy="35" r="3" fill="#0d9488" />
            <circle cx="50" cy="35" r="3" fill="#0d9488" />
            <path d="M30 45 Q40 55 50 45" stroke="#0d9488" strokeWidth="2" fill="none" />
          </g>
        </svg>
      );
    }
  };
  
  return (
    <div className={className}>
      {getStepIcon(iconName)}
    </div>
  );
};

export default function Landing() {
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
    <div className="bg-gray-50 dark:bg-gray-900 font-sans" key="landing-v2-no-copy-button" style={{wordBreak: 'break-word'}}>
      {/* Sticky CTA - Always Visible on All Devices */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-2xl transition-all duration-200 border-3 border-white"
          style={{
            boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9)',
            animation: 'gentle-pulse 2.5s ease-in-out infinite',
            wordBreak: 'break-word'
          }}
        >
          JOIN NOW
        </Button>
      </div>
      
      <LandingHeader />
      <LandingHeaderSpacer />
      
      {/* HERO SECTION */}
      <div className="relative z-10">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
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
                      <h1 className="px-3 leading-tight sm:leading-snug" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white" style={{wordBreak: 'break-word'}}>
                          Skip the Tourist Traps.
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]" style={{wordBreak: 'break-word'}}>
                          <span className="text-amber-300 sm:text-orange-500">Meet Locals and Other </span>
                          <span className="text-blue-300 sm:text-blue-600">Nearby Travelers </span>
                          <span className="text-white sm:text-black">Right Now, Today!!!</span>
                        </span>
                      </h1>
                      
                      {/* Personal credibility as founder (hide on phones so the hero photo is visible) */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white leading-relaxed px-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                          <span className="text-orange-300 font-bold">"For over 15 years I've hosted and toured 400+ travelers from over 40 countries as a local creating amazing experiences.</span>
                          <span className="text-white"> I built Nearby Traveler to do exactly that - meet real locals and real travelers while creating amazing new travel adventures and expanding my social circle of friends."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg">— Aaron, Founder</p>
                          <p className="text-orange-200 text-sm">400+ travelers hosted • 40+ countries • 15+ years</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary signup CTA */}
                    <div className="mt-12 mb-8 px-4">
                      <Button
                        onClick={() => setLocation('/join')}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-all duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
                        style={{
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                          minHeight: 'clamp(60px, 12vw, 80px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 3s ease-in-out infinite',
                          wordBreak: 'break-word'
                        }}
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
                      <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Join the Community</p>
                    </div>

                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Events - Lu.ma style */}
      <div className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-normal px-2" style={{wordBreak: 'break-word'}}>
              Connect with Locals and other Travelers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
              Real people. Real experiences. Zero tourist traps.
            </p>
          </div>
          
          {/* Event Cards - Modern Lu.ma style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

            {/* Beach Bonfire Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/event page bbq party_1753299541268.png" 
                  alt="Beach bonfire event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word'}}>Beach Bonfire & BBQ</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word'}}>Sunset gathering on the beach</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Music</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word'}}>Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Taco Tuesday Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-red-500">
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center">
                  <span className="text-6xl">🌮</span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word'}}>Taco Tuesday Meetup</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word'}}>Weekly taco adventures</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Weekly</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Social</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word'}}>Discover hidden taco gems with fellow food enthusiasts. From street vendors to family restaurants - taste authentic Mexico in LA.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Mountain Hike Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-green-400 to-blue-500">
                <img 
                  src="/mountain hiking group_1753299698095.png" 
                  alt="Mountain hiking adventure" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word'}}>Mountain Hike Adventure</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word'}}>Sunrise trek with locals</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Nature</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Adventure</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Fitness</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word'}}>Early morning hike to catch the sunrise from the best viewpoint. Local guides know secret trails tourists never see.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Art Gallery Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-purple-400 to-pink-500">
                <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <span className="text-6xl">🎨</span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word'}}>Underground Art Scene</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word'}}>Gallery crawl with artists</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Art</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Culture</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Creative</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word'}}>Explore underground galleries and meet working artists. Discover LA's vibrant creative scene beyond the mainstream attractions.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4" style={{wordBreak: 'break-word'}}>
              How Nearby Traveler Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600" style={{wordBreak: 'break-word'}}>
              Connect with real people in 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Step 1 */}
            <div className="text-center group">
              <div className="mb-6">
                <CustomIcon iconName="step1-icon" className="mx-auto" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3" style={{wordBreak: 'break-word'}}>1. Join the Community</h3>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                Sign up and tell us your interests. Whether you're a local or traveling, we'll match you with like-minded people nearby.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center group">
              <div className="mb-6">
                <CustomIcon iconName="step2-icon" className="mx-auto" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3" style={{wordBreak: 'break-word'}}>2. Connect & Meet</h3>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                Browse local events, create meetups, or join existing plans. Chat with people who share your interests and energy.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center group">
              <div className="mb-6">
                <CustomIcon iconName="step3-icon" className="mx-auto" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3" style={{wordBreak: 'break-word'}}>3. Explore Together</h3>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                Experience authentic adventures with your new connections. Build lasting friendships through shared experiences.
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="relative z-10 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4" style={{wordBreak: 'break-word'}}>
              Real Stories from Real Travelers
            </h2>
            <p className="text-lg sm:text-xl text-gray-600" style={{wordBreak: 'break-word'}}>
              See how Nearby Traveler has transformed travel experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Success Story 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-lg">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="ml-3">
                    <h4 className="font-bold text-gray-900" style={{wordBreak: 'break-word'}}>Sarah M.</h4>
                    <p className="text-sm text-gray-600">From Germany</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                "I was nervous about traveling alone to LA, but through Nearby Traveler I met amazing locals who showed me hidden beaches and incredible street food spots. Made friends I'll have for life!"
              </p>
            </div>
            
            {/* Success Story 2 */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl shadow-lg">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <h4 className="font-bold text-gray-900" style={{wordBreak: 'break-word'}}>Miguel R.</h4>
                    <p className="text-sm text-gray-600">LA Local</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                "As a local, I love sharing my city with travelers who are genuinely interested in authentic experiences. It's refreshing to meet people who want to go beyond the typical tourist stuff."
              </p>
            </div>
            
            {/* Success Story 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-lg">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <h4 className="font-bold text-gray-900" style={{wordBreak: 'break-word'}}>Alex K.</h4>
                    <p className="text-sm text-gray-600">From Canada</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed" style={{wordBreak: 'break-word'}}>
                "The mountain hike I joined was incredible! Not only did I discover trails I never would have found, but I met fellow adventure enthusiasts. We're planning a camping trip next!"
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6" style={{wordBreak: 'break-word'}}>
            Ready to Start Your Adventure?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90" style={{wordBreak: 'break-word'}}>
            Join thousands of travelers and locals creating amazing experiences together
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl shadow-xl transition-all duration-200 border-2 border-white w-full sm:w-auto"
              style={{wordBreak: 'break-word'}}
            >
              JOIN NEARBY TRAVELER
            </Button>
            <Button
              onClick={() => setLocation('/locals-landing')}
              variant="outline"
              size="lg"
              className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl transition-all duration-200 w-full sm:w-auto"
              style={{wordBreak: 'break-word'}}
            >
              EXPLORE AS LOCAL
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Custom CSS for animations and universal text wrapping */}
      <style jsx>{`
        /* Universal text wrapping to prevent overflow */
        * {
          word-break: break-word;
        }
        
        /* Gentle pulse animation */
        @keyframes gentle-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        /* Slide in animations */
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in-up:nth-child(2) {
          animation-delay: 0.1s;
        }

        .animate-fade-in-up:nth-child(3) {
          animation-delay: 0.2s;
        }

        .animate-fade-in-up:nth-child(4) {
          animation-delay: 0.3s;
        }

        .event-card:hover {
          transform: translateY(-5px);
        }

        .group:hover svg {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}