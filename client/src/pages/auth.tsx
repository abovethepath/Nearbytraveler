import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import { ArrowLeft } from "lucide-react";


export default function Auth() {
  const [, setLocation] = useLocation();

  const isSignupPage = window.location.pathname === '/signup' || window.location.pathname === '/join';

  const handleReplitLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%), url('/hero-image-7.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-2xl">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center pb-8 relative">
            <button
              onClick={() => setLocation('/')}
              className="absolute left-4 top-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="flex justify-center mb-6">
              <Logo variant="header" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              {isSignupPage ? 'Join Nearby Traveler' : 'Welcome Back'}
            </CardTitle>
            {isSignupPage && (
              <p className="text-lg text-gray-600 mt-2">
                Connect with travelers and locals worldwide
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isSignupPage ? (
              <JoinNowWidgetNew />
            ) : (
              <div className="space-y-6">
                <Button
                  onClick={handleReplitLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-6 text-lg font-semibold shadow-lg"
                  data-testid="button-replit-login"
                >
                  Sign In with Replit
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setLocation('/signup')}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                      data-testid="link-signup"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
