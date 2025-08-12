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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 block md:hidden" style={{ display: 'block' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors touch-manipulation ${
                item.isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <IconComponent 
                size={20} 
                className={item.isActive ? "text-blue-600 dark:text-blue-400" : ""} 
              />
              <span 
                className={`text-xs font-medium ${
                  item.isActive ? "text-blue-600 dark:text-blue-400" : ""
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}