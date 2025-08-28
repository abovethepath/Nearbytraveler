import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Clock, MapPin, DollarSign, Share2, Copy, Edit, Trash2, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ItineraryItem {
  id?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  title: string;
  description?: string;
  location?: string;
  address?: string;
  category?: string;
  cost?: number;
  currency?: string;
  duration?: number;
  notes?: string;
  url?: string;
  phoneNumber?: string;
  orderIndex: number;
  isCompleted?: boolean;
}

interface TripItinerary {
  id?: number;
  travelPlanId: number;
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  items?: ItineraryItem[];
}

interface TravelPlan {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
}

interface ItineraryPageProps {
  travelPlanId?: string;
}

const categories = [
  "Food", "Sightseeing", "Transport", "Accommodation", "Shopping", 
  "Entertainment", "Culture", "Nature", "Sports", "Business", "Other"
];

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"];

export default function ItineraryPage({ travelPlanId: propTravelPlanId }: ItineraryPageProps = {}) {
  const [, params] = useRoute("/itinerary/:travelPlanId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedItinerary, setSelectedItinerary] = useState<TripItinerary | null>(null);
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [newItinerary, setNewItinerary] = useState<TripItinerary>({
    travelPlanId: parseInt(params?.travelPlanId || "0"),
    title: "",
    description: "",
    isPublic: false,
    tags: []
  });
  const [newItem, setNewItem] = useState<ItineraryItem>({
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    title: "",
    description: "",
    location: "",
    category: "Sightseeing",
    orderIndex: 0
  });

  const travelPlanId = parseInt(propTravelPlanId || params?.travelPlanId || "0");

  // Fetch travel plan details
  const { data: travelPlan } = useQuery<TravelPlan>({
    queryKey: [`/api/travel-plans/${travelPlanId}`],
    enabled: !!travelPlanId
  });

  // Fetch itineraries for this travel plan
  const { data: itineraries = [], isLoading } = useQuery<TripItinerary[]>({
    queryKey: [`/api/itineraries/travel-plan/${travelPlanId}`],
    enabled: !!travelPlanId
  });

  // Fetch detailed itinerary with items
  const { data: itineraryDetails } = useQuery<TripItinerary & { items: ItineraryItem[] }>({
    queryKey: [`/api/itineraries/${selectedItinerary?.id}`],
    enabled: !!selectedItinerary?.id
  });

  // Create itinerary mutation
  const createItineraryMutation = useMutation({
    mutationFn: (itinerary: TripItinerary) => 
      apiRequest("POST", "/api/itineraries", itinerary).then(res => res.json()),
    onSuccess: (data: TripItinerary) => {
      queryClient.invalidateQueries({ queryKey: [`/api/itineraries/travel-plan/${travelPlanId}`] });
      setSelectedItinerary(data);
      setIsCreatingItinerary(false);
      toast({ title: "Itinerary created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create itinerary", variant: "destructive" });
    }
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (item: ItineraryItem) => 
      apiRequest("POST", `/api/itineraries/${selectedItinerary?.id}/items`, item).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/itineraries/${selectedItinerary?.id}`] });
      setIsAddingItem(false);
      setNewItem({
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        title: "",
        description: "",
        location: "",
        category: "Sightseeing",
        orderIndex: 0
      });
      toast({ title: "Activity added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add activity", variant: "destructive" });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ItineraryItem> }) =>
      apiRequest("PUT", `/api/itinerary-items/${id}`, updates).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/itineraries/${selectedItinerary?.id}`] });
      setEditingItem(null);
      toast({ title: "Activity updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update activity", variant: "destructive" });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/itinerary-items/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/itineraries/${selectedItinerary?.id}`] });
      toast({ title: "Activity deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete activity", variant: "destructive" });
    }
  });

  // Share itinerary mutation
  const shareItineraryMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/itineraries/${selectedItinerary?.id}/share`, {
        shareType: "link",
        canCopy: true
      }).then(res => res.json()),
    onSuccess: (data: { shareToken: string }) => {
      navigator.clipboard.writeText(`${window.location.origin}/shared-itinerary/${data.shareToken}`);
      toast({ title: "Share link copied to clipboard!" });
    },
    onError: () => {
      toast({ title: "Failed to create share link", variant: "destructive" });
    }
  });

  const handleCreateItinerary = () => {
    if (!newItinerary.title.trim()) {
      toast({ title: "Please enter a title for your itinerary", variant: "destructive" });
      return;
    }
    createItineraryMutation.mutate(newItinerary);
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) {
      toast({ title: "Please enter a title for this activity", variant: "destructive" });
      return;
    }
    
    const itemsCount = itineraryDetails?.items?.length || 0;
    createItemMutation.mutate({
      ...newItem,
      orderIndex: itemsCount
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem?.id) return;
    updateItemMutation.mutate({
      id: editingItem.id,
      updates: editingItem
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'pm' : 'am';
    return `${hour12}:${minutes}${ampm}`;
  };

  const groupItemsByDate = (items: ItineraryItem[]) => {
    const grouped: { [key: string]: ItineraryItem[] } = {};
    items.forEach(item => {
      console.log('Processing item for grouping:', item);
      if (!item.date) {
        console.log('Skipping item without date:', item);
        return; // Skip items without dates
      }
      const dateKey = typeof item.date === 'string' 
        ? item.date.split('T')[0] 
        : new Date(item.date).toISOString().split('T')[0];
      console.log('Generated date key:', dateKey);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    // Sort items within each day by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
      });
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black dark:text-white">Loading itineraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => window.history.back()}
            className="mb-4 bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            ← Back
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Trip Itineraries
              </h1>
              {travelPlan && (
                <p className="text-black dark:text-gray-300 text-lg">
                  {travelPlan.destination} • {travelPlan.startDate ? new Date(travelPlan.startDate).toLocaleDateString() : 'N/A'} - {travelPlan.endDate ? new Date(travelPlan.endDate).toLocaleDateString() : 'N/A'}
                </p>
              )}
            </div>
            
            <Dialog open={isCreatingItinerary} onOpenChange={setIsCreatingItinerary}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Itinerary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-black dark:text-white">Create New Itinerary</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-black dark:text-white">Title</Label>
                    <Input
                      value={newItinerary.title}
                      onChange={(e) => setNewItinerary(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Milan Food & Culture Tour"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-black dark:text-white">Description</Label>
                    <Textarea
                      value={newItinerary.description || ""}
                      onChange={(e) => setNewItinerary(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your itinerary..."
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newItinerary.isPublic}
                      onChange={(e) => setNewItinerary(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                    <Label className="text-black dark:text-white">Make this itinerary public</Label>
                  </div>
                  <Button 
                    onClick={handleCreateItinerary} 
                    className="w-full bg-black text-white hover:bg-gray-800"
                    disabled={createItineraryMutation.isPending}
                  >
                    {createItineraryMutation.isPending ? "Creating..." : "Create Itinerary"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Itinerary List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Your Itineraries</h2>
            <div className="space-y-3">
              {itineraries.map((itinerary: TripItinerary) => (
                <Card 
                  key={itinerary.id}
                  className={`cursor-pointer transition-all ${
                    selectedItinerary?.id === itinerary.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedItinerary(itinerary)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-black dark:text-white">{itinerary.title}</h3>
                    {itinerary.description && (
                      <p className="text-black dark:text-gray-300 text-sm mt-1">{itinerary.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {itinerary.isPublic && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                      {itinerary.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {itineraries.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-black dark:text-gray-300 mb-4">No itineraries yet</p>
                    <Button 
                      onClick={() => setIsCreatingItinerary(true)}
                      className="bg-gradient-to-r from-blue-600 to-orange-600 text-white"
                    >
                      Create Your First Itinerary
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Itinerary Details */}
          <div className="lg:col-span-2">
            {selectedItinerary ? (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">{selectedItinerary.title}</h2>
                    {selectedItinerary.description && (
                      <p className="text-black dark:text-gray-300 mt-1">{selectedItinerary.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/itinerary/${selectedItinerary.id}?share=true`;
                        navigator.clipboard.writeText(shareUrl);
                        toast({ title: "Share link copied to clipboard!" });
                      }}
                      className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white border border-slate-600 shadow-lg"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Itinerary
                    </Button>
                    
                    <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border border-emerald-500 shadow-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Activity
                        </Button>
                      </DialogTrigger>
                      <DialogContent 
                        className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-black dark:text-white">Add New Activity</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                          <div>
                            <Label className="text-black dark:text-white">Date</Label>
                            <Input
                              type="date"
                              value={newItem.date}
                              onChange={(e) => setNewItem(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Start Time</Label>
                            <Input
                              type="time"
                              value={newItem.startTime || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, startTime: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-black dark:text-white">Activity Title</Label>
                            <Input
                              value={newItem.title}
                              onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Walking Tour of Historic Center"
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Location</Label>
                            <Input
                              value={newItem.location || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., Piazza del Duomo"
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Address</Label>
                            <Input
                              value={newItem.address || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Full address for calendar display"
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Category</Label>
                            <Select value={newItem.category || ""} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Cost</Label>
                            <Input
                              type="number"
                              value={newItem.cost || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label className="text-black dark:text-white">Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={newItem.duration || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                              placeholder="90"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-black dark:text-white">Description</Label>
                            <Textarea
                              value={newItem.description || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Additional details about this activity..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-black dark:text-white">Notes</Label>
                            <Textarea
                              value={newItem.notes || ""}
                              onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Personal notes, tips, or reminders..."
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={handleAddItem} 
                            className="bg-black text-white hover:bg-gray-800"
                            disabled={createItemMutation.isPending}
                          >
                            {createItemMutation.isPending ? "Adding..." : "Add Activity"}
                          </Button>
                          <Button 
                            onClick={() => setIsAddingItem(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Daily Schedule */}
                {itineraryDetails?.items && itineraryDetails.items.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(groupItemsByDate(itineraryDetails.items)).map(([date, items]) => (
                      <div key={date}>
                        <h3 className="text-xl font-semibold text-black mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          {formatDate(date)}
                        </h3>
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                          {items.map((item: ItineraryItem, index) => (
                            <div key={item.id} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                {/* Calendar format: "Tuesday 11am walking tour [address]" */}
                                <div className="text-black font-medium text-lg leading-tight">
                                  {item.startTime && (
                                    <span className="text-blue-600 font-semibold mr-2">
                                      {formatTimeForDisplay(item.startTime)}
                                    </span>
                                  )}
                                  <span className="mr-2">{item.title}</span>
                                  {item.address && (
                                    <span className="text-gray-600 text-base">
                                      [{item.address}]
                                    </span>
                                  )}
                                  {item.location && !item.address && (
                                    <span className="text-gray-600 text-base">
                                      [{item.location}]
                                    </span>
                                  )}
                                </div>
                                
                                {item.description && (
                                  <p className="text-gray-700 text-sm mt-2 ml-2 italic">{item.description}</p>
                                )}
                                
                                <div className="flex items-center gap-2 mt-2 ml-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {item.category}
                                  </Badge>
                                  {item.cost && (
                                    <Badge variant="outline" className="text-xs">
                                      ${item.cost} {item.currency || 'USD'}
                                    </Badge>
                                  )}
                                  {item.duration && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.duration} mins
                                    </Badge>
                                  )}
                                </div>
                                
                                {item.notes && (
                                  <p className="text-gray-600 text-xs mt-2 ml-2 bg-yellow-50 p-2 rounded">
                                    💡 {item.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingItem(item)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteItemMutation.mutate(item.id!)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-black dark:text-white text-lg mb-4">No activities planned yet</p>
                      <p className="text-black dark:text-gray-300 mb-6">Start building your detailed itinerary by adding your first activity.</p>
                      <Button 
                        onClick={() => setIsAddingItem(true)}
                        className="bg-gradient-to-r from-blue-600 to-orange-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Activity
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-900 dark:text-white text-lg">Select an itinerary to view details</p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">Choose from your existing itineraries or create a new one to start planning your trip.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Item Dialog */}
        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent 
              className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle className="text-black dark:text-white">Edit Activity</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                <div>
                  <Label className="text-black dark:text-white">Date</Label>
                  <Input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, date: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Start Time</Label>
                  <Input
                    type="time"
                    value={editingItem.startTime || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-black dark:text-white">Activity Title</Label>
                  <Input
                    value={editingItem.title}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Location</Label>
                  <Input
                    value={editingItem.location || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, location: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Category</Label>
                  <Select value={editingItem.category || ""} onValueChange={(value) => setEditingItem(prev => prev ? { ...prev, category: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black dark:text-white">Cost</Label>
                  <Input
                    type="number"
                    value={editingItem.cost || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, cost: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editingItem.duration || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-black dark:text-white">Description</Label>
                  <Textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-black">Notes</Label>
                  <Textarea
                    value={editingItem.notes || ""}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="text-black"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleUpdateItem} 
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={updateItemMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  onClick={() => setEditingItem(null)}
                  variant="outline"
                  className="text-black border-black"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}