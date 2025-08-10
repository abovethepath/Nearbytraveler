import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone, 
  Clock,
  Settings,
  X,
  MessageCircle
} from "lucide-react";
import { authStorage } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationSettings {
  desktopNotifications: boolean;
  soundNotifications: boolean;
  pushNotifications: boolean;
  doNotDisturb: boolean;
  doNotDisturbUntil?: Date;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  messagePreview: boolean;
  groupChatNotifications: boolean;
  priorityOnly: boolean;
}

interface AdvancedNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedNotifications({ isOpen, onClose }: AdvancedNotificationsProps) {
  const user = authStorage.getUser();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({
    desktopNotifications: true,
    soundNotifications: true,
    pushNotifications: true,
    doNotDisturb: false,
    doNotDisturbUntil: undefined,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    },
    messagePreview: true,
    groupChatNotifications: true,
    priorityOnly: false
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load user's notification settings
  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings(prev => ({ ...prev, ...user.notificationSettings }));
    }
    setNotificationPermission(Notification.permission);
  }, [user]);

  // Save notification settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      return await apiRequest('/api/users/notification-settings', {
        method: 'PUT',
        body: { notificationSettings: newSettings }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    const newQuietHours = { ...settings.quietHours, [key]: value };
    const newSettings = { ...settings, quietHours: newQuietHours };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  // Request desktop notification permission
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      handleSettingChange('desktopNotifications', true);
    }
  };

  // Test notification
  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is how instant message notifications will appear',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    }
  };

  // Set Do Not Disturb for specific duration
  const setDoNotDisturbDuration = (minutes: number) => {
    const until = new Date(Date.now() + minutes * 60 * 1000);
    handleSettingChange('doNotDisturbUntil', until);
    handleSettingChange('doNotDisturb', true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Desktop Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <Label>Desktop Notifications</Label>
              </div>
              <div className="flex items-center gap-2">
                {notificationPermission === 'default' && (
                  <Button size="sm" onClick={requestNotificationPermission}>
                    Enable
                  </Button>
                )}
                {notificationPermission === 'granted' && (
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) => handleSettingChange('desktopNotifications', checked)}
                  />
                )}
                {notificationPermission === 'denied' && (
                  <Badge variant="destructive">Blocked</Badge>
                )}
              </div>
            </div>
            
            {settings.desktopNotifications && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600">Show message preview</Label>
                  <Switch
                    checked={settings.messagePreview}
                    onCheckedChange={(checked) => handleSettingChange('messagePreview', checked)}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={testNotification}>
                  Test Notification
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Label>Sound Notifications</Label>
            </div>
            <Switch
              checked={settings.soundNotifications}
              onCheckedChange={(checked) => handleSettingChange('soundNotifications', checked)}
            />
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <Label>Push Notifications (Mobile)</Label>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
            />
          </div>

          <Separator />

          {/* Do Not Disturb */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4" />
                <Label>Do Not Disturb</Label>
              </div>
              <Switch
                checked={settings.doNotDisturb}
                onCheckedChange={(checked) => handleSettingChange('doNotDisturb', checked)}
              />
            </div>

            {settings.doNotDisturb && (
              <div className="ml-6 space-y-3">
                <div className="text-sm text-gray-600">
                  {settings.doNotDisturbUntil && (
                    <p>Active until: {settings.doNotDisturbUntil.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDoNotDisturbDuration(30)}
                  >
                    30 min
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDoNotDisturbDuration(60)}
                  >
                    1 hour
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDoNotDisturbDuration(480)}
                  >
                    8 hours
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSettingChange('doNotDisturb', false)}
                  >
                    Turn Off
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <Label>Quiet Hours</Label>
              </div>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
              />
            </div>

            {settings.quietHours.enabled && (
              <div className="ml-6 space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-sm">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">End Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  No notifications during these hours
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Group Chat Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <Label>Group Chat Notifications</Label>
            </div>
            <Switch
              checked={settings.groupChatNotifications}
              onCheckedChange={(checked) => handleSettingChange('groupChatNotifications', checked)}
            />
          </div>

          <Separator />

          {/* Priority Only */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <Label>Priority Messages Only</Label>
            </div>
            <Switch
              checked={settings.priorityOnly}
              onCheckedChange={(checked) => handleSettingChange('priorityOnly', checked)}
            />
          </div>

          {settings.priorityOnly && (
            <div className="ml-6 text-sm text-gray-600">
              <p>Only receive notifications from:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Direct messages from connections</li>
                <li>Event organizers</li>
                <li>System notifications</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Notification utility functions
export class NotificationManager {
  private static instance: NotificationManager;
  private audioContext: AudioContext | null = null;
  private notificationSounds: { [key: string]: AudioBuffer } = {};

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Initialize audio context for sound notifications
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.loadNotificationSounds();
  }

  private async loadNotificationSounds() {
    const sounds = {
      message: '/sounds/message.mp3',
      mention: '/sounds/mention.mp3',
      join: '/sounds/join.mp3'
    };

    for (const [name, url] of Object.entries(sounds)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.notificationSounds[name] = audioBuffer;
      } catch (error) {
        console.error(`Failed to load sound ${name}:`, error);
      }
    }
  }

  async showNotification(
    title: string, 
    options: NotificationOptions & { 
      soundType?: 'message' | 'mention' | 'join';
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ) {
    const { soundType = 'message', priority = 'normal', ...notificationOptions } = options;

    // Check if notifications are enabled
    if (Notification.permission !== 'granted') {
      return;
    }

    // Show desktop notification
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...notificationOptions
    });

    // Play sound notification
    if (soundType && this.notificationSounds[soundType]) {
      this.playSound(soundType);
    }

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  private playSound(soundType: string) {
    if (!this.audioContext || !this.notificationSounds[soundType]) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.notificationSounds[soundType];
    source.connect(this.audioContext.destination);
    source.start();
  }

  // Check if user is in quiet hours or DND
  shouldNotify(settings: NotificationSettings): boolean {
    if (settings.doNotDisturb) {
      if (settings.doNotDisturbUntil && new Date() < settings.doNotDisturbUntil) {
        return false;
      }
    }

    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = this.timeStringToMinutes(settings.quietHours.start);
      const endTime = this.timeStringToMinutes(settings.quietHours.end);

      if (startTime <= endTime) {
        return !(currentTime >= startTime && currentTime <= endTime);
      } else {
        return !(currentTime >= startTime || currentTime <= endTime);
      }
    }

    return true;
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}