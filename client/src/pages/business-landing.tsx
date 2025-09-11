import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { useTheme } from "@/components/theme-provider";
import { trackEvent } from "@/lib/analytics";
import { 
  DollarSign, 
  Target,
  BarChart3,
  Zap,
  Trophy,
  MapPin,
  Star
} from "lucide-react";

import businessHeaderPhoto from "@assets/image_1756765621788.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { setTheme } = useTheme();
  
  // FORCE LIGHT MODE for landing page - user requirement
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      {/* Fixed CTA Button - Mobile Only */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_landing', 'floating_join_now');
            setLocation('/launching-soon');
          }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          data-testid="button-mobile-cta"
        >
          JOIN NOW
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 sm:pt-4 sm:pb-6 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3">
              <div className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 px-4 py-2 rounded-full mb-4">
                <span className="text-sm font-bold text-orange-600">💰 REVENUE MULTIPLIER</span>
              </div>
              
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                <h1>Turn Travelers Into Customers</h1>
              </div>
              <div className="mt-3 sm:mt-4 max-w-xl text-sm md:text-base lg:text-lg text-zinc-600 dark:text-zinc-300">
                <p>Direct access to travelers seeking your services.</p>
              </div>
              
              {/* Desktop CTAs */}
              <div className="hidden sm:flex mt-4 flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    trackEvent('signup_cta_click', 'business_landing', 'claim_beta');
                    setLocation('/launching-soon');
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  data-testid="button-claim-beta"
                >
                  <Zap className="w-5 h-5 mr-2 inline" />
                  JOIN NOW
                </button>
                <button 
                  onClick={() => {
                    document.querySelector('#problem-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 w-full sm:w-auto"
                  data-testid="button-see-how-it-works"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              <div className="mb-2 text-center w-full">
                <p className="text-sm md:text-lg font-bold text-zinc-800 italic px-2">
                  Turn Travelers Into Customers
                </p>
              </div>
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[200px] sm:h-[250px] md:h-[350px] rounded-2xl">
                <img
                  src={businessHeaderPhoto}
                  alt="Successful business owner connecting with customers"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-lg"
                />
              </div>
              <p className="mt-2 text-xs md:text-sm italic text-orange-600 text-center">
                Where Authentic Experiences Meet Local Business
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE PROPOSITION */}
      <section id="problem-section" className="bg-gradient-to-br from-red-50 to-orange-50 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Stop Wasting Money on Ads
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Travelers tell us what they want. We connect them with you directly.
          </p>
        </div>
      </section>

      {/* YOUR ADVANTAGE - With Details */}
      <section className="bg-white py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your Competitive Advantage
            </h2>
            <p className="text-lg text-gray-600">Get customers other businesses can't reach</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-2">Zero Competition</h3>
              <p className="text-sm text-gray-700 mb-3">No bidding wars or ad costs</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Direct customer connection</li>
                <li>• No competitor interference</li>
                <li>• Exclusive access to travelers</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center">
              <Star className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-2">Quality Customers</h3>
              <p className="text-sm text-gray-700 mb-3">Experience seekers with spending power</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Higher lifetime value</li>
                <li>• Authentic experience seekers</li>
                <li>• Word-of-mouth promoters</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-2">Complete Data</h3>
              <p className="text-sm text-gray-700 mb-3">Full customer profiles and preferences</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Travel dates & duration</li>
                <li>• Interests & preferences</li>
                <li>• Group size & budget</li>
              </ul>
            </div>
          </div>
        </div>
      </section>



      {/* HOW IT WORKS */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">Simple setup, instant results</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create Your Profile</h3>
              <p className="text-sm text-gray-600">Add your services, location, and what makes you special</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Get Matched</h3>
              <p className="text-sm text-gray-600">Travelers find you based on their interests and travel plans</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Grow Your Business</h3>
              <p className="text-sm text-gray-600">Connect with customers and build lasting relationships</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Free During Beta
          </h2>
          
          <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-orange-500">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-bold mb-3">
                🔥 FREE BETA ACCESS
              </div>
              <div className="text-3xl font-black text-green-600 mb-2">$0</div>
              <div className="text-sm text-gray-600 mb-4">Complete access • No setup fees • No hidden costs</div>
              
              <div className="text-left max-w-md mx-auto mb-4">
                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <span className="text-green-500 mr-2">✓</span>
                  Full profile creation
                </div>
                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <span className="text-green-500 mr-2">✓</span>
                  Direct customer messaging
                </div>
                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <span className="text-green-500 mr-2">✓</span>
                  Event promotion tools
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✓</span>
                  Customer insights dashboard
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_free_beta');
                setLocation('/launching-soon');
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              data-testid="button-pricing-cta"
            >
              <Zap className="w-5 h-5 mr-2" />
              JOIN FREE BETA
            </Button>
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="py-6 sm:py-12 bg-gradient-to-r from-orange-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Stop Losing Customers to Competitors
          </h2>
          
          <Button
            onClick={() => {
              trackEvent('signup_cta_click', 'business_landing', 'final_cta_start_now');
              setLocation('/launching-soon');
            }}
            size="lg"
            className="bg-white hover:bg-gray-100 text-orange-600 hover:text-orange-700 font-bold text-xl px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            data-testid="button-final-cta"
          >
            🚀 START NOW - FREE
          </Button>
        </div>
      </section>
    </div>
  );
}