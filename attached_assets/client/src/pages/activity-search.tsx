import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, MapPin } from 'lucide-react';
import { SmartLocationInput } from '@/components/SmartLocationInput';

interface SearchResult {
  id: number;
  username: string;
  name: string;
  bio: string;
  location: string;
  profileImage?: string;
  activityName: string;
  cityName: string;
}

export default function ActivitySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState({
    city: '',
    state: '',
    country: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  // Only search when user has entered a search term
  const { data: searchResults = [], refetch } = useQuery<SearchResult[]>({
    queryKey: [`/api/users/search-by-activity-name?activityName=${encodeURIComponent(searchTerm)}${searchLocation.city ? `&cityName=${encodeURIComponent(searchLocation.city)}` : ''}`],
    enabled: false // Don't auto-run, only when user searches
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    await refetch();
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🔍 Find Travel Companions
          </h1>
          <p className="text-white/80 text-lg">
            Search for travelers who want to do the same activities as you!
          </p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search by Activity or Interest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Enter activity (e.g., poker, Highline, rooftop drinks, concert)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-white/10 border-white/20 text-white placeholder-white/60"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Location (optional - leave blank to search all cities)
                </label>
                <div className="[&_label]:text-white [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button:hover]:bg-white/20">
                  <SmartLocationInput
                    city={searchLocation.city}
                    state={searchLocation.state}
                    country={searchLocation.country}
                    onLocationChange={setSearchLocation}
                    required={false}
                    placeholder={{
                      country: "Select country (optional)",
                      state: "Select state/region (optional)",
                      city: "Select city (optional)"
                    }}
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSearch}
              disabled={!searchTerm.trim() || isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Find Travel Companions'}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Found {searchResults.length} Travelers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {searchResults.map((user) => (
                  <div 
                    key={`${user.id}-${user.activityName}`}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          user.name?.charAt(0) || user.username?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-semibold">
                            {user.name || user.username}
                          </h3>
                          <span className="text-white/60 text-sm">@{user.username}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                            {user.activityName}
                          </span>
                          <span className="flex items-center gap-1 text-white/60 text-sm">
                            <MapPin className="w-3 h-3" />
                            {user.cityName}
                          </span>
                        </div>
                        
                        {user.bio && (
                          <p className="text-white/80 text-sm mb-2">{user.bio}</p>
                        )}
                        
                        {user.location && (
                          <p className="text-white/60 text-xs">📍 {user.location}</p>
                        )}
                        
                        <Button 
                          size="sm" 
                          className="mt-3 bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.location.href = `/profile/${user.id}`}
                        >
                          View Profile & Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Tips */}
        <Card className="mt-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">💡 Search Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-2">
            <p><strong>Specific activities:</strong> Try "poker night", "Highline walk", "rooftop drinks"</p>
            <p><strong>Events:</strong> Search "concert", "festival", "museum", "gallery hopping"</p>
            <p><strong>Experiences:</strong> Look for "foodie tour", "night photography", "live music"</p>
            <p><strong>Locations:</strong> Add a city to find people in specific locations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}