import { db } from './db';
import { cityActivities } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Rome-specific activities with real landmarks and attractions
const ROME_SPECIFIC_ACTIVITIES = [
  {
    name: "Colosseum & Roman Forum Tours",
    description: "Ancient amphitheater and ruins of Roman civilization",
    category: "Culture"
  },
  {
    name: "Vatican City & Sistine Chapel",
    description: "Papal residence with Michelangelo's ceiling frescoes",
    category: "Culture"
  },
  {
    name: "Trevi Fountain Coin Tossing",
    description: "Baroque fountain with tradition of making wishes",
    category: "Tourism"
  },
  {
    name: "Pantheon Ancient Temple",
    description: "Best-preserved Roman building with impressive dome",
    category: "Culture"
  },
  {
    name: "Spanish Steps & Piazza di Spagna",
    description: "Famous staircase and elegant shopping district",
    category: "Tourism"
  },
  {
    name: "Trastevere Neighborhood Dining",
    description: "Charming medieval area with authentic Roman restaurants",
    category: "Food"
  },
  {
    name: "St. Peter's Basilica & Dome Climb",
    description: "Magnificent Renaissance church with city views",
    category: "Culture"
  },
  {
    name: "Palatine Hill Archaeological Site",
    description: "Birthplace of Rome with imperial palace ruins",
    category: "Culture"
  },
  {
    name: "Castel Sant'Angelo Fortress",
    description: "Hadrian's mausoleum turned papal fortress",
    category: "Culture"
  },
  {
    name: "Piazza Navona Street Artists",
    description: "Baroque square with fountains and outdoor cafés",
    category: "Tourism"
  },
  {
    name: "Campo de' Fiori Market",
    description: "Morning flower and food market, evening bar scene",
    category: "Food"
  },
  {
    name: "Capitoline Museums Art Collection",
    description: "World's oldest public museums with classical sculptures",
    category: "Culture"
  },
  {
    name: "Villa Borghese Gardens & Gallery",
    description: "Large park with Bernini sculptures and lake",
    category: "Nature"
  },
  {
    name: "Roman Catacombs Underground Tours",
    description: "Early Christian burial tunnels beneath the city",
    category: "Culture"
  },
  {
    name: "Appian Way Ancient Road",
    description: "Historic Roman road with tombs and aqueduct ruins",
    category: "Culture"
  },
  {
    name: "Baths of Caracalla Ruins",
    description: "Massive ancient Roman public bath complex",
    category: "Culture"
  },
  {
    name: "Testaccio Food & Nightlife District",
    description: "Authentic Roman cuisine and vibrant nightlife",
    category: "Food"
  },
  {
    name: "Piazza del Popolo Twin Churches",
    description: "Grand square with Egyptian obelisk and matching baroque churches",
    category: "Tourism"
  },
  {
    name: "Aventine Hill Orange Garden Views",
    description: "Peaceful park with panoramic views of St. Peter's dome",
    category: "Nature"
  },
  {
    name: "Jewish Quarter & Great Synagogue",
    description: "Historic neighborhood with Jewish culture and cuisine",
    category: "Culture"
  },
  {
    name: "Via del Corso Shopping Street",
    description: "Major shopping avenue from Piazza del Popolo to Piazza Venezia",
    category: "Shopping"
  },
  {
    name: "Galleria Borghese Reservations",
    description: "World-class art collection requiring advance booking",
    category: "Culture"
  },
  {
    name: "Ostia Antica Day Trip",
    description: "Ancient Rome's port city with well-preserved mosaics",
    category: "Culture"
  },
  {
    name: "Roman Pizza al Taglio Tours",
    description: "Authentic Roman-style rectangular pizza by the slice",
    category: "Food"
  },
  {
    name: "Villa Adriana Tivoli Gardens",
    description: "Emperor Hadrian's retreat with Renaissance gardens",
    category: "Culture"
  },
  {
    name: "Monti Neighborhood Vintage Shopping",
    description: "Bohemian area with boutiques and artisan workshops",
    category: "Shopping"
  },
  {
    name: "Piazza di Pietra Temple Columns",
    description: "Ancient temple columns integrated into modern square",
    category: "Culture"
  },
  {
    name: "Gelato Tasting Traditional Shops",
    description: "Authentic Italian ice cream from historic gelaterias",
    category: "Food"
  },
  {
    name: "Quirinal Palace & Gardens",
    description: "Italian President's residence with baroque architecture",
    category: "Culture"
  },
  {
    name: "Circus Maximus Chariot Racing Site",
    description: "Ancient Roman circus where 250,000 spectators watched races",
    category: "Culture"
  }
];

export async function addRomeSpecificActivities(userId: number = 1): Promise<number> {
  let addedCount = 0;
  
  console.log(`🏛️ ROME: Adding Rome-specific activities...`);
  
  for (const activity of ROME_SPECIFIC_ACTIVITIES) {
    try {
      // Check if this activity already exists
      const existing = await db
        .select()
        .from(cityActivities)
        .where(and(
          eq(cityActivities.cityName, "Rome"),
          eq(cityActivities.activityName, activity.name)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(cityActivities).values({
          cityName: "Rome",
          activityName: activity.name,
          description: activity.description,
          category: activity.category,
          state: "Lazio",
          country: "Italy",
          createdByUserId: userId,
          isActive: true
        });
        addedCount++;
        console.log(`✅ Added Rome activity: ${activity.name}`);
      } else {
        console.log(`⚠️ Skipping existing activity: ${activity.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding activity ${activity.name}:`, error);
    }
  }
  
  console.log(`🏛️ ROME: Added ${addedCount} Rome-specific activities`);
  return addedCount;
}