import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentTravelDestination } from "@/lib/dateUtils";

interface CurrentCityWidgetProps {
  userId: number | undefined;
  onFilterByLocation?: (location: string) => void;
}

export default function CurrentCityWidget({ 
  userId, 
  onFilterByLocation 
}: CurrentCityWidgetProps) {
  
  // Get user data from localStorage (same as ConnectModal)
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('travelconnect_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  };

  const currentUser = getUserFromStorage();

  // Get user's travel plans (exact same pattern as ConnectModal)
  const { data: travelPlans, isLoading: plansLoading } = useQuery({
    queryKey: [`/api/travel-plans/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  // Determine current city based on travel status (SAME LOGIC AS PROFILE PAGE)
  const getCurrentCity = () => {
    if (!currentUser) return null;
    
    // Wait for travel plans to load before determining location
    if (plansLoading) return null;
    
    // Check if user is currently traveling (same logic as profile page pin location)
    const currentDestination = getCurrentTravelDestination(travelPlans || []);
    if (currentDestination && currentUser.hometownCity) {
      const travelDestination = currentDestination.toLowerCase();
      const hometown = currentUser.hometownCity.toLowerCase();
      
      // Only show as traveler if destination is different from hometown
      if (!travelDestination.includes(hometown) && !hometown.includes(travelDestination)) {
        return currentDestination; // Show travel destination
      }
    }
    
    // Otherwise use hometown (same format as profile page)
    const hometownCity = currentUser.hometownCity;
    const hometownState = currentUser.hometownState;
    const hometownCountry = currentUser.hometownCountry;
    
    if (hometownCity) {
      // For international locations (non-US), show City, Country
      if (hometownCountry && hometownCountry !== 'United States' && hometownCountry !== 'USA') {
        return `${hometownCity}, ${hometownCountry}`;
      }
      // For US locations, show City, State
      else if (hometownState && (hometownCountry === 'United States' || hometownCountry === 'USA')) {
        return `${hometownCity}, ${hometownState}`;
      } else {
        return hometownCity;
      }
    }
    
    return currentUser.location || currentUser.hometown;
  };

  const currentCity = getCurrentCity();
  
  // Removed user count queries as requested by user to avoid showing zero counts

  // Show loading state if still loading plans or no city determined yet
  if (plansLoading || !currentCity) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current City</h3>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCity = currentCity;
  const shortCityName = displayCity.split(',')[0]; // Extract just the city name
  


  const handleCardClick = () => {
    console.log('CurrentCityWidget - Card clicked, currentCity:', currentCity);
    if (currentCity && onFilterByLocation) {
      console.log('CurrentCityWidget - Calling onFilterByLocation with:', currentCity);
      onFilterByLocation(currentCity);
    } else {
      console.log('CurrentCityWidget - Missing currentCity or onFilterByLocation:', {
        currentCity,
        hasOnFilterByLocation: !!onFilterByLocation
      });
    }
  };

  return (
    <Card 
      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current City</h3>
        </div>
        
        <div className="space-y-3">
          <p className="text-lg font-medium text-gray-900 dark:text-white">{shortCityName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click to explore this area</p>
        </div>
      </CardContent>
    </Card>
  );
}