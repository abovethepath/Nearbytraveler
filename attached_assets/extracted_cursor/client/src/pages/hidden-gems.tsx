import HiddenGemsDiscovery from "@/components/hidden-gems-discovery";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function HiddenGemsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="pt-20 pb-8">
        <HiddenGemsDiscovery />
      </main>
      <Footer />
    </div>
  );
}