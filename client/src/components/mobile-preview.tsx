import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, X } from "lucide-react";

interface MobilePreviewProps {
  children: React.ReactNode;
}

export default function MobilePreview({ children }: MobilePreviewProps) {
  const [showMobile, setShowMobile] = useState(true);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-800 to-gray-900 flex justify-center items-center">
      {/* Mobile Phone Frame Only */}
      <div className="w-80 flex flex-col">
        <div className="bg-gray-700 text-white px-4 py-2 rounded-t-lg flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <span className="text-sm font-medium">Mobile Experience - 95% of Your Users</span>
          </div>
        </div>
        
        {/* iPhone Frame */}
        <div className="bg-black rounded-3xl p-2 shadow-2xl border-4 border-gray-600" style={{ height: '700px' }}>
          <div className="bg-black rounded-2xl h-full relative overflow-hidden">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 h-7 bg-black z-50 flex items-center justify-between px-6 text-white text-xs font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <div className="w-6 h-3 border border-white rounded-sm ml-2">
                  <div className="w-4 h-2 bg-white rounded-sm m-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50"></div>
            
            {/* Screen */}
            <div className="bg-white rounded-xl h-full relative">
              {/* Mobile View Content with visible scrollbar */}
              <div className="w-full h-full overflow-y-auto overflow-x-hidden mobile-viewport-container" style={{ position: 'relative' }}>
                <div className="mobile-viewport" style={{ 
                  transform: 'scale(0.4)', 
                  transformOrigin: 'top left', 
                  width: '250%', 
                  minHeight: '250%',
                  height: 'auto',
                  pointerEvents: 'auto'
                }}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}