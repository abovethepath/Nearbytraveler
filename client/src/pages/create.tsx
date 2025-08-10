import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Camera, Zap, MessageCircle } from "lucide-react";

export default function Create() {
  const [, setLocation] = useLocation();

  const createOptions = [
    {
      icon: Users,
      title: "Quick Meetup",
      description: "Start an instant meetup in your area",
      color: "bg-blue-500",
      path: "/quick-meetups"
    },
    {
      icon: Calendar,
      title: "Event",
      description: "Create a planned event",
      color: "bg-green-500",
      path: "/create-event"
    },
    {
      icon: MapPin,
      title: "Travel Plan",
      description: "Plan your next trip",
      color: "bg-purple-500",
      path: "/plan-trip"
    },
    {
      icon: Camera,
      title: "Travel Memory",
      description: "Share photos from your travels",
      color: "bg-orange-500",
      path: "/travel-memories"
    },
    {
      icon: Zap,
      title: "Hidden Gem",
      description: "Share a secret local spot",
      color: "bg-pink-500",
      path: "/hidden-gems"
    },
    {
      icon: MessageCircle,
      title: "City Chat",
      description: "Join or create city discussions",
      color: "bg-indigo-500",
      path: "/city-chatrooms"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create Something New
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your experiences and connect with travelers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {createOptions.map((option) => {
            const Icon = option.icon;
            
            return (
              <Card 
                key={option.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md"
                onClick={() => {
                  console.log('🎯 Create option clicked:', option.title, 'path:', option.path);
                  console.log('🎯 Before setLocation - current location:', window.location.pathname);
                  setLocation(option.path);
                  console.log('🎯 After setLocation - navigating to:', option.path);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}