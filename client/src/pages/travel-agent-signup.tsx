import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plane, 
  MapPin, 
  Award, 
  Users, 
  DollarSign, 
  Globe, 
  Camera,
  ArrowLeft,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import SmartLocationInput from "@/components/SmartLocationInput";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const travelAgentSignupSchema = z.object({
  // Basic Info
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  confirmEmail: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be 8 characters or more"),
  confirmPassword: z.string().min(8, "Password must be 8 characters or more"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  
  // Business Info
  businessName: z.string().min(2, "Business name is required"),
  tagline: z.string().optional(),
  description: z.string().min(50, "Please provide a detailed description (minimum 50 characters)"),
  yearsExperience: z.number().min(0, "Years of experience must be 0 or greater"),
  
  // Contact Info
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  officeAddress: z.string().optional(),
  
  // Location
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  
  // Specializations
  specialties: z.array(z.string()).min(1, "Please select at least one specialty"),
  destinationExpertise: z.array(z.string()).min(1, "Please select at least one destination expertise"),
  certifications: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).min(1, "Please select at least one language"),
  
  // Agreement
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  subscribeNewsletter: z.boolean().optional(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Emails don't match",
  path: ["confirmEmail"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TravelAgentSignupForm = z.infer<typeof travelAgentSignupSchema>;

const TRAVEL_SPECIALTIES = [
  "Luxury Travel", "Adventure Travel", "Family Travel", "Honeymoon/Romance",
  "Group Travel", "Corporate Travel", "Cruise Specialist", "Safari Specialist",
  "Cultural Tours", "Food & Wine Tours", "Photography Tours", "Wellness Travel",
  "Religious/Pilgrimage", "Sports Travel", "Educational Travel", "Eco-Tourism",
  "River Cruises", "Expedition Cruises", "Destination Weddings", "Multi-Generational"
];

const DESTINATION_EXPERTISE = [
  "Europe", "Asia", "Africa", "South America", "North America", "Australia/Oceania",
  "Caribbean", "Mediterranean", "Scandinavia", "Middle East", "India", "Japan",
  "China", "Southeast Asia", "Antarctica", "Arctic", "Patagonia", "Galapagos",
  "Madagascar", "New Zealand", "Iceland", "Morocco", "Egypt", "Peru", "Chile",
  "Argentina", "Brazil", "Costa Rica", "Kenya", "Tanzania", "South Africa"
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch",
  "Chinese (Mandarin)", "Japanese", "Korean", "Arabic", "Russian", "Hindi",
  "Thai", "Vietnamese", "Indonesian", "Turkish", "Greek", "Hebrew", "Swahili"
];

const CERTIFICATIONS = [
  "Certified Travel Counselor (CTC)", "Certified Travel Associate (CTA)",
  "Master Cruise Counselor (MCC)", "Accredited Cruise Counselor (ACC)",
  "Destination Specialist", "Luxury Travel Advisor", "Adventure Travel Specialist",
  "Group Travel Specialist", "Honeymoon & Romance Specialist", "Family Travel Specialist"
];

export default function TravelAgentSignup() {
  // PAUSED FEATURE - Redirect to home
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  
  return null;
}

function TravelAgentSignupPaused() {
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useLocation();
  const { setUser } = useContext(AuthContext);
  const { toast } = useToast();
  
  const form = useForm<TravelAgentSignupForm>({
    resolver: zodResolver(travelAgentSignupSchema),
    defaultValues: {
      specialties: [],
      destinationExpertise: [],
      certifications: [],
      languagesSpoken: [],
      agreeToTerms: false,
      subscribeNewsletter: true,
      yearsExperience: 0,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: TravelAgentSignupForm) => {
      const response = await apiRequest("POST", "/api/signup/travel-agent", data);
      return response.json();
    },
    onSuccess: (user) => {
      setUser(user);
      localStorage.setItem('travelconnect_user', JSON.stringify(user));
      localStorage.setItem('travelconnect_token', 'authenticated');
      toast({
        title: "Welcome to Nearby Traveler!",
        description: "Your travel agent account has been created successfully.",
      });
      setLocation("/welcome-travel-agent");
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TravelAgentSignupForm) => {
    signupMutation.mutate(data);
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="absolute left-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Join as Travel Agent</h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create your professional travel agent profile and mini-website to showcase your expertise, 
            manage clients, and grow your business on our platform.
          </p>
          <div className="mt-6">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Step {currentStep} of 4</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="mb-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Let's start with your basic account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Your full name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        {...form.register("username")}
                        placeholder="Choose a unique username"
                      />
                      {form.formState.errors.username && (
                        <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="your@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmEmail">Confirm Email *</Label>
                      <Input
                        id="confirmEmail"
                        type="email"
                        {...form.register("confirmEmail")}
                        placeholder="Confirm your email"
                      />
                      {form.formState.errors.confirmEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.confirmEmail.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...form.register("password")}
                        placeholder="Create a strong password"
                      />
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...form.register("confirmPassword")}
                        placeholder="Confirm your password"
                      />
                      {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 2: Business Information */}
            {currentStep === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Tell us about your travel agency and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        {...form.register("businessName")}
                        placeholder="Your travel agency name"
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-red-500">{form.formState.errors.businessName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="tagline">Business Tagline</Label>
                      <Input
                        id="tagline"
                        {...form.register("tagline")}
                        placeholder="e.g., 'Luxury Safari Specialist'"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Business Description *</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Describe your travel agency, services, and what makes you unique..."
                      rows={4}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearsExperience">Years of Experience *</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        {...form.register("yearsExperience", { valueAsNumber: true })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Business Phone *</Label>
                      <Input
                        id="contactPhone"
                        {...form.register("contactPhone")}
                        placeholder="(555) 123-4567"
                      />
                      {form.formState.errors.contactPhone && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="officeAddress">Office Address</Label>
                    <Input
                      id="officeAddress"
                      {...form.register("officeAddress")}
                      placeholder="Your business address (optional)"
                    />
                  </div>

                  <div>
                    <Label>Business Location *</Label>
                    <SmartLocationInput
                      city={form.watch("city") || ""}
                      state={form.watch("state") || ""}
                      country={form.watch("country") || ""}
                      onLocationChange={(location) => {
                        form.setValue("country", location.country);
                        form.setValue("city", location.city);
                        form.setValue("state", location.state || "");
                      }}
                      required={true}
                    />
                    {(form.formState.errors.country || form.formState.errors.city) && (
                      <p className="text-sm text-red-500">Please select your business location</p>
                    )}
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 3: Specializations & Expertise */}
            {currentStep === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Specializations & Expertise
                  </CardTitle>
                  <CardDescription>
                    Showcase your travel expertise and specializations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">Travel Specialties *</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select the types of travel you specialize in
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {TRAVEL_SPECIALTIES.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Checkbox
                            id={`specialty-${specialty}`}
                            checked={form.watch("specialties")?.includes(specialty)}
                            onCheckedChange={(checked) => {
                              const currentSpecialties = form.getValues("specialties") || [];
                              if (checked) {
                                form.setValue("specialties", [...currentSpecialties, specialty]);
                              } else {
                                form.setValue("specialties", currentSpecialties.filter(s => s !== specialty));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`specialty-${specialty}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.specialties && (
                      <p className="text-sm text-red-500">{form.formState.errors.specialties.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Destination Expertise *</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select the destinations you have expertise in
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {DESTINATION_EXPERTISE.map((destination) => (
                        <div key={destination} className="flex items-center space-x-2">
                          <Checkbox
                            id={`destination-${destination}`}
                            checked={form.watch("destinationExpertise")?.includes(destination)}
                            onCheckedChange={(checked) => {
                              const currentDestinations = form.getValues("destinationExpertise") || [];
                              if (checked) {
                                form.setValue("destinationExpertise", [...currentDestinations, destination]);
                              } else {
                                form.setValue("destinationExpertise", currentDestinations.filter(d => d !== destination));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`destination-${destination}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {destination}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.destinationExpertise && (
                      <p className="text-sm text-red-500">{form.formState.errors.destinationExpertise.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Languages Spoken *</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select the languages you speak
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {LANGUAGES.map((language) => (
                        <div key={language} className="flex items-center space-x-2">
                          <Checkbox
                            id={`language-${language}`}
                            checked={form.watch("languagesSpoken")?.includes(language)}
                            onCheckedChange={(checked) => {
                              const currentLanguages = form.getValues("languagesSpoken") || [];
                              if (checked) {
                                form.setValue("languagesSpoken", [...currentLanguages, language]);
                              } else {
                                form.setValue("languagesSpoken", currentLanguages.filter(l => l !== language));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`language-${language}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {language}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.languagesSpoken && (
                      <p className="text-sm text-red-500">{form.formState.errors.languagesSpoken.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Professional Certifications</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select any travel industry certifications you have
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {CERTIFICATIONS.map((certification) => (
                        <div key={certification} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cert-${certification}`}
                            checked={form.watch("certifications")?.includes(certification)}
                            onCheckedChange={(checked) => {
                              const currentCertifications = form.getValues("certifications") || [];
                              if (checked) {
                                form.setValue("certifications", [...currentCertifications, certification]);
                              } else {
                                form.setValue("certifications", currentCertifications.filter(c => c !== certification));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`cert-${certification}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {certification}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 4: Review & Agreement */}
            {currentStep === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Review & Complete
                  </CardTitle>
                  <CardDescription>
                    Review your information and complete your registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subscription Pricing */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-950 dark:to-orange-950">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Travel Agent Subscription - $50/month
                      </CardTitle>
                      <CardDescription>
                        Professional travel agent tools and mini-website
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">What's Included:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Professional mini-website showcase</li>
                            <li>• Trip listings with booking management</li>
                            <li>• Private client chatrooms</li>
                            <li>• Client management dashboard</li>
                            <li>• Commission tracking tools</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Growth Benefits:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Access to platform's traveler network</li>
                            <li>• Professional credibility boost</li>
                            <li>• Automated client communication</li>
                            <li>• Marketing exposure to new clients</li>
                            <li>• Analytics and performance insights</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          🎉 Currently FREE during beta! Start building your client base now.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Agreement */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={form.watch("agreeToTerms")}
                        onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. I understand that by joining as a travel agent, I will have access to premium features and tools to manage my business on the platform.
                      </Label>
                    </div>
                    {form.formState.errors.agreeToTerms && (
                      <p className="text-sm text-red-500">{form.formState.errors.agreeToTerms.message}</p>
                    )}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="subscribeNewsletter"
                        checked={form.watch("subscribeNewsletter")}
                        onCheckedChange={(checked) => form.setValue("subscribeNewsletter", !!checked)}
                      />
                      <Label htmlFor="subscribeNewsletter" className="text-sm">
                        Subscribe to travel industry updates and platform news (recommended)
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Travel Agent Account"}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}