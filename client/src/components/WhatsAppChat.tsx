import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical, Users, Volume2, VolumeX, Edit2, Trash2, Check, X, ThumbsUp, Camera, User as UserIcon, ShieldAlert, Share2, LogOut, Lock, UserPlus } from "lucide-react";
import ChatroomInvitePanel from "@/components/ChatroomInvitePanel";
import ShareChatroomSheet from "@/components/ShareChatroomSheet";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { isNativeIOSApp } from "@/lib/nativeApp";

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
}

interface WhatsAppChatProps {
  chatId: number;
  chatType: 'chatroom' | 'event' | 'meetup' | 'dm';
  title: string;
  subtitle?: string;
  currentUserId?: number;
  onBack?: () => void;
  eventId?: number;
  meetupId?: number;
  otherUserUsername?: string;
  otherUserProfileImage?: string | null;
  readOnly?: boolean;
}


export default function WhatsAppChat(props: WhatsAppChatProps) {
  const { chatId, chatType, title, subtitle, currentUserId, onBack, eventId, meetupId, readOnly } = props;
  const [, navigate] = useLocation();
  const { toast } = useToast();
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
  const [showMembers, setShowMembers] = useState(false);
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
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
  useEffect(() => {
    if (!isMobileWeb || typeof window === 'undefined') return;
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

  const leaveChatroom = async () => {
    if (chatType === "dm") return;
    const label = chatType === "meetup" ? "meetup chat" : chatType === "event" ? "event chat" : "chatroom";
    if (typeof window !== "undefined" && !window.confirm(`Leave this ${label}?`)) return;
    try {
      const u: any = (() => {
        try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("travelconnect_user") || localStorage.getItem("current_user") || "{}"); } catch { return {}; }
      })();
      const uid = Number(currentUserId || u?.id || 0);
      const res = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/leave`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid ? String(uid) : "",
          ...(u?.id ? { "x-user-data": JSON.stringify({ id: u.id, username: u.username, email: u.email, name: u.name }) } : {}),
        },
        body: JSON.stringify({ userId: uid || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      toast({ title: `Left ${label}` });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatId}`] });
      if (onBack) onBack();
      else if (chatType === "meetup") navigate("/quick-meetups");
      else if (chatType === "event") navigate("/events");
      else navigate("/chatrooms");
    } catch (e: any) {
      toast({ title: `Couldn't leave ${label}`, description: String(e?.message || "Please try again."), variant: "destructive" });
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
            ? `${getApiBaseUrl()}/api/quick-meetup-chatrooms/${chatId}/messages`
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
            const senderUser = m?.sender || null;
            return {
              id: m?.id,
              senderId: m?.userId ?? m?.senderId,
              content: m?.message ?? m?.content ?? "",
              messageType: m?.messageType || "text",
              createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
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
          console.log("📬 WhatsApp Chat: Quick meetup HTTP fallback loaded", mapped.length, "messages");
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
      const locationLabel =
        (hometownCityFinal
          ? `${hometownCityFinal}${hometownStateFinal ? `, ${hometownStateFinal}` : ""}`
          : (locationFinal ? locationFinal : "")) || "";

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
        // Do not assume admin/moderator privileges from participant lists
        isAdmin: Boolean((item as any)?.isAdmin) || false,
        joinedAt: String((item as any)?.joinedAt ?? (item as any)?.createdAt ?? new Date().toISOString()),
        isMuted: Boolean((item as any)?.isMuted) || undefined,
      });
    }

    return out;
  }, [membersRaw, memberProfilesById]);
  
  // Check if current user is admin (use == for type coercion since currentUserId may be string)
  const currentMember = members.find(m => m.id == currentUserId);
  const isCurrentUserAdmin = currentMember?.isAdmin || false;
  
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
  
  // Unmute user mutation
  const unmuteMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatId}/unmute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId?.toString() || '' }
      });
      if (!response.ok) throw new Error('Failed to unmute user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User unmuted successfully" });
      queryClient.invalidateQueries({ queryKey: [membersEndpoint] });
    },
    onError: () => {
      toast({ title: "Failed to unmute user", variant: "destructive" });
    }
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
              ? `${getApiBaseUrl()}/api/quick-meetup-chatrooms/${chatId}/messages`
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
              const senderUser = m?.sender || null;
              return {
                id: m?.id,
                senderId: m?.userId ?? m?.senderId,
                content: m?.message ?? m?.content ?? "",
                messageType: m?.messageType || "text",
                createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
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
              ? `${getApiBaseUrl()}/api/quick-meetup-chatrooms/${chatId}/messages`
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
          incoming = data.map((m: any) => ({
            id: m?.id,
            senderId: m?.userId ?? m?.senderId,
            content: m?.message ?? m?.content ?? '',
            messageType: m?.messageType || 'text',
            createdAt: m?.sentAt || m?.createdAt || new Date().toISOString(),
            sender: m?.sender || null,
          }));
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
    if (prev === 0) {
      // Initial load: two-pass scroll to ensure mobile layout has settled
      scrollToBottom("auto", 50);
      scrollToBottom("auto", 300);
    } else {
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

    const content = messageText.trim();
    const replyToId = replyingTo?.id;
    
    // Clear input immediately for responsive feel
    setMessageText("");
    setReplyingTo(null);

    // For DMs, always send via HTTP so the sender reliably sees the message immediately.
    // WebSocket is still used for real-time receipt/typing/sync.
    if (chatType !== 'dm' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
          endpoint = `${getApiBaseUrl()}/api/quick-meetup-chatrooms/${chatId}/messages`;
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
          let errText = '';
          try { errText = JSON.stringify(await response.json()); } catch { try { errText = await response.text(); } catch {} }
          console.error('❌ HTTP message send failed:', {
            status: response.status,
            chatType,
            chatId,
            endpoint,
            body,
            currentUserId,
            errText
          });
          toast({ title: "Failed to send message", variant: "destructive" });
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
        endpoint = `${getApiBaseUrl()}/api/quick-meetup-chatrooms/${chatId}/messages`;
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

    if (!wsRef.current) return;

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

  const handleReaction = (messageId: number, emoji: string) => {
    console.log('👍 handleReaction called:', { messageId, emoji, hasWs: !!wsRef.current, currentUserId });
    if (!wsRef.current || !currentUserId) {
      console.log('👍 handleReaction early exit - missing ws or userId');
      return;
    }

    // Optimistic update - immediately update local state
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = { ...(msg.reactions || {}) };
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
      className={`flex bg-gray-900 text-white overflow-hidden w-full h-full min-h-0 ${isMobileWeb ? 'fixed left-0 right-0 z-50' : ''}`} 
      style={isMobileWeb ? { 
        top: 0, 
        height: viewportHeight ? `${viewportHeight}px` : '100dvh', 
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
        position: 'fixed',
        left: 0,
        right: 0,
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
              onClick={onBack ? onBack : () => navigate(-1 as any)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {chatType === 'event' ? 'Event' : chatType === 'meetup' ? 'Meetup' : 'Chatrooms'}
            </button>
          </div>

          {/* Chatroom icon + title */}
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shrink-0">
              <Users className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight text-center">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 text-center">{subtitle}</p>}
          </div>

          <hr className="border-gray-800 mx-6" />

          {/* Member list */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Members ({members.length})</p>
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
                        {member.isMuted && <span className="ml-1.5 text-xs text-red-400">Muted</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.locationLabel || member.location || member.hometownCity || ''}</p>
                    </div>
                  </div>
                  {isCurrentUserAdmin && member.id !== currentUserId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {member.isMuted ? (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-gray-700" onClick={() => unmuteMutation.mutate(member.id)} disabled={unmuteMutation.isPending}>
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700" onClick={() => { setSelectedMember(member); setMuteDialogOpen(true); }}>
                          <VolumeX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 overflow-hidden h-full">
      <div className="flex flex-col h-full">
      {/* ═══ MOBILE HEADER: Single-row layout (back | avatar+name+status | logo-menu) — DMs get taller header for bigger logo ═══ */}
      {isMobileWeb && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 md:hidden" style={{ position: 'sticky', top: 0, zIndex: 1000, paddingTop: 'env(safe-area-inset-top, 0px)', height: `calc(env(safe-area-inset-top, 0px) + ${chatType === 'dm' ? '62px' : '52px'})`, minHeight: `calc(env(safe-area-inset-top, 0px) + ${chatType === 'dm' ? '62px' : '52px'})`, maxHeight: `calc(env(safe-area-inset-top, 0px) + ${chatType === 'dm' ? '62px' : '52px'})`, transform: 'translateZ(0)', willChange: 'transform' }}>
          <div className={`flex items-center ${chatType === 'dm' ? 'h-[62px]' : 'h-[52px]'} px-2 gap-2`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack ? onBack() : window.history.back()}
              className="text-white hover:bg-gray-700 h-10 w-10 shrink-0 touch-target"
              data-testid="button-chat-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {chatType === 'dm' && props.otherUserProfileImage ? (
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={props.otherUserProfileImage} />
                <AvatarFallback className="bg-green-600 text-white text-sm">{(title || '?')[0]}</AvatarFallback>
              </Avatar>
            ) : (chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && members.length > 0 ? (
              <div className="flex -space-x-1.5 shrink-0">
                {members.slice(0, 2).map((member) => (
                  <Avatar key={member.id} className="w-7 h-7 border border-gray-800">
                    <AvatarImage src={getProfileImageUrl(member) || undefined} />
                    <AvatarFallback className="bg-green-600 text-white text-[8px]">{getFirstName(member.name, member.username)[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 2 && (
                  <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center">
                    <span className="text-[8px] text-gray-300">+{members.length - 2}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${chatType === 'dm' ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-gray-700 flex items-center justify-center shrink-0`}>
                <span className={`${chatType === 'dm' ? 'text-sm' : 'text-xs'} text-gray-300 font-semibold`}>{(title || '?')[0]}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`${chatType === 'dm' ? 'text-base' : 'text-[13px]'} font-semibold text-white truncate`}>{title || 'Chat'}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${messagesLoaded || isWsConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} title={messagesLoaded || isWsConnected ? 'Ready' : 'Loading...'} />
              </div>
              {subtitle && <p className={`text-gray-400 truncate ${chatType === 'dm' ? 'text-xs' : 'text-[10px]'} leading-tight`}>{subtitle}</p>}
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
                      <SheetTitle className="!text-lg font-semibold text-white">Members ({members.length})</SheetTitle>
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
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
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
                                  {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{member.locationLabel || member.location || member.hometownCity || 'Unknown'}</p>
                              </div>
                            </div>
                            {isCurrentUserAdmin && member.id !== currentUserId && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {member.isMuted ? (
                                  <Button size="sm" variant="ghost" className="h-8 text-green-400 hover:text-green-300 hover:bg-gray-700" onClick={() => unmuteMutation.mutate(member.id)} disabled={unmuteMutation.isPending} data-testid={`button-unmute-${member.id}`}>
                                    <Volume2 className="w-4 h-4" />
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
              {/* Add People + Share buttons — visible in header on all chatroom types */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInvitePanel(true)}
                className="text-white hover:bg-gray-700 h-9 w-9 touch-target shrink-0"
                title="Add people"
                data-testid="button-add-people"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareSheet(true)}
                className="text-white hover:bg-gray-700 h-9 w-9 touch-target shrink-0"
                title="Share chatroom"
                data-testid="button-share-chatroom"
              >
                <Share2 className="w-4 h-4" />
              </Button>

              <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className={`${chatType === 'dm' ? 'h-[52px] w-[52px]' : 'h-9 w-9'} flex items-center justify-center shrink-0 touch-target`}
                    onClick={() => setMoreMenuOpen(true)}
                    data-testid="button-chat-more-mobile"
                  >
                    <img src="/new-logo.png" alt="Menu" className={`${chatType === 'dm' ? 'h-[52px] w-[52px]' : 'h-10 w-10'} object-contain`} />
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
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); toggleNotificationsMuted(); }}>
                          {notificationsMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <span className="font-semibold">{notificationsMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                        </button>
                        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left" onClick={() => { setMoreMenuOpen(false); shareChatroomLink(); }}>
                          <Share2 className="w-5 h-5" /><span className="font-semibold">Share Chatroom</span>
                        </button>
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
          onClick={() => onBack ? onBack() : window.history.back()}
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
            <div
              className="text-sm font-semibold min-w-0 line-clamp-2 leading-tight flex-1"
              title={title || 'Chat'}
              role="heading"
              aria-level={1}
            >
              {title || 'Chat'}
            </div>
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
                <SheetTitle className="!text-lg font-semibold text-white">Members ({members.length})</SheetTitle>
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
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
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
                            {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{member.locationLabel || member.location || member.hometownCity || 'Unknown'}</p>
                        </div>
                      </div>
                      {isCurrentUserAdmin && member.id !== currentUserId && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {member.isMuted ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-green-400 hover:text-green-300 hover:bg-gray-700"
                              onClick={() => unmuteMutation.mutate(member.id)}
                              disabled={unmuteMutation.isPending}
                              data-testid={`button-unmute-${member.id}`}
                            >
                              <Volume2 className="w-4 h-4" />
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

      {/* Messages - Flex wrapper ensures proper spacing; min-h-0 allows flex child to shrink */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-0">
        {/* Scrollable messages area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pt-1 pb-2 bg-[#0b141a]" style={{
          overscrollBehavior: 'contain', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' as any,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23999999' stroke-width='2' opacity='0.18'%3E%3Cpath d='M100 50 L100 150 M57 75 L143 125 M57 125 L143 75'/%3E%3Cpath d='M200 200 L250 250 M250 200 L200 250'/%3E%3Crect x='350' y='50' width='80' height='80' rx='10'/%3E%3Cpath d='M500 150 Q550 100 600 150 T700 150'/%3E%3Cpath d='M150 270 L180 300 L150 330 L120 300 Z'/%3E%3Cpath d='M300 350 L320 380 L340 340 L360 380 L380 340'/%3E%3Crect x='450' y='300' width='60' height='100' rx='30'/%3E%3Cpath d='M600 350 L650 300 L700 350 Z'/%3E%3Cpath d='M100 460 L140 500 L100 540 L60 500 Z'/%3E%3Cpath d='M250 500 C250 450 350 450 350 500 S250 550 250 500'/%3E%3Crect x='450' y='480' width='70' height='70' rx='15'/%3E%3Cpath d='M600 500 L650 520 L670 470 L620 450 Z'/%3E%3Cpath d='M150 665 L159 693 L188 693 L165 710 L174 738 L150 722 L126 738 L135 710 L112 693 L141 693 Z'/%3E%3Cpath d='M300 680 Q350 650 400 680'/%3E%3Crect x='500' y='650' width='90' height='60' rx='8'/%3E%3Cpath d='M150 150 L180 180 M180 150 L150 180'/%3E%3C/g%3E%3Ctext x='400' y='380' text-anchor='middle' font-family='Arial, sans-serif' font-size='52' font-weight='bold' fill='%23aaaaaa' opacity='0.07' transform='rotate(-18 400 400)'%3ENearby Traveler%3C/text%3E%3Ctext x='400' y='700' text-anchor='middle' font-family='Arial, sans-serif' font-size='40' font-weight='bold' fill='%23aaaaaa' opacity='0.05' transform='rotate(-18 400 700)'%3ENearby Traveler%3C/text%3E%3C/svg%3E")`
        }}>
          <div className="flex flex-col min-h-full justify-end w-full">
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
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
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
                    {message.replyToId && message.replyTo && (
                      <div className={`mb-1 px-3 py-2 rounded-t-lg border-l-4 ${isOwnMessage ? 'bg-green-900/80 border-green-300' : 'bg-gray-600/80 border-green-500'}`}>
                        <p className={`text-xs font-bold mb-0.5 ${isOwnMessage ? 'text-green-200' : 'text-green-400'}`}>
                          ↩ Replying to {getFirstName(message.replyTo.sender?.name, message.replyTo.sender?.username)}
                        </p>
                        <p className={`text-xs ${isOwnMessage ? 'text-green-100/90' : 'text-gray-200'} truncate italic`}>
                          "{message.replyTo.content}"
                        </p>
                      </div>
                    )}

                    {editingMessageId === message.id ? (
                      <div 
                        className={`px-3 py-2 rounded-2xl chat-message-bubble ${message.replyToId ? 'rounded-tl-none' : ''}`}
                        style={{ backgroundColor: isOwnMessage ? '#005c4b' : '#374151', border: 'none' }}
                      >
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full mb-2 bg-gray-800 border-gray-600 text-white resize-none"
                          rows={3}
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
                            {getFirstName(resolvedSender?.name, resolvedSender?.username)}
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
                                  window.open(src, "_blank", "noopener,noreferrer");
                                }}
                              />
                            </div>
                          );
                        })()}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[11px] opacity-70">{formatTimestamp(message.createdAt)}</span>
                          {message.isEdited && <span className="text-[11px] opacity-60 italic" data-testid="text-edited-indicator">Edited</span>}
                        </div>
                      </div>
                    )}

                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 mt-1 ml-2">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <div key={emoji} className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                            <span>{emoji}</span>
                            <span className="text-gray-400">{users.length}</span>
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
          <div className="flex items-end gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
            />
            <Button
              onClick={() => photoInputRef.current?.click()}
              disabled={!currentUserId || isSendingPhoto || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))}
              size="icon"
              variant="ghost"
              className="rounded-full min-h-[44px] min-w-[44px] h-11 w-11 md:h-9 md:w-9 shrink-0 text-white hover:bg-gray-700 touch-target"
              title="Send photo"
              data-testid="button-send-photo"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message"
              className="flex-1 min-h-[36px] max-h-[100px] bg-gray-700 border-gray-600 text-white resize-none rounded-full px-3 py-2 text-sm"
              rows={1}
              disabled={chatType !== 'dm' && !messagesLoaded && !isWsConnected}
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck="true"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageText.trim() || !currentUserId || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))} 
              size="icon" 
              className={`rounded-full min-h-[44px] min-w-[44px] h-11 w-11 md:h-9 md:w-9 shrink-0 touch-target ${
                !currentUserId || (chatType !== 'dm' && (!messagesLoaded && !isWsConnected))
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={!currentUserId ? 'Not logged in' : 'Send message'}
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

      {/* Message Action Menu - Portal rendered at body level for proper iOS fixed positioning */}
      {selectedMessage && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-transparent z-[99998]"
            onClick={() => setSelectedMessage(null)}
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
                  const hasReacted = currentUserId ? selectedMessage.reactions?.[emoji]?.includes(currentUserId) : false;
                  const count = selectedMessage.reactions?.[emoji]?.length || 0;
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
                /* OTHER PERSON'S MESSAGE: Reply */
                <button 
                  type="button" 
                  onTouchEnd={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    setReplyingTo(selectedMessage); 
                    setSelectedMessage(null); 
                  }}
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    setReplyingTo(selectedMessage); 
                    setSelectedMessage(null); 
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-700 active:bg-gray-600 rounded-xl text-white"
                  style={{ touchAction: 'manipulation', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.3)' }}
                  data-testid="button-reply-message"
                >
                  <Reply className="w-5 h-5 text-green-400 pointer-events-none" />
                  <span className="text-sm pointer-events-none">Reply</span>
                </button>
              )}
            </div>
          </div>
        </>,
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
