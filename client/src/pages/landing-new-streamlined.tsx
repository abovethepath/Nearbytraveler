import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Car, RefreshCw, Home, Shield } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // Rotating headlines for different user types (no business content)
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

  // User-focused headlines only (removed business content)
  const headlines = [
    "Planning a Trip Soon? Skip The Tourist Traps.", // General travelers
    "Want to Expand Your Social Circle? Love Meeting Travelers?", // Locals who want to share their city
    "Want Your Kids to Meet the World?" // Families
  ];
  
  const [currentSubtext, setCurrentSubtext] = useState(0);
  const subtexts = [
    "Connect with locals and travelers before your trip begins— and create friendships that last a lifetime.", // General travelers
    "Show your city to nearby travelers.", // Locals who want to share their city
    "Connect with families everywhere." // Families
  ];
  
  const descriptions = [
    "Turn every trip into meaningful connections that last.", // General
    "Meet travelers at coffee shops, events, and local experiences. Show off your city's hidden gems to curious visitors.", // Locals who want to share their city
    "Help your family build global friendships through safe, public meetups and cultural exchanges." // Families
  ];

  // User-focused rotating images (removed business photo)
  const heroImages = [
    "/travelers together hugging_1754971726997.avif", // General travelers - people with arms around each other
    "/Image-Social-Travel-with-Contiki-photo-courtesy-Co_1756483970192.webp", // Locals sharing experiences - group adventure
    "/image_1756483833676.png" // Families - family at airport watching plane
  ];

  const heroImageAlts = [
    "Travelers with arms around each other - true connections", // General
    "Locals sharing city experiences with travelers", // Locals
    "Families traveling together and exploring the world" // Families
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

    // First headline ("Planning a Trip Soon?") shows for 25 seconds, others for 20 seconds
    const getDelay = () => currentHeadline === 0 ? 25000 : 20000;
    
    const timeout = setTimeout(rotate, getDelay());
    return () => clearTimeout(timeout);
  }, [currentHeadline, headlines.length, subtexts.length]);

  // Rotating wisdom sayings effect - independent timer
  useEffect(() => {
    const rotateWisdom = () => {
      setCurrentWisdom((prev) => (prev + 1) % wisdomSayings.length);
    };

    const timeout = setTimeout(rotateWisdom, 8000); // 8 seconds for wisdom sayings
    return () => clearTimeout(timeout);
  }, [currentWisdom, wisdomSayings.length]);

  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    // Force light mode for unauthenticated landing page
    setTheme('light');
  }, [setTheme]);

  const handleGetStarted = () => {
    trackEvent('landing_page_cta_clicked', 'hero_section', 'Start Connecting Now');
    setLocation('/launching-soon');
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
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-join-now"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">
        
        {/* HERO SECTION - Fully Mobile Responsive */}
        <div className="pt-4 pb-8 sm:pt-8 sm:pb-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:gap-8 lg:gap-12 lg:grid-cols-2 items-center">
              
              {/* Left text side */}
              <div className="order-2 lg:order-1 text-center lg:text-left">
                <div className="overflow-hidden relative min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
                  <h1 
                    key={currentHeadline}
                    className="absolute top-0 left-0 w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6 animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {headlines[currentHeadline]}
                  </h1>
                </div>
                <div className="overflow-hidden relative min-h-[60px] sm:min-h-[70px] md:min-h-[80px]">
                  <h2 
                    key={currentSubtext}
                    className="absolute top-0 left-0 w-full text-lg sm:text-xl md:text-2xl text-blue-600 mb-6 sm:mb-8 font-semibold animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {subtexts[currentSubtext]}
                  </h2>
                </div>
                <div className="overflow-hidden relative min-h-[80px] sm:min-h-[100px] md:min-h-[120px] mt-4">
                  <p 
                    key={currentSubtext}
                    className="absolute top-0 left-0 w-full text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-left-full fade-in duration-700"
                  >
                    {descriptions[currentSubtext]}
                  </p>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-main-cta"
                  >
                    Start Connecting Now
                  </Button>
                  <Button
                    onClick={() => {
                      trackEvent('learn_more_click', 'landing_page', 'see_how_it_works');
                      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
                    data-testid="button-learn-more"
                  >
                    See How It Works
                  </Button>
                </div>
              </div>

              {/* Right image side */}
              <div className="order-1 lg:order-2 flex flex-col items-center">
                {/* Rotating wisdom sayings above photo */}
                <div className="mb-3 sm:mb-4 text-center w-full overflow-hidden relative h-[50px] sm:h-[60px]">
                  <p 
                    key={currentWisdom}
                    className="absolute top-0 left-0 w-full text-sm sm:text-base md:text-lg font-medium text-gray-800 italic animate-in slide-in-from-right-full fade-in duration-700 px-2"
                  >
                    {isMobile ? wisdomSayingsMobile[currentWisdom] : wisdomSayings[currentWisdom]}
                  </p>
                </div>
                
                {/* Static powerful quote */}
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 italic px-2">
                    {isMobile ? "Travel doesn't change you — people you meet do." : "Travel doesn't change you — the people you meet do."}
                  </p>
                </div>
                
                {/* Hero Image - Rotating */}
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  <img
                    key={currentHeadline}
                    src={heroImages[currentHeadline]}
                    alt={heroImageAlts[currentHeadline]}
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl animate-in slide-in-from-right-full fade-in duration-700"
                  />
                </div>
                
                <p className="mt-3 sm:mt-4 text-sm sm:text-base italic text-orange-600 text-center font-medium">
                  Where Local Experiences Meet Worldwide Connections
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Nearby Traveler */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 sm:mb-12">
              Why Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 leading-relaxed">
              Whether you're traveling or at home, Nearby Traveler helps you create real connections that last.
            </p>
            
            <div className="space-y-8 sm:space-y-10">
              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Share Meals with Travelers & Locals</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Connect with travelers & locals before your trip starts.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Explore Authentic Spots Beyond Guidebooks</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Explore authentic spots shared by locals, not tourist traps.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Build a Global Circle of Connections</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Build a global network of real connections around the world.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Reconnect When Paths Cross Again</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Know when a friend you met in one city shows up in your next destination.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Create Events and Welcome the World</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Welcome travelers, create events, and meet the world without leaving home.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Build Trust with References & Verification</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Build trust through mutual connections and community references.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* From the Founder */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-orange-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 sm:mb-12">From the Founder</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 text-white">
              <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-6 sm:mb-8 italic">
                "After hosting 400+ travelers from 50 countries, I learned that one connection can change everything. 
                Travelers spend billions on flights and hotels, yet the most valuable part — the people you meet — is left to chance. 
                I built the solution I wished existed."
              </p>
              <p className="text-lg sm:text-xl font-bold">— Aaron Lefkowitz, Founder</p>
            </div>
          </div>
        </section>

        {/* When Travelers Meet Locals */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 sm:mb-12">
              When Travelers Meet Locals, Magic Happens
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Join authentic social scenes</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Discover day trip adventures</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Practice language exchange</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Find meaningful relationships</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Experience local culture</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">Meet local families</span>
              </div>
            </div>

            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              This isn't just travel. This is transformation.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 sm:mb-16">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
              <div className="text-center bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Share Your Vibe</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Tell us your interests, activities and events planned at your destination.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Connect Authentically</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Meet Nearby Locals and Nearby Travelers who match your interests.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Create Epic Memories</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Join experiences and build friendships that last.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community in Action */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
              See Our Community in Action
            </h2>
            <p className="text-center text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
              Every week, Nearby Traveler sponsors authentic local experiences hosted by passionate Nearby Locals. From cultural tours to food adventures, these events bring our community together and showcase the real heart of each city.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Beach Bonfire & BBQ */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 relative">
                  <img 
                    src="/beach-bonfire-bbq.jpg" 
                    alt="Beach bonfire and BBQ event with people gathering at sunset" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Beach Bonfire & BBQ</h3>
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Sunset gathering with locals — authentic LA beach culture, music, and new friends.
                  </p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                    Join Now
                  </button>
                </div>
              </div>

              {/* Taco Tuesday */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-yellow-400 to-orange-500 relative">
                  <img 
                    src="/taco-tuesday.jpg" 
                    alt="Street tacos and Mexican food adventure" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Taco Tuesday</h3>
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">$1.50</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
                  </p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                    Join Now
                  </button>
                </div>
              </div>

              {/* Hollywood Sign Hike */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 relative">
                  <img 
                    src="/hollywood-sign-hike.jpg" 
                    alt="Hollywood Sign hike with hikers and city views" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Hollywood Sign Hike</h3>
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Free</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
                  </p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                    Join Now
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Everyone's Welcome */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-12 sm:mb-16">
              Everyone's Welcome
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Solo Travelers</h3>
                <p className="text-sm sm:text-base text-gray-600">Turn exploring alone into shared adventures</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Locals</h3>
                <p className="text-sm sm:text-base text-gray-600">Share your city and meet the world</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">New in Town</h3>
                <p className="text-sm sm:text-base text-gray-600">Find your tribe fast</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Families</h3>
                <p className="text-sm sm:text-base text-gray-600">Connect with local families and fellow travelers</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Business Travelers</h3>
                <p className="text-sm sm:text-base text-gray-600">Make work trips more than meetings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-8 sm:mb-12 leading-relaxed font-bold">
              Be part of a new way to travel where weekly events and instant connections mean you're never really traveling alone.
            </p>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-full text-lg sm:text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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