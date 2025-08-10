import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import TravelMemoryTimeline from "@/components/travel-memory-timeline-new";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Plus, Users, Globe, ArrowLeft, Home } from "lucide-react";
import type { TravelMemory } from "@shared/schema";

export default function TravelMemoriesPage() {
  const [activeTab, setActiveTab] = useState("public");
  const [, setLocation] = useLocation();
  const { user } = useContext(AuthContext);
  
  // Get current user from context or localStorage fallback
  const currentUser = user || (() => {
    try {
      const stored = localStorage.getItem('travelconnect_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch user's travel memories
  const { data: userMemories = [], isLoading: userLoading } = useQuery<TravelMemory[]>({
    queryKey: ["/api/travel-memories", currentUser?.id],
    enabled: activeTab === "my-memories" && !!currentUser?.id
  });

  // Fetch public travel memories
  const { data: publicMemories = [], isLoading: publicLoading } = useQuery<TravelMemory[]>({
    queryKey: ["/api/travel-memories/public"],
    enabled: activeTab === "public"
  });

  const isLoading = userLoading || publicLoading;
  const currentMemories = activeTab === "my-memories" ? userMemories : publicMemories;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Travel Memories</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Travel Memories</h1>
            <p className="text-xl text-blue-100 mb-6">
              Save Memories
            </p>
            <div className="flex items-center justify-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Explore the World</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Connect with Travelers</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>Share Your Journey</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="public" className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="my-memories" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                My Memories
              </TabsTrigger>
            </TabsList>

            {activeTab === "my-memories" && (
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            )}
          </div>

          <TabsContent value="public">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-orange-500" />
                  Discover Travel Memories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-white">
                  Explore inspiring travel experiences shared by travelers from around the world. 
                  Get inspired for your next adventure and discover hidden gems through authentic stories.
                </p>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="md:flex">
                      <div className="md:w-1/3 h-64 bg-gray-200 dark:bg-gray-700" />
                      <CardContent className="md:w-2/3 p-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3" />
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <TravelMemoryTimeline 
                userId={currentUser?.id || 0} 
                isOwnProfile={false}
              />
            )}
          </TabsContent>

          <TabsContent value="my-memories">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                  My Travel Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-white">
                  Chronicle your travel adventures and create a beautiful timeline of your journeys. 
                  Share your experiences with fellow travelers and inspire others to explore.
                </p>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="space-y-8">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="md:flex">
                      <div className="md:w-1/3 h-64 bg-gray-200 dark:bg-gray-700" />
                      <CardContent className="md:w-2/3 p-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3" />
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <TravelMemoryTimeline 
                userId={currentUser?.id || 0} 
                isOwnProfile={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}