import LandingNavbar from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function LandingHeader() {
  const [, setLocation] = useLocation();
  return (
    <div className="fixed inset-x-0 top-0 z-[100]">
      {/* Mobile announcement bar */}
      <div className="md:hidden bg-orange-500 text-black py-4 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <Button
            onClick={() => setLocation("/join")}
            className="w-full bg-black text-orange-400 font-bold text-lg px-6 py-4 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🔥 CONNECT WITH LOCALS & TRAVELERS TODAY!
          </Button>
        </div>
      </div>

      {/* Desktop orange border and announcement */}
      <div className="hidden md:block bg-orange-500 text-black py-4 px-4 text-center">
        <Button
          onClick={() => setLocation("/join")}
          className="bg-black text-orange-400 font-bold text-xl px-8 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          🔥 CONNECT WITH LOCALS & TRAVELERS TODAY!
        </Button>
      </div>

      {/* Navbar (always visible) with orange border */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm border-4 border-orange-500">
        <div className="max-w-7xl mx-auto">
          <LandingNavbar />
        </div>
      </div>
    </div>
  );
}

/** Space below the fixed header (banner+navbar on mobile, banner+navbar+border on desktop) */
export function LandingHeaderSpacer() {
  return <div className="h-[112px] md:h-[104px]" />;
}