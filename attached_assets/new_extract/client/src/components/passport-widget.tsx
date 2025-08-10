import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Trophy, Star, MapPin, Crown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { PassportStamp, UserStats } from "@shared/schema";

interface PassportWidgetProps {
  userId: number;
}

export default function PassportWidget({ userId }: PassportWidgetProps) {
  const [, setLocation] = useLocation();

  // Fetch recent passport stamps
  const { data: stamps = [], isLoading: stampsLoading } = useQuery<PassportStamp[]>({
    queryKey: [`/api/users/${userId}/passport-stamps`],
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${userId}/stats`],
  });

  const recentStamps = stamps.slice(0, 3);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-orange-100 text-orange-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (stampsLoading || statsLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Travel Passport</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Travel Stats
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold">{stats?.countriesVisited || 0}</span>
            </div>
            <p className="text-xs text-gray-600">Countries</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-lg font-bold">{stats?.totalStamps || 0}</span>
            </div>
            <p className="text-xs text-gray-600">Stamps</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="text-lg font-bold">{stats?.eventsAttended || 0}</span>
            </div>
            <p className="text-xs text-gray-600">Events</p>
          </div>
        </div>

        {/* Recent Stamps */}
        {recentStamps.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Stamps</p>
            <div className="space-y-2">
              {recentStamps.map((stamp, index) => (
                <motion.div
                  key={stamp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{stamp.title}</p>
                      <p className="text-xs text-gray-600 truncate">{stamp.city}</p>
                    </div>
                  </div>
                  <Badge className={`${getRarityColor(stamp.rarity)} text-xs px-2 py-0.5`}>
                    {stamp.rarity}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
            <Plane className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No stamps yet</p>
            <p className="text-xs text-gray-500">Start traveling to collect stamps!</p>
          </div>
        )}

        {/* Simple stats display without navigation */}
        <div className="text-center text-sm text-gray-500">
          Travel achievements and stats
        </div>
      </CardContent>
    </Card>
  );
}