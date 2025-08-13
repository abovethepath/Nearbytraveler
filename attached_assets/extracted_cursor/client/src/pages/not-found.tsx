import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Compass, Users } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg mx-auto shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-travel-blue rounded-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            Oops! You've wandered off the map
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            The page you're looking for doesn't exist. Let's get you back on track!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/">
              <Button className="w-full bg-travel-blue hover:bg-blue-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Link href="/events">
              <Button variant="outline" className="w-full border-travel-blue text-travel-blue hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-700">
                <Compass className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
            </Link>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Or explore what Nearby Traveler has to offer:
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/messages" className="text-travel-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Connect with travelers
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
