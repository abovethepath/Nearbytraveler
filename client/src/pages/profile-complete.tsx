import React, { useState, useMemo, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
// Removed goBackProperly import
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Camera, Globe, Users, Calendar, Star, Settings, ArrowLeft, Upload, Edit, Edit2, Heart, MessageSquare, X, Plus, Eye, EyeOff, MessageCircle, ImageIcon, Minus, RotateCcw, Sparkles, Package, Trash2, Home, FileText, TrendingUp, MessageCircleMore, Share2, ChevronDown, Search, Zap, History, Clock, Wifi, Shield, ChevronRight, AlertCircle, Phone, Plane, User as UserIcon } from "lucide-react";

type TabKey = 'contacts' | 'photos' | 'references' | 'travel' | 'countries';
import { compressPhotoAdaptive } from "@/utils/photoCompression";
import { AdaptiveCompressionIndicator } from "@/components/adaptive-compression-indicator";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import FriendReferralWidget from "@/components/friend-referral-widget";

import ReferencesWidgetNew from "@/components/references-widget-new";
import { VouchWidget } from "@/components/vouch-widget";
import { LocationSharingSection } from "@/components/LocationSharingSection";
import TravelPlansWidget from "@/components/TravelPlansWidget";
// Removed framer-motion import for static interface
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";

import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { METRO_AREAS } from "@shared/constants";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { calculateAge, formatDateOfBirthForInput, validateDateInput, getDateInputConstraints } from "@/lib/ageUtils";
import { isTopChoiceInterest } from "@/lib/topChoicesUtils";
import { BUSINESS_TYPES } from "../../../shared/base-options";

// Helper function to check if two cities are in the same metro area
function areInSameMetroArea(city1: string, city2: string): boolean {
  for (const metroArea of Object.values(METRO_AREAS)) {
    const cities = metroArea.cities.map(c => c.toLowerCase());
    if (cities.includes(city1?.toLowerCase()) && cities.includes(city2?.toLowerCase())) {
      return true;
    }
  }
  return false;
}

// Things in Common Component for compatibility assessment
interface ThingsInCommonSectionProps {
  currentUser: any;
  profileUser: any;
}

