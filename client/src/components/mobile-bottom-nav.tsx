import { useLocation } from "wouter";
import { Home, MapPin, Calendar, MessageCircle, User } from "lucide-react";

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  
  const navItems = [
    { 
      icon: Home, 
      label: "Home", 
      path: "/", 
      isActive: location === "/" 
    },
    { 
      icon: MapPin, 
      label: "Explore", 
      path: "/explore", 
      isActive: location.startsWith("/explore") 
    },
    { 
      icon: Calendar, 
      label: "Events", 
      path: "/events", 
      isActive: location.startsWith("/events") 
    },
    { 
      icon: MessageCircle, 
      label: "Chat", 
      path: "/chat", 
      isActive: location.startsWith("/chat") 
    },
    { 
      icon: User, 
      label: "Profile", 
      path: "/profile", 
      isActive: location.startsWith("/profile") 
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-red-500 border-t-4 border-white z-50" 
      style={{ 
        display: 'block !important',
        minHeight: '64px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 bg-red-500">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors touch-manipulation text-white font-bold"
            >
              <IconComponent 
                size={24} 
                className="text-white" 
              />
              <span className="text-xs font-bold text-white">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}