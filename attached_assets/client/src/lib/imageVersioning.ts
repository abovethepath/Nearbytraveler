// Production-scale image versioning system for NearbyTraveler
// Handles cache-busting and version management for city cover photos

interface CityPhoto {
  id: number;
  city: string;
  state?: string;
  country: string;
  imageUrl: string;
  photographerUsername: string;
  version: number;
  uploadedAt: string;
}

interface ImageVersionCache {
  [cityKey: string]: {
    version: number;
    lastUpdated: number;
    imageUrl: string;
  };
}

class ImageVersioningSystem {
  private cache: ImageVersionCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly VERSION_STORAGE_KEY = 'cityPhotoVersions';

  constructor() {
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.VERSION_STORAGE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load image version cache:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save image version cache:', error);
    }
  }

  private getCityKey(city: string, state?: string, country?: string): string {
    return `${city}-${state || ''}-${country || ''}`.toLowerCase();
  }

  private generateVersionedUrl(imageUrl: string, version: number): string {
    if (!imageUrl) return '';
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${imageUrl}${separator}v=${version}&t=${timestamp}&cb=${Math.random().toString(36).substr(2, 9)}`;
  }

  public getVersionedImageUrl(city: string, state?: string, country?: string, baseImageUrl?: string): string {
    const cityKey = this.getCityKey(city, state, country);
    const cached = this.cache[cityKey];
    
    if (!baseImageUrl) return '';

    // Check if we have a cached version that's still valid
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return this.generateVersionedUrl(baseImageUrl, cached.version);
    }

    // Generate new version if cache is stale or missing
    const newVersion = cached ? cached.version + 1 : 1;
    this.updateCityPhotoVersion(city, state, country, baseImageUrl, newVersion);
    
    return this.generateVersionedUrl(baseImageUrl, newVersion);
  }

  public updateCityPhotoVersion(city: string, state?: string, country?: string, imageUrl?: string, version?: number): void {
    const cityKey = this.getCityKey(city, state, country);
    const newVersion = version || (this.cache[cityKey]?.version || 0) + 1;
    
    this.cache[cityKey] = {
      version: newVersion,
      lastUpdated: Date.now(),
      imageUrl: imageUrl || this.cache[cityKey]?.imageUrl || ''
    };
    
    this.saveCacheToStorage();
    
    // Trigger immediate cache invalidation for this city
    this.invalidateImageCaches(cityKey);
  }

  private invalidateImageCaches(cityKey: string): void {
    // Force refresh of all images for this city across the entire DOM
    const images = document.querySelectorAll('img, [style*="background-image"]');
    images.forEach((element) => {
      if (element instanceof HTMLImageElement) {
        const src = element.src;
        if (src && this.isImageForCity(src, cityKey)) {
          // Force reload by temporarily changing src
          const originalSrc = element.src;
          element.src = '';
          setTimeout(() => {
            element.src = originalSrc;
          }, 10);
        }
      } else if (element instanceof HTMLElement) {
        const style = element.style.backgroundImage;
        if (style && this.isImageForCity(style, cityKey)) {
          // Force refresh background images
          const originalStyle = element.style.backgroundImage;
          element.style.backgroundImage = '';
          setTimeout(() => {
            element.style.backgroundImage = originalStyle;
          }, 10);
        }
      }
    });
  }

  private isImageForCity(imageUrl: string, cityKey: string): boolean {
    // Simple check to see if this image might be for the specified city
    const city = cityKey.split('-')[0];
    return imageUrl.toLowerCase().includes(city.toLowerCase());
  }

  public forceRefreshAllCityImages(): void {
    // Clear all cached versions to force fresh fetches
    this.cache = {};
    this.saveCacheToStorage();
    
    // Trigger immediate refresh of all city images
    Object.keys(this.cache).forEach(cityKey => {
      this.invalidateImageCaches(cityKey);
    });
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('cityImagesRefresh', {
      detail: { timestamp: Date.now() }
    }));
  }

  public handlePhotoUpload(city: string, state?: string, country?: string, newImageUrl?: string): void {
    console.log('Image versioning: Handling photo upload for', city);
    
    // Update version immediately
    this.updateCityPhotoVersion(city, state, country, newImageUrl);
    
    // Trigger multiple refresh attempts with delays
    setTimeout(() => this.forceRefreshAllCityImages(), 100);
    setTimeout(() => this.forceRefreshAllCityImages(), 500);
    setTimeout(() => this.forceRefreshAllCityImages(), 1500);
    
    // Notify all components that images have been updated
    window.dispatchEvent(new CustomEvent('photoUploaded', {
      detail: { 
        city, 
        state, 
        country, 
        newImageUrl,
        timestamp: Date.now()
      }
    }));
  }

  public getCachedVersion(city: string, state?: string, country?: string): number {
    const cityKey = this.getCityKey(city, state, country);
    return this.cache[cityKey]?.version || 0;
  }

  public clearCacheForCity(city: string, state?: string, country?: string): void {
    const cityKey = this.getCityKey(city, state, country);
    delete this.cache[cityKey];
    this.saveCacheToStorage();
  }
}

// Global instance
export const imageVersioning = new ImageVersioningSystem();

// Helper function for components to use
export function getVersionedCityImage(city: string, state?: string, country?: string, baseImageUrl?: string): string {
  return imageVersioning.getVersionedImageUrl(city, state, country, baseImageUrl);
}

// Helper function for photo uploads
export function handleCityPhotoUpload(city: string, state?: string, country?: string, newImageUrl?: string): void {
  imageVersioning.handlePhotoUpload(city, state, country, newImageUrl);
}

// Helper function to force refresh
export function forceRefreshCityImages(): void {
  imageVersioning.forceRefreshAllCityImages();
}