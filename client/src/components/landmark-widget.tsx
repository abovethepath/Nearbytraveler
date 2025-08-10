import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Clock, Star } from "lucide-react";

interface Landmark {
  id: string;
  name: string;
  location: string;
  description: string;
  category: string;
  visitTime: string;
  rating: number;
  image?: string;
  tips?: string[];
}

interface LandmarkWidgetProps {
  city: string;
  landmarks?: Landmark[];
  isLoading?: boolean;
}

// Default landmarks for major cities
const DEFAULT_LANDMARKS: Record<string, Landmark[]> = {
  "Los Angeles": [
    {
      id: "hollywood-sign",
      name: "Hollywood Sign",
      location: "Mount Lee, Hollywood Hills",
      description: "Iconic 45-foot-tall white letters spelling 'Hollywood' on Mount Lee",
      category: "Landmark",
      visitTime: "2-3 hours",
      rating: 4.5,
      tips: ["Best viewed from Griffith Observatory", "Hiking trails available", "Great photo opportunities"]
    },
    {
      id: "griffith-observatory",
      name: "Griffith Observatory",
      location: "Griffith Park",
      description: "Art Deco observatory with planetarium and city views",
      category: "Observatory",
      visitTime: "2-4 hours",
      rating: 4.7,
      tips: ["Free admission", "Best at sunset", "Parking fills up quickly"]
    }
  ],
  "Paris": [
    {
      id: "eiffel-tower",
      name: "Eiffel Tower",
      location: "Champ de Mars",
      description: "Iconic iron lattice tower and symbol of Paris",
      category: "Landmark",
      visitTime: "2-3 hours",
      rating: 4.6,
      tips: ["Book tickets in advance", "Best photos from Trocadéro", "Sparkles every hour after dark"]
    },
    {
      id: "louvre-museum",
      name: "Louvre Museum",
      location: "1st arrondissement",
      description: "World's largest art museum and historic monument",
      category: "Museum",
      visitTime: "4-6 hours",
      rating: 4.5,
      tips: ["Book timed entry tickets", "Focus on specific wings", "Wednesday/Friday evenings less crowded"]
    }
  ],
  "New York": [
    {
      id: "statue-of-liberty",
      name: "Statue of Liberty",
      location: "Liberty Island",
      description: "Colossal neoclassical sculpture symbolizing freedom",
      category: "Monument",
      visitTime: "4-5 hours",
      rating: 4.4,
      tips: ["Book ferry tickets in advance", "Crown access requires separate ticket", "Combine with Ellis Island"]
    },
    {
      id: "empire-state-building",
      name: "Empire State Building",
      location: "Midtown Manhattan",
      description: "Art Deco skyscraper with observation decks",
      category: "Skyscraper",
      visitTime: "2-3 hours",
      rating: 4.3,
      tips: ["Buy skip-the-line tickets", "Best views at sunset", "86th floor most popular"]
    }
  ]
};

export default function LandmarkWidget({ city, landmarks, isLoading = false }: LandmarkWidgetProps) {
  const displayLandmarks = landmarks || DEFAULT_LANDMARKS[city] || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Top Landmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayLandmarks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Top Landmarks in {city}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No landmark information available for {city} yet.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Check back later or contribute local knowledge!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Top Landmarks in {city}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayLandmarks.slice(0, 3).map((landmark) => (
            <div key={landmark.id} className="border-l-4 border-blue-200 pl-4 py-2">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{landmark.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <MapPin className="w-3 h-3" />
                    {landmark.location}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-gray-600">{landmark.rating}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">{landmark.description}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {landmark.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {landmark.visitTime}
                </div>
              </div>

              {landmark.tips && landmark.tips.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">Local Tips:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {landmark.tips.slice(0, 2).map((tip, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          
          {displayLandmarks.length > 3 && (
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-500">
                + {displayLandmarks.length - 3} more landmarks to explore
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}