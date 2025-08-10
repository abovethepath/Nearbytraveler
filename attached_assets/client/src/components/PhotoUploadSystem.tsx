import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { authStorage } from '@/lib/auth';

interface PhotoUploadSystemProps {
  userId: number;
  currentProfilePhoto?: string | null;
  currentCoverPhoto?: string | null;
  userPhotos?: any[];
  onPhotoUpdated?: () => void;
}

export function PhotoUploadSystem({ 
  userId, 
  currentProfilePhoto, 
  currentCoverPhoto, 
  userPhotos = [],
  onPhotoUpdated 
}: PhotoUploadSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Update profile photo mutation
  const updateProfilePhoto = useMutation({
    mutationFn: async (imageData: string) => {
      console.log('🔄 Updating profile photo for user:', userId);
      return await apiRequest('PUT', `/api/users/${userId}/profile-photo`, {
        imageData
      });
    },
    onSuccess: async (response) => {
      console.log('✅ Profile photo updated:', response);
      
      // Extract user data from response (handle API response format)
      const updatedUser = (response as any)?.user || response;
      
      // Update localStorage immediately with fresh profile image
      const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
      const newUserData = { 
        ...currentUser, 
        ...updatedUser,
        profileImage: updatedUser.profileImage || (response as any)?.profileImage
      };
      localStorage.setItem('travelconnect_user', JSON.stringify(newUserData));
      
      // Update auth context
      authStorage.setUser(newUserData);
      
      // Trigger multiple refresh events for avatar synchronization
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: newUserData }));
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: newUserData }));
      window.dispatchEvent(new CustomEvent('avatarRefresh', { detail: newUserData }));
      window.dispatchEvent(new CustomEvent('refreshNavbar', { detail: newUserData }));
      window.dispatchEvent(new CustomEvent('forceNavbarRefresh', { detail: newUserData }));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Force immediate refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // Callback for parent component
      if (onPhotoUpdated) {
        setTimeout(onPhotoUpdated, 100);
      }
      
      toast({
        title: "Profile photo updated",
        description: "Your avatar has been updated successfully. Page will refresh shortly.",
      });
      
      setShowProfileSelector(false);
    },
    onError: (error) => {
      console.error('❌ Profile photo update failed:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  // Update cover photo mutation - USING SAME LOGIC AS WORKING CITY PHOTO UPLOAD
  const updateCoverPhoto = useMutation({
    mutationFn: async (imageData: string) => {
      console.log('🔄 Updating cover photo for user:', userId);
      
      // Get authenticated user automatically - SAME AS CITY PHOTO UPLOAD
      const getAuthenticatedUser = () => {
        try {
          const userStr = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return user;
          }
        } catch (error) {
          console.error('Error getting authenticated user:', error);
        }
        return null;
      };

      const authenticatedUser = getAuthenticatedUser();
      if (!authenticatedUser) {
        throw new Error('User authentication required');
      }

      console.log('COVER PHOTO UPLOAD DEBUG - Starting upload with data:', {
        userId,
        imageDataLength: imageData.length,
        userAuthenticated: !!authenticatedUser
      });

      // Use apiRequest utility for proper authentication - SAME AS CITY PHOTO UPLOAD
      return await apiRequest('PUT', `/api/users/${userId}/cover-photo`, {
        imageData
      });
    },
    onSuccess: async (response) => {
      console.log('✅ Cover photo updated:', response);
      
      // Extract user data from response (handle API response format)
      const updatedUser = (response as any)?.user || response;
      
      // Update localStorage immediately with fresh cover photo
      const currentUser = JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
      const newUserData = { 
        ...currentUser, 
        ...updatedUser,
        coverPhoto: updatedUser.coverPhoto || (response as any)?.coverPhoto
      };
      localStorage.setItem('travelconnect_user', JSON.stringify(newUserData));
      
      // Update auth context
      authStorage.setUser(newUserData);
      
      // Trigger refresh events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('coverPhotoUpdated', { detail: newUserData }));
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: newUserData }));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Force immediate refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // Callback for parent component
      if (onPhotoUpdated) {
        setTimeout(onPhotoUpdated, 100);
      }
      
      toast({
        title: "Cover photo updated",
        description: "Your cover photo has been updated successfully. Page will refresh shortly.",
      });
      
      setShowCoverSelector(false);
    },
    onError: (error) => {
      console.error('❌ Cover photo update failed:', error);
      toast({
        title: "Update failed",
        description: "Failed to update cover photo. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  // Handle file upload for profile photo
  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const base64Data = await fileToBase64(file);
      updateProfilePhoto.mutate(base64Data);
    } catch (error) {
      console.error('File conversion error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process the image file.",
        variant: "destructive",
      });
      setUploading(false);
    }

    // Clear input
    event.target.value = '';
  };

  // Handle file upload for cover photo - USING SAME LOGIC AS WORKING CITY PHOTO UPLOAD
  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Convert file to base64 - SAME AS CITY PHOTO UPLOAD
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log('COVER PHOTO FILE DEBUG - File converted:', {
        fileSize: file.size,
        fileName: file.name,
        imageDataLength: base64Data.length
      });

      updateCoverPhoto.mutate(base64Data);
    } catch (error) {
      console.error('File conversion error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process the image file.",
        variant: "destructive",
      });
      setUploading(false);
    }

    // Clear input
    event.target.value = '';
  };

  // Handle selecting photo from gallery as profile photo
  const handleGalleryProfilePhoto = async (photoUrl: string) => {
    try {
      setUploading(true);
      updateProfilePhoto.mutate(photoUrl);
    } catch (error) {
      console.error('Gallery selection error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile photo from gallery.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  // Handle selecting photo from gallery as cover photo
  const handleGalleryCoverPhoto = async (photoUrl: string) => {
    try {
      setUploading(true);
      updateCoverPhoto.mutate(photoUrl);
    } catch (error) {
      console.error('Gallery selection error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update cover photo from gallery.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Photos Display */}
      <div className="mb-4">
        <div className="flex gap-4">
          {currentProfilePhoto && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Profile Photo</p>
              <img 
                src={currentProfilePhoto} 
                alt="Current profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                key={`profile-${Date.now()}`}
              />
            </div>
          )}
          {currentCoverPhoto && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Cover Photo</p>
              <img 
                src={currentCoverPhoto} 
                alt="Current cover" 
                className="w-32 h-20 rounded-lg object-cover border-2 border-gray-200"
                key={`cover-${Date.now()}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Profile Photo</h4>
          <div className="flex gap-2">
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="profile-photo-upload"
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload New'}
              </Button>
            </label>

            {userPhotos && userPhotos.length > 0 && (
              <Dialog open={showProfileSelector} onOpenChange={setShowProfileSelector}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    From Gallery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose Profile Photo</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {userPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => handleGalleryProfilePhoto(photo.imageUrl)}
                      >
                        <img
                          src={photo.imageUrl}
                          alt="Gallery photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Cover Photo Upload */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cover Photo</h4>
          <div className="flex gap-2">
            <input
              id="cover-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="cover-photo-upload"
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload New'}
              </Button>
            </label>

            {userPhotos && userPhotos.length > 0 && (
              <Dialog open={showCoverSelector} onOpenChange={setShowCoverSelector}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    From Gallery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose Cover Photo</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {userPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => handleGalleryCoverPhoto(photo.imageUrl)}
                      >
                        <img
                          src={photo.imageUrl}
                          alt="Gallery photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}