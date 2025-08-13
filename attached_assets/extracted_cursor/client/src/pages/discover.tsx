import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Star, Search, Compass, TrendingUp, MessageCircle, Heart, Plane } from "lucide-react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";


interface CityStats {
  city: string;
  localCount: number;
  travelerCount: number;
  businessCount: number;
  eventCount: number;
  description?: string;
  imageUrl?: string;
  highlights?: string[];
}

export default function DiscoverPage() {
  return <DiscoverPaused />;

function DiscoverPaused() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch city stats
  const { data: allCities = [], isLoading: statsLoading } = useQuery<CityStats[]>({
    queryKey: ["/api/city-stats"],
  });

  // Fetch city photos with optimized caching
  const { data: cityPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ["/api/city-photos/all"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Stock image function
  const getStockImageForCity = (cityName: string) => {
    const cityImages: Record<string, string> = {
      'Los Angeles': '/attached_assets/LA PHOTO_1750698856553.jpg',
      'Boston': '/attached_assets/thaniel hall_1750699608804.jpeg',
      'Budapest': '/attached_assets/budapest-at-night-chain-bridge-and-buda-castle-matthias-hauser_1750699409380.jpg',
      'New York': 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&h=250&fit=crop&auto=format',
      'Manhattan': 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&h=250&fit=crop&auto=format',
      'Chicago': 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&h=250&fit=crop&auto=format',
      'San Francisco': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop&auto=format',
      'Philadelphia': 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400&h=250&fit=crop&auto=format',
      'Seattle': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&auto=format',
      'Miami': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=250&fit=crop&auto=format',
      'Austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=250&fit=crop&auto=format',
      'Denver': 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=400&h=250&fit=crop&auto=format',
      'Nashville': 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=400&h=250&fit=crop&auto=format',
      'New Orleans': 'https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=400&h=250&fit=crop&auto=format',
      'Portland': 'https://images.unsplash.com/photo-1544547606-5f134e64d0df?w=400&h=250&fit=crop&auto=format',
      'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop&auto=format',
      'Paris': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=250&fit=crop&auto=format',
      'Rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=250&fit=crop&auto=format',
      'Milan': 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=250&fit=crop&auto=format',
      'Barcelona': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=250&fit=crop&auto=format',
      'Madrid': 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=400&h=250&fit=crop&auto=format',
      'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=250&fit=crop&auto=format',
      'Berlin': 'https://images.unsplash.com/photo-1587330979470-3day839981a7?w=400&h=250&fit=crop&auto=format',
      'Prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=250&fit=crop&auto=format',
      'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&h=250&fit=crop&auto=format',
      'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86019a?w=400&h=250&fit=crop&auto=format',
      'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=250&fit=crop&auto=format',
      'Stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&h=250&fit=crop&auto=format',
      'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=250&fit=crop&auto=format',
      'Cannes': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop&auto=format',
      'Tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&auto=format',
      'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=250&fit=crop&auto=format',
      'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&h=250&fit=crop&auto=format',
      'Seoul': 'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&auto=format',
      'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=250&fit=crop&auto=format',
      'Sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&auto=format',
      'Melbourne': 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=400&h=250&fit=crop&auto=format',
      'Toronto': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=250&fit=crop&auto=format',
      'Vancouver': 'https://images.unsplash.com/photo-1549224026-fca8d92ca2d2?w=400&h=250&fit=crop&auto=format',
      'Mexico City': 'https://images.unsplash.com/photo-1585464231875-d9ef1707a874?w=400&h=250&fit=crop&auto=format',
      'Sao Paulo': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop&auto=format',
      'Buenos Aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=250&fit=crop&auto=format',
      'Cape Town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=250&fit=crop&auto=format',
      'Cairo': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=250&fit=crop&auto=format',
      'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop&auto=format',
      'Tel Aviv': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=250&fit=crop&auto=format',
      'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=250&fit=crop&auto=format',
      'Delhi': 'https://images.unsplash.com/photo-1597149720431-6cde7624248c?w=400&h=250&fit=crop&auto=format',
      'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=250&fit=crop&auto=format'
    };

    return cityImages[cityName] || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=250&fit=crop&auto=format';
  };

  // Complete photo lookup rebuild
  const getCityImageUrl = (cityName: string) => {
    console.log(`🔍 PHOTO LOOKUP: ${cityName}`);

    // First check if we have cityPhotos data
    if (!cityPhotos || !Array.isArray(cityPhotos)) {
      console.log(`❌ No cityPhotos data available`);
      return getStockImageForCity(cityName);
    }

    console.log(`📊 Have ${cityPhotos.length} city photos to search through`);

    // Search through the array of photo objects for matching city
    const matchingPhoto = cityPhotos.find((photo: any) => {
      if (!photo || !photo.city) return false;

      // Try exact match first
      if (photo.city.toLowerCase() === cityName.toLowerCase()) {
        return true;
      }

      // Try partial matches
      if (photo.city.toLowerCase().includes(cityName.toLowerCase()) || 
          cityName.toLowerCase().includes(photo.city.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (matchingPhoto && matchingPhoto.imageUrl) {
      console.log(`✅ SUCCESS: Found uploaded photo for ${cityName} from ${matchingPhoto.city}`);
      return matchingPhoto.imageUrl;
    }

    console.log(`🔄 No uploaded photo for ${cityName}, using stock image`);
    return getStockImageForCity(cityName);
  };

  // Check if city has a custom photo (either uploaded or curated)
  const hasCustomPhoto = (cityName: string) => {
    // Check if user uploaded photo exists
    if (cityPhotos && Array.isArray(cityPhotos)) {
      const hasUploadedPhoto = cityPhotos.some((photo: any) => 
        photo && photo.city && photo.imageUrl &&
        (photo.city.toLowerCase() === cityName.toLowerCase() ||
         photo.city.toLowerCase().includes(cityName.toLowerCase()) ||
         cityName.toLowerCase().includes(photo.city.toLowerCase()))
      );
      if (hasUploadedPhoto) return true;
    }

    // Check if city has curated photo in default images  
    const cityImages: Record<string, string> = {
      'Los Angeles': '/attached_assets/LA PHOTO_1750698856553.jpg',
      'Boston': '/attached_assets/thaniel hall_1750699608804.jpeg',
      'Budapest': '/attached_assets/budapest-at-night-chain-bridge-and-buda-castle-matthias-hauser_1750699409380.jpg'
    };

    return !!cityImages[cityName];
  };

  // Filter cities based on search
  console.log("Discover page - allCities:", allCities);
  console.log("Discover page - searchQuery:", searchQuery);

  const filtered = allCities.filter((city: CityStats) =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("Discover page - filtered cities:", filtered.length);

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading destinations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Amazing Destinations
          </h1>
          <p className="text-lg text-black dark:text-white max-w-2xl mx-auto">
            Explore amazing cities, connect with locals and travelers, and find your next adventure
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>



        {/* Explore All Cities Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Explore All Cities
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filtered.map((city) => (
              <Card 
                key={`${city.city}-${city.localCount}-${city.travelerCount}`} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden h-32"
                onClick={() => setLocation(`/city/${encodeURIComponent(city.city)}`)}
              >
                <div 
                  className="h-full w-full bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${getCityImageUrl(city.city)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-200" />

                  {/* Content */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{city.city}</h3>
                    </div>

                    <div className="space-y-1">
                      {!hasCustomPhoto(city.city) && (
                        <div className="text-xs text-yellow-300">
                          📸 upload photo now
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
}