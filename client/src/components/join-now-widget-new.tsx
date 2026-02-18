import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plane, Store, Check } from "lucide-react";

interface JoinNowWidgetNewProps {
  /** When true, use light text for use on dark join page background */
  darkBackground?: boolean;
}

export default function JoinNowWidgetNew({ darkBackground }: JoinNowWidgetNewProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");

  const handleUserTypeClick = (type: string) => {
    console.log('🔥 JOIN WIDGET: User type clicked:', type);
    setUserType(type);
  };

  const handleContinue = () => {
    console.log('🔥 JOIN WIDGET: Continue button clicked, userType:', userType);
    
    if (!userType) {
      console.log('❌ JOIN WIDGET: No user type selected');
      toast({
        title: "Please select your type",
        description: "Choose your account type to continue.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ JOIN WIDGET: Storing userType in sessionStorage:', userType);
    sessionStorage.setItem('selectedUserType', userType);
    sessionStorage.removeItem('isNewToTown');
    
    console.log('🚀 JOIN WIDGET: Navigating to /signup/account');
    setLocation('/signup/account');
  };

  const userTypes = [
    {
      type: "local",
      icon: MapPin,
      title: "Nearby Local",
      subtitle: "I live here & want to meet travelers",
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-500",
      ringColor: "ring-blue-300",
    },
    {
      type: "traveler",
      icon: Plane,
      title: "Nearby Traveler",
      subtitle: "I'm traveling & want to connect",
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      bgLight: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-500",
      ringColor: "ring-orange-300",
    },
    {
      type: "business",
      icon: Store,
      title: "Nearby Business",
      subtitle: "I run a local business",
      color: "teal",
      gradient: "from-teal-500 to-teal-600",
      bgLight: "bg-teal-50 dark:bg-teal-950/50",
      borderColor: "border-teal-500",
      ringColor: "ring-teal-300",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-left text-gray-600 dark:text-gray-400 font-medium text-sm [.join-page-dark_&]:text-gray-200">
        Choose how you want to connect
      </p>
      
      <div className="space-y-3">
        {userTypes.map(({ type, icon: Icon, title, subtitle, gradient, bgLight, borderColor, ringColor }) => {
          const isSelected = userType === type;
          
          return (
            <button
              key={type}
              onClick={() => handleUserTypeClick(type)}
              type="button"
              className={`
                w-full relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200
                flex items-center gap-4
                ${isSelected 
                  ? `bg-gradient-to-r ${gradient} text-white shadow-lg scale-[1.02] ring-4 ${ringColor}` 
                  : `${bgLight} border-2 ${borderColor} hover:shadow-md hover:scale-[1.01]`
                }
              `}
              data-testid={`button-select-${type}`}
            >
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                ${isSelected 
                  ? "bg-white/20" 
                  : `bg-gradient-to-br ${gradient}`
                }
              `}>
                <Icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-white"}`} />
              </div>
              
              <div className="flex-grow">
                <div className={`text-lg font-bold ${isSelected ? "text-white" : darkBackground ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {title}
                </div>
                <div className={`text-sm ${isSelected ? "text-white/90" : darkBackground ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
                  {subtitle}
                </div>
              </div>
              
              {isSelected && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        type="button"
        disabled={!userType}
        className={`
          w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200
          ${userType 
            ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]" 
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }
        `}
        data-testid="button-continue"
      >
        {userType ? "Continue →" : "Select an option to continue"}
      </Button>
    </div>
  );
}
