import React, { useState, useEffect } from "react";
import { preloadImages } from "@/utils/imageOptimizer";

interface ScrollingHeroGalleryProps {
  className?: string;
}

export default function ScrollingHeroGallery({ className = "" }: ScrollingHeroGalleryProps) {
  // DISABLED - Component causing blinking issues
  return null;

  // Preload all images to prevent loading delays
  useEffect(() => {
    console.log('📸 ScrollingHeroGallery: Preloading images...');
    preloadImages(heroImages)
      .then(() => {
        console.log('✅ All hero images preloaded successfully');
        // Mark all images as loaded
        setLoadedImages(new Set(heroImages.map((_, index) => index)));
      })
      .catch((error) => {
        console.error('❌ Some hero images failed to preload:', error);
        // Try individual loading as fallback
        heroImages.forEach((src, index) => {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(index));
            console.log(`✅ Fallback loaded hero image ${index}: ${src}`);
          };
          img.onerror = () => {
            console.error(`❌ Failed to load hero image ${index}: ${src}`);
          };
          img.src = src;
        });
      });
  }, []);

  // Auto-rotate every 20 seconds as requested by user
  useEffect(() => {
    console.log('📸 ScrollingHeroGallery: Initializing with images:', heroImages);
    console.log('📸 ScrollingHeroGallery: Total images:', heroImages.length);
    console.log('📸 ScrollingHeroGallery: Starting rotation at:', new Date().toISOString());
    
    if (heroImages.length <= 1) {
      console.log('📸 ScrollingHeroGallery: Only 1 or no images, skipping rotation');
      return;
    }
    
    // Immediate log to confirm this runs
    console.log('📸 ScrollingHeroGallery: Setting up interval for', heroImages.length, 'images');
    
    const interval = setInterval(() => {
      console.log('📸 ScrollingHeroGallery: INTERVAL FIRED at', new Date().toISOString());
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % heroImages.length;
        console.log('📸 ScrollingHeroGallery: Rotating from', prevIndex, 'to', newIndex, 'showing:', heroImages[newIndex]);
        return newIndex;
      });
    }, 20000); // 20 seconds as requested by user

    return () => {
      console.log('📸 ScrollingHeroGallery: Cleaning up interval');
      clearInterval(interval);
    };
  }, [heroImages]);

  if (heroImages.length === 0) {
    return null;
  }

  console.log('📸 ScrollingHeroGallery: Rendering component with', heroImages.length, 'images');
  console.log('📸 ScrollingHeroGallery: Current index:', currentIndex);
  console.log('📸 ScrollingHeroGallery: className received:', className);

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '600px' }}>
      {heroImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image}
            alt={`Travel experience ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ 
              objectPosition: 'center 70%',
              opacity: loadedImages.has(index) ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            loading="eager"
            onLoad={() => {
              console.log(`✅ Successfully loaded hero image: ${image}`);
              setLoadedImages(prev => new Set(prev).add(index));
            }}
            onError={(e) => {
              console.error(`❌ Failed to load hero image: ${image}`);
              console.error('Image error details:', e);
              console.error('Current working directory:', window.location.origin);
              console.error('Full image URL:', window.location.origin + image);
              // Try to reload the image once more
              const img = e.target as HTMLImageElement;
              if (!img.dataset.retried) {
                img.dataset.retried = 'true';
                setTimeout(() => {
                  img.src = img.src + '?retry=' + Date.now();
                }, 1000);
              } else {
                // Hide the broken image after retry
                img.style.display = 'none';
              }
            }}
          />
        </div>
      ))}

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}