import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, Edit, Trash2, MapPin, Calendar, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TripPlan } from "@shared/schema";

// Simple date formatting function - CRITICAL: 4-digit years only
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
    month: 'long', 
    day: 'numeric' 
  });
}

function getTripStatus(startDate: string, endDate?: string): { status: string, color: string } {
  const today = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  if (end && end < today) {
    return { status: "Completed", color: "bg-gray-100 text-gray-800" };
  } else if (start <= today && (!end || end >= today)) {
    return { status: "Current", color: "bg-green-100 text-green-800" };
  } else {
    return { status: "Upcoming", color: "bg-blue-100 text-blue-800" };
  }
}

export default function TravelPlans() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: travelPlans = [], isLoading } = useQuery<TripPlan[]>({
    queryKey: [`/api/travel-plans/${currentUser.id}`],
    enabled: !!currentUser.id,
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const response = await apiRequest('DELETE', `/api/travel-plans/${tripId}`);
      if (!response.ok) throw new Error('Failed to delete trip');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${currentUser.id}`] });
      toast({
        title: "Trip Deleted",
        description: "Your travel plan has been removed successfully.",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete travel plan. Please try again.",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const handleDeleteTrip = (tripId: number) => {
    setDeletingId(tripId);
    deleteTripMutation.mutate(tripId);
  };

  // Sort plans: Current trips first, then upcoming, then completed
  const sortedPlans = [...travelPlans].sort((a, b) => {
    const statusA = getTripStatus(a.startDate, a.endDate || undefined);
    const statusB = getTripStatus(b.startDate, b.endDate || undefined);
    
    const statusOrder = { "Current": 0, "Upcoming": 1, "Completed": 2 };
    return statusOrder[statusA.status as keyof typeof statusOrder] - statusOrder[statusB.status as keyof typeof statusOrder];
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Globe className="w-8 h-8 text-travel-blue" />
                My Travel Plans
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your travel destinations and itineraries
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/plan-trip")}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Plan New Trip
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{sortedPlans.filter(p => getTripStatus(p.startDate, p.endDate || undefined).status === "Current").length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{sortedPlans.filter(p => getTripStatus(p.startDate, p.endDate || undefined).status === "Upcoming").length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-600">{sortedPlans.filter(p => getTripStatus(p.startDate, p.endDate || undefined).status === "Completed").length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed Trips</div>
            </CardContent>
          </Card>
        </div>

        {/* Travel Plans Grid */}
        {sortedPlans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Travel Plans Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Start planning your next adventure!</p>
              <Button
                onClick={() => setLocation("/plan-trip")}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Plan Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlans.map((plan) => {
              const tripStatus = getTripStatus(plan.startDate, plan.endDate || undefined);
              return (
                <Card key={plan.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-travel-blue" />
                          {plan.destination}
                        </h3>
                        <Badge className={tripStatus.color}>
                          {tripStatus.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/plan-trip?edit=${plan.id}`)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTrip(plan.id)}
                          disabled={deletingId === plan.id}
                          className="hover:bg-red-50 dark:hover:bg-red-900 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDateForDisplay(plan.startDate)}
                          {plan.endDate && ` - ${formatDateForDisplay(plan.endDate)}`}
                        </span>
                      </div>
                      
                      {plan.interests && plan.interests.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.interests.slice(0, 4).map((interest, idx) => {
                              const colorClasses = [
                                "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200",
                                "bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200",
                                "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200",
                                "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200"
                              ];
                              return (
                                <span key={interest} className={`text-xs px-2 py-1 rounded border ${colorClasses[idx % 4]}`}>
                                  {interest}
                                </span>
                              );
                            })}
                            {plan.interests.length > 4 && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                +{plan.interests.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/city/${encodeURIComponent(plan.destination)}`)}
                          className="w-full"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Explore Destination
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}