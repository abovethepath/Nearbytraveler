import Header from "@/components/navigation/header";
import MobileNav from "@/components/navigation/mobile-nav";
import Hero from "@/components/sections/hero";
import Features from "@/components/sections/features";
import HowItWorks from "@/components/sections/how-it-works";
import ActivityFeed from "@/components/sections/activity-feed";
import Technology from "@/components/sections/technology";
import Footer from "@/components/sections/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <ActivityFeed />
      <Technology />
      <Footer />
      <MobileNav />
    </div>
  );
}
