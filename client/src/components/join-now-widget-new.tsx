import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function JoinNowWidgetNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");

  const handleUserTypeSelection = () => {
    console.log('🔥 JOIN WIDGET: Button clicked, userType:', userType);
    
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
    <div className="space-y-4">
      {/* Step 1: User Type Selection - 2 Types */}
      <div className="space-y-2">
        <Label className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">I am a...</Label>
        <div className="space-y-2">
          {/* Local */}
          <div
            onClick={() => setUserType("local")}
            className={`cursor-pointer border-3 rounded-lg p-4 text-center transition-all ${
              userType === "local" 
                ? "border-blue-600 bg-blue-100 dark:bg-blue-600 dark:border-blue-400 shadow-lg scale-105" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
            }`}
            data-testid="button-select-local"
          >
            <div className={`text-sm font-medium ${userType === "local" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Local
            </div>
            <div className={`text-xs ${userType === "local" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Not Traveling Now
            </div>
          </div>

          {/* Traveler */}
          <div
            onClick={() => setUserType("traveler")}
            className={`cursor-pointer border-3 rounded-lg p-4 text-center transition-all ${
              userType === "traveler" 
                ? "border-blue-600 bg-blue-100 dark:bg-blue-600 dark:border-blue-400 shadow-lg scale-105" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
            }`}
            data-testid="button-select-traveler"
          >
            <div className={`text-sm font-medium ${userType === "traveler" ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
              Nearby Traveler
            </div>
            <div className={`text-xs ${userType === "traveler" ? "text-blue-700 dark:text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
              Currently Traveling
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleUserTypeSelection}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 text-base font-medium border-2 border-blue-600 dark:border-blue-500"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}