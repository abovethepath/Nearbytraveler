import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Logo from "@/components/logo";

export default function JoinNowWidget() {
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

  const handleStepOne = () => {
    if (!userType) {
      toast({
        title: "Please select your type",
        description: "Choose whether you're a local/traveler or business.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
      
      if (response.ok) {
        const result = await response.json();
        setUsernameAvailable(result.available);
      } else {
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanUsername = value.replace(/\s/g, '_');
    setFormData({ ...formData, username: cleanUsername });
    
    // Debounce username check
    clearTimeout((window as any).usernameCheckTimeout);
    (window as any).usernameCheckTimeout = setTimeout(() => {
      checkUsernameAvailability(cleanUsername);
    }, 500);
  };

  const handleCreateAccount = () => {
    // Validate all fields
    if (!formData.name || !formData.username || !formData.email || !formData.confirmEmail || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check username availability
    if (usernameAvailable === false) {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === null && formData.username.length >= 3) {
      toast({
        title: "Username not verified",
        description: "Please wait for username availability check.",
        variant: "destructive",
      });
      return;
    }

    if (formData.email !== formData.confirmEmail) {
      toast({
        title: "Email mismatch",
        description: "Email addresses don't match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch", 
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    // Store account data for profile completion form
    const accountData = {
      name: formData.name,
      username: formData.username,
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      userType: userType
    };

    sessionStorage.setItem('accountData', JSON.stringify(accountData));

    // Redirect to profile completion
    if (userType === 'local') {
      setLocation('/signup/local');
    } else if (userType === 'currently_traveling') {
      setLocation('/signup/traveling');
    } else if (userType === 'business') {
      setLocation('/signup/business');
    }
  };

  return (
    <div className="space-y-4">
        {step === 1 ? (
          <>
            {/* Step 1: User Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType" className="text-gray-900 dark:text-white">I am a...</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Nearby Local (Not Traveling Now)</SelectItem>
                  <SelectItem value="currently_traveling">Currently Traveling</SelectItem>
                  <SelectItem value="business">Nearby Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-8 pt-4">
              <div className="w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  🚀 Coming Soon!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We're putting the finishing touches on Nearby Traveler.<br/>
                  Check back soon - we'll be live shortly!
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Account Creation */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-gray-900 dark:text-white">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-gray-900 dark:text-white">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Choose username"
                    required
                    className={`pr-10 ${
                      usernameAvailable === true ? 'border-green-500' : 
                      usernameAvailable === false ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {usernameChecking ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : usernameAvailable === true ? (
                      <span className="text-green-500">✓</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-red-500">✗</span>
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-red-500 text-xs mt-1">Username not available</p>
                )}
                {usernameAvailable === true && (
                  <p className="text-green-500 text-xs mt-1">Username available</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-900 dark:text-white">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className=""
                />
              </div>
              
              <div>
                <Label htmlFor="confirmEmail" className="text-gray-900 dark:text-white">Confirm Email *</Label>
                <div className="relative">
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={formData.confirmEmail}
                    onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                    placeholder="Confirm your email"
                    required
                    className={`pr-10 ${
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
                <Label htmlFor="password" className="text-gray-900 dark:text-white">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password"
                  required
                />
                {formData.password && formData.password.length < 6 && (
                  <p className="text-yellow-500 text-xs mt-1">Password should be at least 6 characters</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    required
                    className={`pr-10 ${
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
              <div className="w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  🚀 Coming Soon!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We're putting the finishing touches on Nearby Traveler.<br/>
                  Check back soon - we'll be live shortly!
                </p>
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