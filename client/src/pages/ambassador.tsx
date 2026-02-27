import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";
import LandingNavbar from "@/components/landing-navbar";
import {
  ArrowRight,
  Globe,
  Mail,
  MapPin,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { isNativeIOSApp } from "@/lib/nativeApp";

type PointItem = {
  title: string;
  description: string;
  points: string;
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.remove("opacity-0", "translate-y-4");
          target.classList.add("opacity-100", "translate-y-0");
          observer.unobserve(target);
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function AmbassadorLanding() {
  const [, setLocation] = useLocation();
  useScrollReveal();

  const hasAnyAuthEvidence =
    typeof window !== "undefined" &&
    (!!localStorage.getItem("user") ||
      !!localStorage.getItem("travelconnect_user") ||
      !!localStorage.getItem("auth_token"));

  const points: PointItem[] = [
    { title: "Refer a Friend (Signs Up)", description: "Friend creates account via your link", points: "+50 pts" },
    { title: "Refer a Friend (Active)", description: "Friend joins an event or messages", points: "+100 pts" },
    { title: "Refer a Business Lead", description: "Connect a local business to the platform", points: "+75 pts" },
    { title: "Business Becomes Partner", description: "Business signs up and pays", points: "+200 pts" },
    { title: "Create an Event", description: "Host a community gathering", points: "+20 pts" },
    { title: "Host Verified Event", description: "Event runs with verified attendance", points: "+50 pts" },
    { title: "Event Hits Attendance Goal", description: "Grow participation to target", points: "+30 pts" },
    { title: "Community Quality Bonus", description: "Great feedback, low cancellations", points: "+25 pts" },
  ];

  const faqs = [
    {
      q: "Is this paid work?",
      a: "No. This is not a job and points are not income. There is no salary, no hourly rate, and no guaranteed compensation of any kind.",
    },
    {
      q: "Can points be converted to cash?",
      a: "No. Points exist solely to track your contribution to the community. They may never be worth anything.",
    },
    {
      q: "When could points actually matter?",
      a: "Only if NearbyTraveler is acquired or goes public — and only under the official program terms. If no exit occurs, points have no value.",
    },
    {
      q: "What's the minimum to stay active?",
      a: "50 points every 6 months. Fall below that and your status becomes Inactive — points frozen but not deleted. Inactive for 12 months and status is fully revoked.",
    },
    {
      q: "What's the LA ambassador bonus?",
      a: "Los Angeles ambassadors participate in an additional 1% local ownership pool on top of the global 4%. LA ambassadors can earn from both pools based on their points in each.",
    },
    {
      q: "Can I lose my ambassador status?",
      a: "Yes — inactivity, misconduct, or fraud can result in revocation. Admins can manually reactivate or revoke any ambassador regardless of activity score.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {!isNativeIOSApp() && !hasAnyAuthEvidence && (
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LandingNavbar />
          </div>
        </header>
      )}

      {/* 1) HERO */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Trophy className="w-4 h-4" />
              Ambassador Program
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              Help Build. <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Share Ownership.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-4">
              Earn Points. Earn a Piece of What We Build Together.
            </p>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              Ambassadors are the people who grow NearbyTraveler from the ground up — inviting friends, bringing in local businesses, hosting real events in their city. A 4% ownership pool is reserved for the community. No salary. No promises. Just a real stake in something being built.
            </p>

            <div className="mt-6 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/20 p-4">
              <p className="text-sm md:text-base font-semibold text-orange-900 dark:text-orange-200">
                Reach 250 Aura Points on NearbyTraveler and you're automatically enrolled — no application needed.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => scrollToId("how-to-join")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                How to Get In <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToId("how-it-works")}
                className="border-gray-300 dark:border-gray-700"
              >
                How It Works
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Global Ownership Pool</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">4%</div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">LA Ambassador Bonus</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">+1%</div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Exit Only</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Acquisition or IPO</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 2) HOW IT WORKS */}
      <section id="how-it-works" className="py-14 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              <Sparkles className="w-4 h-4" /> How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Four steps from action to ownership
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { n: "01", title: "Do Helpful Actions", body: "Invite friends, refer local businesses, host events in your city." },
                { n: "02", title: "Earn Points", body: "Points stack over time based on impact. Every verified action adds to your total." },
                { n: "03", title: "Calculate Your Share", body: "Your share = your total points ÷ all ambassador points combined." },
                { n: "04", title: "Exit Only", body: "Points have value only upon a qualifying exit — acquisition or IPO. No exit, no value." },
              ].map((s) => (
                <Card key={s.n} className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Step {s.n}</div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    {s.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3) OWNERSHIP POOL */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              <Star className="w-4 h-4" /> Ownership Pool
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              A real stake in what we're building
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    4%
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Global Ambassador Ownership Pool
                  </div>

                  <div className="mt-6 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/20 p-4">
                    <div className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      +1% LA Local Pool
                    </div>
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      Los Angeles city ambassadors share an additional 1% ownership pool on top of the global 4%. LA ambassadors earn from both pools simultaneously.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">How Your Share Is Calculated</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                    <p>
                      At each distribution period we total all ambassador points. Your ownership share comes from your proportion of the total.
                    </p>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs">
                      <div>Your Share = Your Points ÷ Total Points</div>
                      <div>Your Equity = Your Share × 4% Pool</div>
                      <div className="mt-2 font-sans text-gray-600 dark:text-gray-300">
                        Example: 1,000 pts of 100,000 total = 1% of points → 0.04% equity
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">When Does It Have Value?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    Only upon a qualifying liquidity event — an acquisition, IPO, or sale of NearbyTraveler. If no exit happens, points expire with no value and no payment is owed. This is not a salary, not a promise, and not a guarantee.
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">The Long Game</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    The bigger NearbyTraveler grows, the more a future exit could be worth. The more you contribute now — at the beginning — the larger your share of that moment will be.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4) EARN POINTS */}
      <section className="py-14 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              <Trophy className="w-4 h-4" /> Earn Points
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Every action adds up
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Points accumulate over time and never reset. The more you contribute, the larger your share grows.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {points.map((p) => (
                  <Card key={p.title} className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {p.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {p.description}
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 whitespace-nowrap">
                          {p.points}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">Staying Active</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p>Earn at least 50 points every 6 months to stay active.</p>
                    <p>Under 50 pts in 6 months → status becomes Inactive (points frozen, not deleted).</p>
                    <p>Inactive for 12 months → status revoked, points no longer count toward equity. You can reapply after 12 months and start fresh.</p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">Points Are Verified</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    Some actions require proof (event hosted, business activated). Points removed for fake accounts, spam, or low-quality activity. Some actions may have caps to prevent gaming.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5) HOW TO JOIN */}
      <section id="how-to-join" className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              <Users className="w-4 h-4" /> How to Join
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Open to anyone who shows up
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              No application. No invite. No waitlist. The ambassador program is open to every NearbyTraveler user — you just have to earn your way in.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Step 1 — Use the App",
                  body: "Be active on NearbyTraveler. Join events, connect with travelers, message locals, explore your city. Aura points accumulate automatically as you engage.",
                  icon: <MapPin className="w-4 h-4" />,
                },
                {
                  title: "Step 2 — Hit 250 Aura Points",
                  body: "Once your Aura score reaches 250, you're automatically enrolled in the Ambassador Program. No form to fill out. No email to send. It just happens.",
                  icon: <Trophy className="w-4 h-4" />,
                },
                {
                  title: "Step 3 — Start Earning Ambassador Points",
                  body: "From that moment on, your ambassador actions (referrals, events, business partners) earn you points toward the ownership pool. Aura and ambassador points are tracked separately.",
                  icon: <Star className="w-4 h-4" />,
                },
              ].map((s) => (
                <Card key={s.title} className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {s.icon} Step
                    </div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    {s.body}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base">Aura Points — Your Entry Ticket</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                  Aura points are earned through everyday activity on the platform — joining events, connecting with people, being an engaged member. They measure how real and active you are. Hit 250 and the door opens automatically.
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base">Ambassador Points — Your Equity Tracker</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                  Ambassador points are earned through high-impact actions — referring friends who become active, bringing in paying businesses, hosting verified events. These are the points that determine your share of the ownership pool at exit.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 6) WHAT TO KNOW */}
      <section className="py-14 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What to know
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "This Is Not a Job",
                  body: "Participation is voluntary. Points are not wages, income, or a salary. Ambassadors are independent community participants — not employees, contractors, or agents of NearbyTraveler.",
                },
                {
                  title: "Points Are Not Cash",
                  body: "Points cannot be converted to cash at any time. They track your contribution to the community. They may never be worth anything — value only exists if a qualifying exit event occurs.",
                },
                {
                  title: "Program Can Change",
                  body: "NearbyTraveler may change, pause, or end the program at any time to prevent fraud or maintain fairness. Equity details — timing, form, vesting, eligibility — are defined in official program documents.",
                },
              ].map((c) => (
                <Card key={c.title} className="border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    {c.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7) FAQ */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              FAQ
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <Card key={f.q} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1 font-semibold text-gray-900 dark:text-white">
                      {f.q}
                    </div>
                    <div className="md:col-span-2 text-sm text-gray-600 dark:text-gray-300">
                      {f.a}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8) IMPORTANT NOTICE */}
      <section className="py-14 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <Card className="border border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="text-xl">Read before you apply</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 dark:text-gray-200">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Points are not money, wages, or guaranteed rewards of any kind.</li>
                  <li>Points may have no value now or ever.</li>
                  <li>Any potential payout or value is only upon a liquidity event (acquisition or IPO) and only if the official program terms are met.</li>
                  <li>NearbyTraveler may change, pause, or end the program at any time to prevent fraud or maintain fairness.</li>
                  <li>The Ambassador Ownership Pool is offered only under the program's official terms and eligibility rules.</li>
                  <li>Points don't guarantee equity and may be adjusted for fraud prevention, verification, and quality standards.</li>
                  <li>Equity details — timing, form, vesting, and eligibility — are defined in the official program documents.</li>
                  <li>This is not a securities offering. Ambassadors are independent participants, not investors.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 9) CTA */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardContent className="p-8 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  250 aura points. That's all it takes.
                </h2>
                <p className="text-white/90 mb-6 max-w-3xl">
                  Stay active, be part of the community, and the ambassador program unlocks automatically. The earlier you're in, the more your contributions count.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Button
                    onClick={() => setLocation("/home")}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Open the App <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="text-sm text-white/90 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Questions? ambassadors@nearbytraveler.com
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

