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

  let sizeClass = "h-8 w-auto max-h-8";
  
  if (variant === "navbar") sizeClass = "h-10 w-auto max-h-10";
  if (variant === "landing") sizeClass = "h-12 w-auto max-h-12";
  if (variant === "header") sizeClass = "h-16 w-auto max-h-16";
  if (variant === "footer") sizeClass = "h-8 w-auto max-h-8";
  if (variant === "black-navbar") sizeClass = "h-10 w-auto max-h-10";

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
