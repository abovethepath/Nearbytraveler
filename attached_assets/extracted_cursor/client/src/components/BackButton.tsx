import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
  style?: 'button' | 'link';
  variant?: 'default' | 'overlay' | 'minimal';
}

export function BackButton({ 
  fallbackPath = '/discover', 
  label = 'Back',
  className = '',
  style = 'button',
  variant = 'default'
}: BackButtonProps) {
  const [location, setLocation] = useLocation();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BackButton clicked - current location:', location);
    
    // Simple and reliable: always use browser's back() first
    try {
      window.history.back();
    } catch (error) {
      // Only fallback if back() completely fails (very rare)
      console.warn('Browser back failed, using fallback:', error);
      setLocation(fallbackPath);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'overlay':
        return 'bg-white/20 border-white/30 text-white hover:bg-white/30 dark:bg-black/20 dark:border-gray/30';
      case 'minimal':
        return 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200';
      default:
        return 'text-gray-600 bg-white border border-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700';
    }
  };

  const baseClasses = "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer";
  
  return (
    <button
      onClick={handleBack}
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      type="button"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}