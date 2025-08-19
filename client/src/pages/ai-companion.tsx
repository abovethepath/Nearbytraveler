import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Star, Clock, DollarSign, Bookmark, Heart, Navigation, MessageCircle, Send, Bot, User, Sparkles, Check } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  priceRange?: string;
  rating?: number;
  tags: string[];
  aiConfidence: number;
  recommendationReason: string;
  userPreferencesMatched: string[];
  isBookmarked: boolean;
  isVisited: boolean;
  location: string;
  category: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AICompanion() {
  // PAUSED FEATURE - Redirect to home
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  
  return null;
}

function AICompanionPaused() {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [preferences, setPreferences] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your AI travel companion. I can help you discover amazing destinations, plan activities, and provide personalized travel recommendations. What would you like to explore today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => Date.now().toString());

  const predefinedCategories = [
    "Restaurants", "Attractions", "Entertainment", "Shopping", 
    "Outdoor Activities", "Museums", "Nightlife", "Local Experiences"
  ];
  
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch user's existing recommendations
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/ai-recommendations/${user?.id || 83}`],
    enabled: !!user?.id,
    staleTime: 0, // No cache to ensure fresh data
    refetchOnWindowFocus: false,
    refetchInterval: false, // Don't auto-refetch
    retry: 3
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async (data: { location: string; category: string; preferences: string }) => {
      const response = await apiRequest("POST", "/api/ai-recommendations/generate", {
        location: data.location,
        category: data.category,
        preferences: data.preferences
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      return await response.json();
    },
    onSuccess: async (data: any) => {
      console.log('AI recommendations generated:', data);
      console.log('Data type:', typeof data, 'Array?', Array.isArray(data));
      
      // Wait a moment then refetch to ensure backend has processed
      setTimeout(() => {
        refetch();
      }, 500);
      
      toast({
        title: "Recommendations Generated", 
        description: `Generated ${Array.isArray(data) ? data.length : 0} new recommendations!`
      });
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  });

  // Chat with AI
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("POST", "/api/ai/conversation", {
        userId: user?.id,
        userMessage: message,
        location: user?.location || "General",
        sessionId: sessionId
      });
    },
    onSuccess: (data: any) => {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.response || "Sorry, I couldn't generate a response.",
        isUser: false,
        timestamp: new Date()
      }]);
      setIsChatLoading(false);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      setIsChatLoading(false);
    }
  });

  // Bookmark recommendation
  const bookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PUT", `/api/ai-recommendations/${id}/bookmark`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ai-recommendations/${user?.id}`] });
    }
  });

  const handleGenerateRecommendations = () => {
    if (!location || !category) {
      toast({
        title: "Missing Information",
        description: "Please enter a location and select a category.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({ location, category, preferences });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput.trim(),
      isUser: true,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);
    setChatInput("");
    
    chatMutation.mutate(chatInput.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBookmark = (id: number) => {
    bookmarkMutation.mutate(id);
  };

  const filteredRecommendations = useMemo(() => {
    console.log('Filtering recommendations:', { 
      recommendations, 
      isArray: Array.isArray(recommendations),
      length: Array.isArray(recommendations) ? recommendations.length : 'not array',
      location,
      sampleRec: Array.isArray(recommendations) ? recommendations[0] : null
    });
    
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      console.log('Recommendations is not a valid array:', typeof recommendations, recommendations);
      return [];
    }
    
    // Sort by creation date, newest first
    return [...recommendations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [recommendations, location]);

  const bookmarkedRecommendations = filteredRecommendations.filter((rec: Recommendation) => rec.isBookmarked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-950 dark:to-orange-950">
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-500/90 to-orange-500/90 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AI Travel Companion
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
              Get personalized travel recommendations and chat with your intelligent travel assistant
            </p>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
              <Bot className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-400/20 rounded-full blur-lg"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Discover hidden gems and personalized recommendations powered by AI. 
            Get local insights tailored to your travel preferences.
          </p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mt-6 max-w-2xl mx-auto shadow-sm">
            <p className="text-white text-sm">
              <strong>Note:</strong> AI recommendations are based on historical data. Please verify current business status, hours, and availability before visiting any recommended locations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-8">
          {/* Generation Form */}
          <div className="lg:col-span-1">
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Generate Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location" className="text-gray-900 dark:text-white">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Los Angeles, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-gray-900 dark:text-white">Category</Label>
                  <div className="space-y-2">
                    <Select value={showCustomInput ? 'custom' : category} onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomInput(true);
                        setCategory('');
                      } else {
                        setShowCustomInput(false);
                        setCategory(value);
                        setCustomCategory('');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Custom Category</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {showCustomInput && (
                      <Input
                        placeholder="Enter custom category (e.g., 'mosquito protection', 'vegan bakeries')"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          setCategory(e.target.value);
                        }}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferences" className="text-gray-900 dark:text-white">Preferences (Optional)</Label>
                  <Textarea
                    id="preferences"
                    placeholder="e.g., vegetarian options, family-friendly, budget-conscious..."
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleGenerateRecommendations}
                  disabled={isGenerating || !location || !category}
                  className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg shadow-lg transform transition-all duration-200"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Get Recommendations
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat and Recommendations Display */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100 to-orange-100 p-1 rounded-lg">
                <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger value="bookmarked" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Bookmarked
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4">
                <Card className="h-[600px] flex flex-col border-0 shadow-lg bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-700">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      AI Travel Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 pr-4 mb-4">
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              message.isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                            }`}>
                              <div className="flex items-start gap-2">
                                {!message.isUser && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                {message.isUser && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                <div className="flex-1">
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-300'
                                  }`}>
                                    {message.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white p-3 rounded-lg max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask me about travel destinations, activities, or planning tips..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isChatLoading}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-orange-500 rounded-xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Your AI Recommendations</h3>
                  </div>
                  <p className="text-blue-100">
                    Personalized travel suggestions generated just for you
                  </p>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mb-4">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-300 font-medium">Loading recommendations...</p>
                  </div>
                ) : filteredRecommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-xl mb-2 font-semibold text-gray-700 dark:text-gray-300">No recommendations yet</p>
                    <p className="text-gray-500 dark:text-gray-400">Generate your first set of personalized travel recommendations!</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredRecommendations.map((rec: Recommendation) => (
                      <Card key={rec.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBookmark(rec.id)}
                                className="p-1 hover:bg-red-50"
                              >
                                {rec.isBookmarked ? (
                                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                                ) : (
                                  <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleVisited(rec.id)}
                                className="p-1 hover:bg-green-50"
                              >
                                {rec.isVisited ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400 hover:text-green-500" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4">{rec.description}</p>
                          
                          {rec.address && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Address:</strong> {rec.address}
                            </p>
                          )}
                          
                          {rec.openingHours && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Hours:</strong> {rec.openingHours}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-3">
                            {rec.tags?.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 text-xs rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-sm mt-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-700 font-medium">{rec.rating}/5</span>
                            </div>
                            <span className="bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent font-bold text-lg">{rec.priceRange}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bookmarked" className="space-y-4">
                <div className="mb-6 p-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-6 h-6 fill-white" />
                    <h3 className="text-xl font-bold">Your Bookmarked Places</h3>
                  </div>
                  <p className="text-pink-100">
                    Saved recommendations for your future adventures
                  </p>
                </div>
                
                {bookmarkedRecommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-100 to-red-100 rounded-full mb-6">
                      <Heart className="w-10 h-10 text-pink-400" />
                    </div>
                    <p className="text-xl mb-2 font-semibold text-gray-700">No bookmarks yet</p>
                    <p className="text-gray-500">Bookmark your favorite recommendations to save them for later!</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {bookmarkedRecommendations.map((rec: Recommendation) => (
                      <Card key={rec.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBookmark(rec.id)}
                                className="p-1 hover:bg-red-50"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleVisited(rec.id)}
                                className="p-1 hover:bg-green-50"
                              >
                                {rec.isVisited ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400 hover:text-green-500" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4">{rec.description}</p>
                          
                          {rec.address && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Address:</strong> {rec.address}
                            </p>
                          )}
                          
                          {rec.openingHours && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Hours:</strong> {rec.openingHours}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-3">
                            {rec.tags?.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 text-xs rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-sm mt-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-700 font-medium">{rec.rating}/5</span>
                            </div>
                            <span className="bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent font-bold text-lg">{rec.priceRange}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ 
  recommendation, 
  onBookmark 
}: { 
  recommendation: Recommendation; 
  onBookmark: (id: number) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {recommendation.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {recommendation.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {recommendation.address}
                </div>
              )}
              {recommendation.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {recommendation.rating}
                </div>
              )}
              {recommendation.priceRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {recommendation.priceRange}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark(recommendation.id)}
            className={recommendation.isBookmarked ? "text-red-500" : "text-gray-400"}
          >
            <Heart className={`w-5 h-5 ${recommendation.isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>

        <p className="text-gray-700 mb-4">{recommendation.description}</p>

        {recommendation.openingHours && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Clock className="w-4 h-4" />
            {recommendation.openingHours}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Why AI recommends this:</p>
            <p className="text-sm text-gray-600">{recommendation.recommendationReason}</p>
          </div>

          {recommendation.userPreferencesMatched.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Matches your preferences:</p>
              <div className="flex flex-wrap gap-1">
                {recommendation.userPreferencesMatched.map((pref, index) => (
                  <div key={index} className="pill inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5" style={{height: '2.5rem', minWidth: '8rem', padding: '0 1rem', fontSize: '1rem'}}>
                    {pref}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {recommendation.tags.map((tag, index) => (
              <div key={index} className="pill inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1.5" style={{height: '2.5rem', minWidth: '8rem', padding: '0 1rem', fontSize: '1rem'}}>
                {tag}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-xs text-gray-500">
              AI Confidence: {Math.round(recommendation.aiConfidence * 100)}%
            </div>
            <Badge variant={recommendation.isVisited ? "default" : "secondary"}>
              {recommendation.isVisited ? "Visited" : "Not visited"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}