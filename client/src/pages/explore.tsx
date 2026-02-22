import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Users, Zap, Coffee, Camera, UtensilsCrossed, Dumbbell, Music, Mountain, Palette, Globe, ArrowRight, Share2, Sparkles, Timer, Plus, Send, Heart, Star, ChevronRight, Flag, Lock, Trash2, AlertTriangle } from "lucide-react";
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

const CATEGORY_ICONS: Record<string, any> = {
  social: Coffee, photography: Camera, food: UtensilsCrossed, fitness: Dumbbell,
  nightlife: Music, outdoor: Mountain, culture: Palette, adventure: Zap,
};

const ENERGY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const ENERGY_LABELS: Record<string, string> = {
  low: "Chill", medium: "Moderate", high: "Active",
};

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
  const resolved = resolveCurrentCity(currentUser);
  const rawCity = resolved.city;
  const userCity = rawCity ? getMetroAreaName(rawCity) : "";
  const userCountry = resolved.country;

  const [activeTab, setActiveTab] = useState("live");
  const [showCreateLiveShare, setShowCreateLiveShare] = useState(false);
  const [showCreateExperience, setShowCreateExperience] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [energyFilter, setEnergyFilter] = useState("all");

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

  // Micro-experience form state
  const [meTitle, setMeTitle] = useState("");
  const [meDesc, setMeDesc] = useState("");
  const [meCategory, setMeCategory] = useState("social");
  const [meDuration, setMeDuration] = useState("45");
  const [meMeetingPoint, setMeMeetingPoint] = useState("");
  const [meCost, setMeCost] = useState("");
  const [meEnergy, setMeEnergy] = useState("medium");
  const [meMax, setMeMax] = useState("4");

  // Queries
  const { data: liveShares = [], isLoading: loadingShares, isError: errorShares } = useQuery<any[]>({
    queryKey: ["/api/live-shares", userCity],
    queryFn: async () => {
      const res = await fetch(`/api/live-shares?city=${encodeURIComponent(userCity)}`);
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!userCity,
  });

  const { data: myLiveShare } = useQuery<any>({
    queryKey: ["/api/live-shares/mine"],
    refetchInterval: 30000,
  });

  const { data: experiences = [], isLoading: loadingExp, isError: errorExp } = useQuery<any[]>({
    queryKey: ["/api/micro-experiences", userCity, categoryFilter, energyFilter],
    queryFn: async () => {
      let url = `/api/micro-experiences?city=${encodeURIComponent(userCity)}`;
      if (categoryFilter !== "all") url += `&category=${categoryFilter}`;
      if (energyFilter !== "all") url += `&energyLevel=${energyFilter}`;
      const res = await fetch(url);
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!userCity,
  });

  const { data: templates = [], isLoading: loadingTemplates, isError: errorTemplates } = useQuery<any[]>({
    queryKey: ["/api/activity-templates"],
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

  const { data: shareCards = [], isLoading: loadingCards, isError: errorCards } = useQuery<any[]>({
    queryKey: ["/api/share-cards"],
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
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares/mine"] });
      setShowCreateLiveShare(false);
      setLsPlace(""); setLsAddress(""); setLsActivity(""); setLsNote(""); setLsDuration("60");
      toast({ title: "You're live!", description: "People nearby can see where you are" });
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

  const createExperienceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/micro-experiences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/micro-experiences"] });
      setShowCreateExperience(false);
      setMeTitle(""); setMeDesc(""); setMeCategory("social"); setMeDuration("45");
      setMeMeetingPoint(""); setMeCost(""); setMeEnergy("medium"); setMeMax("4");
      toast({ title: "Experience created!", description: "Others can now join your activity" });
    },
  });

  const joinExperienceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/micro-experiences/${id}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/micro-experiences"] });
      toast({ title: "Joined!", description: "You're in! Check the details for meeting point" });
    },
    onError: (error: any) => {
      toast({ title: "Can't join", description: error?.message || "Experience may be full", variant: "destructive" });
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

  const handleCreateLiveShare = () => {
    if (!lsPlace) { toast({ title: "Enter a place name", variant: "destructive" }); return; }
    createLiveShareMutation.mutate({
      placeName: lsPlace,
      placeAddress: lsAddress,
      activity: lsActivity,
      note: lsNote,
      city: userCity,
      country: userCountry,
      durationMinutes: parseInt(lsDuration),
    });
  };

  const handleCreateExperience = () => {
    if (!meTitle || !meDesc || !meMeetingPoint) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    createExperienceMutation.mutate({
      title: meTitle,
      description: meDesc,
      category: meCategory,
      durationMinutes: parseInt(meDuration),
      meetingPoint: meMeetingPoint,
      city: userCity,
      country: userCountry,
      costEstimate: meCost,
      energyLevel: meEnergy,
      maxParticipants: parseInt(meMax),
    });
  };

  const useTemplate = (template: any) => {
    setMeTitle(template.title);
    setMeDesc(template.description);
    setMeCategory(template.category);
    setMeDuration(String(template.durationMinutes));
    setMeCost(template.defaultCost || "");
    setMeEnergy(template.energyLevel);
    setShowCreateExperience(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-pink-500 to-purple-600 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>
          <p className="text-white/80 text-sm">Live meetups, micro-experiences, and your people — right now in {userCity || "your city"}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Tabs first: Live, Activities, Templates, Groups, Stories — before People in city */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 gap-2 mb-4 w-full h-auto p-1.5">
            <TabsTrigger value="live" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> <span>Live</span>
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> <span>Activities</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap">
              <Star className="w-3.5 h-3.5 shrink-0" /> <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap">
              <Globe className="w-3.5 h-3.5 shrink-0" /> <span>Groups</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm whitespace-nowrap col-span-2">
              <Share2 className="w-3.5 h-3.5 shrink-0" /> <span>Stories</span>
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
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white h-14 text-lg">
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
            ) : liveShares.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No live location shares in {userCity} right now</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share where you are! Tap the button above.</p>
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
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-gray-500">{share.reactionsCount} {share.reactionsCount === 1 ? "person" : "people"} interested</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== MICRO-EXPERIENCES TAB ===== */}
          <TabsContent value="experiences" className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <Dialog open={showCreateExperience} onOpenChange={setShowCreateExperience}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-1" /> Create Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-900 max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" /> New Micro-Experience
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Activity title (e.g., Coffee walk through Arts District)" value={meTitle} onChange={(e) => setMeTitle(e.target.value)} />
                    <Textarea placeholder="What will you do? Describe the experience..." value={meDesc} onChange={(e) => setMeDesc(e.target.value)} className="h-20" />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={meCategory} onValueChange={setMeCategory}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="food">Food & Drink</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="nightlife">Nightlife</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={meEnergy} onValueChange={setMeEnergy}>
                        <SelectTrigger><SelectValue placeholder="Energy level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Chill</SelectItem>
                          <SelectItem value="medium">Moderate</SelectItem>
                          <SelectItem value="high">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={meDuration} onValueChange={setMeDuration}>
                        <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={meMax} onValueChange={setMeMax}>
                        <SelectTrigger><SelectValue placeholder="Max people" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 people</SelectItem>
                          <SelectItem value="3">3 people</SelectItem>
                          <SelectItem value="4">4 people</SelectItem>
                          <SelectItem value="6">6 people</SelectItem>
                          <SelectItem value="8">8 people</SelectItem>
                          <SelectItem value="10">10 people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="Meeting point (e.g., Outside Starbucks on 3rd St)" value={meMeetingPoint} onChange={(e) => setMeMeetingPoint(e.target.value)} />
                    <Input placeholder="Estimated cost (e.g., $10-15)" value={meCost} onChange={(e) => setMeCost(e.target.value)} />
                    <Button onClick={handleCreateExperience} className="w-full bg-purple-500 hover:bg-purple-600" disabled={createExperienceMutation.isPending}>
                      {createExperienceMutation.isPending ? "Creating..." : "Create Experience"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="photography">Photos</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="nightlife">Nightlife</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                </SelectContent>
              </Select>

              <Select value={energyFilter} onValueChange={setEnergyFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Energy</SelectItem>
                  <SelectItem value="low">Chill</SelectItem>
                  <SelectItem value="medium">Moderate</SelectItem>
                  <SelectItem value="high">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingExp ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading activities...</p>
              </div>
            ) : errorExp ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">Failed to load activities</p>
                <p className="text-gray-400 text-sm">Please try again later</p>
              </div>
            ) : experiences.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No activities happening in {userCity} right now</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Create one from a template or start your own!</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {experiences.map((exp: any) => {
                  const Icon = CATEGORY_ICONS[exp.category] || Sparkles;
                  return (
                    <Card key={exp.id} className="border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                              <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm">{exp.title}</h3>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <UserAvatar user={exp.creator} size="sm" />
                                <span>{exp.creator?.username}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={ENERGY_COLORS[exp.energyLevel] || ""}>{ENERGY_LABELS[exp.energyLevel] || exp.energyLevel}</Badge>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{exp.description}</p>

                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {exp.durationMinutes}m</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {exp.meetingPoint}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {exp.spotsLeft} spot{exp.spotsLeft !== 1 ? "s" : ""} left</span>
                          {exp.costEstimate && <span className="flex items-center gap-1">💰 {exp.costEstimate}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Starts in {exp.startsIn}m</span>
                        </div>

                        {exp.spotsLeft > 0 && exp.creatorId !== currentUser?.id ? (
                          <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                            onClick={() => joinExperienceMutation.mutate(exp.id)}
                            disabled={joinExperienceMutation.isPending}>
                            Join ({exp.currentParticipants}/{exp.maxParticipants})
                          </Button>
                        ) : exp.creatorId === currentUser?.id ? (
                          <Badge variant="outline" className="w-full justify-center py-1">Your activity</Badge>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center py-1">Full</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== TEMPLATES TAB ===== */}
          <TabsContent value="templates" className="space-y-4">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-1">Activity Templates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quick-start an activity from a template, or create your own</p>
            </div>

            {loadingTemplates ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading templates...</p>
              </div>
            ) : errorTemplates ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">Failed to load templates</p>
                <p className="text-gray-400 text-sm">Please try again later</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No templates available yet</p>
              </div>
            ) : (<>
            {/* Skill Swaps Section */}
            {templates.filter((t: any) => t.isSkillSwap).length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Skill Swaps
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {templates.filter((t: any) => t.isSkillSwap).map((template: any) => (
                    <Card key={template.id} className="border border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => useTemplate(template)}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{template.icon || "🔄"}</span>
                          <span className="font-bold text-sm">{template.title}</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-green-600 dark:text-green-400">Offer: {template.offerText}</p>
                          <p className="text-blue-600 dark:text-blue-400">Seek: {template.seekText}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Timer className="w-3 h-3" /> {template.durationMinutes}m
                          {template.defaultCost && <span>· {template.defaultCost}</span>}
                          <Badge className={`ml-auto text-[10px] ${ENERGY_COLORS[template.energyLevel]}`}>{ENERGY_LABELS[template.energyLevel]}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Templates */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.filter((t: any) => !t.isSkillSwap).map((template: any) => {
                const Icon = CATEGORY_ICONS[template.category] || Sparkles;
                return (
                  <Card key={template.id} className="border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                    onClick={() => useTemplate(template)}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{template.icon || "📋"}</span>
                        <span className="font-bold text-sm">{template.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Timer className="w-3 h-3" /> {template.durationMinutes}m
                        {template.defaultCost && <span>· {template.defaultCost}</span>}
                        <Badge className={`ml-auto text-[10px] ${ENERGY_COLORS[template.energyLevel]}`}>{ENERGY_LABELS[template.energyLevel]}</Badge>
                      </div>
                      {template.usageCount > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1">{template.usageCount} times used</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            </>)}
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

          {/* ===== SHARE CARDS TAB ===== */}
          <TabsContent value="cards" className="space-y-4">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-1">Meetup Stories</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shareable moments from real meetups — proof it happened!</p>
            </div>

            {loadingCards ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading stories...</p>
              </div>
            ) : errorCards ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">Failed to load stories</p>
                <p className="text-gray-400 text-sm">Please try again later</p>
              </div>
            ) : shareCards.length === 0 ? (
              <div className="text-center py-12">
                <Share2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No meetup stories yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">After meeting someone, create a shareable card to remember the moment!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {shareCards.map((card: any) => (
                  <Card key={card.id} className="overflow-hidden border-2 border-orange-200 dark:border-orange-800">
                    <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white text-center">
                      <p className="text-xs font-medium opacity-80 mb-2">We just met on Nearby Traveler</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <UserAvatar user={card.user1} size="lg" />
                          <p className="text-sm font-bold mt-1">{card.user1?.username}</p>
                          <p className="text-xs">{card.user1Flag} {card.user1Country}</p>
                        </div>
                        <div className="text-2xl">🤝</div>
                        <div className="text-center">
                          <UserAvatar user={card.user2} size="lg" />
                          <p className="text-sm font-bold mt-1">{card.user2?.username}</p>
                          <p className="text-xs">{card.user2Flag} {card.user2Country}</p>
                        </div>
                      </div>
                      {card.placeName && (
                        <p className="text-xs mt-3 opacity-80">at {card.placeName}, {card.city}</p>
                      )}
                    </div>
                    <CardContent className="p-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{new Date(card.createdAt).toLocaleDateString()}</span>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Share2 className="w-3 h-3 mr-1" /> Share
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* People in city — below Live / Activities / Templates / Groups */}
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
