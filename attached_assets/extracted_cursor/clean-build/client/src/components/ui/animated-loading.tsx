import React from 'react';
import { motion } from 'framer-motion';
import { Plane, MapPin, Users, Heart, Camera, Coffee } from 'lucide-react';

interface AnimatedLoadingProps {
  type?: 'default' | 'travel' | 'connections' | 'events' | 'photos' | 'business';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const loadingVariants = {
  travel: {
    icon: Plane,
    colors: ['from-blue-400', 'to-orange-500'],
    message: 'Planning your adventure...',
    animation: {
      rotate: 360,
      x: [0, 100, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  },
  connections: {
    icon: Users,
    colors: ['from-pink-400', 'to-red-600'],
    message: 'Connecting with travelers...',
    animation: {
      scale: [1, 1.2, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
  },
  events: {
    icon: MapPin,
    colors: ['from-green-400', 'to-blue-600'],
    message: 'Discovering local events...',
    animation: {
      y: [0, -20, 0],
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
    }
  },
  photos: {
    icon: Camera,
    colors: ['from-yellow-400', 'to-orange-600'],
    message: 'Loading memories...',
    animation: {
      rotate: [0, -10, 10, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  },
  business: {
    icon: Coffee,
    colors: ['from-orange-400', 'to-red-600'],
    message: 'Finding local deals...',
    animation: {
      rotate: 360,
      transition: { duration: 3, repeat: Infinity, ease: "linear" }
    }
  },
  default: {
    icon: Heart,
    colors: ['from-blue-400', 'to-orange-500'],
    message: 'Loading...',
    animation: {
      scale: [1, 1.3, 1],
      transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
    }
  }
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

const containerSizes = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64'
};

export function AnimatedLoading({ 
  type = 'default', 
  message, 
  size = 'md' 
}: AnimatedLoadingProps) {
  const config = loadingVariants[type];
  const IconComponent = config.icon;
  const displayMessage = message || config.message;

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-6`}>
      {/* Animated Background Circle */}
      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.colors[0]} ${config.colors[1]} opacity-20`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ width: '120px', height: '120px' }}
        />
        
        {/* Main Icon */}
        <motion.div
          className={`relative z-10 ${sizeClasses[size]} text-white bg-gradient-to-r ${config.colors[0]} ${config.colors[1]} rounded-full flex items-center justify-center shadow-lg`}
          animate={config.animation}
          style={{ margin: '30px' }}
        >
          <IconComponent className="w-1/2 h-1/2" />
        </motion.div>
      </div>

      {/* Loading Message */}
      <motion.p
        className="text-lg font-medium text-gray-700 dark:text-gray-300 text-center"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {displayMessage}
      </motion.p>

      {/* Animated Dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 bg-gradient-to-r ${config.colors[0]} ${config.colors[1]} rounded-full`}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton Loading Component for Lists
export function SkeletonLoader({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'list' }) {
  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="flex items-center space-x-4 p-4 border rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="border rounded-lg p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Full Screen Loading with Travel Theme
export function FullScreenLoading({ message = "Preparing your travel experience..." }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <AnimatedLoading type="travel" size="lg" message={message} />
        
        {/* Floating Travel Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[Plane, MapPin, Camera, Heart, Users].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute text-gray-300 dark:text-gray-600"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}