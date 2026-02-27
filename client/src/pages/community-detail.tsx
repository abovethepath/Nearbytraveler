import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, MessageSquare, Send, Lock, Trash2, Clock, Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

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

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const mins = Math.floor((now - then) / 60000);
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
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      await apiRequest("DELETE", `/api/community-posts/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts", postId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["reply-counts"] });
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

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="text-xs h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && replyText.trim()) {
              e.preventDefault();
              createReplyMutation.mutate(replyText.trim());
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
  const [activeSection, setActiveSection] = useState<"feed" | "members">("feed");
  const [newPost, setNewPost] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const { data: community, isLoading } = useQuery<any>({
    queryKey: ["/api/community-tags", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/community-tags?includePrivate=true`);
      const tags = await res.json();
      return tags.find((t: any) => t.id === communityId) || null;
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-orange-600 to-pink-500 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/explore")} className="text-white/80 hover:text-white mb-2 -ml-2 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Explore
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{community.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {community.displayName}
                {community.isPrivate && <Lock className="w-5 h-5 text-white/70" />}
              </h1>
              <p className="text-white/70 text-sm">{community.memberCount || 0} members · {community.category}</p>
            </div>
          </div>
          {community.description && (
            <p className="text-white/80 text-sm mt-2">{community.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <Button variant={activeSection === "feed" ? "default" : "outline"} size="sm"
            onClick={() => setActiveSection("feed")}
            className={activeSection === "feed" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <MessageSquare className="w-4 h-4 mr-1" /> Feed
          </Button>
          <Button variant={activeSection === "members" ? "default" : "outline"} size="sm"
            onClick={() => setActiveSection("members")}
            className={activeSection === "members" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <Users className="w-4 h-4 mr-1" /> Members ({members.length})
          </Button>
        </div>

        {activeSection === "feed" && (
          <div className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <Textarea
                  placeholder="Share something with the community..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && newPost.trim()) {
                      e.preventDefault();
                      createPostMutation.mutate(newPost.trim());
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
              </CardContent>
            </Card>

            {loadingPosts ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No posts yet</p>
                <p className="text-gray-400 text-sm">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post: any) => {
                  const likeInfo = likesData[post.id] || { count: 0, liked: false };
                  const replyCount = replyCounts[post.id] || 0;
                  const showReplies = expandedReplies.has(post.id);

                  return (
                    <Card key={post.id} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
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

                            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === "members" && (
          <div className="space-y-2">
            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading members...</p>
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
                    <Badge variant="outline" className="text-xs">
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
