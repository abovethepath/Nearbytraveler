import { useState, useEffect, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, DollarSign, Star, Bookmark, Calendar, Compass, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SmartLocationInput from "@/components/SmartLocationInput";

interface HiddenGem {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  category: string;
  tags: string[];
  whyRecommended: string;
  localTip: string;
  bestTimeToVisit: string;
  estimatedCost: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  openingHours?: string;
  website?: string;
  userPreferencesMatched: string[];
}

interface UserProfile {
  interests: string[];
  travelStyle: string[];
  budget?: string;
  previousDestinations?: string[];
  preferredActivities?: string[];
  currentLocation: string;
  userId?: number;
}

const CATEGORIES = [
  "Food", "Culture", "Nature", "Activity", "Shopping", "Nightlife"
];

const SEASONS = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" }
];

const DIFFICULTY_COLORS = {
  Easy: "bg-green-100 text-green-800",
  Moderate: "bg-yellow-100 text-yellow-800",
  Challenging: "bg-red-100 text-red-800"
};

export default function HiddenGemsDiscovery() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Location state for SmartLocationInput
  const [location, setLocation] = useState({
    city: "",
    state: "",
    country: ""
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [radius, setRadius] = useState(15); // Default 15 miles
  const [maxResults, setMaxResults] = useState(10);
  const [excludePopular, setExcludePopular] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [discoveredGems, setDiscoveredGems] = useState<HiddenGem[]>([]);
  const [activeTab, setActiveTab] = useState("discover");

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('travelconnect_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  // Get user's saved hidden gems
  const { data: savedGems = [] } = useQuery({
    queryKey: [`/api/hidden-gems/${user?.id}`],
    enabled: !!user?.id
  });

  // Discover hidden gems mutation
  const discoverGemsMutation = useMutation({
    mutationFn: async (data: { destination: string; preferences: any; userProfile: UserProfile }) => {
      return await apiRequest("POST", "/api/hidden-gems/discover", data);
    },
    onSuccess: (data) => {
      setDiscoveredGems(data.hiddenGems || []);
      toast({
        title: "Hidden gems discovered!",
        description: `Found ${data.hiddenGems?.length || 0} authentic local experiences for you.`,
      });
      setActiveTab("results");
    },
    onError: (error: any) => {
      toast({
        title: "Discovery failed",
        description: error.message || "Failed to discover hidden gems. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Seasonal recommendations mutation
  const seasonalGemsMutation = useMutation({
    mutationFn: async (data: { userProfile: UserProfile; destination: string; season: string }) => {
      return await apiRequest("POST", "/api/hidden-gems/seasonal", data);
    },
    onSuccess: (data) => {
      setDiscoveredGems(data.hiddenGems || []);
      toast({
        title: "Seasonal gems discovered!",
        description: `Found ${data.hiddenGems?.length || 0} seasonal experiences for ${selectedSeason}.`,
      });
      setActiveTab("results");
    },
    onError: (error: any) => {
      toast({
        title: "Seasonal discovery failed",
        description: error.message || "Failed to get seasonal recommendations.",
        variant: "destructive",
      });
    },
  });

  const handleDiscover = () => {
    const destination = `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`;
    
    if (!location.city || !location.country) {
      toast({
        title: "Location required",
        description: "Please select a destination to discover hidden gems.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to discover hidden gems.",
        variant: "destructive",
      });
      return;
    }

    const userProfile: UserProfile = {
      interests: user.interests || [],
      travelStyle: user.travelStyle || [],
      budget: "Moderate",
      currentLocation: user.location || destination,
      userId: user.id
    };

    const preferences = {
      radius: Math.round(radius * 1.60934), // Convert miles to kilometers for backend
      categories: selectedCategories,
      maxResults,
      excludePopular
    };

    discoverGemsMutation.mutate({ destination, preferences, userProfile });
  };

  const handleSeasonalDiscover = () => {
    const destination = `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`;
    
    if (!location.city || !location.country || !selectedSeason) {
      toast({
        title: "Missing information",
        description: "Please select a destination and season.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to discover seasonal gems.",
        variant: "destructive",
      });
      return;
    }

    const userProfile: UserProfile = {
      interests: user.interests || [],
      travelStyle: user.travelStyle || [],
      budget: "Moderate",
      currentLocation: user.location || destination,
      userId: user.id
    };

    seasonalGemsMutation.mutate({ userProfile, destination, season: selectedSeason });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const GemCard = ({ gem }: { gem: HiddenGem }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="relative h-48">
        <img
          src={gem.imageUrl || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop`}
          alt={gem.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop";
          }}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={DIFFICULTY_COLORS[gem.difficulty]}>
            {gem.difficulty}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1 dark:text-white">{gem.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm dark:text-white">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{gem.rating}</span>
          </div>
        </div>
        <Badge variant="outline" className="w-fit dark:border-gray-600 dark:text-white">
          {gem.category}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{gem.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{gem.location.address}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <DollarSign className="h-4 w-4" />
          <span>{gem.estimatedCost}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{gem.bestTimeToVisit}</span>
        </div>
        
        {gem.whyRecommended && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Why recommended:</strong> {gem.whyRecommended}
            </p>
          </div>
        )}
        
        {gem.localTip && (
          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Local tip:</strong> {gem.localTip}
            </p>
          </div>
        )}
        
        {gem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {gem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {gem.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{gem.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Compass className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hidden Gems Discovery</h1>
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover authentic local experiences and hidden gems that only locals know about. 
          Get personalized recommendations powered by AI.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
          <TabsTrigger value="discover" className="dark:text-white dark:data-[state=active]:bg-gray-700">Discover</TabsTrigger>
          <TabsTrigger value="seasonal" className="dark:text-white dark:data-[state=active]:bg-gray-700">Seasonal</TabsTrigger>
          <TabsTrigger value="results" className="dark:text-white dark:data-[state=active]:bg-gray-700">Results ({discoveredGems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card className="dark:bg-gray-800">
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SmartLocationInput
                    city={location.city}
                    state={location.state}
                    country={location.country}
                    onLocationChange={setLocation}
                    required={true}
                    label="Destination"
                    placeholder={{
                      country: "Select country",
                      state: "Select state/region", 
                      city: "Select city"
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="radius" className="dark:text-white">Search Radius (miles)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="3"
                    max="60"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-white">Categories (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      className="dark:border-gray-600 dark:text-white"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxResults" className="dark:text-white">Max Results</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    min="5"
                    max="20"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="excludePopular"
                    checked={excludePopular}
                    onChange={(e) => setExcludePopular(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="excludePopular" className="dark:text-white">Exclude popular tourist spots</Label>
                </div>
              </div>

              <Button 
                onClick={handleDiscover}
                disabled={discoverGemsMutation.isPending}
                className="w-full"
                size="lg"
              >
                {discoverGemsMutation.isPending ? "Discovering..." : "Discover Hidden Gems"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Calendar className="h-5 w-5" />
                Seasonal Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SmartLocationInput
                    city={location.city}
                    state={location.state}
                    country={location.country}
                    onLocationChange={setLocation}
                    required={true}
                    label="Destination"
                    placeholder={{
                      country: "Select country",
                      state: "Select state/region", 
                      city: "Select city"
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="season" className="dark:text-white">Season</Label>
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                      {SEASONS.map((season) => (
                        <SelectItem 
                          key={season.value} 
                          value={season.value}
                          className="dark:text-white dark:hover:bg-gray-600"
                        >
                          {season.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSeasonalDiscover}
                disabled={seasonalGemsMutation.isPending}
                className="w-full"
                size="lg"
              >
                {seasonalGemsMutation.isPending ? "Finding Seasonal Gems..." : "Get Seasonal Recommendations"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {discoveredGems.length === 0 ? (
            <Card className="dark:bg-gray-800">
              <CardContent className="text-center py-12">
                <Compass className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hidden gems discovered yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Use the Discover or Seasonal tabs to find amazing local experiences.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Discovered {discoveredGems.length} Hidden Gems
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Authentic local experiences curated just for you
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoveredGems.map((gem) => (
                  <GemCard key={gem.id} gem={gem} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}