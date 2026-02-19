import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Video, Upload, Trash2, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoIntroPlayerProps {
  userId: number;
  isOwnProfile: boolean;
  hasVideo: boolean;
}

export function VideoIntroPlayer({ userId, isOwnProfile, hasVideo }: VideoIntroPlayerProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const apiBase = getApiBaseUrl();

  const { data: videoData, isLoading: loadingVideo } = useQuery<{ url: string }>({
    queryKey: ['/api/users', userId, 'video-intro'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/users/${userId}/video-intro`);
      if (!res.ok) throw new Error("No video");
      return res.json();
    },
    enabled: hasVideo,
    staleTime: 60000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/users/${userId}/video-intro`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'video-intro'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile-bundle', userId] });
      setShowModal(false);
      toast({ title: "Video removed", description: "Your video intro has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete video.", variant: "destructive" });
    },
  });

  const handleUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video must be under 50MB.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({ title: "Invalid file", description: "Please select a video file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const urlRes = await apiRequest('POST', `/api/users/${userId}/video-intro/upload-url`);
      const { signedUrl, objectPath } = await urlRes.json();
      setUploadProgress(30);

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(30 + Math.round((e.loaded / e.total) * 50));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setUploadProgress(85);

      await apiRequest('PUT', `/api/users/${userId}/video-intro`, { objectPath });
      setUploadProgress(100);

      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'video-intro'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile-bundle', userId] });

      toast({ title: "Video uploaded!", description: "Your video intro is now on your profile." });
    } catch (error) {
      console.error("Video upload error:", error);
      toast({ title: "Upload failed", description: "Could not upload video. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnded = () => setIsPlaying(false);
    vid.addEventListener('ended', onEnded);
    return () => vid.removeEventListener('ended', onEnded);
  }, [showModal, videoData]);

  if (!hasVideo && !isOwnProfile) return null;

  if (!hasVideo && isOwnProfile) {
    return (
      <div className="mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        {uploading ? (
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Uploading video...</p>
              <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-1.5 mt-1">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
          >
            <Video className="w-4 h-4" />
            Add a video intro
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-blue-600 hover:to-orange-600 transition-all shadow-md"
      >
        <Play className="w-4 h-4 fill-white" />
        Watch Video Intro
      </button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-black border-none">
          <div className="relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 z-20 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingVideo ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : videoData?.url ? (
              <div className="relative cursor-pointer" onClick={togglePlay}>
                <video
                  ref={videoRef}
                  src={videoData.url}
                  className="w-full max-h-[70vh] object-contain bg-black"
                  playsInline
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-white">
                <p>Video not available</p>
              </div>
            )}

            {isOwnProfile && videoData?.url && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600/90 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Remove
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setShowModal(false);
                      handleUpload(file);
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Replace
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
