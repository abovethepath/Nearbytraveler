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
          onClick={() => setLocation('/auth')}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-black font-black px-8 py-4 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-3 border-white"
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
            onClick={() => setLocation('/auth')}
            className="bg-black text-orange-400 font-bold px-6 py-2 rounded-lg hover:bg-gray-800 ml-4"
          >
            SIGN UP NOW
          </Button>
        </div>
      </div>

      {/* Landing Navbar with BETA badge - Add top padding for sticky bar */}
      <div className="pt-16">
        <LandingNavbar />
      </div>
      



      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900 border border-white/30 dark:border-gray-300/20">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src="/attached_assets/travelers together hugging_1754971726997.avif"
                alt="Travel experience"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-4 mx-auto max-w-full sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block text-white font-black" style={{fontFamily: '"Inter", sans-serif'}}>Skip the tourist traps.</span>
                        <span className="block text-orange-400 font-black" style={{fontFamily: '"Inter", sans-serif'}}>Meet locals and other Nearby Travelers right now, today!!!</span>
                      </h1>
                      
                      {/* Personal credibility as founder */}
                      <div className="mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                        <p className="text-xl text-white leading-relaxed">
                          <span className="text-orange-300 font-bold">"Over 15 years I hosted and toured 400+ travelers from 30+ countries as a local.</span>
                          <span className="text-white"> Now I built Nearby Traveler to do exactly that - meet real locals and real travelers while creating amazing new travel adventures."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg">— Aaron, Founder</p>
                          <p className="text-orange-200 text-sm">400+ travelers hosted • 30+ countries • 15 years</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary signup CTA */}
                    <div className="mt-12 mb-8">
                      <Button
                        onClick={() => setLocation('/auth')}
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-black font-black text-2xl px-16 py-6 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-4 border-white"
                        style={{
                          fontSize: '1.8rem',
                          minHeight: '80px',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.9)',
                          animation: 'gentle-pulse 2.5s ease-in-out infinite',
                        }}
                      >
                        JOIN NEARBY TRAVELER NOW!!!
                      </Button>
                      <p className="text-white/80 mt-3 text-lg">Join the travel community • Connect today</p>
                    </div>

                  </div>
                </main>
              </div>
            </div>
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



      {/* Live Events - Lu.ma style */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Connect with Locals
            </h2>
            <p className="text-xl text-gray-600">
              Real people. Real experiences. Zero tourist traps.
            </p>
          </div>
          
          {/* Event Cards - Modern Lu.ma style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Experience 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all duration-200 hover:shadow-xl cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 relative">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Silver Lake Music Scene</h3>
                  <p className="text-sm opacity-90">Underground venues & vinyl shops</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ?
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Local Music Producer</p>
                    <p className="text-sm text-gray-600">Insider knowledge of the scene</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">Connect with locals who know the real Silver Lake music culture - venues, record shops, and artists not on any tour guide.</p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Example Experience 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all duration-200 hover:shadow-xl cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-blue-400 via-cyan-400 to-green-400 relative">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Venice Beach Locals</h3>
                  <p className="text-sm opacity-90">Beyond the boardwalk crowds</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ?
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Venice Native</p>
                    <p className="text-sm text-gray-600">Knows the real Venice</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">Skip the tourist traps. Meet Venice locals who can show you where they actually hang out, eat, and experience the authentic neighborhood.</p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>

            {/* Example Experience 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all duration-200 hover:shadow-xl cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 relative">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Downtown Art Scene</h3>
                  <p className="text-sm opacity-90">Galleries locals actually visit</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ?
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Art Scene Insider</p>
                    <p className="text-sm text-gray-600">Connected to DTLA arts</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">Discover the real downtown LA art scene through locals who work in galleries, know emerging artists, and visit spaces off the beaten path.</p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
            
            {/* Beach Bonfire Event Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                <img 
                  src="/event page bbq party_1753299541268.png" 
                  alt="Beach bonfire event" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    🏖️
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600">Sunset gathering on the beach</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
                >
                  JOIN TO CONNECT
                </Button>
              </div>
            </div>
          </div>

          {/* Call to action to see more */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => setLocation('/auth')}
              size="lg"
              className="bg-black text-orange-400 font-black px-12 py-4 rounded-2xl hover:bg-gray-800 text-xl"
            >
              JOIN THE COMMUNITY →
            </Button>
          </div>
        </div>
      </div>



      {/* FROM THE FOUNDER SECTION */}
      <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              From the Founder
            </h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
            <div className="prose prose-lg text-gray-700 dark:text-gray-300 mx-auto text-left">
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                As a traveler and local, I always loved meeting new people—but finding those who truly shared my interests wasn't easy.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                That's why I created Nearby Traveler.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                This platform helps travelers and locals meet each other, based on shared interests, activities, demographics, and events—making every encounter more meaningful.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                Whether you're exploring your city or visiting somewhere new, Nearby Traveler helps you:
              </p>
              <div className="mb-6 pl-4">
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Connect with like-minded people</span></p>
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Discover hidden gems</span></p>
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Create unforgettable memories</span></p>
              </div>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                It's more than just travel—it's about real community, wherever you are. So complete your profile, dive in, and start connecting.
              </p>
              <p className="mb-2 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                Thanks for being part of the journey.
              </p>
              <div className="text-right mt-6">
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Aaron Lefkowitz</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Founder, Nearby Traveler</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION - SIMPLIFIED */}
      <div className="bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500 py-12 sm:py-16">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl px-4" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 px-4">
              Simple steps to connect with locals and travelers worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1: Join */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step1-icon_1753297128966.png" 
                      alt="Join Nearby Traveler" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 1 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">1</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Join Nearby Traveler</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Join Nearby Traveler to help shape the future of travel connections, sharing your interests and travel style for personalized matches.
              </p>
            </div>

            {/* Step 2: Connect */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step2-icon_1753297145395.png" 
                      alt="Connect with People" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 2 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">2</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Connect with Nearby Travelers and Locals who share your interests and travel dates.
              </p>
            </div>

            {/* Step 3: Explore */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step3-icon_1753297157985.png" 
                      alt="Explore and Discover" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 3 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">3</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Explore</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                Explore your destination with your new connections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOR LOCALS SECTION */}
      <div id="locals" className="py-16 bg-white dark:sm:bg-gray-800 dark:bg-gray-400">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                🏠 Locals: Your City, Through Your Eyes
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6">
                You know your city best. You create the experiences that make travelers fall in love 
                with your hometown. You're not just participating - you're leading.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Host Events:</strong> Beach BBQs, hiking trips, cultural tours - share what you love</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Share Hidden Gems:</strong> Your secret spots become unforgettable discoveries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Make Connections:</strong> Connect with other locals and welcome travelers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Build Community:</strong> Create lasting friendships with fellow travelers and locals who share your interests</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Expand Your Social Network</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6">
                Share your favorite spots, host unique events, and show travelers the authentic side of your city.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Nearby Local
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOR TRAVELERS SECTION */}
      <div id="travelers" className="py-16 bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Next Adventure Awaits</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6">
                Find local-led experiences and connect with fellow travelers to make your next trip unforgettable.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Nearby Traveler
              </Button>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                🌍 For Travelers: Discover Cities Through Connections
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6">
                Skip the tourist traps. Connect with locals who know their cities inside out and 
                fellow travelers who share your interests and travel dates.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Local-Created Events:</strong> Join authentic experiences designed by locals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Hidden Gem Access:</strong> Discover spots tourists never find</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Traveler Connections:</strong> Meet people who share your travel dates and interests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Insider Knowledge:</strong> Get tips that guidebooks don't have</span>
                </li>
              </ul>
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

      <Footer />
    </div>
  );
}