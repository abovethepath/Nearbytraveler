import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Loader2, Users, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/App';

interface BootstrapStatus {
  status: 'pending' | 'completed' | 'error';
  progress: number;
  message: string;
}

export default function AccountSuccess() {
  const [, setLocation] = useLocation();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({ 
    status: 'pending', 
    progress: 0, 
    message: 'Starting setup...' 
  });
  const [bootstrapTriggered, setBootstrapTriggered] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Timer for seconds elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger bootstrap operations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !bootstrapTriggered) {
      console.log('🚀 BOOTSTRAP: Triggering background setup operations');
      setBootstrapTriggered(true);
      triggerBootstrap();
    }
  }, [isAuthenticated, user, bootstrapTriggered]);

  // Poll bootstrap status
  useEffect(() => {
    if (!bootstrapTriggered) return;

    const statusChecker = setInterval(async () => {
      try {
        const response = await fetch('/api/bootstrap/status', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const status: BootstrapStatus = await response.json();
          setBootstrapStatus(status);
          
          if (status.status === 'completed') {
            console.log('✅ Bootstrap completed');
            clearInterval(statusChecker);
          }
        }
      } catch (error) {
        console.error('Error checking bootstrap status:', error);
      }
    }, 1000);

    return () => clearInterval(statusChecker);
  }, [bootstrapTriggered]);

  const triggerBootstrap = async () => {
    try {
      console.log('🔄 BOOTSTRAP: Starting background operations...');
      setBootstrapStatus({ status: 'pending', progress: 25, message: 'Setting up your personalized experience...' });
      
      const response = await fetch('/api/bootstrap/after-register', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pending') {
          console.log('✅ BOOTSTRAP: Background operations started successfully');
          setBootstrapStatus({ status: 'pending', progress: 50, message: 'Creating chatrooms and setting up connections...' });
        }
      }
    } catch (error) {
      console.error('Bootstrap trigger error:', error);
      setBootstrapStatus({ status: 'error', progress: 0, message: 'Setup encountered an issue - redirecting anyway...' });
    }
  };

  const handleContinue = () => {
    window.location.href = '/';
  };

  // Check if profile is ready (user data is loaded and bootstrap has started)
  const isProfileReady = isAuthenticated && user && bootstrapTriggered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto">
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
            {/* What you can do */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">What You Can Do:</h3>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Connect with Locals & Travelers</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find people who share your interests and activities</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Join City Chatrooms</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meet locals and travelers in real-time conversations</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Discover Events & Meetups</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find activities and create authentic experiences</p>
                </div>
              </div>
            </div>

            {/* Loading status */}
            {!isProfileReady && (
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Getting your profile ready...</span>
              </div>
            )}

            {/* Continue button - turns orange when ready */}
            <Button
              onClick={handleContinue}
              disabled={!isProfileReady}
              className={`w-full font-bold py-3 text-lg transition-colors ${
                isProfileReady
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              data-testid="button-continue-welcome"
            >
              {isProfileReady ? 'Continue to Your Profile →' : 'Preparing Your Profile...'}
            </Button>

            {isProfileReady && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                ✓ Your profile is ready! Click above to complete it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}