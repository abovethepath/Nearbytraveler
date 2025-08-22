import LandingNavbar from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function LandingHeader() {
  const [, setLocation] = useLocation();
  return (
    <div className="fixed inset-x-0 top-0 z-[100]">
      {/* Mobile announcement bar */}
      <div className="md:hidden bg-orange-500 text-black py-3 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <span className="font-bold text-sm">🔥 Connect with Locals and Travelers TODAY - Sign Up Now!</span>
          <Button
            onClick={() => setLocation("/join")}
            className="bg-black text-orange-400 font-bold px-3 py-2 rounded-lg hover:bg-gray-800 shrink-0"
          >
            SIGN UP
          </Button>
        </div>
      </div>

      {/* Desktop orange border and announcement */}
      <div className="hidden md:block bg-orange-500 text-black py-2 px-4 text-center font-bold text-sm">
        🔥 Connect with Locals and Travelers TODAY - Sign Up Now!
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