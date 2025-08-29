import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import networkingHeroImage from "@assets/image_1756131077690.png";

interface NetworkingHeroProps {
  isAirbnbStyle?: boolean;
}

export default function NetworkingHero({ isAirbnbStyle = true }: NetworkingHeroProps) {
  const [, setLocation] = useLocation();
  
  if (!isAirbnbStyle) {
    // Original centered layout (for investors)
    return (
      <div className="pt-20 pb-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
            Networking, Reinvented
          </h1>
          <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect before, during, and after every event — no business cards needed
          </p>
          
          <Button
            onClick={() => setLocation('/join')}
            size="lg"
            className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
          >
            Join Nearby Traveler
          </Button>
        </div>
      </div>
    );
  }
  
  // Clean, professional hero section
  return (
    <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 md:grid-cols-2 items-center">
        {/* Left text side */}
        <div>
          <div className="mb-4 inline-block rounded-full bg-orange-50 dark:bg-orange-900/30 px-4 py-1 text-sm font-medium text-orange-700 dark:text-orange-400">
            🚀 Now Launching: Be Among the First to Connect Globally
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Networking, Reinvented
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
            Connect before, during, and after every event — no business cards needed
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setLocation('/join')}
              className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow hover:bg-zinc-800 w-full sm:w-auto"
              data-testid="button-join-journey"
            >
              Join the Journey
            </button>
            <button 
              onClick={() => {
                document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-xl border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800 w-full sm:w-auto"
              data-testid="button-see-how-it-works"
            >
              See How It Works
            </button>
          </div>
        </div>
        
        {/* Right image side */}
        <div className="flex justify-center">
          <img
            src={networkingHeroImage}
            alt="Professional networking event with people connecting"
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
  
  // Note: Original full-screen layout preserved below but not used in current toggle system
  return (
    <div className="relative z-0">
      <div className="bg-gray-800 dark:bg-gray-900 border-4 border-purple-500 shadow-lg">
        <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 h-full min-h-[400px]">
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
                      <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-black dark:text-white animate-slide-in-1">
                        Networking, Reinvented.
                      </span>
                      <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)] animate-slide-in-2">
                        <span className="text-black dark:text-white">Connect before, during, and after every event </span>
                        <span className="text-black dark:text-white">— no business cards needed.</span>
                      </span>
                    </h1>
                    
                  </div>
                  
                  {/* Primary signup CTA */}
                  <div className="mt-32 mb-8 px-4">
                    <Button
                      onClick={() => setLocation('/join')}
                      size="lg"
                      className="bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 hover:bg-gray-100 dark:hover:from-blue-700 dark:hover:to-orange-600 text-black dark:text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 border-2 border-black dark:border-white max-w-md mx-auto"
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
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}