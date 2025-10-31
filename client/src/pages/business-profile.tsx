import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin, Phone, Globe, Users, Camera, MessageCircle, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { UniversalBackButton } from "@/components/UniversalBackButton";



interface BusinessOffer {
  id: number;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  isActive: boolean;
}

export default function BusinessProfile() {
  const { toast } = useToast();
  const { user } = React.useContext(AuthContext);
  const [showAllPhotos, setShowAllPhotos] = useState(false);


  // Use actual user data instead of mock data
  const businessData = {
    id: user?.id || 1,
    name: user?.businessName || user?.name || "Business Profile",
    description: user?.businessDescription || "Welcome to our business profile. We're excited to connect with travelers and locals!",
    location: user?.businessLocation || `${user?.businessCity || ''}, ${user?.businessState || ''}, ${user?.businessCountry || ''}`.replace(/^,\s*|,\s*$/g, '') || "Location not specified",
    phone: user?.phoneNumber || user?.businessPhone || "",
    email: user?.email || user?.businessEmail || "",
    website: user?.website || user?.businessWebsite || "",
    streetAddress: user?.streetAddress || user?.businessAddress || "",
    verified: true,
    photos: user?.profileImage ? [user.profileImage] : [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
    ]
  };



  const mockOffers: BusinessOffer[] = [
    {
      id: 1,
      title: "Traveler Welcome Discount",
      description: "Show your travel itinerary and get 20% off your first order",
      discount: "20% OFF",
      validUntil: "2025-12-31",
      isActive: true
    },
    {
      id: 2,
      title: "Local Connection Special",
      description: "Buy a coffee for a local and get your second drink free",
      discount: "BOGO",
      validUntil: "2025-12-31",
      isActive: true
    }
  ];

  const displayedPhotos = showAllPhotos ? businessData.photos : businessData.photos.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Mobile Back Button */}
      <div className="block md:hidden px-4 pt-4 pb-2">
        <UniversalBackButton 
          destination="/discover"
          label="Back"
          className="shadow-sm"
        />
      </div>
      
      {/* Business Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">{businessData.name}</h1>
                {businessData.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified Business
                  </Badge>
                )}
              </div>
              
              <p className="text-lg text-gray-600 mb-4">{businessData.description}</p>
              
              <div className="space-y-2">
                {/* Street Address */}
                {businessData.streetAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.streetAddress + ', ' + businessData.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="hover:underline">
                      {businessData.streetAddress}, {businessData.location}
                    </span>
                  </a>
                )}

                {/* Phone Number */}
                {businessData.phone && (
                  <a
                    href={`tel:${businessData.phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="hover:underline">{businessData.phone}</span>
                  </a>
                )}

                {/* Email */}
                {businessData.email && (
                  <a
                    href={`mailto:${businessData.email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="hover:underline">{businessData.email}</span>
                  </a>
                )}

                {/* Website */}
                {businessData.website && (
                  <a
                    href={businessData.website.startsWith('http') ? businessData.website : `https://${businessData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="hover:underline">{businessData.website}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="md:w-80">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Business
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      View All Photos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="photos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="offers">Current Offers</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Business Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Business photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
                {businessData.photos.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllPhotos(!showAllPhotos)}
                    >
                      {showAllPhotos ? "Show Less" : `View All ${businessData.photos.length} Photos`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Current Offers & Discounts</CardTitle>
                <p className="text-gray-600">Special deals for Nearby Traveler community</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOffers.map((offer) => (
                    <div key={offer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{offer.title}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              {offer.discount}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{offer.description}</p>
                          <p className="text-sm text-gray-500">Valid until {offer.validUntil}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About This Business</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Our Story</h3>
                    <p className="text-gray-700">
                      The Local Coffee House has been serving the community for over 5 years. We pride ourselves on 
                      creating a welcoming space where travelers and locals can connect over exceptional coffee. 
                      Our beans are sourced from local roasters, and we make all our pastries fresh daily.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Perfect for Travelers</h3>
                    <p className="text-gray-700">
                      We love hosting travelers and helping them discover what makes our city special. 
                      Our staff are locals who are passionate about sharing hidden gems and connecting 
                      visitors with the authentic side of our community.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300">Free WiFi</Badge>
                      <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300">Outdoor Seating</Badge>
                      <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300">Local Art</Badge>
                      <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300">Vegan Options</Badge>
                      <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300">Travel-Friendly</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}