import { Card } from "@/components/ui/card";
import { SimpleAvatar } from "./simple-avatar";

export interface CompactUser {
  id: number;
  username: string;
  name?: string;
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
}

export default function CompactUserCard({ 
  user, 
  searchLocation,
  mutualConnections 
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

  const getSubtitle = () => {
    if (user.userType === 'business' && user.businessName) {
      return 'Nearby Business';
    }
    if (user.isTravelerToCity || user.isCurrentlyTraveling) {
      return 'Nearby Traveler';
    }
    return 'Nearby Local';
  };

  const getLocation = () => {
    if (user.isTravelerToCity && user.travelDestination) {
      return user.travelDestination.split(',')[0];
    }
    if (user.hometownCity) {
      return user.hometownCity.split(',')[0];
    }
    return '';
  };

  const displayName = user.userType === 'business' && user.businessName 
    ? user.businessName 
    : user.name || user.username;

  return (
    <Card 
      className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* LinkedIn-style cover/header - shorter */}
      <div 
        className="h-12 relative flex-shrink-0"
        style={{ background: getUserGradient() }}
      />
      
      {/* Content - centered layout like LinkedIn */}
      <div className="px-3 pb-3 -mt-8 text-center flex flex-col flex-grow">
        {/* Avatar - larger, with white ring like LinkedIn */}
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg ring-2 ring-white dark:ring-gray-800">
            <SimpleAvatar 
              user={user} 
              size="lg" 
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Name - bold like LinkedIn */}
        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </h3>
        
        {/* Subtitle - role/location like LinkedIn */}
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight mt-0.5 min-h-[2rem]">
          {getSubtitle()} • {getLocation()}
        </p>
        
        {/* Mutual connections - LinkedIn style */}
        {mutualConnections && mutualConnections > 0 ? (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {mutualConnections} mutual
            </span>
          </div>
        ) : (
          <div className="h-6 mt-2" />
        )}
        
        {/* Spacer */}
        <div className="flex-grow" />
        
        {/* Connect button - LinkedIn blue outlined style */}
        <button 
          className="w-full mt-2 py-2 px-3 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
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
