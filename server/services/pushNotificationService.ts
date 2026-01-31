import { db } from "../db";
import { users, userNotificationSettings } from "@shared/schema";
import { eq, and, isNotNull, inArray } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  ttl?: number;
}

interface PushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

async function getUserPushPreferences(userId: number) {
  const settings = await db
    .select()
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .then(rows => rows[0]);

  return {
    pushNotifications: settings?.pushNotifications ?? true,
    messageNotifications: settings?.messageNotifications ?? true,
    connectionAlerts: settings?.connectionAlerts ?? true,
    eventReminders: settings?.eventReminders ?? true,
    cityActivityAlerts: settings?.cityActivityAlerts ?? true,
  };
}

export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, any>,
  options?: { sound?: boolean; priority?: "default" | "normal" | "high" }
): Promise<PushResult> {
  try {
    const user = await db
      .select({ expoPushToken: users.expoPushToken })
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0]);

    if (!user?.expoPushToken) {
      return { success: false, error: "No push token registered" };
    }

    if (!user.expoPushToken.startsWith("ExponentPushToken[")) {
      return { success: false, error: "Invalid push token format" };
    }

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      title,
      body,
      data: data || {},
      sound: options?.sound !== false ? "default" : null,
      priority: options?.priority || "high",
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === "ok") {
      console.log(`✅ PUSH: Sent to user ${userId}: "${title}"`);
      return { success: true, ticketId: result.data.id };
    } else {
      console.error(`❌ PUSH: Failed for user ${userId}:`, result);
      return { success: false, error: result.data?.message || "Unknown error" };
    }
  } catch (error: any) {
    console.error(`❌ PUSH: Error sending to user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendPushToMultipleUsers(
  userIds: number[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  const usersWithTokens = await db
    .select({ id: users.id, expoPushToken: users.expoPushToken })
    .from(users)
    .where(and(
      inArray(users.id, userIds),
      isNotNull(users.expoPushToken)
    ));

  const validTokens = usersWithTokens.filter(
    u => u.expoPushToken?.startsWith("ExponentPushToken[")
  );

  if (validTokens.length === 0) {
    return { sent: 0, failed: userIds.length };
  }

  const messages: ExpoPushMessage[] = validTokens.map(u => ({
    to: u.expoPushToken!,
    title,
    body,
    data: data || {},
    sound: "default",
    priority: "high",
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    const sent = Array.isArray(result.data) 
      ? result.data.filter((r: any) => r.status === "ok").length 
      : 0;

    console.log(`✅ PUSH BATCH: Sent ${sent}/${validTokens.length} notifications`);
    return { sent, failed: validTokens.length - sent };
  } catch (error: any) {
    console.error("❌ PUSH BATCH: Error:", error);
    return { sent: 0, failed: validTokens.length };
  }
}

export async function sendNewMessagePush(
  recipientId: number,
  senderName: string,
  messagePreview: string
): Promise<PushResult> {
  const prefs = await getUserPushPreferences(recipientId);
  if (!prefs.pushNotifications || !prefs.messageNotifications) {
    return { success: true, error: "User disabled message push notifications" };
  }

  return sendPushNotification(
    recipientId,
    `New message from ${senderName}`,
    messagePreview.substring(0, 100),
    { type: "new_message", senderId: recipientId }
  );
}

export async function sendConnectionRequestPush(
  recipientId: number,
  requesterName: string,
  requesterId: number
): Promise<PushResult> {
  const prefs = await getUserPushPreferences(recipientId);
  if (!prefs.pushNotifications || !prefs.connectionAlerts) {
    return { success: true, error: "User disabled connection push notifications" };
  }

  return sendPushNotification(
    recipientId,
    "New Connection Request",
    `${requesterName} wants to connect with you!`,
    { type: "connection_request", requesterId }
  );
}

export async function sendEventReminderPush(
  userId: number,
  eventTitle: string,
  eventTime: string,
  eventId: number
): Promise<PushResult> {
  const prefs = await getUserPushPreferences(userId);
  if (!prefs.pushNotifications || !prefs.eventReminders) {
    return { success: true, error: "User disabled event push notifications" };
  }

  return sendPushNotification(
    userId,
    "Event Reminder",
    `${eventTitle} is starting ${eventTime}`,
    { type: "event_reminder", eventId }
  );
}

export async function sendNearbyTravelerPush(
  userId: number,
  travelerName: string,
  distance: string,
  travelerId: number
): Promise<PushResult> {
  const prefs = await getUserPushPreferences(userId);
  if (!prefs.pushNotifications || !prefs.cityActivityAlerts) {
    return { success: true, error: "User disabled nearby alerts" };
  }

  return sendPushNotification(
    userId,
    "Nearby Traveler!",
    `${travelerName} is ${distance} away`,
    { type: "nearby_traveler", travelerId },
    { priority: "high" }
  );
}

export async function sendBusinessDealPush(
  userId: number,
  businessName: string,
  dealTitle: string,
  businessId: number
): Promise<PushResult> {
  const prefs = await getUserPushPreferences(userId);
  if (!prefs.pushNotifications || !prefs.cityActivityAlerts) {
    return { success: true, error: "User disabled nearby alerts" };
  }

  return sendPushNotification(
    userId,
    `Deal from ${businessName}`,
    dealTitle,
    { type: "business_deal", businessId },
    { priority: "high" }
  );
}

export const pushNotificationService = {
  sendPushNotification,
  sendPushToMultipleUsers,
  sendNewMessagePush,
  sendConnectionRequestPush,
  sendEventReminderPush,
  sendNearbyTravelerPush,
  sendBusinessDealPush,
};
