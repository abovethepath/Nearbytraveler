import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/**
 * Shared "copy this event" behavior used by the events list, the Manage page,
 * and the event detail page's host controls.
 *
 * Event rows on some pages carry only partial data, so we fetch the full event
 * by id first, build a fresh copy payload, POST it, and jump to the new event's
 * Manage page. Recurrence is intentionally dropped and attendees/RSVPs/chatroom
 * are NOT copied — a copy starts fresh.
 *
 * Call `copyEventMutation.mutate(eventId)`.
 */
export function useCopyEventMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const eventRes = await apiRequest("GET", `/api/events/${eventId}`);
      if (!eventRes.ok) {
        throw new Error(`Could not load event ${eventId} to copy`);
      }
      const event = await eventRes.json();

      const copyPayload = {
        title: `${event.title} (Copy)`,
        description: event.description || "",
        venueName: event.venueName || "",
        street: event.street || "",
        city: event.city,
        state: event.state || "",
        country: event.country || "United States",
        zipcode: event.zipcode || "",
        location: event.location || "",
        // Same date as the original — the user edits it on the copy's Manage page next
        date: event.date,
        endDate: event.endDate || null,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        timeZone: event.timeZone || null,
        category: event.category || "General",
        organizerId: event.organizerId,
        maxParticipants: event.maxParticipants ?? null,
        isPublic: event.isPublic !== false,
        showInterestedPublicly: event.showInterestedPublicly === true,
        tags: event.tags || [],
        requirements: event.requirements || "",
        imageUrl: event.imageUrl || null,
        imageFocalX: event.imageFocalX ?? null,
        imageFocalY: event.imageFocalY ?? null,
        // Do NOT copy recurrence — the copy is a single, non-recurring event
        isRecurring: false,
        recurrenceType: null,
        recurrencePattern: null,
        recurrenceEnd: null,
        // Audience / private visibility settings
        genderRestriction: event.genderRestriction || null,
        sexualOrientationRestriction: event.sexualOrientationRestriction || null,
        lgbtqiaOnly: !!event.lgbtqiaOnly,
        veteransOnly: !!event.veteransOnly,
        activeDutyOnly: !!event.activeDutyOnly,
        womenOnly: !!event.womenOnly,
        menOnly: !!event.menOnly,
        singlePeopleOnly: !!event.singlePeopleOnly,
        familiesOnly: !!event.familiesOnly,
        ageRestrictionMin: event.ageRestrictionMin ?? null,
        ageRestrictionMax: event.ageRestrictionMax ?? null,
        privateNotes: event.privateNotes || null,
        customRestriction: event.customRestriction || null,
        // Attendees, RSVPs, and the chatroom are intentionally NOT copied — a new event starts fresh
      };

      const response = await apiRequest("POST", "/api/events", copyPayload);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to copy event: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (newEvent) => {
      toast({
        title: "Event copied",
        description: "Now edit the copy's date and details, then save.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      // Redirect to the NEW event's Manage page — canonical route is /manage-event/:id
      setLocation(`/manage-event/${newEvent.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Copy failed",
        description: error.message || "Could not copy this event. Please try again.",
        variant: "destructive",
      });
    },
  });
}
