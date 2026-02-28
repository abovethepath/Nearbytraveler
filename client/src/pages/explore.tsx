import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Zap, Globe, ArrowRight, Plus, Heart, ChevronRight, Flag, Lock, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getMetroAreaName } from "../../../shared/metro-areas";

function UserAvatar({ user, size = "sm" }: { user: any; size?: string }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-12 h-12 text-base";
  if (user?.profileImage) {
    return <img src={user.profileImage} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }
  const initial = (user?.username || user?.name || "?")[0].toUpperCase();
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
         style={{ backgroundColor: user?.avatarColor || "#F97316" }}>
      {initial}
    </div>
  );
}

function resolveCurrentCity(user: any): { city: string; country: string } {
  if (!user) return { city: "", country: "" };
  const now = new Date();
  const hasActiveTrip = user.isCurrentlyTraveling &&
    user.destinationCity &&
    (!user.travelEndDate || new Date(user.travelEndDate) >= now) &&
    (!user.travelStartDate || new Date(user.travelStartDate) <= now);
  if (hasActiveTrip) {
    return {
      city: user.destinationCity,
      country: user.destinationCountry || user.hometownCountry || "United States",
    };
  }
  if (user.travelDestination && user.isCurrentlyTraveling) {
    return {
      city: user.travelDestination,
      country: user.destinationCountry || user.hometownCountry || "United States",
    };
  }
  return {
    city: user.hometownCity || "",
    country: user.hometownCountry || "United States",
  };
}

