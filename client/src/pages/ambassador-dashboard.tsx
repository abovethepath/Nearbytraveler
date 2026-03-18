import { useContext, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award, Star, Users, Copy, ExternalLink, ChevronRight,
  ArrowLeft, CheckCircle, Calendar, Trophy, Mail, X
} from "lucide-react";
import { AuthContext } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { SITE_URL } from "@/lib/constants";

const POINT_ACTIONS = [
  { action: "Recruit a friend who signs up", points: "+50 pts" },
  { action: "Refer a business lead", points: "+75 pts" },
  { action: "Business becomes a paying partner", points: "+200 pts" },
  { action: "Create an event", points: "+5 pts" },
  { action: "Event with 10+ attendees", points: "+20 pts" },
  { action: "Complete a Quick Meet", points: "+10 pts" },
  { action: "Complete an Available Now", points: "+5 pts" },
  { action: "Create a chatroom (5+ members)", points: "+15 pts" },
  { action: "Write a reference", points: "+10 pts" },
  { action: "Receive a reference", points: "+10 pts" },
  { action: "Every 25 connections reached", points: "+50 pts" },
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

  const [showProgramDetails, setShowProgramDetails] = useState(false);
  const points = user?.ambassadorPoints ?? 0;
  const periodPoints = (user as any)?.ambassadorPointsInPeriod ?? 0;
  const status = (user as any)?.ambassadorStatus as string | null | undefined;
  const referralCode = (user as any)?.referralCode as string | null | undefined;
  const referralLink = referralCode
    ? `${SITE_URL}/join?ref=${referralCode}`
    : null;

  const PERIOD_GOAL = 200;
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

        {/* Link to full program details modal */}
        <button
          onClick={() => setShowProgramDetails(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <ExternalLink className="w-4 h-4 text-blue-500" />
            Full Program Details & FAQ
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

      </div>

      {/* Full Program Details Modal */}
      {showProgramDetails && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={() => setShowProgramDetails(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white rounded-t-2xl sm:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-800">
              <h2 className="text-lg font-bold">Program Details & FAQ</h2>
              <button onClick={() => setShowProgramDetails(false)} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-8 space-y-8">
              {/* How It Works */}
              <div className="pt-4">
                <h3 className="text-xl font-bold text-orange-400 mb-4">How It Works</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { n: "1", title: "Do Helpful Actions", desc: "Invite friends, refer businesses, host events", color: "blue" },
                    { n: "2", title: "Earn Points", desc: "Points stack over time based on impact", color: "orange" },
                    { n: "3", title: "Calculate Share", desc: "Your points / total points = your share", color: "green" },
                    { n: "4", title: "Exit Only", desc: "Value only upon acquisition or IPO", color: "purple" },
                  ].map((step) => (
                    <div key={step.n} className="text-center p-3 bg-gray-800 rounded-xl">
                      <div className={`w-10 h-10 rounded-full bg-${step.color}-900/50 flex items-center justify-center mx-auto mb-2`}>
                        <span className={`text-sm font-bold text-${step.color}-400`}>{step.n}</span>
                      </div>
                      <p className="font-semibold text-sm">{step.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Pool */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-bold text-orange-400 mb-3">How Points Turn Into Equity</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Points track your contribution over time. There are <strong>no periodic cash distributions</strong> from this program.
                </p>
                <p className="text-sm text-gray-300 mb-3">
                  If there is ever a future <strong>liquidity event</strong> (acquisition or IPO) and the program terms are met,
                  we calculate your share of the <strong className="text-orange-400">4% Ambassador Ownership Pool</strong> based on your portion of total points.
                </p>
                <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400">
                  <strong>Example:</strong> If you earn 1,000 points and the community earns 100,000 points total,
                  you earned 1% of the points → you receive 1% of the 4% pool (i.e., 0.04% equity), subject to the program terms.
                </div>
              </div>

              {/* LA Bonus */}
              <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-800">
                <h3 className="text-lg font-bold mb-2">LA Ambassadors: Extra 1% Local Pool</h3>
                <p className="text-sm text-gray-300">
                  Los Angeles city ambassadors share an <strong>additional 1% ownership pool</strong> on top of the global 4%.
                  LA ambassadors can earn from both pools.
                </p>
              </div>

              {/* Ways to Earn */}
              <div>
                <h3 className="text-xl font-bold text-orange-400 mb-3">Ways to Earn Points</h3>
                <p className="text-xs text-gray-400 mb-3">If an event has multiple Ambassadors, event-based points are split evenly.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {POINT_ACTIONS.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                      <span className="text-sm">{item.action}</span>
                      <span className="text-orange-400 font-semibold text-sm ml-2 whitespace-nowrap">{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Rules */}
              <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-800/50">
                <h3 className="text-lg font-bold text-amber-400 mb-3">Safety & Quality Rules</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Points may require verification (e.g., event hosted, business activated)</li>
                  <li>• We remove points for fake accounts, spam invites, or low-quality events</li>
                  <li>• Some actions may have limits (to prevent gaming)</li>
                  <li>• <strong>Activity requirement:</strong> Must earn at least 200 points every 6 months</li>
                  <li>• Inactive for 6 months → points frozen (not deleted)</li>
                  <li>• Inactive for 12 months → ambassador status revoked, can reapply later</li>
                  <li>• Admins can manually reactivate or revoke any ambassador</li>
                </ul>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="text-xl font-bold text-orange-400 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {[
                    { q: "Is this paid work?", a: "No. This is not a job and points are not income." },
                    { q: "Can points be converted to cash?", a: "No. Points are for tracking contribution. They may never be worth anything." },
                    { q: "When could points matter?", a: "Only if there's a future exit (like an acquisition or IPO), and only under the official terms." },
                    { q: "How do I stay active as an Ambassador?", a: "Earn at least 200 points every 6 months. If inactive for 6 months, points are frozen. After 12 months inactive, status is revoked — you can reapply and start fresh." },
                  ].map((faq, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-1">{faq.q}</p>
                      <p className="text-sm text-gray-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-red-900/20 rounded-xl p-5 border border-red-800/50">
                <h3 className="text-lg font-bold text-red-400 mb-3">Important Notice</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Points are not money, wages, or guaranteed rewards</li>
                  <li>• Points may have no value now or ever</li>
                  <li>• Any potential payout/value is <strong>only upon a liquidity event</strong> (acquisition or IPO) and only if the program terms are met</li>
                  <li>• We may change, pause, or end the program to prevent fraud or keep it fair</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-red-800/30">
                  The Ambassador Ownership Pool is offered only under the program's official terms and eligibility rules.
                  Points don't guarantee equity and may be adjusted for fraud prevention, verification, and quality standards.
                </p>
              </div>

              {/* Contact */}
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">
                  Questions? Email <a href="mailto:ambassadors@nearbytraveler.org" className="text-orange-400 underline">ambassadors@nearbytraveler.org</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
