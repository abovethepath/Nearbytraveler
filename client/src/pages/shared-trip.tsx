import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Ticket, Users, Check, Star } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/queryClient';

interface TravelPlan {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  user?: {
    username: string;
    name?: string;
    profileImage?: string;
  };
}

export default function SharedTripPage() {
  const [, params] = useRoute('/trip/:id');
  const tripId = params != null ? (params as { id: string }).id : undefined;

  const { data: travelPlan, isLoading, error } = useQuery<TravelPlan>({
    queryKey: [`/api/travel-plans/${tripId}/public`],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${tripId}/public`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Trip not found');
        if (response.status === 403) throw new Error('This itinerary is private');
        throw new Error('Failed to load trip');
      }
      return response.json();
    },
    enabled: !!tripId
  });

  const { data: itineraryData = [] } = useQuery({
    queryKey: [`/api/travel-plans/${tripId}/itineraries/public`],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${tripId}/itineraries/public`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tripId && !!travelPlan
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDateRange = () => {
    if (!travelPlan) return [];
    const start = new Date(travelPlan.startDate);
    const end = new Date(travelPlan.endDate);
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const itineraryItems = itineraryData.flatMap((itinerary: any) => itinerary.items || []);
  const itemsByDate = itineraryItems.reduce((acc: any, item: any) => {
    const dateKey = item.date?.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      activity: '🎯', food: '🍽️', transport: '🚗', accommodation: '🏨',
      sightseeing: '📸', shopping: '🛍️', entertainment: '🎭', other: '📝'
    };
    return icons[category || 'other'] || '📝';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !travelPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {(error as Error)?.message || 'Trip not found'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              This trip may be private or no longer exists.
            </p>
            <a href="/" className="inline-block mt-4 text-orange-600 hover:underline">
              Go to Nearby Traveler
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateRange = getDateRange();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm mb-4">
            <img src="/new-logo.png" alt="Nearby Traveler" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Shared via Nearby Traveler</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🗺️ {travelPlan.destination}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(travelPlan.startDate)} - {formatDate(travelPlan.endDate)}
          </p>
          {travelPlan.user && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              by @{travelPlan.user.username}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {dateRange.map((date, index) => {
            const dayItems = itemsByDate[date] || [];
            
            return (
              <Card key={date} className="overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(date)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Day {index + 1}</p>
                  </div>
                </div>
                
                <CardContent className="pt-4">
                  {dayItems.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-2 text-sm">
                      Free day - no activities planned
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-xl">{getCategoryIcon(item.category)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.startTime && (
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                  {formatTime(item.startTime)}
                                </span>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                            </div>
                            {item.location && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {item.location}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Plan your own trips and connect with travelers
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Join Nearby Traveler
          </a>
        </div>
      </div>
    </div>
  );
}
