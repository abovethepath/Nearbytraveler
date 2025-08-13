import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Plane, MapPin, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConnectionCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  connectionType: 'connect' | 'message' | 'event_join' | 'travel_match';
  userInfo?: {
    username: string;
    destination?: string;
    profileImage?: string;
  };
}

export default function ConnectionCelebration({
  isVisible,
  onComplete,
  connectionType,
  userInfo
}: ConnectionCelebrationProps) {
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#F97316', '#10B981', '#8B5CF6']
      });

      // Animation sequence
      const timer1 = setTimeout(() => setAnimationStage(1), 500);
      const timer2 = setTimeout(() => setAnimationStage(2), 1500);
      const timer3 = setTimeout(() => {
        setAnimationStage(0);
        onComplete();
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onComplete]);

  const getCelebrationContent = () => {
    switch (connectionType) {
      case 'connect':
        return {
          icon: <Users className="w-12 h-12 text-blue-500" />,
          title: 'Connection Request Sent!',
          subtitle: `Your request was sent to ${userInfo?.username || 'a fellow traveler'}`,
          color: 'blue'
        };
      case 'message':
        return {
          icon: <Heart className="w-12 h-12 text-red-500" />,
          title: 'Message Sent!',
          subtitle: `Your message was delivered to ${userInfo?.username || 'your connection'}`,
          color: 'red'
        };
      case 'event_join':
        return {
          icon: <Sparkles className="w-12 h-12 text-orange-500" />,
          title: 'Event Joined!',
          subtitle: `You'll meet amazing people at this event`,
          color: 'orange'
        };
      case 'travel_match':
        return {
          icon: <Plane className="w-12 h-12 text-orange-500" />,
          title: 'Travel Match!',
          subtitle: `Perfect match for ${userInfo?.destination || 'your destination'}`,
          color: 'orange'
        };
      default:
        return {
          icon: <Check className="w-12 h-12 text-green-500" />,
          title: 'Success!',
          subtitle: 'Action completed successfully',
          color: 'green'
        };
    }
  };

  const content = getCelebrationContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: animationStage >= 1 ? 1 : 0,
              rotate: animationStage >= 1 ? 0 : -180
            }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            {/* Floating sparkles */}
            <div className="relative">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: animationStage >= 1 ? [0, 1, 0] : 0,
                    scale: animationStage >= 1 ? [0, 1, 0] : 0,
                    x: animationStage >= 1 ? [0, (i % 2 ? 30 : -30)] : 0,
                    y: animationStage >= 1 ? [0, (i % 3 ? -20 : 20)] : 0,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute"
                  style={{
                    left: `${20 + (i * 15)}%`,
                    top: `${10 + (i % 3) * 20}%`
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}
            </div>

            {/* Main icon with pulse effect */}
            <motion.div
              animate={{
                scale: animationStage >= 1 ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                repeat: animationStage >= 1 ? Infinity : 0,
                repeatDelay: 0.5
              }}
              className="mb-6"
            >
              {content.icon}
            </motion.div>

            {/* Profile image if available */}
            {userInfo?.profileImage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: animationStage >= 1 ? 1 : 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                <img
                  src={userInfo.profileImage}
                  alt={userInfo.username}
                  className="w-16 h-16 rounded-full mx-auto border-4 border-white shadow-lg"
                />
              </motion.div>
            )}

            {/* Title with typewriter effect */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: animationStage >= 1 ? 1 : 0,
                y: animationStage >= 1 ? 0 : 20
              }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold mb-2 text-gray-900 dark:text-white"
            >
              {content.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: animationStage >= 2 ? 1 : 0,
                y: animationStage >= 2 ? 0 : 20
              }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 dark:text-gray-300"
            >
              {content.subtitle}
            </motion.p>

            {/* Destination badge */}
            {userInfo?.destination && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: animationStage >= 2 ? 1 : 0,
                  scale: animationStage >= 2 ? 1 : 0
                }}
                transition={{ delay: 1 }}
                className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-medium"
              >
                <MapPin className="w-4 h-4" />
                {userInfo.destination}
              </motion.div>
            )}

            {/* Ripple effect */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ 
                scale: animationStage >= 1 ? 3 : 0,
                opacity: animationStage >= 1 ? 0 : 1
              }}
              transition={{ duration: 1.5 }}
              className={`absolute inset-0 rounded-2xl border-4 border-${content.color}-500 pointer-events-none`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}