import React from 'react';
import { motion } from 'framer-motion';
import { Plane, MapPin, Users, MessageCircle, Calendar, Camera, Globe, Coffee } from 'lucide-react';

// Page-specific loading components with travel themes

export function TripPlanningLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative">
        {/* Animated Map Dots */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Flying Plane */}
        <motion.div
          className="absolute top-1/2 left-0 text-blue-600"
          animate={{
            x: [0, 100, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Plane className="w-8 h-8" />
        </motion.div>
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Planning your perfect trip...
      </motion.p>
    </div>
  );
}

export function ConnectionsLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative w-32 h-32">
        {/* Orbiting User Icons */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white"
            style={{
              top: '50%',
              left: '50%',
              marginTop: '-16px',
              marginLeft: '-16px',
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.33,
              ease: "linear"
            }}
          >
            <motion.div
              style={{
                transform: `translate(${40 * Math.cos(i * 2.09)}px, ${40 * Math.sin(i * 2.09)}px)`,
              }}
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1.33,
                ease: "linear"
              }}
            >
              <Users className="w-4 h-4" />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Center Heart */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-6 h-6 text-red-500 transform -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ❤️
        </motion.div>
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Finding your travel companions...
      </motion.p>
    </div>
  );
}

export function EventsLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative">
        {/* Calendar Animation */}
        <motion.div
          className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg"
          animate={{
            rotateY: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Calendar className="w-8 h-8" />
        </motion.div>
        
        {/* Floating Event Markers */}
        {[MapPin, Coffee, Camera].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute text-green-600"
            style={{
              top: `${-20 + i * 15}px`,
              left: `${80 + i * 20}px`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        ))}
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Discovering amazing events...
      </motion.p>
    </div>
  );
}

export function MessagesLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative">
        {/* Animated Chat Bubbles */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <div className={`px-4 py-2 rounded-lg max-w-xs ${
                i % 2 === 0 
                  ? 'bg-gray-200  
                  : 'bg-blue-500 text-white'
              }`}>
                <div className="flex space-x-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className={`w-2 h-2 rounded-full ${
                        i % 2 === 0 ? 'bg-gray-400' : 'bg-white'
                      }`}
                      animate={{
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: dot * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Message Icon */}
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-blue-600"
          animate={{
            rotate: [0, -10, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.div>
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading conversations...
      </motion.p>
    </div>
  );
}

export function PhotoGalleryLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative">
        {/* Camera with Flash */}
        <motion.div
          className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-white shadow-lg"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Camera className="w-8 h-8" />
        </motion.div>
        
        {/* Flash Effect */}
        <motion.div
          className="absolute inset-0 bg-white rounded-lg opacity-0"
          animate={{
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating Photo Frames */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-6 bg-white border-2 border-gray-300 rounded"
            style={{
              top: `${-30 + i * 10}px`,
              left: `${80 + i * 15}px`,
            }}
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading travel memories...
      </motion.p>
    </div>
  );
}

export function BusinessOffersLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="relative">
        {/* Spinning Coffee Cup */}
        <motion.div
          className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Coffee className="w-8 h-8" />
        </motion.div>
        
        {/* Steam Animation */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-6 bg-gray-300 rounded-full opacity-50"
              style={{ left: `${i * 4 - 4}px` }}
              animate={{
                y: [0, -20, -40],
                opacity: [0.5, 0.8, 0],
                scale: [1, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
        
        {/* Floating Deal Tags */}
        {['50%', '30%', '25%'].map((discount, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-bold bg-red-500 text-white px-2 py-1 rounded"
            style={{
              top: `${30 + i * 20}px`,
              left: `${60 + i * 25}px`,
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          >
            {discount}
          </motion.div>
        ))}
      </div>
      
      <motion.p
        className="text-lg font-medium text-gray-700 
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Finding the best local deals...
      </motion.p>
    </div>
  );
}