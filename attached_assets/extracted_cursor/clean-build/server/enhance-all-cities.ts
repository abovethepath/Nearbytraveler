import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, count, sql } from 'drizzle-orm';
import { generateCityActivities } from './ai-city-activities.js';

// Enhanced prompt for major event activities and city-specific experiences
export async function generateCityActivitiesEnhanced(cityName: string): Promise<any[]> {
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Generate a comprehensive list of 40-50 HIGHLY SPECIFIC activities for ${cityName}. 

CRITICAL REQUIREMENTS:
1. Be extremely specific to ${cityName} - mention EXACT landmarks, museums, neighborhoods, restaurants, parks, and local attractions by NAME
2. Include MAJOR EVENTS like festivals, concerts, conventions, sports events, seasonal celebrations
3. Include SPECIFIC ACTIVITY EXAMPLES like the user requested: Comic-Con, Auto Show, Ted Talk, Coachella, South by Southwest, Lollapalooza, New York Fashion Week, Mardi Gras
4. NO generic descriptions - every activity must mention real places, real events, real venues

FOR ${cityName}, include SPECIFIC examples like:

MAJOR EVENTS & FESTIVALS (be specific to the city):
- Comic-Con (if San Diego) 
- Fashion Week (if NYC, Milan, Paris)
- Music Festivals (specific ones that happen in ${cityName})
- Auto Shows (specific venue names)
- Food Festivals (actual festival names)
- Cultural Festivals (real events)
- Sports Events (actual team names and stadium names)

TOURISM & LANDMARKS:
- Named landmarks and monuments (exact names like "Statue of Liberty", "Eiffel Tower")
- Specific museums and galleries (actual museum names like "Louvre", "MoMA")
- Architectural wonders (real building names)

NEIGHBORHOODS & DISTRICTS:
- Named neighborhoods (real area names like "SoHo", "Montmartre", "Shibuya")
- Shopping districts (actual street/area names)
- Entertainment districts (real district names)

FOOD & DINING:
- Famous restaurants and markets (actual establishment names where possible)
- Food tours of specific areas (real neighborhood names)
- Local specialties (authentic dishes specific to the region)

OUTDOOR & RECREATION:
- Named parks and beaches (exact location names)
- Hiking trails (specific trail names)
- Water activities (specific locations)

NIGHTLIFE & ENTERTAINMENT:
- Famous venues (actual venue names where known)
- Specific entertainment districts
- Local nightlife experiences

UNIQUE LOCAL EXPERIENCES:
- Authentic local traditions specific to ${cityName}
- Seasonal activities unique to the area
- Cultural experiences specific to the region

DAY TRIPS:
- Specific nearby destinations (actual place names)

Return as JSON with this exact format:
{
  "activities": [
    {
      "name": "Highly Specific Activity Name with Exact Location/Event",
      "category": "Tourism|Culture|Food|Nightlife|Outdoor|Shopping|Events|Sports|Local|Daytrips",
      "description": "Specific description mentioning real places and details"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a LOCAL EXPERT and EVENT COORDINATOR who has lived in ${cityName} for decades. You know:
- EXACT names of every major landmark, museum, park, restaurant, and venue
- ALL major events, festivals, conventions, and seasonal celebrations that happen in ${cityName}
- SPECIFIC neighborhoods, districts, and local areas by their real names
- ACTUAL sports teams, stadiums, and venues
- REAL shopping areas, markets, and entertainment districts
- AUTHENTIC local traditions and cultural experiences unique to ${cityName}

NEVER use generic terms. Always mention specific, real places and events by their actual names. Include major events like conventions, festivals, fashion weeks, auto shows, music festivals, and cultural celebrations that actually happen in ${cityName}.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"activities": []}');
    return result.activities || [];
    
  } catch (error) {
    console.error(`Error generating enhanced activities for ${cityName}:`, error);
    return [];
  }
}

// Get all cities that need activity enhancement
export async function getAllCitiesNeedingActivities(): Promise<string[]> {
  try {
    // Get city activity counts
    const cityActivityCounts = await db
      .select({
        cityName: cityActivities.cityName,
        count: count(cityActivities.id)
      })
      .from(cityActivities)
      .groupBy(cityActivities.cityName);

    // Get all unique cities from various sources
    const allCitiesQuery = await db.execute(sql`
      SELECT DISTINCT city_name as city FROM (
        SELECT DISTINCT city_name FROM city_activities
        UNION
        SELECT DISTINCT city as city_name FROM city_pages
        UNION  
        SELECT DISTINCT destination_city as city_name FROM travel_plans WHERE destination_city IS NOT NULL
        UNION
        SELECT DISTINCT hometown_city as city_name FROM users WHERE hometown_city IS NOT NULL
      ) cities
      WHERE city_name IS NOT NULL AND city_name != ''
      ORDER BY city_name
    `);

    const allCities = allCitiesQuery.rows.map((row: any) => row.city);
    
    // Find cities with fewer than 60 activities
    const citiesNeedingActivities = allCities.filter(city => {
      const cityCount = cityActivityCounts.find(c => c.cityName === city);
      return !cityCount || cityCount.count < 60;
    });

    console.log(`🎯 CITY ENHANCEMENT: Found ${citiesNeedingActivities.length} cities needing more activities`);
    console.log(`Cities to enhance:`, citiesNeedingActivities.slice(0, 10));
    
    return citiesNeedingActivities;
    
  } catch (error) {
    console.error('Error getting cities needing activities:', error);
    return [];
  }
}

// Enhance a single city with comprehensive activities
export async function enhanceCity(cityName: string, userId: number = 1): Promise<number> {
  try {
    console.log(`🚀 ENHANCING: ${cityName} with comprehensive city-specific activities...`);
    
    // Generate enhanced activities
    const generatedActivities = await generateCityActivitiesEnhanced(cityName);
    
    if (generatedActivities.length === 0) {
      console.log(`❌ No activities generated for ${cityName}`);
      return 0;
    }
    
    // Insert only new activities (skip duplicates)
    let addedCount = 0;
    for (const activity of generatedActivities) {
      try {
        // Check if activity already exists
        const existing = await db
          .select()
          .from(cityActivities)
          .where(sql`LOWER(city_name) = LOWER(${cityName}) AND LOWER(activity_name) = LOWER(${activity.name})`)
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(cityActivities).values({
            cityName,
            activityName: activity.name,
            description: activity.description || `Enjoy ${activity.name} in ${cityName}`,
            category: activity.category || 'Local',
            state: '',
            country: '',
            createdByUserId: userId,
            isActive: true
          });
          addedCount++;
        }
      } catch (error) {
        // Skip errors silently (likely duplicates)
        console.log(`⚠️ Skipping duplicate: ${activity.name}`);
      }
    }
    
    console.log(`✅ ENHANCED: Added ${addedCount} new specific activities to ${cityName} (generated ${generatedActivities.length} total)`);
    return addedCount;
    
  } catch (error) {
    console.error(`Error enhancing ${cityName}:`, error);
    return 0;
  }
}

