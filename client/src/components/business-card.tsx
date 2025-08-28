import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share, Globe } from 'lucide-react';

export default function BusinessCard() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const signupUrl = `${window.location.origin}/join`;

  useEffect(() => {
    // Generate QR code for the signup URL
    QRCode.toDataURL(signupUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1f2937', // Dark gray
        light: '#ffffff', // White
      },
    })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, [signupUrl]);

  const downloadCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for business card (3.5" x 2" at 300 DPI)
    canvas.width = 1050;
    canvas.height = 600;

    if (ctx) {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#2563eb'); // Blue
      gradient.addColorStop(1, '#f97316'); // Orange
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add company name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Nearby Traveler', 50, 80);

      // Add tagline
      ctx.font = '24px Arial';
      ctx.fillText('Connect with locals & travelers worldwide', 50, 120);

      // Add founder info
      ctx.font = 'bold 32px Arial';
      ctx.fillText('Aaron Lefkowitz', 50, 200);
      ctx.font = '20px Arial';
      ctx.fillText('Founder & Host', 50, 230);

      // Add experience stats
      ctx.font = '18px Arial';
      ctx.fillText('400+ travelers hosted • 50+ countries • 15+ years', 50, 270);

      // Add website
      ctx.font = '20px Arial';
      ctx.fillText('thenearbytraveler.com', 50, 320);

      // Add QR code if available
      if (qrCodeUrl) {
        const img = new Image();
        img.onload = () => {
          // Draw QR code on the right side
          ctx.drawImage(img, canvas.width - 250, 50, 200, 200);
          
          // Add "Scan to Join" text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Scan to Join', canvas.width - 150, 280);
          
          // Download the canvas as image
          const link = document.createElement('a');
          link.download = 'nearby-traveler-business-card.png';
          link.href = canvas.toDataURL();
          link.click();
        };
        img.src = qrCodeUrl;
      }
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nearby Traveler - Connect with Locals & Travelers',
          text: 'Join me on Nearby Traveler to connect with locals and travelers worldwide!',
          url: signupUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(signupUrl);
      alert('Signup link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Business Card with QR Code</h2>
      
      {/* Digital Business Card Preview */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div 
            className="bg-gradient-to-r from-blue-600 to-orange-500 text-white p-8 relative"
            style={{ aspectRatio: '1.75/1' }} // Standard business card ratio
          >
            {/* Front side content */}
            <div className="flex justify-between items-start h-full">
              <div className="flex-1">
                <h1 className="text-3xl font-black mb-2">Nearby Traveler</h1>
                <p className="text-lg mb-6 opacity-90">Connect with locals & travelers worldwide</p>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Aaron Lefkowitz</h3>
                  <p className="text-sm opacity-90">Founder & Host</p>
                  <p className="text-xs opacity-75">400+ travelers hosted • 50+ countries • 15+ years</p>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium">thenearbytraveler.com</p>
                </div>
              </div>
              
              {/* QR Code section */}
              <div className="text-center">
                {qrCodeUrl && (
                  <div className="bg-white p-3 rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code for signup" 
                      className="w-32 h-32"
                    />
                  </div>
                )}
                <p className="text-sm font-bold mt-2">Scan to Join</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <Button 
          onClick={downloadCard}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!qrCodeUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Card
        </Button>
        
        <Button 
          onClick={shareCard}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Share className="w-4 h-4 mr-2" />
          Share Link
        </Button>
        
        <Button 
          onClick={() => window.open(signupUrl, '_blank')}
          variant="outline"
        >
          <Globe className="w-4 h-4 mr-2" />
          Test Signup
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-2">How to use your business card:</h3>
        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
          <li>• <strong>Digital:</strong> Share the QR code on your phone or tablet</li>
          <li>• <strong>Print:</strong> Download and print on business card stock (3.5" x 2")</li>
          <li>• <strong>Events:</strong> Perfect for meetups, conferences, or networking</li>
          <li>• <strong>Travel:</strong> Hand out to locals and travelers you meet</li>
        </ul>
      </div>

      {/* QR Code Details */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-bold mb-2">QR Code Links to:</h3>
        <p className="text-sm break-all text-blue-600 dark:text-blue-400">{signupUrl}</p>
        <p className="text-xs mt-1 text-gray-500">People can scan this to join Nearby Traveler directly</p>
      </div>
    </div>
  );
}