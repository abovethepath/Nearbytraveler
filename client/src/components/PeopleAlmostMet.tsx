import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, ChevronRight, UserPlus } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { getApiBaseUrl, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AlmostMetUser {
  userId: number;
  username: string;
  firstName: string | null;
  profileImage: string | null;
  hometownCity: string | null;
  hometownCountry: string | null;
  sharedCity: string;
  overlapLabel: string;
  daysOverlap: number | null;
}

function AlmostMetCard({ person }: { person: AlmostMetUser }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/connections", { targetUserId: person.userId }),
    onSuccess: () => {
      toast({ title: "Connection request sent!" });
      qc.invalidateQueries({ queryKey: ["/api/people-almost-met"] });
    },
    onError: () => {
      toast({ title: "Couldn't send request", variant: "destructive" });
    },
  });

  const displayName = person.firstName || `@${person.username}`;
  const from = person.hometownCity || person.hometownCountry;

  const overlapDetail = person.daysOverlap != null && person.daysOverlap > 1
    ? `${person.daysOverlap} days in ${person.sharedCity}`
    : `both in ${person.sharedCity}`;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        type="button"
        onClick={() => setLocation(`/profile/${person.userId}`)}
        className="flex-shrink-0"
      >
        <SimpleAvatar
          user={{ id: person.userId, username: person.username, profileImage: person.profileImage }}
          size="sm"
        />
      </button>

      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => setLocation(`/profile/${person.userId}`)}
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
          {displayName}
        </p>
        <p className="text-[11px] text-orange-500 dark:text-orange-400 font-medium leading-tight mt-0.5">
          You were both in {person.overlapLabel}
        </p>
        {from && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {from}
          </p>
        )}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          connectMutation.mutate();
        }}
        disabled={connectMutation.isPending}
        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 text-[11px] font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50"
      >
        <UserPlus className="w-3 h-3 flex-shrink-0" />
        Connect
      </button>
    </div>
  );
}

export function PeopleAlmostMet() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<AlmostMetUser[]>({
    queryKey: ["/api/people-almost-met"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/people-almost-met`, {
        credentials: "include",
        headers: user?.id ? { "x-user-id": String(user.id) } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!user?.id,
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            People You Almost Met
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            You were in the same city at the same time
          </p>
        </div>
        <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
          {data.length}
        </span>
      </div>

      <div className="px-4 py-1">
        {data.slice(0, 5).map((person) => (
          <AlmostMetCard key={person.userId} person={person} />
        ))}
      </div>

      {data.length > 5 && (
        <button
          onClick={() => setLocation("/discover")}
          className="w-full px-4 py-2.5 text-[11px] font-semibold text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-800"
        >
          See {data.length - 5} more people
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default PeopleAlmostMet;
