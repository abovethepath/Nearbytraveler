import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, MessageSquare, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  state?: string;
  country: string;
  userType: string;
  title: string;
}

interface UserData {
  id: number;
  username: string;
  name: string;
  userType: string;
  bio: string;
  location: string;
  hometownCity: string;
  hometownState: string;
  hometownCountry: string;
  profileImage: string;
  createdAt: string;
}

export function UserListModal({ isOpen, onClose, city, state, country, userType, title }: UserListModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug logging
  console.log('UserListModal - Component rendered with:', { isOpen, city, state, country, userType, title });
  
  // Debug query state
  React.useEffect(() => {
    console.log('UserListModal - Query state:', { 
      isLoading, 
      error: error?.message, 
      usersCount: users?.length,
      enabled: !!(isOpen && city && userType),
      queryEnabled: isOpen && city && userType
    });
  }, [isLoading, error, users, isOpen, city, userType]);
  
  // Get current user for connection requests
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');

  // Fetch users based on location and type
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-by-location', city, userType, state, country],
    queryFn: async () => {
      console.log('UserListModal - Query starting with:', { city, userType, state, country, isOpen });
      
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (country) params.append('country', country);
      
      const url = `/api/users-by-location/${encodeURIComponent(city)}/${encodeURIComponent(userType)}?${params.toString()}`;
      console.log('UserListModal - Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('UserListModal - API error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('UserListModal - API returned:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!(isOpen && city && userType),
    staleTime: 0, // No cache
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Connection mutation
  const connectMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id,
          targetUserId: targetUserId 
        }),
      });
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Connection request sent!" });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: () => {
      toast({ title: "Failed to send connection request", variant: "destructive" });
    },
  });

  const getDisplayLocation = (user: UserData) => {
    if (user.hometownState) {
      return `${user.hometownCity}, ${user.hometownState}`;
    }
    return `${user.hometownCity}, ${user.hometownCountry}`;
  };

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'local': return 'Nearby Local';
      case 'current_traveler': return 'Nearby Traveler';
      case 'business': return 'Nearby Business';
      default: return userType;
    }
  };

  const handleViewProfile = (userId: number) => {
    setLocation(`/profile/${userId}`);
    onClose();
  };

  const handleSendMessage = async (userId: number) => {
    try {
      // Create or navigate to conversation
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: userId,
          content: `Hi! I saw you in the ${title.toLowerCase()} list. I'd love to connect!`
        }),
      });
      
      if (response.ok) {
        setLocation('/messages');
        onClose();
        toast({ title: "Message sent! Opening conversations..." });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  console.log('UserListModal - Rendering with:', { isOpen, city, userType, usersCount: users?.length, isLoading, error });
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <MapPin className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{users?.length || 0} found</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="text-center py-8 text-red-500 dark:text-red-400">
              Error loading users: {error.message}
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading {title.toLowerCase()}...
            </div>
          ) : (!users || users.length === 0) ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No {title.toLowerCase()} found in this area.
            </div>
          ) : (
            users.map((user: UserData) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            {getUserTypeDisplay(user.userType)}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getDisplayLocation(user)}
                          </span>
                        </div>
                        
                        {user.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleViewProfile(user.id)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <User className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSendMessage(user.id)}
                        className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => connectMutation.mutate(user.id)}
                        disabled={connectMutation.isPending}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}