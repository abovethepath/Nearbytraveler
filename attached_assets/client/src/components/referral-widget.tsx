import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Mail, Send, Loader2, TrendingUp, Users, Award } from "lucide-react";

interface ReferralData {
  id: number;
  referralCode: string;
  referredEmail?: string;
  referredName?: string;
  status: string;
  referralSource?: string;
  completedAt?: string;
  rewardEarned: boolean;
  rewardType?: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
}

export default function ReferralWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    message: ""
  });

  // Pre-populate message when opening invite form
  const openInviteForm = () => {
    if (!inviteForm.message) {
      const defaultMessage = `Hi! I wanted to share Nearby Traveler with you - it's a travel networking platform that connects businesses with travelers and locals. Businesses can create special offers, promote events, target customers based on travel interests, and build relationships with their ideal audience. The platform helps you reach both travelers visiting your area and locals exploring their own city. If you go to their website, sign up as a business, please enter my username when asked. Check it out at thenearbytraveler.com - I think it would be perfect for growing your business! My username is "${username}".`;
      setInviteForm(prev => ({ ...prev, message: defaultMessage }));
    }
    setShowInviteForm(true);
  };

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const username = currentUser.username || '';

  // Fetch business referrals
  const { data: businessReferrals } = useQuery({
    queryKey: ['/api/business-referrals/my-referrals'],
    queryFn: () => apiRequest('GET', '/api/business-referrals/my-referrals').then(res => res.json()),
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: (data: { email: string; message?: string }) => 
      apiRequest('POST', '/api/business-referrals/send-invite', data)
  });

  const handleSendInvite = () => {
    if (!inviteForm.email) return;
    
    const defaultMessage = `Hi! I wanted to share Nearby Traveler with you - it's a travel networking platform that connects businesses with travelers and locals. Businesses can create special offers, promote events, target customers based on travel interests, and build relationships with their ideal audience. The platform helps you reach both travelers visiting your area and locals exploring their own city. If you go to their website, sign up as a business, please enter my username when asked. Check it out at thenearbytraveler.com - I think it would be perfect for growing your business! My username is "${username}".`;
    
    const inviteData = {
      email: inviteForm.email,
      message: inviteForm.message || defaultMessage
    };
    
    sendInviteMutation.mutate(inviteData, {
      onSuccess: () => {
        // Close the invitation dialog
        setShowInviteForm(false);
        setInviteForm({ email: "", message: "" });
        toast({
          title: "Business Invitation Sent!",
          description: "Your business referral invitation has been sent successfully.",
        });
      },
      onError: (error: any) => {
        console.error('Send invite error:', error);
        toast({
          title: "Error",
          description: "Failed to send business invitation. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareUrl = `https://www.thenearbytraveler.com/signup-business`;

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-500",
      completed_profile: "bg-blue-500",
      first_connection: "bg-green-500",
      first_event: "bg-blue-500"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Business Referral Username
          </CardTitle>
          <CardDescription>
            <span className="text-gray-700 dark:text-white">Share your username with businesses and earn $100 when they subscribe!</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={username} 
                readOnly 
                className="font-mono text-lg font-bold text-center bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
              <Button
                onClick={() => copyToClipboard(username)}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Tell businesses to mention your username during signup:</div>
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded border dark:border-blue-600 text-sm dark:text-blue-200">
                <strong>Instructions for businesses:</strong><br/>
                1. Go to the business signup page<br/>
                2. When asked "Were you referred by a Nearby Traveler or Nearby Local?", enter: <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">{username}</span><br/>
                3. Complete their subscription to earn your $100 business referral reward<br/>
                <br/>
                <strong>OR:</strong> You can just verbally tell a business your username, and when they sign up, when asked they just need to enter it at sign up - simple<br/>
                <br/>
                <em>Note: This is specifically for business referrals, not general user referrals</em>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(shareUrl)}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Signup Link
                </Button>
                <Button
                  onClick={() => setShowInviteForm(true)}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Referral Invitation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Business Referrals */}
      {businessReferrals && businessReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Business Referrals</CardTitle>
            <CardDescription>Track your business referral activity and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessReferrals.slice(0, 5).map((referral: any) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${referral.isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <div className="font-medium dark:text-white">
                        {referral.businessName || 'Business Referral'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(referral.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm dark:text-gray-300">
                    {referral.isPaid ? '$100 Earned' : 'Pending Payment'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Invitation Dialog */}
      {showInviteForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Send Referral Invitation</h2>
              <button 
                onClick={() => setShowInviteForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({...prev, message: e.target.value}))}
                  placeholder={`Hi! I wanted to share Nearby Traveler with you - it's a travel networking platform that connects businesses with travelers and locals. Businesses can create special offers, promote events, target customers based on travel interests, and build relationships with their ideal audience. The platform helps you reach both travelers visiting your area and locals exploring their own city. If you go to their website, sign up as a business, please enter my username when asked. Check it out at thenearbytraveler.com - I think it would be perfect for growing your business! My username is "${username}".`}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendInvite}
                  disabled={sendInviteMutation.isPending || !inviteForm.email}
                  className="flex-1"
                >
                  {sendInviteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}