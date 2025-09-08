import { useLocation } from "wouter";
import { useState, useEffect } from "react";
const newLogo = "/new-logo_1753994063802.png";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
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
      case "header":
        return "h-24 sm:h-32 md:h-40 lg:h-48 w-auto"; // Bigger mobile logo
      default:
        return "h-12 w-auto scale-x-125"; // Increased default size
    }
  };

  const finalClassName = className || getVariantSize();
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/");
    window.scrollTo(0, 0);
  };

  return (
    <img
      src="/new-logo_1753994063802.png"
      alt="Nearby Traveler"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      onClick={handleClick}
      onLoad={() => console.log('Logo loaded successfully')}
      onError={(e) => {
        console.error('Logo failed to load from:', '/new-logo_1753994063802.png');
        // Show a fallback text logo
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const textLogo = document.createElement('div');
        textLogo.className = finalClassName.replace('h-8', 'h-8') + ' cursor-pointer font-bold text-teal-600 dark:text-teal-400';
        textLogo.textContent = 'Nearby Traveler';
        textLogo.onclick = handleClick;
        target.parentElement?.appendChild(textLogo);
      }}
    />
  );
}