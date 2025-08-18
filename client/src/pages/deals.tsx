import React, { useContext, useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLAMetroCity, getMetroCities } from "@shared/constants";

import { CalendarDays, MapPin, Percent, Store, Users, Phone, Globe, Mail, Clock, Timer, Zap, AlertCircle } from "lucide-react";
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
  street?: string;
  // Business Information (Customer-Facing Only)
  businessName: string;
  businessDescription: string;
  businessType: string;
  businessLocation: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress?: string; // Add full street address
  businessImage?: string;
}

export default function Deals() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const effectiveUser = user || authStorage.getUser();
  
  // Simple city filtering 
  const [selectedCity, setSelectedCity] = useState('');

  // Add periodic refresh to ensure business description updates are reflected
  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate business deals cache every 30 seconds to catch bio changes
      queryClient.invalidateQueries({ queryKey: ['/api/business-deals'] });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);
  


  // Fetch all business deals with complete business information - FORCE REFRESH for dynamic bio updates
  const { data: businessDeals = [], isLoading: isBusinessDealsLoading, error: businessDealsError, refetch: refetchBusinessDeals } = useQuery<BusinessDeal[]>({
    queryKey: ['/api/business-deals'],
    enabled: !!effectiveUser,
    refetchOnWindowFocus: true, // Enable refetch on focus to get fresh business data
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // No stale time - always fetch fresh data for dynamic bio updates
    gcTime: 0, // Don't cache to ensure fresh business info (gcTime replaces cacheTime in newer versions)
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
      category: deal.category || 'general', // Add missing category field
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

    return [...businessDeals, ...convertedQuickDeals];
  }, [businessDeals, quickDeals]);

  const isLoading = isBusinessDealsLoading || isQuickDealsLoading;
  const error = businessDealsError || quickDealsError;

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
    // Use the centralized metro configuration from shared/constants
    
    if (!selectedCity) {
      // Default filter by user's location WITH LA METRO CONSOLIDATION
      if (effectiveUser?.hometownCity) {
        const userCity = effectiveUser.hometownCity;
        
        // If user is in LA metro area, show ALL LA metro deals
        if (isLAMetroCity(userCity)) {
          console.log(`🌍 DEALS METRO CONSOLIDATION: ${userCity} → showing all LA metro deals`);
          // Show all deals marked as LA Metro by the API
          return allDeals.filter(deal => deal.isLAMetro === true);
        }
        
        // For non-LA users, show deals from their city
        return allDeals.filter(deal => 
          deal.city?.toLowerCase().includes(userCity.toLowerCase()) ||
          deal.businessLocation?.toLowerCase().includes(userCity.toLowerCase())
        );
      }
      
      return allDeals; // Show all if no user location
    }
    
    // Manual city filter WITH LA METRO CONSOLIDATION
    if (isLAMetroCity(selectedCity)) {
      console.log(`🌍 MANUAL SEARCH METRO CONSOLIDATION: ${selectedCity} → showing all LA metro deals`);
      // Show all LA metro deals when searching for any LA metro city
      return allDeals.filter(deal => deal.isLAMetro === true);
    }
    
    // For non-LA cities, standard filtering
    return allDeals.filter(deal => 
      deal.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
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
      <Card key={deal.id} className={`deal-card hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${expired ? 'opacity-75' : ''} ${instant ? 'border-orange-300 dark:border-orange-600 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' : 'border-blue-300 dark:border-blue-600'}`} onClick={() => handleClaimDeal(deal)}>
        <CardHeader className="pb-3">
          {/* Business Header */}
          <div className="flex items-start gap-3 mb-3">
            {deal.businessImage ? (
              <img 
                src={deal.businessImage} 
                alt={deal.businessName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {deal.businessName ? deal.businessName.charAt(0).toUpperCase() : 'B'}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg" style={{ color: 'black' }}>
                {deal.businessName || 'Business Name'}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span style={{ color: 'black' }}>{deal.businessAddress ? `${deal.businessAddress}, ${deal.businessLocation}` : deal.businessLocation}</span>
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
              <CardTitle className="text-xl font-bold mb-2" style={{ color: 'black' }}>
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
            <h4 className="font-semibold mb-1" style={{ color: 'black' }}>Deal Details</h4>
            <p className="text-sm" style={{ color: 'black' }}>
              {deal.description}
            </p>
          </div>

          {/* Business Description */}
          {deal.businessDescription && (
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'black' }}>About {deal.businessName}</h4>
              <p className="text-sm" style={{ color: 'black' }}>
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
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
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
                  {deal.businessAddress && `${deal.businessAddress}, `}{deal.businessLocation || `${deal.city}, ${deal.state}, ${deal.country}`}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions - PROMINENTLY DISPLAYED */}
          {deal.termsConditions && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  IMPORTANT: Terms & Conditions
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {deal.termsConditions}
                </p>
              </div>
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
                onClick={() => setLocation('/business-deals')}
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