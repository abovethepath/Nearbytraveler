import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, MapPin, Users, Clock, Sparkles, TrendingUp, Star, Filter } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import EventCard from '@/components/event-card';
import type { Event } from '@shared/schema';

interface AICityEventsProps {
  cityName: string;
  currentUser?: any;
}

interface AIEventRecommendation {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  relevanceScore: number;
  aiReason: string;
  isPromoted: boolean;
  attendeeCount: number;
}

export default function AICityEvents({ cityName, currentUser }: AICityEventsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'this-week' | 'this-month'>('upcoming');
  const { toast } = useToast();

  // Fetch AI-enhanced events for the city
  const { data: aiEvents = [], isLoading: aiEventsLoading } = useQuery({
    queryKey: [`/api/ai/city-events/${encodeURIComponent(cityName)}`],
    queryFn: async () => {
      const response = await fetch(`/api/ai/city-events/${encodeURIComponent(cityName)}?userId=${currentUser?.id || ''}`);
      if (!response.ok) throw new Error('Failed to fetch AI events');
      return response.json();
    },
  });

  // Fetch regular events as fallback
  const { data: regularEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', cityName],
    queryFn: async () => {
      const response = await fetch(`/api/events?city=${encodeURIComponent(cityName)}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    select: (data: Event[]) => data.filter(event => 
      event.location?.toLowerCase().includes(cityName.toLowerCase())
    )
  });

  // Generate AI event insights
  const generateEventInsights = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/ai/generate-event-insights`, 'POST', {
        cityName,
        userId: currentUser?.id,
        userInterests: currentUser?.interests || [],
        userActivities: currentUser?.activities || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ai/city-events/${encodeURIComponent(cityName)}`] });
      toast({
        title: "AI insights updated",
        description: "Event recommendations have been refreshed with new insights",
      });
    },
  });

  // Get unique categories from events
  const categories = Array.from(new Set([
    ...aiEvents.map((event: AIEventRecommendation) => event.category),
    ...regularEvents.map(event => event.category)
  ])).filter(Boolean);

  // Filter events based on selected criteria
  const filteredAIEvents = aiEvents.filter((event: AIEventRecommendation) => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    
    const eventDate = new Date(event.date);
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let timeMatch = true;
    if (timeFilter === 'this-week') timeMatch = eventDate <= oneWeek;
    if (timeFilter === 'this-month') timeMatch = eventDate <= oneMonth;
    
    return categoryMatch && timeMatch && eventDate >= now;
  });

  const filteredRegularEvents = regularEvents.filter(event => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    
    const eventDate = new Date(event.date);
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let timeMatch = true;
    if (timeFilter === 'this-week') timeMatch = eventDate <= oneWeek;
    if (timeFilter === 'this-month') timeMatch = eventDate <= oneMonth;
    
    return categoryMatch && timeMatch && eventDate >= now;
  });

  // Combine and sort events by AI relevance and date
  const allEvents = [
    ...filteredAIEvents.map(event => ({ ...event, isAI: true, relevanceScore: event.relevanceScore || 0 })),
    ...filteredRegularEvents.map(event => ({ ...event, isAI: false, relevanceScore: 0 }))
  ].sort((a, b) => {
    // Prioritize AI events with high relevance
    if (a.isAI && !b.isAI) return -1;
    if (!a.isAI && b.isAI) return 1;
    if (a.isAI && b.isAI) return b.relevanceScore - a.relevanceScore;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Events Header */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => {
          // Navigate to events page with AI filter
          window.location.href = `/events?city=${encodeURIComponent(cityName)}&ai=true`;
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <CardTitle className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                AI-Powered Events in {cityName}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                generateEventInsights.mutate();
              }}
              disabled={generateEventInsights.isPending}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateEventInsights.isPending ? 'Updating...' : 'Refresh AI Insights'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Time Filters */}
            <div className="flex gap-2">
              {(['upcoming', 'this-week', 'this-month'] as const).map(filter => (
                <Button
                  key={filter}
                  variant={timeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(filter)}
                  className={timeFilter === filter ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {filter === 'upcoming' && 'Upcoming'}
                  {filter === 'this-week' && 'This Week'}
                  {filter === 'this-month' && 'This Month'}
                </Button>
              ))}
            </div>
            
            {/* Category Filters */}
            <div className="flex gap-2 ml-4">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Filter className="w-3 h-3 mr-1" />
                All Categories
              </Button>
              {categories.slice(0, 4).map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Event Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">AI Recommended</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filteredAIEvents.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Events</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{allEvents.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attendees</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(filteredAIEvents.reduce((sum, event) => sum + (event.attendeeCount || 0), 0) / Math.max(filteredAIEvents.length, 1))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Discover Events ({allEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(aiEventsLoading || eventsLoading) ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg" />
              ))}
            </div>
          ) : allEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No events found for the selected criteria</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {allEvents.map((event, index) => (
                  <div key={event.id || index} className="relative">
                    {/* AI Enhancement Badge */}
                    {event.isAI && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-blue-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Pick
                        </Badge>
                      </div>
                    )}
                    
                    {/* Relevance Score for AI events */}
                    {event.isAI && event.relevanceScore > 80 && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          <Star className="w-3 h-3 mr-1" />
                          Perfect Match
                        </Badge>
                      </div>
                    )}

                    <Card className={`transition-all hover:shadow-md ${event.isAI ? 'border-orange-200 bg-gradient-to-r from-orange-50/50 to-blue-50/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{event.title}</h3>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{event.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                          {event.attendeeCount && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.attendeeCount} attending
                            </div>
                          )}
                        </div>

                        {/* AI Reason for recommendation */}
                        {event.isAI && event.aiReason && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-orange-700">
                              <Sparkles className="w-4 h-4 inline mr-1" />
                              <strong>Why this event:</strong> {event.aiReason}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              Join Event
                            </Button>
                          </div>
                          
                          {event.isAI && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <TrendingUp className="w-3 h-3" />
                              {event.relevanceScore}% match
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}