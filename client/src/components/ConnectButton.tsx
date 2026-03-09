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
      return { 
        text: 'Connected', 
        disabled: false, 
        variant: 'default' as const, 
        className: isGhost
          ? 'bg-[#e8eeff] hover:bg-[#dfe7ff] text-blue-700 border border-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-0'
          : 'bg-blue-600 hover:bg-blue-700 text-white border-0'
      };
    }
    if (connectionStatus?.status === 'pending') {
      return { 
        text: 'Request Sent', 
        disabled: false, 
        variant: 'default' as const, 
        className: isGhost
          ? 'bg-[#fff7e6] hover:bg-[#ffefd1] text-amber-800 border border-amber-200 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-white dark:border-0'
          : 'bg-yellow-500 hover:bg-yellow-600 text-white border-0'
      };
    }
    // This is the key fix - only THIS button's isPending state affects THIS button
    return { 
      text: connectMutation.isPending ? 'Connecting...' : 'Connect', 
      disabled: connectMutation.isPending, 
      variant: 'default' as const, 
      className: isGhost
        ? 'bg-[#e8eeff] hover:bg-[#dfe7ff] text-blue-700 border border-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-0'
        : 'bg-blue-600 hover:bg-blue-700 text-white border-0'
    };
  };

  const buttonState = getButtonState();

  if (connectionStatus?.status === 'accepted') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white shrink-0 ${className}`}>
        <Check className="w-3 h-3" />
        Connected
      </span>
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