import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";
import { isNativeIOSApp } from "@/lib/nativeApp";
import JoinNowWidgetNew from "@/components/join-now-widget-new";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/App";
// Background image handled via direct path in CSS


export default function Auth() {
  console.log('🟢 AUTH PAGE IS LOADING - URL:', window.location.pathname);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, startAuthenticating, stopAuthenticating } = useAuth();

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
  const [showPassword, setShowPassword] = useState(false);

  // Forgot username state
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState("");
  const [forgotUsernameSent, setForgotUsernameSent] = useState(false);
  const [forgotUsernameLoading, setForgotUsernameLoading] = useState(false);

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

    // Prevent landing-page flashes during the post-login auth hydration window.
    startAuthenticating();
    setIsLoading(true);
    console.log('Starting login request...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email.toLowerCase().trim(), password: formData.password }),
      });

      console.log('Login response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Login response data:', data);
        
        // Check if login was successful (backend returns {ok: true, user: {...}})
        if (data.ok && data.user) {
          // CRITICAL: Clear ALL old user data first to prevent stale data contamination
          authStorage.clearUser();
          localStorage.removeItem('current_user');
          localStorage.removeItem('auth_token');
          
          let fullUser = data.user;
          try {
            const fullUserRes = await fetch('/api/auth/user', { credentials: 'include' });
            if (fullUserRes.ok) {
              fullUser = await fullUserRes.json();
            } else {
              const byIdRes = await fetch(`/api/users/${data.user.id}`, { credentials: 'include' });
              if (byIdRes.ok) {
                fullUser = await byIdRes.json();
              }
            }
          } catch {
          }

          // Update global auth state immediately (avoids async auth lag + route flashes).
          if (fullUser && fullUser.id) {
            login(fullUser);
          }
          
          // Invalidate auth queries to refresh user state
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          
          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });
          
          // Redirect directly to the authenticated home route (avoid rendering landing at "/").
          setLocation('/home');
        } else {
          // Backend returned an error in JSON format
          console.log('Login failed with response:', data);
          stopAuthenticating();
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
        stopAuthenticating();
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      stopAuthenticating();
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    void handleLogin();
  };

  const handleForgotUsername = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotUsernameEmail.trim() || forgotUsernameLoading) return;
    setForgotUsernameLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-username", { email: forgotUsernameEmail.trim().toLowerCase() });
      setForgotUsernameSent(true);
    } catch {
      setForgotUsernameSent(true); // Always show success to avoid email enumeration
    } finally {
      setForgotUsernameLoading(false);
    }
  };


  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-950"
    >
      <div className="w-full max-w-2xl">
        <Card className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border dark:border-gray-800">
          <CardHeader className="text-center pb-8 relative overflow-visible">
            {/* Back Button */}
            <button
              onClick={() => setLocation(isNativeIOSApp() ? '/home' : '/')}
              className="absolute left-4 top-4 flex items-center gap-2 transition-colors group bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md z-50"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-gray-800 dark:text-gray-200" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Back</span>
            </button>
            
            <div className="flex justify-center mb-6">
              <Logo variant="auth" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Join'}
            </CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Connect with travelers and locals worldwide
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSignupPage && !isLogin ? (
              <JoinNowWidgetNew />
            ) : isLogin ? (
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail" className="text-base font-medium text-gray-900 dark:text-gray-100">Email or Username</Label>
                    <Input
                      id="loginEmail"
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email or username"
                      className="text-base py-3 border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      data-testid="input-login-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword" className="text-base font-medium text-gray-900 dark:text-gray-100">Password</Label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        className="text-base py-3 pr-10 border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                        data-testid="toggle-login-password-visibility"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  disabled={isLoading || !formData.email || !formData.password}
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
                  data-testid="button-login-submit"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : null}

            {isLogin && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => window.location.href = '/forgot-password'}
                    className="text-sm font-medium underline text-blue-600 dark:text-blue-400"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <button
                    onClick={() => { setShowForgotUsername(!showForgotUsername); setForgotUsernameSent(false); setForgotUsernameEmail(""); }}
                    className="text-sm font-medium underline text-blue-600 dark:text-blue-400"
                    data-testid="link-forgot-username"
                  >
                    Forgot username?
                  </button>
                </div>

                {showForgotUsername && (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    {forgotUsernameSent ? (
                      <p className="text-sm text-center text-green-600 dark:text-green-400 font-medium">
                        We sent your username to that email address.
                      </p>
                    ) : (
                      <form onSubmit={handleForgotUsername} className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enter your email and we'll remind you of your username.</p>
                        <Input
                          type="email"
                          placeholder="Your email address"
                          value={forgotUsernameEmail}
                          onChange={(e) => setForgotUsernameEmail(e.target.value)}
                          className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          required
                        />
                        <Button
                          type="submit"
                          disabled={forgotUsernameLoading || !forgotUsernameEmail.trim()}
                          className="w-full text-sm py-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {forgotUsernameLoading ? "Sending..." : "Send my username"}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isSignupPage && isLogin && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="font-semibold text-base mt-4 block mx-auto"
                  data-testid="link-signup-from-login"
                >
                  <span className="text-blue-600 dark:text-blue-400">Not a Current User? Sign up Here</span>
                </button>
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