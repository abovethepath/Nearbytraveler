// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/EVENTS/LANGUAGES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// ========================================
// TOP CHOICES TO MEET TRAVELERS AND LOCALS
// ========================================
// ALL USERS (local, traveler, new to town) select from this EXACT SAME LIST during signup
// This ensures everyone can be matched on the same interests

export const TOP_CHOICES = [
  "Open to Dating",
  "Meeting New People",
  "Restaurants & Food Scene",
  "Coffee Shops & Cafes",
  "Brunch Spots",
  "Ethnic Cuisine",
  "Happy Hours & Bars",
  "Nightlife & Dancing",
  "Craft Beer & Breweries",
  "Wine & Vineyards",
  "Live Music & Concerts",
  "Comedy Shows",
  "Theater & Performing Arts",
  "Hiking & Outdoors",
  "Beach & Water Activities",
  "Adventure Tours",
  "Wildlife & Nature",
  "Fitness & Sports",
  "Golf",
  "Pickleball",
  "Museums & Culture",
  "City Tours & Sightseeing",
  "Local Hidden Gems",
  "Historical Sites",
  "Local Events & Festivals",
  "Photography & Art",
  "Gaming & Esports",
  "Family Activities",
  "LGBTQIA+",
  "Digital Nomads"
];

// DEPRECATED - kept for backward compatibility
export const HOMETOWN_INTERESTS = TOP_CHOICES;
export const TRAVEL_INTERESTS = [];
export const PROFILE_INTERESTS = [];

// ========================================
// LEGACY COMPATIBILITY (DEPRECATED)
// ========================================
export const MOST_POPULAR_INTERESTS = TOP_CHOICES;
export const ADDITIONAL_INTERESTS = [
  // Outdoor & Adventure
  "Camping & RV Travel",
  "Rock Climbing",
  "Surfing",
  "Skiing & Snowboarding",
  "Kayaking & Canoeing",
  "Scuba Diving",
  "Cycling & Biking",
  "Sailing & Boating",
  "Fishing",
  "Horseback Riding",
  
  // Food & Culinary
  "Cooking Classes",
  "Food Tours",
  "Vegetarian & Vegan",
  "Street Food",
  "Farm-to-Table Dining",
  "Bakeries & Desserts",
  
  // Arts & Creativity
  "Painting & Drawing",
  "Crafts & DIY",
  "Film & Cinema",
  "Dance Classes",
  "Writing & Poetry",
  "Fashion & Style",
  "Architecture",
  
  // Music & Entertainment
  "Jazz & Blues",
  "Electronic Music",
  "Classical Music",
  "Indie Music Scene",
  "Karaoke",
  
  // Wellness & Self-Care
  "Yoga & Meditation",
  "Spa & Wellness",
  "Spiritual Retreats",
  "Healthy Living",
  "Mindfulness",
  
  // Learning & Growth
  "Book Clubs",
  "Learning Languages",
  "Philosophy & Discussion",
  "Science & Technology",
  "Entrepreneurship",
  "Volunteering",
  
  // Shopping & Markets
  "Vintage & Thrift Shopping",
  "Local Markets & Bazaars",
  "Antiques & Collectibles",
  "Shopping Districts",
  
  // Nightlife & Social
  "Rooftop Bars",
  "Jazz Clubs",
  "Sports Bars",
  "Hookah Lounges",
  "Late Night Eats",
  
  // Nature & Wildlife
  "Bird Watching",
  "National Parks",
  "Botanical Gardens",
  "Eco-Tourism",
  
  // Special Interests
  "Luxury Experiences",
  "Budget Travel",
  "Off the Beaten Path",
  "Road Trips",
  "Train Travel",
  "Cruises",
  "Solo Adventures",
  "Romantic Getaways",
  "Religious & Spiritual Sites",
  "Ghost Tours & Haunted Places"
];
export const ALL_INTERESTS = [...TOP_CHOICES, ...ADDITIONAL_INTERESTS];

// ========================================
// HELPER FUNCTIONS - USE THESE IN COMPONENTS
// ========================================

// Get top choices (for ALL signups - locals, travelers, new to town)
export const getTopChoices = () => TOP_CHOICES;

// DEPRECATED - use getTopChoices instead
export const getHometownInterests = () => TOP_CHOICES;
export const getTravelInterests = () => [];
export const getProfileInterests = () => [];

// Get signup interests - ALL users get the same list
export const getSignupInterests = (userType: 'local' | 'traveler') => {
  return TOP_CHOICES; // Same list for everyone
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
    isValid: total >= 7,
    needed: Math.max(0, 7 - total)
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
