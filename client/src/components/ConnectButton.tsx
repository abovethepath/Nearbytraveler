import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { openPrivateChatWithUser } from "@/lib/iosPrivateChat";
import { ChevronDown, UserCheck, UserMinus } from "lucide-react";

interface ConnectButtonProps {
  currentUserId: number;
  targetUserId: number;
  targetUsername?: string;
  targetName?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  appearance?: "default" | "ghost";
}

export default function ConnectButton({
  currentUserId,
  targetUserId,
  targetUsername,
  targetName,
  className = "",
  size = "default",
  appearance = "default",
}: ConnectButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: connectionStatus = { status: 'none' } } = useQuery<{
    status: 'pending' | 'accepted' | 'rejected' | 'none';
    requesterId?: number;
    receiverId?: number;
    senderId?: number;
    connectionId?: number;
  }>({
    queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`],
    enabled: !!currentUserId && !!targetUserId,
    staleTime: 0,
    gcTime: 0,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !targetUserId) throw new Error("Authentication required");
      const requestData = { requesterId: currentUserId, targetUserId, status: 'pending' };
      const response = await apiRequest('POST', '/api/connections', requestData);
      if (!response.ok) {
        let errorMessage = 'Failed to send connection request';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
          else if (errorData.message) errorMessage = errorData.message;
        } catch {
          if (response.status === 429) errorMessage = 'Please wait a moment before sending another request';
          else if (response.status === 409) errorMessage = 'Connection request already exists';
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}/requests/outgoing`] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key0 = Array.isArray(query.queryKey) ? query.queryKey[0] : undefined;
          return typeof key0 === 'string' && (
            key0.includes(`/api/users/${currentUserId}/profile-bundle`) ||
            key0.includes(`/api/users/${targetUserId}/profile-bundle`)
          );
        },
      });
      toast({ title: "Connection request sent", description: `Your connection request has been sent to ${targetName || targetUsername}.` });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send connection request. Please try again.";
      const isPrivacyError = errorMessage.includes("privacy settings");
      const isRateLimitError = errorMessage.includes("wait") || errorMessage.includes("Too many");
      toast({
        title: isPrivacyError ? "Privacy Restriction" : isRateLimitError ? "Please Wait" : "Connection Failed",
        description: isPrivacyError ? "This user's privacy settings prevent connection requests from new users." : errorMessage,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/connections/${targetUserId}`, undefined);
      if (!response.ok) throw new Error('Failed to remove connection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}`] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key0 = Array.isArray(query.queryKey) ? query.queryKey[0] : undefined;
          return typeof key0 === 'string' && (
            key0.includes(`/api/users/${currentUserId}/profile-bundle`) ||
            key0.includes(`/api/users/${targetUserId}/profile-bundle`)
          );
        },
      });
      toast({ title: "Disconnected", description: `You are no longer connected with ${targetName || targetUsername}.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove connection. Please try again.", variant: "destructive" });
    },
  });

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || !targetUserId) {
      toast({ title: "Error", description: "Authentication required", variant: "destructive" });
      return;
    }
    if (currentUserId === targetUserId) {
      toast({ title: "Cannot Connect to Yourself", description: "You cannot send a connection request to yourself.", variant: "destructive" });
      return;
    }
    if (connectionStatus?.status === 'accepted') return;
    if (connectionStatus?.status === 'pending') {
      const isIncoming = connectionStatus.senderId === targetUserId || connectionStatus.requesterId === targetUserId;
      if (isIncoming && connectionStatus.connectionId) {
        try {
          const response = await apiRequest('PUT', `/api/connections/${connectionStatus.connectionId}`, { status: 'accepted' });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/profile-bundle`] });
            queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}/requests`] });
            toast({ title: "Connection Accepted", description: `You are now connected with ${targetName || targetUsername}.` });
          }
        } catch {
          toast({ title: "Accept Failed", description: "Failed to accept connection request.", variant: "destructive" });
        }
        return;
      }
      toast({ title: "Request Already Sent", description: `You've already sent a connection request to ${targetName || targetUsername}.` });
      return;
    }
    connectMutation.mutate();
  };

  const getButtonState = () => {
    const isGhost = appearance === "ghost";
    if (connectionStatus?.status === 'accepted') {
      return {
        text: '✓ Connected',
        disabled: false,
        variant: 'default' as const,
        className: 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] cursor-pointer hover:bg-[#D1FAE5]'
      };
    }
    if (connectionStatus?.status === 'pending') {
      const isIncoming = connectionStatus.senderId === targetUserId || connectionStatus.requesterId === targetUserId;
      if (isIncoming) {
        return { text: 'Accept Request', disabled: false, variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm' };
      }
      return { text: 'Request Sent', disabled: true, variant: 'default' as const, className: 'bg-orange-600/50 text-white border-0 cursor-not-allowed' };
    }
    return {
      text: connectMutation.isPending ? 'Connecting...' : 'Connect',
      disabled: connectMutation.isPending,
      variant: 'default' as const,
      className: isGhost
        ? 'bg-[#e8eeff] hover:bg-[#dfe7ff] text-blue-700 border border-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-0'
        : 'bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm'
    };
  };

  const buttonState = getButtonState();
  if (!buttonState) return null;

  if (connectionStatus?.status === 'accepted') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={buttonState.variant}
            size={size}
            className={`${buttonState.className} ${className} flex items-center gap-1`}
            data-testid={`button-connect-${targetUserId}`}
            onClick={(e) => e.stopPropagation()}
          >
            {buttonState.text}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/profile/${targetUserId}`);
            }}
          >
            <UserCheck className="w-4 h-4" />
            View Connection
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={(e) => {
              e.stopPropagation();
              disconnectMutation.mutate();
            }}
            disabled={disconnectMutation.isPending}
          >
            <UserMinus className="w-4 h-4" />
            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={buttonState.disabled}
      variant={buttonState.variant}
      size={size}
      className={`${buttonState.className} ${className}`}
      data-testid={`button-connect-${targetUserId}`}
    >
      {buttonState.text}
    </Button>
  );
}
