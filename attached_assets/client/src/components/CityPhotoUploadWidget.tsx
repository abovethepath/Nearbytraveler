import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CityPhotoUploadWidgetProps {
  cityName: string;
}

export function CityPhotoUploadWidget({ cityName }: CityPhotoUploadWidgetProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showWidget, setShowWidget] = useState(false);

  // Get authenticated user automatically
  const getAuthenticatedUser = () => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.username || 'community';
      }
    } catch (error) {
      console.error('Error getting authenticated user:', error);
    }
    return 'community';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !cityName || isUploading) {
      if (isUploading) return; // Prevent double-clicks
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const username = getAuthenticatedUser();
      
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      console.log('UPLOAD DEBUG - Starting upload with data:', {
        cityName,
        imageDataLength: base64Data.length,
        username
      });

      // Use apiRequest utility for proper authentication
      const response = await apiRequest('POST', '/api/city-photos', {
        cityName,
        imageData: base64Data,
        photographerUsername: username,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful, photo ID:', result.id);
      
      // Clear all photo caches and force refresh
      queryClient.invalidateQueries({ queryKey: ['/api/city-photos/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/city-photos'] });
      queryClient.removeQueries({ queryKey: ['/api/city-photos/all'] });
      queryClient.removeQueries({ queryKey: ['/api/city-photos'] });
      
      setUploadSuccess(true);
      toast({
        title: "Success!",
        description: `Your city photo has been uploaded successfully! You've earned 1 aura point.`,
      });
      
      // Force immediate cache invalidation for city images
      const timestamp = Date.now();
      const images = document.querySelectorAll('img[src*="/attached_assets/"]');
      images.forEach((img: any) => {
        const originalSrc = img.src;
        img.src = '';
        setTimeout(() => {
          img.src = `${originalSrc.split('?')[0]}?v=${timestamp}`;
        }, 100);
      });
      
      // Force page refresh to show new photo immediately
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!showWidget) {
    return (
      <div className="flex justify-between items-center px-2">
        <div className="flex flex-col">
          <Button
            onClick={() => setShowWidget(true)}
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            size="sm"
          >
            <Camera className="w-4 h-4 mr-2" />
            Upload City Photo
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Upload a photo and get 1 aura point + photo credit
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-600" />
            Upload City Photo
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWidget(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {uploadSuccess ? (
          <div className="text-center py-8">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">Upload Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your photo has been uploaded successfully and you've earned 1 aura point!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page will refresh automatically to show your photo...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose Photo for {cityName}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file size: 2MB. Formats: JPG, PNG, GIF
              </p>
            </div>

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Your photo will be credited to your username and you'll earn 1 aura point
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}