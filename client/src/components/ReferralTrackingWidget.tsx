import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { SimpleAvatar } from "@/components/simple-avatar";
import { Copy, Share2, Check, Clock } from "lucide-react";
import { useLocation } from "wouter";

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ReferralStats {
  referralCode: string | null;
  inviteUrl: string | null;
  totalReferrals: number;
  totalAuraFromReferrals: number;
  totalAmbassadorPointsFromReferrals: number;
  referredUsers: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
    hometownCity: string;
    joinDate: string;
    hasBio: boolean;
    bioBonusEarned: boolean;
  }[];
  events: {
    id: number;
    referredUserId: number;
    eventType: string;
    points: number;
    createdAt: string;
    username: string;
  }[];
}

export function ReferralTrackingWidget({ profileUserId }: { profileUserId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isOwner = user?.id === profileUserId;
  const isAdmin = user?.id === 2;
  if (!isOwner && !isAdmin) return null;

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/my-stats", profileUserId],
    queryFn: async () => {
      const url = isOwner
        ? `${getApiBaseUrl()}/api/referrals/my-stats`
        : `${getApiBaseUrl()}/api/referrals/my-stats?userId=${profileUserId}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: user?.id ? { "x-user-id": String(user.id) } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  if (!stats) return null;

  const handleCopy = () => {
    if (stats.inviteUrl) {
      navigator.clipboard.writeText(stats.inviteUrl).then(() => {
        toast({ title: "Invite link copied!" });
      }).catch(() => {
        toast({ title: "Couldn't copy", variant: "destructive" });
      });
    }
  };

  const isAmbassador = (user as any)?.ambassadorStatus === 'active';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Share2 className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Referral Link</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Invite link — dark input + copy icon */}
        {stats.inviteUrl && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate font-mono">{stats.inviteUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 w-9 h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stat pills row */}
        <div className="flex gap-1.5">
          <div className="flex-1 text-center py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/30">
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{stats.totalReferrals}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Joined</p>
          </div>
          <div className="flex-1 text-center py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.totalAuraFromReferrals}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Aura</p>
          </div>
          <div className="flex-1 text-center py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/30">
            {isAmbassador ? (
              <>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.totalAmbassadorPointsFromReferrals}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Amb. Pts</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-300 dark:text-gray-600">🔒</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight">Amb. Pts</p>
              </>
            )}
          </div>
        </div>

        {/* Referred users — compact list */}
        {stats.referredUsers.length > 0 ? (
          <div className="space-y-1.5">
            {stats.referredUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
                   onClick={() => setLocation(`/profile/${u.id}`)}>
                <SimpleAvatar user={{ id: u.id, username: u.username, profileImage: u.profileImage }} size="xs" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-gray-900 dark:text-white">@{u.username}</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">{u.hometownCity || ""}</span>
                </div>
                {u.bioBonusEarned || u.hasBio ? (
                  <Check className="w-3 h-3 text-green-500 shrink-0" />
                ) : (
                  <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-3">No referrals yet — share your link!</p>
        )}
      </div>
    </div>
  );
}
