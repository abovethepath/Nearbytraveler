import ResponsiveNavbar from "@/components/ResponsiveNavbar";
import { useAuth } from "@/App";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Zap } from "lucide-react";

export default function ProfilePageResponsive() {
  const authContext = useAuth();
  const [actualUser, setActualUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  // CRITICAL FIX: Fetch fresh user data from API to ensure latest data (including secretActivities)
  useEffect(() => {
    async function fetchFreshUserData() {
      try {
        // First check if user is authenticated
        const contextUser = authContext.user;
        const storageUser = localStorage.getItem('user');
        const travelConnectUser = localStorage.getItem('travelConnectUser');
        
        if (!contextUser && !storageUser && !travelConnectUser) {
          // Not authenticated
          setIsReady(true);
          return;
        }
        
        // Fetch fresh data from API
        const response = await fetch(`${getApiBaseUrl()}/api/auth/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const freshUser = await response.json();
          setActualUser(freshUser);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          // Fallback to cached data if API fails
          if (contextUser) {
            setActualUser(contextUser);
          } else if (storageUser) {
            setActualUser(JSON.parse(storageUser));
          } else if (travelConnectUser) {
            setActualUser(JSON.parse(travelConnectUser));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to cached data
        const contextUser = authContext.user;
        const storageUser = localStorage.getItem('user');
        if (contextUser) {
          setActualUser(contextUser);
        } else if (storageUser) {
          try {
            setActualUser(JSON.parse(storageUser));
          } catch (e) {
            console.error('Failed to parse cached user');
          }
        }
      } finally {
        setIsReady(true);
      }
    }
    
    fetchFreshUserData();
  }, [authContext.user]);

  if (!isReady) {
    return (
      <div className="min-screen flex flex-col">
        <ResponsiveNavbar />
        <main className="container-default py-6 md:py-10 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!actualUser) {
    return (
      <div className="min-screen flex flex-col">
        <ResponsiveNavbar />
        <main className="container-default py-6 md:py-10 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">Please log in to view your profile</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const user = actualUser;

  const { data: availableNowIds = [] } = useQuery<number[]>({
    queryKey: ['/api/available-now/active-ids'],
    refetchInterval: 30000,
  });

  const isAvailableNow = user?.id ? availableNowIds.includes(user.id) : false;

  // Extract user data
  const displayName = user.name || user.username || "User";
  const profileImage = user.profileImage || "https://placehold.co/320x320";
  const bio = user.bio || "No bio available";
  
  // CRITICAL: Build hometown location (ALWAYS shown) - NEVER use location field (contains metro area)
  const hometownLocation = user.hometown || 
    (user.hometownCity && user.hometownState && user.hometownCountry 
      ? `${user.hometownCity}, ${user.hometownState}, ${user.hometownCountry}` 
      : user.hometownCity || "Location not set");
  
  // Build destination location (shown only when actively traveling)
  const destinationLocation = user.isCurrentlyTraveling && user.destinationCity && user.destinationCountry
    ? `${user.destinationCity}${user.destinationState ? ', ' + user.destinationState : ''}, ${user.destinationCountry}`
    : null;
  
  // Combine standard interests with custom interests
  const standardInterests = user.interests || [];
  const customInterestsArray = user.customInterests 
    ? user.customInterests.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0)
    : [];
  const interests = [...standardInterests, ...customInterestsArray];

  return (
    <div className="min-screen flex flex-col">
      <ResponsiveNavbar />

      <main className="container-default py-6 md:py-10 flex-1">
        {/* Header: avatar + info */}
        <section className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-6 md:gap-8 items-start">
          {/* Avatar */}
          <div className="flex md:block justify-center">
            <img
              src={profileImage}
              alt="Profile"
              className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover"
              data-testid="img-profile"
            />
          </div>

          {/* Name + actions */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-name">{displayName}</h1>
                {isAvailableNow && (
                  <span className="status-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold whitespace-nowrap">
                    <Zap className="w-3 h-3" />
                    Available Now
                  </span>
                )}
              </div>
              {/* CRITICAL: Always show hometown location - consistent mobile sizing */}
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600 font-medium" data-testid="text-hometown-location">
                  Nearby Local • {hometownLocation}
                </p>
                {/* CRITICAL: Show destination location when actively traveling - same size as hometown */}
                {destinationLocation && (
                  <p className="text-sm text-blue-600 font-medium" data-testid="text-destination-location">
                    Nearby Traveler • {destinationLocation}
                  </p>
                )}
              </div>
            </div>

            {/* Actions bar: turns into 2x2 grid on mobile */}
            <div className="grid grid-cols-2 sm:auto-cols-fr sm:grid-flow-col gap-2">
              <button className="pill">Message</button>
              <button className="pill">Invite</button>
              <button className="pill col-span-2 sm:col-span-1">Follow</button>
            </div>

            {/* Interest Pills */}
            <div className="flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.slice(0, 6).map((interest, index) => (
                  <span key={index} className="pill" data-testid={`pill-interest-${index}`}>
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No interests listed</span>
              )}
            </div>
          </div>
        </section>

        {/* About + Gallery (stack on mobile) */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-2xl border p-4 md:p-6 bg-white">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm leading-6 text-gray-700" data-testid="text-bio">
              {bio}
            </p>
          </article>

          <aside className="rounded-2xl border p-4 md:p-6 bg-white">
            <h3 className="text-lg font-semibold mb-3">Profile Details</h3>
            <div className="space-y-2 text-sm">
              {user.age && (
                <div>
                  <span className="font-medium">Age:</span> {user.age}
                </div>
              )}
              {user.languagesSpoken && user.languagesSpoken.length > 0 && (
                <div>
                  <span className="font-medium">Languages:</span> {user.languagesSpoken.join(', ')}
                </div>
              )}
              {user.countriesVisited && user.countriesVisited.length > 0 && (
                <div>
                  <span className="font-medium">Countries Visited:</span> {user.countriesVisited.join(', ')}
                </div>
              )}
              {user.activities && user.activities.length > 0 && (
                <div>
                  <span className="font-medium">Activities:</span> {user.activities.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* Additional Info Section */}
        {(user.secretActivities || (user.events && user.events.length > 0)) && (
          <section className="mt-8">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">More Info</h2>
              {user.secretActivities && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">Secret things I would do if my closest friends came to town:</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-secret-activities">{user.secretActivities}</p>
                </div>
              )}
              {user.events && user.events.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">Interested Events:</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.events.slice(0, 4).map((event, index) => (
                      <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}