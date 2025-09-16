import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import type { Message, User } from "@shared/schema";

interface MessagesWidgetProps {
  userId?: number;
}

function MessagesWidget({ userId }: MessagesWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!userId && messages.length > 0, // Only fetch users if we have messages
  });

  return (
    <Card 
      className="bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-blue-900/20 dark:via-gray-800 dark:to-orange-900/20 hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-600/30 hover:border-orange-300 dark:hover:border-orange-500/40"
    >
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Messages</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              setLocation("/requests");
            }}
          >
            View Connection Requests
          </Button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {/* Show loading state */}
          {(messagesLoading || (messages.length > 0 && usersLoading)) && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Loading messages...</p>
            </div>
          )}

          {/* Show error state */}
          {(messagesError || usersError) && (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error loading messages</p>
            </div>
          )}

          {/* Show messages when both queries are ready */}
          {!messagesLoading && !usersLoading && !messagesError && !usersError && (() => {
            // Group messages by conversation (other user)
            const conversationMap = new Map();
            messages
              .filter(message => message.senderId !== message.receiverId)
              .forEach(message => {
                const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
                if (!conversationMap.has(otherUserId) || 
                    new Date(message.createdAt || 0) > new Date(conversationMap.get(otherUserId).createdAt || 0)) {
                  conversationMap.set(otherUserId, message);
                }
              });

            // Get "Your Turn" conversations (where last message was from the other person)
            const yourTurnConversations = Array.from(conversationMap.values())
              .filter(message => message.senderId !== userId)
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            // Get other recent conversations  
            const otherConversations = Array.from(conversationMap.values())
              .filter(message => message.senderId === userId)
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            // Show "Your Turn" messages first, then other recent messages
            const displayMessages = [
              ...yourTurnConversations.slice(0, 2), // Up to 2 "Your Turn" messages
              ...otherConversations.slice(0, 3 - yourTurnConversations.slice(0, 2).length) // Fill remaining with other messages
            ];

            return displayMessages.map((message, index) => {
              const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
              // Improved user lookup with debug logging
              const otherUser = users.find(u => {
                // Handle both string and number IDs
                const matchesId = u.id === otherUserId || 
                                 u.id === String(otherUserId) || 
                                 String(u.id) === String(otherUserId);
                return matchesId;
              });
              
              const isFromMe = message.senderId === userId;
              const isYourTurn = !isFromMe;

              // Debug logging for troubleshooting
              if (!otherUser) {
                console.log('🚨 MessagesWidget: User lookup failed', {
                  otherUserId,
                  otherUserIdType: typeof otherUserId,
                  availableUsers: users.map(u => ({ id: u.id, idType: typeof u.id, username: u.username })),
                  message
                });
              }
            
              return (
                <div
                  key={message.id || index} 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate even if user object isn't found, using the user ID
                    const targetUserId = otherUser?.id || otherUserId;
                    if (targetUserId) {
                      setLocation(`/messages?user=${targetUserId}`);
                    }
                  }}
                  className={`cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30 rounded-xl p-4 transition-all duration-300 border-2 ${
                    isYourTurn 
                      ? 'border-orange-300 dark:border-orange-500/50 bg-gradient-to-r from-orange-50 via-white to-orange-50 dark:from-orange-900/20 dark:via-gray-800 dark:to-orange-900/20' 
                      : 'border-blue-100 dark:border-blue-700/50 bg-gradient-to-r from-white via-blue-50/30 to-orange-50/30 dark:from-gray-800/50 dark:via-blue-900/10 dark:to-orange-900/10'
                  } hover:border-orange-200 dark:hover:border-orange-600/50 hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      {isYourTurn && (
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">
                          YOUR TURN
                        </span>
                      )}
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {isFromMe ? 
                          `To: ${otherUser?.username || otherUser?.name || `User ${otherUserId}`}` : 
                          `From: ${otherUser?.username || otherUser?.name || `User ${otherUserId}`}`
                        }
                      </span>
                    </div>
                    {message.createdAt && (
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        {new Date(message.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">
                    {message.content && message.content.length > 100 
                      ? `${message.content.substring(0, 100)}...` 
                      : message.content}
                  </p>
                </div>
              );
            });
          })()}

          {/* Show no messages state when not loading and no messages exist */}
          {!messagesLoading && !usersLoading && !messagesError && !usersError && (() => {
            const conversationCount = new Set(
              messages
                .filter(message => message.senderId !== message.receiverId)
                .map(message => message.senderId === userId ? message.receiverId : message.senderId)
            ).size;
            return conversationCount === 0;
          })() && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">No recent messages</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/messages")}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-0 shadow-md hover:shadow-lg font-semibold transition-all duration-300"
              >
                Start Chatting
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MessagesWidget;