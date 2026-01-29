import React from "react";
import { METRO_AREAS } from "@shared/constants";

export interface User {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  profileImage?: string;
  interests?: string[];
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
  travelStartDate?: string | Date;
  travelEndDate?: string | Date;
  isTravelerToCity?: boolean;
  avatarGradient?: string;
  avatarColor?: string;
  userType?: string;
  businessName?: string;
  businessType?: string;
  streetAddress?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  secretActivities?: string;
}

interface UserCardProps {
  user: User;
  searchLocation?: string;
  currentUserId?: number;
  isCurrentUser?: boolean;
  showCompatibilityScore?: boolean;
  compatibilityData?: any;
  compact?: boolean;
  connectionDegree?: {
    degree: number;
    mutualCount: number;
  };
}

export default function UserCard({ 
  user, 
  searchLocation, 
  currentUserId,
  isCurrentUser = false,
  showCompatibilityScore = false,
  compatibilityData,
  compact = false,
  connectionDegree
}: UserCardProps) {
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', `/profile/${user.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Get user's individual gradient for fallback
  const getUserGradient = () => {
    if (user.avatarGradient) {
      return user.avatarGradient;
    }
    const gradients = [
      'linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #F97316 100%)',
      'linear-gradient(135deg, #10B981 0%, #059669 50%, #F97316 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #F97316 100%)',
      'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #EF4444 100%)',
      'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #10B981 100%)',
      'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)',
      'linear-gradient(135deg, #14B8A6 0%, #3B82F6 50%, #A855F7 100%)',
      'linear-gradient(135deg, #EAB308 0%, #F97316 50%, #EF4444 100%)',
    ];
    const index = user.id % gradients.length;
    return gradients[index];
  };

  // Get travel status for badge
  const getTravelBadge = () => {
    if ((user as any).travelPlans && Array.isArray((user as any).travelPlans)) {
      const now = new Date();
      const currentTrip = (user as any).travelPlans.find((plan: any) => {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        return now >= start && now <= end;
      });
      if (currentTrip && currentTrip.destinationCity) {
        return { text: `In ${currentTrip.destinationCity}`, isTraveling: true };
      }
    }
    if (user.isCurrentlyTraveling && user.travelDestination) {
      const city = user.travelDestination.split(',')[0].trim();
      if (city && city.toLowerCase() !== 'null') {
        return { text: `In ${city}`, isTraveling: true };
      }
    }
    return null;
  };

  const travelBadge = getTravelBadge();

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Large Photo - 4:5 aspect ratio for portrait style */}
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: getUserGradient() }}>
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={user.username}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl md:text-6xl font-bold text-white/90">
              {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
            </span>
          </div>
        )}
        
        {/* Travel badge overlay */}
        {travelBadge && (
          <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <span>✈️</span> {travelBadge.text}
          </div>
        )}
        
        {/* Business badge */}
        {user.userType === 'business' && (
          <div className="absolute top-2 right-2 bg-orange-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Business
          </div>
        )}
        
        {/* Connection degree badge */}
        {connectionDegree && connectionDegree.degree > 0 && connectionDegree.degree <= 2 && (
          <div className="absolute bottom-2 right-2 bg-purple-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {connectionDegree.degree === 1 ? '1st' : '2nd'} • {connectionDegree.mutualCount} mutual
          </div>
        )}
      </div>
      
      {/* User Info - Compact below photo */}
      <div className="p-2 sm:p-3">
        {/* Username/Business Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
          {user.userType === 'business' && user.businessName 
            ? user.businessName 
            : `@${user.username}`}
        </h3>
        
        {/* Location line */}
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {user.userType === 'business' 
            ? (user.businessType || 'Local Business')
            : (user.hometownCity 
                ? `${user.hometownCity}${user.hometownState ? `, ${user.hometownState}` : ''}` 
                : 'Location not set')}
        </p>
        
        {/* Bio preview - only show if not compact */}
        {!compact && user.bio && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2">
            {user.bio.replace(/Born:\s*[^\n]*/gi, '').trim().slice(0, 80)}
            {user.bio.length > 80 ? '...' : ''}
          </p>
        )}
        
        {/* Interests preview */}
        {!compact && user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.interests.slice(0, 2).map((interest, idx) => (
              <span 
                key={idx}
                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 2 && (
              <span className="text-xs text-gray-400">
                +{user.interests.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
