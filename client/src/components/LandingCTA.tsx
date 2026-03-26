import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-12 sm:py-16 px-4 text-center">
      <div className="max-w-3xl mx-auto">

        {/* Animated arrows pointing down */}
        <div className="flex justify-center gap-6 mb-4">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-orange-500"
              style={{
                animation: `ctaBounce 1s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}
            >
              <path
                d="M12 4v12M6 13l6 7 6-7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>

        {/* Pulsing ring wrapper */}
        <div className="relative inline-block w-full sm:w-auto">
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-orange-500 opacity-60"
            style={{ animation: "ctaRing 1.4s ease-in-out infinite" }}
          />
          <Button
            onClick={() => setLocation('/join')}
            size="lg"
            className="relative bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold text-lg sm:text-xl md:text-2xl px-8 sm:px-12 py-8 sm:py-10 rounded-2xl shadow-xl hover:shadow-2xl transition-colors duration-200 whitespace-normal h-auto leading-snug w-full sm:w-auto"
          >
            I get it, connect travelers with locals and locals with travelers — take me to sign up
          </Button>
        </div>

      </div>

      <style>{`
        @keyframes ctaBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        @keyframes ctaRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.06); opacity: 0.15; }
        }
      `}</style>
    </section>
  );
}
