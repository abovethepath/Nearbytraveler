import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { isNativeIOSApp } from "@/lib/nativeApp";

export default function SupportSuccess() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/stripe/support/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">💛</div>
        <h1 className="text-3xl font-bold text-black dark:text-white mb-3">Thank You!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2 text-lg">
          Your support means everything to us.
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Your supporter badge will appear on your profile shortly. It may take a moment to update.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation(isNativeIOSApp() ? "/home" : "/")}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 font-semibold px-8"
            style={{ transition: "none" }}
          >
            Back to Home
          </Button>
          <Button
            onClick={() => setLocation("/donate")}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            style={{ transition: "none" }}
          >
            View Support Plans
          </Button>
        </div>
      </div>
    </div>
  );
}
