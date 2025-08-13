import { db } from "../db";
import { users, travelPlans } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

export class UserStatusService {
  
  /**
   * Check for expired travel plans and update user status accordingly
   */
  async updateExpiredTravelers(): Promise<void> {
    try {
      const now = new Date();
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Expired travelers update timed out")), 5000); // 5 second timeout
      });
      
      // Find travel plans that have ended (end date is before now) with timeout
      const expiredPlans = await Promise.race([
        db
          .select({
            userId: travelPlans.userId,
            planId: travelPlans.id,
            destination: travelPlans.destination,
            endDate: travelPlans.endDate
          })
          .from(travelPlans)
          .where(
            and(
              eq(travelPlans.status, 'active'),
              lt(travelPlans.endDate, now)
            )
          ),
        timeoutPromise
      ]) as any[];

      console.log(`Found ${expiredPlans.length} expired travel plans`);

      for (const plan of expiredPlans) {
        // Get the user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, plan.userId));

        if (!user) continue;

        // Only update if user is currently a traveler
        if (user.userType === 'current_traveler') {
          // Update user to be a local in their hometown
          await db
            .update(users)
            .set({
              userType: 'local',
              location: user.hometownCity ? `${user.hometownCity}, ${user.hometownState || user.hometownCountry}` : user.location,
              travelDestination: null,
              travelStartDate: null,
              travelEndDate: null
            })
            .where(eq(users.id, user.id));

          console.log(`Updated user ${user.username} from traveler to local after trip to ${plan.destination} ended`);
        }

        // Mark the travel plan as completed
        await db
          .update(travelPlans)
          .set({
            status: 'completed'
          })
          .where(eq(travelPlans.id, plan.planId));
      }

    } catch (error) {
      console.error('Error updating expired travelers:', error);
    }
  }

  /**
   * Check for upcoming travel plans and update user status accordingly
   */
  async activateUpcomingTravelers(): Promise<void> {
    try {
      const now = new Date();
      
      // Find travel plans that are starting now (start date is today or before, but plan is not active)
      const startingPlans = await db
        .select({
          userId: travelPlans.userId,
          planId: travelPlans.id,
          destination: travelPlans.destination,
          startDate: travelPlans.startDate
        })
        .from(travelPlans)
        .where(
          and(
            eq(travelPlans.status, 'upcoming'),
            lt(travelPlans.startDate, now)
          )
        );

      console.log(`Found ${startingPlans.length} travel plans starting now`);

      for (const plan of startingPlans) {
        // Get the user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, plan.userId));

        if (!user) continue;

        // Update user to be a current traveler
        await db
          .update(users)
          .set({
            userType: 'current_traveler',
            location: plan.destination,
            travelDestination: plan.destination
          })
          .where(eq(users.id, user.id));

        // Mark the travel plan as active
        await db
          .update(travelPlans)
          .set({
            status: 'active'
          })
          .where(eq(travelPlans.id, plan.planId));

        console.log(`Updated user ${user.username} to current traveler for trip to ${plan.destination}`);
      }

    } catch (error) {
      console.error('Error activating upcoming travelers:', error);
    }
  }

  /**
   * Run periodic check for status updates
   */
  async runPeriodicCheck(): Promise<void> {
    console.log('Running periodic user status check...');
    await this.updateExpiredTravelers();
    await this.activateUpcomingTravelers();
  }

  /**
   * Start the periodic checker (runs every hour)
   */
  startPeriodicChecker(): void {
    // Run immediately
    this.runPeriodicCheck();
    
    // Then run every hour
    setInterval(() => {
      this.runPeriodicCheck();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    console.log('User status checker started - will run every hour');
  }
}

export const userStatusService = new UserStatusService();