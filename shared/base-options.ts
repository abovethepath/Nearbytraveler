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
  "Ghost Tours & Haunted Places",
  
  // Sports & Recreation
  "Tennis",
  "Basketball",
  "Soccer",
  "Volleyball",
  "Baseball & Softball",
  "Ice Skating",
  "Skateboarding",
  "Paddleboarding",
  "Table Tennis",
  "Bowling",
  
  // Cultural Activities
  "Cooking & Baking",
  "Wine Tasting",
  "Brewery Tours",
  "Distillery Tours",
  "Tea Houses",
  "Cultural Festivals",
  "Art Galleries",
  "Pottery & Ceramics",
  
  // Entertainment & Games
  "Board Games",
  "Card Games",
  "Arcade Games",
  "Escape Rooms",
  "Virtual Reality",
  "Laser Tag",
  "Mini Golf",
  "Go-Kart Racing",
  
  // Outdoor Activities
  "Geocaching",
  "Stargazing",
  "Beach Volleyball",
  "Frisbee & Disc Golf",
  "Park Picnics",
  "Outdoor BBQ",
  "Sunset Watching",
  
  // Music & Dance
  "Salsa Dancing",
  "Swing Dancing",
  "Hip Hop Dance",
  "DJ & Electronic Music",
  "Acoustic Music",
  "Music Jam Sessions",
  
  // Food & Drinks
  "Coffee Tasting",
  "Brunch Culture",
  "Food Trucks",
  "Rooftop Dining",
  "Izakaya & Tapas",
  "Farmers Markets",
  "Cooking Competitions",
  
  // Social & Community
  "Coworking Spaces",
  "Language Exchange",
  "Pub Quizzes",
  "Debate & Discussion",
  "Improv Comedy",
  "Stand-up Comedy",
  "Poetry Readings",
  "Social Activism",
  
  // Nature & Animals
  "Dog Parks",
  "Pet Cafes",
  "Aquariums",
  "Zoos & Safari",
  "Butterfly Gardens",
  "Flower Markets",
  
  // Technology & Innovation
  "Hackathons",
  "Tech Meetups",
  "Startup Events",
  "3D Printing",
  "Drone Flying",
  "Coding Workshops",
  
  // Unique Experiences
  "Food Challenges",
  "Pub Crawls",
  "Scavenger Hunts",
  "Walking Tours",
  "Bike Tours",
  "Segway Tours",
  "Hot Air Balloons",
  "Parasailing",
  "Bungee Jumping",
  "Zip Lining"
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

export const ADVENTURE_ACTIVITIES = [
  "Outdoor Adventures",
  "Water Sports",
  "Extreme Sports",
  "Mountain Activities",
  "Urban Exploration"
];

export const CREATIVE_ACTIVITIES = [
  "Art & Crafts",
  "Music Making",
  "Dance Practice",
  "Photography Walks",
  "Creative Writing"
];

export const FOOD_ACTIVITIES = [
  "Restaurant Hopping",
  "Food Market Visits",
  "Cooking Together",
  "Baking Sessions",
  "Wine & Spirits Tasting"
];

export const LEARNING_ACTIVITIES = [
  "Workshop Attendance",
  "Skill Sharing",
  "Book Reading",
  "Educational Tours",
  "Study Groups"
];

export const ENTERTAINMENT_ACTIVITIES = [
  "Movie Going",
  "Concert Attendance",
  "Theater Shows",
  "Comedy Shows",
  "Live Performances"
];

export const SPORTS_ACTIVITIES = [
  "Team Sports",
  "Individual Sports",
  "Beach Sports",
  "Indoor Sports",
  "Outdoor Recreation"
];

export const WELLNESS_ACTIVITIES = [
  "Yoga Practice",
  "Meditation Sessions",
  "Spa Visits",
  "Nature Therapy",
  "Wellness Workshops"
];

export const NIGHTLIFE_ACTIVITIES = [
  "Bar Hopping",
  "Club Dancing",
  "Late Night Dining",
  "Rooftop Lounging",
  "Live Music Venues"
];

