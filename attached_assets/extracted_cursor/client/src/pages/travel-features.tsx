import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Package, Trophy } from "lucide-react";
import TravelMoodBoard from "@/components/travel-mood-board";


import Navbar from "@/components/navbar";
import MobileNav from "@/components/mobile-nav";


export default function TravelFeatures() {
  // Get user from localStorage
  const getUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('travelconnect_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const user = getUserFromStorage();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        <MobileNav />
      </div>
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Travel Planning Tools</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enhance your travel experience with our interactive planning tools, smart packing assistance, and gamified exploration challenges.
          </p>
        </div>

        <Tabs defaultValue="mood-boards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="mood-boards" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Mood Boards</span>
            </TabsTrigger>
            <TabsTrigger value="packing-lists" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Packing Lists</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Travel Challenges</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mood-boards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <span>Interactive Travel Mood Boards</span>
                </CardTitle>
                <p className="text-gray-600">
                  Create visual inspiration boards for your trips. Organize images, notes, locations, and activities 
                  to capture the perfect vibe for your travel experiences.
                </p>
              </CardHeader>
              <CardContent>
                <TravelMoodBoard />
              </CardContent>
            </Card>
          </TabsContent>




        </Tabs>
      </div>


    </div>
  );
}