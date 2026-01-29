import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllLanguages, validateSelections, getHometownInterests } from "../../../shared/base-options";
import { validateCustomInput, filterCustomEntries } from "@/lib/contentFilter";
import { AuthContext } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { InterestSelector } from "@/components/InterestSelector";
import { authStorage } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { getDateInputConstraints } from "@/lib/ageUtils";

export default function SignupTraveling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useContext(AuthContext);

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
    
    // Community Pledge
    pledgeAccepted: false
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
        phoneNumber: accountData.phoneNumber || ''
      };

      // Helper functions for clean data
      const safeJoin = (parts: (string | undefined | null)[]) =>
        parts.filter(Boolean).map(s => String(s).trim()).filter(s => s.length).join(", ");

      const parseCustomCSV = (input: string) =>
        input ? input.split(",").map(s => s.trim()).filter(Boolean) : [];

      // Merge custom languages into languagesSpoken
      const customLangs = parseCustomCSV(formData.customLanguages);
      const languagesSpoken = formData.languages;

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
          
          // ALWAYS redirect - this is the critical action
          console.log('🚀 Redirecting to /account-success...');
          window.location.href = '/account-success';
          
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
            <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>

                <div className="w-full max-w-full overflow-hidden">
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
                    data-testid="input-dateOfBirth"
                    className="w-full max-w-full bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              {/* Hometown Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Hometown Information</h3>

                <div>
                  <Label className="text-gray-900">Hometown (Where you're from) *</Label>
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
                    data-testid="hometown-input"
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

                {/* NEW TO HOMETOWN QUESTION */}
                {formData.hometownCity && (
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="isNewToTown"
                      checked={formData.isNewToTown}
                      onChange={(e) => setFormData(prev => ({ ...prev, isNewToTown: e.target.checked }))}
                      className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      data-testid="checkbox-new-to-town"
                    />
                    <label htmlFor="isNewToTown" className="text-sm text-gray-900 cursor-pointer">
                      <strong>Are you new to {formData.hometownCity}?</strong>
                      <p className="text-gray-600 mt-1">
                        Check this if you recently moved here and want to connect with other newcomers
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* TRAVEL DESTINATION - NEW SECTION */}
              <div className="space-y-4 bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                <h3 className="text-2xl font-bold text-gray-900">✈️ Current Travel Destination</h3>

                <div>
                  <Label className="text-gray-900">Where are you traveling right now? *</Label>
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
                    <div className="mt-2 p-3 bg-orange-100 rounded-lg border border-orange-300">
                      <p className="text-sm text-orange-900">
                        <strong>Traveling to:</strong> {formData.destinationCity}
                        {formData.destinationState && `, ${formData.destinationState}`}
                        {formData.destinationCountry && `, ${formData.destinationCountry}`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-full overflow-hidden">
                  <Label className="text-gray-900">When does your trip end? *</Label>
                  <div className="text-sm text-gray-600 mb-2">
                    This helps locals know when you'll be in their area
                  </div>
                  <Input
                    type="date"
                    value={formData.travelReturnDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelReturnDate: e.target.value }))}
                    min={today}
                    required
                    data-testid="input-travelReturnDate"
                    className="w-full max-w-full bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              {/* Top Choices */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Top Choices to Meet Travelers and Locals *</h3>
                <p className="text-gray-700 text-sm">
                  What are you interested in? Select at least 7 choices to help us match you with like-minded travelers and locals.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <InterestSelector
                    options={getHometownInterests()}
                    selected={formData.interests}
                    onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected }))}
                    minRequired={7}
                    placeholder="Search interests..."
                    extraSelectedCount={getCustomInterestsCount()}
                  />

                  {/* Custom Interests Input */}
                  <div className="pt-4 border-t border-gray-200">
                    <Label className="text-gray-900 font-medium">✨ Add Your Own Interests (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Don't see what you're looking for? Add your own interests, separated by commas.
                    </p>
                    <Input
                      type="text"
                      value={formData.customInterests}
                      onChange={(e) => setFormData(prev => ({ ...prev, customInterests: e.target.value }))}
                      placeholder="e.g., Rock Climbing, Vintage Shopping, Board Games"
                      className="w-full"
                      data-testid="input-custom-interests"
                    />
                    {formData.customInterests && (
                      <p className="text-xs text-blue-600 mt-1">
                        Your custom interests will be added to your profile
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Community Pledge */}
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-6 rounded-lg border-2 border-blue-200 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🌍</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">The NearbyTraveler Pledge</h3>
                    <div className="space-y-2 text-gray-800 mb-4">
                      <p className="font-medium">I believe in real human connection.</p>
                      <p className="font-medium">I will show up with kindness, respect, and openness.</p>
                      <p className="font-medium">I will help make this a safe, welcoming community for travelers and locals everywhere.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="pledge-checkbox"
                        checked={formData.pledgeAccepted}
                        onChange={(e) => setFormData(prev => ({ ...prev, pledgeAccepted: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        data-testid="checkbox-pledge"
                      />
                      <label htmlFor="pledge-checkbox" className="text-sm font-medium text-gray-900 cursor-pointer">
                        I agree to the NearbyTraveler Pledge and commit to building authentic connections with kindness and respect.
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug Panel - Shows form status */}
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-sm">
                <h4 className="font-bold text-yellow-800 mb-2">Form Status (Debug - will be removed)</h4>
                
                {/* Error Display - Most Important */}
                {debugError && (
                  <div className="mb-3 p-3 bg-red-100 border-2 border-red-500 rounded text-red-800 font-bold">
                    ERROR: {debugError}
                  </div>
                )}
                
                {/* Status Display */}
                <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded">
                  <span className="font-bold">Status:</span> {debugStatus}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={formData.hometownCity ? "text-green-600" : "text-red-600"}>
                    Hometown City: {formData.hometownCity || "MISSING"}
                  </div>
                  <div className={formData.hometownCountry ? "text-green-600" : "text-red-600"}>
                    Hometown Country: {formData.hometownCountry || "MISSING"}
                  </div>
                  <div className={formData.destinationCity ? "text-green-600" : "text-red-600"}>
                    Destination City: {formData.destinationCity || "MISSING"}
                  </div>
                  <div className={formData.destinationCountry ? "text-green-600" : "text-red-600"}>
                    Destination Country: {formData.destinationCountry || "MISSING"}
                  </div>
                  <div className={formData.dateOfBirth ? "text-green-600" : "text-red-600"}>
                    Date of Birth: {formData.dateOfBirth || "MISSING"}
                  </div>
                  <div className={formData.travelReturnDate ? "text-green-600" : "text-red-600"}>
                    Travel Return Date: {formData.travelReturnDate || "MISSING"}
                  </div>
                  <div className={getTotalInterestsCount() >= 7 ? "text-green-600" : "text-red-600"}>
                    Interests: {getTotalInterestsCount()}/7 {getTotalInterestsCount() >= 7 ? "OK" : "NEED MORE"}
                  </div>
                  <div className={formData.pledgeAccepted ? "text-green-600" : "text-red-600"}>
                    Pledge: {formData.pledgeAccepted ? "ACCEPTED" : "NOT ACCEPTED"}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-yellow-300">
                  <div className={!isLoading && getTotalInterestsCount() >= 7 && formData.pledgeAccepted ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                    Button Enabled: {!isLoading && getTotalInterestsCount() >= 7 && formData.pledgeAccepted ? "YES - READY TO SUBMIT" : "NO - Check items above"}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || getTotalInterestsCount() < 7 || !formData.pledgeAccepted}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-lg shadow-lg disabled:bg-gray-400"
                  data-testid="button-complete-signup"
                  onClick={() => console.log('🔘 BUTTON CLICKED - disabled:', isLoading || getTotalInterestsCount() < 7 || !formData.pledgeAccepted, 'isLoading:', isLoading, 'interests:', getTotalInterestsCount(), 'pledge:', formData.pledgeAccepted)}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Your Account...
                    </div>
                  ) : (
                    `Complete Signup (${getTotalInterestsCount()}/7 interests selected)`
                  )}
                </Button>
                {getTotalInterestsCount() < 7 && (
                  <p className="text-red-600 text-sm mt-2 text-center font-medium">
                    Please select at least 7 interests ({getTotalInterestsCount()}/7 selected)
                  </p>
                )}
                {!formData.pledgeAccepted && getTotalInterestsCount() >= 7 && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    Please accept the NearbyTraveler Pledge to continue
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
