import React, { useState, useRef, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Camera, ArrowLeft, ArrowRight, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomModal, CustomModalContent } from '@/components/ui/custom-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AuthContext } from '@/App';

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
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [selectedMemory, setSelectedMemory] = useState<TravelMemory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [newMemory, setNewMemory] = useState({
    destination: '',
    description: '',
    date: '',
    city: '',
    country: '',
    photos: [] as string[],
    tags: [] as string[],
    isPublic: true
  });

  // Fetch travel memories
  const { data: memories = [], isLoading } = useQuery<TravelMemory[]>({
    queryKey: [`/api/users/${userId}/travel-memories`],
    enabled: !!userId
  });

  // Create memory mutation
  const createMemory = useMutation({
    mutationFn: async (memoryData: any) => {
      return await apiRequest(`/api/travel-memories`, 'POST', memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/travel-memories`] });
      setShowCreateModal(false);
      setNewMemory({
        destination: '',
        description: '',
        date: '',
        city: '',
        country: '',
        photos: [],
        tags: [],
        isPublic: true
      });
      toast({
        title: "Memory Created",
        description: "Your travel memory has been saved successfully."
      });
    }
  });



  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const uploadedPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise((resolve) => {
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          uploadedPhotos.push(base64String);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setNewMemory(prev => ({
      ...prev,
      photos: [...prev.photos, ...uploadedPhotos]
    }));
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setNewMemory(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleMemoryClick = (memory: TravelMemory) => {
    setSelectedMemory(memory);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedMemory && selectedMemory.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedMemory.photos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedMemory && selectedMemory.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedMemory.photos.length - 1 : prev - 1
      );
    }
  };

  const handleLike = (memoryId: number) => {
    likeMutation.mutate(memoryId);
  };

  const handleComment = (memoryId: number) => {
    if (commentText.trim()) {
      commentMutation.mutate({ memoryId, content: commentText });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading travel memories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Travel Memories
        </h2>
        {isOwnProfile && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Memory
          </Button>
        )}
      </div>

      {/* Memories Grid */}
      {memories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {isOwnProfile ? "Start documenting your travel adventures!" : "No travel memories shared yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <Card 
              key={memory.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              onClick={() => handleMemoryClick(memory)}
            >
              <CardContent className="p-0">
                {/* Photo */}
                {memory.photos.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={memory.photos[0]}
                      alt={memory.destination}
                      className="w-full h-full object-cover"
                    />
                    {memory.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        +{memory.photos.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {memory.destination}
                      </h3>
                      <div className="flex items-center text-gray-300 text-sm mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {memory.city}, {memory.country}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(memory.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 dark:text-gray-300 text-sm">
                    {memory.description}
                  </p>

                  {/* Tags */}
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {memory.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{memory.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}


                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Memory Detail Modal */}
      <CustomModal
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        title={selectedMemory?.destination || ''}
        className="max-w-md max-h-[60vh] overflow-y-auto"
      >
        {selectedMemory && (
          <CustomModalContent className="space-y-6">
            {/* Photo Gallery */}
            {selectedMemory.photos.length > 0 && (
              <div className="relative">
                <div className="relative h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={selectedMemory.photos[currentPhotoIndex]}
                    alt={selectedMemory.destination}
                    className="w-full h-full object-cover"
                  />
                  
                  {selectedMemory.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      
                      {/* Photo indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {selectedMemory.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Memory Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedMemory.destination}
                  </h2>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedMemory.city}, {selectedMemory.country}
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(selectedMemory.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedMemory.description}
              </p>

              {/* Tags */}
              {selectedMemory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMemory.tags.map((tag, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}


            </div>
          </CustomModalContent>
        )}
      </CustomModal>

      {/* Create Memory Modal */}
      <CustomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Travel Memory"
      >
        <CustomModalContent className="space-y-6">
          {/* Photo upload */}
          <div>
            <Label htmlFor="photos">Photos</Label>
            <div className="mt-2">
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                className="w-full"
                onClick={() => document.getElementById('photos')?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
            </div>
            
            {/* Photo preview */}
            {newMemory.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {newMemory.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Basic details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={newMemory.destination}
                onChange={(e) => setNewMemory(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="e.g., Eiffel Tower"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newMemory.date}
                onChange={(e) => setNewMemory(prev => ({ ...prev, date: e.target.value }))}
                className="[&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={newMemory.city}
                onChange={(e) => setNewMemory(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g., Paris"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={newMemory.country}
                onChange={(e) => setNewMemory(prev => ({ ...prev, country: e.target.value }))}
                placeholder="e.g., France"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newMemory.description}
              onChange={(e) => setNewMemory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Share your amazing experience..."
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createMemory.mutate({ ...newMemory, userId })}
              disabled={createMemory.isPending || !newMemory.destination || !newMemory.description}
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
            >
              {createMemory.isPending ? 'Creating...' : 'Create Memory'}
            </Button>
          </div>
        </CustomModalContent>
      </CustomModal>
    </div>
  );
}

export default TravelMemoryTimeline;