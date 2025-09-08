import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface UniversalBackButtonProps {
  destination?: string;
  label?: string;
  className?: string;
}

export function UniversalBackButton({ 
  destination = "/discover", 
  label = "Back",
  className = ""
}: UniversalBackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Simple and reliable: always use browser's back() first
    // Modern browsers and SPAs handle this correctly
    try {
      window.history.back();
    } catch (error) {
      // Only fallback if back() completely fails (very rare)
      console.warn('Browser back failed, using fallback:', error);
      setLocation(destination);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}