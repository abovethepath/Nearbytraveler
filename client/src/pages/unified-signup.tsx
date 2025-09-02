import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plane, Building2, Plus } from "lucide-react";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES } from "@/lib/formConstants";

// Country options 
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", 
  "Spain", "Italy", "Netherlands", "Japan", "South Korea", "China", "India", 
  "Brazil", "Mexico", "Argentina", "Other"
];

// US States 
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia"
];

// Major US Cities
const MAJOR_CITIES = [
  "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Los Angeles", "Chicago",
  "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco",
  "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "Nashville", "Baltimore",
  "Oklahoma City", "Louisville", "Portland", "Las Vegas", "Milwaukee", "Albuquerque",
  "Tucson", "Fresno", "Mesa", "Kansas City", "Atlanta", "Long Beach", "Colorado Springs",
  "Raleigh", "Miami", "Virginia Beach", "Omaha", "Oakland", "Minneapolis", "Tulsa",
  "New Orleans", "Tampa", "Cleveland", "Honolulu", "Santa Ana", "Corpus Christi",
  "Riverside", "Lexington", "St. Louis", "Pittsburgh", "Anchorage", "Stockton",
  "Cincinnati", "Toledo", "Newark", "Greensboro", "Plano", "Henderson", "Lincoln",
  "Buffalo", "Jersey City", "Chula Vista", "Orlando", "Norfolk", "Chandler",
  "Laredo", "Madison", "Durham", "Lubbock", "Winston-Salem", "Garland", "Glendale",
  "Hialeah", "Reno", "Baton Rouge", "Irvine", "Chesapeake", "Irving", "Scottsdale",
  "North Las Vegas", "Fremont", "Gilbert", "San Bernardino", "Boise", "Birmingham"
];

interface FormData {
  // Basic Info
  name: string;
  username: string;
  email: string;
  confirmEmail: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
  
  // User Type
  userType: "local" | "traveler" | "business";
  
  // Location
  hometownCity: string;
  hometownState: string;
  hometownCountry: string;
  
  // Travel destination (for travelers)
  currentCity: string;
  currentState: string;
  currentCountry: string;
  travelStartDate: string;
  travelEndDate: string;
  
  // Preferences
  interests: string[];
  activities: string[];
  events: string[];
  languages: string[];
  travelerTypes: string[];
  
  // Secret activities
  secretActivities: string;
  
}

