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
import { useAuth } from "@/App";
import { useEffect } from "react";

const businessSignupSchema = z.object({
  // Account Owner Information (for platform communication)
  username: z.string().min(6, "Username must be 6-12 characters").max(12, "Username must be 6-12 characters"),
  email: z.string().email("Please enter a valid email").refine((val) => {
    // Allow email variants for multiple businesses (e.g., owner+restaurant@example.com)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, "Please enter a valid email address"),
  password: z.string().min(8, "Password must be 8 characters or more"),
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact person name is required"),
  ownerPhone: z.string().min(1, "Contact phone is required").refine((val) => {
    // Accept various international phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number (supports international formats)"),
  
  // Essential Business Information Only
  businessType: z.string().min(1, "Business type is required"),
  customBusinessType: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone number is required").refine((val) => {
    // Accept various international phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number (supports international formats)"),
  
  // Basic Location (City is required for metro area matching)
  streetAddress: z.string().min(1, "Street address is required for location services"),
  zipCode: z.string().min(1, "Zip/Postal code is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  
  // Optional website - Accept any reasonable format
  businessWebsite: z.string().optional(),
  
  // Location services for proximity features
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
  locationSharingEnabled: z.boolean().default(true),
});

type BusinessSignupData = z.infer<typeof businessSignupSchema>;

export default function SignupBusinessSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, login } = useAuth();
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

  // Redirect authenticated business users to their welcome/dashboard page
  useEffect(() => {
    console.log('🔍 Business Signup Page - Auth Check:', { isAuthenticated, userType: user?.userType, username: user?.username });
    if (isAuthenticated && user?.userType === 'business') {
      console.log('🔄 Business user already authenticated, redirecting to welcome page');
      setLocation('/welcome-business');
      return;
    }
  }, [isAuthenticated, user, setLocation]);

  // Early return if user is already authenticated as business
  if (isAuthenticated && user?.userType === 'business') {
    console.log('🔄 Rendering redirect for authenticated business user');
    return <div>Redirecting...</div>;
  }

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
      contactName: accountData?.name || "", // Business name from step 1 goes to contactName field
      businessName: "", // Manager's name - BLANK for manual entry
      ownerPhone: "",
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
      // Show initial loading message
      toast({
        title: "Creating your business account...",
        description: "Setting up your business profile and generating personalized content. This may take a few moments. You'll receive a welcome email - check your promotions tab if needed and mark as not spam.",
        variant: "default",
      });

      // Check for referral information
      const referralCode = sessionStorage.getItem('referralCode');
      const connectionNote = sessionStorage.getItem('connectionNote');
      
      if (referralCode) {
        console.log('✅ Found referral code from QR signup:', referralCode);
        if (connectionNote) {
          console.log('📝 Found connection note:', connectionNote);
        }
      }

      // Process custom business type
      const processedData = { ...data };
      
      // CRITICAL: Set name field for user record (business name)
      (processedData as any).name = data.businessName;
      // Map contactName to ownerName for database storage
      (processedData as any).ownerName = data.contactName;
      
      // Handle website URL - add https:// if missing protocol and set to websiteUrl
      let finalWebsiteUrl = "";
      if (processedData.businessWebsite && processedData.businessWebsite.trim()) {
        const website = processedData.businessWebsite.trim();
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          finalWebsiteUrl = `https://${website}`;
        } else {
          finalWebsiteUrl = website;
        }
      }
      (processedData as any).websiteUrl = finalWebsiteUrl;
      
      // Handle custom business type
      if (data.businessType === "Custom (specify below)" && data.customBusinessType) {
        processedData.businessType = data.customBusinessType;
      }
      
      // Remove the custom and temporary fields from the final data since they're now merged
      delete processedData.customBusinessType;
      delete processedData.businessWebsite; // Remove since we moved it to websiteUrl

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...processedData,
          userType: "business",
          websiteUrl: (processedData as any).websiteUrl, // Ensure websiteUrl is included
          // Include referral information if available
          ...(referralCode && { referralCode }),
          ...(connectionNote && { connectionNote })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      // Handle referral success message
      const referralCode = sessionStorage.getItem('referralCode');
      const referrerInfo = sessionStorage.getItem('referrerInfo');
      
      let successMessage = "Welcome to Nearby Traveler Business Network!";
      if (referralCode && referrerInfo) {
        try {
          const referrer = JSON.parse(referrerInfo);
          successMessage = `You're now connected with ${referrer.name}! Welcome to the Business Network!`;
        } catch (error) {
          console.error('Error parsing referrer info:', error);
        }
      }

      toast({
        title: "Business Registration Successful!",
        description: successMessage,
      });
      
      // CRITICAL: Update the authentication context first
      if (response.user && response.token) {
        login(response.user, response.token);
      }
      
      // Store auth data in localStorage as backup (login function should handle this)
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
      
      // Clean up referral data if it exists
      if (referralCode) {
        sessionStorage.removeItem('referralCode');
        sessionStorage.removeItem('referrerInfo');
        sessionStorage.removeItem('connectionNote');
      }
      
      // Small delay to ensure context update, then redirect to welcome page
      setTimeout(() => {
        setLocation('/welcome-business');
      }, 100);
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
    
    // Store data for background processing
    const registrationData = {
      ...data,
      userType: "business",
      businessName: accountData?.name || "",
    };
    sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
    
    // Show success and redirect immediately
    toast({
      title: "Business account created!",
      description: "Redirecting to your success page...",
      variant: "default",
    });

    // Redirect immediately
    setLocation('/account-success');
    
    // Start background registration with profile completion
    setTimeout(async () => {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            userType: "business",
            businessName: accountData?.name || "",
          })
        });

        const result = await response.json();

        if (response.ok && result.user) {
          console.log('✅ Fast business registration completed - starting profile completion');
          
          // Store authentication data
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Start profile completion in background
          try {
            const profileResponse = await fetch('/api/auth/complete-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: result.user.id })
            });
            
            if (profileResponse.ok) {
              console.log('✅ Business profile completion successful');
            } else {
              console.log('⚠️ Business profile completion had issues, but registration succeeded');
            }
          } catch (profileError) {
            console.log('⚠️ Business profile completion error, but registration succeeded:', profileError);
          }
        } else {
          console.error('❌ Business registration failed:', result.message);
        }
      } catch (error) {
        console.error('Business background registration error:', error);
      }
    }, 100);
    
    setIsLoading(false);
  };

  const businessTypes = BUSINESS_TYPES;

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4 lg:py-8 px-2 sm:px-4 lg:px-8 overflow-hidden break-words">
      <div className="max-w-4xl mx-auto overflow-hidden break-words">
        <Card className="border border-gray-200 shadow-lg bg-white overflow-hidden break-words">
          <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6 overflow-hidden break-words">
            <Building className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-blue-600 mb-2 sm:mb-4" />
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl break-words overflow-hidden">Register Your Business</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base lg:text-lg break-words overflow-hidden">
              Quick signup - Complete your detailed business profile after registration
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 overflow-hidden break-words">
            {/* Back Button */}
            <div className="mb-4 sm:mb-6 overflow-hidden break-words">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/auth?mode=register')}
                className="flex items-center gap-2 px-3 py-2 text-sm sm:text-base border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 h-9 sm:h-10 md:h-11 break-words overflow-hidden"
                data-testid="button-back-top"
              >
                ← Back to Join
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8 overflow-hidden break-words">
                
                {/* Account Owner Information Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 bg-blue-50 p-3 sm:p-4 md:p-6 rounded-lg overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words overflow-hidden">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="break-words overflow-hidden">Account Owner Information</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words overflow-hidden">
                    Contact information for the person managing this account
                  </p>
                  <div className="space-y-3 sm:space-y-4 overflow-hidden break-words">
                    {/* AI-Companion Responsive Grid - FIELDS SWAPPED TO MATCH LABELS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden break-words">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Business Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your Business Name" 
                                {...field}
                                data-testid="input-business-name"
                                className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
                              Legal name of your business (from step 1)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Contact Person Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Smith" 
                                {...field}
                                data-testid="input-contact-person-name"
                                className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
                              Your full name (owner or manager)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Contact Person Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 (555) 123-4567" 
                              {...field} 
                              className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                              type="tel"
                            />
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
                            Direct line to reach the account owner
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* AI-Companion Responsive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden break-words">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="businessusername" 
                                {...field} 
                                disabled 
                                className="bg-gray-100 dark:bg-gray-800 h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden" 
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
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
                          <FormItem className="overflow-hidden break-words">
                            <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="owner@example.com" 
                                {...field} 
                                disabled 
                                className="bg-gray-100 dark:bg-gray-800 h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden" 
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
                              Owner's email for platform notifications. <br/>
                              <span className="text-xs text-blue-600 dark:text-blue-400 break-words overflow-hidden">
                                💡 <strong>Multiple Businesses?</strong> Use email variants like: owner+restaurant@example.com
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Essential Business Information Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words overflow-hidden">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="break-words overflow-hidden">Business Information</span>
                  </h3>
                  
                  {/* AI-Companion Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden break-words">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Business Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 sm:h-10 md:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-sm sm:text-base">
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
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Customer Phone *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 (555) 123-4567" 
                              {...field} 
                              className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                              type="tel"
                            />
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm break-words overflow-hidden">
                            Public phone number customers will call
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Custom Business Type Field - Mobile Responsive */}
                  {form.watch("businessType") === "Custom (specify below)" && (
                    <FormField
                      control={form.control}
                      name="customBusinessType"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Custom Business Type *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your business type" 
                              {...field} 
                              className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                            />
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
                      <FormItem className="overflow-hidden break-words">
                        <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Website (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="www.yourbusiness.com" 
                            {...field} 
                            className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Basic Location Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words overflow-hidden">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="break-words overflow-hidden">Business Location</span>
                  </h3>
                  
                  {/* Street Address and Zip Code Row - AI-Companion Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 overflow-hidden break-words">
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Street Address *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Main Street" 
                              {...field} 
                              className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem className="overflow-hidden break-words">
                          <FormLabel className="text-sm sm:text-base break-words overflow-hidden">Zip/Postal Code *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="12345" 
                              {...field} 
                              className="h-9 sm:h-10 md:h-11 text-sm sm:text-base break-words overflow-hidden"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Smart Location Input - Mobile Responsive */}
                  <div className="overflow-hidden break-words">
                    <FormLabel className="text-sm sm:text-base font-medium mb-2 block text-gray-900 dark:text-white break-words overflow-hidden">Business Location *</FormLabel>
                    <SmartLocationInput
                      city={form.watch('city')}
                      state={form.watch('state')}
                      country={form.watch('country')}
                      onLocationChange={(location) => {
                        form.setValue('city', location.city);
                        form.setValue('state', location.state);
                        form.setValue('country', location.country);
                      }}
                      required={true}
                      placeholder={{
                        country: "Select country",
                        state: "Select state/province",
                        city: "Select city"
                      }}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* GPS Location Section - Mobile Responsive */}
                <div className="space-y-3 sm:space-y-4 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 md:p-6 rounded-lg overflow-hidden break-words">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 break-words overflow-hidden">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="break-words overflow-hidden">GPS Location (Recommended)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words overflow-hidden">
                    Enable GPS location to help travelers find your exact business location and get personalized recommendations.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 overflow-hidden break-words">
                    <Button
                      type="button"
                      onClick={getBusinessLocation}
                      disabled={isGettingLocation || locationCaptured}
                      className={`h-10 sm:h-11 md:h-12 px-4 sm:px-6 text-sm sm:text-base font-medium transition-colors break-words overflow-hidden ${
                        locationCaptured 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span className="break-words overflow-hidden">
                        {isGettingLocation ? 'Getting Location...' : 
                         locationCaptured ? '✓ Location Captured' : 'Get My Business Location'}
                      </span>
                    </Button>
                    
                    {locationCaptured && (
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 break-words overflow-hidden">
                        ✓ Business coordinates saved successfully
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button - Mobile Responsive */}
                <div className="pt-4 sm:pt-6 overflow-hidden break-words">
                  <Button
                    type="submit"
                    disabled={signupMutation.isPending || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base md:text-lg h-12 sm:h-14 md:h-16 break-words overflow-hidden"
                  >
                    <span className="break-words overflow-hidden">
                      {signupMutation.isPending || isLoading ? "Creating Account... (This may take a few moments)" : "Complete Business Registration"}
                    </span>
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