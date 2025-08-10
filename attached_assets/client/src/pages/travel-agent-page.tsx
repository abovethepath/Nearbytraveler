import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CreditCard,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TravelAgentProfile {
  id: number;
  username: string;
  name: string;
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
  profileImage: string;
  location: string;
  isPublished: boolean;
}

interface TravelAgentTrip {
  id: number;
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
}

export default function TravelAgentPage() {
  // PAUSED FEATURE - Redirect to home
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  
  return null;
}

function TravelAgentPagePaused() {
  const [match, params] = useRoute("/agent/:username");
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TravelAgentTrip | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { toast } = useToast();

  if (!match || !params?.username) {
    return <div>Travel agent not found</div>;
  }

  // Fetch travel agent profile by username
  const { data: agent, isLoading } = useQuery<TravelAgentProfile>({
    queryKey: ['/api/travel-agent-profile', params.username],
  });

  // Fetch agent's trips
  const { data: trips = [] } = useQuery<TravelAgentTrip[]>({
    queryKey: ['/api/travel-agent-trips-public', params.username],
  });

  const shareUrl = `${window.location.origin}/agent/${params.username}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Share link copied successfully!",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent(`Check out ${agent?.businessName} - ${agent?.tagline}`);
    const url = encodeURIComponent(shareUrl);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  const handleBookingRequest = (trip: TravelAgentTrip) => {
    setSelectedTrip(trip);
    setBookingFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-8">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">Travel Agent Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The travel agent you're looking for doesn't exist or hasn't published their page yet.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const featuredTrips = trips.filter(trip => trip.isFeatured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{
        backgroundImage: agent.coverPhoto ? `url(${agent.coverPhoto})` : 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 h-full">
          {/* Share Button */}
          <div className="absolute top-4 right-4">
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share {agent.businessName}</DialogTitle>
                  <DialogDescription>
                    Share this travel agent's page with others
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Share Link</Label>
                    <div className="flex mt-1">
                      <Input value={shareUrl} readOnly className="flex-1" />
                      <Button 
                        onClick={() => copyToClipboard(shareUrl)}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Share on Social Media</Label>
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={() => shareOnSocial('facebook')} variant="outline" size="sm">
                        Facebook
                      </Button>
                      <Button onClick={() => shareOnSocial('twitter')} variant="outline" size="sm">
                        Twitter
                      </Button>
                      <Button onClick={() => shareOnSocial('linkedin')} variant="outline" size="sm">
                        LinkedIn
                      </Button>
                      <Button onClick={() => shareOnSocial('whatsapp')} variant="outline" size="sm">
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              {agent.logo ? (
                <img src={agent.logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-white shadow-lg" />
              ) : agent.profileImage ? (
                <img src={agent.profileImage} alt={agent.name} className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center border-4 border-white">
                  <Plane className="w-10 h-10 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-bold mb-2">{agent.businessName}</h1>
              <p className="text-xl mb-2">{agent.tagline}</p>
              <p className="text-lg opacity-90">by {agent.name}</p>
              <div className="flex items-center justify-center mt-4 space-x-4">
                <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white">
                  <Award className="w-4 h-4 mr-1" />
                  {agent.yearsExperience} Years Experience
                </Badge>
                <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white">
                  <MapPin className="w-4 h-4 mr-1" />
                  {agent.location}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trips">Available Trips</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Available Trips Tab */}
          <TabsContent value="trips" className="space-y-6">
            {featuredTrips.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Featured Trips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onBook={() => handleBookingRequest(trip)} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold mb-4">All Available Trips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onBook={() => handleBookingRequest(trip)} />
                ))}
              </div>
            </div>

            {trips.length === 0 && (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No trips available yet</h3>
                <p className="text-muted-foreground">
                  This travel agent is still setting up their trip offerings. Check back soon!
                </p>
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>About {agent.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6 whitespace-pre-line">{agent.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Travel Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {agent.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Destination Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {agent.destinationExpertise.map((dest, index) => (
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
                    <CardTitle className="text-lg">Professional Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {agent.certifications.map((cert, index) => (
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
                    <CardTitle className="text-lg">Languages Spoken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {agent.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                    Ready to plan your next adventure? Contact {agent.name} today!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Email</div>
                        <a href={`mailto:${agent.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                          {agent.contactEmail}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <a href={`tel:${agent.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                          {agent.contactPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
                      <Mail className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                    <Button size="lg" variant="outline">
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

      {/* Booking Modal */}
      <Dialog open={bookingFormOpen} onOpenChange={setBookingFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              {selectedTrip?.tripTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inquirerName">Your Name</Label>
              <Input id="inquirerName" placeholder="Enter your full name" />
            </div>
            <div>
              <Label htmlFor="inquirerEmail">Email</Label>
              <Input id="inquirerEmail" type="email" placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="inquirerPhone">Phone</Label>
              <Input id="inquirerPhone" placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="numberOfTravelers">Number of Travelers</Label>
              <Input id="numberOfTravelers" type="number" min="1" placeholder="1" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Any questions or special requests..." />
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-orange-600">
              Send Booking Inquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
              ${trip.pricePerPerson.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/person</span>
            </div>
            <Button onClick={onBook} className="bg-gradient-to-r from-blue-600 to-orange-600">
              Inquire
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}