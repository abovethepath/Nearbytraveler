import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create colored marker icons for different types
const createColoredIcon = (color: string) => {
  // Create a colored marker using CSS styling
  const markerHtml = `
    <div style="
      width: 25px;
      height: 41px;
      position: relative;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 6px;
        left: 6px;
        transform: rotate(45deg);
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: markerHtml,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: 'custom-marker'
  });
};

// Create specific colored icons
const UserIcon = createColoredIcon('#3B82F6'); // Blue for users
const BusinessIcon = createColoredIcon('#F97316'); // Orange for businesses  
const EventIcon = createColoredIcon('#10B981'); // Green for events

// Fallback default icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapLocation {
  id: number;
  lat: number;
  lng: number;
  name: string;
  type: 'user' | 'event' | 'business';
  description?: string;
}

interface InteractiveMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function InteractiveMap({ 
  locations, 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 10,
  height = "400px"
}: InteractiveMapProps) {
  
  console.log('🗺️ InteractiveMap received:', {
    locationsCount: locations.length,
    center,
    zoom,
    firstLocation: locations[0]
  });
  
  // Return different colored markers based on location type
  const getMarkerIcon = (type: string) => {
    console.log('🎨 Getting marker icon for type:', type);
    switch (type) {
      case 'business':
        return BusinessIcon; // Orange
      case 'event':
        return EventIcon; // Green
      case 'user':
      default:
        return UserIcon; // Blue
    }
  };

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((location) => {
          console.log('🗺️ Rendering marker for:', location);
          
          // Validate coordinates
          if (isNaN(location.lat) || isNaN(location.lng)) {
            console.error('🗺️ Invalid coordinates for location:', location);
            return null;
          }
          
          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={getMarkerIcon()}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{location.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {location.type} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                  </p>
                  {location.description && (
                    <p className="text-xs mt-1">{location.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// Hook for updating map center when data changes
export function useMapCenter() {
  const map = useMap();
  
  const updateCenter = (lat: number, lng: number, zoom?: number) => {
    map.setView([lat, lng], zoom || map.getZoom());
  };
  
  return { updateCenter };
}

// Component for clustering markers when there are many
export function MapCluster({ locations, center, zoom = 10 }: InteractiveMapProps) {
  const getMarkerIcon = (type: string) => {
    const colors = {
      user: '#3b82f6',      // Blue for users
      event: '#10b981',     // Green for events  
      business: '#f59e0b'   // Orange for businesses
    };
    
    return L.divIcon({
      html: `<div style="background-color: ${colors[type as keyof typeof colors] || '#6b7280'}; width: 12px; height: 12px; border-radius: 50%; border: none; box-shadow: none; outline: none;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      className: '',
    });
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={center || [40.7128, -74.0060]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={getMarkerIcon(location.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{location.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {location.type}
                </p>
                {location.description && (
                  <p className="text-sm mt-1">{location.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}