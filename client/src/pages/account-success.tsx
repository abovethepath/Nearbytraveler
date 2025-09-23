import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Loader2, Clock, Mail, User, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/App';

export default function AccountSuccess() {
  const [, setLocation] = useLocation();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [accountReady, setAccountReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    // Check if account is ready every 0.5 seconds (faster for streamlined registration)
    const checker = setInterval(async () => {
      // Check ALL possible storage locations for user data
      const storageKeys = ['travelconnect_user', 'user', 'currentUser', 'authUser'];
      let foundUser = null;
      
      for (const key of storageKeys) {
        const stored = localStorage.getItem(key);
        if (stored && stored !== 'null' && stored !== 'undefined') {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id && parsed.username) {
              foundUser = parsed;
              break;
            }
          } catch (e) {}
        }
      }
      
      if (foundUser || (isAuthenticated && user)) {
        console.log('✅ Account ready - redirecting to home');
        setAccountReady(true);
        clearInterval(checker);
        console.log('✅ Account ready - forcing page refresh to home');
        // Force complete page refresh to ensure authentication state is loaded
        window.location.href = '/';
      }
    }, 500);

    // Early error detection - check after 10 seconds if still not authenticated
    const earlyCheck = setTimeout(() => {
      if (!accountReady && !isAuthenticated) {
        console.log("⚠️ Account creation taking longer than expected...");
      }
    }, 10000);

    // Timeout after 3 minutes - something went wrong
    const timeout = setTimeout(() => {
      if (!accountReady && !isAuthenticated) {
        setError("Account creation is taking longer than expected. This might be due to an email that's already registered or a network issue.");
        clearInterval(checker);
      }
    }, 180000);

    return () => {
      clearInterval(timer);
      clearInterval(checker);
      clearTimeout(earlyCheck);
      clearTimeout(timeout);
    };
  }, [isAuthenticated, user, accountReady]);

  const handleContinue = () => {
    // Force reload authentication state before redirect
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-2 border-green-200 dark:border-green-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center bg-green-50 dark:bg-green-900/20 rounded-t-lg pb-8">
            <div className="flex justify-center mb-4">
              {accountReady ? (
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              ) : error ? (
                <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              ) : (
                <div className="relative">
                  <Clock className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                  <Loader2 className="w-6 h-6 text-orange-600 dark:text-orange-400 absolute top-5 left-5 animate-spin" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {accountReady ? 'Account Created!' : error ? 'Account Creation Issue' : 'Setting Up Your Account...'}
            </CardTitle>
            
            <div className="text-lg text-gray-700 dark:text-gray-300">
              {accountReady ? (
                "Your Nearby account is ready to go!"
              ) : error ? (
                "There was an issue creating your account."
              ) : (
                "We're creating your personalized profile and setting up your account."
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                    {error}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation('/signin')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Try Signing In
                    </Button>
                    <Button
                      onClick={() => setLocation('/join')}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Use Different Email
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!accountReady && !error && (
              <div className="space-y-4">
                <div className="text-center text-gray-600 dark:text-gray-400">
                  <p className="mb-2">Creating your account... ({secondsElapsed}s)</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((secondsElapsed / 120) * 100, 90)}%` }}
                    ></div>
                  </div>
                  
                  {secondsElapsed > 30 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      Still working... We're setting up your personalized city content and recommendations.
                    </p>
                  )}
                </div>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Setting up your profile</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Generating personalized recommendations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>Preparing welcome email</span>
                  </div>
                </div>

              </div>
            )}

            {accountReady && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Welcome to Nearby! Your account is ready and you can start connecting with others.
                  </p>
                </div>

                <Button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-bold py-3 text-lg"
                >
                  Start Exploring
                </Button>
              </div>
            )}

            {!accountReady && !error && secondsElapsed > 60 && (
              <div className="mt-6">
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                >
                  Continue (Account still setting up in background)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}