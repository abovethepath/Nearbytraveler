import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Building, MapPin, User, Zap } from "lucide-react";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { BUSINESS_TYPES } from "../../../shared/base-options";

const businessSignupSchema = z.object({
  // Account Owner Information (for platform communication)
  username: z.string().min(6, "Username must be 6-14 characters").max(14, "Username must be 6-14 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  ownerName: z.string().min(1, "Account owner name is required"),
  ownerPhone: z.string().min(1, "Contact phone is required").refine((val) => {
    // Accept various international phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number (supports international formats)"),
  
  // Essential Business Information Only
  // businessName comes from step 1 account data
  businessType: z.string().min(1, "Business type is required"),
  customBusinessType: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone number is required").refine((val) => {
    // Accept various international phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number (supports international formats)"),
  
  // Basic Location (City is required for metro area matching)
  streetAddress: z.string().min(1, "Street address is required for location services"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  
  // Optional website - Allow empty string or valid URL with or without protocol
  businessWebsite: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Allow empty
    
    // Try with protocol first
    try {
      new URL(val);
      return true;
    } catch {
      // If it fails, try adding https:// prefix
      try {
        new URL(`https://${val}`);
        return true;
      } catch {
        return false;
      }
    }
  }, "Please enter a valid website URL (e.g., example.com or https://example.com)"),
  
  // Location services for proximity features
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
  locationSharingEnabled: z.boolean().default(true),
});

type BusinessSignupData = z.infer<typeof businessSignupSchema>;

export default function SignupBusinessSimple() {
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
      ownerName: accountData?.name || "",
      ownerPhone: "",
      // businessName comes from step 1, no need to collect again
      businessType: "",
      customBusinessType: "",
      businessPhone: "",
      businessWebsite: "",
      streetAddress: "",
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
      // Process custom business type
      const processedData = { ...data };
      
      // CRITICAL: Add the required "name" field using business name from step 1
      (processedData as any).name = accountData?.businessName || "";
      
      // Handle custom business type
      if (data.businessType === "Custom (specify below)" && data.customBusinessType) {
        processedData.businessType = data.customBusinessType;
      }
      
      // Handle website URL - add https:// if missing protocol
      if (processedData.businessWebsite && processedData.businessWebsite.trim()) {
        const website = processedData.businessWebsite.trim();
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          processedData.businessWebsite = `https://${website}`;
        }
      }
      
      // Remove the custom fields from the final data since they're now merged
      delete processedData.customBusinessType;

      const response = await fetch('/api/business-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...processedData,
          userType: "business",
          businessName: accountData?.businessName || "", // Include businessName from step 1
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="text-center">
            <Building className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <CardTitle className="text-3xl">Register Your Business</CardTitle>
            <CardDescription className="text-lg">
              Quick signup - Complete your detailed business profile after registration
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
                
                {/* Account Owner Information Section */}
                <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Owner Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact information for the person managing this account
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormDescription>
                            Name of the account owner/manager
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormDescription>
                            Direct line to reach the account owner
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
                          <FormDescription>
                            From step 1 registration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="owner@business.com" {...field} disabled className="bg-gray-100 dark:bg-gray-800" />
                          </FormControl>
                          <FormDescription>
                            Owner's email for platform notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Essential Business Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </h3>
                  

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={form.control}
                      name="businessPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormDescription>
                            Public phone number customers will call
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                    name="businessWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Basic Location Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Business Location
                  </h3>
                  
                  {/* Street Address Field - Required for location services */}
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street, Suite 100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Required for location services and customer directions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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

                  {/* Optional Location Services */}
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Location Services (Optional)</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Enable proximity notifications for nearby travelers</p>
                      </div>
                      <Button
                        type="button"
                        onClick={getBusinessLocation}
                        disabled={isGettingLocation}
                        size="sm"
                        variant={locationCaptured ? "default" : "outline"}
                        className={locationCaptured ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {locationCaptured ? "Location Captured ✓" : "Enable Location"}
                      </Button>
                    </div>
                    {locationCaptured && (
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✅ Location captured for proximity notifications
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Completion Notice */}
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 p-6 rounded-lg border-2 border-orange-200 dark:border-orange-700">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-8 h-8 text-orange-500 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Complete Your Profile to Match with Users!</h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-4">
                        After registration, <strong>you MUST complete your business profile</strong> to start matching with travelers and locals:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Essential for Matching:</h4>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                            <li><strong>Business Description</strong> - Tell your story</li>
                            <li><strong>Interests & Activities</strong> - What you offer</li>
                            <li><strong>Languages Spoken</strong> - For customer communication</li>
                            <li><strong>Services & Specialties</strong> - Your unique offerings</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Features:</h4>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                            <li>Create events and deals</li>
                            <li>Upload business photos</li>
                            <li>Set diversity ownership categories</li>
                            <li>Complete address and contact details</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-600">
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                          ⚠️ Without a complete profile, travelers and locals won't be able to find or connect with your business!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || signupMutation.isPending}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                  data-testid="button-register-business"
                >
                  {isLoading || signupMutation.isPending ? "Creating Account..." : "Register Business"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}