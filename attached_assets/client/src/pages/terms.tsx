import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/footer";
import { useContext } from "react";
import { AuthContext } from "@/App";

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last Updated:</strong> June 15, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing or using the Nearby Traveler, Inc platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700">
                Nearby Traveler, Inc is a social travel networking platform that connects travelers with locals and other travelers to facilitate authentic travel experiences, cultural exchange, and meaningful connections worldwide.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must be at least 16 years old to use our platform</li>
                <li>You must provide accurate and truthful information</li>
                <li>You must maintain the security of your account credentials</li>
                <li>You may only create one account per person</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Community Standards and User Conduct</h2>
              <p className="text-gray-700 mb-6">
                Nearby Traveler is built on trust, respect, and authentic connections between travelers, locals, and businesses. All members must follow these community standards to maintain a safe and welcoming environment.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Expected Behavior</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <ul className="list-disc pl-6 space-y-2 text-green-800">
                      <li>Be authentic and honest in your profile and communications</li>
                      <li>Treat all members with respect, kindness, and cultural sensitivity</li>
                      <li>Honor your commitments and communicate clearly about travel plans</li>
                      <li>Provide constructive feedback through our reference system</li>
                      <li>Report safety concerns or inappropriate behavior promptly</li>
                      <li>Respect local customs and laws in destinations you visit</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Prohibited Conduct</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="list-disc pl-6 space-y-2 text-red-800 text-sm">
                      <li><strong>Dating and Romance:</strong> Using our travel networking platform to seek romantic relationships or sexual encounters</li>
                      <li><strong>Harassment:</strong> Sending unwanted messages, making threats, stalking, or engaging in any form of intimidation</li>
                      <li><strong>Discrimination:</strong> Excluding or treating members differently based on race, religion, gender, sexual orientation, nationality, or disability</li>
                      <li><strong>Spam and Mass Messaging:</strong> Sending identical messages to multiple users or unsolicited promotional content</li>
                      <li><strong>Fraud and Misrepresentation:</strong> Creating fake profiles, lying about your identity, location, or travel plans</li>
                      <li><strong>Commercial Exploitation:</strong> Using the platform for unauthorized business promotion or monetary transactions between members</li>
                      <li><strong>Privacy Violations:</strong> Sharing other members' personal information without consent or taking photos/videos without permission</li>
                      <li><strong>Illegal Activities:</strong> Engaging in or promoting any illegal activities, drug use, or dangerous behavior</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Content Standards</h3>
                  <p className="text-gray-700 mb-3">All content shared on Nearby Traveler must be appropriate and respectful. Prohibited content includes:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Sexually explicit material, nudity, or pornographic content</li>
                    <li>Hate speech, discriminatory language, or negative or derogatory content targeting specific groups</li>
                    <li>Violent content or threats of violence against people or animals</li>
                    <li>Personal information of others without their explicit consent</li>
                    <li>Copyrighted material that you don't have permission to share</li>
                    <li>Misleading information about destinations, accommodations, or safety</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Enforcement</h3>
                  <p className="text-gray-700 mb-3">Violations of these standards may result in:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Content removal and warning notifications</li>
                    <li>Temporary restrictions on messaging or profile features</li>
                    <li>Suspension of account access for repeated violations</li>
                    <li>Permanent account termination for serious safety violations</li>
                    <li>Reporting to law enforcement when illegal activity is involved</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Business Partnerships and Local Service Connections</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Service Connection Model:</strong> Our platform facilitates connections between users and relevant local businesses based on your stated interests, activities, and travel destinations. By using our service, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Business Matching:</strong> We connect travelers and locals with businesses that align with their interests (e.g., fitness enthusiasts with local gyms, food lovers with restaurants)</li>
                  <li><strong>Data Sharing for Recommendations:</strong> Your interest and activity preferences may be shared with local businesses to provide relevant service recommendations and offers</li>
                  <li><strong>Direct Business Communication:</strong> Local businesses may contact you directly with services, promotions, and opportunities based on your profile preferences</li>
                  <li><strong>Marketing Communications:</strong> You may receive marketing messages from businesses whose services match your interests and travel plans</li>
                  <li><strong>No Endorsement:</strong> We do not endorse or guarantee the quality, safety, or legality of any business services. Users engage with businesses at their own risk</li>
                </ul>

              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Your Content:</strong> You retain ownership of content you post but grant us a license to use, display, and distribute it on our platform.
                </p>
                <p>
                  <strong>Platform Content:</strong> Our platform design, features, and proprietary content are protected by intellectual property laws.
                </p>
                <p>
                  <strong>Proprietary Travel Connection Technology:</strong> Nearby Traveler owns all intellectual property rights to our unique service of connecting people based on overlapping travel plans, shared interests, and destination compatibility. This includes our proprietary algorithms, methodologies, and systems for analyzing travel dates, detecting overlap periods, matching travelers with locals, and facilitating connections through intelligent geographic and preference-based analysis.
                </p>
                <p>
                  <strong>Service Innovation:</strong> Our core business model of facilitating real-time connections between travelers and locals through automated analysis of travel plans, dates, interests, and location overlap represents proprietary intellectual property developed exclusively by Nearby Traveler. Users acknowledge that this travel networking methodology is unique and protected under applicable intellectual property laws.
                </p>
                <p>
                  <strong>User-Generated Content:</strong> You are responsible for ensuring your content doesn't violate third-party rights or applicable laws.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Protected Technologies Include:</h4>
                  <ul className="list-disc pl-4 text-blue-800 text-sm space-y-1">
                    <li>Travel date overlap detection and compatibility analysis systems</li>
                    <li>Interest-based matching algorithms connecting travelers with locals</li>
                    <li>Geographic proximity and destination networking methodologies</li>
                    <li>Compatibility scoring based on travel preferences and demographics</li>
                    <li>Business-to-traveler connection and recommendation systems</li>
                    <li>Real-time travel plan analysis and user matching processes</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Safety and Security</h2>
              <div className="space-y-6 text-gray-700">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">Your safety is important. Take it seriously. We do.</p>
                  <p className="text-yellow-700 text-sm">Meeting people online carries inherent risks. Always prioritize your safety when meeting users in person.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Review Profiles and References Carefully</h4>
                    <p>Before meeting anyone, take time to carefully review member profiles. Read what members say about themselves and what other members have said about them in references. Give yourself time to thoroughly read through all available information and don't compromise. If you're uncomfortable, keep looking.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Trust Your Instincts</h4>
                    <p>If a person, situation, or profile seems unsafe for any reason, move on. Don't worry about seeming rude. Be clear about your boundaries and don't hesitate to state them. If someone makes you uncomfortable, end the conversation or don't meet them. Communicate clearly with others and take care of yourself.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Have a Backup Plan</h4>
                    <p>Know your options. If something doesn't work out with your plans, make sure you have alternatives. Identify nearby accommodations, transportation options, or backup contacts before you travel. Research your destination and meeting locations prior to arriving, including how to get to and from there on your own.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Be Informed About Local Culture</h4>
                    <p>Do your homework and be aware of cultural and religious differences, sensitivities, and general safety recommendations for each place you visit. Gender roles and expectations can differ significantly. Consult official travel advisories from your government's foreign affairs department.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Keep All Communications on Nearby Traveler</h4>
                    <p>For safety and security, it is best to keep all conversations and messages on Nearby Traveler rather than sharing personal phone numbers or email addresses with members. This ensures all communications are stored in our database, allowing our safety team to monitor for issues and respond quickly if problems arise. Avoid moving conversations to external platforms until you have met in person and feel completely comfortable.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Know Your Limits</h4>
                    <p>Excessive partying or substance use puts your safety and well-being in the hands of others. Stay alert and in control of your situation at all times.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Leave References</h4>
                    <p>Use our reference system to let other members know about your experiences. Be honest and constructive. References help build trust within the community and inform future interactions.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Report Negative Experiences</h4>
                    <p>Our safety team works to build the safest community possible. Report safety concerns, inappropriate behavior, or negative experiences immediately. This helps keep future members safe and maintains community standards.</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <p className="text-red-800 font-semibold">
                    <strong>Disclaimer of Responsibility:</strong> Nearby Traveler is not responsible for any actions, activities, behavior, or conduct of our members or those you meet in person through our app and website. Users participate at their own risk and are solely responsible for their interactions, meetings, and experiences with other users.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Account Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms, engage in prohibited activities, or pose risks to user safety.
                </p>
                <p>
                  You may delete your account at any time through your account settings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Service Availability:</strong> We strive for reliable service but cannot guarantee uninterrupted availability.
                </p>
                <p>
                  <strong>User Interactions:</strong> We are not responsible for interactions between users or the accuracy of user-provided information.
                </p>
                <p>
                  <strong>Third-Party Services:</strong> We are not liable for third-party services or content accessed through our platform.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700">
                To the fullest extent permitted by law, Nearby Traveler, Inc shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless Nearby Traveler, Inc from any claims, damages, or expenses arising from your use of our platform or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700">
                These terms are governed by the laws of Wyoming without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these terms periodically. We will notify users of significant changes via email or platform notification. Continued use constitutes acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these terms or our services, please contact us at:
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