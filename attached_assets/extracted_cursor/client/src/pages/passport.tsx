import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MapPin, Trophy, Star, Calendar, Award, Users, Plane, Camera, Crown, ArrowLeft } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import type { PassportStamp, UserStats, Achievement } from "@shared/schema";

interface PassportPageProps {
  userId: number;
}

export default function PassportPage({ userId }: PassportPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch passport stamps
  const { data: stamps = [], isLoading: stampsLoading } = useQuery<PassportStamp[]>({
    queryKey: [`/api/users/${userId}/passport-stamps`],
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${userId}/stats`],
  });

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: [`/api/users/${userId}/achievements`],
  });

  // Delete stamp mutation
  const deleteStamp = useMutation({
    mutationFn: async (stampId: number) => {
      const response = await fetch(`/api/passport-stamps/${stampId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete stamp');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/passport-stamps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      toast({
        title: "Stamp deleted",
        description: "Your passport stamp has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete stamp. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStamp = (stampId: number) => {
    if (window.confirm("Are you sure you want to delete this stamp?")) {
      deleteStamp.mutate(stampId);
    }
  };

  // Filter stamps by category
  const filteredStamps = stamps.filter(stamp => 
    selectedCategory === "all" || stamp.category === selectedCategory
  );

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(stamps.map(stamp => stamp.category)))];

  if (stampsLoading || statsLoading || achievementsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <UniversalBackButton 
            destination="/discover"
            label="Back"
            className="bg-transparent"
          />
        </div>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Travel Passport
            </h1>
            <p className="text-gray-600">Your journey collection and achievements</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalStamps || 0}</p>
                  <p className="text-sm text-gray-600">Total Stamps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalPoints || 0}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.countriesVisited || 0}</p>
                  <p className="text-sm text-gray-600">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{achievements.length}</p>
                  <p className="text-sm text-gray-600">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to next level */}
        {stats && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Level {stats.level}</h3>
                  <p className="text-sm text-gray-600">
                    {1000 - (stats.totalPoints % 1000)} points to next level
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>
              <Progress 
                value={(stats.totalPoints % 1000) / 10} 
                className="h-3"
              />
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="stamps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stamps">Stamps Collection</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="stamps" className="space-y-6">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Stamps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredStamps.map((stamp) => (
                  <motion.div
                    key={stamp.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="relative">
                        <div className="h-40 bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center">
                          <div className="text-center text-white">
                            <MapPin className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">{stamp.country}</p>
                            <p className="text-sm opacity-90">{stamp.city}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteStamp(stamp.id)}
                        >
                          ×
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="capitalize">
                            {stamp.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="w-4 h-4" />
                            25
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{stamp.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(stamp.unlockedAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredStamps.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No stamps yet</h3>
                  <p className="text-gray-600">
                    Start your journey and collect stamps by visiting destinations and attending events!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{achievement.pointsAwarded} points</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Not unlocked'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {achievements.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No achievements yet</h3>
                  <p className="text-gray-600">
                    Complete travel activities to unlock achievements!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <LeaderboardTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const { data: leaderboard = [], isLoading } = useQuery<UserStats[]>({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          Global Leaderboard
        </CardTitle>
        <CardDescription>
          Top travelers by total points earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((stats, index) => (
            <div key={stats.userId} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold">User #{stats.userId}</p>
                <p className="text-sm text-gray-600">Level {stats.level}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{stats.totalPoints} points</p>
                <p className="text-sm text-gray-600">{stats.totalStamps} stamps</p>
              </div>
            </div>
          ))}
        </div>
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No leaderboard data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}