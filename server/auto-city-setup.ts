import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateCityActivities } from './ai-city-activities.js';
import { GENERIC_CITY_ACTIVITIES } from './generic-city-activities.js';
import { getStaticActivitiesForCity, getFeaturedActivitiesForCity } from './static-city-activities.js';

// ---------------------------------------------------------------------------
// GROUP DEFINITIONS
// ---------------------------------------------------------------------------
// Group 1  — Featured / Popular:   source = 'featured'   (city-specific curated top 12 from static-city-activities.ts)
// Group 2  — City-Specific Static: source = 'static'     (extra city attractions beyond top 12)
// Group 3  — Generic (all cities): source = 'generic'    (40 universal activities, same for every city)
// Group 4  — [COMING SOON]:        source = 'group4'     (placeholder — add logic below when ready)
// AI-enhanced city activities:     source = 'ai'         (Anthropic-generated city-specific, added asynchronously)
// ---------------------------------------------------------------------------

// Run AI enhancement as a non-blocking background task after basic seeding.
// This avoids slowing down user signup / profile updates.
function triggerAIEnhancementAsync(cityName: string, state?: string, country?: string, userId: number = 1): void {
  setImmediate(async () => {
    try {
      const generatedActivities = await generateCityActivities(cityName);
      if (!generatedActivities || generatedActivities.length === 0) return;

      let added = 0;
      for (const activity of generatedActivities) {
        try {
          const existing = await db
            .select({ id: cityActivities.id })
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
              isActive: true,
              source: 'ai',
              isFeatured: false,
              rank: 0
            });
            added++;
          }
        } catch {
          // skip duplicate / constraint errors silently
        }
      }
      if (added > 0) {
        console.log(`🤖 AUTO-SETUP AI: Added ${added} AI activities to ${cityName}`);
      }
    } catch (error) {
      console.error(`⚠️ AUTO-SETUP AI: Background enhancement failed for ${cityName}:`, error);
    }
  });
}

