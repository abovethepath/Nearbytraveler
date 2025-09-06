import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import cityMatchingIllustration from "@assets/image_1756935226547.png";
import { 
  MapPin, 
  Plus, 
  Users, 
  Heart, 
  Edit, 
  Trash2, 
  Search,
  Target,
  Zap,
  ArrowLeft,
  Camera,
  Info,
  X
} from "lucide-react";
// Removed CityPhotoUploadWidget to improve performance
// Removed MobileNav - using global mobile navigation

// Removed problematic city images and photo gallery functions

// DISABLED: Metro consolidation per user request - return original city names
const consolidateToMetroArea = (city: string, state?: string): string => {
  return city; // No consolidation
};

// Universal activities that apply to ALL cities worldwide for fast loading - TRAVELER FOCUSED
const UNIVERSAL_ACTIVITIES = [
  // Social & Meeting People
  { name: "Meet Locals", description: "Connect with people who live here" },
  { name: "Meet Travelers", description: "Find other people visiting" },
  { name: "Get Drinks", description: "Grab drinks at local spots" },
  { name: "Happy Hours", description: "Find the best happy hour deals" },
  { name: "Coffee Meetups", description: "Meet over coffee" },
  { name: "Language Exchange", description: "Practice languages with locals" },
  { name: "Social Events", description: "Group activities and gatherings" },
  
  // Families & Dating
  { name: "Meet Other Families", description: "Connect with families with kids" },
  { name: "Single and Looking", description: "Meet other singles" },
  
  // Outdoor & Active Adventures
  { name: "Hiking", description: "Explore trails and nature" },
  { name: "Biking", description: "Cycling routes and bike tours" },
  { name: "Walking Tours", description: "Discover the city on foot" },
  { name: "Parks & Gardens", description: "Visit green spaces" },
  { name: "Beach Activities", description: "Ocean, lake, or river fun" },
  { name: "Running Groups", description: "Join local runners" },
  { name: "Rock Climbing", description: "Indoor and outdoor climbing" },
  { name: "Swimming", description: "Pools, lakes, and ocean swimming" },
  { name: "Skateboarding", description: "Skate parks and street skating" },
  { name: "Tennis", description: "Find courts and playing partners" },
  { name: "Basketball", description: "Pickup games and courts" },
  { name: "Soccer/Football", description: "Local games and teams" },
  { name: "Fishing", description: "Local fishing spots" },
  { name: "Outdoor Fitness", description: "Boot camps and outdoor workouts" },
  { name: "Camping", description: "Nearby camping spots" },
  { name: "Nature Walks", description: "Peaceful walks in nature" },
  
  // Food & Dining Experiences
  { name: "Local Food Scene", description: "Try authentic local cuisine" },
  { name: "Food Tours", description: "Guided culinary experiences" },
  { name: "Cooking Classes", description: "Learn local cooking" },
  { name: "Wine Tasting", description: "Local wines and vineyards" },
  { name: "Beer Gardens", description: "Local brews and outdoor drinking" },
  { name: "Breakfast Spots", description: "Best morning meal locations" },
  { name: "Late Night Eats", description: "Food after dark" },
  { name: "Vegetarian/Vegan Food", description: "Plant-based dining options" },
  { name: "Food Festivals", description: "Culinary celebrations" },
  { name: "Coffee Culture", description: "Best cafes and coffee shops" },
  { name: "Dessert Places", description: "Sweet treats and bakeries" },
  { name: "Picnic Spots", description: "Great places for outdoor dining" },
  
  // Arts, Culture & Learning
  { name: "Museums & Galleries", description: "Art and cultural exhibits" },
  { name: "Live Music", description: "Concerts and local bands" },
  { name: "Theater & Shows", description: "Performances and entertainment" },
  { name: "Local Festivals", description: "Cultural celebrations" },
  { name: "Photography Walks", description: "Capture the city's beauty" },
  { name: "Historical Sites", description: "Learn about local history" },
  { name: "Architecture Tours", description: "Explore unique buildings" },
  { name: "Open Mic Nights", description: "Performance opportunities" },
  
  // Nightlife & Entertainment
  { name: "Nightlife", description: "Bars, clubs, and evening fun" },
  { name: "Rooftop Bars", description: "Drinks with a view" },
  { name: "Live Entertainment", description: "Shows and performances" },
  { name: "Dancing", description: "Dance venues and classes" },
  { name: "Karaoke", description: "Sing your heart out" },
  { name: "Comedy Shows", description: "Stand-up and improv comedy" },
  { name: "Pub Crawls", description: "Explore multiple bars" },
  { name: "Trivia Nights", description: "Test your knowledge" },
  
  // Shopping & Local Exploration
  { name: "Vintage & Thrift", description: "Unique finds and antiques" },
  { name: "Flea Markets", description: "Treasure hunting and bargains" },
  
  // Wellness & Self-Care
  { name: "Spa & Wellness", description: "Relaxation and self-care" },
  { name: "Yoga Classes", description: "Find inner peace" },
  { name: "Meditation Groups", description: "Mindfulness practice" },
  { name: "Massage Therapy", description: "Professional relaxation" },
  { name: "Fitness Centers", description: "Gyms and workout facilities" },
  { name: "Pilates Classes", description: "Core strengthening workouts" },
  
  // Adventure & Unique Experiences
  { name: "Local Tours", description: "Guided city experiences" },
  { name: "Ghost Tours", description: "Spooky historical walks" },
  { name: "Escape Rooms", description: "Puzzle-solving fun" },
  { name: "Local Sports", description: "Watch or play local games" },
  { name: "Scavenger Hunts", description: "City exploration games" },
  { name: "Boat Tours", description: "Water-based sightseeing" },
  
  // Transportation & Getting Around
  { name: "Bike Rentals", description: "Rent bikes for exploration" },
  { name: "Walking Groups", description: "Explore the city on foot" },
  
  
  // Special Interests
  { name: "LGBTQ+ Friendly", description: "Inclusive spaces and events" }
];

