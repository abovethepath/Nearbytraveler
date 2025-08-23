import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import QRCodeCard from "@/components/QRCodeCard";

export default function ShareQR() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/profile')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Invite Friends</h1>
        </div>

        {/* QR Code Card */}
        <QRCodeCard />

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Share your QR code or link with friends</li>
            <li>• They'll see your profile when they scan/click</li>
            <li>• After they sign up, you'll automatically connect</li>
            <li>• Start exploring and planning together!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}