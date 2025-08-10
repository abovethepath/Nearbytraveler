import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, ShieldOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BlockUserButtonProps {
  userId: number;
  targetUserId: number;
  targetUsername: string;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
}

export function BlockUserButton({ 
  userId, 
  targetUserId, 
  targetUsername, 
  variant = "destructive",
  size = "default" 
}: BlockUserButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is already blocked
  const { data: blockStatus, isLoading: checkingBlockStatus } = useQuery({
    queryKey: [`/api/users/${userId}/blocked/${targetUserId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/blocked/${targetUserId}`);
      return response.json();
    },
    enabled: !!userId && !!targetUserId,
  });

  const isBlocked = blockStatus?.isBlocked || false;

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${userId}/block`, {
        blockedId: targetUserId,
        reason: reason.trim() || undefined
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Blocked",
        description: `@${targetUsername} has been blocked successfully.`,
        variant: "default"
      });
      setShowDialog(false);
      setReason("");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked/${targetUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      console.error("Block user error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to block user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/users/${userId}/block/${targetUserId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Unblocked",
        description: `@${targetUsername} has been unblocked successfully.`,
        variant: "default"
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked/${targetUserId}`] });
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

  const handleBlock = () => {
    blockUserMutation.mutate();
  };

  const handleUnblock = () => {
    unblockUserMutation.mutate();
  };

  if (checkingBlockStatus) {
    return (
      <Button variant={variant} size={size} disabled className="gap-2">
        <Shield className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={isBlocked ? handleUnblock : () => setShowDialog(true)}
        className="gap-2"
        disabled={blockUserMutation.isPending || unblockUserMutation.isPending}
      >
        {isBlocked ? (
          <>
            <ShieldOff className="h-4 w-4" />
            {unblockUserMutation.isPending ? "Unblocking..." : "Unblock User"}
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            {blockUserMutation.isPending ? "Blocking..." : "Block User"}
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Block @{targetUsername}
            </DialogTitle>
            <DialogDescription className="text-left">
              Blocking this user will:
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Remove any existing connections between you</li>
                <li>Prevent them from sending you messages</li>
                <li>Hide their content from your feeds</li>
                <li>Prevent them from viewing your profile</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for blocking (optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Please describe why you're blocking this user..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {reason.length}/500 characters
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
              disabled={blockUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockUserMutation.isPending}
              className="flex-1"
            >
              {blockUserMutation.isPending ? "Blocking..." : "Block User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}