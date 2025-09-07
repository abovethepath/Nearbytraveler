import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Plane,
  Hotel,
  Car,
  Utensils,
  Camera,
  DollarSign,
  Share,
  Plus,
  Edit,
  Trash2,
  Sun,
  Cloud,
  Users,
  Star,
  Navigation,
  MessageCircle,
  Download,
  Mail
} from 'lucide-react';

interface TravelPlan {
  id: number;
  destination: string;
  destinationCity: string;
  destinationState?: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  accommodation?: string;
  transportation?: string;
  notes?: string;
  budget?: number;
}

interface ItineraryItem {
  id?: number;
  type: 'flight' | 'accommodation' | 'activity' | 'restaurant' | 'transportation' | 'note';
  title: string;
  description: string;
  location?: string;
  date: string;
  time?: string;
  cost?: number;
  bookingUrl?: string;
  contactInfo?: string;
  notes?: string;
}

interface ComprehensiveItineraryProps {
  travelPlan: TravelPlan;
  onShare?: () => void;
  isSharing?: boolean;
}

export default function ComprehensiveItinerary({ travelPlan, onShare, isSharing }: ComprehensiveItineraryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // Generate date range for the trip
  const dateRange = useMemo(() => {
    const start = new Date(travelPlan.startDate);
    const end = new Date(travelPlan.endDate);
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [travelPlan.startDate, travelPlan.endDate]);

  // Fetch travel plan itineraries
  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`],
    queryFn: async () => {
      const response = await fetch(`/api/travel-plans/${travelPlan.id}/itineraries`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Get all itinerary items from all itineraries for this travel plan
  const itineraryItems = useMemo(() => {
    return itineraries.flatMap((itinerary: any) => itinerary.items || []);
  }, [itineraries]);

  // Fetch weather for the destination
  const { data: weather } = useQuery({
    queryKey: [`/api/weather`],
    queryFn: async () => {
      const response = await fetch(`/api/weather?city=${travelPlan.destinationCity}&country=${travelPlan.destinationCountry}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Group items by date
  const itemsByDate = useMemo(() => {
    return itineraryItems.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, ItineraryItem[]>);
  }, [itineraryItems]);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return itineraryItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [itineraryItems]);

  // Add itinerary item mutation
  const addItem = useMutation({
    mutationFn: async (item: Partial<ItineraryItem>) => {
      // First, ensure we have an itinerary for this travel plan
      let itineraryId = itineraries[0]?.id;
      if (!itineraryId) {
        // Create a default itinerary if none exists
        const itineraryResponse = await fetch('/api/itineraries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            travelPlanId: travelPlan.id,
            title: `${travelPlan.destination} Itinerary`,
            description: 'Main travel itinerary'
          }),
        });
        if (!itineraryResponse.ok) throw new Error('Failed to create itinerary');
        const newItinerary = await itineraryResponse.json();
        itineraryId = newItinerary.id;
      }

      const response = await fetch(`/api/itineraries/${itineraryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      setNewItem({});
      setShowAddItem(false);
      toast({ title: 'Success', description: 'Item added to itinerary' });
    },
  });

  // Update itinerary item mutation
  const updateItem = useMutation({
    mutationFn: async (item: ItineraryItem) => {
      const response = await fetch(`/api/itinerary-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      setEditingItem(null);
      toast({ title: 'Success', description: 'Item updated' });
    },
  });

  // Delete itinerary item mutation
  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      toast({ title: 'Success', description: 'Item deleted' });
    },
  });

  // Share itinerary mutation
  const shareItinerary = useMutation({
    mutationFn: async (contactIds: number[]) => {
      const response = await fetch(`/api/itinerary/${travelPlan.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      });
      if (!response.ok) throw new Error('Failed to share itinerary');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Itinerary shared successfully!' });
    },
  });

  const getItemIcon = (type: ItineraryItem['type']) => {
    const icons = {
      flight: Plane,
      accommodation: Hotel,
      activity: Camera,
      restaurant: Utensils,
      transportation: Car,
      note: MessageCircle,
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4" />;
  };

  const getItemColor = (type: ItineraryItem['type']) => {
    const colors = {
      flight: 'bg-blue-100 text-blue-800 border-blue-200',
      accommodation: 'bg-green-100 text-green-800 border-green-200',
      activity: 'bg-orange-100 text-orange-800 border-orange-200',
      restaurant: 'bg-red-100 text-red-800 border-red-200',
      transportation: 'bg-purple-100 text-purple-800 border-purple-200',
      note: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[type];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{travelPlan.destination}</div>
                <div className="text-sm text-gray-500">
                  {formatDate(travelPlan.startDate)} - {formatDate(travelPlan.endDate)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onShare} variant="outline" size="sm" disabled={isSharing}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Daily Schedule</h3>
              <Button onClick={() => setShowAddItem(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dateRange.map((date) => (
                <Card key={date} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {itemsByDate[date]?.length > 0 ? (
                      itemsByDate[date]
                        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${getItemColor(item.type)} relative group`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                {getItemIcon(item.type)}
                                <div className="flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {item.title}
                                    {item.time && (
                                      <span className="text-xs opacity-75 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(item.time)}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm opacity-75 mt-1">
                                      {item.description}
                                    </div>
                                  )}
                                  {item.location && (
                                    <div className="text-xs opacity-60 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {item.location}
                                    </div>
                                  )}
                                  {item.cost && (
                                    <div className="text-xs font-medium flex items-center gap-1 mt-1">
                                      <DollarSign className="w-3 h-3" />
                                      ${item.cost}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => item.id && deleteItem.mutate(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activities planned for this day</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setNewItem({ date });
                            setShowAddItem(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Activity
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dateRange.length}</div>
                  <div className="text-sm text-gray-600">Days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Camera className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{itineraryItems.filter(i => i.type === 'activity').length}</div>
                  <div className="text-sm text-gray-600">Activities</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Utensils className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{itineraryItems.filter(i => i.type === 'restaurant').length}</div>
                  <div className="text-sm text-gray-600">Restaurants</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${totalBudget}</div>
                  <div className="text-sm text-gray-600">Budget</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="w-5 h-5" />
                    Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{travelPlan.accommodation || 'Not specified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Transportation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{travelPlan.transportation || 'Not specified'}</p>
                </CardContent>
              </Card>
            </div>

            {travelPlan.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{travelPlan.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${totalBudget}</div>
                  <div className="text-sm text-gray-600">Total Planned</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Utensils className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    ${itineraryItems.filter(i => i.type === 'restaurant').reduce((sum, i) => sum + (i.cost || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Food & Dining</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Camera className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    ${itineraryItems.filter(i => i.type === 'activity').reduce((sum, i) => sum + (i.cost || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Activities</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    itineraryItems.reduce((acc, item) => {
                      if (item.cost && item.cost > 0) {
                        if (!acc[item.type]) acc[item.type] = { total: 0, items: [] };
                        acc[item.type].total += item.cost;
                        acc[item.type].items.push(item);
                      }
                      return acc;
                    }, {} as Record<string, { total: number; items: ItineraryItem[] }>)
                  ).map(([type, data]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getItemIcon(type as ItineraryItem['type'])}
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-sm text-gray-600">({data.items.length} items)</span>
                      </div>
                      <div className="font-bold">${data.total}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {weather ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="w-5 h-5" />
                      Current Weather
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold">{Math.round(weather.current.temp_f)}°F</div>
                      <div>
                        <div className="font-medium">{weather.current.condition.text}</div>
                        <div className="text-sm text-gray-600">
                          Feels like {Math.round(weather.current.feelslike_f)}°F
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="w-5 h-5" />
                      Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Humidity</span>
                      <span>{weather.current.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wind</span>
                      <span>{weather.current.wind_mph} mph</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UV Index</span>
                      <span>{weather.current.uv}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Weather information not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        {showAddItem && (
          <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Itinerary Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newItem.type || ''}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as ItineraryItem['type'] })}
                  >
                    <option value="">Select type</option>
                    <option value="flight">Flight</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="activity">Activity</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="transportation">Transportation</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newItem.date || ''}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                  >
                    <option value="">Select date</option>
                    {dateRange.map((date) => (
                      <option key={date} value={date}>
                        {formatDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={newItem.time || ''}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newItem.title || ''}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={newItem.location || ''}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost ($)</label>
                  <Input
                    type="number"
                    value={newItem.cost || ''}
                    onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddItem(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addItem.mutate(newItem)}
                    disabled={!newItem.type || !newItem.title || !newItem.date}
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}