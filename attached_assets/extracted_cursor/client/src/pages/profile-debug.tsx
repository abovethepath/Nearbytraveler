import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@shared/schema";

interface ProfileDebugProps {
  userId?: number;
}

export default function ProfileDebug({ userId: propUserId }: ProfileDebugProps) {
  const [location, setLocation] = useLocation();
  
  // Get user ID from URL if not provided as prop
  const urlUserId = location.startsWith('/user/') ? parseInt(location.split('/')[2]) : null;
  const effectiveUserId = propUserId || urlUserId;

  console.log('ProfileDebug - effectiveUserId:', effectiveUserId);

  // Fetch user data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: [`/api/users/${effectiveUserId}`],
    enabled: !!effectiveUserId,
  });

  console.log('ProfileDebug - query result:', { user: !!user, isLoading, error: !!error });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h1>
          <p className="text-gray-600 mb-4">Failed to load user data</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">No user found with ID: {effectiveUserId}</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button 
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation('/');
              }
            }} 
            variant="outline"
          >
            ← Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Debug - {user.userType}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Username:</strong> {user.username}
              </div>
              <div>
                <strong>Name:</strong> {user.name}
              </div>
              <div>
                <strong>User Type:</strong> {user.userType}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Bio:</strong> {user.bio}
              </div>
              <div>
                <strong>Location:</strong> {user.location}
              </div>
              <div>
                <strong>Hometown:</strong> {user.hometownCity}, {user.hometownState}, {user.hometownCountry}
              </div>
              <div>
                <strong>Interests:</strong> {user.interests?.join(', ') || 'None'}
              </div>
              <div>
                <strong>Activities:</strong> {user.activities?.join(', ') || 'None'}
              </div>
              <div>
                <strong>Events:</strong> {user.events?.join(', ') || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button onClick={() => setLocation(`/user/${user.id}`)}>
            Load Full Profile
          </Button>
        </div>
      </div>
    </div>
  );
}