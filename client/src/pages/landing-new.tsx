import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Car } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function LandingNew() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
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

  // Static hero image for users (no more rotating business content)
  const heroImage = "/travelers_1756778615408.jpg";
  const heroImageAlt = "Travelers connecting and making friends";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">
                  Planning a Trip Soon?<br className="hidden sm:block" />
                  <span className="text-blue-600">Skip The Tourist Traps.</span>
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8">
                  Turn every trip into meaningful connections that last.
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Connect with locals and travelers before your trip begins — and create friendships that last a lifetime.
                </p>
                
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
                
                {/* Hero Image */}
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  <img
                    src={heroImage}
                    alt={heroImageAlt}
                    className="w-full h-full object-cover rounded-2xl"
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
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 sm:mb-16">
              Why Nearby Traveler
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Connect Before You Go</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Meet locals and travelers before your trip starts — no more wandering alone in new cities.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Discover Hidden Gems</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Access authentic spots locals actually love, not tourist traps from guidebooks.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Stay Connected Globally</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get notified when friends from past trips are in your next destination.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Create & Join Local Events</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Host experiences in your city or join authentic local gatherings anywhere.
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
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Share Your Vibe</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Tell us your interests and destination.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Connect Authentically</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Meet verified locals and travelers who match your energy.
                </p>
              </div>

              <div className="text-center bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 sm:mb-16">
              See Our Community in Action
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Beach Bonfire & BBQ</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  Sunset gathering with locals — authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Taco Tuesday</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">$1.50</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Hollywood Sign Hike</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Everyone's Welcome */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-orange-500">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-12 sm:mb-16">
              Everyone's Welcome
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-2">Solo Travelers</h3>
                <p className="text-sm sm:text-base">Turn exploring alone into shared adventures</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-2">Families</h3>
                <p className="text-sm sm:text-base">Connect with local families and fellow travelers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-2">Locals</h3>
                <p className="text-sm sm:text-base">Share your city and meet the world</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-2">New in Town</h3>
                <p className="text-sm sm:text-base">Find your tribe fast</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-2">Business Travelers</h3>
                <p className="text-sm sm:text-base">Make work trips more than meetings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-8 sm:mb-12 leading-relaxed font-bold">
              Be part of a new way to travel where daily events and instant connections mean you're never really traveling alone.
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