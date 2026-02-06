import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Clock, MapPin, X, Send, Coffee, Music, Utensils, Camera, Dumbbell, BookOpen, ShoppingBag, Beer } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { useToast } from "@/hooks/use-toast";

interface AvailableEntry {
  id: number;
  userId: number;
  isAvailable: boolean;
  activities: string[];
  customNote: string | null;
  city: string;
  expiresAt: string;
  user: {
    id: number;
    username: string;
    fullName: string | null;
    profilePhoto: string | null;
    displayNamePreference?: string;
  };
}

interface MeetRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  message: string | null;
  status: string;
  fromUser: {
    id: number;
    username: string;
    fullName: string | null;
    profilePhoto: string | null;
  };
}

interface MyStatus {
  id: number;
  isAvailable: boolean;
  activities: string[];
  customNote: string | null;
  expiresAt: string;
}

const ACTIVITY_OPTIONS = [
  { label: "Coffee", icon: Coffee, value: "coffee" },
  { label: "Food", icon: Utensils, value: "food" },
  { label: "Drinks", icon: Beer, value: "drinks" },
  { label: "Explore", icon: Camera, value: "explore" },
  { label: "Music", icon: Music, value: "music" },
  { label: "Fitness", icon: Dumbbell, value: "fitness" },
  { label: "Study", icon: BookOpen, value: "study" },
  { label: "Shopping", icon: ShoppingBag, value: "shopping" },
];

interface AvailableNowWidgetProps {
  currentUser: any;
}

