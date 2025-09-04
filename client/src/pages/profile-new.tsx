import React, { useState, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { QuickMeetupWidget } from "@/components/QuickMeetupWidget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Calendar, 
  Star, 
  Settings, 
  ArrowLeft, 
  MessageCircle, 
  MessageSquare,
  Shield, 
  Phone, 
  CreditCard,
  CheckCircle,
  Globe,
  Users,
  UserPlus,
  Camera,
  Heart,
  Eye,
  Languages,
  GraduationCap,
  Briefcase,
  Home,
  TrendingUp,
  AlertCircle,
  Share2,
  Zap,
  Clock
} from "lucide-react";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { calculateAge } from "@/lib/ageUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import { PhotoAlbumWidget } from "@/components/photo-album-widget";
import { VouchWidget } from "@/components/vouch-widget";
import { LocationSharingSection } from "@/components/LocationSharingSection";
import { ThingsIWantToDoSection } from "@/components/ThingsIWantToDoSection";
import { MOST_POPULAR_INTERESTS } from "@shared/base-options";
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

  // Fetch user's connections
  const { data: connections = [] } = useQuery({
    queryKey: [`/api/connections/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch user's photo albums
  const { data: photoAlbums = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/photo-albums`],
    enabled: !!profileUserId,
  });

  // Fetch user's references
  const { data: references } = useQuery({
    queryKey: [`/api/users/${profileUserId}/references`],
    enabled: !!profileUserId,
  });

  // Fetch user's events
  const { data: userEvents = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/all-events`],
    enabled: !!profileUserId,
  });

  // Fetch countries visited
  const { data: countriesVisited = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/passport-stamps`],
    enabled: !!profileUserId,
  });

  // Fetch user's chatroom participation
  const { data: userChatrooms = [] } = useQuery({
    queryKey: [`/api/users/${profileUserId}/chatroom-participation`],
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
  const userAge = displayUser.dateOfBirth ? calculateAge(displayUser.dateOfBirth) : null;

  // Calculate verification badges
  const verificationBadges = [
    { type: 'profile', verified: displayUser.profileImage && displayUser.bio && displayUser.interests?.length > 0, label: 'Profile Complete' },
    { type: 'phone', verified: false, label: 'Phone Verified' }, // TODO: Add phone verification
    { type: 'email', verified: !!displayUser.email, label: 'Email Verified' },
  ];

  const verifiedCount = verificationBadges.filter(badge => badge.verified).length;

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
                  {isCurrentlyTraveling 
                    ? `Nearby Traveler • ${currentTravelDestination}` 
                    : `Nearby Local • ${displayUser.hometownCity}`}
                </p>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="space-y-2">
                    <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white/10">
                      <Heart className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                )}
                
                {isOwnProfile && (
                  <div className="space-y-2">
                    <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    
                    {/* Navigation buttons for own profile */}
                    <div className="flex items-center gap-2">
                      {displayUser && (displayUser.hometownCity || displayUser.location) && (
                        <Button
                          onClick={() => {
                            const chatCity = displayUser.hometownCity || displayUser.location?.split(',')[0] || 'General';
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
                        <span className="truncate">Invite Friends</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Verified Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {verificationBadges.map((badge) => (
                  <div key={badge.type} className="flex items-center gap-3">
                    {badge.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <span className={badge.verified ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                      {badge.label}
                    </span>
                  </div>
                ))}
                <div className="pt-2 text-sm text-gray-600 dark:text-gray-400">
                  {verifiedCount}/3 verifications complete
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">0 reviews</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">{connections.length} connections</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">{travelPlans.length} trips planned</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">Member since {new Date(displayUser.createdAt).getFullYear()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Top Action Bar for Desktop */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayUser.username}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {displayUser.hometownCity}, {displayUser.hometownState && `${displayUser.hometownState}, `}{displayUser.hometownCountry}
                </p>
              </div>
              {isOwnProfile ? (
                <Button onClick={() => window.location.href = '/edit-profile'}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit My Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              )}
            </div>

            {/* Overview Stats Grid */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{connections.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{travelPlans.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Travel Plans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{displayUser.interests?.length || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Interests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{displayUser.languages?.length || 1}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Fluent in {displayUser.languages?.[0] || 'English'}</span>
                  </div>
                  {userAge && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{userAge}, {displayUser.gender || 'Not specified'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">From {displayUser.hometownCity}, {displayUser.hometownCountry}</span>
                  </div>
                  {isCurrentlyTraveling && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Currently in {currentTravelDestination}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Meetup Widget - Let's Meet Now */}
            {isOwnProfile && (
              <div className="mb-6">
                <QuickMeetupWidget />
              </div>
            )}

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="travel">Travel <Badge variant="secondary" className="ml-1 text-xs">{travelPlans.length}</Badge></TabsTrigger>
                <TabsTrigger value="photos">Photos <Badge variant="secondary" className="ml-1 text-xs">{photoAlbums.length}</Badge></TabsTrigger>
                <TabsTrigger value="events">Events <Badge variant="secondary" className="ml-1 text-xs">{userEvents.length}</Badge></TabsTrigger>
                <TabsTrigger value="connections">Connections <Badge variant="secondary" className="ml-1 text-xs">{connections.length}</Badge></TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {displayUser.bio ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {displayUser.bio}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Add a bio to tell others about yourself" : "This user hasn't added a bio yet"}
                      </div>
                    )}

                    {/* Interests */}
                    {displayUser.interests && displayUser.interests.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {displayUser.activities && displayUser.activities.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Activities I Enjoy</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.activities.map((activity, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {displayUser.languages && displayUser.languages.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="border-purple-200 text-purple-800 dark:border-purple-800 dark:text-purple-200">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Countries Visited */}
                    {countriesVisited.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Countries Visited ({countriesVisited.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {countriesVisited.slice(0, 10).map((country: any, index: number) => (
                            <Badge key={index} variant="outline" className="border-green-200 text-green-800 dark:border-green-800 dark:text-green-200">
                              {country.country || country}
                            </Badge>
                          ))}
                          {countriesVisited.length > 10 && (
                            <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                              +{countriesVisited.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Media Links */}
                    {(displayUser.instagram || displayUser.tiktok || displayUser.linkedin || displayUser.website) && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Social Media</h3>
                        <div className="space-y-2">
                          {displayUser.instagram && (
                            <a
                              href={displayUser.instagram.startsWith('http') ? displayUser.instagram : `https://instagram.com/${displayUser.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
                            >
                              <Share2 className="w-4 h-4" />
                              Instagram
                            </a>
                          )}
                          {displayUser.tiktok && (
                            <a
                              href={displayUser.tiktok.startsWith('http') ? displayUser.tiktok : `https://tiktok.com/@${displayUser.tiktok}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-black hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                            >
                              <Share2 className="w-4 h-4" />
                              TikTok
                            </a>
                          )}
                          {displayUser.linkedin && (
                            <a
                              href={displayUser.linkedin.startsWith('http') ? displayUser.linkedin : `https://linkedin.com/in/${displayUser.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <Share2 className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                          {displayUser.website && (
                            <a
                              href={displayUser.website.startsWith('http') ? displayUser.website : `https://${displayUser.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <Globe className="w-4 h-4" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Travel Style */}
                    {displayUser.travelStyle && displayUser.travelStyle.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Travel Style</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.travelStyle.map((style, index) => (
                            <Badge key={index} variant="outline" className="border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200">
                              {style}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="travel" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {travelPlans.length > 0 ? (
                      <div className="space-y-4">
                        {travelPlans.map((plan: any) => (
                          <div key={plan.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {plan.destination}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {formatDateForDisplay(plan.startDate)} - {formatDateForDisplay(plan.endDate)}
                                </p>
                                {plan.notes && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                    {plan.notes}
                                  </p>
                                )}
                              </div>
                              <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                                {plan.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Plan your first trip to start connecting with locals" : "No travel plans shared yet"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {photoAlbums.length > 0 ? (
                      <PhotoAlbumWidget 
                        userId={parseInt(profileUserId)} 
                        isOwnProfile={isOwnProfile}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Upload photos to share your travel experiences" : "No photos shared yet"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userEvents.length > 0 ? (
                      <div className="space-y-4">
                        {userEvents.map((event: any) => (
                          <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {event.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateForDisplay(event.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.venue || event.city}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {event.participantCount || 0} attending
                                  </span>
                                </div>
                              </div>
                              <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Create events to connect with your community" : "No events to show"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connections" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {connections.length === 0 ? 
                        (isOwnProfile ? "Start connecting with other travelers and locals" : "No connections to show") :
                        `${connections.length} connections`
                      }
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews & References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {references ? (
                      <VouchWidget 
                        userId={parseInt(profileUserId)} 
                        isOwnProfile={isOwnProfile}
                        currentUserId={currentUser?.id}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Reviews from your travel connections will appear here" : "No reviews yet"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Top Choices Section - For non-business users */}
            {displayUser.userType !== 'business' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Top Choices for Most Travelers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {displayUser.interests?.filter((interest: string) => 
                      MOST_POPULAR_INTERESTS.includes(interest)
                    ).map((interest: string) => (
                      <Badge key={interest} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {interest}
                      </Badge>
                    )) || <p className="text-gray-500 text-sm">No top choices selected yet</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Things I Want to Do Widget - For non-business users */}
            {displayUser.userType !== 'business' && (
              <ThingsIWantToDoSection
                userId={Number(profileUserId) || 0}
                isOwnProfile={isOwnProfile}
              />
            )}

            {/* Chatrooms Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  City Chatrooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Chatrooms</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{userChatrooms?.length || 0}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/city-chatrooms'}
                    >
                      View All
                    </Button>
                  </div>
                </div>
                {userChatrooms && userChatrooms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {userChatrooms.slice(0, 3).map((chatroom: any) => (
                      <div key={chatroom.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{chatroom.name}</p>
                          <p className="text-sm text-gray-500">{chatroom.city}, {chatroom.country}</p>
                        </div>
                        <Badge variant="secondary">{chatroom.memberCount || 0} members</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Sharing for Own Profile */}
            {isOwnProfile && displayUser && (
              <div className="mt-6">
                <LocationSharingSection 
                  user={displayUser} 
                  queryClient={queryClient} 
                  toast={toast} 
                />
              </div>
            )}

            {/* Business Admin Contact Information - Only visible to business owner */}
            {isOwnProfile && displayUser?.userType === 'business' && (
              <Card className="mt-6 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
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
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Internal contact information for platform communications
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Business Name:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {displayUser?.ownerName || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contact Name:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {displayUser?.contactName || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contact Email:</span>
                      {displayUser?.ownerEmail ? (
                        <a 
                          href={`mailto:${displayUser.ownerEmail}`} 
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                        >
                          {displayUser.ownerEmail}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Not set
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contact Phone:</span>
                      {displayUser?.ownerPhone ? (
                        <a 
                          href={`tel:${displayUser.ownerPhone}`} 
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
                        >
                          {displayUser.ownerPhone}
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
                </CardContent>
              </Card>
            )}

            {/* Boost Connections Widget - Only show for own profile */}
            {isOwnProfile && (
              <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/30 dark:to-blue-900/30 hover:shadow-lg transition-all duration-200">
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
                    onClick={() => window.location.href = '/getting-started'}
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
    </div>
  );
}