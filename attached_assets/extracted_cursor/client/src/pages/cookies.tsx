import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/footer";
import { useContext } from "react";
import { AuthContext } from "@/App";

export default function Cookies() {
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
            <Link href="/">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-gray-50"
                onClick={scrollToTop}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last Updated:</strong> June 15, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700">
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better user experience by remembering your preferences and enabling essential platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use cookies to enhance your experience on the Nearby Traveler, Inc platform, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keeping you logged in during your session</li>
                  <li>Remembering your preferences and settings</li>
                  <li>Analyzing how you use our platform to improve our services</li>
                  <li>Providing personalized travel recommendations</li>
                  <li>Ensuring platform security and preventing fraud</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700">
                    These cookies are necessary for the platform to function properly. They enable core features like user authentication, security, and basic navigation.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Examples:</strong> Login tokens, security tokens, session management
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Performance Cookies</h3>
                  <p className="text-gray-700">
                    These cookies help us understand how you interact with our platform, allowing us to improve performance and user experience.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Examples:</strong> Page load times, feature usage analytics, error tracking
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Functional Cookies</h3>
                  <p className="text-gray-700">
                    These cookies remember your choices and preferences to provide a more personalized experience.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Examples:</strong> Language preferences, location settings, interface customizations
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Targeting Cookies</h3>
                  <p className="text-gray-700">
                    These cookies help us provide relevant travel recommendations and content based on your interests and activity.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Examples:</strong> Travel interest tracking, recommendation algorithms, content personalization
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may use third-party services that set their own cookies to provide functionality or analyze usage:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Analytics Services:</strong> To understand user behavior and improve our platform</li>
                  <li><strong>Authentication Providers:</strong> For secure login functionality</li>
                  <li><strong>Map Services:</strong> To provide location-based features</li>
                  <li><strong>Payment Processors:</strong> For secure transaction processing</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-800 mb-3">Browser Settings</h3>
                <p>
                  You can control and manage cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete cookies individually or all at once</li>
                  <li>Block cookies from specific websites</li>
                  <li>Block all cookies (may affect functionality)</li>
                  <li>Set cookies to be deleted when you close your browser</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Platform Settings</h3>
                <p>
                  You can also manage certain cookie preferences through your account settings, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Analytics and performance tracking</li>
                  <li>Personalized recommendations</li>
                  <li>Marketing communications preferences</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookie Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Session Cookies:</strong> Deleted when you close your browser</p>
                <p><strong>Persistent Cookies:</strong> Remain on your device for a set period (typically 30 days to 2 years) or until you delete them</p>
                <p><strong>Essential Cookies:</strong> Retained only as long as necessary for platform functionality</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Impact of Disabling Cookies</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800">
                  <strong>Important:</strong> Disabling certain cookies may affect your ability to use some features of our platform, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-amber-700 mt-2">
                  <li>Staying logged in between sessions</li>
                  <li>Saving your preferences and settings</li>
                  <li>Receiving personalized travel recommendations</li>
                  <li>Using location-based features</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy periodically to reflect changes in our practices or applicable laws. We will notify you of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about our use of cookies or this Cookie Policy, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-md mt-3">
                <p className="font-medium">Nearby Traveler, Inc</p>
                <p>Email: Aaron@thenearbytraveler.com</p>
                <p>Address: 32 Gould Street, Sheridan, Wyoming 82801</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href={homeUrl} onClick={scrollToTop} className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}