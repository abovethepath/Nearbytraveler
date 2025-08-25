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
    <div className="bg-gray-50 dark:bg-gray-900 font-sans" key="landing-v2-no-copy-button">
      {/* Sticky CTA - Always Visible on All Devices */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-2xl transition-all duration-200 border-3 border-white"
          style={{
            boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9)',
            animation: 'gentle-pulse 2.5s ease-in-out infinite',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
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
                      <h1 className="px-3 leading-tight sm:leading-snug">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                          Skip the Tourist Traps.
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                          <span className="text-amber-300 sm:text-orange-500" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Meet Locals and Other </span>
                          <span className="text-blue-300 sm:text-blue-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Nearby Travelers </span>
                          <span className="text-white sm:text-black" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Right Now, Today!!!</span>
                        </span>
                      </h1>
                      
                      {/* Personal credibility as founder (hide on phones so the hero photo is visible) */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white leading-relaxed px-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                          <span className="text-orange-300 font-bold" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>"For over 15 years I've hosted and toured 400+ travelers from over 40 countries as a local creating amazing experiences.</span>
                          <span className="text-white" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}> I built Nearby Traveler to do exactly that - meet real locals and real travelers while creating amazing new travel adventures and expanding my social circle of friends."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>— Aaron, Founder</p>
                          <p className="text-orange-200 text-sm" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>400+ travelers hosted • 40+ countries • 15+ years</p>
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
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
                      <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join the Community</p>
                    </div>

                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* From the Founder Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-orange-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-white space-y-6">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-sm font-bold uppercase tracking-wide">From the Founder</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Building Real Connections in a Digital World
              </h2>
              
              <div className="space-y-4 text-lg leading-relaxed">
                <p style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  <span className="font-semibold text-orange-200">"After 15+ years of hosting travelers from 40+ countries,</span> I realized the magic happens when authentic people connect over shared experiences - not staged tourist activities."
                </p>
                
                <p style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  <span className="text-blue-100">That's why I built Nearby Traveler.</span> <span className="font-semibold">We're not another booking platform.</span> We're a community where real locals and genuine travelers create unforgettable moments together.
                </p>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  A
                </div>
                <div>
                  <p className="font-bold text-xl">Aaron Henao</p>
                  <p className="text-blue-100">Founder & Lead Connector</p>
                  <p className="text-sm text-orange-200">400+ travelers hosted • 15+ years experience</p>
                </div>
              </div>
            </div>
            
            {/* Right Column - Feature Highlights */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-orange-400 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    🌍
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Global Community</h3>
                    <p className="text-blue-100 text-sm">Connect with travelers worldwide</p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  Join thousands of travelers and locals creating authentic experiences together.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Real Connections</h3>
                    <p className="text-orange-100 text-sm">No tourist traps, just authentic experiences</p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  Meet real people who share your interests and create lasting friendships.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-teal-400 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Instant Meetups</h3>
                    <p className="text-blue-100 text-sm">Connect right now, today</p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                  Find people to explore with in real-time, whether you're local or visiting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Events - Lu.ma style */}
      <div className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-normal px-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              Connect with Locals and other Travelers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Beach Bonfire & BBQ</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Sunset gathering on the beach</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Music</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Taco Tuesday Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]" style={{animationDelay: '0.2s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                <img 
                  src="/attached_assets/image_1754973365104.png" 
                  alt="Authentic taco stand with vintage neon sign" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Taco Tuesday</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Tuesday • $1.50 tacos</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">$1.50</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Weekly</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Hollywood Sign Hike Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]" style={{animationDelay: '0.3s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                <img 
                  src="/attached_assets/image_1754974796221.png" 
                  alt="Hollywood Sign at sunrise with mountain views" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Hollywood Sign Hike</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Saturday • 9:00 AM</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Hiking</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Photos</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Happy Hour at Jameson Pub Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px]" style={{animationDelay: '0.4s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-amber-500 to-orange-600">
                <img 
                  src="/attached_assets/image_1754975666980.png" 
                  alt="Jameson's Pub exterior with green storefront and traditional Irish pub atmosphere" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Happy Hour Thursday</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Jameson Pub • Live Music</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">Drinks</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Live Music</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">21+</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-4 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals and travelers for Thursday happy hour with live music at Jameson Pub. Great drinks, live bands, and authentic LA nightlife.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

          </div>

          {/* Call to action to see more */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-black text-orange-400 font-black px-12 py-4 rounded-2xl hover:bg-gray-800 text-xl"
            >
              JOIN THE COMMUNITY →
            </Button>
          </div>
        </div>
      </div>

      {/* Connecting Travelers Section */}
      <div className="py-12 sm:py-16 bg-white dark:sm:bg-gray-800 dark:bg-gray-400">
        <div className="max-w-full mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              Connecting Travelers and Locals, Around The World
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Box 1 - Find Travel Companions */}
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Find Travel and Local Companions</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 text-sm" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Connect with like-minded travelers and nearby locals who share your interests, activities, demographics and desired events.</p>
            </div>

            {/* Box 2 - Discover Local Events */}
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Discover Local Experiences</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 text-sm mb-3" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join exciting events and activities hosted by locals and travelers to get an authentic taste of the city and make new friends.</p>
              <Link href="/events-landing">
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium underline">
                  Learn More About Events →
                </button>
              </Link>
            </div>

            {/* Box 3 - Connect with Locals */}
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Get Insider Knowledge</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 text-sm" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Meet locals who can show you hidden gems and provide tips on everything from food to sites that aren't in the guidebooks.</p>
            </div>

            {/* Box 4 - Plan Together */}
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Plan Your Adventure</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 text-sm" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Collaborate on travel plans with your new connections and build personalized itineraries together.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FROM THE FOUNDER SECTION */}
      <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              From the Founder
            </h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
            <div className="prose prose-lg text-gray-700 dark:text-gray-300 mx-auto text-left">
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                As a traveler and local, I always loved meeting new people—but finding those who truly shared my interests wasn't easy.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                That's why I created Nearby Traveler.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                This platform helps travelers and locals meet each other, based on shared interests, activities, demographics, and events—making every encounter more meaningful.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Whether you're exploring your city or visiting somewhere new, Nearby Traveler helps you:
              </p>
              <div className="mb-6 pl-4">
                <p className="mb-2 text-base sm:text-lg" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><span className="text-blue-600 dark:text-blue-400 font-semibold">• Connect with like-minded people</span></p>
                <p className="mb-2 text-base sm:text-lg" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><span className="text-blue-600 dark:text-blue-400 font-semibold">• Discover hidden gems</span></p>
                <p className="mb-2 text-base sm:text-lg" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><span className="text-blue-600 dark:text-blue-400 font-semibold">• Create unforgettable memories</span></p>
              </div>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                It's more than just travel—it's about real community, wherever you are. So complete your profile, dive in, and start connecting.
              </p>
              <p className="mb-2 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Thanks for being part of the journey.
              </p>
              <div className="text-right mt-6">
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Aaron Lefkowitz</p>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Founder, Nearby Traveler</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION - SIMPLIFIED */}
      <div className="bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500 py-12 sm:py-16">
        <div className="max-w-full mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              Simple steps to connect with locals and travelers worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1: Join */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <CustomIcon iconName="step1" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join as a Beta Tester</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Join as a beta tester to help shape the future of travel connections, sharing your interests and travel style for personalized matches.
              </p>
            </div>

            {/* Step 2: Connect */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <CustomIcon iconName="step2" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Connect with Nearby Travelers and Locals who share your interests and travel dates.
              </p>
            </div>

            {/* Step 3: Explore */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <CustomIcon iconName="step3" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Explore</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Explore your destination with your new connections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOR LOCALS SECTION */}
      <div id="locals" className="py-16 bg-white dark:sm:bg-gray-800 dark:bg-gray-400">
        <div className="max-w-full mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                🏠 Locals: Your City, Through Your Eyes
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                You know your city best. You create the experiences that make travelers fall in love 
                with your hometown. You're not just participating - you're leading.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Host Events:</strong> Beach BBQs, hiking trips, cultural tours - share what you love</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Share Hidden Gems:</strong> Your secret spots become unforgettable discoveries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Make Connections:</strong> Connect with other locals and welcome travelers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Build Community:</strong> Create lasting friendships with fellow travelers and locals who share your interests</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Expand Your Social Network</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Share your favorite spots, host unique events, and show travelers the authentic side of your city.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Beta Tester
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOR TRAVELERS SECTION */}
      <div id="travelers" className="py-16 bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500">
        <div className="max-w-full mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Your Next Adventure Awaits</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Find local-led experiences and connect with fellow travelers to make your next trip unforgettable.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Beta Tester
              </Button>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                🌍 For Travelers: Discover Cities Through Connections
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                Skip the tourist traps. Connect with locals who know their cities inside out and 
                fellow travelers who share your interests and travel dates.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Local-Created Events:</strong> Join authentic experiences designed by locals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Hidden Gem Access:</strong> Discover spots tourists never find</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Traveler Connections:</strong> Meet people who share your travel dates and interests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}><strong>Insider Knowledge:</strong> Get tips that guidebooks don't have</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION SECTION */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'break-word'}}>
            <span className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
              Ready to Join the Community?
            </span>
          </h2>
          <p className="text-xl text-gray-200 mb-8" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
            Whether you're a local ready to share your city or a traveler seeking authentic experiences, 
            your journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl text-black"
            >
              Join as a Beta Tester
            </Button>
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl text-black"
            >
              Join as a Beta Tester
            </Button>
          </div>
        </div>
      </div>

      {/* Exclusive Beta Access - MOVED TO BOTTOM */}
      <div className="py-12 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-8 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-white font-bold text-sm uppercase tracking-wide" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Exclusive Beta Access</span>
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full ml-2 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              Join Our Premium Los Angeles Launch
            </h3>
            <p className="text-lg text-white text-center leading-relaxed mb-4" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              <span className="font-semibold" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>You're invited to be among the first</span> to experience our curated community of travelers and locals. While our network is global, we're launching with an exclusive focus on Los Angeles premium events and experiences.
            </p>
            <p className="text-base text-orange-100 text-center" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              Early members get lifetime premium features and priority access to new cities as we expand worldwide.
            </p>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Add custom CSS for better text wrapping */}
      <style jsx>{`
        .event-card * {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        /* Gentle pulse animation */
        @keyframes gentle-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 15px 40px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,1);
          }
        }
        
        /* Slide in animations */
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}