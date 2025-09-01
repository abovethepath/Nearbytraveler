import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Camera, Calendar, MapPin, Edit3, Trash2, Plus, X,
  ChevronLeft, ChevronRight, Download, Share2, Heart, Zap, Wifi,
  Grid, CheckCircle, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { compressPhotoAdaptive } from '@/utils/photoCompression';
import { AdaptiveCompressionIndicator } from '@/components/adaptive-compression-indicator';

interface TravelMemory {
  id: number;
  userId: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  location: string;
  photos: string[];
  coverPhoto?: string;
  isPublic: boolean;
  createdAt: string;
}

interface TravelMemoryWidgetProps {
  userId: number;
  isOwnProfile?: boolean;
}

export function PhotoAlbumWidget({ userId, isOwnProfile = false }: TravelMemoryWidgetProps) {
  const [selectedMemory, setSelectedMemory] = useState<TravelMemory | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [showGalleryPickerModal, setShowGalleryPickerModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editingMemory, setEditingMemory] = useState<TravelMemory | null>(null);
  
  // Legacy aliases for backward compatibility to prevent errors
  const selectedAlbum = selectedMemory;
  const setSelectedAlbum = setSelectedMemory;
  const showAlbumModal = showMemoryModal;
  const setShowAlbumModal = setShowMemoryModal;
  const editingAlbum = editingMemory;
  const setEditingAlbum = setEditingMemory;
  const [selectedPhotosFromGallery, setSelectedPhotosFromGallery] = useState<number[]>([]);

  const queryClient = useQueryClient();

  // Travel memory creation form state
  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    startDate: '', // No default date - let user choose or fall back to photo upload date
    endDate: '', // Optional trip end date 
    location: '',
    photos: [] as File[],
    isPublic: true
  });
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>("");

  // Fetch user's existing photos for gallery picker
  const { data: userPhotos = [], isLoading: loadingUserPhotos } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/photos`],
    enabled: showGalleryPickerModal || showCreateModal,
  });

  // Add photos to existing travel memory mutation (both from files and existing gallery)
  const addPhotosToMemoryMutation = useMutation({
    mutationFn: async ({ albumId, photos, photoIds }: { albumId: number; photos?: File[]; photoIds?: number[] }) => {
      console.log('🎯 MUTATION: Adding photos to travel memory', albumId);
      
      if (photoIds && photoIds.length > 0) {
        // Adding existing photos from gallery
        console.log('🎯 MUTATION: Adding existing photos:', photoIds);
        const response = await apiRequest('POST', `/api/photo-albums/${albumId}/add-existing-photos`, {
          photoIds
        });
        return response.json();
      } else if (photos && photos.length > 0) {
        // Adding new photos from files
        console.log('🎯 MUTATION: Adding new photos:', photos.length, 'files');
        
        // First upload the photos to the gallery
        const photoIds: number[] = [];
        for (const photo of photos) {
          try {
            // Use adaptive compression before upload
            const compressedFile = await compressPhotoAdaptive(photo);
            
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(compressedFile);
            });

            const responseRaw = await apiRequest('POST', `/api/users/${userId}/photos`, {
              imageData: base64Data,
              title: `Album Photo`,
              isPublic: true
            });
            const response = await responseRaw.json();
            
            if (response?.photo?.id) {
              photoIds.push(response.photo.id);
            }
          } catch (error) {
            console.error('Failed to upload photo to gallery:', error);
            // Continue with other photos
          }
        }
        
        // Then add the uploaded photos to the album
        if (photoIds.length > 0) {
          const response = await apiRequest('POST', `/api/photo-albums/${albumId}/add-existing-photos`, {
            photoIds
          });
          return response.json();
        } else {
          throw new Error('No photos were successfully uploaded');
        }
      } else {
        throw new Error('No photos or photo IDs provided');
      }
    },
    onSuccess: () => {
      console.log('✅ MUTATION: Photos added to album successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
      setShowAddPhotosModal(false);
      setShowGalleryPickerModal(false);
      setSelectedPhotosFromGallery([]);
      toast({
        title: "Photos added!",
        description: "Photos have been added to the album."
      });
    },
    onError: (error: any) => {
      console.error('❌ MUTATION: Failed to add photos to album:', error);
      toast({
        title: "Failed to add photos",
        description: error?.message || "Could not add photos to album",
        variant: "destructive"
      });
    }
  });

  // Fetch travel memories
  const { data: memories = [], isLoading: loadingMemories } = useQuery<TravelMemory[]>({
    queryKey: [`/api/users/${userId}/photo-albums`],
  });

  // Create travel memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData: any) => {
      console.log('🎯 MUTATION: Creating travel memory with data:', {
        userId: memoryData.userId,
        title: memoryData.title,
        photoIdsCount: memoryData.photoIds?.length || 0,
        hasPhotoIds: memoryData.photoIds && memoryData.photoIds.length > 0
      });
      
      if (!memoryData.photoIds || memoryData.photoIds.length === 0) {
        throw new Error('No photo IDs provided for travel memory creation');
      }
      
      const responseRaw = await apiRequest('POST', '/api/photo-albums', memoryData);
      const result = await responseRaw.json();
      console.log('🎯 MUTATION: Travel memory creation result:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ MUTATION: Travel memory created successfully:', result);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photo-albums`] });
      setShowCreateModal(false);
      setNewMemory({
        title: '',
        description: '',
        startDate: '', // Reset to empty, let backend handle fallback logic
        endDate: '',
        location: '',
        photos: [],
        isPublic: true
      });
      setPhotoPreview([]);
      setSelectedPhotosFromGallery([]);
      toast({
        title: "Travel memory created!",
        description: "Your travel memory has been saved."
      });
    },
    onError: (error: any) => {
      console.error('❌ MUTATION: Failed to create travel memory:', error);
      console.error('❌ MUTATION: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Failed to create travel memory",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 20 photos per travel memory
    const totalPhotos = newMemory.photos.length + files.length;
    if (totalPhotos > 20) {
      toast({
        title: "Too many photos",
        description: "Maximum 20 photos allowed per travel memory.",
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
    setNewMemory(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
  };

  const removePhoto = (index: number) => {
    // Revoke the preview URL
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setNewMemory(prev => ({ 
      ...prev, 
      photos: prev.photos.filter((_, i) => i !== index) 
    }));
  };

  const handleCreateMemory = async () => {
    // Validate required fields
    if (!newMemory.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a memory title.",
        variant: "destructive"
      });
      return;
    }

    if (newMemory.photos.length === 0 && selectedPhotosFromGallery.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please add at least one photo to your memory or select from gallery.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Collect photo IDs from both new uploads and gallery selections
      let photoIds: number[] = [...selectedPhotosFromGallery];
      console.log('📷 Starting with', selectedPhotosFromGallery.length, 'photos from gallery');
      console.log('📷 Uploading', newMemory.photos.length, 'new photos for memory...');
      
      for (const photo of newMemory.photos) {
        // Convert photo to base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photo);
        });

        try {
          console.log(`🚀 Starting photo upload ${newMemory.photos.indexOf(photo) + 1}/${newMemory.photos.length}`);
          
          const responseRaw = await apiRequest('POST', `/api/users/${userId}/photos`, {
            imageData: base64Data,
            title: `Memory: ${newMemory.title}`,
            isPublic: newMemory.isPublic
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
          console.log(`✅ Photo ${newMemory.photos.indexOf(photo) + 1} uploaded with ID: ${photoId}`);
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
          title: "No photos selected",
          description: "Please select photos from gallery or upload new photos.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      const memoryData = {
        userId: userId,
        title: newMemory.title.trim(),
        description: newMemory.description.trim(),
        startDate: newMemory.startDate || null, // Send null if empty, let backend handle fallback
        endDate: newMemory.endDate || null,
        location: newMemory.location.trim(),
        photoIds: photoIds, // Send photo IDs instead of full data
        isPublic: newMemory.isPublic
      };

      console.log('📸 Creating travel memory with data:', memoryData);
      console.log('📸 PhotoIds being sent:', memoryData.photoIds);
      createMemoryMutation.mutate(memoryData);

      // Clean up preview URLs
      photoPreview.forEach(url => URL.revokeObjectURL(url));
      
    } catch (error) {
      console.error('❌ Error creating album:', error);
      toast({
        title: "Upload failed",
        description: "Failed to create travel memory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openMemory = (memory: TravelMemory) => {
    console.log('🔍 OPENING MEMORY:', { 
      memoryId: memory.id, 
      title: memory.title, 
      photosCount: memory.photos.length,
      currentModalState: showMemoryModal 
    });
    setSelectedMemory(memory);
    setCurrentPhotoIndex(0);
    setShowMemoryModal(true);
    console.log('🔍 MEMORY MODAL STATE SET TO TRUE');
  };

  const nextPhoto = () => {
    if (selectedMemory) {
      setCurrentPhotoIndex((prev) => 
        prev < selectedMemory.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    if (selectedMemory) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : selectedMemory.photos.length - 1
      );
    }
  };

  if (loadingMemories) {
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
          Travel Memories
        </h2>
        {isOwnProfile && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Memory
          </Button>
        )}
      </div>

      {/* Travel Memories Grid */}
      {memories.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No travel memories yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isOwnProfile 
                ? "Create your first travel memory to showcase your adventures"
                : "This user hasn't created any travel memories yet"
              }
            </p>
            {isOwnProfile && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Memory
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((memory) => (
            <Card 
              key={memory.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openMemory(memory)}
            >
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                {memory.coverPhoto ? (
                  <img
                    src={memory.coverPhoto}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {memory.photos.length} photos
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {memory.title}
                </h3>
                {memory.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {memory.location}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  {memory.startDate ? new Date(memory.startDate).toLocaleDateString() : 'No date'}
                  {memory.endDate && ` - ${new Date(memory.endDate).toLocaleDateString()}`}
                </div>
                {memory.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {memory.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Travel Memory Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Create Travel Memory</DialogTitle>
            <DialogDescription>
              Upload photos and create a new travel memory to share your adventures
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Memory Title *
            </label>
            <Input
              value={newMemory.title}
              onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Trip to Europe"
              className="border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              value={newMemory.description}
              onChange={(e) => setNewMemory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell the story of this trip..."
              rows={3}
              className="border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Trip Start Date (Optional - defaults to photo date)
              </label>
              <Input
                type="date"
                value={newMemory.startDate}
                onChange={(e) => setNewMemory(prev => ({ ...prev, startDate: e.target.value }))}
                className="border-gray-300 dark:border-gray-600"
                min="1900-01-01"
                max="2099-12-31"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Trip End Date (Optional)
              </label>
              <Input
                type="date"
                value={newMemory.endDate}
                onChange={(e) => setNewMemory(prev => ({ ...prev, endDate: e.target.value }))}
                className="border-gray-300 dark:border-gray-600"
                min="1900-01-01"
                max="2099-12-31"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Location
            </label>
            <Input
              value={newMemory.location}
              onChange={(e) => setNewMemory(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Paris, France"
              className="border-gray-300 dark:border-gray-600"
            />
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
                  Upload New
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGalleryPickerModal(true)}
                  className="flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  From Gallery
                </Button>
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

              {/* Selected Photos from Gallery */}
              {selectedPhotosFromGallery.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected from Gallery ({selectedPhotosFromGallery.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhotosFromGallery.map((photoId) => {
                      const photo = userPhotos.find(p => p.id === photoId);
                      return photo ? (
                        <div key={photoId} className="relative">
                          <img
                            src={photo.imageData || photo.imageUrl}
                            alt="Selected"
                            className="w-16 h-16 object-cover rounded-lg border-2 border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedPhotosFromGallery(prev => prev.filter(id => id !== photoId))}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="albumIsPublic"
              checked={newMemory.isPublic}
              onChange={(e) => setNewMemory(prev => ({ ...prev, isPublic: e.target.checked }))}
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
              onClick={handleCreateMemory}
              disabled={createMemoryMutation.isPending || isUploading || !newMemory.title || (newMemory.photos.length === 0 && selectedPhotosFromGallery.length === 0)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              {isUploading ? 'Uploading Photos...' : createMemoryMutation.isPending ? 'Creating...' : 'Create Memory'}
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

              {/* Enhanced Gallery View */}
              <div className="space-y-4">
                {/* Photo Counter */}
                <div className="text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Photo {currentPhotoIndex + 1} of {selectedAlbum.photos.length}
                  </span>
                </div>

                {/* Main Photo Display */}
                <div className="relative group">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={selectedAlbum.photos[currentPhotoIndex]}
                      alt={`Photo ${currentPhotoIndex + 1} from ${selectedAlbum.title}`}
                      className="w-full h-[500px] object-contain bg-black"
                    />
                    
                    {/* Photo Loading Overlay */}
                    <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
                    
                    {/* Navigation Arrows - Enhanced */}
                    {selectedAlbum.photos.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Button>
                      </>
                    )}

                    {/* Delete Photo Button - Enhanced */}
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
                        className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Keyboard Navigation Hint */}
                    {selectedAlbum.photos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                          Use ← → keys to navigate
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Photo Thumbnails Gallery */}
                {selectedAlbum.photos.length > 1 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gallery ({selectedAlbum.photos.length} photos)
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-3">
                      {selectedAlbum.photos.map((photo, index) => (
                        <div
                          key={index}
                          className={`relative flex-shrink-0 cursor-pointer group ${
                            index === currentPhotoIndex 
                              ? 'ring-3 ring-blue-500 ring-offset-2' 
                              : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                          }`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        >
                          <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg transition-all duration-200 group-hover:scale-105"
                          />
                          {index === currentPhotoIndex && (
                            <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  {selectedAlbum.startDate ? new Date(selectedAlbum.startDate).toLocaleDateString() : 'No date'}
                  {selectedAlbum.endDate && ` - ${new Date(selectedAlbum.endDate).toLocaleDateString()}`}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trip Start Date</label>
                  <Input
                    type="date"
                    value={editingAlbum.startDate || ''}
                    onChange={(e) => setEditingAlbum({...editingAlbum, startDate: e.target.value})}
                    min="1900-01-01"
                    max="2099-12-31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Trip End Date (Optional)</label>
                  <Input
                    type="date"
                    value={editingAlbum.endDate || ''}
                    onChange={(e) => setEditingAlbum({...editingAlbum, endDate: e.target.value})}
                    min="1900-01-01"
                    max="2099-12-31"
                  />
                </div>
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
                          startDate: editingAlbum.startDate || null,
                          endDate: editingAlbum.endDate || null,
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

      {/* Gallery Picker Modal - Select photos from existing gallery */}
      <Dialog open={showGalleryPickerModal} onOpenChange={setShowGalleryPickerModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Photos from Gallery</DialogTitle>
            <DialogDescription>
              Choose photos from your existing gallery to add to this album
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingUserPhotos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading your photos...</span>
              </div>
            ) : userPhotos.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No photos in your gallery yet</p>
                <p className="text-sm text-gray-400">Upload some photos to your gallery first</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedPhotosFromGallery.length} of {userPhotos.length} photos selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPhotosFromGallery([])}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPhotosFromGallery(userPhotos.map(p => p.id))}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                  {userPhotos.map((photo) => {
                    const isSelected = selectedPhotosFromGallery.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedPhotosFromGallery(prev => 
                            isSelected 
                              ? prev.filter(id => id !== photo.id)
                              : [...prev, photo.id]
                          );
                        }}
                      >
                        <img
                          src={photo.imageData || photo.imageUrl}
                          alt={photo.caption || 'Gallery photo'}
                          className="w-full h-24 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGalleryPickerModal(false);
                setSelectedPhotosFromGallery([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setShowGalleryPickerModal(false)}
              disabled={selectedPhotosFromGallery.length === 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add {selectedPhotosFromGallery.length} Photo{selectedPhotosFromGallery.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}