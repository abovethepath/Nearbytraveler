import { useLocation } from "wouter";
import { Label } from "@/components/ui/label";

export default function JoinNowWidgetNew() {
  const [, setLocation] = useLocation();

  const handleUserTypeClick = (type: string) => {
    console.log('🔥 JOIN WIDGET: User type clicked:', type);
    console.log('✅ JOIN WIDGET: Storing userType in sessionStorage:', type);
    sessionStorage.setItem('selectedUserType', type);
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
            className="w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            data-testid="button-select-local"
          >
            <div className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Nearby Local
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Not Traveling Now
            </div>
          </button>

          {/* Traveler */}
          <button
            onClick={() => handleUserTypeClick("traveler")}
            type="button"
            className="w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            data-testid="button-select-traveler"
          >
            <div className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Nearby Traveler
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Currently Traveling
            </div>
          </button>

          {/* Business */}
          <button
            onClick={() => handleUserTypeClick("business")}
            type="button"
            className="w-full cursor-pointer rounded-xl p-6 text-center transition-all shadow-md border-4 border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:shadow-xl"
            data-testid="button-select-business"
          >
            <div className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Nearby Business
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Local Business Owner
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
