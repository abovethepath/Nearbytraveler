import { GENERIC_CITY_ACTIVITIES } from './generic-city-activities.js';

export interface GeneratedActivity {
  name: string;
  category: string;
  description: string;
}

// Ban list for generic intent-style activities (filter out from AI results)
// These are EXACT PHRASE matches (not substring) to avoid false positives
const AI_ACTIVITY_BAN_PHRASES = [
  // Generic nightlife / social - exact phrases
  'bar crawl', 'bar crawls', 'pub crawl', 'pub crawls', 'happy hour spots',
  'rooftop bars', 'speakeasies', 'club nights', 'dj nights', 'dance nights',
  'trivia nights', 'comedy nights', 'meet locals', 'meet travelers', 'meet new people',
  
  // Generic food (not a named place) - exact phrases
  'food halls', 'food tastings', 'food tours', 'street food tours', 'food trucks',
  'dessert shops', 'ice cream parlors', 'coffee crawl', 'farmers markets', 'night markets',
  
  // Generic culture / sightseeing - exact phrases
  'street art tours', 'photography walks', 'walking tours', 'historic neighborhoods',
  'architecture tours', 'sunset viewpoints', 'scenic spots', 'ghost tours',
  
  // Generic outdoors / activities - exact phrases
  'hiking trails', 'nature trails', 'bike tours', 'beach activities', 'water sports',
  'spa day', 'yoga classes', 'fitness centers', 'escape rooms', 'board game cafes',
  
  // Too-vague catchalls - exact phrases only
  'things to do', 'local favorites', 'hidden gems', 'must-see attractions', 'best of',
  'top spots', 'popular spots', 'museums & galleries', 'art galleries'
];

// Plain street/road names to ban (unless formatted as an experience)
// These are common street suffixes - activity must NOT be just "Street Name + suffix"
const PLAIN_STREET_SUFFIXES = [
  'avenue', 'ave', 'street', 'st', 'boulevard', 'blvd', 'road', 'rd',
  'drive', 'dr', 'lane', 'ln', 'way', 'highway', 'hwy', 'place', 'pl'
];

// Famous streets that are OK ONLY if formatted as an experience
const FAMOUS_STREETS_NEED_EXPERIENCE_FORMAT = [
  'melrose', 'sunset', 'hollywood', 'broadway', 'rodeo', 'fifth', '5th',
  'michigan', 'bourbon', 'beale', 'abbey road', 'champs', 'las ramblas'
];

// Words that when appearing ALONE (as the entire activity) indicate generic intent
const AI_ACTIVITY_BAN_SINGLE_WORDS = [
  'nightlife', 'dating', 'brunch', 'hiking', 'yoga', 'fitness', 'workout', 'karaoke'
];

// Generic modifiers that don't make a museum/gallery name specific
const GENERIC_MODIFIERS = ['art', 'local', 'city', 'downtown', 'popular', 'famous', 'best', 'top'];

// Check if activity is just a plain street name (should be banned)
function isPlainStreetName(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  // Check if activity ends with a street suffix (e.g., "Melrose Avenue", "Sunset Boulevard")
  const lastWord = words[words.length - 1];
  const isStreetSuffix = PLAIN_STREET_SUFFIXES.includes(lastWord);
  
  if (!isStreetSuffix) return false;
  
  // If it's just "[Name] [Street Suffix]" with 2-3 words, it's likely just a street name
  if (words.length <= 3) {
    // Check if it's a famous street that NEEDS experience formatting
    const streetPart = words.slice(0, -1).join(' ');
    const isFamousStreet = FAMOUS_STREETS_NEED_EXPERIENCE_FORMAT.some(s => 
      streetPart.includes(s)
    );
    
    if (isFamousStreet) {
      // Famous street without experience verb - ban it
      // Allow: "Sunset Strip nightlife", "Explore Rodeo Drive shopping"
      // Ban: "Sunset Boulevard", "Rodeo Drive"
      const experienceVerbs = ['tour', 'visit', 'explore', 'hike', 'watch', 'take', 'try', 'walk', 'shop', 'dine', 'eat', 'nightlife', 'shopping', 'dining'];
      const hasExperienceContext = experienceVerbs.some(v => normalized.includes(v));
      if (!hasExperienceContext) {
        console.log(`🚫 BAN: Famous street without experience context: "${name}"`);
        return true;
      }
    } else {
      // Non-famous street - always ban plain street names
      console.log(`🚫 BAN: Plain street name: "${name}"`);
      return true;
    }
  }
  
  return false;
}

