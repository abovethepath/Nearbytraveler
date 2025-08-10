import React, { useState, useEffect } from 'react';
import { FloatingChatBox } from './FloatingChatBox';

interface ChatBoxState {
  id: number;
  user: any;
  isMinimized: boolean;
}

export function FloatingChatManager() {
  const [openChats, setOpenChats] = useState<ChatBoxState[]>([]);

  // Listen for requests to open new chat boxes
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { user } = event.detail;
      
      // Check if chat is already open
      if (openChats.find(chat => chat.user.id === user.id)) {
        // If minimized, restore it
        setOpenChats(prev => prev.map(chat => 
          chat.user.id === user.id 
            ? { ...chat, isMinimized: false }
            : chat
        ));
        return;
      }

      // Add new chat (max 3 open chats)
      setOpenChats(prev => {
        const newChat = {
          id: Date.now(),
          user,
          isMinimized: false
        };
        
        // Keep only last 3 chats
        const updatedChats = [...prev, newChat];
        return updatedChats.slice(-3);
      });
    };

    window.addEventListener('openFloatingChat', handleOpenChat as EventListener);
    
    return () => {
      window.removeEventListener('openFloatingChat', handleOpenChat as EventListener);
    };
  }, [openChats]);

  const handleCloseChat = (chatId: number) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const handleMinimizeChat = (chatId: number) => {
    setOpenChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isMinimized: !chat.isMinimized }
        : chat
    ));
  };

  return (
    <>
      {openChats.map((chat, index) => (
        <div
          key={chat.id}
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: `${1 + (index * 21)}rem`, // Stack horizontally
            zIndex: 50,
          }}
        >
          <FloatingChatBox
            targetUser={chat.user}
            onClose={() => handleCloseChat(chat.id)}
            onMinimize={() => handleMinimizeChat(chat.id)}
            isMinimized={chat.isMinimized}
          />
        </div>
      ))}
    </>
  );
}

// Helper function to open a floating chat from anywhere in the app
export function openFloatingChat(user: any) {
  const event = new CustomEvent('openFloatingChat', {
    detail: { user }
  });
  window.dispatchEvent(event);
}