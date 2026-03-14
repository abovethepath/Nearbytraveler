import { useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award, Star, Users, Copy, ExternalLink, ChevronRight,
  ArrowLeft, CheckCircle, Calendar, Trophy, Mail
} from "lucide-react";
import { AuthContext } from "@/App";
import { useToast } from "@/hooks/use-toast";

const POINT_ACTIONS = [
  { action: "Refer a friend who signs up", points: "+50 pts" },
  { action: "Refer a business lead", points: "+75 pts" },
  { action: "Business becomes a paying partner", points: "+200 pts" },
  { action: "Create an event", points: "+20 pts" },
  { action: "Host a verified event", points: "+50 pts" },
  { action: "Event hits attendance goal", points: "+30 pts" },
];

function statusBadge(status: string | null | undefined) {
  if (!status) return <Badge variant="outline" className="text-gray-500">Not Enrolled</Badge>;
  if (status === "active") return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0">Active</Badge>;
  if (status === "inactive") return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-0">Inactive</Badge>;
  if (status === "revoked") return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0">Revoked</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function AmbassadorDashboard() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const points = user?.ambassadorPoints ?? 0;
  const periodPoints = (user as any)?.ambassadorPointsInPeriod ?? 0;
  const status = (user as any)?.ambassadorStatus as string | null | undefined;
  const referralCode = (user as any)?.referralCode as string | null | undefined;
  const referralLink = referralCode
    ? `https://nearbytraveler.org/join?ref=${referralCode}`
    : null;

  const PERIOD_GOAL = 50;
  const periodProgress = Math.min(100, Math.round((periodPoints / PERIOD_GOAL) * 100));

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    });
  };

  const applyEmail = user
    ? `mailto:ambassadors@nearbytraveler.org?subject=Ambassador Program Application - ${user.username}&body=Hi Aaron,%0D%0A%0D%0AI would like to apply to become a Nearby Traveler Ambassador.%0D%0A%0D%0AUsername: ${user.username}%0D%0AName: ${(user as any).name || "N/A"}%0D%0AEmail: ${user.email}%0D%0A%0D%0AWhy I want to be an Ambassador:%0D%0A%0D%0A%0D%0AHow I plan to help grow the community:%0D%0A%0D%0A`
    : "mailto:ambassadors@nearbytraveler.org";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/profile")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ambassador Program</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Earn points. Share in ownership.</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Stats card */}
        <Card className="bg-gradient-to-br from-blue-600 to-orange-500 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <span className="text-lg font-bold">{user?.username || "You"}</span>
              </div>
              {statusBadge(status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900/20 rounded-xl p-3 text-center">
                <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                <p className="text-sm text-blue-100">Total Points</p>
              </div>
              <div className="bg-white dark:bg-gray-900/20 rounded-xl p-3 text-center">
                <p className="text-3xl font-bold">{periodPoints}</p>
                <p className="text-sm text-blue-100">This Period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity period progress */}
        {status === "active" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  6-Month Activity Window
                </div>
                <span className="text-sm text-gray-500">{periodPoints} / {PERIOD_GOAL} pts</span>
              </div>
              <Progress value={periodProgress} className="h-2 mb-1" />
              {periodPoints >= PERIOD_GOAL ? (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> You've met the activity requirement for this period.
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Earn {PERIOD_GOAL - periodPoints} more points this period to stay active.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Referral link */}
        {referralLink ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                <span className="flex-1 text-xs">{referralLink}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={copyReferralLink}
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              No referral code yet — it appears after your account is approved.
            </CardContent>
          </Card>
        )}

        {/* Not enrolled CTA */}
        {!status && (
          <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 text-center space-y-3">
              <Star className="w-8 h-8 mx-auto text-orange-500" />
              <p className="font-semibold text-gray-900 dark:text-white">You're not enrolled yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Apply to join the Ambassador Program and start earning points for helping grow the community.
              </p>
              <a href={applyEmail}>
                <Button className="w-full gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0">
                  <Mail className="w-4 h-4" />
                  Apply via Email
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Ways to earn */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              Ways to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y divide-gray-100 dark:divide-gray-800">
            {POINT_ACTIONS.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{item.action}</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap ml-3">{item.points}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ownership snapshot */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">4% Ambassador Ownership Pool</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Your share = your points ÷ total community points × 4% pool — value only upon a liquidity event (acquisition or IPO).
            </p>
          </CardContent>
        </Card>

        {/* Link to full program page */}
        <button
          onClick={() => setLocation("/ambassador-program")}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <ExternalLink className="w-4 h-4 text-blue-500" />
            Full Program Details & FAQ
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

      </div>
    </div>
  );
}
