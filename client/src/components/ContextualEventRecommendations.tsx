import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Calendar, Users, Sparkles } from 'lucide-react';

interface ContextualFactor {
  locationMatch: number;
  interestMatch: number;
  timeRelevance: number;
  weatherRelevance: number;
  travelContext: number;
  socialProof: number;
  personalHistory: number;
}

interface EventRecommendation {
  eventId: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  category: string;
  price?: number;
  freeEvent?: boolean;
  imageUrl?: string;
  attendeeCount: number;
  maxAttendees?: number;
  organizer: string;
  relevanceScore: number;
  contextualFactors: ContextualFactor;
  recommendationReason: string;
  contextualTags: string[];
}

interface ContextualEventsResponse {
  userId: number;
  context: {
    location: string;
    isTraverling: boolean;
    travelDestination?: string;
    interests: number;
    activities: number;
  };
  recommendations: EventRecommendation[];
  meta: {
    total: number;
    averageScore: number;
  };
}

interface ContextualEventRecommendationsProps {
  userId: number;
  limit?: number;
}

export function ContextualEventRecommendations({ userId, limit = 8 }: ContextualEventRecommendationsProps) {
  const { data, isLoading, error } = useQuery<ContextualEventsResponse>({
    queryKey: [`/api/contextual-events/${userId}`, { limit }],
    retry: false,
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Perfect Match';
    if (score >= 0.6) return 'Great Match';
    if (score >= 0.4) return 'Good Match';
    return 'Basic Match';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5" />
            Events Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5" />
            Events Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-900 dark:text-white">No events found near you</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Check back later or explore different cities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="h-5 w-5" />
          Events Near You
          <Badge variant="outline" className="ml-auto">
            {data.meta.total} Results
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>📍 {data.context.location}</span>
            <span>🎯 {data.context.interests} interests</span>
            <span>⭐ Avg Score: {data.meta.averageScore}</span>
            <span>{data.context.isTraverling ? `✈️ ${data.context.travelDestination || 'Traveling'}` : '🏠 Local'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid layout matching business widget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data.recommendations.map((event, index) => (
            <Card
              key={`${event.eventId}-${index}-${event.title.substring(0, 10)}`}
              className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col"
              onClick={() => window.open(`/events/${event.eventId}`, '_blank')}
            >
              {/* Event Photo Header */}
              <div 
                className="relative h-32 bg-cover bg-center"
                style={{
                  backgroundImage: event.imageUrl ? `url('${event.imageUrl}')` : `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-800/90 dark:text-white backdrop-blur-sm">
                    {event.category}
                  </Badge>
                </div>
                {event.freeEvent && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                      FREE
                    </Badge>
                  </div>
                )}
                {event.price && !event.freeEvent && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      ${event.price}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Event Content */}
              <CardContent className="flex-1 flex flex-col p-4">
                {/* Title */}
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                  {event.title}
                </h3>

                {/* Date & Location */}
                <div className="space-y-1 mb-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {event.attendeeCount} going
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                  {event.description}
                </p>

                {/* Tags */}
                {event.contextualTags && event.contextualTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {event.contextualTags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge 
                        key={tagIndex} 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Relevance Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 ${getScoreColor(event.relevanceScore)}`}
                    >
                      {getScoreLabel(event.relevanceScore)}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    by {event.organizer}
                  </span>
                </div>

                {/* Recommendation Reason */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                  {event.recommendationReason}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* See All Button */}
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => window.open('/events', '_blank')}
            className="text-gray-900 dark:text-white"
          >
            See All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}