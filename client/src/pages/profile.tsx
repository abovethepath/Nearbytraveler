import React, { useState, useMemo, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
// Removed goBackProperly import
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Camera, Globe, Users, Calendar, Star, Settings, ArrowLeft, Upload, Edit, Edit2, Heart, MessageSquare, X, Plus, Eye, EyeOff, MessageCircle, ImageIcon, Minus, RotateCcw, Sparkles, Package, Trash2, Home, FileText, TrendingUp, MessageCircleMore, Share2, ChevronDown, Search, Zap, History, Clock, Wifi, Shield, ChevronRight } from "lucide-react";
import { compressPhotoAdaptive } from "@/utils/photoCompression";
import { AdaptiveCompressionIndicator } from "@/components/adaptive-compression-indicator";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import FriendReferralWidget from "@/components/friend-referral-widget";

import ReferencesWidgetNew from "@/components/references-widget-new";
// Removed framer-motion import for static interface
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";

import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { calculateAge, formatDateOfBirthForInput, validateDateInput, getDateInputConstraints } from "@/lib/ageUtils";
import { isTopChoiceInterest, getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";

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
import TravelItinerary from "@/components/travel-itinerary";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";



import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import { SimpleAvatar } from "@/components/simple-avatar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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

import { LocationSharingWidget } from "@/components/LocationSharingWidget";
import { CustomerUploadedPhotos } from "@/components/customer-uploaded-photos";
import BusinessEventsWidget from "@/components/business-events-widget";
import ReferralWidget from "@/components/referral-widget";
import { BlockUserButton } from "@/components/block-user-button";



import type { User, UserPhoto, PassportStamp, TravelPlan } from "@shared/schema";
import { insertUserReferenceSchema } from "@shared/schema";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "../../../shared/base-options";

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
    });
  }
};

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
}

