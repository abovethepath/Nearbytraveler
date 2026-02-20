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
// INTERESTS (73 items)
// ========================================
// Extended interests for deeper user matching and personalization
export const INTERESTS = [
    "Sober/Alcohol-Free Lifestyle",
    "420-Friendly",
    "Nudism",
    "Religious & Spiritual Sites",
    "Wellness & Mindfulness",
    "Animal Rescue & Shelters",
    "Pet Lovers",
    "Health-Conscious/Vaccinated",
    "Hookah Lounges",
    "Food Tours",
    "Ethnic Cuisine",
    "Farm-to-Table Dining",
    "Food Trucks",
    "Food & Wine Festivals",
    "Beer Festivals",
    "Pop-up Restaurants",
    "Rooftop Bars",
    "Cocktail Bars & Speakeasies",
    "Jazz Clubs",
    "Theater",
    "Film Festivals",
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
    "Yoga & Meditation",
    "Extreme Sports",
    "Camping & RV Travel",
    "Rock Climbing",
    "Surfing",
    "Skiing & Snowboarding",
    "Scuba Diving",
    "Cycling & Biking",
    "Sailing",
    "Kayaking",
    "Fishing",
    "Kid-Friendly Activities",
    "Parenting Meetups",
    "Arts",
    "Crafts",
    "Fashion & Style",
    "Classical Music",
    "Indie Music Scene",
    "Vintage & Thrift Shopping",
    "Innovation",
    "Digital Nomads",
    "Beach Volleyball",
    "Cheap Eats",
    "Sunset Watching",
    "Park Picnics",
    "Cultural Learning",
    "Blogging"
];
// ========================================
// ACTIVITIES (18 items) - GENERAL USE
// ========================================
// Concrete activities users want to do together - specific "let's do this" actions
export const ACTIVITIES = [
    "Shopping Adventures",
    "Day Trips",
    "Group Workouts",
    "Sports & Recreation",
    "Cooking Together",
    "Game Nights",
    "Movie Watching",
    "Concert Going",
    "Language Practice Meetups",
    "Study & Coworking Sessions"
];
// ========================================
// TRAVEL_ACTIVITIES (20 items) - UNIVERSAL INTENTS
// ========================================
// Clean, universal activity intents that apply to ALL cities
// These are WHAT people want to DO, not specific places
// Consolidated to 20 core intents for cleaner UX
export const TRAVEL_ACTIVITIES = [
    // Social
    "Meet New People",
    "Language Exchange",
    // Food & Dining
    "Restaurants & Local Eats",
    "Coffee & Brunch",
    "Street Food / Food Trucks",
    "Food Tours / Tastings",
    // Nightlife & Entertainment
    "Bars / Happy Hour",
    "Live Music",
    "Comedy Shows",
    "Nightlife & Dancing",
    // Culture & Sightseeing
    "Museums & Galleries",
    "History & Architecture",
    "Scenic / Photography Spots",
    "Local Markets",
    // Outdoor & Fitness
    "Hiking & Nature",
    "Beach / Waterfront",
    "Biking / Cycling",
    "Fitness / Workouts",
    "Yoga / Meditation",
    // Tours
    "Guided Tours"
];
// ========================================
// BUSINESS OFFERINGS (What businesses provide)
// ========================================
// These are what BUSINESSES OFFER to attract customers
// NOT what users want to do - this is business amenities/features/services
export const BUSINESS_INTERESTS = [
    "Happy Hour",
    "Rooftop Bar",
    "Live Music",
    "DJ Nights",
    "Karaoke Nights",
    "Trivia Nights",
    "Comedy Shows",
    "Sports Viewing",
    "Outdoor Seating",
    "Pet-Friendly",
    "Family-Friendly",
    "LGBTQIA+ Friendly",
    "Late Night Hours",
    "Breakfast/Brunch",
    "Lunch Specials",
    "Dinner Service",
    "Craft Cocktails",
    "Wine Selection",
    "Craft Beer",
    "Local Beer",
    "Imported Beer",
    "Full Bar",
    "Non-Alcoholic Options",
    "Vegan Options",
    "Vegetarian Options",
    "Gluten-Free Options",
    "Farm-to-Table",
    "Organic Ingredients",
    "Live Sports",
    "Pool Table",
    "Darts",
    "Board Games",
    "Arcade Games",
    "Private Events",
    "Catering",
    "Delivery Available",
    "Takeout Available",
    "WiFi Available",
    "Coworking Space",
    "Meeting Rooms",
    "420-Friendly"
];
export const BUSINESS_ACTIVITIES = [
    "Pickleball Courts",
    "Tennis Courts",
    "Basketball Courts",
    "Yoga Classes",
    "Fitness Classes",
    "Gym/Workout Facility",
    "Swimming Pool",
    "Hot Tub/Spa",
    "Sauna/Steam Room",
    "Golf Course",
    "Mini Golf",
    "Driving Range",
    "Bowling Lanes",
    "Rock Climbing Wall",
    "Bike Rentals",
    "Kayak Rentals",
    "Surfboard Rentals",
    "Beach Equipment",
    "Hiking Trails",
    "Nature Walks",
    "Wine Tasting",
    "Beer Tasting",
    "Cooking Classes",
    "Art Classes",
    "Music Lessons",
    "Dance Classes",
    "Language Classes",
    "Tours & Excursions",
    "Photography Tours",
    "Food Tours",
    "Historical Tours",
    "Ghost Tours",
    "Boat Tours",
    "Fishing Trips"
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
// Get travel-focused activities (for trip planning)
export const getTravelActivities = () => TRAVEL_ACTIVITIES;
// DEPRECATED - use getTopChoices instead
export const getHometownInterests = () => TOP_CHOICES;
export const getTravelInterests = () => [];
export const getProfileInterests = () => [];
export const getMostPopularInterests = () => MOST_POPULAR_INTERESTS;
export const getAdditionalInterests = () => ADDITIONAL_INTERESTS;
// Get signup interests - ALL users get the same list
export const getSignupInterests = (userType) => {
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
export const LEGACY_TO_NEW_MAPPING = {
    // TOP CHOICES legacy mappings
    "Live Music & Concerts": ["Live Music"],
    "Museums & Culture": ["Museums", "Cultural Experiences"],
    "Beach & Water Activities": ["Beach Activities", "Water Sports"],
    "Hiking & Nature": ["Hiking"],
    "Fitness & Workouts": ["Fitness Classes", "Working Out"],
    // INTERESTS legacy mappings
    "Volunteering & Activism": ["Animal Rescue & Shelters"],
    "Theater & Performing Arts": ["Theater"],
    "Film & Cinema": ["Movies", "Film Festivals"],
    "Street Festivals & Community Events": ["Street Festivals", "Community Events"],
    "Arts & Crafts": ["Arts", "Crafts"],
    "Tech & Innovation": ["Innovation"],
};
// Migrates old combined options to new split options
export const migrateLegacyOptions = (options) => {
    const migrated = [];
    options.forEach(option => {
        if (LEGACY_TO_NEW_MAPPING[option]) {
            // Replace old combined option with new split options
            migrated.push(...LEGACY_TO_NEW_MAPPING[option]);
        }
        else {
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
export const validateSelections = (interests, activities, languages) => {
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
export const SUB_INTEREST_CATEGORIES = [
    {
        id: "fitness",
        label: "Fitness & Exercise",
        emoji: "💪",
        subInterests: [
            "Gym / Weight Training",
            "CrossFit",
            "F45 / HIIT Classes",
            "Yoga",
            "Pilates",
            "Running / Jogging",
            "Cycling / Spin Classes",
            "Swimming",
            "Pickleball",
            "Tennis",
            "Basketball",
            "Boxing / Martial Arts",
            "Dance Fitness / Zumba"
        ]
    },
    {
        id: "outdoor",
        label: "Outdoor Activities",
        emoji: "🏔️",
        subInterests: [
            "Hiking / Trail Walking",
            "Beach / Swimming",
            "Surfing",
            "Kayaking / Paddleboarding",
            "Rock Climbing",
            "Golf",
            "Biking / Mountain Biking",
            "Camping",
            "Fishing",
            "Skiing / Snowboarding",
            "Sailing / Boating"
        ]
    },
    {
        id: "food",
        label: "Food & Dining",
        emoji: "🍽️",
        subInterests: [
            "Fine Dining",
            "Casual Dining",
            "Brunch Spots",
            "Food Trucks / Street Food",
            "Seafood",
            "Italian",
            "Mexican / Latin",
            "Asian Cuisine",
            "Sushi / Japanese",
            "Thai / Vietnamese",
            "Indian",
            "Mediterranean",
            "BBQ / Steakhouse",
            "Vegan / Vegetarian",
            "Farm-to-Table",
            "Food Tours"
        ]
    },
    {
        id: "nightlife",
        label: "Nightlife & Drinks",
        emoji: "🍸",
        subInterests: [
            "Cocktail Bars / Speakeasies",
            "Wine Bars",
            "Craft Beer / Breweries",
            "Rooftop Bars",
            "Sports Bars",
            "Dance Clubs",
            "Lounges",
            "Live Music Venues",
            "Karaoke Bars",
            "Comedy Clubs",
            "LGBTQIA+ Bars / Clubs",
            "Late Night Eats"
        ]
    },
    {
        id: "wellness",
        label: "Wellness & Self-Care",
        emoji: "🧘",
        subInterests: [
            "Spa / Massage",
            "Meditation / Mindfulness",
            "Hot Yoga / Bikram",
            "Sound Baths",
            "Float Tanks",
            "Cryotherapy",
            "Acupuncture",
            "Juice Bars / Smoothies",
            "Health Food Stores"
        ]
    },
    {
        id: "culture",
        label: "Arts & Culture",
        emoji: "🎭",
        subInterests: [
            "Art Museums",
            "History Museums",
            "Theater / Broadway Shows",
            "Ballet / Dance Performances",
            "Classical Music / Symphony",
            "Art Galleries",
            "Street Art / Murals",
            "Film Festivals",
            "Photography Exhibitions",
            "Cultural Festivals"
        ]
    },
    {
        id: "entertainment",
        label: "Entertainment",
        emoji: "🎬",
        subInterests: [
            "Movies / Cinemas",
            "Live Music Concerts",
            "Comedy Shows",
            "Trivia Nights",
            "Escape Rooms",
            "Bowling",
            "Arcade / Gaming",
            "Mini Golf",
            "Go-Karting",
            "Amusement Parks"
        ]
    },
    {
        id: "shopping",
        label: "Shopping",
        emoji: "🛍️",
        subInterests: [
            "Fashion / Boutiques",
            "Vintage / Thrift Stores",
            "Local Markets / Farmers Markets",
            "Artisan / Handmade Goods",
            "Outlet Malls",
            "Antique Shops",
            "Bookstores"
        ]
    },
    {
        id: "family",
        label: "Family-Friendly",
        emoji: "👨‍👩‍👧‍👦",
        subInterests: [
            "Kid-Friendly Restaurants",
            "Playgrounds / Parks",
            "Children's Museums",
            "Zoos / Aquariums",
            "Theme Parks",
            "Beaches (Family-Safe)",
            "Mini Golf",
            "Bowling Alleys",
            "Ice Cream / Dessert Spots"
        ]
    },
    {
        id: "tours",
        label: "Tours & Experiences",
        emoji: "🗺️",
        subInterests: [
            "Walking Tours",
            "Food Tours",
            "Wine / Beer Tasting Tours",
            "Historical Tours",
            "Ghost Tours",
            "Architecture Tours",
            "Boat Tours / Cruises",
            "Helicopter / Scenic Tours",
            "Cooking Classes",
            "Photography Tours"
        ]
    }
];
// Helper function to get all sub-interest categories
export const getSubInterestCategories = () => SUB_INTEREST_CATEGORIES;
// Helper function to get sub-interests for a specific category
export const getSubInterestsForCategory = (categoryId) => {
    const category = SUB_INTEREST_CATEGORIES.find(c => c.id === categoryId);
    return category?.subInterests || [];
};
// Helper function to get category by sub-interest
export const getCategoryBySubInterest = (subInterest) => {
    return SUB_INTEREST_CATEGORIES.find(c => c.subInterests.includes(subInterest));
};
// Helper function to get all sub-interests (flat list)
export const getAllSubInterests = () => {
    return SUB_INTEREST_CATEGORIES.flatMap(c => c.subInterests);
};
// ========================================
// SUMMARY
// ========================================
// Total taxonomy: 162 items (updated January 2025)
// - TOP_CHOICES: 30 items (broad categories for meeting travelers and locals)
// - INTERESTS: 74 items (specific interests and preferences for deeper matching - added Nudism)
// - ACTIVITIES: 18 items (concrete "let's do this" activities for meetups and planning)
// - TRAVEL_ACTIVITIES: 20 items (universal intents - what people want to DO, not specific places)
//
// Items removed from INTERESTS that now exist only as ACTIVITIES:
// - "Concerts" → "Concert Going"
// - "Movies" → "Movie Watching"
// - "Gaming" → "Game Nights"
// - "Language Exchange" → "Language Practice Meetups"
// - "Art Galleries" → "Museum & Gallery Tours"
// - "Coworking & Networking" → "Study & Coworking Sessions"
// - "City Tours & Sightseeing" → "Exploring Hidden Gems" / "Day Trips & Excursions"
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
