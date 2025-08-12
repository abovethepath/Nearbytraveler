import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingNavbar from "@/components/landing-navbar";



// Helper function for custom icons
const CustomIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  // Fallback to simple SVG icons since step icons may not exist
  const getStepIcon = (stepNumber: string) => {
    if (stepNumber.includes('step1')) {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="50" cy="30" r="15" fill="#0d9488" />
            <path d="M20 80 Q50 60 80 80" stroke="#0d9488" strokeWidth="8" fill="none" />
            <circle cx="35" cy="72" r="6" fill="#0d9488" />
            <circle cx="65" cy="72" r="6" fill="#0d9488" />
            <line x1="25" y1="65" x2="35" y2="80" stroke="#0d9488" strokeWidth="3" />
          </g>
        </svg>
      );
    } else if (stepNumber.includes('step2')) {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="50" cy="50" r="25" stroke="#0d9488" strokeWidth="4" fill="none" />
            <circle cx="35" cy="40" r="3" fill="#0d9488" />
            <circle cx="65" cy="40" r="3" fill="#0d9488" />
            <path d="M35 60 Q50 70 65 60" stroke="#0d9488" strokeWidth="3" fill="none" />
          </g>
        </svg>
      );
    } else {
      return (
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-teal-500">
          <g>
            <circle cx="40" cy="40" r="25" stroke="#0d9488" strokeWidth="4" fill="none" />
            <line x1="58" y1="58" x2="75" y2="75" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
            <circle cx="30" cy="35" r="3" fill="#0d9488" />
            <circle cx="50" cy="35" r="3" fill="#0d9488" />
            <path d="M30 45 Q40 55 50 45" stroke="#0d9488" strokeWidth="2" fill="none" />
          </g>
        </svg>
      );
    }
  };
  
  return (
    <div className={className}>
      {getStepIcon(iconName)}
    </div>
  );
};

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans" key="landing-v2-no-copy-button">
      {/* Sticky Call-to-Action Button - Always Visible */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setLocation('/auth')}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 border-2 border-white animate-pulse"
          style={{
            boxShadow: '0 8px 25px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.8)',
          }}
        >
🚀 JOIN NOW
        </Button>
      </div>

      {/* Landing Navbar with BETA badge */}
      <LandingNavbar />
      



      {/* HERO SECTION */}
      <div className="relative">
        <div className="bg-gray-800 dark:bg-gray-900 border border-white/30 dark:border-gray-300/20">
          <div className="relative bg-gray-800 dark:bg-gray-900 pb-32 overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 h-full min-h-[600px]">
              <img
                src="/attached_assets/travelers together hugging_1754971726997.avif"
                alt="Travel experience"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 70%' }}
              />
              <div className="absolute inset-0 bg-gray-800/70 dark:bg-gray-800/40 mix-blend-multiply" aria-hidden="true" />
            </div>
            <div className="relative">
              <div className="sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                <main className="mt-4 mx-auto max-w-full sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12">
                  <div className="text-center">
                    <h1 className="text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                      <span className="block text-white" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>Transform Your Travel</span>
                      <span className="block text-orange-400" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>Into Authentic Connections</span>
                    </h1>
                    <p className="mt-4 text-lg text-white sm:text-xl md:text-2xl lg:text-3xl px-4">
                      The premium social platform connecting discerning travelers with verified locals and like-minded explorers worldwide.
                    </p>
                    
                    {/* Social Proof Stats */}
                    <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-white">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">2,500+</div>
                        <div className="text-sm">Active Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">15+</div>
                        <div className="text-sm">Global Cities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">500+</div>
                        <div className="text-sm">Monthly Events</div>
                      </div>
                    </div>
                    
                    {/* Prominent Call-to-Action Button - Positioned lower in hero */}
                    <div className="mt-16 mb-8">
                      <Button
                        onClick={() => setLocation('/auth')}
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-4 rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-3xl border-4 border-white"
                        style={{
                          fontSize: '1.5rem',
                          minHeight: '60px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.8)',
                          animation: 'gentle-pulse 3s ease-in-out infinite',
                        }}
                      >
