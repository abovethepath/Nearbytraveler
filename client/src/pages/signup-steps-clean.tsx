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
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";

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
  
  // Step 5 - Additional Info (without secret activities)
  isCurrentlyTraveling: boolean;
}

const validateAge = (dateString: string): { isValid: boolean; message: string } => {
  if (!dateString) return { isValid: false, message: "Date of birth is required" };
  const age = calculateAge(dateString);
  if (age < 18) return { isValid: false, message: "You must be at least 18 years old to join" };
  if (age > 120) return { isValid: false, message: "Please enter a valid date of birth" };
  return { isValid: true, message: "" };
};

const calculateAge = (dateString: string): number => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const BASE_LANGUAGES = getAllLanguages();

// Define the top choices that appear in the special section
const TOP_CHOICES = [
  "Single and Looking", "Coffee Culture", "Nightlife & Dancing", "Photography", 
  "Meet Locals/Travelers", "Craft Beer & Breweries", "Local Food Specialties", "Hiking & Nature",
  "City Tours & Sightseeing", "Street Art", "Cocktails & Bars", "Adventure Tours",
  "Food Tours / Trucks", "Museums", "Rooftop Bars", "Local Hidden Gems",
  "Beach Activities", "Fine Dining", "Yoga & Wellness", "Pub Crawls & Bar Tours",
  "Walking Tours", "Happy Hour Deals", "Boat & Water Tours", "Brunch Spots",
  "Live Music Venues", "Historical Tours", "Festivals & Events"
];

