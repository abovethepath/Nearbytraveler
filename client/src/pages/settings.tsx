import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlockedUsersList } from "@/components/blocked-users-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, Shield, Users, Bell, Eye, MapPin, MessageSquare, Camera, Mail, Loader2, X, User, Sun, Moon, Monitor, Smartphone, FileText, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Early return if no user
  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiRequest("DELETE", "/api/users/me");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      setShowDeleteConfirm(false);
      logout(isNativeIOSApp() ? "/home" : "/signin");
    } catch (err: any) {
      toast({
        title: "Could not delete account",
        description: err?.message || "Something went wrong. Try again or contact support.",
        variant: "destructive",
      });
      setDeleting(false);
    }
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
              onClick={() => setLocation(isNativeIOSApp() ? "/home" : "/")}
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
                  
                  {/* Appearance / Theme */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Appearance
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className={theme === "light" ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className={theme === "dark" ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className={theme === "system" ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        System
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose light mode, dark mode, or follow your device settings
                    </p>
                  </div>

                  {/* Display Name Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Display Name Settings
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/privacy-settings")}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        data-testid="button-privacy-settings"
                      >
                        Configure
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Control how your name appears to others (username, first name, or full name)
                    </p>
                  </div>

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

                  {/* Read Receipts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Read Receipts
                      </Label>
                      <Switch
                        checked={notificationSettings?.showReadReceipts !== false}
                        onCheckedChange={(value) => handlePrivacyToggle("showReadReceipts", value)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show when you've read DM messages. If turned off, others won't see blue checkmarks on messages they send you, and you won't see theirs.
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

                  {/* Support Us */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-medium text-black dark:text-white">Support Us 💛</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Subscribe or donate to earn a profile badge</p>
                      </div>
                      <Link href="/donate">
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" style={{ transition: "none" }}>
                          Support
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Legal - Privacy Policy & Terms (for App Store / in-app access) */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Legal
                    </Label>
                    <div className="flex flex-wrap gap-4">
                      <Link href="/privacy" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Privacy Policy
                      </Link>
                      <Link href="/terms" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Terms of Service
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Review how we use your data and our terms of use
                    </p>
                  </div>

                  {/* Delete Account (in-app for App Store compliance) */}
                  <div className="space-y-3 pt-4 border-t border-red-200 dark:border-red-900/50">
                    <Label className="text-base font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permanently delete your account and data. This cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      data-testid="button-delete-account"
                    >
                      Delete my account
                    </Button>
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
                    Email Notifications
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Control which emails you receive from Nearby Traveler
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">

                  {/* Master toggle */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">All Email Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Master switch — turns off all emails at once</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings?.emailNotifications !== false}
                      onCheckedChange={(val) => handlePrivacyToggle("emailNotifications", val)}
                    />
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Messages</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">New Messages</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email when someone messages you (10 min inactivity)</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.messageNotifications !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("messageNotifications", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Connections</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Connection Requests</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">When someone sends you a connection request</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.connectionAlerts !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("connectionAlerts", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Connection Accepted</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">When someone accepts your connection request</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.connectionAcceptedAlerts !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("connectionAcceptedAlerts", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Events</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">24-Hour Reminder</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email the day before events you're attending</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.eventReminder24h !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("eventReminder24h", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">1-Hour Reminder</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email one hour before events you're attending</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.eventReminder1h !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("eventReminder1h", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Meetups</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Meetup Activity</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">When someone joins a meetup you're organizing</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.meetupActivityAlerts !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("meetupActivityAlerts", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Travel</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Trip Reminders</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Reminders as your trip dates approach</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.tripApproachingReminders !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("tripApproachingReminders", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">City Activity Alerts</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Nearby travelers and local activity in your city</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.cityActivityAlerts !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("cityActivityAlerts", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0 py-2">Digest & Updates</p>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly Travel Digest</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">A weekly roundup of activity in your cities</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.weeklyDigest !== false}
                        onCheckedChange={(val) => handlePrivacyToggle("weeklyDigest", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Marketing & Promotions</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Special offers and platform announcements</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings?.marketingEmails === true}
                        onCheckedChange={(val) => handlePrivacyToggle("marketingEmails", val)}
                        disabled={notificationSettings?.emailNotifications === false}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSaveNotificationSettings}
                      className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white"
                    >
                      Save Notification Settings
                    </Button>
                  </div>
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
                  {user ? (
                    <BlockedUsersList userId={user.id} />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-52" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your data (profile, photos, connections, messages). This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}