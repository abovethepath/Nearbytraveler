import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users } from "lucide-react";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/App";
import { useLocation, Link } from "wouter";
import { isNativeIOSApp } from "@/lib/nativeApp";

export default function Welcome() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.userType === 'business') {
      setLocation('/welcome-business');
    }
  }, [user, setLocation]);

  const handleEnterApp = async () => {
    if (user?.id) {
      setLocation(`/profile/${user.id}`);
    } else {
      setLocation('/profile');
    }
  };

  const isIOS = isNativeIOSApp();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 ${isIOS ? 'pb-24' : ''}`}>
      <div className={`container mx-auto px-4 ${isIOS ? 'pt-4 pb-8' : 'py-12'}`}>
        <div className={`text-center ${isIOS ? 'mb-6' : 'mb-12'}`}>
          <div className={`inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-orange-500 rounded-full ${isIOS ? 'w-14 h-14 mb-4' : 'w-16 h-16 mb-6'}`}>
            <CheckCircle className={`text-white ${isIOS ? 'w-7 h-7' : 'w-8 h-8'}`} />
          </div>
          <h1 className={`font-bold text-gray-900 dark:text-white mb-3 ${isIOS ? 'text-2xl' : 'text-3xl md:text-4xl mb-4'}`}>
            Account Created Successfully!
          </h1>
          <p className={`text-gray-600 dark:text-gray-300 max-w-2xl mx-auto ${isIOS ? 'text-base mb-4' : 'text-lg mb-8'}`}>
            We kept signup simple by focusing on the essentials. You can add the rest of your details inside the app.
          </p>
        </div>

        <div className={`max-w-4xl mx-auto grid gap-4 ${isIOS ? 'grid-cols-1 mb-6' : 'md:grid-cols-2 gap-8 mb-12'}`}>
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-3 text-green-700 dark:text-green-400 ${isIOS ? 'text-base' : ''}`}>
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                What You've Already Set
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  Account credentials & username
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  Age and date of birth
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  Hometown location
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  At least 3 top interests for matching
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-3 text-blue-700 dark:text-blue-400 ${isIOS ? 'text-base' : ''}`}>
                <Users className="h-5 w-5 flex-shrink-0" />
                Complete When Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  Profile photo & bio
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  Gender & preferences
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  Activities & events you enjoy
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  Languages you speak
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  Additional travel plans
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-md mx-auto border-0 shadow-lg bg-gradient-to-r from-blue-500 to-orange-500">
            <CardContent className={isIOS ? 'p-6' : 'p-8'}>
              <h3 className={`font-bold text-white ${isIOS ? 'text-xl mb-3' : 'text-2xl mb-4'}`}>
                Ready to Connect?
              </h3>
              <p className="text-white/90 mb-5 text-sm">
                Complete your profile to start meeting locals and travelers in your area
              </p>
              <Button 
                onClick={handleEnterApp}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 w-full text-lg font-semibold shadow-lg transition-colors duration-200"
                data-testid="button-enter-app"
              >
                Complete My Profile
              </Button>
            </CardContent>
          </Card>

          {!isIOS && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              Need help? Check out our{" "}
              <Link href="/getting-started">
                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Getting Started Guide
                </span>
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}