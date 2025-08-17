import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Globe, Star, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Donate() {
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const donationTiers = [
    {
      id: "supporter",
      name: "Community Supporter",
      amount: "$15",
      period: "year",
      description: "Help keep our community thriving",
      features: [
        "Support platform maintenance",
        "Community supporter badge"
      ],
      icon: <Heart className="w-8 h-8 text-red-500" />,
      popular: false
    },
    {
      id: "explorer",
      name: "Travel Explorer",
      amount: "$20",
      period: "year", 
      description: "Power authentic travel connections",
      features: [
        "Everything in Community Supporter",
        "Explorer badge with profile flair"
      ],
      icon: <Globe className="w-8 h-8 text-blue-500" />,
      popular: true
    },
    {
      id: "ambassador",
      name: "Travel Ambassador", 
      amount: "$30",
      period: "year",
      description: "Become a champion of meaningful travel",
      features: [
        "Everything in Travel Explorer",
        "Ambassador badge with cute flair"
      ],
      icon: <Star className="w-8 h-8 text-orange-500" />,
      popular: false
    }
  ];

  const handleDonate = (tierId: string) => {
    setSelectedTier(tierId);
    // In a real implementation, this would integrate with Stripe
    // For now, we'll show a thank you message
    alert(`Thank you for choosing to support Nearby Traveler! This feature will be enabled soon with Stripe integration.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Support Nearby Traveler</h1>
              <p className="text-gray-600 dark:text-gray-300">Help us build the world's most authentic travel community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Mission Statement */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black dark:text-white">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Nearby Traveler connects authentic travelers with passionate locals and trusted businesses worldwide. 
              We believe travel should be about genuine human connections, not just tourist attractions.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Your support helps us maintain a free platform for travelers while ensuring locals and businesses 
              can share their authentic experiences without barriers. Every contribution directly improves our 
              community matching, safety features, and global expansion.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
              Geeze running a website is expensive. Storing data, Keep safety cyber security, paying for everything to maintain this site. A little help goes a long way. Thanks so much.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-right mt-2">
              - Aaron
            </p>
          </CardContent>
        </Card>

        {/* Donation Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {donationTiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`relative transition-all duration-200 flex flex-col h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                selectedTier === tier.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${tier.popular ? 'border-orange-500 border-2' : ''} ${
                tier.id === 'ambassador' ? 'bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-500' : ''
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  {tier.icon}
                </div>
                <CardTitle className="text-xl text-black dark:text-white">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-black dark:text-white">
                  {tier.amount}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-300">/{tier.period}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{tier.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleDonate(tier.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  style={{ transition: 'none' }}
                >
                  Support {tier.amount}/year
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Angel Investor Section */}
        <div className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 border-2 border-yellow-200 dark:border-yellow-500">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-black dark:text-white">Angel Investor</h3>
            <p className="text-lg mb-6 text-black dark:text-white">One-time investment opportunity</p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-yellow-200 dark:border-yellow-500">
              <ul className="text-center space-y-3 text-black dark:text-white">
                <li className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Everything in Travel Ambassador (Joking you wont get any profile flair)
                </li>
                <li className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Contact Us For Investment Opportunities
                </li>
              </ul>
            </div>
            
            <Button
              onClick={() => handleDonate("angel")}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg"
              style={{transition: 'none'}}
            >
              Contact for Investment
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}