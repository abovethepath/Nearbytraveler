import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/footer";
import { useContext } from "react";
import { AuthContext } from "@/App";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last Updated:</strong> June 15, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Name, email address, username, and date of birth</li>
                <li>Profile information including bio (which may contain any personal details you choose to share), interests, activities, and travel preferences</li>
                <li>Location data (hometown, current city, travel destinations)</li>
                <li>Photos and other content you upload</li>
                <li>Messages and communications with other users</li>
                <li>Travel plans, dates, and itineraries</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Device information and browser type</li>
                <li>IP address and general location</li>
                <li>Pages visited and features used</li>
                <li>Time spent on the platform</li>
                <li>Search queries and filters applied</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide and improve our travel networking services</li>
                <li>Connect you with compatible travelers, locals, and businesses</li>
                <li>Send relevant recommendations and notifications</li>
                <li>You may receive marketing messages through the site, from businesses whose services match your interests and travel plans</li>
                <li>Try to ensure platform safety and prevent fraud</li>
                <li>Communicate important updates and support</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>With Other Users:</strong> Your profile information, travel plans, and public content are visible to other platform users to facilitate connections.
                </p>
                <p>
                  <strong>Service Providers:</strong> We share information with trusted partners who help operate our platform (hosting, analytics, customer support).
                </p>
                <p>
                  <strong>Legal Requirements:</strong> We may disclose information when required by law or to protect user safety and platform integrity.
                </p>
                <p>
                  <strong>Business Transfers:</strong> Information may be transferred in connection with mergers, acquisitions, or asset sales.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                Nearby Traveler facilitates connections between travelers, locals, and businesses. Here's how your information is shared:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-3">With Other Platform Users</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ul className="list-disc pl-6 space-y-2 text-blue-800 text-sm">
                      <li><strong>Profile Information:</strong> Your name, username, bio, location, and profile photo are visible to other users to facilitate connections</li>
                      <li><strong>Travel Plans:</strong> Your destinations, travel dates, and trip details are visible to help other users find compatible travel companions</li>
                      <li><strong>Interests and Activities:</strong> Your stated interests, preferred activities, and events are shared to enable matching with like-minded travelers, locals, and businesses</li>
                      <li><strong>References and Reviews:</strong> Feedback you leave and receive from other users is publicly visible to build trust within the community</li>
                      <li><strong>Public Content:</strong> Messages in city chatrooms, group chats, event chats, event participation, and other public interactions are visible to relevant community members</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-3">With Business Partners</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <ul className="list-disc pl-6 space-y-2 text-orange-800 text-sm">
                      <li><strong>Interest-Based Matching:</strong> We share your stated interests with relevant businesses in your travel destinations or hometown</li>
                      <li><strong>Location-Based Services:</strong> Businesses receive information about travelers and locals interested in their services in their area</li>
                      <li><strong>Marketing Communications:</strong> Local businesses may contact you through the site with services, promotions, and opportunities based on your profile preferences</li>
                      <li><strong>Service Recommendations:</strong> We facilitate connections between users and businesses that match their stated preferences</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Information Sharing is Essential to Our Service</h4>
                  <p className="text-amber-800 text-sm">
                    Information sharing between travelers, locals, and businesses is fundamental to how Nearby Traveler works. By creating an account, you agree to this information sharing which enables meaningful connections and relevant local experiences.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access, update, or delete your personal information</li>
                <li>Request data portability or account deletion</li>
                <li>Disable location sharing and proximity notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700">
                We retain your information as long as your account is active or as needed to provide services. After account deletion, we may retain some information for legal compliance, fraud prevention, and legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your privacy rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                Our platform is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy periodically. We will notify you of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this privacy policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-md mt-3">
                <p className="font-medium">Nearby Traveler, Inc</p>
                <p>Email: Aaron@thenearbytraveler.com</p>
                <p>Address: 32 Gould Street, Sheridan, Wyoming 82801</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button onClick={() => window.history.back()} className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}