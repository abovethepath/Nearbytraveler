import React from "react";
import { useLocation } from "wouter";
import { Plane } from "lucide-react";
import { getCurrentTravelDestination } from "@/lib/dateUtils";
import { formatCityDisplay } from "@/lib/locationDisplay";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { abbreviateCity } from "@/lib/displayName";
import { truncateBioToSentences } from "@/lib/bioPreview";
import { computeCommonStats } from "@/lib/whatYouHaveInCommonStats";
import { prefetchedNav } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  hometownCity?: string;
  hometownState?: string;
  hometownCountry?: string;
  profileImage?: string;
  interests?: string[];
  isCurrentlyTraveling?: boolean;
  travelDestination?: string;
  travelStartDate?: string | Date;
  travelEndDate?: string | Date;
  isTravelerToCity?: boolean;
  avatarGradient?: string;
  avatarColor?: string;
  userType?: string;
  businessName?: string;
  businessType?: string;
  streetAddress?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  secretActivities?: string;
  ambassadorStatus?: string;
}

interface UserCardProps {
  user: User;
  searchLocation?: string;
  currentUserId?: number;
  isCurrentUser?: boolean;
  showCompatibilityScore?: boolean;
  compatibilityData?: any;
  compact?: boolean;
  connectionDegree?: {
    degree: number;
    mutualCount: number;
  };
  isAvailableNow?: boolean;
  /**
   * Visual-only variant selector.
   * IMPORTANT: Keep "default" behavior/styling identical for non-Home/Cities pages.
   */
  variant?: "default" | "homeCity";
}

