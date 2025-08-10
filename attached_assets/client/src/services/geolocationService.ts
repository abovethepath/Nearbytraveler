import { apiRequest } from "@/lib/queryClient";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface ProximityNotification {
  id: number;
  nearbyUser: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
  };
  distance: number;
  timestamp: Date;
}

class GeolocationService {
  private watchId: number | null = null;
  private lastPosition: GeolocationPosition | null = null;
  private isTracking = false;
  private proximityCheckInterval: NodeJS.Timeout | null = null;

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Request location permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      // Try to get current position to trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation permission granted successfully:', position);
          resolve(true);
        },
        (error) => {
          console.error('Geolocation permission error:', error);
          let errorMessage = 'Geolocation access failed';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  // Get current position
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.lastPosition = geoPosition;
          resolve(geoPosition);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000,
        }
      );
    });
  }

  // Enable location sharing in backend
  async enableLocationSharing(userId: number): Promise<void> {
    try {
      await apiRequest('PATCH', `/api/users/${userId}/location-sharing`, { locationSharingEnabled: true });
    } catch (error) {
      console.error('Failed to enable location sharing:', error);
      throw error;
    }
  }

  // Start tracking location
  async startTracking(userId: number): Promise<void> {
    if (this.isTracking || !this.isSupported()) {
      return;
    }

    try {
      // Get initial position
      const position = await this.getCurrentPosition();
      await this.updateLocationInBackend(userId, position);

      // Start watching position changes
      this.watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const geoPosition: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now(),
          };
          
          this.lastPosition = geoPosition;
          await this.updateLocationInBackend(userId, geoPosition);
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        }
      );

      // Start proximity checking
      this.proximityCheckInterval = setInterval(async () => {
        if (this.lastPosition) {
          await this.checkNearbyUsers(userId);
        }
      }, 15000); // Check every 15 seconds

      this.isTracking = true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }

  // Update location in backend
  private async updateLocationInBackend(userId: number, position: GeolocationPosition): Promise<void> {
    try {
      await apiRequest('PATCH', `/api/users/${userId}/location`, {
        latitude: position.latitude,
        longitude: position.longitude,
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }

  // Check for nearby users
  private async checkNearbyUsers(userId: number): Promise<void> {
    if (!this.lastPosition) return;

    try {
      const response = await apiRequest('POST', `/api/users/${userId}/nearby`, {
        latitude: this.lastPosition.latitude,
        longitude: this.lastPosition.longitude,
        radiusKm: 11.265, // 7 miles in kilometers
      });

      // Handle nearby users response if needed
      console.log('Nearby users check completed:', response);
    } catch (error) {
      console.error('Failed to check nearby users:', error);
    }
  }

  // Stop tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.proximityCheckInterval) {
      clearInterval(this.proximityCheckInterval);
      this.proximityCheckInterval = null;
    }

    this.isTracking = false;
  }

  // Disable location sharing
  async disableLocationSharing(userId: number): Promise<void> {
    try {
      await apiRequest('PATCH', `/api/users/${userId}/location-sharing`, { locationSharingEnabled: false });
      this.stopTracking();
    } catch (error) {
      console.error('Failed to disable location sharing:', error);
      throw error;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get current tracking status
  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  // Get last known position
  getLastPosition(): GeolocationPosition | null {
    return this.lastPosition;
  }
}

export const geolocationService = new GeolocationService();