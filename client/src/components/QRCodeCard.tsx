import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Share2, Copy, Download, Users } from "lucide-react";
import { useAuth } from "@/App";

interface QRCodeData {
  referralCode: string;
  qrCodeUrl: string;
  signupUrl: string;
  referralCount: number;
}

export default function QRCodeCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await fetch('/api/user/qr-code', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to generate QR code');
        }

        const data = await response.json();
        setQrData(data);
      } catch (error) {
        console.error('Error fetching QR code:', error);
        setError('Unable to generate QR code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchQRCode();
    }
  }, [user]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const shareQRCode = async () => {
    if (!qrData) return;

    const shareData = {
      title: 'Join me on Nearby Traveler!',
      text: `${user?.name} invited you to join Nearby Traveler - connect with travelers and locals worldwide!`,
      url: qrData.signupUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy URL to clipboard
        await copyToClipboard(qrData.signupUrl, 'Invitation link');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy URL to clipboard
      await copyToClipboard(qrData.signupUrl, 'Invitation link');
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `nearby-traveler-qr-${user?.username || 'code'}.png`;
    link.href = qrData.qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: "QR code saved to your device",
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Generating your QR code...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-qr-code">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <QrCode className="w-6 h-6" />
          <span>Your Invitation Code</span>
        </CardTitle>
        <CardDescription>
          Share this QR code to invite friends to Nearby Traveler
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <img 
              src={qrData?.qrCodeUrl} 
              alt="QR Code for inviting friends"
              className="w-48 h-48"
              data-testid="img-qr-code"
            />
          </div>
        </div>

        {/* Referral Stats */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-referral-count">
            <Users className="w-4 h-4 mr-2" />
            {qrData?.referralCount || 0} friends invited
          </Badge>
        </div>

        {/* Referral Code */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Referral Code</p>
          <div className="flex items-center justify-center space-x-2">
            <code className="px-3 py-1 bg-gray-100 rounded font-mono text-lg tracking-wider" data-testid="text-referral-code">
              {qrData?.referralCode}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(qrData?.referralCode || '', 'Referral code')}
              data-testid="button-copy-code"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={shareQRCode}
            className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Invitation
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              onClick={() => copyToClipboard(qrData?.signupUrl || '', 'Invitation link')}
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>

            <Button 
              variant="outline"
              onClick={downloadQRCode}
              data-testid="button-download-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <p>
            Friends who sign up with your code will automatically connect with you!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}