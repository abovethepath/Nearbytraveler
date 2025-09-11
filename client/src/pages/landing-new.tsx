import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Plane, Car } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import businessPhoto from "@assets/image_1756765621788.png";

export default function LandingNew() {
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
  
  // Mobile-friendly shorter versions
  const wisdomSayingsMobile = [
    "One Connection Changes Everything.",
    "Adventure Starts With Hello.",
    "Conversations Change Everything.",
    "Strangers Become Friends.",
    "Never Explore Alone.",
    "People Are the Real Destination."
  ];
  const headlines = [
    "Planning a Trip Soon? Skip The Tourist Traps.", // General travelers
    "Want to Expand Your Social Circle? Love Meeting Travelers?", // Locals who want to share their city
    "Want Your Kids to Meet the World?", // Families
    "Own a Business?" // Business owners
  ];
  
  const [currentSubtext, setCurrentSubtext] = useState(0);
  const subtexts = [
    "Turn every trip into meaningful connections that last.", // General travelers
    "Show your city to nearby travelers.", // Locals who want to share their city
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
    "/travelers together hugging_1754971726997.avif", // General travelers - skip tourist traps photo
    "/Image-Social-Travel-with-Contiki-photo-courtesy-Co_1756483970192.webp", // Locals sharing experiences - group adventure
    "/image_1756483833676.png", // Families - family at airport watching plane
    businessPhoto  // Business - chef serving customers
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

  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    // Force light mode for unauthenticated landing page
    setTheme('light');
  }, [setTheme]);

  const handleGetStarted = () => {
    trackEvent('landing_page_cta_clicked', 'hero_section', 'Start Connecting Now');
    setLocation('/join');
  };

  return (
    <div className="bg-white font-sans">
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-8 bg-white">
          {/* Clean, professional hero section with rotating content and photo */}
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 overflow-hidden relative h-[90px] sm:h-[100px] md:h-[120px] lg:h-[140px]">
                <h1 
                  key={currentHeadline}
                  className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700"
                >
                  {headlines[currentHeadline]} <br /> {subtexts[currentSubtext]}
                </h1>
              </div>
              <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 overflow-hidden relative h-[80px] sm:h-[100px] md:h-[120px]">
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
              <div className="mb-1 text-center w-full overflow-hidden relative h-[40px] sm:h-[48px] md:h-[56px]">
                <p 
                  key={currentWisdom}
                  className="absolute top-0 left-0 w-full text-xs md:text-sm font-medium text-zinc-800 italic animate-in slide-in-from-right-full fade-in duration-700 px-2"
                >
                  <span className="sm:hidden">{wisdomSayingsMobile[currentWisdom]}</span>
                  <span className="hidden sm:inline">{wisdomSayings[currentWisdom]}</span>
                </p>
              </div>
              
              {/* Static powerful quote */}
              <div className="mb-2 text-center w-full">
                <p className="text-sm md:text-lg lg:text-xl font-bold text-zinc-800 italic px-2">
                  <span className="sm:hidden">Travel doesn't change you — people do.</span>
                  <span className="hidden sm:inline">Travel doesn't change you — the people you meet do.</span>
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
              <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                Where Local Experiences Meet Worldwide Connections
              </p>
            </div>
          </div>
        </div>

        {/* Why Nearby Traveler */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Why Nearby Traveler
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-white p-6 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Before You Go</h3>
                <p className="text-gray-600">
                  Meet locals and travelers before your trip starts — no more wandering alone in new cities.
                </p>
              </div>

              <div className="text-center bg-white p-6 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Discover Hidden Gems</h3>
                <p className="text-gray-600">
                  Access authentic spots locals actually love, not tourist traps from guidebooks.
                </p>
              </div>

              <div className="text-center bg-white p-6 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Connected Globally</h3>
                <p className="text-gray-600">
                  Get notified when friends from past trips are in your next destination.
                </p>
              </div>

              <div className="text-center bg-white p-6 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create & Join Local Events</h3>
                <p className="text-gray-600">
                  Host experiences in your city or join authentic local gatherings anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* From the Founder */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-orange-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">From the Founder</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
              <p className="text-lg md:text-xl leading-relaxed mb-6 italic">
                "After hosting 400+ travelers from 50 countries, I learned that one connection can change everything. 
                Travelers spend billions on flights and hotels, yet the most valuable part — the people you meet — is left to chance. 
                I built the solution I wished existed."
              </p>
              <p className="text-lg font-bold">— Aaron Lefkowitz, Founder</p>
            </div>
          </div>
        </section>

        {/* When Travelers Meet Locals */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              When Travelers Meet Locals, Magic Happens
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Coffee className="w-6 h-6 text-orange-500 mr-2" />
                <span className="text-gray-900 font-medium">Join authentic social scenes</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Car className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-gray-900 font-medium">Discover day trip adventures</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Globe className="w-6 h-6 text-orange-500 mr-2" />
                <span className="text-gray-900 font-medium">Practice language exchange</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Heart className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-gray-900 font-medium">Find meaningful relationships</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Users className="w-6 h-6 text-orange-500 mr-2" />
                <span className="text-gray-900 font-medium">Experience real culture</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-gray-900 font-medium">Meet local families</span>
              </div>
            </div>

            <p className="text-xl font-bold text-gray-900">
              This isn't just travel. This is transformation.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Vibe</h3>
                <p className="text-gray-600">
                  Tell us your interests and destination.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Authentically</h3>
                <p className="text-gray-600">
                  Meet verified locals and travelers who match your energy.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Epic Memories</h3>
                <p className="text-gray-600">
                  Join experiences and build friendships that last.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community in Action */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              See Our Community in Action
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Beach Bonfire & BBQ</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">Free</span>
                </div>
                <p className="text-gray-700">
                  Sunset gathering with locals — authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Taco Tuesday</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">$1.50</span>
                </div>
                <p className="text-gray-700">
                  Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Hollywood Sign Hike</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">Free</span>
                </div>
                <p className="text-gray-700">
                  Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Everyone's Welcome */}
        <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-orange-500">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-16">
              Everyone's Welcome
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Solo Travelers</h3>
                <p className="text-sm">Turn exploring alone into shared adventures</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Families</h3>
                <p className="text-sm">Connect with local families and fellow travelers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Locals</h3>
                <p className="text-sm">Share your city and meet the world</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">New in Town</h3>
                <p className="text-sm">Find your tribe fast</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Business Travelers</h3>
                <p className="text-sm">Make work trips more than meetings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed font-bold">
              Join thousands of solo travelers who've discovered that with daily events and instant connections, you're never really traveling alone.
            </p>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-12 py-4 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleGetStarted}
              data-testid="button-final-cta"
            >
              Start Connecting Now
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}