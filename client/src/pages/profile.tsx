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
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";



import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { ConnectionsWidget } from "@/components/ConnectionsWidget";
import { LanguagesWidget } from "@/components/LanguagesWidget";
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
                  <div key={item} className={pillType === 'pill-interests' ? 'inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0 appearance-none select-none' : pillType === 'pill-activities' ? 'inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-green-500 text-white border-0 appearance-none select-none' : 'inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-purple-500 text-white border-0 appearance-none select-none'}>
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
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [deletingTravelPlan, setDeletingTravelPlan] = useState<TravelPlan | null>(null);
  const [selectedTravelPlan, setSelectedTravelPlan] = useState<TravelPlan | null>(null);
  const [showTravelPlanDetails, setShowTravelPlanDetails] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showChatroomList, setShowChatroomList] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  
  // State for expanded interests in travel plans
  const [expandedPlanInterests, setExpandedPlanInterests] = useState<Set<number>>(new Set());

  
  // Edit mode states for individual widgets
  const [editingInterests, setEditingInterests] = useState(false);
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
    privateInterests: [] as string[],
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
  const isOwnProfile = propUserId ? (parseInt(propUserId.toString()) === currentUser?.id) : true;
  
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
    parsedResult: parseInt(propUserId?.toString() || '0') === currentUser?.id
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
    
    // PRIORITY 1: Check current travel plans for active trips
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && user.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = user.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return "traveler";
      }
    }
    
    // PRIORITY 2: Fallback to old travel fields for backwards compatibility
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
    
    // PRIORITY 3: Default based on user type
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
      
      // Initialize temp values for editing
      setTempInterests(user.interests || []);
      setTempActivities(user.activities || []);
      setTempEvents(user.events || []);
      
      // Initialize editFormData with current user preferences
      setEditFormData({
        interests: user.interests || [],
        privateInterests: user.privateInterests || [],
        activities: user.activities || [],
        events: user.events || []
      });
      
      // Reset form with user type-specific data
      if (user.userType === 'business') {
        // Extract custom entries from the arrays (entries not in predefined lists)
        const customInterests = (user.interests || [])
          .filter((item: string) => !getAllInterests().includes(item))
          .join(', ');
        const customActivities = (user.activities || [])
          .filter((item: string) => !getAllActivities().includes(item))
          .join(', ');
        const customEvents = (user.events || [])
          .filter((item: string) => !getAllEvents().includes(item))
          .join(', ');
        
        // Only include predefined entries in the checkbox arrays
        const predefinedInterests = (user.interests || [])
          .filter((item: string) => getAllInterests().includes(item));
        const predefinedActivities = (user.activities || [])
          .filter((item: string) => getAllActivities().includes(item));
        const predefinedEvents = (user.events || [])
          .filter((item: string) => getAllEvents().includes(item));
        
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
          // customInterests: (user as any).customInterests || (user as any).custom_interests || "",
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
          .filter((item: string) => !getAllInterests().includes(item))
          .join(', ');
        const customActivities = (user.activities || [])
          .filter((item: string) => !getAllActivities().includes(item))
          .join(', ');
        const customEvents = (user.events || [])
          .filter((item: string) => !getAllEvents().includes(item))
          .join(', ');
        
        const predefinedInterests = (user.interests || [])
          .filter((item: string) => getAllInterests().includes(item));
        const predefinedActivities = (user.activities || [])
          .filter((item: string) => getAllActivities().includes(item));
        const predefinedEvents = (user.events || [])
          .filter((item: string) => getAllEvents().includes(item));
        
        profileForm.reset({
          bio: user.bio || "",
          businessName: (user as any).business_name || (user as any).businessName || "",
          businessDescription: (user as any).business_description || (user as any).businessDescription || "",
          businessType: (user as any).business_type || (user as any).businessType || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
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
        formData.interests = [...(formData.interests || []).filter((item: string) => getAllInterests().includes(item)), ...customInterestsList];
      }
      
      // Process custom activities
      if (formData.customActivities) {
        const customActivitiesList = formData.customActivities.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        formData.activities = [...(formData.activities || []).filter((item: string) => getAllActivities().includes(item)), ...customActivitiesList];
      }
      
      // Process custom events
      if (formData.customEvents) {
        const customEventsList = formData.customEvents.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        formData.events = [...(formData.events || []).filter((item: string) => getAllEvents().includes(item)), ...customEventsList];
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
    
      {/* PROFILE HEADER - Clean Airbnb Style */}
      <section className="relative -mt-px isolate w-full bg-white dark:bg-gray-900 px-3 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 border-b border-gray-100 dark:border-gray-800">

        <div className="max-w-7xl mx-auto">
          {/* allow wrapping so CTAs drop below on small screens */}
          <div className="flex flex-row flex-wrap items-start gap-4 sm:gap-6">

            {/* Avatar + camera - Clean Modern Style */}
            <div className="relative flex-shrink-0">
              <div className="rounded-full bg-gray-50 dark:bg-gray-800 ring-2 ring-gray-100 dark:ring-gray-700 shadow-sm overflow-hidden">
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
                               bg-black hover:bg-gray-800 text-white shadow-md ring-2 ring-white dark:ring-gray-900 z-10"
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
                <div className="space-y-2 w-full mt-2">
                  <h1 className="text-2xl sm:text-4xl font-bold text-black dark:text-white">
                    {user.businessName || user.name || `@${user.username}`}
                  </h1>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium bg-black dark:bg-white dark:text-black text-white">
                      Nearby Business
                    </span>
                    {user.businessType && <span className="text-gray-600 dark:text-gray-300">• {user.businessType}</span>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 w-full mt-2">
                  {(() => {
                    const hometown = user.hometownCity ? 
                      `${user.hometownCity}${user.hometownState ? `, ${user.hometownState}` : ''}${user.hometownCountry ? `, ${user.hometownCountry}` : ''}` :
                      'Unknown';
                    
                    return (
                      <>
                        <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white break-all">@{user.username}</h1>
                        
                        {/* FORCE SHOW BOTH when user has travel plans */}
                        {(() => {
                          // Wait for ALL data to load before checking travel status (same as event discovery)
                          if (!effectiveUserId || isLoadingTravelPlans || userLoading || !user) {
                            return (
                              <div className="flex items-center gap-2 text-lg font-medium text-gray-600 dark:text-gray-300">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <span>Loading status...</span>
                              </div>
                            );
                          }
                          
                          // Use the corrected travel detection function that checks dates properly
                          const currentDestination = getCurrentTravelDestination(travelPlans || []);
                          
                          if (currentDestination) {
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                                  <MapPin className="w-5 h-5 text-gray-500" />
                                  <span>NEARBY LOCAL {hometown}</span>
                                </div>
                                <div className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                                  <Plane className="w-5 h-5 text-gray-500" />
                                  <span>NEARBY TRAVELER {currentDestination}</span>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                <span>NEARBY LOCAL {hometown}</span>
                              </div>
                            );
                          }
                        })()}
                      </>
                    );
                  })()}

                  {/* Stats */}
                  <div className="flex items-center flex-wrap gap-4 text-sm font-medium w-full mt-3">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">🌍 {countriesVisited?.length || 0} countries</span>
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">⭐ {references?.length || 0} references</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTAs — wrap on mobile */}
            {!isOwnProfile ? (
              <div className="flex items-center justify-between gap-3 flex-wrap min-w-0">
                <Button className="bg-black hover:bg-gray-800 text-white border-0 w-full sm:w-auto shadow-sm" onClick={handleMessage}>
                  Message
                </Button>
                <Button
                  className={`w-full sm:w-auto ${getConnectButtonState().className}`}
                  variant={getConnectButtonState().variant}
                  onClick={handleConnect}
                  disabled={getConnectButtonState().disabled}
                >
                  {getConnectButtonState().text}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap min-w-0">
                {user && (user.hometownCity || user.location) && (
                  <Button
                    onClick={() => {
                      const chatCity = user.hometownCity || user.location?.split(',')[0] || 'General';
                      setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                    }}
                    className="bg-black hover:bg-gray-800 text-white border-0 shadow-sm rounded-lg
                               inline-flex items-center justify-center gap-2
                               w-full sm:w-auto max-w-full sm:max-w-none
                               px-4 py-3 overflow-hidden break-words"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">Go to Chatrooms</span>
                  </Button>
                )}
                <Button
                  onClick={() => setLocation('/share-qr')}
                  className="bg-gray-100 hover:bg-gray-200 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 shadow-sm rounded-lg
                             inline-flex items-center justify-center gap-2
                             w-full sm:w-auto max-w-full sm:max-w-none
                             px-4 py-3 overflow-hidden break-words"
                  data-testid="button-share-qr-code"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Invite Friends</span>
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
      
      {/* Main content section - Mobile Responsive Layout */}
      <div className="w-full max-w-full mx-auto pb-20 sm:pb-4 px-1 sm:px-4 lg:px-6 mt-2 overflow-x-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Main Content Column */}
          <div className="w-full lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">


            


            
            {/* About Section - Mobile Optimized */}
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

                {/* Current Travel Plans - Show when user is currently traveling */}
                {user?.userType !== 'business' && user?.isCurrentlyTraveling && user?.travelDestination && (
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-gray-800 dark:text-white">Current Travel Plan</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <span className="font-medium text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Destination:</span>
                          <span className="text-gray-900 dark:text-gray-100 flex-1 break-words font-semibold">{user.travelDestination}</span>
                        </div>
                        {user.travelEndDate && (
                          <div className="flex items-start">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Return:</span>
                            <span className="text-gray-900 dark:text-gray-100 flex-1 break-words">
                              {formatDateForDisplay(user.travelEndDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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

            {/* What You Have in Common - Consolidated Section */}
            {!isOwnProfile && currentUser && user?.id && (
              <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
            )}

            {/* Secret Activities Section - Below About Section */}
            {user?.userType !== 'business' && user?.secretActivities && (
              <Card>
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
                            <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
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
                  {isOwnProfile && !(editingInterests && editingActivities && editingEvents) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingInterests(true);
                        setEditingActivities(true);
                        setEditingEvents(true);
                        // Initialize edit form data
                        setEditFormData({
                          interests: user?.interests || [],
                          privateInterests: user?.privateInterests || [],
                          activities: user?.activities || [],
                          events: user?.events || []
                        });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit All Preferences
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6 pb-4 sm:pb-6 break-words overflow-hidden">

                {/* Unified Edit Form for All Preferences */}
                {isOwnProfile && (editingInterests && editingActivities && editingEvents) ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit All Preferences</h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          onClick={async () => {
                            try {
                              console.log('🔧 SAVING DATA:', editFormData);
                              
                              // Separate predefined vs custom entries for proper database storage
                              const predefinedInterests = INTERESTS_OPTIONS.filter(opt => editFormData.interests.includes(opt));
                              const predefinedActivities = ACTIVITIES_OPTIONS.filter(opt => editFormData.activities.includes(opt));
                              const predefinedEvents = EVENTS_OPTIONS.filter(opt => editFormData.events.includes(opt));
                              
                              const customInterests = editFormData.interests.filter(int => !INTERESTS_OPTIONS.includes(int));
                              const customActivities = editFormData.activities.filter(act => !ACTIVITIES_OPTIONS.includes(act));
                              const customEvents = editFormData.events.filter(evt => !EVENTS_OPTIONS.includes(evt));
                              
                              const saveData = {
                                interests: predefinedInterests,
                                activities: predefinedActivities, 
                                events: predefinedEvents,
                                customInterests: customInterests.join(', '),
                                customActivities: customActivities.join(', '),
                                customEvents: customEvents.join(', ')
                              };
                              
                              console.log('🔧 SAVE - Separated data:', saveData);
                              
                              const response = await fetch(`/api/users/${user.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(saveData)
                              });
                              if (!response.ok) throw new Error('Failed to save');
                              // Refresh data instead of page reload
                              queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                              // Close all editing modes after successful save
                              setEditingInterests(false);
                              setEditingActivities(false);
                              setEditingEvents(false);
                              console.log('✅ Successfully saved user preferences');
                            } catch (error) {
                              console.error('❌ Failed to update preferences:', error);
                            }
                          }}
                          disabled={false}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none text-sm sm:text-base"
                        >
                          Save All Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            // Cancel all edits and close all editing modes
                            setEditingInterests(false);
                            setEditingActivities(false);
                            setEditingEvents(false);
                            // Reset form data
                            setEditFormData({
                              interests: user?.interests || [],
                              privateInterests: user?.privateInterests || [],
                              activities: user?.activities || [],
                              events: user?.events || []
                            });
                          }}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 flex-1 sm:flex-none text-sm sm:text-base"
                        >
                          Cancel All
                        </Button>
                      </div>
                    </div>
                    
                    {/* When editing all preferences, show the unified content */}
                    {editingInterests && editingActivities && editingEvents && (
                      <div className="space-y-6 mt-6">
                        {/* Top Choices Section - FIRST */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Top Choices for Most Travelers
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                            {MOST_POPULAR_INTERESTS.slice(0, 12).map((item) => {
                              const isSelected = editFormData.interests.includes(item);
                              
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    toggleArrayValue(editFormData.interests, item, (newInterests) => 
                                      setEditFormData({ ...editFormData, interests: newInterests })
                                    );
                                  }}
                                  className={`inline-flex items-center justify-center h-7 sm:h-8 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                    isSelected
                                      ? 'bg-green-600 text-white font-bold transform scale-105 shadow-lg'
                                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-sm'
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interests Section - SECOND */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Heart className="w-5 h-5 text-blue-500" />
                            Additional Interests
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border overflow-hidden break-words">
                            {getAllInterests().filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).map((interest) => {
                              const displayText = interest.startsWith("**") && interest.endsWith("**") ? 
                                interest.slice(2, -2) : interest;
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
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
                                  }`}
                                >
                                  {displayText}
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Custom Interest Input */}
                          <div className="flex space-x-2 mt-4">
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
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Private Interests Section */}
                        <div className="border-t pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-5 h-5 text-purple-500" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Private Matching Interests
                            </h4>
                            <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium dark:bg-purple-900 dark:text-purple-200">
                              PRIVATE
                            </div>
                          </div>
                          
                          <div className="text-sm text-purple-600 bg-purple-50 border border-purple-400 rounded-md p-3 mb-4 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-300">
                            <div className="flex items-start gap-2">
                              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>For matching only - never displayed publicly.</strong> Select sensitive interests like LGBTQ+ events, alternative lifestyles, or personal preferences. These help you find compatible people while keeping your privacy.
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                            {[
                              "LGBTQ+ Events", "Gay Bars & Clubs", "Lesbian Events", "Pride Festivals", "Queer Community", 
                              "Polyamory", "Open Relationships", "Swinging", "Kink & BDSM", "Alternative Lifestyles",
                              "Cannabis Culture", "Psychedelic Experiences", "Adult Entertainment", "Strip Clubs", "Adult Parties",
                              "Sex-Positive Events", "Tantric Workshops", "Fetish Events", "Adult Dating", "Hook-up Culture",
                              "Divorce Support", "Single Parent Events", "Mental Health Support", "Addiction Recovery", "Therapy Groups"
                            ].map((interest) => {
                              const isSelected = editFormData.privateInterests?.includes(interest);
                              
                              return (
                                <button
                                  key={interest}
                                  type="button"
                                  onClick={() => {
                                    const currentPrivate = editFormData.privateInterests || [];
                                    const newPrivateInterests = isSelected
                                      ? currentPrivate.filter(i => i !== interest)
                                      : [...currentPrivate, interest];
                                    
                                    setEditFormData({ 
                                      ...editFormData, 
                                      privateInterests: newPrivateInterests 
                                    });
                                  }}
                                  className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                    isSelected
                                      ? 'bg-purple-600 text-white font-bold transform scale-105'
                                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700'
                                  }`}
                                >
                                  {interest}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Activities Section */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-green-500" />
                            Activities
                          </h4>
                          
                          <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300">
                            Your default preferences for trips and to match with Nearby Locals and Travelers. They can be added to and changed in the future for specific trips etc.
                          </div>
                          
                          <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border overflow-hidden break-words">
                            {getAllActivities().map((activity, index) => {
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
                                  className={`inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none border-0 transition-all ${
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
                          
                          {/* Custom Activity Input */}
                          <div className="flex space-x-2 mt-4">
                            <Input
                              placeholder="Add your own activities not listed above - Hit enter after each choice"
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
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Events Section */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            Events
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                            {getAllEvents().map((event, index) => {
                              const isSelected = editFormData.events.includes(event);
                              
                              return (
                                <button
                                  key={`event-${event}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    toggleArrayValue(editFormData.events, event, (newEvents) => 
                                      setEditFormData({ ...editFormData, events: newEvents })
                                    );
                                  }}
                                  className={`inline-flex items-center justify-center h-7 rounded-full px-3 text-[11px] font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                    isSelected
                                      ? 'bg-green-600 text-white font-bold transform scale-105'
                                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700'
                                  }`}
                                >
                                  {event}
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Custom Event Input */}
                          <div className="flex space-x-2 mt-4">
                            <Input
                              placeholder="Add your own events not listed above - Hit enter after each choice"
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
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Bottom Save/Cancel Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <Button 
                            onClick={async () => {
                              try {
                                console.log('🔧 BOTTOM SAVE - DATA:', editFormData);
                                const response = await fetch(`/api/users/${user.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(editFormData)
                                });
                                if (!response.ok) throw new Error('Failed to save');
                                // Refresh data instead of page reload
                                queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                                // Close all editing modes after successful save
                                setEditingInterests(false);
                                setEditingActivities(false);
                                setEditingEvents(false);
                              } catch (error) {
                                console.error('Failed to update preferences:', error);
                              }
                            }}
                            disabled={false}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1 text-sm sm:text-base"
                          >
                            Save All Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              // Cancel all edits and close all editing modes
                              setEditingInterests(false);
                              setEditingActivities(false);
                              setEditingEvents(false);
                              // Reset temp values AND editFormData to original user data
                              setTempInterests(user?.interests || []);
                              setTempActivities(user?.activities || []);
                              setTempEvents(user?.events || []);
                              setEditFormData({
                                interests: user?.interests || [],
                                privateInterests: user?.privateInterests || [],
                                activities: user?.activities || [],
                                events: user?.events || []
                              });
                            }}
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 flex-1 text-sm sm:text-base"
                          >
                            Cancel All
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Top Choices Section - Now at the top where it belongs */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Top Choices for Most Travelers
                  </h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    {MOST_POPULAR_INTERESTS.slice(0, 12).map((item) => (
                      <div key={item} className="inline-flex items-center justify-center h-7 sm:h-8 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-sm">
                        {item}
                      </div>
                    ))}
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
                  
                  {editingInterests && !(editingInterests && editingActivities && editingEvents) ? (
                    <div className="space-y-4">
                      {/* All Interests */}
                      <div>
                        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                          {getAllInterests().filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).map((interest) => {
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
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
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
                      {/* Show selected interests - filter out top choices to avoid duplication */}
                      {tempInterests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Additional Interests:</p>
                          <div className="flex flex-wrap gap-2">
                            {tempInterests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).map((interest) => (
                              <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
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
                      {/* SIMPLIFIED VIEW: Just show count and top few for own profile */}
                      {true ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {(user?.interests || []).filter(interest => !MOST_POPULAR_INTERESTS.includes(interest)).length} additional interests selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {(() => {
                              // Filter out top choices from interests to avoid duplication
                              const allInterests = user?.interests || [];
                              const filteredInterests = allInterests.filter(interest => !MOST_POPULAR_INTERESTS.includes(interest));
                              const topInterests = filteredInterests.slice(0, 8); // Show only first 8
                              const remaining = filteredInterests.length - 8;
                              
                              return (
                                <>
                                  {topInterests.map((interest, index) => (
                                    <div key={`interest-${index}`} className="inline-flex items-center justify-center h-7 sm:h-8 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                                      {interest}
                                    </div>
                                  ))}
                                  {remaining > 0 && (
                                    <div className="inline-flex items-center justify-center h-7 sm:h-8 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap leading-none border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-transparent">
                                      +{remaining} more
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No interests selected yet</p>
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
                  
                  {editingActivities && !(editingInterests && editingActivities && editingEvents) ? (
                    <div className="space-y-4">
                      <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300">
                        Your default preferences for trips and to match with Nearby Locals and Travelers. They can be added to and changed in the future for specific trips etc.
                      </div>
                      
                      {/* All Available Activities */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">All Available Activities</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                          {getAllActivities().map((activity, index) => {
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
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
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
                              <span key={`activity-${activity}-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
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
                      {/* SIMPLIFIED VIEW: Just show count and top few for own profile */}
                      {(user.activities && user.activities.length > 0) ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.activities.length} activities selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const activities = user.activities || [];
                              const topActivities = activities.slice(0, 6); // Show only first 6
                              const remaining = activities.length - 6;
                              
                              return (
                                <>
                                  {topActivities.map((activity, index) => (
                                    <div key={`activity-${index}`} className="pill pill-activities inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none" >
                                      {activity}
                                    </div>
                                  ))}
                                  {remaining > 0 && (
                                    <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none">
                                      +{remaining} more
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No activities selected yet</p>
                      )}
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
                  
                  {editingEvents && !(editingInterests && editingActivities && editingEvents) ? (
                    <div className="space-y-4">
                      {/* All Available Events */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">All Available Events</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                          {getAllEvents().map((event, index) => {
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
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
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
                              <span key={`event-${event}-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
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
                      {/* SIMPLIFIED VIEW: Just show count and top few for own profile */}
                      {(user.events && user.events.length > 0) ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.events.length} event types selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const events = user.events || [];
                              const topEvents = events.slice(0, 6); // Show only first 6
                              const remaining = events.length - 6;
                              
                              return (
                                <>
                                  {topEvents.map((event, index) => (
                                    <div key={`event-${index}`} className="pill pill-events inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none">
                                      {event}
                                    </div>
                                  ))}
                                  {remaining > 0 && (
                                    <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none">
                                      +{remaining} more
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No event preferences selected yet</p>
                      )}
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
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-orange-500" />
                  Business Interests, Activities & Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 break-words overflow-hidden">
                {/* Single Edit Button for All Business Preferences */}
                {isOwnProfile && !editingInterests && !editingActivities && !editingEvents && (
                  <div className="flex justify-center mb-4">
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
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Business Preferences
                    </Button>
                  </div>
                )}

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
                                  <div key={`interest-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
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
                                  <div key={`activity-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5">
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
                                  <div key={`event-${index}`} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1.5">
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
                              const predefinedInterests = getAllInterests().filter(opt => editFormData.interests.includes(opt));
                              const predefinedActivities = getAllActivities().filter(opt => editFormData.activities.includes(opt));
                              const predefinedEvents = getAllEvents().filter(opt => editFormData.events.includes(opt));
                              
                              const customInterests = editFormData.interests.filter(int => !getAllInterests().includes(int));
                              const customActivities = editFormData.activities.filter(act => !getAllActivities().includes(act));
                              const customEvents = editFormData.events.filter(evt => !getAllEvents().includes(evt));
                              
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
                              privateInterests: user?.privateInterests || [],
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
                          {getAllInterests().map((interest, index) => {
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
                          {editFormData.interests.filter(interest => !getAllInterests().includes(interest)).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Your Custom Interests (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {editFormData.interests.filter(interest => !getAllInterests().includes(interest)).map((interest, index) => (
                                  <span
                                    key={`custom-interest-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5"
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

                      {/* Business Private Interests Section */}
                      <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Eye className="w-5 h-5 text-purple-500" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Private Business Matching
                          </h4>
                          <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium dark:bg-purple-900 dark:text-purple-200">
                            PRIVATE
                          </div>
                        </div>
                        
                        <div className="text-sm text-purple-600 bg-purple-50 border border-purple-400 rounded-md p-3 mb-4 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-300">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>For matching only - never shown publicly.</strong> Select sensitive business interests that help you connect with compatible customers and partners while keeping your privacy.
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          {[
                            "LGBTQ+ Friendly Business", "Pride Month Events", "Diversity & Inclusion", "Women-Owned Business", 
                            "Minority-Owned Business", "Cannabis Tourism", "Adult Entertainment Venue", "18+ Events Only", 
                            "Alternative Lifestyle Friendly", "Sex-Positive Space", "Kink Community Welcome", "Polyamory Friendly",
                            "Mental Health Support", "Addiction Recovery Support", "Therapy & Wellness", "Support Groups"
                          ].map((interest) => {
                            const isSelected = editFormData.privateInterests?.includes(interest);
                            
                            return (
                              <button
                                key={interest}
                                type="button"
                                onClick={() => {
                                  const currentPrivate = editFormData.privateInterests || [];
                                  const newPrivateInterests = isSelected
                                    ? currentPrivate.filter(i => i !== interest)
                                    : [...currentPrivate, interest];
                                  
                                  setEditFormData({ 
                                    ...editFormData, 
                                    privateInterests: newPrivateInterests 
                                  });
                                }}
                                className={`inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none border-0 transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 text-white font-bold transform scale-105'
                                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Business Activities Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-green-500" />
                          Business Activities
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          {getAllActivities().map((activity, index) => {
                            const isSelected = editFormData.activities.includes(activity);
                            return (
                              <button
                                key={`business-activity-${activity}-${index}`}
                                type="button"
                                onClick={() => {
                                  const newActivities = isSelected
                                    ? editFormData.activities.filter((a: string) => a !== activity)
                                    : [...editFormData.activities, activity];
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
                                  if (trimmed && !editFormData.activities.includes(trimmed)) {
                                    setEditFormData({ ...editFormData, activities: [...editFormData.activities, trimmed] });
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
                                if (trimmed && !editFormData.activities.includes(trimmed)) {
                                  setEditFormData({ ...editFormData, activities: [...editFormData.activities, trimmed] });
                                  setCustomActivityInput('');
                                }
                              }}
                              className="h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Display Custom Activities with Delete Option */}
                          {editFormData.activities.filter(activity => !getAllActivities().includes(activity)).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Activities (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {editFormData.activities.filter(activity => !getAllActivities().includes(activity)).map((activity, index) => (
                                  <span
                                    key={`custom-activity-${index}`}
                                    className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5"
                                  >
                                    {activity}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newActivities = editFormData.activities.filter(a => a !== activity);
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
                          {getAllEvents().map((event, index) => {
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
                          {editFormData.events.filter(event => !getAllEvents().includes(event)).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Events (click X to remove):</p>
                              <div className="flex flex-wrap gap-2">
                                {editFormData.events.filter(event => !getAllEvents().includes(event)).map((event, index) => (
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

              </CardContent>
            </Card>
            )}

            {/* Travel Plans - Hidden for business profiles */}
            {user?.userType !== 'business' && (
              <>
                {/* Current & Upcoming Travel Plans */}
                <Card>
                  <CardHeader className="flex flex-col items-start gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Current & Upcoming Travel Plans ({travelPlans.filter(plan => plan.status === 'planned' || plan.status === 'active').length})
                    </CardTitle>
                  {isOwnProfile && (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setLocation('/plan-trip');
                            // Scroll to top after navigation
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-semibold shadow-lg"
                        >
                          ✈️ Add New Trip
                        </Button>
                        <Button
                          onClick={() => {
                            setLocation('/match-in-city');
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700"
                        >
                          🏙️ City Match
                        </Button>
                      </div>
                      {/* City Activities Call-to-Action */}
                      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-lg border-2 border-blue-400">
                        <p className="text-lg font-bold text-white text-center mb-2">
                          🎯 Want to Find People Doing Specific Activities ON THIS TRIP?
                        </p>
                        <p className="text-xs text-white/80 text-center">
                          After completing your trip plan, visit the City Match page to add and check off specific activities, events, and plans to THIS CITY. Find others who want to do the exact same things!
                        </p>
                      </div>
                    </div>
                  )}
                  </CardHeader>
                  <CardContent>
                    {travelPlans.filter(plan => plan.status === 'planned' || plan.status === 'active').length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {travelPlans.filter(plan => plan.status === 'planned' || plan.status === 'active').map((plan) => (
                        <div 
                          key={plan.id} 
                          className="border rounded-lg p-3 transition-colors hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer border-gray-200 dark:border-gray-700"
                          title={isOwnProfile ? "Click to view details" : "Click to view travel details, dates, and destinations"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTravelPlan(plan);
                            setShowTravelPlanDetails(true);
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          <div className="flex items-start justify-between mb-3 sm:flex-row flex-col gap-3 sm:gap-0">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-3 mb-2">
                                <h4 className="font-medium text-sm">{plan.destination}</h4>
                                <div className="flex items-center gap-2">
                                  {plan.status === 'active' && (
                                    <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                      ✈️ Currently Traveling
                                    </div>
                                  )}
                                  {plan.status === 'planned' && (
                                    <div className="inline-flex items-center justify-center h-7 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-orange-500 text-white border-0 appearance-none select-none gap-1">
                                      📅 Upcoming
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-black dark:text-white text-xs mb-1 font-medium">
                                {plan.startDate ? formatDateForDisplay(plan.startDate, user?.hometownCity || 'UTC') : 'Start date TBD'} - {plan.endDate ? formatDateForDisplay(plan.endDate, user?.hometownCity || 'UTC') : 'End date TBD'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwnProfile && (
                                <div className="flex gap-2 sm:flex-row flex-col sm:items-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/plan-trip?edit=${plan.id}`);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600 h-7 w-7 p-0 sm:w-7 w-full sm:mb-0 mb-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span className="ml-1 text-xs sm:hidden">Edit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/itinerary/${plan.id}`);
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:opacity-90 h-7 text-xs px-3 sm:mb-0 mb-1 whitespace-nowrap flex items-center gap-1"
                                  >
                                    <Calendar className="w-3 h-3" />
                                    Itinerary
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTravelPlan(plan);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 sm:w-7 w-full"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span className="ml-1 text-xs sm:hidden">Delete</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {plan.interests && plan.interests.length > 0 && (
                            <div className="mb-2">
                              <div className="flex flex-wrap gap-2">
                                {(expandedPlanInterests.has(plan.id) ? plan.interests : plan.interests.slice(0, 2)).map((interest: string) => (
                                  <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                    {interest}
                                  </div>
                                ))}
                                {plan.interests.length > 2 && (
                                  <div 
                                    className="pill-interests cursor-pointer"
                                    onClick={() => {
                                      const newExpanded = new Set(expandedPlanInterests);
                                      if (expandedPlanInterests.has(plan.id)) {
                                        newExpanded.delete(plan.id);
                                      } else {
                                        newExpanded.add(plan.id);
                                      }
                                      setExpandedPlanInterests(newExpanded);
                                    }}
                                  >
                                    {expandedPlanInterests.has(plan.id) ? 'Show less' : `+${plan.interests.length - 2} more`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {plan.travelStyle && plan.travelStyle.length > 0 && (
                            <div>
                              <div className="flex flex-wrap gap-2">
                                {plan.travelStyle.slice(0, 2).map((style: string) => (
                                  <div key={style} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                    {style}
                                  </div>
                                ))}
                                {plan.travelStyle.length > 2 && (
                                  <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                    +{plan.travelStyle.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                      ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No current or upcoming travel plans</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Past Travel Plans */}
                {travelPlans.filter(plan => plan.status === 'completed').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Past Trips ({travelPlans.filter(plan => plan.status === 'completed').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {travelPlans.filter(plan => plan.status === 'completed').map((plan) => (
                          <div 
                            key={plan.id} 
                            className="border rounded-lg p-3 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer opacity-75"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedTravelPlan(plan);
                              setShowTravelPlanDetails(true);
                              setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 100);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300">{plan.destination}</h4>
                                  <div className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium leading-none whitespace-nowrap bg-gray-500 text-white border-0 appearance-none select-none gap-1.5">
                                    ✓ Completed
                                  </div>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium">
                                  {plan.startDate ? formatDateForDisplay(plan.startDate, user?.hometownCity || 'UTC') : 'Start date TBD'} - {plan.endDate ? formatDateForDisplay(plan.endDate, user?.hometownCity || 'UTC') : 'End date TBD'}
                                </p>
                                
                                {/* Enhanced Itinerary Summary */}
                                {(plan.itineraryCount > 0 || plan.totalActivities > 0 || plan.totalItineraryCost > 0) && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 mt-2 space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                                      <Calendar className="w-3 h-3" />
                                      Trip Summary
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-700 dark:text-blue-300">
                                      {plan.itineraryCount > 0 && (
                                        <span>📋 {plan.itineraryCount} itinerary{plan.itineraryCount === 1 ? '' : 'ies'}</span>
                                      )}
                                      
                                      {plan.totalActivities > 0 && (
                                        <span>✅ {plan.completedActivities || 0}/{plan.totalActivities} activities</span>
                                      )}
                                      
                                      {plan.totalItineraryCost > 0 && (
                                        <span className="col-span-2">💰 ${plan.totalItineraryCost.toFixed(2)} spent</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isOwnProfile && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTravelPlan(plan);
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {plan.interests && plan.interests.length > 0 && (
                              <div className="mb-2">
                                <div className="flex flex-wrap gap-2">
                                  {(expandedPlanInterests.has(plan.id) ? plan.interests : plan.interests.slice(0, 2)).map((interest: string) => (
                                    <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                      {interest}
                                    </div>
                                  ))}
                                  {plan.interests.length > 2 && (
                                    <div 
                                      className="pill-interests cursor-pointer"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedPlanInterests);
                                        if (expandedPlanInterests.has(plan.id)) {
                                          newExpanded.delete(plan.id);
                                        } else {
                                          newExpanded.add(plan.id);
                                        }
                                        setExpandedPlanInterests(newExpanded);
                                      }}
                                    >
                                      {expandedPlanInterests.has(plan.id) ? 'Show less' : `+${plan.interests.length - 2} more`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {plan.travelStyle && plan.travelStyle.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-2">
                                  {plan.travelStyle.slice(0, 2).map((style: string) => (
                                    <div key={style} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                      {style}
                                    </div>
                                  ))}
                                  {plan.travelStyle.length > 2 && (
                                    <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5">
                                      +{plan.travelStyle.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* View Itinerary Details Button */}
                            {plan.itineraryCount > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLocation(`/itinerary/${plan.id}`);
                                  }}
                                >
                                  <MapPin className="w-3 h-3 mr-1" />
                                  View Itinerary
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
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



            {/* Photo Gallery - Modularized Component */}
            <PhotoGallerySection
              photos={photos}
              isOwnProfile={isOwnProfile}
              uploadingPhoto={uploadingPhoto}
              setSelectedPhotoIndex={setSelectedPhotoIndex}
              handleDeletePhoto={handleDeletePhoto}
            />

            {/* Event Organizer Hub - for ALL users who want to organize events */}
            {isOwnProfile && (
              <EventOrganizerHubSection userId={effectiveUserId || 0} />
            )}
          </div>

          {/* Right Sidebar - Mobile Responsive */}
          <div className="w-full lg:col-span-1 space-y-2 lg:space-y-4">
            {/* Quick Meetup Widget - Only show for own profile (travelers/locals only, NOT business) */}
            {isOwnProfile && user && user.userType !== 'business' && (
              <div className="mt-6">
                <QuickMeetupWidget city={user?.hometownCity ?? ''} profileUserId={user?.id} />
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
                    <span className="font-semibold dark:text-white">{travelPlans.filter(plan => plan.status === 'planned' || plan.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Cumulative Trips Taken</span>
                    <span className="font-semibold dark:text-white">{travelPlans.filter(plan => plan.status === 'completed').length}</span>
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



            {/* Connections Widget - Modularized Component */}
            <ConnectionsWidget
              userConnections={userConnections}
              isOwnProfile={isOwnProfile}
              effectiveUserId={effectiveUserId}
              showConnectionFilters={showConnectionFilters}
              setShowConnectionFilters={setShowConnectionFilters}
              connectionFilters={connectionFilters}
              setConnectionFilters={setConnectionFilters}
              connectionsDisplayCount={connectionsDisplayCount}
              setConnectionsDisplayCount={setConnectionsDisplayCount}
              editingConnectionNote={editingConnectionNote}
              setEditingConnectionNote={setEditingConnectionNote}
              connectionNoteText={connectionNoteText}
              setConnectionNoteText={setConnectionNoteText}
            />


            {/* Reference Widget - Only show for other users' profiles */}
            {!isOwnProfile && (
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
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowReferenceDialog(true)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">Write a Reference</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Interests Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  My Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.interests && user.interests.map((interest: string) => (
                    <div key={interest} className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-purple-400 to-pink-500 text-white border-0 appearance-none select-none gap-1.5 shadow-md">
                      {interest}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Profile Widgets */}
            <div className="text-center text-gray-500 text-sm mt-8">
              Profile content continues...
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
};

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

export default ProfileContent;
