import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";
import LandingHeader, { LandingHeaderSpacer } from "@/components/LandingHeader";
import { useAuth } from "@/App";

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

export default function ConnectorLanding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  useScrollReveal();

  const points: PointItem[] = [
    { title: "Recruit a Friend (Signs Up)", description: "Friend creates account via your link", points: "+50 pts" },
    { title: "Refer a Business Lead", description: "Connect a local business to the platform", points: "+75 pts" },
    { title: "Business Becomes Partner", description: "Business signs up and pays", points: "+200 pts" },
    { title: "Create an Event", description: "Host a community gathering", points: "+5 pts" },
    { title: "Event with 10+ Attendees", description: "Events that attract real participation", points: "+20 pts" },
    { title: "Complete an Available Now — I'm Out", description: "Max 1/day, 3/week", points: "+10 pts" },
    { title: "Complete an Available Now — I'm Free", description: "Max 1/day, 3/week", points: "+5 pts" },
    { title: "Create a Chatroom (5+ members)", description: "Build active community spaces", points: "+15 pts" },
    { title: "Write a Reference", description: "Max 1 per person ever", points: "+10 pts" },
    { title: "Receive a Reference", description: "Max 1 per person ever", points: "+10 pts" },
    { title: "Every 25 Connections", description: "Milestone bonus", points: "+50 pts" },
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
      a: "200 points every 6 months. Fall below that and your status becomes Inactive — points frozen but not deleted. Inactive for 12 months and status is fully revoked.",
    },
    {
      q: "What's the LA connector bonus?",
      a: "Los Angeles connectors participate in an additional 1% local ownership pool on top of the global 4%. LA connectors can earn from both pools based on their points in each.",
    },
    {
      q: "Can I lose my connector status?",
      a: "Yes — inactivity, misconduct, or fraud can result in revocation. Admins can manually reactivate or revoke any connector regardless of activity score.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <LandingHeader />
      <LandingHeaderSpacer />

      {user?.id && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-blue-200/60 dark:border-blue-700/40 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  You're logged in.
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  View your Connector status, points, referral link, and perks inside the app.
                </div>
              </div>
              <Button
                onClick={() => setLocation("/dashboard/connector")}
                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold min-h-[44px]"
              >
                Go to Connector dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1) HERO */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-4 transition-all duration-700 ease-out"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              Connector Program
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              Help Build. <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Share Ownership.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-4">
              Earn Points. Earn a Piece of What We Build Together.
            </p>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              Connectors are the people who grow NearbyTraveler from the ground up — inviting friends, bringing in local businesses, hosting real events in their city. A 4% ownership pool is reserved for the community. No salary. No promises. Just a real stake in something being built.
            </p>

            <div className="mt-6 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/20 p-4">
              <p className="text-sm md:text-base font-semibold text-orange-900 dark:text-orange-200">
                Interested in becoming a Connector? Apply below and our team will review your profile.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => scrollToId("how-to-join")}
                className="bg-orange-500 hover:bg-orange-600 text-white min-h-[44px]"
              >
                How to Get In
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToId("how-it-works")}
                className="border-gray-300 dark:border-gray-700 min-h-[44px]"
              >
                How It Works
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-2 border-gray-200 dark:border-gray-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Global Ownership Pool</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">4%</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 dark:border-gray-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">LA Connector Bonus</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">+1%</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 dark:border-gray-600">
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
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Four steps from action to ownership
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { n: "01", title: "Do Helpful Actions", body: "Invite friends, refer local businesses, host events in your city." },
                { n: "02", title: "Earn Points", body: "Points stack over time based on impact. Every verified action adds to your total." },
                { n: "03", title: "Calculate Your Share", body: "Your share = your total points ÷ all connector points combined." },
                { n: "04", title: "Exit Only", body: "Points have value only upon a qualifying exit — acquisition or IPO. No exit, no value." },
              ].map((s) => (
                <Card key={s.n} className="border-2 border-gray-200 dark:border-gray-600">
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
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              Ownership Pool
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              A real stake in what we're building
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200 dark:border-gray-600">
                <CardContent className="p-6">
                  <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    4%
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Global Connector Ownership Pool
                  </div>

                  <div className="mt-6 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/20 p-4">
                    <div className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      +1% LA Local Pool
                    </div>
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      Los Angeles city connectors share an additional 1% ownership pool on top of the global 4%. LA connectors earn from both pools simultaneously.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <Card className="border-2 border-gray-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base">How Your Share Is Calculated</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                    <p>
                      There are no periodic distributions. If there is ever a qualifying liquidity event (an exit like an acquisition or IPO) and the official terms are met, your ownership share is based on your proportion of total connector points.
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

                <Card className="border-2 border-gray-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base">When Does It Have Value?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    Only upon a qualifying liquidity event — an acquisition, IPO, or sale of NearbyTraveler. If no exit happens, points expire with no value and no payment is owed. This is not a salary, not a promise, and not a guarantee.
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 dark:border-gray-600">
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
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              Earn Points
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
                  <Card key={p.title} className="border-2 border-gray-200 dark:border-gray-600">
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
                <Card className="border-2 border-gray-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base">Staying Active</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p>Earn at least 200 points every 6 months to stay active.</p>
                    <p>Under 200 pts in 6 months → status becomes Inactive (points frozen, not deleted).</p>
                    <p>Inactive for 12 months → status revoked, points no longer count toward equity. You can reapply after 12 months and start fresh.</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-gray-200 dark:border-gray-600">
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
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              How to Join
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Open to anyone who shows up
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              No application. No invite. No waitlist. The connector program is open to every NearbyTraveler user — you just have to earn your way in.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Step 1 — Use the App",
                  body: "Be active on NearbyTraveler. Join events, connect with travelers, message locals, explore your city. Aura points accumulate automatically as you engage.",
                },
                {
                  title: "Step 2 — Apply to the Program",
                  body: "When you feel ready, apply to become a Connector. Our team reviews every application to ensure quality and commitment. No automatic enrollment — we hand-pick our Connectors.",
                },
                {
                  title: "Step 3 — Start Earning Connector Points",
                  body: "From that moment on, your connector actions (referrals, events, business partners) earn you points toward the ownership pool. Aura and connector points are tracked separately.",
                },
              ].map((s) => (
                <Card key={s.title} className="border-2 border-gray-200 dark:border-gray-600">
                  <CardHeader className="pb-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Step</div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                    {s.body}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base">Aura Points — Your Entry Ticket</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                  Aura points are earned through everyday activity on the platform — joining events, connecting with people, being an engaged member. They measure how real and active you are. A strong Aura score shows you're a committed member of the community.
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base">Connector Points — Your Equity Tracker</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                  Connector points are earned through high-impact actions — referrals, bringing in paying businesses, and hosting verified events. These are the points that determine your share of the ownership pool at exit.
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
                  body: "Participation is voluntary. Points are not wages, income, or a salary. Connectors are independent community participants — not employees, contractors, or agents of NearbyTraveler.",
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
                <Card key={c.title} className="border-2 border-gray-200 dark:border-gray-600">
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
                <Card key={f.q} className="border-2 border-gray-200 dark:border-gray-600">
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
                  <li>The Connector Ownership Pool is offered only under the program's official terms and eligibility rules.</li>
                  <li>Points don't guarantee equity and may be adjusted for fraud prevention, verification, and quality standards.</li>
                  <li>Equity details — timing, form, vesting, and eligibility — are defined in the official program documents.</li>
                  <li>This is not a securities offering. Connectors are independent participants, not investors.</li>
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
                  Ready to make a difference?
                </h2>
                <p className="text-white/90 mb-6 max-w-3xl">
                  Stay active, be part of the community, and apply when you're ready. Our team reviews every application personally. The earlier you're in, the more your contributions count.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Button
                    onClick={() => setLocation("/home")}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    Open the App
                  </Button>
                  <div className="text-sm text-white/90 flex items-center gap-2">
                    Questions? connectors@nearbytraveler.org
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
