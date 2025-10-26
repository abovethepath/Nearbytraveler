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
          Join Now
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
                  Claim Free Beta Access
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
            Skip the Ads. Connect Directly.
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Travelers tell us what they want. We connect them with you directly.
          </p>
        </div>
      </section>

      {/* PERFECT FOR SECTION */}
      <section className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perfect For Local Experience Providers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Tour Operators</h3>
              <p className="text-gray-700 dark:text-white text-sm">Walking tours, food tours, cultural experiences</p>
            </div>
            <div className="bg-green-200 dark:bg-green-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🚴</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Activity Providers</h3>
              <p className="text-gray-700 dark:text-white text-sm">Hiking, biking, water sports, adventure activities</p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Restaurants & Cafes</h3>
              <p className="text-gray-700 dark:text-white text-sm">Hidden gems seeking authentic food lovers</p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Cultural Experiences</h3>
              <p className="text-gray-700 dark:text-white text-sm">Art classes, cooking lessons, craft workshops</p>
            </div>
            <div className="bg-teal-200 dark:bg-teal-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🚗</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Transportation Services</h3>
              <p className="text-gray-700 dark:text-white text-sm">Local guides, drivers, unique transport</p>
            </div>
            <div className="bg-pink-200 dark:bg-pink-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Local Guides</h3>
              <p className="text-gray-700 dark:text-white text-sm">Photography tours, city experts, neighborhood specialists</p>
            </div>
          </div>
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
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Direct Customer Connection</h3>
              <p className="text-sm text-gray-700 mb-3">Get customers other businesses can't reach</p>
              <ul className="text-xs text-gray-600 space-y-1 text-left">
                <li>• Direct customer connection</li>
                <li>• No competitor interference</li>
                <li>• Exclusive access to travelers</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Quality Customers</h3>
              <p className="text-sm text-gray-700 mb-3">Experience seekers with spending power</p>
              <ul className="text-xs text-gray-600 space-y-1 text-left">
                <li>• Higher lifetime value</li>
                <li>• Authentic experience seekers</li>
                <li>• Word-of-mouth promoters</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Smart Matching</h3>
              <p className="text-sm text-gray-700 mb-3">Connect with travelers who want exactly what you offer</p>
              <ul className="text-xs text-gray-600 space-y-1 text-left">
                <li>• Know travel dates & duration</li>
                <li>• See interests & preferences</li>
                <li>• Understand group size & budget</li>
              </ul>
            </div>
          </div>
        </div>
      </section>



      {/* WHY BUSINESSES CHOOSE US */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Businesses Choose Us
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-200 dark:bg-emerald-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Keep 100% of Your Revenue</h3>
              <p className="text-gray-700 dark:text-white text-sm">No commission fees like TripAdvisor or Viator. What you earn is yours.</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Direct Relationships</h3>
              <p className="text-gray-700 dark:text-white text-sm">Build lasting customer relationships without middlemen taking a cut.</p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Recurring Customers</h3>
              <p className="text-gray-700 dark:text-white text-sm">Travelers return and bring friends. Build a loyal following.</p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Real Customer Insights</h3>
              <p className="text-gray-700 dark:text-white text-sm">Understand what travelers want before they arrive in your city.</p>
            </div>
            <div className="bg-yellow-200 dark:bg-yellow-600 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Instant Notifications</h3>
              <p className="text-gray-700 dark:text-white text-sm">Get alerted when travelers matching your services are planning trips.</p>
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

      {/* REAL USE CASES */}
      <section className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              See How It Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Local Tour Guide</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Maria runs photography walking tours. Through Nearby Traveler, she connects with photography enthusiasts before they arrive. She now books 15-20 tours monthly with travelers who specifically want her expertise."
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Hidden Restaurant</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Carlos owns a family taqueria locals love but tourists never find. Now travelers seeking authentic Mexican food discover him through local recommendations. His evening crowds doubled."
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Adventure Activity Provider</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Jake offers sunrise kayaking tours. He connects with early-bird travelers who love outdoor adventures. No more competing with hundreds of activities on tourist sites—just direct connections with his ideal customers."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">From the Founder</h2>
          <blockquote className="text-lg italic text-gray-700 mb-4 leading-relaxed">
            "After hosting 400+ travelers, I watched them desperately search for authentic experiences while local businesses struggled to reach them. The best experiences were happening through personal connections, not ads. We built the platform that connects travelers directly with the locals who can give them what they're looking for."
          </blockquote>
          <p className="text-sm text-gray-600">— Aaron Lefkowitz, Founder, Nearby Traveler</p>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-full font-bold mb-4 text-lg">
              🔥 LIMITED TIME: FREE BETA ACCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Join Free Now - $75/month After Beta
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Beta Members */}
            <div className="bg-white rounded-xl p-8 shadow-2xl border-4 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-1 rounded-full font-bold text-sm">
                FREE BETA
              </div>
              <div className="text-center mt-4">
                <div className="text-5xl font-black text-green-600 mb-2">$0</div>
                <div className="text-lg font-bold text-gray-900 mb-1">/month</div>
                <div className="text-sm text-green-600 font-semibold mb-6">Lock in this rate forever</div>
              </div>
            </div>
            
            {/* Regular Price */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-300 relative opacity-75">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-6 py-1 rounded-full font-bold text-sm">
                SOON
              </div>
              <div className="text-center mt-4">
                <div className="text-5xl font-black text-gray-700 mb-2">$75</div>
                <div className="text-lg font-bold text-gray-900 mb-1">/month</div>
                <div className="text-sm text-gray-600 font-semibold mb-6">Standard pricing after beta</div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">What's Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Full profile creation
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Direct customer messaging
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Unlimited event promotion
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Customer insights dashboard
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Smart matching with travelers
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Real-time notifications
              </div>
            </div>
          </div>

          {/* Beta Advantage */}
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-gray-900 mb-3">
              Beta members pay $0 forever. Once beta ends, new businesses pay $75/month. Lock in free access now.
            </p>
            <p className="text-sm text-orange-600 font-semibold mb-2">⏰ Limited spots available</p>
            <p className="text-sm text-gray-600 mb-4">Join 500+ local businesses already connecting with travelers</p>
            <p className="text-sm text-gray-700 italic">
              Book just 1-2 customers per month and this pays for itself. Most businesses book 10-20.
            </p>
          </div>

          <div className="text-center">
            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_lock_in_free');
                setLocation('/launching-soon');
              }}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              data-testid="button-lock-in-free"
            >
              <Zap className="w-6 h-6 mr-2" />
              Lock In Free Access Forever
            </Button>
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-orange-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Connect With Travelers Who Want Your Services?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Join local businesses already growing their customer base through authentic traveler connections.
          </p>
          
          <Button
            onClick={() => {
              trackEvent('signup_cta_click', 'business_landing', 'final_cta_claim_beta');
              setLocation('/launching-soon');
            }}
            size="lg"
            className="bg-white hover:bg-gray-100 text-orange-600 hover:text-orange-700 font-bold text-xl px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            data-testid="button-final-cta"
          >
            Claim Your Free Beta Access
          </Button>
        </div>
      </section>
    </div>
  );
}