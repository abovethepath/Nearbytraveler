import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { useIsMobile, useIsDesktop } from "@/hooks/useDeviceType";
import UserCard from "@/components/user-card";
import EventCard from "@/components/event-card";
import MessagePreview from "@/components/message-preview";
import DestinationModal from "@/components/destination-modal";
import ConnectModal from "@/components/connect-modal";
import Recommendations from "@/components/recommendations";
import AIChatBot from "@/components/ai-chat-bot";
import NotificationBell from "@/components/notification-bell";
import { EmbeddedChatWidget } from "@/components/EmbeddedChatWidget";

import { datesOverlap, formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { format } from "date-fns";
import { getVersionedCityImage } from "@/lib/imageVersioning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Globe, Users, MapPin, Briefcase, Calendar, Filter, X, ChevronDown, ChevronRight, MessageCircle, Camera, Search, Store, Hash, Tag, AlertCircle, ArrowUpDown, Clock, Zap, Star, Coffee, Phone, Crown, Plane, ExternalLink, Heart, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getAllInterests, getAllActivities, getAllEvents, getAllLanguages, validateSelections, getMostPopularInterests } from "../../../shared/base-options";
import { BASE_TRAVELER_TYPES } from "../../../shared/base-options";
import { getInterestStyle, getActivityStyle, getEventStyle } from "@/lib/topChoicesUtils";
import type { User, Event, Message } from "@shared/schema";
import SmartPhotoGallery from "@/components/smart-photo-gallery";
import SmartLocationInput from "@/components/SmartLocationInput";
import AICityEventsWidget from "@/components/ai-city-events";
import TravelMatches from "@/components/travel-matches";
import ResponsiveUserGrid from "@/components/ResponsiveUserGrid";
import { SimpleAvatar } from "@/components/simple-avatar";
import MessagesWidget from "@/components/MessagesWidget";
import EventsWidget from "@/components/EventsWidget";
import CurrentLocationWeatherWidget from "@/components/CurrentLocationWeatherWidget";
import EnhancedDiscovery from "@/components/EnhancedDiscovery";
import BusinessesGrid from "@/components/BusinessesGrid";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import QuickDealsDiscovery from "@/components/QuickDealsDiscovery";
import CityMap from "@/components/CityMap";
import PeopleDiscoveryWidget from "@/components/PeopleDiscoveryWidget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import centralized constants for consistency
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES } from "@/lib/formConstants";

const USER_TYPE_OPTIONS = [
  "traveler", "local", "business"
];

