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
    
    // Handle "New to Town" as a local user with special flag
    if (userType === "newtotown") {
      sessionStorage.setItem('selectedUserType', 'local');
      sessionStorage.setItem('isNewToTown', 'true');
    } else {
      sessionStorage.setItem('selectedUserType', userType);
      sessionStorage.removeItem('isNewToTown');
    }
    
    console.log('🚀 JOIN WIDGET: Navigating to /signup/account');
    setLocation('/signup/account');
  };

  return (
    <div className="space-y-4">
      {/* Step 1: User Type Selection - 3 Types */}
      <div className="space-y-2">
        <Label className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">I am a...</Label>
        <div className="space-y-2">
          {/* Local */}
          <div
            onClick={() => setUserType("local")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "local" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700/50"
            }`}
            data-testid="button-select-local"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Nearby Local
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Not Traveling Now
            </div>
          </div>

          {/* New to Town */}
          <div
            onClick={() => setUserType("newtotown")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "newtotown" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700/50"
            }`}
            data-testid="button-select-newtotown"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              New to Town
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Recently Moved Here
            </div>
          </div>

          {/* Traveler */}
          <div
            onClick={() => setUserType("traveler")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "traveler" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700/50"
            }`}
            data-testid="button-select-traveler"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Nearby Traveler
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
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