import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon, 
  MapPin, 
  Paperclip, 
  Send, 
  X, 
  Smile, 
  Camera,
  MapIcon
} from "lucide-react";
import { authStorage } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RichMediaMessagingProps {
  recipientId?: number;
  chatroomId?: number;
  onMessageSent: (message: any) => void;
  className?: string;
}

interface MediaAttachment {
  type: 'image' | 'location' | 'file';
  url?: string;
  name?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export function RichMediaMessaging({ 
  recipientId, 
  chatroomId, 
  onMessageSent, 
  className 
}: RichMediaMessagingProps) {
  const user = authStorage.getUser();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest('/api/messages/send', {
        method: 'POST',
        body: messageData
      });
    },
    onSuccess: (data) => {
      onMessageSent(data);
      setMessage("");
      setAttachments([]);
    }
  });

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiRequest('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      
      setAttachments(prev => [...prev, {
        type: 'image',
        url: response.url,
        name: file.name
      }]);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    }
  };

  // Get current location
  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
            );
            const data = await response.json();
            const address = data.results[0]?.formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            setAttachments(prev => [...prev, {
              type: 'location',
              location: { latitude, longitude, address }
            }]);
          } catch (error) {
            // Fallback without address
            setAttachments(prev => [...prev, {
              type: 'location',
              location: { latitude, longitude }
            }]);
          }
        },
        (error) => {
          console.error('Location access denied:', error);
        }
      );
    }
  };

  // Send message with attachments
  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    const messageData = {
      content: message,
      recipientId,
      chatroomId,
      messageType: attachments.length > 0 ? 
        (attachments[0].type === 'image' ? 'image' : 
         attachments[0].type === 'location' ? 'location' : 'text') : 'text',
      mediaUrl: attachments.find(a => a.url)?.url,
      locationData: attachments.find(a => a.location)?.location,
    };

    sendMessageMutation.mutate(messageData);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Common emojis for quick access
  const quickEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🤔', '😅', '🙏', '✈️', '🌍'];

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={`border-t bg-white dark:bg-gray-800 ${className}`}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-700">
          <div className="flex gap-2 flex-wrap">
            {attachments.map((attachment, index) => (
              <Card key={index} className="relative inline-block">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    {attachment.type === 'image' && (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm truncate max-w-32">
                          {attachment.name}
                        </span>
                      </>
                    )}
                    {attachment.type === 'location' && (
                      <>
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">
                          {attachment.location?.address || 'Current Location'}
                        </span>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-700">
          <div className="flex gap-1 flex-wrap">
            {quickEmojis.map((emoji, index) => (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                onClick={() => insertEmoji(emoji)}
                className="h-8 w-8 p-0 text-lg hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-2">
            {/* Media Buttons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 w-8 p-0"
              title="Upload Image"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLocationShare}
              className="h-8 w-8 p-0"
              title="Share Location"
            >
              <MapIcon className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-8 w-8 p-0"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && attachments.length === 0) || sendMessageMutation.isPending}
              size="sm"
              className="h-9"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}