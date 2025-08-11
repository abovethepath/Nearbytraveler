import React, { useState } from 'react';
import { Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface InterestButtonProps {
  event: any;
  userId?: number;
  showInterestedCount?: boolean;
  variant?: 'default' | 'minimal';
}

export function InterestButton({ 
  event, 
  userId, 
  showInterestedCount = true, 
  variant = 'default' 
}: InterestButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine if this is an internal or external event
  const isInternal = event.id && typeof event.id === 'number' && !event.source;
  const eventIdentifier = isInternal 
    ? { eventId: event.id }
    : { externalEventId: event.id, eventSource: event.source };

  // Check if user is interested
  const { data: interestCheck = {}, isLoading: checkingInterest } = useQuery({
    queryKey: ['/api/event-interests/check', eventIdentifier],
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Get interested users count
  const { data: interestedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/events/interested-users', eventIdentifier],
    enabled: showInterestedCount,
    staleTime: 1000 * 30, // 30 seconds
  });

  const isInterested = (interestCheck as any)?.isInterested || false;
  const interestedCount = Array.isArray(interestedUsers) ? interestedUsers.length : 0;

  // Mutation to add/remove interest
  const interestMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      if (action === 'add') {
        const eventData = {
          ...eventIdentifier,
          eventTitle: event.title || event.name,
          eventSource: event.source || 'internal',
          cityName: event.city || event.location || 'Unknown',
          // Store full event data for external events
          ...(event.source && { eventData: event })
        };
        
        const response = await fetch('/api/event-interests', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId?.toString() || ''
          },
          body: JSON.stringify(eventData),
        });
        
        if (!response.ok) throw new Error('Failed to add interest');
        return response.json();
      } else {
        const params = new URLSearchParams(eventIdentifier as any);
        const response = await fetch(`/api/event-interests?${params}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId?.toString() || ''
          }
        });
        
        if (!response.ok) throw new Error('Failed to remove interest');
        return response.json();
      }
    },
    onSuccess: (data, action) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/event-interests/check'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/interested-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'event-interests'] });
      
      toast({
        title: action === 'add' ? 'Added to interests!' : 'Removed from interests',
        description: action === 'add' 
          ? 'This event will appear in your "Things I want to do" list'
          : 'Event removed from your interests',
      });
      
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Interest mutation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event interest. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  const handleInterestClick = async () => {
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save events to your interests.',
        variant: 'destructive',
      });
      return;
    }

    if (isProcessing || checkingInterest) return;

    setIsProcessing(true);
    const action = isInterested ? 'remove' : 'add';
    interestMutation.mutate(action);
  };

  if (variant === 'minimal') {
    return (
      <Button
        onClick={handleInterestClick}
        variant={isInterested ? 'default' : 'outline'}
        size="sm"
        disabled={isProcessing || checkingInterest}
        className={`transition-colors ${
          isInterested 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
        }`}
        data-testid={`interest-button-${event.id}`}
      >
        <Heart 
          className={`h-4 w-4 ${isInterested ? 'fill-current' : ''}`} 
        />
        {showInterestedCount && interestedCount > 0 && (
          <span className="ml-1 text-xs">{interestedCount}</span>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleInterestClick}
        variant={isInterested ? 'default' : 'outline'}
        size="sm"
        disabled={isProcessing || checkingInterest}
        className={`transition-colors ${
          isInterested 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
        }`}
        data-testid={`interest-button-${event.id}`}
      >
        <Heart 
          className={`h-4 w-4 mr-1 ${isInterested ? 'fill-current' : ''}`} 
        />
        {isInterested ? 'Interested' : 'Interested?'}
      </Button>

      {showInterestedCount && interestedCount > 0 && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-1" />
          <span>{interestedCount} interested</span>
        </div>
      )}
    </div>
  );
}