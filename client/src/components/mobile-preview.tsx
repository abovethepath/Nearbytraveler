import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, X } from "lucide-react";

interface MobilePreviewProps {
  children: React.ReactNode;
}

export default function MobilePreview({ children }: MobilePreviewProps) {
  const [showMobile, setShowMobile] = useState(true);

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-100 flex">
      {/* Desktop Preview */}
      <div className="flex-1 border-r border-gray-300">
        <div className="h-full bg-white overflow-auto">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor size={16} />
              <span className="text-sm">Desktop View</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMobile(!showMobile)}
              className="text-white hover:bg-gray-700"
            >
              {showMobile ? "Hide Mobile" : "Show Mobile"}
            </Button>
          </div>
          <div className="scale-75 origin-top-left w-[133%] h-[133%]">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Preview */}
      {showMobile && (
        <div className="w-96 bg-gray-200 p-4 flex flex-col">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} />
              <span className="text-sm">Mobile View - Your 95% of Users</span>
            </div>
          </div>
          
          {/* Mobile Device Frame */}
          <div className="bg-black p-2 rounded-b-lg flex-1">
            <div className="bg-gray-900 rounded-lg p-1 h-full relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
              
              {/* Screen */}
              <div className="bg-white rounded-lg h-full overflow-hidden relative">
                {/* Mobile View Content - Actual mobile rendering */}
                <div className="w-full h-full mobile-viewport" style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '285%', height: '285%' }}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}