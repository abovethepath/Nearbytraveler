import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // Rotating headlines for different audience pain points
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const headlines = [
    "Skip the Tourist Traps.", // General travelers
    "Love Meeting Travelers, But Not on a Couch?", // Couchsurfers as hosts
    "Want Your Kids to Meet the World?", // Families
    "Tired of Forced Networking?", // Professional networking
    "Run a Business?" // Business owners
  ];
  
  const [currentSubtext, setCurrentSubtext] = useState(0);
  const subtexts = [
    "Find real connections that last.", // General travelers
    "Share your city, not your sofa.", // Couchsurfers as hosts
    "Connect with local and traveling families.", // Families
    "Build authentic professional connections.", // Professional networking
    "Target travelers directly based on their interests and desires." // Business owners
  ];
  
  const descriptions = [
    "Connect with locals and travelers before your trip begins— and create friendships that last a lifetime.", // General
    "Connect with travelers at coffee shops, events, and experiences. All the cultural exchange, none of the hosting concerns.", // Couchsurfers hosts
    "Help your family build global friendships through safe, public meetups and cultural exchanges.", // Families
    "Skip the small talk. Connect with professionals through shared interests and authentic experiences.", // Networking
    "Showcase your business to travelers through events, experiences, and authentic local connections." // Business
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
  
  // Rotating headlines effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
      setCurrentSubtext((prev) => (prev + 1) % subtexts.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [headlines.length, subtexts.length]);

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
          className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 text-white dark:text-white shadow-sm transition-all duration-200 px-4 py-2 rounded-lg text-sm font-medium"
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
            <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 md:grid-cols-2 items-center">
              {/* Left text side */}
              <div>
                <div className="mb-4 inline-block rounded-full bg-orange-50 dark:bg-orange-900/30 px-4 py-1 text-sm font-medium text-orange-700 dark:text-orange-400">
                  Now Launching Beta: Be Among the First to Connect Globally
                </div>
                <div className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[200px] md:h-[220px]">
                  <h1 
                    key={currentHeadline}
                    className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {headlines[currentHeadline]} <br /> {subtexts[currentSubtext]}
                  </h1>
                </div>
                <div className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[120px]">
                  <p 
                    key={currentSubtext}
                    className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {descriptions[currentSubtext]}
                  </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      trackEvent('signup_cta_click', 'landing_page', 'main_hero_button');
                      setLocation('/join');
                    }}
                    className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow hover:bg-zinc-800 w-full sm:w-auto"
                    data-testid="button-join-journey"
                  >
                    Join Now
                  </button>
                  <button 
                    onClick={() => {
                      trackEvent('learn_more_click', 'landing_page', 'see_how_it_works');
                      document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-xl border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800 w-full sm:w-auto"
                    data-testid="button-see-how-it-works"
                  >
                    See How It Works
                  </button>
                </div>
              </div>

              {/* Right image side */}
              <div className="flex flex-col items-center">
                <img
                  src="/travelers together hugging_1754971726997.avif"
                  alt="Travelers connecting"
                  className="rounded-2xl shadow-lg object-cover"
                />
                <p className="mt-4 text-lg italic text-orange-600 text-center">
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
                  className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-500 text-white dark:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200"
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
                Never Eat Alone
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with travelers & locals before your trip starts.
              </p>
            </div>

            <div>
              <MapPin className="mx-auto h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Discover Local Secrets
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Explore authentic spots shared by locals, not tourist traps.
              </p>
            </div>

            <div>
              <Globe className="mx-auto h-8 w-8 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Friends in Every City
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Build a global network of real connections around the world.
              </p>
            </div>

            <div>
              <RefreshCw className="mx-auto h-8 w-8 text-purple-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Stay Connected Across Trips
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Know when a friend you met in one city shows up in your next destination.
              </p>
            </div>

            <div>
              <Home className="mx-auto h-8 w-8 text-pink-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Share Your City
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Welcome travelers, create events, and meet the world without leaving home.
              </p>
            </div>

            <div>
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Vouched & Referenced
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
                    "For 15 years I opened my home to over 400 travelers from over 50 countries. I learned that what makes traveling unforgettable isn't the sites — it's the people you share them with. Too often, we leave those connections up to luck. I created Nearby Traveler so no one has to explore — or live in their own city — feeling disconnected."
                  </blockquote>

                  {/* Attribution */}
                  <div className="pt-2">
                    <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                      — Aaron Lefkowitz
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Founder, Nearby Traveler
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

        {/* Featured Experiences - With Original Photos */}
        <div id="community-section" className="relative z-10 py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-normal px-2">
                See Our Community in Action
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-2">
                ✨ See how our community turns strangers into lifelong friends:
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Beach Bonfire & BBQ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sunset gathering on the beach</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Beach</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-8 flex-grow leading-relaxed">Join locals for an authentic beach bonfire with BBQ, music, and sunset views. Experience the real LA beach culture with friendly people.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    Join Now
                  </Button>
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Taco Tuesday</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Tuesday • $1.50 tacos</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">$1.50</span>
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">Food</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-8 flex-grow leading-relaxed">Join locals every Tuesday for authentic street tacos at unbeatable prices. Meet fellow taco lovers and discover the best Mexican spots in the city.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    Join Now
                  </Button>
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Hollywood Sign Hike</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Every Saturday • 9:00 AM</p>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">Free</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">Hiking</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-8 flex-grow leading-relaxed">Weekly hike to the iconic Hollywood Sign with locals and travelers. Amazing city views, great photos, and authentic LA hiking culture.</p>
                  <Button 
                    onClick={() => setLocation('/auth')}
                    className="w-full bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 dark:hover:from-blue-600 dark:hover:to-orange-600 text-white font-bold mt-auto"
                  >
                    Join Now
                  </Button>
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
                Simple steps to connect and create epic memories
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
                className="bg-black hover:bg-gray-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-orange-600 dark:hover:from-blue-700 dark:hover:to-orange-700 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Whatever brings you here, you belong here.</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 px-4 leading-relaxed">Join locals, travelers, and businesses already making real connections worldwide.</p>
            <Button 
              onClick={() => setLocation('/join')}
              className="bg-white dark:bg-white text-black dark:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-200 px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105 border-2 border-black dark:border-none font-bold"
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