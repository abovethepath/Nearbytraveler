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
      // 1) hydrate account data from session
      const storedAccountData = sessionStorage.getItem("accountData");
      let accountData: any = { email: "", password: "", username: "", name: "", phoneNumber: "" };
      if (storedAccountData) accountData = JSON.parse(storedAccountData);

      // 2) merge + normalize
      const finalFormData = {
        ...formData,
        email: (accountData.email || formData.email || "").toLowerCase().trim(),
        password: (accountData.password || formData.password || "").trim(),
        username: (accountData.username || formData.username || "").toLowerCase().trim(),
        name: (accountData.name || formData.name || "").trim(),
        phoneNumber: (accountData.phoneNumber || formData.phoneNumber || "").trim(),
      };

      // 3) build payload (include multiple alias keys to satisfy differing backends)
      const todayISO = new Date().toISOString().split("T")[0];

      const registrationData = {
        userType: "traveler",
        isCurrentlyTraveling: true,

        email: finalFormData.email,
        password: finalFormData.password,
        username: finalFormData.username,
        name: finalFormData.name,
        phoneNumber: finalFormData.phoneNumber,

        dateOfBirth: finalFormData.dateOfBirth,
        bio: "",

        // hometown
        hometownCity: finalFormData.hometownCity?.trim(),
        hometownState: finalFormData.hometownState?.trim() || "",
        hometownCountry: finalFormData.hometownCountry?.trim(),

        // current trip (primary names)
        currentTripDestinationCity: finalFormData.currentTripDestinationCity?.trim(),
        currentTripDestinationState: finalFormData.currentTripDestinationState?.trim() || "",
        currentTripDestinationCountry: finalFormData.currentTripDestinationCountry?.trim(),
        currentTripReturnDate: finalFormData.currentTripReturnDate,

        // aliases some backends expect
        travelStartDate: todayISO,
        travelEndDate: finalFormData.currentTripReturnDate,
        currentCity: finalFormData.currentTripDestinationCity?.trim(),
        currentState: finalFormData.currentTripDestinationState?.trim() || "",
        currentCountry: finalFormData.currentTripDestinationCountry?.trim(),

        interests: finalFormData.interests,
      };

      // 4) validate (front-end)
      const errs: string[] = [];
      if (!registrationData.name) errs.push("Name is required.");
      if (!registrationData.username) errs.push("Username is required.");
      if (!registrationData.email) errs.push("Email is required.");
      if (!registrationData.password) errs.push("Password is required.");
      if (finalFormData.password !== finalFormData.confirmPassword) errs.push("Passwords do not match.");
      if (!registrationData.dateOfBirth) errs.push("Date of birth is required.");
      if (!registrationData.hometownCity || !registrationData.hometownCountry)
        errs.push("Hometown city and country are required.");
      if ((registrationData.interests?.length ?? 0) < 3)
        errs.push("Please choose at least 3 interests.");
      if (registrationData.isCurrentlyTraveling) {
        if (!registrationData.currentTripDestinationCity || !registrationData.currentTripDestinationCountry)
          errs.push("Please add your current trip destination city and country.");
        if (!registrationData.currentTripReturnDate)
          errs.push("Please add your trip end date.");
      }
      if (errs.length) {
        toast({ title: "Check the form", description: errs.join(" "), variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // 5) CREATE ACCOUNT (await it)
      const regRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
        credentials: "include",
      });
      const regData = await regRes.json();

      if (!regRes.ok || !regData?.user?.id) {
        console.error("Register failed:", regData);
        toast({ title: "Sign up failed", description: regData?.message || "Could not create your account.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const user = regData.user;

      // 6) persist auth state BEFORE we navigate
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("travelconnect_user", JSON.stringify(user));
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authUser", JSON.stringify(user));
      authStorage.setUser(user);
      setUser(user);
      login(user);

      // 7) ENSURE TRAVEL PLAN EXISTS (do this explicitly if your backend doesn't auto-create)
      // Try a dedicated endpoint first; if your /api/register already creates a plan,
      // this call should be idempotent or the backend should no-op on duplicates.
      const travelPlanPayload = {
        userId: user.id,
        isCurrent: true,
        startDate: registrationData.travelStartDate,
        endDate: registrationData.travelEndDate,
        city: registrationData.currentTripDestinationCity,
        state: registrationData.currentTripDestinationState,
        country: registrationData.currentTripDestinationCountry,

        // helpful aliases (cover snake_case too)
        travel_start_date: registrationData.travelStartDate,
        travel_end_date: registrationData.travelEndDate,
        current_city: registrationData.currentTripDestinationCity,
        current_state: registrationData.currentTripDestinationState,
        current_country: registrationData.currentTripDestinationCountry,

        interests: registrationData.interests,
      };

      try {
        const tpRes = await fetch("/api/travel-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(travelPlanPayload),
          credentials: "include",
        });
        // ignore body if not needed; log for debugging
        if (!tpRes.ok) {
          console.warn("Travel plan creation failed (continuing):", await tpRes.text());
        }
      } catch (tpErr) {
        console.warn("Travel plan request error (continuing):", tpErr);
      }

      // 8) (Optional but recommended) kick off post-signup side effects synchronously
      //    so the hero/discovery/chatrooms have data on first render.
      //    If you have endpoints like these, call them now (idempotent server-side):
      // await fetch(`/api/matching/seed-city-matches?userId=${user.id}`, { credentials: "include" });
      // await fetch(`/api/chatrooms/ensure-city-room`, { method: "POST", body: JSON.stringify({ city: travelPlanPayload.city, country: travelPlanPayload.country }), headers: { "Content-Type": "application/json" }, credentials: "include" });
      // await fetch(`/api/messages/seed-welcome`, { method: "POST", body: JSON.stringify({ toUserId: user.id, fromUser: "user2" }), headers: { "Content-Type": "application/json" }, credentials: "include" });

      // 9) clean temp storage
      sessionStorage.removeItem("accountData");
      sessionStorage.removeItem("registrationData");

      // 10) show success and navigate
      toast({
        title: "Account created!",
        description: "Welcome to Nearby Traveler!",
        variant: "default",
      });

      // 11) NOW it's safe to navigate
      setLocation("/account-success");
    } catch (err) {
      console.error("Signup error:", err);
      toast({
        title: "Something went wrong",
        description: "Please check your info and try again.",
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