export function AvailableNowWidget({ currentUser }: AvailableNowWidgetProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [duration, setDuration] = useState("4");
  const [showMeetRequest, setShowMeetRequest] = useState<number | null>(null);
  const [meetMessage, setMeetMessage] = useState("");
  const { toast } = useToast();

  const userCity = currentUser?.hometownCity || currentUser?.city || "";
  const userState = currentUser?.hometownState || currentUser?.state || "";
  const userCountry = currentUser?.hometownCountry || currentUser?.country || "USA";

  const { data: myStatus } = useQuery<MyStatus | null>({
    queryKey: ["/api/available-now/my-status"],
    enabled: !!currentUser?.id,
  });

  const { data: availableUsers } = useQuery<AvailableEntry[]>({
    queryKey: ["/api/available-now", userCity],
    queryFn: async () => {
      const res = await fetch(`/api/available-now?city=${encodeURIComponent(userCity)}`);
      return res.json();
    },
    enabled: !!userCity,
    refetchInterval: 60000,
  });

  const { data: pendingRequests } = useQuery<MeetRequest[]>({
    queryKey: ["/api/available-now/requests"],
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });

  const setAvailableMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/available-now", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
      setShowSetup(false);
      toast({ title: "You're Available Now!", description: "Others in your city can see you're ready to hang out." });
    },
  });

  const clearAvailableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/available-now");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
      toast({ title: "Availability cleared" });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: number; message: string }) => {
      const res = await apiRequest("POST", "/api/available-now/request", { toUserId, message });
      return res.json();
    },
    onSuccess: () => {
      setShowMeetRequest(null);
      setMeetMessage("");
      toast({ title: "Meet request sent!", description: "They'll be notified right away." });
    },
  });

  const respondRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/available-now/requests/${requestId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
      toast({ title: "Response sent" });
    },
  });

  const toggleActivity = (value: string) => {
    setSelectedActivities(prev =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    );
  };

  const handleSetAvailable = () => {
    setAvailableMutation.mutate({
      activities: selectedActivities,
      customNote,
      city: userCity,
      state: userState,
      country: userCountry,
      durationHours: Number(duration),
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const otherAvailableUsers = (availableUsers || []).filter(
    (u: any) => u.userId !== currentUser?.id
  );

  const handleCardClick = (userId: number) => {
    window.history.pushState({}, '', `/profile/${userId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
      <div className="bg-gradient-to-r from-purple-600 via-orange-500 to-green-500 p-4 pb-3">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-yellow-300" />
          <h2 className="text-lg font-bold text-white">Available Now</h2>
          {otherAvailableUsers.length > 0 && (
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm ml-2">
              {otherAvailableUsers.length} nearby
            </Badge>
          )}
        </div>
        <p className="text-xs text-white/80 mt-1 text-center">See who's ready to hang out nearby</p>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800">
        {myStatus ? (
          <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-900/30 dark:to-purple-900/30 rounded-xl border border-orange-300 dark:border-orange-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">You're Live!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-800/50 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {getTimeRemaining(myStatus.expiresAt)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => clearAvailableMutation.mutate()}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {myStatus.activities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {myStatus.activities.map((a: string) => (
                  <Badge key={a} className="text-xs bg-orange-500 text-white border-0">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
            {myStatus.customNote && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">"{myStatus.customNote}"</p>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="w-full mb-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-orange-500 to-green-500 hover:from-purple-700 hover:via-orange-600 hover:to-green-600 text-white font-bold text-base text-center shadow-lg shadow-orange-500/30 cursor-pointer active:scale-[0.98] transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                I'm Available to Hang Out
              </span>
            </button>
          <Dialog open={showSetup} onOpenChange={setShowSetup}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Set Your Availability</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    What are you up for?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ACTIVITY_OPTIONS.map(({ label, icon: Icon, value }) => (
                      <button
                        key={value}
                        onClick={() => toggleActivity(value)}
                        className={`flex flex-col items-center p-2 rounded-lg border text-xs transition-colors ${
                          selectedActivities.includes(value)
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                            : "border-gray-200 dark:border-gray-700 hover:border-orange-300 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Quick note (optional)
                  </label>
                  <Input
                    placeholder="e.g. At the pier, come say hi!"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    maxLength={100}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    How long are you available?
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">All day (12 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>Visible in {userCity || "your city"}</span>
                </div>
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-orange-500 to-green-500 hover:from-purple-700 hover:via-orange-600 hover:to-green-600 text-white font-bold text-sm text-center cursor-pointer disabled:opacity-50"
                  onClick={handleSetAvailable}
                  disabled={setAvailableMutation.isPending}
                >
                  {setAvailableMutation.isPending ? "Setting..." : "Go Available"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
          </>
        )}

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              Meet Requests ({pendingRequests.length})
            </h3>
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <SimpleAvatar
                    user={{ id: req.fromUser?.id || 0, username: req.fromUser?.username || "?", profileImage: req.fromUser?.profilePhoto }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      @{req.fromUser?.username}
                    </p>
                    {req.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{req.message}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 bg-green-500 hover:bg-green-600 text-white text-xs"
                      onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "accepted" })}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "declined" })}
                    >
                      Pass
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {otherAvailableUsers.length > 0 ? (
          <div className="space-y-2">
            {otherAvailableUsers.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <button onClick={() => handleCardClick(entry.user.id)} className="flex-shrink-0">
                  <SimpleAvatar
                    user={{ id: entry.user?.id || 0, username: entry.user?.username || "?", profileImage: entry.user?.profilePhoto }}
                    size="sm"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleCardClick(entry.user.id)}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-orange-500 truncate block text-left"
                  >
                    @{entry.user?.username}
                  </button>
                  <div className="flex items-center gap-2">
                    {entry.activities?.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {entry.activities.join(", ")}
                      </span>
                    )}
                    <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">
                      {getTimeRemaining(entry.expiresAt)}
                    </span>
                  </div>
                  {entry.customNote && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{entry.customNote}</p>
                  )}
                </div>
                {showMeetRequest === entry.userId ? (
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Say hi..."
                      value={meetMessage}
                      onChange={(e) => setMeetMessage(e.target.value)}
                      className="h-7 text-xs w-24 bg-white dark:bg-gray-800"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendRequestMutation.mutate({ toUserId: entry.userId, message: meetMessage });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600"
                      onClick={() => sendRequestMutation.mutate({ toUserId: entry.userId, message: meetMessage })}
                      disabled={sendRequestMutation.isPending}
                    >
                      <Send className="w-3 h-3 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => { setShowMeetRequest(null); setMeetMessage(""); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                    onClick={() => setShowMeetRequest(entry.userId)}
                  >
                    Meet
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 px-3">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 via-orange-100 to-green-100 dark:from-purple-900/30 dark:via-orange-900/30 dark:to-green-900/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No one available in <span className="text-orange-600 dark:text-orange-400 font-semibold">{userCity || "your area"}</span> right now
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Set yourself available and others will find you!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
