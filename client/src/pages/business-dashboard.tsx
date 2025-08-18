import React, { useState, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Eye, BarChart3, Calendar, DollarSign, Users, TrendingUp, CalendarDays, Camera, Image, MapPin, Clock, Percent, Tag, Gift, Zap } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import InstantDealCreator from "@/components/InstantDealCreator";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";

// Helper function to extract city from street address
function extractCityFromAddress(address: string | null | undefined): string {
  if (!address) return "";
  
  // Common patterns for extracting city from business addresses
  const cityPatterns = [
    /Santa Monica/i,
    /Venice/i,
    /Beverly Hills/i,
    /West Hollywood/i,
    /Hollywood/i,
    /Los Angeles/i,
    /Manhattan Beach/i,
    /Hermosa Beach/i,
    /Redondo Beach/i,
    /Culver City/i,
    /Marina del Rey/i,
    /Playa del Rey/i
  ];
  
  for (const pattern of cityPatterns) {
    if (pattern.test(address)) {
      return pattern.source.replace(/[\/\\^$*+?.()|[\]{}]/g, '').replace(/i$/, '');
    }
  }
  
  return "";
}

const CATEGORIES = [
  // FOOD & DINING (matching food interests/activities)
  "Restaurant", "Casual Restaurant", "Local Hotspot", "Speakeasy", "Cafe", "Bar", 
  "Brewery & Taproom", "Wine Bar", "Cocktail Lounge", "Rooftop Bar", "Food Truck", 
  "Street Food Vendor", "Late Night Eats", "Breakfast & Brunch Spot", "Dessert Shop",

  // NIGHTLIFE & ENTERTAINMENT (matching nightlife interests)
  "Nightclub", "Dance Club", "Live Music Venue", "Comedy Club", "Karaoke Bar", 
  "Gaming Lounge", "Arcade", "Escape Room", "Pool Hall", "Sports Bar",

  // ACTIVITIES & EXPERIENCES (matching adventure/activity interests)
  "Adventure Sports", "Outdoor Activity Provider", "Water Sports Rental", 
  "Bike Rental", "Equipment Rental", "Tour Company", "Walking Tour Guide",
  "Photography Tour", "Art Workshop Studio", "Cooking Class Studio",

  // ACCOMMODATION & TRAVEL
  "Hotel", "Hostel", "Boutique Hotel", "Travel Agency", "Transportation Service", 
  "Car Rental",

  // WELLNESS & PERSONAL CARE
  "Fitness Center", "Yoga Studio", "Spa", "Salon", "Massage Therapy", "Wellness Center",

  // ARTS & CULTURE
  "Art Gallery", "Museum", "Theater", "Cultural Experience", "Music Venue", 
  "Street Art Studio", "Creative Workshop",

  // SHOPPING & RETAIL
  "Shopping", "Retail Store", "Vintage Shop", "Record Store", "Souvenir Shop", 
  "Local Market", "Boutique", "Artisan Craft Shop",

  // PROFESSIONAL SERVICES
  "Professional Services", "Medical Services", "Educational Services",

  // GENERIC OPTIONS
  "Other", "Custom"
];

const TARGET_AUDIENCES = [
  'locals',
  'travelers',
  'both'
];

// Ensure data consistency
const cleanTargetAudience = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(v => TARGET_AUDIENCES.includes(v));
  }
  return TARGET_AUDIENCES.includes(value) ? [value] : [];
};

