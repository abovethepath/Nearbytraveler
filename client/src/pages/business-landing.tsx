import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
const businessHeaderPhoto = "/businessheader2_1752350709493.png";

export default function BusinessLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900 overflow-x-hidden">
      
      <LandingHeader />
      <LandingHeaderSpacer />

      {/* HERO SECTION */}
      <div className="relative z-0 overflow-hidden">
        <div className="bg-gray-800 dark:bg-gray-900 border-4 border-orange-500 shadow-lg overflow-hidden">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src={businessHeaderPhoto}
                alt="Business connections and partnerships"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0))"
                }}
                aria-hidden="true"
              />
            </div>
            <div className="relative overflow-hidden">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-16 mx-auto max-w-full sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32 px-4 overflow-hidden">
                  <div className="text-center">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="px-3 leading-tight sm:leading-snug break-words overflow-wrap-anywhere">
                        <span className="block font-black text-[clamp(1.5rem,6vw,2.25rem)] text-white break-words overflow-wrap-anywhere">
                          Grow Your Business
                        </span>
                        <span className="block font-black text-[clamp(1.25rem,5.5vw,2rem)] break-words overflow-wrap-anywhere">
                          <span className="text-amber-300 sm:text-orange-500 break-words overflow-wrap-anywhere">to Targeted Customers </span>
                          <span className="text-blue-300 sm:text-blue-600 break-words overflow-wrap-anywhere">with Nearby Travelers </span>
                          <span className="text-white break-words overflow-wrap-anywhere">and Locals Showing Direct Interest in Your Products and Services</span>
                        </span>
                      </h1>
                      
                      {/* Business value proposition (hide on phones so the hero photo is visible) */}
                      <div className="hidden sm:block mt-8 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 mx-2">
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed px-2 break-words overflow-wrap-anywhere">
                          <span className="text-orange-300 font-bold break-words overflow-wrap-anywhere">"Connect with travelers actively exploring your area and locals seeking authentic experiences.</span>
                          <span className="text-white break-words overflow-wrap-anywhere"> Create targeted offers, host events, and build a loyal customer base that recommends you to others."</span>
                        </p>
                        <div className="mt-4 text-center">
                          <p className="text-white font-bold text-lg break-words overflow-wrap-anywhere">— Your Business Growth Partner</p>
                          <p className="text-orange-200 text-sm break-words overflow-wrap-anywhere">From restaurants to tours - grow your business with real connections</p>
                        </div>
                      </div>
                      
                      {/* Hero CTA */}
                      <div className="mt-8 px-4">
                        <Button
                          onClick={() => setLocation('/join')}
                          size="lg"
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 animate-pulse-glow w-full max-w-lg mx-auto break-words overflow-wrap-anywhere"
                        >
                          <span className="break-words overflow-wrap-anywhere">🚀 Join Nearby Traveler NOW!!!!</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setLocation('/join')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse border-4 border-white break-words overflow-wrap-anywhere"
          style={{ maxWidth: 'calc(100vw - 3rem)' }}
        >
          <span className="break-words overflow-wrap-anywhere">💼 JOIN BUSINESS</span>
        </Button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        
        {/* Multiple CTA Section */}
        <div className="max-w-6xl mx-auto mb-16 w-full min-w-0">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">Ready to Grow Your Business?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 break-words overflow-wrap-anywhere">Choose how you want to connect with travelers and locals!</p>
            
            {/* Primary CTA Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200 break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🏢 JOIN AS BUSINESS</span>
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200 break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">📈 CREATE OFFERS</span>
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200 break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🎉 HOST EVENTS</span>
              </Button>
            </div>
            
            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setLocation('/join')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-2xl text-sm break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🍽️ Restaurants</span>
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-2xl text-sm break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🏨 Hotels</span>
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-2xl text-sm break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🎨 Tours</span>
              </Button>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-2xl text-sm break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🛍️ Retail</span>
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-16 max-w-3xl mx-auto text-left w-full min-w-0 overflow-hidden">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">Why Join Nearby Traveler Business Network?</h2>
          <ul className="list-disc list-inside text-lg text-white sm:text-gray-700 sm:dark:text-gray-200 space-y-2">
            <li className="break-words overflow-wrap-anywhere">Reach travelers who are actively exploring your area and looking for authentic local experiences.</li>
            <li className="break-words overflow-wrap-anywhere">Search and directly target locals and travelers in your area to market your offers and deals to those who express specific interests.</li>
            <li className="break-words overflow-wrap-anywhere">Create time-limited offers and deals that attract both tourists and locals to your business.</li>
            <li className="break-words overflow-wrap-anywhere">Host events to showcase your services and build community connections.</li>
            <li className="break-words overflow-wrap-anywhere">Access detailed analytics about customer engagement and offer performance.</li>
            <li className="break-words overflow-wrap-anywhere">Build lasting relationships with customers who will recommend you to fellow travelers.</li>
          </ul>
        </section>

        <section className="mt-12 max-w-3xl mx-auto text-left w-full min-w-0 overflow-hidden">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg min-w-0 overflow-hidden">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">1. Register</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300 break-words overflow-wrap-anywhere">
                Create your business profile and showcase what makes you special.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg min-w-0 overflow-hidden">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">2. Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300 break-words overflow-wrap-anywhere">
                Reach travelers and locals actively seeking your services.
              </p>
            </div>
            
            <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 p-6 rounded-lg shadow-lg min-w-0 overflow-hidden">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white break-words overflow-wrap-anywhere">3. Grow</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300 break-words overflow-wrap-anywhere">
                Build lasting relationships and grow your customer base.
              </p>
            </div>
          </div>
        </section>

        {/* What Makes Business Special Section */}
        <div className="mt-16 max-w-6xl mx-auto w-full min-w-0 overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white break-words overflow-wrap-anywhere" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            What Makes Nearby Traveler Special for Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-orange-600 p-6 rounded-2xl shadow-lg text-white min-w-0 overflow-hidden">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white break-words overflow-wrap-anywhere">Target Real Customers</h3>
              <p className="text-white break-words overflow-wrap-anywhere">Reach travelers and locals actively seeking authentic experiences in your area. No fake engagement - real people, real connections.</p>
            </div>
            <div className="bg-teal-600 p-6 rounded-2xl shadow-lg text-white min-w-0 overflow-hidden">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-white break-words overflow-wrap-anywhere">Instant Growth</h3>
              <p className="text-white break-words overflow-wrap-anywhere">Create time-limited offers and events that attract both tourists and locals. See immediate results from your marketing efforts.</p>
            </div>
            <div className="bg-orange-700 p-6 rounded-2xl shadow-lg text-white min-w-0 overflow-hidden">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-white break-words overflow-wrap-anywhere">Smart Analytics</h3>
              <p className="text-white break-words overflow-wrap-anywhere">Access detailed insights about customer engagement and offer performance. Make data-driven decisions to grow your business.</p>
            </div>
          </div>

          {/* Get Started Section - Consolidated */}
          <div className="bg-gradient-to-r from-orange-600 to-blue-600 text-white py-16 rounded-2xl shadow-2xl overflow-hidden">
            <div className="max-w-4xl mx-auto text-center px-6">
              <h2 className="text-4xl font-bold mb-4 break-words overflow-wrap-anywhere">Ready to Grow Your Business?</h2>
              <p className="text-xl mb-8 opacity-90 break-words overflow-wrap-anywhere">Join thousands of businesses already connecting with travelers and locals.</p>
              
              {/* Primary CTA Row */}
              <div className="mb-12 flex justify-center">
                <Button
                  onClick={() => setLocation('/join')}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-2 border-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 break-words overflow-wrap-anywhere"
                >
                  <span className="break-words overflow-wrap-anywhere">📈 Start Free Trial</span>
                </Button>
              </div>
              
              {/* Business Types */}
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl overflow-hidden">
                <h3 className="text-xl font-bold mb-4 text-white break-words overflow-wrap-anywhere">Perfect for All Business Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-3xl mb-2">🍽️</div>
                    <p className="text-white/90 font-medium break-words overflow-wrap-anywhere">Restaurants</p>
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-3xl mb-2">🏨</div>
                    <p className="text-white/90 font-medium break-words overflow-wrap-anywhere">Hotels</p>
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-3xl mb-2">🎨</div>
                    <p className="text-white/90 font-medium break-words overflow-wrap-anywhere">Tours</p>
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-3xl mb-2">🛍️</div>
                    <p className="text-white/90 font-medium break-words overflow-wrap-anywhere">Retail</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing Widget */}
        <div className="mt-16 mb-8 max-w-4xl mx-auto w-full min-w-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white p-8 rounded-2xl shadow-2xl border-4 border-white overflow-hidden">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 break-words overflow-wrap-anywhere">Simple Business Pricing</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 overflow-hidden">
                <div className="text-5xl font-black text-white mb-2 break-words overflow-wrap-anywhere">$50</div>
                <div className="text-xl text-white/90 mb-2 break-words overflow-wrap-anywhere">per month</div>
                <div className="text-2xl font-bold text-orange-200 mb-4 break-words overflow-wrap-anywhere">+ $100 Sign Up Fee</div>
                <div className="bg-green-500 text-white font-bold py-2 px-6 rounded-full text-lg mb-4 inline-block break-words overflow-wrap-anywhere">
                  🎉 FREE DURING BETA
                </div>
                <div className="text-white/80 mb-6 space-y-1">
                  <p className="break-words overflow-wrap-anywhere">✅ Business offers and promotions</p>
                  <p className="break-words overflow-wrap-anywhere">✅ Event hosting capabilities</p>
                  <p className="break-words overflow-wrap-anywhere">✅ Direct messaging with customers</p>
                  <p className="break-words overflow-wrap-anywhere">✅ Analytics dashboard</p>
                  <p className="break-words overflow-wrap-anywhere">✅ Customer targeting tools</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/join')}
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-xl px-12 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 break-words overflow-wrap-anywhere"
              >
                <span className="break-words overflow-wrap-anywhere">🚀 Start FREE Beta Now</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 min-w-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex-shrink-0"></div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words overflow-wrap-anywhere">Nearby Traveler</span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words overflow-wrap-anywhere">
                Connecting travelers and locals worldwide through authentic experiences.
              </p>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base break-words overflow-wrap-anywhere">For Businesses</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/business-registration" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Register Business</a></li>
                <li><a href="/business-dashboard" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Dashboard</a></li>
                <li><a href="/business-offers" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Business Offers</a></li>
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base break-words overflow-wrap-anywhere">Support</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/about" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">About</a></li>
                <li><a href="/terms" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Terms</a></li>
                <li><a href="/privacy" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Privacy</a></li>
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base break-words overflow-wrap-anywhere">Connect</h3>
              <ul className="space-y-1 sm:space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="/auth" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Sign In</a></li>
                <li><a href="/signup-business" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Join as Business</a></li>
                <li><a href="/events-landing" className="text-xs sm:text-sm hover:text-gray-900 dark:hover:text-white transition-colors break-words overflow-wrap-anywhere">Events</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p className="break-words overflow-wrap-anywhere">&copy; 2025 Nearby Traveler. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add custom CSS for better text wrapping */}
      <style jsx>{`
        /* Enhanced text wrapping for all screen sizes */
        .break-words {
          word-break: break-word;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
          word-break: break-word;
          hyphens: auto;
        }
        
        /* Ensure no horizontal overflow */
        * {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* Force text wrapping in containers */
        .business-card {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        .business-card * {
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
}