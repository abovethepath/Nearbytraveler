import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import { MapPin, Calendar, ExternalLink, Percent, DollarSign, Gift, Clock, Phone, Globe, User, Plus, TrendingUp, BarChart3, Eye, Edit, Trash2, Building } from "lucide-react";

import Navbar from "@/components/navbar";
import QuickDealsDiscovery from "@/components/QuickDealsDiscovery";
// MobileNav removed - using global mobile navigation

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
  imageUrl?: string;
  termsConditions?: string;
  contactInfo?: string;
  websiteUrl?: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  business: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
    location?: string;
    bio?: string;
    streetAddress?: string;
    websiteUrl?: string;
  };
}

const CATEGORIES = [
  'restaurant',
  'hotel',
  'activity',
  'retail',
  'service',
  'entertainment',
  'tours',
  'drinks',
  'happy_hour',
  'custom'
];

const TARGET_AUDIENCES = [
  'locals',
  'travelers',
  'both'
];

interface BusinessOffersProps {
  businessId?: string;
  dealId?: string;
}

export default function BusinessOffers({ businessId, dealId }: BusinessOffersProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    country: '',
    category: '',
    targetAudience: ''
  });
  
  const [viewingOffer, setViewingOffer] = useState<BusinessOffer | null>(null);

  // Get user data to determine their location context
  const user = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
  
  // Get user's current location context (travel destination or hometown)
  const { data: userProfile } = useQuery({
    queryKey: [`/api/users/${user.id}`],
    enabled: !!user.id,
  });

  // BUSINESS-AWARE LOCATION LOGIC: Business users should see business location deals, not travel destination
  const getNearbyCity = () => {
    if (!userProfile) return null; // Wait for profile to load
    
    // BUSINESS USER FIX: If this is a business user, always use business location
    if (userProfile.userType === 'business') {
      return userProfile.businessCity || userProfile.hometownCity || null;
    }
    
    // For regular users: Are they traveling with active dates? Show travel destination deals
    const now = new Date();
    const travelStart = userProfile.travelStartDate ? new Date(userProfile.travelStartDate) : null;
    const travelEnd = userProfile.travelEndDate ? new Date(userProfile.travelEndDate) : null;
    const isActivelyTraveling = travelStart && travelEnd && now >= travelStart && now <= travelEnd;
    
    if (isActivelyTraveling && userProfile.travelDestination) {
      const currentLocation = userProfile.travelDestination.split(',')[0].trim();
      return currentLocation;
    }
    
    // Otherwise they're home - show hometown deals
    return userProfile.hometownCity || null;
  };

  const nearbyCity = getNearbyCity();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['/api/business-deals', filters, nearbyCity, businessId, dealId],
    queryFn: () => {
      // If viewing a specific deal, fetch it directly
      if (dealId) {
        return fetch(`/api/business-deals/${dealId}`).then(res => res.json()).then(offer => [offer]);
      }
      
      const params = new URLSearchParams();
      
      // Business-specific filtering
      if (businessId) {
        params.append('businessId', businessId);
      } else {
        // CORE FIX: Always filter by nearby city unless user manually overrides
        if (filters.city) {
          // User manually filtered by city - use their choice
          params.append('city', filters.city);
        } else if (nearbyCity) {
          // Auto-filter by nearby city (travel destination or hometown)
          params.append('city', nearbyCity);
        } else {
          // Fallback to show all offers while profile loads
          // Don't filter by city - show global offers
        }
      }
      
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.targetAudience && filters.targetAudience !== 'all') params.append('targetAudience', filters.targetAudience);
      
      return fetch(`/api/business-deals?${params}`).then(res => res.json());
    },
    enabled: true // Always enabled - will show global offers until location loads
  });

  // Check if user has already redeemed an offer - MOVED TO TOP
  const { data: userRedemptions = [] } = useQuery({
    queryKey: ['/api/user-redemptions'],
    queryFn: () => {
      const user = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
      if (!user.id) return Promise.resolve([]);
      return fetch(`/api/users/${user.id}/offer-redemptions`).then(res => res.json());
    },
    enabled: !!JSON.parse(localStorage.getItem('travelconnect_user') || '{}').id
  });

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <DollarSign className="h-4 w-4" />;
      case 'buy_one_get_one': return <Gift className="h-4 w-4" />;
      case 'free_service': return <Gift className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

  const getDiscountText = (offer: BusinessOffer) => {
    switch (offer.discountType) {
      case 'percentage':
        return `${offer.discountValue}% off`;
      case 'fixed_amount':
        return `$${offer.discountValue} off`;
      case 'buy_one_get_one':
        return 'Buy One Get One';
      case 'free_service':
        return 'Free Service';
      default:
        return offer.discountValue;
    }
  };

  const isOfferExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isOfferFullyRedeemed = (offer: BusinessOffer) => {
    return offer.maxRedemptions && offer.currentRedemptions >= offer.maxRedemptions;
  };



  const isOfferRedeemed = (offerId: number) => {
    return userRedemptions.some((redemption: any) => redemption.offerId === offerId);
  };

  const handleRedeemOffer = async (offerId: number) => {
    try {
      const user = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
      if (!user.id) {
        toast({
          title: "Login Required",
          description: "Please log in to redeem offers",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/business-deals/${offerId}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Offer redeemed successfully",
        });
        // Refresh the data without page reload
        queryClient.invalidateQueries({ queryKey: ['/api/business-deals'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user-redemptions'] });
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Unable to redeem offer at this time";
        
        if (errorMessage.includes('already redeemed') || errorMessage.includes('reached the limit')) {
          toast({
            title: "Redemption Limit Reached",
            description: "You've used this offer the maximum number of times allowed",
            variant: "destructive",
          });
        } else if (errorMessage.includes('expired')) {
          toast({
            title: "Offer Expired",
            description: "This offer is no longer valid",
            variant: "destructive",
          });
        } else if (errorMessage.includes('not active')) {
          toast({
            title: "Offer Unavailable",
            description: "This offer is currently unavailable",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Unable to Redeem",
            description: "Please try again later or contact the business",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to redeem offer at this time",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* MobileNav removed - using global MobileTopNav and MobileBottomNav */}
      <div className="w-full max-w-full px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nearby Business Offers
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {nearbyCity ? (
              (() => {
                const now = new Date();
                const travelStart = userProfile?.travelStartDate ? new Date(userProfile.travelStartDate) : null;
                const travelEnd = userProfile?.travelEndDate ? new Date(userProfile.travelEndDate) : null;
                const isActivelyTraveling = travelStart && travelEnd && now >= travelStart && now <= travelEnd;
                
                return `Showing offers in ${nearbyCity} ${isActivelyTraveling ? '(where you\'re visiting)' : '(your home area)'}`;
              })()
            ) : filters.city ? `Showing offers in ${filters.city}` : 'Discover local business offers and deals'}
          </p>
        </div>

        {/* Big CREATE A NEW DEAL CTA */}
        {user?.userType === 'business' && (
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
                  onClick={() => setLocation('/business-dashboard')}
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
        )}

        {/* Quick Deals Section - Flash Deals with Timers */}
        <div className="mb-8">
          <QuickDealsDiscovery 
            userLocation={{
              city: nearbyCity || '',
              state: userProfile?.hometownState || '',
              country: userProfile?.hometownCountry || ''
            }}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6 sm:mb-8 w-full max-w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Filter Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 w-full max-w-full overflow-x-hidden">
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Location Override</label>
                <SmartLocationInput
                  city={filters.city}
                  state={filters.state}
                  country={filters.country}
                  onLocationChange={(location) => setFilters(prev => ({ 
                    ...prev, 
                    city: location.city,
                    state: location.state,
                    country: location.country
                  }))}
                  placeholder={{
                    country: nearbyCity ? `Currently showing: ${nearbyCity}` : "Select country to override",
                    state: "Select state/region",
                    city: "Select city"
                  }}
                />
                {(filters.country || filters.state || filters.city) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Clear location fields to return to your nearby offers
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Target Audience</label>
                <Select 
                  value={filters.targetAudience} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, targetAudience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All audiences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All audiences</SelectItem>
                    {TARGET_AUDIENCES.map(audience => (
                      <SelectItem key={audience} value={audience}>
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse w-full max-w-full">
                <div className="h-32 sm:h-48 bg-gray-200 dark:bg-gray-700"></div>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card className="w-full max-w-full">
            <CardContent className="text-center py-8 sm:py-12">
              <Gift className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No offers found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your filters or check back later for new deals
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: BusinessOffer) => {
              const expired = isOfferExpired(offer.validUntil);
              const fullyRedeemed = isOfferFullyRedeemed(offer);
              const alreadyRedeemed = isOfferRedeemed(offer.id);
              const canRedeem = !expired && !fullyRedeemed && !alreadyRedeemed;

              return (
                <Card 
                  key={offer.id} 
                  className={`overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${(!canRedeem || alreadyRedeemed) ? 'opacity-60 grayscale' : ''}`}
                  onClick={() => setViewingOffer(offer)}
                >
                  {offer.imageUrl && (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      {(!canRedeem || alreadyRedeemed) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm">
                            {alreadyRedeemed ? '✓ Redeemed' : expired ? 'Expired' : 'Fully Redeemed'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    {/* View Business Button - Moved to top */}
                    <div className="mb-4">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/profile/${offer.business.id}`);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-md font-medium"
                        variant="outline"
                        style={{ transition: 'none' }}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        View {offer.business?.businessName || offer.business?.name || 'Business'}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Click card to view full details</p>
                    
                    {/* Business Details */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        {/* Business Name - Moved above address */}
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                          <div className="font-semibold text-base text-gray-900 dark:text-white">{offer.business?.businessName || offer.business?.name || 'Business'}</div>
                        </div>
                        
                        {/* Full Business Address */}
                        {(offer.business?.streetAddress || offer.business?.location) && (
                          <div className="flex items-start space-x-1">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                            <div className="text-gray-700 dark:text-gray-300">
                              {offer.business?.streetAddress && (
                                <div>{offer.business.streetAddress}</div>
                              )}
                              {offer.business?.location && (
                                <div>{offer.business.location}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Business Website */}
                        {offer.business?.websiteUrl && (
                          <div className="flex items-center space-x-1">
                            <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <a 
                              href={offer.business?.websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 dark:text-blue-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {offer.business?.websiteUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {offer.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        {getDiscountIcon(offer.discountType)}
                        <span className="font-bold text-lg">
                          {getDiscountText(offer)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {offer.description}
                    </p>

                    {/* Category Only - Location shown above */}
                    <div className="flex items-center mb-4">
                      <Badge variant="outline" className="text-xs">
                        {offer.category}
                      </Badge>
                    </div>

                    {/* Target Audience */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {offer.targetAudience.map(audience => (
                        <Badge key={audience} variant="secondary" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>

                    {/* Valid Until */}
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
                      <Clock className="h-4 w-4" />
                      <span>Valid until {new Date(offer.validUntil).toLocaleDateString()}</span>
                    </div>

                    {/* Redemption Info */}
                    {offer.maxRedemptions && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {offer.currentRedemptions} / {offer.maxRedemptions} redeemed
                      </div>
                    )}



                    {/* Contact Information */}
                    <div className="space-y-2 mb-4">
                      {offer.contactInfo && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{offer.contactInfo}</span>
                        </div>
                      )}
                      {offer.websiteUrl && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={offer.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 dark:text-blue-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {offer.websiteUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {!alreadyRedeemed && !expired && !fullyRedeemed ? (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRedeemOffer(offer.id);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          style={{ transition: 'none' }}
                        >
                          Redeem This Offer
                        </Button>
                      ) : (
                        <Button 
                          disabled
                          className="w-full"
                          variant="secondary"
                          style={{ transition: 'none' }}
                        >
                          {alreadyRedeemed ? '✓ Already Redeemed' : expired ? 'Offer Expired' : 'No Longer Available'}
                        </Button>
                      )}
                    </div>

                    {/* Terms and Conditions */}
                    {offer.termsConditions && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {offer.termsConditions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Offer Details Modal */}
      {viewingOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingOffer(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {viewingOffer.business?.businessName || viewingOffer.business?.name || viewingOffer.title}
              </h2>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{viewingOffer.category}</Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {getDiscountText(viewingOffer)}
                </Badge>
              </div>
            </div>
              
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
                      <p><span className="font-medium">Value:</span> {viewingOffer.discountValue}</p>
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
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business Location</h4>
                    <div className="space-y-1 text-sm">
                      <p>{viewingOffer.city}, {viewingOffer.state}</p>
                      <p>{viewingOffer.country}</p>
                      {viewingOffer.business?.streetAddress && (
                        <p>{viewingOffer.business.streetAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {viewingOffer.termsConditions && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{viewingOffer.termsConditions}</p>
                  </div>
                )}

                {viewingOffer.business?.websiteUrl && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business Website</h4>
                    <a 
                      href={viewingOffer.business.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {viewingOffer.business.websiteUrl}
                    </a>
                  </div>
                )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingOffer(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}