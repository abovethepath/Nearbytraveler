import { useLocation } from "wouter";
import networkingHeroImage from "@assets/image_1756131077690.png";

export default function NetworkingHero() {
  const [, setLocation] = useLocation();
  return (
    <section className="relative isolate min-h-[68vh] flex items-end md:items-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${networkingHeroImage})` }}
        aria-hidden="true"
      />
      {/* Dark gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 md:from-black/30 md:via-black/20 md:to-black/40" />
      
      {/* Large red X overlay */}
      <svg
        className="absolute inset-0 m-auto w-40 h-40 md:w-64 md:h-64 drop-shadow-lg"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <line x1="20" y1="20" x2="80" y2="80" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
        <line x1="80" y1="20" x2="20" y2="80" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
      </svg>

      {/* Content */}
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
                <button
                  onClick={() => setLocation('/join')}
                  className="bg-transparent hover:bg-white/10 text-white font-bold text-lg px-8 py-3 rounded-full border-2 border-white transition-all duration-200 transform hover:scale-105"
                >
                  START NETWORKING NOW
                </button>
                <p className="text-white mt-3 text-base sm:text-lg font-semibold px-2">Join the networking revolution • Connect today</p>
              </div>

            </div>
          </main>
        </div>
      </div>
    </section>
  );
}