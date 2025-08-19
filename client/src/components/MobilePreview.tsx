import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

interface MobilePreviewProps {
  children: React.ReactNode;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center gap-2"
          data-testid="button-mobile-preview"
        >
          <Smartphone className="w-5 h-5" />
          <span className="hidden sm:inline">Mobile Preview</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {/* Mobile Phone Frame */}
      <div className="relative">
        {/* Phone Outer Frame */}
        <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Phone Inner Frame */}
          <div className="bg-black rounded-[2.5rem] p-2">
            {/* Screen Container - iPhone 14 Pro dimensions (393x852) */}
            <div className="bg-white rounded-[2rem] overflow-hidden relative" style={{ width: '393px', height: '852px' }}>
              {/* Status Bar */}
              <div className="bg-white h-6 flex items-center justify-between px-6 text-black text-sm font-medium">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                  <div className="w-6 h-3 border border-black rounded-sm">
                    <div className="w-4 h-2 bg-green-500 rounded-xs m-0.5"></div>
                  </div>
                </div>
              </div>
              
              {/* App Content */}
              <div className="h-full overflow-auto bg-white">
                {children}
              </div>
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
          data-testid="button-close-mobile-preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};