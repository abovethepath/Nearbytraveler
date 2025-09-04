import React, { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2,
  Edit2,
  UserPlus,
  Camera,
  MapPin,
  Globe,
  Users,
  Calendar,
  Heart,
  Star,
  Settings,
  Upload,
  Eye,
  Package,
  TrendingUp,
  Phone,
  Plane,
  Shield,
  ChevronRight
} from "lucide-react";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { calculateAge } from "@/lib/ageUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import WorldMap from "@/components/world-map";
import FriendReferralWidget from "@/components/friend-referral-widget";
import { LocationSharingSection } from "@/components/LocationSharingSection";
import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { QuickDealsWidget } from "@/components/QuickDealsWidget";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";
import ReferencesWidgetNew from "@/components/references-widget-new";
import { VouchWidget } from "@/components/vouch-widget";
import BusinessEventsWidget from "@/components/business-events-widget";
import { WhatYouHaveInCommon } from "@/components/what-you-have-in-common";
import { CustomerUploadedPhotos } from "@/components/customer-uploaded-photos";
import ReferralWidget from "@/components/referral-widget";
import { BlockUserButton } from "@/components/block-user-button";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ProfileCompleteProps {
  userId?: string;
}

export default function ProfileComplete({ userId: propUserId }: ProfileCompleteProps) {
  const [, setLocation] = useLocation();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useContext(AuthContext);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about");

  // Determine which user profile to show
  const profileUserId = propUserId || paramUserId || currentUser?.id?.toString();
  const isOwnProfile = profileUserId === currentUser?.id?.toString();

  // For own profile when no specific userId is provided, use the current user data directly
  const shouldFetchUser = profileUserId && profileUserId !== currentUser?.id?.toString();
  
  // Fetch user data only for other users' profiles
  const { data: fetchedUser, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: Boolean(shouldFetchUser && profileUserId),
  });

  // Use fetched user data if available, otherwise use current user
  const displayUser: User | null = fetchedUser || currentUser;

  // Fetch ALL the data that the original profile uses
  const { data: travelPlans = [] } = useQuery({
    queryKey: [`/api/travel-plans-with-itineraries/${profileUserId}`],
    enabled: !!profileUserId,
  });

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

  const { data: userEvents = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/all-events`],
    enabled: !!profileUserId,
  });

  const { data: organizedEvents = [] } = useQuery({
    queryKey: [`/api/events/organizer/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: userInterests = [] } = useQuery({
    queryKey: [`/api/user-city-interests/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: userEventInterests = [] } = useQuery({
    queryKey: [`/api/user-event-interests/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: travelMemories = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/travel-memories`],
    enabled: !!profileUserId,
  });

  const { data: photoAlbums = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/photo-albums`],
    enabled: !!profileUserId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
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

  const currentTravelDestination = getCurrentTravelDestination(Array.isArray(travelPlans) ? travelPlans : []);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar - Couchsurfing Style */}
          <div className="lg:col-span-1">
            {/* Main Profile Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-white text-center">
                {/* Profile Photo */}
                <div className="relative inline-block mb-4">
                  <SimpleAvatar
                    user={displayUser}
                    size="xl"
                    className="w-24 h-24 border-4 border-white shadow-lg rounded-full"
                  />
                  {isCurrentlyTraveling && (
                    <div className="absolute -bottom-1 -right-1">
                      <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3 mr-1" />
                        Traveling
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Name and Username */}
                <h1 className="text-2xl font-bold mb-1">{displayUser?.username}</h1>
                
                {/* Location Status - EXACT format requested */}
                <div className="text-orange-100 mb-3">
                  {isCurrentlyTraveling && currentTravelDestination ? (
                    <span className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Nearby Traveler • {(currentTravelDestination as any).destinationCity}, {(currentTravelDestination as any).destinationState || (currentTravelDestination as any).destinationCountry}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {displayUser?.currentCity || displayUser?.hometownCity || 'Location not set'}
                      {displayUser?.currentState && `, ${displayUser.currentState}`}
                      {displayUser?.currentCountry && `, ${displayUser.currentCountry}`}
                    </span>
                  )}
                </div>

                {/* Age and Hometown */}
                <div className="text-orange-100 text-sm mb-4">
                  {userAge && <span>Age {userAge}</span>}
                  {userAge && displayUser?.hometownCity && <span> • </span>}
                  {displayUser?.hometownCity && (
                    <span>From {displayUser.hometownCity}, {displayUser.hometownState || displayUser.hometownCountry}</span>
                  )}
                </div>

                {/* Action Buttons - NO Send Message or Connect buttons as requested */}
                {isOwnProfile ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setLocation('/edit-profile')}
                      variant="secondary" 
                      className="w-full bg-white text-orange-600 hover:bg-gray-100"
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    
                    <Button 
                      onClick={() => setLocation('/chatrooms')}
                      variant="outline" 
                      className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600"
                      data-testid="button-join-chatrooms"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Join Chatrooms
                    </Button>

                    <Button
                      onClick={() => setLocation('/share-qr')}
                      variant="outline" 
                      className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600"
                      data-testid="button-invite-friends"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => setLocation('/chatrooms')}
                      variant="secondary" 
                      className="w-full bg-white text-orange-600 hover:bg-gray-100"
                      data-testid="button-join-chatrooms"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Join Chatrooms
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Stats */}
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{Array.isArray(connections) ? connections.length : 0}</div>
                    <div className="text-xs text-gray-500">Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{Array.isArray(references) ? references.length : 0}</div>
                    <div className="text-xs text-gray-500">References</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{Array.isArray(countriesVisited) ? countriesVisited.length : 0}</div>
                    <div className="text-xs text-gray-500">Countries</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Member since {displayUser?.createdAt ? formatDateForDisplay(displayUser.createdAt) : 'Recently'}
                    </span>
                  </div>
                  
                  {displayUser?.languagesSpoken && displayUser.languagesSpoken.length > 0 && (
                    <div className="flex items-start text-sm">
                      <Globe className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">Languages</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {displayUser.languagesSpoken.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {displayUser?.userType && (
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {displayUser.userType === 'local' ? 'Local Host' : displayUser.userType === 'business' ? 'Business' : 'Traveler'}
                      </span>
                    </div>
                  )}

                  {displayUser?.userType === 'business' && displayUser?.businessType && (
                    <div className="flex items-center text-sm">
                      <Package className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{displayUser.businessType}</span>
                    </div>
                  )}

                  {displayUser?.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{displayUser.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Sharing - from original */}
            {isOwnProfile && (
              <div className="mb-6">
                <LocationSharingSection />
              </div>
            )}

            {/* Friend Referral Widget - Only for non-business users */}
            {isOwnProfile && displayUser?.userType !== 'business' && (
              <div className="mb-6">
                <FriendReferralWidget />
              </div>
            )}

            {/* Quick Meetup Widget for travelers */}
            {isOwnProfile && displayUser?.userType === 'traveler' && (
              <div className="mb-6">
                <QuickMeetupWidget />
              </div>
            )}

            {/* Quick Deals Widget for businesses */}
            {isOwnProfile && displayUser?.userType === 'business' && (
              <div className="mb-6">
                <QuickDealsWidget />
              </div>
            )}

            {/* Vouch Network Stats */}
            {vouchNetwork && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    Trust Network
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{vouchNetwork.totalReceived}</div>
                      <div className="text-xs text-gray-500">Vouches Received</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{vouchNetwork.totalGiven}</div>
                      <div className="text-xs text-gray-500">Vouches Given</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="travel">Travel</TabsTrigger>
                <TabsTrigger value="connections">People</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About {displayUser?.username}</h2>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/edit-profile')}
                          data-testid="button-edit-about"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {displayUser?.bio ? (
                      <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
                        {displayUser.bio}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic mb-6">
                        {isOwnProfile ? "Add a bio to tell others about yourself!" : "No bio added yet"}
                      </p>
                    )}

                    {/* Business Description for business users */}
                    {displayUser?.userType === 'business' && displayUser?.businessDescription && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Business Description</h3>
                        <p className="text-gray-700 dark:text-gray-300">{displayUser.businessDescription}</p>
                      </div>
                    )}

                    {/* Interests */}
                    {displayUser?.interests && displayUser.interests.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                          <Heart className="w-5 h-5 mr-2 text-orange-500" />
                          Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(displayUser.interests as string[]).map((interest: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {displayUser?.activities && displayUser.activities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                          Activities
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(displayUser.activities as string[]).map((activity: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                            >
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Things I Want To Do Section */}
                <ThingsIWantToDoSection 
                  userId={parseInt(profileUserId || '0')} 
                  isOwnProfile={isOwnProfile}
                />

                {/* What You Have In Common - for other users */}
                {!isOwnProfile && (
                  <WhatYouHaveInCommon 
                    userId={parseInt(profileUserId || '0')}
                    currentUserId={currentUser?.id || 0}
                  />
                )}

                {/* References Section */}
                <ReferencesWidgetNew 
                  userId={parseInt(profileUserId || '0')}
                  isOwnProfile={isOwnProfile}
                />

                {/* Vouch Widget */}
                <VouchWidget 
                  userId={parseInt(profileUserId || '0')}
                  isOwnProfile={isOwnProfile}
                />
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-6">
                {/* Photo Albums */}
                <PhotoAlbumWidget 
                  userId={parseInt(profileUserId || '0')}
                  isOwnProfile={isOwnProfile}
                />

                {/* Customer Uploaded Photos for businesses */}
                {displayUser?.userType === 'business' && (
                  <CustomerUploadedPhotos 
                    userId={parseInt(profileUserId || '0')}
                    isOwnProfile={isOwnProfile}
                  />
                )}
              </TabsContent>

              {/* Travel Tab */}
              <TabsContent value="travel" className="space-y-6">
                {/* Current Trip Section */}
                {isCurrentlyTraveling && currentTravelDestination && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-green-500" />
                        Current Trip
                      </h2>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Badge className="bg-green-500 text-white">
                            Visiting {(currentTravelDestination as any).destinationCity}, {(currentTravelDestination as any).destinationState || (currentTravelDestination as any).destinationCountry}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Until {formatDateForDisplay((currentTravelDestination as any).endDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* World Map for Countries Visited */}
                {Array.isArray(countriesVisited) && countriesVisited.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-blue-500" />
                        Places I've Been ({countriesVisited.length} countries)
                      </h2>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <WorldMap 
                          visitedCountries={Array.isArray(countriesVisited) ? countriesVisited.map((stamp: any) => stamp.country) : []}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Travel Plans */}
                {Array.isArray(travelPlans) && travelPlans.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Plane className="w-5 h-5 mr-2 text-purple-500" />
                        Travel Plans
                      </h2>
                      <div className="space-y-4">
                        {travelPlans.slice(0, 3).map((plan: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {plan.destinationCity}, {plan.destinationState || plan.destinationCountry}
                              </h3>
                              <Badge variant="outline">
                                {plan.status || 'Planned'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDateForDisplay(plan.startDate)} - {formatDateForDisplay(plan.endDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="space-y-6">
                {/* Connections Grid */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-green-500" />
                        Connections ({Array.isArray(connections) ? connections.length : 0})
                      </h2>
                      <Button variant="outline" size="sm" onClick={() => setLocation(`/connections/${profileUserId}`)}>
                        View All
                      </Button>
                    </div>
                    
                    {Array.isArray(connections) && connections.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {connections.slice(0, 6).map((connection: any, index: number) => (
                          <div key={index} className="text-center p-3 border rounded-lg hover:shadow-sm transition-shadow">
                            <SimpleAvatar
                              user={connection}
                              size="lg"
                              className="w-16 h-16 mx-auto mb-2"
                            />
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {connection.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {connection.currentCity || 'Location not set'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {isOwnProfile ? "Start connecting with other travelers and locals!" : "No connections yet"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chatroom Participation */}
                {Array.isArray(chatroomParticipation) && chatroomParticipation.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                        Active Chatrooms
                      </h3>
                      <div className="space-y-2">
                        {chatroomParticipation.slice(0, 5).map((chatroom: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium">{chatroom.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {chatroom.memberCount} members
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                {/* Events - User's events and organized events */}
                {((Array.isArray(userEvents) && userEvents.length > 0) || (Array.isArray(organizedEvents) && organizedEvents.length > 0)) && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                        Events & Activities
                      </h2>
                      
                      {Array.isArray(organizedEvents) && organizedEvents.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Organizing</h3>
                          <div className="space-y-3">
                            {organizedEvents.slice(0, 3).map((event: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                                  <Badge className="bg-purple-100 text-purple-700">Organizer</Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDateForDisplay(event.date)} • {event.city}, {event.state}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(userEvents) && userEvents.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Attending</h3>
                          <div className="space-y-3">
                            {userEvents.slice(0, 3).map((event: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDateForDisplay(event.date)} • {event.city}, {event.state}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Business Events Widget */}
                {displayUser?.userType === 'business' && (
                  <BusinessEventsWidget 
                    userId={parseInt(profileUserId || '0')}
                    isOwnProfile={isOwnProfile}
                  />
                )}

                {/* Referral Widget for businesses */}
                {displayUser?.userType === 'business' && isOwnProfile && (
                  <ReferralWidget />
                )}
              </TabsContent>
            </Tabs>

            {/* Block User Button for other users */}
            {!isOwnProfile && (
              <div className="mt-6">
                <BlockUserButton targetUserId={parseInt(profileUserId || '0')} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}