/**
 * iOS-only: Open or create a private chatroom between current user and target user.
 * Replaces the broken DM system on iOS (session cookies don't work in WKWebView).
 * Uses the same chatroom code that already works on iOS.
 *
 * @returns true if handled (iOS path), false if caller should use DM navigation
 */
import { isNativeIOSApp } from "./nativeApp";
import { apiRequest, invalidateUserCache } from "./queryClient";
import { authStorage } from "./auth";

export async function openPrivateChatWithUser(
  targetUserId: number,
  setLocation: (path: string) => void,
  options?: {
    currentUserId?: number;
    toast?: { (opts: { title: string; variant?: "destructive" }): void };
  }
): Promise<boolean> {
  if (!isNativeIOSApp()) return false;

  const currentUserId = options?.currentUserId ?? authStorage.getUser()?.id;
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    options?.toast?.({ title: "Could not open chat", variant: "destructive" });
    return true; // Handled (showed error)
  }

  // Ensure user is in localStorage so apiRequest sends x-user-id; invalidate cache for fresh read
  const user = authStorage.getUser();
  if (user && user.id === currentUserId) {
    authStorage.setUser(user);
  }
  invalidateUserCache();

  try {
    const res = await apiRequest("POST", "/api/chatrooms/private/dm", {
      targetUserId,
    });
    const data = await res.json();
    if (data?.chatroomId) {
      setLocation(`/chatroom/${data.chatroomId}`);
      return true;
    }
    options?.toast?.({ title: "Could not open chat", variant: "destructive" });
    return true;
  } catch {
    options?.toast?.({ title: "Could not open chat", variant: "destructive" });
    return true;
  }
}