// Check if an activity name should be banned (too generic)
function shouldBanActivity(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  
  // Check single-word bans (activity is ONLY this word)
  if (AI_ACTIVITY_BAN_SINGLE_WORDS.includes(normalized)) {
    console.log(`🚫 BAN: Filtered out single-word generic: "${name}"`);
    return true;
  }
  
  // Check for plain street names
  if (isPlainStreetName(name)) {
    return true;
  }
  
  // Check for standalone "Museums" or "Galleries" (plural, no proper name)
  if (/^museums?$/i.test(normalized) || /^galler(y|ies)$/i.test(normalized)) {
    console.log(`🚫 BAN: Filtered out standalone museum/gallery: "${name}"`);
    return true;
  }
  
  // Check against exact phrase ban list
  for (const banned of AI_ACTIVITY_BAN_PHRASES) {
    if (normalized === banned || normalized.startsWith(banned + ' ') || normalized.endsWith(' ' + banned)) {
      console.log(`🚫 BAN: Filtered out generic phrase: "${name}" (matched: "${banned}")`);
      return true;
    }
  }
  
  // Special handling for "museum" and "gallery" - ban ONLY if generic (no proper name)
  // Allow: "The Getty Museum", "Museum of Contemporary Art", "Picasso Museum"
  // Ban: "Art Gallery", "Local Gallery", "City Museum"
  if (/\b(museum|gallery|museums|galleries)\b/i.test(normalized)) {
    const words = name.split(/\s+/);
    const wordsLower = words.map(w => w.toLowerCase());
    
    // Check for proper name indicators:
    // 1. Starts with "The" + proper noun
    // 2. Contains "of" (Museum of X)
    // 3. Has a non-generic proper noun before museum/gallery
    const startsWithThe = /^the\s/i.test(name);
    const containsOf = /\bof\b/i.test(name);
    
    // Get words that aren't generic modifiers or museum/gallery
    const specificWords = wordsLower.filter(w => 
      !GENERIC_MODIFIERS.includes(w) && 
      !/^(museum|gallery|museums|galleries)$/i.test(w)
    );
    
    // Need at least one specific word that's not just "the"
    const hasSpecificName = specificWords.some(w => w !== 'the' && w.length > 2);
    
    const isProperName = (startsWithThe && hasSpecificName) || containsOf || hasSpecificName;
    
    if (!isProperName) {
      console.log(`🚫 BAN: Filtered out generic museum/gallery: "${name}"`);
      return true;
    }
  }
  
  return false;
}

// Function to check if two activities are similar/duplicates
function areActivitiesSimilar(activity1: string, activity2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const a1 = normalize(activity1);
  const a2 = normalize(activity2);
  
  // Check for exact matches
  if (a1 === a2) return true;
  
  // Check for very high similarity (>80% common words)
  const words1 = a1.split(/\s+/);
  const words2 = a2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity > 0.8;
}

// Function to deduplicate and filter activities
function deduplicateActivities(activities: GeneratedActivity[]): GeneratedActivity[] {
  const unique: GeneratedActivity[] = [];
  let bannedCount = 0;
  
  for (const activity of activities) {
    // First check if activity should be banned (too generic)
    if (shouldBanActivity(activity.name)) {
      bannedCount++;
      continue;
    }
    
    const isDuplicate = unique.some(existing => 
      areActivitiesSimilar(existing.name, activity.name)
    );
    
    if (!isDuplicate) {
      unique.push(activity);
    } else {
      console.log(`🔄 DEDUP: Skipping similar activity: "${activity.name}"`);
    }
  }
  
  if (bannedCount > 0) {
    console.log(`🚫 BAN FILTER: Removed ${bannedCount} generic activities`);
  }
  
  return unique;
}

