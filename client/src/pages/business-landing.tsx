import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Star,
  Target,
  BarChart3,
  Clock,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Zap,
  Trophy,
  Heart,
  Calendar,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import businessHeaderPhoto from "@assets/image_1756765621788.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);
  
  // Single powerful tagline
  const mainTagline = "Turn Travelers Into Customers";
  
  // Check URL for layout parameter - default to Airbnb style
  const urlParams = new URLSearchParams(window.location.search);
  const isAirbnbStyle = urlParams.get('layout') !== 'centered';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          JOIN NOW
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 sm:pt-4 sm:pb-6 bg-white dark:bg-gray-900">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">💰 REVENUE MULTIPLIER</span>
                </div>
                
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  <h1>Turn Travelers Into Customers</h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300">
                  <p>Reach travelers actively seeking your services. No bidding wars, no guesswork.</p>
                </div>
                
                {/* Value Proposition Quick Points */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-600">📍 Location</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">🎯 Interests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">⚡ Instant</div>
                  </div>
                </div>
                
                {/* Desktop CTAs */}
                <div className="hidden sm:flex mt-4 flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      trackEvent('signup_cta_click', 'business_landing', 'claim_beta');
                      setLocation('/launching-soon');
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                    data-testid="button-claim-beta"
                  >
                    <Zap className="w-5 h-5 mr-2 inline" />
                    JOIN NOW
                  </button>
                  <button 
                    onClick={() => {
                      document.querySelector('#problem-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 w-full sm:w-auto"
                    data-testid="button-see-how-it-works"
                  >
                    See How It Works
                  </button>
                </div>
              </div>

              {/* Right image side */}
              <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
                {/* Simple tagline */}
                <div className="mb-2 text-center w-full">
                  <p className="text-sm md:text-lg font-bold text-zinc-800 dark:text-zinc-200 italic px-2">
                    {mainTagline}
                  </p>
                </div>
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                  <img
                    src={businessHeaderPhoto}
                    alt="Successful business owner connecting with customers"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                  />
                </div>
                <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                  Where Authentic Experiences Meet Local Business
                </p>
              </div>
            </div>
          ) : (
            // Original centered layout (for investors)  
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
                Smart Business, Real Results
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Access travelers' exact wants and needs with location-based deals that convert
              </p>
              
              <Button
                onClick={() => setLocation('/launching-soon')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
              >
                Start Growing Revenue
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* THE BUSINESS PROBLEM */}
      <section id="problem-section" className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Stop Wasting Money on Ads
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center">
              <div className="text-red-500 text-xl mb-2">📱</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Facebook</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">$50+ per customer</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center">
              <div className="text-red-500 text-xl mb-2">🔍</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Google</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Bidding wars</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center">
              <div className="text-red-500 text-xl mb-2">📁</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Directories</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Lost in crowd</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center">
              <div className="text-red-500 text-xl mb-2">📲</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Social Media</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Wrong audience</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section className="bg-white dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Direct Customer Intent
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Travelers tell us what they want. We connect them with you.
            </p>
          </div>
          {/* Examples grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-sm italic text-gray-800 dark:text-gray-200 mb-1">"Happy hours in LA"</p>
              <p className="text-xs text-orange-600 font-semibold">→ Bars</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-sm italic text-gray-800 dark:text-gray-200 mb-1">"Family activities"</p>
              <p className="text-xs text-orange-600 font-semibold">→ Entertainment</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <p className="text-sm italic text-gray-800 dark:text-gray-200 mb-1">"Yoga studios"</p>
              <p className="text-xs text-orange-600 font-semibold">→ Wellness</p>
            </div>
          </div>
        </div>
      </section>

      {/* YOUR BUSINESS ADVANTAGE */}
      <section className="bg-white dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Advantage
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center">
              <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">First Mover</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Beat competitors</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Zero Competition</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Direct access</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 text-center">
              <Star className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Quality Customers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Experience seekers</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 text-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Full Data</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Complete profiles</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK COMPARISON */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem Side */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
                Old Way: Waste Money
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>❌ $50+ per customer</div>
                <div>❌ Bidding wars</div>
                <div>❌ Wrong audience</div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 border-green-500">
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
                Our Way: Direct Access
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>✅ Ready buyers only</div>
                <div>✅ Zero competition</div>
                <div>✅ Perfect targeting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEY BENEFITS */}
      <section className="py-6 sm:py-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              What You Get
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 border-orange-500">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Complete Customer Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Budget, interests, group size, travel dates - everything you need to close the sale.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 border-blue-500">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Location Targeting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Reach travelers in your city and locals seeking new experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEALS EXAMPLES */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Deals That Convert
            </h2>
          </div>

          {/* Simple examples grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="text-xl mb-2">🍻</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Happy Hour</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">50% off drinks</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="text-xl mb-2">🌮</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Taco Tuesday</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">2-for-1 tacos</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="text-xl mb-2">🏌️</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Golf Tournament</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Tourist vs Local</p>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Perfect For
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-lg">
              <div className="text-2xl mb-2">🍽️</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Restaurants</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-lg">
              <div className="text-2xl mb-2">🏨</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Hotels</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Tours</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-lg">
              <div className="text-2xl mb-2">🛍️</div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Retail</h4>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Free During Beta
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-orange-500">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-bold mb-3">
                🔥 FREE BETA ACCESS
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">$0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Complete access • No setup fees</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">🎯 Customer Tools</h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <li>✓ Location targeting</li>
                  <li>✓ Interest matching</li>
                  <li>✓ Real-time alerts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">📈 Business Tools</h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <li>✓ Flash deals</li>
                  <li>✓ Events creation</li>
                  <li>✓ Analytics dashboard</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_free_beta');
                setLocation('/launching-soon');
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="w-5 h-5 mr-2" />
              JOIN FREE BETA
            </Button>
          </div>
        </div>
      </section>

      {/* FOUNDER NOTE */}
      <section className="py-6 sm:py-8 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Why We Built This
            </h3>
            <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
              "After hosting 400+ travelers, I watched local businesses waste millions on ads while travelers walked past looking for 'authentic spots.' We built the direct connection."
            </blockquote>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              — Aaron Lefkowitz, Founder
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-6 sm:py-12 bg-gradient-to-r from-orange-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Stop Losing Customers to Competitors
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'final_cta_start_now');
                setLocation('/launching-soon');
              }}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold text-xl px-12 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              JOIN NOW
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <span className="text-sm opacity-75">FREE during beta • No setup fees • Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full"></div>
                <span className="text-xl font-bold">Nearby Traveler</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/launching-soon" className="hover:text-white transition-colors">JOIN NOW</a></li>
                <li><a href="/business-success" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="/business-analytics" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/business-onboarding" className="hover:text-white transition-colors">Business Onboarding</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}