// City-specific "ALWAYS" activities for popular destinations
const CITY_ALWAYS_ACTIVITIES = {
  "Los Angeles": [
    // Theme Parks & Major Attractions
    { name: "Disneyland", description: "The original Disney theme park in Anaheim" },
    { name: "Disney California Adventure", description: "Disney's California-themed park" },
    { name: "Knott's Berry Farm", description: "America's first theme park with roller coasters" },
    { name: "Universal Studios Hollywood", description: "Movie theme park and studio tours" },
    { name: "Six Flags Magic Mountain", description: "Thrill ride capital with extreme coasters" },
    
    // Iconic LA Landmarks
    { name: "Hollywood Sign Hike", description: "Iconic hike to the famous Hollywood sign" },
    { name: "Griffith Observatory", description: "Planetarium with Hollywood views" },
    { name: "Getty Center", description: "Art museum with city views and gardens" },
    { name: "Getty Villa", description: "Ancient art in a Roman villa setting" },
    { name: "Walk of Fame", description: "Celebrity stars on Hollywood Boulevard" },
    { name: "TCL Chinese Theatre", description: "Historic movie palace with handprints" },
    { name: "Hollywood Bowl", description: "Outdoor amphitheater for concerts" },
    { name: "Walt Disney Concert Hall", description: "Stunning modern concert venue downtown" },
    { name: "Magic Castle", description: "Private club for magicians and magic shows" },
    
    // Beaches & Coastal Areas
    { name: "Santa Monica Pier", description: "Amusement park pier with ferris wheel" },
    { name: "Venice Beach Boardwalk", description: "Famous beach boardwalk with street performers" },
    { name: "Manhattan Beach", description: "Beautiful beach town with volleyball" },
    { name: "Malibu Beach", description: "Scenic coastal beach and celebrity homes" },
    { name: "Hermosa Beach", description: "Party beach with nightlife and volleyball" },
    { name: "Redondo Beach", description: "Family-friendly beach with pier" },
    { name: "El Segundo Beach", description: "Local beach near LAX" },
    
    // Shopping & Entertainment Districts
    { name: "Rodeo Drive", description: "Luxury shopping in Beverly Hills" },
    { name: "The Grove", description: "Outdoor shopping and entertainment complex" },
    { name: "Third Street Promenade", description: "Shopping and dining in Santa Monica" },
    { name: "Melrose Avenue", description: "Trendy shopping and vintage stores" },
    { name: "Beverly Hills", description: "Upscale area with luxury shopping" },
    { name: "Sunset Strip", description: "Famous nightlife and music venue strip" },
    { name: "LA Live", description: "Entertainment district downtown" },
    { name: "Hollywood & Highland", description: "Shopping complex near Chinese Theatre" },
    
    // Sports Venues
    { name: "Lakers Games", description: "NBA basketball at Crypto.com Arena" },
    { name: "Clippers Games", description: "NBA basketball at Crypto.com Arena" },
    { name: "Kings Games", description: "NHL hockey at Crypto.com Arena" },
    { name: "Dodgers Games", description: "MLB baseball at Dodger Stadium" },
    { name: "Angels Games", description: "MLB baseball in nearby Anaheim" },
    { name: "Rams Games", description: "NFL football at SoFi Stadium" },
    { name: "Chargers Games", description: "NFL football at SoFi Stadium" },
    { name: "LAFC Games", description: "MLS soccer at BMO Stadium" },
    
    // Museums & Culture
    { name: "LACMA", description: "Los Angeles County Museum of Art" },
    { name: "The Broad", description: "Contemporary art museum downtown" },
    { name: "California Science Center", description: "Interactive science museum with Space Shuttle" },
    { name: "Natural History Museum", description: "Dinosaurs and natural specimens" },
    { name: "Museum of Tolerance", description: "Human rights and tolerance education" },
    { name: "Grammy Museum", description: "Music history and interactive exhibits" },
    { name: "Petersen Automotive Museum", description: "Classic and exotic cars" },
    
    // Studios & Entertainment
    { name: "Warner Bros Studio Tour", description: "Behind-the-scenes movie studio tour" },
    { name: "Sony Pictures Studio Tour", description: "TV and movie production tour" },
    { name: "Paramount Pictures Tour", description: "Historic movie studio tours" },
    { name: "Comedy Store", description: "Famous comedy club on Sunset Strip" },
    { name: "Improv Comedy Club", description: "Stand-up comedy venue" },
    
    // Neighborhoods & Areas
    { name: "Little Tokyo", description: "Japanese cultural district downtown" },
    { name: "Chinatown", description: "Historic Chinese cultural area" },
    { name: "Koreatown", description: "Korean cultural district with BBQ and karaoke" },
    { name: "Olvera Street", description: "Historic Mexican marketplace" },
    { name: "Arts District", description: "Hip downtown area with galleries and lofts" },
    { name: "West Hollywood", description: "Trendy area with nightlife and dining" },
    
    // Outdoor & Adventure
    { name: "Runyon Canyon", description: "Popular hiking trail with city views" },
    { name: "Mulholland Drive", description: "Scenic drive with panoramic views" },
    { name: "Bronson Canyon", description: "Hiking trail near Hollywood Sign" },
    { name: "Santa Monica Steps", description: "Famous outdoor staircase workout" },
    { name: "Calabasas Steps", description: "Challenging stair climb with valley views" },
    { name: "Will Rogers State Beach", description: "Beach with volleyball and surfing" },
    { name: "Zuma Beach", description: "Wide sandy beach in Malibu" },
    
    // Unique LA Experiences
    { name: "LA Zoo", description: "Griffith Park zoo with diverse animals" },
    { name: "Aquarium of the Pacific", description: "Large aquarium in Long Beach" },
    { name: "Queen Mary", description: "Historic ocean liner turned hotel/museum" },
    { name: "Farmer's Markets", description: "Original Farmer's Market and others" },
    { name: "Pink's Hot Dogs", description: "Famous LA hot dog stand since 1939" },
    { name: "In-N-Out Burger", description: "California's iconic burger chain" }
  ],
  "Los Angeles Metro": [
    // Theme Parks & Major Attractions
    { name: "Disneyland", description: "The original Disney theme park in Anaheim" },
    { name: "Disney California Adventure", description: "Disney's California-themed park" },
    { name: "Knott's Berry Farm", description: "America's first theme park with roller coasters" },
    { name: "Universal Studios Hollywood", description: "Movie theme park and studio tours" },
    { name: "Six Flags Magic Mountain", description: "Thrill ride capital with extreme coasters" },
    
    // Iconic LA Landmarks
    { name: "Hollywood Sign Hike", description: "Iconic hike to the famous Hollywood sign" },
    { name: "Griffith Observatory", description: "Planetarium with Hollywood views" },
    { name: "Getty Center", description: "Art museum with city views and gardens" },
    { name: "Getty Villa", description: "Ancient art in a Roman villa setting" },
    { name: "Walk of Fame", description: "Celebrity stars on Hollywood Boulevard" },
    { name: "TCL Chinese Theatre", description: "Historic movie palace with handprints" },
    { name: "Hollywood Bowl", description: "Outdoor amphitheater for concerts" },
    { name: "Walt Disney Concert Hall", description: "Stunning modern concert venue downtown" },
    
    // Beaches & Coastal Areas
    { name: "Santa Monica Pier", description: "Amusement park pier with ferris wheel" },
    { name: "Venice Beach Boardwalk", description: "Famous beach boardwalk with street performers" },
    { name: "Manhattan Beach", description: "Beautiful beach town with volleyball" },
    { name: "Malibu Beach", description: "Scenic coastal beach and celebrity homes" },
    { name: "Hermosa Beach", description: "Party beach with nightlife and volleyball" },
    { name: "Redondo Beach", description: "Family-friendly beach with pier" },
    { name: "El Segundo Beach", description: "Local beach near LAX" },
    
    // Shopping & Entertainment Districts
    { name: "Rodeo Drive", description: "Luxury shopping in Beverly Hills" },
    { name: "The Grove", description: "Outdoor shopping and entertainment complex" },
    { name: "Third Street Promenade", description: "Shopping and dining in Santa Monica" },
    { name: "Melrose Avenue", description: "Trendy shopping and vintage stores" },
    { name: "Beverly Hills", description: "Upscale area with luxury shopping" },
    { name: "Sunset Strip", description: "Famous nightlife and music venue strip" },
    { name: "LA Live", description: "Entertainment district downtown" },
    { name: "Hollywood & Highland", description: "Shopping complex near Chinese Theatre" },
    
    // Sports Venues
    { name: "Lakers Games", description: "NBA basketball at Crypto.com Arena" },
    { name: "Clippers Games", description: "NBA basketball at Crypto.com Arena" },
    { name: "Kings Games", description: "NHL hockey at Crypto.com Arena" },
    { name: "Dodgers Games", description: "MLB baseball at Dodger Stadium" },
    { name: "Angels Games", description: "MLB baseball in nearby Anaheim" },
    { name: "Rams Games", description: "NFL football at SoFi Stadium" },
    { name: "Chargers Games", description: "NFL football at SoFi Stadium" },
    { name: "LAFC Games", description: "MLS soccer at BMO Stadium" },
    
    // Museums & Culture
    { name: "LACMA", description: "Los Angeles County Museum of Art" },
    { name: "The Broad", description: "Contemporary art museum downtown" },
    { name: "California Science Center", description: "Interactive science museum with Space Shuttle" },
    { name: "Natural History Museum", description: "Dinosaurs and natural specimens" },
    { name: "Museum of Tolerance", description: "Human rights and tolerance education" },
    { name: "Grammy Museum", description: "Music history and interactive exhibits" },
    { name: "Petersen Automotive Museum", description: "Classic and exotic cars" },
    
    // Studios & Entertainment
    { name: "Warner Bros Studio Tour", description: "Behind-the-scenes movie studio tour" },
    { name: "Sony Pictures Studio Tour", description: "TV and movie production tour" },
    { name: "Paramount Pictures Tour", description: "Historic movie studio tours" },
    { name: "Comedy Store", description: "Famous comedy club on Sunset Strip" },
    { name: "Improv Comedy Club", description: "Stand-up comedy venue" },
    
    // Neighborhoods & Areas
    { name: "Little Tokyo", description: "Japanese cultural district downtown" },
    { name: "Chinatown", description: "Historic Chinese cultural area" },
    { name: "Koreatown", description: "Korean cultural district with BBQ and karaoke" },
    { name: "Olvera Street", description: "Historic Mexican marketplace" },
    { name: "Arts District", description: "Hip downtown area with galleries and lofts" },
    { name: "West Hollywood", description: "Trendy area with nightlife and dining" },
    
    // Outdoor & Adventure
    { name: "Runyon Canyon", description: "Popular hiking trail with city views" },
    { name: "Mulholland Drive", description: "Scenic drive with panoramic views" },
    { name: "Bronson Canyon", description: "Hiking trail near Hollywood Sign" },
    { name: "Santa Monica Steps", description: "Famous outdoor staircase workout" },
    { name: "Calabasas Steps", description: "Challenging stair climb with valley views" },
    { name: "Will Rogers State Beach", description: "Beach with volleyball and surfing" },
    { name: "Zuma Beach", description: "Wide sandy beach in Malibu" },
    
    // Unique LA Experiences
    { name: "LA Zoo", description: "Griffith Park zoo with diverse animals" },
    { name: "Aquarium of the Pacific", description: "Large aquarium in Long Beach" },
    { name: "Queen Mary", description: "Historic ocean liner turned hotel/museum" },
    { name: "Farmer's Markets", description: "Original Farmer's Market and others" },
    { name: "Pink's Hot Dogs", description: "Famous LA hot dog stand since 1939" },
    { name: "In-N-Out Burger", description: "California's iconic burger chain" }
  ],
  
  "New York City": [
    // Iconic Landmarks
    { name: "Statue of Liberty", description: "Iconic symbol of freedom and democracy" },
    { name: "Empire State Building", description: "Art Deco skyscraper with observation deck" },
    { name: "Times Square", description: "Bright lights and Broadway theaters" },
    { name: "Central Park", description: "Massive urban park with lakes and trails" },
    { name: "Brooklyn Bridge", description: "Historic bridge with pedestrian walkway" },
    { name: "One World Trade Center", description: "Memorial and observation deck" },
    { name: "High Line", description: "Elevated park built on old railway" },
    { name: "Top of the Rock", description: "Observation deck with Empire State views" },
    { name: "Manhattan Bridge", description: "Classic views of Brooklyn Bridge" },
    { name: "Flatiron Building", description: "Iconic triangular skyscraper" },
    { name: "Chrysler Building", description: "Art Deco architectural masterpiece" },
    
    // Museums & Culture
    { name: "Metropolitan Museum", description: "World-class art from ancient to modern" },
    { name: "Museum of Modern Art", description: "Premier modern and contemporary art" },
    { name: "Guggenheim Museum", description: "Spiral architecture and modern art" },
    { name: "9/11 Memorial", description: "Moving tribute to September 11 victims" },
    { name: "American Museum of Natural History", description: "Dinosaurs and planetarium" },
    { name: "Brooklyn Museum", description: "Contemporary and ancient art collections" },
    { name: "Tenement Museum", description: "Immigrant history on Lower East Side" },
    { name: "Frick Collection", description: "Gilded Age mansion with fine art" },
    
    // Broadway & Entertainment
    { name: "Broadway Shows", description: "World-famous theater district" },
    { name: "Lincoln Center", description: "Opera, ballet, and classical music" },
    { name: "Madison Square Garden", description: "Concerts and sports venue" },
    { name: "Apollo Theater", description: "Historic Harlem music venue" },
    { name: "Radio City Music Hall", description: "Art Deco venue and Rockettes" },
    { name: "Comedy Cellar", description: "Famous comedy club in Greenwich Village" },
    
    // Neighborhoods
    { name: "Chinatown", description: "Authentic Chinese culture and food" },
    { name: "Little Italy", description: "Italian restaurants and culture" },
    { name: "SoHo Shopping", description: "Trendy boutiques and art galleries" },
    { name: "Greenwich Village", description: "Bohemian neighborhood with cafes" },
    { name: "Wall Street", description: "Financial district and Stock Exchange" },
    { name: "Williamsburg", description: "Hip Brooklyn area with artisanal everything" },
    { name: "DUMBO", description: "Brooklyn waterfront with Manhattan views" },
    { name: "East Village", description: "Eclectic nightlife and dining scene" },
    { name: "Meatpacking District", description: "Trendy area with High Line entrance" },
    
    // Food & Markets
    { name: "Chelsea Market", description: "Indoor food hall and shopping" },
    { name: "Smorgasburg", description: "Weekend food market in Brooklyn" },
    { name: "Katz's Delicatessen", description: "Famous pastrami sandwiches since 1888" },
    { name: "Pizza Tours", description: "Authentic NYC pizza experiences" },
    { name: "Russ & Daughters", description: "Century-old appetizing shop" },
    { name: "Union Square Market", description: "Farmers market and local vendors" },
    
    // Sports & Entertainment
    { name: "Yankees Games", description: "Baseball at iconic Yankee Stadium" },
    { name: "Mets Games", description: "Baseball at Citi Field in Queens" },
    { name: "Knicks Games", description: "NBA basketball at Madison Square Garden" },
    { name: "Brooklyn Nets", description: "NBA basketball at Barclays Center" },
    { name: "Rangers Games", description: "NHL hockey at Madison Square Garden" },
    
    // Unique NYC Experiences
    { name: "Staten Island Ferry", description: "Free ferry with Statue of Liberty views" },
    { name: "Coney Island", description: "Historic boardwalk and amusement park" },
    { name: "Roosevelt Island Tram", description: "Aerial views of Manhattan" },
    { name: "New York Public Library", description: "Iconic library with reading rooms" }
  ],
  
  "Miami": [
    // Beaches & Coastal
    { name: "South Beach", description: "Art Deco architecture and nightlife" },
    { name: "Miami Beach", description: "White sand beaches and turquoise water" },
    { name: "Ocean Drive", description: "Iconic strip with hotels and restaurants" },
    { name: "Key Biscayne", description: "Tropical island with pristine beaches" },
    { name: "Bayside Marketplace", description: "Waterfront shopping and dining" },
    { name: "Bal Harbour Shops", description: "Luxury shopping by the beach" },
    { name: "Crandon Park Beach", description: "Family-friendly beach on Key Biscayne" },
    { name: "Haulover Beach", description: "Clothing-optional beach and sandbar" },
    
    // Arts & Culture
    { name: "Art Basel Miami", description: "World-renowned art fair (seasonal)" },
    { name: "Wynwood Walls", description: "Outdoor street art museum" },
    { name: "Vizcaya Museum", description: "European-style mansion and gardens" },
    { name: "Pérez Art Museum", description: "Contemporary art with bay views" },
    { name: "Bass Museum", description: "Contemporary art in Miami Beach" },
    { name: "Frost Museum", description: "Science museum with planetarium and aquarium" },
    { name: "Little Haiti", description: "Vibrant Haitian culture and art" },
    
    // Neighborhoods
    { name: "Little Havana", description: "Cuban culture, cigars, and cafés" },
    { name: "Design District", description: "Luxury shopping and modern art" },
    { name: "Brickell", description: "Modern skyline and rooftop bars" },
    { name: "Coconut Grove", description: "Bohemian village with waterfront dining" },
    { name: "Coral Gables", description: "Mediterranean architecture and upscale dining" },
    { name: "Aventura", description: "Shopping and high-end residential area" },
    { name: "Midtown Miami", description: "Art galleries and trendy restaurants" },
    
    // Nightlife & Entertainment
    { name: "LIV Nightclub", description: "World-famous club at Fontainebleau" },
    { name: "Rooftop Bars", description: "Sky-high views of the city and ocean" },
    { name: "Lincoln Road", description: "Pedestrian mall with dining and shopping" },
    { name: "Story Nightclub", description: "High-energy dance club in South Beach" },
    { name: "Ball & Chain", description: "Historic Little Havana bar with live music" },
    { name: "Mango's Tropical Cafe", description: "South Beach entertainment and dancing" },
    
    // Sports & Activities
    { name: "Miami Heat Games", description: "NBA basketball at FTX Arena" },
    { name: "Miami Dolphins Games", description: "NFL football at Hard Rock Stadium" },
    { name: "Inter Miami CF", description: "MLS soccer with Lionel Messi" },
    { name: "Jet Ski Rentals", description: "Explore Biscayne Bay by jet ski" },
    { name: "Deep Sea Fishing", description: "Charter boats for sport fishing" },
    
    // Unique Experiences
    { name: "Everglades Tours", description: "Airboat rides through unique ecosystem" },
    { name: "Cuban Coffee", description: "Authentic cafecito in Little Havana" },
    { name: "Art Deco Tours", description: "Guided tours of architectural gems" },
    { name: "Boat Tours", description: "See celebrity homes from the water" },
    { name: "Zoo Miami", description: "Large zoo with tropical animals" },
    { name: "Jungle Island", description: "Interactive zoo and adventure park" }
  ],
  
  "Chicago": [
    // Architecture & Landmarks
    { name: "Millennium Park", description: "Cloud Gate sculpture and outdoor concerts" },
    { name: "Navy Pier", description: "Entertainment complex with ferris wheel" },
    { name: "Willis Tower Skydeck", description: "Glass boxes 103 floors up" },
    { name: "Architecture Boat Tour", description: "See skyline from Chicago River" },
    { name: "The Bean", description: "Iconic Cloud Gate sculpture" },
    { name: "Tribune Tower", description: "Gothic Revival skyscraper with artifacts" },
    { name: "Wrigley Building", description: "Iconic white terra cotta towers" },
    { name: "Marina City", description: "Unique corncob-shaped towers" },
    { name: "Chicago Riverwalk", description: "Waterfront promenade with dining" },
    
    // Museums & Culture
    { name: "Art Institute of Chicago", description: "World-class art collection" },
    { name: "Field Museum", description: "Natural history and Sue the T-Rex" },
    { name: "Shedd Aquarium", description: "Aquatic life from around the world" },
    { name: "Museum of Science and Industry", description: "Interactive science exhibits" },
    { name: "Chicago History Museum", description: "City's past from Great Fire to present" },
    { name: "National Museum of Mexican Art", description: "Largest Mexican art collection in US" },
    { name: "Contemporary Art Museum", description: "Cutting-edge contemporary works" },
    
    // Food Scene
    { name: "Deep Dish Pizza", description: "Chicago's famous thick-crust pizza" },
    { name: "Italian Beef", description: "Iconic Chicago sandwich" },
    { name: "Hot Dogs", description: "Chicago-style with all the fixings" },
    { name: "Garrett Popcorn", description: "Gourmet popcorn shop" },
    { name: "Polish Boy", description: "Polish sausage with all the toppings" },
    { name: "Portillo's", description: "Chicago-style fast food chain" },
    { name: "Alinea", description: "Molecular gastronomy fine dining" },
    { name: "Chicago Food Tours", description: "Guided culinary neighborhood tours" },
    
    // Sports
    { name: "Cubs Games", description: "Baseball at historic Wrigley Field" },
    { name: "White Sox Games", description: "Baseball on the South Side" },
    { name: "Bulls Games", description: "NBA basketball at United Center" },
    { name: "Blackhawks Games", description: "NHL hockey at United Center" },
    { name: "Bears Games", description: "NFL football at Soldier Field" },
    { name: "Chicago Fire", description: "MLS soccer at Soldier Field" },
    
    // Neighborhoods & Areas
    { name: "Lincoln Park Zoo", description: "Free zoo in beautiful park" },
    { name: "Wicker Park", description: "Hip neighborhood with vintage shops" },
    { name: "The Loop", description: "Downtown area with elevated trains" },
    { name: "Magnificent Mile", description: "Premier shopping on Michigan Avenue" },
    { name: "Old Town", description: "Historic area with comedy clubs" },
    { name: "River North", description: "Gallery district and nightlife" },
    { name: "Chinatown", description: "Authentic Chinese culture and dim sum" },
    
    // Entertainment & Nightlife
    { name: "Second City", description: "Famous improv comedy theater" },
    { name: "Chicago Theatre", description: "Historic venue with iconic marquee" },
    { name: "Green Mill Cocktail Lounge", description: "Historic jazz club Al Capone frequented" },
    { name: "House of Blues", description: "Live music venue and restaurant" }
  ],
  
  "Las Vegas": [
    // The Strip
    { name: "Bellagio Fountains", description: "Musical water show every 15 minutes" },
    { name: "Fremont Street", description: "LED canopy and street performers" },
    { name: "High Roller", description: "World's largest observation wheel" },
    { name: "Vegas Strip Walk", description: "Iconic boulevard with themed hotels" },
    { name: "Venetian Gondola Rides", description: "Indoor gondola rides with singing gondoliers" },
    { name: "Mirage Volcano", description: "Erupting volcano show nightly" },
    { name: "Caesars Palace Forum Shops", description: "Luxury shopping with moving statues" },
    { name: "Paris Las Vegas Eiffel Tower", description: "Half-scale replica with observation deck" },
    
    // Shows & Entertainment
    { name: "Cirque du Soleil", description: "Acrobatic performances at multiple venues" },
    { name: "Magic Shows", description: "World-class magicians and illusionists" },
    { name: "Headliner Concerts", description: "A-list performers in residency" },
    { name: "Comedy Shows", description: "Stand-up comedy at various venues" },
    { name: "Blue Man Group", description: "Multimedia theatrical experience" },
    { name: "Le Rêve", description: "Aquatic show at Wynn Las Vegas" },
    { name: "Tournament of Kings", description: "Medieval dinner show at Excalibur" },
    
    // Casinos & Gaming
    { name: "Casino Gaming", description: "Slot machines, poker, and table games" },
    { name: "Poker Tournaments", description: "World Series of Poker events" },
    { name: "Sports Betting", description: "Bet on games at sportsbooks" },
    { name: "Baccarat", description: "High-stakes card game for VIPs" },
    { name: "Craps Tables", description: "Exciting dice game with crowds" },
    
    // Unique Experiences
    { name: "Grand Canyon Tours", description: "Day trips to natural wonder" },
    { name: "Hoover Dam", description: "Engineering marvel and tours" },
    { name: "Red Rock Canyon", description: "Scenic drive and hiking trails" },
    { name: "Neon Museum", description: "Vintage Vegas signs and history" },
    { name: "Valley of Fire", description: "Ancient red rock formations" },
    { name: "Lake Mead", description: "Largest reservoir in the US" },
    { name: "Area 51 Tours", description: "UFO and alien-themed experiences" },
    { name: "Helicopter Tours", description: "Aerial views of Strip and Grand Canyon" },
    
    // Dining & Nightlife
    { name: "Celebrity Chef Restaurants", description: "Gordon Ramsay, Wolfgang Puck, etc." },
    { name: "Buffets", description: "All-you-can-eat dining experiences" },
    { name: "Rooftop Pools", description: "Dayclub pool parties with DJs" },
    { name: "Nightclubs", description: "World-famous DJs and dancing" },
    { name: "XS Nightclub", description: "Poolside nightclub at Encore" },
    { name: "Omnia", description: "Multi-level club at Caesars Palace" },
    { name: "Hakkasan", description: "Upscale nightclub and restaurant" },
    
    // Sports & Activities
    { name: "Golden Knights Games", description: "NHL hockey at T-Mobile Arena" },
    { name: "Raiders Games", description: "NFL football at Allegiant Stadium" },
    { name: "Golf Courses", description: "Championship courses in the desert" },
    { name: "Race Car Driving", description: "Drive supercars at Las Vegas Motor Speedway" }
  ],
  
  "Austin": [
    // Music Scene
    { name: "Live Music Venues", description: "Keep Austin Weird with live music" },
    { name: "South by Southwest", description: "SXSW music and tech festival (March)" },
    { name: "Austin City Limits", description: "Music festival in Zilker Park (October)" },
    { name: "Red River District", description: "Dive bars and indie music venues" },
    { name: "The Continental Club", description: "Historic music venue since 1955" },
    { name: "Antone's", description: "Home of the Blues since 1975" },
    { name: "Stubb's Bar-B-Q", description: "BBQ and outdoor concerts" },
    { name: "The Saxon Pub", description: "Intimate songwriters' venue" },
    { name: "Moody Theater", description: "Austin City Limits TV show tapings" },
    
    // Food Scene
    { name: "Food Trucks", description: "Gourmet food from mobile vendors" },
    { name: "BBQ Joints", description: "Franklin Barbecue and other pitmasters" },
    { name: "Breakfast Tacos", description: "Austin's morning staple" },
    { name: "Craft Breweries", description: "Local beer scene and tours" },
    { name: "Salt Lick BBQ", description: "Legendary BBQ pit in Driftwood" },
    { name: "Amy's Ice Cream", description: "Local ice cream with trick scooping" },
    { name: "Torchy's Tacos", description: "Damn good tacos born in Austin" },
    { name: "South Lamar Food Scene", description: "Trendy restaurants and food trailers" },
    
    // Outdoor Activities
    { name: "Zilker Park", description: "Large park with trails and festivals" },
    { name: "Lady Bird Lake", description: "Kayaking and paddleboarding" },
    { name: "Barton Springs Pool", description: "Natural spring-fed swimming pool" },
    { name: "Austin Bat Bridge", description: "Largest urban bat colony" },
    { name: "Mount Bonnell", description: "Highest point with city views" },
    { name: "Hamilton Pool", description: "Natural swimming hole with waterfall" },
    { name: "Jacob's Well", description: "Natural spring and swimming hole" },
    { name: "Kayak Rentals", description: "Paddle the Colorado River" },
    
    // Neighborhoods
    { name: "Sixth Street", description: "Historic entertainment district" },
    { name: "Rainey Street", description: "Historic homes turned into bars" },
    { name: "East Austin", description: "Hip area with galleries and restaurants" },
    { name: "The Domain", description: "Upscale shopping and dining" },
    { name: "South Congress", description: "SoCo shopping and dining strip" },
    { name: "West Lake Hills", description: "Upscale area with lake views" },
    { name: "Mueller", description: "Sustainable neighborhood development" },
    
    // Arts & Culture
    { name: "Blanton Museum", description: "Contemporary art at UT campus" },
    { name: "Bullock History Museum", description: "Story of Texas history" },
    { name: "Austin Murals", description: "Iconic street art and photo spots" },
    { name: "LBJ Presidential Library", description: "36th president's archives" },
    
    // Unique Austin
    { name: "Keep Austin Weird", description: "Embrace the city's quirky culture" },
    { name: "Texas State Capitol", description: "Free tours of government building" },
    { name: "University of Texas", description: "Campus tours and Longhorn sports" },
    { name: "Eeyore's Birthday Party", description: "Annual spring festival in Pease Park" },
    { name: "Austin Ghost Tours", description: "Haunted history walking tours" }
  ],

  "Dublin": [
    // Historic & Cultural
    { name: "Trinity College & Book of Kells", description: "Medieval manuscript in historic library" },
    { name: "Dublin Castle", description: "13th-century castle and government buildings" },
    { name: "Guinness Storehouse", description: "Seven floors of Guinness history and tastings" },
    { name: "Jameson Distillery Bow St.", description: "Irish whiskey distillery tour and tasting" },
    { name: "Kilmainham Gaol", description: "Historic prison with Irish revolutionary history" },
    { name: "Christ Church Cathedral", description: "Medieval cathedral with crypt and exhibitions" },
    { name: "St. Patrick's Cathedral", description: "National cathedral of Ireland" },
    { name: "National Gallery of Ireland", description: "Irish and European art collections" },
    
    // Neighborhoods
    { name: "Temple Bar", description: "Cultural quarter with pubs and cobblestone streets" },
    { name: "Grafton Street", description: "Premier shopping street with street performers" },
    { name: "O'Connell Street", description: "Main thoroughfare with monuments and shops" },
    { name: "Smithfield", description: "Historic market area with modern developments" },
    { name: "Georgian Dublin", description: "18th-century architecture around squares" },
    { name: "Docklands", description: "Modern riverside development with tech companies" },
    
    // Pubs & Nightlife
    { name: "Traditional Irish Pubs", description: "Authentic pubs with live music" },
    { name: "Brazen Head", description: "Ireland's oldest pub since 1198" },
    { name: "The Long Hall", description: "Victorian pub with ornate interior" },
    { name: "Kehoe's", description: "Traditional pub with original features" },
    { name: "The Cobblestone", description: "Traditional music sessions" },
    { name: "Live Music Sessions", description: "Spontaneous traditional Irish music" },
    
    // Parks & Outdoors
    { name: "Phoenix Park", description: "One of Europe's largest enclosed parks" },
    { name: "St. Stephen's Green", description: "Victorian park in city center" },
    { name: "Dublin Bay", description: "Coastal walks and swimming" },
    { name: "Howth Cliff Walk", description: "Scenic coastal hiking trail" },
    { name: "Wicklow Mountains", description: "Day trip to 'Garden of Ireland'" },
    { name: "Bull Island", description: "UNESCO biosphere reserve" },
    
    // Food & Drink
    { name: "Irish Breakfast", description: "Full traditional Irish breakfast experience" },
    { name: "Fish & Chips", description: "Classic Irish comfort food" },
    { name: "Irish Stew", description: "Traditional lamb and vegetable stew" },
    { name: "Coddle", description: "Dublin's traditional sausage and bacon dish" },
    { name: "Boxty", description: "Traditional Irish potato pancake" },
    { name: "Dublin Food Tours", description: "Guided culinary experiences" },
    
    // Day Trips
    { name: "Cliffs of Moher", description: "Dramatic Atlantic coast cliffs (day trip)" },
    { name: "Glendalough", description: "Ancient monastic site in Wicklow" },
    { name: "Newgrange", description: "5,000-year-old passage tomb" },
    { name: "Powerscourt Estate", description: "Historic house and gardens" },
    { name: "Malahide Castle", description: "Medieval castle with gardens" }
  ]
};

