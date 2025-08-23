import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Set initial value
    updateDeviceType();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceType);

    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
};

export const useIsMobile = (): boolean => {
  const deviceType = useDeviceType();
  return deviceType === 'mobile';
};

export const useIsDesktop = (): boolean => {
  const deviceType = useDeviceType();
  return deviceType === 'desktop';
};

export const useIsTabletOrLarger = (): boolean => {
  const deviceType = useDeviceType();
  return deviceType === 'tablet' || deviceType === 'desktop';
};

// CSS class helper for conditional rendering
export const desktopOnly = 'hidden md:block';
export const mobileOnly = 'block md:hidden';
export const tabletAndUp = 'hidden md:block';