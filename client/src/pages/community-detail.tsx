import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FullPageSkeleton } from "@/components/FullPageSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Users, UserPlus, MessageSquare, Send, Lock, Trash2, Clock, Heart, MessageCircle, ChevronDown, ChevronUp, MapPin, Zap, ChevronRight, Activity } from "lucide-react";
import { SkeletonList, SkeletonUserCard } from "@/components/ui/skeleton-loaders";
import WhatsAppChat from "@/components/WhatsAppChat";

function UserAvatar({ user, size = "sm" }: { user: any; size?: string }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-12 h-12 text-base";
  if (user?.profileImage) {
    return <img src={user.profileImage} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }
  const initial = (user?.username || user?.name || "?")[0].toUpperCase();
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
         style={{ backgroundColor: user?.avatarColor || "#F97316" }}>
      {initial}
    </div>
  );
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PostReplies({ postId, currentUser }: { postId: number; currentUser: any }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");

  const { data: replies = [] } = useQuery<any[]>({
    queryKey: ["/api/community-posts", postId, "replies"],
    queryFn: async () => {
      const res = await fetch(`/api/community-posts/${postId}/replies`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/community-posts/${postId}/replies`, { content });
      if (!res.ok) throw new Error("Failed to reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts", postId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["reply-counts"] });
      setReplyText("");
    },
    onError: () => {
        toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
      },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      await apiRequest("DELETE", `/api/community-posts/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts", postId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["reply-counts"] });
    },
    onError: () => {
        toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
      },
  });

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
      {replies.map((reply: any) => (
        <div key={reply.id} className="flex items-start gap-2">
          <div className="cursor-pointer" onClick={() => setLocation(`/profile/${reply.userId}`)}>
            <UserAvatar user={{ profileImage: reply.profileImage, username: reply.username, avatarColor: reply.avatarColor }} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs cursor-pointer hover:underline" onClick={() => setLocation(`/profile/${reply.userId}`)}>
                {reply.username}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
              {reply.userId === currentUser?.id && (
                <button className="text-gray-400 hover:text-red-500 ml-auto" onClick={() => deleteReplyMutation.mutate(reply.id)}>
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-wrap">{reply.content}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
          }}
          className="text-xs resize-none"
          style={{ minHeight: '32px', maxHeight: '100px', overflowY: 'auto' }}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
              e.preventDefault();
              createReplyMutation.mutate(replyText.trim());
              e.currentTarget.style.height = 'auto';
            }
          }}
        />
        <Button size="sm" variant="ghost" className="h-8 px-2 text-orange-500 hover:text-orange-600"
          disabled={!replyText.trim() || createReplyMutation.isPending}
          onClick={() => { if (replyText.trim()) createReplyMutation.mutate(replyText.trim()); }}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}


export default function CommunityDetail({ communityId }: { communityId: number }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [activeSection, setActiveSection] = useState<"feed" | "members" | "chat">("feed");
  const [newPost, setNewPost] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: community, isLoading } = useQuery<any>({
    queryKey: ["/api/community-tags", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/community-tags?includePrivate=true`);
      const tags = await res.json();
      return tags.find((t: any) => t.id === communityId) || null;
    },
  });

  const canEdit = !!currentUser?.id && (currentUser?.isAdmin || (community?.createdBy && community.createdBy === currentUser.id));

  useEffect(() => {
    if (!community) return;
    setEditName(String(community.displayName || ""));
    setEditDesc(String(community.description || ""));
  }, [community?.id]);

  const updateCommunityMutation = useMutation({
    mutationFn: async (payload: { displayName: string; description: string }) => {
      const res = await apiRequest("PATCH", `/api/community-tags/${communityId}`, payload);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed to update community");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags", communityId] });
      setEditOpen(false);
      toast({ title: "Community updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to update community", variant: "destructive" });
    },
  });

  const { data: members = [], isLoading: loadingMembers } = useQuery<any[]>({
    queryKey: ["/api/community-tags", communityId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/community-tags/${communityId}/members`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery<any[]>({
    queryKey: ["/api/community-tags", communityId, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/community-tags/${communityId}/posts`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15000,
  });

  const isMember = members.some((m: any) => m.id === currentUser?.id);

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/community-tags/${communityId}/leave`);
      if (!res.ok) throw new Error("Failed to leave");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags/mine"] });
      toast({ title: "Left community" });
      setLocation("/explore?tab=communities");
    },
    onError: () => {
      toast({ title: "Failed to leave", variant: "destructive" });
    },
  });

  // Chatroom messages for preview widget
  const { data: chatMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/chatrooms", community?.chatroomId, "messages-preview"],
    queryFn: async () => {
      if (!community?.chatroomId) return [];
      const res = await fetch(`${getApiBaseUrl()}/api/chatrooms/${community.chatroomId}/messages?limit=3`, {
        credentials: "include",
        headers: currentUser?.id ? { "x-user-id": String(currentUser.id) } : {},
      });
      if (!res.ok) return [];
      const msgs = await res.json();
      return Array.isArray(msgs) ? msgs.slice(0, 3) : [];
    },
    enabled: !!community?.chatroomId && activeSection === "feed",
  });

  // Compute community stats from member data
  const memberStats = (() => {
    const countries = new Set<string>();
    const cities = new Set<string>();
    let nearbyCount = 0;
    const userCity = currentUser?.hometownCity || currentUser?.destinationCity || "";
    for (const m of members) {
      if (m.hometownCountry) countries.add(m.hometownCountry);
      if (m.hometownCity) {
        cities.add(m.hometownCity);
        if (userCity && m.hometownCity.toLowerCase() === userCity.toLowerCase() && m.id !== currentUser?.id) {
          nearbyCount++;
        }
      }
    }
    return { countries: countries.size, cities: cities.size, nearbyCount, userCity };
  })();

  const postIds = posts.map((p: any) => p.id);

  const { data: likesData = {} } = useQuery<Record<number, { count: number; liked: boolean }>>({
    queryKey: ["post-likes", postIds.join(",")],
    queryFn: async () => {
      if (postIds.length === 0) return {};
      const res = await fetch(`/api/community-posts/likes?postIds=${postIds.join(",")}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: postIds.length > 0,
  });

  const { data: replyCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["reply-counts", postIds.join(",")],
    queryFn: async () => {
      if (postIds.length === 0) return {};
      const res = await fetch(`/api/community-posts/reply-counts?postIds=${postIds.join(",")}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: postIds.length > 0,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/community-tags/${communityId}/posts`, { content, postType: "update" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags", communityId, "posts"] });
      setNewPost("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to post", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/community-tags/${communityId}/posts/${postId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-tags", communityId, "posts"] });
      toast({ title: "Post deleted" });
    },
    onError: () => {
        toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
      },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/community-posts/${postId}/like`);
      return res.json();
    },
    onMutate: async (postId: number) => {
      const key = ["post-likes", postIds.join(",")];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Record<number, { count: number; liked: boolean }>>(key);
      if (prev && prev[postId]) {
        const updated = { ...prev };
        const wasLiked = updated[postId].liked;
        updated[postId] = { count: updated[postId].count + (wasLiked ? -1 : 1), liked: !wasLiked };
        queryClient.setQueryData(key, updated);
      }
      return { prev };
    },
    onError: (_err, _postId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["post-likes", postIds.join(",")], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post-likes"] });
    },
  });

  const toggleReplies = (postId: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  if (isLoading) {
    return <FullPageSkeleton />;
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <Button variant="ghost" onClick={() => setLocation("/explore")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <p className="text-center text-gray-500">Community not found</p>
      </div>
    );
  }

  const isChatActive = activeSection === "chat";

  return (
    <div className={`bg-gray-50 dark:bg-gray-950 ${isChatActive ? 'h-[100dvh] flex flex-col overflow-hidden' : 'min-h-screen'}`}>
      <div className={`bg-gradient-to-r from-orange-600 to-pink-500 text-white px-4 shrink-0 ${isChatActive ? 'py-3' : 'py-6'}`}>
        <div className="max-w-3xl mx-auto">
          {!isChatActive && (
            <Button variant="ghost" onClick={() => setLocation("/explore")} className="text-white/80 hover:text-white mb-2 -ml-2 px-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Explore
            </Button>
          )}
          <div className="flex items-center gap-3">
            {isChatActive && (
              <Button variant="ghost" onClick={() => setActiveSection("feed")} className="text-white/80 hover:text-white -ml-2 px-2 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className={isChatActive ? "text-2xl" : "text-4xl"}>{community.icon}</div>
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold flex items-center gap-2 ${isChatActive ? 'text-lg' : 'text-2xl'}`}>
                <span className="truncate">{community.displayName}</span>
                {community.isPrivate && <Lock className="w-5 h-5 text-white/70 shrink-0" />}
              </h1>
              <p className="text-white/70 text-sm">{community.memberCount || 0} members · {community.category}</p>
            </div>
            {!isChatActive && (
              <div className="flex gap-1.5 shrink-0">
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="bg-white/15 hover:bg-white/20 text-white border border-white/20"
                    onClick={() => setEditOpen(true)}
                    data-testid="button-edit-community"
                  >
                    Edit
                  </Button>
                )}
                {isMember && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="bg-white/15 hover:bg-red-500/30 text-white/80 border border-white/20"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                  >
                    {leaveMutation.isPending ? "..." : "Leave"}
                  </Button>
                )}
              </div>
            )}
          </div>
          {community.description && !isChatActive && (
            <p className="text-white/80 text-sm mt-2">{community.description}</p>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit community</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Community name"
              maxLength={60}
            />
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description"
              className="min-h-[90px]"
              maxLength={240}
            />
            <Button
              type="button"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={updateCommunityMutation.isPending || !editName.trim()}
              onClick={() => updateCommunityMutation.mutate({ displayName: editName.trim(), description: editDesc.trim() })}
            >
              {updateCommunityMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className={`${isChatActive ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'max-w-3xl mx-auto px-4 py-4'}`}>
        <div className="flex gap-2 mb-2 shrink-0">
          <Button variant={activeSection === "feed" ? "default" : "outline"} size="sm"
            onClick={() => setActiveSection("feed")}
            className={activeSection === "feed" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <MessageSquare className="w-4 h-4 mr-1" /> Feed
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => community.chatroomId ? setLocation(`/chatroom/${community.chatroomId}`) : setActiveSection("chat")}>
            <MessageCircle className="w-4 h-4 mr-1" /> Chat
          </Button>
          <Button variant={activeSection === "members" ? "default" : "outline"} size="sm"
            onClick={() => setActiveSection("members")}
            className={activeSection === "members" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <Users className="w-4 h-4 mr-1" /> Members ({members.length})
          </Button>
        </div>

        {activeSection === "feed" && (
          <div className="space-y-4">

            {/* WIDGET 1 — Community Pulse */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-sm">Community Pulse</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center py-2 px-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-lg font-bold text-orange-500 leading-tight">{community.memberCount || members.length}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Members</div>
                  </div>
                  <div className="text-center py-2 px-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-lg font-bold text-blue-500 leading-tight">{memberStats.countries || 1}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Countries</div>
                  </div>
                  <div className="text-center py-2 px-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-lg font-bold text-emerald-500 leading-tight">{memberStats.cities || 1}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Cities</div>
                  </div>
                  <div className="text-center py-2 px-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-lg font-bold text-purple-500 leading-tight">{memberStats.nearbyCount}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {memberStats.userCity ? `Near you` : "Nearby"}
                    </div>
                  </div>
                </div>
                {memberStats.nearbyCount > 0 && memberStats.userCity && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {memberStats.nearbyCount} member{memberStats.nearbyCount !== 1 ? "s" : ""} near you in {memberStats.userCity}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* WIDGET 2 — Members Strip */}
            {members.length > 0 && (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-sm">Members</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-6 px-2" onClick={() => setActiveSection("members")}>
                      View all <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {members.slice(0, 8).map((member: any) => (
                      <div key={member.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setLocation(`/profile/${member.username || member.id}`)}>
                        <UserAvatar user={member} size="md" />
                        <span className="text-[11px] font-medium truncate max-w-[60px]">{member.name || member.username}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[60px]">{member.hometownCity || ""}</span>
                      </div>
                    ))}
                    {members.length > 8 && (
                      <div className="flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer" onClick={() => setActiveSection("members")}>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                          +{members.length - 8}
                        </div>
                        <span className="text-[11px] text-gray-400">more</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WIDGET — Welcome / Pinned Message */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="shrink-0">📌</span>
                <span>Welcome to <strong>{community.displayName || community.name}</strong>! Introduce yourself in the chat and connect with fellow members.</span>
              </p>
            </div>

            {/* WIDGET — Suggested Members to Connect */}
            {(() => {
              const suggestions = members
                .filter((m: any) => m.id !== currentUser?.id)
                .slice(0, 4);
              if (suggestions.length < 2) return null;
              return (
                <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="w-4 h-4 text-purple-500" />
                      <h3 className="font-bold text-sm">People to Connect With</h3>
                    </div>
                    <div className="space-y-2">
                      {suggestions.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2.5">
                          <div className="cursor-pointer" onClick={() => setLocation(`/profile/${m.id}`)}>
                            <UserAvatar user={{ profileImage: m.profileImage, username: m.username, avatarColor: m.avatarColor }} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:underline" onClick={() => setLocation(`/profile/${m.id}`)}>@{m.username}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{m.hometownCity || m.location || ''}</p>
                          </div>
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setLocation(`/messages?target=${m.id}`)}>
                            Say Hi
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* WIDGET — Recent Activity */}
            {members.length > 0 && (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-green-500" />
                    <h3 className="font-bold text-sm">Recent Activity</h3>
                  </div>
                  <div className="space-y-2">
                    {members.slice(0, 5).map((m: any, i: number) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                          <UserAvatar user={{ profileImage: m.profileImage, username: m.username, avatarColor: m.avatarColor }} size="xs" />
                        </div>
                        <span><strong className="text-gray-900 dark:text-white">@{m.username}</strong> joined the community</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WIDGET 3 — Chat Preview */}
            {community.chatroomId && (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm">Community Chat</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-6 px-2" onClick={() => community.chatroomId ? setLocation(`/chatroom/${community.chatroomId}`) : null}>
                      Open Chat <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No messages yet — start the conversation!</p>
                      <Button size="sm" variant="outline" className="mt-2 text-xs h-7" onClick={() => community.chatroomId ? setLocation(`/chatroom/${community.chatroomId}`) : null}>
                        Open Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg: any) => (
                        <div key={msg.id} className="flex items-start gap-2">
                          <UserAvatar user={{ profileImage: msg.senderProfileImage || msg.profileImage, username: msg.senderUsername || msg.username, avatarColor: msg.avatarColor }} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold">{msg.senderUsername || msg.username}</span>
                              <span className="text-[10px] text-gray-400">{timeAgo(msg.sentAt || msg.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* WIDGET 4 — Recent Posts */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-sm">Community Posts</h3>
                </div>

                {/* Post box */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Share something with the community..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    }}
                    className="resize-none"
                    style={{ minHeight: '60px', maxHeight: '160px', overflowY: 'auto' }}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && newPost.trim()) {
                        e.preventDefault();
                        createPostMutation.mutate(newPost.trim());
                        e.currentTarget.style.height = 'auto';
                      }
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => { if (newPost.trim()) createPostMutation.mutate(newPost.trim()); }}
                      disabled={!newPost.trim() || createPostMutation.isPending}>
                      <Send className="w-4 h-4 mr-1" /> {createPostMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>

                {/* Posts list */}
                {loadingPosts ? (
                  <SkeletonList count={3} />
                ) : posts.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">🌟 You're one of the first members!</p>
                    <p className="text-gray-400 text-xs mt-1">Set the tone — share why you joined {community.displayName || community.name} or what you're hoping to find here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post: any) => {
                      const likeInfo = likesData[post.id] || { count: 0, liked: false };
                      const replyCount = replyCounts[post.id] || 0;
                      const showReplies = expandedReplies.has(post.id);

                      return (
                        <div key={post.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="cursor-pointer" onClick={() => setLocation(`/profile/${post.userId}`)}>
                              <UserAvatar user={{ profileImage: post.profileImage, username: post.username, avatarColor: post.avatarColor }} size="md" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm cursor-pointer hover:underline" onClick={() => setLocation(`/profile/${post.userId}`)}>
                                    {post.username}
                                  </span>
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {timeAgo(post.createdAt)}
                                  </span>
                                </div>
                                {(post.userId === currentUser?.id) && (
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                                    onClick={() => deletePostMutation.mutate(post.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{post.content}</p>

                              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                  className={`flex items-center gap-1.5 text-xs transition-colors ${likeInfo.liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                                  onClick={() => likeMutation.mutate(post.id)}
                                >
                                  <Heart className={`w-4 h-4 ${likeInfo.liked ? "fill-red-500" : ""}`} />
                                  <span>{likeInfo.count > 0 ? likeInfo.count : ""}</span>
                                </button>

                                <button
                                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
                                  onClick={() => toggleReplies(post.id)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{replyCount > 0 ? replyCount : ""}</span>
                                  {replyCount > 0 && (
                                    showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {showReplies && (
                                <PostReplies postId={post.id} currentUser={currentUser} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {activeSection === "chat" && community.chatroomId && (
          isMember ? (
            <div className="flex-1 min-h-0 overflow-hidden max-w-[1100px] mx-auto w-full" style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
              <WhatsAppChat
                chatId={community.chatroomId}
                chatType="chatroom"
                title={community.displayName || community.name}
                subtitle={`${community.memberCount || members.length || 0} members`}
                currentUserId={currentUser?.id}
                embedded
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 font-medium text-center">Join this community to participate in the chat</p>
            </div>
          )
        )}

        {activeSection === "chat" && !community.chatroomId && (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Chat not available for this community</p>
          </div>
        )}

        {activeSection === "members" && (
          <div className="space-y-2">
            {loadingMembers ? (
              <div className="space-y-2 py-2">
                {[...Array(4)].map((_, i) => <SkeletonUserCard key={i} />)}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No members yet</p>
              </div>
            ) : (
              members.map((member: any) => (
                <Card key={member.id} className="border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => setLocation(`/profile/${member.id}`)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <UserAvatar user={member} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{member.username}</p>
                      <p className="text-xs text-gray-500">{member.hometownCity}{member.hometownCountry ? `, ${member.hometownCountry}` : ""}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {member.userType === "business" ? "Business" : member.userType === "traveling" ? "Traveler" : "Local"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
