import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import networkingHeroImage from "@assets/image_1756131077690.png";

export default function NetworkingHero() {
  const [, setLocation] = useLocation();
  return (
    <div className="relative z-0">
      <div className="bg-gray-800 dark:bg-gray-900 border-4 border-purple-500 shadow-lg">
        <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 h-full min-h-[500px]">
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
                    
                  </div>
                  
                  {/* Primary networking CTA */}
                  <div className="mt-12 mb-8 px-4">
                    <Button
                      onClick={() => setLocation('/join')}
                      size="lg"
                      className="bg-black hover:bg-gray-800 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl shadow-xl transition-colors duration-200 border-2 sm:border-4 border-white w-full max-w-lg mx-auto"
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