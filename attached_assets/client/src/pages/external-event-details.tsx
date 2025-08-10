import { useRoute, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Globe, Clock, Tag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ExternalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  venue: string;
  address: string;
  city: string;
  organizer: string;
  category: string;
  url: string;
  price: string;
  attendees: number;
  image?: string;
  source: string;
  rank?: number;
  impact?: string;
}

export default function ExternalEventDetails() {
  const [match, params] = useRoute('/external-events/:eventId');
  const [, setLocation] = useLocation();
  const [event, setEvent] = useState<ExternalEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.eventId) {
      // Parse event data from URL parameters or localStorage
      const eventData = localStorage.getItem(`external-event-${params.eventId}`);
      if (eventData) {
        setEvent(JSON.parse(eventData));
      }
      setLoading(false);
    }
  }, [params?.eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The event you're looking for could not be found.
          </p>
          <Button onClick={() => setLocation('/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'predicthq': return 'bg-blue-100 text-blue-800';
      case 'allevents': return 'bg-red-100 text-red-800';
      case 'eventbrite': return 'bg-purple-100 text-purple-800';
      case 'meetup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'predicthq': return 'PredictHQ';
      case 'allevents': return 'AllEvents.in';
      case 'eventbrite': return 'Eventbrite';
      case 'meetup': return 'Meetup';
      default: return source;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/events')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getSourceBadgeColor(event.source)}>
                  {getSourceName(event.source)}
                </Badge>
                <Badge variant="outline">
                  {event.category}
                </Badge>
                {event.impact && (
                  <Badge variant="secondary">
                    {event.impact} impact
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image && (
              <Card>
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  About This Event
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Location & Venue
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.venue}
                      </p>
                      {event.address && (
                        <div className="space-y-2">
                          {event.address.includes(',') && event.address.split(',').length === 2 && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(event.address.trim()) ? (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                📍 GPS Coordinates
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 font-mono text-sm">
                                {event.address}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                                onClick={() => {
                                  const [lat, lng] = event.address.split(',').map(coord => parseFloat(coord.trim()));
                                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                }}
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Open in Google Maps
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                📍 Event Address
                              </p>
                              <p className="text-green-700 dark:text-green-300 text-sm">
                                {event.address}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-2 bg-green-600 text-white hover:bg-green-700 border-green-600"
                                onClick={() => {
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`, '_blank');
                                }}
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Find on Google Maps
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        📍 {event.city}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Event Info */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Event Information
                </h3>
                
                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Starts
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatDate(event.date)}
                      </p>
                      {event.endDate && (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white mt-2">
                            Ends
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            {formatDate(event.endDate)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Price */}
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Price
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {event.price}
                      </p>
                    </div>
                  </div>

                  {/* Official Website Link */}
                  {event.url && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            Find Official Website
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            onClick={() => window.open(event.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Search for Event Details
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {event.attendees > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Expected Attendance
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            {event.attendees.toLocaleString()} people
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actions
                </h3>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (event.url) {
                        window.open(event.url, '_blank');
                      } else {
                        // For Ticketmaster events, search for the event on their website
                        const searchQuery = encodeURIComponent(`${event.title} ${event.venue} ${event.city}`);
                        window.open(`https://www.ticketmaster.com/search?q=${searchQuery}`, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Find More Information
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const subject = `Check out this event: ${event.title}`;
                      const body = `I found this event and thought you might be interested:\n\n${event.title}\n${formatDate(event.date)}\n${event.venue}\n\n${event.description}`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Share with Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}