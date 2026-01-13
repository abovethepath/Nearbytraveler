import { db } from "../db";
import { users, travelPlans } from "@shared/schema";
import { eq, and, lte, gte, or, isNotNull } from "drizzle-orm";

export class TravelStatusService {
  /**
   * Check and update travel status for all users based on current date
   * This should be called periodically (e.g., daily via cron job)
   */
  static async updateAllUserTravelStatuses(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      // Get all users who need travel status check:
      // 1. Users with planned travel plans
      // 2. Users who are marked as currently traveling
      // 3. Users who have destination data (stale or current)
      const usersToCheck = await db
        .select({
          userId: users.id,
          username: users.username,
          isCurrentlyTraveling: users.isCurrentlyTraveling,
          destinationCity: users.destinationCity,
          travelDestination: users.travelDestination,
        })
        .from(users)
        .where(
          or(
            eq(users.isCurrentlyTraveling, true),
            isNotNull(users.destinationCity),
            isNotNull(users.travelDestination)
          )
        )
        .limit(100);

      console.log(`Checking travel status for ${usersToCheck.length} users with travel data`);

      // Track unique user IDs to avoid duplicate processing
      const processedUserIds = new Set<number>();

      for (const user of usersToCheck) {
        if (!processedUserIds.has(user.userId)) {
          processedUserIds.add(user.userId);
          await this.updateUserTravelStatus(user.userId, today);
        }
      }

      console.log(`Travel status update completed for ${processedUserIds.size} unique users`);
    } catch (error) {
      console.error("Error updating travel statuses:", error);
    }
  }

  /**
   * Update travel status for a specific user
   */
  static async updateUserTravelStatus(userId: number, currentDate: Date = new Date()): Promise<void> {
    try {
      currentDate.setHours(0, 0, 0, 0); // Start of day

      // Get user's active travel plans
      const activePlans = await db
        .select()
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.userId, userId),
            eq(travelPlans.status, "planned"),
            lte(travelPlans.startDate, currentDate),
            gte(travelPlans.endDate, currentDate)
          )
        );

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) return;

      if (activePlans.length > 0) {
        // User should be traveling - update to currently traveling
        const currentPlan = activePlans[0]; // Use the first active plan

        const destinationParts = currentPlan.destination.split(', ');
        const [destinationCity, destinationState = null, destinationCountry] = destinationParts;
        
        if (!user.isCurrentlyTraveling || user.destinationCity !== destinationCity) {
          await db
            .update(users)
            .set({
              userType: user.userType === 'business' ? 'business' : 'traveler', // Keep business users as business
              isCurrentlyTraveling: true,
              // NEARBY TRAVELER DESTINATION (only active during trip dates)
              destinationCity: destinationCity,
              destinationState: destinationState,
              destinationCountry: destinationCountry || destinationParts[destinationParts.length - 1],
              travelStartDate: currentPlan.startDate ? new Date(currentPlan.startDate) : null,
              travelEndDate: currentPlan.endDate ? new Date(currentPlan.endDate) : null,
              // Legacy field for backwards compatibility
              travelDestination: currentPlan.destination,
            })
            .where(eq(users.id, userId));

          console.log(`User ${user.username} (${userId}) is now traveling to ${currentPlan.destination} (userType: ${user.userType === 'business' ? 'business' : 'traveler'})`);
        }
      } else {
        // No active plans - user should be local
        // ALWAYS clear destination fields if ANY stale data exists (not just when isCurrentlyTraveling is true)
        const hasStaleData = user.isCurrentlyTraveling || user.destinationCity || user.travelDestination;
        
        if (hasStaleData) {
          await db
            .update(users)
            .set({
              userType: user.userType === 'business' ? 'business' : 'local', // Keep business users as business
              isCurrentlyTraveling: false,
              // CLEAR DESTINATION FIELDS - User is now NEARBY LOCAL only
              destinationCity: null,
              destinationState: null,
              destinationCountry: null,
              travelStartDate: null,
              travelEndDate: null,
              // Legacy field for backwards compatibility
              travelDestination: null,
            })
            .where(eq(users.id, userId));

          console.log(`User ${user.username} (${userId}) is now back home - cleared stale travel data (userType: ${user.userType === 'business' ? 'business' : 'local'})`);
        }
      }
    } catch (error) {
      console.error(`Error updating travel status for user ${userId}:`, error);
    }
  }

  /**
   * Check if a user should be traveling on a specific date
   */
  static async checkUserTravelStatus(userId: number, checkDate: Date = new Date()): Promise<{
    shouldBeTravel: boolean;
    destination?: string;
    startDate?: string;
    endDate?: string;
  }> {
    try {
      checkDate.setHours(0, 0, 0, 0);

      const activePlans = await db
        .select()
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.userId, userId),
            eq(travelPlans.status, "planned"),
            lte(travelPlans.startDate, checkDate),
            gte(travelPlans.endDate, checkDate)
          )
        );

      if (activePlans.length > 0) {
        const plan = activePlans[0];
        return {
          shouldBeTravel: true,
          destination: plan.destination,
          startDate: plan.startDate?.toString() || undefined,
          endDate: plan.endDate?.toString() || undefined,
        };
      }

      return { shouldBeTravel: false };
    } catch (error) {
      console.error(`Error checking travel status for user ${userId}:`, error);
      return { shouldBeTravel: false };
    }
  }

  /**
   * FIXED: Set travel status for new users - only mark as traveling if trip is happening NOW
   */
  static async setNewUserTravelStatus(userId: number): Promise<void> {
    try {
      const now = new Date();
      
      // Check if user has any CURRENT travel plans (not future ones)
      const currentTravelPlans = await db
        .select()
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.userId, userId),
            lte(travelPlans.startDate, now),
            gte(travelPlans.endDate, now)
          )
        );

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return;

      if (currentTravelPlans.length > 0) {
        // User is CURRENTLY traveling (dates include today)
        const currentPlan = currentTravelPlans[0];
        await db
          .update(users)
          .set({
            userType: user.userType === 'business' ? 'business' : 'traveler', // Keep business users as business
            isCurrentlyTraveling: true,
            travelDestination: currentPlan.destination,
            travelStartDate: currentPlan.startDate,
            travelEndDate: currentPlan.endDate,
          })
          .where(eq(users.id, userId));
        
        console.log(`New user ${user.username} (${userId}) is CURRENTLY traveling to ${currentPlan.destination} (userType: ${user.userType === 'business' ? 'business' : 'traveler'})`);
      } else {
        // User is NOT currently traveling (future trips don't count as current travel)
        await db
          .update(users)
          .set({
            userType: user.userType === 'business' ? 'business' : 'local', // Keep business users as business
            isCurrentlyTraveling: false,
            travelDestination: null,
            travelStartDate: null,
            travelEndDate: null,
          })
          .where(eq(users.id, userId));
        
        console.log(`New user ${user.username} (${userId}) is LOCAL (userType: ${user.userType === 'business' ? 'business' : 'local'}) (future trips remain as planned trips until travel dates)`);
      }
    } catch (error) {
      console.error(`Error setting new user travel status for ${userId}:`, error);
    }
  }
}