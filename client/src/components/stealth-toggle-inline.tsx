import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StealthToggleInlineProps {
  targetUserId: number;
  targetUsername: string;
}

export function StealthToggleInline({ targetUserId, targetUsername }: StealthToggleInlineProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: isHidden = false } = useQuery<boolean>({
    queryKey: ['/api/users/hidden', targetUserId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/hidden/${targetUserId}`);
      const data = await res.json();
      return data.isHidden || false;
    },
  });

  const toggleStealth = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      if (isHidden) {
        await apiRequest('DELETE', `/api/users/hide/${targetUserId}`);
      } else {
        await apiRequest('POST', '/api/users/hide', { hiddenFromId: targetUserId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/hidden', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/hidden'] });
      setIsUpdating(false);
    },
    onError: () => {
      setIsUpdating(false);
    }
  });

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        toggleStealth.mutate();
      }}
      disabled={isUpdating}
      className={`h-6 px-2 text-xs mt-1 ${
        isHidden 
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/40' 
          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20'
      }`}
      title={isHidden ? `You're hidden from @${targetUsername}` : `Hide yourself from @${targetUsername}`}
    >
      {isHidden ? (
        <>
          <EyeOff className="w-3 h-3 mr-1" />
          Hidden
        </>
      ) : (
        <>
          <Eye className="w-3 h-3 mr-1" />
          Stealth
        </>
      )}
    </Button>
  );
}
