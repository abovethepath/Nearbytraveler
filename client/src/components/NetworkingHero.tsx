import networkingHeroImage from "@assets/netowrking hereo page_1756130525285.png";

export default function NetworkingHero() {
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
      
      {/* Smaller, thinner red X overlay */}
      <svg
        className="absolute inset-0 m-auto w-20 h-20 md:w-32 md:h-32 drop-shadow-lg"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <line x1="20" y1="20" x2="80" y2="80" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
        <line x1="80" y1="20" x2="20" y2="80" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
      </svg>

      {/* Content */}
      <div className="relative z-10 w-full px-5 md:px-8 pb-10 md:pb-0">
        <div className="max-w-3xl md:max-w-4xl">
          <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-semibold leading-tight">
            Networking, Reinvented.
          </h1>
          <p className="mt-3 md:mt-4 text-white/90 text-base md:text-xl max-w-2xl">
            Connect before, during, and after every event — no business cards needed.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <a href="/signup" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 bg-orange-500 text-white font-medium shadow-md hover:shadow-lg">
              Start Networking Now
            </a>
            <a href="/events" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 bg-white/90 backdrop-blur text-gray-900 font-medium shadow-md hover:bg-white">
              See Who's Going
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}