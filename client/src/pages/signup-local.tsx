import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, getHometownInterests } from "../../../shared/base-options";
import { validateCustomInput, filterCustomEntries } from "@/lib/contentFilter";
import { AuthContext } from "@/App";
import { SmartLocationInput } from "@/components/SmartLocationInput";
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
    languages: [] as string[],
    
    // Custom entries
    customInterests: "",
    customActivities: "",
    customEvents: "",
    customLanguages: "",
    
    // Community Pledge
    pledgeAccepted: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper functions to match traveling signup exactly
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

      if ((registrationData.interests?.length ?? 0) < 7) {
        errors.push("Please choose at least 7 interests.");
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

      try {
        console.log('🚀 Starting local registration with data:', registrationData);
        
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(registrationData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Local registration successful:', data.user?.username);
          
          // Set user in auth context and storage immediately
          authStorage.setUser(data.user);
          setUser(data.user);
          
          // Show success message
          toast({
            title: "Account created!",
            description: "Welcome to Nearby Traveler!",
            variant: "default",
          });
          
          // Redirect to welcome page after successful registration
          setLocation('/account-success');
          
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
              Complete Your Local Profile 🏠
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
                    data-testid="input-dateOfBirth"
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

                {/* New to Town Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="isNewToTown"
                    checked={formData.isNewToTown}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNewToTown: checked as boolean }))}
                    data-testid="checkbox-new-to-town"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="isNewToTown"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Are you new to {formData.hometownCity || 'this area'}?
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Check this if you've recently moved here and want to meet locals and explore your new hometown
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Choices */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Top Choices to Meet Travelers and Locals * (Choose at least 7)</h3>
                  <span className="text-sm text-gray-600">
                    {formData.interests.length}/7 minimum selected
                  </span>
                </div>
                <p className="text-gray-700 text-sm">
                  What are you interested in? Select at least 7 choices to help us match you with like-minded travelers and locals.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <Label className="text-gray-900 font-medium">🎯 What are you interested in?</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getHometownInterests().map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                            formData.interests.includes(interest)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                          data-testid={`interest-${interest}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

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

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || formData.interests.length < 3 || !formData.pledgeAccepted}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-lg shadow-lg disabled:bg-gray-400"
                  data-testid="button-complete-signup"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Your Account...
                    </div>
                  ) : (
                    `Complete Signup (${formData.interests.length}/7 interests selected)`
                  )}
                </Button>
                {!formData.pledgeAccepted && (
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