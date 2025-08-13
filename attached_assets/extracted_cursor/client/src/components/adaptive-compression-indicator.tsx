import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Zap, Smartphone, Monitor } from 'lucide-react';

interface NetworkIndicatorProps {
  className?: string;
}

export function AdaptiveCompressionIndicator({ className = "" }: NetworkIndicatorProps) {
  // Get network information
  const getNetworkInfo = () => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        saveData: connection.saveData || false
      };
    }
    return { effectiveType: '4g', downlink: 10, saveData: false };
  };

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const network = getNetworkInfo();

  const getNetworkIcon = () => {
    if (network.saveData || network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      return <WifiOff className="w-3 h-3" />;
    }
    return <Wifi className="w-3 h-3" />;
  };

  const getCompressionLevel = () => {
    if (network.saveData || network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      return 'Ultra';
    } else if (network.effectiveType === '3g' || network.downlink < 1.5) {
      return 'High';
    }
    return 'Smart';
  };

  const getCompressionColor = () => {
    const level = getCompressionLevel();
    if (level === 'Ultra') return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    if (level === 'High') return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'; 
    return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className={`text-xs ${getCompressionColor()}`}>
        <Zap className="w-3 h-3 mr-1" />
        {getCompressionLevel()} Compression
      </Badge>
      
      <Badge variant="outline" className="text-xs">
        {getNetworkIcon()}
        <span className="ml-1">{network.effectiveType.toUpperCase()}</span>
      </Badge>
      
      {isMobile && (
        <Badge variant="outline" className="text-xs">
          <Smartphone className="w-3 h-3 mr-1" />
          Mobile
        </Badge>
      )}
      
      {network.saveData && (
        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
          Data Saver
        </Badge>
      )}
    </div>
  );
}

/**
 * Hook to get current compression settings preview
 */
export function useCompressionPreview() {
  const getNetworkInfo = () => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        saveData: connection.saveData || false
      };
    }
    return { effectiveType: '4g', downlink: 10, saveData: false };
  };

  const network = getNetworkInfo();
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let estimatedReduction = '40-60%';
  let quality = 'High Quality';
  
  if (network.saveData || network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    estimatedReduction = '70-85%';
    quality = 'Optimized for Speed';
  } else if (network.effectiveType === '3g') {
    estimatedReduction = '60-75%';
    quality = 'Balanced Quality';
  }

  return {
    networkType: network.effectiveType,
    isMobile,
    saveData: network.saveData,
    estimatedReduction,
    quality,
    compressionEnabled: true
  };
}