import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import {
  CommunityMapping,
  findCommunityForInterest,
  dismissCommunity,
} from "@/lib/interestCommunityMap";
import { IcebreakerPrompt, hasShownIcebreaker } from "@/components/IcebreakerPrompt";

interface CommunityTag {
  id: number;
  name: string;
  displayName: string;
}

/**
 * Hook that manages community join prompts when interests are selected.
 * Returns a check function and state to render the CommunityJoinPrompt dialog.
 */
export function useCommunityJoinPrompt(
  toast?: (opts: { title: string; description?: string; variant?: string }) => void
) {
  const [pending, setPending] = useState<CommunityMapping | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [queue, setQueue] = useState<CommunityMapping[]>([]);
  const [icebreaker, setIcebreaker] = useState<{ id: number; name: string } | null>(null);

  const checkInterest = useCallback((interest: string) => {
    const mapping = findCommunityForInterest(interest);
    if (!mapping) return;
    if (pending) {
      // Already showing a prompt — queue this one (avoid duplicates)
      setQueue((q) =>
        q.some((m) => m.communitySlug === mapping.communitySlug)
          ? q
          : [...q, mapping]
      );
    } else {
      setPending(mapping);
    }
  }, [pending]);

  /** Check multiple interests at once (e.g. on save). */
  const checkInterests = useCallback((interests: string[]) => {
    for (const interest of interests) {
      const mapping = findCommunityForInterest(interest);
      if (mapping) {
        // Show the first one found, queue the rest
        setPending((prev) => {
          if (!prev) return mapping;
          setQueue((q) =>
            q.some((m) => m.communitySlug === mapping.communitySlug)
              ? q
              : [...q, mapping]
          );
          return prev;
        });
      }
    }
  }, []);

  const advanceQueue = useCallback(() => {
    setPending(null);
    setQueue((q) => {
      if (q.length > 0) {
        const [next, ...rest] = q;
        // Use setTimeout to allow dialog close animation
        setTimeout(() => setPending(next), 150);
        return rest;
      }
      return q;
    });
  }, []);

  const handleJoin = useCallback(async () => {
    if (!pending) return;
    setIsJoining(true);
    try {
      // Fetch community list to find the ID for this slug
      const listRes = await apiRequest("GET", "/api/community-tags");
      if (!listRes.ok) throw new Error("Could not load communities");
      const tags: CommunityTag[] = await listRes.json();
      const tag = tags.find((t) => t.name === pending.communitySlug);
      if (!tag) throw new Error("Community not found");

      const joinRes = await apiRequest("POST", `/api/community-tags/${tag.id}/join`);
      if (!joinRes.ok) {
        const data = await joinRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join");
      }
      const result = await joinRes.json();
      if (result.alreadyMember) {
        toast?.({ title: `You're already in ${pending.communityDisplayName}!` });
      } else {
        toast?.({ title: `Joined ${pending.communityDisplayName}!` });
        // Show icebreaker if not already shown for this community
        if (!hasShownIcebreaker("community", tag.id)) {
          setIcebreaker({ id: tag.id, name: pending.communityDisplayName });
        }
      }
      // Dismiss so we don't prompt again
      dismissCommunity(pending.communitySlug);
    } catch (err: any) {
      console.error("Failed to join community:", err);
      toast?.({
        title: "Couldn't join",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
      advanceQueue();
    }
  }, [pending, toast, advanceQueue]);

  const handleSkip = useCallback(() => {
    if (pending) {
      dismissCommunity(pending.communitySlug);
    }
    advanceQueue();
  }, [pending, advanceQueue]);

  return { pending, isJoining, checkInterest, checkInterests, handleJoin, handleSkip, icebreaker, setIcebreaker };
}

/** Render this alongside your page content. It shows the community join dialog when pending !== null. */
export function CommunityJoinPrompt({
  pending,
  isJoining,
  onJoin,
  onSkip,
  icebreaker,
  onIcebreakerClose,
}: {
  pending: CommunityMapping | null;
  isJoining: boolean;
  onJoin: () => void;
  onSkip: () => void;
  icebreaker?: { id: number; name: string } | null;
  onIcebreakerClose?: () => void;
}) {
  return (
    <>
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open) onSkip(); }}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base">
              {pending?.icon} {pending?.communityDisplayName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Join the {pending?.communityDisplayName} community?
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={onJoin}
              disabled={isJoining}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isJoining ? "Joining..." : "Yes"}
            </Button>
            <Button variant="outline" onClick={onSkip} disabled={isJoining} className="flex-1">
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {icebreaker && (
        <IcebreakerPrompt
          type="community"
          id={icebreaker.id}
          name={icebreaker.name}
          onClose={() => onIcebreakerClose?.()}
        />
      )}
    </>
  );
}
