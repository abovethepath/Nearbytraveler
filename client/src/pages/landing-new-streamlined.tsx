import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, Coffee, Heart, Car, RefreshCw, Home, Shield, Moon, Sun } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
// Import images as URLs - using JPG/PNG for iPhone compatibility
const localsHeaderImage = "/landing-images/locals_1756777112458.png";
const travelersHeaderImage = "/landing-images/travelers_1756778615408.jpg";
const travelersHomeImage = "/landing-images/locals_1756777112458.png";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentTagline, setCurrentTagline] = useState(0);
  
  // Rotating hero videos with custom durations (in milliseconds)
  const heroVideos = [
    { src: "/hero-video-1.mp4", duration: 15000 }, // 15 seconds
    { src: "/hero-video-2.mp4", duration: 15000 }, // 15 seconds
    { src: "/hero-video-4.mp4", duration: 15000 }, // 15 seconds
    { src: "/hero-video-5.mp4", duration: 10000 }, // 10 seconds
    { src: "/hero-video-6.mp4", duration: 8000 }   // 8 seconds
  ];

  // Rotating taglines
  const taglines = [
    { line1: "Travel doesn't change you.", line2: "The people you meet do." },
    { line1: "When old friends are nearby,", line2: "we notify you." }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate videos with custom durations for each video
  useEffect(() => {
    const currentDuration = heroVideos[currentVideo].duration;
    console.log(`🎬 Video ${currentVideo + 1} playing for ${currentDuration/1000} seconds`);
    
    const videoTimeout = setTimeout(() => {
      setCurrentVideo(prev => {
        const nextVideo = (prev + 1) % heroVideos.length;
        console.log(`🔄 Switching from video ${prev + 1} to video ${nextVideo + 1}`);
        return nextVideo;
      });
    }, currentDuration);

    return () => clearTimeout(videoTimeout);
  }, [currentVideo]);

  // Rotate taglines every 10 seconds
  useEffect(() => {
    const taglineInterval = setInterval(() => {
      setCurrentTagline(prev => (prev + 1) % taglines.length);
    }, 10000);

    return () => clearInterval(taglineInterval);
  }, [taglines.length]);

  // Theme toggle available - removed forced light mode

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
    trackEvent('landing_page_cta_clicked', 'hero_section', 'Get Started');
    setLocation('/signup/account');
  };

  return (
    <div className="bg-white dark:bg-gray-900 font-sans transition-colors duration-200">
      
      
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_join_now');
            setLocation('/signup/account');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-join-now"
        >
          Sign Up Free
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">
        
        {/* Social Proof Banner */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 py-4 sm:py-5 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-xl sm:text-2xl text-white font-bold">
              🔥 Sign Up Free - Start Connecting Today
            </p>
          </div>
        </div>

        {/* HERO SECTION - Full Video Background with Rotation */}
        <div className="relative min-h-[600px] sm:min-h-[700px] overflow-hidden">
          {/* Rotating Video Backgrounds with Crossfade */}
          {heroVideos.map((video, index) => (
            <video
              key={index}
              src={video.src}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentVideo ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop
              muted
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          ))}
          
          {/* Dark overlay for text readability */}
          <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
          
          {/* Content overlay */}
          <div className="relative z-10 pt-8 pb-12 sm:pt-12 sm:pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center justify-center text-center min-h-[500px] sm:min-h-[600px]">
                
                {/* Rotating Quote */}
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-400 italic mb-8 sm:mb-10 leading-snug transition-opacity duration-500 drop-shadow-lg">
                  {taglines[currentTagline].line1}<br />
                  {taglines[currentTagline].line2}
                </p>
                
                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-6 sm:mb-8 drop-shadow-2xl">
                  Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Locals & Travelers</span> Worldwide
                </h1>
                
                {/* Subheadline */}
                <p className="text-lg sm:text-xl md:text-2xl text-white mb-10 sm:mb-12 leading-relaxed max-w-4xl drop-shadow-lg">
                  Nearby Traveler connects travelers and locals through shared interests, activities, and events. We also let you know when you cross paths with friends in another city — making it easy to meet people, reconnect, and build friendships that last a lifetime.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-10 py-5 rounded-xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
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
                    className="border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm px-10 py-5 rounded-xl text-xl font-medium transition-all duration-200 hover:scale-105"
                    data-testid="button-learn-more"
                  >
                    See How It Works
                  </Button>
                </div>
                
                {/* Tagline */}
                <p className="mt-8 sm:mt-10 text-base sm:text-lg md:text-xl italic text-orange-400 font-semibold drop-shadow-lg">
                  Where Local Experiences Meet Worldwide Connections
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Nearby Traveler */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
              Why Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 sm:mb-16 leading-relaxed">
              Whether you're traveling or at home, Nearby Traveler helps you create real connections that last.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-8 h-8 text-blue-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Reconnect When Paths Cross Again</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Know when a friend you met in one city shows up in your next destination—the only app that notifies you when travel friends are nearby.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coffee className="w-8 h-8 text-orange-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Share Meals with Travelers & Locals</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Connect with people before your trip starts and turn dinners into friendships.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-blue-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Explore Authentic Spots Beyond Guidebooks</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Discover hidden gems shared by locals, not tourist traps.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="w-8 h-8 text-orange-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Build Your Local Community</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Organize events, welcome travelers, and build community without leaving home.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Vouched Connections & Verified Profiles</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Every member can be vouched for by others they've met, with optional verification for added trust.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-orange-600 dark:text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Build a Global Network of Friends</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Create a worldwide circle of connections who share your interests and values.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reconnect Across Cities - NEW SECTION */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12 sm:mb-16">
              Reconnect Across Cities
            </h2>
            
            {/* Example Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600 dark:text-white" />
                  </div>
                  <p className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold leading-relaxed">
                    Remember that person you met in Barcelona? They just landed in your city.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border-l-4 border-orange-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-orange-600 dark:text-white" />
                  </div>
                  <p className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold leading-relaxed">
                    The traveler you hosted last year? They're in Tokyo—where you're heading next week.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Feature Highlight */}
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-xl mb-12 sm:mb-16">
              <p className="text-xl sm:text-2xl lg:text-3xl text-white text-center font-bold leading-relaxed">
                Nearby Traveler notifies you when friends from past travels are nearby. Turn one-time encounters into lifelong connections that span the globe.
              </p>
            </div>
            
            {/* Bottom Statement */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-lg">
              <p className="text-xl sm:text-2xl lg:text-3xl text-center text-gray-900 dark:text-white font-bold leading-relaxed mb-6">
                One coffee in Paris becomes dinner in New York. A hiking buddy in Bali reconnects with you in Berlin.
              </p>
              <p className="text-lg sm:text-xl text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 font-bold">
                Your travel friendships don't end when the trip does. Keep those connections alive, no matter where life takes you next.
              </p>
            </div>
          </div>
        </section>

        {/* When Travelers Meet Locals */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
              When Travelers Meet Locals, Magic Happens
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Expand your social life</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Discover day trip adventures</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Practice language exchange</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Find meaningful relationships</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Experience local culture</span>
              </div>
              <div className="flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Meet local families</span>
              </div>
            </div>

            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              This isn't just travel. This is connection.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12 sm:mb-16">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Set Up Your Profile & Travel Plans</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Sign up as a local or traveler. Add your interests and activities. Planning a trip? Set your destination and dates—our AI matches you with locals and travelers there.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600 text-orange-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Discover, Message & Meet Up</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Browse AI-matched people in your city or destination. Message them directly. Create quick meetups. Join community events. RSVP to local gatherings.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Stay Connected Worldwide</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Get notified when past connections travel to your city—or when you're heading to theirs. Your friendships reconnect automatically, no matter where you go.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community in Action */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
              See Our Community in Action
            </h2>
            <p className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
              Every week, Nearby Traveler sponsors authentic local experiences hosted by passionate community members. From cultural tours to food adventures, these events bring our community together and showcase the real heart of each city.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-black">Beach Bonfire & BBQ</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-black">
                  Sunset gathering with locals — authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-black">Taco Tuesday</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">$1.50</span>
                </div>
                <p className="text-sm sm:text-base text-black">
                  Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-black">Hollywood Sign Hike</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-black">
                  Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
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
                "After hosting 400+ travelers from 50 countries, I learned that one connection can change everything… I built the solution I wished existed."
              </p>
              <p className="text-lg sm:text-xl font-bold mb-6">— Aaron Lefkowitz, Founder</p>
              <p className="text-base sm:text-lg leading-relaxed">
                🌍 Nearby Traveler grew out of real travel communities—from Couchsurfing bonfires to LA meetups. Our mission is to keep that spirit alive for a new generation.
              </p>
            </div>
          </div>
        </section>

        {/* Credibility Bar */}
        <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed">
              ✈️ 400+ travelers hosted by our founder | 🌆 5 community ambassadors in Los Angeles | 🌎 Inspired by global travel communities like Couchsurfing & Meetup
            </p>
          </div>
        </section>

        {/* Everyone's Welcome */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-12 sm:mb-16">
              Everyone's Welcome
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">Solo Travelers</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Turn exploring alone into shared adventures</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">Locals</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Share your city and meet the world</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">New in Town</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Find your tribe fast</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">Families</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Connect with local families and fellow travelers</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">Business Travelers</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Make work trips more than meetings</p>
              </div>
            </div>
            
            <p className="mt-12 sm:mt-16 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Be part of a new way to travel where weekly events and instant connections mean you're never really traveling alone.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 leading-relaxed font-bold">
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

        {/* Launch Cities & Features */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-6">
              🌍 Launching soon in <span className="font-bold">Los Angeles, New York, London, and Lisbon</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔹</span>
                Verified profiles
              </span>
              <span className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔹</span>
                Community references
              </span>
              <span className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔹</span>
                Vouched connections
              </span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}