import React, { useState, useEffect, useContext, useMemo } from "react";
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
    const stored =
      localStorage.getItem('user') ||
      localStorage.getItem('travelconnect_user') ||
      localStorage.getItem('current_user');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function getOtherUserIdFromLocation(location: string): number {
  const pathParts = location.split('?')[0].split('/').filter(Boolean);
  const pathId = pathParts[1]; // ['messages'|'dm-chat'|'chat', '123']
  let numFromPath = pathId && !isNaN(parseInt(pathId, 10)) ? parseInt(pathId, 10) : 0;
  if (!numFromPath && typeof window !== 'undefined') {
    const winPath = window.location.pathname.split('/').filter(Boolean);
    const winId = winPath[1];
    numFromPath = winId && !isNaN(parseInt(winId, 10)) ? parseInt(winId, 10) : 0;
  }
  if (numFromPath) return numFromPath;
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const q = params.get('userId') || params.get('user');
  const numFromQuery = q && !isNaN(parseInt(q, 10)) ? parseInt(q, 10) : 0;
  return numFromQuery;
}

export default function DMChat() {
  const [location, setLocation] = useLocation();
  const otherUserId = useMemo(() => getOtherUserIdFromLocation(location), [location]);

  const authContext = useContext(AuthContext);
  const contextUser = authContext?.user;
  const [resolvedUser, setResolvedUser] = useState<any>(contextUser ?? getStoredUser() ?? {});
  const [userCheckDone, setUserCheckDone] = useState(false);

  useEffect(() => {
    if (contextUser?.id) {
      setResolvedUser(contextUser);
      setUserCheckDone(true);
      return;
    }
    const stored = getStoredUser();
    if (stored?.id) {
      setResolvedUser(stored);
      setUserCheckDone(true);
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setUserCheckDone(true);
      });
    return () => { cancelled = true; };
  }, [contextUser?.id]);

  const user = resolvedUser;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Debug only: helps compare mobile vs desktop auth storage / ids
    console.log("💬 DMChat debug", {
      location,
      otherUserId,
      resolvedUserId: user?.id,
      has_user_key: !!localStorage.getItem("user"),
      has_travelconnect_user_key: !!localStorage.getItem("travelconnect_user"),
      has_current_user_key: !!localStorage.getItem("current_user"),
    });
  }, [location, otherUserId, user?.id]);

  const { data: otherUser, isLoading, isError } = useQuery<UserDetails>({
    queryKey: ['/api/users', otherUserId],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/${otherUserId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!otherUserId,
    retry: 2,
    retryDelay: 1000
  });

  if (!otherUserId) {
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

  if (!user?.id) {
    if (!userCheckDone) {
      return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-lg">Please log in to view this conversation</p>
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
      otherUserUsername={otherUser.username}
      otherUserProfileImage={otherUser.profileImage}
    />
  );
}
