import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, MapPin, MessageCircle, MessageSquare, Share2, Shield, Users, Building2, Calendar, Plane } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import ConnectButton from "@/components/ConnectButton";
import { VouchButton } from "@/components/VouchButton";
import { ReportUserButton } from "@/components/report-user-button";
import { formatLocationCompact, getCurrentTravelDestination } from "@/lib/dateUtils";
import type { ProfilePageProps } from "./profile-complete-types";

export function ProfileHeaderUser(props: ProfilePageProps) {
  const {
    user,
    setLocation,
    isOwnProfile,
    gradientOptions,
    selectedGradient,
    setSelectedGradient,
    setShowExpandedPhoto,
    uploadingPhoto,
    handleAvatarUpload,
    toast,
    connectionDegreeData,
    userVouches,
    travelPlans,
    openTab,
    hostelMatch,
    currentUser,
    handleMessage,
    setShowWriteReferenceModal,
  } = props as Record<string, any>;

  return (
    <div
      className={`bg-gradient-to-r ${gradientOptions?.[selectedGradient]} px-3 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 relative isolate`}
      style={{ width: '100vw', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
    >
      {isOwnProfile && (
        <button
          type="button"
          onClick={() => setSelectedGradient((prev: number) => (prev + 1) % (gradientOptions?.length ?? 1))}
          aria-label="Change header colors"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow-md hover:bg-white"
        >
          🎨
        </button>
      )}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-row flex-wrap items-start gap-4 sm:gap-6 relative z-20">
          <div className="relative flex-shrink-0">
            <div
              className={`rounded-full border-4 border-white dark:border-gray-600 shadow-xl overflow-hidden ${!isOwnProfile && user?.profileImage ? 'cursor-pointer hover:border-orange-400 transition-all' : ''}`}
              onClick={() => { if (!isOwnProfile && user?.profileImage) setShowExpandedPhoto(true); }}
              title={!isOwnProfile && user?.profileImage ? "Click to enlarge photo" : undefined}
            >
              <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-56 md:h-56 rounded-full overflow-hidden no-scrollbar">
                <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
              </div>
            </div>
            {isOwnProfile && (
              <>
                {!user?.profileImage && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20 animate-pulse">Add Photo</div>
                )}
                <div
                  className={`absolute bottom-2 right-2 h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600 animate-bounce' : 'bg-gray-600 hover:bg-gray-500'} text-white shadow-lg border-2 border-white z-10 overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                  <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '200px' }} disabled={uploadingPhoto} aria-label="Change avatar" />
                </div>
              </>
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="space-y-2 text-black w-full mt-2 overflow-hidden">
              {(() => {
                const hometown = formatLocationCompact(user?.hometownCity, user?.hometownState, user?.hometownCountry);
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-black break-all">@{user?.username}</h1>
                      <button
                        type="button"
                        onClick={async () => {
                          const profileUrl = `https://nearbytraveler.org/profile/${user?.username}`;
                          const shareText = `Check out @${user?.username} on Nearby Traveler`;
                          if (navigator.share) {
                            try {
                              await navigator.share({ title: shareText, url: profileUrl });
                            } catch (e) {}
                          } else {
                            await navigator.clipboard.writeText(profileUrl);
                            toast?.({ title: "Profile link copied!", description: "You can now paste it anywhere." });
                          }
                        }}
                        className="p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        style={{ touchAction: 'manipulation' }}
                        title="Share profile"
                      >
                        <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      {!isOwnProfile && connectionDegreeData?.degree && connectionDegreeData.degree > 0 && (
                        <Badge
                          className={`text-xs px-2 py-0.5 font-semibold ${
                            connectionDegreeData.degree === 1
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-600'
                              : connectionDegreeData.degree === 2
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-600'
                                : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-600'
                          }`}
                          data-testid="badge-connection-degree"
                        >
                          {connectionDegreeData.degree === 1 ? '1st' : connectionDegreeData.degree === 2 ? '2nd' : '3rd'}
                        </Badge>
                      )}
                      {user?.userType !== 'business' && (
                        <Badge
                          className={`text-xs px-2 py-0.5 font-semibold ${
                            (userVouches?.length || 0) > 0
                              ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-600'
                              : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                          }`}
                          data-testid="badge-vouch-count"
                        >
                          <Shield className="w-3 h-3 mr-1 inline" />
                          {userVouches?.length || 0} {(userVouches?.length || 0) === 1 ? 'Vouch' : 'Vouches'}
                        </Badge>
                      )}
                    </div>

                    {isOwnProfile ? (
                      <div className="flex flex-col gap-1 min-w-0 mt-1">
                        <span className="text-base sm:text-lg font-semibold text-orange-600 dark:text-orange-400">Nearby Local</span>
                        <span className="text-base sm:text-lg font-medium text-black dark:text-gray-100 break-words" title={hometown}>{hometown}</span>
                        {(() => {
                          const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                          if (!currentTravelPlan) return null;
                          return (
                            <>
                              <span className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">Nearby Traveler</span>
                              <span className="text-base sm:text-lg font-medium text-black dark:text-gray-100 break-words" title={currentTravelPlan}>{currentTravelPlan}</span>
                            </>
                          );
                        })()}
                        {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 mt-1 self-start">
                            New to Town
                          </span>
                        )}
                        {(() => {
                          const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                          if (!currentTravelPlan) return null;
                          const now = new Date();
                          const activePlanWithHostel = (travelPlans || []).find((plan: any) => {
                            if (!plan.startDate || !plan.endDate) return false;
                            const start = new Date(plan.startDate);
                            const end = new Date(plan.endDate);
                            const isActive = now >= start && now <= end;
                            const hasPublicHostel = plan.hostelName && plan.hostelVisibility === 'public';
                            const matchesDestination = plan.destination && currentTravelPlan.toLowerCase().includes(plan.destination.split(',')[0].toLowerCase().trim());
                            return isActive && hasPublicHostel && matchesDestination;
                          });
                          return activePlanWithHostel ? (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-black dark:text-gray-100 mt-1">
                              <Building2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                              <span className="break-words">Staying at {activePlanWithHostel.hostelName}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-1.5 text-sm sm:text-base font-medium text-black dark:text-gray-200 min-w-0">
                          <div className="flex-shrink-0 mt-0.5 flex flex-col items-center gap-0">
                            <MapPin className="hidden sm:block w-5 h-5 text-blue-600" />
                            {getCurrentTravelDestination(travelPlans || []) && (
                              <Plane className="hidden sm:block w-5 h-5 text-orange-600 mt-1" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0 min-w-0 flex-1">
                            <span className="text-sm sm:text-base font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">Nearby Local</span>
                            <span className="truncate text-gray-700 dark:text-gray-300" title={hometown}>{hometown}</span>
                            {(() => {
                              const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                              if (!currentTravelPlan) return null;
                              return (
                                <>
                                  <span className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap mt-0.5">Nearby Traveler</span>
                                  <span className="truncate text-gray-700 dark:text-gray-300" title={currentTravelPlan}>{currentTravelPlan}</span>
                                </>
                              );
                            })()}
                          </div>
                          {user?.newToTownUntil && new Date(user.newToTownUntil) > new Date() && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 flex-shrink-0 self-start">
                              New to Town
                            </span>
                          )}
                        </div>
                        {(() => {
                          const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                          if (!currentTravelPlan) return null;
                          const now = new Date();
                          const activePlanWithHostel = (travelPlans || []).find((plan: any) => {
                            if (!plan.startDate || !plan.endDate) return false;
                            const start = new Date(plan.startDate);
                            const end = new Date(plan.endDate);
                            const isActive = now >= start && now <= end;
                            const hasPublicHostel = plan.hostelName && plan.hostelVisibility === 'public';
                            const matchesDestination = plan.destination && currentTravelPlan.toLowerCase().includes(plan.destination.split(',')[0].toLowerCase().trim());
                            return isActive && hasPublicHostel && matchesDestination;
                          });
                          return activePlanWithHostel ? (
                            <div className="flex items-start gap-1.5 text-sm font-medium text-black flex-wrap mt-1">
                              <Building2 className="hidden sm:block w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                              <span className="break-words">Staying at {activePlanWithHostel.hostelName}</span>
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}
                  </>
                );
              })()}

              {!isOwnProfile && (
                <div>
                  {connectionDegreeData?.mutualCount && connectionDegreeData.mutualCount > 0 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700" data-testid="mutual-connections">
                      <div className="flex -space-x-2">
                        {connectionDegreeData.mutuals?.slice(0, 3).map((mutual: any) => (
                          <Avatar
                            key={mutual.id}
                            className="w-6 h-6 border-2 border-white dark:border-gray-800 cursor-pointer hover:ring-2 hover:ring-blue-400"
                            onClick={() => setLocation(`/profile/${mutual.id}`)}
                          >
                            <AvatarImage src={mutual.profileImage || undefined} />
                            <AvatarFallback className="text-xs bg-blue-200 text-blue-800">{mutual.name?.[0] || mutual.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        <Users className="w-3 h-3 inline mr-1" />
                        {connectionDegreeData.mutualCount} mutual {connectionDegreeData.mutualCount === 1 ? 'connection' : 'connections'}
                      </span>
                    </div>
                  )}
                  {!isOwnProfile && hostelMatch && (
                    <div
                      className="flex items-center gap-2 mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 rounded-lg border-2 border-orange-300 dark:border-orange-600 shadow-sm animate-pulse"
                      data-testid="hostel-match-banner"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800">
                        <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                          You're both staying at {hostelMatch.hostelName}!
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          in {hostelMatch.destination} during overlapping dates
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isOwnProfile && (
              <div className="w-full flex items-center gap-3 flex-wrap min-w-0 relative z-50 pointer-events-auto mt-2" style={{ position: 'relative', zIndex: 9999 }}>
                <button
                  type="button"
                  className="inline-flex items-center bg-orange-500 hover:bg-orange-600 border-0 px-6 py-2 rounded-lg shadow-md transition-all text-black font-medium cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMessage?.();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  data-testid="button-message"
                  data-radix-dismissable-layer-ignore=""
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-black" />
                  <span className="text-black">Message</span>
                </button>
                <ConnectButton
                  currentUserId={currentUser?.id || 0}
                  targetUserId={user?.id || 0}
                  targetUsername={user?.username}
                  targetName={user?.name}
                  className="px-6 py-2 rounded-lg shadow-md transition-all"
                />
                <VouchButton
                  currentUserId={currentUser?.id || 0}
                  targetUserId={user?.id || 0}
                  targetUsername={user?.username}
                />
                {currentUser ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowWriteReferenceModal?.(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    data-testid="button-write-reference"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Write Reference
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setLocation('/auth')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    data-testid="button-write-reference"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Write Reference
                  </Button>
                )}
                {user && (
                  currentUser ? (
                    <ReportUserButton
                      userId={currentUser.id}
                      targetUserId={user.id}
                      targetUsername={user.username}
                      variant="ghost"
                      size="sm"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation('/auth');
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 text-sm rounded font-medium cursor-pointer"
                      data-radix-dismissable-layer-ignore=""
                    >
                      Report
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadingPhoto && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-600 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Uploading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
