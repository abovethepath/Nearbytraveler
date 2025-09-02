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
    if (!userType) {
      toast({
        title: "Please select your type",
        description: "Choose whether you're a local/traveler or business.",
        variant: "destructive",
      });
      return;
    }
    
    // Store user type and redirect to account creation
    sessionStorage.setItem('selectedUserType', userType);
    setLocation('/signup/account');
  };

  return (
    <div className="space-y-4">
      {/* Step 1: User Type Selection - 3 Boxes */}
      <div className="space-y-2">
        <Label className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">I am a...</Label>
        <div className="space-y-2">
          {/* Local Box */}
          <div
            onClick={() => setUserType("local")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "local" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Nearby Local
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Not Traveling Now
            </div>
          </div>

          {/* Traveler Box */}
          <div
            onClick={() => setUserType("currently_traveling")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "currently_traveling" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Nearby Traveler
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              On a Trip Now
            </div>
          </div>

          {/* Business Box */}
          <div
            onClick={() => setUserType("business")}
            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
              userType === "business" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Nearby Business
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Local Business
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleUserTypeSelection}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}