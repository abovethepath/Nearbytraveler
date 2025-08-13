import { useState, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../App";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SmartLocationInput from "@/components/SmartLocationInput";
import { User, Plane, Building, ArrowRight, ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/logo";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "@/lib/travelOptions";

interface SignupData {
  // Step 1
  userType: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  name: string;
  
  // Step 2
  dateOfBirth: string;
  gender: string;
  bio: string;
  
  // Step 3 - Location
  hometownCity: string;
  hometownState: string;
  hometownCountry: string;
  currentCity: string;
  currentState: string;
  currentCountry: string;
  
  // Travel dates for current travelers
  travelStartDate: string;
  travelEndDate: string;
  
  // Step 4 - Preferences
  interests: string[];
  activities: string[];
  events: string[];
  languagesSpoken: string[];
  travelerTypes: string[];
  
  // Step 5 - Additional Info
  secretActivities: string;
  customInterests: string;
  customActivities: string;
  customEvents: string;
  isCurrentlyTraveling: boolean;
}

// User type options
const USER_TYPE_OPTIONS = ["traveler", "local", "business"];

// Base languages for selection
const BASE_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Dutch", "Russian", "Mandarin", "Japanese", "Korean", "Arabic",
  "Hindi", "Thai", "Vietnamese", "Swedish", "Norwegian", "Danish",
  "Polish", "Czech", "Hungarian", "Greek", "Turkish", "Hebrew"
];

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

export default function SignupSteps() {
  const [, setLocation] = useLocation();
  const { setUser } = useContext(AuthContext);
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState<SignupData>({
    userType: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    name: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    hometownCity: "",
    hometownState: "",
    hometownCountry: "",
    currentCity: "",
    currentState: "",
    currentCountry: "",
    travelStartDate: "",
    travelEndDate: "",
    interests: [],
    activities: [],
    events: [],
    languagesSpoken: [],
    travelerTypes: [],
    secretActivities: "",
    customInterests: "",
    customActivities: "",
    customEvents: "",
    isCurrentlyTraveling: false
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (user) => {
      localStorage.setItem('travelconnect_user', JSON.stringify(user));
      setUser(user);
      toast({
        title: "Account created successfully!",
        description: "Welcome to Nearby Traveler! Your profile has been created.",
      });
      setLocation('/profile');
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.userType || !formData.email || !formData.password || !formData.confirmPassword || !formData.username || !formData.name) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        return;
      }

      // After Step 1, redirect to appropriate signup form based on user type
      console.log('Redirecting with user type:', formData.userType);
      
      // Store the basic info in localStorage for the specific signup form
      localStorage.setItem('signup_data', JSON.stringify({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        username: formData.username,
        name: formData.name,
        userType: formData.userType
      }));

      // Redirect based on user type
      if (formData.userType === 'local') {
        console.log('Redirecting to local signup');
        setLocation('/signup/local');
      } else if (formData.userType === 'current_traveler') {
        console.log('Redirecting to local signup (travelers are locals with travel plans)');
        setLocation('/signup/local');
      } else if (formData.userType === 'business') {
        console.log('Redirecting to business signup');
        setLocation('/signup/business');
      } else {
        console.log('No user type selected or invalid type:', formData.userType);
      }
      return;
    }

    if (currentStep === 2) {
      // Validate step 2
      if (!formData.dateOfBirth || !formData.gender || !formData.bio) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate bio length
      if (formData.bio.length < 25) {
        toast({
          title: "Bio too short",
          description: "Bio must be at least 25 characters long.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate age
      const ageValidation = validateAge(formData.dateOfBirth);
      if (!ageValidation.isValid) {
        toast({
          title: "Age Validation",
          description: ageValidation.message,
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 3) {
      // Validate step 3
      if (!formData.hometownCity || !formData.hometownCountry) {
        toast({
          title: "Missing information",
          description: "Please fill in your hometown information.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 1) {
      // After Step 1, redirect to appropriate signup form based on user type
      console.log('Redirecting with user type:', formData.userType);
      
      // Store the basic info in localStorage for the specific signup form
      localStorage.setItem('signup_data', JSON.stringify({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        username: formData.username,
        name: formData.name,
        userType: formData.userType
      }));

      // Redirect based on user type
      if (formData.userType === 'local') {
        console.log('Redirecting to local signup');
        setLocation('/signup/local');
      } else if (formData.userType === 'current_traveler') {
        console.log('Redirecting to local signup (travelers are locals with travel plans)');
        setLocation('/signup/local');
      } else if (formData.userType === 'business') {
        console.log('Redirecting to business signup');
        setLocation('/signup/business');
      } else {
        console.log('No user type selected or invalid type:', formData.userType);
      }
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation
    if (formData.interests.length + formData.activities.length + formData.events.length < 2) {
      toast({
        title: "Missing preferences",
        description: "Please select at least 2 items from interests, activities, and events combined.",
        variant: "destructive",
      });
      return;
    }



    // Combine selected and custom preferences
    const allInterests = [...formData.interests];
    if (formData.customInterests) {
      allInterests.push(...formData.customInterests.split(',').map(item => item.trim()));
    }

    const allActivities = [...formData.activities];
    if (formData.customActivities) {
      allActivities.push(...formData.customActivities.split(',').map(item => item.trim()));
    }

    const allEvents = [...formData.events];
    if (formData.customEvents) {
      allEvents.push(...formData.customEvents.split(',').map(item => item.trim()));
    }

    // Prepare user data
    const userData = {
      ...formData,
      interests: allInterests,
      activities: allActivities,
      events: allEvents,
      location: `${formData.hometownCity}${formData.hometownState ? ', ' + formData.hometownState : ''}, ${formData.hometownCountry}`,
      currentLocation: formData.currentCity ? `${formData.currentCity}${formData.currentState ? ', ' + formData.currentState : ''}, ${formData.currentCountry}` : null,
      // CRITICAL: Map all field variations for backend compatibility
      currentTravelCity: formData.currentCity,
      currentTravelState: formData.currentState,
      currentTravelCountry: formData.currentCountry,
      travelDestinationCity: formData.currentCity,
      travelDestinationState: formData.currentState,
      travelDestinationCountry: formData.currentCountry,
      secretActivities: formData.secretActivities,
      secretLocalQuestion: formData.secretActivities
    };

    registerMutation.mutate(userData);
  };

  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="navbar" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join Nearby Traveler
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Connect with locals and travelers worldwide
          </p>
            </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

        {/* Step Content */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Tell Us About Yourself
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Let's start with the basics to create your profile
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* User Type Selection */}
                  <div>
                    <Label htmlFor="userType" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      I am a...
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {USER_TYPE_OPTIONS.map((type) => (
                        <Button
                      key={type}
                          type="button"
                          variant={formData.userType === type ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, userType: type })}
                          className={`h-12 sm:h-14 text-sm sm:text-base font-medium ${
                        formData.userType === type
                              ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white"
                              : "hover:from-blue-50 hover:to-orange-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {type === "traveler" && <Plane className="h-4 w-4 sm:h-5 sm:w-5" />}
                            {type === "local" && <Building className="h-4 w-4 sm:h-5 sm:w-5" />}
                            {type === "business" && <Building className="h-4 w-4 sm:h-5 sm:w-5" />}
                            <span className="capitalize">{type}</span>
                    </div>
                        </Button>
                  ))}
                    </div>
                </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <Label htmlFor="username" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <Label htmlFor="name" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your real name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword" className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth * (Can Be Hidden Later)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        setFormData({ ...formData, dateOfBirth: e.target.value });
                        // Validate age immediately
                        const validation = validateAge(e.target.value);
                        if (!validation.isValid && e.target.value) {
                          toast({
                            title: "Age Validation",
                            description: validation.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      min="1925-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="YYYY-MM-DD"
                      className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Trans Male">Trans Male</SelectItem>
                        <SelectItem value="Trans Female">Trans Female</SelectItem>
                        <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer Not To Say">Prefer Not To Say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio * (minimum 25 characters)</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself... (minimum 25 characters)"
                    className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.bio.length}/500 characters {formData.bio.length < 25 && `(minimum 25 required)`}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Location Information */}
            {currentStep === 3 && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 text-teal-700">Hometown Information</h3>
                  <SmartLocationInput
                    city={formData.hometownCity}
                    state={formData.hometownState}
                    country={formData.hometownCountry}
                    onLocationChange={(location) => {
                      setFormData({
                        ...formData,
                        hometownCity: location.city,
                        hometownState: location.state,
                        hometownCountry: location.country
                      });
                    }}
                    required={true}
                    label="Hometown"
                    placeholder={{
                      country: "Select country",
                      state: "Select state/region",
                      city: "Select city"
                    }}
                  />
                </div>

                {formData.userType === 'current_traveler' && (
                  <>
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-teal-700">Current Travel Destination</h3>
                      <SmartLocationInput
                        city={formData.currentCity}
                        state={formData.currentState}
                        country={formData.currentCountry}
                        onLocationChange={(location) => {
                          setFormData({
                            ...formData,
                            currentCity: location.city,
                            currentState: location.state,
                            currentCountry: location.country
                          });
                        }}
                        required={false}
                        label="Current Destination"
                        placeholder={{
                          country: "Select country",
                          state: "Select state/region",
                          city: "Select city"
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4 text-teal-700">Travel Dates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="travelStartDate">Travel Start Date *</Label>
                          <Input
                            id="travelStartDate"
                            type="date"
                            value={formData.travelStartDate}
                            onChange={(e) => setFormData({ ...formData, travelStartDate: e.target.value })}
                            required
                            min="1925-01-01"
                            max="9999-12-31"
                            className="calendar-white-icon"
                          />
                          <p className="text-xs text-gray-500 mt-1">Start date can be tomorrow or in the past</p>
                        </div>
                        <div>
                          <Label htmlFor="travelEndDate">Travel End Date *</Label>
                          <Input
                            id="travelEndDate"
                            type="date"
                            value={formData.travelEndDate}
                            onChange={(e) => setFormData({ ...formData, travelEndDate: e.target.value })}
                            required
                            min="1925-01-01"
                            max="9999-12-31"
                            className="calendar-white-icon"
                          />
                          <p className="text-xs text-gray-500 mt-1">End date can be anytime in the future</p>
                        </div>
                      </div>
                      {formData.travelStartDate && formData.travelEndDate && (
                        <div className="text-sm text-gray-600 mt-2">
                          Duration: {Math.ceil((new Date(formData.travelEndDate).getTime() - new Date(formData.travelStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 4: Preferences */}
            {currentStep === 4 && (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Travel Preferences</h3>
                  <div className="text-lg font-medium text-gray-700 mt-2">
                                         Choose at least 2 top choices to help with matching (more is better!)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current selections: {formData.interests.length + formData.activities.length + formData.events.length}/2 (minimum 2 required)
                  </div>
                </div>

                {/* Top Choices for Most Travelers */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-orange-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                    <span className="text-xl mr-2">⭐</span>
                    <h4 className="text-lg font-semibold text-gray-900">Top Choices for Most Locals and Travelers</h4>
                  </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const topChoices = [
                            "Single and Looking", "Coffee Culture", "Nightlife & Dancing", "Photography", 
                            "Meet Locals/Travelers", "Craft Beer & Breweries", "Local Food Specialties", "Hiking & Nature",
                            "City Tours & Sightseeing", "Street Art", "Cocktails & Bars", "Adventure Tours",
                            "Food Tours / Trucks", "Museums", "Rooftop Bars", "Local Hidden Gems",
                            "Beach Activities", "Fine Dining", "Yoga & Wellness", "Pub Crawls & Bar Tours",
                            "Walking Tours", "Happy Hour Deals", "Boat & Water Tours", "Brunch Spots",
                            "Live Music Venues", "Historical Tours", "Festivals & Events"
                          ];
                          const newInterests = [...new Set([...formData.interests, ...topChoices])];
                          setFormData({ ...formData, interests: newInterests });
                        }}
                        className="text-xs px-2 py-1"
                      >
                        Check All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const topChoices = [
                            "Single and Looking", "Coffee Culture", "Nightlife & Dancing", "Photography", 
                            "Meet Locals/Travelers", "Craft Beer & Breweries", "Local Food Specialties", "Hiking & Nature",
                            "City Tours & Sightseeing", "Street Art", "Cocktails & Bars", "Adventure Tours",
                            "Food Tours / Trucks", "Museums", "Rooftop Bars", "Local Hidden Gems",
                            "Beach Activities", "Fine Dining", "Yoga & Wellness", "Pub Crawls & Bar Tours",
                            "Walking Tours", "Happy Hour Deals", "Boat & Water Tours", "Brunch Spots",
                            "Live Music Venues", "Historical Tours", "Festivals & Events"
                          ];
                          const newInterests = formData.interests.filter(interest => !topChoices.includes(interest));
                          setFormData({ ...formData, interests: newInterests });
                        }}
                        className="text-xs px-2 py-1"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {[
                      "Single and Looking", "Coffee Culture", "Nightlife & Dancing", "Photography", 
                      "Meet Locals/Travelers", "Craft Beer & Breweries", "Local Food Specialties", "Hiking & Nature",
                      "City Tours & Sightseeing", "Street Art", "Cocktails & Bars", "Adventure Tours",
                      "Food Tours / Trucks", "Museums", "Rooftop Bars", "Local Hidden Gems",
                      "Beach Activities", "Fine Dining", "Yoga & Wellness", "Pub Crawls & Bar Tours",
                      "Walking Tours", "Happy Hour Deals", "Boat & Water Tours", "Brunch Spots",
                      "Live Music Venues", "Historical Tours", "Festivals & Events"
                    ].map(interest => (
                      <label key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={`top-interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, interests: [...formData.interests, interest] });
                            } else {
                              setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
                            }
                          }}
                        />
                        <Label htmlFor={`top-interest-${interest}`} className="text-sm font-semibold text-black">
                          {interest}
                        </Label>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">All Available Interests</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-blue-50 mb-4">
                    {getAllInterests().filter(interest => !interest.startsWith("**")).map((interest) => (
                      <div key={interest} className="flex items-center space-x-1">
                        <Checkbox
                          id={`interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.interests, interest, (newInterests) => 
                              setFormData({ ...formData, interests: newInterests })
                            )
                          }
                        />
                        <Label htmlFor={`interest-${interest}`} className="text-xs">{interest}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Input
                      placeholder="List Any Interest You have Not Found Above For Better Connections"
                      value={formData.customInterests}
                      onChange={(e) => setFormData({ ...formData, customInterests: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Activities</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50 mb-4">
                    {getAllActivities().map((activity) => (
                      <div key={activity} className="flex items-center space-x-1">
                        <Checkbox
                          id={`activity-${activity}`}
                          checked={formData.activities.includes(activity)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.activities, activity, (newActivities) => 
                              setFormData({ ...formData, activities: newActivities })
                            )
                          }
                        />
                        <Label htmlFor={`activity-${activity}`} className="text-xs">{activity}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Input
                      placeholder="List Any Activities You have Not Found Above For Better Connections"
                      value={formData.customActivities}
                      onChange={(e) => setFormData({ ...formData, customActivities: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-teal-700">Languages Spoken</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {BASE_LANGUAGES.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language}`}
                          checked={formData.languagesSpoken.includes(language)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.languagesSpoken, language, (newLanguages) => 
                              setFormData({ ...formData, languagesSpoken: newLanguages })
                            )
                          }
                        />
                        <Label htmlFor={`language-${language}`} className="text-xs">{language}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Final Details */}
            {currentStep === 5 && (
              <>
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Events</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50 mb-4">
                    {getAllEvents().map((event) => (
                      <div key={event} className="flex items-center space-x-1">
                        <Checkbox
                          id={`event-${event}`}
                          checked={formData.events.includes(event)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.events, event, (newEvents) => 
                              setFormData({ ...formData, events: newEvents })
                            )
                          }
                        />
                        <Label htmlFor={`event-${event}`} className="text-xs">{event}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Input
                      placeholder="List Any Events You have Not Found Above For Better Connections"
                      value={formData.customEvents}
                      onChange={(e) => setFormData({ ...formData, customEvents: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Final Details */}
            {currentStep === 5 && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 text-teal-700">Events</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {getAllEvents().map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={`event-${event}`}
                          checked={formData.events.includes(event)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.events, event, (newEvents) => 
                              setFormData({ ...formData, events: newEvents })
                            )
                          }
                        />
                        <Label htmlFor={`event-${event}`} className="text-xs">{event}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="customEvents">Custom Events</Label>
                    <Input
                      id="customEvents"
                      value={formData.customEvents}
                      onChange={(e) => setFormData({ ...formData, customEvents: e.target.value })}
                      placeholder="List Any Events You have Not Found Above For Better Connections"
                    />
                  </div>
                </div>

                {(formData.userType === 'current_traveler' || formData.userType === 'local') && (
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-teal-700">Currently Traveling?</h3>
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCurrentlyTraveling"
                          checked={formData.isCurrentlyTraveling}
                          onCheckedChange={(checked) => setFormData({ ...formData, isCurrentlyTraveling: !!checked })}
                        />
                        <Label htmlFor="isCurrentlyTraveling">Yes, I am currently traveling</Label>
                      </div>
                    </div>
                    
                    {formData.isCurrentlyTraveling && (
                      <div>
                        <h4 className="text-md font-medium mb-2 text-teal-600">Traveler Type</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {BASE_TRAVELER_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`traveler-${type}`}
                            checked={formData.travelerTypes.includes(type)}
                            onCheckedChange={() => 
                              toggleArrayValue(formData.travelerTypes, type, (newTypes) => 
                                setFormData({ ...formData, travelerTypes: newTypes })
                              )
                            }
                          />
                          <Label htmlFor={`traveler-${type}`} className="text-xs">{type}</Label>
                        </div>
                      ))}
                        </div>
                      </div>
                    )}
                  </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center justify-center space-x-2 h-12 sm:h-14 text-base sm:text-lg order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Back</span>
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 flex items-center justify-center space-x-2 h-12 sm:h-14 text-base sm:text-lg order-1 sm:order-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 flex items-center justify-center space-x-2 h-12 sm:h-14 text-base sm:text-lg order-1 sm:order-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Create Profile</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}