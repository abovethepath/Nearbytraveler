import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  MapPin, 
  Calendar, 
  Users, 
  MessageCircle, 
  Settings, 
  Heart,
  Camera,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Star
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/footer";

export default function SuccessTips() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const steps = [
    {
      number: 1,
      title: "Complete Your Profile",
      icon: <User className="h-6 w-6" />,
      description: "Add your interests, activities, and events to help us match you with like-minded people",
      details: [
        "Fill out your bio with personality and **lots of** photos",
        "Select **as many interests** as possible from our extensive list",
        "Choose **every and all** your preferred activities and events",
        "Add **as many** of your own location-specific interests and activities in the **city match page**",
        "Upload a profile photo to increase connections",
        "Add your hometown and all your **secret non-touristy** events"
      ],
      tip: "The more details you add, the better connections you'll make and definitely add your own non-touristy local adventures for travelers to discover! **TAKE ADVANTAGE OF OUR CITY MATCH PAGE!!!!!**"
    },
    {
      number: 2,
      title: "Plan Your Trips",
      icon: <Calendar className="h-6 w-6" />,
      description: "Create travel plans to connect with locals and fellow travelers at your destinations",
      details: [
        "Add destinations you're visiting or planning to visit",
        "Include your travel dates for accurate matching",
        "Specify all your travel interests and **as many** activities desired **IN THE CITY MATCH PAGE**",
        "Choose events you'd attend and add **ALL** your own",
        "Select your travel style (solo, couple, group, etc.)"
      ],
      tip: "Add future trips too - you can connect with people before you travel!"
    },
    {
      number: 3,
      title: "Discover People",
      icon: <Users className="h-6 w-6" />,
      description: "Find Nearby Locals and Nearby Travelers who share your interests",
      details: [
        "Browse people in your hometown or travel destinations",
        "Use filters to find compatible matches",
        "Check compatibility scores based on shared interests",
        "View travel plans to see overlapping dates",
        "Read profiles to learn about people's travel styles and interests"
      ],
      tip: "Look for high compatibility scores and shared travel dates!"
    },
    {
      number: 4,
      title: "Make Connections",
      icon: <Heart className="h-6 w-6" />,
      description: "Send connection requests and start building your travel network",
      details: [
        "Send connection requests to interesting people",
        "Write personalized messages explaining why you'd like to connect",
        "Accept requests from others who share your interests",
        "Build your network before and during your travels",
        "Leave references for people you've met"
      ],
      tip: "Personalized connection requests get better responses than generic ones!"
    },
    {
      number: 5,
      title: "Start Messaging",
      icon: <MessageCircle className="h-6 w-6" />,
      description: "Chat with your connections and plan meetups",
      details: [
        "Message your connections to plan activities",
        "Share travel tips and local recommendations",
        "Coordinate meetups and events",
        "Use translation features for international connections",
        "Keep all communication on the platform for safety"
      ],
      tip: "Always meet in public places and trust your instincts!"
    },
    {
      number: 6,
      title: "Join Events & Activities",
      icon: <Calendar className="h-6 w-6" />,
      description: "Participate in local events and create your own",
      details: [
        "Browse events in your area or travel destinations",
        "RSVP to events that interest you",
        "Create your own events and invite connections",
        "Meet multiple people at group activities",
        "Discover authentic local experiences"
      ],
      tip: "Events are great for meeting multiple people at once!"
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-24">
            <Link href="/">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                onClick={scrollToTop}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Step-by-Step Guide */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Success Tips
          </h2>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-white">
                        {step.icon}
                        {step.title}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What to do:</h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span 
                              className="text-sm text-gray-700 dark:text-gray-300"
                              dangerouslySetInnerHTML={{
                                __html: detail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Pro Tip
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{step.tip}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-900 dark:text-orange-300 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Safety & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">Always Remember:</h4>
                  <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Meet in public places for first meetings
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Trust your instincts about people and situations
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Keep communication on the platform
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Read profiles thoroughly before connecting
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">For Best Results:</h4>
                  <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Be authentic in your profile and messages
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Respond to messages promptly and politely
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Leave references for positive experiences
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      Report any inappropriate behavior
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>



    </div>
  );
}