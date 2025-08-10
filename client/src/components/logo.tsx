import { useLocation } from "wouter";

const newLogo = "/new-logo_1753994063802.png";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-144 w-auto scale-x-110";
      case "navbar":
        return "h-96 sm:h-84 md:h-96 lg:h-120 xl:h-192 w-auto";
      case "black-navbar":
        return "h-192 w-auto";
      case "footer":
        return "h-219 w-auto md:h-219 sm:h-189";
      default:
        return "h-36 w-auto scale-x-125";
    }
  };

  const baseClasses = `object-contain ${getVariantSize()}`;
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <img 
      src={newLogo} 
      alt="Nearby Traveler Logo" 
      className={finalClasses}
      data-testid="logo-image"
      loading="eager"
    />
  );
}