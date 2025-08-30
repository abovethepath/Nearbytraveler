import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
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
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import businessHeaderPhoto from "@assets/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Rotating wisdom sayings above the photo
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = [
    "Smart Business, Real Results.",
    "Where Customers Find You First.",
    "Turn Location Into Revenue.",
    "Real-Time Deals That Convert.",
    "Every Tourist Is a Sale Waiting.",
    "Local Knowledge, Global Reach."
  ];
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "Smart Business, Real Results.",
    "Customers Find You First.",
    "Location Equals Revenue.",
    "Real-Time Deals Convert.",
    "Every Tourist Is a Sale.",
    "Local Knowledge, Global Reach."
  ];
  
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

  // Rotating wisdom sayings effect
  useEffect(() => {
    const rotateWisdom = () => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    };

    const timeout = setTimeout(rotateWisdom, 10000); // 10 seconds
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Join Now →
        </Button>
      </div>

      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-8 bg-white dark:bg-gray-900">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">💰 REVENUE MULTIPLIER</span>
                </div>
                
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[90px] sm:h-[100px] md:h-[120px] lg:h-[140px]">
                  <h1 className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">Access Travelers' Exact Wants & Needs</h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[80px] sm:h-[100px] md:h-[120px]">
                  <p className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                    Travelers share their interests and activities. When they're near your business, your deals reach them instantly.
                  </p>
                </div>
                
                {/* Value Proposition Quick Points */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-600">📍 Geo-Targeting</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Push deals when travelers are nearby</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">🎯 Interest Matching</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Connect based on exact preferences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">⚡ Real-Time Alerts</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Instant notifications to their phone</div>
                  </div>
                </div>
                
                {/* Desktop CTAs */}
                <div className="hidden sm:flex mt-6 flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      trackEvent('signup_cta_click', 'business_landing', 'claim_beta');
                      setLocation('/join');
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                    data-testid="button-claim-beta"
                  >
                    <Zap className="w-5 h-5 mr-2 inline" />
                    Claim Free Beta Access
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
                {/* Rotating wisdom sayings above static quote */}
                <div className="mb-1 text-center w-full overflow-hidden relative h-[20px] sm:h-[24px] md:h-[28px]">
                  <p 
                    key={currentWisdom}
                    className="absolute top-0 left-0 w-full text-xs md:text-sm font-medium text-zinc-800 dark:text-zinc-200 italic animate-in slide-in-from-right-full fade-in duration-700 px-2"
                  >
                    <span className="sm:hidden">{wisdomSayingsMobile[currentWisdom]}</span>
                    <span className="hidden sm:inline">{wisdomSayings[currentWisdom]}</span>
                  </p>
                </div>
                
                {/* Static powerful quote */}
                <div className="mb-2 text-center w-full">
                  <p className="text-sm md:text-lg lg:text-xl font-bold text-zinc-800 dark:text-zinc-200 italic px-2">
                    <span className="sm:hidden">Connecting businesses with travelers seeking authentic experiences.</span>
                    <span className="hidden sm:inline">Connecting businesses with travelers seeking authentic experiences.</span>
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
                onClick={() => setLocation('/join')}
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
      <section id="problem-section" className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Stop Wasting Money on Ads That Don't Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-red-500 text-2xl mb-3">📱</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Facebook Ads</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">$50+ per customer with no guarantee</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-red-500 text-2xl mb-3">🔍</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Google Ads</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Bidding wars with corporate giants</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-red-500 text-2xl mb-3">📁</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Directories</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Bury you under competitors</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-red-500 text-2xl mb-3">📲</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Social Media</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Reaches everyone except ready-to-buy travelers</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE SOLUTION: DIRECT CUSTOMER INTENT */}
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Solution: Direct Customer Intent
            </h2>
            <div className="space-y-2">
              <p className="text-lg text-gray-600 dark:text-gray-300">✅ Travelers tell us exactly what they want to eat, drink, and do</p>
              <p className="text-lg text-gray-600 dark:text-gray-300">✅ Connect before they search Google or Yelp</p>
              <p className="text-lg text-gray-600 dark:text-gray-300">✅ Reach locals seeking fresh experiences, too</p>
            </div>
          </div>
          {/* Clean examples grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want happy hours in LA"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Bars & Restaurants</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want bar crawls"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Nightlife Venues</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want to go to the Getty"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Cultural Attractions</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want to hit the gym"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Fitness Centers</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want family fun activities"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Entertainment Venues</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-2">"I want to try yoga studios"</p>
              <p className="text-sm text-orange-600 font-semibold">→ Wellness Centers</p>
            </div>
          </div>
        </div>
      </section>

      {/* YOUR BUSINESS ADVANTAGE */}
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Business Advantage
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 text-center">
              <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">First Mover Advantage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Reach travelers before competitors</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 text-center">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Zero Competition</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Direct push, no bidding wars</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 text-center">
              <Star className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">High-Value Customers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Experience seekers, not bargain hunters</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Complete Intelligence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Interests, budgets, group size, travel dates</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM/SOLUTION SECTION */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Problem Side */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">
                You're Bleeding Money on Bad Marketing
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Facebook ads cost $50+ per customer with no guarantee they'll buy</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Google ads put you in bidding wars against corporate giants</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Tourism boards and directories bury you under competitors</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Social media reaches everyone EXCEPT people ready to buy</span>
                </li>
              </ul>
            </div>

            {/* Solution Side */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                Connect Directly with Ready Buyers
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Reach travelers actively seeking your type of service</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Connect with locals looking for new experiences in their city</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Target by interests, budget, and travel style - not demographics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Build lasting relationships that generate repeat business</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS ROI SECTION */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Math That Matters to Your Business
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Stop guessing about ROI. Here's what smart business owners achieve:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-orange-500">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rich Customer Profiles</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Every traveler shares their budget, interests, group size, travel dates, and specific preferences. You know exactly who you're reaching.
              </p>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                ✓ Complete customer intelligence
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-blue-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Location-Based Targeting</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Connect with travelers already in your city or planning to visit. Plus locals seeking new experiences in their own neighborhood.
              </p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                ✓ Hyper-local customer reach
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEALS & EVENTS SHOWCASE */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Create Deals & Events That Drive Traffic
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Turn traveler interests into profitable events and time-sensitive deals
            </p>
          </div>

          {/* Scrolling examples of deals and events */}
          <div className="overflow-x-auto scrollbar-hide mb-12">
            <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🍻</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Happy Hour Flash Deal</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"50% off drinks 5-7pm for travelers"</p>
                <p className="text-sm text-blue-600">→ Bars & restaurants</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🌮</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Taco Tuesday Event</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"2-for-1 tacos + meet fellow travelers"</p>
                <p className="text-sm text-blue-600">→ Mexican restaurants</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🏌️</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Golfer Meetup Event</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"Tourist vs Local golf tournament"</p>
                <p className="text-sm text-blue-600">→ Golf courses</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🧘</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Traveler Yoga Class</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"Free first class for out-of-town visitors"</p>
                <p className="text-sm text-blue-600">→ Yoga studios</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🎭</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Comedy Night Deal</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"Tourist appreciation night - $10 tickets"</p>
                <p className="text-sm text-blue-600">→ Comedy clubs</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🎮</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Family Fun Flash Deal</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"Kids play free Sundays for travelers"</p>
                <p className="text-sm text-blue-600">→ Entertainment venues</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg min-w-[320px] shadow-lg">
                <div className="text-2xl mb-3">🏠</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Celebrity Homes Tour</h4>
                <p className="text-base md:text-lg italic text-gray-700 dark:text-gray-300 mb-2">"Book today, tour tomorrow deal"</p>
                <p className="text-sm text-blue-600">→ Tour companies</p>
              </div>
            </div>
          </div>

          {/* Live Widget Preview */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
              See How Your Deals Look to Travelers
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Flash Deal Widget Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border">
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Flash Deal Widget</h4>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-bold">FLASH DEAL</span>
                    </div>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">2h left</span>
                  </div>
                  <h5 className="font-bold text-lg mb-1">Happy Hour - 50% Off Drinks</h5>
                  <p className="text-sm opacity-90 mb-1">The Rooftop Bar & Grill</p>
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 opacity-80" />
                    <span className="text-xs opacity-80">456 Rooftop Ave, Downtown</span>
                  </div>
                  <p className="text-sm mb-3">Valid 5-7pm today. Show this deal to bartender.</p>
                  <Button className="w-full bg-white text-orange-600 hover:bg-gray-100">
                    Claim Deal
                  </Button>
                </div>
              </div>

              {/* Business Event Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border">
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Event Widget</h4>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday Traveler Night</h5>
                      <p className="text-sm text-blue-600">Hosted by Casa Muy Bien</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Tonight
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    2-for-1 tacos + meet fellow travelers! Special menu for tourists.
                  </p>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Tonight, 6:00 PM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>123 Sunset Blvd, Hollywood</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>8 travelers attending</span>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Join Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES SECTION */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect for Revenue-Focused Businesses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join successful businesses already growing with Nearby Traveler
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🍽️</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Restaurants</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fill empty tables with food lovers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🏨</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Hotels</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Boost occupancy with experience seekers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🎨</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Tours</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fill tours with engaged travelers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🛍️</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Retail</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Attract customers seeking unique finds</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION - COMPELLING */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Investment That Pays for Itself
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-orange-500">
            <div className="mb-6">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-4">
                🔥 LIMITED TIME: FREE DURING BETA
              </div>
              <div className="text-gray-500 dark:text-gray-400 line-through text-xl mb-2">$50/month + $100 setup</div>
              <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">$0</div>
              <div className="text-lg text-gray-600 dark:text-gray-300">Complete access during beta period</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">🎯 Customer Acquisition</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Push deals when travelers walk near your business</li>
                  <li>✓ Target by interests, not demographics</li>
                  <li>✓ Connect with locals seeking new experiences</li>
                  <li>✓ Real-time geolocation notifications</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">📈 Revenue Tools</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Flash deals (limited-time offers)</li>
                  <li>✓ Regular deals (ongoing promotions)</li>
                  <li>✓ Create traveler-focused events</li>
                  <li>✓ Performance analytics dashboard</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_free_beta');
                setLocation('/join');
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl px-12 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="w-6 h-6 mr-2" />
              Claim Your FREE Beta Access
            </Button>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY - BUSINESS FOCUSED */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/10 dark:to-blue-900/10"></div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl p-8 shadow-xl border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-md">
              <div className="text-center">
                <h3 className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-2xl font-bold text-transparent mb-6">
                  From the Founder
                </h3>

                <blockquote className="text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200 mb-6 max-w-3xl mx-auto">
                  "After hosting 400+ travelers, I watched amazing local businesses struggle to reach the right customers. Million-dollar marketing budgets went to waste while travelers walked past empty restaurants looking for 'authentic local spots.' The disconnect was painful to watch. I built Nearby Traveler to solve this - connecting businesses directly with customers who want exactly what they offer."
                </blockquote>

                <div className="pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    — Aaron Lefkowitz, Founder, Nearby Traveler
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Stop Losing Customers to Competitors
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Every day you wait, travelers are booking with businesses already on Nearby Traveler
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'final_cta_start_now');
                setLocation('/join');
              }}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold text-xl px-12 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Join Now
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <span className="text-sm opacity-75">FREE during beta • No setup fees • Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full"></div>
                <span className="text-xl font-bold">Nearby Traveler</span>
              </div>
              <p className="text-gray-400">
                Connecting businesses with ready-to-buy customers since 2024
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/join" className="hover:text-white transition-colors">Join Beta</a></li>
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