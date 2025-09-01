import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Share, Download, CheckCircle, User, Link2 } from "lucide-react";
import QRCode from "qrcode";

interface User {
  id: number;
  username: string;
  name?: string;
  profile_image?: string;
}

export default function QRCodeCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);

  // Memoized function to get user data
  const getUserData = useCallback((): User | null => {
    try {
      let storedUser = localStorage.getItem('travelconnect_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      return null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }, []);

  // Initialize user data and fetch referral code
  useEffect(() => {
    const user = getUserData();
    if (user) {
      setCurrentUser(user);
      
      // Fetch the user's referral code from the backend
      fetch('/api/user/qr-code', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          'x-user-data': JSON.stringify(user)
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.referralCode) {
            const baseUrl = window.location.origin;
            // Create proper referral signup URL that goes to qr-signup page
            const url = `${baseUrl}/qr-signup?code=${data.referralCode}`;
            setShareUrl(url);
          }
        })
        .catch(error => {
          console.error('Error fetching referral code:', error);
          // Fallback to old format if API fails
          const baseUrl = window.location.origin;
          const url = `${baseUrl}/?ref=${user.username}&signup=true&connect=${user.id}`;
          setShareUrl(url);
        });
    }
  }, [getUserData]);

  // Memoized QR generation function using proper QRCode library
  const generateQRCode = useCallback(async (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !text) return;

    try {
      await QRCode.toCanvas(canvas, text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrGenerated(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, []);

  // Generate QR code when shareUrl is available - run only once
  useEffect(() => {
    if (shareUrl && canvasRef.current && !qrGenerated) {
      generateQRCode(shareUrl);
    }
  }, [shareUrl, generateQRCode, qrGenerated]);

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download QR code as image
  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${currentUser?.username || 'profile'}-qr-code.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Share via Web Share API or fallback
  const shareProfile = async () => {
    const shareData = {
      title: `Join ${currentUser?.username || 'me'} on Nearby Traveler!`,
      text: `Hey! I'm on Nearby Traveler - the best app for connecting with travelers and locals. Scan this to join and we'll automatically be connected as friends!`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copying URL
      copyToClipboard();
    }
  };

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400 dark:text-gray-300" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Please log in to generate your QR code</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-16 h-16 ring-4 ring-blue-100 dark:ring-blue-800">
            <AvatarImage src={currentUser.profile_image} alt={currentUser.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
              {currentUser.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {currentUser.username}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentUser.name || 'Travel Enthusiast'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white dark:bg-gray-100 rounded-xl shadow-inner border-2 border-gray-100 dark:border-gray-200">
            <canvas 
              ref={canvasRef} 
              className="block"
              style={{ 
                width: '200px', 
                height: '200px',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>

        {/* Referral URL */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Link2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Referral Signup Link
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono bg-white dark:bg-gray-800 p-2 rounded border">
            {shareUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={copyToClipboard} 
            className="w-full flex items-center justify-center space-x-2"
            variant={copied ? "default" : "outline"}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Invite Link</span>
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={shareProfile}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Share className="w-4 h-4" />
              <span>Share Invite</span>
            </Button>
            
            <Button 
              onClick={downloadQR}
              variant="outline"
              disabled={!qrGenerated}
              className="flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Share this QR code to invite friends - they'll join and you'll be connected automatically
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>✓ Scan to join</span>
            <span>✓ Auto-connect</span>
            <span>✓ Instant friends</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}