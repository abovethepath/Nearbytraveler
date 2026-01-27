import { Card } from "@/components/ui/card";
import { SimpleAvatar } from "./simple-avatar";

export interface CompactUser {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  profileImage?: string;
  interests?: string[];
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
  isTravelerToCity?: boolean;
  avatarGradient?: string;
  userType?: string;
  businessName?: string;
}

interface CompactUserCardProps {
  user: CompactUser;
  searchLocation?: string;
  mutualConnections?: number;
  compatibilityScore?: number;
  sharedInterestsCount?: number;
}

export default function CompactUserCard({ 
  user, 
  searchLocation,
  mutualConnections = 0,
  compatibilityScore = 0,
  sharedInterestsCount = 0
}: CompactUserCardProps) {
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', `/profile/${user.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getUserGradient = () => {
    if (user.avatarGradient) return user.avatarGradient;
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
    return gradients[user.id % gradients.length];
  };

  const getStatusLine = () => {
    if (user.userType === 'business' && user.businessName) {
      return 'Nearby Business';
    }
    if (user.isTravelerToCity || user.isCurrentlyTraveling) {
      const destination = user.travelDestination?.split(',')[0] || '';
      return destination ? `Traveling to ${destination}` : 'Nearby Traveler';
    }
    return 'Nearby Local';
  };

  const getLocation = () => {
    if (user.hometownCity) {
      return user.hometownCity.split(',')[0];
    }
    return '';
  };

  const displayName = user.userType === 'business' && user.businessName 
    ? user.businessName 
    : user.name || user.username;

  // Truncate bio to ~40 chars
  const shortBio = user.bio ? (user.bio.length > 40 ? user.bio.substring(0, 40) + '...' : user.bio) : '';

  return (
    <Card 
      className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Cover/header gradient */}
      <div 
        className="h-10 relative"
        style={{ background: getUserGradient() }}
      />
      
      {/* Content */}
      <div className="px-2 pb-2 -mt-6 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-1">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 shadow-lg ring-2 ring-white dark:ring-gray-800">
            <SimpleAvatar 
              user={user} 
              size="md" 
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Name */}
        <h3 className="font-bold text-xs text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </h3>
        
        {/* Status: Nearby Local / Traveling to X */}
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
          {getStatusLine()} {getLocation() && `• ${getLocation()}`}
        </p>
        
        {/* Short bio */}
        {shortBio && (
          <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5 italic">
            {shortBio}
          </p>
        )}
        
        {/* Compatibility & Mutual connections */}
        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
          {compatibilityScore > 0 && (
            <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
              {Math.round(compatibilityScore * 100)}% match
            </span>
          )}
          {sharedInterestsCount > 0 && (
            <span className="text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
              {sharedInterestsCount} in common
            </span>
          )}
          {mutualConnections > 0 && (
            <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
              {mutualConnections} mutual
            </span>
          )}
        </div>
        
        {/* Connect button */}
        <button 
          className="w-full mt-1.5 py-1 px-2 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick(e);
          }}
        >
          Connect
        </button>
      </div>
    </Card>
  );
}
