import React, { useState, useEffect } from 'react';
import { SimpleAvatar } from '@/components/simple-avatar';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import websocketService from '@/services/websocketService';
import { openFloatingChat } from './FloatingChatManager';

interface IMNotificationProps {
  message: any;
  sender: any;
  onClose: () => void;
  onOpenChat: () => void;
}

function IMNotification({ message, sender, onClose, onOpenChat }: IMNotificationProps) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 p-4 animate-in slide-in-from-right">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <SimpleAvatar user={sender} size="sm" />
          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              @{sender.username}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">New message</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
        {message.content}
      </p>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onOpenChat}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Reply
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="px-3"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export default function IMNotificationManager() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleInstantMessage = (data: any) => {
      console.log('📨 IM Notification received:', data);
      
      // Show notification popup
      const notification = {
        id: Date.now() + Math.random(),
        message: data.message,
        sender: data.sender || { username: 'Unknown User', id: data.message.senderId }
      };
      
      setNotifications(prev => [...prev, notification]);
    };

    websocketService.on('instant_message_received', handleInstantMessage);

    return () => {
      websocketService.off('instant_message_received', handleInstantMessage);
    };
  }, []);

  const removeNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleOpenChat = (notification: any) => {
    openFloatingChat(notification.sender);
    removeNotification(notification.id);
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${1 + (index * 6)}rem`,
            right: '1rem',
            zIndex: 50,
          }}
        >
          <IMNotification
            message={notification.message}
            sender={notification.sender}
            onClose={() => removeNotification(notification.id)}
            onOpenChat={() => handleOpenChat(notification)}
          />
        </div>
      ))}
    </>
  );
}