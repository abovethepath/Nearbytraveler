import { useState, useEffect } from "react";
import SmartPhotoGallery from "@/components/smart-photo-gallery";
import Navbar from "@/components/navbar";
import { X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { authStorage } from "@/lib/auth";
import type { User } from "@shared/schema";

export default function Photos() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use robust authentication check like profile page
    const currentUser = authStorage.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">Loading photos...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your photos.</p>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    // Try to go back in history, fallback to profile page
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(`/profile/${user.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-Optimized Header with Close Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Close photo gallery"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Photo Gallery</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Content */}
      <div className="container mx-auto px-4 py-8">
        <SmartPhotoGallery userId={user.id} />
      </div>
    </div>
  );
}