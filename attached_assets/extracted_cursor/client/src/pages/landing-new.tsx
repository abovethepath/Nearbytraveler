import React from "react";
import { Link } from "wouter";
import LandingNavbar from "@/components/landing-navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";

// Images from attached_assets via @assets alias
import heroImage from "@assets/businessheader2_1752350709493.png";
import eventBBQ from "@assets/event page bbq party_1753299541268.png";
import eventBeachNight from "@assets/friends at the beach night_1749679112617.webp";
import eventTripPlanning from "@assets/trip planning_1750857535371.webp";
import eventCoffee from "@assets/travelers coffee_1750995178947.png";

export default function LandingNew() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Top orange banner */}
      <div className="w-full bg-orange-500 text-black text-center text-sm sm:text-base font-bold py-2">
        <div className="max-w-6xl mx-auto px-3">
          Connect with Locals and Travelers TODAY —
          <Link href="/join">
            <span className="ml-2 underline nearby-traveler-btn-text-v2 gentle-pulse cursor-pointer">Sign up now!</span>
          </Link>
        </div>
      </div>

      <LandingNavbar />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[48vh] sm:h-[60vh] overflow-hidden">
          <img src={heroImage} alt="Nearby Traveler" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 animate-fade-in-up">
              <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
                Change how you travel
              </h1>
              <p className="text-base sm:text-xl max-w-2xl mx-auto mb-6">
                Meet authentic locals and fellow travelers based on interests, activities, and events.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/join">
                  <Button className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-6 sm:py-4 rounded-xl enter-traveler-black-text animate-zoom-in">
                    Join Nearby Traveler Now
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold px-6 py-6 sm:py-4 rounded-xl">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page orange banner */}
      <div className="w-full bg-orange-500 text-black text-center text-sm sm:text-base font-bold py-2">
        <div className="max-w-6xl mx-auto px-3">
          Connect with Locals and Travelers TODAY —
          <Link href="/join">
            <span className="ml-2 underline nearby-traveler-btn-text-v2 gentle-pulse cursor-pointer">Sign up now!</span>
          </Link>
        </div>
      </div>

      {/* Feature blurb */}
      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Meet. Plan. Connect.
          </h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Your interests power everything: matching, meetups, and local experiences.
          </p>
        </div>
      </section>

      {/* Events grid (exactly 4) */}
      <section className="px-4 pb-14">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Popular right now</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[ 
              { img: eventBBQ, title: 'Beach BBQ Party', city: 'Los Angeles' },
              { img: eventBeachNight, title: 'Night Beach Hangout', city: 'Miami' },
              { img: eventTripPlanning, title: 'Group Trip Planning', city: 'Barcelona' },
              { img: eventCoffee, title: 'Travelers Coffee Meetup', city: 'New York' },
            ].map((ev, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 card-hover">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={ev.img} alt={ev.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{ev.city}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{ev.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-r from-blue-600 to-orange-600 text-white py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold">Ready to connect today?</div>
          <Link href="/join">
            <Button className="bg-white text-black hover:bg-gray-100 font-bold rounded-lg nearby-traveler-btn-text-v2 gentle-pulse">
              Join Now
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}


