import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import WhatsAppChat from "@/components/WhatsAppChat";
import { authStorage } from "@/lib/auth";
import { getApiBaseUrl, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatroomDetails {
  id: number;
  name: string;
  description: string;
  city: string;
  country?: string;
  memberCount: number;
}

export default function WhatsAppChatroom() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(() => authStorage.getUser()?.id);

  const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const chatroomId = parseInt(pathParts[2] || '0', 10);

  // Re-check user so chat opens even if auth was injected after mount (e.g. native app)
  useEffect(() => {
    const u = authStorage.getUser();
    if (u?.id) setCurrentUserId(u.id);
  }, []);
  useEffect(() => {
    if (currentUserId) return;
    const t1 = setTimeout(() => {
      const u = authStorage.getUser();
      if (u?.id) setCurrentUserId(u.id);
    }, 300);
    const t2 = setTimeout(() => {
      const u = authStorage.getUser();
      if (u?.id) setCurrentUserId(u.id);
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [currentUserId]);

  const isValidChatroomId = chatroomId > 0 && !isNaN(chatroomId);

  const { data: chatroom, isLoading } = useQuery<ChatroomDetails>({
    queryKey: [`/api/chatrooms/${chatroomId}`],
    enabled: isValidChatroomId && !!currentUserId,
  });

  const { data: membershipCheck, isLoading: checkingMembership } = useQuery<{ isMember: boolean }>({
    queryKey: [`/api/chatrooms/${chatroomId}/members`, 'membership-check', currentUserId],
    enabled: isValidChatroomId && !!currentUserId && !hasJoined,
    queryFn: async () => {
      try {
        const u = authStorage.getUser();
        const headers: Record<string, string> = { 'x-user-id': currentUserId?.toString() || '' };
        if (u) headers['x-user-data'] = JSON.stringify({ id: u.id, username: u.username, email: u.email, name: u.name });
        const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatroomId}/members`, {
          headers
        });
        if (response.status === 403) {
          return { isMember: false };
        }
        if (response.ok) {
          return { isMember: true };
        }
        return { isMember: false };
      } catch {
        return { isMember: false };
      }
    },
    retry: 2,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/chatrooms/${chatroomId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUserId?.toString() || '' 
        },
        body: JSON.stringify({ userId: currentUserId })
      });
      if (!response.ok) throw new Error('Failed to join chatroom');
      return response.json();
    },
    onSuccess: () => {
      setHasJoined(true);
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}`] });
      toast({ title: "Joined chatroom!", description: `You're now a member of ${chatroom?.name}` });
    },
    onError: () => {
      toast({ title: "Couldn't join chatroom", description: "Please try again", variant: "destructive" });
    }
  });

  if (!isValidChatroomId) {
    window.location.href = '/chatrooms';
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Redirecting...</div>;
  }

  if (isLoading || checkingMembership || !chatroom || !currentUserId) {
    return <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>;
  }

  const isMember = hasJoined || membershipCheck?.isMember;

  if (isMember) {
    // Private DM chatrooms (iOS): go back to previous page (e.g. profile). City chatrooms: go to /chatrooms
    const isPrivateDM = chatroom.city === 'Private' && chatroom.country === 'DM';
    return (
      <WhatsAppChat
        chatId={chatroomId}
        chatType="chatroom"
        title={chatroom.name}
        subtitle={`${chatroom.memberCount} members`}
        currentUserId={currentUserId}
        onBack={() => (isPrivateDM ? navigate(-1 as any) : navigate('/chatrooms'))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center gap-3 px-4 h-12">
          <button
            onClick={() => navigate(-1 as any)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{chatroom.name}</h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {chatroom.name}
        </h2>

        {chatroom.city && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{chatroom.city}{chatroom.country ? `, ${chatroom.country}` : ''}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-6">
          <Users className="w-4 h-4" />
          <span className="text-sm">{chatroom.memberCount} members</span>
        </div>

        {chatroom.description && (
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-sm leading-relaxed">
            {chatroom.description}
          </p>
        )}

        <Button
          onClick={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-full text-base shadow-lg"
          style={{ minHeight: '48px' }}
        >
          {joinMutation.isPending ? 'Joining...' : 'Join Chatroom'}
        </Button>

        <button
          onClick={() => navigate(-1 as any)}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
