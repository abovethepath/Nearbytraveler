import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SITE_URL } from "@/lib/constants";

function formatDateTime(value: any) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusLabel(status: any) {
  if (!status) return "Not enrolled";
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (status === "revoked") return "Revoked";
  return String(status);
}

function statusTone(status: any) {
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
  if (status === "active") return "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700";
  if (status === "inactive") return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-700";
  if (status === "revoked") return "bg-red-100 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700";
  return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
}

export default function AmbassadorDashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const ambassadorStatus = (user as any)?.ambassadorStatus ?? null;
  const ambassadorPoints = Number((user as any)?.ambassadorPoints || 0) || 0;
  const pointsInPeriod = Number((user as any)?.ambassadorPointsInPeriod || 0) || 0;
  const periodStartAt = (user as any)?.ambassadorPeriodStartAt ?? null;
  const lastEarnedAt = (user as any)?.ambassadorLastEarnedAt ?? null;

  const { data: qrData } = useQuery<{ referralCode?: string; signupUrl?: string }>({
    queryKey: ["/api/user/qr-code"],
    enabled: !!(user as any)?.id,
    staleTime: 1000 * 60 * 60,
  });

  const referralCode = qrData?.referralCode || "";
  const referralUrl =
    qrData?.signupUrl ||
    (referralCode ? `${SITE_URL}/signup/qr/${referralCode}` : SITE_URL);

  const openPublicLanding = React.useCallback(() => {
    // Use `public=1` to avoid redirecting back to this dashboard when logged in.
    window.open("/ambassador?public=1", "_blank", "noopener,noreferrer");
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Referral link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Couldn’t copy. Please copy manually.", variant: "destructive" });
    }
  };

  if (!(user as any)?.id) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Ambassador</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please log in to view your Ambassador dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setLocation("/auth")}>Log in</Button>
            <Button variant="outline" onClick={openPublicLanding}>
              View public Ambassador page
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Ambassador</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your status, points, referral link, and perks.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openPublicLanding}
              className="hidden sm:inline-flex items-center gap-2"
            >
              Public details
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusTone(ambassadorStatus)}`}>
                {statusLabel(ambassadorStatus)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {ambassadorStatus
                  ? "Keep earning points to stay active."
                  : "Earn points through referrals, events, and community growth."}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Ambassador Points</div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{ambassadorPoints}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Points in Current Window</div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{pointsInPeriod}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Window Start</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(periodStartAt)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Last Earned</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(lastEarnedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Referral link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Share this link to invite new users. When they sign up, you’ll be connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={referralUrl}
                className="w-full flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <Button onClick={() => copy(referralUrl)} className="sm:w-auto w-full inline-flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
            </div>
            {!!referralCode && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Your code: <span className="font-mono font-semibold">{referralCode}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Perks & how to earn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-orange-500" />
              <p>Ambassador Points track high-impact actions (referrals, events, business growth).</p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-orange-500" />
              <p>Stay active: points earned in your current window help keep your status active.</p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-orange-500" />
              <p>Want the full public explanation? View the marketing page anytime.</p>
            </div>
            <div className="pt-2">
              <Button variant="outline" onClick={openPublicLanding} className="w-full sm:w-auto">
                View Ambassador landing page
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

