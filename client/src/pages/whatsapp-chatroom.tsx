import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Heart, Reply, Copy, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: number;
  chatroomId: number;
  senderId: number;
  content: string;
  messageType: string;
  replyToId?: number;
  reactions?: { [emoji: string]: number[] };
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  };
  replyTo?: Message;
}

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  memberCount: number;
}

export default function WhatsAppChatroom() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const chatroomId = parseInt(params.id || '0');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chatroom details
  const { data: chatroomArray } = useQuery<ChatroomDetails[]>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId
  });
  const chatroom = chatroomArray?.[0];

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id || !chatroomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🟢 WebSocket connected');
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        username: user.username
      }));

      // Request message history
      ws.send(JSON.stringify({
        type: 'sync:history',
        chatroomId,
        payload: {}
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message:', data.type);

      switch (data.type) {
        case 'sync:response':
          setMessages(data.payload.messages.reverse());
          break;

        case 'message:new':
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
          if (data.payload.userId !== user.id) {
            setTypingUsers(prev => new Set([...prev, data.payload.username]));
          }
          break;

        case 'typing:stop':
          if (data.payload.userId !== user.id) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.payload.username);
              return newSet;
            });
          }
          break;

        case 'system:error':
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
    };

    return () => {
      ws.close();
    };
  }, [user?.id, chatroomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!messageText.trim() || !wsRef.current || !user) return;

    wsRef.current.send(JSON.stringify({
      type: 'message:new',
      chatroomId,
      payload: {
        content: messageText.trim(),
        messageType: 'text',
        replyToId: replyingTo?.id
      },
      correlationId: Date.now().toString()
    }));

    setMessageText("");
    setReplyingTo(null);
    
    // Stop typing indicator
    wsRef.current.send(JSON.stringify({
      type: 'typing:stop',
      chatroomId
    }));
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (!wsRef.current) return;

    // Send typing start
    wsRef.current.send(JSON.stringify({
      type: 'typing:start',
      chatroomId
    }));

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'typing:stop',
        chatroomId
      }));
    }, 3000);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'message:reaction',
      chatroomId,
      payload: { messageId, emoji }
    }));
    setSelectedMessage(null);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setSelectedMessage(null);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
          onClick={() => navigate('/chatrooms')}
          className="text-white hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold">{chatroom?.name}</h1>
          <p className="text-xs text-gray-400">{chatroom?.memberCount} members</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.id;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <div
              key={message.id}
              className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwnMessage && (
                <Avatar className={`w-8 h-8 ${showAvatar ? 'visible' : 'invisible'}`}>
                  <AvatarImage src={message.sender?.profileImage} />
                  <AvatarFallback>{message.sender?.name?.[0]}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`relative max-w-[75%] ${isOwnMessage ? 'mr-2' : 'ml-2'}`}
                onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
              >
                {/* Reply preview */}
                {message.replyToId && message.replyTo && (
                  <div className="mb-1 px-3 py-2 bg-gray-800/50 rounded-t-lg border-l-4 border-orange-500">
                    <p className="text-xs text-orange-400 font-semibold">{message.replyTo.sender?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{message.replyTo.content}</p>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-white'
                  } ${message.replyToId ? 'rounded-tl-none' : ''}`}
                >
                  {!isOwnMessage && showAvatar && (
                    <p className="text-xs font-semibold mb-1 text-orange-400">{message.sender?.name}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-70">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Reactions */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className="flex gap-1 mt-1 ml-2">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      <div
                        key={emoji}
                        className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-xs"
                      >
                        <span>{emoji}</span>
                        <span className="text-gray-400">{users.length}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action menu */}
                {selectedMessage === message.id && (
                  <div className="absolute top-full mt-2 bg-gray-800 rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
                    <button
                      onClick={() => copyText(message.content)}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg text-left"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy text</span>
                    </button>
                    <button
                      onClick={() => handleReply(message)}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg text-left"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, '❤️')}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg text-left"
                    >
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

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-2 text-sm text-gray-400">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-orange-400 font-semibold">Replying to {replyingTo.sender?.name}</p>
              <p className="text-sm text-gray-300 truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message"
            className="flex-1 min-h-[44px] max-h-[120px] bg-gray-700 border-gray-600 text-white resize-none rounded-full px-4 py-3"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            size="icon"
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full h-11 w-11"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
