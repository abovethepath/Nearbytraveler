import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, MapPin, Users, DollarSign, Tag, Percent, Gift, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { QuickDeal } from '@shared/schema';

interface QuickDealsDiscoveryProps {
  userLocation?: {
    city: string;
    state: string;
    country: string;
  };
}

// Timer component for countdown
const CountdownTimer = ({ validUntil }: { validUntil: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      // Parse the validUntil date and ensure it's in local timezone
      const expiryDate = new Date(validUntil);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏰ COUNTDOWN: Now: ${now.toISOString()}, Expires: ${expiryDate.toISOString()}`);
      }
      
      const distance = expiryDate.getTime() - now.getTime();

      if (distance < 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [validUntil]);

  const isExpired = timeLeft === 'EXPIRED';
  const isUrgent = !isExpired && (timeLeft.includes('m') && !timeLeft.includes('h')) || timeLeft.includes('s');

  return (
    <div className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-green-600'}`}>
      <Clock className="w-3 h-3" />
      <span className="text-xs font-medium">
        {isExpired ? 'EXPIRED' : timeLeft}
      </span>
    </div>
  );
};

export function QuickDealsDiscovery({ userLocation }: QuickDealsDiscoveryProps) {
  const [, setLocation] = useLocation();
  const [displayLimit, setDisplayLimit] = useState(6);

  // Fetch active quick deals from all businesses
  const { data: quickDeals, isLoading } = useQuery<QuickDeal[]>({
    queryKey: ['/api/quick-deals', userLocation?.city],
    queryFn: async () => {
      let url = '/api/quick-deals';
      const params = new URLSearchParams();
      
      if (userLocation?.city) {
        params.append('city', userLocation.city);
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch quick deals');
      const deals = await response.json();
      
      // Filter only active deals and sort by creation time (newest first)
      const now = new Date();
      return deals
        .filter((deal: QuickDeal) => {
          const validUntil = new Date(deal.validUntil);
          return deal.isActive && validUntil > now && (deal.currentRedemptions || 0) < (deal.maxRedemptions || 100);
        })
        .sort((a: QuickDeal, b: QuickDeal) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const getDealTypeIcon = (dealType: string) => {
    switch (dealType) {
      case 'percentage': return <Percent className="h-3 w-3" />;
      case 'dollar': return <DollarSign className="h-3 w-3" />;
      case 'bogo': return <Tag className="h-3 w-3" />;
      case 'free_item': return <Gift className="h-3 w-3" />;
      case 'combo': return <Package className="h-3 w-3" />;
      default: return <Tag className="h-3 w-3" />;
    }
  };

  // Format discount amount for display
  const formatDiscountAmount = (discountAmount: string | null) => {
    if (!discountAmount) return 'Special Deal';
    
    // Clean up common formatting issues
    let formatted = discountAmount.trim();
    
    // Remove duplicate symbols and fix common issues
    formatted = formatted.replace(/(%\$|%\s*\$|\$%)/gi, '$'); // Fix %$ to just $
    formatted = formatted.replace(/(%.*%)/gi, (match) => match.replace(/%/g, '')); // Remove duplicate %
    formatted = formatted.replace(/\s+/g, ' '); // Normalize spaces
    
    return formatted;
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'now': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200';
      case 'today': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200';
      case 'weekend': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200';
      case 'week': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Zap className="h-5 w-5 text-orange-500" />
            Live Deals Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-40 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quickDeals || quickDeals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Zap className="h-5 w-5 text-orange-500" />
            Live Deals Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Zap className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-900 dark:text-white">No active deals right now</p>
            <p className="text-sm">Check back soon for flash deals from local businesses!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Zap className="h-5 w-5 text-orange-500" />
          Live Deals Near You
          <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {quickDeals.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickDeals.slice(0, displayLimit).map((deal: QuickDeal) => (
            <Card
              key={deal.id}
              className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 border-orange-200 dark:border-orange-700"
              onClick={() => setLocation(`/business/${deal.businessId}`)}
              data-testid={`discovery-deal-${deal.id}`}
            >
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{deal.title}</h3>
                    <Badge className={`text-xs ${getAvailabilityColor(deal.availability)}`}>
                      {getDealTypeIcon(deal.dealType)}
                      {formatDiscountAmount(deal.discountAmount)}
                    </Badge>
                  </div>
                  
                  {/* Countdown Timer - Most Prominent */}
                  <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-orange-200 dark:border-orange-700">
                    <CountdownTimer validUntil={deal.validUntil.toString()} />
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{deal.description}</p>
                </div>

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{deal.location}</span>
                  </div>
                  
                  {(deal as any).streetAddress && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{(deal as any).streetAddress}</span>
                    </div>
                  )}

                  {deal.category && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{deal.category}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-orange-200 dark:border-orange-700">
                  <Button 
                    size="sm" 
                    className="w-full h-6 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/business/${deal.businessId}`);
                    }}
                  >
                    Get Deal Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More / Load Less buttons */}
        {quickDeals.length > 6 && (
          <div className="text-center py-4 space-x-3">
            {displayLimit < quickDeals.length && (
              <Button 
                variant="outline" 
                className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-white dark:border-orange-600"
                onClick={() => setDisplayLimit(Math.min(displayLimit + 3, quickDeals.length))}
              >
                Load More ({Math.min(3, quickDeals.length - displayLimit)} more deals)
              </Button>
            )}
            {displayLimit > 6 && (
              <Button
                variant="outline"
                onClick={() => setDisplayLimit(6)}
                className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-500"
              >
                Show Less
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickDealsDiscovery;