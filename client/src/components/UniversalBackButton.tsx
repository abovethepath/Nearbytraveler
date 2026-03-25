import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface UniversalBackButtonProps {
  destination?: string;
  label?: string;
  className?: string;
}

export function UniversalBackButton({ 
  destination = "/", // NAV FIX: do not change this navigation target
  label = "Back",
  className = ""
}: UniversalBackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation(destination);
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-900 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}