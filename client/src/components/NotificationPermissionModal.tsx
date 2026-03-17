import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { requestOneSignalPermission } from "./OneSignalInit";

const STORAGE_KEY = "nt_notif_prompt";
const DISMISS_DAYS = 7;
const LOGIN_THRESHOLD = 3;

interface PromptState {
  dismissed?: boolean;
  dismissedAt?: number;
  neverAsk?: boolean;
  prompted?: boolean;
}

/** Returns true if we should show the permission modal now */
function shouldShowPrompt(userId: number): boolean {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted" || Notification.permission === "denied") return false;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    const state: PromptState = raw ? JSON.parse(raw) : {};
    if (state.neverAsk) return false;
    if (state.dismissed && state.dismissedAt) {
      const daysSince = (Date.now() - state.dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return false;
    }
    // Check login count
    const nudgesRaw = localStorage.getItem(`nt_nudges_${userId}`);
    const nudges = nudgesRaw ? JSON.parse(nudgesRaw) : { logins: 0 };
    return (nudges.logins || 0) >= LOGIN_THRESHOLD;
  } catch {
    return false;
  }
}

function markDismissed(userId: number, never = false) {
  try {
    const key = `${STORAGE_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    const state: PromptState = raw ? JSON.parse(raw) : {};
    state.dismissed = true;
    state.dismissedAt = Date.now();
    if (never) state.neverAsk = true;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

interface Props {
  userId: number | null | undefined;
  /** Also show after first connection: pass true from connections page */
  forceShow?: boolean;
}

export function NotificationPermissionModal({ userId, forceShow }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    // Small delay so it doesn't pop up instantly on page load
    const t = setTimeout(() => {
      if (forceShow || shouldShowPrompt(userId)) {
        setOpen(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [userId, forceShow]);

  if (!userId) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestOneSignalPermission(userId);
      if (granted) {
        markDismissed(userId, true); // don't ask again — they said yes
      } else {
        markDismissed(userId);
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleLater = () => {
    markDismissed(userId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleLater(); }}>
      <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 max-w-sm mx-auto rounded-2xl p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <Bell className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Stay in the loop
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Enable notifications to know when someone wants to meet up, messages you, or arrives in your city.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-1">
            <Button
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-black dark:bg-orange-500 hover:bg-gray-800 dark:hover:bg-orange-600 text-white font-medium"
            >
              <Bell className="w-4 h-4 mr-2" />
              {loading ? "Enabling…" : "Turn On Notifications"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleLater}
              className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
