import React, { useState, useContext, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Users, Camera, Upload, X, Save, MoreHorizontal, Eye, Share2, Copy } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Logo from "@/components/logo";
import Navbar from "@/components/navbar";
import type { Event } from "@shared/schema";
import SmartLocationInput from "@/components/SmartLocationInput";

// Custom hook to update page meta tags for better sharing
const useEventMeta = (event: any) => {
  React.useEffect(() => {
    if (event) {
      // Update document title
      document.title = `${event.title} - Nearby Traveler Event`;
      
      // Update Open Graph meta tags for rich social sharing
      const updateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      
      updateMeta('og:title', `${event.title} - Nearby Traveler Event`);
      updateMeta('og:description', `Join me at "${event.title}" in ${event.city}! ${event.description || 'Exciting event coming up!'}`);
      updateMeta('og:type', 'event');
      updateMeta('og:url', `${window.location.origin}/events/${event.id}`);
      if (event.imageUrl) {
        updateMeta('og:image', event.imageUrl);
      }
    }
  }, [event]);
};

interface ManageEventProps {
  eventId: string;
}

export default function ManageEvent({ eventId }: ManageEventProps) {
  const [, setLocation] = useLocation();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venueName: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    location: "",
    startDate: "",
    endDate: "",
    category: "",
    maxParticipants: "",
    requirements: "",
    tags: [] as string[],
    isPublic: true,
    imageUrl: "",
    isSameDay: false
  });
  
  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Social media posting states
  const [postingToInstagram, setPostingToInstagram] = useState(false);
  const [postingToFacebook, setPostingToFacebook] = useState(false);
  const [instagramPostStatus, setInstagramPostStatus] = useState<string>("");
  const [facebookPostStatus, setFacebookPostStatus] = useState<string>("");
  const [postToNearbytravelerFacebook, setPostToNearbytravelerFacebook] = useState(true);
  const [showSocialPreview, setShowSocialPreview] = useState(false);

  // Fetch event data
  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
  });

  // Update meta tags for better social sharing
  useEventMeta(event);

  // Populate form data when event loads - preserve all existing data
  React.useEffect(() => {
    if (event) {
      console.log('🔄 MANAGE EVENT: Loading event data into form:', {
        title: event.title,
        street: event.street,
        city: event.city,
        state: event.state,
        location: event.location,
        startDate: event.date,
        endDate: event.endDate,
        imageUrl: event.imageUrl ? 'HAS IMAGE' : 'NO IMAGE'
      });
      
      // Format dates for datetime-local input preserving original time EXACTLY
      let startDateFormatted = "";
      let endDateFormatted = "";
      
      if (event.date) {
        // Convert to local timezone to prevent time shifting in form
        const eventDate = new Date(event.date);
        
        // Use the local date/time values directly to avoid timezone conversion
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const hours = String(eventDate.getHours()).padStart(2, '0');
        const minutes = String(eventDate.getMinutes()).padStart(2, '0');
        
        startDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      if (event.endDate) {
        const eventEndDate = new Date(event.endDate);
        
        const year = eventEndDate.getFullYear();
        const month = String(eventEndDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventEndDate.getDate()).padStart(2, '0');
        const hours = String(eventEndDate.getHours()).padStart(2, '0');
        const minutes = String(eventEndDate.getMinutes()).padStart(2, '0');
        
        endDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      console.log('🔄 MANAGE EVENT: Formatted dates:', { startDateFormatted, endDateFormatted });
      
      setFormData({
        title: event.title || "",
        description: event.description || "",
        venueName: event.venueName || "",
        street: event.street || "",
        city: event.city || "",
        state: event.state || "",
        country: event.country || "United States", // Use event's country or default
        zipcode: event.zipcode || "",
        location: event.location || "",
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        category: event.category || "Social",
        maxParticipants: event.maxParticipants?.toString() || "",
        requirements: event.requirements || "",
        tags: event.tags || [],
        isPublic: event.isPublic ?? true,
        imageUrl: event.imageUrl || ""
      });
      
      // CRITICAL: Always set image preview when event has imageUrl
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
        console.log('Setting image preview from event:', event.imageUrl.substring(0, 50) + '...');
      }
    }
  }, [event]);

  // Get user from localStorage as fallback
  const fallbackUser = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('travelconnect_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const currentUser = user || fallbackUser;

  // Check if user is the organizer
  const isOrganizer = event?.organizerId === currentUser?.id;
  
  // Debug logging
  console.log('Authorization check in frontend:');
  console.log('Event:', event ? { id: event.id, title: event.title, organizerId: event.organizerId } : 'No event loaded');
  console.log('User:', currentUser ? { id: currentUser.id, username: currentUser.username } : 'No user loaded');
  console.log('Is organizer:', isOrganizer);

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const confirmed = window.confirm("Are you sure you want to cancel this event? This action cannot be undone.");
      if (!confirmed) {
        throw new Error("Deletion cancelled by user");
      }
      
      const response = await apiRequest("DELETE", `/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Cancelled",
        description: "Your event has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setLocation('/events');
    },
    onError: (error: Error) => {
      if (error.message !== "Deletion cancelled by user") {
        toast({
          title: "Delete Failed",
          description: "Failed to cancel event. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (updateData: Partial<Event>) => {
      console.log('Starting API request to update event');
      try {
        const response = await apiRequest("PUT", `/api/events/${eventId}`, updateData);
        console.log('API response received:', response);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not ok:', response.status, response.statusText, errorText);
          throw new Error(`Failed to update event: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Update successful, response data:', data);
        return data;
      } catch (error) {
        console.error('Error in mutation function:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation onSuccess called with:', data);
      toast({
        title: "Event Updated",
        description: "Your event has been successfully updated.",
      });
      // Force reload the event data by invalidating cache
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      // Update form data with the returned data to show changes immediately
      if (data) {
        const startDateFormatted = data.date ? new Date(data.date).toISOString().slice(0, 16) : "";
        const endDateFormatted = data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "";
        
        setFormData(prev => ({
          ...prev,
          title: data.title || "",
          description: data.description || "",
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          location: data.location || "",
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          category: data.category || "Social",
          maxParticipants: data.maxParticipants?.toString() || "",
          requirements: data.requirements || "",
          tags: data.tags || [],
          isPublic: data.isPublic ?? true,
        }));
      }
      
      // Navigate back to event details after a short delay
      setTimeout(() => {
        setLocation(`/events/${eventId}`);
      }, 1000);
    },
    onError: (error) => {
      console.error('Mutation onError called with:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      console.log('🖼️ UPLOAD START: Converting file to base64', { 
        fileName: file.name, 
        fileSize: file.size,
        fileType: file.type 
      });
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          console.log('🖼️ UPLOAD SUCCESS: File converted to base64', { 
            resultLength: result.length,
            preview: result.substring(0, 50) + '...'
          });
          resolve(result);
        };
        reader.onerror = (error) => {
          console.error('🖼️ UPLOAD ERROR: FileReader failed', error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    },
    onSuccess: async (imageData: string) => {
      console.log('🖼️ UPLOAD MUTATION SUCCESS: Starting image save process', {
        imageDataLength: imageData.length,
        eventId: event?.id,
        hasEvent: !!event
      });
      
      setImagePreview(imageData);
      setFormData(prev => ({ ...prev, imageUrl: imageData }));
      
      // If event exists, upload image immediately
      if (event?.id) {
        try {
          console.log('🖼️ API CALL: Sending image to server', {
            eventId: event.id,
            imageLength: imageData.length,
            endpoint: `/api/events/${event.id}/image`
          });
          
          const response = await apiRequest("POST", `/api/events/${event.id}/image`, { imageUrl: imageData });
          const responseData = await response.json();
          
          console.log('🖼️ API SUCCESS: Image saved to database', {
            eventId: event.id,
            responseImageUrl: responseData.imageUrl ? 'HAS IMAGE' : 'NO IMAGE',
            responseLength: responseData.imageUrl?.length || 0
          });
          
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        } catch (error) {
          console.error('🖼️ API ERROR: Failed to save image', error);
          toast({
            title: "Upload Failed",
            description: `Failed to save image to event: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
          });
        }
      } else {
        console.log('🖼️ NO EVENT: Image will be saved when event is updated');
      }
      setUploadingImage(false);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setUploadingImage(false);
    },
  });

  const handleImageUpload = (file: File) => {
    console.log('🖼️ HANDLE UPLOAD: File selected for upload', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      maxSize: 5 * 1024 * 1024
    });
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.log('🖼️ UPLOAD REJECTED: File too large', { fileSize: file.size });
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingImage(true);
    uploadImageMutation.mutate(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Instagram posting function
  const postToInstagram = async () => {
    if (!event || !currentUser?.instagramHandle) {
      toast({
        title: "Instagram Handle Required",
        description: "Please add your Instagram handle in your profile settings first.",
        variant: "destructive",
      });
      return;
    }

    setPostingToInstagram(true);
    setInstagramPostStatus("Posting to Instagram...");

    try {
      const response = await apiRequest("POST", `/api/events/${event.id}/post-instagram`, {
        eventId: event.id,
        userId: currentUser.id,
        postToNearbytraveler: true
      });

      if (response.ok) {
        const data = await response.json();
        setInstagramPostStatus("Posted successfully!");
        toast({
          title: "Instagram Success",
          description: "Event posted to Instagram successfully!",
        });
      } else {
        throw new Error("Failed to post to Instagram");
      }
    } catch (error) {
      setInstagramPostStatus("Failed to post");
      toast({
        title: "Instagram Error",
        description: "Failed to post to Instagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPostingToInstagram(false);
    }
  };

  // Facebook posting function
  const postToFacebook = async () => {
    if (!event) {
      toast({
        title: "Event Required",
        description: "Please save the event first before posting to Facebook.",
        variant: "destructive",
      });
      return;
    }

    setPostingToFacebook(true);
    setFacebookPostStatus("Posting to Facebook...");

    try {
      const response = await apiRequest("POST", `/api/events/${event.id}/post-facebook`, {
        eventId: event.id,
        userId: currentUser?.id,
        postToNearbytraveler: postToNearbytravelerFacebook
      });

      if (response.ok) {
        const data = await response.json();
        setFacebookPostStatus("Posted successfully!");
        toast({
          title: "Facebook Success",
          description: "Event posted to Facebook successfully!",
        });
      } else {
        throw new Error("Failed to post to Facebook");
      }
    } catch (error) {
      setFacebookPostStatus("Failed to post");
      toast({
        title: "Facebook Error",
        description: "Failed to post to Facebook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPostingToFacebook(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    if (!formData.title.trim() || !formData.street.trim() || !formData.startDate) {
      console.log('Validation failed - missing required fields');
      toast({
        title: "Missing Information",
        description: "Please fill in event title, venue/street address, and start date.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.city) {
      console.log('Validation failed - missing city');
      toast({
        title: "Missing Location",
        description: "Please enter a city for the event location.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      venueName: formData.venueName.trim() || null,
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      zipcode: formData.zipcode.trim(),
      location: formData.location.trim(),
      date: (() => {
        if (!formData.startDate) throw new Error("Start date is required");
        const parts = formData.startDate.split(/[T:-]/);
        return new Date(
          parseInt(parts[0]), // year
          parseInt(parts[1]) - 1, // month (0-indexed)
          parseInt(parts[2]), // day
          parseInt(parts[3]), // hour
          parseInt(parts[4]) // minute
        );
      })(),
      endDate: formData.endDate ? (() => {
        const parts = formData.endDate.split(/[T:-]/);
        return new Date(
          parseInt(parts[0]), // year
          parseInt(parts[1]) - 1, // month (0-indexed)
          parseInt(parts[2]), // day
          parseInt(parts[3]), // hour
          parseInt(parts[4]) // minute
        );
      })() : undefined,
      category: formData.category || "Social",
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      requirements: formData.requirements.trim() || null,
      tags: formData.tags,
      isPublic: formData.isPublic,
      imageUrl: formData.imageUrl || null,
    };

    console.log('Update data being sent:', updateData);
    updateEventMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event || !isOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You can only manage events that you created.
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Event</h1>
            <p className="text-gray-600">Update your event details</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Event Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {(imagePreview || event?.imageUrl) ? (
                  <div className="relative">
                    <img
                      src={imagePreview || event?.imageUrl || ""}
                      alt="Event preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview("");
                        setFormData(prev => ({ ...prev, imageUrl: "" }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No image uploaded</p>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? "Uploading..." : (imagePreview || event?.imageUrl) ? "Change Photo" : "Upload Photo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Adventure">Adventure</SelectItem>
                      <SelectItem value="Food & Drink">Food & Drink</SelectItem>
                      <SelectItem value="Culture">Culture</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Parties">Parties</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="venueName">Venue Name (Optional)</Label>
                  <Input
                    id="venueName"
                    value={formData.venueName}
                    onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                    placeholder="e.g., Jameson Pub, Central Park, Coffee Shop"
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                {/* Event Location - Use SmartLocationInput */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Event Location *</Label>
                  <SmartLocationInput
                    city={formData.city}
                    state={formData.state}
                    country={formData.country}
                    onLocationChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        city: location.city,
                        state: location.state,
                        country: location.country,
                        location: `${location.city}${location.state ? `, ${location.state}` : ""}`
                      }));
                    }}
                    required={true}
                    placeholder={{
                      country: "Select country",
                      state: "Select state/region",
                      city: "Select city"
                    }}
                  />
                </div>

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className="dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Any requirements or what to bring..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-gray-600">Popular Tags</Label>
                    <Select onValueChange={(value) => {
                      if (value && !formData.tags.includes(value)) {
                        setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a popular tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family-friendly">Family Friendly</SelectItem>
                        <SelectItem value="pet-friendly">Pet Friendly</SelectItem>
                        <SelectItem value="beginner-friendly">Beginner Friendly</SelectItem>
                        <SelectItem value="advanced-level">Advanced Level</SelectItem>
                        <SelectItem value="free-event">Free Event</SelectItem>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="food-drink">Food & Drink</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="tech">Tech</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="casual-meetup">Casual Meetup</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="travel-planning">Travel Planning</SelectItem>
                        <SelectItem value="language-exchange">Language Exchange</SelectItem>
                        <SelectItem value="skill-sharing">Skill Sharing</SelectItem>
                        <SelectItem value="community-service">Community Service</SelectItem>
                        <SelectItem value="seasonal-event">Seasonal Event</SelectItem>
                        <SelectItem value="holiday-themed">Holiday Themed</SelectItem>
                        <SelectItem value="date-night">Date Night</SelectItem>
                        <SelectItem value="solo-travelers">Solo Travelers</SelectItem>
                        <SelectItem value="group-activity">Group Activity</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="demo-presentation">Demo/Presentation</SelectItem>
                        <SelectItem value="celebration">Celebration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add custom tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPublic">Make this event public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Promotion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Social Media Promotion
                <span className="text-red-600 font-bold text-sm">NOT FOR BETA VERSION</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-700 font-semibold text-sm">
                  NOT FOR BETA VERSION - This feature is disabled during beta testing
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Promote your event on social media to reach more people. You can post to Instagram and Facebook even days after creating the event.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-pink-500" />
                    <h4 className="font-medium">Instagram</h4>
                  </div>
                  {currentUser?.instagramHandle ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">@{currentUser.instagramHandle}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowSocialPreview(!showSocialPreview)}
                          variant="outline"
                          className="flex-1"
                        >
                          {showSocialPreview ? "Hide Preview" : "Show Preview"}
                        </Button>
                        <Button
                          type="button"
                          onClick={postToInstagram}
                          disabled={postingToInstagram}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                        >
                          {postingToInstagram ? "Posting..." : "Post to Instagram"}
                        </Button>
                      </div>
                      {instagramPostStatus && (
                        <p className={`text-xs ${instagramPostStatus.includes("success") ? "text-green-600" : instagramPostStatus.includes("Failed") ? "text-red-600" : "text-blue-600"}`}>
                          {instagramPostStatus}
                        </p>
                      )}
                      
                      {/* Social Media Preview */}
                      {showSocialPreview && (
                        <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
                          <h5 className="font-medium text-sm mb-2">Instagram Preview:</h5>
                          <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs">
                                @
                              </div>
                              <span className="font-medium">@{currentUser?.instagramHandle}</span>
                            </div>
                            {formData.imageUrl && (
                              <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                                <img 
                                  src={formData.imageUrl} 
                                  alt="Event preview" 
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            )}
                            <p className="text-gray-800">
                              🎉 Join me at "{formData.title}" in {formData.city}!<br/>
                              📅 {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'TBD'}<br/>
                              📍 {formData.location}<br/><br/>
                              {formData.description && `${formData.description.slice(0, 100)}${formData.description.length > 100 ? '...' : ''}`}<br/><br/>
                              RSVP now! Link in bio 🔗<br/>
                              #NearbyTraveler #Events #{formData.city?.replace(/\s+/g, '')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      <p>Add Instagram handle in your profile to enable posting</p>
                    </div>
                  )}
                </div>

                {/* Facebook Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <h4 className="font-medium">Facebook</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        id="postToNearbytravelerFacebook"
                        checked={postToNearbytravelerFacebook}
                        onChange={(e) => setPostToNearbytravelerFacebook(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="postToNearbytravelerFacebook" className="text-gray-600 dark:text-gray-400">
                        Also post to @nearbytraveler Facebook page
                      </label>
                    </div>
                    <Button
                      type="button"
                      onClick={postToFacebook}
                      disabled={postingToFacebook}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {postingToFacebook ? "Posting..." : "Post to Facebook"}
                    </Button>
                    {facebookPostStatus && (
                      <p className={`text-xs ${facebookPostStatus.includes("success") ? "text-green-600" : facebookPostStatus.includes("Failed") ? "text-red-600" : "text-blue-600"}`}>
                        {facebookPostStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-medium mb-1">Social Media Tips:</p>
                <ul className="space-y-1">
                  <li>• Posts will include event details, location, and date</li>
                  <li>• Both Instagram and Facebook can post to @nearbytraveler accounts</li>
                  <li>• Best to post 1-3 days before the event</li>
                  <li>• Add compelling event photos for better engagement</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Menu - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                    <MoreHorizontal className="w-4 h-4" />
                    Quick Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DropdownMenuItem onClick={() => setLocation(`/events/${eventId}/participants`)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Participants
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/events/${eventId}`, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Event Page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const shareData = {
                      title: `${formData.title} - Nearby Traveler Event`,
                      text: `Join me at "${formData.title}" in ${formData.city}! 🎉\n\n${formData.description || 'Exciting event coming up!'}\n\nRSVP now:`,
                      url: `${window.location.origin}/events/${eventId}`
                    };
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                      toast({ title: "Link copied to clipboard!" });
                    }
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Create Instagram-optimized share text
                    const instagramText = `🎉 ${formData.title}\n\n📍 ${formData.venueName ? formData.venueName + ', ' : ''}${formData.city}\n📅 ${new Date(formData.startDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}\n\n${formData.description ? formData.description.substring(0, 100) + (formData.description.length > 100 ? '...' : '') : 'Join us for an amazing event!'}\n\n#NearbyTraveler #${formData.city.replace(/\s+/g, '')}Events #Community ${formData.tags.map(tag => '#' + tag.replace(/\s+/g, '')).join(' ')}\n\nRSVP: ${window.location.origin}/events/${eventId}`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: `${formData.title} - Event`,
                        text: instagramText
                      });
                    } else {
                      navigator.clipboard.writeText(instagramText);
                      toast({ 
                        title: "Instagram post copied!", 
                        description: "Perfect formatted text copied to clipboard - paste directly to Instagram!"
                      });
                    }
                  }}>
                    <Camera className="w-4 h-4 mr-2" />
                    Share to Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Navigate to create new event with current event as template
                    const templateData = {
                      venueName: formData.venueName,
                      street: formData.street,
                      city: formData.city,
                      state: formData.state,
                      country: formData.country,
                      category: formData.category,
                      tags: formData.tags,
                      requirements: formData.requirements,
                      maxParticipants: formData.maxParticipants
                    };
                    localStorage.setItem('eventTemplate', JSON.stringify(templateData));
                    setLocation('/create-event');
                    toast({ 
                      title: "Template saved!", 
                      description: "Create a new event using this one as a template"
                    });
                  }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate Event
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteEventMutation.mutate()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={updateEventMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600 w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateEventMutation.isPending ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}