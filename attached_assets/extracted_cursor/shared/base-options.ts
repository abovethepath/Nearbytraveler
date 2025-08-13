// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/EVENTS/LANGUAGES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// Most Popular interests for travelers and locals - what the majority actually want to do
export const MOST_POPULAR_INTERESTS = [
  "Local Coffee Shops",
  "Local Food Specialties", 
  "Photography",
  "Meet Locals/Travelers",
  "Museums",
  "City Tours & Sightseeing",
  "Historical Sites & Walking Tours",
  "Architecture",
  "Art Galleries",
  "Local Hidden Gems",
  "Street Art",
  "Cultural Sites",
  "Cheap Eats",
  "Fine Dining",
  "Brunch Spots",
  "Ethnic Cuisine",
  "Food Tours / Trucks",
  "Single and Looking",
  "Craft Beer & Breweries",
  "Cocktails & Bars",
  "Happy Hour Deals",
  "Nightlife & Dancing",
  "Live Music Venues",
  "Festivals & Events",
  "Hiking & Nature",
  "Beach Activities",
  "Boat & Water Tours",
  "Off the Path Adventures"
];

// Additional interests - specific communities and less common interests
export const ADDITIONAL_INTERESTS = [
  "LGBTQIA+",
  "Local Gay Parties/Events",
  "Polyamory and ENM",
  "Comedy Shows",
  "Theater & Performing Arts",
  "Water Activities",
  "Adventure Tours",
  "Wildlife & Nature",
  "Cooking Classes",
  "Flea Markets & Thrift Shopping",
  "Astronomy",
  "Spa & Wellness Services", 
  "Casinos",
  "Family Activities",
  "Escape Rooms",
  "Art Workshops",
  "Wellness & Alternative Health",
  "Barbecue & Grilling",
  "Bed & Breakfasts",
  "Biking / Cycling",
  "Bowling",
  "Gaming & Esports",
  "Golf",
  "Home & Garden",
  "Pickleball",
  "Sports & Recreation",
  "Volunteer Opportunities",
  "Techno EDM",
  "Pub Crawls & Bar Tours",
  "Rooftop Bars",
  "Ghost Tours",
  "Dance Classes",
  "Farm-to-Table",
  "Late Night Eats",
  "Poker",
  "Digital Nomads",
  "Meditation & Mindfulness"
];

// Combined interests (Most Popular + Additional)
export const ALL_INTERESTS = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];

// Activities ordered by popularity - most popular travel activities first
export const ALL_ACTIVITIES = [
  "Local Connections",
  "Cultural Learning",
  "Meetup Organizing",
  "Budget Planning",
  "Travel Journaling",
  "Language Practice",
  "Blogging",
  "Fitness Challenges",
  "Working out at Gym",
  "Running & Jogging"
];

// Events ordered by popularity - most popular travel events first
export const ALL_EVENTS = [
  "Street Festivals",
  "Community Events", 
  "Club Nights",
  "Dance Events",
  "Sports Events",
  "Networking Events",
  "Game Nights",
  "Pop-up Restaurants",
  "Outdoor Movies",
  "Charity Events",
  "Meet & Greets",
  "Rooftop Parties",
  "Beach Parties",
  "Trivia Nights",
  "Open Mic Nights",
  "Flash Mobs",
  "Speed Dating Events",
  "Karaoke Nights"
];

// Languages available for selection
export const ALL_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch",
  "Russian", "Polish", "Czech", "Hungarian", "Swedish", "Norwegian", "Danish",
  "Chinese (Mandarin)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian",
  "Arabic", "Hebrew", "Turkish", "Greek", "Hindi", "Urdu", "Bengali"
];

// MASTER EXPORT FUNCTIONS - USE THESE EVERYWHERE
export const getMostPopularInterests = () => MOST_POPULAR_INTERESTS;
export const getAdditionalInterests = () => ADDITIONAL_INTERESTS;
export const getAllInterests = () => ALL_INTERESTS;
export const getAllActivities = () => ALL_ACTIVITIES; 
export const getAllEvents = () => ALL_EVENTS;
export const getAllLanguages = () => ALL_LANGUAGES;

// Validation function to ensure consistent total selections
export const validateSelections = (interests: string[], activities: string[], events: string[], languages: string[]) => {
  const total = interests.length + activities.length + events.length + languages.length;
  return {
    total,
    isValid: total >= 10,
    needed: Math.max(0, 10 - total)
  };
};