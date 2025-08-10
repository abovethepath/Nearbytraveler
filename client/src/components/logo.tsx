import { useLocation } from "wouter";
import { useState, useEffect } from "react";
const newLogo = "/new-logo_1753994063802.png";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-12 w-auto"; // Fixed size for landing
      case "navbar":
        return "h-8 w-auto"; // Fixed size for navbar
      case "black-navbar":
        return "h-8 w-auto"; // Fixed size for black navbar
      case "footer":
        return "h-8 w-auto"; // Fixed size for footer
      default:
        return "h-8 w-auto"; // Default fixed size
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
      src={newLogo}
      alt="The Nearby Traveler - Where local experiences meet worldwide connections"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      onClick={handleClick}
      onError={(e) => {
        console.error('Logo failed to load:', e);
        (e.target as HTMLImageElement).src = newLogo;
      }}
    />
  );
}