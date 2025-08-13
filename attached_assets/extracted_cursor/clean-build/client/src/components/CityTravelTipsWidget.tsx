import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MapPin, Clock, DollarSign, Car, Utensils } from "lucide-react";

interface CityTravelTipsWidgetProps {
  city: string;
  state?: string;
  country: string;
}

export function CityTravelTipsWidget({ city, state, country }: CityTravelTipsWidgetProps) {
  // City-specific travel tips database
  const getTravelTips = (cityName: string, countryName: string) => {
    const tipsDatabase: Record<string, any> = {
      "Los Angeles": {
        bestTime: "Year-round (70-80°F)",
        currency: "USD",
        transport: "Car + Metro lines",
        localTip: "Download parking apps, avoid rush hour",
        mustTry: "In-N-Out, Korean BBQ, Mexican food",
        budget: "$120-200/day",
        highlights: ["Hollywood", "Santa Monica", "Venice Beach", "Beverly Hills"]
      },
      "New York": {
        bestTime: "Apr-Jun, Sep-Nov",
        currency: "USD", 
        transport: "Subway MetroCard",
        localTip: "Walk fast, talk fast",
        mustTry: "NYC Pizza, Bagels",
        budget: "$200-300/day",
        highlights: ["Central Park", "Times Square", "Brooklyn Bridge", "9/11 Memorial"]
      },
      "London": {
        bestTime: "May-Sep",
        currency: "GBP",
        transport: "Oyster Card for Tube",
        localTip: "Stand right on escalators",
        mustTry: "Fish & Chips, Pub lunch",
        budget: "£120-180/day",
        highlights: ["Big Ben", "Tower Bridge", "British Museum", "Hyde Park"]
      },
      "Paris": {
        bestTime: "Apr-Jun, Sep-Oct",
        currency: "EUR",
        transport: "Metro day pass",
        localTip: "Learn basic French phrases",
        mustTry: "Croissants, Wine & Cheese",
        budget: "€100-150/day",
        highlights: ["Eiffel Tower", "Louvre", "Notre Dame", "Champs-Élysées"]
      },
      "Tokyo": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "JPY",
        transport: "JR Pass for tourists",
        localTip: "Bow when greeting",
        mustTry: "Sushi, Ramen, Tempura",
        budget: "¥12,000-18,000/day",
        highlights: ["Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree", "Harajuku"]
      },
      "Rome": {
        bestTime: "Apr-Jun, Sep-Oct",
        currency: "EUR",
        transport: "Walking + Metro",
        localTip: "Dress modestly for churches",
        mustTry: "Pasta, Gelato, Espresso",
        budget: "€80-120/day",
        highlights: ["Colosseum", "Vatican City", "Trevi Fountain", "Roman Forum"]
      },
      "Barcelona": {
        bestTime: "May-Jul, Sep-Oct",
        currency: "EUR",
        transport: "Barcelona Card",
        localTip: "Siesta time 2-5pm",
        mustTry: "Tapas, Paella, Sangria",
        budget: "€70-110/day",
        highlights: ["Sagrada Familia", "Park Güell", "Gothic Quarter", "La Rambla"]
      },
      "Bangkok": {
        bestTime: "Nov-Feb",
        currency: "THB",
        transport: "BTS Skytrain",
        localTip: "Remove shoes in temples",
        mustTry: "Pad Thai, Tom Yum, Mango Sticky Rice",
        budget: "฿2,000-4,000/day",
        highlights: ["Grand Palace", "Wat Pho", "Chatuchak Market", "Floating Markets"]
      }
    };

    // Default tips for cities not in database
    const defaultTips = {
      bestTime: "Check seasonal weather",
      currency: countryName === "United States" ? "USD" : countryName === "United Kingdom" ? "GBP" : "Local currency",
      transport: "Research local transport",
      localTip: "Learn basic local phrases",
      mustTry: "Local specialties",
      budget: "Research local costs",
      highlights: ["City center", "Local markets", "Historical sites", "Parks"]
    };

    // Handle Los Angeles metro area variations
    if (cityName.includes("Los Angeles") || cityName === "Los Angeles Metro" || cityName === "LA" || cityName === "Playa del Rey") {
      return tipsDatabase["Los Angeles"];
    }
    
    // Handle other metro area variations
    if (cityName.includes("New York") || cityName === "NYC" || cityName === "Manhattan") {
      return tipsDatabase["New York"];
    }
    
    return tipsDatabase[cityName] || defaultTips;
  };

  const tips = getTravelTips(city, country);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
          Travel Tips for {city}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Time to Visit */}
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Best Time:</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tips.bestTime}</p>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-start gap-3">
          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Daily Budget:</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tips.budget}</p>
          </div>
        </div>

        {/* Transportation */}
        <div className="flex items-start gap-3">
          <Car className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Transport:</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tips.transport}</p>
          </div>
        </div>

        {/* Food */}
        <div className="flex items-start gap-3">
          <Utensils className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Must Try:</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tips.mustTry}</p>
          </div>
        </div>

        {/* Local Tip */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">Local Tip:</span> {tips.localTip}
          </p>
        </div>

        {/* Top Highlights */}
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Top Highlights:</span>
          <div className="flex flex-wrap gap-1">
            {tips.highlights.slice(0, 4).map((highlight: string, index: number) => (
              <Badge 
                key={index}
                variant="outline" 
                className="text-xs border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
              >
                {highlight}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}