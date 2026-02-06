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
    confirmPassword: "",
    phoneNumber: "",

    // Page 2 - Personal info  
    dateOfBirth: "",
    hometownCity: "",
    hometownState: "",
    hometownCountry: "",
    isNewToTown: false,

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
      confirmPassword: accountData.password || "", // Auto-fill confirm password
      username: accountData.username || "",
      name: accountData.name || "",
      phoneNumber: accountData.phoneNumber || ""
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

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
      const languagesSpoken = formData.languages;

      // Build normalized location strings
      const hometown = safeJoin([formData.hometownCity, formData.hometownState, formData.hometownCountry]);
      const location = hometown;

      // Prepare registration data with clean field mapping
      const registrationData = {
        // SIMPLE: Just set as local 
        userType: "local",
        isCurrentlyTraveling: false,
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
        location,

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
        toast({
          title: "Check the form",
          description: errors.join(" "),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ VALIDATION PASSED - Proceeding with local registration');

      // Show loading message
      toast({
        title: "Creating your account...",
        description: "This may take 10-15 seconds. Please wait.",
        variant: "default",
      });

      try {
        console.log('🚀 Starting local registration with data:', registrationData);
        
        const response = await fetch(`${getApiBaseUrl()}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(registrationData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Local registration successful:', data.user?.username);
          
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
    } catch (error) {
      console.error('Validation error:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Vibrant header banner */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-orange-500 py-3 px-4 text-center z-40 shadow-lg">
        <p className="text-white font-bold text-sm sm:text-base">
          🏠 Almost there! Connect with travelers visiting your city!
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-orange-500 pb-8 pt-6">
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
              Complete Your Local Profile 🏠
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
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">1</span>
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
                  Where Do You Live?
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

                {/* New to Town Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                  <Checkbox
                    id="isNewToTown"
                    checked={formData.isNewToTown}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNewToTown: checked as boolean }))}
                    data-testid="checkbox-new-to-town"
                    className="mt-0.5 border-2 border-gray-400 dark:border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="isNewToTown"
                      className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
                    >
                      I'm new to {formData.hometownCity || 'this area'}
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Check this if you recently moved here and want to explore your new hometown
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Choices */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 text-sm font-bold">3</span>
                  Your Interests
                </h3>
                
                <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
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

              {/* Community Pledge */}
              <div className="bg-white dark:bg-gray-700 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">The NearbyTraveler Pledge</h3>
                    <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      <p>✓ I believe in real human connection.</p>
                      <p>✓ I will show up with kindness, respect, and openness.</p>
                      <p>✓ I will help make this a safe, welcoming community.</p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer bg-gray-50 dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors">
                      <input
                        type="checkbox"
                        id="pledge-checkbox"
                        checked={formData.pledgeAccepted}
                        onChange={(e) => setFormData(prev => ({ ...prev, pledgeAccepted: e.target.checked }))}
                        className="mt-0.5 w-5 h-5 text-blue-600 border-2 border-gray-300 dark:border-gray-400 rounded focus:ring-blue-500 focus:ring-2"
                        data-testid="checkbox-pledge"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        I agree to the NearbyTraveler Pledge
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || getTotalInterestsCount() < 7 || !formData.pledgeAccepted}
                  className={`w-full py-6 text-lg font-bold rounded-xl shadow-lg transition-all ${
                    getTotalInterestsCount() >= 7 && formData.pledgeAccepted
                      ? 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  data-testid="button-complete-signup"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Your Account...
                    </div>
                  ) : getTotalInterestsCount() >= 7 && formData.pledgeAccepted ? (
                    "Complete Signup →"
                  ) : (
                    `Select ${7 - getTotalInterestsCount()} more interests`
                  )}
                </Button>
                {!formData.pledgeAccepted && getTotalInterestsCount() >= 7 && (
                  <p className="text-orange-600 text-sm mt-3 text-center font-medium">
                    ↑ Please accept the pledge above to continue
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