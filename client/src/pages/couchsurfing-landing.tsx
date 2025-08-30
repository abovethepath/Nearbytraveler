import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee, Heart } from "lucide-react";
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
            setLocation('/join');
          }}
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
        >
          Join Now
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-8 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3">
              <div className="mb-3 sm:mb-4 inline-block rounded-full bg-orange-50 dark:bg-orange-900/30 px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-400 animate-in slide-in-from-left-full fade-in duration-700">
                <span className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">❤️</span>
                From a Fellow Couchsurfer
              </div>
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white overflow-hidden relative h-[90px] sm:h-[100px] md:h-[120px] lg:h-[140px]">
                <h1 className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                  A Letter to the Couchsurfing Community
                </h1>
              </div>
              <div className="mt-1 sm:mt-2 max-w-xl text-base md:text-lg lg:text-xl text-zinc-600 dark:text-zinc-300 overflow-hidden relative h-[360px] sm:h-[380px] md:h-[400px]">
                <div className="absolute top-0 left-0 w-full animate-in slide-in-from-left-full fade-in duration-700">
                  <blockquote className="text-base md:text-lg lg:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-4 border-blue-500 pl-4 sm:pl-6 mb-4 sm:mb-6">
                    "As a 15-year Couchsurfing host and traveler, I've had some of the best moments of my life meeting people through the community. But over time, I realized I couldn't always host, I couldn't always find a couch — yet I always wanted to meet travelers. That's why I created Nearby Traveler."
                  </blockquote>
                  <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 mb-4 sm:mb-6">
                    — Aaron Lefkowitz, Founder & Fellow Couchsurfer
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300 mb-4">
                    <strong className="text-orange-600 dark:text-orange-400 text-base md:text-lg lg:text-xl">Connect with travelers based on shared interests, not just accommodation needs.</strong>
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-zinc-700 dark:text-zinc-200 font-medium">
                    Host when you want. Travel when you can. Meet travelers always.
                  </p>
                </div>
              </div>
            </div>

            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              {/* Rotating wisdom sayings above static quote */}
              <div className="mb-1 text-center w-full overflow-hidden relative h-[40px] sm:h-[48px] md:h-[56px]">
                <p 
                  key={currentWisdom}
                  className="absolute top-0 left-0 w-full text-xs md:text-sm font-medium text-zinc-800 dark:text-zinc-200 italic animate-in slide-in-from-right-full fade-in duration-700 px-2 leading-tight"
                >
                  <span className="sm:hidden">{wisdomSayingsMobile[currentWisdom]}</span>
                  <span className="hidden sm:inline">{wisdomSayings[currentWisdom]}</span>
                </p>
              </div>
              
              {/* Static powerful quote */}
              <div className="mb-2 text-center w-full">
                <p className="text-sm md:text-lg lg:text-xl font-bold text-zinc-800 dark:text-zinc-200 italic px-2">
                  <span className="sm:hidden">Travel doesn't change you — people do.</span>
                  <span className="hidden sm:inline">Travel doesn't change you — the people you meet do.</span>
                </p>
              </div>
              
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={couchsurfingHeroImage}
                  alt="Couch surfing - literally surfing on a couch in the ocean"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg animate-in slide-in-from-right-full fade-in duration-700"
                />
              </div>
              
              <p className="mt-2 text-sm md:text-lg lg:text-xl italic text-orange-600 text-center font-semibold">
                Where Local Experiences Meet Worldwide Connections
              </p>
            </div>
          </div>
        </div>

        {/* VALUE SECTION - Couchsurfing Focused */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Beyond Just Needing a Couch
          </h2>
          <p className="mt-2 text-center text-base md:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 px-4">
            Connect based on shared interests, activities, demographics planned events, and genuine compatibility - not just accommodation needs.
          </p>

          <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
            <ul className="space-y-4 sm:space-y-6 text-base md:text-lg lg:text-xl text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>Match with people who share your hobbies and travel style</span>
              </li>
              <li className="flex items-start">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>Connect at cafés, events, and local spots — no couch required</span>
              </li>
              <li className="flex items-start">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>Share local secrets and experience cultural exchange</span>
              </li>
              <li className="flex items-start">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>Connect when you want, how you want — no obligations</span>
              </li>
              <li className="flex items-start">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>When you're hosting but too busy to hang with your guests, Nearby Traveler connects them to other travelers around town</span>
              </li>
              <li className="flex items-start">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0" />
                <span>Feel safer with references and a vouching system</span>
              </li>
            </ul>
          </div>
        </section>

        {/* THE HOSTING JOURNEY - Honest Perspective */}
        <section id="hosting-journey" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 dark:from-orange-900/20 dark:via-blue-900/20 dark:to-orange-800/20 rounded-2xl mb-8 sm:mb-6 sm:mb-8">
          <div className="text-center mb-8 sm:mb-6 sm:mb-8">
            <span className="inline-block px-4 sm:px-6 py-2 bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-800 dark:to-blue-800 text-orange-800 dark:text-orange-200 text-xs sm:text-sm font-bold rounded-full mb-4">
              FOR EXPERIENCED HOSTS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 sm:mb-6 px-4">
              We Know You've <span className="text-black dark:text-black">Loved Hosting</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
              If you've hosted before, you know the magic: meeting fascinating people, sharing your city, learning about new cultures. But hosting can also be exhausting, unpredictable, and sometimes just not possible with work or family life. That doesn't mean you're less generous — it just means life changes. With Nearby Traveler, you can keep the spirit of cultural exchange alive in a way that works for you today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-6 sm:mb-8">
            {/* What You Loved */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 sm:mb-6 flex items-center">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                What You've Loved About Hosting
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Meeting fascinating people from every corner of the world</span>
                </li>
                <li className="flex items-start">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Creating deep connections and lifelong friendships</span>
                </li>
                <li className="flex items-start">
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Sharing your city's hidden gems and local culture</span>
                </li>
                <li className="flex items-start">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Learning about other cultures without traveling</span>
                </li>
                <li className="flex items-start">
                  <Handshake className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>The satisfaction of helping fellow travelers</span>
                </li>
              </ul>
            </div>

            {/* The Challenges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 sm:mb-6 flex items-center">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                But Hosting Can Be Challenging
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Exhausting when you need your personal space</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Stressful with work, family, or relationship commitments</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Unpredictable with last-minute cancellations or no-shows</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Limiting when your living situation changes</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Overwhelming when you just want a quiet weekend</span>
                </li>
              </ul>
            </div>
          </div>

          {/* The Evolution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-black dark:text-black">
              Sometimes We Just Grow Out of It
            </h3>
            <p className="text-lg sm:text-xl mb-6 max-w-4xl mx-auto leading-relaxed text-gray-700 dark:text-gray-300">
              You're not less generous. You're not less welcoming. Life evolves, priorities shift, and that's completely normal. 
              <strong className="block mt-2 text-black dark:text-black">You can still share your love for your city—just differently.</strong>
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 max-w-3xl mx-auto border border-gray-200 dark:border-gray-600">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                "For 15 years I opened my home to 400+ travelers from 50 countries. I learned what makes travel unforgettable isn't the sites — it's the people you share them with. Too often, those connections are left to luck. I created Nearby Traveler so no one has to explore — or live in their own city — without meaningful connections."
              </p>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">— Aaron Lefkowitz, Founder</p>
            </div>
          </div>
        </section>


        {/* HOSTING DOESN'T END - ENHANCEMENT SECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 dark:from-orange-900/20 dark:via-blue-900/20 dark:to-orange-800/20 rounded-2xl mb-6 sm:mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
              Keep Hosting, Expand Your Impact
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Nearby Traveler doesn't replace couchsurfing — it enhances it. You can still host when you want, but now you can also connect with travelers when you can't.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Still Host */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Keep Hosting When You Can
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Have space this weekend? Still host travelers on your couch. Nearby Traveler connects you with quality travelers who share your interests, making hosting even better.
              </p>
            </div>

            {/* Meet When You Can't Host */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Connect When You Can't Host
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                No space but still want to meet travelers? Join them for coffee, show them your favorite spots, or attend events together. Share your city without opening your home.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl p-8 text-white text-center mt-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              The Best of Both Worlds
            </h3>
            <p className="text-lg sm:text-xl opacity-90 max-w-4xl mx-auto leading-relaxed">
              Host when your schedule allows. Meet travelers when hosting isn't possible. 
              <strong className="block mt-2">Your generosity and love for cultural exchange never has to stop.</strong>
            </p>
          </div>
        </section>

        {/* THE SURFING EXPERIENCE - Honest Perspective */}
        <section id="surfing-journey" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100 dark:from-blue-900/20 dark:via-orange-900/20 dark:to-blue-800/20 rounded-2xl mb-8 sm:mb-6 sm:mb-8">
          <div className="text-center mb-8 sm:mb-6 sm:mb-8">
            <span className="inline-block px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-800 dark:to-orange-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold rounded-full mb-4">
              FOR EXPERIENCED SURFERS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 sm:mb-6 px-4">
              We Know You've <span className="text-black dark:text-black">Loved Surfing</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
              If you've surfed before, you know the magic: authentic local insights, genuine cultural exchange, and the thrill of discovering a place through someone else's eyes. But finding the right hosts and navigating unpredictable situations can be challenging. With Nearby Traveler, you can keep that authentic travel spirit alive with more options and fewer limitations. Plus you can still surf, we love couchsurfing, but now you can expand who you meet outside the limitations of just couchsurfing. Open your world to ALL TRAVELERS.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-6 sm:mb-8">
            {/* What You Loved About Surfing */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border-l-4 border-orange-500">
              <h3 className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400 mb-4 sm:mb-6 flex items-center">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                What You've Loved About Surfing
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Getting authentic local insights from passionate hosts</span>
                </li>
                <li className="flex items-start">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Making deep connections and lifelong friendships</span>
                </li>
                <li className="flex items-start">
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Discovering hidden gems tourists never find</span>
                </li>
                <li className="flex items-start">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Experiencing genuine cultural exchange</span>
                </li>
                <li className="flex items-start">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                  <span>Traveling affordably while meeting amazing people</span>
                </li>
              </ul>
            </div>

            {/* Surfing Challenges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border-l-4 border-orange-500">
              <h3 className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400 mb-4 sm:mb-6 flex items-center">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                But Surfing Can Be Challenging
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Hard to find available couches in popular destinations</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Sometimes hosts aren't available to hang out or show you around</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Stuck with incompatible hosts or awkward situations</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Last-minute rejections leaving you scrambling for accommodation</span>
                </li>
                <li className="flex items-start">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                  <span>Limited to hosts' schedules and availability</span>
                </li>
              </ul>
            </div>
          </div>

          {/* How Nearby Traveler Solves Surfing Problems */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-black dark:text-black">
              Travel With More Connections, Fewer Limitations
            </h3>
            <p className="text-lg sm:text-xl mb-6 max-w-4xl mx-auto leading-relaxed text-gray-700 dark:text-gray-300">
              Connect with multiple locals and travelers in each city. Meet for coffee, join events, explore together — whether you have a couch or not.
              <strong className="block mt-2 text-black dark:text-black">Your travel experience becomes richer, more flexible, and less dependent on any single person.</strong>
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 max-w-3xl mx-auto border border-gray-200 dark:border-gray-600">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                "Instead of hoping one host has time to show you around, you can connect with locals who love hiking, foodies who know the best restaurants, and fellow travelers exploring the same neighborhoods. Your trip becomes an adventure, not a gamble."
              </p>
            </div>
          </div>
        </section>

        {/* OPENING UP THE COMMUNITY - EXPANSION SECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20 bg-white dark:bg-gray-900">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
              Opening Our Community to All Travelers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              For years, amazing travelers have been locked out of our community simply because they couldn't host or find a couch. Now, everyone can join the cultural exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Can't Host */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                "I Can't Host"
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Students in dorms, people with roommates, those in small spaces, strict landlords — there are countless reasons amazing people couldn't join couchsurfing. Now they can connect with travelers anyway.
              </p>
            </div>

            {/* Can't Surf */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                "I Can't Surf"
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Business travelers with company policies, families with children, people uncomfortable with stranger's homes — they still want authentic local connections and cultural exchange.
              </p>
            </div>

            {/* Never Heard of CS */}
            <div className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                "What's Couchsurfing?"
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Millions of travelers have never heard of couchsurfing but would love to meet locals and other travelers. They've been missing out on our amazing community all along.
              </p>
            </div>
          </div>

          {/* The Big Reveal */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-black dark:text-black">
              Now We Can All Connect
            </h3>
            <p className="text-lg sm:text-xl mb-6 max-w-4xl mx-auto leading-relaxed text-gray-700 dark:text-gray-300">
              Imagine our couchsurfing community expanded to include every traveler who shares our values — not just those who can host or surf. 
              <strong className="block mt-2 text-black dark:text-black">That's millions more cultural exchanges, friendships, and adventures waiting to happen.</strong>
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 max-w-3xl mx-auto border border-gray-200 dark:border-gray-600">
              <p className="text-lg font-medium italic text-gray-800 dark:text-gray-200">
                "The couchsurfing spirit was never really about the couch — it was about the connection. Now everyone can experience that magic."
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS - Couchsurfing Style */}
        <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-100 to-blue-100 text-orange-800 text-sm font-bold rounded-full mb-4">
                HOW IT WORKS
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                From <span className="text-black dark:bg-gradient-to-r dark:from-orange-600 dark:to-blue-600 dark:bg-clip-text dark:text-transparent">Strangers to Friends</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                The couchsurfing spirit, evolved for modern life
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-green-100 dark:border-green-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-orange-500 dark:to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">1</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Share Your Interests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Tell travelers about your favorite local spots, events, and what you love about your city.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-blue-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Connect with Travelers
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Meet travelers who share your interests and want authentic local experiences.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-purple-100 dark:border-purple-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-purple-500 dark:to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">3</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Create Memories
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Explore together, share cultures, and build friendships that last beyond the visit.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
              >
                Join Now
              </Button>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Connect with travelers in your city today
              </p>
            </div>
          </div>
        </div>

        {/* WARM CLOSING */}
        <section className="text-center py-12 sm:py-6 sm:py-12 bg-gradient-to-r from-orange-500 to-blue-600 text-white rounded-2xl mb-8 sm:mb-6 sm:mb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Ready for the Next Step?
            </h2>
            <p className="text-lg sm:text-xl mb-8 px-4 leading-relaxed opacity-90">
              Couchsurfing gave us friendships and memories we'll never forget. Nearby Traveler is the next step — the same spirit, with more flexibility. Whether you're a longtime host or just someone who loves connecting with people, you belong here.
            </p>
            <Button 
              onClick={() => setLocation('/join')}
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 text-lg"
            >
              Join Nearby Traveler Today
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}