// Enhanced User Grid Component (integrated)
function EnhancedUserGrid({ users, currentUser, onUserClick }) {
  const calculateThingsInCommon = (user) => {
    if (!currentUser || user.id === currentUser.id) return 0;
    
    const currentInterests = new Set(currentUser.interests || []);
    const currentActivities = new Set(currentUser.activities || []);
    const currentEvents = new Set(currentUser.localEvents || []);
    
    const userInterests = user.interests || [];
    const userActivities = user.activities || [];
    const userEvents = user.localEvents || [];
    
    let commonCount = 0;
    
    userInterests.forEach(interest => {
      if (currentInterests.has(interest)) commonCount++;
    });
    
    userActivities.forEach(activity => {
      if (currentActivities.has(activity)) commonCount++;
    });
    
    userEvents.forEach(event => {
      if (currentEvents.has(event)) commonCount++;
    });
    
    return commonCount;
  };

  const formatLocation = (city, state, country) => {
    if (!city) return 'Unknown Location';
    
    const parts = [city];
    if (state) parts.push(state);
    if (country && country !== state) parts.push(country);
    
    return parts.join(', ');
  };

  const sortedUsers = React.useMemo(() => {
    const otherUsers = users.filter(user => user.id !== currentUser?.id);
    const usersWithCommonality = otherUsers.map(user => ({
      ...user,
      thingsInCommon: calculateThingsInCommon(user)
    })).sort((a, b) => b.thingsInCommon - a.thingsInCommon);
    
    return currentUser ? [{ ...currentUser, thingsInCommon: 0 }, ...usersWithCommonality] : usersWithCommonality;
  }, [users, currentUser]);

  const UserCardEnhanced = ({ user, isCurrentUser }) => (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={() => onUserClick?.(user)}
    >
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-blue-500 text-white p-1 rounded-full">
            <Crown className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-3">
          <Avatar className="w-16 h-16 ring-2 ring-gray-200 dark:ring-gray-700">
            <AvatarImage src={user.profileImage} alt={`${user.username}'s avatar`} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg">
              {user.username?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mb-2">
          <p className="font-semibold text-gray-900 dark:text-white" style={{fontSize: '12pt'}}>
            @{user.username}
            {isCurrentUser && <span className="text-blue-500 ml-1">(You)</span>}
          </p>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="w-3 h-3" />
            <span className="truncate" style={{fontSize: '12pt'}}>
              {formatLocation(user.hometownCity, user.hometownState, user.hometownCountry)}
            </span>
          </div>
        </div>

        {user.isCurrentlyTraveling && user.travelDestination && (
          <div className="mb-2">
            <div className="flex items-center justify-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
              <Plane className="w-3 h-3" />
              <span className="truncate font-medium" style={{fontSize: '12pt'}}>
                {user.travelDestination}
              </span>
            </div>
          </div>
        )}

        {!isCurrentUser && (
          <div className="mt-3">
            <Badge variant="secondary" style={{fontSize: '12pt'}}>
              <Hash className="w-3 h-3 mr-1" />
              {user.thingsInCommon} things in common
            </Badge>
          </div>
        )}

        {isCurrentUser && (
          <div className="mt-3">
            <Badge className="bg-blue-500 text-white" style={{fontSize: '12pt'}}>
              That's You!
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedUsers.map((user) => (
          <UserCardEnhanced 
            key={user.id} 
            user={user} 
            isCurrentUser={user.id === currentUser?.id}
          />
        ))}
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No users found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeLocationFilter, setActiveLocationFilter] = useState("");
  const [connectModalMode, setConnectModalMode] = useState('current');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  const { user, setUser } = useContext(AuthContext);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Helper function to get current user location for widgets
  const getCurrentUserLocation = () => {
    const effectiveUser = user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('travelconnect_user') || '{}') : null);

    if (effectiveUser?.isCurrentlyTraveling && effectiveUser?.travelDestination) {
      return effectiveUser.travelDestination;
    }

    if (effectiveUser?.hometownCity && effectiveUser?.hometownState && effectiveUser?.hometownCountry) {
      return `${effectiveUser.hometownCity}, ${effectiveUser.hometownState}, ${effectiveUser.hometownCountry}`;
    }

    if (effectiveUser?.hometownCity) {
      return effectiveUser.hometownCity;
    }

    return effectiveUser?.location || 'Unknown';
  };

  // Function to sort users based on selected sorting option
  const getSortedUsers = (users) => {
    if (!users) return [];

    return [...users].sort((a, b) => {
      switch (sortBy) {
        case 'closest_nearby':
          const currentUser = user || JSON.parse(localStorage.getItem('travelconnect_user') || '{}');
          const currentCity = currentUser?.hometownCity?.toLowerCase() || '';
          const currentState = currentUser?.hometownState?.toLowerCase() || '';
          const currentCountry = currentUser?.hometownCountry?.toLowerCase() || '';

          const getProximityScore = (user) => {
            const userCity = user.hometownCity?.toLowerCase() || '';
            const userState = user.hometownState?.toLowerCase() || '';
            const userCountry = user.hometownCountry?.toLowerCase() || '';

            if (userCity === currentCity) return 100;
            if (userState === currentState) return 50;
            if (userCountry === currentCountry) return 25;
            return 0;
          };

          return getProximityScore(b) - getProximityScore(a);
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'active':
          return new Date(b.lastLocationUpdate || b.createdAt || 0).getTime() - new Date(a.lastLocationUpdate || a.createdAt || 0).getTime();
        case 'aura':
          return (b.aura || 0) - (a.aura || 0);
        case 'references':
          const aReferences = a.references?.length || 0;
          const bReferences = b.references?.length || 0;
          return bReferences - aReferences;
        case 'compatibility':
          const aShared = (a.interests?.length || 0) + (a.activities?.length || 0);
          const bShared = (b.interests?.length || 0) + (b.activities?.length || 0);
          return bShared - aShared;
        case 'travel_experience':
          const aCountries = a.countriesVisited?.length || 0;
          const bCountries = b.countriesVisited?.length || 0;
          return bCountries - aCountries;
        case 'alphabetical':
          return (a.username || '').localeCompare(b.username || '');
        default:
          return 0;
      }
    });
  };

  // Auto-populate filters with user's preferences when advanced filters open
  useEffect(() => {
    if (showAdvancedFilters && user) {
      // Auto-populate logic can be added here
    }
  }, [showAdvancedFilters, user]);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const filtersRef = useRef(null);

  // Fetch data using React Query
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!user
  });

  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['/api/businesses'],
    enabled: !!user
  });

  // For demonstration, let's create some filtered data
  const filteredUsers = users;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced User Grid - Current user first, 3-4 across */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Travel Community
            </h2>
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="active">Recently Active</SelectItem>
                  <SelectItem value="closest_nearby">Closest to Me</SelectItem>
                  <SelectItem value="compatibility">Most Compatible</SelectItem>
                  <SelectItem value="travel_experience">Travel Experience</SelectItem>
                  <SelectItem value="aura">Travel Aura</SelectItem>
                  <SelectItem value="references">Most References</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <EnhancedUserGrid 
            users={getSortedUsers(filteredUsers)} 
            currentUser={user}
            onUserClick={(selectedUser) => setLocation(`/profile/${selectedUser.id}`)}
          />
        </div>

        {/* Local Businesses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Briefcase className="w-6 h-6 mr-2" />
              Local Businesses
            </h2>
            <Button variant="outline" onClick={() => setLocation('/businesses')}>
              View All
            </Button>
          </div>
          
          <BusinessesGrid 
            businesses={businesses}
            currentUserLocation={getCurrentUserLocation()}
            showViewAll={false}
          />
        </div>

        {/* Community Events */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Community Events
            </h2>
            <Button variant="outline" onClick={() => setLocation('/events')}>
              View All
            </Button>
          </div>
          
          <EventsWidget 
            events={events}
            currentUserLocation={getCurrentUserLocation()}
            showUserEvents={true}
            currentUser={user}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Meetup Widget */}
          <QuickMeetupWidget user={user} />
          
          {/* Current Weather */}
          <CurrentLocationWeatherWidget user={user} />
          
          {/* Messages Preview */}
          <MessagesWidget user={user} />
        </div>

        {/* Enhanced Discovery Section */}
        <div className="mb-8">
          <EnhancedDiscovery 
            currentUserLocation={getCurrentUserLocation()}
            user={user}
          />
        </div>

        {/* Quick Deals Discovery */}
        <div className="mb-8">
          <QuickDealsDiscovery 
            currentUserLocation={getCurrentUserLocation()}
            user={user}
          />
        </div>

        {/* People Discovery Widget */}
        <div className="mb-8">
          <PeopleDiscoveryWidget 
            currentUserLocation={getCurrentUserLocation()}
            user={user}
          />
        </div>

        {/* AI City Events */}
        <div className="mb-8">
          <AICityEventsWidget 
            currentUserLocation={getCurrentUserLocation()}
            user={user}
          />
        </div>

        {/* Travel Matches */}
        <div className="mb-8">
          <TravelMatches user={user} />
        </div>

        {/* City Map */}
        <div className="mb-8">
          <CityMap 
            currentUserLocation={getCurrentUserLocation()}
            users={users}
            businesses={businesses}
            events={events}
          />
        </div>
      </div>

      {/* Modals */}
      <DestinationModal 
        isOpen={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          setShowDestinationModal(false);
        }}
      />

      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        mode={connectModalMode}
        searchLocation={activeLocationFilter}
        user={user}
      />

      {/* AI Chat Bot */}
      <AIChatBot user={user} />
      
      {/* Embedded Chat Widget */}
      <EmbeddedChatWidget user={user} />
    </div>
  );
}