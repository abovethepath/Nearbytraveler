import { Link } from "wouter";
import { Globe, MapPin, Users, Plus, Compass, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingAlt() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      {/* Header */}
      <header className="p-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold">
              <span className="text-cyan-400">Nearby</span>
              <span className="text-orange-400">Traveler</span>
            </span>
          </div>
          <Button variant="outline" className="border-cyan-300 text-cyan-600 hover:bg-cyan-50" asChild>
            <Link href="/api/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-orange-500 mb-8 leading-tight">
            We're changing the way you travel,<br />
            one connection, one experience and<br />
            one new friend at a time.
          </h1>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {/* Sign Up */}
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-cyan-100 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-cyan-300 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-700" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Sign up</h3>
                <p className="text-gray-600 text-lg">
                  Based on interests, activities and events in your city.
                </p>
              </div>
            </div>

            {/* Plan */}
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-300 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Plan</h3>
                <p className="text-gray-600 text-lg">
                  Your trip based on interests, activities and events in your destination city.
                </p>
              </div>
            </div>

            {/* Connect */}
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-300 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Connect</h3>
                <p className="text-gray-600 text-lg">
                  With other travelers and locals in that destination city based on your interests.
                </p>
              </div>
            </div>

            {/* Add */}
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-300 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Add</h3>
                <p className="text-gray-600 text-lg">
                  friends and plan your own adventures with Nearby Travelers and locals.
                </p>
              </div>
            </div>

            {/* Explore */}
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-blue-300 rounded-lg flex items-center justify-center">
                    <Compass className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Explore</h3>
                <p className="text-gray-600 text-lg">
                  your destination city together with locals and other Nearby Travelers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to Change How You Travel?
          </h2>
          <Button 
            size="lg" 
            className="bg-white text-cyan-600 hover:bg-gray-100 text-xl px-12 py-4 font-semibold"
            asChild
          >
            <Link href="/api/login">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">
              <span className="text-cyan-400">Nearby</span>
              <span className="text-orange-400">Traveler</span>
            </span>
          </div>
          <p className="text-gray-400">Connecting travelers worldwide</p>
        </div>
      </footer>
    </div>
  );
}