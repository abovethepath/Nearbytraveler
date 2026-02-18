import { useLocation } from "wouter";
import { isNativeIOSApp } from "@/lib/nativeApp";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(isNativeIOSApp() ? "/home" : "/");
    window.scrollTo(0, 0);
  };

  let sizeClass = "h-8 w-auto";
  
  if (variant === "landing") sizeClass = "h-12 w-auto";
  if (variant === "header") sizeClass = "h-48 w-auto";
  if (variant === "footer") sizeClass = "h-8 w-auto";
  if (variant === "black-navbar") sizeClass = "h-10 w-auto";

  const finalClass = className || sizeClass;

  return (
    <img
      src={`/new-logo.png?t=${Date.now()}`}
      alt="Nearby Traveler"
      className={finalClass}
      onClick={handleClick}
      style={{ cursor: "pointer", display: "block" }}
      onError={() => {
        console.error("Logo failed to load");
      }}
    />
  );
}
