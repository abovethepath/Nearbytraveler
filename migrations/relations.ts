import { relations } from "drizzle-orm/relations";
import { users, moodEntries, events, travelPlans, packingLists, packingListItems, passportStamps, moodBoards, photoAlbums, proximityNotifications, quickMeetups, quickMeetupParticipants, citychatrooms, chatroomMembers, cityChatrooms, chatroomMessages, quickMeetupTemplates, recommendations, references, recommendationRequests, aiConversations, aiRecommendations, businessCustomerPhotos, businessInterestNotifications, businessLocations, achievements, cityLandmarks, businessSubscriptions, emergencyContacts, cityPhotos, meetupChatrooms, hostingOffers, instagramPosts, landmarkRatings, meetupChatroomMessages, externalEventInterests, hangouts, secretExperienceLikes, travelBlogPosts, travelBlogComments, travelBlogLikes, secretLocalExperiences, secretLocalExperienceLikes, travelBlogCommentLikes, travelMemories, userCityInterests, cityActivities, travelMemoryComments, travelMemoryLikes, userChallenges, travelChallenges, userLeaderboard, userNotificationSettings, userPreferences, userRecommendationInteractions, userEventInterests, userContributedInterests, restaurants, restaurantReviews, hangoutParticipants, moodBoardItems, referenceVotes, userStats, verifications, vouchCredits, vouches } from "./schema";

