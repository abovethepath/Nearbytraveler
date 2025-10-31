import { useMemo } from "react";
import { User } from "lucide-react";

interface SimpleAvatarProps {
  user: {
    id: number;
    username: string;
    profileImage?: string | null;
    avatarColor?: string | null;
    avatarGradient?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export function SimpleAvatar({ user, size = 'md', className = '', clickable = true, onClick }: SimpleAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base', 
    lg: 'w-12 h-12 text-lg',
    xl: 'w-full h-full text-xl'
  };

  // Icon sizes for different avatar sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-24 h-24'
  };

  // Stable avatar generation with useMemo to prevent flickering
  const avatarData = useMemo(() => {
    if (!user?.username) {
      return { 
        letter: 'U', 
        gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
        hasImage: false,
        imageUrl: null
      };
    }

    const firstLetter = user.username.charAt(0).toUpperCase();
    
    // Nice gradients based on username
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-pink-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-purple-500 to-indigo-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600',
      'bg-gradient-to-br from-lime-500 to-green-600'
    ];
    const gradientIndex = user.username.charCodeAt(0) % gradients.length;
    const gradient = gradients[gradientIndex];

    // More robust image validation - check for data URLs or http URLs
    const hasValidImage = user.profileImage && 
                         user.profileImage.trim() !== '' && 
                         (user.profileImage.startsWith('data:image/') || 
                          user.profileImage.startsWith('http'));

    return {
      letter: firstLetter,
      gradient,
      hasImage: hasValidImage,
      imageUrl: hasValidImage ? user.profileImage : null
    };
  }, [user?.id, user?.username, user?.profileImage]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable && user?.id) {
      window.location.href = `/profile/${user.id}`;
    }
  };

  const cursorClass = clickable ? 'cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all' : '';
  const baseClasses = `${sizeClasses[size]} ${className} ${cursorClass} rounded-full flex items-center justify-center relative`;

  // Always render both image and letter fallback, but show only one
  return (
    <div className="relative">
      {/* Profile image - show if available */}
      {avatarData.hasImage && avatarData.imageUrl && (
        <img
          src={avatarData.imageUrl}
          alt={`${user?.username} avatar`}
          className={`${baseClasses} object-cover`}
          onClick={handleClick}
          onError={(e) => {
            // Hide image on error to show letter fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      
      {/* Letter fallback with gradient and icon - show if no image or image failed to load */}
      <div 
        className={`${baseClasses} ${avatarData.gradient} text-white ${avatarData.hasImage ? 'absolute inset-0' : ''} flex-col`}
        onClick={handleClick}
        style={{ display: avatarData.hasImage ? 'none' : 'flex' }}
      >
        <User className={`${iconSizes[size]} opacity-90`} />
        <span className="font-bold text-xs opacity-75 mt-0.5">{avatarData.letter}</span>
      </div>
    </div>
  );
}