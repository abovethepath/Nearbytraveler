import LandingNavbar from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function LandingHeader() {
  const [, setLocation] = useLocation();

  const handleJoinFree = () => {
    setLocation('/join');
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100]"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        /* Force GPU compositing so iOS WKWebView keeps this element fixed
           during scroll. Without this, position:fixed can scroll with the page
           when parent elements have overflow:clip or certain background transitions. */
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="landing-header-nav border-b-2 border-orange-500">
        <div className="max-w-7xl mx-auto">
          <LandingNavbar />
        </div>
      </div>

      <style>{`
        .landing-header-nav {
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
        }
        .dark .landing-header-nav {
          background: rgba(17, 24, 39, 0.97);
        }
        /* iOS Safari: backdrop-filter can drop during fast scroll.
           Use near-opaque fallback so nav never becomes invisible. */
        @supports not (backdrop-filter: blur(1px)) {
          .landing-header-nav { background: #ffffff; }
          .dark .landing-header-nav { background: #111827; }
        }
      `}</style>
    </div>
  );
}

export function LandingHeaderSpacer() {
  return (
    <>
      <div className="h-16 xl:hidden" />
      <div className="hidden xl:block h-[72px]" />
    </>
  );
}
