import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Phone, Send, Settings } from "lucide-react";

export default function SMSTest() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [eventTitle, setEventTitle] = useState("Test Event");
  const [userName, setUserName] = useState("Test User");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to test SMS notifications.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/sms/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          eventTitle,
          userName,
          eventDate: new Date().toLocaleDateString(),
          eventTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          eventLocation: "Test Location, CA"
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "SMS Test Successful",
          description: `Test SMS sent to ${phoneNumber}`,
        });
      } else {
        toast({
          title: "SMS Test Failed",
          description: result.message || "Failed to send test SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "SMS Test Failed",
        description: "Network error occurred while sending test SMS",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Test Panel</h1>
          <p className="text-gray-600">Test SMS event notifications for Nearby Traveler</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SMS Configuration Status
            </CardTitle>
            <CardDescription>
              Current status of SMS notification services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Twilio Service</span>
                <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Configured (requires API keys)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone Number Validation</span>
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Event RSVP Integration</span>
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Test SMS Notification
            </CardTitle>
            <CardDescription>
              Send a test SMS to verify the notification system is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  data-testid="input-phone-number"
                />
                <p className="text-xs text-gray-500">
                  Include country code (e.g., +1 for US numbers)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  placeholder="Test User"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  data-testid="input-user-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                placeholder="Test Event"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                data-testid="input-event-title"
              />
            </div>

            <Button
              onClick={sendTestSMS}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full"
              data-testid="button-send-test-sms"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Sending Test SMS..." : "Send Test SMS"}
            </Button>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Test Message Preview:</h4>
              <p className="text-sm text-blue-800">
                "Hi {userName}! ✅ You're confirmed for "{eventTitle}" on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Location: Test Location, CA. See you there! - Nearby Traveler"
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Note:</h4>
              <p className="text-sm text-amber-800">
                To use SMS notifications in production, you'll need to configure the following environment variables:
              </p>
              <ul className="text-sm text-amber-800 mt-2 list-disc list-inside">
                <li>TWILIO_ACCOUNT_SID</li>
                <li>TWILIO_AUTH_TOKEN</li>
                <li>TWILIO_PHONE_NUMBER</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}