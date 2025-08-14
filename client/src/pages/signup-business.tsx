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
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Business Information
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  customBusinessType: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone number is required"),
  veteranOwned: z.boolean().optional(),
  activeDutyOwned: z.boolean().optional(),
  businessDescription: z.string().optional(),
  businessWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  
  // Full Business Address
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  zipCode: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(1, "Country is required"),
  
  // Contact Person Information (Private - for admin use only)
  contactPersonName: z.string().min(1, "Contact person name is required"),
  contactPersonTitle: z.string().min(1, "Contact person title is required"),
  contactPersonEmail: z.string().email("Please enter a valid contact email"),
  contactPersonPhone: z.string().min(1, "Contact person phone is required"),
  
  // Additional Business Details
  yearEstablished: z.string().min(1, "Year established is required"),
  employeeCount: z.string().optional(),

  
  // Business Interests & Activities (for matching with users)
  interests: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  customInterests: z.string().optional(),
  customActivities: z.string().optional(),
  
  // Geolocation for proximity notifications
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
      businessDescription: accountData?.businessDescription || "",
      businessWebsite: "",
      veteranOwned: false,
      activeDutyOwned: false,
      streetAddress: "",
      city: accountData?.city || "",
      state: "",
      zipCode: "",
      country: "",
      contactPersonName: "",
      contactPersonTitle: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      yearEstablished: "",
      employeeCount: "",

      interests: [],
      activities: [],
      customInterests: "",
      customActivities: "",
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
      
      // Add custom interests to the interests array
      if (data.customInterests) {
        const customInterestsList = data.customInterests
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        processedData.interests = [...(data.interests || []), ...customInterestsList];
      }
      
      // Add custom activities to the activities array
      if (data.customActivities) {
        const customActivitiesList = data.customActivities
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        processedData.activities = [...(data.activities || []), ...customActivitiesList];
      }
      
      // Remove the custom fields from the final data since they're now merged
      delete processedData.customInterests;
      delete processedData.customActivities;
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
      
      // Redirect to business welcome page to explain features and setup
      window.location.href = '/welcome-business';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="text-center">
            <Building className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <CardTitle className="text-3xl">Register Your Business</CardTitle>
            <CardDescription className="text-lg">
              Join Nearby Traveler's Business Network - Connect with travelers and locals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Back Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/join')}
                className="flex items-center gap-2 px-4 py-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                data-testid="button-back-top"
              >
                ← Back to Join
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Account Information Section - Pre-filled from join page */}
                {accountData && (
                  <div className="space-y-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Account Information ✓
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Account details from step 1 (automatically filled)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Business Name" {...field} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </FormControl>
                            <FormDescription>
                              From step 1 registration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="businessusername" {...field} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="business@email.com" {...field} disabled className="bg-gray-100 dark:bg-gray-800" />
                            </FormControl>
                            <FormDescription>
                              Email for account login and business contact
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" value="••••••••" disabled className="bg-gray-100 dark:bg-gray-800" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Business Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Custom Business Type Field */}
                  {form.watch("businessType") === "Custom (specify below)" && (
                    <FormField
                      control={form.control}
                      name="customBusinessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Business Type *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business type" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>
                          Public phone number for customer inquiries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Business Description already collected in step 1, showing read-only for confirmation */}
                  {accountData?.businessDescription && (
                    <div className="space-y-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <FormLabel className="text-sm font-medium">Business Description ✓</FormLabel>
                      <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded border">
                        {accountData.businessDescription}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">From step 1 registration</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="yearEstablished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Established *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1900" 
                              max="2025" 
                              placeholder="e.g. 2020" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Employees (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employeeCounts.map((count) => (
                                <SelectItem key={count} value={count}>
                                  {count}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourbusiness.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Veteran/Military Owned Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="veteranOwned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Veteran Owned Business
                            </FormLabel>
                            <FormDescription>
                              Check if this business is veteran owned
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activeDutyOwned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Active Duty Owned Business
                            </FormLabel>
                            <FormDescription>
                              Check if this business is active duty military owned
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Address Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Business Address
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street, Suite 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormLabel className="text-gray-900 dark:text-white">City, State/Province, Country *</FormLabel>
                      <SmartLocationInput
                        city={form.watch("city")}
                        state={form.watch("state")}
                        country={form.watch("country")}
                        onLocationChange={(location) => {
                          form.setValue("city", location.city);
                          form.setValue("state", location.state);
                          form.setValue("country", location.country);
                        }}
                        required={true}
                        placeholder={{
                          country: "Select country",
                          state: "Select state/region",
                          city: "Select city"
                        }}
                      />
                      {(form.formState.errors.city || form.formState.errors.country || form.formState.errors.state) && (
                        <p className="text-sm font-medium text-destructive mt-1">
                          {form.formState.errors.city?.message || form.formState.errors.country?.message || form.formState.errors.state?.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Person Section */}
                <div className="space-y-4 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Primary Contact Person
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This information is private and only used by Nearby Traveler staff for account issues and support.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPersonTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title/Position *</FormLabel>
                          <FormControl>
                            <Input placeholder="Owner, Manager, Director" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@business.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPersonPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 987-6543" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Location & Proximity Notifications Section */}
                <div className="space-y-6 bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <Navigation className="w-5 h-5 text-orange-500" />
                      Business Location for Proximity Notifications
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <strong>🎯 IMPORTANT:</strong> Capture your business's GPS coordinates so nearby travelers can receive notifications about your services. This enables proximity-based marketing when travelers are close to your location.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {!locationCaptured ? (
                      <div className="text-center p-6 border-2 border-dashed border-orange-300 dark:border-orange-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Navigation className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Enable Proximity Notifications
                        </h4>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 font-semibold">
                          Allow us to capture your business location so travelers nearby can discover your services and receive targeted notifications.
                        </p>
                        <Button
                          type="button"
                          onClick={getBusinessLocation}
                          disabled={isGettingLocation}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {isGettingLocation ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 mr-2" />
                              Capture Business Location
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600 rounded-lg">
                        <div className="text-green-600 dark:text-green-400 mb-4">
                          ✅ Location Captured Successfully!
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Coordinates:</strong> {form.watch('currentLatitude')?.toFixed(6)}, {form.watch('currentLongitude')?.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Travelers within 7 miles will now be able to receive notifications about your business.
                        </p>
                        <Button
                          type="button"
                          onClick={getBusinessLocation}
                          disabled={isGettingLocation}
                          variant="outline"
                          size="sm"
                          className="mt-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Update Location
                        </Button>
                      </div>
                    )}

                    {/* Location Sharing Toggle */}
                    <FormField
                      control={form.control}
                      name="locationSharingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium text-gray-900 dark:text-white">
                              Enable Proximity Notifications to Travelers
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                              Allow nearby travelers (within 7 miles) to receive notifications about your business based on their interests and your offerings. This helps drive foot traffic and customer discovery.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>


                </div>

                {/* Business Interests & Activities Section */}
                <div className="space-y-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Business Interests & Target Audience
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Select interests that match your business offerings. This helps us connect you with travelers and locals who are interested in what you provide. (No minimum required for businesses)
                    </p>
                  </div>

                  {/* Interests Selection */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Business-Related Interests</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {getAllInterests().map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            const currentInterests = form.getValues("interests") || [];
                            if (currentInterests.includes(interest)) {
                              form.setValue("interests", currentInterests.filter(i => i !== interest));
                            } else {
                              form.setValue("interests", [...currentInterests, interest]);
                            }
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all border ${
                            (form.watch("interests") || []).includes(interest)
                              ? 'bg-blue-600 text-white border-blue-600 font-bold transform scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activities Selection */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Business Activities & Services
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {getAllActivities().map((activity) => (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => {
                            const currentActivities = form.getValues("activities") || [];
                            if (currentActivities.includes(activity)) {
                              form.setValue("activities", currentActivities.filter(a => a !== activity));
                            } else {
                              form.setValue("activities", [...currentActivities, activity]);
                            }
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all border ${
                            (form.watch("activities") || []).includes(activity)
                              ? 'bg-green-600 text-white border-green-600 font-bold transform scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300'
                          }`}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Interests & Activities */}
                  <div className="space-y-4 border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Custom Keywords</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add custom interests and activities specific to your business. These help users find you through unique searches.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customInterests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Interests</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., sustainable travel, digital nomads, photography tours, wine tasting..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Separate multiple interests with commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customActivities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Activities</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., rooftop dining, escape rooms, kayak rentals, cooking classes..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Separate multiple activities with commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>💡 Tip:</strong> Select interests and activities that best represent what your business offers, plus add custom keywords. 
                      This helps travelers and locals discover your business when they're looking for specific experiences or services.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/join')}
                    className="flex-1 py-4 text-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    data-testid="button-back"
                  >
                    ← Back to Join
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 py-4 text-lg bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || signupMutation.isPending}
                    data-testid="button-register"
                  >
                    {isLoading || signupMutation.isPending ? "Creating Business Account..." : "Complete Registration"}
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