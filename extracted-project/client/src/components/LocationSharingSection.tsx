import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapPin, Navigation, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  locationSharingEnabled?: boolean;
  userType?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

interface LocationSharingSectionProps {
  user: User;
  queryClient: any;
  toast: any;
}

export function LocationSharingSection({ user, queryClient, toast }: LocationSharingSectionProps) {
  // Local state for immediate UI feedback
  const [localLocationSharing, setLocalLocationSharing] = useState(user.locationSharingEnabled || false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Sync local state with server data when user data changes
  useEffect(() => {
    setLocalLocationSharing(user.locationSharingEnabled || false);
  }, [user.locationSharingEnabled]);

  // Update location sharing mutation
  const updateLocationSharingMutation = useMutation({
    mutationFn: async (data: { locationSharingEnabled: boolean; currentLatitude?: number; currentLongitude?: number }) => {
      console.log('🔧 LocationSharingSection: Updating location sharing:', { data, userId: user.id });
      return apiRequest('PUT', `/api/users/${user.id}`, data);
    },
    onSuccess: (response) => {
      console.log('🔧 LocationSharingSection: Location sharing updated successfully');
      queryClient.setQueryData([`/api/users/${user.id}`], response);
      queryClient.refetchQueries({ queryKey: [`/api/users/${user.id}`] });
    },
    onError: (error) => {
      console.error('🔧 LocationSharingSection: Error updating location sharing:', error);
      // Revert the local state on error
      setLocalLocationSharing(user.locationSharingEnabled || false);
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
        
        if (localLocationSharing) {
          updateLocationSharingMutation.mutate({
            locationSharingEnabled: true,
            currentLatitude: latitude,
            currentLongitude: longitude
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
    console.log('🔧 LocationSharingSection: Toggle clicked:', { enabled, userId: user.id });
    
    // Update local state immediately for responsive UI
    setLocalLocationSharing(enabled);
    
    if (enabled) {
      // Request location permission first
      if (!navigator.geolocation) {
        setLocalLocationSharing(false);
        toast({
          title: "Location not supported",
          description: "Your browser doesn't support location services",
          variant: "destructive",
        });
        return;
      }
      
      // Get current location before enabling sharing
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('🔧 LocationSharingSection: Got location:', { latitude, longitude });
          
          updateLocationSharingMutation.mutate({
            locationSharingEnabled: enabled,
            currentLatitude: latitude,
            currentLongitude: longitude
          });
          
          toast({
            title: "Location sharing enabled",
            description: "Your location is now visible on city maps",
          });
        },
        (error) => {
          console.error('🔧 LocationSharingSection: Location error:', error);
          setLocalLocationSharing(false);
          
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
        }
      );
    } else {
      // Disable location sharing
      updateLocationSharingMutation.mutate({
        locationSharingEnabled: enabled
      });
      
      toast({
        title: "Location sharing disabled",
        description: "Your location is no longer visible on city maps",
      });
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 break-words overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {localLocationSharing ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              Share location on city map
            </span>
          </div>
          <Switch
            checked={localLocationSharing}
            onCheckedChange={handleLocationSharingToggle}
            disabled={updateLocationSharingMutation.isPending}
            data-testid="location-sharing-toggle"
          />
        </div>

        {localLocationSharing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>
                Your location will be visible to other users on the city map
                {user.userType === 'business' && ' while you are running deals and events'}
              </span>
            </div>

            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation || updateLocationSharingMutation.isPending}
              className="w-full"
              variant="outline"
              data-testid="update-location-button"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Update Current Location'}
            </Button>

            {(currentLocation || (user.currentLatitude && user.currentLongitude)) && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <div className="font-medium mb-1">Current Position:</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lat: {formatCoordinate(currentLocation?.latitude || user.currentLatitude || 0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lng: {formatCoordinate(currentLocation?.longitude || user.currentLongitude || 0)}
                </div>
              </div>
            )}
          </div>
        )}

        {!localLocationSharing && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Enable location sharing to appear on city maps and help other travelers find you
          </div>
        )}
      </CardContent>
    </Card>
  );
}