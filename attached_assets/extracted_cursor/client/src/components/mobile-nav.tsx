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
      isActive: location === "/profile" 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-[9999] shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center space-y-1 py-2 px-3 relative transition-colors ${
                item.isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.hasNotification && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-orange-500 text-white text-xs flex items-center justify-center">
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