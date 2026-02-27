import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl, apiRequest } from '@/lib/queryClient';
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
  Mail,
  Mic,
  MicOff
} from 'lucide-react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface TravelPlan {
  id: number;
  destination: string;
  destinationCity: string | null;
  destinationState?: string | null;
  destinationCountry: string | null;
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
  onClose?: () => void;
  isOwnProfile?: boolean;
}

export default function ComprehensiveItinerary({ travelPlan, onShare, isSharing, onClose, isOwnProfile = false }: ComprehensiveItineraryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Voice not available",
        description: "Voice input isn't supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        if (finalTranscript) {
          setNewItem(prev => ({ ...prev, description: (prev.description || '') + finalTranscript }));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice error",
          description: "Please try again or type your notes.",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (error) {
      toast({
        title: "Voice error",
        description: "Could not start voice input.",
        variant: "destructive"
      });
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Generate date range for the trip (timezone-safe parsing)
  const dateRange = useMemo(() => {
    // Parse dates without timezone conversion by extracting just the date part
    const startStr = String(travelPlan.startDate).split('T')[0];
    const endStr = String(travelPlan.endDate).split('T')[0];
    
    // Parse as local date (not UTC) to avoid timezone shifts
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [travelPlan.startDate, travelPlan.endDate]);

  // Fetch travel plan itineraries
  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/travel-plans/${travelPlan.id}/itineraries`);
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
      const response = await fetch(`${getApiBaseUrl()}/api/weather?city=${travelPlan.destinationCity}&country=${travelPlan.destinationCountry}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Group items by date (normalize ISO timestamps to YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    return itineraryItems.reduce((acc, item) => {
      const dateKey = item.date?.split('T')[0] || item.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
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
        const itineraryResponse = await apiRequest('POST', '/api/itineraries', {
          travelPlanId: travelPlan.id,
          title: `${travelPlan.destination} Itinerary`,
          description: 'Main travel itinerary'
        });
        if (!itineraryResponse.ok) throw new Error('Failed to create itinerary');
        const newItinerary = await itineraryResponse.json();
        itineraryId = newItinerary.id;
      }

      const response = await apiRequest('POST', `/api/itineraries/${itineraryId}/items`, item);
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/travel-plans/${travelPlan.id}/itineraries`] });
      setNewItem({});
      setShowAddItem(false);
      toast({ title: 'Success', description: 'Item added to itinerary' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add item',
        variant: 'destructive'
      });
    },
  });

  // Update itinerary item mutation
  const updateItem = useMutation({
    mutationFn: async (item: ItineraryItem) => {
      const response = await apiRequest('PUT', `/api/itinerary-items/${item.id}`, item);
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
      const response = await apiRequest('DELETE', `/api/itinerary-items/${itemId}`);
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
      const response = await apiRequest('POST', `/api/itinerary/${travelPlan.id}/share`, { contactIds });
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
    // Parse date string without timezone conversion
    const datePart = String(dateStr).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    // Create date in local timezone to avoid UTC conversion shifts
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
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

  // Generate shareable/exportable itinerary text
  const generateItineraryText = () => {
    let text = `🗺️ Trip to ${travelPlan.destination}\n`;
    text += `📅 ${formatDate(travelPlan.startDate)} - ${formatDate(travelPlan.endDate)}\n`;
    if (travelPlan.accommodation) text += `🏨 Staying at: ${travelPlan.accommodation}\n`;
    if (travelPlan.budget) text += `💰 Budget: $${travelPlan.budget}\n`;
    text += `\n--- ITINERARY ---\n\n`;

    dateRange.forEach((date, index) => {
      const dayItems = itemsByDate[date] || [];
      text += `📆 Day ${index + 1} - ${formatDate(date)}\n`;
      if (dayItems.length > 0) {
        dayItems
          .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
          .forEach(item => {
            const time = item.time ? formatTime(item.time) : '';
            text += `  • ${time ? time + ' - ' : ''}${item.title}`;
            if (item.location) text += ` @ ${item.location}`;
            if (item.cost) text += ` ($${item.cost})`;
            text += '\n';
            if (item.description) text += `    ${item.description}\n`;
          });
      } else {
        text += `  No activities planned\n`;
      }
      text += '\n';
    });

    if (totalBudget > 0) {
      text += `\n💵 Total Estimated Cost: $${totalBudget.toFixed(2)}\n`;
    }

    return text;
  };

  // Handle share - copy text to clipboard
  const handleShare = () => {
    const text = generateItineraryText();
    navigator.clipboard.writeText(text);
    toast({ title: 'Itinerary copied to clipboard!' });
    onShare?.();
  };

  // Handle export - download as text file
  const handleExport = () => {
    const text = generateItineraryText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${travelPlan.destination.replace(/[^a-z0-9]/gi, '_')}_itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Itinerary downloaded!' });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100001,
          display: 'grid',
          visibility: 'visible',
          opacity: 1
        }}
      >
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
              <Button onClick={handleShare} variant="outline" size="sm" disabled={isSharing}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
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
              {isOwnProfile && (
                <Button onClick={() => setShowAddItem(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
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
                              {isOwnProfile && (
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
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activities planned for this day</p>
                        {isOwnProfile && (
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
                        )}
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
                        <span className="text-sm text-gray-600">({(data as any).items.length} items)</span>
                      </div>
                      <div className="font-bold">${(data as any).total}</div>
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

        {/* Add Item Form - INLINE (no nested dialog) - Only show for own profile */}
        {isOwnProfile && showAddItem && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Itinerary Item</h3>
                <button 
                  onClick={() => setShowAddItem(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
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
                  <div className="flex gap-1 items-center">
                    <select
                      className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={newItem.time ? (parseInt(newItem.time.split(':')[0]) > 12 ? (parseInt(newItem.time.split(':')[0]) - 12).toString() : (parseInt(newItem.time.split(':')[0]) === 0 ? '12' : parseInt(newItem.time.split(':')[0]).toString())) : ''}
                      onChange={(e) => {
                        const hour = parseInt(e.target.value);
                        const currentMinute = newItem.time ? newItem.time.split(':')[1] : '00';
                        const currentHour = newItem.time ? parseInt(newItem.time.split(':')[0]) : 0;
                        const isPM = currentHour >= 12;
                        let newHour = hour;
                        if (isPM && hour !== 12) newHour = hour + 12;
                        if (!isPM && hour === 12) newHour = 0;
                        setNewItem({ ...newItem, time: `${newHour.toString().padStart(2, '0')}:${currentMinute}` });
                      }}
                    >
                      <option value="">Hr</option>
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">:</span>
                    <select
                      className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={newItem.time ? newItem.time.split(':')[1] : ''}
                      onChange={(e) => {
                        const currentHour = newItem.time ? newItem.time.split(':')[0] : '09';
                        setNewItem({ ...newItem, time: `${currentHour}:${e.target.value}` });
                      }}
                    >
                      <option value="">Min</option>
                      {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
                      <button
                        type="button"
                        className={`px-2 py-2 text-sm font-medium transition-colors ${
                          !newItem.time || parseInt(newItem.time.split(':')[0]) < 12
                            ? 'bg-orange-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          if (!newItem.time) {
                            setNewItem({ ...newItem, time: '09:00' });
                          } else {
                            const hour = parseInt(newItem.time.split(':')[0]);
                            const minute = newItem.time.split(':')[1];
                            if (hour >= 12) {
                              const newHour = hour === 12 ? 0 : hour - 12;
                              setNewItem({ ...newItem, time: `${newHour.toString().padStart(2, '0')}:${minute}` });
                            }
                          }
                        }}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-2 text-sm font-medium transition-colors ${
                          newItem.time && parseInt(newItem.time.split(':')[0]) >= 12
                            ? 'bg-orange-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          if (!newItem.time) {
                            setNewItem({ ...newItem, time: '12:00' });
                          } else {
                            const hour = parseInt(newItem.time.split(':')[0]);
                            const minute = newItem.time.split(':')[1];
                            if (hour < 12) {
                              const newHour = hour === 0 ? 12 : hour + 12;
                              setNewItem({ ...newItem, time: `${newHour.toString().padStart(2, '0')}:${minute}` });
                            }
                          }
                        }}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                  <Input
                    value={newItem.title || ''}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Notes</label>
                    {speechSupported && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={isListening ? stopVoiceInput : startVoiceInput}
                        className={`h-7 px-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-orange-500'}`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-4 h-4 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-1" />
                            Voice
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder={isListening ? "Listening... speak your notes" : "Add notes or tap voice to speak"}
                    rows={3}
                    className={`border border-gray-300 dark:border-gray-600 rounded-md ${isListening ? 'border-red-300 focus:border-red-500' : ''}`}
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddItem(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addItem.mutate(newItem)}
                    disabled={!newItem.type || !newItem.title || !newItem.date || addItem.isPending}
                  >
                    {addItem.isPending ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
                {(!newItem.type || !newItem.title || !newItem.date) && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Fill in type, date, and title to add item
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}