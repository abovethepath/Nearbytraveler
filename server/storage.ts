import { db, pool } from "./db";
import { users, connections, messages, events, eventParticipants, travelPlans, tripItineraries, itineraryItems, sharedItineraries, notifications, blockedUsers, travelMemories, travelMemoryLikes, travelMemoryComments, userPhotos, photoTags, userReferences, referrals, proximityNotifications, customLocationActivities, cityActivities, userCustomActivities, userCityInterests, cityLandmarks, landmarkRatings, secretLocalExperiences, secretLocalExperienceLikes, secretExperienceLikes, cityPages, citychatrooms, chatroomMembers, chatroomMessages, chatroomAccessRequests, chatroomInvitations, meetupChatrooms, meetupChatroomMessages, businessOffers, businessOfferRedemptions, businessReferrals, businessLocations, businessInterestNotifications, businessCustomerPhotos, cityPhotos, travelBlogPosts, travelBlogLikes, travelBlogComments, instagramPosts, quickMeetups, quickMeetupParticipants, quickMeetupTemplates, quickDeals, userNotificationSettings, businessSubscriptions, photoAlbums, externalEventInterests, vouches, vouchCredits, waitlistLeads, type User, type InsertUser, type Connection, type InsertConnection, type Message, type InsertMessage, type Event, type InsertEvent, type EventParticipant, type EventParticipantWithUser, type TravelPlan, type InsertTravelPlan, type TripItinerary, type InsertTripItinerary, type ItineraryItem, type InsertItineraryItem, type SharedItinerary, type InsertSharedItinerary, type Notification, type InsertNotification, type PhotoTag, type InsertPhotoTag, type UserReference, type Referral, type InsertReferral, type ProximityNotification, type InsertProximityNotification, type CityLandmark, type InsertCityLandmark, type LandmarkRating, type InsertLandmarkRating, type SecretLocalExperience, type InsertSecretLocalExperience, type ChatroomInvitation, type InsertChatroomInvitation, type BusinessOffer, type InsertBusinessOffer, type BusinessOfferRedemption, type InsertBusinessOfferRedemption, type BusinessLocation, type InsertBusinessLocation, type BusinessInterestNotification, type InsertBusinessInterestNotification, type WaitlistLead, type InsertWaitlistLead, type BusinessCustomerPhoto, type InsertBusinessCustomerPhoto, type CityPhoto, type InsertCityPhoto, type TravelBlogPost, type InsertTravelBlogPost, type TravelBlogLike, type InsertTravelBlogLike, type TravelBlogComment, type InsertTravelBlogComment, type InstagramPost, type InsertInstagramPost, type QuickMeetupTemplate, type InsertQuickMeetupTemplate, type UserNotificationSettings, type InsertUserNotificationSettings, type BusinessSubscription, type InsertBusinessSubscription, type PhotoAlbum, type InsertPhotoAlbum, type ExternalEventInterest, type InsertExternalEventInterest, type Vouch, type VouchCredits, type VouchWithUsers } from "@shared/schema";
import { eq, and, or, ilike, gte, desc, avg, count, sql, isNotNull, ne, lte, lt, gt, asc, like, inArray, getTableColumns, isNull } from "drizzle-orm";
import { promises as fs } from 'fs';
import path from 'path';
import { migrateLegacyOptions } from "../shared/base-options";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  linkFacebookAccount(userId: number, facebookId: string, accessToken: string): Promise<User | undefined>;
  createUserSession(userId: number, sessionToken: string): Promise<void>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserAura(userId: number, auraPoints: number): Promise<void>;
  deleteUser(id: number): Promise<boolean>;
  upsertUser(user: any): Promise<User>;
  
  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(userId?: number): Promise<Event[]>;
  canUserSeeEvent(event: Event, userId?: number): Promise<boolean>;
  getUpcomingEvents(city: string): Promise<Event[]>;
  getUserEvents(userId: number): Promise<Event[]>;
  getEventsByOrganizer(organizerId: number): Promise<Event[]>;
  getEventsByLocation(city: string, state: string, country: string): Promise<Event[]>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Event participation methods
  joinEvent(eventId: number, userId: number, notes?: string): Promise<EventParticipant>;
  leaveEvent(eventId: number, userId: number): Promise<boolean>;
  getEventParticipants(eventId: number): Promise<EventParticipantWithUser[]>;
  getUserEventParticipations(userId: number): Promise<EventParticipant[]>;
  getAllEventsWithParticipants(): Promise<any[]>;
  isUserInterestedInEvent(userId: number, eventId?: number, externalEventId?: string, eventSource?: string): Promise<boolean>;
  
  // Event chatroom methods
  getEventChatroom(eventId: number): Promise<any>;
  createEventChatroom(data: any): Promise<any>;
  getEventChatroomMessages(chatroomId: number): Promise<any[]>;
  createEventChatroomMessage(chatroomId: number, senderId: number, content: string): Promise<any>;
  joinEventChatroom(chatroomId: number, userId: number): Promise<any>;
  
  // Connection methods
  getConnection(userId: number, connectedUserId: number): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  getUserConnections(userId: number, filters?: any): Promise<any[]>;
  getConnectionRequests(userId: number): Promise<Connection[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  getUserMessages(userId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  markConversationAsRead(userId: number, otherUserId: number): Promise<void>;
  getRecentMessages(userId: number, limit?: number): Promise<Message[]>;
  
  // Blocking methods
  blockUser(blockerId: number, blockedId: number, reason?: string): Promise<boolean>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  isUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<any[]>;
  getUsersWhoBlockedMe(userId: number): Promise<any[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;

  // Weekly digest methods
  trackUserForWeeklyDigest(userId: number, city: string, username: string, userType: string, interests: string[]): Promise<void>;
  getWeeklyDigestUsers(weekStart: Date, weekEnd: Date): Promise<any[]>;
  markDigestAsSent(weekStart: Date, weekEnd: Date): Promise<void>;
  
  // Travel plan methods
  createTravelPlan(travelPlan: InsertTravelPlan): Promise<TravelPlan>;
  getTravelPlan(id: number): Promise<TravelPlan | undefined>;
  getUserTravelPlans(userId: number): Promise<TravelPlan[]>;
  updateTravelPlan(id: number, updates: Partial<TravelPlan>): Promise<TravelPlan | undefined>;
  deleteTravelPlan(id: number): Promise<boolean>;
  
  // Search methods
  searchUsersByLocation(location: string, userType?: string, startDate?: string, endDate?: string): Promise<User[]>;
  getUsersByType(type: string): Promise<User[]>;
  
  // City Activity methods
  createCityActivity(activity: any): Promise<any>;
  updateCityActivity(id: number, updates: any): Promise<any>;
  deleteCityActivity(id: number): Promise<boolean>;
  
  // Activity match methods
  createActivityMatch(data: { activityId: number; userId: number }): Promise<any>;
  getActivityMatches(activityId: number): Promise<any[]>;
  getUserActivityMatches(userId: number): Promise<any[]>;
  getUsersByCity(city: string): Promise<User[]>;
  searchUsers(search: string, city?: string): Promise<User[]>;
  getMatchedUsers(userId: number, city?: string): Promise<User[]>;
  findUsersByTags(tags: string[], excludeUserId?: number): Promise<any[]>;
  findUsersByTravelPlan(interests: string[], activities: string[], events: string[], notes?: string, excludeUserId?: number): Promise<any[]>;
  searchTravelPlans(searchTerms: string, location?: string): Promise<TravelPlan[]>;
  getCompatibleTravelers(userId: number, travelPlanId?: number): Promise<any[]>;

  
  // Stub methods for other interface requirements  
  inviteToEvent(): Promise<any>;
  updateParticipantStatus(): Promise<any>;
  createUserPhoto(photoData: any): Promise<any>;
  getUserPhotos(userId: number): Promise<any>;
  getUserPhoto(photoId: number): Promise<any>;
  getPhotoById(photoId: number): Promise<any>;
  updateUserPhoto(photoId: number, updates: any): Promise<any>;
  deleteUserPhoto(photoId: number): Promise<any>;
  deletePhoto(photoId: number): Promise<boolean>;
  setProfilePhoto(): Promise<any>;
  updatePhotoAIAnalysis(): Promise<any>;
  getPhotosByCategory(): Promise<any>;
  getPhotosByTag(): Promise<any>;
  getUserPhotoTags(): Promise<any>;
  
  // Photo tag methods
  createPhotoTag(photoId: number, taggedUserId: number, taggedByUserId: number): Promise<any>;
  getPhotoTags(photoId: number): Promise<any[]>;
  deletePhotoTag(photoId: number, taggedUserId: number): Promise<boolean>;
  getPhotosAwaitingAnalysis(): Promise<any>;
  createMoodEntry(): Promise<any>;
  getUserMoodEntries(): Promise<any>;
  getMoodEntriesByType(): Promise<any>;
  getMoodEntriesByDateRange(): Promise<any>;
  getMoodEntryById(): Promise<any>;
  updateMoodEntry(): Promise<any>;
  deleteMoodEntry(): Promise<any>;
  getTravelPlanMoodEntries(): Promise<any>;
  getEventMoodEntries(): Promise<any>;
  createPassportStamp(): Promise<any>;
  getUserPassportStamps(): Promise<any>;
  getPassportStampsByCountry(): Promise<any>;
  getPassportStampsByCategory(): Promise<any>;
  updatePassportStamp(): Promise<any>;
  deletePassportStamp(): Promise<any>;
  getUserStats(): Promise<any>;
  updateUserStats(): Promise<any>;
  getLeaderboard(): Promise<any>;
  getUserAchievements(): Promise<any>;
  createAchievement(): Promise<any>;
  updateAchievement(): Promise<any>;
  awardStampForDestination(): Promise<any>;
  awardStampForEvent(): Promise<any>;
  checkAndUnlockAchievements(): Promise<any>;
  createUserReference(referenceData: any): Promise<any>;
  getUserReferences(userId: number): Promise<any>;
  getUserReferencesGiven(): Promise<any>;
  findUserReference(reviewerId: number, revieweeId: number): Promise<any>;
  updateUserReference(referenceId: number, updates: any): Promise<any>;
  deleteUserReference(): Promise<any>;
  createReferral(): Promise<any>;
  getUserReferrals(): Promise<any>;
  getReferralByCode(): Promise<any>;
  updateReferralStatus(): Promise<any>;
  generateReferralCode(): Promise<any>;
  getUserReputation(): Promise<any>;
  updateUserReputation(): Promise<any>;
  calculateReputationStats(): Promise<any>;
  createReferenceResponse(): Promise<any>;
  getReferenceResponses(): Promise<any>;
  createAiRecommendation(): Promise<any>;
  getUserAiRecommendations(): Promise<any>;
  
  // Travel preferences methods
  getUserTravelPreferences(userId: number): Promise<any>;
  createUserTravelPreferences(preferences: any): Promise<any>;
  updateUserTravelPreferences(userId: number, updates: any): Promise<any>;
  

  
  // External event interest methods  
  addExternalEventInterest(interest: any): Promise<any>;
  getExternalEventInterests(eventId: string, eventSource: string): Promise<any[]>;
  getUserExternalEventInterests(userId: number): Promise<any[]>;
  removeExternalEventInterest(userId: number, eventId: string, eventSource: string): Promise<boolean>;
  
  // Landmark methods
  createLandmark(landmark: any): Promise<any>;
  getCityLandmarks(city: string, state?: string, country?: string): Promise<any>;
  getLandmark(id: number): Promise<any>;
  updateLandmark(id: number, updates: any): Promise<any>;
  deleteLandmark(id: number): Promise<boolean>;
  rateLandmark(landmarkId: number, userId: number, rating: number, review?: string): Promise<any>;
  getLandmarkRatings(landmarkId: number): Promise<any>;
  getUserLandmarkRatings(userId: number): Promise<any>;
  updateAiRecommendation(): Promise<any>;
  
  // City Photos methods
  getCityPhotos(cityName: string): Promise<CityPhoto[]>;
  createCityPhoto(photoData: { cityName: string; imageData: string; photographerUsername: string }): Promise<CityPhoto>;
  getAllCityPhotos(): Promise<CityPhoto[]>;
  
  // Instagram methods
  createInstagramPost(data: InsertInstagramPost): Promise<InstagramPost>;
  getInstagramPosts(eventId?: number, userId?: number): Promise<InstagramPost[]>;
  updateInstagramPost(id: number, updates: Partial<InstagramPost>): Promise<InstagramPost | undefined>;
  deleteInstagramPost(id: number): Promise<boolean>;
  
  // Quick meetup template methods
  createQuickMeetupTemplate(templateData: any): Promise<any>;
  getUserQuickMeetupTemplates(userId: number): Promise<any[]>;
  useQuickMeetupTemplate(templateId: number): Promise<any>;
  updateQuickMeetupTemplate(id: number, updates: any): Promise<any>;
  deleteQuickMeetupTemplate(id: number): Promise<boolean>;
  getInstagramPostsByEvent(eventId: number): Promise<InstagramPost[]>;
  deleteInstagramPostByAdmin(id: number, adminId: number): Promise<boolean>;
  getUserById(userId: number): Promise<User | undefined>;

  // Quick Meetups methods (separate from regular events)
  createQuickMeetup(meetup: any): Promise<any>;
  getQuickMeetupById(meetupId: number): Promise<any>;
  getQuickMeetup(id: number): Promise<any>;
  getActiveQuickMeetups(city?: string): Promise<any[]>;
  joinQuickMeetup(meetupId: number, userId: number): Promise<any>;
  leaveQuickMeetup(meetupId: number, userId: number): Promise<boolean>;
  getQuickMeetupParticipants(meetupId: number): Promise<any[]>;
  getUserQuickMeetups(userId: number): Promise<any[]>;
  updateQuickMeetup(id: number, updates: any): Promise<any>;
  deleteQuickMeetup(id: number): Promise<boolean>;
  expireOldQuickMeetups(): Promise<void>;
  
  // Quick Meetup Chatroom methods
  getQuickMeetupChatroom(meetupId: number): Promise<any | undefined>;
  createQuickMeetupChatroom(meetupId: number): Promise<any>;
  getQuickMeetupChatroomMessages(chatroomId: number): Promise<any[]>;
  createQuickMeetupChatroomMessage(chatroomId: number, senderId: number, content: string): Promise<any>;
  joinQuickMeetupChatroom(chatroomId: number, userId: number): Promise<any>;
  
  // Geolocation and proximity methods
  updateUserLocation(userId: number, latitude: number, longitude: number): Promise<User | undefined>;
  enableLocationSharing(userId: number): Promise<User | undefined>;
  disableLocationSharing(userId: number): Promise<User | undefined>;
  findNearbyUsers(userId: number, latitude: number, longitude: number, radiusKm: number): Promise<User[]>;
  createProximityNotification(notification: InsertProximityNotification): Promise<ProximityNotification>;
  getUserProximityNotifications(userId: number): Promise<ProximityNotification[]>;
  
  // Business offers methods
  createBusinessOffer(offer: any): Promise<any>;
  getBusinessOffer(id: number): Promise<any>;
  getBusinessOffers(city?: string, category?: string, targetAudience?: string, businessId?: string): Promise<any[]>;
  getUserBusinessOffers(businessId: number): Promise<any[]>;
  pauseBusinessDealsForNonPayment(businessId: number): Promise<void>;
  reactivateBusinessDealsAfterPayment(businessId: number): Promise<void>;
  updateBusinessOffer(id: number, updates: any): Promise<any>;
  deleteBusinessOffer(id: number): Promise<boolean>;
  redeemBusinessOffer(offerId: number, userId: number): Promise<any>;
  deactivateBusinessOffers(businessId: number): Promise<void>;
  reactivateBusinessOffers(businessId: number): Promise<void>;
  getBusinessOfferRedemptions(offerId: number): Promise<any[]>;
  getUserOfferRedemptions(userId: number): Promise<any[]>;
  
  // Business location discovery methods
  getBusinessesByLocation(city: string, state: string, country: string, category?: string): Promise<any[]>;
  getBusinessesWithGeolocation(city?: string, state?: string, country?: string, radiusKm?: number, centerLat?: number, centerLng?: number): Promise<any[]>;
  createAIBusiness(businessData: any): Promise<any>;
  
  // Business Location methods
  createBusinessLocation(location: InsertBusinessLocation): Promise<BusinessLocation>;
  getBusinessLocation(id: number): Promise<BusinessLocation | undefined>;
  getBusinessLocations(businessId: number): Promise<BusinessLocation[]>;
  updateBusinessLocation(id: number, updates: Partial<BusinessLocation>): Promise<BusinessLocation | undefined>;
  deleteBusinessLocation(id: number): Promise<boolean>;
  setPrimaryBusinessLocation(businessId: number, locationId: number): Promise<boolean>;
  getBusinessPrimaryLocation(businessId: number): Promise<BusinessLocation | undefined>;
  
  deleteAiRecommendation(): Promise<any>;
  bookmarkRecommendation(): Promise<any>;
  markRecommendationVisited(): Promise<any>;
  createUserTravelPreferences(): Promise<any>;
  getUserTravelPreferences(): Promise<any>;
  updateUserTravelPreferences(): Promise<any>;
  createAiConversation(): Promise<any>;
  getUserAiConversations(): Promise<any>;
  getAiConversationsByLocation(): Promise<any>;
  createTravelMemory(): Promise<any>;
  getUserTravelMemories(): Promise<any>;
  getTravelMemoryById(id: number): Promise<any>;
  generateTravelStory(memory: any, format: string, tone: string, customPrompt?: string): Promise<any>;
  getCommunityStories(): Promise<any>;
  createCommunityStory(storyData: any): Promise<any>;
  updateTravelMemory(): Promise<any>;
  deleteTravelMemory(): Promise<any>;
  getPublicTravelMemories(): Promise<any>;
  getTravelMemoriesByDestination(): Promise<any>;
  likeTravelMemory(memoryId: number, userId: number): Promise<boolean>;
  
  // Travel Blog Post methods - Reddit-style
  createTravelBlogPost(postData: InsertTravelBlogPost): Promise<TravelBlogPost>;
  getTravelBlogPosts(limit?: number, offset?: number): Promise<TravelBlogPost[]>;
  getUserTravelBlogPosts(userId: number): Promise<TravelBlogPost[]>;
  likeTravelBlogPost(postId: number, userId: number): Promise<void>;
  unlikeTravelBlogPost(postId: number, userId: number): Promise<void>;
  isPostLikedByUser(postId: number, userId: number): Promise<boolean>;
  createTravelBlogComment(postId: number, userId: number, content: string, parentCommentId?: number): Promise<TravelBlogComment>;
  getTravelBlogComments(postId: number): Promise<any[]>;
  likeTravelBlogComment(commentId: number, userId: number): Promise<void>;
  unlikeTravelBlogComment(commentId: number, userId: number): Promise<void>;
  isCommentLikedByUser(commentId: number, userId: number): Promise<boolean>;
  deleteTravelBlogPost(postId: number, userId: number): Promise<boolean>;
  deleteTravelBlogComment(commentId: number, userId: number): Promise<boolean>;
  updateUserAuraForPost(userId: number, auraPoints: number): Promise<void>;
  updateUserAuraForComment(userId: number, auraPoints: number): Promise<void>;
  
  // Instagram posting methods
  createInstagramPost(post: any): Promise<any>;
  getInstagramPosts(eventId?: number, userId?: number): Promise<any[]>;
  updateInstagramPost(id: number, updates: any): Promise<any>;
  deleteInstagramPostByAdmin(id: number, adminId: number): Promise<boolean>;
  getInstagramPostsByEvent(eventId: number): Promise<any[]>;
  unlikeTravelMemory(memoryId: number, userId: number): Promise<boolean>;
  isMemoryLikedByUser(memoryId: number, userId: number): Promise<boolean>;
  getTravelMemoryLikes(): Promise<any>;
  createTravelMemoryComment(): Promise<any>;
  getTravelMemoryComments(): Promise<any>;
  deleteTravelMemoryComment(): Promise<any>;
  createUserContributedInterest(): Promise<any>;
  getUserContributedInterests(): Promise<any>;
  getUserContributedInterestsByLocation(): Promise<any>;
  updateUserContributedInterest(): Promise<any>;
  deleteUserContributedInterest(): Promise<any>;
  likeUserContributedInterest(): Promise<any>;
  
  // City pages and secret local experiences methods
  ensureCityPageExists(city: string, state: string | null, country: string, createdById: number): Promise<any>;
  getCityPageByLocation(city: string, state: string | null, country: string): Promise<any>;
  addSecretLocalExperience(cityPageId: number, contributorId: number, experience: string, category?: string): Promise<any>;
  getSecretLocalExperiencesByCity(city: string, state: string | null, country: string): Promise<any[]>;
  createMoodBoard(): Promise<any>;
  getUserMoodBoards(): Promise<any>;
  getMoodBoard(): Promise<any>;
  updateMoodBoard(): Promise<any>;
  deleteMoodBoard(): Promise<any>;
  createMoodBoardItem(): Promise<any>;
  getMoodBoardItems(): Promise<any>;
  updateMoodBoardItem(): Promise<any>;
  deleteMoodBoardItem(): Promise<any>;
  createPackingList(): Promise<any>;
  getUserPackingLists(): Promise<any>;
  getPackingList(): Promise<any>;
  updatePackingList(): Promise<any>;
  deletePackingList(): Promise<any>;
  createPackingListItem(): Promise<any>;
  getPackingListItems(): Promise<any>;
  updatePackingListItem(): Promise<any>;
  deletePackingListItem(): Promise<any>;
  reorderPackingListItems(): Promise<any>;
  getTravelChallenges(): Promise<any>;
  getTravelChallenge(): Promise<any>;
  createTravelChallenge(): Promise<any>;
  joinTravelChallenge(): Promise<any>;
  getUserChallenges(): Promise<any>;
  completeTravelChallenge(): Promise<any>;
  updateUserChallenge(): Promise<any>;
  getUserLeaderboardEntry(): Promise<any>;
  updateUserLeaderboard(): Promise<any>;
  getLeaderboardRankings(): Promise<any>;
  calculateUserRank(): Promise<any>;
  getCityChatrooms(): Promise<any>;
  createCityChatroom(): Promise<any>;
  getChatroomsCreatedByUser(userId: number): Promise<any[]>;
  autoJoinWelcomeChatroom(userId: number, city: string, country: string): Promise<void>;
  autoJoinUserCityChatrooms(userId: number, hometownCity: string, hometownCountry: string, travelCity?: string, travelCountry?: string): Promise<void>;
  ensureSecondaryChatrooms(city: string, state?: string | null, country?: string): Promise<void>;
  sendSystemMessage(fromUserId: number, toUserId: number, messageText: string): Promise<void>;
  registerUserInCity(userId: number, city: string, state?: string | null, country?: string, userStatus?: string): Promise<void>;

  // Secret Local Experiences methods
  createSecretLocalExperience(experience: any): Promise<any>;
  getSecretLocalExperiences(city: string, state?: string, country?: string): Promise<any[]>;
  likeSecretLocalExperience(experienceId: number, userId: number): Promise<any>;
  getSecretLocalExperiencesByUser(userId: number): Promise<any[]>;
  getChatroomById(id: number): Promise<any>;
  isUserChatroomMember(userId: number, chatroomId: number): Promise<boolean>;
  updateChatroom(): Promise<any>;
  deleteChatroom(): Promise<any>;
  joinChatroom(): Promise<any>;
  leaveChatroom(): Promise<any>;
  getChatroomMembers(): Promise<any>;
  updateChatroomMember(): Promise<any>;
  createChatroomMessage(): Promise<any>;
  getChatroomMessages(): Promise<any>;
  updateChatroomMessage(): Promise<any>;
  deleteChatroomMessage(): Promise<any>;
  createChatroomInvitation(): Promise<any>;
  getChatroomInvitations(): Promise<any>;
  getUserChatroomInvitations(): Promise<any>;
  respondToChatroomInvitation(): Promise<any>;
  canUserAccessChatroom(): Promise<any>;
  getCityStatistics(): Promise<any>;
  ensureCityExists(city: string, state: string, country: string): Promise<boolean>;
  
  // Business customer photos
  createBusinessCustomerPhoto(photo: InsertBusinessCustomerPhoto): Promise<BusinessCustomerPhoto>;
  getBusinessCustomerPhotos(businessId: number): Promise<BusinessCustomerPhoto[]>;
  deleteBusinessCustomerPhoto(id: number): Promise<boolean>;
  
  // Blocking system methods
  blockUser(blockerId: number, blockedId: number, reason?: string): Promise<any>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<any[]>;
  isUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  
  // Notification Settings methods
  getUserNotificationSettings(userId: number): Promise<UserNotificationSettings | undefined>;
  createUserNotificationSettings(settings: InsertUserNotificationSettings): Promise<UserNotificationSettings>;
  updateUserNotificationSettings(userId: number, updates: Partial<UserNotificationSettings>): Promise<UserNotificationSettings | undefined>;
  
  // Privacy enforcement methods
  canViewProfile(viewerId: number, targetUserId: number): Promise<boolean>;
  canSendMessage(senderId: number, recipientId: number): Promise<boolean>;
  canSendConnectionRequest(senderId: number, recipientId: number): Promise<boolean>;
  canInviteToEvent(inviterId: number, inviteeId: number): Promise<boolean>;
  canViewPhotos(viewerId: number, targetUserId: number): Promise<boolean>;
  
  // Business subscription methods
  getBusinessSubscription(businessId: number): Promise<BusinessSubscription | undefined>;
  createBusinessSubscription(subscription: InsertBusinessSubscription): Promise<BusinessSubscription>;
  updateBusinessSubscription(businessId: number, updates: Partial<BusinessSubscription>): Promise<BusinessSubscription | undefined>;
  checkBusinessDayLimit(businessId: number): Promise<{ allowed: boolean; daysUsed: number; dayLimit: number; message?: string }>;
  trackBusinessDayUsage(businessId: number): Promise<void>;
  resetMonthlyUsageIfNeeded(businessId: number): Promise<void>;

  // VOUCH system methods - Invite-only credibility network
  createVouch(voucherUserId: number, vouchedUserId: number, vouchMessage?: string, vouchCategory?: string): Promise<any>;
  getUserVouches(userId: number): Promise<any[]>; // Vouches received by this user
  getUserVouchesGiven(userId: number): Promise<any[]>; // Vouches given by this user
  getUserVouchCredits(userId: number): Promise<any>;
  canUserVouch(userId: number): Promise<{ canVouch: boolean; availableCredits: number; reason?: string }>;
  getVouchNetworkStats(userId: number): Promise<{ totalReceived: number; totalGiven: number; networkSize: number }>;
  initializeSeedMember(userId: number, credits: number): Promise<void>;
  // Connection validation for VOUCH security
  areUsersConnected(userId1: number, userId2: number): Promise<boolean>;
  hasUserVouchedFor(voucherUserId: number, vouchedUserId: number): Promise<boolean>;
  // API compatibility methods
  getVouchesForUser(userId: number): Promise<any[]>;
  getVouchesGivenByUser(userId: number): Promise<any[]>;
  getVouchCredits(userId: number): Promise<any>;
  
  // Waitlist methods
  createWaitlistLead(lead: InsertWaitlistLead): Promise<WaitlistLead>;
  getWaitlistLeads(): Promise<WaitlistLead[]>;
}

export class DatabaseStorage implements IStorage {
  // Metropolitan area consolidation data
  private GLOBAL_METROPOLITAN_AREAS = [
    {
      mainCity: 'Los Angeles Metro',
      state: 'California',
      country: 'United States',
      cities: ['Los Angeles', 'Santa Monica', 'Venice', 'Beverly Hills', 'West Hollywood', 'Pasadena', 'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 'Playa del Rey', 'Culver City', 'Marina del Rey']
    },
    {
      mainCity: 'Nashville Metro', 
      state: 'Tennessee',
      country: 'United States',
      cities: ['Nashville', 'Franklin', 'Murfreesboro', 'Clarksville', 'Hendersonville', 'Smyrna', 'Brentwood']
    },
    {
      mainCity: 'New York City',
      state: 'New York',
      country: 'United States', 
      cities: ['New York City', 'New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']
    }
  ];

  // Helper method to format dates for API responses to prevent timezone shifts
  private formatDateForAPI(date: Date): string {
    // Convert to local date string and add midnight UTC time to prevent shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  // LA METRO CONSOLIDATION ENABLED: Consolidate LA cities to "Los Angeles Metro" as required
  private consolidateToMetropolitanArea(city: string, state?: string | null, country?: string | null): string {
    if (!city) return city;
    
    const cityLower = city.toLowerCase();
    
    // LA Metro consolidation - this IS the correct behavior per user requirements
    for (const metro of this.GLOBAL_METROPOLITAN_AREAS) {
      if (metro.cities.some(metroCity => metroCity.toLowerCase() === cityLower)) {
        return metro.mainCity;
      }
    }
    
    return city;
    const stateLower = (state || '').toLowerCase();
    const countryLower = (country || '').toLowerCase();
    
    for (const metro of this.GLOBAL_METROPOLITAN_AREAS) {
      const metroState = (metro.state || '').toLowerCase();
      const metroCountry = metro.country.toLowerCase();
      
      if (country && metroCountry !== countryLower) continue;
      if (state && metro.state && metroState !== stateLower) continue;
      
      if (metro.cities.some(metroCity => metroCity.toLowerCase() === cityLower)) {
        return metro.mainCity;
      }
    }
    
    return city;
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) return undefined;
    
    // Convert PostgreSQL boolean strings to proper JavaScript booleans using consistent helper
    const asBool = (v: any) => v === true || v === 't' || v === 'true' || v === 1;
    
    // Migrate legacy combined options to new split options
    const migratedInterests = migrateLegacyOptions(user.interests || []);
    const migratedActivities = migrateLegacyOptions(user.activities || []);
    
    return {
      ...user,
      interests: migratedInterests,
      activities: migratedActivities,
      travelingWithChildren: asBool(user.travelingWithChildren),
      isVeteran: asBool(user.isVeteran),
      isActiveDuty: asBool(user.isActiveDuty),
      isCurrentlyTraveling: asBool(user.isCurrentlyTraveling),
      ageVisible: asBool(user.ageVisible),
      sexualPreferenceVisible: asBool(user.sexualPreferenceVisible)
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(sql`LOWER(${users.username})`, username.toLowerCase()));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(sql`LOWER(${users.email})`, email.toLowerCase()));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(
      or(
        eq(sql`LOWER(${users.username})`, usernameOrEmail.toLowerCase()),
        eq(sql`LOWER(${users.email})`, usernameOrEmail.toLowerCase())
      )
    ).limit(1);
    return result[0];
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.facebookId, facebookId));
    return user || undefined;
  }

  async linkFacebookAccount(userId: number, facebookId: string, accessToken: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        facebookId,
        facebookAccessToken: accessToken,
        facebookUrl: `https://facebook.com/${facebookId}`
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async createUserSession(userId: number, sessionToken: string): Promise<void> {
    // For now, we'll use the existing authentication system
    // In a production environment, you'd want a proper sessions table
    console.log(`Session created for user ${userId} with token ${sessionToken}`);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("🔍 STORAGE: createUser called with data:", {
      userType: insertUser.userType,
      isCurrentlyTraveling: insertUser.isCurrentlyTraveling,
      travelDestination: insertUser.travelDestination,
      dateOfBirth: insertUser.dateOfBirth,
      username: insertUser.username,
      email: insertUser.email,
      hometownCity: insertUser.hometownCity
    });
    
    // LA Metro cities that should consolidate to "Los Angeles Metro"
    const laMetroCities = [
      'Los Angeles', 'Playa del Rey', 'Santa Monica', 'Venice', 'Culver City',
      'Marina del Rey', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach',
      'El Segundo', 'Torrance', 'Hawthorne', 'Inglewood', 'West Hollywood',
      'Beverly Hills', 'Century City', 'Brentwood', 'Westwood', 'Pacific Palisades',
      'Malibu', 'Pasadena', 'Glendale', 'Burbank', 'North Hollywood', 'Studio City',
      'Sherman Oaks', 'Encino', 'Tarzana', 'Woodland Hills', 'Calabasas',
      'Agoura Hills', 'Thousand Oaks', 'Simi Valley', 'Northridge', 'Van Nuys',
      'Reseda', 'Canoga Park', 'Chatsworth', 'Granada Hills', 'Sylmar',
      'San Fernando', 'Pacoima', 'Sun Valley', 'La Crescenta', 'La Canada',
      'Montrose', 'Eagle Rock', 'Highland Park', 'Silver Lake', 'Los Feliz',
      'Echo Park', 'Downtown Los Angeles', 'Chinatown', 'Little Tokyo', 'Koreatown',
      'Mid-Wilshire', 'Hancock Park', 'Fairfax', 'West LA', 'Sawtelle',
      'Mar Vista', 'Del Rey', 'Palms', 'Cheviot Hills', 'Pico-Robertson',
      'Baldwin Hills', 'Leimert Park', 'Hyde Park', 'Watts', 'Compton',
      'Lynwood', 'South Gate', 'Downey', 'Norwalk', 'Whittier',
      'Long Beach', 'Venice Beach'
    ];

    // Clean the user data to ensure we only include defined values and handle dates properly
    const cleanUserData: any = {};
    
    // Copy all defined fields from insertUser, ensuring proper data types
    for (const [key, value] of Object.entries(insertUser)) {
      if (value !== undefined && value !== null) {
        cleanUserData[key] = value;
      }
    }

    // LA METRO CONSOLIDATION AT SIGNUP: Consolidate all LA Metro cities to "Los Angeles Metro"
    if (cleanUserData.hometownCity && laMetroCities.includes(cleanUserData.hometownCity)) {
      console.log(`🏙️ LA METRO SIGNUP CONSOLIDATION: ${cleanUserData.hometownCity} → Los Angeles Metro`);
      cleanUserData.hometownCity = 'Los Angeles Metro';
      
      // Also update location field if it exists
      if (cleanUserData.location && cleanUserData.location.includes(insertUser.hometownCity!)) {
        cleanUserData.location = cleanUserData.location.replace(insertUser.hometownCity!, 'Los Angeles Metro');
      }
    }
    
    // DEFAULT COUNTRY: Automatically add hometown country to countries visited
    if (insertUser.hometownCountry && (!insertUser.countriesVisited || insertUser.countriesVisited.length === 0)) {
      cleanUserData.countriesVisited = [insertUser.hometownCountry];
      console.log("🏠 DEFAULT COUNTRY: Added hometown country to countries visited:", insertUser.hometownCountry);
    }
    
    // Ensure dateOfBirth is properly handled if provided
    if (insertUser.dateOfBirth) {
      if (insertUser.dateOfBirth instanceof Date) {
        cleanUserData.dateOfBirth = insertUser.dateOfBirth;
      } else if (typeof insertUser.dateOfBirth === 'string') {
        cleanUserData.dateOfBirth = new Date(insertUser.dateOfBirth);
      }
    }
    
    console.log("🔍 STORAGE: Clean user data for insert:", {
      fieldCount: Object.keys(cleanUserData).length,
      hasDateOfBirth: !!cleanUserData.dateOfBirth,
      userType: cleanUserData.userType,
      isCurrentlyTraveling: cleanUserData.isCurrentlyTraveling
    });
    
    // Create user with the clean data in a single operation
    const [newUser] = await db
      .insert(users)
      .values(cleanUserData)
      .returning();
    
    console.log("🔍 STORAGE: User created successfully with ID:", newUser.id);
    console.log("🔍 STORAGE: Final user data:", {
      id: newUser.id,
      username: newUser.username,
      userType: newUser.userType,
      isCurrentlyTraveling: newUser.isCurrentlyTraveling,
      hasDateOfBirth: !!newUser.dateOfBirth,
      location: newUser.location,
      hometown: newUser.hometown
    });
    
    // 🏠 AUTOMATIC CHATROOM ASSIGNMENT: Add new user to appropriate chatrooms
    try {
      await this.assignUserToChatrooms(newUser);
      console.log("✅ CHATROOM ASSIGNMENT: User automatically assigned to chatrooms");
    } catch (error) {
      console.error("❌ CHATROOM ASSIGNMENT ERROR:", error);
      // Don't fail user creation if chatroom assignment fails
    }
    
    return newUser;
  }

  // 🏠 AUTOMATIC CHATROOM ASSIGNMENT SYSTEM
  async assignUserToChatrooms(user: User): Promise<void> {
    console.log("🏠 CHATROOM ASSIGNMENT: Starting assignment for user", user.id, user.username);
    
    // Import metro area constants
    const { METRO_AREAS } = await import('@shared/constants');
    const LA_METRO_AREAS = METRO_AREAS['Los Angeles']?.cities || [];
    
    // 1. GLOBAL CHATROOM: Add to "Welcome to Nearby Traveler" 
    await this.ensureAndJoinChatroom(user, {
      name: "Welcome to Nearby Traveler",
      city: "Global",
      country: "Global",
      description: "Welcome all new travelers and locals to the Nearby Traveler community!"
    });
    
    // 2. HOMETOWN CHATROOMS: Based on user's hometown
    let hometownCity = user.hometownCity;
    let hometownState = user.hometownState;
    let hometownCountry = user.hometownCountry;
    
    // Handle LA Metro consolidation for hometowns
    if (hometownCountry === 'United States' && hometownCity && LA_METRO_AREAS.includes(hometownCity)) {
      hometownCity = 'Los Angeles Metro';
      hometownState = 'California';
    }
    
    if (hometownCity) {
      // Hometown Chatroom - SINGLE CHATROOM PER CITY
      await this.ensureAndJoinChatroom(user, {
        name: `Let's Meet Up in ${hometownCity}`,
        city: hometownCity || 'Unknown',
        state: hometownState,
        country: hometownCountry || 'United States',
        description: `Connect with locals and travelers in ${hometownCity}`
      });
    }
    
    // 3. TRAVEL DESTINATION CHATROOM: If currently traveling
    if (user.isCurrentlyTraveling && user.destinationCity) {
      let destinationCity = user.destinationCity;
      let destinationState = user.destinationState;
      let destinationCountry = user.destinationCountry;
      
      // Handle LA Metro consolidation for destinations
      if (destinationCountry === 'United States' && destinationCity && LA_METRO_AREAS.includes(destinationCity)) {
        destinationCity = 'Los Angeles Metro';
        destinationState = 'California';
      }
      
      // Destination Chatroom - SINGLE CHATROOM PER CITY
      await this.ensureAndJoinChatroom(user, {
        name: `Let's Meet Up in ${destinationCity}`,
        city: destinationCity || 'Unknown',
        state: destinationState,
        country: destinationCountry || 'United States',
        description: `Connect with locals and travelers in ${destinationCity}`
      });
    }
    
    console.log("✅ CHATROOM ASSIGNMENT: Completed for user", user.username);
  }
  
  // Helper function to create chatroom if it doesn't exist and add user as member
  async ensureAndJoinChatroom(user: User, chatroomData: {
    name: string;
    city: string;
    state?: string;
    country: string;
    description: string;
  }): Promise<void> {
    try {
      // Check if chatroom already exists
      const existingChatroom = await db
        .select()
        .from(citychatrooms)
        .where(
          and(
            eq(citychatrooms.name, chatroomData.name),
            eq(citychatrooms.city, chatroomData.city)
          )
        )
        .limit(1);
      
      let chatroom;
      
      if (existingChatroom.length > 0) {
        chatroom = existingChatroom[0];
        console.log("🔄 CHATROOM: Using existing chatroom", chatroom.name);
      } else {
        // Create new chatroom
        const [newChatroom] = await db
          .insert(citychatrooms)
          .values({
            name: chatroomData.name,
            city: chatroomData.city,
            state: chatroomData.state,
            country: chatroomData.country,
            description: chatroomData.description,
            createdById: 1, // System user creates these chatrooms
            isActive: true,
            isPublic: true,
            maxMembers: 500
          })
          .returning();
        
        chatroom = newChatroom;
        console.log("✨ CHATROOM: Created new chatroom", chatroom.name);
      }
      
      // Check if user is already a member
      const existingMembership = await db
        .select()
        .from(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.chatroomId, chatroom.id),
            eq(chatroomMembers.userId, user.id)
          )
        )
        .limit(1);
      
      if (existingMembership.length === 0) {
        // Add user to chatroom
        await db
          .insert(chatroomMembers)
          .values({
            chatroomId: chatroom.id,
            userId: user.id,
            role: 'member',
            isActive: true
          });
        
        console.log("👥 MEMBERSHIP: Added", user.username, "to chatroom", chatroom.name);
      } else {
        console.log("👥 MEMBERSHIP: User", user.username, "already in chatroom", chatroom.name);
      }
      
    } catch (error) {
      console.error("❌ CHATROOM ASSIGNMENT ERROR for", chatroomData.name, ":", error);
      throw error;
    }
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        username: userData.email || `user_${userData.id}`,
        userType: 'traveler',
        location: 'Los Angeles',
        hometown: 'Los Angeles'
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      // Clean the data and ensure we're working with the right types
      const cleanData: any = {};
      
      // Handle boolean fields explicitly 
      if ('travelingWithChildren' in data) {
        cleanData.travelingWithChildren = Boolean(data.travelingWithChildren);
        if (!cleanData.travelingWithChildren) {
          cleanData.childrenAges = null;
        }
      }
      
      if ('ageVisible' in data) {
        cleanData.ageVisible = Boolean(data.ageVisible);
      }
      
      if ('sexualPreferenceVisible' in data) {
        cleanData.sexualPreferenceVisible = Boolean(data.sexualPreferenceVisible);
      }
      
      if ('isVeteran' in data) {
        cleanData.isVeteran = Boolean(data.isVeteran);
      }
      
      if ('isActiveDuty' in data) {
        cleanData.isActiveDuty = Boolean(data.isActiveDuty);
      }
      
      if ('isCurrentlyTraveling' in data) {
        cleanData.isCurrentlyTraveling = Boolean(data.isCurrentlyTraveling);
      }

      // Copy other fields (non-boolean)
      const booleanFields = ['travelingWithChildren', 'ageVisible', 'sexualPreferenceVisible', 'isVeteran', 'isActiveDuty', 'isCurrentlyTraveling'];
      for (const [key, value] of Object.entries(data)) {
        if (!booleanFields.includes(key) && value !== undefined) {
          cleanData[key] = value;
        }
      }
      
      console.log('🔧 STORAGE UPDATE v2: Applying clean data update:', {
        userId: id,
        fieldCount: Object.keys(cleanData).length,
        fields: Object.keys(cleanData),
        timestamp: Date.now()
      });

      // TEMPORARY FIX: Use direct pool query to bypass Drizzle ORM issue
      if (Object.keys(cleanData).length === 0) {
        console.log('🔧 STORAGE UPDATE: No fields to update');
        return await this.getUserById(id);
      }

      // Field name mapping from camelCase to snake_case for database columns
      const fieldNameMap: Record<string, string> = {
        userType: 'user_type',  // CRITICAL FIX: Add missing userType mapping
        hometownCity: 'hometown_city',
        hometownState: 'hometown_state', 
        hometownCountry: 'hometown_country',
        destinationCity: 'destination_city',
        destinationState: 'destination_state',
        destinationCountry: 'destination_country',
        travelStyle: 'travel_style',
        travelWhy: 'travel_why',
        travelWhat: 'travel_what',
        travelHow: 'travel_how',
        travelBudget: 'travel_budget',
        travelGroup: 'travel_group',
        dateOfBirth: 'date_of_birth',
        ageVisible: 'age_visible',
        sexualPreference: 'sexual_preference',
        sexualPreferenceVisible: 'sexual_preference_visible',
        travelingWithChildren: 'traveling_with_children',
        childrenAges: 'children_ages',
        isVeteran: 'is_veteran',
        isActiveDuty: 'is_active_duty',
        isCurrentlyTraveling: 'is_currently_traveling',
        secretActivities: 'secret_activities',
        businessName: 'business_name',
        businessDescription: 'business_description',
        businessType: 'business_type',
        streetAddress: 'street_address',
        zipCode: 'zip_code',
        phoneNumber: 'phone_number',
        websiteUrl: 'website_url',
        customInterests: 'custom_interests',
        customActivities: 'custom_activities',
        customEvents: 'custom_events',
        privateInterests: 'private_interests',
        languagesSpoken: 'languages_spoken',
        countriesVisited: 'countries_visited',
        isMinorityOwned: 'is_minority_owned',
        isFemaleOwned: 'is_female_owned',
        isLGBTQIAOwned: 'is_lgbtqia_owned',
        showMinorityOwned: 'show_minority_owned',
        showFemaleOwned: 'show_female_owned',
        showLGBTQIAOwned: 'show_lgbtqia_owned',
        ownerName: 'owner_name',
        contactName: 'contact_name',
        ownerEmail: 'owner_email',
        ownerPhone: 'owner_phone',
        profileImage: 'profile_image',
        latitude: 'latitude',
        longitude: 'longitude',
        passwordResetToken: 'password_reset_token',
        passwordResetExpires: 'password_reset_expires'
      };

      // Convert field names to snake_case for database
      const dbCleanData: any = {};
      
      try {
        console.log('🔧 STORAGE UPDATE: Starting field mapping...');
        for (const [key, value] of Object.entries(cleanData)) {
          // Skip if already snake_case (from route handler)
          if (key.includes('_')) {
            dbCleanData[key] = value;
            console.log(`🔧 STORAGE UPDATE: Keeping snake_case field: ${key}`);
          } else {
            const dbKey = fieldNameMap[key] || key;
            dbCleanData[dbKey] = value;
            if (dbKey !== key) {
              console.log(`🔧 STORAGE UPDATE: Mapped ${key} → ${dbKey}`);
            }
          }
        }
      } catch (mappingError) {
        console.error('🔧 STORAGE UPDATE: Field mapping error:', mappingError);
        throw mappingError;
      }

      console.log('🔧 STORAGE UPDATE: Field mapping completed:', {
        original: Object.keys(cleanData),
        converted: Object.keys(dbCleanData)
      });

      // Build the SQL update statement manually from MAPPED data
      const setClause = Object.keys(dbCleanData)
        .map((key, index) => `"${key}" = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(dbCleanData)];
      
      const sqlQuery = `
        UPDATE users 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      console.log('🔧 STORAGE UPDATE v2: Executing SQL with mapped fields');
      console.log('🔧 STORAGE UPDATE v2: SQL Query:', sqlQuery);
      console.log('🔧 STORAGE UPDATE v2: With values:', values);
      
      // Use direct pool query instead of Drizzle
      const result = await pool.query(sqlQuery, values);
      const user = result.rows[0] as any;
      
      if (!user) {
        console.log('🔧 STORAGE UPDATE: No user found with ID:', id);
        return undefined;
      }
      
      console.log('🔧 STORAGE UPDATE: Successfully updated user:', user.id);
      
      // Handle secret activities sync if needed
      if (data.secretActivities !== undefined && user) {
        await this.syncUserSecretExperience(user.id, data.secretActivities, user.hometownCity, user.hometownState, user.hometownCountry);
      }
      
      // Convert PostgreSQL boolean strings to proper JavaScript booleans
      const asBool = (v: any) => v === true || v === 't' || v === 'true' || v === 1;
      
      return {
        ...user,
        travelingWithChildren: asBool(user.travelingWithChildren),
        isVeteran: asBool(user.isVeteran),
        isActiveDuty: asBool(user.isActiveDuty),
        isCurrentlyTraveling: asBool(user.isCurrentlyTraveling),
        ageVisible: asBool(user.ageVisible),
        sexualPreferenceVisible: asBool(user.sexualPreferenceVisible)
      };
    } catch (error) {
      console.error('🔧 STORAGE UPDATE ERROR:', error);
      throw error;
    }
  }

  async updateUserAura(userId: number, auraPoints: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          aura: sql`${users.aura} + ${auraPoints}`
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user aura:', error);
      throw error;
    }
  }

  // Sync user's secret activities to the secret experiences table
  async syncUserSecretExperience(userId: number, secretActivities: string | null, hometownCity: string | null, hometownState: string | null, hometownCountry: string | null): Promise<void> {
    try {
      if (!hometownCity || !hometownCountry) {
        console.log('User does not have complete hometown info, skipping secret experience sync');
        return;
      }

      // Check if experience already exists for this user
      let [existingExperience] = await db.select()
        .from(secretLocalExperiences)
        .where(eq(secretLocalExperiences.contributorId, userId));

      if (!existingExperience && secretActivities && secretActivities.trim()) {
        // Create new experience entry
        await db.insert(secretLocalExperiences)
          .values({
            experience: secretActivities.trim(),
            description: secretActivities.trim(),
            category: 'local_secret',
            contributorId: userId,
            likes: 1,
            isActive: true
          });
        console.log(`Created new secret experience for user ${userId}`);
      } else if (existingExperience) {
        // Update existing experience
        await db.update(secretLocalExperiences)
          .set({ 
            experience: secretActivities ? secretActivities.trim() : '',
            description: secretActivities ? secretActivities.trim() : '',
            isActive: secretActivities && secretActivities.trim() ? true : false
          })
          .where(eq(secretLocalExperiences.id, existingExperience.id));
        console.log(`Updated secret experience for user ${userId}`);
      }
    } catch (error) {
      console.error('Error syncing user secret experience:', error);
    }
  }

  // Event methods
  async createEvent(event: InsertEvent): Promise<Event> {
    console.log('Creating event with data:', {
      title: event.title,
      category: event.category,
      organizerId: event.organizerId,
      hasDate: !!event.date,
      hasLocation: !!event.city,
      hasImage: !!event.imageUrl,
      imageLength: event.imageUrl ? event.imageUrl.length : 0
    });
    
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    
    console.log('Event created successfully:', newEvent.id, 'with image:', !!newEvent.imageUrl);
    
    // Automatically add the event creator as a participant
    if (newEvent.organizerId) {
      try {
        await this.joinEvent(newEvent.id, newEvent.organizerId);
      } catch (error) {
        console.error('Failed to add event creator as participant:', error);
        // Don't fail event creation if participant addition fails
      }
    }
    
    return newEvent;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  // Method to check if user can see an event based on demographics
  async canUserSeeEvent(event: Event, userId?: number): Promise<boolean> {
    // If no user ID provided, only show public events with no restrictions
    if (!userId) {
      return !event.genderRestriction && 
             !event.lgbtqiaOnly && 
             !event.veteransOnly && 
             !event.activeDutyOnly && 
             !event.womenOnly && 
             !event.menOnly && 
             !event.singlePeopleOnly && 
             !event.familiesOnly && 
             !event.ageRestrictionMin && 
             !event.ageRestrictionMax &&
             !event.customRestriction;
    }

    // Get user demographics
    const user = await this.getUser(userId);
    if (!user) return false;

    // Check gender restrictions
    if (event.genderRestriction && user.gender !== event.genderRestriction) {
      return false;
    }

    // Check women/men only flags (legacy support for boolean flags)
    if (event.womenOnly && user.gender !== 'female') {
      return false;
    }
    if (event.menOnly && user.gender !== 'male') {
      return false;
    }

    // Check LGBTQIA+ only events
    if (event.lgbtqiaOnly) {
      const lgbtqiaOrientations = ['gay', 'lesbian', 'bisexual', 'pansexual', 'queer'];
      if (!user.sexualPreference?.some(pref => lgbtqiaOrientations.includes(pref))) {
        return false;
      }
    }

    // Check veteran status
    if (event.veteransOnly && !user.isVeteran) {
      return false;
    }

    // Check active duty status
    if (event.activeDutyOnly && !user.isActiveDuty) {
      return false;
    }

    // Check single people only
    if (event.singlePeopleOnly) {
      const singleInterests = user.interests?.includes('single and looking');
      if (!singleInterests) {
        return false;
      }
    }

    // Check families only
    if (event.familiesOnly && !user.travelingWithChildren) {
      return false;
    }

    // Check age restrictions
    if (user.age) {
      if (event.ageRestrictionMin && user.age < event.ageRestrictionMin) {
        return false;
      }
      if (event.ageRestrictionMax && user.age > event.ageRestrictionMax) {
        return false;
      }
    }

    // Check custom restriction tags (e.g., "Taylor Swift fans only", "Dog lovers only")
    if (event.customRestriction) {
      const restrictionTag = event.customRestriction.toLowerCase().replace(' only', '').trim();
      
      // Check if user's interests, activities, or custom interests contain the restriction keyword
      const userInterests = (user.interests || []).map(i => i.toLowerCase());
      const userActivities = (user.activities || []).map(a => a.toLowerCase());
      const userCustomInterests = user.customInterests ? user.customInterests.toLowerCase().split(',').map(i => i.trim()) : [];
      const userBio = user.bio ? user.bio.toLowerCase() : '';
      
      // Combined search pool: interests, activities, custom interests, and bio
      const searchFields = [...userInterests, ...userActivities, ...userCustomInterests, userBio];
      
      // Check if any user field contains the restriction keyword
      const matchesRestriction = searchFields.some(field => {
        if (typeof field === 'string') {
          return field.includes(restrictionTag) || restrictionTag.includes(field);
        }
        return false;
      });
      
      if (!matchesRestriction) {
        console.log(`🏷️ CUSTOM TAG FILTER: User ${user.username} excluded from "${event.title}" (requires: ${event.customRestriction})`);
        return false;
      } else {
        console.log(`✅ CUSTOM TAG MATCH: User ${user.username} matches "${event.customRestriction}" for event "${event.title}"`);
      }
    }

    return true;
  }

  async getAllEvents(userId?: number): Promise<Event[]> {
    try {
      const allEvents = await db.select().from(events).orderBy(desc(events.date));
      
      // Filter events based on user demographics
      const visibleEvents = [];
      for (const event of allEvents) {
        if (await this.canUserSeeEvent(event, userId)) {
          visibleEvents.push(event);
        }
      }

      // Get participant counts for visible events
      const participantCounts = await Promise.all(
        visibleEvents.map(async (event) => {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventParticipants)
            .where(eq(eventParticipants.eventId, event.id));
          return { eventId: event.id, count: result?.count || 0 };
        })
      );

      // Create participant count lookup
      const participantCountMap = new Map(participantCounts.map(pc => [pc.eventId, pc.count]));

      // Add participant counts to events
      const eventsWithCounts = visibleEvents.map(event => ({
        ...event,
        participantCount: participantCountMap.get(event.id) || 0
      }));

      return eventsWithCounts;
    } catch (error) {
      console.error('Error fetching all events:', error);
      return [];
    }
  }

  async getUpcomingEvents(city: string): Promise<Event[]> {
    return await db.select().from(events).where(
      and(
        or(
          ilike(events.location, `%${city}%`),
          ilike(events.city, `%${city}%`)
        ),
        gte(events.date, new Date())
      )
    );
  }

  async getEventsByMetropolitanArea(searchLocation: string): Promise<Event[]> {
    // Use the same metropolitan area mapping logic as user search
    const getMetropolitanArea = (city: string, state: string, country: string) => {
      const cityLower = city.toLowerCase().trim();
      const stateLower = (state || '').toLowerCase().trim();
      const countryLower = (country || '').toLowerCase().trim();

      // State abbreviation mapping
      const stateAbbreviations: Record<string, string> = {
        'ca': 'california', 'ny': 'new york', 'ma': 'massachusetts', 'tx': 'texas', 'fl': 'florida',
        'il': 'illinois', 'pa': 'pennsylvania', 'oh': 'ohio', 'mi': 'michigan', 'ga': 'georgia'
      };

      const normalizedState = stateAbbreviations[stateLower] || stateLower;
      const isUS = countryLower.includes('united states') || countryLower.includes('usa') || countryLower.includes('us') || countryLower === '';

      // Los Angeles Metropolitan Area
      if (isUS && (normalizedState.includes('california') || stateLower === 'ca')) {
        if (cityLower.includes('playa') || cityLower.includes('santa monica') || 
            cityLower.includes('beverly') || cityLower.includes('hollywood') ||
            cityLower.includes('venice') || cityLower.includes('culver') ||
            cityLower.includes('manhattan beach') || cityLower.includes('redondo') ||
            cityLower.includes('segundo') || cityLower.includes('inglewood') ||
            cityLower.includes('torrance') || cityLower.includes('long beach') ||
            cityLower.includes('pasadena') || cityLower.includes('burbank') ||
            cityLower.includes('glendale') || cityLower.includes('los angeles') ||
            cityLower.includes('lax') || cityLower.includes('marina') ||
            cityLower.includes('hermosa') || cityLower.includes('malibu') ||
            cityLower.includes('west hollywood') || cityLower.includes('westwood')) {
          return { city: 'Los Angeles Metro', state: 'California', country: 'United States' };
        }
      }

      // New York Metropolitan Area
      if (isUS && (normalizedState.includes('new york') || stateLower === 'ny')) {
        if (cityLower.includes('manhattan') || (cityLower.includes('new york') && !cityLower.includes('brooklyn')) ||
            cityLower.includes('nyc')) {
          return { city: 'Manhattan', state: 'New York', country: 'United States' };
        }
      }

      // International Cities
      if ((cityLower.includes('budapest') || cityLower === 'budapest') && 
          (countryLower.includes('hungary') || countryLower === 'hungary')) {
        return { city: 'Budapest', state: '', country: 'Hungary' };
      }

      if ((cityLower.includes('rome') || cityLower === 'rome') && 
          (countryLower.includes('italy') || countryLower === 'italy')) {
        return { city: 'Rome', state: '', country: 'Italy' };
      }

      // Return normalized version
      return { 
        city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(), 
        state: state ? state.charAt(0).toUpperCase() + state.slice(1).toLowerCase() : '', 
        country: country ? country.charAt(0).toUpperCase() + country.slice(1).toLowerCase() : '' 
      };
    };

    // Parse search location
    const searchParts = searchLocation.split(', ');
    const searchCity = searchParts[0] || '';
    const searchState = searchParts[1] || '';
    const searchCountry = searchParts[2] || '';
    
    // Get metropolitan area for search location
    const searchMetro = getMetropolitanArea(searchCity, searchState, searchCountry);

    // Get all events and filter by metropolitan area - include events from today
    // Use DATE comparison to include all events from today regardless of time
    const allEvents = await db.select().from(events).where(
      sql`DATE(${events.date}) >= CURRENT_DATE`
    );

    const filteredEvents = allEvents.filter(event => {
      // Check event city and location fields - normalize to handle case sensitivity
      const eventCity = (event.city || '').trim();
      const eventLocation = (event.location || '').trim();
      
      // Check if event city matches search metropolitan area
      if (eventCity) {
        const eventMetro = getMetropolitanArea(eventCity, event.state || '', '');
        const cityMatch = eventMetro.city.toLowerCase() === searchMetro.city.toLowerCase();
        const countryMatch = eventMetro.country.toLowerCase() === searchMetro.country.toLowerCase() || 
                            !eventMetro.country || !searchMetro.country;
        
        if (cityMatch && countryMatch) {
          return true;
        }
      }
      
      // Also check if event location field contains relevant city info
      if (eventLocation && eventLocation.includes(',')) {
        const parts = eventLocation.split(',');
        const locCity = parts[0]?.trim() || '';
        const locState = parts[1]?.trim() || '';
        const locCountry = parts[2]?.trim() || '';
        
        const locMetro = getMetropolitanArea(locCity, locState, locCountry);
        const cityMatch = locMetro.city.toLowerCase() === searchMetro.city.toLowerCase();
        const countryMatch = locMetro.country.toLowerCase() === searchMetro.country.toLowerCase() || 
                            !locMetro.country || !searchMetro.country;
        
        if (cityMatch && countryMatch) {
          return true;
        }
      }
      return false;
    });

    console.log(`Events search for ${searchLocation} found ${filteredEvents.length} events`);
    return filteredEvents;
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.organizerId, userId));
  }

  async getEventsByOrganizer(organizerId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.organizerId, organizerId));
  }

  async getEventsByLocation(city: string, state: string = '', country: string = ''): Promise<Event[]> {
    try {
      console.log(`🎪 REAL EVENTS: Getting REAL events for location: ${city}, ${state}, ${country}`);
      
      const cityName = city.split(',')[0].trim(); // Extract main city name
      console.log(`🎪 REAL EVENTS: Searching for REAL events in city: ${cityName}`);
      
      // Import LA Metro area logic
      const { isLAMetroCity, getMetroCities } = await import('../shared/constants');
      
      // Import real event APIs
      const { fetchTicketmasterEvents } = await import('./apis/ticketmaster');
      const { fetchEventbriteEvents } = await import('./apis/eventbrite');
      
      // Check if this is an LA Metro city - if so, search for ALL metro events
      const searchCities = isLAMetroCity(cityName) ? getMetroCities(cityName) : [cityName];
      console.log(`🎪 LA METRO: ${cityName} is LA Metro city: ${isLAMetroCity(cityName)}. Searching in ${searchCities.length} cities: ${searchCities.slice(0, 5).join(', ')}...`);
      
      // For external APIs, always use "Los Angeles" for LA Metro cities to get better results
      const apiSearchCity = isLAMetroCity(cityName) ? 'Los Angeles' : cityName;
      
      // Fetch REAL events from external APIs
      const [ticketmasterEvents, eventbriteEvents] = await Promise.all([
        fetchTicketmasterEvents(apiSearchCity).catch(err => {
          console.log(`🎫 TICKETMASTER: Error fetching ${apiSearchCity} events:`, err.message);
          return [];
        }),
        fetchEventbriteEvents(apiSearchCity).catch(err => {
          console.log(`🎪 EVENTBRITE: Error fetching ${apiSearchCity} events:`, err.message);
          return [];
        })
      ]);
      
      const realEvents = [...ticketmasterEvents, ...eventbriteEvents];
      console.log(`🎪 REAL EVENTS: Found ${realEvents.length} REAL events from APIs (${ticketmasterEvents.length} Ticketmaster + ${eventbriteEvents.length} Eventbrite) for ${apiSearchCity}`);
      
      // Get local database events - search ALL metro cities if it's LA Metro
      let whereConditions = [];
      for (const searchCity of searchCities) {
        whereConditions.push(
          or(
            ilike(events.city, `%${searchCity}%`),
            ilike(events.location, `%${searchCity}%`)
          )
        );
      }
      
      const finalWhereCondition = whereConditions.length > 1 ? or(...whereConditions) : whereConditions[0];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const localEvents = await db.select().from(events)
        .where(and(
          finalWhereCondition, 
          eq(events.isActive, true),
          gte(events.date, today) // Only future events
        ))
        .orderBy(asc(events.date)); // Upcoming events first
      
      console.log(`🎪 REAL EVENTS: Found ${localEvents.length} local database events for LA Metro area (${searchCities.length} cities)`);

      // Get participant counts for local events
      const participantCounts = await Promise.all(
        localEvents.map(async (event) => {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventParticipants)
            .where(eq(eventParticipants.eventId, event.id));
          return { eventId: event.id, count: result?.count || 0 };
        })
      );

      // Create participant count lookup
      const participantCountMap = new Map(participantCounts.map(pc => [pc.eventId, pc.count]));

      // Add participant counts to local events
      const localEventsWithCounts = localEvents.map(event => ({
        ...event,
        participantCount: participantCountMap.get(event.id) || 0
      }));

      // Transform real events to match our Event interface
      const transformedRealEvents = realEvents.map((event: any, index: number) => ({
        id: -(1000 + index), // Negative IDs to distinguish from DB events
        title: event.title || event.name,
        description: event.description || event.info || '',
        date: event.date,
        endDate: event.endDate || null,
        time: event.time || null,
        endTime: event.endTime || null,
        location: event.venue || event.location || '',
        address: event.address || '',
        city: event.city || cityName,
        state: event.state || state,
        country: event.country || country,
        organizerId: 0, // External events have no organizer in our system
        capacity: event.capacity || null,
        price: event.price || 'Check event details',
        category: event.category || 'Entertainment',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        participantCount: Math.floor(Math.random() * 50) + 10, // Simulated attendance
        organizer: event.organizer || 'External Organizer',
        imageUrl: event.image || event.images?.[0]?.url || null,
        url: event.url || null,
        source: event.source || 'external'
      }));

      // Combine and sort all events by date
      const allEvents = [...localEventsWithCounts, ...transformedRealEvents]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log(`🎪 REAL EVENTS: Returning ${allEvents.length} total events (${localEventsWithCounts.length} local + ${transformedRealEvents.length} real) for ${cityName}`);
      return allEvents;
      
    } catch (error) {
      console.error('🎪 REAL EVENTS: Error fetching events by location:', error);
      return [];
    }
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true;
  }

  // Event participation methods
  async joinEvent(eventId: number, userId: number, notes?: string, status: string = 'going'): Promise<EventParticipant> {
    // Check if user is already a participant
    const [existingParticipant] = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        )
      );

    // If already a participant, update their status
    if (existingParticipant) {
      const [updated] = await db
        .update(eventParticipants)
        .set({ status, notes: notes || existingParticipant.notes })
        .where(eq(eventParticipants.id, existingParticipant.id))
        .returning();
      return updated;
    }

    const [participant] = await db
      .insert(eventParticipants)
      .values({
        eventId,
        userId,
        notes: notes || "",
        status
      })
      .returning();
    return participant;
  }

  async leaveEvent(eventId: number, userId: number): Promise<boolean> {
    await db
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        )
      );
    return true;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipantWithUser[]> {
    // Get participants with user details and mark event creator
    const participants = await db
      .select({
        id: eventParticipants.id,
        eventId: eventParticipants.eventId,
        userId: eventParticipants.userId,
        notes: eventParticipants.notes,
        status: eventParticipants.status,
        role: eventParticipants.role,
        joinedAt: eventParticipants.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          userType: users.userType
        }
      })
      .from(eventParticipants)
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId));

    // Get event details to identify the creator
    const event = await this.getEvent(eventId);
    
    // Mark the event creator in the participants list
    return participants.map(participant => ({
      ...participant,
      isEventCreator: participant.userId === event?.organizerId
    }));
  }

  async getUserEventParticipations(userId: number): Promise<EventParticipant[]> {
    return await db.select().from(eventParticipants).where(eq(eventParticipants.userId, userId));
  }

  async getAllEventsWithParticipants(): Promise<any[]> {
    const eventsWithParticipants = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        date: events.date,
        organizerId: events.organizerId,
        participants: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'userId', ${eventParticipants.userId},
                'status', ${eventParticipants.status},
                'joinedAt', ${eventParticipants.joinedAt},
                'userName', ${users.name},
                'userEmail', ${users.email}
              )
            ) FILTER (WHERE ${eventParticipants.userId} IS NOT NULL),
            '[]'::json
          )
        `
      })
      .from(events)
      .leftJoin(eventParticipants, eq(events.id, eventParticipants.eventId))
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .groupBy(events.id);

    return eventsWithParticipants;
  }

  async isUserInterestedInEvent(userId: number, eventId?: number, externalEventId?: string, eventSource?: string): Promise<boolean> {
    try {
      // For internal events, check if user is a participant
      if (eventId) {
        const [participant] = await db
          .select()
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, eventId),
              eq(eventParticipants.userId, userId)
            )
          );
        return !!participant;
      }
      
      // For external events, always return false for now
      // TODO: Implement external event interest tracking if needed
      return false;
    } catch (error) {
      console.error('Error checking user event interest:', error);
      return false;
    }
  }

  // Connection methods
  async getConnection(userId: number, connectedUserId: number): Promise<Connection | undefined> {
    const [connection] = await db.select().from(connections).where(
      or(
        and(eq(connections.requesterId, userId), eq(connections.receiverId, connectedUserId)),
        and(eq(connections.requesterId, connectedUserId), eq(connections.receiverId, userId))
      )
    );
    return connection || undefined;
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const [connection] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    return connection || undefined;
  }

  async getUserConnections(userId: number, filters?: any): Promise<any[]> {
    try {
      // Get connections where the user is either requester or receiver and status is accepted
      const userConnections = await db
        .select({
          connectionId: connections.id,
          status: connections.status,
          createdAt: connections.createdAt,
          requesterId: connections.requesterId,
          receiverId: connections.receiverId,
          connectionNote: connections.connectionNote,
          // Join with users table to get the connected user's information
          connectedUser: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
            avatarColor: users.avatarColor,
            email: users.email,
            userType: users.userType,
            bio: users.bio,
            location: users.location,
            hometownCity: users.hometownCity,
            hometownState: users.hometownState,
            hometownCountry: users.hometownCountry,
            dateOfBirth: users.dateOfBirth,
            gender: users.gender,
            sexualPreference: users.sexualPreference,
            interests: users.interests,
            activities: users.activities,
            travelStyle: users.travelStyle,
            languagesSpoken: users.languagesSpoken,
            countriesVisited: users.countriesVisited
          }
        })
        .from(connections)
        .innerJoin(users, 
          // Join with the user who is NOT the current user
          or(
            and(eq(connections.requesterId, userId), eq(users.id, connections.receiverId)),
            and(eq(connections.receiverId, userId), eq(users.id, connections.requesterId))
          )
        )
        .where(
          and(
            or(
              eq(connections.requesterId, userId),
              eq(connections.receiverId, userId)
            ),
            eq(connections.status, 'accepted') // Only show accepted connections
          )
        );

      // Apply filters if provided
      let filteredConnections = userConnections;

      if (filters) {
        if (filters.location && filters.location !== 'all') {
          filteredConnections = filteredConnections.filter(conn => 
            conn.connectedUser.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
            conn.connectedUser.hometownCity?.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        if (filters.gender && filters.gender !== 'all') {
          filteredConnections = filteredConnections.filter(conn => 
            conn.connectedUser.gender?.toLowerCase() === filters.gender.toLowerCase()
          );
        }

        if (filters.sexualPreference && filters.sexualPreference !== 'all') {
          filteredConnections = filteredConnections.filter(conn => 
            conn.connectedUser.sexualPreference?.some((pref: string) => 
              pref.toLowerCase() === filters.sexualPreference.toLowerCase()
            )
          );
        }

        if (filters.minAge || filters.maxAge) {
          filteredConnections = filteredConnections.filter(conn => {
            if (!conn.connectedUser.dateOfBirth) return true;
            
            const birthDate = new Date(conn.connectedUser.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
              ? age - 1 : age;

            if (filters.minAge && actualAge < filters.minAge) return false;
            if (filters.maxAge && actualAge > filters.maxAge) return false;
            return true;
          });
        }
      }

      return filteredConnections.map(conn => ({
        id: conn.connectionId,
        status: conn.status,
        createdAt: conn.createdAt,
        connectionNote: conn.connectionNote,
        connectedUser: conn.connectedUser
      }));

    } catch (error) {
      console.error('Error fetching user connections:', error);
      return [];
    }
  }

  async getConnectionRequests(userId: number): Promise<any[]> {
    return await db
      .select({
        id: connections.id,
        status: connections.status,
        createdAt: connections.createdAt,
        requesterUser: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          sexualPreference: users.sexualPreference,
          interests: users.interests,
          activities: users.activities,
          travelStyle: users.travelStyle,
          languagesSpoken: users.languagesSpoken,
          countriesVisited: users.countriesVisited
        }
      })
      .from(connections)
      .leftJoin(users, eq(connections.requesterId, users.id))
      .where(
        and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        )
      );
  }

  async getConnectionBetweenUsers(userId1: number, userId2: number): Promise<Connection | undefined> {
    const [connection] = await db.select().from(connections).where(
      or(
        and(eq(connections.requesterId, userId1), eq(connections.receiverId, userId2)),
        and(eq(connections.requesterId, userId2), eq(connections.receiverId, userId1))
      )
    );
    return connection || undefined;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
        and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
      )
    );
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      )
    ).orderBy(desc(messages.createdAt));
  }



  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  async markConversationAsRead(userId: number, otherUserId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  async getRecentMessages(userId: number, limit?: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit || 20);
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // 3-day digest methods
  async trackUserForWeeklyDigest(userId: number, city: string, username: string, userType: string, interests: string[]): Promise<void> {
    // Calculate the current 3-day cycle
    const now = new Date();
    const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const cycleNumber = Math.floor(daysSinceEpoch / 3); // Every 3 days
    
    const cycleStart = new Date(cycleNumber * 3 * 24 * 60 * 60 * 1000);
    cycleStart.setHours(0, 0, 0, 0);
    
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 2);
    cycleEnd.setHours(23, 59, 59, 999);

    try {
      await db.execute(sql`
        INSERT INTO weekly_digest_tracker (user_id, city, username, user_type, interests, join_date, week_start, week_end)
        VALUES (${userId}, ${city}, ${username}, ${userType}, ${interests}, NOW(), ${cycleStart}, ${cycleEnd})
      `);
      
      console.log(`📅 Tracked user ${username} for 3-day digest in ${city} (Cycle: ${cycleStart.toDateString()} - ${cycleEnd.toDateString()})`);
    } catch (error) {
      console.error("Failed to track user for 3-day digest:", error);
    }
  }

  async getWeeklyDigestUsers(cycleStart: Date, cycleEnd: Date): Promise<any[]> {
    try {
      const results = await db.execute(sql`
        SELECT 
          city,
          array_agg(
            json_build_object(
              'username', username,
              'userType', user_type,
              'interests', interests,
              'joinDate', join_date
            ) ORDER BY join_date
          ) as new_users
        FROM weekly_digest_tracker
        WHERE week_start = ${cycleStart} 
          AND week_end = ${cycleEnd}
          AND digest_sent = false
        GROUP BY city
        HAVING count(*) > 0
      `);
      
      return results.rows || [];
    } catch (error) {
      console.error("Failed to get 3-day digest users:", error);
      return [];
    }
  }

  async markDigestAsSent(cycleStart: Date, cycleEnd: Date): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE weekly_digest_tracker 
        SET digest_sent = true 
        WHERE week_start = ${cycleStart} AND week_end = ${cycleEnd}
      `);
      
      console.log(`✅ Marked 3-day digest as sent for cycle ${cycleStart.toDateString()} - ${cycleEnd.toDateString()}`);
    } catch (error) {
      console.error("Failed to mark digest as sent:", error);
    }
  }

  // Travel plan methods
  async createTravelPlan(travelPlan: InsertTravelPlan): Promise<TravelPlan> {
    // Import tag extractor and auto-generate tags from notes
    const { extractTagsFromNotes } = await import('./tagExtractor.js');
    
    if (travelPlan.notes) {
      travelPlan.autoTags = extractTagsFromNotes(travelPlan.notes);
      console.log(`Auto-generated tags for new travel plan:`, travelPlan.autoTags);
    }
    
    // Set initial status based on dates
    if (travelPlan.startDate && travelPlan.endDate) {
      const now = new Date();
      const startDate = new Date(travelPlan.startDate);
      const endDate = new Date(travelPlan.endDate);
      
      if (endDate < now) {
        travelPlan.status = 'completed';
      } else if (startDate <= now && endDate >= now) {
        travelPlan.status = 'active';
      } else {
        travelPlan.status = 'planned';
      }
    }
    
    const [newPlan] = await db
      .insert(travelPlans)
      .values(travelPlan)
      .returning();

    // ✈️ SMART AUTO-JOIN: Add traveler to destination chatrooms (with intelligent filtering)
    if (newPlan.destination && newPlan.userId) {
      try {
        // Get user's hometown country for domestic travel detection
        const user = await this.getUser(newPlan.userId);
        const userHometown = user?.hometownCountry;
        
        // Parse destination to get city, state, country
        const destinationParts = newPlan.destination.split(',');
        const destinationCity = destinationParts[0]?.trim();
        const destinationState = destinationParts[1]?.trim() || null;
        const destinationCountry = destinationParts[2]?.trim() || null;
        
        // Check if this is currently an ACTIVE travel plan
        const now = new Date();
        const startDate = newPlan.startDate ? new Date(newPlan.startDate) : null;
        const endDate = newPlan.endDate ? new Date(newPlan.endDate) : null;
        const isActivePlan = startDate && endDate && startDate <= now && endDate >= now;
        
        // Smart filtering logic
        const isDomesticTravel = destinationCountry && userHometown && 
                                destinationCountry.toLowerCase() === userHometown.toLowerCase();
        const isFutureTrip = startDate && startDate > now;
        
        console.log(`🎯 TRAVEL PLAN ANALYSIS for user ${newPlan.userId}:`, {
          destination: newPlan.destination,
          destinationCountry,
          userHometown,
          isDomesticTravel,
          isFutureTrip,
          isActivePlan,
          autoJoin: !isDomesticTravel && !isFutureTrip
        });
        
        if (destinationCity && destinationCountry && !isDomesticTravel && !isFutureTrip) {
          // Only auto-join for INTERNATIONAL and ACTIVE/CURRENT travel
          await this.ensureMeetLocalsChatrooms(destinationCity, destinationState, destinationCountry);
          await this.autoJoinWelcomeChatroom(newPlan.userId, destinationCity, destinationCountry);
          
          console.log(`✅ SMART AUTO-JOIN: User ${newPlan.userId} joined ${destinationCity} chatrooms (international + active travel)`);
        } else {
          console.log(`⏭️ SKIPPED AUTO-JOIN: ${isDomesticTravel ? 'Domestic travel' : ''} ${isFutureTrip ? 'Future trip' : ''} - user can manually join later`);
        }
      } catch (error) {
        console.error('Error in smart chatroom auto-join logic:', error);
        // Don't fail the travel plan creation if chatroom joining fails
      }
    }
    
    return newPlan;
  }

  async updateTravelPlanStatuses(): Promise<number> {
    try {
      const now = new Date();
      
      // Update completed trips
      const completedCount = await db
        .update(travelPlans)
        .set({ status: 'completed' })
        .where(
          and(
            lt(travelPlans.endDate, now),
            ne(travelPlans.status, 'completed')
          )
        );
      
      // Update active trips
      const activeCount = await db
        .update(travelPlans)
        .set({ status: 'active' })
        .where(
          and(
            lte(travelPlans.startDate, now),
            gte(travelPlans.endDate, now),
            ne(travelPlans.status, 'active')
          )
        );
      
      // Update planned trips
      const plannedCount = await db
        .update(travelPlans)
        .set({ status: 'planned' })
        .where(
          and(
            gt(travelPlans.startDate, now),
            ne(travelPlans.status, 'planned')
          )
        );
      
      console.log(`Travel plan status update: ${completedCount} completed, ${activeCount} active, ${plannedCount} planned`);
      return (completedCount as any) + (activeCount as any) + (plannedCount as any);
    } catch (error) {
      console.error('Error updating travel plan statuses:', error);
      return 0;
    }
  }

  async getTravelPlan(id: number): Promise<TravelPlan | undefined> {
    const [plan] = await db.select().from(travelPlans).where(eq(travelPlans.id, id));
    return plan || undefined;
  }

  async getUserTravelPlans(userId: number): Promise<TravelPlan[]> {
    return await db.select().from(travelPlans).where(eq(travelPlans.userId, userId));
  }

  async updateTravelPlan(id: number, updates: Partial<TravelPlan>): Promise<TravelPlan | undefined> {
    // Import tag extractor and auto-generate tags from notes if updated
    const { extractTagsFromNotes } = await import('./tagExtractor.js');
    
    if (updates.notes) {
      updates.autoTags = extractTagsFromNotes(updates.notes);
      console.log(`Auto-generated tags for updated travel plan ${id}:`, updates.autoTags);
    }
    
    const [plan] = await db
      .update(travelPlans)
      .set(updates)
      .where(eq(travelPlans.id, id))
      .returning();
    return plan || undefined;
  }

  async deleteTravelPlan(id: number): Promise<boolean> {
    await db.delete(travelPlans).where(eq(travelPlans.id, id));
    return true;
  }

  // Enhanced method to get travel plans with itinerary data
  async getTravelPlansWithItineraries(userId: number): Promise<any[]> {
    try {
      const plans = await db
        .select({
          id: travelPlans.id,
          userId: travelPlans.userId,
          destination: travelPlans.destination,
          destinationCity: travelPlans.destinationCity,
          destinationState: travelPlans.destinationState,
          destinationCountry: travelPlans.destinationCountry,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate,
          interests: travelPlans.interests,
          travelStyle: travelPlans.travelStyle,
          accommodation: travelPlans.accommodation,
          transportation: travelPlans.transportation,
          status: travelPlans.status,
          notes: travelPlans.notes,
          createdAt: travelPlans.createdAt,
          itineraryCount: sql<number>`COALESCE(itinerary_data.itinerary_count, 0)`,
          totalItineraryCost: sql<number>`COALESCE(itinerary_data.total_cost, 0)`,
          completedActivities: sql<number>`COALESCE(itinerary_data.completed_activities, 0)`,
          totalActivities: sql<number>`COALESCE(itinerary_data.total_activities, 0)`
        })
        .from(travelPlans)
        .leftJoin(
          sql`(
            SELECT 
              travel_plan_id,
              COUNT(*) as itinerary_count,
              SUM(COALESCE(total_cost, 0)) as total_cost,
              SUM(completed_items) as completed_activities,
              SUM(total_items) as total_activities
            FROM trip_itineraries ti
            LEFT JOIN (
              SELECT 
                itinerary_id,
                COUNT(*) as total_items,
                COUNT(*) FILTER (WHERE is_completed = true) as completed_items
              FROM itinerary_items 
              GROUP BY itinerary_id
            ) item_stats ON ti.id = item_stats.itinerary_id
            GROUP BY travel_plan_id
          ) as itinerary_data`,
          sql`itinerary_data.travel_plan_id = ${travelPlans.id}`
        )
        .where(eq(travelPlans.userId, userId))
        .orderBy(desc(travelPlans.startDate));

      // Fix timezone issue - format dates to prevent timezone shifts
      return plans.map(plan => ({
        ...plan,
        startDate: plan.startDate ? this.formatDateForAPI(plan.startDate) : null,
        endDate: plan.endDate ? this.formatDateForAPI(plan.endDate) : null,
        createdAt: plan.createdAt ? plan.createdAt.toISOString() : null
      }));
    } catch (error) {
      console.error('Error fetching travel plans with itineraries:', error);
      return [];
    }
  }

  // Method to automatically save completed itineraries to past trips
  async saveItinerariesToPastTrips(): Promise<number> {
    try {
      // Find completed travel plans with unsaved itineraries
      const completedPlans = await db
        .select()
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.status, 'completed'),
            sql`EXISTS (
              SELECT 1 FROM trip_itineraries 
              WHERE travel_plan_id = ${travelPlans.id} 
              AND saved_to_past_trips = false
            )`
          )
        );

      let savedCount = 0;
      
      for (const plan of completedPlans) {
        // Mark all itineraries for this completed trip as saved
        await db
          .update(tripItineraries)
          .set({ savedToPastTrips: true })
          .where(
            and(
              eq(tripItineraries.travelPlanId, plan.id),
              eq(tripItineraries.savedToPastTrips, false)
            )
          );
        
        savedCount++;
      }

      console.log(`Automatically saved ${savedCount} completed trip itineraries to past trips`);
      return savedCount;
    } catch (error) {
      console.error('Error saving itineraries to past trips:', error);
      return 0;
    }
  }

  // Get detailed itinerary data for completed trips
  async getCompletedTripItineraries(travelPlanId: number): Promise<any[]> {
    try {
      const itineraries = await db
        .select({
          id: tripItineraries.id,
          title: tripItineraries.title,
          description: tripItineraries.description,
          totalCost: tripItineraries.totalCost,
          currency: tripItineraries.currency,
          tags: tripItineraries.tags,
          totalItems: sql<number>`COUNT(itinerary_items.id)`,
          completedItems: sql<number>`COUNT(itinerary_items.id) FILTER (WHERE itinerary_items.is_completed = true)`,
          totalSpent: sql<number>`SUM(COALESCE(itinerary_items.cost, 0))`
        })
        .from(tripItineraries)
        .leftJoin(itineraryItems, eq(tripItineraries.id, itineraryItems.itineraryId))
        .where(eq(tripItineraries.travelPlanId, travelPlanId))
        .groupBy(tripItineraries.id, tripItineraries.title, tripItineraries.description, 
                tripItineraries.totalCost, tripItineraries.currency, tripItineraries.tags);

      return itineraries;
    } catch (error) {
      console.error('Error fetching completed trip itineraries:', error);
      return [];
    }
  }

  async findUsersByTags(tags: string[], excludeUserId?: number): Promise<any[]> {
    try {
      // Find travel plans with overlapping tags
      const travelPlansWithTags = await db
        .select({
          userId: travelPlans.userId,
          autoTags: travelPlans.autoTags,
          destination: travelPlans.destination,
          notes: travelPlans.notes
        })
        .from(travelPlans)
        .where(
          and(
            sql`${travelPlans.autoTags} && ${tags}`, // PostgreSQL array overlap operator
            excludeUserId ? ne(travelPlans.userId, excludeUserId) : sql`1=1`
          )
        );

      if (travelPlansWithTags.length === 0) {
        return [];
      }

      // Get user details for matching travel plans
      const userIds = [...new Set(travelPlansWithTags.map(plan => plan.userId))];
      
      const matchingUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          interests: users.interests,
          activities: users.activities,
          isCurrentlyTraveling: users.isCurrentlyTraveling
        })
        .from(users)
        .where(inArray(users.id, userIds));

      // Add matching tags info to each user
      const usersWithTags = matchingUsers.map(user => {
        const userPlans = travelPlansWithTags.filter(plan => plan.userId === user.id);
        const allUserTags = userPlans.flatMap(plan => plan.autoTags || []);
        const matchingTags = tags.filter(tag => allUserTags.includes(tag));
        
        return {
          ...user,
          matchingTags,
          matchScore: matchingTags.length,
          travelPlans: userPlans.map(plan => ({
            destination: plan.destination,
            tags: plan.autoTags,
            notes: plan.notes
          }))
        };
      });

      // Sort by match score (most matching tags first)
      return usersWithTags.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('DatabaseStorage.findUsersByTags - Error:', error);
      throw error;
    }
  }

  async findUsersByTravelPlan(interests: string[], activities: string[], events: string[], notes?: string, excludeUserId?: number, startDate?: Date, endDate?: Date, destination?: string): Promise<any[]> {
    try {
      // Search travel plans by interests, activities, events, notes content, and OVERLAPPING DATES
      const searchConditions = [];
      
      // Search by interests overlap
      if (interests.length > 0) {
        searchConditions.push(sql`${travelPlans.interests} && ${interests}`);
      }
      
      // Search by activities overlap
      if (activities.length > 0) {
        searchConditions.push(sql`${travelPlans.activities} && ${activities}`);
      }
      
      // Search by events overlap
      if (events.length > 0) {
        searchConditions.push(sql`${travelPlans.events} && ${events}`);
      }
      
      // Search by destination match if provided
      if (destination && destination.trim()) {
        searchConditions.push(
          or(
            ilike(travelPlans.destination, `%${destination}%`),
            ilike(travelPlans.destinationCity, `%${destination}%`)
          )
        );
      }
      
      // CRITICAL: Search by overlapping travel dates
      if (startDate && endDate) {
        searchConditions.push(
          and(
            // Their trip starts before our trip ends
            lte(travelPlans.startDate, endDate),
            // Their trip ends after our trip starts
            gte(travelPlans.endDate, startDate),
            // Ensure we have valid dates
            isNotNull(travelPlans.startDate),
            isNotNull(travelPlans.endDate)
          )
        );
      }
      
      // Search by notes content if provided
      if (notes && notes.trim()) {
        const notesWords = notes.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        for (const word of notesWords) {
          searchConditions.push(ilike(travelPlans.notes, `%${word}%`));
        }
      }
      
      // Search by auto-generated tags if notes provided
      if (notes && notes.trim()) {
        const { extractTagsFromNotes } = await import('./tagExtractor.js');
        const searchTags = extractTagsFromNotes(notes);
        if (searchTags.length > 0) {
          searchConditions.push(sql`${travelPlans.autoTags} && ${searchTags}`);
        }
      }
      
      if (searchConditions.length === 0) {
        return [];
      }
      
      const matchingPlans = await db
        .select({
          userId: travelPlans.userId,
          destination: travelPlans.destination,
          interests: travelPlans.interests,
          activities: travelPlans.activities,
          events: travelPlans.events,
          notes: travelPlans.notes,
          autoTags: travelPlans.autoTags,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate,
          accommodation: travelPlans.accommodation,
          transportation: travelPlans.transportation
        })
        .from(travelPlans)
        .where(
          and(
            or(...searchConditions),
            excludeUserId ? ne(travelPlans.userId, excludeUserId) : sql`1=1`
          )
        );

      if (matchingPlans.length === 0) {
        return [];
      }

      // Get user details
      const userIds = [...new Set(matchingPlans.map(plan => plan.userId))];
      const matchingUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));

      // Calculate compatibility scores and match details
      const usersWithMatches = matchingUsers.map(user => {
        const userPlans = matchingPlans.filter(plan => plan.userId === user.id);
        
        let totalScore = 0;
        const matchDetails = {
          interests: [] as string[],
          activities: [] as string[],
          events: [] as string[],
          noteMatches: [] as string[],
          tagMatches: [] as string[]
        };
        
        userPlans.forEach(plan => {
          // CRITICAL: Calculate travel date overlap (highest priority)
          let dateOverlapDays = 0;
          let dateOverlapScore = 0;
          
          if (startDate && endDate && plan.startDate && plan.endDate) {
            const planStart = new Date(plan.startDate);
            const planEnd = new Date(plan.endDate);
            const searchStart = new Date(startDate);
            const searchEnd = new Date(endDate);
            
            // Calculate overlap period
            const overlapStart = new Date(Math.max(planStart.getTime(), searchStart.getTime()));
            const overlapEnd = new Date(Math.min(planEnd.getTime(), searchEnd.getTime()));
            
            if (overlapStart <= overlapEnd) {
              dateOverlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              dateOverlapScore = dateOverlapDays * 10; // Weight date overlap VERY heavily (10 points per day)
              totalScore += dateOverlapScore;
            }
          }
          
          // Calculate interest matches
          if (plan.interests && interests.length > 0) {
            const sharedInterests = interests.filter(interest => 
              plan.interests?.includes(interest)
            );
            matchDetails.interests.push(...sharedInterests);
            totalScore += sharedInterests.length * 3; // Weight interests highly
          }
          
          // Calculate activity matches
          if (plan.activities && activities.length > 0) {
            const sharedActivities = activities.filter(activity => 
              plan.activities?.includes(activity)
            );
            matchDetails.activities.push(...sharedActivities);
            totalScore += sharedActivities.length * 5; // Weight activities very highly
          }
          
          // Calculate event matches
          if (plan.events && events.length > 0) {
            const sharedEvents = events.filter(event => 
              plan.events?.includes(event)
            );
            matchDetails.events.push(...sharedEvents);
            totalScore += sharedEvents.length * 4; // Weight events highly
          }
          
          // Calculate destination match bonus
          if (destination && plan.destination) {
            const destLower = destination.toLowerCase();
            const planDestLower = plan.destination.toLowerCase();
            if (planDestLower.includes(destLower) || destLower.includes(planDestLower)) {
              totalScore += 8; // Destination match bonus
            }
          }
          
          // Calculate notes content matches
          if (notes && plan.notes) {
            const notesWords = notes.toLowerCase().split(/\s+/).filter(word => word.length > 2);
            const planNotesLower = plan.notes.toLowerCase();
            const noteMatches = notesWords.filter(word => planNotesLower.includes(word));
            matchDetails.noteMatches.push(...noteMatches);
            totalScore += noteMatches.length * 2;
          }
          
          // Calculate auto-tag matches
          if (notes && plan.autoTags) {
            const { extractTagsFromNotes } = require('./tagExtractor.js');
            const searchTags = extractTagsFromNotes(notes);
            const tagMatches = searchTags.filter(tag => 
              plan.autoTags?.includes(tag)
            );
            matchDetails.tagMatches.push(...tagMatches);
            totalScore += tagMatches.length * 3;
          }
          
          // Store date overlap info in match details
          if (dateOverlapDays > 0) {
            matchDetails.dateOverlapDays = dateOverlapDays;
            matchDetails.dateOverlapScore = dateOverlapScore;
          }
        });
        
        // Remove duplicates from match details
        Object.keys(matchDetails).forEach(key => {
          matchDetails[key as keyof typeof matchDetails] = [...new Set(matchDetails[key as keyof typeof matchDetails])];
        });
        
        const { password, ...safeUser } = user;
        return {
          ...safeUser,
          compatibilityScore: totalScore,
          matchDetails,
          travelPlans: userPlans.map(plan => ({
            destination: plan.destination,
            interests: plan.interests,
            activities: plan.activities,
            events: plan.events,
            notes: plan.notes,
            autoTags: plan.autoTags,
            startDate: plan.startDate,
            endDate: plan.endDate,
            accommodation: plan.accommodation,
            transportation: plan.transportation
          }))
        };
      });

      // Sort by compatibility score (highest first)
      return usersWithMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    } catch (error) {
      console.error('DatabaseStorage.findUsersByTravelPlan - Error:', error);
      throw error;
    }
  }

  async searchTravelPlans(searchTerms: string, location?: string): Promise<TravelPlan[]> {
    try {
      const searchWords = searchTerms.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const searchConditions = [];
      
      // Search in all text fields
      searchWords.forEach(word => {
        searchConditions.push(
          or(
            ilike(travelPlans.destination, `%${word}%`),
            ilike(travelPlans.notes, `%${word}%`),
            sql`${travelPlans.interests}::text ILIKE ${'%' + word + '%'}`,
            sql`${travelPlans.activities}::text ILIKE ${'%' + word + '%'}`,
            sql`${travelPlans.events}::text ILIKE ${'%' + word + '%'}`,
            sql`${travelPlans.autoTags}::text ILIKE ${'%' + word + '%'}`
          )
        );
      });
      
      let whereCondition = and(...searchConditions);
      
      // Add location filter if provided
      if (location) {
        whereCondition = and(
          whereCondition,
          or(
            ilike(travelPlans.destination, `%${location}%`),
            ilike(travelPlans.destinationCity, `%${location}%`)
          )
        );
      }
      
      return await db
        .select()
        .from(travelPlans)
        .where(whereCondition)
        .orderBy(desc(travelPlans.createdAt));
    } catch (error) {
      console.error('DatabaseStorage.searchTravelPlans - Error:', error);
      throw error;
    }
  }

  async getCompatibleTravelers(userId: number, travelPlanId?: number): Promise<any[]> {
    try {
      // Get user's travel plan(s) to match against
      let userPlans: TravelPlan[];
      
      if (travelPlanId) {
        const plan = await this.getTravelPlan(travelPlanId);
        userPlans = plan ? [plan] : [];
      } else {
        userPlans = await this.getUserTravelPlans(userId);
      }
      
      if (userPlans.length === 0) {
        return [];
      }
      
      const allMatches = [];
      
      // For each user travel plan, find compatible travelers with overlapping dates
      for (const userPlan of userPlans) {
        const matches = await this.findUsersByTravelPlan(
          userPlan.interests || [],
          userPlan.activities || [],
          userPlan.events || [],
          userPlan.notes || '',
          userId, // Exclude the current user
          userPlan.startDate ? new Date(userPlan.startDate) : undefined,
          userPlan.endDate ? new Date(userPlan.endDate) : undefined,
          userPlan.destination || undefined
        );
        
        // Add plan context to matches
        const matchesWithContext = matches.map(match => ({
          ...match,
          matchingPlan: {
            destination: userPlan.destination,
            startDate: userPlan.startDate,
            endDate: userPlan.endDate
          }
        }));
        
        allMatches.push(...matchesWithContext);
      }
      
      // Remove duplicates and sort by compatibility score
      const uniqueMatches = new Map();
      allMatches.forEach(match => {
        const existing = uniqueMatches.get(match.id);
        if (!existing || match.compatibilityScore > existing.compatibilityScore) {
          uniqueMatches.set(match.id, match);
        }
      });
      
      return Array.from(uniqueMatches.values())
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    } catch (error) {
      console.error('DatabaseStorage.getCompatibleTravelers - Error:', error);
      throw error;
    }
  }

  // Helper method to normalize location search terms
  private normalizeLocationForSearch(location: string): string {
    const lowerLocation = location.toLowerCase().trim();
    
    // NYC aliases mapping to Manhattan
    const nycAliases = [
      'nyc',
      'new york city', 
      'ny city',
      'new york, ny',
      'new york ny',
      'new york, new york'
    ];
    
    // Check if the search term matches any NYC alias
    if (nycAliases.some(alias => lowerLocation.includes(alias))) {
      return 'Manhattan';
    }
    
    // Return original location if no alias match
    return location;
  }

  // Search methods
  async searchUsersByLocation(location: string, userType?: string, startDate?: string, endDate?: string): Promise<User[]> {
    try {
      console.log(`searchUsersByLocation called with: location="${location}", userType="${userType}"`);

      // Parse location into components
      const locationParts = location.split(',').map(part => part.trim());
      const [searchCity, searchState, searchCountry] = locationParts;

      // BUCKET SYSTEM IMPLEMENTATION
      // 1. HOMETOWN BUCKET - Users whose permanent hometown is this location (ALWAYS in bucket)
      // 2. TRAVELING BUCKET - Users currently traveling to this location (TEMPORARY in bucket)

      // CRITICAL FIX: Build metropolitan area search logic
      // For Los Angeles, include all metro cities like Playa del Rey, Santa Monica, etc.
      let citySearchConditions = [eq(users.hometownCity, searchCity)];
      
      // Los Angeles Metropolitan Area expansion
      if (searchCity.toLowerCase().includes('los angeles') && searchState?.toLowerCase().includes('california')) {
        const laMetroCities = [
          'Playa del Rey', 'Santa Monica', 'Beverly Hills', 'Hollywood', 'Venice', 
          'Culver City', 'Manhattan Beach', 'Redondo Beach', 'El Segundo', 
          'Inglewood', 'Torrance', 'Long Beach', 'Pasadena', 'Burbank', 
          'Glendale', 'Marina del Rey', 'Hermosa Beach', 'Malibu', 
          'West Hollywood', 'Westwood', 'Los Angeles'
        ];
        
        citySearchConditions = laMetroCities.map(city => eq(users.hometownCity, city));
        console.log(`🌍 METRO: Expanding Los Angeles search to include ${laMetroCities.length} metro cities`);
      }

      // Get hometown locals (PERMANENT BUCKET MEMBERS)
      const hometownLocals = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          interests: users.interests,
          isCurrentlyTraveling: users.isCurrentlyTraveling,
          travelDestination: users.travelDestination,
          travelStartDate: users.travelStartDate,
          travelEndDate: users.travelEndDate,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          and(
            or(...citySearchConditions),
            searchCountry ? eq(users.hometownCountry, searchCountry) : sql`1=1`,
            searchState ? eq(users.hometownState, searchState) : sql`1=1`,
            userType ? eq(users.userType, userType) : sql`1=1`
          )
        );
      
      console.log(`✓ Found ${hometownLocals.length} hometown locals for ${searchCity}`);

      // Get current travelers (TEMPORARY BUCKET MEMBERS)
      // Find active travel plans to this location
      const currentDate = new Date().toISOString().split('T')[0];
      const activeTravelPlans = await db
        .select({
          userId: travelPlans.userId,
          tripLocation: travelPlans.tripLocation,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate
        })
        .from(travelPlans)
        .where(
          and(
            lte(travelPlans.startDate, sql`${currentDate}::date`),
            gte(travelPlans.endDate, sql`${currentDate}::date`),
            or(
              like(travelPlans.tripLocation, `%${searchCity}%`),
              like(travelPlans.currentCity, `%${searchCity}%`)
            )
          )
        );

      // Get users for active travel plans
      const travelerIds = activeTravelPlans.map(plan => plan.userId);
      const currentTravelers = travelerIds.length > 0 ? await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          userType: users.userType,
          bio: users.bio,
          location: users.location,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          profileImage: users.profileImage,
          interests: users.interests,
          isCurrentlyTraveling: users.isCurrentlyTraveling,
          travelDestination: users.travelDestination,
          travelStartDate: users.travelStartDate,
          travelEndDate: users.travelEndDate,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          and(
            inArray(users.id, travelerIds),
            userType ? eq(users.userType, userType) : sql`1=1`
          )
        ) : [];

      console.log(`✓ Found ${currentTravelers.length} current travelers in ${searchCity}`);

      // Import metropolitan area mapping from shared location data
      const { METROPOLITAN_AREAS } = await import('../shared/locationData');
      
      const getMetropolitanArea = (city: string, state: string = '', country: string = '') => {
        const cityLower = city.toLowerCase().trim();
        const stateLower = state.toLowerCase().trim();
        const countryLower = country.toLowerCase().trim();
        
        // Check metropolitan areas
        for (const metro of METROPOLITAN_AREAS) {
          // Direct city match
          if (metro.city.toLowerCase() === cityLower) {
            return metro;
          }
          
          // Check keywords
          if (metro.keywords?.some(keyword => 
            cityLower.includes(keyword.toLowerCase()) ||
            stateLower.includes(keyword.toLowerCase()) ||
            countryLower.includes(keyword.toLowerCase())
          )) {
            return metro;
          }
        }
        
        // Return formatted original if no match
        return {
          city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(),
          state: state ? state.charAt(0).toUpperCase() + state.slice(1).toLowerCase() : '',
          country: country ? country.charAt(0).toUpperCase() + country.slice(1).toLowerCase() : '',
          keywords: []
        };
      };

      // COMBINE BUCKET RESULTS
      // Merge hometown locals and current travelers, removing duplicates
      const allBucketUsers = [...hometownLocals, ...currentTravelers];
      
      // Remove duplicates by user ID
      const uniqueUsers = allBucketUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      console.log(`BUCKET SYSTEM RESULTS for ${searchCity}:`);
      console.log(`✓ Hometown locals: ${hometownLocals.length}`);
      console.log(`✓ Current travelers: ${currentTravelers.length}`);
      console.log(`✓ Total unique users in ${searchCity} bucket: ${uniqueUsers.length}`);

      // Remove passwords and return results
      return uniqueUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

    } catch (error) {
      console.error('Error in searchUsersByLocation:', error);
      return [];
    }
  }

  // Simplified backup method for direct location queries
  async searchUsersByLocationDirect(location: string, userType?: string): Promise<User[]> {
    try {
      console.log(`🔍 SEARCH: Looking for users in location: "${location}", type: ${userType}`);
      const locationParts = location.split(',').map(part => part.trim());
      const [searchCity] = locationParts;

      if (!searchCity) {
        console.log('❌ SEARCH: No search city provided');
        return [];
      }

      // CRITICAL FIX: Handle metropolitan area expansions
      let searchCities = [searchCity];
      const lowerSearchCity = searchCity.toLowerCase().trim();
      
      // NYC aliases - search for both Manhattan and New York when someone searches for "New York City"
      if (lowerSearchCity.includes('new york city') || lowerSearchCity === 'nyc') {
        searchCities = ['Manhattan', 'New York'];
        console.log(`🔍 SEARCH: NYC alias detected, searching for both Manhattan and New York`);
      }
      
      // Los Angeles Metropolitan Area expansion - CRITICAL FOR USER DISCOVERY
      if (lowerSearchCity.includes('los angeles') && location.includes('California')) {
        const laMetroCities = [
          'Playa del Rey', 'Santa Monica', 'Beverly Hills', 'Hollywood', 'Venice', 
          'Culver City', 'Manhattan Beach', 'Redondo Beach', 'El Segundo', 
          'Inglewood', 'Torrance', 'Long Beach', 'Pasadena', 'Burbank', 
          'Glendale', 'Marina del Rey', 'Hermosa Beach', 'Malibu', 
          'West Hollywood', 'Westwood', 'Los Angeles'
        ];
        searchCities = laMetroCities;
        console.log(`🌍 SEARCH: Los Angeles metropolitan area detected, searching for ${laMetroCities.length} metro cities including Playa del Rey`);
      }

      console.log(`🔍 SEARCH: Searching for cities: ${searchCities.join(', ')}`);

      // Build hometown search conditions for all search cities
      const hometownConditions = [eq(users.isActive, true)];
      
      // Create OR condition for multiple cities
      const cityConditions = searchCities.map(city => ilike(users.hometownCity, `%${city}%`));
      hometownConditions.push(or(...cityConditions));
      
      if (userType) {
        hometownConditions.push(eq(users.userType, userType));
      }

      // Get hometown users
      const hometownUsers = await db
        .select()
        .from(users)
        .where(and(...hometownConditions));

      console.log(`🏠 SEARCH: Found ${hometownUsers.length} hometown users in ${searchCities.join(', ')}`);

      // Build traveler search conditions  
      const travelerConditions = [
        eq(users.isActive, true),
        eq(users.isCurrentlyTraveling, true),
        isNotNull(users.travelDestination)
      ];
      
      if (userType) {
        travelerConditions.push(eq(users.userType, userType));
      }

      // Get all traveling users first, then filter by destination
      const allTravelingUsers = await db
        .select()
        .from(users)
        .where(and(...travelerConditions));

      // Filter traveling users by destination in JavaScript to avoid SQL LIKE issues
      const travelerUsers = allTravelingUsers.filter(user => {
        if (!user.travelDestination) return false;
        
        const destination = user.travelDestination.toLowerCase();
        
        // Check if destination matches any of our search cities
        return searchCities.some(city => 
          destination.includes(city.toLowerCase())
        );
      });

      console.log(`✈️ SEARCH: Found ${travelerUsers.length} current travelers in ${searchCities.join(', ')}`);

      // ALSO CHECK ACTIVE TRAVEL PLANS for users with overlapping dates
      console.log(`📅 CHECKING ACTIVE AND UPCOMING TRAVEL PLANS IN ${searchCities.join(', ')}...`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const relevantTravelPlans = await db
        .select({
          userId: travelPlans.userId,
          destination: travelPlans.destination,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate
        })
        .from(travelPlans)
        .leftJoin(users, eq(travelPlans.userId, users.id))
        .where(and(
          eq(users.isActive, true),
          or(eq(users.isAIGenerated, false), isNull(users.isAIGenerated)),
          gte(travelPlans.endDate, today) // Include current AND future trips
        ));

      console.log(`📅 Found ${relevantTravelPlans.length} active and upcoming travel plans`);

      // Filter travel plans by destination and get user data
      const relevantTravelPlanUserIds = relevantTravelPlans
        .filter(plan => {
          if (!plan.destination) return false;
          const destination = plan.destination.toLowerCase();
          return searchCities.some(city => destination.includes(city.toLowerCase()));
        })
        .map(plan => plan.userId);

      console.log(`📅 Found ${relevantTravelPlanUserIds.length} users with active/upcoming travel plans to ${searchCities.join(', ')}`);

      // Get users with active/upcoming travel plans to this city
      const travelPlanUsers = relevantTravelPlanUserIds.length > 0 ? await db
        .select()
        .from(users)
        .where(and(
          eq(users.isActive, true),
          or(eq(users.isAIGenerated, false), isNull(users.isAIGenerated)),
          inArray(users.id, relevantTravelPlanUserIds),
          userType ? eq(users.userType, userType) : sql`1=1`
        )) : [];

      console.log(`📅 Retrieved ${travelPlanUsers.length} users with active/upcoming travel plans`);

      // Combine both types of travelers
      const allTravelers = [...travelerUsers, ...travelPlanUsers];

      // Combine and deduplicate by user ID
      const allLocationUsers = [...hometownUsers, ...allTravelers];
      const uniqueUsers = allLocationUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      console.log(`✅ SEARCH: Returning ${uniqueUsers.length} unique users for ${searchCities.join(', ')}`);

      // Remove passwords and return safe user data
      return uniqueUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

    } catch (error) {
      console.error('❌ SEARCH ERROR in searchUsersByLocationDirect:', error);
      return [];
    }
  }

  // Legacy method - keeping for compatibility but redirecting to working method
  async searchUsersByLocationOld(location: string, userType?: string): Promise<User[]> {
    return this.searchUsersByLocationDirect(location, userType);
  }
  
  // Clean up orphaned code - getUsersByLocationAndType method
  async getUsersByLocationAndType(city: string, state: string | null, country: string | null, userType: string): Promise<User[]> {
    // Use the working direct search method
    return this.searchUsersByLocationDirect([city, state, country].filter(Boolean).join(', '), userType);
  }

  async getUsersByType(type: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.userType, type));
  }

  async getUsersByCity(city: string): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        ilike(users.hometownCity, `%${city}%`),
        ilike(users.location, `%${city}%`)
      )
    );
  }

  async searchUsers(search: string, city?: string): Promise<User[]> {
    if (city) {
      // Normalize city search term for NYC aliases
      const normalizedCity = this.normalizeLocationForSearch(city);
      
      const query = db.select().from(users).where(
        and(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.bio, `%${search}%`)
          ),
          or(
            ilike(users.hometownCity, `%${normalizedCity}%`),
            ilike(users.location, `%${normalizedCity}%`)
          )
        )
      );
      return await query;
    }

    const query = db.select().from(users).where(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.username, `%${search}%`),
        ilike(users.bio, `%${search}%`)
      )
    );

    return await query;
  }

  async getMatchedUsers(userId: number, city?: string): Promise<User[]> {
    // Get all users except the current user
    let query = db.select().from(users);

    if (city) {
      return await query.where(
        and(
          // Exclude current user AND match city
          // Use not() to exclude the current user
          or(
            ilike(users.hometownCity, `%${city}%`),
            ilike(users.location, `%${city}%`)
          )
        )
      );
    }

    // Return all users (for now, we'll filter in the API)
    return await query;
  }

  async getPublicTravelMemories(limit: number = 50): Promise<any[]> {
    try {
      // Get travel memories directly from database using Drizzle
      const publicMemories = await db
        .select()
        .from(travelMemories)
        .where(eq(travelMemories.isPublic, true))
        .orderBy(desc(travelMemories.createdAt))
        .limit(limit);

      // Get user data for each memory
      const memoriesWithAuthors = await Promise.all(
        publicMemories.map(async (memory) => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, memory.userId))
            .limit(1);

          return {
            ...memory,
            author: user ? {
              id: user.id,
              username: user.username,
              name: user.name,
              profileImage: user.profileImage
            } : null
          };
        })
      );

      return memoriesWithAuthors;
    } catch (error) {
      console.error('Error fetching public travel memories:', error);
      return [];
    }
  }



  async getUserPhotos(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      console.log(`DatabaseStorage.getUserPhotos - Getting photos for user ID: ${userId} (limit: ${limit}, offset: ${offset})`);
      
      // Use pagination to avoid 64MB limit, and be more selective about what we return
      const photos = await db
        .select({
          id: userPhotos.id,
          userId: userPhotos.userId,
          imageUrl: userPhotos.imageUrl,
          caption: userPhotos.caption,
          isPrivate: userPhotos.isPrivate,
          isProfilePhoto: userPhotos.isProfilePhoto,
          uploadedAt: userPhotos.uploadedAt
        })
        .from(userPhotos)
        .where(eq(userPhotos.userId, userId))
        .orderBy(desc(userPhotos.uploadedAt))
        .limit(limit)
        .offset(offset);

      console.log(`DatabaseStorage.getUserPhotos - Found ${photos.length} photos for user ${userId}`);
      
      // Get tags for each photo
      const photosWithTags = await Promise.all(
        photos.map(async (photo) => {
          const tags = await this.getPhotoTags(photo.id);
          
          return {
            id: photo.id,
            userId: photo.userId,
            imageUrl: photo.imageUrl,
            caption: photo.caption,
            isPrivate: photo.isPrivate,
            isProfilePhoto: photo.isProfilePhoto,
            uploadedAt: photo.uploadedAt,
            createdAt: photo.uploadedAt,
            tags
          };
        })
      );
      
      return photosWithTags;
    } catch (error) {
      console.error('DatabaseStorage.getUserPhotos - Error getting user photos:', error);
      return [];
    }
  }

  async createUserPhoto(photoData: any): Promise<any> {
    try {
      console.log('Creating photo with data:', { 
        userId: photoData.userId, 
        hasImageData: !!photoData.imageData,
        caption: photoData.caption 
      });
      
      const [photo] = await db
        .insert(userPhotos)
        .values({
          userId: photoData.userId,
          imageUrl: photoData.imageUrl || photoData.imageData,
          imageData: photoData.imageData,
          caption: photoData.caption,
          isPrivate: photoData.isPrivate || false,
          isProfilePhoto: photoData.isProfilePhoto || false
        })
        .returning();

      console.log('Photo created successfully:', photo.id);
      console.log('Photo object being returned:', JSON.stringify(photo, null, 2));
      return photo;
    } catch (error) {
      console.error('Error creating user photo:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getTravelPlansByUserId(userId: number): Promise<any[]> {
    try {
      console.log('DatabaseStorage.getTravelPlansByUserId - Getting travel plans for user ID:', userId);
      const plans = await db
        .select()
        .from(travelPlans)
        .where(eq(travelPlans.userId, userId))
        .orderBy(desc(travelPlans.createdAt));
      
      console.log('DatabaseStorage.getTravelPlansByUserId - Found plans:', plans.length, 'for user', userId);
      return plans;
    } catch (error) {
      console.error('DatabaseStorage.getTravelPlansByUserId - Error getting travel plans:', error);
      return [];
    }
  }

  async findUserReference(reviewerId: number, revieweeId: number): Promise<any> {
    try {
      const reference = await db
        .select()
        .from(userReferences)
        .where(and(
          eq(userReferences.reviewerId, reviewerId),
          eq(userReferences.revieweeId, revieweeId)
        ))
        .limit(1);

      return reference.length > 0 ? reference[0] : null;
    } catch (error) {
      console.error('Error finding user reference:', error);
      return null;
    }
  }

  async getUserReferences(userId: number): Promise<any[]> {
    try {
      const references = await db
        .select({
          id: userReferences.id,
          reviewerId: userReferences.reviewerId,
          revieweeId: userReferences.revieweeId,
          experience: userReferences.experience,
          content: userReferences.content,
          createdAt: userReferences.createdAt,
          reviewer: {
            id: users.id,
            name: users.name,
            username: users.username,
            profileImage: users.profileImage
          }
        })
        .from(userReferences)
        .leftJoin(users, eq(userReferences.reviewerId, users.id))
        .where(eq(userReferences.revieweeId, userId))
        .orderBy(desc(userReferences.createdAt));

      // Calculate counts by experience type
      const counts = {
        total: references.length,
        positive: references.filter(ref => ref.experience === 'positive').length,
        negative: references.filter(ref => ref.experience === 'negative').length,
        neutral: references.filter(ref => ref.experience === 'neutral').length
      };

      return {
        references,
        counts
      };
    } catch (error) {
      console.error('Error fetching user references:', error);
      return {
        references: [],
        counts: { total: 0, positive: 0, negative: 0, neutral: 0 }
      };
    }
  }

  async createUserReference(referenceData: any): Promise<any> {
    try {
      console.log('Storage createUserReference input:', referenceData);
      
      // Data is already mapped correctly from the API route, use as-is
      const mappedData = {
        reviewerId: referenceData.reviewerId || referenceData.authorId,
        revieweeId: referenceData.revieweeId || referenceData.referencedUserId,
        content: referenceData.content,
        experience: referenceData.experience || 'positive',
      };

      console.log('Storage mapped data for insert:', mappedData);

      try {
        console.log('About to execute Drizzle insert...');
        const insertResult = await db
          .insert(userReferences)
          .values(mappedData)
          .returning();
        
        console.log('Drizzle insert raw result:', insertResult);
        console.log('Insert result length:', insertResult.length);
        
        const reference = insertResult[0];
        console.log('Storage created reference result:', reference);
        return reference;
      } catch (drizzleError) {
        console.error('Drizzle insert error:', drizzleError);
        throw drizzleError;
      }
    } catch (error) {
      console.error('Error creating user reference:', error);
      throw error;
    }
  }

  async updateUserReference(referenceId: number, updates: { content?: string; experience?: string }): Promise<any> {
    try {
      console.log('Storage updateUserReference input:', { referenceId, updates });
      
      const updateResult = await db
        .update(userReferences)
        .set({
          content: updates.content,
          experience: updates.experience,
        })
        .where(eq(userReferences.id, referenceId))
        .returning();
      
      console.log('Update result:', updateResult);
      return updateResult[0] || null;
    } catch (error) {
      console.error('Error updating user reference:', error);
      throw error;
    }
  }

  // Stub implementations for all other required interface methods
  async inviteToEvent(): Promise<any> { return {}; }
  async updateParticipantStatus(): Promise<any> { return {}; }


  async getUserPhoto(photoId: number): Promise<any> {
    try {
      const [photo] = await db
        .select()
        .from(userPhotos)
        .where(eq(userPhotos.id, photoId))
        .limit(1);
      return photo || null;
    } catch (error) {
      console.error('Error getting user photo:', error);
      return null;
    }
  }

  async updateUserPhoto(photoId: number, updates: Partial<any>): Promise<any> {
    try {
      const [updatedPhoto] = await db
        .update(userPhotos)
        .set(updates)
        .where(eq(userPhotos.id, photoId))
        .returning();
      return updatedPhoto;
    } catch (error) {
      console.error('Error updating user photo:', error);
      return null;
    }
  }
  async deleteUserPhoto(photoId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userPhotos)
        .where(eq(userPhotos.id, photoId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user photo:', error);
      return false;
    }
  }

  async getPhotoById(photoId: number): Promise<any> {
    try {
      console.log('DatabaseStorage.getPhotoById - Getting photo ID:', photoId);
      
      const result = await db
        .select()
        .from(userPhotos)
        .where(eq(userPhotos.id, photoId))
        .limit(1);
      
      if (result.length === 0) {
        console.log('DatabaseStorage.getPhotoById - Photo not found');
        return null;
      }
      
      console.log('DatabaseStorage.getPhotoById - Photo found');
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.getPhotoById - Error:', error);
      return null;
    }
  }

  async deletePhoto(photoId: number): Promise<boolean> {
    try {
      console.log('DatabaseStorage.deletePhoto - Deleting photo ID:', photoId);
      
      const result = await db
        .delete(userPhotos)
        .where(eq(userPhotos.id, photoId))
        .returning();
      
      if (result.length === 0) {
        console.log('DatabaseStorage.deletePhoto - Photo not found');
        return false;
      }
      
      console.log('DatabaseStorage.deletePhoto - Photo deleted successfully');
      return true;
    } catch (error) {
      console.error('DatabaseStorage.deletePhoto - Error:', error);
      return false;
    }
  }

  // Photo tag methods
  async createPhotoTag(photoId: number, taggedUserId: number, taggedByUserId: number): Promise<any> {
    try {
      console.log('DatabaseStorage.createPhotoTag - Creating tag:', { photoId, taggedUserId, taggedByUserId });
      
      const [tag] = await db
        .insert(photoTags)
        .values({
          photoId,
          taggedUserId,
          taggedByUserId,
        })
        .returning();
      
      console.log('DatabaseStorage.createPhotoTag - Tag created successfully');
      return tag;
    } catch (error) {
      console.error('DatabaseStorage.createPhotoTag - Error:', error);
      throw error;
    }
  }

  async getPhotoTags(photoId: number): Promise<any[]> {
    try {
      console.log('DatabaseStorage.getPhotoTags - Getting tags for photo:', photoId);
      
      const tags = await db
        .select({
          id: photoTags.id,
          taggedUserId: photoTags.taggedUserId,
          taggedByUserId: photoTags.taggedByUserId,
          createdAt: photoTags.createdAt,
          taggedUser: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImage: users.profileImage,
          }
        })
        .from(photoTags)
        .innerJoin(users, eq(photoTags.taggedUserId, users.id))
        .where(eq(photoTags.photoId, photoId));
      
      console.log('DatabaseStorage.getPhotoTags - Found tags:', tags.length);
      return tags;
    } catch (error) {
      console.error('DatabaseStorage.getPhotoTags - Error:', error);
      return [];
    }
  }

  async deletePhotoTag(photoId: number, taggedUserId: number): Promise<boolean> {
    try {
      console.log('DatabaseStorage.deletePhotoTag - Deleting tag:', { photoId, taggedUserId });
      
      const result = await db
        .delete(photoTags)
        .where(and(
          eq(photoTags.photoId, photoId),
          eq(photoTags.taggedUserId, taggedUserId)
        ))
        .returning();
      
      if (result.length === 0) {
        console.log('DatabaseStorage.deletePhotoTag - Tag not found');
        return false;
      }
      
      console.log('DatabaseStorage.deletePhotoTag - Tag deleted successfully');
      return true;
    } catch (error) {
      console.error('DatabaseStorage.deletePhotoTag - Error:', error);
      return false;
    }
  }

  async getBusinessCustomerPhoto(photoId: number): Promise<any> {
    try {
      const [photo] = await db
        .select()
        .from(userPhotos)
        .where(eq(userPhotos.id, photoId));
      
      return photo;
    } catch (error) {
      console.error('Error getting business customer photo:', error);
      return null;
    }
  }

  async deleteBusinessCustomerPhoto(photoId: number): Promise<boolean> {
    try {
      console.log('DatabaseStorage.deleteBusinessCustomerPhoto - Deleting photo ID:', photoId);
      const result = await db
        .delete(userPhotos)
        .where(eq(userPhotos.id, photoId))
        .returning();
      
      console.log('DatabaseStorage.deleteBusinessCustomerPhoto - Delete result:', result.length > 0);
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting business customer photo:', error);
      return false;
    }
  }
  async setProfilePhoto(): Promise<any> { return true; }
  async updatePhotoAIAnalysis(): Promise<any> { return undefined; }
  async getPhotosByCategory(): Promise<any> { return []; }
  async getPhotosByTag(): Promise<any> { return []; }
  async getUserPhotoTags(): Promise<any> { return []; }
  async getPhotosAwaitingAnalysis(): Promise<any> { return []; }
  async createMoodEntry(): Promise<any> { return {}; }
  async getUserMoodEntries(): Promise<any> { return []; }
  async getMoodEntriesByType(): Promise<any> { return []; }
  async getMoodEntriesByDateRange(): Promise<any> { return []; }
  async getMoodEntryById(): Promise<any> { return undefined; }
  async updateMoodEntry(): Promise<any> { return undefined; }
  async deleteMoodEntry(): Promise<any> { return true; }
  async getTravelPlanMoodEntries(): Promise<any> { return []; }
  async getEventMoodEntries(): Promise<any> { return []; }
  async createPassportStamp(): Promise<any> { return {}; }
  async getUserPassportStamps(): Promise<any> { return []; }
  async getPassportStampsByCountry(): Promise<any> { return []; }
  async getPassportStampsByCategory(): Promise<any> { return []; }
  async updatePassportStamp(): Promise<any> { return undefined; }
  async deletePassportStamp(): Promise<any> { return true; }
  async getUserStats(): Promise<any> { return undefined; }
  async updateUserStats(): Promise<any> { return {}; }
  async getLeaderboard(): Promise<any> { return []; }
  async getUserAchievements(): Promise<any> { return []; }
  async createAchievement(): Promise<any> { return {}; }
  async updateAchievement(): Promise<any> { return undefined; }
  async awardStampForDestination(): Promise<any> { return {}; }
  async awardStampForEvent(): Promise<any> { return {}; }
  async checkAndUnlockAchievements(): Promise<any> { return []; }


  async getUserReferencesGiven(): Promise<any> { return []; }

  async deleteUserReference(): Promise<any> { return true; }

  async generateReferralCode(): Promise<any> { return ""; }
  async getUserReputation(): Promise<any> { return undefined; }
  async updateUserReputation(): Promise<any> { return {}; }
  async calculateReputationStats(): Promise<any> { return; }
  async createReferenceResponse(): Promise<any> { return {}; }
  async getReferenceResponses(): Promise<any> { return []; }
  async createAiRecommendation(): Promise<any> { return {}; }
  async getUserAiRecommendations(): Promise<any> { return []; }
  async updateAiRecommendation(): Promise<any> { return undefined; }
  async deleteAiRecommendation(): Promise<any> { return true; }
  async bookmarkRecommendation(): Promise<any> { return undefined; }
  async markRecommendationVisited(): Promise<any> { return undefined; }
  async createUserTravelPreferences(): Promise<any> { return {}; }
  async getUserTravelPreferences(): Promise<any> { return undefined; }
  async updateUserTravelPreferences(): Promise<any> { return undefined; }
  async createAiConversation(): Promise<any> { return {}; }
  async getUserAiConversations(): Promise<any> { return []; }
  async getAiConversationsByLocation(): Promise<any> { return []; }
  async getUserPhotoAlbums(userId: number): Promise<PhotoAlbum[]> {
    try {
      console.log('📸 STORAGE: Getting travel memories for user', userId);
      
      const albums = await db
        .select()
        .from(photoAlbums)
        .where(eq(photoAlbums.userId, userId))
        .orderBy(desc(photoAlbums.createdAt));
      
      console.log(`📸 STORAGE: Found ${albums.length} travel memories for user ${userId}`);
      return albums;
    } catch (error) {
      console.error('Error fetching user travel memories:', error);
      return [];
    }
  }

  async updatePhotoAlbum(albumId: number, updateData: Partial<PhotoAlbum>): Promise<PhotoAlbum | null> {
    try {
      console.log('📸 STORAGE: Updating travel memory', albumId, 'with data:', updateData);
      
      const [updatedAlbum] = await db
        .update(photoAlbums)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(photoAlbums.id, albumId))
        .returning();
      
      console.log(`📸 STORAGE: Travel memory ${albumId} updated successfully`);
      return updatedAlbum || null;
    } catch (error) {
      console.error('Error updating travel memory:', error);
      throw error;
    }
  }

  async createPhotoAlbum(albumData: InsertPhotoAlbum): Promise<PhotoAlbum> {
    try {
      console.log('📸 STORAGE: Creating travel memory:', albumData);
      
      const [album] = await db
        .insert(photoAlbums)
        .values({
          ...albumData,
          coverPhoto: albumData.coverPhoto || albumData.photos[0]
        })
        .returning();

      console.log('✅ STORAGE: Travel memory created:', album);
      return album;
    } catch (error) {
      console.error('❌ STORAGE: Error creating travel memory:', error);
      throw error;
    }
  }

  async deletePhotoAlbum(albumId: number): Promise<boolean> {
    try {
      console.log('📸 STORAGE: Deleting travel memory', albumId);
      
      const result = await db
        .delete(photoAlbums)
        .where(eq(photoAlbums.id, albumId))
        .returning();
      
      if (result.length > 0) {
        console.log(`✅ STORAGE: Travel memory ${albumId} deleted successfully`);
        return true;
      } else {
        console.log(`❌ STORAGE: Travel memory ${albumId} not found`);
        return false;
      }
    } catch (error) {
      console.error('❌ STORAGE: Error deleting travel memory:', error);
      throw error;
    }
  }

  async getPhotoAlbum(albumId: number): Promise<PhotoAlbum | null> {
    try {
      console.log('📸 STORAGE: Getting travel memory', albumId);
      const [album] = await db
        .select()
        .from(photoAlbums)
        .where(eq(photoAlbums.id, albumId));
      
      console.log('📸 STORAGE: Found travel memory:', album ? 'Yes' : 'No');
      return album || null;
    } catch (error) {
      console.error('Error getting travel memory:', error);
      return null;
    }
  }

  async createTravelMemory(memoryData: {
    userId: number;
    destination: string;
    city: string;
    country: string;
    description: string;
    date: string;
    photos?: string[];
    tags?: string[];
    isPublic?: boolean;
    latitude?: number;
    longitude?: number;
  }): Promise<any> {
    try {
      console.log('Creating travel memory:', memoryData);
      
      const [memory] = await db.insert(travelMemories).values({
        userId: memoryData.userId,
        destination: memoryData.destination,
        city: memoryData.city,
        country: memoryData.country,
        description: memoryData.description,
        date: new Date(memoryData.date),
        photos: memoryData.photos || [],
        tags: memoryData.tags || [],
        isPublic: memoryData.isPublic ?? true,
        latitude: memoryData.latitude || null,
        longitude: memoryData.longitude || null,
        likes: 0,
        comments: 0
      }).returning();

      console.log('Successfully created travel memory:', memory);
      return memory;
    } catch (error) {
      console.error('Error creating travel memory:', error);
      throw error;
    }
  }
  async getUserTravelMemories(userId: number): Promise<any> {
    try {
      // Get memories with actual like and comment counts
      const memories = await db
        .select({
          id: travelMemories.id,
          userId: travelMemories.userId,
          destination: travelMemories.destination,
          photos: travelMemories.photos,
          description: travelMemories.description,
          date: travelMemories.date,
          tags: travelMemories.tags,
          city: travelMemories.city,
          country: travelMemories.country,
          latitude: travelMemories.latitude,
          longitude: travelMemories.longitude,
          isPublic: travelMemories.isPublic,
          createdAt: travelMemories.createdAt
        })
        .from(travelMemories)
        .where(eq(travelMemories.userId, userId))
        .orderBy(desc(travelMemories.createdAt));

      // Get actual like and comment counts for each memory
      const memoriesWithCounts = await Promise.all(
        memories.map(async (memory) => {
          // Count actual likes
          const likeCount = await db
            .select({ count: sql`count(*)` })
            .from(travelMemoryLikes)
            .where(eq(travelMemoryLikes.memoryId, memory.id));
          
          // Count actual comments
          const commentCount = await db
            .select({ count: sql`count(*)` })
            .from(travelMemoryComments)
            .where(eq(travelMemoryComments.memoryId, memory.id));

          return {
            ...memory,
            likes: Number(likeCount[0]?.count) || 0,
            comments: Number(commentCount[0]?.count) || 0
          };
        })
      );

      return memoriesWithCounts;
    } catch (error) {
      console.error('Error fetching user travel memories:', error);
      return [];
    }
  }
  async getTravelMemoryById(id: number): Promise<any> {
    try {
      const [memory] = await db
        .select()
        .from(travelMemories)
        .where(eq(travelMemories.id, id));
      return memory;
    } catch (error) {
      console.error('Error fetching travel memory:', error);
      return undefined;
    }
  }






  async updateTravelMemory(): Promise<any> { return undefined; }
  async deleteTravelMemory(): Promise<any> { return true; }
  async getTravelMemoriesByDestination(): Promise<any> { return []; }
  async likeTravelMemory(memoryId: number, userId: number): Promise<{ success: boolean, action: 'liked' | 'unliked' }> {
    try {
      console.log(`Checking like status for memoryId: ${memoryId}, userId: ${userId}`);
      
      // Check if already liked
      const existingLikes = await db
        .select()
        .from(travelMemoryLikes)
        .where(and(
          eq(travelMemoryLikes.memoryId, memoryId),
          eq(travelMemoryLikes.userId, userId)
        ));

      console.log(`Existing likes found: ${existingLikes.length}`, existingLikes);

      if (existingLikes.length > 0) {
        console.log(`Unliking memory ${memoryId} for user ${userId}`);
        // Unlike if already liked (toggle functionality)
        const deletedCount = await db
          .delete(travelMemoryLikes)
          .where(and(
            eq(travelMemoryLikes.memoryId, memoryId),
            eq(travelMemoryLikes.userId, userId)
          ));

        console.log(`Deleted ${deletedCount} like records`);

        // Decrement likes count
        await db
          .update(travelMemories)
          .set({ 
            likes: sql`GREATEST(${travelMemories.likes} - 1, 0)`
          })
          .where(eq(travelMemories.id, memoryId));

        console.log(`Successfully unliked memory ${memoryId}`);
        return { success: true, action: 'unliked' };
      }

      console.log(`Adding like for memory ${memoryId} by user ${userId}`);
      // Add like
      const [newLike] = await db.insert(travelMemoryLikes).values({
        memoryId,
        userId
      }).returning();

      console.log(`Created new like record:`, newLike);

      // Increment likes count
      await db
        .update(travelMemories)
        .set({ 
          likes: sql`${travelMemories.likes} + 1`
        })
        .where(eq(travelMemories.id, memoryId));

      console.log(`Successfully liked memory ${memoryId}`);
      return { success: true, action: 'liked' };
    } catch (error) {
      console.error('Error toggling travel memory like:', error);
      return { success: false, action: 'liked' };
    }
  }

  async unlikeTravelMemory(memoryId: number, userId: number): Promise<boolean> {
    try {
      // Remove like
      const result = await db
        .delete(travelMemoryLikes)
        .where(and(
          eq(travelMemoryLikes.memoryId, memoryId),
          eq(travelMemoryLikes.userId, userId)
        ));

      // Decrement likes count
      await db
        .update(travelMemories)
        .set({ 
          likes: sql`GREATEST(${travelMemories.likes} - 1, 0)`
        })
        .where(eq(travelMemories.id, memoryId));

      return true;
    } catch (error) {
      console.error('Error unliking travel memory:', error);
      return false;
    }
  }

  async isMemoryLikedByUser(memoryId: number, userId: number): Promise<boolean> {
    try {
      const [like] = await db
        .select()
        .from(travelMemoryLikes)
        .where(and(
          eq(travelMemoryLikes.memoryId, memoryId),
          eq(travelMemoryLikes.userId, userId)
        ));

      return !!like;
    } catch (error) {
      console.error('Error checking if memory is liked:', error);
      return false;
    }
  }
  async getTravelMemoryLikes(): Promise<any> { return []; }
  async createTravelMemoryComment(commentData: { memoryId: number; userId: number; content: string }): Promise<any> {
    try {
      const [comment] = await db.insert(travelMemoryComments).values({
        memoryId: commentData.memoryId,
        userId: commentData.userId,
        content: commentData.content
      }).returning();

      // Increment comments count
      await db
        .update(travelMemories)
        .set({ 
          comments: sql`${travelMemories.comments} + 1`
        })
        .where(eq(travelMemories.id, commentData.memoryId));

      return comment;
    } catch (error) {
      console.error('Error creating travel memory comment:', error);
      throw error;
    }
  }
  async getTravelMemoryComments(memoryId: number): Promise<any> {
    try {
      const comments = await db.select({
        id: travelMemoryComments.id,
        memoryId: travelMemoryComments.memoryId,
        userId: travelMemoryComments.userId,
        content: travelMemoryComments.content,
        createdAt: travelMemoryComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(travelMemoryComments)
      .leftJoin(users, eq(travelMemoryComments.userId, users.id))
      .where(eq(travelMemoryComments.memoryId, memoryId))
      .orderBy(travelMemoryComments.createdAt);

      return comments;
    } catch (error) {
      console.error('Error fetching travel memory comments:', error);
      return [];
    }
  }
  async deleteTravelMemoryComment(): Promise<any> { return true; }
  async createUserContributedInterest(): Promise<any> { return {}; }
  async getUserContributedInterests(): Promise<any> { return []; }
  async getUserContributedInterestsByLocation(): Promise<any> { return []; }
  async updateUserContributedInterest(): Promise<any> { return undefined; }
  async deleteUserContributedInterest(): Promise<any> { return true; }
  async likeUserContributedInterest(): Promise<any> { return undefined; }
  async createMoodBoard(): Promise<any> { return {}; }
  async getUserMoodBoards(): Promise<any> { return []; }
  async getMoodBoard(): Promise<any> { return undefined; }
  async updateMoodBoard(): Promise<any> { return undefined; }
  async deleteMoodBoard(): Promise<any> { return true; }
  async createMoodBoardItem(): Promise<any> { return {}; }
  async getMoodBoardItems(): Promise<any> { return []; }
  async updateMoodBoardItem(): Promise<any> { return undefined; }
  async deleteMoodBoardItem(): Promise<any> { return true; }
  async createPackingList(): Promise<any> { return {}; }
  async getUserPackingLists(): Promise<any> { return []; }
  async getPackingList(): Promise<any> { return undefined; }
  async updatePackingList(): Promise<any> { return undefined; }
  async deletePackingList(): Promise<any> { return true; }
  async createPackingListItem(): Promise<any> { return {}; }
  async getPackingListItems(): Promise<any> { return []; }
  async updatePackingListItem(): Promise<any> { return undefined; }
  async deletePackingListItem(): Promise<any> { return true; }
  async reorderPackingListItems(): Promise<any> { return true; }
  async getTravelChallenges(): Promise<any> { return []; }
  async getTravelChallenge(): Promise<any> { return undefined; }
  async createTravelChallenge(): Promise<any> { return {}; }
  async joinTravelChallenge(): Promise<any> { return {}; }
  async getUserChallenges(): Promise<any> { return []; }
  async completeTravelChallenge(): Promise<any> { return undefined; }
  async updateUserChallenge(): Promise<any> { return undefined; }
  async getUserLeaderboardEntry(): Promise<any> { return undefined; }
  async updateUserLeaderboard(): Promise<any> { return {}; }
  async getLeaderboardRankings(): Promise<any> { return []; }
  async calculateUserRank(): Promise<any> { return 0; }
  async getCityChatrooms(city?: string, state?: string, country?: string, userId?: number): Promise<any[]> {
    try {
      console.log('getCityChatrooms called with:', { city, state, country, userId });
      
      // If no userId provided, use city filtering with LA METRO DUAL VISIBILITY
      if (!userId) {
        const conditions = [eq(citychatrooms.isActive, true)];
        
        // LA METRO DUAL VISIBILITY: Apply same pattern as events
        if (city) {
          const { isLAMetroCity, getMetroCities } = await import('../shared/constants');
          
          if (isLAMetroCity(city) || city === 'Los Angeles Metro') {
            // Show chatrooms from ALL LA Metro cities  
            const allMetroCities = getMetroCities('Los Angeles');
            console.log(`🌍 LA METRO CHATROOMS: Searching for chatrooms in ALL LA metro cities:`, allMetroCities.length, 'cities');
            conditions.push(inArray(citychatrooms.city, allMetroCities));
          } else {
            // Regular city search
            conditions.push(eq(citychatrooms.city, city));
          }
        }
        
        if (state) conditions.push(eq(citychatrooms.state, state));
        if (country) conditions.push(eq(citychatrooms.country, country));
        
        const chatrooms = await db
          .select()
          .from(citychatrooms)
          .where(and(...conditions))
          .orderBy(desc(citychatrooms.createdAt));

        // Get member counts for all chatrooms (even for public access)
        const memberCounts = await db
          .select({
            chatroomId: chatroomMembers.chatroomId,
            count: sql<number>`count(*)`.as('count')
          })
          .from(chatroomMembers)
          .where(eq(chatroomMembers.isActive, true))
          .groupBy(chatroomMembers.chatroomId);

        console.log('Raw member counts from DB:', memberCounts.slice(0, 3));

        // Create member count lookup ensuring proper integers
        const memberCountMap = new Map();
        memberCounts.forEach(mc => {
          const count = parseInt(String(mc.count)) || 1;
          memberCountMap.set(mc.chatroomId, count);
          console.log(`Chatroom ${mc.chatroomId}: ${count} members`);
        });
        
        return chatrooms.map(chatroom => ({
          ...chatroom,
          userIsMember: false,
          canJoin: chatroom.isPublic,
          memberCount: memberCountMap.get(chatroom.id) || 1, // Default to 1 (creator)
          tags: chatroom.tags || [],
          rules: chatroom.rules
        }));
      }

      // Get user to determine their bucket locations
      const user = await this.getUser(userId);
      if (!user) {
        console.log('User not found for chatroom query');
        return [];
      }

      // SIMPLIFIED BUCKET SYSTEM FOR CHATROOMS
      // User should see chatrooms from:
      // 1. HOMETOWN BUCKET - chatrooms from their permanent hometown
      // 2. TRAVELING BUCKET - chatrooms from where they're currently traveling (based on isCurrentlyTraveling flag)

      const chatroomQueries = [];

      // Add hometown chatrooms (PERMANENT BUCKET)
      if (user.hometownCity && user.hometownCountry) {
        chatroomQueries.push(
          and(
            eq(citychatrooms.city, user.hometownCity),
            eq(citychatrooms.country, user.hometownCountry),
            eq(citychatrooms.isActive, true)
          )
        );
      }

      // Add current travel destination chatrooms (TEMPORARY BUCKET)
      // Use the simpler isCurrentlyTraveling flag instead of complex date queries
      if (user.isCurrentlyTraveling && user.travelDestination) {
        const locationParts = user.travelDestination.split(',').map(p => p.trim());
        const [travelCity, travelState, travelCountry] = locationParts;
        
        if (travelCity && travelCountry) {
          chatroomQueries.push(
            and(
              eq(citychatrooms.city, travelCity),
              eq(citychatrooms.country, travelCountry),
              eq(citychatrooms.isActive, true)
            )
          );
        }
      }

      console.log(`User ${user.username} bucket locations:`, {
        hometown: `${user.hometownCity}, ${user.hometownCountry}`,
        traveling: user.isCurrentlyTraveling ? user.travelDestination : 'Not traveling',
        queries: chatroomQueries.length
      });

      console.log(`User ${user.username} chatroom buckets: ${chatroomQueries.length} locations`);
      
      if (chatroomQueries.length === 0) {
        return [];
      }

      // Get user memberships
      const userMemberships = await db
        .select({ chatroomId: chatroomMembers.chatroomId })
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.userId, userId),
          eq(chatroomMembers.isActive, true)
        ));

      const userChatroomIds = userMemberships.map(m => m.chatroomId);

      // Get chatrooms from all bucket locations
      const allChatrooms = await db
        .select()
        .from(citychatrooms)
        .where(or(...chatroomQueries))
        .orderBy(desc(citychatrooms.createdAt));

      // Get member counts for all chatrooms - DIRECT APPROACH
      const memberCounts = await db
        .select({
          chatroomId: chatroomMembers.chatroomId,
          count: sql<string>`cast(count(*) as text)`.as('count')
        })
        .from(chatroomMembers)
        .where(eq(chatroomMembers.isActive, true))
        .groupBy(chatroomMembers.chatroomId);

      console.log('Member counts query result:', memberCounts.slice(0, 5));
      console.log('Raw member counts:', memberCounts.map(mc => ({ chatroomId: mc.chatroomId, count: mc.count, type: typeof mc.count })));

      // Create member count lookup ensuring proper integers
      const memberCountMap = new Map();
      console.log(`Processing ${memberCounts.length} member count records`);
      memberCounts.forEach((mc, index) => {
        const count = parseInt(mc.count) || 1; // Direct conversion from string
        memberCountMap.set(mc.chatroomId, count);
      });
      
      // Log the final memberCountMap content for debugging
      console.log('Final memberCountMap contents:');
      for (const [key, value] of memberCountMap) {
        console.log(`  Chatroom ${key}: ${value} members`);
      }
      
      console.log(`Storage - Total chatrooms found: ${chatrooms.length}, member counts available: ${memberCounts.length}`);

      // Add membership status and minimal required fields
      const chatroomsWithStatus = allChatrooms.map(chatroom => {
        const actualMemberCount = memberCountMap.get(chatroom.id);
        const finalMemberCount = actualMemberCount !== undefined ? actualMemberCount : 1;
        
        return {
          id: chatroom.id,
          name: chatroom.name,
          description: chatroom.description,
          city: chatroom.city,
          state: chatroom.state,
          country: chatroom.country,
          createdById: chatroom.createdById,
          isActive: chatroom.isActive,
          isPublic: chatroom.isPublic,
          maxMembers: chatroom.maxMembers,
          createdAt: chatroom.createdAt,
          userIsMember: userChatroomIds.includes(chatroom.id),
          canJoin: chatroom.isPublic || userChatroomIds.includes(chatroom.id),
          memberCount: finalMemberCount, // Use actual count from database
          tags: chatroom.tags || [], // Use actual tags or empty array
          rules: chatroom.rules // Use actual rules
        };
      });

      console.log(`Found ${chatroomsWithStatus.length} chatrooms across user's bucket locations`);
      return chatroomsWithStatus;
    } catch (error) {
      console.error('Error fetching city chatrooms:', error);
      return [];
    }
  }
  async createCityChatroom(data: any): Promise<any> {
    try {
      const [chatroom] = await db.insert(citychatrooms).values({
        name: data.name,
        description: data.description,
        city: data.city,
        state: data.state,
        country: data.country,
        createdById: data.createdById,
        isPublic: data.isPublic !== false, // Default to public unless explicitly set to false
        maxMembers: data.maxMembers || 500,
        tags: data.tags || [],
        rules: data.rules
      }).returning();

      // Automatically add creator as member
      await db.insert(chatroomMembers).values({
        chatroomId: chatroom.id,
        userId: data.createdById,
        role: 'admin',
        isActive: true
      });

      // Note: Removed automatic addition of user ID 1 as admin since that user no longer exists

      // Award 2 aura for creating chatroom
      await this.awardAura(data.createdById, 2, 'creating chatroom');

      console.log(`Created chatroom "${chatroom.name}" - ready for participants`);
      return chatroom;
    } catch (error) {
      console.error('Error creating chatroom:', error);
      throw error;
    }
  }
  async getUserChatrooms(): Promise<any> { return []; }
  async getChatroomById(id: number): Promise<any> {
    try {
      const [chatroom] = await db.select({
        id: citychatrooms.id,
        name: citychatrooms.name,
        description: citychatrooms.description,
        city: citychatrooms.city,
        state: citychatrooms.state,
        country: citychatrooms.country,
        createdById: citychatrooms.createdById,
        isActive: citychatrooms.isActive,
        isPublic: citychatrooms.isPublic,
        maxMembers: citychatrooms.maxMembers,
        tags: citychatrooms.tags,
        rules: citychatrooms.rules,
        createdAt: citychatrooms.createdAt,
        creator: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(citychatrooms)
      .leftJoin(users, eq(citychatrooms.createdById, users.id))
      .where(eq(citychatrooms.id, id))
      .limit(1);

      return chatroom;
    } catch (error) {
      console.error('Error fetching chatroom by ID:', error);
      return undefined;
    }
  }

  async isUserChatroomMember(userId: number, chatroomId: number): Promise<boolean> {
    try {
      const [member] = await db
        .select()
        .from(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.userId, userId),
            eq(chatroomMembers.chatroomId, chatroomId),
            eq(chatroomMembers.isActive, true)
          )
        )
        .limit(1);
      return !!member;
    } catch (error) {
      console.error('Error checking chatroom membership:', error);
      return false;
    }
  }

  async updateChatroom(): Promise<any> { return undefined; }
  async deleteChatroom(): Promise<any> { return true; }
  async joinChatroom(chatroomId: number, userId: number): Promise<any> {
    try {
      // Check if user is already a member
      const existingMember = await db.select()
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.chatroomId, chatroomId),
          eq(chatroomMembers.userId, userId)
        ))
        .limit(1);

      if (existingMember.length > 0) {
        // Reactivate membership if exists but inactive and award aura for rejoining
        const member = existingMember[0];
        if (!member.isActive) {
          await db.update(chatroomMembers)
            .set({ isActive: true })
            .where(and(
              eq(chatroomMembers.chatroomId, chatroomId),
              eq(chatroomMembers.userId, userId)
            ));
          
          // Award 1 aura for rejoining chatroom
          await this.awardAura(userId, 1, 'rejoining chatroom');
        }
        return { success: true };
      }

      // Add new member
      await db.insert(chatroomMembers).values({
        chatroomId,
        userId,
        role: 'member',
        isActive: true
      });

      // Award 1 aura for joining chatroom
      await this.awardAura(userId, 1, 'joining chatroom');

      return { success: true };
    } catch (error) {
      console.error('Error joining chatroom:', error);
      throw error;
    }
  }
  async leaveChatroom(): Promise<any> { return true; }
  async getChatroomMembers(chatroomId: number): Promise<any[]> {
    try {
      const members = await db.select({
        id: chatroomMembers.id,
        chatroomId: chatroomMembers.chatroomId,
        userId: chatroomMembers.userId,
        role: chatroomMembers.role,
        isActive: chatroomMembers.isActive,
        joinedAt: chatroomMembers.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(chatroomMembers)
      .leftJoin(users, eq(chatroomMembers.userId, users.id))
      .where(and(
        eq(chatroomMembers.chatroomId, chatroomId),
        eq(chatroomMembers.isActive, true)
      ));

      return members;
    } catch (error) {
      console.error('Error fetching chatroom members:', error);
      return [];
    }
  }
  async updateChatroomMember(): Promise<any> { return undefined; }
  async createChatroomMessage(chatroomId: number, senderId: number, content: string): Promise<any> {
    try {
      const [message] = await db.insert(chatroomMessages).values({
        chatroomId,
        senderId,
        content,
        messageType: 'text'
      }).returning();

      return message;
    } catch (error) {
      console.error('Error creating chatroom message:', error);
      throw error;
    }
  }
  async getChatroomMessages(chatroomId: number): Promise<any[]> {
    try {
      const messages = await db.select({
        id: chatroomMessages.id,
        chatroomId: chatroomMessages.chatroomId,
        senderId: chatroomMessages.senderId,
        content: chatroomMessages.content,
        messageType: chatroomMessages.messageType,
        replyToId: chatroomMessages.replyToId,
        isEdited: chatroomMessages.isEdited,
        createdAt: chatroomMessages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(chatroomMessages)
      .leftJoin(users, eq(chatroomMessages.senderId, users.id))
      .where(eq(chatroomMessages.chatroomId, chatroomId))
      .orderBy(chatroomMessages.createdAt);

      return messages;
    } catch (error) {
      console.error('Error fetching chatroom messages:', error);
      return [];
    }
  }
  async updateChatroomMessage(): Promise<any> { return undefined; }
  async deleteChatroomMessage(): Promise<any> { return true; }
  
  async getChatroomsCreatedByUser(userId: number): Promise<any[]> {
    try {
      console.log('getChatroomsCreatedByUser called for userId:', userId);
      
      // Get chatrooms created by this user - try with explicit array handling
      let createdChatrooms;
      try {
        createdChatrooms = await db
          .select()
          .from(citychatrooms)
          .where(eq(citychatrooms.createdById, userId))
          .orderBy(desc(citychatrooms.createdAt));
        
        console.log('Drizzle query result type:', typeof createdChatrooms, Array.isArray(createdChatrooms));
        console.log('Drizzle query result length:', createdChatrooms?.length);
        
        // If the result isn't an array, return empty array
        if (!Array.isArray(createdChatrooms)) {
          console.warn('Drizzle query did not return an array, returning empty array');
          return [];
        }
      } catch (drizzleError) {
        console.error('Drizzle query failed, falling back to raw SQL:', drizzleError);
        
        // Fallback to raw SQL
        const result = await db.execute(sql`
          SELECT * FROM city_chatrooms 
          WHERE created_by_id = ${userId} 
          ORDER BY created_at DESC
        `);
        
        createdChatrooms = Array.isArray(result) ? result : (result.rows || []);
      }

      console.log(`Found ${createdChatrooms.length} chatrooms created by user ${userId}`);

      // Get member counts for all chatrooms
      const memberCounts = await db
        .select({
          chatroomId: chatroomMembers.chatroomId,
          count: sql<number>`count(*)::int`.as('count')
        })
        .from(chatroomMembers)
        .where(eq(chatroomMembers.isActive, true))
        .groupBy(chatroomMembers.chatroomId);

      // Create member count lookup
      const memberCountMap = new Map(memberCounts.map(mc => [mc.chatroomId, parseInt(mc.count as any) || 1]));
      
      // Check if user is member of their own chatrooms
      const userMemberships = await db
        .select({ chatroomId: chatroomMembers.chatroomId })
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.userId, userId),
          eq(chatroomMembers.isActive, true)
        ));

      const userMembershipSet = new Set(userMemberships.map(m => m.chatroomId));

      return createdChatrooms.map(chatroom => ({
        ...chatroom,
        userIsMember: userMembershipSet.has(chatroom.id),
        canJoin: true, // Creator can always join their own chatroom
        memberCount: memberCountMap.get(chatroom.id) || 1, // Default to 1 (creator)
        tags: chatroom.tags || [],
        rules: chatroom.rules
      }));

    } catch (error) {
      console.error('Error fetching chatrooms created by user:', error);
      return [];
    }
  }

  async getChatroomsJoinedByUser(userId: number): Promise<any[]> {
    try {
      console.log('getChatroomsJoinedByUser called for userId:', userId);
      
      // Get chatrooms where user is a member (not creator)
      const joinedChatrooms = await db
        .select({
          id: citychatrooms.id,
          name: citychatrooms.name,
          description: citychatrooms.description,
          city: citychatrooms.city,
          state: citychatrooms.state,
          country: citychatrooms.country,
          tags: citychatrooms.tags,
          isPublic: citychatrooms.isPublic,
          createdAt: citychatrooms.createdAt,
          createdById: citychatrooms.createdById,
        })
        .from(citychatroomMembers)
        .innerJoin(citychatrooms, eq(citychatroomMembers.chatroomId, citychatrooms.id))
        .where(
          and(
            eq(citychatroomMembers.userId, userId),
            ne(citychatrooms.createdById, userId) // Exclude chatrooms user created
          )
        )
        .orderBy(desc(citychatrooms.createdAt));

      console.log(`Found ${joinedChatrooms.length} joined chatrooms for user ${userId}`);
      return joinedChatrooms;
    } catch (error) {
      console.error('Error in getChatroomsJoinedByUser:', error);
      return [];
    }
  }

  // Location-based mapping methods for city visualization
  async getUsersWithLocationInCity(city: string, state?: string, country: string = ''): Promise<User[]> {
    try {
      const query = db.select().from(users).where(
        and(
          eq(users.locationSharingEnabled, true),
          isNotNull(users.currentLatitude),
          isNotNull(users.currentLongitude),
          eq(users.isActive, true),
          // Only show authentic NearbyTraveler platform members
          eq(users.isAIGenerated, false),
          or(
            // Hometown users
            and(
              eq(users.hometownCity, city),
              state ? eq(users.hometownState, state) : sql`true`,
              eq(users.hometownCountry, country)
            ),
            // Current travelers
            and(
              eq(users.isCurrentlyTraveling, true),
              like(users.travelDestination, `%${city}%`)
            )
          )
        )
      );
      
      return await query;
    } catch (error) {
      console.error('Error fetching users with location in city:', error);
      return [];
    }
  }

  async getEventsWithLocationInCity(city: string, state?: string, country: string = ''): Promise<any[]> {
    try {
      const query = db.select({
        id: events.id,
        title: events.title,
        location: events.location,
        date: events.date,
        latitude: events.latitude,
        longitude: events.longitude,
        organizerId: events.organizerId,
        isActive: events.isActive,
        city: events.city,
        state: events.state,
        organizer: {
          id: users.id,
          username: users.username,
          isAIGenerated: users.isAIGenerated
        }
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(
        and(
          eq(events.city, city),
          state ? eq(events.state, state) : sql`true`,
          eq(events.isActive, true),
          // Only show events created by authentic NearbyTraveler members
          eq(users.isAiGenerated, false)
        )
      );
      
      return await query;
    } catch (error) {
      console.error('Error fetching events with location in city:', error);
      return [];
    }
  }

  async getBusinessesWithLocationInCity(city: string, state?: string, country: string = ''): Promise<User[]> {
    try {
      const query = db.select().from(users).where(
        and(
          eq(users.userType, 'business'),
          eq(users.hometownCity, city),
          state ? eq(users.hometownState, state) : sql`true`,
          eq(users.hometownCountry, country),
          isNotNull(users.currentLatitude),
          isNotNull(users.currentLongitude),
          eq(users.isActive, true),
          // Only show authentic NearbyTraveler businesses with active subscriptions
          eq(users.isAIGenerated, false),
          or(
            eq(users.subscriptionStatus, 'active'),
            eq(users.subscriptionStatus, 'trialing')
          )
        )
      );
      
      return await query;
    } catch (error) {
      console.error('Error fetching businesses with location in city:', error);
      return [];
    }
  }

  async updateUserLocation(userId: number, latitude: number, longitude: number, locationSharingEnabled: boolean): Promise<void> {
    try {
      await db.update(users)
        .set({
          currentLatitude: latitude,
          currentLongitude: longitude,
          locationSharingEnabled: locationSharingEnabled,
          lastLocationUpdate: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }
  async createChatroomInvitation(chatroomId: number, inviterId: number, inviteeId: number, message?: string): Promise<any> {
    try {
      // Check if invitation already exists
      const existingInvitation = await db.select()
        .from(chatroomInvitations)
        .where(and(
          eq(chatroomInvitations.chatroomId, chatroomId),
          eq(chatroomInvitations.inviteeId, inviteeId),
          eq(chatroomInvitations.status, 'pending')
        ))
        .limit(1);

      if (existingInvitation.length > 0) {
        throw new Error('Invitation already exists');
      }

      const [invitation] = await db.insert(chatroomInvitations).values({
        chatroomId,
        inviterId,
        inviteeId,
        message: message || '',
        status: 'pending'
      }).returning();

      return invitation;
    } catch (error) {
      console.error('Error creating chatroom invitation:', error);
      throw error;
    }
  }
  async getChatroomInvitations(): Promise<any> { return []; }
  async getUserChatroomInvitations(): Promise<any> { return []; }
  async respondToChatroomInvitation(): Promise<any> { return undefined; }
  async canUserAccessChatroom(): Promise<any> { return true; }
  async ensureCityExists(city: string, state: string, country: string): Promise<boolean> {
    try {
      console.log(`🏙️ CITY SETUP: Ensuring complete city infrastructure for ${city}, ${state}, ${country}`);
      
      // 1. Create city page entry
      try {
        const existingCityPage = await db
          .select()
          .from(cityPages)
          .where(and(
            eq(cityPages.city, city),
            eq(cityPages.country, country)
          ))
          .limit(1);

        if (existingCityPage.length === 0) {
          await db.insert(cityPages).values({
            city,
            state: state || '',
            country,
            description: `Discover ${city} - Connect with locals and travelers, find events, and explore amazing experiences.`,
            imageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`✅ CITY SETUP: Created city page for ${city}`);
        }
      } catch (error) {
        console.error(`❌ CITY SETUP: Error creating city page for ${city}:`, error);
      }

      // 2. Create default chatrooms for the city
      try {
        // Check if chatrooms already exist
        const existingChatrooms = await db
          .select()
          .from(citychatrooms)
          .where(and(
            eq(citychatrooms.city, city),
            eq(citychatrooms.country, country)
          ))
          .limit(2);

        if (existingChatrooms.length < 2) {
          // Create Welcome Newcomers chatroom
          if (!existingChatrooms.some(room => room.name.includes('Welcome Newcomers'))) {
            await db.insert(citychatrooms).values({
              name: `Welcome Newcomers ${city}`,
              description: `Welcome new visitors and locals to ${city}`,
              city,
              state: state || '',
              country,
              createdById: 1, // System user
              isActive: true,
              isPublic: true,
              maxMembers: 500,
              tags: ['welcome', 'newcomers', 'locals', 'travelers'],
              rules: 'Be respectful and helpful to fellow travelers and locals'
            });
            console.log(`✅ CITY SETUP: Created Welcome Newcomers chatroom for ${city}`);
          }

          // Create Let's Meet Up chatroom
          if (!existingChatrooms.some(room => room.name.includes("Let's Meet Up"))) {
            await db.insert(citychatrooms).values({
              name: `Let's Meet Up ${city}`,
              description: `Plan meetups and events with locals and travelers in ${city}`,
              city,
              state: state || '',
              country,
              createdById: 1, // System user
              isActive: true,
              isPublic: true,
              maxMembers: 300,
              tags: ['meetup', 'events', 'social'],
              rules: 'Share helpful local tips and coordinate meetups'
            });
            console.log(`✅ CITY SETUP: Created Let's Meet Up chatroom for ${city}`);
          }
        }
      } catch (error) {
        console.error(`❌ CITY SETUP: Error creating chatrooms for ${city}:`, error);
      }

      // 3. Ensure city has activities
      try {
        const { ensureCityHasActivities } = await import('./auto-city-setup.js');
        await ensureCityHasActivities(city, 1);
        console.log(`✅ CITY SETUP: Ensured activities for ${city}`);
      } catch (error) {
        console.error(`❌ CITY SETUP: Error setting up activities for ${city}:`, error);
      }

      console.log(`🎉 CITY SETUP: Complete city infrastructure ready for ${city}`);
      return true;
    } catch (error) {
      console.error(`❌ CITY SETUP: Failed to ensure city exists for ${city}:`, error);
      return false;
    }
  }

  async getCityStatistics(): Promise<any> {
    try {
      // Metropolitan area mapping to consolidate small towns into major cities
      const getMetropolitanArea = (city: string, state: string, country: string) => {
        const cityLower = city.toLowerCase().trim();
        const stateLower = state.toLowerCase().trim();
        const countryLower = country.toLowerCase().trim();

        // State abbreviation mapping for case-insensitive matching
        const stateAbbreviations: Record<string, string> = {
          'ca': 'california',
          'ny': 'new york', 
          'ma': 'massachusetts',
          'tx': 'texas',
          'fl': 'florida',
          'il': 'illinois',
          'pa': 'pennsylvania',
          'oh': 'ohio',
          'mi': 'michigan',
          'ga': 'georgia',
          'nc': 'north carolina',
          'nj': 'new jersey',
          'va': 'virginia',
          'wa': 'washington',
          'az': 'arizona',
          'tn': 'tennessee',
          'in': 'indiana',
          'mo': 'missouri',
          'md': 'maryland',
          'wi': 'wisconsin',
          'co': 'colorado',
          'mn': 'minnesota',
          'sc': 'south carolina',
          'al': 'alabama',
          'la': 'louisiana',
          'ky': 'kentucky',
          'or': 'oregon',
          'ok': 'oklahoma',
          'ct': 'connecticut',
          'ut': 'utah',
          'nv': 'nevada',
          'ar': 'arkansas',
          'ms': 'mississippi',
          'ks': 'kansas',
          'nm': 'new mexico',
          'ne': 'nebraska',
          'wv': 'west virginia',
          'id': 'id...Truncated'
        };

        // Normalize state to full name for consistent matching
        const normalizedState = stateAbbreviations[stateLower] || stateLower;

        // Check if US location
        const isUS = countryLower.includes('united states') || countryLower.includes('usa') || countryLower.includes('us');

        // Los Angeles Metropolitan Area - more aggressive matching
        if (isUS && (normalizedState.includes('california'))) {
          if (cityLower.includes('playa') || cityLower.includes('santa monica') || 
              cityLower.includes('beverly') || cityLower.includes('hollywood') ||
              cityLower.includes('venice') || cityLower.includes('culver') ||
              cityLower.includes('manhattan beach') || cityLower.includes('redondo') ||
              cityLower.includes('segundo') || cityLower.includes('inglewood') ||
              cityLower.includes('torrance') || cityLower.includes('long beach') ||
              cityLower.includes('pasadena') || cityLower.includes('burbank') ||
              cityLower.includes('glendale') || cityLower.includes('los angeles') ||
              cityLower.includes('lax') || cityLower.includes('marina') ||
              cityLower.includes('hermosa')) {
            return { city: 'Los Angeles Metro', state: 'California', country: 'United States' };
          }
          
          // San Francisco Bay Area  
          if (cityLower.includes('san francisco') || cityLower.includes('oakland') ||
              cityLower.includes('berkeley') || cityLower.includes('san jose') ||
              cityLower.includes('palo alto') || cityLower.includes('mountain view') ||
              cityLower.includes('sunnyvale') || cityLower.includes('fremont') ||
              cityLower.includes('hayward') || cityLower.includes('richmond') ||
              cityLower.includes('san mateo') || cityLower.includes('redwood city') ||
              cityLower.includes('santa clara') || cityLower.includes('cupertino') ||
              cityLower.includes('milpitas') || cityLower.includes('daly city') ||
              cityLower.includes('san rafael')) {
            return { city: 'San Francisco Bay Area', state: 'California', country: 'United States' };
          }
        }

        // New York Metropolitan Area - keep boroughs separate but group NYC variants
        if (isUS && normalizedState.includes('new york')) {
          if (cityLower.includes('manhattan') || (cityLower.includes('new york') && !cityLower.includes('brooklyn') && !cityLower.includes('queens') && !cityLower.includes('bronx')) ||
              cityLower.includes('nyc')) {
            return { city: 'Manhattan', state: 'New York', country: 'United States' };
          }
          if (cityLower.includes('brooklyn')) {
            return { city: 'Brooklyn', state: 'New York', country: 'United States' };
          }
          if (cityLower.includes('queens')) {
            return { city: 'Queens', state: 'New York', country: 'United States' };
          }
          if (cityLower.includes('bronx')) {
            return { city: 'Bronx', state: 'New York', country: 'United States' };
          }
          if (cityLower.includes('staten island')) {
            return { city: 'Staten Island', state: 'New York', country: 'United States' };
          }
        }

        // Boston Metropolitan Area
        if (isUS && normalizedState.includes('massachusetts')) {
          if (cityLower.includes('boston') || cityLower.includes('cambridge') ||
              cityLower.includes('somerville') || cityLower.includes('quincy') ||
              cityLower.includes('newton') || cityLower.includes('brookline') ||
              cityLower.includes('medford') || cityLower.includes('watertown')) {
            return { city: 'Boston', state: 'Massachusetts', country: 'United States' };
          }
        }

        // Chicago Metropolitan Area
        if (isUS && normalizedState.includes('illinois')) {
          if (cityLower.includes('chicago') || cityLower.includes('evanston') ||
              cityLower.includes('oak park') || cityLower.includes('cicero') ||
              cityLower.includes('skokie') || cityLower.includes('schaumburg')) {
            return { city: 'Chicago', state: 'Illinois', country: 'United States' };
          }
        }

        // Handle country-city reversal cases (e.g., "Hungary Budapest" should be "Budapest, Hungary")
        let normalizedCity = cityLower;
        let normalizedCountry = countryLower;
        
        // Check for reversed country-city patterns
        if (cityLower.includes('hungary') && (stateLower.includes('budapest') || countryLower.includes('budapest'))) {
          normalizedCity = 'budapest';
          normalizedCountry = 'hungary';
        } else if (cityLower.includes('italy') && (stateLower.includes('rome') || countryLower.includes('rome'))) {
          normalizedCity = 'rome';
          normalizedCountry = 'italy';
        } else if (cityLower.includes('france') && (stateLower.includes('paris') || countryLower.includes('paris'))) {
          normalizedCity = 'paris';
          normalizedCountry = 'france';
        } else if (cityLower.includes('japan') && (stateLower.includes('tokyo') || countryLower.includes('tokyo'))) {
          normalizedCity = 'tokyo';
          normalizedCountry = 'japan';
        } else if (cityLower.includes('australia') && (stateLower.includes('sydney') || countryLower.includes('sydney'))) {
          normalizedCity = 'sydney';
          normalizedCountry = 'australia';
        } else if (cityLower.includes('spain') && (stateLower.includes('madrid') || countryLower.includes('madrid'))) {
          normalizedCity = 'madrid';
          normalizedCountry = 'spain';
        } else if (cityLower.includes('germany') && (stateLower.includes('berlin') || countryLower.includes('berlin'))) {
          normalizedCity = 'berlin';
          normalizedCountry = 'germany';
        }

        // International capital cities and major metropolitan areas (case-insensitive)
        if ((normalizedCity.includes('budapest') || cityLower.includes('budapest')) && 
            (normalizedCountry.includes('hungary') || countryLower.includes('hungary') || stateLower.includes('hungary'))) {
          return { city: 'Budapest', state: '', country: 'Hungary' };
        }

        // Rome - handle provinces/regions like Lazio
        if ((normalizedCity.includes('rome') || cityLower.includes('rome')) && 
            (normalizedCountry.includes('italy') || countryLower.includes('italy') || stateLower.includes('italy') ||
             stateLower.includes('lazio') || stateLower.includes('latium'))) {
          return { city: 'Rome', state: '', country: 'Italy' };
        }

        // London - handle regions like Greater London, England
        if ((normalizedCity.includes('london') || cityLower.includes('london')) && 
            (normalizedCountry.includes('united kingdom') || countryLower.includes('uk') || countryLower.includes('england') || 
             stateLower.includes('england') || stateLower.includes('greater london'))) {
          return { city: 'London', state: '', country: 'United Kingdom' };
        }

        // Paris - handle regions like Île-de-France
        if ((normalizedCity.includes('paris') || cityLower.includes('paris')) && 
            (normalizedCountry.includes('france') || countryLower.includes('france') || stateLower.includes('france') ||
             stateLower.includes('île-de-france') || stateLower.includes('ile-de-france'))) {
          return { city: 'Paris', state: '', country: 'France' };
        }

        // Tokyo - handle prefectures like Tokyo Prefecture
        if ((normalizedCity.includes('tokyo') || cityLower.includes('tokyo')) && 
            (normalizedCountry.includes('japan') || countryLower.includes('japan') || stateLower.includes('japan') ||
             stateLower.includes('tokyo prefecture') || stateLower.includes('kanto'))) {
          return { city: 'Tokyo', state: '', country: 'Japan' };
        }

        // Sydney - handle states like New South Wales
        if ((normalizedCity.includes('sydney') || cityLower.includes('sydney')) && 
            (normalizedCountry.includes('australia') || countryLower.includes('australia') || stateLower.includes('australia') ||
             stateLower.includes('new south wales') || stateLower.includes('nsw'))) {
          return { city: 'Sydney', state: '', country: 'Australia' };
        }

        // Madrid - handle regions like Community of Madrid
        if ((normalizedCity.includes('madrid') || cityLower.includes('madrid')) && 
            (normalizedCountry.includes('spain') || countryLower.includes('spain') || stateLower.includes('spain') ||
             stateLower.includes('community of madrid') || stateLower.includes('comunidad de madrid'))) {
          return { city: 'Madrid', state: '', country: 'Spain' };
        }

        // Berlin - handle states like Berlin (city-state)
        if ((normalizedCity.includes('berlin') || cityLower.includes('berlin')) && 
            (normalizedCountry.includes('germany') || countryLower.includes('germany') || stateLower.includes('germany') ||
             stateLower.includes('brandenburg'))) {
          return { city: 'Berlin', state: '', country: 'Germany' };
        }

        // Amsterdam - handle provinces like North Holland
        if ((normalizedCity.includes('amsterdam') || cityLower.includes('amsterdam')) && 
            (normalizedCountry.includes('netherlands') || countryLower.includes('netherlands') || stateLower.includes('netherlands') ||
             stateLower.includes('north holland') || stateLower.includes('noord-holland'))) {
          return { city: 'Amsterdam', state: '', country: 'Netherlands' };
        }

        // Vienna - handle states like Vienna (city-state)
        if ((normalizedCity.includes('vienna') || cityLower.includes('vienna') || normalizedCity.includes('wien') || cityLower.includes('wien')) && 
            (normalizedCountry.includes('austria') || countryLower.includes('austria') || stateLower.includes('austria') ||
             stateLower.includes('wien'))) {
          return { city: 'Vienna', state: '', country: 'Austria' };
        }

        // Austin - handle variations like "Austin Texas"
        if (cityLower.includes('austin')) {
          return { city: 'Austin', state: 'Texas', country: 'United States' };
        }

        // Prague - handle regions like Prague (capital city)
        if ((normalizedCity.includes('prague') || cityLower.includes('prague') || normalizedCity.includes('praha') || cityLower.includes('praha')) && 
            (normalizedCountry.includes('czech') || countryLower.includes('czech') || stateLower.includes('czech') ||
             stateLower.includes('bohemia') || stateLower.includes('central bohemia'))) {
          return { city: 'Prague', state: '', country: 'Czech Republic' };
        }

        // Barcelona - handle regions like Catalonia
        if ((normalizedCity.includes('barcelona') || cityLower.includes('barcelona')) && 
            (normalizedCountry.includes('spain') || countryLower.includes('spain') || stateLower.includes('spain') ||
             stateLower.includes('catalonia') || stateLower.includes('catalunya') || stateLower.includes('cataluña'))) {
          return { city: 'Barcelona', state: '', country: 'Spain' };
        }

        // Milan - handle regions like Lombardy
        if ((normalizedCity.includes('milan') || cityLower.includes('milan') || normalizedCity.includes('milano') || cityLower.includes('milano')) && 
            (normalizedCountry.includes('italy') || countryLower.includes('italy') || stateLower.includes('italy') ||
             stateLower.includes('lombardy') || stateLower.includes('lombardia'))) {
          return { city: 'Milan', state: '', country: 'Italy' };
        }

        // Default: return original but with consistent casing
        return { 
          city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(), 
          state: state.charAt(0).toUpperCase() + state.slice(1).toLowerCase(), 
          country: country.charAt(0).toUpperCase() + country.slice(1).toLowerCase() 
        };
      };

      // Get all users with their locations
      const usersWithLocations = await db
        .select({
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          userType: users.userType,
          location: users.location
        })
        .from(users)
        .where(and(
          isNotNull(users.hometownCity),
          ne(users.hometownCity, '')
        ));

      // Get ALL travel plans for growing forever stats (past, present, future)
      const allTravelPlans = await db
        .select({
          destination: travelPlans.destination,
          userId: travelPlans.userId,
          startDate: travelPlans.startDate,
          endDate: travelPlans.endDate
        })
        .from(travelPlans);

      // Get events count by city (ALL events ever created by authentic users - growing forever)
      const eventsByCity = await db
        .select({
          city: events.city,
          state: events.state,
          count: count()
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(
          // Only filter out AI-generated events, but include ALL events (past, present, future)
          eq(users.isAIGenerated, false)
        )
        .groupBy(events.city, events.state);

      // Group users by city and calculate statistics
      const cityStatsObj: Record<string, any> = {};

      // Process hometown users (locals)
      usersWithLocations.forEach(user => {
        if (user.hometownCity) {
          const metro = getMetropolitanArea(
            user.hometownCity, 
            user.hometownState || '', 
            user.hometownCountry || ''
          );
          
          const cityKey = `${metro.city}, ${metro.state}, ${metro.country}`.replace(/, ,/g, ',').replace(/,$/, '');
          
          if (!cityStatsObj[cityKey]) {
            cityStatsObj[cityKey] = {
              city: metro.city,
              state: metro.state,
              country: metro.country,
              localCount: 0,
              travelerCount: 0,
              businessCount: 0,
              eventCount: 0
            };
          }

          if (user.userType === 'business') {
            cityStatsObj[cityKey].businessCount++;
          } else if (user.userType === 'local') {
            // Only count users as locals in their actual hometown
            cityStatsObj[cityKey].localCount++;
          }
          // Only hometown locals count as locals, not traveling users
        }
      });

      // Process active travelers - deduplicate users per city
      const travelersByCity: Record<string, Set<number>> = {};
      
      allTravelPlans.forEach(plan => {
        if (plan.destination) {
          // Parse destination format like "Los Angeles, California, United States"
          const parts = plan.destination.split(', ');
          const city = parts[0];
          const state = parts[1] || '';
          const country = parts[2] || '';
          
          const metro = getMetropolitanArea(city, state, country);
          const cityKey = `${metro.city}, ${metro.state}, ${metro.country}`.replace(/, ,/g, ',').replace(/,$/, '');
          
          if (!cityStatsObj[cityKey]) {
            cityStatsObj[cityKey] = {
              city: metro.city,
              state: metro.state,
              country: metro.country,
              localCount: 0,
              travelerCount: 0,
              businessCount: 0,
              eventCount: 0
            };
          }

          // Use Set to deduplicate users per city
          if (!travelersByCity[cityKey]) {
            travelersByCity[cityKey] = new Set();
          }
          travelersByCity[cityKey].add(plan.userId);
        }
      });

      // Set deduplicated traveler counts
      Object.entries(travelersByCity).forEach(([cityKey, userIds]) => {
        if (cityStatsObj[cityKey]) {
          cityStatsObj[cityKey].travelerCount = userIds.size;
        }
      });

      // Add event counts
      eventsByCity.forEach(eventData => {
        const cityKey = `${eventData.city}, ${eventData.state || ''}`.replace(/, ,/g, ',').replace(/,$/, '');
        
        // Try to match with existing city stats (which include country)
        Object.keys(cityStatsObj).forEach(key => {
          if (key.startsWith(cityKey)) {
            cityStatsObj[key].eventCount = Number(eventData.count) || 0;
          }
        });
      });

      // FINAL CONSOLIDATION PASS - merge any remaining duplicates
      const finalStats: Record<string, any> = {};
      
      Object.entries(cityStatsObj).forEach(([key, stats]) => {
        // Apply metropolitan area mapping one more time to ensure consistency
        const metro = getMetropolitanArea(stats.city, stats.state, stats.country);
        const finalKey = `${metro.city}, ${metro.state}, ${metro.country}`.replace(/, ,/g, ',').replace(/,$/, '');
        
        if (!finalStats[finalKey]) {
          finalStats[finalKey] = {
            city: metro.city,
            state: metro.state,
            country: metro.country,
            localCount: 0,
            travelerCount: 0,
            businessCount: 0,
            eventCount: 0
          };
        }
        
        // Merge counts from duplicate entries
        finalStats[finalKey].localCount += stats.localCount;
        finalStats[finalKey].travelerCount += stats.travelerCount;
        finalStats[finalKey].businessCount += stats.businessCount;
        finalStats[finalKey].eventCount += stats.eventCount;
      });

      // Convert to array and filter out cities with no activity
      const cityStats = Object.values(finalStats)
        .filter(stats => stats.localCount > 0 || stats.travelerCount > 0 || stats.businessCount > 0 || stats.eventCount > 0)
        .sort((a, b) => {
          const totalA = a.localCount + a.travelerCount + a.businessCount;
          const totalB = b.localCount + b.travelerCount + b.businessCount;
          return totalB - totalA; // Sort by total activity descending
        });

      return cityStats;
    } catch (error) {
      console.error('Error getting city statistics:', error);
      return [];
    }
  }

  // Geolocation and proximity methods implementation

  async enableLocationSharing(userId: number): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ locationSharingEnabled: true })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error enabling location sharing:', error);
      return undefined;
    }
  }

  async disableLocationSharing(userId: number): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          locationSharingEnabled: false,
          currentLatitude: null,
          currentLongitude: null,
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error disabling location sharing:', error);
      return undefined;
    }
  }

  async findNearbyUsers(userId: number, latitude: number, longitude: number, radiusKm: number): Promise<User[]> {
    try {
      // Calculate approximate lat/lng bounds for the radius
      const latRange = radiusKm / 111; // 1 degree ≈ 111 km
      const lngRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const nearbyUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.locationSharingEnabled, true),
            gte(users.currentLatitude, latitude - latRange),
            gte(users.currentLongitude, longitude - lngRange)
          )
        );

      // Filter by exact distance using Haversine formula
      const filteredUsers = nearbyUsers.filter(user => {
        if (!user.currentLatitude || !user.currentLongitude || user.id === userId) {
          return false;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          user.currentLatitude,
          user.currentLongitude
        );

        return distance <= radiusKm;
      });

      return filteredUsers;
    } catch (error) {
      console.error('Error finding nearby users:', error);
      return [];
    }
  }

  async createProximityNotification(notification: InsertProximityNotification): Promise<ProximityNotification> {
    try {
      const [newNotification] = await db
        .insert(proximityNotifications)
        .values(notification)
        .returning();
      
      return newNotification;
    } catch (error) {
      console.error('Error creating proximity notification:', error);
      throw error;
    }
  }

  async getUserProximityNotifications(userId: number): Promise<ProximityNotification[]> {
    try {
      const notifications = await db
        .select()
        .from(proximityNotifications)
        .where(eq(proximityNotifications.userId, userId))
        .orderBy(desc(proximityNotifications.createdAt))
        .limit(20);
      
      return notifications;
    } catch (error) {
      console.error('Error fetching proximity notifications:', error);
      return [];
    }
  }

  async getUserProximityNotificationsWithUserData(userId: number): Promise<any[]> {
    try {
      const notifications = await db
        .select({
          id: proximityNotifications.id,
          distance: proximityNotifications.distance,
          createdAt: proximityNotifications.createdAt,
          nearbyUserId: proximityNotifications.nearbyUserId,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          bio: users.bio,
          location: users.location,
          userType: users.userType
        })
        .from(proximityNotifications)
        .leftJoin(users, eq(proximityNotifications.nearbyUserId, users.id))
        .where(eq(proximityNotifications.userId, userId))
        .orderBy(desc(proximityNotifications.createdAt))
        .limit(20);
      
      return notifications.map(notification => ({
        id: notification.id,
        distance: notification.distance,
        timestamp: notification.createdAt,
        nearbyUser: {
          id: notification.nearbyUserId,
          username: notification.username || 'Unknown User',
          name: notification.name || 'Unknown User',
          profileImage: notification.profileImage,
          bio: notification.bio,
          location: notification.location,
          userType: notification.userType
        }
      }));
    } catch (error) {
      console.error('Error fetching proximity notifications with user data:', error);
      return [];
    }
  }

  // Helper method to calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async createBusinessReferral(referral: any): Promise<any> {
    const [result] = await db.insert(businessReferrals).values(referral).returning();
    return result;
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, userId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Referral system methods
  async createReferral(referralData: {
    referrerId: number;
    referralCode: string;
    referredEmail?: string;
    referredName?: string;
    referralSource?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const [referral] = await db.insert(referrals).values(referralData).returning();
      return referral;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  async getUserReferrals(userId: number): Promise<any[]> {
    try {
      const userReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .orderBy(desc(referrals.createdAt));
      return userReferrals;
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return [];
    }
  }

  async getReferralByCode(code: string): Promise<any | null> {
    try {
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, code));
      return referral || null;
    } catch (error) {
      console.error('Error getting referral by code:', error);
      return null;
    }
  }

  async updateReferralStatus(referralId: number, updates: {
    status?: string;
    referredUserId?: number;
    completedAt?: Date;
    rewardEarned?: boolean;
    rewardType?: string;
  }): Promise<boolean> {
    try {
      const result = await db
        .update(referrals)
        .set(updates)
        .where(eq(referrals.id, referralId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating referral status:', error);
      return false;
    }
  }

  // Business Referral methods
  async getUserBusinessReferrals(userId: number): Promise<any[]> {
    try {
      const userBusinessReferrals = await db
        .select({
          id: businessReferrals.id,
          businessName: businessReferrals.businessName,
          businessEmail: businessReferrals.businessEmail,
          status: businessReferrals.status,
          potentialReward: businessReferrals.potentialReward,
          rewardPaid: businessReferrals.rewardPaid,
          rewardPaidAt: businessReferrals.rewardPaidAt,
          createdAt: businessReferrals.createdAt
        })
        .from(businessReferrals)
        .where(eq(businessReferrals.referrerId, userId))
        .orderBy(desc(businessReferrals.createdAt));
      
      return userBusinessReferrals;
    } catch (error) {
      console.error('Error getting user business referrals:', error);
      return [];
    }
  }

  // Business Location methods
  async createBusinessLocation(location: InsertBusinessLocation): Promise<BusinessLocation> {
    try {
      const [newLocation] = await db
        .insert(businessLocations)
        .values(location)
        .returning();
      return newLocation;
    } catch (error) {
      console.error('Error creating business location:', error);
      throw error;
    }
  }

  async getBusinessLocation(id: number): Promise<BusinessLocation | undefined> {
    try {
      const [location] = await db
        .select()
        .from(businessLocations)
        .where(eq(businessLocations.id, id));
      return location;
    } catch (error) {
      console.error('Error getting business location:', error);
      return undefined;
    }
  }

  async getBusinessLocations(businessId: number): Promise<BusinessLocation[]> {
    try {
      const locations = await db
        .select()
        .from(businessLocations)
        .where(eq(businessLocations.businessId, businessId))
        .orderBy(desc(businessLocations.isPrimary), businessLocations.locationName);
      return locations;
    } catch (error) {
      console.error('Error getting business locations:', error);
      return [];
    }
  }

  async updateBusinessLocation(id: number, updates: Partial<BusinessLocation>): Promise<BusinessLocation | undefined> {
    try {
      const [updatedLocation] = await db
        .update(businessLocations)
        .set(updates)
        .where(eq(businessLocations.id, id))
        .returning();
      return updatedLocation;
    } catch (error) {
      console.error('Error updating business location:', error);
      return undefined;
    }
  }

  async deleteBusinessLocation(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(businessLocations)
        .where(eq(businessLocations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting business location:', error);
      return false;
    }
  }

  async setPrimaryBusinessLocation(businessId: number, locationId: number): Promise<boolean> {
    try {
      // First, unset all primary flags for this business
      await db
        .update(businessLocations)
        .set({ isPrimary: false })
        .where(eq(businessLocations.businessId, businessId));

      // Then set the specified location as primary
      const result = await db
        .update(businessLocations)
        .set({ isPrimary: true })
        .where(and(
          eq(businessLocations.businessId, businessId),
          eq(businessLocations.id, locationId)
        ));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error setting primary business location:', error);
      return false;
    }
  }

  async getBusinessPrimaryLocation(businessId: number): Promise<BusinessLocation | undefined> {
    try {
      const [primaryLocation] = await db
        .select()
        .from(businessLocations)
        .where(and(
          eq(businessLocations.businessId, businessId),
          eq(businessLocations.isPrimary, true)
        ));
      
      // If no primary location set, return the first location
      if (!primaryLocation) {
        const [firstLocation] = await db
          .select()
          .from(businessLocations)
          .where(eq(businessLocations.businessId, businessId))
          .orderBy(businessLocations.createdAt);
        return firstLocation;
      }

      return primaryLocation;
    } catch (error) {
      console.error('Error getting primary business location:', error);
      return undefined;
    }
  }

  // Business location discovery methods
  async getBusinessesByLocation(city: string, state: string, country: string, category?: string): Promise<any[]> {
    try {
      // Create subqueries to find businesses with active events or deals
      const businessesWithEventsSubquery = db.select({
        businessId: events.organizerId
      })
      .from(events)
      .where(
        and(
          eq(events.isActive, true),
          gte(events.date, new Date()) // Future or current events only
        )
      );

      const businessesWithQuickDealsSubquery = db.select({
        businessId: quickDeals.businessId
      })
      .from(quickDeals)
      .where(
        and(
          eq(quickDeals.isActive, true),
          gte(quickDeals.validUntil, new Date()) // Active deals that haven't expired
        )
      );

      const businessesWithOffersSubquery = db.select({
        businessId: businessOffers.businessId
      })
      .from(businessOffers)
      .where(
        and(
          eq(businessOffers.isActive, true),
          gte(businessOffers.validUntil, new Date()) // Active offers that haven't expired
        )
      );

      // Apply location filters
      const filters = [];
      if (city) {
        filters.push(ilike(users.city, `%${city}%`));
      }
      if (state) {
        filters.push(ilike(users.state, `%${state}%`));
      }
      if (country) {
        filters.push(ilike(users.country, `%${country}%`));
      }

      let query = db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          bio: users.bio,
          businessDescription: users.businessDescription,
          services: users.services,
          specialOffers: users.specialOffers,
          targetCustomers: users.targetCustomers,
          profileImage: users.profileImage,
          city: users.city,
          state: users.state,
          country: users.country,
          streetAddress: users.streetAddress,
          phoneNumber: users.phoneNumber,
          website: users.website,
          businessType: users.businessType,
          specialty: users.specialty,
          priceRange: users.priceRange,
          tags: users.tags,
          isAiGenerated: users.isAIGenerated
        })
        .from(users)
        .where(and(
          eq(users.userType, 'business'),
          eq(users.isActive, true),
          // ONLY include businesses that have active events or deals
          or(
            inArray(users.id, businessesWithEventsSubquery),
            inArray(users.id, businessesWithQuickDealsSubquery),
            inArray(users.id, businessesWithOffersSubquery)
          ),
          ...(filters.length > 0 ? filters : [])
        ));

      const businesses = await query;

      // Filter by category if specified
      if (category) {
        return businesses.filter(business => 
          business.businessType?.toLowerCase().includes(category.toLowerCase()) ||
          business.specialty?.toLowerCase().includes(category.toLowerCase()) ||
          business.tags?.some((tag: string) => tag.toLowerCase().includes(category.toLowerCase()))
        );
      }

      return businesses;
    } catch (error) {
      console.error('Error getting businesses by location:', error);
      return [];
    }
  }

  // NEW: Get businesses with geolocation that have active deals/events for map display
  async getBusinessesWithGeolocation(city?: string, state?: string, country?: string, radiusKm?: number, centerLat?: number, centerLng?: number): Promise<any[]> {
    try {
      // Create subqueries to find businesses with active events or deals
      const businessesWithEventsSubquery = db.select({
        businessId: events.organizerId
      })
      .from(events)
      .where(
        and(
          eq(events.isActive, true),
          gte(events.date, new Date()) // Future or current events only
        )
      );

      const businessesWithQuickDealsSubquery = db.select({
        businessId: quickDeals.businessId
      })
      .from(quickDeals)
      .where(
        and(
          eq(quickDeals.isActive, true),
          gte(quickDeals.validUntil, new Date()) // Active deals that haven't expired
        )
      );

      const businessesWithOffersSubquery = db.select({
        businessId: businessOffers.businessId
      })
      .from(businessOffers)
      .where(
        and(
          eq(businessOffers.isActive, true),
          gte(businessOffers.validUntil, new Date()) // Active offers that haven't expired
        )
      );

      // Apply location filters
      const filters = [];
      if (city) {
        filters.push(ilike(users.city, `%${city}%`));
      }
      if (state) {
        filters.push(ilike(users.state, `%${state}%`));
      }
      if (country) {
        filters.push(ilike(users.country, `%${country}%`));
      }

      let query = db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          bio: users.bio,
          businessDescription: users.businessDescription,
          services: users.services,
          specialOffers: users.specialOffers,
          targetCustomers: users.targetCustomers,
          profileImage: users.profileImage,
          city: users.city,
          state: users.state,
          country: users.country,
          streetAddress: users.streetAddress,
          phoneNumber: users.phoneNumber,
          website: users.website,
          businessType: users.businessType,
          specialty: users.specialty,
          priceRange: users.priceRange,
          tags: users.tags,
          isAiGenerated: users.isAIGenerated,
          // CRITICAL: Include geolocation coordinates
          currentLatitude: users.currentLatitude,
          currentLongitude: users.currentLongitude,
          lastLocationUpdate: users.lastLocationUpdate
        })
        .from(users)
        .where(and(
          eq(users.userType, 'business'),
          eq(users.isActive, true),
          // MUST have geolocation coordinates
          isNotNull(users.currentLatitude),
          isNotNull(users.currentLongitude),
          // ONLY include businesses that have active events or deals
          or(
            inArray(users.id, businessesWithEventsSubquery),
            inArray(users.id, businessesWithQuickDealsSubquery),
            inArray(users.id, businessesWithOffersSubquery)
          ),
          ...(filters.length > 0 ? filters : [])
        ));

      let businesses = await query;

      // Apply radius filter if coordinates provided
      if (radiusKm && centerLat && centerLng) {
        businesses = businesses.filter(business => {
          if (!business.currentLatitude || !business.currentLongitude) return false;
          
          const distance = this.calculateHaversineDistance(
            centerLat,
            centerLng,
            business.currentLatitude,
            business.currentLongitude
          );
          
          return distance <= radiusKm;
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗺️ GEOLOCATION BUSINESSES: Found ${businesses.length} businesses with GPS coordinates and active deals/events`);
      }

      return businesses;
    } catch (error) {
      console.error('Error getting businesses with geolocation:', error);
      return [];
    }
  }

  // Helper method for distance calculation (duplicate removed)

  async createAIBusiness(businessData: any): Promise<any> {
    try {
      const [newBusiness] = await db
        .insert(users)
        .values({
          ...businessData,
          userType: 'business',
          isAiGenerated: true,
          isActive: true,
          createdAt: new Date()
        })
        .returning();
      return newBusiness;
    } catch (error) {
      console.error('Error creating AI business:', error);
      throw error;
    }
  }

  // Business Interest Notification methods
  async createBusinessInterestNotification(notification: InsertBusinessInterestNotification): Promise<BusinessInterestNotification> {
    try {
      const [newNotification] = await db
        .insert(businessInterestNotifications)
        .values(notification)
        .returning();
      return newNotification;
    } catch (error) {
      console.error('Error creating business interest notification:', error);
      throw error;
    }
  }

  async getBusinessInterestNotifications(businessId: number, unreadOnly: boolean = false): Promise<BusinessInterestNotification[]> {
    try {
      const conditions = [eq(businessInterestNotifications.businessId, businessId)];
      if (unreadOnly) {
        conditions.push(eq(businessInterestNotifications.isRead, false));
      }

      const notifications = await db
        .select()
        .from(businessInterestNotifications)
        .where(and(...conditions))
        .orderBy(desc(businessInterestNotifications.createdAt));

      return notifications;
    } catch (error) {
      console.error('Error getting business interest notifications:', error);
      return [];
    }
  }

  async markBusinessNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      const result = await db
        .update(businessInterestNotifications)
        .set({ isRead: true })
        .where(eq(businessInterestNotifications.id, notificationId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error marking business notification as read:', error);
      return false;
    }
  }

  async markBusinessNotificationAsProcessed(notificationId: number): Promise<boolean> {
    try {
      const result = await db
        .update(businessInterestNotifications)
        .set({ isProcessed: true })
        .where(eq(businessInterestNotifications.id, notificationId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error marking business notification as processed:', error);
      return false;
    }
  }

  // Check for business interest matches when user creates/updates profile or travel plans
  async checkBusinessInterestMatches(userId: number, userInterests: string[], userActivities: string[], userLocation: string, matchType: 'traveler_interest' | 'local_interest' | 'travel_plan', travelDates?: { startDate: Date; endDate: Date }): Promise<void> {
    try {
      // Find businesses in the user's location, but exclude the user themselves if they're a business
      const businesses = await db
        .select()
        .from(users)
        .where(and(
          eq(users.userType, 'business'),
          ne(users.id, userId), // Prevent self-notifications
          or(
            ilike(users.hometownCity, `%${userLocation.split(',')[0].trim()}%`),
            ilike(users.location, `%${userLocation.split(',')[0].trim()}%`)
          )
        ));

      for (const business of businesses) {
        const businessInterests = business.interests || [];
        const businessActivities = business.activities || [];

        // Find matching interests and activities
        const matchedInterests = userInterests.filter(interest => 
          businessInterests.some(bizInterest => 
            bizInterest.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(bizInterest.toLowerCase())
          )
        );

        const matchedActivities = userActivities.filter(activity => 
          businessActivities.some(bizActivity => 
            bizActivity.toLowerCase().includes(activity.toLowerCase()) ||
            activity.toLowerCase().includes(bizActivity.toLowerCase())
          )
        );

        // Create notification if there are matches
        if (matchedInterests.length > 0 || matchedActivities.length > 0) {
          // Check if notification already exists for this user-business pair recently
          const existingNotification = await db
            .select()
            .from(businessInterestNotifications)
            .where(and(
              eq(businessInterestNotifications.businessId, business.id),
              eq(businessInterestNotifications.userId, userId),
              eq(businessInterestNotifications.matchType, matchType),
              sql`${businessInterestNotifications.createdAt} > NOW() - INTERVAL '7 days'`
            ));

          if (existingNotification.length === 0) {
            const priority = matchedInterests.length + matchedActivities.length >= 3 ? 'high' : 
                           matchedInterests.length + matchedActivities.length >= 2 ? 'medium' : 'low';

            await this.createBusinessInterestNotification({
              businessId: business.id,
              userId,
              matchType,
              matchedInterests,
              matchedActivities,
              userLocation,
              priority,
              travelStartDate: travelDates?.startDate,
              travelEndDate: travelDates?.endDate,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking business interest matches:', error);
    }
  }

  // Business customer photos methods
  async createBusinessCustomerPhoto(photo: InsertBusinessCustomerPhoto): Promise<BusinessCustomerPhoto> {
    const [newPhoto] = await db
      .insert(businessCustomerPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async getBusinessCustomerPhotos(businessId: number): Promise<BusinessCustomerPhoto[]> {
    return await db
      .select()
      .from(businessCustomerPhotos)
      .where(and(
        eq(businessCustomerPhotos.businessId, businessId),
        eq(businessCustomerPhotos.isApproved, true)
      ))
      .orderBy(desc(businessCustomerPhotos.uploadedAt));
  }

  async getReferralStats(userId: number): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    rewardsEarned: number;
  }> {
    try {
      const userReferrals = await this.getUserReferrals(userId);
      
      const stats = {
        totalReferrals: userReferrals.length,
        successfulReferrals: userReferrals.filter(r => r.status === 'completed_profile' || r.status === 'first_connection').length,
        pendingReferrals: userReferrals.filter(r => r.status === 'pending' || r.status === 'signed_up').length,
        rewardsEarned: userReferrals.filter(r => r.rewardEarned).length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return { totalReferrals: 0, successfulReferrals: 0, pendingReferrals: 0, rewardsEarned: 0 };
    }
  }

  async generateUniqueReferralCode(userId: number): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      // Generate code using username prefix + random string
      const user = await this.getUser(userId);
      const username = user?.username || 'user';
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `${username.substring(0, 4).toUpperCase()}${randomSuffix}`;
      
      // Check if code already exists
      const existing = await this.getReferralByCode(code);
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    return code || `REF${Date.now()}`;
  }

  async getDuplicateReferralStats(): Promise<any> {
    try {
      const [totalReferrals] = await db
        .select({ count: count() })
        .from(referrals);

      const [pendingReferrals] = await db
        .select({ count: count() })
        .from(referrals)
        .where(eq(referrals.status, 'pending'));

      const [completedReferrals] = await db
        .select({ count: count() })
        .from(referrals)
        .where(ne(referrals.status, 'pending'));

      const [totalRewards] = await db
        .select({ count: count() })
        .from(referrals)
        .where(eq(referrals.rewardEarned, true));

      const conversionRate = totalReferrals.count > 0 
        ? (completedReferrals.count / totalReferrals.count) * 100 
        : 0;

      const topReferrers = await db
        .select({
          userId: referrals.referrerId,
          referralCount: count(referrals.id),
          rewardsEarned: sql`count(case when ${referrals.rewardEarned} = true then 1 end)`
        })
        .from(referrals)
        .leftJoin(users, eq(users.id, referrals.referrerId))
        .groupBy(referrals.referrerId, users.username)
        .orderBy(desc(count(referrals.id)))
        .limit(10);

      const topReferrersWithNames = await Promise.all(
        topReferrers.map(async (referrer) => {
          const user = await this.getUser(referrer.userId);
          return {
            ...referrer,
            username: user?.username || 'Unknown'
          };
        })
      );

      return {
        totalReferrals: totalReferrals.count,
        pendingReferrals: pendingReferrals.count,
        completedReferrals: completedReferrals.count,
        totalRewards: totalRewards.count,
        conversionRate,
        topReferrers: topReferrersWithNames
      };
    } catch (error) {
      console.error('Error getting duplicate referral stats:', error);
      return {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        totalRewards: 0,
        conversionRate: 0,
        topReferrers: []
      };
    }
  }

  async getAllReferralsForAdmin(): Promise<any[]> {
    try {
      const allReferrals = await db
        .select({
          id: referrals.id,
          referrerId: referrals.referrerId,
          referredUserId: referrals.referredUserId,
          referralCode: referrals.referralCode,
          referredEmail: referrals.referredEmail,
          referredName: referrals.referredName,
          status: referrals.status,
          referralSource: referrals.referralSource,
          completedAt: referrals.completedAt,
          rewardEarned: referrals.rewardEarned,
          rewardType: referrals.rewardType,
          notes: referrals.notes,
          createdAt: referrals.createdAt,
          referrerUsername: users.username
        })
        .from(referrals)
        .leftJoin(users, eq(users.id, referrals.referrerId))
        .orderBy(desc(referrals.createdAt));

      // Add referred usernames where applicable
      const referralsWithNames = await Promise.all(
        allReferrals.map(async (referral) => {
          let referredUsername = null;
          if (referral.referredUserId) {
            const referredUser = await this.getUser(referral.referredUserId);
            referredUsername = referredUser?.username || null;
          }
          return {
            ...referral,
            referredUsername
          };
        })
      );

      return referralsWithNames;
    } catch (error) {
      console.error('Error getting all referrals for admin:', error);
      return [];
    }
  }

  async getUserReferralCode(userId: number): Promise<string | null> {
    try {
      const [userReferral] = await db
        .select({ referralCode: referrals.referralCode })
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .limit(1);

      return userReferral?.referralCode || null;
    } catch (error) {
      console.error('Error getting user referral code:', error);
      return null;
    }
  }

  async getUserReferralStats(userId: number): Promise<any> {
    try {
      const [totalReferrals] = await db
        .select({ count: count() })
        .from(referrals)
        .where(eq(referrals.referrerId, userId));

      const [successfulReferrals] = await db
        .select({ count: count() })
        .from(referrals)
        .where(and(
          eq(referrals.referrerId, userId),
          ne(referrals.status, 'pending')
        ));

      const [pendingReferrals] = await db
        .select({ count: count() })
        .from(referrals)
        .where(and(
          eq(referrals.referrerId, userId),
          eq(referrals.status, 'pending')
        ));

      const [rewardsEarned] = await db
        .select({ count: count() })
        .from(referrals)
        .where(and(
          eq(referrals.referrerId, userId),
          eq(referrals.rewardEarned, true)
        ));

      return {
        totalReferrals: totalReferrals.count,
        successfulReferrals: successfulReferrals.count,
        pendingReferrals: pendingReferrals.count,
        rewardsEarned: rewardsEarned.count
      };
    } catch (error) {
      console.error('Error getting user referral stats:', error);
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        rewardsEarned: 0
      };
    }
  }


  // Custom Location Activities Methods
  async createCustomLocationActivity(activity: any): Promise<any> {
    try {
      const [newActivity] = await db
        .insert(customLocationActivities)
        .values(activity)
        .returning();
      
      return newActivity;
    } catch (error) {
      console.error('Error creating custom location activity:', error);
      throw error;
    }
  }

  async getCustomLocationActivities(city: string, state: string, country: string): Promise<any[]> {
    try {
      const activities = await db
        .select({
          id: customLocationActivities.id,
          title: customLocationActivities.title,
          description: customLocationActivities.description,
          category: customLocationActivities.category,
          city: customLocationActivities.city,
          state: customLocationActivities.state,
          country: customLocationActivities.country,
          upvotes: customLocationActivities.upvotes,
          downvotes: customLocationActivities.downvotes,
          tags: customLocationActivities.tags,
          createdAt: customLocationActivities.createdAt,
          username: users.username,
          name: users.name
        })
        .from(customLocationActivities)
        .leftJoin(users, eq(customLocationActivities.userId, users.id))
        .where(
          and(
            ilike(customLocationActivities.city, `%${city}%`),
            state ? ilike(customLocationActivities.state, `%${state}%`) : undefined,
            ilike(customLocationActivities.country, `%${country}%`)
          )
        )
        .orderBy(desc(customLocationActivities.upvotes));
      
      return activities;
    } catch (error) {
      console.error('Error getting custom location activities:', error);
      return [];
    }
  }

  async searchCustomLocationActivities(query: string, city?: string, category?: string): Promise<any[]> {
    try {
      const conditions = [
        or(
          ilike(customLocationActivities.title, `%${query}%`),
          ilike(customLocationActivities.description, `%${query}%`)
        )
      ];

      if (city) {
        conditions.push(ilike(customLocationActivities.city, `%${city}%`));
      }

      if (category) {
        conditions.push(eq(customLocationActivities.category, category));
      }

      const activities = await db
        .select({
          id: customLocationActivities.id,
          title: customLocationActivities.title,
          description: customLocationActivities.description,
          category: customLocationActivities.category,
          city: customLocationActivities.city,
          state: customLocationActivities.state,
          country: customLocationActivities.country,
          upvotes: customLocationActivities.upvotes,
          downvotes: customLocationActivities.downvotes,
          tags: customLocationActivities.tags,
          createdAt: customLocationActivities.createdAt,
          username: users.username,
          name: users.name
        })
        .from(customLocationActivities)
        .leftJoin(users, eq(customLocationActivities.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(customLocationActivities.upvotes))
        .limit(50);
      
      return activities;
    } catch (error) {
      console.error('Error searching custom location activities:', error);
      return [];
    }
  }

  async addUserCustomActivity(userId: number, customActivityId: number): Promise<any> {
    try {
      const [newSelection] = await db
        .insert(userCustomActivities)
        .values({
          userId,
          customActivityId
        })
        .returning();
      
      return newSelection;
    } catch (error) {
      console.error('Error adding user custom activity:', error);
      throw error;
    }
  }

  async removeUserCustomActivity(userId: number, customActivityId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userCustomActivities)
        .where(
          and(
            eq(userCustomActivities.userId, userId),
            eq(userCustomActivities.customActivityId, customActivityId)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error removing user custom activity:', error);
      return false;
    }
  }

  async getUserCustomActivities(userId: number): Promise<any[]> {
    try {
      const activities = await db
        .select({
          id: customLocationActivities.id,
          title: customLocationActivities.title,
          description: customLocationActivities.description,
          category: customLocationActivities.category,
          city: customLocationActivities.city,
          state: customLocationActivities.state,
          country: customLocationActivities.country,
          upvotes: customLocationActivities.upvotes,
          downvotes: customLocationActivities.downvotes,
          tags: customLocationActivities.tags,
          addedAt: userCustomActivities.addedAt
        })
        .from(userCustomActivities)
        .leftJoin(customLocationActivities, eq(userCustomActivities.customActivityId, customLocationActivities.id))
        .where(eq(userCustomActivities.userId, userId))
        .orderBy(desc(userCustomActivities.addedAt));
      
      return activities;
    } catch (error) {
      console.error('Error getting user custom activities:', error);
      return [];
    }
  }

  async voteOnCustomActivity(activityId: number, userId: number, isUpvote: boolean): Promise<any> {
    try {
      // For now, just update the vote count directly
      // In a full implementation, you'd track individual votes to prevent duplicate voting
      const [activity] = await db.select().from(customLocationActivities).where(eq(customLocationActivities.id, activityId));
      if (!activity) return null;
      
      const upvotes = isUpvote ? (activity.upvotes || 0) + 1 : activity.upvotes || 0;
      const downvotes = !isUpvote ? (activity.downvotes || 0) + 1 : activity.downvotes || 0;
      
      const [updatedActivity] = await db
        .update(customLocationActivities)
        .set({ upvotes, downvotes })
        .where(eq(customLocationActivities.id, activityId))
        .returning();
      
      return updatedActivity;
    } catch (error) {
      console.error('Error voting on custom activity:', error);
      throw error;
    }
  }

  // Trip Itinerary Methods
  async createItinerary(itinerary: InsertTripItinerary): Promise<TripItinerary> {
    try {
      const [newItinerary] = await db
        .insert(tripItineraries)
        .values(itinerary)
        .returning();
      return newItinerary;
    } catch (error) {
      console.error('Error creating itinerary:', error);
      throw error;
    }
  }

  async getItinerariesByTravelPlan(travelPlanId: number): Promise<TripItinerary[]> {
    try {
      const itineraries = await db
        .select()
        .from(tripItineraries)
        .where(eq(tripItineraries.travelPlanId, travelPlanId))
        .orderBy(desc(tripItineraries.createdAt));
      return itineraries;
    } catch (error) {
      console.error('Error fetching itineraries by travel plan:', error);
      return [];
    }
  }

  async getItineraryWithItems(itineraryId: number): Promise<any> {
    try {
      const [itinerary] = await db
        .select()
        .from(tripItineraries)
        .where(eq(tripItineraries.id, itineraryId));

      if (!itinerary) return null;

      const items = await db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.itineraryId, itineraryId))
        .orderBy(asc(itineraryItems.date), asc(itineraryItems.orderIndex));

      return {
        ...itinerary,
        items
      };
    } catch (error) {
      console.error('Error fetching itinerary with items:', error);
      return null;
    }
  }

  async updateItinerary(id: number, updates: Partial<TripItinerary>): Promise<TripItinerary | undefined> {
    try {
      const [updatedItinerary] = await db
        .update(tripItineraries)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tripItineraries.id, id))
        .returning();
      return updatedItinerary;
    } catch (error) {
      console.error('Error updating itinerary:', error);
      return undefined;
    }
  }

  async deleteItinerary(id: number): Promise<boolean> {
    try {
      // Delete all items first
      await db.delete(itineraryItems).where(eq(itineraryItems.itineraryId, id));
      
      // Delete shared references
      await db.delete(sharedItineraries).where(eq(sharedItineraries.itineraryId, id));
      
      // Delete the itinerary
      const result = await db.delete(tripItineraries).where(eq(tripItineraries.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      return false;
    }
  }

  // Itinerary Item Methods
  async createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem> {
    try {
      console.log('Creating itinerary item with data:', item);
      // Ensure date is properly converted to Date object and not null
      const processedItem = {
        ...item,
        date: item.date ? (typeof item.date === 'string' ? new Date(item.date) : item.date) : new Date()
      };
      console.log('Processed item for database:', processedItem);
      
      const [newItem] = await db
        .insert(itineraryItems)
        .values(processedItem)
        .returning();
      console.log('Created item in database:', newItem);
      return newItem;
    } catch (error) {
      console.error('Error creating itinerary item:', error);
      throw error;
    }
  }

  async getItineraryItems(itineraryId: number): Promise<ItineraryItem[]> {
    try {
      const items = await db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.itineraryId, itineraryId))
        .orderBy(asc(itineraryItems.date), asc(itineraryItems.orderIndex));
      return items;
    } catch (error) {
      console.error('Error fetching itinerary items:', error);
      return [];
    }
  }

  async updateItineraryItem(id: number, updates: Partial<ItineraryItem>): Promise<ItineraryItem | undefined> {
    try {
      // Ensure date is properly converted to Date object if present
      const processedUpdates = {
        ...updates,
        ...(updates.date && { date: typeof updates.date === 'string' ? new Date(updates.date) : updates.date })
      };
      
      const [updatedItem] = await db
        .update(itineraryItems)
        .set(processedUpdates)
        .where(eq(itineraryItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error('Error updating itinerary item:', error);
      return undefined;
    }
  }

  async deleteItineraryItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
      return false;
    }
  }

  // Sharing Methods
  async shareItinerary(share: InsertSharedItinerary): Promise<SharedItinerary> {
    try {
      const [newShare] = await db
        .insert(sharedItineraries)
        .values(share)
        .returning();
      return newShare;
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      throw error;
    }
  }

  async getSharedItinerary(shareToken: string): Promise<any> {
    try {
      const [sharedItinerary] = await db
        .select({
          id: sharedItineraries.id,
          itineraryId: sharedItineraries.itineraryId,
          shareType: sharedItineraries.shareType,
          canEdit: sharedItineraries.canEdit,
          canCopy: sharedItineraries.canCopy,
          expiresAt: sharedItineraries.expiresAt,
          itinerary: tripItineraries
        })
        .from(sharedItineraries)
        .leftJoin(tripItineraries, eq(sharedItineraries.itineraryId, tripItineraries.id))
        .where(eq(sharedItineraries.shareToken, shareToken));

      if (!sharedItinerary) return null;

      // Check if expired
      if (sharedItinerary.expiresAt && new Date() > sharedItinerary.expiresAt) {
        return null;
      }

      // Get items for the itinerary
      const items = await this.getItineraryItems(sharedItinerary.itineraryId);

      return {
        ...sharedItinerary,
        itinerary: {
          ...sharedItinerary.itinerary,
          items
        }
      };
    } catch (error) {
      console.error('Error fetching shared itinerary:', error);
      return null;
    }
  }

  async getUserSharedItineraries(userId: number): Promise<SharedItinerary[]> {
    try {
      const shared = await db
        .select()
        .from(sharedItineraries)
        .where(
          or(
            eq(sharedItineraries.sharedByUserId, userId),
            eq(sharedItineraries.sharedWithUserId, userId)
          )
        )
        .orderBy(desc(sharedItineraries.createdAt));
      return shared;
    } catch (error) {
      console.error('Error fetching user shared itineraries:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Landmark methods implementation
  async createLandmark(landmark: InsertCityLandmark): Promise<CityLandmark> {
    try {
      const [newLandmark] = await db
        .insert(cityLandmarks)
        .values(landmark)
        .returning();
      return newLandmark;
    } catch (error) {
      console.error('Error creating landmark:', error);
      throw error;
    }
  }

  async getCityLandmarks(city: string, state?: string, country?: string): Promise<CityLandmark[]> {
    try {
      let query = db.select().from(cityLandmarks).where(
        and(
          ilike(cityLandmarks.city, `%${city}%`),
          eq(cityLandmarks.isActive, true)
        )
      );

      if (state) {
        query = query.where(ilike(cityLandmarks.state, `%${state}%`));
      }

      if (country) {
        query = query.where(ilike(cityLandmarks.country, `%${country}%`));
      }

      const landmarks = await query.orderBy(desc(cityLandmarks.rating));
      return landmarks;
    } catch (error) {
      console.error('Error getting city landmarks:', error);
      return [];
    }
  }

  async getLandmark(id: number): Promise<CityLandmark | undefined> {
    try {
      const [landmark] = await db.select().from(cityLandmarks).where(eq(cityLandmarks.id, id));
      return landmark;
    } catch (error) {
      console.error('Error getting landmark:', error);
      return undefined;
    }
  }

  async updateLandmark(id: number, updates: Partial<CityLandmark>): Promise<CityLandmark | undefined> {
    try {
      const [updatedLandmark] = await db
        .update(cityLandmarks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(cityLandmarks.id, id))
        .returning();
      return updatedLandmark;
    } catch (error) {
      console.error('Error updating landmark:', error);
      return undefined;
    }
  }

  async deleteLandmark(id: number): Promise<boolean> {
    try {
      // Soft delete by setting isActive to false
      const [deletedLandmark] = await db
        .update(cityLandmarks)
        .set({ isActive: false })
        .where(eq(cityLandmarks.id, id))
        .returning();
      return !!deletedLandmark;
    } catch (error) {
      console.error('Error deleting landmark:', error);
      return false;
    }
  }

  async rateLandmark(landmarkId: number, userId: number, rating: number, review?: string): Promise<LandmarkRating> {
    try {
      // Create the rating
      const [newRating] = await db
        .insert(landmarkRatings)
        .values({
          landmarkId,
          userId,
          rating,
          review,
          visitDate: new Date(),
        })
        .returning();

      // Update landmark's average rating
      const ratings = await db.select({ rating: landmarkRatings.rating })
        .from(landmarkRatings)
        .where(eq(landmarkRatings.landmarkId, landmarkId));

      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const totalRatings = ratings.length;

      await db
        .update(cityLandmarks)
        .set({ 
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          totalRatings 
        })
        .where(eq(cityLandmarks.id, landmarkId));

      return newRating;
    } catch (error) {
      console.error('Error rating landmark:', error);
      throw error;
    }
  }

  async getLandmarkRatings(landmarkId: number): Promise<LandmarkRating[]> {
    try {
      const ratings = await db.select()
        .from(landmarkRatings)
        .where(eq(landmarkRatings.landmarkId, landmarkId))
        .orderBy(desc(landmarkRatings.createdAt));
      return ratings;
    } catch (error) {
      console.error('Error getting landmark ratings:', error);
      return [];
    }
  }

  async getUserLandmarkRatings(userId: number): Promise<LandmarkRating[]> {
    try {
      const ratings = await db.select()
        .from(landmarkRatings)
        .where(eq(landmarkRatings.userId, userId))
        .orderBy(desc(landmarkRatings.createdAt));
      return ratings;
    } catch (error) {
      console.error('Error getting user landmark ratings:', error);
      return [];
    }
  }

  // Secret Local Experiences methods
  async createSecretLocalExperience(experience: InsertSecretLocalExperience): Promise<SecretLocalExperience> {
    try {
      const [newExperience] = await db.insert(secretLocalExperiences)
        .values(experience)
        .returning();
      return newExperience;
    } catch (error) {
      console.error('Error creating secret local experience:', error);
      throw new Error('Failed to create secret local experience');
    }
  }

  async getSecretLocalExperiences(city: string, state?: string, country?: string): Promise<any[]> {
    try {
      // Use the existing getSecretLocalExperiencesByCity method that properly handles user hometown matching
      return await this.getSecretLocalExperiencesByCity(city, state, country);
    } catch (error) {
      console.error('Error getting secret local experiences:', error);
      return [];
    }
  }

  // Travel Blog Post Methods
  async createTravelBlogPost(postData: InsertTravelBlogPost): Promise<TravelBlogPost> {
    try {
      const [post] = await db
        .insert(travelBlogPosts)
        .values({
          ...postData,
          aura: 1, // Author gets 1 initial point for posting
        })
        .returning();

      // Add 1 aura point to user for creating a post
      await db
        .update(users)
        .set({
          aura: sql`${users.aura} + 1`,
        })
        .where(eq(users.id, postData.userId));

      return post;
    } catch (error) {
      console.error('Error creating travel blog post:', error);
      throw error;
    }
  }

  async getTravelBlogPosts(limit = 20, offset = 0): Promise<TravelBlogPost[]> {
    try {
      const posts = await db
        .select({
          id: travelBlogPosts.id,
          userId: travelBlogPosts.userId,
          title: travelBlogPosts.title,
          content: travelBlogPosts.content,
          location: travelBlogPosts.location,
          city: travelBlogPosts.city,
          state: travelBlogPosts.state,
          country: travelBlogPosts.country,
          imageUrl: travelBlogPosts.imageUrl,
          tags: travelBlogPosts.tags,
          likes: travelBlogPosts.likes,
          views: travelBlogPosts.views,
          aura: travelBlogPosts.aura,
          isPublic: travelBlogPosts.isPublic,
          createdAt: travelBlogPosts.createdAt,
          updatedAt: travelBlogPosts.updatedAt,
          author: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
            aura: users.aura,
          },
        })
        .from(travelBlogPosts)
        .leftJoin(users, eq(travelBlogPosts.userId, users.id))
        .where(eq(travelBlogPosts.isPublic, true))
        .orderBy(desc(travelBlogPosts.createdAt))
        .limit(limit)
        .offset(offset);

      return posts as any[];
    } catch (error) {
      console.error('Error fetching travel blog posts:', error);
      return [];
    }
  }

  async likeTravelBlogPost(postId: number, userId: number): Promise<void> {
    try {
      // Check if user already liked this post
      const [existingLike] = await db
        .select()
        .from(travelBlogLikes)
        .where(and(
          eq(travelBlogLikes.postId, postId),
          eq(travelBlogLikes.userId, userId)
        ));

      if (existingLike) {
        throw new Error('User has already liked this post');
      }

      // Add like
      await db.insert(travelBlogLikes).values({
        postId,
        userId,
      });

      // Update post like count and aura points
      await db
        .update(travelBlogPosts)
        .set({
          likes: sql`${travelBlogPosts.likes} + 1`,
          aura: sql`${travelBlogPosts.aura} + 1`,
        })
        .where(eq(travelBlogPosts.id, postId));

      // Add 1 aura point to post author
      const [post] = await db
        .select({ userId: travelBlogPosts.userId })
        .from(travelBlogPosts)
        .where(eq(travelBlogPosts.id, postId));

      if (post) {
        await db
          .update(users)
          .set({
            aura: sql`${users.aura} + 1`,
          })
          .where(eq(users.id, post.userId));
      }
    } catch (error) {
      console.error('Error liking travel blog post:', error);
      throw error;
    }
  }

  async getUserTravelBlogPosts(userId: number): Promise<TravelBlogPost[]> {
    try {
      const posts = await db
        .select()
        .from(travelBlogPosts)
        .where(eq(travelBlogPosts.userId, userId))
        .orderBy(desc(travelBlogPosts.createdAt));

      return posts;
    } catch (error) {
      console.error('Error fetching user travel blog posts:', error);
      return [];
    }
  }

  async createTravelBlogComment(postId: number, userId: number, content: string, parentCommentId?: number): Promise<any> {
    try {
      const [comment] = await db
        .insert(travelBlogComments)
        .values({
          postId,
          userId,
          content,
          parentCommentId: parentCommentId || null,
          aura: 1,
        })
        .returning();

      // Award 1 aura point to the comment author
      await db
        .update(users)
        .set({
          aura: sql`${users.aura} + 1`,
        })
        .where(eq(users.id, userId));

      return comment;
    } catch (error) {
      console.error('Error creating travel blog comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async getTravelBlogComments(postId: number): Promise<any[]> {
    try {
      const comments = await db
        .select({
          id: travelBlogComments.id,
          content: travelBlogComments.content,
          parentCommentId: travelBlogComments.parentCommentId,
          aura: travelBlogComments.aura,
          createdAt: travelBlogComments.createdAt,
          userId: travelBlogComments.userId,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
        })
        .from(travelBlogComments)
        .leftJoin(users, eq(travelBlogComments.userId, users.id))
        .where(eq(travelBlogComments.postId, postId))
        .orderBy(asc(travelBlogComments.createdAt));

      // Organize comments into a tree structure
      const commentMap = new Map();
      const rootComments: any[] = [];

      // First pass: create comment objects with empty replies array
      comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into tree structure
      comments.forEach(comment => {
        const commentObj = commentMap.get(comment.id);
        if (comment.parentCommentId) {
          const parentComment = commentMap.get(comment.parentCommentId);
          if (parentComment) {
            parentComment.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error fetching travel blog comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  // Reddit-style enhancement methods
  async unlikeTravelBlogPost(postId: number, userId: number): Promise<void> {
    try {
      const deleted = await db
        .delete(travelBlogLikes)
        .where(and(
          eq(travelBlogLikes.postId, postId),
          eq(travelBlogLikes.userId, userId)
        ))
        .returning();

      if (deleted.length > 0) {
        await db
          .update(travelBlogPosts)
          .set({
            likes: sql`${travelBlogPosts.likes} - 1`,
            aura: sql`${travelBlogPosts.aura} - 1`,
          })
          .where(eq(travelBlogPosts.id, postId));

        const [post] = await db
          .select({ userId: travelBlogPosts.userId })
          .from(travelBlogPosts)
          .where(eq(travelBlogPosts.id, postId));

        if (post) {
          await this.updateUserAuraForPost(post.userId, -1);
        }
      }
    } catch (error) {
      console.error('Error unliking travel blog post:', error);
      throw error;
    }
  }

  async isPostLikedByUser(postId: number, userId: number): Promise<boolean> {
    try {
      const [like] = await db
        .select()
        .from(travelBlogLikes)
        .where(and(
          eq(travelBlogLikes.postId, postId),
          eq(travelBlogLikes.userId, userId)
        ));
      
      return !!like;
    } catch (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }
  }

  async likeTravelBlogComment(commentId: number, userId: number): Promise<void> {
    try {
      const [existingLike] = await db
        .select()
        .from(travelBlogCommentLikes)
        .where(and(
          eq(travelBlogCommentLikes.commentId, commentId),
          eq(travelBlogCommentLikes.userId, userId)
        ));

      if (existingLike) {
        return; // Already liked
      }

      await db.insert(travelBlogCommentLikes).values({
        commentId,
        userId,
      });

      await db
        .update(travelBlogComments)
        .set({
          likes: sql`${travelBlogComments.likes} + 1`,
          aura: sql`${travelBlogComments.aura} + 1`,
        })
        .where(eq(travelBlogComments.id, commentId));

      const [comment] = await db
        .select({ userId: travelBlogComments.userId })
        .from(travelBlogComments)
        .where(eq(travelBlogComments.id, commentId));

      if (comment) {
        await this.updateUserAuraForComment(comment.userId, 1);
      }
    } catch (error) {
      console.error('Error liking travel blog comment:', error);
      throw error;
    }
  }

  async unlikeTravelBlogComment(commentId: number, userId: number): Promise<void> {
    try {
      const deleted = await db
        .delete(travelBlogCommentLikes)
        .where(and(
          eq(travelBlogCommentLikes.commentId, commentId),
          eq(travelBlogCommentLikes.userId, userId)
        ))
        .returning();

      if (deleted.length > 0) {
        await db
          .update(travelBlogComments)
          .set({
            likes: sql`${travelBlogComments.likes} - 1`,
            aura: sql`${travelBlogComments.aura} - 1`,
          })
          .where(eq(travelBlogComments.id, commentId));

        const [comment] = await db
          .select({ userId: travelBlogComments.userId })
          .from(travelBlogComments)
          .where(eq(travelBlogComments.id, commentId));

        if (comment) {
          await this.updateUserAuraForComment(comment.userId, -1);
        }
      }
    } catch (error) {
      console.error('Error unliking travel blog comment:', error);
      throw error;
    }
  }

  async isCommentLikedByUser(commentId: number, userId: number): Promise<boolean> {
    try {
      const [like] = await db
        .select()
        .from(travelBlogCommentLikes)
        .where(and(
          eq(travelBlogCommentLikes.commentId, commentId),
          eq(travelBlogCommentLikes.userId, userId)
        ));
      
      return !!like;
    } catch (error) {
      console.error('Error checking if comment is liked:', error);
      return false;
    }
  }

  async deleteTravelBlogPost(postId: number, userId: number): Promise<boolean> {
    try {
      const deleted = await db
        .delete(travelBlogPosts)
        .where(and(
          eq(travelBlogPosts.id, postId),
          eq(travelBlogPosts.userId, userId)
        ))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Error deleting travel blog post:', error);
      return false;
    }
  }

  async deleteTravelBlogComment(commentId: number, userId: number): Promise<boolean> {
    try {
      const deleted = await db
        .delete(travelBlogComments)
        .where(and(
          eq(travelBlogComments.id, commentId),
          eq(travelBlogComments.userId, userId)
        ))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Error deleting travel blog comment:', error);
      return false;
    }
  }

  async updateUserAuraForPost(userId: number, auraPoints: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          aura: sql`${users.aura} + ${auraPoints}`,
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user aura for post:', error);
    }
  }

  async updateUserAuraForComment(userId: number, auraPoints: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          aura: sql`${users.aura} + ${auraPoints}`,
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user aura for comment:', error);
    }
  }

  async likeSecretLocalExperience(experienceId: number, userId: number): Promise<SecretLocalExperience | undefined> {
    try {
      console.log('🔥 STORAGE: Starting like process', { experienceId, userId });
      
      // First check if experience exists
      const [experience] = await db.select()
        .from(secretLocalExperiences)
        .where(eq(secretLocalExperiences.id, experienceId));

      console.log('🔥 STORAGE: Experience lookup result', experience ? 'FOUND' : 'NOT FOUND');

      if (!experience) {
        // Let's see what experiences DO exist
        const allExperiences = await db.select({ id: secretLocalExperiences.id, experience: secretLocalExperiences.experience })
          .from(secretLocalExperiences)
          .limit(10);
        console.log('🔥 STORAGE: Available experiences:', allExperiences);
        throw new Error('Experience not found');
      }

      // Check if user has already liked this experience
      const [existingLike] = await db.select()
        .from(secretLocalExperienceLikes)
        .where(and(
          eq(secretLocalExperienceLikes.experienceId, experienceId),
          eq(secretLocalExperienceLikes.userId, userId)
        ));

      if (existingLike) {
        throw new Error('You have already liked this experience');
      }

      // Add like record and update count in transaction
      await db.transaction(async (tx) => {
        await tx.insert(secretLocalExperienceLikes).values({
          experienceId,
          userId
        });

        await tx.update(secretLocalExperiences)
          .set({ 
            likes: sql`${secretLocalExperiences.likes} + 1`,
            updatedAt: new Date()
          })
          .where(eq(secretLocalExperiences.id, experienceId));
      });

      // Return updated experience
      const [updatedExperience] = await db.select()
        .from(secretLocalExperiences)
        .where(eq(secretLocalExperiences.id, experienceId));

      return updatedExperience;
    } catch (error) {
      console.error('Error liking secret local experience:', error);
      throw error;
    }
  }

  async getSecretLocalExperiencesByUser(userId: number): Promise<SecretLocalExperience[]> {
    try {
      const experiences = await db.select()
        .from(secretLocalExperiences)
        .where(eq(secretLocalExperiences.contributorId, userId))
        .orderBy(desc(secretLocalExperiences.createdAt));
      return experiences;
    } catch (error) {
      console.error('Error getting user secret local experiences:', error);
      return [];
    }
  }

  // Instagram posting methods
  async createInstagramPost(post: InsertInstagramPost): Promise<InstagramPost> {
    try {
      const [instagramPost] = await db.insert(instagramPosts).values(post).returning();
      return instagramPost;
    } catch (error) {
      console.error('Error creating Instagram post:', error);
      throw error;
    }
  }

  async getInstagramPosts(eventId?: number, userId?: number): Promise<InstagramPost[]> {
    try {
      let query = db.select().from(instagramPosts);
      
      if (eventId) {
        query = query.where(eq(instagramPosts.eventId, eventId));
      } else if (userId) {
        query = query.where(eq(instagramPosts.userId, userId));
      }
      
      const posts = await query.orderBy(desc(instagramPosts.createdAt));
      return posts;
    } catch (error) {
      console.error('Error getting Instagram posts:', error);
      return [];
    }
  }

  async updateInstagramPost(id: number, updates: Partial<InstagramPost>): Promise<InstagramPost | undefined> {
    try {
      const [post] = await db.update(instagramPosts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(instagramPosts.id, id))
        .returning();
      return post;
    } catch (error) {
      console.error('Error updating Instagram post:', error);
      throw error;
    }
  }

  async deleteInstagramPostByAdmin(id: number, adminId: number): Promise<boolean> {
    try {
      const [post] = await db.update(instagramPosts)
        .set({ 
          deletedByAdmin: true, 
          deletedAt: new Date(),
          nearbytravelerPostStatus: 'deleted',
          updatedAt: new Date()
        })
        .where(eq(instagramPosts.id, id))
        .returning();
      return !!post;
    } catch (error) {
      console.error('Error deleting Instagram post by admin:', error);
      return false;
    }
  }

  async getInstagramPostsByEvent(eventId: number): Promise<InstagramPost[]> {
    try {
      const posts = await db.select()
        .from(instagramPosts)
        .where(eq(instagramPosts.eventId, eventId))
        .orderBy(desc(instagramPosts.createdAt));
      return posts;
    } catch (error) {
      console.error('Error getting Instagram posts by event:', error);
      return [];
    }
  }

  // City pages and secret local experiences methods
  async ensureCityPageExists(city: string, state: string | null, country: string, createdById: number): Promise<any> {
    try {
      // First check if city page already exists
      const existingPage = await this.getCityPageByLocation(city, state, country);
      if (existingPage) {
        return existingPage;
      }

      // Generate AI cover image for the city
      const { aiCityImageGenerator } = await import('./aiCityImageGenerator');
      const coverImageUrl = await aiCityImageGenerator.generateCityImage(city, state || '', country);

      // Create new city page
      const [cityPage] = await db.insert(cityPages).values({
        city,
        state,
        country,
        title: `${city}${state ? `, ${state}` : ''}`,
        description: `Discover ${city} through the eyes of locals and fellow travelers.`,
        coverImage: coverImageUrl, // Add AI-generated cover image
        createdById,
        isPublished: true
      }).returning();

      // City page created - secret experiences will be community-driven only

      return cityPage;
    } catch (error) {
      console.error('Error ensuring city page exists:', error);
      return null;
    }
  }



  async getCityPageByLocation(city: string, state: string | null, country: string): Promise<any> {
    try {
      const [cityPage] = await db.select()
        .from(cityPages)
        .where(
          and(
            eq(cityPages.city, city),
            state ? eq(cityPages.state, state) : isNotNull(cityPages.state),
            eq(cityPages.country, country)
          )
        );
      return cityPage || null;
    } catch (error) {
      console.error('Error getting city page by location:', error);
      return null;
    }
  }

  async addSecretLocalExperience(cityPageId: number, contributorId: number, experience: string, category?: string): Promise<any> {
    try {
      const [secretExperience] = await db.insert(secretLocalExperiences).values({
        cityPageId,
        contributorId,
        experience,
        category: category || 'activity',
        description: `A local secret shared by community members`,
        likes: 1, // Creator always likes their own content
        isActive: true
      }).returning();

      return secretExperience;
    } catch (error) {
      console.error('Error adding secret local experience:', error);
      return null;
    }
  }

  async getSecretLocalExperiencesByCity(city: string, state: string | null, country: string | null): Promise<any[]> {
    try {
      console.log('🔥 SECRET ACTIVITIES: Now pulling from user.secretActivities field - LIVE PROFILE DATA!', { city, state, country });
      
      // COMPLETELY REWRITTEN: Pull from users.secretActivities field so profile changes immediately show on city pages
      let experiences = [];
      
      // Metro consolidation function - matches the backend logic
      const consolidateToMetroArea = (city: string): string => {
        if (!city) return city;
        
        const LA_METRO_CITIES = [
          'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 
          'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 
          'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 
          'Compton', 'Downey', 'Pomona', 'Playa del Rey', 'Redondo Beach',
          'Culver City', 'Marina del Rey', 'Hermosa Beach', 'Hawthorne',
          'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier', 'Montebello',
          'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
          'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
          'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge',
          'Malibu', 'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City',
          'West LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz',
          'Silver Lake', 'Echo Park', 'Downtown LA', 'Arts District', 'Little Tokyo',
          'Chinatown', 'Boyle Heights', 'East LA', 'Highland Park', 'Eagle Rock',
          'Atwater Village', 'Glassell Park', 'Mount Washington', 'Cypress Park',
          'Sun Valley', 'Pacoima', 'Sylmar', 'Granada Hills', 'Porter Ranch',
          'Chatsworth', 'Canoga Park', 'Woodland Hills', 'Tarzana', 'Panorama City',
          'Mission Hills', 'Sepulveda', 'Arleta', 'San Pedro', 'Wilmington',
          'Harbor City', 'Harbor Gateway', 'Watts', 'South LA', 'Crenshaw',
          'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
        ];
        
        const isLAMetro = LA_METRO_CITIES.some(metroCity => 
          metroCity.toLowerCase() === city.toLowerCase()
        );
        
        if (isLAMetro) {
          console.log(`🌍 SECRET METRO CONSOLIDATION: ${city} → Los Angeles Metro`);
          return 'Los Angeles';
        }

        // Nashville Metro consolidation
        const NASHVILLE_METRO_CITIES = [
          'Nashville', 'Nashville Metro', 'Brentwood', 'Franklin', 'Murfreesboro', 'Hendersonville', 
          'Gallatin', 'Lebanon', 'Mount Juliet', 'Goodlettsville', 'White House',
          'Springfield', 'Clarksville', 'Smyrna', 'La Vergne', 'Antioch',
          'Hermitage', 'Old Hickory', 'Madison', 'Belle Meade', 'Forest Hills',
          'Oak Hill', 'Berry Hill', 'Lakewood', 'Bellevue', 'Green Hills',
          'Music Row', 'The Gulch', 'Downtown Nashville', 'East Nashville',
          'West Nashville', 'South Nashville', 'North Nashville', 'Greenhills'
        ];
        
        const isNashvilleMetro = NASHVILLE_METRO_CITIES.some(metroCity => 
          metroCity.toLowerCase() === city.toLowerCase()
        );
        
        if (isNashvilleMetro) {
          console.log(`🌍 SECRET METRO CONSOLIDATION: ${city} → Nashville Metro`);
          return 'Nashville';
        }
        
        return city;
      };

      // Consolidate metro areas first
      const consolidatedCity = consolidateToMetroArea(city);
      
      // Query users whose hometown matches this city and have secret activities
      const conditions = [];
      
      if (city.toLowerCase() === 'los angeles metro') {
        // For LA metro, search all LA metro cities
        const LA_METRO_CITIES = [
          'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'El Segundo', 
          'Manhattan Beach', 'Beverly Hills', 'West Hollywood', 'Pasadena', 
          'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood', 
          'Compton', 'Downey', 'Pomona', 'Playa del Rey', 'Redondo Beach',
          'Culver City', 'Marina del Rey', 'Hermosa Beach', 'Hawthorne',
          'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier', 'Montebello',
          'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena',
          'San Fernando', 'North Hollywood', 'Hollywood', 'Studio City',
          'Sherman Oaks', 'Encino', 'Reseda', 'Van Nuys', 'Northridge',
          'Malibu', 'Pacific Palisades', 'Brentwood', 'Westwood', 'Century City',
          'West LA', 'Koreatown', 'Mid-City', 'Miracle Mile', 'Los Feliz',
          'Silver Lake', 'Echo Park', 'Downtown LA', 'Arts District', 'Little Tokyo',
          'Chinatown', 'Boyle Heights', 'East LA', 'Highland Park', 'Eagle Rock',
          'Atwater Village', 'Glassell Park', 'Mount Washington', 'Cypress Park',
          'Sun Valley', 'Pacoima', 'Sylmar', 'Granada Hills', 'Porter Ranch',
          'Chatsworth', 'Canoga Park', 'Woodland Hills', 'Tarzana', 'Panorama City',
          'Mission Hills', 'Sepulveda', 'Arleta', 'San Pedro', 'Wilmington',
          'Harbor City', 'Harbor Gateway', 'Watts', 'South LA', 'Crenshaw',
          'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights'
        ];
        
        conditions.push(or(...LA_METRO_CITIES.map(cityName => eq(users.hometownCity, cityName))));
        
      } else if (city.toLowerCase() === 'nashville metro') {
        // For Nashville metro, search all Nashville metro cities
        const NASHVILLE_METRO_CITIES = [
          'Nashville', 'Nashville Metro', 'Brentwood', 'Franklin', 'Murfreesboro', 'Hendersonville', 
          'Gallatin', 'Lebanon', 'Mount Juliet', 'Goodlettsville', 'White House',
          'Springfield', 'Clarksville', 'Smyrna', 'La Vergne', 'Antioch',
          'Hermitage', 'Old Hickory', 'Madison', 'Belle Meade', 'Forest Hills',
          'Oak Hill', 'Berry Hill', 'Lakewood', 'Bellevue', 'Green Hills',
          'Music Row', 'The Gulch', 'Downtown Nashville', 'East Nashville',
          'West Nashville', 'South Nashville', 'North Nashville', 'Greenhills'
        ];
        
        conditions.push(or(...NASHVILLE_METRO_CITIES.map(cityName => eq(users.hometownCity, cityName))));
        
      } else {
        // For other cities, match the city name
        conditions.push(ilike(users.hometownCity, `%${city}%`));
      }
      
      // Only get users with non-empty secret activities
      conditions.push(isNotNull(users.secretActivities));
      conditions.push(ne(users.secretActivities, ''));
      

      
      const usersWithSecrets = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        secretActivities: users.secretActivities,
        hometownCity: users.hometownCity,
        hometownState: users.hometownState,
        createdAt: users.createdAt
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));
      
      console.log(`🔥 SECRET ACTIVITIES: Found ${usersWithSecrets.length} users with secret activities for ${consolidatedCity} (originally searched: ${city})`);
      
      // Format user secret activities as experiences
      experiences = usersWithSecrets.map((user, index) => ({
        id: user.id * 1000 + index, // Create unique ID by combining user ID with index
        experience: user.secretActivities,
        description: `A local secret from ${user.hometownCity}`,
        category: 'local-secret',
        likes: 1, // Default like from the contributor
        createdAt: user.createdAt,
        username: user.username || 'Anonymous',
        contributor: {
          id: user.id,
          username: user.username || 'Anonymous', 
          name: user.name || 'Anonymous'
        }
      })).filter(exp => exp.experience && exp.experience.trim().length > 0);

      console.log(`🔥 SECRET ACTIVITIES LIVE: Returning ${experiences.length} live experiences from user profiles!`);
      return experiences;
    } catch (error) {
      console.error('Error getting secret experiences by city from user profiles:', error);
      return [];
    }
  }

  // Duplicate getUsersByLocationAndType method removed - using original version above

  // Re-enabled chatroom creation for new cities - creates 2 chatrooms per city
  async ensureMeetLocalsChatrooms(city?: string, state?: string | null, country?: string): Promise<void> {
    try {
      console.log('✅ CHATROOM CREATION ENABLED: Creating chatrooms for new cities as needed');
      let cities;
      
      if (city && country) {
        // Handle specific location request
        cities = [{ city, state, country }];
      } else {
        // Get all unique cities where users live (hometownCity)
        cities = await db
          .selectDistinct({
            city: users.hometownCity,
            state: users.hometownState,
            country: users.hometownCountry
          })
          .from(users)
          .where(and(
            isNotNull(users.hometownCity),
            ne(users.hometownCity, ''),
            ne(users.hometownCity, 'null')
          ));
      }

      console.log(`Processing ${cities.length} cities for chatroom creation`);

      for (const cityData of cities) {
        if (!cityData.city) continue;

        // Apply metro consolidation - use consolidated metropolitan area name for chatroom creation
        const consolidatedCity = this.consolidateToMetropolitanArea(cityData.city, cityData.state, cityData.country);
        
        if (process.env.NODE_ENV === 'development') console.log(`🌍 CHATROOM CONSOLIDATION: ${cityData.city} → ${consolidatedCity}`);
        
        // Use the consolidated city name (either same city or metro area) for chatroom creation
        const chatroomCity = consolidatedCity;

        // Create simplified chatroom set for each metropolitan city (only 2 chatrooms)
        const chatroomTypes = [
          {
            name: `Welcome Newcomers ${chatroomCity}`,
            description: `Welcome travelers and newcomers to ${chatroomCity}! Get oriented, ask questions, and connect with the community.`,
            tags: ['welcome', 'newcomers', 'travelers', 'orientation']
          },
          {
            name: `Let's Meet Up ${chatroomCity}`,
            description: `Organize meetups and social events in ${chatroomCity}! Plan activities, find companions, and make new friends.`,
            tags: ['meetup', 'social', 'events', 'planning']
          }
        ];

        for (const chatroomType of chatroomTypes) {
          // Check if chatroom already exists
          const existingChatroom = await db
            .select()
            .from(citychatrooms)
            .where(and(
              eq(citychatrooms.city, chatroomCity),
              eq(citychatrooms.name, chatroomType.name)
            ))
            .limit(1);

          if (existingChatroom.length === 0) {
            // Create the chatroom with nearbytraveler as creator
            const chatroomData = {
              name: chatroomType.name,
              description: chatroomType.description,
              city: chatroomCity,
              state: cityData.state || null,
              country: cityData.country || null,
              createdById: 2, // nearbytraveler as creator
              isPublic: true,
              maxMembers: 500,
              tags: chatroomType.tags,
              rules: 'Be respectful, share local knowledge, and help fellow travelers discover the city!'
            };

            const newChatroom = await this.createCityChatroom(chatroomData);
            console.log(`Created "${chatroomType.name}" chatroom for ${chatroomCity}`);
            
            // Automatically add nearbytraveler as first member/admin
            if (newChatroom?.id) {
              await db.insert(chatroomMembers).values({
                chatroomId: newChatroom.id,
                userId: 2, // nearbytraveler
                role: 'admin',
                isActive: true,
                joinedAt: new Date()
              });
              console.log(`Added nearbytraveler as admin to ${chatroomType.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring Meet Locals chatrooms:', error);
    }
  }

  // Auto-join new users to chatrooms for their hometown and travel destination
  async autoJoinUserCityChatrooms(userId: number, hometownCity: string, hometownCountry: string, travelCity?: string, travelCountry?: string): Promise<void> {
    try {
      console.log(`🎯 AUTO-JOIN CITIES: Adding user ${userId} to their city chatrooms`);
      
      // Always join hometown chatrooms
      if (hometownCity && hometownCountry) {
        await this.autoJoinWelcomeChatroom(userId, hometownCity, hometownCountry);
        console.log(`✅ Auto-joined user ${userId} to hometown chatrooms: ${hometownCity}`);
      }
      
      // If traveling, also join travel destination chatrooms
      if (travelCity && travelCountry) {
        await this.autoJoinWelcomeChatroom(userId, travelCity, travelCountry);
        console.log(`✅ Auto-joined user ${userId} to travel destination chatrooms: ${travelCity}`);
      }
    } catch (error) {
      console.error('Error auto-joining user city chatrooms:', error);
      // Don't fail user creation if chatroom joining fails
    }
  }

  // Create secondary chatrooms for each city (2 chatrooms total per city)
  async ensureSecondaryChatrooms(city: string, state?: string | null, country?: string): Promise<void> {
    try {
      if (!city || !country) return;
      
      console.log(`🏠 SECONDARY CHATROOMS: Creating second chatroom for ${city}, ${state}, ${country}`);
      
      // Check if secondary chatroom already exists (looking for "Travel Tips & Local Secrets")
      const existingSecondary = await db
        .select()
        .from(citychatrooms)
        .where(
          and(
            eq(citychatrooms.city, city),
            eq(citychatrooms.country, country),
            ilike(citychatrooms.name, '%Travel Tips%')
          )
        )
        .limit(1);
      
      if (existingSecondary.length === 0) {
        // Create secondary chatroom
        await db.insert(citychatrooms).values({
          name: `${city} - Travel Tips & Local Secrets`,
          description: `Share insider tips, local secrets, and travel advice for ${city}`,
          city: city,
          state: state,
          country: country,
          createdBy: 1, // NearbyTraveler system account
          isActive: true
        });
        console.log(`✅ Created secondary chatroom: ${city} - Travel Tips & Local Secrets`);
      } else {
        console.log(`⚠️ Secondary chatroom already exists for ${city}`);
      }
    } catch (error) {
      console.error('Error creating secondary chatrooms:', error);
    }
  }

  // Send system message from NearbyTraveler account
  async sendSystemMessage(fromUserId: number, toUserId: number, messageText: string): Promise<void> {
    try {
      console.log(`📨 SYSTEM MESSAGE: Sending welcome message from user ${fromUserId} to user ${toUserId}`);
      
      // Create a message in the messages table
      await db.insert(messages).values({
        senderId: fromUserId,
        receiverId: toUserId,
        content: messageText,
        sentAt: new Date(),
        isRead: false
      });
      
      console.log(`✅ System message sent successfully`);
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }

  // Register user in a city with specific status (local or traveler)
  async registerUserInCity(userId: number, city: string, state?: string | null, country?: string, userStatus?: string): Promise<void> {
    try {
      if (!city || !country) return;
      
      console.log(`🏙️ CITY REGISTRATION: Registering user ${userId} as ${userStatus} in ${city}, ${state}, ${country}`);
      
      // For now, this is handled by the user's profile data (hometown vs travel destination)
      // Future enhancement: Could create a separate user_city_registrations table
      // But the current system tracks this through:
      // - hometownCity/State/Country for locals
      // - travelDestination for travelers (via travel plans)
      
      console.log(`✅ User ${userId} registered as ${userStatus} in ${city}`);
    } catch (error) {
      console.error('Error registering user in city:', error);
    }
  }

  // Auto-join user to both Welcome Newcomers and Let's Meet Up chatrooms for their city
  async autoJoinWelcomeChatroom(userId: number, city: string, country: string): Promise<void> {
    try {
      console.log(`🎯 AUTO-JOIN: Finding chatrooms for user ${userId} in city: ${city}`);
      
      // Apply metro consolidation to find the correct chatroom city
      const consolidatedCity = this.consolidateToMetropolitanArea(city, null, country);
      console.log(`🎯 AUTO-JOIN: ${city} consolidated to ${consolidatedCity} for chatroom lookup`);
      
      // Find chatrooms for the consolidated city
      const cityChatrooms = await db
        .select()
        .from(citychatrooms)
        .where(and(
          eq(citychatrooms.city, consolidatedCity),
          or(
            ilike(citychatrooms.name, `Welcome Newcomers ${consolidatedCity}`),
            ilike(citychatrooms.name, `Let's Meet Up ${consolidatedCity}`)
          )
        ));

      console.log(`🎯 AUTO-JOIN: Found ${cityChatrooms.length} chatrooms for ${consolidatedCity}`);

      for (const chatroom of cityChatrooms) {
        // Check if user is already a member
        const existingMembership = await db
          .select()
          .from(chatroomMembers)
          .where(and(
            eq(chatroomMembers.chatroomId, chatroom.id),
            eq(chatroomMembers.userId, userId)
          ))
          .limit(1);

        if (existingMembership.length === 0) {
          // Add user to the chatroom
          await db.insert(chatroomMembers).values({
            chatroomId: chatroom.id,
            userId: userId,
            role: 'member',
            isActive: true,
            joinedAt: new Date()
          });
          
          console.log(`Auto-joined user ${userId} to ${chatroom.name} chatroom`);
        }
      }
    } catch (error) {
      console.error('Error auto-joining Los Angeles Metro chatrooms:', error);
    }
  }

  // Business Offers Methods
  async createBusinessOffer(offer: InsertBusinessOffer): Promise<BusinessOffer> {
    try {
      const [newOffer] = await db.insert(businessOffers).values(offer).returning();
      return newOffer;
    } catch (error) {
      console.error('Error creating business offer:', error);
      throw error;
    }
  }

  async getBusinessOffer(id: number): Promise<BusinessOffer | undefined> {
    try {
      const [offer] = await db
        .select()
        .from(businessOffers)
        .where(eq(businessOffers.id, id))
        .limit(1);
      return offer;
    } catch (error) {
      console.error('Error getting business offer:', error);
      return undefined;
    }
  }

  async getBusinessOffers(city?: string, category?: string, targetAudience?: string, businessId?: string): Promise<any[]> {
    try {
      let conditions = [
        eq(businessOffers.isActive, true)
        // Free mode: Show all active offers regardless of subscription status
        // When Stripe keys are added, uncomment subscription check below:
        // or(
        //   eq(users.subscriptionStatus, 'active'),
        //   eq(users.subscriptionStatus, 'trialing'),
        //   and(
        //     isNotNull(users.trialEndDate),
        //     sql`${users.trialEndDate} > NOW()`
        //   )
        // )
      ];

      if (city) {
        console.log('Filtering business offers by city:', city);
        const cityName = city.split(',')[0].trim(); // Extract main city name
        conditions.push(
          or(
            ilike(businessOffers.city, `%${cityName}%`),
            ilike(users.hometownCity, `%${cityName}%`)
          )!
        );
      }

      if (category) {
        conditions.push(eq(businessOffers.category, category));
      }

      if (targetAudience) {
        // Check if targetAudience is in the array
        conditions.push(sql`${businessOffers.targetAudience} @> ARRAY[${targetAudience}]::text[]`);
      }

      if (businessId) {
        conditions.push(eq(businessOffers.businessId, parseInt(businessId)));
      }

      const offers = await db
        .select({
          id: businessOffers.id,
          businessId: businessOffers.businessId,
          title: businessOffers.title,
          description: businessOffers.description,
          category: businessOffers.category,
          discountType: businessOffers.discountType,
          discountValue: businessOffers.discountValue,
          discountCode: businessOffers.discountCode,
          targetAudience: businessOffers.targetAudience,
          city: businessOffers.city,
          state: businessOffers.state,
          country: businessOffers.country,
          validFrom: businessOffers.validFrom,
          validUntil: businessOffers.validUntil,
          maxRedemptions: businessOffers.maxRedemptions,
          currentRedemptions: businessOffers.currentRedemptions,
          imageUrl: businessOffers.imageUrl,
          termsConditions: businessOffers.termsConditions,
          contactInfo: businessOffers.contactInfo,
          websiteUrl: businessOffers.websiteUrl,
          tags: businessOffers.tags,
          viewCount: businessOffers.viewCount,
          createdAt: businessOffers.createdAt,
          business: {
            id: users.id,
            username: users.username,
            name: users.name,
            businessName: users.businessName, // Add business name to response
            profileImage: users.profileImage,
            location: users.location,
            bio: users.bio,
            streetAddress: users.streetAddress,
            websiteUrl: users.websiteUrl
          }
        })
        .from(businessOffers)
        .leftJoin(users, eq(businessOffers.businessId, users.id))
        .where(and(...conditions))
        .orderBy(desc(businessOffers.createdAt));

      return offers;
    } catch (error) {
      console.error('Error getting business offers:', error);
      return [];
    }
  }

  async getUserBusinessOffers(businessId: number): Promise<any[]> {
    try {
      const offers = await db
        .select()
        .from(businessOffers)
        .where(eq(businessOffers.businessId, businessId))
        .orderBy(desc(businessOffers.createdAt));

      return offers;
    } catch (error) {
      console.error('Error getting user business offers:', error);
      return [];
    }
  }

  async updateBusinessOffer(id: number, updates: Partial<BusinessOffer>): Promise<BusinessOffer | undefined> {
    try {
      const [updatedOffer] = await db
        .update(businessOffers)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(businessOffers.id, id))
        .returning();
      return updatedOffer;
    } catch (error) {
      console.error('Error updating business offer:', error);
      return undefined;
    }
  }

  async deleteBusinessOffer(id: number): Promise<boolean> {
    try {
      await db.delete(businessOffers).where(eq(businessOffers.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting business offer:', error);
      return false;
    }
  }

  async deactivateBusinessOffers(businessId: number): Promise<void> {
    try {
      await db
        .update(businessOffers)
        .set({ isActive: false })
        .where(eq(businessOffers.businessId, businessId));
    } catch (error) {
      console.error('Error deactivating business offers:', error);
      throw error;
    }
  }

  async reactivateBusinessOffers(businessId: number): Promise<void> {
    try {
      await db
        .update(businessOffers)
        .set({ isActive: true })
        .where(eq(businessOffers.businessId, businessId));
    } catch (error) {
      console.error('Error reactivating business offers:', error);
      throw error;
    }
  }

  async getBusinessAnalytics(businessId: number): Promise<any> {
    try {
      const offers = await db
        .select()
        .from(businessOffers)
        .where(eq(businessOffers.businessId, businessId));

      const totalOffers = offers.length;
      const totalViews = offers.reduce((sum, offer) => sum + (offer.viewCount || 0), 0);
      const totalRedemptions = offers.reduce((sum, offer) => sum + (offer.currentRedemptions || 0), 0);
      const activeOffers = offers.filter(offer => {
        const now = new Date();
        const validUntil = new Date(offer.validUntil);
        return validUntil > now;
      }).length;

      return {
        totalOffers,
        totalViews,
        totalRedemptions,
        activeOffers,
      };
    } catch (error) {
      console.error('Error getting business analytics:', error);
      return {
        totalOffers: 0,
        totalViews: 0,
        totalRedemptions: 0,
        activeOffers: 0,
      };
    }
  }

  async redeemBusinessOffer(offerId: number, userId: number): Promise<BusinessOfferRedemption | undefined> {
    try {
      // Get the offer first
      const [offer] = await db
        .select()
        .from(businessOffers)
        .where(eq(businessOffers.id, offerId))
        .limit(1);

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check how many times user has already redeemed this offer
      const existingRedemptions = await db
        .select()
        .from(businessOfferRedemptions)
        .where(and(
          eq(businessOfferRedemptions.offerId, offerId),
          eq(businessOfferRedemptions.userId, userId)
        ));

      // Check if user has reached their redemption limit for this offer
      const maxPerUser = offer.maxRedemptionsPerUser || 1;
      if (existingRedemptions.length >= maxPerUser) {
        throw new Error(`You have already redeemed this offer ${existingRedemptions.length} time${existingRedemptions.length > 1 ? 's' : ''}. Maximum allowed: ${maxPerUser}`);
      }

      // Check if offer is still valid
      if (!offer.isActive) {
        throw new Error('This offer is no longer active');
      }

      if (offer.validUntil && new Date() > offer.validUntil) {
        throw new Error('This offer has expired');
      }

      if (offer.maxRedemptions && offer.currentRedemptions >= offer.maxRedemptions) {
        throw new Error('This offer has reached its redemption limit');
      }
      if (offer.maxRedemptionsPerUser) {
        const userRedemptions = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(businessOfferRedemptions)
          .where(and(
            eq(businessOfferRedemptions.offerId, offerId),
            eq(businessOfferRedemptions.userId, userId)
          ));

        const currentUserRedemptions = userRedemptions[0]?.count || 0;
        
        if (currentUserRedemptions >= offer.maxRedemptionsPerUser) {
          throw new Error(`You have reached the limit of ${offer.maxRedemptionsPerUser} redemptions for this offer`);
        }
      }

      // Create redemption
      const redemptionCode = `${offerId}-${userId}-${Date.now()}`;
      const [redemption] = await db
        .insert(businessOfferRedemptions)
        .values({
          offerId,
          userId,
          redemptionCode
        })
        .returning();

      // Update current redemptions count
      await db
        .update(businessOffers)
        .set({ currentRedemptions: sql`${businessOffers.currentRedemptions} + 1` })
        .where(eq(businessOffers.id, offerId));

      return redemption;
    } catch (error) {
      console.error('Error redeeming business offer:', error);
      throw error;
    }
  }

  async getBusinessOfferRedemptions(offerId: number): Promise<any[]> {
    try {
      const redemptions = await db
        .select({
          id: businessOfferRedemptions.id,
          userId: businessOfferRedemptions.userId,
          redemptionCode: businessOfferRedemptions.redemptionCode,
          redeemedAt: businessOfferRedemptions.redeemedAt,
          verifiedByBusiness: businessOfferRedemptions.verifiedByBusiness,
          notes: businessOfferRedemptions.notes,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(businessOfferRedemptions)
        .leftJoin(users, eq(businessOfferRedemptions.userId, users.id))
        .where(eq(businessOfferRedemptions.offerId, offerId))
        .orderBy(desc(businessOfferRedemptions.redeemedAt));

      return redemptions;
    } catch (error) {
      console.error('Error getting business offer redemptions:', error);
      return [];
    }
  }

  async getUserOfferRedemptions(userId: number): Promise<any[]> {
    try {
      const redemptions = await db
        .select({
          id: businessOfferRedemptions.id,
          redemptionCode: businessOfferRedemptions.redemptionCode,
          redeemedAt: businessOfferRedemptions.redeemedAt,
          verifiedByBusiness: businessOfferRedemptions.verifiedByBusiness,
          notes: businessOfferRedemptions.notes,
          offer: {
            id: businessOffers.id,
            title: businessOffers.title,
            description: businessOffers.description,
            category: businessOffers.category,
            discountType: businessOffers.discountType,
            discountValue: businessOffers.discountValue,
            city: businessOffers.city,
            state: businessOffers.state,
            country: businessOffers.country
          }
        })
        .from(businessOfferRedemptions)
        .leftJoin(businessOffers, eq(businessOfferRedemptions.offerId, businessOffers.id))
        .where(eq(businessOfferRedemptions.userId, userId))
        .orderBy(desc(businessOfferRedemptions.redeemedAt));

      return redemptions;
    } catch (error) {
      console.error('Error getting user offer redemptions:', error);
      return [];
    }
  }

  // Admin dashboard methods
  async getAdminStats() {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalBusinesses = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.userType, 'business'));
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newUsersThisMonth = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthStart}`);

    // Since we're in free mode, count all businesses as "active"
    const activeSubscriptions = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.userType, 'business'));

    // Calculate monthly revenue
    const monthlyPriceCents = parseInt(process.env.BUSINESS_MONTHLY_PRICE_CENTS || '4900');
    const monthlyRevenue = (activeSubscriptions[0]?.count || 0) * monthlyPriceCents;

    return {
      totalUsers: parseInt(totalUsers[0]?.count as string) || 0,
      totalBusinesses: parseInt(totalBusinesses[0]?.count as string) || 0,
      activeSubscriptions: parseInt(activeSubscriptions[0]?.count as string) || 0,
      monthlyRevenue,
      newUsersThisMonth: parseInt(newUsersThisMonth[0]?.count as string) || 0,
      subscriptionRevenue: monthlyRevenue
    };
  }

  async getAllUsersForAdmin() {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      userType: users.userType,
      location: users.location,
      createdAt: users.createdAt,
      isActive: users.isActive
    }).from(users).orderBy(desc(users.createdAt));

    return allUsers;
  }

  async getBusinessSubscriptions() {
    const monthlyPriceCents = parseInt(process.env.BUSINESS_MONTHLY_PRICE_CENTS || '4900');
    
    const businesses = await db.select({
      id: users.id,
      businessName: users.name,
      email: users.email,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.userType, 'business'))
    .orderBy(desc(users.createdAt));

    return businesses.map(business => ({
      ...business,
      monthlyRevenue: monthlyPriceCents,
      status: 'active' // Free mode - all businesses are active
    }));
  }

  // Admin user management methods
  async suspendUser(userId: number) {
    await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
    
    return { success: true, message: 'User suspended successfully' };
  }

  async unsuspendUser(userId: number) {
    await db.update(users)
      .set({ isActive: true })
      .where(eq(users.id, userId));
    
    return { success: true, message: 'User unsuspended successfully' };
  }



  async getUserByResetToken(token: string) {
    const [user] = await db.select().from(users)
      .where(eq(users.passwordResetToken, token));
    return user || null;
  }

  // Travel preferences methods
  async getUserTravelPreferences(userId: number): Promise<any> {
    try {
      const [user] = await db.select({
        defaultTravelInterests: users.defaultTravelInterests,
        defaultTravelActivities: users.defaultTravelActivities,
        defaultTravelEvents: users.defaultTravelEvents
      }).from(users).where(eq(users.id, userId));
      return user || null;
    } catch (error) {
      console.error('Error getting user travel preferences:', error);
      return null;
    }
  }

  async createUserTravelPreferences(preferences: any): Promise<any> {
    try {
      const updatedUser = await this.updateUser(preferences.userId, {
        defaultTravelInterests: preferences.defaultTravelInterests,
        defaultTravelActivities: preferences.defaultTravelActivities,
        defaultTravelEvents: preferences.defaultTravelEvents
      });
      return updatedUser;
    } catch (error) {
      console.error('Error creating user travel preferences:', error);
      throw error;
    }
  }

  async updateUserTravelPreferences(userId: number, updates: any): Promise<any> {
    try {
      const updatedUser = await this.updateUser(userId, {
        defaultTravelInterests: updates.defaultTravelInterests,
        defaultTravelActivities: updates.defaultTravelActivities,
        defaultTravelEvents: updates.defaultTravelEvents
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user travel preferences:', error);
      throw error;
    }
  }

  // City Photos methods
  async getCityPhotos(cityName: string): Promise<CityPhoto[]> {
    try {
      console.log('Getting city photos for:', cityName);
      
      // Parse location string if it contains comma-separated parts
      const locationParts = cityName.split(',').map(part => part.trim());
      const city = locationParts[0] || cityName;
      const state = locationParts[1] || '';
      const country = locationParts[2] || locationParts[1] || '';
      
      console.log('Parsed location - City:', city, 'State:', state, 'Country:', country);
      
      // Query by city name only since that's the primary identifier
      // Order by ID descending to get newest photos first
      const photos = await db.select().from(cityPhotos)
        .where(eq(cityPhotos.city, city))
        .orderBy(desc(cityPhotos.id));
      console.log('Found', photos.length, 'photos for', city, '- ordered by newest first');
      return photos;
    } catch (error) {
      console.error('Error getting city photos:', error);
      return [];
    }
  }

  async createCityPhoto(photoData: { cityName: string; imageData: string; photographerUsername: string }): Promise<CityPhoto> {
    try {
      console.log('=== CITY PHOTO UPLOAD ===');
      console.log('RECEIVED photographerUsername:', photoData.photographerUsername);
      console.log('RECEIVED cityName:', photoData.cityName);
      
      const actualUsername = photoData.photographerUsername;
      console.log('Looking up user with username:', actualUsername);
      
      // Find user by username
      const allUsers = await db.select().from(users).where(eq(users.username, actualUsername));
      console.log('Database query results:', allUsers.length, 'users found for:', actualUsername);
      
      if (allUsers.length === 0) {
        console.error('❌ User not found with username:', actualUsername);
        throw new Error(`User not found: ${actualUsername}`);
      }
      
      const user = allUsers[0];
      console.log('✅ Found user:', { id: user.id, username: user.username });

      // AUTOMATIC CLEANUP FOR CITY COVER PHOTOS ONLY
      // This cleanup ensures each city has only one representative cover photo
      // Note: This is specifically for city cover photos, not photo galleries
      console.log('🏙️ CITY COVER PHOTO: Checking for existing cover photo for city:', photoData.cityName);
      const existingPhotos = await db.select().from(cityPhotos)
        .where(eq(cityPhotos.city, photoData.cityName));
      
      if (existingPhotos.length > 0) {
        console.log(`🏙️ CITY COVER: Found ${existingPhotos.length} existing cover photo(s) for ${photoData.cityName} - replacing with new cover photo`);
        
        // Delete old cover photo files from filesystem
        for (const oldPhoto of existingPhotos) {
          if (oldPhoto.imageUrl) {
            try {
              const oldFilename = oldPhoto.imageUrl.replace('/attached_assets/', '');
              const oldFilepath = path.join(process.cwd(), 'attached_assets', oldFilename);
              await fs.unlink(oldFilepath);
              console.log(`🗑️ Deleted old cover photo file: ${oldFilename}`);
            } catch (fileError) {
              console.log(`⚠️ Could not delete old cover photo file (may not exist): ${oldPhoto.imageUrl}`);
            }
          }
        }
        
        // Delete old cover photo records from database
        await db.delete(cityPhotos).where(eq(cityPhotos.city, photoData.cityName));
        console.log(`🏙️ CITY COVER: Replaced ${existingPhotos.length} old cover photo(s) with new upload for ${photoData.cityName}`);
      } else {
        console.log(`✅ CITY COVER: No existing cover photo found for ${photoData.cityName} - proceeding with first cover photo upload`);
      }
      
      // Save new image to filesystem
      const timestamp = Date.now();
      const filename = `${photoData.cityName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.jpg`;
      const filepath = path.join(process.cwd(), 'attached_assets', filename);
      
      // Convert base64 to buffer
      const base64Data = photoData.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Write file
      await fs.writeFile(filepath, buffer);
      console.log('✅ File saved to:', filepath);
      
      const imageUrl = `/attached_assets/${filename}`;
      
      // Insert new photo into database
      const newPhoto = await db.insert(cityPhotos).values({
        city: photoData.cityName,
        state: null,
        country: 'United States', // Default for now
        imageUrl: imageUrl,
        photographerUsername: user.username,
        photographerId: user.id,
        createdAt: new Date()
      }).returning();
      
      console.log('✅ New photo saved to database:', newPhoto[0]);
      console.log('🎯 RESULT: Database now contains exactly 1 photo for', photoData.cityName);
      
      // Award aura point to user
      await db.update(users)
        .set({ 
          aura: sql`${users.aura} + 1`
        })
        .where(eq(users.id, user.id));
      
      console.log('✅ Awarded 1 aura point to user:', user.username);
      
      return newPhoto[0];
    } catch (error) {
      console.error('❌ Error creating city photo:', error);
      throw error;
    }
  }

  async getAllCityPhotos(): Promise<CityPhoto[]> {
    try {
      console.log('DatabaseStorage.getAllCityPhotos() called');
      const photos = await db.select().from(cityPhotos).where(eq(cityPhotos.isActive, true));
      console.log('📸 PHOTOS API: SQL query executed, found', photos.length, 'total city photos from database');
      photos.forEach(photo => {
        console.log(`📸 Photo found: ${photo.city} - imageUrl length: ${photo.imageUrl ? photo.imageUrl.length : 0}`);
      });
      return photos;
    } catch (error) {
      console.error('Error in getAllCityPhotos:', error);
      return [];
    }
  }

  // Instagram methods implementation
  async createInstagramPost(data: InsertInstagramPost): Promise<InstagramPost> {
    try {
      const [post] = await db.insert(instagramPosts).values({
        eventId: data.eventId,
        userId: data.userId,
        postContent: data.postContent,
        imageUrl: data.imageUrl,
        userPostStatus: data.userPostStatus || 'pending',
        nearbytravelerPostStatus: data.nearbytravelerPostStatus || 'pending',
      }).returning();
      
      console.log('Instagram post created:', post.id);
      return post;
    } catch (error) {
      console.error('Error creating Instagram post:', error);
      throw error;
    }
  }

  async getInstagramPosts(eventId?: number, userId?: number): Promise<InstagramPost[]> {
    try {
      let query = db.select().from(instagramPosts);
      
      if (eventId) {
        query = query.where(eq(instagramPosts.eventId, eventId));
      } else if (userId) {
        query = query.where(eq(instagramPosts.userId, userId));
      }
      
      const posts = await query;
      return posts;
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      return [];
    }
  }

  async getInstagramPostsByEvent(eventId: number): Promise<InstagramPost[]> {
    try {
      const posts = await db.select()
        .from(instagramPosts)
        .where(eq(instagramPosts.eventId, eventId));
      return posts;
    } catch (error) {
      console.error('Error fetching Instagram posts by event:', error);
      return [];
    }
  }



  async deleteInstagramPostByAdmin(id: number, adminId: number): Promise<boolean> {
    try {
      // Mark as deleted by admin rather than hard delete
      const [post] = await db.update(instagramPosts)
        .set({
          deletedAt: new Date(),
          deletedByAdmin: true,
          nearbytravelerPostStatus: 'deleted',
        })
        .where(eq(instagramPosts.id, id))
        .returning();
      
      return !!post;
    } catch (error) {
      console.error('Error deleting Instagram post by admin:', error);
      return false;
    }
  }

  async getUserById(userId: number): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) return undefined;

      // Convert snake_case database fields to camelCase for frontend
      const convertedUser = {
        ...user,
        isVeteran: user.is_veteran,
        isActiveDuty: user.is_active_duty,
        childrenAges: user.children_ages,
        hometownCity: user.hometown_city,
        hometownState: user.hometown_state,
        hometownCountry: user.hometown_country,
        travelStyle: user.travel_style,
        dateOfBirth: user.date_of_birth,
        ageVisible: user.age_visible,
        sexualPreference: user.sexual_preference,
        sexualPreferenceVisible: user.sexual_preference_visible,
        travelingWithChildren: user.traveling_with_children,
        secretActivities: user.secret_activities,
        businessName: user.business_name,
        businessDescription: user.business_description,
        businessType: user.business_type,
        streetAddress: user.street_address,
        zipCode: user.zip_code,
        phoneNumber: user.phone_number,
        websiteUrl: user.website_url,
        customInterests: user.custom_interests,
        customActivities: user.custom_activities,
        customEvents: user.custom_events,
        isMinorityOwned: user.is_minority_owned,
        isFemaleOwned: user.is_female_owned,
        isLGBTQIAOwned: user.is_lgbtqia_owned,
        showMinorityOwned: user.show_minority_owned,
        showFemaleOwned: user.show_female_owned,
        showLGBTQIAOwned: user.show_lgbtqia_owned,
      };
      
      return convertedUser;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  }

  // Quick Meetups methods (separate from regular events)
  async getQuickMeetupById(meetupId: number): Promise<any> {
    try {
      console.log(`🔍 GETTING MEETUP BY ID: ${meetupId}`);
      
      // Use raw SQL to bypass Drizzle column mapping issues
      console.log('🔍 About to execute SQL query');
      const result = await db.execute(sql`
        SELECT 
          qm.*,
          u.id as creator_id,
          u.username as creator_username,
          u.name as creator_name,
          u.profile_image as creator_profile_image
        FROM quick_meetups qm
        LEFT JOIN users u ON qm.organizer_id = u.id
        WHERE qm.id = ${meetupId}
        LIMIT 1
      `);
      
      console.log('🔍 SQL result:', result);
      console.log('🔍 SQL result rows length:', result.rows?.length);

      if (!result.rows || result.rows.length === 0) {
        console.log(`❌ MEETUP NOT FOUND: ID ${meetupId}`);
        return undefined;
      }

      const row = result.rows[0] as any;
      console.log('🔍 Raw row data:', row);
      
      const meetup = {
        id: row.id,
        organizerId: row.organizer_id,
        title: row.title,
        description: row.description,
        category: row.category,
        location: row.location,
        meetingPoint: row.meeting_point,
        street: row.street,
        city: row.city,
        state: row.state,
        country: row.country,
        zipcode: row.zipcode,
        availableAt: row.available_at,
        expiresAt: row.expires_at,
        maxParticipants: row.max_participants,
        minParticipants: row.min_participants,
        costEstimate: row.cost_estimate,
        availability: row.availability,
        responseTime: row.response_time,
        autoCancel: row.auto_cancel,
        isActive: row.is_active,
        participantCount: row.participant_count,
        createdAt: row.created_at,
        creator: row.creator_id ? {
          id: row.creator_id,
          username: row.creator_username,
          name: row.creator_name,
          profileImage: row.creator_profile_image
        } : null
      };

      console.log(`✅ FOUND MEETUP: ${meetup.title} by organizer ${meetup.organizerId}`);
      return meetup;
    } catch (error) {
      console.error('🚨 Error fetching quick meetup by ID:', error);
      console.error('🚨 Error stack:', error.stack);
      return undefined;
    }
  }

  async createQuickMeetup(meetup: any): Promise<any> {
    try {
      // Function to convert responseTime to milliseconds
      const getExpirationTime = (responseTime: string): number => {
        const timeMap: { [key: string]: number } = {
          "1hour": 1 * 60 * 60 * 1000,
          "2hours": 2 * 60 * 60 * 1000,
          "3hours": 3 * 60 * 60 * 1000,
          "6hours": 6 * 60 * 60 * 1000,
          "12hours": 12 * 60 * 60 * 1000,
          // Legacy support
          "30min": 30 * 60 * 1000,
          "30 minutes": 30 * 60 * 1000
        };
        return timeMap[responseTime] || timeMap["1hour"]; // Default to 1 hour if unknown
      };

      const responseTime = meetup.responseTime || "1hour";
      
      console.log(`🔧 STORAGE: Creating meetup with street address:`, meetup.street);
      
      const [newMeetup] = await db
        .insert(quickMeetups)
        .values({
          organizerId: meetup.organizerId,
          title: meetup.title,
          description: meetup.description,
          category: meetup.category || 'meetup',
          location: meetup.location,
          meetingPoint: meetup.meetingPoint,
          maxParticipants: meetup.maxParticipants,
          costEstimate: meetup.costEstimate,
          responseTime: responseTime,
          minParticipants: meetup.minParticipants || 1,
          autoCancel: meetup.autoCancel || false,
          street: meetup.street || '',
          city: meetup.city,
          state: meetup.state || '',
          country: meetup.country || 'United States',
          zipcode: meetup.zipcode || '',
          participantCount: 1,
          isActive: true,
          expiresAt: meetup.expiresAt ? new Date(meetup.expiresAt) : new Date(Date.now() + getExpirationTime(responseTime)),
          availableAt: new Date(),
          availability: 'available'
        })
        .returning();

      console.log(`✅ STORAGE: Created meetup with street address:`, newMeetup.street);

      // Auto-add creator as the first participant
      await db
        .insert(quickMeetupParticipants)
        .values({
          meetupId: newMeetup.id,
          userId: meetup.organizerId,
          status: 'joined'
        });
      
      // TODO: Add chatroom creation later
      
      return newMeetup;
    } catch (error) {
      console.error('Error creating quick meetup:', error);
      throw error;
    }
  }

  async getQuickMeetup(id: number): Promise<any> {
    try {
      const [meetup] = await db
        .select({
          id: quickMeetups.id,
          title: quickMeetups.title,
          description: quickMeetups.description,
          category: quickMeetups.category,
          location: quickMeetups.location,
          meetingPoint: quickMeetups.meetingPoint,
          date: quickMeetups.date,
          endDate: quickMeetups.endDate,
          organizerId: quickMeetups.organizerId,
          maxParticipants: quickMeetups.maxParticipants,
          eventType: quickMeetups.eventType,
          isSpontaneous: quickMeetups.isSpontaneous,
          costEstimate: quickMeetups.costEstimate,
          urgency: quickMeetups.urgency,
          responseTime: quickMeetups.responseTime,
          minParticipants: quickMeetups.minParticipants,
          autoCancel: quickMeetups.autoCancel,
          participantCount: quickMeetups.participantCount,
          city: quickMeetups.city,
          state: quickMeetups.state,
          country: quickMeetups.country,
          createdAt: quickMeetups.createdAt,
          organizer: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(quickMeetups)
        .leftJoin(users, eq(quickMeetups.organizerId, users.id))
        .where(eq(quickMeetups.id, id));

      return meetup;
    } catch (error) {
      console.error('Error fetching quick meetup:', error);
      return undefined;
    }
  }

  async getActiveQuickMeetups(city?: string): Promise<any[]> {
    try {
      console.log('Getting active quick meetups...');
      
      const now = new Date();
      console.log('Current time:', now.toISOString());
      
      // FIXED: Show ALL meetups (including expired) for daily reuse  
      let query = db
        .select()
        .from(quickMeetups)
        .where(eq(quickMeetups.isActive, true))
        .orderBy(desc(quickMeetups.createdAt))
        .limit(50);

      // Add city filtering if specified  
      if (city) {
        const cityName = city.split(',')[0].trim();
        console.log('Filtering by city:', cityName);
        query = db
          .select()
          .from(quickMeetups)
          .where(
            and(
              eq(quickMeetups.isActive, true),
              or(
                ilike(quickMeetups.location, `%${cityName}%`),
                ilike(quickMeetups.city, `%${cityName}%`)
              )
            )
          )
          .orderBy(desc(quickMeetups.createdAt))
          .limit(50);
      }
      
      console.log('Executing Drizzle query...');
      const result = await query;
      console.log('Drizzle query result:', result.length, 'meetups found');
      
      if (result.length === 0) {
        console.log('No active meetups found');
        return [];
      }
      
      // Enhance meetups with creator information and chatroom
      const enhancedMeetups = await Promise.all(
        result.map(async (meetup: any) => {
          const organizer = await this.getUser(meetup.organizerId);
          
          // Skip chatroom lookup for now to fix meetup display
          let chatroomId = null;
          
          return {
            ...meetup,
            creator: organizer ? {
              id: organizer.id,
              username: organizer.username,
              name: organizer.name,
              profileImage: organizer.profileImage
            } : null,
            creatorId: meetup.organizerId,
            currentParticipants: meetup.participantCount || 0,
            chatroomId: chatroomId,
            street: meetup.street // Ensure street is included
          };
        })
      );

      console.log('Enhanced active meetups:', enhancedMeetups.length);
      return enhancedMeetups;
    } catch (error) {
      console.error('Error fetching active quick meetups:', error);
      return [];
    }
  }

  async joinQuickMeetup(meetupId: number, userId: number): Promise<any> {
    try {
      // Check if already joined
      const [existing] = await db
        .select()
        .from(quickMeetupParticipants)
        .where(and(
          eq(quickMeetupParticipants.meetupId, meetupId),
          eq(quickMeetupParticipants.userId, userId)
        ));

      if (existing) {
        return existing;
      }

      // Add participant
      const [participant] = await db
        .insert(quickMeetupParticipants)
        .values({
          meetupId,
          userId,
          status: 'joined'
        })
        .returning();

      // Update participant count
      await db
        .update(quickMeetups)
        .set({
          participantCount: sql`${quickMeetups.participantCount} + 1`
        })
        .where(eq(quickMeetups.id, meetupId));

      return participant;
    } catch (error) {
      console.error('Error joining quick meetup:', error);
      throw error;
    }
  }

  async leaveQuickMeetup(meetupId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(quickMeetupParticipants)
        .where(and(
          eq(quickMeetupParticipants.meetupId, meetupId),
          eq(quickMeetupParticipants.userId, userId)
        ));

      if (result.rowCount && result.rowCount > 0) {
        // Update participant count
        await db
          .update(quickMeetups)
          .set({
            participantCount: sql`${quickMeetups.participantCount} - 1`
          })
          .where(eq(quickMeetups.id, meetupId));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error leaving quick meetup:', error);
      return false;
    }
  }

  async getUserArchivedMeetups(userId: number): Promise<any[]> {
    try {
      console.log('Getting archived meetups for user:', userId);
      
      const now = new Date();
      console.log('Current time:', now.toISOString());
      
      // Get expired meetups created by this user
      const result = await db
        .select()
        .from(quickMeetups)
        .where(
          and(
            eq(quickMeetups.organizerId, userId),
            lt(quickMeetups.expiresAt, now) // Expired meetups
          )
        )
        .orderBy(desc(quickMeetups.createdAt))
        .limit(50); // Show last 50 archived meetups

      console.log('Found archived meetups:', result.length);
      
      // Enhance with creator information (always the requesting user)
      const organizer = await this.getUser(userId);
      
      const enhancedMeetups = result.map((meetup: any) => ({
        ...meetup,
        creator: organizer ? {
          id: organizer.id,
          username: organizer.username,
          name: organizer.name,
          profileImage: organizer.profileImage
        } : null,
        creatorId: meetup.organizerId,
        currentParticipants: meetup.participantCount || 0,
        isArchived: true
      }));

      console.log('Enhanced archived meetups:', enhancedMeetups.length);
      return enhancedMeetups;
    } catch (error) {
      console.error('Error fetching archived quick meetups:', error);
      return [];
    }
  }

  async reinstateQuickMeetup(originalMeetupId: number, userId: number, newDuration: string = '4hours'): Promise<any> {
    try {
      console.log('Reinstating meetup:', originalMeetupId, 'for user:', userId);
      
      // Get the original meetup
      const [originalMeetup] = await db
        .select()
        .from(quickMeetups)
        .where(eq(quickMeetups.id, originalMeetupId));

      if (!originalMeetup) {
        throw new Error('Original meetup not found');
      }

      if (originalMeetup.organizerId !== userId) {
        throw new Error('User can only reinstate their own meetups');
      }

      // Calculate new expiration time based on duration
      const now = new Date();
      const expiresAt = new Date(now);
      
      switch (newDuration) {
        case '1hour':
          expiresAt.setHours(expiresAt.getHours() + 1);
          break;
        case '2hours':
          expiresAt.setHours(expiresAt.getHours() + 2);
          break;
        case '3hours':
          expiresAt.setHours(expiresAt.getHours() + 3);
          break;
        case '4hours':
        default:
          expiresAt.setHours(expiresAt.getHours() + 4);
          break;
        case '6hours':
          expiresAt.setHours(expiresAt.getHours() + 6);
          break;
        case '8hours':
          expiresAt.setHours(expiresAt.getHours() + 8);
          break;
        case '12hours':
          expiresAt.setHours(expiresAt.getHours() + 12);
          break;
        case '24hours':
          expiresAt.setDate(expiresAt.getDate() + 1);
          break;
      }

      // Create new meetup with same details but new timing
      const [newMeetup] = await db
        .insert(quickMeetups)
        .values({
          organizerId: originalMeetup.organizerId,
          title: originalMeetup.title,
          description: originalMeetup.description,
          category: originalMeetup.category,
          location: originalMeetup.location,
          meetingPoint: originalMeetup.meetingPoint,
          street: originalMeetup.street,
          city: originalMeetup.city,
          state: originalMeetup.state,
          country: originalMeetup.country,
          zipcode: originalMeetup.zipcode,
          availableAt: now,
          expiresAt: expiresAt,
          maxParticipants: originalMeetup.maxParticipants,
          minParticipants: originalMeetup.minParticipants,
          costEstimate: originalMeetup.costEstimate,
          availability: newDuration,
          responseTime: originalMeetup.responseTime,
          autoCancel: originalMeetup.autoCancel,
          isActive: true,
          participantCount: 1 // Creator automatically joins
        })
        .returning();

      // Add creator as participant
      await db
        .insert(quickMeetupParticipants)
        .values({
          meetupId: newMeetup.id,
          userId: userId,
          status: 'joined',
          notes: 'Creator of reinstated meetup'
        });

      console.log('Successfully reinstated meetup with ID:', newMeetup.id);
      return newMeetup;
    } catch (error) {
      console.error('Error reinstating quick meetup:', error);
      throw error;
    }
  }

  async getQuickMeetupParticipants(meetupId: number): Promise<any[]> {
    try {
      const participants = await db
        .select({
          id: quickMeetupParticipants.id,
          meetupId: quickMeetupParticipants.meetupId,
          userId: quickMeetupParticipants.userId,
          status: quickMeetupParticipants.status,
          joinedAt: quickMeetupParticipants.joinedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(quickMeetupParticipants)
        .leftJoin(users, eq(quickMeetupParticipants.userId, users.id))
        .where(eq(quickMeetupParticipants.meetupId, meetupId));

      return participants;
    } catch (error) {
      console.error('Error fetching quick meetup participants:', error);
      return [];
    }
  }



  async getUserQuickMeetups(userId: number): Promise<any[]> {
    try {
      const meetups = await db
        .select({
          id: quickMeetups.id,
          title: quickMeetups.title,
          description: quickMeetups.description,
          category: quickMeetups.category,
          location: quickMeetups.location,
          date: quickMeetups.date,
          participantCount: quickMeetups.participantCount,
          urgency: quickMeetups.urgency,
          responseTime: quickMeetups.responseTime
        })
        .from(quickMeetups)
        .innerJoin(quickMeetupParticipants, eq(quickMeetups.id, quickMeetupParticipants.meetupId))
        .where(eq(quickMeetupParticipants.userId, userId))
        .orderBy(desc(quickMeetups.createdAt));

      return meetups;
    } catch (error) {
      console.error('Error fetching user quick meetups:', error);
      return [];
    }
  }

  async updateQuickMeetup(id: number, updates: any): Promise<any> {
    try {
      const [updatedMeetup] = await db
        .update(quickMeetups)
        .set(updates)
        .where(eq(quickMeetups.id, id))
        .returning();

      return updatedMeetup;
    } catch (error) {
      console.error('Error updating quick meetup:', error);
      return undefined;
    }
  }

  async deleteQuickMeetup(id: number): Promise<boolean> {
    try {
      // Delete participants first
      await db.delete(quickMeetupParticipants).where(eq(quickMeetupParticipants.meetupId, id));
      
      // Delete meetup chatroom messages and chatrooms (following same pattern as expireOldQuickMeetups)
      const meetupChatroomsList = await db
        .select({ id: meetupChatrooms.id })
        .from(meetupChatrooms)
        .where(eq(meetupChatrooms.meetupId, id));
      
      for (const chatroom of meetupChatroomsList) {
        await db.delete(meetupChatroomMessages).where(eq(meetupChatroomMessages.meetupChatroomId, chatroom.id));
      }
      
      await db.delete(meetupChatrooms).where(eq(meetupChatrooms.meetupId, id));
      
      // Delete meetup
      const result = await db.delete(quickMeetups).where(eq(quickMeetups.id, id));
      
      return result.rowCount !== undefined && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting quick meetup:', error);
      return false;
    }
  }

  async expireOldQuickMeetups(): Promise<void> {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      // Get old meetups to delete participants first
      const oldMeetups = await db
        .select({ id: quickMeetups.id })
        .from(quickMeetups)
        .where(lte(quickMeetups.date, sixHoursAgo));

      // Delete participants and chatrooms for expired meetups
      for (const meetup of oldMeetups) {
        await db.delete(quickMeetupParticipants).where(eq(quickMeetupParticipants.meetupId, meetup.id));
        
        // Delete meetup chatroom messages and chatrooms
        const meetupChatrooms = await db
          .select({ id: meetupChatrooms.id })
          .from(meetupChatrooms)
          .where(eq(meetupChatrooms.meetupId, meetup.id));
        
        for (const chatroom of meetupChatrooms) {
          await db.delete(meetupChatroomMessages).where(eq(meetupChatroomMessages.meetupChatroomId, chatroom.id));
        }
        
        await db.delete(meetupChatrooms).where(eq(meetupChatrooms.meetupId, meetup.id));
      }

      // Delete expired meetups
      await db.delete(quickMeetups).where(lte(quickMeetups.date, sixHoursAgo));
      
      console.log(`Expired ${oldMeetups.length} old quick meetups and their chatrooms`);
    } catch (error) {
      console.error('Error expiring old quick meetups:', error);
    }
  }

  // Quick Meetup Chatroom methods (using meetup_chatrooms table)
  async getQuickMeetupChatroom(meetupId: number): Promise<any | undefined> {
    try {
      const [chatroom] = await db
        .select()
        .from(meetupChatrooms)
        .where(and(
          eq(meetupChatrooms.meetupId, meetupId),
          eq(meetupChatrooms.isActive, true)
        ));
      
      return chatroom;
    } catch (error) {
      console.error('Error fetching quick meetup chatroom:', error);
      return undefined;
    }
  }

  async createQuickMeetupChatroom(meetupId: number): Promise<any> {
    try {
      // Get meetup details for chatroom name and location
      const meetup = await this.getQuickMeetup(meetupId);
      if (!meetup) {
        throw new Error('Quick meetup not found');
      }

      const [chatroom] = await db.insert(meetupChatrooms).values({
        meetupId: meetupId,
        chatroomName: `${meetup.title} - Group Chat`,
        description: `Group chat for the ${meetup.title} meetup`,
        city: meetup.city,
        state: meetup.state,
        country: meetup.country,
        isActive: true,
        expiresAt: new Date(meetup.expiresAt),
        participantCount: 0
      }).returning();

      console.log(`Created Quick Meetup chatroom: ${chatroom.chatroomName} for meetup ${meetupId}`);
      return chatroom;
    } catch (error) {
      console.error('Error creating quick meetup chatroom:', error);
      throw error;
    }
  }

  async getQuickMeetupChatroomMessages(chatroomId: number): Promise<any[]> {
    try {
      const messages = await db
        .select({
          id: meetupChatroomMessages.id,
          message: meetupChatroomMessages.message,
          userId: meetupChatroomMessages.userId,
          username: meetupChatroomMessages.username,
          sentAt: meetupChatroomMessages.sentAt,
          messageType: meetupChatroomMessages.messageType,
          sender: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(meetupChatroomMessages)
        .leftJoin(users, eq(meetupChatroomMessages.userId, users.id))
        .where(eq(meetupChatroomMessages.meetupChatroomId, chatroomId))
        .orderBy(asc(meetupChatroomMessages.sentAt));

      return messages;
    } catch (error) {
      console.error('Error fetching quick meetup chatroom messages:', error);
      return [];
    }
  }

  async createQuickMeetupChatroomMessage(chatroomId: number, senderId: number, content: string): Promise<any> {
    try {
      // Get sender info first
      const sender = await db.select().from(users).where(eq(users.id, senderId)).limit(1);
      if (!sender[0]) {
        throw new Error('Sender not found');
      }

      const [message] = await db.insert(meetupChatroomMessages).values({
        meetupChatroomId: chatroomId,
        userId: senderId,
        username: sender[0].username,
        message: content,
        messageType: 'text'
      }).returning();

      // Return message with sender info
      return {
        id: message.id,
        message: message.message,
        userId: message.userId,
        username: message.username,
        sentAt: message.sentAt,
        messageType: message.messageType,
        sender: {
          id: sender[0].id,
          username: sender[0].username,
          name: sender[0].name,
          profileImage: sender[0].profileImage
        }
      };
    } catch (error) {
      console.error('Error creating quick meetup chatroom message:', error);
      throw error;
    }
  }

  async joinQuickMeetupChatroom(chatroomId: number, userId: number): Promise<any> {
    try {
      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(chatroomMembers)
        .where(and(
          eq(chatroomMembers.chatroomId, chatroomId),
          eq(chatroomMembers.userId, userId)
        ))
        .limit(1);

      if (existingMember.length > 0) {
        return existingMember[0];
      }

      // Add user as chatroom member
      const [member] = await db.insert(chatroomMembers).values({
        chatroomId: chatroomId,
        userId: userId,
        role: 'member'
      }).returning();

      return member;
    } catch (error) {
      console.error('Error joining quick meetup chatroom:', error);
      throw error;
    }
  }

  // Meetup Chatrooms methods (automatic expiring chatrooms for meetup participants)
  async createMeetupChatroom(chatroomData: InsertMeetupChatroom): Promise<MeetupChatroom> {
    try {
      const [chatroom] = await db.insert(meetupChatrooms).values(chatroomData).returning();
      console.log(`Created meetup chatroom: ${chatroom.chatroomName} for meetup ${chatroom.meetupId}`);
      return chatroom;
    } catch (error) {
      console.error('Error creating meetup chatroom:', error);
      throw error;
    }
  }

  async getMeetupChatroom(meetupId: number): Promise<MeetupChatroom | undefined> {
    try {
      const [chatroom] = await db
        .select()
        .from(meetupChatrooms)
        .where(and(
          eq(meetupChatrooms.meetupId, meetupId),
          eq(meetupChatrooms.isActive, true)
        ));
      
      return chatroom;
    } catch (error) {
      console.error('Error fetching meetup chatroom:', error);
      return undefined;
    }
  }

  async getMeetupChatroomMessages(meetupChatroomId: number): Promise<any[]> {
    try {
      console.log('🔍 Fetching messages for meetup chatroom ID:', meetupChatroomId);
      
      const messages = await db
        .select({
          id: chatroomMessages.id,
          senderId: chatroomMessages.senderId,
          content: chatroomMessages.content,
          messageType: chatroomMessages.messageType,
          createdAt: chatroomMessages.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(chatroomMessages)
        .leftJoin(users, eq(chatroomMessages.senderId, users.id))
        .where(eq(chatroomMessages.chatroomId, meetupChatroomId))
        .orderBy(chatroomMessages.createdAt);

      console.log('✅ Found', messages.length, 'messages for meetup chatroom');
      return messages;
    } catch (error) {
      console.error('❌ Error fetching meetup chatroom messages:', error);
      return [];
    }
  }

  async sendMeetupChatroomMessage(meetupChatroomId: number, userId: number, username: string, message: string): Promise<any> {
    try {
      console.log('🟢 Sending meetup chatroom message:', { meetupChatroomId, userId, username, message });
      
      const [newMessage] = await db
        .insert(chatroomMessages)
        .values({
          chatroomId: meetupChatroomId,
          senderId: userId,
          content: message,
          messageType: 'text'
        })
        .returning();

      console.log('✅ Message inserted successfully:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('❌ Error sending meetup chatroom message:', error);
      throw error;
    }
  }

  async getUserMeetupChatrooms(userId: number): Promise<any[]> {
    try {
      // Get user's active meetups and their chatrooms
      const userMeetupChatrooms = await db
        .select({
          chatroom: meetupChatrooms,
          meetup: {
            id: quickMeetups.id,
            title: quickMeetups.title,
            category: quickMeetups.category,
            date: quickMeetups.date,
            endDate: quickMeetups.endDate,
            participantCount: quickMeetups.participantCount
          }
        })
        .from(meetupChatrooms)
        .innerJoin(quickMeetups, eq(meetupChatrooms.meetupId, quickMeetups.id))
        .innerJoin(quickMeetupParticipants, and(
          eq(quickMeetupParticipants.meetupId, quickMeetups.id),
          eq(quickMeetupParticipants.userId, userId),
          eq(quickMeetupParticipants.status, 'joined')
        ))
        .where(and(
          eq(meetupChatrooms.isActive, true),
          gte(meetupChatrooms.expiresAt, new Date()) // Not expired
        ))
        .orderBy(desc(quickMeetups.date));

      return userMeetupChatrooms;
    } catch (error) {
      console.error('Error fetching user meetup chatrooms:', error);
      return [];
    }
  }

  async isMeetupChatroomParticipant(chatroomId: number, userId: number): Promise<boolean> {
    try {
      console.log(`🔒 Checking if user ${userId} is participant in chatroom ${chatroomId}`);
      
      // Get the meetup ID from the chatroom
      const [chatroom] = await db
        .select({ meetupId: meetupChatrooms.meetupId })
        .from(meetupChatrooms)
        .where(eq(meetupChatrooms.id, chatroomId))
        .limit(1);
      
      if (!chatroom) {
        console.log(`❌ Chatroom ${chatroomId} not found`);
        return false;
      }
      
      // Check if user is a participant in this meetup
      const [participant] = await db
        .select({ id: quickMeetupParticipants.id })
        .from(quickMeetupParticipants)
        .where(and(
          eq(quickMeetupParticipants.meetupId, chatroom.meetupId),
          eq(quickMeetupParticipants.userId, userId),
          eq(quickMeetupParticipants.status, 'joined')
        ))
        .limit(1);
      
      const isParticipant = !!participant;
      console.log(`${isParticipant ? '✅' : '❌'} User ${userId} participant status for meetup ${chatroom.meetupId}: ${isParticipant}`);
      
      return isParticipant;
    } catch (error) {
      console.error('Error checking meetup chatroom participant status:', error);
      return false;
    }
  }

  // Event Chatroom Methods (using existing city chatroom infrastructure)
  async getEventChatroom(eventId: number): Promise<any> {
    try {
      // For now, use a simplified approach that reuses existing chatroom infrastructure
      // Look for a chatroom with the event ID in the name or description
      const [chatroom] = await db
        .select()
        .from(citychatrooms)
        .where(
          and(
            ilike(citychatrooms.name, `%Event ${eventId}%`),
            eq(citychatrooms.isActive, true)
          )
        )
        .limit(1);
      
      return chatroom;
    } catch (error) {
      console.error('Error fetching event chatroom:', error);
      return undefined;
    }
  }

  async createEventChatroom(data: any): Promise<any> {
    try {
      // Create a dedicated chatroom for the event using existing infrastructure
      const chatroom = await this.createCityChatroom({
        name: `Event ${data.eventId} Chat`,
        description: data.description || `Chat room for event: ${data.name}`,
        city: 'Global', // Events can be global
        state: null,
        country: 'Global',
        createdById: 2, // nearbytraveler as system user
        isPublic: data.isPublic !== false,
        maxMembers: data.maxMembers || 100,
        tags: ['event', 'chat', `event-${data.eventId}`],
        rules: 'Be respectful and stay on topic related to the event.'
      });
      
      return chatroom;
    } catch (error) {
      console.error('Error creating event chatroom:', error);
      throw error;
    }
  }

  // Event Chatroom Message Methods
  async getEventChatroomMessages(chatroomId: number): Promise<any[]> {
    try {
      // Since event chatrooms use the city chatroom infrastructure, 
      // we can use the existing city chatroom message methods
      return await this.getChatroomMessages(chatroomId);
    } catch (error) {
      console.error('Error fetching event chatroom messages:', error);
      return [];
    }
  }

  async createEventChatroomMessage(chatroomId: number, senderId: number, content: string): Promise<any> {
    try {
      // Since event chatrooms use the city chatroom infrastructure,
      // we can use the existing city chatroom message methods
      return await this.createChatroomMessage(chatroomId, senderId, content);
    } catch (error) {
      console.error('Error creating event chatroom message:', error);
      throw error;
    }
  }

  async joinEventChatroom(chatroomId: number, userId: number): Promise<any> {
    try {
      // Since event chatrooms use the city chatroom infrastructure,
      // we can use the existing city chatroom join method
      return await this.joinChatroom(chatroomId, userId);
    } catch (error) {
      console.error('Error joining event chatroom:', error);
      throw error;
    }
  }

  async getMeetupChatroom(meetupId: number): Promise<any> {
    try {
      // Look for existing meetup chatroom using the existing infrastructure
      const [chatroom] = await db
        .select()
        .from(meetupChatrooms)
        .where(
          and(
            eq(meetupChatrooms.meetupId, meetupId),
            eq(meetupChatrooms.isActive, true)
          )
        )
        .limit(1);
      
      if (chatroom) {
        return chatroom;
      }
      
      // Fallback: look in city chatrooms
      const [cityChatroom] = await db
        .select()
        .from(citychatrooms)
        .where(
          and(
            ilike(citychatrooms.name, `%Meetup ${meetupId}%`),
            eq(citychatrooms.isActive, true)
          )
        )
        .limit(1);
      
      return cityChatroom;
    } catch (error) {
      console.error('Error fetching meetup chatroom:', error);
      return undefined;
    }
  }

  async createMeetupChatroom(data: any): Promise<any> {
    try {
      // Try to create using existing meetup chatrooms table first
      if (db.schema && meetupChatrooms) {
        try {
          const [meetupChatroom] = await db.insert(meetupChatrooms).values({
            meetupId: data.meetupId,
            chatroomName: data.name,
            description: data.description,
            isActive: true,
            maxMembers: data.maxMembers || 20,
            expiresAt: new Date(Date.now() + (6 * 60 * 60 * 1000)) // 6 hours from now
          }).returning();
          
          return meetupChatroom;
        } catch (meetupError) {
          console.log('Meetup chatroom table not available, using city chatroom fallback');
        }
      }
      
      // Fallback: create using city chatroom infrastructure
      const chatroom = await this.createCityChatroom({
        name: `Meetup ${data.meetupId} Chat`,
        description: data.description || `Chat room for meetup: ${data.name}`,
        city: 'Global',
        state: null,
        country: 'Global',
        createdById: 2, // nearbytraveler as system user
        isPublic: data.isPublic !== false,
        maxMembers: data.maxMembers || 20,
        tags: ['meetup', 'chat', `meetup-${data.meetupId}`],
        rules: 'Be respectful and enjoy meeting new people!'
      });
      
      return chatroom;
    } catch (error) {
      console.error('Error creating meetup chatroom:', error);
      throw error;
    }
  }

  async sendChatroomMessage(chatroomId: number, userId: number, content: string): Promise<any> {
    try {
      // Use existing chatroom message system
      const [message] = await db.insert(chatroomMessages).values({
        chatroomId,
        senderId: userId,
        content,
        messageType: 'text',
        createdAt: new Date()
      }).returning();
      
      // Get the message with sender info
      const [messageWithSender] = await db
        .select({
          id: chatroomMessages.id,
          content: chatroomMessages.content,
          senderId: chatroomMessages.senderId,
          createdAt: chatroomMessages.createdAt,
          sender: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(chatroomMessages)
        .leftJoin(users, eq(chatroomMessages.senderId, users.id))
        .where(eq(chatroomMessages.id, message.id));
      
      return messageWithSender;
    } catch (error) {
      console.error('Error sending chatroom message:', error);
      throw error;
    }
  }

  async getChatroomMessages(chatroomId: number): Promise<any[]> {
    try {
      const messages = await db
        .select({
          id: chatroomMessages.id,
          content: chatroomMessages.content,
          senderId: chatroomMessages.senderId,
          messageType: chatroomMessages.messageType,
          createdAt: chatroomMessages.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(chatroomMessages)
        .leftJoin(users, eq(chatroomMessages.senderId, users.id))
        .where(eq(chatroomMessages.chatroomId, chatroomId))
        .orderBy(asc(chatroomMessages.createdAt))
        .limit(100); // Limit to last 100 messages
      
      return messages;
    } catch (error) {
      console.error('Error fetching chatroom messages:', error);
      return [];
    }
  }

  async joinChatroom(chatroomId: number, userId: number): Promise<any> {
    try {
      // Check if already a member
      const [existingMember] = await db
        .select()
        .from(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.chatroomId, chatroomId),
            eq(chatroomMembers.userId, userId)
          )
        );
      
      if (existingMember) {
        // Update to active if inactive and award aura for rejoining
        if (!existingMember.isActive) {
          await db
            .update(chatroomMembers)
            .set({ isActive: true, joinedAt: new Date() })
            .where(
              and(
                eq(chatroomMembers.chatroomId, chatroomId),
                eq(chatroomMembers.userId, userId)
              )
            );
          
          // Award 1 aura for rejoining chatroom
          await this.awardAura(userId, 1, 'rejoining chatroom');
        }
        return existingMember;
      }
      
      // Add as new member
      const [newMember] = await db
        .insert(chatroomMembers)
        .values({
          chatroomId,
          userId,
          role: 'member',
          isActive: true,
          joinedAt: new Date()
        })
        .returning();
      
      // Award 1 aura for joining chatroom
      await this.awardAura(userId, 1, 'joining chatroom');
      
      return newMember;
    } catch (error) {
      console.error('Error joining chatroom:', error);
      throw error;
    }
  }

  async getQuickMeetup(meetupId: number): Promise<any> {
    try {
      const [meetup] = await db
        .select({
          id: quickMeetups.id,
          title: quickMeetups.title,
          description: quickMeetups.description,
          organizerId: quickMeetups.organizerId,
          location: quickMeetups.location,
          meetingPoint: quickMeetups.meetingPoint,
          city: quickMeetups.city,
          state: quickMeetups.state,
          country: quickMeetups.country,
          availableAt: quickMeetups.availableAt,
          expiresAt: quickMeetups.expiresAt,
          maxParticipants: quickMeetups.maxParticipants,
          participantCount: quickMeetups.participantCount,
          isActive: quickMeetups.isActive,
          category: quickMeetups.category,
          createdAt: quickMeetups.createdAt
        })
        .from(quickMeetups)
        .where(eq(quickMeetups.id, meetupId));
      
      return meetup;
    } catch (error) {
      console.error('Error fetching quick meetup:', error);
      return undefined;
    }
  }

  async getEvent(eventId: number): Promise<any> {
    try {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId));
      
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      return undefined;
    }
  }

  // Quick Meetup Template Methods
  async createQuickMeetupTemplate(templateData: InsertQuickMeetupTemplate): Promise<QuickMeetupTemplate> {
    try {
      const [template] = await db
        .insert(quickMeetupTemplates)
        .values(templateData)
        .returning();
      return template;
    } catch (error) {
      console.error('Error creating quick meetup template:', error);
      throw error;
    }
  }

  async getUserQuickMeetupTemplates(userId: number): Promise<QuickMeetupTemplate[]> {
    try {
      const templates = await db
        .select()
        .from(quickMeetupTemplates)
        .where(and(
          eq(quickMeetupTemplates.userId, userId),
          eq(quickMeetupTemplates.isActive, true)
        ))
        .orderBy(desc(quickMeetupTemplates.lastUsedAt), desc(quickMeetupTemplates.timesUsed));
      return templates;
    } catch (error) {
      console.error('Error fetching user quick meetup templates:', error);
      return [];
    }
  }

  async useQuickMeetupTemplate(templateId: number): Promise<QuickMeetupTemplate | undefined> {
    try {
      const [template] = await db
        .update(quickMeetupTemplates)
        .set({
          timesUsed: sql`${quickMeetupTemplates.timesUsed} + 1`,
          lastUsedAt: new Date()
        })
        .where(eq(quickMeetupTemplates.id, templateId))
        .returning();
      return template;
    } catch (error) {
      console.error('Error using quick meetup template:', error);
      return undefined;
    }
  }

  async updateQuickMeetupTemplate(id: number, updates: Partial<QuickMeetupTemplate>): Promise<QuickMeetupTemplate | undefined> {
    try {
      const [template] = await db
        .update(quickMeetupTemplates)
        .set(updates)
        .where(eq(quickMeetupTemplates.id, id))
        .returning();
      return template;
    } catch (error) {
      console.error('Error updating quick meetup template:', error);
      return undefined;
    }
  }

  async deleteQuickMeetupTemplate(id: number): Promise<boolean> {
    try {
      const [template] = await db
        .update(quickMeetupTemplates)
        .set({ isActive: false })
        .where(eq(quickMeetupTemplates.id, id))
        .returning();
      return !!template;
    } catch (error) {
      console.error('Error deleting quick meetup template:', error);
      return false;
    }
  }



  // Blocking methods
  async blockUser(blockerId: number, blockedId: number, reason?: string): Promise<boolean> {
    try {
      // Check if user is already blocked
      const existingBlock = await db
        .select()
        .from(blockedUsers)
        .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)))
        .limit(1);

      if (existingBlock.length > 0) {
        return false; // Already blocked
      }

      // Get user details for email notification
      const [blocker, blocked] = await Promise.all([
        db.select().from(users).where(eq(users.id, blockerId)).limit(1),
        db.select().from(users).where(eq(users.id, blockedId)).limit(1)
      ]);

      // Create the block
      await db.insert(blockedUsers).values({
        blockerId,
        blockedId,
        reason: reason || 'No reason provided',
      });

      // Remove any existing connections between the users
      await db
        .delete(connections)
        .where(
          or(
            and(eq(connections.requesterId, blockerId), eq(connections.receiverId, blockedId)),
            and(eq(connections.requesterId, blockedId), eq(connections.receiverId, blockerId))
          )
        );

      // Send email notification to security
      if (blocker[0] && blocked[0]) {
        const { sendBlockingNotification, sendMultipleBlocksAlert } = await import('./services/securityEmailService');
        
        await sendBlockingNotification({
          blockerUsername: blocker[0].username,
          blockerEmail: blocker[0].email,
          blockedUsername: blocked[0].username,
          blockedEmail: blocked[0].email,
          reason: reason || 'No reason provided',
          timestamp: new Date()
        });

        // Check if blocked user has multiple blocks
        const blockCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(blockedUsers)
          .where(eq(blockedUsers.blockedId, blockedId));

        if (blockCount[0]?.count >= 3) {
          await sendMultipleBlocksAlert(
            blocked[0].username,
            blocked[0].email,
            blockCount[0].count
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(blockedUsers)
        .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(blockedUsers)
        .where(
          or(
            and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)),
            and(eq(blockedUsers.blockerId, blockedId), eq(blockedUsers.blockedId, blockerId))
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  async getBlockedUsers(userId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: blockedUsers.id,
          blockedUser: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
          },
          reason: blockedUsers.reason,
          createdAt: blockedUsers.blockedAt,
        })
        .from(blockedUsers)
        .innerJoin(users, eq(blockedUsers.blockedId, users.id))
        .where(eq(blockedUsers.blockerId, userId))
        .orderBy(desc(blockedUsers.blockedAt));

      return result;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  async getUsersWhoBlockedMe(userId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: blockedUsers.id,
          blocker: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
          },
          reason: blockedUsers.reason,
          createdAt: blockedUsers.blockedAt,
        })
        .from(blockedUsers)
        .innerJoin(users, eq(blockedUsers.blockerId, users.id))
        .where(eq(blockedUsers.blockedId, userId))
        .orderBy(desc(blockedUsers.blockedAt));

      return result;
    } catch (error) {
      console.error('Error getting users who blocked me:', error);
      return [];
    }
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(blockedUsers)
        .where(and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        ));
      
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  // Notification Settings methods
  async getUserNotificationSettings(userId: number): Promise<UserNotificationSettings | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, userId));

      // If no settings exist, create default settings
      if (!settings) {
        return await this.createUserNotificationSettings({ userId });
      }

      return settings;
    } catch (error) {
      console.error('Error getting user notification settings:', error);
      return undefined;
    }
  }

  async createUserNotificationSettings(settings: InsertUserNotificationSettings): Promise<UserNotificationSettings> {
    try {
      const [newSettings] = await db
        .insert(userNotificationSettings)
        .values({
          ...settings,
          // Set default values if not provided
          emailNotifications: settings.emailNotifications ?? true,
          eventReminders: settings.eventReminders ?? true,
          connectionAlerts: settings.connectionAlerts ?? true,
          messageNotifications: settings.messageNotifications ?? true,
          weeklyDigest: settings.weeklyDigest ?? true,
          marketingEmails: settings.marketingEmails ?? false,
          pushNotifications: settings.pushNotifications ?? true,
          mobileAlerts: settings.mobileAlerts ?? true,
          profileVisibility: settings.profileVisibility ?? "public",
          locationSharing: settings.locationSharing ?? true,
          photoPermissions: settings.photoPermissions ?? "friends",
          messageRequests: settings.messageRequests ?? true,
          eventInvitations: settings.eventInvitations ?? true,
          connectionRequests: settings.connectionRequests ?? true,
        })
        .returning();

      return newSettings;
    } catch (error) {
      console.error('Error creating user notification settings:', error);
      throw error;
    }
  }

  async updateUserNotificationSettings(userId: number, updates: Partial<UserNotificationSettings>): Promise<UserNotificationSettings | undefined> {
    try {
      const [updatedSettings] = await db
        .update(userNotificationSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userNotificationSettings.userId, userId))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error('Error updating user notification settings:', error);
      return undefined;
    }
  }

  // Privacy enforcement methods
  async canViewProfile(viewerId: number, targetUserId: number): Promise<boolean> {
    if (viewerId === targetUserId) return true;

    // Check if blocked
    const isBlocked = await this.isUserBlocked(targetUserId, viewerId) || await this.isUserBlocked(viewerId, targetUserId);
    if (isBlocked) return false;

    const targetSettings = await this.getUserNotificationSettings(targetUserId);
    if (!targetSettings) return true; // Default to public if no settings

    switch (targetSettings.profileVisibility) {
      case 'private':
        return false;
      case 'connections':
        const connection = await this.getConnection(viewerId, targetUserId);
        return connection?.status === 'accepted';
      case 'public':
      default:
        return true;
    }
  }

  async canSendMessage(senderId: number, recipientId: number): Promise<boolean> {
    if (senderId === recipientId) return false;

    // Check if blocked
    const isBlocked = await this.isUserBlocked(recipientId, senderId) || await this.isUserBlocked(senderId, recipientId);
    if (isBlocked) return false;

    const recipientSettings = await this.getUserNotificationSettings(recipientId);
    if (!recipientSettings || recipientSettings.messageRequests !== false) return true;

    // Check if they're connected
    const connection = await this.getConnection(senderId, recipientId);
    return connection?.status === 'accepted';
  }

  async canSendConnectionRequest(senderId: number, recipientId: number): Promise<boolean> {
    if (senderId === recipientId) return false;

    // Check if blocked
    const isBlocked = await this.isUserBlocked(recipientId, senderId) || await this.isUserBlocked(senderId, recipientId);
    if (isBlocked) return false;

    const recipientSettings = await this.getUserNotificationSettings(recipientId);
    if (!recipientSettings || recipientSettings.connectionRequests !== false) return true;

    return false; // Connection requests disabled
  }

  async canInviteToEvent(inviterId: number, inviteeId: number): Promise<boolean> {
    if (inviterId === inviteeId) return true;

    // Check if blocked
    const isBlocked = await this.isUserBlocked(inviteeId, inviterId) || await this.isUserBlocked(inviterId, inviteeId);
    if (isBlocked) return false;

    const inviteeSettings = await this.getUserNotificationSettings(inviteeId);
    if (!inviteeSettings || inviteeSettings.eventInvitations !== false) return true;

    // Check if they're connected
    const connection = await this.getConnection(inviterId, inviteeId);
    return connection?.status === 'accepted';
  }

  async canViewPhotos(viewerId: number, targetUserId: number): Promise<boolean> {
    if (viewerId === targetUserId) return true;

    // Check if blocked
    const isBlocked = await this.isUserBlocked(targetUserId, viewerId) || await this.isUserBlocked(viewerId, targetUserId);
    if (isBlocked) return false;

    const targetSettings = await this.getUserNotificationSettings(targetUserId);
    if (!targetSettings) return true; // Default to everyone

    switch (targetSettings.photoPermissions) {
      case 'none':
        return false;
      case 'friends':
        const connection = await this.getConnection(viewerId, targetUserId);
        return connection?.status === 'accepted';
      case 'everyone':
      default:
        return true;
    }
  }

  async getCityPhotosByUser(userId: number): Promise<CityPhoto[]> {
    try {
      const photos = await db
        .select()
        .from(cityPhotos)
        .where(eq(cityPhotos.uploadedBy, userId))
        .orderBy(desc(cityPhotos.uploadedAt));
      return photos;
    } catch (error) {
      console.error('Error fetching city photos by user:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db
        .select()
        .from(users)
        .orderBy(asc(users.id));
      return allUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // City Activity methods
  async createCityActivity(activity: any): Promise<any> {
    try {
      const [newActivity] = await db.insert(cityActivities).values({
        cityName: activity.cityName || activity.city,
        state: activity.state || '',
        country: activity.country || 'United States',
        activityName: activity.activityName,
        description: activity.description || '',
        category: activity.category || 'general',
        createdByUserId: activity.createdByUserId,
        isActive: true
      }).returning();

      return newActivity;
    } catch (error) {
      console.error('Error creating city activity:', error);
      throw error;
    }
  }

  async updateCityActivity(id: number, updates: any): Promise<any> {
    try {
      const [updatedActivity] = await db.update(cityActivities)
        .set(updates)
        .where(eq(cityActivities.id, id))
        .returning();

      return updatedActivity;
    } catch (error) {
      console.error('Error updating city activity:', error);
      throw error;
    }
  }

  async deleteCityActivity(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cityActivities)
        .where(eq(cityActivities.id, id));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting city activity:', error);
      return false;
    }
  }

  // Activity match methods
  async createActivityMatch(data: { activityId: number; userId: number }): Promise<any> {
    try {
      const [newMatch] = await db.insert(userCityInterests).values({
        userId: data.userId,
        activityId: data.activityId,
        cityName: '', // Will be filled from activity data
        activityName: '',
        isActive: true
      }).returning();
      
      return newMatch;
    } catch (error) {
      console.error('Error creating activity match:', error);
      throw error;
    }
  }

  async getActivityMatches(activityId: number): Promise<any[]> {
    try {
      const matches = await db
        .select({
          id: userCityInterests.id,
          userId: userCityInterests.userId,
          activityId: userCityInterests.activityId,
          cityName: userCityInterests.cityName,
          activityName: userCityInterests.activityName,
          isActive: userCityInterests.isActive,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        })
        .from(userCityInterests)
        .innerJoin(users, eq(userCityInterests.userId, users.id))
        .where(
          and(
            eq(userCityInterests.activityId, activityId),
            eq(userCityInterests.isActive, true)
          )
        );
      
      return matches;
    } catch (error) {
      console.error('Error getting activity matches:', error);
      return [];
    }
  }

  async getUserActivityMatches(userId: number): Promise<any[]> {
    try {
      const matches = await db
        .select({
          id: userCityInterests.id,
          userId: userCityInterests.userId,
          activityId: userCityInterests.activityId,
          cityName: userCityInterests.cityName,
          activityName: userCityInterests.activityName,
          isActive: userCityInterests.isActive,
          createdAt: userCityInterests.createdAt
        })
        .from(userCityInterests)
        .where(
          and(
            eq(userCityInterests.userId, userId),
            eq(userCityInterests.isActive, true)
          )
        );
      
      return matches;
    } catch (error) {
      console.error('Error getting user activity matches:', error);
      return [];
    }
  }
  // CRITICAL: Create business user (FIXED FIELD MAPPING!)
  async createBusinessUser(businessData: any): Promise<any> {
    try {
      console.log("🏢 STORAGE: Creating business user with data:", businessData);
      console.log("🏢 STORAGE: Available fields in businessData:", Object.keys(businessData));
      
      // Create the business user account with CORRECT database field names
      const [newUser] = await db.insert(users).values({
        username: businessData.username,
        email: businessData.email,
        password: businessData.password, // In real app, this should be hashed
        name: businessData.businessName || businessData.name, // Use business name as the user's name
        userType: 'business',
        hometownCity: businessData.city,
        hometownState: businessData.state || 'California',
        hometownCountry: businessData.country || 'United States',
        location: businessData.city ? `${businessData.city}, California` : null,
        hometown: businessData.city ? `${businessData.city}, California, United States` : null,
        isCurrentlyTraveling: false,
        
        // Business-specific fields with CORRECT database column names
        business_name: businessData.businessName || businessData.business_name,
        business_type: businessData.businessType || businessData.business_type,
        business_description: businessData.businessDescription || businessData.business_description || null,
        website: businessData.businessWebsite || businessData.website || null,
        streetAddress: businessData.streetAddress || businessData.street_address,
        zipCode: businessData.zipCode || businessData.zipcode,
        phoneNumber: businessData.businessPhone || businessData.phone,
        interests: businessData.interests || [],
        activities: businessData.activities || []
      }).returning();

      console.log("🏢 STORAGE: Business user created successfully with ID:", newUser.id);
      console.log("🏢 STORAGE: Business data stored:", {
        business_name: newUser.business_name,
        business_type: newUser.business_type,
        business_description: newUser.business_description,
        city: newUser.city,
        state: newUser.state,
        country: newUser.country
      });
      return newUser;
    } catch (error) {
      console.error("🏢 STORAGE ERROR: Failed to create business user:", error);
      console.error("🏢 STORAGE ERROR: Full error details:", error.message);
      throw new Error(`Business registration failed: ${error.message}`);
    }
  }

  // Business subscription methods implementation
  async getBusinessSubscription(businessId: number): Promise<BusinessSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(businessSubscriptions)
      .where(eq(businessSubscriptions.businessId, businessId));
    return subscription;
  }

  async createBusinessSubscription(subscription: InsertBusinessSubscription): Promise<BusinessSubscription> {
    const [newSubscription] = await db
      .insert(businessSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateBusinessSubscription(businessId: number, updates: Partial<BusinessSubscription>): Promise<BusinessSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(businessSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessSubscriptions.businessId, businessId))
      .returning();
    return updatedSubscription;
  }

  async checkBusinessDayLimit(businessId: number): Promise<{ allowed: boolean; daysUsed: number; dayLimit: number; message?: string }> {
    // First ensure subscription exists and reset if needed
    await this.resetMonthlyUsageIfNeeded(businessId);
    
    let subscription = await this.getBusinessSubscription(businessId);
    
    // Create subscription if it doesn't exist
    if (!subscription) {
      subscription = await this.createBusinessSubscription({
        businessId,
        subscriptionType: 'free',
        daysUsedThisMonth: 0,
        monthlyDayLimit: 5,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear(),
        isActive: true
      });
    }

    const allowed = subscription.daysUsedThisMonth < subscription.monthlyDayLimit;
    
    return {
      allowed,
      daysUsed: subscription.daysUsedThisMonth,
      dayLimit: subscription.monthlyDayLimit,
      message: allowed ? undefined : `You have reached your monthly limit of ${subscription.monthlyDayLimit} active days. Upgrade to continue using business features.`
    };
  }

  async trackBusinessDayUsage(businessId: number): Promise<void> {
    // Check if already tracked today
    const today = new Date();
    const subscription = await this.getBusinessSubscription(businessId);
    
    if (subscription?.lastActiveDate) {
      const lastActiveDate = new Date(subscription.lastActiveDate);
      const isSameDay = lastActiveDate.toDateString() === today.toDateString();
      
      if (isSameDay) {
        return; // Already tracked today
      }
    }

    // Increment daily usage and update last active date
    await this.updateBusinessSubscription(businessId, {
      daysUsedThisMonth: (subscription?.daysUsedThisMonth || 0) + 1,
      lastActiveDate: today
    });
  }

  async resetMonthlyUsageIfNeeded(businessId: number): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const subscription = await this.getBusinessSubscription(businessId);
    
    if (subscription && (subscription.currentMonth !== currentMonth || subscription.currentYear !== currentYear)) {
      await this.updateBusinessSubscription(businessId, {
        daysUsedThisMonth: 0,
        currentMonth,
        currentYear
      });
    }
  }

  // External Event Interest Management - Aaron's event tracking system
  async addExternalEventInterest(interest: any): Promise<any> {
    try {
      // First check if interest already exists and update it
      const [existingInterest] = await db
        .select()
        .from(externalEventInterests)
        .where(
          and(
            eq(externalEventInterests.userId, interest.userId),
            eq(externalEventInterests.eventId, interest.eventId),
            eq(externalEventInterests.eventSource, interest.eventSource)
          )
        );
      
      if (existingInterest) {
        // Update existing interest
        const [updatedInterest] = await db
          .update(externalEventInterests)
          .set({
            interestType: interest.interestType,
            addedToItinerary: interest.addedToItinerary || false,
            notes: interest.notes,
            updatedAt: new Date()
          })
          .where(eq(externalEventInterests.id, existingInterest.id))
          .returning();
        
        console.log(`📋 Updated external event interest for event ${interest.eventId}`);
        return updatedInterest;
      } else {
        // Create new interest
        const [newInterest] = await db
          .insert(externalEventInterests)
          .values({
            userId: interest.userId,
            eventId: interest.eventId,
            eventTitle: interest.eventTitle,
            eventDate: interest.eventDate,
            eventVenue: interest.eventVenue,
            eventUrl: interest.eventUrl,
            eventSource: interest.eventSource,
            interestType: interest.interestType,
            addedToItinerary: interest.addedToItinerary || false,
            notes: interest.notes
          })
          .returning();
        
        console.log(`📋 Created new external event interest for event ${interest.eventId}`);
        return newInterest;
      }
    } catch (error) {
      console.error("Error adding external event interest:", error);
      throw error;
    }
  }

  async getExternalEventInterests(eventId: string, eventSource: string): Promise<any[]> {
    try {
      const interests = await db
        .select()
        .from(externalEventInterests)
        .where(
          and(
            eq(externalEventInterests.eventId, eventId),
            eq(externalEventInterests.eventSource, eventSource)
          )
        )
        .orderBy(desc(externalEventInterests.createdAt));
      
      return interests;
    } catch (error) {
      console.error("Error getting external event interests:", error);
      return [];
    }
  }

  async getUserExternalEventInterests(userId: number): Promise<any[]> {
    try {
      const interests = await db
        .select()
        .from(externalEventInterests)
        .where(eq(externalEventInterests.userId, userId))
        .orderBy(desc(externalEventInterests.createdAt));
      
      return interests;
    } catch (error) {
      console.error("Error getting user external event interests:", error);
      return [];
    }
  }

  async removeExternalEventInterest(userId: number, eventId: string, eventSource: string): Promise<boolean> {
    try {
      const result = await db
        .delete(externalEventInterests)
        .where(
          and(
            eq(externalEventInterests.userId, userId),
            eq(externalEventInterests.eventId, eventId),
            eq(externalEventInterests.eventSource, eventSource)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error removing external event interest:", error);
      return false;
    }
  }

  // VOUCH system methods implementation
  async createVouch(voucherUserId: number, vouchedUserId: number, vouchMessage?: string, vouchCategory: string = 'general'): Promise<any> {
    try {
      console.log(`📋 VOUCH: ${voucherUserId} vouching for ${vouchedUserId}`);
      
      // NO LIMITS: Skip all validation - anyone can vouch for anyone
      
      // Create the vouch
      const [newVouch] = await db.insert(vouches).values({
        voucherUserId,
        vouchedUserId,
        vouchMessage,
        vouchCategory,
        isActive: true
      }).returning();

      console.log(`✅ VOUCH: Created vouch ${newVouch.id}`);
      return newVouch;
    } catch (error) {
      console.error('Error creating vouch:', error);
      throw error;
    }
  }

  async getUserVouches(userId: number): Promise<any[]> {
    try {
      const userVouches = await db
        .select({
          id: vouches.id,
          vouchMessage: vouches.vouchMessage,
          vouchCategory: vouches.vouchCategory,
          createdAt: vouches.createdAt,
          voucher: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(vouches)
        .leftJoin(users, eq(vouches.voucherUserId, users.id))
        .where(and(
          eq(vouches.vouchedUserId, userId),
          eq(vouches.isActive, true)
        ))
        .orderBy(desc(vouches.createdAt));

      return userVouches;
    } catch (error) {
      console.error('Error getting user vouches:', error);
      return [];
    }
  }

  async getUserVouchesGiven(userId: number): Promise<any[]> {
    try {
      const vouchesGiven = await db
        .select({
          id: vouches.id,
          vouchMessage: vouches.vouchMessage,
          vouchCategory: vouches.vouchCategory,
          createdAt: vouches.createdAt,
          vouched: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage
          }
        })
        .from(vouches)
        .leftJoin(users, eq(vouches.vouchedUserId, users.id))
        .where(and(
          eq(vouches.voucherUserId, userId),
          eq(vouches.isActive, true)
        ))
        .orderBy(desc(vouches.createdAt));

      return vouchesGiven;
    } catch (error) {
      console.error('Error getting user vouches given:', error);
      return [];
    }
  }

  async getUserVouchCredits(userId: number): Promise<any> {
    try {
      const [credits] = await db
        .select()
        .from(vouchCredits)
        .where(eq(vouchCredits.userId, userId));

      return credits || {
        userId,
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        seedMember: false
      };
    } catch (error) {
      console.error('Error getting user vouch credits:', error);
      return {
        userId,
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        seedMember: false
      };
    }
  }

  async canUserVouch(userId: number): Promise<{ canVouch: boolean; availableCredits: number; reason?: string }> {
    try {
      // Check if user has received at least 1 vouch OR is seed member
      const [vouchReceived] = await db
        .select({ count: count() })
        .from(vouches)
        .where(and(
          eq(vouches.vouchedUserId, userId),
          eq(vouches.isActive, true)
        ));

      const credits = await this.getUserVouchCredits(userId);
      const isSeedMember = credits.seedMember;
      const hasReceivedVouch = (vouchReceived?.count || 0) > 0;

      if (isSeedMember || hasReceivedVouch) {
        return {
          canVouch: true,
          availableCredits: 999, // Unlimited once you have 1 vouch
          reason: 'Can vouch unlimited times'
        };
      }

      return {
        canVouch: false,
        availableCredits: 0,
        reason: 'You must receive at least 1 vouch before you can vouch for others'
      };
    } catch (error) {
      console.error('Error checking if user can vouch:', error);
      return {
        canVouch: false,
        availableCredits: 0,
        reason: 'Error checking vouch eligibility'
      };
    }
  }

  async getVouchNetworkStats(userId: number): Promise<{ totalReceived: number; totalGiven: number; networkSize: number }> {
    try {
      const [receivedCount] = await db
        .select({ count: count() })
        .from(vouches)
        .where(and(
          eq(vouches.vouchedUserId, userId),
          eq(vouches.isActive, true)
        ));

      const [givenCount] = await db
        .select({ count: count() })
        .from(vouches)
        .where(and(
          eq(vouches.voucherUserId, userId),
          eq(vouches.isActive, true)
        ));

      // Calculate network size (unique users vouched by this user's vouches)
      const networkUsers = await db
        .selectDistinct({ vouchedUserId: vouches.vouchedUserId })
        .from(vouches)
        .where(and(
          eq(vouches.voucherUserId, userId),
          eq(vouches.isActive, true)
        ));

      return {
        totalReceived: receivedCount.count || 0,
        totalGiven: givenCount.count || 0,
        networkSize: networkUsers.length
      };
    } catch (error) {
      console.error('Error getting vouch network stats:', error);
      return {
        totalReceived: 0,
        totalGiven: 0,
        networkSize: 0
      };
    }
  }

  async initializeSeedMember(userId: number, credits: number): Promise<void> {
    try {
      await db.insert(vouchCredits).values({
        userId,
        totalCredits: credits,
        usedCredits: 0,
        availableCredits: credits,
        seedMember: true
      }).onConflictDoUpdate({
        target: vouchCredits.userId,
        set: {
          totalCredits: credits,
          availableCredits: credits,
          seedMember: true,
          updatedAt: new Date()
        }
      });

      console.log(`🌱 VOUCH: Initialized seed member ${userId} with ${credits} credits`);
    } catch (error) {
      console.error('Error initializing seed member:', error);
      throw error;
    }
  }

  // CRITICAL MISSING METHODS FOR VOUCH CONNECTION REQUIREMENT
  
  // Check if two users are connected (required for vouching)
  async areUsersConnected(userId1: number, userId2: number): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') console.log(`🔗 VOUCH: Checking connection between users ${userId1} and ${userId2}`);
      
      // Use Drizzle ORM for consistency with other methods
      const connection = await db
        .select()
        .from(connections)
        .where(
          and(
            or(
              and(eq(connections.requesterId, userId1), eq(connections.receiverId, userId2)),
              and(eq(connections.requesterId, userId2), eq(connections.receiverId, userId1))
            ),
            eq(connections.status, 'accepted')
          )
        )
        .limit(1);
      
      if (process.env.NODE_ENV === 'development') console.log('🔗 VOUCH: Connection query result:', connection);
      
      const isConnected = connection && connection.length > 0;
      
      if (process.env.NODE_ENV === 'development') console.log(`🔗 VOUCH: Users ${userId1} and ${userId2} connected:`, isConnected);
      
      return isConnected;
    } catch (error) {
      console.error('Error checking if users are connected:', error);
      return false;
    }
  }

  // Check if user has already vouched for another user
  async hasUserVouchedFor(voucherUserId: number, vouchedUserId: number): Promise<boolean> {
    try {
      const [existingVouch] = await db
        .select()
        .from(vouches)
        .where(and(
          eq(vouches.voucherUserId, voucherUserId),
          eq(vouches.vouchedUserId, vouchedUserId),
          eq(vouches.isActive, true)
        ));
      
      return !!existingVouch;
    } catch (error) {
      console.error('Error checking if user has vouched:', error);
      return false;
    }
  }

  // Rename methods to match API expectations
  async getVouchesForUser(userId: number): Promise<any[]> {
    return this.getUserVouches(userId);
  }

  async getVouchesGivenByUser(userId: number): Promise<any[]> {
    return this.getUserVouchesGiven(userId);
  }

  async getVouchCredits(userId: number): Promise<any> {
    return this.getUserVouchCredits(userId);
  }

  // Create vouch with object parameter (API compatibility)
  async createVouchFromData(vouchData: { voucherUserId: number; vouchedUserId: number; vouchMessage: string; vouchCategory: string }): Promise<any> {
    return this.createVouch(vouchData.voucherUserId, vouchData.vouchedUserId, vouchData.vouchMessage, vouchData.vouchCategory);
  }

  // ========================================
  // ITINERARY CRUD METHODS
  // ========================================

  async getItinerariesByTravelPlan(travelPlanId: number): Promise<any[]> {
    try {
      const itineraries = await db
        .select()
        .from(tripItineraries)
        .where(eq(tripItineraries.travelPlanId, travelPlanId))
        .orderBy(desc(tripItineraries.createdAt));
      return itineraries;
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      return [];
    }
  }

  async getItineraryWithItems(itineraryId: number): Promise<any> {
    try {
      const [itinerary] = await db
        .select()
        .from(tripItineraries)
        .where(eq(tripItineraries.id, itineraryId));

      if (!itinerary) {
        return null;
      }

      const items = await db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.itineraryId, itineraryId))
        .orderBy(asc(itineraryItems.date), asc(itineraryItems.startTime));

      return { ...itinerary, items };
    } catch (error) {
      console.error('Error fetching itinerary with items:', error);
      return null;
    }
  }

  async createItinerary(itineraryData: any): Promise<any> {
    try {
      const [itinerary] = await db
        .insert(tripItineraries)
        .values({
          ...itineraryData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return itinerary;
    } catch (error) {
      console.error('Error creating itinerary:', error);
      throw error;
    }
  }

  async createItineraryItem(itemData: any): Promise<any> {
    try {
      const [item] = await db
        .insert(itineraryItems)
        .values(itemData)
        .returning();
      return item;
    } catch (error) {
      console.error('Error creating itinerary item:', error);
      throw error;
    }
  }

  async updateItineraryItem(itemId: number, updates: any): Promise<any> {
    try {
      const [item] = await db
        .update(itineraryItems)
        .set(updates)
        .where(eq(itineraryItems.id, itemId))
        .returning();
      return item;
    } catch (error) {
      console.error('Error updating itinerary item:', error);
      throw error;
    }
  }

  async deleteItineraryItem(itemId: number): Promise<void> {
    try {
      await db
        .delete(itineraryItems)
        .where(eq(itineraryItems.id, itemId));
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
      throw error;
    }
  }

  // Aura reward system
  async awardAura(userId: number, points: number, reason: string): Promise<void> {
    try {
      console.log(`🌟 AURA REWARD: Awarding ${points} aura to user ${userId} for ${reason}`);
      
      await db
        .update(users)
        .set({
          aura: sql`COALESCE(aura, 0) + ${points}`
        })
        .where(eq(users.id, userId));
      
      // Get updated aura count for logging
      const [user] = await db
        .select({ id: users.id, username: users.username, aura: users.aura })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (user) {
        console.log(`🌟 AURA UPDATE: User ${user.username} now has ${user.aura} total aura`);
      }
    } catch (error) {
      console.error('Error awarding aura points:', error);
    }
  }

  // ========================================
  // WAITLIST METHODS
  // ========================================

  async createWaitlistLead(leadData: InsertWaitlistLead): Promise<WaitlistLead> {
    try {
      const [lead] = await db
        .insert(waitlistLeads)
        .values(leadData)
        .returning();
      return lead;
    } catch (error) {
      console.error('Error creating waitlist lead:', error);
      throw error;
    }
  }

  async getWaitlistLeads(): Promise<WaitlistLead[]> {
    try {
      const leads = await db
        .select()
        .from(waitlistLeads)
        .orderBy(desc(waitlistLeads.submittedAt));
      return leads;
    } catch (error) {
      console.error('Error fetching waitlist leads:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();