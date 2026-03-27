import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimpleAvatar } from "@/components/simple-avatar";
import { Copy, Users, Zap, Star, Check, Clock } from "lucide-react";
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

  // Only show to profile owner or admin (user id=2)
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

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          Referral Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite link */}
        {stats.inviteUrl && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Your Invite Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 truncate text-gray-700 dark:text-gray-300">
                {stats.inviteUrl}
              </code>
              <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={handleCopy}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-lg font-bold text-orange-500">{stats.totalReferrals}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">People Joined</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-lg font-bold text-blue-500">{stats.totalAuraFromReferrals}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Aura Points</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 relative">
            {(user as any)?.ambassadorStatus === 'active' ? (
              <>
                <p className="text-lg font-bold text-purple-500">{stats.totalAmbassadorPointsFromReferrals}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Ambassador Pts</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-gray-300 dark:text-gray-600">🔒</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Ambassador Pts</p>
                <p className="text-[8px] text-gray-400 dark:text-gray-600 mt-0.5">Become an Ambassador to unlock</p>
              </>
            )}
          </div>
        </div>

        {/* Referred users list */}
        {stats.referredUsers.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Referred Members</h4>
            <div className="space-y-2">
              {stats.referredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="cursor-pointer shrink-0" onClick={() => setLocation(`/profile/${u.id}`)}>
                    <SimpleAvatar user={{ id: u.id, username: u.username, profileImage: u.profileImage }} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">@{u.username}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {u.hometownCity || "No city"} · Joined {timeAgo(u.joinDate)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {u.bioBonusEarned ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 font-medium">
                        <Check className="w-3 h-3" /> Bio bonus
                      </span>
                    ) : u.hasBio ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 font-medium">
                        <Check className="w-3 h-3" /> Has bio
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Point event history */}
        {stats.events.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Points History</h4>
            <div className="space-y-1">
              {stats.events.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-1.5">
                    {e.eventType === "signup" ? (
                      <Zap className="w-3 h-3 text-orange-500" />
                    ) : (
                      <Star className="w-3 h-3 text-blue-500" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {e.eventType === "signup" ? "Referral Signup" : "Bio Bonus"} — @{e.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="font-semibold text-green-600 dark:text-green-400">+{e.points}</span>
                    <span>{timeAgo(e.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalReferrals === 0 && (
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">No referrals yet. Share your invite link!</p>
          </div>
        )}

        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
          Points power your Ambassador rank and Aura score
        </p>
      </CardContent>
    </Card>
  );
}
