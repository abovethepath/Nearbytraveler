import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Building, MapPin, User, Phone, Mail, Globe, Heart, Zap, Navigation } from "lucide-react";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, BUSINESS_TYPES } from "../../../shared/base-options";

const businessSignupSchema = z.object({
  // Business Account Information
  username: z.string().min(6, "Username must be 6-13 characters").max(13, "Username must be 6-13 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Essential Business Information Only
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  customBusinessType: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone number is required"),
  
  // Basic Location (City is required for metro area matching)
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  
  // Optional website
  businessWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  
  // Location services for proximity features
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
  locationSharingEnabled: z.boolean().default(true),
});

type BusinessSignupData = z.infer<typeof businessSignupSchema>;

export default function SignupBusiness() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  // Get account data from sessionStorage (from join page step 1)
  const getAccountData = () => {
    try {
      const stored = sessionStorage.getItem('accountData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const accountData = getAccountData();
  
  // Debug: Log account data to see what fields are available
  console.log('Account data from sessionStorage:', accountData);
  console.log('Business city from accountData:', accountData?.city);
  console.log('Business name from accountData:', accountData?.name);

  // Function to get business GPS coordinates
  const getBusinessLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      form.setValue('currentLatitude', latitude);
      form.setValue('currentLongitude', longitude);
      setLocationCaptured(true);
      
      toast({
        title: "Location Captured!",
        description: `Business location set to coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get your location. You can continue without it.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const form = useForm<BusinessSignupData>({
    resolver: zodResolver(businessSignupSchema),
    defaultValues: {
      username: accountData?.username || "",
      email: accountData?.email || "",
      password: accountData?.password || "",
      businessName: accountData?.name || "",
      businessType: "",
      customBusinessType: "",
      businessPhone: "",
      businessWebsite: "",
      city: accountData?.city || "",
      state: "",
      country: "",
      currentLatitude: undefined,
      currentLongitude: undefined,
      locationSharingEnabled: true,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: BusinessSignupData) => {
      // Process custom interests and activities
      const processedData = { ...data };
      
      // CRITICAL: Add the required "name" field using business name for businesses
      (processedData as any).name = data.businessName;
      
      // Handle custom business type
      if (data.businessType === "Custom (specify below)" && data.customBusinessType) {
        processedData.businessType = data.customBusinessType;
      }
      
      // Remove the custom fields from the final data since they're now merged
      delete processedData.customBusinessType;

      const response = await fetch('/api/business-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...processedData,
          userType: "business",
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Business Registration Successful!",
        description: "Welcome to Nearby Traveler Business Network!",
      });
      
      // Store auth data in the correct format that the app expects
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('travelconnect_user', JSON.stringify(response.user));
      }
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('auth_token', response.token);
      }
      
      // Clear sessionStorage account data since signup is complete
      sessionStorage.removeItem('accountData');
      
      // Immediate redirect to profile to complete setup
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({
        title: "Business Registration Failed",
        description: error.message || "Please check all required fields and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessSignupData) => {
    setIsLoading(true);
    signupMutation.mutate(data);
  };

  const businessTypes = BUSINESS_TYPES;

  const employeeCounts = [
    "1-5", "6-10", "11-25", "26-50", "51-100", "100+"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden break-words">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden break-words">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 overflow-hidden break-words">
          <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6 overflow-hidden break-words">
            <Building className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-blue-600 mb-3 sm:mb-4" />
            <CardTitle className="text-xl sm:text-2xl md:text-3xl break-words">Register Your Business</CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg px-2 break-words">
              Quick signup - Complete your detailed business profile after registration
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 overflow-hidden break-words">
            {/* Back Button - Mobile Responsive */}
            <div className="mb-4 sm:mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/join')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm sm:text-base h-9 sm:h-10"
                data-testid="button-back-top"
              >
                ← Back to Join
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8 overflow-hidden break-words">
                
                {/* Account Information Section - Pre-filled from join page */}
                {accountData && (
                  <div className="space-y-3 sm:space-y-4 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg overflow-hidden break-words">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      Account Information ✓
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                      Account details from step 1 (automatically filled)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden break-words">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-xs sm:text-sm break-words">Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Business Name" {...field} disabled className="bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm h-9 sm:h-10" />
                            </FormControl>
                            <FormDescription className="text-xs break-words">
                              From step 1 registration
                            </FormDescription>
                            <FormMessage className="text-xs break-words" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-xs sm:text-sm break-words">Username</FormLabel>
                            <FormControl>
                              <Input placeholder="businessusername" {...field} disabled className="bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm h-9 sm:h-10" />
                            </FormControl>
                            <FormMessage className="text-xs break-words" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2 overflow-hidden break-words">
                            <FormLabel className="text-xs sm:text-sm break-words">Account Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="business@email.com" {...field} disabled className="bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm h-9 sm:h-10" />
                            </FormControl>
                            <FormDescription className="text-xs break-words">
                              Email for account login and business contact
                            </FormDescription>
                            <FormMessage className="text-xs break-words" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Essential Business Information Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    Essential Business Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden break-words">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">Business Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-xs sm:text-sm">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessPhone"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">Business Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                          </FormControl>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Custom Business Type field - Mobile Responsive */}
                  {form.watch("businessType") === "Custom (specify below)" && (
                    <FormField
                      control={form.control}
                      name="customBusinessType"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">Custom Business Type *</FormLabel>
                          <FormControl>
                            <Input placeholder="Describe your business type" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                          </FormControl>
                          <FormDescription className="text-xs break-words">
                            Please specify your business type
                          </FormDescription>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="businessWebsite"
                    render={({ field }) => (
                      <FormItem className="overflow-hidden break-words">
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-2 break-words">
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                          Business Website (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="www.yourbusiness.com" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                        </FormControl>
                        <FormDescription className="text-xs break-words">
                          Your business website URL (optional)
                        </FormDescription>
                        <FormMessage className="text-xs break-words" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    Business Location
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 overflow-hidden break-words">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Los Angeles" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                          </FormControl>
                          <FormDescription className="text-xs break-words">
                            Required for local discovery
                          </FormDescription>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">State/Province *</FormLabel>
                          <FormControl>
                            <Input placeholder="California" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                          </FormControl>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-xs sm:text-sm break-words">Country *</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} className="text-xs sm:text-sm h-9 sm:h-10" />
                          </FormControl>
                          <FormMessage className="text-xs break-words" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* GPS Location Capture - Mobile Responsive */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden break-words">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2 break-words">
                      <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      Enhanced Location Services (Optional)
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 break-words">
                      Capture your exact business location for better customer discovery and proximity features.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getBusinessLocation}
                        disabled={isGettingLocation || locationCaptured}
                        className={`flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10 ${locationCaptured ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' : ''}`}
                      >
                        <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                        {isGettingLocation ? 'Getting Location...' : locationCaptured ? 'Location Captured ✓' : 'Capture Business Location'}
                      </Button>
                      
                      {locationCaptured && (
                        <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none bg-green-500 text-white border-0">
                          GPS coordinates saved
                        </div>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="locationSharingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 sm:space-x-3 space-y-0 mt-3 sm:mt-4 overflow-hidden break-words">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs sm:text-sm break-words">
                              Enable location-based customer discovery
                            </FormLabel>
                            <FormDescription className="text-xs break-words">
                              Allow customers to find your business through location-based searches and proximity features.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Terms and Privacy - Mobile Responsive */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-lg border overflow-hidden break-words">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 break-words">
                    Business Agreement & Privacy
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                    By registering your business, you agree to our Terms of Service and Privacy Policy for business accounts. 
                    Your business information will be publicly visible to help customers discover and connect with your services.
                  </p>
                </div>

                {/* Submit Button - Mobile Responsive */}
                <div className="pt-4 sm:pt-6 overflow-hidden break-words">
                  <Button
                    type="submit"
                    disabled={isLoading || signupMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 sm:h-12 text-sm sm:text-base"
                    data-testid="button-register-business"
                  >
                    {isLoading || signupMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Registering Business...
                      </div>
                    ) : (
                      'Register Business Account'
                    )}
                  </Button>
                </div>

                {/* Bottom Back Button - Mobile Only */}
                <div className="sm:hidden pt-4 border-t overflow-hidden break-words">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/join')}
                    className="w-full text-sm h-10"
                    data-testid="button-back-bottom"
                  >
                    ← Back to Join
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}