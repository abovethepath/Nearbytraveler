import React, { useState, useEffect } from "react";

interface ScrollingHeroGalleryProps {
  className?: string;
}

export default function ScrollingHeroGallery({ className = "" }: ScrollingHeroGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Production hero images from the working backup (verified available in public folder)
  const heroImages = [
    "/beach travel_1750958707105.jpg",
    "/travel photo group map_1750993025212.jpeg", 
    "/travelers coffee_1750995178947.png",
    "/pexels-olly-2672979_1750959255667.jpg"
  ];

  // Auto-rotate every 5 seconds for testing, then 60 seconds
  useEffect(() => {
    console.log('📸 ScrollingHeroGallery: Initializing with images:', heroImages);
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % heroImages.length;
        console.log('📸 ScrollingHeroGallery: Rotating to image', newIndex, heroImages[newIndex]);
        return newIndex;
      });
    }, 5000); // 5 seconds for testing

    return () => clearInterval(interval);
  }, [heroImages.length]);

  if (heroImages.length === 0) {
    return null;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
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
            style={{ objectPosition: 'center 70%' }}
            onLoad={() => {
              console.log(`✅ Successfully loaded hero image: ${image}`);
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