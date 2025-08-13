import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, MapPin, Calendar, User, Camera, MessageSquare } from "lucide-react";
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

  const nextSteps = [
    {
      icon: <User className="h-5 w-5" />,
      title: "Complete Your Profile",
      description: "Add photo, bio, gender, sexual preference, and languages to help people find you",
      action: "Go to Profile"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Set Travel Plans",
      description: "Add more destinations and travel dates to connect with travelers",
      action: "Add Travel Plans"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Join City Chatrooms", 
      description: "Connect with locals and travelers in your hometown and destinations",
      action: "Browse Chatrooms"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Account Created Successfully!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            We kept signup simple by focusing on the essentials. You can add the rest of your details inside the app.
          </p>
        </div>

        {/* What We Saved vs What's Next */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Streamlined Signup */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                What You've Already Set
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Account credentials & username
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Age and date of birth
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Hometown location
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Travel destination & return date
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  3 top interests for matching
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                <Users className="h-5 w-5" />
                Complete When Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Profile photo & bio
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Gender & preferences
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Activities & events you enjoy
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Languages you speak
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Additional travel plans
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's Next?
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                Three simple steps to start making connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        {step.icon}
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{step.description}</p>
                      <Button 
                        onClick={() => setLocation(index === 0 ? '/profile' : index === 1 ? '/travel-plans' : '/city-chatrooms')}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        {step.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Main Call to Action */}
        <div className="text-center">
          <Card className="max-w-md mx-auto border-0 shadow-lg bg-gradient-to-r from-blue-500 to-orange-500">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Connect?
              </h3>
              <p className="text-white/90 mb-6">
                Complete your profile to start meeting locals and travelers in your area
              </p>
              <Button 
                onClick={handleEnterApp}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 w-full text-lg font-semibold shadow-lg transition-colors duration-200"
                data-testid="button-enter-app"
              >
                Complete My Profile
              </Button>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Need help? Check out our{" "}
            <Link href="/getting-started">
              <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Getting Started Guide
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}