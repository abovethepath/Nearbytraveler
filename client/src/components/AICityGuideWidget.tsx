import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RefreshCw, MapPin, Clock, Lightbulb, Gem, Utensils, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/queryClient";

interface AICityGuideWidgetProps {
  cityName: string;
  compact?: boolean;
}

interface CityGuide {
  cached: boolean;
  overview: string;
  bestTimeToVisit: string;
  localTips: string[];
  hiddenGems: string[];
  foodRecommendations: string[];
  safetyTips: string[];
}

export function AICityGuideWidget({ cityName, compact = false }: AICityGuideWidgetProps) {
  const { toast } = useToast();
  const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadCachedGuide = async () => {
    if (!cityName) return;
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/city-guide/${encodeURIComponent(cityName)}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.cached) {
          setCityGuide(data);
        } else {
          setCityGuide(null);
        }
      }
    } catch (error) {
      console.error('Failed to load cached city guide:', error);
      setCityGuide(null);
    } finally {
      setInitialLoadDone(true);
    }
  };

  useEffect(() => {
    if (cityName) {
      loadCachedGuide();
    } else {
      setCityGuide(null);
      setInitialLoadDone(true);
    }
  }, [cityName]);

  const generateGuide = async (forceRefresh = false) => {
    if (!cityName) return;
    
    // Use consistent localStorage key with rest of app
    const storedUser = localStorage.getItem('travelconnect_user');
    const authUser = localStorage.getItem('user');
    const actualUser = storedUser ? JSON.parse(storedUser) : (authUser ? JSON.parse(authUser) : null);
    const userId = actualUser?.id;
    
    setLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId.toString();
      }
      
      const response = await fetch(`${apiBase}/api/ai/city-guide`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ cityName, forceRefresh })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.overview) {
          setCityGuide(data);
          toast({
            title: data.cached ? "City Guide Loaded" : "City Guide Generated!",
            description: `${cityName} guide is ready`,
          });
        } else {
          toast({
            title: "Note",
            description: data.error || "Could not generate city guide",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.error || "Failed to generate city guide",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to generate city guide:', error);
      toast({
        title: "Error",
        description: "Failed to generate city guide",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!cityName || !initialLoadDone) return null;

  return (
    <Card className="bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 dark:from-green-900/30 dark:via-teal-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100">AI City Guide</h3>
            {cityGuide?.cached && (
              <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 border-green-300">
                Cached
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => generateGuide(!!cityGuide)}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {cityGuide ? 'Updating...' : 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {cityGuide ? 'Refresh Guide' : 'Generate Guide'}
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
          {cityGuide 
            ? `Personalized guide for ${cityName}` 
            : `Get AI-powered insights for ${cityName}`
          }
        </p>

        {cityGuide && cityGuide.overview && (
          <div className="space-y-4">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Overview</h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{cityGuide.overview}</p>
            </div>

            {cityGuide.bestTimeToVisit && (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Best Time to Visit</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{cityGuide.bestTimeToVisit}</p>
              </div>
            )}

            {!compact && cityGuide.localTips && cityGuide.localTips.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Local Tips</h4>
                </div>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  {cityGuide.localTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {!compact && cityGuide.hiddenGems && cityGuide.hiddenGems.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gem className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">Hidden Gems</h4>
                </div>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  {cityGuide.hiddenGems.map((gem: string, i: number) => (
                    <li key={i}>{gem}</li>
                  ))}
                </ul>
              </div>
            )}

            {!compact && cityGuide.foodRecommendations && cityGuide.foodRecommendations.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">Food Recommendations</h4>
                </div>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  {cityGuide.foodRecommendations.map((food: string, i: number) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>
            )}

            {!compact && cityGuide.safetyTips && cityGuide.safetyTips.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Safety Tips</h4>
                </div>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  {cityGuide.safetyTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
