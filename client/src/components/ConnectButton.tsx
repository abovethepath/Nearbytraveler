import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface ConnectButtonProps {
  currentUserId: number;
  targetUserId: number;
  targetUsername?: string;
  targetName?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ConnectButton({
  currentUserId,
  targetUserId,
  targetUsername,
  targetName,
  className = "",
  size = "default"
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
      
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUserId}/${targetUserId}`] });
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to ${targetName || targetUsername}.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send connection request. Please try again.";
      const isPrivacyError = errorMessage.includes("privacy settings");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Connection Failed",
        description: isPrivacyError 
          ? "This user's privacy settings prevent connection requests from new users."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!currentUserId || !targetUserId) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    if (connectionStatus?.status === 'accepted') {
      // Already connected - navigate to messages
      setLocation(`/messages?userId=${targetUserId}`);
      return;
    }
    
    if (connectionStatus?.status === 'pending') {
      // Connection request already sent - show message
      toast({
        title: "Connection request already sent",
        description: "Your connection request is pending approval.",
      });
      return;
    }
    
    // Send new connection request using individual mutation
    connectMutation.mutate();
  };

  // Get button state based on connection status and THIS button's loading state
  const getButtonState = () => {
    if (connectionStatus?.status === 'accepted') {
      return { 
        text: 'Connected', 
        disabled: false, 
        variant: 'default' as const, 
        className: 'bg-green-600 hover:bg-green-700 text-white border-0' 
      };
    }
    if (connectionStatus?.status === 'pending') {
      return { 
        text: 'Request Sent', 
        disabled: true, 
        variant: 'default' as const, 
        className: 'bg-gray-600 hover:bg-gray-700 text-white border-0' 
      };
    }
    // This is the key fix - only THIS button's isPending state affects THIS button
    return { 
      text: connectMutation.isPending ? 'Connecting...' : 'Connect', 
      disabled: connectMutation.isPending, 
      variant: 'default' as const, 
      className: 'bg-blue-600 hover:bg-blue-700 text-white border-0' 
    };
  };

  const buttonState = getButtonState();

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