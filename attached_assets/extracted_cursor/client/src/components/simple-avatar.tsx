import { useState, useEffect } from "react";

interface SimpleAvatarProps {
  user: {
    id: number;
    username: string;
    profileImage?: string | null;
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

  // Generate colorful avatar based on username
  const generateAvatar = (username: string | null | undefined) => {
    console.log('🎯 generateAvatar called with:', username, 'type:', typeof username);
    if (!username || typeof username !== 'string' || username.length === 0) {
      console.log('🎯 generateAvatar: Using fallback for invalid username');
      return `https://ui-avatars.com/api/?name=U&background=06b6d4&color=fff&size=150`;
    }
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = [
      '3b82f6', // blue
      'ef4444', // red  
      '10b981', // green
      'f59e0b', // orange
      '8b5cf6', // purple
      'ec4899', // pink
      '06b6d4', // cyan
      '84cc16'  // lime
    ];
    
    // Use username length to pick color consistently
    const colorIndex = username.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
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
      forceRefreshCount: forceRefresh
    });

    // Force immediate image refresh - bypass browser cache by adding timestamp
    if (user.profileImage) {
      console.log('SimpleAvatar: Using profile image with cache bypass');
      // Add timestamp to bypass browser cache for immediate refresh
      const imageWithCacheBust = user.profileImage.includes('?') 
        ? `${user.profileImage}&t=${Date.now()}` 
        : `${user.profileImage}?t=${Date.now()}`;
      setCurrentImage(imageWithCacheBust);
    } else {
      const generatedAvatar = generateAvatar(user.username);
      console.log('SimpleAvatar: Generated avatar:', generatedAvatar);
      setCurrentImage(generatedAvatar);
    }
  }, [user?.id, user?.username, user?.profileImage, forceRefresh]);

  // Listen for avatar refresh events with multiple event types
  useEffect(() => {
    const handleRefresh = (event: any) => {
      console.log('🎯 SimpleAvatar: Refresh event received:', event.type, 'Force refresh:', forceRefresh);
      setForceRefresh(prev => {
        const newValue = prev + 1;
        console.log('🎯 SimpleAvatar: Force refresh updated from', prev, 'to', newValue);
        return newValue;
      });
    };

    // Listen to multiple refresh events
    window.addEventListener('avatarRefresh', handleRefresh);
    window.addEventListener('userDataUpdated', handleRefresh);
    window.addEventListener('profilePhotoUpdated', handleRefresh);
    window.addEventListener('refreshNavbar', handleRefresh);
    window.addEventListener('forceNavbarRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('avatarRefresh', handleRefresh);
      window.removeEventListener('userDataUpdated', handleRefresh);
      window.removeEventListener('profilePhotoUpdated', handleRefresh);
      window.removeEventListener('refreshNavbar', handleRefresh);
      window.removeEventListener('forceNavbarRefresh', handleRefresh);
    };
  }, [forceRefresh]);

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
      onError={() => {
        // Fallback to generated avatar if image fails
        setCurrentImage(generateAvatar(user.username));
      }}
    />
  );
}