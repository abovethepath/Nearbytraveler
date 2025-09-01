import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Logo from "@/components/logo";
import { Building, MapPin, Globe, Phone, Mail, Clock, Users, Camera } from "lucide-react";

interface BusinessFormData {
  // Basic user info from previous step
  email: string;
  password: string;
  username: string;
  name: string;
  age: number;
  
  // Business specific fields
  businessName: string;
  businessType: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  businessHours: string;
  servicesOffered: string[];
  specialties: string[];
  businessLicense: string;
  yearEstablished: string;
  employeeCount: string;
  priceRange: string;
  businessImages: string[];
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
}

export default function BusinessRegistration() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BusinessFormData>({
    email: "",
    password: "",
    username: "",
    name: "",
    age: 18,
    businessName: "",
    businessType: "",
    businessDescription: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    businessHours: "",
    servicesOffered: [],
    specialties: [],
    businessLicense: "",
    yearEstablished: "",
    employeeCount: "",
    priceRange: "",
    businessImages: [],
    socialMedia: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
  });

  useEffect(() => {
    // Load basic registration data from sessionStorage
    const savedData = sessionStorage.getItem('businessRegistrationData');
    if (savedData) {
      const basicData = JSON.parse(savedData);
      setFormData(prev => ({
        ...prev,
        ...basicData
      }));
    } else {
      // Redirect back to auth if no basic data
      window.location.href = "/join";
    }
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/register", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Business registered successfully!",
        description: "Welcome to Nearby Traveler Business Network.",
      });
      
      // Clear session storage
      sessionStorage.removeItem('businessRegistrationData');
      
      // Store user data and redirect
      localStorage.setItem("travelconnect_user", JSON.stringify(response));
      window.location.href = "/profile";
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddService = (service: string) => {
    if (service && !formData.servicesOffered.includes(service)) {
      setFormData({
        ...formData,
        servicesOffered: [...formData.servicesOffered, service],
      });
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData({
      ...formData,
      servicesOffered: formData.servicesOffered.filter(s => s !== service),
    });
  };

  const handleAddSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
  };

  const handleAddCustomService = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const service = e.currentTarget.value.trim();
      handleAddService(service);
      e.currentTarget.value = '';
    }
  };

  const handleAddCustomSpecialty = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const specialty = e.currentTarget.value.trim();
      handleAddSpecialty(specialty);
      e.currentTarget.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.businessName || !formData.businessType || !formData.businessDescription || !formData.businessAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required business fields.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      // Basic user info
      email: formData.email,
      password: formData.password,
      username: formData.username,
      name: formData.name,
      userType: "business",
      age: formData.age,
      
      // Business info
      businessName: formData.businessName,
      businessType: formData.businessType,
      businessDescription: formData.businessDescription,
      businessAddress: formData.businessAddress,
      businessPhone: formData.businessPhone,
      businessEmail: formData.businessEmail || formData.email,
      businessWebsite: formData.businessWebsite,
      businessHours: formData.businessHours,
      servicesOffered: formData.servicesOffered,
      specialties: formData.specialties,
      businessLicense: formData.businessLicense,
      yearEstablished: formData.yearEstablished,
      employeeCount: formData.employeeCount,
      priceRange: formData.priceRange,
      socialMedia: formData.socialMedia,
      profileImage: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-travel-blue to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo variant="navbar" />
          </div>
          <p className="text-white font-medium">Join the Nearby Traveler Business Network</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Building className="w-6 h-6" />
              Business Registration
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Connect with travelers and locals visiting your area. Showcase your business to a global audience.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Pricing Information */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">Business Membership Benefits</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg border-2 border-green-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">$50/month</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">+ $100 sign-up fee</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Currently FREE during beta</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div>✓ Promote to targeted travelers</div>
                    <div>✓ Create special offers</div>
                    <div>✓ Connect with your community</div>
                    <div>✓ Business dashboard analytics</div>
                    <div>✓ Customer review management</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Your business name"
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="hotel">Hotel/Accommodation</SelectItem>
                    <SelectItem value="tour_guide">Tour Guide</SelectItem>
                    <SelectItem value="activity_provider">Activity Provider</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="retail">Retail/Shopping</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="spa_wellness">Spa/Wellness</SelectItem>
                    <SelectItem value="outdoor_adventure">Outdoor/Adventure</SelectItem>
                    <SelectItem value="cultural">Cultural/Educational</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="businessDescription">Business Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Describe your business, what makes it special, and what you offer to travelers..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Input
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  placeholder="Full business address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessPhone">Phone Number</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessWebsite">Website</Label>
                <Input
                  id="businessWebsite"
                  value={formData.businessWebsite}
                  onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="businessHours">Business Hours</Label>
                <Input
                  id="businessHours"
                  value={formData.businessHours}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                />
              </div>
            </div>

            {/* Services Offered */}
            <div>
              <Label>Services Offered</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.servicesOffered.map((service) => (
                  <Badge
                    key={service}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveService(service)}
                  >
                    {service} ×
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Select onValueChange={handleAddService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from common services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guided Tours">Guided Tours</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Activities">Activities</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type your own service and press Enter"
                  onKeyDown={handleAddCustomService}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Specialties */}
            <div>
              <Label>Specialties & Unique Features</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveSpecialty(specialty)}
                  >
                    {specialty} ×
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Select onValueChange={handleAddSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local Cuisine">Local Cuisine</SelectItem>
                    <SelectItem value="Historical Tours">Historical Tours</SelectItem>
                    <SelectItem value="Adventure Sports">Adventure Sports</SelectItem>
                    <SelectItem value="Cultural Experiences">Cultural Experiences</SelectItem>
                    <SelectItem value="Family Friendly">Family Friendly</SelectItem>
                    <SelectItem value="Luxury Services">Luxury Services</SelectItem>
                    <SelectItem value="Budget Friendly">Budget Friendly</SelectItem>
                    <SelectItem value="Eco Tourism">Eco Tourism</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type your own specialty and press Enter"
                  onKeyDown={handleAddCustomSpecialty}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Additional Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearEstablished">Year Established</Label>
                <Input
                  id="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div>
                <Label htmlFor="employeeCount">Number of Employees</Label>
                <Select value={formData.employeeCount} onValueChange={(value) => setFormData({ ...formData, employeeCount: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Just me</SelectItem>
                    <SelectItem value="2-5">2-5 employees</SelectItem>
                    <SelectItem value="6-10">6-10 employees</SelectItem>
                    <SelectItem value="11-25">11-25 employees</SelectItem>
                    <SelectItem value="26-50">26-50 employees</SelectItem>
                    <SelectItem value="51+">51+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select value={formData.priceRange} onValueChange={(value) => setFormData({ ...formData, priceRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">Budget ($)</SelectItem>
                  <SelectItem value="$$">Moderate ($$)</SelectItem>
                  <SelectItem value="$$$">Premium ($$$)</SelectItem>
                  <SelectItem value="$$$$">Luxury ($$$$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="businessLicense">Business License/Registration Number</Label>
              <Input
                id="businessLicense"
                value={formData.businessLicense}
                onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                placeholder="Optional - helps build trust"
              />
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                    })}
                    placeholder="@yourbusiness"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                    })}
                    placeholder="facebook.com/yourbusiness"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                    })}
                    placeholder="@yourbusiness"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={registerMutation.isPending}
              className="w-full"
              size="lg"
            >
              {registerMutation.isPending ? "Creating Account..." : "Complete Business Registration"}
            </Button>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-sm"
              >
                ← Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}