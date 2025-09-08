import { toast } from '@/hooks/use-toast';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  targetSizeKB?: number;
}

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export class AdaptivePhotoCompressor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Detect network conditions and device capabilities
   */
  private getNetworkInfo(): NetworkInfo {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      };
    }

    // Fallback for browsers without Network Information API
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  /**
   * Get adaptive compression settings based on network conditions
   */
  private getAdaptiveSettings(): CompressionOptions {
    const network = this.getNetworkInfo();
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Base settings for different network types
    let settings: CompressionOptions;

    if (network.saveData || network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      // Ultra-low bandwidth: heavily compress
      settings = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.4,
        format: 'webp',
        targetSizeKB: 50
      };
    } else if (network.effectiveType === '3g' || network.downlink < 1.5) {
      // Medium bandwidth: moderate compression
      settings = {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.6,
        format: 'webp',
        targetSizeKB: 150
      };
    } else {
      // High bandwidth: light compression
      settings = {
        maxWidth: 1920,
        maxHeight: 1440,
        quality: 0.8,
        format: 'webp',
        targetSizeKB: 400
      };
    }

    // Mobile device adjustments
    if (isMobile) {
      settings.maxWidth = Math.min(settings.maxWidth!, 1200);
      settings.maxHeight = Math.min(settings.maxHeight!, 900);
      settings.quality = Math.max(0.3, settings.quality! - 0.1);
    }

    return settings;
  }

  /**
   * Load image file and return as HTMLImageElement
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Convert canvas to blob with specified format and quality
   */
  private canvasToBlob(format: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        format,
        quality
      );
    });
  }

  /**
   * Compress image with iterative quality adjustment to meet target size
   */
  private async compressToTargetSize(
    img: HTMLImageElement,
    targetSizeKB: number,
    format: string,
    initialQuality: number
  ): Promise<Blob> {
    let quality = initialQuality;
    let blob: Blob;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      blob = await this.canvasToBlob(format, quality);
      const sizeKB = blob.size / 1024;
      
      if (sizeKB <= targetSizeKB || attempts >= maxAttempts) {
        break;
      }
      
      // Reduce quality for next attempt
      quality = Math.max(0.1, quality - 0.15);
      attempts++;
    } while (attempts < maxAttempts);

    return blob;
  }

  /**
   * Main compression method
   */
  async compressPhoto(file: File, customOptions?: Partial<CompressionOptions>): Promise<{
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    settings: CompressionOptions;
  }> {
    try {
      const settings = { ...this.getAdaptiveSettings(), ...customOptions };
      const img = await this.loadImage(file);
      
      // Calculate optimal dimensions
      const { width, height } = this.calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        settings.maxWidth!,
        settings.maxHeight!
      );

      // Set canvas dimensions
      this.canvas.width = width;
      this.canvas.height = height;

      // Draw image on canvas
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(img, 0, 0, width, height);

      // Clean up object URL
      URL.revokeObjectURL(img.src);

      // Determine output format
      const outputFormat = settings.format === 'webp' && this.supportsWebP() 
        ? 'image/webp' 
        : settings.format === 'png' 
          ? 'image/png' 
          : 'image/jpeg';

      // Compress to target size if specified
      let blob: Blob;
      if (settings.targetSizeKB) {
        blob = await this.compressToTargetSize(img, settings.targetSizeKB, outputFormat, settings.quality!);
      } else {
        blob = await this.canvasToBlob(outputFormat, settings.quality!);
      }

      // Create compressed file
      const compressedFile = new File([blob], file.name, {
        type: outputFormat,
        lastModified: Date.now()
      });

      const originalSize = file.size;
      const compressedSize = compressedFile.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        compressedFile,
        originalSize,
        compressedSize,
        compressionRatio,
        settings
      };

    } catch (error) {
      console.error('Photo compression failed:', error);
      throw new Error('Failed to compress photo');
    }
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get compression preview without actually compressing
   */
  getCompressionPreview(file: File): {
    networkType: string;
    estimatedSettings: CompressionOptions;
    estimatedSizeReduction: string;
  } {
    const network = this.getNetworkInfo();
    const settings = this.getAdaptiveSettings();
    
    let estimatedReduction = '50-70%';
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      estimatedReduction = '70-85%';
    } else if (network.effectiveType === '3g') {
      estimatedReduction = '60-75%';
    } else {
      estimatedReduction = '40-60%';
    }

    return {
      networkType: network.effectiveType,
      estimatedSettings: settings,
      estimatedSizeReduction: estimatedReduction
    };
  }
}

// Singleton instance
export const photoCompressor = new AdaptivePhotoCompressor();

/**
 * Utility function for easy compression
 */
export async function compressPhotoAdaptive(
  file: File, 
  onProgress?: (progress: { stage: string; percentage: number }) => void
): Promise<File> {
  if (onProgress) onProgress({ stage: 'Analyzing network conditions', percentage: 10 });
  
  const result = await photoCompressor.compressPhoto(file);
  
  if (onProgress) onProgress({ stage: 'Compression complete', percentage: 100 });
  
  // Show compression result to user
  const sizeReductionMB = (result.originalSize - result.compressedSize) / (1024 * 1024);
  const originalMB = (result.originalSize / (1024 * 1024)).toFixed(2);
  const compressedMB = (result.compressedSize / (1024 * 1024)).toFixed(2);
  
  toast({
    title: "Photo optimized for your connection",
    description: `Reduced from ${originalMB}MB to ${compressedMB}MB (${result.compressionRatio.toFixed(1)}% smaller)`,
  });

  return result.compressedFile;
}