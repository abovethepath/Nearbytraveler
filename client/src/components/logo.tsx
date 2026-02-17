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

  return (
    <div style={{ overflow: "hidden", width: variant === "navbar" ? "100px" : "150px", height: "auto" }}>
      <img
        src={`/new-logo.png?t=${Date.now()}`}
        alt="Nearby Traveler"
        onClick={handleClick}
        style={{ 
          cursor: "pointer", 
          display: "block",
          width: "100%",
          height: "auto"
        }}
        onError={() => {
          console.error("Logo failed to load");
        }}
      />
    </div>
  );
}