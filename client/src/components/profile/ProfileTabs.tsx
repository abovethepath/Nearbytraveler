import React from "react";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { MapPin, Camera, Globe, Users, Calendar, Star, Edit, Edit2, Heart, MessageSquare, X, Plus, Package, TrendingUp, Zap, Shield, ChevronRight, AlertCircle, Phone, Building2, ThumbsUp, Sparkles, Award, MessageCircle, EyeOff, Share2 } from "lucide-react";
import { calculateAge } from "@/lib/ageUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { VideoIntroPlayer } from "@/components/VideoIntro";
import TravelPlansWidget from "@/components/TravelPlansWidget";
import { SimpleAvatar } from "@/components/simple-avatar";
import { StealthToggle } from "@/components/stealth-toggle";
import { StealthToggleInline } from "@/components/stealth-toggle-inline";
import { LocationSharingSection } from "@/components/LocationSharingSection";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";
import FriendReferralWidget from "@/components/friend-referral-widget";
import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import ReferencesWidgetNew from "@/components/references-widget-new";
import { VouchWidget } from "@/components/vouch-widget";
import { VouchButton } from "@/components/VouchButton";
import { ConditionalVouchCard } from "@/components/ConditionalVouchCard";
import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";
import BusinessEventsWidget from "@/components/business-events-widget";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";
import { MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, ALL_ACTIVITIES, ALL_INTERESTS } from "@shared/base-options";
import type { ProfilePageProps } from "./profile-complete-types";

