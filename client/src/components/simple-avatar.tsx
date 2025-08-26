import { useState, useEffect } from "react";

interface SimpleAvatarProps {
  user: {
    id: number;
    username: string;
    profileImage?: string | null;
    avatarColor?: string | null; // User's chosen avatar color preference
    avatarGradient?: string | null; // User's gradient preference
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean; // Whether the avatar should be clickable
  onClick?: () => void; // Custom click handler
}

export function SimpleAvatar({ user, size = 'md', className = '', clickable = true, onClick }: SimpleAvatarProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base', 
    lg: 'w-12 h-12 text-lg',
    xl: 'w-full h-full text-xl'
  };

  // Generate colorful avatar based on username and user preferences
  const generateAvatar = (username: string | null | undefined, userColor?: string | null) => {
    console.log('🎯 generateAvatar called with:', username, 'userColor:', userColor);
    if (!username || typeof username !== 'string' || username.length === 0) {
      console.log('🎯 generateAvatar: Using fallback for invalid username');
      return `https://ui-avatars.com/api/?name=U&background=06b6d4&color=fff&size=150`;
    }
    
    const firstLetter = username.charAt(0).toUpperCase();
    let backgroundColor = '06b6d4'; // Default cyan
    
    // Use user's custom color if available
    if (userColor && userColor.startsWith('#')) {
      backgroundColor = userColor.slice(1); // Remove # prefix for ui-avatars API
      console.log('🎯 Using user custom color:', backgroundColor);
    } else {
      // Enhanced gradient color system based on username characteristics
      const gradientColors = [
        '3b82f6', // blue
        'ef4444', // red  
        '10b981', // green
        'f59e0b', // orange
        '8b5cf6', // purple
        'ec4899', // pink
        '06b6d4', // cyan
        '84cc16', // lime
        'f97316', // amber
        'e11d48', // rose
        '7c3aed', // violet
        '059669'  // emerald
      ];
      
      // Create a more sophisticated color selection based on username
      const charCodes = username.split('').map(char => char.charCodeAt(0));
      const colorSeed = charCodes.reduce((acc, code) => acc + code, 0);
      const colorIndex = colorSeed % gradientColors.length;
      backgroundColor = gradientColors[colorIndex];
      console.log('🎯 Generated color from username:', backgroundColor, 'seed:', colorSeed);
    }
    
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=${backgroundColor}&color=fff&size=150`;
  };

  // Update image when user changes or force refresh - STABLE VERSION
  useEffect(() => {
    if (!user) {
      setCurrentImage(null);
      return;
    }

    // Stable image assignment without excessive logging to prevent blinking
    if (user.profileImage && user.profileImage.trim() !== '' && user.profileImage.length > 10) {
      // Use profile image without cache busting to prevent constant reloads
      setCurrentImage(user.profileImage);
    } else {
      // Generate stable avatar without timestamp changes
      const generatedAvatar = generateAvatar(user.username, user.avatarColor);
      setCurrentImage(generatedAvatar);
    }
  }, [user?.id, user?.username, user?.profileImage]);

  // Minimal refresh handling to prevent blinking
  useEffect(() => {
    const handleRefresh = (event: any) => {
      // Only refresh for actual profile photo updates
      if (event.type === 'profilePhotoUpdated' && event.detail?.userId === user?.id) {
        setForceRefresh(prev => prev + 1);
      }
    };

    window.addEventListener('profilePhotoUpdated', handleRefresh);
    
    return () => {
      window.removeEventListener('profilePhotoUpdated', handleRefresh);
    };
  }, [user?.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable && user?.id) {
      window.location.href = `/profile/${user.id}`;
    }
  };

  const cursorClass = clickable ? 'cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all' : '';

  if (!user || !currentImage) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} ${cursorClass} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center relative group`}
        onClick={handleClick}
        title={clickable ? `View ${user?.username || 'User'}'s profile` : 'Complete your profile!'}
      >
        <span className="text-white font-bold">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
        {/* Tooltip for profile completion reminder */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {clickable ? `View ${user?.username || 'User'}'s profile` : 'Complete your profile!'}
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentImage}
      alt={`${user.username} avatar`}
      className={`${sizeClasses[size]} ${className} ${cursorClass} rounded-full object-cover`}
      loading="lazy"
      onClick={handleClick}
      title={clickable ? `View ${user.username}'s profile` : undefined}
      onError={() => {
        // Fallback to generated avatar if image fails
        const fallbackAvatar = generateAvatar(user.username, user.avatarColor);
        setCurrentImage(fallbackAvatar);
      }}
    />
  );
}