export const moodEntriesRelations = relations(moodEntries, ({one}) => ({
	user: one(users, {
		fields: [moodEntries.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [moodEntries.eventId],
		references: [events.id]
	}),
	travelPlan: one(travelPlans, {
		fields: [moodEntries.travelPlanId],
		references: [travelPlans.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	moodEntries: many(moodEntries),
	packingLists: many(packingLists),
	packingListItems: many(packingListItems),
	passportStamps: many(passportStamps),
	moodBoards: many(moodBoards),
	photoAlbums: many(photoAlbums),
	proximityNotifications_userId: many(proximityNotifications, {
		relationName: "proximityNotifications_userId_users_id"
	}),
	proximityNotifications_nearbyUserId: many(proximityNotifications, {
		relationName: "proximityNotifications_nearbyUserId_users_id"
	}),
	quickMeetupParticipants: many(quickMeetupParticipants),
	citychatrooms: many(citychatrooms),
	chatroomMembers: many(chatroomMembers),
	chatroomMessages: many(chatroomMessages),
	quickMeetupTemplates: many(quickMeetupTemplates),
	recommendations: many(recommendations),
	references_fromUserId: many(references, {
		relationName: "references_fromUserId_users_id"
	}),
	references_toUserId: many(references, {
		relationName: "references_toUserId_users_id"
	}),
	quickMeetups: many(quickMeetups),
	recommendationRequests: many(recommendationRequests),
	aiConversations: many(aiConversations),
	aiRecommendations: many(aiRecommendations),
	businessCustomerPhotos_businessId: many(businessCustomerPhotos, {
		relationName: "businessCustomerPhotos_businessId_users_id"
	}),
	businessCustomerPhotos_uploaderId: many(businessCustomerPhotos, {
		relationName: "businessCustomerPhotos_uploaderId_users_id"
	}),
	businessInterestNotifications_businessId: many(businessInterestNotifications, {
		relationName: "businessInterestNotifications_businessId_users_id"
	}),
	businessInterestNotifications_userId: many(businessInterestNotifications, {
		relationName: "businessInterestNotifications_userId_users_id"
	}),
	businessLocations: many(businessLocations),
	achievements: many(achievements),
	cityLandmarks: many(cityLandmarks),
	businessSubscriptions: many(businessSubscriptions),
	emergencyContacts: many(emergencyContacts),
	cityPhotos_photographerId: many(cityPhotos, {
		relationName: "cityPhotos_photographerId_users_id"
	}),
	cityPhotos_moderatedBy: many(cityPhotos, {
		relationName: "cityPhotos_moderatedBy_users_id"
	}),
	hostingOffers: many(hostingOffers),
	instagramPosts: many(instagramPosts),
	landmarkRatings: many(landmarkRatings),
	meetupChatroomMessages: many(meetupChatroomMessages),
	externalEventInterests: many(externalEventInterests),
	hangouts: many(hangouts),
	secretExperienceLikes: many(secretExperienceLikes),
	travelBlogComments: many(travelBlogComments),
	travelBlogLikes: many(travelBlogLikes),
	secretLocalExperienceLikes: many(secretLocalExperienceLikes),
	travelBlogCommentLikes: many(travelBlogCommentLikes),
	travelMemories: many(travelMemories),
	userCityInterests: many(userCityInterests),
	travelMemoryComments: many(travelMemoryComments),
	travelMemoryLikes: many(travelMemoryLikes),
	travelBlogPosts: many(travelBlogPosts),
	userChallenges: many(userChallenges),
	userLeaderboards: many(userLeaderboard),
	userNotificationSettings: many(userNotificationSettings),
	userPreferences: many(userPreferences),
	userRecommendationInteractions: many(userRecommendationInteractions),
	userEventInterests: many(userEventInterests),
	userContributedInterests: many(userContributedInterests),
	restaurantReviews: many(restaurantReviews),
	hangoutParticipants: many(hangoutParticipants),
	referenceVotes: many(referenceVotes),
	restaurants: many(restaurants),
	userStats: many(userStats),
	verifications: many(verifications),
	vouchCredits: many(vouchCredits),
	vouches_voucherUserId: many(vouches, {
		relationName: "vouches_voucherUserId_users_id"
	}),
	vouches_vouchedUserId: many(vouches, {
		relationName: "vouches_vouchedUserId_users_id"
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	moodEntries: many(moodEntries),
	passportStamps: many(passportStamps),
	meetupChatrooms: many(meetupChatrooms),
	instagramPosts: many(instagramPosts),
	userEventInterests: many(userEventInterests),
}));

export const travelPlansRelations = relations(travelPlans, ({many}) => ({
	moodEntries: many(moodEntries),
	passportStamps: many(passportStamps),
}));

export const packingListsRelations = relations(packingLists, ({one, many}) => ({
	user: one(users, {
		fields: [packingLists.userId],
		references: [users.id]
	}),
	packingListItems: many(packingListItems),
}));

export const packingListItemsRelations = relations(packingListItems, ({one}) => ({
	packingList: one(packingLists, {
		fields: [packingListItems.packingListId],
		references: [packingLists.id]
	}),
	user: one(users, {
		fields: [packingListItems.addedBy],
		references: [users.id]
	}),
}));

export const passportStampsRelations = relations(passportStamps, ({one}) => ({
	user: one(users, {
		fields: [passportStamps.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [passportStamps.eventId],
		references: [events.id]
	}),
	travelPlan: one(travelPlans, {
		fields: [passportStamps.travelPlanId],
		references: [travelPlans.id]
	}),
}));

export const moodBoardsRelations = relations(moodBoards, ({one, many}) => ({
	user: one(users, {
		fields: [moodBoards.userId],
		references: [users.id]
	}),
	moodBoardItems: many(moodBoardItems),
}));

export const photoAlbumsRelations = relations(photoAlbums, ({one}) => ({
	user: one(users, {
		fields: [photoAlbums.userId],
		references: [users.id]
	}),
}));

export const proximityNotificationsRelations = relations(proximityNotifications, ({one}) => ({
	user_userId: one(users, {
		fields: [proximityNotifications.userId],
		references: [users.id],
		relationName: "proximityNotifications_userId_users_id"
	}),
	user_nearbyUserId: one(users, {
		fields: [proximityNotifications.nearbyUserId],
		references: [users.id],
		relationName: "proximityNotifications_nearbyUserId_users_id"
	}),
}));

export const quickMeetupParticipantsRelations = relations(quickMeetupParticipants, ({one}) => ({
	quickMeetup: one(quickMeetups, {
		fields: [quickMeetupParticipants.meetupId],
		references: [quickMeetups.id]
	}),
	user: one(users, {
		fields: [quickMeetupParticipants.userId],
		references: [users.id]
	}),
}));

export const quickMeetupsRelations = relations(quickMeetups, ({one, many}) => ({
	quickMeetupParticipants: many(quickMeetupParticipants),
	user: one(users, {
		fields: [quickMeetups.organizerId],
		references: [users.id]
	}),
	meetupChatrooms: many(meetupChatrooms),
}));

export const citychatroomsRelations = relations(citychatrooms, ({one, many}) => ({
	user: one(users, {
		fields: [citychatrooms.createdById],
		references: [users.id]
	}),
	chatroomMessages: many(chatroomMessages),
}));

export const chatroomMembersRelations = relations(chatroomMembers, ({one}) => ({
	user: one(users, {
		fields: [chatroomMembers.userId],
		references: [users.id]
	}),
	cityChatroom: one(cityChatrooms, {
		fields: [chatroomMembers.chatroomId],
		references: [cityChatrooms.id]
	}),
}));

export const cityChatroomsRelations = relations(cityChatrooms, ({many}) => ({
	chatroomMembers: many(chatroomMembers),
}));

export const chatroomMessagesRelations = relations(chatroomMessages, ({one, many}) => ({
	citychatroom: one(citychatrooms, {
		fields: [chatroomMessages.chatroomId],
		references: [citychatrooms.id]
	}),
	user: one(users, {
		fields: [chatroomMessages.senderId],
		references: [users.id]
	}),
	chatroomMessage: one(chatroomMessages, {
		fields: [chatroomMessages.replyToId],
		references: [chatroomMessages.id],
		relationName: "chatroomMessages_replyToId_chatroomMessages_id"
	}),
	chatroomMessages: many(chatroomMessages, {
		relationName: "chatroomMessages_replyToId_chatroomMessages_id"
	}),
}));

export const quickMeetupTemplatesRelations = relations(quickMeetupTemplates, ({one}) => ({
	user: one(users, {
		fields: [quickMeetupTemplates.userId],
		references: [users.id]
	}),
}));

export const recommendationsRelations = relations(recommendations, ({one, many}) => ({
	user: one(users, {
		fields: [recommendations.userId],
		references: [users.id]
	}),
	userRecommendationInteractions: many(userRecommendationInteractions),
}));

export const referencesRelations = relations(references, ({one, many}) => ({
	user_fromUserId: one(users, {
		fields: [references.fromUserId],
		references: [users.id],
		relationName: "references_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [references.toUserId],
		references: [users.id],
		relationName: "references_toUserId_users_id"
	}),
	referenceVotes: many(referenceVotes),
}));

export const recommendationRequestsRelations = relations(recommendationRequests, ({one}) => ({
	user: one(users, {
		fields: [recommendationRequests.userId],
		references: [users.id]
	}),
}));

export const aiConversationsRelations = relations(aiConversations, ({one}) => ({
	user: one(users, {
		fields: [aiConversations.userId],
		references: [users.id]
	}),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({one}) => ({
	user: one(users, {
		fields: [aiRecommendations.userId],
		references: [users.id]
	}),
}));

export const businessCustomerPhotosRelations = relations(businessCustomerPhotos, ({one}) => ({
	user_businessId: one(users, {
		fields: [businessCustomerPhotos.businessId],
		references: [users.id],
		relationName: "businessCustomerPhotos_businessId_users_id"
	}),
	user_uploaderId: one(users, {
		fields: [businessCustomerPhotos.uploaderId],
		references: [users.id],
		relationName: "businessCustomerPhotos_uploaderId_users_id"
	}),
}));

export const businessInterestNotificationsRelations = relations(businessInterestNotifications, ({one}) => ({
	user_businessId: one(users, {
		fields: [businessInterestNotifications.businessId],
		references: [users.id],
		relationName: "businessInterestNotifications_businessId_users_id"
	}),
	user_userId: one(users, {
		fields: [businessInterestNotifications.userId],
		references: [users.id],
		relationName: "businessInterestNotifications_userId_users_id"
	}),
}));

export const businessLocationsRelations = relations(businessLocations, ({one}) => ({
	user: one(users, {
		fields: [businessLocations.businessId],
		references: [users.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({one}) => ({
	user: one(users, {
		fields: [achievements.userId],
		references: [users.id]
	}),
}));

export const cityLandmarksRelations = relations(cityLandmarks, ({one, many}) => ({
	user: one(users, {
		fields: [cityLandmarks.addedBy],
		references: [users.id]
	}),
	landmarkRatings: many(landmarkRatings),
}));

export const businessSubscriptionsRelations = relations(businessSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [businessSubscriptions.businessId],
		references: [users.id]
	}),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({one}) => ({
	user: one(users, {
		fields: [emergencyContacts.userId],
		references: [users.id]
	}),
}));

export const cityPhotosRelations = relations(cityPhotos, ({one}) => ({
	user_photographerId: one(users, {
		fields: [cityPhotos.photographerId],
		references: [users.id],
		relationName: "cityPhotos_photographerId_users_id"
	}),
	user_moderatedBy: one(users, {
		fields: [cityPhotos.moderatedBy],
		references: [users.id],
		relationName: "cityPhotos_moderatedBy_users_id"
	}),
}));

export const meetupChatroomsRelations = relations(meetupChatrooms, ({one, many}) => ({
	event: one(events, {
		fields: [meetupChatrooms.eventId],
		references: [events.id]
	}),
	quickMeetup: one(quickMeetups, {
		fields: [meetupChatrooms.meetupId],
		references: [quickMeetups.id]
	}),
	meetupChatroomMessages: many(meetupChatroomMessages),
}));

export const hostingOffersRelations = relations(hostingOffers, ({one}) => ({
	user: one(users, {
		fields: [hostingOffers.userId],
		references: [users.id]
	}),
}));

export const instagramPostsRelations = relations(instagramPosts, ({one}) => ({
	event: one(events, {
		fields: [instagramPosts.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [instagramPosts.userId],
		references: [users.id]
	}),
}));

export const landmarkRatingsRelations = relations(landmarkRatings, ({one}) => ({
	cityLandmark: one(cityLandmarks, {
		fields: [landmarkRatings.landmarkId],
		references: [cityLandmarks.id]
	}),
	user: one(users, {
		fields: [landmarkRatings.userId],
		references: [users.id]
	}),
}));

export const meetupChatroomMessagesRelations = relations(meetupChatroomMessages, ({one}) => ({
	meetupChatroom: one(meetupChatrooms, {
		fields: [meetupChatroomMessages.meetupChatroomId],
		references: [meetupChatrooms.id]
	}),
	user: one(users, {
		fields: [meetupChatroomMessages.userId],
		references: [users.id]
	}),
}));

export const externalEventInterestsRelations = relations(externalEventInterests, ({one}) => ({
	user: one(users, {
		fields: [externalEventInterests.userId],
		references: [users.id]
	}),
}));

export const hangoutsRelations = relations(hangouts, ({one, many}) => ({
	user: one(users, {
		fields: [hangouts.hostId],
		references: [users.id]
	}),
	hangoutParticipants: many(hangoutParticipants),
}));

export const secretExperienceLikesRelations = relations(secretExperienceLikes, ({one}) => ({
	user: one(users, {
		fields: [secretExperienceLikes.userId],
		references: [users.id]
	}),
}));

export const travelBlogCommentsRelations = relations(travelBlogComments, ({one, many}) => ({
	travelBlogPost: one(travelBlogPosts, {
		fields: [travelBlogComments.postId],
		references: [travelBlogPosts.id]
	}),
	user: one(users, {
		fields: [travelBlogComments.userId],
		references: [users.id]
	}),
	travelBlogCommentLikes: many(travelBlogCommentLikes),
}));

export const travelBlogPostsRelations = relations(travelBlogPosts, ({one, many}) => ({
	travelBlogComments: many(travelBlogComments),
	travelBlogLikes: many(travelBlogLikes),
	user: one(users, {
		fields: [travelBlogPosts.userId],
		references: [users.id]
	}),
}));

export const travelBlogLikesRelations = relations(travelBlogLikes, ({one}) => ({
	travelBlogPost: one(travelBlogPosts, {
		fields: [travelBlogLikes.postId],
		references: [travelBlogPosts.id]
	}),
	user: one(users, {
		fields: [travelBlogLikes.userId],
		references: [users.id]
	}),
}));

export const secretLocalExperienceLikesRelations = relations(secretLocalExperienceLikes, ({one}) => ({
	secretLocalExperience: one(secretLocalExperiences, {
		fields: [secretLocalExperienceLikes.experienceId],
		references: [secretLocalExperiences.id]
	}),
	user: one(users, {
		fields: [secretLocalExperienceLikes.userId],
		references: [users.id]
	}),
}));

export const secretLocalExperiencesRelations = relations(secretLocalExperiences, ({many}) => ({
	secretLocalExperienceLikes: many(secretLocalExperienceLikes),
}));

export const travelBlogCommentLikesRelations = relations(travelBlogCommentLikes, ({one}) => ({
	travelBlogComment: one(travelBlogComments, {
		fields: [travelBlogCommentLikes.commentId],
		references: [travelBlogComments.id]
	}),
	user: one(users, {
		fields: [travelBlogCommentLikes.userId],
		references: [users.id]
	}),
}));

export const travelMemoriesRelations = relations(travelMemories, ({one, many}) => ({
	user: one(users, {
		fields: [travelMemories.userId],
		references: [users.id]
	}),
	travelMemoryComments: many(travelMemoryComments),
	travelMemoryLikes: many(travelMemoryLikes),
}));

export const userCityInterestsRelations = relations(userCityInterests, ({one}) => ({
	user: one(users, {
		fields: [userCityInterests.userId],
		references: [users.id]
	}),
	cityActivity: one(cityActivities, {
		fields: [userCityInterests.activityId],
		references: [cityActivities.id]
	}),
}));

export const cityActivitiesRelations = relations(cityActivities, ({many}) => ({
	userCityInterests: many(userCityInterests),
}));

export const travelMemoryCommentsRelations = relations(travelMemoryComments, ({one}) => ({
	travelMemory: one(travelMemories, {
		fields: [travelMemoryComments.memoryId],
		references: [travelMemories.id]
	}),
	user: one(users, {
		fields: [travelMemoryComments.userId],
		references: [users.id]
	}),
}));

export const travelMemoryLikesRelations = relations(travelMemoryLikes, ({one}) => ({
	travelMemory: one(travelMemories, {
		fields: [travelMemoryLikes.memoryId],
		references: [travelMemories.id]
	}),
	user: one(users, {
		fields: [travelMemoryLikes.userId],
		references: [users.id]
	}),
}));

export const userChallengesRelations = relations(userChallenges, ({one}) => ({
	user: one(users, {
		fields: [userChallenges.userId],
		references: [users.id]
	}),
	travelChallenge: one(travelChallenges, {
		fields: [userChallenges.challengeId],
		references: [travelChallenges.id]
	}),
}));

export const travelChallengesRelations = relations(travelChallenges, ({many}) => ({
	userChallenges: many(userChallenges),
}));

export const userLeaderboardRelations = relations(userLeaderboard, ({one}) => ({
	user: one(users, {
		fields: [userLeaderboard.userId],
		references: [users.id]
	}),
}));

export const userNotificationSettingsRelations = relations(userNotificationSettings, ({one}) => ({
	user: one(users, {
		fields: [userNotificationSettings.userId],
		references: [users.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const userRecommendationInteractionsRelations = relations(userRecommendationInteractions, ({one}) => ({
	recommendation: one(recommendations, {
		fields: [userRecommendationInteractions.recommendationId],
		references: [recommendations.id]
	}),
	user: one(users, {
		fields: [userRecommendationInteractions.userId],
		references: [users.id]
	}),
}));

export const userEventInterestsRelations = relations(userEventInterests, ({one}) => ({
	user: one(users, {
		fields: [userEventInterests.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [userEventInterests.eventId],
		references: [events.id]
	}),
}));

export const userContributedInterestsRelations = relations(userContributedInterests, ({one}) => ({
	user: one(users, {
		fields: [userContributedInterests.userId],
		references: [users.id]
	}),
}));

export const restaurantReviewsRelations = relations(restaurantReviews, ({one}) => ({
	restaurant: one(restaurants, {
		fields: [restaurantReviews.restaurantId],
		references: [restaurants.id]
	}),
	user: one(users, {
		fields: [restaurantReviews.userId],
		references: [users.id]
	}),
}));

export const restaurantsRelations = relations(restaurants, ({one, many}) => ({
	restaurantReviews: many(restaurantReviews),
	user: one(users, {
		fields: [restaurants.addedBy],
		references: [users.id]
	}),
}));

export const hangoutParticipantsRelations = relations(hangoutParticipants, ({one}) => ({
	hangout: one(hangouts, {
		fields: [hangoutParticipants.hangoutId],
		references: [hangouts.id]
	}),
	user: one(users, {
		fields: [hangoutParticipants.userId],
		references: [users.id]
	}),
}));

export const moodBoardItemsRelations = relations(moodBoardItems, ({one}) => ({
	moodBoard: one(moodBoards, {
		fields: [moodBoardItems.moodBoardId],
		references: [moodBoards.id]
	}),
}));

export const referenceVotesRelations = relations(referenceVotes, ({one}) => ({
	reference: one(references, {
		fields: [referenceVotes.referenceId],
		references: [references.id]
	}),
	user: one(users, {
		fields: [referenceVotes.userId],
		references: [users.id]
	}),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const verificationsRelations = relations(verifications, ({one}) => ({
	user: one(users, {
		fields: [verifications.userId],
		references: [users.id]
	}),
}));

export const vouchCreditsRelations = relations(vouchCredits, ({one}) => ({
	user: one(users, {
		fields: [vouchCredits.userId],
		references: [users.id]
	}),
}));

export const vouchesRelations = relations(vouches, ({one}) => ({
	user_voucherUserId: one(users, {
		fields: [vouches.voucherUserId],
		references: [users.id],
		relationName: "vouches_voucherUserId_users_id"
	}),
	user_vouchedUserId: one(users, {
		fields: [vouches.vouchedUserId],
		references: [users.id],
		relationName: "vouches_vouchedUserId_users_id"
	}),
}));