import { db } from './db';
import { users, businessInterestNotifications } from '@shared/schema';
import { eq, and, sql, ne } from 'drizzle-orm';

interface ProximityNotificationRequest {
  businessId: number;
  travelerLatitude: number;
  travelerLongitude: number;
  radiusKm?: number;
}

interface BusinessLocation {
  id: number;
  businessName: string;
  interests: string[];
  activities: string[];
  latitude: number;
  longitude: number;
  locationSharingEnabled: boolean;
  userType: string;
}

class BusinessProximityNotificationEngine {
  private readonly DEFAULT_RADIUS_KM = 11.265; // 7 miles in kilometers

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  /**
   * Find businesses within proximity of a traveler and send notifications
   */
  async checkProximityForTraveler(
    travelerId: number,
    travelerLatitude: number,
    travelerLongitude: number,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): Promise<void> {
    try {
      console.log(`🎯 PROXIMITY: Checking businesses near traveler ${travelerId} within ${radiusKm}km`);

      // Get traveler's interests and activities for matching
      const [traveler] = await db
        .select({
          id: users.id,
          interests: users.interests,
          activities: users.activities,
          defaultTravelInterests: users.defaultTravelInterests,
          defaultTravelActivities: users.defaultTravelActivities,
        })
        .from(users)
        .where(eq(users.id, travelerId));

      if (!traveler) {
        console.log(`❌ PROXIMITY: Traveler ${travelerId} not found`);
        return;
      }

      // Combine all traveler interests and activities
      const travelerInterests = [
        ...(traveler.interests || []),
        ...(traveler.defaultTravelInterests || [])
      ];
      const travelerActivities = [
        ...(traveler.activities || []),
        ...(traveler.defaultTravelActivities || [])
      ];

      console.log(`🎯 PROXIMITY: Traveler interests:`, travelerInterests);
      console.log(`🎯 PROXIMITY: Traveler activities:`, travelerActivities);

      // Get all businesses with location data and proximity notifications enabled
      const businesses = await db
        .select({
          id: users.id,
          businessName: users.businessName,
          interests: users.interests,
          activities: users.activities,
          latitude: users.currentLatitude,
          longitude: users.currentLongitude,
          locationSharingEnabled: users.locationSharingEnabled,
          userType: users.userType,
          hometownCity: users.hometownCity,
        })
        .from(users)
        .where(
          and(
            eq(users.userType, 'business'),
            eq(users.locationSharingEnabled, true),
            ne(users.currentLatitude, null),
            ne(users.currentLongitude, null)
          )
        );

      console.log(`🏪 PROXIMITY: Found ${businesses.length} businesses with location sharing enabled`);

      let notificationsGenerated = 0;

      for (const business of businesses) {
        if (!business.latitude || !business.longitude) continue;

        // Calculate distance
        const distance = this.calculateDistance(
          travelerLatitude,
          travelerLongitude,
          business.latitude,
          business.longitude
        );

        console.log(`📍 PROXIMITY: Business ${business.businessName} is ${distance.toFixed(2)}km away`);

        // Check if within radius
        if (distance <= radiusKm) {
          console.log(`✅ PROXIMITY: Business ${business.businessName} is within ${radiusKm}km radius!`);

          // Check for interest/activity matches
          const businessInterests = business.interests || [];
          const businessActivities = business.activities || [];

          const interestMatches = businessInterests.filter(interest => 
            travelerInterests.includes(interest)
          );
          const activityMatches = businessActivities.filter(activity => 
            travelerActivities.includes(activity)
          );

          const totalMatches = interestMatches.length + activityMatches.length;

          console.log(`🎯 PROXIMITY: Found ${totalMatches} matches (${interestMatches.length} interests, ${activityMatches.length} activities)`);

          if (totalMatches > 0) {
            // Check if we already sent a notification to this business about this traveler recently
            const existingNotification = await db
              .select()
              .from(businessInterestNotifications)
              .where(
                and(
                  eq(businessInterestNotifications.businessId, business.id),
                  eq(businessInterestNotifications.userId, travelerId),
                  sql`${businessInterestNotifications.createdAt} > NOW() - INTERVAL '7 days'`
                )
              );

            if (existingNotification.length === 0) {
              // Generate proximity notification for the business
              await this.generateProximityNotification(
                business.id,
                travelerId,
                totalMatches,
                distance,
                interestMatches,
                activityMatches
              );
              notificationsGenerated++;
              console.log(`🔔 PROXIMITY: Generated notification for business ${business.businessName}`);
            } else {
              console.log(`⏭️ PROXIMITY: Skipping ${business.businessName} - notification sent within 7 days`);
            }
          } else {
            console.log(`❌ PROXIMITY: No interest/activity matches for business ${business.businessName}`);
          }
        }
      }

      console.log(`🎯 PROXIMITY: Generated ${notificationsGenerated} proximity notifications for traveler ${travelerId}`);
    } catch (error) {
      console.error('❌ PROXIMITY: Error checking proximity for traveler:', error);
      throw error;
    }
  }

