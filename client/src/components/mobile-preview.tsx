import React from 'react';
import Logo from '@/components/logo';

export default function MobilePreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-orange-600 flex items-center justify-center p-4">
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
                
                {/* Mobile App Content - Actual Landing Page Layout */}
                <div className="h-full overflow-y-auto">
                  {/* Mobile Navbar with Real Logo */}
                  <div className="bg-white shadow-sm p-3 flex justify-between items-center border-b">
                    <div className="flex items-center">
                      <Logo className="h-8 w-auto" />
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">BETA</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Hero Section with Background Image */}
                  <div 
                    className="relative h-40 bg-gradient-to-br from-blue-600 to-orange-600 flex items-center justify-center text-white"
                    style={{
                      backgroundImage: `url('/assets/travel-hero-bg.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="relative text-center px-4 z-10">
                      <h1 className="text-sm font-bold mb-2 leading-tight">
                        Where Local Experiences<br/>
                        <span className="text-orange-300">Meet WorldWide Connections</span>
                      </h1>
                      <p className="text-xs leading-relaxed opacity-90">
                        Connecting you to Nearby Locals and Travelers
                      </p>
                    </div>
                  </div>

                  {/* Beta Notice Mobile */}
                  <div className="p-3 bg-red-600 m-3 rounded-lg text-white shadow">
                    <div className="text-center">
                      <div className="text-xs font-bold mb-1">🚀 BETA NOTICE</div>
                      <div className="text-xs">Currently featuring Los Angeles events and businesses</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-3 pb-3">
                    <div className="flex gap-2">
                      <button className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white py-2 px-3 rounded-lg text-xs font-semibold">
                        Join Beta Now
                      </button>
                      <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-xs font-semibold">
                        Learn More
                      </button>
                    </div>
                  </div>

                  {/* Feature Cards Mobile */}
                  <div className="p-3 space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow border">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">1</div>
                        <h3 className="text-sm font-semibold">Find Travel Companions</h3>
                      </div>
                      <p className="text-xs text-gray-600 ml-11">Connect with like-minded travelers and locals based on shared interests</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow border">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">2</div>
                        <h3 className="text-sm font-semibold">Discover Local Experiences</h3>
                      </div>
                      <p className="text-xs text-gray-600 ml-11">Join events and activities hosted by locals who know the best spots</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow border">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">3</div>
                        <h3 className="text-sm font-semibold">Get Insider Knowledge</h3>
                      </div>
                      <p className="text-xs text-gray-600 ml-11">Access hidden gems and local secrets from residents and experienced travelers</p>
                    </div>

                    {/* Statistics Row */}
                    <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-3 border">
                      <div className="flex justify-between text-center">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-blue-600">95%</div>
                          <div className="text-xs text-gray-600">Mobile Users</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-orange-600">50+</div>
                          <div className="text-xs text-gray-600">Cities</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-green-600">1000+</div>
                          <div className="text-xs text-gray-600">Connections</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-20 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Phone Label */}
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold text-white mb-1">Perfect Mobile Experience</h3>
              <p className="text-sm text-gray-200">See exactly how travelers will experience your app</p>
            </div>
          </div>
        </div>

        {/* Desktop Description */}
        <div className="flex-1 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Perfect Mobile Experience</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-lg border border-white/20">
              <h3 className="font-semibold text-white mb-2">📱 Mobile-First Design</h3>
              <p className="text-sm text-gray-100">95% of travelers use phones while exploring. Every element is optimized for mobile touch and viewing.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-lg border border-white/20">
              <h3 className="font-semibold text-white mb-2">🎯 Touch-Friendly Interface</h3>
              <p className="text-sm text-gray-100">Large dropdowns, easy navigation, and readable text sizes perfect for travelers on the go.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-lg border border-white/20">
              <h3 className="font-semibold text-white mb-2">⚡ Smart Filters</h3>
              <p className="text-sm text-gray-100">Advanced filters become clean dropdowns on mobile - no more tiny buttons to tap.</p>
            </div>

            <div className="bg-green-400/20 backdrop-blur-lg p-4 rounded-lg border border-green-300/30">
              <h3 className="font-semibold text-green-100 mb-2">✅ Mobile Optimizations Applied</h3>
              <ul className="text-sm text-green-100 space-y-1">
                <li>• Dropdown-based advanced filters</li>
                <li>• Touch-friendly button sizing (h-12)</li>
                <li>• Optimized logo sizing (h-10 mobile)</li>
                <li>• Scrollable content areas</li>
                <li>• Real logo and navbar components</li>
              </ul>
            </div>

            <div className="text-center">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Try Mobile Experience
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}