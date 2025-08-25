import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import networkingHeroImage from "@assets/image_1756131077690.png";

export default function NetworkingHero() {
  const [, setLocation] = useLocation();
  return (
    <div className="relative z-0">
      <div className="bg-gray-800 dark:bg-gray-900 border-4 border-purple-500 shadow-lg">
        <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
          <div className="absolute inset-0 h-full min-h-[600px]">
            <img
              src={networkingHeroImage}
              alt="Professional networking event with people connecting"
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
          
          {/* Extra large red X overlay */}
          <svg
            className="absolute inset-0 m-auto w-72 h-72 md:w-96 md:h-96 drop-shadow-lg z-10"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <line x1="15" y1="15" x2="85" y2="85" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
            <line x1="85" y1="15" x2="15" y2="85" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
          </svg>

          <div className="relative">
            <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
              <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
                <div className="text-center">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="px-3 leading-tight sm:leading-snug">
                      <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white">
                        Networking, Reinvented.
                      </span>
                      <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)]">
                        <span className="text-amber-300 sm:text-orange-500">Connect before, during, and after every event </span>
                        <span className="text-white">— no business cards needed.</span>
                      </span>
                    </h1>
                    
                    {/* What Our Network Says (hide on phones so the hero photo is visible) */}
                    <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20">
                      <div className="text-center mb-4">
                        <h3 className="text-white font-bold text-lg mb-4">What Our Network Says</h3>
                      </div>
                      <p className="text-xl text-white leading-relaxed text-center">
                        <span className="text-orange-300 font-bold">"Thanks to Nearby Traveler, You can meet half your conference before even landing. An event can feel like a reunion, not a room full of strangers."</span>
                      </p>
                      <div className="mt-4 text-center">
                        <p className="text-white font-bold text-lg">— Aaron, Founder</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary networking CTA */}
                  <div className="mt-12 mb-8 px-4">
                    <Button
                      onClick={() => setLocation('/join')}
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-colors duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
                      style={{
                        fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)',
                        minHeight: 'clamp(60px, 12vw, 80px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                        animation: 'gentle-pulse 2.5s ease-in-out infinite',
                      }}
                    >
                      START NETWORKING NOW
                    </Button>
                    <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Join the networking revolution • Connect today</p>
                  </div>

                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}