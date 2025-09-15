import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, Send, ArrowLeft, Loader2, Search, Crown, Shield, User, MoreVertical, UserMinus, UserPlus, ArrowRightLeft } from "lucide-react";
import { useCSRFToken, makeCSRFRequest } from "@/hooks/useCSRFToken";

interface ChatMessage {
  id: number;
  chatroom_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  username: string;
  name: string;
  profile_image?: string;
}

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  memberCount: number;
  userIsMember: boolean;
}

interface ChatroomMember {
  id: number;
  userId: number;
  username: string;
  name: string;
  profileImage?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isActive: boolean;
}

interface MemberActionConfirmation {
  action: 'remove' | 'promote' | 'demote' | 'transfer' | null;
  member: ChatroomMember | null;
}

export default function ChatroomPage() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const rawChatroomId = parseInt(params.id || '0');
  
  
  // NAVIGATION FIX: Use proper wouter navigation for invalid IDs
  const chatroomId = (() => {
    if (rawChatroomId === 200 || rawChatroomId === 201 || rawChatroomId === 202 || rawChatroomId > 213) {
      // Use proper navigation instead of hardcoded redirect
      navigate('/chatroom/198');
      return 198; // Use valid ID temporarily
    }
    return rawChatroomId;
  })();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<MemberActionConfirmation>({ action: null, member: null });
  
  // Get current user with fallback
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  // Get CSRF token for admin operations
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken();
  
  
  // Scroll to top when entering chatroom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chatroomId]);

  // Fetch chatroom details
  const { data: chatroomArray } = useQuery<ChatroomDetails[]>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: !!chatroomId
  });
  
  // Extract the first chatroom from array (API returns array)
  const chatroom = chatroomArray?.[0];

  // Fetch chatroom members
  const { data: members = [], isLoading: membersLoading } = useQuery<ChatroomMember[]>({
    queryKey: [`/api/chatrooms/${chatroomId}/members`],
    enabled: !!chatroomId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      
      const response = await fetch(`/api/chatrooms/${chatroomId}/members`, {
        credentials: 'include' // Use session-based authentication
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // Get current user's role in the chatroom
  const currentUserMember = members.find(m => m.userId === currentUser?.id);
  const userRole = currentUserMember?.role || 'member';

  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.username.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Fetch messages with session authentication
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chatrooms/${chatroomId}/messages`],
    refetchInterval: 2000, // Refresh every 2 seconds
    enabled: !!chatroomId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      
      try {
        const response = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
          credentials: 'include' // Use session-based authentication
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('Failed to load messages:', error);
        throw error;
      }
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error("User not found");
      
      const response = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use session-based authentication
        body: JSON.stringify({
          content: content.trim()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/messages`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Member management mutations with CSRF protection
  const removeMemberMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      if (!csrfToken) {
        throw new Error('CSRF token not available - please refresh the page');
      }
      
      const response = await makeCSRFRequest(`/api/chatrooms/${chatroomId}/admin/remove`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      }, csrfToken);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // SECURITY FIX: Proper query invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', chatroomId, 'members'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}`] });
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      setConfirmAction({ action: null, member: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  });

  const promoteMemberMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      if (!csrfToken) {
        throw new Error('CSRF token not available - please refresh the page');
      }
      
      const response = await makeCSRFRequest(`/api/chatrooms/${chatroomId}/admin/promote`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      }, csrfToken);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to promote member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // SECURITY FIX: Proper query invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', chatroomId, 'members'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}`] });
      toast({
        title: "Success",
        description: "Member promoted to admin",
      });
      setConfirmAction({ action: null, member: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote member",
        variant: "destructive",
      });
    }
  });

  const demoteMemberMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      if (!csrfToken) {
        throw new Error('CSRF token not available - please refresh the page');
      }
      
      const response = await makeCSRFRequest(`/api/chatrooms/${chatroomId}/admin/demote`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      }, csrfToken);
      
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to demote member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // SECURITY FIX: Proper query invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', chatroomId, 'members'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}`] });
      toast({
        title: "Success",
        description: "Admin demoted to member",
      });
      setConfirmAction({ action: null, member: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to demote member",
        variant: "destructive",
      });
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (newOwnerId: number) => {
      if (!csrfToken) {
        throw new Error('CSRF token not available - please refresh the page');
      }
      
      const response = await makeCSRFRequest(`/api/chatrooms/${chatroomId}/admin/transfer`, {
        method: 'POST',
        body: JSON.stringify({ newOwnerId })
      }, csrfToken);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transfer ownership');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // SECURITY FIX: Proper query invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', chatroomId, 'members'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}`] });
      toast({
        title: "Success",
        description: "Ownership transferred successfully",
      });
      setConfirmAction({ action: null, member: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ownership",
        variant: "destructive",
      });
    }
  });

  // Helper functions for permissions
  const canRemoveMember = (member: ChatroomMember) => {
    if (member.userId === currentUser?.id) return false; // Can't remove self
    if (userRole === 'owner') return member.role !== 'owner';
    if (userRole === 'admin') return member.role === 'member';
    return false;
  };

  const canPromoteMember = (member: ChatroomMember) => {
    return userRole === 'owner' && member.role === 'member';
  };

  const canDemoteMember = (member: ChatroomMember) => {
    return userRole === 'owner' && member.role === 'admin';
  };

  const canTransferOwnership = (member: ChatroomMember) => {
    return userRole === 'owner' && member.userId !== currentUser?.id;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction.action || !confirmAction.member) return;
    
    switch (confirmAction.action) {
      case 'remove':
        removeMemberMutation.mutate(confirmAction.member.userId);
        break;
      case 'promote':
        promoteMemberMutation.mutate(confirmAction.member.userId);
        break;
      case 'demote':
        demoteMemberMutation.mutate(confirmAction.member.userId);
        break;
      case 'transfer':
        transferOwnershipMutation.mutate(confirmAction.member.userId);
        break;
    }
  };

  const getConfirmationMessage = () => {
    if (!confirmAction.action || !confirmAction.member) return '';
    
    const memberName = confirmAction.member.name;
    switch (confirmAction.action) {
      case 'remove':
        return `Are you sure you want to remove ${memberName} from this chatroom? They will no longer be able to access the chat.`;
      case 'promote':
        return `Are you sure you want to promote ${memberName} to admin? They will be able to manage other members.`;
      case 'demote':
        return `Are you sure you want to demote ${memberName} from admin to member?`;
      case 'transfer':
        return `Are you sure you want to transfer ownership to ${memberName}? You will lose owner privileges and cannot undo this action.`;
      default:
        return '';
    }
  };

  if (!chatroomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Chatroom</h2>
            <p className="text-gray-600 dark:text-gray-400">Chatroom not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/city-chatrooms')}
                data-testid="button-back"
                className="flex-shrink-0 hover:bg-white/20 dark:hover:bg-gray-600/20"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back</span>
              </Button>
              
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {chatroom?.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white leading-tight break-words whitespace-normal" data-testid="text-chatroom-title">
                    {chatroom?.name || `Chatroom ${chatroomId}`}
                  </CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {chatroom?.memberCount || 0} member{((chatroom?.memberCount || 0) !== 1) ? 's' : ''} • {chatroom?.city ? `${chatroom.city}, ${chatroom.state}` : 'Unknown location'}
                  </div>
                </div>
              </div>
              
              <Sheet open={participantsOpen} onOpenChange={setParticipantsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-shrink-0 hover:bg-white/20 dark:hover:bg-gray-600/20"
                    data-testid="button-participants"
                  >
                    <Users className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Participants</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Participants ({members.length})</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-10"
                        data-testid="input-member-search"
                      />
                    </div>
                    
                    {/* Members List */}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {membersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="ml-2">Loading members...</span>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {memberSearch ? 'No members found' : 'No members yet'}
                        </div>
                      ) : (
                        filteredMembers.map((member) => (
                          <div 
                            key={member.userId} 
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                            data-testid={`member-${member.userId}`}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.profileImage} alt={member.name} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate" data-testid={`text-member-name-${member.userId}`}>
                                  {member.name}
                                </p>
                                {getRoleIcon(member.role)}
                              </div>
                              <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                              <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs mt-1">
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </Badge>
                            </div>
                            
                            {/* Admin Controls */}
                            {(canRemoveMember(member) || canPromoteMember(member) || canDemoteMember(member) || canTransferOwnership(member)) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-8 h-8 p-0"
                                    data-testid={`button-member-actions-${member.userId}`}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canPromoteMember(member) && (
                                    <DropdownMenuItem 
                                      onClick={() => setConfirmAction({ action: 'promote', member })}
                                      data-testid={`action-promote-${member.userId}`}
                                    >
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Promote to Admin
                                    </DropdownMenuItem>
                                  )}
                                  {canDemoteMember(member) && (
                                    <DropdownMenuItem 
                                      onClick={() => setConfirmAction({ action: 'demote', member })}
                                      data-testid={`action-demote-${member.userId}`}
                                    >
                                      <UserMinus className="w-4 h-4 mr-2" />
                                      Demote to Member
                                    </DropdownMenuItem>
                                  )}
                                  {canTransferOwnership(member) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => setConfirmAction({ action: 'transfer', member })}
                                        data-testid={`action-transfer-${member.userId}`}
                                      >
                                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                                        Transfer Ownership
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {canRemoveMember(member) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => setConfirmAction({ action: 'remove', member })}
                                        className="text-red-600 focus:text-red-600"
                                        data-testid={`action-remove-${member.userId}`}
                                      >
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        Remove Member
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-3 mb-4" data-testid="messages-container">
              
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading messages...</span>
                </div>
              ) : (messages as ChatMessage[]).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-8 h-8 mr-2" />
                  No messages yet. Start the conversation!
                </div>
              ) : (
                (messages as ChatMessage[]).map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-center gap-2 text-xs opacity-75 mb-1">
                        {message.profile_image && (
                          <img 
                            src={message.profile_image} 
                            alt={message.username} 
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <span>@{message.username || 'Unknown'}</span>
                      </div>
                      <div>{message.content}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-message"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction.action} onOpenChange={() => setConfirmAction({ action: null, member: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {confirmAction.action === 'remove' ? 'Removal' : 
                      confirmAction.action === 'promote' ? 'Promotion' :
                      confirmAction.action === 'demote' ? 'Demotion' : 'Transfer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-action">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={confirmAction.action === 'remove' || confirmAction.action === 'transfer' ? 'bg-red-600 hover:bg-red-700' : ''}
              data-testid="button-confirm-action"
            >
              {confirmAction.action === 'remove' ? 'Remove' : 
               confirmAction.action === 'promote' ? 'Promote' :
               confirmAction.action === 'demote' ? 'Demote' : 'Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}