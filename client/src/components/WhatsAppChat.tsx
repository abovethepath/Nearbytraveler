import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useIsOnline } from "@/components/NetworkStatus";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical, Users, Volume2, VolumeX, Edit2, Trash2, Check, X, ThumbsUp, Camera, User as UserIcon, ShieldAlert, Share2, LogOut, Lock, UserPlus, Pin, PinOff } from "lucide-react";
import ChatroomInvitePanel from "@/components/ChatroomInvitePanel";
import ShareChatroomSheet from "@/components/ShareChatroomSheet";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { isNativeIOSApp } from "@/lib/nativeApp";

// Emoji auto-substitution map — defined outside component to avoid recreation
const EMOJI_MAP: Record<string, string> = {
  shrug: '🤷', kiss: '😘', smile: '😊', happy: '😊',
  doh: '🤦', "d'oh": '🤦', facepalm: '🤦',
  'rolling eyes': '🙄', eyeroll: '🙄',
  laugh: '😂', lol: '😂',
  heart: '❤️', love: '❤️',
  'thumbs up': '👍', thumbsup: '👍',
  'thumbs down': '👎', thumbsdown: '👎',
  wave: '👋', clap: '👏', fire: '🔥', '100': '💯',
  pray: '🙏', wink: '😉', cry: '😢', angry: '😠',
  confused: '😕', naughty: '😈',
  hmm: '🤔', hmmm: '🤔',
};

interface Message {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  replyToId?: number;
  reactions?: { [emoji: string]: number[] };
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  readAt?: string | null;
  sender?: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  };
  replyTo?: Message;
}

interface ChatMember {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  userType: string;
  hometownCity: string;
  hometownState?: string;
  hometownCountry?: string;
  location?: string;
  locationLabel?: string;
  isAdmin: boolean;
  joinedAt: string;
  isMuted?: boolean;
  muteReason?: string | null;
  rsvpStatus?: string;
}

interface WhatsAppChatProps {
  chatId: number;
  chatType: 'chatroom' | 'event' | 'meetup' | 'dm';
  title: string;
  subtitle?: string;
  chatLocation?: string;
  currentUserId?: number;
  onBack?: () => void;
  eventId?: number;
  eventImageUrl?: string;
  meetupId?: number;
  otherUserUsername?: string;
  otherUserProfileImage?: string | null;
  readOnly?: boolean;
  readOnlyBanner?: string;
  graceBanner?: string;
  /** When true, disables mobile fixed positioning so the chat can be embedded inside another page layout. */
  embedded?: boolean;
}


