import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MessageWithMeta, MessageReaction } from '@/types/messaging';

interface MessageBubbleProps {
  message: MessageWithMeta;
  isSender: boolean;
  showAvatar?: boolean;
  onAvatarClick?: () => void;
  onReact?: (messageId: number | string, reactionType: MessageReaction['type']) => void;
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
        <button
          type="button"
          className="cursor-pointer flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[hsl(var(--msg-focus-ring))]"
          onClick={onAvatarClick}
          aria-label={`View ${message.senderName || 'user'} profile`}
          data-testid={`avatar-${message.senderId}`}
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={message.senderAvatar} alt={message.senderName || 'User'} />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {message.senderName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </button>
      )}

      {/* Spacer when avatar is hidden but not sender */}
      {!isSender && !showAvatar && <div className="w-12 flex-shrink-0" />}

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
            className="text-xs mt-1 text-[hsl(var(--msg-timestamp))]"
            data-testid={`text-timestamp-${message.id}`}
          >
            {timestamp}
          </p>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 ml-2">
            {message.reactions.map((reaction, index) => {
              const reactionLabels = {
                heart: 'Like',
                thumbsup: 'Thumbs up',
                thumbsdown: 'Thumbs down'
              };
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onReact?.(message.id, reaction.type)}
                  aria-label={`${reactionLabels[reaction.type]} this message (${reaction.count})`}
                  className="flex items-center gap-1 px-3 py-2 min-h-[48px] rounded-full bg-[hsl(var(--msg-reaction-bg))] hover:bg-[hsl(var(--msg-hover-bg))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--msg-focus-ring))]"
                  data-testid={`button-reaction-${reaction.type}-${message.id}`}
                >
                  {reaction.type === 'heart' && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
                  {reaction.type === 'thumbsup' && <ThumbsUp className="w-4 h-4 fill-green-500 text-green-500" />}
                  {reaction.type === 'thumbsdown' && <ThumbsDown className="w-4 h-4 fill-orange-500 text-orange-500" />}
                  <span className="text-sm text-[hsl(var(--msg-reaction-text))]">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
