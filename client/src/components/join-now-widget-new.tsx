import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function JoinNowWidgetNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: ""
  });

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null as boolean | null);
  const [currentError, setCurrentError] = useState<string | null>(null);

  const handleStepOne = () => {
    console.log('handleStepOne called with userType:', userType);
    if (!userType) {
      const errorMsg = "Choose whether you're a local/traveler or business.";
      setCurrentError(errorMsg);
      toast({
        title: "Please select your type",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    console.log('Moving to step 2');
    setCurrentError(null); // Clear error when proceeding
    setStep(2);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 6) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      console.log(`🔍 MOBILE DEBUG: Checking username "${username}"`);
      const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ MOBILE DEBUG: Username check result:`, result);
        console.log(`✅ MOBILE DEBUG: Setting usernameAvailable to:`, result.available);
        setUsernameAvailable(result.available);
      } else {
        console.log(`❌ MOBILE DEBUG: Username check failed with status:`, response.status);
        setUsernameAvailable(true); // Default to available on error
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(true); // Default to available on error
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanUsername = value.replace(/\s/g, '_');
    setFormData({ ...formData, username: cleanUsername });
    setCurrentError(null); // Clear any existing errors when user types
    
    console.log(`📱 MOBILE DEBUG: Username changed to "${cleanUsername}"`);
    
    // Reset state and check immediately for mobile responsiveness
    if (cleanUsername.length >= 3) {
      setUsernameAvailable(null);
      // Debounce username check
      clearTimeout((window as any).usernameCheckTimeout);
      (window as any).usernameCheckTimeout = setTimeout(() => {
        checkUsernameAvailability(cleanUsername);
      }, 300); // Reduced delay for mobile
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleCreateAccount = async () => {
    setCurrentError(null); // Clear any previous errors
    
    // Basic validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      const errorMsg = "Please fill in all required fields.";
      setCurrentError(errorMsg);
      toast({
        title: "Missing fields",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Username length validation
    if (formData.username.length < 6 || formData.username.length > 13) {
      const errorMsg = "Username must be 6-13 characters long";
      setCurrentError(errorMsg);
      toast({
        title: "Invalid username length",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Password length validation
    if (formData.password.length < 8) {
      const errorMsg = "Password must be at least 8 characters long.";
      setCurrentError(errorMsg);
      toast({
        title: "Password too short",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (formData.email !== formData.confirmEmail) {
      const errorMsg = "Email and confirm email must match.";
      setCurrentError(errorMsg);
      toast({
        title: "Email mismatch",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const errorMsg = "Password and confirm password must match.";
      setCurrentError(errorMsg);
      toast({
        title: "Password mismatch", 
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      const errorMsg = "Password must be at least 6 characters.";
      setCurrentError(errorMsg);
      toast({
        title: "Password too short",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === false) {
      const errorMsg = "Please choose a different username.";
      setCurrentError(errorMsg);
      toast({
        title: "Username not available",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Skip null check - allow signup if username is not explicitly false
    console.log(`🚀 MOBILE DEBUG: Creating account with usernameAvailable = ${usernameAvailable}`);

    // Store account data for profile completion form
    const accountData = {
      name: formData.name,
      username: formData.username,
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      userType: userType
    };

    sessionStorage.setItem('accountData', JSON.stringify(accountData));

    // Redirect to profile completion based on user type
    console.log('Redirecting user type:', userType);
    if (userType === 'local') {
      console.log('Navigating to local signup');
      setLocation('/signup/local');
    } else if (userType === 'currently_traveling') {
      console.log('Navigating to traveling signup');
      setLocation('/signup/traveling');
    } else if (userType === 'business') {
      console.log('Navigating to business signup');
      setLocation('/signup/business');
    }
  };

  return (
    <div className="space-y-4">
      {step === 1 ? (
        <>
          {/* Step 1: User Type Selection - 3 Boxes */}
          <div className="space-y-2">
            <Label className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">I am a...</Label>
            <div className="space-y-2">
              {/* Local Box */}
              <div
                onClick={() => setUserType("local")}
                className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                  userType === "local" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Nearby Local
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Not Traveling Now
                </div>
              </div>

              {/* Traveler Box */}
              <div
                onClick={() => setUserType("currently_traveling")}
                className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                  userType === "currently_traveling" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Currently Traveling
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  On a Trip Now
                </div>
              </div>

              {/* Business Box */}
              <div
                onClick={() => setUserType("business")}
                className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                  userType === "business" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Nearby Business
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Service Provider
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <div
              onClick={userType ? handleStepOne : undefined}
              className={`join-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center select-none text-base md:text-lg text-crisp ${
                userType ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              style={{
                pointerEvents: userType ? 'auto' : 'none'
              }}
            >
              Continue
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Step 2: Account Creation */}
          {currentError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">❌</span>
                <span className="font-medium">{currentError}</span>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">
                {userType === 'business' ? 'Business Name *' : 'Full Name *'}
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={userType === 'business' ? "Your business name (e.g., Joe's Pizza or LA Tours)" : 'Your full name'}
                className="text-base py-3 text-crisp font-medium"
                required
              />
              {userType === 'business' && (
                <p className="text-sm text-gray-600 mt-1">This is how your business will appear to customers</p>
              )}
            </div>

            <div>
              <Label htmlFor="username" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">
                {userType === 'business' ? 'Personal Username * (min 6 characters)' : 'Username * (min 6 characters)'}
              </Label>
              {userType === 'business' && (
                <p className="text-sm text-gray-600 mb-2">Your personal username for logging in and account management</p>
              )}
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose username (6-13 characters)"
                  required
                  maxLength={13}
                  className={`pr-10 text-base py-3 text-crisp font-medium ${
                    usernameAvailable === true ? 'border-green-500' : 
                    usernameAvailable === false ? 'border-red-500' : 
                    formData.username.length > 13 ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-10">
                  {usernameChecking ? (
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full bg-white"></div>
                  ) : usernameAvailable === true ? (
                    <span className="text-green-500 text-2xl font-black bg-white rounded-full px-1">✓</span>
                  ) : usernameAvailable === false ? (
                    <span className="text-red-500 text-2xl font-black bg-white rounded-full px-1">✗</span>
                  ) : (
                    <span className="text-gray-400 text-lg">⏳</span>
                  )}
                </div>
              </div>
              {formData.username && (
                <p className={`text-xs mt-1 ${
                  formData.username.length < 6 || formData.username.length > 13 
                    ? 'text-red-500 font-semibold' 
                    : 'text-gray-500'
                }`}>
                  {formData.username.length}/13 characters {formData.username.length < 6 && "(minimum 6)"}
                  {formData.username.length > 13 && " - USERNAME TOO LONG!"}
                </p>
              )}
              {formData.username && formData.username.length < 6 && (
                <p className="text-yellow-500 text-sm font-medium mt-1">⚠️ Username must be at least 6 characters</p>
              )}
              {usernameAvailable === false && (
                <p className="text-red-500 text-sm font-medium mt-1">❌ Username not available</p>
              )}
              {usernameAvailable === true && (
                <p className="text-green-500 text-sm font-medium mt-1">✅ Username available</p>
              )}
              {usernameChecking && (
                <p className="text-blue-500 text-sm font-medium mt-1">🔍 Checking availability...</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={userType === 'business' ? "owner@example.com or owner+restaurant@example.com" : "your@email.com"}
                className="text-base py-3 text-crisp font-medium"
                required
              />
              {userType === 'business' && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  💡 <strong>Multiple Businesses?</strong> Use email variants like: owner+pizza@example.com, owner+shop@example.com
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="confirmEmail" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Confirm Email *</Label>
              <div className="relative">
                <Input
                  id="confirmEmail"
                  type="email"
                  value={formData.confirmEmail}
                  onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                  placeholder="Confirm your email"
                  required
                  className={`pr-10 text-base py-3 text-crisp font-medium ${
                    formData.confirmEmail && formData.email ? (
                      formData.email === formData.confirmEmail ? 'border-green-500' : 'border-red-500'
                    ) : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {formData.confirmEmail && formData.email && (
                    formData.email === formData.confirmEmail ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )
                  )}
                </div>
              </div>
              {formData.confirmEmail && formData.email && formData.email !== formData.confirmEmail && (
                <p className="text-red-500 text-xs mt-1">Emails don't match</p>
              )}
              {formData.confirmEmail && formData.email && formData.email === formData.confirmEmail && (
                <p className="text-green-500 text-xs mt-1">Emails match</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Password * (min 8 characters)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password"
                  required
                  className={`pr-10 text-base py-3 text-crisp font-medium ${
                    formData.password && formData.password.length >= 8 ? 'border-green-500' : 
                    formData.password && formData.password.length < 8 ? 'border-yellow-500' : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {formData.password && (
                    formData.password.length >= 8 ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-yellow-500">⚠️</span>
                    )
                  )}
                </div>
              </div>
              {formData.password && formData.password.length < 8 && (
                <p className="text-yellow-500 text-xs mt-1">Password must be at least 8 characters</p>
              )}
              {formData.password && formData.password.length >= 8 && (
                <p className="text-green-500 text-xs mt-1">Password meets requirements</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-base md:text-lg font-medium text-gray-900 dark:text-white text-crisp">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  required
                  className={`pr-10 text-base py-3 text-crisp font-medium ${
                    formData.confirmPassword && formData.password ? (
                      formData.password === formData.confirmPassword ? 'border-green-500' : 'border-red-500'
                    ) : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {formData.confirmPassword && formData.password && (
                    formData.password === formData.confirmPassword ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )
                  )}
                </div>
              </div>
              {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
              )}
              {formData.confirmPassword && formData.password && formData.password === formData.confirmPassword && (
                <p className="text-green-500 text-xs mt-1">Passwords match</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 space-y-3">
            <div
              onClick={handleCreateAccount}
              className="join-page-gradient-button w-full py-3 px-4 rounded-md font-bold text-center cursor-pointer select-none text-base md:text-lg text-crisp"
            >
              Create Account & Continue
            </div>
            
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Back to Landing Page
            </Button>
          </div>
        </>
      )}
    </div>
  );
}