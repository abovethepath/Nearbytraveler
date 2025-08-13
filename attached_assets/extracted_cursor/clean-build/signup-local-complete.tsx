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
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "@/lib/travelOptions";
import { validateCustomInput, filterCustomEntries } from "@/lib/contentFilter";
import { AuthContext } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { authStorage } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES } from "@/lib/formConstants";
import { calculateAge, formatDateOfBirthForInput, validateDateInput, getDateInputConstraints } from "@/lib/ageUtils";

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

  // Helper functions to match travelers signup exactly
  const getTotalSelections = () => {
    return formData.interests.length + formData.activities.length + formData.events.length;
  };

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
          password: accountData.password || ''
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
      if (!finalFormData.name) missingFields.push("Full Name");  // Fixed to use finalFormData.name
      
      // Validate username and password lengths
      if (finalFormData.username && finalFormData.username.length < 6) {
        toast({
          title: "Username Too Short",
          description: "Username must be at least 6 characters long.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (finalFormData.password && finalFormData.password.length < 8) {
        toast({
          title: "Password Too Short", 
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      if (!formData.dateOfBirth) missingFields.push("Date of Birth");
      if (!formData.hometownCity) missingFields.push("Hometown City");
      if (!formData.hometownCountry) missingFields.push("Hometown Country");
      if (formData.sexualPreference.length === 0) missingFields.push("Sexual Preference");

      if (missingFields.length > 0) {
        console.log('🚨 SIGNUP BLOCKED - Missing fields:', missingFields);
        console.log('🔍 DEBUG INFO:', {
          dateOfBirth: formData.dateOfBirth,
          hometownCity: formData.hometownCity,
          hometownCountry: formData.hometownCountry,
          sexualPreference: formData.sexualPreference,
          email: finalFormData.email,
          username: finalFormData.username,
          name: finalFormData.name,
          password: finalFormData.password ? 'SET' : 'MISSING'
        });
        
        toast({
          title: "Missing Required Information",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const totalSelections = formData.interests.length + formData.activities.length + formData.events.length + formData.languagesSpoken.length;
      if (totalSelections < 10) {
        toast({
          title: "More selections needed",
          description: "Please choose at least 10 total items from interests, activities, events, and languages combined.",
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

      // Bio length validation
      if (formData.bio.length < 50) {
        toast({
          title: "Bio too short",
          description: "Your bio must be at least 50 characters long.",
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
        bio: formData.bio,
        hometownCountry: formData.hometownCountry,
        hometownCity: formData.hometownCity,
        hometownState: formData.hometownState,
        location: formData.hometownState
          ? `${formData.hometownCity}, ${formData.hometownState}, ${formData.hometownCountry}`
          : `${formData.hometownCity}, ${formData.hometownCountry}`,
        interests: formData.interests,
        activities: formData.activities,
        events: formData.events,
        languagesSpoken: formData.languagesSpoken,
        sexualPreference: formData.sexualPreference,

        isVeteran: formData.isVeteran,
        isActiveDuty: formData.isActiveDuty,
        travelingWithChildren: formData.travelingWithChildren
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

        // Force a page refresh to ensure authentication state is fully loaded
        setTimeout(() => {
          window.location.href = '/profile';
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

  // Toggle functions for selections
  const toggleItem = (category: keyof typeof formData, item: string) => {
    if (Array.isArray(formData[category])) {
      const currentArray = formData[category] as string[];
      setFormData(prev => ({
        ...prev,
        [category]: currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item]
      }));
    }
  };

  const removeItem = (category: keyof typeof formData, item: string) => {
    if (Array.isArray(formData[category])) {
      const currentArray = formData[category] as string[];
      setFormData(prev => ({
        ...prev,
        [category]: currentArray.filter(i => i !== item)
      }));
    }
  };

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
              Connect and match with Nearby Locals and Nearby Travelers
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h3>

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
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i) => {
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
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 31}, (_, i) => {
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
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 80}, (_, i) => {
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
                      <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600">
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

                <div>
                  <Label className="text-gray-900 dark:text-white">Sexual Preference * (Select all that apply)</Label>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    {PRIVACY_NOTES.SEXUAL_PREFERENCE}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                      <div key={preference} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sexual-${preference}`}
                          checked={formData.sexualPreference.includes(preference)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                sexualPreference: [...prev.sexualPreference, preference]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                sexualPreference: prev.sexualPreference.filter(p => p !== preference)
                              }));
                            }
                          }}
                          className="border-2 border-gray-300 dark:border-gray-600"
                        />
                        <Label 
                          htmlFor={`sexual-${preference}`}
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          {preference}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.sexualPreference.length === 0 && (
                    <div className="text-red-500 text-sm mt-2">Please select at least one sexual preference</div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-white">Bio *</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Minimum 50 characters, maximum 500 characters
                  </div>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your area, local interests, and what makes you a great local guide..."
                    rows={4}
                    maxLength={500}
                    required
                    minLength={50}
                    className={`${
                      formData.bio.length > 0 && formData.bio.length < 50 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.bio.length >= 50 
                        ? 'border-green-500 focus:border-green-500' 
                        : ''
                    }`}
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className={`${
                      formData.bio.length < 50 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formData.bio.length < 50 
                        ? `Need ${50 - formData.bio.length} more characters` 
                        : 'Minimum requirement met'}
                    </span>
                    <span className={`${
                      formData.bio.length > 450 
                        ? 'text-orange-600' 
                        : 'text-gray-500'
                    }`}>
                      {formData.bio.length}/500 characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Location Information</h3>

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



              {/* Connection Preferences Section */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Connection Preferences</h3>
                  <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                    <strong>Quick Setup:</strong> Choose 10+ items below to match with locals and travelers who share your interests. You can update these anytime later.
                  </div>
                  <div className="text-center mt-4">
                    <div className={`text-lg font-bold ${getTotalSelections() >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                      Current selections: {getTotalSelections()}/10 minimum
                    </div>
                    {getTotalSelections() < 10 && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select more items for better matching
                      </p>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Interests</h3>

                {/* Most Popular Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 text-lg">⭐</span>
                        <h4 className="text-white font-bold text-lg">Top Choices for Most Locals and Travelers</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllTopChoices}
                          className="px-3 py-1 bg-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors"
                          data-testid="button-select-all-top-choices"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllTopChoices}
                          className="px-3 py-1 bg-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors"
                          data-testid="button-clear-all-top-choices"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {MOST_POPULAR_INTERESTS.map((interest: string) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleItem('interests', interest)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            formData.interests.includes(interest)
                              ? 'bg-white text-blue-600 font-bold transform scale-105'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                          data-testid={`button-top-choice-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Interests */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">Additional Interests</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {ADDITIONAL_INTERESTS.map((interest: string) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleItem('interests', interest)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.interests.includes(interest)
                            ? 'bg-blue-600 text-white font-bold transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                        data-testid={`button-additional-choice-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected interests display */}
                {formData.interests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected ({formData.interests.length}):</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest) => (
                        <div
                          key={interest}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 dark:bg-blue-900 dark:text-blue-200"
                        >
                          <span>{interest}</span>
                          <button
                            type="button"
                            onClick={() => removeItem('interests', interest)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 font-bold text-lg"
                            data-testid={`button-remove-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom interest input */}
                <div>
                  <Label className="text-gray-900 dark:text-white">Add Custom Interest</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.customInterestInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, customInterestInput: e.target.value }))}
                      placeholder="Type a custom interest..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addCustomItem('interest', formData.customInterestInput, () => 
                          setFormData(prev => ({ ...prev, customInterestInput: '' }))
                        );
                      }}
                      disabled={!formData.customInterestInput.trim()}
                      className="px-6"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

                {/* Activities */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activities</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getAllActivities().map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() => toggleItem('activities', activity)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.activities.includes(activity)
                            ? 'bg-green-600 text-white font-bold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>

                  {formData.activities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected ({formData.activities.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.activities.map((activity) => (
                          <div
                            key={activity}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 dark:bg-green-900 dark:text-green-200"
                          >
                            <span>{activity}</span>
                            <button
                              type="button"
                              onClick={() => removeItem('activities', activity)}
                              className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100 font-bold text-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 dark:text-white">Add Custom Activity</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.customActivityInput}
                        onChange={(e) => setFormData(prev => ({ ...prev, customActivityInput: e.target.value }))}
                        placeholder="Type a custom activity..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addCustomItem('activity', formData.customActivityInput, () => 
                            setFormData(prev => ({ ...prev, customActivityInput: '' }))
                          );
                        }}
                        disabled={!formData.customActivityInput.trim()}
                        className="px-6"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Events</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getAllEvents().map((event) => (
                      <button
                        key={event}
                        type="button"
                        onClick={() => toggleItem('events', event)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.events.includes(event)
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>

                  {formData.events.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected ({formData.events.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.events.map((event) => (
                          <div
                            key={event}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 dark:bg-purple-900 dark:text-purple-200"
                          >
                            <span>{event}</span>
                            <button
                              type="button"
                              onClick={() => removeItem('events', event)}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100 font-bold text-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 dark:text-white">Add Custom Event</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.customEventInput}
                        onChange={(e) => setFormData(prev => ({ ...prev, customEventInput: e.target.value }))}
                        placeholder="Type a custom event..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addCustomItem('event', formData.customEventInput, () => 
                            setFormData(prev => ({ ...prev, customEventInput: '' }))
                          );
                        }}
                        disabled={!formData.customEventInput.trim()}
                        className="px-6"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Languages Spoken</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getAllLanguages().map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => toggleItem('languagesSpoken', language)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.languagesSpoken.includes(language)
                            ? 'bg-orange-600 text-white font-bold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>

                  {formData.languagesSpoken.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected ({formData.languagesSpoken.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.languagesSpoken.map((language) => (
                          <div
                            key={language}
                            className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 dark:bg-orange-900 dark:text-orange-200"
                          >
                            <span>{language}</span>
                            <button
                              type="button"
                              onClick={() => removeItem('languagesSpoken', language)}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100 font-bold text-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 dark:text-white">Add Custom Language</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.customLanguages}
                        onChange={(e) => setFormData(prev => ({ ...prev, customLanguages: e.target.value }))}
                        placeholder="Type a custom language..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addCustomItem('language', formData.customLanguages, () => 
                            setFormData(prev => ({ ...prev, customLanguages: '' }))
                          );
                        }}
                        disabled={!formData.customLanguages.trim()}
                        className="px-6"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Additional Information</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="veteran"
                      checked={formData.isVeteran}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeteran: !!checked }))}
                      className="border-2 border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="veteran" className="text-gray-900 dark:text-white">
                      I am a military veteran
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activeDuty"
                      checked={formData.isActiveDuty}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActiveDuty: !!checked }))}
                      className="border-2 border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="activeDuty" className="text-gray-900 dark:text-white">
                      I am active duty military
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travelingWithChildren"
                      checked={formData.travelingWithChildren}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travelingWithChildren: !!checked }))}
                      className="border-2 border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="travelingWithChildren" className="text-gray-900 dark:text-white">
                      I often host or engage with travelers who have children
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || getTotalSelections() < 10}
                  className={`w-full py-4 text-xl font-bold rounded-xl transition-all duration-200 ${
                    getTotalSelections() >= 10
                      ? 'bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3 inline-block"></div>
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      Complete Registration & Join the Community
                    </>
                  )}
                </Button>

                {getTotalSelections() < 10 && (
                  <p className="text-red-600 text-sm mt-2">
                    Please select at least {10 - getTotalSelections()} more items to continue
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