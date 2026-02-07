import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Clock, MapPin, X, Send, Coffee, Music, Utensils, Camera, Dumbbell, Beer, ChevronDown, ChevronUp, Mountain, Bike, Waves, Compass, MessageCircle, Users, LogOut, ThumbsUp, Reply, Heart } from "lucide-react";
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
  { label: "Hike", icon: Mountain, value: "hike" },
  { label: "Bike", icon: Bike, value: "bike" },
  { label: "Beach", icon: Waves, value: "beach" },
  { label: "Sightseeing", icon: Compass, value: "sightseeing" },
];

const PREVIEW_COUNT = 3;

interface AvailableNowWidgetProps {
  currentUser: any;
  onSortByAvailableNow?: () => void;
}

export function AvailableNowWidget({ currentUser, onSortByAvailableNow }: AvailableNowWidgetProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [duration, setDuration] = useState("4");
  const [showMeetRequest, setShowMeetRequest] = useState<number | null>(null);
  const [meetMessage, setMeetMessage] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [selectedGroupChat, setSelectedGroupChat] = useState<any>(null);
  const [groupChatMessage, setGroupChatMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      const json = await res.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/active-ids"] });
      setShowSetup(false);
      toast({ title: "You're Available Now!", description: "Others in your city can see you're ready to hang out." });
    },
    onError: (error: any) => {
      console.error("Go Available error:", error);
      toast({ title: "Couldn't set availability", description: error?.message || "Please try again", variant: "destructive" });
    },
  });

  const updateActivitiesMutation = useMutation({
    mutationFn: async (data: { activities: string[] }) => {
      const res = await apiRequest("POST", "/api/available-now", {
        activities: data.activities,
        customNote: myStatus?.customNote || "",
        city: userCity,
        state: userState,
        country: userCountry,
        durationHours: 4,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/active-ids"] });
      toast({ title: "Availability cleared" });
    },
    onError: (error: any) => {
      console.error("Clear availability error:", error);
      toast({ title: "Couldn't clear availability", description: error?.message || "Please try again", variant: "destructive" });
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
    mutationFn: async ({ requestId, status, fromUserId }: { requestId: number; status: string; fromUserId?: number }) => {
      const res = await apiRequest("PATCH", `/api/available-now/requests/${requestId}`, { status });
      return res.json();
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      if (variables.status === "accepted") {
        if (data?.groupChatroomId) {
          toast({ title: "It's a meet!", description: "Opening the group chat..." });
          setTimeout(() => setShowGroupChat(true), 500);
        } else {
          const otherUserId = data?.otherUserId || variables.fromUserId;
          toast({ title: "It's a meet!", description: "Opening your chat now..." });
          if (otherUserId) {
            setTimeout(() => {
              window.history.pushState({}, '', `/messages/${otherUserId}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }, 500);
          }
        }
      } else {
        toast({ title: "Request declined" });
      }
    },
  });

  // Group chat for my Available Now session (I'm the host) - always check, even after session expires
  const { data: groupChatData } = useQuery<{ chatroom: any | null }>({
    queryKey: ["/api/available-now/group-chat"],
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  });

  // Group chats I've been accepted into (I sent the request)
  const { data: myGroupChatsData } = useQuery<{ chatrooms: any[] }>({
    queryKey: ["/api/available-now/my-group-chats"],
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  });

  const myAcceptedGroupChats = myGroupChatsData?.chatrooms || [];
  const hostGroupChat = groupChatData?.chatroom || null;

  // Combine all group chats (host's own + accepted into), deduplicated
  const allGroupChats = (() => {
    const chats: any[] = [];
    const seenIds = new Set<number>();
    if (hostGroupChat) { chats.push(hostGroupChat); seenIds.add(hostGroupChat.id); }
    for (const c of myAcceptedGroupChats) {
      if (!seenIds.has(c.id)) { chats.push(c); seenIds.add(c.id); }
    }
    return chats;
  })();

  // The active chatroom for the dialog - either explicitly selected or the first available
  const groupChatroom = selectedGroupChat || allGroupChats[0] || null;

  const { data: groupChatMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/available-now/group-chat", groupChatroom?.id, "messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/available-now/group-chat/${groupChatroom.id}/messages`);
      return res.json();
    },
    enabled: !!groupChatroom?.id && showGroupChat,
    refetchInterval: 3000,
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!groupChatroom?.id) throw new Error("No active chat");
      const body: any = { message };
      if (replyingTo) body.replyToId = replyingTo.id;
      const res = await apiRequest("POST", `/api/available-now/group-chat/${groupChatroom.id}/messages`, body);
      return res.json();
    },
    onSuccess: () => {
      setGroupChatMessage("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat", groupChatroom?.id, "messages"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send message", description: error?.message || "Please try again", variant: "destructive" });
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number; emoji: string }) => {
      if (!groupChatroom?.id) throw new Error("No active chat");
      const res = await apiRequest("POST", `/api/available-now/group-chat/${groupChatroom.id}/messages/${messageId}/react`, { emoji });
      return res.json();
    },
    onSuccess: () => {
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat", groupChatroom?.id, "messages"] });
    },
  });

  const leaveGroupChatMutation = useMutation({
    mutationFn: async () => {
      if (!groupChatroom?.id) return;
      await apiRequest("POST", `/api/available-now/group-chat/${groupChatroom.id}/leave`);
    },
    onSuccess: () => {
      setShowGroupChat(false);
      setSelectedGroupChat(null);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      toast({ title: "Left the chat" });
    },
  });

  useEffect(() => {
    if (showGroupChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupChatMessages, showGroupChat]);

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

  const otherAvailableUsers = (Array.isArray(availableUsers) ? availableUsers : []).filter(
    (u: any) => u.userId !== currentUser?.id
  );

  const handleCardClick = (userId: number) => {
    window.history.pushState({}, '', `/profile/${userId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const visibleUsers = showAllUsers ? otherAvailableUsers : otherAvailableUsers.slice(0, PREVIEW_COUNT);

  return (
    <>
    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-gray-900 dark:bg-gray-800 relative z-20">
      <div className="p-4">
        {myStatus ? (
          <div className="mb-4 rounded-xl border-2 border-green-400 dark:border-green-500 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
                <span className="text-sm font-bold text-white">You're Live!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {getTimeRemaining(myStatus.expiresAt)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={() => clearAvailableMutation.mutate()}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20">
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_OPTIONS.map(({ label, icon: Icon, value }) => {
                  const isActive = myStatus.activities?.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={updateActivitiesMutation.isPending}
                      onClick={() => {
                        const current = myStatus.activities || [];
                        const updated = isActive
                          ? current.filter((a: string) => a !== value)
                          : [...current, value];
                        updateActivitiesMutation.mutate({ activities: updated });
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                      {isActive && <X className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
              {myStatus.customNote && (
                <div className="mt-2">
                  <div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-purple-300 dark:border-purple-600">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">{myStatus.customNote}</p>
                  </div>
                </div>
              )}
              {allGroupChats.length > 0 && allGroupChats.map((chat: any) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => { setSelectedGroupChat(chat); setShowGroupChat(true); }}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  {chat.chatroomName} ({chat.participantCount} people)
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="w-full mb-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-orange-500 to-green-500 hover:from-purple-700 hover:via-orange-600 hover:to-green-600 text-white font-bold text-base text-center shadow-lg shadow-orange-500/30 cursor-pointer active:scale-[0.98] transition-all relative z-30"
          >
            <span className="flex items-center justify-center gap-2 pointer-events-none">
              <Zap className="w-5 h-5 text-yellow-300" />
              I'm Available to Hang Out
            </span>
          </button>
        )}

        {onSortByAvailableNow && (
          <Button
            size="sm"
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-2 rounded-full"
            onClick={onSortByAvailableNow}
          >
            🟢 See Who Else is Available Now
          </Button>
        )}

        {/* Show all group chats when not currently available (both host and requester chats) */}
        {!myStatus && allGroupChats.length > 0 && (
          <div className="mb-4 space-y-2">
            {allGroupChats.map((chat: any) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => { setSelectedGroupChat(chat); setShowGroupChat(true); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{chat.chatroomName}</span>
                </div>
                <Badge className="bg-blue-500 text-white text-[10px]">
                  {chat.participantCount} people
                </Badge>
              </button>
            ))}
          </div>
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
                      onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "accepted", fromUserId: req.fromUser?.id })}
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
          <div>
            {otherAvailableUsers.length > PREVIEW_COUNT && !showAllUsers && (
              <div className="mb-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {otherAvailableUsers.slice(0, 5).map((entry: any) => (
                    <div key={entry.id} className="relative w-8 h-8 rounded-full border-2 border-gray-900 dark:border-gray-800 overflow-hidden">
                      <SimpleAvatar
                        user={{ id: entry.user?.id || 0, username: entry.user?.username || "?", profileImage: entry.user?.profilePhoto }}
                        size="sm"
                        clickable={false}
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-900" />
                    </div>
                  ))}
                  {otherAvailableUsers.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-900 dark:border-gray-800 bg-gray-700 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">+{otherAvailableUsers.length - 5}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAllUsers(true)}
                  className="flex-1 text-left"
                >
                  <span className="text-xs font-semibold text-white">{otherAvailableUsers.length} people available</span>
                  <span className="text-[10px] text-gray-400 block">Tap to see everyone</span>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-orange-400 hover:text-orange-300 hover:bg-gray-800"
                  onClick={() => setShowAllUsers(true)}
                >
                  View all
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}

            <div className={`space-y-2 ${showAllUsers ? 'max-h-80 overflow-y-auto pr-1' : ''}`}>
              {visibleUsers.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700/50 transition-colors">
                  <button onClick={() => handleCardClick(entry.user.id)} className="flex-shrink-0 relative">
                    <SimpleAvatar
                      user={{ id: entry.user?.id || 0, username: entry.user?.username || "?", profileImage: entry.user?.profilePhoto }}
                      size="md"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleCardClick(entry.user.id)}
                      className="text-sm font-medium text-white hover:text-orange-500 truncate block text-left"
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
                      <div className="mt-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700">
                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 truncate">{entry.customNote}</p>
                      </div>
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

            {showAllUsers && otherAvailableUsers.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllUsers(false)}
                className="w-full mt-3 py-2 text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                Show less
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </Card>

    {showSetup && createPortal(
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 999999 }}
        onClick={() => setShowSetup(false)}
      >
        <div className="absolute inset-0 bg-black/95" />
        <div
          className="relative w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700"
          style={{ zIndex: 1000000 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            onClick={() => setShowSetup(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Set Your Availability</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Let others know you're ready to hang out</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                What are you up for?
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map(({ label, icon: Icon, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleActivity(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      selectedActivities.includes(value)
                        ? "border-orange-500 bg-orange-500/20 text-orange-300"
                        : "border-gray-600 hover:border-orange-400 text-gray-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-1.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                What I want to do now
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <Input
                placeholder='e.g. "poker", "beach volleyball", "museum visit"'
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                maxLength={100}
                className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 text-sm font-medium"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Type anything specific — this stands out on your profile</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                How long are you available?
              </label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 pr-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="6">6 hours</option>
                  <option value="8">8 hours</option>
                  <option value="12">All day (12 hours)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
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
        </div>
      </div>,
      document.body
    )}

    {/* Group Chat Dialog */}
    <Dialog open={showGroupChat} onOpenChange={(open) => { setShowGroupChat(open); if (!open) { setSelectedMessage(null); setReplyingTo(null); } }}>
      <DialogContent 
        className="max-w-lg w-[92vw] sm:w-full h-[70vh] sm:h-[600px] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 overflow-hidden"
        style={{ zIndex: 999999, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'grid', visibility: 'visible', opacity: 1 }}
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {groupChatroom?.chatroomName || "Quick Meet Chat"}
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {groupChatroom?.participantCount || 0} people · {groupChatroom?.city}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => leaveGroupChatMutation.mutate()}
              disabled={leaveGroupChatMutation.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs gap-1 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-2">
            {groupChatMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Say hello to the group!</p>
              </div>
            ) : (
              groupChatMessages.map((msg: any) => {
                const isSystem = msg.messageType === 'system';
                const isMe = msg.userId === currentUser?.id;
                const replyMsg = msg.replyToId ? groupChatMessages.find((m: any) => m.id === msg.replyToId) : null;
                const reactions = (msg.reactions || {}) as Record<string, number[]>;
                const hasReactions = Object.keys(reactions).length > 0;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-500 dark:text-gray-400">
                        {msg.message}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && msg.userProfileImage && (
                      <img 
                        src={msg.userProfileImage} 
                        alt={msg.username}
                        className="w-7 h-7 rounded-full mr-1.5 mt-4 flex-shrink-0 object-cover"
                      />
                    )}
                    {!isMe && !msg.userProfileImage && (
                      <div className="w-7 h-7 rounded-full mr-1.5 mt-4 flex-shrink-0 bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {msg.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className={`max-w-[75%] min-w-[80px]`}>
                      {!isMe && (
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5 ml-1">
                          @{msg.username}
                        </p>
                      )}

                      {replyMsg && (
                        <div className={`mx-1 mb-0.5 px-2 py-1 rounded-lg border-l-2 border-blue-400 ${
                          isMe ? 'bg-blue-400/20' : 'bg-gray-200/60 dark:bg-gray-700/60'
                        }`}>
                          <p className="text-[10px] font-semibold text-blue-500">@{replyMsg.username}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{replyMsg.message}</p>
                        </div>
                      )}

                      <div 
                        className={`px-3 py-2 rounded-2xl cursor-pointer ${
                          isMe 
                            ? 'bg-emerald-500 text-white rounded-br-sm' 
                            : 'bg-gray-700 text-white rounded-bl-sm'
                        }`}
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-0.5 ${isMe ? 'text-emerald-100' : 'text-gray-400'} text-right`}>
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>

                      {hasReactions && (
                        <div className="flex gap-1 mt-0.5 ml-1 flex-wrap">
                          {Object.entries(reactions).map(([emoji, userIds]) => {
                            const hasReacted = currentUser?.id ? userIds.includes(currentUser.id) : false;
                            return (
                              <button
                                key={emoji}
                                onClick={() => reactToMessageMutation.mutate({ messageId: msg.id, emoji })}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                                  hasReacted 
                                    ? 'bg-blue-500/20 border border-blue-500/40' 
                                    : 'bg-gray-100 dark:bg-gray-800 border border-transparent'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-500 dark:text-gray-400">{userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {replyingTo && (
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-500 font-semibold">Replying to @{replyingTo.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyingTo.message}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (groupChatMessage.trim() && !sendGroupMessageMutation.isPending) {
              sendGroupMessageMutation.mutate(groupChatMessage.trim());
            }
          }}
          className="flex-shrink-0 px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
        >
          <Input
            value={groupChatMessage}
            onChange={(e) => setGroupChatMessage(e.target.value)}
            placeholder={replyingTo ? "Reply..." : "Type a message..."}
            className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10 text-sm"
            disabled={sendGroupMessageMutation.isPending}
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            disabled={!groupChatMessage.trim() || sendGroupMessageMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 h-10 w-10 min-w-[40px] p-0 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>

    {/* Message Action Menu - Like & Reply */}
    {selectedMessage && showGroupChat && createPortal(
      <>
        <div 
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 9999998 }}
          onClick={() => setSelectedMessage(null)}
        />
        <div 
          className="fixed left-3 right-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ zIndex: 9999999, bottom: '100px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-2 space-y-0.5">
            {(() => {
              const reactions = (selectedMessage.reactions || {}) as Record<string, number[]>;
              const hasLiked = currentUser?.id ? reactions['👍']?.includes(currentUser.id) : false;
              return (
                <button
                  type="button"
                  onClick={() => reactToMessageMutation.mutate({ messageId: selectedMessage.id, emoji: '👍' })}
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'text-orange-500 fill-orange-500' : 'text-blue-500'}`} />
                  <span className="text-sm">{hasLiked ? 'Unlike' : 'Like'}</span>
                </button>
              );
            })()}

            {(() => {
              const reactions = (selectedMessage.reactions || {}) as Record<string, number[]>;
              const hasHearted = currentUser?.id ? reactions['❤️']?.includes(currentUser.id) : false;
              return (
                <button
                  type="button"
                  onClick={() => reactToMessageMutation.mutate({ messageId: selectedMessage.id, emoji: '❤️' })}
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <Heart className={`w-5 h-5 ${hasHearted ? 'text-red-500 fill-red-500' : 'text-red-400'}`} />
                  <span className="text-sm">{hasHearted ? 'Unlove' : 'Love'}</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }}
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <Reply className="w-5 h-5 text-green-500" />
              <span className="text-sm">Reply</span>
            </button>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
