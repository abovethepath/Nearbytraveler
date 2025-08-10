import { 
  type User, type Connection, type TravelPlan, type UserPhoto, 
  type TravelMemory, type UserReference, type PassportStamp,
  type MoodBoard, type PackingList, type TravelChallenge, type UserLeaderboard
} from "@shared/schema";
import { IStorage } from "./storage";

// Temporary in-memory storage with your profile data
export class TempMemoryStorage implements IStorage {
  private users: User[] = [
    {
      id: 1,
      username: "nearbytraveler",
      email: "alex@example.com",
      password: "hashedpassword",
      name: "Aaron Lefkowitz",
      userType: "both",
      bio: "Travel enthusiast and local explorer passionate about connecting with fellow adventurers and sharing authentic experiences.",
      location: "Los Angeles, CA",
      hometownCity: "Playa Del Rey",
      hometownState: "California",
      hometownCountry: "United States",
      profileImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAADQEWNhQlgAANARanVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAANxNqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOmNjZjczMTdhLWE5OTAtNGViZi1hNzM5LWE0MGM1OTk2ZGYwNwAAAAHjanVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAABBWp1bWIAAAApanVtZGNib3IAEQAQgAAAqgA4m3EDYzJwYS5hY3Rpb25zLnYyAAAAANRjYm9yoWdhY3Rpb25zgqNmYWN0aW9ubGMycGEuY3JlYXRlZG1zb2Z0d2FyZUFnZW50v2RuYW1lZkdQVC00b/9xZGlnaXRhbFNvdXJjZVR5cGV4Rmh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvdHJhaW5lZEFsZ29yaXRobWljTWVkaWGiZmFjdGlvbm5jMnBhLmNvbnZlcnRlZG1zb2Z0d2FyZUFnZW50v2RuYW1lZkdQVC00b/9xZGlnaXRhbFNvdXJjZVR5cGV4Rmh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvdHJhaW5lZEFsZ29yaXRobWljTWVkaWE=",
      isOnline: true,
      lastActiveAt: new Date(),
      emailVerified: true,
      phoneNumber: "+1-555-0123",
      phoneVerified: true,
      dateOfBirth: new Date("1990-05-15"),
      gender: "male",
      sexualPreference: "straight",
      languages: ["English", "Spanish"],
      interests: ["Photography", "Hiking", "Local Culture", "Food Tours"],
      travelStyle: "Adventure",
      budget: "mid-range",
      smokingPreference: "non-smoker",
      drinkingPreference: "social",
      accommodation: "hostel",
      groupSize: "small",
      pace: "moderate",
      verificationStatus: "verified",
      backgroundCheckStatus: "completed",
      trustScore: 95,
      responseRate: 98,
      responseTime: "within 1 hour",
      joinDate: new Date("2023-01-15"),
      lastLogin: new Date(),
      accountStatus: "active",
      privacySettings: {},
      notificationSettings: {},
      coverPhoto: null,
      createdAt: new Date("2023-01-15")
    }
  ];

  private connections: Connection[] = [];
  private travelPlans: TravelPlan[] = [
    {
      id: 1,
      userId: 1,
      title: "European Summer Adventure",
      description: "3-month backpacking journey across Europe",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-08-31"),
      destinations: ["Paris", "Rome", "Barcelona", "Amsterdam"],
      budget: 5000,
      isPublic: true,
      status: "active",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    }
  ];

