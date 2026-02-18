import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllLanguages, validateSelections, getHometownInterests } from "../../../shared/base-options";
import { validateCustomInput, filterCustomEntries } from "@/lib/contentFilter";
import { useAuth } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { InterestSelector } from "@/components/InterestSelector";
import { authStorage } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { getDateInputConstraints } from "@/lib/ageUtils";

export default function SignupTraveling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    // Basic info (from account signup)
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",

    // Page 2 - Personal info  
    dateOfBirth: "",
    hometownCity: "",
    hometownState: "",
    hometownCountry: "",
    isNewToTown: false,

    // TRAVELING SPECIFIC FIELDS
    destinationCity: "",
    destinationState: "",
    destinationCountry: "",
    travelReturnDate: "",

    // Preferences
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[],
    languages: ["English"] as string[],
    
    // Custom entries
    customInterests: "",
    customActivities: "",
    customEvents: "",
    customLanguages: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugStatus, setDebugStatus] = useState<string>("Ready");

  // Helper functions to count all interests including custom ones
  const getCustomInterestsCount = () => {
    const customItems = formData.customInterests
      ?.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0) || [];
    return customItems.length;
  };

  const getTotalInterestsCount = () => {
    return formData.interests.length + getCustomInterestsCount();
  };

  const getTotalSelections = () => {
    return formData.interests.length + formData.activities.length + formData.events.length;
  };

  // Load account data from sessionStorage
  useEffect(() => {
    console.log('✈️ TRAVELING SIGNUP - Loading account data');
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
      confirmPassword: accountData.password || "", // Auto-fill confirm password
      username: accountData.username || "",
      name: accountData.name || "",
      phoneNumber: accountData.phoneNumber || ""
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 FORM SUBMIT TRIGGERED - handleSubmit called');
    console.log('🚀 Current formData:', JSON.stringify(formData, null, 2));
    
    setDebugError(null);
    setDebugStatus("Starting submission...");
    
    try {
      setIsLoading(true);
      setDebugStatus("Preparing data...");

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

      // Get referral code and connection note from QR code signup flow
      const referralCode = sessionStorage.getItem('referralCode');
      const connectionNote = sessionStorage.getItem('connectionNote');
      console.log('🔗 REFERRAL DEBUG - referralCode from sessionStorage:', referralCode);
      console.log('🔗 REFERRAL DEBUG - connectionNote from sessionStorage:', connectionNote);

      // CRITICAL: Merge account data INTO formData to ensure submission has complete data
      const finalFormData = {
        ...formData,
        email: accountData.email || formData.email,
        password: accountData.password || formData.password,
        confirmPassword: accountData.password || formData.confirmPassword,
        username: accountData.username || formData.username,
        name: accountData.name || formData.name,
        phoneNumber: accountData.phoneNumber || '',
        keepLoggedIn: accountData.keepLoggedIn !== false
      };

      // Helper functions for clean data
      const safeJoin = (parts: (string | undefined | null)[]) =>
        parts.filter(Boolean).map(s => String(s).trim()).filter(s => s.length).join(", ");

      const parseCustomCSV = (input: string) =>
        input ? input.split(",").map(s => s.trim()).filter(Boolean) : [];

      // Merge custom languages into languagesSpoken
      const customLangs = parseCustomCSV(formData.customLanguages);
      const languagesSpoken = [...(formData.languages || []), ...customLangs];

      // Build normalized location strings
      const hometown = safeJoin([formData.hometownCity, formData.hometownState, formData.hometownCountry]);
      const destination = safeJoin([formData.destinationCity, formData.destinationState, formData.destinationCountry]);

      // Prepare registration data with clean field mapping
      const registrationData = {
        // TRAVELING: Set as traveler and currently traveling
        userType: "traveler",
        isCurrentlyTraveling: true,
        isNewToTown: formData.isNewToTown,

        // account data
        email: (finalFormData.email || "").toLowerCase().trim(),
        password: (finalFormData.password || "").trim(),
        username: (finalFormData.username || "").toLowerCase().trim(),
        name: (finalFormData.name || "").trim(),
        phoneNumber: (finalFormData.phoneNumber || "").trim(),
        keepLoggedIn: finalFormData.keepLoggedIn !== false,

        // profile
        dateOfBirth: formData.dateOfBirth,
        
        // hometown/location
        hometownCity: formData.hometownCity.trim(),
        hometownState: formData.hometownState?.trim() || "",
        hometownCountry: formData.hometownCountry.trim(),
        hometown,
        location: hometown,

        // TRAVELING SPECIFIC: Destination and return date
        destinationCity: formData.destinationCity.trim(),
        destinationState: formData.destinationState?.trim() || "",
        destinationCountry: formData.destinationCountry.trim(),
        travelDestination: destination,
        travelReturnDate: formData.travelReturnDate,

        // top choices (require at least 3)
        interests: formData.interests,
        
        // custom entries
        customInterests: formData.customInterests?.trim() || "",
        customActivities: formData.customActivities?.trim() || "",
        
        // languages
        languagesSpoken,
        
        // Referral tracking (if user came from QR code)
        ...(referralCode && { referralCode }),
        ...(connectionNote && { connectionNote })
      };

      console.log('🔗 REFERRAL DEBUG - registrationData includes referralCode?', 'referralCode' in registrationData);
      console.log('🔗 REFERRAL DEBUG - registrationData.referralCode value:', registrationData.referralCode);
      console.log('🔗 REFERRAL DEBUG - Full registrationData:', registrationData);

      setDebugStatus("Validating fields...");
      
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
      if (!registrationData.destinationCity || !registrationData.destinationCountry) {
        errors.push("Travel destination city and country are required.");
      }
      if (!registrationData.travelReturnDate) {
        errors.push("Travel return date is required.");
      } else {
        // CRITICAL: Validate return date is today or in the future
        const returnDate = new Date(registrationData.travelReturnDate);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        returnDate.setHours(0, 0, 0, 0);
        
        if (returnDate < todayDate) {
          errors.push("Return date must be today or in the future. You cannot sign up as currently traveling with an expired trip.");
        }
        
        // Also enforce year is at least 2026 to prevent typos like 2023
        const returnYear = returnDate.getFullYear();
        if (returnYear < 2026) {
          errors.push(`Return date year (${returnYear}) seems incorrect. Please check you entered the correct year (should be 2026 or later).`);
        }
      }

      // Count standard interests + custom interests
      const customInterestsCount = formData.customInterests
        ?.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0).length || 0;
      const totalInterestsCount = (registrationData.interests?.length ?? 0) + customInterestsCount;
      
      if (totalInterestsCount < 7) {
        errors.push("Please choose at least 7 interests (standard + custom combined).");
      }

      if (errors.length) {
        setDebugError("VALIDATION FAILED: " + errors.join(" | "));
        setDebugStatus("Validation failed - see errors above");
        toast({
          title: "Check the form",
          description: errors.join(" "),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with traveler registration');
      setDebugStatus("Validation passed - sending to server...");

      // Show loading message
      toast({
        title: "Creating your account...",
        description: "This may take 10-15 seconds. Please wait.",
        variant: "default",
      });

      try {
        console.log('🚀 Starting traveler registration with data:', registrationData);
        setDebugStatus("Making API call to /api/register...");
        
        let response;
        try {
          response = await fetch(`${getApiBaseUrl()}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(registrationData)
          });
        } catch (fetchError: any) {
          console.error('❌ FETCH ERROR:', fetchError);
          alert('Network error: ' + (fetchError?.message || 'Could not connect to server'));
          throw fetchError;
        }
        
        setDebugStatus(`API responded with status: ${response.status}`);
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError: any) {
          console.error('❌ JSON PARSE ERROR:', jsonError);
          alert('Response parse error: ' + (jsonError?.message || 'Invalid server response'));
          throw jsonError;
        }
        
        if (response.ok) {
          console.log('✅ Traveler registration successful:', data.user?.username);
          setDebugStatus("SUCCESS! Account created!");
          
          // Set user in auth context and storage immediately
          try {
            if (data.user) {
              authStorage.setUser(data.user);
              setUser(data.user);
            }
          } catch (authErr) {
            console.error('Auth storage error (continuing anyway):', authErr);
          }
          
          // Show success message
          toast({
            title: "Account created!",
            description: "Welcome to Nearby Traveler!",
            variant: "default",
          });
          
          localStorage.setItem('just_registered', 'true');
          setLocation('/profile');
          
        } else {
          console.error('❌ Registration failed:', data.message);
          const errorMsg = data.message || "Unknown server error";
          setDebugError("API ERROR: " + errorMsg);
          setDebugStatus("Registration failed - see error above");
          alert('Registration failed: ' + errorMsg);
          toast({
            title: "Registration failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('❌ Registration error:', error);
        const errorMsg = error?.message || String(error);
        setDebugError("NETWORK/API ERROR: " + errorMsg);
        setDebugStatus("Network error occurred");
        alert('Registration error: ' + errorMsg);
        toast({
          title: "Registration failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      const errorMsg = error?.message || String(error);
      setDebugError("VALIDATION ERROR: " + errorMsg);
      setDebugStatus("Validation error occurred");
      alert('Validation error: ' + errorMsg);
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
  const today = new Date().toISOString().split('T')[0];
  
  // No default date - user must pick their trip end date

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Vibrant header banner */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-blue-600 py-3 px-4 text-center z-40 shadow-lg">
        <p className="text-white font-bold text-sm sm:text-base">
          ✈️ Almost there! Connect with travelers and locals worldwide!
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-blue-600 pb-8 pt-6">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/50 hover:border-white font-medium backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Complete Your Traveler Profile ✈️
            </CardTitle>
            <CardDescription className="text-lg sm:text-xl text-white/90 font-medium">
              Just a few details to get you started!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-8 space-y-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 text-sm font-bold">1</span>
                  Personal Information
                </h3>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <Label className="text-gray-700 dark:text-gray-200 font-semibold block text-center">Date of Birth *</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">
                    Can be hidden from public view later
                  </p>
                  <div className="flex justify-center">
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      min={minDate}
                      max={maxDate}
                      required
                      data-testid="input-dateOfBirth"
                      className="w-full max-w-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 rounded-lg text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Hometown Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">2</span>
                  Where Are You From?
                </h3>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <Label className="text-gray-700 dark:text-gray-200 font-semibold mb-2 block">Your Hometown *</Label>
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
                    placeholder={{ country: "Select country", city: "Select city", state: "Select state/region" }}
                    required
                    data-testid="hometown-input"
                  />
                  {formData.hometownCity && (
                    <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-300 dark:border-green-700">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                        ✅ Hometown: {formData.hometownCity}
                        {formData.hometownState && `, ${formData.hometownState}`}
                        {formData.hometownCountry && `, ${formData.hometownCountry}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* NEW TO HOMETOWN QUESTION - full box clickable */}
                {formData.hometownCity && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isNewToTown: !prev.isNewToTown }))}
                    className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700 w-full text-left cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    data-testid="checkbox-new-to-town"
                  >
                    <Checkbox
                      id="isNewToTown"
                      checked={formData.isNewToTown}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNewToTown: !!checked }))}
                      className="mt-0.5 h-5 w-5 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                      <strong>I'm new to {formData.hometownCity}</strong>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Check this if you recently moved here
                      </p>
                    </span>
                  </button>
                )}
              </div>

              {/* TRAVEL DESTINATION */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 text-sm font-bold">3</span>
                  Where Are You Traveling?
                </h3>

                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-700">
                  <Label className="text-gray-700 dark:text-gray-200 font-semibold mb-2 block">Current Destination *</Label>
                  <SmartLocationInput
                    country={formData.destinationCountry}
                    city={formData.destinationCity}
                    state={formData.destinationState}
                    onLocationChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        destinationCountry: location.country,
                        destinationCity: location.city,
                        destinationState: location.state
                      }));
                    }}
                    placeholder={{ country: "Select destination country", city: "Select destination city", state: "Select state/region" }}
                    required
                    data-testid="destination-input"
                  />
                  {formData.destinationCity && (
                    <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-800/40 rounded-lg border border-orange-300 dark:border-orange-600">
                      <p className="text-sm text-orange-900 dark:text-orange-200 font-medium">
                        ✈️ Traveling to: {formData.destinationCity}
                        {formData.destinationState && `, ${formData.destinationState}`}
                        {formData.destinationCountry && `, ${formData.destinationCountry}`}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-600">
                    <Label className="text-gray-700 dark:text-gray-200 font-semibold">When does your trip end? *</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      This helps locals know when you'll be in their area
                    </p>
                    <Input
                      type="date"
                      value={formData.travelReturnDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelReturnDate: e.target.value }))}
                      min={today}
                      required
                      data-testid="input-travelReturnDate"
                      className="w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Top Choices */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">4</span>
                  Your Interests
                </h3>
                
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Select at least 7 to help us match you
                  </span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    getTotalInterestsCount() >= 7 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {getTotalInterestsCount()}/7
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm space-y-4">
                  <InterestSelector
                    options={getHometownInterests()}
                    selected={formData.interests}
                    onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected }))}
                    minRequired={7}
                    placeholder="Search interests..."
                    extraSelectedCount={getCustomInterestsCount()}
                  />

                  {/* Custom Interests Input */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Label className="text-gray-700 dark:text-gray-200 font-semibold">✨ Add Your Own (Optional)</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Don't see what you're looking for? Add your own, separated by commas.
                    </p>
                    <Input
                      type="text"
                      value={formData.customInterests}
                      onChange={(e) => setFormData(prev => ({ ...prev, customInterests: e.target.value }))}
                      placeholder="e.g., Rock Climbing, Vintage Shopping, Board Games"
                      className="w-full bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:text-white"
                      data-testid="input-custom-interests"
                    />
                  </div>
                </div>
              </div>

              {/* Terms agreement */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                By completing your profile, you agree to our{" "}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Terms and Conditions
                </Link>
              </p>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || getTotalInterestsCount() < 7}
                  className={`w-full py-6 text-lg font-bold rounded-xl shadow-lg transition-all ${
                    getTotalInterestsCount() >= 7
                      ? 'bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  data-testid="button-complete-signup"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Your Account...
                    </div>
                  ) : getTotalInterestsCount() >= 7 ? (
                    "Complete Signup →"
                  ) : (
                    `Select ${7 - getTotalInterestsCount()} more interests`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
