import React, { useState, useRef, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Camera, ArrowLeft, ArrowRight, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
// Card components removed - using plain div with gray styling
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
  likes: number;
  comments: number;
  isPublic: boolean;
  createdAt: string;
}

interface TravelMemoryTimelineProps {
  userId: number;
  isOwnProfile?: boolean;
}

export function TravelMemoryTimeline({ userId, isOwnProfile = false }: TravelMemoryTimelineProps) {
  const [selectedMemory, setSelectedMemory] = useState<TravelMemory | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  // Create memory form state
  const [newMemory, setNewMemory] = useState({
    destination: '',
    description: '',
    date: '',
    city: '',
    country: '',
    tags: [] as string[],
    photos: [] as string[],
    isPublic: true,
  });

  // Fetch travel memories
  const { data: memoriesData = [], isLoading } = useQuery<TravelMemory[]>({
    queryKey: [`/api/users/${userId}/travel-memories`],
    enabled: !!userId,
  });

  // Sort memories chronologically (newest first)
  const memories = memoriesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Debug effect for selectedMemory state changes
  useEffect(() => {
    console.log('selectedMemory state changed:', selectedMemory ? selectedMemory.destination : 'null');
  }, [selectedMemory]);



  // Create memory mutation
  const createMemory = useMutation({
    mutationFn: async (memoryData: any) => {
      return apiRequest('POST', '/api/travel-memories', memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/travel-memories`] });
      toast({
        title: "Travel memory created",
        description: "Your travel memory has been shared successfully.",
      });
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Failed to create memory",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  

  const resetForm = () => {
    setNewMemory({
      destination: '',
      description: '',
      date: '',
      city: '',
      country: '',
      tags: [],
      photos: [],
      isPublic: true,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploading(true);
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          setNewMemory(prev => ({
            ...prev,
            photos: [...prev.photos, base64Data]
          }));
          
          if (index === files.length - 1) {
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setNewMemory(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !newMemory.tags.includes(tag)) {
      setNewMemory(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewMemory(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleMemoryClick = (memory: TravelMemory) => {
    console.log('Memory clicked:', memory.destination, 'Photos:', memory.photos?.length || 0);
    console.log('Photo data:', memory.photos);
    setSelectedMemory(memory);
    setSelectedPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedMemory && selectedPhotoIndex < selectedMemory.photos.length - 1) {
      setSelectedPhotoIndex(prev => prev + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-300 bg-white rounded-lg shadow-sm p-6 animate-pulse dark:border-gray-600 dark:bg-gray-800">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 travel-memories">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Travel Memories</h2>
          <p className="text-gray-600 dark:text-gray-300">Share your amazing travel experiences</p>
        </div>
        <div className="flex gap-2">
          {/* Debug Test Button */}
          <Button
            onClick={() => {
              console.log('Test button clicked, opening dialog for:', 'Beach Party');
              const testMemory = {
                id: 999,
                destination: 'Beach Party',
                description: 'Test memory with photos',
                photos: [
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJlYWNoIFBob3RvIDE8L3RleHQ+PC9zdmc+',
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJlYWNoIFBob3RvIDI8L3RleHQ+PC9zdmc+'
                ],
                likes: 5,
                comments: 2,
                date: new Date().toISOString(),
                tags: ['beach', 'party'],
                userId: 1,
                city: 'Los Angeles',
                country: 'USA',
                isPublic: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setSelectedMemory(testMemory);
              setSelectedPhotoIndex(0);
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Test Photo Dialog
          </Button>
          {isOwnProfile && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Memory
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-orange-400"></div>
        
        <div className="space-y-8 travel-memories" data-component="travel-memories">
          {memories.map((memory, index) => (
            <div key={memory.id} className="relative flex items-start">
              {/* Timeline dot */}
              <div className="absolute left-6 top-8 w-4 h-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full border-4 border-white shadow-lg z-10"></div>
              
              {/* Memory card */}
              <div className="ml-16 w-full">
                <div className="border border-gray-300 bg-white rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg group dark:border-gray-600 dark:bg-gray-800">
                  <div className="p-0">
                    {/* Main Photo - clickable to open slideshow */}
                    <div className="relative overflow-hidden rounded-t-lg">
                      {memory.photos && memory.photos.length > 0 && (
                        <div 
                          className="relative h-64 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Photo area clicked, calling handleMemoryClick');
                            handleMemoryClick(memory);
                          }}
                        >
                          <img
                            src={memory.photos[0].startsWith('data:') ? memory.photos[0] : `${memory.photos[0]}`}
                            alt={`${memory.destination}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              console.error('Image failed to load:', memory.photos[0]);
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <div class="text-center text-gray-500">
                                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <p>Image not available</p>
                                  </div>
                                </div>
                              `;
                            }}
                          />
                          {memory.photos.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              <span>{memory.photos.length} photos</span>
                            </div>
                          )}
                          {/* Click to view overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 px-4 py-2 rounded-full text-black font-medium">
                              Click to view all photos
                            </div>
                          </div>
                        </div>
                      )}
                      {(!memory.photos || memory.photos.length === 0) && (
                        <div className="relative h-64 bg-gray-100 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No photos available</p>
                          </div>
                        </div>
                      )}
                      

                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{memory.destination}</span>
                        <span>•</span>
                        <span>{memory.city}, {memory.country}</span>
                        <span>•</span>
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(memory.date)}</span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        {memory.destination}
                      </h3>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {memory.description}
                      </p>



                      {/* View Photos button and photo count */}
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('View photos clicked, opening dialog for:', memory.destination);
                            handleMemoryClick(memory);
                          }}
                          className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          View Photos
                        </button>
                        
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-300">
                          <Camera className="w-4 h-4" />
                          <span>{memory.photos.length} photos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {memories.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-white mb-2">No travel memories yet</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-6">Start sharing your amazing travel experiences!</p>
            {isOwnProfile && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Memory
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Memory Detail Modal with Photo Slideshow */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ zIndex: 999999 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSelectedMemory(null)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 p-6 max-w-4xl w-full mx-4 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedMemory.destination}
              </h2>
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

            {/* Photo Gallery */}
            {selectedMemory.photos && selectedMemory.photos.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <img
                    src={selectedMemory.photos[selectedPhotoIndex]}
                    alt={`${selectedMemory.destination} photo ${selectedPhotoIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  
                  {/* Photo Gallery Close Button */}
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* Photo Navigation */}
                  {selectedMemory.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {/* Photo Counter */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {selectedPhotoIndex + 1} / {selectedMemory.photos.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedMemory.description}
              </p>
            </div>

            {/* Tags */}
            {selectedMemory.tags && selectedMemory.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {selectedMemory.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Navigation Info */}
            <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
                <Camera className="w-5 h-5" />
                <span>Photo {selectedMemory.photos.length > 0 ? '1' : '0'} of {selectedMemory.photos.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelMemoryTimeline;