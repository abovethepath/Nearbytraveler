import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Search, 
  Filter, 
  Tag, 
  MapPin, 
  Grid3X3, 
  List,
  Sparkles,
  Eye,
  Download,
  Trash2,
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Photo {
  id: number;
  userId: number;
  imageUrl: string;
  imageData?: string;
  caption: string;
  isPrivate: boolean;
  aiTags?: string[];
  aiCategory?: string;
  aiDescription?: string;
  aiLocation?: string;
  aiConfidence?: number;
  processingStatus?: string;
  createdAt: Date;
  likes?: number;
  isLiked?: boolean;
}

interface SmartPhotoGalleryProps {
  userId: number;
}

export default function SmartPhotoGallery({ userId }: SmartPhotoGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");
  const [currentPage, setCurrentPage] = useState(0);
  const [photosPerPage] = useState(12); // Show 12 photos at a time
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch photos with pagination - only load current page
  const { data: photos = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/users/${userId}/photos`, currentPage],
    queryFn: async () => {
      console.log(`📸 SmartPhotoGallery: Fetching page ${currentPage} for user ${userId}`);
      
      const limit = photosPerPage;
      const offset = currentPage * photosPerPage;
      
      const response = await fetch(`/api/users/${userId}/photos?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const batch = await response.json();
      
      console.log(`📸 SmartPhotoGallery: Fetched ${batch.length} photos (page ${currentPage}, offset: ${offset})`);
      return batch;
    },
  });

  // Get total photo count for pagination
  const { data: totalPhotos = 0 } = useQuery({
    queryKey: [`/api/users/${userId}/photos/count`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/photos?limit=1&offset=0`);
      if (!response.ok) return 0;
      
      // For now, estimate from available photos or fetch a larger batch to count
      const largeResponse = await fetch(`/api/users/${userId}/photos?limit=1000&offset=0`);
      if (!largeResponse.ok) return 0;
      const allPhotos = await largeResponse.json();
      return allPhotos.length;
    },
  });

  // Fetch organized photos
  const { data: organizedPhotos = {} } = useQuery({
    queryKey: [`/api/users/${userId}/photos/organized`],
  });

  // Fetch available tags
  const { data: availableTags = [] } = useQuery<string[]>({
    queryKey: [`/api/users/${userId}/photos/tags`],
  });

  // Re-analyze photo mutation
  const analyzePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/photos/${photoId}/analyze`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos/organized`] });
      toast({
        title: "Photo analyzed",
        description: "AI analysis completed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze photo with AI.",
        variant: "destructive",
      });
    }
  });

  // Like photo mutation
  const likePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/photos/${photoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Like failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      toast({
        title: "Photo liked!",
        description: "Your like has been recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Like failed",
        description: "Failed to like photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      console.log('📸 SmartPhotoGallery: Deleting photo', photoId);
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo');
      }
      return response.json();
    },
    onSuccess: (data, photoId) => {
      console.log('📸 SmartPhotoGallery: Photo deleted successfully', photoId);
      
      // Force immediate UI update by invalidating all photo-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`, currentPage] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      
      // Clear all cached photo data and refetch
      queryClient.removeQueries({ queryKey: [`/api/users/${userId}/photos`] });
      
      // Force an immediate refetch of the current page
      refetch();
      
      toast({
        title: "Photo deleted",
        description: "Your photo has been removed successfully.",
      });
    },
    onError: (error: any) => {
      console.error('📸 SmartPhotoGallery: Delete failed', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalPhotos / photosPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  // Filter and sort photos (applied to current page)
  const filteredPhotos = photos
    .filter((photo: Photo) => {
      // Search filter
      if (searchQuery && !photo.caption.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(photo.aiTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== "all" && photo.aiCategory !== selectedCategory) {
        return false;
      }
      
      // Tag filter
      if (selectedTag && !photo.aiTags?.includes(selectedTag)) {
        return false;
      }
      
      return true;
    })
    .sort((a: Photo, b: Photo) => {
      if (sortBy === "confidence") {
        return (b.aiConfidence || 0) - (a.aiConfidence || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory, selectedTag]);

  // Get unique categories
  const categories = ["all", ...new Set(photos.map((photo: Photo) => photo.aiCategory).filter(Boolean))];

  const CategoryBadge = ({ category }: { category: string }) => {
    const getCategoryColor = (cat: string) => {
      const colors: Record<string, string> = {
        nature: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        urban: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100", 
        food: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
        people: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        activity: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        architecture: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
        transport: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
        culture: "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100"
      };
      return colors[cat] || "bg-gray-100 text-gray-800";
    };

    return (
      <Badge className={`${getCategoryColor(category)} border-0`}>
        {category}
      </Badge>
    );
  };

  const PhotoCard = ({ photo }: { photo: Photo }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img 
          src={photo.imageData || photo.imageUrl} 
          alt={photo.caption}
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.error('Image load error for photo:', photo.id, 'src length:', (photo.imageData || photo.imageUrl || '').length);
            e.currentTarget.style.border = '2px solid red';
            e.currentTarget.style.backgroundColor = 'red';
          }}
          onLoad={() => console.log('Image loaded successfully for photo:', photo.id)}
        />
        {photo.aiConfidence && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/70 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              {Math.round(photo.aiConfidence * 100)}%
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{photo.caption}</h3>
        
        {photo.aiDescription && (
          <p className="text-sm text-gray-600 mb-2">{photo.aiDescription}</p>
        )}
        
        {photo.aiLocation && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            {photo.aiLocation}
          </div>
        )}
        
        {photo.aiCategory && (
          <div className="mb-2">
            <CategoryBadge category={photo.aiCategory} />
          </div>
        )}
        
        {photo.aiTags && photo.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {photo.aiTags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-blue-100"
                onClick={() => setSelectedTag(tag)}
              >
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {photo.aiTags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{photo.aiTags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => analyzePhotoMutation.mutate(photo.id)}
            disabled={analyzePhotoMutation.isPending}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Re-analyze
          </Button>
          
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => likePhotoMutation.mutate(photo.id)}
              disabled={likePhotoMutation.isPending}
              className={`flex items-center gap-1 ${photo.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart className={`w-3 h-3 ${photo.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{photo.likes || 0}</span>
            </Button>
            <Button size="sm" variant="ghost">
              <Eye className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                // TODO: Implement add to album functionality
                toast({
                  title: "Coming soon",
                  description: "Add to album feature will be available soon!",
                  variant: "default"
                });
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              <Camera className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
                  console.log('📸 SmartPhotoGallery: User confirmed deletion for photo', photo.id);
                  deletePhotoMutation.mutate(photo.id);
                }
              }}
              disabled={deletePhotoMutation.isPending}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {deletePhotoMutation.isPending ? (
                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PhotoList = ({ photo }: { photo: Photo }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img 
            src={photo.imageData || photo.imageUrl} 
            alt={photo.caption}
            className="w-20 h-20 object-cover rounded-lg"
            onError={(e) => {
              console.error('Image load error in list view for photo:', photo.id, 'src length:', (photo.imageData || photo.imageUrl || '').length);
              e.currentTarget.style.border = '2px solid red';
              e.currentTarget.style.backgroundColor = 'red';
            }}
          />
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{photo.caption}</h3>
              {photo.aiConfidence && (
                <Badge className="bg-black/70 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {Math.round(photo.aiConfidence * 100)}%
                </Badge>
              )}
            </div>
            
            {photo.aiDescription && (
              <p className="text-sm text-gray-600 mb-2">{photo.aiDescription}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {photo.aiLocation && (
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {photo.aiLocation}
                </div>
              )}
              
              {photo.aiCategory && <CategoryBadge category={photo.aiCategory} />}
            </div>
            
            {photo.aiTags && photo.aiTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {photo.aiTags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-blue-100"
                    onClick={() => setSelectedTag(tag)}
                  >
                    <Tag className="w-2 h-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search photos by caption or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white text-black"
        >
          {categories.map((category: string) => (
            <option key={category} value={category}>
              {category === "all" ? "All Categories" : category}
            </option>
          ))}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "confidence")}
          className="px-3 py-2 border rounded-md bg-white text-black"
        >
          <option value="date">Sort by Date</option>
          <option value="confidence">Sort by AI Confidence</option>
        </select>
      </div>

      {/* Active Filters */}
      {(selectedTag || selectedCategory !== "all") && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedCategory !== "all" && (
            <Badge className="cursor-pointer" onClick={() => setSelectedCategory("all")}>
              Category: {selectedCategory} ×
            </Badge>
          )}
          {selectedTag && (
            <Badge className="cursor-pointer" onClick={() => setSelectedTag("")}>
              Tag: {selectedTag} ×
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
            <div className="text-sm text-gray-600">Total Photos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{categories.length - 1}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{availableTags.length}</div>
            <div className="text-sm text-gray-600">AI Tags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{filteredPhotos.length}</div>
            <div className="text-sm text-gray-600">Filtered</div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Gallery */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No photos found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        }>
          {filteredPhotos.map((photo: Photo) => (
            <div key={photo.id}>
              {viewMode === "grid" ? <PhotoCard photo={photo} /> : <PhotoList photo={photo} />}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={!hasPrevPage}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <span className="text-xs text-gray-500">
              ({filteredPhotos.length} of {totalPhotos} photos)
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={!hasNextPage}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Popular Tags */}
      {availableTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 20).map((tagData: any, index: number) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => setSelectedTag(tagData.tag)}
                >
                  {tagData.tag} ({tagData.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}