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
import { MessageSquare, Clock, Send, ArrowLeft, Plus } from "lucide-react";

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

interface CityPostDetail extends CityPost {
  replies: {
    id: number;
    content: string;
    createdAt: string;
    authorId: number;
    username: string;
    name: string;
    profileImage: string | null;
  }[];
}

export function CityBulletinBoard({ cityName }: { cityName: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyText, setReplyText] = useState("");

  const { data: posts = [] } = useQuery<CityPost[]>({
    queryKey: ["/api/city-posts", cityName],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/city-posts?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const { data: postDetail } = useQuery<CityPostDetail>({
    queryKey: ["/api/city-posts", selectedPost],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/city-posts/${selectedPost}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedPost,
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

  const replyMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/city-posts/${selectedPost}/replies`, { content: replyText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts", selectedPost] });
      queryClient.invalidateQueries({ queryKey: ["/api/city-posts", cityName] });
      setReplyText("");
    },
  });

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
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post.id)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="cursor-pointer shrink-0" onClick={(e) => { e.stopPropagation(); setLocation(`/profile/${post.authorId}`); }}>
                    <SimpleAvatar user={{ id: post.authorId, username: post.username, profileImage: post.profileImage }} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{post.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                      <span>@{post.username}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {timeAgo(post.createdAt)}</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {post.replyCount}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
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

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => { if (!open) setSelectedPost(null); }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 max-h-[80vh] overflow-y-auto">
          {postDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-base pr-6">{postDetail.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 -mt-1">
                <SimpleAvatar user={{ id: postDetail.authorId, username: postDetail.username, profileImage: postDetail.profileImage }} size="xs" />
                <span>@{postDetail.username}</span>
                <span>{timeAgo(postDetail.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-2">{postDetail.content}</p>

              {/* Replies */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {postDetail.replies?.length || 0} {postDetail.replies?.length === 1 ? "Reply" : "Replies"}
                </p>
                <div className="space-y-2">
                  {(postDetail.replies || []).map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <SimpleAvatar user={{ id: reply.authorId, username: reply.username, profileImage: reply.profileImage }} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">@{reply.username}</span>
                          <span>{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {user?.id && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="text-sm flex-1"
                      maxLength={500}
                      onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) replyMutation.mutate(); }}
                    />
                    <Button
                      size="sm"
                      onClick={() => replyMutation.mutate()}
                      disabled={replyMutation.isPending || !replyText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500 mx-auto" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
