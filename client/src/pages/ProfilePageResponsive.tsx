import ResponsiveNavbar from "@/components/ResponsiveNavbar";
import { useAuth } from "@/App";

export default function ProfilePageResponsive() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
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

  // Extract user data
  const displayName = user.name || user.username || "User";
  const location = user.location || `${user.hometownCity}, ${user.hometownState}` || "Location not set";
  const userType = user.userType === 'local' ? 'Local' : user.userType === 'traveler' ? 'Traveler' : 'User';
  const profileImage = user.profileImage || "https://placehold.co/320x320";
  const bio = user.bio || "No bio available";
  const interests = user.interests || [];

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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-name">{displayName}</h1>
              <p className="text-sm text-gray-600" data-testid="text-location">{userType} • {location}</p>
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
            <div className="rounded-2xl border p-4 md:p-6 bg-white">
              <h2 className="text-lg font-semibold mb-3">More Info</h2>
              {user.secretActivities && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm mb-1">Local Recommendations:</h3>
                  <p className="text-sm text-gray-700" data-testid="text-secret-activities">{user.secretActivities}</p>
                </div>
              )}
              {user.events && user.events.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Interested Events:</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.events.slice(0, 4).map((event, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
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