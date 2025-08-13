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

  const handleEnterProfile = () => {
    if (user?.id) {
      setLocation(`/profile/${user.id}`);
    } else {
      // Fallback to profile page
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6 leading-loose px-4">
            Welcome to Nearby Traveler!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed px-4">
            Your account has been created successfully! 🎉
          </p>
        </div>

        {/* Quick Benefits Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
            </CardContent>
          </Card>
          ))}
              </div>
              
        {/* Next Steps */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Next Steps
          </h2>
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-6 max-w-2xl mx-auto backdrop-blur-sm">
            <ul className="text-left space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Complete your profile with interests and travel plans</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Upload photos to showcase your personality</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Start connecting with nearby locals and travelers</span>
              </li>
            </ul>
              </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
                <Button 
                  onClick={handleEnterProfile}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Complete Your Profile →
                </Button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            You can also explore the app first, but completing your profile will help you connect better!
        </div>
        </div>
      </div>
    </div>
  );
}