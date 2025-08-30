import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

export default function ComingSoon() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900 dark:to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-8 shadow-xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-center">
          <Logo className="w-16 h-16 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            We're putting the finishing touches on Nearby Traveler to make sure everything is perfect for you.
            <br/><br/>
            Check back soon - we'll be live shortly!
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setLocation('/')}
              className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold"
            >
              Back to Landing Page
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🚀 Launch preparations in progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}