import React from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { isNativeIOSApp } from "@/lib/nativeApp";

const STORAGE_PREFERENCE_KEY = "nt_dark_mode_banner_preference"; // "prefer_light"
const STORAGE_LAST_DISMISSED_AT_KEY = "nt_dark_mode_banner_last_dismissed_at"; // epoch ms
const STORAGE_LAST_SHOWN_AT_KEY = "nt_dark_mode_banner_last_shown_at"; // epoch ms

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getNumberFromStorage(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function DarkModeSuggestionBanner() {
  const { resolvedTheme, setTheme } = useTheme();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isNativeIOSApp()) return;
    if (resolvedTheme !== "light") {
      setVisible(false);
      return;
    }

    try {
      const pref = localStorage.getItem(STORAGE_PREFERENCE_KEY);
      if (pref === "prefer_light") {
        setVisible(false);
        return;
      }

      const lastDismissedAt = getNumberFromStorage(STORAGE_LAST_DISMISSED_AT_KEY);
      if (lastDismissedAt && Date.now() - lastDismissedAt < THREE_DAYS_MS) {
        setVisible(false);
        return;
      }

      setVisible(true);
      localStorage.setItem(STORAGE_LAST_SHOWN_AT_KEY, String(Date.now()));
    } catch {
      // If storage fails, default to showing while in light mode.
      setVisible(true);
    }
  }, [resolvedTheme]);

  if (!visible || resolvedTheme !== "light" || isNativeIOSApp()) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[1000] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-white dark:bg-gray-900/75"
      role="region"
      aria-label="Theme suggestion"
      data-testid="banner-dark-mode-suggestion"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-xs sm:text-sm text-gray-800">
            <span className="font-medium">✨ Try Dark Mode for the best experience</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-8 px-3 text-xs sm:text-sm bg-gray-900 hover:bg-black text-white"
              onClick={() => {
                setTheme("dark");
                setVisible(false);
              }}
              data-testid="button-switch-dark-mode-now"
            >
              Switch Now
            </Button>

            <button
              type="button"
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 dark:text-white underline underline-offset-2"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_PREFERENCE_KEY, "prefer_light");
                } catch {}
                setVisible(false);
              }}
              data-testid="link-prefer-light-mode"
            >
              I prefer light mode
            </button>

            <button
              type="button"
              className="ml-1 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-800"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_LAST_DISMISSED_AT_KEY, String(Date.now()));
                } catch {}
                setVisible(false);
              }}
              aria-label="Dismiss"
              title="Dismiss"
              data-testid="button-dismiss-dark-mode-banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

