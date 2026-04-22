import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
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
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

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

  // Show the floating "Get Started" button only after the user scrolls past
  // the hero area. Threshold is ~80% of viewport height (approx hero height).
  useEffect(() => {
    const onScroll = () => {
      setShowFloatingCTA(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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
    <div className="bg-white dark:bg-gray-900 font-sans overflow-x-hidden">


      <div
        className={`fixed right-4 sm:right-6 z-50 transition-opacity duration-300 ${showFloatingCTA ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        aria-hidden={!showFloatingCTA}
      >
        <Button 
          onClick={() => {
            trackEvent('signup_cta_click', 'landing_page', 'floating_get_started');
            handleGetStarted();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base min-h-[44px]"
          data-testid="button-floating-get-started"
        >
          Get Started
        </Button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">

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

          {/* Layered overlay — lighter so the video breathes, warm tint preserved below */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#05070f]/60 via-[#070a14]/45 to-[#05070f]/78 pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#05070f]/55 via-[#05070f]/10 to-transparent pointer-events-none"></div>
          {/* Localized dark wash behind the text block only — horizontal band
              in the middle so the subhead stays readable when the video
              rotates through brighter/busier frames. Sits below warm radials
              so the amber tint retains its full intensity in the corners. */}
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 32% at 50% 50%, rgba(0,0,0,0.38), transparent 70%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 110%, rgba(255,140,60,0.14), transparent 55%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 82% 8%, rgba(255,180,110,0.08), transparent 50%)' }}></div>

          {/* Editorial eyebrow — top-left meta. Shifted right so it sits
              clearly inside the dark overlay zone on wider viewports. */}
          <div className="absolute top-6 left-4 sm:left-8 md:top-8 md:left-20 lg:left-24 z-20 hidden sm:flex items-center gap-3 text-sm md:text-base font-semibold tracking-[0.22em] uppercase text-white">
            <span className="w-8 h-[1px] bg-white/80"></span>
            <span>Nearby Traveler</span>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-28">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-sans leading-[1.04] tracking-tight" style={{ textWrap: 'balance' }}>
                <span className="block text-[2.125rem] sm:text-[2.75rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-normal text-white/75">
                  Meet locals and travelers in your city
                </span>
                <span className="block text-[2.375rem] sm:text-[3rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-semibold text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                  through what you have in common
                </span>
              </h1>

              <p className="mt-7 md:mt-10 max-w-xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.6] text-white/90 font-normal">
                People who share your interests &mdash; in your city, or wherever you&rsquo;re traveling next.
              </p>

              <div className="mt-9 md:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-7 py-3.5 rounded-full text-[0.9375rem] font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_10px_36px_-10px_rgba(249,115,22,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_14px_44px_-12px_rgba(249,115,22,0.6)]"
                  data-testid="button-hero-get-started"
                >
                  Meet Your People
                  <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    trackEvent('learn_more_click', 'landing_page', 'see_how_it_works');
                    document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group inline-flex items-center justify-center sm:justify-start gap-2 text-[0.9375rem] font-medium text-white/75 hover:text-white px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors duration-300"
                  data-testid="button-learn-more"
                >
                  See how it works
                  <span aria-hidden="true" className="inline-block text-white/40 group-hover:text-white/85 transition-all duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thin bottom separator */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none"></div>
        </section>

        {/* Everyone's a traveler — editorial manifesto */}
        <section className="animate-on-scroll relative bg-[#0b1020] py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04), transparent 60%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-white leading-[1.08] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              Everyone&rsquo;s a traveler, depending on the day.
            </h2>

            <div className="mt-10 md:mt-14 space-y-6 text-center text-[1.0625rem] md:text-lg leading-[1.7] text-white/70 font-normal max-w-2xl mx-auto">
              <p>
                The person who just landed in LA for four days? Traveler.<br />
                The person who&rsquo;s lived here four years but hasn&rsquo;t been to Griffith? Also a traveler.
              </p>
              <p>
                Nearby Traveler is built on a simple idea: the people you&rsquo;re meant to know aren&rsquo;t always where you are. But they pass through. Or you pass through where they are. The app helps you catch each other.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </section>

        {/* Reconnection — editorial narrative beat (slightly warmer dark tone) */}
        <section className="animate-on-scroll relative bg-[#120a10] py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,60,0.09), transparent 55%)' }}></div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 100%, rgba(255,180,110,0.06), transparent 50%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-sans leading-[1.06] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              <span className="block text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[3rem] font-normal text-white/75">
                That friend you met in Barcelona?
              </span>
              <span className="block text-[2rem] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-semibold text-white mt-1 md:mt-1.5">
                She just landed in your city.
              </span>
            </h2>

            <p className="mt-8 md:mt-10 max-w-2xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.7] text-white/70 font-normal">
              Most apps connect you with strangers. Nearby Traveler connects you with the people you&rsquo;ve already met &mdash; notifying you when someone you crossed paths with on a trip is nearby again. A coffee in Paris becomes dinner in New York. A hiking buddy in Bali reconnects with you in Berlin. One-time encounters turn into lifelong friendships &mdash; no matter where life takes any of you next.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </section>

        {/* Why Nearby Traveler — harmonized: editorial typography, subtle bordered cards */}
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-7" style={{ textWrap: 'balance' }}>
                Why Nearby Traveler
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 leading-relaxed max-w-2xl mx-auto">
                Whether you&rsquo;re exploring your own city or a new one, Nearby Traveler is built for how connection actually happens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Reconnect When Paths Cross Again</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  The only app that notifies you when a friend you met in one city lands in your next destination.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Share Meals with Travelers & Locals</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Plan meetups before your trip. Meet people over dinner, coffee, or a drink &mdash; turn a one-time connection into a real friendship.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Discover Local Gems, Not Tourist Traps</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Hidden spots shared by locals who actually live in the neighborhood.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Build Your Local Community</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Host events, welcome travelers, and find your people &mdash; without leaving home.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Vouched Connections & Verified Profiles</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Members can vouch for people they&rsquo;ve actually met. Optional verification adds a layer of trust.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Build a Global Network of Friends</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Grow a worldwide circle of people who share your interests &mdash; friendships that span cities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — harmonized: dark editorial, "Step 01" labels, transparent cards */}
        <section id="how-it-works" className="animate-on-scroll relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0b1020] overflow-hidden">
          <div className="relative max-w-6xl mx-auto">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-center text-white leading-[1.08] tracking-[-0.015em] mb-14 md:mb-20" style={{ textWrap: 'balance' }}>
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 01
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">Set Up Your Profile & Travel Plans</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Sign up as a local or traveler. Add your interests and activities. Planning a trip? Set your destination and dates&mdash;our AI matches you with locals and travelers there.
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 02
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">Discover, Message & Meet Up</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Browse AI-matched people in your city or destination. Message them directly. Go Available Now. Join community events. RSVP to local gatherings.
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 03
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">Stay Connected Worldwide</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Friends you&rsquo;ve made on the road pass through your city &mdash; and vice versa. Nearby Traveler keeps those connections alive over years, not just trips.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </section>

        {/* Community in Action — harmonized: simplified event cards, no gradients, minimal elevation */}
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-7" style={{ textWrap: 'balance' }}>
                See our community in action
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed">
                Every week, Nearby Traveler members host real experiences in their own cities &mdash; bonfires, food crawls, hikes, gallery walks. Free or near-free. Open to anyone in the community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              <div className="p-6 sm:p-7 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Beach Bonfire & BBQ</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Sunset gathering with locals &mdash; authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Taco Tuesday</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">$1.50</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Weekly street taco adventure with fellow food lovers at the city&rsquo;s best Mexican spots.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Hollywood Sign Hike</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Saturday morning hikes with locals and travelers &mdash; amazing views, great photos, real LA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Finding your people — mid-page editorial beat */}
        <section className="animate-on-scroll relative bg-[#0b1020] py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.04), transparent 60%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-sans leading-[1.06] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              <span className="block text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[3rem] font-normal text-white/75">
                You&rsquo;re not meeting strangers.
              </span>
              <span className="block text-[2rem] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-semibold text-white mt-1 md:mt-1.5">
                You&rsquo;re finding your people.
              </span>
            </h2>

            <p className="mt-8 md:mt-10 max-w-xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.7] text-white/65 font-normal">
              Call it whatever you want &mdash; travel buddies, locals, your crew. The truth is simpler: the people you were meant to know are already out there. Some live in your city. Some will be there for four days. Nearby Traveler helps you find each other.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </section>

        {/* From the Founder — harmonized: dark editorial, gradient killed, quote-forward */}
        <section className="animate-on-scroll relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0b1020] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,60,0.07), transparent 55%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-6 md:mb-8">
              From the Founder
            </h2>
            <blockquote className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-[2rem] leading-[1.35] text-white font-normal tracking-[-0.01em]" style={{ textWrap: 'balance' }}>
              &ldquo;I hosted 400 travelers in New York over 15 years. They weren&rsquo;t strangers. They were my people &mdash; I just didn&rsquo;t know them yet. Nearby Traveler is how I help other people find theirs.&rdquo;
            </blockquote>
            <p className="mt-8 md:mt-10 text-[0.8125rem] sm:text-sm font-semibold tracking-[0.12em] uppercase text-white/55">
              Aaron Lefkowitz, Founder
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
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
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-gray-900 dark:text-white leading-[1.15] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              For anyone who&rsquo;s ever felt alone in a city full of people.
            </p>
          </div>
        </section>

        {/* Final CTA — two-line editorial */}
        <section className="animate-on-scroll py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-sans leading-[1.05] tracking-tight" style={{ textWrap: 'balance' }}>
              <span className="block text-[2.25rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-normal text-gray-500 dark:text-white/50">
                Meet your people.
              </span>
              <span className="block text-[2.5rem] sm:text-[3.25rem] md:text-6xl lg:text-[4.25rem] font-semibold text-gray-900 dark:text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                Find your people.
              </span>
            </h2>

            <div className="mt-10 md:mt-14 flex justify-center">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-8 py-4 rounded-full text-base font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_10px_36px_-10px_rgba(249,115,22,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_14px_44px_-12px_rgba(249,115,22,0.6)]"
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
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                Verified profiles
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                Community references
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
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