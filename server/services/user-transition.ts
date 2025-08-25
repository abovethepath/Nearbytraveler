import { db } from "../db";
import { users, travelPlans } from "../../shared/schema";
import { eq, and, lte } from "drizzle-orm";

export class UserTransitionService {
  /**
   * Check for travelers whose trips have ended and transition them to locals
   */
  static async processExpiredTravelers(): Promise<void> {
    const now = new Date();
    
    try {
      // Find all current travelers with expired trips
      const expiredTravelers = await db
        .select({
          userId: users.id,
          username: users.username,
          hometownCity: users.hometownCity,
          hometownState: users.hometownState,
          hometownCountry: users.hometownCountry,
          travelEndDate: users.travelEndDate,
          currentLocation: users.location
        })
        .from(users)
        .where(
          and(
            eq(users.userType, 'currently_traveling'),
            lte(users.travelEndDate, now)
          )
        );

      console.log(`Found ${expiredTravelers.length} travelers with expired trips`);

      for (const traveler of expiredTravelers) {
        await this.transitionTravelerToLocal(traveler);
      }

      // Also check travel plans table for additional expired trips
      const expiredPlans = await db
        .select({
          userId: travelPlans.userId,
          planId: travelPlans.id,
          endDate: travelPlans.endDate
        })
        .from(travelPlans)
        .leftJoin(users, eq(travelPlans.userId, users.id))
        .where(
          and(
            eq(users.userType, 'currently_traveling'),
            lte(travelPlans.endDate, now)
          )
        );

      for (const plan of expiredPlans) {
        // Get user details and transition
        const user = await db.select().from(users).where(eq(users.id, plan.userId)).limit(1);
        if (user.length > 0) {
          await this.transitionTravelerToLocal({
            userId: user[0].id,
            username: user[0].username,
            hometownCity: user[0].hometownCity,
            hometownState: user[0].hometownState,
            hometownCountry: user[0].hometownCountry,
            travelEndDate: plan.endDate,
            currentLocation: user[0].location
          });
        }
      }

    } catch (error) {
      console.error('Error processing expired travelers:', error);
    }
  }

  /**
   * Transition a specific traveler to local status
   */
  private static async transitionTravelerToLocal(traveler: {
    userId: number;
    username: string;
    hometownCity: string | null;
    hometownState: string | null;
    hometownCountry: string | null;
    travelEndDate: Date | null;
    currentLocation: string | null;
  }): Promise<void> {
    try {
      // Determine new location (hometown)
      const newLocation = traveler.hometownCity && traveler.hometownState 
        ? `${traveler.hometownCity}, ${traveler.hometownState}`
        : traveler.hometownCity || traveler.currentLocation || 'Unknown';

      // Update user to local status
      await db
        .update(users)
        .set({
          userType: 'local',
          location: newLocation,
          // Clear travel-specific fields
          travelDestination: null,
          travelStartDate: null,
          travelEndDate: null,
          // Keep their travel experiences as local expertise
          localExpertise: db.select({ travelInterests: users.travelInterests }).from(users).where(eq(users.id, traveler.userId)).limit(1).then(result => 
            result.length > 0 ? result[0].travelInterests : []
          ),
        })
        .where(eq(users.id, traveler.userId));

      console.log(`Transitioned user ${traveler.username} (ID: ${traveler.userId}) from traveler to local in ${newLocation}`);

      // Archive completed travel plans
      await db
        .update(travelPlans)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(travelPlans.userId, traveler.userId),
            lte(travelPlans.endDate, new Date())
          )
        );

    } catch (error) {
      console.error(`Error transitioning user ${traveler.userId}:`, error);
    }
  }

  /**
   * Manual transition for testing or admin purposes
   */
  static async manualTransitionToLocal(userId: number): Promise<boolean> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (user.length === 0) {
        return false;
      }

      const userData = user[0];
      if (userData.userType !== 'currently_traveling') {
        return false;
      }

      await this.transitionTravelerToLocal({
        userId: userData.id,
        username: userData.username,
        hometownCity: userData.hometownCity,
        hometownState: userData.hometownState,
        hometownCountry: userData.hometownCountry,
        travelEndDate: userData.travelEndDate,
        currentLocation: userData.location
      });

      return true;
    } catch (error) {
      console.error('Error in manual transition:', error);
      return false;
    }
  }

  /**
   * Get users scheduled for transition
   */
  static async getUpcomingTransitions(): Promise<Array<{
    userId: number;
    username: string;
    travelEndDate: Date;
    daysUntilTransition: number;
  }>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    try {
      const upcomingTransitions = await db
        .select({
          userId: users.id,
          username: users.username,
          travelEndDate: users.travelEndDate
        })
        .from(users)
        .where(
          and(
            eq(users.userType, 'currently_traveling'),
            lte(users.travelEndDate, futureDate)
          )
        );

      return upcomingTransitions
        .filter(t => t.travelEndDate)
        .map(t => ({
          userId: t.userId,
          username: t.username,
          travelEndDate: t.travelEndDate!,
          daysUntilTransition: Math.ceil((t.travelEndDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        }))
        .sort((a, b) => a.daysUntilTransition - b.daysUntilTransition);

    } catch (error) {
      console.error('Error getting upcoming transitions:', error);
      return [];
    }
  }
}