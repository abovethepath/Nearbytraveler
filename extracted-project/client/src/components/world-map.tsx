import { useState } from "react";
import { Globe, MapPin } from "lucide-react";

interface WorldMapProps {
  visitedCountries: string[];
}

// World map coordinates for realistic positioning on actual world map
const COUNTRY_COORDINATES: Record<string, { x: number; y: number; name: string }> = {
  // North America
  "United States": { x: 20, y: 45, name: "United States" },
  "Canada": { x: 18, y: 30, name: "Canada" },
  "Mexico": { x: 17, y: 55, name: "Mexico" },
  
  // Caribbean
  "Cuba": { x: 25, y: 58, name: "Cuba" },
  "Jamaica": { x: 26, y: 60, name: "Jamaica" },
  "Dominican Republic": { x: 28, y: 59, name: "Dominican Republic" },
  "Haiti": { x: 27, y: 59, name: "Haiti" },
  "Puerto Rico": { x: 29, y: 60, name: "Puerto Rico" },
  "Bahamas": { x: 26, y: 56, name: "Bahamas" },
  "Barbados": { x: 32, y: 64, name: "Barbados" },
  "Trinidad and Tobago": { x: 33, y: 67, name: "Trinidad and Tobago" },
  "Antigua and Barbuda": { x: 31, y: 61, name: "Antigua and Barbuda" },
  "Saint Lucia": { x: 32, y: 64, name: "Saint Lucia" },
  "Grenada": { x: 32, y: 65, name: "Grenada" },
  "Saint Vincent and the Grenadines": { x: 32, y: 64, name: "Saint Vincent and the Grenadines" },
  "Saint Kitts and Nevis": { x: 31, y: 61, name: "Saint Kitts and Nevis" },
  "Dominica": { x: 32, y: 62, name: "Dominica" },
  "Aruba": { x: 30, y: 65, name: "Aruba" },
  "Curacao": { x: 30, y: 65, name: "Curacao" },
  
  // Europe
  "United Kingdom": { x: 49, y: 35, name: "United Kingdom" },
  "Ireland": { x: 47, y: 37, name: "Ireland" },
  "France": { x: 51, y: 40, name: "France" },
  "Germany": { x: 53, y: 37, name: "Germany" },
  "Italy": { x: 54, y: 45, name: "Italy" },
  "Spain": { x: 48, y: 47, name: "Spain" },
  "Portugal": { x: 46, y: 48, name: "Portugal" },
  "Netherlands": { x: 52, y: 36, name: "Netherlands" },
  "Belgium": { x: 51, y: 37, name: "Belgium" },
  "Switzerland": { x: 53, y: 41, name: "Switzerland" },
  "Austria": { x: 54, y: 40, name: "Austria" },
  "Czech Republic": { x: 55, y: 38, name: "Czech Republic" },
  "Poland": { x: 56, y: 36, name: "Poland" },
  "Hungary": { x: 56, y: 40, name: "Hungary" },
  "Greece": { x: 58, y: 48, name: "Greece" },
  "Turkey": { x: 62, y: 48, name: "Turkey" },
  "Norway": { x: 53, y: 25, name: "Norway" },
  "Sweden": { x: 55, y: 27, name: "Sweden" },
  "Denmark": { x: 53, y: 33, name: "Denmark" },
  "Finland": { x: 58, y: 25, name: "Finland" },
  "Iceland": { x: 43, y: 22, name: "Iceland" },
  "Russia": { x: 68, y: 30, name: "Russia" },
  "Vatican City": { x: 54, y: 45, name: "Vatican City" },
  
  // Asia
  "China": { x: 77, y: 42, name: "China" },
  "Japan": { x: 84, y: 43, name: "Japan" },
  "South Korea": { x: 82, y: 44, name: "South Korea" },
  "India": { x: 72, y: 52, name: "India" },
  "Thailand": { x: 76, y: 59, name: "Thailand" },
  "Vietnam": { x: 78, y: 59, name: "Vietnam" },
  "Indonesia": { x: 80, y: 70, name: "Indonesia" },
  "Malaysia": { x: 76, y: 64, name: "Malaysia" },
  "Singapore": { x: 77, y: 65, name: "Singapore" },
  "Philippines": { x: 82, y: 62, name: "Philippines" },
  "Israel": { x: 60, y: 50, name: "Israel" },
  
  // Africa
  "Egypt": { x: 59, y: 52, name: "Egypt" },
  "Morocco": { x: 47, y: 55, name: "Morocco" },
  "South Africa": { x: 58, y: 80, name: "South Africa" },
  "Kenya": { x: 62, y: 65, name: "Kenya" },
  "Nigeria": { x: 53, y: 62, name: "Nigeria" },
  "Ghana": { x: 50, y: 62, name: "Ghana" },
  
  // South America
  "Brazil": { x: 32, y: 72, name: "Brazil" },
  "Argentina": { x: 30, y: 85, name: "Argentina" },
  "Chile": { x: 27, y: 82, name: "Chile" },
  "Peru": { x: 24, y: 72, name: "Peru" },
  "Colombia": { x: 22, y: 64, name: "Colombia" },
  "Venezuela": { x: 27, y: 62, name: "Venezuela" },
  "Ecuador": { x: 22, y: 69, name: "Ecuador" },
  "Uruguay": { x: 32, y: 85, name: "Uruguay" },
  "Paraguay": { x: 31, y: 80, name: "Paraguay" },
  "Bolivia": { x: 27, y: 75, name: "Bolivia" },
  
  // Oceania
  "Australia": { x: 84, y: 82, name: "Australia" },
  "New Zealand": { x: 90, y: 90, name: "New Zealand" },
  "Fiji": { x: 92, y: 77, name: "Fiji" },
};

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const visitedCoordinates = visitedCountries
    .map(country => COUNTRY_COORDINATES[country])
    .filter(Boolean);

  return (
    <div className="w-screen bg-gradient-to-b from-blue-25 to-white py-16 -mx-[50vw] ml-[50%] mt-8 border-t border-gray-200" style={{background: 'linear-gradient(to bottom, #f8fafc, #ffffff)'}}>
      <div className="w-full px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 text-gray-800 mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
              Countries I've Visited
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            Exploring {visitedCountries.length} countries around the world
          </p>
        </div>
        
        <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-7xl mx-auto">
          {/* Enhanced World Map SVG */}
          <svg
            viewBox="0 0 100 50"
            className="w-full h-64 md:h-80 lg:h-96"
            style={{ aspectRatio: '2/1' }}
          >
            <defs>
              {/* Clean ocean gradient */}
              <linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#7DD3FC" />
              </linearGradient>
              
              {/* Land gradient - clean green */}
              <linearGradient id="land" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BBF7D0" />
                <stop offset="50%" stopColor="#86EFAC" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
              
              {/* Pin glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Subtle shadow */}
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {/* Ocean background - flat globe style */}
            <ellipse cx="50" cy="25" rx="48" ry="23" fill="url(#ocean)" stroke="#0EA5E9" strokeWidth="0.2" />
            
            {/* Realistic continent shapes for flat globe projection */}
            {/* North America */}
            <path d="M10,20 Q15,15 20,18 Q28,14 32,20 Q35,25 32,30 Q28,35 24,38 Q18,42 14,44 Q8,42 6,36 Q4,28 10,20 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* South America */}
            <path d="M22,38 Q26,36 30,40 Q34,44 36,50 Q38,58 36,66 Q34,74 30,76 Q26,74 22,70 Q18,66 16,58 Q15,50 18,42 Q20,38 22,38 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* Europe */}
            <path d="M44,18 Q48,15 52,17 Q56,19 58,23 Q56,27 54,29 Q50,31 46,29 Q42,25 44,18 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* Africa */}
            <path d="M46,28 Q50,26 54,30 Q58,34 56,42 Q54,50 52,56 Q50,62 46,60 Q42,56 40,50 Q38,42 40,34 Q42,28 46,28 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* Asia */}
            <path d="M58,16 Q68,12 78,16 Q86,20 84,28 Q82,36 78,40 Q72,42 66,38 Q60,34 58,28 Q56,22 58,16 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* Australia */}
            <path d="M78,42 Q84,40 88,44 Q86,48 82,48 Q78,46 78,42 Z" 
                  fill="url(#land)" stroke="#22C55E" strokeWidth="0.1" filter="url(#shadow)" />
            
            {/* Country pins with clean styling */}
            {visitedCoordinates.map((coord, index) => (
              <g key={index}>
                {/* Glow effect */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={hoveredCountry === coord.name ? "1.8" : "1.4"}
                  fill="#3B82F6"
                  opacity="0.2"
                  filter="url(#glow)"
                  className="transition-all duration-300"
                />
                {/* Main pin */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={hoveredCountry === coord.name ? "1.0" : "0.8"}
                  fill="#2563EB"
                  stroke="#ffffff"
                  strokeWidth="0.3"
                  filter="url(#shadow)"
                  className="cursor-pointer transition-all duration-300 hover:fill-blue-700"
                  onMouseEnter={() => setHoveredCountry(coord.name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
                {/* Inner highlight */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="0.3"
                  fill="#ffffff"
                  opacity="0.8"
                  className="pointer-events-none"
                />
              </g>
            ))}
            
            {/* Clean hover tooltip */}
            {hoveredCountry && (
              <g>
                <rect
                  x="2"
                  y="2"
                  width="25"
                  height="5"
                  fill="#ffffff"
                  fillOpacity="0.95"
                  rx="1"
                  stroke="#2563EB"
                  strokeWidth="0.2"
                  filter="url(#shadow)"
                />
                <text
                  x="14.5"
                  y="5"
                  textAnchor="middle"
                  fill="#1e40af"
                  fontSize="1.6"
                  className="font-semibold"
                >
                  {hoveredCountry}
                </text>
              </g>
            )}
          </svg>
          
          {/* Clean statistics bar */}
          <div className="mt-8 flex justify-center items-center gap-8 text-gray-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{visitedCountries.length}</div>
              <div className="text-sm font-medium">Countries</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{Math.round((visitedCountries.length / 195) * 100)}%</div>
              <div className="text-sm font-medium">World Explored</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">6</div>
              <div className="text-sm font-medium">Continents</div>
            </div>
          </div>
          
          {visitedCountries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Globe className="w-20 h-20 mx-auto mb-6 opacity-30" />
                <p className="text-xl font-medium mb-2 text-gray-700">Start Your Journey</p>
                <p className="text-sm">Add countries to see your travel map come to life</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}