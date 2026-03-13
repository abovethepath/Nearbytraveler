import { useState, useEffect } from "react";
import websocketService from "@/services/websocketService";

interface TypingIndicatorProps {
  conversationUserId: number;
  displayName?: string;
}

export default function TypingIndicator({ conversationUserId, displayName }: TypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(false);
  }, [conversationUserId]);

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const handleUserTyping = (data: { senderId: number; senderUsername: string; isTyping: boolean }) => {
      if (data.senderId !== conversationUserId) return;

      if (data.isTyping) {
        setIsTyping(true);
        if (clearTimer) clearTimeout(clearTimer);
        clearTimer = setTimeout(() => setIsTyping(false), 5000);
      } else {
        if (clearTimer) clearTimeout(clearTimer);
        setIsTyping(false);
      }
    };

    websocketService.on('user_typing', handleUserTyping);
    return () => {
      websocketService.off('user_typing', handleUserTyping);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [conversationUserId]);

  if (!isTyping) return null;

  const name = displayName || 'Someone';

  return (
    <div className="px-4 py-1.5 flex items-center gap-2">
      <div className="flex gap-1 items-center">
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 italic">{name} is typing…</span>
    </div>
  );
}
