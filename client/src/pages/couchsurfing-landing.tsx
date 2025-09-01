import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee, Heart, Calendar, Star, CheckCircle, X, Award, MessageCircle, Camera, Compass, Gift } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import couchsurfingHeroImage from "@assets/image_1756515286749.png";

export default function CouchsurfingLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const { setTheme } = useTheme();

  const wisdomSayings = [
    "The world becomes smaller when you open your door to it.",
    "Every stranger is a friend you haven't met yet.",
    "Home is wherever you find genuine human connection.",
    "The best souvenirs are the people you meet along the way.",
    "Traveling teaches you, but hosting transforms you."
  ];
  
  const wisdomSayingsMobile = [
    "Open your door, shrink the world.",
    "Every stranger is a future friend.", 
    "Home is where connections happen.",
    "Best souvenirs are the people.",
    "Travel teaches, hosting transforms."
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate wisdom sayings
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'couchsurfing_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
        >
          JOIN NOW
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION - CLEAN VERSION LIKE IMAGE */}
        <div className="pt-8 pb-12 sm:pt-12 sm:pb-16 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
            {/* Left text side */}
            <div className="md:col-span-3 text-center md:text-left">
              {/* Clean Badge */}
              <div className="mb-6 inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-4 sm:px-6 py-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                <span className="inline w-4 h-4 mr-2">❤️</span>
                Same Spirit, More People
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
                Love Couchsurfing?
                <br className="hidden sm:block" />
                <span className="text-blue-600">You'll Love This.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Meet travelers and locals through shared interests, activities, events and demographics — whether you can host or not.
              </p>
              
              {/* Desktop CTAs */}
              <div className="hidden sm:flex mt-6 flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    trackEvent('signup_cta_click', 'couchsurfing_landing', 'hero_join_now');
                    setLocation('/launching-soon');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  data-testid="button-hero-join-now"
                >
                  <Heart className="w-5 h-5 mr-2 inline" />
                  JOIN NOW
                </button>
                <button 
                  onClick={() => {
                    document.querySelector('#founder-story')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 w-full sm:w-auto"
                  data-testid="button-see-how-it-works"
                >
                  Read My Story
                </button>
              </div>
            </div>

            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              {/* Rotating wisdom sayings above static quote */}
              <div className="mb-1 text-center w-full overflow-hidden relative h-[40px] sm:h-[48px] md:h-[56px]">
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
                  <span className="sm:hidden">Where Cultural Exchange Lives On</span>
                  <span className="hidden sm:inline">Where the Spirit of Cultural Exchange Lives On</span>
                </p>
              </div>
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={couchsurfingHeroImage}
                  alt="Travelers connecting over coffee in a local setting"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                />
              </div>
              <p className="mt-2 text-xs md:text-sm italic text-blue-600 text-center">
                Same Values, Better Connections
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FOUNDER STORY SECTION */}
      <div id="founder-story" className="relative z-10 py-12 overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-orange-500"></div>
        
        <div className="relative">
          <section className="relative isolate mx-auto w-full max-w-4xl px-4 md:px-6 py-4">
            <div className="absolute inset-x-4 -inset-y-1 -z-10 rounded-2xl bg-gradient-to-b from-blue-50/70 to-orange-50/70 dark:from-blue-500/5 dark:to-orange-500/5" />

            <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 p-4 sm:p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
              <div className="text-center space-y-4">
                <h3 className="inline-block bg-gradient-to-r from-blue-500 to-orange-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
                  From Your Fellow Couchsurfer
                </h3>

                <blockquote className="text-balance text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 md:text-xl max-w-3xl mx-auto">
                  "I've hosted 400+ travelers from 50+ countries over 15 years. The magic is the connections, the stories, the late-night conversations about life. I created Nearby Traveler because I realized I couldn't always host, but I always wanted to meet travelers. Now you can keep that spirit alive, whether you have space or not."
                </blockquote>

                <div className="pt-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    — Aaron Lefkowitz, Founder & 15-Year Couchsurfing Host
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="h-2 w-16 rounded-full bg-gradient-to-r from-blue-500 to-orange-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Verified Couchsurfing Host Since 2010
                  </p>
                  <div className="h-2 w-16 rounded-full bg-gradient-to-r from-orange-600 to-blue-500" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* WHY SURFERS LOVE US SECTION */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Why Couchsurfers Love Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              Everything you love about the community, evolved for modern life
            </p>
          </div>
          
          {/* Horizontal Scrolling Benefits */}
          <div className="relative mb-16">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              <div className="flex-none w-80 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 snap-start">
                <Coffee className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Same Values, Zero Pressure</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Cultural exchange, genuine connections, and sharing local insights - but meet for coffee, not couch obligations. Connect when you want, how you want.
                </p>
              </div>
              
              <div className="flex-none w-80 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 snap-start">
                <MapPin className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">More Travelers Than Ever</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Meet travelers who aren't just looking for accommodation. Connect with people exploring your city, attending events, or just wanting authentic local experiences.
                </p>
              </div>
              
              <div className="flex-none w-80 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 snap-start">
                <Globe className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Perfect Matching</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Connect based on shared commonalities, not just accommodation needs. Find travelers who love the same food, culture, nightlife, or outdoor adventures you do.
                </p>
              </div>
              
              <div className="flex-none w-80 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 snap-start">
                <Heart className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Your Schedule, Your Terms</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Host when you can, meet for coffee when you can't. No guilt, no pressure, no "sorry I can't host right now" messages. Pure flexibility.
                </p>
              </div>
              
              <div className="flex-none w-80 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 rounded-xl p-6 snap-start">
                <ShieldCheck className="w-8 h-8 text-rose-600 mb-4" />
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Safe & Smart Connections</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Meet in public first, connect with verified community members. All the authentic connections, with modern safety and convenience features.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY HOSTS LOVE US SECTION */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl mb-16">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Why Couchsurfing Hosts Love Us
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Keep meeting amazing travelers without the hosting pressure
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-green-500">
                <CheckCircle className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">No More Hosting Guilt</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Can't host this week? No problem. Meet travelers for coffee, city tours, or local events instead. Zero guilt, maximum connection.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-blue-500">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Meet More Travelers</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Connect with travelers who aren't looking for accommodation but want authentic local experiences. Expand your circle exponentially.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                <Calendar className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Perfect Timing</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Share your city knowledge when you're free, host when you want to. Your schedule, your rules, same amazing connections.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                <MessageCircle className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Better Conversations</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Connect with travelers who share your actual interests. No more explaining why you love street art to someone who just needs a bed.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-rose-500">
                <Award className="w-8 h-8 text-rose-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Share Your Expertise</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Love showing off your city's best food? Amazing local hikes? Underground music scene? Connect with travelers who actually want those experiences.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
                <Gift className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Give Back Your Way</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Share local knowledge, recommend hidden gems, join for dinner or events. All the cultural exchange, your way, your schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY TRAVELERS LOVE US SECTION */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl mb-16">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Why Traveling Couchsurfers Love Us
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Same authentic connections, way more options
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-blue-500">
                <Plane className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibent text-lg mb-2 text-zinc-900 dark:text-white">No Couch Stress</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Don't need accommodation? Perfect! Connect with locals who want to share their city without the hosting logistics. Pure cultural exchange.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-green-500">
                <Coffee className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Meet Your Tribe</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Find locals who actually share your interests. Love food tours? Hiking? Nightlife? Underground music? Connect with people who get excited about the same things.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                <Compass className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Authentic Experiences</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Skip the tourist traps. Connect with locals who want to share their real city - the places they actually hang out, the food they actually eat.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                <MessageCircle className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Deep Conversations</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Those amazing late-night conversations about life, culture, and dreams? You'll still have them - over dinner, coffee, or exploring together.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-rose-500">
                <Heart className="w-8 h-8 text-rose-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Instant Local Friends</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Make real friends in every city you visit. Not just hosts - friends who become your local connection for life.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
                <Globe className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Global Community</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Stay connected with fellow travelers and locals worldwide. Build your global network of authentic connections.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* POSITIVE VS NEGATIVE COMPARISON SECTION */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Traditional Couchsurfing vs Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              Same spirit, evolved approach
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional Couchsurfing */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-2">Traditional Couchsurfing</h3>
                <p className="text-orange-600 dark:text-orange-400 text-sm">Limited by accommodation logistics</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <X className="w-5 h-5 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-orange-700 dark:text-orange-300">Can only meet travelers who need accommodation</p>
                </div>
                <div className="flex items-start">
                  <X className="w-5 h-5 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-orange-700 dark:text-orange-300">Hosting pressure when you can't accommodate</p>
                </div>
                <div className="flex items-start">
                  <X className="w-5 h-5 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-orange-700 dark:text-orange-300">Limited matching - mostly based on availability</p>
                </div>
                <div className="flex items-start">
                  <X className="w-5 h-5 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-orange-700 dark:text-orange-300">Awkward when you can't help with accommodation</p>
                </div>
              </div>
            </div>
            
            {/* Nearby Traveler */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Nearby Traveler</h3>
                <p className="text-green-600 dark:text-green-400 text-sm">Expanded connections, same values</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-300">Meet ALL travelers - those with accommodation and those exploring</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-300">Zero pressure - connect how and when you want</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-300">Smart matching by interests, activities, and demographics</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-300">Always helpful - share local knowledge however works for you</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400">
              Three simple steps to meaningful connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Share Your Passions</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tell us what you love about your city - food scenes, hiking spots, cultural events, nightlife, or hidden local gems.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Get Smart Matches</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                We connect you with travelers who genuinely share your interests and want the authentic experiences you love sharing.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Connect & Share</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Meet for coffee, explore together, host when you want, or just share insider tips. However feels right for you.
              </p>
            </div>
          </div>
        </section>

        {/* REAL STORIES SECTION - NOT TESTIMONIALS, REAL EXPERIENCES */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl mb-16">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Real Couchsurfing Stories
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
                How the spirit of Couchsurfing lives on through new connections
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <div className="mb-4">
                  <h4 className="font-semibold text-lg text-zinc-900 dark:text-white mb-2">The Coffee Connection</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 italic">
                    "I met Maria through our shared love of specialty coffee. She showed me the three best roasters in Prague - places I never would have found. We spent four hours talking about travel, life, and dreams. Same deep connection, zero couch logistics."
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                    <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">David from Berlin</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Traveler & Former CS Surfer</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <div className="mb-4">
                  <h4 className="font-semibold text-lg text-zinc-900 dark:text-white mb-2">The Local Guide</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 italic">
                    "I couldn't host Jake, but we both love street art. I showed him the best murals in my neighborhood, we grabbed tacos, talked about art and culture for hours. He said it was better than any tour he could have booked."
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Sofia from Mexico City</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Local & Former CS Host</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="text-center py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Keep the Spirit Alive?
            </h2>
            <p className="text-lg sm:text-xl mb-8 leading-relaxed opacity-90">
              Join thousands of Couchsurfers who've discovered how to maintain that amazing community spirit in their everyday lives.
            </p>
            <Button 
              onClick={() => {
                trackEvent('signup_cta_click', 'couchsurfing_landing', 'bottom_join_now');
                setLocation('/launching-soon');
              }}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 text-lg transform hover:scale-105"
            >
              JOIN NOW
            </Button>
            <p className="text-sm opacity-75 mt-4">
              Free to join • Same values • More connections
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}