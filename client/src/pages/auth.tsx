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
// Background image handled via direct path in CSS


export default function Auth() {
  console.log('🟢 AUTH PAGE IS LOADING - URL:', window.location.pathname);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Check URL for signup mode - /join should show signup, /auth should show login
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const isJoinPage = window.location.pathname === '/join';
  const [isLogin, setIsLogin] = useState(!isJoinPage && mode !== 'register');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('handleLogin called with email:', email, 'password length:', password?.length);
    if (!email || !password) {
      console.log('Missing email or password');
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting login request...');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      console.log('Login response status:', response.status);
      if (response.ok) {
        const user = await response.json();
        console.log('Login successful:', user.username);

        // Store the actual user object from the response
        authStorage.setUser(user.user);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries();

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });

        // Redirect users to appropriate welcome page based on user type
        console.log('Login response user object:', user);
        if (user?.userType === 'business' || user?.user?.userType === 'business') {
          console.log('Redirecting business user to business welcome page');
          window.location.href = "/welcome-business";
        } else {
          console.log('Redirecting to traveler/local welcome page');
          window.location.href = "/welcome";
        }
        return;
      } else {
        const error = await response.json();
        console.log('Login error:', error);
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Connection error",
        description: "Unable to connect to server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          .join-page-gradient-button, .login-page-gradient-button {
            background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%) !important;
            color: #000000 !important;
            border: none !important;
          }
          .join-page-gradient-button:disabled, .login-page-gradient-button:disabled {
            background: #9ca3af !important;
            color: #ffffff !important;
          }
          .join-page-background, .login-page-background {
            background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%), url('/assets/travelers-map.webp') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
          }
          .auth-page-card {
            border: 3px solid rgba(59, 130, 246, 0.3) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
          }
        `}
      </style>
      <div className={`${!isLogin ? 'join-page-background' : 'login-page-background'} min-h-screen flex flex-col items-center justify-center p-4 relative`}>
      {/* Overlay to maintain readability */}
      <div className="absolute inset-0 bg-white/10 dark:bg-gray-900/20"></div>
      <div className="w-full max-w-md relative z-10">
        <Card className="auth-page-card shadow-2xl border-4 border-blue-500/50 bg-white/80 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </Button>
            </div>
            <div className="flex justify-center mb-2">
              <div className="scale-125">
                <Logo variant="landing" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Welcome Back" : "Join Nearby Traveler"}
            </CardTitle>
            {!isLogin && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                Start Connecting with Nearby Locals and Nearby Travelers Today Based on Common Interests and Demographics
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isLogin ? (
              <JoinNowWidgetNew />
            ) : (
              <>
                {/* Login Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail" className="text-gray-900 dark:text-white">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword" className="text-gray-900 dark:text-white">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <div
                    onClick={(!isLoading && email && password) ? handleLogin : undefined}
                    className={`login-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none ${
                      (!isLoading && email && password) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                    style={{
                      pointerEvents: (!isLoading && email && password) ? 'auto' : 'none'
                    }}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </div>


                </div>

                <div className="text-center space-y-2">
                  <button
                    onClick={() => setLocation('/forgot-password')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Create Account" : "Already have an account? Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}