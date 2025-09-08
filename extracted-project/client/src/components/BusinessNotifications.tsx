import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, User, MapPin, Calendar, Star, CheckCircle, MessageCircle, UserPlus, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface BusinessNotification {
  id: number;
  businessId: number;
  userId: number;
  matchType: 'traveler_interest' | 'local_interest' | 'travel_plan';
  matchedInterests: string[];
  matchedActivities: string[];
  userLocation: string;
  isRead: boolean;
  isProcessed: boolean;
  priority: 'high' | 'medium' | 'low';
  travelStartDate?: string;
  travelEndDate?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
    userType: string;
  } | null;
}

interface BusinessNotificationsProps {
  businessId: number;
}

export default function BusinessNotifications({ businessId }: BusinessNotificationsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: [`/api/business-notifications/${businessId}`, activeTab],
    queryFn: async () => {
      const unreadParam = activeTab === 'unread' ? '?unread=true' : '';
      const response = await apiRequest("GET", `/api/business-notifications/${businessId}${unreadParam}`);
      return response.json();
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PUT", `/api/business-notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-notifications/${businessId}`] });
    }
  });

  // Mark as processed mutation
  const markAsProcessedMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PUT", `/api/business-notifications/${notificationId}/processed`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-notifications/${businessId}`] });
    }
  });

  // Connect with user mutation
  const connectWithUserMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      const response = await apiRequest("POST", "/api/connections", { receiverId });
      return response.json();
    },
    onSuccess: () => {
      // Optional: show success message
      console.log("Connection request sent successfully");
    }
  });

  const handleViewProfile = (userId: number) => {
    console.log('🎯 VIEW PROFILE: Button clicked for user', userId);
    setLocation(`/profile/${userId}`);
  };

  const handleSendMessage = (userId: number, username: string) => {
    console.log('🎯 SEND MESSAGE: Button clicked for user', userId, username);
    // Navigate to messages with pre-filled user
    setLocation(`/messages?user=${userId}&username=${username}`);
  };

  const handleConnect = (userId: number) => {
    console.log('🎯 CONNECT: Button clicked for user', userId);
    connectWithUserMutation.mutate(userId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'traveler_interest': return 'Traveler Interests';
      case 'local_interest': return 'Local Interests';
      case 'travel_plan': return 'Travel Plan';
      default: return matchType;
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'traveler_interest': return <MapPin className="h-4 w-4" />;
      case 'local_interest': return <User className="h-4 w-4" />;
      case 'travel_plan': return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell className="h-5 w-5" />
            Interest Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Bell className="h-5 w-5" />
          Interest Notifications
          {notifications.length > 0 && (
            <Badge variant="secondary">{notifications.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">Recent</TabsTrigger>
            <TabsTrigger value="all">Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-900 dark:text-white">No {activeTab === 'unread' ? 'recent ' : ''}notifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification: BusinessNotification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getMatchTypeIcon(notification.matchType)}
                        <span className="font-medium">{getMatchTypeLabel(notification.matchType)}</span>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {notification.user && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                          {notification.user.profileImage ? (
                            <img 
                              src={notification.user.profileImage} 
                              alt={notification.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            notification.user.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{notification.user.name}</div>
                          <div className="text-sm text-gray-600">@{notification.user.username}</div>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {notification.user.userType === 'current_traveler' ? 'Traveler' : 'Local'}
                        </Badge>
                      </div>
                    )}

                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{notification.userLocation}</span>
                      </div>

                      {notification.travelStartDate && notification.travelEndDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {format(new Date(notification.travelStartDate), 'MMM d')} - {format(new Date(notification.travelEndDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}

                      {notification.matchedInterests.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Matching Interests:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {notification.matchedInterests.map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {notification.matchedActivities.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Matching Activities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {notification.matchedActivities.map((activity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t pt-3 mt-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {notification.user && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleConnect(notification.user!.id)}
                              disabled={connectWithUserMutation.isPending}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                              <UserPlus className="h-4 w-4" />
                              Connect
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendMessage(notification.user!.id, notification.user!.username)}
                              className="flex items-center gap-2"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(notification.user!.id)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Profile
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Status Actions */}
                      <div className="flex justify-end gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="text-gray-600"
                          >
                            Mark as Read
                          </Button>
                        )}
                        {!notification.isProcessed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsProcessedMutation.mutate(notification.id)}
                            disabled={markAsProcessedMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Processed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}