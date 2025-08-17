import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Building, MapPin, Users, TrendingUp, Target, Star, DollarSign } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/App";
import { useLocation, Link } from "wouter";

export default function WelcomeBusiness() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  const handleEnterDashboard = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLocation('/business-dashboard');
  };

  const businessBenefits = [
    {
      icon: <Target className="h-5 w-5 text-blue-600" />,
      title: "Target Nearby Travelers & Locals",
      description: "Connect directly with customers who are actively looking for your services and products"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      title: "Boost Local Visibility",
      description: "Get discovered by travelers and locals based on their specific interests and needs"
    },
    {
      icon: <Users className="h-5 w-5 text-orange-600" />,
      title: "Build Customer Community",
      description: "Create lasting relationships with customers who share your business values and offerings"
    },
    {
      icon: <DollarSign className="h-5 w-5 text-orange-600" />,
      title: "Drive Revenue Growth",
      description: "Attract new customers and increase repeat business through targeted promotions"
    }
  ];

  const nextSteps = [
    "Complete your business profile with detailed services and specialties",
    "Add special offers and promotions to attract customers",
    "Upload photos showcasing your business and products",
    "Start connecting with nearby travelers and locals",
    "Create events and activities to promote your business"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Business Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-600 rounded-full mb-6">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-orange-600 to-blue-800 bg-clip-text text-transparent mb-12 leading-loose px-4" style={{ lineHeight: '1.3' }}>
            Welcome to Your Business Network
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed px-4">
            Connect with Nearby Travelers and Nearby Locals who are actively seeking your services
          </p>
          
          {/* Business Success Story */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-12 md:p-16 shadow-xl border border-gray-200/50 dark:border-gray-700/50 max-w-6xl mx-auto">
            <div className="prose prose-xl text-gray-700 dark:text-gray-300 mx-auto text-left px-8 md:px-16">
              <div className="flex items-center justify-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-0">Your Business Success Platform</h3>
              </div>
              <p className="mb-6 leading-relaxed text-lg">
                Your business is now part of a growing network that connects local businesses with travelers and locals who are genuinely interested in what you offer. This intelligent platform goes beyond traditional advertising by creating meaningful connections.
              </p>
              <p className="mb-6 leading-relaxed text-lg">
                Unlike generic advertising platforms, Nearby Traveler helps you reach customers based on their specific interests, travel plans, and preferences—making every connection more meaningful and profitable for your business growth.
              </p>
              <div className="mb-6 leading-relaxed pl-6 text-lg">
                <p className="mb-3"><strong className="text-blue-600 dark:text-blue-400">- Search and directly market to locals and travelers who express interest in your area or services</strong></p>
                <p className="mb-3"><strong className="text-blue-600 dark:text-blue-400">- Target customers with matching interests and preferences for better conversion rates</strong></p>
                <p className="mb-3"><strong className="text-blue-600 dark:text-blue-400">- Promote special offers and events to engaged audiences who care about your services</strong></p>
                <p className="mb-3"><strong className="text-blue-600 dark:text-blue-400">- Build a loyal customer community that drives repeat business and referrals</strong></p>
              </div>
              <p className="mb-6 leading-relaxed text-lg">
                Complete your business dashboard setup to start attracting customers who are actively looking for businesses like yours. The platform automatically matches your services with interested users.
              </p>
              <p className="mb-0 leading-relaxed font-medium text-gray-800 dark:text-white text-lg">
                Ready to grow your business and connect with your ideal customers?<br />
                Welcome to the Nearby Traveler Business Network.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Business Features Card */}
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-orange-500 to-blue-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 dark:text-white text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Business Growth Tools
              </CardTitle>
              <CardDescription className="dark:text-gray-300 text-base">
                Everything you need to connect with customers and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {businessBenefits.map((benefit, index) => (
                <div key={index} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 dark:text-white text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                Get Started Checklist
              </CardTitle>
              <CardDescription className="dark:text-gray-300 text-base">
                Follow these steps to maximize your business success
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {step}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Multiple Business Info */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 dark:text-white text-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-white" />
                </div>
                Managing Multiple Businesses?
              </CardTitle>
              <CardDescription className="dark:text-gray-300 text-sm">
                Our platform supports business owners with multiple locations or businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Email Variants for Additional Businesses:</h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>• <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">owner@example.com</code> (First business)</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">owner+restaurant@example.com</code> (Restaurant)</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">owner+shop@example.com</code> (Retail store)</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">owner+services@example.com</code> (Service business)</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All emails go to the same inbox while maintaining separate business accounts. Each business gets its own profile, deals, and customer interactions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleEnterDashboard}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Open Business Dashboard
          </Button>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/events">
              <Button variant="outline" size="lg" className="px-6">
                Create Business Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Business Stats Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl p-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-center mb-6 dark:text-white">
                Currently FREE During Beta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">$0</div>
                  <div className="text-gray-600 dark:text-gray-300">Monthly Cost</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">5</div>
                  <div className="text-gray-600 dark:text-gray-300">Special Offers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                  <div className="text-gray-600 dark:text-gray-300">Full Access</div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Take advantage of free access while we build our community
              </p>
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-center text-sm text-orange-700 dark:text-orange-300 font-medium">
                  After Beta: $50/month + $100 one-time signup fee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}