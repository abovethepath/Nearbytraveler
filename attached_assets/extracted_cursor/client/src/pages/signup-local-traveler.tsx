import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { MOST_POPULAR_INTERESTS } from "../../../shared/base-options";
import { AuthContext } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { authStorage } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { GENDER_OPTIONS } from "@/lib/formConstants";

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

export default function SignupLocalTraveler() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser, login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    userType: "local",

    // Account fields (for direct testing)
    email: "",
    password: "",
    username: "",
    name: "",

    // Profile fields
    dateOfBirth: "",
    gender: "",

    // Location fields
    hometownCountry: "",
    hometownCity: "",
    hometownState: "",

    // Interests - simplified to just top choices
    interests: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);

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

  // Get total selected count for validation
  const getTotalSelections = () => {
    return formData.interests.length;
  };

  // Select All function for Top Choices sections
  const selectAllTopChoices = () => {
    setFormData(prev => ({
      ...prev,
      interests: [...MOST_POPULAR_INTERESTS]
    }));
  };

  // Clear All function for Top Choices sections
  const clearAllTopChoices = () => {
    setFormData(prev => ({
      ...prev,
      interests: []
    }));
  };

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🚨 SIGNUP DEBUG - Form submission started');
      console.log('📋 Form Data:', formData);

      // Get account data from sessionStorage (from Auth component)
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

      // CRITICAL: Merge account data INTO formData to ensure submission has complete data
      const finalFormData = {
        ...formData,
        email: accountData.email || formData.email,
        password: accountData.password || formData.password,
        username: accountData.username || formData.username,
        name: accountData.name || formData.name
      };

      console.log('🔄 Final merged form data:', finalFormData);

      // CRITICAL: Validate ALL required fields with specific messages
      const missingFields = [];
      if (!finalFormData.email) missingFields.push("Email");
      if (!finalFormData.password) missingFields.push("Password");
      if (!finalFormData.username) missingFields.push("Username");
      if (!finalFormData.name) missingFields.push("Full Name");
      if (!formData.dateOfBirth) missingFields.push("Date of Birth");
      if (!formData.gender) missingFields.push("Gender");
      if (!formData.hometownCity) missingFields.push("Hometown City");
      if (!formData.hometownCountry) missingFields.push("Hometown Country");

      if (missingFields.length > 0) {
        console.log('🚨 SIGNUP BLOCKED - Missing fields:', missingFields);
        toast({
          title: "Missing Required Information",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate minimum interests selection
      if (formData.interests.length < 2) {
        toast({
          title: "More interests needed",
          description: "Please choose at least 2 interests for better matching.",
          variant: "destructive",
        });
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with registration');

      // Prepare registration data
      const registrationData = {
        userType: 'local',
        isCurrentlyTraveling: false,
        email: finalFormData.email.toLowerCase().trim(),
        password: finalFormData.password,
        username: finalFormData.username.toLowerCase().trim(),
        name: finalFormData.name.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        hometownCountry: formData.hometownCountry,
        hometownCity: formData.hometownCity,
        hometownState: formData.hometownState,
        location: formData.hometownState
          ? `${formData.hometownCity}, ${formData.hometownState}, ${formData.hometownCountry}`
          : `${formData.hometownCity}, ${formData.hometownCountry}`,
        interests: formData.interests,
      };

      console.log('➡️ Submitting registration with data:', {
        ...registrationData,
        password: '[REDACTED]'
      });

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

        // Redirect to profile to complete setup
        setTimeout(() => {
          setLocation('/profile');
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center bg-gray-50 dark:bg-gray-800 rounded-t-lg pb-4 sm:pb-8">
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
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Complete Your Local Profile 🏠
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 dark:text-gray-300 font-medium">
              Connect and match with Nearby Locals and Nearby Travelers
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 dark:text-white">Date of Birth *</Label>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                      Can be hidden from public view later while still being used for matching
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Month</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''}
                          onValueChange={(month) => {
                            const [year, , day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 h-10 sm:h-10">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i: number) => {
                              const month = String(i + 1).padStart(2, '0');
                              const monthName = new Date(2000, i, 1).toLocaleDateString('en', { month: 'long' });
                              return (
                                <SelectItem key={month} value={month}>
                                  {monthName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Day</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''}
                          onValueChange={(day) => {
                            const [year, month] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month || ''}-${day}` }));
                          }}
                        >
                          <SelectTrigger className="text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 h-10 sm:h-10">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 31}, (_, i: number) => {
                              const day = String(i + 1).padStart(2, '0');
                              return (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Year</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
                          onValueChange={(year) => {
                            const [, month, day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year}-${month || ''}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 h-10 sm:h-10">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 80}, (_, i: number) => {
                              const year = String(new Date().getFullYear() - 16 - i);
                              return (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-white">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 h-10 sm:h-10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((gender) => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Location Information</h3>

                <div>
                  <Label className="text-gray-900 dark:text-white">Hometown Location *</Label>
                <SmartLocationInput
                  country={formData.hometownCountry}
                  city={formData.hometownCity}
                  state={formData.hometownState}
                    onLocationChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      hometownCountry: location.country,
                      hometownCity: location.city,
                      hometownState: location.state
                    }));
                  }}
                    placeholder={{ country: "Select your hometown country", city: "Select hometown city", state: "Select state/region" }}
                    required
                />
                </div>
              </div>

              {/* Interests Section */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Interests</h3>
                  <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                    <strong>Choose at least 2 choices from the list below, but the more you choose the better to match...</strong>
                  </div>
                  <div className="text-center mt-4">
                    <div className={`text-lg font-bold ${getTotalSelections() >= 2 ? 'text-green-600' : 'text-red-600'}`}>
                      Current selections: {getTotalSelections()}/2 minimum
                    </div>
                    {getTotalSelections() < 2 && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select at least 2 interests to continue
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Choices for Most Travelers */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Top Choices for Most Travelers</h3>
                  
                  {/* Select All / Clear All Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button
                      type="button"
                      onClick={selectAllTopChoices}
                      className="px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex-1 sm:flex-none"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      onClick={clearAllTopChoices}
                      className="px-4 py-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md flex-1 sm:flex-none"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {MOST_POPULAR_INTERESTS.map((interest: string) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-2 sm:px-3 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-[40px] ${
                          formData.interests.includes(interest)
                            ? 'bg-blue-600 text-white font-bold transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                </div>

                  {/* Selected interests display - REMOVED FOR MOBILE CLEANLINESS */}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isLoading || getTotalSelections() < 2}
                  className={`w-full py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-xl transition-all duration-200 ${
                    getTotalSelections() >= 2
                      ? 'bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3 inline-block"></div>
                      <span className="text-sm sm:text-base">Creating Your Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm sm:text-base">Complete Registration & Join the Community</span>
                    </>
                  )}
                </Button>

                {getTotalSelections() < 2 && (
                  <p className="text-red-600 text-sm mt-2">
                    Please select at least {2 - getTotalSelections()} more interest(s) to continue
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}