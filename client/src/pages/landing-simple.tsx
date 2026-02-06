import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import { MapPin, Users, Bell } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingSimple() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const handleJoin = (source: string) => {
    trackEvent('signup_cta_click', 'landing_simple', source);
    setLocation('/join');
  };

  return (
    <div className="bg-white font-sans min-h-screen flex flex-col">
      {/* Compact header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => { setLocation('/'); window.scrollTo(0, 0); }} className="flex items-center">
            <img src="/new-logo.png" alt="Nearby Traveler" className="h-9 w-auto" />
          </button>
          <Button
            onClick={() => handleJoin('nav')}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-5"
          >
            Join Free
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-500" />
          <div className="relative max-w-3xl mx-auto px-5 py-20 sm:py-28 text-center">
            <h1
              className="text-white font-extrabold leading-tight"
              style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', letterSpacing: '-0.03em' }}
            >
              Traveling?{' '}
              <span className="text-amber-300">Meet Locals</span>{' '}
              &amp;&nbsp;Travelers.
            </h1>

            <p className="mt-5 text-blue-100 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
              Connect before you go. Meet up when you're there. Get notified when travel friends come to your city.
            </p>

            <Button
              onClick={() => handleJoin('hero')}
              size="lg"
              className="mt-8 bg-white text-blue-700 hover:bg-blue-50 font-bold text-lg px-10 py-4 rounded-full shadow-lg"
            >
              Join Free
            </Button>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <Step
              icon={<MapPin className="w-8 h-8 text-orange-500" />}
              number="1"
              title="Set your destination"
            />
            <Step
              icon={<Users className="w-8 h-8 text-blue-600" />}
              number="2"
              title="Match with locals & travelers"
            />
            <Step
              icon={<Bell className="w-8 h-8 text-green-600" />}
              number="3"
              title="Meet up for real experiences"
            />
          </div>
        </section>

        {/* DIFFERENTIATOR */}
        <section className="bg-gray-50 border-t border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-5 py-14 sm:py-16 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We notify you when friends from past trips are nearby — so connections don't end when travel does.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-2xl mx-auto px-5 py-16 sm:py-20 text-center">
          <Button
            onClick={() => handleJoin('bottom')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-md"
          >
            Join Free
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Launching in LA, NYC, London, Lisbon
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Step({ icon, number, title }: { icon: React.ReactNode; number: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Step {number}</span>
      <p className="text-gray-900 font-semibold text-base">{title}</p>
    </div>
  );
}
