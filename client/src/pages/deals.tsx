import React, { useContext, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { CalendarDays, MapPin, Percent, Store, Users, Phone, Globe, Mail, Clock, Timer, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface BusinessDeal {
  id: number;
  title: string;
  description: string;
  category: string;
  discountType: string;
  discountValue: string;
  discountCode?: string;
  validFrom: string;
  validUntil: string;
  imageUrl?: string;
  termsConditions?: string;
  city: string;
  state: string;
  country: string;
  street?: string; // Add street address field
  // Business Information (Customer-Facing Only)
  businessName: string;
  businessDescription: string;
  businessType: string;
  businessLocation: string;
  businessEmail: string;
  businessPhone: string;
  businessImage?: string;
}

export default function Deals() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const effectiveUser = user || authStorage.getUser();
  
  // Simple city filtering 
  const [selectedCity, setSelectedCity] = useState('');
  


  // Fetch all business deals with complete business information
  const { data: businessOffers = [], isLoading: isBusinessOffersLoading, error: businessOffersError } = useQuery<BusinessDeal[]>({
    queryKey: ['/api/business-offers'],
    enabled: !!effectiveUser,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Fetch quick deals
  const { data: quickDeals = [], isLoading: isQuickDealsLoading, error: quickDealsError } = useQuery<any[]>({
    queryKey: ['/api/quick-deals'],
    enabled: !!effectiveUser,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Combine all deals
  const allDeals = useMemo(() => {
    // Convert quick deals to match BusinessDeal interface
    const convertedQuickDeals = quickDeals.map((deal: any) => ({
      id: deal.id,
      businessId: deal.businessId,
      title: deal.title,
      description: deal.description,
      offerType: deal.dealType || deal.discountType || 'quick_deal',
      discountType: deal.discountType || deal.dealType || 'percentage',
      discountValue: deal.discountValue || deal.discountAmount || '0',
      discountCode: deal.dealCode || deal.discountCode || '',
      validFrom: deal.validFrom || deal.createdAt,
      validUntil: deal.validUntil,
      imageUrl: deal.imageUrl || '',
      termsConditions: deal.terms || deal.termsConditions || '',
      city: deal.city || 'Los Angeles',
      state: deal.state || 'California', 
      country: deal.country || 'United States',
      businessName: deal.businessName || 'Business',
      businessDescription: deal.businessDescription || '',
      businessType: deal.businessType || 'Business',
      businessLocation: deal.businessLocation || deal.city || 'Los Angeles',
      businessEmail: deal.businessEmail || '',
      businessPhone: deal.businessPhone || '',
      businessImage: deal.businessImage || '',
      street: deal.street || '' // Add street address field
    }));

    return [...businessOffers, ...convertedQuickDeals];
  }, [businessOffers, quickDeals]);

  const isLoading = isBusinessOffersLoading || isQuickDealsLoading;
  const error = businessOffersError || quickDealsError;

  // Handle claiming a deal
  const handleClaimDeal = async (deal: BusinessDeal) => {
    if (!effectiveUser) {
      toast({
        title: "Login Required",
        description: "Please log in to claim deals.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/quick-deals/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUser.id.toString()
        },
        body: JSON.stringify({ dealId: deal.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim deal');
      }

      toast({
        title: "Deal Claimed!",
        description: `You've successfully claimed "${deal.title}". Show this to the business to redeem.`
      });

    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim deal. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get unique cities from all deals
  const availableCities = useMemo(() => {
    const cities = [...new Set(allDeals.map(deal => deal.city))].sort();
    return cities;
  }, [allDeals]);

  // Filter deals by selected city WITH LA METRO CONSOLIDATION
  const filteredDeals = useMemo(() => {
    if (!selectedCity) {
      // Default filter by user's location WITH LA METRO CONSOLIDATION
      if (effectiveUser?.hometownCity) {
        const userCity = effectiveUser.hometownCity;
        
        // LA Metro Cities - same list as other features
        const LA_METRO_CITIES = [
          'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo',
          'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank',
          'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Compton', 'Downey',
          'Pomona', 'Playa del Rey', 'Redondo Beach', 'Culver City', 'Marina del Rey',
          'Hermosa Beach', 'Hawthorne', 'Gardena', 'Carson', 'Lakewood', 'Norwalk',
          'Whittier', 'Montebello', 'East Los Angeles', 'Monterey Park', 'Alhambra',
          'South Pasadena', 'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
          'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge', 'Malibu',
          'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City', 'West LA',
          'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz', 'Silver Lake',
          'Echo Park', 'Downtown LA', 'Arts District', 'Little Tokyo', 'Chinatown',
          'Boyle Heights', 'East LA', 'Highland Park', 'Eagle Rock', 'Atwater Village',
          'Glassell Park', 'Mount Washington', 'Cypress Park', 'Sun Valley', 'Pacoima',
          'Sylmar', 'Granada Hills', 'Porter Ranch', 'Chatsworth', 'Canoga Park',
          'Woodland Hills', 'Tarzana', 'Panorama City', 'Mission Hills', 'Sepulveda',
          'Arleta', 'San Pedro', 'Wilmington', 'Harbor City', 'Harbor Gateway',
          'Watts', 'South LA', 'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills',
          'Ladera Heights'
        ];
        
        // If user is in LA metro area, show ALL LA metro deals
        if (LA_METRO_CITIES.includes(userCity)) {
          console.log(`🌍 DEALS METRO CONSOLIDATION: ${userCity} → showing all LA metro deals`);
          return allDeals.filter(deal => 
            LA_METRO_CITIES.some(city => 
              deal.city.toLowerCase().includes(city.toLowerCase()) ||
              deal.businessLocation?.toLowerCase().includes(city.toLowerCase())
            )
          );
        }
        
        // For non-LA users, show deals from their city
        return allDeals.filter(deal => 
          deal.city.toLowerCase().includes(userCity.toLowerCase()) ||
          deal.businessLocation?.toLowerCase().includes(userCity.toLowerCase())
        );
      }
      
      return allDeals; // Show all if no user location
    }
    
    return allDeals.filter(deal => 
      deal.city.toLowerCase().includes(selectedCity.toLowerCase()) ||
      deal.businessLocation?.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }, [allDeals, selectedCity, effectiveUser]);

  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Please Log In
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Please log in to view local deals and offers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getDiscountIcon = (discountType: string) => {
    switch(discountType) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'buy_one_get_one':
        return <Users className="w-4 h-4" />;
      case 'fixed_amount':
        return <Store className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  const formatDiscount = (discountType: string, discountValue: string) => {
    // Let businesses write their own deal descriptions without automatic formatting
    switch(discountType) {
      case 'percentage':
        return discountValue; // Just show the value, no "% OFF" suffix
      case 'buy_one_get_one':
        return 'BOGO';
      case 'fixed_amount':
        return `$${discountValue} OFF`;
      default:
        return discountValue;
    }
  };

  const isInstantDeal = (category: string) => {
    return category === 'instant_deal';
  };

  const renderDealCard = (deal: BusinessDeal) => {
    const expired = isExpired(deal.validUntil);
    const instant = isInstantDeal(deal.category);
    
    return (
      <Card key={deal.id} className={`hover:shadow-lg transition-all duration-300 ${expired ? 'opacity-75' : ''} ${instant ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' : 'border-blue-300'}`}>
        <CardHeader className="pb-3">
          {/* Business Header */}
          <div className="flex items-start gap-3 mb-3">
            {deal.businessImage ? (
              <img 
                src={deal.businessImage} 
                alt={deal.businessName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {deal.businessName ? deal.businessName.charAt(0).toUpperCase() : 'B'}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {deal.businessName || 'Business Name'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>{deal.businessLocation}</span>
              </div>
            </div>
            {instant && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                <Zap className="w-3 h-3" />
                INSTANT
              </div>
            )}
          </div>

          {/* Deal Title & Discount */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {deal.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Hide automatic discount formatting - let businesses write their own deal descriptions */}
                {deal.discountCode && (
                  <Badge variant="secondary">
                    Code: {deal.discountCode}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-2 mt-2">
            {instant ? <Timer className="w-4 h-4 text-orange-500" /> : <Clock className="w-4 h-4 text-blue-500" />}
            <span className={`text-sm font-medium ${expired ? 'text-red-500' : instant ? 'text-orange-600' : 'text-blue-600'}`}>
              {expired ? 'Expired' : getTimeRemaining(deal.validUntil)}
            </span>
            {!expired && (
              <span className="text-xs text-gray-500">
                Until {formatDate(deal.validUntil)}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Deal Description */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Deal Details</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {deal.description}
            </p>
          </div>

          {/* Business Description */}
          {deal.businessDescription && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">About {deal.businessName}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {deal.businessDescription}
              </p>
            </div>
          )}

          {/* Deal Image */}
          {deal.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={deal.imageUrl} 
                alt={deal.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t pt-3">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information</h4>
            <div className="space-y-2">
              {deal.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${deal.businessPhone}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    {deal.businessPhone}
                  </a>
                </div>
              )}
              {deal.businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${deal.businessEmail}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    {deal.businessEmail}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {deal.street && `${deal.street}, `}{deal.city}, {deal.state}, {deal.country}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {deal.termsConditions && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Terms & Conditions</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {deal.termsConditions}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="border-t pt-3">
            <Button 
              className={`w-full ${instant ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              disabled={expired}
              onClick={() => handleClaimDeal(deal)}
              data-testid="button-claim-deal"
            >
              {expired ? 'Deal Expired' : instant ? 'Claim Instant Deal' : 'Claim Deal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show filtered active deals
  const activeDeals = useMemo(() => {
    return filteredDeals.filter(deal => !isExpired(deal.validUntil));
  }, [filteredDeals]);

  // Separate instant deals and regular deals
  const instantDeals = useMemo(() => activeDeals.filter(deal => deal.category === 'instant_deal'), [activeDeals]);
  const regularDeals = useMemo(() => activeDeals.filter(deal => deal.category !== 'instant_deal'), [activeDeals]);
  


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Local Business Deals & Offers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover amazing deals from local businesses anywhere
          </p>
          
          {/* Business User - Create Deal Button */}
          {effectiveUser?.userType === 'business' && (
            <div className="mt-4 mb-6">
              <Button 
                onClick={() => setLocation('/business-offers')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3"
                data-testid="button-create-deal"
              >
                <Store className="w-4 h-4 mr-2" />
                Create New Deal
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Manage your business deals and create new offers for customers
              </p>
            </div>
          )}
          
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Store className="w-4 h-4" />
              {activeDeals.length} Available Deals
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
              <Zap className="w-4 h-4" />
              {instantDeals.length} Flash Deals
            </Badge>
          </div>
        </div>

        {/* Simple City Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Choose City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
                  Select City (or leave blank to see ALL deals)
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">Show ALL Cities</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {selectedCity && (
                <Button 
                  variant="outline"
                  onClick={() => setSelectedCity('')}
                  className="mt-6"
                >
                  Clear City Filter
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {selectedCity ? `Showing deals in ${selectedCity}` : `Showing ALL deals from all cities (${allDeals.length} total)`}
            </p>
          </CardContent>
        </Card>

        {/* Deals Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all">All Deals ({activeDeals.length})</TabsTrigger>
            <TabsTrigger value="instant" className="text-orange-600">
              Flash Deals ({instantDeals.length})
            </TabsTrigger>
            <TabsTrigger value="regular">Regular Deals ({regularDeals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading deals...</p>
              </div>
            ) : activeDeals.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No deals available
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Check back later for new deals from local businesses.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instant">
            {instantDeals.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No flash deals available
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Flash deals are time-sensitive offers that expire within hours.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instantDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="regular">
            {regularDeals.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No regular deals available
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Regular deals typically last for days or weeks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}