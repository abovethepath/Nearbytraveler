import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatIncompletePhoneNumber } from "libphonenumber-js";
import { getApiBaseUrl } from "@/lib/queryClient";

export default function SignupAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    contactName: "", // Business only: name of contact person
    username: "",
    email: "",
    confirmEmail: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null as boolean | null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  useEffect(() => {
    // Check for QR code flow first (intendedUserType), then regular flow (selectedUserType)
    const intendedUserType = sessionStorage.getItem('intendedUserType');
    const selectedUserType = sessionStorage.getItem('selectedUserType');
    
    const effectiveUserType = intendedUserType || selectedUserType;
    
    if (!effectiveUserType) {
      setLocation('/join');
      return;
    }
    setUserType(effectiveUserType);
  }, [setLocation]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 6) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/check-username/${encodeURIComponent(username)}`);
      
      if (response.ok) {
        const result = await response.json();
        setUsernameAvailable(result.available);
      } else {
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(true);
    } finally {
      setUsernameChecking(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return '';
    
    try {
      const formatted = formatIncompletePhoneNumber(value, 'US');
      return formatted || value;
    } catch (error) {
      return value.replace(/[^\d+]/g, '');
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phoneNumber: formatted });
  };

  const handleUsernameChange = (value: string) => {
    const cleanUsername = value.replace(/\s/g, '_');
    setFormData({ ...formData, username: cleanUsername });
    setCurrentError(null);
    
    if (cleanUsername.length >= 3) {
      setUsernameAvailable(null);
      clearTimeout((window as any).usernameCheckTimeout);
      (window as any).usernameCheckTimeout = setTimeout(() => {
        checkUsernameAvailability(cleanUsername);
      }, 300);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentError(null);
    setIsLoading(true);
    
    // Basic validation (business requires contactName too)
    const missingBusiness = userType === 'business' && !formData.contactName?.trim();
    if (!formData.name || !formData.username || !formData.email || !formData.phoneNumber || !formData.password || missingBusiness) {
      const errorMsg = userType === 'business' ? "Please fill in Business Name, Name of Contact, Username, Contact Phone, Contact Email, and Password." : "Please fill in all required fields.";
      setCurrentError(errorMsg);
      toast({
        title: "Missing fields",
        description: errorMsg,
        variant: "destructive",
      });
      setIsLoading(false);
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
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      const errorMsg = "Password must be at least 8 characters.";
      setCurrentError(errorMsg);
      toast({
        title: "Password too short",
        description: errorMsg,
        variant: "destructive",
      });
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    // Store account data for profile completion (business: name = business name, contactName = name of contact)
    const isNewToTown = sessionStorage.getItem('isNewToTown') === 'true';
    const accountData: Record<string, unknown> = {
      name: formData.name,
      username: formData.username,
      email: formData.email.toLowerCase().trim(),
      confirmEmail: formData.confirmEmail.toLowerCase().trim(),
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      userType: userType,
      isNewToTown: isNewToTown,
      keepLoggedIn: keepLoggedIn
    };
    if (userType === 'business' && formData.contactName?.trim()) {
      accountData.contactName = formData.contactName.trim();
    }

    sessionStorage.setItem('accountData', JSON.stringify(accountData));

    // Clear intendedUserType after use (QR code flow cleanup)
    sessionStorage.removeItem('intendedUserType');

    // Redirect to profile completion based on user type
    if (userType === 'local') {
      setLocation('/signup/local');
    } else if (userType === 'traveler') {
      setLocation('/signup/traveling');
    } else if (userType === 'business') {
      setLocation('/signup/business');
    }

    setIsLoading(false);
  };

  const getUserTypeDisplayName = () => {
    switch(userType) {
      case 'local': return 'Nearby Local';
      case 'traveler': return 'Nearby Traveler';
      case 'business': return 'Nearby Business';
      default: return 'User';
    }
  };

  // Check if all fields are properly filled and valid (business also needs contactName)
  const isFormValid = 
    formData.name.trim() !== "" &&
    (userType !== 'business' || formData.contactName?.trim() !== "") &&
    formData.username.trim() !== "" &&
    formData.username.length >= 6 &&
    formData.email.trim() !== "" &&
    formData.confirmEmail.trim() !== "" &&
    formData.email === formData.confirmEmail &&
    formData.phoneNumber.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    usernameAvailable === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Vibrant header banner */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-blue-600 py-3 px-4 text-center z-40">
        <p className="text-white font-bold text-sm sm:text-base">
          🌍 Join thousands of travelers and locals connecting worldwide!
        </p>
      </div>
      
      <div className="max-w-md mx-auto pt-16">
        <Card className="shadow-2xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-blue-500 dark:from-orange-600 dark:to-blue-600 pb-8 pt-6">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/50 hover:border-white font-medium backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-3">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-lg text-white/90 font-medium">
              {getUserTypeDisplayName()} • {userType === 'business' ? 'Step 1 of 2 – Business name, contact & password' : 'Step 2 of 3'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {currentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-2">❌</span>
                  <span className="font-medium">{currentError}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base font-medium text-gray-900 dark:text-white">
                  {userType === 'business' ? 'Business Name *' : 'Full Name *'}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={userType === 'business' ? "Your business name" : 'Your full name'}
                  className="text-base py-3"
                  required
                />
              </div>

              {userType === 'business' && (
                <div>
                  <Label htmlFor="contactName" className="text-base font-medium text-gray-900 dark:text-white">
                    Name of Contact *
                  </Label>
                  <Input
                    id="contactName"
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Person managing this account"
                    className="text-base py-3"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="username" className="text-base font-medium text-gray-900 dark:text-white">
                  {userType === 'business' ? 'User Name * (6-12 characters)' : 'Username * (6-12 characters)'}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose a unique username (6-12 chars)"
                  className="text-base py-3"
                  maxLength={12}
                  required
                />
                {usernameChecking && (
                  <p className="text-sm text-blue-600 mt-1">Checking availability...</p>
                )}
                {usernameAvailable === true && (
                  <p className="text-sm text-green-600 mt-1">✓ Username available</p>
                )}
                {usernameAvailable === false && (
                  <p className="text-sm text-red-600 mt-1">✗ Username taken</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-white">
                  {userType === 'business' ? "Contact's Email Address *" : 'Email *'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="text-base py-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmEmail" className="text-base font-medium text-gray-900 dark:text-white">
                  Confirm Email *
                </Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={formData.confirmEmail}
                  onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                  placeholder="Confirm your email"
                  className="text-base py-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-base font-medium text-gray-900 dark:text-white">
                  {userType === 'business' ? "Contact's Phone Number *" : 'Phone Number *'}
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="text-base py-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-base font-medium text-gray-900 dark:text-white">
                  Password * (min 8 characters)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a secure password (min 8 chars)"
                    autoComplete="new-password"
                    className="text-base py-3 pr-10 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-900 dark:text-white">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    autoComplete="off"
                    className={`text-base py-3 pr-20 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                      formData.confirmPassword && formData.password ? (
                        formData.password === formData.confirmPassword ? 'border-green-500' : 'border-red-500'
                      ) : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      data-testid="toggle-confirm-password-visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {formData.confirmPassword && formData.password && (
                      formData.password === formData.confirmPassword ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-red-500 text-lg">✗</span>
                      )
                    )}
                  </div>
                </div>
                {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords don't match</p>
                )}
                {formData.confirmPassword && formData.password && formData.password === formData.confirmPassword && (
                  <p className="text-green-500 text-sm mt-1">Passwords match ✓</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="keepLoggedIn"
                  checked={!!keepLoggedIn}
                  onCheckedChange={(checked) => setKeepLoggedIn(!!checked)}
                  className="h-4 w-4 border-gray-300 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="keepLoggedIn" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Keep me logged in
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || usernameAvailable === false}
                className={`w-full text-white py-3 text-base font-medium mt-6 transition-colors ${
                  isFormValid 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                data-testid="button-continue-profile"
              >
                {isLoading ? "Creating..." : "Continue to Profile →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}