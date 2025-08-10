import { db } from "../db";
import { users, travelPlans } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";

export class TravelStatusService {
  /**
   * Check and update travel status for all users based on current date
   * This should be called periodically (e.g., daily via cron job)
   */
  static async updateAllUserTravelStatuses(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Travel status update timed out")), 10000); // 10 second timeout
      });

      // Get all users with travel plans with timeout
      const usersWithPlans = await Promise.race([
        db
          .select({
            userId: users.id,
            username: users.username,
            isCurrentlyTraveling: users.isCurrentlyTraveling,
            travelDestination: users.travelDestination,
            travelStartDate: users.travelStartDate,
            travelEndDate: users.travelEndDate,
            planId: travelPlans.id,
            planDestination: travelPlans.destination,
            planStartDate: travelPlans.startDate,
            planEndDate: travelPlans.endDate,
          })
          .from(users)
          .leftJoin(travelPlans, eq(users.id, travelPlans.userId))
          .where(eq(travelPlans.status, "planned")),
        timeoutPromise
      ]) as any[];

      console.log(`Checking travel status for ${usersWithPlans.length} user travel plans`);

      for (const userPlan of usersWithPlans) {
        await this.updateUserTravelStatus(userPlan.userId, today);
      }

      console.log("Travel status update completed for all users");
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

        if (!user.isCurrentlyTraveling || user.travelDestination !== currentPlan.destination) {
          await db
            .update(users)
            .set({
              userType: user.userType === 'business' ? 'business' : 'traveler', // Keep business users as business
              isCurrentlyTraveling: true,
              travelDestination: currentPlan.destination,
              travelStartDate: currentPlan.startDate ? new Date(currentPlan.startDate) : null,
              travelEndDate: currentPlan.endDate ? new Date(currentPlan.endDate) : null,
            })
            .where(eq(users.id, userId));

          console.log(`User ${user.username} (${userId}) is now traveling to ${currentPlan.destination} (userType: ${user.userType === 'business' ? 'business' : 'traveler'})`);
        }
      } else {
        // No active plans - user should be local
        if (user.isCurrentlyTraveling) {
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

          console.log(`User ${user.username} (${userId}) is now back home (userType: ${user.userType === 'business' ? 'business' : 'local'})`);
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
    startDate?: string | undefined;
    endDate?: string | undefined;
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
          startDate: plan.startDate?.toISOString(),
          endDate: plan.endDate?.toISOString(),
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