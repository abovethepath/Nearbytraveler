import { useLocation } from "wouter";
import { useState, useEffect } from "react";
const newLogo = "/new-logo.png";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-20 w-auto";
      case "navbar":
        return "h-14 sm:h-14 md:h-14 lg:h-14 xl:h-14 w-auto";
      case "black-navbar":
        return "h-14 w-auto";
      case "footer":
        return "h-12 w-auto md:h-12 sm:h-10";
      case "header":
        return "h-16 sm:h-20 md:h-20 lg:h-24 w-auto";
      default:
        return "h-10 w-auto";
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
      src="/new-logo.png"
      alt="Nearby Traveler"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      onClick={handleClick}
      onLoad={() => console.log('Logo loaded successfully')}
      onError={(e) => {
        console.error('Logo failed to load from:', '/new-logo.png');
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