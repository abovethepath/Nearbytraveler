import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Barcelona-specific activities that should exist in Barcelona
const BARCELONA_SPECIFIC_ACTIVITIES = [
  {
    name: "Sagrada Familia Tours",
    description: "Visit Gaudí's masterpiece, the iconic unfinished basilica",
    category: "Culture"
  },
  {
    name: "Park Güell Exploration", 
    description: "Explore Gaudí's whimsical park with mosaic art and city views",
    category: "Tourism"
  },
  {
    name: "Picasso Museum Visit",
    description: "Discover Picasso's early works at this world-renowned museum",
    category: "Culture"
  },
  {
    name: "Gothic Quarter Walking Tours",
    description: "Wander through medieval streets and historic architecture",
    category: "Tourism"
  },
  {
    name: "Casa Batlló & Casa Milà Tours",
    description: "Marvel at Gaudí's modernist architectural masterpieces",
    category: "Culture"
  },
  {
    name: "La Rambla Strolls",
    description: "Experience Barcelona's most famous pedestrian street",
    category: "Tourism"
  },
  {
    name: "Boqueria Market Food Tours",
    description: "Taste fresh local produce and traditional Catalan foods",
    category: "Food"
  },
  {
    name: "FC Barcelona Stadium Tours",
    description: "Visit Camp Nou, home of FC Barcelona football club",
    category: "Sports"
  },
  {
    name: "Tapas Crawls in El Born",
    description: "Hop between traditional tapas bars in trendy El Born district",
    category: "Food"
  },
  {
    name: "Flamenco Shows in Tablao",
    description: "Experience authentic Spanish flamenco performances",
    category: "Entertainment"
  },
  {
    name: "Barceloneta Beach Days",
    description: "Relax on Barcelona's main city beach with Mediterranean views",
    category: "Outdoor"
  },
  {
    name: "Montjuïc Hill & Cable Car",
    description: "Take cable car up Montjuïc for panoramic city views",
    category: "Tourism"
  },
  {
    name: "Catalan Cooking Classes",
    description: "Learn to cook traditional Catalan dishes like paella",
    category: "Food"
  },
  {
    name: "Magic Fountain Light Shows",
    description: "Watch the spectacular fountain shows at Montjuïc",
    category: "Entertainment"
  },
  {
    name: "Gràcia Neighborhood Walks",
    description: "Explore the bohemian Gràcia district's plazas and boutiques",
    category: "Local"
  },
  {
    name: "Palau de la Música Catalana",
    description: "Attend concerts at this stunning modernist concert hall",
    category: "Culture"
  },
  {
    name: "Day Trips to Montserrat",
    description: "Visit the mountain monastery and enjoy scenic views",
    category: "Daytrips"
  },
  {
    name: "Barcelona Cathedral Visits",
    description: "Explore the Gothic cathedral in the heart of old Barcelona",
    category: "Culture"
  },
  {
    name: "Passeig de Gràcia Shopping",
    description: "Shop on Barcelona's premier luxury shopping boulevard",
    category: "Shopping"
  },
  {
    name: "Vermouth Hour (Vermut)",
    description: "Join locals for traditional pre-lunch vermouth drinks",
    category: "Local"
  },
  {
    name: "Joan Miró Museum",
    description: "Discover works by Barcelona's famous surrealist artist",
    category: "Culture"
  },
  {
    name: "El Raval Street Art Tours",
    description: "Explore vibrant street art in the multicultural Raval district",
    category: "Culture"
  },
  {
    name: "Bunkers del Carmel Sunset",
    description: "Watch sunset from old civil war bunkers with 360° city views",
    category: "Outdoor"
  },
  {
    name: "Catalonia Wine Tastings",
    description: "Sample regional wines including Cava sparkling wine",
    category: "Food"
  },
  {
    name: "La Mercè Festival",
    description: "Experience Barcelona's biggest street festival in September",
    category: "Events"
  }
];

export async function addBarcelonaSpecificActivities(userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🏛️ BARCELONA: Adding Barcelona-specific activities...`);
  
  for (const activity of BARCELONA_SPECIFIC_ACTIVITIES) {
    try {
      // Check if this activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, "Barcelona"),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(cityActivities).values({
          cityName: "Barcelona",
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: "Catalonia",
          country: "Spain",
          createdByUserId: userId,
          isActive: true
        });
        addedCount++;
        console.log(`✅ Added Barcelona activity: ${activity.name}`);
      } else {
        console.log(`⚠️ Skipping existing activity: ${activity.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding activity ${activity.name}:`, error);
    }
  }
  
  console.log(`🏛️ BARCELONA: Added ${addedCount} Barcelona-specific activities`);
  return addedCount;
}