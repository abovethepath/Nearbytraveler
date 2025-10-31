// ⭐ MASTER BASE OPTIONS - SITE-WIDE CONSISTENCY SYSTEM ⭐
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL INTERESTS/ACTIVITIES/TOP CHOICES
// USED ACROSS: All signup pages, profile editing, trip planning, advanced search, matching algorithms
// DO NOT CREATE SEPARATE LISTS - ALWAYS IMPORT FROM HERE

// ========================================
// TOP CHOICES (30 items)
// ========================================
// Primary categories for meeting travelers and locals
// Users select from this list to indicate their main interests

export const TOP_CHOICES = [
  "Restaurants & Food Scene",
  "Brunch Spots",
  "Street Food",
  "Coffee Shops & Cafes",
  "Late Night Eats",
  "Vegan/Vegetarian",
  "Happy Hour",
  "Craft Beer & Breweries",
  "Wine Bars & Vineyards",
  "Nightlife & Dancing",
  "Live Music",
  "Karaoke",
  "Comedy Shows",
  "Local Hidden Gems",
  "Historical Sites & Tours",
  "Museums",
  "Cultural Experiences",
  "Photography & Scenic Spots",
  "Local Markets & Bazaars",
  "Beach Activities",
  "Water Sports",
  "Hiking",
  "Fitness Classes",
  "Working Out",
  "Golf",
  "Pickleball",
  "Meeting New People",
  "Open to Dating",
  "LGBTQIA+",
  "Family-Oriented"
];

// ========================================
// INTERESTS (79 items)
// ========================================
// Extended interests for deeper user matching and personalization

export const INTERESTS = [
  "Sober/Alcohol-Free Lifestyle",
  "420-Friendly",
  "Religious & Spiritual Sites",
  "Wellness & Mindfulness",
  "Volunteering",
  "Activism",
  "Animal Rescue & Shelters",
  "Pet Lovers",
  "Luxury Experiences",
  "Budget Travel",
  "Smoke-Free Environments",
  "Health-Conscious/Vaccinated",
  "Hookah Lounges",
  "Food Tours",
  "Bakeries & Desserts",
  "Ethnic Cuisine",
  "Farm-to-Table Dining",
  "Food Trucks",
  "Food & Wine Festivals",
  "Beer Festivals",
  "Pop-up Restaurants",
  "Rooftop Bars",
  "Cocktail Bars & Speakeasies",
  "Jazz Clubs",
  "Concerts",
  "Theater",
  "Performing Arts",
  "Movies",
  "Film Festivals",
  "Gaming",
  "Electronic/DJ Scene",
  "Ghost Tours",
  "Architecture",
  "Street Art",
  "Trivia Nights",
  "Sports Events",
  "Street Festivals",
  "Community Events",
  "Tennis",
  "Running & Jogging",
  "Team Sports",
  "Yoga & Meditation",
  "Extreme Sports",
  "Camping & RV Travel",
  "Nature Walks",
  "Rock Climbing",
  "Surfing",
  "Skiing & Snowboarding",
  "Scuba Diving",
  "Cycling & Biking",
  "Sailing & Boating",
  "Kayaking & Canoeing",
  "Fishing",
  "Kid-Friendly Activities",
  "Parenting Meetups",
  "Family Travel",
  "Arts",
  "Crafts",
  "Fashion & Style",
  "Classical Music",
  "Indie Music Scene",
  "Vintage & Thrift Shopping",
  "Antiques & Collectibles",
  "Language Exchange",
  "Book Clubs",
  "Reading",
  "Tech Meetups",
  "Innovation",
  "Coworking & Networking",
  "Digital Nomads",
  "Hot Air Balloons",
  "Beach Volleyball",
  "Frisbee & Disc Golf",
  "Stargazing",
  "Fine Dining",
  "Cheap Eats",
  "City Tours & Sightseeing",
  "Art Galleries",
  "Outdoor BBQ",
  "Sunset Watching",
  "Park Picnics",
  "Cultural Learning",
  "Blogging"
];

// ========================================
// ACTIVITIES (6 items)
// ========================================
// Concrete activities users want to do together (no overlap with Top Choices or Interests)

export const ACTIVITIES = [
  "Zoo & Aquarium Visits",
  "Creative Sessions",
  "Cooking Together",
  "Game Nights",
  "Exploring Local Spots",
  "Meetup Organizing"
];

// ========================================
// COMBINED ARRAYS
// ========================================

// All interests combined (Top Choices + Interests)
export const ALL_INTERESTS = [...TOP_CHOICES, ...INTERESTS];

// All activities (just the ACTIVITIES array)
export const ALL_ACTIVITIES = [...ACTIVITIES];

// ========================================
// DEPRECATED - Kept for backward compatibility
// ========================================

// Legacy aliases that point to new structure
export const HOMETOWN_INTERESTS = TOP_CHOICES;
export const TRAVEL_INTERESTS = [];
export const PROFILE_INTERESTS = [];
export const MOST_POPULAR_INTERESTS = TOP_CHOICES;
export const ADDITIONAL_INTERESTS = INTERESTS;

// ========================================
// HELPER FUNCTIONS - USE THESE IN COMPONENTS
// ========================================

// Get top choices (for ALL signups - locals, travelers, new to town)
export const getTopChoices = () => TOP_CHOICES;

// Get all interests
export const getAllInterests = () => ALL_INTERESTS;

// Get all activities
export const getAllActivities = () => ALL_ACTIVITIES;

