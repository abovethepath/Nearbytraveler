import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  Globe,
  MessageCircle,
  Camera,
  Award,
  Plane,
  Shield,
  CreditCard
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TravelAgentWebsite {
  id: number;
  agentId: number;
  websiteUrl: string;
  businessName: string;
  tagline: string;
  description: string;
  coverPhoto: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  specialties: string[];
  destinationExpertise: string[];
  certifications: string[];
  yearsExperience: number;
  languages: string[];
  isPublished: boolean;
}

interface TravelAgentTrip {
  id: number;
  agentId: number;
  tripTitle: string;
  tripDescription: string;
  destination: string;
  tripType: string;
  duration: number;
  maxGroupSize: number;
  pricePerPerson: number;
  priceIncludes: string[];
  availableDates: string[];
  photos: string[];
  difficulty: string;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

interface TravelAgentChatroom {
  id: number;
  agentId: number;
  tripId: number;
  chatroomName: string;
  description: string;
  chatroomType: string;
  memberCount: number;
  chatroomImage: string;
  isActive: boolean;
}

export default function TravelAgentWebsite() {
  const { user } = useContext(AuthContext);
  const [selectedTrip, setSelectedTrip] = useState<TravelAgentTrip | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch agent website data
  const { data: website } = useQuery<TravelAgentWebsite>({
    queryKey: ['/api/travel-agent-website', user?.id],
    enabled: !!user?.id,
  });

  // Fetch agent trips
  const { data: trips = [] } = useQuery<TravelAgentTrip[]>({
    queryKey: ['/api/travel-agent-trips', user?.id],
    enabled: !!user?.id,
  });

  // Fetch agent chatrooms
  const { data: chatrooms = [] } = useQuery<TravelAgentChatroom[]>({
    queryKey: ['/api/travel-agent-chatrooms', user?.id],
    enabled: !!user?.id,
  });

  // Book trip mutation
  const bookTripMutation = useMutation({
    mutationFn: (bookingData: any) => 
      apiRequest('POST', '/api/travel-agent-trip-bookings', bookingData),
    onSuccess: () => {
      toast({
        title: "Booking Request Sent",
        description: "Your booking request has been sent to the travel agent.",
      });
      setBookingModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/travel-agent-trips'] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!website) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-8">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">Travel Agent Website Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This travel agent hasn't set up their website yet.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const featuredTrips = trips.filter(trip => trip.isFeatured && trip.isActive);
  const allTrips = trips.filter(trip => trip.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{
        backgroundImage: website.coverPhoto ? `url(${website.coverPhoto})` : 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-white">
          <div className="text-center">
            {website.logo && (
              <img src={website.logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full" />
            )}
            <h1 className="text-4xl font-bold mb-2">{website.businessName}</h1>
            <p className="text-xl">{website.tagline}</p>
            <div className="flex items-center justify-center mt-4 space-x-4">
              <Badge variant="secondary" className="text-sm">
                <Award className="w-4 h-4 mr-1" />
                {website.yearsExperience} Years Experience
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Star className="w-4 h-4 mr-1" />
                Travel Specialist
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trips">Available Trips</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="chatrooms">Client Groups</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Available Trips Tab */}
          <TabsContent value="trips" className="space-y-6">
            {/* Featured Trips */}
            {featuredTrips.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Featured Trips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onBook={() => setSelectedTrip(trip)} />
                  ))}
                </div>
              </div>
            )}

            {/* All Trips */}
            <div>
              <h2 className="text-2xl font-bold mb-4">All Available Trips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onBook={() => setSelectedTrip(trip)} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>About {website.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">{website.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {website.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Destination Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {website.destinationExpertise.map((dest, index) => (
                            <Badge key={index} variant="outline">
                              <MapPin className="w-3 h-3 mr-1" />
                              {dest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {website.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center">
                          <Award className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {website.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Client Groups Tab */}
          <TabsContent value="chatrooms">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Private Client Groups</h2>
                <p className="text-muted-foreground">
                  Exclusive chatrooms for clients traveling together
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chatrooms.map((chatroom) => (
                  <Card key={chatroom.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        {chatroom.chatroomImage ? (
                          <img 
                            src={chatroom.chatroomImage} 
                            alt={chatroom.chatroomName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{chatroom.chatroomName}</CardTitle>
                          <CardDescription>{chatroom.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {chatroom.memberCount} members
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Join Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>
                    Ready to plan your next adventure? Contact us today!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">{website.contactEmail}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-sm text-muted-foreground">{website.contactPhone}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TripCard({ trip, onBook }: { trip: TravelAgentTrip; onBook: () => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        {trip.photos && trip.photos.length > 0 ? (
          <img 
            src={trip.photos[0]} 
            alt={trip.tripTitle}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-orange-500 rounded-t-lg flex items-center justify-center">
            <Camera className="w-12 h-12 text-white" />
          </div>
        )}
        {trip.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-orange-500">Featured</Badge>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg">{trip.tripTitle}</CardTitle>
        <CardDescription>{trip.destination}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {trip.duration} days
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Max {trip.maxGroupSize}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <Badge variant="outline">{trip.tripType}</Badge>
            <Badge variant="outline">{trip.difficulty}</Badge>
          </div>
          
          {trip.averageRating > 0 && (
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
              {trip.averageRating.toFixed(1)} ({trip.reviewCount} reviews)
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600">
              ${trip.pricePerPerson}
              <span className="text-sm font-normal text-muted-foreground">/person</span>
            </div>
            <Button onClick={onBook} className="bg-gradient-to-r from-blue-600 to-orange-600">
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}