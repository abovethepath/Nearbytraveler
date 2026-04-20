import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import LandingCTA from "@/components/LandingCTA";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { trackEvent } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
// Import images as URLs - using JPG/PNG for iPhone compatibility
const localsHeaderImage = "/landing-images/locals_1756777112458.png";
const travelersHeaderImage = "/travlersonastreet.jpg";
const travelersHomeImage = "/landing-images/locals_1756777112458.png";

export default function LandingStreamlined() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { theme, setTheme } = useTheme();

  // Capture ?ref= referral code from URL for signup flow
  useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) sessionStorage.setItem('referralCode', ref);
    } catch {}
  });
  const [currentVideo, setCurrentVideo] = useState(0);

  // NOTE: Some clips in the current rotation may read ambiguously (e.g., two people
  // connecting in ways that could be mistaken for romantic/dating content).
  // Aaron will re-cut specific clips and replace files at the same paths.
  // Do not edit the video files in this task.
  // Rotating hero videos with custom durations (in milliseconds)
  const heroVideos = [
    { src: "/hiker_LA_clip_1.mp4", duration: 15000 }, // 15 seconds
    { src: "/hiker_LA_clip_1.mp4", duration: 15000 }, // 15 seconds
    { src: "/hiker_LA_clip_1.mp4", duration: 15000 }, // 15 seconds
    { src: "/hiker_LA_clip_1.mp4", duration: 10000 }, // 10 seconds
    { src: "/hiker_LA_clip_1.mp4", duration: 8000 }   // 8 seconds
  ];
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate videos with custom durations for each video
  useEffect(() => {
    const currentDuration = heroVideos[currentVideo].duration;
    console.log(`🎬 Video ${currentVideo + 1} playing for ${currentDuration/1000} seconds`);
    
    const videoTimeout = setTimeout(() => {
      setCurrentVideo(prev => {
        const nextVideo = (prev + 1) % heroVideos.length;
        console.log(`🔄 Switching from video ${prev + 1} to video ${nextVideo + 1}`);
        return nextVideo;
      });
    }, currentDuration);

    return () => clearTimeout(videoTimeout);
  }, [currentVideo]);
  // On mount: clear any stuck body scroll-lock states left over from Radix UI
  // dialogs/sheets in the authenticated app, then scroll to top.
  useEffect(() => {
    try {
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      // Remove any orphaned Radix portal overlays that may block touch events
      document.querySelectorAll('[data-radix-dialog-overlay],[data-radix-sheet-overlay],[data-radix-alert-dialog-overlay]').forEach(el => {
        try { el.parentNode?.removeChild(el); } catch {}
      });
      window.scrollTo(0, 0);
    } catch {}
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    trackEvent('landing_page_cta_clicked', 'hero_section', 'Get Started');
    setLocation('/join');
  };

  return (
    <div className="bg-white dark:bg-gray-900 font-sans">
      
      
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_get_started');
            handleGetStarted();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base"
          data-testid="button-floating-get-started"
        >
          Get Started
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">
        
        {/* Live Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 py-4 sm:py-5 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-xl sm:text-2xl text-white font-bold">
              Now Live — Join for Free and Start Connecting
            </p>
          </div>
        </div>

        {/* HERO SECTION - Full Video Background with Rotation */}
        <section className="relative w-full overflow-hidden bg-[#0b1020] min-h-[80vh] md:min-h-[88vh] lg:min-h-[92vh] flex items-center">
          {/* Rotating Video Backgrounds with Crossfade — atmospheric only */}
          {heroVideos.map((video, index) => (
            <video
              key={index}
              src={video.src}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out pointer-events-none ${
                index === currentVideo ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop
              muted
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          ))}

          {/* Heavy layered overlay — typography dominates the media */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#05070f]/75 via-[#070a14]/60 to-[#05070f]/95 pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#05070f]/70 via-[#05070f]/20 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 18% 108%, rgba(255,107,53,0.05), transparent 55%)' }}></div>

          {/* Editorial eyebrow — top-left meta */}
          <div className="absolute top-6 left-5 md:top-8 md:left-10 z-20 hidden sm:flex items-center gap-2.5 text-[10px] font-medium tracking-[0.24em] uppercase text-white/45">
            <span className="w-6 h-[1px] bg-white/40"></span>
            <span>Nearby Traveler</span>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-28">
            <div className="max-w-4xl">
              <h1 className="font-sans leading-[1.04] tracking-tight" style={{ textWrap: 'balance' }}>
                <span className="block text-[2.125rem] sm:text-[2.75rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-normal text-white/55">
                  You&rsquo;re not meeting strangers.
                </span>
                <span className="block text-[2.375rem] sm:text-[3rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-semibold text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                  You&rsquo;re finding your people.
                </span>
              </h1>

              <p className="mt-7 md:mt-10 max-w-xl text-[0.9375rem] md:text-[1.0625rem] leading-[1.6] text-white/70 font-normal">
                Your people aren&rsquo;t always local. Sometimes they just landed. Nearby Traveler helps you find them in your city &mdash; whether you live there or you&rsquo;re flying in for four days.
              </p>

              <div className="mt-9 md:mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-[#0b1020] hover:bg-white/90 px-7 py-3.5 rounded-full text-[0.9375rem] font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_10px_36px_-10px_rgba(0,0,0,0.55)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_14px_42px_-12px_rgba(255,255,255,0.20)]"
                  data-testid="button-hero-get-started"
                >
                  Go meet someone
                  <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    trackEvent('learn_more_click', 'landing_page', 'see_how_it_works');
                    document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-white/75 hover:text-white px-1.5 py-2 transition-colors duration-300"
                  data-testid="button-learn-more"
                >
                  See how it works
                  <span aria-hidden="true" className="inline-block text-white/40 group-hover:text-white/85 transition-all duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thin bottom separator */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"></div>
        </section>

        {/* Everyone's a traveler — editorial manifesto */}
        <section className="animate-on-scroll relative bg-[#0b1020] py-20 md:py-28 lg:py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04), transparent 60%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-white leading-[1.08] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              Everyone&rsquo;s a traveler, depending on the day.
            </h2>

            <div className="mt-10 md:mt-14 space-y-6 text-left sm:text-center text-[1.0625rem] md:text-lg leading-[1.7] text-white/70 font-normal max-w-2xl mx-auto">
              <p>
                The person who just landed in LA for four days? Traveler.<br />
                The person who&rsquo;s lived here four years but hasn&rsquo;t been to Griffith? Also a traveler. They just don&rsquo;t know it yet.
              </p>
              <p>
                Nearby Traveler is built on a simple idea: the people you&rsquo;re meant to know aren&rsquo;t always where you are. But they pass through. Or you pass through where they are. The app helps you catch each other.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </section>

        <LandingCTA />

        {/* Why Nearby Traveler */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
              Why Nearby Traveler
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 sm:mb-16 leading-relaxed">
              Whether you're traveling or at home, Nearby Traveler helps you create real connections that last.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Reconnect When Paths Cross Again</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Know when a friend you met in one city shows up in your next destination—the only app that notifies you when travel friends are nearby.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Share Meals with Travelers & Locals</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Connect with people before your trip starts and turn dinners into friendships.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Explore Authentic Spots Beyond Guidebooks</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Discover hidden gems shared by locals, not tourist traps.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Build Your Local Community</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Organize events, welcome travelers, and build community without leaving home.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Vouched Connections & Verified Profiles</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Every member can be vouched for by others they've met, with optional verification for added trust.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Build a Global Network of Friends</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Create a worldwide circle of connections who share your interests and values.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reconnect Across Cities - NEW SECTION */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12 sm:mb-16">
              Reconnect Across Cities
            </h2>
            
            {/* Example Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-4 mb-4">
                  <p className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold leading-relaxed">
                    Remember that person you met in Barcelona? They just landed in your city.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border-l-4 border-orange-500">
                <div className="flex items-start gap-4 mb-4">
                  <p className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold leading-relaxed">
                    The traveler you hosted last year? They're in Tokyo—where you're heading next week.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Feature Highlight */}
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-xl mb-12 sm:mb-16">
              <p className="text-xl sm:text-2xl lg:text-3xl text-white text-center font-bold leading-relaxed">
                Nearby Traveler notifies you when friends from past travels are nearby. Turn one-time encounters into lifelong connections that span the globe.
              </p>
            </div>
            
            {/* Bottom Statement */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-lg">
              <p className="text-xl sm:text-2xl lg:text-3xl text-center text-gray-900 dark:text-white font-bold leading-relaxed mb-6">
                One coffee in Paris becomes dinner in New York. A hiking buddy in Bali reconnects with you in Berlin.
              </p>
              <p className="text-lg sm:text-xl text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 font-bold">
                Your travel friendships don't end when the trip does. Keep those connections alive, no matter where life takes you next.
              </p>
            </div>
          </div>
        </section>

        {/* When Travelers Meet Locals */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
              When Travelers Meet Locals, Magic Happens
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Expand your social life</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Discover day trip adventures</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Practice language exchange</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Find meaningful relationships</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Experience local culture</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Meet local families</span>
              </div>
            </div>

            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              This isn't just travel. This is connection.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12 sm:mb-16">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Set Up Your Profile & Travel Plans</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Sign up as a local or traveler. Add your interests and activities. Planning a trip? Set your destination and dates—our AI matches you with locals and travelers there.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600 text-orange-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Discover, Message & Meet Up</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Browse AI-matched people in your city or destination. Message them directly. Go Available Now. Join community events. RSVP to local gatherings.
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Stay Connected Worldwide</h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  Get notified when past connections travel to your city—or when you're heading to theirs. Your friendships reconnect automatically, no matter where you go.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community in Action */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
              See Our Community in Action
            </h2>
            <p className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
              Every week, Nearby Traveler sponsors authentic local experiences hosted by passionate community members. From cultural tours to food adventures, these events bring our community together and showcase the real heart of each city.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-orange-500/10 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/70 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Beach Bonfire & BBQ</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                  Sunset gathering with locals — authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-orange-500/10 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/70 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Taco Tuesday</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">$1.50</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                  Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-orange-500/10 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/70 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Hollywood Sign Hike</h3>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold self-start">Free</span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                  Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* From the Founder */}
        <section className="animate-on-scroll py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-orange-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 sm:mb-12">From the Founder</h2>
            <div className="bg-white dark:bg-gray-900/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10">
              <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-6 sm:mb-8 italic text-white">
                &ldquo;I hosted 400 travelers in New York over 15 years. They weren&rsquo;t strangers. They were my people &mdash; I just didn&rsquo;t know them yet. Nearby Traveler is how I help other people find theirs.&rdquo;
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">&mdash; Aaron Lefkowitz, Founder</p>
            </div>
          </div>
        </section>

        {/* Credibility Bar */}
        <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed">
              400+ travelers hosted by our founder | 5 community connectors in Los Angeles | Inspired by global travel communities like Couchsurfing & Meetup
            </p>
          </div>
        </section>

        {/* For anyone — editorial single line */}
        <section className="animate-on-scroll py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-gray-900 dark:text-white leading-[1.15] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              For anyone who&rsquo;s ever felt alone in a city full of people.
            </p>
          </div>
        </section>

        {/* Final CTA — two-line editorial */}
        <section className="animate-on-scroll py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-12 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-sans leading-[1.05] tracking-tight" style={{ textWrap: 'balance' }}>
              <span className="block text-[2.25rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-normal text-gray-500 dark:text-white/50">
                Go meet someone.
              </span>
              <span className="block text-[2.5rem] sm:text-[3.25rem] md:text-6xl lg:text-[4.25rem] font-semibold text-gray-900 dark:text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                Find your people.
              </span>
            </h2>

            <div className="mt-10 md:mt-14 flex justify-center">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-[#0b1020] hover:bg-gray-800 dark:hover:bg-white/90 px-8 py-4 rounded-full text-base font-semibold tracking-tight transition-all duration-300 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_42px_-12px_rgba(0,0,0,0.45)]"
                data-testid="button-final-cta"
              >
                Join for free
                <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </button>
            </div>
          </div>
        </section>

        {/* Launch Cities & Features */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-6">
              Launching soon in <span className="font-bold">Los Angeles and worldwide</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                Verified profiles
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                Community references
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                Vouched connections
              </span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}