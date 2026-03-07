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
// AI-enhanced city activities:     source = 'static'     (Anthropic-generated, saved permanently as static so they never disappear)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DEDUPLICATION HELPER
// Normalize an activity name for fuzzy comparison:
// lowercase, remove punctuation, strip common filler words.
// ---------------------------------------------------------------------------
function normalizeActivityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|at|in|of|and|or|de|van|het)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns true if the candidate name is too similar to any name in existingNames.
// Catches: exact matches, one name being a substring of the other, and high word overlap.
function isTooSimilarToExisting(candidate: string, existingNames: string[]): boolean {
  const normCandidate = normalizeActivityName(candidate);
  for (const existing of existingNames) {
    const normExisting = normalizeActivityName(existing);
    if (normCandidate === normExisting) return true;
    if (normCandidate.length > 5 && normExisting.includes(normCandidate)) return true;
    if (normExisting.length > 5 && normCandidate.includes(normExisting)) return true;
    // Word overlap > 70%
    const wordsA = new Set(normCandidate.split(' ').filter(w => w.length > 2));
    const wordsB = new Set(normExisting.split(' ').filter(w => w.length > 2));
    if (wordsA.size > 0 && wordsB.size > 0) {
      const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
      const union = new Set([...wordsA, ...wordsB]).size;
      if (intersection / union > 0.7) return true;
    }
  }
  return false;
}

// Check whether this city already has a sufficient number of AI-generated (source='static' from AI)
// or any 'static' activities to skip re-running AI generation.
async function cityAlreadyHasAIActivities(cityName: string): Promise<boolean> {
  const rows = await db
    .select({ id: cityActivities.id, activityName: cityActivities.activityName })
    .from(cityActivities)
    .where(and(
      eq(cityActivities.cityName, cityName),
      eq(cityActivities.source, 'ai')
    ))
    .limit(1);
  return rows.length > 0;
}

// Run AI enhancement as a non-blocking background task after basic seeding.
// This avoids slowing down user signup / profile updates.
// Skips if city already has AI-generated activities (permanent cache).
function triggerAIEnhancementAsync(cityName: string, state?: string, country?: string, userId: number = 1): void {
  setImmediate(async () => {
    try {
      // Skip if city already has AI activities (never regenerate)
      const alreadyHasAI = await cityAlreadyHasAIActivities(cityName);
      if (alreadyHasAI) return;

      const generatedActivities = await generateCityActivities(cityName);
      if (!generatedActivities || generatedActivities.length === 0) return;

      // Fetch all existing activity names for this city for fuzzy dedup
      const existingRows = await db
        .select({ activityName: cityActivities.activityName })
        .from(cityActivities)
        .where(eq(cityActivities.cityName, cityName));
      const existingNames = existingRows.map(r => r.activityName);

      let added = 0;
      for (const activity of generatedActivities) {
        try {
          // Fuzzy dedup: skip if too similar to any existing activity
          if (isTooSimilarToExisting(activity.name, existingNames)) continue;

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
// Permanently saves AI-generated activities to the database as source='ai'.
// Once a city has any AI activities saved, never calls the AI again (permanent cache).
// ---------------------------------------------------------------------------
export async function enhanceExistingCityWithMoreActivities(
  cityName: string,
  state?: string,
  country?: string,
  userId: number = 1
): Promise<{ success: boolean; activitiesAdded: number; cached?: boolean; error?: string }> {
  try {
    // Permanent cache: if city already has AI-generated activities, skip AI call entirely
    const alreadyHasAI = await cityAlreadyHasAIActivities(cityName);
    if (alreadyHasAI) {
      console.log(`⚡ ENHANCE: ${cityName} already has AI activities — serving from DB cache`);
      return { success: true, activitiesAdded: 0, cached: true };
    }

    console.log(`🚀 ENHANCE: Generating AI activities for ${cityName} (first time)...`);

    const generatedActivities = await generateCityActivities(cityName);
    if (!generatedActivities || generatedActivities.length === 0) {
      return { success: false, activitiesAdded: 0, error: 'No activities generated' };
    }

    // Fetch ALL existing activity names for this city before inserting (for fuzzy dedup)
    const existingRows = await db
      .select({ activityName: cityActivities.activityName })
      .from(cityActivities)
      .where(eq(cityActivities.cityName, cityName));
    const existingNames = existingRows.map(r => r.activityName);

    let addedCount = 0;
    for (const activity of generatedActivities) {
      try {
        // Fuzzy dedup: skip if too similar to any existing activity name
        if (isTooSimilarToExisting(activity.name, existingNames)) {
          console.log(`  ↳ Skipping duplicate: "${activity.name}"`);
          continue;
        }

        const exactMatch = await db
          .select({ id: cityActivities.id })
          .from(cityActivities)
          .where(and(
            eq(cityActivities.cityName, cityName),
            eq(cityActivities.activityName, activity.name)
          ))
          .limit(1);

        if (exactMatch.length === 0) {
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
          // Track newly added name for dedup within this same batch
          existingNames.push(activity.name);
          addedCount++;
        }
      } catch {
        // skip silently
      }
    }

    console.log(`✅ ENHANCE: Saved ${addedCount} new AI activities for ${cityName} (permanent)`);
    return { success: true, activitiesAdded: addedCount };

  } catch (error: any) {
    console.error(`Error enhancing ${cityName}:`, error);
    return { success: false, activitiesAdded: 0, error: error?.message || 'Unknown error' };
  }
}
