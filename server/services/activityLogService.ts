import { db } from "../db";
import { activityLog } from "../../shared/schema";

type LogEntry = {
  userId: number;
  action: string;
  category: "connections" | "events" | "messages" | "all";
  title: string;
  description?: string;
  targetUserId?: number;
  targetUsername?: string;
  targetProfileImage?: string;
  relatedId?: number;
  relatedType?: string;
  relatedTitle?: string;
  linkUrl?: string;
};

export async function writeActivityLog(entry: LogEntry): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId: entry.userId,
      action: entry.action,
      category: entry.category,
      title: entry.title,
      description: entry.description || null,
      targetUserId: entry.targetUserId || null,
      targetUsername: entry.targetUsername || null,
      targetProfileImage: entry.targetProfileImage || null,
      relatedId: entry.relatedId || null,
      relatedType: entry.relatedType || null,
      relatedTitle: entry.relatedTitle || null,
      linkUrl: entry.linkUrl || null,
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
