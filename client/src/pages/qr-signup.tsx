import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, QrCode, ArrowRight } from "lucide-react";

interface Referrer {
  name: string;
  username: string;
  profileImage?: string;
  userType: string;
  location?: string;
  bio?: string;
}

interface QRSignupProps {
  referralCode: string;
}

export default function QRSignup({ referralCode }: QRSignupProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrerInfo = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching referrer info:", error);
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    if (referralCode) {
      fetchReferrerInfo();
    } else {
      setError("No referral code provided");
      setIsLoading(false);
    }
  }, [referralCode]);

  const handleSignupClick = (userType: string) => {
    // Store referral code in session storage to use during signup
    sessionStorage.setItem('referralCode', referralCode);
    sessionStorage.setItem('referrerInfo', JSON.stringify(referrer));
    
    // Navigate to appropriate signup form
    if (userType === 'business') {
      setLocation('/signup/business');
    } else if (userType === 'traveler') {
      setLocation('/signup/traveling');
    } else {
      setLocation('/signup/local');
    }
    
    toast({
      title: "Starting signup process",
      description: `You'll be automatically connected to ${referrer?.name} after creating your account!`,
      duration: 4000,
    });
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'business': return 'bg-green-100 text-green-800';
      case 'traveler': return 'bg-blue-100 text-blue-800';
      case 'local': return 'bg-purple-100 text-purple-800';
      case 'travel_agent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'travel_agent': return 'Travel Agent';
      default: return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/auth')} variant="outline">
              Go to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join Nearby Traveler and connect with{' '}
            <span className="font-semibold text-blue-600">{referrer?.name}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Referrer Profile Card */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={referrer?.profileImage} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {referrer?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{referrer?.name}</h3>
                <p className="text-sm text-gray-600">@{referrer?.username}</p>
              </div>
              <Badge className={getUserTypeColor(referrer?.userType || '')}>
                {getUserTypeLabel(referrer?.userType || '')}
              </Badge>
            </div>
            
            {referrer?.location && (
              <p className="text-sm text-gray-600 mb-2">📍 {referrer.location}</p>
            )}
            
            {referrer?.bio && (
              <p className="text-sm text-gray-700 italic">"{referrer.bio}"</p>
            )}
          </div>

          {/* Signup Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-center">Choose your account type:</h4>
            
            <Button 
              onClick={() => handleSignupClick('local')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-signup-local"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🏠</span>
                <span>Local Guide</span>
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
                <span>Traveler</span>
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
                <span>Business</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              After signing up, you'll automatically connect with {referrer?.name}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}