import { useState, useCallback } from 'react';

export type CelebrationType = 'connect' | 'message' | 'event_join' | 'travel_match';

export interface CelebrationData {
  type: CelebrationType;
  userInfo?: {
    username: string;
    destination?: string;
    profileImage?: string;
  };
}

export function useConnectionCelebration() {
  const [isVisible, setIsVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const triggerCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data);
    setIsVisible(true);
  }, []);

  const hideCelebration = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCelebrationData(null);
    }, 300); // Wait for exit animation
  }, []);

  return {
    isVisible,
    celebrationData,
    triggerCelebration,
    hideCelebration
  };
}