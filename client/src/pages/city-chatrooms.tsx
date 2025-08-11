import React, { useContext } from "react";
import { AuthContext } from "@/App";
import { MessageCircle, Users } from "lucide-react";

interface CityChatroomsPageProps {
  cityFilter?: string | undefined;
}

export default function CityChatroomsPage({ cityFilter }: CityChatroomsPageProps = {}) {
  const { user } = useContext(AuthContext);
  
  // Get user from multiple sources for reliability
  const getCurrentUser = () => {
    if (user) return user;
    
    // Try localStorage as fallback
    try {
      const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
    return null;
  };
  
  const currentUser = getCurrentUser();
  console.log('🏠 CHATROOMS: user from context:', user?.username, 'currentUser:', currentUser?.username);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              City Chatrooms
            </h1>
          </div>
          
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to City Chatrooms!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect with locals and travelers in your city. Chat about events, recommendations, and make new friends.
            </p>
            
            {currentUser ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hello {currentUser.name || currentUser.username}! City chatrooms are coming soon.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Coming Soon Features:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Join chatrooms for your current city</li>
                    <li>• Create topic-based discussions</li>
                    <li>• Meet locals and fellow travelers</li>
                    <li>• Share recommendations and tips</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Please log in to access city chatrooms.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}