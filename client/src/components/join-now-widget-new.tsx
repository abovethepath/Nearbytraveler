import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function JoinNowWidgetNew() {
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

  return (
    <div className="space-y-3">
      {/* User Type Selection - 3 Types */}
      <div className="space-y-2">
        <Label className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">I am a...</Label>
        <div className="space-y-2.5">
          {/* Local */}
          <button
            onClick={() => handleUserTypeClick("local")}
            type="button"
            className={`w-full cursor-pointer rounded-lg p-3.5 text-center transition-all border-2 border-l-4 ${
              userType === "local" 
                ? "border-blue-600 border-l-blue-600 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 dark:border-l-blue-400 shadow-xl scale-[1.02] ring-2 ring-blue-200 dark:ring-blue-800" 
                : "border-gray-300 dark:border-gray-600 border-l-blue-500 dark:border-l-blue-400 hover:border-blue-400 dark:hover:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 hover:shadow-lg"
            }`}
            data-testid="button-select-local"
          >
            <div className={`text-base md:text-lg font-bold mb-1 ${userType === "local" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Local
            </div>
            <div className={`text-xs md:text-sm ${userType === "local" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Not Traveling Now
            </div>
          </button>

          {/* Traveler */}
          <button
            onClick={() => handleUserTypeClick("traveler")}
            type="button"
            className={`w-full cursor-pointer rounded-lg p-3.5 text-center transition-all border-2 border-l-4 ${
              userType === "traveler" 
                ? "border-orange-600 border-l-orange-600 bg-orange-50 dark:bg-orange-900 dark:border-orange-400 dark:border-l-orange-400 shadow-xl scale-[1.02] ring-2 ring-orange-200 dark:ring-orange-800" 
                : "border-gray-300 dark:border-gray-600 border-l-orange-500 dark:border-l-orange-400 hover:border-orange-400 dark:hover:border-orange-500 bg-orange-50/30 dark:bg-orange-900/20 hover:shadow-lg"
            }`}
            data-testid="button-select-traveler"
          >
            <div className={`text-base md:text-lg font-bold mb-1 ${userType === "traveler" ? "text-orange-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Traveler
            </div>
            <div className={`text-xs md:text-sm ${userType === "traveler" ? "text-orange-700 dark:text-orange-100" : "text-gray-600 dark:text-gray-400"}`}>
              Currently Traveling
            </div>
          </button>

          {/* Business */}
          <button
            onClick={() => handleUserTypeClick("business")}
            type="button"
            className={`w-full cursor-pointer rounded-lg p-3.5 text-center transition-all border-2 border-l-4 ${
              userType === "business" 
                ? "border-teal-600 border-l-teal-600 bg-teal-50 dark:bg-teal-900 dark:border-teal-400 dark:border-l-teal-400 shadow-xl scale-[1.02] ring-2 ring-teal-200 dark:ring-teal-800" 
                : "border-gray-300 dark:border-gray-600 border-l-teal-500 dark:border-l-teal-400 hover:border-teal-400 dark:hover:border-teal-500 bg-teal-50/30 dark:bg-teal-900/20 hover:shadow-lg"
            }`}
            data-testid="button-select-business"
          >
            <div className={`text-base md:text-lg font-bold mb-1 ${userType === "business" ? "text-teal-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Business
            </div>
            <div className={`text-xs md:text-sm ${userType === "business" ? "text-teal-700 dark:text-teal-100" : "text-gray-600 dark:text-gray-400"}`}>
              Local Business Owner
            </div>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={handleContinue}
          type="button"
          className={`w-full py-2.5 text-base font-medium border-2 transition-all ${
            userType 
              ? "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white border-orange-600 dark:border-orange-500 shadow-lg scale-[1.02] animate-pulse" 
              : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed"
          }`}
          data-testid="button-continue"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
