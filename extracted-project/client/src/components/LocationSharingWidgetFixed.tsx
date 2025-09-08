import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapPin, Navigation, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  locationSharingEnabled?: boolean;
}

interface LocationSharingWidgetFixedProps {
  user: User;
}

export function LocationSharingWidgetFixed({ user }: LocationSharingWidgetFixedProps) {
  const [locationSharing, setLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debug logging
  console.log('🔧 LocationSharingWidgetFixed rendered:', { 
    hasUser: !!user, 
    userId: user.id, 
    username: user.username,
    locationSharingEnabled: user.locationSharingEnabled
  });

  useEffect(() => {
    if (user.locationSharingEnabled) {
      setLocationSharing(true);
    }
  }, [user]);

  // Update the user's locationSharingEnabled field directly
  const updateLocationSharingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      console.log('updateLocationSharingMutation called with:', { enabled, userId: user.id });
      const url = `/api/users/${user.id}`;
      console.log('Making API call to:', url);
      return apiRequest('PUT', url, {
        locationSharingEnabled: enabled
      });
    },
    onSuccess: () => {
      console.log('Location sharing preference updated successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      toast({
        title: "Location sharing updated",
        description: "Your location sharing preference has been saved",
      });
    },
    onError: (error) => {
      console.error('Error updating location sharing preference:', error);
      toast({
        title: "Error",
        description: "Failed to update location sharing preference",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationSharingEnabled: boolean }) => {
      console.log('updateLocationMutation called with:', { data, userId: user.id });
      const url = `/api/users/${user.id}/location`;
      console.log('Making location API call to:', url);
      return apiRequest('POST', url, data);
    },
    onSuccess: () => {
      console.log('Location updated successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      toast({
        title: "Location updated",
        description: "Your location sharing preferences have been saved",
      });
    },
    onError: (error) => {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location sharing",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setIsGettingLocation(false);
        
        if (locationSharing) {
          updateLocationMutation.mutate({
            latitude,
            longitude,
            locationSharingEnabled: true
          });
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleLocationSharingToggle = (enabled: boolean) => {
    console.log('handleLocationSharingToggle called:', { enabled, userId: user.id });
    
    console.log('User ID confirmed, proceeding with toggle:', user.id);
    setLocationSharing(enabled);
    
    // Always update the user's locationSharingEnabled preference
    updateLocationSharingMutation.mutate(enabled);
    
    if (enabled) {
      getCurrentLocation();
    } else {
      // Disable location sharing
      if (currentLocation) {
        updateLocationMutation.mutate({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          locationSharingEnabled: false
        });
      }
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Sharing (Fixed)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {locationSharing ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              Share location on city map
            </span>
          </div>
          <Switch
            checked={locationSharing}
            onCheckedChange={handleLocationSharingToggle}
            data-testid="location-sharing-toggle"
          />
        </div>

        {locationSharing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>Your location will be visible to other users on the city map</span>
            </div>

            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation || updateLocationMutation.isPending}
              className="w-full"
              variant="outline"
              data-testid="update-location-button"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Update Current Location'}
            </Button>

            {currentLocation && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <div className="font-medium mb-1">Current Position:</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lat: {formatCoordinate(currentLocation.latitude)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lng: {formatCoordinate(currentLocation.longitude)}
                </div>
              </div>
            )}
          </div>
        )}

        {!locationSharing && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Enable location sharing to appear on city maps and help other travelers find you
          </div>
        )}
      </CardContent>
    </Card>
  );
}