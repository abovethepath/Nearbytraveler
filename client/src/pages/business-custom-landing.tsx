import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { Users, MapPin, Globe, RefreshCw, Home, ShieldCheck, Plane, Building2, Handshake, Store, TrendingUp } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

export default function BusinessCustomLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_custom_landing', 'floating_join_now');
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
        <div className="pt-4 sm:pt-8 pb-8 sm:pb-12 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8 grid gap-6 sm:gap-8 md:grid-cols-2 items-center">
            {/* Left text side */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Trouble Meeting Tourists <br /> as a Business?
              </h1>
              <p className="mt-2 text-sm italic text-blue-600">
                Turn Your Location Into a Community Hub
              </p>
              <p className="mt-3 sm:mt-4 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                Connect directly with travelers and locals looking for authentic experiences at your restaurant, café, shop, or venue.
              </p>
            </div>

            {/* Right image side */}
            <div className="flex justify-center order-first md:order-last">
              <img
                src="/travelers together hugging_1754971726997.avif"
                alt="Business owner connecting with customers"
                className="rounded-2xl shadow-lg object-cover w-full max-w-sm sm:max-w-md h-auto"
              />
            </div>
          </div>
        </div>

        {/* VALUE SECTION - Business Focused */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Why Businesses Choose Nearby Traveler
          </h2>
          <p className="mt-2 text-center text-lg text-zinc-600 dark:text-zinc-400">
            Turn your location into a destination for travelers and locals seeking authentic experiences.
          </p>

          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Direct Customer Access
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect directly with travelers and locals actively seeking experiences at places like yours.
              </p>
            </div>

            <div>
              <TrendingUp className="mx-auto h-8 w-8 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Increase Foot Traffic
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get discovered by travelers who want authentic local experiences, not tourist traps.
              </p>
            </div>

            <div>
              <Globe className="mx-auto h-8 w-8 text-purple-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Build Community
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Create a loyal community of locals and return visitors who love your place.
              </p>
            </div>

            <div>
              <MapPin className="mx-auto h-8 w-8 text-orange-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Showcase Your Uniqueness
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Highlight what makes your business special to people who appreciate authenticity.
              </p>
            </div>

            <div>
              <Handshake className="mx-auto h-8 w-8 text-pink-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Host Events & Meetups
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Organize events that bring travelers and locals together at your venue.
              </p>
            </div>

            <div>
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Verified Community
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect with real people through our verified community platform.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS - Business Style */}
        <div className="relative z-10 py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-bold rounded-full mb-4">
                HOW IT WORKS
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                From <span className="text-black dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:bg-clip-text dark:text-transparent">Empty Tables to Community Hub</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Simple steps to connect with your ideal customers
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-blue-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">1</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Create Your Profile
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Showcase your business, what makes it unique, and the experiences you offer.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-purple-100 dark:border-purple-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-purple-500 dark:to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Connect with Customers
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Meet travelers and locals who are looking for exactly what you offer.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-green-100 dark:border-green-800 h-80 flex flex-col">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-gradient-to-r dark:from-green-500 dark:to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300 dark:border-none">
                      <span className="text-black dark:text-white text-2xl font-black">3</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    Grow Your Community
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed flex-grow">
                    Turn one-time visitors into loyal customers and community advocates.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium text-xl px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Join Now
              </Button>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Start connecting with your ideal customers today
              </p>
            </div>
          </div>
        </div>

        {/* CLOSING SECTION */}
        <section className="text-center py-12 sm:py-16 bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 text-black dark:text-white rounded-2xl mb-8 sm:mb-16 border-2 border-gray-300 dark:border-none">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Ready to Grow Your Business?</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 px-4 leading-relaxed">Join businesses already connecting with travelers and locals worldwide.</p>
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