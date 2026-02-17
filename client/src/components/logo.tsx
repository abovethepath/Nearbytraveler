import { useLocation } from "wouter";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-10 w-auto";
      case "navbar":
        return "h-11 w-auto";
      case "black-navbar":
        return "h-14 w-auto";
      case "footer":
        return "h-12 w-auto md:h-12 sm:h-10";
      case "header":
        return "h-40 sm:h-44 md:h-48 lg:h-52 w-auto";
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
      src="/new-logo.png?v=2"
      alt="Nearby Traveler"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      style={variant === "navbar" ? { height: '44px', width: 'auto', maxHeight: '44px' } : undefined}
      onClick={handleClick}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const textLogo = document.createElement('div');
        textLogo.className = finalClassName + ' cursor-pointer font-bold text-teal-600 dark:text-teal-400';
        textLogo.textContent = 'Nearby Traveler';
        textLogo.onclick = handleClick;
        target.parentElement?.appendChild(textLogo);
      }}
    />
  );
}
