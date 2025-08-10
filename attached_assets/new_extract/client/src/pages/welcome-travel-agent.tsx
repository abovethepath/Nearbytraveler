import { useContext } from "react";
import { Link } from "wouter";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Users,
  DollarSign,
  Globe,
  Calendar,
  MessageCircle,
  BarChart3,
  Camera,
  Award,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function WelcomeTravelAgent() {
  const { user } = useContext(AuthContext);

  const features = [
    {
      icon: Globe,
      title: "Professional Mini-Website",
      description: "Create your own branded travel agent page with custom URL (nearbytravel.com/agent/yourname)",
      benefits: ["Showcase your expertise", "Display trip packages", "Professional credibility"]
    },
    {
      icon: Calendar,
      title: "Trip Management System",
      description: "List and manage all your travel packages with pricing, dates, and bookings",
      benefits: ["Easy trip creation", "Booking management", "Automated client communication"]
    },
    {
      icon: MessageCircle,
      title: "Private Client Chatrooms",
      description: "Create exclusive chatrooms for clients going on the same trips or cruises",
      benefits: ["Group communication", "Trip coordination", "Enhanced client experience"]
    },
    {
      icon: Users,
      title: "Client Management Dashboard",
      description: "Comprehensive tools to manage your clients, bookings, and business analytics",
      benefits: ["Client database", "Commission tracking", "Performance insights"]
    },
    {
      icon: BarChart3,
      title: "Business Growth Tools",
      description: "Access our platform's traveler network and grow your client base organically",
      benefits: ["Exposure to new clients", "Marketing automation", "Professional networking"]
    },
    {
      icon: DollarSign,
      title: "Revenue Management",
      description: "Track commissions, manage payments, and monitor your business performance",
      benefits: ["Commission tracking", "Financial analytics", "Revenue optimization"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-orange-600 rounded-full">
              <Plane className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Nearby Traveler, {user?.name}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You're now part of our professional travel agent network. Start building your mini-website, 
            showcase your expertise, and connect with travelers worldwide.
          </p>
        </div>

        {/* Success Message */}
        <Card className="mb-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="w-6 h-6 mr-2" />
              Account Created Successfully!
            </CardTitle>
            <CardDescription>
              Your travel agent account is ready. You can now access all professional features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">FREE</div>
                <div className="text-sm">During Beta Period</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$50/month</div>
                <div className="text-sm">After Beta (Full Features)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">Unlimited</div>
                <div className="text-sm">Trip Listings & Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Your Travel Agent Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <Star className="w-3 h-3 mr-2 text-yellow-500" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get started with your travel agent business in 4 easy steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                <h3 className="font-semibold mb-2">Setup Dashboard</h3>
                <p className="text-sm text-muted-foreground">Access your travel agent dashboard and complete your profile</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                <h3 className="font-semibold mb-2">Create Trip Packages</h3>
                <p className="text-sm text-muted-foreground">Add your first travel packages with photos and pricing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                <h3 className="font-semibold mb-2">Publish Your Page</h3>
                <p className="text-sm text-muted-foreground">Make your mini-website live and shareable</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                <h3 className="font-semibold mb-2">Share & Grow</h3>
                <p className="text-sm text-muted-foreground">Share your unique URL and start accepting bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Benefits */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-orange-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Why Travel Agents Choose Nearby Traveler</CardTitle>
            <CardDescription className="text-blue-100">
              Join thousands of travel professionals growing their business on our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Network Growth</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• Access to our growing traveler community</li>
                  <li>• Professional credibility through platform association</li>
                  <li>• Cross-referral opportunities with other agents</li>
                  <li>• Exposure to international travelers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Business Tools</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• Professional website without development costs</li>
                  <li>• Automated booking and communication systems</li>
                  <li>• Client management and analytics dashboard</li>
                  <li>• Private client group coordination tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Link href="/travel-agent-dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
                <BarChart3 className="w-5 h-5 mr-2" />
                Access Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button size="lg" variant="outline">
                <Users className="w-5 h-5 mr-2" />
                Complete Profile
              </Button>
            </Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Your unique agent page will be available at: 
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded ml-1">
              nearbytravel.com/agent/{user?.username}
            </span>
          </div>
        </div>

        {/* Support Information */}
        <Card className="mt-12 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">Need Help Getting Started?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Support Chat</h3>
                <p className="text-sm text-muted-foreground">Get instant help from our team</p>
              </div>
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Video Tutorials</h3>
                <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
              </div>
              <div className="text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Agent Community</h3>
                <p className="text-sm text-muted-foreground">Connect with other professionals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}