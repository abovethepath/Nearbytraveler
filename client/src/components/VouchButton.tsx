import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield, Check, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface VouchButtonProps {
  currentUserId: number;
  targetUserId: number;
  targetUsername?: string;
  /** When true, render nothing when user cannot vouch and has not already vouched */
  hideWhenDisabled?: boolean;
}

export function VouchButton({ currentUserId, targetUserId, targetUsername, hideWhenDisabled }: VouchButtonProps) {
  const { toast } = useToast();
  const [showVouchDialog, setShowVouchDialog] = useState(false);
  const [vouchMessage, setVouchMessage] = useState("");

  const { data: canVouchData, isLoading } = useQuery<{
    canVouch: boolean;
    reason?: string;
    alreadyVouched?: boolean;
  }>({
    queryKey: [`/api/users/${currentUserId}/can-vouch`, targetUserId],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${currentUserId}/can-vouch?targetUserId=${targetUserId}`
      );
      if (!response.ok) throw new Error("Failed to check vouch eligibility");
      return response.json();
    },
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
  });

  const vouchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vouches", {
        voucherUserId: currentUserId,
        vouchedUserId: targetUserId,
        vouchCategory: "general",
        vouchMessage: vouchMessage.trim() || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${currentUserId}/can-vouch`, targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/vouches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}`] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && typeof key[0] === 'string' && key[0].includes(`/api/users/${targetUserId}/profile-bundle`);
        }
      });
      
      setShowVouchDialog(false);
      setVouchMessage("");
      toast({
        title: "Vouched!",
        description: `You've vouched for ${targetUsername || "this user"}. They can now vouch for others!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot vouch",
        description: error.message || "Failed to vouch for this user",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Button
        disabled
        className="bg-blue-500 dark:bg-purple-400 text-white border-0 px-6 py-2 rounded-lg shadow-md opacity-60 cursor-not-allowed"
        data-testid="button-vouch-loading"
      >
        <Shield className="w-4 h-4 mr-2" />
        Vouch
      </Button>
    );
  }

  if (canVouchData?.alreadyVouched) {
    return (
      <Button
        disabled
        className="bg-green-600 text-white border-0 px-6 py-2 rounded-lg shadow-md opacity-70 cursor-not-allowed"
        data-testid="button-vouched"
      >
        <Check className="w-4 h-4 mr-2" />
        Vouched
      </Button>
    );
  }

  if (canVouchData?.canVouch) {
    return (
      <>
        <Button
          onClick={() => setShowVouchDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white border-0 px-6 py-2 rounded-lg shadow-md transition-all"
          data-testid="button-vouch"
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Vouch
        </Button>

        <Dialog open={showVouchDialog} onOpenChange={setShowVouchDialog}>
          <DialogContent className="bg-white dark:bg-gray-900 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Shield className="w-5 h-5 text-purple-600" />
                Vouch for {targetUsername}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Only vouch for people you have actually met and trust. Your vouch helps build credibility in our community.
                </p>
              </div>
              <Textarea
                placeholder="Why are you vouching for this person? (optional)"
                value={vouchMessage}
                onChange={(e) => setVouchMessage(e.target.value)}
                rows={3}
                data-testid="textarea-vouch-message"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => vouchMutation.mutate()}
                  disabled={vouchMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                  data-testid="button-confirm-vouch"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {vouchMutation.isPending ? "Vouching..." : "Confirm Vouch"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVouchDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (hideWhenDisabled) return null;

  return (
    <Button
      disabled
      className="bg-gray-400 text-white border-0 px-6 py-2 rounded-lg shadow-md opacity-60 cursor-not-allowed"
      title="You need at least 1 vouch before you can vouch for others"
      data-testid="button-vouch-disabled"
    >
      <Shield className="w-4 h-4 mr-2" />
      Vouch
    </Button>
  );
}
