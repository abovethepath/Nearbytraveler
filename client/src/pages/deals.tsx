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
  
  // Simple city filtering - Initialize with user's city for proper location filtering
  const [selectedCity, setSelectedCity] = useState(effectiveUser?.hometownCity || '');

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
    // Add dealSource to business deals to distinguish them
    const markedBusinessDeals = businessDeals.map(deal => ({
      ...deal,
      dealSource: 'business' as const
    }));

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
      street: deal.street || '', // Add street address field
      dealSource: 'quick' as const
    }));

    return [...markedBusinessDeals, ...convertedQuickDeals];
  }, [businessDeals, quickDeals]);

  const isLoading = isBusinessDealsLoading || isQuickDealsLoading;
  const error = businessDealsError || quickDealsError;

  // Handle claiming a deal
  const handleClaimDeal = async (deal: any) => {
    if (!effectiveUser) {
      toast({
        title: "Login Required",
        description: "Please log in to claim deals.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use correct endpoint based on deal source
      const endpoint = deal.dealSource === 'business' ? '/api/business-deals/claim' : '/api/quick-deals/claim';
      
      const response = await fetch(endpoint, {
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
    
    // Determine the active city filter - use selectedCity if manually set, otherwise user's hometown
    const activeCity = selectedCity || effectiveUser?.hometownCity || '';
    
    if (!activeCity) {
      // Only show all deals if user has no location AND no manual filter
      console.log('🌍 DEALS: No city filter and no user location - showing all deals');
      return allDeals;
    }
    
    // Apply location filtering WITH LA METRO CONSOLIDATION
    if (isLAMetroCity(activeCity)) {
      console.log(`🌍 DEALS METRO CONSOLIDATION: ${activeCity} → showing all LA metro deals`);
      // Show all deals in LA metro area cities
      return allDeals.filter(deal => isLAMetroCity(deal.city));
    }
    
    // For non-LA cities, filter by city name
    console.log(`🌍 DEALS: Filtering deals for city: ${activeCity}`);
    return allDeals.filter(deal => 
      deal.city?.toLowerCase().includes(activeCity.toLowerCase()) ||
      deal.businessLocation?.toLowerCase().includes(activeCity.toLowerCase())
    );
  }, [allDeals, selectedCity, effectiveUser]);

  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden break-words">
        <Card className="w-full max-w-md overflow-hidden break-words">
          <CardContent className="text-center py-8 sm:py-12 px-4 overflow-hidden break-words">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
              Please Log In
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm break-words">
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
        return <Percent className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'buy_one_get_one':
        return <Users className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'fixed_amount':
        return <Store className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Percent className="w-3 h-3 sm:w-4 sm:h-4" />;
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
      <Card key={deal.id} className={`deal-card hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden break-words ${expired ? 'opacity-75' : ''} ${instant ? 'border-orange-300 dark:border-orange-600 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' : 'border-blue-300 dark:border-blue-600'}`} onClick={() => handleClaimDeal(deal)}>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 overflow-hidden break-words">
          {/* Business Header - Mobile Responsive */}
          <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3 overflow-hidden break-words">
            {deal.businessImage ? (
              <img 
                src={deal.businessImage} 
                alt={deal.businessName}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                {deal.businessName ? deal.businessName.charAt(0).toUpperCase() : 'B'}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden break-words">
              <h3 className="font-bold text-sm sm:text-base md:text-lg leading-tight break-words" style={{ color: 'black' }}>
                {deal.businessName || 'Business Name'}
              </h3>
              <div className="flex items-start gap-1 sm:gap-2 text-xs sm:text-sm mt-1 overflow-hidden break-words">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                <span style={{ color: 'black' }} className="leading-tight break-words">
                  {deal.businessAddress ? `${deal.businessAddress}, ${deal.businessLocation}` : deal.businessLocation}
                </span>
              </div>
            </div>
            {instant && (
              <div className="flex items-center gap-1 px-1 sm:px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                <Zap className="w-2 h-2 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">INSTANT</span>
                <span className="sm:hidden">!</span>
              </div>
            )}
          </div>

          {/* Deal Title & Discount - Mobile Responsive */}
          <div className="flex justify-between items-start gap-2 overflow-hidden break-words">
            <div className="flex-1 min-w-0 overflow-hidden break-words">
              <CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 break-words" style={{ color: 'black' }}>
                {deal.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {deal.discountCode && (
                  <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-gray-500 text-white border-0">
                    Code: {deal.discountCode}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time Remaining - Mobile Responsive */}
          <div className="flex flex-wrap items-center gap-2 mt-2 overflow-hidden break-words">
            {instant ? <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" /> : <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />}
            <div className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 ${expired ? 'bg-red-500 text-white' : instant ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
              {expired ? 'Expired' : getTimeRemaining(deal.validUntil)}
            </div>
            {!expired && (
              <span className="text-xs text-gray-500 break-words">
                Until {formatDate(deal.validUntil)}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 overflow-hidden break-words">
          {/* Deal Description */}
          <div className="overflow-hidden break-words">
            <h4 className="font-semibold mb-1 text-sm sm:text-base break-words" style={{ color: 'black' }}>Deal Details</h4>
            <p className="text-xs sm:text-sm break-words" style={{ color: 'black' }}>
              {deal.description}
            </p>
          </div>

          {/* Business Description */}
          {deal.businessDescription && (
            <div className="overflow-hidden break-words">
              <h4 className="font-semibold mb-1 text-sm sm:text-base break-words" style={{ color: 'black' }}>About {deal.businessName}</h4>
              <p className="text-xs sm:text-sm break-words" style={{ color: 'black' }}>
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
                className="w-full h-32 sm:h-40 md:h-48 object-cover"
              />
            </div>
          )}

          {/* Contact Information - Mobile Responsive */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 overflow-hidden break-words">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base break-words">Contact Information</h4>
            <div className="space-y-2 overflow-hidden break-words">
              {deal.businessPhone && (
                <div className="flex items-center gap-1 sm:gap-2 overflow-hidden break-words">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <a href={`tel:${deal.businessPhone}`} className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm break-words">
                    {deal.businessPhone}
                  </a>
                </div>
              )}
              {deal.businessEmail && (
                <div className="flex items-center gap-1 sm:gap-2 overflow-hidden break-words">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <a href={`mailto:${deal.businessEmail}`} className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm break-words">
                    {deal.businessEmail}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-1 sm:gap-2 overflow-hidden break-words">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm break-words">
                  {deal.businessAddress && `${deal.businessAddress}, `}{deal.businessLocation || `${deal.city}, ${deal.state}, ${deal.country}`}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions - Mobile Responsive */}
          {deal.termsConditions && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4 mt-3 sm:mt-4 overflow-hidden break-words">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 rounded-lg overflow-hidden break-words">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base break-words">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  IMPORTANT: Terms & Conditions
                </h4>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium break-words">
                  {deal.termsConditions}
                </p>
              </div>
            </div>
          )}

          {/* Action Button - Mobile Responsive */}
          <div className="border-t pt-3 overflow-hidden break-words">
            <Button 
              className={`w-full h-10 sm:h-12 text-sm sm:text-base ${instant ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden break-words">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden break-words">
        {/* Header - Mobile Responsive */}
        <div className="text-center mb-6 sm:mb-8 overflow-hidden break-words">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">
            Local Business Deals & Offers
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
            Discover amazing deals from local businesses anywhere
          </p>
          
          {/* Business User - Create Deal Button */}
          {effectiveUser?.userType === 'business' && (
            <div className="mt-4 mb-6 overflow-hidden break-words">
              <Button 
                onClick={() => setLocation('/business-deals')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                data-testid="button-create-deal"
              >
                <Store className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Create New Deal
              </Button>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 break-words">
                Manage your business deals and create new offers for customers
              </p>
            </div>
          )}
          
          <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mt-4 overflow-hidden break-words">
            <div className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
              <Store className="w-3 h-3 mr-1" />
              {activeDeals.length} Available
            </div>
            <div className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium whitespace-nowrap leading-none bg-orange-500 text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              {instantDeals.length} Flash Deals
            </div>
          </div>
        </div>

        {/* City Filter - Mobile Responsive */}
        <Card className="mb-6 sm:mb-8 overflow-hidden break-words">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg break-words">Choose City</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 overflow-hidden break-words">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="text-xs sm:text-sm font-medium mb-2 block text-gray-900 dark:text-white break-words">
                  Select City (defaults to your location)
                </label>
                <select 
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">Your Location: {effectiveUser?.hometownCity || 'Set location in profile'}</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {selectedCity && selectedCity !== effectiveUser?.hometownCity && (
                <Button 
                  variant="outline"
                  onClick={() => setSelectedCity('')}
                  className="sm:mt-6 h-10 sm:h-11 text-sm"
                >
                  Back to My Location
                </Button>
              )}
            </div>
            <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-gray-500 text-white border-0 mt-2">
              {(() => {
                const activeCity = selectedCity || effectiveUser?.hometownCity || '';
                const dealCount = filteredDeals.length;
                if (!activeCity) {
                  return `All cities (${allDeals.length} deals)`;
                }
                return `${activeCity} (${dealCount} deals)`;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Deals Content - Mobile Responsive */}
        <Tabs defaultValue="all" className="w-full overflow-hidden break-words">
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-10 sm:h-12">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All ({activeDeals.length})</TabsTrigger>
            <TabsTrigger value="instant" className="text-orange-600 text-xs sm:text-sm">
              Flash ({instantDeals.length})
            </TabsTrigger>
            <TabsTrigger value="regular" className="text-xs sm:text-sm">Regular ({regularDeals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="overflow-hidden break-words">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12 overflow-hidden break-words">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">Loading deals...</p>
              </div>
            ) : activeDeals.length === 0 ? (
              <div className="text-center py-8 sm:py-12 overflow-hidden break-words">
                <Store className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
                  No deals available
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
                  Check back later for new deals from local businesses.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden break-words">
                {activeDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instant" className="overflow-hidden break-words">
            {instantDeals.length === 0 ? (
              <div className="text-center py-8 sm:py-12 overflow-hidden break-words">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
                  No flash deals available
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
                  Flash deals are time-sensitive offers that expire within hours.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden break-words">
                {instantDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="regular" className="overflow-hidden break-words">
            {regularDeals.length === 0 ? (
              <div className="text-center py-8 sm:py-12 overflow-hidden break-words">
                <Store className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
                  No regular deals available
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
                  Regular deals are longer-term offers from local businesses.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden break-words">
                {regularDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}