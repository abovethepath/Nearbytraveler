import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { MOST_POPULAR_INTERESTS } from "../../../shared/base-options";
import { AuthContext } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { authStorage } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { getDateInputConstraints } from "@/lib/ageUtils";

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
  const authContext = useContext(AuthContext);
  const { setUser, login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    userType: "local",

    // Account fields (for direct testing)
    email: "",
    password: "",
    username: "",
    name: "",
    phoneNumber: "",

    // Profile fields
    dateOfBirth: "",
    bio: "",
    gender: "",
    sexualPreference: [] as string[],
    languagesSpoken: [] as string[],
    customLanguages: "",

    // Location fields
    hometownCountry: "",
    hometownCity: "",
    hometownState: "",

    // Interests/Activities/Events
    interests: [] as string[],
    customInterests: [] as string[],
    customInterestInput: "",

    activities: [] as string[],
    customActivities: [] as string[],
    customActivityInput: "",

    events: [] as string[],
    customEvents: [] as string[],
    customEventInput: "",



    // Military status
    isVeteran: false,
    isActiveDuty: false,

    // Family travel
    travelingWithChildren: false,
    
    // Current travel status - local users are typically not currently traveling
    isCurrentlyTraveling: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customEvent, setCustomEvent] = useState("");

  // Add LA Metro scope tracking
  const [hometownScope, setHometownScope] = useState<"city" | "metro">("city");
  const [hometownMetro, setHometownMetro] = useState<{ metroCode?: string; metroName?: string }>({});


  // Select All function for Top Choices sections
  const selectAllTopChoices = () => {
    setFormData(prev => {
      // Get items not already selected
      const newInterests = MOST_POPULAR_INTERESTS.filter(item => !prev.interests.includes(item));
      
      return {
        ...prev,
        interests: [...prev.interests, ...newInterests]
      };
    });
  };

  // Clear All function for Top Choices sections
  const clearAllTopChoices = () => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(item => !MOST_POPULAR_INTERESTS.includes(item))
    }));
  };

  const addCustomItem = (type: string, value: string, clearInput: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (type === 'interest') {
      if (!formData.interests.includes(trimmed)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
        clearInput();
      }
    } else if (type === 'activity') {
      if (!formData.activities.includes(trimmed)) {
        setFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
        clearInput();
      }
    } else if (type === 'event') {
      if (!formData.events.includes(trimmed)) {
        setFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
        clearInput();
      }
    } else if (type === 'language') {
      if (!formData.languagesSpoken.includes(trimmed)) {
        setFormData(prev => ({ ...prev, languagesSpoken: [...prev.languagesSpoken, trimmed] }));
        clearInput();
      }
    }
  };


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
          password: accountData.password || '',
          phoneNumber: accountData.phoneNumber || ''
        }));
      } catch (error) {
        console.error('❌ Error loading account data from sessionStorage:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🚨 MOBILE SIGNUP DEBUG - Form submission started');
      console.log('📋 Current Form Data:', {
        dateOfBirth: formData.dateOfBirth,
        hometownCity: formData.hometownCity,
        hometownCountry: formData.hometownCountry,
        sexualPreference: formData.sexualPreference,
        languagesSpoken: formData.languagesSpoken,
        customLanguages: formData.customLanguages,
        interests: formData.interests,
        activities: formData.activities,
        events: formData.events,
        totalSelections: formData.interests.length + formData.activities.length + formData.events.length
      });

      // Get account data from sessionStorage (from Auth component)
      const storedAccountData = sessionStorage.getItem('accountData');
      let accountData = { email: '', password: '', username: '', name: '', phoneNumber: '' };

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
        name: accountData.name || formData.name,
        phoneNumber: accountData.phoneNumber || formData.phoneNumber
      };

      // Validation
      if (!finalFormData.name || !finalFormData.username || !finalFormData.email || !finalFormData.password) {
        window.alert(`SIGNUP ERROR: Missing required fields - Name: ${finalFormData.name ? 'OK' : 'MISSING'}, Username: ${finalFormData.username ? 'OK' : 'MISSING'}, Email: ${finalFormData.email ? 'OK' : 'MISSING'}, Password: ${finalFormData.password ? 'OK' : 'MISSING'}`);
        
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Age validation - required
      if (!formData.dateOfBirth) {
        toast({
          title: "Date of birth required",
          description: "Please enter your date of birth.",
          variant: "destructive",
        });
        return;
      }
      
      const ageResult = validateAge(formData.dateOfBirth);
      if (!ageResult.isValid) {
        toast({
          title: "Age Validation",
          description: ageResult.message,
          variant: "destructive",
        });
        return;
      }

      // Location validation
      if (!formData.hometownCity || !formData.hometownCountry) {
        toast({
          title: "Location required",
          description: "Please select your hometown location.",
          variant: "destructive",
        });
        return;
      }

      // Check minimum interests requirement - only interests for locals
      if (formData.interests.length < 3) {
        toast({
          title: "More selections needed",
          description: "Please choose at least 3 interests.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with local registration');

      // Prepare registration data
      const registrationData = {
        userType: 'local',
        isCurrentlyTraveling: false,
        email: finalFormData.email.toLowerCase().trim(),
        password: finalFormData.password,
        username: finalFormData.username.toLowerCase().trim(),
        name: finalFormData.name.trim(),
        phoneNumber: finalFormData.phoneNumber,
        
        // Optional profile fields
        dateOfBirth: formData.dateOfBirth,
        bio: formData.bio || '',
        gender: formData.gender || '',
        sexualPreference: formData.sexualPreference || [],
        
        // Location data with metro support
        hometownCity: formData.hometownCity,
        hometownState: formData.hometownState,
        hometownCountry: formData.hometownCountry,
        location: hometownScope === "metro" && hometownMetro.metroName 
          ? hometownMetro.metroName 
          : [formData.hometownCity, formData.hometownState, formData.hometownCountry].filter(Boolean).join(", "),
        hometown: hometownScope === "metro" && hometownMetro.metroName 
          ? hometownMetro.metroName 
          : [formData.hometownCity, formData.hometownState, formData.hometownCountry].filter(Boolean).join(", "),
        
        // Only send interests for locals (simplify payload)
        interests: formData.interests,
        
        // Additional flags
        isVeteran: !!formData.isVeteran,
        isActiveDuty: !!formData.isActiveDuty,
        travelingWithChildren: !!formData.travelingWithChildren
      };

      console.log('➡️ Submitting local registration');

      // Store registration data for background processing
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
      
      // Show success message and redirect immediately  
      toast({
        title: "Account created!",
        description: "Redirecting to your success page...",
        variant: "default",
      });

      // Redirect immediately to success page
      setLocation('/account-success');

      // Start account creation in background
      setTimeout(async () => {
        try {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
          });

          const data = await response.json();

          if (response.ok && data.user) {
            console.log('✅ Background registration successful:', data.user.username);
            
            // Store authentication data
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
            }
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Set user in auth context
            authStorage.setUser(data.user);
            setUser(data.user);
            login(data.user, data.token);
            
            // Clear stored account and registration data
            sessionStorage.removeItem('accountData');
            sessionStorage.removeItem('registrationData');
            
            console.log('✅ Background registration completed successfully');
          } else {
            console.error('❌ Background registration failed:', data.message);
          }
        } catch (error) {
          console.error('Background registration error:', error);
        }
      }, 100); // Start background processing after 100ms
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const { min: minDate, max: maxDate } = getDateInputConstraints();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
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
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Complete Your Local Profile 🏠
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 dark:text-gray-300 font-medium">
              Just a few quick details to get you started. You can add more to your profile after joining!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h3>

                <div>
                  <Label className="text-gray-900 dark:text-white">Date of Birth *</Label>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    Can be hidden from public view later while still being used for matching
                  </div>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    min={minDate}
                    max={maxDate}
                    required
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Location Information</h3>

                <div>
                  <Label className="text-gray-900 dark:text-white">Hometown (Where you live) *</Label>
                  <SmartLocationInput
                    country={formData.hometownCountry}
                    city={formData.hometownCity}
                    state={formData.hometownState}
                    onLocationChange={(location) => {
                      // Handle LA Metro vs city logic - just use basic location data
                      setHometownScope("city");
                      setHometownMetro({});
                      
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
                  {hometownScope === 'metro' && hometownMetro.metroName && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Area: {hometownMetro.metroName} (Metro)
                    </div>
                  )}
                  {formData.hometownCity && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Hometown:</strong> {formData.hometownCity}
                        {formData.hometownState && `, ${formData.hometownState}`}
                        {formData.hometownCountry && `, ${formData.hometownCountry}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Choices */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Choices * (Choose at least 3)</h3>
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {formData.interests.length} selected
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Please choose 3 from the list below to better match with other locals and travelers. Once inside you can add more city specific events and activities.
                </p>

                {/* Quick action buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllTopChoices}
                    className="text-sm font-semibold bg-green-50 hover:bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:border-green-600 dark:text-green-300"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllTopChoices}
                    className="text-sm font-semibold bg-red-50 hover:bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-600 dark:text-red-300"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MOST_POPULAR_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium text-center transition-all ${
                        formData.interests.includes(interest)
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || formData.interests.length < 3}
                  className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {isLoading ? 'Creating Account... (This may take a few moments)' : `Complete Registration (${formData.interests.length}/3)`}
                </Button>
                {formData.interests.length < 3 && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    Please select at least {3 - formData.interests.length} more interest{3 - formData.interests.length !== 1 ? 's' : ''} to continue
                  </p>
                )}
                
                <Button
                  type="button"
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="w-full mt-3 bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300"
                >
                  Back to Landing Page
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}