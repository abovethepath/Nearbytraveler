import { useState, useEffect, useRef, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Users } from 'lucide-react';
import { AuthContext } from '@/App';
import { SimpleAvatar } from '@/components/simple-avatar';

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface ChatMember {
  id: number;
  username: string;
  name: string;
  profileImage: string | null;
}

interface EmbeddedChatWidgetProps {
  type: 'event' | 'meetup';
  itemId: number;
  title: string;
  className?: string;
  userStatus?: string; // Add userStatus to determine if user is actually participating
}

export function EmbeddedChatWidget({ type, itemId, title, className = '', userStatus }: EmbeddedChatWidgetProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useContext(AuthContext);

  // Get or create chatroom
  const { data: chatroom, isLoading: chatroomLoading } = useQuery({
    queryKey: [`/${type}-chatrooms`, itemId],
    queryFn: async () => {
      const response = await fetch(`/api/${type}-chatrooms/${itemId}`);
      if (!response.ok) throw new Error('Failed to get chatroom');
      return response.json();
    },
    enabled: !!itemId
  });

  // Get messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/${type}-chatrooms`, chatroom?.id, 'messages'],
    queryFn: async () => {
      const userId = currentUser?.id || parseInt(localStorage.getItem('userId') || '1');
      const response = await fetch(`/api/${type}-chatrooms/${chatroom.id}/messages`, {
        headers: {
          'X-User-ID': userId.toString()
        }
      });
      if (!response.ok) throw new Error('Failed to get messages');
      return response.json();
    },
    enabled: !!chatroom?.id && isExpanded,
    refetchInterval: isExpanded ? 3000 : false // Only poll when expanded
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userId = currentUser?.id || parseInt(localStorage.getItem('userId') || '1');
      console.log('🚀 Sending message with user ID:', userId);
      
      const response = await fetch(`/api/${type}-chatrooms/${chatroom.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId.toString() // Add user ID to headers
        },
        body: JSON.stringify({ 
          content: content
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send message:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: [`/${type}-chatrooms`, chatroom?.id, 'messages'] });
    },
    onError: (error) => {
      console.error('❌ Message send error:', error);
    }
  });

  // Join chatroom mutation
  const joinChatroomMutation = useMutation({
    mutationFn: async () => {
      const userId = currentUser?.id || parseInt(localStorage.getItem('userId') || '1');
      const response = await fetch(`/api/${type}-chatrooms/${chatroom.id}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId.toString()
        }
      });
      if (!response.ok) throw new Error('Failed to join chatroom');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/${type}-chatrooms`, chatroom?.id, 'messages'] });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatroom) return;
    
    // Get user ID from localStorage as fallback
    const userId = currentUser?.id || parseInt(localStorage.getItem('userId') || '1');
    console.log('🟢 Sending message:', message.trim(), 'from user ID:', userId);
    
    sendMessageMutation.mutate(message.trim());
  };

  const handleJoinChat = () => {
    if (!currentUser || !chatroom) return;
    joinChatroomMutation.mutate();
  };

  // Remove auto-scroll that causes page jumping

  // Auto-join chatroom when it's available
  useEffect(() => {
    if (chatroom && currentUser && !joinChatroomMutation.isSuccess && isExpanded) {
      joinChatroomMutation.mutate();
    }
  }, [chatroom, currentUser, isExpanded]);

  // Show collapsed header by default
  if (!isExpanded) {
    return (
      <Card className={`w-full ${className} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`} onClick={() => setIsExpanded(true)}>
        <CardHeader className="pb-2 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat - {title}
            <span className="text-xs text-gray-500 ml-auto">(Click to open)</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (chatroomLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Loading chat...
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="ml-auto h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!chatroom) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
            <MessageCircle className="h-4 w-4" />
            Chat unavailable
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="ml-auto h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const messageCount = messages.length;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{title} Chat</span>
          {messageCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {messageCount}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="ml-auto h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Messages Area */}
        <ScrollArea className="h-40 w-full border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
          {messagesLoading ? (
            <div className="text-center text-gray-500 text-sm py-4">Loading messages...</div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg: Message) => (
                <div key={msg.id} className="text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <SimpleAvatar 
                        user={msg.user ? {
                          id: msg.user.id,
                          username: msg.user.username,
                          profileImage: msg.user.profileImage
                        } : {
                          id: msg.senderId,
                          username: 'Unknown',
                          profileImage: null
                        }}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {msg.user?.username || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 break-words">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Participants Section */}
        {type === 'meetup' && (
          <div className="border-t pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Participants
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {messages
                .map(msg => msg.user)
                .filter((user, index, self) => 
                  user && self.findIndex(u => u?.id === user?.id) === index
                )
                .slice(0, 8) // Show first 8 unique participants
                .map((user) => (
                  <div key={user!.id} className="flex items-center gap-1 text-xs">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <SimpleAvatar 
                        user={{
                          id: user!.id,
                          username: user!.username,
                          profileImage: user!.profileImage
                        }}
                        size="sm"
                      />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-16">
                      {user!.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Message Input - Always Visible */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}