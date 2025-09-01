import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee, Heart, Calendar } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import couchsurfingHeroImage from "@assets/image_1756515286749.png";

export default function CouchsurfingLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const { setTheme } = useTheme();

  const headlines = [
    "Love Meeting Travelers?",
    "Tired of Couch Roulette?",
    "Want Cultural Exchange?",
    "Meet Travelers Your Way?"
  ];

  const [currentWisdom, setCurrentWisdom] = useState(0);
  
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [headlines.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    }, 8000); // 8 seconds for wisdom sayings

    return () => clearInterval(interval);
  }, [wisdomSayings.length]);

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
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
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
              Meet travelers and locals through shared interests — whether you can host or not.
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
                  "I've hosted 400+ travelers from 50+ countries over 15 years. The magic was never the couch — it was the connections, the stories, the late-night conversations about life. I created Nearby Traveler because I realized I couldn't always host, but I always wanted to meet travelers. Now you can keep that spirit alive, whether you have space or not."
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
        
        {/* HERO IMAGE */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <img
              src={couchsurfingHeroImage}
              alt="Travelers connecting over coffee"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* WHY COUCHSURFERS LOVE NT - BENEFITS ONLY */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-2xl mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
            Why Couchsurfers Love Nearby Traveler
          </h2>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            From a fellow 15-year Couchsurfing veteran who gets it.
          </p>
        </div>
        
        {/* Founder Testimonial */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-lg border-l-4 border-blue-500">
          <blockquote className="text-lg sm:text-xl text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6 italic">
            "I've hosted 400+ travelers from 50 countries. The magic isn't the couch — it's the connections. 
            I created Nearby Traveler because I realized I couldn't always host, but I always wanted to meet travelers. 
            Now you can keep the spirit alive, whether you have space or not."
          </blockquote>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Aaron Lefkowitz</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Founder & 15-Year Couchsurfing Host</p>
            </div>
          </div>
        </div>

        {/* Benefits Grid - All Positive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <Coffee className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Same Values</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Cultural exchange, genuine connections, and sharing local insights</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">More Flexibility</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Meet at cafes, events, or local spots — host when you want</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <Globe className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Better Matching</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Connect based on shared interests, not just accommodation needs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <Heart className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Zero Pressure</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Meet for coffee or city tours — no hosting obligations</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <Calendar className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Your Schedule</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Connect when it works for you — total flexibility</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Safe & Smart</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Meet in public first, connect with verified community members</p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* BENEFITS FOR COUCHSURFERS SECTION */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-2xl mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Same Values, Better Experience
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              Everything you love about Couchsurfing culture, with modern improvements that make connecting easier.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Coffee className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Same Spirit</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Cultural exchange, authentic connections, and sharing local insights with fellow travelers</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <MapPin className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">More Flexibility</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Meet at cafes, events, or local spots — host when you want, not when you have to</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Users className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Better Matching</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Connect based on shared interests and travel style, not just accommodation needs</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">No Pressure</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Meet for a coffee or show around the city — no hosting obligations or awkward situations</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Calendar className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Your Schedule</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Connect when it works for you — busy with work? No problem. Free for coffee? Perfect!</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <Heart className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white">Real Connections</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Quality over quantity — meaningful conversations with travelers who share your interests</p>
            </div>
          </div>
        </section>
        
        {/* HOW IT WORKS - 3 SIMPLE STEPS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
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
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Share Your Interests</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tell us what you love — food, culture, nightlife, outdoor activities, or unique local experiences
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Get Smart Matches</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                We connect you with travelers and locals who share your passions, values, and travel philosophy
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Meet & Connect</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Host, meet for coffee, explore together, or attend events — however feels right to you
              </p>
            </div>
          </div>
        </section>

        {/* PERFECT FOR COUCHSURFERS SECTION */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Perfect For Couchsurfers Who...
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Can't Always Host</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Keep meeting travelers even during busy periods or living situation changes</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Want Better Matches</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Connect with travelers who truly share your interests and values</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Need More Flexibility</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Meet on your terms — coffee, local events, or city tours without hosting pressure</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Miss the Community</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Reconnect with the spirit of cultural exchange and meaningful travel connections</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Want Real Conversations</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Skip small talk and dive into meaningful discussions about travel, culture, and life</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Travel Themselves</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Connect with locals worldwide when you're the one traveling to new places</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT MAKES US DIFFERENT */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Built by Couchsurfers, for Couchsurfers
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              We understand the culture because we've lived it for 15+ years.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Traditional CS */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400 text-center">
                Traditional Couchsurfing
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-yellow-500 mr-3">⚠️</span>
                  <span className="text-gray-700 dark:text-gray-300">All-or-nothing hosting commitment</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-yellow-500 mr-3">⚠️</span>
                  <span className="text-gray-700 dark:text-gray-300">Limited by your living situation</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-yellow-500 mr-3">⚠️</span>
                  <span className="text-gray-700 dark:text-gray-300">Safety concerns with unknown guests</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-yellow-500 mr-3">⚠️</span>
                  <span className="text-gray-700 dark:text-gray-300">Matching based mainly on availability</span>
                </div>
              </div>
            </div>

            {/* Nearby Traveler */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 text-center">
                Nearby Traveler Way
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-blue-700 dark:text-blue-300">Flexible meeting options — your choice</span>
                </div>
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-blue-700 dark:text-blue-300">Connect regardless of housing situation</span>
                </div>
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-blue-700 dark:text-blue-300">Meet in public spaces first</span>
                </div>
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-blue-700 dark:text-blue-300">Smart matching by interests & values</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMUNITY TESTIMONIALS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              What Fellow Couchsurfers Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 italic">
                  "Finally! I can still meet amazing travelers even when I can't host. Same great conversations, zero pressure."
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Sarah</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">CS Host since 2012</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 italic">
                  "Love how it matches by interests! I've met travelers who actually want to explore the same hidden spots I love."
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                  <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Miguel</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Barcelona Local</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 italic">
                  "As a long-time surfer, this gives me that same authentic connection feeling but fits my current lifestyle."
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                  <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Alex</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Digital Nomad</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="text-center py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Reconnect?
            </h2>
            <p className="text-lg sm:text-xl mb-8 px-4 leading-relaxed opacity-90">
              Join thousands of travelers and locals who've rediscovered the spirit of Couchsurfing, 
              with better matching and more flexibility than ever before.
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
              Free to join • Same values • Better connections
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}