export default function UserCard({ 
  user, 
  searchLocation, 
  currentUserId,
  isCurrentUser = false,
  showCompatibilityScore = false,
  compatibilityData,
  compact = false,
  connectionDegree,
  isAvailableNow = false,
  variant = "default",
}: UserCardProps) {
  // Use prop first (from parent's effectiveAvailableNowIds), fallback to API-returned isAvailableNow
  const showAvailableNow = isAvailableNow || !!(user as any).isAvailableNow || !!(user as any).is_available_now || !!(user as any).availableNow;
  
  const [currentPath, setLocation] = useLocation();
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    prefetchedNav.userId = user.id;
    prefetchedNav.profileImage = user.profileImage ?? null;
    prefetchedNav.username = user.username;
    prefetchedNav.avatarGradient = user.avatarGradient ?? null;
    prefetchedNav.avatarColor = user.avatarColor ?? null;
    setLocation(`/profile/${user.id}`);
  };

  const [isDarkMode, setIsDarkMode] = React.useState(
    document.documentElement.classList.contains("dark")
  );
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const isHomeRoute = currentPath === "/" || currentPath === "/home";
  const pickTextColor = (light: string, dark: string) => (isDarkMode ? dark : light);

  const getUserGradient = () => {
    if (user.avatarGradient) return user.avatarGradient;
    const gradients = [
      'linear-gradient(135deg, #1D4ED8 0%, #7E22CE 50%, #C2410C 100%)',
      'linear-gradient(135deg, #15803D 0%, #047857 50%, #C2410C 100%)',
      'linear-gradient(135deg, #1D4ED8 0%, #0E7490 50%, #C2410C 100%)',
      'linear-gradient(135deg, #BE185D 0%, #BE185D 50%, #B91C1C 100%)',
      'linear-gradient(135deg, #4338CA 0%, #1D4ED8 50%, #15803D 100%)',
      'linear-gradient(135deg, #C2410C 0%, #B91C1C 50%, #BE185D 100%)',
      'linear-gradient(135deg, #0F766E 0%, #1D4ED8 50%, #7E22CE 100%)',
      'linear-gradient(135deg, #A16207 0%, #C2410C 50%, #B91C1C 100%)',
    ];
    return gradients[user.id % gradients.length];
  };

  // Get travel destination for display - SAME logic as ResponsiveUserGrid/current user card
  // Every user who is currently traveling shows badge: plane icon + city name in top-left
  // CRITICAL: Must show for EVERY user with active travel plan, not just current user
  // API returns camelCase (destinationCity, travelPlans) - support snake_case fallbacks
  const getTravelCity = (): string | null => {
    const toDisplay = (s: string | null | undefined): string | null => {
      if (s == null || s === '') return null;
      const t = String(s).trim();
      if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return null;
      return t;
    };
    const u = user as any;
    const debugUsernames = ['barbara809', 'aml101371'];
    if (debugUsernames.includes(u.username)) {
      console.log(`[Travel Badge] ${u.username} FULL DATA:`, JSON.stringify(u, null, 2));
    }
    // 1. From travelPlans / travel_plans (active trip) - same as current user's Los Angeles badge
    const plans = u.travelPlans ?? u.travel_plans;
    if (Array.isArray(plans) && plans.length > 0) {
      const dest = getCurrentTravelDestination(plans);
      if (dest) {
        const city = String(dest).split(',')[0]?.trim();
        const r = toDisplay(city);
        if (r) return r;
      }
      // Fallback: API may format destination as "City, State, Country" - if dest empty, use plan.destinationCity
      for (const plan of plans) {
        const start = plan.startDate ?? plan.start_date;
        const end = plan.endDate ?? plan.end_date;
        if (start && end) {
          const now = new Date();
          const s = new Date(start);
          const e = new Date(end);
          if (now >= s && now <= e) {
            const city = toDisplay(plan.destinationCity ?? plan.destination_city ?? plan.destination?.split(',')[0]?.trim());
            if (city) return city;
          }
        }
      }
    }
    // 2. From destinationCity / destination_city (API-enriched - server sets ONLY for users with active travel)
    const destCity = toDisplay(u.destinationCity ?? u.destination_city);
    if (destCity) return destCity;
    // 3. From travelDestination / travel_destination (API - server sets ONLY from active plan)
    const td = u.travelDestination ?? u.travel_destination;
    if (td) {
      const city = String(td).split(',')[0]?.trim();
      const r = toDisplay(city);
      if (r) return r;
    }
    // NOTE: We intentionally do NOT use location, currentCity, or locationBasedStatus here.
    // The traveling badge must ONLY show for CURRENT travel (trip dates active today), not future travel.
    return null;
  };

  const travelCityFinal = getTravelCity();
  const hometownLine = (() => {
    const city = (user.hometownCity || "").trim();
    if (!city) return "Unknown";
    const abbrevCity = abbreviateCity(city);
    const formatted = formatCityDisplay(abbrevCity, user.hometownState, user.hometownCountry);
    return formatted === "Unknown" ? abbrevCity : formatted;
  })();

  const handle = `@${user.username}`;

  // Fix percentage - if it's a decimal like 0.234, multiply by 100; if already whole, use as is
  const getMatchPercent = () => {
    if (!compatibilityData?.score) return null;
    const score = compatibilityData.score;
    if (score < 1) {
      return Math.round(score * 100);
    }
    return Math.round(score);
  };

  const matchPercent = getMatchPercent();
  const { data: compatibilityFromApi } = useQuery<any>({
    queryKey: currentUserId ? [`/api/compatibility/${currentUserId}/${user.id}`] : [],
    // Only fetch if no compatibility data was passed as prop (avoids N+1 on home page)
    enabled: !!currentUserId && !isCurrentUser && !compatibilityData,
    staleTime: 5 * 60 * 1000, // 5 min — compatibility scores don't change often
  });

  // Self-fetch connection degree from source of truth endpoint.
  // Triggers when: no prop provided, OR prop says 0 (batch endpoint can be inaccurate).
  // Source of truth = /api/connections/degree which uses a reliable SQL JOIN (same as profile page).
  const needsSelfFetch = !connectionDegree || connectionDegree.mutualCount === 0;
  const { data: selfFetchedDegree } = useQuery<{ degree: number; mutualCount: number }>({
    queryKey: ['/api/connections/degree', currentUserId, user.id],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/connections/degree/${currentUserId}/${user.id}`);
      if (!res.ok) return { degree: 0, mutualCount: 0 };
      return res.json();
    },
    enabled: !!currentUserId && !isCurrentUser && needsSelfFetch,
    staleTime: 5 * 60 * 1000,
  });

  // Prefer: prop with mutualCount > 0, then self-fetched, then prop (even if 0), then 0
  const effectiveConnectionDegree =
    (connectionDegree && connectionDegree.mutualCount > 0) ? connectionDegree : (selfFetchedDegree ?? connectionDegree);
  const effectiveCompatibilityData = (compatibilityFromApi as any) ?? compatibilityData;
  const thingsInCommon = computeCommonStats(effectiveCompatibilityData, effectiveConnectionDegree).totalCommon;
  const contactsInCommon = effectiveConnectionDegree?.mutualCount ?? 0;
  const bioText = truncateBioToSentences(user.bio, 3);

  return (
    <button 
      type="button"
      className={`user-card w-full min-w-0 max-w-none !p-0 block overflow-hidden shadow-sm hover:shadow-md transition-all ${
        "text-center"
      } flex flex-col items-stretch gap-0 leading-none ${
        compact ? 'rounded-lg' : 'rounded-[14px] lg:rounded-[14px]'
      } ${showAvailableNow && !isCurrentUser ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30' : ''} ${
        variant === "homeCity" ? "bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2d3a]" : ""
      }`}
      style={{
        ...(variant === "homeCity"
          ? {
              borderRadius: 14,
              padding: 0,
              ...(isHomeRoute && !isDarkMode ? { backgroundColor: "#FAF7F2" } : {}),
            }
          : {
              backgroundColor: '#1a1d27',
              border: '1px solid #2a2d3a',
              borderRadius: 14,
              padding: 0,
            }),
      }}
      onClick={handleCardClick}
      data-testid={`user-card-${user.id}`}
      data-is-current-user={isCurrentUser ? 'true' : undefined}
    >
      {/* Photo section - flush to top edge (no padding/margin); identical for current user and others */}
      <div 
        className={`relative block flex-shrink-0 w-full !m-0 !p-0 self-stretch overflow-hidden ${compact ? 'aspect-square rounded-t-lg' : isNativeIOSApp() ? 'aspect-square lg:aspect-[3/4] rounded-t-[14px]' : 'aspect-square lg:aspect-[4/5] rounded-t-[14px]'}`}
        style={{ margin: 0, padding: 0, minHeight: 0, flexShrink: 0 }}
      >
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={user.username}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div 
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{ background: getUserGradient() }}
          >
            <span className={`font-bold text-white/90 ${compact ? 'text-2xl' : 'text-4xl'}`}>
              {(user as any).firstName?.charAt(0) || user.name?.charAt(0) || user.username?.charAt(0) || '?'}
            </span>
          </div>
        )}
        
        {/* Ambassador gold ring overlay */}
        {user.ambassadorStatus === 'active' && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ border: '3px solid #FFD700', borderRadius: 'inherit', boxShadow: 'inset 0 0 0 2px rgba(255,215,0,0.3)' }} />
        )}

        {/* Travel destination tag - top-left on photo/avatar area */}
        {travelCityFinal && user.userType !== 'business' && (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap flex items-center gap-1">
              <Plane className="w-3 h-3 flex-shrink-0" />
              {travelCityFinal}
            </span>
          </div>
        )}
        
        {/* Top-right badges (Home/Cities only): "You" + optional Biz */}
        {(variant === "homeCity" && isCurrentUser) || user.userType === "business" ? (
          <div className="absolute top-1.5 right-1.5 z-10 flex flex-col items-end gap-1">
            {variant === "homeCity" && isCurrentUser && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border border-black/10 bg-black/55 text-white backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-white/85">
                You
              </span>
            )}
            {user.userType === "business" && (
              <span className="bg-orange-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                Biz
              </span>
            )}
          </div>
        ) : null}
        
        {/* Available Now badge - green, visible to everyone (web and native app) */}
        {showAvailableNow && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <span className="status-badge animate-pulsate-green flex items-center justify-center gap-1 bg-green-500 text-white text-[10px] lg:text-[13px] font-bold px-2 lg:px-3 py-1 lg:py-1.5 rounded-full shadow-lg w-full">
              <span className="status-badge w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white dark:bg-gray-900 rounded-full"></span>
              Available Now
            </span>
          </div>
        )}
      </div>
      
      {/* Info box - structure is intentionally consistent for mobile + desktop */}
      <div
        className={`w-full ${compact ? 'p-1 min-h-[6.5rem]' : 'p-1 lg:p-1.5 min-h-[7.5rem]'} flex flex-col justify-start ${
          variant === "homeCity" ? "bg-transparent" : ""
        }`}
        style={variant === "homeCity" ? undefined : { backgroundColor: '#1a1d27' }}
      >
        {/* Mobile / compact */}
        <div className={compact ? '' : 'lg:hidden'}>
          {variant === "homeCity" ? (
            <div className="!flex !flex-col !items-center !w-full" data-role="user-card-text-container" style={{ textAlign: 'center' }}>
              <div
                data-role="user-card-username"
                className="truncate !w-full !block font-extrabold text-[14px]"
                style={{ color: pickTextColor("#FF6B35", "#FF6B35"), textAlign: 'center' }}
              >
                {handle}
              </div>
              <div
                className="mt-0.5 flex items-center justify-center gap-1 min-w-0 !w-full text-[11.5px]"
                data-role="user-card-location"
                style={{ width: "100%", textAlign: "center" }}
              >
                <span
                  data-role="user-card-city"
                  className="truncate !w-full !block"
                  style={{
                    color: pickTextColor("#3b82f6", "#3b82f6"),
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {hometownLine}
                </span>
              </div>
              <div
                className="user-card-bio mt-1.5 w-full"
                data-role="user-card-bio"
                title={user.bio || undefined}
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  minHeight: "4.5em",
                  maxHeight: "4.5em",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical" as any,
                  WebkitLineClamp: 3 as any,
                  textAlign: "center",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <span
                  style={{ color: pickTextColor("#1f2937", "#e5e7eb"), textAlign: "center" }}
                >
                  {bioText || '\u00A0'}
                </span>
              </div>
              <div
                className={`mt-1 w-full flex flex-col items-center ${isCurrentUser ? "invisible" : ""}`}
                style={{ textAlign: 'center' }}
              >
                <div className="w-full flex justify-center">
                  <span
                    data-role="user-card-things-pill"
                    className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13.5px] font-bold border bg-orange-100 border-orange-300 dark:bg-[rgba(59,130,246,0.12)] dark:border-[rgba(59,130,246,0.25)]"
                    style={{ color: '#FFFFFF' }}
                  >
                    {thingsInCommon} things in common
                  </span>
                </div>
                <div className="w-full flex justify-center mt-1">
                  <span
                    data-role="user-card-contacts"
                    className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold text-white whitespace-nowrap" style={{ backgroundColor: '#FF6B35' }}
                  >
                    <span className="lg:hidden">{contactsInCommon} {contactsInCommon === 1 ? 'Mutual Contact' : 'Mutual Contacts'}</span>
                    <span className="hidden lg:inline">{contactsInCommon} {contactsInCommon === 1 ? 'Connection' : 'Connections'} in Common</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                data-role="user-card-username"
                className="w-full text-center truncate"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500 }}
              >
                <span style={{ color: pickTextColor("#3b82f6", "#FF6B35") }}>
                {handle}
                </span>
              </div>
              <div
                className="mt-1 flex items-center justify-center gap-1 min-w-0 w-full text-center"
                style={{ fontSize: 11.5, color: pickTextColor("#e8834a", "#3b82f6") }}
              >
                <span data-role="user-card-city" className="truncate w-full text-center">{hometownLine}</span>
              </div>
              <div
                className="user-card-bio text-center"
                data-role="user-card-bio"
                title={user.bio || undefined}
                style={{
                  color: pickTextColor("#9ca3af", "#D1D5DB"),
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  minHeight: '3.75rem',
                  maxHeight: '3.75rem',
                  marginTop: 6,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical' as any,
                  WebkitLineClamp: 3 as any,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {bioText || '\u00A0'}
              </div>
              {!isCurrentUser && (
                <>
                  <div
                    className="w-full flex justify-center mt-1"
                    data-role="user-card-things"
                  >
                    <span className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13.5px] font-bold border bg-orange-100 border-orange-300 dark:bg-[rgba(59,130,246,0.12)] dark:border-[rgba(59,130,246,0.25)]" style={{ color: '#FFFFFF' }}>
                      {thingsInCommon} things in common
                    </span>
                  </div>
                  <div
                    className="w-full flex justify-center mt-1"
                    data-role="user-card-contacts"
                  >
                    <span className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold text-white whitespace-nowrap" style={{ backgroundColor: '#FF6B35' }}>
                      <span className="lg:hidden">{contactsInCommon} {contactsInCommon === 1 ? 'Mutual Contact' : 'Mutual Contacts'}</span>
                      <span className="hidden lg:inline">{contactsInCommon} {contactsInCommon === 1 ? 'Connection' : 'Connections'} in Common</span>
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          {travelCityFinal && user.userType !== 'business' && (
            <div className="sr-only">
              <Plane className="w-3 h-3 flex-shrink-0" />
              {travelCityFinal}
            </div>
          )}
        </div>

        {/* Desktop (non-compact only) */}
        <div className={compact ? 'hidden' : 'hidden lg:flex lg:flex-col lg:min-h-[7.5rem]'} style={{ minHeight: '7.5rem' }}>
          {variant === "homeCity" ? (
            <div className="!flex !flex-col !items-center !w-full !text-center" data-role="user-card-text-container">
              <div
                data-role="user-card-username"
                className="truncate !w-full !text-center !block font-extrabold text-[14px]"
                style={{ color: pickTextColor("#FF6B35", "#FF6B35"), textAlign: "center" }}
              >
                {handle}
              </div>
              <div
                className="mt-0.5 flex items-center justify-center gap-1 min-w-0 !w-full !text-center text-[11.5px]"
                data-role="user-card-location"
                style={{ width: "100%", textAlign: "center" }}
              >
                <span
                  data-role="user-card-city"
                  className="truncate !text-center !w-full !block"
                  style={{
                    color: pickTextColor("#3b82f6", "#3b82f6"),
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {hometownLine}
                </span>
              </div>
              <div
                className="user-card-bio mt-1.5 w-full"
                data-role="user-card-bio"
                title={user.bio || undefined}
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  minHeight: "4.5em",
                  maxHeight: "4.5em",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical" as any,
                  WebkitLineClamp: 3 as any,
                  textAlign: "center",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <span
                  style={{ color: pickTextColor("#1f2937", "#e5e7eb"), textAlign: "center" }}
                >
                  {bioText || '\u00A0'}
                </span>
              </div>
              <div
                className={`mt-1 w-full flex flex-col items-center text-center ${isCurrentUser ? "invisible" : ""}`}
              >
                <div className="w-full flex justify-center">
                  <span
                    data-role="user-card-things-pill"
                    className="inline-flex items-center justify-center text-center rounded-full px-3.5 py-1.5 text-[13px] font-bold border bg-orange-100 border-orange-300 dark:bg-[rgba(59,130,246,0.12)] dark:border-[rgba(59,130,246,0.25)]"
                    style={{ color: '#FFFFFF' }}
                  >
                    {thingsInCommon} things in common
                  </span>
                </div>
                <div
                  data-role="user-card-contacts"
                  className="mt-1 w-full flex justify-center"
                >
                  <span className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white whitespace-nowrap" style={{ backgroundColor: '#FF6B35' }}>
                    <span className="lg:hidden">{contactsInCommon} {contactsInCommon === 1 ? 'Mutual Contact' : 'Mutual Contacts'}</span>
                    <span className="hidden lg:inline">{contactsInCommon} {contactsInCommon === 1 ? 'Connection' : 'Connections'} in Common</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                data-role="user-card-username"
                className="w-full text-center truncate"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500 }}
              >
                <span style={{ color: pickTextColor("#3b82f6", "#FF6B35") }}>
                {handle}
                </span>
              </div>
              <div
                className="mt-1 flex items-center justify-center gap-1 min-w-0 w-full text-center"
                style={{ fontSize: 11.5, color: pickTextColor("#e8834a", "#3b82f6") }}
              >
                <span data-role="user-card-city" className="truncate w-full text-center">{hometownLine}</span>
              </div>
              <div
                className="user-card-bio text-center"
                data-role="user-card-bio"
                title={user.bio || undefined}
                style={{
                  color: pickTextColor("#9ca3af", "#D1D5DB"),
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  minHeight: '3.75rem',
                  maxHeight: '3.75rem',
                  marginTop: 6,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical' as any,
                  WebkitLineClamp: 3 as any,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {bioText || '\u00A0'}
              </div>
              {!isCurrentUser && (
                <>
                  <div
                    className="w-full text-center mt-1"
                    style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}
                    data-role="user-card-things"
                  >
                    {thingsInCommon} things in common
                  </div>
                  <div
                    className="w-full flex justify-center mt-0.5"
                    data-role="user-card-contacts"
                  >
                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[12px] font-semibold text-white whitespace-nowrap" style={{ backgroundColor: '#FF6B35' }}>
                      <span className="lg:hidden">{contactsInCommon} {contactsInCommon === 1 ? 'Mutual Contact' : 'Mutual Contacts'}</span>
                      <span className="hidden lg:inline">{contactsInCommon} {contactsInCommon === 1 ? 'Connection' : 'Connections'} in Common</span>
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          {travelCityFinal && user.userType !== 'business' && (
            <div className="sr-only">
              <Plane className="w-3 h-3 flex-shrink-0" />
              {travelCityFinal}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
