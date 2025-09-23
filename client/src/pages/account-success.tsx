import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Users, MessageCircle, MapPin, User } from 'lucide-react';
import { useAuth } from '@/App';

export default function AccountSuccess() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Trigger bootstrap operations silently in background when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Silent background bootstrap - no UI changes
      fetch('/api/bootstrap/after-register', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }).catch(error => console.error('Background bootstrap error:', error));
    }
  }, [isAuthenticated, user]);

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
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome to Nearby Traveler!
            </CardTitle>
            
            <div className="text-lg text-gray-700 dark:text-gray-300">
              Your account has been created successfully.
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You're now part of a community that connects travelers and locals worldwide. Complete your profile to start making connections!
              </p>
            </div>

            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-bold py-3 text-lg"
              data-testid="button-continue-welcome"
            >
              Complete Your Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}