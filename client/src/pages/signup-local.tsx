import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "../../../shared/base-options";
import { validateCustomInput, filterCustomEntries } from "@/lib/contentFilter";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import { GENDER_OPTIONS } from "@/lib/formConstants";
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

export default function SignupLocal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    // Basic info (from account signup)
    name: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",

    // Page 2 - Personal info
    dateOfBirth: "",
    gender: "",
    hometownCity: "",
    hometownState: "",
    hometownCountry: "United States",

    // Preferences
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[],
    languages: [] as string[],
    
    // Custom entries
    customInterests: "",
    customActivities: "",
    customEvents: "",
    customLanguages: "",
    
    // Bio
    bio: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customEvent, setCustomEvent] = useState("");

  // Helper functions to match traveling signup exactly
  const getTotalSelections = () => {
    return formData.interests.length + formData.activities.length + formData.events.length;
  };

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(item)) {
      updateField(field, currentArray.filter(i => i !== item));
    } else {
      updateField(field, [...currentArray, item]);
    }
  };

  const handleAddCustomEvent = () => {
    if (!customEvent.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event name",
        variant: "destructive"
      });
      return;
    }

    const validationResult = validateCustomInput(customEvent.trim());
    if (!validationResult.isValid) {
      toast({
        title: "Invalid Input",
        description: validationResult.message,
        variant: "destructive"
      });
      return;
    }

    const cleanedInput = filterCustomEntries([customEvent.trim()])[0];
    if (cleanedInput && !formData.events.includes(cleanedInput)) {
      updateField('events', [...formData.events, cleanedInput]);
      setCustomEvent("");
      toast({
        title: "Event Added",
        description: `"${cleanedInput}" has been added to your events.`
      });
    }
  };

  // Load account data from sessionStorage
  useEffect(() => {
    console.log('🏠 LOCAL SIGNUP - Loading account data');
    const storedAccountData = sessionStorage.getItem('accountData');

    let accountData: any = { email: '', password: '', username: '', name: '', phoneNumber: '' };

    if (storedAccountData) {
      try {
        accountData = JSON.parse(storedAccountData);
        console.log('✅ Retrieved account data from sessionStorage:', accountData);
      } catch (error) {
        console.error('❌ Error parsing stored account data:', error);
      }
    }

    // Pre-fill account data
    setFormData(prev => ({
      ...prev,
      email: accountData.email || "",
      password: accountData.password || "",
      username: accountData.username || "",
      name: accountData.name || "",
      phoneNumber: accountData.phoneNumber || ""
    }));
  }, []);

  const handleSubmit = async () => {
    // Basic validations
    if (getTotalSelections() < 3) {
      toast({
        title: "Selection Required",
        description: "Please select at least 3 total items from interests, activities, and events.",
        variant: "destructive"
      });
      return;
    }

    if (formData.languages.length === 0) {
      toast({
        title: "Language Required",
        description: "Please select at least one language.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.hometownCity || !formData.hometownState) {
      toast({
        title: "Location Required",
        description: "Please enter your hometown city and state.",
        variant: "destructive"
      });
      return;
    }

    const ageValidation = validateAge(formData.dateOfBirth);
    if (!ageValidation.isValid) {
      toast({
        title: "Invalid Date of Birth",
        description: ageValidation.message,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get account data from sessionStorage
      const storedAccountData = sessionStorage.getItem('accountData');
      let accountData: any = { email: '', password: '', username: '', name: '', phoneNumber: '' };

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
        phoneNumber: accountData.phoneNumber || ''
      };

      // Helper functions for clean data
      const safeJoin = (parts: (string | undefined | null)[]) =>
        parts.filter(Boolean).map(s => String(s).trim()).filter(s => s.length).join(", ");

      const parseCustomCSV = (input: string) =>
        input ? input.split(",").map(s => s.trim()).filter(Boolean) : [];

      // Merge custom languages into languagesSpoken
      const customLangs = parseCustomCSV(formData.customLanguages);
      const languagesSpoken = Array.from(new Set([...customLangs]));

      // Build normalized location strings
      const hometown = safeJoin([formData.hometownCity, formData.hometownState, formData.hometownCountry]);
      const location = hometown;

      // Prepare registration data with clean field mapping
      const registrationData = {
        // SIMPLE: Just set as local 
        userType: "local",
        isCurrentlyTraveling: false,

        // account data
        email: (finalFormData.email || "").toLowerCase().trim(),
        password: (finalFormData.password || "").trim(),
        username: (finalFormData.username || "").toLowerCase().trim(),
        name: (finalFormData.name || "").trim(),
        phoneNumber: (finalFormData.phoneNumber || "").trim(),

        // profile
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bio: formData.bio.trim(),
        
        // hometown/location
        hometownCity: formData.hometownCity.trim(),
        hometownState: formData.hometownState?.trim() || "",
        hometownCountry: formData.hometownCountry.trim(),
        hometown,
        location,

        // preferences
        interests: formData.interests,
        activities: formData.activities,
        events: formData.events,
        languages: formData.languages,
        languagesSpoken,

        // custom entries
        customInterests: formData.customInterests,
        customActivities: formData.customActivities,
        customEvents: formData.customEvents,
        customLanguages: formData.customLanguages
      };

      console.log('🚀 LOCAL SIGNUP - Submitting registration:', registrationData);

      const response = await apiRequest('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Set user in auth storage and context immediately 
      authStorage.setUser(data);
      setUser(data);
      
      // Clear signup data
      sessionStorage.removeItem('accountData');
      
      console.log("✅ LOCAL SIGNUP - User registered successfully:", data.username, data.id);
      
      toast({
        title: "Welcome to Nearby Traveler!",
        description: "Your local profile has been created successfully."
      });

      // Redirect to home
      setLocation('/home');
      
    } catch (error: any) {
      console.error('❌ LOCAL SIGNUP - Registration failed:', error);
      
      // Handle specific error cases
      if (error.message?.includes('email') || error.message?.includes('Email')) {
        toast({
          title: "Email Already Exists",
          description: "An account with this email already exists. Please use a different email or try logging in.",
          variant: "destructive"
        });
      } else if (error.message?.includes('username') || error.message?.includes('Username')) {
        toast({
          title: "Username Taken",
          description: "This username is already taken. Please choose a different username.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create your account. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="w-full shadow-2xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-orange-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold mb-2">
              🏠 Complete Your Nearby Local Profile
            </CardTitle>
            <CardDescription className="text-orange-100 text-lg">
              Connect with travelers and locals in your area
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        {...getDateInputConstraints()}
                        className="mt-1"
                        required
                        data-testid="input-dateOfBirth"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium">Gender (Optional)</Label>
                      <select
                        id="gender"
                        className="w-full h-10 px-3 py-2 mt-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value={formData.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        data-testid="select-gender"
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Your Hometown *</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          placeholder="City"
                          value={formData.hometownCity}
                          onChange={(e) => updateField('hometownCity', e.target.value)}
                          className="focus:ring-orange-500"
                          data-testid="input-hometown-city"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="State"
                          value={formData.hometownState}
                          onChange={(e) => updateField('hometownState', e.target.value)}
                          className="focus:ring-orange-500"
                          data-testid="input-hometown-state"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About You</h3>
                  <textarea
                    className="w-full min-h-32 px-3 py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself, your interests, or what you love about your city..."
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    maxLength={500}
                    data-testid="textarea-bio"
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {formData.bio.length}/500 characters
                  </div>
                </div>
              </div>

              {/* Right Column - Preferences */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Interests *</h3>
                    <span className="text-sm font-medium px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                      {getTotalSelections()}/3 minimum
                    </span>
                  </div>

                  {/* Interests */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">🎯 Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {MOST_POPULAR_INTERESTS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleArrayItem('interests', interest)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.interests.includes(interest)
                              ? 'bg-orange-500 text-white shadow-md scale-105'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                          }`}
                          data-testid={`interest-${interest}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">🏃 Activities</h4>
                    <div className="flex flex-wrap gap-2">
                      {getAllActivities().slice(0, 15).map((activity) => (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => toggleArrayItem('activities', activity)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.activities.includes(activity)
                              ? 'bg-blue-500 text-white shadow-md scale-105'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          data-testid={`activity-${activity}`}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">🎉 Events & Entertainment</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getAllEvents().slice(0, 12).map((event) => (
                        <button
                          key={event}
                          type="button"
                          onClick={() => toggleArrayItem('events', event)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.events.includes(event)
                              ? 'bg-purple-500 text-white shadow-md scale-105'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                          data-testid={`event-${event}`}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom event input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom event"
                        value={customEvent}
                        onChange={(e) => setCustomEvent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomEvent()}
                        className="focus:ring-purple-500"
                        data-testid="input-custom-event"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddCustomEvent}
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        data-testid="button-add-custom-event"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">🗣️ Languages * (Select at least 1)</h4>
                    <div className="flex flex-wrap gap-2">
                      {getAllLanguages().map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => toggleArrayItem('languages', language)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.languages.includes(language)
                              ? 'bg-green-500 text-white shadow-md scale-105'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300'
                          }`}
                          data-testid={`language-${language}`}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || getTotalSelections() < 3 || formData.languages.length === 0}
                className="w-full max-w-md bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white py-4 text-lg font-semibold shadow-lg"
                data-testid="button-complete-signup"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Your Account...
                  </div>
                ) : (
                  "🎉 Complete Signup & Join Nearby Traveler"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}