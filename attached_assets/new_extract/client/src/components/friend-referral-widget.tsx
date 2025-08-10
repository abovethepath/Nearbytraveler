import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Mail, Send, Loader2, Heart } from "lucide-react";

export default function FriendReferralWidget() {
  const { toast } = useToast();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    friendEmail: "",
    friendName: "",
    personalMessage: ""
  });
  const [isSending, setIsSending] = useState(false);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const username = currentUser.username || '';
  const userFirstName = currentUser.name?.split(' ')[0] || username;

  const signupUrl = `https://www.thenearbytraveler.com/auth`;
  
  const generatePersonalMessage = () => {
    return `Hey ${emailForm.friendName || 'there'}!

I've been using this awesome travel platform called Nearby Traveler and thought you'd love it! It's perfect for connecting with Nearby Locals when you travel and meeting fellow Nearby Travelers in your own city.

Here's what makes it special:
• Connect with Nearby Locals who know the best hidden spots
• Meet fellow Nearby Travelers with similar interests
• Discover authentic experiences beyond tourist traps
• Join local events and create your own
• Share travel memories and get inspired

I think you'd really enjoy the community - there are so many cool people to meet and amazing places to discover together.

Want to check it out? You can sign up here: ${signupUrl}

Hope to see you on there soon!

${userFirstName}`;
  };

  const openEmailForm = () => {
    if (!emailForm.personalMessage) {
      setEmailForm(prev => ({ 
        ...prev, 
        personalMessage: generatePersonalMessage() 
      }));
    }
    setShowEmailForm(true);
  };

  const handleSendEmail = async () => {
    if (!emailForm.friendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your friend's email address",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    // Create mailto link with pre-filled content
    const subject = encodeURIComponent("Check out Nearby Traveler - Connect with Travelers & Locals!");
    const body = encodeURIComponent(emailForm.personalMessage || generatePersonalMessage());
    const mailtoLink = `mailto:${emailForm.friendEmail}?subject=${subject}&body=${body}`;
    
    try {
      // Open the default email client
      window.location.href = mailtoLink;
      
      // Reset form and show success
      setTimeout(() => {
        setEmailForm({ friendEmail: "", friendName: "", personalMessage: "" });
        setShowEmailForm(false);
        setIsSending(false);
        toast({
          title: "Email Generated!",
          description: "Your email client should open with the invitation ready to send.",
        });
      }, 1000);
    } catch (error) {
      setIsSending(false);
      toast({
        title: "Error",
        description: "Unable to open email client. Please copy the message manually.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyMessage = async () => {
    const message = emailForm.personalMessage || generatePersonalMessage();
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Message Copied!",
        description: "You can now paste this into any messaging app",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-gray-200 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          Refer a Friend
        </CardTitle>
        <CardDescription>
          <span className="text-gray-700 dark:text-gray-300">Share Nearby Traveler with friends and help them discover amazing travel experiences!</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Share Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Share Options:</div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(signupUrl)}
                variant="outline"
                className="flex-1 text-sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                onClick={openEmailForm}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>

          {/* Benefits section */}
          <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Why your friends will love it:</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>• Connect with Nearby Locals who know the best spots</div>
              <div>• Meet fellow Nearby Travelers with shared interests</div>
              <div>• Discover authentic experiences beyond tourist traps</div>
              <div>• Join events and create lasting travel memories</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Invite Your Friend
              </h2>
              <button 
                onClick={() => setShowEmailForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendName">Friend's Name (Optional)</Label>
                <Input
                  id="friendName"
                  value={emailForm.friendName}
                  onChange={(e) => setEmailForm(prev => ({...prev, friendName: e.target.value}))}
                  placeholder="e.g., Sarah"
                />
              </div>
              
              <div>
                <Label htmlFor="friendEmail">Friend's Email</Label>
                <Input
                  id="friendEmail"
                  type="email"
                  value={emailForm.friendEmail}
                  onChange={(e) => setEmailForm(prev => ({...prev, friendEmail: e.target.value}))}
                  placeholder="friend@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="personalMessage">Personal Message</Label>
                <Textarea
                  id="personalMessage"
                  value={emailForm.personalMessage}
                  onChange={(e) => setEmailForm(prev => ({...prev, personalMessage: e.target.value}))}
                  placeholder="Your personal invitation message..."
                  rows={8}
                  className="text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !emailForm.friendEmail}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening Email...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={copyMessage}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowEmailForm(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}