import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Camera, MapPin, Calendar, Edit3, Trash2, Plus, X,
  BookOpen, Sparkles, Share2, Download, Copy, Star,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CustomModal } from '@/components/ui/custom-modal';

interface TravelMemory {
  id: number;
  userId: number;
  destination: string;
  photos: string[];
  description: string;
  date: string;
  tags: string[];
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isPublic: boolean;
  createdAt: string;
}



interface TravelMemoryTimelineProps {
  userId: number;
  isOwnProfile?: boolean;
}

export function TravelMemoryTimeline({ userId, isOwnProfile = false }: TravelMemoryTimelineProps) {
  const [selectedMemory, setSelectedMemory] = useState<TravelMemory | null>(null);
  const [showMemoryDetail, setShowMemoryDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const queryClient = useQueryClient();

  // Memory creation form state
  const [newMemory, setNewMemory] = useState({
    destination: '',
    city: '',
    country: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    photos: [] as File[],
    tags: [] as string[],
    isPublic: true
  });
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch travel memories
  const { data: memories = [], isLoading: loadingMemories } = useQuery<TravelMemory[]>({
    queryKey: [`/api/users/${userId}/travel-memories`],
  });





  // Create memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData: any) => {
      console.log('Creating travel memory with data:', memoryData);
      return apiRequest('POST', '/api/travel-memories', memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/travel-memories`] });
      setShowCreateModal(false);
      setNewMemory({
        destination: '',
        city: '',
        country: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        photos: [],
        tags: [],
        isPublic: true
      });
      toast({
        title: "Memory created!",
        description: "Your travel memory has been saved."
      });
    },
    onError: (error) => {
      console.error('Error creating travel memory:', error);
      toast({
        title: "Error creating memory",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });



  const handleMemoryClick = (memory: TravelMemory) => {
    setSelectedMemory(memory);
    setCurrentPhotoIndex(0);
    setShowMemoryDetail(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos
    const totalPhotos = newMemory.photos.length + files.length;
    if (totalPhotos > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed per memory.",
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
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
    if (!newMemory.destination.trim() || !newMemory.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in destination and description.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Parse destination to extract city and country
      const destinationParts = newMemory.destination.split(',').map(part => part.trim());
      const city = destinationParts[0] || newMemory.destination;
      const country = destinationParts[1] || 'Unknown';

      // Upload photos if any
      let photoUrls: string[] = [];
      if (newMemory.photos.length > 0) {
        console.log('📷 Uploading', newMemory.photos.length, 'photos for travel memory...');
        
        for (const photo of newMemory.photos) {
          const formData = new FormData();
          formData.append('photo', photo);
          formData.append('userId', userId.toString());

          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData,
            headers: {
              'x-user-id': userId.toString()
            }
          });

          if (response.ok) {
            const result = await response.json();
            photoUrls.push(result.photoUrl || result.url);
            console.log('✅ Photo uploaded:', result.photoUrl || result.url);
          } else {
            console.error('❌ Photo upload failed:', await response.text());
            toast({
              title: "Photo upload failed",
              description: `Failed to upload ${photo.name}. Continuing with other photos.`,
              variant: "destructive"
            });
          }
        }
        console.log('📷 All photos uploaded:', photoUrls);
      }

      const memoryData = {
        userId: userId,
        destination: newMemory.destination.trim(),
        city: city,
        country: country,
        description: newMemory.description.trim(),
        date: newMemory.date,
        photos: photoUrls,
        tags: newMemory.tags || [],
        isPublic: newMemory.isPublic
      };

      console.log('🗺️ Creating travel memory with data:', memoryData);
      createMemoryMutation.mutate(memoryData);

      // Clean up preview URLs
      photoPreview.forEach(url => URL.revokeObjectURL(url));
      setPhotoPreview([]);
      
    } catch (error) {
      console.error('❌ Error creating memory:', error);
      toast({
        title: "Upload failed",
        description: "Failed to create travel memory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShareToSocial = (platform: string) => {
    if (!selectedMemory) return;

    const text = `Check out my travel memory from ${selectedMemory.destination}! ${selectedMemory.description}`;
    const url = encodeURIComponent(window.location.href);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard!",
          description: "Open Instagram and paste your memory.",
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="space-y-6 travel-memories">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="w-6 h-6 dark:text-white" />
            Travel Memories
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Share and explore your travel experiences</p>
        </div>
        {isOwnProfile && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        )}
      </div>



      {/* Memory Grid */}
      <Card>
        <CardHeader>
          <CardTitle>My Travel Memories</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMemories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-32 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((memory) => {
                const mainPhoto = Array.isArray(memory.photos) && memory.photos.length > 0 
                  ? memory.photos[0] 
                  : null;
                const photoCount = Array.isArray(memory.photos) ? memory.photos.length : 0;
                
                return (
                  <div 
                    key={memory.id}
                    className="border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
                    onClick={() => handleMemoryClick(memory)}
                  >
                    {mainPhoto && (
                      <img
                        src={mainPhoto}
                        alt={memory.destination}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">{memory.destination}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {memory.description || `${memory.city}, ${memory.country}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(memory.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <Camera className="w-3 h-3" />
                      <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
          
          {!loadingMemories && memories.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-300">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50 dark:text-gray-500" />
              <p>No travel memories found. Create your first memory!</p>
              {isOwnProfile && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Memory
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory Detail Modal */}
      <CustomModal
        isOpen={showMemoryDetail}
        onClose={() => {
          setShowMemoryDetail(false);
          setSelectedMemory(null);
        }}
        title="Travel Memory Details"
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {selectedMemory && (
          <div className="space-y-6">
            {/* Memory Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedMemory.destination}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedMemory.city}, {selectedMemory.country}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedMemory.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareToSocial('twitter')}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareToSocial('facebook')}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Photo Gallery */}
            {selectedMemory.photos && selectedMemory.photos.length > 0 && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedMemory.photos[currentPhotoIndex]}
                    alt={selectedMemory.destination}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {selectedMemory.photos.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                        disabled={currentPhotoIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={() => setCurrentPhotoIndex(Math.min(selectedMemory.photos.length - 1, currentPhotoIndex + 1))}
                        disabled={currentPhotoIndex === selectedMemory.photos.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                {selectedMemory.photos.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {selectedMemory.photos.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPhotoIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        onClick={() => setCurrentPhotoIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{selectedMemory.description}</p>
              
              {/* Tags */}
              {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMemory.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}


            </div>


          </div>
        )}
      </CustomModal>

      {/* Create Memory Modal */}
      <CustomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Travel Memory"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Destination *</label>
              <Input
                value={newMemory.destination}
                onChange={(e) => setNewMemory(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Paris, France"
                className="border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Format: City, Country</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date *</label>
              <Input
                type="date"
                value={newMemory.date}
                onChange={(e) => setNewMemory(prev => ({ ...prev, date: e.target.value }))}
                className="border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description *</label>
            <Textarea
              value={newMemory.description}
              onChange={(e) => setNewMemory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your travel experience..."
              rows={4}
              className="border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tags (optional)</label>
            <Input
              value={newMemory.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                setNewMemory(prev => ({ ...prev, tags }));
              }}
              placeholder="adventure, food, culture"
              className="border-gray-300 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Photos (optional)</label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Add Photos
                </label>
                <p className="text-xs text-gray-500">Max 5 photos, up to 5MB each</p>
              </div>

              {/* Photo Previews */}
              {photoPreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photoPreview.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Revoke the preview URL
                          URL.revokeObjectURL(photoPreview[index]);
                          setPhotoPreview(prev => prev.filter((_, i) => i !== index));
                          setNewMemory(prev => ({ 
                            ...prev, 
                            photos: prev.photos.filter((_, i) => i !== index) 
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
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
              id="isPublic"
              checked={newMemory.isPublic}
              onChange={(e) => setNewMemory(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
              Make this memory public (visible to other travelers)
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
              disabled={createMemoryMutation.isPending || isUploading || !newMemory.destination || !newMemory.description}
              className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
            >
              {isUploading ? 'Uploading Photos...' : createMemoryMutation.isPending ? 'Creating...' : 'Create Memory'}
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}