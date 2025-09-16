import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { EventParticipantWithUser } from "@shared/schema";

interface ParticipantAvatarsProps {
  type: 'meetup' | 'event';
  itemId: number;
  maxVisible?: number;
  className?: string;
}

export function ParticipantAvatars({ type, itemId, maxVisible = 5, className = '' }: ParticipantAvatarsProps) {
  const { data: participants = [], isLoading } = useQuery<EventParticipantWithUser[]>({
    queryKey: [`/${type === 'meetup' ? 'quick-meets' : 'events'}/${itemId}/participants`],
    queryFn: async () => {
      const endpoint = type === 'meetup' 
        ? `/api/quick-meets/${itemId}/participants`
        : `/api/events/${itemId}/participants`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    );
  }

  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(0, participants.length - maxVisible);

  return (
    <div className={`flex items-center ${className}`}>
      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {visibleParticipants.filter(participant => participant.user).map((participant) => (
          <Link
            key={participant.id}
            href={`/profile/${participant.user.id}`}
            className="relative"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-r from-blue-500 to-orange-500 hover:scale-110 transition-transform cursor-pointer">
              {participant.user.profileImage ? (
                <img 
                  src={participant.user.profileImage} 
                  alt={participant.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                  {participant.user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Count and Text */}
      <div className="ml-3 text-sm text-gray-600 dark:text-gray-400">
        {participants.length === 0 ? (
          "No participants yet"
        ) : participants.length === 1 ? (
          "1 person joined"
        ) : (
          <>
            {participants.length} people joined
            {remainingCount > 0 && (
              <span className="ml-1 text-xs">
                (+{remainingCount} more)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}