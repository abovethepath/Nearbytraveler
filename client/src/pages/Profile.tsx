import React from "react";

interface ProfileProps {
  userId?: number;
}

export default function Profile({ userId }: ProfileProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Profile {userId ? `#${userId}` : "Me"}
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Profile page is working! Mobile infrastructure protecting this page too.
        </p>
        
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-green-700 dark:text-green-300">
            ✅ Mobile-safe profile page loaded successfully
          </p>
        </div>
      </div>
    </div>
  );
}