// Enhance all cities that need more activities
export async function enhanceAllCities(): Promise<void> {
  try {
    console.log(`🌍 STARTING: Comprehensive city enhancement with major events and specific activities...`);
    
    const citiesNeedingActivities = await getAllCitiesNeedingActivities();
    
    if (citiesNeedingActivities.length === 0) {
      console.log(`✅ All cities already have sufficient activities!`);
      return;
    }
    
    let totalEnhanced = 0;
    let totalActivitiesAdded = 0;
    
    // Process cities in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < citiesNeedingActivities.length; i += batchSize) {
      const batch = citiesNeedingActivities.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(citiesNeedingActivities.length/batchSize)}: ${batch.join(', ')}`);
      
      const batchPromises = batch.map(async (city) => {
        const added = await enhanceCity(city);
        if (added > 0) {
          totalEnhanced++;
          totalActivitiesAdded += added;
        }
        
        // Add delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { city, added };
      });
      
      await Promise.all(batchPromises);
      
      // Longer delay between batches
      if (i + batchSize < citiesNeedingActivities.length) {
        console.log(`⏳ Waiting 3 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`🎉 ENHANCEMENT COMPLETE!`);
    console.log(`📊 Enhanced ${totalEnhanced} cities with ${totalActivitiesAdded} new specific activities`);
    console.log(`🏆 All cities now have comprehensive, city-specific activities including major events!`);
    
  } catch (error) {
    console.error('Error enhancing all cities:', error);
  }
}