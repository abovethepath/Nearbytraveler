// Shared travel options that can be extended by user input
// This ensures consistency across all travel plan editing locations
import React from 'react';
import { filterContent, validateCustomInput } from './contentFilter';

export interface TravelOption {
  id: string;
  label: string;
  category: 'predefined' | 'user_added';
  addedBy?: number; // userId if user-added
  isGlobal?: boolean; // if true, visible to all users
}

// Comprehensive travel options for consistent matching across platform

export const BASE_TRAVEL_STYLES = [
  "Solo Traveler", "Group Traveler", "Couple Traveler", "Family Traveler",
  "Budget Traveler", "Luxury Traveler", "Backpacker", "Business Traveler",
  "Adventure Seeker", "Cultural Explorer", "Foodie", "Photographer",
  "Digital Nomad", "Eco Traveler", "Wellness Traveler", "Party Traveler",
  "Solo Parent Travel", "Parent Seeking Parent Friends"
];

export const BASE_TRAVELER_TYPES = [
  "Solo Traveler", "Couple Traveler", "Group Traveler", "Family Traveler",
  "Budget Traveler", "Luxury Traveler", "Backpacker", "Business Traveler", 
  "Digital Nomad", "Student Traveler", "First Time Traveler Here", 
  "City Explorer", "Solo Parent Travel", "Parent Seeking Parent Friends"
];

export const BASE_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", 
  "Russian", "Chinese (Mandarin)", "Japanese", "Korean", "Arabic", "Hindi", 
  "Turkish", "Polish", "Swedish", "Norwegian", "Danish", "Finnish", "Greek", 
  "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay", "Tagalog", "Czech", 
  "Hungarian", "Romanian", "Bulgarian", "Croatian", "Serbian", "Slovak", 
  "Slovenian", "Lithuanian", "Latvian", "Estonian", "Ukrainian", "Swahili"
];

// Storage keys for user-added options in localStorage
const STORAGE_KEYS = {
  USER_INTERESTS: 'travelconnect_user_interests',
  USER_ACTIVITIES: 'travelconnect_user_activities', 
  USER_EVENTS: 'travelconnect_user_events'
};

// Get user-added options from localStorage
function getUserAddedOptions(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save user-added option to localStorage
function saveUserAddedOption(key: string, option: string): void {
  try {
    const existing = getUserAddedOptions(key);
    if (!existing.includes(option)) {
      existing.push(option);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (error) {
    console.error('Error saving user option:', error);
  }
}

// Remove user-added option from localStorage
function removeUserAddedOption(key: string, option: string): void {
  try {
    const existing = getUserAddedOptions(key);
    const filtered = existing.filter(item => item !== option);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing user option:', error);
  }
}

// ⚠️ DEPRECATED - USE shared/base-options.ts INSTEAD ⚠️
// This file now imports from the master base options to ensure consistency
import { 
  getMostPopularInterests as baseMostPopular,
  getAdditionalInterests as baseAdditional,
  getAllInterests as baseAllInterests,
  getAllActivities as baseAllActivities,
  getAllEvents as baseAllEvents
} from '@shared/base-options';

// Re-export the base functions for backward compatibility
export const getMostPopularInterests = baseMostPopular;
export const getAdditionalInterests = baseAdditional;
export const getAllInterests = baseAllInterests;
export const getAllActivities = baseAllActivities;
export const getAllEvents = baseAllEvents;

// Add custom options with content filtering
export function addCustomInterest(interest: string): { success: boolean; message?: string } {
  const trimmed = interest.trim();
  if (!trimmed) return { success: false, message: "Interest cannot be empty" };
  
  const { isAllowed, filteredText } = filterContent(trimmed);
  if (!isAllowed) {
    return { 
      success: false, 
      message: `"${trimmed}" is not appropriate for a travel networking platform. Please use family-friendly interests.`
    };
  }
  
  if (!getAllInterests().includes(filteredText)) {
    saveUserAddedOption(STORAGE_KEYS.USER_INTERESTS, filteredText);
  }
  return { success: true };
}

export function addCustomActivity(activity: string): { success: boolean; message?: string } {
  const trimmed = activity.trim();
  if (!trimmed) return { success: false, message: "Activity cannot be empty" };
  
  const { isAllowed, filteredText } = filterContent(trimmed);
  if (!isAllowed) {
    return { 
      success: false, 
      message: `"${trimmed}" is not appropriate for a travel networking platform. Please use family-friendly activities.`
    };
  }
  
  if (!getAllActivities().includes(filteredText)) {
    saveUserAddedOption(STORAGE_KEYS.USER_ACTIVITIES, filteredText);
  }
  return { success: true };
}

export function addCustomEvent(event: string): { success: boolean; message?: string } {
  const trimmed = event.trim();
  if (!trimmed) return { success: false, message: "Event cannot be empty" };
  
  const { isAllowed, filteredText } = filterContent(trimmed);
  if (!isAllowed) {
    return { 
      success: false, 
      message: `"${trimmed}" is not appropriate for a travel networking platform. Please use family-friendly events.`
    };
  }
  
  if (!getAllEvents().includes(filteredText)) {
    saveUserAddedOption(STORAGE_KEYS.USER_EVENTS, filteredText);
  }
  return { success: true };
}

// Remove custom options (only user-added ones can be removed)
export function removeCustomInterest(interest: string): void {
  if (!getAllInterests().includes(interest)) {
    removeUserAddedOption(STORAGE_KEYS.USER_INTERESTS, interest);
  }
}

export function removeCustomActivity(activity: string): void {
  if (!getAllActivities().includes(activity)) {
    removeUserAddedOption(STORAGE_KEYS.USER_ACTIVITIES, activity);
  }
}

export function removeCustomEvent(event: string): void {
  if (!getAllEvents().includes(event)) {
    removeUserAddedOption(STORAGE_KEYS.USER_EVENTS, event);
  }
}

// Check if option is user-added (can be removed)
export function isUserAdded(option: string, type: 'interests' | 'activities' | 'events'): boolean {
  const baseOptions = type === 'interests' ? getAllInterests() : 
                     type === 'activities' ? getAllActivities() : getAllEvents();
  return !baseOptions.includes(option);
}

// Hook for reactive updates (can be used with React state)
export function useTravelOptions() {
  const [updateTrigger, setUpdateTrigger] = React.useState(0);
  
  const refresh = () => setUpdateTrigger(prev => prev + 1);
  
  const addInterest = (interest: string) => {
    addCustomInterest(interest);
    refresh();
  };
  
  const addActivity = (activity: string) => {
    addCustomActivity(activity);
    refresh();
  };
  
  const addEvent = (event: string) => {
    addCustomEvent(event);
    refresh();
  };
  
  return {
    interests: getAllInterests(),
    activities: getAllActivities(),
    events: getAllEvents(),
    addInterest,
    addActivity,
    addEvent,
    refresh
  };
}