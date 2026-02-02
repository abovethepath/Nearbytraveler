import { useContext } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, Building2, Calendar, Trophy, Shield, AlertTriangle, ArrowLeft, Gift, TrendingUp, Award, UserPlus, Mail } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/footer";
import { AuthContext } from "@/App";

export default function AmbassadorProgram() {
  const { user } = useContext(AuthContext);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pointActions = [
    { action: "Refer a friend who signs up", icon: <UserPlus className="w-5 h-5" />, description: "Invite friends to join the community" },
    { action: "Refer a friend who becomes active", icon: <Users className="w-5 h-5" />, description: "Friend joins an event or messages" },
    { action: "Refer a business lead", icon: <Building2 className="w-5 h-5" />, description: "Connect local businesses to the platform" },
    { action: "Business becomes a paying partner", icon: <TrendingUp className="w-5 h-5" />, description: "Successfully onboard a business partner" },
    { action: "Create an event", icon: <Calendar className="w-5 h-5" />, description: "Host community gatherings" },
    { action: "Host/run a verified event", icon: <Star className="w-5 h-5" />, description: "Successfully run community events" },
    { action: "Event hits attendance goal", icon: <Trophy className="w-5 h-5" />, description: "Grow event participation" },
    { action: "Community quality bonus", icon: <Award className="w-5 h-5" />, description: "Great feedback, low cancellations" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center h-24 px-4 sm:px-6 lg:px-8">
            <Logo variant="navbar" />
            <Link href="/">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={scrollToTop}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Ambassador Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Help Build Nearby Traveler.<br />
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Earn Points. Share in Ownership.
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Ambassadors are members who grow the community—by inviting friends, bringing in local businesses, and creating real events. 
            A total <span className="font-bold text-orange-600">4% Ambassador Ownership Pool</span> is reserved for Ambassadors.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Do Helpful Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invite friends, refer businesses, host events</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Earn Points</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Points stack over time based on impact</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Calculate Share</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your points / total points = your share</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Exit Only</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Value only upon acquisition or IPO</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                How Points Turn Into Equity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                At each distribution period:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>We total all Ambassador points earned in that period</li>
                <li>Your share = <span className="font-semibold">your points ÷ total points</span></li>
                <li>Your equity share comes from the 4% Ambassador Ownership Pool, based on that ratio</li>
              </ol>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Example:</span> If you earn 1,000 points and the community earns 100,000 points total, 
                  you earned 1% of the points → you receive 1% of the 4% pool (i.e., 0.04% equity), subject to the program terms.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-600" />
                How Travel Aura is Currently Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Travel Aura is separate from Ambassador Points. It tracks your general engagement with the platform.
              </p>
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold">Action</th>
                      <th className="text-right px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Completing profile</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Creating a trip</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Creating an event</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">4</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Creating a quick meetup</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">2</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Uploading a photo</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Creating a chatroom</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Ways to Earn Ambassador Points</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pointActions.map((item, index) => (
              <Card key={index} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="bg-gradient-to-r from-blue-500 to-orange-500 p-2 rounded-lg text-white">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.action}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Points vary by impact. Specific point values are determined by the program.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                Safety & Quality Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">To keep things fair:</p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Points may require verification (e.g., event hosted, business activated)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  We remove points for fake accounts, spam invites, or low-quality events
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Some actions may have limits (to prevent gaming)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Ambassadors must stay in good standing to qualify
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this paid work?</h3>
                <p className="text-gray-600 dark:text-gray-400">No. This is not a job and points are not income.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can points be converted to cash?</h3>
                <p className="text-gray-600 dark:text-gray-400">No. Points are for tracking contribution. They may never be worth anything.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">When could points matter?</h3>
                <p className="text-gray-600 dark:text-gray-400">Only if there's a future exit (like an acquisition or IPO), and only under the official terms.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  Points are not money, wages, or guaranteed rewards
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  Points may have no value now or ever
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  <span>Any potential payout/value is <span className="font-semibold">only upon a liquidity event</span> (for example, acquisition or IPO) and only if the program terms are met</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  We may change, pause, or end the program to prevent fraud or keep it fair
                </li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-red-200 dark:border-red-800">
                The Ambassador Ownership Pool is offered only under the program's official terms and eligibility rules. 
                Points don't guarantee equity and may be adjusted for fraud prevention, verification, and quality standards. 
                Equity details (timing, form, vesting, and eligibility) are defined in the program documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Become an Ambassador?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            {user 
              ? "Apply now to join our Ambassador Program and start earning points for helping grow the community."
              : "Start earning points by inviting friends, referring local businesses, and hosting community events."
            }
          </p>
          {user ? (
            <a href={`mailto:ambassadors@thenearbytraveler.com?subject=Ambassador Program Application&body=Hi,%0D%0A%0D%0AI would like to apply to become a Nearby Traveler Ambassador.%0D%0A%0D%0AUsername: ${user.username}%0D%0AName: ${user.name || 'N/A'}%0D%0AEmail: ${user.email}%0D%0A%0D%0AWhy I want to be an Ambassador:%0D%0A%0D%0A`}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Apply to Become an Ambassador
              </Button>
            </a>
          ) : (
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
                Join Nearby Traveler
              </Button>
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
