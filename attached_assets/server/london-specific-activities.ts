import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// London-specific activities with real landmarks and attractions
const LONDON_SPECIFIC_ACTIVITIES = [
  {
    name: "Big Ben & Westminster Tours",
    description: "Visit the iconic clock tower and Houses of Parliament",
    category: "Tourism"
  },
  {
    name: "Tower of London Experience",
    description: "Explore the historic fortress, Crown Jewels, and Beefeater tours",
    category: "Culture"
  },
  {
    name: "London Eye Rides",
    description: "Panoramic views of London from the giant observation wheel",
    category: "Tourism"
  },
  {
    name: "British Museum Visits",
    description: "World-class museum with Egyptian mummies and ancient artifacts",
    category: "Culture"
  },
  {
    name: "Buckingham Palace & Changing of Guard",
    description: "Royal palace tours and ceremonial guard changes",
    category: "Culture"
  },
  {
    name: "Thames River Cruises",
    description: "Scenic boat rides along London's historic river",
    category: "Tourism"
  },
  {
    name: "Covent Garden Market Walks",
    description: "Street performers, shops, and restaurants in historic market",
    category: "Shopping"
  },
  {
    name: "Hyde Park & Speaker's Corner",
    description: "Historic park walks and famous public speaking corner",
    category: "Nature"
  },
  {
    name: "Camden Market Shopping",
    description: "Alternative culture, vintage clothes, and street food",
    category: "Shopping"
  },
  {
    name: "West End Theatre Shows",
    description: "World-famous musicals and plays in London's theatre district",
    category: "Entertainment"
  },
  {
    name: "St. Paul's Cathedral Tours",
    description: "Christopher Wren's architectural masterpiece and dome climb",
    category: "Culture"
  },
  {
    name: "Tate Modern Art Gallery",
    description: "Contemporary art in former power station building",
    category: "Culture"
  },
  {
    name: "Brick Lane Food Walks",
    description: "Authentic curry houses and multicultural street food",
    category: "Food"
  },
  {
    name: "Greenwich Observatory & Maritime Museum",
    description: "Prime Meridian, astronomical exhibits, and naval history",
    category: "Culture"
  },
  {
    name: "Portobello Road Antiques Market",
    description: "Famous antiques market in colorful Notting Hill",
    category: "Shopping"
  },
  {
    name: "Shakespeare's Globe Theatre",
    description: "Authentic Elizabethan theatre replica on the Thames",
    category: "Culture"
  },
  {
    name: "Abbey Road Beatles Crossing",
    description: "Famous zebra crossing from Beatles album cover",
    category: "Tourism"
  },
  {
    name: "Kensington Palace & Gardens",
    description: "Royal residence and Diana memorial gardens",
    category: "Culture"
  },
  {
    name: "Borough Market Food Tours",
    description: "London's oldest food market with gourmet tastings",
    category: "Food"
  },
  {
    name: "Churchill War Rooms",
    description: "Underground WWII bunkers and museum",
    category: "Culture"
  },
  {
    name: "Hampstead Heath Walks",
    description: "Wild parkland with panoramic city views from Parliament Hill",
    category: "Nature"
  },
  {
    name: "Oxford Street & Regent Street Shopping",
    description: "Premier shopping districts with flagship stores",
    category: "Shopping"
  },
  {
    name: "London Bridge & Borough Area",
    description: "Historic bridge area with views of Tower Bridge",
    category: "Tourism"
  },
  {
    name: "Chinatown Dim Sum Tours",
    description: "Authentic Chinese restaurants and cultural experiences",
    category: "Food"
  },
  {
    name: "Millennium Bridge & Tate to Tate Walk",
    description: "Modern footbridge connecting art galleries",
    category: "Tourism"
  },
  {
    name: "Royal Opera House Covent Garden",
    description: "World-class opera and ballet performances",
    category: "Entertainment"
  },
  {
    name: "London Zoo in Regent's Park",
    description: "Historic zoo with diverse animal exhibits",
    category: "Family"
  },
  {
    name: "Leadenhall Market Victorian Shopping",
    description: "Beautiful Victorian covered market used in Harry Potter films",
    category: "Shopping"
  },
  {
    name: "South Bank Thames Walks",
    description: "Riverside promenade with street performers and views",
    category: "Tourism"
  },
  {
    name: "Harrods Department Store",
    description: "Luxury shopping in famous Knightsbridge department store",
    category: "Shopping"
  }
];

export async function addLondonSpecificActivities(userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🇬🇧 LONDON: Adding London-specific activities...`);
  
  for (const activity of LONDON_SPECIFIC_ACTIVITIES) {
    try {
      // Check if this activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, "London"),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(cityActivities).values({
          cityName: "London",
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: "England",
          country: "United Kingdom",
          createdByUserId: userId,
          isActive: true
        });
        addedCount++;
        console.log(`✅ Added London activity: ${activity.name}`);
      } else {
        console.log(`⚠️ Skipping existing activity: ${activity.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding activity ${activity.name}:`, error);
    }
  }
  
  console.log(`🇬🇧 LONDON: Added ${addedCount} London-specific activities`);
  return addedCount;
}