// Helper function for discount icons
const getDiscountIcon = (discountType: string) => {
  switch (discountType) {
    case 'percentage':
      return <Percent className="h-4 w-4" />;
    case 'fixed_amount':
      return <DollarSign className="h-4 w-4" />;
    case 'buy_one_get_one':
      return <Gift className="h-4 w-4" />;
    case 'free_service':
      return <Tag className="h-4 w-4" />;
    case 'free_item_with_purchase':
      return <Gift className="h-4 w-4" />;
    case 'combo_deal':
      return <Gift className="h-4 w-4" />;
    case 'other':
      return <Tag className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
};

const getCategoryDisplayName = (category: string) => {
  return category;
};

const DISCOUNT_TYPES = [
  'percentage',
  'fixed_amount',
  'buy_one_get_one',
  'free_service',
  'free_item_with_purchase',
  'combo_deal',
  'other'
];

const offerSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(120, "Description must be 120 characters or less"),
  category: z.string().min(1, "Category is required"),
  customCategory: z.string().optional(),
  discountType: z.string().min(1, "Discount type is required"),
  discountValue: z.string().min(1, "Discount value is required"),
  discountCode: z.string().optional(),
  targetAudience: z.array(z.string()).min(1, "At least one target audience required"),
  streetAddress: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().optional(),
  validFrom: z.string().min(1, "Start date is required"),
  validUntil: z.string().min(1, "End date is required"),
  maxRedemptions: z.string().optional(),
  maxRedemptionsPerUser: z.string().optional(),
  imageUrl: z.string().optional(),
  termsConditions: z.string().optional(),
  contactInfo: z.string().optional(),
  websiteUrl: z.string().optional(),
  tags: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema> & {
  customCategory?: string;
};

interface BusinessOffer {
  id: number;
  title: string;
  description: string;
  category: string;
  discountType: string;
  discountValue: string;
  discountCode?: string;
  targetAudience: string[];
  city: string;
  state?: string;
  country: string;
  validFrom: string;
  validUntil: string;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  currentRedemptions: number;
  viewCount: number;
  createdAt: string;
  tags?: string[] | string;
}

export default function BusinessDashboard() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BusinessOffer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOffer, setViewingOffer] = useState<BusinessOffer | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [reuseDialogOpen, setReuseDialogOpen] = useState(false);
  const [reuseDealData, setReuseDealData] = useState<any>(null);
  const [startingToday, setStartingToday] = useState(true);
  const [showQuickDealCreator, setShowQuickDealCreator] = useState(false);
  
  // Check URL parameters for actions
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'create-deal') {
      setIsCreateDialogOpen(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    } else if (action === 'create-quick-deal') {
      setShowQuickDealCreator(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Helper function to format discount text
  const getDiscountText = (offer: BusinessOffer) => {
    const value = offer.discountValue;
    
    // Check if the value already contains % or $ signs to avoid duplication
    const hasPercentSign = value.includes('%');
    const hasDollarSign = value.includes('$');
    
    switch (offer.discountType) {
      case 'percentage':
        // If it already has %, don't add another one
        if (hasPercentSign || value.toLowerCase().includes('off')) {
          return value;
        }
        return `${value}% off`;
      case 'fixed_amount':
        // If it already has $, don't add another one
        if (hasDollarSign || value.toLowerCase().includes('off')) {
          return value;
        }
        return `$${value} off`;
      case 'buy_one_get_one':
        return 'Buy One Get One';
      case 'free_service':
        return 'Free Service';
      case 'free_item_with_purchase':
        return 'Free Item w/ Purchase';
      case 'combo_deal':
        return 'Combo Deal';
      case 'other':
        return value;
      default:
        return value;
    }
  };

  // Get current business user - direct from storage for reliability
  const storageUser = authStorage.getUser();

  // Debug logging
  console.log('BusinessDashboard - storageUser:', storageUser, 'userType:', storageUser?.userType);

  // Fetch fresh user data to get updated location fields
  const { data: freshUserData, refetch: refetchUser } = useQuery({
    queryKey: ['/api/users', storageUser?.id],
    queryFn: async () => {
      if (!storageUser?.id) return null;
      const response = await fetch(`/api/users/${storageUser.id}`, {
        headers: {
          'x-user-id': storageUser.id.toString(),
          'x-user-type': storageUser.userType || 'business'
        }
      });
      const data = await response.json();
      console.log("BusinessDashboard - Fresh user data API response:", data);
      return data;
    },
    enabled: !!storageUser?.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Use fresh data if available, fallback to storage user
  const currentUser = freshUserData || storageUser;

  // Fetch business offers
  const { data: offers = [], isLoading, refetch: refetchOffers } = useQuery<BusinessOffer[]>({
    queryKey: [`/api/business-deals/business/${storageUser?.id}`],
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch past offers - filter client-side for expired offers
  const { data: allOffers = [], isLoading: isPastOffersLoading } = useQuery<BusinessOffer[]>({
    queryKey: [`/api/business-deals/business/${storageUser?.id}`],
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    staleTime: 0,
    refetchOnMount: true
  });

  // Filter past offers (expired ones)
  const pastOffers = allOffers.filter(offer => new Date(offer.validUntil) < new Date());

  // Fetch analytics
  const { data: analytics = { totalOffers: 0, totalViews: 0, totalRedemptions: 0, activeOffers: 0, monthlyUsage: 0, monthlyLimit: 10, monthlyQuickDeals: 0, monthlyBusinessDeals: 0 }, refetch: refetchAnalytics } = useQuery<{
    totalOffers: number;
    totalViews: number;
    totalRedemptions: number;
    activeOffers: number;
    monthlyUsage: number;
    monthlyLimit: number;
    monthlyQuickDeals: number;
    monthlyBusinessDeals: number;
  }>({
    queryKey: ['/api/business-deals/analytics'],
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Fetch subscription status for usage limits
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/business/subscription-status'],
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    retry: 1,
    staleTime: 0,
    refetchOnMount: true
  });

  // Fetch business events
  const { data: businessEvents = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/events/organizer', storageUser?.id],
    queryFn: async () => {
      if (!storageUser?.id) return [];
      const response = await fetch(`/api/events/organizer/${storageUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    staleTime: 0,
    refetchOnMount: true
  });

  // Fetch Quick Deals history
  const { data: quickDealsHistory = [], isLoading: isQuickDealsHistoryLoading } = useQuery({
    queryKey: [`/api/quick-deals/history/${storageUser?.id}`],
    queryFn: async () => {
      if (!storageUser?.id) return [];
      const response = await fetch(`/api/quick-deals/history/${storageUser.id}`, {
        headers: {
          'x-user-id': storageUser.id.toString(),
          'x-user-type': storageUser.userType || 'business'
        }
      });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch Quick Deals history');
      }
      return response.json();
    },
    enabled: !!storageUser?.id && storageUser?.userType === 'business',
    staleTime: 30000,
    refetchOnMount: true
  });

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      customCategory: "",
      discountType: "percentage",
      discountValue: "",
      discountCode: "",
      targetAudience: ["both"],
      streetAddress: currentUser?.streetAddress || "",
      city: extractCityFromAddress(currentUser?.streetAddress) || currentUser?.hometownCity || "",
      state: currentUser?.hometownState || "",
      country: currentUser?.hometownCountry || "United States",
      zipCode: currentUser?.zipCode || "",
      validFrom: new Date().toISOString().split('T')[0], // Default to today
      validUntil: "",
      maxRedemptions: "",
      maxRedemptionsPerUser: "",
      imageUrl: "",
      termsConditions: "",
      contactInfo: "",
      websiteUrl: "",
      tags: "",
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: OfferFormData) => {
      const processedData = {
        ...data,
        targetAudience: data.targetAudience,
        maxRedemptions: data.maxRedemptions ? parseInt(data.maxRedemptions) : null,
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()) : Array.isArray(data.tags) ? data.tags : []) : [],
      };
      return apiRequest('POST', '/api/business-deals', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-deals/business/${storageUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-deals/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id] }); // Refresh user data for deal limits
      setIsCreateDialogOpen(false);
      setUseCustomAddress(false);
      form.reset();
      toast({
        title: "Success",
        description: "Offer created successfully!",
      });
    },
    onError: (error: any) => {
      // Handle deal limit errors specifically
      if (error.message?.includes('Monthly deal limit reached')) {
        toast({
          title: "Monthly Deal Limit Reached",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create offer",
          variant: "destructive",
        });
      }
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OfferFormData }) => {
      console.log("Frontend: Updating offer with form data:", data);

      const processedData = {
        ...data,
        // Remove frontend-only fields
        customCategory: undefined,
        // Ensure proper data types - filter out invalid values
        targetAudience: cleanTargetAudience(data.targetAudience),
        maxRedemptions: data.maxRedemptions ? (typeof data.maxRedemptions === 'string' ? parseInt(data.maxRedemptions) : data.maxRedemptions) : null,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser ? (typeof data.maxRedemptionsPerUser === 'string' ? parseInt(data.maxRedemptionsPerUser) : data.maxRedemptionsPerUser) : null,
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : data.tags) : [],
        // Ensure discountValue is properly handled
        discountValue: data.discountValue?.toString() || "",
      };

      console.log("Frontend: Processed data for API:", processedData);
      return apiRequest('PUT', `/api/business-deals/${id}`, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-deals/business/${storageUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-deals/analytics'] });
      setEditingOffer(null);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Offer updated successfully!",
      });
    },
    onError: (error: any) => {
      console.error("Frontend: Update offer error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update offer",
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/business-deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-deals/business/${storageUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-deals/analytics'] });
      toast({
        title: "Success",
        description: "Offer deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete offer",
        variant: "destructive",
      });
    },
  });

  // Customer photos query for business
  const { data: customerPhotos = [], isLoading: isCustomerPhotosLoading } = useQuery({
    queryKey: [`/api/businesses/${currentUser?.id}/customer-photos`],
    enabled: !!currentUser?.id && currentUser?.userType === 'business',
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/businesses/${currentUser.id}/customer-photos`);
      if (!response.ok) throw new Error('Failed to fetch customer photos');
      return response.json();
    }
  });

  // Photo management queries with pagination to avoid 64MB limit
  const { data: userPhotos = [], isLoading: isPhotosLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.id}/photos`],
    enabled: !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      // Load photos in batches to avoid database response limit
      const limit = 20;
      let allPhotos: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/users/${currentUser.id}/photos?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }
        const batch = await response.json();
        
        if (batch.length === 0) {
          hasMore = false;
        } else {
          allPhotos = [...allPhotos, ...batch];
          offset += limit;
          // Safety check to prevent infinite loops
          if (offset > 200) hasMore = false;
        }
      }

      console.log(`📸 BUSINESS: Loaded ${allPhotos.length} photos for business user ${currentUser.id}`);
      return allPhotos;
    },
  });

  console.log('BusinessDashboard - CustomerPhotos data:', customerPhotos?.map(p => ({id: p.id, caption: p.caption, hasImage: !!(p.imageUrl || p.imageData)})), 'Length:', customerPhotos?.length, 'Loading:', isCustomerPhotosLoading);
  console.log('BusinessDashboard - UserPhotos data:', userPhotos?.map(p => ({id: p.id, caption: p.caption, hasImage: !!(p.imageUrl || p.imageData)})), 'Length:', userPhotos?.length, 'Loading:', isPhotosLoading);
  console.log('BusinessDashboard - Current user ID:', currentUser?.id);

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => apiRequest('DELETE', `/api/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}/photos`] });
      toast({
        title: "Success",
        description: "Photo deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: ({ photoId, caption }: { photoId: number; caption: string }) => 
      apiRequest('PUT', `/api/photos/${photoId}`, { caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}/photos`] });
      toast({
        title: "Success",
        description: "Photo updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update photo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferFormData) => {
    // Validate custom category if selected
    if (data.category === 'Custom' && !data.customCategory?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom category name",
        variant: "destructive",
      });
      return;
    }

    // Use custom category if selected and process tags
    const finalData = {
      ...data,
      category: data.category === 'Custom' ? data.customCategory?.trim() || 'Custom' : data.category,
      // Process tags: convert comma-separated string to array
      tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : Array.isArray(data.tags) ? data.tags : []) : [],
      // Convert maxRedemptions to number if provided
      maxRedemptions: data.maxRedemptions ? parseInt(data.maxRedemptions) : undefined,
      maxRedemptionsPerUser: data.maxRedemptionsPerUser ? parseInt(data.maxRedemptionsPerUser) : undefined
    };

    if (editingOffer) {
      updateOfferMutation.mutate({ id: editingOffer.id, data: finalData });
    } else {
      createOfferMutation.mutate(finalData);
    }
  };

  const handleEdit = (offer: BusinessOffer) => {
    console.log("Frontend: Editing offer:", offer);
    setEditingOffer(offer);
    setIsDialogOpen(true);

    // Check if category is a custom one (not in predefined categories)
    const isCustomCategory = !CATEGORIES.includes(offer.category) || offer.category === 'Custom';

    form.reset({
      title: offer.title, // FIX: Use offer.title, not editingOffer.title
      description: offer.description,
      category: isCustomCategory ? 'Custom' : offer.category,
      customCategory: isCustomCategory ? offer.category : "",
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountCode: offer.discountCode || "",
      targetAudience: cleanTargetAudience(offer.targetAudience),
      city: offer.city || "",
      state: offer.state || "",
      country: offer.country || "United States",
      validFrom: offer.validFrom.split('T')[0],
      validUntil: offer.validUntil.split('T')[0],
      maxRedemptions: offer.maxRedemptions?.toString() || "",
      maxRedemptionsPerUser: offer.maxRedemptionsPerUser?.toString() || "",
      imageUrl: offer.imageUrl || "",
      termsConditions: offer.termsConditions || "",
      contactInfo: offer.contactInfo || "",
      websiteUrl: offer.websiteUrl || "",
      tags: Array.isArray(offer.tags) ? offer.tags.join(', ') : (offer.tags || "")
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      deleteOfferMutation.mutate(id);
    }
  };

  // Check if user is authenticated and is a business user
  console.log('BusinessDashboard - final check - currentUser:', currentUser, 'userType:', currentUser?.userType);
  if (!currentUser || currentUser.userType !== 'business') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              This page is only accessible to verified business accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Instant Deal Creator Modal */}
      {showQuickDealCreator && (
        <InstantDealCreator
          onClose={() => setShowQuickDealCreator(false)}
          businessId={storageUser?.id || 0}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentUser?.businessName || currentUser?.name || 'Business'} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your business deals and track performance
          </p>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatus />
        </div>

        {/* Big CREATE A NEW DEAL CTA */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to Attract New Customers?</h2>
                <p className="text-orange-100 text-sm sm:text-base">
                  Create an exclusive deal for travelers and locals in your area
                </p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-lg px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                size="lg"
                data-testid="create-deal-cta"
              >
                <span className="text-2xl mr-2">🎯</span>
                CREATE A NEW DEAL
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Deals Widget - Show at top for easy access */}
        <div className="mb-8">
          <QuickDealsWidget 
            city={currentUser?.hometownCity || currentUser?.city || ''} 
            profileUserId={currentUser?.id} 
          />
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalOffers || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalViews || 0}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Redemptions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalRedemptions || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Deals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activeOffers || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Usage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {subscriptionStatus?.daysUsed || 0}/{subscriptionStatus?.dayLimit || 5}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deals this month</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created Events</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{businessEvents?.length || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Header with Create Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Deals</h2>
          <div className="flex gap-3">
            {/* Instant Deal Creator - Flash deals for immediate foot traffic */}
            

            <Dialog open={isCreateDialogOpen || !!editingOffer} onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingOffer(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Deal
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOffer ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
                <DialogDescription>
                  {editingOffer ? 'Update your business deal details' : 'Create a new deal to attract customers'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 25% Off Weekend Brunch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>
                                  {getCategoryDisplayName(category)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Custom Category Input - Show only when Custom is selected */}
                  {form.watch("category") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="customCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Custom Category *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter custom category name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="space-y-4">
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Description * (max 120 characters)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your offer in detail..." 
                            maxLength={120}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-gray-600 dark:text-gray-400">
                          {field.value?.length || 0}/120 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Discount Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage Off</SelectItem>
                              <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                              <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
                              <SelectItem value="free_service">Free Service</SelectItem>
                              <SelectItem value="free_item_with_purchase">Free Item w/ Purchase</SelectItem>
                              <SelectItem value="combo_deal">Combo Deal</SelectItem>
                              <SelectItem value="other">Other/Custom</SelectItem>
                              <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
                              <SelectItem value="free_service">Free Service</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Discount Value *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 25, up to 50, max allowed 100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="discountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Discount Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SAVE25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Target Audience *</FormLabel>
                        <div className="flex space-x-4">
                          {TARGET_AUDIENCES.map((audience) => (
                            <FormField
                              key={audience}
                              control={form.control}
                              name="targetAudience"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={audience}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(audience)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, audience])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== audience
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-gray-900 dark:text-white">
                                      {audience.charAt(0).toUpperCase() + audience.slice(1)}
                                    </FormLabel>
                                                                    </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="useCustomAddress"
                        checked={useCustomAddress}
                        onCheckedChange={(checked) => {
                          setUseCustomAddress(checked);
                          if (!checked) {
                            // Reset to business address (NOT travel destination)
                            form.setValue("streetAddress", currentUser?.streetAddress || "");
                            form.setValue("city", currentUser?.businessCity || currentUser?.hometownCity || "");
                            form.setValue("state", currentUser?.businessState || currentUser?.hometownState || "");
                            form.setValue("country", currentUser?.businessCountry || currentUser?.hometownCountry || "United States");
                            form.setValue("zipCode", currentUser?.zipCode || "");
                          }
                        }}
                      />
                      <label
                        htmlFor="useCustomAddress"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white"
                      >
                        Use different address for this offer
                      </label>
                    </div>

                    {!useCustomAddress ? (
                      // Show business address (read-only display)
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 dark:text-white">Business Address</h4>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {currentUser?.streetAddress && <div>{currentUser.streetAddress}</div>}
                          <div>
                            {currentUser?.hometownCity}{currentUser?.hometownState && `, ${currentUser.hometownState}`}
                            {currentUser?.hometownCountry && `, ${currentUser.hometownCountry}`}
                          </div>
                          {currentUser?.zipCode && <div>{currentUser.zipCode}</div>}
                        </div>
                      </div>
                    ) : (
                      // Show editable address fields
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="streetAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Street Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main Street" {...field} />
                              </FormControl>
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
                            label=""
                            placeholder={{
                              country: "Select country",
                              state: "Select state/region",
                              city: "Select city"
                            }}
                          />
                          {(form.formState.errors.city || form.formState.errors.country) && (
                            <p className="text-sm font-medium text-destructive mt-1">
                              {form.formState.errors.city?.message || form.formState.errors.country?.message}
                            </p>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Starting Today Checkbox */}
                  {!editingOffer && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="startingToday"
                          checked={startingToday}
                          onCheckedChange={(checked) => {
                            setStartingToday(checked as boolean);
                            if (checked) {
                              const today = new Date().toISOString().split('T')[0];
                              form.setValue('validFrom', today);
                            }
                          }}
                          className="border-gray-300 dark:border-gray-600"
                        />
                        <label 
                          htmlFor="startingToday" 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          Starting Today (recommended)
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Automatically sets start date to today. Uncheck to choose a different start date.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Valid From *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              disabled={editingOffer || (!editingOffer && startingToday)}
                              min="1000-01-01"
                              max="9999-12-31"
                              className={`dark:[color-scheme:dark] dark:text-white calendar-white-icon ${
                                (editingOffer || (!editingOffer && startingToday)) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                          </FormControl>
                          {editingOffer ? (
                            <FormDescription className="text-orange-600 dark:text-orange-400 text-xs">
                              Dates cannot be edited after creation
                            </FormDescription>
                          ) : startingToday ? (
                            <FormDescription className="text-green-600 dark:text-green-400 text-xs">
                              ✓ Set to today's date
                            </FormDescription>
                          ) : (
                            <FormDescription className="text-amber-600 dark:text-amber-400 text-xs">
                              ⚠️ Dates cannot be changed once submitted
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Valid Until *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              disabled={editingOffer}
                              min="1000-01-01"
                              max="9999-12-31"
                              className={`dark:[color-scheme:dark] dark:text-white calendar-white-icon ${
                                editingOffer ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                          </FormControl>
                          {editingOffer ? (
                            <FormDescription className="text-orange-600 dark:text-orange-400 text-xs">
                              Dates cannot be edited after creation
                            </FormDescription>
                          ) : (
                            <FormDescription className="text-amber-600 dark:text-amber-400 text-xs">
                              ⚠️ Dates cannot be changed once submitted
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxRedemptions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Total Redemption Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormDescription className="text-gray-600 dark:text-gray-400">
                            Maximum total uses across all users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxRedemptionsPerUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Per-User Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="3" {...field} />
                          </FormControl>
                          <FormDescription className="text-gray-600 dark:text-gray-400">
                            Max times each user can redeem
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Offer Image</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <Input 
                              placeholder="https://example.com/image.jpg or upload below" 
                              {...field} 
                            />
                            <div 
                              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              <div className="text-center">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                        Click to upload
                                      </span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 5MB</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Convert to base64 for preview
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    field.onChange(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {field.value && (
                              <div className="mt-4">
                                <img 
                                  src={field.value} 
                                  alt="Offer preview" 
                                  className="w-full h-48 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => field.onChange("")}
                                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Remove image
                                </button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-600 dark:text-gray-400">
                          Add an eye-catching image for your offer (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Cannot be combined with other offers..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Contact Info</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@business.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Website URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://business.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="brunch, weekend, family-friendly" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingOffer(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
                    >
                      {editingOffer ? 'Update Deal' : 'Create Deal'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Business Dashboard Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="active">Active Deals ({offers.length})</TabsTrigger>
            <TabsTrigger value="quickdeals">Quick Deals History ({quickDealsHistory.length})</TabsTrigger>
            <TabsTrigger value="events">Special Events ({businessEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Past Deals ({pastOffers.length})</TabsTrigger>
            <TabsTrigger value="photos">Customer Photos ({customerPhotos?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {/* Active Deals List */}
            {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No deals yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create your first deal to start attracting customers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: BusinessOffer) => (
              <Card 
                key={offer.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 overflow-hidden" 
                onClick={() => {
                  console.log('🎯 DEAL CLICKED: Opening deal details for', offer.title, offer.id);
                  setViewingOffer(offer);
                }}
              >
                {/* Offer Image */}
                {offer.imageUrl && (
                  <div className="relative h-48 w-full">
                    <img 
                      src={offer.imageUrl} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 text-white">
                        {getDiscountText(offer)}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {offer.business?.businessName || offer.business?.name || offer.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {offer.category}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      {!offer.imageUrl && (
                        <div className="flex items-center space-x-1 text-green-600">
                          {getDiscountIcon(offer.discountType)}
                          <span className="font-bold text-lg">
                            {getDiscountText(offer)}
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(offer);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(offer.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {offer.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Click to view full details</p>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>Views:</span>
                      <span className="font-medium">{offer.viewCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Redemptions:</span>
                      <span className="font-medium">
                        {offer.currentRedemptions}
                        {offer.maxRedemptions && ` / ${offer.maxRedemptions}`}
                      </span>
                    </div>
                    {offer.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.isArray(offer.tags) ? offer.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        )) : typeof offer.tags === 'string' ? offer.tags.split(',').map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        )) : null}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Valid Until:</span>
                      <span className="font-medium">
                        {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-4">
                    {offer.targetAudience.map(audience => (
                      <Badge key={audience} variant="secondary" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="quickdeals" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Deals History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reuse your past Quick Deals by creating new ones with updated timing</p>
                </div>
              </div>

              {isQuickDealsHistoryLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
                  ))}
                </div>
              ) : quickDealsHistory.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Quick Deals History Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Once your Quick Deals expire, they'll appear here for easy reuse.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Quick Deals are different from regular business offers - they're short-term flash deals that expire within hours.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickDealsHistory.map((deal: any) => (
                    <Card key={deal.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{deal.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{deal.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300">
                            Expired
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            {getDiscountIcon(deal.discountType)}
                            <span>{deal.discountValue}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Expired {new Date(deal.validUntil).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{deal.currentRedemptions || 0} redemptions</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                            onClick={() => {
                              // Pre-fill form with expired deal data for reuse
                              setReuseDialogOpen(true);
                              setReuseDealData({
                                title: deal.title,
                                description: deal.description,
                                discountType: deal.discountType,
                                discountValue: deal.discountValue,
                                category: deal.category,
                                targetAudience: deal.targetAudience || ['both'],
                                availability: deal.availability || 'now'
                              });
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Reuse Deal
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {/* Events Management */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business Events</h3>
                  <p className="text-gray-600 dark:text-gray-300">Manage your community events and gatherings</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/create-event'}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {isEventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : businessEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No events yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Use the "Create Event" button above to start hosting community events and engage with locals and travelers
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {businessEvents.map((event: any) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {event.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()} at {event.time || 'Time TBD'}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          {event.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Users className="w-4 h-4 mr-1" />
                            {event.participantCount || 0} attending
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.location.href = `/event/${event.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.location.href = `/manage-event/${event.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>

                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {event.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{event.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {/* Past Deals List */}
            {isPastOffersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastOffers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No past deals
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Expired deals will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastOffers.map((offer: BusinessOffer) => (
                  <Card key={offer.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {offer.business?.businessName || offer.business?.name || offer.title}
                          </h3>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">
                              {offer.category}
                            </Badge>
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Create new deal based on past deal
                            const newOfferData = {
                              ...offer,
                              id: undefined,
                              validFrom: "",
                              validUntil: "",
                              currentRedemptions: 0
                            };
                            handleEdit({
                              ...newOfferData,
                              id: 0,
                              viewCount: 0,
                              createdAt: new Date().toISOString(),
                            } as BusinessOffer);
                          }}
                        >
                          Reuse
                        </Button>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {offer.description}
                      </p>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Total Views:</span>
                          <span className="font-medium">{offer.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Total Redemptions:</span>
                          <span className="font-medium">{offer.currentRedemptions || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Expired: {new Date(offer.validUntil).toLocaleDateString()}
                        </div>
                        {offer.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Array.isArray(offer.tags) ? offer.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            )) : typeof offer.tags === 'string' ? offer.tags.split(',').map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            )) : null}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            {/* Customer Photos Management */}
            {isCustomerPhotosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !customerPhotos || customerPhotos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No photos uploaded yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Customer photos will appear here once users start uploading photos of your business
                  </p>
                  <Button
                    onClick={async () => {
                      // Add a sample photo for testing
                      try {
                        console.log('Adding sample photo for user:', currentUser?.id);
                        const samplePhoto = {
                          imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAAYcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABgAGADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//2Q==",
                          title: "Sample Customer Photo",
                          isPublic: true
                        };
                        const response = await apiRequest('POST', `/api/users/${currentUser?.id}/photos`, samplePhoto);
                        console.log('Photo creation response:', response);
                        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}/photos`] });
                        toast({
                          title: "Sample photo added",
                          description: "Added a test photo to demonstrate edit/delete functionality",
                        });
                      } catch (error) {
                        console.error('Error adding sample photo:', error);
                        toast({
                          title: "Error",
                          description: `Failed to add sample photo: ${error.message}`,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-orange-600 text-white"
                  >
                    Add Sample Photo for Testing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerPhotos.map((photo: any) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.imageUrl || photo.imageData}
                        alt={photo.caption || "Customer photo"}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', photo.id, photo.imageUrl ? 'Has URL' : 'No URL', photo.imageData ? 'Has Data' : 'No Data');
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newCaption = prompt("Edit photo caption:", photo.caption || "");
                            if (newCaption !== null) {
                              updatePhotoMutation.mutate({ photoId: photo.id, caption: newCaption });
                            }
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this photo?")) {
                              deletePhotoMutation.mutate(photo.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                        {photo.caption || "Untitled"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded: {(photo.createdAt || photo.uploadedAt) ? new Date(photo.createdAt || photo.uploadedAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                      {photo.isPrivate && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          Private
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Offer Details Modal */}
      <Dialog open={!!viewingOffer} onOpenChange={(open) => !open && setViewingOffer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {viewingOffer.business?.businessName || viewingOffer.business?.name || viewingOffer.title}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{viewingOffer.category}</Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {getDiscountText(viewingOffer)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Full Description</h4>
                  <p className="text-gray-700 dark:text-gray-300">{viewingOffer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Discount Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {viewingOffer.discountType}</p>
                      <p><span className="font-medium">Value:</span> {getDiscountText(viewingOffer)}</p>
                      {viewingOffer.discountCode && (
                        <p><span className="font-medium">Code:</span> {viewingOffer.discountCode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Valid Period</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">From:</span> {new Date(viewingOffer.validFrom).toLocaleDateString()}</p>
                      <p><span className="font-medium">Until:</span> {new Date(viewingOffer.validUntil).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Target Audience</h4>
                  <div className="flex flex-wrap gap-1">
                    {viewingOffer.targetAudience.map(audience => (
                      <Badge key={audience} variant="secondary" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Usage Stats</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Views:</span> {viewingOffer.viewCount || 0}</p>
                      <p><span className="font-medium">Redemptions:</span> {viewingOffer.currentRedemptions || 0}
                        {viewingOffer.maxRedemptions && ` / ${viewingOffer.maxRedemptions}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h4>
                    <div className="space-y-1 text-sm">
                      <p>{viewingOffer.city}, {viewingOffer.state}</p>
                      <p>{viewingOffer.country}</p>
                    </div>
                  </div>
                </div>

                {viewingOffer.termsConditions && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{viewingOffer.termsConditions}</p>
                  </div>
                )}

                {viewingOffer.tags && viewingOffer.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(viewingOffer.tags) ? viewingOffer.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      )) : typeof viewingOffer.tags === 'string' ? viewingOffer.tags.split(',').map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      )) : null}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewingOffer(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setViewingOffer(null);
                    handleEdit(viewingOffer);
                  }}>
                    Edit Offer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Deal Reuse Dialog */}
      <Dialog open={reuseDialogOpen} onOpenChange={setReuseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Reuse Quick Deal
            </DialogTitle>
            <DialogDescription>
              Create a new Quick Deal based on this expired deal. You can modify the details and set new timing.
            </DialogDescription>
          </DialogHeader>
          
          {reuseDealData && (
            <QuickDealReuseForm 
              originalDeal={reuseDealData}
              onClose={() => {
                setReuseDialogOpen(false);
                setReuseDealData(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick Deal Reuse Form Component
function QuickDealReuseForm({ originalDeal, onClose }: { originalDeal: any; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: originalDeal?.title || '',
    description: originalDeal?.description || '',
    discountType: (originalDeal?.discountType || 'percentage') as const,
    discountValue: originalDeal?.discountValue || '',
    validFor: '2',
    availability: (originalDeal?.availability || 'now') as const,
  });

  const createQuickDealMutation = useMutation({
    mutationFn: async (data: any) => {
      const now = new Date();
      const validUntil = new Date(now.getTime() + (parseInt(data.validFor) * 60 * 60 * 1000));
      
      const dealData = {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        availability: data.availability,
        dealType: data.discountType,
        category: 'quick_deal',
        validFrom: now.toISOString(),
        validUntil: validUntil.toISOString(),
        isActive: true,
        currentRedemptions: 0
      };

      return apiRequest('POST', '/api/quick-deals', dealData);
    },
    onSuccess: () => {
      toast({
        title: "Quick Deal Created! ⚡",
        description: "Your reused Quick Deal is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-deals'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error Creating Quick Deal",
        description: error instanceof Error ? error.message : "Failed to create quick deal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.discountValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createQuickDealMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Flash Sale - 20% Off"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Limited time offer..."
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discount Type</label>
          <Select 
            value={formData.discountType} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, discountType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Off</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
              <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
              <SelectItem value="free_service">Free Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Discount Value *</label>
          <Input
            value={formData.discountValue}
            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
            placeholder="20% or $10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Valid For</label>
          <Select 
            value={formData.validFor} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, validFor: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Hour</SelectItem>
              <SelectItem value="2">2 Hours</SelectItem>
              <SelectItem value="3">3 Hours</SelectItem>
              <SelectItem value="4">4 Hours</SelectItem>
              <SelectItem value="6">6 Hours</SelectItem>
              <SelectItem value="8">8 Hours</SelectItem>
              <SelectItem value="12">12 Hours</SelectItem>
              <SelectItem value="24">24 Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Availability</label>
          <Select 
            value={formData.availability} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, availability: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Available Now</SelectItem>
              <SelectItem value="today">Today Only</SelectItem>
              <SelectItem value="weekend">This Weekend</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createQuickDealMutation.isPending}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
        >
          {createQuickDealMutation.isPending ? 'Creating...' : 'Create Quick Deal'}
        </Button>
      </div>
    </form>
  );
}