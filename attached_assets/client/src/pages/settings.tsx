import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlockedUsersList } from "@/components/blocked-users-list";
import { Settings, Shield, Users, Bell, Eye, MapPin, MessageSquare, Camera, Mail, Loader2, X } from "lucide-react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Early return if no user
  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Fetch notification settings from backend
  const { data: notificationSettings, isLoading: settingsLoading } = useQuery({
    queryKey: [`/api/users/${user.id}/notification-settings`],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not available");
      const response = await apiRequest("GET", `/api/users/${user.id}/notification-settings`);
      return response.json();
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error("User ID not available");
      const response = await apiRequest("PUT", `/api/users/${user.id}/notification-settings`, updates);
      return response.json();
    },
    onSuccess: (updatedSettings) => {
      // Update the cache with the new data immediately
      queryClient.setQueryData([`/api/users/${user.id}/notification-settings`], updatedSettings);
      
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
      
      // Refetch to ensure UI is in sync
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user.id}/notification-settings`] 
      });
    },
  });

  // Individual setting handlers
  const handleNotificationToggle = (setting: string, value: boolean) => {
    updateNotificationsMutation.mutate({ [setting]: value });
  };

  const handlePrivacyToggle = (setting: string, value: boolean | string) => {
    updateNotificationsMutation.mutate({ [setting]: value });
  };

  const handleSavePrivacySettings = () => {
    toast({
      title: "Privacy Settings Updated",
      description: "Your privacy and safety settings have been saved successfully.",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy & Safety
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="blocked" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Blocked Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="privacy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Safety Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Profile Visibility */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Profile Visibility
                    </Label>
                    <Select 
                      value={notificationSettings?.profileVisibility || "public"} 
                      onValueChange={(value) => handlePrivacyToggle("profileVisibility", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                        <SelectItem value="private">Private - Only me</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Control who can view your profile information
                    </p>
                  </div>

                  {/* Location Sharing */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Sharing
                      </Label>
                      <Switch
                        checked={notificationSettings?.locationSharing || true}
                        onCheckedChange={(value) => handlePrivacyToggle("locationSharing", value)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow others to see your current location for meetups and events
                    </p>
                  </div>

                  {/* Photo Permissions */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Photo Permissions
                    </Label>
                    <Select 
                      value={notificationSettings?.photoPermissions || "friends"} 
                      onValueChange={(value) => handlePrivacyToggle("photoPermissions", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="friends">Connections Only</SelectItem>
                        <SelectItem value="none">No One</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Who can view and download your travel photos
                    </p>
                  </div>

                  {/* Message Requests */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Allow Message Requests
                      </Label>
                      <Switch
                        checked={notificationSettings?.messageRequests !== false}
                        onCheckedChange={(value) => handlePrivacyToggle("messageRequests", value)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Let non-connections send you messages
                    </p>
                  </div>

                  {/* Event Invitations */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Event Invitations from Strangers
                      </Label>
                      <Switch
                        checked={notificationSettings?.eventInvitations !== false}
                        onCheckedChange={(value) => handlePrivacyToggle("eventInvitations", value)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow people you're not connected with to invite you to events
                    </p>
                  </div>

                  {/* Connection Requests */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Connection Requests
                      </Label>
                      <Switch
                        checked={notificationSettings?.connectionRequests !== false}
                        onCheckedChange={(value) => handlePrivacyToggle("connectionRequests", value)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow others to send you connection requests
                    </p>
                  </div>

                  <Button 
                    onClick={handleSavePrivacySettings}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white"
                  >
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">General Email Notifications</Label>
                        <Switch
                          checked={notificationSettings?.emailNotifications !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("emailNotifications", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Event Reminders</Label>
                        <Switch
                          checked={notificationSettings?.eventReminders !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("eventReminders", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Connection Alerts</Label>
                        <Switch
                          checked={notificationSettings?.connectionAlerts !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("connectionAlerts", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">New Message Notifications</Label>
                        <Switch
                          checked={notificationSettings?.messageNotifications !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("messageNotifications", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Weekly Travel Digest</Label>
                        <Switch
                          checked={notificationSettings?.weeklyDigest !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("weeklyDigest", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Marketing & Promotional Emails</Label>
                        <Switch
                          checked={notificationSettings?.marketingEmails !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("marketingEmails", value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile & Push Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Mobile & Push Notifications</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Push Notifications</Label>
                        <Switch
                          checked={notificationSettings?.pushNotifications !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("pushNotifications", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Mobile Alerts</Label>
                        <Switch
                          checked={notificationSettings?.mobileAlerts !== false}
                          onCheckedChange={(value) => handlePrivacyToggle("mobileAlerts", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotificationSettings}
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white"
                  >
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocked" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Blocked Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? <BlockedUsersList userId={user.id} /> : <div>Loading...</div>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}