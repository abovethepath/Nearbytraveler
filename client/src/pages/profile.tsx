import React, { useState, useMemo, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Globe, Users, Calendar, Star, Settings, ArrowLeft, Upload, Edit, Edit2, Heart, MessageSquare, X, Plus, Eye, EyeOff, MessageCircle, ImageIcon, Home, Shield, CheckCircle, Phone, Mail, User as UserIcon } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { formatDateForDisplay, getCurrentTravelDestination } from "@/lib/dateUtils";
import type { User, UserPhoto, PassportStamp, TravelPlan } from "@shared/schema";
import { calculateAge } from "@/lib/ageUtils";

// Import modular components
import { ConnectionsWidget } from "@/components/ConnectionsWidget";
import { LanguagesWidget } from "@/components/LanguagesWidget";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";

interface ProfileProps {
  userId?: string;
}

function ProfileContent({ userId }: ProfileProps) {
  const { user: currentUser } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse userId from URL parameter
  const profileUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = currentUser?.id === profileUserId;

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch user photos
  const { data: photos } = useQuery<UserPhoto[]>({
    queryKey: [`/api/users/${profileUserId}/photos`],
    enabled: !!profileUserId,
  });

  // Fetch travel plans
  const { data: travelPlans } = useQuery<TravelPlan[]>({
    queryKey: [`/api/travel-plans-with-itineraries/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch connections
  const { data: connections } = useQuery({
    queryKey: [`/api/connections/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch references
  const { data: referencesData } = useQuery({
    queryKey: [`/api/users/${profileUserId}/references`],
    enabled: !!profileUserId,
  });

  // Calculate user's travel status and location
  const travelDestination = useMemo(() => {
    if (!travelPlans?.length) return null;
    return getCurrentTravelDestination(travelPlans);
  }, [travelPlans]);

  const displayLocation = useMemo(() => {
    if (travelDestination) {
      return `Nearby Traveler • ${travelDestination}`;
    }
    return user?.location || "Location not set";
  }, [user?.location, travelDestination]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const userAge = user.dateOfBirth ? calculateAge(new Date(user.dateOfBirth)) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Universal Back Button */}
      <UniversalBackButton />
      
      {/* COUCHSURFING-STYLE HEADER */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {user.name?.charAt(0) || user.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Verification Badge */}
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h1>
              
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                <div className="flex items-center justify-center md:justify-start gap-1 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{displayLocation}</span>
                </div>
                {userAge && (
                  <div className="text-gray-600 dark:text-gray-300">
                    • Age {userAge}
                  </div>
                )}
              </div>

              {/* User Type & Travel Status */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {user.userType === 'traveler' ? (travelDestination ? 'Traveling Now' : 'Nearby Traveler') : 'Nearby Local'}
                </Badge>
                {user.isVeteran && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Veteran
                  </Badge>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {!isOwnProfile && (
                  <>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </>
                )}
                {isOwnProfile && (
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - COUCHSURFING STYLE TABS */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="connections">Friends</TabsTrigger>
          </TabsList>

          {/* ABOUT TAB - Main Profile Information */}
          <TabsContent value="about" className="space-y-6">
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  About {isOwnProfile ? 'Me' : user.name?.split(' ')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.bio ? (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </p>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {isOwnProfile ? (
                      <div>
                        <p className="mb-4">Tell people about yourself!</p>
                        <Button variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Add Bio
                        </Button>
                      </div>
                    ) : (
                      <p>{user.name} hasn't written their bio yet.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Languages Widget */}
            <LanguagesWidget 
              user={user}
              isOwnProfile={isOwnProfile}
            />

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.interests && user.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {isOwnProfile ? "Add your interests to help people get to know you!" : `${user.name} hasn't added any interests yet.`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Activities I Enjoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.activities && user.activities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.activities.map((activity: string) => (
                      <Badge key={activity} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {isOwnProfile ? "Add activities you enjoy doing!" : `${user.name} hasn't added any activities yet.`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Travel Style (if traveler) */}
            {user.userType === 'traveler' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Travel Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.travelStyle && user.travelStyle.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.travelStyle.map((style: string) => (
                        <Badge key={style} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      {isOwnProfile ? "Describe your travel style!" : `${user.name} hasn't described their travel style yet.`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Travel Plans (if any) */}
            {travelPlans && travelPlans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Travel Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {travelPlans.map((plan: TravelPlan) => (
                      <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {plan.destinationCity}, {plan.destinationCountry}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatDateForDisplay(plan.startDate)} - {formatDateForDisplay(plan.endDate)}
                            </p>
                          </div>
                          {plan.status === 'active' && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Traveling Now
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* REFERENCES TAB */}
          <TabsContent value="references" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  References ({referencesData?.references?.length || 0})
                </CardTitle>
                <CardDescription>
                  What other members say about {isOwnProfile ? 'you' : user.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referencesData?.references && referencesData.references.length > 0 ? (
                  <div className="space-y-4">
                    {referencesData.references.map((ref: any) => (
                      <div key={ref.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={ref.reviewer?.profileImage} />
                            <AvatarFallback>{ref.reviewer?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {ref.reviewer?.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {ref.experienceType}
                              </Badge>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                              {ref.content}
                            </p>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="mb-4">
                      {isOwnProfile 
                        ? "No references yet. Start connecting with people to get references!" 
                        : `${user.name} doesn't have any references yet.`}
                    </p>
                    {!isOwnProfile && (
                      <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Write a Reference
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="space-y-6">
            <PhotoGallerySection 
              user={user}
              isOwnProfile={isOwnProfile}
              photos={photos || []}
            />
          </TabsContent>

          {/* CONNECTIONS/FRIENDS TAB */}
          <TabsContent value="connections" className="space-y-6">
            <ConnectionsWidget 
              user={user}
              isOwnProfile={isOwnProfile}
              connections={connections || []}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* HOSTING STATUS CARD (Bottom section like Couchsurfing) */}
      {user.userType === 'local' && (
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Home className="w-5 h-5" />
                Hosting Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  Available to Host
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.name} is accepting guests and can show you around {user.location}
                </p>
                {!isOwnProfile && (
                  <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Couch Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ProfileContent;