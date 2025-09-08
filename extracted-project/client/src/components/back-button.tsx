import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface BackButtonProps {
  fallbackRoute?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function BackButton({ 
  fallbackRoute = '/', 
  className = '', 
  variant = 'ghost',
  size = 'sm'
}: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Simple and reliable: always use browser's back() first
    try {
      window.history.back();
    } catch (error) {
      // Only fallback if back() completely fails (very rare)
      console.warn('Browser back failed, using fallback:', error);
      setLocation(fallbackRoute);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-white" />
      Back
    </Button>
  );
}