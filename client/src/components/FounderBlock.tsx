import React from "react";

/**
 * FounderBlock component
 * - Drop into your React + Tailwind site
 * - Supports 3 tones ("professional" | "emotional" | "bold"),
 *   2 visual styles ("photo" | "signature"), and light/dark modes.
 * - Minimal markup, strong hierarchy, accessible.
 *
 * Usage example:
 * <FounderBlock
 *   tone="emotional"
 *   styleVariant="photo"
 *   name="Aaron Lefkowitz"
 *   title="Founder, Nearby Traveler"
 *   photoUrl="/images/aaron.jpg" // optional if using signature
 *   signatureUrl="/images/aaron-signature.png" // optional if using photo
 * />
 */

const COPY = {
  professional:
    "After hosting over 400 travelers from 50 countries, I discovered that the best part of travel isn't the tours or the hotels — it's the people. Too often, those connections are left to chance. I built Nearby Traveler so travelers and locals alike can create meaningful connections before the trip begins.",
  emotional:
    "For 15 years I opened my home to travelers from all over the world. I learned that what makes travel unforgettable isn't the sights — it's the people you share them with. Too often, we leave those connections up to luck. I created Nearby Traveler so no one has to explore — or live in their own city — feeling disconnected.",
  bold:
    "Travel has always been about people, yet it's the one part of the journey left to chance. After hosting 400+ travelers from 50 countries, I built Nearby Traveler to change that. This is the community I always wished existed — where locals and travelers connect before the trip even begins.",
};

type Props = {
  tone?: "professional" | "emotional" | "bold";
  styleVariant?: "photo" | "signature";
  name?: string;
  title?: string;
  photoUrl?: string;
  signatureUrl?: string;
  className?: string;
};

export default function FounderBlock({
  tone = "emotional",
  styleVariant = "photo",
  name = "Aaron Lefkowitz",
  title = "Founder, Nearby Traveler",
  photoUrl,
  signatureUrl,
  className = "",
}: Props) {
  const text = COPY[tone];

  return (
    <section className={`relative isolate mx-auto w-full max-w-5xl px-4 md:px-6 ${className}`}>
      {/* subtle background accent */}
      <div className="absolute inset-x-6 -inset-y-2 -z-10 rounded-3xl bg-gradient-to-b from-orange-50/70 to-blue-50/70 dark:from-orange-500/5 dark:to-blue-500/5" />

      <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
        <div className="grid items-center gap-6 md:grid-cols-[auto,1fr]">
          {/* Visual side */}
          <div className="mx-auto flex w-full max-w-[140px] flex-col items-center md:mx-0 md:max-w-[180px]">
            {styleVariant === "photo" && photoUrl ? (
              <img
                src={photoUrl}
                alt={`${name} headshot`}
                className="aspect-square w-full rounded-full object-cover shadow-lg ring-2 ring-white dark:ring-zinc-800"
              />
            ) : styleVariant === "signature" && signatureUrl ? (
              <img
                src={signatureUrl}
                alt={`${name} signature`}
                className="w-48 md:w-56"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-blue-500 text-3xl font-semibold text-white shadow-lg">
                {/* Photo placeholder - no initials until signature provided */}
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">{name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-4">
            <h3 className="inline-block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
              From the Founder
            </h3>

            <blockquote className="text-balance text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 md:text-xl">
              "{text}"
            </blockquote>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-blue-600" />
              <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                Here's to connections that last beyond the trip.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}