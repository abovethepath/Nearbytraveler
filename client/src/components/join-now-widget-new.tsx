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
    <div className="space-y-6">
      {/* User Type Selection - 3 Types */}
      <div className="space-y-4">
        <Label className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">I am a...</Label>
        <div className="space-y-4">
          {/* Local */}
          <button
            onClick={() => handleUserTypeClick("local")}
            type="button"
            className={`w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 ${
              userType === "local" 
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 shadow-2xl scale-105 ring-4 ring-blue-200 dark:ring-blue-800" 
                : "border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            }`}
            data-testid="button-select-local"
          >
            <div className={`text-xl md:text-2xl font-bold mb-2 ${userType === "local" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Local
            </div>
            <div className={`text-sm md:text-base ${userType === "local" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Not Traveling Now
            </div>
          </button>

          {/* Traveler */}
          <button
            onClick={() => handleUserTypeClick("traveler")}
            type="button"
            className={`w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 ${
              userType === "traveler" 
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 shadow-2xl scale-105 ring-4 ring-blue-200 dark:ring-blue-800" 
                : "border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            }`}
            data-testid="button-select-traveler"
          >
            <div className={`text-xl md:text-2xl font-bold mb-2 ${userType === "traveler" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Traveler
            </div>
            <div className={`text-sm md:text-base ${userType === "traveler" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Currently Traveling
            </div>
          </button>

          {/* Business */}
          <button
            onClick={() => handleUserTypeClick("business")}
            type="button"
            className={`w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 ${
              userType === "business" 
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 shadow-2xl scale-105 ring-4 ring-blue-200 dark:ring-blue-800" 
                : "border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            }`}
            data-testid="button-select-business"
          >
            <div className={`text-xl md:text-2xl font-bold mb-2 ${userType === "business" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Business
            </div>
            <div className={`text-sm md:text-base ${userType === "business" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Local Business Owner
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleContinue}
          type="button"
          className={`w-full py-3 text-base font-medium border-2 transition-all ${
            userType 
              ? "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white border-orange-600 dark:border-orange-500 shadow-xl scale-105 animate-pulse" 
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
