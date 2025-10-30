import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import QRCodeCard from "@/components/QRCodeCard";
import { useTheme } from "@/components/theme-provider";

export default function ShareQR() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button and Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/profile')}
              className="mr-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invite Friends</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            data-testid="button-theme-toggle"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* QR Code Card */}
        <QRCodeCard />

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Share your QR code or link with friends</li>
            <li>• They'll sign up and automatically connect with you</li>
            <li>• You get credit for the referral</li>
            <li>• Start exploring and planning together!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}