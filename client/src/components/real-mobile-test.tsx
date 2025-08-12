import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RealMobileTest() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [userAgent, setUserAgent] = useState("");

  useEffect(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setUserAgent(navigator.userAgent);
    
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const forceMobileViewport = () => {
    // Force mobile viewport by adding meta tag
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
    
    // Add mobile classes to body
    document.body.classList.add('mobile-viewport');
    document.documentElement.classList.add('mobile-viewport');
    
    // Reload to apply changes
    window.location.reload();
  };

  const resetViewport = () => {
    const metas = document.querySelectorAll('meta[name="viewport"]');
    metas.forEach(meta => meta.remove());
    document.body.classList.remove('mobile-viewport');
    document.documentElement.classList.remove('mobile-viewport');
    window.location.reload();
  };

  return (
    <div className="fixed top-0 right-0 bg-black text-white p-4 z-[9999] max-w-sm text-xs">
      <h3 className="font-bold mb-2">REAL MOBILE TEST</h3>
      <div className="space-y-1 mb-3">
        <div>Width: {viewport.width}px</div>
        <div>Height: {viewport.height}px</div>
        <div>Mobile: {viewport.width < 768 ? 'YES' : 'NO'}</div>
        <div>Touch: {'ontouchstart' in window ? 'YES' : 'NO'}</div>
        <div className="text-xs opacity-75">
          UA: {userAgent.includes('Mobile') ? 'MOBILE' : 'DESKTOP'}
        </div>
      </div>
      
      <div className="space-y-2">
        <Button 
          size="sm" 
          onClick={forceMobileViewport}
          className="w-full text-xs"
        >
          Force Mobile View
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={resetViewport}
          className="w-full text-xs"
        >
          Reset to Desktop
        </Button>
      </div>
      
      <div className="mt-3 text-xs opacity-75">
        This shows REAL mobile behavior, not a fake preview
      </div>
    </div>
  );
}