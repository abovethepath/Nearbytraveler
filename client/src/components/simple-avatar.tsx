import { useMemo } from "react";

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

  // Stable avatar generation with useMemo to prevent flickering
  const avatarData = useMemo(() => {
    if (!user?.username) {
      return { 
        letter: 'U', 
        bgColor: 'bg-blue-500',
        hasImage: false,
        imageUrl: null
      };
    }

    const firstLetter = user.username.charAt(0).toUpperCase();
    
    // Simple color based on username
    const colors = [
      'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500',
      'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-lime-500'
    ];
    const colorIndex = user.username.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    // Check if has valid profile image
    const hasImage = user.profileImage && 
                     user.profileImage.trim() !== '' && 
                     user.profileImage.length > 10;

    return {
      letter: firstLetter,
      bgColor,
      hasImage,
      imageUrl: hasImage ? user.profileImage : null
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

  // Show profile image if available
  if (avatarData.hasImage && avatarData.imageUrl) {
    return (
      <img
        src={avatarData.imageUrl}
        alt={`${user?.username} avatar`}
        className={`${baseClasses} object-cover`}
        onClick={handleClick}
        title={clickable ? `View ${user?.username}'s profile` : undefined}
        onError={(e) => {
          // Hide image on error and show fallback letter instead
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  // Fallback to letter avatar
  return (
    <div 
      className={`${baseClasses} ${avatarData.bgColor} text-white`}
      onClick={handleClick}
      title={clickable ? `View ${user?.username || 'User'}'s profile` : undefined}
    >
      <span className="font-bold">{avatarData.letter}</span>
    </div>
  );
}