/**
 * Universal image cache-busting utility for city photos
 * This ensures that ALL city photos across the platform refresh properly
 * when new photos are uploaded, preventing browser caching issues.
 */

export function applyCacheBusting(imageUrl: string): string {
  if (!imageUrl) return imageUrl;
  
  // Only apply cache busting to uploaded assets and base64 images
  if (imageUrl.startsWith('/attached_assets/') || imageUrl.startsWith('data:image/')) {
    // For file paths, add AGGRESSIVE cache busting parameters
    if (imageUrl.startsWith('/attached_assets/')) {
      // Strip existing parameters first
      const cleanUrl = imageUrl.split('?')[0];
      // Add multiple cache busting parameters for maximum effectiveness
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const hash = Math.floor(Math.random() * 1000000);
      const sessionId = Math.random().toString(36).substring(2, 15);
      return `${cleanUrl}?v=${timestamp}&cb=${hash}&r=${random}&nocache=${Date.now()}&sid=${sessionId}`;
    }
    // Base64 images don't need cache busting as they contain the full data
    return imageUrl;
  }
  
  // Return unchanged for external URLs or other formats
  return imageUrl;
}

/**
 * Validate if a base64 image is valid and not corrupted
 */
function isValidBase64Image(base64String: string): boolean {
  if (!base64String || !base64String.startsWith('data:image/')) return false;
  
  // Check if it's a minimal/corrupted base64 (like the 1x1 pixel test image)
  const base64Data = base64String.split(',')[1];
  if (!base64Data || base64Data.length < 100) return false; // Lower threshold for real photos
  
  // Additional validation - check for valid base64 characters
  try {
    atob(base64Data);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get the first available city photo with cache busting applied
 */
export function getCityPhotoUrl(cityPhotos: any, cityName: string): string | null {
  if (!cityPhotos || typeof cityPhotos !== 'object') return null;
  
  // Extract just the city name from full location strings like "Los Angeles, California, United States"
  const cleanCityName = cityName.split(',')[0].trim();
  
  // Check exact city name match first
  if (cityPhotos[cityName] && cityPhotos[cityName].length > 0) {
    const photos = cityPhotos[cityName];
    for (const photo of photos) {
      const baseImageUrl = photo.imageData || photo.imageUrl || photo.image_url;
      if (baseImageUrl) {
        if (baseImageUrl.startsWith('/attached_assets/')) {
          return applyCacheBusting(baseImageUrl);
        }
        if (baseImageUrl.startsWith('data:image/')) {
          return baseImageUrl;
        }
      }
    }
  }
  
  // Check all city photo keys for partial matches (city name only)
  const photoKeys = Object.keys(cityPhotos);
  for (const key of photoKeys) {
    const keyCity = key.split(',')[0].trim();
    if (keyCity.toLowerCase() === cleanCityName.toLowerCase()) {
      const photos = cityPhotos[key];
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const baseImageUrl = photo.imageData || photo.imageUrl || photo.image_url;
          if (baseImageUrl) {
            if (baseImageUrl.startsWith('/attached_assets/')) {
              return applyCacheBusting(baseImageUrl);
            }
            if (baseImageUrl.startsWith('data:image/')) {
              return baseImageUrl;
            }
          }
        }
      }
    }
  }
  
  // Final fallback: check if cleanCityName matches any key
  if (cityPhotos[cleanCityName] && cityPhotos[cleanCityName].length > 0) {
    const photos = cityPhotos[cleanCityName];
    for (const photo of photos) {
      const baseImageUrl = photo.imageData || photo.imageUrl || photo.image_url;
      if (baseImageUrl) {
        if (baseImageUrl.startsWith('/attached_assets/')) {
          return applyCacheBusting(baseImageUrl);
        }
        if (baseImageUrl.startsWith('data:image/')) {
          return baseImageUrl;
        }
      }
    }
  }
  
  return null;
}

/**
 * Force refresh of all city images across the platform
 * Call this after photo uploads to invalidate caches
 */
export function refreshAllCityImages() {
  // NUCLEAR CACHE BUSTING: Force complete reload of ALL city images
  const allImages = document.querySelectorAll('img, [style*="background-image"]');
  const timestamp = Date.now();
  
  allImages.forEach((element: any) => {
    // Handle img elements
    if (element.tagName === 'IMG' && element.src && element.src.includes('/attached_assets/')) {
      const baseSrc = element.src.split('?')[0];
      const newSrc = applyCacheBusting(baseSrc);
      element.src = '';
      // Use multiple timeouts for aggressive refresh
      setTimeout(() => {
        element.src = newSrc;
      }, 10);
      setTimeout(() => {
        element.src = `${baseSrc}?refresh=${timestamp}`;
      }, 50);
    }
    
    // Handle background images in style attributes
    if (element.style && element.style.backgroundImage) {
      const bgImage = element.style.backgroundImage;
      if (bgImage.includes('/attached_assets/')) {
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) {
          const baseSrc = urlMatch[1].split('?')[0];
          const newSrc = applyCacheBusting(baseSrc);
          element.style.backgroundImage = '';
          setTimeout(() => {
            element.style.backgroundImage = bgImage.replace(urlMatch[1], newSrc);
          }, 10);
          setTimeout(() => {
            element.style.backgroundImage = `url("${baseSrc}?refresh=${timestamp}")`;
          }, 50);
        }
      }
    }
  });
  
  // Force browser to refresh by triggering a layout reflow
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = '';
  
  // Dispatch refresh event
  window.dispatchEvent(new CustomEvent('cityPhotosRefreshed', { detail: { timestamp } }));
}

export function refreshSpecificCityPhoto(cityName: string) {
  const timestamp = Date.now();
  const images = document.querySelectorAll(`img[src*="${cityName}"], img[src*="/attached_assets/"]`);
  
  images.forEach((img: any) => {
    if (img.src && img.src.includes('/attached_assets/')) {
      const baseSrc = img.src.split('?')[0];
      img.src = '';
      setTimeout(() => {
        img.src = `${baseSrc}?refresh=${timestamp}&city=${encodeURIComponent(cityName)}`;
      }, 50);
    }
  });
}

/**
 * ULTIMATE cache-busting function for individual city photos
 * Forces complete reload even with aggressive browser caching
 */
export function forceRefreshCityPhoto(city: string, state: string, country: string) {
  // Invalidate ALL possible cached versions
  const timestamps = [Date.now(), Date.now() + 1, Date.now() + 2];
  
  // Force refresh all matching elements
  const selectors = [
    `img[src*="${city}"]`,
    `[style*="background-image"][style*="${city}"]`,
    `.city-hero[data-city*="${city}"]`,
    `.city-cover[data-city*="${city}"]`
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element: any) => {
      if (element.tagName === 'IMG') {
        const baseSrc = element.src.split('?')[0];
        timestamps.forEach((timestamp, index) => {
          setTimeout(() => {
            element.src = `${baseSrc}?v=${timestamp}&refresh=${Math.random()}`;
          }, index * 50);
        });
      } else if (element.style?.backgroundImage) {
        const bgImage = element.style.backgroundImage;
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) {
          const baseSrc = urlMatch[1].split('?')[0];
          timestamps.forEach((timestamp, index) => {
            setTimeout(() => {
              element.style.backgroundImage = `url("${baseSrc}?v=${timestamp}&refresh=${Math.random()}")`;
            }, index * 50);
          });
        }
      }
    });
  });
  
  // Trigger complete page reflow
  setTimeout(() => {
    document.body.offsetHeight;
    window.dispatchEvent(new Event('resize'));
  }, 200);
}