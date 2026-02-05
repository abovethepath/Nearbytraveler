import { Mail, MessageCircle, HelpCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Support Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We're here to help you get the most out of Nearby Traveler
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-orange-500" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Have a question or need help? Send us an email and we'll respond within 24 hours.
              </p>
              <a href="mailto:support@nearbytraveler.org">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  support@nearbytraveler.org
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                In-App Help
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Use the help button in the app for instant answers to common questions.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Available in the app
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-green-500" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How do I create a profile?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign up with your email or social login, then complete your profile by adding your hometown, interests, and a photo. Your profile helps others find and connect with you.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How do Quick Meetups work?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Quick Meetups are spontaneous hangouts you can create or join. Simply set a meeting point, time, and description. Others in your area will be notified and can join.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is my information private?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! We take privacy seriously. You control what information is visible on your profile. We never share your personal data with third parties without consent.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How do I report inappropriate behavior?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You can report any user or content directly in the app by tapping the menu icon on their profile or message. Our team reviews all reports within 24 hours.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How do I delete my account?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Go to Settings in the app and select "Delete Account". You can also email support@nearbytraveler.org to request account deletion.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-4">
            Nearby Traveler, Inc. &copy; 2026
          </p>
          <div className="flex justify-center gap-6">
            <a 
              href="/privacy" 
              className="hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="/terms" 
              className="hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              Terms of Service <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
