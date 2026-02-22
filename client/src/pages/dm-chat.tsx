import React, { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "@/App";
import { getApiBaseUrl } from "@/lib/queryClient";

interface UserDetails {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  hometown?: string;
}

function getStoredUser() {
  try {
    const stored = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function DMChat() {
  const [, setLocation] = useLocation();
  const pathParts = window.location.pathname.split('/');
  const otherUserId = parseInt(pathParts[2] || '0');

  const authContext = useContext(AuthContext);
  const contextUser = authContext?.user;
  const [resolvedUser, setResolvedUser] = useState<any>(contextUser || getStoredUser() || {});

  useEffect(() => {
    if (contextUser?.id) {
      setResolvedUser(contextUser);
      return;
    }
    const stored = getStoredUser();
    if (stored?.id) {
      setResolvedUser(stored);
      return;
    }
    let cancelled = false;
    fetch(`${getApiBaseUrl()}/api/auth/user`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(sessionUser => {
        if (!cancelled && sessionUser?.id) {
          setResolvedUser(sessionUser);
          try { localStorage.setItem('user', JSON.stringify(sessionUser)); } catch {}
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [contextUser?.id]);

  const user = resolvedUser;

  const { data: otherUser, isLoading, isError } = useQuery<UserDetails>({
    queryKey: ['/api/users', otherUserId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${otherUserId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!otherUserId,
    retry: 2,
    retryDelay: 1000
  });

  if (!otherUserId || !user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Invalid conversation</p>
        <Button onClick={() => setLocation('/messages')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (isError || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">User not found</p>
        <Button onClick={() => setLocation('/messages')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName || fullName.trim() === '') return '';
    return fullName.trim().split(' ')[0] || '';
  };

  const displayName = otherUser.username || getFirstName(otherUser.name) || 'User';

  return (
    <WhatsAppChat
      chatId={otherUserId}
      chatType="dm"
      title={displayName}
      subtitle={otherUser.hometown || "Direct Message"}
      currentUserId={user.id}
    />
  );
}