  /**
   * Generate a proximity notification for a business about a nearby traveler
   */
  private async generateProximityNotification(
    businessId: number,
    travelerId: number,
    matchCount: number,
    distance: number,
    interestMatches: string[],
    activityMatches: string[]
  ): Promise<void> {
    try {
      // Get traveler details for the notification
      const [traveler] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
          userType: users.userType,
        })
        .from(users)
        .where(eq(users.id, travelerId));

      if (!traveler) {
        console.log(`❌ PROXIMITY: Traveler ${travelerId} not found for notification`);
        return;
      }

      // Determine priority based on match count
      let priority: 'low' | 'medium' | 'high' = 'low';
      if (matchCount >= 3) priority = 'high';
      else if (matchCount >= 2) priority = 'medium';

      // Create notification message
      const allMatches = [...interestMatches, ...activityMatches];
      const matchText = allMatches.length > 3 
        ? `${allMatches.slice(0, 3).join(', ')} and ${allMatches.length - 3} more`
        : allMatches.join(', ');

      const title = `🎯 Nearby Traveler Alert - ${matchCount} Match${matchCount !== 1 ? 'es' : ''}`;
      const message = `${traveler.username} is ${distance.toFixed(1)}km away and interested in: ${matchText}. Perfect opportunity to connect!`;

      // Save notification to database
      await db.insert(businessInterestNotifications).values({
        businessId,
        userId: travelerId,
        matchType: 'traveler_interest',
        matchedInterests: interestMatches,
        matchedActivities: activityMatches,
        userLocation: `${distance.toFixed(1)}km away`,
        priority,
        isRead: false,
        isProcessed: false,
      });

      console.log(`✅ PROXIMITY: Notification created for business ${businessId} about traveler ${traveler.username}`);
    } catch (error) {
      console.error('❌ PROXIMITY: Error generating proximity notification:', error);
      throw error;
    }
  }

  /**
   * Update business location coordinates
   */
  async updateBusinessLocation(
    businessId: number,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date(),
        })
        .where(eq(users.id, businessId));

      console.log(`📍 PROXIMITY: Updated location for business ${businessId}: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error('❌ PROXIMITY: Error updating business location:', error);
      throw error;
    }
  }

  /**
   * Enable/disable proximity notifications for a business
   */
  async toggleProximityNotifications(
    businessId: number,
    enabled: boolean
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          locationSharingEnabled: enabled,
        })
        .where(eq(users.id, businessId));

      console.log(`🔔 PROXIMITY: ${enabled ? 'Enabled' : 'Disabled'} proximity notifications for business ${businessId}`);
    } catch (error) {
      console.error('❌ PROXIMITY: Error toggling proximity notifications:', error);
      throw error;
    }
  }
}

export const businessProximityEngine = new BusinessProximityNotificationEngine();