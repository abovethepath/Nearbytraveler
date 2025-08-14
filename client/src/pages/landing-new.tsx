
import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { MapPin, Users, Calendar, MessageCircle } from 'lucide-react';
import { LandingNavbar } from '../components/landing-navbar';
import { Footer } from '../components/footer';

const LandingNew: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Connect with Fellow
              <span className="text-blue-600 block">Travelers Worldwide</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Meet locals and travelers, discover hidden gems, and create unforgettable memories. 
              Your perfect travel companion is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/about')}
                className="px-8 py-3 text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Amazing Travel Experiences
            </h2>
            <p className="text-xl text-gray-600">
              Connect, explore, and create memories that last a lifetime
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Meet People</h3>
                <p className="text-gray-600">
                  Connect with locals and fellow travelers who share your interests
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover Places</h3>
                <p className="text-gray-600">
                  Find hidden gems and authentic experiences recommended by locals
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Join Events</h3>
                <p className="text-gray-600">
                  Participate in meetups, tours, and activities with like-minded people
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Stay Connected</h3>
                <p className="text-gray-600">
                  Chat with your travel network and share experiences in real-time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who have found their perfect travel companions
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingNew;
