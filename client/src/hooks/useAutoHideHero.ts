import { useState, useEffect, useCallback, useRef } from "react";
import { getApiBaseUrl } from "@/lib/queryClient";

const LEGACY_KEYS: Record<string, string> = {
  homepage: 'hideHeroSection',
  events: 'hideEventsHeroSection',
  matchInCity: 'hideMatchInCityHero',
  planTrip: 'hidePlanTripHero',
  discover: 'hideDiscoverHero',
  city: 'hideCityHero',
};

function checkHidden(hideKey: string, pageKey: string): boolean {
  if (localStorage.getItem(hideKey) === 'true') return true;
  const legacy = LEGACY_KEYS[pageKey];
  if (legacy && legacy !== hideKey && localStorage.getItem(legacy) === 'true') {
    localStorage.setItem(hideKey, 'true');
    localStorage.removeItem(legacy);
    return true;
  }
  return false;
}

async function fetchServerDismissed(pageKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/ui/hero-dismissed`, { credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.dismissed) && data.dismissed.includes(pageKey);
  } catch {
    return false;
  }
}

function syncDismissalToServer(pageKey: string) {
  fetch(`${getApiBaseUrl()}/api/ui/hero-dismiss`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageKey }),
  }).catch(() => {});
}

export function useAutoHideHero(pageKey: string, threshold = 5, defaultVisible = true) {
  const visitKey = `${pageKey}_visits`;
  const hideKey = `hide${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)}HeroSection`;
  const manualShowKey = `${pageKey}_hero_manual_show`;
  const serverSyncedRef = useRef(false);

  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const manuallyHidden = checkHidden(hideKey, pageKey);
    if (manuallyHidden) return false;

    const manuallyShown = localStorage.getItem(manualShowKey) === 'true';
    if (manuallyShown) return true;

    const visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    if (visits >= threshold) return false;

    return defaultVisible;
  });

  const [autoHidden, setAutoHidden] = useState<boolean>(() => {
    const manuallyHidden = checkHidden(hideKey, pageKey);
    if (manuallyHidden) return false;
    const visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const manuallyShown = localStorage.getItem(manualShowKey) === 'true';
    return visits >= threshold && !manuallyShown;
  });

  // Increment visit counter on mount
  useEffect(() => {
    const current = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const next = current + 1;
    localStorage.setItem(visitKey, String(next));

    // When we reach the threshold, sync the dismissal to the server (once per device)
    if (next >= threshold && !serverSyncedRef.current) {
      serverSyncedRef.current = true;
      syncDismissalToServer(pageKey);
    }
  }, [visitKey, threshold, pageKey]);

  // On mount, check the server for cross-device dismissal state
  useEffect(() => {
    const manuallyHidden = checkHidden(hideKey, pageKey);
    const manuallyShown = localStorage.getItem(manualShowKey) === 'true';
    // Only check server if we're currently showing the hero (could be wrong on a fresh device)
    if (manuallyHidden || manuallyShown) return;

    fetchServerDismissed(pageKey).then(dismissed => {
      if (dismissed) {
        // Server says dismissed — update local storage and hide
        localStorage.setItem(hideKey, 'true');
        localStorage.removeItem(manualShowKey);
        setIsHeroVisible(false);
        setAutoHidden(false);
      }
    });
  }, [pageKey, hideKey, manualShowKey]);

  const toggleHeroVisibility = useCallback(() => {
    const newValue = !isHeroVisible;
    setIsHeroVisible(newValue);
    if (newValue) {
      localStorage.setItem(manualShowKey, 'true');
      localStorage.removeItem(hideKey);
      setAutoHidden(false);
    } else {
      localStorage.setItem(hideKey, 'true');
      localStorage.removeItem(manualShowKey);
      setAutoHidden(false);
      syncDismissalToServer(pageKey);
    }
  }, [isHeroVisible, hideKey, manualShowKey, pageKey]);

  const showHeroFromAutoHide = useCallback(() => {
    setIsHeroVisible(true);
    setAutoHidden(false);
    localStorage.setItem(manualShowKey, 'true');
    localStorage.removeItem(hideKey);
  }, [hideKey, manualShowKey]);

  return { isHeroVisible, toggleHeroVisibility, autoHidden, showHeroFromAutoHide };
}
