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
  Camera,
  MapPin,
  Globe,
  Users,
  Calendar,
  Heart
} from "lucide-react";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { calculateAge } from "@/lib/ageUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import WorldMap from "@/components/world-map";
import FriendReferralWidget from "@/components/friend-referral-widget";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ProfileFreshProps {
  userId?: string;
}

export default function ProfileFresh({ userId: propUserId }: ProfileFreshProps) {
  const [, setLocation] = useLocation();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useContext(AuthContext);
  const { toast } = useToast();

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

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: [`/api/connections/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch user photos
  const { data: photos = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/photos`],
    enabled: !!profileUserId,
  });

  // Fetch references/vouches
  const { data: references = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/references`],
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
                    src={displayUser?.profileImage}
                    alt={displayUser?.username || 'User'}
                    size="xl"
                    className="w-24 h-24 border-4 border-white shadow-lg"
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
                
                {/* Location Status */}
                <div className="text-orange-100 mb-3">
                  {isCurrentlyTraveling && currentTravelDestination ? (
                    <span className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Nearby Traveler • {currentTravelDestination.destinationCity}, {currentTravelDestination.destinationState || currentTravelDestination.destinationCountry}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {displayUser?.currentCity || displayUser?.hometownCity || 'Location not set'}
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

                {/* Action Buttons */}
                {isOwnProfile ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setLocation('/edit-profile')}
                      variant="secondary" 
                      className="w-full bg-white text-orange-600 hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    
                    <Button 
                      onClick={() => setLocation('/chatrooms')}
                      variant="outline" 
                      className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Join Chatrooms
                    </Button>

                    <Button
                      onClick={() => setLocation('/share-qr')}
                      variant="outline" 
                      className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600"
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
                    <div className="text-2xl font-bold text-orange-600">{Array.isArray(references) && Array.isArray(references) ? references.length : 0}</div>
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
                        {displayUser.userType === 'local' ? 'Local Host' : 'Traveler'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Friend Referral Widget - Only for own profile */}
            {isOwnProfile && displayUser?.userType !== 'business' && (
              <div className="mb-6">
                <FriendReferralWidget />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About {displayUser?.username}</h2>
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation('/edit-profile')}
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
              </CardContent>
            </Card>

            {/* Travel & Places Section */}
            {Array.isArray(countriesVisited) && countriesVisited.length > 0 && (
              <Card className="mb-6">
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

            {/* Current Trip Section */}
            {isCurrentlyTraveling && currentTravelDestination && (
              <Card className="mb-6 border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-500" />
                    Current Trip
                  </h2>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-green-500 text-white">
                        Visiting {currentTravelDestination.destinationCity}, {currentTravelDestination.destinationState || currentTravelDestination.destinationCountry}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Until {formatDateForDisplay(currentTravelDestination.endDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* References Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-500" />
                  References ({Array.isArray(references) ? references.length : 0})
                </h2>
                
                {Array.isArray(references) && references.length > 0 ? (
                  <div className="space-y-4">
                    {references.slice(0, 3).map((reference: any, index: number) => (
                      <div key={index} className="border-l-4 border-l-purple-500 pl-4">
                        <div className="flex items-center mb-2">
                          <SimpleAvatar
                            src={reference.authorProfileImage}
                            alt={reference.authorName}
                            size="sm"
                            className="w-8 h-8 mr-2"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{reference.authorName}</div>
                            <div className="text-xs text-gray-500">{formatDateForDisplay(reference.createdAt)}</div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                          "{reference.content}"
                        </p>
                      </div>
                    ))}
                    {references.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full">
                        View All {references.length} References
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isOwnProfile ? "No references yet. Connect with others to get your first reference!" : "No references available"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-blue-500" />
                    Photos ({Array.isArray(photos) ? photos.length : 0})
                  </h2>
                  {isOwnProfile && (
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-1" />
                      Add Photos
                    </Button>
                  )}
                </div>
                
                {Array.isArray(photos) && photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.slice(0, 6).map((photo: any, index: number) => (
                      <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={photo.caption || 'Travel photo'}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isOwnProfile ? "Add some photos to show your travels and personality!" : "No photos uploaded yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connections Preview */}
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
                  <div className="flex flex-wrap gap-2">
                    {connections.slice(0, 10).map((connection: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <SimpleAvatar
                          src={connection.profileImage}
                          alt={connection.username}
                          size="sm"
                          className="w-10 h-10"
                        />
                      </div>
                    ))}
                    {connections.length > 10 && (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">+{connections.length - 10}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      {isOwnProfile ? "Start connecting with other travelers and locals!" : "No connections yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}