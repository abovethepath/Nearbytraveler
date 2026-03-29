import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { SimpleAvatar } from "@/components/simple-avatar";
import { Copy, Check, Clock } from "lucide-react";
import { useLocation } from "wouter";

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
    <div className="rounded-xl border border-orange-200/50 dark:border-orange-800/30 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/20">
        <span className="text-xs font-bold text-gray-900 dark:text-white">🎁 Refer Friends, Earn Rewards</span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Rewards description */}
        <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed space-y-0.5">
          <p className="font-medium text-gray-700 dark:text-gray-300">Share your link — when friends sign up you earn:</p>
          <p>✦ <span className="font-semibold text-orange-600 dark:text-orange-400">5 Aura Points</span> per signup</p>
          <p>✦ <span className="font-semibold text-orange-600 dark:text-orange-400">15 more Aura Points</span> when they complete their profile</p>
          <p>🔒 <span className={`font-semibold ${isAmbassador ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>50 Ambassador Points</span> per signup</p>
          <p>🔒 <span className={`font-semibold ${isAmbassador ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>25 more Ambassador Points</span> when they complete their profile</p>
        </div>

        {/* Copy link */}
        {stats.inviteUrl && (
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate font-mono">{stats.inviteUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 h-7 px-2.5 rounded bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 transition-colors text-[10px] font-semibold"
            >
              <Copy className="w-3 h-3" />
              Copy Link
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-1">
          <div className="flex-1 text-center py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200/40 dark:border-orange-800/20">
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{stats.totalReferrals}</p>
            <p className="text-[8px] text-gray-500 dark:text-gray-400 leading-tight">Signups</p>
          </div>
          <div className="flex-1 text-center py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200/40 dark:border-orange-800/20">
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{stats.totalAuraFromReferrals}</p>
            <p className="text-[8px] text-gray-500 dark:text-gray-400 leading-tight">Aura</p>
          </div>
          <div className="flex-1 text-center py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200/40 dark:border-orange-800/20">
            {isAmbassador ? (
              <>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{stats.totalAmbassadorPointsFromReferrals}</p>
                <p className="text-[8px] text-gray-500 dark:text-gray-400 leading-tight">Amb. Pts</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-300 dark:text-gray-600">🔒</p>
                <p className="text-[8px] text-gray-400 dark:text-gray-500 leading-tight">Amb. Pts</p>
              </>
            )}
          </div>
        </div>

        {/* Referred users list */}
        {stats.referredUsers.length > 0 ? (
          <div className="space-y-0.5">
            {stats.referredUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 py-0.5 -mx-1 transition-colors"
                   onClick={() => setLocation(`/profile/${u.id}`)}>
                <SimpleAvatar user={{ id: u.id, username: u.username, profileImage: u.profileImage }} size="xs" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-900 dark:text-white">@{u.username}</span>
                  <span className="text-[9px] text-gray-400 ml-1">{u.hometownCity || ""}</span>
                </div>
                {u.bioBonusEarned || u.hasBio ? (
                  <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-gray-300 dark:text-gray-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-2">
            You haven't referred anyone yet. Share your link and start earning!
          </p>
        )}
      </div>
    </div>
  );
}
