import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
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
      
      {/* Fixed CTA Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'business_landing', 'floating_sign_up');
            setLocation('/join');
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-sign-up"
        >
          Sign Up
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">
        
        {/* HERO SECTION */}
        <div className="pt-4 pb-8 sm:pt-8 sm:pb-12 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:gap-8 lg:gap-12 lg:grid-cols-2 items-center">
              
              {/* Left text side */}
              <div className="order-2 lg:order-1 text-center lg:text-left">
                <div className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">💰 REVENUE MULTIPLIER</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 sm:mb-8">
                  Turn Travelers Into Customers
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Direct access to travelers seeking your services. Connect with potential customers before they even arrive.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={() => {
                      trackEvent('signup_cta_click', 'business_landing', 'main_cta');
                      setLocation('/join');
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-main-cta"
                  >
                    Sign Up Free
                  </Button>
                  <Button
                    onClick={() => {
                      trackEvent('learn_more_click', 'business_landing', 'see_how_it_works');
                      document.querySelector('#problem-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
                    data-testid="button-learn-more"
                  >
                    See How It Works
                  </Button>
                </div>
              </div>

              {/* Right image side */}
              <div className="order-1 lg:order-2 flex flex-col items-center">
                <div className="mb-4 sm:mb-6 text-center w-full">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 italic px-2">
                    Travel doesn't change you.<br />
                    The people you meet do.
                  </p>
                </div>
                
                <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl shadow-lg">
                  <img
                    src={businessHeaderPhoto}
                    alt="Successful business owner connecting with customers"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
                  />
                </div>
                
                <p className="mt-3 sm:mt-4 text-sm sm:text-base italic text-orange-600 text-center font-medium">
                  Where Authentic Experiences Meet Local Business
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE PROPOSITION */}
      <section id="problem-section" className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Skip the Ads. Connect Directly.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Travelers tell us what they want. We connect them with you directly.
          </p>
        </div>
      </section>

      {/* PERFECT FOR SECTION */}
      <section className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect For Local Experience Providers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-blue-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-black">Tour Operators</h3>
              <p className="text-black text-sm">Walking tours, food tours, cultural experiences</p>
            </div>
            <div className="bg-white dark:bg-blue-700 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🚴</div>
              <h3 className="text-xl font-bold mb-3 text-black">Activity Providers</h3>
              <p className="text-black text-sm">Hiking, biking, water sports, adventure activities</p>
            </div>
            <div className="bg-white dark:bg-orange-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-3 text-black">Restaurants & Cafes</h3>
              <p className="text-black text-sm">Hidden gems seeking authentic food lovers</p>
            </div>
            <div className="bg-white dark:bg-purple-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3 text-black">Cultural Experiences</h3>
              <p className="text-black text-sm">Art classes, cooking lessons, craft workshops</p>
            </div>
            <div className="bg-white dark:bg-teal-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🚗</div>
              <h3 className="text-xl font-bold mb-3 text-black">Transportation Services</h3>
              <p className="text-black text-sm">Local guides, drivers, unique transport</p>
            </div>
            <div className="bg-white dark:bg-pink-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-3 text-black">Local Guides</h3>
              <p className="text-black text-sm">Photography tours, city experts, neighborhood specialists</p>
            </div>
          </div>
        </div>
      </section>

      {/* YOUR ADVANTAGE - With Details */}
      <section className="bg-white dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Competitive Advantage
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Get customers other businesses can't reach</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Direct Customer Connection</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Get customers other businesses can't reach</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-left">
                <li>• Direct customer connection</li>
                <li>• No competitor interference</li>
                <li>• Exclusive access to travelers</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gradient-to-br dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Quality Customers</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Experience seekers with spending power</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-left">
                <li>• Higher lifetime value</li>
                <li>• Authentic experience seekers</li>
                <li>• Word-of-mouth promoters</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Smart Matching</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Connect with travelers who want exactly what you offer</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-left">
                <li>• Know travel dates & duration</li>
                <li>• See interests & preferences</li>
                <li>• Understand group size & budget</li>
              </ul>
            </div>
          </div>
        </div>
      </section>



      {/* WHY BUSINESSES CHOOSE US */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Businesses Choose Us
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-emerald-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3 text-black">Keep 100% of Your Revenue</h3>
              <p className="text-black text-sm">No commission fees like TripAdvisor or Viator. What you earn is yours.</p>
            </div>
            <div className="bg-white dark:bg-blue-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-black">Direct Relationships</h3>
              <p className="text-black text-sm">Build lasting customer relationships without middlemen taking a cut.</p>
            </div>
            <div className="bg-white dark:bg-purple-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3 text-black">Recurring Customers</h3>
              <p className="text-black text-sm">Travelers return and bring friends. Build a loyal following.</p>
            </div>
            <div className="bg-white dark:bg-orange-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-black">Real Customer Insights</h3>
              <p className="text-black text-sm">Understand what travelers want before they arrive in your city.</p>
            </div>
            <div className="bg-white dark:bg-yellow-600 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-black">Instant Notifications</h3>
              <p className="text-black text-sm">Get alerted when travelers matching your services are planning trips.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Simple setup, instant results</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create Your Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add your services, location, and what makes you special</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Get Matched</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Travelers find you based on their interests and travel plans</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Grow Your Business</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connect with customers and build lasting relationships</p>
            </div>
          </div>
        </div>
      </section>

      {/* REAL USE CASES */}
      <section className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See How It Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Local Tour Guide</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                "Maria runs photography walking tours. Through Nearby Traveler, she connects with photography enthusiasts before they arrive. She now books 15-20 tours monthly with travelers who specifically want her expertise."
              </p>
            </div>
            <div className="bg-white dark:bg-gradient-to-br dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Hidden Restaurant</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                "Carlos owns a family taqueria locals love but tourists never find. Now travelers seeking authentic Mexican food discover him through local recommendations. His evening crowds doubled."
              </p>
            </div>
            <div className="bg-white dark:bg-gradient-to-br dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Adventure Activity Provider</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                "Jake offers sunrise kayaking tours. He connects with early-bird travelers who love outdoor adventures. No more competing with hundreds of activities on tourist sites—just direct connections with his ideal customers."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">From the Founder</h2>
          <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            "After hosting 400+ travelers, I watched them desperately search for authentic experiences while local businesses struggled to reach them. The best experiences were happening through personal connections, not ads. We built the platform that connects travelers directly with the locals who can give them what they're looking for."
          </blockquote>
          <p className="text-sm text-gray-600 dark:text-gray-400">— Aaron Lefkowitz, Founder, Nearby Traveler</p>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-full font-bold mb-4 text-lg">
              🔥 LIMITED TIME: FREE BETA ACCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Join Free Now - $75/month After Beta
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Beta Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl border-4 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-1 rounded-full font-bold text-sm">
                FREE BETA
              </div>
              <div className="text-center mt-4">
                <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">$0</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">/month</div>
                <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-6">During beta period</div>
              </div>
            </div>
            
            {/* Regular Price */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-gray-300 dark:border-gray-600 relative opacity-75">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-6 py-1 rounded-full font-bold text-sm">
                AFTER BETA
              </div>
              <div className="text-center mt-4">
                <div className="text-5xl font-black text-gray-700 dark:text-gray-300 mb-2">$75</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">/month</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-6">Standard pricing for all businesses</div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">What's Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Full profile creation
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Direct customer messaging
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Event promotion
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Customer insights dashboard
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Smart matching with travelers
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mr-2 text-lg">✓</span>
                Real-time notifications
              </div>
            </div>
          </div>

          {/* Beta Advantage */}
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Join during beta for free access. Once beta ends, pricing is $75/month for all businesses.
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold mb-2">⏰ Limited beta spots available</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Join 500+ local businesses already connecting with travelers</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              Book just 1-2 customers per month and this pays for itself. Most businesses book 10-20.
            </p>
          </div>

          <div className="text-center">
            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_claim_beta');
                setLocation('/join');
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              data-testid="button-claim-beta-pricing"
            >
              <Zap className="w-6 h-6 mr-2" />
              Claim Your Free Beta Access
            </Button>
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-orange-500 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-black">
            Ready to Connect With Travelers Who Want Your Services?
          </h2>
          <p className="text-lg mb-8 text-black">
            Join local businesses already growing their customer base through authentic traveler connections.
          </p>
          
          <Button
            onClick={() => {
              trackEvent('signup_cta_click', 'business_landing', 'final_cta_claim_beta');
              setLocation('/join');
            }}
            size="lg"
            variant="ghost"
            className="bg-white hover:bg-gray-100 font-bold text-xl px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            data-testid="button-final-cta"
          >
            <span style={{ color: '#000000' }}>Claim Your Free Beta Access</span>
          </Button>
        </div>
      </section>
    </div>
  );
}