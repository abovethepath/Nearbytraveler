import React, { useState, useMemo, useContext, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, MapPin, Search, Sparkles, Plus, Star, TrendingUp, MessageCircle, Share2, ArrowUp, Mic, MicOff, Camera, X } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";

const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

// Comment thread component for nested comments
function CommentThread({ comment, postId, currentUser, onReply, likeCommentMutation }: any) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const formatDateForDisplay = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyBox(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.profileImage} />
          <AvatarFallback>{comment.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {comment.name || comment.username}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {comment.aura} Aura
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateForDisplay(comment.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeCommentMutation.mutate({ commentId: comment.id, isLiked: comment.isLikedByCurrentUser || false })}
              disabled={likeCommentMutation.isPending || !currentUser}
              className={`text-xs h-6 px-2 ${comment.isLikedByCurrentUser ? 'text-red-600' : 'text-red-500'}`}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.isLikedByCurrentUser ? 'fill-current' : ''}`} />
              {comment.likes || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-xs h-6 px-2"
            >
              Reply
            </Button>
          </div>

          {/* Reply input */}
          {showReplyBox && (
            <div className="mt-2 flex gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="text-xs">{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyContent("");
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="h-7 px-2 text-xs"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
              {comment.replies.map((reply: any) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUser={currentUser}
                  likeCommentMutation={likeCommentMutation}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TravelBlog() {
  // PAUSED FEATURE - Redirect to home
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  
  return null;
}

function TravelBlogPaused() {
  const [location, setLocation] = useLocation();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent, popular, aura
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceField, setVoiceField] = useState<'title' | 'content' | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user from localStorage as fallback
  const authStorageUser = localStorage.getItem('user');
  const fallbackUser = authStorageUser ? JSON.parse(authStorageUser) : null;
  const currentUser = user || fallbackUser;

  // Form for creating blog posts
  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      location: "",
      imageUrl: "",
      tags: [],
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && voiceField) {
          const currentValue = form.getValues(voiceField);
          const newValue = currentValue + finalTranscript;
          form.setValue(voiceField, newValue);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Unable to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceField, form, toast]);

  // Voice input functions
  const startVoiceInput = (field: 'title' | 'content') => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
      return;
    }

    setVoiceField(field);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setVoiceField(null);
  };

  // Image upload functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        form.setValue('imageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    form.setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Query for all travel blog posts
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/travel-blog/posts"],
    retry: false,
  });

  // Filter and sort posts based on search and sort criteria
  const filteredAndSortedPosts = useMemo(() => {
    if (!blogPosts || !Array.isArray(blogPosts)) return [];
    
    let filtered = blogPosts;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = blogPosts.filter((post: any) => 
        post.title?.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.location?.toLowerCase().includes(query) ||
        post.author?.username?.toLowerCase().includes(query)
      );
    }
    
    // Sort posts
    const sorted = [...filtered].sort((a: any, b: any) => {
      switch (sortBy) {
        case "popular":
          return (b.likes || 0) - (a.likes || 0);
        case "aura":
          return (b.aura || 0) - (a.aura || 0);
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return sorted;
  }, [blogPosts, searchQuery, sortBy]);

  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      return await apiRequest("POST", "/api/travel-blog/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your travel story has been shared! You earned 1 aura point.",
      });
      form.reset();
      setUploadedImage(null);
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/travel-blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "travel-blog"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      return await apiRequest(method, `/api/travel-blog/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-blog/posts"] });
    },
    onError: (error) => {
      toast({
        title: "Like failed",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: { postId: number; content: string; parentCommentId?: number }) => {
      return await apiRequest("POST", `/api/travel-blog/posts/${data.postId}/comments`, {
        content: data.content,
        parentCommentId: data.parentCommentId,
      });
    },
    onSuccess: () => {
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/travel-blog/posts/${expandedPost}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-blog/posts"] });
      toast({
        title: "Success!",
        description: "Comment added successfully! You earned 1 aura point.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: number; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      return await apiRequest(method, `/api/travel-blog/comments/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-blog/posts/${expandedPost}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      });
    },
  });

  // Query for comments of expanded post
  const { data: comments } = useQuery({
    queryKey: [`/api/travel-blog/posts/${expandedPost}/comments`],
    enabled: expandedPost !== null,
    retry: false,
  });

  // Helper function to format dates
  const formatDateForDisplay = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const onSubmit = (data: CreatePostForm) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to share your travel stories",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(data);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading travel stories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <UniversalBackButton />
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-black dark:text-white" />
                Travel Blog
              </h1>
              <p className="text-black dark:text-gray-300 text-sm">Share your travel experiences • Write about whatever you want</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Blog Post</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Enter your blog title..." {...field} />
                            <Button
                              type="button"
                              size="sm"
                              variant={isListening && voiceField === 'title' ? "destructive" : "outline"}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => {
                                if (isListening && voiceField === 'title') {
                                  stopVoiceInput();
                                } else {
                                  startVoiceInput('title');
                                }
                              }}
                            >
                              {isListening && voiceField === 'title' ? (
                                <MicOff className="h-3 w-3" />
                              ) : (
                                <Mic className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          Your Blog Post
                          <Button
                            type="button"
                            size="sm"
                            variant={isListening && voiceField === 'content' ? "destructive" : "outline"}
                            className="h-7 px-2"
                            onClick={() => {
                              if (isListening && voiceField === 'content') {
                                stopVoiceInput();
                              } else {
                                startVoiceInput('content');
                              }
                            }}
                          >
                            {isListening && voiceField === 'content' ? (
                              <>
                                <MicOff className="h-3 w-3 mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Mic className="h-3 w-3 mr-1" />
                                Voice
                              </>
                            )}
                          </Button>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your blog post... (Click Voice to speak)" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        {isListening && voiceField === 'content' && (
                          <div className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                            Listening... Speak clearly into your microphone
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          Location (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Paris, Rome, Tokyo... (or leave blank)"
                            {...field} 
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      Add Photo (Optional)
                    </label>
                    
                    {uploadedImage ? (
                      <div className="relative">
                        <img 
                          src={uploadedImage} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Click to upload a photo
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Image
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Max 5MB • JPG, PNG, GIF
                        </p>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPostMutation.isPending}>
                      {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Blog Stats */}
        <div className="mb-6 p-4 bg-black text-white rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm">Blog Posts:</span>
            <span className="text-lg font-bold">{filteredAndSortedPosts?.length || 0}</span>
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search stories, locations, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
            <Button
              variant={sortBy === "recent" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("recent")}
            >
              Recent
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("popular")}
            >
              Popular
            </Button>
            <Button
              variant={sortBy === "aura" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("aura")}
            >
              <Star className="w-3 h-3 mr-1" />
              Aura
            </Button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {filteredAndSortedPosts && filteredAndSortedPosts.length > 0 ? (
            filteredAndSortedPosts.map((post: any) => (
            <Card key={post.id} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.author?.profileImage} />
                      <AvatarFallback className="text-xs">{post.author?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">@{post.author?.username}</span>
                        <Badge variant="outline" className="px-1 py-0 text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                          <Star className="w-2.5 h-2.5 mr-0.5" />
                          {post.author?.aura || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDateForDisplay(post.createdAt)}
                        {post.location && (
                          <>
                            <span className="mx-1">•</span>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {post.location}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">{post.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{post.content}</p>
                
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likePostMutation.mutate({ postId: post.id, isLiked: post.isLikedByCurrentUser || false })}
                      disabled={likePostMutation.isPending || !currentUser}
                      className={`px-2 ${post.isLikedByCurrentUser ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes || 0}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-600 px-2"
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{(post as any).commentCount || 0}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-600 px-2">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {post.aura || 0} Aura
                  </Badge>
                </div>

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Add Comment Form */}
                    {currentUser && (
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={currentUser.profileImage} alt={currentUser.username} />
                            <AvatarFallback>{currentUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                onClick={() => commentMutation.mutate({ postId: post.id, content: newComment })}
                                disabled={!newComment.trim() || commentMutation.isPending}
                              >
                                {commentMutation.isPending ? "Posting..." : "Comment"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments List with nested structure */}
                    <div className="space-y-3">
                      {comments && comments.length > 0 ? (
                        <div className="space-y-4">
                          {comments.map((comment: any) => (
                            <CommentThread 
                              key={comment.id} 
                              comment={comment} 
                              postId={post.id}
                              currentUser={currentUser}
                              likeCommentMutation={likeCommentMutation}
                              onReply={(commentId, content) => {
                                commentMutation.mutate({ 
                                  postId: post.id, 
                                  content, 
                                  parentCommentId: commentId 
                                });
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )))
          : !isLoading ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No blog posts found" : "No blog posts yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Be the first to share a travel blog post and earn Aura Points!"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Blog Post
                </Button>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}