🚀 JOIN THE COMMUNITY 🚀
                      </Button>
                    </div>

                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusive Beta Access */}
      <div className="py-12 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-8 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-white font-bold text-sm uppercase tracking-wide">Exclusive Beta Access</span>
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full ml-2 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              Join Our Premium Los Angeles Launch
            </h3>
            <p className="text-lg text-white text-center leading-relaxed mb-4">
              <span className="font-semibold">You're invited to be among the first</span> to experience our curated community of travelers and locals. While our global network spans 15+ cities, we're launching with an exclusive focus on Los Angeles premium events and experiences.
            </p>
            <p className="text-base text-orange-100 text-center">
              Early members get lifetime premium features and priority access to new cities as we expand worldwide.
            </p>
          </div>
        </div>
      </div>



      {/* Testimonials Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Travelers Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands who've transformed their travel experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "I found my travel squad for Tokyo through Nearby Traveler. Instead of exploring alone, I had instant friends who knew the best ramen spots and hidden temples. Game changer!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  S
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sarah Chen</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Digital Nomad, San Francisco</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "As a local in Barcelona, I love showing visitors the real city beyond tourist traps. The connections I've made through this platform have been genuine and lasting."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  M
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Miguel Rodriguez</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Local Host, Barcelona</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l-5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Business travel used to be lonely. Now I connect with entrepreneurs and professionals in every city I visit. It's transformed my entire approach to work travel."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Amanda Foster</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">VP Marketing, NYC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div className="py-12 sm:py-16 bg-white dark:sm:bg-gray-800 dark:bg-gray-400">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl px-4" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              Why Discerning Travelers Choose Us
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              Skip the tourist traps. Connect with verified locals and like-minded travelers who share your passion for authentic experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4">
            {/* Value Prop 1 - Verified Community */}
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-300 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-black mb-3">Verified Community</h3>
              <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed">Connect safely with authenticated members. Every profile is verified for quality connections and authentic experiences.</p>
            </div>

            {/* Value Prop 2 - Curated Experiences */}
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-300 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-black mb-3">Premium Experiences</h3>
              <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed">Access exclusive events, hidden gems, and curated experiences that showcase the authentic soul of each destination.</p>
            </div>

            {/* Value Prop 3 - Global Network */}
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-300 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-black mb-3">Global Network</h3>
              <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed">Join a worldwide community of sophisticated travelers and locals across 15+ major cities and growing.</p>
            </div>

            {/* Value Prop 4 - Smart Matching */}
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-300 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-black mb-3">AI-Powered Matching</h3>
              <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed">Our intelligent algorithm connects you with people who share your interests, travel style, and professional background.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FROM THE FOUNDER SECTION */}
      <div className="bg-white dark:sm:bg-gray-800 dark:bg-gray-400 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              From the Founder
            </h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
            <div className="prose prose-lg text-gray-700 dark:text-gray-300 mx-auto text-left">
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                As a traveler and local, I always loved meeting new people—but finding those who truly shared my interests wasn't easy.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                That's why I created Nearby Traveler.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                This platform helps travelers and locals meet each other, based on shared interests, activities, demographics, and events—making every encounter more meaningful.
              </p>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                Whether you're exploring your city or visiting somewhere new, Nearby Traveler helps you:
              </p>
              <div className="mb-6 pl-4">
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Connect with like-minded people</span></p>
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Discover hidden gems</span></p>
                <p className="mb-2 text-base sm:text-lg"><span className="text-blue-600 dark:text-blue-400 font-semibold">• Create unforgettable memories</span></p>
              </div>
              <p className="mb-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                It's more than just travel—it's about real community, wherever you are. So complete your profile, dive in, and start connecting.
              </p>
              <p className="mb-2 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                Thanks for being part of the journey.
              </p>
              <div className="text-right mt-6">
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Aaron Lefkowitz</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Founder, Nearby Traveler</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION - SIMPLIFIED */}
      <div className="bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500 py-12 sm:py-16">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white lg:text-4xl px-4" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 px-4">
              Simple steps to connect with locals and travelers worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1: Join */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step1-icon_1753297128966.png" 
                      alt="Join Nearby Traveler" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 1 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">1</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Join Nearby Traveler</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Join Nearby Traveler to help shape the future of travel connections, sharing your interests and travel style for personalized matches.
              </p>
            </div>

            {/* Step 2: Connect */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step2-icon_1753297145395.png" 
                      alt="Connect with People" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 2 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">2</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Connect</h3>
              <p className="text-white sm:text-gray-600 sm:dark:text-gray-300">
                Connect with Nearby Travelers and Locals who share your interests and travel dates.
              </p>
            </div>

            {/* Step 3: Explore */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-lg border-2 border-amber-400 flex items-center justify-center bg-white shadow-md mx-auto">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/step3-icon_1753297157985.png" 
                      alt="Explore and Discover" 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        console.log('Step 3 icon failed to load, using fallback');
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">3</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Explore</h3>
              <p className="text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                Explore your destination with your new connections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOR LOCALS SECTION */}
      <div id="locals" className="py-16 bg-white dark:sm:bg-gray-800 dark:bg-gray-400">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                🏠 Locals: Your City, Through Your Eyes
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6">
                You know your city best. You create the experiences that make travelers fall in love 
                with your hometown. You're not just participating - you're leading.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Host Events:</strong> Beach BBQs, hiking trips, cultural tours - share what you love</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Share Hidden Gems:</strong> Your secret spots become unforgettable discoveries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Make Connections:</strong> Connect with other locals and welcome travelers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-3">✓</span>
                  <span><strong>Build Community:</strong> Create lasting friendships with fellow travelers and locals who share your interests</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Expand Your Social Network</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6">
                Share your favorite spots, host unique events, and show travelers the authentic side of your city.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Nearby Local
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOR TRAVELERS SECTION */}
      <div id="travelers" className="py-16 bg-gray-50 dark:sm:bg-gray-900 dark:bg-gray-500">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Next Adventure Awaits</h3>
              <p className="text-gray-100 sm:text-gray-700 sm:dark:text-gray-300 mb-6">
                Find local-led experiences and connect with fellow travelers to make your next trip unforgettable.
              </p>
              <Button 
                onClick={() => setLocation('/join')}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl text-black"
              >
                Join as a Nearby Traveler
              </Button>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
                🌍 For Travelers: Discover Cities Through Connections
              </h2>
              <p className="text-lg text-gray-100 sm:text-gray-600 sm:dark:text-gray-300 mb-6">
                Skip the tourist traps. Connect with locals who know their cities inside out and 
                fellow travelers who share your interests and travel dates.
              </p>
              <ul className="space-y-4 text-gray-100 sm:text-gray-600 sm:dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Local-Created Events:</strong> Join authentic experiences designed by locals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Hidden Gem Access:</strong> Discover spots tourists never find</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Traveler Connections:</strong> Meet people who share your travel dates and interests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-3">✓</span>
                  <span><strong>Insider Knowledge:</strong> Get tips that guidebooks don't have</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION SECTION */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6" style={{fontFamily: '"Open Sans", sans-serif', fontWeight: '700'}}>
            <span className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
              Ready to Join the Community?
            </span>
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Whether you're a local ready to share your city or a traveler seeking authentic experiences, 
            your journey starts here.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => setLocation('/join')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl text-white"
            >
              Join Nearby Traveler
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}