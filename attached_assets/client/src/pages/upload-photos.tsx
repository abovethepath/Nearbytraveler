import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, ImageIcon } from 'lucide-react';
import AnimatedPhotoUpload from '@/components/AnimatedPhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function UploadPhotos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
  const userId = currentUser?.id || 1;

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return await apiRequest('POST', `/api/users/${userId}/photos`, {
        userId: userId,
        imageData: base64Data,
        title: null,
        isPublic: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Photo uploaded successfully",
      });
      
      // Invalidate photos cache to refresh the gallery
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/photos`] });
      
      // Navigate back to profile page after successful upload
      setTimeout(() => {
        setLocation('/profile');
      }, 1000); // Small delay to show the success toast
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (file: File): Promise<void> => {
    console.log('handlePhotoUpload called with:', { fileName: file.name, fileSize: file.size });
    
    try {
      await uploadMutation.mutateAsync({ file });
      console.log('Upload successful for:', file.name);
    } catch (error) {
      console.error('Upload failed for:', file.name, error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/profile')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Upload Photos</h1>
              <p className="text-gray-300 mt-1">
                Share your travel memories with the community
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/photos')}
            className="hidden md:flex items-center space-x-2 text-blue-400 border-blue-600 hover:bg-blue-900/20 bg-gray-800"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="font-medium">Photo Gallery</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg border border-gray-700 bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span>Upload Your Photos</span>
                </CardTitle>
                <p className="text-sm text-gray-300">
                  Drag and drop your images or click to browse.
                </p>
              </CardHeader>
              <CardContent>
                <AnimatedPhotoUpload
                  onUpload={handlePhotoUpload}
                  multiple={true}
                  maxFiles={10}
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                  maxSizeBytes={10 * 1024 * 1024} // 10MB
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border border-gray-700 bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">Photo Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">
                      <strong className="text-white">High Quality:</strong> Upload photos at least 1200px wide for best results
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">
                      <strong className="text-white">Good Lighting:</strong> Natural light photos work best for sharing
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">
                      <strong className="text-white">High Resolution:</strong> Upload clear, high-quality images
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">
                      <strong className="text-white">Privacy:</strong> Mark photos as private if you don't want them public
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-700 bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">Supported Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">JPEG</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">PNG</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-gray-300">WebP</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-gray-300">GIF</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400">
                  Maximum file size: 10MB per photo
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-blue-600 bg-gradient-to-br from-blue-800 to-orange-800 text-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-3 opacity-90" />
                  <h3 className="font-semibold mb-2">Share Your Journey</h3>
                  <p className="text-sm opacity-90">
                    Every photo tells a story. Share yours with fellow travelers and inspire their next adventure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation('/profile')}
            className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            View My Photos
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/memories')}
            className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            Browse Memories
          </Button>
        </div>
      </div>
    </div>
  );
}