import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Mail, Send, Loader2, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

  // Use your actual deployed domain
  const signupUrl = `https://www.thenearbytraveler.com`;
  
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
    
    // Copy the email content to clipboard as a better alternative
    const emailContent = `To: ${emailForm.friendEmail}
Subject: Check out Nearby Traveler - Connect with Travelers & Locals!

${emailForm.personalMessage || generatePersonalMessage()}`;

    try {
      await navigator.clipboard.writeText(emailContent);
      
      setEmailForm({ friendEmail: "", friendName: "", personalMessage: "" });
      setShowEmailForm(false);
      setIsSending(false);
      
      toast({
        title: "Email Content Copied!",
        description: "The email content has been copied to your clipboard. Open your email app and paste it.",
      });
    } catch (error) {
      setIsSending(false);
      toast({
        title: "Error",
        description: "Unable to copy email content. Please copy manually.",
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
          Share with Friends
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
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => copyToClipboard(signupUrl)}
                variant="outline"
                className="text-sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                onClick={openEmailForm}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                onClick={async () => {
                  const message = `Hey! I've been using this amazing travel app called Nearby Traveler and I think you'd absolutely love it!

It's perfect for:
• Meeting local friends when you travel who know the best hidden spots
• Connecting with fellow travelers in your own city
• Discovering authentic experiences beyond tourist traps
• Joining exclusive local events and creating your own
• Sharing travel memories and getting inspired for your next adventure
• Finding people with your exact interests and travel style

The community is incredible - I've already made some amazing connections! Want to check it out?

${signupUrl}

Hope to see you there!`;
                  
                  try {
                    await navigator.clipboard.writeText(message);
                    toast({
                      title: "Message Copied!",
                      description: "WhatsApp message copied to clipboard. Open WhatsApp and paste to any chat.",
                    });
                    
                    // Still try to open WhatsApp for convenience, but with message copied as backup
                    setTimeout(() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    }, 500);
                  } catch (error) {
                    // Fallback: just open WhatsApp
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white text-sm"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                </svg>
                WhatsApp
              </Button>
              <Button
                onClick={() => {
                  const message = `Hey! I've been using this amazing travel app called Nearby Traveler and I think you'd absolutely love it!

It's perfect for:
• Meeting local friends when you travel who know the best hidden spots
• Connecting with fellow travelers in your own city
• Discovering authentic experiences beyond tourist traps
• Joining exclusive local events and creating your own
• Sharing travel memories and getting inspired for your next adventure
• Finding people with your exact interests and travel style

The community is incredible - I've already made some amazing connections! Want to check it out?

Hope to see you there!`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(signupUrl)}&text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
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