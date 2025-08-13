import React, { useState, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Camera, MapPin, Users, Target, Upload, Medal, Crown, Award } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TravelChallenge, UserChallenge, UserLeaderboard } from "@shared/schema";

export default function TravelChallengeLeaderboard() {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<TravelChallenge | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [verificationPhoto, setVerificationPhoto] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  // Fetch available challenges
  const { data: challenges = [] } = useQuery({
    queryKey: ["/api/travel-challenges"],
  });

  // Fetch user's challenges
  const { data: userChallenges = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/challenges`],
    enabled: !!user?.id
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  // Fetch user's stats
  const { data: userStats } = useQuery({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id
  });

  // Join challenge mutation
  const joinChallenge = useMutation({
    mutationFn: async (challengeId: number) => {
      return await apiRequest("POST", `/api/challenges/${challengeId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/challenges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stats`] });
      toast({ title: "Challenge joined successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to join challenge", variant: "destructive" });
    }
  });

  // Complete challenge mutation
  const completeChallenge = useMutation({
    mutationFn: async ({ challengeId, photo, notes }: { challengeId: number; photo?: string; notes?: string }) => {
      return await apiRequest("POST", `/api/challenges/${challengeId}/complete`, {
        verificationPhoto: photo,
        verificationNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/challenges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stats`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({ title: "Challenge completed! Points awarded!" });
      setSelectedChallenge(null);
      setVerificationPhoto("");
      setVerificationNotes("");
    },
    onError: () => {
      toast({ title: "Failed to complete challenge", variant: "destructive" });
    }
  });

  const challengeTypes = [
    { value: "food", label: "Food & Drinks", icon: "🍕", color: "bg-orange-100 text-orange-800" },
    { value: "culture", label: "Culture", icon: "🏛️", color: "bg-blue-100 text-blue-800" },
    { value: "adventure", label: "Adventure", icon: "🧗", color: "bg-green-100 text-green-800" },
    { value: "social", label: "Social", icon: "👥", color: "bg-blue-100 text-blue-800" },
    { value: "photo", label: "Photography", icon: "📸", color: "bg-pink-100 text-pink-800" }
  ];

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800"
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Trophy className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserChallengeStatus = (challengeId: number) => {
    return userChallenges.find((uc: any) => uc.challengeId === challengeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Travel Challenges</h2>
        {userStats && (
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Trophy className="w-4 h-4 mr-1" />
              {userStats.totalPoints || 0} Points
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Target className="w-4 h-4 mr-1" />
              {userStats.challengesCompleted || 0} Completed
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">Available Challenges</TabsTrigger>
          <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Available Challenges */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge: any) => {
              const userChallenge = getUserChallengeStatus(challenge.id);
              const isJoined = !!userChallenge;
              const isCompleted = userChallenge?.status === 'completed' || userChallenge?.status === 'verified';
              const challengeType = challengeTypes.find(t => t.value === challenge.type);

              return (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{challengeType?.icon}</span>
                        <span className="text-sm">{challenge.title}</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{challenge.points} points</span>
                      </div>
                      {challenge.location && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{challenge.location}</span>
                        </div>
                      )}
                    </div>

                    {isCompleted ? (
                      <Button disabled className="w-full">
                        <Trophy className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                    ) : isJoined ? (
                      <Button 
                        onClick={() => setSelectedChallenge(challenge)}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Complete Challenge
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => joinChallenge.mutate(challenge.id)}
                        disabled={joinChallenge.isPending}
                        className="w-full"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Join Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* My Challenges */}
        <TabsContent value="my-challenges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userChallenges.map((userChallenge: any) => {
              const challenge = challenges.find((c: any) => c.id === userChallenge.challengeId);
              if (!challenge) return null;

              const challengeType = challengeTypes.find(t => t.value === challenge.type);
              const isCompleted = userChallenge.status === 'completed' || userChallenge.status === 'verified';

              return (
                <Card key={userChallenge.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{challengeType?.icon}</span>
                        <span>{challenge.title}</span>
                      </span>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {userChallenge.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                    
                    {userChallenge.verificationPhoto && (
                      <img 
                        src={userChallenge.verificationPhoto} 
                        alt="Verification" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}

                    {userChallenge.verificationNotes && (
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {userChallenge.verificationNotes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Joined: {new Date(userChallenge.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      {isCompleted && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">+{userChallenge.pointsEarned} points</span>
                        </div>
                      )}
                    </div>

                    {userChallenge.status === 'active' && (
                      <Button 
                        onClick={() => setSelectedChallenge(challenge)}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Complete Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="space-y-3">
            {leaderboard.map((entry: any, index: number) => (
              <Card key={entry.userId} className={`${entry.userId === user?.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(entry.rank || index + 1)}
                      <span className="text-lg font-bold">#{entry.rank || index + 1}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={entry.user?.profileImage || "/api/placeholder/40/40"} 
                        alt={entry.user?.name} 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{entry.user?.name}</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>{entry.challengesCompleted} challenges</span>
                          <span>🔥 {entry.currentStreak} streak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">{entry.totalPoints}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Complete Challenge Dialog */}
      {selectedChallenge && (
        <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Challenge: {selectedChallenge.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">{selectedChallenge.description}</p>
              
              {selectedChallenge.requiresVerification && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Verification Photo</label>
                    <Input
                      type="url"
                      placeholder="Photo URL"
                      value={verificationPhoto}
                      onChange={(e) => setVerificationPhoto(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      placeholder="Tell us about your experience..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span>Points to earn:</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{selectedChallenge.points}</span>
                </div>
              </div>

              <Button 
                onClick={() => completeChallenge.mutate({ 
                  challengeId: selectedChallenge.id,
                  photo: verificationPhoto,
                  notes: verificationNotes
                })}
                disabled={completeChallenge.isPending || (selectedChallenge.requiresVerification && !verificationPhoto)}
                className="w-full"
              >
                {completeChallenge.isPending ? "Completing..." : "Complete Challenge"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}