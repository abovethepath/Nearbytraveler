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
      "Los Angeles Metro": {
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
      "New York City": {
        bestTime: "Apr-Jun, Sep-Nov",
        currency: "USD", 
        transport: "Subway MetroCard",
        localTip: "Walk fast, talk fast",
        mustTry: "NYC Pizza, Bagels",
        budget: "$200-300/day",
        highlights: ["Central Park", "Times Square", "Brooklyn Bridge", "9/11 Memorial"]
      },
      "Nashville": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "USD",
        transport: "Car recommended, WeGo bus system",
        localTip: "Try honky-tonk bars on Broadway",
        mustTry: "Hot chicken, meat-and-three, bourbon",
        budget: "$100-160/day",
        highlights: ["Music Row", "Country Music Hall of Fame", "The Gulch", "Ryman Auditorium"]
      },
      "Nashville Metro": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "USD",
        transport: "Car recommended, WeGo bus system",
        localTip: "Try honky-tonk bars on Broadway",
        mustTry: "Hot chicken, meat-and-three, bourbon",
        budget: "$100-160/day",
        highlights: ["Music Row", "Country Music Hall of Fame", "The Gulch", "Ryman Auditorium"]
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
      },
      "Miami": {
        bestTime: "Dec-Apr (dry season)",
        currency: "USD",
        transport: "Car + Metrobus",
        localTip: "Beach parking fills up early",
        mustTry: "Cuban food, Stone crab, Key lime pie",
        budget: "$140-220/day",
        highlights: ["South Beach", "Art Deco District", "Little Havana", "Wynwood Walls"]
      },
      "Las Vegas": {
        bestTime: "Mar-May, Oct-Nov",
        currency: "USD",
        transport: "Walking + taxis on Strip",
        localTip: "Drink lots of water, desert climate",
        mustTry: "Buffets, steakhouses, cocktails",
        budget: "$120-300/day",
        highlights: ["The Strip", "Fremont Street", "Red Rock Canyon", "Bellagio Fountains"]
      },
      "San Francisco": {
        bestTime: "Sep-Nov (warmest)",
        currency: "USD",
        transport: "Muni passes, walking",
        localTip: "Bring layers, weather changes quickly",
        mustTry: "Sourdough bread, Dungeness crab, wine",
        budget: "$180-280/day",
        highlights: ["Golden Gate Bridge", "Alcatraz", "Fisherman's Wharf", "Lombard Street"]
      },
      "Chicago": {
        bestTime: "May-Oct",
        currency: "USD",
        transport: "CTA passes, walking downtown",
        localTip: "Deep dish pizza is tourist food, try tavern-style",
        mustTry: "Italian beef, Chicago-style hot dogs, Garrett popcorn",
        budget: "$120-180/day",
        highlights: ["Millennium Park", "Navy Pier", "Art Institute", "Wrigley Field"]
      },
      "Austin": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "USD",
        transport: "Car recommended, CapMetro",
        localTip: "Keep Austin Weird - explore local culture",
        mustTry: "BBQ, breakfast tacos, food trucks",
        budget: "$110-170/day",
        highlights: ["South by Southwest", "6th Street", "Zilker Park", "Lady Bird Lake"]
      },
      "Seattle": {
        bestTime: "Jun-Sep (dry season)",
        currency: "USD",
        transport: "Light rail, buses, walking",
        localTip: "Umbrella not needed, locals wear rain jackets",
        mustTry: "Coffee, fresh seafood, craft beer",
        budget: "$140-200/day",
        highlights: ["Pike Place Market", "Space Needle", "Puget Sound", "Capitol Hill"]
      },
      "Portland": {
        bestTime: "Jun-Sep",
        currency: "USD",
        transport: "MAX light rail, biking",
        localTip: "No sales tax, tip coffee shops",
        mustTry: "Food carts, craft beer, donuts",
        budget: "$120-180/day",
        highlights: ["Powell's Books", "Food cart pods", "Washington Park", "Pearl District"]
      },
      "Denver": {
        bestTime: "Apr-Oct",
        currency: "USD",
        transport: "RTD light rail, car for mountains",
        localTip: "Drink extra water due to altitude",
        mustTry: "Green chili, craft beer, Rocky Mountain oysters",
        budget: "$110-170/day",
        highlights: ["Red Rocks", "RiNo District", "Denver Art Museum", "16th Street Mall"]
      },
      "Phoenix": {
        bestTime: "Nov-Apr (cooler months)",
        currency: "USD",
        transport: "Car essential, light rail downtown",
        localTip: "Summer temps exceed 110°F, plan indoor activities",
        mustTry: "Mexican food, Southwestern cuisine, prickly pear margaritas",
        budget: "$100-160/day",
        highlights: ["Desert Botanical Garden", "Camelback Mountain", "Old Town Scottsdale", "Papago Park"]
      },
      "Atlanta": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "USD",
        transport: "MARTA rail system, car for suburbs",
        localTip: "Traffic is heavy, plan extra travel time",
        mustTry: "Southern BBQ, fried chicken, peach cobbler",
        budget: "$100-150/day",
        highlights: ["Martin Luther King Jr. Historic Site", "Georgia Aquarium", "Piedmont Park", "The BeltLine"]
      },
      "Boston": {
        bestTime: "Apr-Jun, Sep-Nov",
        currency: "USD",
        transport: "The T (subway), walking downtown",
        localTip: "Very walkable city, learn the neighborhoods",
        mustTry: "Clam chowder, lobster rolls, Boston cream pie",
        budget: "$150-220/day",
        highlights: ["Freedom Trail", "Fenway Park", "Harvard Square", "North End"]
      },
      "Washington": {
        bestTime: "Mar-May, Sep-Nov",
        currency: "USD", 
        transport: "Metro system, walking",
        localTip: "Many museums are free, book timed entries",
        mustTry: "Half-smoke, Ethiopian food, food trucks",
        budget: "$130-200/day",
        highlights: ["National Mall", "Smithsonian Museums", "Georgetown", "Capitol Hill"]
      },
      "San Diego": {
        bestTime: "Year-round (perfect weather)",
        currency: "USD",
        transport: "Car recommended, trolley downtown",
        localTip: "Beach parking can be expensive",
        mustTry: "Fish tacos, California burritos, craft beer",
        budget: "$140-210/day",
        highlights: ["Balboa Park", "Gaslamp Quarter", "La Jolla Cove", "Sunset Cliffs"]
      },
      "New Orleans": {
        bestTime: "Oct-Apr (avoid summer humidity)",
        currency: "USD",
        transport: "Streetcars, walking in French Quarter",
        localTip: "Stay hydrated, pace yourself with drinks",
        mustTry: "Gumbo, beignets, po-boys, hurricane cocktails",
        budget: "$120-180/day",
        highlights: ["French Quarter", "Garden District", "Bourbon Street", "Magazine Street"]
      },
      "Edinburgh": {
        bestTime: "May-Sep, Aug for Festival",
        currency: "GBP",
        transport: "Walking, buses, trams",
        localTip: "Book early during Festival season",
        mustTry: "Haggis, shortbread, whisky, fish & chips",
        budget: "£100-160/day",
        highlights: ["Edinburgh Castle", "Royal Mile", "Arthur's Seat", "Grassmarket"]
      },
      "Amsterdam": {
        bestTime: "Apr-Oct",
        currency: "EUR",
        transport: "Bikes, trams, walking",
        localTip: "Bike lanes are serious - don't walk in them",
        mustTry: "Stroopwafels, cheese, Dutch beer",
        budget: "€100-160/day",
        highlights: ["Canals", "Van Gogh Museum", "Anne Frank House", "Jordaan District"]
      },
      "Berlin": {
        bestTime: "May-Sep",
        currency: "EUR",
        transport: "U-Bahn, S-Bahn, biking",
        localTip: "Many places only accept cash",
        mustTry: "Currywurst, döner kebab, German beer",
        budget: "€70-120/day",
        highlights: ["Brandenburg Gate", "East Side Gallery", "Museum Island", "Kreuzberg"]
      },
      "Sydney": {
        bestTime: "Sep-Nov, Mar-May",
        currency: "AUD",
        transport: "Ferries, trains, buses",
        localTip: "Sun is very strong, wear sunscreen",
        mustTry: "Fresh seafood, flat white coffee, meat pies",
        budget: "$150-250 AUD/day",
        highlights: ["Opera House", "Harbour Bridge", "Bondi Beach", "The Rocks"]
      },
      "Singapore": {
        bestTime: "Feb-Apr (less humid)",
        currency: "SGD",
        transport: "MRT is excellent",
        localTip: "No tipping expected, follow strict laws",
        mustTry: "Hawker center food, chili crab, laksa",
        budget: "$100-180 SGD/day",
        highlights: ["Marina Bay", "Gardens by the Bay", "Chinatown", "Sentosa Island"]
      }
    };

    // Improved default tips with regional specificity
    const getRegionalDefaults = (country: string) => {
      switch (country) {
        case "United States":
          return {
            bestTime: "Spring and fall typically best",
            currency: "USD - credit cards widely accepted",
            transport: "Car recommended, check local public transit",
            localTip: "Tip 18-20% at restaurants",
            mustTry: "Regional specialties vary by area",
            budget: "$100-180/day depending on city size",
            highlights: ["Downtown area", "Local parks", "Historic districts", "Cultural venues"]
          };
        case "United Kingdom":
          return {
            bestTime: "May-Sep for warmer weather",
            currency: "GBP - contactless payment common",
            transport: "Public transport usually excellent",
            localTip: "Queue politely, pub etiquette important",
            mustTry: "Traditional pub food, local ales",
            budget: "£80-140/day",
            highlights: ["City center", "Historic sites", "Local pubs", "Museums"]
          };
        case "Canada":
          return {
            bestTime: "Jun-Sep, winter for snow activities",
            currency: "CAD - similar to US systems",
            transport: "Public transit in major cities",
            localTip: "Very polite culture, tipping similar to US",
            mustTry: "Poutine, maple syrup, local beer",
            budget: "$120-200 CAD/day",
            highlights: ["Downtown core", "Natural areas", "Cultural districts", "Waterfront"]
          };
        default:
          return {
            bestTime: "Research seasonal weather patterns",
            currency: "Local currency - check exchange rates",
            transport: "Research local transportation options",
            localTip: "Learn basic local customs and phrases",
            mustTry: "Ask locals for authentic food recommendations",
            budget: "Research average daily costs online",
            highlights: ["City center", "Local markets", "Historic sites", "Cultural venues"]
          };
      }
    };

    const defaultTips = getRegionalDefaults(countryName);

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