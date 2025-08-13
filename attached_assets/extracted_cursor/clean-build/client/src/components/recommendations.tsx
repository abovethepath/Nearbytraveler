import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, DollarSign, Star, Heart, Calendar, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface LocationRecommendation {
  type: 'activity' | 'event' | 'restaurant' | 'attraction';
  title: string;
  description: string;
  location: string;
  category: string;
  estimatedDuration?: string;
  priceRange?: string;
}

interface RecommendationsProps {
  destination: string;
  startDate?: string;
  endDate?: string;
}

const typeIcons = {
  activity: '🏃',
  event: '🎭',
  restaurant: '🍽️',
  attraction: '🏛️'
};

const typeColors = {
  activity: 'bg-blue-100 text-blue-800',
  event: 'bg-blue-100 text-blue-800',
  restaurant: 'bg-green-100 text-green-800',
  attraction: 'bg-orange-100 text-orange-800'
};

export default function Recommendations({ destination, startDate, endDate }: RecommendationsProps) {
  const [selectedEvent, setSelectedEvent] = useState<LocationRecommendation | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const handleEventClick = (rec: LocationRecommendation) => {
    if (rec.type === 'event') {
      setSelectedEvent(rec);
      setShowEventModal(true);
    }
  };

  const handleJoinEvent = (eventTitle: string) => {
    setInterestedEvents(prev => new Set(prev).add(eventTitle));
    setShowEventModal(false);
    toast({
      title: "Interested in Event",
      description: `You've marked interest in "${eventTitle}". We'll notify you about similar events!`,
    });
  };

  const handleAddToCalendar = (rec: LocationRecommendation) => {
    toast({
      title: "Added to Your Itinerary",
      description: `"${rec.title}" has been saved to your travel plans.`,
    });
  };

  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['/api/recommendations', destination, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        destination,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const response = await fetch(`/api/recommendations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return response.json() as Promise<LocationRecommendation[]>;
    },
    enabled: !!destination
  });

  if (!destination) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Star className="w-5 h-5" />
            Recommendations
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Set your travel destination to get personalized suggestions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Star className="w-5 h-5" />
            Recommendations for {destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="h-3 w-full bg-gray-200 dark:bg-gray-600" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-gray-600" />
                <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-600" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Star className="w-5 h-5" />
            Recommendations for {destination}
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Unable to load recommendations. Please check your API connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Star className="w-5 h-5" />
            Recommendations for {destination}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {startDate && endDate 
              ? `Personalized suggestions for your trip (${startDate} to ${endDate})`
              : 'Personalized suggestions for your upcoming trip'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations?.map((rec, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 transition-colors border-gray-200 dark:border-gray-600 ${
                  rec.type === 'event' 
                    ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => rec.type === 'event' && handleEventClick(rec)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight break-words">
                          {typeIcons[rec.type]} {rec.title}
                        </h4>
                      </div>
                      {rec.type === 'event' && (
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 text-xs bg-white dark:bg-gray-800 self-start">
                          Interactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{rec.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <Badge variant="secondary" className={`${typeColors[rec.type]} dark:bg-gray-600 dark:text-white`}>
                    {rec.type}
                  </Badge>
                  
                  {rec.estimatedDuration && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {rec.estimatedDuration}
                    </div>
                  )}
                  
                  {rec.priceRange && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-3 h-3" />
                      {rec.priceRange}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {rec.location}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {rec.type === 'event' && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinEvent(rec.title);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {interestedEvents.has(rec.title) ? 'Interested' : 'Interest'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCalendar(rec);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ))}
            
            {(!recommendations || recommendations.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recommendations available for this destination.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{typeIcons[selectedEvent.type]}</span>
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={typeColors[selectedEvent.type]} variant="secondary">
                  {selectedEvent.category}
                </Badge>
                <Badge variant="outline">Event</Badge>
              </div>
              
              <p className="text-gray-700 text-lg">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
                {selectedEvent.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-gray-600">{selectedEvent.estimatedDuration}</p>
                    </div>
                  </div>
                )}
                {selectedEvent.priceRange && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Price Range</p>
                      <p className="text-sm text-gray-600">{selectedEvent.priceRange}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => handleJoinEvent(selectedEvent.title)}
                  className="flex-1"
                  disabled={interestedEvents.has(selectedEvent.title)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {interestedEvents.has(selectedEvent.title) ? 'Already Interested' : 'Mark Interest'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleAddToCalendar(selectedEvent)}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Itinerary
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                This stays within the app - we'll help you connect with others interested in this event!
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}