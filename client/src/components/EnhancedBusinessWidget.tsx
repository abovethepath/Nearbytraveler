import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Globe, Star, Clock, Briefcase, ExternalLink, MessageCircle, Share2 } from "lucide-react";

interface EnhancedBusinessWidgetProps {
  businesses: any[];
  currentUserLocation?: string;
  title?: string;
  showViewAll?: boolean;
  onBusinessClick?: (business: any) => void;
  onViewAll?: () => void;
}

export function EnhancedBusinessWidget({ 
  businesses, 
  currentUserLocation, 
  title = "Local Businesses",
  showViewAll = true,
  onBusinessClick,
  onViewAll 
}: EnhancedBusinessWidgetProps) {

  // Sort businesses by location proximity (same city first, then by distance if available)
  const sortedBusinesses = React.useMemo(() => {
    if (!businesses) return [];
    
    return [...businesses].sort((a, b) => {
      // If we have current user location, prioritize same city
      if (currentUserLocation) {
        const currentCity = currentUserLocation.toLowerCase();
        const aInCurrentCity = a.city?.toLowerCase().includes(currentCity.toLowerCase());
        const bInCurrentCity = b.city?.toLowerCase().includes(currentCity.toLowerCase());
        
        if (aInCurrentCity && !bInCurrentCity) return -1;
        if (!aInCurrentCity && bInCurrentCity) return 1;
      }
      
      // Then sort by distance if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Finally by rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [businesses, currentUserLocation]);

  const formatAddress = (business: any) => {
    if (business.address) return business.address;
    
    const parts = [];
    if (business.city) parts.push(business.city);
    if (business.state) parts.push(business.state);
    if (business.country) parts.push(business.country);
    
    return parts.join(', ') || 'Address not available';
  };

  const formatDistance = (distance: number) => {
    if (distance === undefined) return null;
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const getPriceLevelDisplay = (level: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  const BusinessCard = ({ business }: { business: any }) => (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start space-x-3 mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-600">
            <AvatarImage src={business.profileImage} alt={`${business.businessName} logo`} />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-bold">
              {business.businessName?.[0]?.toUpperCase() || 'B'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {business.businessName}
                </h4>
                {business.businessType && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {business.businessType}
                  </p>
                )}
              </div>
              
              {/* Status Badge */}
              <Badge 
                variant={business.isOpen ? "default" : "secondary"}
                className={`text-xs ml-2 ${
                  business.isOpen 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {business.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Business Description */}
        {business.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {business.description}
          </p>
        )}

        {/* Address */}
        <div className="flex items-start space-x-2 mb-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-words">{formatAddress(business)}</span>
        </div>

        {/* Phone Number */}
        {business.phoneNumber && (
          <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600 dark:text-gray-300">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <a 
              href={`tel:${business.phoneNumber}`} 
              className="hover:text-blue-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {business.phoneNumber}
            </a>
          </div>
        )}

        {/* Website */}
        {business.website && (
          <div className="flex items-center space-x-2 mb-3 text-sm text-blue-600 dark:text-blue-400">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <a 
              href={business.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
            </a>
          </div>
        )}

        {/* Rating, Distance, Price Level */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Rating */}
            {business.rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {business.rating.toFixed(1)}
                </span>
                {business.reviewCount && (
                  <span className="text-xs text-gray-500">
                    ({business.reviewCount})
                  </span>
                )}
              </div>
            )}

            {/* Price Level */}
            {business.priceLevel && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {getPriceLevelDisplay(business.priceLevel)}
              </span>
            )}
          </div>

          {/* Distance */}
          {business.distance !== undefined && (
            <span className="text-xs text-gray-500">
              {formatDistance(business.distance)}
            </span>
          )}
        </div>

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {business.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {business.tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{business.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Opening Hours */}
        {business.openingHours && (
          <div className="flex items-center space-x-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{business.openingHours}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBusinessClick?.(business);
            }}
            className="flex-1 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Details
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              // Handle contact action
            }}
            className="text-xs"
          >
            <MessageCircle className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              // Handle share action
            }}
            className="text-xs"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>{title}</span>
            {currentUserLocation && (
              <Badge variant="secondary" className="text-xs">
                Near {currentUserLocation}
              </Badge>
            )}
          </CardTitle>
          {showViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedBusinesses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No businesses found in your area</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBusinesses.slice(0, 6).map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}