// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/EVENTS/LANGUAGES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// Most Popular interests for travelers and locals - reordered for solo and younger travelers
export const MOST_POPULAR_INTERESTS = [
  // Solo/Dating first (top priority for younger solo travelers)
  "Single and Looking",
  
  // Social/Nightlife second (key for young solo travelers)
  "Nightlife & Dancing",
  "Meet Locals/Travelers",
  "Craft Beer & Breweries",
  "Cocktail Bars",
  "Happy Hour Deals",
  "Wine & Vineyards",
  
  // Food/Dining third (major social category)
  "Local Food Specialties", 
  "Cheap Eats",
  "Fine Dining",
  "Brunch Spots",
  "Ethnic Cuisine",
  "Food Tours / Trucks",
  "Local Coffee Shops",
  
  // Cultural/Tourism fourth (popular with solo travelers)
  "Museums",
  "City Tours & Sightseeing",
  "Historical / Walking Tours",
  "Architecture",
  "Art Galleries",
  "Local Hidden Gems",
  "Street Art",
  "Cultural Sites",
  "Photography",
  
  // Entertainment/Activities fifth (entertainment businesses)
  "Festivals & Events",
  "Live Music Venues",
  
  // Health/Fitness sixth (wellness businesses)
  "Hiking & Nature",
  "Beach Activities",
  "Boat & Water Tours",
  "Off the Path Adventures",
  
  // Family/Kids last (less relevant for solo/young travelers)
  "Family Activities"
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
  
  // Dating/Relationships - Including Private/Adult Options
  "LGBTQIA+",
  "Local Gay Parties/Events",
  "Polyamory and ENM",
  "Adult Entertainment",
  "Strip Clubs & Adult Shows",
  "Sex Shops & Adult Stores",
  "BDSM & Kink Community",
  "Swinger Parties & Clubs",
  "Adult Dating & Hookups",
  "Sugar Dating",
  "Escort & Companion Services",
  "Sex-Positive Communities",
  "Adult Gaming & VR",
  "Fetish Events & Meetups",
  "Open Relationships",
  "Threesome & Group Activities",
  "Adult Massage Services",
  "Cam Shows & Online Adult",
  "Adult Content Creation",
  "Sexual Wellness Workshops",
  
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
  "Nudist Beach",
  
  // Cannabis/Substance Culture (Adults Only)
  "Marijuana/Cannabis User",
  
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