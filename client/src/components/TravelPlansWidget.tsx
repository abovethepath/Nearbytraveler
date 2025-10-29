import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, MapPin, Plane, Clock, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import type { TripPlan } from "@shared/schema";
import ComprehensiveItinerary from "@/components/ComprehensiveItinerary";

interface TravelPlansWidgetProps {
  userId: number | undefined;
  isOwnProfile?: boolean;
}

// FIXED: Timezone-safe date formatting function for ALL users' travel dates
function formatDateForDisplay(dateString: string | Date | null | undefined, timezone: string): string {
  // Manual date parsing to prevent timezone conversion issues SITE-WIDE
  if (!dateString) return 'Date TBD';
  
  let inputString: string;
  if (dateString instanceof Date) {
    inputString = dateString.toISOString();
  } else {
    inputString = String(dateString);
  }
  
  const parts = inputString.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25) 
      month: 'short', 
      day: 'numeric' 
    });
  }
  return 'Date TBD';
}

export default function TravelPlansWidget({ userId, isOwnProfile = false }: TravelPlansWidgetProps) {
  const [, setLocation] = useLocation();
  const [selectedTravelPlan, setSelectedTravelPlan] = useState<TripPlan | null>(null);

  const { data: travelPlans = [] } = useQuery<TripPlan[]>({
    queryKey: [`/api/travel-plans/${userId}`],
    enabled: !!userId,
  });

  const { data: user } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Remove duplicate trips to the same destination and time
  const uniquePlans = travelPlans.reduce((acc: TripPlan[], plan: TripPlan) => {
    const isDuplicate = acc.some(p => 
      p.destination === plan.destination && 
      p.startDate === plan.startDate && 
      p.endDate === plan.endDate
    );
    if (!isDuplicate) {
      acc.push(plan);
    }
    return acc;
  }, []);

  // Helper functions to categorize travel plans
  const isCurrentlyTraveling = (plan: TripPlan) => {
    const now = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    return now >= startDate && now <= endDate && plan.status === 'active';
  };

  const isPastTravel = (plan: TripPlan) => {
    const now = new Date();
    const endDate = new Date(plan.endDate);
    return now > endDate || plan.status === 'completed';
  };

  const currentPlans = uniquePlans.filter(plan => isCurrentlyTraveling(plan));
  const futurePlans = uniquePlans.filter(plan => !isCurrentlyTraveling(plan) && !isPastTravel(plan));
  const pastPlans = uniquePlans.filter(plan => isPastTravel(plan));

  const handleCityMatch = (destinationCity: string) => {
    setLocation('/match-in-city');
  };

  return (
    <>
    <Card 
      className="travel-plans-widget bg-white dark:bg-gray-800 border border-black dark:border-gray-700 shadow-sm"
      data-testid="travel-plans-widget"
    >
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Plane className="w-6 h-6 mr-2 text-blue-500" />
          Current and Past Travel Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Travel Plans */}
        {currentPlans.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2" />
              Currently Traveling
            </h4>
            {currentPlans.map((plan: any) => (
              <div key={plan.id} className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center text-lg">
                      <MapPin className="w-5 h-5 mr-2 text-green-500" />
                      {plan.destinationCity || plan.destination}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {formatDateForDisplay(plan.startDate, "PLAYA DEL REY")} - {formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Active Trip
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTravelPlan(plan)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      data-testid={`button-itinerary-${plan.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Itinerary
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Future Travel Plans */}
        {futurePlans.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Trips
            </h4>
            {futurePlans.map((plan: any) => (
              <div key={plan.id} className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                      {plan.destinationCity || plan.destination}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {formatDateForDisplay(plan.startDate, "PLAYA DEL REY")} - {formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/plan-trip?edit=${plan.id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTravelPlan(plan)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      data-testid={`button-itinerary-${plan.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Itinerary
                    </Button>
                  </div>
                </div>
                
                {/* City Match CTA for upcoming trips */}
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleCityMatch(plan.destinationCity || plan.destination)}
                  className="text-blue-600 dark:text-blue-400 mt-2 p-0 h-auto font-normal"
                  data-testid={`button-city-match-${(plan.destinationCity || plan.destination).toLowerCase().replace(/\s+/g, '-')}`}
                >
                  Prepare with City Match <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Past Travel Plans - marked as "dead" but visible for itineraries */}
        {pastPlans.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2" />
              Past Trips (Itineraries Available)
            </h4>
            {pastPlans.slice(0, 3).map((plan: any) => (
              <div key={plan.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 mb-3 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {plan.destinationCity || plan.destination}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateForDisplay(plan.startDate, "PLAYA DEL REY")} - {formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Completed
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTravelPlan(plan)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    data-testid={`button-itinerary-${plan.id}`}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Itinerary
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleCityMatch(plan.destinationCity || plan.destination)}
                  className="text-gray-500 dark:text-gray-400 mt-1 p-0 h-auto font-normal"
                  data-testid={`button-view-itinerary-${(plan.destinationCity || plan.destination).toLowerCase().replace(/\s+/g, '-')}`}
                >
                  View Past Itinerary <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
            
            {pastPlans.length > 3 && (
              <Button variant="ghost" className="w-full text-gray-500 dark:text-gray-400 mt-2">
                View {pastPlans.length - 3} more past trips
              </Button>
            )}
          </div>
        )}

        {/* No travel plans */}
        {uniquePlans.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-4">
              {isOwnProfile ? "No travel plans yet!" : "No travel plans shared"}
            </p>
            {isOwnProfile && (
              <Button 
                size="sm" 
                onClick={() => setLocation('/plan-trip')}
                className="bg-blue-500 hover:bg-blue-600 text-white mb-4"
                data-testid="button-create-travel-plan"
              >
                <Plane className="w-4 h-4 mr-1" />
                Plan Your First Trip
              </Button>
            )}
          </div>
        )}

        {/* Action buttons - Only show on own profile */}
        {isOwnProfile && (
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/plan-trip")}
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 border-0 flex-1"
            >
              <Plane className="w-4 h-4 mr-1" />
              Add New Trip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/match-in-city")}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 border-0 flex-1"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              City Match
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Comprehensive Itinerary Dialog */}
    {selectedTravelPlan && (
      <ComprehensiveItinerary
        travelPlan={selectedTravelPlan}
        onShare={() => {
          // TODO: Implement sharing functionality
          console.log('Share itinerary:', selectedTravelPlan);
        }}
        onClose={() => setSelectedTravelPlan(null)}
      />
    )}
    </>
  );
}