export const SOCIAL_HANGOUTS = [
  "Coffee Shop Meetups",
  "Park Gatherings",
  "Beach Hangouts",
  "Picnic Outings",
  "Game Nights"
];

// Combined activities in logical order
export const ALL_ACTIVITIES = [
  ...SOCIAL_ACTIVITIES,
  ...PLANNING_ACTIVITIES,
  ...FITNESS_ACTIVITIES,
  ...ADVENTURE_ACTIVITIES,
  ...CREATIVE_ACTIVITIES,
  ...FOOD_ACTIVITIES,
  ...LEARNING_ACTIVITIES,
  ...ENTERTAINMENT_ACTIVITIES,
  ...SPORTS_ACTIVITIES,
  ...WELLNESS_ACTIVITIES,
  ...NIGHTLIFE_ACTIVITIES,
  ...SOCIAL_HANGOUTS
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

export const FOOD_DRINK_EVENTS = [
  "Wine Tasting Events",
  "Beer Festivals",
  "Food Festivals",
  "Cooking Competitions",
  "Restaurant Weeks",
  "Farmers Market Events",
  "Coffee Festivals"
];

export const ARTS_CULTURE_EVENTS = [
  "Art Exhibitions",
  "Gallery Openings",
  "Film Festivals",
  "Book Fairs",
  "Poetry Slams",
  "Theater Premieres",
  "Dance Performances"
];

export const MUSIC_EVENTS = [
  "Music Festivals",
  "Concert Series",
  "DJ Nights",
  "Jazz Sessions",
  "Classical Concerts",
  "Indie Music Shows",
  "Music Workshops"
];

export const OUTDOOR_EVENTS = [
  "Beach Parties",
  "Park Events",
  "Outdoor Concerts",
  "Hiking Meetups",
  "Camping Trips",
  "Sunrise/Sunset Gatherings",
  "Bike Rallies"
];

export const SEASONAL_EVENTS = [
  "Holiday Markets",
  "New Year Celebrations",
  "Summer Festivals",
  "Winter Events",
  "Spring Celebrations",
  "Autumn Festivals",
  "Cultural Holidays"
];

export const WELLNESS_EVENTS = [
  "Yoga Retreats",
  "Meditation Workshops",
  "Wellness Fairs",
  "Health Expos",
  "Fitness Challenges",
  "Running Events",
  "Charity Runs"
];

export const TECH_INNOVATION_EVENTS = [
  "Tech Conferences",
  "Startup Pitches",
  "Hackathons",
  "Innovation Showcases",
  "Coding Bootcamps",
  "VR/AR Demos",
  "Tech Networking"
];

export const ADVENTURE_EVENTS = [
  "Adventure Races",
  "Obstacle Courses",
  "Extreme Sports Events",
  "Water Sports Competitions",
  "Mountain Challenges",
  "Urban Adventures",
  "Treasure Hunts"
];

export const LEARNING_EVENTS = [
  "Workshops",
  "Seminars",
  "Conferences",
  "Lectures",
  "Training Sessions",
  "Educational Tours",
  "Skill Exchanges"
];

export const SPECIAL_EVENTS = [
  "Pride Celebrations",
  "Cultural Parades",
  "Fashion Shows",
  "Car Shows",
  "Pet Events",
  "Market Days",
  "Block Parties",
  "Flash Sales",
  "Auctions",
  "Award Ceremonies"
];

// Combined events in logical order
export const ALL_EVENTS = [
  ...CULTURAL_COMMUNITY_EVENTS,
  ...PARTY_NIGHTLIFE_EVENTS,
  ...SPORTS_COMPETITION_EVENTS,
  ...SOCIAL_NETWORKING_EVENTS,
  ...ENTERTAINMENT_EVENTS,
  ...FAMILY_EVENTS,
  ...FOOD_DRINK_EVENTS,
  ...ARTS_CULTURE_EVENTS,
  ...MUSIC_EVENTS,
  ...OUTDOOR_EVENTS,
  ...SEASONAL_EVENTS,
  ...WELLNESS_EVENTS,
  ...TECH_INNOVATION_EVENTS,
  ...ADVENTURE_EVENTS,
  ...LEARNING_EVENTS,
  ...SPECIAL_EVENTS
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
