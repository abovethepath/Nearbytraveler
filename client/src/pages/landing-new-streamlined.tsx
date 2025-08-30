import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // Rotating headlines for different audience pain points
  const [currentHeadline, setCurrentHeadline] = useState(0);
  
  // Rotating wisdom sayings above the photo
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const wisdomSayings = [
    "The Life You Want Is One Connection Away.",
    "Your Next Adventure Starts With Hello.",
    "One Conversation Can Change Everything.",
    "Where Strangers Become Friends.",
    "Because No One Should Explore Alone.",
    "The People You Meet Are the Real Destination."
  ];
  const headlines = [
    "Planning a Trip Soon? Skip The Tourist Traps.", // General travelers
    "Want to Expand Your Social Circle? Love Meeting Travelers?", // Locals who want to share their city
    "Want Your Kids to Meet the World?", // Families
    "Own a Business?" // Business owners
  ];
  
  const [currentSubtext, setCurrentSubtext] = useState(0);
  const subtexts = [
    "Find real connections that last.", // General travelers
    "Meet up and show your city to nearby travelers.", // Locals who want to share their city
    "Connect with families everywhere.", // Families
    "Target travelers directly based on their interests and desires." // Business owners
  ];
  
  const descriptions = [
    "Connect with locals and travelers before your trip begins— and create friendships that last a lifetime.", // General
    "Meet travelers at coffee shops, events, and local experiences. Show off your city's hidden gems to curious visitors.", // Locals who want to share their city
    "Help your family build global friendships through safe, public meetups and cultural exchanges.", // Families
    "Showcase your business to travelers through events, experiences, and curated local discounts only for Nearby Travelers." // Business
  ];

  // Images that match each rotating headline
  const heroImages = [
    "/travelers together hugging_1754971726997.avif", // General travelers - current default
    "/Image-Social-Travel-with-Contiki-photo-courtesy-Co_1756483970192.webp", // Locals sharing experiences - group adventure
    "/image_1756483833676.png", // Families - family at airport watching plane
    "/image_1756483716831.png"  // Business - local cafe/business atmosphere
  ];

  const heroImageAlts = [
    "Travelers connecting", // General
    "Locals showing their city", // Locals
    "Families traveling together", // Families
    "Business welcoming travelers" // Business
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
  
  // Rotating headlines effect - "Planning a Trip Soon?" stays longer
  useEffect(() => {
    const rotate = () => {
      setCurrentHeadline((prev) => {
        const next = (prev + 1) % headlines.length;
        return next;
      });
      setCurrentSubtext((prev) => (prev + 1) % subtexts.length);
    };

    // First headline ("Planning a Trip Soon?") shows for 15 seconds, others for 10 seconds
    const getDelay = () => currentHeadline === 0 ? 15000 : 10000;
    
    const timeout = setTimeout(rotate, getDelay());
    return () => clearTimeout(timeout);
  }, [currentHeadline, headlines.length, subtexts.length]);

  // Rotating wisdom sayings effect - independent timer
  useEffect(() => {
    const rotateWisdom = () => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    };

    const timeout = setTimeout(rotateWisdom, 10000); // 10 seconds for wisdom sayings
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  // Allow user to choose theme - don't force it

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/join');
          }}
          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
          {isAirbnbStyle ? (
            // Clean, professional hero section
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8 grid gap-6 sm:gap-8 md:grid-cols-5 items-center">
              {/* Left text side - wider */}
              <div className="md:col-span-3">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[100px] sm:h-[120px] md:h-[140px] lg:h-[180px]">
                  <h1 
                    key={currentHeadline}
                    className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {headlines[currentHeadline]} <br /> {subtexts[currentSubtext]}
                  </h1>
                </div>
                <div className="mt-3 sm:mt-4 max-w-xl text-sm text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[60px] sm:h-[80px]">
                  <p 
                    key={currentSubtext}
                    className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {descriptions[currentSubtext]}
                  </p>
                </div>
              </div>

              {/* Right image side */}
              <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
                {/* Rotating wisdom sayings above static quote */}
                <div className="mb-2 text-center w-full overflow-hidden relative h-[32px] sm:h-[40px]">
                  <p 
                    key={currentWisdom}
                    className="absolute top-0 left-0 w-full text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 italic animate-in slide-in-from-right-full fade-in duration-700"
                  >
                    {wisdomSayings[currentWisdom]}
                  </p>
                </div>
                
                {/* Static powerful quote */}
                <div className="mb-4 text-center w-full">
                  <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 italic">
                    Travel doesn't change you — the people you meet do.
                  </p>
                </div>
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                  <img
                    key={currentHeadline}
                    src={heroImages[currentHeadline]}
                    alt={heroImageAlts[currentHeadline]}
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                  />
                </div>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm italic text-orange-600 text-center">
                  Where Local Experiences Meet Worldwide Connections
                </p>
              </div>
            </div>
          ) : (
            // Original centered layout (for investors)
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
                The People You Meet Are the Real Destination
              </h1>
              <p className="text-xl font-light text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Travelers shouldn't have to explore alone, and locals shouldn't miss the chance to share their city. Nearby Traveler connects you before the trip begins.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    trackEvent('signup_cta_click', 'landing_page', 'main_hero_button');
                    setLocation('/join');
                  }}
                  size="lg"
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
                >
                  Join Now
                </Button>
                <Button
                  onClick={() => {
                    trackEvent('learn_more_click', 'landing_page', 'see_how_it_works');
                    // Scroll to community section or features
                    document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  size="lg"
                  className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-medium px-8 py-3 rounded-lg transition-all duration-200"
                >
                  See How It Works
                </Button>
              </div>
            </div>
          )}
        </div>


        {/* VALUE SECTION - What It Does */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Why Nearby Traveler
          </h2>
          <p className="mt-2 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Whether you're traveling or at home, Nearby Traveler helps you create real connections that last.
          </p>

          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 text-orange-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Share Meals with Travelers & Locals
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with travelers & locals before your trip starts.
              </p>
            </div>

            <div>
              <MapPin className="mx-auto h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Explore Authentic Spots Beyond Guidebooks
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Explore authentic spots shared by locals, not tourist traps.
              </p>
            </div>

            <div>
              <Globe className="mx-auto h-8 w-8 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Build a Global Circle of Connections
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Build a global network of real connections around the world.
              </p>
            </div>

            <div>
              <RefreshCw className="mx-auto h-8 w-8 text-purple-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Reconnect When Paths Cross Again
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Know when a friend you met in one city shows up in your next destination.
              </p>
            </div>

            <div>
              <Home className="mx-auto h-8 w-8 text-pink-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Create Events and Welcome the World
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Welcome travelers, create events, and meet the world without leaving home.
              </p>
            </div>

            <div>
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Build Trust with References & Verification
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Build trust through mutual connections and community references.
              </p>
            </div>
          </div>
        </section>


        {/* FOUNDER STORY SECTION - Refined */}
        <div className="relative z-10 py-12 overflow-hidden mb-8">
          {/* Clean background for light mode */}
          <div className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-orange-500"></div>
          
          <div className="relative">
            <section className="relative isolate mx-auto w-full max-w-4xl px-4 md:px-6 py-4">
              {/* subtle background accent */}
              <div className="absolute inset-x-4 -inset-y-1 -z-10 rounded-2xl bg-gradient-to-b from-orange-50/70 to-blue-50/70 dark:from-orange-500/5 dark:to-blue-500/5" />

              <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 p-4 sm:p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
                <div className="text-center space-y-4">
                  {/* Title */}
                  <h3 className="inline-block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
                    From the Founder
                  </h3>

                  {/* Quote */}
                  <blockquote className="text-balance text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 md:text-xl max-w-3xl mx-auto">
                    "I was tired of touring cities alone while amazing people walked past me every day. Travelers spend billions on flights, hotels, and tours — yet the most valuable part of a trip, the people you meet, is left to chance. After 15 years of hosting 400+ travelers from 50 countries, I saw first-hand how one single connection can change everything. I built Nearby Traveler so no one has to explore — or live in their own city — without meaningful connections."
                  </blockquote>

                  {/* Attribution */}
                  <div className="pt-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      — Aaron Lefkowitz, Founder, Nearby Traveler
                    </p>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-2 tracking-wide">
                      "I BUILT THE SOLUTION I WISHED EXISTED."
                    </p>
                  </div>

                  {/* Tagline */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-blue-600" />
                    <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                      Here's to connections that last beyond the trip.
                    </p>
                    <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-blue-600" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* What's Possible Section */}
        <div className="py-16 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              This Is How Lives Change Forever
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 max-w-3xl mx-auto font-medium">
              When travelers and locals connect, magic happens.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto italic">
              One conversation. One shared moment. Everything changes.
            </p>
            
            {/* Dynamic Activity Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🏠</span>
                <span className="text-gray-700 dark:text-gray-300">Meet your locals</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🏢</span>
                <span className="text-gray-700 dark:text-gray-300">Meet local businesses</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">👨‍👩‍👧‍👦</span>
                <span className="text-gray-700 dark:text-gray-300">Families meet families</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🦋</span>
                <span className="text-gray-700 dark:text-gray-300">Reimagine yourself</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🌟</span>
                <span className="text-gray-700 dark:text-gray-300">Reinvent yourself</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🌍</span>
                <span className="text-gray-700 dark:text-gray-300">Bring countries to you</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🤝</span>
                <span className="text-gray-700 dark:text-gray-300">Business network</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🍻</span>
                <span className="text-gray-700 dark:text-gray-300">Socialize & party</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">💕</span>
                <span className="text-gray-700 dark:text-gray-300">Find romance</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">💬</span>
                <span className="text-gray-700 dark:text-gray-300">Language exchange</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">🚗</span>
                <span className="text-gray-700 dark:text-gray-300">Day trips & explore</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-2xl mb-2 block">✨</span>
                <span className="text-gray-700 dark:text-gray-300">...and so much more</span>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">
                This isn't just travel. This is transformation.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Join thousands who've already discovered their new selves.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Experiences - With Original Photos */}
        <div id="community-section" className="relative z-10 py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-normal px-2">
                See Our Community in Action
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 px-2">
                ✨ Real stories from real connections:
              </p>
            </div>
            
            {/* Event Cards - Original Style with Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-12">

              {/* Beach Bonfire Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-orange-400 to-red-500">
                  <img 
                    src="/event page bbq party_1753299541268.png" 
                    alt="Beach bonfire event" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sunset gathering on the beach</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 flex-grow leading-relaxed">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                </div>
              </div>
              
              {/* Taco Tuesday Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-yellow-400 to-orange-500">
                  <img 
                    src="/attached_assets/image_1754973365104.png" 
                    alt="Authentic taco stand with vintage neon sign" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Tuesday • $1.50 tacos</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$1.50</span>
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 flex-grow leading-relaxed">Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                </div>
              </div>
              
              {/* Hollywood Sign Hike Event Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-[480px]">
                <div className="aspect-w-16 aspect-h-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                  <img 
                    src="/attached_assets/image_1754974796221.png" 
                    alt="Hollywood Sign at sunrise with mountain views" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Hollywood Sign Hike</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Saturday • 9:00 AM</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Hiking</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 flex-grow leading-relaxed">Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                </div>
              </div>

            </div>

            <div className="text-center">
              <Button 
                onClick={() => setLocation('/events')}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950"
              >
                See All Events
              </Button>
            </div>
          </div>
        </div>

        {/* COUCHSURFING FOCUSED SECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Loved Couchsurfing? You'll Love This Too.
          </h2>
          <p className="mt-2 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Love meeting travelers and showing your city? Share experiences, not just your couch.
          </p>

          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
            <div>
              <Coffee className="mx-auto h-8 w-8 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Host & Connect Beyond Hosting
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Welcome travelers to your home, or meet at cafes and events - expand your hosting network.
              </p>
            </div>

            <div>
              <MapPin className="mx-auto h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Share Local Secrets
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Show travelers your favorite hidden spots and authentic local experiences.
              </p>
            </div>

            <div>
              <Globe className="mx-auto h-8 w-8 text-purple-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Meet Fellow Travelers
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with other travelers exploring the same city - share experiences and stories.
              </p>
            </div>

            <div>
              <Users className="mx-auto h-8 w-8 text-orange-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Flexible Connections
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect when you want, how you want - host, explore together, or just grab coffee.
              </p>
            </div>

            <div>
              <RefreshCw className="mx-auto h-8 w-8 text-pink-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Stay Connected
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Keep friendships alive when your new friends travel to other cities.
              </p>
            </div>

            <div>
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Safe & Verified
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Meet with community verification and references, whether hosting or meeting up.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION - Original Blue/Orange Design */}
        <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-orange-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-800 text-sm font-bold rounded-full mb-4">
                HOW IT WORKS
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                Turn Travel into <span className="text-black dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 dark:bg-clip-text dark:text-transparent">Real Connections</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Simple steps to connect and build friendships
              </p>
            </div>
            
            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                <div className="h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 rounded-full opacity-30"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {/* Step 1: Join */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-blue-800 h-80 flex flex-col">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                        <span className="text-black dark:text-white text-2xl font-black">1</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Start Your Journey
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                      Share your interests & destination.
                    </p>
                  </div>
                </div>

                {/* Step 2: Connect */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-purple-100 dark:border-purple-800 h-80 flex flex-col">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-purple-500 dark:to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                        <span className="text-black dark:text-white text-2xl font-black">2</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Make Real Connections
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                      Meet locals & travelers who share your vibe.
                    </p>
                  </div>
                </div>

                {/* Step 3: Explore */}
                <div className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-orange-100 dark:border-orange-800 h-80 flex flex-col">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-orange-500 dark:to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                        <span className="text-black dark:text-white text-2xl font-black">3</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                      Create Epic Memories
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                      Join experiences, build friendships.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Button 
                onClick={() => setLocation('/auth')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                Join Now
              </Button>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Join thousands of travelers already making connections
              </p>
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Everyone's Welcome Here
          </h2>
          <p className="mt-2 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Nearby Traveler is for anyone who wants to expand their social circle — whether you're exploring a new city or sharing your own.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Solo Travelers */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Solo Travelers
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Turn exploring alone into shared adventures.
              </p>
            </div>

            {/* Friends Traveling Together */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Friends Traveling Together
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Meet new people and follow different interests.
              </p>
            </div>

            {/* Families */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Families
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with local families or fellow traveling families.
              </p>
            </div>

            {/* Locals */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Locals
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Share your city and meet the world.
              </p>
            </div>

            {/* Business Travelers */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Business Travelers
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Make trips more than meetings.
              </p>
            </div>

            {/* Event-Goers */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Event-Goers
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with others before and after events.
              </p>
            </div>

            {/* New in Town */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                New in Town
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Find friends fast and feel at home.
              </p>
            </div>

            {/* Businesses */}
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Businesses
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Grow your community by welcoming travelers.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button 
              onClick={() => {
                trackEvent('signup_cta_click', 'landing_page', 'find_your_people');
                setLocation('/join');
              }}
              className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow hover:bg-zinc-800"
            >
              Find Your People
            </button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 sm:py-16 bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 text-black dark:text-white rounded-2xl mb-8 sm:mb-16 border-2 border-gray-300 dark:border-none">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">No matter where you are, you belong here.</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 px-4 leading-relaxed">Join travelers, locals, and businesses already building real connections worldwide.</p>
            <Button 
              onClick={() => setLocation('/join')}
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
            >
              Join Now
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}