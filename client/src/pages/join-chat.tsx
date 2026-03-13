import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { Users, MessageCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface ChatroomPreview {
  id: number;
  chatroomType?: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  activityType?: string;
  groupType?: string;
  memberCount: number;
}

export default function JoinChat() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Extract token from URL: /join/:token
  const token = window.location.pathname.split("/join/")[1]?.split("?")[0] ?? "";

  const {
    data: preview,
    isLoading,
    isError,
    error,
  } = useQuery<ChatroomPreview>({
    queryKey: ["/api/chatroom-join", token],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/chatroom-join/${token}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Invalid invite link");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chatroom-join/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Joined!", description: `Welcome to "${data.name}".` });
      const type = data.chatroomType || 'meetup';
      const name = encodeURIComponent(data.name || 'Chat');
      if (type === 'event') {
        navigate(`/event-chat/${data.chatroomId}`);
      } else if (type === 'chatroom') {
        navigate(`/chatroom/${data.chatroomId}`);
      } else if (type === 'dm') {
        navigate(`/messages`);
      } else {
        navigate(`/meetup-chatroom-chat/${data.chatroomId}?title=${name}&subtitle=Group+chat`);
      }
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("authenticated")) {
        toast({
          title: "Sign in first",
          description: "Create an account or log in to join this chat.",
        });
        navigate(`/?redirect=/join/${token}`);
      } else {
        toast({ title: err.message || "Couldn't join", variant: "destructive" });
      }
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Invalid invite link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-sm w-full p-6 text-center">
        {/* Brand */}
        <div className="mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-3">
            <MessageCircle className="w-7 h-7 text-orange-500" />
          </div>
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
            Nearby Traveler
          </p>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          </div>
        )}

        {isError && (
          <div className="space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Invalid invite link
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(error as Error)?.message || "This link may have expired or been removed."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")} className="mt-2">
              Go home
            </Button>
          </div>
        )}

        {preview && !isLoading && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {preview.name}
              </h1>
              {preview.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {preview.description}
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{preview.memberCount} {preview.memberCount === 1 ? "member" : "members"}</span>
                {preview.city && preview.city !== "Worldwide" && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>{preview.city}</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've been invited to join this group chat on Nearby Traveler.
            </p>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining…
                </>
              ) : (
                <>
                  Join chat
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
