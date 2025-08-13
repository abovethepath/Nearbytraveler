import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Users, Eye, EyeOff, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { geolocationService } from "@/services/geolocationService";

interface NearbyUser {
  id: number;
  username: string;
  name: string;
  profileImage?: string;
  distance: number;
}

export function ComprehensiveGeolocationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [locationSharing, setLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);

  // Initialize location sharing state from user data
  useEffect(() => {
    if (user?.locationSharingEnabled) {
      setLocationSharing(true);
      setTrackingActive(geolocationService.getTrackingStatus());
    }
  }, [user]);

  // Fetch nearby users when location changes
  const { data: nearbyUsersData, refetch: refetchNearbyUsers } = useQuery({
    queryKey: ['/api/users', user?.id, 'nearby'],
    queryFn: async () => {
      if (!currentLocation || !user?.id) return [];
      
      const response = await apiRequest('POST', `/api/users/${user.id}/nearby`, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 11.265 // 7 miles
      });
      
      return response.nearbyUsers || [];
    },
    enabled: !!currentLocation && !!user?.id && locationSharing,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (nearbyUsersData) {
      setNearbyUsers(nearbyUsersData);
    }
  }, [nearbyUsersData]);

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationSharingEnabled: boolean }) => {
      return apiRequest('POST', `/api/users/${user?.id}/location`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
      if (currentLocation) {
        refetchNearbyUsers();
      }
      toast({
        title: "Location updated",
        description: "Your location and sharing preferences have been saved",
      });
    },
    onError: (error) => {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    try {
      // Request permission first
      await geolocationService.requestPermission();
      
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
              message = "Location access denied. Please enable location permissions in your browser settings.";
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
    } catch (error) {
      setIsGettingLocation(false);
      toast({
        title: "Permission Error",
        description: error instanceof Error ? error.message : "Failed to request location permission",
        variant: "destructive",
      });
    }
  };

  // Handle location sharing toggle
  const handleLocationSharingToggle = async (enabled: boolean) => {
    setLocationSharing(enabled);
    
    if (enabled) {
      await getCurrentLocation();
      
      // Start tracking if geolocation service is available
      if (user?.id) {
        try {
          await geolocationService.startTracking(user.id);
          setTrackingActive(true);
          toast({
            title: "Location tracking enabled",
            description: "Your location will be updated automatically",
          });
        } catch (error) {
          console.error('Error starting location tracking:', error);
        }
      }
    } else {
      // Disable location sharing
      geolocationService.stopTracking();
      setTrackingActive(false);
      
      if (currentLocation && user?.id) {
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

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Comprehensive Geolocation System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Sharing Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {locationSharing ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              Share location with nearby travelers
            </span>
          </div>
          <Switch
            checked={locationSharing}
            onCheckedChange={handleLocationSharingToggle}
          />
        </div>

        {/* Location Status */}
        {locationSharing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>Your location will be visible to other travelers within 7 miles</span>
            </div>

            {/* Location Update Button */}
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation || updateLocationMutation.isPending}
              className="w-full"
              variant="outline"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Update Current Location'}
            </Button>

            {/* Current Location Display */}
            {currentLocation && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <div className="font-medium mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Current Position:
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lat: {formatCoordinate(currentLocation.latitude)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Lng: {formatCoordinate(currentLocation.longitude)}
                </div>
                {trackingActive && (
                  <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Auto-tracking active
                  </Badge>
                )}
              </div>
            )}

            {/* Nearby Users */}
            {nearbyUsers.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Nearby Travelers ({nearbyUsers.length})
                </div>
                <div className="space-y-2">
                  {nearbyUsers.slice(0, 3).map((nearbyUser) => (
                    <div key={nearbyUser.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {nearbyUser.profileImage ? (
                          <img 
                            src={nearbyUser.profileImage} 
                            alt={nearbyUser.name || nearbyUser.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-3 w-3" />
                          </div>
                        )}
                        <span>{nearbyUser.name || nearbyUser.username}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatDistance(nearbyUser.distance)}
                      </Badge>
                    </div>
                  ))}
                  {nearbyUsers.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{nearbyUsers.length - 3} more nearby
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disabled State */}
        {!locationSharing && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Enable location sharing to:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Appear on city maps for other travelers</li>
              <li>Discover nearby travelers and locals</li>
              <li>Receive proximity notifications</li>
              <li>Get location-based event recommendations</li>
            </ul>
          </div>
        )}

        {/* Geolocation Features Summary */}
        <div className="border-t pt-3 mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Comprehensive Geolocation Features:</strong>
            <div className="mt-1 space-y-1">
              <div>• Users: Real-time location sharing & nearby discovery</div>
              <div>• Businesses: Location-based proximity notifications</div>
              <div>• Events: Location-tagged event creation & discovery</div>
              <div>• Travel Memories: GPS-tagged photo memories</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}