import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Loader2, Clock, Mail, User, Settings, AlertCircle, Users, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/App';
import { apiRequest } from '@/lib/queryClient';

interface BootstrapStatus {
  status: 'pending' | 'completed' | 'error';
  progress: number;
  message: string;
}

export default function AccountSuccess() {
  const [, setLocation] = useLocation();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({ status: 'pending', progress: 0, message: 'Starting setup...' });
  const [bootstrapTriggered, setBootstrapTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Trigger bootstrap operations once user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !bootstrapTriggered) {
      console.log('🚀 BOOTSTRAP: Triggering background setup operations');
      setBootstrapTriggered(true);
      triggerBootstrap();
    }
  }, [isAuthenticated, user, bootstrapTriggered]);

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
            console.log('✅ Bootstrap completed - redirecting to home');
            clearInterval(statusChecker);
            // Small delay to show completion state
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Error checking bootstrap status:', error);
      }
    }, 1000);

    // Minimum 10-second welcome screen, then redirect regardless
    const minTimeout = setTimeout(() => {
      console.log('⏰ Minimum 10 seconds elapsed - redirecting to home');
      clearInterval(statusChecker);
      window.location.href = '/';
    }, 10000);

    return () => {
      clearInterval(statusChecker);
      clearTimeout(minTimeout);
    };
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
      // Still redirect after delay even if bootstrap fails
      setTimeout(() => window.location.href = '/', 3000);
    }
  };

  const handleContinue = () => {
    // Force reload authentication state before redirect
    window.location.href = '/';
  };

  const getProgressIcon = () => {
    if (bootstrapStatus.status === 'completed') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (bootstrapStatus.status === 'error') return <AlertCircle className="w-6 h-6 text-red-500" />;
    return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-2 border-green-200 dark:border-green-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center bg-green-50 dark:bg-green-900/20 rounded-t-lg pb-8">
            <div className="flex justify-center mb-4">
              {bootstrapStatus.status === 'completed' ? (
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              ) : bootstrapStatus.status === 'error' ? (
                <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              ) : (
                <div className="relative">
                  <Users className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                  <Loader2 className="w-6 h-6 text-orange-600 dark:text-orange-400 absolute top-5 left-5 animate-spin" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {bootstrapStatus.status === 'completed' ? 'Welcome to Nearby!' : bootstrapStatus.status === 'error' ? 'Account Setup Issue' : 'Setting Up Your Experience...'}
            </CardTitle>
            
            <div className="text-lg text-gray-700 dark:text-gray-300">
              {bootstrapStatus.status === 'completed' ? (
                "Your personalized travel and local experience is ready!"
              ) : bootstrapStatus.status === 'error' ? (
                "There was an issue with the setup process."
              ) : (
                "We're setting up your chatrooms, connections, and personalized recommendations."
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {bootstrapStatus.status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                    {bootstrapStatus.message}
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

            {bootstrapStatus.status === 'pending' && (
              <div className="space-y-4">
                <div className="text-center text-gray-600 dark:text-gray-400">
                  <p className="mb-2">{bootstrapStatus.message} ({secondsElapsed}s)</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${bootstrapStatus.progress}%` }}
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
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span>Creating city chatrooms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Setting up connections</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>Generating city content</span>
                  </div>
                </div>

              </div>
            )}

            {bootstrapStatus.status === 'completed' && (
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

            {bootstrapStatus.status === 'pending' && secondsElapsed > 8 && (
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