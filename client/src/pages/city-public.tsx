import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Calendar, Lock } from "lucide-react";
import { getApiBaseUrl } from "@/lib/queryClient";
import BackButton from "@/components/back-button";

interface CityPublicProps {
  cityName: string;
}

export default function CityPublic({ cityName }: CityPublicProps) {
  const [, navigate] = useLocation();
  const decodedCity = decodeURIComponent(cityName);

  // Set page title + meta for SEO
  useEffect(() => {
    document.title = `Meet travelers & locals in ${decodedCity} — Nearby Traveler`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Connect with travelers and locals in ${decodedCity} through shared interests, events and meetups on Nearby Traveler.`);
    }
    return () => { document.title = "Nearby Traveler"; };
  }, [decodedCity]);

  // City stats — public, no auth
  const { data: cityStats } = useQuery<any>({
    queryKey: ["/api/city-stats", decodedCity],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/city-stats/${encodeURIComponent(decodedCity)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Upcoming events — public, no auth
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events", decodedCity, "public"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/events?city=${encodeURIComponent(decodedCity)}&limit=3`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 3) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const localCount = cityStats?.localCount || 0;
  const travelerCount = cityStats?.travelerCount || 0;
  const totalPeople = localCount + travelerCount;
  const eventCount = cityStats?.eventCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">City Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            Meet travelers &amp; locals in {decodedCity}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto">
            Connect with travelers and locals in {decodedCity} through shared interests, events and meetups.
          </p>
          {totalPeople > 0 && (
            <div className="mt-6 flex items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{totalPeople}</span>
                <span className="text-sm">people</span>
              </div>
              {eventCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{eventCount}</span>
                  <span className="text-sm">events</span>
                </div>
              )}
            </div>
          )}
          <div className="mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/join")}
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold text-lg px-8 py-3 rounded-full shadow-lg"
            >
              Join free to connect in {decodedCity}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Stats summary */}
        {totalPeople > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{localCount}</div>
                <div className="text-sm text-gray-500">Locals</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{travelerCount}</div>
                <div className="text-sm text-gray-500">Travelers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{cityStats?.businessCount || 0}</div>
                <div className="text-sm text-gray-500">Businesses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{eventCount}</div>
                <div className="text-sm text-gray-500">Events</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upcoming events in {decodedCity}</h2>
            <div className="space-y-3">
              {events.map((event: any) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                    {event.eventDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        {event.eventTime && ` at ${event.eventTime}`}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Blurred user cards teaser */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {totalPeople > 0 ? `${totalPeople} travelers and locals in ${decodedCity}` : `People in ${decodedCity}`}
          </h2>
          <div className="relative">
            {/* Fake blurred cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 filter blur-sm select-none pointer-events-none" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 h-40">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-1" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
            {/* Overlay CTA */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-xl">
              <div className="text-center px-4">
                <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">Sign up free to see who's here</p>
                <Button onClick={() => navigate("/join")} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6">
                  Join Nearby Traveler
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Ready to explore {decodedCity}?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Join thousands of travelers and locals connecting through shared interests, events and meetups.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/join")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg"
          >
            Join free to connect in {decodedCity}
          </Button>
        </div>
      </div>
    </div>
  );
}
