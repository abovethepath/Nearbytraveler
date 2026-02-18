import { useLocation } from "wouter";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header" | "auth" | "join";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/");
    window.scrollTo(0, 0);
  };

  // Text-based logo for join/auth: "Nearby" (blue) + "Traveler" (orange) with arcs — no black box, blends with background
  if (variant === "join") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex flex-col items-center justify-center cursor-pointer select-none ${className ?? ""}`}
        aria-label="Nearby Traveler"
      >
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-500 dark:text-blue-400">Nearby</span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-500 dark:text-orange-400">Traveler</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <svg width="72" height="14" viewBox="0 0 72 14" fill="none" className="text-blue-400 dark:text-blue-500 sm:w-20 md:w-24">
            <path d="M 2 12 Q 18 2 36 12 Q 54 2 70 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <svg width="72" height="14" viewBox="0 0 72 14" fill="none" className="text-orange-500 dark:text-orange-400 sm:w-20 md:w-24">
            <path d="M 2 2 Q 18 12 36 2 Q 54 12 70 2" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </button>
    );
  }

  let sizeClass = "h-8 w-auto max-h-8";
  
  if (variant === "navbar") sizeClass = "h-10 w-auto max-h-10";
  if (variant === "landing") sizeClass = "h-12 w-auto max-h-12";
  if (variant === "header") sizeClass = "h-16 w-auto max-h-16";
  if (variant === "auth") sizeClass = "h-20 sm:h-24 md:h-28 w-auto max-h-32";
  if (variant === "footer") sizeClass = "h-8 w-auto max-h-8";
  if (variant === "black-navbar") sizeClass = "h-10 w-auto max-h-10";

  const finalClass = className || sizeClass;
  const isAuthVariant = variant === "auth";

  return (
    <img
      src={`/new-logo.png?t=${Date.now()}`}
      alt="Nearby Traveler"
      className={`${finalClass} ${isAuthVariant ? "dark:mix-blend-lighten" : ""}`}
      onClick={handleClick}
      style={{
        cursor: "pointer",
        display: "block",
        ...(isAuthVariant && { background: "transparent" }),
      }}
      onError={() => {
        console.error("Logo failed to load");
      }}
    />
  );
}
