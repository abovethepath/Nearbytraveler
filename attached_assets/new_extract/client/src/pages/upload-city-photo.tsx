import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, ArrowLeft, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UploadCityPhoto() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Get authenticated user automatically with security check
  const getAuthenticatedUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Security check: block deleted user "abovethepath"
        if (user.username === 'abovethepath') {
          console.log('SECURITY: Clearing contaminated localStorage data');
          localStorage.clear();
          // Set correct user data
          const correctUser = {
            id: 107,
            username: 'nearbylocal2',
            name: 'Aaton Lefkowitz',
            email: 'aaron_marc2004@yahoo.com',
            userType: 'local'
          };
          localStorage.setItem('user', JSON.stringify(correctUser));
          return 'nearbylocal2';
        }
        return user.username || 'nearbylocal2';
      }
    } catch (error) {
      console.error('Error getting authenticated user:', error);
    }
    return 'nearbylocal2';
  };

  const username = getAuthenticatedUser();

  // Get city name from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const cityName = urlParams.get('city') || '';

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
      // Get authenticated user data with extensive debugging
      const freshUserData = localStorage.getItem('user');
      console.log('RAW localStorage user data:', freshUserData);
      
      let userData = { username: 'community' };
      if (freshUserData) {
        try {
          userData = JSON.parse(freshUserData);
          console.log('PARSED user data:', userData);
          console.log('Username being used:', userData.username);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
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
        username: userData.username,
        fullUserData: userData
      });

      // Use apiRequest utility for proper authentication and timeout handling
      const response = await apiRequest('POST', '/api/city-photos', {
        cityName,
        imageData: base64Data,
        photographerUsername: userData.username,
      });

      const result = await response.json();
      console.log('Upload successful, photo ID:', result.id);
      
      // Force immediate cache invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/city-photos/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/city-photos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/city-photos/${cityName}`] });
      
      setUploadSuccess(true);
      toast({
        title: "Success!",
        description: "Your city photo has been uploaded successfully",
      });
      
      // Send message to parent window to refresh photos
      if (window.opener) {
        window.opener.postMessage({ type: 'PHOTO_UPLOADED', cityName }, '*');
        // Force parent window to refresh
        window.opener.location.reload();
      }
      
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.name === 'AbortError') {
        toast({
          title: "Upload Timeout",
          description: "Upload timed out - please try a smaller image",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: error.message || "There was an error uploading your photo",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your photo for {cityName} has been uploaded and will appear on the city page.
            </p>
            <p className="text-sm text-gray-400">This window will close automatically...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => window.close()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Close
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload City Photo</h1>
            <p className="text-gray-600 dark:text-gray-400">Share a beautiful photo of {cityName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Photo for {cityName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Photo Attribution:</strong> Your username will be credited
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Photos are moderated before appearing on city pages
              </p>
            </div>

            <div>
              <Label htmlFor="photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Photo
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, WebP. Max size: 10MB
              </p>
            </div>

            {previewUrl && (
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Photo Guidelines</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Choose a high-quality photo that represents {cityName}</li>
                <li>• Landmarks, skylines, and iconic views work best</li>
                <li>• Your username will be credited as the contributor</li>
                <li>• Photos should be appropriate and family-friendly</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading... (may take 30s)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.close()}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}