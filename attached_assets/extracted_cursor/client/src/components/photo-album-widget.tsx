import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Camera, Calendar, MapPin, Edit3, Trash2, Plus, X,
  ChevronLeft, ChevronRight, Download, Share2, Heart, Zap, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { compressPhotoAdaptive } from '@/utils/photoCompression';
import { AdaptiveCompressionIndicator } from '@/components/adaptive-compression-indicator';

interface PhotoAlbum {
  id: number;
  userId: number;
  title: string;
  description: string;
  date: string;
  location: string;
  photos: string[];
  coverPhoto?: string;
  isPublic: boolean;
  createdAt: string;
}

interface PhotoAlbumWidgetProps {
  userId: number;
  isOwnProfile?: boolean;
}

export function PhotoAlbumWidget({ userId, isOwnProfile = false }: PhotoAlbumWidgetProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);

  const queryClient = useQueryClient();

  // Album creation form state
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    photos: [] as File[],
    isPublic: true
  });
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>("");

  // Fetch photo albums
  const { data: albums = [], isLoading: loadingAlbums } = useQuery<PhotoAlbum[]>({
    queryKey: [`/api/users/${userId}/photo-albums`],
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: async (albumData: any) => {
      console.log('🎯 MUTATION: Creating photo album with data:', {
        userId: albumData.userId,
        title: albumData.title,
        photoIdsCount: albumData.photoIds?.length || 0,
        hasPhotoIds: albumData.photoIds && albumData.photoIds.length > 0
      });
      
      if (!albumData.photoIds || albumData.photoIds.length === 0) {
        throw new Error('No photo IDs provided for album creation');
      }
      
      const responseRaw = await apiRequest('POST', '/api/photo-albums', albumData);
      const result = await responseRaw.json();
      console.log('🎯 MUTATION: Album creation result:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ MUTATION: Album created successfully:', result);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
      setShowCreateModal(false);
      setNewAlbum({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        photos: [],
        isPublic: true
      });
      setPhotoPreview([]);
      toast({
        title: "Album created!",
        description: "Your photo album has been saved."
      });
    },
    onError: (error: any) => {
      console.error('❌ MUTATION: Failed to create album:', error);
      console.error('❌ MUTATION: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Failed to create album",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 20 photos per album
    const totalPhotos = newAlbum.photos.length + files.length;
    if (totalPhotos > 20) {
      toast({
        title: "Too many photos",
        description: "Maximum 20 photos allowed per album.",
        variant: "destructive"
      });
      return;
    }

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
    setNewAlbum(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
  };

  const removePhoto = (index: number) => {
    // Revoke the preview URL
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setNewAlbum(prev => ({ 
      ...prev, 
      photos: prev.photos.filter((_, i) => i !== index) 
    }));
  };

  const handleCreateAlbum = async () => {
    // Validate required fields
    if (!newAlbum.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter an album title.",
        variant: "destructive"
      });
      return;
    }

    if (newAlbum.photos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please add at least one photo to your album.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos and collect IDs (not full base64 data)
      let photoIds: number[] = [];
      console.log('📷 Uploading', newAlbum.photos.length, 'photos for album...');
      
      for (const photo of newAlbum.photos) {
        // Convert photo to base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photo);
        });

        try {
          console.log(`🚀 Starting photo upload ${newAlbum.photos.indexOf(photo) + 1}/${newAlbum.photos.length}`);
          
          const responseRaw = await apiRequest('POST', `/api/users/${userId}/photos`, {
            imageData: base64Data,
            title: `Album: ${newAlbum.title}`,
            isPublic: newAlbum.isPublic
          });
          const response = await responseRaw.json();
          console.log('🔍 Photo upload response:', response);
          console.log('🔍 Response keys:', Object.keys(response || {}));
          console.log('🔍 Response.photo:', response?.photo);
          
          // The API returns { message: "...", photo: { id, ... } }
          let photoId = null;
          if (response?.photo?.id) {
            photoId = response.photo.id;
          } else {
            console.error('❌ CRITICAL: Photo upload response missing photo.id structure:', response);
            console.error('❌ Expected: { message: "...", photo: { id: number, ... } }');
            throw new Error('Photo upload failed - invalid response format');
          }
          
          photoIds.push(photoId);
          console.log(`✅ Photo ${newAlbum.photos.indexOf(photo) + 1} uploaded with ID: ${photoId}`);
        } catch (error) {
          console.error('Photo upload failed:', error);
          toast({
            title: "Photo upload failed",
            description: `Failed to upload ${photo.name}. Continuing with other photos.`,
            variant: "destructive"
          });
        }
      }

      console.log('📸 Total photo IDs collected for album:', photoIds.length);
      console.log('📸 Photo IDs:', photoIds);

      if (photoIds.length === 0) {
        console.error('❌ No photo IDs collected for album creation');
        toast({
          title: "No photos uploaded",
          description: "Failed to upload any photos. Please try again.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      const albumData = {
        userId: userId,
        title: newAlbum.title.trim(),
        description: newAlbum.description.trim(),
        date: newAlbum.date,
        location: newAlbum.location.trim(),
        photoIds: photoIds, // Send photo IDs instead of full data
        isPublic: newAlbum.isPublic
      };

      console.log('📸 Creating photo album with data:', albumData);
      console.log('📸 PhotoIds being sent:', albumData.photoIds);
      createAlbumMutation.mutate(albumData);

      // Clean up preview URLs
      photoPreview.forEach(url => URL.revokeObjectURL(url));
      
    } catch (error) {
      console.error('❌ Error creating album:', error);
      toast({
        title: "Upload failed",
        description: "Failed to create photo album. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openAlbum = (album: PhotoAlbum) => {
    console.log('🔍 OPENING ALBUM:', { 
      albumId: album.id, 
      title: album.title, 
      photosCount: album.photos.length,
      currentModalState: showAlbumModal 
    });
    setSelectedAlbum(album);
    setCurrentPhotoIndex(0);
    setShowAlbumModal(true);
    console.log('🔍 ALBUM MODAL STATE SET TO TRUE');
  };

  const nextPhoto = () => {
    if (selectedAlbum) {
      setCurrentPhotoIndex((prev) => 
        prev < selectedAlbum.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    if (selectedAlbum) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : selectedAlbum.photos.length - 1
      );
    }
  };

  if (loadingAlbums) {
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
          <Camera className="w-5 h-5" />
          Photo Albums
        </h2>
        {isOwnProfile && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Album
          </Button>
        )}
      </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No photo albums yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isOwnProfile 
                ? "Create your first photo album to showcase your travel memories"
                : "This user hasn't created any photo albums yet"
              }
            </p>
            {isOwnProfile && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Album
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Card 
              key={album.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openAlbum(album)}
            >
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                {album.coverPhoto ? (
                  <img
                    src={album.coverPhoto}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {album.photos.length} photos
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {album.title}
                </h3>
                {album.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {album.location}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(album.date).toLocaleDateString()}
                </div>
                {album.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {album.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Photo Album</DialogTitle>
            <DialogDescription>
              Upload photos and create a new album to share your memories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Album Title *
            </label>
            <Input
              value={newAlbum.title}
              onChange={(e) => setNewAlbum(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Trip to Europe"
              className="border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              value={newAlbum.description}
              onChange={(e) => setNewAlbum(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell the story of this trip..."
              rows={3}
              className="border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Date
              </label>
              <Input
                type="date"
                value={newAlbum.date}
                onChange={(e) => setNewAlbum(prev => ({ ...prev, date: e.target.value }))}
                className="border-gray-300 dark:border-gray-600"
                min="1900-01-01"
                max="2099-12-31"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Location
              </label>
              <Input
                value={newAlbum.location}
                onChange={(e) => setNewAlbum(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Paris, France"
                className="border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Photos *
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="album-photo-upload"
                />
                <label
                  htmlFor="album-photo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Add Photos
                </label>
                <p className="text-xs text-gray-500">Max 20 photos, up to 10MB each</p>
              </div>

              {/* Photo Previews */}
              {photoPreview.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {photoPreview.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="albumIsPublic"
              checked={newAlbum.isPublic}
              onChange={(e) => setNewAlbum(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="albumIsPublic" className="text-sm text-gray-700 dark:text-gray-300">
              Make this album public (visible to other travelers)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlbum}
              disabled={createAlbumMutation.isPending || isUploading || !newAlbum.title || newAlbum.photos.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              {isUploading ? 'Uploading Photos...' : createAlbumMutation.isPending ? 'Creating...' : 'Create Album'}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug State */}
      {console.log('🐛 MODAL DEBUG:', {showAlbumModal, selectedAlbum: selectedAlbum?.title, userId})}
      
      {/* Album Viewer Modal - EMERGENCY FIX */}
      {showAlbumModal && selectedAlbum && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setShowAlbumModal(false);
              setSelectedAlbum(null);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* BIG CLOSE BUTTON */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  console.log('🚪 CLOSING MODAL');
                  setShowAlbumModal(false);
                  setSelectedAlbum(null);
                }}
                className="bg-red-500 text-white hover:bg-red-600 px-6 py-2 text-lg font-bold"
              >
                ✕ CLOSE
              </Button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedAlbum.title}</h2>
                <div className="flex gap-2">

                  {isOwnProfile && (
                    <>
                      {/* Privacy Toggle Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const newPrivacy = !selectedAlbum.isPublic;
                            const response = await apiRequest('PATCH', `/api/photo-albums/${selectedAlbum.id}`, { isPublic: newPrivacy });

                            // Update local state
                            const updatedAlbum = { ...selectedAlbum, isPublic: newPrivacy };
                            setSelectedAlbum(updatedAlbum);

                            // Refresh albums list
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });

                            toast({
                              title: newPrivacy ? "Album is now public" : "Album is now private",
                              description: newPrivacy ? "Other travelers can see this album" : "Only you can see this album",
                              variant: "default"
                            });
                          } catch (error) {
                            console.error('Error updating privacy:', error);
                            toast({
                              title: "Update failed",
                              description: "Failed to change album privacy",
                              variant: "destructive"
                            });
                          }
                        }}
                        className={selectedAlbum.isPublic ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-500 text-white hover:bg-gray-600"}
                      >
                        {selectedAlbum.isPublic ? "🌐 Public" : "🔒 Private"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            if (files.length > 0 && selectedAlbum) {
                              toast({
                                title: "Adding Photos",
                                description: `Adding ${files.length} photo(s) to ${selectedAlbum.title}...`,
                                variant: "default"
                              });

                              try {
                                // Convert files to base64
                                const photoPromises = Array.from(files).map(file => {
                                  return new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                  });
                                });

                                const base64Photos = await Promise.all(photoPromises);

                                // First upload photos to user's gallery to get photo IDs
                                const uploadedPhotoIds: number[] = [];
                                for (const base64Photo of base64Photos) {
                                  const uploadResponse = await apiRequest('POST', `/api/users/${userId}/photos`, {
                                    imageData: base64Photo,
                                    title: `Added to ${selectedAlbum.title}`,
                                    isPublic: !selectedAlbum.isPublic
                                  });
                                  const uploadResult = await uploadResponse.json();
                                  console.log('🎯 UPLOAD RESULT:', uploadResult);
                                  
                                  if (uploadResult.photo?.id) {
                                    uploadedPhotoIds.push(uploadResult.photo.id);
                                  }
                                }

                                // Then add the photo IDs to the album
                                if (uploadedPhotoIds.length > 0) {
                                  console.log('🎯 ADDING PHOTOS TO ALBUM:', selectedAlbum.id, 'Photo IDs:', uploadedPhotoIds);
                                  const albumResponse = await apiRequest('POST', `/api/photo-albums/${selectedAlbum.id}/photos`, {
                                    photoIds: uploadedPhotoIds
                                  });
                                  const albumResult = await albumResponse.json();
                                  console.log('🎯 ALBUM ADD RESULT:', albumResult);
                                }

                                toast({
                                  title: "Photos Added!",
                                  description: `Successfully added ${uploadedPhotoIds.length} photo(s) to ${selectedAlbum.title}`,
                                  variant: "default"
                                });

                                // Refresh albums data
                                queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
                                queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });

                              } catch (error) {
                                console.error('Error adding photos:', error);
                                toast({
                                  title: "Upload failed",
                                  description: "Failed to add photos to album. Please try again.",
                                  variant: "destructive"
                                });
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Photos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAlbum(selectedAlbum);
                          setShowEditModal(true);
                          setShowAlbumModal(false);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete "${selectedAlbum.title}"? This cannot be undone.`)) {
                            try {
                              await apiRequest('DELETE', `/api/photo-albums/${selectedAlbum.id}`);
                              
                              // Close modal and refresh albums list
                              setShowAlbumModal(false);
                              setSelectedAlbum(null);
                              queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
                              
                              toast({
                                title: "Album deleted",
                                description: `"${selectedAlbum.title}" has been deleted successfully.`,
                                variant: "default"
                              });
                            } catch (error) {
                              console.error('Error deleting album:', error);
                              toast({
                                title: "Delete failed",
                                description: "Failed to delete album. Please try again.",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAlbumModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Current Photo Display */}
              <div className="relative mb-4">
                <img
                  src={selectedAlbum.photos[currentPhotoIndex]}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-96 object-contain bg-gray-100 dark:bg-gray-700 rounded"
                />
                
                {/* Navigation Arrows */}
                {selectedAlbum.photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Delete Photo Button */}
                {isOwnProfile && selectedAlbum.photos.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (selectedAlbum && selectedAlbum.photos.length > 1) {
                        const updatedPhotos = selectedAlbum.photos.filter((_, index) => index !== currentPhotoIndex);
                        const updatedAlbum = {
                          ...selectedAlbum,
                          photos: updatedPhotos,
                          coverPhoto: updatedPhotos[0]
                        };
                        setSelectedAlbum(updatedAlbum);
                        if (currentPhotoIndex >= updatedPhotos.length) {
                          setCurrentPhotoIndex(0);
                        }
                        toast({
                          title: "Photo deleted",
                          description: "Photo has been removed from the album.",
                          variant: "default"
                        });
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Photo Thumbnails */}
              {selectedAlbum.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedAlbum.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0 ${
                        index === currentPhotoIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setCurrentPhotoIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedAlbum?.title || "Photo Album"}</span>
              {isOwnProfile && selectedAlbum && (
                <div className="flex gap-2">

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAlbum(selectedAlbum);
                      setShowEditModal(true);
                      setShowAlbumModal(false);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage photos in this album
            </DialogDescription>
          </DialogHeader>
        {selectedAlbum && (
          <div className="space-y-4">
            {/* Album Info */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                {selectedAlbum.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedAlbum.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedAlbum.date).toLocaleDateString()}
                </span>
                <span>{selectedAlbum.photos.length} photos</span>
              </div>
              {selectedAlbum.description && (
                <p className="text-gray-600 dark:text-gray-300">{selectedAlbum.description}</p>
              )}
            </div>

            {/* Photo Viewer */}
            <div className="relative">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={selectedAlbum.photos[currentPhotoIndex]}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Navigation buttons */}
              {selectedAlbum.photos.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {/* Photo counter and delete button */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentPhotoIndex + 1} / {selectedAlbum.photos.length}
              </div>
              
              {/* Delete photo button */}
              {isOwnProfile && selectedAlbum && selectedAlbum.photos.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedAlbum && selectedAlbum.photos.length > 1) {
                      const photoToDelete = selectedAlbum.photos[currentPhotoIndex];
                      const updatedPhotos = selectedAlbum.photos.filter((_, index) => index !== currentPhotoIndex);
                      
                      // Update the album with the photo removed
                      const updatedAlbum = {
                        ...selectedAlbum,
                        photos: updatedPhotos,
                        coverPhoto: updatedPhotos[0] // Set first photo as new cover
                      };
                      
                      setSelectedAlbum(updatedAlbum);
                      
                      // Adjust current photo index if needed
                      if (currentPhotoIndex >= updatedPhotos.length) {
                        setCurrentPhotoIndex(0);
                      }
                      
                      toast({
                        title: "Photo deleted",
                        description: "Photo has been removed from the album.",
                        variant: "default"
                      });
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Photo thumbnails */}
            {selectedAlbum.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedAlbum.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      index === currentPhotoIndex 
                        ? 'border-blue-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        </DialogContent>
      </Dialog>

      {/* Edit Album Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
            <DialogDescription>
              Update album details and settings
            </DialogDescription>
          </DialogHeader>
          {editingAlbum && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Album Title</label>
                <Input
                  value={editingAlbum.title}
                  onChange={(e) => setEditingAlbum({...editingAlbum, title: e.target.value})}
                  placeholder="Enter album title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={editingAlbum.description}
                  onChange={(e) => setEditingAlbum({...editingAlbum, description: e.target.value})}
                  placeholder="Add a description for your album"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={editingAlbum.location}
                  onChange={(e) => setEditingAlbum({...editingAlbum, location: e.target.value})}
                  placeholder="Where was this album taken?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={editingAlbum.date}
                  onChange={(e) => setEditingAlbum({...editingAlbum, date: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editAlbumIsPublic"
                  checked={editingAlbum.isPublic}
                  onChange={(e) => setEditingAlbum({...editingAlbum, isPublic: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="editAlbumIsPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Make this album public (visible to other travelers)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (editingAlbum) {
                      try {
                        console.log('💾 SAVING ALBUM:', editingAlbum);
                        
                        // Save changes to backend
                        const response = await apiRequest('PATCH', `/api/photo-albums/${editingAlbum.id}`, {
                          title: editingAlbum.title,
                          description: editingAlbum.description,
                          location: editingAlbum.location,
                          date: editingAlbum.date,
                          isPublic: editingAlbum.isPublic
                        });

                        console.log('💾 SAVE RESPONSE:', response);

                        // Update the selected album with saved data
                        setSelectedAlbum(editingAlbum);
                        setShowEditModal(false);
                        setShowAlbumModal(true);
                        
                        // Refresh albums list
                        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
                        
                        toast({
                          title: "Album updated",
                          description: "Album details have been saved successfully.",
                          variant: "default"
                        });
                      } catch (error) {
                        console.error('Error updating album:', error);
                        toast({
                          title: "Update failed",
                          description: "Failed to save album changes. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}