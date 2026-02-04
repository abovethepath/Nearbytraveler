import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EyeOff, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StealthToggleProps {
  userId: number;
  targetUserId: number;
  targetUsername: string;
}

export function StealthToggle({ userId, targetUserId, targetUsername }: StealthToggleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hiddenStatus, isLoading } = useQuery({
    queryKey: [`/api/users/hidden/${targetUserId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/hidden/${targetUserId}`);
      return response.json();
    },
    enabled: !!userId && !!targetUserId,
  });

  const isHidden = hiddenStatus?.isHidden || false;

  const hideMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/users/hide", {
        hiddenFromId: targetUserId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stealth Mode On",
        description: `@${targetUsername} won't see you in searches or city pages.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/hidden/${targetUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/hidden"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enable stealth mode",
        variant: "destructive"
      });
    }
  });

  const unhideMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/users/hide/${targetUserId}`);
    },
    onSuccess: () => {
      toast({
        title: "Stealth Mode Off",
        description: `@${targetUsername} can now see you again.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/hidden/${targetUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/hidden"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disable stealth mode",
        variant: "destructive"
      });
    }
  });

  const handleToggle = () => {
    if (isHidden) {
      unhideMutation.mutate();
    } else {
      hideMutation.mutate();
    }
  };

  const isPending = hideMutation.isPending || unhideMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50">
        <EyeOff className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isHidden 
        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center gap-3">
        {isHidden ? (
          <EyeOff className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        )}
        <div>
          <Label htmlFor="stealth-toggle" className={`text-sm font-medium ${
            isHidden ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {isHidden ? "Hidden from this person" : "Visible to this person"}
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isHidden 
              ? "They won't see you in searches or city pages" 
              : "Toggle to hide yourself from their searches"}
          </p>
        </div>
      </div>
      <Switch
        id="stealth-toggle"
        checked={isHidden}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-purple-600"
      />
    </div>
  );
}
