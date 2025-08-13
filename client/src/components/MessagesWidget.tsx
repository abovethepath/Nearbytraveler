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
        <div className="flex flex-wrap gap-2">
          {messages
            .filter(message => message.senderId !== message.receiverId) // Filter out self-messages
            .slice(0, 8) // Show up to 8 message bubbles
            .map((message, index) => {
              const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
              const otherUser = users.find(u => u.id === otherUserId);
              const isFromMe = message.senderId === userId;
            
            return (
              <button
                key={message.id || index} 
                onClick={() => setLocation("/messages")}
                title={`${isFromMe ? 'To' : 'From'}: ${otherUser?.username || 'Unknown'}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 ${
                  isFromMe 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {(otherUser?.username?.[0] || '?').toUpperCase()}
              </button>
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