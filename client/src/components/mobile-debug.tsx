import { useState, useEffect } from "react";

export default function MobileDebug() {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed top-0 left-0 bg-red-500 text-white p-2 z-[9999] text-xs font-mono">
      Screen: {screenWidth}px | Mobile: {isMobile ? 'YES' : 'NO'} | Bottom Nav: {isMobile ? 'SHOWING' : 'HIDDEN'}
    </div>
  );
}