export async function generateCityActivities(cityName: string): Promise<GeneratedActivity[]> {
  try {
    // REMOVED: Don't start with generic activities - they cause poor quality results
    // Only use AI-generated city-specific activities
    const allActivities: GeneratedActivity[] = [];
    
    const prompt = `Generate exactly 6 HIGHLY SPECIFIC and UNIQUE activities for ${cityName}.

CRITICAL: Activities MUST fall into these 2 BUCKETS:

=== BUCKET A: ICONIC PLACES (2-3 activities) ===
Named landmarks, museums, venues, famous markets with PROPER NOUNS
Examples:
✅ "The Getty Center"
✅ "Griffith Observatory" 
✅ "Pike Place Market"
✅ "The Broad Museum"
✅ "Grand Central Market"

=== BUCKET B: VERB-LED EXPERIENCES (3-4 activities) ===
Must START with an action verb: Tour / Visit / Hike / Watch / Explore / Take / Try / Walk / Taste / Discover
Examples:
✅ "Tour Warner Bros Studios"
✅ "Hike to the Hollywood Sign"
✅ "Watch a comedy show at The Laugh Factory"
✅ "Explore Little Tokyo food scene"
✅ "Take a bike ride along Venice Beach"
✅ "Try authentic tacos at Guisados"
✅ "Discover street art in the Arts District"

=== STRICTLY BANNED ===
❌ Plain street names (e.g., "Melrose Avenue", "Sunset Boulevard" - unless framed as experience like "Sunset Strip nightlife")
❌ Generic categories ("Food Tours", "Museums", "Sightseeing")
❌ Social matching ("Meet Locals", "Singles", "Family Activities")
❌ Vague catchalls ("Hidden Gems", "Local Favorites", "Best Spots")

=== FORMAT REQUIREMENTS ===
- At least 3 of 6 activities MUST start with a verb (Tour/Visit/Hike/Explore/Take/Try/Watch/Walk/Taste/Discover)
- Every activity must mention a SPECIFIC proper noun (venue, restaurant, landmark, neighborhood)
- NO invented events or festivals (timely events come from APIs, not AI)

For each activity, provide:
1. A highly specific name (proper noun OR verb + proper noun)
2. A category (Tourism, Culture, Food, Nightlife, Outdoor, Shopping, Sports, Local)
3. A brief description with real details

CRITICAL: Return ONLY valid JSON, no markdown formatting, no code blocks, no explanatory text. Just the raw JSON object:
{
  "activities": [
    {
      "name": "Verb-led or Proper Noun Activity Name",
      "category": "Category",
      "description": "Specific description with real details"
    }
  ]
}`;

    const systemPrompt = `You are a LOCAL EXPERT who lives in the city and knows EXACT landmark names, museum names, neighborhood names, restaurant names, and specific locations.

CRITICAL RULES FOR QUALITY OUTPUT:
1. Generate exactly 6 activities following the 2-bucket structure:
   - BUCKET A (2-3): Iconic places with proper nouns (The Getty Center, Pike Place Market)
   - BUCKET B (3-4): Verb-led experiences starting with action verbs (Tour, Visit, Hike, Explore, Try, Watch, Take, Walk, Taste, Discover)

2. At least 3 of 6 activities MUST start with a verb

3. NEVER output plain street names like "Melrose Avenue" or "Sunset Boulevard" - ONLY frame streets as experiences like "Sunset Strip nightlife" or "Shop vintage on Melrose"

4. ABSOLUTELY NO GENERIC SOCIAL CATEGORIES:
   - NO "Single", "Open to Dating", "Looking for Romance"
   - NO "Meet Locals", "Meet Travelers", "Meeting New People"
   - NO "Solo Traveler", "Solo Travel Meetups"
   - NO "Family Activities", "Family Friendly", "Traveling with Children"
   - NO "Business Networking", "Coworking", "Digital Nomad"
   - NO "Workout Buddy", "Fitness Partner", "Looking for Workout Buddy"
   - NO "Language Exchange", "Language Practice"
   - NO "LGBTQ+ Events", "LGBTQ+ Friendly"
   - NO any other generic social matching categories
4. ONLY generate actual city-specific PLACES, LANDMARKS, RESTAURANTS, VENUES, MUSEUMS, PARKS with real names
5. Return valid JSON only`;

    const response = await fetch(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Replit AI error: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.choices[0]?.message?.content || '{"activities": []}';
    
    // Remove markdown code blocks if they exist
    if (responseText.includes('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (responseText.includes('```')) {
      responseText = responseText.replace(/```\s*/g, '');
    }
    
    // Trim whitespace
    responseText = responseText.trim();
    
    const result = JSON.parse(responseText);
    const citySpecificActivities = result.activities || [];
    
    // Combine generic activities with city-specific ones
    allActivities.push(...citySpecificActivities);
    
    // Deduplicate all activities to remove similar ones
    const uniqueActivities = deduplicateActivities(allActivities);
    
    console.log(`✅ AI GENERATION: Generated ${GENERIC_CITY_ACTIVITIES.length} generic + ${citySpecificActivities.length} city-specific activities for ${cityName}`);
    console.log(`🔄 DEDUPLICATION: Removed ${allActivities.length - uniqueActivities.length} duplicate/similar activities`);
    
    return uniqueActivities;
  } catch (error: any) {
    console.error('Error generating city activities:', error);
    
    // Return at least the generic activities if AI fails
    console.log('🔄 AI: Falling back to generic activities.');
    return [...GENERIC_CITY_ACTIVITIES];
  }
}