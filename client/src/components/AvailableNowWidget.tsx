import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/displayName";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Clock, MapPin, X, Send, Coffee, Music, Utensils, Camera, Dumbbell, Beer, ChevronDown, ChevronUp, Mountain, Bike, Waves, Compass, MessageCircle, Users, LogOut, ThumbsUp, Reply, Heart } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { useToast } from "@/hooks/use-toast";
import { websocketService } from "@/services/websocketService";
import { getMetroAreaName } from "@shared/metro-areas";

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
  const [, setLocation] = useLocation();
  const [showPicker, setShowPicker] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showImOut, setShowImOut] = useState(false);
  const [dismissedChats, setDismissedChats] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('nt_dismissed_meetup_chats');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const dismissChat = (chatId: number) => {
    setDismissedChats(prev => {
      const next = new Set(prev).add(chatId);
      localStorage.setItem('nt_dismissed_meetup_chats', JSON.stringify([...next]));
      return next;
    });
  };
  const [liveExpanded, setLiveExpanded] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [duration, setDuration] = useState("4");
  const [openJoin, setOpenJoin] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [localPendingUserIds, setLocalPendingUserIds] = useState<Set<number>>(new Set());
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [selectedGroupChat, setSelectedGroupChat] = useState<any>(null);
  const [groupChatMessage, setGroupChatMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Available Now is location-based: show who's available in the city you're physically in RIGHT NOW.
  // Travelers see their destination city. Locals see their hometown. Never both.
  const isTraveling = (currentUser as any)?.isCurrentlyTraveling;

  // effectiveUser from home.tsx stores the destination as a combined "City, State" string in
  // `travelDestination`. Raw DB user records use separate `destinationCity` / `destination_city`
  // fields. We need to handle both shapes so a freshly-created trip works immediately.
  const rawTravelDest = (currentUser as any)?.travelDestination || "";
  const rawDestParts  = rawTravelDest ? rawTravelDest.split(',') : [];
  const destCity    = (currentUser as any)?.destinationCity   || (currentUser as any)?.destination_city   || rawDestParts[0]?.trim() || null;
  const destState   = (currentUser as any)?.destinationState  || (currentUser as any)?.destination_state  || rawDestParts[1]?.trim() || null;
  const destCountry = (currentUser as any)?.destinationCountry || (currentUser as any)?.destination_country || rawDestParts[2]?.trim() || null;

  // Available Now location: default to hometown, let user switch to destination if traveling
  const homeCity    = currentUser?.hometownCity    || currentUser?.city    || "";
  const homeState   = currentUser?.hometownState   || currentUser?.state   || "";
  const homeCountry = currentUser?.hometownCountry || currentUser?.country || "USA";
  const hasDestination = isTraveling && !!destCity && destCity.toLowerCase() !== homeCity.toLowerCase();
  const [availCity, setAvailCity] = useState<'home' | 'trip'>('home');
  // Store the RAW city (not metro name) — the server's metro detection handles grouping.
  // Storing "Los Angeles Metro" breaks ilike matching since it's not in the metro city list.
  const userCity    = (availCity === 'trip' && hasDestination) ? destCity!    : homeCity;
  const userState   = (availCity === 'trip' && hasDestination) ? (destState || "")  : homeState;
  const userCountry = (availCity === 'trip' && hasDestination) ? (destCountry || "USA") : homeCountry;

  const { data: myStatus } = useQuery<MyStatus | null>({
    queryKey: ["/api/available-now/my-status"],
    enabled: !!currentUser?.id,
  });

  const { data: availableUsers, refetch: refetchAvailableUsers } = useQuery<AvailableEntry[]>({
    queryKey: ["/api/available-now", userCity],
    queryFn: async () => {
      const res = await fetch(`/api/available-now?city=${encodeURIComponent(userCity)}`);
      return res.json();
    },
    enabled: !!userCity,
    refetchInterval: 20000,
  });

  const { data: pendingRequests } = useQuery<MeetRequest[]>({
    queryKey: ["/api/available-now/requests"],
    enabled: !!currentUser?.id,
    refetchInterval: 4000,
  });

  const { data: sentRequestsData } = useQuery<{ sentToUserIds: number[] }>({
    queryKey: ["/api/available-now/sent-requests"],
    enabled: !!currentUser?.id,
    refetchInterval: 5000,
  });

  const { data: acceptedRequestsData } = useQuery<{ acceptedChatroomMap: Record<number, number> }>({
    queryKey: ["/api/available-now/accepted-requests"],
    enabled: !!currentUser?.id,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: 500,
  });

  const acceptedChatroomMap: Record<number, number> = acceptedRequestsData?.acceptedChatroomMap || {};

  const normalizeDurationHours = (hours: number) => {
    const allowed = [1, 2, 4, 6, 8, 12];
    const h = Math.max(1, Math.min(12, Math.round(hours)));
    // Pick the closest allowed bucket.
    let best = allowed[0];
    let bestDist = Math.abs(h - best);
    for (const a of allowed) {
      const d = Math.abs(h - a);
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  };

  const getDurationFromExpiresAt = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 4;
    const exp = new Date(expiresAt);
    const ms = exp.getTime() - Date.now();
    if (!Number.isFinite(ms)) return 4;
    const hoursLeft = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
    return normalizeDurationHours(hoursLeft);
  };

  // Merge DB-loaded sent requests with locally tracked ones for instant UI feedback
  const pendingToUserIds: Set<number> = new Set([
    ...(sentRequestsData?.sentToUserIds ?? []),
    ...localPendingUserIds,
  ]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
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
        durationHours: getDurationFromExpiresAt(myStatus?.expiresAt),
        preserveChatrooms: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
    },
  });

  const openEditAvailability = () => {
    if (!myStatus) return;
    setSelectedActivities(Array.isArray(myStatus.activities) ? myStatus.activities : []);
    setCustomNote(myStatus.customNote || "");
    setDuration(String(getDurationFromExpiresAt(myStatus.expiresAt)));
    setShowSetup(true);
  };

  const clearAvailableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/available-now");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-now"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/active-ids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      toast({ title: "Availability cleared" });
    },
    onError: (error: any) => {
      console.error("Clear availability error:", error);
      toast({ title: "Couldn't clear availability", description: error?.message || "Please try again", variant: "destructive" });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async ({ toUserId }: { toUserId: number }) => {
      const res = await apiRequest("POST", "/api/available-now/request", { toUserId, message: "" });
      if (res.status === 409) {
        // Already sent — treat as success so the button updates to Pending
        return { alreadySent: true, toUserId };
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Immediately mark this user as pending in local state for instant UI feedback
      setLocalPendingUserIds(prev => new Set([...prev, variables.toUserId]));
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/sent-requests"] });
      const alreadySent = (_data as any)?.alreadySent;
      toast({
        title: alreadySent ? "Already requested" : "Join request sent!",
        description: alreadySent ? "You already sent a request to this person." : "They'll be notified right away.",
      });
    },
  });

  const respondRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, fromUserId }: { requestId: number; status: string; fromUserId?: number }) => {
      console.log(`[MEET ACCEPT] Attempting to ${status} request ${requestId}`);
      setPendingRequestId(requestId);
      const res = await apiRequest("PATCH", `/api/available-now/requests/${requestId}`, { status });
      const data = await res.json();
      console.log(`[MEET ACCEPT] Response:`, data);
      return data;
    },
    onSuccess: (data: any, variables) => {
      console.log(`[MEET ACCEPT] onSuccess fired`, { data, variables });
      setPendingRequestId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/accepted-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-feed"] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", currentUser.id] });
      }
      if (variables.status === "accepted") {
        if (data?.groupChatroomId) {
          queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
          // Race-condition fix: poll the chatroom info endpoint up to 5 times at
          // 600ms intervals before navigating. The chatroom page itself also has
          // retry logic, but this prevents any visible flash on the acceptor side.
          const waitForChatroomReady = async (chatroomId: number) => {
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                const headers: Record<string, string> = {};
                if (currentUser?.id) headers["x-user-id"] = String(currentUser.id);
                const res = await fetch(`/api/meetup-chatrooms/${chatroomId}/info`, {
                  credentials: "include",
                  headers,
                });
                if (res.ok) {
                  const json = await res.json().catch(() => ({}));
                  if (json && (json as any).id) return true;
                }
              } catch {
                // retry
              }
              await new Promise((r) => setTimeout(r, 600));
            }
            return false;
          };
          // Navigate directly to the meetup chatroom page (NOT messages) so it
          // always opens the correct group chat regardless of current page state.
          // The meetup-chatroom-chat page has its own retry mechanism for any
          // remaining transient errors, so no error flash will be visible.
          const title = encodeURIComponent(data.chatroomName || 'Meetup Chat');
          const subtitle = encodeURIComponent(data.chatroomCity || 'Group chat');
          toast({ title: "✅ You're in!", description: "Setting up your group chat…" });
          void waitForChatroomReady(Number(data.groupChatroomId)).then((ok) => {
            if (!ok) {
              // Navigate anyway — the chat page's own retry logic will handle it
              setLocation(`/meetup-chatroom-chat/${data.groupChatroomId}?title=${title}&subtitle=${subtitle}`);
              return;
            }
            setLocation(`/meetup-chatroom-chat/${data.groupChatroomId}?title=${title}&subtitle=${subtitle}`);
          });
        } else {
          toast({ title: "✅ You're in!", description: "Go to the group chat to coordinate." });
        }
      } else {
        toast({ title: "Request declined" });
      }
    },
    onError: (error: any) => {
      console.error(`[MEET ACCEPT] onError:`, error);
      setPendingRequestId(null);
      const msg: string = error?.message || "";
      let detail = "";
      let serverError = "";
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(msg.slice(jsonStart));
          detail = parsed?.detail || "";
          serverError = parsed?.error || "";
        }
      } catch {}
      console.error(`[MEET ACCEPT] server error: "${serverError}" detail: "${detail || "(none)"}"`);
      if (msg.includes("expired") || msg.includes("Expired") || serverError.includes("expired")) {
        queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
        toast({ title: "Session expired", description: "Your Available Now session has ended. This meet request is no longer valid.", variant: "destructive" });
      } else if (msg.includes("not found") || msg.includes("not yours")) {
        toast({ title: "Request not found", description: "This meet request may have already been handled.", variant: "destructive" });
      } else {
        toast({ title: "Couldn't process request", description: detail || serverError || "Please try again.", variant: "destructive" });
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
    retry: 3,
    retryDelay: 500,
  });

  const myAcceptedGroupChats = myGroupChatsData?.chatrooms || [];
  const hostGroupChat = groupChatData?.chatroom || null;

  const isCurrentUserMutedInChat = (chat: any) => {
    if (!currentUser?.id || !chat.members) return false;
    const me = chat.members.find((m: any) => Number(m.userId) === currentUser.id);
    return me?.isMuted === true;
  };

  const allGroupChats = (() => {
    const chats: any[] = [];
    const seenIds = new Set<number>();
    const now = new Date();
    const isValidChat = (c: any) => {
      if (!c || seenIds.has(c.id)) return false;
      if (c.isActive === false) return false;
      if (dismissedChats.has(c.id)) return false;
      if (!isCurrentUserMutedInChat(c) === false) return false;
      if (c.lifecycleState && c.lifecycleState !== 'active') return false;
      // Check chatroom expiry
      if (c.expiresAt && new Date(c.expiresAt) <= now) return false;
      // Check linked session expiry (createdAt + 12h as fallback)
      if (c.createdAt) {
        const chatAge = now.getTime() - new Date(c.createdAt).getTime();
        if (chatAge > 24 * 60 * 60 * 1000) return false; // 24h hard cutoff
      }
      return true;
    };
    if (hostGroupChat && isValidChat(hostGroupChat)) {
      chats.push(hostGroupChat);
      seenIds.add(hostGroupChat.id);
    }
    for (const c of myAcceptedGroupChats) {
      if (isValidChat(c)) {
        chats.push(c);
        seenIds.add(c.id);
      }
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

  // Listen for WebSocket notifications to instantly react to meet request events
  // (both incoming requests for the host AND accepted/declined for the requester).
  useEffect(() => {
    const handleNotification = (notification: any) => {
      // HOST side: a new meet request just arrived — invalidate immediately so
      // the pending-requests panel refreshes without waiting for the poll.
      if (notification?.type === 'available_now_meet_request') {
        queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/available-now", userCity] });
        return;
      }

      // REQUESTER side: the host accepted or declined our request.
      // Delay invalidation so the server has time to finish creating the chatroom
      // before User B's queries refetch — prevents a brief error flash.
      if (notification?.action === 'meet_request_accepted') {
        const chatroomId = notification.groupChatroomId;
        if (chatroomId) {
          toast({
            title: "Meet request accepted! 🤝",
            description: "Tap to open the group chat",
            duration: 10000,
          });
          // Navigate to chatroom after a brief delay so the toast is visible
          setTimeout(() => setLocation(`/meetup-chatroom-chat/${chatroomId}?title=${encodeURIComponent('Meetup Chat')}`), 1500);
        } else {
          toast({ title: "Meet request accepted! 🤝", description: "Check your messages." });
        }
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/available-now/sent-requests"] });
          queryClient.invalidateQueries({ queryKey: ["/api/available-now/requests"] });
          queryClient.invalidateQueries({ queryKey: ["/api/available-now/accepted-requests"] });
          queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
        }, 800);
      }
    };
    websocketService.on('notification', handleNotification);
    return () => { websocketService.off('notification', handleNotification); };
  }, [toast, setLocation, userCity]);

  // Invalidate group-chat queries when the current user is removed from a meetup chatroom
  useEffect(() => {
    const handleChatEvent = (event: any) => {
      const type = event?.type;
      if (type === 'chatroom:dissolved' || type === 'member:left') {
        queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
        queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      }
    };
    websocketService.on('chat_event', handleChatEvent);
    return () => { websocketService.off('chat_event', handleChatEvent); };
  }, []);

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
      openJoin,
      // When editing an existing session, preserve the existing meetup chatrooms.
      preserveChatrooms: !!myStatus,
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

  const getActivityPillClass = (activity: string) => {
    const map: Record<string, string> = {
      drinks:     "bg-orange-900/60 text-orange-300 border-orange-700/50",
      coffee:     "bg-amber-900/60 text-amber-300 border-amber-700/50",
      food:       "bg-yellow-900/60 text-yellow-300 border-yellow-700/50",
      hike:       "bg-green-900/60 text-green-300 border-green-700/50",
      outdoor:    "bg-green-900/60 text-green-300 border-green-700/50",
      bike:       "bg-sky-900/60 text-sky-300 border-sky-700/50",
      beach:      "bg-cyan-900/60 text-cyan-300 border-cyan-700/50",
      music:      "bg-purple-900/60 text-purple-300 border-purple-700/50",
      nightlife:  "bg-pink-900/60 text-pink-300 border-pink-700/50",
      sports:     "bg-red-900/60 text-red-300 border-red-700/50",
      sightseeing:"bg-indigo-900/60 text-indigo-300 border-indigo-700/50",
      cultural:   "bg-indigo-900/60 text-indigo-300 border-indigo-700/50",
    };
    return map[activity.toLowerCase()] ?? "bg-gray-800 text-gray-300 border-gray-700";
  };

  const MemberAvatarStack = ({ members, max = 5 }: { members: any[]; max?: number }) => {
    if (!members || members.length === 0) return null;
    const visible = members.slice(0, max);
    const extra = members.length - max;
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex">
          {visible.map((m: any, i: number) => (
            <div
              key={m.userId || i}
              title={m.firstName || m.username}
              className="w-6 h-6 rounded-full border-2 border-gray-900 overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center"
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: max - i }}
            >
              {m.profilePhoto
                ? <img src={m.profilePhoto} alt={m.firstName || m.username || ''} className="w-full h-full object-cover" />
                : <span className="text-[9px] font-bold text-white">{(m.firstName || m.username || '?')[0].toUpperCase()}</span>
              }
            </div>
          ))}
          {extra > 0 && (
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center flex-shrink-0"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              <span className="text-[9px] font-bold text-gray-300">+{extra}</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {members.length === 1 ? '1 person in this chat' : `${members.length} people in this chat`}
        </span>
      </div>
    );
  };

  const now = Date.now();

  // Build the set of user IDs the current user is already in an active meetup chat with.
  // This covers both directions:
  //   - acceptedChatroomMap keys: users who accepted the current user's request (requester view)
  //   - allGroupChats members: everyone in any active chatroom the current user belongs to (host + requester view)
  const matchedUserIds = new Set<number>();
  for (const uid of Object.keys(acceptedChatroomMap)) {
    matchedUserIds.add(Number(uid));
  }
  for (const chat of allGroupChats) {
    for (const member of (chat.members || [])) {
      if (Number(member.userId) !== currentUser?.id) {
        matchedUserIds.add(Number(member.userId));
      }
    }
  }

  const otherAvailableUsers = (Array.isArray(availableUsers) ? availableUsers : []).filter(
    (u: any) =>
      u.userId !== currentUser?.id &&
      (!u.expiresAt || new Date(u.expiresAt).getTime() > now) &&
      !matchedUserIds.has(Number(u.userId))
  );

  const handleCardClick = (userId: number) => {
    window.history.pushState({}, '', `/profile/${userId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const visibleUsers = showAllUsers ? otherAvailableUsers : otherAvailableUsers.slice(0, PREVIEW_COUNT);

  return (
    <>
    <Card className="overflow-hidden shadow-lg rounded-2xl bg-white border border-gray-200 dark:border-0 dark:bg-gray-800 relative z-20">
      <div className="p-4">
        {myStatus && (!myStatus.expiresAt || new Date(myStatus.expiresAt).getTime() > now) ? (
          <div className="mb-4 overflow-hidden rounded-2xl p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700">
            <div
              className="cursor-pointer"
              onClick={() => setLiveExpanded(!liveExpanded)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-400/50 flex-shrink-0" />
                  <span className="flex-shrink-0 text-emerald-800 dark:text-emerald-300" style={{ fontSize: '15px', fontWeight: 700 }}>You're Live</span>
                  <span className="px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/40" style={{ fontSize: '10px', fontWeight: 600 }}>
                    <Clock className="w-2.5 h-2.5" />
                    {getTimeRemaining(myStatus.expiresAt)}
                  </span>
                </div>
                {!liveExpanded && (() => {
                  const activities = (myStatus.activities || []).map((a: string) => {
                    const opt = ACTIVITY_OPTIONS.find(o => o.value === a);
                    return opt?.label || a;
                  });
                  return (
                    <div className="flex flex-wrap items-center gap-1">
                      {activities.map((label: string, i: number) => (
                        <span key={i} className="text-white px-2 py-0.5 rounded-full whitespace-nowrap" style={{ fontSize: '10px', fontWeight: 600, backgroundColor: '#FF6B35' }}>{label}</span>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                  <button
                    type="button"
                    className="h-5 px-2 flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                    style={{ color: '#065F46', backgroundColor: 'rgba(6,95,70,0.08)', border: '1px solid rgba(6,95,70,0.18)' }}
                    onClick={(e) => { e.stopPropagation(); openEditAvailability(); }}
                    data-testid="button-edit-availability"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="h-5 w-5 p-0 flex items-center justify-center rounded flex-shrink-0"
                    style={{ color: '#065F46' }}
                    onClick={(e) => { e.stopPropagation(); setLiveExpanded(!liveExpanded); }}
                  >
                    {liveExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="h-5 w-5 p-0 flex items-center justify-center rounded flex-shrink-0"
                    style={{ color: '#065F46' }}
                    onClick={(e) => { e.stopPropagation(); clearAvailableMutation.mutate(); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {liveExpanded && (
              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-white/[0.08]">
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
                            ? "text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.08]"
                        }`}
                        style={isActive ? { backgroundColor: '#FF6B35' } : undefined}
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
                    <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="text-xs font-semibold text-gray-300">{myStatus.customNote}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Prominent stop button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearAvailableMutation.mutate(); }}
              disabled={clearAvailableMutation.isPending}
              className="w-full mt-3 py-2 px-4 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-800 transition-colors"
            >
              {clearAvailableMutation.isPending ? "Stopping..." : "No Longer Available"}
            </button>
            {allGroupChats.length > 0 && allGroupChats.map((chat: any) => (
              <div
                key={chat.id}
                className="pt-3 mt-3 border-t border-gray-200 dark:border-white/[0.08]"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">{chat.chatroomName}</span>
                  <button
                    type="button"
                    onClick={() => setLocation(`/meetup-chatroom-chat/${chat.id}?title=${encodeURIComponent(chat.chatroomName || 'Meetup Chat')}`)}
                    className="text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    Open
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); dismissChat(chat.id); }} className="text-gray-400 hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-700/50 flex-shrink-0" aria-label="Dismiss">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <MemberAvatarStack members={chat.members || []} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-gray-200 p-3 dark:bg-gray-900/40 dark:border-gray-800">
            {!showPicker ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="available-now-primary-cta available-now-heartbeat w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-bold text-base text-center border border-gray-200 shadow-sm cursor-pointer active:scale-[0.98] transition-all relative z-30 dark:border-transparent dark:bg-gradient-to-r dark:from-purple-600 dark:via-orange-500 dark:to-green-500 dark:hover:from-purple-700 dark:hover:via-orange-600 dark:hover:to-green-600 dark:text-white dark:shadow-lg dark:shadow-orange-500/30"
                >
                  <span className="flex items-center justify-center gap-2 pointer-events-none">
                    <Zap className="w-5 h-5 text-yellow-300 available-now-zap" />
                    ⚡ Available Now
                  </span>
                </button>

                {onSortByAvailableNow && (
                  <Button
                    size="sm"
                    className="available-now-secondary-cta w-full mt-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs py-2 rounded-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-transparent"
                    onClick={() => { refetchAvailableUsers(); onSortByAvailableNow(); }}
                  >
                    🟢 See Who's Available Now
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-end -mt-1 -mr-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-gray-700/50 transition-colors"
                    aria-label="Back"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  // MODAL FIX: do not change this modal target — opens "I'm Free" setup modal
                  onClick={() => { setShowPicker(false); setShowSetup(true); }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-gray-900 font-semibold text-sm text-left border border-emerald-200 cursor-pointer active:scale-[0.98] transition-all dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-white dark:border-emerald-700"
                >
                  🏠 I'm Free — Open to Plans
                </button>
                <button
                  type="button"
                  // MODAL FIX: do not change — opens "I'm Out" QuickMeetupWidget directly inline
                  onClick={() => { setShowPicker(false); setShowImOut(true); }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-gray-900 font-semibold text-sm text-left border border-blue-200 cursor-pointer active:scale-[0.98] transition-all dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-white dark:border-blue-700"
                >
                  📍 I'm Out — Come Join Me
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show all group chats when not currently available (both host and requester chats) */}
        {!myStatus && allGroupChats.length > 0 && (
          <div className="mb-4 space-y-2">
            {allGroupChats.map((chat: any) => (
              <div
                key={chat.id}
                className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLocation(`/meetup-chatroom-chat/${chat.id}?title=${encodeURIComponent(chat.chatroomName || 'Meetup Chat')}`)}
                    className="flex-1 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors text-left min-w-0"
                  >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{chat.chatroomName}</span>
                  </button>
                  <Badge className="bg-blue-500 text-white text-[10px] flex-shrink-0 cursor-pointer" onClick={() => setLocation(`/meetup-chatroom-chat/${chat.id}?title=${encodeURIComponent(chat.chatroomName || 'Meetup Chat')}`)}>
                    Go to Chat
                  </Badge>
                  <button type="button" onClick={(e) => { e.stopPropagation(); dismissChat(chat.id); }} className="text-gray-400 hover:text-red-400 p-0.5 rounded-full hover:bg-gray-700/50 flex-shrink-0" aria-label="Dismiss">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {chat.members?.length > 0 && (
                  <MemberAvatarStack members={chat.members} />
                )}
              </div>
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
                    user={{ id: req.fromUser?.id || 0, username: req.fromUser?.username || "?", profileImage: req.fromUser?.profileImage }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getDisplayName(req.fromUser) || `@${req.fromUser?.username}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                      onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "accepted", fromUserId: req.fromUser?.id })}
                      disabled={pendingRequestId === req.id || respondRequestMutation.isPending}
                    >
                      {pendingRequestId === req.id ? "..." : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "declined" })}
                      disabled={pendingRequestId === req.id}
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
                <div
                  key={entry.id}
                  data-testid="available-now-entry-card"
                  className="rounded-xl border border-orange-500/35 bg-gradient-to-br from-gray-900 via-amber-950/25 to-gray-900 shadow-[0_0_14px_rgba(251,146,60,0.12)] overflow-hidden"
                >
                  {/* Top bar: Live Now badge + countdown timer */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live Now</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/70 flex-shrink-0" />
                      <span className="text-xs font-bold text-white">{getTimeRemaining(entry.expiresAt)}</span>
                    </div>
                  </div>

                  {/* User row: avatar + name + activities */}
                  <div className="flex items-center gap-3 px-3 pb-2">
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
                        className="text-sm font-semibold text-white hover:text-orange-400 truncate block text-left"
                      >
                        {getDisplayName(entry.user) || `@${entry.user?.username}`}
                      </button>
                      {entry.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.activities.map((act: string) => (
                            <span
                              key={act}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActivityPillClass(act)}`}
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.customNote && (
                        <div className="mt-1.5 px-2 py-1 bg-purple-950/50 rounded border border-purple-700/40">
                          <p className="text-xs font-semibold text-purple-300 truncate">{entry.customNote}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meet button — full width at bottom */}
                  <div className="px-3 pb-3">
                    {(() => {
                      const existingChat = allGroupChats.find((chat: any) => chat.availableNowId === entry.id);
                      const acceptedChatroomId = acceptedChatroomMap[entry.userId];
                      if (existingChat) {
                        return (
                          <div>
                            {existingChat.members?.length > 0 && (
                              <MemberAvatarStack members={existingChat.members} />
                            )}
                            <Button
                              size="sm"
                              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-bold mt-2"
                              onClick={() => setLocation(`/meetup-chatroom-chat/${existingChat.id}?title=${encodeURIComponent(existingChat.chatroomName || 'Meetup Chat')}&subtitle=${encodeURIComponent(existingChat.city || 'Group chat')}`)}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Go to Chat
                            </Button>
                          </div>
                        );
                      }
                      if (acceptedChatroomId) {
                        return (
                          <Button
                            size="sm"
                            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-bold"
                            onClick={() => setLocation(`/meetup-chatroom-chat/${acceptedChatroomId}?title=${encodeURIComponent('Meetup Chat')}&subtitle=${encodeURIComponent(userCity || 'Group chat')}`)}
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Go to Chat
                          </Button>
                        );
                      }
                      if (pendingToUserIds.has(entry.userId)) {
                        return (
                          <Button
                            size="sm"
                            disabled
                            className="w-full text-xs bg-gray-700 text-gray-400 border-0 cursor-not-allowed"
                          >
                            Pending ⏳
                          </Button>
                        );
                      }
                      // Join button removed — the green Join on the AvailableNowStrip card handles this
                      return null;
                    })()}
                  </div>
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
          style={{ zIndex: 1000000, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {myStatus ? "Edit Your Availability" : "I'm Free — Set Your Availability"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {myStatus ? "Update your activities, note, or time window" : "Let others know you're ready to hang out"}
            </p>
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
                        ? "border-orange-400 bg-orange-500 text-white font-semibold shadow-md"
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
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger
                  className="w-full h-10 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-orange-500"
                  style={{ touchAction: 'manipulation' }}
                >
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="z-[2147483647]">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="12">All day (12 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Open Join toggle */}
            <div className="flex items-center justify-between py-2 px-1">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All are welcome</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">People can join without requesting — no approval needed</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenJoin(!openJoin)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  openJoin ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={openJoin}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  openJoin ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {/* City selector — shown when user has a travel destination */}
            {hasDestination ? (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Where are you right now?
                </label>
                <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setAvailCity('home')}
                    className={`flex-1 px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                      availCity === 'home'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <MapPin className="w-3 h-3" /> {getMetroAreaName(homeCity)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailCity('trip')}
                    className={`flex-1 px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                      availCity === 'trip'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    ✈️ {destCity}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>Visible in {userCity ? getMetroAreaName(userCity) : "your city"}</span>
              </div>
            )}
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-bold text-sm text-center cursor-pointer disabled:opacity-50 dark:border-transparent dark:bg-gradient-to-r dark:from-purple-600 dark:via-orange-500 dark:to-green-500 dark:hover:from-purple-700 dark:hover:via-orange-600 dark:hover:to-green-600 dark:text-white dark:shadow-lg dark:shadow-orange-500/30"
              onClick={handleSetAvailable}
              disabled={setAvailableMutation.isPending}
            >
            {setAvailableMutation.isPending ? "Saving..." : (myStatus ? "Save Changes" : "Go Available")}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Group Chat Dialog */}
    <Dialog open={showGroupChat} onOpenChange={(open) => { setShowGroupChat(open); if (!open) { setSelectedMessage(null); setReplyingTo(null); } }}>
      <DialogContent 
        className="max-w-lg w-[96vw] sm:w-full h-[82vh] sm:h-[600px] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 overflow-hidden"
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {(() => {
                const activityIcons: Record<string, { icon: any; emoji: string }> = {
                  coffee: { icon: Coffee, emoji: "☕" },
                  food: { icon: Utensils, emoji: "🍽️" },
                  drinks: { icon: Beer, emoji: "🍻" },
                  explore: { icon: Camera, emoji: "📸" },
                  music: { icon: Music, emoji: "🎵" },
                  fitness: { icon: Dumbbell, emoji: "💪" },
                  hike: { icon: Mountain, emoji: "🥾" },
                  bike: { icon: Bike, emoji: "🚴" },
                  beach: { icon: Waves, emoji: "🏖️" },
                  sightseeing: { icon: Compass, emoji: "🧭" },
                };
                const activity = groupChatroom?.activityType;
                const activityInfo = activity ? activityIcons[activity] : null;
                const ActivityIcon = activityInfo?.icon;
                return (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: activity ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#3b82f6' }}>
                    {ActivityIcon ? <ActivityIcon className="h-4.5 w-4.5 text-white" /> : <Users className="h-4 w-4 text-white" />}
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {groupChatroom?.chatroomName || "Meetup Chat"}
                </DialogTitle>
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0 text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  <span className="whitespace-nowrap">{groupChatroom?.participantCount || 0} people</span>
                  {groupChatroom?.city && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{groupChatroom.city}{groupChatroom.state ? `, ${groupChatroom.state}` : ""}</span>
                      </span>
                    </>
                  )}
                  {groupChatroom?.activityType && (() => {
                    const labels: Record<string, string> = {
                      coffee: "Coffee", food: "Food", drinks: "Drinks", explore: "Explore",
                      music: "Music", fitness: "Fitness", hike: "Hike", bike: "Bike",
                      beach: "Beach", sightseeing: "Sightseeing"
                    };
                    const emojis: Record<string, string> = {
                      coffee: "☕", food: "🍽️", drinks: "🍻", explore: "📸",
                      music: "🎵", fitness: "💪", hike: "🥾", bike: "🚴",
                      beach: "🏖️", sightseeing: "🧭"
                    };
                    return (
                      <>
                        <span>·</span>
                        <span className="whitespace-nowrap">{emojis[groupChatroom.activityType] || "🤝"} {labels[groupChatroom.activityType] || groupChatroom.activityType}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => leaveGroupChatMutation.mutate()}
              disabled={leaveGroupChatMutation.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs gap-1 flex-shrink-0 px-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="flex flex-col min-h-full justify-end space-y-2">
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
          className="flex-shrink-0 w-full px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
        >
          <Input
            value={groupChatMessage}
            onChange={(e) => setGroupChatMessage(e.target.value)}
            placeholder={replyingTo ? "Reply..." : "Type a message..."}
            className="w-full min-w-0 flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10 text-sm"
            disabled={sendGroupMessageMutation.isPending}
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
          className="fixed inset-0 bg-black/95"
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
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
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
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <Heart className={`w-5 h-5 ${hasHearted ? 'text-red-500 fill-red-500' : 'text-red-400'}`} />
                  <span className="text-sm">{hasHearted ? 'Unlove' : 'Love'}</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }}
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <Reply className="w-5 h-5 text-green-500" />
              <span className="text-sm">Reply</span>
            </button>
          </div>
        </div>
      </>,
      document.body
    )}
    {/* "I'm Out — Share Where You Are" modal — QuickMeetupWidget rendered inline */}
    {showImOut && createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 999999 }}
        onClick={() => setShowImOut(false)}
      >
        <div className="absolute inset-0 bg-black/95" />
        <div
          className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700"
          style={{ zIndex: 1000000, touchAction: 'manipulation' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 z-10"
            onClick={() => setShowImOut(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <QuickMeetupWidget
            city={userCity}
            currentUser={currentUser}
            initialShowCreateForm={true}
            onCreateSuccess={() => setShowImOut(false)}
          />
        </div>
      </div>,
      document.body
    )}

    </>
  );
}