interface MatchInCityProps {
  cityName?: string;
}

export default function MatchInCity({ cityName }: MatchInCityProps) {
  const [location, setLocation] = useLocation();
  // Properly capitalize city name (e.g., "dublin" -> "Dublin")
  const normalizedCityName = cityName ? cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase() : '';
  const [selectedCity, setSelectedCity] = useState<string>(normalizedCityName || '');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editActivityDescription, setEditActivityDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [cityActivities, setCityActivities] = useState<any[]>([]);
  const [cityEvents, setCityEvents] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [forceShowCity, setForceShowCity] = useState<boolean>(!!cityName); // Force show specific city when passed as prop
  const { toast } = useToast();
  const { user: authUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Get user data from localStorage (same as other working components)
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('travelconnect_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  
  const user = getUserData() || authUser;
  

  const [allCities, setAllCities] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Lazy loading state management for heavy sections
  const [loadedSections, setLoadedSections] = useState(new Set<string>());

  // Handle loading specific sections on demand
  const handleSectionView = async (sectionName: string) => {
    if (loadedSections.has(sectionName)) return; // Already loaded
    
    setLoadedSections(prev => new Set(prev).add(sectionName));
    
    // Load the appropriate data based on section
    switch (sectionName) {
      case 'activities':
        await fetchCityActivities();
        await fetchUserActivities();
        break;
      case 'events':
        await fetchCityEvents();
        await fetchUserEvents();
        break;
      case 'people':
        await fetchMatchingUsers();
        break;
    }
  };

  // Fetch all cities on component mount
  useEffect(() => {
    fetchAllCities();
  }, []);

  // Load essential data when city is selected
  useEffect(() => {
    if (selectedCity) {
      console.log('🎯 CITY SELECTED:', selectedCity);
      console.log('🎯 FETCHING ESSENTIAL DATA FOR CITY:', selectedCity);
      // Load essential data immediately
      fetchConnections();
      fetchCityActivities();
      fetchUserActivities();
      fetchCityEvents();
      fetchUserEvents();
    }
  }, [selectedCity]);

  const fetchConnections = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`/api/connections/${currentUser.id}`);
      if (response.ok) {
        const connections = await response.json();
        setConnections(connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // Check if a city is in LA area for enhanced prominence
  const isLAAreaCity = (cityName: string, stateName: string) => {
    const laMetroCities = [
      'Los Angeles', 'Santa Monica', 'Venice', 'Venice Beach', 'Beverly Hills', 
      'West Hollywood', 'Hollywood', 'Pasadena', 'Burbank', 'Glendale', 'Long Beach',
      'Manhattan Beach', 'El Segundo', 'Culver City', 'Marina del Rey', 'Redondo Beach'
    ];
    // Check if it's a LA metro city, regardless of state field (some entries have empty state)
    const isLAMetroCity = laMetroCities.some(city => city.toLowerCase() === cityName.toLowerCase());
    
    // Return true if it's a LA metro city AND either state is California OR state is empty (for database entries with missing state)
    return isLAMetroCity && (
      stateName?.toLowerCase() === 'california' || 
      !stateName || 
      stateName === ''
    );
  };

  // Filter cities based on search with LA prioritization
  useEffect(() => {
    let filtered = allCities;
    
    if (citySearchTerm) {
      filtered = allCities.filter(city => 
        city.city.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(citySearchTerm.toLowerCase())
      );
    }
    
    // Sort with LA area cities first, then by user count
    const sorted = filtered.sort((a, b) => {
      const aIsLA = isLAAreaCity(a.city, a.state);
      const bIsLA = isLAAreaCity(b.city, b.state);
      
      // LA cities first
      if (aIsLA && !bIsLA) return -1;
      if (!aIsLA && bIsLA) return 1;
      
      // Then by user count
      return (b.userCount || 0) - (a.userCount || 0);
    });
    
    setFilteredCities(sorted);
  }, [citySearchTerm, allCities]);

  // Removed city photos functionality to improve performance

  const fetchAllCities = async () => {
    setCitiesLoading(true);
    try {
      const response = await fetch('/api/city-stats');
      if (response.ok) {
        const cities = await response.json();
        // Consolidate NYC variations and add gradient colors
        const consolidatedCities = cities.map((city: any, index: number) => {
          // Consolidate NYC variations
          let cityName = city.city;
          if (['NYC', 'Manhattan', 'New York', 'New york city', 'NYC', 'nyc'].includes(cityName)) {
            cityName = 'New York City';
          }

          // Dynamic gradient colors with more variety
          const gradients = [
            'from-orange-400 via-red-500 to-purple-600',
            'from-blue-400 via-purple-500 to-indigo-600', 
            'from-yellow-400 via-orange-500 to-red-600',
            'from-gray-400 via-blue-500 to-purple-600',
            'from-red-400 via-orange-500 to-yellow-600',
            'from-green-400 via-blue-500 to-purple-600',
            'from-indigo-400 via-purple-500 to-pink-600',
            'from-teal-400 via-cyan-500 to-blue-600',
            'from-purple-400 via-pink-500 to-red-600',
            'from-emerald-400 via-teal-500 to-cyan-600',
            'from-purple-400 via-indigo-500 to-blue-600',
            'from-teal-400 via-blue-500 to-indigo-600',
            'from-cyan-400 via-blue-500 to-purple-600'
          ];

          return {
            ...city,
            city: cityName,
            gradient: gradients[index % gradients.length],
            image: city.photoUrl || `https://images.unsplash.com/photo-${1500000000 + (index * 1000)}?auto=format&fit=crop&w=800&q=80`
          };
        });

        // Remove duplicates (in case of NYC consolidation) and filter out test cities
        const uniqueCities = consolidatedCities.reduce((acc: any[], current: any) => {
          const exists = acc.find(city => 
            city.city.toLowerCase() === current.city.toLowerCase() && 
            city.state.toLowerCase() === current.state.toLowerCase()
          );
          // Filter out test cities and global entries
          const isTestCity = ['test city', 'global'].includes(current.city.toLowerCase());
          if (!exists && !isTestCity) {
            acc.push(current);
          }
          return acc;
        }, []);

        setAllCities(uniqueCities);
        setFilteredCities(uniqueCities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setCitiesLoading(false);
    }
  };

  const fetchCityActivities = async () => {
    try {
      // Start with universal activities for instant loading
      const universalActivitiesFormatted = UNIVERSAL_ACTIVITIES.map((activity, index) => ({
        id: `universal-${index}`,
        name: activity.name,
        description: activity.description,
        cityName: selectedCity,
        isUniversal: true
      }));
      
      // Add city-specific "always" activities if they exist
      const cityAlwaysActivities = CITY_ALWAYS_ACTIVITIES[selectedCity as keyof typeof CITY_ALWAYS_ACTIVITIES] || [];
      const cityAlwaysFormatted = cityAlwaysActivities.map((activity, index) => ({
        id: `always-${selectedCity}-${index}`,
        name: activity.name,
        description: activity.description,
        cityName: selectedCity,
        isCityAlways: true
      }));
      
      // Combine universal + city always activities for immediate display
      const immediateActivities = [...universalActivitiesFormatted, ...cityAlwaysFormatted];
      setCityActivities(immediateActivities);
      
      // Then fetch AI-generated city-specific activities and merge
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const aiCityActivities = await response.json();
        
        // Combine all activities, avoiding duplicates
        const allActivities = [
          ...universalActivitiesFormatted,
          ...cityAlwaysFormatted,
          ...aiCityActivities.filter((aiActivity: any) => {
            // Check against universal activities
            const isDuplicateUniversal = UNIVERSAL_ACTIVITIES.some(universal => 
              universal.name.toLowerCase() === aiActivity.name.toLowerCase()
            );
            // Check against city always activities
            const isDuplicateAlways = cityAlwaysActivities.some(always => 
              always.name.toLowerCase() === aiActivity.name.toLowerCase()
            );
            return !isDuplicateUniversal && !isDuplicateAlways;
          })
        ];
        
        setCityActivities(allActivities);
      }
    } catch (error) {
      console.error('Error fetching city activities:', error);
      // If API fails, at least show universal + city always activities
      const universalActivitiesFormatted = UNIVERSAL_ACTIVITIES.map((activity, index) => ({
        id: `universal-${index}`,
        name: activity.name,
        description: activity.description,
        cityName: selectedCity,
        isUniversal: true
      }));
      
      const cityAlwaysActivities = CITY_ALWAYS_ACTIVITIES[selectedCity as keyof typeof CITY_ALWAYS_ACTIVITIES] || [];
      const cityAlwaysFormatted = cityAlwaysActivities.map((activity, index) => ({
        id: `always-${selectedCity}-${index}`,
        name: activity.name,
        description: activity.description,
        cityName: selectedCity,
        isCityAlways: true
      }));
      
      setCityActivities([...universalActivitiesFormatted, ...cityAlwaysFormatted]);
    }
  };

  const fetchUserActivities = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      console.log('No user available - skipping fetchUserActivities');
      setUserActivities([]);
      return;
    }
    const userId = currentUser.id;
    console.log('Fetching activities for user ID:', userId);

    try {
      const response = await fetch(`/api/user-city-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const activities = await response.json();
        setUserActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
      setUserActivities([]);
    }
  };

  const fetchCityEvents = async () => {
    try {
      const response = await fetch(`/api/events?city=${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const events = await response.json();
        setCityEvents(events);
      }
    } catch (error) {
      console.error('Error fetching city events:', error);
    }
  };

  const fetchUserEvents = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      console.log('No user available - skipping fetchUserEvents');
      setUserEvents([]);
      return;
    }
    const userId = currentUser.id;
    console.log('Fetching events for user ID:', userId);
    try {
      const response = await fetch(`/api/user-event-interests/${userId}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const events = await response.json();
        setUserEvents(events);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
      setUserEvents([]);
    }
  };

  const fetchMatchingUsers = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`/api/city-matches/${currentUser.id}/${encodeURIComponent(selectedCity)}`);
      if (response.ok) {
        const matches = await response.json();
        setMatchingUsers(matches);
      }
    } catch (error) {
      console.error('Error fetching matching users:', error);
    }
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide activity name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentUser = getUserData();
      if (!currentUser?.id) {
        toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
        return;
      }
      const userId = currentUser.id;

      const response = await fetch('/api/city-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          cityName: selectedCity,
          state: allCities.find(c => c.city === selectedCity)?.state || '',
          country: allCities.find(c => c.city === selectedCity)?.country || '',
          activityName: newActivityName,
          category: 'general',
          description: newActivityDescription || 'User added activity',
          createdByUserId: userId
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        toast({
          title: "Activity Added",
          description: "Your activity has been added successfully!",
        });
        setNewActivityName('');
        setNewActivityDescription('');
        setShowAddForm(false);
        fetchCityActivities();
        
        // Automatically add the new activity to user's personal list since they created it
        await toggleActivity(newActivity);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  const toggleActivity = async (activity: any) => {
    const currentUser = getUserData();
    console.log('🔍 Toggle Activity Debug:', { currentUser, activity, selectedCity });
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    const isCurrentlyActive = userActivities.some(ua => ua.activityId === activity.id);
    console.log('🎯 Activity state check:', { 
      activityId: activity.id, 
      isCurrentlyActive,
      userActivitiesCount: userActivities.length,
      userActivities: userActivities.map(ua => ({ id: ua.id, activityId: ua.activityId, activityName: ua.activityName }))
    });

    try {
      if (isCurrentlyActive) {
        // Find the correct user activity interest record ID
        const userActivityRecord = userActivities.find(ua => ua.activityId === activity.id);
        if (!userActivityRecord) {
          toast({ title: 'Error', description: 'Could not find activity record', variant: 'destructive' });
          return;
        }
        
        // Remove activity using the user interest record ID, not the activity ID
        const response = await fetch(`/api/user-city-interests/${userActivityRecord.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        if (response.ok) {
          toast({
            title: "Interest Removed",
            description: `Removed interest in ${activity.activityName}`,
          });
          // Immediately update local state
          setUserActivities(prev => prev.filter(ua => ua.activityId !== activity.id));
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      } else {
        // Add activity
        console.log('🚀 Making POST request with:', {
          activityId: activity.id,
          cityName: selectedCity,
          userId: userId.toString()
        });
        
        const response = await fetch('/api/user-city-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            activityId: activity.id,
            cityName: selectedCity
          })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok || response.status === 409) {
          // Handle both successful creation (200) and already exists (409) cases
          const newInterest = await response.json();
          toast({
            title: "Interest Added",
            description: `Added interest in ${activity.activityName}`,
          });
          // Immediately update local state - check if already exists first
          setUserActivities(prev => {
            const alreadyExists = prev.some(ua => ua.activityId === activity.id);
            console.log('🔄 Adding to state:', { alreadyExists, newInterest, activityId: activity.id });
            if (alreadyExists) {
              console.log('⚠️ Activity already exists, not adding to state');
              return prev; // No need to add again
            }
            console.log('✅ Adding new activity to state');
            return [...prev, newInterest];
          });
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/user-city-interests/${userId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        } else {
          // Handle error case
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast({
            title: "Error",
            description: errorData.error || `Failed to add interest in ${activity.activityName}`,
            variant: "destructive",
          });
          // Refresh user activities from server to ensure accurate state
          fetchUserActivities();
        }
      }
      fetchMatchingUsers();
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update activity interest",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (activityId: number) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    if (!confirm('Are you sure you want to delete this activity? This will remove it for everyone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/city-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId.toString()
        }
      });

      if (response.ok) {
        toast({
          title: "Activity Deleted",
          description: "Activity has been removed successfully",
        });
        // Immediately update local state
        setCityActivities(prev => prev.filter(activity => activity.id !== activityId));
        setUserActivities(prev => prev.filter(ua => ua.activityId !== activityId));
        fetchMatchingUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const updateActivity = async () => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;

    if (!editingActivity) {
      return;
    }

    try {
      const response = await fetch(`/api/city-activities/${editingActivity.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({
          activityName: editActivityName,
          description: editActivityDescription
        })
      });



      if (response.ok) {
        const updatedActivity = await response.json();


        toast({
          title: "Activity Updated",
          description: `Updated "${editingActivity.activityName}" to "${editActivityName}"`,
        });

        // Immediately update local state
        setCityActivities(prev => prev.map(activity => 
          activity.id === editingActivity.id 
            ? { ...activity, activityName: editActivityName, description: editActivityDescription }
            : activity
        ));

        // Clear edit form
        setEditingActivity(null);
        setEditActivityName('');
        setEditActivityDescription('');


      } else {
        const error = await response.json();

        toast({
          title: "Error",
          description: error.error || "Failed to update activity",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
    }
  };

  const enhanceCityWithMoreActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/city-activities/${encodeURIComponent(selectedCity)}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserData()?.id?.toString() || '0'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Activities Enhanced!",
          description: `Added ${result.addedActivities} new AI-generated activities to ${selectedCity}`,
        });
        
        // Refresh the city activities
        fetchCityActivities();
      } else {
        const error = await response.json();
        toast({
          title: "Enhancement Failed",
          description: error.error || "Failed to enhance city activities",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enhance city activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isActivityActive = (activityId: number) => {
    return userActivities.some(ua => ua.activityId === activityId);
  };

  const isEventActive = (eventId: number) => {
    return userEvents.some(ue => ue.eventId === eventId);
  };

  const toggleEvent = async (event: any) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;
    const isCurrentlyActive = userEvents.some(ue => ue.eventId === event.id);

    try {
      if (isCurrentlyActive) {
        // Remove event interest
        const response = await fetch(`/api/user-event-interests/${event.id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString()
          }
        });
        if (response.ok) {
          toast({
            title: "Event Interest Removed",
            description: `Removed interest in ${event.title}`,
          });
          setUserEvents(prev => prev.filter(ue => ue.eventId !== event.id));
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      } else {
        // Add event interest
        const response = await fetch('/api/user-event-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString()
          },
          body: JSON.stringify({
            eventId: event.id,
            cityName: selectedCity
          })
        });
        if (response.ok) {
          const newInterest = await response.json();
          toast({
            title: "Event Interest Added",
            description: `Added interest in ${event.title}`,
          });
          setUserEvents(prev => [...prev, newInterest]);
          // Invalidate profile queries to refresh "Things I Want to Do"
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/all-events`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        }
      }
      fetchMatchingUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event interest",
        variant: "destructive",
      });
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const joinEvent = async (eventId: number) => {
    const currentUser = getUserData();
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'Please refresh the page', variant: 'destructive' });
      return;
    }
    const userId = currentUser.id;
    
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          notes: "Looking forward to attending!"
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You've successfully joined the event",
        });
        // Also add to event interests if not already added
        toggleEvent(selectedEvent);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to join event",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      });
    }
  };

  const handleCustomCitySearch = async (cityName: string) => {
    setSearchingCity(true);
    setSearchError('');
    
    try {
      // Set the city immediately to show the city page
      setSelectedCity(cityName);
      setCitySearchTerm(''); // Clear after setting the city
      
      // Check if the city has any activities after a short delay
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/city-activities/${encodeURIComponent(cityName)}`);
          if (response.ok) {
            const activities = await response.json();
            if (activities.length === 0) {
              setSearchError(`No activities found for ${cityName}. AI might not have data for this location yet.`);
            }
          }
        } catch (error) {
          setSearchError(`Could not load data for ${cityName}. AI might not have information about this location.`);
        } finally {
          setSearchingCity(false);
        }
      }, 3000); // Give AI time to process
      
    } catch (error) {
      setSearchError(`Unable to search for ${cityName}. Please try again or choose a different city.`);
      setSearchingCity(false);
    }
  };

  console.log('🎯 RENDERING - selectedCity:', selectedCity);
  
  // Force show specific city (like Dublin) when passed as prop, even if not in city stats
  if (forceShowCity && selectedCity && (CITY_ALWAYS_ACTIVITIES[selectedCity as keyof typeof CITY_ALWAYS_ACTIVITIES] || selectedCity.toLowerCase() === 'dublin')) {
    console.log('🎯 RENDERING: Forcing display of specific city:', selectedCity);
    // Skip to city-specific content below
  }
  // Otherwise show city selection if no city is selected
  else if (!selectedCity) {
    console.log('🎯 RENDERING: Showing city selection interface');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          {/* Header - Mobile vs Desktop Layout */}
          <div className="mb-6 md:mb-8">
            {/* Mobile: Responsive centered layout */}
            <div className="block md:hidden text-center px-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                🎯 City-Specific Matching
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Find People Who Want to Do What You Want to Do
              </p>
            </div>

            {/* Desktop: Compact layout consistent with other pages */}
            <div className="hidden md:grid md:grid-cols-5 items-center gap-8">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  <h1>
                    City-Specific Matching
                  </h1>
                </div>
                <div className="mt-4 sm:mt-6 max-w-2xl text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p className="mb-4">
                    Connect with people who share your exact interests in specific cities around the world.
                  </p>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                    Add activities you want to do, then instantly see who else wants to do the same things in that city. Perfect for travelers and locals alike.
                  </p>
                </div>
                
                {/* Matching Features List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Real-time activity and event matching</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Connect with locals and fellow travelers</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span>Discover unique experiences in any city</span>
                  </div>
                </div>
              </div>
              
              {/* Right image side - compact and consistent */}
              <div className="md:col-span-2 flex flex-col items-center">
                {/* Compact matching illustration */}
                <div className="relative w-full max-w-sm h-[240px] rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 flex items-center justify-center">
                  <img 
                    src={cityMatchingIllustration}
                    alt="City activity matching illustration"
                    className="w-full h-full object-cover transition-opacity duration-500"
                    loading="eager"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: '0' }}
                  />
                  {/* Loading indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                      <div className="text-gray-500 text-sm font-medium">Loading...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Show loading state */}
          {citiesLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-gray-900 dark:text-gray-600 dark:text-gray-300 mt-4 text-lg">Loading cities...</p>
            </div>
          ) : (
            <>
              {/* Popular Destinations */}
              {filteredCities.length > 0 && (
                <div className="mb-12">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                      Popular Destinations
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      Discover amazing cities where travelers and locals connect every day
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCities.map((city, index) => (
                      <Card
                        key={`destination-${city.city}-${city.state}-${index}`}
                        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800"
                        onClick={() => {
                          setSelectedCity(city.city);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        data-testid={`city-card-${city.city.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {/* City Image/Gradient Header */}
                        <div className="relative h-40 overflow-hidden">
                          <div className={`w-full h-full bg-gradient-to-br ${city.gradient} relative`}>
                            {/* Gradient overlay for better contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                            
                            {/* City icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                <MapPin className="w-8 h-8 text-white drop-shadow-lg" />
                              </div>
                            </div>
                            
                            {/* City name overlay */}
                            <div className="absolute bottom-3 left-4 right-4">
                              <h3 className="font-bold text-xl text-white drop-shadow-lg truncate">
                                {city.city}
                              </h3>
                              <p className="text-white/90 text-sm drop-shadow truncate">
                                {city.state && `${city.state}, `}{city.country}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Content */}
                        <CardContent className="p-5">
                          <div className="space-y-3">
                            {/* Stats or info could go here */}
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                Active community
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                Popular
                              </span>
                            </div>
                            
                            {/* Explore button */}
                            <Button 
                              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCity(city.city);
                              }}
                              data-testid={`explore-button-${city.city.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              Explore {city.city}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Search for Other Cities Tab */}
              <div className="mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🔍 Search Any City</h3>
                  <p className="text-gray-900 dark:text-gray-600 dark:text-gray-300">Don't see your city? Search for any city worldwide</p>
                </div>
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 dark:text-gray-500 dark:text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Type any city name (e.g., Tokyo, Paris, Sydney)..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="pl-10 py-3 text-lg bg-white/20 border-white/30 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-white/60"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && citySearchTerm.trim() && !searchingCity) {
                          handleCustomCitySearch(citySearchTerm.trim());
                        }
                      }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <Button 
                      onClick={() => {
                        if (citySearchTerm.trim() && !searchingCity) {
                          handleCustomCitySearch(citySearchTerm.trim());
                        }
                      }}
                      disabled={!citySearchTerm.trim() || searchingCity}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-gray-900 dark:text-white font-semibold px-6 py-2 flex items-center gap-2"
                    >
                      {searchingCity ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Searching...
                        </>
                      ) : (
                        'Search This City'
                      )}
                    </Button>
                  </div>
                  
                  {/* Search Status Messages */}
                  {searchingCity && (
                    <div className="mt-4 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-200">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200"></div>
                        <p className="text-sm font-medium">Searching for city data...</p>
                      </div>
                      <p className="text-xs text-blue-300 mt-1">AI is generating activities and events for {selectedCity}. This may take a few moments.</p>
                    </div>
                  )}
                  
                  {searchError && (
                    <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                      <div className="text-yellow-200">
                        <p className="text-sm font-medium">Limited Results Found</p>
                        <p className="text-xs text-yellow-300 mt-1">{searchError}</p>
                        <p className="text-xs text-yellow-300 mt-2">AI isn't always perfect at finding city data. You can still explore the city and add your own activities!</p>
                      </div>
                    </div>
                  )}
                  </div>
                </CardContent>
              </Card>
            </div>
            </>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Compact Header - consistent with other pages */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCity('');
            }}
            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cities
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {selectedCity}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Add activities and events. Others click to match!
              </p>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">Matching</span>
            </div>
          </div>
        </div>

        {/* Removed problematic photo gallery */}

        {/* HOW MATCHING WORKS - MOBILE RESPONSIVE */}
        <Card className="mb-3 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="text-gray-800 dark:text-gray-200 text-xs md:text-sm">
              <strong className="text-black dark:text-white">Quick Start:</strong> Click activities below to add them to your profile, then see who else wants to do the same things in {selectedCity}!
            </div>
          </CardContent>
        </Card>




        {/* Global Activities Section - MOBILE RESPONSIVE */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">🌍 All {selectedCity} Activities ({cityActivities.length})</h2>
            <Button
              onClick={() => enhanceCityWithMoreActivities()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-gray-900 dark:text-white font-semibold px-3 py-2 md:px-4 rounded-lg shadow-lg text-sm md:text-base w-full sm:w-auto"
              disabled={isLoading}
            >
              🤖 Get More AI Activities
            </Button>
          </div>
        </div>

        {/* Global Activities Section - MOBILE RESPONSIVE */}
        <div className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-6">
          <h3 className="text-black dark:text-white font-semibold text-base md:text-lg mb-2 md:mb-3">
            Everyone can add/edit activities for {selectedCity}
          </h3>
          <div className="text-gray-700 dark:text-gray-300 text-xs md:text-sm mb-3">
            ✅ Click activities to add them to your personal list below<br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>🌍 Universal activities (available in all cities)<br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>⭐ {selectedCity} iconic activities (must-do attractions)<br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>🤖 AI-generated activities (edit/delete to change for EVERYONE)
          </div>

          {/* Add Activity Section - MOBILE RESPONSIVE */}
          <div className="mb-4" data-add-activity-section>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">+ Add Activity</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Add activity or event"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-9 md:h-8"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newActivityName.trim()) {
                      addActivity();
                    }
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Optional description"
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-9 md:h-8"
                  />
                  <Button
                    onClick={addActivity}
                    disabled={!newActivityName.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white px-4 h-9 md:h-8 text-sm w-full sm:w-auto"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>



          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {cityActivities.map((activity) => {
                const isActive = isActivityActive(activity.id);

                return (
                  <div key={activity.id} className="relative group">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴 BUTTON CLICKED!', activity.name || activity.activityName);
                        toggleActivity(activity);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md border ${
                        isActive 
                          ? 'bg-green-500 hover:bg-green-600 border-green-600 text-white' 
                          : activity.isUniversal
                            ? 'bg-white hover:bg-gray-50 border-gray-300 text-black'
                            : activity.isCityAlways
                              ? 'bg-orange-500 hover:bg-orange-600 border-orange-600 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white'
                      }`}
                    >
                      {activity.isUniversal && <span className="text-xs mr-1">🌍</span>}
                      {activity.isCityAlways && <span className="text-xs mr-1">⭐</span>}
                      {activity.name || activity.activityName}
                      {activity.description && (
                        <Info className="w-3 h-3 ml-1 opacity-60" />
                      )}
                    </button>
                    {activity.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 ml-1 opacity-60 absolute top-1 right-1" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-gray-900 dark:text-white border-gray-700 shadow-xl">
                          <p className="text-sm">{activity.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Edit/Delete on hover - only for city-specific activities */}
                    {!activity.isUniversal && (
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActivity(activity);
                            setEditActivityName(activity.name || activity.activityName);
                            setEditActivityDescription(activity.description || '');
                          }}
                          className="w-5 h-5 bg-blue-600 hover:bg-blue-700 rounded-full text-white text-xs flex items-center justify-center"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteActivity(activity.id);
                          }}
                          className="w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs flex items-center justify-center"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Add new activity */}
            <button
              onClick={() => {
                // Scroll to the text input section
                const addActivitySection = document.querySelector('[data-add-activity-section]');
                if (addActivitySection) {
                  addActivitySection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                  // Focus the input field after scrolling
                  setTimeout(() => {
                    const input = addActivitySection.querySelector('input');
                    if (input) input.focus();
                  }, 500);
                }
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-600 hover:bg-gray-500 text-gray-900 dark:text-white border-2 border-dashed border-gray-400"
            >
              + Add Activity
            </button>
            </div>
          </TooltipProvider>



          {/* Edit Activity Form */}
          {editingActivity && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-gray-900 dark:text-white font-medium mb-2">Edit Activity</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Activity name..."
                  value={editActivityName}
                  onChange={(e) => setEditActivityName(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus
                />
                <Textarea
                  placeholder="Description required - details about this activity..."
                  value={editActivityDescription}
                  onChange={(e) => setEditActivityDescription(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none h-20"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={updateActivity}
                    className="bg-blue-500 hover:bg-blue-600 text-gray-900 dark:text-white"
                    disabled={!editActivityName.trim() || !editActivityDescription.trim()}
                  >
                    Update Activity
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingActivity(null);
                      setEditActivityName('');
                      setEditActivityDescription('');
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>



        {cityActivities.length === 0 && (
          <div className="text-center py-8 text-gray-900 dark:text-gray-500 dark:text-gray-400">
            <h3 className="text-lg font-semibold mb-2">No activities yet in {selectedCity}</h3>
            <p className="text-sm">Be the first to add activities!</p>
          </div>
        )}

        {/* Events Section  */}
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎉 Events in {selectedCity} ({cityEvents.length})</h2>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold text-lg mb-3">
              {selectedCity} Events
            </h3>

            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {cityEvents.map((event) => {
                  const isActive = isEventActive(event.id);

                  return (
                    <div key={event.id} className="relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleEvent(event.id)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer hover:shadow-md ${
                                isActive 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg border border-green-400/20' 
                                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm border border-red-400/20'
                              }`}
                              style={{ color: '#ffffff' }}
                            >
                              <span className="text-xs opacity-75">
                                {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                              </span>
                              <span className="mx-1">•</span>
                              {event.title}
                              <Info className="w-3 h-3 ml-1 opacity-60" />
                            </button>
                            <button
                              onClick={() => toggleEvent(event.id)}
                              className={`w-6 h-6 rounded-full text-xs font-bold transition-all duration-200 ${
                                isActive 
                                  ? 'bg-green-600 text-gray-900 dark:text-white' 
                                  : 'bg-gray-500 hover:bg-gray-600 text-gray-900 dark:text-white'
                              }`}
                              title={isActive ? "Remove Interest" : "Add Interest"}
                            >
                              {isActive ? '✓' : '+'}
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-gray-900 dark:text-white border-gray-700 shadow-xl">
                          <p className="text-sm font-medium">Click event name to view details and join</p>
                          <p className="text-xs text-gray-400 mt-1">Click + to add interest without joining</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>

            {cityEvents.length === 0 && (
              <div className="text-center py-8 text-gray-900 dark:text-gray-500 dark:text-gray-400">
                <h3 className="text-lg font-semibold mb-2">No events yet in {selectedCity}</h3>
                <p className="text-sm">Events created by users will appear here!</p>
              </div>
            )}
          </div>
        </div>

        {/* My Personal Selections Section */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5" />
              My Selected Activities in {selectedCity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Activities you've selected that appear on your profile:
            </div>
            {userActivities.length === 0 && userEvents.length === 0 ? (
              <p className="text-gray-900 dark:text-gray-500 dark:text-gray-400 text-sm italic">Click blue activities above to add them to your list!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {/* User Activities */}
                {userActivities.map((userActivity) => {
                  const globalActivity = cityActivities.find(ca => ca.id === userActivity.activityId);
                  if (!globalActivity) return null;
                  
                  return (
                    <div
                      key={`activity-${userActivity.id}`}
                      className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-gray-900 dark:text-white border border-purple-400/30 shadow-sm"
                    >
                      <span>{globalActivity.activityName}</span>
                      <button
                        onClick={() => toggleActivity(globalActivity)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white rounded-full flex items-center justify-center transition-colors"
                        title="Remove activity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                
                {/* User Events */}
                {userEvents.map((userEvent) => {
                  const globalEvent = cityEvents.find(ce => ce.id === userEvent.eventId);
                  if (!globalEvent) {
                    console.log(`🔍 Event not found: ${userEvent.eventId} in`, cityEvents.map(ce => ce.id));
                    console.log(`🎪 Available userEvent data:`, userEvent);
                    // Show user event even if global event not found - with remove button
                    return (
                      <div
                        key={`event-${userEvent.id}`}
                        className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-gray-900 dark:text-white border border-purple-400/30 shadow-sm"
                      >
                        <span>📅 {userEvent.eventtitle || userEvent.eventTitle || (userEvent.eventId ? `Event ${userEvent.eventId}` : "Saved Event")}</span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/user-event-interests/${userEvent.id}`, {
                                method: 'DELETE',
                                headers: { 'x-user-id': getUserData()?.id?.toString() || '0' }
                              });
                              if (response.ok) {
                                setUserEvents(prev => prev.filter(ue => ue.id !== userEvent.id));
                                queryClient.invalidateQueries({ queryKey: [`/api/users/${getUserData()?.id}/all-events`] });
                                toast({ title: "Removed", description: "Event removed from your list" });
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
                            }
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white rounded-full flex items-center justify-center transition-colors"
                          title="Remove event"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`event-${userEvent.id}`}
                      className="relative group px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-gray-900 dark:text-white border border-purple-400/30 shadow-sm"
                    >
                      <span>📅 {globalEvent.title}</span>
                      <button
                        onClick={() => toggleEvent(globalEvent)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-gray-900 dark:text-white rounded-full flex items-center justify-center transition-colors"
                        title="Remove event"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matching Users Section */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                People Interested ({(matchingUsers || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(matchingUsers || []).length === 0 ? (
                <div className="text-center py-6 text-gray-900 dark:text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Add activities and events to find people with similar interests!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(matchingUsers || []).slice(0, 5).map((user: any, index: number) => (
                    <div 
                      key={user.id || index} 
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-semibold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-900 dark:text-white font-medium">{user.username || 'Anonymous'}</div>
                        {user.sharedActivityNames && Array.isArray(user.sharedActivityNames) && user.sharedActivityNames.length > 0 && (
                          <div className="text-gray-900 dark:text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Both interested in: {(user.sharedActivityNames || []).slice(0, 2).join(', ')}
                            {(user.sharedActivityNames || []).length > 2 && ` +${(user.sharedActivityNames || []).length - 2} more`}
                          </div>
                        )}
                        <div className="text-gray-900 dark:text-gray-500 dark:text-gray-400 text-xs">
                          {user.commonActivities || 1} shared interest{(user.commonActivities || 1) === 1 ? '' : 's'}
                          {user.matchStrength && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.matchStrength >= 3 ? 'bg-green-500/20 text-green-300' :
                              user.matchStrength >= 2 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {user.matchStrength >= 3 ? 'High Match' : 
                               user.matchStrength >= 2 ? 'Good Match' : 
                               'Potential Match'}
                            </span>
                          )}
                        </div>
                      </div>
                      {(() => {
                        // Check if user is already connected
                        const isConnected = connections.some(conn => 
                          conn.connectedUser?.id === user.id && conn.status === 'accepted'
                        );
                        // Special case for nearbytraveler (user id 1)
                        const isNearbyTraveler = user.id === 1;
                        
                        if (isConnected || isNearbyTraveler) {
                          return (
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 text-gray-900 dark:text-white" 
                              onClick={() => {/* Already connected - no action needed */}}
                            >
                              Connected
                            </Button>
                          );
                        }
                        return (
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-gray-900 dark:text-white"
                            onClick={() => {/* Connect functionality here */}}
                          >
                            Connect
                          </Button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  🎉 {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex gap-2">
                  <Badge className="bg-blue-500 text-gray-900 dark:text-white" variant="secondary">
                    {selectedEvent.category || 'Event'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEvent.city}
                  </Badge>
                  {selectedEvent.participantCount && (
                    <Badge variant="outline">
                      {selectedEvent.participantCount} attending
                    </Badge>
                  )}
                </div>
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {/* Date & Time - CRITICAL MISSING INFO */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-500 mt-1">📅</div>
                    <div>
                      <p className="font-medium text-black dark:text-gray-900 dark:text-white">Date & Time</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date not specified'}
                      </p>
                      {selectedEvent.date && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                            Start Time: {new Date(selectedEvent.date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {selectedEvent.endDate && (
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                              End Time: {new Date(selectedEvent.endDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Address - CRITICAL MISSING INFO */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium text-black dark:text-gray-900 dark:text-white">Location & Address</p>
                      {selectedEvent.streetAddress ? (
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          <p className="font-medium">{selectedEvent.streetAddress}</p>
                          <p>{selectedEvent.city}, {selectedEvent.state} {selectedEvent.zipCode}</p>
                          <p>{selectedEvent.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {selectedEvent.city}, {selectedEvent.state}
                          {selectedEvent.zipCode && ` ${selectedEvent.zipCode}`}
                          {selectedEvent.country && `, ${selectedEvent.country}`}
                        </p>
                      )}
                      {selectedEvent.venue && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Venue: {selectedEvent.venue}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Event Details */}
                  {selectedEvent.organizer && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium text-black dark:text-gray-900 dark:text-white">Organizer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{selectedEvent.organizer}</p>
                        {selectedEvent.organizerContact && (
                          <p className="text-xs text-gray-600 dark:text-gray-300">{selectedEvent.organizerContact}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.requirements && (
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium text-black dark:text-gray-900 dark:text-white">Requirements</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{selectedEvent.requirements}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Organizer */}
                {selectedEvent.organizerName && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Organized by</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-semibold">
                        {selectedEvent.organizerName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedEvent.organizerName}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Event Organizer</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      const venueQuery = selectedEvent.venueName ? `${selectedEvent.title} ${selectedEvent.venueName}` : selectedEvent.title;
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(venueQuery + ' tickets event')}`;
                      window.open(searchUrl, '_blank');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white"
                    size="lg"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Get Tickets & Info
                  </Button>
                  <Button 
                    onClick={() => {
                      toggleEvent(selectedEvent);
                      setShowEventModal(false);
                    }}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    {isEventActive(selectedEvent.id) ? 'Remove Interest' : 'Add Interest'}
                  </Button>
                </div>

                {/* Share Event */}
                <div className="text-center pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">Share this event with friends</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/event-details/${selectedEvent.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({
                        title: "Link Copied!",
                        description: "Event link has been copied to clipboard",
                      });
                    }}
                  >
                    📋 Copy Event Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
}