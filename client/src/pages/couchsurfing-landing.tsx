import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Coffee, Heart } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function CouchsurfingLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const { setTheme } = useTheme();

  const headlines = [
    "Love Meeting Tourists?",
    "Tired of Couch Roulette?",
    "Want Cultural Exchange?",
    "Meet Travelers Your Way?"
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

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'couchsurfing_landing', 'floating_join_now');
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
        {/* FOUNDER STORY HERO */}
        <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 md:grid-cols-2 items-center">
            {/* Left text side */}
            <div>
              <div className="mb-4 inline-block rounded-full bg-green-50 dark:bg-green-900/30 px-4 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                <Heart className="inline w-4 h-4 mr-2" />
                From a Fellow Couchsurfer
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
                A Letter to the Couchsurfing Community
              </h1>
              <blockquote className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-4 border-green-500 pl-6 mb-6">
                "As a 15-year Couchsurfing host and traveler, I've had some of the best moments of my life meeting people through the community. But over time, I realized I couldn't always host, I couldn't always find a couch — yet I always wanted to meet travelers. That's why I created Nearby Traveler."
              </blockquote>
              <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">
                — Aaron Lefkowitz, Founder & Fellow Couchsurfer
              </p>
              <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
                Connect with travelers based on shared interests, not just accommodation needs. Host when you want. Travel when you can. Meet travelers always.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    trackEvent('signup_cta_click', 'couchsurfing_landing', 'main_hero_button');
                    setLocation('/join');
                  }}
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto"
                  data-testid="button-join-couchsurfing"
                >
                  Join Now
                </button>
                <button 
                  onClick={() => {
                    trackEvent('learn_more_click', 'couchsurfing_landing', 'see_how_it_works');
                    document.querySelector('#community-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-xl border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800 w-full sm:w-auto"
                  data-testid="button-see-how-it-works-cs"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right image side */}
            <div className="flex justify-center">
              <img
                src="/travelers together hugging_1754971726997.avif"
                alt="People connecting over coffee"
                className="rounded-2xl shadow-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* VALUE SECTION - Couchsurfing Focused */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Beyond Just Needing a Couch
          </h2>
          <p className="mt-2 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Connect based on shared interests, activities, and genuine compatibility - not just accommodation needs.
          </p>

          <div className="mt-12 max-w-4xl mx-auto">
            <ul className="space-y-6 text-lg text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start">
                <Coffee className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
                <span>Meet through interests and activities, not just accommodation</span>
              </li>
              <li className="flex items-start">
                <MapPin className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                <span>Connect at cafés, events, and local spots — no couch required</span>
              </li>
              <li className="flex items-start">
                <Globe className="w-6 h-6 text-purple-600 mr-4 mt-1 flex-shrink-0" />
                <span>Share local secrets and experience cultural exchange</span>
              </li>
              <li className="flex items-start">
                <Users className="w-6 h-6 text-orange-600 mr-4 mt-1 flex-shrink-0" />
                <span>Connect when you want, how you want — no obligations</span>
              </li>
              <li className="flex items-start">
                <RefreshCw className="w-6 h-6 text-pink-600 mr-4 mt-1 flex-shrink-0" />
                <span>Stay connected across trips</span>
              </li>
              <li className="flex items-start">
                <ShieldCheck className="w-6 h-6 text-indigo-600 mr-4 mt-1 flex-shrink-0" />
                <span>Feel safe with verification and references</span>
              </li>
            </ul>
          </div>
        </section>

        {/* THE HOSTING JOURNEY - Honest Perspective */}
        <section id="hosting-journey" className="mx-auto max-w-6xl px-6 py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl mb-16">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-800 to-blue-800 text-green-800 dark:text-green-200 text-sm font-bold rounded-full mb-4">
              FOR EXPERIENCED HOSTS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
              We Know You've <span className="text-green-600 dark:text-green-400">Loved Hosting</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              If you've hosted before, you know the magic: meeting fascinating people, sharing your city, learning about new cultures. But hosting can also be exhausting, unpredictable, and sometimes just not possible with work or family life. That doesn't mean you're less generous — it just means life changes. With Nearby Traveler, you can keep the spirit of cultural exchange alive in a way that works for you today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* What You Loved */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 flex items-center">
                <Heart className="w-6 h-6 mr-3" />
                What You've Loved About Hosting
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Globe className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Meeting fascinating people from every corner of the world</span>
                </li>
                <li className="flex items-start">
                  <Users className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Creating deep connections and lifelong friendships</span>
                </li>
                <li className="flex items-start">
                  <Coffee className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Sharing your city's hidden gems and local culture</span>
                </li>
                <li className="flex items-start">
                  <RefreshCw className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Learning about other cultures without traveling</span>
                </li>
                <li className="flex items-start">
                  <Handshake className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>The satisfaction of helping fellow travelers</span>
                </li>
              </ul>
            </div>

            {/* The Challenges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-orange-500">
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-6 flex items-center">
                <Home className="w-6 h-6 mr-3" />
                But Hosting Can Be...
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Exhausting when you need your personal space</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Stressful with work, family, or relationship commitments</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Unpredictable with last-minute cancellations or no-shows</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Limiting when your living situation changes</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Overwhelming when you just want a quiet weekend</span>
                </li>
              </ul>
            </div>
          </div>

          {/* The Evolution */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Sometimes We Just Grow Out of It
            </h3>
            <p className="text-lg sm:text-xl mb-6 opacity-90 max-w-4xl mx-auto leading-relaxed">
              You're not less generous. You're not less welcoming. Life evolves, priorities shift, and that's completely normal. 
              <strong className="block mt-2">You can still share your love for your city—just differently.</strong>
            </p>
            <div className="bg-white/10 rounded-xl p-6 max-w-3xl mx-auto">
              <p className="text-lg font-medium">
                "For 15 years I opened my home to 400+ travelers from 50 countries. I learned what makes travel unforgettable isn't the sites — it's the people you share them with. Too often, those connections are left to luck. I created Nearby Traveler so no one has to explore — or live in their own city — disconnected."
              </p>
              <p className="text-sm mt-2 opacity-80">— Aaron Lefkowitz, Founder</p>
            </div>
          </div>
        </section>

        {/* SIMPLE CONTRASTS */}
        <section className="mx-auto max-w-6xl px-6 py-20 bg-white dark:bg-gray-900">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
              Couchsurfing vs Nearby Traveler
            </h2>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    <strong>Dependent on One Host?</strong>
                  </p>
                </div>
                <div className="text-3xl">→</div>
                <div className="text-center md:text-right">
                  <p className="text-green-700 dark:text-green-400 text-lg font-medium">
                    With NT, you meet multiple locals and travelers
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    <strong>Uncomfortable with couches?</strong>
                  </p>
                </div>
                <div className="text-3xl">→</div>
                <div className="text-center md:text-right">
                  <p className="text-blue-700 dark:text-blue-400 text-lg font-medium">
                    Connect at cafés, events, and public spaces
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    <strong>Can't find hosts?</strong>
                  </p>
                </div>
                <div className="text-3xl">→</div>
                <div className="text-center md:text-right">
                  <p className="text-purple-700 dark:text-purple-400 text-lg font-medium">
                    Still find locals and travelers to meet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS - Couchsurfing Style */}
        <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 text-sm font-bold rounded-full mb-4">
                HOW IT WORKS
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                From <span className="text-black dark:bg-gradient-to-r dark:from-green-600 dark:to-blue-600 dark:bg-clip-text dark:text-transparent">Strangers to Friends</span>
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
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-green-500 dark:to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
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
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
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
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
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
        <section className="text-center py-12 sm:py-16 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl mb-8 sm:mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Ready for the Next Step?
            </h2>
            <p className="text-lg sm:text-xl mb-8 px-4 leading-relaxed opacity-90">
              Couchsurfing gave us friendships and memories we'll never forget. Nearby Traveler is the next step — the same spirit, with more flexibility. Whether you're a longtime host or just someone who loves connecting with people, you belong here.
            </p>
            <Button 
              onClick={() => setLocation('/join')}
              className="bg-white hover:bg-gray-100 text-green-600 font-bold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 text-lg"
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