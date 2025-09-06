import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Hi! I'm your NearbyTraveler assistant. I can help you with:\n• Planning trips and travel\n• Finding people, events, and businesses\n• Using search and editing your profile\n• Connecting and messaging\n\nTry asking: \"How do I plan a trip?\" or \"How do I search for people?\"",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Canned responses for common questions
  const getCannedResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('plan') && (lowerMessage.includes('trip') || lowerMessage.includes('travel'))) {
      return "To plan a trip:\n1. Click your profile icon and select 'Create Trip'\n2. Enter your destination, dates, and interests\n3. Browse suggested events and activities\n4. Connect with locals and fellow travelers\n5. Use the search feature to find specific activities or people in your destination";
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return "To search on NearbyTraveler:\n• Click the Search icon in the bottom navigation\n• Use filters for location, age, interests, and activities\n• Switch between 'People', 'Events', and 'Businesses' tabs\n• Use the map view to see nearby results\n• Save interesting profiles and events for later";
    }
    
    if (lowerMessage.includes('edit') && lowerMessage.includes('profile')) {
      return "To edit your profile:\n1. Click your profile icon in the navigation\n2. Click 'Edit Profile' button\n3. Update your bio, interests, activities, and photos\n4. Save changes\n\nA complete profile helps you connect with like-minded travelers and locals!";
    }
    
    if (lowerMessage.includes('message') || lowerMessage.includes('chat')) {
      return "To message someone:\n1. Go to their profile and click 'Message'\n2. Or use the Messages tab in bottom navigation\n3. Send connection requests to people you'd like to meet\n4. Join city-specific chat rooms to connect with locals and travelers";
    }
    
    if (lowerMessage.includes('event') || lowerMessage.includes('meetup')) {
      return "For events and meetups:\n• Browse events on the home page or Events tab\n• RSVP to events you're interested in\n• Create your own events using the '+' button\n• Use Quick Meetup for spontaneous gatherings\n• Filter events by interests, date, and location";
    }
    
    if (lowerMessage.includes('connect') || lowerMessage.includes('friend') || lowerMessage.includes('meet')) {
      return "To connect with people:\n• Use the Search feature to find travelers and locals\n• Send connection requests to interesting profiles\n• Join events and meetups in your area\n• Use city chat rooms to meet people\n• Check compatibility scores to find like-minded people";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('start')) {
      return "Getting started with NearbyTraveler:\n1. Complete your profile with bio, interests, and photo\n2. Create a trip if you're traveling\n3. Search for people, events, and businesses\n4. Join local chat rooms\n5. RSVP to events or create your own\n6. Connect with fellow travelers and locals";
    }
    
    // Default response
    return "I'm here to help you with NearbyTraveler! I can assist with:\n• Planning trips and travel\n• Finding people, events, and businesses\n• Using search and filters\n• Editing your profile\n• Messaging and connecting\n• Creating events and meetups\n\nWhat would you like to know more about?";
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: getCannedResponse(message) };
    },
    onSuccess: (data) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.message,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "Sorry, I'm having trouble right now. Please try again later.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-4" style={{ zIndex: 10000 }}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-4 w-80 max-w-[calc(100vw-2rem)] h-96 max-h-[80vh] md:w-80 sm:w-72 hidden md:block" style={{ zIndex: 10000 }}>
      <Card className="h-full flex flex-col shadow-xl border-2 bg-white">
        <CardHeader className="bg-white text-black rounded-t-lg py-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Travel Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                {message.isBot && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[240px] rounded-lg px-3 py-2 text-sm ${
                    message.isBot
                      ? "bg-white border text-gray-800"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {message.content}
                </div>
                {!message.isBot && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border rounded-lg px-3 py-2 text-sm text-gray-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about travel, events, or connections..."
                className="flex-1 text-sm"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}