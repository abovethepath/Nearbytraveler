import { useState, useEffect } from "react";
import { useLocation } from "wouter";
// Removed goBackProperly import
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Building, UserPlus, MessageCircle, Users } from "lucide-react";
import UserCard from "@/components/user-card";
import ResponsiveUserGrid from "@/components/ResponsiveUserGrid";
import { UniversalBackButton } from "@/components/UniversalBackButton";

export default function UsersPage() {
  const [location, setLocation] = useLocation();
  

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    console.log('UsersPage - URL search params:', window.location.search);
    console.log('UsersPage - Parsed params:', Object.fromEntries(params));
    setSearchParams(params);
  }, []);

  // Extract parameters - handle both 'city' and 'location' parameters
  const city = searchParams?.get('city') || searchParams?.get('location') || '';
  const state = searchParams?.get('state') || '';
  const country = searchParams?.get('country') || '';
  const userType = searchParams?.get('type') || '';
  


  // Fetch users based on location and type
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-by-location', city, userType, state, country],
    queryFn: async () => {
      if (!city || !userType) return [];
      
      // Use the existing searchUsersByLocation endpoint
      const params = new URLSearchParams();
      // Use just the city name for the search, as the backend normalizes it
      params.append('location', city);
      params.append('userType', userType);
      
      console.log('UsersPage - API call params:', params.toString());
      
      const url = `/api/users/search-by-location?${params.toString()}`;
      
      // Get current user for authentication
      const userData = localStorage.getItem('travelconnect_user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(currentUser?.id && { 'x-user-id': currentUser.id.toString() })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!(city && userType),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const getTitle = () => {
    switch (userType) {
      case 'local':
        return `Nearby Locals and Nearby Travelers in ${city}`;
      case 'traveler':
        return `Nearby Locals and Nearby Travelers in ${city}`;
      case 'business':
        return `Nearby Businesses in ${city}`;
      default:
        return `Users in ${city}`;
    }
  };

  const getIcon = () => {
    switch (userType) {
      case 'local':
        return <Users className="h-5 w-5" />;
      case 'traveler':
        return <MapPin className="h-5 w-5" />;
      case 'business':
        return <Building className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  if ((!city && !searchParams?.get('location')) || !userType) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Invalid URL parameters. Please try again.</p>
            <Button 
              onClick={() => window.location.href = '/discover'} 
              className="mt-4"
              variant="outline"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <UniversalBackButton 
              destination="/discover"
              label="Back"
              className="shadow-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getIcon()}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getTitle()}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{city}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs dark:bg-gray-600 dark:text-gray-300">
                    {users.length} {users.length === 1 ? 'person' : 'people'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center text-red-500 dark:text-red-400">
              Error loading users: {error?.message}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                {getIcon()}
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No {userType}s found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                No {userType}s found in {city}{state ? `, ${state}` : ''}{country ? `, ${country}` : ''}
              </p>
              <Button 
                onClick={() => window.location.href = '/discover'}
                variant="outline"
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Back
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveUserGrid 
            users={users}
            title={`${userType.charAt(0).toUpperCase()}${userType.slice(1)}s in ${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`}
          />
        )}
      </div>
    </div>
  );
}