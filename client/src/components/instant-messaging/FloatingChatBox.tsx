import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleAvatar } from '@/components/simple-avatar';
import { X, Minus, MessageCircle, Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import websocketService from '@/services/websocketService';
import { authStorage } from '@/lib/auth';

interface FloatingChatBoxProps {
  targetUser: any;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export function FloatingChatBox({ targetUser, onClose, onMinimize, isMinimized }: FloatingChatBoxProps) {
  const [newMessage, setNewMessage] = useState('');
  const [instantMessages, setInstantMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = authStorage.getUser();

  // Prevent self-messaging
  if (user?.id === targetUser.id) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 bg-orange-600 text-white rounded-t-lg">
          <h3 className="font-semibold text-sm">Cannot Message Yourself</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-orange-700 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-3">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            You cannot send messages to yourself. Try messaging other users instead!
          </p>
        </div>
      </div>
    );
  }

  // Fetch messages between current user and target user
  const { data: messages = [] } = useQuery({
    queryKey: [`/api/messages/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 3000, // Refresh every 3 seconds for new messages
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      return apiRequest('POST', `/api/messages/${user?.id}/mark-read`, { senderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}/unread-count`] });
    },
  });

  // Filter messages for this specific conversation
  const conversationMessages = React.useMemo(() => {
    const dbMessages = (messages as any[]).filter((msg: any) => 
      (msg.senderId === user?.id && msg.receiverId === targetUser.id) ||
      (msg.senderId === targetUser.id && msg.receiverId === user?.id)
    );
    
    // Combine with instant messages
    const allMessages = [...dbMessages, ...instantMessages];
    return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, instantMessages, user?.id, targetUser.id]);

  // Mark messages from target user as read when chat opens
  useEffect(() => {
    if (user?.id && targetUser.id && conversationMessages.length > 0) {
      // Check if there are unread messages from target user
      const unreadFromTarget = conversationMessages.some((msg: any) => 
        msg.senderId === targetUser.id && !msg.isRead
      );
      
      if (unreadFromTarget) {
        markAsReadMutation.mutate(targetUser.id);
      }
    }
  }, [user?.id, targetUser.id, conversationMessages.length]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
      setNewMessage('');
    },
  });

  // Handle instant messaging
  useEffect(() => {
    if (!user?.id) return;

    const handleInstantMessage = (data: any) => {
      // Only add to this chat if it's between current user and target user
      if ((data.message.senderId === targetUser.id && data.message.receiverId === user?.id) ||
          (data.message.senderId === user?.id && data.message.receiverId === targetUser.id)) {
        setInstantMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          senderId: data.message.senderId,
          receiverId: data.message.receiverId,
          content: data.message.content,
          createdAt: data.message.timestamp || new Date().toISOString(),
          messageType: 'instant'
        }]);
      }
    };

    const handleTypingIndicator = (data: any) => {
      if (data.userId === targetUser.id) {
        setIsTyping(data.isTyping);
      }
    };

    websocketService.on('instant_message_received', handleInstantMessage);
    websocketService.on('typing_indicator', handleTypingIndicator);

    return () => {
      websocketService.off('instant_message_received', handleInstantMessage);
      websocketService.off('typing_indicator', handleTypingIndicator);
    };
  }, [user?.id, targetUser.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user?.id) return;

    const messageContent = newMessage.trim();
    
    // Clear the input immediately
    setNewMessage('');

    // Mark any unread messages from target user as read (since user is responding)
    markAsReadMutation.mutate(targetUser.id);

    // Send via WebSocket for instant delivery
    websocketService.sendInstantMessage(targetUser.id, messageContent);

    // Also save to database
    sendMessageMutation.mutate({
      receiverId: targetUser.id,
      content: messageContent,
    });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (value.length > 0) {
      websocketService.sendTypingIndicator(targetUser.id, true);
    } else {
      websocketService.sendTypingIndicator(targetUser.id, false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <SimpleAvatar user={targetUser} size="sm" />
            <span className="hidden sm:block">{targetUser.username}</span>
            <MessageCircle className="w-4 h-4" />
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <SimpleAvatar user={targetUser} size="sm" />
          <div>
            <h3 className="font-semibold text-sm">{targetUser.username}</h3>
            {isTyping && <p className="text-xs text-blue-200">typing...</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="text-white hover:bg-blue-700 p-1"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            Start your conversation with {targetUser.username}!
          </div>
        ) : (
          conversationMessages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-2 rounded-lg text-sm ${
                  msg.senderId === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}