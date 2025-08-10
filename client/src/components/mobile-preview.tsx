import React from 'react';

export default function MobilePreview() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full flex gap-8 items-start">
        {/* iPhone Mockup */}
        <div className="flex-shrink-0">
          <div className="relative">
            {/* iPhone Frame */}
            <div className="relative mx-auto bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: '320px', height: '640px' }}>
              {/* Screen */}
              <div className="bg-white rounded-[2.5rem] h-full w-full overflow-hidden relative">
                {/* Status Bar */}
                <div className="bg-white text-black text-xs flex justify-between items-center px-4 py-2 border-b">
                  <span className="font-semibold">9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <svg width="17" height="10" viewBox="0 0 17 10" fill="none">
                      <rect x="1" y="1" width="15" height="8" rx="2" stroke="black" strokeWidth="1"/>
                      <rect x="2" y="2.5" width="13" height="5" rx="1" fill="black"/>
                    </svg>
                  </div>
                </div>
                
                {/* Mobile App Content - Simulated */}
                <div className="h-full overflow-y-auto bg-gray-50">
                  {/* Mobile Navbar */}
                  <div className="bg-white shadow-sm p-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded"></div>
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">BETA</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
                      <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
                      <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
                    </div>
                  </div>

                  {/* Hero Section Mobile */}
                  <div className="relative h-48 bg-gray-800 flex items-center justify-center text-white">
                    <div className="text-center px-4">
                      <h1 className="text-sm font-bold mb-2 leading-tight">
                        Where Local Experiences<br/>
                        <span className="text-orange-400">Meet WorldWide Connections</span>
                      </h1>
                      <p className="text-xs leading-relaxed">
                        Nearby Traveler- Connecting you to Nearby Locals and Nearby Travelers
                      </p>
                    </div>
                  </div>

                  {/* Beta Notice Mobile */}
                  <div className="p-3 bg-red-600 m-3 rounded text-white">
                    <div className="text-center">
                      <div className="text-xs font-bold mb-1">BETA NOTICE</div>
                      <div className="text-xs">Beta Version is for Los Angeles Based Events and Businesses</div>
                    </div>
                  </div>

                  {/* Feature Cards Mobile */}
                  <div className="p-3 space-y-3">
                    <div className="bg-white rounded p-3 text-center shadow">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">1</div>
                      <h3 className="text-sm font-semibold mb-1">Find Travel Companions</h3>
                      <p className="text-xs text-gray-600">Connect with like-minded travelers and locals</p>
                    </div>

                    <div className="bg-white rounded p-3 text-center shadow">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">2</div>
                      <h3 className="text-sm font-semibold mb-1">Discover Local Experiences</h3>
                      <p className="text-xs text-gray-600">Join events and activities hosted by locals</p>
                    </div>

                    <div className="bg-white rounded p-3 text-center shadow">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">3</div>
                      <h3 className="text-sm font-semibold mb-1">Get Insider Knowledge</h3>
                      <p className="text-xs text-gray-600">Meet locals who can show you hidden gems</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-24 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Phone Label */}
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Mobile Experience</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">How users see your app on their phones</p>
            </div>
          </div>
        </div>

        {/* Desktop Description */}
        <div className="flex-1 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Perfect Mobile Experience</h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📱 Optimized for Mobile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">95% of travelers use phones while exploring. Your app is designed mobile-first for the best experience.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🎯 Touch-Friendly</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Large buttons, easy navigation, and readable text sizes perfect for travelers on the go.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">⚡ Fast Loading</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quick loading times and smooth interactions, even on slower mobile connections.</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">✅ Mobile Optimizations Applied</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Responsive font sizes (text-2xl on mobile)</li>
                <li>• Touch-friendly spacing and buttons</li>
                <li>• Compact hero sections (60vh on mobile)</li>
                <li>• Optimized navbar and logo sizing</li>
                <li>• Improved text contrast and readability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}