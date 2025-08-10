import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Bell, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { geolocationService } from "@/services/geolocationService";
import { AuthContext } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProximityNotification {
  id: number;
  nearbyUser: {
    id: number;
    username: string;
    name: string;
    profileImage?: string;
    bio?: string;
    location?: string;
    userType?: string;
  };
  distance: number;
  timestamp: Date;
}

export function LocationSharingWidget() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isLocationSupported, setIsLocationSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isTracking, setIsTracking] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  // Mutation for updating user's location manually
  const updateLocationMutation = useMutation({
    mutationFn: async (location: string) => {
      return apiRequest(`/api/users/${user?.id}/location`, 'PATCH', {
        location: location
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      // Navigate to connect page to see nearby users
      window.location.href = '/connect';
    },
    onError: (error) => {
      console.error('Failed to update location:', error);
    }
  });

  const handleManualSearch = () => {
    if (!manualLocation.trim()) return;
    
    // Update user's location and navigate to connect page
    updateLocationMutation.mutate(manualLocation.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  useEffect(() => {
    // Check if geolocation is supported
    const supported = geolocationService.isSupported();
    setIsLocationSupported(supported);
    setDebugInfo(`Geolocation supported: ${supported}`);
    
    // Check current tracking status
    setIsTracking(geolocationService.getTrackingStatus());

    // Check permission status on mount
    if (supported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as any);
        setDebugInfo(prev => `${prev} | Permission: ${result.state}`);
      }).catch(() => {
        setDebugInfo(prev => `${prev} | Permission check failed`);
      });
    }

    // Request notification permission
    geolocationService.requestNotificationPermission();
  }, []);

  // Enable location sharing mutation
  const enableLocationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");
      
      try {
        // Request location permission with better error handling
        const hasPermission = await geolocationService.requestPermission();
        if (!hasPermission) {
          throw new Error("Location access was not granted");
        }

        // Enable location sharing in backend
        await geolocationService.enableLocationSharing(user.id);
        
        // Start tracking
        await geolocationService.startTracking(user.id);
        
        return true;
      } catch (error: any) {
        console.error('Location sharing error:', error);
        
        // Provide specific error messages based on the error type
        if (error.message?.includes('denied') || error.code === 1) {
          throw new Error("Location access was denied. Please check your browser's location settings for this site.");
        } else if (error.message?.includes('unavailable') || error.code === 2) {
          throw new Error("Location information is unavailable. Please try again.");
        } else if (error.message?.includes('timeout') || error.code === 3) {
          throw new Error("Location request timed out. Please try again.");
        } else {
          throw new Error(`Location sharing failed: ${error.message || 'Unknown error'}`);
        }
      }
    },
    onSuccess: () => {
      setIsTracking(true);
      setPermissionStatus('granted');
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to enable location sharing:', error);
      setPermissionStatus('denied');
    }
  });

  // Disable location sharing mutation
  const disableLocationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");
      
      // Disable location sharing in backend
      await geolocationService.disableLocationSharing(user.id);
      
      // Stop tracking
      geolocationService.stopTracking();
      
      return true;
    },
    onSuccess: () => {
      setIsTracking(false);
      setNearbyCount(0);
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to disable location sharing:', error);
    }
  });

  // Get proximity notifications
  const { data: proximityNotifications = [] } = useQuery({
    queryKey: ['/api/users', user?.id, 'proximity-notifications'],
    enabled: !!user && isTracking,
    refetchInterval: 30000, // Check every 30 seconds
  }) as { data: ProximityNotification[] };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      enableLocationMutation.mutate();
    } else {
      disableLocationMutation.mutate();
    }
  };

  if (!isLocationSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn't support location services. Please use a modern browser to enable proximity notifications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          WHO'S NEARBY?
        </CardTitle>
        <CardDescription>
          Get notified when Nearby Locals, Nearby Travelers, Nearby Business and Nearby Events are within 7 miles of your location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Sharing Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="location-sharing">Share Location</Label>
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              Allow others to see when you're nearby
            </p>
          </div>
          <Switch
            id="location-sharing"
            checked={isTracking}
            onCheckedChange={handleLocationToggle}
            disabled={enableLocationMutation.isPending || disableLocationMutation.isPending}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
          />
        </div>

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Location permission denied. Please enable location access in your browser settings and ensure your computer's location services are turned on.
            </AlertDescription>
          </Alert>
        )}

        {/* System Location Help */}
        {!isTracking && permissionStatus !== 'granted' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <strong>Need help with location access?</strong>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                  className="p-1 h-auto"
                >
                  {showTroubleshooting ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {showTroubleshooting && (
                <div className="text-xs mt-2 space-y-1">
                  <div><strong>Windows 10/11:</strong></div>
                  <div>• Settings → Privacy & Security → Location → Location Services (ON)</div>
                  <div>• Allow desktop apps to access location (ON)</div>
                  
                  <div className="mt-2"><strong>Mac:</strong></div>
                  <div>• System Preferences → Security & Privacy → Privacy → Location Services</div>
                  <div>• Enable Location Services and allow your browser</div>
                  
                  <div className="mt-2"><strong>Browser Settings:</strong></div>
                  <div>• Chrome: Settings → Privacy → Site Settings → Location</div>
                  <div>• Firefox: Preferences → Privacy → Permissions → Location</div>
                  <div>• Safari: Preferences → Websites → Location</div>
                  
                  <div className="mt-2 text-blue-600">
                    <strong>Still not working?</strong> Try refreshing the page after changing system settings.
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Tracking Status */}
        {isTracking && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600">Location sharing active</span>
            </div>

            {/* Nearby Users Count */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Nearby Travelers</span>
              </div>
              <Badge variant="secondary">
                {proximityNotifications.length} within 3 miles
              </Badge>
            </div>

            {/* Recent Proximity Notifications */}
            {proximityNotifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Recent Nearby Users
                </h4>
                <div className="space-y-2">
                  {proximityNotifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center gap-3 p-3 bg-background rounded border text-sm hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/profile/${notification.nearbyUser?.id}`;
                      }}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {notification.nearbyUser?.name?.charAt(0) || notification.nearbyUser?.username?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{notification.nearbyUser?.name || notification.nearbyUser?.username}</p>
                          <Badge variant="secondary" className="text-xs">
                            {notification.nearbyUser?.userType === 'local' ? 'Local' : 'Traveler'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.nearbyUser?.location || 'Location not set'}
                        </p>
                        <p className="text-xs text-blue-600">
                          {notification.distance && !isNaN(notification.distance) 
                            ? `${Math.round(notification.distance * 0.621371 * 10) / 10} miles away`
                            : 'Distance unavailable'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {proximityNotifications.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-sm"
                    onClick={() => {
                      // Navigate to connect page or nearby users page
                      window.location.href = '/connect';
                    }}
                  >
                    +{proximityNotifications.length - 3} more nearby users
                  </Button>
                )}
              </div>
            )}

            {/* Debug Information */}
            {debugInfo && (
              <div className="p-2 bg-gray-50 rounded border text-xs text-gray-600">
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}

            {/* Privacy Note */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Privacy:</strong> Your exact location is never shared. Others only see when you're nearby (within 7 miles) and can connect with you if interested.
              </p>
            </div>
          </div>
        )}

        {/* Enable Location Button */}
        {!isTracking && permissionStatus !== 'denied' && (
          <Button
            onClick={() => handleLocationToggle(true)}
            disabled={enableLocationMutation.isPending}
            className="w-full text-black dark:text-black"
          >
            {enableLocationMutation.isPending ? "Enabling..." : "Enable Proximity Notifications"}
          </Button>
        )}

        {/* Manual Location Input Fallback */}
        {!isTracking && (permissionStatus === 'denied' || permissionStatus === 'unknown') && (
          <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Manual Location Entry</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Can't enable automatic location? Enter your city manually to find nearby travelers.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your city (e.g., Los Angeles, CA)"
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <Button 
                size="sm" 
                className="w-full bg-gray-600 hover:bg-gray-700 text-white" 
                onClick={handleManualSearch}
                disabled={updateLocationMutation.isPending || !manualLocation.trim()}
              >
                {updateLocationMutation.isPending ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}