import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SignupTraveling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { setUser, login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    // page 1
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",

    // page 2
    dateOfBirth: "", // 'YYYY-MM-DD'
    hometownCity: "",
    hometownState: "",
    hometownCountry: "",

    // travel (this is the traveling signup flow)
    isCurrentlyTraveling: true,
    currentTripDestinationCity: "",
    currentTripDestinationState: "",
    currentTripDestinationCountry: "",
    currentTripReturnDate: "", // 'YYYY-MM-DD'

    // top choices (min 3) - travelers only need interests
    interests: [] as string[],
    activities: [] as string[], // kept for compatibility
    events: [] as string[], // kept for compatibility  
    languagesSpoken: [] as string[], // kept for compatibility
    customLanguages: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customEvent, setCustomEvent] = useState("");

  // Helper functions to match local signup exactly
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
          password: accountData.password || '',
          confirmPassword: accountData.password || '', // Auto-match on load
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
      console.log('🚨 TRAVELER SIGNUP DEBUG - Form submission started');

      // Get account data from sessionStorage (from Auth component)
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
        confirmPassword: accountData.password || formData.confirmPassword, // Auto-fill confirm password
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

      // Build normalized location strings (preserves LA Metro logic)
      const hometown = safeJoin([formData.hometownCity, formData.hometownState, formData.hometownCountry]);
      const location = hometown;

      // Prepare registration data with clean field mapping
      const registrationData = {
        // SIMPLE: Just set as traveler 
        userType: "traveler",
        isCurrentlyTraveling: true,

        // account data
        email: (finalFormData.email || "").toLowerCase().trim(),
        password: (finalFormData.password || "").trim(),
        username: (finalFormData.username || "").toLowerCase().trim(),
        name: (finalFormData.name || "").trim(),
        phoneNumber: (finalFormData.phoneNumber || "").trim(),

        // profile
        dateOfBirth: formData.dateOfBirth,
        bio: "", // no bio in simplified signup
        
        // hometown/location (preserves LA Metro mapping)
        hometownCity: formData.hometownCity.trim(),
        hometownState: formData.hometownState?.trim() || "",
        hometownCountry: formData.hometownCountry.trim(),
        hometown,
        location,

        // current trip (backend will derive travelDestination from these fields)
        currentTripDestinationCity: formData.currentTripDestinationCity?.trim() || "",
        currentTripDestinationState: formData.currentTripDestinationState?.trim() || "",
        currentTripDestinationCountry: formData.currentTripDestinationCountry?.trim() || "",
        currentTripReturnDate: formData.currentTripReturnDate,
        travelEndDate: formData.currentTripReturnDate, // Map to backend field
        
        // ✅ CRITICAL FIX: Add the travelDestination field that backend expects
        travelDestination: safeJoin([
          formData.currentTripDestinationCity?.trim(),
          formData.currentTripDestinationState?.trim(),
          formData.currentTripDestinationCountry?.trim()
        ]),
        
        // CRITICAL: Map to backend expected field names for travel plan creation
        currentCity: formData.currentTripDestinationCity?.trim() || "",
        currentState: formData.currentTripDestinationState?.trim() || "", 
        currentCountry: formData.currentTripDestinationCountry?.trim() || "",
        travelStartDate: new Date().toISOString().split('T')[0], // Today for current travelers

        // top choices (require at least 3)
        interests: formData.interests,
        
        // languages
        languagesSpoken
      };

      // Simple validation for required fields (after data is built)
      const errors: string[] = [];

      if (!registrationData.name) errors.push("Name is required.");
      if (!registrationData.username) errors.push("Username is required.");
      if (!registrationData.email) errors.push("Email is required.");
      if (!registrationData.password) errors.push("Password is required.");
      if (finalFormData.password !== finalFormData.confirmPassword) errors.push("Passwords do not match.");
      if (!registrationData.dateOfBirth) errors.push("Date of birth is required.");
      if (!registrationData.hometownCity || !registrationData.hometownCountry) {
        errors.push("Hometown city and country are required.");
      }

      if ((registrationData.interests?.length ?? 0) < 3) {
        errors.push("Please choose at least 3 interests.");
      }

      if (registrationData.isCurrentlyTraveling) {
        if (!registrationData.currentTripDestinationCity || !registrationData.currentTripDestinationCountry) {
          errors.push("Please add your current trip destination city and country.");
        }
        if (!registrationData.currentTripReturnDate) {
          errors.push("Please add your trip end date.");
        }
      }

      if (errors.length) {
        toast({
          title: "Check the form",
          description: errors.join(" "),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with traveler registration');

      try {
        console.log('🚀 Starting traveler registration with data:', registrationData);
        
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (response.ok && data.user) {
          console.log('✅ Registration successful!');
          
          // Set user in auth context immediately
          authStorage.setUser(data.user);
          setUser(data.user);
          login(data.user);
          
          // Show success message
          toast({
            title: "Account created!",
            description: "Welcome to Nearby Traveler!",
            variant: "default",
          });
          
          // Redirect to welcome page after successful registration
          setLocation('/account-success');
          
        } else {
          console.error('❌ Registration failed:', data.message || 'Unknown error');
          toast({
            title: "Registration failed",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ Registration error:', error);
        toast({
          title: "Registration failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
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

  // Get return date constraints (must be future date)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 bg-white backdrop-blur-md">
          <CardHeader className="text-center bg-gray-50 rounded-t-lg pb-8">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="text-blue-600 hover:text-blue-800 border-blue-300 hover:border-blue-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 mb-3">
              Complete Your Traveler Profile ✈️
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 font-medium">
              Just a few quick details to get you started. You can add more to your profile after joining!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>

                <div>
                  <Label className="text-gray-900">Date of Birth *</Label>
                  <div className="text-sm text-blue-600 mb-2">
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

              {/* Hometown Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Hometown Information</h3>

                <div>
                  <Label className="text-gray-900">Hometown (Where you live) *</Label>
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
                  {formData.hometownCity && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Hometown:</strong> {formData.hometownCity}
                        {formData.hometownState && `, ${formData.hometownState}`}
                        {formData.hometownCountry && `, ${formData.hometownCountry}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TRAVELING SECTION */}
              <div className="space-y-4 bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <h3 className="text-2xl font-bold text-blue-900">Current Trip Information</h3>
                <p className="text-blue-800">
                  Tell us about your current trip so we can connect you with locals and other travelers!
                </p>

                <div>
                  <Label className="text-blue-900">Where are you currently traveling? *</Label>
                  <SmartLocationInput
                    country={formData.currentTripDestinationCountry}
                    city={formData.currentTripDestinationCity}
                    state={formData.currentTripDestinationState}
                    onLocationChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        currentTripDestinationCountry: location.country,
                        currentTripDestinationCity: location.city,
                        currentTripDestinationState: location.state
                      }));
                    }}
                    placeholder={{ country: "Select destination country", city: "Select destination city", state: "Select state/region" }}
                    required
                  />
                  {formData.currentTripDestinationCity && (
                    <div className="mt-2 p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <p className="text-sm text-blue-900">
                        <strong>Current Destination:</strong> {formData.currentTripDestinationCity}
                        {formData.currentTripDestinationState && `, ${formData.currentTripDestinationState}`}
                        {formData.currentTripDestinationCountry && `, ${formData.currentTripDestinationCountry}`}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-blue-900">When do you plan to return? *</Label>
                  <div className="text-sm text-blue-700 mb-2">
                    This helps us show you relevant events and connections for your trip duration
                  </div>
                  <Input
                    type="date"
                    value={formData.currentTripReturnDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentTripReturnDate: e.target.value }))}
                    min={today}
                    max="9999-12-31"
                    required
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Top Choices - Same as local signup */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Top Choices * (Choose at least 3)</h3>
                  <div className="text-sm text-gray-600 font-medium">
                    {formData.interests.length} selected
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  We ask you to choose at least 3 (much more if possible) from the list below, so we can start matching you with other Travelers and Locals. Once inside you can add more city specific interests and activities.
                </p>

                {/* Quick action buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllTopChoices}
                    className="text-sm font-semibold bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllTopChoices}
                    className="text-sm font-semibold bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50'
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