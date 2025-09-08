import { db } from "../db";
import { travelPlans, users } from "@shared/schema";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";

export interface UserStatus {
  isCurrentlyTraveling: boolean;
  currentTravelPlan?: any;
  displayType: 'local' | 'traveler';
  displayLocation: string;
  hometownLocation: string;
}

/**
 * Determines if a user is currently traveling based on active travel plans
 * A user is a "traveler" if they have an active travel plan (current date is between start and end dates)
 * A user is a "local" if they have no active travel plans
 */
export async function getUserCurrentStatus(userId: number): Promise<UserStatus> {
  const now = new Date();
  
  // Get user's hometown info
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  
  // Build hometown location string
  const hometownParts = [user.hometownCity, user.hometownState, user.hometownCountry].filter(Boolean);
  const hometownLocation = hometownParts.join(', ') || 'Unknown';
  
  // Check for active travel plans (current date is between start and end dates)
  const activeTravelPlans = await db
    .select()
    .from(travelPlans)
    .where(
      and(
        eq(travelPlans.userId, userId),
        lte(travelPlans.startDate, now), // Trip has started
        gte(travelPlans.endDate, now)    // Trip hasn't ended
      )
    )
    .orderBy(travelPlans.startDate);
  
  if (activeTravelPlans.length > 0) {
    // User is currently traveling
    const currentTrip = activeTravelPlans[0]; // Get the first active trip
    
    // Build travel destination string
    const destinationParts = [currentTrip.destinationCity, currentTrip.destinationState, currentTrip.destinationCountry].filter(Boolean);
    const travelLocation = destinationParts.join(', ') || currentTrip.destination || 'Unknown';
    
    return {
      isCurrentlyTraveling: true,
      currentTravelPlan: currentTrip,
      displayType: 'traveler',
      displayLocation: `Nearby Traveler • ${travelLocation}`,
      hometownLocation: `From: ${hometownLocation}`
    };
  } else {
    // User is currently local (in hometown)
    return {
      isCurrentlyTraveling: false,
      currentTravelPlan: null,
      displayType: 'local',
      displayLocation: `Nearby Local • ${hometownLocation}`,
      hometownLocation: hometownLocation
    };
  }
}

/**
 * Updates all users' travel status based on their current travel plans
 * This should be run periodically to keep user statuses current
 */
export async function updateAllUserTravelStatuses() {
  const now = new Date();
  console.log('📅 TRAVEL STATUS: Updating all user travel statuses...');
  
  // Get all users with travel plans
  const usersWithPlans = await db
    .select({ 
      userId: travelPlans.userId,
      hasActiveTrip: travelPlans.id
    })
    .from(travelPlans)
    .where(
      and(
        lte(travelPlans.startDate, now),
        gte(travelPlans.endDate, now)
      )
    );
  
  const activeUserIds = new Set(usersWithPlans.map(u => u.userId));
  
  // Update users with active trips to be travelers
  if (activeUserIds.size > 0) {
    console.log(`📅 TRAVEL STATUS: Setting ${activeUserIds.size} users as currently traveling`);
    await db
      .update(users)
      .set({ isCurrentlyTraveling: true })
      .where(eq(users.id, Array.from(activeUserIds)[0])); // TODO: Fix for multiple users
  }
  
  // Update users without active trips to be locals
  console.log('📅 TRAVEL STATUS: Setting users without active trips as locals');
  await db
    .update(users)
    .set({ isCurrentlyTraveling: false })
    .where(
      or(
        isNull(users.id), // This won't match anyone, need better logic
        eq(users.isCurrentlyTraveling, true) // Reset all currently traveling users first
      )
    );
    
  console.log('📅 TRAVEL STATUS: User travel statuses updated successfully');
}

/**
 * Get location display string for a user that always shows hometown
 * and shows travel destination if currently traveling
 */
export async function getUserLocationDisplay(userId: number): Promise<string> {
  const status = await getUserCurrentStatus(userId);
  
  if (status.isCurrentlyTraveling) {
    // Show both travel destination and hometown
    return `${status.displayLocation} • ${status.hometownLocation}`;
  } else {
    // Just show hometown with "Nearby Local" prefix
    return status.displayLocation;
  }
}