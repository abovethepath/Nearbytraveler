import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Users, Edit, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { Event } from "@shared/schema";

interface BusinessEventsWidgetProps {
  userId: number;
}

export default function BusinessEventsWidget({ userId }: BusinessEventsWidgetProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events created by this business
  const { data: businessEvents = [], isLoading } = useQuery({
    queryKey: [`/api/events/organizer/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/organizer/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch business events');
      return response.json();
    }
  });

  const handleCreateEvent = () => {
    setLocation('/create-event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditEvent = (eventId: number) => {
    setLocation(`/events/${eventId}/manage`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewEvent = (eventId: number) => {
    setLocation(`/events/${eventId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setLocation('/events')}
    >
      <CardContent className="p-4 space-y-4">
        {/* Create Event Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Events hosted by your business
          </p>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleCreateEvent();
            }}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-orange-500 text-white"
            style={{ transition: 'none' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

      {/* Events List */}
      {businessEvents.length > 0 ? (
        <div className="space-y-3">
          {businessEvents.map((event: Event) => (
            <Card key={event.id} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-black dark:text-white mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {event.description}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(event.id)}
                      className="h-8 w-8 p-0"
                      style={{ transition: 'none' }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewEvent(event.id)}
                      className="h-8 w-8 p-0"
                      style={{ transition: 'none' }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {event.date ? formatDateForDisplay(event.date, 'UTC') : 'Date TBD'}
                      {event.endDate && event.endDate !== event.date && 
                        ` - ${formatDateForDisplay(event.endDate, 'UTC')}`
                      }
                    </span>
                  </div>
                  
                  {/* Time is included in the date field, no separate startTime field */}
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location || event.city}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.maxParticipants ? `Max ${event.maxParticipants} people` : '0 attending'}</span>
                  </div>
                </div>

                {/* Event Category */}
                {event.category && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                      {event.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No events created yet. Use the "Create Event" button above to get started.</p>
        </div>
      )}
      </CardContent>
    </Card>
  );
}