  private photos: UserPhoto[] = [];
  private memories: TravelMemory[] = [];
  private references: UserReference[] = [];
  private passportStamps: PassportStamp[] = [];
  private moodBoards: MoodBoard[] = [];
  private packingLists: PackingList[] = [];
  private challenges: TravelChallenge[] = [];
  private leaderboard: UserLeaderboard[] = [];

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async createUser(user: any): Promise<User> {
    const newUser = { ...user, id: this.users.length + 1 };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return this.users[index];
    }
    return undefined;
  }

  // Connection operations
  async getUserConnections(userId: number): Promise<Connection[]> {
    return this.connections.filter(c => c.userId === userId || c.connectedUserId === userId);
  }

  async getConnectionRequests(userId: number): Promise<Connection[]> {
    return this.connections.filter(c => c.connectedUserId === userId && c.status === 'pending');
  }

  // Travel plans
  async getUserTravelPlans(userId: number): Promise<TravelPlan[]> {
    return this.travelPlans.filter(tp => tp.userId === userId);
  }

  // Photos
  async getUserPhotos(userId: number): Promise<UserPhoto[]> {
    return this.photos.filter(p => p.userId === userId);
  }

  // Travel memories
  async getUserTravelMemories(userId: number): Promise<TravelMemory[]> {
    return this.memories.filter(m => m.userId === userId);
  }

  // References
  async getUserReferences(userId: number): Promise<UserReference[]> {
    return this.references.filter(r => r.revieweeId === userId);
  }

  // Passport stamps
  async getUserPassportStamps(userId: number): Promise<PassportStamp[]> {
    return this.passportStamps.filter(ps => ps.userId === userId);
  }

  // Mood boards
  async getUserMoodBoards(userId: number): Promise<MoodBoard[]> {
    return this.moodBoards.filter(mb => mb.userId === userId);
  }

  // Packing lists
  async getUserPackingLists(userId: number): Promise<PackingList[]> {
    return this.packingLists.filter(pl => pl.userId === userId);
  }

  // Challenges
  async getTravelChallenges(): Promise<TravelChallenge[]> {
    return this.challenges;
  }

  async getUserChallenges(userId: number): Promise<any[]> {
    return [];
  }

  // Leaderboard
  async getLeaderboard(): Promise<any[]> {
    return this.leaderboard;
  }

  // Placeholder implementations for all other required methods
  async getUsersByType(type: string): Promise<User[]> { return []; }
  async getUsersByCity(city: string): Promise<User[]> { return []; }
  async searchUsers(query: string, city?: string): Promise<User[]> { return []; }
  async createConnection(connection: any): Promise<Connection> { throw new Error("Not implemented"); }
  async updateConnection(id: number, updates: any): Promise<Connection | undefined> { return undefined; }
  async getConnection(id: number): Promise<Connection | undefined> { return undefined; }
  async deleteConnection(id: number): Promise<boolean> { return false; }
  async getMessages(userId1: number, userId2: number): Promise<any[]> { return []; }
  async createMessage(message: any): Promise<any> { throw new Error("Not implemented"); }
  async markMessagesAsRead(userId1: number, userId2: number): Promise<void> {}
  async getUnreadMessageCount(userId: number): Promise<number> { return 0; }
  async getEvents(city?: string, category?: string): Promise<any[]> { return []; }
  async getUserEvents(userId: number): Promise<any[]> { return []; }
  async createEvent(event: any): Promise<any> { throw new Error("Not implemented"); }
  async updateEvent(id: number, updates: any): Promise<any> { return undefined; }
  async deleteEvent(id: number): Promise<boolean> { return false; }
  async joinEvent(userId: number, eventId: number): Promise<any> { throw new Error("Not implemented"); }
  async leaveEvent(userId: number, eventId: number): Promise<boolean> { return false; }
  async getEventParticipants(eventId: number): Promise<any[]> { return []; }
  async createTravelPlan(plan: any): Promise<TravelPlan> { throw new Error("Not implemented"); }
  async updateTravelPlan(id: number, updates: any): Promise<TravelPlan | undefined> { return undefined; }
  async deleteTravelPlan(id: number): Promise<boolean> { return false; }
  async getTravelPlan(id: number): Promise<TravelPlan | undefined> { return undefined; }
  async addPhotoToUser(userId: number, photo: any): Promise<UserPhoto> { throw new Error("Not implemented"); }
  async updateUserPhoto(id: number, updates: any): Promise<UserPhoto | undefined> { return undefined; }
  async deleteUserPhoto(id: number): Promise<boolean> { return false; }
  async getUserPhoto(photoId: number): Promise<UserPhoto | undefined> { return undefined; }
  async createMoodEntry(entry: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserMoodEntries(userId: number): Promise<any[]> { return []; }
  async createPassportStamp(stamp: any): Promise<PassportStamp> { throw new Error("Not implemented"); }
  async updatePassportStamp(id: number, updates: any): Promise<PassportStamp | undefined> { return undefined; }
  async deletePassportStamp(id: number): Promise<boolean> { return false; }
  async createAchievement(achievement: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserAchievements(userId: number): Promise<any[]> { return []; }
  async updateUserAchievement(userId: number, achievementId: number, updates: any): Promise<any> { return undefined; }
  async getUserStats(userId: number): Promise<any> { return undefined; }
  async updateUserStats(userId: number, updates: any): Promise<any> { return undefined; }
  async createUserReference(reference: any): Promise<UserReference> { throw new Error("Not implemented"); }
  async updateUserReference(id: number, updates: any): Promise<UserReference | undefined> { return undefined; }
  async deleteUserReference(id: number): Promise<boolean> { return false; }
  async getUserReferencesGiven(userId: number): Promise<UserReference[]> { return []; }
  async createReferral(referral: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserReferrals(userId: number): Promise<any[]> { return []; }
  async updateUserReputation(userId: number, updates: any): Promise<any> { return undefined; }
  async getUserReputation(userId: number): Promise<any> { return undefined; }
  async createReferenceResponse(response: any): Promise<any> { throw new Error("Not implemented"); }
  async getReferenceResponses(referenceId: number): Promise<any[]> { return []; }
  async createAiRecommendation(recommendation: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserAiRecommendations(userId: number): Promise<any[]> { return []; }
  async createAiConversation(conversation: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserAiConversations(userId: number): Promise<any[]> { return []; }
  async updateAiConversation(id: number, updates: any): Promise<any> { return undefined; }
  async createTravelMemory(memory: any): Promise<TravelMemory> { throw new Error("Not implemented"); }
  async updateTravelMemory(id: number, updates: any): Promise<TravelMemory | undefined> { return undefined; }
  async deleteTravelMemory(id: number): Promise<boolean> { return false; }
  async getTravelMemory(id: number): Promise<TravelMemory | undefined> { return undefined; }
  async likeTravelMemory(userId: number, memoryId: number): Promise<any> { throw new Error("Not implemented"); }
  async unlikeTravelMemory(userId: number, memoryId: number): Promise<boolean> { return false; }
  async getTravelMemoryLikes(memoryId: number): Promise<any[]> { return []; }
  async createTravelMemoryComment(comment: any): Promise<any> { throw new Error("Not implemented"); }
  async getTravelMemoryComments(memoryId: number): Promise<any[]> { return []; }
  async updateTravelMemoryComment(id: number, updates: any): Promise<any> { return undefined; }
  async deleteTravelMemoryComment(id: number): Promise<boolean> { return false; }
  async createNotification(notification: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserNotifications(userId: number): Promise<any[]> { return []; }
  async markNotificationAsRead(id: number): Promise<any> { return undefined; }
  async markAllNotificationsAsRead(userId: number): Promise<void> {}
  async deleteNotification(id: number): Promise<boolean> { return false; }
  async createUserContributedInterest(interest: any): Promise<any> { throw new Error("Not implemented"); }
  async getUserContributedInterests(userId: number): Promise<any[]> { return []; }
  async approveUserContributedInterest(id: number): Promise<any> { return undefined; }
  async rejectUserContributedInterest(id: number): Promise<boolean> { return false; }
  async createMoodBoard(board: any): Promise<MoodBoard> { throw new Error("Not implemented"); }
  async updateMoodBoard(id: number, updates: any): Promise<MoodBoard | undefined> { return undefined; }
  async deleteMoodBoard(id: number): Promise<boolean> { return false; }
  async getMoodBoard(id: number): Promise<MoodBoard | undefined> { return undefined; }
  async createMoodBoardItem(item: any): Promise<any> { throw new Error("Not implemented"); }
  async getMoodBoardItems(boardId: number): Promise<any[]> { return []; }
  async updateMoodBoardItem(id: number, updates: any): Promise<any> { return undefined; }
  async deleteMoodBoardItem(id: number): Promise<boolean> { return false; }
  async createPackingList(list: any): Promise<PackingList> { throw new Error("Not implemented"); }
  async updatePackingList(id: number, updates: any): Promise<PackingList | undefined> { return undefined; }
  async deletePackingList(id: number): Promise<boolean> { return false; }
  async getPackingList(id: number): Promise<PackingList | undefined> { return undefined; }
  async createPackingListItem(item: any): Promise<any> { throw new Error("Not implemented"); }
  async getPackingListItems(listId: number): Promise<any[]> { return []; }
  async updatePackingListItem(id: number, updates: any): Promise<any> { return undefined; }
  async deletePackingListItem(id: number): Promise<boolean> { return false; }
  async createTravelChallenge(challenge: any): Promise<TravelChallenge> { throw new Error("Not implemented"); }
  async updateTravelChallenge(id: number, updates: any): Promise<TravelChallenge | undefined> { return undefined; }
  async deleteTravelChallenge(id: number): Promise<boolean> { return false; }
  async getTravelChallenge(id: number): Promise<TravelChallenge | undefined> { return undefined; }
  async createUserChallenge(userChallenge: any): Promise<any> { throw new Error("Not implemented"); }
  async updateUserChallenge(id: number, updates: any): Promise<any> { return undefined; }
  async deleteUserChallenge(id: number): Promise<boolean> { return false; }
  async getUserLeaderboardEntry(userId: number): Promise<UserLeaderboard | undefined> { return undefined; }
  async updateUserLeaderboard(userId: number, updates: any): Promise<UserLeaderboard> { throw new Error("Not implemented"); }
  async getLeaderboardRankings(limit?: number): Promise<UserLeaderboard[]> { return []; }
  async recalculateRanks(): Promise<void> {}
  async ensureInitialized(): Promise<void> {}
}