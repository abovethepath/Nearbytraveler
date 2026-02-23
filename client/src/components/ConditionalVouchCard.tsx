import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";
import { VouchButton } from "@/components/VouchButton";

interface ConditionalVouchCardProps {
  currentUserId: number;
  targetUserId: number;
  targetUsername?: string;
}

/** Only renders the Vouch card when the current user can vouch or has already vouched. */
export function ConditionalVouchCard({ currentUserId, targetUserId, targetUsername }: ConditionalVouchCardProps) {
  const { data: canVouchData, isLoading } = useQuery<{
    canVouch: boolean;
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

  if (isLoading || (!canVouchData?.canVouch && !canVouchData?.alreadyVouched)) {
    return null;
  }

  return (
    <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 dark:text-purple-200 font-medium">Vouch for {targetUsername}</span>
          </div>
          <VouchButton
            currentUserId={currentUserId}
            targetUserId={targetUserId}
            targetUsername={targetUsername}
          />
        </div>
      </CardContent>
    </Card>
  );
}
