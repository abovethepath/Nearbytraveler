import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Heart, ArrowRight } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";

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

export function LivePresenceWidget({ cityName, country }: { cityName: string; country?: string }) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [lsPlace, setLsPlace] = useState("");
  const [lsAddress, setLsAddress] = useState("");
  const [lsActivity, setLsActivity] = useState("");
  const [lsNote, setLsNote] = useState("");
  const [lsDuration, setLsDuration] = useState("60");

  const { data: liveShares = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/live-shares", cityName],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers["x-user-id"] = String(currentUser.id);
      const res = await fetch(`${getApiBaseUrl()}/api/live-shares?city=${encodeURIComponent(cityName)}`, { credentials: "include", headers });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
    enabled: !!cityName,
  });

  const { data: myLiveShare } = useQuery<any>({
    queryKey: ["/api/live-shares/mine"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers["x-user-id"] = String(currentUser.id);
      const res = await fetch(`${getApiBaseUrl()}/api/live-shares/mine`, { credentials: "include", headers });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/live-shares", data);
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares/mine"] });
      setShowCreate(false);
      setLsPlace(""); setLsAddress(""); setLsActivity(""); setLsNote(""); setLsDuration("60");
      toast({ title: "You're live!", description: "People nearby can see where you are" });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't go live", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("DELETE", "/api/live-shares"); return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares/mine"] });
      toast({ title: "Live share cleared" });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ shareId, type }: { shareId: number; type: string }) => {
      const res = await apiRequest("POST", `/api/live-shares/${shareId}/react`, { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-shares"] });
      toast({ title: "Reaction sent!" });
    },
  });

  const handleCreate = () => {
    if (!lsPlace) { toast({ title: "Enter a place name", variant: "destructive" }); return; }
    createMutation.mutate({
      placeName: lsPlace.trim(),
      placeAddress: lsAddress.trim() || undefined,
      activity: lsActivity.trim() || undefined,
      note: lsNote.trim() || undefined,
      city: cityName.trim(),
      country: (country || "USA").trim(),
      durationMinutes: parseInt(lsDuration, 10) || 60,
    });
  };

  return (
    <div className="space-y-3">
      {/* Active share banner */}
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
              <Button variant="outline" size="sm" onClick={() => clearMutation.mutate()}>End</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Go live button */}
      {!myLiveShare && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white h-12 text-base font-bold">
              <MapPin className="w-5 h-5 mr-2" /> I'm here in {cityName} right now
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
              <Button onClick={handleCreate} className="w-full bg-orange-500 hover:bg-orange-600" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Going live..." : "Go Live"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Live shares feed */}
      {liveShares.length > 0 && (
        <div className="space-y-2">
          {liveShares.map((share: any) => (
            <Card key={share.id} className="border border-orange-200 dark:border-orange-800 overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <UserAvatar user={share.user} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{share.user?.username || "Someone"}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 dark:text-green-400">{share.timeLeft}m left</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />{share.placeName}
                    </p>
                    {share.activity && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{share.activity}</p>}
                    {share.note && <p className="text-[11px] text-gray-500 mt-0.5 italic">"{share.note}"</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="text-[10px] h-7 px-2"
                      onClick={() => reactMutation.mutate({ shareId: share.id, type: "interested" })}>
                      <Heart className="w-3 h-3 mr-0.5" /> Interested
                    </Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-7 px-2"
                      onClick={() => reactMutation.mutate({ shareId: share.id, type: "omw" })}>
                      <ArrowRight className="w-3 h-3 mr-0.5" /> OMW
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
