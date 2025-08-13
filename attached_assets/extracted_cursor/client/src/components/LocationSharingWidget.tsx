import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapPin, Navigation, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function LocationSharingWidget() {
  const { user } = useAuth();
  const [locationSharing, setLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.locationSharingEnabled) {
      setLocationSharing(true);
    }
  }, [user]);

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationSharingEnabled: boolean }) => {
      return apiRequest(`/api/users/${user?.id}/location`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
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
    setLocationSharing(enabled);
    
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
          Location Sharing
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