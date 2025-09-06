import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, ImageIcon, Upload, X, Wifi, WifiOff, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressPhotoAdaptive, photoCompressor } from "@/utils/photoCompression";

interface CustomerUploadedPhotosProps {
  businessId: number;
  isOwnProfile: boolean;
}

interface CustomerPhoto {
  id: number;
  businessId: number;
  uploaderId: number;
  photoUrl: string;
  caption?: string;
  uploaderName: string;
  uploaderType: string;
  isApproved: boolean;
  uploadedAt: string;
}

export function CustomerUploadedPhotos({ businessId, isOwnProfile }: CustomerUploadedPhotosProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');

  // Fetch customer photos for this business
  const { data: customerPhotos = [], isLoading } = useQuery({
    queryKey: [`/api/businesses/${businessId}/customer-photos`],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/customer-photos`);
      if (!response.ok) throw new Error('Failed to fetch customer photos');
      const data = await response.json();
      console.log('CustomerUploadedPhotos - Fetched photos:', data);
      return data;
    }
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { photoUrl: string; caption: string }) => {
      return await apiRequest("POST", `/api/businesses/${businessId}/customer-photos`, {
        photoUrl: data.photoUrl,
        caption: data.caption,
        uploaderName: currentUser.name || currentUser.username,
        uploaderType: currentUser.userType === 'business' ? 'local' : currentUser.userType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/customer-photos`] });
      setShowUploadDialog(false);
      setUploadedPhoto(null);
      setCaption("");
      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to the business gallery.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle photo file upload with adaptive compression
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionProgress(0);
    
    try {
      // Show compression preview
      const preview = photoCompressor.getCompressionPreview(file);
      setCompressionInfo(`Optimizing for ${preview.networkType} connection (${preview.estimatedSizeReduction} size reduction)`);
      
      // Compress photo with progress tracking
      const compressedFile = await compressPhotoAdaptive(file, (progress) => {
        setCompressionProgress(progress.percentage);
        setCompressionInfo(progress.stage);
      });

      // Convert compressed file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setUploadedPhoto(base64String);
        setIsCompressing(false);
        setCompressionProgress(100);
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (error) {
      console.error('Photo compression failed:', error);
      setIsCompressing(false);
      
      // Fall back to original file
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setUploadedPhoto(base64String);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Compression failed",
        description: "Using original photo. Upload may be slower on slow connections.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitPhoto = () => {
    if (!uploadedPhoto) return;
    uploadPhotoMutation.mutate({
      photoUrl: uploadedPhoto,
      caption: caption.trim()
    });
  };

  // Delete photo mutation (only for business owners)
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return await apiRequest("DELETE", `/api/businesses/${businessId}/customer-photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/customer-photos`] });
      toast({
        title: "Photo deleted",
        description: "Customer photo has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePhoto = (photoId: number) => {
    if (window.confirm("Are you sure you want to delete this photo? This cannot be undone.")) {
      console.log('Deleting photo ID:', photoId);
      deletePhotoMutation.mutate(photoId);
    }
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading photos...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Customer Uploaded Photos
          </CardTitle>
          {!isOwnProfile && currentUser?.id && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Your Experience</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Photo</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {uploadedPhoto ? (
                        <div className="relative">
                          <img 
                            src={uploadedPhoto} 
                            alt="Preview" 
                            className="max-w-full max-h-48 mx-auto rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedPhoto(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Click to upload a photo</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Compression Progress */}
                  {isCompressing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                          Adaptive Compression
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Wifi className="w-3 h-3 mr-1" />
                          Smart Optimization
                        </Badge>
                      </div>
                      <Progress value={compressionProgress} className="w-full" />
                      <p className="text-xs text-gray-600">{compressionInfo}</p>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caption (Optional)</label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Share your experience at this business..."
                      className="min-h-[80px]"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500">{caption.length}/200 characters</p>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmitPhoto}
                    disabled={!uploadedPhoto || uploadPhotoMutation.isPending || isCompressing}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                  >
                    {isCompressing ? "Compressing..." : uploadPhotoMutation.isPending ? "Uploading..." : "Share Photo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {customerPhotos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-2">No customer photos yet</p>
            <p className="text-sm">
              {isOwnProfile 
                ? "When customers visit and upload photos, they'll appear here."
                : "Be the first to share your experience!"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerPhotos.map((photo: CustomerPhoto) => (
              <div key={photo.id} className="space-y-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  <img 
                    src={photo.photoUrl} 
                    alt={photo.caption || "Customer photo"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Customer photo failed to load:', photo.id, photo);
                    }}
                  />
                  
                  {/* Edit/Delete buttons for business owner */}
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                        onClick={() => {
                          const newCaption = prompt("Edit photo caption:", photo.caption || "");
                          if (newCaption !== null) {
                            // Add edit functionality here
                            console.log('Edit photo', photo.id, 'new caption:', newCaption);
                          }
                        }}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0 bg-red-500/80 hover:bg-red-500"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Photo info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                        {getInitials(photo.uploaderName || 'Business Owner')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{photo.uploaderName || 'Business Owner'}</span>
                    <Badge variant="outline" className="text-xs">
                      {photo.uploaderType === 'local' ? 'Nearby Local' : photo.uploaderType === 'business' ? 'Business' : 'Nearby Traveler'}
                    </Badge>
                  </div>
                  
                  {photo.caption && (
                    <p className="text-sm text-gray-600">{photo.caption}</p>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Recently uploaded'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}