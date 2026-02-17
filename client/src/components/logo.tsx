import { useLocation } from "wouter";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/");
    window.scrollTo(0, 0);
  };

  let sizeClass = "h-8 w-auto";
  let maxHeight = 32;

  if (variant === "navbar") { sizeClass = "h-8 w-auto"; maxHeight = 32; }
  if (variant === "landing") { sizeClass = "h-12 w-auto"; maxHeight = 48; }
  if (variant === "header") { sizeClass = "h-48 w-auto"; maxHeight = 192; }
  if (variant === "footer") { sizeClass = "h-8 w-auto"; maxHeight = 32; }
  if (variant === "black-navbar") { sizeClass = "h-10 w-auto"; maxHeight = 40; }

  const finalClass = className || sizeClass;

  return (
    <img
      src="/new-logo.png"
      alt="Nearby Traveler"
      className={finalClass}
      onClick={handleClick}
      style={{ cursor: "pointer", maxHeight: `${maxHeight}px`, objectFit: "contain" }}
      onError={() => console.error("Logo failed to load")}
    />
  );
}
