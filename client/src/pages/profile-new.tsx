import React, { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2,
  Edit2,
  UserPlus,
  Camera
} from "lucide-react";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { calculateAge } from "@/lib/ageUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import WorldMap from "@/components/world-map";
import FriendReferralWidget from "@/components/friend-referral-widget";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ProfileNewProps {
  userId?: string;
}

export default function ProfileNew({ userId: propUserId }: ProfileNewProps) {
  const [, setLocation] = useLocation();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("about");
  
  // Initialize toast hook immediately - must be called before any early returns
  const { toast } = useToast();

  // Determine which user profile to show
  const profileUserId = propUserId || paramUserId || currentUser?.id?.toString();
  const isOwnProfile = profileUserId === currentUser?.id?.toString();

  // For own profile when no specific userId is provided, use the current user data directly
  const shouldFetchUser = profileUserId && profileUserId !== currentUser?.id?.toString();
  
  // Fetch user data only for other users' profiles
  const { data: fetchedUser, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: shouldFetchUser && !!profileUserId,
  });

  // Use fetched user data if available, otherwise use current user
  const displayUser = fetchedUser || currentUser;

  // Fetch user's travel plans
  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch countries visited
  const { data: countriesVisited = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/passport-stamps`],
    enabled: !!profileUserId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This user profile doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const currentTravelDestination = getCurrentTravelDestination(travelPlans || []);
  const isCurrentlyTraveling = !!currentTravelDestination;
  const userAge = displayUser?.dateOfBirth ? calculateAge(displayUser.dateOfBirth) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Back Button */}
      <div className="lg:hidden p-4">
        <Button variant="ghost" onClick={() => setLocation('/')}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Couchsurfing Style */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-blue-500 to-orange-500 text-white border-0 mb-6">
              <CardContent className="p-6 text-center">
                {/* Status Badge */}
                {isCurrentlyTraveling ? (
                  <Badge className="bg-green-500 text-white text-xs mb-4">
                    Currently Traveling
                  </Badge>
                ) : (
                  <Badge className="bg-blue-600 text-white text-xs mb-4">
                    {displayUser.userType === 'local' ? 'Local Host' : 'Available to Meet'}
                  </Badge>
                )}

                {/* Profile Photo */}
                <div className="relative mb-4">
                  <SimpleAvatar
                    user={displayUser}
                    size="xl"
                    className="w-64 h-64 mx-auto border-4 border-white/20"
                  />
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-2 bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* User Name and Type */}
                <h1 className="text-2xl font-bold mb-2">{displayUser.username}</h1>
                <p className="text-white/90 mb-4">
                  {isCurrentlyTraveling ? (
                    `Nearby Traveler • ${currentTravelDestination}`
                  ) : (
                    `Nearby Local • ${displayUser.hometownCity}`
                  )}
                </p>

                
                {isOwnProfile && (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setLocation('/profile')}
                      className="w-full bg-white text-blue-600 hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    
                    {/* Navigation buttons for own profile */}
                    <div className="flex items-center gap-2">
                      {displayUser && (displayUser?.hometownCity || displayUser?.location) && (
                        <Button
                          onClick={() => {
                            const chatCity = displayUser?.hometownCity || displayUser?.location?.split(',')[0] || 'General';
                            setLocation(`/city-chatrooms?city=${encodeURIComponent(chatCity)}`);
                          }}
                          className="flex-1 bg-black hover:bg-gray-800 text-white border-0 shadow-sm rounded-lg px-3 py-2 text-sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1 shrink-0" />
                          <span className="truncate">Go to Chatrooms</span>
                        </Button>
                      )}
                      <Button
                        onClick={() => setLocation('/share-qr')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 shadow-sm rounded-lg px-3 py-2 text-sm"
                        data-testid="button-share-qr-code"
                      >
                        <Share2 className="w-4 h-4 mr-1 shrink-0" />
                        <span className="truncate">Share QR</span>
                      </Button>
                    </div>
                    
                    {/* Friend Invite Button */}
                    <Button
                      onClick={() => setLocation('/share-qr')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friend Referral Widget - Only for non-business users */}
            {displayUser?.userType !== 'business' && (
              <div className="mb-6">
                <FriendReferralWidget />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* About Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About {displayUser.username}</h2>
                
                {displayUser.bio ? (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{displayUser.bio}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic mb-4">No bio added yet</p>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {userAge && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Age:</span>
                      <span className="ml-2">{userAge}</span>
                    </div>
                  )}
                  {displayUser.hometownCity && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">From:</span>
                      <span className="ml-2">{displayUser.hometownCity}, {displayUser.hometownState || displayUser.hometownCountry}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Member since:</span>
                    <span className="ml-2">{displayUser.createdAt ? formatDateForDisplay(displayUser.createdAt) : 'Recently'}</span>
                  </div>
                  {displayUser.languages && displayUser.languages.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Languages:</span>
                      <span className="ml-2">{displayUser.languages.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Interests */}
                {displayUser.interests && displayUser.interests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.interests.slice(0, 10).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {displayUser.interests.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{displayUser.interests.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* World Map Component for passport stamps */}
            {countriesVisited && countriesVisited.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Countries Visited</h2>
                  <WorldMap 
                    visitedCountries={countriesVisited.map(stamp => stamp.country)}
                    onCountryClick={(country) => {
                      console.log('Country clicked:', country);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Boost Your Connections Widget */}
            <Card>
              <CardContent className="p-6 text-center bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <h3 className="text-lg font-semibold mb-2">Boost Your Connections</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete your profile and get verified to connect with more travelers
                </p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="text-xs">Profile: 75%</Badge>
                  <Badge variant="outline" className="text-xs">Verified: 33%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}