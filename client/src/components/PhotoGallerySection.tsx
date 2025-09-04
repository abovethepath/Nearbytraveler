import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { useLocation } from "wouter";

interface PhotoGallerySectionProps {
  photos: any[];
  isOwnProfile: boolean;
  uploadingPhoto: boolean;
  setSelectedPhotoIndex: (index: number) => void;
  handleDeletePhoto: (photoId: number) => void;
}

export const PhotoGallerySection: React.FC<PhotoGallerySectionProps> = ({
  photos,
  isOwnProfile,
  uploadingPhoto,
  setSelectedPhotoIndex,
  handleDeletePhoto
}) => {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photos ({photos.length})
        </CardTitle>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            size="sm" 
            className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500 flex-1 sm:flex-none text-xs sm:text-sm"
            onClick={() => setLocation('/photos')}
          >
            View Gallery
          </Button>
          {isOwnProfile && (
            <>
              <Button 
                size="sm" 
                onClick={() => setLocation('/upload-photos')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Upload Photos
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500 flex-1 sm:flex-none text-xs sm:text-sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading...' : 'Quick Add'}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.caption || 'Travel photo'}
                  className="w-full h-full object-cover"
                />
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 w-8 h-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-white">No photos yet</p>
            {isOwnProfile && (
              <p className="text-sm text-gray-600 dark:text-white">Share your travel memories!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};