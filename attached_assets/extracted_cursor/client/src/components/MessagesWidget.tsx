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
      className="bg-white dark:bg-gray-800 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-gray-200 dark:border-gray-700"
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
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 hover:scale-105 active:scale-95 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setLocation("/requests");
            }}
          >
            View Connection Requests
          </Button>
        </div>
        <div className="space-y-3">
          {messages
            .filter(message => message.senderId !== message.receiverId) // Filter out self-messages
            .slice(0, 3)
            .map((message, index) => {
              const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
              const otherUser = users.find(u => u.id === otherUserId);
              const isFromMe = message.senderId === userId;
            
            return (
              <button
                key={message.id || index} 
                onClick={() => setLocation("/messages")}
                className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-200 cursor-pointer"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {isFromMe ? "You: " : ""}{message.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isFromMe ? `To: ${otherUser?.username || "Unknown"}` : `From: ${otherUser?.username || "Unknown"}`}
                </p>
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