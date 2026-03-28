import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MapPin, Calendar, User } from "lucide-react";
import { computeCommonStats, type CompatibilityLike } from "@/lib/whatYouHaveInCommonStats";

interface WhatYouHaveInCommonProps {
  currentUserId: number;
  otherUserId: number;
}

export function WhatYouHaveInCommon({ currentUserId, otherUserId }: WhatYouHaveInCommonProps) {
  const [showAllSharedInterests, setShowAllSharedInterests] = React.useState(false);
  const [showAllOtherCommon, setShowAllOtherCommon] = React.useState(false);

  // Single authoritative data source: server's compatibility calculation
  const { data: compatibilityData, isLoading } = useQuery<CompatibilityLike>({
    queryKey: [`/api/compatibility/${currentUserId}/${otherUserId}`],
    enabled: !!currentUserId && !!otherUserId && currentUserId !== otherUserId,
  });

  // Mutual connections for display (not counted in badge)
  const { data: rawMutualConnections = [] } = useQuery<any[]>({
    queryKey: [`/api/mutual-connections/${currentUserId}/${otherUserId}`],
    enabled: !!(currentUserId && otherUserId && currentUserId !== otherUserId),
  });
  const mutualConnections = rawMutualConnections.filter(
    (c: any) => c.username !== "admin" && c.username !== "test"
  );

  // ONE source of truth: server data → computeCommonStats → pills + badge
  const commonStats = computeCommonStats(compatibilityData, {
    mutualCount: mutualConnections.length,
  });

  const {
    sharedInterests,
    sharedActivities,
    sharedEvents,
    sharedLanguagesNonEnglish,
    sharedCityActivities,
    sharedSexualPreferences,
    otherCommonalities,
    sharedContactsCount,
    totalCommon,
  } = commonStats;

  const badgeLabel = `${totalCommon} ${totalCommon === 1 ? "thing" : "things"} in common`;

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 dark:text-gray-100 text-sm">Loading compatibility data...</p>
        </CardContent>
      </Card>
    );
  }

  if (totalCommon === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 dark:text-gray-100 text-sm italic">
            No commonalities found yet. You might discover shared interests as you both update your profiles!
          </p>
        </CardContent>
      </Card>
    );
  }

  // City activities: parse "Activity (City)" strings back to grouped display
  const cityActivityGroups: Record<string, string[]> = {};
  const rawCityActivities = Array.isArray((compatibilityData as any)?.sharedCityActivities)
    ? (compatibilityData as any).sharedCityActivities as { activity: string; city: string }[]
    : [];
  for (const item of rawCityActivities) {
    if (!item?.activity) continue;
    const city = item.city || "Unknown";
    if (!cityActivityGroups[city]) cityActivityGroups[city] = [];
    cityActivityGroups[city].push(item.activity);
  }

  return (
    <Card className="what-you-have-in-common-card border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            What You Have in Common
          </CardTitle>
          <span
            className="inline-flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-md border border-blue-700 dark:border-blue-600 text-sm font-bold px-4 py-2.5 min-h-[2.5rem]"
            data-testid="common-count-badge"
          >
            {badgeLabel}
          </span>
        </div>
        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mt-1">
          All your shared interests, activities, and experiences
        </p>
      </CardHeader>
      <CardContent className="space-y-4 lg:space-y-3 overflow-hidden">
        {/* Desktop: two-column layout for interests + other */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          {/* Shared Interests */}
          {sharedInterests.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
              <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-2 flex items-center gap-1 text-base">
                <Heart className="w-5 h-5 text-red-500" />
                Shared Interests ({sharedInterests.length})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {(showAllSharedInterests ? sharedInterests : sharedInterests.slice(0, 5)).map((interest, i) => (
                  <div
                    key={`interest-${i}`}
                    className="inline-flex items-center justify-center py-1.5 sm:py-2 lg:py-1 rounded-full px-3 sm:px-4 lg:px-2.5 text-xs sm:text-sm lg:text-xs font-medium leading-tight bg-transparent text-blue-700 border border-blue-400 dark:bg-blue-900/50 dark:text-gray-100 dark:border-blue-700 max-w-full text-center break-words"
                  >
                    {interest}
                  </div>
                ))}
              </div>
              {sharedInterests.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSharedInterests((v) => !v)}
                  className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline underline-offset-2"
                >
                  {showAllSharedInterests ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Other Things in Common (languages, sexual prefs, otherCommonalities) */}
          {(sharedSexualPreferences.length > 0 ||
            sharedLanguagesNonEnglish.length > 0 ||
            otherCommonalities.length > 0) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-lg p-3 border border-blue-200 dark:border-slate-600">
              <h5 className="font-bold text-gray-900 dark:text-slate-100 mb-3 lg:mb-2 flex items-center gap-1 text-base">
                <User className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                Other ({sharedSexualPreferences.length + sharedLanguagesNonEnglish.length + otherCommonalities.length})
              </h5>
              <div className="space-y-3 lg:space-y-2">
                {sharedSexualPreferences.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">Sexual Preferences</h6>
                    <div className="flex flex-wrap gap-2 lg:gap-1.5">
                      {sharedSexualPreferences.map((pref, i) => (
                        <Badge key={`pref-${i}`} className="bg-transparent text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium">
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {sharedLanguagesNonEnglish.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">Shared Languages</h6>
                    <div className="flex flex-wrap gap-2 lg:gap-1.5">
                      {sharedLanguagesNonEnglish.map((lang, i) => (
                        <Badge key={`lang-${i}`} className="bg-transparent text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium">
                          💬 {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {otherCommonalities.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">Other</h6>
                    <div className="flex flex-wrap gap-2 lg:gap-1.5">
                      {(showAllOtherCommon ? otherCommonalities : otherCommonalities.slice(0, 3)).map((item, i) => (
                        <Badge key={`other-${i}`} className="bg-transparent text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    {otherCommonalities.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllOtherCommon((v) => !v)}
                        className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline underline-offset-2"
                      >
                        {showAllOtherCommon ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shared Activities */}
        {sharedActivities.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-lg p-3 border border-green-200 dark:border-green-600">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1 text-base">
              <Users className="w-5 h-5 text-green-500" />
              Shared Activities ({sharedActivities.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {sharedActivities.map((activity, i) => (
                <div key={`activity-${i}`} className="inline-flex items-center justify-center py-1.5 sm:py-2 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium leading-tight bg-transparent text-orange-700 border border-orange-500 dark:bg-orange-500 dark:text-white dark:border-0 max-w-full text-center break-words">
                  {activity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared City Activities - Grouped by City */}
        {Object.entries(cityActivityGroups).map(([city, activities]) => (
          <div key={`city-${city}`} className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-600">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1 text-base">
              <MapPin className="w-5 h-5 text-orange-500" />
              Things You Both Want to Do in {city} ({activities.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity, i) => (
                <Badge key={`ca-${city}-${i}`} className="bg-transparent text-orange-700 border-orange-500 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700 font-medium">
                  ✓ {activity}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {/* Shared Events */}
        {sharedEvents.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1 text-base">
              <Calendar className="w-5 h-5 text-purple-500" />
              Shared Events ({sharedEvents.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {sharedEvents.map((event, i) => (
                <div key={`event-${i}`} className="inline-flex items-center justify-center py-1.5 sm:py-2 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium leading-tight bg-transparent text-purple-800 border border-purple-500 dark:bg-purple-500 dark:text-white dark:border-0 max-w-full text-center break-words">
                  {event}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mutual Connections (informational, not counted in badge) */}
        {mutualConnections.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border-l-4 border-green-400">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                {mutualConnections.length} mutual {mutualConnections.length === 1 ? "connection" : "connections"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {mutualConnections.slice(0, 6).map((c: any, i: number) => (
                <div key={`mutual-${c.id}-${i}`} className="flex flex-col items-center text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 w-[90px]">
                  {c.profileImage ? (
                    <img src={c.profileImage} alt={c.name || c.username} className="w-8 h-8 rounded-full object-cover mb-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center text-white text-xs font-bold mb-1">
                      {(c.name || c.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate max-w-full">
                    {c.firstName || c.name || c.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
