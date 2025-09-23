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