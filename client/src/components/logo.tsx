import { useLocation } from "wouter";

interface LogoProps {
  className?: string;
  variant?: "landing" | "navbar" | "default" | "footer" | "black-navbar" | "header";
}

export default function Logo({ className, variant = "default" }: LogoProps) {
  const isNavbar = variant === "navbar" || variant === "black-navbar" || variant === "footer";
  const logoSrc = isNavbar ? "/og-logo-landscape.png" : "/og-logo-dark.png";

  const getVariantSize = () => {
    switch (variant) {
      case "landing":
        return "h-20 w-auto";
      case "navbar":
        return "h-10 sm:h-10 md:h-12 lg:h-12 xl:h-12 w-auto";
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
      src={logoSrc}
      alt="Nearby Traveler"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      onClick={handleClick}
      onLoad={() => console.log('Logo loaded successfully')}
      onError={(e) => {
        console.error('Logo failed to load from:', logoSrc);
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
