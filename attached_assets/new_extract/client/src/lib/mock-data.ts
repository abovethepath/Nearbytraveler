// This file contains mock data structures for development purposes
// In a real application, this would be replaced with API calls

export interface MockUser {
  id: number;
  name: string;
  userType: "traveler" | "local" | "business";
  location: string;
  bio: string;
  interests: string[];
  profileImage: string;
}

export interface MockEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  imageUrl: string;
}

export interface MockMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// Mock data would go here for fallback scenarios
// Currently using real data from the storage layer
