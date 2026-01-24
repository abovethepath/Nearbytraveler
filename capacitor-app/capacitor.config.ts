import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nearbytraveler.app',
  appName: 'Nearby Traveler',
  
  // Point to your live website - this is the key setting!
  server: {
    url: 'https://nearbytraveler.org',
    cleartext: false, // HTTPS only for security
  },
  
  // iOS specific settings
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    // Allow navigation to your domain
    limitsNavigationsToAppBoundDomains: false,
  },
  
  // Plugin configurations
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F97316', // Orange brand color
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    // Status Bar
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F97316',
    },
    
    // Geolocation for background pings
    Geolocation: {
      // iOS will prompt for permissions
    },
  },
};

export default config;
