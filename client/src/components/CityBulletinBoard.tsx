import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleAvatar } from "@/components/simple-avatar";
import { useAuth } from "@/App";
import { useLocation } from "wouter";
import { MessageSquare, Clock, Send, Plus, Heart } from "lucide-react";

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

interface CityPost {
  id: number;
  cityName: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: number;
  username: string;
  name: string;
  firstName?: string;
  profileImage: string | null;
  replyCount: number;
}

interface Reply {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  username: string;
  name: string;
  profileImage: string | null;
}

export function CityBulletinBoard({ cityName }: { cityName: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: posts = [] } = useQuery<CityPost[]>({
    queryKey: ["/api/city-posts", cityName],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/city-posts?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  // Batch likes for all visible posts
  const postIds = posts.map(p => p.id);
  const { data: likesData = {} } = useQuery<Record<number, { count: number; liked: boolean }>>({
    queryKey: ["/api/city-posts/likes", postIds.join(",")],
    queryFn: async () => {
      if (postIds.length === 0) return {};
      const res = await fetch(`${getApiBaseUrl()}/api/city-posts/likes?postIds=${postIds.join(",")}`, {
        credentials: "include",
        headers: user?.id ? { "x-user-id": String(user.id) } : {},
      });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: postIds.length > 0,
    staleTime: 15000,
  });

  // Replies for expanded post
  const { data: expandedReplies = [] } = useQuery<Reply[]>({
    queryKey: ["/api/city-posts", expandedPost, "replies"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/city-posts/${expandedPost}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.replies || [];
    },
    enabled: !!expandedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/city-posts", { cityName, title: newTitle, content: newContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts", cityName] });
      setShowNewPost(false);
      setNewTitle("");
      setNewContent("");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/city-posts/${postId}/like`);
      return { postId, ...(await res.json().catch(() => ({}))) };
    },
    onMutate: async (postId: number) => {
      // Optimistic update — toggle heart + count instantly
      const qk = ["/api/city-posts/likes", postIds.join(",")];
      await queryClient.cancelQueries({ queryKey: qk });
      const prev = queryClient.getQueryData<Record<number, { count: number; liked: boolean }>>(qk);
      queryClient.setQueryData(qk, (old: any) => {
        if (!old) return old;
        const cur = old[postId] || { count: 0, liked: false };
        return { ...old, [postId]: { count: cur.liked ? Math.max(0, cur.count - 1) : cur.count + 1, liked: !cur.liked } };
      });
      return { prev, qk };
    },
    onError: (_err: any, _postId: number, context: any) => {
      if (context?.prev) queryClient.setQueryData(context.qk, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts/likes"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) =>
      apiRequest("POST", `/api/city-posts/${postId}/replies`, { content }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts", vars.postId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts", cityName] });
      setReplyTexts(prev => ({ ...prev, [vars.postId]: "" }));
    },
  });

  const toggleExpand = (postId: number) => {
    setExpandedPost(prev => prev === postId ? null : postId);
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">City Bulletin Board</h3>
          </div>
          {user?.id && (
            <Button size="sm" onClick={() => setShowNewPost(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7 px-2">
              <Plus className="w-3 h-3 mr-1" /> New Post
            </Button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">No posts yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {posts.map((post) => {
              const likeInfo = likesData[post.id] || { count: 0, liked: false };
              const isExpanded = expandedPost === post.id;
              const replyText = replyTexts[post.id] || "";

              return (
                <div key={post.id} className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  {/* Post content */}
                  <div className="p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="cursor-pointer shrink-0" onClick={() => setLocation(`/profile/${post.authorId}`)}>
                        <SimpleAvatar user={{ id: post.authorId, username: post.username, profileImage: post.profileImage }} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-3 mt-0.5">{post.content}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                          <span>@{post.username}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action bar — like, reply count, respond */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => user?.id && likeMutation.mutate(post.id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors ${
                          likeInfo.liked ? "text-red-500 font-semibold" : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likeInfo.liked ? "fill-red-500" : ""}`} />
                        {likeInfo.count > 0 && likeInfo.count}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(post.id)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.replyCount > 0 ? `${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}` : "Reply"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded replies + reply input */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800">
                      {expandedReplies.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {expandedReplies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2 p-1.5 rounded bg-white dark:bg-gray-800">
                              <SimpleAvatar user={{ id: reply.authorId, username: reply.username, profileImage: reply.profileImage }} size="xs" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">@{reply.username}</span>
                                  <span>{timeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-[11px] text-gray-800 dark:text-gray-200 mt-0.5">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {user?.id && (
                        <div className="flex gap-1.5 mt-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="text-xs h-8 flex-1"
                            maxLength={500}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && replyText.trim()) {
                                replyMutation.mutate({ postId: post.id, content: replyText.trim() });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => replyText.trim() && replyMutation.mutate({ postId: post.id, content: replyText.trim() })}
                            disabled={replyMutation.isPending || !replyText.trim()}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base">New Post in {cityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-sm" maxLength={100} />
            <Textarea placeholder="What's on your mind?" value={newContent} onChange={(e) => setNewContent(e.target.value)} className="text-sm resize-none" rows={4} maxLength={1000} />
            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={createPostMutation.isPending || !newTitle.trim() || !newContent.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
