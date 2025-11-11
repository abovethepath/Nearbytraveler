import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface WhatsAppChatProps {
  chatId: number;
  chatType: 'chatroom' | 'event' | 'meetup' | 'dm';
  title: string;
  subtitle?: string;
  currentUserId?: number;
  onBack?: () => void;
}

export default function WhatsAppChat({ chatId, chatType, title, subtitle, currentUserId, onBack }: WhatsAppChatProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const sendMessage = () => {
    if (!messageText.trim() || !wsRef.current || !currentUserId) return;

    wsRef.current.send(JSON.stringify({
      type: 'message:new',
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
      chatroomId: chatId
    }));
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'typing:start',
      chatroomId: chatId
    }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'typing:stop',
        chatroomId: chatId
      }));
    }, 3000);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'message:reaction',
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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="text-white hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <div key={message.id} className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {!isOwnMessage && (
                <Avatar className={`w-8 h-8 ${showAvatar ? 'visible' : 'invisible'}`}>
                  <AvatarImage src={message.sender?.profileImage || undefined} />
                  <AvatarFallback>{message.sender?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
              )}

              <div className={`relative max-w-[75%] ${isOwnMessage ? 'mr-2' : 'ml-2'}`} onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}>
                {message.replyToId && message.replyTo && (
                  <div className="mb-1 px-3 py-2 bg-gray-800/50 rounded-t-lg border-l-4 border-orange-500">
                    <p className="text-xs text-orange-400 font-semibold">{message.replyTo.sender?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{message.replyTo.content}</p>
                  </div>
                )}

                <div className={`px-4 py-2 rounded-2xl ${isOwnMessage ? 'bg-orange-600' : 'bg-gray-700'} ${message.replyToId ? 'rounded-tl-none' : ''}`}>
                  {!isOwnMessage && showAvatar && (
                    <p className="text-xs font-semibold mb-1 text-orange-400">{message.sender?.name}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
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

      {typingUsers.size > 0 && (
        <div className="px-4 py-2 text-sm text-gray-400">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {replyingTo && (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-orange-400 font-semibold">Replying to {replyingTo.sender?.name}</p>
              <p className="text-sm text-gray-300 truncate">{replyingTo.content}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-gray-400">✕</Button>
          </div>
        </div>
      )}

      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Message"
            className="flex-1 min-h-[44px] max-h-[120px] bg-gray-700 border-gray-600 text-white resize-none rounded-full px-4 py-3"
            rows={1}
          />
          <Button onClick={sendMessage} disabled={!messageText.trim()} size="icon" className="bg-orange-600 hover:bg-orange-700 rounded-full h-11 w-11">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
