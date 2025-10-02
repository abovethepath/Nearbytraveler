// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/EVENTS/LANGUAGES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// ========================================
// NEW TWO-PHASE INTEREST SYSTEM
// ========================================

// HOMETOWN INTERESTS (12 core) - Collected at signup for ALL users (locals & travelers)
// These represent what users do/enjoy in their everyday life at home
export const HOMETOWN_INTERESTS = [
  "Happy Hours & Bars",
  "Coffee Shops & Cafes",
  "Restaurants & Food Scene",
  "Live Music & Concerts",
  "Hiking & Outdoors",
  "Beach & Water Activities",
  "Fitness & Sports",
  "Museums & Culture",
  "Nightlife & Dancing",
  "Local Events & Festivals",
  "Photography & Art",
  "Meeting New People"
];

// TRAVEL-SPECIFIC INTERESTS (6 items) - ONLY for travelers during signup
// These represent travel-specific activities that travelers want to do on their trip
export const TRAVEL_INTERESTS = [
  "City Tours & Sightseeing",
  "Local Hidden Gems",
  "Historical Sites",
  "Food Tours & Local Specialties",
  "Adventure Activities",
  "Cultural Experiences"
];

// PROFILE INTERESTS (40-50 optional) - Users can add these later in their profile
// Niche interests, lifestyle preferences, and identity markers
export const PROFILE_INTERESTS = [
  // Dating/Social (renamed and repositioned)
  "Open to Dating", // Renamed from "Single and Looking"
  
  // Lifestyle & Identity
  "LGBTQIA+",
  "Cannabis User",
  
  // Party/Nightlife Extensions
  "Craft Beer & Breweries",
  "Cocktail Bars",
  "Wine & Vineyards",
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
  
  // Family/Kids
  "Family Activities",
  "Parent Meetups",
  
  // Food Extensions
  "Local Food Specialties",
  "Cheap Eats",
  "Fine Dining",
  "Brunch Spots",
  "Ethnic Cuisine",
  "Food Tours / Trucks",
  "Barbecue & Grilling",
  "Farm-to-Table",
  "Late Night Eats",
  "Cooking Classes",
  
  // Outdoor/Adventure
  "Surfing",
  "Adventure Tours",
  "Wildlife & Nature",
  "Biking / Cycling",
  "Boat & Water Tours",
  "Off the Path Adventures",
  
  // Cultural/Tourism
  "Architecture",
  "Art Galleries",
  "Street Art",
  "Cultural Sites",
  
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

// ========================================
// LEGACY COMPATIBILITY (DEPRECATED)
// ========================================
// Keep these for backward compatibility but prefer new system above
export const MOST_POPULAR_INTERESTS = [...HOMETOWN_INTERESTS, ...TRAVEL_INTERESTS, ...PROFILE_INTERESTS.slice(0, 20)];
export const ADDITIONAL_INTERESTS = PROFILE_INTERESTS.slice(20);
export const ALL_INTERESTS = [...HOMETOWN_INTERESTS, ...TRAVEL_INTERESTS, ...PROFILE_INTERESTS];

// ========================================
// HELPER FUNCTIONS - USE THESE IN COMPONENTS
// ========================================

// Get hometown interests (for ALL signups)
export const getHometownInterests = () => HOMETOWN_INTERESTS;

// Get travel interests (for TRAVELER signup only)
export const getTravelInterests = () => TRAVEL_INTERESTS;

// Get profile interests (for profile editing)
export const getProfileInterests = () => PROFILE_INTERESTS;

// Get signup interests based on user type
export const getSignupInterests = (userType: 'local' | 'traveler') => {
  if (userType === 'local') {
    return HOMETOWN_INTERESTS; // 12 options
  } else {
    return [...HOMETOWN_INTERESTS, ...TRAVEL_INTERESTS]; // 18 options
  }
};

// ========================================
// ACTIVITIES & EVENTS (unchanged)
// ========================================

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

// ========================================
// LEGACY EXPORT FUNCTIONS (DEPRECATED)
// ========================================
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
