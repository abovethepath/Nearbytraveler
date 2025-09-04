import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Camera, Upload, Trash2, Plus, X, Grid, Eye, Download, Share2,
  ImageIcon, CheckCircle, Heart, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { compressPhotoAdaptive } from '@/utils/photoCompression';
import { AdaptiveCompressionIndicator } from '@/components/adaptive-compression-indicator';

interface Photo {
  id: number;
  userId: number;
  imageUrl: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

interface PhotoUploadWidgetProps {
  userId: number;
  isOwnProfile?: boolean;
}

export function PhotoUploadWidget({ userId, isOwnProfile = false }: PhotoUploadWidgetProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    isPublic: true,
    files: [] as File[]
  });
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true
  });

  const queryClient = useQueryClient();

  // Fetch user's photos
  const { data: photos = [], isLoading: loadingPhotos } = useQuery<Photo[]>({
    queryKey: [`/api/users/${userId}/photos`],
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (photoData: any) => {
      const response = await apiRequest('POST', `/api/users/${userId}/photos`, photoData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', isPublic: true, files: [] });
      setPhotoPreview([]);
      toast({
        title: "Photo uploaded!",
        description: "Your photo has been saved to your gallery."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload photo",
        variant: "destructive"
      });
    }
  });

  // Edit photo mutation
  const editPhotoMutation = useMutation({
    mutationFn: async ({ photoId, updates }: { photoId: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/photos/${photoId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      setShowEditModal(false);
      setEditingPhoto(null);
      toast({
        title: "Photo updated!",
        description: "Your photo has been updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update photo",
        variant: "destructive"
      });
    }
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await apiRequest('DELETE', `/api/photos/${photoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      setShowPhotoModal(false);
      setSelectedPhoto(null);
      toast({
        title: "Photo deleted",
        description: "Your photo has been removed."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete photo",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPhotoPreview(prev => [...prev, ...newPreviewUrls]);
    setUploadForm(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
  };

  const removeUploadFile = (index: number) => {
    // Revoke the preview URL
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setUploadForm(prev => ({ 
      ...prev, 
      files: prev.files.filter((_, i) => i !== index) 
    }));
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one photo to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setIsCompressing(true);

    try {
      for (let i = 0; i < uploadForm.files.length; i++) {
        const file = uploadForm.files[i];
        setCompressionProgress((i / uploadForm.files.length) * 50);

        // Compress the photo
        const compressedFile = await compressPhotoAdaptive(file);
        
        // Convert to base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        setCompressionProgress((i / uploadForm.files.length) * 50 + 50);

        const photoData = {
          imageData: base64Data,
          title: uploadForm.title || `Photo ${i + 1}`,
          description: uploadForm.description,
          isPublic: uploadForm.isPublic
        };

        await uploadPhotoMutation.mutateAsync(photoData);
      }

      // Clean up preview URLs
      photoPreview.forEach(url => URL.revokeObjectURL(url));
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const openEditModal = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditForm({
      title: photo.title,
      description: photo.description || '',
      isPublic: photo.isPublic
    });
    setShowEditModal(true);
    setShowPhotoModal(false);
  };

  const handleEdit = () => {
    if (!editingPhoto) return;

    editPhotoMutation.mutate({
      photoId: editingPhoto.id,
      updates: editForm
    });
  };

  if (loadingPhotos) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Photo Gallery
        </h2>
        {isOwnProfile && (
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            data-testid="button-upload-photo"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        )}
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No photos yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isOwnProfile 
                ? "Upload your first photos to share with others"
                : "This user hasn't uploaded any photos yet"
              }
            </p>
            {isOwnProfile && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                data-testid="button-first-upload"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Photo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card 
              key={photo.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => openPhotoModal(photo)}
              data-testid={`card-photo-${photo.id}`}
            >
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                {!photo.isPublic && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Private
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {photo.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(photo.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="w-[95vw] max-w-2xl h-[95vh] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Upload photos to your gallery to share with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Photo Title
              </label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for your photos"
                data-testid="input-photo-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
                data-testid="textarea-photo-description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={uploadForm.isPublic}
                onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, isPublic: !!checked }))}
                data-testid="checkbox-photo-public"
              />
              <Label htmlFor="isPublic">Make photos public</Label>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="input-photo-files"
              />
            </div>

            {/* Photo Previews */}
            {photoPreview.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Photo Previews ({photoPreview.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeUploadFile(index)}
                        className="absolute top-1 right-1 w-6 h-6 p-0"
                        data-testid={`button-remove-preview-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compression Indicator */}
            {isCompressing && (
              <AdaptiveCompressionIndicator 
                progress={compressionProgress}
                isVisible={isCompressing}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || uploadForm.files.length === 0}
                className="bg-blue-500 hover:bg-blue-600"
                data-testid="button-confirm-upload"
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadForm.files.length} Photo${uploadForm.files.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo View Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[90vh]">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedPhoto.title}</DialogTitle>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(selectedPhoto)}
                        data-testid="button-edit-photo"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhotoMutation.mutate(selectedPhoto.id)}
                        data-testid="button-delete-photo"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>
              <div className="flex-1 flex flex-col items-center">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  className="max-w-full max-h-[60vh] object-contain"
                />
                {selectedPhoto.description && (
                  <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
                    {selectedPhoto.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Uploaded on {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Photo Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-edit-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsPublic"
                checked={editForm.isPublic}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isPublic: !!checked }))}
                data-testid="checkbox-edit-public"
              />
              <Label htmlFor="editIsPublic">Make photo public</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                data-testid="button-save-edit"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}