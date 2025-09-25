import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Heart, Shield } from "lucide-react";
import Footer from "@/components/footer";
import { useContext } from "react";
import { AuthContext } from "@/App";

export default function CommunityGuidelines() {
  const { user } = useContext(AuthContext);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const homeUrl = user ? "/home" : "/";

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link href={homeUrl}>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-gray-50"
                onClick={scrollToTop}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Building authentic connections through kindness, respect, and shared experiences
            </p>
          </div>

          {/* The NearbyTraveler Pledge */}
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-8 rounded-lg border-2 border-blue-200 mb-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">The NearbyTraveler Pledge</h2>
              <div className="space-y-4 text-lg text-gray-800 max-w-2xl mx-auto">
                <p className="font-semibold">I believe in real human connection.</p>
                <p className="font-semibold">I will show up with kindness, respect, and openness.</p>
                <p className="font-semibold">I will help make this a safe, welcoming community for travelers and locals everywhere.</p>
              </div>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-sm text-gray-600 mb-8">
              <strong>Last Updated:</strong> January 27, 2025
            </p>

            {/* Our Values Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-semibold text-gray-900">Our Core Values</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">🤝 Authentic Connection</h3>
                  <p className="text-blue-800 text-sm">
                    We believe travel is about genuine human experiences, not transactions. Every interaction should be meaningful and based on shared interests and mutual respect.
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">💙 Kindness First</h3>
                  <p className="text-green-800 text-sm">
                    Small acts of kindness create lasting memories. Whether you're helping a lost traveler or sharing local insights, kindness is our universal language.
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3">🌟 Cultural Respect</h3>
                  <p className="text-orange-800 text-sm">
                    Every culture has wisdom to share. We celebrate differences, learn from each other, and approach every new place with humility and curiosity.
                  </p>
                </div>
              </div>
            </section>

            {/* Community Standards */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-gray-900">Community Standards</h2>
              </div>

              <div className="space-y-8">
                {/* What We Celebrate */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">✨ What We Celebrate</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <ul className="grid md:grid-cols-2 gap-2 text-green-800 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Sharing local hidden gems and authentic experiences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Welcoming travelers with open arms and local wisdom</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Creating meaningful friendships across cultures</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Supporting local businesses and sustainable tourism</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Showing up authentically and keeping your commitments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Learning new perspectives and sharing your own respectfully</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* What We Don't Allow */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">🚫 What We Don't Allow</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Disrespectful Behavior</h4>
                        <ul className="text-red-800 text-sm space-y-1 ml-4">
                          <li>• Harassment, discrimination, or bullying of any kind</li>
                          <li>• Cultural insensitivity or stereotyping</li>
                          <li>• Aggressive or threatening language</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Misuse of Platform</h4>
                        <ul className="text-red-800 text-sm space-y-1 ml-4">
                          <li>• Using the platform for dating or romantic purposes</li>
                          <li>• Spam, mass messaging, or commercial solicitation</li>
                          <li>• Creating fake profiles or misrepresenting yourself</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Safety Violations</h4>
                        <ul className="text-red-800 text-sm space-y-1 ml-4">
                          <li>• Inappropriate or illegal activities</li>
                          <li>• Sharing personal information without consent</li>
                          <li>• No-shows or repeatedly canceling plans last minute</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety & Trust */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">🛡️ Safety & Trust</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-blue-800 mb-4">Your safety is our priority. Here's how we maintain a trusted community:</p>
                    <ul className="text-blue-800 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>Meet in public places</strong> for first meetings and inform someone of your plans</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>Trust your instincts</strong> - if something doesn't feel right, prioritize your safety</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>Report concerns</strong> immediately to our community team</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>Verify profiles</strong> through our authentication features when available</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Enforcement */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">⚖️ Community Enforcement</h3>
                  <p className="text-gray-700 mb-4">
                    When community guidelines are violated, we take appropriate action to protect our members:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <ul className="text-gray-700 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">⚠️</span>
                        <span><strong>First violation:</strong> Warning and educational guidance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">🔶</span>
                        <span><strong>Repeated violations:</strong> Temporary restrictions on features</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">🔴</span>
                        <span><strong>Serious violations:</strong> Account suspension or permanent removal</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-800 mt-1">🚨</span>
                        <span><strong>Illegal activity:</strong> Report to relevant authorities</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* How to Report */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">📢 How to Report Concerns</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <p className="text-orange-800 mb-4">
                      If you encounter behavior that violates our guidelines, please report it immediately:
                    </p>
                    <ul className="text-orange-800 text-sm space-y-2">
                      <li>• Use the "Report" button on profiles, messages, or events</li>
                      <li>• Contact our support team directly through the app</li>
                      <li>• For urgent safety concerns, contact local authorities first</li>
                      <li>• Include as much detail as possible to help us investigate</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Closing Message */}
            <section className="text-center py-8">
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-8 rounded-lg border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Together, We Create Amazing Experiences</h3>
                <p className="text-gray-700 max-w-2xl mx-auto">
                  Every connection you make, every kindness you show, and every experience you share helps build the global community we envision. Thank you for being part of NearbyTraveler and for helping us create a world where authentic human connection thrives.
                </p>
                <div className="mt-6">
                  <span className="text-2xl">🌍✨</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}