export default function UnifiedSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setUser } = useContext(AuthContext);
  
  const [step, setStep] = useState(2); // Start at step 2 since user type already selected
  const [authData, setAuthData] = useState<any>(null);
  
  // Load auth data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('signup_data');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAuthData(parsedData);
        // Pre-fill form with auth data
        setFormData(prev => ({
          ...prev,
          name: parsedData.name || "",
          username: parsedData.username || "",
          email: parsedData.email || "",
          confirmEmail: parsedData.confirmEmail || "",
          password: parsedData.password || "",
          userType: parsedData.userType === 'local_traveler' ? 'traveler' : parsedData.userType || 'local'
        }));
      } catch (error) {
        console.error('Error parsing stored signup data:', error);
        setLocation('/auth');
      }
    } else {
      // No auth data, redirect back to auth
      setLocation('/auth');
    }
  }, [setLocation]);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    confirmEmail: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    userType: "local",
    hometownCity: "",
    hometownState: "",
    hometownCountry: "United States",
    currentCity: "",
    currentState: "",
    currentCountry: "",
    travelStartDate: "",
    travelEndDate: "",
    interests: [],
    activities: [],
    events: [],
    languages: [],
    travelerTypes: [],
    secretActivities: ""
  });
  
  
  // Validation
  const validateAge = (dateString: string): boolean => {
    if (!dateString) return false;
    const today = new Date();
    const birthDate = new Date(dateString);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 16 && age - 1 <= 99;
    }
    return age >= 16 && age <= 99;
  };
  
  const isStep1Valid = (): boolean => {
    return !!(formData.userType);
  };
  
  const isStep2Valid = (): boolean => {
    return !!(
      formData.name && 
      formData.username && 
      formData.username.length >= 6 &&
      formData.email && 
      formData.confirmEmail && 
      formData.email === formData.confirmEmail &&
      formData.password && 
      formData.password.length >= 8 &&
      formData.dateOfBirth && 
      validateAge(formData.dateOfBirth) &&
      formData.gender && 
      formData.bio
    );
  };
  
  const isStep3Valid = (): boolean => {
    const baseValid = !!(
      formData.hometownCity && 
      formData.hometownCountry &&
      formData.interests.length >= 5 &&
      formData.activities.length >= 5 &&
      formData.events.length >= 5 &&
      formData.languages.length >= 1
    );
    
    if (formData.userType === "traveler") {
      return baseValid && !!(
        formData.currentCity && 
        formData.currentCountry &&
        formData.travelStartDate &&
        formData.travelEndDate &&
        formData.travelerTypes.length >= 1
      );
    }
    
    return baseValid;
  };
  
  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("🎯 REGISTRATION SUCCESS! Setting user data:", data);
      
      // Set user in auth storage and context immediately 
      authStorage.setUser(data);
      setUser(data);
      
      // Clear signup data
      localStorage.removeItem('signup_data');
      
      console.log("✅ User set in context and storage:", data.username, data.id);
      
      toast({
        title: "Registration successful!",
        description: "Welcome to Nearby Traveler!",
      });
      
      // Navigate to profile immediately
      setTimeout(() => {
        setLocation("/profile");
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
  
  // Handle preference selection
  const handlePreferenceToggle = (type: keyof Pick<FormData, "interests" | "activities" | "events" | "languages" | "travelerTypes">, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };
  
  // Handle custom input
  
  // Handle form submission
  const handleSubmit = () => {
    if (!isStep3Valid()) return;
    
    const registrationData = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      userType: formData.userType,
      dateOfBirth: new Date(formData.dateOfBirth),
      gender: formData.gender,
      bio: formData.bio,
      hometownCity: formData.hometownCity,
      hometownState: formData.hometownState || "",
      hometownCountry: formData.hometownCountry,
      location: formData.hometownState ? 
        `${formData.hometownCity}, ${formData.hometownState}, ${formData.hometownCountry}` : 
        `${formData.hometownCity}, ${formData.hometownCountry}`,
      interests: formData.interests,
      activities: formData.activities,
      events: formData.events,
      languagesSpoken: formData.languages,
      secretActivities: formData.secretActivities
    };
    
    registerMutation.mutate(registrationData);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-travel-orange to-orange-600 flex items-center justify-center p-4 pt-2">
      <div className="w-full max-w-md">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-white">Nearby Traveler</h1>
          <p className="text-white/80 text-sm">Where local experiences meet worldwide connections</p>
        </div>
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Join Nearby Traveler</CardTitle>
            <p className="text-gray-600">Connect with Nearby Locals and other Nearby Travelers</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userType">I am a... *</Label>
                  <Select value={formData.userType} onValueChange={(value: any) => setFormData({ ...formData, userType: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Nearby Local</div>
                            <div className="text-xs text-gray-500">I live here and want to show my area to visitors</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="traveler">
                        <div className="flex items-center space-x-2">
                          <Plane className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Nearby Traveler</div>
                            <div className="text-xs text-gray-500">I'm currently traveling and looking for local experiences</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="business">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Nearby Business?</div>
                            <div className="text-xs text-gray-500">I offer travel-related services or experiences</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!isStep1Valid()}
                  className="w-full bg-travel-blue hover:bg-blue-700"
                >
                  Continue
                </Button>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">{/* REMOVED DUPLICATE ACCOUNT FIELDS - ONLY IN STEP 1 */}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth * (Can Be Hidden on Profile Page)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {formData.dateOfBirth && !validateAge(formData.dateOfBirth) && (
                      <p className="text-red-500 text-sm mt-1">Must be 16-99 years old</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(gender => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    required
                  />
                </div>
                
                {/* Secret Activities - PROMINENT STYLING */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 border-2 border-orange-300 rounded-lg shadow-sm">
                  <Label htmlFor="secretActivities" className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    🗝️ REQUIRED: Secret activities I'd share about my {formData.userType === "business" ? "location" : "hometown"} to Nearby Travelers and friends
                  </Label>
                  <p className="text-sm text-orange-700 mt-1 mb-3">
                    💡 This helps other travelers discover amazing hidden gems in your area!
                  </p>
                  <Textarea
                    id="secretActivities"
                    value={formData.secretActivities}
                    onChange={(e) => setFormData({ ...formData, secretActivities: e.target.value })}
                    placeholder="Share a secret local experience, hidden spot, or insider tip..."
                    className="border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!isStep2Valid()}
                    className="flex-1 bg-travel-blue hover:bg-blue-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                {/* Location Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {formData.userType === "business" ? "Business Location" : "Hometown"}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="hometownCity">City *</Label>
                      <Select value={formData.hometownCity} onValueChange={(value) => setFormData({ ...formData, hometownCity: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {MAJOR_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.hometownCountry === "United States" && (
                      <div>
                        <Label htmlFor="hometownState">State</Label>
                        <Select value={formData.hometownState} onValueChange={(value) => setFormData({ ...formData, hometownState: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="State" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="hometownCountry">Country *</Label>
                      <Select value={formData.hometownCountry} onValueChange={(value) => setFormData({ ...formData, hometownCountry: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {formData.hometownCity === "other" && (
                    <div>
                      <Label htmlFor="customCity">Enter City Name *</Label>
                      <Input
                        id="customCity"
                        placeholder="Enter your city"
                        value=""
                        onChange={(e) => setFormData({ ...formData, hometownCity: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
                
                {/* Travel Destination (for travelers) */}
                {formData.userType === "traveler" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Travel Destination</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="currentCity">City *</Label>
                        <Select value={formData.currentCity} onValueChange={(value) => setFormData({ ...formData, currentCity: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Travel city" />
                          </SelectTrigger>
                          <SelectContent>
                            {MAJOR_CITIES.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="currentState">State/Region</Label>
                        <Input
                          id="currentState"
                          placeholder="e.g., California"
                          value={formData.currentState}
                          onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="currentCountry">Country *</Label>
                        <Select value={formData.currentCountry} onValueChange={(value) => setFormData({ ...formData, currentCountry: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="travelStartDate">Travel Start Date * (20__-__-__)</Label>
                        <Input
                          id="travelStartDate"
                          type="date"
                          value={formData.travelStartDate}
                          onChange={(e) => setFormData({ ...formData, travelStartDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="travelEndDate">Travel End Date * (20__-__-__)</Label>
                        <Input
                          id="travelEndDate"
                          type="date"
                          value={formData.travelEndDate}
                          onChange={(e) => setFormData({ ...formData, travelEndDate: e.target.value })}
                          min={formData.travelStartDate}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Preferences</h3>
                  <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-400">
                    These Become Your Default (But Changeable) Preferences for All Future Trips
                  </p>
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-400">
                    <strong>Minimum: To better match others on this site, choose at least 10 from the following next 4 lists (top choices, interests, activities, events)</strong> (any combination - be flexible!)
                  </p>
                  
                  {/* Interests */}
                  <div>
                    <Label>Interests</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-2 border rounded-lg p-3 bg-blue-50">
                      {getAllInterests().map(interest => {
                        const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                          interest.slice(2, -2) : interest;
                        const isBold = interest.startsWith("**") && interest.endsWith("**");
                        
                        return (
                          <label key={interest} className="flex items-center space-x-1">
                            <Checkbox
                              checked={formData.interests.includes(interest)}
                              onCheckedChange={() => handlePreferenceToggle("interests", interest)}
                              className="h-3 w-3"
                            />
                            <span className={`text-xs text-gray-700 cursor-pointer leading-tight ${isBold ? 'font-bold' : 'font-medium'}`}>
                              {displayText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Current selections: {formData.interests.length + formData.activities.length + formData.events.length}/10 minimum
                    </p>
                  </div>
                  
                  {/* Activities */}
                  <div>
                    <Label>Activities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-2 border rounded-lg p-3 bg-green-50">
                      {getAllActivities().map(activity => (
                        <label key={activity} className="flex items-center space-x-1">
                          <Checkbox
                            checked={formData.activities.includes(activity)}
                            onCheckedChange={() => handlePreferenceToggle("activities", activity)}
                            className="h-3 w-3"
                          />
                          <span className="text-xs font-medium text-gray-700 cursor-pointer leading-tight">{activity}</span>
                        </label>
                      ))}
                    </div>

                  </div>
                  
                  {/* Events */}
                  <div>
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-2 border rounded-lg p-3 bg-orange-50">
                      {getAllEvents().map(event => (
                        <label key={event} className="flex items-center space-x-1">
                          <Checkbox
                            checked={formData.events.includes(event)}
                            onCheckedChange={() => handlePreferenceToggle("events", event)}
                            className="h-3 w-3"
                          />
                          <span className="text-xs font-medium text-gray-700 cursor-pointer leading-tight">{event}</span>
                        </label>
                      ))}
                    </div>

                  </div>
                  
                  {/* Languages */}
                  <div>
                    <Label>Languages Spoken * (minimum 1)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-2">
                      {getAllLanguages().map((language: string) => (
                        <label key={language} className="flex items-center space-x-1 text-xs">
                          <Checkbox
                            checked={formData.languages.includes(language)}
                            onCheckedChange={() => handlePreferenceToggle("languages", language)}
                          />
                          <span>{language}</span>
                        </label>
                      ))}
                    </div>
                    {formData.languages.length < 1 && (
                      <p className="text-red-500 text-sm">Please select at least 1 language</p>
                    )}
                  </div>
                  
                  {/* Traveler Types (for travelers) */}
                  {formData.userType === "traveler" && (
                    <div>
                      <Label>Traveler Type * (minimum 1)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-2">
                        {BASE_TRAVELER_TYPES.map(type => (
                          <label key={type} className="flex items-center space-x-1 text-xs">
                            <Checkbox
                              checked={formData.travelerTypes.includes(type)}
                              onCheckedChange={() => handlePreferenceToggle("travelerTypes", type)}
                            />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                      {formData.travelerTypes.length < 1 && (
                        <p className="text-red-500 text-sm">Please select at least 1 traveler type</p>
                      )}
                    </div>
                  )}
                </div>
                
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!isStep3Valid() || registerMutation.isPending}
                    className="flex-1 bg-travel-blue hover:bg-blue-700"
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Complete Registration & Enter App"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}