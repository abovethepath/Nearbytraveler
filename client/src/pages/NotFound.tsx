import React from "react";

export default function NotFound() {
  return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Page Not Found
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The page you're looking for doesn't exist.
        </p>
        
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-orange-700 dark:text-orange-300">
            ✅ Even error pages are mobile-safe now!
          </p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
