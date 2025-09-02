import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Calendar, Heart, Activity, CalendarDays } from "lucide-react";
import { getTodayForInput } from "@/lib/dateUtils";

interface DestinationModalProps {
  isOpen: boolean;
  onComplete: (destination: string, startDate?: string, endDate?: string, interests?: string[], activities?: string[], travelStyle?: string, events?: string[]) => void;
  onClose?: () => void;
  user?: any; // Current user data with default preferences
}

const popularDestinations = [
  "Tokyo, Japan",
  "Paris, France", 
  "New York, USA",
  "London, UK",
  "Barcelona, Spain",
  "Rome, Italy",
  "Bangkok, Thailand",
  "Sydney, Australia",
  "Amsterdam, Netherlands",
  "Berlin, Germany",
  "Istanbul, Turkey",
  "Dubai, UAE"
];

const travelInterests = [
  "Culture & History",
  "Food & Cuisine",
  "Nature & Wildlife",
  "Adventure Sports",
  "Nightlife",
  "Shopping",
  "Art & Museums",
  "Architecture",
  "Beach & Water Sports",
  "Photography",
  "Local Festivals",
  "Wellness & Spa"
];

const travelStyles = [
  "Solo Traveler",
  "Business Traveler", 
  "Family Vacation",
  "Couple's Trip",
  "Group Travel",
  "Backpacking",
  "Luxury Travel",
  "Budget Travel"
];

const preferredActivities = [
  "Hiking & Trekking",
  "City Walking Tours",
  "Cooking Classes",
  "Museum Visits",
  "Local Market Exploration",
  "Boat Tours",
  "Cycling",
  "Live Music & Concerts",
  "Food Tours",
  "Photography Walks",
  "Beach Activities",
  "Cultural Workshops"
];

export default function DestinationModal({ isOpen, onComplete, onClose, user }: DestinationModalProps) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Initialize with user's default travel preferences if available
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.defaultTravelInterests || []
  );
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    user?.defaultTravelActivities || []
  );
  const [plannedEvents, setPlannedEvents] = useState<string[]>(
    user?.defaultTravelEvents || []
  );
  
  const [travelStyle, setTravelStyle] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [newEvent, setNewEvent] = useState("");

  const handleSubmit = async () => {
    if (destination && startDate && endDate) {
      // Save updated preferences as user defaults if they've changed
      if (user?.id && (
        JSON.stringify(selectedInterests) !== JSON.stringify(user.defaultTravelInterests) ||
        JSON.stringify(selectedActivities) !== JSON.stringify(user.defaultTravelActivities) ||
        JSON.stringify(plannedEvents) !== JSON.stringify(user.defaultTravelEvents)
      )) {
        try {
          await fetch(`/api/users/${user.id}/travel-preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              defaultTravelInterests: selectedInterests,
              defaultTravelActivities: selectedActivities,
              defaultTravelEvents: plannedEvents
            })
          });
        } catch (error) {
          console.error('Failed to save travel preferences:', error);
        }
      }
      
      onComplete(destination, startDate, endDate, selectedInterests, selectedActivities, travelStyle, plannedEvents);
      
      // Reset form but keep preferences for next time
      setDestination("");
      setStartDate("");
      setEndDate("");
      setTravelStyle("");
      setCustomInterest("");
      setCustomActivity("");
      setNewEvent("");
      // Don't reset selectedInterests, selectedActivities, plannedEvents - they persist
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-travel-blue" />
            Plan Your Trip
          </DialogTitle>
          <DialogDescription>
            Tell us about your travel plans, interests, and preferred activities.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="destination" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="destination" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Destination
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="interests" className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Interests
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="destination" className="space-y-4">
            <div className="relative">
              <Label htmlFor="destination">Choose your destination</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type a destination (e.g., Paris, France) or select from suggestions"
                className="w-full"
              />
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {popularDestinations
                    .filter(dest => 
                      dest.toLowerCase().includes(destination.toLowerCase()) ||
                      destination === ""
                    )
                    .map((dest) => (
                      <div
                        key={dest}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setDestination(dest);
                          setShowSuggestions(false);
                        }}
                      >
                        {dest}
                      </div>
                    ))
                  }
                  {destination && !popularDestinations.some(dest => 
                    dest.toLowerCase().includes(destination.toLowerCase())
                  ) && (
                    <div className="px-3 py-2 text-sm text-gray-500 italic">
                      Custom destination: "{destination}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Travel Dates</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate" className="text-xs text-gray-600">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getTodayForInput()}
                    max="9999-12-31"
                    placeholder="20__-__-__"
                    className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs text-gray-600">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || getTodayForInput()}
                    max="9999-12-31"
                    placeholder="20__-__-__"
                    className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div>
              <Label className="text-base font-medium">Planned Events (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-3">Add specific events you plan to attend</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {plannedEvents.map((event, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                    {event}
                    <button
                      onClick={() => setPlannedEvents(prev => prev.filter((_, i) => i !== index))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="Enter event name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newEvent.trim() && !plannedEvents.includes(newEvent.trim())) {
                      setPlannedEvents(prev => [...prev, newEvent.trim()]);
                      setNewEvent("");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newEvent.trim() && !plannedEvents.includes(newEvent.trim())) {
                      setPlannedEvents(prev => [...prev, newEvent.trim()]);
                      setNewEvent("");
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  Add Event
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            <div>
              <Label className="text-base font-medium">What interests you most?</Label>
              <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {travelInterests.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`interest-${interest}`}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                    />
                    <Label 
                      htmlFor={`interest-${interest}`}
                      className="text-sm cursor-pointer"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="customInterest">Add custom interest</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="customInterest"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Enter your own interest"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
                        setSelectedInterests(prev => [...prev, customInterest.trim()]);
                        setCustomInterest("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
                        // Validate before adding
                        import('../lib/contentFilter').then(({ validateCustomInput }) => {
                          const validation = validateCustomInput(customInterest.trim());
                          if (validation.isValid) {
                            setSelectedInterests(prev => [...prev, customInterest.trim()]);
                            setCustomInterest("");
                          }
                        });
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preferred Activities</Label>
              <p className="text-sm text-muted-foreground mb-3">Choose activities you'd like to do</p>
              <div className="grid grid-cols-1 gap-3">
                {preferredActivities.map((activity) => (
                  <div key={activity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`activity-${activity}`}
                      checked={selectedActivities.includes(activity)}
                      onCheckedChange={() => toggleActivity(activity)}
                    />
                    <Label 
                      htmlFor={`activity-${activity}`}
                      className="text-sm cursor-pointer"
                    >
                      {activity}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="customActivity">Add custom activity</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="customActivity"
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    placeholder="Enter your own activity"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customActivity.trim() && !selectedActivities.includes(customActivity.trim())) {
                        setSelectedActivities(prev => [...prev, customActivity.trim()]);
                        setCustomActivity("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (customActivity.trim() && !selectedActivities.includes(customActivity.trim())) {
                        setSelectedActivities(prev => [...prev, customActivity.trim()]);
                        setCustomActivity("");
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-base font-medium">What type of traveler are you?</Label>
            <p className="text-sm text-muted-foreground mb-3">Choose your traveler type</p>
            <Select value={travelStyle} onValueChange={setTravelStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select traveler type" />
              </SelectTrigger>
              <SelectContent>
                {travelStyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!destination || !startDate || !endDate}
            className="bg-travel-blue hover:bg-travel-blue/90"
          >
            Continue to TravelConnect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}