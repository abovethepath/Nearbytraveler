import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/App";
import { ArrowLeft, Award, Sparkles, Shield, HelpCircle, AlertTriangle, Star, Users, Calendar, Building2, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function ConnectorInfo() {
  const { user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  const pointActions = [
    { action: "Recruit a friend who signs up", points: "+50 pts", icon: Users, description: "Invite friends to join the community" },
    { action: "Refer a business lead", points: "+75 pts", icon: Building2, description: "Connect local businesses to the platform" },
    { action: "Business becomes a paying partner", points: "+200 pts", icon: Star, description: "Successfully onboard a business partner" },
    { action: "Create an event", points: "+5 pts", icon: Calendar, description: "Host community gatherings" },
    { action: "Event with 10+ attendees", points: "+20 pts", icon: Target, description: "Events that attract real participation" },
    { action: "Complete an Available Now — I'm Out", points: "+10 pts", icon: Users, description: "Max 1/day, 3/week" },
    { action: "Complete an Available Now — I'm Free", points: "+5 pts", icon: Users, description: "Max 1/day, 3/week" },
    { action: "Create a chatroom (5+ members)", points: "+15 pts", icon: Users, description: "Build active community spaces" },
    { action: "Write a reference", points: "+10 pts", icon: Star, description: "Max 1 per person ever" },
    { action: "Receive a reference", points: "+10 pts", icon: Star, description: "Max 1 per person ever" },
    { action: "Every 25 connections reached", points: "+50 pts", icon: Users, description: "Grow your network" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/profile')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Award className="w-4 h-4" />
            Connector Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Help Build Nearby Traveler.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Earn points by growing the community. A total <span className="font-bold text-orange-600 dark:text-orange-400">4% Connector Ownership Pool</span> is reserved for Connectors.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-5 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Example: Connector Points</div>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">xxxxx</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">Your real points will show up on your profile</div>
            </div>
            <Award className="w-10 h-10 text-blue-400 dark:text-blue-500" />
          </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">How It Works</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { step: 1, title: "Do Helpful Actions", desc: "Invite friends, refer businesses, host events", color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40" },
                { step: 2, title: "Earn Points", desc: "Points stack over time based on impact", color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40" },
                { step: 3, title: "Calculate Share", desc: "Your points / total points = your share", color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40" },
                { step: 4, title: "Exit Only", desc: "Value only upon acquisition or IPO", color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40" },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${color}`}>
                    <span className="text-sm font-bold">{step}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">How Points Turn Into Equity</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Points track your contribution over time. There are <span className="font-semibold text-gray-900 dark:text-white">no periodic cash distributions</span> from this program.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              If there is ever a future <span className="font-semibold text-gray-900 dark:text-white">liquidity event</span> (an "exit" like an acquisition or IPO),
              we calculate your share of the <span className="font-semibold text-orange-600 dark:text-orange-400">4% Connector Ownership Pool</span> based on your portion of total points.
            </p>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Example:</span> If you earn 1,000 points and the community earns 100,000 total,
                you earned 1% → you receive 1% of the 4% pool (0.04% equity), subject to the program terms.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">LA Connectors: Extra 1% Local Pool</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Los Angeles city connectors share an <strong className="text-gray-900 dark:text-white">additional 1% ownership pool</strong> on top of the global 4%.
              LA connectors can earn from both pools.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ways to Earn Points</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              If an event has multiple Connectors (organizer + co-organizers), event-based points are split evenly among them.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {pointActions.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
                  <item.icon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</span>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{item.points}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Safety & Quality Rules
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2"><span className="text-amber-600">•</span>Points may require verification (e.g., event hosted, business activated)</li>
              <li className="flex items-start gap-2"><span className="text-amber-600">•</span>We remove points for fake accounts, spam invites, or low-quality events</li>
              <li className="flex items-start gap-2"><span className="text-amber-600">•</span>Some actions may have limits (to prevent gaming)</li>
              <li className="flex items-start gap-2"><span className="text-amber-600">•</span>Connectors must maintain minimum activity to remain in the program</li>
            </ul>
            <div className="mt-3 rounded-xl bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-700 p-3">
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Activity requirement:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Must earn at least 200 points every 6 months to stay active</li>
                <li>Inactive for 6 months → status changes to "Inactive" (points frozen, not deleted)</li>
                <li>Inactive for 12 months → connector status revoked, points stop counting</li>
                <li>Can reapply after 12 months and start fresh</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              FAQ
            </h2>
            <div className="space-y-4">
              {[
                { q: "Is this paid work?", a: "No. This is not a job and points are not income." },
                { q: "Can points be converted to cash?", a: "No. Points are for tracking contribution. They may never be worth anything." },
                { q: "When could points matter?", a: "Only if there's a future exit (like an acquisition or IPO), and only under the official terms." },
                { q: "How do I stay active?", a: "Earn at least 200 points every 6 months. If inactive for 6 months, your status becomes Inactive (points frozen). If inactive for 12 months, connector status is revoked." },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{q}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Important Notice
            </h2>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2"><span className="text-red-500">•</span>Points are not money, wages, or guaranteed rewards</li>
              <li className="flex items-start gap-2"><span className="text-red-500">•</span>Points may have no value now or ever</li>
              <li className="flex items-start gap-2"><span className="text-red-500">•</span>Any potential value is <span className="font-semibold">only upon a liquidity event</span> and only under program terms</li>
              <li className="flex items-start gap-2"><span className="text-red-500">•</span>We may change, pause, or end the program to prevent fraud or keep it fair</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              The Connector Ownership Pool is offered only under the program's official terms and eligibility rules.
              Points don't guarantee equity and may be adjusted for fraud prevention, verification, and quality standards.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Ready to Become a Connector?</h2>
            <p className="text-blue-100 text-sm mb-4">
              Questions? Email <a href="mailto:connectors@nearbytraveler.org" className="underline font-medium text-white">connectors@nearbytraveler.org</a>
            </p>
            {user && (
              <a href={`mailto:connectors@nearbytraveler.org?subject=Connector Program Application - ${user.username}&body=Hi Aaron,%0D%0A%0D%0AI would like to apply to become a Nearby Traveler Connector.%0D%0A%0D%0AUsername: ${user.username}%0D%0AName: ${user.name || 'N/A'}%0D%0AEmail: ${user.email}%0D%0A%0D%0AWhy I want to be a Connector:%0D%0A%0D%0A%0D%0AHow I plan to help grow the community:%0D%0A%0D%0A`}>
                <Button size="lg" className="bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 font-semibold shadow-lg">
                  Apply to Become a Connector
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
