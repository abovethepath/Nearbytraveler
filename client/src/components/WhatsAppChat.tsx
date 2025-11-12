import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical, Users, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  replyToId?: number;
  reactions?: { [emoji: string]: number[] };
  createdAt: string;
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
  eventId?: number; // For event chats, this is the actual event ID (chatId is the chatroom ID)
}

export default function WhatsAppChat({ chatId, chatType, title, subtitle, currentUserId, onBack, eventId }: WhatsAppChatProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);
  const [muteReason, setMuteReason] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chatroom members (for city chatrooms, meetup chatrooms, and event chatrooms)
  const membersEndpoint = chatType === 'event' 
    ? `/api/event-chatrooms/${chatId}/members`
    : `/api/chatrooms/${chatId}/members`;
  
  const { data: members = [], error: membersError } = useQuery<ChatMember[]>({
    queryKey: [membersEndpoint],
    enabled: (chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && Boolean(chatId)
  });
  
  // Check if current user is admin
  const currentMember = members.find(m => m.id === currentUserId);
  const isCurrentUserAdmin = currentMember?.isAdmin || false;
  
  // Mute user mutation
  const muteMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: number, reason?: string }) => {
      const response = await fetch(`/api/chatrooms/${chatId}/mute`, {
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
      const response = await fetch(`/api/chatrooms/${chatId}/unmute`, {
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

  // Show error toast if members fetch fails
  useEffect(() => {
    if (membersError) {
      toast({
        title: "Unable to load members",
        description: "You may not have access to view this chatroom's members.",
        variant: "destructive"
      });
    }
  }, [membersError, toast]);

  // Filter members based on search
  const filteredMembers = members.filter(member => {
    if (!memberSearch) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.username?.toLowerCase().includes(searchLower) ||
      member.hometownCity?.toLowerCase().includes(searchLower)
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUserId || !chatId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    let isAuthenticated = false;

    ws.onopen = () => {
      console.log('🟢 WhatsApp Chat: WebSocket connected');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        userId: currentUserId,
        username: user.username
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 WhatsApp Chat: Received WebSocket message:', data.type);

      switch (data.type) {
        case 'auth:success':
          console.log('✅ WhatsApp Chat: Authenticated, requesting message history');
          isAuthenticated = true;
          // Now request message history
          ws.send(JSON.stringify({
            type: 'sync:history',
            chatType,
            chatroomId: chatId,
            payload: {}
          }));
          break;

        case 'sync:response':
          console.log('📬 WhatsApp Chat: Received', data.payload.messages.length, 'messages');
          setMessages(data.payload.messages.reverse());
          scrollToBottom();
          break;

        case 'message:new':
          console.log('💬 WhatsApp Chat: New message received');
          setMessages(prev => [...prev, data.payload]);
          scrollToBottom();
          break;

        case 'message:reaction':
          setMessages(prev => prev.map(msg => 
            msg.id === data.payload.messageId
              ? { ...msg, reactions: data.payload.reactions }
              : msg
          ));
          break;

        case 'typing:start':
          if (data.payload.userId !== currentUserId) {
            setTypingUsers(prev => new Set([...prev, data.payload.username]));
          }
          break;

        case 'typing:stop':
          if (data.payload.userId !== currentUserId) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.payload.username);
              return newSet;
            });
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

    ws.onclose = () => console.log('🔴 WebSocket disconnected');

    return () => ws.close();
  }, [currentUserId, chatId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = () => {
    console.log('📤 sendMessage called:', { 
      messageText: messageText.trim(), 
      hasWs: !!wsRef.current, 
      wsReady: wsRef.current?.readyState === WebSocket.OPEN,
      currentUserId, 
      chatType,
      chatId
    });
    
    if (!messageText.trim() || !wsRef.current || !currentUserId) {
      console.log('❌ sendMessage blocked:', {
        noText: !messageText.trim(),
        noWs: !wsRef.current,
        noUserId: !currentUserId
      });
      return;
    }

    console.log('✅ Sending message via WebSocket...');
    wsRef.current.send(JSON.stringify({
      type: 'message:new',
      chatType,
      chatroomId: chatId,
      payload: {
        content: messageText.trim(),
        messageType: 'text',
        replyToId: replyingTo?.id
      }
    }));

    setMessageText("");
    setReplyingTo(null);
    
    wsRef.current.send(JSON.stringify({
      type: 'typing:stop',
      chatType,
      chatroomId: chatId
    }));
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
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'message:reaction',
      chatType,
      chatroomId: chatId,
      payload: { messageId, emoji }
    }));
    setSelectedMessage(null);
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex h-[calc(100vh-145px)] bg-gray-900 text-white overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 border-b border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="text-white hover:bg-gray-700 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* WhatsApp-style member avatars for chatrooms, meetups, and events */}
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && members.length > 0 && (
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, index) => (
              <div
                key={member.id}
                onClick={() => {
                  // Store chat return info before navigating
                  localStorage.setItem('returnToChat', JSON.stringify({
                    chatId,
                    chatType,
                    title,
                    subtitle,
                    eventId // For event chats, store the eventId so we can navigate back properly
                  }));
                  navigate(`/profile/${member.id}`);
                }}
                className="cursor-pointer hover:scale-110 transition-transform duration-200"
                data-testid={`avatar-member-${member.id}`}
              >
                <Avatar className="w-8 h-8 border-2 border-gray-800">
                  <AvatarImage src={member.profileImage || undefined} />
                  <AvatarFallback className="bg-orange-600 text-white text-[10px]">
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
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-xs truncate">{title}</h1>
          {subtitle && <p className="text-[9px] text-gray-400 truncate">{subtitle}</p>}
        </div>
        {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
          <Sheet open={showMembers} onOpenChange={setShowMembers}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-gray-700 h-8 w-8" data-testid="button-members">
                <Users className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 border-l border-gray-700 text-white w-80">
              <SheetHeader>
                <SheetTitle className="text-white">Members ({members.length})</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  data-testid="input-member-search"
                />
              </div>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
                {filteredMembers.length === 0 ? (
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
                          // Store chat return info before navigating
                          localStorage.setItem('returnToChat', JSON.stringify({
                            chatId,
                            chatType,
                            title,
                            subtitle,
                            eventId // For event chats, store the eventId so we can navigate back properly
                          }));
                          navigate(`/profile/${member.id}`);
                        }}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.profileImage || undefined} />
                          <AvatarFallback className="bg-orange-600 text-white">
                            {getFirstName(member.name, member.username)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {getFirstName(member.name, member.username)}
                            {member.isAdmin && <span className="ml-2 text-xs text-orange-400">Admin</span>}
                            {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{member.hometownCity || 'Unknown'}</p>
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
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700 h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages - Flex wrapper ensures proper spacing */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col min-h-full">
            <div className="flex-grow" />
            <div className="space-y-2">
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
              
              return (
                <div key={message.id} className={`flex gap-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <Avatar className={`w-7 h-7 ${showAvatar ? 'visible' : 'invisible'}`}>
                      <AvatarImage src={message.sender?.profileImage || undefined} />
                      <AvatarFallback className="text-xs">{message.sender?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`relative max-w-[75%] ${isOwnMessage ? 'mr-2' : 'ml-2'}`} onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}>
                    {message.replyToId && message.replyTo && (
                      <div className={`mb-1 px-3 py-2 rounded-t-lg border-l-4 ${isOwnMessage ? 'bg-orange-900/80 border-orange-300' : 'bg-gray-600/80 border-orange-500'}`}>
                        <p className={`text-xs font-bold mb-0.5 ${isOwnMessage ? 'text-orange-200' : 'text-orange-400'}`}>
                          ↩ Replying to {getFirstName(message.replyTo.sender?.name, message.replyTo.sender?.username)}
                        </p>
                        <p className={`text-xs ${isOwnMessage ? 'text-orange-100/90' : 'text-gray-200'} truncate italic`}>
                          "{message.replyTo.content}"
                        </p>
                      </div>
                    )}

                    <div className={`px-3 py-1.5 rounded-2xl ${isOwnMessage ? 'bg-orange-600' : 'bg-gray-700'} ${message.replyToId ? 'rounded-tl-none' : ''}`}>
                      {!isOwnMessage && showAvatar && (
                        <p className="text-xs font-semibold mb-0.5 text-orange-400">{getFirstName(message.sender?.name, message.sender?.username)}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] opacity-70">{formatTimestamp(message.createdAt)}</span>
                      </div>
                    </div>

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

                    {selectedMessage === message.id && (
                      <div className="absolute top-full mt-2 bg-gray-800 rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
                        <button onClick={() => { navigator.clipboard.writeText(message.content); toast({ title: "Copied" }); setSelectedMessage(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg">
                          <Copy className="w-4 h-4" />
                          <span>Copy text</span>
                        </button>
                        <button onClick={() => { setReplyingTo(message); setSelectedMessage(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg">
                          <Reply className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                        <button onClick={() => handleReaction(message.id, '❤️')} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg">
                          <Heart className="w-4 h-4" />
                          <span>React</span>
                        </button>
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

        {typingUsers.size > 0 && (
          <div className="px-3 py-1 text-xs text-gray-400">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {replyingTo && (
          <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-orange-400 font-semibold">Replying to {getFirstName(replyingTo.sender?.name, replyingTo.sender?.username)}</p>
                <p className="text-xs text-gray-300 truncate">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-gray-400 h-6 w-6 p-0">✕</Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Message"
            className="flex-1 min-h-[36px] max-h-[100px] bg-gray-700 border-gray-600 text-white resize-none rounded-full px-3 py-2 text-sm"
            rows={1}
          />
          <Button onClick={sendMessage} disabled={!messageText.trim()} size="icon" className="bg-orange-600 hover:bg-orange-700 rounded-full h-9 w-9 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      </div>

      {/* Desktop Members Sidebar - Always visible on lg+ screens */}
      {(chatType === 'chatroom' || chatType === 'meetup' || chatType === 'event') && (
        <div className="hidden lg:flex lg:flex-col lg:w-[320px] bg-gray-800 border-l border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-sm text-white mb-2">Members ({members.length})</h2>
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">No members found</p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div
                    onClick={() => {
                      localStorage.setItem('returnToChat', JSON.stringify({
                        chatId,
                        chatType,
                        title,
                        subtitle,
                        eventId
                      }));
                      navigate(`/profile/${member.id}`);
                    }}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profileImage || undefined} />
                      <AvatarFallback className="bg-orange-600 text-white text-sm">
                        {getFirstName(member.name, member.username)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-white">
                        {getFirstName(member.name, member.username)}
                        {member.isAdmin && <span className="ml-2 text-xs text-orange-400">Admin</span>}
                        {member.isMuted && <span className="ml-2 text-xs text-red-400">Muted</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{member.hometownCity || 'Unknown'}</p>
                    </div>
                  </div>
                  {isCurrentUserAdmin && member.id !== currentUserId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {member.isMuted ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-gray-600"
                          onClick={() => unmuteMutation.mutate(member.id)}
                          disabled={unmuteMutation.isPending}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-600"
                          onClick={() => {
                            setSelectedMember(member);
                            setMuteDialogOpen(true);
                          }}
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
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
    </div>
  );
}
