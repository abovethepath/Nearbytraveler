import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateCityActivities } from './ai-city-activities.js';
import { GENERIC_CITY_ACTIVITIES } from './generic-city-activities.js';

export async function ensureCityHasActivities(cityName: string, userId: number = 1): Promise<void> {
  try {
    console.log(`🏙️ AUTO-SETUP: Checking if ${cityName} has activities...`);
    
    // Check if city already has activities
    const existingActivities = await db
      .select()
      .from(cityActivities)
      .where(eq(cityActivities.cityName, cityName))
      .limit(1);
    
    if (existingActivities.length > 0) {
      console.log(`✅ AUTO-SETUP: ${cityName} already has ${existingActivities.length} activities`);
      return;
    }
    
    console.log(`🤖 AUTO-SETUP: Generating activities for new city: ${cityName}`);
    
    // Generate activities using AI (includes generic + city-specific)
    const generatedActivities = await generateCityActivities(cityName);
    
    // Insert all activities into database
    const savedActivities = [];
    for (const activity of generatedActivities) {
      try {
        const newActivity = await db.insert(cityActivities).values({
          cityName,
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: '',
          country: 'United States',
          createdByUserId: userId,
          isActive: true
        }).returning();
        
        savedActivities.push(newActivity[0]);
      } catch (error) {
        // Skip duplicates silently
        if (!(error as any)?.message?.includes('duplicate key')) {
          console.error(`Error saving activity ${activity.name}:`, error);
        }
      }
    }
    
    console.log(`✅ AUTO-SETUP: Added ${savedActivities.length} activities to ${cityName}`);
    
  } catch (error) {
    console.error(`Error setting up activities for ${cityName}:`, error);
  }
}

export async function enhanceExistingCityWithMoreActivities(cityName: string, userId: number = 1): Promise<number> {
  try {
    console.log(`🚀 ENHANCE: Adding more AI activities to ${cityName}...`);
    
    // Generate new activities
    const generatedActivities = await generateCityActivities(cityName);
    
    // Insert only new activities (skip duplicates)
    let addedCount = 0;
    for (const activity of generatedActivities) {
      try {
        // Check if activity already exists
        const existing = await db
          .select()
          .from(cityActivities)
          .where(and(
            eq(cityActivities.cityName, cityName),
            eq(cityActivities.activityName, activity.name)
          ))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(cityActivities).values({
            cityName,
            activityName: activity.name,
            description: activity.description,
            category: activity.category,
            state: '',
            country: 'United States',
            createdByUserId: userId,
            isActive: true
          });
          addedCount++;
        }
      } catch (error) {
        // Skip errors silently (likely duplicates)
      }
    }
    
    console.log(`✅ ENHANCE: Added ${addedCount} new activities to ${cityName}`);
    return addedCount;
    
  } catch (error) {
    console.error(`Error enhancing ${cityName} with more activities:`, error);
    return 0;
  }
}