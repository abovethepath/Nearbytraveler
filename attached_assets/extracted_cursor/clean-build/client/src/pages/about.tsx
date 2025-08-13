import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Globe, Heart, Shield, Zap, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/footer";

export default function About() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center h-24">
            <Logo variant="navbar" />
            <Link href="/">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-gray-50"
                onClick={scrollToTop}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-full mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            About Nearby Traveler
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Where local experiences meet worldwide connections. We're revolutionizing how people travel, 
            connect, and experience the world through meaningful relationships with locals and fellow travelers.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About Nearby Traveler</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Nearby Traveler, we believe travel is about more than just ticking off landmarks and tourist attractions— 
                it's about forging real connections, discovering local hidden gems, and creating unforgettable memories with 
                people who share similar passions.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We're redefining the way people explore the world by connecting travelers with locals, fellow travelers, 
                and businesses through shared interests, activities, demographics, travel plans, and planned events. 
                Our platform is designed to go beyond generic recommendations and give you meaningful ways to engage 
                with the people and places that make a destination truly special.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Whether you're a solo traveler looking for a travel companion, a local eager to share their city's 
                best-kept secrets, or a purpose-driven business ready to welcome like-minded visitors — Nearby Traveler 
                is your bridge to authentic experiences and global friendships.
              </p>
              <p className="text-lg text-gray-600 font-medium">
                Because the most memorable moments don't come from guidebooks — they come from real connections.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
                  <p className="text-sm text-gray-600">Match with like-minded people worldwide</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Globe className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Explore</h3>
                  <p className="text-sm text-gray-600">Discover authentic local experiences</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                  <p className="text-sm text-gray-600">Create meaningful travel memories</p>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Nearby Traveler Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our intelligent matching system connects you with the right people at the right time and place.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Your Interests</h3>
              <p className="text-gray-600">
                Tell us about your travel style, interests, activities you enjoy, and the types of experiences you're seeking.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Matched</h3>
              <p className="text-gray-600">
                Our algorithm finds locals, fellow travelers, and businesses that align with your preferences and travel plans.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect & Experience</h3>
              <p className="text-gray-600">
                Message, meet up, and create unforgettable experiences together while building lasting friendships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Makes Us Different</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're not just another travel app. We're a community-driven platform focused on authentic connections.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Matching</h3>
              <p className="text-gray-600">
                Advanced compatibility scoring based on interests, travel dates, and lifestyle preferences.
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Location Intelligence</h3>
              <p className="text-gray-600">
                Find people in your current city, travel destinations, or hometown - with date overlap detection.
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Ecosystem</h3>
              <p className="text-gray-600">
                Connect with travelers, locals, and authentic businesses all in one integrated platform.
              </p>
            </div>
            <div className="text-center">
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Authentic Experiences</h3>
              <p className="text-gray-600">
                Discover secret local activities and hidden gems that only locals know about.
              </p>
            </div>

            <div className="text-center">
              <Globe className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{color: '#000000'}}>Los Angeles Beta Launch</h3>
              <p className="text-gray-600" style={{color: '#000000'}}>
                Starting our beta in Los Angeles with plans to expand to cities worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">A Personal Journey</h2>
          <div className="text-lg leading-relaxed space-y-6">
            <p>
              Nearby Traveler was born from a simple but powerful realization: the best travel experiences 
              happen when you connect with people who share your interests and passions.
            </p>
            <p>
              As travelers ourselves, we've experienced the magic that happens when you meet someone who 
              loves the same things you do - whether it's a local who shares your passion for jazz clubs, 
              a fellow traveler interested in the same hiking trails, or a business owner who truly 
              understands your values.
            </p>
            <p>
              Traditional travel platforms focus on bookings and reviews. We focus on people and connections. 
              Because at the end of the day, it's not the places you visit that make travel memorable - 
              it's the people you meet along the way.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Transform Your Travel?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join travelers and locals who are creating meaningful connections starting in Los Angeles.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white px-8 py-3"
              onClick={() => {
                // Clear all possible user data to force fresh signup
                localStorage.removeItem('travelconnect_user');
                localStorage.removeItem('signup_data');
                localStorage.removeItem('traveler_signup_data');
                localStorage.removeItem('local_signup_data');
                localStorage.removeItem('business_signup_data');
                // Add forceSignup parameter to ensure fresh signup flow
                window.location.href = '/auth?mode=register&force=true';
              }}
            >
              Join Nearby Traveler
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}