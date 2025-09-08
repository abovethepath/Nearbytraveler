import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
// Removed goBackProperly import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Users, Calendar, TrendingUp } from "lucide-react";
import { UniversalBackButton } from "@/components/UniversalBackButton";

interface CityStats {
  city: string;
  state?: string;
  country: string;
  localCount: number;
  travelerCount: number;
  businessCount: number;
  upcomingEventsCount: number;
  popularActivities: string[];
  lastUpdated: string;
}

export default function CityStats() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch city statistics
  const { data: cityStats = [], isLoading } = useQuery({
    queryKey: ['/api/city-stats', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await fetch(`/api/city-stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch city stats');
      return response.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Removed handleBackClick function

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <UniversalBackButton destination="/discover" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">City Pages</h1>
          <p className="text-gray-600 mt-1">Discover travel activity and local community stats for cities worldwide</p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading city statistics...</p>
          </div>
        )}

        {/* City Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cityStats.map((stats: CityStats, index: number) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/city/${encodeURIComponent(stats.city.toLowerCase())}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold">{stats.city}</div>
                    <div className="text-sm text-gray-500 font-normal">
                      {stats.state && `${stats.state}, `}{stats.country}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">

                {/* Popular Activities */}
                {stats.popularActivities && stats.popularActivities.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Popular Activities</div>
                    <div className="flex flex-wrap gap-1">
                      {stats.popularActivities.slice(0, 3).map((activity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  Updated: {new Date(stats.lastUpdated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && cityStats.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No city statistics found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try a different search term" : "City statistics will appear as the community grows"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}