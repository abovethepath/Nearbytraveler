import React from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ChatPageSkeleton } from "@/components/ui/chat-page-skeleton";

type FullPageSkeletonProps = {
  variant?: "default" | "cards" | "chat";
};

export function FullPageSkeleton({ variant = "default" }: FullPageSkeletonProps) {
  if (variant === "chat") return <ChatPageSkeleton variant="dark" />;
  if (variant === "cards") return <PageSkeleton variant="list" />;
  return <PageSkeleton variant="default" />;
}

export default FullPageSkeleton;
