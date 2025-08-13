import { useEffect, useState, useContext } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { apiRequest } from '@/lib/queryClient';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookAuthProps {
  onLogin?: (response: any) => void;
  onError?: (error: any) => void;
  type?: 'login' | 'signup';
  className?: string;
}

export function FacebookAuth({ onLogin, onError, type = 'login', className = '' }: FacebookAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);
  const { login } = useContext(AuthContext);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if Facebook SDK is already loaded
    if (window.FB && typeof window.FB.init === 'function') {
      setFbLoaded(true);
      return;
    }

    // Define the callback for when Facebook SDK loads
    window.fbAsyncInit = function() {
      try {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || '1234567890123456', // Default test app ID
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        
        // Wait for SDK to be ready
        window.FB.AppEvents.logPageView();
        setFbLoaded(true);
        console.log('Facebook SDK initialized successfully');
      } catch (error) {
        console.error('Facebook SDK initialization error:', error);
        setFbLoaded(false);
      }
    };

    // Load the Facebook SDK script if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.onload = () => {
        console.log('Facebook SDK script loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Facebook SDK script');
        setFbLoaded(false);
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB || !fbLoaded) {
      toast({
        title: "Facebook SDK Not Ready",
        description: "Please wait a moment and try again, or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          // Get user info from Facebook
          window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo: any) => {
            try {
              const facebookData = {
                facebookId: response.authResponse.userID,
                accessToken: response.authResponse.accessToken,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture?.data?.url
              };

              if (type === 'login') {
                // Try to authenticate existing user
                const authResponse = await apiRequest('POST', '/api/auth/facebook', facebookData);
                
                if (authResponse.ok) {
                  const result = await authResponse.json();
                  
                  // Update authentication context
                  login(result.user, result.token);
                  
                  toast({
                    title: "Welcome back!",
                    description: `Logged in as ${result.user.name}`,
                  });
                  
                  if (onLogin) {
                    onLogin(result);
                  } else {
                    setLocation('/home');
                  }
                } else {
                  const error = await authResponse.json();
                  throw new Error(error.message || 'Authentication failed');
                }
              } else {
                // Handle signup flow - pass data to parent component
                if (onLogin) {
                  onLogin(facebookData);
                } else {
                  toast({
                    title: "Account Setup",
                    description: "Please complete your profile setup.",
                  });
                  setLocation('/signup/local');
                }
              }
            } catch (error: any) {
              console.error('Facebook authentication error:', error);
              toast({
                title: "Authentication Failed",
                description: error.message || "Failed to authenticate with Facebook. Please try again.",
                variant: "destructive",
              });
              
              if (onError) {
                onError(error);
              }
            } finally {
              setIsLoading(false);
            }
          });
        } else {
          // User canceled login
          const errorMessage = response.error || 'Login cancelled by user';
          console.log('Facebook login cancelled or failed:', errorMessage);
          
          if (response.error) {
            toast({
              title: "Login Failed",
              description: "Facebook login was unsuccessful. Please try again.",
              variant: "destructive",
            });
            
            if (onError) {
              onError(errorMessage);
            }
          }
          // Don't show error for user cancellation
          setIsLoading(false);
        }
      }, { scope: 'email,public_profile' });
    } catch (error: any) {
      setIsLoading(false);
      console.error('Facebook login error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Facebook login. Please try again.",
        variant: "destructive",
      });
      
      if (onError) {
        onError(error);
      }
    }
  };

  const buttonText = type === 'login' ? 'Continue with Facebook' : 'Sign up with Facebook';

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={isLoading || !fbLoaded}
      className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : (
        <>
          <FaFacebook className="w-5 h-5 mr-2" />
          {buttonText}
        </>
      )}
    </button>
  );
}