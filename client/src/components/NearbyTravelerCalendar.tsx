import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, CalendarDays, Loader2, Search, X, Repeat } from "lucide-react";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EMOJI_OPTIONS = [
  "🎉", "🎵", "🍕", "☕", "🏖️", "🎨", "🏃", "🎭", "🎮", "📚",
  "🍺", "🎤", "⚽", "🧘", "🌮", "🎸", "🎬", "🏋️", "🚴", "🌄"
];

const WEEKLY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MONTHLY_DATES = ["1st", "2nd", "3rd", "4th", "5th", "10th", "15th", "20th", "25th", "last"];

interface CalendarEvent {
  id: number;
  title: string;
  day: number;
  date: string;
  recurring: "weekly" | "monthly" | null;
  color: string;
  icon: string;
  time: string;
  location: string;
  desc: string;
  rsvp: number;
  isGenerated?: boolean;
}

function getEventColor(event: any): string {
  if (event.recurrenceType === "weekly" || event.isRecurring && event.recurrenceType === "weekly") return "#FF6B35";
  if (event.recurrenceType === "monthly" || event.isRecurring && event.recurrenceType === "monthly") return "#3B82F6";
  return "#10B981";
}

function getRecurringType(event: any): "weekly" | "monthly" | null {
  if (!event.isRecurring && !event.recurrenceType) return null;
  if (event.recurrenceType === "weekly") return "weekly";
  if (event.recurrenceType === "monthly") return "monthly";
  return null;
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function parseMonthlyDay(val: string, daysInMonth: number): number {
  if (val === "last") return daysInMonth;
  const num = parseInt(val);
  if (!isNaN(num)) return Math.min(num, daysInMonth);
  return 1;
}

function generateRecurringInstances(events: any[], year: number, month: number): CalendarEvent[] {
  const results: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (const event of events) {
    const eventDate = new Date(event.date);
    const eventDay = eventDate.getDate();
    const eventMonth = eventDate.getMonth();
    const eventYear = eventDate.getFullYear();
    const recurring = getRecurringType(event);
    const color = getEventColor(event);
    const icon = event.tags?.[0] || "🎉";
    const time = eventDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const location = [event.venueName, event.city].filter(Boolean).join(", ") || event.location || "";
    const pattern = event.recurrencePattern as any;
    const eventStart = new Date(eventYear, eventMonth, eventDay);

    if (recurring === "weekly") {
      let targetDayOfWeek = eventDate.getDay();
      if (pattern?.dayOfWeek && typeof pattern.dayOfWeek === "string") {
        const mapped = DAY_NAME_TO_INDEX[pattern.dayOfWeek.toLowerCase()];
        if (mapped !== undefined) targetDayOfWeek = mapped;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const checkDate = new Date(year, month, d);
        if (checkDate.getDay() === targetDayOfWeek && checkDate >= eventStart) {
          results.push({
            id: event.id,
            title: event.title,
            day: d,
            date: checkDate.toISOString(),
            recurring: "weekly",
            color,
            icon,
            time,
            location,
            desc: event.description || "",
            rsvp: event.participantCount || event.attendeeCount || 0,
            isGenerated: !(d === eventDay && month === eventMonth && year === eventYear),
          });
        }
      }
    } else if (recurring === "monthly") {
      let targetDay = Math.min(eventDay, daysInMonth);
      if (pattern?.dayOfMonth) {
        targetDay = parseMonthlyDay(String(pattern.dayOfMonth), daysInMonth);
      }
      const checkDate = new Date(year, month, targetDay);
      if (checkDate >= new Date(eventYear, eventMonth, 1)) {
        results.push({
          id: event.id,
          title: event.title,
          day: targetDay,
          date: checkDate.toISOString(),
          recurring: "monthly",
          color,
          icon,
          time,
          location,
          desc: event.description || "",
          rsvp: event.participantCount || event.attendeeCount || 0,
          isGenerated: !(targetDay === eventDay && month === eventMonth && year === eventYear),
        });
      }
    } else {
      if (eventMonth === month && eventYear === year) {
        results.push({
          id: event.id,
          title: event.title,
          day: eventDay,
          date: eventDate.toISOString(),
          recurring: null,
          color,
          icon,
          time,
          location,
          desc: event.description || "",
          rsvp: event.participantCount || event.attendeeCount || 0,
        });
      }
    }
  }

  return results;
}

interface NearbyTravelerCalendarProps {
  initialCity?: string;
}

export default function NearbyTravelerCalendar({ initialCity }: NearbyTravelerCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState(initialCity || "");
  const [showCityPicker, setShowCityPicker] = useState(!initialCity);
  const [citySearchInput, setCitySearchInput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialCity && !selectedCity) {
      setSelectedCity(initialCity);
      setShowCityPicker(false);
    }
  }, [initialCity]);

  const { data: rawEvents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/events", { city: selectedCity, calendarView: true }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity) params.set("city", selectedCity);
      const res = await fetch(`${getApiBaseUrl()}/api/events?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: !!selectedCity,
    staleTime: 30000,
  });

  const calendarEvents = useMemo(
    () => generateRecurringInstances(rawEvents, currentYear, currentMonth),
    [rawEvents, currentYear, currentMonth]
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const eventsForDay = (day: number) => calendarEvents.filter((e) => e.day === day);
  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  if (showCityPicker && !selectedCity) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Events Calendar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a city to see local events</p>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search for a city..."
            value={citySearchInput}
            onChange={(e) => setCitySearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && citySearchInput.trim()) {
                setSelectedCity(citySearchInput.trim());
                setShowCityPicker(false);
              }
            }}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Los Angeles", "New York", "Miami", "Chicago", "Austin", "San Francisco", "Denver", "Nashville"].map((city) => (
            <Button
              key={city}
              variant="outline"
              className="justify-start text-sm"
              onClick={() => {
                setSelectedCity(city);
                setShowCityPicker(false);
              }}
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-500 flex-shrink-0" />
              {city}
            </Button>
          ))}
        </div>
        {citySearchInput.trim() && (
          <Button
            className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              setSelectedCity(citySearchInput.trim());
              setShowCityPicker(false);
            }}
          >
            View {citySearchInput.trim()} Events
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="text-center min-w-[160px]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              <MapPin className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCity} Events</span>
              <button
                onClick={() => {
                  setShowCityPicker(true);
                  setSelectedCity("");
                  setCitySearchInput("");
                }}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium ml-1"
              >
                Change
              </button>
            </div>
          </div>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        {user && (
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Event</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pb-2 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} /> One-time</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF6B35" }} /> Weekly</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} /> Monthly</span>
      </div>

      <div className="grid grid-cols-7 border-t border-gray-200 dark:border-gray-700">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-700">
            {day}
          </div>
        ))}

        {isLoading ? (
          <div className="col-span-7 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50" />;
            }
            const dayEvents = eventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDay === day;
            const todayClass = isToday(day);
            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  aspect-square border-b border-r border-gray-100 dark:border-gray-800 p-1 flex flex-col items-center justify-start gap-0.5 transition-colors relative
                  ${isSelected ? "bg-orange-50 dark:bg-orange-900/20 ring-2 ring-inset ring-orange-400" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                `}
              >
                <span
                  className={`text-sm font-medium leading-none mt-1
                    ${todayClass ? "bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-gray-700 dark:text-gray-200"}
                  `}
                >
                  {day}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((evt, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: evt.color }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-gray-400 leading-none">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {!isLoading && selectedDay !== null && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {MONTHS[currentMonth]} {selectedDay}, {currentYear}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((evt, i) => (
                <div
                  key={`${evt.id}-${i}`}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: evt.color + "20", border: `1px solid ${evt.color}40` }}
                  >
                    {evt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{evt.title}</h4>
                      {evt.recurring && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: evt.color + "20", color: evt.color }}
                        >
                          <Repeat className="w-2.5 h-2.5 inline mr-0.5" />
                          {evt.recurring}
                        </span>
                      )}
                    </div>
                    {evt.desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{evt.desc}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {evt.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {evt.time}
                        </span>
                      )}
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {evt.location}
                        </span>
                      )}
                      {evt.rsvp > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {evt.rsvp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && calendarEvents.length === 0 && !selectedDay && (
        <div className="text-center py-10 px-4">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No events in {selectedCity} this month — be the first to add one!
          </p>
          {user && (
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Event
            </Button>
          )}
        </div>
      )}

      <CreateEventDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        city={selectedCity}
        onSuccess={() => {
          setShowCreateForm(false);
          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          toast({ title: "Event Created", description: "Your event has been added to the calendar." });
        }}
      />
    </div>
  );
}

