import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ChevronDown, ChevronUp } from "lucide-react";
// Removed conflicting style utility imports - using pill classes instead
import type { TripPlan } from "@shared/schema";

interface TravelPlansWidgetProps {
  userId: number | undefined;
}

// FIXED: Timezone-safe date formatting function for ALL users' travel dates
function formatDateForDisplay(dateString: string, timezone: string): string {
  // Manual date parsing to prevent timezone conversion issues SITE-WIDE
  if (!dateString) return 'Date TBD';
  
  let inputString: string;
  if (dateString instanceof Date) {
    inputString = dateString.toISOString();
  } else {
    inputString = dateString;
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

export default function TravelPlansWidget({ userId }: TravelPlansWidgetProps) {
  const [, setLocation] = useLocation();
  const [expandedTravelPlan, setExpandedTravelPlan] = useState<number | null>(null);

  const { data: travelPlans = [] } = useQuery<TripPlan[]>({
    queryKey: [`/api/travel-plans/${userId}`],
    enabled: !!userId,
  });

  // Debug logging
  console.log('TravelPlansWidget - Raw data:', travelPlans);
  travelPlans.forEach((plan: any) => {
    console.log(`Plan ${plan.id} (${plan.destination}):`, {
      notes: plan.notes,
      hasNotes: !!plan.notes,
      notesType: typeof plan.notes,
      notesLength: plan.notes?.length,
      notesTrimmed: plan.notes?.trim()
    });
  });

  const { data: user } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  return (
    <Card 
      className="travel-plans-widget bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-travel-blue" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Plans</h3>
        </div>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {(() => {
            const today = new Date();
            // Show current trips (started but not ended) and future trips
            const relevantPlans = travelPlans.filter((plan: any) => {
              if (!plan.endDate) return true; // Include plans without end dates
              // FIXED: Timezone-safe date parsing for ALL users' travel dates
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
              if (!endDate) return true;
              return endDate >= today; // Show trips that haven't ended yet
            });
            
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTravelPlan(expandedTravelPlan === plan.id ? null : plan.id)}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/20 p-1 h-auto"
                    >
                      {expandedTravelPlan === plan.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          View Details
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Dates:</strong> <span className="text-black dark:text-white font-medium">{plan.startDate && formatDateForDisplay(plan.startDate, "PLAYA DEL REY")}
                      {plan.endDate && ` - ${formatDateForDisplay(plan.endDate, "PLAYA DEL REY")}`}</span>
                    </p>
                    <p><strong>Travel Style:</strong> {plan.travelStyle || 'Not specified'}</p>
                    {plan.accommodation && (
                      <p><strong>Accommodation:</strong> {plan.accommodation}</p>
                    )}
                  </div>
                </div>

                {/* Expanded View */}
                {expandedTravelPlan === plan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                    {plan.interests && plan.interests.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Interests</h5>
                        <div className="flex flex-wrap gap-1">
                          {plan.interests.slice(0, 10).map((interest: string, idx: number) => (
                            <div
                              key={`interest-${idx}`}
                              className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-blue-500 text-white border-0 appearance-none select-none gap-1.5"
                            >
                              {interest}
                            </div>
                          ))}
                          {plan.interests.length > 10 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{plan.interests.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {plan.activities && plan.activities.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Activities</h5>
                        <div className="flex flex-wrap gap-1">
                          {plan.activities.slice(0, 8).map((activity: string, idx: number) => (
                            <div
                              key={`activity-${idx}`}
                              className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5"
                            >
                              {activity}
                            </div>
                          ))}
                          {plan.activities.length > 8 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{plan.activities.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {plan.events && plan.events.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Events</h5>
                        <div className="flex flex-wrap gap-1">
                          {plan.events.slice(0, 6).map((event: string, idx: number) => (
                            <div
                              key={`event-${idx}`}
                              className="inline-flex items-center justify-center h-10 min-w-[8rem] rounded-full px-4 text-base font-medium leading-none whitespace-nowrap bg-purple-500 text-white border-0 appearance-none select-none gap-1.5"
                            >
                              {event}
                            </div>
                          ))}
                          {plan.events.length > 6 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{plan.events.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {plan.tags && plan.tags.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Activity Tags</h5>
                        <div className="flex flex-wrap gap-1">
                          {plan.tags.slice(0, 8).map((tag: string, idx: number) => (
                            <span
                              key={`tag-${idx}`}
                              className="inline-flex items-center justify-center h-8 min-w-[7rem] rounded-full px-3 text-sm font-medium leading-none whitespace-nowrap bg-green-500 text-white border-0 appearance-none select-none gap-1.5"
                            >
                              {tag}
                            </span>
                          ))}
                          {plan.tags.length > 8 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{plan.tags.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {plan.accommodations && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Accommodations</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.accommodations}</p>
                      </div>
                    )}

                    {(() => {
                      console.log(`Notes check for plan ${plan.id}:`, {
                        hasNotes: !!plan.notes,
                        notes: plan.notes,
                        trimmed: plan.notes?.trim(),
                        condition: plan.notes && plan.notes.trim()
                      });
                      return plan.notes && plan.notes.trim() ? (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Trip Notes</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            {plan.notes}
                          </p>
                        </div>
                      ) : null;
                    })()}

                    {/* Edit Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/plan-trip?edit=${plan.id}`);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 border-0"
                      >
                        Edit Trip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ));
          })()}
          
          {user?.travelDestination && user?.travelStartDate && user?.travelEndDate && 
           !travelPlans.some((plan: any) => plan.destination === user.travelDestination) && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.travelDestination}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateForDisplay(user.travelStartDate, "PLAYA DEL REY")}
                    {user.travelEndDate && ` - ${formatDateForDisplay(user.travelEndDate, "PLAYA DEL REY")}`}
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
            const relevantPlans = travelPlans.filter((plan: any) => {
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
              return endDate >= today;
            });
            
            if (relevantPlans.length === 0 && (!user?.travelDestination)) {
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
  );
}