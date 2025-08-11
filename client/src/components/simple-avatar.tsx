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
}

export function SimpleAvatar({ user, size = 'md', className = '' }: SimpleAvatarProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base', 
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
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

  // Update image when user changes or force refresh
  useEffect(() => {
    if (!user) {
      console.log('SimpleAvatar: No user provided');
      setCurrentImage(null);
      return;
    }

    console.log('🖼️ SimpleAvatar: User data updated:', { 
      id: user.id, 
      username: user.username, 
      usernameType: typeof user.username,
      profileImage: user.profileImage ? `HAS IMAGE (${user.profileImage.substring(0, 50)}...)` : 'NO IMAGE',
      forceRefreshCount: forceRefresh,
      profileImageLength: user.profileImage ? user.profileImage.length : 0
    });

    // Force immediate image refresh - check for profile image
    if (user.profileImage && user.profileImage.trim() !== '') {
      console.log('SimpleAvatar: Using profile image');
      setCurrentImage(user.profileImage);
    } else {
      console.log('SimpleAvatar: No profile image found, generating avatar for:', user.username);
      const generatedAvatar = generateAvatar(user.username, user.avatarColor);
      console.log('SimpleAvatar: Generated avatar:', generatedAvatar);
      setCurrentImage(generatedAvatar);
    }
  }, [user?.id, user?.username, user?.profileImage, forceRefresh]);

  // Listen for avatar refresh events with throttling to prevent excessive reloads
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    
    const handleRefresh = (event: any) => {
      console.log('🎯 SimpleAvatar: Refresh event received:', event.type);
      
      // Only refresh for critical profile-related events, throttle others
      if (event.type === 'profilePhotoUpdated' || event.type === 'avatarRefresh') {
        console.log('🎯 SimpleAvatar: Critical refresh event - updating immediately');
        setForceRefresh(prev => prev + 1);
      } else {
        // Throttle other refresh events to prevent excessive reloading
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        refreshTimeout = setTimeout(() => {
          console.log('🎯 SimpleAvatar: Throttled refresh event processed');
          setForceRefresh(prev => prev + 1);
          refreshTimeout = null;
        }, 2000); // 2 second throttle
      }
    };

    // Only listen to essential refresh events 
    window.addEventListener('avatarRefresh', handleRefresh);
    window.addEventListener('profilePhotoUpdated', handleRefresh);
    
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      window.removeEventListener('avatarRefresh', handleRefresh);
      window.removeEventListener('profilePhotoUpdated', handleRefresh);
    };
  }, []);

  if (!user || !currentImage) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-300 rounded-full flex items-center justify-center`}>
        <span className="text-gray-600">?</span>
      </div>
    );
  }

  return (
    <img
      src={currentImage}
      alt={`${user.username} avatar`}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      loading="lazy"
      onError={() => {
        // Fallback to generated avatar if image fails
        setCurrentImage(generateAvatar(user.username, user.avatarColor));
      }}
    />
  );
}