import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { openPrivateChatWithUser } from "@/lib/iosPrivateChat";
import { Check } from "lucide-react";

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

  // Fetch connection status between current user and target user
  const { data: connectionStatus = { status: 'none' } } = useQuery<{
    status: 'pending' | 'accepted' | 'rejected' | 'none';
    requesterId?: number;
    receiverId?: number;
    senderId?: number;
  }>({
    queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`],
    enabled: !!currentUserId && !!targetUserId,
    staleTime: 0,
    gcTime: 0,
  });

  // Individual mutation per button/target user - this prevents the blinking issue
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !targetUserId) throw new Error("Authentication required");
      
      const requestData = {
        requesterId: currentUserId,
        targetUserId: targetUserId,
        status: 'pending'
      };
      
      console.log('🔵 CONNECT: Sending request data:', requestData);
      
      const response = await apiRequest('POST', '/api/connections', requestData);
      
      if (!response.ok) {
        // Parse error response for a better error message
        let errorMessage = 'Failed to send connection request';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use status-based messages if JSON parsing fails
          if (response.status === 429) {
            errorMessage = 'Please wait a moment before sending another request';
          } else if (response.status === 409) {
            errorMessage = 'Connection request already exists';
          }
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
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to ${targetName || targetUsername}.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send connection request. Please try again.";
      const isPrivacyError = errorMessage.includes("privacy settings");
      const isRateLimitError = errorMessage.includes("wait") || errorMessage.includes("Too many");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : isRateLimitError ? "Please Wait" : "Connection Failed",
        description: isPrivacyError 
          ? "This user's privacy settings prevent connection requests from new users."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleConnect = async (e: React.MouseEvent) => {
    // Stop event propagation to prevent card click from navigating
    e.stopPropagation();
    
    if (!currentUserId || !targetUserId) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    // Prevent self-connection
    if (currentUserId === targetUserId) {
      toast({
        title: "Cannot Connect to Yourself",
        description: "You cannot send a connection request to yourself.",
        variant: "destructive",
      });
      return;
    }

    if (connectionStatus?.status === 'accepted') {
      // Already connected - on iOS use private chatroom (DM broken); on web use messages
      const handled = await openPrivateChatWithUser(targetUserId, setLocation, {
        currentUserId,
        toast,
      });
      if (!handled) {
        setLocation(`/messages?userId=${targetUserId}`);
      }
      return;
    }
    
    if (connectionStatus?.status === 'pending') {
      const isIncoming = connectionStatus.senderId === targetUserId || connectionStatus.requesterId === targetUserId;
      
      if (isIncoming) {
        // Handle accept request
        try {
          const response = await apiRequest('POST', `/api/connections/accept/${targetUserId}`, {});
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/profile-bundle`] });
            toast({
              title: "Connection Accepted",
              description: `You are now connected with ${targetName || targetUsername}.`,
            });
          }
        } catch (err) {
          toast({
            title: "Accept Failed",
            description: "Failed to accept connection request.",
            variant: "destructive",
          });
        }
        return;
      }

      // Request already sent - show toast
      toast({
        title: "Request Already Sent",
        description: `You've already sent a connection request to ${targetName || targetUsername}.`,
      });
      return;
    }
    
    // Send connection request immediately
    connectMutation.mutate();
  };

  // Get button state based on connection status and THIS button's loading state
  const getButtonState = () => {
    const isGhost = appearance === "ghost";
    if (connectionStatus?.status === 'accepted') {
      return null; // Hide the button if connected
    }
    if (connectionStatus?.status === 'pending') {
      const isIncoming = connectionStatus.senderId === targetUserId || connectionStatus.requesterId === targetUserId;
      
      if (isIncoming) {
        return {
          text: 'Accept Request',
          disabled: false,
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm'
        };
      }

      return { 
        text: 'Request Sent', 
        disabled: true, 
        variant: 'default' as const, 
        className: 'bg-orange-600/50 text-white border-0 cursor-not-allowed'
      };
    }
    // This is the key fix - only THIS button's isPending state affects THIS button
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