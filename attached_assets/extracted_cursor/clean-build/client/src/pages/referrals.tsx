import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReferralWidget from "@/components/referral-widget";

export default function ReferralsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                window.history.back();
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Referral Program</h1>
              <p className="text-gray-600 dark:text-gray-300">Refer businesses (not regular users) to Nearby Traveler and earn $100 per successful business subscription</p>
              <div className="mt-2 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-bold text-lg">
                  💰 Earn $100 Side Income for Each Business Referral!
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Help fund your next trip • Get exclusive deals from local hotspots • Build steady side income
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Explanation Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Turn Your Network Into Side Income</h2>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Help grow the Nearby Traveler business community and earn money! Share Nearby Traveler with local businesses 
              you know. When they sign up and become paying subscribers, you'll earn $100. This program is specifically for business referrals, not for referring regular travelers or locals.
            </p>
            
            {/* Business Referral Highlight */}
            <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                💰 Business Referral Program - Earn $100 Per Referral!
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                Know restaurants, tour companies, hotels, or local businesses? Refer them and earn serious side income:
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-600">
                  <div className="font-semibold text-green-900 dark:text-green-100 mb-1">Help Fund Your Trips</div>
                  <div className="text-green-700 dark:text-green-300">Each $100 referral can help you pay for flights, hotels, experiences or anything you want</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-600">
                  <div className="font-semibold text-green-900 dark:text-green-100 mb-1">Get Local Deals</div>
                  <div className="text-green-700 dark:text-green-300">Businesses you refer give the Nearby Traveler community exclusive discounts</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-600">
                  <div className="font-semibold text-green-900 dark:text-green-100 mb-1">Build Side Income</div>
                  <div className="text-green-700 dark:text-green-300">Steady earnings from your local business network</div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Share Nearby Traveler</div>
                <div className="text-blue-700 dark:text-blue-300">Tell businesses about the platform and provide your username for reference</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Business Subscribes</div>
                <div className="text-blue-700 dark:text-blue-300">They sign up mentioning your username and become a paying subscriber</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">You Earn $100</div>
                <div className="text-blue-700 dark:text-blue-300">Get $100 when they complete payment and subscription</div>
              </div>
            </div>
          </div>

          <ReferralWidget />
        </div>
      </div>
    </div>
  );
}