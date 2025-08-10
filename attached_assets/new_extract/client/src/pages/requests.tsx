import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Connection } from "@shared/schema";
import { Check, X, UserPlus, Clock } from "lucide-react";
import { Link } from "wouter";
import ConnectionCelebration from "@/components/connection-celebration";
import { useConnectionCelebration } from "@/hooks/useConnectionCelebration";

interface ConnectionRequest {
  id: number;
  userId: number;
  connectedUserId: number;
  status: string;
  createdAt: string;
  requester: User;
}

export default function Requests() {
  const { toast } = useToast();
  const { triggerCelebration, celebrationData, isVisible, hideCelebration } = useConnectionCelebration();
  
  // Get current user ID from localStorage or context
  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem('travelconnect_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.id;
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  // Fetch pending connection requests received by the current user
  const { data: connectionRequests = [], isLoading } = useQuery<ConnectionRequest[]>({
    queryKey: [`/api/connections/${currentUserId}/requests`],
    enabled: !!currentUserId,
  });

  // Accept connection request mutation
  const acceptMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      // Find the request before making the API call so we have the user info
      const requestToAccept = connectionRequests.find(req => req.id === connectionId);
      
      const result = await apiRequest("PUT", `/api/connections/${connectionId}`, { 
        status: 'accepted' 
      });
      
      // Return both the result and the request info for the onSuccess handler
      return { result, requestInfo: requestToAccept };
    },
    onSuccess: (data, connectionId) => {
      const { requestInfo } = data;
      
      console.log("Connection accepted - data:", data);
      console.log("Request info found:", requestInfo);
      
      if (requestInfo) {
        console.log("Triggering celebration for:", requestInfo.requester.username);
        // Show connection celebration animation
        triggerCelebration({
          type: "connect",
          userInfo: {
            username: requestInfo.requester.username,
            profileImage: requestInfo.requester.profileImage
          }
        });
      } else {
        console.log("No request info found, celebration not triggered");
      }
      
      toast({
        title: "Connection Accepted",
        description: "You are now connected with this user!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}/requests`] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      // Also invalidate connection status queries to update profile pages
      queryClient.invalidateQueries({ queryKey: ["/api/connections/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept",
        description: error.message || "Failed to accept connection request",
        variant: "destructive",
      });
    },
  });

  // Reject connection request mutation
  const rejectMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest("PUT", `/api/connections/${connectionId}`, { 
        status: 'rejected' 
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Rejected",
        description: "Connection request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}/requests`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reject",
        description: error.message || "Failed to reject connection request",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (connectionId: number) => {
    acceptMutation.mutate(connectionId);
  };

  const handleReject = (connectionId: number) => {
    rejectMutation.mutate(connectionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-950 dark:to-orange-950">
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-500/90 to-orange-500/90 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Connection Requests
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Manage your pending connection requests and build your travel network
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-400/20 rounded-full blur-lg"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Connection Requests */}
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <UserPlus className="w-5 h-5" />
              Pending Requests
              {connectionRequests.length > 0 && (
                <Badge className="bg-gradient-to-r from-blue-500 to-orange-600 text-white">{connectionRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending requests</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any connection requests at the moment.</p>
                <Link href="/connect">
                  <Button>Find People to Connect</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.requester.profileImage || undefined} />
                        <AvatarFallback>
                          {request.requester.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {request.requester.username}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.requester.userType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {request.requester.bio}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={rejectMutation.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        disabled={acceptMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Connection Celebration Animation */}
      {celebrationData && (
        <ConnectionCelebration
          isVisible={isVisible}
          onComplete={hideCelebration}
          connectionType={celebrationData.type}
          userInfo={celebrationData.userInfo}
        />
      )}
    </div>
  );
}