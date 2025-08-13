import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Heart, Users, MapPin, Clock, MessageCircle, Star, Filter } from "lucide-react";
import { parseInputDate, formatDateForDisplay } from "@/lib/dateUtils";
import UserCard from "./user-card";
import type { User } from "@shared/schema";

interface TravelMatchesProps {
  userId?: number;
}

interface MatchScore {
  userId: number;
  score: number;
  reasons: string[];
  compatibilityLevel: 'high' | 'medium' | 'low';
  sharedInterests: string[];
  locationOverlap: boolean;
  dateOverlap: boolean;
  userTypeCompatibility: boolean;
  user: User;
}

interface TravelMatchesProps {
  userId: number;
  userCity?: string;
  defaultDestination?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export default function TravelMatches({ 
  userId, 
  userCity,
  defaultDestination = "", 
  defaultStartDate = "", 
  defaultEndDate = "" 
}: TravelMatchesProps) {
  const [activeTab, setActiveTab] = useState("smart-matches");
  const [destination, setDestination] = useState(defaultDestination);
  const [startDate, setStartDate] = useState<Date | undefined>(
    defaultStartDate && defaultStartDate.trim() ? parseInputDate(defaultStartDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    defaultEndDate && defaultEndDate.trim() ? parseInputDate(defaultEndDate) : undefined
  );
  const [userTypes, setUserTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();

  // Smart matching query
  const { data: smartMatches = [], isLoading: smartLoading } = useQuery({
    queryKey: ['/api/matching/find-matches', userId, destination, startDate?.toISOString(), endDate?.toISOString(), userTypes.join(',')],
    enabled: !!userId
  });

  // Destination-specific matching query
  const { data: destinationMatches = [], isLoading: destLoading } = useQuery({
    queryKey: ['/api/matching/destination-matches', userId, destination, startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!userId && !!destination
  });

  const getCompatibilityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900 dark:border-green-700';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900 dark:border-yellow-700';
      case 'low': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900 dark:border-red-700';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600';
    }
  };

  const getCompatibilityIcon = (level: string) => {
    switch (level) {
      case 'high': return <Heart className="w-4 h-4" />;
      case 'medium': return <Users className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const MatchCard = ({ match }: { match: MatchScore }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserCard user={match.user} />
            <div className="flex-1">
              <Badge 
                variant="outline" 
                className={`${getCompatibilityColor(match.compatibilityLevel)} flex items-center gap-1`}
              >
                {getCompatibilityIcon(match.compatibilityLevel)}
                {match.compatibilityLevel} compatibility
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {Math.round(match.score * 100)}%
            </div>
            <Progress value={match.score * 100} className="w-20 h-2 mt-1" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Compatibility reasons */}
          <div>
            <h4 className="text-sm font-medium mb-2">Why you're compatible:</h4>
            <div className="grid gap-1">
              {match.reasons.slice(0, 3).map((reason, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Shared interests */}
          {match.sharedInterests.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Shared interests:</h4>
              <div className="flex flex-wrap gap-1">
                {match.sharedInterests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status indicators */}
          <div className="flex gap-4 text-sm">
            {match.locationOverlap && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <MapPin className="w-3 h-3 dark:text-green-400" />
                Same destination
              </div>
            )}
            {match.dateOverlap && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="w-3 h-3 dark:text-blue-400" />
                Overlapping dates
              </div>
            )}
            {match.userTypeCompatibility && (
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="w-3 h-3" />
                Compatible travel styles
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-1" />
              Connect
            </Button>
            <Button size="sm" variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white border-0">
              View Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Travel Connections</h2>
          <p className="text-gray-600">Find your perfect travel matches based on compatibility</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Matching Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Enter destination..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>User Types</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traveler">Travelers</SelectItem>
                    <SelectItem value="local">Locals</SelectItem>
                    <SelectItem value="business">Businesses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matching results */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="smart-matches">Smart Matches</TabsTrigger>
          <TabsTrigger value="destination-matches">Destination Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="smart-matches" className="space-y-4">
          {smartLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : smartMatches && smartMatches.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {smartMatches.length} compatible travel connections
              </p>
              {smartMatches.map((match: MatchScore) => (
                <MatchCard key={match.userId} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No matches found</h3>
                <p className="text-gray-600 dark:text-white mb-4">
                  Try adjusting your filters or adding more travel plans to find compatible connections.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/plan-trip")}
                >
                  Update Travel Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="destination-matches" className="space-y-4">
          {!destination ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a destination</h3>
                <p className="text-gray-600">
                  Enter a destination above to find travelers and locals in that area.
                </p>
              </CardContent>
            </Card>
          ) : destLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : destinationMatches && destinationMatches.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {destinationMatches.length} people in {destination}
              </p>
              {destinationMatches.map((match: MatchScore) => (
                <MatchCard key={match.userId} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No matches in {destination}</h3>
                <p className="text-gray-600">
                  No travelers or locals found for this destination yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}