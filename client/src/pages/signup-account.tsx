import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { formatIncompletePhoneNumber } from "libphonenumber-js";

export default function SignupAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
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

  useEffect(() => {
    const selectedUserType = sessionStorage.getItem('selectedUserType');
    if (!selectedUserType) {
      setLocation('/join');
      return;
    }
    setUserType(selectedUserType);
  }, [setLocation]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 6) {
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
    
    // Basic validation
    if (!formData.name || !formData.username || !formData.email || !formData.phoneNumber || !formData.password) {
      const errorMsg = "Please fill in all required fields.";
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

    if (formData.password.length < 6) {
      const errorMsg = "Password must be at least 6 characters.";
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

    // Store account data for profile completion
    const accountData = {
      name: formData.name,
      username: formData.username,
      email: formData.email.toLowerCase().trim(),
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      userType: userType
    };

    sessionStorage.setItem('accountData', JSON.stringify(accountData));

    // Redirect to profile completion based on user type
    if (userType === 'local') {
      setLocation('/signup/local');
    } else if (userType === 'currently_traveling') {
      setLocation('/signup/traveling');
    } else if (userType === 'business') {
      setLocation('/signup/business');
    }

    setIsLoading(false);
  };

  const getUserTypeDisplayName = () => {
    switch(userType) {
      case 'local': return 'Nearby Local';
      case 'currently_traveling': return 'Nearby Traveler';
      case 'business': return 'Nearby Business';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center bg-gray-50 dark:bg-gray-800 rounded-t-lg pb-8">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 border-blue-300 hover:border-blue-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-lg text-gray-700 dark:text-gray-300 font-medium">
              {getUserTypeDisplayName()} • Step 2 of 3
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
            
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <Label htmlFor="username" className="text-base font-medium text-gray-900 dark:text-white">
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose a unique username"
                  className="text-base py-3"
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
                  Email *
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
                  Phone Number *
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
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a secure password"
                  className="text-base py-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-900 dark:text-white">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className="text-base py-3"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || usernameAvailable === false}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium mt-6"
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