// COMPLETE BUSINESS PROFILE FORM CODE - COPY AND PASTE THIS ENTIRE SECTION

import React, { useState, useMemo, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Camera, Globe, Users, Calendar, Star, Settings, ArrowLeft, Upload, Edit, Edit2, Heart, MessageSquare, X, Plus, Eye, EyeOff, MessageCircle, ImageIcon, Minus, RotateCcw, Sparkles, Package, Trash2, Home, FileText, TrendingUp, MessageCircleMore, Share2, ChevronDown, Search, Zap, History, Clock, Wifi, Shield, ChevronRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { authStorage } from "@/lib/auth";
import { COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/locationData";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { BUSINESS_TYPES } from "../../../shared/base-options";
import { getMostPopularInterests, getAdditionalInterests, getAllInterests, getAllActivities, getAllEvents } from "../../../shared/base-options";

// BUSINESS PROFILE SCHEMA
const businessProfileSchema = z.object({
  bio: z.string().min(30, "Bio must be at least 30 characters").max(1000, "Bio must be 1000 characters or less"),
  businessName: z.string().max(100, "Business name must be 100 characters or less").optional(),
  businessDescription: z.string().optional(),
  businessType: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  hometownCity: z.string().optional(),
  hometownState: z.string().optional(),
  hometownCountry: z.string().optional(),
  location: z.string().optional(),
  streetAddress: z.string().optional(),
  zipCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  websiteUrl: z.string().optional(),
  // Owner/Internal Contact Information
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  travelStyle: z.array(z.string()).optional(),
  interests: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
  customInterests: z.string().optional(),
  customActivities: z.string().optional(),
  customEvents: z.string().optional(),
  isVeteran: z.boolean().default(false),
  isActiveDuty: z.boolean().default(false),
});

// BUSINESS PROFILE FORM COMPONENT
const BusinessProfileForm = ({ user, isEditMode, setIsEditMode, onSaveSuccess }) => {
  const { toast } = useToast();
  const { user: currentUser, setUser: setAuthUser } = useContext(AuthContext);
  const effectiveUserId = user?.id;

  // FORM INITIALIZATION
  const profileForm = useForm({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      bio: user?.bio || "",
      businessName: user?.business_name || user?.businessName || "",
      businessDescription: user?.business_description || user?.businessDescription || "",
      businessType: user?.business_type || user?.businessType || "",
      city: user?.city || "",
      state: user?.state || "",
      country: user?.country || "",
      hometownCity: user?.hometownCity || "",
      hometownState: user?.hometownState || "",
      hometownCountry: user?.hometownCountry || "",
      location: user?.location || "",
      streetAddress: user?.street_address || user?.streetAddress || "",
      zipCode: user?.zip_code || user?.zipCode || "",
      phoneNumber: user?.phone_number || user?.phoneNumber || "",
      websiteUrl: user?.website_url || user?.websiteUrl || user?.website || "",
      // Owner/Internal Contact Information
      ownerName: user?.name || "",
      ownerPhone: user?.ownerPhone || user?.owner_phone || "",
      travelStyle: user?.travelStyle || [],
      interests: user?.interests || [],
      activities: user?.activities || [],
      events: user?.events || [],
      customInterests: user?.customInterests || user?.custom_interests || "",
      customActivities: user?.customActivities || user?.custom_activities || "",
      customEvents: user?.customEvents || user?.custom_events || "",
      isVeteran: Boolean(user?.is_veteran || user?.isVeteran),
      isActiveDuty: Boolean(user?.is_active_duty || user?.isActiveDuty),
    }
  });

  // SAVE MUTATION
  const editProfile = useMutation({
    mutationFn: async (data) => {
      console.log('🔥 BUSINESS SAVE: Data being sent:', data);
      
      const response = await fetch(`/api/users/${effectiveUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString(),
          'x-user-type': 'business'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save error:', errorText);
        throw new Error(errorText);
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      console.log('✅ BUSINESS SAVE SUCCESS:', updatedUser);
      
      // Update all caches
      queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
      
      // Update auth storage
      authStorage.setUser(updatedUser);
      if (typeof setAuthUser === 'function') {
        setAuthUser(updatedUser);
      }
      
      toast({
        title: "Profile updated",
        description: "Your business profile has been successfully updated.",
      });
      setIsEditMode(false);
      if (onSaveSuccess) onSaveSuccess(updatedUser);
    },
    onError: (error) => {
      console.error('Save failed:', error);
      toast({
        title: "Save failed",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // FORM SUBMIT HANDLER
  const onSubmitProfile = (data) => {
    console.log('🔥 BUSINESS FORM SUBMIT:', data);
    console.log('🔥 Form errors:', profileForm.formState.errors);
    console.log('🔥 Form valid:', profileForm.formState.isValid);
    
    editProfile.mutate(data);
  };

  return (
    <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-[calc(100vw-16px)] md:max-w-2xl max-h-[80vh] md:max-h-[90vh] overflow-y-auto mx-2 md:mx-auto p-3 md:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Business Profile</DialogTitle>
            <Button
              type="button"
              size="sm"
              onClick={profileForm.handleSubmit(onSubmitProfile)}
              disabled={editProfile.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editProfile.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>
        
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
            
            {/* BUSINESS BASIC INFO */}
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
                      {field.value?.length || 0}/100 characters
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
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

              {/* BUSINESS LOCATION */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Business Location</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123 Main Street"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="12345"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* CONTACT INFO */}
              <div className="grid grid-cols-2 gap-4">
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
                          placeholder="https://www.yourwebsite.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* BIO */}
              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell travelers and locals about your business..."
                        className="min-h-[120px] resize-none"
                        maxLength={1000}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 text-right">
                      {field.value?.length || 0}/1000 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* OWNER/INTERNAL CONTACT INFORMATION - HIDDEN FROM PUBLIC */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 text-purple-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Owner Contact Information
              </h3>
              <div className="text-sm text-gray-600 mb-4 p-3 bg-purple-50 rounded border">
                <strong>Internal Use Only:</strong> This information is private and used only for platform communication. It won't be visible to customers or the public.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="John Doe"
                        />
                      </FormControl>
                      <FormDescription>
                        Used for platform communications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="(555) 123-4567"
                        />
                      </FormControl>
                      <FormDescription>
                        Private contact for platform use
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BUSINESS OFFERINGS */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">Business Offerings</h3>
              <div className="text-sm text-gray-600 mb-4 p-3 bg-orange-50 rounded border">
                <strong>Showcase what your business offers!</strong> Select relevant categories and add custom offerings to help travelers and locals discover and connect with your business.
              </div>
              
              {/* INTERESTS SECTION */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-orange-600">🌟 Services & Interests</span>
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-orange-50">
                  {getAllInterests().map((interest, index) => (
                    <div key={`profile-interest-${index}`} className="flex items-center space-x-1">
                      <FormField
                        control={profileForm.control}
                        name="interests"
                        render={({ field }) => (
                          <Checkbox
                            id={`profile-interest-${interest}`}
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
                        htmlFor={`profile-interest-${interest}`} 
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
                    Add Custom Services (comma-separated)
                  </Label>
                  <FormField
                    control={profileForm.control}
                    name="customInterests"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Photography Services, Local Tours, Art Classes"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Auto-add to interests array when user types
                          const customInterests = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                          const existingInterests = profileForm.getValues('interests') || [];
                          const newInterests = [...existingInterests.filter(interest => getAllInterests().includes(interest)), ...customInterests];
                          if (JSON.stringify(newInterests.sort()) !== JSON.stringify(existingInterests.sort())) {
                            profileForm.setValue('interests', newInterests);
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* ACTIVITIES SECTION */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-green-600">🏃‍♂️ Activities We Support</span>
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-green-50">
                  {getAllActivities().map((activity, index) => {
                    const displayText = activity.startsWith("**") && activity.endsWith("**") ? 
                      activity.slice(2, -2) : activity;
                    return (
                      <div key={`profile-activity-${index}`} className="flex items-center space-x-1">
                        <FormField
                          control={profileForm.control}
                          name="activities"
                          render={({ field }) => (
                            <Checkbox
                              id={`profile-activity-${activity}`}
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
                          htmlFor={`profile-activity-${activity}`} 
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
                    control={profileForm.control}
                    name="customActivities"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Cooking Classes, Wine Tasting, Guided Tours"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Auto-add to activities array when user types
                          const customActivities = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                          const existingActivities = profileForm.getValues('activities') || [];
                          const newActivities = [...existingActivities.filter(activity => getAllActivities().includes(activity)), ...customActivities];
                          if (JSON.stringify(newActivities.sort()) !== JSON.stringify(existingActivities.sort())) {
                            profileForm.setValue('activities', newActivities);
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>

              {/* EVENTS SECTION */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-blue-600">🎪 Events We Host</span>
                </Label>
                
                <div className="grid grid-cols-4 gap-1 border rounded-lg p-3 bg-blue-50">
                  {getAllEvents().map((event, index) => (
                    <div key={`profile-event-${index}`} className="flex items-center space-x-1">
                      <FormField
                        control={profileForm.control}
                        name="events"
                        render={({ field }) => (
                          <Checkbox
                            id={`profile-event-${event}`}
                            checked={field.value?.includes(event) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), event]);
                              } else {
                                field.onChange(field.value?.filter(e => e !== event));
                              }
                            }}
                          />
                        )}
                      />
                      <Label 
                        htmlFor={`profile-event-${event}`} 
                        className="text-xs cursor-pointer leading-tight font-medium"
                      >
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Custom Events Input */}
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-1 block text-gray-600">
                    Add Custom Events (comma-separated)
                  </Label>
                  <FormField
                    control={profileForm.control}
                    name="customEvents"
                    render={({ field }) => (
                      <Input
                        placeholder="e.g., Weekly Jazz Nights, Art Exhibitions, Food Festivals"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Auto-add to events array when user types
                          const customEvents = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                          const existingEvents = profileForm.getValues('events') || [];
                          const newEvents = [...existingEvents.filter(event => getAllEvents().includes(event)), ...customEvents];
                          if (JSON.stringify(newEvents.sort()) !== JSON.stringify(existingEvents.sort())) {
                            profileForm.setValue('events', newEvents);
                          }
                        }}
                        className="text-xs"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* SAVE BUTTONS */}
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditMode(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editProfile.isPending}
                className="flex-1"
                onClick={() => {
                  console.log('🔥 SAVE BUTTON CLICKED');
                  console.log('🔥 Form errors:', profileForm.formState.errors);
                  console.log('🔥 Form values:', profileForm.getValues());
                  console.log('🔥 Form valid:', profileForm.formState.isValid);
                }}
              >
                {editProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessProfileForm;

// USAGE EXAMPLE:
// <BusinessProfileForm 
//   user={user} 
//   isEditMode={isEditMode} 
//   setIsEditMode={setIsEditMode}
//   onSaveSuccess={(updatedUser) => {
//     console.log('Profile saved successfully:', updatedUser);
//   }}
// />