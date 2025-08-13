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
  });



  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <Card 
      className="bg-white dark:bg-gray-800 cursor-pointer hover:shadow-lg transition-shadow duration-300 border-gray-200 dark:border-gray-700"
      onClick={() => setLocation("/messages")}
    >
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-travel-blue" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLocation("/requests");
            }}
          >
            View Connection Requests
          </Button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {messages
            .filter(message => message.senderId !== message.receiverId) // Filter out self-messages
            .slice(0, 5) // Show more messages (up to 5)
            .map((message, index) => {
              const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
              const otherUser = users.find(u => u.id === otherUserId);
              const isFromMe = message.senderId === userId;
            
            return (
              <div
                key={message.id || index} 
                onClick={() => setLocation("/messages")}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-all duration-200 border border-gray-100 dark:border-gray-600"
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isFromMe ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {isFromMe ? `To: ${otherUser?.username || "Unknown"}` : `From: ${otherUser?.username || "Unknown"}`}
                    </span>
                  </div>
                  {message.createdAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {/* Message Content Bubble */}
                <div className={`p-3 rounded-lg max-w-full ${
                  isFromMe 
                    ? 'bg-blue-500 text-white ml-4' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white mr-4'
                }`}>
                  <p className="text-sm leading-relaxed break-words">
                    {message.content}
                  </p>
                </div>
                
                {/* Message Status */}
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Click to view conversation
                  </span>
                </div>
              </div>
            );
            })}
          {messages.filter(message => message.senderId !== message.receiverId).length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No recent messages</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/messages")}
                className="bg-orange-600 hover:bg-orange-700 text-white border-0"
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