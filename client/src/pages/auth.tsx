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
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if we're on the join page or in register mode
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const isJoinPage = window.location.pathname === '/join';
  const [isLogin, setIsLogin] = useState(mode === 'register' ? false : !isJoinPage);
  
  // Basic form fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    name: "",
    dateOfBirth: "",
    hometownCountry: "",
    hometownCity: "",
    hometownState: "",
    userType: "traveler"
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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.toLowerCase().trim(), password: formData.password }),
      });

      console.log('Login response status:', response.status);
      if (response.ok) {
        const user = await response.json();
        console.log('Login successful, user:', user);
        
        // Store auth data
        authStorage.setUser(user);
        authStorage.setAuthToken('authenticated');
        
        // Invalidate auth queries to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        
        // Redirect to home
        setLocation('/');
      } else {
        const error = await response.text();
        console.log('Login failed with error:', error);
        toast({
          title: "Login failed",
          description: error || "Invalid credentials. Please try again.",
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

  const handleSignup = async () => {
    console.log('handleSignup called with data:', formData);
    
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.username || !formData.name) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting signup request...');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          username: formData.username.trim(),
          name: formData.name.trim(),
          dateOfBirth: formData.dateOfBirth,
          hometownCountry: formData.hometownCountry,
          hometownCity: formData.hometownCity,
          hometownState: formData.hometownState,
          userType: formData.userType
        }),
      });

      console.log('Signup response status:', response.status);
      if (response.ok) {
        const user = await response.json();
        console.log('Signup successful, user:', user);
        
        // Store auth data
        authStorage.setUser(user);
        authStorage.setAuthToken('authenticated');
        
        // Invalidate auth queries to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Welcome to Nearby Traveler!",
          description: "Your account has been created successfully.",
        });
        
        // Redirect to home
        setLocation('/');
      } else {
        const error = await response.text();
        console.log('Signup failed with error:', error);
        toast({
          title: "Signup failed",
          description: error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
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
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <Logo width="120" height="120" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Join Nearby Traveler'}
            </CardTitle>
            {isJoinPage && (
              <p className="text-lg text-gray-600 mt-2">
                Connect with travelers and locals worldwide
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isLogin ? (
              <>
                {/* Login Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail" className="text-base md:text-lg font-medium text-gray-900 dark:text-white">Email or Username</Label>
                    <Input
                      id="loginEmail"
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email or username"
                      className="text-base py-3 text-crisp font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword" className="text-base md:text-lg font-medium text-gray-900 dark:text-white">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="text-base py-3 text-crisp font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || !formData.email || !formData.password}
                    className="join-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none text-base md:text-lg text-crisp"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Signup Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium text-gray-900">Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        className="text-base py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-base font-medium text-gray-900">Username *</Label>
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Choose a username"
                        className="text-base py-3"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-base font-medium text-gray-900">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="text-base py-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="text-base font-medium text-gray-900">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Create a password"
                        className="text-base py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-900">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your password"
                        className="text-base py-3"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-base font-medium text-gray-900">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="text-base py-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country" className="text-base font-medium text-gray-900">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.hometownCountry}
                        onChange={(e) => setFormData(prev => ({ ...prev, hometownCountry: e.target.value }))}
                        placeholder="e.g., United States"
                        className="text-base py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-base font-medium text-gray-900">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.hometownCity}
                        onChange={(e) => setFormData(prev => ({ ...prev, hometownCity: e.target.value }))}
                        placeholder="e.g., Los Angeles"
                        className="text-base py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-base font-medium text-gray-900">State</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.hometownState}
                        onChange={(e) => setFormData(prev => ({ ...prev, hometownState: e.target.value }))}
                        placeholder="e.g., California"
                        className="text-base py-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <Button
                    onClick={handleSignup}
                    disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || !formData.username || !formData.name}
                    className="join-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none text-base md:text-lg text-crisp"
                  >
                    {isLoading ? "Creating Account..." : "Join Nearby Traveler"}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Join Now Widget for join page */}
        {isJoinPage && !isLogin && (
          <div className="mt-8">
            <JoinNowWidgetNew />
          </div>
        )}
      </div>
    </div>
  );
}