function CreateEventDialog({
  open,
  onOpenChange,
  city,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [eventCity, setEventCity] = useState(city);
  const [selectedIcon, setSelectedIcon] = useState("🎉");
  const [recurringType, setRecurringType] = useState<"none" | "weekly" | "monthly">("none");
  const [recurringDay, setRecurringDay] = useState("monday");
  const [recurringDate, setRecurringDate] = useState("1st");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setEventCity(city);
  }, [city]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to create events");
      const eventDate = new Date(`${date}T${time || "12:00"}`);
      const body: any = {
        title,
        organizerId: user.id,
        date: eventDate.toISOString(),
        location: location || "TBD",
        street: location || "TBD",
        city: eventCity,
        state: "",
        country: "United States",
        zipcode: "00000",
        category: "Social",
        description,
        tags: [selectedIcon],
        isRecurring: recurringType !== "none",
        recurrenceType: recurringType === "none" ? null : recurringType,
        recurrencePattern: recurringType === "weekly"
          ? { dayOfWeek: recurringDay }
          : recurringType === "monthly"
          ? { dayOfMonth: recurringDate }
          : null,
      };
      const res = await apiRequest("POST", "/api/events", body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create event");
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setDescription("");
      setSelectedIcon("🎉");
      setRecurringType("none");
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Event Title</label>
            <Input placeholder="What's happening?" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Location / Venue</label>
            <Input placeholder="Where is it?" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
            <Textarea placeholder="Tell people about the event..." value={description} onChange={(e) => setDescription(e.target.value)} className="h-20 resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">City</label>
            <Input value={eventCity} onChange={(e) => setEventCity(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    selectedIcon === emoji
                      ? "bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Recurring</label>
            <div className="flex gap-2">
              {(["none", "weekly", "monthly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRecurringType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    recurringType === type
                      ? type === "weekly"
                        ? "bg-[#FF6B35] text-white"
                        : type === "monthly"
                        ? "bg-[#3B82F6] text-white"
                        : "bg-[#10B981] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {type === "none" ? "One-time" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {recurringType === "weekly" && (
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Day of Week</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKLY_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setRecurringDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      recurringDay === day
                        ? "bg-[#FF6B35] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurringType === "monthly" && (
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Day of Month</label>
              <div className="flex flex-wrap gap-1.5">
                {MONTHLY_DATES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setRecurringDate(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      recurringDate === d
                        ? "bg-[#3B82F6] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !date || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
