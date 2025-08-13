import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Compass, Calendar, MessageCircle, User, MapPin } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { 
      path: "/", 
      label: "Discover", 
      icon: Compass,
      isActive: location === "/" 
    },
    { 
      path: "/events", 
      label: "Events", 
      icon: Calendar,
      isActive: location === "/events" 
    },
    { 
      path: "/cities", 
      label: "Cities", 
      icon: MapPin,
      isActive: location.startsWith("/city") || location === "/cities" 
    },
    { 
      path: "/messages", 
      label: "Messages", 
      icon: MessageCircle,
      isActive: location === "/messages",
      hasNotification: true 
    },
    { 
      path: "/profile", 
      label: "Profile", 
      icon: User,
      isActive: location.startsWith("/profile")
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-2 z-[60] shadow-2xl backdrop-blur-sm mobile-nav-button" style={{paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'}}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center space-y-1 py-3 px-4 relative transition-all duration-200 rounded-xl touch-manipulation ${
                item.isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 active:scale-95"
              }`}
              style={{ minHeight: '60px', minWidth: '60px' }}
            >
              <Icon className={`transition-transform duration-200 ${item.isActive ? 'w-7 h-7' : 'w-6 h-6'}`} />
              <span className={`text-xs font-medium transition-all duration-200 ${item.isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {item.hasNotification && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center animate-pulse shadow-lg">
                  3
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}