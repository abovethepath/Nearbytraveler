import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';
import { MessageWithMeta } from '@/types/messaging';

interface MessageBubbleProps {
  message: MessageWithMeta;
  isSender: boolean;
  showAvatar?: boolean;
  onAvatarClick?: () => void;
  onReact?: (messageId: number | string, reactionType: string) => void;
}

export function MessageBubble({ message, isSender, showAvatar = true, onAvatarClick, onReact }: MessageBubbleProps) {
  const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  return (
    <div 
      className={`flex gap-2 mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-bubble-${message.id}`}
    >
      {/* Recipient avatar (left side) */}
      {!isSender && showAvatar && (
        <div 
          className="cursor-pointer flex-shrink-0"
          onClick={onAvatarClick}
          data-testid={`avatar-${message.senderId}`}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={message.senderAvatar} alt={message.senderName || 'User'} />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {message.senderName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Spacer when avatar is hidden but not sender */}
      {!isSender && !showAvatar && <div className="w-10 flex-shrink-0" />}

      {/* Message bubble */}
      <div className="flex flex-col max-w-[75%] sm:max-w-[60%]">
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isSender
              ? 'bg-[hsl(var(--msg-bubble-self))] text-[hsl(var(--msg-text-self))] rounded-tr-sm'
              : 'bg-[hsl(var(--msg-bubble-other))] text-[hsl(var(--msg-text-other))] rounded-tl-sm'
          }`}
          data-testid={`message-content-${message.id}`}
        >
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
          
          {/* Timestamp */}
          <p 
            className={`text-xs mt-1 ${isSender ? 'text-white/70' : 'text-white/60'}`}
            data-testid={`text-timestamp-${message.id}`}
          >
            {timestamp}
          </p>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 ml-2">
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => onReact?.(message.id, reaction.type)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                data-testid={`button-reaction-${reaction.type}-${message.id}`}
              >
                {reaction.type === 'heart' && <Heart className="w-3 h-3 fill-red-500 text-red-500" />}
                <span className="text-xs text-gray-700 dark:text-gray-300">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
