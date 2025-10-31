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
import { Plus, Edit, Trash2, Eye, BarChart3, Calendar, DollarSign, Users, TrendingUp, CalendarDays, Camera, Image, MapPin, Clock, Percent, Tag, Gift, Zap, Menu } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import InstantDealCreator from "@/components/InstantDealCreator";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";

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
}).refine((data) => {
  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);
  return validUntil > validFrom;
}, {
  message: "End date must be after start date",
  path: ["validUntil"],
}).refine((data) => {
  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);
  const diffDays = Math.ceil((validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
}, {
  message: "Promotion cannot be longer than 30 days",
  path: ["validUntil"],
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
  imageUrl?: string;
  termsConditions?: string;
  contactInfo?: string;
  websiteUrl?: string;
  business?: {
    businessName?: string;
    name?: string;
  };
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

  console.log('BusinessDashboard - CustomerPhotos data:', customerPhotos?.map((p: any) => ({id: p.id, caption: p.caption, hasImage: !!(p.imageUrl || p.imageData)})), 'Length:', customerPhotos?.length, 'Loading:', isCustomerPhotosLoading);
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
      // Convert maxRedemptions to string for form compatibility
      maxRedemptions: data.maxRedemptions ? data.maxRedemptions.toString() : undefined,
      maxRedemptionsPerUser: data.maxRedemptionsPerUser ? data.maxRedemptionsPerUser.toString() : undefined
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
    const isCustomCategory = !CATEGORIES.includes(offer.category) && offer.category !== 'Custom';

    // Pre-fill form with offer data
    form.reset({
      title: offer.title || "",
      description: offer.description || "",
      category: isCustomCategory ? 'Custom' : offer.category,
      customCategory: isCustomCategory ? offer.category : "",
      discountType: offer.discountType || "percentage",
      discountValue: (offer.discountValue || "").toString(),
      discountCode: offer.discountCode || "",
      targetAudience: Array.isArray(offer.targetAudience) ? offer.targetAudience : [],
      city: offer.city || "",
      state: offer.state || "",
      country: offer.country || "United States",
      validFrom: offer.validFrom || "",
      validUntil: offer.validUntil || "",
      maxRedemptions: offer.maxRedemptions ? offer.maxRedemptions.toString() : "",
      maxRedemptionsPerUser: offer.maxRedemptionsPerUser ? offer.maxRedemptionsPerUser.toString() : "",
      imageUrl: offer.imageUrl || "",
      termsConditions: offer.termsConditions || "",
      contactInfo: offer.contactInfo || "",
      websiteUrl: offer.websiteUrl || "",
      tags: Array.isArray(offer.tags) ? offer.tags.join(', ') : (typeof offer.tags === 'string' ? offer.tags : ""),
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      deleteOfferMutation.mutate(id);
    }
  };

  const handleView = (offer: BusinessOffer) => {
    setViewingOffer(offer);
  };

  const handleCloseViewDialog = () => {
    setViewingOffer(null);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingOffer(null);
    setIsDialogOpen(false);
    form.reset();
  };

  // Filter current offers (active ones)
  const currentOffers = offers.filter(offer => new Date(offer.validUntil) >= new Date());

  console.log('BusinessDashboard - final check - currentUser:', currentUser, 'userType:', currentUser?.userType);
  if (!currentUser || currentUser.userType !== 'business') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">This dashboard is only available to business accounts.</p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveOffers = currentOffers.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile-responsive layout with proper spacing */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Business Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Manage your deals, events, and business presence
            </p>
          </div>
          
          {/* Mobile-responsive action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              onClick={() => setShowQuickDealCreator(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              data-testid="button-create-quick-deal"
            >
              <Zap className="w-4 h-4 mr-1 sm:mr-2" />
              Quick Deal
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              data-testid="button-create-deal"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Create Deal
            </Button>
          </div>
        </div>

        {/* Mobile-responsive analytics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.activeOffers}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Deals</div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalViews}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Views</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalRedemptions}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Redeemed</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalOffers}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Deals</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {businessEvents.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Events</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.monthlyUsage}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-responsive subscription status */}
        <div className="mb-6 sm:mb-8">
          <SubscriptionStatus />
        </div>

        {/* Mobile-responsive tabs */}
        <Tabs defaultValue="active" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
            <TabsTrigger 
              value="active" 
              className="text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white py-2 sm:py-3"
              data-testid="tab-active-deals"
            >
              <span className="sm:hidden">Active</span>
              <span className="hidden sm:inline">Active Deals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="quickdeals" 
              className="text-xs sm:text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white py-2 sm:py-3"
              data-testid="tab-quick-deals"
            >
              Quick Deals
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="text-xs sm:text-sm data-[state=active]:bg-green-500 data-[state=active]:text-white py-2 sm:py-3"
              data-testid="tab-events"
            >
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="text-xs sm:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white py-2 sm:py-3"
              data-testid="tab-past-deals"
            >
              Past Deals
            </TabsTrigger>
            <TabsTrigger 
              value="photos" 
              className="text-xs sm:text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white py-2 sm:py-3"
              data-testid="tab-photos"
            >
              Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !hasActiveOffers ? (
              <Card>
                <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No active deals yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                    Create your first deal to start attracting customers
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                    <Button 
                      onClick={() => setShowQuickDealCreator(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full sm:w-auto"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Create Quick Deal
                    </Button>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Business Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentOffers.map((offer: BusinessOffer) => (
                  <Card 
                    key={offer.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleView(offer)}
                    data-testid={`card-offer-${offer.id}`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                            {offer.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryDisplayName(offer.category)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0"
                            >
                              {getDiscountIcon(offer.discountType)}
                              <span className="ml-1">{getDiscountText(offer)}</span>
                            </Badge>
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(offer);
                            }}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(offer.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-2">
                        {offer.description}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Click to view full details</p>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
                            {Array.isArray(offer.tags) ? offer.tags.slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            )) : typeof offer.tags === 'string' ? offer.tags.split(',').slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            )) : null}
                            {Array.isArray(offer.tags) && offer.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{offer.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Valid Until:</span>
                          <span className="font-medium text-xs">
                            {new Date(offer.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3 sm:mt-4">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Quick Deals History</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reuse your past Quick Deals by creating new ones with updated timing</p>
                </div>
              </div>

              {isQuickDealsHistoryLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 sm:h-48 rounded-lg"></div>
                  ))}
                </div>
              ) : quickDealsHistory.length === 0 ? (
                <Card className="p-6 sm:p-8">
                  <div className="text-center">
                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No Quick Deals History Yet</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">Once your Quick Deals expire, they'll appear here for easy reuse.</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">Quick Deals are different from regular business offers - they're short-term flash deals that expire within hours.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickDealsHistory.map((deal: any) => (
                    <Card key={deal.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 pr-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{deal.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{deal.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 whitespace-nowrap">
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
            {/* Event Organizer Hub */}
            <div className="space-y-4 sm:space-y-6">
              {/* Event Organizer Dashboard Header */}
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 p-4 sm:p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Event Organizer Hub
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Create, manage, and promote your community events with powerful organizer tools
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => {
                        // Navigate directly to create event
                        window.location.href = '/create-event';
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Event
                    </Button>
                  </div>
                </div>
                
                {/* Event Organizer Quick Stats */}
                {businessEvents.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        {businessEvents.length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        {businessEvents.reduce((sum: number, event: any) => sum + (event.participantCount || 0), 0)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total RSVPs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-orange-600">
                        {businessEvents.filter((event: any) => new Date(event.date) >= new Date()).length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Upcoming</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-purple-600">
                        {Math.round((businessEvents.reduce((sum: number, event: any) => sum + (event.participantCount || 0), 0) / Math.max(businessEvents.length, 1)) * 10) / 10}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Avg RSVPs</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Events Management Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Your Events</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Manage and promote your community events</p>
                </div>
              </div>

              {isEventsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : businessEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No events yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      Use the "Create Event" button above to start hosting community events and engage with locals and travelers
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {businessEvents.map((event: any) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {event.title}
                            </h4>
                            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()} at {event.time || 'Time TBD'}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {event.category}
                          </Badge>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {event.participantCount || 0} attending
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 sm:flex-none text-xs"
                              onClick={() => window.location.href = `/event/${event.id}`}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 sm:flex-none text-xs"
                              onClick={() => window.location.href = `/manage-event/${event.id}`}
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                          
                          {/* Event Organizer Quick Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="flex-1 sm:flex-none text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => {
                                // Create Instagram-optimized share text
                                const instagramText = `🎉 ${event.title}\n\n📍 ${event.venueName ? event.venueName + ', ' : ''}${event.city}\n📅 ${new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}\n\n${event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 'Join us for an amazing event!'}\n\n#NearbyTraveler #${event.city.replace(/\s+/g, '')}Events #Community ${event.tags?.map((tag: string) => '#' + tag.replace(/\s+/g, '')).join(' ') || ''}\n\nRSVP: ${window.location.origin}/events/${event.id}`;
                                
                                navigator.clipboard.writeText(instagramText);
                                toast({ 
                                  title: "Instagram post copied!", 
                                  description: "Perfect formatted text copied - paste directly to Instagram!"
                                });
                              }}
                            >
                              <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Instagram
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="flex-1 sm:flex-none text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              onClick={() => {
                                // Save as template and navigate to create new event
                                const templateData = {
                                  venueName: event.venueName,
                                  street: event.street,
                                  city: event.city,
                                  state: event.state,
                                  country: event.country,
                                  category: event.category,
                                  tags: event.tags,
                                  requirements: event.requirements,
                                  maxParticipants: event.maxParticipants
                                };
                                localStorage.setItem('eventTemplate', JSON.stringify(templateData));
                                window.location.href = '/create-event';
                                toast({ 
                                  title: "Template saved!", 
                                  description: "Create a new event using this one as a template"
                                });
                              }}
                            >
                              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Duplicate
                            </Button>
                          </div>
                        </div>

                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-4">
                            {event.tags.slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{event.tags.length - 2} more
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
            {/* Mobile-responsive Past Deals List */}
            {isPastOffersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastOffers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No past deals
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Expired deals will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pastOffers.map((offer: BusinessOffer) => (
                  <Card key={offer.id} className="opacity-75">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                            {offer.business?.businessName || offer.business?.name || offer.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
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
                          className="w-full sm:w-auto mt-2 sm:mt-0"
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

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                        {offer.description}
                      </p>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
                            {Array.isArray(offer.tags) ? offer.tags.slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            )) : typeof offer.tags === 'string' ? offer.tags.split(',').slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            )) : null}
                            {Array.isArray(offer.tags) && offer.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{offer.tags.length - 2}
                              </Badge>
                            )}
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
            {/* Mobile-responsive Customer Photos Management */}
            {isCustomerPhotosLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3 sm:p-6">
                      <div className="w-full h-24 sm:h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !customerPhotos || customerPhotos.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Camera className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No photos uploaded yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
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
                          title: "Sample Photo Added",
                          description: "A sample photo has been added to demonstrate the photo management feature.",
                        });
                      } catch (error) {
                        console.error('Error adding sample photo:', error);
                        toast({
                          title: "Error",
                          description: "Failed to add sample photo",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="text-xs sm:text-sm"
                  >
                    Add Sample Photo for Testing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {customerPhotos.map((photo: any) => (
                  <Card key={photo.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-2 sm:p-4">
                      <div className="relative group">
                        <img 
                          src={photo.imageUrl || `data:image/jpeg;base64,${photo.imageData}`}
                          alt={photo.caption || "Customer photo"}
                          className="w-full h-24 sm:h-48 object-cover rounded-lg mb-2 sm:mb-4"
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 sm:p-2 bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                const newCaption = prompt("Enter new caption:", photo.caption || "");
                                if (newCaption !== null) {
                                  updatePhotoMutation.mutate({ photoId: photo.id, caption: newCaption });
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 sm:p-2 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this photo?')) {
                                  deletePhotoMutation.mutate(photo.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {photo.caption || "Untitled"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{photo.isPublic ? "Public" : "Private"}</span>
                          <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile-responsive View Offer Dialog */}
      {viewingOffer && (
        <Dialog open={!!viewingOffer} onOpenChange={handleCloseViewDialog}>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-3 sm:space-y-4">
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {viewingOffer.title}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {viewingOffer.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Mobile-responsive offer details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Offer Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getDiscountIcon(viewingOffer.discountType)}
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {getDiscountText(viewingOffer)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Category: {viewingOffer.category}
                      </p>
                      {viewingOffer.discountCode && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Code: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {viewingOffer.discountCode}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Location</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>{viewingOffer.city}{viewingOffer.state && `, ${viewingOffer.state}`}</p>
                      <p>{viewingOffer.country}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Validity</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>From: {new Date(viewingOffer.validFrom).toLocaleDateString()}</p>
                      <p>Until: {new Date(viewingOffer.validUntil).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Statistics</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>Views: {viewingOffer.viewCount}</p>
                      <p>Redemptions: {viewingOffer.currentRedemptions}
                        {viewingOffer.maxRedemptions && ` / ${viewingOffer.maxRedemptions}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {viewingOffer.tags && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(viewingOffer.tags) ? 
                      viewingOffer.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      )) : 
                      typeof viewingOffer.tags === 'string' ? 
                        viewingOffer.tags.split(',').map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        )) : null
                    }
                  </div>
                </div>
              )}

              {viewingOffer.termsConditions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{viewingOffer.termsConditions}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
                <Button 
                  onClick={() => handleEdit(viewingOffer)}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Deal
                </Button>
                <Button 
                  onClick={handleCloseViewDialog}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile-responsive Create/Edit Offer Dialog */}
      <Dialog open={isCreateDialogOpen || isDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {editingOffer ? 'Edit Offer' : 'Create New Offer'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
              {editingOffer ? 'Update your existing offer details' : 'Create an attractive offer to draw customers to your business'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Mobile-responsive form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-gray-900 dark:text-white">Offer Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="20% off your first purchase!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-gray-900 dark:text-white">Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Get 20% off when you spend $50 or more on any item in our store. Valid for new customers only."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Maximum 120 characters. Be clear and compelling!
                      </FormDescription>
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64">
                          {CATEGORIES.map((category) => (
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

                {form.watch("category") === "Custom" && (
                  <FormField
                    control={form.control}
                    name="customCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Custom Category *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your category" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Discount Type *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
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
                          <SelectItem value="free_item_with_purchase">Free Item with Purchase</SelectItem>
                          <SelectItem value="combo_deal">Combo Deal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                        <Input 
                          placeholder={
                            form.watch("discountType") === "percentage" ? "20" : 
                            form.watch("discountType") === "fixed_amount" ? "10" :
                            "Buy 1 Get 1 Free"
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        {form.watch("discountType") === "percentage" ? "Enter number only (e.g., 20 for 20%)" : 
                         form.watch("discountType") === "fixed_amount" ? "Enter amount only (e.g., 10 for $10 off)" :
                         "Describe your offer (e.g., 'Buy 1 Get 1 Free')"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Discount Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SAVE20" {...field} />
                      </FormControl>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Optional promo code customers can use
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-gray-900 dark:text-white">Target Audience *</FormLabel>
                        <FormDescription className="text-gray-600 dark:text-gray-400">
                          Who is this offer for?
                        </FormDescription>
                      </div>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="useCustomAddress"
                    checked={useCustomAddress}
                    onCheckedChange={(checked) => {
                      setUseCustomAddress(!!checked);
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
                        setStartingToday(!!checked);
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxRedemptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Total Redemption Limit</FormLabel>
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
                      <FormLabel className="text-gray-900 dark:text-white">Per-User Limit</FormLabel>
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
                          placeholder="https://example.com/image.jpg" 
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
                      <Textarea placeholder="Cannot be combined with other offers..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Mobile-responsive form buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  {createOfferMutation.isPending || updateOfferMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingOffer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingOffer ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Offer
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Offer
                        </>
                      )}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseCreateDialog}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick Deal Creator Modal */}
      {showQuickDealCreator && (
        <InstantDealCreator
          open={showQuickDealCreator}
          onClose={() => setShowQuickDealCreator(false)}
          onSuccess={() => {
            setShowQuickDealCreator(false);
            // Refresh analytics and offers
            queryClient.invalidateQueries({ queryKey: ['/api/business-deals/analytics'] });
            queryClient.invalidateQueries({ queryKey: [`/api/business-deals/business/${storageUser?.id}`] });
          }}
        />
      )}

      {/* Reuse Deal Dialog */}
      {reuseDialogOpen && reuseDealData && (
        <QuickDealsWidget
          showCreateForm={reuseDialogOpen}
          onCloseCreateForm={() => {
            setReuseDialogOpen(false);
            setReuseDealData(null);
          }}
          city={reuseDealData?.city}
          profileUserId={storageUser?.id}
        />
      )}
    </div>
  );
}