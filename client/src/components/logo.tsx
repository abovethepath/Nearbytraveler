import { useLocation } from "wouter";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-10 sm:h-12 md:h-14 lg:h-16 w-auto";
      case "navbar":
        return "h-8 sm:h-9 md:h-10 lg:h-10 w-auto";
      case "black-navbar":
        return "h-8 w-auto";
      case "footer":
        return "h-8 w-auto md:h-10 sm:h-8";
      case "header":
        return "h-10 sm:h-12 md:h-14 lg:h-14 w-auto";
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
