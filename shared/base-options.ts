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
  "Cocktail Bars & Speakeasies",
  "Craft Beer & Breweries",
  "Wine Bars & Vineyards",
  "Rooftop Bars",
  "Nightlife & Dancing",
  "Live Music & Concerts",
  "Karaoke",
  "Comedy Shows",
  "Local Hidden Gems",
  "Historical Sites & Tours",
  "Museums & Culture",
  "Photography & Scenic Spots",
  "Local Markets & Bazaars",
  "Beach & Water Activities",
  "Hiking & Nature",
  "Fitness & Workouts",
  "Golf",
  "Pickleball",
  "Meeting New People",
  "Open to Dating",
  "LGBTQIA+",
  "Family-Oriented",
  "Digital Nomads"
];

// ========================================
// INTERESTS (67 items)
// ========================================
// Extended interests for deeper user matching and personalization

export const INTERESTS = [
  "Sober/Alcohol-Free Lifestyle",
  "420-Friendly",
  "Religious & Spiritual Sites",
  "Wellness & Mindfulness",
  "Volunteering & Activism",
  "Pet Lovers",
  "Luxury Experiences",
  "Budget Travel",
  "Non-Drinker Social Scene",
  "Smoke-Free Environments",
  "Health-Conscious/Vaccinated",
  "Hookah Lounges",
  "Food Tours",
  "Bakeries & Desserts",
  "Ethnic Cuisine",
  "Farm-to-Table Dining",
  "Farmers Markets",
  "Food Trucks",
  "Food & Wine Festivals",
  "Beer Festivals",
  "Pop-up Restaurants",
  "Jazz Clubs",
  "Theater & Performing Arts",
  "Film & Cinema",
  "Gaming",
  "Electronic/DJ Scene",
  "Ghost Tours",
  "City Tours",
  "Architecture",
  "Street Art",
  "Trivia Nights",
  "Sports Events",
  "Street Festivals & Community Events",
  "Tennis",
  "Running & Jogging",
  "Team Sports",
  "Yoga & Meditation",
  "Extreme Sports",
  "Camping & RV Travel",
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
  "Children's Museums & Events",
  "Playground Hangouts",
  "Family Dining",
  "Educational Activities for Kids",
  "Arts & Crafts",
  "Fashion & Style",
  "Writing & Book Clubs",
  "Jazz & Blues",
  "Classical Music",
  "Indie Music Scene",
  "Vintage & Thrift Shopping",
  "Antiques & Collectibles",
  "Language Exchange",
  "Book Clubs & Reading",
  "Tech & Innovation",
  "Coworking & Networking",
  "Sunset Viewpoints",
  "Hot Air Balloons"
];

// ========================================
// ACTIVITIES (18 items)
// ========================================
// Concrete activities users want to do together

export const ACTIVITIES = [
  "Family Outings",
  "Kids' Playgrounds & Parks",
  "Zoo & Aquarium Visits",
  "Restaurant Hopping",
  "Alcohol-Free Hangouts",
  "Bar Hopping",
  "Working Out Together",
  "Outdoor Adventures",
  "Water Sports",
  "Beach Hangouts",
  "Sports & Recreation",
  "Creative Sessions",
  "Cooking Together",
  "Photography Walks",
  "Game Nights",
  "Walking Tours",
  "Exploring Local Spots",
  "Late Night Adventures"
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
// Total taxonomy: 115 items
// - TOP_CHOICES: 30 items
// - INTERESTS: 67 items  
// - ACTIVITIES: 18 items
// Events have been removed from user profiles - they now only exist as community events that users can create/attend