function MultiSelect({ options, selected, onChange, placeholder, maxDisplay = 3 }: MultiSelectProps) {
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
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selected.slice(0, maxDisplay).map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    +{selected.length - maxDisplay} more
                  </Badge>
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
          <CommandGroup className="max-h-60 overflow-y-auto">
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
    const baseSchema = z.object({
      bio: z.string().min(30, "Bio must be at least 30 characters").max(1000, "Bio must be 1000 characters or less"),
      hometownCity: z.string().optional(),
      hometownState: z.string().optional(),
      hometownCountry: z.string().optional(),
      travelStyle: z.array(z.string()).optional(),
    });

    if (userType === 'business') {
      return baseSchema.extend({
        businessName: z.string().max(100, "Business name must be 100 characters or less").optional(),
        businessDescription: z.string().optional(),
        businessType: z.string().optional(),
        location: z.string().optional(),
        streetAddress: z.string().optional(),
        zipCode: z.string().optional(),
        phoneNumber: z.string().optional(),
        websiteUrl: z.string().optional(),
      });
    } else {
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
  const isOwnProfile = propUserId ? (propUserId === currentUser?.id) : true;
  
  console.log('🔧 AUTHENTICATION STATE:', {
    currentUserId: currentUser?.id,
    currentUsername: currentUser?.username,
    effectiveUserId,
    isOwnProfile,
    propUserId
  });
  
  console.log('Profile OWNERSHIP:', {
    isOwnProfile,
    propUserId,
    currentUserId: currentUser?.id,
    effectiveUserId,
    comparison: `${propUserId} === ${currentUser?.id}`,
    comparisonResult: propUserId === currentUser?.id
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
    queryKey: ['/api/users', currentUser?.id, 'compatibility', effectiveUserId],
    queryFn: async () => {
      if (!currentUser?.id || !effectiveUserId || isOwnProfile) return null;
      const response = await fetch(`/api/users/${currentUser.id}/compatibility/${effectiveUserId}`);
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
  const { data: businessOffers = [], isLoading: businessOffersLoading } = useQuery<any[]>({
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
    
    // Use the same logic as the location display for consistency
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && user.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = user.hometownCity.toLowerCase();
      
      // Only show travel destination events if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        console.log('Profile Event discovery - FINAL CITY SELECTION (traveling):', currentDestination);
        return currentDestination;
      }
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
  const dynamicProfileSchema = getProfileFormSchema(currentUserType);
  
  const profileForm = useForm<z.infer<typeof dynamicProfileSchema>>({
    resolver: zodResolver(dynamicProfileSchema),
    defaultValues: currentUserType === 'business' ? {
      bio: "",
      businessName: "",
      hometownCity: "",
      hometownState: "",
      hometownCountry: "",
      travelStyle: [],
      businessDescription: "",
      businessType: "",
      location: "",
      streetAddress: "",
      zipCode: "",
      phoneNumber: "",
      websiteUrl: "",
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
        activities: user.activities || [],
        events: user.events || []
      });
      
      // Reset form with user type-specific data
      if (user.userType === 'business') {
        profileForm.reset({
          bio: user.bio || "",
          businessName: (user as any).businessName || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          travelStyle: user.travelStyle || [],
          businessDescription: (user as any).businessDescription || "",
          businessType: (user as any).businessType || "",
          location: user.location || "",
          streetAddress: (user as any).streetAddress || "",
          zipCode: (user as any).zipCode || "",
          phoneNumber: (user as any).phoneNumber || "",
          websiteUrl: (user as any).websiteUrl || "",
        });
      } else {
        const travelingWithChildrenValue = !!(user as any).travelingWithChildren;
        
        profileForm.reset({
          bio: user.bio || "",
          secretActivities: user.secretActivities || "",
          hometownCity: user.hometownCity || "",
          hometownState: user.hometownState || "",
          hometownCountry: user.hometownCountry || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
          ageVisible: user.ageVisible !== undefined ? user.ageVisible : false,
          gender: user.gender || "",
          sexualPreference: user.sexualPreference || [],
          sexualPreferenceVisible: user.sexualPreferenceVisible !== undefined ? user.sexualPreferenceVisible : false,
          travelStyle: user.travelStyle || [],
          travelingWithChildren: travelingWithChildrenValue,
          childrenAges: (user as any).childrenAges || "",
          isVeteran: user.isVeteran !== undefined ? user.isVeteran : false,
          isActiveDuty: user.isActiveDuty !== undefined ? user.isActiveDuty : false,
        });
        
        // Force set the value after reset to ensure React Hook Form properly registers it
        setTimeout(() => {
          profileForm.setValue('travelingWithChildren', travelingWithChildrenValue);
        }, 100);
      }
    }
  }, [user, userLoading, profileForm]);

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
        ...(user?.userType === 'business' ? { businessName: (user as any).businessName || "" } : {}),
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
        isVeteran: user.isVeteran || false,
        isActiveDuty: user.isActiveDuty || false,
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

  // Profile edit mutation
  const editProfile = useMutation({
    mutationFn: async (data: z.infer<typeof dynamicProfileSchema>) => {
      console.log('🔥 MUTATION: Profile edit data being sent:', data);
      console.log('🔥 MUTATION: travelingWithChildren in data:', data.travelingWithChildren, 'will become:', !!data.travelingWithChildren);
      
      // Ensure boolean fields are explicitly included (don't drop false values)
      const payload = {
        ...data,
        travelingWithChildren: !!data.travelingWithChildren,
        ageVisible: !!data.ageVisible,
        sexualPreferenceVisible: !!data.sexualPreferenceVisible,
        isVeteran: !!data.isVeteran,
        isActiveDuty: !!data.isActiveDuty,
      };
      
      console.log('🔥 MUTATION: Profile payload with explicit booleans:', payload);
      console.log('🔥 MUTATION: Final travelingWithChildren value being sent:', payload.travelingWithChildren);
      const response = await apiRequest('PUT', `/api/users/${effectiveUserId}`, payload);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile edit error response:', errorText);
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      console.log('🔥 PROFILE UPDATE SUCCESS - Immediate cache refresh:', updatedUser);
      console.log('🔥 Updated travelingWithChildren value:', updatedUser.travelingWithChildren);
      
      // CRITICAL: Update ALL possible cache keys immediately
      queryClient.setQueryData([`/api/users/${effectiveUserId}`, currentUser?.id], updatedUser);
      queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
      queryClient.setQueryData(['/api/users'], (oldData: any) => {
        if (Array.isArray(oldData)) {
          return oldData.map(u => u.id === updatedUser.id ? updatedUser : u);
        }
        return oldData;
      });
      
      // Update localStorage and auth context if editing own profile
      if (isOwnProfile) {
        console.log('🔥 Updating auth storage and context with new profile data');
        authStorage.setUser(updatedUser);
        
        // CRITICAL: Update auth context state immediately
        if (typeof setAuthUser === 'function') {
          console.log('🔥 Calling setAuthUser with updated profile data');
          setAuthUser(updatedUser);
        }
        
        // Also update localStorage directly as backup
        localStorage.setItem('travelconnect_user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // FORCE immediate UI refresh with state update
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
      }
      
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
      console.error('Profile edit mutation error:', error);
      toast({
        title: "Update failed",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: z.infer<typeof dynamicProfileSchema>) => {
    console.log('🔥 FORM SUBMIT: Raw form data:', data);
    console.log('🔥 FORM SUBMIT: travelingWithChildren value:', data.travelingWithChildren, 'type:', typeof data.travelingWithChildren);
    console.log('Form validation errors:', profileForm.formState.errors);
    
    // Clear children ages if traveling with children is turned off
    if (!data.travelingWithChildren) {
      data.childrenAges = "";
      console.log('🔥 FORM SUBMIT: Cleared childrenAges because travelingWithChildren is false');
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
      return { text: 'Request Sent', disabled: true, variant: 'default' as const, className: 'bg-blue-400 hover:bg-blue-500 text-white border-0' };
    }
    return { text: connectMutation.isPending ? 'Connecting...' : 'Connect', disabled: connectMutation.isPending, variant: 'default' as const, className: 'bg-travel-blue hover:bg-blue-700 text-white border-0' };
  };

  // Function to determine current location based on travel status
  const getCurrentLocation = () => {
    if (!user) return "Not specified";
    
    // Check if user has active travel plans
    const now = new Date();
    const travelStart = user.travelStartDate ? new Date(user.travelStartDate) : null;
    const travelEnd = user.travelEndDate ? new Date(user.travelEndDate) : null;
    
    // If user is currently traveling (between start and end dates)
    if (travelStart && travelEnd && now >= travelStart && now <= travelEnd && user.travelDestination) {
      return user.travelDestination;
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
      <div className="min-h-screen profile-page">
      {shouldShowBackToChatroom && (
        <div className="w-full max-w-full mx-auto px-2 pt-2">
          <Button 
            onClick={handleBackToChatroom}
            variant="outline" 
            className="mb-2"
          >
            Back
          </Button>
        </div>
      )}

      {/* Mobile spacing to account for global MobileTopNav */}
      <div className="h-4 md:hidden"></div>

      {/* Mobile Back Button */}
      <div className="block md:hidden px-4 pb-2">
        <UniversalBackButton 
          destination="/discover"
          label="Back"
          className="shadow-sm"
        />
      </div>

      {/* Profile Completion Warning - Only show for incomplete own profiles */}
      {isProfileIncomplete() && (
        <div className="w-full bg-red-600 text-white px-4 py-3 mb-4">
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
    
      {/* EXPANDED GRADIENT HEADER - MOBILE OPTIMIZED WITH RIGHT-ALIGNED PHOTO */}
      <div className={`w-full bg-gradient-to-r ${gradientOptions[selectedGradient]} p-4 sm:p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row items-start gap-4 sm:gap-6">
            {/* Profile Avatar - Left Side */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 border-4 border-white shadow-lg bg-white">
                <AvatarImage src={user?.profileImage || ''} className="object-cover" />
                <AvatarFallback className="text-lg sm:text-2xl md:text-4xl bg-gradient-to-br from-blue-600 to-orange-600 text-white">
                  {(user?.username?.charAt(0) || user?.name?.charAt(0) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0"
                    onClick={() => document.getElementById('avatar-upload-input')?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload-input"
                  />
                </>
              )}
            </div>

            {/* Profile Info - Right Side */}
            <div className="flex-1 min-w-0">
              {isOwnProfile && (
                <div className="mb-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 border border-white text-xs sm:text-sm px-3 py-1 font-medium shadow-sm"
                    onClick={() => setSelectedGradient((prev) => (prev + 1) % gradientOptions.length)}
                  >
                    🎨 Change Color
                  </Button>
                </div>
              )}

              {/* EXACTLY 3 LINES as requested - moved down */}
              <div className="space-y-1 text-black w-full mt-2">
                {/* Line 1: Username */}
                <h1 className="text-xl sm:text-3xl font-bold text-black">@{user.username}</h1>
                
                {/* Line 2: Location/Status with pin icon - Allow full width */}
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-medium flex-1">
                    {user.userType === 'business' 
                      ? `Nearby Business in ${(user as any).city || user.hometownCity || 'Los Angeles'}`
                      : (() => {
                          // Check for active travel plans first
                          if (travelPlans && travelPlans.length > 0) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            let activeTrips = [];
                            
                            for (const plan of travelPlans) {
                              if (plan.startDate && plan.endDate) {
                                const parseLocalDate = (dateInput: string | Date | null | undefined) => {
                                  if (!dateInput) return null;
                                  let dateString: string;
                                  if (dateInput instanceof Date) {
                                    dateString = dateInput.toISOString();
                                  } else {
                                    dateString = dateInput;
                                  }
                                  const parts = dateString.split('T')[0].split('-');
                                  if (parts.length === 3) {
                                    const year = parseInt(parts[0]);
                                    const month = parseInt(parts[1]) - 1;
                                    const day = parseInt(parts[2]);
                                    return new Date(year, month, day);
                                  }
                                  return null;
                                };
                                
                                const startDate = parseLocalDate(plan.startDate);
                                const endDate = parseLocalDate(plan.endDate);
                                if (!startDate || !endDate) continue;
                                startDate.setHours(0, 0, 0, 0);
                                endDate.setHours(23, 59, 59, 999);
                                
                                const isCurrentlyActive = today >= startDate && today <= endDate;
                                if (isCurrentlyActive && plan.destination) {
                                  activeTrips.push({
                                    plan,
                                    startDate
                                  });
                                }
                              }
                            }
                            
                            if (activeTrips.length > 0) {
                              activeTrips.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
                              const currentTrip = activeTrips[0].plan;
                              const destination = currentTrip.destination || 'Unknown';
                              return `Nearby Traveler in ${destination}`;
                            }
                          }
                          
                          // Show "Nearby Local" when at home
                          const hometownCity = user.hometownCity;
                          const hometownState = user.hometownState;
                          const hometownCountry = user.hometownCountry;
                          
                          if (hometownCity) {
                            if (hometownCountry && hometownCountry !== 'United States' && hometownCountry !== 'USA') {
                              return `Nearby Local in ${hometownCity}, ${hometownCountry}`;
                            } else if (hometownState && (hometownCountry === 'United States' || hometownCountry === 'USA')) {
                              return `Nearby Local in ${hometownCity}, ${hometownState}`;
                            } else {
                              return `Nearby Local in ${hometownCity}`;
                            }
                          } else if (user.location) {
                            return `Nearby Local in ${user.location}`;
                          }
                          return "Nearby Local";
                        })()
                    }
                  </span>
                </div>

                {/* Line 3: All stats on ONE line - flexible width */}
                {user.userType !== 'business' && (
                  <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm w-full">
                    <span className="font-medium">🌍 {countriesVisited?.length || 0} countries</span>
                    <span className="font-medium">⭐ {references?.length || 0} references</span>
                    <span className="font-medium">
                      • Nearby Local in {user.hometownCity || user.location?.split(',')[0] || 'Location not set'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Different for own vs other profiles */}
            {!isOwnProfile ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 w-full sm:w-auto"
                  onClick={handleMessage}
                >
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
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white border-0 w-full sm:w-auto"
                  onClick={() => setLocation(`/?filters=open&return=${encodeURIComponent(window.location.pathname)}`)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Advanced Search
                </Button>
                {user && (user.hometownCity || user.location) && (
                  <Button
                    onClick={() => {
                      const chatCity = user.hometownCity || user.location?.split(',')[0] || 'General';
                      setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg w-full sm:w-auto"
                  >
                    <MessageCircleMore className="w-4 h-4 mr-2" />
                    Go to Chatrooms
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Loading state for photo uploads */}
        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Main content section - Modern Sectioned Layout */}
      <div className="w-full max-w-full mx-auto pb-0 px-2 sm:px-4 -mt-2">
        






        {/* Things We Have in Common - Mobile Only */}
        {!isOwnProfile && currentUser && user?.id && (
          <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              Things We Have in Common
            </h3>
            <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
          </div>
        )}







        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-2">


            


            
            {/* About Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About {user?.userType === 'business' ? (user?.businessName || user?.name || user?.username) : (user?.username || 'User')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Business Name Field for Business Users */}
                {user?.userType === 'business' && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Business Name</h4>
                      {isOwnProfile && (
                        <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)} className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {user?.businessName || 'Business name not set'}
                    </p>
                  </div>
                )}
                

                
                {/* Bio Section with Mobile-Friendly Edit Button */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white leading-relaxed font-semibold">
                        {user?.userType === 'business' 
                          ? (user?.businessDescription || user?.bio || "No business description available yet.")
                          : (user?.bio || "No bio available yet.")
                        }
                      </p>
                    </div>
                    {/* Bio Edit Button - Always visible on mobile for own profile */}
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setIsEditMode(true)}
                        className="ml-3 bg-blue-600 hover:bg-blue-700 text-white border-0 flex-shrink-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Bio
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Metropolitan Area Information for people in metro areas */}
                {user.hometownCity && user.hometownState && user.hometownCountry && (
                  (() => {
                    const metroArea = getMetropolitanArea(user.hometownCity, user.hometownState, user.hometownCountry);
                    if (metroArea) {
                      return (
                        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg dark:from-gray-800/50 dark:to-gray-700/50">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metropolitan Area:</span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{metroArea}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
                {user?.userType !== 'business' && user?.secretActivities && (
                  <div className="mb-4 p-3 bg-gradient-to-br from-orange-50 to-blue-50 border-l-4 border-orange-200 rounded-r-lg">
                    <h5 className="font-medium text-black dark:text-black mb-2">Secret things I would do if my closest friends came to town</h5>
                    <p className="text-black dark:text-black text-sm italic">
                      {user?.secretActivities}
                    </p>
                  </div>
                )}



                {/* CRITICAL: What You Have in Common - MOVED TO TOP FOR VISIBILITY */}
                {!isOwnProfile && currentUser && user?.id && (
                  <div className="mb-6">
                    <WhatYouHaveInCommon currentUserId={currentUser.id} otherUserId={user.id} />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">From:</span>
                    <span className="ml-2">
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
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Gender:</span>
                      <span className="ml-2 capitalize">{user?.gender?.replace('-', ' ')}</span>
                    </div>
                  )}
                  {user.isVeteran && (
                    <div>
                      <span className="font-medium text-gray-600">Military Status:</span>
                      <span className="ml-2 text-red-600 font-semibold">Veteran</span>
                    </div>
                  )}
                  {user.isActiveDuty && (
                    <div>
                      <span className="font-medium text-gray-600">Military Status:</span>
                      <span className="ml-2 text-blue-600 font-semibold">Active Duty</span>
                    </div>
                  )}
                  {user.sexualPreferenceVisible && user.sexualPreference && (
                    <div>
                      <span className="font-medium text-white dark:text-white">Sexual Preference:</span>
                      <span className="ml-2">
                        {Array.isArray(user.sexualPreference) 
                          ? user.sexualPreference.join(', ')
                          : typeof user.sexualPreference === 'string'
                          ? (user.sexualPreference as string).split(',').join(', ')
                          : user.sexualPreference
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div></div>
                    {isOwnProfile && (
                      <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {user.userType !== 'business' && user.ageVisible && user.dateOfBirth && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span>
                      <span className="ml-2">{calculateAge(user.dateOfBirth)} years old</span>
                    </div>
                  )}
                  {user.userType !== 'business' && user.travelingWithChildren && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Family Travel:</span>
                      <span className="ml-2 flex items-center gap-1">
                        <Users className="w-4 h-4" /> Traveling with children
                        {(user as any).childrenAges && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            (Ages: {(user as any).childrenAges})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Business Contact Information */}
                  {user.userType === 'business' && (
                    <div className="space-y-3 border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        Business Information
                      </h4>
                      
                      {user.streetAddress && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="ml-2">{user.streetAddress}{user.zipCode && `, ${user.zipCode}`}</span>
                        </div>
                      )}
                      
                      {user.phoneNumber && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                          <a 
                            href={`tel:${user.phoneNumber.replace(/[^\d+]/g, '')}`}
                            className="ml-2 text-blue-600 underline"
                          >
                            {(() => {
                              const cleaned = user.phoneNumber.replace(/\D/g, '');
                              return cleaned.length === 10 
                                ? `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
                                : user.phoneNumber;
                            })()}
                          </a>
                        </div>
                      )}
                      
                      {user.websiteUrl && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Website:</span>
                          <a 
                            href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 underline"
                          >
                            {user.websiteUrl}
                          </a>
                        </div>
                      )}

                      {/* Business Services and Special Offers */}
                      {(user.services || user.specialOffers || user.targetCustomers || user.certifications || isOwnProfile) && (
                        <div className="space-y-3 border-t pt-3 mt-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-700 dark:text-gray-300">Business Description</h5>
                            {isOwnProfile && !editingBusinessDescription && (
                              <Button size="sm" variant="outline" onClick={handleEditBusinessDescription} className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          
                          {editingBusinessDescription ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Services Offered</label>
                                <Textarea
                                  value={businessDescriptionForm.services || ''}
                                  onChange={(e) => setBusinessDescriptionForm(prev => ({ ...prev, services: e.target.value }))}
                                  placeholder="Describe the services your business offers..."
                                  className="min-h-[60px]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What makes you special?</label>
                                <Textarea
                                  value={businessDescriptionForm.specialOffers || ''}
                                  onChange={(e) => setBusinessDescriptionForm(prev => ({ ...prev, specialOffers: e.target.value }))}
                                  placeholder="What makes your business unique and special..."
                                  className="min-h-[60px]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Customers</label>
                                <Textarea
                                  value={businessDescriptionForm.targetCustomers || ''}
                                  onChange={(e) => setBusinessDescriptionForm(prev => ({ ...prev, targetCustomers: e.target.value }))}
                                  placeholder="Who are your ideal customers..."
                                  className="min-h-[60px]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certifications</label>
                                <Textarea
                                  value={businessDescriptionForm.certifications || ''}
                                  onChange={(e) => setBusinessDescriptionForm(prev => ({ ...prev, certifications: e.target.value }))}
                                  placeholder="List any certifications or credentials..."
                                  className="min-h-[60px]"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveBusinessDescription} disabled={savingBusinessDescription}>
                                  {savingBusinessDescription ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button variant="outline" onClick={handleCancelEditBusinessDescription} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {user.services && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-400">Services Offered:</span>
                                  <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">{user.services}</p>
                                </div>
                              )}
                              
                              {user.specialOffers && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-400">What makes us special:</span>
                                  <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">{user.specialOffers}</p>
                                </div>
                              )}
                              
                              {user.targetCustomers && (
                                <div>
                                  <span className="font-medium text-gray-600">Target Customers:</span>
                                  <p className="ml-2 text-sm text-gray-700">{user.targetCustomers}</p>
                                </div>
                              )}
                              
                              {user.certifications && (
                                <div>
                                  <span className="font-medium text-gray-600">Certifications:</span>
                                  <p className="ml-2 text-sm text-gray-700">{user.certifications}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Military Status for Business */}
                      {(user.isVeteran || user.isActiveDuty) && (
                        <div className="space-y-2 border-t pt-3 mt-3">
                          <h5 className="font-medium text-gray-700">Military Status</h5>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Offers Section - Only for business users */}
            {user?.userType === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Business Offers & Deals</span>
                    {isOwnProfile && (
                      <Button 
                        size="sm" 
                        onClick={() => setLocation('/deals')}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Offer
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {businessOffersLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : businessOffers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No business offers created yet</p>
                      {isOwnProfile && (
                        <p className="text-sm mt-2">Create your first offer to attract customers!</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessOffers.slice(0, 3).map((offer: any) => (
                        <div key={offer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{offer.title}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {offer.discountValue} {offer.discountType === 'percentage' ? '%' : ''} off
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{offer.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Valid until {new Date(offer.validUntil).toLocaleDateString()}</span>
                            <span className="capitalize">{offer.category}</span>
                          </div>
                        </div>
                      ))}
                      {businessOffers.length > 3 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation('/deals')}
                          >
                            View All {businessOffers.length} Offers
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* What You Have in Common Section - MOVED TO ABOUT SECTION FOR BETTER VISIBILITY */}

            {/* Local Interests, Activities & Events Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Local Interests, Activities & Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Single Edit Button for All Preferences */}
                {isOwnProfile && !editingInterests && !editingActivities && !editingEvents && (
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={() => {
                        // Open ALL editing modes at once
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
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit All Preferences
                    </Button>
                  </div>
                )}

                {/* Unified Edit Form for All Preferences */}
                {isOwnProfile && (editingInterests && editingActivities && editingEvents) ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit All Preferences</h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            try {
                              console.log('🔧 SAVING DATA:', editFormData);
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
                          className="bg-green-600 hover:bg-green-700 text-white"
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
                              activities: user?.activities || [],
                              events: user?.events || []
                            });
                          }}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20"
                        >
                          Cancel All
                        </Button>
                      </div>
                    </div>
                    
                    {/* When editing all preferences, show the unified content */}
                    {editingInterests && editingActivities && editingEvents && (
                      <div className="space-y-6 mt-6">
                        {/* Top Interests Section */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Heart className="w-5 h-5 text-blue-500" />
                            Top Interests
                          </h4>
                          
                          {/* Top Choices for Most Travelers */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Top Choices for Most Travelers</h5>
                            <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900 dark:to-orange-900 rounded-lg">
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
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                      isSelected
                                        ? 'bg-green-600 text-white font-bold transform scale-105'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
                                    }`}
                                  >
                                    {interest}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* All Available Interests */}
                          <div>
                            <h5 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">All Available Interests</h5>
                            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
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
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                        </div>
                        
                        {/* Bottom Save/Cancel Buttons */}
                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
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
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
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
                                activities: user?.activities || [],
                                events: user?.events || []
                              });
                            }}
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 flex-1"
                          >
                            Cancel All
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}


                {/* Interests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Heart className="w-4 h-4 text-blue-500" />
                      Interests
                    </h4>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setEditingInterests(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingInterests && !(editingInterests && editingActivities && editingEvents) ? (
                    <div className="space-y-4">
                      {/* Top Choices for Most Travelers */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Top Choices for Most Travelers</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900 dark:to-orange-900 rounded-lg">
                          {MOST_POPULAR_INTERESTS.map((interest) => {
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
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Additional Interests */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">🔍 Additional Interests</h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
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
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white font-bold transform scale-105'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700'
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
                              if (trimmed && !tempInterests.includes(trimmed)) {
                                setTempInterests(prev => [...prev, trimmed]);
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
                            if (trimmed && !tempInterests.includes(trimmed)) {
                              setTempInterests([...tempInterests, trimmed]);
                              setCustomInterestInput('');
                            }
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {/* Show selected interests */}
                      {tempInterests.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Interests:</p>
                          <div className="flex flex-wrap gap-2">
                            {tempInterests.map((interest) => (
                              <Badge key={interest} className="bg-blue-100 text-blue-800 border-blue-300">
                                {interest}
                                <button
                                  onClick={() => setTempInterests(tempInterests.filter(i => i !== interest))}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </Badge>
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
                              {(user?.interests || []).length} interests selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const interests = user?.interests || [];
                              const topInterests = interests.slice(0, 8); // Show only first 8
                              const remaining = interests.length - 8;
                              
                              return (
                                <>
                                  {topInterests.map((interest, index) => (
                                    <Badge key={`interest-${index}`} className="bg-blue-500 text-white font-medium border-0">
                                      {interest}
                                    </Badge>
                                  ))}
                                  {remaining > 0 && (
                                    <Badge className="bg-gray-200 text-gray-600 font-medium border-0">
                                      +{remaining} more
                                    </Badge>
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      Activities
                    </h4>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setEditingActivities(true)}
                        className="bg-green-600 hover:bg-green-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
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
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                              if (trimmed && !tempActivities.includes(trimmed)) {
                                setTempActivities(prev => [...prev, trimmed]);
                                setCustomActivityInput('');
                              }
                            }
                          }}
                        />
                        <Button type="button" onClick={() => {
                          const trimmed = customActivityInput.trim();
                            if (trimmed && !tempActivities.includes(trimmed)) {
                              setTempActivities([...tempActivities, trimmed]);
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
                              <span key={`activity-${activity}-${index}`} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
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
                                    <Badge key={`activity-${index}`} className="bg-green-500 text-white font-medium border-0">
                                      {activity}
                                    </Badge>
                                  ))}
                                  {remaining > 0 && (
                                    <Badge className="bg-gray-200 text-gray-600 font-medium border-0">
                                      +{remaining} more
                                    </Badge>
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Events
                    </h4>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => setEditingEvents(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
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
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                              if (trimmed && !tempEvents.includes(trimmed)) {
                                setTempEvents(prev => [...prev, trimmed]);
                                setCustomEventInput('');
                              }
                            }
                          }}
                        />
                        <Button type="button" onClick={() => {
                          const trimmed = customEventInput.trim();
                            if (trimmed && !tempEvents.includes(trimmed)) {
                              setTempEvents([...tempEvents, trimmed]);
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
                              <span key={`event-${event}-${index}`} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
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
                                    <Badge key={`event-${index}`} className="bg-purple-500 text-white font-medium border-0">
                                      {event}
                                    </Badge>
                                  ))}
                                  {remaining > 0 && (
                                    <Badge className="bg-gray-200 text-gray-600 font-medium border-0">
                                      +{remaining} more
                                    </Badge>
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


            {/* Things I Want to Do Widget - Show for all non-business profiles */}
            {user?.userType !== 'business' && (
              <ThingsIWantToDoSection
                userId={effectiveUserId || 0}
                isOwnProfile={isOwnProfile}
              />
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
                          className="bg-travel-blue hover:bg-travel-blue/90 text-white"
                        >
                          Add New Trip
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
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{plan.destination}</h4>
                                {plan.status === 'active' && (
                                  <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                                    ✈️ Currently Traveling
                                  </Badge>
                                )}
                                {plan.status === 'planned' && (
                                  <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                                    📅 Upcoming
                                  </Badge>
                                )}
                              </div>
                              <p className="text-black dark:text-white text-xs mb-1 font-medium">
                                {plan.startDate ? formatDateForDisplay(plan.startDate, user?.hometownCity || 'UTC') : 'Start date TBD'} - {plan.endDate ? formatDateForDisplay(plan.endDate, user?.hometownCity || 'UTC') : 'End date TBD'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {isOwnProfile && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/plan-trip?edit=${plan.id}`);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600 h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/itinerary/${plan.id}`);
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:opacity-90 h-6 text-xs px-2"
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Itinerary
                                  </Button>
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
                              <div className="flex flex-wrap gap-1">
                                {(expandedPlanInterests.has(plan.id) ? plan.interests : plan.interests.slice(0, 2)).map((interest: string) => (
                                  <Badge key={interest} className={`text-xs ${getInterestStyle(interest)}`}>
                                    {interest}
                                  </Badge>
                                ))}
                                {plan.interests.length > 2 && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs dark:bg-gray-800 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {plan.travelStyle && plan.travelStyle.length > 0 && (
                            <div>
                              <div className="flex flex-wrap gap-1">
                                {plan.travelStyle.slice(0, 2).map((style: string) => (
                                  <Badge key={style} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                                    {style}
                                  </Badge>
                                ))}
                                {plan.travelStyle.length > 2 && (
                                  <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300">
                                    +{plan.travelStyle.length - 2} more
                                  </Badge>
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
                                  <Badge className="bg-gray-500 text-white text-xs px-2 py-0.5">
                                    ✓ Completed
                                  </Badge>
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
                                <div className="flex flex-wrap gap-1">
                                  {(expandedPlanInterests.has(plan.id) ? plan.interests : plan.interests.slice(0, 2)).map((interest: string) => (
                                    <Badge key={interest} className="text-xs bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                      {interest}
                                    </Badge>
                                  ))}
                                  {plan.interests.length > 2 && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs dark:bg-gray-800 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {plan.travelStyle && plan.travelStyle.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-1">
                                  {plan.travelStyle.slice(0, 2).map((style: string) => (
                                    <Badge key={style} variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                                      {style}
                                    </Badge>
                                  ))}
                                  {plan.travelStyle.length > 2 && (
                                    <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300">
                                      +{plan.travelStyle.length - 2} more
                                    </Badge>
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



            {/* Photo Gallery */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photos ({photos.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                    onClick={() => setLocation('/photos')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    View Gallery
                  </Button>
                  {isOwnProfile && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => setLocation('/upload-photos')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadingPhoto ? 'Uploading...' : 'Quick Add'}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="aspect-square cursor-pointer rounded-lg overflow-hidden relative group"
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <img 
                          src={photo.imageUrl} 
                          alt={photo.caption || 'Travel photo'}
                          className="w-full h-full object-cover"
                        />
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 w-8 h-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-white">No photos yet</p>
                    {isOwnProfile && (
                      <p className="text-sm text-gray-600 dark:text-white">Share your travel memories!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {/* Quick Meetup Widget - Only show for own profile */}
            {isOwnProfile && user?.userType !== 'business' && (
              <div className="mt-6">
                <QuickMeetupWidget city={user?.hometownCity ?? ''} profileUserId={user?.id} />
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
                <CardContent className="space-y-4">
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



            {/* Current Connections Widget - Visible to all - MOVED UNDER TRAVEL STATS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
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
                      {showConnectionFilters ? "Hide Filters" : "Filter"}
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
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {userConnections.length > 0 ? (
                  <div className="space-y-3">
                    {userConnections.slice(0, connectionsDisplayCount).map((connection: any) => (
                      <div key={connection.id} className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors flex-1"
                          onClick={() => setLocation(`/profile/${connection.connectedUser?.id}`)}
                        >
                          <SimpleAvatar 
                            user={connection.connectedUser} 
                            size="md" 
                            className="flex-shrink-0"
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{connection.connectedUser?.username || connection.connectedUser?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {connection.connectedUser?.location || "Location not set"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/profile/${connection.connectedUser?.id}`)}
                          className="h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                    
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
            






            {/* References Widget */}
            {user?.id && (
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReferencesWidgetNew userId={user.id} />
                </CardContent>
              </Card>
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
                          onClick={() => setLocation(`/profile/${request.requesterUser?.id}`)}
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
                            className="h-7 w-16 px-2 text-xs"
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
                            className="h-7 w-16 px-2 text-xs"
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


            {/* Countries Visited - Hidden for business profiles */}
            {user?.userType !== 'business' && (
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
                      <MultiSelect
                        options={COUNTRIES_OPTIONS}
                        selected={tempCountries}
                        onChange={setTempCountries}
                        placeholder="Select countries visited"
                      />
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
                            <Badge 
                              key={country} 
                              className="bg-blue-500 text-white border-0 px-4 py-2 text-sm font-medium whitespace-nowrap min-w-[100px] h-9 flex items-center justify-center"
                            >
                              {country}
                            </Badge>
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

            {/* Languages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Languages I Speak</CardTitle>
                  {isOwnProfile && !editingLanguages && (
                    <Button size="sm" variant="outline" onClick={handleEditLanguages}>
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingLanguages ? (
                  <div className="space-y-3">
                    <MultiSelect
                      options={LANGUAGES_OPTIONS}
                      selected={tempLanguages}
                      onChange={setTempLanguages}
                      placeholder="Select languages"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveLanguages} disabled={updateLanguages.isPending}>
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
                          <Badge key={language} variant="secondary" className="text-sm">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No languages listed</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Comprehensive Geolocation System - Enhanced location sharing for users, businesses, and events */}
            {isOwnProfile && (
              <LocationSharingWidget />
            )}

            {/* Business Referral Program Widget */}
            {isOwnProfile && user && user.userType !== 'business' && (
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setLocation('/referrals')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Business Referral Program
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation('/referrals');
                      }}
                      className="ml-auto bg-green-600 hover:bg-green-700 text-white border-0"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 dark:bg-green-900 border-2 border-green-600 dark:border-green-500 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 text-lg font-bold text-center">
                      💰 Earn $100 for Referring Businesses to Nearby Traveler!!*
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm mt-2 text-center">
                      Help fund your trips • Get deals from local hotspots • Earn extra income
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm mt-1 text-center">
                      Share your Favorite Businesses with others and help them market to Nearby Travelers and Nearby Locals
                    </p>
                    <p className="text-green-500 dark:text-green-500 text-xs mt-2 text-center italic">
                      (* When a Business Becomes a Paying Client)
                    </p>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">Invite businesses to join Nearby Traveler and earn rewards when they subscribe!</p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation('/referrals');
                      }}
                      className="bg-gradient-to-r from-blue-500 via-orange-500 to-violet-500 hover:from-blue-600 hover:via-orange-600 hover:to-violet-600 text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Manage Referrals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Boost Connections Widget - MOVED TO BOTTOM - Only show for own profile */}
            {isOwnProfile && (
              <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/30 dark:to-blue-900/30 hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <Badge variant="default" className="bg-orange-600 text-white">Success Tips</Badge>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm font-bold">I am a Veteran</span>
                      </label>
                    )}
                  />
                </div>

                {/* I am active duty checkbox */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm font-bold">I am active duty</span>
                      </label>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {getAllInterests().map((interest, index) => (
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
              </div>

              {/* Activities Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Activities on This Trip
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50">
                  {getAllActivities().map((activity, index) => {
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
              </div>

              {/* Events Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Events on This Trip
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {getAllEvents().map((event, index) => (
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

      {/* Profile Edit Modal */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="w-[calc(100vw-16px)] max-w-[calc(100vw-16px)] md:max-w-2xl max-h-[80vh] md:max-h-[90vh] overflow-y-auto mx-2 md:mx-auto p-3 md:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Profile</DialogTitle>
              <Button
                type="button"
                size="sm"
                onClick={profileForm.handleSubmit(onSubmitProfile)}
                disabled={editProfile.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
              {user?.userType === 'business' && (
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
              )}
              
              {user?.userType === 'business' ? (
                <FormField
                  control={profileForm.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your business, services, and what makes you special..."
                          className="min-h-[100px] resize-none"
                          maxLength={1000}
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 text-right">
                        {field.value?.length || 0}/1000 characters
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
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
                          className="min-h-[100px] resize-none"
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
              )}

              {user?.userType !== 'business' && (
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
                          className="min-h-[80px] resize-none"
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
              )}

              {/* Family Travel Section - Rebuilt like Sexual Preferences */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Family Travel
                  </h3>
                  
                  <FormField
                    control={profileForm.control}
                    name="travelingWithChildren"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Are you traveling with children?</FormLabel>
                        <FormControl>
                          <div className="space-y-2 border rounded-md p-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="traveling-with-children"
                                checked={!!field.value}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  field.onChange(checked);
                                  if (!checked) {
                                    // Clear ages when unchecked
                                    profileForm.setValue('childrenAges', '');
                                  }
                                }}
                                className="h-4 w-4 border-gray-300 rounded text-purple-600 focus:ring-purple-500"
                                data-testid="checkbox-traveling-with-children"
                              />
                              <label 
                                htmlFor="traveling-with-children" 
                                className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                              >
                                Yes, I'm traveling with children
                              </label>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Children Ages Field - Only show if traveling with children is checked */}
                  {profileForm.watch('travelingWithChildren') && (
                    <FormField
                      control={profileForm.control}
                      name="childrenAges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Children's Ages</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 3, 7, 12"
                              {...field}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the ages of your children (separated by commas)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <div className="space-y-4">
                <FormLabel>Hometown Location ** ONLY CHANGE IF YOU MOVE **</FormLabel>
                <SmartLocationInput
                  city={profileForm.watch('hometownCity') || ''}
                  state={profileForm.watch('hometownState') || ''}
                  country={profileForm.watch('hometownCountry') || ''}
                  onLocationChange={(location) => {
                    profileForm.setValue('hometownCountry', location.country);
                    profileForm.setValue('hometownState', location.state);
                    profileForm.setValue('hometownCity', location.city);
                  }}
                  required={false}
                  placeholder={{
                    country: "Select your hometown country",
                    state: "Select your hometown state/region", 
                    city: "Select your hometown city"
                  }}
                />
              </div>

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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                            {GENDER_OPTIONS.map((gender) => (
                              <SelectItem key={gender} value={gender} className="dark:text-white dark:hover:bg-gray-700">
                                {gender}
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
                    name="sexualPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexual Preference (Select all that apply)</FormLabel>
                        <FormControl>
                          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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

              {/* Business Contact Information - Only show for business users */}
              {user?.userType === 'business' && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Business Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="streetAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main Street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="10001" />
                            </FormControl>
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
                              <Input {...field} placeholder="(555) 123-4567" />
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
                              <Input {...field} placeholder="https://www.yourbusiness.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Military Status for Business */}
                    <div className="space-y-4 border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Military Status</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="isVeteran"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Veteran Owned Business</FormLabel>
                                <div className="text-sm text-gray-500">
                                  Check if your business is veteran-owned
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="isActiveDuty"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Active Duty Owned Business</FormLabel>
                                <div className="text-sm text-gray-500">
                                  Check if your business is active duty-owned
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Military Status Section - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Military Status</h3>
                  
                  {/* Veteran Status */}
                  <FormField
                    control={profileForm.control}
                    name="isVeteran"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>I am a Veteran</FormLabel>
                          <div className="text-sm text-gray-500">
                            Check if you have served in the military and are now a veteran
                          </div>
                        </div>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = !field.value;
                              field.onChange(newValue);
                              // If setting veteran to true, set active duty to false
                              if (newValue) {
                                profileForm.setValue('isActiveDuty', false);
                              }
                            }}
                            className={`flex items-center gap-2 ${field.value ? 'bg-red-100 border-red-300 text-red-700' : ''}`}
                          >
                            {field.value ? '✓ Veteran' : 'Not Veteran'}
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Active Duty Status */}
                  <FormField
                    control={profileForm.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>I am Active Duty</FormLabel>
                          <div className="text-sm text-gray-500">
                            Check if you are currently serving in the military on active duty
                          </div>
                        </div>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = !field.value;
                              field.onChange(newValue);
                              // If setting active duty to true, set veteran to false
                              if (newValue) {
                                profileForm.setValue('isVeteran', false);
                              }
                            }}
                            className={`flex items-center gap-2 ${field.value ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
                          >
                            {field.value ? '✓ Active Duty' : 'Not Active Duty'}
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              )}

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
                <Badge variant="outline" className="text-sm">
                  Trip Details
                </Badge>
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
                      <Badge key={interest} variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 justify-center">
                        {interest}
                      </Badge>
                    ))}
                    {selectedTravelPlan.interests.length > 9 && (
                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 justify-center">
                        +{selectedTravelPlan.interests.length - 9} more
                      </Badge>
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
                      <Badge key={activity} variant="secondary" className="text-xs bg-green-900 text-green-200 border-green-700 justify-center">
                        {activity}
                      </Badge>
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
                      <Badge key={event} variant="secondary" className="text-xs bg-purple-900 text-purple-200 border-purple-700 justify-center">
                        {event}
                      </Badge>
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
                      <Badge key={style} variant="secondary" className="text-xs bg-orange-900 text-orange-200 border-orange-700 justify-center">
                        {style}
                      </Badge>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
                        className="min-h-[100px]"
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
                        className="min-h-[100px]"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isOwnProfile ? 'Your City Chatrooms' : `${user?.username}'s City Chatrooms`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {userChatrooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No city chatrooms yet</p>
                {isOwnProfile && (
                  <p className="text-sm mt-2">Join some city chatrooms to connect with locals and travelers!</p>
                )}
              </div>
            ) : (
              userChatrooms.map((chatroom: any) => (
                <div 
                  key={chatroom.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowChatroomList(false);
                    setLocation(`/simple-chatroom/${chatroom.id}`);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {chatroom.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      📍 {chatroom.city}
                      {chatroom.role === 'admin' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                    {chatroom.member_count} members
                  </div>
                </div>
              ))
            )}
          </div>
          {userChatrooms.length > 0 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChatroomList(false);
                  setLocation('/city-chatrooms');
                }}
              >
                View All City Chatrooms
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

// Main export with error boundary
export default function EnhancedProfile(props: EnhancedProfileProps) {
  return (
    <ProfileErrorBoundary>
      <ProfileContent {...props} />
    </ProfileErrorBoundary>
  );
}