import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { CustomerUploadedPhotos } from "@/components/customer-uploaded-photos";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { getDateInputConstraints } from "@/lib/ageUtils";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES, FORM_HEADERS } from "@/lib/formConstants";
import { BUSINESS_TYPES, MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS } from "@shared/base-options";
import { isNativeIOSApp } from "@/lib/nativeApp";
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  Home,
  Building2,
  Calendar,
  MessageCircle,
  MapPin,
  Users,
  Zap,
  Plane,
  Award,
  Settings,
  ChevronRight,
  Camera,
  Star,
  Globe,
  User as UserIcon,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ProfilePageProps } from "./profile-complete-types";

export function ProfileDialogs(props: ProfilePageProps) {
  const {
    photos,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    showCropModal,
    setShowCropModal,
    cropImageSrc,
    cropSettings,
    setCropSettings,
    isDragging,
    editingTravelPlan,
    setEditingTravelPlan,
    setIsEditingPublicInterests,
    setActiveEditSection,
    form,
    setSelectedCountry,
    setSelectedCity,
    setSelectedState,
    editTravelPlan,
    isOwnProfile,
    showLocationWidget,
    setShowLocationWidget,
    user,
    pendingLocationData,
    setPendingLocationData,
    apiRequest,
    queryClient,
    toast,
    effectiveUserId,
    getApiBaseUrl,
    isEditMode,
    setIsEditMode,
    gradientOptions,
    selectedGradient,
    setSelectedGradient,
    profileForm,
    editProfile,
    onSubmitProfile,
    isFormReady,
    handleGenerateBio,
    isGeneratingBio,
    deletingTravelPlan,
    setDeletingTravelPlan,
    confirmDeleteTravelPlan,
    deleteTravelPlan,
    showTravelPlanDetails,
    setShowTravelPlanDetails,
    selectedTravelPlan,
    showCoverPhotoSelector,
    setShowCoverPhotoSelector,
    setUploadingPhoto,
    setCoverPhotoKey,
    authStorage,
    setAuthUser,
    showWriteReferenceModal,
    setShowWriteReferenceModal,
    referenceForm,
    createReference,
    showEditModal,
    setShowEditModal,
    editReferenceForm,
    editingReference,
    setEditingReference,
    updateReference,
    showPhotoUpload,
    setShowPhotoUpload,
    handleProfilePhotoUpload,
    uploadingPhoto,
    showChatroomList,
    setShowChatroomList,
    userChatrooms,
    setLocation,
    showExpandedPhoto,
    setShowExpandedPhoto,
    activeTab,
    tabRefs,
    safeGetAllActivities,
  } = props as Record<string, any>;

  return (
<>
      {/* Photo Lightbox */}
      {photos.length > 0 && selectedPhotoIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/95" 
            onClick={() => setSelectedPhotoIndex(-1)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-[90vw] sm:max-w-4xl max-h-[90vh] p-4 sm:p-6 m-2 sm:m-4 overflow-hidden min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Photo {selectedPhotoIndex + 1} of {photos.length}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg -m-2"
                onClick={() => setSelectedPhotoIndex(-1)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <img 
                src={photos[selectedPhotoIndex]?.imageUrl} 
                alt="Photo"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                disabled={selectedPhotoIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {photos[selectedPhotoIndex]?.caption}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                disabled={selectedPhotoIndex === photos.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={() => setShowCropModal(false)}>
        <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Cover Photo</DialogTitle>
            <DialogDescription>
              Adjust the position and size of your cover photo. The photo will be cropped to a 16:9 aspect ratio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image preview with crop overlay */}
            <div 
              className="relative bg-gray-100 rounded-lg overflow-hidden select-none" 
              style={{ aspectRatio: '16/9', height: '400px' }}
            >
              {cropImageSrc ? (
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={cropImageSrc}
                    alt=""
                    className={`absolute transition-transform ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      width: `${cropSettings.scale * 100}%`,
                      height: `${cropSettings.scale * 100}%`,
                      left: `${-cropSettings.x * (cropSettings.scale - 1) * 100}%`,
                      top: `${-cropSettings.y * (cropSettings.scale - 1) * 100}%`,
                      objectFit: 'cover'
                    }}
                    onLoad={() => console.log('Crop image loaded successfully')}
                    onError={(e) => console.error('Crop image failed to load:', e)}

                    draggable={false}
                  />
                  {/* Crop overlay frame */}
                  <div className="absolute inset-0 border-2 border-blue-500 shadow-lg pointer-events-none" />
                  {/* Grid overlay for better cropping guidance */}
                  <div className="absolute inset-0 pointer-events-none opacity-50">
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-r border-b border-white/50"></div>
                      <div className="border-b border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div className="border-r border-white/50"></div>
                      <div></div>
                    </div>
                  </div>
                  {/* Instructions overlay */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    Drag to position â€¢ Scroll to zoom
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No image selected</p>
                </div>
              )}
            </div>
            
            {/* Crop controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Zoom: {Math.round(cropSettings.scale * 100)}%</span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSettings(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.1) }))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSettings(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCropSettings({ x: 0.5, y: 0.5, scale: 1 })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Position
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCropModal(false)}>
              Save Cover Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Edit Modal */}
      <Dialog open={!!editingTravelPlan} onOpenChange={() => {
        // Close travel plan editing and any profile editing to avoid conflicts
        setEditingTravelPlan(null);
        setIsEditingPublicInterests(false);
        setActiveEditSection(null);
      }}>
        <DialogContent className="w-[calc(100vw-16px)] max-w-[calc(100vw-16px)] md:max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto no-scrollbar mx-2 md:mx-auto p-4 md:p-6 safe-area-inset-bottom">
          <DialogHeader>
            <DialogTitle>Edit Travel Plan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              console.log('Travel plan update:', data);
              setEditingTravelPlan(null);
            })} className="space-y-4">

              {/* Travel Destination - Use SmartLocationInput for consistency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Travel Destination *</Label>
                <SmartLocationInput
                  city={form.watch("destinationCity") || ""}
                  state={form.watch("destinationState") || ""}
                  country={form.watch("destinationCountry") || ""}
                  onLocationChange={(location) => {
                    form.setValue("destinationCity", location.city);
                    form.setValue("destinationState", location.state);
                    form.setValue("destinationCountry", location.country);
                    form.setValue("destination", `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`);
                    setSelectedCountry(location.country);
                    setSelectedCity(location.city);
                    setSelectedState(location.state);
                  }}
                  required={true}
                  placeholder={{
                    country: "Select country",
                    state: "Select state/region",
                    city: "Select city"
                  }}
                />
              </div>


              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max="9999-12-31" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max="9999-12-31" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Connection Preferences Validation Message */}
              <div className="text-center mb-4">
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-2 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                  <strong>Connection Preferences for This Trip</strong> - Choose interests, activities, and events to find the right travel matches
                </div>
                <div className="text-sm text-orange-600 bg-orange-50 border border-orange-400 rounded-md p-3 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-300">
                  <strong>Minimum: To better match others on this site, choose at least 7 from the following lists (top choices, activities, events)</strong>
                </div>
              </div>

              {/* Travel Plan Specific Interests Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-orange-600">ðŸŒ Travel Plan Specific Interests</span>
                </Label>
                <div className="text-xs text-gray-600 mb-3 p-2 bg-orange-50 rounded border">
                  <strong>Note:</strong> These are interests specific to this travel plan only, separate from your main profile interests.
                </div>
                
                {/* I am a Veteran checkbox */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="isVeteran"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="profile-veteran-checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="profile-veteran-checkbox" className="text-sm font-bold cursor-pointer">I am a Veteran</Label>
                      </div>
                    )}
                  />
                </div>

                {/* I am active duty checkbox */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="profile-active-duty-checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="profile-active-duty-checkbox" className="text-sm font-bold cursor-pointer">I am active duty</Label>
                      </div>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {[...MOST_POPULAR_INTERESTS, ...ADDITIONAL_INTERESTS].map((interest, index) => (
                    <div key={`interest-edit-${index}`} className="flex items-center space-x-1">
                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <Checkbox
                            id={`interest-edit-${interest}`}
                            checked={field.value?.includes(interest) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), interest]);
                              } else {
                                field.onChange(field.value?.filter(i => i !== interest));
                              }
                            }}
                          />
                        )}
                      />
                      <Label 
                        htmlFor={`interest-edit-${interest}`} 
                        className="text-xs cursor-pointer leading-tight font-medium"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Custom Interests Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Interests (comma-separated)
                  </Label>
                  <FormField
                    control={form.control}
                    name="customInterests"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Photography, Rock Climbing, Local Cuisine"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = field.value?.trim();
                            if (value) {
                              // Process custom interests by adding them to the interests array
                              const customItems = value.split(',').map(item => item.trim()).filter(item => item);
                              const currentInterests = form.getValues('interests') || [];
                              const newInterests = [...currentInterests];
                              customItems.forEach(item => {
                                if (!newInterests.includes(item)) {
                                  newInterests.push(item);
                                }
                              });
                              form.setValue('interests', newInterests);
                              field.onChange(''); // Clear the input
                            }
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Activities Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Activities on This Trip
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50">
                  {safeGetAllActivities().map((activity, index) => {
                    const displayText = activity.startsWith("**") && activity.endsWith("**") ? 
                      activity.slice(2, -2) : activity;
                    return (
                      <div key={`activity-edit-${index}`} className="flex items-center space-x-1">
                        <FormField
                          control={form.control}
                          name="activities"
                          render={({ field }) => (
                            <Checkbox
                              id={`activity-edit-${activity}`}
                              checked={field.value?.includes(activity) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), activity]);
                                } else {
                                  field.onChange(field.value?.filter(a => a !== activity));
                                }
                              }}
                            />
                          )}
                        />
                        <Label 
                          htmlFor={`activity-edit-${activity}`} 
                          className="text-xs cursor-pointer leading-tight font-medium"
                        >
                          {displayText}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                
                {/* Custom Activities Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Activities (comma-separated)
                  </Label>
                  <FormField
                    control={form.control}
                    name="customActivities"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Surfing Lessons, Wine Tasting, Museum Tours"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = field.value?.trim();
                            if (value) {
                              // Process custom activities by adding them to the activities array
                              const customItems = value.split(',').map(item => item.trim()).filter(item => item);
                              const currentActivities = form.getValues('activities') || [];
                              const newActivities = [...currentActivities];
                              customItems.forEach(item => {
                                if (!newActivities.includes(item)) {
                                  newActivities.push(item);
                                }
                              });
                              form.setValue('activities', newActivities);
                              field.onChange(''); // Clear the input
                            }
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Accommodation */}
              <div>
                <Label htmlFor="accommodation">
                  Accommodation on This Trip
                </Label>
                <FormField
                  control={form.control}
                  name="accommodation"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel-booked">Hotel Booked</SelectItem>
                        <SelectItem value="hostel-booked">Hostel Booked</SelectItem>
                        <SelectItem value="airbnb-booked">Airbnb Booked</SelectItem>
                        <SelectItem value="hotel">Looking for Hotel</SelectItem>
                        <SelectItem value="hostel">Looking for Hostel</SelectItem>
                        <SelectItem value="airbnb">Looking for Airbnb</SelectItem>
                        <SelectItem value="couch">Looking for Couch</SelectItem>
                        <SelectItem value="friends-family">Stay with Friends/Family</SelectItem>
                        <SelectItem value="camping">Camping</SelectItem>
                        <SelectItem value="undecided">Undecided</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Additional Activities and Events */}
              <div>
                <Label htmlFor="notes">
                  Additional Activities and Events<br />
                  (Concerts, Seminars, Must Do Activities)
                </Label>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <textarea
                      id="notes"
                      className="w-full p-2 border rounded-md resize-none"
                      rows={3}
                      placeholder="List specific activities, concerts, seminars, or must-do experiences..."
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingTravelPlan(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editTravelPlan.isPending}
                  className="flex-1"
                >
                  {editTravelPlan.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* LOCATION EDITOR - COLLAPSIBLE WIDGET */}
      {isOwnProfile && showLocationWidget && (
        <Card className="max-w-4xl mx-auto mt-6 mb-6" data-testid="location-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.userType === 'business' ? 'Business Location' : 'Hometown Location ** ONLY CHANGE IF YOU MOVE **'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationWidget(false)}
                className="text-gray-500 hover:text-gray-700 border-gray-300"
                data-testid="button-close-location"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <SmartLocationInput
              city={pendingLocationData?.hometownCity || user?.hometownCity || ''}
              state={pendingLocationData?.hometownState || user?.hometownState || ''}
              country={pendingLocationData?.hometownCountry || user?.hometownCountry || ''}
              onLocationChange={(location) => {
                // Store the pending location change instead of auto-saving
                console.log('ðŸŽ¯ Location changed - setting pendingLocationData:', location);
                console.log('ðŸŽ¯ Current user location:', {
                  city: user?.hometownCity,
                  state: user?.hometownState,
                  country: user?.hometownCountry
                });
                setPendingLocationData({
                  hometownCountry: location.country,
                  hometownState: location.state,
                  hometownCity: location.city,
                });
                console.log('ðŸŽ¯ pendingLocationData after setting:', {
                  hometownCountry: location.country,
                  hometownState: location.state,
                  hometownCity: location.city,
                });
              }}
              required={false}
              placeholder={{
                country: user?.userType === 'business' ? "Select your business country" : "Select your hometown country",
                state: user?.userType === 'business' ? "Select your business state/region" : "Select your hometown state/region", 
                city: user?.userType === 'business' ? "Select your business city" : "Select your hometown city"
              }}
            />
            
            {/* Save Button for Location Changes */}
            {pendingLocationData && (
              pendingLocationData.hometownCity !== user?.hometownCity || 
              pendingLocationData.hometownState !== user?.hometownState || 
              pendingLocationData.hometownCountry !== user?.hometownCountry
            ) && (
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={async () => {
                    if (!user?.id || !pendingLocationData) return;
                    
                    console.log('ðŸ™ï¸ SENDING LOCATION DATA TO BACKEND:', pendingLocationData);
                    
                    try {
                      const response = await apiRequest('PUT', `/api/users/${user.id}`, pendingLocationData);
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save');
                      }
                      
                      // Update the cache and clear pending data - ALSO invalidate user listings
                      await queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                      await queryClient.invalidateQueries({ queryKey: [`/api/users`] });
                      await queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
                      
                      // Refetch user data to update the widget with new values
                      await queryClient.refetchQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                      
                      setPendingLocationData(null);
                      
                      // Close the location widget to show fresh data on next open
                      setShowLocationWidget(false);
                      
                      toast({
                        title: "Location Updated",
                        description: "Your hometown has been successfully updated! You'll now appear as a local in your new city.",
                      });
                    } catch (error: any) {
                      console.error('Failed to update location:', error);
                      toast({
                        title: "Error",
                        description: error.message || "Failed to update location. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Save Location
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPendingLocationData(null)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel Changes
                </Button>
              </div>
            )}
            
            {user?.userType === 'business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input 
                  placeholder="Street Address (Optional)"
                  defaultValue={user?.streetAddress || ''}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    try {
                      const response = await fetch(`${getApiBaseUrl()}/api/users/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ streetAddress: value })
                      });
                      if (!response.ok) throw new Error('Failed to save');
                      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                    } catch (error) {
                      console.error('Failed to update street address:', error);
                    }
                  }}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <Input 
                  placeholder="ZIP Code (Optional)"
                  defaultValue={user?.zipCode || ''}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    try {
                      const response = await fetch(`${getApiBaseUrl()}/api/users/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ zipCode: value })
                      });
                      if (!response.ok) throw new Error('Failed to save');
                      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                    } catch (error) {
                      console.error('Failed to update ZIP code:', error);
                    }
                  }}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Edit Modal - inset+margin keeps dialog on-screen in WebView; z-index above overlay so content is clickable */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent 
          className="max-w-[90vw] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        >
          <DialogHeader className="flex-shrink-0 pr-10">
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Profile</DialogTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  console.log('ðŸ”¥ SAVE BUTTON CLICKED - Header');
                  console.log('ðŸ”¥ User dateOfBirth value:', user?.dateOfBirth);
                  console.log('ðŸ”¥ Form errors:', profileForm.formState.errors);
                  console.log('ðŸ”¥ Form values:', profileForm.getValues());
                  console.log('ðŸ”¥ Form valid:', profileForm.formState.isValid);
                  profileForm.handleSubmit(onSubmitProfile, (errors) => {
                    console.log('ðŸ”¥ VALIDATION ERRORS:', errors);
                  })();
                }}
                disabled={editProfile.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogHeader>
          
          {/* Scrollable body so the form can scroll on mobile/WebView */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
          {/* Show loading state while form initializes to prevent freeze */}
          {!isFormReady ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-500" />
            </div>
          ) : (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
              
              {/* Header color palette - only for own profile */}
              {isOwnProfile && gradientOptions && setSelectedGradient != null && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Header colors</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #F97316 100%)',
                      'linear-gradient(135deg, #10B981 0%, #059669 50%, #F97316 100%)',
                      'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #F97316 100%)',
                      'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #EF4444 100%)',
                      'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #10B981 100%)',
                      'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)',
                      'linear-gradient(135deg, #14B8A6 0%, #3B82F6 50%, #A855F7 100%)',
                      'linear-gradient(135deg, #EAB308 0%, #F97316 50%, #EF4444 100%)',
                    ].slice(0, gradientOptions.length).map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedGradient(idx)}
                        aria-label={`Select color option ${idx + 1}`}
                        className={`h-8 w-8 rounded-full border-2 transition-all shrink-0 ${
                          selectedGradient === idx
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
                        }`}
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ALWAYS VISIBLE PERSONAL INFORMATION SECTION */}
              <div className="space-y-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Veteran Status Field */}
                  <FormField
                    control={profileForm.control}
                    name="isVeteran"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-blue-900 dark:text-blue-100">
                            Military Veteran
                          </FormLabel>
                          <FormDescription className="text-xs text-blue-700 dark:text-blue-300">
                            Check if you are a military veteran
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active Duty Field */}
                  <FormField
                    control={profileForm.control}
                    name="isActiveDuty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-blue-900 dark:text-blue-100">
                            Active Duty Military
                          </FormLabel>
                          <FormDescription className="text-xs text-blue-700 dark:text-blue-300">
                            Check if you are currently active duty military
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Business Profile Fields */}
              {user?.userType === 'business' ? (
                <div className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your business name..."
                            maxLength={100}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {`${field.value?.length || 0}/100 characters`}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={profileForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger style={{ touchAction: 'manipulation' }}>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[2147483647] dark:bg-gray-800 dark:border-gray-600">
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="dark:text-white dark:hover:bg-gray-700">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(555) 123-4567"
                            type="tel"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="www.yourwebsite.com"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />




                  {/* Business Description Field */}
                  <FormField
                    control={profileForm.control}
                    name="businessDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe your business and services..."
                            className="min-h-[100px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            maxLength={1000}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {`${field.value?.length || 0}/1000 characters`} {(field.value?.length || 0) < 30 && '(minimum 30 required)'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                /* Traveler Profile Fields */
                <div className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Bio</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isGeneratingBio) handleGenerateBio();
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                            }}
                            disabled={isGeneratingBio}
                            className="text-xs h-7 px-2 gap-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
                            style={{ touchAction: 'manipulation', cursor: 'pointer' }}
                          >
                            <Sparkles className="w-3 h-3" />
                            {isGeneratingBio ? 'Generating...' : 'Generate bio for me'}
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell us about yourself..."
                            className="min-h-[100px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            maxLength={1000}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {`${field.value?.length || 0}/1000 characters`} {(field.value?.length || 0) < 30 && '(minimum 30 required)'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="secretActivities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hidden Gems of Your Hometown</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={`What hidden gems do you know of in ${user?.hometownCity || 'your hometown'}?`}
                            className="min-h-[80px] resize-none bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700 placeholder:text-orange-400 dark:placeholder:text-orange-500"
                            maxLength={500}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {`${field.value?.length || 0}/500 characters`}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  {/* Family Travel Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                      Family Travel and/or Willing to Meet Families
                    </h3>
                    
                    <FormField
                      control={profileForm.control}
                      name="travelingWithChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have children?</FormLabel>
                          <FormControl>
                            <div className="border rounded-md p-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="have-children"
                                  checked={!!field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(!!checked);
                                  }}
                                  className="h-4 w-4 border-gray-300 dark:border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                  data-testid="checkbox-have-children"
                                />
                                <label 
                                  htmlFor="have-children" 
                                  className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                                >
                                  Yes, I have children
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Children Ages Input - Only show when have children is checked */}
                    <FormField
                      control={profileForm.control}
                      name="childrenAges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Children's Ages (if applicable)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., 8, 12, 16 or 'None'"
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              maxLength={100}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-700 dark:text-gray-300">
                            List ages separated by commas, or write "None" if no children
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>
              )}


              {/* Travel Style removed from general profile - it's trip-specific */}

              {/* Date of Birth and Age Visibility - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    {FORM_HEADERS.DATE_OF_BIRTH}
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="overflow-hidden">
                        <FormLabel className="block text-center">Date of Birth</FormLabel>
                        <FormControl>
                          <div className="flex justify-center">
                            <Input 
                              type="date" 
                              placeholder="Your date of birth" 
                              {...field}
                              min={getDateInputConstraints().min}
                              max={getDateInputConstraints().max}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                              }}
                              className="w-full max-w-xs text-center dark:bg-gray-800 dark:border-gray-600 dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="ageVisible"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                        <div className="space-y-0.5">
                          <FormLabel>Show Age</FormLabel>
                          <div className="text-sm text-gray-500">
                            Display your age on your profile
                          </div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {PRIVACY_NOTES.DATE_OF_BIRTH}
                          </div>
                        </div>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(!field.value)}
                            className="flex items-center gap-2"
                          >
                            {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {field.value ? "Visible" : "Hidden"}
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              )}

              {/* Gender and Sexual Preference Fields - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    {FORM_HEADERS.GENDER_SEXUAL_PREFERENCE}
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[2147483647]">
                            <SelectItem value="none">Prefer not to say</SelectItem>
                            {GENDER_OPTIONS.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="sexualPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexual Preference (Select all that apply)</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border rounded-md p-3">
                            {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                              <div key={preference} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`preference-${preference}`}
                                  checked={field.value?.includes(preference) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, preference]);
                                    } else {
                                      field.onChange(currentValue.filter((p: string) => p !== preference));
                                    }
                                  }}
                                  className="h-4 w-4 border-gray-300 dark:border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <label 
                                  htmlFor={`preference-${preference}`} 
                                  className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                                >
                                  {preference}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              )}

              {/* Sexual Preference Visibility - Only show for non-business users */}
              {user?.userType !== 'business' && (
                <FormField
                  control={profileForm.control}
                  name="sexualPreferenceVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="space-y-0.5">
                        <FormLabel>Show Sexual Preference</FormLabel>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Display your sexual preference on your profile
                        </div>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {PRIVACY_NOTES.SEXUAL_PREFERENCE}
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className="flex items-center gap-2"
                        >
                          {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {field.value ? "Visible" : "Hidden"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}





            {/* Diversity Business Ownership - Only show for business users */}
            {user?.userType === 'business' && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Diversity Business Ownership</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    These categories can be hidden from public view but will still appear in keyword searches to help customers find diverse businesses.
                  </div>
                
                {/* Minority Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isMinorityOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">Minority Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is minority-owned
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                            className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showMinorityOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <Checkbox
                                  checked={!!publicField.value}
                                  onCheckedChange={(checked) => publicField.onChange(!!checked)}
                                  className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                {/* Female Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isFemaleOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">Female Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is female-owned
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                            className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showFemaleOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <Checkbox
                                  checked={!!publicField.value}
                                  onCheckedChange={(checked) => publicField.onChange(!!checked)}
                                  className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                {/* LGBTQIA+ Owned Business */}
                <FormField
                  control={profileForm.control}
                  name="isLGBTQIAOwned"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-900 dark:text-white">LGBTQIA+ Owned Business</FormLabel>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Check if your business is LGBTQIA+ owned
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                            className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <FormField
                          control={profileForm.control}
                          name="showLGBTQIAOwned"
                          render={({ field: publicField }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-6">
                              <FormControl>
                                <Checkbox
                                  checked={!!publicField.value}
                                  onCheckedChange={(checked) => publicField.onChange(!!checked)}
                                  className="border-gray-300 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-600 dark:text-gray-300">
                                  Show publicly (uncheck to hide but keep searchable)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </FormItem>
                  )}
                />

                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Privacy & Search Information:</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <li>â€¢ Even if unchecked for public display, these categories remain searchable</li>
                    <li>â€¢ Customers can find your business using keywords like "minority owned", "female owned", etc.</li>
                  </ul>
                </div>
              </div>
            </div>
            )}

              {/* Location Section - REMOVED FROM DIALOG - NOW SEPARATE */}

              {/* Moving/Hometown Change CTA - Moved to bottom as requested */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      ðŸ“ Are you moving or want to change your hometown location?
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                      Update where you're a local to connect with the right community
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      // Close the edit profile modal
                      setIsEditMode(false);
                      
                      // Open the location widget (which was hidden)
                      setShowLocationWidget(true);
                      
                      // Scroll to the location widget after it opens and renders
                      setTimeout(() => {
                        const locationWidget = document.querySelector('[data-testid="location-widget"]');
                        if (locationWidget) {
                          locationWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 300); // Longer delay to ensure widget is rendered
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white ml-3 flex-shrink-0"
                    data-testid="button-change-hometown"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Change Location
                  </Button>
                </div>
              </div>

              {/* Save/Cancel buttons - sticky at bottom on mobile for easy access */}
              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-4 border-t mt-4 -mx-6 px-6 md:relative md:border-t-0 md:mx-0 md:px-0 z-10">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditMode(false)}
                  className="flex-1"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editProfile.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold border-2 border-blue-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    console.log('ðŸ”¥ SAVE BUTTON CLICKED');
                    console.log('ðŸ”¥ Form errors:', profileForm.formState.errors);
                    console.log('ðŸ”¥ Form values:', profileForm.getValues());
                    console.log('ðŸ”¥ Form valid:', profileForm.formState.isValid);
                  }}
                  data-testid="button-save-profile"
                >
                  {editProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Delete Confirmation Dialog */}
      <Dialog open={!!deletingTravelPlan} onOpenChange={() => setDeletingTravelPlan(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Travel Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your trip to {deletingTravelPlan?.destination}? This action cannot be undone and will remove the plan from everywhere on the site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTravelPlan(null)} className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTravelPlan}
              disabled={deleteTravelPlan.isPending}
            >
              {deleteTravelPlan.isPending ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travel Plan Details Modal - FIXED WITH PROPER BACK NAVIGATION */}
      <Dialog open={showTravelPlanDetails} onOpenChange={setShowTravelPlanDetails}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <MapPin className="w-5 h-5" />
              {selectedTravelPlan?.destination} Trip Details
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowTravelPlanDetails(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          
          {selectedTravelPlan && (
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white">{selectedTravelPlan.destination}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedTravelPlan.startDate ? formatDateForDisplay(selectedTravelPlan.startDate, user?.currentCity || 'UTC') : 'Start date TBD'} - {selectedTravelPlan.endDate ? formatDateForDisplay(selectedTravelPlan.endDate, user?.currentCity || 'UTC') : 'End date TBD'}
                  </p>
                </div>
                <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                  Trip Details
                </div>
              </div>
              
              {/* Close Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowTravelPlanDetails(false)}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                >
                  Close
                </Button>
              </div>

              {/* Interests - LIMITED TO PREVENT OVERWHELMING */}
              {selectedTravelPlan.interests && selectedTravelPlan.interests.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Star className="w-4 h-4" />
                    Top Interests ({selectedTravelPlan.interests.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.interests.slice(0, 9).map((interest) => (
                      <div key={interest} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {interest}
                      </div>
                    ))}
                    {selectedTravelPlan.interests.length > 9 && (
                      <div className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        +{selectedTravelPlan.interests.length - 9} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activities */}
              {selectedTravelPlan.activities && selectedTravelPlan.activities.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-white" />
                    Activities
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.activities.map((activity) => (
                      <div key={activity} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {selectedTravelPlan.events && selectedTravelPlan.events.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4 text-white" />
                    Events
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.events.map((event) => (
                      <div key={event} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travel Style */}
              {selectedTravelPlan.travelStyle && selectedTravelPlan.travelStyle.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                    <Globe className="w-4 h-4 text-white" />
                    Travel Style
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTravelPlan.travelStyle.map((style) => (
                      <div key={style} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium leading-none whitespace-nowrap bg-white text-black border border-black appearance-none select-none gap-1.5">
                        {style}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No details message */}
              {(!selectedTravelPlan.interests || selectedTravelPlan.interests.length === 0) &&
               (!selectedTravelPlan.activities || selectedTravelPlan.activities.length === 0) &&
               (!selectedTravelPlan.events || selectedTravelPlan.events.length === 0) &&
               (!selectedTravelPlan.travelStyle || selectedTravelPlan.travelStyle.length === 0) && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-white">No trip details added yet</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Simplified Cover Photo Selector Dialog */}
      {showCoverPhotoSelector && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-[90vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Cover Photo</h2>
              <button
                onClick={() => setShowCoverPhotoSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative"
                      onClick={async () => {
                        try {
                          setUploadingPhoto(true);
                          
                          const response = await fetch(`${getApiBaseUrl()}/api/users/${effectiveUserId}/cover-photo`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageData: photo.imageUrl }),
                          });
                          
                          if (!response.ok) throw new Error('Upload failed');
                          
                          const responseData = await response.json();
                          const updatedUser = responseData?.user || responseData;
                          
                          if (updatedUser && isOwnProfile) {
                            setCoverPhotoKey(Date.now());
                            authStorage.setUser(updatedUser);
                            if (typeof setAuthUser === 'function') {
                              setAuthUser(updatedUser);
                            }
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
                          }
                          
                          setShowCoverPhotoSelector(false);
                          setUploadingPhoto(false);
                          
                          toast({
                            title: "Success!",
                            description: "Cover photo updated successfully",
                          });
                          
                        } catch (error) {
                          console.error('Error setting cover photo:', error);
                          setUploadingPhoto(false);
                          toast({
                            title: "Error",
                            description: "Failed to update cover photo",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || `Travel photo ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No travel photos available yet</p>
                  <Button
                    onClick={() => {
                      setShowCoverPhotoSelector(false);
                      setLocation('/photos');
                    }}
                    className="mt-4"
                  >
                    Upload Photos First
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCoverPhotoSelector(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Write Reference Modal - Custom Implementation */}
      {showWriteReferenceModal && (
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
          onClick={() => {
            referenceForm.reset();
            setShowWriteReferenceModal(false);
          }}
        >
          <div className="fixed inset-0 bg-black/95" />
          <div 
            className="relative z-[100001] w-full max-w-[90vw] sm:max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                referenceForm.reset();
                setShowWriteReferenceModal(false);
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Write a Reference for {user?.username}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Share your experience to help others in the community
              </p>
            </div>
          
            <Form {...referenceForm}>
              <form onSubmit={referenceForm.handleSubmit((data) => {
                console.log('ðŸš€ðŸš€ðŸš€ FORM SUBMITTED - DATA:', data);
                createReference.mutate(data);
              })} className="space-y-3">
                <FormField
                  control={referenceForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Your Reference</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Share your experience with this person..."
                          className="min-h-[60px] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={referenceForm.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Experience</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              value="positive"
                              checked={String(field.value) === "positive"}
                              onChange={() => field.onChange("positive")}
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <span className="text-sm text-green-600 dark:text-green-400">Positive</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              value="neutral"
                              checked={String(field.value) === "neutral"}
                              onChange={() => field.onChange("neutral")}
                              className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                            />
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">Neutral</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              value="negative"
                              checked={String(field.value) === "negative"}
                              onChange={() => field.onChange("negative")}
                              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-600 dark:text-red-400">Negative</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      referenceForm.reset();
                      setShowWriteReferenceModal(false);
                    }}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReference.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-submit-reference"
                  >
                    {createReference.isPending ? "Submitting..." : "Submit Reference"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Edit Reference Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reference</DialogTitle>
            <DialogDescription>
              Update your reference for this traveler
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editReferenceForm}>
            <form onSubmit={editReferenceForm.handleSubmit((data) => {
              if (editingReference) {
                updateReference.mutate({
                  referenceId: editingReference.id,
                  content: data.content,
                  experience: data.experience,
                });
              }
            })} className="space-y-4">
              <FormField
                control={editReferenceForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Reference</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your experience with this person..."
                        className="min-h-[100px] text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editReferenceForm.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="positive"
                            checked={String(field.value) === "positive"}
                            onChange={() => field.onChange("positive")}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">Positive</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="neutral"
                            checked={String(field.value) === "neutral"}
                            onChange={() => field.onChange("neutral")}
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-yellow-700">Neutral</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="negative"
                            checked={String(field.value) === "negative"}
                            onChange={() => field.onChange("negative")}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700">Negative</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    editReferenceForm.reset();
                    setShowEditModal(false);
                    setEditingReference(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateReference.isPending}>
                  {updateReference.isPending ? "Updating..." : "Update Reference"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Customer Uploaded Photos - Only for business profiles - Moved to bottom */}
      {user?.userType === 'business' && (
        <CustomerUploadedPhotos businessId={user.id} isOwnProfile={isOwnProfile} />
      )}

      {/* Photo Upload Modal - ORIGINAL SYSTEM RESTORED */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
            <DialogDescription>
              Add a new photo to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="hidden"
                id="photo-upload-input"
              />
              <label htmlFor="photo-upload-input" className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">Choose a photo</p>
                <p className="text-sm text-gray-500">
                  Click to select an image file (max 5MB)
                </p>
              </label>
            </div>
            
            {uploadingPhoto && (
              <div className="text-center">
                <p className="text-blue-600">Uploading photo...</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPhotoUpload(false)}
              disabled={uploadingPhoto}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatroom List Modal - high z-index, scroll contained, pointer events for WebView */}
      <Dialog open={showChatroomList} onOpenChange={setShowChatroomList}>
        <DialogContent
          className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2147483647,
            display: 'grid',
            visibility: 'visible',
            opacity: 1,
            pointerEvents: 'auto' as const
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              {isOwnProfile ? "Your City Chatrooms" : `${user?.username || "User"}'s City Chatrooms`} ({userChatrooms.length})
            </DialogTitle>
            <DialogDescription>
              {isOwnProfile 
                ? "Chatrooms you've joined for your hometown and travel destinations"
                : `Chatrooms ${user?.username || "this user"} has joined`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '60vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
            {userChatrooms.length > 0 ? (
              userChatrooms.filter((chatroom: any) => chatroom && chatroom.id).map((chatroom: any) => (
                <button
                  key={chatroom.id}
                  type="button"
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors w-full text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const path = `/chatroom/${chatroom.id}`;
                    // Navigate FIRST so we don't lose navigation when dialog closes
                    if (isNativeIOSApp()) {
                      const search = window.location.search || '';
                      window.location.href = `${window.location.origin}${path}${search}`;
                    } else {
                      setLocation(path);
                    }
                    setShowChatroomList(false);
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(chatroom.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                      {chatroom.name || 'Chatroom'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {chatroom.city || 'Unknown'}, {chatroom.country || ''}
                    </p>
                    {chatroom.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                        {chatroom.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 rounded-full px-2 py-1">
                        {chatroom.memberCount || 0} members
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No chatrooms yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You'll automatically join chatrooms for your hometown and travel destinations
                </p>
                <Button 
                  onClick={() => {
                    setShowChatroomList(false);
                    if (isNativeIOSApp()) {
                      const search = window.location.search || '';
                      window.location.href = `${window.location.origin}/city-chatrooms${search}`;
                    } else {
                      setLocation('/city-chatrooms');
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-black"
                >
                  Browse All Chatrooms
                </Button>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowChatroomList(false);
                if (isNativeIOSApp()) {
                  const search = window.location.search || '';
                  window.location.href = `${window.location.origin}/city-chatrooms${search}`;
                } else {
                  setLocation('/city-chatrooms');
                }
              }}
              className="w-full"
            >
              Browse All City Chatrooms
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Profile Photo Modal - Only for viewing other users' profiles */}
      <Dialog open={showExpandedPhoto} onOpenChange={setShowExpandedPhoto}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-4 bg-black/95 border-gray-700">
          <DialogHeader className="sr-only">
            <DialogTitle>Profile Photo</DialogTitle>
            <DialogDescription>Enlarged view of {user?.username}'s profile photo</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center w-full">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user?.username || 'User'}'s profile photo`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                <span className="text-6xl sm:text-8xl text-white font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="text-center mt-2">
            <p className="text-white text-lg font-semibold">@{user?.username}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Native iOS App Navigation Menu - at bottom of profile page */}
      {isNativeIOSApp() && isOwnProfile && activeTab === 'menu' && (
        <div ref={tabRefs.menu} className="mx-4 mt-2 mb-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Navigate</p>
          </div>
          {[
            ...(user?.userType === 'business' ? [
              { icon: Home, label: "Dashboard", path: "/" },
              { icon: Building2, label: "Manage Deals", path: "/business-dashboard" },
              { icon: Calendar, label: "Create Event", path: "/create-event" },
              { icon: Calendar, label: "View Events", path: "/events" },
              { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
              { icon: MessageCircle, label: "Customer Messages", path: "/messages" },
              { icon: MapPin, label: "View Cities", path: "/discover" },
            ] : [
              { icon: Home, label: "Home", path: "/" },
              { icon: MapPin, label: "Cities", path: "/discover" },
              { icon: Calendar, label: "Events", path: "/events" },
              { icon: Zap, label: "Event Integrations", path: "/integrations" },
              { icon: Plane, label: "Plan Trip", path: "/plan-trip" },
              { icon: Users, label: "Quick Meetups", path: "/quick-meetups" },
              { icon: Users, label: "City Match", path: "/match-in-city" },
              { icon: Users, label: "Connect", path: "/connect" },
              { icon: MessageCircle, label: "Chat Rooms", path: "/chatrooms" },
              { icon: MessageCircle, label: "Messages", path: "/messages" },
              { icon: Award, label: "Ambassador Program", path: "/ambassador-program" },
              { icon: Settings, label: "Settings", path: "/settings" },
            ])
          ].map((item, idx, arr) => (
            <button
              key={idx}
              onClick={() => setLocation(item.path)}
              className="w-full flex items-center gap-3 px-4 text-left text-[15px] text-gray-900 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-800"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                borderBottom: idx < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
              } as React.CSSProperties}
            >
              <div className="w-7 h-7 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </button>
          ))}
        </div>
      )}
</>
  );
}
