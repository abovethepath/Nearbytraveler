import React from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedWrapperProps {
  children: React.ReactNode;
  className?: string;
  enableMobileNav?: boolean;
}

/**
 * Mobile-optimized wrapper component that provides:
 * - Proper mobile spacing and layout
 * - Touch-friendly interactions
 * - Bottom navigation spacing when needed
 * - Responsive container behavior
 */
export function MobileOptimizedWrapper({ 
  children, 
  className = "", 
  enableMobileNav = true 
}: MobileOptimizedWrapperProps) {
  return (
    <div className={cn(
      "min-h-screen w-full max-w-full overflow-x-hidden",
      "bg-gray-50 dark:bg-gray-900",
      // Mobile-specific layout
      "md:px-4 lg:px-6 xl:px-8",
      // Mobile navigation spacing
      enableMobileNav && "pb-20 md:pb-0",
      className
    )}>
      {/* Mobile-optimized content container */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="px-3 md:px-0">
          {children}
        </div>
      </div>
      
      {/* Mobile navigation spacer */}
      {enableMobileNav && (
        <div className="block md:hidden h-20 w-full" />
      )}
    </div>
  );
}

/**
 * Mobile-optimized card wrapper for consistent mobile layouts
 */
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function MobileCard({ 
  children, 
  className = "", 
  padding = 'md' 
}: MobileCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8'
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "rounded-lg md:rounded-xl",
      "shadow-sm md:shadow-md",
      "w-full max-w-full",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Mobile-optimized button that follows touch guidelines
 */
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MobileButton({ 
  children, 
  className = "", 
  variant = 'primary', 
  size = 'md',
  ...props 
}: MobileButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        "font-medium rounded-xl",
        "transition-all duration-200",
        "active:scale-95 touch-manipulation",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "w-full sm:w-auto", // Full width on mobile, auto on desktop
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Mobile-optimized input field with proper sizing for touch
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function MobileInput({ 
  label, 
  error,
  className = "", 
  ...props 
}: MobileInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3",
          "text-base", // Prevents zoom on iOS
          "border border-gray-300 dark:border-gray-600",
          "rounded-xl",
          "bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-gray-100",
          "placeholder-gray-500 dark:placeholder-gray-400",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "transition-colors duration-200",
          "min-h-[48px]", // Touch-friendly height
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Mobile-optimized grid that automatically adjusts for screen size
 */
interface MobileGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function MobileGrid({ 
  children, 
  cols = 2, 
  className = "" 
}: MobileGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      gridClasses[cols],
      className
    )}>
      {children}
    </div>
  );
}