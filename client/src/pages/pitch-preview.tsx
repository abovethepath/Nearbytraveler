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
            <div className="rounded-[2rem] overflow-hidden w-[322px] h-[684px] bg-gray-50 dark:bg-gray-900 relative">
              {/* Mock Privacy Settings UI */}
              <div className="h-full overflow-y-auto">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-6 pt-3 pb-1 text-sm">
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 bg-black rounded-sm"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                  </div>
                </div>

                {/* Header */}
                <div className="px-4 py-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      🔒
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Privacy Settings</h1>
                  </div>

                  {/* Main Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 bg-gray-400 rounded"></div>
                      <h2 className="text-base font-semibold text-gray-900">Display Name Preference</h2>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Choose how your name appears to other users across all meetups and interactions.
                    </p>

                    {/* Preview Box */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="text-xs font-medium text-blue-900">Preview</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-900">
                        Others will see you as: <span className="bg-white px-2 py-1 rounded border text-blue-800">
                          nearbytrav
                        </span>
                      </p>
                    </div>

                    {/* Radio Options */}
                    <div className="space-y-3">
                      {/* Username Option - Selected */}
                      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">Username Only</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">RECOMMENDED</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Shows only your username (e.g., "nearbytrav")
                          </p>
                          <p className="text-xs text-blue-700 font-medium">
                            ✅ Most private • Best for travelers
                          </p>
                        </div>
                      </div>

                      {/* First Name Option */}
                      <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">First Name</span>
                          <p className="text-xs text-gray-600 mb-1">
                            Shows first word of your name (e.g., "Aaron")
                          </p>
                          <p className="text-xs text-gray-500">
                            ⚖️ Balanced privacy and personal connection
                          </p>
                        </div>
                      </div>

                      {/* Full Name Option */}
                      <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Full Name</span>
                          <p className="text-xs text-gray-600 mb-1">
                            Shows your complete name (e.g., "Aaron Lefkowitz")
                          </p>
                          <p className="text-xs text-orange-600">
                            ⚠️ Less private • Use with caution when traveling
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium mt-4">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
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