export default function SignupStepsClean() {
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
    isCurrentlyTraveling: false
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Welcome to Nearby Traveler! Your profile has been created.",
        variant: "default",
      });
      
      // Set user context
      if (data.user) {
        setUser(data.user);
      }
      
      // Redirect to getting started or home
      setLocation('/getting-started');
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    setter(newArray);
  };

  const selectAllTopChoices = () => {
    const combinedChoices = [...new Set([...formData.interests, ...TOP_CHOICES])];
    setFormData({ ...formData, interests: combinedChoices });
  };

  const clearAllTopChoices = () => {
    const filteredChoices = formData.interests.filter(interest => !TOP_CHOICES.includes(interest));
    setFormData({ ...formData, interests: filteredChoices });
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.userType || !formData.email || !formData.password || 
            !formData.confirmPassword || !formData.username || !formData.name) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return false;
        }
        if (formData.password.length < 8) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 8 characters long.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 2:
        if (!formData.dateOfBirth || !formData.gender || !formData.bio) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        const ageValidation = validateAge(formData.dateOfBirth);
        if (!ageValidation.isValid) {
          toast({
            title: "Age Validation",
            description: ageValidation.message,
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 3:
        if (!formData.hometownCity || !formData.hometownState || !formData.hometownCountry) {
          toast({
            title: "Missing Information",
            description: "Please provide your hometown information.",
            variant: "destructive",
          });
          return false;
        }
        if (formData.userType === 'current_traveler') {
          if (!formData.travelStartDate || !formData.travelEndDate) {
            toast({
              title: "Missing Travel Dates",
              description: "Please provide your travel start and end dates.",
              variant: "destructive",
            });
            return false;
          }
          if (new Date(formData.travelStartDate) > new Date(formData.travelEndDate)) {
            toast({
              title: "Invalid Travel Dates",
              description: "Travel start date must be before end date.",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;

      case 4:
        const totalSelections = formData.interests.length + formData.activities.length + formData.events.length;
        if (totalSelections < 10) {
          toast({
            title: "Not Enough Selections",
            description: `Please select at least 10 items from the preference lists. Currently: ${totalSelections}/10`,
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 5:
        // No validation needed for step 5 since we removed secret activities
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    const userData = {
      userType: formData.userType,
      email: formData.email,
      password: formData.password,
      username: formData.username,
      name: formData.name,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      bio: formData.bio,
      hometownCity: formData.hometownCity,
      hometownState: formData.hometownState,
      hometownCountry: formData.hometownCountry,
      currentCity: formData.currentCity,
      currentState: formData.currentState,
      currentCountry: formData.currentCountry,
      travelStartDate: formData.travelStartDate,
      travelEndDate: formData.travelEndDate,
      interests: formData.interests,
      activities: formData.activities,
      events: formData.events,
      languagesSpoken: formData.languagesSpoken,
      travelerTypes: formData.travelerTypes,
      isCurrentlyTraveling: formData.isCurrentlyTraveling
    };

    registerMutation.mutate(userData);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Account Information";
      case 2: return "Personal Details";
      case 3: return "Location Information";
      case 4: return "Your Preferences";
      case 5: return "Final Details";
      default: return "Sign Up";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Join Nearby Traveler
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mt-2">
            Connect with locals and fellow travelers
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm sm:text-base font-medium text-teal-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm sm:text-base font-medium text-teal-600">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-center text-teal-700">
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-center text-base sm:text-lg">
              {currentStep === 1 && "Create your account"}
              {currentStep === 2 && "Tell us about yourself"}
              {currentStep === 3 && "Where are you from and going?"}
              {currentStep === 4 && "What are you interested in?"}
              {currentStep === 5 && "Almost done!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <>
                {/* User Type Selection */}
                <div>
                  <Label className="text-base sm:text-lg font-medium">I am a *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.userType === 'local' 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-300 hover:border-teal-300'
                      }`}
                      onClick={() => setFormData({ ...formData, userType: 'local' })}
                    >
                      <div className="text-center">
                        <User className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <h3 className="font-medium text-sm sm:text-base">Local</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Show travelers my city</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.userType === 'current_traveler' 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-300 hover:border-teal-300'
                      }`}
                      onClick={() => setFormData({ ...formData, userType: 'current_traveler' })}
                    >
                      <div className="text-center">
                        <Plane className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <h3 className="font-medium text-sm sm:text-base">Traveler</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Currently traveling</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.userType === 'business' 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-300 hover:border-teal-300'
                      }`}
                      onClick={() => setFormData({ ...formData, userType: 'business' })}
                    >
                      <div className="text-center">
                        <Building className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <h3 className="font-medium text-sm sm:text-base">Business</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Serve travelers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="name" className="text-base sm:text-lg font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-base sm:text-lg font-medium">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Choose a username"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-base sm:text-lg font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="password" className="text-base sm:text-lg font-medium">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-base sm:text-lg font-medium">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-base sm:text-lg font-medium">Date of Birth * (Can Be Hidden Later)</Label>
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
                      className="h-12 sm:h-14 text-base sm:text-lg [&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-base sm:text-lg font-medium">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg">
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
                  <Label htmlFor="bio" className="text-base sm:text-lg font-medium">Bio *</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 sm:p-4 text-base sm:text-lg border border-gray-300 rounded-md min-h-[100px] sm:min-h-[120px]"
                  />
                </div>
              </>
            )}

            {/* Step 3: Location Information */}
            {currentStep === 3 && (
              <>
                <div>
                  <h3 className="text-xl sm:text-2xl font-medium mb-4 text-teal-700">Hometown Information</h3>
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
                      <h3 className="text-xl sm:text-2xl font-medium mb-4 text-teal-700">Current Travel Destination</h3>
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
                      <h3 className="text-xl sm:text-2xl font-medium mb-4 text-teal-700">Travel Dates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="travelStartDate" className="text-base sm:text-lg font-medium">Travel Start Date *</Label>
                          <Input
                            id="travelStartDate"
                            type="date"
                            value={formData.travelStartDate}
                            onChange={(e) => setFormData({ ...formData, travelStartDate: e.target.value })}
                            required
                            min="1925-01-01"
                            max="9999-12-31"
                            className="h-12 sm:h-14 text-base sm:text-lg calendar-white-icon"
                          />
                          <p className="text-sm sm:text-base text-gray-500 mt-1">Start date can be tomorrow or in the past</p>
                        </div>
                        <div>
                          <Label htmlFor="travelEndDate" className="text-base sm:text-lg font-medium">Travel End Date *</Label>
                          <Input
                            id="travelEndDate"
                            type="date"
                            value={formData.travelEndDate}
                            onChange={(e) => setFormData({ ...formData, travelEndDate: e.target.value })}
                            required
                            min="1925-01-01"
                            max="9999-12-31"
                            className="h-12 sm:h-14 text-base sm:text-lg calendar-white-icon"
                          />
                          <p className="text-sm sm:text-base text-gray-500 mt-1">End date can be anytime in the future</p>
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
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Your Travel Preferences</h3>
                  <div className="text-base sm:text-lg font-medium text-gray-700 mt-2">
                    Minimum: To better match others on this site, choose at least 10 from the following next 4 lists (top choices, interests, activities, events)
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 mt-1">
                    Current selections: {formData.interests.length + formData.activities.length + formData.events.length}/10
                  </div>
                </div>

                {/* Top Choices for Most Travelers */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-orange-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">⭐</span>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">Top Choices for Most Locals and Travelers</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={selectAllTopChoices}
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        data-testid="button-select-all-top-choices"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        onClick={clearAllTopChoices}
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        data-testid="button-clear-all-top-choices"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {TOP_CHOICES.map((interest) => (
                      <div key={interest} className="flex items-center space-x-1">
                        <Checkbox
                          id={`top-interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => 
                            toggleArrayValue(formData.interests, interest, (newInterests) => 
                              setFormData({ ...formData, interests: newInterests })
                            )
                          }
                          data-testid={`checkbox-top-choice-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <Label htmlFor={`top-interest-${interest}`} className="text-xs font-semibold text-black">
                          {interest}
                        </Label>
                      </div>
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
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Activities</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50 mb-4">
                    {getAllActivities().filter(activity => !activity.startsWith("**")).map((activity) => (
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
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Events</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-purple-50 mb-4">
                    {getAllEvents().filter(event => !event.startsWith("**")).map((event) => (
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
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Languages Spoken</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-yellow-50">
                    {BASE_LANGUAGES.map((language) => (
                      <div key={language} className="flex items-center space-x-1">
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

            {/* Step 5: Additional Info */}
            {currentStep === 5 && (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Almost Done!</h3>
                  <p className="text-base sm:text-lg text-gray-600 mt-2">
                    Just a few final details to complete your profile
                  </p>
                </div>

                {/* Currently Traveling Status */}
                {formData.userType === 'local' && (
                  <div>
                    <h4 className="text-lg font-medium mb-3 text-teal-600">Travel Status</h4>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="isCurrentlyTraveling"
                        checked={formData.isCurrentlyTraveling}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, isCurrentlyTraveling: !!checked })
                        }
                      />
                      <Label htmlFor="isCurrentlyTraveling">Yes, I am currently traveling</Label>
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

                <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                  <h4 className="text-lg font-semibold text-teal-800 mb-2">Ready to Join!</h4>
                  <p className="text-sm text-teal-700">
                    Click "Create Profile" below to complete your registration and start connecting with locals and travelers.
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 1}
                className="h-12 sm:h-14 text-base sm:text-lg flex items-center space-x-2 order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="h-12 sm:h-14 text-base sm:text-lg bg-teal-600 hover:bg-teal-700 flex items-center space-x-2 order-1 sm:order-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 flex items-center space-x-2 order-1 sm:order-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
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