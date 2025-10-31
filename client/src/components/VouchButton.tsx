import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface VouchButtonProps {
  currentUserId: number;
  targetUserId: number;
  targetUsername?: string;
}

export function VouchButton({ currentUserId, targetUserId, targetUsername }: VouchButtonProps) {
  const { toast } = useToast();

  // Query to check if current user can vouch
  const { data: canVouchData } = useQuery<{
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

  // Mutation to create vouch
  const vouchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vouches", {
        voucherUserId: currentUserId,
        vouchedUserId: targetUserId,
        vouchCategory: "general",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${currentUserId}/can-vouch`, targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/vouches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}`] });
      
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

  // Don't show button if user can't vouch
  if (!canVouchData?.canVouch) {
    return null;
  }

  // Show "Vouched" if already vouched
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

  return (
    <Button
      onClick={() => vouchMutation.mutate()}
      disabled={vouchMutation.isPending}
      className="bg-purple-600 hover:bg-purple-700 text-white border-0 px-6 py-2 rounded-lg shadow-md transition-all"
      data-testid="button-vouch"
    >
      <ThumbsUp className="w-4 h-4 mr-2" />
      {vouchMutation.isPending ? "Vouching..." : "Vouch"}
    </Button>
  );
}
