import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Tokyo-specific activities with real landmarks and attractions
const TOKYO_SPECIFIC_ACTIVITIES = [
  {
    name: "Tokyo Skytree Observation Decks",
    description: "World's tallest tower with panoramic Tokyo views",
    category: "Tourism"
  },
  {
    name: "Senso-ji Temple Asakusa",
    description: "Tokyo's oldest temple with traditional shopping street",
    category: "Culture"
  },
  {
    name: "Shibuya Crossing Experience",
    description: "World's busiest pedestrian crossing and district exploration",
    category: "Tourism"
  },
  {
    name: "Tsukiji Outer Market Food Tours",
    description: "Fresh sushi and authentic Japanese breakfast experiences",
    category: "Food"
  },
  {
    name: "Meiji Shrine & Harajuku",
    description: "Sacred shrine in forest with trendy fashion district nearby",
    category: "Culture"
  },
  {
    name: "Tokyo Imperial Palace Gardens",
    description: "Beautiful gardens surrounding the Emperor's residence",
    category: "Nature"
  },
  {
    name: "Ginza Luxury Shopping District",
    description: "High-end shopping and dining in Tokyo's most prestigious area",
    category: "Shopping"
  },
  {
    name: "Robot Restaurant Shinjuku",
    description: "Colorful robot and neon entertainment spectacle",
    category: "Entertainment"
  },
  {
    name: "Ueno Park & Museums",
    description: "Cultural park with Tokyo National Museum and zoo",
    category: "Culture"
  },
  {
    name: "Akihabara Electric Town",
    description: "Electronics, anime, manga, and gaming culture district",
    category: "Shopping"
  },
  {
    name: "Tokyo Station & Imperial Palace Area",
    description: "Historic railway station and nearby palace grounds",
    category: "Tourism"
  },
  {
    name: "Roppongi Hills Mori Art Museum",
    description: "Contemporary art with Tokyo skyline observatory",
    category: "Culture"
  },
  {
    name: "Shinjuku Kabukicho Nightlife",
    description: "Tokyo's entertainment district with bars and karaoke",
    category: "Entertainment"
  },
  {
    name: "Odaiba Island Futuristic District",
    description: "Man-made island with modern attractions and Rainbow Bridge views",
    category: "Tourism"
  },
  {
    name: "Takeshita Street Harajuku Fashion",
    description: "Youth fashion and quirky shops in trendy Harajuku",
    category: "Shopping"
  },
  {
    name: "Tokyo DisneySea & Disneyland",
    description: "Unique Disney theme parks exclusive to Tokyo",
    category: "Family"
  },
  {
    name: "Yanaka Old Tokyo Neighborhood",
    description: "Traditional Tokyo atmosphere with old temples and shops",
    category: "Culture"
  },
  {
    name: "Shinjuku Park Hyatt Lost in Translation Bar",
    description: "Famous bar from Sofia Coppola film with city views",
    category: "Entertainment"
  },
  {
    name: "Tokyo Metropolitan Government Building Observatory",
    description: "Free panoramic views from government building towers",
    category: "Tourism"
  },
  {
    name: "Kanda Myojin Shrine",
    description: "Historic shrine popular with tech workers and students",
    category: "Culture"
  },
  {
    name: "Teamlab Borderless Digital Art Museum",
    description: "Immersive digital art exhibitions and interactive installations",
    category: "Culture"
  },
  {
    name: "Nakamise-dori Shopping Street",
    description: "Traditional shopping street leading to Senso-ji Temple",
    category: "Shopping"
  },
  {
    name: "Tokyo Bay Cruise & Sumida River",
    description: "Scenic boat rides through Tokyo's waterways",
    category: "Tourism"
  },
  {
    name: "Ramen Museum Shin-Yokohama",
    description: "Interactive museum dedicated to Japan's famous noodle soup",
    category: "Food"
  },
  {
    name: "Nezu Shrine Azalea Festival",
    description: "Beautiful shrine with seasonal flower displays",
    category: "Culture"
  },
  {
    name: "Shibuya Sky Observatory",
    description: "Open-air observation deck above Shibuya crossing",
    category: "Tourism"
  },
  {
    name: "Kappabashi Kitchen Town",
    description: "Street dedicated to cooking supplies and restaurant equipment",
    category: "Shopping"
  },
  {
    name: "Tokyo National Museum Treasures",
    description: "Japan's largest collection of cultural artifacts",
    category: "Culture"
  },
  {
    name: "Omoide Yokocho Memory Lane",
    description: "Tiny yakitori alleys with authentic drinking culture",
    category: "Food"
  },
  {
    name: "Ghibli Museum Mitaka",
    description: "Studio Ghibli animation museum in western Tokyo",
    category: "Culture"
  }
];

export async function addTokyoSpecificActivities(userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🏯 TOKYO: Adding Tokyo-specific activities...`);
  
  for (const activity of TOKYO_SPECIFIC_ACTIVITIES) {
    try {
      // Check if this activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, "Tokyo"),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(cityActivities).values({
          cityName: "Tokyo",
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: "Tokyo",
          country: "Japan",
          createdByUserId: userId,
          isActive: true
        });
        addedCount++;
        console.log(`✅ Added Tokyo activity: ${activity.name}`);
      } else {
        console.log(`⚠️ Skipping existing activity: ${activity.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding activity ${activity.name}:`, error);
    }
  }
  
  console.log(`🏯 TOKYO: Added ${addedCount} Tokyo-specific activities`);
  return addedCount;
}