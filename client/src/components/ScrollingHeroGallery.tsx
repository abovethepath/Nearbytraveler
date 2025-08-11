import React, { useState, useEffect } from "react";

interface ScrollingHeroGalleryProps {
  className?: string;
}

export default function ScrollingHeroGallery({ className = "" }: ScrollingHeroGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Production hero images from the working backup
  const heroImages = [
    "/beach travel_1750958707105.jpg",
    "/travel photo group map_1750993025212.jpeg", 
    "/travelers coffee_1750995178947.png"
  ];

  // Auto-rotate every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 60000); // 60 seconds

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
            onError={(e) => {
              console.error(`Failed to load hero image: ${image}`);
              // Hide the broken image
              (e.target as HTMLImageElement).style.display = 'none';
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