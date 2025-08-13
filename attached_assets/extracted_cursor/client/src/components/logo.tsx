import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import newLogo from "@assets/new-logo_1753994063802.png";

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
        return "h-48 w-auto scale-x-110"; // Optimal size for welcome back page with less horizontal stretch
      case "navbar":
        return "h-24 sm:h-28 md:h-32 lg:h-40 xl:h-64 w-auto"; // Responsive: larger on mobile, scaling up on desktop
      case "black-navbar":
        return "h-64 w-auto"; // Massive logo for maximum brand prominence
      case "footer":
        return "h-73 w-auto md:h-73 sm:h-63"; // Footer size exactly matching navbar
      default:
        return "h-12 w-auto scale-x-125"; // Increased default size
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