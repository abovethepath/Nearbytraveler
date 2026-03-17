import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: any) => void>;
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "";

/**
 * Initializes the OneSignal web SDK and registers the player ID for the
 * current user. Rendered once after login — handles SDK init + player reg.
 */
export function OneSignalInit({ userId }: { userId: number | null | undefined }) {
  const registered = useRef(false);

  useEffect(() => {
    if (!ONESIGNAL_APP_ID || !userId || registered.current) return;

    // SDK may have been loaded via <script> in index.html — wait for it
    const init = () => {
      if (!window.OneSignalDeferred) window.OneSignalDeferred = [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false }, // we show our own prompt
            autoRegister: false,
          });

          // Subscribe passively — only if permission was already granted
          const permission = await OneSignal.getNotificationPermission?.();
          if (permission === "granted") {
            await registerSubscription(userId);
          }
        } catch (e) {
          console.warn("[OneSignal] init error:", e);
        }
      });
    };

    init();
    registered.current = true;
  }, [userId]);

  return null;
}

/** Called from the permission modal when user grants permission */
export async function requestOneSignalPermission(userId: number): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) return false;
  try {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return false;
    await OneSignal.showNativePrompt?.();
    const permission = await OneSignal.getNotificationPermission?.();
    if (permission === "granted") {
      await registerSubscription(userId);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[OneSignal] requestPermission error:", e);
    return false;
  }
}

async function registerSubscription(userId: number) {
  try {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return;
    // v16 subscription API
    const subscription = OneSignal.User?.pushSubscription;
    const playerId = subscription?.id || await OneSignal.getUserId?.();
    if (!playerId) return;
    await apiRequest("PUT", "/api/users/onesignal-player", { playerId });
    console.log("[OneSignal] player registered:", playerId);
  } catch (e) {
    console.warn("[OneSignal] registration error:", e);
  }
}
