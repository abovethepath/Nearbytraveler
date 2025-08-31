import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { authStorage } from "@/lib/auth";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, MOST_POPULAR_INTERESTS } from "../../../shared/base-options";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS } from "@/lib/formConstants";
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
  const [formData, setFormData] = useState({
    // Basic auth fields
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    name: "",
    
    // Personal info
    dateOfBirth: "",
    gender: "",
    sexualPreference: [] as string[],
    languagesSpoken: [] as string[],
    
    // Location
    hometownCountry: "",
    hometownCity: "",
    hometownState: "",
    
    // Interests & Activities
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[],
    
    // Demographics
    isVeteran: false,
    isActiveDuty: false,
    travelingWithChildren: false,
    isCurrentlyTraveling: false,
    
    // User type
    userType: "traveler" as "traveler" | "local" | "business"
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('handleLogin called with email:', formData.email, 'password length:', formData.password?.length);
    if (!formData.email || !formData.password) {
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
        body: JSON.stringify({ email: formData.email.toLowerCase().trim(), password: formData.password }),
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
          setLocation("/welcome-business");
        } else {
          console.log('Redirecting to traveler/local welcome page');
          setLocation("/welcome");
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

  const handleSignup = async () => {
    console.log('handleSignup called with data:', formData);
    
    // Validate required fields
    const requiredFields = ['email', 'password', 'confirmPassword', 'username', 'name', 'dateOfBirth'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
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

    // Validate age
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 16) {
      toast({
        title: "Age requirement",
        description: "You must be at least 16 years old to register.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting comprehensive signup request...');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email.toLowerCase().trim(),
          username: formData.username.trim(),
          name: formData.name.trim()
        }),
      });

      console.log('Signup response status:', response.status);
      if (response.ok) {
        const user = await response.json();
        console.log('Signup successful:', user);

        toast({
          title: "Welcome to Nearby Traveler!",
          description: "Your account has been created successfully.",
        });

        // Auto-login after successful signup
        authStorage.setUser(user.user);
        queryClient.invalidateQueries();
        setLocation("/welcome");
        return;
      } else {
        const error = await response.json();
        console.log('Signup error:', error);
        toast({
          title: "Sign up failed",
          description: error.message || "Unable to create account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
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
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl relative z-10">
        <Card className="auth-page-card shadow-2xl border-4 border-blue-500/50 bg-white/80 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </Button>
            </div>
            <div className="flex justify-center mb-2">
              <div className="scale-[6.3] transform-gpu">
                <Logo variant="landing" />
              </div>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white text-crisp leading-tight">
              {isLogin ? "Welcome Back" : "Join Nearby Traveler"}
            </CardTitle>
            {!isLogin && (
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2 leading-relaxed text-crisp">
                Start Connecting with Nearby Locals and Nearby Travelers Today Based on Common Interests and Demographics
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isLogin ? (
              <>
                {/* Comprehensive Signup Form */}
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  
                  {/* Basic Account Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          className="text-sm py-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium text-gray-900 dark:text-white">Username *</Label>
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Choose a username"
                          className="text-sm py-2"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        className="text-sm py-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create a password"
                          className="text-sm py-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-white">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your password"
                          className="text-sm py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-900 dark:text-white">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="text-sm py-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900 dark:text-white">User Type</Label>
                        <Select value={formData.userType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, userType: value }))}>
                          <SelectTrigger className="text-sm py-2">
                            <SelectValue placeholder="I am a..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="traveler">Traveler</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="hometownCountry" className="text-sm font-medium text-gray-900 dark:text-white">Country</Label>
                        <Input
                          id="hometownCountry"
                          type="text"
                          value={formData.hometownCountry}
                          onChange={(e) => setFormData(prev => ({ ...prev, hometownCountry: e.target.value }))}
                          placeholder="e.g., United States"
                          className="text-sm py-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hometownCity" className="text-sm font-medium text-gray-900 dark:text-white">City</Label>
                        <Input
                          id="hometownCity"
                          type="text"
                          value={formData.hometownCity}
                          onChange={(e) => setFormData(prev => ({ ...prev, hometownCity: e.target.value }))}
                          placeholder="e.g., Los Angeles"
                          className="text-sm py-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hometownState" className="text-sm font-medium text-gray-900 dark:text-white">State/Province</Label>
                        <Input
                          id="hometownState"
                          type="text"
                          value={formData.hometownState}
                          onChange={(e) => setFormData(prev => ({ ...prev, hometownState: e.target.value }))}
                          placeholder="e.g., California"
                          className="text-sm py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Interests Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interests (Select a few to get started)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {MOST_POPULAR_INTERESTS.slice(0, 12).map(interest => (
                        <div key={interest} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interest-${interest}`}
                            checked={formData.interests.includes(interest)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                              } else {
                                setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                              }
                            }}
                          />
                          <Label htmlFor={`interest-${interest}`} className="text-xs">{interest}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Travel Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCurrentlyTraveling"
                          checked={formData.isCurrentlyTraveling}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCurrentlyTraveling: !!checked }))}
                        />
                        <Label htmlFor="isCurrentlyTraveling" className="text-sm">I am currently traveling</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="travelingWithChildren"
                          checked={formData.travelingWithChildren}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travelingWithChildren: !!checked }))}
                        />
                        <Label htmlFor="travelingWithChildren" className="text-sm">I travel with children</Label>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <Button
                    onClick={handleSignup}
                    disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || !formData.username || !formData.name || !formData.dateOfBirth}
                    className="join-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none text-base md:text-lg text-crisp"
                  >
                    {isLoading ? "Creating Account..." : "Join Nearby Traveler"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Login Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="text-base py-3 text-crisp font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="text-base py-3 text-crisp font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || !email || !password}
                    className="login-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none text-base md:text-lg text-crisp"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
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
                {isLogin ? "Registration temporarily disabled - Launch coming soon!" : "Already have an account? Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}