import React from 'react';

export function PitchPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="text-center">
        {/* Title for context */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Nearby Traveler
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Privacy-First Travel Social Network
        </p>

        {/* iPhone Frame Mockup */}
        <div className="relative mx-auto">
          {/* iPhone 14 Pro Frame */}
          <div className="relative mx-auto border-gray-800 dark:border-gray-300 bg-gray-800 dark:bg-gray-300 border-[14px] rounded-[2.5rem] h-[712px] w-[350px] shadow-2xl">
            
            {/* Dynamic Island */}
            <div className="w-[148px] h-[18px] bg-gray-800 dark:bg-gray-300 top-[18px] rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            
            {/* Side Buttons */}
            <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-300 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-300 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 dark:bg-gray-300 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            
            {/* Screen Container */}
            <div className="rounded-[2rem] overflow-hidden w-[322px] h-[684px] bg-white dark:bg-gray-900 relative">
              {/* Embedded Privacy Settings Page */}
              <iframe 
                src="/privacy-settings"
                className="w-full h-full border-0"
                title="Privacy Settings Preview"
                style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
              />
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                🔒
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Privacy First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">User-controlled identity display</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                🌍
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Global Network</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connect travelers worldwide</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                ⚡
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Quick Meets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Instant local connections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}