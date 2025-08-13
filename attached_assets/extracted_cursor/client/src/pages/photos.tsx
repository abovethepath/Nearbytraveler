import { useState, useEffect } from "react";
import SmartPhotoGallery from "@/components/smart-photo-gallery";
import Navbar from "@/components/navbar";
import { X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export default function Photos() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for stored user session (same pattern as App.tsx)
    const storedUser = localStorage.getItem('travelconnect_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading photos...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your photos.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Close Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Close photo gallery"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Photo Gallery</h1>
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