import LandingNavbar from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function LandingHeader() {
  const [, setLocation] = useLocation();

  const handleJoinFree = () => {
    setLocation('/join');
  };
  
  return (
    <div className="fixed inset-x-0 top-0 z-[100]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="xl:hidden bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Button
            onClick={handleJoinFree}
            className="flex-1 max-w-md bg-black text-white font-bold text-base px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 active:scale-95 shadow-lg"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
          >
            JOIN FOR FREE — IT'S LIVE!
          </Button>
        </div>
      </div>

      <div className="hidden xl:block bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-4 text-center">
        <Button
          onClick={handleJoinFree}
          className="bg-black text-white font-bold text-xl px-8 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
        >
          JOIN FOR FREE — IT'S LIVE!
        </Button>
      </div>

      <div className="landing-header-nav border-b-2 border-orange-500">
        <div className="max-w-7xl mx-auto">
          <LandingNavbar />
        </div>
      </div>

      <style>{`
        .landing-header-nav {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
        }
        .dark .landing-header-nav {
          background: rgba(17, 24, 39, 0.92);
        }
      `}</style>
    </div>
  );
}

export function LandingHeaderSpacer() {
  return (
    <>
      <div className="h-32 xl:hidden" />
      <div className="hidden xl:block h-[132px]" />
    </>
  );
}