// ---------------------------------------------------------------------------
// MAIN ENTRY POINT — called every time a city is first seen / created
// ---------------------------------------------------------------------------
export async function ensureCityHasActivities(
  cityName: string,
  state?: string,
  country?: string,
  userId: number = 1
): Promise<void> {
  try {
    console.log(`🏙️ AUTO-SETUP: Seeding activity groups for ${cityName}...`);

    // -----------------------------------------------------------------------
    // GROUP 1: Featured activities — curated top 12 city-specific attractions
    // -----------------------------------------------------------------------
    const featuredActivities = getFeaturedActivitiesForCity(cityName);
    if (featuredActivities.length > 0) {
      let featuredAdded = 0;
      for (const fa of featuredActivities) {
        try {
          const existing = await db
            .select({ id: cityActivities.id })
            .from(cityActivities)
            .where(and(
              eq(cityActivities.cityName, cityName),
              eq(cityActivities.activityName, fa.name)
            ))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cityActivities).values({
              cityName,
              activityName: fa.name,
              description: fa.description,
              category: fa.category,
              state: state || '',
              country: country || 'United States',
              createdByUserId: userId,
              isActive: true,
              source: 'featured',
              isFeatured: true,
              rank: fa.rank
            });
            featuredAdded++;
          } else {
            await db.update(cityActivities)
              .set({ source: 'featured', isFeatured: true, rank: fa.rank })
              .where(and(
                eq(cityActivities.cityName, cityName),
                eq(cityActivities.activityName, fa.name)
              ));
          }
        } catch (error) {
          if (!(error as any)?.message?.includes('duplicate key')) {
            console.error(`Error saving featured activity ${fa.name}:`, error);
          }
        }
      }
      console.log(`✅ GROUP 1 (Featured): +${featuredAdded} for ${cityName}`);
    }

    // -----------------------------------------------------------------------
    // GROUP 2: Static city-specific activities (beyond the featured top 12)
    // -----------------------------------------------------------------------
    const featuredNames = new Set(featuredActivities.map(a => a.name));
    const staticActivities = getStaticActivitiesForCity(cityName);
    if (staticActivities.length > 0) {
      let staticAdded = 0;
      for (const sa of staticActivities) {
        if (featuredNames.has(sa.name)) continue;
        try {
          const existing = await db
            .select({ id: cityActivities.id })
            .from(cityActivities)
            .where(and(
              eq(cityActivities.cityName, cityName),
              eq(cityActivities.activityName, sa.name)
            ))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cityActivities).values({
              cityName,
              activityName: sa.name,
              description: sa.description,
              category: sa.category,
              state: state || '',
              country: country || 'United States',
              createdByUserId: userId,
              isActive: true,
              source: 'static',
              isFeatured: false,
              rank: 0
            });
            staticAdded++;
          }
        } catch (error) {
          if (!(error as any)?.message?.includes('duplicate key')) {
            console.error(`Error saving static activity ${sa.name}:`, error);
          }
        }
      }
      if (staticAdded > 0) {
        console.log(`✅ GROUP 2 (Static city-specific): +${staticAdded} for ${cityName}`);
      }
    }

    // -----------------------------------------------------------------------
    // GROUP 3: Generic activities — universal set for ALL cities (bulk insert)
    // -----------------------------------------------------------------------
    const rows = GENERIC_CITY_ACTIVITIES.map(ga => ({
      cityName,
      activityName: ga.name,
      description: ga.description,
      category: ga.category,
      state: state || '',
      country: country || 'United States',
      createdByUserId: userId,
      isActive: true,
      source: 'generic' as const,
      isFeatured: false,
      isHidden: false,
      rank: 0
    }));

    // Bulk-insert rows that don't already exist, using a CTE to skip duplicates
    const escaped = (s: string) => s.replace(/'/g, "''");
    const valuesSql = rows
      .map(r => `('${escaped(r.cityName)}','${escaped(r.activityName)}','${escaped(r.description)}','${escaped(r.category)}',${r.createdByUserId})`)
      .join(',\n  ');

    await db.execute(sql.raw(`
      WITH new_generics(city_name, activity_name, description, category, uid) AS (
        VALUES
        ${valuesSql}
      )
      INSERT INTO city_activities
        (city_name, activity_name, description, category, state, country,
         created_by_user_id, is_active, source, is_featured, is_hidden, rank)
      SELECT ng.city_name, ng.activity_name, ng.description, ng.category,
             '', '${escaped(country || 'United States')}',
             ng.uid, true, 'generic', false, false, 0
      FROM new_generics ng
      WHERE NOT EXISTS (
        SELECT 1 FROM city_activities ca
        WHERE ca.city_name = ng.city_name AND ca.activity_name = ng.activity_name
      );
    `));
    console.log(`✅ GROUP 3 (Generic): bulk-seeded ${GENERIC_CITY_ACTIVITIES.length} generic activities for ${cityName}`);

    // -----------------------------------------------------------------------
    // GROUP 4: [COMING SOON] — add seeding logic here when ready
    // Import the Group 4 constant/function and insert rows with source = 'group4'
    // -----------------------------------------------------------------------
    // Example (uncomment and fill in when Group 4 is ready):
    //
    // import { GROUP4_ACTIVITIES } from './group4-activities.js';
    // for (const g4 of GROUP4_ACTIVITIES) {
    //   // insert with source: 'group4'
    // }
    //
    // console.log(`✅ GROUP 4: seeded for ${cityName}`);

    // -----------------------------------------------------------------------
    // AI enhancement — runs in the background, does NOT block city creation
    // Generates 7 city-specific + seasonal activities via Anthropic Claude
    // -----------------------------------------------------------------------
    triggerAIEnhancementAsync(cityName, state, country, userId);

    console.log(`🎉 AUTO-SETUP complete for ${cityName} (AI enhancement running in background)`);

  } catch (error) {
    console.error(`Error setting up activities for ${cityName}:`, error);
  }
}

// ---------------------------------------------------------------------------
// Manual enhancement endpoint helper — called from /api/city-activities/:city/enhance
// ---------------------------------------------------------------------------
export async function enhanceExistingCityWithMoreActivities(
  cityName: string,
  state?: string,
  country?: string,
  userId: number = 1
): Promise<{ success: boolean; activitiesAdded: number; error?: string }> {
  try {
    console.log(`🚀 ENHANCE: Adding AI activities to ${cityName}...`);

    const generatedActivities = await generateCityActivities(cityName);
    if (!generatedActivities || generatedActivities.length === 0) {
      return { success: false, activitiesAdded: 0, error: 'No activities generated' };
    }

    let addedCount = 0;
    for (const activity of generatedActivities) {
      try {
        const existing = await db
          .select({ id: cityActivities.id })
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
            isActive: true,
            source: 'ai',
            isFeatured: false,
            rank: 0
          });
          addedCount++;
        }
      } catch {
        // skip silently
      }
    }

    console.log(`✅ ENHANCE: Added ${addedCount} AI activities to ${cityName}`);
    return { success: true, activitiesAdded: addedCount };

  } catch (error: any) {
    console.error(`Error enhancing ${cityName}:`, error);
    return { success: false, activitiesAdded: 0, error: error?.message || 'Unknown error' };
  }
}
