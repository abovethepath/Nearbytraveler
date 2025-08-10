import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Home, Users, Coffee, MapPin, Calendar, MessageCircle } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HostingOffer {
  id: number;
  userId: number;
  offerType: 'couch' | 'private_room' | 'shared_room' | 'coffee_meetup' | 'city_tour' | 'local_advice';
  title: string;
  description: string;
  maxGuests: number;
  availableFrom: string;
  availableTo: string;
  isActive: boolean;
  requirements?: string;
  amenities: string[];
  responseRate: number;
  responseTime: string;
}

export function HostingOffers({ isOwnProfile = false, userId }: { isOwnProfile?: boolean; userId?: number }) {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    offerType: 'couch' as const,
    title: '',
    description: '',
    maxGuests: 1,
    availableFrom: '',
    availableTo: '',
    requirements: '',
    amenities: [] as string[]
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hostingOffers = [] } = useQuery({
    queryKey: [`/api/hosting-offers/${userId || user?.id}`],
    enabled: !!(userId || user?.id)
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: typeof newOffer) => {
      return apiRequest(`/api/hosting-offers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hosting-offers/${user?.id}`] });
      setShowCreateForm(false);
      setNewOffer({
        offerType: 'couch',
        title: '',
        description: '',
        maxGuests: 1,
        availableFrom: '',
        availableTo: '',
        requirements: '',
        amenities: []
      });
      toast({
        title: "Hosting offer created",
        description: "Your hosting offer is now live and visible to travelers",
      });
    },
    onError: (error) => {
      console.error('Error creating hosting offer:', error);
      toast({
        title: "Error",
        description: "Failed to create hosting offer",
        variant: "destructive",
      });
    },
  });

  const toggleOfferMutation = useMutation({
    mutationFn: async ({ offerId, isActive }: { offerId: number; isActive: boolean }) => {
      return apiRequest(`/api/hosting-offers/${offerId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hosting-offers/${user?.id}`] });
      toast({
        title: "Offer updated",
        description: "Your hosting offer status has been updated",
      });
    },
  });

  const offerTypeLabels = {
    couch: 'Couch/Sofa',
    private_room: 'Private Room',
    shared_room: 'Shared Room',
    coffee_meetup: 'Coffee & Chat',
    city_tour: 'City Tour Guide',
    local_advice: 'Local Advice'
  };

  const offerTypeIcons = {
    couch: Home,
    private_room: Home,
    shared_room: Users,
    coffee_meetup: Coffee,
    city_tour: MapPin,
    local_advice: MessageCircle
  };

  const amenityOptions = [
    'WiFi', 'Kitchen Access', 'Laundry', 'Parking', 'Pet Friendly', 
    'Smoking Allowed', 'Air Conditioning', 'Heating', 'Breakfast Included',
    'Local Transport Info', 'Tour Guide Services', 'Language Practice'
  ];

  const handleCreateOffer = () => {
    if (!newOffer.title || !newOffer.description) {
      toast({
        title: "Missing information",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }
    createOfferMutation.mutate(newOffer);
  };

  const toggleAmenity = (amenity: string) => {
    setNewOffer(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {isOwnProfile ? 'My Hosting Offers' : 'Hosting Offers'}
          </CardTitle>
          {isOwnProfile && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
            >
              {showCreateForm ? 'Cancel' : 'Create Offer'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold">Create New Hosting Offer</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Offer Type</label>
                <select
                  value={newOffer.offerType}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, offerType: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  {Object.entries(offerTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Guests</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newOffer.maxGuests}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, maxGuests: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={newOffer.title}
                onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Cozy couch in downtown apartment"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newOffer.description}
                onChange={(e) => setNewOffer(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your offer, location, house rules, and what guests can expect..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Available From</label>
                <input
                  type="date"
                  value={newOffer.availableFrom}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, availableFrom: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Available To</label>
                <input
                  type="date"
                  value={newOffer.availableTo}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, availableTo: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Requirements/House Rules</label>
              <Textarea
                value={newOffer.requirements}
                onChange={(e) => setNewOffer(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Any requirements for guests (e.g., no smoking, remove shoes, etc.)"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amenities & Services</label>
              <div className="grid grid-cols-3 gap-2">
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newOffer.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded"
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateOffer}
                disabled={createOfferMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {createOfferMutation.isPending ? 'Creating...' : 'Create Offer'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {hostingOffers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isOwnProfile ? (
              <div>
                <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hosting offers yet</p>
                <p className="text-sm">Create your first offer to help fellow travelers</p>
              </div>
            ) : (
              <div>
                <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hosting offers available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {hostingOffers.map((offer: HostingOffer) => {
              const IconComponent = offerTypeIcons[offer.offerType];
              return (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">{offer.title}</h4>
                      <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {isOwnProfile && (
                      <Switch
                        checked={offer.isActive}
                        onCheckedChange={(checked) => 
                          toggleOfferMutation.mutate({ offerId: offer.id, isActive: checked })
                        }
                      />
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400">{offer.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Up to {offer.maxGuests} guests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(offer.availableFrom).toLocaleDateString('en-US', { 
                        year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                        month: 'short', 
                        day: 'numeric' 
                      })} - {new Date(offer.availableTo).toLocaleDateString('en-US', { 
                        year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>

                  {offer.amenities && offer.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {offer.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {offer.requirements && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Requirements:</strong> {offer.requirements}
                    </div>
                  )}

                  {!isOwnProfile && offer.isActive && (
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Request
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}