import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Globe, MapPin, MessageCircle, MessageSquare, Phone, Mail, Share2, Shield, Users, Building2, Calendar, Plane } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import ConnectButton from "@/components/ConnectButton";
import { VouchButton } from "@/components/VouchButton";
import { ReportUserButton } from "@/components/report-user-button";
import { formatLocationCompact, getCurrentTravelDestination } from "@/lib/dateUtils";
import type { ProfilePageProps } from "./profile-complete-types";
import { ProfileHeaderUser } from "./ProfileHeaderUser";

export function ProfileHeader(props: ProfilePageProps) {
  const {
    user,
    setLocation,
    isOwnProfile,
    shouldShowBackToChat,
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
    <>
      {/* Back to Chat Button - Show when navigated from a chatroom - OUTSIDE overflow container */}
      {shouldShowBackToChat && (
        <div className="w-full bg-blue-600 text-white px-4 py-2 shadow-md">
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={() => {
                const chatSource = sessionStorage.getItem('chatSource');
                if (chatSource) {
                  sessionStorage.removeItem('chatSource');
                  setLocation(chatSource);
                }
              }}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 -ml-2"
              data-testid="button-back-to-chat"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </div>
        </div>
      )}

      {/* PROFILE HEADER - Business: centered avatar + card below. User: row layout */}
      {user?.userType === 'business' ? (
        <>
          {/* Business hero: gradient strip with centered avatar only */}
          <div
            className={`bg-gradient-to-r ${gradientOptions?.[selectedGradient]} px-3 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-10 sm:pb-12 relative isolate`}
            style={{ width: '100vw', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
              <div className="relative flex-shrink-0">
                <div
                  className={`rounded-full border-4 border-white dark:border-gray-600 shadow-xl overflow-hidden ${!isOwnProfile && user?.profileImage ? 'cursor-pointer hover:border-orange-400 transition-all' : ''}`}
                  onClick={() => { if (!isOwnProfile && user?.profileImage) setShowExpandedPhoto(true); }}
                  title={!isOwnProfile && user?.profileImage ? "Click to enlarge photo" : undefined}
                >
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden no-scrollbar">
                    <SimpleAvatar user={user} size="xl" className="w-full h-full block object-cover" />
                  </div>
                </div>
                {isOwnProfile && (
                  <>
                    {!user?.profileImage && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20 animate-pulse">Add Photo</div>
                    )}
                    <div
                      className={`absolute bottom-0 right-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 flex items-center justify-center cursor-pointer ${!user?.profileImage ? 'bg-orange-500 hover:bg-orange-600 animate-bounce' : 'bg-gray-600 hover:bg-gray-500'} text-white shadow-lg border-2 border-white z-10 overflow-hidden ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
                      data-testid="button-upload-avatar"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                      <input id="avatar-upload-input" type="file" accept="image/*" onChange={(e) => { handleAvatarUpload?.(e); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ fontSize: '200px' }} disabled={uploadingPhoto} aria-label="Change avatar" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Business info card: black text on light background */}
          <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {user.businessName || user.name || `@${user.username}`}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center h-7 rounded-full px-3 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                  Nearby Business
                </span>
                {user.businessType && (
                  <span className="inline-flex items-center h-7 rounded-full px-3 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                    {user.businessType}
                  </span>
                )}
              </div>
              <div className="space-y-2.5 text-gray-900 dark:text-gray-100">
                {user.streetAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([user.streetAddress, user.city, user.state, user.zipCode, user.country].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
                    data-testid="link-business-address"
                  >
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-gray-600 dark:text-gray-400" />
                    <span className="break-words text-left">{[user.streetAddress, user.zipCode, user.city, user.state, user.country].filter(Boolean).join(', ')}</span>
                  </a>
                )}
                {user.phoneNumber && (
                  <a href={`tel:${user.phoneNumber}`} className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0" data-testid="link-business-phone">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <span className="truncate" title={user.phoneNumber}>{user.phoneNumber}</span>
                  </a>
                )}
                {user.email && (
                  <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0" data-testid="link-business-email">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </a>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
                    data-testid="link-business-website"
                  >
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <span className="truncate text-left" title={user.websiteUrl}>{user.websiteUrl.replace(new RegExp('^https?:\\/\\/', 'i'), '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <ProfileHeaderUser {...props} />
      )}
    </>
  );
}
