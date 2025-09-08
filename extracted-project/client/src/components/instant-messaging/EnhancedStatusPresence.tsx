import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Circle,
  MapPin, 
  Clock, 
  Users, 
  Settings,
  Edit3,
  X,
  Plane,
  Home,
  Coffee,
  Briefcase
} from "lucide-react";
import { authStorage } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StatusPresenceSettings {
  onlineStatus: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  customStatus: string;
  locationBasedStatus: string;
  statusEmoji: string;
  doNotDisturb: boolean;
}

interface EnhancedStatusPresenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedStatusPresence({ isOpen, onClose }: EnhancedStatusPresenceProps) {
  const user = authStorage.getUser();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<StatusPresenceSettings>({
    onlineStatus: 'online',
    customStatus: '',
    locationBasedStatus: '',
    statusEmoji: '🟢',
    doNotDisturb: false
  });

  // Load current user status settings
  useEffect(() => {
    if (user) {
      setSettings({
        onlineStatus: user.onlineStatus || 'online',
        customStatus: user.customStatus || '',
        locationBasedStatus: user.locationBasedStatus || '',
        statusEmoji: user.statusEmoji || '🟢',
        doNotDisturb: user.doNotDisturb || false
      });
    }
  }, [user]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (statusData: Partial<StatusPresenceSettings>) => {
      return await apiRequest('/api/users/status', {
        method: 'PUT',
        body: statusData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }
  });

  const handleStatusChange = (key: keyof StatusPresenceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateStatusMutation.mutate({ [key]: value });
  };

  // Predefined status options
  const statusOptions = [
    { value: 'online', label: 'Online', emoji: '🟢', color: 'bg-green-500' },
    { value: 'away', label: 'Away', emoji: '🟡', color: 'bg-yellow-500' },
    { value: 'busy', label: 'Busy', emoji: '🔴', color: 'bg-red-500' },
    { value: 'invisible', label: 'Invisible', emoji: '⚫', color: 'bg-gray-500' },
    { value: 'offline', label: 'Offline', emoji: '⚪', color: 'bg-gray-300' }
  ];

  // Quick custom status options
  const quickStatusOptions = [
    { text: 'Available to chat', emoji: '💬' },
    { text: 'In a meeting', emoji: '📞' },
    { text: 'Working', emoji: '💻' },
    { text: 'Taking a break', emoji: '☕' },
    { text: 'Traveling', emoji: '✈️' },
    { text: 'At lunch', emoji: '🍽️' },
    { text: 'Focus time', emoji: '🎯' },
    { text: 'Available for hangouts', emoji: '🎉' }
  ];

  // Location-based status options
  const locationStatusOptions = [
    { text: 'At home', emoji: '🏠' },
    { text: 'At work', emoji: '🏢' },
    { text: 'At the airport', emoji: '✈️' },
    { text: 'On vacation', emoji: '🏖️' },
    { text: 'Exploring the city', emoji: '🗺️' },
    { text: 'At a cafe', emoji: '☕' },
    { text: 'In transit', emoji: '🚇' },
    { text: 'At a hotel', emoji: '🏨' }
  ];

  // Get current location for status
  const setCurrentLocationStatus = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get city name
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
            );
            const data = await response.json();
            const city = data.results[0]?.components?.city || 
                        data.results[0]?.components?.town || 
                        'Unknown location';
            
            handleStatusChange('locationBasedStatus', `In ${city}`);
          } catch (error) {
            handleStatusChange('locationBasedStatus', 'At current location');
          }
        }
      );
    }
  };

  // Clear all status
  const clearAllStatus = () => {
    setSettings({
      onlineStatus: 'online',
      customStatus: '',
      locationBasedStatus: '',
      statusEmoji: '🟢',
      doNotDisturb: false
    });
    updateStatusMutation.mutate({
      customStatus: '',
      locationBasedStatus: '',
      statusEmoji: '🟢',
      doNotDisturb: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-green-500" />
              <CardTitle>Status & Presence</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Status Display */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                statusOptions.find(s => s.value === settings.onlineStatus)?.color || 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {statusOptions.find(s => s.value === settings.onlineStatus)?.label}
                  </span>
                  {settings.statusEmoji && (
                    <span className="text-lg">{settings.statusEmoji}</span>
                  )}
                </div>
                {settings.customStatus && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.customStatus}
                  </p>
                )}
                {settings.locationBasedStatus && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {settings.locationBasedStatus}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={clearAllStatus}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Online Status */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Circle className="w-4 h-4" />
              Online Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.onlineStatus === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handleStatusChange('onlineStatus', option.value);
                    handleStatusChange('statusEmoji', option.emoji);
                  }}
                  className="justify-start"
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${option.color}`} />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Status */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Custom Status
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="What's your status?"
                value={settings.customStatus}
                onChange={(e) => handleStatusChange('customStatus', e.target.value)}
                maxLength={100}
              />
              <div className="grid grid-cols-2 gap-2">
                {quickStatusOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStatusChange('customStatus', option.text);
                      handleStatusChange('statusEmoji', option.emoji);
                    }}
                    className="justify-start text-xs"
                  >
                    {option.emoji} {option.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Location-Based Status */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Status
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Where are you?"
                  value={settings.locationBasedStatus}
                  onChange={(e) => handleStatusChange('locationBasedStatus', e.target.value)}
                  maxLength={50}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setCurrentLocationStatus}
                >
                  Use Current
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locationStatusOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('locationBasedStatus', option.text)}
                    className="justify-start text-xs"
                  >
                    {option.emoji} {option.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Emoji */}
          <div className="space-y-3">
            <h3 className="font-medium">Status Emoji</h3>
            <div className="grid grid-cols-8 gap-2">
              {['🟢', '🟡', '🔴', '🟠', '🔵', '🟣', '⚫', '⚪', '💚', '❤️', '💙', '💜', '🏠', '✈️', '☕', '💻'].map((emoji) => (
                <Button
                  key={emoji}
                  variant={settings.statusEmoji === emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange('statusEmoji', emoji)}
                  className="text-lg p-1 h-10"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Auto Status Features */}
          <div className="space-y-3">
            <h3 className="font-medium">Auto Status</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Automatically set to "Away" after 10 minutes of inactivity</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-3 h-3" />
                <span>Automatically update location when traveling</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>Show activity status to connections</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Status utility components and hooks
export function StatusIndicator({ 
  status, 
  size = "sm", 
  showLabel = false 
}: { 
  status: string; 
  size?: "sm" | "md" | "lg"; 
  showLabel?: boolean;
}) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  const colorClasses = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    invisible: "bg-gray-400",
    offline: "bg-gray-300"
  };

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`rounded-full ${sizeClasses[size]} ${
          colorClasses[status as keyof typeof colorClasses] || 'bg-gray-400'
        }`}
      />
      {showLabel && (
        <span className="text-xs capitalize text-gray-600 dark:text-gray-400">
          {status}
        </span>
      )}
    </div>
  );
}

export function UserStatusCard({ user }: { user: any }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
      <div className="relative">
        <img
          src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=ffffff`}
          alt={user.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="absolute -bottom-1 -right-1">
          <StatusIndicator status={user.onlineStatus || 'offline'} size="md" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.username}</p>
        {user.customStatus && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user.statusEmoji} {user.customStatus}
          </p>
        )}
        {user.locationBasedStatus && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {user.locationBasedStatus}
          </p>
        )}
      </div>
    </div>
  );
}