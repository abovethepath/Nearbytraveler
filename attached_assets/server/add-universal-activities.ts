import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Universal activities that should exist in EVERY city
const UNIVERSAL_ACTIVITIES = [
  {
    name: "MEET LOCALS HERE",
    description: "Connect with local residents who know the best spots and hidden gems",
    category: "Social"
  },
  {
    name: "MEET TRAVELERS HERE", 
    description: "Connect with fellow travelers exploring this destination",
    category: "Social"
  },
  {
    name: "SINGLE",
    description: "Connect with other single travelers looking for companionship and fun",
    category: "Social"
  },
  {
    name: "LGBTQ+ Events",
    description: "LGBTQ+ friendly meetups, events, and social gatherings",
    category: "Social"
  },
  {
    name: "Outdoor Activities",
    description: "Hiking, walking tours, outdoor sports and nature activities",
    category: "Outdoor"
  },
  {
    name: "Nightlife & Entertainment",
    description: "Bars, clubs, live music venues and evening entertainment",
    category: "Entertainment"
  },
  {
    name: "Food & Dining Experiences",
    description: "Restaurant meetups, food tours, cooking classes and culinary experiences",
    category: "Food"
  },
  {
    name: "Photography & Sightseeing",
    description: "Photo walks, scenic viewpoints and must-see landmarks",
    category: "Culture"
  },
  {
    name: "Local Markets & Shopping",
    description: "Visit local markets, unique shops and authentic shopping experiences",
    category: "Shopping"
  },
  {
    name: "Arts & Culture",
    description: "Museums, galleries, cultural sites and artistic experiences",
    category: "Culture"
  }
];

export async function addUniversalActivitiesToCity(cityName: string, userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🌍 UNIVERSAL: Adding universal activities to ${cityName}...`);
  
  for (const activity of UNIVERSAL_ACTIVITIES) {
    try {
      // Check if this universal activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, cityName),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        // Add the universal activity
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
        console.log(`✅ Added universal activity: ${activity.name} to ${cityName}`);
      }
    } catch (error) {
      // Skip duplicates silently
      if (!(error as any)?.message?.includes('duplicate key')) {
        console.error(`Error adding universal activity ${activity.name} to ${cityName}:`, error);
      }
    }
  }
  
  console.log(`🌍 UNIVERSAL: Added ${addedCount} universal activities to ${cityName}`);
  return addedCount;
}

export async function addUniversalActivitiesToAllCities(): Promise<void> {
  console.log('🌍 UNIVERSAL: Starting to add universal activities to all cities...');
  
  // Get all unique city names from existing activities
  const cities = await db
    .selectDistinct({ cityName: cityActivities.cityName })
    .from(cityActivities);
  
  console.log(`🌍 UNIVERSAL: Found ${cities.length} cities to update`);
  
  for (const city of cities) {
    await addUniversalActivitiesToCity(city.cityName);
  }
  
  console.log('🌍 UNIVERSAL: Finished adding universal activities to all cities');
}