import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 sm:py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <Button
          onClick={() => setLocation('/launching-soon')}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold text-lg sm:text-xl md:text-2xl px-8 sm:px-12 py-8 sm:py-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 whitespace-normal h-auto leading-snug w-full sm:w-auto"
        >
          I get it, connect travelers with locals and locals with travelers — take me to sign up
        </Button>
      </div>
    </section>
  );
}
