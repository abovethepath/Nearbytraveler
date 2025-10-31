import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import { ArrowLeft } from "lucide-react";
// Background image handled via direct path in CSS


export default function Auth() {
  console.log('🟢 AUTH PAGE IS LOADING - URL:', window.location.pathname);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if we're on the join page or signup page or in register mode
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const isSignupPage = window.location.pathname === '/signup' || window.location.pathname === '/join';
  const [isLogin, setIsLogin] = useState(mode === 'register' ? false : !isSignupPage);
  
  console.log('🔍 AUTH DEBUG - URL:', window.location.pathname, 'mode:', mode, 'isSignupPage:', isSignupPage, 'isLogin:', isLogin);
  
  // Login form fields
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('handleLogin called with email:', formData.email, 'password length:', formData.password?.length);
    if (!formData.email || !formData.password) {
      console.log('Missing email or password');
      toast({
        title: "Missing fields",
        description: "Please enter email/username and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting login request...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.toLowerCase().trim(), password: formData.password }),
      });

      console.log('Login response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Login response data:', data);
        
        // Check if login was successful (backend returns {ok: true, user: {...}})
        if (data.ok && data.user) {
          // Store auth data
          authStorage.setUser(data.user);
          localStorage.setItem('auth_token', 'authenticated');
          localStorage.setItem('current_user', JSON.stringify(data.user));
          
          // Invalidate auth queries to refresh user state
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          
          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });
          
          // Redirect to home
          setLocation('/');
        } else {
          // Backend returned an error in JSON format
          console.log('Login failed with response:', data);
          toast({
            title: "Login failed",
            description: data.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Non-200 response
        let errorMessage = "Invalid credentials";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, try text
          errorMessage = await response.text() || errorMessage;
        }
        console.log('Login failed with error:', errorMessage);
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            {/* Back Button */}
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
              {isLogin ? 'Welcome Back' : 'Join Nearby Traveler'}
            </CardTitle>
            {!isLogin && (
              <p className="text-lg text-gray-600 mt-2">
                Connect with travelers and locals worldwide
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isSignupPage && !isLogin ? (
              <JoinNowWidgetNew />
            ) : isLogin ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail" className="text-base font-medium text-gray-900">Email or Username</Label>
                    <Input
                      id="loginEmail"
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email or username"
                      className="text-base py-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword" className="text-base font-medium text-gray-900">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="text-base py-3"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !formData.email || !formData.password}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
                
                <div className="text-center">
                  <button
                    onClick={() => window.location.href = '/forgot-password'}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            ) : null}

            {!isSignupPage && (
              <div className="text-center pt-4">
                {isLogin && (
                  <button
                    onClick={() => window.location.href = '/signup'}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Need an account? Sign up
                  </button>
                )}
              </div>
            )}
            
            {isSignupPage && !isLogin && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Already have an account? Sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}