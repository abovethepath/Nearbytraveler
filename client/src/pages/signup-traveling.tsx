import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import { MOST_POPULAR_INTERESTS } from "../../../shared/base-options";
import { calculateAge, validateDateInput, getDateInputConstraints } from "@/lib/ageUtils";

// Age validation utility
const validateAge = (dateOfBirth: string): { isValid: boolean; message?: string } => {
  if (!dateOfBirth) return { isValid: false, message: "Date of birth is required" };

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  if (isNaN(birthDate.getTime())) {
    return { isValid: false, message: "Please enter a valid date of birth" };
  }

  if (birthDate > today) {
    return { isValid: false, message: "Date of birth cannot be in the future" };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 16) {
    return { isValid: false, message: "You must be at least 16 years old to register" };
  }

  if (age > 99) {
    return { isValid: false, message: "You must be under 100 years old to register" };
  }

  return { isValid: true };
};

export default function SignupTraveling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser, login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    userType: "traveler",
    // Account fields - will be loaded from session storage
    email: "",
    password: "",
    username: "",
    name: "",
    // Essential simplified fields
    dateOfBirth: "",
    // Top Choices - minimum 3 required
    interests: [] as string[],
    // Traveler specific
    isCurrentlyTraveling: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load account data from sessionStorage on component mount
  useEffect(() => {
    const storedAccountData = sessionStorage.getItem('accountData');
    if (storedAccountData) {
      try {
        const accountData = JSON.parse(storedAccountData);
        console.log('✅ Loading account data from sessionStorage:', accountData);
        setFormData(prev => ({
          ...prev,
          email: accountData.email || '',
          username: accountData.username || '',
          name: accountData.name || '',
          password: accountData.password || ''
        }));
      } catch (error) {
        console.error('❌ Error loading account data from sessionStorage:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🚀 SIMPLIFIED TRAVELER SIGNUP - Starting registration');

      // Get account data from sessionStorage
      const storedAccountData = sessionStorage.getItem('accountData');
      let accountData = { email: '', password: '', username: '', name: '' };

      if (storedAccountData) {
        try {
          accountData = JSON.parse(storedAccountData);
          console.log('✅ Retrieved account data from sessionStorage:', accountData);
        } catch (error) {
          console.error('❌ Error parsing stored account data:', error);
        }
      }

      // Merge account data
      const finalFormData = {
        ...formData,
        email: accountData.email || formData.email,
        password: accountData.password || formData.password,
        username: accountData.username || formData.username,
        name: accountData.name || formData.name
      };

      // Validate required fields
      const missingFields = [];
      if (!finalFormData.email) missingFields.push("Email");
      if (!finalFormData.password) missingFields.push("Password");
      if (!finalFormData.username) missingFields.push("Username");
      if (!finalFormData.name) missingFields.push("Full Name");
      if (!formData.dateOfBirth) missingFields.push("Date of Birth");

      if (missingFields.length > 0) {
        toast({
          title: "Missing Required Information",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate minimum 3 top choices
      if (formData.interests.length < 3) {
        toast({
          title: "More selections needed",
          description: "Please choose at least 3 top choices to help us match you with like-minded travelers.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Age validation
      const ageResult = validateAge(formData.dateOfBirth);
      if (!ageResult.isValid) {
        toast({
          title: "Age Validation",
          description: ageResult.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with simplified traveler registration');

      // Prepare simplified registration data
      const registrationData = {
        userType: 'traveler',
        isCurrentlyTraveling: true,
        email: finalFormData.email.toLowerCase().trim(),
        password: finalFormData.password,
        username: finalFormData.username.toLowerCase().trim(),
        name: finalFormData.name.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        interests: formData.interests,
        // Set empty arrays for fields that will be completed in profile
        activities: [],
        events: [],
        languagesSpoken: [],
        sexualPreference: [],
        // Default values for removed fields
        bio: '',
        gender: '',
        hometownCity: '',
        hometownState: '',
        hometownCountry: '',
        location: '',
        travelDestination: '',
        currentCity: '',
        currentState: '',
        currentCountry: '',
        isVeteran: false,
        isActiveDuty: false,
        travelingWithChildren: false
      };

      console.log('➡️ Submitting simplified traveler registration');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok && data.user) {
        console.log('✅ Registration successful:', data.user.username);
        
        // Store authentication data
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Set user in auth context
        authStorage.setUser(data.user);
        setUser(data.user);
        login(data.user, data.token);
        
        // Clear stored account data
        sessionStorage.removeItem('accountData');
        
        toast({
          title: "Account created successfully!",
          description: "Welcome to Nearby Traveler!",
          variant: "default",
        });

        // Navigate to welcome page
        setTimeout(() => {
          setLocation('/welcome');
        }, 1000);
      } else {
        console.error('❌ Registration failed:', data.message);
        toast({
          title: "Registration failed",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const { minDate, maxDate } = getDateInputConstraints();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardHeader className="text-center bg-gray-50 dark:bg-gray-800 rounded-t-lg pb-8">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 border-blue-300 hover:border-blue-500 font-medium"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 text-crisp leading-tight">
              Complete Your Profile ✈️
            </CardTitle>
            <CardDescription className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto text-crisp">
              Just a few quick details to get you started. You can add more interests and activities and specific events to your profile after joining!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date of Birth */}
              <div className="space-y-3">
                <Label htmlFor="dateOfBirth" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white text-crisp">
                  Date of Birth * <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Can be hidden on profile)</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  min={minDate}
                  max={maxDate}
                  className="text-base py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 text-crisp font-medium"
                  data-testid="input-date-of-birth"
                  required
                />
              </div>

              {/* Top Choices - Simplified */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base md:text-lg font-semibold text-gray-900 dark:text-white text-crisp">
                    Top Choices * (Choose at least 3)
                  </Label>
                  <span className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-selection-count">
                    {formData.interests.length} selected
                  </span>
                </div>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-crisp leading-relaxed">
                  Please choose 3 from the list below to better match with others. Once inside you can add more city specific events and activities.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MOST_POPULAR_INTERESTS.map((interest) => (
                    <Button
                      key={interest}
                      type="button"
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      onClick={() => toggleInterest(interest)}
                      className="h-auto py-3 px-4 text-sm md:text-base font-medium transition-all duration-200 hover:scale-105 text-crisp"
                      data-testid={`button-interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || formData.interests.length < 3}
                className="w-full text-lg md:text-xl py-4 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 text-crisp"
                data-testid="button-create-account"
              >
                {isSubmitting ? "Creating Account..." : "Create My Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}