export function ProfileTabs(props: ProfilePageProps) {
  const {
    activeTab, openTab, user, setLocation, isOwnProfile, userConnections, photos, userTravelMemories, userReferences, travelPlans, userVouches, setTriggerQuickMatch, setTriggerQuickMeetup, triggerQuickMeetup, isProfileIncomplete, setIsEditMode, editFormData, isEditingPublicInterests, setIsEditingPublicInterests, setActiveEditSection, setEditFormData, effectiveUserId, queryClient, toast, tabRefs, loadedTabs, showConnectionFilters, setShowConnectionFilters, connectionFilters, setConnectionFilters, sortedUserConnections, connectionsDisplayCount, setConnectionsDisplayCount, editingConnectionNote, setEditingConnectionNote, connectionNoteText, setConnectionNoteText, currentUser, showWriteReferenceModal, setShowWriteReferenceModal, showReferenceForm, setShowReferenceForm, referenceForm, createReference, connectionRequests, countriesVisited, tempCountries, setTempCountries, customCountryInput, setCustomCountryInput, editingCountries, updateCountries, userChatrooms, setShowChatroomList, vouches, compatibilityData, eventsGoing, eventsInterested, businessDealsLoading, businessDeals, ownerContactForm, setOwnerContactForm, editingOwnerInfo, updateOwnerContact, handleSaveOwnerContact, getMetropolitanArea, apiRequest, handleEditCountries, handleSaveCountries, handleCancelCountries, COUNTRIES_OPTIONS, GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, safeGetAllActivities, getApiBaseUrl, getHometownInterests, getTravelInterests, getProfileInterests, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, ALL_INTERESTS, ALL_ACTIVITIES, customInterestInput, setCustomInterestInput, customActivityInput, setCustomActivityInput, editingInterests, editingActivities, showCreateDeal, setShowCreateDeal, quickDeals, setShowFullGallery, setSelectedPhotoIndex, uploadingPhoto, EventOrganizerHubSection, editingLanguages, handleEditLanguages, LANGUAGES_OPTIONS, tempLanguages, setTempLanguages, customLanguageInput, setCustomLanguageInput, handleSaveLanguages, handleCancelLanguages, updateLanguages
  } = props as Record<string, any>;

  return (
    <div className="min-h-screen profile-page w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main Content Container - with overflow-x-hidden for rest of page */}

      {/* Navigation Tabs - Card Style with Border (desktop: closer to hero; iOS: unchanged) */}
      <div className={`w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 sm:px-6 lg:px-10 py-4 mx-4 sm:mx-6 lg:mx-8 rounded-lg shadow-sm ${isNativeIOSApp() ? 'mt-4' : 'mt-2 sm:mt-2 lg:mt-1'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <button
                role="tab"
                aria-selected={activeTab === 'contacts'}
                aria-controls="panel-contacts"
                onClick={() => openTab('contacts')}
                className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'contacts'
                    ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                }`}
                data-testid="tab-contacts"
              >
                Contacts
                {!!(userConnections?.length) && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'contacts' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {userConnections.length}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'photos'}
                aria-controls="panel-photos"
                onClick={() => openTab('photos')}
                className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'photos'
                    ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                }`}
                data-testid="tab-photos"
              >
                Photos
                {!!(photos.length + (userTravelMemories?.length || 0)) && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'photos' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    {photos.length + (userTravelMemories?.length || 0)}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'references'}
                aria-controls="panel-references"
                onClick={() => openTab('references')}
                className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'references'
                    ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                }`}
                data-testid="tab-references"
              >
                References
                {userReferences.length > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'references' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {userReferences.length}
                  </span>
                )}
              </button>

              {user?.userType !== 'business' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'travel'}
                  aria-controls="panel-travel"
                  onClick={() => openTab('travel')}
                  className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'travel'
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                  }`}
                  data-testid="tab-travel"
                >
                  Travel Plans
                  {!!(travelPlans?.length) && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === 'travel' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {travelPlans.length}
                    </span>
                  )}
                </button>
              )}

              {user?.userType !== 'business' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'countries'}
                  aria-controls="panel-countries"
                  onClick={() => openTab('countries')}
                  className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'countries'
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                  }`}
                  data-testid="tab-countries"
                >
                  Countries
                  {!!(countriesVisited?.length) && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === 'countries' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}>
                      {countriesVisited.length}
                    </span>
                  )}
                </button>
              )}

              {isOwnProfile && user?.userType !== 'business' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'chatrooms'}
                  aria-controls="panel-chatrooms"
                  onClick={() => openTab('chatrooms')}
                  className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'chatrooms'
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                  }`}
                  data-testid="tab-chatrooms"
                >
                  Chatrooms
                  {!!(userChatrooms?.length) && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === 'chatrooms' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-500 text-white'
                    }`}>
                      {userChatrooms.length}
                    </span>
                  )}
                </button>
              )}

              {/* Menu Tab - Native app only, opens menu at bottom */}
              {isNativeIOSApp() && isOwnProfile && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'menu'}
                  aria-controls="panel-menu"
                  onClick={() => openTab('menu')}
                  className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'menu'
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                  }`}
                  data-testid="tab-menu"
                >
                  Menu
                </button>
              )}

              {/* Vouches Tab - Shows alongside Travel Plans and Countries for non-business users */}
              {user?.userType !== 'business' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'vouches'}
                  aria-controls="panel-vouches"
                  onClick={() => openTab('vouches')}
                  className={`text-sm sm:text-base font-semibold px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'vouches'
                      ? 'bg-purple-600 text-white border border-purple-600 shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:border-gray-400'
                  }`}
                  data-testid="tab-vouches"
                >
                  Vouches
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === 'vouches' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    {userVouches?.length || 0}
                  </span>
                </button>
              )}
            </div>
            
            {/* Let's Meet Now CTA - Only for OWN profile, travelers and locals, not businesses */}
            {isOwnProfile && user?.userType !== 'business' && (
              <Button
                onClick={() => {
                  // Simply scroll to the QuickMeetupWidget and trigger the create form
                  const widget = document.querySelector('[data-testid="quick-meet-widget"]');
                  if (widget) {
                    widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  // Trigger the create form without rapid state changes
                  setTriggerQuickMeetup(true);
                  // Reset after scrolling completes
                  setTimeout(() => setTriggerQuickMeetup(false), 500);
                }}
                className="bg-gradient-to-r from-blue-500 to-orange-500 border-0 hover:from-blue-600 hover:to-orange-600 
                           px-4 sm:px-6 py-2 sm:py-2 text-sm font-medium rounded-lg
                           w-full sm:w-auto flex items-center justify-center transition-all duration-200"
                style={{ color: 'black' }}
                data-testid="button-lets-meet-now"
              >
                <Calendar className="w-4 h-4 mr-2" style={{ color: 'black' }} />
                <span style={{ color: 'black' }}>Let's Meet Now</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content section - Mobile Responsive Layout */}
      <div className={`w-full max-w-full mx-auto ${isNativeIOSApp() && activeTab === 'menu' ? 'pb-2' : 'pb-20 sm:pb-4'} px-2 sm:px-4 lg:px-6 mt-2 overflow-x-hidden box-border`}>
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Main Content Column */}
          <div className="w-full lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">

            {/* About Section - Always Visible */}
            <Card className="mt-2 relative overflow-visible bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-base sm:text-lg lg:text-xl font-bold break-words text-left leading-tight flex-1 pr-2 text-gray-900 dark:text-white">
                    {user?.userType === 'business'
                      ? `ABOUT OUR BUSINESS`
                      : `ABOUT ${user?.username || 'User'}`}
                  </CardTitle>

                  {isOwnProfile && (
                    <div className="relative flex items-center gap-2">
                      {isProfileIncomplete() && (
                        <span className="text-orange-500 dark:text-orange-400 text-sm font-semibold whitespace-nowrap animate-pulse flex items-center gap-1">
                          Fill out bio
                          <span className="inline-block">&#8594;</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditMode(true);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-transparent dark:border-gray-400 ${isProfileIncomplete() ? 'bg-red-500 hover:bg-red-600 text-white dark:ring-2 dark:ring-red-400 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white dark:ring-2 dark:ring-gray-400'}`}
                        style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', cursor: 'pointer', touchAction: 'manipulation' }}
                        data-testid="button-edit-profile"
                      >
                        <span className="text-white font-medium">Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 min-w-0 break-words overflow-visible text-gray-700 dark:text-gray-300">
                {/* Bio / Business Description */}
                <div>
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words text-left">
                    {user?.userType === 'business'
                      ? (user?.businessDescription || "No business description available yet.")
                      : (user?.bio || "No bio available yet.")
                    }
                  </p>
                </div>

                {user?.userType !== 'business' && (
                  <VideoIntroPlayer
                    userId={user.id}
                    isOwnProfile={isOwnProfile}
                    hasVideo={!!user.videoIntroUrl}
                  />
                )}

                {/* Business Contact Information - Prominent placement for business profiles */}
                {user?.userType === 'business' && (
                  <div className="space-y-3 border-t pt-4 mt-4 bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                      <Phone className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      {user.streetAddress && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Address:</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.streetAddress + (user.zipCode ? `, ${user.zipCode}` : '') + (user.city ? `, ${user.city}, ${user.state || ''}, ${user.country || ''}` : ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline break-words transition-colors font-medium min-w-0"
                          >
                            {user.streetAddress}{user.zipCode && `, ${user.zipCode}`}
                          </a>
                        </div>
                      )}
                      
                      {user.phoneNumber && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Phone:</span>
                          <a
                            href={`tel:${user.phoneNumber}`}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline break-words transition-colors font-medium min-w-0"
                          >
                            {user.phoneNumber}
                          </a>
                        </div>
                      )}
                      
                      {user.email && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Email:</span>
                          <a
                            href={`mailto:${user.email}`}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline break-words transition-colors font-medium min-w-0"
                          >
                            {user.email}
                          </a>
                        </div>
                      )}
                      
                      {user.websiteUrl && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Website:</span>
                          <a 
                            href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline break-words transition-colors font-medium min-w-0"
                          >
                            {user.websiteUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Business Ownership Categories */}
                    {(user.isVeteran || user.isActiveDuty || (user.isMinorityOwned && user.showMinorityOwned) || (user.isFemaleOwned && user.showFemaleOwned) || (user.isLGBTQIAOwned && user.showLGBTQIAOwned)) && (
                      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        <h5 className="font-medium text-gray-800 dark:text-gray-200">Business Ownership</h5>
                        
                        <div className="flex flex-wrap gap-2">
                          {user.isVeteran && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm font-medium">
                              <span className="text-green-600 dark:text-green-400">âœ“</span>
                              Veteran Owned
                            </div>
                          )}
                          {user.isActiveDuty && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium">
                              <span className="text-blue-600 dark:text-blue-400">âœ“</span>
                              Active Duty Owned
                            </div>
                          )}
                          {user.isMinorityOwned && user.showMinorityOwned && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 rounded-full text-sm font-medium">
                              <span className="text-purple-600 dark:text-purple-400">âœ“</span>
                              Minority Owned
                            </div>
                          )}
                          {user.isFemaleOwned && user.showFemaleOwned && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100 rounded-full text-sm font-medium">
                              <span className="text-pink-600 dark:text-pink-400">âœ“</span>
                              Female Owned
                            </div>
                          )}
                          {user.isLGBTQIAOwned && user.showLGBTQIAOwned && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-100 via-yellow-100 to-purple-100 dark:from-red-900 dark:via-yellow-900 dark:to-purple-900 text-purple-800 dark:text-purple-100 rounded-full text-sm font-medium">
                              <span className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">âœ“</span>
                              LGBTQIA+ Owned
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metropolitan Area (optional) - Non-business users only */}
                {user?.userType !== 'business' && user.hometownCity && user.hometownState && user.hometownCountry && (() => {
                  const metroArea = getMetropolitanArea(user.hometownCity, user.hometownState, user.hometownCountry);
                  if (!metroArea) return null;
                  return (
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg dark:from-gray-800/50 dark:to-gray-700/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metropolitan Area:</span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{metroArea}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Basic Info â€” grid so lines never run together */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">From:</span>
                    <span className="text-gray-900 dark:text-gray-100 break-words min-w-0">
                      {user?.userType === 'business'
                        ? (user?.location || user?.hometownCity || "Los Angeles, CA")
                        : (() => {
                            const parts = [user?.hometownCity, user?.hometownState, user?.hometownCountry].filter(Boolean);
                            return parts.length > 0 ? parts.join(', ') : "Not specified";
                          })()
                      }
                    </span>
                  </div>

                  {user?.userType !== 'business' && user?.gender && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Gender:</span>
                      <span className="capitalize text-gray-900 dark:text-gray-100 break-words min-w-0">{user?.gender?.replace('-', ' ')}</span>
                    </div>
                  )}

                  {/* Children Info for non-business users */}
                  {user?.userType !== 'business' && user?.childrenAges && user?.childrenAges !== 'None' && user?.childrenAges.trim() !== '' && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Children:</span>
                      <span className="text-gray-900 dark:text-gray-100 break-words min-w-0">Ages {user.childrenAges}</span>
                    </div>
                  )}

                  {user.sexualPreferenceVisible && user.sexualPreference && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Preference:</span>
                      <span className="text-gray-900 dark:text-gray-100 break-words min-w-0">
                        {Array.isArray(user.sexualPreference) 
                          ? user.sexualPreference.join(', ')
                          : typeof user.sexualPreference === 'string'
                          ? (user.sexualPreference as string).split(',').join(', ')
                          : user.sexualPreference
                        }
                      </span>
                    </div>
                  )}

                  {user.userType !== 'business' && user.ageVisible && user.dateOfBirth && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Age:</span>
                      <span className="text-gray-900 dark:text-gray-100 break-words min-w-0">{calculateAge(user.dateOfBirth)} years old</span>
                    </div>
                  )}

                  {/* Military Status for non-business users */}
                  {user.userType !== 'business' && (user.isVeteran || (user as any).is_veteran || user.isActiveDuty || (user as any).is_active_duty) && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0">Military:</span>
                      <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex items-center gap-2">
                        {(user.isVeteran || (user as any).is_veteran) && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400">
                            <span className="text-green-600">âœ“</span>
                            Veteran
                          </span>
                        )}
                        {(user.isActiveDuty || (user as any).is_active_duty) && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                            <span className="text-blue-600">âœ“</span>
                            Active Duty
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Secret Activities Section - Separate Card */}
            {user?.userType !== 'business' && user?.secretActivities && (
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-800/50 dark:to-purple-700/40 border border-purple-200 dark:border-purple-500">
                <CardContent className="p-4">
                  <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Secret things I would do if my closest friends came to town
                  </h5>
                  <p className="text-gray-700 dark:text-purple-200 text-sm italic whitespace-pre-wrap break-words">
                    {user?.secretActivities}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Business Deals Section - Only for business users */}
            {user?.userType === 'business' && (
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                    <span>Business Deals</span>
                    {isOwnProfile && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          console.log('ðŸ”¥ CREATE OFFER clicked, navigating to business dashboard');
                          setLocation('/business-dashboard');
                        }}
                        className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Offer
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 p-6">
                  {businessDealsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : businessDeals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No business deals created yet</p>
                      {isOwnProfile && (
                        <p className="text-sm mt-2">Create your first deal to attract customers!</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessDeals.slice(0, 3).map((deal: any) => (
                        <div 
                          key={deal.id} 
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg dark:hover:shadow-gray-800/50 transition-all cursor-pointer bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-500"
                          onClick={() => {
                            // Navigate to deals page with this specific deal
                            setLocation(`/deals?dealId=${deal.id}`);
                          }}
                          data-testid={`deal-card-${deal.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{deal.title}</h4>
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-bold whitespace-nowrap leading-none bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                                {(() => {
                                  // Format discount display based on deal type
                                  const value = deal.discountValue?.trim() || '';
                                  const type = deal.discountType?.toLowerCase() || '';
                                  
                                  // If it's already well-formatted, return as-is
                                  if (value.includes('%') && value.includes('OFF')) return value;
                                  if (value.toUpperCase().includes('BOGO')) return 'BOGO';
                                  if (value.toUpperCase().includes('FREE')) return value;
                                  
                                  // Format based on type
                                  if (type === 'percentage') return `${value}% OFF`;
                                  if (type === 'fixed_amount') return `$${value} OFF`;
                                  if (type === 'buy_one_get_one') return 'BOGO';
                                  if (type === 'free_service') return '100% FREE';
                                  
                                  // Default: just add % OFF if it's a number
                                  if (!isNaN(parseFloat(value))) return `${value}% OFF`;
                                  
                                  return value;
                                })()}
                              </div>
                              {isOwnProfile && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click when editing
                                    setLocation(`/business-dashboard?editDeal=${deal.id}`);
                                  }}
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                  data-testid={`button-edit-deal-${deal.id}`}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 text-sm mb-3 line-clamp-2">{deal.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Valid until {new Date(deal.validUntil).toLocaleDateString()}</span>
                            <span className="capitalize">{deal.category}</span>
                          </div>
                        </div>
                      ))}
                      {businessDeals.length > 3 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation('/deals')}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            View All {businessDeals.length} Deals
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Interests, Activities & Events - Business (for matching with users); shown right after Deals */}
            {user?.userType === 'business' && (
              <>
                <Card id="business-interests-activities-section">
                  <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Heart className="w-5 h-5 text-orange-500" />
                        Interests & Activities
                      </CardTitle>
                      {isOwnProfile && (
                        <Button
                          onClick={() => {
                            const userInterests = [...(user?.interests || [])];
                            const userActivities = [...(user?.activities || [])];
                            if (user?.customInterests) {
                              user.customInterests.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((item: string) => {
                                if (!userInterests.includes(item)) userInterests.push(item);
                              });
                            }
                            if (user?.customActivities) {
                              user.customActivities.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((item: string) => {
                                if (!userActivities.includes(item)) userActivities.push(item);
                              });
                            }
                            setEditFormData({ interests: userInterests, activities: userActivities });
                            setIsEditingPublicInterests(true);
                            setActiveEditSection('activities');
                            setTimeout(() => {
                              const el = document.getElementById('business-interests-activities-edit-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 text-black px-4 py-2 text-sm shrink-0"
                          size="sm"
                          data-testid="button-edit-interests-activities"
                        >
                          <Edit2 className="w-4 h-4 mr-1 text-black" />
                          <span className="text-black">Edit</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const allInterests = [...(user?.interests || [])];
                      const allActivities = [...(user?.activities || [])];
                      if (user?.customInterests) {
                        user.customInterests.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((item: string) => {
                          if (!allInterests.includes(item)) allInterests.push(item);
                        });
                      }
                      if (user?.customActivities) {
                        user.customActivities.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((item: string) => {
                          if (!allActivities.includes(item)) allActivities.push(item);
                        });
                      }
                      return (
                        <>
                          {allInterests.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests (for matching)</h4>
                              <div className="flex flex-wrap gap-2">
                                {allInterests.map((interest, index) => (
                                  <span key={`bi-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {allActivities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activities (for matching)</h4>
                              <div className="flex flex-wrap gap-2">
                                {allActivities.map((activity, index) => (
                                  <span key={`ba-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(allInterests.length === 0 && allActivities.length === 0) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add interests and activities in Edit to match with travelers and locals.</p>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Calendar className="w-5 h-5" />
                      Our Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BusinessEventsWidget userId={effectiveUserId || 0} />
                  </CardContent>
                </Card>
              </>
            )}

            {/* What You Have in Common Section - Separate Card for clean mobile layout */}
            {!isOwnProfile && currentUser && user?.id && user?.userType !== 'business' && (
              <Card>
                <CardContent className="p-0">
                  <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
                </CardContent>
              </Card>
            )}

            {/* Interests, Activities & Events Section */}
            {user?.userType !== 'business' && (
            <Card id="interests-activities-section">
              <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Heart className="w-5 h-5 text-red-500" />
                    Interests & Activities
                  </CardTitle>
                  {isOwnProfile && !isEditingPublicInterests && (
                    <Button
                      onClick={() => {
                        const userInterests = user?.interests || [];
                        const customInterests = user?.customInterests ? user.customInterests.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                        const allInterests = [...userInterests, ...customInterests];
                        
                        const userActivities = user?.activities || [];
                        const customActivities = user?.customActivities ? user.customActivities.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                        const allActivities = [...userActivities, ...customActivities];
                        
                        setIsEditingPublicInterests(true);
                        setEditFormData({
                          interests: allInterests,
                          activities: allActivities
                        });
                      }}
                      className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 text-black px-4 py-2 text-sm shrink-0"
                      size="sm"
                      data-testid="button-edit-interests"
                    >
                      <Edit2 className="w-4 h-4 mr-1 text-black" />
                      <span className="text-black">Edit</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6 pb-4 sm:pb-6 break-words overflow-hidden">

                {/* EDIT MODE - Single scrolling form with all sections */}
                {isOwnProfile && isEditingPublicInterests ? (
                  <div className="p-4 sm:p-6 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-6">

                    {/* TOP SAVE/CANCEL BUTTONS */}
                    <div className="flex gap-2 pb-4 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10 bg-white dark:bg-gray-800 -mt-2 pt-2">
                      <Button 
                        onClick={async () => {
                          try {
                            const allInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];
                            const predefinedInterests = editFormData.interests.filter(int => allInterests.includes(int));
                            const customInterests = editFormData.interests.filter(int => !allInterests.includes(int));
                            const predefinedActivities = editFormData.activities.filter(act => ALL_ACTIVITIES.includes(act));
                            const customActivities = editFormData.activities.filter(act => !ALL_ACTIVITIES.includes(act));
                            const saveData = {
                              interests: predefinedInterests,
                              customInterests: customInterests.join(', '),
                              activities: predefinedActivities,
                              customActivities: customActivities.join(', ')
                            };
                            const apiBase = getApiBaseUrl();
                            const response = await fetch(`${apiBase}/api/users/${user.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify(saveData)
                            });
                            if (!response.ok) throw new Error('Failed to save');
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
                            setIsEditingPublicInterests(false);
                            setTimeout(() => {
                              const section = document.getElementById('interests-activities-section');
                              if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          } catch (error) {
                            console.error('Failed to update:', error);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Save All
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingPublicInterests(false)}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {/* TOP CHOICES / INTERESTS SECTION */}
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Top Interests</h3>
                      <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                        {MOST_POPULAR_INTERESTS.map((interest) => {
                          const isSelected = editFormData.interests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setEditFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                                }
                              }}
                              className={`h-8 px-3 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-md'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* OTHER INTERESTS SECTION */}
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Other Interests</h3>
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border">
                        {ADDITIONAL_INTERESTS.map((interest) => {
                          const isSelected = editFormData.interests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setEditFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                                }
                              }}
                              className={`h-8 px-3 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-md'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Input
                          placeholder="Add custom interest..."
                          value={customInterestInput}
                          onChange={(e) => setCustomInterestInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customInterestInput.trim();
                              if (trimmed && !editFormData.interests.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                                setCustomInterestInput('');
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const trimmed = customInterestInput.trim();
                            if (trimmed && !editFormData.interests.includes(trimmed)) {
                              setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                              setCustomInterestInput('');
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Display Custom Interests with Delete Option */}
                      {(() => {
                        const allPredefinedInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];
                        const customInterests = editFormData.interests.filter(interest => !allPredefinedInterests.includes(interest));
                        return customInterests.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Your Custom Interests (click X to remove):</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditFormData(prev => ({ 
                                    ...prev, 
                                    interests: prev.interests.filter(i => allPredefinedInterests.includes(i)) 
                                  }));
                                }}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-6"
                              >
                                Clear All Custom
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {customInterests.map((interest, index) => (
                                <button
                                  key={`custom-interest-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setEditFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                                  }}
                                  className="inline-flex items-center justify-center h-8 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-blue-400 to-orange-400 text-white shadow-md gap-1.5 hover:opacity-80 transition-opacity"
                                  title="Click to remove"
                                >
                                  {interest}
                                  <span className="ml-1 font-bold">Ã—</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ACTIVITIES SECTION */}
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Activities</h3>
                      <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                        {ALL_ACTIVITIES.map((activity) => {
                          const isSelected = editFormData.activities.includes(activity);
                          return (
                            <button
                              key={activity}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setEditFormData(prev => ({ ...prev, activities: prev.activities.filter(a => a !== activity) }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, activities: [...prev.activities, activity] }));
                                }
                              }}
                              className={`h-8 px-3 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-md'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {activity}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Input
                          placeholder="Add custom activity..."
                          value={customActivityInput}
                          onChange={(e) => setCustomActivityInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customActivityInput.trim();
                              if (trimmed && !editFormData.activities.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                                setCustomActivityInput('');
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const trimmed = customActivityInput.trim();
                            if (trimmed && !editFormData.activities.includes(trimmed)) {
                              setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                              setCustomActivityInput('');
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Display Custom Activities with Delete Option - Filter out city-prefixed activities */}
                      {(() => {
                        // Filter out predefined activities AND city-prefixed activities (e.g., "New York City: Brunch")
                        const customActivities = editFormData.activities.filter(activity => 
                          !ALL_ACTIVITIES.includes(activity) && !activity.includes(':')
                        );
                        const cityActivities = editFormData.activities.filter(activity => 
                          !ALL_ACTIVITIES.includes(activity) && activity.includes(':')
                        );
                        
                        return (
                          <>
                            {/* City-specific activities note */}
                            {cityActivities.length > 0 && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                  <strong>{cityActivities.length} city-specific activities</strong> are managed in City Plans:
                                </p>
                                <a 
                                  href="/match-in-city" 
                                  className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-200"
                                >
                                  Go to City Plans page to manage city activities â†’
                                </a>
                              </div>
                            )}
                            
                            {/* Generic custom activities */}
                            {customActivities.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Your Custom Activities (click X to remove):</p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditFormData(prev => ({ 
                                        ...prev, 
                                        activities: prev.activities.filter(a => ALL_ACTIVITIES.includes(a) || a.includes(':')) 
                                      }));
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-6"
                                  >
                                    Clear All Custom
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {customActivities.map((activity, index) => (
                                    <button
                                      key={`custom-activity-${index}`}
                                      type="button"
                                      onClick={() => {
                                        setEditFormData(prev => ({ ...prev, activities: prev.activities.filter(a => a !== activity) }));
                                      }}
                                      className="inline-flex items-center justify-center h-8 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-md gap-1.5 hover:opacity-80 transition-opacity"
                                      title="Click to remove"
                                    >
                                      {activity}
                                      <span className="ml-1 font-bold">Ã—</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* SAVE/CANCEL BUTTONS */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button 
                        onClick={async () => {
                          try {
                            const allInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];
                            const allActivities = ALL_ACTIVITIES;
                            
                            const predefinedInterests = editFormData.interests.filter(int => allInterests.includes(int));
                            const customInterests = editFormData.interests.filter(int => !allInterests.includes(int));
                            
                            const predefinedActivities = editFormData.activities.filter(act => allActivities.includes(act));
                            const customActivities = editFormData.activities.filter(act => !allActivities.includes(act));
                            
                            const saveData = {
                              interests: predefinedInterests,
                              customInterests: customInterests.join(', '),
                              activities: predefinedActivities,
                              customActivities: customActivities.join(', ')
                            };
                            
                            const apiBase = getApiBaseUrl();
                            const response = await fetch(`${apiBase}/api/users/${user.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify(saveData)
                            });
                            if (!response.ok) throw new Error('Failed to save');
                            
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
                            setIsEditingPublicInterests(false);
                            setTimeout(() => {
                              const section = document.getElementById('interests-activities-section');
                              if (section) {
                                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          } catch (error) {
                            console.error('Failed to update:', error);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Save All
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingPublicInterests(false)}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>

                  </div>
                ) : (
                  /* VIEW MODE - Display interests, activities, events */
                  <div className="space-y-6">
                    
                    {(() => {
                      // Split interests into Top Choices and Additional Interests to match edit mode
                      const topChoices = MOST_POPULAR_INTERESTS;
                      const additionalInterests = ADDITIONAL_INTERESTS;
                      
                      const userTopInterests = (user?.interests || []).filter(i => topChoices.includes(i));
                      const userOtherInterests = (user?.interests || []).filter(i => additionalInterests.includes(i));
                      const userCustomInterests = user?.customInterests ? user.customInterests.split(',').map(s => s.trim()).filter(Boolean) : [];
                      
                      return (
                        <>
                          {/* TOP INTERESTS */}
                          {userTopInterests.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-blue-500" />
                                Top Interests
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {userTopInterests.map((interest, index) => (
                                  <div 
                                    key={`top-interest-${index}`} 
                                    className="h-8 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-orange-500 flex items-center"
                                    style={{ color: 'black' }}
                                  >
                                    <span style={{ color: 'black' }}>{interest}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* OTHER INTERESTS */}
                          {(userOtherInterests.length > 0 || userCustomInterests.length > 0) && (
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-blue-500" />
                                Other Interests
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {userOtherInterests.map((interest, index) => (
                                  <div 
                                    key={`other-interest-${index}`} 
                                    className="h-8 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-blue-400 to-orange-400 shadow-md flex items-center"
                                    style={{ color: 'black' }}
                                  >
                                    <span style={{ color: 'black' }}>{interest}</span>
                                  </div>
                                ))}
                                {userCustomInterests.map((interest, index) => (
                                  <div 
                                    key={`custom-interest-${index}`} 
                                    className="h-8 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-blue-400 to-orange-400 shadow-md flex items-center"
                                    style={{ color: 'black' }}
                                  >
                                    <span style={{ color: 'black' }}>{interest}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show "no interests" message only if truly empty */}
                          {userTopInterests.length === 0 && userOtherInterests.length === 0 && userCustomInterests.length === 0 && (
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-blue-500" />
                                Interests
                              </h4>
                              <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                                {isOwnProfile ? "Click Edit to add your interests" : "No interests added yet"}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* ACTIVITIES */}
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-500" />
                        Activities
                      </h4>
                      {(() => {
                        // Filter out city-prefixed activities (like "Los Angeles Metro: WALKING GROUPS") 
                        // since they're already shown in "Things I Want to Do" section below
                        const rawActivities = [...(user?.activities || []), ...(user?.customActivities ? user.customActivities.split(',').map(s => s.trim()).filter(Boolean) : [])];
                        const allActivities = rawActivities.filter(activity => !activity.includes(':'));
                        
                        return allActivities.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {allActivities.map((activity, index) => (
                              <div 
                                key={`activity-${index}`} 
                                className="h-8 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-blue-700 to-blue-400 shadow-md flex items-center"
                                style={{ color: 'black' }}
                              >
                                <span style={{ color: 'black' }}>{activity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                            {isOwnProfile ? "Click Edit to add activities you enjoy" : "No activities added yet"}
                          </p>
                        );
                      })()}
                    </div>

                  </div>
                )}

              </CardContent>
            </Card>
            )}


            {/* Things I Want to Do Widget - Show for all non-business profiles */}
            {user?.userType !== 'business' && (
              <ThingsIWantToDoSection
                userId={effectiveUserId || 0}
                isOwnProfile={isOwnProfile}
              />
            )}

            {/* Business Interests, Activities & Events Section - For business users only */}
            {user?.userType === 'business' && (
            <Card id="business-interests-activities-edit-section">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-orange-500" />
                    Business Interests, Activities & Events
                  </CardTitle>
                  {/* Single Edit Button for All Business Preferences - TOP RIGHT */}
                  {isOwnProfile && !editingInterests && !editingActivities && (
                    <Button
                      onClick={() => {
                        console.log('ðŸ”§ BUSINESS EDIT - Starting:', { 
                          user,
                          hasCustomInterests: !!user?.customInterests,
                          hasCustomActivities: !!user?.customActivities,
                          customInterests: user?.customInterests,
                          customActivities: user?.customActivities
                        });
                        
                        // Open ALL editing modes at once for business users
                        setIsEditingPublicInterests(true);
                        setActiveEditSection('activities');
                        
                        // Initialize form data with combined predefined + custom entries
                        const userInterests = [...(user?.interests || [])];
                        const userActivities = [...(user?.activities || [])];
                        
                        // Add custom fields from database to the arrays for display
                        if (user?.customInterests) {
                          const customInterests = user.customInterests.split(',').map(s => s.trim()).filter(s => s);
                          console.log('ðŸ”§ Processing custom interests:', customInterests);
                          customInterests.forEach(item => {
                            if (!userInterests.includes(item)) {
                              userInterests.push(item);
                            }
                          });
                        }
                        if (user?.customActivities) {
                          const customActivities = user.customActivities.split(',').map(s => s.trim()).filter(s => s);
                          console.log('ðŸ”§ Processing custom activities:', customActivities);
                          customActivities.forEach(item => {
                            if (!userActivities.includes(item)) {
                              userActivities.push(item);
                            }
                          });
                        }
                        
                        console.log('ðŸ”§ BUSINESS EDIT - Final arrays:', { 
                          finalInterests: userInterests,
                          finalActivities: userActivities
                        });
                        
                        setEditFormData({
                          interests: userInterests,
                          activities: userActivities
                        });
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 break-words overflow-hidden">

                {/* Display current business interests/activities when not editing */}
                {(!editingInterests || !editingActivities) && (
                  <div className="space-y-4">
                    {(() => {
                      // Combine predefined and custom fields for display
                      const allInterests = [...(user?.interests || [])];
                      const allActivities = [...(user?.activities || [])];
                      
                      // Add custom interests
                      if (user?.customInterests) {
                        const customInterests = user.customInterests.split(',').map(s => s.trim()).filter(s => s);
                        customInterests.forEach(item => {
                          if (!allInterests.includes(item)) {
                            allInterests.push(item);
                          }
                        });
                      }
                      
                      // Add custom activities
                      if (user?.customActivities) {
                        const customActivities = user.customActivities.split(',').map(s => s.trim()).filter(s => s);
                        customActivities.forEach(item => {
                          if (!allActivities.includes(item)) {
                            allActivities.push(item);
                          }
                        });
                      }
                      
                      return (
                        <>
                          {allInterests.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Interests</h4>
                              <div className="flex flex-wrap gap-2">
                                {allInterests.map((interest, index) => (
                                  <div key={`interest-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                                    {interest}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {allActivities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Activities</h4>
                              <div className="flex flex-wrap gap-2">
                                {allActivities.map((activity, index) => (
                                  <div key={`activity-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                                    {activity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {(allInterests.length === 0 && allActivities.length === 0) && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Click "Edit Business Preferences" to add your business interests and activities</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Business Edit Form - Reuse the same unified editing system */}
                {isOwnProfile && (editingInterests && editingActivities) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Business Preferences</h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            try {
                              console.log('ðŸ”§ BUSINESS SAVING DATA:', editFormData);
                              
                              // Separate predefined vs custom entries for proper database storage
                              const predefinedInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].filter(opt => editFormData.interests.includes(opt));
                              const predefinedActivities = safeGetAllActivities().filter(opt => (editFormData.activities || []).includes(opt));
                              
                              const allPredefinedInterests = [...getHometownInterests(), ...getTravelInterests(), ...getProfileInterests()];
                              const customInterests = editFormData.interests.filter(int => !allPredefinedInterests.includes(int));
                              const customActivities = (editFormData.activities || []).filter(act => !safeGetAllActivities().includes(act));
                              
                              const saveData = {
                                interests: predefinedInterests,
                                activities: predefinedActivities,
                                customInterests: customInterests.join(', '),
                                customActivities: customActivities.join(', ')
                              };
                              
                              console.log('ðŸ”§ BUSINESS SAVE - Separated data:', saveData);
                              
                              const apiBase = getApiBaseUrl();
                              const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  // CRITICAL FIX: Remove massive x-user-data header causing 431 error
                                  'x-user-id': effectiveUserId?.toString() || '',
                                  'x-user-type': user?.userType || 'business'
                                },
                                body: JSON.stringify(saveData)
                              });
                              
                              if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Failed to save: ${errorText}`);
                              }
                              
                              // Refresh data
                              queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                              // Close editing modes
                              setIsEditingPublicInterests(false);
                              setActiveEditSection(null);
                              
                              // Clear custom inputs
                              setCustomInterestInput('');
                              setCustomActivityInput('');
                              
                              toast({
                                title: "Success!",
                                description: "Business preferences saved successfully.",
                              });
                            } catch (error: any) {
                              console.error('Failed to update business preferences:', error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to save business preferences. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={false}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Save Business Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            // Cancel edits and close editing modes
                            setIsEditingPublicInterests(false);
                            setActiveEditSection(null);
                            setEditFormData({
                              interests: user?.interests || [],
                              activities: user?.activities || []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    
                    {/* Reuse the same editing interface structure from non-business users */}
                    <div className="space-y-6">
                      {/* Business Interests Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Heart className="w-5 h-5 text-orange-500" />
                          Business Interests (What travelers want - select what you offer)
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          {ALL_INTERESTS.map((interest, index) => {
                            const isSelected = editFormData.interests.includes(interest);
                            console.log(`ðŸ” Interest "${interest}" is ${isSelected ? 'SELECTED' : 'not selected'} in:`, editFormData.interests);
                            return (
                              <button
                                key={`business-interest-${interest}-${index}`}
                                type="button"
                                onClick={() => {
                                  const newInterests = isSelected
                                    ? editFormData.interests.filter((i: string) => i !== interest)
                                    : [...editFormData.interests, interest];
                                  setEditFormData({ ...editFormData, interests: newInterests });
                                }}
                                className={`inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white'
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom Business Interests Input */}
                        <div className="mt-3">
                          <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                            Add Custom Business Interests (hit Enter after each)
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="e.g., Sustainable Tourism, Local Partnerships"
                              value={customInterestInput}
                              onChange={(e) => setCustomInterestInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customInterestInput.trim();
                                  if (trimmed && !editFormData.interests.includes(trimmed)) {
                                    setEditFormData({ ...editFormData, interests: [...editFormData.interests, trimmed] });
                                    setCustomInterestInput('');
                                  }
                                }
                              }}
                              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customInterestInput.trim();
                                if (trimmed && !editFormData.interests.includes(trimmed)) {
                                  setEditFormData({ ...editFormData, interests: [...editFormData.interests, trimmed] });
                                  setCustomInterestInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Interests with Delete Option */}
                          {(() => {
                            const allPredefinedInterests = [...getHometownInterests(), ...getTravelInterests(), ...getProfileInterests()];
                            const customInterests = editFormData.interests.filter(interest => !allPredefinedInterests.includes(interest));
                            return customInterests.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Your Custom Interests (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {customInterests.map((interest, index) => (
                                  <span
                                    key={`custom-interest-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5"
                                  >
                                    {interest}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newInterests = editFormData.interests.filter(i => i !== interest);
                                        setEditFormData({ ...editFormData, interests: newInterests });
                                      }}
                                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                                    >
                                      Ã—
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                          })()}
                        </div>
                      </div>

                      {/* Business Activities Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-green-500" />
                          Business Activities (What travelers want to do - select what you offer)
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          {ALL_ACTIVITIES.map((activity, index) => {
                            const isSelected = (editFormData.activities ?? []).includes(activity);
                            return (
                              <button
                                key={`business-activity-${activity}-${index}`}
                                type="button"
                                onClick={() => {
                                  const current = editFormData.activities ?? [];
                                  const newActivities = isSelected
                                    ? current.filter((a: string) => a !== activity)
                                    : [...current, activity];
                                  setEditFormData({ ...editFormData, activities: newActivities });
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700'
                                }`}
                              >
                                {activity}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom Business Activities Input */}
                        <div className="mt-3">
                          <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                            Add Custom Business Activities (hit Enter after each)
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="e.g., Private Tours, Corporate Events"
                              value={customActivityInput}
                              onChange={(e) => setCustomActivityInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customActivityInput.trim();
                                  if (trimmed && !(editFormData.activities || []).includes(trimmed)) {
                                    setEditFormData({ ...editFormData, activities: [...(editFormData.activities || []), trimmed] });
                                    setCustomActivityInput('');
                                  }
                                }
                              }}
                              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customActivityInput.trim();
                                if (trimmed && !(editFormData.activities || []).includes(trimmed)) {
                                  setEditFormData({ ...editFormData, activities: [...(editFormData.activities || []), trimmed] });
                                  setCustomActivityInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Activities with Delete Option */}
                          {(Array.isArray(editFormData.activities) ? editFormData.activities.filter(activity => !safeGetAllActivities().includes(activity)) : []).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Activities (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(editFormData.activities) ? editFormData.activities.filter(activity => !safeGetAllActivities().includes(activity)) : []).map((activity, index) => (
                                  <span
                                    key={`custom-activity-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5"
                                  >
                                    {activity}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newActivities = (editFormData.activities || []).filter(a => a !== activity);
                                        setEditFormData({ ...editFormData, activities: newActivities });
                                      }}
                                      className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                                    >
                                      Ã—
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Button for Business Preferences */}
                {isOwnProfile && (editingInterests && editingActivities) && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-center">
                      <Button 
                        onClick={async () => {
                          try {
                            console.log('ðŸ”§ BUSINESS SAVING DATA (Bottom Button):', editFormData);
                            
                            // Separate predefined vs custom entries for proper database storage
                            const predefinedInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].filter(opt => editFormData.interests.includes(opt));
                            const predefinedActivities = safeGetAllActivities().filter(opt => (editFormData.activities || []).includes(opt));
                            
                            const customInterests = editFormData.interests.filter(int => !MOST_POPULAR_INTERESTS.includes(int) && !ADDITIONAL_INTERESTS.includes(int));
                            const customActivities = (editFormData.activities || []).filter(act => !safeGetAllActivities().includes(act));
                            
                            const saveData = {
                              interests: predefinedInterests,
                              activities: predefinedActivities,
                              customInterests: customInterests.join(', '),
                              customActivities: customActivities.join(', ')
                            };
                            
                            console.log('ðŸ”§ BUSINESS SAVE - Final payload:', JSON.stringify(saveData, null, 2));
                            
                            const apiBase = getApiBaseUrl();
                            const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                // CRITICAL FIX: Remove massive x-user-data header causing 431 error
                                'x-user-id': effectiveUserId?.toString() || '',
                                'x-user-type': user?.userType || 'business'
                              },
                              body: JSON.stringify(saveData)
                            });
                            
                            console.log('ðŸ”§ BUSINESS SAVE - Response status:', response.status);
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              console.error('ðŸ”´ BUSINESS SAVE - Error response:', errorText);
                              throw new Error(`Failed to save: ${response.status} ${errorText}`);
                            }
                            
                            const responseData = await response.json();
                            console.log('ðŸ”§ BUSINESS SAVE - Response data:', responseData);
                            
                            if (!response.ok) {
                              throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
                            }
                            
                            // Update cache and UI
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                            
                            // Close editing modes
                            setIsEditingPublicInterests(false);
                            setActiveEditSection(null);
                            
                            // Clear custom inputs
                            setCustomInterestInput('');
                            setCustomActivityInput('');
                            
                            toast({
                              title: "Success!",
                              description: "Business preferences saved successfully.",
                            });
                          } catch (error: any) {
                            console.error('Failed to update business preferences:', error);
                            toast({
                              title: "Error",
                              description: error.message || "Failed to save business preferences. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                        size="lg"
                      >
                        ðŸ’¾ Save Business Changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}







            {/* Photo Gallery Preview */}
            {/* Photos Panel - Optimized Preview */}
            {activeTab === 'photos' && loadedTabs.has('photos') && (
              <div 
                role="tabpanel"
                id="panel-photos"
                aria-labelledby="tab-photos"
                ref={tabRefs.photos}
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="photos-content"
              >
              <Card className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <Camera className="w-5 h-5" />
                    Photos & Travel Memories ({photos.length + (userTravelMemories?.length || 0)})
                  </CardTitle>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex-1 sm:flex-none text-xs sm:text-sm"
                    onClick={() => setShowFullGallery(true)}
                  >
                    View Full Gallery
                  </Button>
                  {isOwnProfile && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => setLocation('/upload-photos')}
                        className="bg-orange-500 text-white hover:bg-orange-600 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        Upload Photos
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-white text-black hover:bg-blue-600 border-blue-500 flex-1 sm:flex-none text-xs sm:text-sm"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Quick Add'}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(photos.length > 0 || userTravelMemories?.length > 0) ? (
                  <div className="space-y-4">
                    {/* Recent Photos Preview (max 6) */}
                    {photos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Photos</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {photos.slice(0, 6).map((photo, index) => (
                            <div
                              key={photo.id}
                              className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                              onClick={() => { setSelectedPhotoIndex(index); setShowFullGallery(true); }}
                            >
                              <img 
                                src={photo.imageUrl} 
                                alt={photo.caption || 'Travel photo'}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                        {photos.length > 6 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{photos.length - 6} more photos. Click "View Full Gallery" to see all.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Travel Memories Preview */}
                    {userTravelMemories && userTravelMemories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Travel Memories</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {userTravelMemories.slice(0, 3).map((memory: any) => (
                            <div
                              key={memory.id}
                              className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                              onClick={() => setShowFullGallery(true)}
                            >
                              <img 
                                src={memory.imageUrl} 
                                alt={memory.caption || 'Travel memory'}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs font-medium truncate">{memory.location}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {userTravelMemories.length > 3 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{userTravelMemories.length - 3} more memories. Click "View Full Gallery" to see all.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-white">No photos or travel memories yet</p>
                    {isOwnProfile && (
                      <p className="text-sm text-gray-600 dark:text-white">Share your travel memories!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}

            {/* Countries Tab */}
            {/* Countries Panel - Lazy Loaded */}
            {activeTab === 'countries' && loadedTabs.has('countries') && (
              <div 
                role="tabpanel"
                id="panel-countries"
                aria-labelledby="tab-countries"
                ref={tabRefs.countries}
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="countries-content"
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                        <Globe className="w-5 h-5" />
                        Countries I've Visited ({countriesVisited.length})
                      </CardTitle>
                      {isOwnProfile && !editingCountries && (
                        <Button size="sm" onClick={handleEditCountries} className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 text-black">
                          <Edit className="w-4 h-4 mr-2 text-black" />
                          <span className="text-black">Edit</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-900">
                    {editingCountries ? (
                      <div className="space-y-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            >
                              {tempCountries.length > 0 
                                ? `${tempCountries.length} countr${tempCountries.length > 1 ? 'ies' : 'y'} selected`
                                : "Select countries visited..."
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                            <Command className="bg-white dark:bg-gray-800">
                              <CommandInput placeholder="Search countries..." className="border-0" />
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {COUNTRIES_OPTIONS.map((country) => (
                                  <CommandItem
                                    key={country}
                                    value={country}
                                    onSelect={() => {
                                      setTempCountries(current =>
                                        current.includes(country)
                                          ? current.filter(c => c !== country)
                                          : [...current, country]
                                      );
                                    }}
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        tempCountries.includes(country) ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {country}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* Show selected countries */}
                        {tempCountries.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {tempCountries.map((country) => (
                              <div key={country} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md">
                                <span className="text-sm">{country}</span>
                                <button
                                  onClick={() => setTempCountries(current => current.filter(c => c !== country))}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              updateCountries.mutate(tempCountries);
                            }}
                            disabled={updateCountries.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {updateCountries.isPending ? "Saving..." : "Save Countries"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveEditSection(null);
                              setTempCountries(user?.countriesVisited || []);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {countriesVisited.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {countriesVisited.map((country: string, index: number) => (
                              <div 
                                key={country} 
                                className="pill-interests"
                              >
                                {country}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-white text-sm">No countries visited yet</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chatrooms Panel - Lazy Loaded */}
            {activeTab === 'chatrooms' && loadedTabs.has('chatrooms') && (
              <div 
                role="tabpanel"
                id="panel-chatrooms"
                aria-labelledby="tab-chatrooms"
                ref={tabRefs.chatrooms}
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="chatrooms-content"
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-white dark:bg-gray-900">
                    <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                      <MessageCircle className="w-5 h-5" />
                      My Chatrooms ({userChatrooms?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userChatrooms && userChatrooms.length > 0 ? (
                      <div className="space-y-2">
                        {userChatrooms.map((chatroom: any) => (
                          <button
                            key={chatroom.id}
                            onClick={() => setLocation(`/chatroom/${chatroom.id}`)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {(chatroom.name || chatroom.cityName || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white truncate">
                                  {chatroom.name || chatroom.cityName || 'Chatroom'}
                                </div>
                                {chatroom.cityName && chatroom.name && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chatroom.cityName}</div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">You haven't joined any chatrooms yet. Visit a city page to join its chatroom!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vouches Tab Panel */}
            {activeTab === 'vouches' && loadedTabs.has('vouches') && (
              <div 
                role="tabpanel"
                id="panel-vouches"
                aria-labelledby="tab-vouches"
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="vouches-content"
              >
                <Card className="bg-white border border-purple-200 dark:bg-gray-900 dark:border-purple-700 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
                    <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <ThumbsUp className="w-5 h-5" />
                      Vouches Received ({userVouches?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-900 pt-4">
                    <div className="space-y-3">
                      {(userVouches?.length || 0) === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No vouches yet.</p>
                      ) : (
                      userVouches?.map((vouch: any) => (
                        <div 
                          key={vouch.id} 
                          className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-700"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsUp className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-800 dark:text-purple-200">
                              Vouched by @{vouch.voucherUsername || 'Unknown'}
                            </span>
                          </div>
                          {vouch.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                              "{vouch.message}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(vouch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vouch button for visitors in vouches tab */}
                {!isOwnProfile && currentUser?.id && (
                  <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-5 h-5 text-purple-600" />
                          <span className="text-purple-800 dark:text-purple-200 font-medium">Vouch for {user?.username}</span>
                        </div>
                        <VouchButton
                          currentUserId={currentUser.id}
                          targetUserId={user?.id || 0}
                          targetUsername={user?.username || ''}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Event Organizer Hub - for ALL users who want to organize events */}
            {isOwnProfile && (
              <EventOrganizerHubSection userId={effectiveUserId || 0} />
            )}
          </div>

          {/* Right Sidebar - Mobile Responsive */}
          <div className="w-full lg:col-span-1 space-y-2 lg:space-y-4">
            {/* Quick Meetup Widget - Only show for own profile (travelers/locals only, NOT business) */}
            {isOwnProfile && user && user.userType !== 'business' && (
              <div className="mt-6" data-testid="quick-meet-widget">
                <QuickMeetupWidget 
                  city={user?.hometownCity ?? ''} 
                  profileUserId={user?.id}
                  triggerCreate={triggerQuickMeetup}
                />
              </div>
            )}

            {/* Quick Deals Widget for Business Users - Only show if deals exist */}
            {isOwnProfile && user?.userType === 'business' && quickDeals && quickDeals.length > 0 && (
              <div className="mt-6">
                <QuickDealsWidget 
                  city={user?.hometownCity ?? ''} 
                  profileUserId={user?.id} 
                  showCreateForm={showCreateDeal}
                  onCloseCreateForm={() => {
                    console.log('ðŸ”¥ CLOSING create deal form');
                    setShowCreateDeal(false);
                  }}
                />
              </div>
            )}

            {/* Events I'm Going To - Only show on own profile for non-business users */}
            {isOwnProfile && user?.userType !== 'business' && eventsGoing.length > 0 && (
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-green-300 mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base">
                    <Calendar className="w-5 h-5 text-green-500" />
                    Events I'm Going To
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {eventsGoing.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventsGoing.slice(0, 3).map((event: any) => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {event.city}{event.state && `, ${event.state}`}
                      </div>
                    </div>
                  ))}
                  {eventsGoing.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm text-gray-500"
                      onClick={() => setLocation('/events')}
                    >
                      View all {eventsGoing.length} events
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Events I'm Interested In - Only show on own profile for non-business users */}
            {isOwnProfile && user?.userType !== 'business' && eventsInterested.length > 0 && (
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-orange-300 mt-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base">
                    <Star className="w-5 h-5 text-orange-500" />
                    Events I'm Interested In
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {eventsInterested.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventsInterested.slice(0, 3).map((event: any) => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {event.city}{event.state && `, ${event.state}`}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/events/${event.id}`);
                        }}
                      >
                        Change to Going
                      </Button>
                    </div>
                  ))}
                  {eventsInterested.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm text-gray-500"
                      onClick={() => setLocation('/events')}
                    >
                      View all {eventsInterested.length} interested events
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Travel Stats - Hidden for business profiles - MOVED UP */}
            {user?.userType !== 'business' && (
              <Card 
                className="hover:shadow-lg transition-all duration-200 hover:border-orange-300"
              >
                <CardHeader>
                  <CardTitle className="dark:text-white">Travel Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 break-words overflow-hidden">
                  {isOwnProfile ? (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center justify-between cursor-help hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg p-2 -m-2 transition-colors">
                          <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            Travel Aura
                          </span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">{user?.aura || 0}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            How to Earn Travel Aura
                          </h4>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Completing profile</span><span className="font-medium text-orange-600">1 pt</span></div>
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Creating a trip</span><span className="font-medium text-orange-600">1 pt</span></div>
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Creating an event</span><span className="font-medium text-orange-600">4 pts</span></div>
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Creating a quick meetup</span><span className="font-medium text-orange-600">2 pts</span></div>
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Uploading a photo</span><span className="font-medium text-orange-600">1 pt</span></div>
                            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Creating a chatroom</span><span className="font-medium text-orange-600">2 pts</span></div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        Travel Aura
                      </span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{user?.aura || 0}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                    onClick={() => setLocation('/ambassador-program')}
                  >
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      Ambassador Points
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.ambassadorPoints || 0}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-between cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                    onClick={() => openTab('contacts')}
                  >
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      Connections
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{userConnections.length}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-between cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                    onClick={() => openTab('travel')}
                  >
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      Active Travel Plans
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{(travelPlans || []).filter(plan => plan.status === 'planned' || plan.status === 'active').length}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Cumulative Trips Taken</span>
                    <span className="font-semibold dark:text-white">{(travelPlans || []).filter(plan => plan.status === 'completed').length}</span>
                  </div>
                  <button 
                    type="button"
                    className="flex items-center justify-between cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:border dark:border-gray-600 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openTab('chatrooms');
                    }}
                    style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                  >
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-orange-500" />
                      City Chatrooms
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{userChatrooms.length}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="hidden sm:inline">Vouches</span>
                      <span className="sm:hidden">Vouches {(vouches?.length || 0) === 0 ? ' • Get vouched by community' : ''}</span>
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{vouches?.length || 0}</span>
                  </div>
                  {(vouches?.length || 0) === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6 hidden sm:block">
                      Get vouched by vouched community members who know you personally
                    </div>
                  )}
                  {/* Chatrooms + Invite Friends: only in sidebar on iOS; on desktop they live in the profile hero card */}
                  {isOwnProfile && isNativeIOSApp() && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        className="flex items-center justify-between cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                        onClick={() => {
                          const chatCity = user?.hometownCity || user?.location?.split(',')[0] || 'General';
                          setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                        }}
                      >
                        <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-purple-500" />
                          Chatrooms
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-between cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg p-2 -m-2 transition-colors w-full text-left"
                        onClick={() => setLocation('/share-qr')}
                      >
                        <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-orange-500" />
                          Invite Friends
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contacts Panel - Lazy Loaded */}
            {activeTab === 'contacts' && loadedTabs.has('contacts') && (
              <div 
                role="tabpanel"
                id="panel-contacts"
                aria-labelledby="tab-contacts"
                ref={tabRefs.contacts}
                className="space-y-4 mt-6" 
              style={{zIndex: 10, position: 'relative'}} 
              data-testid="contacts-content"
            >
              <Card className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-black dark:text-white">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      Connections ({userConnections.length})
                    </div>
                  {userConnections.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConnectionFilters(!showConnectionFilters)}
                      className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                    >
                      {showConnectionFilters ? "Hide Options" : "Sort & View"}
                    </Button>
                  )}
                </CardTitle>
                
                {/* Filter Panel */}
                {showConnectionFilters && userConnections.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
                        <Select
                          value={connectionFilters.location || "all"}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, location: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            {userConnections
                              .map((conn: any) => conn.connectedUser?.location)
                              .filter((location: any) => Boolean(location))
                              .filter((location: any, index: number, arr: any[]) => arr.indexOf(location) === index)
                              .map((location: any) => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Gender</label>
                        <Select
                          value={connectionFilters.gender}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, gender: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="Any gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any gender</SelectItem>
                            {GENDER_OPTIONS.map((gender) => (
                              <SelectItem key={gender} value={gender.toLowerCase()}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Sexual Preference</label>
                        <Select
                          value={connectionFilters.sexualPreference}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, sexualPreference: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="Any preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any preference</SelectItem>
                            {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                              <SelectItem key={preference} value={preference}>
                                {preference}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Min Age</label>
                        <Input
                          type="number"
                          placeholder="Min age"
                          value={connectionFilters.minAge}
                          onChange={(e) => setConnectionFilters(prev => ({ ...prev, minAge: e.target.value }))}
                          className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          min="18"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Max Age</label>
                        <Input
                          type="number"
                          placeholder="Max age"
                          value={connectionFilters.maxAge}
                          onChange={(e) => setConnectionFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                          className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          min="18"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectionFilters({ location: 'all', gender: 'all', sexualPreference: 'all', minAge: '', maxAge: '' })}
                        className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {sortedUserConnections.length > 0 ? (
                  <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {sortedUserConnections.slice(0, connectionsDisplayCount).map((connection: any) => (
                      <div
                        key={connection.id}
                        className="rounded-xl border p-3 hover:shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center text-center gap-2"
                      >
                        <SimpleAvatar
                          user={connection.connectedUser}
                          size="md"
                          className="w-14 h-14 rounded-full border-2 object-cover cursor-pointer flex-shrink-0"
                          onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                        />
                        <div className="w-full min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white break-words">
                            {connection.connectedUser?.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                            {connection.connectedUser?.hometownCity && connection.connectedUser?.hometownCountry
                              ? `${connection.connectedUser?.hometownCity}, ${connection.connectedUser?.hometownCountry.replace("United States", "USA")}`
                              : "New member"}
                          </p>
                          
                          {isOwnProfile && (
                            <div className="mt-2">
                              {editingConnectionNote === connection.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={connectionNoteText}
                                    onChange={(e) => setConnectionNoteText(e.target.value)}
                                    placeholder="How did we meet? e.g., met at bonfire BBQ"
                                    className="text-xs h-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                          connectionNote: connectionNoteText
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                          setEditingConnectionNote(null);
                                          setConnectionNoteText('');
                                        }).catch(console.error);
                                      }
                                    }}
                                    data-testid={`input-connection-note-${connection.id}`}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                          connectionNote: connectionNoteText
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                          setEditingConnectionNote(null);
                                          setConnectionNoteText('');
                                        }).catch(console.error);
                                      }}
                                      className="h-6 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                                      data-testid={`button-save-note-${connection.id}`}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingConnectionNote(null);
                                        setConnectionNoteText('');
                                      }}
                                      className="h-6 px-2 text-xs"
                                      data-testid={`button-cancel-note-${connection.id}`}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-dashed border-gray-300 dark:border-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingConnectionNote(connection.id);
                                    setConnectionNoteText(connection.connectionNote || '');
                                  }}
                                  title="Click to add/edit how you met"
                                  data-testid={`button-edit-note-${connection.id}`}
                                >
                                  {connection.connectionNote ? (
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">ðŸ“ {connection.connectionNote}</span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">+ How did we meet?</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {isOwnProfile && connection.connectedUser?.id && (
                            <StealthToggleInline 
                              targetUserId={connection.connectedUser.id}
                              targetUsername={connection.connectedUser.username}
                            />
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                            onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                    
                    {/* Load More / Load Less buttons */}
                    {sortedUserConnections.length > 3 && (
                      <div className="text-center pt-2">
                        {connectionsDisplayCount < sortedUserConnections.length ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConnectionsDisplayCount(sortedUserConnections.length)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 h-8"
                          >
                            Load More ({sortedUserConnections.length - connectionsDisplayCount} more)
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConnectionsDisplayCount(3)}
                            className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 h-8"
                          >
                            Load Less
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No connections yet</p>
                    <p className="text-xs">
                      {isOwnProfile 
                        ? "Start connecting with other travelers" 
                        : "This user hasn't made any connections yet"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
              
              {/* Add Contact-related widgets here if any */}
              {isOwnProfile && connectionRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Connect with other travelers to see them here</p>
                  </CardContent>
                </Card>
              )}
            </div>
            )}

            {/* Stealth Mode Toggle - Hide yourself from this person's searches */}
            {!isOwnProfile && currentUser && user && (
              <Card className="border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <EyeOff className="w-5 h-5 text-purple-500" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <StealthToggle
                    userId={currentUser.id}
                    targetUserId={user.id}
                    targetUsername={user.username}
                  />
                </CardContent>
              </Card>
            )}

            {/* Reference Widget - Show for other users' profiles (no connection required) */}
            {!isOwnProfile && currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Write a Reference
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Share your experience with {user?.username} to help others in the community
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    onClick={() => setShowWriteReferenceModal(true)}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 25%, #f97316 75%, #ea580c 100%)',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 25%, #ea580c 75%, #dc2626 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 25%, #f97316 75%, #ea580c 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Write Reference for {user?.username}
                  </div>
                  
                  {showReferenceForm && (
                    <div className="space-y-4 mt-4">
                      <Form {...referenceForm}>
                        <form onSubmit={referenceForm.handleSubmit((data) => {
                          console.log('Form submitted with data:', data);
                          console.log('Form errors:', referenceForm.formState.errors);
                          // Ensure required fields are set according to userReferences schema
                          const submissionData = {
                            reviewerId: currentUser?.id || 0,
                            revieweeId: user?.id || 0,
                            experience: data.experience || 'positive',
                            content: data.content || '',
                          };
                          createReference.mutate(submissionData);
                        }, (errors) => {
                          console.log('Form validation errors:', errors);
                        })} className="space-y-4">
                          
                          {/* Note: revieweeId and reviewerId handled in submission data */}

                          {/* Reference Content */}
                          <FormField
                            control={referenceForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Reference</FormLabel>
                                <FormControl>
                                  <textarea
                                    placeholder="Share your experience with this person..."
                                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Experience Type */}
                          <FormField
                            control={referenceForm.control}
                            name="experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select experience type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="positive">Positive Experience</SelectItem>
                                    <SelectItem value="neutral">Neutral Experience</SelectItem>
                                    <SelectItem value="negative">Negative Experience</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setShowReferenceForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createReference.isPending}>
                              {createReference.isPending ? 'Submitting...' : 'Submit Reference'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* MOBILE-FRIENDLY RIGHT-SIDE WIDGETS SECTION */}
            
            {/* Languages Widget - Top Priority for Customer Visibility */}
            <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Languages I Speak
                  </CardTitle>
                  {isOwnProfile && !editingLanguages && (
                    <Button size="sm" onClick={handleEditLanguages} className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 [&]:text-black [&>*]:text-black">
                      <Edit className="w-3 h-3 text-black" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingLanguages ? (
                  <div className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-left"
                        >
                          {tempLanguages.length > 0 
                            ? `${tempLanguages.length} language${tempLanguages.length > 1 ? 's' : ''} selected`
                            : "Select languages..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                        <Command className="bg-white dark:bg-gray-800">
                          <CommandInput placeholder="Search languages..." className="border-0" />
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {LANGUAGES_OPTIONS.map((language) => (
                              <CommandItem
                                key={language}
                                value={language}
                                onSelect={() => {
                                  const isSelected = tempLanguages.includes(language);
                                  if (isSelected) {
                                    setTempLanguages(tempLanguages.filter(l => l !== language));
                                  } else {
                                    setTempLanguages([...tempLanguages, language]);
                                  }
                                }}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    tempLanguages.includes(language) ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {language}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Custom Language Input */}
                    <div className="mt-3">
                      <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                        Add Custom Language (hit Enter after each)
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="e.g., Sign Language, Mandarin"
                          value={customLanguageInput}
                          onChange={(e) => setCustomLanguageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customLanguageInput.trim();
                              if (trimmed && !tempLanguages.includes(trimmed)) {
                                setTempLanguages([...tempLanguages, trimmed]);
                                setCustomLanguageInput('');
                              }
                            }
                          }}
                          className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const trimmed = customLanguageInput.trim();
                            if (trimmed && !tempLanguages.includes(trimmed)) {
                              setTempLanguages([...tempLanguages, trimmed]);
                              setCustomLanguageInput('');
                            }
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Show selected languages */}
                    {tempLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {tempLanguages.map((language) => (
                          <div key={language} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                            {language}
                            <button
                              onClick={() => setTempLanguages(tempLanguages.filter(l => l !== language))}
                              className="ml-2 text-blue-200 hover:text-white"
                            >
                              Ã—
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveLanguages} disabled={updateLanguages.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {updateLanguages.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelLanguages}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {user.languagesSpoken && user.languagesSpoken.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.languagesSpoken.map((language: string) => (
                          <div key={language} className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-orange-400 to-pink-500 border-0 appearance-none select-none gap-1.5 shadow-md">
                            <span style={{ color: 'black' }}>{language}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No languages listed</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* References Widget */}
            {/* References Panel - Lazy Loaded */}
            {activeTab === 'references' && loadedTabs.has('references') && (
              <div 
                role="tabpanel"
                id="panel-references"
                aria-labelledby="tab-references"
                ref={tabRefs.references}
                className="mt-6"
                data-testid="references-content"
              >
                {user?.id && (
                  <div className="space-y-4" style={{zIndex: 10, position: 'relative'}}>
                    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                      <CardHeader className="bg-white dark:bg-gray-900">
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Star className="w-5 h-5 text-yellow-500" />
                          References
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="bg-white dark:bg-gray-900">
                        <ReferencesWidgetNew userId={user.id} currentUserId={currentUser?.id} />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Vouch Section - iOS: ConditionalVouchCard only when can vouch; Desktop: full Vouch card */}
              {user?.id && (
                <div className="space-y-4 mt-4">
                  {!isOwnProfile && currentUser?.id && isNativeIOSApp() && (
                    <ConditionalVouchCard
                      currentUserId={currentUser.id}
                      targetUserId={user.id}
                      targetUsername={user.username}
                    />
                  )}
                  {!isOwnProfile && currentUser?.id && !isNativeIOSApp() && (
                    <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-5 h-5 text-purple-600" />
                            <span className="text-purple-800 dark:text-purple-200 font-medium">Vouch for {user.username}</span>
                          </div>
                          <VouchButton
                            currentUserId={currentUser.id}
                            targetUserId={user.id}
                            targetUsername={user.username}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <VouchWidget 
                    userId={user.id} 
                    isOwnProfile={isOwnProfile}
                    currentUserId={currentUser?.id || 0}
                  />
                </div>
              )}

                {/* Referral Stats with Aura Points */}
                {(user?.referralCount && user.referralCount > 0) && (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">Community Builder</p>
                          <p className="text-lg font-bold text-green-800 dark:text-green-200">
                            {user.referralCount} {user.referralCount === 1 ? 'person' : 'people'} referred
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
            )}

            {/* Travel Panel - Lazy Loaded */}
            {activeTab === 'travel' && loadedTabs.has('travel') && user?.userType !== 'business' && (
              <div 
                role="tabpanel"
                id="panel-travel"
                aria-labelledby="tab-travel"
                ref={tabRefs.travel}
                className="mt-6"
                data-testid="travel-content"
              >
                {/* Travel Plans Widget - No wrapper needed, widget has its own styling */}
                <TravelPlansWidget userId={effectiveUserId} isOwnProfile={isOwnProfile} />
              </div>
            )}

            {/* Travel Intent Widget - TangoTrips-inspired */}
            {user?.userType !== 'business' && (
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Travel Intent & Style
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setLocation('/travel-quiz')}
                        className="ml-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 [&]:text-black [&>*]:text-black"
                      >
                        <Edit className="w-3 h-3 mr-1 text-black" />
                        <span className="text-black">Update</span>
                      </Button>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    What drives your travel and how you like to explore
                  </p>
                </CardHeader>
                <CardContent>
                  {isOwnProfile ? (
                    <div className="space-y-4">
                      {/* Display Current Travel Intent */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Why you travel</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelWhy || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Travel style</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelHow || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget range</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelBudget || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Group type</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelGroup || 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation('/travel-quiz')}
                        className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400"
                      >
                        Update Travel Intent
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Why:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelWhy ? user.travelWhy.charAt(0).toUpperCase() + user.travelWhy.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Style:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelHow ? user.travelHow.charAt(0).toUpperCase() + user.travelHow.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Budget:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelBudget ? user.travelBudget.charAt(0).toUpperCase() + user.travelBudget.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Group:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelGroup ? user.travelGroup.charAt(0).toUpperCase() + user.travelGroup.slice(1) : 'Not shared'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Compatibility indicator when viewing other profiles */}
                      {compatibilityData?.travelStyleCompatibility && (
                        <div className="mt-3 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              {compatibilityData.travelStyleCompatibility}% Travel Style Match
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}





            {/* Friend Referral Widget - Only show for own profile and non-business users */}
            {isOwnProfile && user?.userType !== 'business' && (
              <FriendReferralWidget />
            )}





            {/* Connection Requests Widget - Only visible to profile owner */}
            {isOwnProfile && connectionRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Connection Requests ({connectionRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectionRequests.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => setLocation(`/profile/${request.requesterUser?.id?.toString() || ''}`)}
                        >
                          <SimpleAvatar 
                            user={request.requesterUser} 
                            size="sm" 
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">@{request.requesterUser?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {request.requesterUser?.location || `@${request.requesterUser?.username}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Accept connection request
                              apiRequest('PUT', `/api/connections/${request.id}`, { status: 'accepted' })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}/requests`] });
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                  toast({
                                    title: "Connection accepted",
                                    description: `You are now connected with @${request.requesterUser?.username}`,
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to accept connection request",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            className="h-8 w-16 px-2 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Decline connection request
                              apiRequest('PUT', `/api/connections/${request.id}`, { status: 'rejected' })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}/requests`] });
                                  toast({
                                    title: "Connection declined",
                                    description: "Connection request declined",
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to decline connection request",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            className="h-8 w-16 px-2 text-xs"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                    {connectionRequests.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-gray-500 hover:text-blue-600 h-8"
                        onClick={() => setLocation('/requests')}
                      >
                        View all {connectionRequests.length} requests
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Countries Visited - Hidden for business profiles - Only show in countries tab */}
            {activeTab === 'countries' && user?.userType !== 'business' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      <span className="text-black dark:text-white">Countries I've Visited ({countriesVisited.length})</span>
                    </CardTitle>
                    {isOwnProfile && !editingCountries && (
                      <Button size="sm" onClick={handleEditCountries} className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0 text-black">
                        <Edit className="w-3 h-3 text-black" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingCountries ? (
                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-left"
                          >
                            {tempCountries.length > 0 
                              ? `${tempCountries.length} countr${tempCountries.length > 1 ? 'ies' : 'y'} selected`
                              : "Select countries visited..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                          <Command className="bg-white dark:bg-gray-800">
                            <CommandInput placeholder="Search countries..." className="border-0" />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {COUNTRIES_OPTIONS.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={() => {
                                    const isSelected = tempCountries.includes(country);
                                    if (isSelected) {
                                      setTempCountries(tempCountries.filter(c => c !== country));
                                    } else {
                                      setTempCountries([...tempCountries, country]);
                                    }
                                  }}
                                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      tempCountries.includes(country) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {country}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Custom Country Input */}
                      <div className="mt-3">
                        <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                          Add Custom Country (hit Enter after each)
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="e.g., Vatican City, San Marino"
                            value={customCountryInput}
                            onChange={(e) => setCustomCountryInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customCountryInput.trim();
                                if (trimmed && !tempCountries.includes(trimmed)) {
                                  setTempCountries([...tempCountries, trimmed]);
                                  setCustomCountryInput('');
                                }
                              }
                            }}
                            className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = customCountryInput.trim();
                              if (trimmed && !tempCountries.includes(trimmed)) {
                                setTempCountries([...tempCountries, trimmed]);
                                setCustomCountryInput('');
                              }
                            }}
                            className="h-8 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Show selected countries */}
                      {tempCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {tempCountries.map((country) => (
                            <div key={country} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                              {country}
                              <button
                                onClick={() => setTempCountries(tempCountries.filter(c => c !== country))}
                                className="ml-2 text-green-200 hover:text-white"
                              >
                                Ã—
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCountries} disabled={updateCountries.isPending}>
                          {updateCountries.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelCountries}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {countriesVisited.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {countriesVisited.map((country: string, index: number) => (
                            <div 
                              key={country} 
                              className="pill-interests"
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-white text-sm">No countries visited yet</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}



            {/* Comprehensive Geolocation System - Enhanced location sharing for users, businesses, and events */}
            {console.log('ðŸ”§ Profile: Checking if location sharing should render:', { isOwnProfile, userId: user?.id })}
            {isOwnProfile && user && (
              <LocationSharingSection user={user} queryClient={queryClient} toast={toast} />
            )}



            {/* Owner/Admin Contact Information - Only visible to business owner */}
            {isOwnProfile && user?.userType === 'business' && (
              <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Admin Information
                      </CardTitle>
                      <div className="inline-flex items-center justify-center h-6 min-w-[4rem] rounded-full px-2 text-xs font-medium leading-none whitespace-nowrap bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 border-0 appearance-none select-none gap-1">
                        Private
                      </div>
                    </div>
                    {!editingOwnerInfo && (
                      <Button
                        size="sm"
                        onClick={() => setActiveEditSection('owner')}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Internal contact information for platform communications
                  </p>
                </CardHeader>
                <CardContent>
                  {editingOwnerInfo ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</Label>
                        <Input 
                          value={ownerContactForm.businessName}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="Your business or company name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person&apos;s Name</Label>
                        <Input 
                          value={ownerContactForm.contactName}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Name of main contact person"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact&apos;s Role</Label>
                        <select
                          value={ownerContactForm.contactRole}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, contactRole: e.target.value }))}
                          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select role</option>
                          <option value="Owner">Owner</option>
                          <option value="Manager">Manager</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                          <option value="General Contact">General Contact</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</Label>
                        <Input 
                          value={ownerContactForm.ownerEmail}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                          placeholder="contact@business.com"
                          type="email"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Phone Number</Label>
                        <Input 
                          value={ownerContactForm.ownerPhone}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, ownerPhone: e.target.value }))}
                          placeholder="(555) 123-4567"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveOwnerContact}
                          disabled={updateOwnerContact.isPending}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {updateOwnerContact.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveEditSection(null);
                            setOwnerContactForm({
                              businessName: (user as any)?.businessName ?? user?.businessName ?? (user as any)?.name ?? "",
                              contactName: (user as any)?.contactName ?? user?.contactName ?? "",
                              ownerEmail: user?.ownerEmail ?? "",
                              ownerPhone: user?.ownerPhone ?? "",
                              contactRole: (user as any)?.contactRole ?? user?.contactRole ?? ""
                            });
                          }}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Business Name:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(user as any)?.businessName ?? user?.businessName ?? (user as any)?.name ?? "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Person&apos;s Name:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(user as any)?.contactName ?? user?.contactName ?? "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact&apos;s Role:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(user as any)?.contactRole ?? user?.contactRole ?? "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Email:</span>
                        {user?.ownerEmail ? (
                          <a 
                            href={`mailto:${user.ownerEmail}`} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                          >
                            {user.ownerEmail}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Not set
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Phone Number:</span>
                        {user?.ownerPhone ? (
                          <a 
                            href={`tel:${user.ownerPhone}`} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                          >
                            {user.ownerPhone}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Not set
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-purple-100 dark:bg-purple-900/50 p-2 rounded">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        This information is only visible to you and used for platform communications
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Boost Connections Widget - MOVED TO BOTTOM - Only show for own profile */}
            {isOwnProfile && (
              <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/30 dark:to-blue-900/30 hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div className="inline-flex items-center justify-center h-6 min-w-[4rem] rounded-full px-2 text-xs font-medium leading-none whitespace-nowrap bg-orange-600 border-0 appearance-none select-none gap-1"><span style={{ color: 'black' }}>Success Tips</span></div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Boost Your Connections
                  </CardTitle>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Get better matches and more connections with our optimization guide
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => setLocation('/getting-started')}
                    className="w-full bg-gradient-to-r from-blue-500 via-orange-500 to-violet-500 hover:from-blue-600 hover:via-orange-600 hover:to-violet-600 border-0"
                    style={{ color: 'black' }}
                  >
                    <Star className="w-4 h-4 mr-2" style={{ color: 'black' }} />
                    <span style={{ color: 'black' }}>Optimize Profile</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
  );
}
