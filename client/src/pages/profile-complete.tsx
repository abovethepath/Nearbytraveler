import React, { useState, useMemo, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
// Removed goBackProperly import
import { apiRequest, queryClient, invalidateUserCache, getApiBaseUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Camera, Globe, Users, Calendar, Star, Settings, ArrowLeft, Upload, Edit, Edit2, Heart, MessageSquare, X, Plus, Eye, EyeOff, MessageCircle, ImageIcon, Minus, RotateCcw, Sparkles, Package, Trash2, Home, FileText, TrendingUp, MessageCircleMore, Share2, ChevronDown, Search, Zap, History, Clock, Wifi, Shield, ChevronRight, AlertCircle, Phone, Plane, User as UserIcon, Mail, ThumbsUp, Building2, Award, Bell } from "lucide-react";
import { SkeletonProfile } from "@/components/ui/skeleton-loaders";

type TabKey = 'contacts' | 'photos' | 'references' | 'travel' | 'countries' | 'vouches' | 'chatrooms' | 'menu' | 'about';
import { compressPhotoAdaptive } from "@/utils/photoCompression";
import { AdaptiveCompressionIndicator } from "@/components/adaptive-compression-indicator";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import FriendReferralWidget from "@/components/friend-referral-widget";
import { EventShareModal } from "@/components/EventShareModal";

import ReferencesWidgetNew from "@/components/references-widget-new";
import { VouchWidget } from "@/components/vouch-widget";
import TravelPlansWidget from "@/components/TravelPlansWidget";
// Removed framer-motion import for static interface
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import ConnectButton from "@/components/ConnectButton";
import { VouchButton } from "@/components/VouchButton";

import { formatDateForDisplay, getCurrentTravelDestination, formatLocationCompact } from "@/lib/dateUtils";
import { isNativeIOSApp } from "@/lib/nativeApp";
import { prefetchedNav } from "@/lib/navigation";
import { openPrivateChatWithUser } from "@/lib/iosPrivateChat";
import { NativeAppProfileMenu } from "@/components/NativeAppProfileMenu";
import { METRO_AREAS } from "@shared/constants";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { US_STATE_NAMES, CANADIAN_PROVINCES as SHARED_CA_PROVINCES, AUSTRALIAN_STATES as SHARED_AU_STATES } from "../../../shared/locationData";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { calculateAge, formatDateOfBirthForInput, validateDateInput, getDateInputConstraints } from "@/lib/ageUtils";
import { isTopChoiceInterest } from "@/lib/topChoicesUtils";
import { VideoIntroPlayer } from "@/components/VideoIntro";
import { BUSINESS_TYPES, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, ALL_ACTIVITIES, ALL_INTERESTS, BUSINESS_INTERESTS, BUSINESS_ACTIVITIES } from "@shared/base-options";
import { computeCommonStats } from "@/lib/whatYouHaveInCommonStats";

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

  const totalThingsInCommon = sharedInterests.length + sharedActivities.length;

  if (totalThingsInCommon === 0) {
    return null; // Don't show if no common things
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm w-full overflow-hidden">
      <CardContent className="p-4">
        <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 border-l-4 border-green-200 dark:border-green-600 rounded-r-lg">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            Things We Have in Common ({totalThingsInCommon})
          </h5>
          
          <div className="space-y-3">
            {sharedInterests.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Shared Interests ({sharedInterests.length})</h6>
                <div className="flex flex-wrap gap-1">
                  {sharedInterests.map((interest: string, index: number) => (
                    <div key={index} className="pill-interests bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-600">
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedActivities.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Shared Activities ({sharedActivities.length})</h6>
                <div className="flex flex-wrap gap-1">
                  {sharedActivities.map((activity: string, index: number) => (
                    <div key={index} className="pill-interests bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-600">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-600">
            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
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

// State/Province arrays — imported from shared/locationData.ts (single source of truth)
const US_STATES = US_STATE_NAMES;
const CANADIAN_PROVINCES = SHARED_CA_PROVINCES;
const AUSTRALIAN_STATES = SHARED_AU_STATES;

import WorldMap from "@/components/world-map";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";
import TravelItinerary from "@/components/travel-itinerary";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";



import { PhotoAlbumWidget } from "@/components/photo-album-widget";
// MobileTopNav and MobileBottomNav removed - now handled globally in App.tsx
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
import { ReportUserButton } from "@/components/report-user-button";
import { StealthToggle } from "@/components/stealth-toggle";
import { StealthToggleInline } from "@/components/stealth-toggle-inline";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ReferralTrackingWidget } from "@/components/ReferralTrackingWidget";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileDialogs } from "@/components/profile/ProfileDialogs";
import type { ProfilePageProps } from "@/components/profile/profile-complete-types";



import type { User, UserPhoto, TravelPlan } from "@shared/schema";
import { insertUserReferenceSchema } from "@shared/schema";
import { getAllInterests, getAllActivities, getAllLanguages, validateSelections, getHometownInterests, getTravelInterests, getProfileInterests, migrateLegacyOptions } from "../../../shared/base-options";
import { getTopChoicesInterests } from "../lib/topChoicesUtils";

// Extended user type: User plus optional props (intersection avoids extend conflicts with schema)
type ExtendedUser = User & {
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
  customInterests?: string | null;
  customActivities?: string;
};

// Safe wrappers to prevent undefined errors
const safeGetAllActivities = () => {
  try {
    const activities = getAllActivities();
    return Array.isArray(activities) ? activities : [];
  } catch (error) {
    console.error('Error in safeGetAllActivities:', error);
    return [];
  }
};

const safeGetAllInterests = () => {
  try {
    const interests = getAllInterests();
    return Array.isArray(interests) ? interests : [];
  } catch (error) {
    console.error('Error in safeGetAllInterests:', error);
    return [];
  }
};

// Add missing constants - using profile interests for expanded profile editing
const INTERESTS_OPTIONS = getProfileInterests();
const ACTIVITIES_OPTIONS = safeGetAllActivities();

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
    firstName: z.string().optional(),
    bio: z.string().optional(),
    hometownCity: z.string().optional(),
    hometownState: z.string().optional(), 
    hometownCountry: z.string().optional(),
    travelStyle: z.array(z.string()).default([]),
    privateInterests: z.array(z.string()).default([]),
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
      customInterests: z.string().optional(),
      customActivities: z.string().optional(),
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






const COUNTRIES_OPTIONS = COUNTRIES;

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
                  <div key={item} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-600 appearance-none select-none">
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
  const popularInterests = [...getHometownInterests(), ...getTravelInterests()];
  
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

function nudgeDismiss(userId: number, section: 'bio' | 'interests' | 'thingsToDo') {
  try {
    const key = `nt_nudges_${userId}`;
    const raw = localStorage.getItem(key);
    const s = raw ? JSON.parse(raw) : { logins: 0 };
    s[section] = true;
    localStorage.setItem(key, JSON.stringify(s));
  } catch {}
}
function nudgeIncrementLogin(userId: number) {
  try {
    const key = `nt_nudges_${userId}`;
    const sessionKey = 'nt_nudge_session';
    const currentSession = sessionStorage.getItem(sessionKey);
    if (currentSession === String(userId)) return;
    sessionStorage.setItem(sessionKey, String(userId));
    const raw = localStorage.getItem(key);
    const s = raw ? JSON.parse(raw) : { logins: 0 };
    s.logins = (s.logins || 0) + 1;
    localStorage.setItem(key, JSON.stringify(s));
  } catch {}
}

function NotificationPreferencesCompact({ currentUserId }: { currentUserId?: number }) {
  const { toast } = useToast();
  const { data: prefs, isLoading } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/notifications/preferences'],
    enabled: !!currentUserId,
  });
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<Record<string, boolean> | null>(null);

  const effective = local ?? prefs ?? { messages: true, meet_requests: true, connections: true, events: true, vouches: true };

  const toggle = async (key: string) => {
    if (!currentUserId) return;
    const next = { ...effective, [key]: !effective[key] };
    setLocal(next);
    setSaving(true);
    try {
      await apiRequest('PUT', '/api/notifications/preferences', next);
    } catch {
      toast({ description: 'Failed to save notification preference.', variant: 'destructive' });
      setLocal(effective);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { key: 'messages', label: 'Messages' },
    { key: 'meet_requests', label: 'Meets' },
    { key: 'connections', label: 'Connections' },
    { key: 'events', label: 'Events' },
    { key: 'vouches', label: 'Vouches' },
  ];

  if (isLoading || !currentUserId) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs font-bold text-gray-900 dark:text-white">Notifications</span>
      </div>
      <div className="px-3 py-1.5">
        {categories.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
            <button
              onClick={() => toggle(key)}
              disabled={saving}
              className={`no-touch-target relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                effective[key] ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={effective[key]}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  effective[key] ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileContent({ userId: propUserId }: EnhancedProfileProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: authContextUser, setUser: setAuthUser } = useContext(AuthContext);
  
  // Check for chat return context (from event chatrooms, meetup chatrooms, or city chatrooms)
  // Only show "Back to Chat" if came from chat recently (within 60 seconds)
  const returnToChatData = localStorage.getItem('returnToChat');
  const shouldShowBackToChat = (() => {
    if (!returnToChatData) return false;
    try {
      const context = JSON.parse(returnToChatData);
      // If no timestamp, it's old data - clear it and don't show
      if (!context.timestamp) {
        localStorage.removeItem('returnToChat');
        return false;
      }
      // Only show if navigated from chat within the last 60 seconds
      const isRecent = Date.now() - context.timestamp < 60000;
      if (!isRecent) {
        localStorage.removeItem('returnToChat');
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem('returnToChat');
      return false;
    }
  })();
  
  const handleBackToChat = () => {
    console.log('🔙 Back to Chat clicked!');
    // Read fresh from localStorage - don't use stale captured value
    const freshReturnToChatData = localStorage.getItem('returnToChat');
    console.log('🔍 returnToChatData raw:', freshReturnToChatData);
    
    if (freshReturnToChatData) {
      try {
        const context = JSON.parse(freshReturnToChatData);
        console.log('✅ Parsed context:', JSON.stringify(context, null, 2));
        console.log('🔍 chatType:', context.chatType);
        console.log('🔍 eventId:', context.eventId);
        console.log('🔍 chatId:', context.chatId);
        
        // Navigate to the appropriate chat based on chatType
        if (context.chatType === 'event' && context.eventId) {
          const targetPath = `/event-chat/${context.eventId}`;
          console.log('🎯 EVENT CHAT - Navigating to:', targetPath);
          localStorage.removeItem('returnToChat');
          setLocation(targetPath);
        } else if (context.chatType === 'meetup' && context.chatId) {
          const targetPath = `/meetup-chat/${context.chatId}`;
          console.log('🎯 MEETUP CHAT - Navigating to:', targetPath);
          localStorage.removeItem('returnToChat');
          setLocation(targetPath);
        } else if (context.chatType === 'chatroom' && context.chatId) {
          const targetPath = `/chat/${context.chatId}`;
          console.log('🎯 CITY CHATROOM - Navigating to:', targetPath);
          localStorage.removeItem('returnToChat');
          setLocation(targetPath);
        } else {
          console.error('⚠️ Unknown chat type or missing IDs:', context);
          console.log('📍 Fallback to city-chatrooms');
          localStorage.removeItem('returnToChat');
          setLocation('/city-chatrooms');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('❌ Error parsing chat context:', error);
        localStorage.removeItem('returnToChat');
        setLocation('/city-chatrooms');
      }
    } else {
      console.log('❌ No returnToChatData found in localStorage');
      setLocation('/city-chatrooms');
    }
  };
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingTravelPlan, setEditingTravelPlan] = useState<TravelPlan | null>(null);
  const [deletingTravelPlan, setDeletingTravelPlan] = useState<TravelPlan | null>(null);
  const [selectedTravelPlan, setSelectedTravelPlan] = useState<TravelPlan | null>(null);
  const [showTravelPlanDetails, setShowTravelPlanDetails] = useState(false);
  const [expandedPlanInterests, setExpandedPlanInterests] = useState<Set<number>>(new Set());
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showChatroomList, setShowChatroomList] = useState(false);
  const initialTab = React.useMemo<TabKey>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.location.search : "";
      const tab = new URLSearchParams(raw || "").get("tab");
      const allowed = new Set<TabKey>(["about", "contacts", "photos", "references", "travel", "countries", "vouches", "chatrooms", "menu"]);
      return (tab && allowed.has(tab as TabKey) ? (tab as TabKey) : "about");
    } catch {
      return "about";
    }
  }, []);

  const [activeTab, setActiveTab] = React.useState<TabKey | ''>(initialTab);
  const [loadedTabs, setLoadedTabs] = React.useState<Set<TabKey>>(new Set([initialTab]));
  
  const tabRefs = {
    contacts: React.useRef<HTMLDivElement>(null),
    photos: React.useRef<HTMLDivElement>(null),
    references: React.useRef<HTMLDivElement>(null),
    travel: React.useRef<HTMLDivElement>(null),
    countries: React.useRef<HTMLDivElement>(null),
    vouches: React.useRef<HTMLDivElement>(null),
    chatrooms: React.useRef<HTMLDivElement>(null),
    menu: React.useRef<HTMLDivElement>(null),
    about: React.useRef<HTMLDivElement>(null),
  };

  function openTab(key: TabKey) {
    setActiveTab(key);
    setLoadedTabs(prev => new Set([...prev, key]));
    let attempts = 0;
    const tryScroll = () => {
      // Try ref first, then fallback to id-based lookup
      const el = tabRefs[key]?.current || document.getElementById(`panel-${key}`);
      if (el && el.offsetHeight > 0) {
        // Use a manual scroll offset to account for fixed headers (~60px)
        const y = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else if (attempts < 20) {
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };
    // Allow React state update + render before first scroll attempt
    setTimeout(tryScroll, 150);
  }
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  

  
  // Edit mode states for individual widgets - FIXED WITH SEPARATE BOOLEANS
  // Separate editing states for clean cancel functionality
  const [isEditingPublicInterests, setIsEditingPublicInterests] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);

  // Legacy compatibility (will be phased out)
  const editingInterests = isEditingPublicInterests;
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const editingActivities = activeEditSection === 'activities';
  const editingLanguages = activeEditSection === 'languages';
  const editingCountries = activeEditSection === 'countries';
  const editingBio = activeEditSection === 'bio';
  const editingBusinessDescription = activeEditSection === 'business';
  
  // Temporary state for editing values
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  const [tempActivities, setTempActivities] = useState<string[]>([]);
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
    subInterests: [] as string[],
    privateInterests: [] as string[]
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
  
  // Owner contact information state (Admin / private business info)
  const editingOwnerInfo = activeEditSection === 'owner';
  const [ownerContactForm, setOwnerContactForm] = useState({
    businessName: '',
    contactName: '',
    ownerEmail: '',
    ownerPhone: '',
    contactRole: ''
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
  const [triggerQuickMeetup, setTriggerQuickMeetup] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [businessesDisplayCount, setBusinessesDisplayCount] = useState(3);
  const [expandedTravelPlan, setExpandedTravelPlan] = useState<number | null>(null);
  const [showExpandedPhoto, setShowExpandedPhoto] = useState(false);
  

  
  // Travel plan details modal state (already declared above)
  
  // Cover photo state
  const [coverPhotoKey, setCoverPhotoKey] = useState(Date.now());
  
  // Header gradient color selection with persistence - moved after user declaration
  const [selectedGradient, setSelectedGradient] = useState(0);

  
  const gradientOptions = [
    "from-blue-700 via-purple-700 to-orange-700",
    "from-green-700 via-emerald-700 to-orange-700",
    "from-blue-700 via-cyan-700 to-orange-700",
    "from-pink-700 via-pink-700 to-red-700",
    "from-indigo-700 via-blue-700 to-green-700",
    "from-orange-700 via-red-700 to-pink-700",
    "from-teal-700 via-blue-700 to-purple-700",
    "from-yellow-700 via-orange-700 to-red-700",
  ];

  // CSS gradient mapping for database storage and user cards
  const gradientCSSMap = [
    'linear-gradient(135deg, #1D4ED8 0%, #7E22CE 50%, #C2410C 100%)', // Blue-Purple-Orange
    'linear-gradient(135deg, #15803D 0%, #047857 50%, #C2410C 100%)', // Green-Emerald-Orange
    'linear-gradient(135deg, #1D4ED8 0%, #0E7490 50%, #C2410C 100%)', // Blue-Cyan-Orange
    'linear-gradient(135deg, #BE185D 0%, #BE185D 50%, #B91C1C 100%)', // Pink-Pink-Red
    'linear-gradient(135deg, #4338CA 0%, #1D4ED8 50%, #15803D 100%)', // Indigo-Blue-Green
    'linear-gradient(135deg, #C2410C 0%, #B91C1C 50%, #BE185D 100%)', // Orange-Red-Pink
    'linear-gradient(135deg, #0F766E 0%, #1D4ED8 50%, #7E22CE 100%)', // Teal-Blue-Purple
    'linear-gradient(135deg, #A16207 0%, #C2410C 50%, #B91C1C 100%)', // Yellow-Orange-Red
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
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [avatarCropOffset, setAvatarCropOffset] = useState({ x: 0, y: 0 });
  const [avatarCropScale, setAvatarCropScale] = useState(1);
  const avatarCropDragging = React.useRef(false);
  const avatarCropDragStart = React.useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [customActivityInput, setCustomActivityInput] = useState("");
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
    travelStyle: z.array(z.string()).optional(),
    accommodation: z.string().optional(),
    transportation: z.string().optional(),
    notes: z.string().optional(),
    isVeteran: z.boolean().default(false),
    isActiveDuty: z.boolean().default(false),
    customInterests: z.string().optional(),
    customActivities: z.string().optional(),
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
      travelStyle: [],
      accommodation: "",
      transportation: "",
      notes: "",
      isVeteran: false,
      isActiveDuty: false,
      customInterests: "",
      customActivities: "",
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
        customInterests: z.string().optional(),
        customActivities: z.string().optional(),
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

  // CRITICAL FIX: Robust authentication with multiple fallbacks
  const [authUser, setLocalAuthUser] = useState<any>(null);
  
  // Check all possible auth sources in priority order
  let currentUser = authUser || authContextUser || authStorage.getUser();
  
  // Force refresh authentication on mount and when auth context changes
  React.useEffect(() => {
    const refreshAuth = async () => {
      // Try to get user from storage first
      const storageUser = authStorage.getUser();
      if (storageUser) {
        setLocalAuthUser(storageUser);
        return;
      }
      
      // If no storage user, try API refresh
      try {
        const refreshedUser = await authStorage.forceRefreshUser();
        if (refreshedUser) {
          setLocalAuthUser(refreshedUser);
          setAuthUser(refreshedUser);
        }
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    };
    
    if (!currentUser) {
      refreshAuth();
    }
  }, [authContextUser, setAuthUser]);
  
  const effectiveUserId = propUserId || currentUser?.id;
  
  // CRITICAL FIX: More robust isOwnProfile calculation with proper type handling
  const isOwnProfile = React.useMemo(() => {
    if (!currentUser?.id) return false;
    
    // If no propUserId, we're viewing our own profile from /profile route
    if (!propUserId) return true;
    
    // Compare IDs with type coercion
    const propId = parseInt(String(propUserId));
    const currentId = parseInt(String(currentUser.id));
    
    return propId === currentId;
  }, [propUserId, currentUser?.id]);
  
  React.useEffect(() => {
    if (isOwnProfile && effectiveUserId) nudgeIncrementLogin(effectiveUserId);
  }, [isOwnProfile, effectiveUserId]);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const editParam = params.get('edit');
      if (editParam === 'interests' && isOwnProfile) {
        setTimeout(() => {
          setIsEditingPublicInterests(true);
          setActiveEditSection('interests');
          const el = document.querySelector('[data-testid="interests-section"]');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    } catch {}
  }, [isOwnProfile]);

  // OPTIMIZED: Fetch ALL profile data in a single batched request
  // This replaces 18 separate API calls with 1 bundled request for 5-10x faster loading
  const { data: profileBundle, isLoading: bundleLoading, error: bundleError, refetch: refetchBundle } = useQuery<{
    user: User;
    travelPlans: any[];
    connections: any[];
    connectionRequests: any[];
    outgoingConnectionRequests: any[];
    references: any[];
    vouches: any[];
    photos: any[];
    travelMemories: any[];
    passportStamps: any[];
    platformStats: { totalUsers: number; totalConnections: number };
    profileEvents: any[];
    eventsGoing: any[];
    eventsInterested: any[];
    connectionStatus: { status: string; connectionId: number | null };
    compatibility: any;
    connectionDegree: any;
    businessDeals: any[];
    chatroomCount?: number;
  }>({
    // Include currentUser?.id in the key so the bundle re-fetches once the viewer's
    // identity is known (needed to compute compatibility on the server side).
    // Own-profile views (currentUser.id === effectiveUserId) still only fire once
    // because the viewer ID will match and no second fetch is needed after auth loads.
    queryKey: [`/api/users/${effectiveUserId}/profile-bundle`, currentUser?.id ?? null],
    queryFn: async () => {
      const url = `${getApiBaseUrl()}/api/users/${effectiveUserId}/profile-bundle`;
      const headers: Record<string, string> = {};
      // Keep header for backward-compat with iOS wrapped app; server now also
      // reads from the session so viewer-specific data loads correctly either way.
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id.toString();
      }
      const response = await fetch(url, { headers, credentials: 'include' });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You cannot view this user's profile due to privacy settings");
        }
        throw new Error('Failed to fetch profile bundle');
      }
      return response.json();
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000, // 5 min — prevent rapid re-fetches on re-renders
    gcTime: 30 * 60 * 1000,   // 30 min — keep in memory for the session
    refetchOnMount: false,     // Don't refetch if data is already cached
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Fallback: if the bundle fails, load just the basic user record so the page
  // doesn't show "Error Loading Profile" — partial data is better than nothing.
  const { data: fallbackUser } = useQuery<User>({
    queryKey: [`/api/users/${effectiveUserId}/basic`],
    queryFn: async () => {
      const url = `${getApiBaseUrl()}/api/users/${effectiveUserId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('basic user fetch failed');
      return response.json();
    },
    enabled: !!effectiveUserId && !!bundleError,
    staleTime: 30000,
    retry: 0,
  });

  // Extract data from bundle with fallbacks
  // If bundle stripped base64 profileImage, fetch it separately via lightweight endpoint
  const profileImageStripped = !!(profileBundle?.user as any)?.profileImageStripped;
  const { data: avatarData } = useQuery<{ profileImage: string | null }>({
    queryKey: ['/api/users', effectiveUserId, 'avatar'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/avatar`, { credentials: 'include' });
      if (!res.ok) return { profileImage: null };
      return res.json();
    },
    enabled: profileImageStripped && !!effectiveUserId,
    staleTime: 5 * 60 * 1000,
  });

  const rawFetchedUser = profileBundle?.user ?? fallbackUser;
  // Merge separately-fetched avatar back into user object.
  // Memoize to prevent creating a new object reference every render (causes render loops).
  const fetchedUser = useMemo(() => {
    if (rawFetchedUser && profileImageStripped && avatarData?.profileImage) {
      return { ...rawFetchedUser, profileImage: avatarData.profileImage };
    }
    return rawFetchedUser;
  }, [rawFetchedUser, profileImageStripped, avatarData?.profileImage]);
  const userLoading = bundleLoading && !fallbackUser;
  const userError = bundleError && !fallbackUser ? bundleError : null;
  const refetchUser = refetchBundle;

  // Keep a stable ref of the last successfully-fetched user so that a transient
  // server error doesn't wipe out the profile we already displayed.
  const lastFetchedUserRef = React.useRef<typeof fetchedUser>(undefined);
  const lastEffectiveUserIdRef = React.useRef<typeof effectiveUserId>(undefined);
  // Reset ref when navigating to a different user so stale data doesn't bleed through.
  if (lastEffectiveUserIdRef.current !== effectiveUserId) {
    lastEffectiveUserIdRef.current = effectiveUserId;
    lastFetchedUserRef.current = undefined;
  }
  if (fetchedUser) {
    lastFetchedUserRef.current = fetchedUser;
  }
  const stableFetchedUser = fetchedUser || lastFetchedUserRef.current;

  // Only fall back to currentUser when viewing OWN profile.
  // When viewing another user's profile, never silently substitute the current user's
  // data — this caused the bug where clicking any user card showed your own profile.
  const user = stableFetchedUser || (isOwnProfile ? currentUser : undefined);

  // Load gradient selection from database first, then localStorage as fallback
  useEffect(() => {
    if (user?.id) {
      // If user has a saved gradient in database, find which index it matches
      if (user.avatarGradient) {
        const gradientIndex = gradientCSSMap.indexOf(user.avatarGradient);
        if (gradientIndex !== -1) {
          setSelectedGradient(gradientIndex);
          return;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(`profile_gradient_${user.id}`);
      if (saved) {
        setSelectedGradient(parseInt(saved, 10));
      }
    }
  }, [user?.id, user?.avatarGradient]);

  // Save gradient selection when it changes - both localStorage and database
  useEffect(() => {
    if (user?.id && selectedGradient !== undefined) {
      // Save to localStorage
      localStorage.setItem(`profile_gradient_${user.id}`, selectedGradient.toString());
      
      // Save to database so it appears on user discovery cards
      const gradientCSS = gradientCSSMap[selectedGradient];
      if (gradientCSS) {
        apiRequest('PATCH', '/api/user/profile', { avatarGradient: gradientCSS }).then(() => {
          // Only invalidate the specific user query, not ALL /api/users/* queries
          queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`], exact: true });
        }).catch((err) => console.error('Failed to save gradient:', err));
      }
    }
  }, [selectedGradient, user?.id]);
  
  // BUNDLE-DERIVED: Travel plans from profile bundle
  const travelPlans = profileBundle?.travelPlans || [];
  const isLoadingTravelPlans = bundleLoading;

  // Fetch user's chatrooms for Travel Stats display (created AND joined)
  // NOTE: This is NOT in the bundle as it requires separate endpoint
  // Lazy-load full chatroom data only when Chatrooms tab is opened.
  // The tab badge uses profileBundle.chatroomCount instead (lightweight).
  const { data: userChatrooms = [], isLoading: chatroomsLoading } = useQuery<any[]>({
    queryKey: ['/api/users', effectiveUserId, 'chatroom-participation'],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      console.log(`💬 CHATROOM-FETCH: Fetching chatrooms for user ${effectiveUserId}`);
      const response = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/chatroom-participation`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error(`💬 CHATROOM-FETCH: Failed with status ${response.status}`);
        return [];
      }
      const data = await response.json();
      console.log(`💬 CHATROOM-FETCH: Got ${Array.isArray(data) ? data.length : 0} chatrooms for user ${effectiveUserId}`);
      return Array.isArray(data) ? data : [];
    },
    // Fetch immediately (no lazy-load gate) so data is ready when tab is clicked.
    // The endpoint is fast (~60ms, cached) and returns minimal JSON.
    enabled: isOwnProfile ? !!currentUser?.id : !!effectiveUserId,
    staleTime: 2 * 60 * 1000,
  });
  // Bundle provides a lightweight count for the tab badge without loading full chatroom data
  const chatroomCount = userChatrooms.length > 0 ? userChatrooms.length : (profileBundle?.chatroomCount ?? 0);

  // BUNDLE-DERIVED: Compatibility score from profile bundle
  const compatibilityData = profileBundle?.compatibility;

  // Fetch CURRENT VIEWER's travel plans for hostel matching (only when viewing someone else's profile)
  const { data: viewerTravelPlans = [] } = useQuery<any[]>({
    queryKey: ['/api/users', currentUser?.id, 'travel-plans', 'viewer'],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`${getApiBaseUrl()}/api/users/${currentUser.id}/travel-plans`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !isOwnProfile && !!currentUser?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Calculate hostel match between viewer and profile user
  const hostelMatch = React.useMemo(() => {
    if (isOwnProfile || !viewerTravelPlans.length || !travelPlans.length) return null;
    
    const now = new Date();
    
    // Find active/upcoming trips for both users
    const viewerActiveTrips = viewerTravelPlans.filter((plan: any) => {
      if (!plan.startDate || !plan.endDate || !plan.hostelName) return false;
      const end = new Date(plan.endDate);
      return end >= now;
    });
    
    const profileActiveTrips = travelPlans.filter((plan: any) => {
      if (!plan.startDate || !plan.endDate || !plan.hostelName) return false;
      const end = new Date(plan.endDate);
      return end >= now;
    });
    
    // Check for matching hostel + destination + overlapping dates
    for (const viewerTrip of viewerActiveTrips) {
      for (const profileTrip of profileActiveTrips) {
        const viewerHostel = viewerTrip.hostelName?.toLowerCase().trim();
        const profileHostel = profileTrip.hostelName?.toLowerCase().trim();
        const viewerDest = viewerTrip.destination?.toLowerCase().split(',')[0].trim();
        const profileDest = profileTrip.destination?.toLowerCase().split(',')[0].trim();
        
        // Check same hostel AND same destination
        if (viewerHostel && profileHostel && viewerHostel === profileHostel && viewerDest === profileDest) {
          // Check date overlap
          const viewerStart = new Date(viewerTrip.startDate);
          const viewerEnd = new Date(viewerTrip.endDate);
          const profileStart = new Date(profileTrip.startDate);
          const profileEnd = new Date(profileTrip.endDate);
          
          const hasOverlap = viewerStart <= profileEnd && profileStart <= viewerEnd;
          
          if (hasOverlap) {
            return {
              hostelName: profileTrip.hostelName,
              destination: profileTrip.destination?.split(',')[0] || profileTrip.destination
            };
          }
        }
      }
    }
    
    return null;
  }, [isOwnProfile, viewerTravelPlans, travelPlans]);

  // BUNDLE-DERIVED: Connection degree from profile bundle
  const bundleConnectionDegree = profileBundle?.connectionDegree as {
    degree: number;
    mutualCount: number;
    mutuals: Array<{ id: number; username: string; name: string; profileImage?: string }>;
    connectingFriends?: Array<{ id: number; username: string; name: string; profileImage?: string }>;
    connectingFriendCount?: number;
  } | undefined;

  // FALLBACK: If the bundle's connectionDegree is null/undefined (query failed on server),
  // fetch it separately via the standalone endpoint. This ensures mutual counts
  // are never stuck at 0 due to a transient server-side failure.
  const { data: fallbackConnectionDegree } = useQuery<{
    degree: number;
    mutualCount: number;
    mutuals: Array<{ id: number; username: string; name: string; profileImage?: string }>;
  }>({
    queryKey: ['/api/connections/degree', currentUser?.id, effectiveUserId],
    queryFn: async () => {
      if (!currentUser?.id || !effectiveUserId || currentUser.id === effectiveUserId) {
        return { degree: 0, mutualCount: 0, mutuals: [] };
      }
      const url = `${getApiBaseUrl()}/api/connections/degree/${currentUser.id}/${effectiveUserId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('fallback degree fetch failed');
      return response.json();
    },
    enabled: !!currentUser?.id && !!effectiveUserId && currentUser.id !== effectiveUserId
      && !bundleLoading && !bundleConnectionDegree,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Use bundle data if available, otherwise use fallback
  const connectionDegreeData = bundleConnectionDegree ?? fallbackConnectionDegree;

  const commonStats = useMemo(() => {
    console.log("COMMON STATS INPUTS", {
      compatibilityData,
      connectionDegreeData,
      matchCount: (compatibilityData as any)?.matchCount,
      sharedInterests: (compatibilityData as any)?.sharedInterests,
      sharedActivities: (compatibilityData as any)?.sharedActivities,
      sharedCountries: (compatibilityData as any)?.sharedCountries,
      sharedLanguages: (compatibilityData as any)?.sharedLanguages,
      mutualCount: connectionDegreeData?.mutualCount,
    });
    console.log("PROFILE HERO COMMONALITY DEBUG", {
      currentUserId: currentUser?.id,
      otherUserId: effectiveUserId,
      compatibility: profileBundle?.compatibility,
      connectionDegree: profileBundle?.connectionDegree,
      totalFromProfile: computeCommonStats(profileBundle?.compatibility as any, profileBundle?.connectionDegree as any)?.totalCommon,
    });
    return computeCommonStats(compatibilityData as any, connectionDegreeData as any);
  }, [
    compatibilityData,
    connectionDegreeData,
    currentUser?.id,
    effectiveUserId,
    profileBundle,
  ]);
  
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
  
  // BUNDLE-DERIVED: Platform statistics from profile bundle
  const platformStats = profileBundle?.platformStats;
  
  // Update localStorage when fresh data is fetched to keep it in sync
  React.useEffect(() => {
    if (fetchedUser && isOwnProfile) {
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
    
    // PRIORITY 1: Check current travel plans for active trips (date-validated)
    // This is the most reliable check because it verifies startDate <= today <= endDate
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && user.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = user.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "traveler";
      }
    }
    
    // PRIORITY 2: Trust isCurrentlyTraveling flag with destination fields
    // CRITICAL FIX: If user signed up as traveling with destination, show as traveler
    // Date validation is secondary - destination fields take priority for newly signed up users
    if (user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry) {
      const travelDestination = user.destinationCity.toLowerCase();
      const hometown = user.hometownCity?.toLowerCase() || '';
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "traveler";
      }
    }
    
    // PRIORITY 2b: Fallback to travelDestination field if destinationCity not set
    if (user.isCurrentlyTraveling && user.travelDestination) {
      const travelDestination = user.travelDestination.toLowerCase();
      const hometown = user.hometownCity?.toLowerCase() || '';
      
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

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    // Lazy load: only fetch when contacts tab is opened
    enabled: !!effectiveUserId && loadedTabs.has('contacts'),
    staleTime: 30 * 1000,
  });

  // Sort connections to show mutual connections first (when viewing someone else's profile)
  const sortedUserConnections = useMemo(() => {
    if (!connectionDegreeData?.mutuals || isOwnProfile) {
      return userConnections;
    }
    
    const mutualIds = new Set(connectionDegreeData.mutuals.map((m: any) => m.id));
    
    return [...userConnections].sort((a: any, b: any) => {
      const aIsMutual = mutualIds.has(a.connectedUser?.id);
      const bIsMutual = mutualIds.has(b.connectedUser?.id);
      
      if (aIsMutual && !bIsMutual) return -1;
      if (!aIsMutual && bIsMutual) return 1;
      return 0;
    });
  }, [userConnections, connectionDegreeData?.mutuals, isOwnProfile]);

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
    staleTime: 60000, // Cache for 60 seconds
    gcTime: 120000, // Keep in cache for 2 minutes
  });

  // BUNDLE-DERIVED: Connection requests from profile bundle
  const connectionRequests = profileBundle?.connectionRequests || [];

  // BUNDLE-DERIVED: Outgoing (sent) pending requests for profile owner
  const outgoingConnectionRequests = profileBundle?.outgoingConnectionRequests || [];

  // BUNDLE-DERIVED: Mutual connections from bundle connections data
  const mutualConnections = profileBundle?.connections || [];

  // SEPARATE QUERY: References received by this user - use dedicated endpoint for reliability
  // This bypasses any issues with the profile bundle and ensures the badge always shows
  const { data: referencesData } = useQuery<{ references: any[]; counts: { total: number; positive: number; negative: number; neutral: number } }>({
    queryKey: [`/api/users/${effectiveUserId}/references`],
    // Lazy load: only fetch when references tab is opened
    enabled: !!effectiveUserId && loadedTabs.has('references'),
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });
  const userReferences = referencesData?.references || [];

  // BUNDLE-DERIVED: Vouches received by this user from profile bundle
  const userVouches = profileBundle?.vouches || [];

  // BUNDLE-DERIVED: Connection status from profile bundle
  const connectionStatus = (profileBundle?.connectionStatus || { status: 'none' }) as {
    status: 'pending' | 'accepted' | 'rejected' | 'none';
    requesterId?: number;
    receiverId?: number;
  };

  // BUNDLE-DERIVED: User photos from profile bundle
  const userPhotos = profileBundle?.photos || [];





  // BUNDLE-DERIVED: Travel memories from profile bundle
  const userTravelMemories = profileBundle?.travelMemories || [];

  // BUNDLE-DERIVED: Business deals from profile bundle
  const businessDeals = profileBundle?.businessDeals || [];
  const businessDealsLoading = bundleLoading;

  // Travel plans query moved above for proper dependency order

  // NOTE: Removed aggressive cache clearing useEffects that were causing constant blinking
  // Cache is now managed by staleTime/gcTime settings on individual queries

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
  
  // BUNDLE-DERIVED: Profile events from profile bundle
  const profileEvents = profileBundle?.profileEvents || [];
  const profileEventsLoading = bundleLoading;
  
  // BUNDLE-DERIVED: Events user is going to (committed attendance) - only future events
  const eventsGoing = (profileBundle?.eventsGoing || []).filter((e: any) => new Date(e.date) >= new Date(new Date().toDateString()));
  
  // BUNDLE-DERIVED: Events user is interested in (bookmarked/watching) - only future events
  const eventsInterested = (profileBundle?.eventsInterested || []).filter((e: any) => new Date(e.date) >= new Date(new Date().toDateString()));



  // Get the current user type for schema selection
  const currentUserType = user?.userType || 'traveler';
  const dynamicProfileSchema = getDynamicProfileSchema(currentUserType);
  
  const profileForm = useForm<z.infer<typeof dynamicProfileSchema>>({
    resolver: zodResolver(dynamicProfileSchema),
    defaultValues: (currentUserType === 'business' ? {
      firstName: "",
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
      // Contact Information
      contactName: "",
      contactPhone: "",
      travelStyle: [],
      interests: [],
      activities: [],
      customInterests: "",
      customActivities: "",
      isVeteran: false,
      isActiveDuty: false,
      isMinorityOwned: false,
      isFemaleOwned: false,
      isLGBTQIAOwned: false,
      showMinorityOwned: true,
      showFemaleOwned: true,
      showLGBTQIAOwned: true,
    } : {
      firstName: "",
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
    }) as any,
  });

  // Update form values when user data changes (fresh from database)
  React.useEffect(() => {
    if (user && !userLoading) {
      console.log('Updating profile form with fresh user data:', {
        hometownCity: user.hometownCity,
        hometownState: user.hometownState,
        hometownCountry: user.hometownCountry
      });
      
      // Initialize temp values for editing - EXCLUDE hometown/travel interests from profile interests to prevent duplication
      const signupInterests = [...getHometownInterests(), ...getTravelInterests()];
      
      // Migrate legacy combined options to new split options
      const migratedInterests = migrateLegacyOptions(user.interests || []);
      const migratedActivities = migrateLegacyOptions(user.activities || []);
      
      setTempInterests(migratedInterests);
      setTempActivities(migratedActivities);
      
      setEditFormData({
        interests: migratedInterests,
        activities: migratedActivities,
        subInterests: user.subInterests || [],
        privateInterests: Array.isArray((user as any).privateInterests) ? (user as any).privateInterests : (Array.isArray((user as any).private_interests) ? (user as any).private_interests : [])
      });
      
      if (user.userType === 'business') {
        // Extract custom entries from the arrays (entries not in predefined lists)
        const allPredefinedInterests = [...getHometownInterests(), ...getTravelInterests(), ...getProfileInterests()];
        
        // Already migrated above, use the migrated arrays
        const customInterests = migratedInterests
          .filter((item: string) => !allPredefinedInterests.includes(item))
          .join(', ');
        const customActivities = migratedActivities
          .filter((item: string) => !safeGetAllActivities().includes(item))
          .join(', ');
        
        // Only include predefined entries in the checkbox arrays
        const predefinedInterests = migratedInterests
          .filter((item: string) => allPredefinedInterests.includes(item));
        const predefinedActivities = migratedActivities
          .filter((item: string) => safeGetAllActivities().includes(item));
        
        profileForm.reset({
          firstName: (user as any).firstName || (user as any).first_name || ((user as any).name ? String((user as any).name).split(' ')[0] : ""),
          bio: user.bio || "",
          businessName: (user as any).business_name || (user as any).businessName || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "",
          travelStyle: user.travelStyle || [],
          privateInterests: (user as any).privateInterests || (user as any).private_interests || [],
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
          isVeteran: Boolean((user as any).is_veteran || user.isVeteran),
          isActiveDuty: Boolean((user as any).is_active_duty || user.isActiveDuty),
          customInterests: (user as any).customInterests || "",
          customActivities: (user as any).customActivities || "",
        });
      } else {
        const travelingWithChildrenValue = !!(user as any).travelingWithChildren;
        
        profileForm.reset({
          firstName: (user as any).firstName || (user as any).first_name || ((user as any).name ? String((user as any).name).split(' ')[0] : ""),
          bio: user.bio || "",
          secretActivities: user.secretActivities || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "",
          ageVisible: Boolean(user.ageVisible),
          gender: user.gender || "",
          sexualPreference: user.sexualPreference || [],
          sexualPreferenceVisible: Boolean(user.sexualPreferenceVisible),
          travelStyle: user.travelStyle || [],
          privateInterests: (user as any).privateInterests || (user as any).private_interests || [],
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
          customInterests: (user as any).customInterests || (user as any).custom_interests || "",
          customActivities: (user as any).customActivities || (user as any).custom_activities || "",
        });
        
        // Force set the value after reset to ensure React Hook Form properly registers it
        setTimeout(() => {
          profileForm.setValue('travelingWithChildren', travelingWithChildrenValue);
        }, 100);
      }
    }
  }, [user, userLoading, profileForm]);

  // Re-populate form when dialog opens to ensure latest data is shown
  // Using deferred initialization to prevent page freeze
  React.useEffect(() => {
    if (isEditMode && user && !userLoading) {
      // Reset form ready state first
      setIsFormReady(false);
      
      // Use requestAnimationFrame to defer heavy form initialization
      const initForm = () => {
        console.log('🔥 Re-syncing form with updated user data');
        
        // Migrate legacy combined options before using
        const reSyncMigratedInterests = migrateLegacyOptions(user.interests || []);
        const reSyncMigratedActivities = migrateLegacyOptions(user.activities || []);
        
        setEditFormData({
          interests: reSyncMigratedInterests,
          activities: reSyncMigratedActivities,
          subInterests: user.subInterests || [],
          privateInterests: Array.isArray((user as any).privateInterests) ? (user as any).privateInterests : (Array.isArray((user as any).private_interests) ? (user as any).private_interests : [])
        });
        
        // For business users, extract and set custom fields
        if (user.userType === 'business') {
          const allPredefinedInterests = [...getHometownInterests(), ...getTravelInterests(), ...getProfileInterests()];
          const customInterests = reSyncMigratedInterests
            .filter((item: string) => !allPredefinedInterests.includes(item))
            .join(', ');
          const customActivities = reSyncMigratedActivities
            .filter((item: string) => !safeGetAllActivities().includes(item))
            .join(', ');
          
          const predefinedInterests = reSyncMigratedInterests
            .filter((item: string) => allPredefinedInterests.includes(item));
          const predefinedActivities = reSyncMigratedActivities
            .filter((item: string) => safeGetAllActivities().includes(item));
          
          profileForm.reset({
            firstName: (user as any).firstName || (user as any).first_name || ((user as any).name ? String((user as any).name).split(' ')[0] : ""),
            bio: user.bio || "",
            businessName: (user as any).business_name || (user as any).businessName || "",
            businessDescription: (user as any).business_description || (user as any).businessDescription || "",
            businessType: (user as any).business_type || (user as any).businessType || "",
            hometownCity: user.hometownCity || "",
            hometownState: user.hometownState || "",
            hometownCountry: user.hometownCountry || "",
            dateOfBirth: user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "",
            travelStyle: user.travelStyle || [],
            privateInterests: (user as any).privateInterests || (user as any).private_interests || [],
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
            customInterests: customInterests || user.customInterests || "",
            customActivities: customActivities || user.customActivities || "",
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
            firstName: (user as any).firstName || (user as any).first_name || ((user as any).name ? String((user as any).name).split(' ')[0] : ""),
            bio: user.bio || "",
            secretActivities: user.secretActivities || "",
            hometownCity: user.hometownCity || "",
            hometownState: user.hometownState || "",
            hometownCountry: user.hometownCountry || "",
            dateOfBirth: user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "",
            ageVisible: !!user.ageVisible,
            gender: user.gender || "",
            sexualPreference: user.sexualPreference || [],
            sexualPreferenceVisible: !!user.sexualPreferenceVisible,
            travelStyle: user.travelStyle || [],
            privateInterests: (user as any).privateInterests || (user as any).private_interests || [],
            travelingWithChildren: !!user.travelingWithChildren,
            childrenAges: user.childrenAges || (user as any).children_ages || "",
            isVeteran: !!user.isVeteran || !!((user as any).is_veteran),
            isActiveDuty: !!user.isActiveDuty || !!((user as any).is_active_duty),
          });
        }
        
        // Mark form as ready after initialization
        setIsFormReady(true);
      };
      
      // Defer form initialization to next animation frame to prevent freeze
      requestAnimationFrame(() => {
        setTimeout(initForm, 50);
      });
    } else if (!isEditMode) {
      // Reset form ready state when dialog closes
      setIsFormReady(false);
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
      const response = await fetch(`${getApiBaseUrl()}/api/references/${referenceId}`, {
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
      console.log('🚀 CREATE REFERENCE MUTATION CALLED', {
        referenceData,
        currentUserId: currentUser?.id,
        effectiveUserId,
        user: user?.username
      });
      
      const payload = {
        reviewerId: currentUser?.id,
        revieweeId: effectiveUserId, // Use the profile user ID  
        experience: referenceData.experience || "positive",
        content: referenceData.content || "",
      };
      
      console.log('📤 POSTING REFERENCE:', payload);
      
      const response = await fetch(`${getApiBaseUrl()}/api/user-references`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📥 RESPONSE STATUS:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ SERVER ERROR:', errorData);
        throw new Error(errorData.message || 'Failed to create reference');
      }
      const result = await response.json();
      console.log('✅ REFERENCE CREATED:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ SUCCESS CALLBACK - Invalidating cache');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/references`] });
      toast({
        title: "Reference submitted",
        description: "Your reference has been posted successfully.",
      });
      setShowReferenceForm(false);
      setShowWriteReferenceModal(false);
      referenceForm.reset();
      setShowWriteReferenceModal(false);
      referenceForm.reset();
    },
    onError: (error: any) => {
      console.error('❌ REFERENCE SUBMISSION ERROR:', error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to submit reference. Please try again.";
      
      // Show alert as fallback
      alert(`ERROR: ${errorMessage}`);
      
      toast({
        title: "Cannot Submit Reference",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      console.log('📅 FORM INIT - user.dateOfBirth raw:', user.dateOfBirth);
      console.log('📅 FORM INIT - formatted:', user.dateOfBirth ? formatDateOfBirthForInput(user.dateOfBirth) : "empty");
      profileForm.reset({
        firstName: (user as any).firstName || (user as any).first_name || ((user as any).name ? String((user as any).name).split(' ')[0] : ""),
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
        privateInterests: Array.isArray((user as any).privateInterests) ? (user as any).privateInterests : (Array.isArray((user as any).private_interests) ? (user as any).private_interests : []),
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

  // BUNDLE-DERIVED: Photos from profile bundle
  const photos = (profileBundle?.photos || []) as UserPhoto[];
  const photosLoading = bundleLoading;


  // BUNDLE-DERIVED: References from profile bundle (already defined above as userReferences)
  const references = userReferences;

  // BUNDLE-DERIVED: Vouches from profile bundle (already defined above as userVouches)
  const vouches = userVouches;

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
              const response = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/photos`, {
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
              const response = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/photos`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
      toast({
        title: "Photo uploaded!",
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
      const response = await fetch(`${getApiBaseUrl()}/api/photos/${photoId}`, {
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
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${planId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete travel plan');
      return response.json();
    },
    onSuccess: () => {
      // CRITICAL: Clear localStorage cache to prevent stale data
      invalidateUserCache();
      
      // Invalidate all travel plan and user-related queries to ensure consistency across the entire application
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/travel-plans`] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate matches page data since travel plans affect matching
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-by-location"] });
      // Invalidate profile bundle so tab counts update immediately
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
      
      // Force immediate refetch
      refetchUser();
      
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
        
        img.onload = async () => {
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
              const response = await apiRequest('PUT', `/api/users/${effectiveUserId}/profile-photo`, {
                imageData: lowerQualityBase64
              });
              // CRITICAL: Parse JSON response properly
              const jsonData = await response.json();
              resolve(jsonData);
            } else {
              console.log('Profile image compressed successfully, final size:', compressedBase64.length);
              const response = await apiRequest('PUT', `/api/users/${effectiveUserId}/profile-photo`, {
                imageData: compressedBase64
              });
              // CRITICAL: Parse JSON response properly
              const jsonData = await response.json();
              resolve(jsonData);
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
    onSuccess: async (data: any) => {
      // CRITICAL: Clear localStorage cache to prevent stale data
      invalidateUserCache();
      
      // API returns { user, profileImage, message } - extract user and ensure profileImage is set
      const rawUser = data?.user || data;
      const updatedUser = {
        ...rawUser,
        profileImage: data?.profileImage ?? rawUser?.profileImage,
      };
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
        
        // Force immediate refresh of all user data
        queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
        queryClient.setQueryData(['/api/users'], (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(u => u.id === updatedUser.id ? updatedUser : u);
          }
          return oldData;
        });

        // Immediately invalidate profile-bundle cache so main profile photo updates without delay
        queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
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



  // Handle avatar upload: compress → open crop modal (don't upload yet)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an avatar image smaller than 2MB.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    try {
      const compressed = await compressPhotoAdaptive(file).catch(() => file);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarCropSrc(base64);
        setAvatarCropOffset({ x: 0, y: 0 });
        setAvatarCropScale(1);
        setShowAvatarCropModal(true);
      };
      reader.onerror = () => toast({ title: "Error", description: "Failed to read image file", variant: "destructive" });
      reader.readAsDataURL(compressed);
    } catch {
      toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
    }
  };

  // Save cropped avatar: render to canvas with the user's chosen position, then upload
  const saveAvatarCrop = async () => {
    if (!avatarCropSrc) return;
    setShowAvatarCropModal(false);
    setUploadingPhoto(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = avatarCropSrc;
      });

      const outputSize = 512;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d')!;

      // Calculate crop: the image fills the circle at avatarCropScale, offset by avatarCropOffset
      const scale = avatarCropScale;
      const imgAspect = img.width / img.height;
      let drawW: number, drawH: number;
      if (imgAspect > 1) {
        drawH = outputSize * scale;
        drawW = drawH * imgAspect;
      } else {
        drawW = outputSize * scale;
        drawH = drawW / imgAspect;
      }
      const drawX = (outputSize - drawW) / 2 + avatarCropOffset.x * scale;
      const drawY = (outputSize - drawH) / 2 + avatarCropOffset.y * scale;

      // Clip to circle
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: base64 }),
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      const updatedUser = await response.json();

      authStorage.setUser(updatedUser);
      if (setAuthUser && isOwnProfile) setAuthUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
      toast({ title: "Success", description: "Avatar updated successfully!" });
    } catch (error: any) {
      console.error('Avatar crop/upload error:', error);
      toast({ title: "Upload Failed", description: error?.message || "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      setAvatarCropSrc(null);
    }
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
      
      const response = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/cover-photo`, {
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
      
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${editingTravelPlan.id}`, {
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
      // CRITICAL: Clear localStorage cache to prevent stale data
      invalidateUserCache();
      
      // Invalidate all travel plan and user-related queries to ensure consistency across the entire application
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/travel-plans`] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate matches page data since travel plans affect matching
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-by-location"] });
      // Invalidate profile bundle so tab counts update immediately
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
      // CRITICAL: Invalidate all event queries since changing travel destination changes which events are shown
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      // Force immediate refetch
      refetchUser();
      
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
      invalidateUserCache();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Interests updated",
        description: "Your interests have been successfully updated.",
      });
      setIsEditingPublicInterests(false);
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
      invalidateUserCache();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Activities updated",
        description: "Your activities have been successfully updated.",
      });
      setActiveEditSection(null);
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

  const updateLanguages = useMutation({
    mutationFn: async (languages: string[]) => {
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, {
        languagesSpoken: languages
      });
      return response;
    },
    onSuccess: () => {
      invalidateUserCache();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Languages updated",
        description: "Your languages have been successfully updated.",
      });
      setActiveEditSection(null);
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
      invalidateUserCache();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      toast({
        title: "Countries updated",
        description: "Your countries visited have been successfully updated.",
      });
      setActiveEditSection(null);
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
      activeEditSection,
      tempInterests 
    });
    if (!user) {
      console.log('❌ EDIT INTERESTS: No user data available');
      return;
    }
    const userInterests = user.interests || [];
    console.log('🔧 EDIT INTERESTS: Setting temp interests to:', userInterests);
    setTempInterests(userInterests);
    setActiveEditSection('interests');
    console.log('🔧 EDIT INTERESTS: Edit mode activated');
  };

  // AI Bio Generator - generates a personalized bio from user's profile data
  const handleGenerateBio = async () => {
    console.log('🤖 AI Bio button clicked!');
    if (isGeneratingBio) return;
    
    setIsGeneratingBio(true);
    console.log('🤖 Starting bio generation...');
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('travelconnect_user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userData) {
        headers['x-user-id'] = userData.id?.toString();
        headers['x-user-data'] = JSON.stringify({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name
        });
      }

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/generate-bio`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      
      console.log('🤖 Response received:', response.status, response.ok);
      let data: { success?: boolean; bio?: string; message?: string } = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch {
        // non-JSON response (e.g. 500 HTML)
      }
      
      if (response.ok && data.success && data.bio) {
        profileForm.setValue('bio', data.bio);
        toast({
          title: "Bio generated!",
          description: "Review and edit the bio if you'd like, then save your profile.",
        });
      } else {
        toast({
          title: "Couldn't generate bio",
          description: data.message || "Please add more interests first.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Bio generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate bio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSaveInterests = () => {
    updateInterests.mutate(tempInterests);
  };

  const handleCancelInterests = () => {
    setActiveEditSection(null);
    setTempInterests([]);
  };

  const handleEditActivities = () => {
    if (!user) return;
    setTempActivities(user.activities || []);
    setActiveEditSection('activities');
  };

  const handleSaveActivities = () => {
    updateActivities.mutate(tempActivities);
  };

  const handleCancelActivities = () => {
    setActiveEditSection(null);
    setTempActivities([]);
  };

  // CRITICAL: Main save function that saves interests and activities
  const handleSave = async () => {
    if (!user) return false;
    
    try {
      console.log('🔧 SAVING DATA:', {
        interests: editFormData.interests,
        activities: editFormData.activities
      });
      
      // Prepare the update payload
      const updateData: any = {
        interests: editFormData.interests,
        activities: editFormData.activities
      };
      
      console.log('🔧 SAVE PAYLOAD: Sending update with separated data', updateData);
      
      // Send the update request
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // CRITICAL: Clear all caches to ensure fresh data
      invalidateUserCache();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      refetchUser();
      
      if (effectiveUserId) nudgeDismiss(effectiveUserId, 'interests');
      
      toast({
        title: "All preferences saved!",
        description: `Successfully saved ${editFormData.interests.length} interests and ${editFormData.activities.length} activities.`,
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
    setActiveEditSection(null);
    setTempInterests([]);
    setTempActivities([]);
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
    setActiveEditSection('languages');
  };

  const handleSaveLanguages = () => {
    updateLanguages.mutate(tempLanguages);
  };

  const handleCancelLanguages = () => {
    setActiveEditSection(null);
    setTempLanguages([]);
  };

  const handleEditCountries = () => {
    if (!user) return;
    setTempCountries(user.countriesVisited || []);
    setActiveEditSection('countries');
  };

  const handleSaveCountries = () => {
    updateCountries.mutate(tempCountries);
  };

  const handleCancelCountries = () => {
    setActiveEditSection(null);
    setTempCountries([]);
  };

  // Business description editing handlers
  const handleSaveBusinessDescription = async () => {
    if (!user) return;
    setSavingBusinessDescription(true);
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
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
      
      setActiveEditSection(null);
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
    setActiveEditSection(null);
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
    setActiveEditSection('business');
  };

  // Owner contact mutation and handlers (businessName, contactName, contactEmail, contactPhone, contactRole)
  const updateOwnerContact = useMutation({
    mutationFn: async (data: { businessName: string; contactName: string; ownerEmail: string; ownerPhone: string; contactRole: string }) => {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
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
      setActiveEditSection(null);
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

  // Initialize owner contact form when user data loads (correct fields: businessName, contact person, role)
  useEffect(() => {
    if (user && user.userType === 'business') {
      setOwnerContactForm({
        businessName: (user as any).businessName ?? user.businessName ?? (user as any).name ?? "",
        contactName: (user as any).contactName ?? user.contactName ?? user.ownerName ?? "",
        ownerEmail: user.ownerEmail || "",
        ownerPhone: user.ownerPhone || "",
        contactRole: (user as any).contactRole ?? user.contactRole ?? ""
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
        isMinorityOwned: !!(data as any).isMinorityOwned,
        isFemaleOwned: !!(data as any).isFemaleOwned,
        isLGBTQIAOwned: !!(data as any).isLGBTQIAOwned,
        showMinorityOwned: (data as any).showMinorityOwned !== false,
        showFemaleOwned: (data as any).showFemaleOwned !== false,
        showLGBTQIAOwned: (data as any).showLGBTQIAOwned !== false,
      } : {
        ...data,
        // Only include traveler fields if they exist in the data
        ...((data as any).hasOwnProperty('travelingWithChildren') && { travelingWithChildren: !!(data as any).travelingWithChildren }),
        ...((data as any).hasOwnProperty('ageVisible') && { ageVisible: !!(data as any).ageVisible }),
        ...((data as any).hasOwnProperty('sexualPreferenceVisible') && { sexualPreferenceVisible: !!(data as any).sexualPreferenceVisible }),
        // Always include veteran status fields
        isVeteran: !!data.isVeteran,
        isActiveDuty: !!data.isActiveDuty,
        isMinorityOwned: !!(data as any).isMinorityOwned,
        isFemaleOwned: !!(data as any).isFemaleOwned,
        isLGBTQIAOwned: !!(data as any).isLGBTQIAOwned,
        showMinorityOwned: (data as any).showMinorityOwned !== false,
        showFemaleOwned: (data as any).showFemaleOwned !== false,
        showLGBTQIAOwned: (data as any).showLGBTQIAOwned !== false,
      };
      
      console.log('🔥 MUTATION: Profile payload with explicit booleans:', payload);
      
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/users/${effectiveUserId}`, {
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
      
      // CRITICAL: Clear localStorage cache to prevent stale data
      invalidateUserCache();
      
      // Update profile-bundle cache immediately so the red "fill out bio" bar disappears without waiting for refetch
      queryClient.setQueryData(
        [`/api/users/${effectiveUserId}/profile-bundle`, currentUser?.id],
        (prev: any) => (prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : { user: updatedUser })
      );
      
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
            firstName: (updatedUser as any).firstName || (updatedUser as any).first_name || ((updatedUser as any).name ? String((updatedUser as any).name).split(' ')[0] : ""),
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
            privateInterests: (updatedUser as any).privateInterests || (updatedUser as any).private_interests || [],
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
      // CRITICAL: Invalidate profile-bundle to refresh interests/activities immediately
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}/profile-bundle`] });
      
      if (effectiveUserId && updatedUser.bio && updatedUser.bio.trim()) {
        nudgeDismiss(effectiveUserId, 'bio');
      }
      
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
      
      console.log('🔥 BUSINESS SUBMIT: Final data with custom fields processed:', formData);
    }
    
    // Send dateOfBirth as string - server will handle conversion to Date
    editProfile.mutate(data);
  };

  // Get countries visited from user profile data
  const countriesVisited = user?.countriesVisited || [];
  const citiesVisited: string[] = [];

  // Languages spoken (mock data - would be from user profile)
  const languages = ["English", "Spanish", "Portuguese"];

  // Removed old shared connectMutation - now using individual ConnectButton components

  const handleMessage = async () => {
    if (!user?.id || !currentUser?.id) return;
    // Signal the conversation open to both sides — creates a DB record so both
    // users' DM pages show the thread immediately, before any typed message.
    apiRequest('POST', '/api/conversations/open', {
      senderId: currentUser.id,
      targetUserId: user.id,
    }).catch(() => {});
    const handled = await openPrivateChatWithUser(user.id, setLocation, {
      currentUserId: currentUser?.id,
      toast,
    });
    if (!handled) {
      setLocation(`/messages/${user.id}`);
    }
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
      return null; // Don't show the button if already connected
    }
    
    if (connectionStatus?.status === 'pending') {
      // Check if current user is the requester or the recipient
      // If profileBundle.connectionStatus includes senderId, we can use it
      // Otherwise we can check connectionRequests which contains incoming requests
      const isIncoming = connectionRequests.some((req: any) => req.userId === currentUser?.id || req.senderId === effectiveUserId);
      
      // Actually, connectionRequests in the bundle are usually INCOMING to the profile being viewed?
      // No, if I am viewing User B, and User B has a pending request from me, 
      // then for ME, it's an outgoing request.
      
      // Let's look at how connectionStatus is populated in the bundle.
      // If I am User A viewing User B.
      // status: 'pending' means there is a record in connections table with status 'pending' between A and B.
      
      // We need to know who is the 'user_id' (target) and who is the 'friend_id' (requester) in that record.
      // In our schema: user_id is the recipient, friend_id is the sender.
      
      if (connectionStatus?.requesterId === currentUser?.id) {
        return { text: 'Request Sent', disabled: true, variant: 'default' as const, className: 'bg-orange-600/50 text-white border-0 cursor-not-allowed' };
      } else {
        return { text: 'Accept Request', disabled: false, variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white border-0' };
      }
    }
    
    return { text: 'Connect', disabled: false, variant: 'default' as const, className: 'bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm' };
  };

  // Function to determine current location based on travel status
  const getCurrentLocation = () => {
    if (!user) return "Not specified";
    
    // Use the modern travel plans system (same as all other components)
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination) {
      return currentDestination;
    }
    
    // Otherwise show their hometown - NEVER use location field (contains metro area)
    return user.hometownCity || "Not specified";
  };

  // Admin hooks — MUST live BEFORE any early return so React sees a consistent hook count
  const isNearbytrav = isOwnProfile && currentUser?.username === 'nearbytrav';

  type AdminUser = {
    id: number; username: string; name: string; firstName: string | null; lastName: string | null;
    userType: string; email: string;
    lastLogin: string | null; createdAt: string; ambassadorStatus: string | null;
    isAdmin: boolean | null; profileImage: string | null; adminNotes: string | null;
    referralCount: number | null; hometownCity: string | null; hometownState: string | null;
  };

  const { data: adminUsers, isLoading: adminLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: isNearbytrav,
  });

  const [adminTab, setAdminTab] = useState<'all' | 'ambassadors' | 'cold'>('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [togglingAmbassador, setTogglingAmbassador] = useState<number | null>(null);
  const [localUserData, setLocalUserData] = useState<Record<number, Partial<AdminUser>>>({});

  const COLD_DAYS = 14;

  if (userLoading && !user) {
    const nav = (propUserId && prefetchedNav.userId === propUserId) ? prefetchedNav : null;
    return <SkeletonProfile prefetched={nav} />;
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
                  setLocation(isNativeIOSApp() ? '/home' : '/');
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

  // Show loading while waiting for authentication to load
  if (!effectiveUserId) {
    const nav = (propUserId && prefetchedNav.userId === propUserId) ? prefetchedNav : null;
    return <SkeletonProfile prefetched={nav} />;
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
    const nav = (propUserId && prefetchedNav.userId === propUserId) ? prefetchedNav : null;
    return <SkeletonProfile prefetched={nav} />;
  }

  // Clean gradient background when no cover photo exists
  const getCleanBackground = () => {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  // Check if user profile is incomplete and needs completion
  const isProfileIncomplete = () => {
    if (!user || !isOwnProfile) return false;
    
    // Business users fill out all required info during signup - never show completion banner
    if (user.userType === 'business') {
      console.log('✅ Business user detected - NO profile completion banner');
      return false;
    }
    
    console.log('🔍 Profile completion check - userType:', user.userType);
    
    // For regular users (travelers/locals) - GLOBAL FRIENDLY REQUIREMENTS
    // These fields work for ALL countries (unlike state which doesn't exist globally)
    const hasBio = user.bio && user.bio.trim().length > 0;
    const hasGender = user.gender && user.gender.trim().length > 0;
    const hasSexualPreference = user.sexualPreference && Array.isArray(user.sexualPreference) && user.sexualPreference.length > 0;
    
    const isIncomplete = !hasBio || !hasGender || !hasSexualPreference;
    
    // Debug logging to help identify what's missing
    if (isIncomplete && process.env.NODE_ENV === 'development') {
      console.log('🔴 PROFILE INCOMPLETE:', {
        hasBio,
        bioLength: user.bio?.length || 0,
        hasGender,
        gender: user.gender,
        hasSexualPreference,
        sexualPreference: user.sexualPreference
      });
    }
    
    return isIncomplete;
  };



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
                setLocation(isNativeIOSApp() ? '/home' : '/');
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
  const profileProps: ProfilePageProps = {
    user, setLocation, isOwnProfile, shouldShowBackToChat, handleBackToChat, gradientOptions, selectedGradient, setSelectedGradient,
    setShowExpandedPhoto, uploadingPhoto, handleAvatarUpload, toast, connectionDegreeData, userVouches, travelPlans,
    openTab, hostelMatch, currentUser, handleMessage, setShowWriteReferenceModal, getMetropolitanArea,
    activeTab,
    // Use lazy-loaded data if available, otherwise fall back to bundle data for stats counts
    userConnections: userConnections.length > 0 ? userConnections : (profileBundle?.connections || []),
    photos, userTravelMemories,
    userReferences: userReferences.length > 0 ? userReferences : (profileBundle?.references || []),
    setTriggerQuickMeetup, isProfileIncomplete,
    setIsEditMode, editFormData, isEditingPublicInterests, setIsEditingPublicInterests, setActiveEditSection, setEditFormData, effectiveUserId,
    queryClient, tabRefs, loadedTabs, showConnectionFilters, setShowConnectionFilters, connectionFilters, setConnectionFilters,
    sortedUserConnections, connectionsDisplayCount, setConnectionsDisplayCount, editingConnectionNote, setEditingConnectionNote,
    connectionNoteText, setConnectionNoteText, showWriteReferenceModal, setShowReferenceForm, showReferenceForm, referenceForm,
    createReference, connectionRequests, outgoingConnectionRequests, countriesVisited, tempCountries, setTempCountries, customCountryInput, setCustomCountryInput,
    editingCountries, updateCountries, userChatrooms, chatroomsLoading, chatroomCount, setShowChatroomList, vouches, compatibilityData, eventsGoing, eventsInterested,
    commonStats,
    businessDealsLoading, businessDeals, ownerContactForm, setOwnerContactForm, editingOwnerInfo, updateOwnerContact, handleSaveOwnerContact,
    apiRequest, handleEditCountries, handleSaveCountries, handleCancelCountries, COUNTRIES_OPTIONS, GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS,
    safeGetAllActivities, getApiBaseUrl, getHometownInterests, getTravelInterests, getProfileInterests,
    MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, ALL_INTERESTS, ALL_ACTIVITIES, customInterestInput, setCustomInterestInput,
    customActivityInput, setCustomActivityInput, editingInterests, editingActivities,
    selectedPhotoIndex, setSelectedPhotoIndex, showCropModal, setShowCropModal, cropImageSrc, cropSettings, setCropSettings, isDragging,
    editingTravelPlan, setEditingTravelPlan, form, setSelectedCountry, setSelectedCity, setSelectedState, showExpandedPhoto,
    isNativeIOSApp, editTravelPlan, showLocationWidget, setShowLocationWidget, pendingLocationData, setPendingLocationData,
    isEditMode, profileForm, editProfile, onSubmitProfile, isFormReady, handleGenerateBio, isGeneratingBio,
    deletingTravelPlan, setDeletingTravelPlan, confirmDeleteTravelPlan, deleteTravelPlan, showTravelPlanDetails, setShowTravelPlanDetails,
    selectedTravelPlan, showCoverPhotoSelector, setShowCoverPhotoSelector, setUploadingPhoto, setCoverPhotoKey, authStorage, setAuthUser,
    showEditModal, setShowEditModal, editReferenceForm, editingReference, setEditingReference, updateReference,
    showPhotoUpload, setShowPhotoUpload, handleProfilePhotoUpload, showChatroomList,
    triggerQuickMeetup, showCreateDeal, setShowCreateDeal, quickDeals, setShowFullGallery, EventOrganizerHubSection,
    editingLanguages, handleEditLanguages, LANGUAGES_OPTIONS, tempLanguages, setTempLanguages, customLanguageInput, setCustomLanguageInput,
    handleSaveLanguages, handleCancelLanguages, updateLanguages,
    connectionStatus,
  };

  function AdminDashboard() {
    if (!isNearbytrav) return null;

    const now = Date.now();

    const formatRelTime = (ts: string | null) => {
      if (!ts) return 'Never';
      const diff = now - new Date(ts).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${days}d ago`;
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatJoinDate = (ts: string) => {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isCold = (u: AdminUser) => {
      if (!u.lastLogin) return true;
      return (now - new Date(u.lastLogin).getTime()) > COLD_DAYS * 86400000;
    };

    const isNewToday = (ts: string) => (now - new Date(ts).getTime()) < 86400000;
    const isNewThisWeek = (ts: string) => (now - new Date(ts).getTime()) < 7 * 86400000;

    const all = adminUsers ?? [];
    const ambassadors = all.filter(u => u.ambassadorStatus === 'active');
    const coldUsers = all.filter(u => isCold(u));
    const newToday = all.filter(u => isNewToday(u.createdAt)).length;
    const newThisWeek = all.filter(u => isNewThisWeek(u.createdAt)).length;

    const tabFiltered = adminTab === 'ambassadors' ? ambassadors
      : adminTab === 'cold' ? coldUsers
      : all;

    const searchLower = adminSearch.trim().toLowerCase();
    const filtered = searchLower
      ? tabFiltered.filter(u =>
          u.username.toLowerCase().includes(searchLower) ||
          (u.name || '').toLowerCase().includes(searchLower) ||
          (u.firstName || '').toLowerCase().includes(searchLower) ||
          (u.lastName || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower) ||
          (u.hometownCity || '').toLowerCase().includes(searchLower)
        )
      : tabFiltered;

    const typeColor: Record<string, string> = {
      traveler: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      local: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    const getUser = (u: AdminUser) => ({ ...u, ...(localUserData[u.id] || {}) });

    const saveNote = async (userId: number) => {
      setSavingNote(userId);
      try {
        const notes = noteDrafts[userId] ?? '';
        await apiRequest('PATCH', `/api/admin/users/${userId}/notes`, { notes });
        setLocalUserData(prev => ({ ...prev, [userId]: { ...prev[userId], adminNotes: notes || null } }));
      } catch (e) {
        console.error('Failed to save note', e);
      } finally {
        setSavingNote(null);
      }
    };

    const toggleAmbassador = async (u: AdminUser) => {
      const merged = getUser(u);
      const newStatus = merged.ambassadorStatus === 'active' ? 'inactive' : 'active';
      setTogglingAmbassador(u.id);
      try {
        await apiRequest('PATCH', `/api/admin/users/${u.id}/ambassador`, { status: newStatus });
        setLocalUserData(prev => ({ ...prev, [u.id]: { ...prev[u.id], ambassadorStatus: newStatus } }));
      } catch (e) {
        console.error('Failed to toggle ambassador', e);
      } finally {
        setTogglingAmbassador(null);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</CardTitle>
            </div>
            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: 'Total', value: all.length, color: 'text-gray-900 dark:text-white' },
                { label: 'Today', value: newToday, color: 'text-green-600 dark:text-green-400' },
                { label: 'This Week', value: newThisWeek, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Ambassadors', value: ambassadors.length, color: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Going Cold', value: coldUsers.length, color: 'text-red-600 dark:text-red-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg py-2 px-1">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardHeader>

          {/* Search bar */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <input
              type="text"
              placeholder="Search by username, name, email, city…"
              value={adminSearch}
              onChange={e => setAdminSearch(e.target.value)}
              className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {([
              ['all', 'All', all.length],
              ['ambassadors', 'Ambassadors', ambassadors.length],
              ['cold', `Cold (${COLD_DAYS}d+)`, coldUsers.length],
            ] as [string, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setAdminTab(key as any)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  adminTab === key
                    ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label} <span className="ml-1 opacity-60">({count})</span>
              </button>
            ))}
          </div>

          <CardContent className="p-0">
            {adminLoading ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Loading users…</div>
            ) : !filtered.length ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No users in this view.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[600px]">
                {filtered.map((rawU) => {
                  const u = getUser(rawU);
                  const isExpanded = expandedUserId === u.id;
                  const noteDraft = noteDrafts[u.id] ?? (u.adminNotes || '');
                  const cold = isCold(rawU);

                  return (
                    <div key={u.id}>
                      {/* Main row */}
                      <div
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/50 transition-colors ${cold && adminTab !== 'cold' ? 'border-l-2 border-red-300 dark:border-red-700' : ''}`}
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                      >
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          {u.profileImage ? <AvatarImage src={u.profileImage} alt={u.username} /> : null}
                          <AvatarFallback className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {u.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{u.username}</span>
                            {(u.firstName || u.lastName) ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400">· {[u.firstName, u.lastName].filter(Boolean).join(' ')}</span>
                            ) : u.name && u.name !== u.username && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">· {u.name}</span>
                            )}
                            {u.ambassadorStatus === 'active' && (
                              <Badge className="text-[10px] py-0 px-1.5 h-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">Ambassador</Badge>
                            )}
                            {u.isAdmin && (
                              <Badge className="text-[10px] py-0 px-1.5 h-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0">Admin</Badge>
                            )}
                            {(u.referralCount ?? 0) > 0 && (
                              <Badge className="text-[10px] py-0 px-1.5 h-4 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-0">
                                {u.referralCount} referral{u.referralCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {u.adminNotes && (
                              <span className="text-[10px] text-orange-500" title={u.adminNotes}>📝</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeColor[u.userType] || 'bg-gray-100 dark:bg-gray-800 text-gray-700'}`}>
                              {u.userType}
                            </span>
                            {u.hometownCity && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{u.hometownCity}{u.hometownState ? `, ${u.hometownState}` : ''}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className={`text-xs font-medium ${cold ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatRelTime(u.lastLogin)}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">joined {formatJoinDate(u.createdAt)}</div>
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{u.email}</span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <button
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => { e.stopPropagation(); window.open(`/profile/${u.id}`, '_blank'); }}
                            >
                              View profile
                            </button>
                          </div>

                          {/* Notes */}
                          <div className="mb-3">
                            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 block">Private notes</label>
                            <textarea
                              className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                              rows={2}
                              placeholder='e.g. "Met at Playa del Rey meetup, very engaged"'
                              value={noteDraft}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setNoteDrafts(prev => ({ ...prev, [u.id]: e.target.value }))}
                            />
                            <button
                              className="mt-1 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 rounded-md font-medium disabled:opacity-50"
                              disabled={savingNote === u.id}
                              onClick={(e) => { e.stopPropagation(); saveNote(u.id); }}
                            >
                              {savingNote === u.id ? 'Saving…' : 'Save note'}
                            </button>
                          </div>

                          {/* Ambassador toggle */}
                          <div className="flex items-center gap-2">
                            <button
                              className={`text-xs px-3 py-1 rounded-md font-medium border transition-colors disabled:opacity-50 ${
                                u.ambassadorStatus === 'active'
                                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              disabled={togglingAmbassador === u.id}
                              onClick={(e) => { e.stopPropagation(); toggleAmbassador(rawU); }}
                            >
                              {togglingAmbassador === u.id ? 'Updating…'
                                : u.ambassadorStatus === 'active' ? '★ Remove Ambassador'
                                : '☆ Make Ambassador'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-0">
      <ProfileHeader {...profileProps} />
      <ProfileTabs {...profileProps} notificationPrefs={isOwnProfile ? <NotificationPreferencesCompact currentUserId={currentUser?.id} /> : null} referralWidget={<ReferralTrackingWidget profileUserId={effectiveUserId!} />} />
      {isNearbytrav && <AdminDashboard />}
      <ProfileDialogs {...profileProps} />

      {/* Avatar Crop/Reposition Modal */}
      {showAvatarCropModal && avatarCropSrc && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={() => setShowAvatarCropModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-[90vw] mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-1 text-gray-900 dark:text-white">Position Your Photo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Drag to reposition</p>

            {/* Circular crop viewport */}
            <div
              className="relative mx-auto rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none"
              style={{ width: 240, height: 240, touchAction: 'none' }}
              onPointerDown={(e) => {
                avatarCropDragging.current = true;
                avatarCropDragStart.current = { x: e.clientX, y: e.clientY, ox: avatarCropOffset.x, oy: avatarCropOffset.y };
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!avatarCropDragging.current) return;
                const dx = e.clientX - avatarCropDragStart.current.x;
                const dy = e.clientY - avatarCropDragStart.current.y;
                setAvatarCropOffset({ x: avatarCropDragStart.current.ox + dx, y: avatarCropDragStart.current.oy + dy });
              }}
              onPointerUp={() => { avatarCropDragging.current = false; }}
              onPointerCancel={() => { avatarCropDragging.current = false; }}
            >
              <img
                src={avatarCropSrc}
                alt="Crop preview"
                draggable={false}
                className="absolute"
                style={{
                  width: `${avatarCropScale * 100}%`,
                  height: `${avatarCropScale * 100}%`,
                  objectFit: 'cover',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${avatarCropOffset.x}px), calc(-50% + ${avatarCropOffset.y}px))`,
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 mt-4 px-2">
              <span className="text-xs text-gray-500">−</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={avatarCropScale}
                onChange={(e) => setAvatarCropScale(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-xs text-gray-500">+</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setShowAvatarCropModal(false); setAvatarCropSrc(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvatarCrop}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
                  onClick={() => { window.location.href = isNativeIOSApp() ? '/home' : '/'; }}
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
  const totalEvents = (userEvents as any[]).length;
  const totalRSVPs = (userEvents as any[]).reduce((sum: number, event: any) => sum + (Number(event.participantCount) || 0), 0);
  const upcomingEvents = (userEvents as any[]).filter((event: any) => new Date(event.date) >= new Date()).length;
  const avgRSVPs = totalEvents > 0 ? Math.round((totalRSVPs / totalEvents) * 10) / 10 : 0;

  // Social sharing is handled via EventShareModal (copy/share/download options)

  // Duplicate event function
  const duplicateEvent = (event: any) => {
    const duplicateData = {
      title: `${event.title} (Copy)`,
      description: event.description,
      venueName: event.venue || event.venueName,
      street: event.streetAddress || event.street,
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
                className="cta-gradient w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 [&]:text-black dark:text-white [&>*]:text-black dark:text-white dark:[&]:text-white dark:[&>*]:text-white"
              >
                <Plus className="w-4 h-4 mr-2 text-black dark:text-white" />
                <span className="text-black dark:text-white">Create New Event</span>
              </Button>
            </div>
          </div>
          
          {/* Event Organizer Quick Stats */}
          {totalEvents > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
              <div className="text-center min-w-[110px] flex-shrink-0 sm:min-w-0">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {totalEvents}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Events</div>
              </div>
              <div className="text-center min-w-[110px] flex-shrink-0 sm:min-w-0">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {totalRSVPs}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total RSVPs</div>
              </div>
              <div className="text-center min-w-[110px] flex-shrink-0 sm:min-w-0">
                <div className="text-lg sm:text-xl font-bold text-orange-600">
                  {upcomingEvents}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Upcoming</div>
              </div>
              <div className="text-center min-w-[110px] flex-shrink-0 sm:min-w-0">
                <div className="text-lg sm:text-xl font-bold text-purple-600">
                  {avgRSVPs}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Avg RSVPs</div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Events List */}
        <div className="p-4 sm:p-6">
          {(userEvents as any[]).length > 0 ? (
            <div className="space-y-4">
              {(userEvents as any[]).map((event: any) => (
                <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{event.description}</p>
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
                      <EventShareModal
                        event={{
                          id: event.id,
                          title: event.title,
                          description: event.description,
                          date: event.date,
                          startTime: (event as any).startTime,
                          endTime: (event as any).endTime,
                          venueName: (event as any).venueName,
                          venue: (event as any).venue,
                          city: event.city,
                          state: event.state,
                          country: event.country,
                          category: event.category,
                        }}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-3"
                            title="Share event"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateEvent(event)}
                        className="text-xs h-8 px-3 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 border-0"
                        style={undefined}
                        title="Duplicate this event"
                      >
                        <Calendar className="w-3 h-3 mr-1 text-black dark:text-white" />
                        <span className="text-black dark:text-white">Duplicate</span>
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
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 [&]:text-black dark:text-white [&>*]:text-black dark:text-white dark:[&]:text-white dark:[&>*]:text-white"
              >
                <Plus className="w-4 h-4 mr-2 text-black dark:text-white" />
                <span className="text-black dark:text-white">Create Your First Event</span>
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