export default function Explore() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // Fetch travel plans to determine if user is currently traveling (active destination)
  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${currentUser?.id}`],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/travel-plans/${currentUser?.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  // Prefer active travel destination when set; otherwise use hometown (resolveCurrentCity)
  const activeTravelDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
  const resolved = (() => {
    if (activeTravelDestination) {
      const parts = String(activeTravelDestination).split(/,\s*/);
      const city = parts[0]?.trim() || "";
      const country = parts.length > 1 ? parts[parts.length - 1].trim() : (currentUser?.hometownCountry || "United States");
      return { city, country };
    }
    return resolveCurrentCity(currentUser);
  })();
  const rawCity = resolved.city;
  const userCity = rawCity ? getMetroAreaName(rawCity) : "";
  const userCountry = resolved.country;

  const [activeTab, setActiveTab] = useState("live");
  const [showCreateLiveShare, setShowCreateLiveShare] = useState(false);

  // Live share form state
  const [lsPlace, setLsPlace] = useState("");
  const [lsAddress, setLsAddress] = useState("");
  const [lsActivity, setLsActivity] = useState("");
  const [lsNote, setLsNote] = useState("");
  const [lsDuration, setLsDuration] = useState("60");

  // Community creation state
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [ccName, setCcName] = useState("");
  const [ccCategory, setCcCategory] = useState("general");
  const [ccIcon, setCcIcon] = useState("🏷️");
  const [ccColor, setCcColor] = useState("#F97316");
  const [ccDesc, setCcDesc] = useState("");
  const [ccIsPrivate, setCcIsPrivate] = useState(false);
  const [ccPassword, setCcPassword] = useState("");
  const [privateCommunityId, setPrivateCommunityId] = useState<number | null>(null);
  const [privatePassword, setPrivatePassword] = useState("");
  const [flagCommunityId, setFlagCommunityId] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState("");

  // Queries
  const { data: liveShares = [], isLoading: loadingShares, isError: errorShares } = useQuery<any[]>({
    queryKey: ["/api/live-shares", userCity],
    queryFn: async () => {
      const user = typeof window !== "undefined" ? (() => {
        try {
          const raw = localStorage.getItem("user") || localStorage.getItem("travelconnect_user");
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      })() : null;
      const url = `${getApiBaseUrl()}/api/live-shares?city=${encodeURIComponent(userCity)}`;
      const headers: Record<string, string> = {};
      if (user?.id) headers["x-user-id"] = String(user.id);
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
    enabled: !!userCity,
  });

  const { data: myLiveShare } = useQuery<any>({
    queryKey: ["/api/live-shares/mine"],
    queryFn: async () => {
      const user = typeof window !== "undefined" ? (() => {
        try {
          const raw = localStorage.getItem("user") || localStorage.getItem("travelconnect_user");
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      })() : null;
      const url = `${getApiBaseUrl()}/api/live-shares/mine`;
      const headers: Record<string, string> = {};
      if (user?.id) headers["x-user-id"] = String(user.id);
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: communityTagsList = [], isLoading: loadingTags, isError: errorTags } = useQuery<any[]>({
    queryKey: ["/api/community-tags"],
    queryFn: async () => {
      const res = await fetch("/api/community-tags?includePrivate=true");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: myCommunityTags = [] } = useQuery<any[]>({
    queryKey: ["/api/community-tags/mine"],
  });

  const { data: nearbyUsers = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["users-by-location", userCity, "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.hometownState) params.set("state", currentUser.hometownState);
      if (userCountry) params.set("country", userCountry);
      const res = await fetch(`/api/users-by-location/${encodeURIComponent(userCity)}/all?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userCity,
  });

  // Mutations
  const createLiveShareMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/live-shares", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || `Request failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares/mine"] });
      setShowCreateLiveShare(false);
      setLsPlace(""); setLsAddress(""); setLsActivity(""); setLsNote(""); setLsDuration("60");
      toast({ title: "You're live!", description: "People nearby can see where you are" });
    },
    onError: (err: Error) => {
      toast({
        title: "Couldn't go live",
        description: err?.message || "Place name, city, and country are required. Set your hometown or travel city in profile.",
        variant: "destructive",
      });
    },
  });

  const clearLiveShareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/live-shares");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares/mine"] });
      toast({ title: "Live share cleared" });
    },
  });

  const reactToShareMutation = useMutation({
    mutationFn: async ({ shareId, type }: { shareId: number; type: string }) => {
      const res = await apiRequest("POST", `/api/live-shares/${shareId}/react`, { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      toast({ title: "Reaction sent!" });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async ({ tagId, password }: { tagId: number; password?: string }) => {
      const res = await apiRequest("POST", `/api/community-tags/${tagId}/join`, password ? { password } : {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags/mine"] });
      setPrivateCommunityId(null);
      setPrivatePassword("");
      toast({ title: "Joined community!" });
    },
    onError: (error: any) => {
      toast({ title: "Can't join", description: error?.message || "Failed to join community", variant: "destructive" });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const res = await apiRequest("DELETE", `/api/community-tags/${tagId}/leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags/mine"] });
      toast({ title: "Left community" });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/community-tags", data);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create community");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags/mine"] });
      setShowCreateCommunity(false);
      setCcName(""); setCcCategory("general"); setCcIcon("🏷️"); setCcColor("#F97316"); setCcDesc(""); setCcIsPrivate(false); setCcPassword("");
      toast({ title: "Community created!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create community", variant: "destructive" });
    },
  });

  const flagCommunityMutation = useMutation({
    mutationFn: async ({ tagId, reason }: { tagId: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/community-tags/${tagId}/flag`, { reason });
      return res.json();
    },
    onSuccess: () => {
      setFlagCommunityId(null);
      setFlagReason("");
      toast({ title: "Community flagged", description: "An admin will review this community" });
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const res = await apiRequest("DELETE", `/api/community-tags/${tagId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags/mine"] });
      toast({ title: "Community deleted" });
    },
  });

  const myTagIds = new Set(myCommunityTags.map((t: any) => t.id));

  // Featured preset communities (shown first as a quick grid like the old Groups view)
  const toSlug = (value: unknown) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const FEATURED_COMMUNITY_SLUGS = [
    "solo-female-travelers",
    "lgbtq-plus",
    "solo-travelers",
    "digital-nomads",
    "foodies",
    "veterans",
  ] as const;
  const featuredCommunities = FEATURED_COMMUNITY_SLUGS
    .map((slug) =>
      communityTagsList.find((t: any) => t?.name === slug || toSlug(t?.displayName) === slug || toSlug(t?.name) === slug)
    )
    .filter(Boolean);

  const handleCreateLiveShare = () => {
    if (!lsPlace) { toast({ title: "Enter a place name", variant: "destructive" }); return; }
    if (!userCity?.trim()) {
      toast({ title: "City required", description: "Set your hometown or travel destination in your profile so we know which city to show you in.", variant: "destructive" });
      return;
    }
    if (!userCountry?.trim()) {
      toast({ title: "Country required", description: "Set your country in your profile.", variant: "destructive" });
      return;
    }
    createLiveShareMutation.mutate({
      placeName: lsPlace.trim(),
      placeAddress: (lsAddress || "").trim() || undefined,
      activity: (lsActivity || "").trim() || undefined,
      note: (lsNote || "").trim() || undefined,
      city: userCity.trim(),
      country: userCountry.trim(),
      durationMinutes: parseInt(lsDuration, 10) || 60,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>
          <p className="text-white/80 text-sm">Who's live right now, and communities to join — in {userCity || "your city"}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 min-w-0 overflow-x-hidden">
        {/* Tabs first: Live and Groups — before People in city */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 gap-2 mb-4 w-full p-1.5">
            <TabsTrigger value="live" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> <span>Live</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap shrink-0 lg:col-span-1">
              <Globe className="w-3.5 h-3.5 shrink-0" /> <span>Groups</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== LIVE LOCATION SHARES TAB ===== */}
          <TabsContent value="live" className="space-y-4">
            {/* My active share banner */}
            {myLiveShare && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-bold text-green-800 dark:text-green-300">You're Live at {myLiveShare.placeName}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {myLiveShare.activity && `${myLiveShare.activity} · `}
                          {Math.max(0, Math.round((new Date(myLiveShare.expiresAt).getTime() - Date.now()) / 60000))}m left
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => clearLiveShareMutation.mutate()}>
                      End
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create live share */}
            {!myLiveShare && (
              <Dialog open={showCreateLiveShare} onOpenChange={setShowCreateLiveShare}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white h-14 text-lg">
                    <MapPin className="w-5 h-5 mr-2" /> I'm here in {userCity || "my city"} right now
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-500" /> Share Your Location
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Where are you? (e.g., Grand Central Market)" value={lsPlace} onChange={(e) => setLsPlace(e.target.value)} />
                    <Input placeholder="Address (optional)" value={lsAddress} onChange={(e) => setLsAddress(e.target.value)} />
                    <Input placeholder="What are you doing? (e.g., Trying tacos)" value={lsActivity} onChange={(e) => setLsActivity(e.target.value)} />
                    <Textarea placeholder="Note for others..." value={lsNote} onChange={(e) => setLsNote(e.target.value)} className="h-16" />
                    <Select value={lsDuration} onValueChange={setLsDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCreateLiveShare} className="w-full bg-orange-500 hover:bg-orange-600" disabled={createLiveShareMutation.isPending}>
                      {createLiveShareMutation.isPending ? "Going live..." : "Go Live"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Live shares feed */}
            {loadingShares ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading live shares...</p>
              </div>
            ) : errorShares ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">Failed to load live shares</p>
                <p className="text-gray-400 text-sm">Please try again later</p>
              </div>
            ) : !userCity ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Set your city to see live shares</p>
                <p className="text-gray-600 dark:text-gray-500 text-sm">Add your hometown or travel destination in your profile, then you’ll see who’s sharing their location here.</p>
              </div>
            ) : liveShares.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No live location shares in {userCity} right now</p>
                <p className="text-gray-600 dark:text-gray-500 text-sm">Be the first to share where you are! Tap the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveShares.map((share: any) => (
                  <Card key={share.id} className="border border-orange-200 dark:border-orange-800 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <UserAvatar user={share.user} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{share.user?.username || "Someone"}</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-600 dark:text-green-400">{share.timeLeft}m left</span>
                            </div>
                          </div>
                          <p className="text-base font-medium text-orange-600 dark:text-orange-400">
                            <MapPin className="w-4 h-4 inline mr-1" />{share.placeName}
                          </p>
                          {share.activity && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{share.activity}</p>}
                          {share.note && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">"{share.note}"</p>}
                          {share.placeAddress && <p className="text-xs text-gray-400 mt-1">{share.placeAddress}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" className="text-xs"
                            onClick={() => reactToShareMutation.mutate({ shareId: share.id, type: "interested" })}>
                            <Heart className="w-3 h-3 mr-1" /> Interested
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs"
                            onClick={() => reactToShareMutation.mutate({ shareId: share.id, type: "omw" })}>
                            <ArrowRight className="w-3 h-3 mr-1" /> On my way
                          </Button>
                        </div>
                      </div>
                      {(share.reactionsCount || 0) > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                          <span className="text-xs text-gray-500">{share.reactionsCount} {share.reactionsCount === 1 ? "person" : "people"} interested</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== COMMUNITIES TAB ===== */}
          <TabsContent value="communities" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">Find Your People</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Join or create communities to connect with like-minded people</p>
              </div>
              <Dialog open={showCreateCommunity} onOpenChange={setShowCreateCommunity}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="w-4 h-4 mr-1" /> Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-900">
                  <DialogHeader>
                    <DialogTitle>Create a Community</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Community name" value={ccName} onChange={(e) => setCcName(e.target.value)} />
                    <Textarea placeholder="Description - what's this community about?" value={ccDesc} onChange={(e) => setCcDesc(e.target.value)} className="h-16" />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={ccCategory} onValueChange={setCcCategory}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="identity">Identity</SelectItem>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          <SelectItem value="interest">Interest</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Icon emoji" value={ccIcon} onChange={(e) => setCcIcon(e.target.value)} className="text-center text-xl" maxLength={4} />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={!!ccIsPrivate} onCheckedChange={(checked) => setCcIsPrivate(!!checked)} className="h-4 w-4 border-gray-300 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Private (password required to join)</span>
                      </label>
                    </div>
                    {ccIsPrivate && (
                      <Input placeholder="Set a password for this community" type="password" value={ccPassword} onChange={(e) => setCcPassword(e.target.value)} />
                    )}
                    <Button onClick={() => {
                      if (!ccName.trim()) { toast({ title: "Enter a community name", variant: "destructive" }); return; }
                      createCommunityMutation.mutate({
                        displayName: ccName.trim(),
                        category: ccCategory,
                        icon: ccIcon || "🏷️",
                        color: ccColor,
                        description: ccDesc.trim(),
                        isPrivate: ccIsPrivate,
                        password: ccIsPrivate ? ccPassword : undefined,
                      });
                    }} className="w-full bg-orange-500 hover:bg-orange-600" disabled={createCommunityMutation.isPending}>
                      {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* My communities - clickable to go to detail page */}
            {myCommunityTags.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Your Communities</h4>
                <div className="flex flex-wrap gap-2">
                  {myCommunityTags.map((tag: any) => (
                    <Badge key={tag.id} variant="outline" className="py-1.5 px-3 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950"
                      onClick={() => setLocation(`/community/${tag.id}`)}>
                      {tag.isPrivate && <Lock className="w-3 h-3 mr-1" />}
                      {tag.icon} {tag.displayName}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Featured preset groups (rows/columns) */}
            {featuredCommunities.length > 0 && (
              <div className="mb-2">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Featured Groups</h4>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  {featuredCommunities.map((tag: any) => {
                    const isJoined = myTagIds.has(tag.id);
                    return (
                      <Card
                        key={`featured-${tag.id}`}
                        className={`border transition-all cursor-pointer ${
                          isJoined
                            ? "border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                        }`}
                        onClick={() => {
                          if (isJoined) setLocation(`/community/${tag.id}`);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="text-xl shrink-0">{tag.icon}</div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate flex items-center gap-1">
                                {tag.displayName}
                                {tag.isPrivate && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {tag.memberCount || 0} members
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            {isJoined ? (
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/community/${tag.id}`);
                                }}
                              >
                                Open
                              </Button>
                            ) : tag.isPrivate ? (
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrivateCommunityId(tag.id);
                                }}
                              >
                                <Lock className="w-3 h-3 mr-1" /> Join
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  joinCommunityMutation.mutate({ tagId: tag.id });
                                }}
                              >
                                Join
                              </Button>
                            )}
                          </div>

                          {tag.color && (
                            <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: tag.color }} />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Browse communities */}
            {loadingTags ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading communities...</p>
              </div>
            ) : errorTags ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">Failed to load communities</p>
                <p className="text-gray-400 text-sm">Please try again later</p>
              </div>
            ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {communityTagsList.map((tag: any) => {
                const isJoined = myTagIds.has(tag.id);
                return (
                  <Card key={tag.id} className={`border transition-all ${isJoined ? "border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20" : "border-gray-200 dark:border-gray-700 hover:border-orange-300"}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <div className="text-xl sm:text-2xl cursor-pointer shrink-0" onClick={() => isJoined ? setLocation(`/community/${tag.id}`) : null}>{tag.icon}</div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isJoined ? setLocation(`/community/${tag.id}`) : null}>
                          <h4 className="font-bold text-sm flex items-center gap-1 truncate">
                            {tag.displayName}
                            {tag.isPrivate && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
                          </h4>
                          <p className="text-xs text-gray-500">{tag.memberCount || 0} members{tag.isUserCreated && " · User created"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isJoined ? (
                            <>
                              <Button size="sm" variant="ghost" className="text-xs px-1.5 sm:px-2 h-7" onClick={() => setLocation(`/community/${tag.id}`)}>
                                Open
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs px-1.5 sm:px-2 h-7" onClick={() => leaveCommunityMutation.mutate(tag.id)}>
                                Leave
                              </Button>
                            </>
                          ) : tag.isPrivate ? (
                            <Button size="sm" className="text-xs px-2 h-7 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setPrivateCommunityId(tag.id)}>
                              <Lock className="w-3 h-3 mr-1" /> Join
                            </Button>
                          ) : (
                            <Button size="sm" className="text-xs px-2 h-7 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => joinCommunityMutation.mutate({ tagId: tag.id })}>
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tag.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        {tag.color && <div className="flex-1 h-1 rounded-full mr-2" style={{ backgroundColor: tag.color }} />}
                        {tag.isUserCreated && (
                          <Button size="sm" variant="ghost" className="text-xs text-gray-400 px-1 h-6" onClick={() => setFlagCommunityId(tag.id)}>
                            <Flag className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}

            {/* Private community password dialog */}
            <Dialog open={privateCommunityId !== null} onOpenChange={(open) => { if (!open) { setPrivateCommunityId(null); setPrivatePassword(""); } }}>
              <DialogContent className="bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Private Community</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500">This community requires a password to join.</p>
                <Input placeholder="Enter password" type="password" value={privatePassword} onChange={(e) => setPrivatePassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && privateCommunityId) joinCommunityMutation.mutate({ tagId: privateCommunityId, password: privatePassword }); }} />
                <Button onClick={() => { if (privateCommunityId) joinCommunityMutation.mutate({ tagId: privateCommunityId, password: privatePassword }); }}
                  className="w-full bg-orange-500 hover:bg-orange-600" disabled={joinCommunityMutation.isPending}>
                  {joinCommunityMutation.isPending ? "Joining..." : "Join Community"}
                </Button>
              </DialogContent>
            </Dialog>

            {/* Flag community dialog */}
            <Dialog open={flagCommunityId !== null} onOpenChange={(open) => { if (!open) { setFlagCommunityId(null); setFlagReason(""); } }}>
              <DialogContent className="bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Report Community</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500">Tell us why this community should be reviewed.</p>
                <Textarea placeholder="Reason for flagging..." value={flagReason} onChange={(e) => setFlagReason(e.target.value)} className="h-20" />
                <Button onClick={() => { if (flagCommunityId) flagCommunityMutation.mutate({ tagId: flagCommunityId, reason: flagReason }); }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white" disabled={flagCommunityMutation.isPending}>
                  {flagCommunityMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* People in city — below Live / Groups */}
        {userCity && (
          <div className="mt-8 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">People in {userCity}</h2>
                {!loadingUsers && nearbyUsers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{nearbyUsers.length}</Badge>
                )}
              </div>
              {nearbyUsers.length > 6 && (
                <Button variant="ghost" size="sm" className="text-orange-500 text-xs" onClick={() => setLocation(`/city/${encodeURIComponent(userCity)}`)}>
                  See all <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            {loadingUsers ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex-shrink-0 w-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-1" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                  </div>
                ))}
              </div>
            ) : nearbyUsers.length === 0 ? (
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No users in {userCity} yet. Invite friends to join!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {nearbyUsers.filter((u: any) => u.id !== currentUser?.id).slice(0, 20).map((user: any) => (
                  <div key={user.id} className="flex-shrink-0 w-20 text-center cursor-pointer" onClick={() => setLocation(`/profile/${user.id}`)}>
                    <div className="relative mx-auto w-14 h-14 mb-1">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 dark:border-orange-600" />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg border-2 border-orange-300 dark:border-orange-600"
                             style={{ backgroundColor: user.avatarColor || "#F97316" }}>
                          {(user.username || "?")[0].toUpperCase()}
                        </div>
                      )}
                      {user.onlineStatus === "online" && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{user.username}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.userType === "business" ? "Business" : user.isCurrentlyTraveling ? "Traveler" : "Local"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