export default function WhatsAppChat(props: WhatsAppChatProps) {
  const { chatId, chatType, title, subtitle, chatLocation, currentUserId, onBack, eventId, eventImageUrl, meetupId, readOnly, readOnlyBanner, graceBanner, embedded } = props;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isOnline = useIsOnline();

  // DM chats always go to /messages; group chats use onBack if provided
  const handleBack = chatType === 'dm'
    ? () => navigate('/messages')
    : (onBack || (() => navigate('/messages')));
  const isMobileWeb =
    !isNativeIOSApp() &&
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(max-width: 767px)").matches;
  const isMobile =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(max-width: 767px)").matches;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwardConversations, setForwardConversations] = useState<any[]>([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [emojiSuggestion, setEmojiSuggestion] = useState<{ word: string; emoji: string } | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [hasConnectedBefore, setHasConnectedBefore] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMembersAccessDenied, setIsMembersAccessDenied] = useState(false);
  const [swipingMessageId, setSwipingMessageId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSendingPhoto, setIsSendingPhoto] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(title);
  const [pinnedMessage, setPinnedMessage] = useState<{ id: number; content: string; senderName: string } | null>(null);
  const [displayTitle, setDisplayTitle] = useState(title?.replace(/ - Group Chat$/i, '') ?? title);
  const [showHostLeaveModal, setShowHostLeaveModal] = useState(false);
  const [hostLeaveStep, setHostLeaveStep] = useState<'choice' | 'transfer' | 'dissolve-confirm'>('choice');
  const [transferTargetUserId, setTransferTargetUserId] = useState<number | null>(null);
  useEffect(() => {
    const cleaned = title?.replace(/ - Group Chat$/i, '') ?? title;
    // Never downgrade: don't replace a real name with a username (shorter/starts with @)
    setDisplayTitle(prev => {
      if (!cleaned) return prev;
      if (prev && prev.length > cleaned.length && !prev.startsWith('@') && cleaned.startsWith('@')) return prev;
      return cleaned;
    });
  }, [title]);

  // Available Now / Meetup chats: show the selected activities in the header.
  const { data: meetupChatInfo } = useQuery<{
    id: number;
    activityType: string | null;
    activities: string[] | null;
  }>({
    queryKey: chatType === "meetup" && currentUserId ? ["/api/meetup-chatrooms", chatId, "info"] : [],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (currentUserId) headers["x-user-id"] = String(currentUserId);
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatId}/info`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load meetup chat info");
      return res.json();
    },
    enabled: chatType === "meetup" && !!currentUserId,
    staleTime: 30_000,
  });

  // Pinned message query — for all non-DM chatrooms
  const pinnedMsgEndpoint = (chatType === 'meetup' || chatType === 'event')
    ? `/api/meetup-chatrooms/${chatId}/pinned-message`
    : `/api/chatrooms/${chatId}/pinned-message`;
  const { data: pinnedMsgData, refetch: refetchPinnedMsg } = useQuery<{ pinnedMessage: { id: number; content: string; senderName: string } | null }>({
    queryKey: [pinnedMsgEndpoint],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}${pinnedMsgEndpoint}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch pinned message');
      return res.json();
    },
    enabled: chatType !== 'dm' && !!currentUserId,
    staleTime: 30_000,
  });
  // Sync pinnedMsgData into local state whenever the query result changes
  useEffect(() => {
    if (pinnedMsgData !== undefined) {
      setPinnedMessage(pinnedMsgData?.pinnedMessage ?? null);
    }
  }, [pinnedMsgData]);

  const meetupActivityTags = useMemo(() => {
    const activityLabels: Record<string, string> = {
      coffee: "Coffee", food: "Food", drinks: "Drinks", explore: "Explore",
      music: "Music", fitness: "Fitness", hike: "Hike", bike: "Bike",
      beach: "Beach", sightseeing: "Sightseeing",
    };
    const toLabel = (s: string) => activityLabels[s] || (s.charAt(0).toUpperCase() + s.slice(1));
    const fromArray = Array.isArray(meetupChatInfo?.activities) ? meetupChatInfo?.activities : [];
    if (fromArray.length > 0) {
      return [...new Set(fromArray.map((s) => toLabel(String(s || "").trim())).filter(Boolean))].slice(0, 8);
    }
    const activityType = String(meetupChatInfo?.activityType || "").trim();
    if (!activityType) return [];
    return [...new Set(activityType.split(",").map((s) => toLabel(s.trim())).filter(Boolean))].slice(0, 8);
  }, [meetupChatInfo?.activities, meetupChatInfo?.activityType]);

  // Chatroom settings query — city chatrooms only, gives us adminsOnly flag
  const { data: chatroomSettings, refetch: refetchChatroomSettings } = useQuery<{ adminsOnly: boolean }>({
    queryKey: [`/api/chatrooms/${chatId}/settings`],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}`, { credentials: 'include', headers: currentUserId ? { 'x-user-id': String(currentUserId) } : {} });
      if (!res.ok) throw new Error('Failed to load chatroom settings');
      const data = await res.json();
      return { adminsOnly: Boolean(data.adminsOnly) };
    },
    enabled: chatType === 'chatroom' && !!currentUserId,
    staleTime: 30_000,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActivatedAtRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  const muteKey = useMemo(() => {
    if (chatType === "dm") return `nt-muted-dm-${chatId}`;
    if (chatType === "chatroom") return `nt-muted-chatroom-${chatId}`;
    return `nt-muted-${chatType}-${chatId}`;
  }, [chatType, chatId]);

  useEffect(() => {
    try {
      setNotificationsMuted(localStorage.getItem(muteKey) === "1");
    } catch {
      setNotificationsMuted(false);
    }
  }, [muteKey]);

  // Lock ALL page scroll — position:fixed on body is the only reliable way on iOS Safari.
  // Also add is-chat-page so MobileTopNav + MobileBottomNav are hidden for all chat types.
  useEffect(() => {
    const s = document.body.style;
    const h = document.documentElement.style;
    const prev = { overflow: s.overflow, position: s.position, width: s.width, height: s.height, top: s.top, left: s.left, htmlOverflow: h.overflow };
    s.overflow = 'hidden';
    s.position = 'fixed';
    s.width = '100%';
    s.height = '100%';
    s.top = '0';
    s.left = '0';
    h.overflow = 'hidden';
    if (window.innerWidth < 768) document.body.classList.add('is-chat-page');
    return () => {
      s.overflow = prev.overflow;
      s.position = prev.position;
      s.width = prev.width;
      s.height = prev.height;
      s.top = prev.top;
      s.left = prev.left;
      h.overflow = prev.htmlOverflow;
      document.body.classList.remove('is-chat-page');
    };
  }, []);

  // VisualViewport API — resize chat container when iOS/Android keyboard opens
  // Skip for embedded mode — the parent flex layout handles sizing.
  useEffect(() => {
    if (embedded || !isMobileWeb || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const h = vv.height;
      const offsetTop = vv.offsetTop || 0;
      setViewportHeight(h);
      
      if (chatContainerRef.current) {
        // iOS 18 fix: Set height to visual viewport height and use fixed positioning
        // This prevents the browser from scrolling the body when the keyboard appears
        chatContainerRef.current.style.height = `${h}px`;
        chatContainerRef.current.style.top = `${offsetTop}px`;
        
        // CRITICAL: Prevent the window from scrolling
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }
      
      // Ensure the active input is visible but DON'T let the browser scroll the whole page
      requestAnimationFrame(() => {
        if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
          // Use 'nearest' and 'instant' to minimize browser-driven layout shifts
          document.activeElement.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
        }
      });
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    // Add touchmove listener to prevent bounce/scroll while keyboard is open
    const preventScroll = (e: TouchEvent) => {
      if (vv.height < window.innerHeight) {
        // Keyboard is likely open, prevent default scroll behavior on the root
        if (e.target === chatContainerRef.current) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('touchmove', preventScroll, { passive: false });

    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [isMobileWeb]);

  const toggleNotificationsMuted = () => {
    const next = !notificationsMuted;
    setNotificationsMuted(next);
    try {
      localStorage.setItem(muteKey, next ? "1" : "0");
    } catch {}
    toast({
      title: next ? "Notifications muted" : "Notifications unmuted",
      description: chatType === "dm" ? "This conversation is muted." : "This chatroom is muted.",
    });
  };

  const shareChatroomLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/whatsapp-chatroom/${chatId}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Join my chatroom", text: `Join "${title}" on NearbyTraveler`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share it anywhere." });
      }
    } catch {
      toast({ title: "Couldn't share", description: "Please try again.", variant: "destructive" });
    }
  };

  const reportChatroom = async () => {
    const details = typeof window !== "undefined" ? window.prompt("Optional: add details for this report (or leave blank).", "") : "";
    try {
      const u: any = (() => {
        try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("travelconnect_user") || localStorage.getItem("current_user") || "{}"); } catch { return {}; }
      })();
      const uid = Number(currentUserId || u?.id || 0);
      const res = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/report`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid ? String(uid) : "",
          ...(u?.id ? { "x-user-data": JSON.stringify({ id: u.id, username: u.username, email: u.email, name: u.name }) } : {}),
        },
        body: JSON.stringify({ userId: uid || undefined, reason: "inappropriate", details: details || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      toast({ title: "Report submitted", description: data?.message || "Thanks — our team will review it." });
    } catch (e: any) {
      toast({ title: "Couldn't submit report", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const reportConversation = async () => {
    if (chatType !== "dm") return;
    const details = typeof window !== "undefined" ? window.prompt("Optional: add details for this report (or leave blank).", "") : "";
    try {
      const u: any = (() => {
        try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("travelconnect_user") || localStorage.getItem("current_user") || "{}"); } catch { return {}; }
      })();
      const uid = Number(currentUserId || u?.id || 0);
      const res = await fetch(`${getApiBaseUrl()}/api/users/report`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid ? String(uid) : "",
        },
        body: JSON.stringify({
          reportedUserId: chatId,
          reason: "inappropriate",
          details: details ? `Reported from DM conversation: ${details}` : "Reported from DM conversation",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      toast({ title: "Report submitted", description: data?.message || "Thanks — our team will review it." });
    } catch (e: any) {
      toast({ title: "Couldn't submit report", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const blockDmUser = async () => {
    if (chatType !== "dm") return;
    if (typeof window !== "undefined" && !window.confirm("Block this user? They won't be able to contact you.")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/users/block`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: chatId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      toast({ title: "User blocked", description: "They can no longer message you." });
      navigate("/messages");
    } catch (e: any) {
      toast({ title: "Couldn't block user", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const deleteDmConversation = async () => {
    if (chatType !== "dm") return;
    if (typeof window !== "undefined" && !window.confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      const u: any = (() => {
        try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("travelconnect_user") || localStorage.getItem("current_user") || "{}"); } catch { return {}; }
      })();
      const uid = Number(currentUserId || u?.id || 0);
      const res = await fetch(`${getApiBaseUrl()}/api/messages/conversation/${chatId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid ? String(uid) : "",
        },
        body: JSON.stringify({ userId: uid || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "Conversation deleted" });
      navigate("/messages");
    } catch (e: any) {
      toast({ title: "Couldn't delete conversation", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const getUidAndHeaders = () => {
    const u: any = (() => {
      try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("travelconnect_user") || localStorage.getItem("current_user") || "{}"); } catch { return {}; }
    })();
    const uid = Number(currentUserId || u?.id || 0);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(uid ? { "x-user-id": String(uid) } : {}),
      ...(u?.id ? { "x-user-data": JSON.stringify({ id: u.id, username: u.username, email: u.email, name: u.name }) } : {}),
    };
    return { uid, headers };
  };

  const leaveChatroom = async () => {
    if (chatType === "dm") return;
    const isMeetupOrEvent = chatType === "meetup" || chatType === "event";
    if (isMeetupOrEvent && isCurrentUserAdmin) {
      setHostLeaveStep('choice');
      setTransferTargetUserId(null);
      setShowHostLeaveModal(true);
      return;
    }
    const label = chatType === "meetup" ? "meetup chat" : chatType === "event" ? "event chat" : "chatroom";
    if (typeof window !== "undefined" && !window.confirm(`Leave this ${label}?`)) return;
    try {
      const { uid, headers } = getUidAndHeaders();
      const endpoint = isMeetupOrEvent
        ? `${getApiBaseUrl()}/api/meetup-chatrooms/${chatId}/leave`
        : `${getApiBaseUrl()}/api/chatrooms/${chatId}/leave`;
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ userId: uid || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      toast({ title: `Left ${label}` });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      navigate("/messages");
    } catch (e: any) {
      toast({ title: `Couldn't leave`, description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const confirmTransferHost = async () => {
    if (!transferTargetUserId) return;
    try {
      const { headers } = getUidAndHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatId}/transfer-host`, {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ newHostUserId: transferTargetUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      toast({ title: "Host transferred", description: "You've left the chat." });
      setShowHostLeaveModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      navigate("/messages");
    } catch (e: any) {
      toast({ title: "Couldn't transfer host", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const confirmDissolve = async () => {
    try {
      const { headers } = getUidAndHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatId}/dissolve`, {
        method: "POST", credentials: "include", headers,
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      toast({ title: "Meetup chat ended" });
      setShowHostLeaveModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/group-chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-now/my-group-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetup-chatrooms/mine"] });
      navigate("/messages");
    } catch (e: any) {
      toast({ title: "Couldn't dissolve chat", description: String(e?.message || "Please try again."), variant: "destructive" });
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const resizeImageToDataUrl = async (file: File, maxDim = 1280, quality = 0.8): Promise<string> => {
    const original = await fileToDataUrl(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = original;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image decode failed"));
      });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return original;

      const scale = Math.min(1, maxDim / Math.max(w, h));
      const targetW = Math.max(1, Math.round(w * scale));
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return original;
      ctx.drawImage(img, 0, 0, targetW, targetH);
      return canvas.toDataURL("image/jpeg", quality);
    } catch {
      return original;
    }
  };
  
  // Normalize reactions to { [emoji]: number[] } format.
  // Old REST endpoint stored reactions as [{userId, emoji}] array — convert that on the fly.
  const normalizeReactions = (raw: any): { [emoji: string]: number[] } => {
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const out: { [emoji: string]: number[] } = {};
      raw.forEach((r: any) => {
        if (r && r.emoji) {
          if (!out[r.emoji]) out[r.emoji] = [];
          if (r.userId != null && !out[r.emoji].includes(Number(r.userId))) {
            out[r.emoji].push(Number(r.userId));
          }
        }
      });
      return out;
    }
    return raw as { [emoji: string]: number[] };
  };

  // WhatsApp-style long press detection (500ms)
  const handleTouchStart = (e: React.TouchEvent, message: Message) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setSwipingMessageId(message.id);
    setSwipeOffset(0);
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      console.log('Long press detected! Opening action menu for message:', message.id);
      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) navigator.vibrate(50);
      longPressActivatedAtRef.current = Date.now();
      setSelectedMessage(message);
      touchStartRef.current = null;
    }, 500);
  };
  
  const handleTouchMove = (e: React.TouchEvent, message: Message, isOwn: boolean) => {
    if (!touchStartRef.current) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Cancel long press if moved too much
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
    
    // Swipe right to reply (only for other's messages, or left for own messages)
    const swipeDirection = isOwn ? -1 : 1;
    const swipeAmount = deltaX * swipeDirection;
    
    if (swipeAmount > 0 && deltaY < 30) {
      // Limit swipe to 80px max
      setSwipeOffset(Math.min(swipeAmount, 80));
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent, message: Message) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Check if swipe was enough to trigger reply (> 60px)
    if (swipeOffset > 60) {
      setReplyingTo(message);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setSwipingMessageId(null);
    touchStartRef.current = null;
  };
  
  // HTTP fallback for fetching messages when WebSocket sync fails
  const fetchMessagesViaHttp = async () => {
    if (messagesLoaded) return; // Already loaded
    
    console.log('📡 WhatsApp Chat: Fetching messages via HTTP fallback for chatId:', chatId, 'chatType:', chatType);
    try {
      // CRITICAL: Always use the currentUserId prop from auth context — never localStorage
      // which can have stale data from a different user session
      const uidNum = Number(currentUserId || 0);
      const uid = uidNum.toString();
      const headers: Record<string, string> = { 'x-user-id': uid };
      const chatroomsChatTypeParam = chatType === "chatroom" ? "city" : chatType;
      const historyUrl =
        chatType === "event"
          ? `${getApiBaseUrl()}/api/event-chatrooms/${chatId}/messages`
          : chatType === "meetup"
            ? `${getApiBaseUrl()}/api/available-now/group-chat/${chatId}/messages`
            : (chatType === "dm" && isMobileWeb)
              ? `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=dm&format=whatsapp`
              : chatType === "dm"
                ? `${getApiBaseUrl()}/api/messages/${uidNum}`
                : `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=${chatroomsChatTypeParam}&format=whatsapp`;

      if (import.meta.env.DEV) {
        console.log("📡 WhatsApp Chat: HTTP fallback request", {
          url: historyUrl,
          uid,
          chatId,
          chatType,
          chatroomsChatTypeParam,
          isMobileWeb,
        });
      }

      const response = await fetch(historyUrl, {
        headers,
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (chatType === 'dm') {
          // Mobile web uses the scoped thread endpoint, which returns { messages: [...] }.
          if (data?.messages && Array.isArray(data.messages)) {
            const mapped = data.messages.reverse();
            console.log("📬 WhatsApp Chat: DM HTTP fallback loaded (scoped thread)", mapped.length, "messages");
            setMessages(mapped);
            setMessagesLoaded(true);
            scrollToBottom();
            return;
          }
          const all = Array.isArray(data) ? data : [];
          const thread = all.filter((m: any) => {
            const senderId = m?.senderId;
            const receiverId = m?.receiverId;
            return (
              (senderId == uidNum && receiverId == chatId) ||
              (senderId == chatId && receiverId == uidNum)
            );
          });

          const mapped = thread.reverse().map((m: any) => {
            const senderUser = m?.senderUser || m?.sender || null;
            const reply = m?.repliedMessage || null;
            return {
              id: m?.id,
              senderId: m?.senderId,
              content: m?.content,
              messageType: m?.messageType || "text",
              mediaUrl: m?.mediaUrl || null,
              replyToId: m?.replyToId,
              createdAt: m?.createdAt || new Date().toISOString(),
              isEdited: m?.isEdited,
              reactions: m?.reactions,
              sender: senderUser?.id
                ? {
                    id: senderUser.id,
                    username: senderUser.username,
                    name: senderUser.name,
                    profileImage: senderUser.profileImage,
                  }
                : undefined,
              replyTo: reply?.id
                ? {
                    id: reply.id,
                    senderId: reply.senderId,
                    content: reply.content,
                    messageType: "text",
                    createdAt: m?.createdAt || "",
                  }
                : undefined,
            } as Message;
          });

          console.log("📬 WhatsApp Chat: DM HTTP fallback loaded", mapped.length, "messages");
          setMessages(mapped);
          setMessagesLoaded(true);
          scrollToBottom();
        } else if (chatType === 'event') {
          const all = Array.isArray(data) ? data : [];
          const mapped = all.map((m: any) => {
            const senderUser = m?.user || m?.sender || null;
            return {
              id: m?.id,
              senderId: m?.senderId,
              content: m?.content,
              messageType: m?.messageType || "text",
              mediaUrl: m?.mediaUrl || null,
              replyToId: m?.replyToId,
              createdAt: m?.createdAt || new Date().toISOString(),
              isEdited: m?.isEdited,
              reactions: m?.reactions,
              sender: senderUser?.id
                ? {
                    id: senderUser.id,
                    username: senderUser.username,
                    name: senderUser.name,
                    profileImage: senderUser.profileImage,
                  }
                : undefined,
            } as Message;
          });
          console.log("📬 WhatsApp Chat: Event HTTP fallback loaded", mapped.length, "messages");
          setMessages(mapped);
          setMessagesLoaded(true);
          scrollToBottom();
        } else if (chatType === 'meetup') {
          const all = Array.isArray(data) ? data : [];
          const mapped = all.map((m: any) => {
            // Meetup messages have flat fields (userId, username, userProfileImage)
            // not a nested sender object — build one from flat fields
            const sid = m?.userId ?? m?.senderId;
            const senderUser = m?.sender || (sid ? {
              id: sid,
              username: m?.username || null,
              name: m?.username || null,
              profileImage: m?.userProfileImage || m?.profileImage || null,
            } : null);
            return {
              id: m?.id,
              senderId: sid,
              content: m?.message ?? m?.content ?? "",
              messageType: m?.messageType || "text",
              mediaUrl: m?.mediaUrl || null,
              replyToId: m?.replyToId,
              reactions: m?.reactions,
              createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
              isEdited: m?.isEdited,
              sender: senderUser?.id
                ? {
                    id: senderUser.id,
                    username: senderUser.username,
                    name: senderUser.name,
                    profileImage: senderUser.profileImage,
                  }
                : undefined,
            } as Message;
          });
          console.log("📬 WhatsApp Chat: Quick meetup HTTP fallback loaded", mapped.length, "messages, senderIds:", mapped.map(m => m.senderId), "currentUserId:", currentUserId);
          setMessages(mapped);
          setMessagesLoaded(true);
          scrollToBottom();
        } else if (data.messages && Array.isArray(data.messages)) {
          console.log('📬 WhatsApp Chat: HTTP fallback loaded', data.messages.length, 'messages');
          setMessages(data.messages.reverse());
          setMessagesLoaded(true);
          scrollToBottom();
        }
      } else {
        console.warn('⚠️ WhatsApp Chat: HTTP fallback failed with status:', response.status);
        if (chatType !== 'dm') {
          setLoadError((prev) => prev || `Couldn't load this chat (HTTP ${response.status}).`);
        }
        if (chatType === 'dm') {
          // DM-specific resilience: allow user to type/send even if history fetch fails
          setMessagesLoaded(true);
        }
      }
    } catch (error) {
      console.error('❌ WhatsApp Chat: HTTP fallback error:', error);
      if (chatType !== 'dm') {
        setLoadError((prev) => prev || "Couldn't load this chat. Please try again.");
      }
      if (chatType === 'dm') {
        // DM-specific resilience: allow user to type/send even if history fetch fails
        setMessagesLoaded(true);
      }
    }
  };

  // Fetch members using the same source as the header participant count.
  // - Event chats: use event participants (not event-chatroom membership).
  // - Quick meetup chats (with meetupId): use quick meet participants table.
  // - Available Now meetup chats (no meetupId) + City chatrooms: use chatroom_members table.
  const membersEndpoint =
    chatType === 'event'
      ? (eventId ? `/api/events/${eventId}/participants` : `/api/event-chatrooms/${chatId}/members`)
      : chatType === 'meetup'
        ? (typeof meetupId === 'number' && meetupId > 0
            ? `/api/quick-meets/${meetupId}/participants`
            : `/api/chatrooms/${chatId}/members`)
        : chatType === 'chatroom'
          ? `/api/chatrooms/${chatId}/members`
          : null;

  const { data: membersRaw = [], error: membersError } = useQuery<any[]>({
    queryKey: membersEndpoint ? [membersEndpoint] : ['members-disabled'],
    enabled: Boolean(membersEndpoint)
  });

  // Enrich member rows with profile location (some endpoints only return ids/usernames).
  const memberIdsNeedingProfiles = useMemo(() => {
    const raw = Array.isArray(membersRaw) ? membersRaw : [];
    const ids: number[] = [];
    for (const item of raw) {
      const src = (item && typeof item === "object" && (item as any).user) ? (item as any).user : item;
      const id = Number((src as any)?.id ?? (item as any)?.userId ?? (item as any)?.id);
      if (Number.isFinite(id) && id > 0) ids.push(id);
    }
    // Also include sender IDs from messages that are missing embedded sender data OR
    // have a sender with id but no displayable name (e.g. username=null from incomplete JOIN)
    // (handles users who left the chatroom but have historical messages)
    for (const msg of messages) {
      const senderMissingOrUnnamed = !msg.sender?.id || !(msg.sender?.username || msg.sender?.name);
      if (senderMissingOrUnnamed && msg.senderId) {
        const id = Number(msg.senderId);
        if (Number.isFinite(id) && id > 0) ids.push(id);
      }
    }
    // unique + stable
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }, [membersRaw, messages]);

  const { data: memberProfilesById = {} } = useQuery<Record<number, any>>({
    queryKey: ["member-profiles", memberIdsNeedingProfiles],
    enabled: memberIdsNeedingProfiles.length > 0,
    queryFn: async () => {
      const out: Record<number, any> = {};
      await Promise.all(
        memberIdsNeedingProfiles.map(async (id) => {
          try {
            const res = await fetch(`${getApiBaseUrl()}/api/users/${id}`, {
              credentials: "include",
              headers: {
                Accept: "application/json",
                ...(currentUserId ? { "x-user-id": String(currentUserId) } : {}),
              },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data && typeof data === "object") out[id] = data;
          } catch {
            // Best-effort enrichment only
          }
        }),
      );
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });

  const members: ChatMember[] = useMemo(() => {
    const raw = Array.isArray(membersRaw) ? membersRaw : [];
    const out: ChatMember[] = [];

    for (const item of raw) {
      const toText = (v: any): string => {
        if (v == null) return "";
        const t = String(v).trim();
        if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return "";
        return t;
      };

      // Event/meetup participants may return nested `user`; chatrooms return a flat member row.
      const src = (item && typeof item === "object" && (item as any).user) ? (item as any).user : item;
      const id = Number((src as any)?.id ?? (item as any)?.userId ?? (item as any)?.id);
      const username = String((src as any)?.username ?? (item as any)?.username ?? '');
      if (!Number.isFinite(id) || id <= 0 || !username) continue;

      const hometownCity = toText(
        (src as any)?.hometownCity ??
          (src as any)?.hometown_city ??
          (item as any)?.hometownCity ??
          (item as any)?.hometown_city,
      );
      const hometownState = toText(
        (src as any)?.hometownState ??
          (src as any)?.hometown_state ??
          (item as any)?.hometownState ??
          (item as any)?.hometown_state,
      );
      const hometownCountry = toText(
        (src as any)?.hometownCountry ??
          (src as any)?.hometown_country ??
          (item as any)?.hometownCountry ??
          (item as any)?.hometown_country,
      );
      const location = toText((src as any)?.location ?? (item as any)?.location);

      // Profile enrichment fallback (fixes "Unknown" in meetup chat member list)
      const profile = (memberProfilesById as any)?.[id];
      const profileHometownCity = toText(profile?.hometownCity ?? profile?.hometown_city);
      const profileHometownState = toText(profile?.hometownState ?? profile?.hometown_state);
      const profileHometownCountry = toText(profile?.hometownCountry ?? profile?.hometown_country);
      const profileLocation = toText(profile?.location);

      const hometownCityFinal = hometownCity || profileHometownCity;
      const hometownStateFinal = hometownState || profileHometownState;
      const hometownCountryFinal = hometownCountry || profileHometownCountry;
      const locationFinal = location || profileLocation;
      const isUsOrCa = (() => {
        const c = (hometownCountryFinal || '').toLowerCase();
        return c === 'united states' || c === 'usa' || c === 'us' || c === 'canada' ||
          c === 'united states of america';
      })();
      const locationLabel =
        (hometownCityFinal
          ? isUsOrCa && hometownStateFinal
            ? `${hometownCityFinal}, ${hometownStateFinal}`
            : hometownCountryFinal
              ? `${hometownCityFinal}, ${hometownCountryFinal}`
              : hometownCityFinal
          : (locationFinal ? locationFinal : "")) || "";

      // For event participant lists, the organizer is flagged via isEventCreator rather than isAdmin
      const isAdminResolved =
        Boolean((item as any)?.isAdmin) ||
        Boolean((item as any)?.isEventCreator) ||
        false;

      out.push({
        id,
        username,
        name: toText((src as any)?.name ?? (item as any)?.name),
        profileImage: ((src as any)?.profileImage ?? (item as any)?.profileImage) || undefined,
        userType: toText((src as any)?.userType ?? (item as any)?.userType),
        hometownCity: hometownCityFinal,
        hometownState: hometownStateFinal || undefined,
        hometownCountry: hometownCountryFinal || undefined,
        location: locationFinal || undefined,
        locationLabel: locationLabel || undefined,
        isAdmin: isAdminResolved,
        joinedAt: String((item as any)?.joinedAt ?? (item as any)?.createdAt ?? new Date().toISOString()),
        isMuted: Boolean((item as any)?.isMuted) || undefined,
        muteReason: (item as any)?.muteReason ?? null,
        rsvpStatus: toText((item as any)?.status) || undefined,
      });
    }

    return out;
  }, [membersRaw, memberProfilesById]);
  
  // Check if current user is admin (use == for type coercion since currentUserId may be string)
  const currentMember = members.find(m => m.id == currentUserId);
  const isCurrentUserAdmin = currentMember?.isAdmin || false;
  const currentUserIsMuted = Boolean(currentMember?.isMuted);
  const isAdminsOnly = chatType === 'chatroom' && Boolean(chatroomSettings?.adminsOnly);
  const editNameInputRef = useRef<HTMLInputElement>(null);

  const renameChatroomMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/meetup-chatrooms/${chatId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      return res.json();
    },
    onSuccess: (data) => {
      setDisplayTitle(data.name);
      setIsEditingName(false);
      toast({ title: "Chat renamed" });
    },
    onError: () => {
      toast({ title: "Could not rename chat", variant: "destructive" });
      setEditNameValue(displayTitle);
      setIsEditingName(false);
    },
  });

  // Mute user mutation
  const muteMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: number, reason?: string }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, reason }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to mute user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User muted successfully" });
      setMuteDialogOpen(false);
      setMuteReason("");
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: () => {
      toast({ title: "Failed to mute user", variant: "destructive" });
    }
  });
  
  // Unmute user mutation — with optimistic update so the UI clears immediately
  const unmuteMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/unmute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.message || 'Failed to unmute user');
      }
      return response.json();
    },
    onMutate: async (targetUserId: number) => {
      // Cancel any in-flight members refetch so it doesn't overwrite our optimistic update
      if (membersEndpoint) {
        await queryClient.cancelQueries({ queryKey: [membersEndpoint] });
      }
      // Snapshot previous data for rollback
      const previousMembers = membersEndpoint ? queryClient.getQueryData<any[]>([membersEndpoint]) : undefined;
      // Optimistically remove mute flag from the target member
      if (membersEndpoint) {
        queryClient.setQueryData<any[]>([membersEndpoint], (old) =>
          (old ?? []).map((m: any) =>
            m.id === targetUserId ? { ...m, isMuted: false, muteReason: null } : m
          )
        );
      }
      return { previousMembers };
    },
    onSuccess: (_data, _targetUserId, _ctx) => {
      toast({ title: "User unmuted successfully" });
      // Force a fresh server fetch to confirm
      if (membersEndpoint) {
        queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
        queryClient.refetchQueries({ queryKey: [membersEndpoint] });
      }
    },
    onError: (error: any, _targetUserId, context: any) => {
      // Roll back optimistic update
      if (membersEndpoint && context?.previousMembers !== undefined) {
        queryClient.setQueryData([membersEndpoint], context.previousMembers);
      }
      toast({ title: error?.message || "Failed to unmute user", variant: "destructive" });
    }
  });

  // Toggle admins-only (announcement) mode for city chatrooms
  const adminsOnlyMutation = useMutation({
    mutationFn: async (adminsOnly: boolean) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/admins-only`, {
        method: 'PUT',
        body: JSON.stringify({ adminsOnly }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: (_data, adminsOnly) => {
      toast({ title: adminsOnly ? "📢 Announcement mode on" : "💬 Announcement mode off" });
      refetchChatroomSettings();
    },
    onError: () => toast({ title: "Failed to update setting", variant: "destructive" })
  });

  // Promote or demote a chatroom member
  const roleMutation = useMutation({
    mutationFn: async ({ targetUserId, role }: { targetUserId: number; role: 'admin' | 'member' }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/members/${targetUserId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to change role');
      return response.json();
    },
    onSuccess: (_data, { role }) => {
      toast({ title: role === 'admin' ? "👑 Made admin" : "Admin removed" });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: () => toast({ title: "Failed to change role", variant: "destructive" })
  });

  const kickMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/kick`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Failed to kick user'); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User removed from chatroom" });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to kick user", variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: number; reason?: string }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, reason }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Failed to ban user'); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User banned from chatroom" });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to ban user", variant: "destructive" }),
  });

  // If members fetch fails for a meetup/chatroom, treat the room as expired (closed).
  // Don't show a red toast — silently switch to read-only mode with a gentle banner.
  useEffect(() => {
    if (membersError && (chatType === 'meetup' || chatType === 'chatroom')) {
      setIsMembersAccessDenied(true);
    }
  }, [membersError, chatType]);

  // Filter members based on search
  const filteredMembers = members.filter(member => {
    if (!memberSearch) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.username?.toLowerCase().includes(searchLower) ||
      member.hometownCity?.toLowerCase().includes(searchLower) ||
      member.location?.toLowerCase().includes(searchLower) ||
      member.locationLabel?.toLowerCase().includes(searchLower)
    );
  });

  // Display username instead of real name for privacy
  const getFirstName = (fullName: string | null | undefined, username?: string): string => {
    // ALWAYS prioritize username over real name for privacy
    if (username && username.trim() !== '') {
      const trimmed = username.trim();
      // Capitalize first letter of username
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }
    
    // Fallback to name only if username is missing
    if (!fullName || fullName.trim() === '') {
      return 'User';
    }
    
    const trimmedName = fullName.trim();
    
    // If it's a single word, use it
    if (!trimmedName.includes(' ')) {
      if (trimmedName === trimmedName.toUpperCase() || trimmedName === trimmedName.toLowerCase()) {
        return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();
      }
      return trimmedName;
    }
    
    // If it has spaces, extract first name
    const parts = trimmedName.split(' ');
    return parts[0] || 'User';
  };

  // Initialize WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!currentUserId || !chatId) return;

    // Clear app badge when opening a DM conversation
    (navigator as any).clearAppBadge?.()?.catch?.(() => {});

    // Reset messages state when chatId changes
    setMessages([]);
    setMessagesLoaded(false);
    setLoadError(null);

    // Never spin forever: after 5s, show an error instead of endless "Loading..."
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      setLoadError((prev) => prev || "This chat is taking longer than expected to load. Please try again.");
    }, 5000);
    
    // Immediately fetch messages via HTTP for fast initial display
    // WebSocket will update with real-time messages once connected
    const loadMessagesImmediately = async () => {
      try {
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
        const uidNum = Number(currentUserId || user.id || 0);
        const uid = uidNum.toString();
        const headers: Record<string, string> = { 'x-user-id': uid };
        if (user?.id) headers['x-user-data'] = JSON.stringify({ id: user.id, username: user.username, email: user.email, name: user.name });
        const chatroomsChatTypeParam = chatType === "chatroom" ? "city" : chatType;
        const historyUrl =
          chatType === "event"
            ? `${getApiBaseUrl()}/api/event-chatrooms/${chatId}/messages`
            : chatType === "meetup"
              ? `${getApiBaseUrl()}/api/available-now/group-chat/${chatId}/messages`
              : (chatType === "dm" && isMobileWeb)
                ? `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=dm&format=whatsapp`
                : chatType === "dm"
                  ? `${getApiBaseUrl()}/api/messages/${uidNum}`
                  : `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=${chatroomsChatTypeParam}&format=whatsapp`;

        if (import.meta.env.DEV) {
          console.log("🚀 WhatsApp Chat: Initial messages request", {
            url: historyUrl,
            uid,
            chatId,
            chatType,
            chatroomsChatTypeParam,
            isMobileWeb,
          });
        }

        const response = await fetch(historyUrl, {
          headers,
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          if (chatType === 'dm') {
            // Mobile web uses the scoped thread endpoint, which returns { messages: [...] }.
            if (data?.messages && Array.isArray(data.messages)) {
              const mapped = data.messages.reverse();
              console.log("🚀 WhatsApp Chat: Immediate DM HTTP load (scoped thread):", mapped.length, "messages");
              setMessages(mapped);
              setMessagesLoaded(true);
              scrollToBottom();
              return;
            }
            const all = Array.isArray(data) ? data : [];
            const thread = all.filter((m: any) => {
              const senderId = m?.senderId;
              const receiverId = m?.receiverId;
              return (
                (senderId == uidNum && receiverId == chatId) ||
                (senderId == chatId && receiverId == uidNum)
              );
            });

            const mapped = thread.reverse().map((m: any) => {
              const senderUser = m?.senderUser || m?.sender || null;
              const reply = m?.repliedMessage || null;
              return {
                id: m?.id,
                senderId: m?.senderId,
                content: m?.content,
                messageType: m?.messageType || "text",
                mediaUrl: m?.mediaUrl,
                replyToId: m?.replyToId,
                createdAt: m?.createdAt || new Date().toISOString(),
                isEdited: m?.isEdited,
                reactions: m?.reactions,
                sender: senderUser?.id
                  ? {
                      id: senderUser.id,
                      username: senderUser.username,
                      name: senderUser.name,
                      profileImage: senderUser.profileImage,
                    }
                  : undefined,
                replyTo: reply?.id
                  ? {
                      id: reply.id,
                      senderId: reply.senderId,
                      content: reply.content,
                      messageType: "text",
                      mediaUrl: reply?.mediaUrl,
                      createdAt: m?.createdAt || "",
                    }
                  : undefined,
              } as Message;
            });

            console.log("🚀 WhatsApp Chat: Immediate DM HTTP load:", mapped.length, "messages");
            setMessages(mapped);
            setMessagesLoaded(true);
            scrollToBottom();
          } else if (chatType === 'event') {
            const all = Array.isArray(data) ? data : [];
            const mapped = all.map((m: any) => {
              const senderUser = m?.user || m?.sender || null;
              return {
                id: m?.id,
                senderId: m?.senderId,
                content: m?.content,
                messageType: m?.messageType || "text",
              mediaUrl: m?.mediaUrl,
                replyToId: m?.replyToId,
                createdAt: m?.createdAt || new Date().toISOString(),
                isEdited: m?.isEdited,
                reactions: m?.reactions,
                sender: senderUser?.id
                  ? {
                      id: senderUser.id,
                      username: senderUser.username,
                      name: senderUser.name,
                      profileImage: senderUser.profileImage,
                    }
                  : undefined,
              } as Message;
            });
            console.log("🚀 WhatsApp Chat: Immediate event HTTP load:", mapped.length, "messages");
            setMessages(mapped);
            setMessagesLoaded(true);
            scrollToBottom();
          } else if (chatType === 'meetup') {
            const all = Array.isArray(data) ? data : [];
            const mapped = all.map((m: any) => {
              const sid = m?.userId ?? m?.senderId;
              const senderUser = m?.sender || (sid ? {
                id: sid, username: m?.username || null, name: m?.username || null,
                profileImage: m?.userProfileImage || m?.profileImage || null,
              } : null);
              return {
                id: m?.id,
                senderId: sid,
                content: m?.message ?? m?.content ?? "",
                messageType: m?.messageType || "text",
                mediaUrl: m?.mediaUrl || null,
                replyToId: m?.replyToId,
                reactions: m?.reactions,
                createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
                isEdited: m?.isEdited,
                sender: senderUser?.id
                  ? { id: senderUser.id, username: senderUser.username, name: senderUser.name, profileImage: senderUser.profileImage }
                  : undefined,
              } as Message;
            });
            console.log("🚀 WhatsApp Chat: Immediate quick meetup HTTP load:", mapped.length, "messages");
            setMessages(mapped);
            setMessagesLoaded(true);
            scrollToBottom();
          } else if (data.messages && Array.isArray(data.messages)) {
            console.log('🚀 WhatsApp Chat: Immediate HTTP load:', data.messages.length, 'messages');
            setMessages(data.messages.reverse());
            setMessagesLoaded(true);
            scrollToBottom();
          }
        } else if (chatType === 'dm') {
          // DM-specific resilience: allow user to type/send even if history fetch fails
          console.warn('⚠️ WhatsApp Chat: Immediate HTTP load failed for DM with status:', response.status);
          setMessagesLoaded(true);
        } else {
          // Immediate load failed — silently let WebSocket take over, don't flash an error
          console.warn('⚠️ WhatsApp Chat: Immediate HTTP load failed with status:', response.status, '— WebSocket will retry');
        }
      } catch (error) {
        // Immediate load failed — silently let WebSocket take over, don't flash an error
        console.warn('⚠️ WhatsApp Chat: Immediate HTTP load failed, will use WebSocket:', error);
        if (chatType === 'dm') {
          // DM-specific resilience: allow user to type/send even if history fetch fails
          setMessagesLoaded(true);
        }
      }
    };
    loadMessagesImmediately();

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCleaningUp = false;

    const connect = () => {
      if (isCleaningUp) return;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🟢 WhatsApp Chat: WebSocket connected');
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
        
        // Authenticate
        console.log('🔐 WhatsApp Chat: Authenticating with userId:', currentUserId, 'chatId:', chatId, 'chatType:', chatType);
        ws?.send(JSON.stringify({
          type: 'auth',
          userId: currentUserId,
          username: user.username
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 WhatsApp Chat: Received WebSocket message:', data.type, 'for chatId:', chatId);

        switch (data.type) {
          case 'auth:success':
            console.log('✅ WhatsApp Chat: Authenticated, requesting message history for chatId:', chatId, 'chatType:', chatType);
            setIsWsConnected(true);
            setHasConnectedBefore(true);
            // Now request message history
            const historyRequest = {
              type: 'sync:history',
              chatType,
              chatroomId: chatId,
              payload: {}
            };
            console.log('📤 WhatsApp Chat: Sending sync:history request:', JSON.stringify(historyRequest));
            ws?.send(JSON.stringify(historyRequest));
            
            // Set a timeout to fetch via HTTP if sync:response doesn't arrive within 1 second
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => {
              console.log('⏱️ WhatsApp Chat: Sync timeout - falling back to HTTP');
              fetchMessagesViaHttp();
            }, 1000);
            break;

          case 'sync:response':
            console.log('📬 WhatsApp Chat: Received', data.payload?.messages?.length || 0, 'messages for chatId:', chatId);
            // Clear the HTTP fallback timeout since WebSocket sync succeeded
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
              syncTimeoutRef.current = null;
            }
            if (data.payload?.messages) {
              setMessages(data.payload.messages.reverse());
              setMessagesLoaded(true);
            } else {
              console.warn('⚠️ WhatsApp Chat: No messages array in sync:response payload');
              if (chatType === 'dm') {
                // DM-specific resilience: clear loading even if payload is empty/unexpected
                setMessagesLoaded(true);
              }
            }
            scrollToBottom();
            break;

          case 'message:new':
            console.log('💬 WhatsApp Chat: New message received, chatType:', data.chatType, 'chatroomId:', data.chatroomId, 'expected chatType:', chatType, 'expected chatId:', chatId);
            // Clear typing indicator for the sender as soon as their message arrives
            if (data.payload?.sender?.username) {
              setTypingUsers(prev => { const s = new Set(prev); s.delete(data.payload.sender.username); return s; });
            }
            if (data.chatType === chatType) {
              if (chatType === 'dm') {
                const payload = data.payload || {};
                const msgSenderId =
                  payload.senderId ?? payload.sender_id ?? data.senderId ?? data.sender_id;
                const msgReceiverId =
                  payload.receiverId ?? payload.receiver_id ?? data.receiverId ?? data.receiver_id;
                const msgChatroomId =
                  data.chatroomId ?? payload.chatroomId ?? payload.chatroom_id;

                const isForThisDm =
                  (msgSenderId == currentUserId && (msgReceiverId == chatId || msgChatroomId == chatId)) ||
                  (msgSenderId == chatId && (msgReceiverId == currentUserId || msgChatroomId == chatId));

                if (isForThisDm && payload?.id != null) {
                  // Normalize senderId: payload.senderId may be null if ws.userId was unset
                  // at insert time, but data.senderId (top-level event field) is always set.
                  const normalizedPayload = (payload.senderId != null)
                    ? payload
                    : { ...payload, senderId: msgSenderId };
                  setMessages((prev) => {
                    if (prev.some((m) => m.id == normalizedPayload.id)) return prev;
                    return [...prev, normalizedPayload];
                  });
                  scrollToBottom();
                } else if (import.meta.env.DEV) {
                  console.log("💬 WhatsApp Chat: Ignored DM message:new (not for this thread)", {
                    msgSenderId,
                    msgReceiverId,
                    msgChatroomId,
                    expected: { currentUserId, chatId },
                  });
                }
              } else if (data.chatroomId === chatId) {
                setMessages(prev => {
                  // Already have the real message
                  if (prev.some(m => m.id === data.payload.id)) return prev;
                  // Replace the matching optimistic (temp) message sent by this user
                  const optIdx = prev.findIndex(m =>
                    m.id < 0 &&
                    m.content === data.payload.content &&
                    m.senderId == data.payload.senderId
                  );
                  if (optIdx >= 0) {
                    const next = [...prev];
                    next[optIdx] = data.payload;
                    return next;
                  }
                  return [...prev, data.payload];
                });
                scrollToBottom();
              }
            }
            break;

          case 'message:edit':
            console.log('✏️ WhatsApp Chat: Message edited');
            setMessages(prev => prev.map(msg => 
              msg.id === data.payload.id
                ? { ...msg, ...data.payload, isEdited: true }
                : msg
            ));
            break;

          case 'message:delete':
            console.log('🗑️ WhatsApp Chat: Message deleted');
            setMessages(prev => prev.filter(msg => msg.id !== data.payload.messageId));
            break;

          case 'message:reaction':
            setMessages(prev => prev.map(msg => 
              msg.id === data.payload.messageId
                ? { ...msg, reactions: data.payload.reactions }
                : msg
            ));
            break;

          case 'typing:start': {
            // For DMs: chatroomId in the event is the RECEIVER's userId (current user),
            // so check that the SENDER (payload.userId) is the person we're chatting with.
            // For chatrooms/meetups: chatroomId matches chatId directly.
            const isTypingForThisChat = (data.chatType === 'dm')
              ? data.payload.userId == chatId
              : data.chatroomId == chatId;
            if (data.payload.userId !== currentUserId && isTypingForThisChat) {
              setTypingUsers(prev => new Set([...prev, data.payload.username]));
            }
            break;
          }

          case 'typing:stop': {
            const isTypingStopForThisChat = (data.chatType === 'dm')
              ? data.payload.userId == chatId
              : data.chatroomId == chatId;
            if (data.payload.userId !== currentUserId && isTypingStopForThisChat) {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.payload.username);
                return newSet;
              });
            }
            break;
          }

          case 'chatroom_renamed':
            if (data.chatroomId === chatId && data.name) {
              setDisplayTitle(data.name);
            }
            break;
          case 'member:joined':
            if (data.chatroomId === chatId || data.chatroomId == chatId) {
              console.log('👤 WhatsApp Chat: New member joined, refetching member list');
              queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
            }
            break;

          case 'member:left':
            if (data.chatroomId === chatId || data.chatroomId == chatId) {
              console.log('👋 WhatsApp Chat: Member left, refetching member list');
              queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
            }
            break;

          case 'chatroom:dissolved':
            if (data.chatroomId === chatId || data.chatroomId == chatId) {
              console.log('💥 WhatsApp Chat: Chatroom dissolved, navigating away');
              toast({ title: "Chat ended", description: "The host ended this meetup chat." });
              navigate("/messages");
            }
            break;

          case 'system:error':
            console.error('❌ WhatsApp Chat: Error:', data.payload.message);
            toast({
              title: "Error",
              description: data.payload.message,
              variant: "destructive"
            });
            break;
        }
      };

      ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setIsWsConnected(false);
        
        // Auto-reconnect after 2 seconds if not cleaning up
        if (!isCleaningUp) {
          console.log('🔄 Attempting WebSocket reconnection in 2 seconds...');
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    };

    connect();

    return () => {
      isCleaningUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (ws) ws.close();
    };
  }, [currentUserId, chatId]);

  // Clear the timeout once messages arrive or WS connects.
  useEffect(() => {
    if (messagesLoaded || isWsConnected) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  }, [messagesLoaded, isWsConnected]);

  // Polling safety net: fetch new messages every 8 seconds to catch anything
  // missed by WebSocket (e.g. after a reconnect or multi-connection edge cases).
  useEffect(() => {
    if (!messagesLoaded || !currentUserId) return;

    const pollMessages = async () => {
      try {
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
        const uidNum = Number(currentUserId || user.id || 0);
        const uid = uidNum.toString();
        const headers: Record<string, string> = { 'x-user-id': uid };
        if (user?.id) headers['x-user-data'] = JSON.stringify({ id: user.id, username: user.username, email: user.email, name: user.name });
        const chatroomsChatTypeParam = chatType === "chatroom" ? "city" : chatType;
        const url =
          chatType === "event"
            ? `${getApiBaseUrl()}/api/event-chatrooms/${chatId}/messages`
            : chatType === "meetup"
              ? `${getApiBaseUrl()}/api/available-now/group-chat/${chatId}/messages`
              : (chatType === "dm" && isMobileWeb)
                ? `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=dm&format=whatsapp`
                : chatType === "dm"
                  ? `${getApiBaseUrl()}/api/messages/${uidNum}`
                  : `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages?chatType=${chatroomsChatTypeParam}&format=whatsapp`;

        const response = await fetch(url, { headers, credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();

        // Extract messages array from response
        let incoming: any[] = [];
        if (chatType === 'dm' && data?.messages && Array.isArray(data.messages)) {
          incoming = data.messages;
        } else if (chatType === 'dm' && Array.isArray(data)) {
          const uidNumLocal = Number(currentUserId);
          const cidNumLocal = Number(chatId);
          incoming = data.filter((m: any) => {
            const s = m?.senderId; const r = m?.receiverId;
            return (s == uidNumLocal && r == cidNumLocal) || (s == cidNumLocal && r == uidNumLocal);
          }).reverse();
        } else if (chatType === 'meetup' && Array.isArray(data)) {
          incoming = data.map((m: any) => {
            const sid = m?.userId ?? m?.senderId;
            return {
              id: m?.id,
              senderId: sid,
              content: m?.message ?? m?.content ?? '',
              messageType: m?.messageType || 'text',
              createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
              sender: m?.sender || (sid ? { id: sid, username: m?.username, name: m?.username, profileImage: m?.userProfileImage || m?.profileImage } : null),
            };
          });
        } else if (Array.isArray(data)) {
          incoming = data;
        } else if (data?.messages && Array.isArray(data.messages)) {
          incoming = data.messages;
        }

        if (incoming.length === 0) return;

        // Merge: only add messages whose ID is not already in state
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = incoming.filter((m: any) => m?.id != null && !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          scrollToBottom();
          return [...prev, ...newMsgs];
        });
      } catch {
        // Silent — polling is a best-effort safety net
      }
    };

    const interval = setInterval(pollMessages, 8000);
    return () => clearInterval(interval);
  }, [messagesLoaded, currentUserId, chatId, chatType]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth", delay = 100) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      }
    }, delay);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const next = messages.length;
    prevMessageCountRef.current = next;
    if (prev === 0 && next > 0) {
      // Initial load: triple-pass scroll with instant behavior to guarantee bottom position
      scrollToBottom("instant" as ScrollBehavior, 50);
      scrollToBottom("instant" as ScrollBehavior, 200);
      scrollToBottom("instant" as ScrollBehavior, 500);
    } else if (next > prev) {
      // New message arrived: smooth scroll
      scrollToBottom("smooth", 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    console.log('📤 sendMessage called:', { 
      messageText: messageText.trim(), 
      hasWs: !!wsRef.current, 
      wsReady: wsRef.current?.readyState === WebSocket.OPEN,
      currentUserId, 
      chatType,
      chatId
    });
    
    if (!messageText.trim() || !currentUserId) {
      console.log('❌ sendMessage blocked - missing text or userId');
      return;
    }
    if (!isOnline) {
      toast({ title: "No internet connection", description: "Connect to the internet to send messages.", variant: "destructive" });
      return;
    }

    const content = messageText.trim();
    const replyToId = replyingTo?.id;
    // Snapshot replyingTo before clearing it — needed for optimistic updates
    const replyingToSnapshot = replyingTo;
    
    // Clear input immediately for responsive feel
    setMessageText("");
    setReplyingTo(null);

    // Optimistic update for DMs — show immediately, send via HTTP in background
    if (chatType === 'dm') {
      let currentUserData: any = {};
      try { currentUserData = JSON.parse(localStorage.getItem('travelconnect_user') || localStorage.getItem('user') || localStorage.getItem('current_user') || '{}'); } catch { /**/ }
      const tempId = -(Date.now());
      const optimisticMsg: Message = {
        id: tempId,
        senderId: currentUserId,
        content,
        messageType: 'text',
        replyToId,
        replyTo: replyingToSnapshot ? {
          id: replyingToSnapshot.id,
          senderId: replyingToSnapshot.senderId,
          content: replyingToSnapshot.content,
          sender: replyingToSnapshot.sender,
        } : undefined,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          username: currentUserData.username || '',
          name: currentUserData.name || '',
          profileImage: currentUserData.profileImage
        }
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      // Send via HTTP in background — replace temp message with real one on success
      (async () => {
        try {
          let user: any = {};
          try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
          const response = await fetch(`${getApiBaseUrl()}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': (currentUserId || user.id || '').toString() },
            body: JSON.stringify({ senderId: currentUserId || user.id, receiverId: chatId, content, messageType: 'text', replyToId })
          });
          if (response.ok) {
            const resp = await response.json();
            const real = resp.message || resp;
            if (real?.id) {
              setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: real.id } : m));
            }
          } else {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast({ title: "Failed to send", variant: "destructive" });
          }
        } catch {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          toast({ title: "Failed to send", variant: "destructive" });
        }
      })();
      return;
    }

    // Non-DM: send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ Sending message via WebSocket...');

      // Optimistic update — show the message immediately without waiting for server echo
      const tempId = -(Date.now());
      let currentUserData: any = {};
      try { currentUserData = JSON.parse(localStorage.getItem('travelconnect_user') || localStorage.getItem('user') || localStorage.getItem('current_user') || '{}'); } catch { /**/ }
      const optimisticMsg: Message = {
        id: tempId,
        senderId: currentUserId,
        content,
        messageType: 'text',
        replyToId,
        replyTo: replyingToSnapshot ? {
          id: replyingToSnapshot.id,
          senderId: replyingToSnapshot.senderId,
          content: replyingToSnapshot.content,
          sender: replyingToSnapshot.sender,
        } : undefined,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          username: currentUserData.username || '',
          name: currentUserData.name || '',
          profileImage: currentUserData.profileImage
        }
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      const wsPayload: any = {
        content,
        messageType: 'text',
        replyToId
      };
      wsRef.current.send(JSON.stringify({
        type: 'message:new',
        chatType,
        chatroomId: chatId,
        payload: wsPayload
      }));
      
      wsRef.current.send(JSON.stringify({
        type: 'typing:stop',
        chatType,
        chatroomId: chatId
      }));
    } else {
      // HTTP fallback when WebSocket not ready
      console.log('📡 Sending message via HTTP fallback...');
      try {
        let user: any = {};
        try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
        let endpoint = '';
        let body: any = { content, messageType: 'text', replyToId };
        
        if (chatType === 'dm') {
          // For DMs, use the direct messages endpoint (senderId required by API)
          endpoint = `${getApiBaseUrl()}/api/messages`;
          body = { senderId: currentUserId || user.id, receiverId: chatId, content, messageType: 'text', replyToId };
        } else if (chatType === 'event') {
          endpoint = `${getApiBaseUrl()}/api/event-chatrooms/${chatId}/messages`;
          body = { content };
        } else if (chatType === 'meetup') {
          endpoint = `${getApiBaseUrl()}/api/available-now/group-chat/${chatId}/messages`;
          body = { content };
        } else {
          // For chatrooms/events/meetups
          endpoint = `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages`;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': (currentUserId || user.id || '').toString()
          },
          body: JSON.stringify(body)
        });
        
        if (response.ok) {
          const resp = await response.json();
          const newMessage = resp.message || resp;
          console.log('✅ Message sent via HTTP:', newMessage);
          // Add optimistic update - normalize shapes across endpoints
          const normalized: Message | null = (() => {
            if (!newMessage) return null;
            if (chatType === 'event') {
              const senderUser = newMessage.user || null;
              return {
                id: newMessage.id,
                senderId: newMessage.senderId,
                content: newMessage.content,
                messageType: newMessage.messageType || 'text',
                mediaUrl: newMessage.mediaUrl || null,
                replyToId: newMessage.replyToId,
                createdAt: newMessage.createdAt || new Date().toISOString(),
                isEdited: newMessage.isEdited,
                reactions: newMessage.reactions,
                sender: senderUser?.id ? {
                  id: senderUser.id,
                  username: senderUser.username,
                  name: senderUser.name,
                  profileImage: senderUser.profileImage
                } : undefined
              };
            }
            if (chatType === 'meetup') {
              const senderUser = newMessage.sender || null;
              return {
                id: newMessage.id,
                senderId: newMessage.userId ?? newMessage.senderId ?? currentUserId,
                content: newMessage.message ?? newMessage.content ?? content,
                messageType: newMessage.messageType || 'text',
                mediaUrl: newMessage.mediaUrl || null,
                createdAt: newMessage.sentAt || newMessage.createdAt || new Date().toISOString(),
                sender: senderUser?.id ? {
                  id: senderUser.id,
                  username: senderUser.username,
                  name: senderUser.name,
                  profileImage: senderUser.profileImage
                } : undefined
              };
            }
            // chatroom + dm use existing shape (dm already handled elsewhere)
            return {
              id: newMessage.id ?? resp.messageId,
              senderId: currentUserId,
              content: newMessage.content ?? content,
              messageType: newMessage.messageType || 'text',
              mediaUrl: newMessage.mediaUrl || null,
              replyToId: newMessage.replyToId,
              replyTo: replyingToSnapshot ? {
                id: replyingToSnapshot.id,
                senderId: replyingToSnapshot.senderId,
                content: replyingToSnapshot.content,
                sender: replyingToSnapshot.sender,
              } : undefined,
              createdAt: newMessage.createdAt || new Date().toISOString(),
              sender: {
                id: currentUserId,
                username: user.username || 'You',
                name: user.name || 'You',
                profileImage: user.profileImage
              }
            };
          })();

          if (normalized?.id != null) {
            setMessages(prev => [...prev, normalized]);
            scrollToBottom();
          }
        } else {
          let errBody: any = {};
          try { errBody = await response.json(); } catch { try { errBody = { message: await response.text() }; } catch {} }
          console.error('❌ HTTP message send failed:', { status: response.status, chatType, chatId, endpoint, currentUserId, errBody });
          if (response.status === 403) {
            const msg = errBody?.message || '';
            if (msg.toLowerCase().includes('muted')) {
              toast({ title: "🔇 You are muted", description: "You can't send messages in this group right now.", variant: "destructive" });
            } else if (msg.toLowerCase().includes('admins only') || msg.toLowerCase().includes('only admins')) {
              toast({ title: "📢 Announcement mode", description: "Only admins can send messages right now." });
            } else {
              toast({ title: "Not allowed", description: msg || "You don't have permission to send messages.", variant: "destructive" });
            }
          } else {
            toast({ title: "Failed to send message", variant: "destructive" });
          }
          // Restore the message text so user can try again
          setMessageText(content);
        }
      } catch (error) {
        console.error('❌ HTTP message send error:', { chatType, chatId, currentUserId, error });
        toast({ title: "Failed to send message", variant: "destructive" });
        setMessageText(content);
      }
    }
    
    // Auto-focus input after sending so user can immediately type next message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const sendPhotoMessage = async (dataUrl: string) => {
    if (!dataUrl || !currentUserId) return;

    const replyToId = replyingTo?.id;
    setReplyingTo(null);

    // Non-DM chats: prefer WebSocket (same as text)
    if (chatType !== 'dm' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message:new',
        chatType,
        chatroomId: chatId,
        payload: {
          content: dataUrl,
          messageType: 'image',
          mediaUrl: dataUrl,
          replyToId
        }
      }));
      wsRef.current.send(JSON.stringify({
        type: 'typing:stop',
        chatType,
        chatroomId: chatId
      }));
      return;
    }

    // HTTP fallback (and always for DMs)
    try {
      let user: any = {};
      try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }

      let endpoint = '';
      let body: any = { content: dataUrl, messageType: 'image', mediaUrl: dataUrl, replyToId };

      if (chatType === 'dm') {
        endpoint = `${getApiBaseUrl()}/api/messages`;
        body = { senderId: currentUserId || user.id, receiverId: chatId, content: '[Photo]', messageType: 'image', mediaUrl: dataUrl, replyToId };
      } else if (chatType === 'event') {
        endpoint = `${getApiBaseUrl()}/api/event-chatrooms/${chatId}/messages`;
      } else if (chatType === 'meetup') {
        endpoint = `${getApiBaseUrl()}/api/available-now/group-chat/${chatId}/messages`;
      } else {
        endpoint = `${getApiBaseUrl()}/api/chatrooms/${chatId}/messages`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': (currentUserId || user.id || '').toString()
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const resp = await response.json();
        const newMessage = resp.message || resp;
        const normalized: Message | null = (() => {
          if (!newMessage) return null;
          if (chatType === 'event') {
            const senderUser = newMessage.user || null;
            return {
              id: newMessage.id,
              senderId: newMessage.senderId,
              content: newMessage.content || '[Photo]',
              messageType: newMessage.messageType || 'image',
              mediaUrl: newMessage.mediaUrl || dataUrl,
              replyToId: newMessage.replyToId,
              createdAt: newMessage.createdAt || new Date().toISOString(),
              isEdited: newMessage.isEdited,
              reactions: newMessage.reactions,
              sender: senderUser?.id ? {
                id: senderUser.id,
                username: senderUser.username,
                name: senderUser.name,
                profileImage: senderUser.profileImage
              } : undefined
            };
          }
          if (chatType === 'meetup') {
            const senderUser = newMessage.sender || null;
            return {
              id: newMessage.id,
              senderId: newMessage.userId ?? newMessage.senderId ?? currentUserId,
              content: newMessage.message ?? newMessage.content ?? '[Photo]',
              messageType: newMessage.messageType || 'image',
              mediaUrl: newMessage.mediaUrl || dataUrl,
              createdAt: newMessage.sentAt || newMessage.createdAt || new Date().toISOString(),
              sender: senderUser?.id ? {
                id: senderUser.id,
                username: senderUser.username,
                name: senderUser.name,
                profileImage: senderUser.profileImage
              } : undefined
            };
          }
          return {
            id: newMessage.id ?? resp.messageId,
            senderId: currentUserId,
            content: newMessage.content ?? '[Photo]',
            messageType: newMessage.messageType || 'image',
            mediaUrl: newMessage.mediaUrl || dataUrl,
            replyToId: newMessage.replyToId,
            createdAt: newMessage.createdAt || new Date().toISOString(),
            sender: {
              id: currentUserId,
              username: user.username || 'You',
              name: user.name || 'You',
              profileImage: user.profileImage
            }
          };
        })();

        if (normalized?.id != null) {
          setMessages(prev => [...prev, normalized]);
          scrollToBottom();
        }
      } else {
        toast({ title: "Failed to send photo", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Failed to send photo", variant: "destructive" });
    } finally {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onPickPhoto = async (file?: File | null) => {
    if (!file) return;
    setIsSendingPhoto(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 960, 0.72);
      await sendPhotoMessage(dataUrl);
    } finally {
      setIsSendingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Emoji auto-suggestion: check if last word matches a trigger
    if (text.endsWith(' ') || text.endsWith('\n')) {
      const words = text.trimEnd().toLowerCase().split(/\s+/);
      const lastWord = words[words.length - 1];
      const lastTwo = words.length >= 2 ? `${words[words.length - 2]} ${lastWord}` : '';
      const match = EMOJI_MAP[lastTwo] || EMOJI_MAP[lastWord];
      if (match) {
        setEmojiSuggestion({ word: EMOJI_MAP[lastTwo] ? lastTwo : lastWord, emoji: match });
      } else {
        setEmojiSuggestion(null);
      }
    } else {
      setEmojiSuggestion(null);
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'typing:start',
      chatType,
      chatroomId: chatId
    }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'typing:stop',
        chatType,
        chatroomId: chatId
      }));
    }, 3000);
  };

  const acceptEmojiSuggestion = () => {
    if (!emojiSuggestion) return;
    const { word, emoji } = emojiSuggestion;
    const currentText = messageText;
    const trimmed = currentText.trimEnd();
    const idx = trimmed.toLowerCase().lastIndexOf(word);
    if (idx >= 0) {
      const newText = trimmed.substring(0, idx) + emoji + ' ';
      setMessageText(newText);
    }
    setEmojiSuggestion(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    console.log('👍 handleReaction called:', { messageId, emoji, hasWs: !!wsRef.current, currentUserId });
    if (!wsRef.current || !currentUserId) {
      console.log('👍 handleReaction early exit - missing ws or userId');
      return;
    }

    // Optimistic update - immediately update local state
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = { ...normalizeReactions(msg.reactions) };
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      // Toggle reaction
      const userIndex = reactions[emoji].indexOf(currentUserId);
      if (userIndex > -1) {
        reactions[emoji] = reactions[emoji].filter((id: number) => id !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...reactions[emoji], currentUserId];
      }
      
      return { ...msg, reactions };
    }));

    // Send to server (will broadcast to other users)
    wsRef.current.send(JSON.stringify({
      type: 'message:reaction',
      chatType,
      chatroomId: chatId,
      payload: { messageId, emoji }
    }));
    setSelectedMessage(null);
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editText.trim()) return;
    
    try {
      // Use different endpoint for DMs vs chatrooms
      const endpoint = chatType === 'dm' 
        ? `/api/messages/${messageId}` 
        : `/api/chatroom-messages/${messageId}`;
      
      await apiRequest('PATCH', endpoint, {
        content: editText.trim(),
        userId: currentUserId
      });
      
      // Update local state immediately for instant feedback
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: editText.trim(), isEdited: true } : m
      ));
      
      toast({ title: "Message edited successfully" });
      setEditingMessageId(null);
      setEditText("");
    } catch (error: any) {
      toast({ title: "Failed to edit message", variant: "destructive" });
    }
  };

  const handlePinMessage = async (messageId: number | null) => {
    setSelectedMessage(null);
    const endpoint = (chatType === 'meetup' || chatType === 'event')
      ? `/api/meetup-chatrooms/${chatId}/pin-message`
      : `/api/chatrooms/${chatId}/pin-message`;
    try {
      const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageId }),
      });
      if (res.ok) {
        refetchPinnedMsg();
        toast({ title: messageId ? '📌 Message pinned' : 'Message unpinned' });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || 'Failed to pin message', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to pin message', variant: 'destructive' });
    }
  };

  const scrollToPinnedMessage = () => {
    if (!pinnedMessage) return;
    const el = document.querySelector(`[data-testid="message-${pinnedMessage.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight flash
      (el as HTMLElement).style.transition = 'background 0.3s';
      (el as HTMLElement).style.background = 'rgba(255,107,53,0.25)';
      setTimeout(() => { (el as HTMLElement).style.background = ''; }, 1500);
    }
  };

  const handleForwardInNT = async (msg: Message) => {
    setSelectedMessage(null);
    setForwardMessage(msg);
    setForwardLoading(true);
    try {
      let user: any = {};
      try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('travelconnect_user') || localStorage.getItem('current_user') || '{}'); } catch { user = {}; }
      const uid = currentUserId || user.id;
      const res = await fetch(`${getApiBaseUrl()}/api/messages/${uid}`, { credentials: 'include', headers: { 'x-user-id': String(uid) } });
      if (res.ok) {
        const data = await res.json();
        const convos = Array.isArray(data) ? data : [];
        // Deduplicate by otherUserId
        const seen = new Set<number>();
        const unique = convos.filter((m: any) => {
          const otherId = m.senderId == uid ? m.receiverId : m.senderId;
          if (seen.has(otherId)) return false;
          seen.add(otherId);
          return true;
        });
        setForwardConversations(unique);
      }
    } catch { /* silent */ }
    setForwardLoading(false);
  };

  const handleForwardSend = async (recipientId: number) => {
    if (!forwardMessage || !currentUserId) return;
    try {
      await fetch(`${getApiBaseUrl()}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
        credentials: 'include',
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: recipientId,
          content: forwardMessage.content,
          messageType: forwardMessage.messageType || 'text',
          mediaUrl: forwardMessage.mediaUrl || null,
        }),
      });
      toast({ title: "Message forwarded" });
    } catch {
      toast({ title: "Failed to forward", variant: "destructive" });
    }
    setForwardMessage(null);
    setForwardConversations([]);
  };

  const handleShareOutside = async (msg: Message) => {
    setSelectedMessage(null);
    const text = msg.content || '';
    if (navigator.share) {
      try {
        await navigator.share({ text, url: 'https://nearbytraveler.org' });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      } catch {
        toast({ title: "Couldn't share", variant: "destructive" });
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    // Close the menu first
    setSelectedMessage(null);
    
    try {
      // Use different endpoint for DMs vs chatrooms
      const endpoint = chatType === 'dm' 
        ? `/api/messages/${messageId}` 
        : `/api/chatroom-messages/${messageId}`;
      
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUserId?.toString() || '' 
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      // Remove from local state immediately for instant feedback
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.content);
    setSelectedMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (isToday) return time;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
    if (isYesterday) return `Yesterday ${time}`;
    const isThisYear = d.getFullYear() === now.getFullYear();
    const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', ...(isThisYear ? {} : { year: '2-digit' }) });
    return `${dateStr} ${time}`;
  };

  return (
    <div 
      ref={chatContainerRef} 
      className={`flex bg-gray-900 text-white overflow-hidden w-full h-full min-h-0 ${isMobileWeb && !embedded ? 'fixed left-0 right-0 z-50' : ''}`}
      style={isMobileWeb && !embedded ? {
        top: 0,
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0b141a'
      } : undefined}
      data-chat-page="true"
    >
      {/* Desktop Members Sidebar — matches approved DM left-panel design */}
      {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
        <aside
          className="hidden md:flex flex-col w-[280px] lg:w-[300px] xl:w-[320px] shrink-0 overflow-hidden h-full border-l-[3px] border-r-[3px] border-[#e0e0e0] dark:border-[#2d2d2d]"
          style={{ backgroundColor: '#0d1117' }}
        >
          {/* Back button */}
          <div className="px-6 pt-5 pb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Messages
            </button>
          </div>

          {/* Chatroom icon + title */}
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-5">
            {chatType === 'event' && eventImageUrl ? (
              <img
                src={eventImageUrl}
                alt={title}
                className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shrink-0">
                <Users className="w-9 h-9 text-white" />
              </div>
            )}
            <h2 className="text-xl font-bold text-white leading-tight text-center">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 text-center">{subtitle}</p>}
            {chatLocation && <p className="text-xs text-gray-500 text-center mt-0.5">📍 {chatLocation}</p>}
            {chatType === "meetup" && meetupActivityTags.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {meetupActivityTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-100 border border-gray-700"
                    data-testid="meetup-activity-tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-800 mx-6" />

          {/* Member list */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members ({members.length})</p>
              {isCurrentUserAdmin && chatType === 'chatroom' && (
                <button
                  onClick={() => adminsOnlyMutation.mutate(!isAdminsOnly)}
                  disabled={adminsOnlyMutation.isPending}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${isAdminsOnly ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                  title={isAdminsOnly ? 'Turn off announcement mode' : 'Turn on announcement mode (only admins can chat)'}
                >
                  <span>📢</span>
                  <span>{isAdminsOnly ? 'Announcement On' : 'Announcement Off'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {isMembersAccessDenied ? (
              <div className="text-center py-6 px-4">
                <p className="text-amber-400 text-sm font-medium mb-1">Meetup has ended</p>
                <p className="text-gray-500 text-xs">This room is closed. Chat history is preserved but new messages are disabled.</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No members found</p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors"
                >
                  <div
                    onClick={() => {
                      localStorage.setItem('returnToChat', JSON.stringify({ chatId, chatType, title, subtitle, eventId, timestamp: Date.now() }));
                      navigate(`/profile/${member.id}`);
                    }}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={getProfileImageUrl(member) || undefined} />
                      <AvatarFallback className="bg-green-700 text-white text-sm">
                        {getFirstName(member.name, member.username)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-white">
                        {getFirstName(member.name, member.username)}
                        {member.isAdmin && (
                          <span className={`ml-1.5 text-xs font-semibold ${chatType === 'event' || chatType === 'meetup' ? 'text-orange-400' : 'text-green-400'}`}>
                            {chatType === 'event' || chatType === 'meetup' ? '👑 Host' : 'Admin'}
                          </span>
                        )}
                        {member.isMuted && <span className="ml-1.5 text-xs text-red-400">🔇 Muted</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {isCurrentUserAdmin && member.isMuted && member.muteReason
                          ? <span className="text-red-400/70 italic">"{member.muteReason}"</span>
                          : (member.locationLabel || member.location || member.hometownCity || '')}
                      </p>
                      {chatType === 'event' && !member.isAdmin && member.rsvpStatus && (
                        <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          member.rsvpStatus === 'going'
                            ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                            : member.rsvpStatus === 'interested'
                              ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50'
                              : 'bg-gray-800 text-gray-400 border border-gray-600'
                        }`}>
                          {member.rsvpStatus === 'going' ? '✅ Going' : member.rsvpStatus === 'interested' ? '👀 Interested' : 'Invited'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isCurrentUserAdmin && member.id !== currentUserId && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {(chatType === 'chatroom' || chatType === 'event') && (
                        member.isAdmin ? (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'member' })} disabled={roleMutation.isPending} title="Remove admin">
                            👑
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-500 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'admin' })} disabled={roleMutation.isPending} title="Make admin">
                            👑
                          </Button>
                        )
                      )}
                      {member.isMuted ? (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700 flex items-center gap-1" onClick={() => unmuteMutation.mutate(member.id)} disabled={unmuteMutation.isPending}>
                          <Volume2 className="w-3.5 h-3.5" /><span>Unmute</span>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700" onClick={() => { setSelectedMember(member); setMuteDialogOpen(true); }}>
                          <VolumeX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    {/* Kick & Ban */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-orange-400 hover:text-orange-300 hover:bg-gray-700"
                      onClick={() => { if (confirm(`Remove ${member.username} from this chatroom?`)) kickMutation.mutate(member.id); }}
                      title="Kick from chatroom"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                      onClick={() => { if (confirm(`Ban ${member.username} permanently from this chatroom?`)) banMutation.mutate({ targetUserId: member.id }); }}
                      title="Ban from chatroom"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 overflow-hidden h-full md:border-r-[3px] md:border-[#e0e0e0] md:dark:border-[#2d2d2d]">
      <div className="flex flex-col h-full">
      {/* ═══ MOBILE HEADER: back | overlapping avatars | name+dot / subtitle | members+⋮ ═══ */}
      {isMobileWeb && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: 'env(safe-area-inset-top, 0px)', height: `calc(env(safe-area-inset-top, 0px) + 52px)`, minHeight: `calc(env(safe-area-inset-top, 0px) + 52px)`, maxHeight: `calc(env(safe-area-inset-top, 0px) + 52px)`, transform: 'translateZ(0)' }}>
          <div className="flex items-center h-[52px] px-2 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white hover:bg-gray-700 h-10 w-10 shrink-0 touch-target"
              data-testid="button-chat-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {chatType === 'dm' ? (
              <Avatar
                className="w-8 h-8 shrink-0 cursor-pointer"
                onClick={() => navigate(`/profile/${chatId}`)}
              >
                <AvatarImage src={props.otherUserProfileImage || undefined} />
                <AvatarFallback className="bg-green-600 text-white text-sm">{(title || '?')[0]}</AvatarFallback>
              </Avatar>
            ) : (chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && members.length > 0 ? (
              <div className="flex shrink-0">
                {members.slice(0, 4).map((member, idx) => (
                  <Avatar key={member.id} className="w-7 h-7 border-2 border-gray-800" style={idx > 0 ? { marginLeft: -8 } : undefined}>
                    <AvatarImage src={getProfileImageUrl(member) || undefined} />
                    <AvatarFallback className="bg-green-600 text-white text-[8px]">{getFirstName(member.name, member.username)[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center" style={{ marginLeft: -8 }}>
                    <span className="text-[8px] text-gray-300">+{members.length - 4}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <span className="text-xs text-gray-300 font-semibold">{(title || '?')[0]}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isEditingName && isCurrentUserAdmin && chatType !== 'dm' ? (
                  <form
                    className="flex items-center gap-1 flex-1 min-w-0"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = editNameValue.trim();
                      if (trimmed && trimmed !== displayTitle) {
                        renameChatroomMutation.mutate(trimmed);
                      } else {
                        setIsEditingName(false);
                        setEditNameValue(displayTitle);
                      }
                    }}
                  >
                    <input
                      ref={editNameInputRef}
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={() => {
                        const trimmed = editNameValue.trim();
                        if (trimmed && trimmed !== displayTitle) {
                          renameChatroomMutation.mutate(trimmed);
                        } else {
                          setIsEditingName(false);
                          setEditNameValue(displayTitle);
                        }
                      }}
                      maxLength={100}
                      className="bg-gray-700 text-white text-sm font-semibold px-2 py-0.5 rounded border border-gray-500 focus:border-blue-400 outline-none flex-1 min-w-0"
                      autoFocus
                    />
                  </form>
                ) : (
                  <span
                    className={`text-sm font-semibold text-white truncate ${isCurrentUserAdmin && chatType !== 'dm' ? 'cursor-pointer hover:underline' : ''}`}
                    onClick={() => {
                      if (isCurrentUserAdmin && chatType !== 'dm') {
                        setEditNameValue(displayTitle);
                        setIsEditingName(true);
                        setTimeout(() => editNameInputRef.current?.focus(), 50);
                      }
                    }}
                  >
                    {displayTitle || 'Chat'}
                  </span>
                )}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${messagesLoaded || isWsConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} title={messagesLoaded || isWsConnected ? 'Ready' : 'Loading...'} />
              </div>
              {subtitle && <p className="text-gray-400 truncate text-[10px] leading-tight">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-0 shrink-0">
              {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
                <Sheet open={showMembers} onOpenChange={setShowMembers}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700 h-9 w-9 touch-target" data-testid="button-members">
                      <Users className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="members-sheet-mobile bg-gray-900 border-l border-gray-700 text-white w-80">
                    <SheetHeader>
                      <div className="flex items-center justify-between">
                        <SheetTitle className="!text-lg font-semibold text-white">Members ({members.length})</SheetTitle>
                        {isCurrentUserAdmin && chatType === 'chatroom' && (
                          <button
                            onClick={() => adminsOnlyMutation.mutate(!isAdminsOnly)}
                            disabled={adminsOnlyMutation.isPending}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${isAdminsOnly ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'border-gray-600 text-gray-500'}`}
                          >
                            📢 {isAdminsOnly ? 'On' : 'Off'}
                          </button>
                        )}
                      </div>
                    </SheetHeader>
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                        data-testid="input-member-search"
                      />
                    </div>
                    <div className="mt-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 180px)' }}>
                      {isMembersAccessDenied ? (
                        <div className="text-center py-6 px-4">
                          <p className="text-amber-400 text-sm font-medium mb-1">Meetup has ended</p>
                          <p className="text-gray-500 text-xs">This room is closed. Chat history is preserved but new messages are disabled.</p>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">No members found</p>
                      ) : (
                        filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                            data-testid={`member-item-${member.id}`}
                          >
                            <div 
                              onClick={() => {
                                setShowMembers(false);
                                setMemberSearch("");
                                localStorage.setItem('returnToChat', JSON.stringify({
                                  chatId, chatType, title, subtitle, eventId,
                                  timestamp: Date.now()
                                }));
                                navigate(`/profile/${member.id}`);
                              }}
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={getProfileImageUrl(member) || undefined} />
                                <AvatarFallback className="bg-green-600 text-white text-sm">
                                  {getFirstName(member.name, member.username)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {getFirstName(member.name, member.username)}
                                  {member.isAdmin && <span className={`ml-2 text-xs font-semibold ${chatType === 'event' || chatType === 'meetup' ? 'text-orange-400' : 'text-green-400'}`}>{chatType === 'event' || chatType === 'meetup' ? '👑 Host' : 'Admin'}</span>}
                                  {member.isMuted && <span className="ml-2 text-xs text-red-400">🔇 Muted</span>}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {isCurrentUserAdmin && member.isMuted && member.muteReason
                                    ? <span className="text-red-400/70 italic">"{member.muteReason}"</span>
                                    : (member.locationLabel || member.location || member.hometownCity || 'Unknown')}
                                </p>
                                {chatType === 'event' && !member.isAdmin && member.rsvpStatus && (
                                  <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                    member.rsvpStatus === 'going'
                                      ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                                      : member.rsvpStatus === 'interested'
                                        ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50'
                                        : 'bg-gray-800 text-gray-400 border border-gray-600'
                                  }`}>
                                    {member.rsvpStatus === 'going' ? '✅ Going' : member.rsvpStatus === 'interested' ? '👀 Interested' : 'Invited'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isCurrentUserAdmin && member.id !== currentUserId && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {(chatType === 'chatroom' || chatType === 'event') && (
                                  member.isAdmin ? (
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'member' })} disabled={roleMutation.isPending} title="Remove admin">
                                      👑
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-gray-500 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'admin' })} disabled={roleMutation.isPending} title="Make admin">
                                      👑
                                    </Button>
                                  )
                                )}
                                {member.isMuted ? (
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700 flex items-center gap-1" onClick={() => unmuteMutation.mutate(member.id)} disabled={unmuteMutation.isPending} data-testid={`button-unmute-${member.id}`}>
                                    <Volume2 className="w-4 h-4" /><span>Unmute</span>
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-300 hover:bg-gray-700" onClick={() => { setSelectedMember(member); setMuteDialogOpen(true); }} data-testid={`button-mute-${member.id}`}>
                                    <VolumeX className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-9 flex items-center justify-center shrink-0 touch-target text-white hover:bg-gray-700 rounded-full"
                    onClick={() => setMoreMenuOpen(true)}
                    data-testid="button-chat-more-mobile"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-gray-900 border-t border-gray-700 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">Options</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    {chatType === "dm" ? (
                      <>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); navigate(`/profile/${chatId}`); }}>
                          <UserIcon className="w-5 h-5" /><span className="font-semibold">View Profile</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); toggleNotificationsMuted(); }}>
                          {notificationsMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <span className="font-semibold">{notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); blockDmUser(); }}>
                          <ShieldAlert className="w-5 h-5" /><span className="font-semibold">Block User</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); reportConversation(); }}>
                          <ShieldAlert className="w-5 h-5" /><span className="font-semibold">Report Conversation</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left text-red-300" onClick={() => { setMoreMenuOpen(false); deleteDmConversation(); }}>
                          <Trash2 className="w-5 h-5" /><span className="font-semibold">Delete Conversation</span>
                        </button>
                      </>
                    ) : chatType === "chatroom" ? (
                      <>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); setShowMembers(true); }}>
                          <Users className="w-5 h-5" /><span className="font-semibold">View Members</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left text-green-300" onClick={() => { setMoreMenuOpen(false); setShowInvitePanel(true); }}>
                          <UserPlus className="w-5 h-5" /><span className="font-semibold">Add People</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); toggleNotificationsMuted(); }}>
                          {notificationsMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <span className="font-semibold">{notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                        </button>
                        {chatType !== 'dm' && (
                          <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); shareChatroomLink(); }}>
                            <Share2 className="w-5 h-5" /><span className="font-semibold">Share Chatroom</span>
                          </button>
                        )}
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); reportChatroom(); }}>
                          <ShieldAlert className="w-5 h-5" /><span className="font-semibold">Report Chatroom</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left text-red-300" onClick={() => { setMoreMenuOpen(false); leaveChatroom(); }}>
                          <LogOut className="w-5 h-5" /><span className="font-semibold">Leave Chatroom</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); setShowMembers(true); }}>
                          <Users className="w-5 h-5" /><span className="font-semibold">View Members</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left text-green-300" onClick={() => { setMoreMenuOpen(false); setShowInvitePanel(true); }}>
                          <UserPlus className="w-5 h-5" /><span className="font-semibold">Add People / Invite Link</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); setShowShareSheet(true); }}>
                          <Share2 className="w-5 h-5" /><span className="font-semibold">Share Chat</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); toggleNotificationsMuted(); }}>
                          {notificationsMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <span className="font-semibold">{notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left text-red-300" onClick={() => { setMoreMenuOpen(false); leaveChatroom(); }}>
                          <LogOut className="w-5 h-5" /><span className="font-semibold">Leave Chat</span>
                        </button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP HEADER: Original single-row layout (hidden on mobile) ═══ */}
      <div
        className={`hidden md:flex items-center flex-shrink-0 gap-2 px-2 bg-gray-800 border-b border-gray-700 min-w-0 lg:py-1.5`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-white hover:bg-gray-700 h-8 w-8 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* WhatsApp-style member avatars for chatrooms, meetups, and events - hidden on desktop (lg+) since full member list is in left sidebar */}
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && members.length > 0 && (
          <div className="flex -space-x-2 lg:hidden shrink-0">
            {members.slice(0, 4).map((member, index) => (
              <div
                key={member.id}
                onClick={() => {
                  localStorage.setItem('returnToChat', JSON.stringify({
                    chatId, chatType, title, subtitle, eventId,
                    timestamp: Date.now()
                  }));
                  navigate(`/profile/${member.id}`);
                }}
                className="cursor-pointer hover:scale-110 transition-transform duration-200"
                data-testid={`avatar-member-${member.id}`}
              >
                <Avatar className="w-8 h-8 border-2 border-gray-800">
                  <AvatarImage src={getProfileImageUrl(member) || undefined} />
                  <AvatarFallback className="bg-green-600 text-white text-[10px]">
                    {getFirstName(member.name, member.username)[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
            {members.length > 4 && (
              <div 
                onClick={() => setShowMembers(true)}
                className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                data-testid="button-more-members"
              >
                <span className="text-[10px] text-gray-300">+{members.length - 4}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start gap-1.5 min-w-0">
            {isEditingName && isCurrentUserAdmin && chatType !== 'dm' ? (
              <form
                className="flex items-center gap-1 flex-1 min-w-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = editNameValue.trim();
                  if (trimmed && trimmed !== displayTitle) {
                    renameChatroomMutation.mutate(trimmed);
                  } else {
                    setIsEditingName(false);
                    setEditNameValue(displayTitle);
                  }
                }}
              >
                <input
                  ref={editNameInputRef}
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={() => {
                    const trimmed = editNameValue.trim();
                    if (trimmed && trimmed !== displayTitle) {
                      renameChatroomMutation.mutate(trimmed);
                    } else {
                      setIsEditingName(false);
                      setEditNameValue(displayTitle);
                    }
                  }}
                  maxLength={100}
                  className="bg-gray-700 text-white text-sm font-semibold px-2 py-0.5 rounded border border-gray-500 focus:border-blue-400 outline-none flex-1 min-w-0"
                  autoFocus
                />
              </form>
            ) : (
              <div
                className={`text-sm font-semibold min-w-0 line-clamp-2 leading-tight flex-1 ${isCurrentUserAdmin && chatType !== 'dm' ? 'cursor-pointer hover:underline' : ''}`}
                title={displayTitle || 'Chat'}
                role="heading"
                aria-level={1}
                onClick={() => {
                  if (isCurrentUserAdmin && chatType !== 'dm') {
                    setEditNameValue(displayTitle);
                    setIsEditingName(true);
                    setTimeout(() => editNameInputRef.current?.focus(), 50);
                  }
                }}
              >
                {displayTitle || 'Chat'}
              </div>
            )}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
              messagesLoaded || isWsConnected 
                ? 'bg-green-500' 
                : 'bg-yellow-500 animate-pulse'
            }`} 
                  title={messagesLoaded || isWsConnected ? 'Ready' : 'Loading...'} />
          </div>
          {subtitle && (
            <p className="text-gray-400 truncate leading-tight text-xs min-w-0 max-w-full">
              {subtitle}
            </p>
          )}
          {chatType === "meetup" && meetupActivityTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {meetupActivityTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-700 text-gray-100 border border-gray-600"
                  data-testid="meetup-activity-tag"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
          <Sheet open={showMembers} onOpenChange={setShowMembers}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-gray-700 min-h-[44px] min-w-[44px] h-11 w-11 touch-target" data-testid="button-members">
                <Users className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="members-sheet-mobile bg-gray-900 border-l border-gray-700 text-white w-80">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="!text-lg font-semibold text-white">Members ({members.length})</SheetTitle>
                  {isCurrentUserAdmin && chatType === 'chatroom' && (
                    <button
                      onClick={() => adminsOnlyMutation.mutate(!isAdminsOnly)}
                      disabled={adminsOnlyMutation.isPending}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${isAdminsOnly ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'border-gray-600 text-gray-500'}`}
                    >
                      📢 {isAdminsOnly ? 'On' : 'Off'}
                    </button>
                  )}
                </div>
              </SheetHeader>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  data-testid="input-member-search"
                />
              </div>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100dvh-180px)]">
                {isMembersAccessDenied ? (
                  <div className="text-center py-6 px-4">
                    <p className="text-amber-400 text-sm font-medium mb-1">Meetup has ended</p>
                    <p className="text-gray-500 text-xs">This room is closed. Chat history is preserved but new messages are disabled.</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No members found</p>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                      data-testid={`member-item-${member.id}`}
                    >
                      <div 
                        onClick={() => {
                          setShowMembers(false);
                          setMemberSearch("");
                          localStorage.setItem('returnToChat', JSON.stringify({
                            chatId, chatType, title, subtitle, eventId,
                            timestamp: Date.now()
                          }));
                          navigate(`/profile/${member.id}`);
                        }}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getProfileImageUrl(member) || undefined} />
                          <AvatarFallback className="bg-green-600 text-white text-sm">
                            {getFirstName(member.name, member.username)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {getFirstName(member.name, member.username)}
                            {member.isAdmin && <span className={`ml-2 text-xs font-semibold ${chatType === 'event' || chatType === 'meetup' ? 'text-orange-400' : 'text-green-400'}`}>{chatType === 'event' || chatType === 'meetup' ? '👑 Host' : 'Admin'}</span>}
                            {member.isMuted && <span className="ml-2 text-xs text-red-400">🔇 Muted</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {isCurrentUserAdmin && member.isMuted && member.muteReason
                              ? <span className="text-red-400/70 italic">"{member.muteReason}"</span>
                              : (member.locationLabel || member.location || member.hometownCity || 'Unknown')}
                          </p>
                        </div>
                      </div>
                      {isCurrentUserAdmin && member.id !== currentUserId && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {(chatType === 'chatroom' || chatType === 'event') && (
                            member.isAdmin ? (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'member' })} disabled={roleMutation.isPending} title="Remove admin">
                                👑
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-gray-500 hover:text-orange-300 hover:bg-gray-700" onClick={() => roleMutation.mutate({ targetUserId: member.id, role: 'admin' })} disabled={roleMutation.isPending} title="Make admin">
                                👑
                              </Button>
                            )
                          )}
                          {member.isMuted ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700 flex items-center gap-1"
                              onClick={() => unmuteMutation.mutate(member.id)}
                              disabled={unmuteMutation.isPending}
                              data-testid={`button-unmute-${member.id}`}
                            >
                              <Volume2 className="w-4 h-4" /><span>Unmute</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-400 hover:text-red-300 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedMember(member);
                                setMuteDialogOpen(true);
                              }}
                              data-testid={`button-mute-${member.id}`}
                            >
                              <VolumeX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
        {/* Add People + Share buttons — desktop header */}
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInvitePanel(true)}
              className="text-white hover:bg-gray-700 h-8 w-8"
              title="Add people"
              data-testid="button-add-people-desktop"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
            {chatType !== 'dm' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareSheet(true)}
                className="text-white hover:bg-gray-700 h-8 w-8"
                title="Share chatroom"
                data-testid="button-share-chatroom-desktop"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}

        {/* 3-dot menu: dropdown on desktop (mobile uses SheetContent below via shared moreMenuOpen state) */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700 h-8 w-8" data-testid="button-chat-more">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 text-white border border-gray-700">
              {chatType === "dm" ? (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/profile/${chatId}`)}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleNotificationsMuted}>
                    {(notificationsMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />)}
                    {notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={blockDmUser}>
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={reportConversation}>
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Report Conversation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-red-300 focus:text-red-200" onClick={deleteDmConversation}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </>
              ) : chatType === "chatroom" ? (
                <>
                  <DropdownMenuItem onClick={() => setShowMembers(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleNotificationsMuted}>
                    {(notificationsMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />)}
                    {notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareChatroomLink}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Chatroom
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={reportChatroom}>
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Report Chatroom
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-red-300 focus:text-red-200" onClick={leaveChatroom}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Chatroom
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => setShowMembers(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Members
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-green-400 focus:text-green-300" onClick={() => setShowInvitePanel(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add People / Invite Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleNotificationsMuted}>
                    {(notificationsMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />)}
                    {notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-red-300 focus:text-red-200" onClick={leaveChatroom}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Native iOS uses the app's header, so render activity tags just below it */}
      {isNativeIOSApp() && chatType === "meetup" && meetupActivityTags.length > 0 && (
        <div className="md:hidden px-3 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex flex-wrap gap-1">
            {meetupActivityTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-100 border border-gray-700"
                data-testid="meetup-activity-tag"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── PINNED MESSAGE BANNER ─────────────────────────────────────────── */}
      {/* Desktop: sits naturally in the flex column between header and messages */}
      {pinnedMessage && chatType !== 'dm' && !isMobileWeb && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-orange-500/30 px-3 py-1.5 flex items-center gap-2 min-w-0">
          <Pin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <button
            onClick={scrollToPinnedMessage}
            className="flex-1 min-w-0 text-left"
          >
            <span className="text-xs text-orange-300 font-medium">{pinnedMessage.senderName}: </span>
            <span className="text-xs text-gray-300 truncate">
              {pinnedMessage.content.slice(0, 60)}{pinnedMessage.content.length > 60 ? '…' : ''}
            </span>
          </button>
          {isCurrentUserAdmin && (
            <button
              onClick={() => handlePinMessage(null)}
              className="shrink-0 text-gray-500 hover:text-gray-300 p-0.5"
              title="Unpin message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {/* Mobile: fixed below the fixed header — rendered via portal-like direct positioning */}
      {pinnedMessage && chatType !== 'dm' && isMobileWeb && (
        <div
          style={{
            position: 'fixed',
            top: `calc(env(safe-area-inset-top, 0px) + 52px)`,
            left: 0, right: 0,
            zIndex: 999,
          }}
          className="bg-gray-800 border-b border-orange-500/30 px-3 py-1.5 flex items-center gap-2"
        >
          <Pin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <button
            onClick={scrollToPinnedMessage}
            className="flex-1 min-w-0 text-left"
          >
            <span className="text-xs text-orange-300 font-medium">{pinnedMessage.senderName}: </span>
            <span className="text-xs text-gray-300 truncate inline-block max-w-[60vw] align-bottom">
              {pinnedMessage.content.slice(0, 60)}{pinnedMessage.content.length > 60 ? '…' : ''}
            </span>
          </button>
          {isCurrentUserAdmin && (
            <button
              onClick={() => handlePinMessage(null)}
              className="shrink-0 text-gray-500 hover:text-gray-300 p-0.5"
              title="Unpin message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Messages - Flex wrapper ensures proper spacing; min-h-0 allows flex child to shrink */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-0 relative">
        {/* Fixed center logo watermark — stays in place while messages scroll */}
        <img src="/logo_transparent.png" alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, opacity: 0.06, pointerEvents: 'none', zIndex: 1, background: 'none', border: 'none', boxShadow: 'none', mixBlendMode: 'screen' }} />
        {/* Scrollable messages area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pt-1 pb-2 bg-[#0f1117] relative" style={{
          overscrollBehavior: 'contain', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' as any,
          paddingTop: isMobileWeb ? `calc(env(safe-area-inset-top, 0px) + ${chatType === 'dm' ? '62px' : '52px'} + ${pinnedMessage && chatType !== 'dm' ? '40px' : '4px'})` : undefined,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23999999' stroke-width='2' opacity='0.18'%3E%3Cpath d='M100 50 L100 150 M57 75 L143 125 M57 125 L143 75'/%3E%3Cpath d='M200 200 L250 250 M250 200 L200 250'/%3E%3Crect x='350' y='50' width='80' height='80' rx='10'/%3E%3Cpath d='M500 150 Q550 100 600 150 T700 150'/%3E%3Cpath d='M150 270 L180 300 L150 330 L120 300 Z'/%3E%3Cpath d='M300 350 L320 380 L340 340 L360 380 L380 340'/%3E%3Crect x='450' y='300' width='60' height='100' rx='30'/%3E%3Cpath d='M600 350 L650 300 L700 350 Z'/%3E%3Cpath d='M100 460 L140 500 L100 540 L60 500 Z'/%3E%3Cpath d='M250 500 C250 450 350 450 350 500 S250 550 250 500'/%3E%3Crect x='450' y='480' width='70' height='70' rx='15'/%3E%3Cpath d='M600 500 L650 520 L670 470 L620 450 Z'/%3E%3Cpath d='M150 665 L159 693 L188 693 L165 710 L174 738 L150 722 L126 738 L135 710 L112 693 L141 693 Z'/%3E%3Cpath d='M300 680 Q350 650 400 680'/%3E%3Crect x='500' y='650' width='90' height='60' rx='8'/%3E%3Cpath d='M150 150 L180 180 M180 150 L150 180'/%3E%3C/g%3E%3Ctext x='400' y='380' text-anchor='middle' font-family='Arial, sans-serif' font-size='52' font-weight='bold' fill='%23aaaaaa' opacity='0.04' transform='rotate(-18 400 400)'%3ENearby Traveler%3C/text%3E%3Ctext x='400' y='700' text-anchor='middle' font-family='Arial, sans-serif' font-size='40' font-weight='bold' fill='%23aaaaaa' opacity='0.04' transform='rotate(-18 400 700)'%3ENearby Traveler%3C/text%3E%3C/svg%3E")`,
          backgroundAttachment: 'local',
        }}>
          <div className="flex flex-col min-h-full justify-end w-full">
            {readOnlyBanner && (
              <div className="mx-1 my-2 px-3 py-2 rounded-lg bg-amber-900/60 border border-amber-600/40 text-amber-200 text-sm text-center">
                {readOnlyBanner}
              </div>
            )}
            {graceBanner && !readOnlyBanner && (
              <div className="mx-1 my-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-600/30 text-gray-400 text-xs text-center">
                {graceBanner}
              </div>
            )}
            <div className="space-y-1">
            {messages.map((message, index) => {
              // Use == for type-coerced comparison since currentUserId from localStorage may be string
              const isOwnMessage = message.senderId == currentUserId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
              // Resolve sender: embedded data → memberProfilesById cache → DM partner props fallback
              // Check for DISPLAYABLE name (not just id) — sender objects can have id but null username+name
              const senderHasName = !!(message.sender?.username || message.sender?.name);
              const resolvedSender = senderHasName
                ? message.sender
                : memberProfilesById[message.senderId]
                  ? memberProfilesById[message.senderId]
                  : (chatType === 'dm' && message.senderId == chatId && props.otherUserUsername)
                    ? { id: chatId, username: props.otherUserUsername, name: null, profileImage: props.otherUserProfileImage ?? null }
                    : null;
              
              if (message.messageType === 'system') {
                return (
                  <div key={message.id} className="flex justify-center my-1.5">
                    <span className="px-3 py-1 rounded-full text-[12px] text-gray-300 bg-gray-800/70 border border-gray-700/50 select-none text-center max-w-[80%]">
                      {message.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={message.id} className={`flex gap-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <div className={`flex-shrink-0 rounded-full ${(resolvedSender as any)?.ambassadorStatus === 'active' ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                      <Avatar 
                        className={`w-7 h-7 ${showAvatar ? 'visible' : 'invisible'} cursor-pointer hover:ring-2 hover:ring-green-400 transition-all`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const profileId = resolvedSender?.id || message.senderId;
                          if (profileId) navigate(`/profile/${profileId}`);
                        }}
                      >
                        <AvatarImage src={getProfileImageUrl(resolvedSender) || undefined} />
                        <AvatarFallback className="text-xs">{resolvedSender?.username?.[0]?.toUpperCase() || resolvedSender?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div 
                    className={`chat-message-container relative max-w-[65%] ${isOwnMessage ? 'mr-4' : 'ml-1'}`}
                    style={{ 
                      WebkitTapHighlightColor: 'rgba(255, 165, 0, 0.2)',
                      WebkitUserSelect: 'text',
                      userSelect: 'text',
                      touchAction: 'pan-y',
                      transform: swipingMessageId === message.id ? `translateX(${isOwnMessage ? -swipeOffset : swipeOffset}px)` : 'none',
                      transition: swipingMessageId === message.id ? 'none' : 'transform 0.2s ease-out',
                      cursor: 'pointer'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, message)}
                    onTouchMove={(e) => handleTouchMove(e, message, isOwnMessage)}
                    onTouchEnd={(e) => handleTouchEnd(e, message)}
                    onDoubleClick={() => {
                      console.log('Double-click on message (desktop):', message.id);
                      setSelectedMessage(message);
                    }}
                    data-testid={`message-${message.id}`}
                  >
                    {/* Swipe reply indicator */}
                    {swipingMessageId === message.id && swipeOffset > 20 && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'}`}
                        style={{ opacity: Math.min(swipeOffset / 60, 1) }}
                      >
                        <div className={`w-8 h-8 rounded-full bg-green-600 flex items-center justify-center ${swipeOffset > 60 ? 'scale-110' : ''}`}>
                          <Reply className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {message.replyToId && (() => {
                      // Fall back to looking up the replied message in the current messages array.
                      // This covers: WS incoming messages, optimistic sends before server echo,
                      // and any path that sets replyToId but not the full replyTo object.
                      const resolvedReply = message.replyTo ?? messages.find(m => m.id === message.replyToId) ?? null;
                      if (!resolvedReply) return null;
                      const replySenderName = (resolvedReply as any).sender?.name ?? (resolvedReply as any).senderUser?.name ?? null;
                      const replySenderUsername = (resolvedReply as any).sender?.username ?? (resolvedReply as any).senderUser?.username ?? null;
                      return (
                        <div className={`mb-1 px-3 py-2 rounded-t-lg border-l-4 ${isOwnMessage ? 'bg-green-900/80 border-green-300' : 'bg-gray-600/80 border-green-500'}`}>
                          <p className={`text-xs font-bold mb-0.5 ${isOwnMessage ? 'text-green-200' : 'text-green-400'}`}>
                            ↩ Replying to {getFirstName(replySenderName, replySenderUsername)}
                          </p>
                          <p className={`text-xs ${isOwnMessage ? 'text-green-100/90' : 'text-gray-200'} truncate italic`}>
                            "{resolvedReply.content}"
                          </p>
                        </div>
                      );
                    })()}

                    {editingMessageId === message.id ? (
                      <div 
                        className={`px-3 py-2 rounded-2xl chat-message-bubble ${message.replyToId ? 'rounded-tl-none' : ''}`}
                        style={{ backgroundColor: isOwnMessage ? '#005c4b' : '#374151', border: 'none' }}
                      >
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                          }}
                          className="w-full mb-2 bg-gray-800 border-gray-600 text-white resize-none"
                          style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
                          rows={1}
                          data-testid="textarea-edit-message"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleEditMessage(message.id)} 
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditMessage(message.id);
                            }}
                            className="bg-green-600 hover:bg-green-700" 
                            style={{ touchAction: 'manipulation' }}
                            data-testid="button-save-edit"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelEdit}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            style={{ touchAction: 'manipulation' }}
                            data-testid="button-cancel-edit"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`px-3 py-1.5 rounded-2xl chat-message-bubble ${message.replyToId ? 'rounded-tl-none' : ''}`}
                        style={{ 
                          backgroundColor: isOwnMessage ? '#005c4b' : '#202c33', 
                          color: '#ffffff',
                          border: 'none'
                        }}
                      >
                        {!isOwnMessage && showAvatar && (
                          <p 
                            className="text-[13px] font-semibold mb-0.5 cursor-pointer hover:underline" 
                            style={{ color: '#4ade80' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const profileId = resolvedSender?.id || message.senderId;
                              if (profileId) navigate(`/profile/${profileId}`);
                            }}
                          >
                            {resolvedSender ? getFirstName(resolvedSender.name, resolvedSender.username) : null}
                          </p>
                        )}
                        {(() => {
                          const isImage =
                            message.messageType === 'image' ||
                            message.messageType === 'photo' ||
                            (!!message.mediaUrl && String(message.mediaUrl).length > 0) ||
                            (typeof message.content === 'string' && message.content.startsWith('data:image'));
                          const src = (message.mediaUrl && String(message.mediaUrl)) || (isImage ? message.content : '');

                          if (!isImage) {
                            return <p className="text-[15px] whitespace-pre-wrap break-words">{message.content}</p>;
                          }

                          return (
                            <div className="mt-1">
                              <img
                                src={src}
                                alt="Photo"
                                className="rounded-lg max-w-[240px] sm:max-w-[320px] max-h-[320px] object-cover cursor-pointer border border-white/10"
                                loading="lazy"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxSrc(src);
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = document.createElement('p');
                                  fallback.textContent = '[Photo unavailable]';
                                  fallback.className = 'text-xs text-gray-400 italic';
                                  target.parentElement?.appendChild(fallback);
                                }}
                              />
                            </div>
                          );
                        })()}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[11px] opacity-70">{formatTimestamp(message.createdAt)}</span>
                          {message.isEdited && <span className="text-[11px] opacity-60 italic" data-testid="text-edited-indicator">Edited</span>}
                          {/* Read receipt checkmarks — DM sent messages only */}
                          {chatType === 'dm' && isOwnMessage && (
                            <span className={`text-[11px] ml-0.5 ${
                              message.readAt ? 'text-[#53bdeb]' : 'opacity-40'
                            }`}>
                              {message.readAt ? '✓✓' : '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 mt-1 ml-2">
                        {Object.entries(normalizeReactions(message.reactions)).map(([emoji, users]) => (
                          <div key={emoji} className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                            <span>{emoji}</span>
                            <span className="text-gray-400">{(users as number[]).length}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Fixed footer area - outside scrollable div */}
        {typingUsers.size > 0 && (
          <div className="px-3 py-1 text-xs text-gray-400 bg-gray-800">
            <div className="w-full">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
          </div>
        )}

        {replyingTo && (
          <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-green-400 font-semibold">Replying to {getFirstName(replyingTo.sender?.name, replyingTo.sender?.username)}</p>
                <p className="text-xs text-gray-300 truncate">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-gray-400 min-h-[44px] min-w-[44px] h-11 w-11 md:h-6 md:w-6 p-0 flex items-center justify-center">✕</Button>
            </div>
          </div>
        )}

        {/* Input box — native app: no bottom nav; mobile web: safe area only (no nav overlap since nav hidden on chat); desktop: small pb-3 since container already stops above bottom nav */}
        {(readOnly || isMembersAccessDenied) ? (
          <div
            className={`chat-input-area flex flex-col items-center justify-center gap-1 px-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 ${isNativeIOSApp() ? 'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]' : isMobileWeb ? 'pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]' : 'pb-3'}`}
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-400 text-sm font-medium">
                {isMembersAccessDenied ? 'This meetup room has closed' : 'This hangout has ended — messages are read-only'}
              </span>
            </div>
            {isMembersAccessDenied && (
              <span className="text-gray-500 text-xs">Chat history is preserved. The room will be removed shortly.</span>
            )}
          </div>
        ) : currentUserIsMuted ? (
          <div
            className={`chat-input-area flex flex-col items-center justify-center gap-1 px-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 ${isNativeIOSApp() ? 'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]' : isMobileWeb ? 'pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]' : 'pb-3'}`}
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm font-medium">You have been muted in this group</span>
            </div>
            <span className="text-gray-500 text-xs">You can read messages but cannot send any.</span>
          </div>
        ) : (isAdminsOnly && !isCurrentUserAdmin) ? (
          <div
            className={`chat-input-area flex flex-col items-center justify-center gap-1 px-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 ${isNativeIOSApp() ? 'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]' : isMobileWeb ? 'pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]' : 'pb-3'}`}
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <span className="text-gray-300 text-sm font-medium">Announcement mode — only admins can send messages</span>
            </div>
          </div>
        ) : (
        <div className={`chat-input-area px-3 py-1.5 bg-gray-800 border-t border-gray-700 flex-shrink-0 ${isNativeIOSApp() ? 'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]' : isMobileWeb ? 'pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]' : 'pb-3'}`}>
          <div className="w-full">
          {/* Connection status - only show briefly if not connected AND no messages loaded */}
          {!messagesLoaded && !isWsConnected && !loadError && (
            <div className="text-center text-yellow-400 text-xs mb-2 animate-pulse">Loading...</div>
          )}
          {!messagesLoaded && !isWsConnected && !!loadError && (
            <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">{loadError}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs border-red-500/40 text-red-100 hover:bg-red-500/10"
                onClick={() => {
                  setLoadError(null);
                  fetchMessagesViaHttp();
                }}
                data-testid="button-chat-retry-load"
              >
                Retry
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2 relative">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
            />
            <Button
              onClick={() => photoInputRef.current?.click()}
              disabled={!currentUserId || !isOnline || isSendingPhoto || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))}
              size="icon"
              variant="ghost"
              className="rounded-full min-h-[44px] min-w-[44px] h-11 w-11 md:h-9 md:w-9 shrink-0 text-white hover:bg-gray-700 touch-target"
              title="Send photo"
              data-testid="button-send-photo"
            >
              <Camera className="w-4 h-4" />
            </Button>
            {/* Emoji suggestion popup */}
            {emojiSuggestion && (
              <div className="absolute bottom-full left-12 mb-1 z-20">
                <button
                  onClick={acceptEmojiSuggestion}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg shadow-lg text-sm text-white hover:bg-gray-600 transition-colors"
                >
                  <span className="text-lg">{emojiSuggestion.emoji}</span>
                  <span className="text-xs text-gray-300">Replace "{emojiSuggestion.word}"</span>
                </button>
              </div>
            )}
            <Textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  // Reset height after send
                  const el = e.currentTarget;
                  requestAnimationFrame(() => { el.style.height = 'auto'; });
                }
              }}
              placeholder="Message"
              className="flex-1 bg-gray-700 border-gray-600 text-white resize-none rounded-2xl px-3 py-2 text-sm"
              style={{ minHeight: '36px', maxHeight: '120px', overflowY: 'auto' }}
              rows={1}
              disabled={chatType !== 'dm' && !messagesLoaded && !isWsConnected}
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageText.trim() || !currentUserId || !isOnline || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))}
              size="icon"
              className={`rounded-full min-h-[44px] min-w-[44px] h-11 w-11 md:h-9 md:w-9 shrink-0 touch-target ${
                !currentUserId || !isOnline || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={!isOnline ? 'No internet connection' : !currentUserId ? 'Not logged in' : 'Send message'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          </div>
        </div>
        )}
      </div>
      </div>
      </div>
      
      {/* Mute Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Mute Member</DialogTitle>
            <DialogDescription>
              Mute {selectedMember?.username} from sending messages in this chatroom.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="mute-reason">Reason (optional)</Label>
              <Input
                id="mute-reason"
                placeholder="Enter reason for muting..."
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMuteDialogOpen(false);
                setMuteReason("");
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMember) {
                  const params: { targetUserId: number, reason?: string } = { 
                    targetUserId: selectedMember.id
                  };
                  if (muteReason.trim()) {
                    params.reason = muteReason.trim();
                  }
                  muteMutation.mutate(params);
                }
              }}
              disabled={muteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {muteMutation.isPending ? 'Muting...' : 'Mute User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Host Leave Modal — shown when the chat host taps "Leave" on a meetup/event chat */}
      {showHostLeaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80" onClick={() => setShowHostLeaveModal(false)}>
          <div
            className="w-full max-w-md bg-gray-900 rounded-t-2xl pb-8 pt-4 px-4 border-t border-gray-700 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 rounded-full bg-gray-600 mx-auto mb-5" />

            {hostLeaveStep === 'choice' && (
              <>
                <h3 className="text-white font-semibold text-lg mb-1 text-center">Leave Meetup Chat</h3>
                <p className="text-gray-400 text-sm text-center mb-6">You're the host. Choose what happens when you leave.</p>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 mb-3 text-white text-left"
                  onClick={() => setHostLeaveStep('transfer')}
                >
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="font-medium">Transfer Host</div>
                    <div className="text-xs text-gray-400">Pick a member to become the new host, then you leave</div>
                  </div>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 mb-3 text-red-400 text-left"
                  onClick={() => setHostLeaveStep('dissolve-confirm')}
                >
                  <span className="text-2xl">🔴</span>
                  <div>
                    <div className="font-medium">End Chat for Everyone</div>
                    <div className="text-xs text-gray-500">Dissolves the chat — all members are removed</div>
                  </div>
                </button>
                <button
                  className="w-full py-3 rounded-xl text-gray-400 hover:text-white mt-1"
                  onClick={() => setShowHostLeaveModal(false)}
                >
                  Cancel
                </button>
              </>
            )}

            {hostLeaveStep === 'transfer' && (
              <>
                <button className="text-gray-400 hover:text-white mb-3 flex items-center gap-1 text-sm" onClick={() => setHostLeaveStep('choice')}>
                  ← Back
                </button>
                <h3 className="text-white font-semibold text-lg mb-4">Choose New Host</h3>
                <div className="overflow-y-auto max-h-56 space-y-1 mb-4">
                  {(membersRaw as any[])
                    .filter((m: any) => {
                      const mid = m.userId ?? m.id;
                      const uid = Number(currentUserId);
                      return mid && mid !== uid && (m.isActive !== false);
                    })
                    .map((m: any) => {
                      const mid = m.userId ?? m.id;
                      const name = m.firstName || m.username || m.name || `User ${mid}`;
                      const selected = transferTargetUserId === mid;
                      return (
                        <button
                          key={mid}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selected ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-gray-800 hover:bg-gray-700'}`}
                          onClick={() => setTransferTargetUserId(mid)}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {name[0]?.toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{name}</span>
                          {selected && <span className="ml-auto text-orange-400 text-lg">✓</span>}
                        </button>
                      );
                    })
                  }
                  {(membersRaw as any[]).filter((m: any) => (m.userId ?? m.id) !== Number(currentUserId)).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No other members to transfer to</p>
                  )}
                </div>
                <button
                  disabled={!transferTargetUserId}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
                  onClick={confirmTransferHost}
                >
                  Transfer &amp; Leave
                </button>
              </>
            )}

            {hostLeaveStep === 'dissolve-confirm' && (
              <>
                <button className="text-gray-400 hover:text-white mb-3 flex items-center gap-1 text-sm" onClick={() => setHostLeaveStep('choice')}>
                  ← Back
                </button>
                <h3 className="text-white font-semibold text-lg mb-2 text-center">End Chat for Everyone?</h3>
                <p className="text-gray-400 text-sm text-center mb-6">This will dissolve the chat and remove all members. This can't be undone.</p>
                <button
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium mb-3"
                  onClick={confirmDissolve}
                >
                  Yes, End Chat
                </button>
                <button
                  className="w-full py-3 rounded-xl text-gray-400 hover:text-white"
                  onClick={() => setShowHostLeaveModal(false)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Message Action Menu - Portal rendered at body level for proper iOS fixed positioning */}
      {selectedMessage && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-transparent z-[99998]"
            onClick={() => {
              // iOS fires a synthetic click ~100-300ms after a long press ends.
              // Guard against it immediately closing the panel we just opened.
              if (Date.now() - longPressActivatedAtRef.current < 600) return;
              setSelectedMessage(null);
            }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMessage(null); }}
            style={{ touchAction: 'auto' }}
          />
          {/* Bottom Sheet Menu - aligned to chat container width */}
          <div 
            className="fixed bg-gray-800 rounded-2xl shadow-2xl z-[99999] border border-gray-700"
            style={{
              touchAction: 'auto',
              bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              left: chatContainerRef.current
                ? `${chatContainerRef.current.getBoundingClientRect().left + 8}px`
                : '8px',
              right: chatContainerRef.current
                ? `${window.innerWidth - chatContainerRef.current.getBoundingClientRect().right + 8}px`
                : '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Emoji reaction row — WhatsApp style */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center justify-between gap-1">
                {['❤️', '😂', '😮', '😢', '🙏', '👍'].map((emoji) => {
                  const normalizedReactions = normalizeReactions(selectedMessage.reactions);
                  const hasReacted = currentUserId ? normalizedReactions[emoji]?.includes(currentUserId) : false;
                  const count = normalizedReactions[emoji]?.length || 0;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction(selectedMessage.id, emoji); setSelectedMessage(null); }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction(selectedMessage.id, emoji); setSelectedMessage(null); }}
                      className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all ${hasReacted ? 'bg-gray-600 scale-110' : 'hover:bg-gray-700 active:bg-gray-600'}`}
                      style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                    >
                      <span className="text-2xl leading-none pointer-events-none">{emoji}</span>
                      {count > 0 && <span className={`text-[10px] mt-0.5 pointer-events-none font-semibold ${hasReacted ? 'text-orange-400' : 'text-gray-400'}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-gray-700" />

            {/* Action buttons */}
            <div className="px-2 py-2 space-y-1">
              {selectedMessage.senderId == currentUserId ? (
                /* YOUR OWN MESSAGE: Edit and Delete */
                <>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      startEdit(selectedMessage); 
                      setSelectedMessage(null);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)' }}
                    data-testid="button-edit-message"
                  >
                    <Edit2 className="w-5 h-5 text-blue-400 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Edit</span>
                  </button>
                  <button 
                    type="button" 
                    onTouchEnd={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteMessage(selectedMessage.id); 
                    }}
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteMessage(selectedMessage.id); 
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(239, 68, 68, 0.3)' }}
                    data-testid="button-delete-message"
                  >
                    <Trash2 className="w-5 h-5 text-red-400 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Delete</span>
                  </button>
                </>
              ) : (
                /* OTHER PERSON'S MESSAGE: Reply + Admin actions */
                <>
                  <button
                    type="button"
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setReplyingTo(selectedMessage); setSelectedMessage(null); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyingTo(selectedMessage); setSelectedMessage(null); }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.3)' }}
                    data-testid="button-reply-message"
                  >
                    <Reply className="w-5 h-5 text-green-400 pointer-events-none" />
                    <span className="text-sm pointer-events-none">Reply</span>
                  </button>

                  {/* Admin actions on other user's messages */}
                  {isCurrentUserAdmin && chatType === 'chatroom' && (
                    <>
                      <div className="mx-1 border-t border-gray-700 my-1" />
                      <button
                        type="button"
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMessage(selectedMessage.id); }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMessage(selectedMessage.id); }}
                        className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <Trash2 className="w-5 h-5 text-red-400 pointer-events-none" />
                        <span className="text-sm pointer-events-none">Delete Message</span>
                      </button>
                      <button
                        type="button"
                        onTouchEnd={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const sender = members.find(m => m.id === selectedMessage.senderId);
                          if (sender && !sender.isMuted) { setSelectedMember(sender); setMuteDialogOpen(true); }
                          else if (sender?.isMuted) { unmuteMutation.mutate(sender.id); }
                          setSelectedMessage(null);
                        }}
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const sender = members.find(m => m.id === selectedMessage.senderId);
                          if (sender && !sender.isMuted) { setSelectedMember(sender); setMuteDialogOpen(true); }
                          else if (sender?.isMuted) { unmuteMutation.mutate(sender.id); }
                          setSelectedMessage(null);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <VolumeX className="w-5 h-5 text-yellow-400 pointer-events-none" />
                        <span className="text-sm pointer-events-none">
                          {members.find(m => m.id === selectedMessage.senderId)?.isMuted ? 'Unmute Sender' : 'Mute Sender'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); kickMutation.mutate(selectedMessage.senderId); setSelectedMessage(null); }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); kickMutation.mutate(selectedMessage.senderId); setSelectedMessage(null); }}
                        className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <LogOut className="w-5 h-5 text-orange-400 pointer-events-none" />
                        <span className="text-sm pointer-events-none">Kick from Chatroom</span>
                      </button>
                      <button
                        type="button"
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); banMutation.mutate({ targetUserId: selectedMessage.senderId }); setSelectedMessage(null); }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); banMutation.mutate({ targetUserId: selectedMessage.senderId }); setSelectedMessage(null); }}
                        className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-red-400"
                        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <ShieldAlert className="w-5 h-5 pointer-events-none" />
                        <span className="text-sm pointer-events-none">Ban from Chatroom</span>
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Forward & Share — all messages */}
              <div className="mx-1 border-t border-gray-700 my-1" />
              <button
                type="button"
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleForwardInNT(selectedMessage); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleForwardInNT(selectedMessage); }}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                style={{ touchAction: 'manipulation', cursor: 'pointer' }}
              >
                <Reply className="w-5 h-5 text-blue-400 pointer-events-none scale-x-[-1]" />
                <span className="text-sm pointer-events-none">Forward in NT</span>
              </button>
              <button
                type="button"
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleShareOutside(selectedMessage); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareOutside(selectedMessage); }}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                style={{ touchAction: 'manipulation', cursor: 'pointer' }}
              >
                <Share2 className="w-5 h-5 text-purple-400 pointer-events-none" />
                <span className="text-sm pointer-events-none">Share Outside</span>
              </button>

              {/* Pin / Unpin — host/admin only, non-DM chatrooms */}
              {isCurrentUserAdmin && chatType !== 'dm' && (
                <>
                  <div className="mx-1 border-t border-gray-700 my-1" />
                  <button
                    type="button"
                    onTouchEnd={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      handlePinMessage(pinnedMessage?.id === selectedMessage.id ? null : selectedMessage.id);
                    }}
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      handlePinMessage(pinnedMessage?.id === selectedMessage.id ? null : selectedMessage.id);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                    style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                  >
                    {pinnedMessage?.id === selectedMessage.id ? (
                      <>
                        <PinOff className="w-5 h-5 text-orange-400 pointer-events-none" />
                        <span className="text-sm pointer-events-none">Unpin Message</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-5 h-5 text-orange-400 pointer-events-none" />
                        <span className="text-sm pointer-events-none">Pin Message</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Forward message modal */}
      {forwardMessage && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 z-[99998]" onClick={() => { setForwardMessage(null); setForwardConversations([]); }} />
          <div className="fixed z-[99999] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-[320px] max-h-[400px] flex flex-col"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Forward to...</span>
              <button onClick={() => { setForwardMessage(null); setForwardConversations([]); }} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {forwardLoading ? (
                <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
              ) : forwardConversations.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No conversations</p>
              ) : (
                forwardConversations.map((c: any) => {
                  const uid = currentUserId;
                  const otherId = c.senderId == uid ? c.receiverId : c.senderId;
                  const other = c.senderId == uid ? c.receiverUser : c.senderUser;
                  const name = other?.name || other?.username || `User ${otherId}`;
                  const img = other?.profileImage;
                  return (
                    <button
                      key={otherId}
                      onClick={() => handleForwardSend(otherId)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-800 text-left"
                    >
                      {img ? (
                        <img src={img} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{(name[0] || '?').toUpperCase()}</div>
                      )}
                      <span className="text-white text-sm truncate">{name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Image lightbox */}
      {lightboxSrc && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
          style={{ touchAction: 'pinch-zoom' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size photo"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'pinch-zoom' }}
          />
        </div>,
        document.body
      )}

      {/* Invite Panel — all chatroom types */}
      {showInvitePanel && currentUserId && (
        <ChatroomInvitePanel
          open={showInvitePanel}
          onClose={() => setShowInvitePanel(false)}
          chatroomType={chatType}
          chatroomId={chatId}
          chatroomName={title}
          currentUserId={currentUserId}
          dmPartnerId={chatType === 'dm' ? chatId : undefined}
        />
      )}

      {/* Share Chatroom Sheet — all chatroom types */}
      {showShareSheet && currentUserId && (
        <ShareChatroomSheet
          open={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          chatroomType={chatType}
          chatroomId={chatId}
          chatroomName={title}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
