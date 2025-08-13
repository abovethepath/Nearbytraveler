import { useState, useEffect } from "react";
import websocketService from "@/services/websocketService";

interface TypingIndicatorProps {
  conversationUserId: number;
}

export default function TypingIndicator({ conversationUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleUserTyping = (data: { senderId: number; senderUsername: string; isTyping: boolean }) => {
      // Only show typing indicator for the current conversation
      if (data.senderId === conversationUserId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.senderUsername);
          } else {
            newSet.delete(data.senderUsername);
          }
          return newSet;
        });
      }
    };

    websocketService.on('user_typing', handleUserTyping);

    return () => {
      websocketService.off('user_typing', handleUserTyping);
    };
  }, [conversationUserId]);

  if (typingUsers.size === 0) return null;

  const typingUsersList = Array.from(typingUsers);

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        <span>
          {typingUsersList.length === 1 
            ? `@${typingUsersList[0]} is typing...`
            : `${typingUsersList.map(u => `@${u}`).join(', ')} are typing...`
          }
        </span>
      </div>
    </div>
  );
}