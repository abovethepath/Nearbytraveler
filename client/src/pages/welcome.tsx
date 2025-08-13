import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, MapPin, Calendar, Heart, Star, TrendingUp } from "lucide-react";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/App";
import Logo from "@/components/logo";
import { useLocation, Link } from "wouter";

export default function Welcome() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  // Redirect business users to business welcome page
  useEffect(() => {
    if (user && user.userType === 'business') {
      setLocation('/welcome-business');
    }
  }, [user, setLocation]);

  const handleSkipToProfile = () => {
    setLocation('/profile');
  };

  const handleEnterApp = async () => {
    console.log('🚨 ENTER APP BUTTON CLICKED');
    console.log('🔍 Current user:', user);
    console.log('🔍 User ID:', user?.id);
    
    // Navigate directly to profile page - user is already authenticated to see this page
    if (user?.id) {
      console.log('✅ NAVIGATING TO USER PROFILE:', `/profile/${user.id}`);
      setLocation(`/profile/${user.id}`);
    } else {
      console.log('✅ NAVIGATING TO GENERIC PROFILE');
      setLocation('/profile');
    }
  };

  const benefits = [
    {
      icon: <Users className="h-5 w-5 text-blue-600" />,
      title: "Connect with Nearby Locals & Travelers",
      description: "Meet authentic people who share your interests and travel plans"
    },
    {
      icon: <MapPin className="h-5 w-5 text-orange-600" />,
      title: "Discover Hidden Local Experiences",
      description: "Access insider recommendations from real locals in your destinations"
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-600" />,
      title: "Find Travel Companions",
      description: "Connect with fellow travelers visiting the same places at the same time"
    },
    {
      icon: <Heart className="h-5 w-5 text-red-500" />,
      title: "Build Meaningful Connections",
      description: "Form lasting friendships through shared travel experiences and common interests"
    }
  ];

  const nextSteps = [
    "Complete your profile: Add your photo, bio, gender, sexual preference, activities, events, and languages",
    "Set your travel plans and current destinations", 
    "Upload photos to showcase your personality and travel experiences",
    "Visit the City Match page for location-specific activities and events tailored to your destination",
    "Start connecting with nearby locals and travelers who share your interests",
    "Create and join meetups, events, and activities in your area"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Quick Access Button at Top */}
        <div className="text-right mb-4">
          <Button 
            onClick={handleSkipToProfile}
            variant="outline"
            className="bg-white/80 border-gray-300 hover:bg-white"
          >
            Go to Profile →
          </Button>
        </div>
        {/* Modern Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-12 leading-loose px-4" style={{ lineHeight: '1.3' }}>
            Welcome to Nearby Traveler!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed px-4">
            Connect with Nearby Locals and Nearby Travelers based on Common interests and Demographics
          </p>
          
          {/* What To Do Now - Action Focused */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Ready to Start Connecting!
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Your account is set up. Here's what to do next to maximize your connections:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Complete Your Profile</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Add your photo, bio, gender, sexual preference, activities, events, languages, and military status. Visit City Match page for location-specific recommendations.</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Add Travel Plans</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">Share your destinations and travel dates</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Discover Events</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400">Find and create activities in your area</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Start Connecting</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400">Browse nearby locals and travelers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Modern Feature Cards */}
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 dark:text-white text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                Platform Features
              </CardTitle>
              <CardDescription className="dark:text-gray-300 text-base">
                Everything you need to connect with locals and travelers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{benefit.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Modern Next Steps */}
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 dark:text-white text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                Your Journey Starts Now
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400 font-medium text-base">
                Complete these steps to unlock amazing connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-orange-900 dark:text-orange-300">The Secret Sauce</h4>
                </div>
                <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                  Our AI matching algorithm analyzes your interests, activities, and travel plans to connect you with perfect companions. The more you share, the more magical your connections become.
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Your Action Plan:
                </h4>
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pt-1 leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Call to Action */}
        <div className="text-center mt-8 space-y-6">
          <Card className="max-w-md mx-auto border-0 shadow-lg bg-gradient-to-r from-blue-500 to-orange-500">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-black mb-4">
                Ready to Start Your Journey?
              </h3>
              <p className="text-black mb-6">
                First, let's set up your profile and upload your avatar photo so people can find you
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={handleEnterApp}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 px-12 py-4 w-full text-xl shadow-2xl transition-colors duration-300 border-2 border-white/20 nearby-traveler-btn-text-v2"
                >
                  🌟 Enter Nearby Traveler
                </Button>
                <Button 
                  onClick={() => setLocation('/')}
                  variant="outline"
                  size="lg"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-semibold px-8 w-full"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>



          {/* Profile Optimization Call-to-Action */}
          <Card className="max-w-md mx-auto border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20">
            <CardContent className="p-6">
              <h4 className="font-semibold text-black dark:text-black mb-2">
                Optimize your profile for better connections
              </h4>
              <p className="text-sm text-black dark:text-black mb-4">
                Get more matches and meaningful connections with our optimization guide
              </p>
              <Button 
                onClick={() => setLocation('/getting-started')}
                variant="outline"
                className="w-full border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Profile Optimization Tips
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Check out our{" "}
            <Link href="/getting-started">
              <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Getting Started Guide
              </span>
            </Link>{" "}
            or reach out to our community support team
          </p>
        </div>
      </div>
    </div>
  );
}