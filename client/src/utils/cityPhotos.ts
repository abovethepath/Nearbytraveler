// City photo utility - provides authentic city photos from Unsplash
export function getCityPhotoUrl(cityName: string, countryName?: string): string {
  // Clean city name for URL
  const cleanCity = cityName.replace(/,.*/, '').trim(); // Remove state/region info
  const searchTerm = countryName 
    ? `${cleanCity}+${countryName}+skyline+cityscape`
    : `${cleanCity}+skyline+cityscape`;
  
  // Use Unsplash Source API for reliable city photos
  // This returns actual photos of the specified city
  return `https://source.unsplash.com/1200x600/?${encodeURIComponent(searchTerm)}`;
}

// Specific city photo mappings for better accuracy
const CITY_PHOTO_MAPPINGS: { [key: string]: string } = {
  'Los Angeles': 'https://source.unsplash.com/1200x600/?los+angeles+downtown+skyline',
  'New York': 'https://source.unsplash.com/1200x600/?new+york+city+manhattan+skyline',
  'Manhattan': 'https://source.unsplash.com/1200x600/?manhattan+new+york+skyline',
  'Paris': 'https://source.unsplash.com/1200x600/?paris+france+eiffel+tower+cityscape',
  'London': 'https://source.unsplash.com/1200x600/?london+england+big+ben+cityscape',
  'Tokyo': 'https://source.unsplash.com/1200x600/?tokyo+japan+shibuya+skyline',
  'Sydney': 'https://source.unsplash.com/1200x600/?sydney+australia+opera+house+harbor',
  'Rome': 'https://source.unsplash.com/1200x600/?rome+italy+colosseum+cityscape',
  'Barcelona': 'https://source.unsplash.com/1200x600/?barcelona+spain+sagrada+familia+cityscape',
  'Berlin': 'https://source.unsplash.com/1200x600/?berlin+germany+brandenburg+gate+cityscape',
  'Amsterdam': 'https://source.unsplash.com/1200x600/?amsterdam+netherlands+canals+cityscape',
  'Vienna': 'https://source.unsplash.com/1200x600/?vienna+austria+cityscape+architecture',
  'Prague': 'https://source.unsplash.com/1200x600/?prague+czech+republic+old+town+cityscape',
  'Budapest': 'https://source.unsplash.com/1200x600/?budapest+hungary+parliament+danube+cityscape',
  'Austin': 'https://source.unsplash.com/1200x600/?austin+texas+downtown+skyline',
  'San Francisco': 'https://source.unsplash.com/1200x600/?san+francisco+golden+gate+bridge+skyline',
  'Chicago': 'https://source.unsplash.com/1200x600/?chicago+illinois+downtown+skyline',
  'Miami': 'https://source.unsplash.com/1200x600/?miami+florida+south+beach+skyline',
  'Seattle': 'https://source.unsplash.com/1200x600/?seattle+washington+space+needle+skyline',
  'Boston': 'https://source.unsplash.com/1200x600/?boston+massachusetts+downtown+skyline',
};

// Enhanced city photo mappings with high-quality Unsplash images
const ENHANCED_CITY_PHOTOS: { [key: string]: string } = {
  ...CITY_PHOTO_MAPPINGS,
  'Milan': 'https://images.unsplash.com/photo-1543832923-44667a44c804?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 
  'Florence': 'https://images.unsplash.com/photo-1580654712603-eb43273aff33?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Venice': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Lisbon': 'https://images.unsplash.com/photo-1588558789915-d8b4df0a7e6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Stockholm': 'https://images.unsplash.com/photo-1508189860359-777d945909d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Zurich': 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Brussels': 'https://images.unsplash.com/photo-1559564484-90b23d32b2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Helsinki': 'https://images.unsplash.com/photo-1539650116574-75c0c6d0ac10?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Oslo': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Philadelphia': 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Portland': 'https://images.unsplash.com/photo-1512731734637-21d3ad8f9fe5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Denver': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Nashville': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Las Vegas': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'San Diego': 'https://images.unsplash.com/photo-1544892504-5a42d285ab6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Montreal': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Vancouver': 'https://images.unsplash.com/photo-1549171024-9eb169fc7e9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  'Toronto': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
};

export function getOptimizedCityPhoto(cityName: string, countryName?: string): string {
  // Check if we have a specific mapping for this city
  const normalizedCity = cityName.trim();
  
  if (ENHANCED_CITY_PHOTOS[normalizedCity]) {
    return ENHANCED_CITY_PHOTOS[normalizedCity];
  }
  
  // Fall back to generic city photo generation
  return getCityPhotoUrl(cityName, countryName);
}