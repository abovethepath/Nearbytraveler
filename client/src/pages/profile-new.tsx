import React, { useState, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
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
  Shield, 
  Phone, 
  CreditCard,
  CheckCircle,
  Globe,
  Users,
  Camera,
  Heart,
  Eye,
  Languages,
  GraduationCap,
  Briefcase,
  Home
} from "lucide-react";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import { calculateAge } from "@/lib/ageUtils";
import { SimpleAvatar } from "@/components/simple-avatar";
import type { User } from "@shared/schema";

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

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: !!profileUserId,
  });

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

  if (!user) {
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
  const userAge = user.dateOfBirth ? calculateAge(user.dateOfBirth) : null;

  // Calculate verification badges
  const verificationBadges = [
    { type: 'profile', verified: user.profileImage && user.bio && user.interests?.length > 0, label: 'Profile Complete' },
    { type: 'phone', verified: false, label: 'Phone Verified' }, // TODO: Add phone verification
    { type: 'email', verified: !!user.email, label: 'Email Verified' },
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
                    {user.userType === 'local' ? 'Local Host' : 'Available to Meet'}
                  </Badge>
                )}

                {/* Profile Photo */}
                <div className="relative mb-4">
                  <SimpleAvatar
                    user={user}
                    size="large"
                    className="w-32 h-32 mx-auto border-4 border-white/20"
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

                {/* User Name and Location */}
                <h1 className="text-2xl font-bold mb-2">{user.name || user.username}</h1>
                <p className="text-white/90 mb-4">
                  {user.hometownCity}, {user.hometownState && `${user.hometownState}, `}{user.hometownCountry}
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
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
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
                  <span className="text-gray-600 dark:text-gray-400">Member since {new Date(user.createdAt).getFullYear()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Top Action Bar for Desktop */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name || user.username}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.hometownCity}, {user.hometownState && `${user.hometownState}, `}{user.hometownCountry}
                </p>
              </div>
              {isOwnProfile && (
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit My Profile
                </Button>
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
                    <div className="text-2xl font-bold text-purple-600">{user.interests?.length || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Interests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{user.languages?.length || 1}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Fluent in {user.languages?.[0] || 'English'}</span>
                  </div>
                  {userAge && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{userAge}, {user.gender || 'Not specified'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">From {user.hometownCity}, {user.hometownCountry}</span>
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

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="travel">Travel Plans <Badge variant="secondary" className="ml-1 text-xs">{travelPlans.length}</Badge></TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="connections">Connections <Badge variant="secondary" className="ml-1 text-xs">{connections.length}</Badge></TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {user.bio ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {user.bio}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Add a bio to tell others about yourself" : "This user hasn't added a bio yet"}
                      </div>
                    )}

                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {user.activities && user.activities.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Activities I Enjoy</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.activities.map((activity, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {user.languages && user.languages.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="border-purple-200 text-purple-800 dark:border-purple-800 dark:text-purple-200">
                              {language}
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
                    <CardTitle>Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {isOwnProfile ? "Upload photos to share your travel experiences" : "No photos shared yet"}
                    </div>
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
                    <CardTitle>Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {isOwnProfile ? "Reviews from your travel connections will appear here" : "No reviews yet"}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}