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

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <div className="w-full relative overflow-hidden rounded-3xl group" data-testid="messages-widget">
      {/* Animated Gradient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-30 blur-3xl animate-float"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
      </div>
      
      {/* Glass Morphism Card */}
      <Card className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 group-hover:shadow-3xl group-hover:bg-white/70 dark:group-hover:bg-gray-900/70">
        <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30">
              <MessageCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">Messages</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold rounded-full px-4"
            onClick={(e) => {
              e.stopPropagation();
              setLocation("/requests");
            }}
            data-testid="button-view-requests"
          >
            View Connection Requests
          </Button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {(() => {
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
              const otherUser = users.find(u => u.id === otherUserId);
              const isFromMe = message.senderId === userId;
              const isYourTurn = !isFromMe;
            
              return (
                <div
                  key={message.id || index} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (otherUser) {
                      setLocation(`/messages?user=${otherUser.id}`);
                    }
                  }}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 ${
                    isYourTurn 
                      ? 'bg-gradient-to-r from-orange-50/80 to-pink-50/80 dark:from-orange-900/30 dark:to-pink-900/30 border-2 border-orange-300 dark:border-orange-500/50 hover:shadow-xl hover:border-orange-400 dark:hover:border-orange-400/60' 
                      : 'bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600/50'
                  } backdrop-blur-sm`}
                  data-testid={`message-preview-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      {isYourTurn && (
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400 mb-1 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full w-fit">
                          YOUR TURN
                        </span>
                      )}
                      <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                        {isFromMe ? `To: ${otherUser?.username || "Unknown"}` : `From: ${otherUser?.username || "Unknown"}`}
                      </span>
                    </div>
                    {message.createdAt && (
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 font-medium">
                    {message.content && message.content.length > 100 
                      ? `${message.content.substring(0, 100)}...` 
                      : message.content}
                  </p>
                </div>
              );
            });
          })()}
          
          {(() => {
            const conversationCount = new Set(
              messages
                .filter(message => message.senderId !== message.receiverId)
                .map(message => message.senderId === userId ? message.receiverId : message.senderId)
            ).size;
            return conversationCount === 0;
          })() && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">No recent messages</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/messages")}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl font-semibold transition-all duration-300 rounded-full px-4"
                data-testid="button-start-chatting"
              >
                Start Chatting
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

export default MessagesWidget;