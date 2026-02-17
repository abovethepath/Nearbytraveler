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
        return "h-10 w-auto";
      case "black-navbar":
        return "h-14 w-auto";
      case "footer":
        return "h-10 w-auto";
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
      src="/new-logo.png"
      alt="Nearby Traveler"
      className={`${finalClassName} cursor-pointer hover:opacity-80 transition-opacity object-contain`}
      onClick={handleClick}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const textLogo = document.createElement('span');
        textLogo.style.cssText = 'font-size:16px;font-weight:700;cursor:pointer;white-space:nowrap;';
        textLogo.innerHTML = '<span style="color:#3B82F6">Nearby</span><span style="color:#F97316">Traveler</span>';
        textLogo.onclick = handleClick;
        target.parentElement?.appendChild(textLogo);
      }}
    />
  );
}
