import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { trackEvent } from "@/lib/analytics";

const travelersHeaderImage = "/travlersonastreet.jpg";

export default function TravelersLanding() {
  const [, setLocation] = useLocation();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  const handleGetStarted = () => {
    trackEvent('signup_cta_click', 'travelers_landing', 'main_cta');
    setLocation('/join');
  };

  // Show the floating CTA after the user scrolls past the hero
  useEffect(() => {
    const onScroll = () => {
      setShowFloatingCTA(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 font-sans">
      <Helmet>
        <title>Nearby Traveler &mdash; For Travelers</title>
        <meta name="description" content="Don't travel alone. Travel doesn't change you — the people you meet do. Nearby Traveler connects travelers with locals and other travelers in every destination." />
        <link rel="canonical" href="https://nearbytraveler.org/travelers-landing" />
        <meta property="og:title" content="Don't travel alone. Travel like you live there." />
        <meta property="og:description" content="Meet locals who actually live in your destination, and other travelers who just landed. Plan it before you land, keep the friendships after you leave." />
        <meta property="og:url" content="https://nearbytraveler.org/travelers-landing" />
        <meta property="og:image" content="https://nearbytraveler.org/og-image.png" />
        <meta name="twitter:title" content="Don't travel alone. Travel like you live there." />
        <meta name="twitter:description" content="Meet locals who actually live in your destination, and other travelers who just landed. Plan it before you land, keep the friendships after you leave." />
      </Helmet>

      {/* Floating CTA — scroll-gated orange pill, matches main landing */}
      <div
        className={`fixed right-4 sm:right-6 z-50 transition-opacity duration-300 ${showFloatingCTA ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        aria-hidden={!showFloatingCTA}
      >
        <button
          type="button"
          onClick={() => {
            trackEvent('signup_cta_click', 'travelers_landing', 'floating_join_now');
            setLocation('/join');
          }}
          className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-5 py-3 rounded-full text-sm font-semibold tracking-tight transition-all duration-300 shadow-[0_10px_36px_-10px_rgba(249,115,22,0.55)]"
          data-testid="button-floating-join-now"
        >
          Join now
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <LandingHeader />
      <LandingHeaderSpacer />

      <div className="w-full">

        {/* HERO SECTION — full-bleed travelers image with editorial overlay */}
        <section className="relative w-full overflow-hidden bg-[#0b1020] min-h-[80vh] md:min-h-[88vh] lg:min-h-[92vh] flex items-center">
          {/* Full-bleed background image — atmospheric only */}
          <img
            src={travelersHeaderImage}
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            loading="eager"
          />

          {/* Layered overlay — dark gradients + warm amber radials + text-band wash */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#05070f]/60 via-[#070a14]/45 to-[#05070f]/78 pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#05070f]/55 via-[#05070f]/10 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(0,0,0,0.42), transparent 72%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 110%, rgba(255,140,60,0.14), transparent 55%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 82% 8%, rgba(255,180,110,0.08), transparent 50%)' }}></div>

          {/* Editorial eyebrow — top-left meta */}
          <div className="absolute top-6 left-4 sm:left-8 md:top-8 md:left-20 lg:left-24 z-20 hidden sm:flex items-center gap-3 text-sm md:text-base font-semibold tracking-[0.22em] uppercase text-white">
            <span className="w-8 h-[1px] bg-white/80"></span>
            <span>Nearby Traveler &middot; For Travelers</span>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-28">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-sans leading-[1.04] tracking-tight" style={{ textWrap: 'balance' }}>
                <span className="block text-[2.125rem] sm:text-[2.75rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-normal text-white/75">
                  Don&rsquo;t travel alone
                </span>
                <span className="block text-[2.375rem] sm:text-[3rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-semibold text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                  Travel like you live there
                </span>
              </h1>

              <p className="mt-7 md:mt-10 max-w-2xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.6] text-white/90 font-normal">
                Nearby Traveler connects you with the locals who actually live in your destination, and the other travelers who just landed. Coffee meetups, food tours, rooftop nights &mdash; the moments that turn a trip into a story.
              </p>

              {/* Secondary editorial beat — brand thesis, smaller than headline but more present than subhead */}
              <div className="mt-8 md:mt-10 leading-[1.2]" style={{ textWrap: 'balance' }}>
                <p className="text-lg sm:text-xl md:text-2xl font-normal text-white/55">
                  Travel doesn&rsquo;t change you
                </p>
                <p className="text-xl sm:text-2xl md:text-[1.75rem] font-semibold text-white mt-0.5">
                  The people you meet do
                </p>
              </div>

              <div className="mt-9 md:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-7 py-3.5 rounded-full text-[0.9375rem] font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_10px_36px_-10px_rgba(249,115,22,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_14px_44px_-12px_rgba(249,115,22,0.6)]"
                  data-testid="button-main-cta"
                >
                  Meet Your People
                  <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    trackEvent('learn_more_click', 'travelers_landing', 'see_how_it_works');
                    document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group inline-flex items-center justify-center gap-2 text-[0.9375rem] font-medium text-white/75 hover:text-white px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors duration-300"
                  data-testid="button-learn-more"
                >
                  See how it works
                  <span aria-hidden="true" className="inline-block text-white/40 group-hover:text-white/85 transition-all duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"></div>
        </section>

        {/* Why travelers find their people through Nearby Traveler — light, 4 cards */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
                Why travelers find their people through Nearby Traveler
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              <div className="p-7 sm:p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">Locals who actually live there</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Not tour guides, not hosts pretending to be locals. Real people who&rsquo;ll meet you for coffee, take you to the spot only their neighborhood knows, or grab dinner the night you land.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">Other travelers, same city</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Someone else who just landed, same week, same vibe. The friend you make over a rooftop drink in Lisbon you&rsquo;d never have met otherwise.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">Plan it before you land</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Find your people in your destination before the flight. Coffee meetup the morning you arrive, food tour Tuesday night, hike Saturday. Don&rsquo;t show up with nothing.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">Your network grows with every trip</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Every city you visit adds people to your life. Years later, when one of them lands in your city &mdash; or you in theirs &mdash; Nearby Traveler tells you. The trip ends. The friendships don&rsquo;t.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial beat — "Some trips you remember for the place" (dark, warm radial) */}
        <section className="relative bg-[#120a10] py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,60,0.09), transparent 55%)' }}></div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 100%, rgba(255,180,110,0.06), transparent 50%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-sans leading-[1.06] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              <span className="block text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[3rem] font-normal text-white/75">
                Some trips you remember for the place
              </span>
              <span className="block text-[2rem] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-semibold text-white mt-1 md:mt-1.5">
                Most trips you remember for the people
              </span>
            </h2>

            <p className="mt-8 md:mt-10 max-w-2xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.7] text-white/70 font-normal">
              The dinner with the local who took you to her favorite restaurant. The hike with three other travelers you met that morning. The night that turned into a friendship that lasted years. Nearby Traveler is how those moments start.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </section>

        {/* How It Works — dark editorial, Step 01/02/03 labels */}
        <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0b1020] overflow-hidden">
          <div className="relative max-w-6xl mx-auto">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-center text-white leading-[1.08] tracking-[-0.015em] mb-14 md:mb-20" style={{ textWrap: 'balance' }}>
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 01
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">Add your trip</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Where you&rsquo;re going, when you&rsquo;ll be there, what you actually want to do.
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 02
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">See who&rsquo;s there</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Locals who&rsquo;ll meet you for coffee, dinner, or a hike. Other travelers landing the same week. People who actually share your interests.
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-5">
                  Step 03
                </div>
                <h3 className="text-xl sm:text-[1.375rem] font-semibold text-white mb-3 tracking-tight leading-snug">Make plans before you land</h3>
                <p className="text-[0.9375rem] sm:text-base text-white/65 leading-[1.6]">
                  Message ahead. Lock in a meetup, an event, or a meal. Show up with people already waiting to meet you.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </section>

        {/* Community events — light, simplified cards matching main landing */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-7" style={{ textWrap: 'balance' }}>
                See our community in action
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed">
                Every week, Nearby Traveler members host real experiences in their cities. Travelers welcome. Free or near-free. The local friend you&rsquo;d want to know, ready to introduce you to their city.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              <div className="p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Beach Bonfire & BBQ</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Sunset gathering with locals &mdash; authentic LA beach culture, music, and new friends.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Taco Tuesday</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">$1.50</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Weekly street taco adventure with fellow food lovers at the city&rsquo;s best Mexican spots.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Hollywood Sign Hike</h3>
                  <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                </div>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6]">
                  Saturday morning hikes with locals and travelers &mdash; amazing views, great photos, real LA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder — dark editorial, quote-forward, original copy preserved */}
        <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0b1020] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,60,0.07), transparent 55%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-400 mb-6 md:mb-8">
              From the Founder
            </h2>
            <blockquote className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-[2rem] leading-[1.35] text-white font-normal tracking-[-0.01em]" style={{ textWrap: 'balance' }}>
              &ldquo;After hosting 400+ travelers from 50 countries, I learned that one connection can change everything. Travelers spend billions on flights and hotels, yet the most valuable part&mdash;the people you meet&mdash;is left to chance. I built the solution I wished existed.&rdquo;
            </blockquote>
            <p className="mt-8 md:mt-10 text-[0.8125rem] sm:text-sm font-semibold tracking-[0.12em] uppercase text-white/55">
              Aaron Lefkowitz &middot; Founder, Nearby Traveler
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </section>

        {/* Final CTA — light, single orange CTA */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-6" style={{ textWrap: 'balance' }}>
              Don&rsquo;t land alone
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 mb-10 md:mb-12 max-w-xl mx-auto leading-relaxed">
              Find your people before take off
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  trackEvent('signup_cta_click', 'travelers_landing', 'final_cta');
                  setLocation('/join');
                }}
                className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-8 py-4 rounded-full text-base font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_10px_36px_-10px_rgba(249,115,22,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_14px_44px_-12px_rgba(249,115,22,0.6)]"
                data-testid="button-final-cta"
              >
                Meet Your People
                <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </button>
            </div>

            <p className="mt-8 text-sm sm:text-base text-gray-500 dark:text-white/55">
              Free to join &middot; Used in 50+ countries
            </p>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
