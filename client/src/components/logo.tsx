import { useLocation } from "wouter";
import { useState, useEffect } from "react";
// Use server static file instead of asset import
const newLogo = "/attached_assets/new-logo_1753994063802.png";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Watch for theme changes to update logo reactively
  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    updateTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-108 w-auto scale-x-110"; // 25% smaller - Optimal size for welcome back page with less horizontal stretch
      case "navbar":
        return "h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18 w-auto"; // Fixed mobile logo size to prevent overflow
      case "black-navbar":
        return "h-144 w-auto"; // 25% smaller - Large logo for brand prominence
      case "footer":
        return "h-164 w-auto md:h-164 sm:h-142"; // 25% smaller - Footer size matching navbar
      default:
        return "h-27 w-auto scale-x-125"; // 25% smaller - Reduced default size
    }
  };

  const getLogoImage = () => {
    // The new logo has a blue-to-orange gradient that works well on both light and dark backgrounds
    return newLogo;
  };

  const finalClassName = className || getVariantSize();
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/");
    window.scrollTo(0, 0);
  };



  // Add footer-specific class to preserve image colors
  const footerClass = variant === "footer" ? " footer-logo-preserve-colors" : "";



  return (
    <img
      src={getLogoImage()}
      alt="The Nearby Traveler - Where local experiences meet worldwide connections"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain${footerClass}`}
      onClick={handleClick}
      style={{ 
        objectPosition: 'center top'
      }}
      onError={(e) => {
        console.error('Logo failed to load:', e);
        // Fallback to the new logo
        (e.target as HTMLImageElement).src = newLogo;
      }}
    />
  );
}