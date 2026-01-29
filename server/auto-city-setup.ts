import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateCityActivities } from './ai-city-activities.js';
import { GENERIC_CITY_ACTIVITIES } from './generic-city-activities.js';
import { getStaticActivitiesForCity, getFeaturedActivitiesForCity } from './static-city-activities.js';

export async function ensureCityHasActivities(cityName: string, state?: string, country?: string, userId: number = 1): Promise<void> {
  try {
    console.log(`🏙️ AUTO-SETUP: Checking if ${cityName} has universal activities...`);
    
    // Check if city has ALL universal activities - we need to ensure ALL exist
    // Don't exit early if city has some activities - we need to check each universal activity
    const universalActivitiesNames = GENERIC_CITY_ACTIVITIES.map(a => a.name);
    
    let missingCount = 0;
    for (const universalName of universalActivitiesNames) {
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, cityName),
          eq(cityActivities.activityName, universalName)
        ))
        .limit(1);
        
      if (existing.length === 0) {
        missingCount++;
      }
    }
    
    if (missingCount === 0) {
      console.log(`✅ AUTO-SETUP: ${cityName} already has all ${universalActivitiesNames.length} universal activities`);
      return;
    }
    
    console.log(`🔧 AUTO-SETUP: Adding ${missingCount} missing universal activities to ${cityName}...`);
    
    // Add ONLY the missing universal activities (not city-specific ones)
    const savedActivities = [];
    for (const universalActivity of GENERIC_CITY_ACTIVITIES) {
      try {
        // Check if this specific universal activity exists
        const existing = await db
          .select()
          .from(cityActivities)
          .where(and(
            eq(cityActivities.cityName, cityName),
            eq(cityActivities.activityName, universalActivity.name)
          ))
          .limit(1);
          
        if (existing.length === 0) {
          // Add missing universal activity
          const newActivity = await db.insert(cityActivities).values({
            cityName,
            activityName: universalActivity.name,
            description: universalActivity.description,
            category: universalActivity.category,
            state: state || '',
            country: country || 'United States',
            createdByUserId: userId,
            isActive: true
          }).returning();
          
          savedActivities.push(newActivity[0]);
        }
      } catch (error) {
        // Skip duplicates silently
        if (!(error as any)?.message?.includes('duplicate key')) {
          console.error(`Error saving universal activity ${universalActivity.name}:`, error);
        }
      }
    }
    
    console.log(`✅ AUTO-SETUP: Added ${savedActivities.length} universal activities to ${cityName}`);
    
    // First, add FEATURED activities (curated top 12 for Popular section)
    const featuredActivities = getFeaturedActivitiesForCity(cityName);
    if (featuredActivities.length > 0) {
      console.log(`⭐ AUTO-SETUP: Adding ${featuredActivities.length} FEATURED activities to ${cityName}...`);
      
      let featuredAdded = 0;
      for (const featuredActivity of featuredActivities) {
        try {
          const existing = await db
            .select()
            .from(cityActivities)
            .where(and(
              eq(cityActivities.cityName, cityName),
              eq(cityActivities.activityName, featuredActivity.name)
            ))
            .limit(1);
            
          if (existing.length === 0) {
            await db.insert(cityActivities).values({
              cityName,
              activityName: featuredActivity.name,
              description: featuredActivity.description,
              category: featuredActivity.category,
              state: state || '',
              country: country || 'United States',
              createdByUserId: userId,
              isActive: true,
              source: 'featured',
              isFeatured: true,
              rank: featuredActivity.rank
            });
            featuredAdded++;
          } else {
            // Update existing to be featured if not already
            await db.update(cityActivities)
              .set({ 
                source: 'featured', 
                isFeatured: true, 
                rank: featuredActivity.rank 
              })
              .where(and(
                eq(cityActivities.cityName, cityName),
                eq(cityActivities.activityName, featuredActivity.name)
              ));
          }
        } catch (error) {
          if (!(error as any)?.message?.includes('duplicate key')) {
            console.error(`Error saving featured activity ${featuredActivity.name}:`, error);
          }
        }
      }
      console.log(`✅ AUTO-SETUP: Added ${featuredAdded} FEATURED activities to ${cityName}`);
    }
    
    // Get set of featured names to avoid marking them as static
    const featuredNames = new Set(featuredActivities.map(a => a.name));
    
    // Now add static city-specific activities (More Ideas section)
    const staticActivities = getStaticActivitiesForCity(cityName);
    if (staticActivities.length > 0) {
      console.log(`🏛️ AUTO-SETUP: Adding ${staticActivities.length} static city-specific activities to ${cityName}...`);
      
      let staticActivitiesAdded = 0;
      for (const staticActivity of staticActivities) {
        // Skip if it's already in featured
        if (featuredNames.has(staticActivity.name)) continue;
        
        try {
          // Check if this static activity already exists
          const existing = await db
            .select()
            .from(cityActivities)
            .where(and(
              eq(cityActivities.cityName, cityName),
              eq(cityActivities.activityName, staticActivity.name)
            ))
            .limit(1);
            
          if (existing.length === 0) {
            // Add missing static activity (NOT featured)
            await db.insert(cityActivities).values({
              cityName,
              activityName: staticActivity.name,
              description: staticActivity.description,
              category: staticActivity.category,
              state: state || '',
              country: country || 'United States',
              createdByUserId: userId,
              isActive: true,
              source: 'static',
              isFeatured: false,
              rank: 0
            });
            
            staticActivitiesAdded++;
          }
        } catch (error) {
          // Skip duplicates silently
          if (!(error as any)?.message?.includes('duplicate key')) {
            console.error(`Error saving static activity ${staticActivity.name}:`, error);
          }
        }
      }
      
      console.log(`✅ AUTO-SETUP: Added ${staticActivitiesAdded} static city-specific activities to ${cityName}`);
    }
    
  } catch (error) {
    console.error(`Error setting up activities for ${cityName}:`, error);
  }
}

export async function enhanceExistingCityWithMoreActivities(cityName: string, state?: string, country?: string, userId: number = 1): Promise<{ success: boolean; activitiesAdded: number; error?: string }> {
  try {
    console.log(`🚀 ENHANCE: Adding more AI activities to ${cityName}...`);
    
    // Generate new activities using AI
    const generatedActivities = await generateCityActivities(cityName);
    
    if (!generatedActivities || generatedActivities.length === 0) {
      console.log(`⚠️ ENHANCE: No activities generated for ${cityName}`);
      return { success: false, activitiesAdded: 0, error: 'No activities generated' };
    }
    
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
            state: state || '',
            country: country || 'United States',
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
    return { success: true, activitiesAdded: addedCount };
    
  } catch (error: any) {
    console.error(`Error enhancing ${cityName} with more activities:`, error);
    return { success: false, activitiesAdded: 0, error: error?.message || 'Unknown error' };
  }
}