function ThingsInCommonSection({ currentUser, profileUser }: ThingsInCommonSectionProps) {
  // Calculate shared interests
  const currentUserInterests = currentUser?.interests || [];
  const profileUserInterests = profileUser?.interests || [];
  const sharedInterests = currentUserInterests.filter((interest: string) => 
    profileUserInterests.includes(interest)
  );

  // Calculate shared activities 
  const currentUserActivities = currentUser?.activities || [];
  const profileUserActivities = profileUser?.activities || [];
  const sharedActivities = currentUserActivities.filter((activity: string) => 
    profileUserActivities.includes(activity)
  );

  // Calculate shared events (simplified - could be enhanced with actual event data)
  const sharedEventsCount = 0; // This would need to be calculated from actual event participation

  const totalThingsInCommon = sharedInterests.length + sharedActivities.length + sharedEventsCount;

  if (totalThingsInCommon === 0) {
    return null; // Don't show if no common things
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm w-full overflow-hidden">
      <CardContent className="p-4">
        <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 border-l-4 border-green-200 rounded-r-lg">
          <h5 className="font-medium text-black mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Things We Have in Common ({totalThingsInCommon})
          </h5>
          
          <div className="space-y-3">
            {sharedInterests.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-black mb-2">Shared Interests ({sharedInterests.length})</h6>
                <div className="flex flex-wrap gap-1">
                  {sharedInterests.map((interest: string, index: number) => (
                    <div key={index} className="pill-interests bg-green-100 text-green-800 border-green-200">
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedActivities.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-black mb-2">Shared Activities ({sharedActivities.length})</h6>
                <div className="flex flex-wrap gap-1">
                  {sharedActivities.map((activity: string, index: number) => (
                    <div key={index} className="pill-interests bg-blue-100 text-blue-800 border-blue-200">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedEventsCount > 0 && (
              <div>
                <h6 className="text-sm font-medium text-black mb-2">Shared Events ({sharedEventsCount})</h6>
                <p className="text-sm text-black">
                  You both participated in {sharedEventsCount} similar events
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-black italic">
              This compatibility assessment helps you find meaningful connections based on shared interests and activities.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get metro area name for a city
function getMetroAreaName(cityName: string): string {
  for (const [metroKey, metroArea] of Object.entries(METRO_AREAS)) {
    const cities = metroArea.cities.map(c => c.toLowerCase());
    if (cities.includes(cityName?.toLowerCase())) {
      return metroKey; // Returns "Los Angeles" for LA metro cities
    }
  }
  return cityName; // Return original city name if not in a metro area
}

// State/Province arrays - consistent with signup forms
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const CANADIAN_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
];

const AUSTRALIAN_STATES = [
  "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland",
  "South Australia", "Tasmania", "Victoria", "Western Australia"
];

import WorldMap from "@/components/world-map";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";
import TravelItinerary from "@/components/travel-itinerary";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";



import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import { MobileTopNav } from "@/components/MobileTopNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SimpleAvatar } from "@/components/simple-avatar";
// Removed Navbar import since App.tsx handles navigation
// Removed animated loading for static interface

// Helper function to get metropolitan area for a city
const getMetropolitanArea = (city: string, state: string, country: string): string | null => {
  if (!city || !state || !country) return null;
  
  // Los Angeles Metropolitan Area cities - COMPREHENSIVE LIST
  const laMetroCities = [
    // Main cities
    'Los Angeles', 'Santa Monica', 'Venice', 'Beverly Hills', 'West Hollywood',
    'Pasadena', 'Burbank', 'Glendale', 'Long Beach', 'Torrance', 'Inglewood',
    'Compton', 'Downey', 'Pomona', 'Playa del Rey', 'Redondo Beach', 'Culver City',
    'Marina del Rey', 'Hermosa Beach', 'Manhattan Beach', 'El Segundo', 'Hawthorne',
    'Gardena', 'Carson', 'Lakewood', 'Norwalk', 'Whittier', 'Montebello',
    'East Los Angeles', 'Monterey Park', 'Alhambra', 'South Pasadena', 'San Fernando',
    'North Hollywood', 'Hollywood', 'Studio City', 'Sherman Oaks', 'Encino',
    'Reseda', 'Van Nuys', 'Northridge', 'Malibu', 'Pacific Palisades', 'Brentwood',
    'Westwood', 'Century City', 'West LA', 'Koreatown', 'Mid-City', 'Miracle Mile',
    'Los Feliz', 'Silver Lake', 'Echo Park', 'Downtown LA', 'Arts District',
    'Little Tokyo', 'Chinatown', 'Boyle Heights', 'East LA', 'Highland Park',
    'Eagle Rock', 'Atwater Village', 'Glassell Park', 'Mount Washington',
    'Cypress Park', 'Sun Valley', 'Pacoima', 'Sylmar', 'Granada Hills',
    'Porter Ranch', 'Chatsworth', 'Canoga Park', 'Woodland Hills', 'Tarzana',
    'Panorama City', 'Mission Hills', 'Sepulveda', 'Arleta', 'San Pedro',
    'Wilmington', 'Harbor City', 'Harbor Gateway', 'Watts', 'South LA',
    'Crenshaw', 'Leimert Park', 'View Park', 'Baldwin Hills', 'Ladera Heights',
    'Venice Beach', 'Altadena', 'Arcadia', 'Azusa', 'Bell', 'Bell Gardens',
    'Bellflower', 'Bradbury', 'Calabasas', 'Cerritos', 'Claremont', 'Commerce',
    'Covina', 'Cudahy', 'Diamond Bar', 'Duarte', 'El Monte', 'Glendora',
    'Hidden Hills', 'Huntington Park', 'Industry', 'Irwindale', 'La Canada Flintridge',
    'La Habra Heights', 'La Mirada', 'La Puente', 'La Verne', 'Lancaster',
    'Lawndale', 'Lomita', 'Lynwood', 'Maywood', 'Monrovia', 'Palmdale',
    'Palos Verdes Estates', 'Paramount', 'Pico Rivera', 'Rancho Palos Verdes',
    'Rolling Hills', 'Rolling Hills Estates', 'Rosemead', 'San Dimas', 'San Gabriel',
    'San Marino', 'Santa Clarita', 'Signal Hill', 'South El Monte', 'South Gate',
    'Temple City', 'Vernon', 'Walnut', 'West Covina', 'Westlake Village'
  ];
  
  if (state === 'California' && laMetroCities.includes(city)) {
    return 'Los Angeles Metro';
  }
  
  // San Francisco Bay Area
  const sfBayAreaCities = [
    'San Francisco', 'San Jose', 'Oakland', 'Fremont', 'Santa Clara', 'Sunnyvale',
    'Berkeley', 'Hayward', 'Palo Alto', 'Mountain View', 'Redwood City', 'Cupertino',
    'San Mateo', 'Daly City', 'Milpitas', 'Union City', 'San Leandro', 'Alameda',
    'Richmond', 'Vallejo', 'Antioch', 'Concord', 'Fairfield', 'Livermore',
    'San Rafael', 'Petaluma', 'Napa', 'Sausalito', 'Half Moon Bay', 'Foster City',
    'Belmont', 'Burlingame', 'Menlo Park', 'Los Altos', 'Campbell', 'Los Gatos',
    'Saratoga', 'Monte Sereno', 'Milbrae', 'South San Francisco', 'Pacifica',
    'Brisbane', 'Colma', 'Emeryville', 'Piedmont', 'Albany', 'El Cerrito',
    'Hercules', 'Pinole', 'San Pablo', 'Dublin', 'Pleasanton', 'Newark',
    'Castro Valley', 'San Lorenzo', 'Hayward', 'Fremont', 'Milpitas'
  ];
  
  if (state === 'California' && sfBayAreaCities.includes(city)) {
    return 'San Francisco Bay Area';
  }
  
  // New York Metropolitan Area
  const nyMetroCities = [
    'New York City', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
    'Jersey City', 'Newark', 'Hoboken', 'Yonkers', 'White Plains', 'Stamford',
    'Bridgeport', 'New Rochelle', 'Mount Vernon', 'Scarsdale', 'Rye', 'Mamaroneck',
    'Port Chester', 'Harrison', 'Larchmont', 'Bronxville', 'Tuckahoe', 'Eastchester',
    'Pelham', 'Pelham Manor', 'Hastings-on-Hudson', 'Dobbs Ferry', 'Irvington',
    'Tarrytown', 'Sleepy Hollow', 'Ossining', 'Croton-on-Hudson', 'Buchanan',
    'Peekskill', 'Cortlandt', 'Yorktown', 'Somers', 'North Salem', 'Lewisboro',
    'Pound Ridge', 'Bedford', 'Mount Kisco', 'Pleasantville', 'Chappaqua',
    'Millwood', 'Briarcliff Manor', 'Jersey City', 'Bayonne', 'Union City',
    'West New York', 'North Bergen', 'Guttenberg', 'Secaucus', 'Kearny',
    'Harrison', 'East Newark', 'Weehawken', 'Edgewater', 'Fort Lee',
    'Englewood', 'Teaneck', 'Bergenfield', 'New Milford', 'Dumont', 'Cresskill'
  ];
  
  if ((state === 'New York' || state === 'New Jersey' || state === 'Connecticut') && 
      nyMetroCities.some(metro => metro.toLowerCase() === city.toLowerCase())) {
    return 'New York Metropolitan Area';
  }
  
  // Chicago Metropolitan Area
  const chicagoMetroCities = [
    'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield',
    'Peoria', 'Elgin', 'Waukegan', 'Cicero', 'Champaign', 'Bloomington',
    'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg', 'Bolingbrook',
    'Palatine', 'Skokie', 'Des Plaines', 'Orland Park', 'Tinley Park',
    'Oak Lawn', 'Berwyn', 'Mount Prospect', 'Normal', 'Wheaton', 'Hoffman Estates',
    'Oak Park', 'Downers Grove', 'Elmhurst', 'Glenview', 'DeKalb', 'Lombard',
    'Belleville', 'Moline', 'Buffalo Grove', 'Bartlett', 'Urbana', 'Quincy',
    'Crystal Lake', 'Streamwood', 'Carol Stream', 'Romeoville', 'Rock Island',
    'Park Ridge', 'Addison', 'Calumet City'
  ];
  
  if (state === 'Illinois' && chicagoMetroCities.includes(city)) {
    return 'Chicago Metropolitan Area';
  }
  
  // Miami Metropolitan Area
  const miamiMetroCities = [
    'Miami', 'Fort Lauderdale', 'Pembroke Pines', 'Hollywood', 'Miramar',
    'Coral Springs', 'Miami Gardens', 'Davie', 'Sunrise', 'Plantation',
    'Boca Raton', 'Delray Beach', 'Boynton Beach', 'Pompano Beach',
    'Deerfield Beach', 'Coconut Creek', 'Margate', 'Tamarac', 'Lauderhill',
    'Weston', 'Aventura', 'North Miami', 'North Miami Beach', 'Miami Beach',
    'Coral Gables', 'Key Biscayne', 'Hialeah', 'Homestead', 'Kendall',
    'Doral', 'Pinecrest', 'Palmetto Bay', 'Cutler Bay', 'South Miami'
  ];
  
  if (state === 'Florida' && miamiMetroCities.includes(city)) {
    return 'Miami-Dade Metropolitan Area';
  }
  
  // Dallas-Fort Worth Metropolitan Area
  const dallasMetroCities = [
    'Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Garland', 'Irving', 'Grand Prairie',
    'McKinney', 'Frisco', 'Richardson', 'Lewisville', 'Allen', 'Flower Mound',
    'Carrollton', 'Denton', 'Mesquite', 'Grapevine', 'Coppell', 'Duncanville',
    'Euless', 'Bedford', 'Hurst', 'Southlake', 'Colleyville', 'Keller',
    'Cedar Hill', 'DeSoto', 'Lancaster', 'Farmers Branch', 'University Park',
    'Highland Park', 'Addison', 'Rowlett', 'Wylie', 'Sachse', 'Murphy',
    'Rockwall', 'Terrell', 'Corsicana', 'Ennis'
  ];
  
  if (state === 'Texas' && dallasMetroCities.includes(city)) {
    return 'Dallas-Fort Worth Metropolitan Area';
  }
  
  return null;
};



import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";

// import { LocationSharingWidgetFixed } from "@/components/LocationSharingWidgetFixed";
import { CustomerUploadedPhotos } from "@/components/customer-uploaded-photos";
import BusinessEventsWidget from "@/components/business-events-widget";
import ReferralWidget from "@/components/referral-widget";
import { BlockUserButton } from "@/components/block-user-button";



import type { User, UserPhoto, PassportStamp, TravelPlan } from "@shared/schema";
import { insertUserReferenceSchema } from "@shared/schema";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, getPublicInterests, getPrivateInterests } from "../../../shared/base-options";
import { getTopChoicesInterests } from "../lib/topChoicesUtils";

// Extended user interface for additional properties
interface ExtendedUser extends User {
  isVeteran?: boolean;
  isActiveDuty?: boolean;
  isMinorityOwned?: boolean;
  isFemaleOwned?: boolean;
  isLGBTQIAOwned?: boolean;
  showMinorityOwned?: boolean;
  showFemaleOwned?: boolean;
  showLGBTQIAOwned?: boolean;
  childrenAges?: string;
  ownerName?: string;
  contactName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  services?: string;
  specialOffers?: string;
  targetCustomers?: string;
  certifications?: string;
  customInterests?: string;
  customActivities?: string;
  customEvents?: string;
}

// Safe wrappers to prevent undefined errors with enhanced debugging
const safeGetAllActivities = () => {
  try {
    console.log('🔧 DEBUG: Calling getAllActivities...');
    const activities = getAllActivities();
    console.log('🔧 DEBUG: getAllActivities returned:', activities, 'type:', typeof activities, 'isArray:', Array.isArray(activities));
    if (Array.isArray(activities)) {
      console.log('✅ Activities array is valid, length:', activities.length);
      return activities;
    } else {
      console.error('❌ Activities is not an array, falling back to empty array');
      return [];
    }
  } catch (error) {
    console.error('❌ Error in safeGetAllActivities:', error);
    return [];
  }
};

const safeGetAllEvents = () => {
  try {
    const events = getAllEvents();
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error('❌ Error in safeGetAllEvents:', error);
    return [];
  }
};

const safeGetAllInterests = () => {
  try {
    const interests = getAllInterests();
    return Array.isArray(interests) ? interests : [];
  } catch (error) {
    console.error('❌ Error in safeGetAllInterests:', error);
    return [];
  }
};

// Add missing constants
const INTERESTS_OPTIONS = ADDITIONAL_INTERESTS;
const ACTIVITIES_OPTIONS = safeGetAllActivities();
const EVENTS_OPTIONS = safeGetAllEvents();

// Reference constants
const REFERENCE_TYPES = [
  { value: "general", label: "General" },
  { value: "travel_buddy", label: "Travel Buddy" },
  { value: "local_host", label: "Local Host" },
  { value: "event_companion", label: "Event Companion" },
  { value: "host", label: "Host" },
  { value: "guest", label: "Guest" }
];

const QUICK_TAGS_OPTIONS = [
  "Reliable", "Friendly", "Knowledgeable", "Fun", "Safe", 
  "Organized", "Flexible", "Communicative", "Respectful", 
  "Adventurous", "Helpful", "Clean", "Punctual"
];

// Interface definitions
interface EnhancedProfileProps {
  userId?: number;
}

// Profile schema for form validation - conditional based on user type
const createProfileSchema = (userType: string) => {
  const baseSchema = z.object({
    bio: z.string().optional(),
    hometownCity: z.string().optional(),
    hometownState: z.string().optional(), 
    hometownCountry: z.string().optional(),
    travelStyle: z.array(z.string()).default([]),
  });

  if (userType === 'business') {
    return baseSchema.extend({
      businessName: z.string().optional(),
      businessDescription: z.string().optional(),
      businessType: z.string().optional(),
      location: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      streetAddress: z.string().optional(),
      zipCode: z.string().optional(),
      phoneNumber: z.string().optional(),
      websiteUrl: z.string().optional(),
      interests: z.array(z.string()).default([]),
      activities: z.array(z.string()).default([]),
      events: z.array(z.string()).default([]),
      customInterests: z.string().optional(),
      customActivities: z.string().optional(),
      customEvents: z.string().optional(),
      isVeteran: z.boolean().default(false),
      isActiveDuty: z.boolean().default(false),
      isMinorityOwned: z.boolean().default(false),
      isFemaleOwned: z.boolean().default(false),
      isLGBTQIAOwned: z.boolean().default(false),
      showMinorityOwned: z.boolean().default(true),
      showFemaleOwned: z.boolean().default(true),
      showLGBTQIAOwned: z.boolean().default(true),
    });
  } else {
    return baseSchema.extend({
      dateOfBirth: z.string().optional(),
      ageVisible: z.boolean().default(true),
      gender: z.string().optional(),
      sexualPreference: z.array(z.string()).default([]),
      sexualPreferenceVisible: z.boolean().default(false),
      secretActivities: z.string().optional(),
      travelingWithChildren: z.boolean().default(false),
      childrenAges: z.string().max(100, "Children ages must be 100 characters or less").optional(),
      isVeteran: z.boolean().default(false),
      isActiveDuty: z.boolean().default(false),
      travelWhy: z.string().optional(),
      travelHow: z.string().optional(),
      travelBudget: z.string().optional(),
      travelGroup: z.string().optional(),
    });
  }
};

// Dynamic schema based on user type
const getDynamicProfileSchema = (userType: string) => createProfileSchema(userType);

// Default schema for compatibility
const profileSchema = createProfileSchema('traveler');

interface EnhancedProfileProps {
  userId?: number;
}

// Import shared travel options for consistency  
import { BASE_TRAVELER_TYPES } from "@/lib/travelOptions";

// Import centralized constants for consistency
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES, FORM_HEADERS } from "@/lib/formConstants";

// Reference form schema - matching userReferences table structure
const referenceSchema = z.object({
  reviewerId: z.number().min(1, "Reviewer ID required"),
  revieweeId: z.number().min(1, "Please select a person"),
  experience: z.enum(["positive", "neutral", "negative"]).default("positive"),
  content: z.string().optional(),
});






const COUNTRIES_OPTIONS = [
  // North America
  "United States", "Canada", "Mexico",
  
  // Caribbean Islands
  "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Cuba", "Dominica", 
  "Dominican Republic", "Grenada", "Haiti", "Jamaica", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago",
  "Aruba", "Curacao", "Sint Maarten", "British Virgin Islands", "US Virgin Islands",
  "Turks and Caicos", "Cayman Islands", "Anguilla", "Montserrat", "Guadeloupe",
  "Martinique", "Puerto Rico",
  
  // Central America
  "Costa Rica", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Panama",
  
  // South America
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "French Guiana",
  "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela",
  
  // Europe
  "United Kingdom", "Ireland", "France", "Germany", "Italy", "Spain", "Portugal", 
  "Netherlands", "Belgium", "Switzerland", "Austria", "Czech Republic", "Poland", 
  "Hungary", "Greece", "Turkey", "Norway", "Sweden", "Denmark", "Finland", "Iceland",
  "Russia", "Ukraine", "Belarus", "Lithuania", "Latvia", "Estonia", "Romania", 
  "Bulgaria", "Serbia", "Croatia", "Slovenia", "Slovakia", "Bosnia and Herzegovina",
  "Montenegro", "North Macedonia", "Albania", "Moldova", "Malta", "Cyprus", "Luxembourg",
  "Liechtenstein", "Monaco", "San Marino", "Vatican City", "Andorra",
  
  // Asia
  "China", "Japan", "South Korea", "North Korea", "Mongolia", "Thailand", "Vietnam", 
  "Cambodia", "Laos", "Myanmar", "Malaysia", "Singapore", "Indonesia", "Philippines",
  "Brunei", "East Timor", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
  "Bhutan", "Maldives", "Afghanistan", "Iran", "Iraq", "Saudi Arabia", "Yemen", "Oman",
  "United Arab Emirates", "Qatar", "Bahrain", "Kuwait", "Jordan", "Lebanon", "Syria",
  "Israel", "Palestine", "Georgia", "Armenia", "Azerbaijan", "Kazakhstan", "Uzbekistan",
  "Turkmenistan", "Kyrgyzstan", "Tajikistan",
  
  // Africa
  "Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "South Sudan", "Ethiopia",
  "Eritrea", "Djibouti", "Somalia", "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi",
  "Democratic Republic of Congo", "Republic of Congo", "Central African Republic", "Chad",
  "Cameroon", "Nigeria", "Niger", "Mali", "Burkina Faso", "Ghana", "Togo", "Benin",
  "Ivory Coast", "Liberia", "Sierra Leone", "Guinea", "Guinea-Bissau", "Senegal",
  "Gambia", "Mauritania", "Cape Verde", "Sao Tome and Principe", "Equatorial Guinea",
  "Gabon", "Angola", "Zambia", "Malawi", "Mozambique", "Zimbabwe", "Botswana", "Namibia",
  "South Africa", "Lesotho", "Eswatini", "Madagascar", "Mauritius", "Seychelles", "Comoros",
  
  // Oceania
  "Australia", "New Zealand", "Papua New Guinea", "Fiji", "Solomon Islands", "Vanuatu",
  "Samoa", "Tonga", "Tuvalu", "Kiribati", "Nauru", "Palau", "Marshall Islands", 
  "Micronesia", "Cook Islands", "Niue", "Tokelau", "American Samoa", "French Polynesia",
  "New Caledonia", "Guam", "Northern Mariana Islands"
];

const LANGUAGES_OPTIONS = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Ukrainian",
  "Dutch", "Chinese (Mandarin)", "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Urdu",
  "Thai", "Vietnamese", "Indonesian", "Malay", "Turkish", "Persian (Farsi)", "Hebrew",
  "Greek", "Polish", "Czech", "Hungarian", "Swedish", "Norwegian", "Danish", "Finnish",
  "Romanian", "Bulgarian", "Croatian", "Serbian", "Slovak", "Slovenian", "Estonian",
  "Latvian", "Lithuanian", "Albanian", "Macedonian", "Montenegrin", "Bosnian", "Maltese",
  "Icelandic", "Irish (Gaelic)", "Welsh", "Scottish Gaelic", "Basque", "Catalan", "Galician",
  "Swahili", "Amharic", "Yoruba", "Zulu", "Afrikaans", "Tagalog", "Cebuano", "Ilocano",
  "Gujarati", "Punjabi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Nepali",
  "Sinhala", "Burmese", "Khmer", "Lao", "Mongolian", "Tibetan", "Uzbek", "Kazakh",
  "Kyrgyz", "Tajik", "Turkmen", "Azerbaijani", "Armenian", "Georgian", "Belarusian"
];



// Multi-select component for interests, activities, and events
interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  maxDisplay?: number;
  pillType?: string;
}

function MultiSelect({ options, selected, onChange, placeholder, maxDisplay = 3, pillType = 'pill' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const allOptions = [...options, ...selected.filter(item => !options.includes(item))];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
        >
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selected.slice(0, maxDisplay).map((item) => (
                  <div key={item} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-gray-300 dark:border-gray-600 appearance-none select-none">
                    {item}
                  </div>
                ))}
                {selected.length > maxDisplay && (
                  <div className="inline-flex items-center justify-center h-6 rounded-full px-2 text-xs font-medium whitespace-nowrap leading-none border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-transparent">
                    +{selected.length - maxDisplay} more
                  </div>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="h-auto max-h-80">
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />

          <CommandEmpty>
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              No matching options found.
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto no-scrollbar">
            {allOptions.map((item) => (
              <CommandItem
                key={item}
                onSelect={() => handleSelect(item)}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selected.includes(item) ? "opacity-100" : "opacity-0"
                  }`}
                />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Function to filter out travel-specific tags when user is in their hometown
const getFilteredInterestsForProfile = (user: User, isOwnProfile: boolean) => {
  const interests = user.interests || [];
  
  // Popular interests that are displayed in their own section - exclude from main interests to avoid redundancy
  const popularInterests = MOST_POPULAR_INTERESTS;
  
  // Travel-specific tags that should be filtered out when user is displayed as local in hometown
  const travelSpecificTags = [
    "Solo Traveler", 
    "Group Traveler", 
    "Backpacker", 
    "Digital Nomad",
    "Adventure Traveler",
    "Budget Traveler",
    "Luxury Traveler"
  ];
  
  // Always filter out popular interests since they have their own section above
  let filteredInterests = interests.filter(interest => !popularInterests.includes(interest));
  
  // For viewing other users' profiles (not own profile), also filter out travel tags if they're in their hometown
  if (!isOwnProfile) {
    // Check if user has no travel plans and is likely in their hometown
    const hasNoTravelPlans = !user.travelDestination;
    const isInHometown = user.hometownCity && user.location && 
      user.location.toLowerCase().includes(user.hometownCity.toLowerCase());
    
    if (hasNoTravelPlans && isInHometown) {
      filteredInterests = filteredInterests.filter(interest => !travelSpecificTags.includes(interest));
    }
  }
  
  return filteredInterests;
};

function ProfileContent({ userId: propUserId }: EnhancedProfileProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: authContextUser, setUser: setAuthUser } = useContext(AuthContext);
  
  // Check for chatroom return context
  const chatroomReturnContext = localStorage.getItem('chatroom_return_context');
  const shouldShowBackToChatroom = chatroomReturnContext !== null;
  
  const handleBackToChatroom = () => {
    console.log('Back button clicked, context:', chatroomReturnContext);
    if (chatroomReturnContext) {
      try {
        const context = JSON.parse(chatroomReturnContext);
        console.log('Parsed context:', context);
        localStorage.removeItem('chatroom_return_context');
        
        // Set flag to auto-open member view before navigation
        if (context.chatroomId) {
          localStorage.setItem('open_chatroom_members', context.chatroomId.toString());
          console.log('Set open_chatroom_members:', context.chatroomId);
        }
        
        // Navigate back to chatrooms page
        console.log('Navigating to /city-chatrooms');
        setLocation('/city-chatrooms');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Error parsing chatroom context:', error);
        setLocation('/city-chatrooms');
      }
    } else {
      console.log('No chatroom context found, navigating to chatrooms');
      setLocation('/city-chatrooms');
    }
  };
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingTravelPlan, setEditingTravelPlan] = useState<TravelPlan | null>(null);
  const [deletingTravelPlan, setDeletingTravelPlan] = useState<TravelPlan | null>(null);
  const [selectedTravelPlan, setSelectedTravelPlan] = useState<TravelPlan | null>(null);
  const [showTravelPlanDetails, setShowTravelPlanDetails] = useState(false);
  const [expandedPlanInterests, setExpandedPlanInterests] = useState<Set<number>>(new Set());
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showChatroomList, setShowChatroomList] = useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey | ''>('');
  const [loadedTabs, setLoadedTabs] = React.useState<Set<TabKey>>(new Set());
  console.log('🎯 CURRENT ACTIVE TAB:', activeTab);
  
  const tabRefs = {
    contacts: React.useRef<HTMLDivElement>(null),
    photos: React.useRef<HTMLDivElement>(null),
    references: React.useRef<HTMLDivElement>(null),
    travel: React.useRef<HTMLDivElement>(null),
    countries: React.useRef<HTMLDivElement>(null),
  };

  function openTab(key: TabKey) {
    console.log('🔥 OPENING TAB:', key);
    setActiveTab(key);
    // Mark this tab as loaded for lazy loading
    setLoadedTabs(prev => new Set([...prev, key]));
    // Wait for the panel to render, then scroll it into view
    requestAnimationFrame(() => {
      console.log('📍 SCROLLING TO TAB:', key);
      tabRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  

  
  // Edit mode states for individual widgets
  const [editingInterests, setEditingInterests] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivities, setEditingActivities] = useState(false);
  const [editingEvents, setEditingEvents] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [editingCountries, setEditingCountries] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingBusinessDescription, setEditingBusinessDescription] = useState(false);
  
  // Temporary state for editing values
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  const [tempActivities, setTempActivities] = useState<string[]>([]);
  const [tempEvents, setTempEvents] = useState<string[]>([]);
  const [tempLanguages, setTempLanguages] = useState<string[]>([]);
  const [tempCountries, setTempCountries] = useState<string[]>([]);
  const [customLanguageInput, setCustomLanguageInput] = useState("");
  const [customCountryInput, setCustomCountryInput] = useState("");
  const [tempBio, setTempBio] = useState("");
  
  // Reference modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReference, setEditingReference] = useState<any>(null);
  
  // Simple edit form data (copying signup pattern)
  const [editFormData, setEditFormData] = useState({
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[]
  });

  // Simple toggle function copied from signup
  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };
  const [businessDescriptionForm, setBusinessDescriptionForm] = useState({
    services: '',
    specialOffers: '',
    targetCustomers: '',
    certifications: ''
  });
  const [savingBusinessDescription, setSavingBusinessDescription] = useState(false);
  
  // Owner contact information state
  const [editingOwnerInfo, setEditingOwnerInfo] = useState(false);
  const [ownerContactForm, setOwnerContactForm] = useState({
    ownerName: '',
    contactName: '',
    ownerEmail: '',
    ownerPhone: ''
  });
  
  // Controlled input states for custom entries
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [showWriteReferenceModal, setShowWriteReferenceModal] = useState(false);
  const [showAllReferences, setShowAllReferences] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Location editing state
  const [pendingLocationData, setPendingLocationData] = useState<{
    hometownCity: string;
    hometownState: string;
    hometownCountry: string;
  } | null>(null);
  const [scrollToLocation, setScrollToLocation] = useState(false);
  const [showLocationWidget, setShowLocationWidget] = useState(false);
  
  // Connection filters state
  const [connectionFilters, setConnectionFilters] = useState({
    location: 'all',
    gender: 'all',
    sexualPreference: 'all',
    minAge: '',
    maxAge: ''
  });
  const [showConnectionFilters, setShowConnectionFilters] = useState(false);
  const [connectionsDisplayCount, setConnectionsDisplayCount] = useState(3);
  const [editingConnectionNote, setEditingConnectionNote] = useState<number | null>(null);
  const [connectionNoteText, setConnectionNoteText] = useState('');
  const [eventsDisplayCount, setEventsDisplayCount] = useState(3);
  const [triggerQuickMeetup, setTriggerQuickMeetup] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [businessesDisplayCount, setBusinessesDisplayCount] = useState(3);
  const [expandedTravelPlan, setExpandedTravelPlan] = useState<number | null>(null);
  

  
  // Travel plan details modal state (already declared above)
  
  // Cover photo state
  const [coverPhotoKey, setCoverPhotoKey] = useState(Date.now());
  
  // Header gradient color selection with persistence - moved after user declaration
  const [selectedGradient, setSelectedGradient] = useState(0);

  
  const gradientOptions = [
    "from-blue-500 via-purple-500 to-orange-500", // Original
    "from-green-500 via-emerald-500 to-orange-500", // Green to Orange
    "from-blue-500 via-cyan-500 to-orange-500", // Blue to Orange
    "from-purple-500 via-pink-500 to-red-500", // Purple to Red
    "from-indigo-500 via-blue-500 to-green-500", // Indigo to Green
    "from-orange-500 via-red-500 to-pink-500", // Orange to Pink
    "from-teal-500 via-blue-500 to-purple-500", // Teal to Purple
    "from-yellow-500 via-orange-500 to-red-500", // Yellow to Red
  ];
  
  // Listen for cover photo refresh events
  useEffect(() => {
    const handleCoverPhotoRefresh = () => {
      console.log('Cover photo refresh event received');
      setCoverPhotoKey(Date.now());
    };

    window.addEventListener('coverPhotoUpdated', handleCoverPhotoRefresh);
    return () => window.removeEventListener('coverPhotoUpdated', handleCoverPhotoRefresh);
  }, []);
  const [showCropModal, setShowCropModal] = useState(false);
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [privateInterestInput, setPrivateInterestInput] = useState("");
  const [customActivityInput, setCustomActivityInput] = useState("");
  const [customEventInput, setCustomEventInput] = useState("");
  const [showCoverPhotoSelector, setShowCoverPhotoSelector] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropSettings, setCropSettings] = useState({
    x: 0,
    y: 0,
    scale: 1
  });

  // Form schema for travel plan editing
  const travelPlanSchema = z.object({
    destination: z.string().min(1, "Destination is required"),
    destinationCountry: z.string().optional(),
    destinationCity: z.string().optional(),
    destinationState: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    interests: z.array(z.string()).optional(),
    activities: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
    travelStyle: z.array(z.string()).optional(),
    accommodation: z.string().optional(),
    transportation: z.string().optional(),
    notes: z.string().optional(),
    isVeteran: z.boolean().default(false),
    isActiveDuty: z.boolean().default(false),
  });

  const form = useForm<z.infer<typeof travelPlanSchema>>({
    resolver: zodResolver(travelPlanSchema),
    defaultValues: {
      destination: "",
      destinationCountry: "",
      destinationCity: "",
      destinationState: "",
      startDate: "",
      endDate: "",
      interests: [],
      activities: [],
      events: [],
      travelStyle: [],
      accommodation: "",
      transportation: "",
      notes: "",
      isVeteran: false,
      isActiveDuty: false,
    },
  });

  // Dynamic profile schema based on user type
  const getProfileFormSchema = (userType: string) => {
    if (userType === 'business') {
      // Business profiles have more lenient bio requirements
      const businessSchema = z.object({
        bio: z.string().min(10, "Bio must be at least 10 characters").max(1000, "Bio must be 1000 characters or less"),
        hometownCity: z.string().optional(),
        hometownState: z.string().optional(),
        hometownCountry: z.string().optional(),
        travelStyle: z.array(z.string()).optional(),
      });
      
      return businessSchema.extend({
        businessName: z.string().max(100, "Business name must be 100 characters or less").optional(),
        businessDescription: z.string().optional(),
        businessType: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        location: z.string().optional(),
        streetAddress: z.string().optional(),
        zipCode: z.string().optional(),
        phoneNumber: z.string().optional().refine((val) => {
          if (!val || val === '') return true; // Allow empty
          // Accept various international phone formats
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
          return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
        }, "Please enter a valid phone number (supports international formats)"),
        websiteUrl: z.string().optional(),
        // Owner/Internal Contact Information
        ownerName: z.string().optional(),
        ownerPhone: z.string().optional().refine((val) => {
          if (!val || val === '') return true; // Allow empty
          // Accept various international phone formats
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{7,20}$/;
          return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
        }, "Please enter a valid phone number (supports international formats)"),
        interests: z.array(z.string()).default([]),
        activities: z.array(z.string()).default([]),
        events: z.array(z.string()).default([]),
        customInterests: z.string().optional(),
        customActivities: z.string().optional(),
        customEvents: z.string().optional(),
        isVeteran: z.boolean().default(false),
        isActiveDuty: z.boolean().default(false),
      });
    } else {
      // Regular users have standard bio requirements
      const baseSchema = z.object({
        bio: z.string().min(30, "Bio must be at least 30 characters").max(1000, "Bio must be 1000 characters or less"),
        hometownCity: z.string().optional(),
        hometownState: z.string().optional(),
        hometownCountry: z.string().optional(),
        travelStyle: z.array(z.string()).optional(),
      });
      
      return baseSchema.extend({
        secretActivities: z.string().max(500, "Secret activities must be 500 characters or less").optional(),
        dateOfBirth: z.string().optional(),
        ageVisible: z.boolean().default(false),
        gender: z.string().optional(),
        sexualPreference: z.array(z.string()).optional(),
        sexualPreferenceVisible: z.boolean().default(false),
        travelingWithChildren: z.boolean().default(false),
        childrenAges: z.string().max(100, "Children ages must be 100 characters or less").optional(),
        isVeteran: z.boolean().default(false),
        isActiveDuty: z.boolean().default(false),
      });
    }
  };

  // Robust authentication with emergency recovery
  let currentUser = authContextUser || authStorage.getUser();
  
  // If no user found, try to refresh from API without reload
  React.useEffect(() => {
    if (!currentUser) {
      authStorage.forceRefreshUser().then(refreshedUser => {
        if (refreshedUser) {
          setAuthUser(refreshedUser); // Update context instead of reload
        }
      });
    }
  }, [currentUser, setAuthUser]);
  
  const effectiveUserId = propUserId || currentUser?.id;
  const isOwnProfile = propUserId ? (parseInt(propUserId) === currentUser?.id) : true;
  
  console.log('🔧 AUTHENTICATION STATE:', {
    currentUserId: currentUser?.id,
    currentUsername: currentUser?.username,
    effectiveUserId,
    isOwnProfile,
    propUserId,
    propUserIdType: typeof propUserId,
    currentUserIdType: typeof currentUser?.id
  });
  
  console.log('Profile OWNERSHIP:', {
    isOwnProfile,
    propUserId,
    currentUserId: currentUser?.id,
    effectiveUserId,
    comparison: `${propUserId} === ${currentUser?.id}`,
    comparisonResult: propUserId === currentUser?.id,
    parsedComparison: `parseInt(${propUserId}) === ${currentUser?.id}`,
    parsedResult: parseInt(propUserId || '') === currentUser?.id
  });
  


  // Fetch user data with fallback to localStorage
  const { data: fetchedUser, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery<User>({
    queryKey: [`/api/users/${effectiveUserId}`, currentUser?.id],
    queryFn: async () => {
      const viewerId = currentUser?.id;
      const url = viewerId && viewerId !== effectiveUserId 
        ? `/api/users/${effectiveUserId}?viewerId=${viewerId}&bust=${Date.now()}`
        : `/api/users/${effectiveUserId}?bust=${Date.now()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You cannot view this user's profile due to privacy settings");
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!effectiveUserId,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (updated for TanStack Query v5)
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1, // Retry once in case of network issues

  });

  // Always prioritize fetched user data over localStorage cache
  const user = fetchedUser || currentUser;

  // Load and save gradient selection from localStorage after user is defined
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`profile_gradient_${user.id}`);
      if (saved) {
        setSelectedGradient(parseInt(saved, 10));
      }
    }
  }, [user?.id]);

  // Save gradient selection when it changes
  useEffect(() => {
    if (user?.id && selectedGradient !== 0) {
      localStorage.setItem(`profile_gradient_${user.id}`, selectedGradient.toString());
    }
  }, [selectedGradient, user?.id]);
  
  // Fetch travel plans early for event discovery logic with itinerary data
  const { data: travelPlans = [], isLoading: isLoadingTravelPlans } = useQuery<any[]>({
    queryKey: [`/api/travel-plans-with-itineraries/${effectiveUserId}`],
    enabled: !!effectiveUserId,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch user's chatrooms for Travel Stats display (created AND joined)
  const { data: userChatrooms = [] } = useQuery<any[]>({
    queryKey: ['/api/users', effectiveUserId, 'chatroom-participation'],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const response = await fetch(`/api/users/${effectiveUserId}/chatroom-participation`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!effectiveUserId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch compatibility score when viewing other users' profiles
  const { data: compatibilityData } = useQuery({
    queryKey: [`/api/compatibility/${currentUser?.id}/${effectiveUserId}`],
    queryFn: async () => {
      if (!currentUser?.id || !effectiveUserId || isOwnProfile) return null;
      const response = await fetch(`/api/compatibility/${currentUser.id}/${effectiveUserId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!(currentUser?.id && effectiveUserId && !isOwnProfile),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Add debug logging
  console.log('Profile component state:', {
    propUserId,
    effectiveUserId,
    fetchedUser: !!fetchedUser,
    userLoading,
    userError: userError?.message,
    hasUser: !!user,
    userType: user?.userType
  });
  
  // Fetch platform statistics (only for nearbytraveler admin)
  const { data: platformStats } = useQuery({
    queryKey: ["/api/stats/platform"],
    enabled: user?.username === 'nearbytraveler', // Only fetch for admin account
  });
  
  // Update localStorage when fresh data is fetched to keep it in sync
  React.useEffect(() => {
    if (fetchedUser && isOwnProfile) {
      localStorage.setItem('travelconnect_user', JSON.stringify(fetchedUser));
      // Dispatch custom event to notify navbar of profile image update
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: fetchedUser }));
    }
  }, [fetchedUser, isOwnProfile]);

  // Cover photo refresh event listeners
  React.useEffect(() => {
    const handleCoverPhotoRefresh = () => {
      console.log('Cover photo refresh event received');
      setCoverPhotoKey(Date.now());
      refetchUser(); // Force re-fetch user data
    };

    const handleForceRefresh = () => {
      console.log('Force refresh event received');
      setCoverPhotoKey(Date.now());
      refetchUser();
    };

    // Listen for cover photo update events
    window.addEventListener('coverPhotoUpdated', handleCoverPhotoRefresh);
    window.addEventListener('forceRefresh', handleForceRefresh);
    window.addEventListener('userDataUpdated', handleCoverPhotoRefresh);

    return () => {
      window.removeEventListener('coverPhotoUpdated', handleCoverPhotoRefresh);
      window.removeEventListener('forceRefresh', handleForceRefresh);
      window.removeEventListener('userDataUpdated', handleCoverPhotoRefresh);
    };
  }, [refetchUser]);

  const getDisplayUserType = (user: User) => {
    // For businesses, always show as "Nearby Business"
    if (user.userType === "business") {
      return "business";
    }
    
    // PRIORITY 1: Check isCurrentlyTraveling flag (most reliable)
    if (user.isCurrentlyTraveling && (user.destinationCity || user.travelDestination)) {
      return "traveler";
    }
    
    // PRIORITY 2: Check current travel plans for active trips
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && user.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = user.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "traveler";
      }
    }
    
    // PRIORITY 3: Fallback to old travel fields for backwards compatibility
    const now = new Date();
    const hasActiveTravelPlans = user.travelStartDate && user.travelEndDate && 
      new Date(user.travelStartDate) <= now && 
      new Date(user.travelEndDate) >= now;
    
    if (hasActiveTravelPlans && user.travelDestination) {
      const travelDestination = user.travelDestination.toLowerCase();
      const hometown = user.hometownCity?.toLowerCase() || '';
      
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "traveler";
      }
    }
    
    // PRIORITY 4: Default based on user type
    return "local";
  };

  // Fetch connections data with filters
  const { data: userConnections = [], refetch: refetchConnections } = useQuery({
    queryKey: [`/api/connections/${effectiveUserId}`, connectionFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (connectionFilters.location?.trim() && connectionFilters.location !== 'all') params.append('location', connectionFilters.location.trim());
      if (connectionFilters.gender?.trim() && connectionFilters.gender !== 'all') params.append('gender', connectionFilters.gender.trim());
      if (connectionFilters.sexualPreference?.trim() && connectionFilters.sexualPreference !== 'all') params.append('sexualPreference', connectionFilters.sexualPreference.trim());
      if (connectionFilters.minAge?.trim()) params.append('minAge', connectionFilters.minAge.trim());
      if (connectionFilters.maxAge?.trim()) params.append('maxAge', connectionFilters.maxAge.trim());
      
      const queryString = params.toString();
      const url = `/api/connections/${effectiveUserId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching connections with filters:', connectionFilters);
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Filtered connections result:', result);
      return result;
    },
    enabled: !!effectiveUserId,
    staleTime: 0, // Always refetch when filters change
  });

  // Fetch quick deals to determine if Flash Deals widget should be shown
  const { data: quickDeals = [] } = useQuery({
    queryKey: ['/api/quick-deals', user?.hometownCity, user?.id],
    queryFn: async () => {
      if (!user?.id || user?.userType !== 'business') return [];
      
      let url = '/api/quick-deals';
      const params = new URLSearchParams();
      
      if (user?.hometownCity) params.append('city', user.hometownCity);
      if (user?.id) params.append('businessId', user.id.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          ...(user?.id && { 'x-user-id': user.id.toString() })
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    },
    enabled: !!user?.id && user?.userType === 'business',
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  // Fetch connection requests (only for own profile)
  const { data: connectionRequests = [] } = useQuery<any[]>({
    queryKey: [`/api/connections/${effectiveUserId}/requests`],
    enabled: !!effectiveUserId && isOwnProfile,
  });

  // Fetch mutual connections for reference dropdown (only for own profile)
  const { data: mutualConnections = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/connections`],
    enabled: !!effectiveUserId && isOwnProfile,
  });

  // Fetch references received by this user (visible to all)
  const { data: userReferences = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/references`],
    enabled: !!effectiveUserId,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch connection status between current user and profile user (for non-own profiles)
  const { data: connectionStatus = { status: 'none' } } = useQuery<{
    status: 'pending' | 'accepted' | 'rejected' | 'none';
    requesterId?: number;
    receiverId?: number;
  }>({
    queryKey: [`/api/connections/status/${currentUser?.id}/${effectiveUserId}`],
    enabled: !!currentUser?.id && !!effectiveUserId && !isOwnProfile,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch user photos for cover photo selection
  const { data: userPhotos = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/photos`],
    enabled: !!effectiveUserId && isOwnProfile,
    staleTime: 0,
    gcTime: 0,
  });





  // Fetch user's travel memories
  const { data: userTravelMemories = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/travel-memories`],
    enabled: !!effectiveUserId,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch business offers for business users
  const { data: businessDeals = [], isLoading: businessDealsLoading } = useQuery<any[]>({
    queryKey: [`/api/business-deals/business/${effectiveUserId}`],
    enabled: !!user && user.userType === 'business' && user.id.toString() === effectiveUserId?.toString(),
    staleTime: 0,
    gcTime: 0,
  });

  // Travel plans query moved above for proper dependency order

  // Clear cache and refetch when viewing different user profiles
  React.useEffect(() => {
    if (effectiveUserId) {
      queryClient.removeQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.removeQueries({ queryKey: [`/api/users/${effectiveUserId}/references`] });
      queryClient.removeQueries({ queryKey: [`/api/users/${effectiveUserId}/photos`] });
      queryClient.removeQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
    }
  }, [effectiveUserId, queryClient]);

  // Force refresh user data when component mounts to get latest travel status
  React.useEffect(() => {
    if (effectiveUserId && isOwnProfile) {
      // Clear ALL localStorage cache to prevent stale data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem(`user_${effectiveUserId}`);
      localStorage.removeItem('authStorage');
      localStorage.removeItem('travelconnect_user');
      
      // Force fresh fetch from database
      queryClient.removeQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      // Also clear auth context and force reload
      if (setAuthUser) {
        setAuthUser(null);
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
        }, 100);
      }
    }
  }, [effectiveUserId, isOwnProfile, queryClient, setAuthUser]);

  // Event discovery logic - same as home page to show current travel destination events
  const eventDiscoveryCity = useMemo(() => {
    console.log('Profile Event discovery memo - currentUserId:', effectiveUserId, 'user:', user?.username, 'loading plans:', isLoadingTravelPlans, 'loading profile:', userLoading);
    console.log('Profile Event discovery memo - travelPlans count:', travelPlans?.length || 0);
    
    // Wait for authentication and data to load
    if (!effectiveUserId || isLoadingTravelPlans || userLoading || !user) {
      console.log('Profile Event discovery - still loading or no auth, returning null to prevent incorrect fallback');
      return null; // Don't show events until we have proper data
    }
    
    // ALWAYS use travel destination when available - NEVER hide travel info
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination) {
      console.log('Profile Event discovery - FINAL CITY SELECTION (traveling):', currentDestination);
      return currentDestination;
    }
    
    // Otherwise show hometown events
    const hometownLocation = user.hometownCity ? 
      (user.hometownState ? `${user.hometownCity}, ${user.hometownState}` : `${user.hometownCity}, ${user.hometownCountry}`) :
      user.location;
    
    console.log('Profile Event discovery - FINAL CITY SELECTION (hometown):', hometownLocation);
    return hometownLocation;
  }, [effectiveUserId, user, travelPlans, isLoadingTravelPlans, userLoading]);
  
  const { data: profileEvents = [], isLoading: profileEventsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/all-events`],
    queryFn: async () => {
      if (!effectiveUserId) {
        console.log('Profile - No user ID specified, returning empty events');
        return [];
      }
      console.log('Profile - Fetching joined events for user:', effectiveUserId);
      const response = await fetch(`/api/users/${effectiveUserId}/all-events`);
      if (!response.ok) throw new Error('Failed to fetch user events');
      const data = await response.json();
      console.log('Profile User Events API response:', data.length, 'joined events for user', effectiveUserId);
      return data;
    },
    enabled: !!effectiveUserId && !isLoadingTravelPlans && !userLoading,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Ensure fresh data when returning to tab
  });



  // Get the current user type for schema selection
  const currentUserType = user?.userType || 'traveler';
  const dynamicProfileSchema = getDynamicProfileSchema(currentUserType);
  
  const profileForm = useForm<z.infer<typeof dynamicProfileSchema>>({
    resolver: zodResolver(dynamicProfileSchema),
    defaultValues: currentUserType === 'business' ? {
      bio: "",
      businessName: "",
      businessDescription: "",
      businessType: "",
      location: "",
      city: "",
      state: "",
      country: "",
      hometownCity: "",
      hometownState: "",
      hometownCountry: "",
      streetAddress: "",
      zipCode: "",
      phoneNumber: "",
      websiteUrl: "",
      // Owner/Internal Contact Information
      ownerName: "",
      ownerPhone: "",
      travelStyle: [],
      interests: [],
      activities: [],
      events: [],
      customInterests: "",
      customActivities: "",
      customEvents: "",
      isVeteran: false,
      isActiveDuty: false,
      isMinorityOwned: false,
      isFemaleOwned: false,
      isLGBTQIAOwned: false,
      showMinorityOwned: true,
      showFemaleOwned: true,
      showLGBTQIAOwned: true,
    } : {
      bio: "",
      secretActivities: "",
      hometownCity: "",
      hometownState: "",
      hometownCountry: "",
      dateOfBirth: "",
      ageVisible: false,
      gender: "",
      sexualPreference: [],
      sexualPreferenceVisible: false,
      travelStyle: [],
      travelingWithChildren: false,
      childrenAges: "",
      isVeteran: false,
      isActiveDuty: false,
    },
  });

  // Update form values when user data changes (fresh from database)
  React.useEffect(() => {
    if (user && !userLoading) {
      console.log('Updating profile form with fresh user data:', {
        hometownCity: user.hometownCity,
        hometownState: user.hometownState,
        hometownCountry: user.hometownCountry
      });
      
      // Initialize temp values for editing - EXCLUDE top choices from interests to prevent duplication
      setTempInterests((user.interests || []).filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)));
      setTempActivities(user.activities || []);
      setTempEvents(user.events || []);
      
      // Initialize editFormData with current user preferences - EXCLUDE top choices from interests
      setEditFormData({
        interests: (user.interests || []).filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)),
        activities: user.activities || [],
        events: user.events || []
      });
      
      // Reset form with user type-specific data
      if (user.userType === 'business') {
        // Extract custom entries from the arrays (entries not in predefined lists)
        const customInterests = (user.interests || [])
          .filter((item: string) => !MOST_POPULAR_INTERESTS.includes(item) && !ADDITIONAL_INTERESTS.includes(item))
          .join(', ');
        const customActivities = (user.activities || [])
          .filter((item: string) => !safeGetAllActivities().includes(item))
          .join(', ');
        const customEvents = (user.events || [])
          .filter((item: string) => !safeGetAllEvents().includes(item))
          .join(', ');
        
        // Only include predefined entries in the checkbox arrays
        const predefinedInterests = (user.interests || [])
          .filter((item: string) => MOST_POPULAR_INTERESTS.includes(item) || ADDITIONAL_INTERESTS.includes(item));
        const predefinedActivities = (user.activities || [])
          .filter((item: string) => safeGetAllActivities().includes(item));
        const predefinedEvents = (user.events || [])
          .filter((item: string) => safeGetAllEvents().includes(item));
        
        profileForm.reset({
          bio: user.bio || "",
          businessName: (user as any).business_name || (user as any).businessName || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? 
            (typeof user.dateOfBirth === 'string' ? user.dateOfBirth : new Date(user.dateOfBirth).toISOString().split('T')[0]) : "",
          travelStyle: user.travelStyle || [],
          businessDescription: (user as any).business_description || (user as any).businessDescription || "",
          businessType: (user as any).business_type || (user as any).businessType || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          location: user.location || "",
          streetAddress: (user as any).street_address || (user as any).streetAddress || "",
          zipCode: (user as any).zip_code || (user as any).zipCode || "",
          phoneNumber: (user as any).phone_number || (user as any).phoneNumber || "",
          websiteUrl: (user as any).website_url || (user as any).websiteUrl || (user as any).website || "",
          interests: predefinedInterests,
          activities: predefinedActivities,
          events: predefinedEvents,
          isVeteran: Boolean((user as any).is_veteran || user.isVeteran),
          isActiveDuty: Boolean((user as any).is_active_duty || user.isActiveDuty),
          customInterests: (user as any).customInterests || "",
          customActivities: (user as any).customActivities || "",
          customEvents: (user as any).customEvents || "",
        });
      } else {
        const travelingWithChildrenValue = !!(user as any).travelingWithChildren;
        
        profileForm.reset({
          bio: user.bio || "",
          secretActivities: user.secretActivities || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? 
            (typeof user.dateOfBirth === 'string' ? user.dateOfBirth : new Date(user.dateOfBirth).toISOString().split('T')[0]) : "",
          ageVisible: Boolean(user.ageVisible),
          gender: user.gender || "",
          sexualPreference: user.sexualPreference || [],
          sexualPreferenceVisible: Boolean(user.sexualPreferenceVisible),
          travelStyle: user.travelStyle || [],
          travelWhy: user.travelWhy || "",
          travelHow: user.travelHow || "",
          travelBudget: user.travelBudget || "",
          travelGroup: user.travelGroup || "",
          travelingWithChildren: travelingWithChildrenValue,
          childrenAges: (user as any).children_ages || (user as any).childrenAges || "",
          isVeteran: Boolean((user as any).is_veteran || user.isVeteran),
          isActiveDuty: Boolean((user as any).is_active_duty || user.isActiveDuty),
          // interests: user.interests || [],
          // activities: user.activities || [],
          // events: user.events || [],
          customInterests: (user as any).customInterests || (user as any).custom_interests || "",
          customActivities: (user as any).customActivities || (user as any).custom_activities || "",
          customEvents: (user as any).customEvents || (user as any).custom_events || "",
        });
        
        // Force set the value after reset to ensure React Hook Form properly registers it
        setTimeout(() => {
          profileForm.setValue('travelingWithChildren', travelingWithChildrenValue);
        }, 100);
      }
    }
  }, [user, userLoading, profileForm]);

  // Re-populate form when dialog opens to ensure latest data is shown
  React.useEffect(() => {
    if (isEditMode && user && !userLoading) {
      console.log('🔥 Re-syncing form with updated user data');
      
      // For business users, extract and set custom fields
      if (user.userType === 'business') {
        const customInterests = (user.interests || [])
          .filter((item: string) => !MOST_POPULAR_INTERESTS.includes(item) && !ADDITIONAL_INTERESTS.includes(item))
          .join(', ');
        const customActivities = (user.activities || [])
          .filter((item: string) => !safeGetAllActivities().includes(item))
          .join(', ');
        const customEvents = (user.events || [])
          .filter((item: string) => !safeGetAllEvents().includes(item))
          .join(', ');
        
        const predefinedInterests = (user.interests || [])
          .filter((item: string) => MOST_POPULAR_INTERESTS.includes(item) || ADDITIONAL_INTERESTS.includes(item));
        const predefinedActivities = (user.activities || [])
          .filter((item: string) => safeGetAllActivities().includes(item));
        const predefinedEvents = (user.events || [])
          .filter((item: string) => safeGetAllEvents().includes(item));
        
        profileForm.reset({
          bio: user.bio || "",
          businessName: (user as any).business_name || (user as any).businessName || "",
          businessDescription: (user as any).business_description || (user as any).businessDescription || "",
          businessType: (user as any).business_type || (user as any).businessType || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? 
            (typeof user.dateOfBirth === 'string' ? user.dateOfBirth : new Date(user.dateOfBirth).toISOString().split('T')[0]) : "",
          travelStyle: user.travelStyle || [],
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          location: user.location || "",
          streetAddress: (user as any).street_address || (user as any).streetAddress || "",
          zipCode: (user as any).zip_code || (user as any).zipCode || "",
          phoneNumber: (user as any).phone_number || (user as any).phoneNumber || "",
          websiteUrl: (user as any).website_url || (user as any).websiteUrl || (user as any).website || "",

          interests: predefinedInterests,
          activities: predefinedActivities,
          events: predefinedEvents,
          customInterests: customInterests || user.customInterests || "",
          customActivities: customActivities || user.customActivities || "",
          customEvents: customEvents || user.customEvents || "",
          isVeteran: !!user.isVeteran || !!((user as any).is_veteran),
          isActiveDuty: !!user.isActiveDuty || !!((user as any).is_active_duty),
          isMinorityOwned: !!user.isMinorityOwned,
          isFemaleOwned: !!user.isFemaleOwned,
          isLGBTQIAOwned: !!user.isLGBTQIAOwned,
          showMinorityOwned: user.showMinorityOwned !== false,
          showFemaleOwned: user.showFemaleOwned !== false,
          showLGBTQIAOwned: user.showLGBTQIAOwned !== false,
        });
      } else {
        // For non-business users, reset with their data
        profileForm.reset({
          bio: user.bio || "",
          secretActivities: user.secretActivities || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? 
            (typeof user.dateOfBirth === 'string' ? user.dateOfBirth : new Date(user.dateOfBirth).toISOString().split('T')[0]) : "",
          ageVisible: !!user.ageVisible,
          gender: user.gender || "",
          sexualPreference: user.sexualPreference || [],
          sexualPreferenceVisible: !!user.sexualPreferenceVisible,
          travelStyle: user.travelStyle || [],
          travelingWithChildren: !!user.travelingWithChildren,
          childrenAges: user.childrenAges || (user as any).children_ages || "",
          isVeteran: !!user.isVeteran || !!((user as any).is_veteran),
          isActiveDuty: !!user.isActiveDuty || !!((user as any).is_active_duty),
        });
      }
    }
  }, [isEditMode, user, userLoading, profileForm]);


  // Form for editing references
  const editReferenceForm = useForm({
    defaultValues: {
      content: "",
      experience: "positive" as const,
    },
  });

  // Update reference mutation
  const updateReference = useMutation({
    mutationFn: async ({ referenceId, content, experience }: { referenceId: number; content: string; experience: string }) => {
      const response = await fetch(`/api/references/${referenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, experience }),
      });
      if (!response.ok) throw new Error('Failed to update reference');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/references`] });
      setShowEditModal(false);
      setEditingReference(null);
      editReferenceForm.reset();
      toast({
        title: "Reference updated",
        description: "Your reference has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update reference error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update reference. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reference form
  const referenceForm = useForm({
    defaultValues: {
      content: "",
      experience: "positive",
    },
  });

  // Create reference mutation
  const createReference = useMutation({
    mutationFn: async (referenceData: any) => {
      const payload = {
        reviewerId: currentUser?.id,
        revieweeId: effectiveUserId, // Use the profile user ID  
        experience: referenceData.experience || "positive",
        content: referenceData.content || "",
      };
      
      const response = await fetch('/api/user-references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create reference');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/references`] });
      toast({
        title: "Reference submitted",
        description: "Your reference has been posted successfully.",
      });
      setShowReferenceForm(false);
      setShowWriteReferenceModal(false);
      referenceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error?.message || "Failed to submit reference. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        bio: user.bio || "",
        ...(user?.userType === 'business' ? { 
          businessName: (user as any).business_name || (user as any).businessName || "",
          businessDescription: (user as any).business_description || (user as any).businessDescription || "",
        } : {}),
        hometownCity: user.hometownCity || "",
        hometownState: user.hometownState || "",
        hometownCountry: user.hometownCountry || "",
        dateOfBirth: user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "",
        ageVisible: user.ageVisible || false,
        gender: user.gender || "",
        secretActivities: user.secretActivities || "",
        sexualPreference: Array.isArray(user.sexualPreference) ? user.sexualPreference : (user.sexualPreference ? [user.sexualPreference] : []),
        sexualPreferenceVisible: user.sexualPreferenceVisible || false,
        travelStyle: Array.isArray(user.travelStyle) ? user.travelStyle : [],
        isVeteran: (user as any).is_veteran || user.isVeteran || false,
        isActiveDuty: (user as any).is_active_duty || user.isActiveDuty || false,
        // Business contact fields - only for business users
        ...(user?.userType === 'business' ? {
          streetAddress: (user as any).streetAddress || "",
        } : {}),
        ...(user?.userType === 'business' ? {
          zipCode: (user as any).zipCode || "",
          phoneNumber: (user as any).phoneNumber || "",
          websiteUrl: (user as any).websiteUrl || "",
        } : {}),
      });
    }
  }, [user, profileForm]);

  // Fetch user photos from photo gallery
  const { data: photos = [], isLoading: photosLoading } = useQuery<UserPhoto[]>({
    queryKey: [`/api/users/${effectiveUserId}/photos`],
    enabled: !!effectiveUserId,
  });

  // Fetch passport stamps for world map
  const { data: stamps = [] } = useQuery<PassportStamp[]>({
    queryKey: [`/api/users/${effectiveUserId}/passport-stamps`],
    enabled: !!effectiveUserId,
  });



  // Fetch user references
  const { data: references = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/references`],
    enabled: !!effectiveUserId,
  });

  // Fetch user vouches
  const { data: vouches = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${effectiveUserId}/vouches`],
    enabled: !!effectiveUserId,
  });

  // Photo upload mutation with adaptive compression
  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Use adaptive compression before upload
        const compressedFile = await compressPhotoAdaptive(file);
        
        // Convert compressed file to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Data = reader.result as string;
              const response = await fetch(`/api/users/${effectiveUserId}/photos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: effectiveUserId,
                  imageData: base64Data,
                  title: 'Travel Photo',
                  isPublic: true
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload photo');
              }
              const result = await response.json();
              
              resolve(result);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
      } catch (compressionError) {
        console.warn('Photo compression failed, using original file:', compressionError);
        // Fall back to original file if compression fails
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Data = reader.result as string;
              const response = await fetch(`/api/users/${effectiveUserId}/photos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: effectiveUserId,
                  imageData: base64Data,
                  title: 'Travel Photo',
                  isPublic: true
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload photo');
              }
              const result = await response.json();
              
              resolve(result);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/photos`] });
      toast({
        title: "Photo uploaded",
        description: "Your photo has been added to your profile.",
      });
      setUploadingPhoto(false);
    },
    onError: (error: any) => {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setUploadingPhoto(false);
    },
  });

  // Photo deletion mutation
  const deletePhoto = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete photo');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate ALL photo-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/photos`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', effectiveUserId, 'photos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      // Force refetch to update UI immediately
      queryClient.refetchQueries({ queryKey: [`/api/users/${effectiveUserId}/photos`] });
      toast({
        title: "Photo deleted",
        description: "Your photo has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Travel plan deletion mutation
  const deleteTravelPlan = useMutation({
    mutationFn: async (planId: number) => {
      const response = await fetch(`/api/travel-plans/${planId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete travel plan');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all travel plan and user-related queries to ensure consistency across the entire application
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/travel-plans`] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate matches page data since travel plans affect matching
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-by-location"] });
      
      toast({
        title: "Travel plan deleted",
        description: "Your travel plan has been removed from everywhere on the site.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete travel plan. Please try again.",
        variant: "destructive",
      });
    },
  });




  // Profile photo update mutation with size validation and compression
  const updateProfilePhoto = useMutation({
    mutationFn: async (file: File) => {
      // File size validation (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Image file is too large. Please choose an image smaller than 5MB.');
      }

      // Image type validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate dimensions to maintain aspect ratio (max 400x400)
            const MAX_DIMENSION = 400;
            let { width, height } = img;
            
            if (width > height) {
              if (width > MAX_DIMENSION) {
                height = (height * MAX_DIMENSION) / width;
                width = MAX_DIMENSION;
              }
            } else {
              if (height > MAX_DIMENSION) {
                width = (width * MAX_DIMENSION) / height;
                height = MAX_DIMENSION;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress the image
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with compression (85% quality)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            
            // Final size check for base64 data (500KB limit)
            const MAX_BASE64_SIZE = 500 * 1024; // 500KB
            if (compressedBase64.length > MAX_BASE64_SIZE) {
              // Try with lower quality
              const lowerQualityBase64 = canvas.toDataURL('image/jpeg', 0.65);
              if (lowerQualityBase64.length > MAX_BASE64_SIZE) {
                throw new Error('Image is still too large after compression. Please choose a smaller image.');
              }
              console.log('Profile image compressed to lower quality, final size:', lowerQualityBase64.length);
              resolve(apiRequest('PUT', `/api/users/${effectiveUserId}/profile-photo`, {
                imageData: lowerQualityBase64
              }));
            } else {
              console.log('Profile image compressed successfully, final size:', compressedBase64.length);
              resolve(apiRequest('PUT', `/api/users/${effectiveUserId}/profile-photo`, {
                imageData: compressedBase64
              }));
            }
          } catch (error) {
            console.error('Image processing error:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image. Please try a different image.'));
        };
        
        // Create object URL for the image
        img.src = URL.createObjectURL(file);
      });
    },
    onSuccess: async (response: any) => {
      // API returns { user, profileImage, message } - extract the user data
      const updatedUser = response?.user || response;
      console.log('Profile upload success, user has image:', !!updatedUser?.profileImage);
      
      // Update localStorage immediately
      if (updatedUser && isOwnProfile) {
        console.log('Updating auth storage and context with new profile data');
        authStorage.setUser(updatedUser);
        
        // CRITICAL: Update auth context state immediately using the correct function
        if (typeof setAuthUser === 'function') {
          console.log('Calling setAuthUser with updated profile data for navbar refresh');
          setAuthUser(updatedUser);
        }
        
        // Also update localStorage directly as backup
        localStorage.setItem('travelconnect_user', JSON.stringify(updatedUser));
        
        // Force immediate refresh of all user data
        queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
        queryClient.setQueryData(['/api/users'], (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(u => u.id === updatedUser.id ? updatedUser : u);
          }
          return oldData;
        });
        
        // Trigger multiple events with immediate and delayed intervals
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: updatedUser }));
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        }, 50);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshNavbar', { detail: updatedUser }));
        }, 100);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('forceNavbarRefresh', { detail: updatedUser }));
        }, 150);
        
        setTimeout(() => {
          // Force complete page refresh of user queries
          queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        }, 200);
        
        console.log('Profile photo update completed with immediate context update');
      }
      
      toast({
        title: "Success!",
        description: "Avatar updated successfully.",
      });
      setUploadingPhoto(false);
      
      // CRITICAL: Close the photo upload modal after successful upload
      setShowPhotoUpload(false);
    },
    onError: (error) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
      setUploadingPhoto(false);
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      uploadPhoto.mutate(file);
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    if (window.confirm("Are you sure you want to delete this photo? This cannot be undone.")) {
      deletePhoto.mutate(photoId);
    }
  };

  const handleDeleteTravelPlan = (plan: TravelPlan) => {
    setDeletingTravelPlan(plan);
  };

  const confirmDeleteTravelPlan = () => {
    if (deletingTravelPlan) {
      deleteTravelPlan.mutate(deletingTravelPlan.id);
      setDeletingTravelPlan(null);
    }
  };

  // Handle selecting photo from gallery as cover photo - using same logic as profile photo
  const handlePhotoAsCoverPhoto = async (photoUrl: string) => {
    try {
      setUploadingPhoto(true);
      
      const responseData = await apiRequest('PUT', `/api/users/${effectiveUserId}/cover-photo`, {
        imageData: photoUrl
      });
      
      console.log('Cover photo update response:', responseData);
      
      // Extract user data from API response (API returns { user, coverPhoto, message }) - SAME AS PROFILE PHOTO
      const updatedUser = (responseData as any)?.user || responseData || {};
      console.log('Gallery cover photo upload success, user has cover:', !!updatedUser?.coverPhoto);
      
      // Update cache key to force immediate image refresh
      const newCacheKey = Date.now();
      setCoverPhotoKey(newCacheKey);
      
      // Update localStorage immediately - SAME AS PROFILE PHOTO
      if (updatedUser && isOwnProfile) {
        console.log('Updating auth storage and context with new gallery cover photo data');
        authStorage.setUser(updatedUser);
        
        // CRITICAL: Update auth context state immediately using the correct function
        if (typeof setAuthUser === 'function') {
          console.log('Calling setAuthUser with updated gallery cover photo data for navbar refresh');
          setAuthUser(updatedUser);
        }
        
        // Also update localStorage directly as backup
        localStorage.setItem('travelconnect_user', JSON.stringify(updatedUser));
        
        // Force immediate refresh of all user data
        queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
        queryClient.setQueryData(['/api/users'], (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(u => u.id === updatedUser.id ? updatedUser : u);
          }
          return oldData;
        });
        
        // Trigger multiple events with immediate and delayed intervals - SAME AS PROFILE PHOTO
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: updatedUser }));
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        }, 50);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshNavbar', { detail: updatedUser }));
        }, 100);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('forceNavbarRefresh', { detail: updatedUser }));
        }, 150);
        
        setTimeout(() => {
          // Force complete page refresh of user queries
          queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        }, 200);
        
        // Also trigger cover photo specific events
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('coverPhotoUpdated', { detail: { userId: effectiveUserId, timestamp: newCacheKey } }));
        }, 250);
        
        console.log('Gallery cover photo update completed with immediate context update');
      }
      
      toast({
        title: "Success!",
        description: "Cover photo updated successfully.",
      });
    } catch (error) {
      console.error('Cover photo update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update cover photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };



  // Handle avatar upload from file input
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB for avatar)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an avatar image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Avatar upload starting for file:', file.name, 'size:', file.size);
      setUploadingPhoto(true);
      
      // Direct upload function call with adaptive compression
      try {
        // Use adaptive compression for profile photos
        const compressedFile = await compressPhotoAdaptive(file);
        
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            console.log('Compressed file converted to base64, uploading...');
            
            const response = await fetch(`/api/users/${effectiveUserId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileImage: base64 })
            });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }
          
          const updatedUser = await response.json();
          console.log('Avatar upload successful:', updatedUser.username);
          
          // Update auth immediately
          authStorage.setUser(updatedUser);
          if (setAuthUser && isOwnProfile) {
            setAuthUser(updatedUser);
          }
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          
          // Trigger navbar refresh
          window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
          
          toast({
            title: "Success",
            description: "Avatar updated successfully!",
          });
          
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          toast({
            title: "Upload Failed",
            description: error?.message || "Failed to upload avatar",
            variant: "destructive",
          });
        } finally {
          setUploadingPhoto(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setUploadingPhoto(false);
      };
      
      reader.readAsDataURL(compressedFile);
      } catch (compressionError: any) {
        console.warn('Photo compression failed, using original file:', compressionError);
        // Fall back to original file if compression fails
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            console.log('Original file converted to base64, uploading...');
            
            const response = await fetch(`/api/users/${effectiveUserId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileImage: base64 })
            });
            
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const updatedUser = await response.json();
            console.log('Avatar upload successful:', updatedUser.username);
            
            // Update auth immediately
            authStorage.setUser(updatedUser);
            if (setAuthUser && isOwnProfile) {
              setAuthUser(updatedUser);
            }
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            
            // Trigger navbar refresh
            window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
            
            toast({
              title: "Success",
              description: "Avatar updated successfully!",
            });
            
          } catch (error: any) {
            console.error('Avatar upload error:', error);
            toast({
              title: "Upload Failed",
              description: error?.message || "Failed to upload avatar",
              variant: "destructive",
            });
          } finally {
            setUploadingPhoto(false);
          }
        };
        
        reader.onerror = () => {
          console.error('Failed to read file');
          toast({
            title: "Error",
            description: "Failed to read image file",
            variant: "destructive",
          });
          setUploadingPhoto(false);
        };
        
        reader.readAsDataURL(file);
      }
    }
    // Clear the input to allow same file selection
    e.target.value = '';
  };

  // Handle profile photo upload (separate from avatar)
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Profile photo upload starting for file:', file.name, 'size:', file.size);
      setUploadingPhoto(true);
      updateProfilePhoto.mutate(file);
    }
    // Clear the input to allow same file selection
    e.target.value = '';
  };

  // Cover photo upload handler with size validation and compression
  const handleCoverPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Cover photo file selected:', file.name, 'size:', file.size);
      
      // File size validation (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Cover photo must be smaller than 5MB. Please choose a smaller image.",
          variant: "destructive",
        });
        return;
      }

      // Image type validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }

      setUploadingPhoto(true);
      
      // Use canvas for compression similar to profile image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        try {
          // Calculate dimensions for cover photo (max 1200x400 for wide aspect ratio)
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 400;
          let { width, height } = img;
          
          const aspectRatio = width / height;
          
          if (width > MAX_WIDTH) {
            width = MAX_WIDTH;
            height = width / aspectRatio;
          }
          
          if (height > MAX_HEIGHT) {
            height = MAX_HEIGHT;
            width = height * aspectRatio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress the image
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (80% quality for cover photos)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.80);
          
          // Final size check for base64 data (800KB limit for cover photos)
          const MAX_BASE64_SIZE = 800 * 1024; // 800KB
          if (compressedBase64.length > MAX_BASE64_SIZE) {
            // Try with lower quality
            const lowerQualityBase64 = canvas.toDataURL('image/jpeg', 0.60);
            if (lowerQualityBase64.length > MAX_BASE64_SIZE) {
              throw new Error('Cover photo is still too large after compression. Please choose a smaller image.');
            }
            console.log('Cover photo compressed to lower quality, final size:', lowerQualityBase64.length);
            await uploadCoverPhoto(lowerQualityBase64);
          } else {
            console.log('Cover photo compressed successfully, final size:', compressedBase64.length);
            await uploadCoverPhoto(compressedBase64);
          }
        } catch (error) {
          console.error('Cover photo processing error:', error);
          toast({
            title: "Upload failed",
            description: "Failed to process cover photo. Please try again.",
            variant: "destructive",
          });
          setUploadingPhoto(false);
        }
      };
      
      img.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to load image. Please try a different image.",
          variant: "destructive",
        });
        setUploadingPhoto(false);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  // Simplified cover photo upload function
  const uploadCoverPhoto = async (base64Data: string) => {
    try {
      console.log('Starting cover photo upload...', base64Data.length);
      
      const response = await fetch(`/api/users/${effectiveUserId}/cover-photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Cover photo API response:', responseData);
      
      // Extract user data from response
      const updatedUser = responseData?.user || responseData;
      
      if (updatedUser && isOwnProfile) {
        // Update cache key for immediate display refresh
        const newCacheKey = Date.now();
        setCoverPhotoKey(newCacheKey);
        
        // Update auth context and localStorage - SAME AS PROFILE PHOTO
        authStorage.setUser(updatedUser);
        if (typeof setAuthUser === 'function') {
          console.log('Calling setAuthUser with updated cover photo data for immediate UI refresh');
          setAuthUser(updatedUser);
        }
        
        // Update localStorage directly as backup
        localStorage.setItem('travelconnect_user', JSON.stringify(updatedUser));
        
        // Force immediate refresh of all user data - CRITICAL FOR COVER PHOTO DISPLAY
        queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
        queryClient.setQueryData(['/api/users'], (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(u => u.id === updatedUser.id ? updatedUser : u);
          }
          return oldData;
        });
        
        // Trigger multiple refresh events
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: updatedUser }));
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        window.dispatchEvent(new CustomEvent('coverPhotoUpdated', { detail: { userId: effectiveUserId, timestamp: newCacheKey, user: updatedUser } }));
        
        setTimeout(() => {
          // Force complete page refresh of user queries
          queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        }, 100);
        
        console.log('Cover photo update completed with immediate context update');
      }
      
      toast({
        title: "Success!",
        description: "Cover photo updated successfully.",
      });
      
      setUploadingPhoto(false);
    } catch (error) {
      console.error('Cover photo upload error:', error);
      toast({
        title: "Upload failed", 
        description: "Failed to update cover photo. Please try again.",
        variant: "destructive",
      });
      setUploadingPhoto(false);
    }
  };

  // Handle editing travel plan
  const handleEditTravelPlan = (plan: TravelPlan) => {
    console.log('Editing travel plan:', plan);
    console.log('Travel style from plan:', plan.travelStyle);
    setEditingTravelPlan(plan);
    
    // Parse destination into separate components
    const destination = plan.destination || "";
    const parts = destination.split(', ');
    let destinationCity = "";
    let destinationState = "";
    let destinationCountry = "";
    
    if (parts.length >= 3) {
      destinationCity = parts[0] || "";
      destinationState = parts[1] || "";
      destinationCountry = parts[2] || "";
    } else if (parts.length === 2) {
      destinationCity = parts[0] || "";
      destinationCountry = parts[1] || "";
    } else if (parts.length === 1) {
      destinationCity = parts[0] || "";
    }
    
    // Update local state for form controls
    setSelectedCountry(destinationCountry);
    setSelectedCity(destinationCity);
    setSelectedState(destinationState);
    
    form.reset({
      destination: destination,
      destinationCountry: destinationCountry,
      destinationCity: destinationCity,
      destinationState: destinationState,
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : "",
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : "",
      interests: Array.isArray(plan.interests) ? plan.interests : [],
      activities: Array.isArray(plan.activities) ? plan.activities : [],
      events: Array.isArray(plan.events) ? plan.events : [],
      travelStyle: Array.isArray(plan.travelStyle) ? plan.travelStyle : (plan.travelStyle ? [plan.travelStyle] : []),
      accommodation: plan.accommodation || "",
      transportation: plan.transportation || "",
      notes: plan.notes || "",
      isVeteran: false,
      isActiveDuty: false,
    });
  };

  // Travel plan edit mutation
  const editTravelPlan = useMutation({
    mutationFn: async (data: z.infer<typeof travelPlanSchema>) => {
      if (!editingTravelPlan) throw new Error("No travel plan selected");
      
      const response = await fetch(`/api/travel-plans/${editingTravelPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: `${data.destinationCity}${data.destinationState ? `, ${data.destinationState}` : ''}${data.destinationCountry ? `, ${data.destinationCountry}` : ''}`,
          destinationCountry: data.destinationCountry,
          destinationCity: data.destinationCity,
          destinationState: data.destinationState,
          startDate: data.startDate ? data.startDate + 'T00:00:00.000Z' : null,
          endDate: data.endDate ? data.endDate + 'T00:00:00.000Z' : null,
          interests: Array.isArray(data.interests) ? data.interests : [],
          activities: Array.isArray(data.activities) ? data.activities : [],
          events: Array.isArray(data.events) ? data.events : [],
          travelStyle: Array.isArray(data.travelStyle) ? data.travelStyle : [],
          accommodation: data.accommodation || "",
          transportation: data.transportation || "",
          notes: data.notes || "",
          isVeteran: false,
          isActiveDuty: false,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update travel plan');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all travel plan and user-related queries to ensure consistency across the entire application
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/travel-plans`] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate matches page data since travel plans affect matching
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-by-location"] });
      // CRITICAL: Invalidate all event queries since changing travel destination changes which events are shown
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "Travel plan updated",
        description: "Your changes have been applied throughout the site.",
      });
      setEditingTravelPlan(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update travel plan. Please try again.",
        variant: "destructive",
      });
    },
  });



  // Widget edit mutations
  const updateInterests = useMutation({
    mutationFn: async (interests: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        interests
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      toast({
        title: "Interests updated",
        description: "Your interests have been successfully updated.",
      });
      setEditingInterests(false);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update interests. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateActivities = useMutation({
    mutationFn: async (activities: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        activities: activities
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Activities updated",
        description: "Your activities have been successfully updated.",
      });
      setEditingActivities(false);
      setTempActivities([]);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update activities. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEvents = useMutation({
    mutationFn: async (events: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        events: events
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Events updated",
        description: "Your events have been successfully updated.",
      });
      setEditingEvents(false);
      setTempEvents([]);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update events. Please try again.",
        variant: "destructive",
      });
      setEditingEvents(false);
      setTempEvents([]);
    },
  });

  const updateLanguages = useMutation({
    mutationFn: async (languages: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        languagesSpoken: languages
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      toast({
        title: "Languages updated",
        description: "Your languages have been successfully updated.",
      });
      setEditingLanguages(false);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update languages. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCountries = useMutation({
    mutationFn: async (countries: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        countriesVisited: countries
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      toast({
        title: "Countries updated",
        description: "Your countries visited have been successfully updated.",
      });
      setEditingCountries(false);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update countries. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit handlers
  const handleEditInterests = () => {
    console.log('🔧 EDIT INTERESTS: Starting edit mode', { 
      user: user?.username, 
      userInterests: user?.interests,
      editingInterests,
      tempInterests 
    });
    if (!user) {
      console.log('❌ EDIT INTERESTS: No user data available');
      return;
    }
    const userInterests = user.interests || [];
    console.log('🔧 EDIT INTERESTS: Setting temp interests to:', userInterests);
    setTempInterests(userInterests);
    setEditingInterests(true);
    console.log('🔧 EDIT INTERESTS: Edit mode activated');
  };

  const handleSaveInterests = () => {
    updateInterests.mutate(tempInterests);
  };

  const handleCancelInterests = () => {
    setEditingInterests(false);
    setTempInterests([]);
  };

  const handleEditActivities = () => {
    if (!user) return;
    setTempActivities(user.activities || []);
    setEditingActivities(true);
  };

  const handleSaveActivities = () => {
    updateActivities.mutate(tempActivities);
  };

  const handleCancelActivities = () => {
    setEditingActivities(false);
    setTempActivities([]);
  };

  const handleEditEvents = () => {
    if (!user) return;
    setTempEvents(user.events || []);
    setEditingEvents(true);
  };

  const handleSaveEvents = () => {
    updateEvents.mutate(tempEvents);
  };

  const handleCancelEvents = () => {
    setEditingEvents(false);
    setTempEvents([]);
  };

  // CRITICAL: Main save function that properly separates private interests
  const handleSave = async () => {
    if (!user) return false;
    
    try {
      console.log('🔧 COMPREHENSIVE SAVE: Starting save process');
      
      // Separate private interests from regular interests
      const privateInterestsSet = new Set(getPrivateInterests());
      
      // Split interests based on whether they're private
      const regularInterests = editFormData.interests.filter(interest => !privateInterestsSet.has(interest));
      const privateInterests = editFormData.interests.filter(interest => privateInterestsSet.has(interest));
      
      console.log('🔧 PRIVATE INTERESTS: Separated interests', {
        totalInterests: editFormData.interests.length,
        regularInterests: regularInterests.length,
        privateInterests: privateInterests.length,
        privateInterestsList: privateInterests
      });
      
      // Prepare the update payload with separated interests
      const updateData: any = {
        interests: regularInterests,
        privateInterests: privateInterests,
        activities: editFormData.activities,
        events: editFormData.events
      };
      
      console.log('🔧 SAVE PAYLOAD: Sending update with separated data', updateData);
      
      // Send the update request
      const response = await fetch(`/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // Update the query cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      toast({
        title: "All preferences saved!",
        description: `Successfully saved ${regularInterests.length} public interests, ${privateInterests.length} private interests, ${editFormData.activities.length} activities, and ${editFormData.events.length} events.`,
      });
      
      console.log('✓ COMPREHENSIVE SAVE: All preferences saved successfully');
      return true;
    } catch (error) {
      console.error('❌ COMPREHENSIVE SAVE: Save failed:', error);
      toast({
        title: "Save failed",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Force reset all editing states
  const forceResetEditingStates = () => {
    setEditingInterests(false);
    setEditingActivities(false);
    setEditingEvents(false);
    setEditingLanguages(false);
    setEditingCountries(false);
    setEditingBio(false);
    setEditingBusinessDescription(false);
    setTempInterests([]);
    setTempActivities([]);
    setTempEvents([]);
    setTempLanguages([]);
    setTempCountries([]);
    setTempBio("");
    setCustomLanguageInput('');
    setCustomCountryInput('');
    setBusinessDescriptionForm({
      services: '',
      specialOffers: '',
      targetCustomers: '',
      certifications: ''
    });
  };

  const handleEditLanguages = () => {
    if (!user) return;
    setTempLanguages(user.languagesSpoken || []);
    setEditingLanguages(true);
  };

  const handleSaveLanguages = () => {
    updateLanguages.mutate(tempLanguages);
  };

  const handleCancelLanguages = () => {
    setEditingLanguages(false);
    setTempLanguages([]);
  };

  const handleEditCountries = () => {
    if (!user) return;
    setTempCountries(user.countriesVisited || []);
    setEditingCountries(true);
  };

  const handleSaveCountries = () => {
    updateCountries.mutate(tempCountries);
  };

  const handleCancelCountries = () => {
    setEditingCountries(false);
    setTempCountries([]);
  };

  // Business description editing handlers
  const handleSaveBusinessDescription = async () => {
    if (!user) return;
    setSavingBusinessDescription(true);
    
    try {
      const response = await fetch(`/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: businessDescriptionForm.services,
          specialOffers: businessDescriptionForm.specialOffers,
          targetCustomers: businessDescriptionForm.targetCustomers,
          certifications: businessDescriptionForm.certifications,
        }),
      });

      if (!response.ok) throw new Error('Failed to update business description');

      // Update the query cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      toast({
        title: "Business description updated",
        description: "Your business information has been successfully updated.",
      });
      
      setEditingBusinessDescription(false);
    } catch (error) {
      console.error('Business description update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update business description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingBusinessDescription(false);
    }
  };

  const handleCancelEditBusinessDescription = () => {
    setEditingBusinessDescription(false);
    setBusinessDescriptionForm({
      services: user?.services || '',
      specialOffers: user?.specialOffers || '',
      targetCustomers: user?.targetCustomers || '',
      certifications: user?.certifications || ''
    });
  };

  const handleEditBusinessDescription = () => {
    if (!user) return;
    setBusinessDescriptionForm({
      services: user.services || '',
      specialOffers: user.specialOffers || '',
      targetCustomers: user.targetCustomers || '',
      certifications: user.certifications || ''
    });
    setEditingBusinessDescription(true);
  };

  // Owner contact mutation and handlers
  const updateOwnerContact = useMutation({
    mutationFn: async (data: { ownerName: string; ownerEmail: string; ownerPhone: string }) => {
      const response = await fetch(`/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      authStorage.setUser(updatedUser);
      if (typeof setAuthUser === 'function') {
        setAuthUser(updatedUser);
      }
      
      toast({
        title: "Owner contact updated",
        description: "Internal contact information has been successfully updated.",
      });
      setEditingOwnerInfo(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: `Failed to update owner contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveOwnerContact = () => {
    updateOwnerContact.mutate(ownerContactForm);
  };

  // Initialize owner contact form when user data loads
  useEffect(() => {
    if (user && user.userType === 'business') {
      setOwnerContactForm({
        ownerName: user.ownerName || "",
        contactName: user.contactName || "",
        ownerEmail: user.ownerEmail || "",
        ownerPhone: user.ownerPhone || ""
      });
    }
  }, [user]);

  // Profile edit mutation
  const editProfile = useMutation({
    mutationFn: async (data: z.infer<typeof dynamicProfileSchema>) => {
      console.log('🔥 BUSINESS SAVE: Data being sent:', data);
      console.log('🔥 MUTATION: User type is:', user?.userType);
      
      // For business users, use simpler payload structure
      const payload = user?.userType === 'business' ? {
        ...data,
        isVeteran: !!data.isVeteran,
        isActiveDuty: !!data.isActiveDuty,
        isMinorityOwned: !!data.isMinorityOwned,
        isFemaleOwned: !!data.isFemaleOwned,
        isLGBTQIAOwned: !!data.isLGBTQIAOwned,
        showMinorityOwned: data.showMinorityOwned !== false,
        showFemaleOwned: data.showFemaleOwned !== false,
        showLGBTQIAOwned: data.showLGBTQIAOwned !== false,
      } : {
        ...data,
        // Only include traveler fields if they exist in the data
        ...((data as any).hasOwnProperty('travelingWithChildren') && { travelingWithChildren: !!(data as any).travelingWithChildren }),
        ...((data as any).hasOwnProperty('ageVisible') && { ageVisible: !!(data as any).ageVisible }),
        ...((data as any).hasOwnProperty('sexualPreferenceVisible') && { sexualPreferenceVisible: !!(data as any).sexualPreferenceVisible }),
        // Always include veteran status fields
        isVeteran: !!data.isVeteran,
        isActiveDuty: !!data.isActiveDuty,
        isMinorityOwned: !!data.isMinorityOwned,
        isFemaleOwned: !!data.isFemaleOwned,
        isLGBTQIAOwned: !!data.isLGBTQIAOwned,
        showMinorityOwned: data.showMinorityOwned !== false,
        showFemaleOwned: data.showFemaleOwned !== false,
        showLGBTQIAOwned: data.showLGBTQIAOwned !== false,
      };
      
      console.log('🔥 MUTATION: Profile payload with explicit booleans:', payload);
      
      const response = await fetch(`/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString(),
          'x-user-type': 'business'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile edit error response:', errorText);
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      console.log('✅ BUSINESS SAVE SUCCESS:', updatedUser);
      
      // Update all caches
      queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      // Update auth storage
      authStorage.setUser(updatedUser);
      if (typeof setAuthUser === 'function') {
        setAuthUser(updatedUser);
      }
      
      // FORCE immediate UI refresh with state update
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
      
      // CRITICAL: Reset form with updated values immediately to prevent toggle drift
      setTimeout(() => {
        console.log('🔥 Re-syncing form with updated user data');
        if (user?.userType !== 'business') {
          profileForm.reset({
            bio: updatedUser.bio || "",
            secretActivities: updatedUser.secretActivities || "",
            hometownCity: updatedUser.hometownCity || "",
            hometownState: updatedUser.hometownState || "",
            hometownCountry: updatedUser.hometownCountry || "",
            dateOfBirth: updatedUser.dateOfBirth ? new Date(updatedUser.dateOfBirth).toISOString().split('T')[0] : "",
            ageVisible: updatedUser.ageVisible !== undefined ? updatedUser.ageVisible : false,
            gender: updatedUser.gender || "",
            sexualPreference: updatedUser.sexualPreference || [],
            sexualPreferenceVisible: updatedUser.sexualPreferenceVisible !== undefined ? updatedUser.sexualPreferenceVisible : false,
            travelStyle: updatedUser.travelStyle || [],
            travelingWithChildren: updatedUser.travelingWithChildren === true,
            childrenAges: (updatedUser as any).childrenAges || "",
            isVeteran: updatedUser.isVeteran !== undefined ? updatedUser.isVeteran : false,
            isActiveDuty: updatedUser.isActiveDuty !== undefined ? updatedUser.isActiveDuty : false,
            isMinorityOwned: updatedUser.isMinorityOwned !== undefined ? updatedUser.isMinorityOwned : false,
            isFemaleOwned: updatedUser.isFemaleOwned !== undefined ? updatedUser.isFemaleOwned : false,
            isLGBTQIAOwned: updatedUser.isLGBTQIAOwned !== undefined ? updatedUser.isLGBTQIAOwned : false,
            showMinorityOwned: updatedUser.showMinorityOwned !== undefined ? updatedUser.showMinorityOwned : true,
            showFemaleOwned: updatedUser.showFemaleOwned !== undefined ? updatedUser.showFemaleOwned : true,
            showLGBTQIAOwned: updatedUser.showLGBTQIAOwned !== undefined ? updatedUser.showLGBTQIAOwned : true,
          });
        }
      }, 100);
      
      // Force immediate refetch to trigger component re-render
      refetchUser();
      
      // Multiple invalidations to ensure all cached data is fresh
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditMode(false);
    },
    onError: (error) => {
      console.error('Save failed:', error);
      toast({
        title: "Save failed",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: z.infer<typeof dynamicProfileSchema>) => {
    console.log('🔥 BUSINESS FORM SUBMIT:', data);
    console.log('🔥 FORM SUBMIT: User type is:', user?.userType);
    console.log('🔥 Form errors:', profileForm.formState.errors);
    console.log('🔥 Form valid:', profileForm.formState.isValid);
    
    // Keep children ages regardless of travel status for matching purposes
    
    // Process custom text entries for business users
    if (user?.userType === 'business') {
      const formData = data as any;
      
      // Process custom interests
      if (formData.customInterests) {
        const customInterestsList = formData.customInterests.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        formData.interests = [...(formData.interests || []).filter((item: string) => (MOST_POPULAR_INTERESTS.includes(item) || ADDITIONAL_INTERESTS.includes(item))), ...customInterestsList];
      }
      
      // Process custom activities
      if (formData.customActivities) {
        const customActivitiesList = formData.customActivities.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        formData.activities = [...(formData.activities || []).filter((item: string) => safeGetAllActivities().includes(item)), ...customActivitiesList];
      }
      
      // Process custom events
      if (formData.customEvents) {
        const customEventsList = formData.customEvents.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        formData.events = [...(formData.events || []).filter((item: string) => safeGetAllEvents().includes(item)), ...customEventsList];
      }
      
      console.log('🔥 BUSINESS SUBMIT: Final data with custom fields processed:', formData);
    }
    
    // Send dateOfBirth as string - server will handle conversion to Date
    editProfile.mutate(data);
  };

  // Get countries visited from user profile data
  const countriesVisited = user?.countriesVisited || [];
  const citiesVisited = Array.from(new Set(stamps.map(stamp => `${stamp.city}, ${stamp.country}`)));

  // Languages spoken (mock data - would be from user profile)
  const languages = ["English", "Spanish", "Portuguese"];

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !user?.id) throw new Error("Authentication required");
      
      const requestData = {
        requesterId: currentUser.id,
        targetUserId: user.id,
        status: 'pending'
      };
      
      console.log('🔵 CONNECT: Sending request data:', requestData);
      
      const response = await apiRequest('POST', '/api/connections', requestData);
      
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/connections/${currentUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${currentUser?.id}/${user?.id}`] });
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to ${user?.name || user?.username}.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send connection request. Please try again.";
      const isPrivacyError = errorMessage.includes("privacy settings");
      
      toast({
        title: isPrivacyError ? "Privacy Restriction" : "Connection Failed",
        description: isPrivacyError 
          ? "This user's privacy settings prevent connection requests from new users."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!currentUser?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    if (connectionStatus?.status === 'accepted') {
      // Already connected - do nothing or navigate to messages
      setLocation(`/messages?userId=${user?.id}`);
      return;
    }
    
    if (connectionStatus?.status === 'pending') {
      // Connection request already sent - show message
      toast({
        title: "Connection request already sent",
        description: "Your connection request is pending approval.",
      });
      return;
    }
    
    // Send new connection request
    connectMutation.mutate();
  };

  const handleMessage = () => {
    setLocation(`/messages?userId=${user?.id}`);
  };

  const handleWriteReference = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Please log in to write a reference",
        variant: "destructive",
      });
      return;
    }
    setShowWriteReferenceModal(true);
  };

  const handleViewChatrooms = () => {
    toast({
      title: "Not in Beta",
      description: "City Chatrooms feature is not available in beta version",
    });
  };

  // Get connect button text and state
  const getConnectButtonState = () => {
    if (connectionStatus?.status === 'accepted') {
      return { text: 'Connected', disabled: false, variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white border-0' };
    }
    if (connectionStatus?.status === 'pending') {
      return { text: 'Request Sent', disabled: true, variant: 'default' as const, className: 'bg-gray-600 hover:bg-gray-700 text-white border-0' };
    }
    return { text: connectMutation.isPending ? 'Connecting...' : 'Connect', disabled: connectMutation.isPending, variant: 'default' as const, className: 'bg-blue-600 hover:bg-blue-700 text-white border-0' };
  };

  // Function to determine current location based on travel status
  const getCurrentLocation = () => {
    if (!user) return "Not specified";
    
    // Use the modern travel plans system (same as all other components)
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination) {
      return currentDestination;
    }
    
    // Otherwise show their regular location
    return user.hometownCity || user.location || "Not specified";
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {isOwnProfile 
                ? (currentUser?.userType === 'business' ? 'Loading Business Profile...' : 'Loading Your Profile...') 
                : 'Loading Profile...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError && !user) {
    console.error('Profile page error:', userError);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Error Loading Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Unable to load profile data</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => {
                console.log('Retrying profile fetch for user:', effectiveUserId);
                refetchUser?.();
              }} 
              variant="outline"
            >
              Try Again
            </Button>
            <button 
              onClick={() => {
                const referrer = document.referrer;
                if (referrer && referrer.includes(window.location.origin)) {
                  window.location.href = referrer;
                } else {
                  setLocation('/');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">User Not Found</h1>
          <UniversalBackButton 
            destination="/discover"
            label="Back"
            className="shadow-sm"
          />
        </div>
      </div>
    );
  }

  // Safety check to ensure user exists before rendering main content
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Clean gradient background when no cover photo exists
  const getCleanBackground = () => {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  // Check if user profile is incomplete and needs completion
  const isProfileIncomplete = () => {
    if (!user || !isOwnProfile) return false;
    
    // For business users, check business-specific required fields
    if (user.userType === 'business') {
      const hasBusinessInfo = user.businessName && user.businessDescription && user.businessType;
      const hasBusinessLocation = user.city && user.state && user.country;
      const hasBusinessInterests = user.interests && Array.isArray(user.interests) && user.interests.length >= 3;
      
      return !hasBusinessInfo || !hasBusinessLocation || !hasBusinessInterests;
    }
    
    // For regular users (travelers/locals)
    const hasBasicInfo = user.bio && user.bio.trim().length > 0;
    const hasInterests = user.interests && Array.isArray(user.interests) && user.interests.length >= 3;
    const hasLocation = user.hometownCity && user.hometownState && user.hometownCountry;
    
    return !hasBasicInfo || !hasInterests || !hasLocation;
  };



  // Add debug logging before render
  console.log('Profile render - about to render JSX', {
    userId: user?.id,
    username: user?.username,
    userType: user?.userType,
    hasUser: !!user,
    userKeys: user ? Object.keys(user).length : 0
  });

  // Add null check
  if (!user) {
    console.error('Profile render error: user is null/undefined');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Unable to load user data</p>
          <button 
            onClick={() => {
              const referrer = document.referrer;
              if (referrer && referrer.includes(window.location.origin)) {
                window.location.href = referrer;
              } else {
                setLocation('/');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Navigation */}
      <MobileTopNav />
      <MobileBottomNav />
      
      <div className="min-h-screen profile-page">

      {/* Profile Completion Warning - Only show for incomplete own profiles */}
      {isProfileIncomplete() && (
        <div className="w-full bg-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base sm:text-lg">PLEASE FILL OUT PROFILE NOW TO MATCH WELL WITH OTHERS</p>
                  <p className="text-red-100 text-xs sm:text-sm">Complete your bio, interests, and location to improve your compatibility with other travelers</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-red-600 hover:bg-red-50 font-semibold flex-shrink-0 w-full sm:w-auto"
                onClick={() => setIsEditMode(true)}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    
      {/* PROFILE HEADER - Mobile Responsive */}
      <section
        className={`relative -mt-px isolate w-full bg-gradient-to-r ${gradientOptions[selectedGradient]} px-3 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12`}
      >
        {/* floating color button */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setSelectedGradient((prev) => (prev + 1) % gradientOptions.length)}
            aria-label="Change header colors"
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow-md hover:bg-white"
          >
            🎨
          </button>
        )}

        <div className="max-w-7xl mx-auto">
          {/* allow wrapping so CTAs drop below on small screens */}
          <div className="flex flex-row flex-wrap items-start gap-4 sm:gap-6">

            {/* Avatar + camera (bigger, no scrollbars) */}
            <div className="relative flex-shrink-0">
              <div className="rounded-full bg-white ring-4 ring-white shadow-lg overflow-hidden">
                <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-56 md:h-56 rounded-full overflow-hidden no-scrollbar">
                  <SimpleAvatar
                    user={user}
                    size="xl"
                    className="w-full h-full block object-cover"
                  />
                </div>
              </div>

              {isOwnProfile && (
                <>
                  <Button
                    size="icon"
                    aria-label="Change avatar"
                    className="absolute -bottom-2 -right-2 translate-x-1/4 translate-y-1/4
                               h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0
                               bg-blue-600 hover:bg-blue-700 text-white shadow-lg ring-4 ring-white z-10"
                    onClick={() => document.getElementById('avatar-upload-input')?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Profile text */}
            <div className="flex-1 min-w-0">
              {user?.userType === 'business' ? (
                <div className="space-y-2 text-black w-full mt-2">
                  <h1 className="text-2xl sm:text-4xl font-bold text-black">
                    {user.businessName || user.name || `@${user.username}`}
                  </h1>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium bg-white text-black border border-black">
                      Nearby Business
                    </span>
                    {user.businessType && <span className="text-black/80">• {user.businessType}</span>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-black w-full mt-2">
                  {(() => {
                    const hometown = user.hometownCity ? 
                      `${user.hometownCity}${user.hometownState ? `, ${user.hometownState}` : ''}${user.hometownCountry ? `, ${user.hometownCountry}` : ''}` :
                      'Unknown';
                    
                    return (
                      <>
                        <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-black break-all">@{user.username}</h1>
                        
                        {/* ALWAYS show hometown - NEVER remove */}
                        <div className="flex items-center gap-2 text-lg font-medium text-black">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span>Nearby Local • {hometown}</span>
                        </div>
                        
                        {/* ADDITIONAL travel status if currently traveling - shows BELOW hometown */}
                        {(() => {
                          const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                          if (currentTravelPlan) {
                            return (
                              <div className="flex items-center gap-2 text-lg font-medium text-black">
                                <Plane className="w-5 h-5 text-orange-600" />
                                <span>Nearby Traveler • {currentTravelPlan}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Show travel plan actions if currently traveling */}
                        {(() => {
                          const currentTravelPlan = getCurrentTravelDestination(travelPlans || []);
                          return currentTravelPlan && isOwnProfile && (
                              <Button
                                onClick={() => {
                                  openTab('travel');
                                  // Scroll directly to the travel plans widget after a short delay
                                  setTimeout(() => {
                                    const travelPlansSection = document.querySelector('[data-testid="travel-plans-widget"]');
                                    if (travelPlansSection) {
                                      travelPlansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    } else {
                                      // Fallback: scroll to the tab panel
                                      const travelSection = document.querySelector('#panel-travel');
                                      if (travelSection) {
                                        travelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }
                                  }, 150);
                                }}
                                className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white border-0 px-4 py-2 text-sm rounded-lg shadow-md transition-all"
                                data-testid="button-connect-travel-plans"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                View Travel Plans
                              </Button>
                          );
                        })()}
                      </>
                    );
                  })()}

                  {/* Stats - Removed countries and references badges */}
                </div>
              )}
            </div>

            {/* CTAs — wrap on mobile */}
            {!isOwnProfile ? (
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-6 py-2 rounded-lg shadow-md transition-all"
                  onClick={handleMessage}
                  data-testid="button-message"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  className={`px-6 py-2 rounded-lg shadow-md transition-all ${getConnectButtonState().className}`}
                  variant={getConnectButtonState().variant}
                  onClick={handleConnect}
                  disabled={getConnectButtonState().disabled}
                  data-testid="button-connect"
                >
                  {getConnectButtonState().text}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                {user && (user.hometownCity || user.location) && (
                  <Button
                    onClick={() => {
                      const chatCity = user.hometownCity || user.location?.split(',')[0] || 'General';
                      setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                               text-white border-0 shadow-md rounded-lg
                               inline-flex items-center justify-center gap-2
                               px-6 py-2 transition-all"
                    data-testid="button-chatrooms"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Go to Chatrooms</span>
                  </Button>
                )}
                <Button
                  onClick={() => setLocation('/share-qr')}
                  className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700
                             text-white border-0 shadow-md rounded-lg
                             inline-flex items-center justify-center gap-2
                             px-6 py-2 transition-all"
                  data-testid="button-share-qr"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invite Friends</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload overlay (unchanged) */}
        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </section>

      {/* Navigation Tabs - Card Style with Border */}
      <div className="w-auto bg-white border border-black dark:bg-gray-900 dark:border-gray-700 px-3 sm:px-6 lg:px-10 py-4 mx-4 sm:mx-6 lg:mx-8 rounded-lg mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <button
                role="tab"
                aria-selected={activeTab === 'contacts'}
                aria-controls="panel-contacts"
                onClick={() => openTab('contacts')}
                className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'contacts'
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white border border-black text-black hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700'
                }`}
                data-testid="tab-contacts"
              >
                Contacts
                {!!(userConnections?.length) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                    {userConnections.length}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'photos'}
                aria-controls="panel-photos"
                onClick={() => openTab('photos')}
                className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'photos'
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white border border-black text-black hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700'
                }`}
                data-testid="tab-photos"
              >
                Photos
                {!!(userPhotos?.length) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                    {userPhotos.length}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'references'}
                aria-controls="panel-references"
                onClick={() => openTab('references')}
                className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'references'
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white border border-black text-black hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700'
                }`}
                data-testid="tab-references"
              >
                References
                {!!(vouches?.length) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                    {vouches.length}
                  </span>
                )}
              </button>

              {user?.userType !== 'business' && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'travel'}
                  aria-controls="panel-travel"
                  onClick={() => openTab('travel')}
                  className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'travel'
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-white border border-black text-black hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700'
                  }`}
                  data-testid="tab-travel"
                >
                  Travel
                  {!!(travelPlans?.length) && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                      {travelPlans.length}
                    </span>
                  )}
                </button>
              )}

              <button
                role="tab"
                aria-selected={activeTab === 'countries'}
                aria-controls="panel-countries"
                onClick={() => openTab('countries')}
                className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'countries'
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white border border-black text-black hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700'
                }`}
                data-testid="tab-countries"
              >
                Countries
                {!!(countriesVisited?.length) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                    {countriesVisited.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Let's Meet Now CTA */}
            <Button
              onClick={() => {
                // Simply scroll to the QuickMeetupWidget and trigger the create form
                const widget = document.querySelector('[data-testid="quick-meet-widget"]');
                if (widget) {
                  widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                // Trigger the create form without rapid state changes
                setTriggerQuickMeetup(true);
                // Reset after scrolling completes
                setTimeout(() => setTriggerQuickMeetup(false), 500);
              }}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600 
                         px-4 sm:px-6 py-2 sm:py-2 text-sm font-medium rounded-lg
                         w-full sm:w-auto flex items-center justify-center transition-all duration-200"
              data-testid="button-lets-meet-now"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Let's Meet Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content section - Mobile Responsive Layout */}
      <div className="w-full max-w-full mx-auto pb-20 sm:pb-4 px-1 sm:px-4 lg:px-6 mt-2 overflow-x-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Main Content Column */}
          <div className="w-full lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">

            {/* About Section - Always Visible */}
            <Card className="mt-2 relative overflow-visible">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-base sm:text-lg lg:text-xl font-bold break-words text-left leading-tight flex-1 pr-2">
                    ABOUT {user?.userType === 'business'
                      ? (user?.businessName || user?.name || user?.username)
                      : (user?.username || 'User')}
                  </CardTitle>

                  {isOwnProfile && (
                    <div className="flex-shrink-0">
                      {/* Icon-only on phones */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                        className="sm:hidden bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        aria-label="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {/* Labeled button on ≥ sm */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                        className="hidden sm:inline-flex bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 min-w-0 break-words overflow-visible">
                {/* Edit Bio Quick Action for Mobile - Show for all users */}
                {isOwnProfile && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 sm:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {(!user?.bio || user?.bio.trim().length === 0) ? 'Add your bio' : 'Edit your bio'}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">Tell others about yourself</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsEditMode(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white ml-2 flex-shrink-0"
                        data-testid="button-edit-bio-mobile"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit Bio
                      </Button>
                    </div>
                  </div>
                )}
                {/* Bio / Business Description */}
                <div>
                  <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words text-left">
                    {user?.userType === 'business'
                      ? (user?.businessDescription || "No business description available yet.")
                      : (user?.bio || "No bio available yet.")
                    }
                  </p>
                </div>

                {/* Metropolitan Area (optional) */}
                {user.hometownCity && user.hometownState && user.hometownCountry && (() => {
                  const metroArea = getMetropolitanArea(user.hometownCity, user.hometownState, user.hometownCountry);
                  if (!metroArea) return null;
                  return (
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg dark:from-gray-800/50 dark:to-gray-700/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metropolitan Area:</span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{metroArea}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* What you have in common (for other profiles) - Mobile and Desktop */}
                {!isOwnProfile && currentUser && user?.id && (
                  <div>
                    <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
                  </div>
                )}

                {/* Basic Info — grid so lines never run together */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">From:</span>
                    <span className="text-gray-900 dark:text-gray-100 flex-1 break-words">
                      {user?.userType === 'business'
                        ? (user?.location || user?.hometownCity || "Los Angeles, CA")
                        : (() => {
                            const parts = [user?.hometownCity, user?.hometownState, user?.hometownCountry].filter(Boolean);
                            return parts.length > 0 ? parts.join(', ') : "Not specified";
                          })()
                      }
                    </span>
                  </div>

                  {user?.userType !== 'business' && user?.gender && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Gender:</span>
                      <span className="capitalize flex-1 break-words">{user?.gender?.replace('-', ' ')}</span>
                    </div>
                  )}

                  {/* Children Info for non-business users */}
                  {user?.userType !== 'business' && user?.childrenAges && user?.childrenAges !== 'None' && user?.childrenAges.trim() !== '' && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Children:</span>
                      <span className="flex-1 break-words">Ages {user.childrenAges}</span>
                    </div>
                  )}

                  {user.sexualPreferenceVisible && user.sexualPreference && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Preference:</span>
                      <span className="flex-1 break-words">
                        {Array.isArray(user.sexualPreference) 
                          ? user.sexualPreference.join(', ')
                          : typeof user.sexualPreference === 'string'
                          ? (user.sexualPreference as string).split(',').join(', ')
                          : user.sexualPreference
                        }
                      </span>
                    </div>
                  )}

                  {user.userType !== 'business' && user.ageVisible && user.dateOfBirth && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Age:</span>
                      <span className="flex-1 break-words">{calculateAge(user.dateOfBirth)} years old</span>
                    </div>
                  )}

                  {/* Military Status for non-business users */}
                  {user.userType !== 'business' && (user.isVeteran || (user as any).is_veteran || user.isActiveDuty || (user as any).is_active_duty) && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Military:</span>
                      <span className="flex-1 break-words flex items-center gap-2">
                        {(user.isVeteran || (user as any).is_veteran) && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400">
                            <span className="text-green-600">✓</span>
                            Veteran
                          </span>
                        )}
                        {(user.isActiveDuty || (user as any).is_active_duty) && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                            <span className="text-blue-600">✓</span>
                            Active Duty
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Secret Activities Section - Separate Card */}
            {user?.userType !== 'business' && user?.secretActivities && (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm w-full overflow-hidden">
                <CardContent className="p-4">
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-blue-50 border-l-4 border-orange-200 rounded-r-lg">
                    <h5 className="font-medium text-black mb-2">
                      Secret things I would do if my closest friends came to town
                    </h5>
                    <p className="text-black text-sm italic whitespace-pre-wrap break-words">
                      {user?.secretActivities}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Travel Plans and Business Information Card */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm w-full overflow-hidden">
              <CardContent className="p-4">

                {/* Business Contact Information */}
                {user.userType === 'business' && (
                  <div className="space-y-3 border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Business Information
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      {user.streetAddress && (
                        <div className="flex items-start">
                          <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Address:</span>
                          <span className="flex-1 break-words">{user.streetAddress}{user.zipCode && `, ${user.zipCode}`}</span>
                        </div>
                      )}
                      
                      
                      {user.websiteUrl && (
                        <div className="flex items-start">
                          <span className="font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Website:</span>
                          <a 
                            href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline flex-1 break-words"
                          >
                            {user.websiteUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Business Ownership Categories */}
                    {(user.isVeteran || user.isActiveDuty || (user.isMinorityOwned && user.showMinorityOwned) || (user.isFemaleOwned && user.showFemaleOwned) || (user.isLGBTQIAOwned && user.showLGBTQIAOwned)) && (
                      <div className="space-y-2 border-t pt-3 mt-3">
                        <h5 className="font-medium text-gray-700 dark:text-gray-300">Business Ownership</h5>
                        
                        {/* Military Status */}
                        {user.isVeteran && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span className="text-sm">Veteran Owned Business</span>
                          </div>
                        )}
                        {user.isActiveDuty && (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">✓</span>
                            <span className="text-sm">Active Duty Owned Business</span>
                          </div>
                        )}
                        
                        {/* Diversity Categories */}
                        {user.isMinorityOwned && user.showMinorityOwned && (
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600">✓</span>
                            <span className="text-sm">Minority Owned Business</span>
                          </div>
                        )}
                        {user.isFemaleOwned && user.showFemaleOwned && (
                          <div className="flex items-center gap-2">
                            <span className="text-pink-600">✓</span>
                            <span className="text-sm">Female Owned Business</span>
                          </div>
                        )}
                        {user.isLGBTQIAOwned && user.showLGBTQIAOwned && (
                          <div className="flex items-center gap-2">
                            <span className="text-rainbow bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">✓</span>
                            <span className="text-sm">LGBTQIA+ Owned Business</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Deals Section - Only for business users */}
            {user?.userType === 'business' && (
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                    <span>Business Deals</span>
                    {isOwnProfile && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          console.log('🔥 CREATE OFFER clicked, navigating to business dashboard');
                          setLocation('/business-dashboard');
                        }}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Offer
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 p-6">
                  {businessDealsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : businessDeals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No business deals created yet</p>
                      {isOwnProfile && (
                        <p className="text-sm mt-2">Create your first deal to attract customers!</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessDeals.slice(0, 3).map((deal: any) => (
                        <div key={deal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow bg-white dark:bg-gray-800">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{deal.title}</h4>
                            <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                              {deal.discountValue}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{deal.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Valid until {new Date(deal.validUntil).toLocaleDateString()}</span>
                            <span className="capitalize">{deal.category}</span>
                          </div>
                        </div>
                      ))}
                      {businessDeals.length > 3 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation('/deals')}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            View All {businessDeals.length} Deals
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* What You Have in Common Section - MOVED TO ABOUT SECTION FOR BETTER VISIBILITY */}



            {/* Local Interests, Activities & Events Section - For non-business users only */}
            {user?.userType !== 'business' && (
            <Card>
              <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Heart className="w-5 h-5 text-red-500" />
                    Local Interests, Activities & Events
                  </CardTitle>
                  {/* Edit All Preferences Button - TOP RIGHT */}
                  {isOwnProfile && !editingInterests && !editingActivities && !editingEvents && (
                    <Button
                      onClick={() => {
                        // Open all editing modes at once
                        setEditingInterests(true);
                        setEditingActivities(true);
                        setEditingEvents(true);
                        
                        // Initialize form data
                        setEditFormData({
                          interests: user?.interests || [],
                          activities: user?.activities || [],
                          events: user?.events || []
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6 pb-4 sm:pb-6 break-words overflow-hidden">

                {/* UNIFIED EDIT MODAL - CLEAN ORGANIZED FLOW */}
                {isOwnProfile && (editingInterests && editingActivities && editingEvents) ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-600">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit All Preferences</h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          onClick={async () => {
                            try {
                              console.log('🔧 SAVING DATA:', editFormData);
                              
                              // Separate predefined vs custom entries
                              const allInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS];
                              const allActivities = safeGetAllActivities();
                              const allEvents = safeGetAllEvents();
                              
                              const predefinedInterests = editFormData.interests.filter(int => allInterests.includes(int));
                              const predefinedActivities = (editFormData.activities || []).filter(act => allActivities.includes(act));
                              const predefinedEvents = editFormData.events.filter(evt => allEvents.includes(evt));
                              
                              const customInterests = editFormData.interests.filter(int => !allInterests.includes(int));
                              const customActivities = (editFormData.activities || []).filter(act => !allActivities.includes(act));
                              const customEvents = editFormData.events.filter(evt => !allEvents.includes(evt));
                              
                              const saveData = {
                                interests: predefinedInterests,
                                activities: predefinedActivities, 
                                events: predefinedEvents,
                                customInterests: customInterests.join(', '),
                                customActivities: customActivities.join(', '),
                                customEvents: customEvents.join(', ')
                              };
                              
                              const response = await fetch(`/api/users/${user.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(saveData)
                              });
                              if (!response.ok) throw new Error('Failed to save');
                              
                              // Refresh data and close editing
                              queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                              setEditingInterests(false);
                              setEditingActivities(false);
                              setEditingEvents(false);
                              console.log('✅ Successfully saved user preferences');
                            } catch (error) {
                              console.error('❌ Failed to update preferences:', error);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                        >
                          Save All Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingInterests(false);
                            setEditingActivities(false);
                            setEditingEvents(false);
                            setEditFormData({
                              interests: user?.interests || [],
                              activities: user?.activities || [],
                              events: user?.events || []
                            });
                          }}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 flex-1 sm:flex-none"
                        >
                          Cancel All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {/* TOP CHOICES SECTION */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          Top Choices for Most Travelers
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                          {MOST_POPULAR_INTERESTS.map((interest) => {
                            const isSelected = editFormData.interests.includes(interest);
                            
                            return (
                              <button
                                key={interest}
                                type="button"
                                onClick={() => {
                                  toggleArrayValue(editFormData.interests, interest, (newInterests) => 
                                    setEditFormData({ ...editFormData, interests: newInterests })
                                  );
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-yellow-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black border border-black'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* PUBLIC INTERESTS SECTION */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Heart className="w-5 h-5 text-blue-500" />
                          Your Interests
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                          {(() => {
                            // Get all interests and filter out top choices and private interests
                            const topChoices = getTopChoicesInterests();
                            const privateInterests = getPrivateInterests();
                            
                            return safeGetAllInterests()
                              .filter(interest => !topChoices.includes(interest)) // Remove top choices
                              .filter(interest => !privateInterests.includes(interest)) // Remove private interests
                              .map((interest) => {
                                const isSelected = editFormData.interests.includes(interest);
                            
                                return (
                                  <button
                                    key={interest}
                                    type="button"
                                    onClick={() => {
                                      toggleArrayValue(editFormData.interests, interest, (newInterests) => 
                                        setEditFormData({ ...editFormData, interests: newInterests })
                                      );
                                    }}
                                    className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                      isSelected
                                        ? 'bg-green-600 text-white font-bold transform scale-105'
                                        : 'bg-white text-black border border-black'
                                    }`}
                                  >
                                    {interest}
                                  </button>
                                );
                              });
                          })()}
                        </div>
                      </div>

                      {/* CUSTOM INTERESTS INPUT */}
                      <div>
                        <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Add Custom Interests</h5>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add your own interests not listed above - Hit enter after each choice"
                            value={customInterestInput}
                            onChange={(e) => setCustomInterestInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customInterestInput.trim();
                                if (trimmed && !editFormData.interests.includes(trimmed)) {
                                  setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                                  setCustomInterestInput('');
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = customInterestInput.trim();
                              if (trimmed && !editFormData.interests.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                                setCustomInterestInput('');
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* SHOW ALL CUSTOM INTERESTS WITH DELETE BUTTONS */}
                        {(() => {
                          const allCustomInterests = editFormData.interests.filter(interest => 
                            !MOST_POPULAR_INTERESTS.includes(interest) && 
                            !getFilteredInterestsForProfile(user!, isOwnProfile).filter(i => MOST_POPULAR_INTERESTS.includes(i)).includes(interest)
                          );
                          
                          if (allCustomInterests.length === 0) return null;
                          
                          return (
                            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-600">
                              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                                ✨ Your Custom Interests (Click X to delete):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {allCustomInterests.map((interest, index) => (
                                  <span
                                    key={`all-custom-${index}`}
                                    className="inline-flex items-center justify-center h-7 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-orange-600 text-white"
                                  >
                                    {interest}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('🗑️ DELETING CUSTOM INTEREST:', interest);
                                        const newInterests = editFormData.interests.filter(i => i !== interest);
                                        setEditFormData({ ...editFormData, interests: newInterests });
                                      }}
                                      className="ml-2 text-orange-200 hover:text-white text-sm font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* ACTIVITIES SECTION */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-green-500" />
                          Activities
                        </h4>
                        
                        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300">
                          Your default preferences for trips and to match with Nearby Locals and Travelers.
                        </div>
                        
                        <div className="flex flex-wrap gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                          {safeGetAllActivities().map((activity) => {
                            const isSelected = (editFormData.activities || []).includes(activity);
                            
                            return (
                              <button
                                key={activity}
                                type="button"
                                onClick={() => {
                                  toggleArrayValue(editFormData.activities, activity, (newActivities) => 
                                    setEditFormData({ ...editFormData, activities: newActivities })
                                  );
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black border border-black'
                                }`}
                              >
                                {activity}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <Input
                            placeholder="Add custom activities - Hit enter after each choice"
                            value={customActivityInput}
                            onChange={(e) => setCustomActivityInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customActivityInput.trim();
                                if (trimmed && !editFormData.activities.includes(trimmed)) {
                                  setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                                  setCustomActivityInput('');
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = customActivityInput.trim();
                              if (trimmed && !editFormData.activities.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                                setCustomActivityInput('');
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* EVENTS SECTION */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          Events
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                          {safeGetAllEvents().map((event) => {
                            const isSelected = editFormData.events.includes(event);
                            
                            return (
                              <button
                                key={event}
                                type="button"
                                onClick={() => {
                                  toggleArrayValue(editFormData.events, event, (newEvents) => 
                                    setEditFormData({ ...editFormData, events: newEvents })
                                  );
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black border border-black'
                                }`}
                              >
                                {event}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <Input
                            placeholder="Add custom events - Hit enter after each choice"
                            value={customEventInput}
                            onChange={(e) => setCustomEventInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customEventInput.trim();
                                if (trimmed && !editFormData.events.includes(trimmed)) {
                                  setEditFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
                                  setCustomEventInput('');
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = customEventInput.trim();
                              if (trimmed && !editFormData.events.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
                                setCustomEventInput('');
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* PRIVATE INTERESTS SECTION - MOVED TO END */}
                      <div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                          <Eye className="w-5 h-5 text-red-500" />
                          Private Interests (18+)
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg">
                          🔒 <strong>Private Section:</strong> These interests are for adult content and mature audiences only. 
                          They help match you with like-minded people but are kept separate from your public profile.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600">
                          {getPrivateInterests().map((interest) => {
                            const isSelected = editFormData.interests.includes(interest);
                            
                            return (
                              <button
                                key={interest}
                                type="button"
                                onClick={() => {
                                  toggleArrayValue(editFormData.interests, interest, (newInterests) => 
                                    setEditFormData({ ...editFormData, interests: newInterests })
                                  );
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-red-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black border border-red-400'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>

                        {/* CUSTOM PRIVATE INTERESTS INPUT */}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Add Your Own Private Interest</h5>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom private interest..."
                              value={privateInterestInput}
                              onChange={(e) => setPrivateInterestInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = privateInterestInput.trim();
                                  if (trimmed && !editFormData.privateInterests.includes(trimmed)) {
                                    setEditFormData(prev => ({ ...prev, privateInterests: [...prev.privateInterests, trimmed] }));
                                    setPrivateInterestInput('');
                                  }
                                }
                              }}
                              className="bg-white dark:bg-gray-800 border-red-300 dark:border-red-600"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = privateInterestInput.trim();
                                if (trimmed && !editFormData.privateInterests.includes(trimmed)) {
                                  setEditFormData(prev => ({ ...prev, privateInterests: [...prev.privateInterests, trimmed] }));
                                  setPrivateInterestInput('');
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* SHOW CUSTOM PRIVATE INTERESTS WITH DELETE BUTTONS */}
                        {(() => {
                          const customPrivateInterests = editFormData.privateInterests.filter(interest => 
                            !getPrivateInterests().includes(interest) // Only show custom ones, not predefined
                          );
                          
                          if (customPrivateInterests.length === 0) return null;
                          
                          return (
                            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-600">
                              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                                🔒 Your Custom Private Interests (Click X to delete):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {customPrivateInterests.map((interest, index) => (
                                  <span
                                    key={`custom-private-${index}`}
                                    className="inline-flex items-center justify-center h-7 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-red-600 text-white"
                                  >
                                    🔒 {interest}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('🗑️ DELETING CUSTOM PRIVATE INTEREST:', interest);
                                        const newPrivateInterests = editFormData.privateInterests.filter(i => i !== interest);
                                        setEditFormData({ ...editFormData, privateInterests: newPrivateInterests });
                                      }}
                                      className="ml-2 text-red-200 hover:text-white text-sm font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Save Button with Privacy Notice */}
                        <div className="mt-6 pt-4 border-t border-red-200 dark:border-red-600">
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <span className="text-xs text-white font-bold">!</span>
                              </div>
                              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                                Important: Search Visibility
                              </p>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              <strong>Private interests help you find compatible people through search</strong> but will <strong>never appear on your public profile</strong>. 
                              Only you can see these selections, and they're used solely for matching purposes.
                            </p>
                          </div>
                          
                          <Button
                            type="button"
                            onClick={async () => {
                              setIsSubmitting(true);
                              try {
                                // Store current scroll position
                                const currentScrollY = window.scrollY;
                                
                                const success = await handleSave();
                                if (success) {
                                  setEditingInterests(false);
                                  setEditingActivities(false);
                                  setEditingEvents(false);
                                  
                                  // Restore scroll position after brief delay to allow re-render
                                  setTimeout(() => {
                                    window.scrollTo({ top: currentScrollY, behavior: 'instant' });
                                  }, 100);
                                }
                              } catch (error) {
                                console.error('Save failed:', error);
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                            data-testid="button-save-preferences"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving Preferences...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">💾</span>
                                Save All Preferences
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}


                {/* Top Choices Section - Now comes AFTER Edit Button */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Top Choices for Most Travelers
                  </h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    {/* Show user's selected top choices, not the full list */}
                    {(user?.interests || []).filter(interest => MOST_POPULAR_INTERESTS.includes(interest)).map((item) => (
                      <div key={item} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                        {item}
                      </div>
                    ))}
                    {(user?.interests || []).filter(interest => MOST_POPULAR_INTERESTS.includes(interest)).length === 0 && (
                      <div className="text-gray-500 text-sm">No top choices selected yet</div>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Heart className="w-4 h-4 text-blue-500" />
                      {isOwnProfile ? 'Your Interests' : `@${user?.username}'s Interests`}
                    </h4>
                  </div>
                  
                  {editingInterests && !editingActivities && !editingEvents ? (
                    <div className="space-y-4">
                      {/* All Interests */}
                      <div>
                        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                          {ADDITIONAL_INTERESTS.map((interest) => {
                            const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                              interest.slice(2, -2) : interest;
                            const isSelected = tempInterests.includes(interest);
                            
                            return (
                              <button
                                key={interest}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setTempInterests(tempInterests.filter(i => i !== interest));
                                  } else {
                                    setTempInterests([...tempInterests, interest]);
                                  }
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black'
                                }`}
                              >
                                {displayText}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <Input
                          placeholder="Things you do, or things that you want to do NOT listed above - Hit enter after each choice"
                          value={customInterestInput}
                          onChange={(e) => setCustomInterestInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customInterestInput.trim();
                              if (trimmed && !editFormData.interests.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                                setCustomInterestInput('');
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const trimmed = customInterestInput.trim();
                            if (trimmed && !editFormData.interests.includes(trimmed)) {
                              setEditFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
                              setCustomInterestInput('');
                            }
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Private Interests Section */}
                      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-red-600 dark:text-red-400">🔒</span>
                          <h5 className="text-sm font-semibold text-red-800 dark:text-red-300">Private Interests</h5>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                          These interests are used for matching but never displayed publicly on your profile. Only you can see them.
                        </p>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Private interests for matching only - Hit enter after each choice"
                            value={privateInterestInput}
                            onChange={(e) => setPrivateInterestInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = privateInterestInput.trim();
                                if (trimmed && !editFormData.interests.includes(trimmed)) {
                                  // Add to interests but mark as private through naming convention
                                  const privateInterest = `[PRIVATE] ${trimmed}`;
                                  setEditFormData(prev => ({ ...prev, interests: [...prev.interests, privateInterest] }));
                                  setPrivateInterestInput('');
                                }
                              }
                            }}
                            className="bg-white dark:bg-gray-800 border-red-300 dark:border-red-600"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = privateInterestInput.trim();
                              if (trimmed && !editFormData.interests.includes(trimmed)) {
                                const privateInterest = `[PRIVATE] ${trimmed}`;
                                setEditFormData(prev => ({ ...prev, interests: [...prev.interests, privateInterest] }));
                                setPrivateInterestInput('');
                              }
                            }}
                            className="h-8 px-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* Show private interests */}
                        {editFormData.interests.filter(interest => interest.startsWith('[PRIVATE]')).length > 0 && (
                          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-600">
                            <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Your Private Interests:</p>
                            <div className="flex flex-wrap gap-2">
                              {editFormData.interests.filter(interest => interest.startsWith('[PRIVATE]')).map((interest) => (
                                <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-red-600 text-white">
                                  {interest.replace('[PRIVATE] ', '')}
                                  <button
                                    onClick={() => setEditFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }))}
                                    className="ml-1 text-red-200 hover:text-white"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Show selected interests - filter out top choices to avoid duplication */}
                      {tempInterests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Additional Interests:</p>
                          <div className="flex flex-wrap gap-2">
                            {tempInterests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).map((interest) => (
                              <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                                {interest}
                                <button
                                  onClick={() => setTempInterests(tempInterests.filter(i => i !== interest))}
                                  className="ml-1 text-blue-200 hover:text-white"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveInterests} disabled={updateInterests.isPending}>
                          {updateInterests.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelInterests} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* FULL VIEW: Show filtered interests (excluding top choices AND private) for matching purposes */}
                      {(() => {
                        // Use the filtering function to exclude top choices and private interests
                        const filteredInterests = getFilteredInterestsForProfile(user!, isOwnProfile);
                        const publicInterests = filteredInterests.filter(interest => !getPrivateInterests().includes(interest));
                        
                        if (publicInterests.length === 0) {
                          return <p className="text-gray-500 text-sm">No interests selected yet</p>;
                        }

                        const displayLimit = 12; // Show more initially since this is a matching site
                        const shouldShowToggle = publicInterests.length > displayLimit;
                        const displayedInterests = showAllInterests ? publicInterests : publicInterests.slice(0, displayLimit);
                        const hiddenCount = publicInterests.length - displayLimit;
                        
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {publicInterests.length} interest{publicInterests.length !== 1 ? 's' : ''} selected
                              </span>
                              {shouldShowToggle && (
                                <button
                                  onClick={() => setShowAllInterests(!showAllInterests)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                  data-testid="button-toggle-interests"
                                >
                                  {showAllInterests ? 'Show Less' : `Show All (${hiddenCount} more)`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              {displayedInterests.map((interest, index) => (
                                <div key={`interest-${index}`} className="inline-flex items-center justify-center h-7 sm:h-8 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                                  {interest}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* PRIVATE INTERESTS VIEW (Only visible to own profile) */}
                      {isOwnProfile && user?.privateInterests && user.privateInterests.length > 0 && (
                      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="w-4 h-4 text-red-500" />
                          <h5 className="text-sm font-semibold text-red-700 dark:text-red-300">Your Private Interests</h5>
                          <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                            Only you can see this
                          </div>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                          These interests help with matching but remain hidden from your public profile.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {user.privateInterests.map((interest, index) => (
                            <div 
                              key={`private-${index}`} 
                              className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-red-600 text-white"
                            >
                              🔒 {interest}
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Activities */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      {isOwnProfile ? 'Your Activities' : `@${user?.username}'s Activities`}
                    </h4>
                  </div>
                  
                  {editingActivities && !editingInterests && !editingEvents ? (
                    <div className="space-y-4">
                      <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300">
                        Your default preferences for trips and to match with Nearby Locals and Travelers. They can be added to and changed in the future for specific trips etc.
                      </div>
                      
                      {/* All Available Activities */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">All Available Activities</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                          {safeGetAllActivities().map((activity, index) => {
                            const isSelected = editFormData.activities.includes(activity);
                            
                            return (
                              <button
                                key={`activity-${activity}-${index}`}
                                type="button"
                                onClick={() => {
                                  toggleArrayValue(editFormData.activities, activity, (newActivities) => 
                                    setEditFormData({ ...editFormData, activities: newActivities })
                                  );
                                }}
                                className={`pill inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap border-0 appearance-none select-none gap-1.5 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black'
                                }`}
                              >
                                {activity}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <Input
                          placeholder="Things you do, or things that you want to do NOT listed above - Hit enter after each choice"
                          value={customActivityInput}
                          onChange={(e) => setCustomActivityInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customActivityInput.trim();
                              if (trimmed && !editFormData.activities.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                                setCustomActivityInput('');
                              }
                            }
                          }}
                        />
                        <Button type="button" onClick={() => {
                          const trimmed = customActivityInput.trim();
                            if (trimmed && !editFormData.activities.includes(trimmed)) {
                              setEditFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
                              setCustomActivityInput('');
                            }
                          }} variant="outline">Add</Button>
                      </div>
                      {/* Simple list of current activities with remove buttons */}
                      {tempActivities.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Current Activities:</p>
                          <div className="flex flex-wrap gap-2">
                            {tempActivities.map((activity, index) => (
                              <span key={`activity-${activity}-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                                {activity}
                                <button
                                  onClick={() => setTempActivities(tempActivities.filter(a => a !== activity))}
                                  className="ml-1 text-green-600 hover:text-red-600 font-bold"
                                  title={`Remove ${activity}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveActivities} disabled={updateActivities.isPending}>
                          {updateActivities.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelActivities} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* FULL VIEW: Show ALL activities for matching purposes */}
                      {(() => {
                        const activities = user?.activities || [];
                        
                        if (activities.length === 0) {
                          return <p className="text-gray-500 text-sm">No activities selected yet</p>;
                        }

                        const displayLimit = 10;
                        const shouldShowToggle = activities.length > displayLimit;
                        const displayedActivities = showAllActivities ? activities : activities.slice(0, displayLimit);
                        const hiddenCount = activities.length - displayLimit;
                        
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} selected
                              </span>
                              {shouldShowToggle && (
                                <button
                                  onClick={() => setShowAllActivities(!showAllActivities)}
                                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                                  data-testid="button-toggle-activities"
                                >
                                  {showAllActivities ? 'Show Less' : `Show All (${hiddenCount} more)`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {displayedActivities.map((activity, index) => (
                                <div key={`activity-${index}`} className="pill pill-activities inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none">
                                  {activity}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Events */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      {isOwnProfile ? 'Your Events' : `@${user?.username}'s Events`}
                    </h4>
                  </div>
                  
                  {editingEvents && !editingInterests && !editingActivities ? (
                    <div className="space-y-4">
                      {/* All Available Events */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">All Available Events</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                          {safeGetAllEvents().map((event, index) => {
                            const isSelected = tempEvents.includes(event);
                            
                            return (
                              <button
                                key={`event-${event}-${index}`}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setTempEvents(tempEvents.filter(ev => ev !== event));
                                  } else {
                                    setTempEvents([...tempEvents, event]);
                                  }
                                }}
                                className={`pill inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap border-0 appearance-none select-none gap-1.5 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-white text-black'
                                }`}
                              >
                                {event}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <Input
                          placeholder="List Any Events You have Not Found Above For Better Connections"
                          value={customEventInput}
                          onChange={(e) => setCustomEventInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customEventInput.trim();
                              if (trimmed && !editFormData.events.includes(trimmed)) {
                                setEditFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
                                setCustomEventInput('');
                              }
                            }
                          }}
                        />
                        <Button type="button" onClick={() => {
                          const trimmed = customEventInput.trim();
                            if (trimmed && !editFormData.events.includes(trimmed)) {
                              setEditFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
                              setCustomEventInput('');
                            }
                          }} variant="outline">Add</Button>
                      </div>
                      {/* Simple list of current events with remove buttons */}
                      {tempEvents.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Current Events:</p>
                          <div className="flex flex-wrap gap-2">
                            {tempEvents.map((event, index) => (
                              <span key={`event-${event}-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                                {event}
                                <button
                                  onClick={() => setTempEvents(tempEvents.filter(e => e !== event))}
                                  className="ml-1 text-purple-600 hover:text-red-600 font-bold"
                                  title={`Remove ${event}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEvents} disabled={updateEvents.isPending}>
                          {updateEvents.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEvents} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
                          Cancel
                        </Button>
                        <Button size="sm" variant="ghost" onClick={forceResetEditingStates} className="text-xs text-red-500 ml-2">
                          Reset
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* FULL VIEW: Show ALL events for matching purposes */}
                      {(() => {
                        const events = user?.events || [];
                        
                        if (events.length === 0) {
                          return <p className="text-gray-500 text-sm">No event types selected yet</p>;
                        }

                        const displayLimit = 8;
                        const shouldShowToggle = events.length > displayLimit;
                        const displayedEvents = showAllEvents ? events : events.slice(0, displayLimit);
                        const hiddenCount = events.length - displayLimit;
                        
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {events.length} event type{events.length !== 1 ? 's' : ''} selected
                              </span>
                              {shouldShowToggle && (
                                <button
                                  onClick={() => setShowAllEvents(!showAllEvents)}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                                  data-testid="button-toggle-events"
                                >
                                  {showAllEvents ? 'Show Less' : `Show All (${hiddenCount} more)`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {displayedEvents.map((event, index) => (
                                <div key={`event-${index}`} className="pill pill-events inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none">
                                  {event}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}


            {/* Things I Want to Do Widget - Show for all non-business profiles */}
            {user?.userType !== 'business' && (
              <ThingsIWantToDoSection
                userId={effectiveUserId || 0}
                isOwnProfile={isOwnProfile}
              />
            )}

            {/* Business Interests, Activities & Events Section - For business users only */}
            {user?.userType === 'business' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-orange-500" />
                    Business Interests, Activities & Events
                  </CardTitle>
                  {/* Single Edit Button for All Business Preferences - TOP RIGHT */}
                  {isOwnProfile && !editingInterests && !editingActivities && !editingEvents && (
                    <Button
                      onClick={() => {
                        console.log('🔧 BUSINESS EDIT - Starting:', { 
                          user,
                          hasCustomInterests: !!user?.customInterests,
                          hasCustomActivities: !!user?.customActivities,
                          hasCustomEvents: !!user?.customEvents,
                          customInterests: user?.customInterests,
                          customActivities: user?.customActivities,
                          customEvents: user?.customEvents
                        });
                        
                        // Open ALL editing modes at once for business users
                        setEditingInterests(true);
                        setEditingActivities(true);
                        setEditingEvents(true);
                        
                        // Initialize form data with combined predefined + custom entries
                        const userInterests = [...(user?.interests || [])];
                        const userActivities = [...(user?.activities || [])];
                        const userEvents = [...(user?.events || [])];
                        
                        // Add custom fields from database to the arrays for display
                        if (user?.customInterests) {
                          const customInterests = user.customInterests.split(',').map(s => s.trim()).filter(s => s);
                          console.log('🔧 Processing custom interests:', customInterests);
                          customInterests.forEach(item => {
                            if (!userInterests.includes(item)) {
                              userInterests.push(item);
                            }
                          });
                        }
                        if (user?.customActivities) {
                          const customActivities = user.customActivities.split(',').map(s => s.trim()).filter(s => s);
                          console.log('🔧 Processing custom activities:', customActivities);
                          customActivities.forEach(item => {
                            if (!userActivities.includes(item)) {
                              userActivities.push(item);
                            }
                          });
                        }
                        if (user?.customEvents) {
                          const customEvents = user.customEvents.split(',').map(s => s.trim()).filter(s => s);
                          console.log('🔧 Processing custom events:', customEvents);
                          customEvents.forEach(item => {
                            if (!userEvents.includes(item)) {
                              userEvents.push(item);
                            }
                          });
                        }
                        
                        console.log('🔧 BUSINESS EDIT - Final arrays:', { 
                          finalInterests: userInterests,
                          finalActivities: userActivities,
                          finalEvents: userEvents
                        });
                        
                        setEditFormData({
                          interests: userInterests,
                          activities: userActivities,
                          events: userEvents
                        });
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 break-words overflow-hidden">

                {/* Display current business interests/activities/events when not editing */}
                {(!editingInterests || !editingActivities || !editingEvents) && (
                  <div className="space-y-4">
                    {(() => {
                      // Combine predefined and custom fields for display
                      const allInterests = [...(user?.interests || [])];
                      const allActivities = [...(user?.activities || [])];
                      const allEvents = [...(user?.events || [])];
                      
                      // Add custom interests
                      if (user?.customInterests) {
                        const customInterests = user.customInterests.split(',').map(s => s.trim()).filter(s => s);
                        customInterests.forEach(item => {
                          if (!allInterests.includes(item)) {
                            allInterests.push(item);
                          }
                        });
                      }
                      
                      // Add custom activities
                      if (user?.customActivities) {
                        const customActivities = user.customActivities.split(',').map(s => s.trim()).filter(s => s);
                        customActivities.forEach(item => {
                          if (!allActivities.includes(item)) {
                            allActivities.push(item);
                          }
                        });
                      }
                      
                      // Add custom events
                      if (user?.customEvents) {
                        const customEvents = user.customEvents.split(',').map(s => s.trim()).filter(s => s);
                        customEvents.forEach(item => {
                          if (!allEvents.includes(item)) {
                            allEvents.push(item);
                          }
                        });
                      }
                      
                      return (
                        <>
                          {allInterests.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Interests</h4>
                              <div className="flex flex-wrap gap-2">
                                {allInterests.map((interest, index) => (
                                  <div key={`interest-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                                    {interest}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {allActivities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Activities</h4>
                              <div className="flex flex-wrap gap-2">
                                {allActivities.map((activity, index) => (
                                  <div key={`activity-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                                    {activity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {allEvents.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Events</h4>
                              <div className="flex flex-wrap gap-2">
                                {allEvents.map((event, index) => (
                                  <div key={`event-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                                    {event}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {(allInterests.length === 0 && allActivities.length === 0 && allEvents.length === 0) && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Click "Edit Business Preferences" to add your business interests, activities, and events</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Business Edit Form - Reuse the same unified editing system */}
                {isOwnProfile && (editingInterests && editingActivities && editingEvents) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Business Preferences</h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            try {
                              console.log('🔧 BUSINESS SAVING DATA:', editFormData);
                              
                              // Separate predefined vs custom entries for proper database storage
                              const predefinedInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].filter(opt => editFormData.interests.includes(opt));
                              const predefinedActivities = safeGetAllActivities().filter(opt => (editFormData.activities || []).includes(opt));
                              const predefinedEvents = safeGetAllEvents().filter(opt => editFormData.events.includes(opt));
                              
                              const customInterests = editFormData.interests.filter(int => !MOST_POPULAR_INTERESTS.includes(int) && !ADDITIONAL_INTERESTS.includes(int));
                              const customActivities = (editFormData.activities || []).filter(act => !safeGetAllActivities().includes(act));
                              const customEvents = editFormData.events.filter(evt => !safeGetAllEvents().includes(evt));
                              
                              const saveData = {
                                interests: predefinedInterests,
                                activities: predefinedActivities, 
                                events: predefinedEvents,
                                customInterests: customInterests.join(', '),
                                customActivities: customActivities.join(', '),
                                customEvents: customEvents.join(', ')
                              };
                              
                              console.log('🔧 BUSINESS SAVE - Separated data:', saveData);
                              
                              const response = await fetch(`/api/users/${effectiveUserId}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  // CRITICAL FIX: Remove massive x-user-data header causing 431 error
                                  'x-user-id': effectiveUserId?.toString() || '',
                                  'x-user-type': user?.userType || 'business'
                                },
                                body: JSON.stringify(saveData)
                              });
                              
                              if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Failed to save: ${errorText}`);
                              }
                              
                              // Refresh data
                              queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                              // Close editing modes
                              setEditingInterests(false);
                              setEditingActivities(false);
                              setEditingEvents(false);
                              
                              // Clear custom inputs
                              setCustomInterestInput('');
                              setCustomActivityInput('');
                              setCustomEventInput('');
                              
                              toast({
                                title: "Success!",
                                description: "Business preferences saved successfully.",
                              });
                            } catch (error: any) {
                              console.error('Failed to update business preferences:', error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to save business preferences. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={false}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save Business Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            // Cancel edits and close editing modes
                            setEditingInterests(false);
                            setEditingActivities(false);
                            setEditingEvents(false);
                            setEditFormData({
                              interests: user?.interests || [],
                              activities: user?.activities || [],
                              events: user?.events || []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    
                    {/* Reuse the same editing interface structure from non-business users */}
                    <div className="space-y-6">
                      {/* Business Interests Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Heart className="w-5 h-5 text-orange-500" />
                          Business Interests
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          {[...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].map((interest, index) => {
                            const isSelected = editFormData.interests.includes(interest);
                            console.log(`🔍 Interest "${interest}" is ${isSelected ? 'SELECTED' : 'not selected'} in:`, editFormData.interests);
                            return (
                              <button
                                key={`business-interest-${interest}-${index}`}
                                type="button"
                                onClick={() => {
                                  const newInterests = isSelected
                                    ? editFormData.interests.filter((i: string) => i !== interest)
                                    : [...editFormData.interests, interest];
                                  setEditFormData({ ...editFormData, interests: newInterests });
                                }}
                                className={`inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom Business Interests Input */}
                        <div className="mt-3">
                          <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                            Add Custom Business Interests (hit Enter after each)
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="e.g., Sustainable Tourism, Local Partnerships"
                              value={customInterestInput}
                              onChange={(e) => setCustomInterestInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customInterestInput.trim();
                                  if (trimmed && !editFormData.interests.includes(trimmed)) {
                                    setEditFormData({ ...editFormData, interests: [...editFormData.interests, trimmed] });
                                    setCustomInterestInput('');
                                  }
                                }
                              }}
                              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customInterestInput.trim();
                                if (trimmed && !editFormData.interests.includes(trimmed)) {
                                  setEditFormData({ ...editFormData, interests: [...editFormData.interests, trimmed] });
                                  setCustomInterestInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Interests with Delete Option */}
                          {editFormData.interests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest) && !ADDITIONAL_INTERESTS.includes(interest)).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Your Custom Interests (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {editFormData.interests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest) && !ADDITIONAL_INTERESTS.includes(interest)).map((interest, index) => (
                                  <span
                                    key={`custom-interest-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5"
                                  >
                                    {interest}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newInterests = editFormData.interests.filter(i => i !== interest);
                                        setEditFormData({ ...editFormData, interests: newInterests });
                                      }}
                                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Business Activities Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-green-500" />
                          Business Activities
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          {safeGetAllActivities().map((activity, index) => {
                            const isSelected = editFormData.activities.includes(activity);
                            return (
                              <button
                                key={`business-activity-${activity}-${index}`}
                                type="button"
                                onClick={() => {
                                  const newActivities = isSelected
                                    ? (editFormData.activities || []).filter((a: string) => a !== activity)
                                    : [...(editFormData.activities || []), activity];
                                  setEditFormData({ ...editFormData, activities: newActivities });
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700'
                                }`}
                              >
                                {activity}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom Business Activities Input */}
                        <div className="mt-3">
                          <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                            Add Custom Business Activities (hit Enter after each)
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="e.g., Private Tours, Corporate Events"
                              value={customActivityInput}
                              onChange={(e) => setCustomActivityInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customActivityInput.trim();
                                  if (trimmed && !(editFormData.activities || []).includes(trimmed)) {
                                    setEditFormData({ ...editFormData, activities: [...(editFormData.activities || []), trimmed] });
                                    setCustomActivityInput('');
                                  }
                                }
                              }}
                              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customActivityInput.trim();
                                if (trimmed && !(editFormData.activities || []).includes(trimmed)) {
                                  setEditFormData({ ...editFormData, activities: [...(editFormData.activities || []), trimmed] });
                                  setCustomActivityInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Activities with Delete Option */}
                          {((editFormData.activities || []).filter(activity => !safeGetAllActivities().includes(activity))).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Activities (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {((editFormData.activities || []).filter(activity => !safeGetAllActivities().includes(activity))).map((activity, index) => (
                                  <span
                                    key={`custom-activity-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5"
                                  >
                                    {activity}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newActivities = (editFormData.activities || []).filter(a => a !== activity);
                                        setEditFormData({ ...editFormData, activities: newActivities });
                                      }}
                                      className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Business Events Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          Business Events
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          {safeGetAllEvents().map((event, index) => {
                            const isSelected = editFormData.events.includes(event);
                            return (
                              <button
                                key={`business-event-${event}-${index}`}
                                type="button"
                                onClick={() => {
                                  const newEvents = isSelected
                                    ? editFormData.events.filter((e: string) => e !== event)
                                    : [...editFormData.events, event];
                                  setEditFormData({ ...editFormData, events: newEvents });
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700'
                                }`}
                              >
                                {event}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom Business Events Input */}
                        <div className="mt-3">
                          <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                            Add Custom Business Events (hit Enter after each)
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="e.g., Wine Tastings, Art Shows, Workshops"
                              value={customEventInput}
                              onChange={(e) => setCustomEventInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customEventInput.trim();
                                  if (trimmed && !editFormData.events.includes(trimmed)) {
                                    setEditFormData({ ...editFormData, events: [...editFormData.events, trimmed] });
                                    setCustomEventInput('');
                                  }
                                }
                              }}
                              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customEventInput.trim();
                                if (trimmed && !editFormData.events.includes(trimmed)) {
                                  setEditFormData({ ...editFormData, events: [...editFormData.events, trimmed] });
                                  setCustomEventInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Events with Delete Option */}
                          {editFormData.events.filter(event => !safeGetAllEvents().includes(event)).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Events (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {editFormData.events.filter(event => !safeGetAllEvents().includes(event)).map((event, index) => (
                                  <span
                                    key={`custom-event-${index}`}
                                    className="pill inline-flex items-center"
                                  >
                                    {event}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newEvents = editFormData.events.filter(e => e !== event);
                                        setEditFormData({ ...editFormData, events: newEvents });
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Button for Business Preferences */}
                {isOwnProfile && (editingInterests && editingActivities && editingEvents) && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-center">
                      <Button 
                        onClick={async () => {
                          try {
                            console.log('🔧 BUSINESS SAVING DATA (Bottom Button):', editFormData);
                            
                            // Separate predefined vs custom entries for proper database storage
                            const predefinedInterests = [...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].filter(opt => editFormData.interests.includes(opt));
                            const predefinedActivities = safeGetAllActivities().filter(opt => (editFormData.activities || []).includes(opt));
                            const predefinedEvents = safeGetAllEvents().filter(opt => editFormData.events.includes(opt));
                            
                            const customInterests = editFormData.interests.filter(int => !MOST_POPULAR_INTERESTS.includes(int) && !ADDITIONAL_INTERESTS.includes(int));
                            const customActivities = (editFormData.activities || []).filter(act => !safeGetAllActivities().includes(act));
                            const customEvents = editFormData.events.filter(evt => !safeGetAllEvents().includes(evt));
                            
                            const saveData = {
                              interests: predefinedInterests,
                              activities: predefinedActivities, 
                              events: predefinedEvents,
                              customInterests: customInterests.join(', '),
                              customActivities: customActivities.join(', '),
                              customEvents: customEvents.join(', ')
                            };
                            
                            console.log('🔧 BUSINESS SAVE - Final payload:', JSON.stringify(saveData, null, 2));
                            
                            const response = await fetch(`/api/users/${effectiveUserId}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                // CRITICAL FIX: Remove massive x-user-data header causing 431 error
                                'x-user-id': effectiveUserId?.toString() || '',
                                'x-user-type': user?.userType || 'business'
                              },
                              body: JSON.stringify(saveData)
                            });
                            
                            console.log('🔧 BUSINESS SAVE - Response status:', response.status);
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              console.error('🔴 BUSINESS SAVE - Error response:', errorText);
                              throw new Error(`Failed to save: ${response.status} ${errorText}`);
                            }
                            
                            const responseData = await response.json();
                            console.log('🔧 BUSINESS SAVE - Response data:', responseData);
                            
                            if (!response.ok) {
                              throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
                            }
                            
                            // Update cache and UI
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                            
                            // Close editing modes
                            setEditingInterests(false);
                            setEditingActivities(false);
                            setEditingEvents(false);
                            
                            // Clear custom inputs
                            setCustomInterestInput('');
                            setCustomActivityInput('');
                            setCustomEventInput('');
                            
                            toast({
                              title: "Success!",
                              description: "Business preferences saved successfully.",
                            });
                          } catch (error: any) {
                            console.error('Failed to update business preferences:', error);
                            toast({
                              title: "Error",
                              description: error.message || "Failed to save business preferences. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                        size="lg"
                      >
                        💾 Save Business Changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}







            {/* Our Events Widget - only for business profiles */}
            {user?.userType === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Our Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BusinessEventsWidget userId={effectiveUserId || 0} />
                </CardContent>
              </Card>
            )}


            {/* Photo Albums Widget - Separate from Travel Memories */}
            {user?.userType !== 'business' && (
              <Card>
                <CardContent className="p-6">
                  <PhotoAlbumWidget 
                    userId={effectiveUserId || 0}
                    isOwnProfile={isOwnProfile}
                  />
                </CardContent>
              </Card>
            )}



            {/* Photo Gallery Preview */}
            {/* Photos Panel - Optimized Preview */}
            {activeTab === 'photos' && loadedTabs.has('photos') && (
              <div 
                role="tabpanel"
                id="panel-photos"
                aria-labelledby="tab-photos"
                ref={tabRefs.photos}
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="photos-content"
              >
              <Card className="bg-white border border-black dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <Camera className="w-5 h-5" />
                    Photos & Travel Memories ({photos.length + (userTravelMemories?.length || 0)})
                  </CardTitle>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex-1 sm:flex-none text-xs sm:text-sm"
                    onClick={() => setShowFullGallery(true)}
                  >
                    View Full Gallery
                  </Button>
                  {isOwnProfile && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => setLocation('/upload-photos')}
                        className="bg-green-500 text-white hover:bg-green-600 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        Upload Photos
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-white text-black hover:bg-blue-600 border-blue-500 flex-1 sm:flex-none text-xs sm:text-sm"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Quick Add'}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(photos.length > 0 || userTravelMemories?.length > 0) ? (
                  <div className="space-y-4">
                    {/* Recent Photos Preview (max 6) */}
                    {photos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Photos</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {photos.slice(0, 6).map((photo, index) => (
                            <div
                              key={photo.id}
                              className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                              onClick={() => { setSelectedPhotoIndex(index); setShowFullGallery(true); }}
                            >
                              <img 
                                src={photo.imageUrl} 
                                alt={photo.caption || 'Travel photo'}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                        {photos.length > 6 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{photos.length - 6} more photos. Click "View Full Gallery" to see all.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Travel Memories Preview */}
                    {userTravelMemories && userTravelMemories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Travel Memories</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {userTravelMemories.slice(0, 3).map((memory: any) => (
                            <div
                              key={memory.id}
                              className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                              onClick={() => setShowFullGallery(true)}
                            >
                              <img 
                                src={memory.imageUrl} 
                                alt={memory.caption || 'Travel memory'}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs font-medium truncate">{memory.location}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {userTravelMemories.length > 3 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{userTravelMemories.length - 3} more memories. Click "View Full Gallery" to see all.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-white">No photos or travel memories yet</p>
                    {isOwnProfile && (
                      <p className="text-sm text-gray-600 dark:text-white">Share your travel memories!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}

            {/* Countries Tab */}
            {/* Countries Panel - Lazy Loaded */}
            {activeTab === 'countries' && loadedTabs.has('countries') && (
              <div 
                role="tabpanel"
                id="panel-countries"
                aria-labelledby="tab-countries"
                ref={tabRefs.countries}
                className="space-y-4 mt-6" 
                style={{zIndex: 10, position: 'relative'}} 
                data-testid="countries-content"
              >
                <Card className="bg-white border border-black dark:bg-gray-900 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                        <Globe className="w-5 h-5" />
                        Countries I've Visited ({countriesVisited.length})
                      </CardTitle>
                      {isOwnProfile && !editingCountries && (
                        <Button size="sm" variant="outline" onClick={handleEditCountries}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-900">
                    {editingCountries ? (
                      <div className="space-y-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            >
                              {tempCountries.length > 0 
                                ? `${tempCountries.length} countr${tempCountries.length > 1 ? 'ies' : 'y'} selected`
                                : "Select countries visited..."
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                            <Command className="bg-white dark:bg-gray-800">
                              <CommandInput placeholder="Search countries..." className="border-0" />
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {COUNTRIES_OPTIONS.map((country) => (
                                  <CommandItem
                                    key={country}
                                    value={country}
                                    onSelect={() => {
                                      setTempCountries(current =>
                                        current.includes(country)
                                          ? current.filter(c => c !== country)
                                          : [...current, country]
                                      );
                                    }}
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        tempCountries.includes(country) ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {country}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* Show selected countries */}
                        {tempCountries.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {tempCountries.map((country) => (
                              <div key={country} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md">
                                <span className="text-sm">{country}</span>
                                <button
                                  onClick={() => setTempCountries(current => current.filter(c => c !== country))}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              updateCountries.mutate(tempCountries);
                            }}
                            disabled={updateCountries.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {updateCountries.isPending ? "Saving..." : "Save Countries"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingCountries(false);
                              setTempCountries(user?.countriesVisited || []);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {countriesVisited.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {countriesVisited.map((country: string, index: number) => (
                              <div 
                                key={country} 
                                className="pill-interests"
                              >
                                {country}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-white text-sm">No countries visited yet</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Event Organizer Hub - for ALL users who want to organize events */}
            {isOwnProfile && (
              <EventOrganizerHubSection userId={effectiveUserId || 0} />
            )}
          </div>

          {/* Right Sidebar - Mobile Responsive */}
          <div className="w-full lg:col-span-1 space-y-2 lg:space-y-4">
            {/* Quick Meetup Widget - Only show for own profile (travelers/locals only, NOT business) */}
            {isOwnProfile && user && user.userType !== 'business' && (
              <div className="mt-6" data-testid="quick-meet-widget">
                <QuickMeetupWidget 
                  city={user?.hometownCity ?? ''} 
                  profileUserId={user?.id}
                  triggerCreate={triggerQuickMeetup}
                />
              </div>
            )}

            {/* Quick Deals Widget for Business Users - Only show if deals exist */}
            {isOwnProfile && user?.userType === 'business' && quickDeals && quickDeals.length > 0 && (
              <div className="mt-6">
                <QuickDealsWidget 
                  city={user?.hometownCity ?? ''} 
                  profileUserId={user?.id} 
                  showCreateForm={showCreateDeal}
                  onCloseCreateForm={() => {
                    console.log('🔥 CLOSING create deal form');
                    setShowCreateDeal(false);
                  }}
                />
              </div>
            )}


            {/* Travel Stats - Hidden for business profiles - MOVED UP */}
            {user?.userType !== 'business' && (
              <Card 
                className="hover:shadow-lg transition-all duration-200 hover:border-orange-300"
              >
                <CardHeader>
                  <CardTitle className="dark:text-white">Travel Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 break-words overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Travel Aura
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{user?.aura || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Connections</span>
                    <span className="font-semibold dark:text-white">{userConnections.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Active Travel Plans</span>
                    <span className="font-semibold dark:text-white">{(travelPlans || []).filter(plan => plan.status === 'planned' || plan.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Cumulative Trips Taken</span>
                    <span className="font-semibold dark:text-white">{(travelPlans || []).filter(plan => plan.status === 'completed').length}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => setShowChatroomList(true)}
                  >
                    <span className="text-gray-600 dark:text-gray-300">City Chatrooms</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{userChatrooms.length}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="hidden sm:inline">Vouches</span>
                      <span className="sm:hidden">Vouches {(vouches?.length || 0) === 0 ? '• Get vouched by community' : ''}</span>
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{vouches?.length || 0}</span>
                  </div>
                  {(vouches?.length || 0) === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6 hidden sm:block">
                      Get vouched by vouched community members who know you personally
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contacts Panel - Lazy Loaded */}
            {activeTab === 'contacts' && loadedTabs.has('contacts') && (
              <div 
                role="tabpanel"
                id="panel-contacts"
                aria-labelledby="tab-contacts"
                ref={tabRefs.contacts}
                className="space-y-4 mt-6" 
              style={{zIndex: 10, position: 'relative'}} 
              data-testid="contacts-content"
            >
              <Card className="bg-white border border-black dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="bg-white dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-black dark:text-white">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      Connections ({userConnections.length})
                    </div>
                  {userConnections.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConnectionFilters(!showConnectionFilters)}
                      className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                    >
                      {showConnectionFilters ? "Hide Options" : "Sort & View"}
                    </Button>
                  )}
                </CardTitle>
                
                {/* Filter Panel */}
                {showConnectionFilters && userConnections.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
                        <Select
                          value={connectionFilters.location || "all"}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, location: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            {userConnections
                              .map((conn: any) => conn.connectedUser?.location)
                              .filter((location: any) => Boolean(location))
                              .filter((location: any, index: number, arr: any[]) => arr.indexOf(location) === index)
                              .map((location: any) => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Gender</label>
                        <Select
                          value={connectionFilters.gender}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, gender: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="Any gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any gender</SelectItem>
                            {GENDER_OPTIONS.map((gender) => (
                              <SelectItem key={gender} value={gender.toLowerCase()}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Sexual Preference</label>
                        <Select
                          value={connectionFilters.sexualPreference}
                          onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, sexualPreference: value === "all" ? "" : value }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                            <SelectValue placeholder="Any preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any preference</SelectItem>
                            {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                              <SelectItem key={preference} value={preference}>
                                {preference}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Min Age</label>
                        <Input
                          type="number"
                          placeholder="Min age"
                          value={connectionFilters.minAge}
                          onChange={(e) => setConnectionFilters(prev => ({ ...prev, minAge: e.target.value }))}
                          className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          min="18"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Max Age</label>
                        <Input
                          type="number"
                          placeholder="Max age"
                          value={connectionFilters.maxAge}
                          onChange={(e) => setConnectionFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                          className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                          min="18"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectionFilters({ location: 'all', gender: 'all', sexualPreference: 'all', minAge: '', maxAge: '' })}
                        className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {userConnections.length > 0 ? (
                  <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {userConnections.slice(0, connectionsDisplayCount).map((connection: any) => (
                      <div
                        key={connection.id}
                        className="rounded-xl border p-3 hover:shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center text-center gap-2"
                      >
                        <SimpleAvatar
                          user={connection.connectedUser}
                          size="md"
                          className="w-16 h-16 sm:w-14 sm:h-14 rounded-full border-2 object-cover cursor-pointer"
                          onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                        />
                        <div className="w-full">
                          <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                            {connection.connectedUser?.name || connection.connectedUser?.username}
                          </p>
                          <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                            {connection.connectedUser?.hometownCity && connection.connectedUser?.hometownCountry
                              ? `${connection.connectedUser?.hometownCity}, ${connection.connectedUser?.hometownCountry.replace("United States", "USA")}`
                              : "New member"}
                          </p>
                          
                          {/* How We Met Notes - Only for Profile Owner */}
                          {isOwnProfile && (
                            <div className="mt-2 w-full">
                              {connection.connectionNote ? (
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs">
                                  <p className="text-blue-700 dark:text-blue-300 font-medium">How we met:</p>
                                  <p className="text-blue-600 dark:text-blue-200">{connection.connectionNote}</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="mt-1 h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingConnectionNote(connection.id);
                                      setConnectionNoteText(connection.connectionNote || '');
                                    }}
                                  >
                                    Edit note
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-1 h-6 px-2 text-xs w-full border-dashed"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingConnectionNote(connection.id);
                                    setConnectionNoteText('');
                                  }}
                                >
                                  + Add note
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Connection Note Edit Form */}
                          {isOwnProfile && editingConnectionNote === connection.id && (
                            <div className="mt-2 w-full space-y-2">
                              <textarea
                                value={connectionNoteText}
                                onChange={(e) => setConnectionNoteText(e.target.value)}
                                placeholder="How did you meet? Add a private note..."
                                className="w-full p-2 text-xs border rounded resize-none"
                                rows={3}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    // TODO: Add save mutation here
                                    setEditingConnectionNote(null);
                                    setConnectionNoteText('');
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    setEditingConnectionNote(null);
                                    setConnectionNoteText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Connection Note - How We Met */}
                          {isOwnProfile && (
                            <div className="mt-2 w-full">
                              {editingConnectionNote === connection.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={connectionNoteText}
                                    onChange={(e) => setConnectionNoteText(e.target.value)}
                                    placeholder="How did we meet? e.g., met at bonfire BBQ"
                                    className="text-xs h-7 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        // Save connection note
                                        apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                          connectionNote: connectionNoteText
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                          setEditingConnectionNote(null);
                                          setConnectionNoteText('');
                                        }).catch(console.error);
                                      }
                                    }}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                          connectionNote: connectionNoteText
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                          setEditingConnectionNote(null);
                                          setConnectionNoteText('');
                                        }).catch(console.error);
                                      }}
                                      className="h-6 px-2 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingConnectionNote(null);
                                        setConnectionNoteText('');
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1 mt-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingConnectionNote(connection.id);
                                    setConnectionNoteText(connection.connectionNote || '');
                                  }}
                                  title="Click to edit how you met"
                                >
                                  {connection.connectionNote ? (
                                    <span className="text-blue-600 dark:text-blue-400">📍 {connection.connectionNote}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">+ How did we meet?</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Show connection note for others viewing */}
                          {!isOwnProfile && connection.connectionNote && (
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                              📍 {connection.connectionNote}
                            </div>
                          )}
                        </div>

                        {/* Show the button on ≥sm only; on mobile the whole tile is tappable */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="hidden sm:inline-flex h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                          onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                    
                    {/* Load More / Load Less buttons */}
                    {userConnections.length > 3 && (
                      <div className="text-center pt-2">
                        {connectionsDisplayCount < userConnections.length ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConnectionsDisplayCount(userConnections.length)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 h-8"
                          >
                            Load More ({userConnections.length - connectionsDisplayCount} more)
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConnectionsDisplayCount(3)}
                            className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 h-8"
                          >
                            Load Less
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No connections yet</p>
                    <p className="text-xs">
                      {isOwnProfile 
                        ? "Start connecting with other travelers" 
                        : "This user hasn't made any connections yet"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
              
              {/* Add Contact-related widgets here if any */}
              {isOwnProfile && connectionRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Connect with other travelers to see them here</p>
                  </CardContent>
                </Card>
              )}
            </div>
            )}

            {/* Reference Widget - Only show for other users' profiles */}
            {!isOwnProfile && userConnections.some((conn: any) => conn.status === 'accepted') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Write a Reference
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Share your experience with {user?.username} to help others in the community
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    onClick={() => setShowWriteReferenceModal(true)}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 25%, #f97316 75%, #ea580c 100%)',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 25%, #ea580c 75%, #dc2626 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 25%, #f97316 75%, #ea580c 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Write Reference for {user?.username}
                  </div>
                  
                  {showReferenceForm && (
                    <div className="space-y-4 mt-4">
                      <Form {...referenceForm}>
                        <form onSubmit={referenceForm.handleSubmit((data) => {
                          console.log('Form submitted with data:', data);
                          console.log('Form errors:', referenceForm.formState.errors);
                          // Ensure required fields are set according to userReferences schema
                          const submissionData = {
                            reviewerId: currentUser?.id || 0,
                            revieweeId: user?.id || 0,
                            experience: data.experience || 'positive',
                            content: data.content || '',
                          };
                          createReference.mutate(submissionData);
                        }, (errors) => {
                          console.log('Form validation errors:', errors);
                        })} className="space-y-4">
                          
                          {/* Note: revieweeId and reviewerId handled in submission data */}

                          {/* Reference Content */}
                          <FormField
                            control={referenceForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Reference</FormLabel>
                                <FormControl>
                                  <textarea
                                    placeholder="Share your experience with this person..."
                                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Experience Type */}
                          <FormField
                            control={referenceForm.control}
                            name="experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select experience type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="positive">Positive Experience</SelectItem>
                                    <SelectItem value="neutral">Neutral Experience</SelectItem>
                                    <SelectItem value="negative">Negative Experience</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setShowReferenceForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createReference.isPending}>
                              {createReference.isPending ? 'Submitting...' : 'Submit Reference'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* MOBILE-FRIENDLY RIGHT-SIDE WIDGETS SECTION */}
            
            {/* Languages Widget - Top Priority for Customer Visibility */}
            <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Languages I Speak
                  </CardTitle>
                  {isOwnProfile && !editingLanguages && (
                    <Button size="sm" variant="outline" onClick={handleEditLanguages} className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300">
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingLanguages ? (
                  <div className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-left"
                        >
                          {tempLanguages.length > 0 
                            ? `${tempLanguages.length} language${tempLanguages.length > 1 ? 's' : ''} selected`
                            : "Select languages..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                        <Command className="bg-white dark:bg-gray-800">
                          <CommandInput placeholder="Search languages..." className="border-0" />
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {LANGUAGES_OPTIONS.map((language) => (
                              <CommandItem
                                key={language}
                                value={language}
                                onSelect={() => {
                                  const isSelected = tempLanguages.includes(language);
                                  if (isSelected) {
                                    setTempLanguages(tempLanguages.filter(l => l !== language));
                                  } else {
                                    setTempLanguages([...tempLanguages, language]);
                                  }
                                }}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    tempLanguages.includes(language) ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {language}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Custom Language Input */}
                    <div className="mt-3">
                      <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                        Add Custom Language (hit Enter after each)
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="e.g., Sign Language, Mandarin"
                          value={customLanguageInput}
                          onChange={(e) => setCustomLanguageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customLanguageInput.trim();
                              if (trimmed && !tempLanguages.includes(trimmed)) {
                                setTempLanguages([...tempLanguages, trimmed]);
                                setCustomLanguageInput('');
                              }
                            }
                          }}
                          className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const trimmed = customLanguageInput.trim();
                            if (trimmed && !tempLanguages.includes(trimmed)) {
                              setTempLanguages([...tempLanguages, trimmed]);
                              setCustomLanguageInput('');
                            }
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Show selected languages */}
                    {tempLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {tempLanguages.map((language) => (
                          <div key={language} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                            {language}
                            <button
                              onClick={() => setTempLanguages(tempLanguages.filter(l => l !== language))}
                              className="ml-2 text-blue-200 hover:text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveLanguages} disabled={updateLanguages.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {updateLanguages.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelLanguages}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {user.languagesSpoken && user.languagesSpoken.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.languagesSpoken.map((language: string) => (
                          <div key={language} className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0 appearance-none select-none gap-1.5 shadow-md">
                            {language}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No languages listed</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* References Widget */}
            {activeTab === 'references' && user?.id && (
              <div className="space-y-4 mt-6" style={{zIndex: 10, position: 'relative'}}>
                <Card className="bg-white border border-black dark:bg-gray-900 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="bg-white dark:bg-gray-900">
                    <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                      <Star className="w-5 h-5 text-yellow-500" />
                      References
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-900">
                    <ReferencesWidgetNew userId={user.id} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vouch Widget */}
            {/* References Panel - Lazy Loaded */}
            {activeTab === 'references' && loadedTabs.has('references') && (
              <div 
                role="tabpanel"
                id="panel-references"
                aria-labelledby="tab-references"
                ref={tabRefs.references}
                className="mt-6"
              data-testid="references-content"
            >
              {user?.id && (
                <div>
                <VouchWidget 
                  userId={user.id} 
                  isOwnProfile={isOwnProfile}
                  currentUserId={currentUser?.id || 0}
                />
                </div>
              )}
            </div>
            )}

            {/* Travel Panel - Lazy Loaded */}
            {activeTab === 'travel' && loadedTabs.has('travel') && user?.userType !== 'business' && (
              <div 
                role="tabpanel"
                id="panel-travel"
                aria-labelledby="tab-travel"
                ref={tabRefs.travel}
                className="mt-6"
                data-testid="travel-content"
              >
                {/* Travel Plans Widget - No wrapper needed, widget has its own styling */}
                <TravelPlansWidget userId={effectiveUserId} />
              </div>
            )}

            {/* Travel Intent Widget - TangoTrips-inspired */}
            {user?.userType !== 'business' && (
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Travel Intent & Style
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setLocation('/travel-quiz')}
                        className="ml-auto bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    What drives your travel and how you like to explore
                  </p>
                </CardHeader>
                <CardContent>
                  {isOwnProfile ? (
                    <div className="space-y-4">
                      {/* Display Current Travel Intent */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Why you travel</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelWhy || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Travel style</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelHow || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget range</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelBudget || 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Group type</Label>
                          <div className="mt-1 p-2 rounded border bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user?.travelGroup || 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation('/travel-quiz')}
                        className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400"
                      >
                        Update Travel Intent
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Why:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelWhy ? user.travelWhy.charAt(0).toUpperCase() + user.travelWhy.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Style:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelHow ? user.travelHow.charAt(0).toUpperCase() + user.travelHow.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Budget:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelBudget ? user.travelBudget.charAt(0).toUpperCase() + user.travelBudget.slice(1) : 'Not shared'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Group:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {user?.travelGroup ? user.travelGroup.charAt(0).toUpperCase() + user.travelGroup.slice(1) : 'Not shared'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Compatibility indicator when viewing other profiles */}
                      {compatibilityData?.travelStyleCompatibility && (
                        <div className="mt-3 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              {compatibilityData.travelStyleCompatibility}% Travel Style Match
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}





            {/* Friend Referral Widget - Only show for own profile and non-business users */}
            {isOwnProfile && user?.userType !== 'business' && (
              <FriendReferralWidget />
            )}





            {/* Connection Requests Widget - Only visible to profile owner */}
            {isOwnProfile && connectionRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Connection Requests ({connectionRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectionRequests.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => setLocation(`/profile/${request.requesterUser?.id?.toString() || ''}`)}
                        >
                          <SimpleAvatar 
                            user={request.requesterUser} 
                            size="sm" 
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">@{request.requesterUser?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {request.requesterUser?.location || `@${request.requesterUser?.username}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Accept connection request
                              apiRequest('PUT', `/api/connections/${request.id}`, { status: 'accepted' })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}/requests`] });
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                  toast({
                                    title: "Connection accepted",
                                    description: `You are now connected with @${request.requesterUser?.username}`,
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to accept connection request",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            className="h-8 w-16 px-2 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Decline connection request
                              apiRequest('PUT', `/api/connections/${request.id}`, { status: 'rejected' })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}/requests`] });
                                  toast({
                                    title: "Connection declined",
                                    description: "Connection request declined",
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to decline connection request",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            className="h-8 w-16 px-2 text-xs"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                    {connectionRequests.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-gray-500 hover:text-blue-600 h-8"
                        onClick={() => setLocation('/requests')}
                      >
                        View all {connectionRequests.length} requests
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Countries Visited - Hidden for business profiles - Only show in countries tab */}
            {activeTab === 'countries' && user?.userType !== 'business' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      <span className="text-black dark:text-white">Countries I've Visited ({countriesVisited.length})</span>
                    </CardTitle>
                    {isOwnProfile && !editingCountries && (
                      <Button size="sm" variant="outline" onClick={handleEditCountries}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingCountries ? (
                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-left"
                          >
                            {tempCountries.length > 0 
                              ? `${tempCountries.length} countr${tempCountries.length > 1 ? 'ies' : 'y'} selected`
                              : "Select countries visited..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                          <Command className="bg-white dark:bg-gray-800">
                            <CommandInput placeholder="Search countries..." className="border-0" />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {COUNTRIES_OPTIONS.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={() => {
                                    const isSelected = tempCountries.includes(country);
                                    if (isSelected) {
                                      setTempCountries(tempCountries.filter(c => c !== country));
                                    } else {
                                      setTempCountries([...tempCountries, country]);
                                    }
                                  }}
                                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      tempCountries.includes(country) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {country}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Custom Country Input */}
                      <div className="mt-3">
                        <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                          Add Custom Country (hit Enter after each)
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="e.g., Vatican City, San Marino"
                            value={customCountryInput}
                            onChange={(e) => setCustomCountryInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customCountryInput.trim();
                                if (trimmed && !tempCountries.includes(trimmed)) {
                                  setTempCountries([...tempCountries, trimmed]);
                                  setCustomCountryInput('');
                                }
                              }
                            }}
                            className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const trimmed = customCountryInput.trim();
                              if (trimmed && !tempCountries.includes(trimmed)) {
                                setTempCountries([...tempCountries, trimmed]);
                                setCustomCountryInput('');
                              }
                            }}
                            className="h-8 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Show selected countries */}
                      {tempCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {tempCountries.map((country) => (
                            <div key={country} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white text-black border border-black">
                              {country}
                              <button
                                onClick={() => setTempCountries(tempCountries.filter(c => c !== country))}
                                className="ml-2 text-green-200 hover:text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCountries} disabled={updateCountries.isPending}>
                          {updateCountries.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelCountries}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {countriesVisited.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {countriesVisited.map((country: string, index: number) => (
                            <div 
                              key={country} 
                              className="pill-interests"
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-white text-sm">No countries visited yet</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}



            {/* Comprehensive Geolocation System - Enhanced location sharing for users, businesses, and events */}
            {console.log('🔧 Profile: Checking if location sharing should render:', { isOwnProfile, userId: user?.id })}
            {isOwnProfile && user && (
              <LocationSharingSection user={user} queryClient={queryClient} toast={toast} />
            )}



            {/* Owner/Admin Contact Information - Only visible to business owner */}
            {isOwnProfile && user?.userType === 'business' && (
              <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Admin Information
                      </CardTitle>
                      <div className="inline-flex items-center justify-center h-6 min-w-[4rem] rounded-full px-2 text-xs font-medium leading-none whitespace-nowrap bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 border-0 appearance-none select-none gap-1">
                        Private
                      </div>
                    </div>
                    {!editingOwnerInfo && (
                      <Button
                        size="sm"
                        onClick={() => setEditingOwnerInfo(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Internal contact information for platform communications
                  </p>
                </CardHeader>
                <CardContent>
                  {editingOwnerInfo ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</Label>
                        <Input 
                          value={ownerContactForm.ownerName}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, ownerName: e.target.value }))}
                          placeholder="Enter business name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</Label>
                        <Input 
                          value={ownerContactForm.contactName}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Enter main contact person name"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          The person we should contact (may be different from owner)
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</Label>
                        <Input 
                          value={ownerContactForm.ownerEmail}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                          placeholder="owner@business.com"
                          type="email"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person Phone Number</Label>
                        <Input 
                          value={ownerContactForm.ownerPhone}
                          onChange={(e) => setOwnerContactForm(prev => ({ ...prev, ownerPhone: e.target.value }))}
                          placeholder="(555) 123-4567"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveOwnerContact}
                          disabled={updateOwnerContact.isPending}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {updateOwnerContact.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingOwnerInfo(false);
                            setOwnerContactForm({
                              ownerName: user?.ownerName || "",
                              contactName: user?.contactName || "",
                              ownerEmail: user?.ownerEmail || "",
                              ownerPhone: user?.ownerPhone || ""
                            });
                          }}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Business Name:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.ownerName || "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Name:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.contactName || "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Email:</span>
                        {user?.ownerEmail ? (
                          <a 
                            href={`mailto:${user.ownerEmail}`} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                          >
                            {user.ownerEmail}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Not set
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contact Person Phone:</span>
                        {user?.ownerPhone ? (
                          <a 
                            href={`tel:${user.ownerPhone}`} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                          >
                            {user.ownerPhone}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Not set
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-purple-100 dark:bg-purple-900/50 p-2 rounded">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        This information is only visible to you and used for platform communications
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Boost Connections Widget - MOVED TO BOTTOM - Only show for own profile */}
            {isOwnProfile && (
              <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/30 dark:to-blue-900/30 hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div className="inline-flex items-center justify-center h-6 min-w-[4rem] rounded-full px-2 text-xs font-medium leading-none whitespace-nowrap bg-orange-600 text-white border-0 appearance-none select-none gap-1">Success Tips</div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Boost Your Connections
                  </CardTitle>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Get better matches and more connections with our optimization guide
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => setLocation('/getting-started')}
                    className="w-full bg-gradient-to-r from-blue-500 via-orange-500 to-violet-500 hover:from-blue-600 hover:via-orange-600 hover:to-violet-600 text-white border-0"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Optimize Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>


      {/* Photo Lightbox */}
      {photos.length > 0 && selectedPhotoIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/80" 
            onClick={() => setSelectedPhotoIndex(-1)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] p-6 m-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Photo {selectedPhotoIndex + 1} of {photos.length}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setSelectedPhotoIndex(-1)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <img 
                src={photos[selectedPhotoIndex]?.imageUrl} 
                alt="Photo"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                disabled={selectedPhotoIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {photos[selectedPhotoIndex]?.caption}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                disabled={selectedPhotoIndex === photos.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={() => setShowCropModal(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Cover Photo</DialogTitle>
            <DialogDescription>
              Adjust the position and size of your cover photo. The photo will be cropped to a 16:9 aspect ratio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image preview with crop overlay */}
            <div 
              className="relative bg-gray-100 rounded-lg overflow-hidden select-none" 
              style={{ aspectRatio: '16/9', height: '400px' }}
            >
              {cropImageSrc ? (
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={cropImageSrc}
                    alt=""
                    className={`absolute transition-transform ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      width: `${cropSettings.scale * 100}%`,
                      height: `${cropSettings.scale * 100}%`,
                      left: `${-cropSettings.x * (cropSettings.scale - 1) * 100}%`,
                      top: `${-cropSettings.y * (cropSettings.scale - 1) * 100}%`,
                      objectFit: 'cover'
                    }}
                    onLoad={() => console.log('Crop image loaded successfully')}
                    onError={(e) => console.error('Crop image failed to load:', e)}

                    draggable={false}
                  />
                  {/* Crop overlay frame */}
                  <div className="absolute inset-0 border-2 border-blue-500 shadow-lg pointer-events-none" />
                  {/* Grid overlay for better cropping guidance */}
                  <div className="absolute inset-0 pointer-events-none opacity-50">
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div></div>
                    </div>
                  </div>
                  {/* Instructions overlay */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    Drag to position • Scroll to zoom
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No image selected</p>
                </div>
              )}
            </div>
            
            {/* Crop controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Zoom: {Math.round(cropSettings.scale * 100)}%</span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSettings(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.1) }))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSettings(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCropSettings({ x: 0.5, y: 0.5, scale: 1 })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Position
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCropModal(false)}>
              Save Cover Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Edit Modal */}
      <Dialog open={!!editingTravelPlan} onOpenChange={() => {
        // Close travel plan editing and any profile editing to avoid conflicts
        setEditingTravelPlan(null);
        setEditingInterests(false);
        setEditingActivities(false);
        setEditingEvents(false);
      }}>
        <DialogContent className="w-[calc(100vw-16px)] max-w-[calc(100vw-16px)] md:max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto no-scrollbar mx-2 md:mx-auto p-4 md:p-6 safe-area-inset-bottom">
          <DialogHeader>
            <DialogTitle>Edit Travel Plan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              console.log('Travel plan update:', data);
              setEditingTravelPlan(null);
            })} className="space-y-4">

              {/* Travel Destination - Use SmartLocationInput for consistency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Travel Destination *</Label>
                <SmartLocationInput
                  city={form.watch("destinationCity") || ""}
                  state={form.watch("destinationState") || ""}
                  country={form.watch("destinationCountry") || ""}
                  onLocationChange={(location) => {
                    form.setValue("destinationCity", location.city);
                    form.setValue("destinationState", location.state);
                    form.setValue("destinationCountry", location.country);
                    form.setValue("destination", `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`);
                    setSelectedCountry(location.country);
                    setSelectedCity(location.city);
                    setSelectedState(location.state);
                  }}
                  required={true}
                  placeholder={{
                    country: "Select country",
                    state: "Select state/region",
                    city: "Select city"
                  }}
                />
              </div>


              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max="9999-12-31" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max="9999-12-31" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Connection Preferences Validation Message */}
              <div className="text-center mb-4">
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-2 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                  <strong>Connection Preferences for This Trip</strong> - Choose interests, activities, and events to find the right travel matches
                </div>
                <div className="text-sm text-orange-600 bg-orange-50 border border-orange-400 rounded-md p-3 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-300">
                  <strong>Minimum: To better match others on this site, choose at least 10 from the following next 4 lists (top choices, interests, activities, events)</strong>
                </div>
              </div>

              {/* Travel Plan Specific Interests Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-orange-600">🌍 Travel Plan Specific Interests</span>
                </Label>
                <div className="text-xs text-gray-600 mb-3 p-2 bg-orange-50 rounded border">
                  <strong>Note:</strong> These are interests specific to this travel plan only, separate from your main profile interests.
                </div>
                
                {/* I am a Veteran checkbox */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="isVeteran"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="profile-veteran-checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="profile-veteran-checkbox" className="text-sm font-bold cursor-pointer">I am a Veteran</Label>
                      </div>
                    )}
                  />
                </div>

                {/* I am active duty checkbox */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="profile-active-duty-checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="profile-active-duty-checkbox" className="text-sm font-bold cursor-pointer">I am active duty</Label>
                      </div>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {[...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].map((interest, index) => (
                    <div key={`interest-edit-${index}`} className="flex items-center space-x-1">
                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <Checkbox
                            id={`interest-edit-${interest}`}
                            checked={field.value?.includes(interest) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), interest]);
                              } else {
                                field.onChange(field.value?.filter(i => i !== interest));
                              }
                            }}
                          />
                        )}
                      />
                      <Label 
                        htmlFor={`interest-edit-${interest}`} 
                        className="text-xs cursor-pointer leading-tight font-medium"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Custom Interests Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Interests (comma-separated)
                  </Label>
                  <FormField
                    control={form.control}
                    name="customInterests"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Photography, Rock Climbing, Local Cuisine"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = field.value?.trim();
                            if (value) {
                              // Process custom interests by adding them to the interests array
                              const customItems = value.split(',').map(item => item.trim()).filter(item => item);
                              const currentInterests = form.getValues('interests') || [];
                              const newInterests = [...currentInterests];
                              customItems.forEach(item => {
                                if (!newInterests.includes(item)) {
                                  newInterests.push(item);
                                }
                              });
                              form.setValue('interests', newInterests);
                              field.onChange(''); // Clear the input
                            }
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Activities Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Activities on This Trip
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50">
                  {safeGetAllActivities().map((activity, index) => {
                    const displayText = activity.startsWith("**") && activity.endsWith("**") ? 
                      activity.slice(2, -2) : activity;
                    return (
                      <div key={`activity-edit-${index}`} className="flex items-center space-x-1">
                        <FormField
                          control={form.control}
                          name="activities"
                          render={({ field }) => (
                            <Checkbox
                              id={`activity-edit-${activity}`}
                              checked={field.value?.includes(activity) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), activity]);
                                } else {
                                  field.onChange(field.value?.filter(a => a !== activity));
                                }
                              }}
                            />
                          )}
                        />
                        <Label 
                          htmlFor={`activity-edit-${activity}`} 
                          className="text-xs cursor-pointer leading-tight font-medium"
                        >
                          {displayText}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                
                {/* Custom Activities Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Activities (comma-separated)
                  </Label>
                  <FormField
                    control={form.control}
                    name="customActivities"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Surfing Lessons, Wine Tasting, Museum Tours"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = field.value?.trim();
                            if (value) {
                              // Process custom activities by adding them to the activities array
                              const customItems = value.split(',').map(item => item.trim()).filter(item => item);
                              const currentActivities = form.getValues('activities') || [];
                              const newActivities = [...currentActivities];
                              customItems.forEach(item => {
                                if (!newActivities.includes(item)) {
                                  newActivities.push(item);
                                }
                              });
                              form.setValue('activities', newActivities);
                              field.onChange(''); // Clear the input
                            }
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Events Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Events on This Trip
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {safeGetAllEvents().map((event, index) => (
                    <div key={`event-edit-${index}`} className="flex items-center space-x-1">
                      <FormField
                        control={form.control}
                        name="events"
                        render={({ field }) => (
                          <Checkbox
                            id={`event-edit-${event}`}
                            checked={field.value?.includes(event) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), event]);
                              } else {
                                field.onChange(field.value?.filter(e => e !== event));
                              }
                            }}
                          />
                        )}
                      />
                      <Label 
                        htmlFor={`event-edit-${event}`} 
                        className="text-xs cursor-pointer leading-tight font-medium"
                      >
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Custom Events Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Events (comma-separated)
                  </Label>
                  <FormField
                    control={form.control}
                    name="customEvents"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Jazz Festival, Food Market, Art Exhibition"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = field.value?.trim();
                            if (value) {
                              // Process custom events by adding them to the events array
                              const customItems = value.split(',').map(item => item.trim()).filter(item => item);
                              const currentEvents = form.getValues('events') || [];
                              const newEvents = [...currentEvents];
                              customItems.forEach(item => {
                                if (!newEvents.includes(item)) {
                                  newEvents.push(item);
                                }
                              });
                              form.setValue('events', newEvents);
                              field.onChange(''); // Clear the input
                            }
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Accommodation */}
              <div>
                <Label htmlFor="accommodation">
                  Accommodation on This Trip
                </Label>
                <FormField
                  control={form.control}
                  name="accommodation"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel-booked">Hotel Booked</SelectItem>
                        <SelectItem value="hostel-booked">Hostel Booked</SelectItem>
                        <SelectItem value="airbnb-booked">Airbnb Booked</SelectItem>
                        <SelectItem value="hotel">Looking for Hotel</SelectItem>
                        <SelectItem value="hostel">Looking for Hostel</SelectItem>
                        <SelectItem value="airbnb">Looking for Airbnb</SelectItem>
                        <SelectItem value="couch">Looking for Couch</SelectItem>
                        <SelectItem value="friends-family">Stay with Friends/Family</SelectItem>
                        <SelectItem value="camping">Camping</SelectItem>
                        <SelectItem value="undecided">Undecided</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Additional Activities and Events */}
              <div>
                <Label htmlFor="notes">
                  Additional Activities and Events<br />
                  (Concerts, Seminars, Must Do Activities)
                </Label>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <textarea
                      id="notes"
                      className="w-full p-2 border rounded-md resize-none"
                      rows={3}
                      placeholder="List specific activities, concerts, seminars, or must-do experiences..."
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingTravelPlan(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editTravelPlan.isPending}
                  className="flex-1"
                >
                  {editTravelPlan.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* LOCATION EDITOR - COLLAPSIBLE WIDGET */}
      {isOwnProfile && showLocationWidget && (
        <Card className="max-w-4xl mx-auto mt-6 mb-6" data-testid="location-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.userType === 'business' ? 'Business Location' : 'Hometown Location ** ONLY CHANGE IF YOU MOVE **'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationWidget(false)}
                className="text-gray-500 hover:text-gray-700 border-gray-300"
                data-testid="button-close-location"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <SmartLocationInput
              city={pendingLocationData?.hometownCity || user?.hometownCity || ''}
              state={pendingLocationData?.hometownState || user?.hometownState || ''}
              country={pendingLocationData?.hometownCountry || user?.hometownCountry || ''}
              onLocationChange={(location) => {
                // Store the pending location change instead of auto-saving
                setPendingLocationData({
                  hometownCountry: location.country,
                  hometownState: location.state,
                  hometownCity: location.city,
                });
              }}
              required={false}
              placeholder={{
                country: user?.userType === 'business' ? "Select your business country" : "Select your hometown country",
                state: user?.userType === 'business' ? "Select your business state/region" : "Select your hometown state/region", 
                city: user?.userType === 'business' ? "Select your business city" : "Select your hometown city"
              }}
            />
            
            {/* Save Button for Location Changes */}
            {pendingLocationData && (
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={async () => {
                    if (!user?.id || !pendingLocationData) return;
                    
                    try {
                      const response = await fetch(`/api/users/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(pendingLocationData)
                      });
                      if (!response.ok) throw new Error('Failed to save');
                      
                      // Update the cache and clear pending data - ALSO invalidate user listings
                      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                      queryClient.invalidateQueries({ queryKey: [`/api/users`] });
                      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
                      setPendingLocationData(null);
                      
                      toast({
                        title: "Location Updated",
                        description: "Your location has been successfully updated. This will update your local status across the site.",
                      });
                    } catch (error) {
                      console.error('Failed to update location:', error);
                      toast({
                        title: "Error",
                        description: "Failed to update location. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Save Location
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPendingLocationData(null)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel Changes
                </Button>
              </div>
            )}
            
            {user?.userType === 'business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input 
                  placeholder="Street Address (Optional)"
                  defaultValue={user?.streetAddress || ''}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    try {
                      const response = await fetch(`/api/users/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ streetAddress: value })
                      });
                      if (!response.ok) throw new Error('Failed to save');
                      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                    } catch (error) {
                      console.error('Failed to update street address:', error);
                    }
                  }}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <Input 
                  placeholder="ZIP Code (Optional)"
                  defaultValue={user?.zipCode || ''}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    try {
                      const response = await fetch(`/api/users/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ zipCode: value })
                      });
                      if (!response.ok) throw new Error('Failed to save');
                      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                    } catch (error) {
                      console.error('Failed to update ZIP code:', error);
                    }
                  }}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Edit Modal */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-[95vw] w-full md:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Profile</DialogTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  console.log('🔥 SAVE BUTTON CLICKED - Header');
                  console.log('🔥 Form errors:', profileForm.formState.errors);
                  console.log('🔥 Form values:', profileForm.getValues());
                  console.log('🔥 Form valid:', profileForm.formState.isValid);
                  profileForm.handleSubmit(onSubmitProfile, (errors) => {
                    console.log('🔥 VALIDATION ERRORS:', errors);
                  })();
                }}
                disabled={editProfile.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogHeader>
          
          {/* REMOVED: Moving section moved to bottom of form */}
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
              
              {/* ALWAYS VISIBLE PERSONAL INFORMATION SECTION */}
              <div className="space-y-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Veteran Status Field */}
                  <FormField
                    control={profileForm.control}
                    name="isVeteran"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4 border-blue-300 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-blue-900 dark:text-blue-100">
                            Military Veteran
                          </FormLabel>
                          <FormDescription className="text-xs text-blue-700 dark:text-blue-300">
                            Check if you are a military veteran
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active Duty Field */}
                  <FormField
                    control={profileForm.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4 border-blue-300 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-blue-900 dark:text-blue-100">
                            Active Duty Military
                          </FormLabel>
                          <FormDescription className="text-xs text-blue-700 dark:text-blue-300">
                            Check if you are currently active duty military
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Business Profile Fields */}
              {user?.userType === 'business' ? (
                <div className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your business name..."
                            maxLength={100}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {field.value?.length || 0}/100 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={profileForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="dark:text-white dark:hover:bg-gray-700">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(555) 123-4567"
                            type="tel"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="www.yourwebsite.com"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />




                  {/* Business Description Field */}
                  <FormField
                    control={profileForm.control}
                    name="businessDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe your business and services..."
                            className="min-h-[100px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            maxLength={1000}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {field.value?.length || 0}/1000 characters {(field.value?.length || 0) < 30 && '(minimum 30 required)'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                /* Traveler Profile Fields */
                <div className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell us about yourself..."
                            className="min-h-[100px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            maxLength={1000}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {field.value?.length || 0}/1000 characters {(field.value?.length || 0) < 30 && '(minimum 30 required)'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="secretActivities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>If I could list a few Secret Local things in my hometown I would say they are...</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Fill this out for others to see secret activities, hidden gems, local spots, or insider tips that only locals know about. Example: There's a hidden waterfall behind the old mill that locals love, or try the secret menu at Joe's Diner..."
                            className="min-h-[80px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            maxLength={500}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {field.value?.length || 0}/500 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  {/* Family Travel Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                      Family Travel and/or Willing to Meet Families
                    </h3>
                    
                    <FormField
                      control={profileForm.control}
                      name="travelingWithChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have children?</FormLabel>
                          <FormControl>
                            <div className="space-y-2 border rounded-md p-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="have-children"
                                  checked={!!field.value}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    field.onChange(checked);
                                    // Don't clear children ages - keep them for matching purposes
                                  }}
                                  className="h-4 w-4 border-gray-300 rounded text-purple-600 focus:ring-purple-500"
                                  data-testid="checkbox-have-children"
                                />
                                <label 
                                  htmlFor="have-children" 
                                  className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                                >
                                  Yes, I have children
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Children Ages Input - Only show when have children is checked */}
                    <FormField
                      control={profileForm.control}
                      name="childrenAges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Children's Ages (if applicable)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., 8, 12, 16 or 'None'"
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              maxLength={100}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-700 dark:text-gray-300">
                            List ages separated by commas, or write "None" if no children
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>
              )}


              {/* Travel Style removed from general profile - it's trip-specific */}

              {/* Date of Birth and Age Visibility - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    {FORM_HEADERS.DATE_OF_BIRTH}
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            placeholder="Your date of birth" 
                            {...field}
                            min={getDateInputConstraints().min}
                            max={getDateInputConstraints().max}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            className="dark:bg-gray-800 dark:border-gray-600 dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="ageVisible"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                        <div className="space-y-0.5">
                          <FormLabel>Show Age</FormLabel>
                          <div className="text-sm text-gray-500">
                            Display your age on your profile
                          </div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {PRIVACY_NOTES.DATE_OF_BIRTH}
                          </div>
                        </div>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(!field.value)}
                            className="flex items-center gap-2"
                          >
                            {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {field.value ? "Visible" : "Hidden"}
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              )}

              {/* Gender and Sexual Preference Fields - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    {FORM_HEADERS.GENDER_SEXUAL_PREFERENCE}
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <div className="flex flex-wrap gap-3">
                          {GENDER_OPTIONS.map((gender) => (
                            <div key={gender} className="flex items-center space-x-2">
                              <Checkbox
                                id={`gender-${gender}`}
                                checked={field.value === gender}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? gender : "");
                                }}
                              />
                              <label
                                htmlFor={`gender-${gender}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {gender}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="sexualPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexual Preference (Select all that apply)</FormLabel>
                        <FormControl>
                          <div className="space-y-2 border rounded-md p-3">
                            {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                              <div key={preference} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`preference-${preference}`}
                                  checked={field.value?.includes(preference) || false}
                                  onChange={(e) => {
                                    const currentValue = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValue, preference]);
                                    } else {
                                      field.onChange(currentValue.filter((p: string) => p !== preference));
                                    }
                                  }}
                                  className="h-4 w-4 border-gray-300 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <label 
                                  htmlFor={`preference-${preference}`} 
                                  className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                                >
                                  {preference}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              )}

              {/* Sexual Preference Visibility - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <FormField
                  control={profileForm.control}
                  name="sexualPreferenceVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="space-y-0.5">
                        <FormLabel>Show Sexual Preference</FormLabel>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Display your sexual preference on your profile
                        </div>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {PRIVACY_NOTES.SEXUAL_PREFERENCE}
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className="flex items-center gap-2"
                        >
                          {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {field.value ? "Visible" : "Hidden"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}





            {/* Diversity Business Ownership - Only show for business users */}
            {user?.userType === 'business' && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Diversity Business Ownership</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    These categories can be hidden from public view but will still appear in keyword searches to help customers find diverse businesses.
                  </div>
                
                {/* Minority Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isMinorityOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">Minority Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is minority-owned
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-purple-600 rounded"
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showMinorityOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={publicField.value}
                                  onChange={(e) => publicField.onChange(e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                {/* Female Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isFemaleOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">Female Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is female-owned
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-pink-600 rounded"
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showFemaleOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={publicField.value}
                                  onChange={(e) => publicField.onChange(e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                {/* LGBTQIA+ Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isLGBTQIAOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">LGBTQIA+ Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is LGBTQIA+ owned
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-purple-600 rounded"
                            style={{ accentColor: '#8B5CF6' }}
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showLGBTQIAOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={publicField.value}
                                  onChange={(e) => publicField.onChange(e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Privacy & Search Information:</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Even if unchecked for public display, these categories remain searchable</li>
                    <li>• Customers can find your business using keywords like "minority owned", "female owned", etc.</li>
                  </ul>
                </div>
              </div>
            </div>
            )}

              {/* Location Section - REMOVED FROM DIALOG - NOW SEPARATE */}

              {/* Moving/Hometown Change CTA - Moved to bottom as requested */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      📍 Are you moving or want to change your hometown location?
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                      Update where you're a local to connect with the right community
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      // Close the edit profile modal
                      setIsEditMode(false);
                      
                      // Open the location widget (which was hidden)
                      setShowLocationWidget(true);
                      
                      // Scroll to the location widget after it opens and renders
                      setTimeout(() => {
                        const locationWidget = document.querySelector('[data-testid="location-widget"]');
                        if (locationWidget) {
                          locationWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 300); // Longer delay to ensure widget is rendered
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white ml-3 flex-shrink-0"
                    data-testid="button-change-hometown"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Change Location
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditMode(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editProfile.isPending}
                  className="flex-1"
                  onClick={() => {
                    console.log('🔥 SAVE BUTTON CLICKED');
                    console.log('🔥 Form errors:', profileForm.formState.errors);
                    console.log('🔥 Form values:', profileForm.getValues());
                    console.log('🔥 Form valid:', profileForm.formState.isValid);
                  }}
                >
                  {editProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Delete Confirmation Dialog */}
      <Dialog open={!!deletingTravelPlan} onOpenChange={() => setDeletingTravelPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Travel Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your trip to {deletingTravelPlan?.destination}? This action cannot be undone and will remove the plan from everywhere on the site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTravelPlan(null)} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTravelPlan}
              disabled={deleteTravelPlan.isPending}
            >
              {deleteTravelPlan.isPending ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Details Modal - FIXED WITH PROPER BACK NAVIGATION */}
      <Dialog open={showTravelPlanDetails} onOpenChange={setShowTravelPlanDetails}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <MapPin className="w-5 h-5" />
              {selectedTravelPlan?.destination} Trip Details
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowTravelPlanDetails(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          
          {selectedTravelPlan && (
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white">{selectedTravelPlan.destination}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedTravelPlan.startDate ? formatDateForDisplay(selectedTravelPlan.startDate, user?.currentCity || 'UTC') : 'Start date TBD'} - {selectedTravelPlan.endDate ? formatDateForDisplay(selectedTravelPlan.endDate, user?.currentCity || 'UTC') : 'End date TBD'}
                  </p>
                </div>
                <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                  Trip Details
                </div>
              </div>
              
              {/* Close Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowTravelPlanDetails(false)}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                >
                  Close
                </Button>
              </div>

              {/* Interests - LIMITED TO PREVENT OVERWHELMING */}
              {selectedTravelPlan.interests && selectedTravelPlan.interests.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Star className="w-4 h-4" />
                    Top Interests ({selectedTravelPlan.interests.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.interests.slice(0, 9).map((interest) => (
                      <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {interest}
                      </div>
                    ))}
                    {selectedTravelPlan.interests.length > 9 && (
                      <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        +{selectedTravelPlan.interests.length - 9} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activities */}
              {selectedTravelPlan.activities && selectedTravelPlan.activities.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-white" />
                    Activities
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.activities.map((activity) => (
                      <div key={activity} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {selectedTravelPlan.events && selectedTravelPlan.events.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4 text-white" />
                    Events
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.events.map((event) => (
                      <div key={event} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travel Style */}
              {selectedTravelPlan.travelStyle && selectedTravelPlan.travelStyle.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Globe className="w-4 h-4 text-white" />
                    Travel Style
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.travelStyle.map((style) => (
                      <div key={style} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {style}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No details message */}
              {(!selectedTravelPlan.interests || selectedTravelPlan.interests.length === 0) &&
               (!selectedTravelPlan.activities || selectedTravelPlan.activities.length === 0) &&
               (!selectedTravelPlan.events || selectedTravelPlan.events.length === 0) &&
               (!selectedTravelPlan.travelStyle || selectedTravelPlan.travelStyle.length === 0) && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-white">No trip details added yet</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Simplified Cover Photo Selector Dialog */}
      {showCoverPhotoSelector && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Cover Photo</h2>
              <button
                onClick={() => setShowCoverPhotoSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative"
                      onClick={async () => {
                        try {
                          setUploadingPhoto(true);
                          
                          const response = await fetch(`/api/users/${effectiveUserId}/cover-photo`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageData: photo.imageUrl }),
                          });
                          
                          if (!response.ok) throw new Error('Upload failed');
                          
                          const responseData = await response.json();
                          const updatedUser = responseData?.user || responseData;
                          
                          if (updatedUser && isOwnProfile) {
                            setCoverPhotoKey(Date.now());
                            authStorage.setUser(updatedUser);
                            if (typeof setAuthUser === 'function') {
                              setAuthUser(updatedUser);
                            }
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                          }
                          
                          setShowCoverPhotoSelector(false);
                          setUploadingPhoto(false);
                          
                          toast({
                            title: "Success!",
                            description: "Cover photo updated successfully",
                          });
                          
                        } catch (error) {
                          console.error('Error setting cover photo:', error);
                          setUploadingPhoto(false);
                          toast({
                            title: "Error",
                            description: "Failed to update cover photo",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || `Travel photo ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No travel photos available yet</p>
                  <Button
                    onClick={() => {
                      setShowCoverPhotoSelector(false);
                      setLocation('/photos');
                    }}
                    className="mt-4"
                  >
                    Upload Photos First
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCoverPhotoSelector(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Write Reference Modal */}
      <Dialog open={showWriteReferenceModal} onOpenChange={setShowWriteReferenceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Reference for {user?.username}</DialogTitle>
            <DialogDescription>
              Share your experience with this traveler to help others in the community
            </DialogDescription>
          </DialogHeader>
          
          <Form {...referenceForm}>
            <form onSubmit={referenceForm.handleSubmit((data) => createReference.mutate(data))} className="space-y-4">
              <FormField
                control={referenceForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Reference</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your experience with this person..."
                        className="min-h-[100px] text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={referenceForm.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="positive"
                            checked={String(field.value) === "positive"}
                            onChange={() => field.onChange("positive")}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">Positive</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="neutral"
                            checked={String(field.value) === "neutral"}
                            onChange={() => field.onChange("neutral")}
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-yellow-700">Neutral</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="negative"
                            checked={String(field.value) === "negative"}
                            onChange={() => field.onChange("negative")}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700">Negative</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    referenceForm.reset();
                    setShowWriteReferenceModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReference.isPending}>
                  {createReference.isPending ? "Submitting..." : "Submit Reference"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Reference Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reference</DialogTitle>
            <DialogDescription>
              Update your reference for this traveler
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editReferenceForm}>
            <form onSubmit={editReferenceForm.handleSubmit((data) => {
              if (editingReference) {
                updateReference.mutate({
                  referenceId: editingReference.id,
                  content: data.content,
                  experience: data.experience,
                });
              }
            })} className="space-y-4">
              <FormField
                control={editReferenceForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Reference</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your experience with this person..."
                        className="min-h-[100px] text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editReferenceForm.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="positive"
                            checked={String(field.value) === "positive"}
                            onChange={() => field.onChange("positive")}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">Positive</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="neutral"
                            checked={String(field.value) === "neutral"}
                            onChange={() => field.onChange("neutral")}
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-yellow-700">Neutral</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="negative"
                            checked={String(field.value) === "negative"}
                            onChange={() => field.onChange("negative")}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700">Negative</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    editReferenceForm.reset();
                    setShowEditModal(false);
                    setEditingReference(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateReference.isPending}>
                  {updateReference.isPending ? "Updating..." : "Update Reference"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Customer Uploaded Photos - Only for business profiles - Moved to bottom */}
      {user?.userType === 'business' && (
        <CustomerUploadedPhotos businessId={user.id} isOwnProfile={isOwnProfile} />
      )}

      {/* Photo Upload Modal - ORIGINAL SYSTEM RESTORED */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
            <DialogDescription>
              Add a new photo to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="hidden"
                id="photo-upload-input"
              />
              <label htmlFor="photo-upload-input" className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">Choose a photo</p>
                <p className="text-sm text-gray-500">
                  Click to select an image file (max 5MB)
                </p>
              </label>
            </div>
            
            {uploadingPhoto && (
              <div className="text-center">
                <p className="text-blue-600">Uploading photo...</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPhotoUpload(false)}
              disabled={uploadingPhoto}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatroom List Modal */}
      <Dialog open={showChatroomList} onOpenChange={setShowChatroomList}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Your City Chatrooms ({userChatrooms.length})
            </DialogTitle>
            <DialogDescription>
              Chatrooms you've joined for your hometown and travel destinations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {userChatrooms.length > 0 ? (
              userChatrooms.map((chatroom: any) => (
                <div 
                  key={chatroom.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => {
                    setShowChatroomList(false);
                    setLocation(`/simple-chatroom/${chatroom.id}`);
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {chatroom.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                      {chatroom.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {chatroom.city}, {chatroom.country}
                    </p>
                    {chatroom.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                        {chatroom.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 rounded-full px-2 py-1">
                        {chatroom.memberCount || 0} members
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No chatrooms yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You'll automatically join chatrooms for your hometown and travel destinations
                </p>
                <Button 
                  onClick={() => {
                    setShowChatroomList(false);
                    setLocation('/city-chatrooms');
                  }}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  Browse All Chatrooms
                </Button>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowChatroomList(false);
                setLocation('/city-chatrooms');
              }}
              className="w-full"
            >
              Browse All City Chatrooms
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

// Error boundary wrapper component
class ProfileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ProfileErrorBoundary - Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile page error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = {
        message: this.state.error?.message || 'Unknown error',
        stack: this.state.error?.stack || 'No stack trace',
        componentStack: this.state.errorInfo?.componentStack || 'No component stack'
      };

      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Profile Page Error</h2>
              <p className="text-gray-600 mb-6">The profile page encountered a rendering error.</p>
              
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <p className="text-sm text-red-700 mb-2">Message: {errorDetails.message}</p>
                
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">Show Stack Trace</summary>
                  <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                    {errorDetails.stack}
                  </pre>
                </details>
                
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">Show Component Stack</summary>
                  <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                    {errorDetails.componentStack}
                  </pre>
                </details>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.location.reload();
                  }}
                  variant="outline"
                >
                  Reload Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Event Organizer Hub Section Component
function EventOrganizerHubSection({ userId }: { userId: number }) {
  const { toast } = useToast();
  
  // Fetch user events
  const { data: userEvents = [], isLoading } = useQuery({
    queryKey: [`/api/events/organizer/${userId}`],
    enabled: !!userId,
  });

  // Calculate event statistics
  const totalEvents = userEvents.length;
  const totalRSVPs = userEvents.reduce((sum: number, event: any) => sum + (event.participantCount || 0), 0);
  const upcomingEvents = userEvents.filter((event: any) => new Date(event.date) >= new Date()).length;
  const avgRSVPs = totalEvents > 0 ? Math.round((totalRSVPs / totalEvents) * 10) / 10 : 0;

  // Generate Instagram post for an event
  const generateInstagramPost = (event: any) => {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const instagramText = `🎉 ${event.title}\n\n📅 ${eventDate}\n📍 ${event.venue || 'Location TBD'}\n\n${event.description}\n\n#${event.city?.replace(/\s+/g, '')}Events #Community #${event.category?.replace(/\s+/g, '')} #Meetup\n\nRSVP: ${window.location.origin}/events/${event.id}`;
    
    navigator.clipboard.writeText(instagramText);
    toast({
      title: "Instagram post copied!",
      description: "The Instagram-optimized post has been copied to your clipboard.",
    });
  };

  // Duplicate event function
  const duplicateEvent = (event: any) => {
    const duplicateData = {
      title: `${event.title} (Copy)`,
      description: event.description,
      venue: event.venue,
      streetAddress: event.streetAddress,
      city: event.city,
      state: event.state,
      country: event.country,
      category: event.category,
      tags: event.tags,
      requirements: event.requirements,
    };
    
    // Store in localStorage for the create event page
    localStorage.setItem('duplicateEventData', JSON.stringify(duplicateData));
    
    // Navigate to create event page
    window.location.href = '/create-event';
    
    toast({
      title: "Event template ready",
      description: "Event details have been copied. Complete the new event details.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading your events...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Event Organizer Hub Header */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 p-4 sm:p-6 border-b border-blue-200 dark:border-blue-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Event Organizer Hub
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Create, manage, and promote your events with powerful organizer tools
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => window.location.href = '/create-event'}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Event
              </Button>
            </div>
          </div>
          
          {/* Event Organizer Quick Stats */}
          {totalEvents > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {totalEvents}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {totalRSVPs}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total RSVPs</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-orange-600">
                  {upcomingEvents}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-600">
                  {avgRSVPs}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Avg RSVPs</div>
              </div>
            </div>
          )}
        </div>

        {/* Events List */}
        <div className="p-4 sm:p-6">
          {userEvents.length > 0 ? (
            <div className="space-y-4">
              {userEvents.map((event: any) => (
                <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue || event.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.participantCount || 0} RSVPs
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateInstagramPost(event)}
                        className="text-xs h-8 px-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
                        title="Copy Instagram post"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Instagram
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateEvent(event)}
                        className="text-xs h-8 px-3 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
                        title="Duplicate this event"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/manage-event/${event.id}`}
                        className="text-xs h-8 px-3"
                        title="Manage event"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start organizing events to connect with your community
              </p>
              <Button 
                onClick={() => window.location.href = '/create-event'}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main export with error boundary
export default function EnhancedProfile(props: EnhancedProfileProps) {
  return (
    <ProfileErrorBoundary>
      <ProfileContent {...props} />
    </ProfileErrorBoundary>
  );
}