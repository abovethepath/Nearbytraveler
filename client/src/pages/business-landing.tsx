import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { trackEvent } from "@/lib/analytics";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Star,
  Target,
  BarChart3,
  Clock,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Zap,
  Trophy,
  Heart
} from "lucide-react";

const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile check
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
            setLocation('/join');
          }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Start Growing →
        </Button>
      </div>

      <ThemeToggle />
      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* POWERFUL HERO SECTION */}
        <div className="pt-8 pb-12 bg-white dark:bg-gray-900">
          <div className="grid gap-8 md:grid-cols-5 items-center">
            {/* Left text side - wider */}
            <div className="md:col-span-3 space-y-6">
              <div className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full">
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">💰 REVENUE MULTIPLIER</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Turn Every Traveler Into a 
                <span className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent"> Paying Customer</span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                Stop losing money to generic ads. Connect directly with travelers and locals actively seeking YOUR services right NOW in your city.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    trackEvent('signup_cta_click', 'business_landing', 'hero_start_growing');
                    setLocation('/join');
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Growing Revenue
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200"
                >
                  See Success Stories
                </Button>
              </div>

              {/* Social Proof Numbers */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Businesses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Travelers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">300%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue Boost</div>
                </div>
              </div>
            </div>

            {/* Right image side */}
            <div className="md:col-span-2 flex flex-col items-center order-first md:order-last">
              <div className="mb-4 text-center">
                <p className="text-base md:text-lg lg:text-xl font-bold text-zinc-800 dark:text-zinc-200 italic">
                  <span className="sm:hidden">Smart Business, Real Results</span>
                  <span className="hidden sm:inline">Smart Business Decisions Create Real Results</span>
                </p>
              </div>
              
              <div className="overflow-hidden relative w-full max-w-sm sm:max-w-md h-[250px] sm:h-[300px] md:h-[400px] rounded-2xl">
                <img
                  src={businessHeaderPhoto}
                  alt="Successful business owner connecting with customers"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl shadow-xl"
                />
              </div>
              
              <p className="mt-3 text-sm md:text-base italic text-orange-600 dark:text-orange-400 text-center font-semibold">
                Where Revenue Meets Real Connections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS-DRIVEN VALUE SECTION */}
      <section className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Stop Wasting Money on Ads That Don't Work
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect directly with high-value customers who are already looking for exactly what you offer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Revenue Growth */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-green-500">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">300% Revenue Increase</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Businesses see average 300% revenue boost within 90 days by connecting with targeted travelers and locals
              </p>
              <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                ✓ Real customers, not clicks
              </div>
            </div>

            {/* Customer Quality */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-blue-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quality Over Quantity</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Reach travelers spending $200+ daily and locals seeking premium experiences - not bargain hunters
              </p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                ✓ High-value customers only
              </div>
            </div>

            {/* Instant Connection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-orange-500">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Instant Customer Flow</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start getting customers within 24 hours. No waiting for ad approval or campaign optimization
              </p>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                ✓ Immediate results
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS PROOF SECTION */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Real Businesses, Real Results
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See how smart business owners are growing revenue with targeted connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Success Story 1 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Maria's Authentic Tacos</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Food Truck, Austin</p>
                </div>
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 italic mb-4">
                "I went from serving 50 customers a day to 200+ within a month. Travelers actually seek us out now instead of just stumbling upon us. Revenue tripled."
              </blockquote>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-green-600">+300% Revenue</span>
                <span className="text-blue-600">+400% Customers</span>
              </div>
            </div>

            {/* Success Story 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Brooklyn Art Tours</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tour Company, NYC</p>
                </div>
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 italic mb-4">
                "Finally, customers who actually want what we offer! No more competing on price. We book $5000+ in tours weekly now."
              </blockquote>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-green-600">+250% Bookings</span>
                <span className="text-orange-600">+150% Profit Margin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM/SOLUTION SECTION */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Problem Side */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">
                You're Bleeding Money on Bad Marketing
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Facebook ads cost $50+ per customer with no guarantee they'll buy</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Google ads put you in bidding wars against corporate giants</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Tourism boards and directories bury you under competitors</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Social media reaches everyone EXCEPT people ready to buy</span>
                </li>
              </ul>
            </div>

            {/* Solution Side */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                Connect Directly with Ready Buyers
              </h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Reach travelers actively seeking your type of service</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Connect with locals looking for new experiences in their city</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Target by interests, budget, and travel style - not demographics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Build lasting relationships that generate repeat business</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS ROI SECTION */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Math That Matters to Your Business
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Stop guessing about ROI. Here's what smart business owners achieve:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 text-center">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">$5,000</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Average Monthly Revenue Increase</div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">85%</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Customer Conversion Rate</div>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-400 mb-2">24hrs</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Time to First Customer</div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 text-center">
              <Heart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">90%</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Customer Retention Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES SECTION */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect for Revenue-Focused Businesses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join successful businesses already growing with Nearby Traveler
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🍽️</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Restaurants</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fill empty tables with food lovers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🏨</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Hotels</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Boost occupancy with experience seekers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🎨</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Tours</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fill tours with engaged travelers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-4xl mb-4">🛍️</div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Retail</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Attract customers seeking unique finds</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION - COMPELLING */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Investment That Pays for Itself
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-orange-500">
            <div className="mb-6">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-4">
                🔥 LIMITED TIME: FREE DURING BETA
              </div>
              <div className="text-gray-500 dark:text-gray-400 line-through text-xl mb-2">$150/month + $200 setup</div>
              <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">$0</div>
              <div className="text-lg text-gray-600 dark:text-gray-300">Complete access during beta period</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">🎯 Customer Acquisition</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Direct access to travelers in your city</li>
                  <li>✓ Target by interests, not demographics</li>
                  <li>✓ Connect with locals seeking new experiences</li>
                  <li>✓ Real-time customer matching</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">📈 Revenue Tools</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Create time-limited offers & deals</li>
                  <li>✓ Host events that drive sales</li>
                  <li>✓ Performance analytics dashboard</li>
                  <li>✓ Customer relationship management</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'pricing_free_beta');
                setLocation('/join');
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl px-12 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="w-6 h-6 mr-2" />
              Claim Your FREE Beta Access
            </Button>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY - BUSINESS FOCUSED */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/10 dark:to-blue-900/10"></div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl p-8 shadow-xl border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-md">
              <div className="text-center">
                <h3 className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-2xl font-bold text-transparent mb-6">
                  From the Founder
                </h3>

                <blockquote className="text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200 mb-6 max-w-3xl mx-auto">
                  "After hosting 400+ travelers, I watched amazing local businesses struggle to reach the right customers. Million-dollar marketing budgets went to waste while travelers walked past empty restaurants looking for 'authentic local spots.' The disconnect was painful to watch. I built Nearby Traveler to solve this - connecting businesses directly with customers who want exactly what they offer."
                </blockquote>

                <div className="pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    — Aaron Lefkowitz, Founder, Nearby Traveler
                  </p>
                  <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">
                    "Revenue Growth Through Real Connections"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Stop Losing Customers to Competitors
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Every day you wait, travelers are booking with businesses already on Nearby Traveler
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => {
                trackEvent('signup_cta_click', 'business_landing', 'final_cta_start_now');
                setLocation('/join');
              }}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-bold text-xl px-12 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Start Growing Revenue Now
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <span className="text-sm opacity-75">FREE during beta • No setup fees • Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full"></div>
                <span className="text-xl font-bold">Nearby Traveler</span>
              </div>
              <p className="text-gray-400">
                Connecting businesses with ready-to-buy customers since 2024
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/join" className="hover:text-white transition-colors">Join Beta</a></li>
                <li><a href="/business-success" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="/business-analytics" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/business-onboarding" className="hover:text-white transition-colors">Business Onboarding</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}