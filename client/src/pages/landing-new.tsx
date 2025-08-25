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
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white">
                          Skip the Tourist Traps, Connect Before Your Trip or Business Event, Keep Connections Forever!!!
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]">
                          <span className="text-amber-300 sm:text-orange-500">Meet Locals and Other </span>
                          <span className="text-blue-300 sm:text-blue-600">Nearby Travelers </span>
                          <span className="text-white">Right Now, Today!!!</span>
                        </span>
                      </h1>
                      
                      {/* Personal credibility as founder (hide on phones so the hero photo is visible) */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white leading-relaxed px-2">
                          <span className="text-orange-300 font-bold">"For over 15 years I've hosted and toured 400+ travelers from over 40 countries as a local creating amazing expereinces.</span>
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
                        }}
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-normal px-2">
              Connect with Locals and other Travelers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
              Real people. Real experiences. Zero tourist traps.
            </p>
          </div>
          
          {/* Event Cards - Modern Lu.ma style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

            {/* Beach Bonfire Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-xl transition-all duration-300 flex flex-col min-h-[480px]">
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
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                </div>
                
                <p className="text-gray-700 text-sm sm:text-base mb-8 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col min-h-[480px]" style={{animationDelay: '0.2s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                <img 
                  src="/image_1754973365104.png" 
                  alt="Authentic taco stand with vintage neon sign" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Taco Tuesday</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Tuesday • $1.50 tacos</p>
                </div>
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$1.50</span>
                  <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                </div>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-8 flex-grow leading-relaxed" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col min-h-[480px]" style={{animationDelay: '0.3s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                <img 
                  src="/image_1754974796221.png" 
                  alt="Hollywood Sign at sunrise with mountain views" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Hollywood Sign Hike</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Saturday • 9:00 AM</p>
                </div>
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Hiking</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-8 flex-grow" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col min-h-[480px]" style={{animationDelay: '0.4s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-amber-500 to-orange-600">
                <img 
                  src="/image_1754975666980.png" 
                  alt="Jameson's Pub exterior with green storefront and traditional Irish pub atmosphere" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Happy Hour Thursday</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Jameson Pub • Live Music</p>
                </div>
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs">Drinks</span>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">21+</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-8 flex-grow" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Join locals and travelers for Thursday happy hour with live music at Jameson Pub. Great drinks, live bands, and authentic LA nightlife.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Sunset Yoga on the Beach Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col min-h-[480px]" style={{animationDelay: '0.5s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-pink-400 to-orange-500">
                <img 
                  src="@assets/image_1756110858653.png" 
                  alt="Sunset yoga on the beach with people in poses" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Venice Beach Sunset Yoga</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Sunday • 6:00 PM</p>
                </div>
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Wellness</span>
                  <span className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-8 flex-grow" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Unwind with peaceful yoga as the sun sets over the Pacific. Perfect for connecting with wellness-focused travelers and locals. All levels welcome.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                  style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Griffith Observatory Night Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col min-h-[480px]" style={{animationDelay: '0.6s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-indigo-600 to-purple-700">
                <img 
                  src="/Los_Angeles_1753819372180.jpg" 
                  alt="Los Angeles cityscape with Griffith Observatory view" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Griffith Observatory Night</h3>
                  <p className="text-sm text-gray-600" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Every Friday • 7:30 PM</p>
                </div>
                
                {/* Tags - Smaller and limited to 2 max */}
                <div className="flex gap-1 mb-6">
                  <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-xs">Stargazing</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-8 flex-grow" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>Explore the cosmos with fellow stargazers at LA's iconic observatory. Perfect for curious minds who love science, space, and stunning city views.</p>
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


        </div>
      </div>


      {/* FROM THE FOUNDER SECTION */}
      <div className="relative z-10 py-16 sm:py-20 overflow-hidden">
        {/* Blue to orange gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>
        
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{fontFamily: '"Inter", sans-serif'}}>
              From the Founder
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-white to-blue-300 mx-auto rounded-full"></div>
          </div>
          
          {/* Main content with better readability */}
          <div className="max-w-3xl mx-auto animate-slide-in-left" style={{animationDelay: '0.2s'}}>
            <div className="text-center mb-8">
              <p className="text-xl sm:text-2xl text-white leading-relaxed font-medium mb-6">
                "As a traveler and local, I always loved meeting new people—but finding those who truly shared my interests wasn't easy."
              </p>
              <p className="text-2xl sm:text-3xl text-white font-bold leading-relaxed mb-6">
                That's why I created Nearby Traveler.
              </p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl animate-zoom-in" style={{animationDelay: '0.4s'}}>
              <p className="text-lg text-gray-900 leading-relaxed mb-6 text-center font-medium">
                This platform helps travelers and locals meet each other, based on shared interests, activities, demographics, and events—making every encounter more meaningful.
              </p>
              
              {/* Benefits with orange and blue theme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-white rounded-2xl border-2 border-orange-300 shadow-lg">
                  <div className="text-3xl mb-3">🤝</div>
                  <p className="font-bold text-black">Connect with like-minded people</p>
                </div>
                <div className="text-center p-4 bg-white rounded-2xl border-2 border-blue-300 shadow-lg">
                  <div className="text-3xl mb-3">💎</div>
                  <p className="font-bold text-gray-900">Discover hidden gems</p>
                </div>
                <div className="text-center p-4 bg-white rounded-2xl border-2 border-orange-300 shadow-lg">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="font-bold text-black">Create unforgettable memories</p>
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
                    <p className="text-blue-600 font-bold">Founder, Nearby Traveler</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION - SEXY REDESIGN */}
      <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-800 text-sm font-bold rounded-full mb-4 animate-pulse">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif'}}>
              Turn Connections into <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Travel Adventures</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Three simple steps that transform your travel experience from ordinary to extraordinary
            </p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 rounded-full opacity-30"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1: Join */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-blue-800">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-white text-2xl font-black">1</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Join the Movement
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Share your travel style, interests, and dream destinations. Our matching algorithm connects you with like-minded travelers and locals.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Connect */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-purple-100 dark:border-purple-800">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-white text-2xl font-black">2</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Make Real Connections
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Chat with locals who know secret spots and fellow travelers heading to your destination. No awkward small talk - just shared adventures.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Explore */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-orange-100 dark:border-orange-800">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-white text-2xl font-black">3</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Create Epic Memories
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Join authentic experiences, discover hidden gems, and turn strangers into lifelong friends. This is travel the way it's meant to be.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Your Adventure Now
            </Button>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
              Join thousands of travelers already making connections
            </p>
          </div>
        </div>
      </div>

      {/* FOR LOCALS SECTION - REDESIGNED */}
      <div id="locals" className="relative z-10 py-20 bg-gradient-to-br from-white via-blue-50 to-teal-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-teal-900/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="inline-block px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-sm sm:text-base font-bold rounded-full mb-6 shadow-lg border-2 border-orange-200">
                  FOR LOCALS
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif'}}>
                  🏠 Your City, <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Your Adventures</span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Turn your local knowledge into lasting friendships. Show off your favorite spots, join epic events, and build a social circle that spans the globe. Whether you're hosting travelers or exploring with fellow locals, every connection opens new doors.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-700 to-blue-800 dark:bg-gradient-to-br dark:from-blue-900 dark:to-blue-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 dark:border-blue-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🎉</span>
                    </div>
                    <h3 className="font-black text-white text-lg">Create Fun Hangouts</h3>
                  </div>
                  <p className="text-blue-100 text-base font-semibold">Beach BBQs, hiking adventures, cultural deep-dives</p>
                </div>
                
                <div className="bg-gradient-to-br from-teal-700 to-teal-800 dark:bg-gradient-to-br dark:from-teal-900 dark:to-teal-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-teal-600 dark:border-teal-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">💎</span>
                    </div>
                    <h3 className="font-black text-white text-lg">Show Off Your Spots</h3>
                  </div>
                  <p className="text-teal-100 text-base font-semibold">Your secret spots become legendary discoveries</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-700 to-purple-800 dark:bg-gradient-to-br dark:from-purple-900 dark:to-purple-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-600 dark:border-purple-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🤝</span>
                    </div>
                    <h3 className="font-black text-white text-lg">Expand Your Circle</h3>
                  </div>
                  <p className="text-purple-100 text-base font-semibold">Welcome travelers, connect with fellow locals</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-700 to-orange-800 dark:bg-gradient-to-br dark:from-orange-900 dark:to-orange-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-600 dark:border-orange-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🌟</span>
                    </div>
                    <h3 className="font-black text-white text-lg">Find Your Tribe</h3>
                  </div>
                  <p className="text-orange-100 text-base font-semibold">Turn strangers into lifelong friends</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-teal-200 rounded-3xl transform rotate-3 opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl border border-blue-100 dark:border-blue-800">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-white text-3xl">🏠</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                    Expand Your Social World
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Meet locals and Nearby Travelers who share your interests and build lasting friendships. From weekend adventures to casual hangouts, grow your circle locally and globally.
                  </p>
                  <Button 
                    onClick={() => setLocation('/join')}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Join as a Nearby Local
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOR TRAVELERS SECTION - REDESIGNED */}
      <div id="travelers" className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-red-900/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-red-200 rounded-3xl transform -rotate-3 opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl border border-orange-100 dark:border-orange-800">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-white text-3xl">🌍</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                    Adventure Beyond Guidebooks
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Skip the tourist traps and dive into authentic experiences. 
                    Connect with locals who'll show you their city's soul and fellow travelers who share your wanderlust.
                  </p>
                  <Button 
                    onClick={() => setLocation('/join')}
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Start Your Adventure
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div>
                <span className="inline-block px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-sm sm:text-base font-bold rounded-full mb-6 shadow-lg border-2 border-orange-200">
                  FOR TRAVELERS
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif'}}>
                  🌍 Travel Like <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">You Live There</span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Skip the crowds and clichés. Connect with locals who'll show you their city's soul and fellow travelers who get your wanderlust.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-300 dark:border-orange-600">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🎯</span>
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Local-Led Events</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-base font-semibold">Join authentic experiences crafted by locals and joined by all. Beach Bonfires, Dance Parties, House Parties, and more....</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:bg-gradient-to-br dark:from-emerald-800 dark:to-emerald-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-300 dark:border-red-600">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🗺️</span>
                    </div>
                    <h3 className="font-black text-emerald-800 dark:text-emerald-100 text-lg">Secret Spots</h3>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-200 text-base font-semibold">Discover places locals actually go - the hole-in-the-wall restaurants, rooftop views, and neighborhoods tourists never find</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-pink-300 dark:border-pink-600">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">👥</span>
                    </div>
                    <h3 className="font-black text-blue-800 dark:text-blue-100 text-lg">Travel Buddies</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-200 text-base font-semibold">Meet travelers and locals who share your same interests, activities and demographics. Find those visiting a city for the same reasons as you!</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">💡</span>
                    </div>
                    <h3 className="font-black text-purple-900 dark:text-purple-100 text-lg">Local Intel</h3>
                  </div>
                  <p className="text-purple-800 dark:text-purple-200 text-base font-semibold">Get the real scoop: which subway line to avoid, where locals eat breakfast, and what tourists waste money on</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONNECT BEFORE, DURING & AFTER EVENTS SECTION */}
      <div className="relative z-10 py-16 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Connect Before Your Trip or Business Event, Keep Connections Forever
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Turn every travel or business event into lasting friendships. Connect before you go, bond during experiences, stay friends forever.
            </p>
          </div>
          
          {/* Connection Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Before Events */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-blue-600 dark:border-blue-600 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-black mb-6">Before Events or Trips</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Browse profiles of people headed to the same event or city</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Break the ice with a quick chat or group plan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Swap stories, backgrounds, and tips</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Show up already excited and connected</span>
                </div>
              </div>
            </div>
            
            {/* During Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-blue-200 dark:border-blue-600 text-center">
              <div className="text-4xl mb-4">💫</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">During Events or Trips</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Recognize familiar faces right away</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Skip the awkward introductions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Share updates and moments in real time</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span className="text-black dark:text-gray-300 text-base">Create memories together, not alone</span>
                </div>
              </div>
            </div>
            
            {/* After Events */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-orange-600 dark:border-orange-600 text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-black mb-6">After Events or Trips</h3>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Keep the new friendships alive</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Plan your next meetup or trip together</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Spot familiar names in future events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-bold">•</span>
                  <span className="text-black text-base">Grow your own global community</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Better Than Business Cards */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 dark:from-blue-700 dark:to-orange-600 rounded-2xl p-8 text-center text-white mb-8">
            <h3 className="text-2xl font-bold mb-4">Why This Beats Traditional Networking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-bold mb-2">❌ Old Way: Random Encounters</h4>
                <div className="text-sm opacity-90 flex flex-col space-y-2">
                  <div>• Meet strangers at events</div>
                  <div>• No shared context or interests</div>
                  <div>• Awkward small talk</div>
                  <div>• Lose touch after the trip</div>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-2">✅ Nearby Traveler Way</h4>
                <div className="text-sm flex flex-col space-y-2">
                  <div>• Connect with like-minded travelers</div>
                  <div>• Rich profiles with stories & photos</div>
                  <div>• Instant recognition at future events</div>
                  <div>• Lifelong travel friendships</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Forever Connections */}
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reconnect Anywhere, Anytime</h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              When you attend a hiking event in Colorado and later see a familiar face at a food festival in Thailand, 
              you'll instantly recognize each other and pick up where you left off. That's the power of lasting connections.
            </p>
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-xl"
            >
              START BUILDING CONNECTIONS
            </Button>
          </div>
        </div>
      </div>

      {/* BUSINESS EVENT NETWORKING WIDGET */}
      <div className="relative z-10 py-16 bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-gray-800 dark:via-gray-900 dark:to-purple-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Content */}
              <div className="p-8 lg:p-12">
                <div className="mb-6">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold rounded-full mb-4">
                    BUSINESS NETWORKING
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                    Going to a <span className="text-purple-600 dark:text-purple-400">Business Event</span>?
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Connect before you go, keep in touch forever
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Better than business cards</strong> - Real connections that last
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Meet prior to the event</strong> - Break the ice beforehand
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <strong>Connect as new friends</strong> - Genuine relationships beyond networking
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setLocation('/join')}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-lg"
                >
                  START NETWORKING SMARTER
                </Button>
              </div>
              
              {/* Right Visual */}
              <div className="p-8 lg:p-12 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-6">🤝</div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    No More Business Cards
                  </p>
                  <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Real Connections
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📅</div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Before</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">During</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌟</div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Forever</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION SECTION */}
      <div className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            <span className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
              Ready to Join the Community?
            </span>
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Whether you're a local ready to share your city, a traveler seeking authentic experiences or a business traveler looking to connect prior, 
            your journey starts here.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl text-white"
            >
              Join Nearby Traveler
            </Button>
          </div>
        </div>
      </div>

      {/* Exclusive Beta Access */}
      <div className="relative z-10 py-12 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-8 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-white font-bold text-sm uppercase tracking-wide">Exclusive Beta Access</span>
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full ml-2 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              Join Our Premium Los Angeles Launch
            </h3>
            <p className="text-lg text-white text-center leading-relaxed mb-4">
              <span className="font-semibold">You're invited to be among the first</span> to experience our curated community of travelers and locals. While our network is global, we're launching with an exclusive focus on Los Angeles premium events and experiences.
            </p>
            <p className="text-base text-orange-100 text-center">
              Early members get lifetime premium features and priority access to new cities as we expand worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Extra bottom padding so content is not hidden behind mobile bottom nav */}
      <div className="h-20 md:h-0" />
      <Footer />
    </div>
  );
}