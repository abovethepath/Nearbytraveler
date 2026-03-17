import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, ArrowLeft, Loader2, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isNativeIOSApp } from "@/lib/nativeApp";

const TIERS = [
  {
    productId: "prod_UA7HkaOOltz9uv",
    name: "Community Supporter",
    emoji: "🤝",
    amount: "$5",
    tier: "community_supporter",
    color: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    border: "border-green-200 dark:border-green-700",
    features: [
      "🤝 Community Supporter badge on your profile",
      "Support platform maintenance & development",
      "Help keep the community free & authentic",
    ],
    popular: false,
  },
  {
    productId: "prod_UA7Iao2qt6pY8b",
    name: "Travel Explorer",
    emoji: "⭐",
    amount: "$10",
    tier: "travel_explorer",
    color: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    border: "border-blue-300 dark:border-blue-600",
    features: [
      "⭐ Travel Explorer badge on your profile",
      "Everything in Community Supporter",
      "Power authentic travel connections globally",
    ],
    popular: true,
  },
  {
    productId: "prod_UA7I707QDAEu0j",
    name: "Travel Champion",
    emoji: "👑",
    amount: "$15",
    tier: "travel_champion",
    color: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
    border: "border-orange-300 dark:border-orange-600",
    features: [
      "👑 Travel Champion badge on your profile",
      "Everything in Travel Explorer",
      "Become a champion of meaningful travel",
    ],
    popular: false,
  },
];

const DONATION_PRODUCT_ID = "prod_UA7HPF0d3egAlt";

export const SUPPORT_TIER_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
  community_supporter: { emoji: "🤝", label: "Community Supporter", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  travel_explorer:     { emoji: "⭐", label: "Travel Explorer",      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  travel_champion:     { emoji: "👑", label: "Travel Champion",      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  donor:               { emoji: "💛", label: "Supporter",            color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export default function Donate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("10");
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const { data: status } = useQuery<{
    supportTier?: string | null;
    supportSubscriptionStatus?: string | null;
  }>({
    queryKey: ["/api/stripe/support/status"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ productId, amountCents }: { productId: string; amountCents?: number }) => {
      const res = await apiRequest("POST", "/api/stripe/support/checkout", { productId, amountCents });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data?.error || "Could not start checkout", variant: "destructive" });
        setLoadingProduct(null);
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Checkout failed", variant: "destructive" });
      setLoadingProduct(null);
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/stripe/support/portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Error", description: "Could not open billing portal", variant: "destructive" });
    },
  });

  const handleSubscribe = (productId: string) => {
    setLoadingProduct(productId);
    checkoutMutation.mutate({ productId });
  };

  const handleDonate = () => {
    const cents = Math.round(parseFloat(customAmount) * 100);
    if (!cents || cents < 100) {
      toast({ title: "Minimum $1", description: "Please enter at least $1", variant: "destructive" });
      return;
    }
    setLoadingProduct(DONATION_PRODUCT_ID);
    checkoutMutation.mutate({ productId: DONATION_PRODUCT_ID, amountCents: cents });
  };

  const activeTier = status?.supportTier;
  const isActive = status?.supportSubscriptionStatus === "active";
  const tierInfo = activeTier ? SUPPORT_TIER_DISPLAY[activeTier] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation(isNativeIOSApp() ? "/home" : "/")}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black dark:text-white">Support Us 💛</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Help build the world's most authentic travel community</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Active tier banner */}
        {tierInfo && isActive && (
          <div className="mb-8 rounded-2xl border-2 border-orange-200 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">Your Current Plan</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierInfo.emoji}</span>
                <span className="text-xl font-bold text-black dark:text-white">{tierInfo.label}</span>
                <Badge className={`text-xs ${tierInfo.color} border-0`}>Active</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your badge is showing on your profile. Thank you! 🙏</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="shrink-0 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
            >
              {portalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
              Manage Subscription
            </Button>
          </div>
        )}

        {/* Mission */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black dark:text-white">
              <Users className="w-6 h-6 text-orange-500" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Nearby Traveler connects authentic travelers with passionate locals and trusted businesses worldwide.
              Your support keeps the platform free and growing — every dollar goes directly toward building genuine human connections through travel.
            </p>
          </CardContent>
        </Card>

        {/* Monthly plans */}
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">Monthly Support Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {TIERS.map((tier) => {
            const isCurrent = activeTier === tier.tier && isActive;
            const isLoading = loadingProduct === tier.productId;
            return (
              <div
                key={tier.productId}
                className={`relative rounded-2xl border-2 bg-gradient-to-b ${tier.color} ${tier.border} p-6 flex flex-col gap-3 ${tier.popular ? "shadow-lg" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white border-0 text-xs px-3 py-0.5">Most Popular</Badge>
                  </div>
                )}
                <div className="text-center">
                  <span className="text-3xl">{tier.emoji}</span>
                  <h3 className="font-bold text-lg text-black dark:text-white mt-1">{tier.name}</h3>
                  <p className="text-3xl font-black text-black dark:text-white mt-2">
                    {tier.amount}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
                  </p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-gray-700 dark:text-gray-300">{f}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(tier.productId)}
                  disabled={isCurrent || isLoading || !!loadingProduct}
                  className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold"
                  style={{ transition: "none" }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? "✓ Current Plan" : `Support ${tier.amount}/mo`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* One-time donation */}
        <div className="rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💛</span>
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white">One-Time Donation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support whenever you feel like it — earns a 💛 Supporter badge on your profile</p>
            </div>
          </div>
          <div className="flex items-center gap-3 max-w-sm">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-7 bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 text-black dark:text-white"
                placeholder="10"
              />
            </div>
            <Button
              onClick={handleDonate}
              disabled={!!loadingProduct}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6"
              style={{ transition: "none" }}
            >
              {loadingProduct === DONATION_PRODUCT_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : "Donate"}
            </Button>
          </div>
        </div>

        {/* Badge preview */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-black dark:text-white text-base">Profile Badges You'll Earn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 text-sm px-3 py-1">🤝 Community Supporter</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-sm px-3 py-1">⭐ Travel Explorer</Badge>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-0 text-sm px-3 py-1">👑 Travel Champion</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0 text-sm px-3 py-1">💛 Supporter</Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Badges appear on your public profile next to your name. Monthly plan badges update automatically when your plan changes.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
