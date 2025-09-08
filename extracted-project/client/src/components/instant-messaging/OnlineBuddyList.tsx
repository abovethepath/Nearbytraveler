import { useState, useEffect } from "react";
import { Users, MessageCircle, Minimize2, Maximize2, User } from "lucide-react";
import websocketService from "@/services/websocketService";
import { useLocation } from "wouter";

interface OnlineFriend {
  id: number;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export default function OnlineBuddyList() {
  const [friends, setFriends] = useState<OnlineFriend[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleFriendsOnline = (onlineFriends: OnlineFriend[]) => {
      console.log('📱 Online friends received:', onlineFriends);
      setFriends(onlineFriends);
    };

    const handleFriendStatusUpdate = (data: { userId: number; username: string; status: string }) => {
      console.log('📱 Friend status update:', data);
      setFriends(prev => {
        const existingIndex = prev.findIndex(f => f.id === data.userId);
        
        if (existingIndex >= 0) {
          // Update existing friend
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: data.status as 'online' | 'away' | 'offline'
          };
          
          // Remove offline friends from list
          return updated.filter(f => f.status !== 'offline');
        } else if (data.status !== 'offline') {
          // Add new online friend
          return [...prev, {
            id: data.userId,
            username: data.username,
            status: data.status as 'online' | 'away' | 'offline'
          }];
        }
        
        return prev;
      });
    };

    websocketService.on('friends_online', handleFriendsOnline);
    websocketService.on('friend_status_update', handleFriendStatusUpdate);

    return () => {
      websocketService.off('friends_online', handleFriendsOnline);
      websocketService.off('friend_status_update', handleFriendStatusUpdate);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const handleMessageFriend = (friend: OnlineFriend) => {
    // Navigate to messages and open conversation with this friend
    setLocation(`/messages?user=${friend.id}`);
  };

  if (friends.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">Online Friends</span>
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {friends.length}
            </span>
          </div>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Friends List */}
        {!isMinimized && (
          <div className="max-h-60 overflow-y-auto">
            {friends.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No friends online
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {friends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="relative">
                        <User className="w-6 h-6 text-gray-400" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusColor(friend.status)} rounded-full border border-white`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          @{friend.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getStatusText(friend.status)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMessageFriend(friend)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-all"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isMinimized && (
          <div className="p-2 border-t border-gray-200 dark:border-gray-600 text-center">
            <div className="text-xs text-gray-500">
              AOL-style instant messaging
            </div>
          </div>
        )}
      </div>
    </div>
  );
}