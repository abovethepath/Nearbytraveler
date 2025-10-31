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
import { MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, TOP_CHOICES, getAllActivities, getAllLanguages, validateSelections } from "@shared/base-options";
import { BASE_TRAVELER_TYPES } from "@shared/base-options";

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
  isCurrentlyTraveling: boolean;
}

const validateAge = (dateString: string): { isValid: boolean; message?: string } => {
  if (!dateString) return { isValid: false, message: "Date of birth is required" };
  
  const today = new Date();
  const birthDate = new Date(dateString);
  
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, message: "Please enter a valid date of birth" };
  }
  
  if (birthDate > today) {
    return { isValid: false, message: "Date of birth cannot be in the future" };
  }
  
  const age = calculateAge(dateString);
  if (age < 18) {
    return { isValid: false, message: "You must be at least 18 years old to join" };
  }
  
  return { isValid: true };
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
          description: "Password must be 8 characters or more.",
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
      } else if (formData.userType === 'traveler') {
        console.log('Processing traveler signup - staying in main flow');
        // Stay in the main signup flow to capture traveler data
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
      } else if (formData.userType === 'traveler') {
        console.log('Processing traveler signup - staying in main flow');
        // Stay in the main signup flow to capture traveler data
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
    if (formData.interests.length + formData.activities.length + formData.events.length < 7) {
      toast({
        title: "Missing preferences",
        description: "Please select at least 7 items from interests, activities, and events combined.",
        variant: "destructive",
      });
      return;
    }



    // Use selected preferences directly
    const allInterests = [...formData.interests];
    const allActivities = [...formData.activities];
    const allEvents = [...formData.events];

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
      secretLocalQuestion: formData.secretActivities,
      // CRITICAL FIX: Set traveler status when user type is traveler
      isCurrentlyTraveling: formData.userType === 'traveler' ? true : formData.isCurrentlyTraveling
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

  // Select All function for Top Choices sections
  const selectAllTopChoices = () => {
    const newInterests = TOP_CHOICES.filter(item => !formData.interests.includes(item));
    setFormData({
      ...formData,
      interests: [...formData.interests, ...newInterests]
    });
  };

  // Clear All function for Top Choices sections
  const clearAllTopChoices = () => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(item => !TOP_CHOICES.includes(item))
    });
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 px-4 pt-1 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-1">
            <Logo variant="landing" />
          </div>
          <h1 className="text-3xl font-extrabold text-white text-center mb-2">
            Where Local Experiences Meet Worldwide Connections
          </h1>
          <p className="text-teal-100 text-center">
            Create your profile in {totalSteps} simple steps
          </p>
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2 bg-teal-200" />
            <div className="flex justify-between mt-2 text-sm text-teal-100">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg border-teal-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-teal-700">
              {currentStep === 1 && "Sign Up"}
              {currentStep === 2 && "Personal Details"}
              {currentStep === 3 && "Location Information"}
              {currentStep === 4 && "Your Preferences"}
              {currentStep === 5 && "Final Details"}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 && "Choose your account type and create your login credentials"}
              {currentStep === 2 && "Tell us a bit about yourself"}
              {currentStep === 3 && "Where are you from and where are you now?"}
              {currentStep === 4 && "What are your interests and activities?"}
              {currentStep === 5 && "Add any special preferences and complete your profile"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { type: "local", icon: User, title: "Nearby Local", desc: "I live here and want to meet travelers" },
                    { type: "traveler", icon: Plane, title: "Traveling Now", desc: "I'm currently traveling and want to meet locals" },
                    // { type: "business", icon: Building, title: "Nearby Business", desc: "I offer travel services" } // Hidden for beta launch
                  ].map(({ type, icon: Icon, title, desc }) => (
                    <div
                      key={type}
                      onClick={() => setFormData({ ...formData, userType: type })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.userType === type
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        formData.userType === type ? 'text-teal-600' : 'text-gray-400'
                      }`} />
                      <h3 className="font-semibold text-center">{title}</h3>
                      <p className="text-sm text-gray-600 text-center">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Choose a username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password (min 8 characters)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
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
                      max="9999-12-31"
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio *</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                  />
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

                {formData.userType === 'traveler' && (
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
                    Minimum: To better match others on this site, choose at least 7 from the following next 4 lists (top choices, interests, activities, events)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current selections: {formData.interests.length + formData.activities.length + formData.events.length}/7
                  </div>
                </div>

                {/* Top Choices for Most Travelers */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-orange-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">⭐</span>
                      <h4 className="text-lg font-semibold text-gray-900">Top Choices for Most Locals and Travelers</h4>
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
                        <Label htmlFor={`top-interest-${interest}`} className="text-xs font-semibold text-black dark:text-white">
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-900">Additional Interests</h4>
                  <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-blue-50 mb-4">
                    {ADDITIONAL_INTERESTS.filter(interest => !interest.startsWith("**")).map((interest) => (
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
                    {().map((event) => (
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
              </>
            )}

            {/* Step 5: Final Details */}
            {currentStep === 5 && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 text-teal-700">Events</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {().map((event) => (
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
                </div>

                {(formData.userType === 'traveler' || formData.userType === 'local') && (
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

                {/* Secret Activities - PROMINENT STYLING */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 border-2 border-orange-300 rounded-lg shadow-sm">
                  <Label htmlFor="secretActivities" className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    🗝️ REQUIRED: Secret activities I'd share about my hometown to Nearby Travelers and friends
                  </Label>
                  <p className="text-sm text-orange-700 mt-1 mb-3">
                    💡 This helps other travelers discover amazing hidden gems in your area!
                  </p>
                  <textarea
                    id="secretActivities"
                    value={formData.secretActivities}
                    onChange={(e) => setFormData({ ...formData, secretActivities: e.target.value })}
                    placeholder="Share a secret local experience, hidden spot, or insider tip..."
                    className="w-full p-3 border-2 border-orange-300 focus:border-orange-500 focus:ring-orange-500 rounded-md min-h-[80px]"
                  />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-teal-600 hover:bg-teal-700 flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 flex items-center space-x-2"
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