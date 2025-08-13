// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/EVENTS/LANGUAGES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// Most Popular interests for travelers and locals - organized in Aaron's preferred order
export const MOST_POPULAR_INTERESTS = [
  // Dating/Relationships first
  "Single and Looking",
  
  // Party/Nightlife second
  "Craft Beer & Breweries",
  "Cocktails & Bars",
  "Happy Hour Deals",
  "Nightlife & Dancing",
  "Live Music Venues",
  
  // Touring/Cultural third
  "Local Coffee Shops",
  "Local Food Specialties", 
  "Photography",
  "Meet Locals/Travelers",
  "Museums",
  "City Tours & Sightseeing",
  "Historical / Walking Tours",
  "Architecture",
  "Art Galleries",
  "Local Hidden Gems",
  "Street Art",
  "Cultural Sites",
  
  // Family fourth
  "Family Activities",
  
  // Food fifth
  "Cheap Eats",
  "Fine Dining",
  "Brunch Spots",
  "Ethnic Cuisine",
  "Food Tours / Trucks",
  
  // Health/Fitness sixth
  "Hiking & Nature",
  "Beach Activities",
  "Boat & Water Tours",
  "Off the Path Adventures",
  "Festivals & Events",
  "Wine Tastings & Vineyards"
];

// Additional interests - organized by similarity
export const ADDITIONAL_INTERESTS = [
  // Party/Nightlife Extensions
  "Techno EDM",
  "Pub Crawls & Bar Tours",
  "Rooftop Bars",
  "Casinos",
  "Poker",
  
  // Entertainment/Shows
  "Comedy Shows",
  "Theater & Performing Arts",
  "Ghost Tours",
  "Escape Rooms",
  "Gaming & Esports",
  
  // Dating/Relationships
  "LGBTQIA+",
  "Local Gay Parties/Events",
  "Polyamory and ENM",
  
  // Family/Kids
  "Parent Meetups",
  
  // Food Extensions
  "Barbecue & Grilling",
  "Farm-to-Table",
  "Late Night Eats",
  "Cooking Classes",
  
  // Outdoor/Adventure
  "Surfing",
  "Adventure Tours",
  "Wildlife & Nature",
  "Biking / Cycling",
  
  // Sports/Recreation
  "Sports & Recreation",
  "Golf",
  "Pickleball",
  "Bowling",
  
  // Health/Wellness
  "Spa & Wellness",
  "Meditation & Mindfulness",
  
  // Creative/Learning
  "Dance Classes and Events",
  "Digital Nomads",
  
  // Shopping/Lifestyle
  "Flea Markets",
  
  // Unique/Specialty
  "Astronomy"
];

// Combined interests (Most Popular + Additional)
export const ALL_INTERESTS = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];

// GROUPED ACTIVITIES FOR EASIER SELECTION

export const SOCIAL_ACTIVITIES = [
  "Local Connections",
  "Meetup Organizing",
  "Language Practice"
];

export const PLANNING_ACTIVITIES = [
  "Cultural Learning",
  "Blogging"
];

export const FITNESS_ACTIVITIES = [
  "Fitness Challenges",
  "Working out at Gym",
  "Running & Jogging"
];

// Combined activities in logical order
export const ALL_ACTIVITIES = [
  ...SOCIAL_ACTIVITIES,
  ...PLANNING_ACTIVITIES,
  ...FITNESS_ACTIVITIES
];

// GROUPED EVENTS FOR EASIER SELECTION

export const CULTURAL_COMMUNITY_EVENTS = [
  "Street Festivals",
  "Community Events",
  "Charity Events"
];

export const PARTY_NIGHTLIFE_EVENTS = [
  "Club Nights",
  "Karaoke Nights"
];

export const SPORTS_COMPETITION_EVENTS = [
  "Sports Events",
  "Game Nights",
  "Trivia Nights"
];

export const SOCIAL_NETWORKING_EVENTS = [
  "Networking Events",
  "Meet & Greets",
  "Speed Dating Events",
  "Flash Mobs"
];

export const ENTERTAINMENT_EVENTS = [
  "Pop-up Restaurants",
  "Outdoor Movies",
  "Open Mic Nights"
];

export const FAMILY_EVENTS = [
  "Kid-Friendly Events"
];

// Combined events in logical order
export const ALL_EVENTS = [
  ...CULTURAL_COMMUNITY_EVENTS,
  ...PARTY_NIGHTLIFE_EVENTS,
  ...SPORTS_COMPETITION_EVENTS,
  ...SOCIAL_NETWORKING_EVENTS,
  ...ENTERTAINMENT_EVENTS,
  ...FAMILY_EVENTS
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

// BASE_TRAVELER_TYPES for consistency across signup forms
export const BASE_TRAVELER_TYPES = [
  "Solo Traveler", "Couple Traveler", "Group Traveler", "Family Traveler",
  "Budget Traveler", "Luxury Traveler", "Backpacker", "Business Traveler", 
  "Digital Nomad", "Student Traveler", "First Time Traveler Here", 
  "City Explorer", "Solo Parent Travel", "Parent Seeking Parent Friends"
];

// BUSINESS_TYPES for business signup consistency
export const BUSINESS_TYPES = [
  "Restaurant/Food Service",
  "Hotel/Accommodation", 
  "Bar/Nightlife",
  "Tour Company/Guide Service",
  "Transportation Service",
  "Retail Store",
  "Adventure/Outdoor Activity",
  "Cultural Experience/Museum",
  "Entertainment Venue",
  "Coffee Shop/Cafe",
  "Wellness/Spa Service",
  "Photography/Creative Service",
  "Event Planning/Catering",
  "Local Tours & Experiences",
  "Rental Service",
  "Custom (specify below)"
];

// SEXUAL PREFERENCES - Multiple selection allowed for complex identities
export const SEXUAL_PREFERENCE_OPTIONS = [
  "Straight",
  "Gay", 
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Polyamorous",
  "Sapiosexual",
  "Demisexual",
  "Heteroflexible",
  "Prefer not to say"
];

// Export function for sexual preferences
export const getSexualPreferenceOptions = () => SEXUAL_PREFERENCE_OPTIONS;