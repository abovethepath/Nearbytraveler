
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';

interface MobilePreviewProps {
  children: React.ReactNode;
}

export function MobilePreview({ children }: MobilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Smartphone className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ width: '375px', height: '667px' }}>
        {/* Phone Header */}
        <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Mobile Preview</span>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Phone Content */}
        <div className="h-full overflow-auto" style={{ height: 'calc(667px - 48px)' }}>
          <div className="transform scale-75 origin-top-left" style={{ width: '133.33%', height: '133.33%' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
