import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageHeaderProps {
  avatar?: string;
  name: string;
  location?: string;
  status?: string; // e.g., "typing...", "online"
  showFlirtButton?: boolean;
  onBack?: () => void;
  onAvatarClick?: () => void;
}

export function MessageHeader({ 
  avatar, 
  name, 
  location, 
  status, 
  showFlirtButton = false, 
  onBack, 
  onAvatarClick 
}: MessageHeaderProps) {
  return (
    <div className="bg-[hsl(var(--msg-header-bg))] border-b border-[hsl(var(--msg-input-border))] px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Go back to conversations"
              className="hover:bg-[hsl(var(--msg-hover-bg))] min-h-[48px]"
              data-testid="button-back-message"
            >
              <ArrowLeft className="w-5 h-5 text-[hsl(var(--msg-timestamp))]" />
            </Button>
          )}

          {/* Center: Profile pic and name */}
          <button
            type="button"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--msg-focus-ring))] rounded-lg px-2 py-1"
            onClick={onAvatarClick}
            aria-label={`View ${name} profile`}
            data-testid="header-user-info"
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 
                className="font-semibold text-[hsl(var(--foreground))] text-base"
                data-testid="text-chat-name"
              >
                {name}
              </h2>
              {(location || status) && (
                <p className="text-xs text-[hsl(var(--msg-timestamp))]">
                  {status || location}
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Right: Flirt button (optional) */}
        {showFlirtButton && (
          <Button
            variant="ghost"
            size="sm"
            className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20"
            data-testid="button-flirt"
          >
            <Heart className="w-5 h-5" />
            <span className="ml-1 text-sm">flirt</span>
          </Button>
        )}
      </div>
    </div>
  );
}
