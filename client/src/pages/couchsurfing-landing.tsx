import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee, Heart, Calendar, Star, CheckCircle, X, Award, MessageCircle, Camera, Compass, Gift } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import couchsurfingHeroImage from "@assets/couch_1756775792515.png";

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
    }, 5000);
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
        
        {/* HERO SECTION - CLEAN VERSION */}
        <div className="pt-4 pb-6 sm:pt-8 sm:pb-12 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
            {/* Left text side */}
            <div className="md:col-span-3 text-center md:text-left">
              {/* Clean Badge */}
              <div className="mb-6 inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-4 sm:px-6 py-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                <span className="inline w-4 h-4 mr-2">❤️</span>
                Same Spirit, More People
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                Love Couchsurfing?
                <br className="hidden sm:block" />
                <span className="text-blue-600">You'll Love This.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-4 max-w-4xl mx-auto leading-relaxed">
                MEET ALL TRAVELERS and locals. We connect travelers with locals through shared interests, activities, events and demographics — whether you can host or not.
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
                  <span className="sm:hidden">Travel - Where Memories Live Forever</span>
                  <span className="hidden sm:inline">Travel - Where Memories Live Forever</span>
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
                Same Values, More Connections
              </p>
            </div>
          </div>
        </div>


        {/* FOR EXPERIENCED HOSTS SECTION */}
        <section className="py-8 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl mb-8">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-100 dark:bg-blue-900/50 px-4 py-2 rounded-full text-sm font-medium text-blue-700 dark:text-blue-400 mb-4">
                FOR EXPERIENCED HOSTS
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                We Know You Love Hosting
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed">
                If you've hosted before, you know the magic: meeting fascinating people, sharing your city, learning about new cultures. But hosting can sometimes just not be possible with work or family life. That doesn't mean you're less generous — it just means life changes. With Nearby Traveler, you can keep the spirit of meaningful connections alive in a way that works for you today.
              </p>
            </div>
          </div>
        </section>

        {/* BEYOND THE COUCH SECTION */}
        <section className="py-8 sm:py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl mb-8">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Beyond the Couch
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed">
                Open to all travelers — whether you're hosting, have your own place, or staying elsewhere. Nearby Traveler helps you meet people through shared interests, activities, events, and genuine compatibility.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <ul className="space-y-4 text-lg text-zinc-700 dark:text-zinc-300">
                <li><strong className="text-zinc-900 dark:text-white">Match by what you love</strong> — Interests and activities</li>
                <li><strong className="text-zinc-900 dark:text-white">Headed to the same events</strong> — See who's also going to Taylor Swift, Comic-Con, SXSW, and more</li>
                <li><strong className="text-zinc-900 dark:text-white">Meet on your terms</strong> — Coffee, hikes, shows, markets, bars, the beach</li>
                <li><strong className="text-zinc-900 dark:text-white">Real moments, not just messages</strong> — Share hidden gems and build experiences together</li>
                <li><strong className="text-zinc-900 dark:text-white">Total flexibility</strong> — Connect when you want—hosting or not</li>
                <li><strong className="text-zinc-900 dark:text-white">Short on time while hosting?</strong> — Point guests to Nearby Traveler so they can meet others in town</li>
              </ul>
            </div>
          </div>
        </section>

        {/* NOW WE CAN ALL CONNECT SECTION */}
        <section className="py-8 sm:py-16 mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              Now We Can All Connect
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed mb-6">
              Imagine our couchsurfing community expanded to include everyone who shares our values — not just those who can host or surf.
            </p>
            
            <p className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 max-w-4xl mx-auto leading-relaxed">
              That's millions more genuine connections, friendships, and adventures waiting to happen.
            </p>
          </div>
          
        </section>

        {/* SOMETIMES WE JUST GROW OUT OF IT SECTION */}
        <section className="py-8 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 rounded-2xl mb-8">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Sometimes We Just Grow Out of It
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                You're not less generous. You're not less welcoming. Life evolves, priorities shift, and that's completely normal.
              </p>
              <div className="mt-8">
                <p className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
                  You can still share your love for your city—just differently.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* THE BEST OF BOTH WORLDS SECTION */}
        <section className="py-8 sm:py-16 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                The Best of Both Worlds
              </h2>
              <p className="text-lg sm:text-xl mb-6 leading-relaxed">
                Host when your schedule allows. Meet travelers when hosting isn't possible.
              </p>
              <p className="text-xl sm:text-2xl font-semibold">
                Your generosity and love for authentic connections never has to stop.
              </p>
            </div>
          </div>
        </section>

        {/* FOR EXPERIENCED SURFERS SECTION */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl mb-16">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-indigo-100 dark:bg-indigo-900/50 px-4 py-2 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-4">
                FOR EXPERIENCED SURFERS
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                We Know You've Loved Surfing
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed">
                If you've surfed before, you know the magic: authentic local insights, genuine connections, and the thrill of discovering a place through someone else's eyes. But finding the right hosts and navigating unpredictable situations can be challenging. With Nearby Traveler, you can keep that authentic travel spirit alive with more options and fewer limitations.
              </p>
            </div>
          </div>
        </section>

        {/* REACH ALL TRAVELERS SECTION */}
        <section className="py-8 sm:py-16 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl mb-8">
          <div className="px-6 sm:px-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-orange-100 dark:bg-orange-900/50 px-4 py-2 rounded-full text-sm font-medium text-orange-700 dark:text-orange-400 mb-4">
                REACH ALL TRAVELERS
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                Connect with 100% of Travelers
              </h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed mb-8">
                Couchsurfing's hangouts feature was brilliant for last-minute connections. We've expanded that concept — now reach ALL travelers in your city:
              </p>
              
              <Button 
                onClick={() => {
                  trackEvent('signup_cta_click', 'couchsurfing_landing', 'reach_all_travelers');
                  setLocation('/launching-soon');
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg"
                data-testid="button-reach-all-travelers"
              >
                <Globe className="w-5 h-5 mr-2" />
                Join the Platform
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                <div className="flex items-start">
                  <Building2 className="w-6 h-6 text-orange-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Hotel & Airbnb Travelers</h3>
                    <p className="text-zinc-700 dark:text-zinc-300">Connect with travelers who have accommodation but want authentic local experiences</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-red-500">
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Visiting Friends & Family</h3>
                    <p className="text-zinc-700 dark:text-zinc-300">Meet travelers staying with locals who want to expand their social circle</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
                <div className="flex items-start">
                  <Coffee className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Solo Travelers</h3>
                    <p className="text-zinc-700 dark:text-zinc-300">Connect with independent travelers seeking authentic local experiences during their journey</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                <div className="flex items-start">
                  <Compass className="w-6 h-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Digital Nomads</h3>
                    <p className="text-zinc-700 dark:text-zinc-300">Meet remote workers and long-term travelers who want community connections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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

      {/* FAQ SECTION */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
              FAQ (short & honest)
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Is this Couchsurfing?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                No. Nearby Traveler isn't affiliated with Couchsurfing™. We share the same spirit and aim to complement it.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Do I have to host?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                No. Meet in public first. Host only if/when it feels right.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Is it free?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                Yes, it's free while we learn.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                How do you keep people safe?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                Public-first meetups, in-app messaging, block/report, and planned verification during beta. Use common sense; your comfort comes first.
              </p>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => {
                trackEvent('signup_cta_click', 'couchsurfing_landing', 'faq_join_waitlist');
                setLocation('/launching-soon');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg mb-4"
              data-testid="button-faq-join-waitlist"
            >
              <Heart className="w-5 h-5 mr-2 inline" />
              Join the waitlist
            </Button>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
              Same spirit • More ways to connect
            </p>
            
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-6 max-w-2xl mx-auto">
              Note: Couchsurfing™ is a trademark of its respective owner. Nearby Traveler is not affiliated with Couchsurfing™—we're fans, and we aim to complement the community you love.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}