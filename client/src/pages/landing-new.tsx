import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingNavbar from "@/components/landing-navbar";



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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans" key="landing-v2-no-copy-button">
      {/* Sticky CTA - Always Visible on All Devices */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-black font-black px-8 py-4 rounded-2xl shadow-2xl transition-colors duration-200 border-3 border-white"
          style={{
            boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.9)',
            animation: 'gentle-pulse 2.5s ease-in-out infinite',
          }}
        >
          JOIN NOW
        </Button>
      </div>
      
      {/* Top sticky bar for maximum visibility */}
      <div className="fixed top-0 left-0 right-0 bg-orange-500 text-black py-3 px-4 z-40 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex-1 text-center">
            <span className="font-bold text-lg">🔥 Connect with Locals and Travelers TODAY - Sign Up Now!</span>
          </div>
          <Button
            onClick={() => setLocation('/join')}
            className="bg-black text-orange-400 font-bold px-6 py-2 rounded-lg hover:bg-gray-800 ml-4"
          >
            SIGN UP NOW
          </Button>
        </div>
      </div>

      {/* Landing Navbar with BETA badge - ensure it's visible on mobile */}
      <header className="sticky top-12 z-[55] bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
        <div className="pt-2">
          <LandingNavbar />
        </div>
      </header>
      



      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src="/travelers together hugging_1754971726997.avif"
                alt="Travel experience"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-black font-black" style={{fontFamily: '"Inter", sans-serif'}}>Skip the Tourist Traps.</span>
                        <span className="block font-black" style={{fontFamily: '"Inter", sans-serif'}}>
                          <span className="text-orange-400">Meet Locals and Other </span><span style={{color: '#3b82f6'}}>Nearby Travelers</span><span className="text-black"> Right Now, Today!!!</span>
                        </span>
                      </h1>
                      
                      {/* Personal credibility as founder */}
                      <div className="mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 animate-zoom-in" style={{animationDelay: '0.3s'}}>
                        <p className="text-xl text-white leading-relaxed">
                          <span className="text-orange-300 font-bold">"For over 15 years I've hosted and toured 400+ travelers from over 40 countries as a local.</span>
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
                        className="bg-orange-500 hover:bg-orange-600 text-black font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-colors duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
                        style={{
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                          minHeight: 'clamp(60px, 12vw, 80px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 2.5s ease-in-out infinite',
                        }}
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
                      <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Join the travel community • Connect today</p>
                    </div>

                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>





      {/* Live Events - Lu.ma style */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-slide-in-left">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Connect with Locals and other Travelers
            </h2>
            <p className="text-xl text-gray-600">
              Real people. Real experiences. Zero tourist traps.
            </p>
          </div>
          
          {/* Event Cards - Modern Lu.ma style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Beach Bonfire Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/event page bbq party_1753299541268.png" 
                  alt="Beach bonfire event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Beach Bonfire & BBQ</h3>
                  <p className="text-sm text-gray-600">Sunset gathering on the beach</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Beach</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Music</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Taco Tuesday Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col" style={{animationDelay: '0.2s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                <img 
                  src="/image_1754973365104.png" 
                  alt="Authentic taco stand with vintage neon sign" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Taco Tuesday</h3>
                  <p className="text-sm text-gray-600">Every Tuesday • $1.50 tacos</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">$1.50</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Food</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Weekly</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Hollywood Sign Hike Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col" style={{animationDelay: '0.3s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                <img 
                  src="/image_1754974796221.png" 
                  alt="Hollywood Sign at sunrise with mountain views" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Hollywood Sign Hike</h3>
                  <p className="text-sm text-gray-600">Every Saturday • 9:00 AM</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Hiking</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Photos</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Happy Hour at Jameson Pub Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden event-card animate-fade-in-up hover:shadow-2xl transform transition-all duration-300 flex flex-col" style={{animationDelay: '0.4s'}}>
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-amber-500 to-orange-600">
                <img 
                  src="/image_1754975666980.png" 
                  alt="Jameson's Pub exterior with green storefront and traditional Irish pub atmosphere" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1">Happy Hour Thursday</h3>
                  <p className="text-sm text-gray-600">Jameson Pub • Live Music</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">Drinks</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Live Music</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">21+</span>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 flex-grow">Join locals and travelers for Thursday happy hour with live music at Jameson Pub. Great drinks, live bands, and authentic LA nightlife.</p>
                <Button 
                  onClick={() => setLocation('/join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold mt-auto"
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



      {/* FROM THE FOUNDER SECTION */}
      <div className="relative py-16 sm:py-20 overflow-hidden">
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
      <div className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-orange-900/20">
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
      <div id="locals" className="py-20 bg-gradient-to-br from-white via-blue-50 to-teal-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-teal-900/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-800 text-sm sm:text-base font-bold rounded-full mb-6 shadow-lg border-2 border-blue-200">
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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🎉</span>
                    </div>
                    <h3 className="font-black text-blue-900 dark:text-blue-100 text-lg">Create Fun Hangouts</h3>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-base font-semibold">Beach BBQs, hiking adventures, cultural deep-dives</p>
                </div>
                
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:bg-gradient-to-br dark:from-teal-900/30 dark:to-teal-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-teal-200 dark:border-teal-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">💎</span>
                    </div>
                    <h3 className="font-black text-teal-900 dark:text-teal-100 text-lg">Show Off Your Spots</h3>
                  </div>
                  <p className="text-teal-800 dark:text-teal-200 text-base font-semibold">Your secret spots become legendary discoveries</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🤝</span>
                    </div>
                    <h3 className="font-black text-purple-900 dark:text-purple-100 text-lg">Expand Your Circle</h3>
                  </div>
                  <p className="text-purple-800 dark:text-purple-200 text-base font-semibold">Welcome travelers, connect with fellow locals</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:bg-gradient-to-br dark:from-orange-900/30 dark:to-orange-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-200 dark:border-orange-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🌟</span>
                    </div>
                    <h3 className="font-black text-orange-900 dark:text-orange-100 text-lg">Find Your Tribe</h3>
                  </div>
                  <p className="text-orange-800 dark:text-orange-200 text-base font-semibold">Turn strangers into lifelong friends</p>
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
                    Meet locals who share your interests and build lasting friendships. From weekend adventures to casual hangouts, grow your circle locally and globally.
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
      <div id="travelers" className="py-20 bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-red-900/10">
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
                  🌍 Travel Like a <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Local Insider</span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Forget the crowds and clichés. Discover destinations through the eyes of locals 
                  and connect with fellow adventurers who get your travel vibe.
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
                  <p className="text-slate-700 dark:text-slate-200 text-base font-semibold">Join authentic experiences crafted by locals</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:bg-gradient-to-br dark:from-emerald-800 dark:to-emerald-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-300 dark:border-red-600">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">🗺️</span>
                    </div>
                    <h3 className="font-black text-emerald-800 dark:text-emerald-100 text-lg">Hidden Gems</h3>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-200 text-base font-semibold">Discover spots that tourists never find</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-pink-300 dark:border-pink-600">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">👥</span>
                    </div>
                    <h3 className="font-black text-blue-800 dark:text-blue-100 text-lg">Travel Buddies</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-200 text-base font-semibold">Meet travelers with your dates and interests</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white text-lg font-bold">💡</span>
                    </div>
                    <h3 className="font-black text-purple-900 dark:text-purple-100 text-lg">Insider Tips</h3>
                  </div>
                  <p className="text-purple-800 dark:text-purple-200 text-base font-semibold">Get secrets that guidebooks can't provide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION SECTION */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            <span className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
              Ready to Join the Community?
            </span>
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Whether you're a local ready to share your city or a traveler seeking authentic experiences, 
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
      <div className="py-12 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
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