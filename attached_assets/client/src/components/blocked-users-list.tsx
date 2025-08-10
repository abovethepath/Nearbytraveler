import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, Calendar, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BlockedUser {
  id: number;
  blockedUser: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
  reason: string | null;
  createdAt: string;
}

interface BlockedUsersListProps {
  userId: number;
}

export function BlockedUsersList({ userId }: BlockedUsersListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading, error, refetch } = useQuery<BlockedUser[]>({
    queryKey: [`/api/users/${userId}/blocked`],
    queryFn: async () => {
      console.log("Fetching blocked users for userId:", userId);
      const response = await apiRequest("GET", `/api/users/${userId}/blocked`);
      const data = await response.json();
      console.log("Blocked users response:", data);
      return data;
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 500,
    refetchOnMount: true,
    staleTime: 30000,
  });

  console.log("BlockedUsersList debug:", { userId, blockedUsers, isLoading, error });

  if (!userId) {
    return <div className="text-gray-500">User not found</div>;
  }

  const unblockUserMutation = useMutation({
    mutationFn: async (blockedUserId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}/block/${blockedUserId}`);
    },
    onSuccess: (_, blockedUserId) => {
      const unblockedUser = blockedUsers.find(
        (block) => block.blockedUser.id === blockedUserId
      );
      
      toast({
        title: "User Unblocked",
        description: `@${unblockedUser?.blockedUser.username} has been unblocked successfully.`,
        variant: "default"
      });
      
      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      console.error("Unblock user error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unblock user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleUnblock = (blockedUserId: number) => {
    unblockUserMutation.mutate(blockedUserId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
      month: "short",
      day: "numeric"
    });
  };

  if (error) {
    console.error("Error loading blocked users:", error);
    return (
      <div className="text-center py-8 text-red-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <p className="font-medium">Error loading blocked users</p>
        <p className="text-sm mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-500">Loading blocked users...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blocked Users
        </CardTitle>
        <CardDescription>
          Manage users you have blocked ({blockedUsers.length} blocked)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Blocked Users
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You haven't blocked any users yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={block.blockedUser.profileImage || undefined}
                      alt={block.blockedUser.username}
                    />
                    <AvatarFallback>
                      {block.blockedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        @{block.blockedUser.username}
                      </h4>
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {block.blockedUser.name}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Blocked {formatDate(block.createdAt)}
                      </span>
                    </div>
                    
                    {block.reason && (
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        <span className="font-medium">Reason:</span> {block.reason}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(block.blockedUser.id)}
                  disabled={unblockUserMutation.isPending}
                  className="gap-2"
                >
                  <ShieldOff className="h-4 w-4" />
                  {unblockUserMutation.isPending ? "Unblocking..." : "Unblock"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}