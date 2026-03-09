import { useState, useEffect, useCallback } from "react";

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

export function useAutoHideHero(pageKey: string, threshold = 5) {
  const visitKey = `${pageKey}_visits`;
  const hideKey = `hide${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)}HeroSection`;
  const manualShowKey = `${pageKey}_hero_manual_show`;

  const [isHeroVisible, setIsHeroVisible] = useState<boolean>(() => {
    const manuallyHidden = checkHidden(hideKey, pageKey);
    if (manuallyHidden) return false;

    const visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const manuallyShown = localStorage.getItem(manualShowKey) === 'true';
    if (visits >= threshold && !manuallyShown) return false;

    return true;
  });

  const [autoHidden, setAutoHidden] = useState<boolean>(() => {
    const manuallyHidden = checkHidden(hideKey, pageKey);
    if (manuallyHidden) return false;
    const visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const manuallyShown = localStorage.getItem(manualShowKey) === 'true';
    return visits >= threshold && !manuallyShown;
  });

  useEffect(() => {
    const current = parseInt(localStorage.getItem(visitKey) || '0', 10);
    localStorage.setItem(visitKey, String(current + 1));
  }, [visitKey]);

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
    }
  }, [isHeroVisible, hideKey, manualShowKey]);

  const showHeroFromAutoHide = useCallback(() => {
    setIsHeroVisible(true);
    setAutoHidden(false);
    localStorage.setItem(manualShowKey, 'true');
    localStorage.removeItem(hideKey);
  }, [hideKey, manualShowKey]);

  return { isHeroVisible, toggleHeroVisibility, autoHidden, showHeroFromAutoHide };
}
