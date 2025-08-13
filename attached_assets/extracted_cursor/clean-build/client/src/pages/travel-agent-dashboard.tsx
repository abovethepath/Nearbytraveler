import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star, 
  MapPin, 
  Briefcase,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Plus,
  Edit,
  Eye
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/App";
import { Link } from "wouter";

export default function TravelAgentDashboard() {
  // PAUSED FEATURE - Redirect to home
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  
  return null;
}

function TravelAgentDashboardPaused() {
  const { user } = useContext(AuthContext);

  // Mock data for demonstration - replace with real API calls
  const stats = {
    totalClients: 23,
    activeItineraries: 8,
    monthlyCommission: 4250,
    averageRating: 4.8,
    bookingsThisMonth: 12,
    consultationsScheduled: 5
  };

  const recentClients = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@email.com",
      destination: "Tuscany, Italy",
      budget: "$8,000",
      status: "Planning",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      name: "Mike & Lisa Chen",
      email: "mike.chen@email.com",
      destination: "Japanese Garden Tour",
      budget: "$12,000",
      status: "Booked",
      lastContact: "1 week ago"
    }
  ];

  const upcomingBookings = [
    {
      id: 1,
      client: "Rodriguez Family",
      destination: "Costa Rica Adventure",
      departure: "Dec 15, 2025",
      type: "Family Package",
      commission: "$850"
    },
    {
      id: 2,
      client: "Emma Wilson",
      destination: "Paris & London",
      departure: "Jan 8, 2026",
      type: "Luxury Tour",
      commission: "$1,200"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Travel Agent Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome back, {user?.name || "Travel Agent"}! Here's your business overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                +3 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Itineraries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeItineraries}</div>
              <p className="text-xs text-muted-foreground">
                In planning phase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                From 47 reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings This Month</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookingsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                $45K total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.consultationsScheduled}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Client Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </div>

            <div className="grid gap-6">
              {recentClients.map((client) => (
                <Card key={client.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-1" />
                          {client.email}
                        </CardDescription>
                      </div>
                      <Badge variant={client.status === "Booked" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{client.destination}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Budget: {client.budget}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Last contact: {client.lastContact}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Itineraries Tab */}
          <TabsContent value="itineraries" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Trip Itineraries</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Itinerary
              </Button>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tuscany Wine & Culture Tour</CardTitle>
                  <CardDescription>15-day luxury experience for Sarah Johnson</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Badge>Draft</Badge>
                      <span className="text-sm text-gray-600">Mar 15-30, 2026</span>
                      <span className="text-sm text-gray-600">$8,000 budget</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">Edit</Button>
                      <Button variant="outline" size="sm">Share with Client</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Upcoming Bookings</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>

            <div className="grid gap-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{booking.client}</CardTitle>
                        <CardDescription>{booking.destination}</CardDescription>
                      </div>
                      <Badge variant="outline">{booking.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">Departure: {booking.departure}</span>
                        <span className="text-sm font-medium text-green-600">
                          Commission: {booking.commission}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0">View Details</Button>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-bold">$12,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bookings</span>
                      <span className="font-bold">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Clients</span>
                      <span className="font-bold">8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Italy</span>
                      <Badge>6 bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Japan</span>
                      <Badge>4 bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>France</span>
                      <Badge>3 bookings</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">4.8</div>
                    <div className="flex justify-center space-x-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Based on 47 reviews</p>
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