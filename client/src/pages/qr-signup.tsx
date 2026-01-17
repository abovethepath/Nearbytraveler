import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, QrCode, ArrowRight, CheckCircle, Loader2, Link } from "lucide-react";
import Navbar from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface Referrer {
  id: number;
  name: string;
  username: string;
  profileImage?: string;
  userType: string;
  location?: string;
  bio?: string;
}

interface CurrentUser {
  id: number;
  username: string;
  name?: string;
}

interface QRSignupProps {
  referralCode: string;
}

export default function QRSignup({ referralCode }: QRSignupProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionNote, setConnectionNote] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'self'>('none');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
        }

        // Fetch referrer info
        const response = await fetch(`/api/referral/${referralCode}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Invalid or expired QR code");
          } else {
            setError("Unable to load referrer information");
          }
          return;
        }

        const data = await response.json();
        setReferrer(data.referrer);

        // If user is logged in, check existing connection status
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Check if scanning own QR code
          if (user.id === data.referrer.id) {
            setConnectionStatus('self');
          } else {
            // Check connection status
            try {
              const statusResponse = await fetch(`/api/connections/status/${user.id}/${data.referrer.id}`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.status === 'connected') {
                  setConnectionStatus('connected');
                } else if (statusData.status === 'pending') {
                  setConnectionStatus('pending');
                }
              }
            } catch (e) {
              console.log('Could not check connection status');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching referrer info:", error);
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    if (referralCode) {
      initialize();
    } else {
      setError("No referral code provided");
      setIsLoading(false);
    }
  }, [referralCode]);

  // Handle session expiry - clear current user and show signup
  const handleSessionExpired = () => {
    localStorage.removeItem('travelconnect_user');
    localStorage.removeItem('user');
    setCurrentUser(null);
    toast({
      title: "Session Expired",
      description: "Please log in again or create a new account.",
      duration: 4000,
    });
  };

  // INSTANT CONNECT - for already logged-in users
  const handleInstantConnect = async () => {
    if (!currentUser || !referrer) return;
    
    setIsConnecting(true);
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          requesterId: currentUser.id,
          receiverId: referrer.id,
          connectionNote: connectionNote.trim() || `Connected via QR code scan`
        })
      });

      // Handle auth failure - session expired
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      setConnectionStatus('pending');
      toast({
        title: "Connection Request Sent!",
        description: `${referrer.name} will be notified of your connection request.`,
        duration: 4000,
      });
    } catch (error: any) {
      // Check if already connected
      if (error.message?.includes('already')) {
        setConnectionStatus('connected');
        toast({
          title: "Already Connected",
          description: `You're already connected with ${referrer.name}!`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to send connection request. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignupClick = (userType: string) => {
    // Store referral code in session storage to use during signup
    sessionStorage.setItem('referralCode', referralCode);
    sessionStorage.setItem('referrerInfo', JSON.stringify(referrer));
    
    // Store connection note if provided
    if (connectionNote.trim()) {
      sessionStorage.setItem('connectionNote', connectionNote.trim());
    }
    
    // Store the intended user type so account page can redirect correctly
    sessionStorage.setItem('intendedUserType', userType);
    
    // ALWAYS go to account signup first to collect email/password/username
    // Then account page will redirect to the appropriate type-specific form
    setLocation('/signup/account');
    
    toast({
      title: "Starting signup process",
      description: `You'll be automatically connected to ${referrer?.name} after creating your account!`,
      duration: 4000,
    });
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'traveler': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'local': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType.toLowerCase()) {
      default: return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-300">Loading invitation details...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600 dark:text-red-400">Invalid Invitation</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/auth')} variant="outline">
                Go to Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // User is logged in - show instant connect flow
  if (currentUser) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Link className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              {connectionStatus === 'self' ? (
                <>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">This is Your QR Code!</CardTitle>
                  <CardDescription>
                    Share this code with others to let them connect with you.
                  </CardDescription>
                </>
              ) : connectionStatus === 'connected' ? (
                <>
                  <CardTitle className="text-2xl text-green-600 dark:text-green-400">Already Connected!</CardTitle>
                  <CardDescription>
                    You're already connected with {referrer?.name}.
                  </CardDescription>
                </>
              ) : connectionStatus === 'pending' ? (
                <>
                  <CardTitle className="text-2xl text-orange-600 dark:text-orange-400">Request Sent!</CardTitle>
                  <CardDescription>
                    Your connection request to {referrer?.name} is pending.
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Connect Instantly!</CardTitle>
                  <CardDescription>
                    Tap to connect with{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{referrer?.name}</span>
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Referrer Profile Card */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-14 h-14 border-2 border-orange-400">
                    <AvatarImage src={referrer?.profileImage} />
                    <AvatarFallback className="bg-blue-600 text-white text-lg">
                      {referrer?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{referrer?.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{referrer?.username}</p>
                  </div>
                  <Badge className={getUserTypeColor(referrer?.userType || '')}>
                    {getUserTypeLabel(referrer?.userType || '')}
                  </Badge>
                </div>
                
                {referrer?.location && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 {referrer.location}</p>
                )}
                
                {referrer?.bio && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{referrer.bio}"</p>
                )}
              </div>

              {connectionStatus === 'none' && (
                <>
                  {/* Connection Note */}
                  <div className="space-y-2">
                    <Label htmlFor="connectionNote" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      How did you meet? (optional)
                    </Label>
                    <Input
                      id="connectionNote"
                      type="text"
                      placeholder="e.g., networking event, conference..."
                      value={connectionNote}
                      onChange={(e) => setConnectionNote(e.target.value)}
                      className="w-full"
                      data-testid="input-connection-note"
                    />
                  </div>

                  {/* Instant Connect Button */}
                  <Button 
                    onClick={handleInstantConnect}
                    disabled={isConnecting}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-semibold shadow-lg"
                    data-testid="button-instant-connect"
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <UserPlus className="w-5 h-5" />
                        <span>Connect with {referrer?.name?.split(' ')[0]}</span>
                      </span>
                    )}
                  </Button>
                </>
              )}

              {connectionStatus === 'connected' && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">You're connected!</span>
                  </div>
                  <Button 
                    onClick={() => setLocation(`/profile/${referrer?.username}`)}
                    variant="outline"
                    className="w-full"
                  >
                    View {referrer?.name?.split(' ')[0]}'s Profile
                  </Button>
                </div>
              )}

              {connectionStatus === 'pending' && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400">
                    <Loader2 className="w-5 h-5" />
                    <span className="font-medium">Connection request pending</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {referrer?.name} will be notified and can accept your request.
                  </p>
                </div>
              )}

              {connectionStatus === 'self' && (
                <div className="text-center">
                  <Button 
                    onClick={() => setLocation('/share-qr')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Go to My QR Code
                  </Button>
                </div>
              )}

              <div className="text-center pt-4 border-t dark:border-gray-700 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Logged in as @{currentUser.username}
                </p>
                <Button 
                  variant="link" 
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-0 h-auto"
                  onClick={() => {
                    localStorage.removeItem('travelconnect_user');
                    localStorage.removeItem('user');
                    setCurrentUser(null);
                    toast({
                      title: "Logged out",
                      description: "You can now sign up with a different account.",
                      duration: 3000,
                    });
                  }}
                >
                  Not you? Sign up with a different account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // User is NOT logged in - show signup options
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              Join Nearby Traveler and connect with{' '}
              <span className="font-semibold text-blue-600">{referrer?.name}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Referrer Profile Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={referrer?.profileImage} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {referrer?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{referrer?.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{referrer?.username}</p>
                </div>
                <Badge className={getUserTypeColor(referrer?.userType || '')}>
                  {getUserTypeLabel(referrer?.userType || '')}
                </Badge>
              </div>
              
              {referrer?.location && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 {referrer.location}</p>
              )}
              
              {referrer?.bio && (
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{referrer.bio}"</p>
              )}
            </div>

            {/* Already have account? */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200 text-center">
                Already have an account?{' '}
                <Button 
                  variant="link" 
                  className="px-1 py-0 h-auto text-orange-600 dark:text-orange-400 font-semibold"
                  onClick={() => {
                    sessionStorage.setItem('pendingReferralCode', referralCode);
                    setLocation('/auth');
                  }}
                >
                  Log in to connect instantly
                </Button>
              </p>
            </div>

            {/* Connection Note */}
            <div className="space-y-2">
              <Label htmlFor="connectionNote" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How do you know {referrer?.name}? (optional)
              </Label>
              <Input
                id="connectionNote"
                type="text"
                placeholder="e.g., met at Barcelona conference, friends from college..."
                value={connectionNote}
                onChange={(e) => setConnectionNote(e.target.value)}
                className="w-full"
                data-testid="input-connection-note"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This note will help you both remember how you connected!
              </p>
            </div>

            {/* Signup Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-center">Choose your account type:</h4>
              
              <Button 
                onClick={() => handleSignupClick('local')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-signup-local"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span>Nearby Local</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>

              <Button 
                onClick={() => handleSignupClick('traveler')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-signup-traveler"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>✈️</span>
                  <span>Nearby Traveler</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>

              <Button 
                onClick={() => handleSignupClick('business')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-signup-business"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🏢</span>
                  <span>Nearby Business</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>

            <div className="text-center pt-4 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                After signing up, you'll automatically connect with {referrer?.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
