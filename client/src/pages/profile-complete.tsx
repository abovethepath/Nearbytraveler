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
import { compressPhotoAdaptive } from "@/utils/photoCompression";
import { AdaptiveCompressionIndicator } from "@/components/adaptive-compression-indicator";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import FriendReferralWidget from "@/components/friend-referral-widget";

import ReferencesWidgetNew from "@/components/references-widget-new";
import { VouchWidget } from "@/components/vouch-widget";
import { LocationSharingSection } from "@/components/LocationSharingSection";
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
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "../../../shared/base-options";

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

// Add missing constants
const INTERESTS_OPTIONS = getAllInterests();
const ACTIVITIES_OPTIONS = getAllActivities();
const EVENTS_OPTIONS = getAllEvents();

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
                  <div key={item} className={pillType === 'pill-interests' ? 'inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0 appearance-none select-none' : 'inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-orange-500 text-white border-0 appearance-none select-none'}>
                    {item}
                  </div>
                ))}
                {selected.length > maxDisplay && (
                  <span className="text-xs text-muted-foreground">
                    +{selected.length - maxDisplay} more
                  </span>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {allOptions.map((item) => (
              <CommandItem
                key={item}
                onSelect={() => handleSelect(item)}
                className="flex items-center gap-2"
              >
                <Check 
                  className={`h-4 w-4 ${selected.includes(item) ? 'opacity-100' : 'opacity-0'}`} 
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

export default function ProfileComplete({ userId: propUserId }: { userId?: string }) {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [selectedPhotoForUpload, setSelectedPhotoForUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showInviteCodeField, setShowInviteCodeField] = useState(false);
  const [selectedReference, setSelectedReference] = useState('');
  const [selectedReferenceType, setSelectedReferenceType] = useState('general');
  const [referenceContent, setReferenceContent] = useState('');
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [editingReference, setEditingReference] = useState<any>(null);
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  
  // Determine profile owner
  const isOwnProfile = !propUserId || propUserId === user?.id?.toString();
  const profileUserId = propUserId ? parseInt(propUserId, 10) : user?.id;

  console.log('🔍 PROFILE DEBUG:', {
    propUserId,
    userIdFromContext: user?.id,
    profileUserId,
    isOwnProfile,
    userFromContext: user
  });

  // Travel information from user's travel plans
  const { data: travelPlansWithDetails = [] } = useQuery({
    queryKey: [`/api/travel-plans-with-itineraries/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Get user data for the profile
  const { data: profileUser } = useQuery<User>({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: !!profileUserId && !isOwnProfile,
  });

  // Use own user data if viewing own profile, otherwise use fetched profile user
  const displayUser = isOwnProfile ? user : profileUser;

  // Additional queries for profile data
  const { data: countriesVisited = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/passport-stamps`],
    enabled: !!profileUserId,
  });

  const { data: connections = [] } = useQuery({
    queryKey: [`/api/connections/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/photos`],
    enabled: !!profileUserId,
  });

  const { data: references = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/references`],
    enabled: !!profileUserId,
  });

  const { data: vouches = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/vouches`],
    enabled: !!profileUserId,
  });

  const { data: vouchesGiven = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/vouches-given`],
    enabled: !!profileUserId,
  });

  const { data: vouchNetwork } = useQuery({
    queryKey: [`/api/users/${profileUserId}/vouch-network`],
    enabled: !!profileUserId,
  });

  const { data: chatroomParticipation = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/chatroom-participation`],
    enabled: !!profileUserId,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/all-events`],
    enabled: !!profileUserId,
  });

  const { data: organizedEvents = [] } = useQuery({
    queryKey: [`/api/events/organizer/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: cityInterests = [] } = useQuery({
    queryKey: [`/api/user-city-interests/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: eventInterests = [] } = useQuery({
    queryKey: [`/api/user-event-interests/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: memories = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/travel-memories`],
    enabled: !!profileUserId,
  });

  const { data: photoAlbums = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/photo-albums`],
    enabled: !!profileUserId,
  });

  // Calculate age if date of birth is available
  const userAge = displayUser?.dateOfBirth ? calculateAge(displayUser.dateOfBirth) : null;
  const ageDisplay = displayUser?.ageVisible && userAge ? ` (${userAge})` : '';

  // Check if user is currently traveling
  const currentTravelPlan = travelPlansWithDetails?.find(plan => {
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    const today = new Date();
    return today >= startDate && today <= endDate;
  });

  const isCurrentlyTraveling = !!currentTravelPlan;
  const currentTravelDestination = currentTravelPlan ? getCurrentTravelDestination(currentTravelPlan) : null;

  // Profile completion calculation
  const profileCompletionPercentage = useMemo(() => {
    if (!displayUser) return 0;
    
    let completed = 0;
    const total = displayUser.userType === 'business' ? 10 : 12;
    
    // Basic info
    if (displayUser.profileImageUrl) completed++;
    if (displayUser.bio) completed++;
    if (displayUser.hometownCity) completed++;
    
    // Interests/Activities  
    if (displayUser.interests?.length) completed++;
    if (displayUser.activities?.length) completed++;
    
    if (displayUser.userType === 'business') {
      // Business specific
      if (displayUser.businessName) completed++;
      if (displayUser.businessDescription) completed++;
      if (displayUser.businessType) completed++;
      if (displayUser.phoneNumber) completed++;
      if (displayUser.websiteUrl) completed++;
    } else {
      // User specific
      if (displayUser.dateOfBirth) completed++;
      if (displayUser.gender) completed++;
      if (displayUser.languages?.length) completed++;
      if (displayUser.travelStyle?.length) completed++;
      if (photos.length > 0) completed++;
      if (displayUser.events?.length) completed++;
      if (travelPlansWithDetails.length > 0) completed++;
    }
    
    return Math.round((completed / total) * 100);
  }, [displayUser, photos.length, travelPlansWithDetails.length]);

  // Create form with appropriate schema based on user type
  const form = useForm({
    resolver: zodResolver(getDynamicProfileSchema(displayUser?.userType || 'traveler')),
    defaultValues: {
      bio: displayUser?.bio || '',
      hometownCity: displayUser?.hometownCity || '',
      hometownState: displayUser?.hometownState || '',
      hometownCountry: displayUser?.hometownCountry || '',
      dateOfBirth: displayUser?.dateOfBirth || '',
      ageVisible: displayUser?.ageVisible ?? true,
      gender: displayUser?.gender || '',
      sexualPreference: Array.isArray(displayUser?.sexualPreference) ? displayUser.sexualPreference : [],
      sexualPreferenceVisible: displayUser?.sexualPreferenceVisible ?? false,
      secretActivities: displayUser?.secretActivities || '',
      travelingWithChildren: displayUser?.travelingWithChildren || false,
      childrenAges: displayUser?.childrenAges || '',
      isVeteran: displayUser?.isVeteran || false,
      isActiveDuty: displayUser?.isActiveDuty || false,
      travelWhy: displayUser?.travelWhy || '',
      travelHow: displayUser?.travelHow || '',
      travelBudget: displayUser?.travelBudget || '',
      travelGroup: displayUser?.travelGroup || '',
      travelStyle: Array.isArray(displayUser?.travelStyle) ? displayUser.travelStyle : [],
      // Business fields
      businessName: displayUser?.businessName || '',
      businessDescription: displayUser?.businessDescription || '',
      businessType: displayUser?.businessType || '',
      location: displayUser?.location || '',
      city: displayUser?.city || '',
      state: displayUser?.state || '',
      country: displayUser?.country || '',
      streetAddress: displayUser?.streetAddress || '',
      zipCode: displayUser?.zipCode || '',
      phoneNumber: displayUser?.phoneNumber || '',
      websiteUrl: displayUser?.websiteUrl || '',
      interests: Array.isArray(displayUser?.interests) ? displayUser.interests : [],
      activities: Array.isArray(displayUser?.activities) ? displayUser.activities : [],
      events: Array.isArray(displayUser?.events) ? displayUser.events : [],
      customInterests: (displayUser as ExtendedUser)?.customInterests || '',
      customActivities: (displayUser as ExtendedUser)?.customActivities || '',
      customEvents: (displayUser as ExtendedUser)?.customEvents || '',
      isMinorityOwned: (displayUser as ExtendedUser)?.isMinorityOwned || false,
      isFemaleOwned: (displayUser as ExtendedUser)?.isFemaleOwned || false,
      isLGBTQIAOwned: (displayUser as ExtendedUser)?.isLGBTQIAOwned || false,
      showMinorityOwned: (displayUser as ExtendedUser)?.showMinorityOwned ?? true,
      showFemaleOwned: (displayUser as ExtendedUser)?.showFemaleOwned ?? true,
      showLGBTQIAOwned: (displayUser as ExtendedUser)?.showLGBTQIAOwned ?? true,
    }
  });

  // Update form when displayUser changes
  useEffect(() => {
    if (displayUser) {
      form.reset({
        bio: displayUser.bio || '',
        hometownCity: displayUser.hometownCity || '',
        hometownState: displayUser.hometownState || '',
        hometownCountry: displayUser.hometownCountry || '',
        dateOfBirth: displayUser.dateOfBirth || '',
        ageVisible: displayUser.ageVisible ?? true,
        gender: displayUser.gender || '',
        sexualPreference: Array.isArray(displayUser.sexualPreference) ? displayUser.sexualPreference : [],
        sexualPreferenceVisible: displayUser.sexualPreferenceVisible ?? false,
        secretActivities: displayUser.secretActivities || '',
        travelingWithChildren: displayUser.travelingWithChildren || false,
        childrenAges: displayUser.childrenAges || '',
        isVeteran: displayUser.isVeteran || false,
        isActiveDuty: displayUser.isActiveDuty || false,
        travelWhy: displayUser.travelWhy || '',
        travelHow: displayUser.travelHow || '',
        travelBudget: displayUser.travelBudget || '',
        travelGroup: displayUser.travelGroup || '',
        travelStyle: Array.isArray(displayUser.travelStyle) ? displayUser.travelStyle : [],
        // Business fields
        businessName: displayUser.businessName || '',
        businessDescription: displayUser.businessDescription || '',
        businessType: displayUser.businessType || '',
        location: displayUser.location || '',
        city: displayUser.city || '',
        state: displayUser.state || '',
        country: displayUser.country || '',
        streetAddress: displayUser.streetAddress || '',
        zipCode: displayUser.zipCode || '',
        phoneNumber: displayUser.phoneNumber || '',
        websiteUrl: displayUser.websiteUrl || '',
        interests: Array.isArray(displayUser.interests) ? displayUser.interests : [],
        activities: Array.isArray(displayUser.activities) ? displayUser.activities : [],
        events: Array.isArray(displayUser.events) ? displayUser.events : [],
        customInterests: (displayUser as ExtendedUser)?.customInterests || '',
        customActivities: (displayUser as ExtendedUser)?.customActivities || '',
        customEvents: (displayUser as ExtendedUser)?.customEvents || '',
        isMinorityOwned: (displayUser as ExtendedUser)?.isMinorityOwned || false,
        isFemaleOwned: (displayUser as ExtendedUser)?.isFemaleOwned || false,
        isLGBTQIAOwned: (displayUser as ExtendedUser)?.isLGBTQIAOwned || false,
        showMinorityOwned: (displayUser as ExtendedUser)?.showMinorityOwned ?? true,
        showFemaleOwned: (displayUser as ExtendedUser)?.showFemaleOwned ?? true,
        showLGBTQIAOwned: (displayUser as ExtendedUser)?.showLGBTQIAOwned ?? true,
      });
    }
  }, [displayUser, form]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔄 Updating profile with data:', data);
      const response = await apiRequest(`/api/users/${profileUserId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
      setEditMode(false);
    },
    onError: (error) => {
      console.error('❌ Profile update error:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      try {
        const compressedFile = await compressPhotoAdaptive(file);
        const formData = new FormData();
        formData.append('photo', compressedFile);
        
        const response = await fetch(`/api/users/${profileUserId}/photos/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        return response.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/photos`] });
      setSelectedPhotoForUpload(null);
      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to your album.",
      });
    },
    onError: (error) => {
      console.error('❌ Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsProfileUploading(true);
      try {
        const compressedFile = await compressPhotoAdaptive(file);
        const formData = new FormData();
        formData.append('profileImage', compressedFile);
        
        const response = await fetch(`/api/users/${profileUserId}/profile-image`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Profile image upload failed');
        }
        
        return response.json();
      } finally {
        setIsProfileUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Profile picture updated!",
        description: "Your new profile picture has been set.",
      });
    },
    onError: (error) => {
      console.error('❌ Profile image upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem updating your profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add country to passport stamps
  const addCountryMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await apiRequest(`/api/users/${profileUserId}/passport-stamps`, {
        method: 'POST',
        body: JSON.stringify({ country }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/passport-stamps`] });
      setNewCountry('');
      setShowCountryInput(false);
      toast({
        title: "Country added!",
        description: "Your travel destination has been added to your passport.",
      });
    },
    onError: (error) => {
      console.error('❌ Add country error:', error);
      toast({
        title: "Add failed",
        description: "There was a problem adding your country. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove country from passport stamps
  const removeCountryMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await apiRequest(`/api/users/${profileUserId}/passport-stamps/${encodeURIComponent(country)}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/passport-stamps`] });
      toast({
        title: "Country removed",
        description: "The country has been removed from your passport.",
      });
    },
    onError: (error) => {
      console.error('❌ Remove country error:', error);
      toast({
        title: "Remove failed",
        description: "There was a problem removing the country. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add reference mutation
  const addReferenceMutation = useMutation({
    mutationFn: async (referenceData: any) => {
      const response = await apiRequest(`/api/users/${profileUserId}/references`, {
        method: 'POST',
        body: JSON.stringify(referenceData),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/references`] });
      setSelectedReference('');
      setReferenceContent('');
      setQuickTags([]);
      setShowReferenceForm(false);
      toast({
        title: "Reference added!",
        description: "Your reference has been successfully submitted.",
      });
    },
    onError: (error) => {
      console.error('❌ Add reference error:', error);
      toast({
        title: "Reference failed",
        description: "There was a problem adding your reference. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update reference mutation
  const updateReferenceMutation = useMutation({
    mutationFn: async ({ referenceId, referenceData }: { referenceId: number, referenceData: any }) => {
      const response = await apiRequest(`/api/users/${profileUserId}/references/${referenceId}`, {
        method: 'PUT',
        body: JSON.stringify(referenceData),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/references`] });
      setEditingReference(null);
      setSelectedReference('');
      setReferenceContent('');
      setQuickTags([]);
      setShowReferenceForm(false);
      toast({
        title: "Reference updated!",
        description: "Your reference has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('❌ Update reference error:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your reference. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete reference mutation
  const deleteReferenceMutation = useMutation({
    mutationFn: async (referenceId: number) => {
      const response = await apiRequest(`/api/users/${profileUserId}/references/${referenceId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/references`] });
      toast({
        title: "Reference deleted",
        description: "The reference has been removed.",
      });
    },
    onError: (error) => {
      console.error('❌ Delete reference error:', error);
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the reference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log('📝 Form submit data:', data);
    updateProfileMutation.mutate(data);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfileImageMutation.mutate(file);
    }
  };

  const handleAddCountry = () => {
    if (newCountry.trim()) {
      addCountryMutation.mutate(newCountry.trim());
    }
  };

  const handleRemoveCountry = (country: string) => {
    removeCountryMutation.mutate(country);
  };

  const handleAddReference = () => {
    if (selectedReference && referenceContent.trim()) {
      const referenceData = {
        revieweeId: parseInt(selectedReference),
        experience: 'positive' as const,
        content: referenceContent,
        type: selectedReferenceType,
        quickTags: quickTags
      };
      
      if (editingReference) {
        updateReferenceMutation.mutate({
          referenceId: editingReference.id,
          referenceData
        });
      } else {
        addReferenceMutation.mutate(referenceData);
      }
    }
  };

  const handleEditReference = (reference: any) => {
    setEditingReference(reference);
    setSelectedReference(reference.revieweeId.toString());
    setSelectedReferenceType(reference.type || 'general');
    setReferenceContent(reference.content || '');
    setQuickTags(reference.quickTags || []);
    setShowReferenceForm(true);
  };

  const handleDeleteReference = (referenceId: number) => {
    if (confirm('Are you sure you want to delete this reference?')) {
      deleteReferenceMutation.mutate(referenceId);
    }
  };

  const handleQuickTagToggle = (tag: string) => {
    setQuickTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Show loading state while user data is loading
  if (!displayUser && profileUserId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show not found if user doesn't exist
  if (!displayUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/')} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Helper functions for displaying profile information
  const getUserTypeDisplay = (userType: string) => {
    const typeMap: Record<string, string> = {
      'traveler': 'Nearby Traveler',
      'local': 'Nearby Local',
      'business': 'Business',
    };
    return typeMap[userType] || userType;
  };

  const getLocationDisplay = (user: User) => {
    if (user.userType === 'business') {
      return user.city && user.state ? `${user.city}, ${user.state}` : user.location || 'Location not specified';
    } else {
      return user.hometownCity && user.hometownState 
        ? `${user.hometownCity}, ${user.hometownState}` 
        : 'Hometown not specified';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Mobile Back Button */}
      <div className="block md:hidden mb-4">
        <UniversalBackButton />
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <SimpleAvatar 
                  src={displayUser.profileImageUrl} 
                  fallback={displayUser.username?.[0] || displayUser.businessName?.[0] || '?'}
                  className="w-24 h-24 md:w-32 md:h-32"
                />
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2">
                    <label htmlFor="profile-image-upload" className="cursor-pointer">
                      <div className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                    {isProfileUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">
                      {displayUser.userType === 'business' ? displayUser.businessName : displayUser.username}
                      {ageDisplay}
                    </h1>
                    
                    {/* CRITICAL: Always show hometown for locals/travelers */}
                    <div className="mt-1 space-y-1">
                      {displayUser.userType !== 'business' && (
                        <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                          {getUserTypeDisplay(displayUser.userType)} • {getLocationDisplay(displayUser)}
                        </p>
                      )}
                      
                      {/* Show travel destination if currently traveling */}
                      {isCurrentlyTraveling && currentTravelDestination && displayUser.userType !== 'business' && (
                        <p className="text-lg text-green-600 dark:text-green-400 font-medium">
                          Nearby Traveler • {currentTravelDestination}
                        </p>
                      )}
                      
                      {/* Business location */}
                      {displayUser.userType === 'business' && (
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          {getLocationDisplay(displayUser)}
                        </p>
                      )}
                    </div>

                    {/* Profile completion for own profile */}
                    {isOwnProfile && profileCompletionPercentage < 100 && (
                      <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            Profile {profileCompletionPercentage}% complete
                          </span>
                        </div>
                        <div className="mt-2 bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${profileCompletionPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isOwnProfile ? (
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        data-testid="button-edit-profile"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {editMode ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setLocation(`/messages?user=${displayUser.id}`)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          data-testid="button-message-user"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          onClick={() => setLocation(`/connect/${displayUser.id}`)}
                          variant="outline"
                          data-testid="button-connect-user"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {displayUser.bio && (
                  <div className="mt-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {displayUser.bio}
                    </p>
                  </div>
                )}

                {/* Interests Pills */}
                {displayUser.interests && displayUser.interests.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {displayUser.interests.slice(0, 8).map((interest: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {interest}
                        </span>
                      ))}
                      {displayUser.interests.length > 8 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          +{displayUser.interests.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Mode Form */}
      {editMode && isOwnProfile && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>About Me</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell others about yourself..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {displayUser.userType !== 'business' && (
                    <>
                      <FormField
                        control={form.control}
                        name="hometownCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hometown City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hometownState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hometown State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state or province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hometownCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hometown Country</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES_OPTIONS.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                {...getDateInputConstraints()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GENDER_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {displayUser.userType === 'business' && (
                    <>
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BUSINESS_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
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
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state or province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="www.yourbusiness.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                {/* Interests */}
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={INTERESTS_OPTIONS}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Select interests"
                          maxDisplay={5}
                          pillType="interest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Activities */}
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activities</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={ACTIVITIES_OPTIONS}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Select activities"
                          maxDisplay={5}
                          pillType="activity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="references">Reviews</TabsTrigger>
          <TabsTrigger value="travel">
            {displayUser.userType === 'business' ? 'Events' : 'Travel'}
          </TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          {/* Things I Want To Do Section */}
          <ThingsIWantToDoSection 
            userId={profileUserId || 0} 
            isOwnProfile={isOwnProfile}
          />

          {/* What You Have In Common - only for other users */}
          {!isOwnProfile && (
            <WhatYouHaveInCommon 
              userId={profileUserId || 0}
              currentUserId={user?.id || 0}
            />
          )}

          {/* Friend Referral Widget - only for own profile */}
          {isOwnProfile && (
            <FriendReferralWidget />
          )}

          {/* Quick Meetup Widget - only for own profile */}
          {isOwnProfile && displayUser.userType !== 'business' && (
            <QuickMeetupWidget />
          )}

          {/* Quick Deals Widget - only for own profile and business */}
          {isOwnProfile && displayUser.userType === 'business' && (
            <QuickDealsWidget />
          )}

          {/* Referral Widget - only for own profile */}
          {isOwnProfile && (
            <ReferralWidget />
          )}

          {/* Block User Button - only for other users */}
          {!isOwnProfile && (
            <div className="flex justify-end">
              <BlockUserButton targetUserId={profileUserId || 0} />
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-6">
          {/* Photo Albums */}
          <PhotoAlbumWidget 
            userId={profileUserId || 0}
            isOwnProfile={isOwnProfile}
          />

          {/* Customer Uploaded Photos for businesses */}
          {displayUser?.userType === 'business' && (
            <CustomerUploadedPhotos 
              businessId={profileUserId || 0}
              isOwnProfile={isOwnProfile}
            />
          )}
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references" className="space-y-6">
          {/* References Section */}
          <ReferencesWidgetNew 
            userId={profileUserId || 0}
            isOwnProfile={isOwnProfile}
          />

          {/* Vouch Widget */}
          <VouchWidget 
            userId={profileUserId || 0}
            isOwnProfile={isOwnProfile}
            currentUserId={user?.id || 0}
          />
        </TabsContent>

        {/* Travel/Events Tab */}
        <TabsContent value="travel" className="space-y-6">
          {displayUser?.userType === 'business' ? (
            /* Business Events Widget */
            <BusinessEventsWidget 
              businessId={profileUserId || 0}
              isOwnProfile={isOwnProfile}
            />
          ) : (
            <>
              {/* Travel Itinerary */}
              <TravelItinerary 
                userId={profileUserId || 0}
                isOwnProfile={isOwnProfile}
              />

              {/* World Map */}
              <WorldMap userId={profileUserId || 0} />

              {/* Location Sharing Section - only for own profile */}
              {isOwnProfile && (
                <LocationSharingSection />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}