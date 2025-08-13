import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Paris-specific activities with real landmarks and attractions
const PARIS_SPECIFIC_ACTIVITIES = [
  {
    name: "Eiffel Tower Experience",
    description: "Iconic iron tower with observation decks and dining",
    category: "Tourism"
  },
  {
    name: "Louvre Museum & Mona Lisa",
    description: "World's largest art museum with da Vinci masterpieces",
    category: "Culture"
  },
  {
    name: "Notre-Dame Cathedral Area",
    description: "Gothic cathedral and Île de la Cité historic island",
    category: "Culture"
  },
  {
    name: "Champs-Élysées & Arc de Triomphe",
    description: "Famous avenue leading to Napoleon's triumphal arch",
    category: "Tourism"
  },
  {
    name: "Montmartre & Sacré-Cœur Basilica",
    description: "Artistic hillside district with stunning white basilica",
    category: "Culture"
  },
  {
    name: "Seine River Cruises",
    description: "Romantic boat rides past illuminated monuments",
    category: "Tourism"
  },
  {
    name: "Versailles Palace Day Trips",
    description: "Opulent royal palace with magnificent gardens",
    category: "Culture"
  },
  {
    name: "Latin Quarter & Sorbonne",
    description: "Historic university district with narrow medieval streets",
    category: "Culture"
  },
  {
    name: "Marais District Jewish Quarter",
    description: "Historic neighborhood with trendy shops and falafel",
    category: "Culture"
  },
  {
    name: "Musée d'Orsay Impressionist Art",
    description: "World's finest collection of Impressionist paintings",
    category: "Culture"
  },
  {
    name: "Café Culture & Sidewalk Dining",
    description: "Traditional Parisian café experience and people watching",
    category: "Food"
  },
  {
    name: "Moulin Rouge Cabaret Shows",
    description: "World-famous cabaret with can-can dancers",
    category: "Entertainment"
  },
  {
    name: "Luxembourg Gardens Strolls",
    description: "Beautiful palace gardens with model sailboats",
    category: "Nature"
  },
  {
    name: "Sainte-Chapelle Stained Glass",
    description: "13th-century chapel with stunning Gothic windows",
    category: "Culture"
  },
  {
    name: "Père Lachaise Cemetery Tours",
    description: "Famous cemetery with celebrity graves including Jim Morrison",
    category: "Culture"
  },
  {
    name: "Trocadéro Eiffel Tower Views",
    description: "Best photography spot facing the Eiffel Tower",
    category: "Tourism"
  },
  {
    name: "Île Saint-Louis Ice Cream Walks",
    description: "Charming island with artisanal Berthillon ice cream",
    category: "Food"
  },
  {
    name: "Opera Garnier Phantom Tours",
    description: "Opulent opera house that inspired Phantom of the Opera",
    category: "Culture"
  },
  {
    name: "Place Vendôme Luxury Shopping",
    description: "Elegant square with high-end jewelry and fashion",
    category: "Shopping"
  },
  {
    name: "Catacombs Underground Paris",
    description: "Underground tunnels lined with skulls and bones",
    category: "Tourism"
  },
  {
    name: "Saint-Germain-des-Prés Boutiques",
    description: "Chic Left Bank district with designer shops",
    category: "Shopping"
  },
  {
    name: "Rodin Museum & Sculpture Garden",
    description: "Sculptor's former home with 'The Thinker' statue",
    category: "Culture"
  },
  {
    name: "Pont des Arts Love Locks Bridge",
    description: "Pedestrian bridge with romantic Seine views",
    category: "Tourism"
  },
  {
    name: "Bastille Day Celebrations",
    description: "French national holiday with parades and fireworks",
    category: "Events"
  },
  {
    name: "Bois de Boulogne Park Picnics",
    description: "Large park perfect for outdoor dining and leisure",
    category: "Nature"
  },
  {
    name: "Galeries Lafayette Shopping",
    description: "Historic department store with stunning glass dome",
    category: "Shopping"
  },
  {
    name: "Panthéon & Latin Quarter History",
    description: "Neoclassical mausoleum honoring French national heroes",
    category: "Culture"
  },
  {
    name: "Marché aux Puces Flea Markets",
    description: "Massive antique markets in northern Paris",
    category: "Shopping"
  },
  {
    name: "Wine Tasting & Vineyard Tours",
    description: "French wine education and tasting experiences",
    category: "Food"
  },
  {
    name: "Conciergerie Marie Antoinette Prison",
    description: "Former royal palace turned revolutionary prison",
    category: "Culture"
  }
];

export async function addParisSpecificActivities(userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🇫🇷 PARIS: Adding Paris-specific activities...`);
  
  for (const activity of PARIS_SPECIFIC_ACTIVITIES) {
    try {
      // Check if this activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, "Paris"),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(cityActivities).values({
          cityName: "Paris",
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: "Île-de-France",
          country: "France",
          createdByUserId: userId,
          isActive: true
        });
        addedCount++;
        console.log(`✅ Added Paris activity: ${activity.name}`);
      } else {
        console.log(`⚠️ Skipping existing activity: ${activity.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding activity ${activity.name}:`, error);
    }
  }
  
  console.log(`🇫🇷 PARIS: Added ${addedCount} Paris-specific activities`);
  return addedCount;
}