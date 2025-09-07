import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Calendar } from "lucide-react";
import type { TripPlan } from "@shared/schema";
import ComprehensiveItinerary from "@/components/ComprehensiveItinerary";

interface TravelPlansWidgetProps {
  userId: number | undefined;
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

export default function TravelPlansWidget({ userId }: TravelPlansWidgetProps) {
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

  return (
    <>
    <Card 
      className="travel-plans-widget bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-travel-blue" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Plans ({uniquePlans.length})</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/plan-trip")}
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 border-0 text-xs"
            >
              Add New Trip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/match-in-city")}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 border-0 text-xs"
            >
              City Match
            </Button>
          </div>
        </div>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {(() => {
            const today = new Date();
            // Show ALL trips (current and past) - no date filtering
            const relevantPlans = uniquePlans;
            
            return relevantPlans.slice(0, 6).map((plan: any, index: number) => (
              <div 
                key={plan.id || index} 
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-colors duration-200" 
                style={{
                  backgroundColor: document.documentElement.classList.contains('dark') ? 'rgb(31 41 55)' : 'rgb(243 244 246)',
                  borderColor: document.documentElement.classList.contains('dark') ? 'rgb(75 85 99)' : 'rgb(209 213 219)'
                }}
              >
                {/* Condensed View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">{plan.destination}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/plan-trip?edit=${plan.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 h-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTravelPlan(plan);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 h-auto"
                        data-testid={`button-itinerary-${plan.id}`}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Itinerary
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Dates:</strong> <span className="text-black dark:text-white font-medium">{plan.startDate && formatDateForDisplay(plan.startDate, "PLAYA DEL REY")}
                      {plan.endDate && ` - ${formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}`}</span>
                    </p>
                    {plan.destinationCity && (
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Matching travelers in {plan.destinationCity}
                      </p>
                    )}
                  </div>
                </div>


                    {/* City Match Information */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                          💡 Want to find specific events and activities?
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Use the <strong>City Match</strong> button above to discover local events, activities, and connect with other travelers and locals in your destination cities!
                        </p>
                      </div>
                    </div>

                    {/* Clean Itinerary Overview */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Trip Overview</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/plan-trip?edit=${plan.id}`)}
                          className="text-xs"
                        >
                          Edit Details
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-1">📍 Destination</p>
                          <p className="text-gray-600 dark:text-gray-400">{plan.destination}</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-1">📅 Duration</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {plan.startDate && formatDateForDisplay(plan.startDate, "PLAYA DEL REY")} - {plan.endDate && formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}
                          </p>
                        </div>

                        {plan.accommodation && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">🏨 Accommodation</p>
                            <p className="text-gray-600 dark:text-gray-400">{plan.accommodation}</p>
                          </div>
                        )}

                        {plan.transportation && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">🚗 Transportation</p>
                            <p className="text-gray-600 dark:text-gray-400">{plan.transportation}</p>
                          </div>
                        )}

                        {plan.notes && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">📝 Notes</p>
                            <p className="text-gray-600 dark:text-gray-400">{plan.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 text-center">
                        <Button
                          onClick={() => setLocation(`/city/${plan.destinationCity?.toLowerCase()}/match`)}
                          className="bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600"
                          size="sm"
                        >
                          🎯 City Match: Find {plan.destinationCity} Events
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ));
          })()}
          
          {(user as any)?.travelDestination && (user as any)?.travelStartDate && (user as any)?.travelEndDate && 
           !uniquePlans.some((plan: any) => plan.destination === (user as any).travelDestination) && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{(user as any).travelDestination}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateForDisplay((user as any).travelStartDate, "PLAYA DEL REY")}
                    {(user as any).travelEndDate && ` - ${formatDateForDisplay((user as any).travelEndDate, "PLAYA DEL REY")}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/connect");
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View Details
                </Button>
              </div>
            </div>
          )}

          {(() => {
            const today = new Date();
            const relevantPlans = uniquePlans.filter((plan: any) => {
              if (!plan.endDate) return true;
              const endDate = (() => {
                let dateString = plan.endDate instanceof Date ? plan.endDate.toISOString() : plan.endDate;
                const parts = dateString.split('T')[0].split('-');
                if (parts.length === 3) {
                  const year = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const day = parseInt(parts[2]);
                  return new Date(year, month, day);
                }
                return null;
              })();
              return endDate ? endDate >= today : true;
            });
            
            if (relevantPlans.length === 0 && (!(user as any)?.travelDestination)) {
              return (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No upcoming travel plans</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation("/plan-trip");
                    }}
                    className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 border-0 hover:scale-105 active:scale-95 transition-transform"
                  >
                    Add Your First Plan
                  </Button>
                </div>
              );
            }
            return null;
          })()}
        </div>
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