import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function QRCodeGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const signupUrl = `${window.location.origin}/join`;

  useEffect(() => {
    // Generate high-quality QR code for printing
    QRCode.toDataURL(signupUrl, {
      width: 500, // High resolution for printing
      margin: 4,
      color: {
        dark: '#000000', // Black
        light: '#ffffff', // White
      },
      errorCorrectionLevel: 'M', // Medium error correction for reliability
    })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, [signupUrl]);

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'nearby-traveler-qr-code.png';
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">QR Code for Business Cards</h1>
        <p className="text-gray-600 mb-8">High-resolution QR code for printing on business cards</p>
        
        {qrCodeUrl ? (
          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <img 
              src={qrCodeUrl} 
              alt="QR Code for Nearby Traveler Signup" 
              className="w-64 h-64 mx-auto"
            />
            <div className="mt-6 space-y-4">
              <Button 
                onClick={downloadQRCode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
              
              <div className="text-sm text-gray-500">
                <p><strong>Links to:</strong> {signupUrl}</p>
                <p><strong>Resolution:</strong> 500x500px (print ready)</p>
                <p><strong>Format:</strong> PNG with transparent background</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="w-64 h-64 bg-gray-200 rounded mx-auto"></div>
            <p className="mt-4 text-gray-500">Generating QR code...</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left text-sm text-gray-600">
          <h3 className="font-bold mb-2">Printing Instructions:</h3>
          <ul className="space-y-1">
            <li>• Download the QR code image</li>
            <li>• Add to your business card design</li>
            <li>• Recommended size: 1-1.5 inches square</li>
            <li>• Test scan before final printing</li>
            <li>• Include "Scan to join Nearby Traveler" text nearby</li>
          </ul>
        </div>
      </div>
    </div>
  );
}