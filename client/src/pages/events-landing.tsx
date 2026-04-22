import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import Footer from "@/components/footer";
import { trackEvent } from "@/lib/analytics";
import karaokeImage from "@assets/image_1756447354157.png";
import bikeImage from "@assets/image_1756447442403.png";
import artWalkImage from "@assets/image_1756447587360.png";
import movieImage from "@assets/image_1756447721644.png";
import eventHeaderImage from "@assets/event-photo.png";

export default function EventsLanding() {
  const [, setLocation] = useLocation();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  const handleGetStarted = () => {
    trackEvent('signup_cta_click', 'events_landing', 'main_cta');
    setLocation('/join');
  };

  // Show the floating CTA when the hero section leaves the viewport.
  useEffect(() => {
    const target = heroRef.current;
    console.log('[CTA events] heroRef on mount:', target);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCTA(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Unified tag pill class — same muted treatment on every pill
  const tagClass = "text-[0.65rem] sm:text-xs uppercase tracking-[0.12em] font-semibold px-2 py-0.5 rounded-full border border-gray-300 dark:border-white/15 text-gray-600 dark:text-white/60";

  return (
    <div className="w-full min-h-screen flex flex-col bg-white dark:bg-gray-900 font-sans overflow-x-hidden">
      <Helmet>
        <title>Nearby Traveler &mdash; Events</title>
        <meta name="description" content="Events are where people become your people. Weekly bonfires, taco crawls, hikes, and gallery walks hosted by locals, open to anyone. Free or near-free." />
        <link rel="canonical" href="https://nearbytraveler.org/events-landing" />
        <meta property="og:title" content="Events are where people become your people." />
        <meta property="og:description" content="Real plans, hosted by locals, open to travelers. Bonfires, hikes, food crawls — the events that turn strangers into your people." />
        <meta property="og:url" content="https://nearbytraveler.org/events-landing" />
        <meta property="og:image" content="https://nearbytraveler.org/og-image.png" />
        <meta name="twitter:title" content="Events are where people become your people." />
        <meta name="twitter:description" content="Real plans, hosted by locals, open to travelers. Bonfires, hikes, food crawls — the events that turn strangers into your people." />
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
            trackEvent('signup_cta_click', 'events_landing', 'floating_join_now');
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

        {/* HERO SECTION — full-bleed bonfire image, editorial overlay */}
        <section ref={heroRef} className="relative w-full overflow-hidden bg-[#0b1020] min-h-[80vh] md:min-h-[88vh] lg:min-h-[92vh] flex items-center">
          {/* Full-bleed background image */}
          <img
            src={eventHeaderImage}
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            loading="eager"
          />

          {/* Layered overlay */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#05070f]/30 via-[#070a14]/22 to-[#05070f]/40 pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#05070f]/25 via-[#05070f]/5 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 38% at 50% 50%, rgba(0,0,0,0.25), transparent 70%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 110%, rgba(255,140,60,0.14), transparent 55%)' }}></div>
          <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 82% 8%, rgba(255,180,110,0.08), transparent 50%)' }}></div>

          {/* Editorial eyebrow */}
          <div className="absolute top-6 left-4 sm:left-8 md:top-8 md:left-20 lg:left-24 z-20 hidden sm:flex items-center gap-3 text-sm md:text-base font-semibold tracking-[0.22em] uppercase text-white">
            <span className="w-8 h-[1px] bg-white/80"></span>
            <span>Nearby Traveler &middot; Events</span>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-28">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-sans leading-[1.04] tracking-tight" style={{ textWrap: 'balance' }}>
                <span className="block text-[2.125rem] sm:text-[2.75rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-normal text-white/75">
                  Events are where people
                </span>
                <span className="block text-[2.375rem] sm:text-[3rem] md:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-semibold text-white tracking-[-0.02em] mt-1 md:mt-1.5">
                  become your people
                </span>
              </h1>

              <p className="mt-7 md:mt-10 max-w-2xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.6] text-white/90 font-normal">
                Weekly bonfires, taco crawls, hikes, gallery walks. Hosted by locals, joined by travelers. This is how real friendships actually start.
              </p>

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
                    trackEvent('learn_more_click', 'events_landing', 'see_upcoming_events');
                    document.querySelector('#event-showcase')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group inline-flex items-center justify-center gap-2 text-[0.9375rem] font-medium text-white/75 hover:text-white px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors duration-300"
                  data-testid="button-see-upcoming-events"
                >
                  See upcoming events
                  <span aria-hidden="true" className="inline-block text-white/40 group-hover:text-white/85 transition-all duration-300 group-hover:translate-x-0.5">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none"></div>
        </section>

        {/* Why people show up to these — light features grid, 4 cards */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
                Why people show up to these
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Real plans, not invitations to nothing</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Bonfires that actually happen. Taco crawls with real meeting times. Hikes you can show up to Saturday morning. Events that turn into people you want to see again.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Hosted by locals, open to anyone</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Every event is hosted by someone in the community &mdash; a local who knows the spot, the timing, the vibe. Travelers welcome. Strangers turn into your people.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Free or near-free</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  No event tickets, no cover charges, no paid memberships. Most events are free. The ones that aren&rsquo;t are usually under $10.
                </p>
              </div>

              <div className="p-7 sm:p-8 rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center sm:text-left">Host your own</h3>
                <p className="text-[0.9375rem] sm:text-base text-gray-600 dark:text-white/65 leading-[1.6] text-center sm:text-left">
                  Have a hike you do every Saturday? A coffee shop nobody knows about? A movie night idea? Spin it up as an event in two minutes. Your people will find it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial beat — "The friendship doesn't start..." */}
        <section className="relative bg-[#120a10] py-16 md:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,60,0.09), transparent 55%)' }}></div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 100%, rgba(255,180,110,0.06), transparent 50%)' }}></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-sans leading-[1.06] tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
              <span className="block text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[3rem] font-normal text-white/75">
                The friendship doesn&rsquo;t start
              </span>
              <span className="block text-[2rem] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-semibold text-white mt-1 md:mt-1.5">
                until you actually show up
              </span>
            </h2>

            <p className="mt-8 md:mt-10 max-w-2xl mx-auto text-[0.9375rem] md:text-[1.0625rem] leading-[1.7] text-white/70 font-normal">
              Every long-running friendship started with a Saturday morning hike, a Tuesday taco run, a bonfire that ran late. Nearby Traveler events are how people meet who never would&rsquo;ve otherwise. The plan is the catalyst.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </section>

        {/* Event showcase — 6 cards, photos preserved, restyled chrome */}
        <section id="event-showcase" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-7" style={{ textWrap: 'balance' }}>
                What&rsquo;s actually happening
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed">
                These are real events from the LA community. Same kinds of plans happen in every city Nearby Traveler is live in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">

              {/* Venice Beach Dance Party */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src="/venice-beach-dance-party.png"
                    alt="Venice Beach dance party event"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Venice Beach Dance Party</h3>
                    <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">Sunset dancing on the famous boardwalk</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Beach</span>
                    <span className={tagClass}>Dancing</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Join locals dancing to live music at Venice Beach boardwalk. Experience the authentic LA beach culture with sunset vibes and great people.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Authentic Food Adventure */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src="/authentic-food-adventure.png"
                    alt="Local food experience event"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Authentic Food Adventure</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">Discover your local&rsquo;s favorite eats</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Food</span>
                    <span className={tagClass}>Local Spots</span>
                    <span className={tagClass}>Social</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Join locals as they plan meals at awesome hidden food spots &mdash; $1 tacos, Korean BBQ, Ethiopian, and the best burgers in town.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Marina Movie Nights */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={movieImage}
                    alt="Marina del Rey outdoor movie night at Burton Chace Park"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Marina Movie Nights</h3>
                    <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">Saturday &middot; 8:00 PM &middot; Burton Chace Park</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Movies</span>
                    <span className={tagClass}>Outdoor</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Free outdoor movie screenings at Burton Chace Park in Marina del Rey. Bring a blanket, pack a picnic, and enjoy movies under the stars with locals and travelers.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Art Gallery Walk */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={artWalkImage}
                    alt="First Friday Art Walk in colorful arts district with people walking"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Art Gallery Walk</h3>
                    <span className="shrink-0 bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold tracking-tight">Free</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">First Friday &middot; Arts District</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Culture</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Monthly gallery walk through the Arts District. Meet artists, see local work, and discuss creativity with fellow art lovers and travelers.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Karaoke Night */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={karaokeImage}
                    alt="Person singing karaoke with silhouette against stage lights"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">Karaoke Night</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">Wednesday &middot; 8:00 PM</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Fun</span>
                    <span className={tagClass}>Music</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Weekly karaoke night where locals and travelers sing, laugh, and bond over terrible singing voices. No talent required &mdash; just bring the energy.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* City Bike Tour */}
              <div className="group flex flex-col rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.02] overflow-hidden hover:border-gray-300 dark:hover:border-white/30 transition-colors text-center sm:text-left">
                <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={bikeImage}
                    alt="Group of cyclists with bikes under palm trees in beach setting"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight text-center sm:text-left">City Bike Tour</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mb-4 text-center sm:text-left">Saturday &middot; 10:00 AM</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={tagClass}>Active</span>
                    <span className={tagClass}>Sightseeing</span>
                  </div>

                  <p className="text-[0.9375rem] text-gray-600 dark:text-white/65 leading-[1.6] flex-grow mb-5 text-center sm:text-left">
                    Explore the city&rsquo;s best neighborhoods on two wheels. Local guides show hidden spots, street art, and authentic culture you&rsquo;d never find on your own.
                  </p>

                  <button
                    type="button"
                    onClick={() => setLocation('/join')}
                    className="group/btn inline-flex items-center gap-1.5 self-start text-[0.9375rem] font-semibold tracking-tight text-gray-700 hover:text-orange-500 dark:text-white/80 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors"
                  >
                    Join event
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">&rarr;</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Final CTA — light, single orange CTA + ghost create-event link */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 dark:text-white leading-[1.08] tracking-[-0.015em] mb-5 md:mb-6" style={{ textWrap: 'balance' }}>
              Find your next plan
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/70 mb-10 md:mb-12 max-w-xl mx-auto leading-relaxed">
              Or host one. Either way, this is how it starts.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => {
                  trackEvent('signup_cta_click', 'events_landing', 'final_cta');
                  setLocation('/join');
                }}
                className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-8 py-4 rounded-full text-base font-semibold tracking-tight transition-all duration-300 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_10px_36px_-10px_rgba(249,115,22,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_14px_44px_-12px_rgba(249,115,22,0.6)]"
                data-testid="button-final-cta"
              >
                Meet Your People
                <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  trackEvent('create_event_click', 'events_landing', 'final_cta');
                  setLocation('/join');
                }}
                className="group inline-flex items-center justify-center gap-2 text-[0.9375rem] font-medium text-gray-700 hover:text-orange-500 dark:text-white/75 dark:hover:text-orange-400 px-1.5 py-3 sm:py-2 min-h-[44px] sm:min-h-0 transition-colors duration-300"
                data-testid="button-create-event"
              >
                Or create an event
                <span aria-hidden="true" className="inline-block text-gray-400 group-hover:text-orange-500 dark:text-white/40 dark:group-hover:text-orange-400 transition-all duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </button>
            </div>

            <p className="mt-10 text-sm sm:text-base text-gray-500 dark:text-white/55">
              Free to join &middot; Free to host &middot; Free to attend most events
            </p>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
