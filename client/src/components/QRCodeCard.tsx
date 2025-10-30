import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Share, Download, CheckCircle, User, Link2 } from "lucide-react";
import QRCode from "qrcode";

interface User {
  id: number;
  username: string;
  name?: string;
  profileImage?: string;
}

export default function QRCodeCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user and fetch QR code
  useEffect(() => {
    const loadQRCode = async () => {
      try {
        console.log('🚀 QR: Starting load process...');
        
        // Get user from localStorage
        const storedUser = localStorage.getItem('travelconnect_user') || localStorage.getItem('user');
        if (!storedUser) {
          console.error('❌ QR: No user in localStorage');
          setError('No user found');
          setLoading(false);
          return;
        }

        const user: User = JSON.parse(storedUser);
        console.log('✅ QR: User loaded:', user.username);
        setCurrentUser(user);

        // Fetch QR code from API
        console.log('📞 QR: Fetching from API...');
        const response = await fetch('/api/user/qr-code', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id.toString()
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 QR: API response:', { hasCode: !!data.referralCode, code: data.referralCode });
        
        if (!data.referralCode) {
          throw new Error('No referral code in response');
        }

        // Build the signup URL
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/qr-signup?code=${data.referralCode}`;
        console.log('🔗 QR: Share URL:', url);
        setShareUrl(url);

        setLoading(false);
      } catch (err: any) {
        console.error('❌ QR Code Error:', err);
        setError(err.message || 'Failed to load QR code');
        setLoading(false);
      }
    };

    loadQRCode();
  }, []);

  // Generate QR code when shareUrl is available and canvas is mounted
  useEffect(() => {
    const generateQR = async () => {
      if (!shareUrl || !canvasRef.current) {
        console.log('⏳ QR: Waiting for canvas and URL...', { hasUrl: !!shareUrl, hasCanvas: !!canvasRef.current });
        return;
      }

      try {
        console.log('🎨 QR: Generating QR code on canvas...');
        await QRCode.toCanvas(canvasRef.current, shareUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        console.log('✅ QR: Canvas rendering complete!');
      } catch (err) {
        console.error('❌ QR: Canvas generation failed:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [shareUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${currentUser?.username || 'profile'}-qr-code.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

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
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Loading QR Code...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-center text-red-600 dark:text-red-400">Error Loading QR Code</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-600 dark:text-gray-400">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Link2 className="w-5 h-5" />
          Invite Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Avatar className="w-12 h-12">
            <AvatarImage src={currentUser?.profileImage} alt={currentUser?.name} />
            <AvatarFallback>
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{currentUser?.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">@{currentUser?.username}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <canvas 
            ref={canvasRef} 
            width={200} 
            height={200}
            data-testid="qr-canvas"
          />
        </div>

        {/* Share URL */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Share Link:</p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="flex-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-gray-700 dark:text-gray-300"
              data-testid="input-share-url"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
              data-testid="button-copy-url"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={shareProfile}
            className="w-full"
            data-testid="button-share-qr"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={downloadQR}
            variant="outline"
            className="w-full"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="font-medium mb-1">How it works:</p>
          <p className="text-xs">When someone scans this QR code and signs up, you'll automatically be connected as friends!</p>
        </div>
      </CardContent>
    </Card>
  );
}