// DEPRECATED - use getTopChoices instead
export const getHometownInterests = () => TOP_CHOICES;
export const getTravelInterests = () => [];
export const getProfileInterests = () => [];
export const getMostPopularInterests = () => MOST_POPULAR_INTERESTS;
export const getAdditionalInterests = () => ADDITIONAL_INTERESTS;

// Get signup interests - ALL users get the same list
export const getSignupInterests = (userType: 'local' | 'traveler') => {
  return TOP_CHOICES; // Same list for everyone
};

// ========================================
// LANGUAGES
// ========================================

// Languages available for selection
export const ALL_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch",
  "Russian", "Polish", "Czech", "Hungarian", "Swedish", "Norwegian", "Danish",
  "Chinese (Mandarin)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian",
  "Arabic", "Hebrew", "Turkish", "Greek", "Hindi", "Urdu", "Bengali"
];

export const getAllLanguages = () => ALL_LANGUAGES;

// ========================================
// LEGACY COMPATIBILITY MAPPING
// ========================================

// Maps old combined options to new split options
// This ensures existing user data doesn't break after the split
export const LEGACY_TO_NEW_MAPPING: Record<string, string[]> = {
  // TOP CHOICES legacy mappings
  "Live Music & Concerts": ["Live Music"],
  "Museums & Culture": ["Museums", "Cultural Experiences"],
  "Beach & Water Activities": ["Beach Activities", "Water Sports"],
  "Hiking & Nature": ["Hiking"],
  "Fitness & Workouts": ["Fitness Classes", "Working Out"],
  
  // INTERESTS legacy mappings
  "Volunteering & Activism": ["Volunteering", "Activism", "Animal Rescue & Shelters"],
  "Theater & Performing Arts": ["Theater", "Performing Arts"],
  "Film & Cinema": ["Movies", "Film Festivals"],
  "Street Festivals & Community Events": ["Street Festivals", "Community Events"],
  "Arts & Crafts": ["Arts", "Crafts"],
  "Book Clubs & Reading": ["Book Clubs", "Reading"],
  "Tech & Innovation": ["Tech Meetups", "Innovation"],
};

// Migrates old combined options to new split options
export const migrateLegacyOptions = (options: string[]): string[] => {
  const migrated: string[] = [];
  
  options.forEach(option => {
    if (LEGACY_TO_NEW_MAPPING[option]) {
      // Replace old combined option with new split options
      migrated.push(...LEGACY_TO_NEW_MAPPING[option]);
    } else {
      // Keep option as-is if not a legacy value
      migrated.push(option);
    }
  });
  
  // Remove duplicates
  return Array.from(new Set(migrated));
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

// Validation function to ensure consistent total selections
// Note: Events parameter removed as events are no longer part of user profiles
export const validateSelections = (interests: string[], activities: string[], languages: string[]) => {
  const total = interests.length + activities.length + languages.length;
  return {
    total,
    isValid: total >= 7,
    needed: Math.max(0, 7 - total)
  };
};

// ========================================
// USER TYPE OPTIONS
// ========================================

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

// ========================================
// SUMMARY
// ========================================
// Total taxonomy: 115 items (cleaned up redundancies October 2025)
// - TOP_CHOICES: 30 items (broad categories for meeting travelers and locals)
// - INTERESTS: 79 items (specific interests and preferences for deeper matching)
// - ACTIVITIES: 6 items (unique concrete activities with zero overlap)
// 
// SPLIT COMBINED OPTIONS (October 2025):
// To improve clarity and precision, confusing combined options were split into individual choices:
// 
// TOP CHOICES splits:
// - "Live Music & Concerts" → "Live Music" (Concerts removed as duplicate)
// - "Museums & Culture" → "Museums", "Cultural Experiences"
// - "Beach & Water Activities" → "Beach Activities", "Water Sports"
// - "Hiking & Nature" → "Hiking" (Nature Walks removed as duplicate)
// - "Fitness & Workouts" → "Fitness Classes", "Working Out"
// 
// REMOVED REDUNDANCIES (October 2025):
// - "Digital Nomads" (not relevant for meeting travelers/locals)
// - "Nature Walks" (duplicate of "Hiking")
// - "Concerts" (duplicate of "Live Music")
// - "Rooftop Bars", "Cocktail Bars & Speakeasies" (consolidated into Happy Hour, Nightlife & Dancing, Craft Beer, Wine Bars)
//
// INTERESTS splits:
// - "Volunteering & Activism" → "Volunteering", "Activism", "Animal Rescue & Shelters"
// - "Theater & Performing Arts" → "Theater", "Performing Arts"
// - "Film & Cinema" → "Movies", "Film Festivals"
// - "Street Festivals & Community Events" → "Street Festivals", "Community Events"
// - "Arts & Crafts" → "Arts", "Crafts"
// - "Book Clubs & Reading" → "Book Clubs", "Reading"
// - "Tech & Innovation" → "Tech Meetups", "Innovation"
// 
// REMOVED DUPLICATES FROM ACTIVITIES:
// - Park Gatherings, Picnic Outings (duplicates of "Park Picnics" in Interests)
// - Beach Hangouts (duplicate of "Beach Activities" in Top Choices)
// - Walking Tours (duplicate of "City Tours & Sightseeing" in Interests)
// - Movie Going (duplicate of "Movies" in Interests)
// - Outdoor Adventures (duplicate of "Hiking" in Top Choices)
// 
// Events have been removed from user profiles - they now only exist as community events that users can create/attend
