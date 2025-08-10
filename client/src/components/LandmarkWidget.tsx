import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Star, MapPin, Clock, DollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const landmarkSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  address: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  visitTime: z.string().optional(),
  entryFee: z.string().optional(),
  bestTimeToVisit: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.string().optional(),
});

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

interface LandmarkWidgetProps {
  city: string;
  state?: string;
  country: string;
  currentUserId: number;
}

export function LandmarkWidget({ city, state, country, currentUserId }: LandmarkWidgetProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(landmarkSchema),
    defaultValues: {
      name: "",
      description: "",
      city,
      state: state || "",
      country,
      address: "",
      category: "",
      visitTime: "",
      entryFee: "",
      bestTimeToVisit: "",
      website: "",
      openingHours: "",
    },
  });

  const ratingForm = useForm({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5,
      review: "",
    },
  });

  // Fetch landmarks for the city
  const { data: landmarks = [], isLoading } = useQuery({
    queryKey: ["/api/landmarks", city, state, country],
    queryFn: async () => {
      const url = `/api/landmarks?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state || "")}&country=${encodeURIComponent(country)}`;
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  // Create landmark mutation
  const createLandmarkMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/landmarks", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landmarks"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Landmark added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add landmark",
        variant: "destructive",
      });
    },
  });

  // Rate landmark mutation
  const rateLandmarkMutation = useMutation({
    mutationFn: async ({ landmarkId, rating, review }: { landmarkId: number; rating: number; review?: string }) => {
      const response = await apiRequest("POST", `/api/landmarks/${landmarkId}/rate`, { userId: currentUserId, rating, review });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landmarks"] });
      setSelectedLandmark(null);
      ratingForm.reset();
      toast({
        title: "Success",
        description: "Rating submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createLandmarkMutation.mutate({
      ...data,
      addedBy: currentUserId,
    });
  };

  const onRatingSubmit = (data: any) => {
    if (selectedLandmark) {
      rateLandmarkMutation.mutate({
        landmarkId: selectedLandmark.id,
        rating: data.rating,
        review: data.review,
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "landmark":
      case "monument":
        return "🏛️";
      case "museum":
        return "🏛️";
      case "park":
        return "🌳";
      case "religious":
        return "⛪";
      case "skyscraper":
        return "🏢";
      case "bridge":
        return "🌉";
      case "observatory":
        return "🔭";
      case "historical":
        return "🏰";
      default:
        return "📍";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "landmark":
      case "monument":
        return "bg-blue-100 text-blue-800";
      case "museum":
        return "bg-blue-100 text-blue-800";
      case "park":
        return "bg-green-100 text-green-800";
      case "religious":
        return "bg-yellow-100 text-yellow-800";
      case "skyscraper":
        return "bg-gray-100 text-gray-800";
      case "bridge":
        return "bg-indigo-100 text-indigo-800";
      case "observatory":
        return "bg-red-100 text-red-800";
      case "historical":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5" />
            Famous Landmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <MapPin className="w-5 h-5" />
          Landmarks & Secrets ({landmarks.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add Landmark or Secret
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle>Add New Landmark or Secret</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Hollywood Sign or Hidden Garden" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="landmark">Famous Landmark</SelectItem>
                            <SelectItem value="monument">Monument</SelectItem>
                            <SelectItem value="museum">Museum</SelectItem>
                            <SelectItem value="observatory">Observatory</SelectItem>
                            <SelectItem value="skyscraper">Skyscraper</SelectItem>
                            <SelectItem value="bridge">Bridge</SelectItem>
                            <SelectItem value="park">Park</SelectItem>
                            <SelectItem value="religious">Religious Site</SelectItem>
                            <SelectItem value="historical">Historical Site</SelectItem>
                            <SelectItem value="hidden-gem">Hidden Gem</SelectItem>
                            <SelectItem value="secret-spot">Secret Spot</SelectItem>
                            <SelectItem value="local-favorite">Local Favorite</SelectItem>
                            <SelectItem value="off-beaten-path">Off the Beaten Path</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this landmark or secret spot, its significance, and what makes it special. Include why locals love it or why it's worth visiting..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visitTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How long to visit?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                            <SelectItem value="2-3 hours">2-3 hours</SelectItem>
                            <SelectItem value="half day">Half day</SelectItem>
                            <SelectItem value="full day">Full day</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Cost to visit?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="$5-10">$5-10</SelectItem>
                            <SelectItem value="$10-20">$10-20</SelectItem>
                            <SelectItem value="$20+">$20+</SelectItem>
                            <SelectItem value="varies">Varies</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bestTimeToVisit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Best Time to Visit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="When to visit?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                            <SelectItem value="sunset">Sunset</SelectItem>
                            <SelectItem value="night">Night</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Hours</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 9 AM - 6 PM daily" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLandmarkMutation.isPending}>
                    {createLandmarkMutation.isPending ? "Adding..." : "Add Landmark"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {landmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No landmarks yet</p>
            <p className="text-sm">Be the first to add a famous landmark for {city}!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {landmarks.map((landmark: any) => (
              <div
                key={landmark.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedLandmark(landmark)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(landmark.category)}</span>
                    <h3 className="font-semibold text-lg">{landmark.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {landmark.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{landmark.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({landmark.totalRatings})</span>
                      </div>
                    )}
                    <Badge className={getCategoryColor(landmark.category)}>
                      {landmark.category}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{landmark.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {landmark.visitTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {landmark.visitTime}
                    </div>
                  )}
                  {landmark.entryFee && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {landmark.entryFee}
                    </div>
                  )}
                  {landmark.bestTimeToVisit && (
                    <div className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Best: {landmark.bestTimeToVisit}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Landmark Detail Dialog */}
        <Dialog open={!!selectedLandmark} onOpenChange={() => setSelectedLandmark(null)}>
          <DialogContent className="max-w-2xl">
            {selectedLandmark && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(selectedLandmark.category)}</span>
                    {selectedLandmark.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(selectedLandmark.category)}>
                      {selectedLandmark.category}
                    </Badge>
                    {selectedLandmark.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedLandmark.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({selectedLandmark.totalRatings} ratings)</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700">{selectedLandmark.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedLandmark.address && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-gray-600">{selectedLandmark.address}</p>
                      </div>
                    )}
                    {selectedLandmark.openingHours && (
                      <div>
                        <span className="font-medium">Hours:</span>
                        <p className="text-gray-600">{selectedLandmark.openingHours}</p>
                      </div>
                    )}
                    {selectedLandmark.visitTime && (
                      <div>
                        <span className="font-medium">Visit Duration:</span>
                        <p className="text-gray-600">{selectedLandmark.visitTime}</p>
                      </div>
                    )}
                    {selectedLandmark.entryFee && (
                      <div>
                        <span className="font-medium">Entry Fee:</span>
                        <p className="text-gray-600">{selectedLandmark.entryFee}</p>
                      </div>
                    )}
                  </div>

                  {selectedLandmark.website && (
                    <div>
                      <span className="font-medium">Website:</span>
                      <a
                        href={selectedLandmark.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-2"
                      >
                        {selectedLandmark.website}
                      </a>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Rate this landmark</h4>
                    <Form {...ratingForm}>
                      <form onSubmit={ratingForm.handleSubmit(onRatingSubmit)} className="space-y-4">
                        <FormField
                          control={ratingForm.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating (1-5 stars)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">⭐ 1 star</SelectItem>
                                  <SelectItem value="2">⭐⭐ 2 stars</SelectItem>
                                  <SelectItem value="3">⭐⭐⭐ 3 stars</SelectItem>
                                  <SelectItem value="4">⭐⭐⭐⭐ 4 stars</SelectItem>
                                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 stars</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ratingForm.control}
                          name="review"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review (optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Share your experience visiting this landmark..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={rateLandmarkMutation.isPending}>
                          {rateLandmarkMutation.isPending ? "Submitting..." : "Submit Rating"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}