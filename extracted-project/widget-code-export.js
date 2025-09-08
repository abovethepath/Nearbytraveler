// COMPLETE WIDGET CODE FOR BUSINESS PROFILE EDITING

// 1. LOCATION SHARING WIDGET
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader } from 'lucide-react';

const LocationSharingWidget = ({ userId, onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const locationData = {
            latitude,
            longitude,
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            country: data.address?.country
          };
          
          setLocation(locationData);
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }
        } catch (err) {
          setError('Failed to get address information.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to get your location. Please check your permissions.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Share Business Location
      </h3>
      
      <Button 
        onClick={getCurrentLocation} 
        disabled={loading}
        className="w-full mb-3"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Getting Location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Get Current Location
          </>
        )}
      </Button>

      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}

      {location && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium">Current Location:</p>
          <p>{location.address}</p>
          <p className="text-xs text-gray-500 mt-1">
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

// 2. QUICK DEALS WIDGET
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Clock, DollarSign } from 'lucide-react';

const QuickDealsWidget = ({ businessId, deals = [] }) => {
  const [activeDeal, setActiveDeal] = useState(null);

  const createQuickDeal = async (dealData) => {
    try {
      const response = await fetch('/api/quick-deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': businessId,
          'x-user-type': 'business'
        },
        body: JSON.stringify({
          businessId,
          title: dealData.title,
          description: dealData.description,
          originalPrice: dealData.originalPrice,
          discountedPrice: dealData.discountedPrice,
          expiresAt: dealData.expiresAt,
          isActive: true
        })
      });
      
      if (response.ok) {
        const newDeal = await response.json();
        setActiveDeal(newDeal);
      }
    } catch (error) {
      console.error('Failed to create quick deal:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Zap className="w-5 h-5" />
          Quick Deals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deals.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No active deals</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => {/* Open deal creator */}}
              >
                Create Deal
              </Button>
            </div>
          ) : (
            deals.map(deal => (
              <div key={deal.id} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{deal.title}</h4>
                  <Badge variant={deal.isActive ? "default" : "secondary"}>
                    {deal.isActive ? "Active" : "Expired"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {deal.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-orange-600">
                      ${deal.discountedPrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${deal.originalPrice}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Expires {new Date(deal.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 3. BUSINESS EVENTS WIDGET
const BusinessEventsWidget = ({ businessId, events = [] }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Calendar className="w-5 h-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No upcoming events</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => {/* Open event creator */}}
              >
                Create Event
              </Button>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(event.startTime).toLocaleDateString()}</span>
                  <span>{event.attendees || 0} attending</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 4. BUSINESS STATS WIDGET
const BusinessStatsWidget = ({ stats }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-600">Business Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats?.views || 0}
            </div>
            <div className="text-xs text-gray-600">Profile Views</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.connections || 0}
            </div>
            <div className="text-xs text-gray-600">Connections</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.deals || 0}
            </div>
            <div className="text-xs text-gray-600">Active Deals</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.events || 0}
            </div>
            <div className="text-xs text-gray-600">Events Hosted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 5. CUSTOMER PHOTOS WIDGET
const CustomerPhotosWidget = ({ businessId, photos = [] }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Customer Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No customer photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map(photo => (
              <img
                key={photo.id}
                src={photo.imageUrl}
                alt={photo.caption}
                className="w-full h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 6. COMPLETE WIDGET LAYOUT FOR BUSINESS PROFILE
const BusinessProfileWidgets = ({ user, businessStats }) => {
  return (
    <div className="space-y-4">
      {/* Location Sharing */}
      <LocationSharingWidget 
        userId={user.id}
        onLocationUpdate={(location) => {
          console.log('Location updated:', location);
        }}
      />
      
      {/* Business Stats */}
      <BusinessStatsWidget stats={businessStats} />
      
      {/* Quick Deals */}
      <QuickDealsWidget 
        businessId={user.id}
        deals={user.quickDeals || []}
      />
      
      {/* Business Events */}
      <BusinessEventsWidget 
        businessId={user.id}
        events={user.events || []}
      />
      
      {/* Customer Photos */}
      <CustomerPhotosWidget 
        businessId={user.id}
        photos={user.customerPhotos || []}
      />
    </div>
  );
};

export {
  LocationSharingWidget,
  QuickDealsWidget,
  BusinessEventsWidget,
  BusinessStatsWidget,
  CustomerPhotosWidget,
  BusinessProfileWidgets
};