import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Car, RefreshCw, Home, Shield } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
// Import images as URLs
const localsHeaderImage = "/assets/locals_1756777112458.png";
const travelersHeaderImage = "/assets/travelers-hugging.avif";
const travelersHomeImage = "/assets/travelers_1756778615408.jpg";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  const [currentImage, setCurrentImage] = useState(0);
  
  // Rotating images from locals and travelers landing pages
  const heroImages = [
    localsHeaderImage,
    travelersHeaderImage,
    travelersHomeImage
  ];

  const heroImageAlts = [
    "Locals sharing experiences and welcoming travelers",
    "Travelers connecting with arms around each other",
    "Travelers exploring together"
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate images every 15 seconds
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length);
    }, 15000);

    return () => clearInterval(imageInterval);
  }, [heroImages.length]);

  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    // Force light mode for unauthenticated landing page
    setTheme('light');
  }, [setTheme]);

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
                  Never Travel Alone Again
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl text-blue-600 mb-6 sm:mb-8 font-semibold">
                  Connect with Locals & Travelers Worldwide
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Nearby Traveler solves traveler loneliness by connecting you with locals and fellow travelers based on common interests, activities, demographics and events planned. Build real friendships that last a lifetime.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-main-cta"
                  >
                    Join Now
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
                {/* Static powerful quote */}
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 italic px-2">
                    Travel doesn't change you<br />
                    The people you meet do.
                  </p>
                </div>
                
                {/* Hero Image - Rotating with smooth crossfade */}
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  {heroImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={heroImageAlts[index]}
                      className={`absolute top-0 left-0 w-full h-full object-cover rounded-2xl transition-all duration-1000 ease-in-out ${
                        index === currentImage 
                          ? 'opacity-100 translate-x-0' 
                          : index === (currentImage - 1 + heroImages.length) % heroImages.length
                          ? 'opacity-0 -translate-x-full'
                          : 'opacity-0 translate-x-full'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="mt-3 sm:mt-4 text-sm sm:text-base italic text-orange-600 text-center font-medium">
                  Where Local Experiences Meet Worldwide Connections
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Nearby Traveler */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-orange-500">
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
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
        <section id="how-it-works" className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
              See Our Community in Action
            </h2>
            <p className="text-center text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
              Every week, Nearby Traveler sponsors authentic local experiences hosted by passionate Nearby Locals. From cultural tours to food adventures, these events bring our community together and showcase the real heart of each city.
            </p>
            
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
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
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