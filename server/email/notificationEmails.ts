import { sendBrevoEmail } from "./brevoSend";
import { db } from "../db";
import { users, userNotificationSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.APP_URL || "https://nearbytraveler.org";

interface EmailResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  reason?: string;
}

async function getUserEmailPreferences(userId: number) {
  const settings = await db
    .select()
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .then(rows => rows[0]);

  return {
    emailNotifications: settings?.emailNotifications ?? true,
    eventReminders: settings?.eventReminders ?? true,
    connectionAlerts: settings?.connectionAlerts ?? true,
    messageNotifications: settings?.messageNotifications ?? true,
    weeklyDigest: settings?.weeklyDigest ?? true,
    marketingEmails: settings?.marketingEmails ?? false,
    tripApproachingReminders: settings?.tripApproachingReminders ?? true,
    cityActivityAlerts: settings?.cityActivityAlerts ?? true,
  };
}

export async function sendWelcomeEmail(userId: number): Promise<EmailResult> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    if (!user || !user.email) {
      return { success: false, reason: "User not found or no email" };
    }

    if (user.welcomeEmailSent) {
      return { success: true, skipped: true, reason: "Welcome email already sent" };
    }

    const displayName = user.name?.split(" ")[0] || user.username;
    const userTypeLabel = user.userType === "traveler" ? "Nearby Traveler" : 
                          user.userType === "local" ? "Nearby Local" : "Business Partner";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Nearby Traveler!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}! 👋</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                Welcome to the Nearby Traveler community! You've joined as a <strong>${userTypeLabel}</strong>, 
                and we're excited to help you make authentic connections wherever you go.
              </p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 30px;">
                Here's what you can do now:
              </p>
              <ul style="font-size: 16px; color: #555555; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                <li>Complete your profile to attract like-minded travelers</li>
                <li>Browse nearby locals and travelers in your area</li>
                <li>Join Quick Meetups happening near you</li>
                <li>Explore city chatrooms to meet the community</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Explore Now</a>
              </div>
              <p style="font-size: 14px; color: #888888; margin: 30px 0 0; text-align: center;">
                Have questions? Just reply to this email - we're here to help!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                Nearby Traveler - Connect with travelers and locals worldwide<br>
                <a href="${APP_URL}/settings" style="color: #f97316;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: user.email,
      subject: `Welcome to Nearby Traveler, ${displayName}! 🌍`,
      textContent: `Hi ${displayName}! Welcome to the Nearby Traveler community! You've joined as a ${userTypeLabel}. Complete your profile, browse nearby users, and start making authentic connections today. Visit ${APP_URL} to get started.`,
      htmlContent,
    });

    await db.update(users).set({ welcomeEmailSent: true }).where(eq(users.id, userId));

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send welcome email:", error);
    return { success: false, reason: error.message };
  }
}

export async function sendConnectionRequestEmail(recipientId: number, senderName: string, senderUsername: string): Promise<EmailResult> {
  try {
    const prefs = await getUserEmailPreferences(recipientId);
    if (!prefs.emailNotifications || !prefs.connectionAlerts) {
      return { success: true, skipped: true, reason: "User disabled connection alerts" };
    }

    const recipient = await db.select().from(users).where(eq(users.id, recipientId)).then(rows => rows[0]);
    if (!recipient || !recipient.email) {
      return { success: false, reason: "Recipient not found or no email" };
    }

    const displayName = recipient.name?.split(" ")[0] || recipient.username;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Connection Request! 🤝</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}!</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 30px;">
                <strong>${senderName}</strong> (@${senderUsername}) wants to connect with you on Nearby Traveler!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/profile/${senderUsername}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Profile</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                <a href="${APP_URL}/settings" style="color: #3b82f6;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: recipient.email,
      subject: `${senderName} wants to connect with you!`,
      textContent: `Hi ${displayName}! ${senderName} (@${senderUsername}) wants to connect with you on Nearby Traveler. View their profile at ${APP_URL}/profile/${senderUsername}`,
      htmlContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send connection request email:", error);
    return { success: false, reason: error.message };
  }
}

export async function sendNewMessageEmail(recipientId: number, senderName: string, senderUsername: string, messagePreview: string): Promise<EmailResult> {
  try {
    const prefs = await getUserEmailPreferences(recipientId);
    if (!prefs.emailNotifications || !prefs.messageNotifications) {
      return { success: true, skipped: true, reason: "User disabled message notifications" };
    }

    const recipient = await db.select().from(users).where(eq(users.id, recipientId)).then(rows => rows[0]);
    if (!recipient || !recipient.email) {
      return { success: false, reason: "Recipient not found or no email" };
    }

    const displayName = recipient.name?.split(" ")[0] || recipient.username;
    const truncatedMessage = messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Message! 💬</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}!</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                You have a new message from <strong>${senderName}</strong>:
              </p>
              <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="font-size: 15px; color: #555555; margin: 0; font-style: italic;">"${truncatedMessage}"</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/messages" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Message</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                <a href="${APP_URL}/settings" style="color: #10b981;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: recipient.email,
      subject: `New message from ${senderName}`,
      textContent: `Hi ${displayName}! You have a new message from ${senderName}: "${truncatedMessage}" View it at ${APP_URL}/messages`,
      htmlContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send new message email:", error);
    return { success: false, reason: error.message };
  }
}

export async function sendEventReminderEmail(userId: number, eventTitle: string, eventDate: string, eventLocation: string): Promise<EmailResult> {
  try {
    const prefs = await getUserEmailPreferences(userId);
    if (!prefs.emailNotifications || !prefs.eventReminders) {
      return { success: true, skipped: true, reason: "User disabled event reminders" };
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    if (!user || !user.email) {
      return { success: false, reason: "User not found or no email" };
    }

    const displayName = user.name?.split(" ")[0] || user.username;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Event Reminder! 📅</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}!</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                Don't forget - you have an upcoming event:
              </p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333333; margin: 0 0 10px; font-size: 18px;">${eventTitle}</h3>
                <p style="color: #555555; margin: 5px 0; font-size: 15px;">📍 ${eventLocation}</p>
                <p style="color: #555555; margin: 5px 0; font-size: 15px;">🗓️ ${eventDate}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/events" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Event</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                <a href="${APP_URL}/settings" style="color: #8b5cf6;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: user.email,
      subject: `Reminder: ${eventTitle} is coming up!`,
      textContent: `Hi ${displayName}! Don't forget about your upcoming event: ${eventTitle} at ${eventLocation} on ${eventDate}. View it at ${APP_URL}/events`,
      htmlContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send event reminder email:", error);
    return { success: false, reason: error.message };
  }
}

export async function sendTripApproachingEmail(userId: number, destination: string, startDate: string): Promise<EmailResult> {
  try {
    const prefs = await getUserEmailPreferences(userId);
    if (!prefs.emailNotifications || !prefs.tripApproachingReminders) {
      return { success: true, skipped: true, reason: "User disabled trip reminders" };
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    if (!user || !user.email) {
      return { success: false, reason: "User not found or no email" };
    }

    const displayName = user.name?.split(" ")[0] || user.username;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Trip is Coming Up! ✈️</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}!</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                Get ready! Your trip to <strong>${destination}</strong> starts on <strong>${startDate}</strong>.
              </p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 30px;">
                Here are some things you can do to prepare:
              </p>
              <ul style="font-size: 16px; color: #555555; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                <li>Browse locals in ${destination} who share your interests</li>
                <li>Check out Quick Meetups happening during your visit</li>
                <li>Join the ${destination} city chatroom</li>
                <li>Update your travel preferences for better matches</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/discover" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Find People to Meet</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                <a href="${APP_URL}/settings" style="color: #f97316;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: user.email,
      subject: `Your trip to ${destination} is coming up! ✈️`,
      textContent: `Hi ${displayName}! Your trip to ${destination} starts on ${startDate}. Browse locals who share your interests and check out Quick Meetups happening during your visit at ${APP_URL}/discover`,
      htmlContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send trip approaching email:", error);
    return { success: false, reason: error.message };
  }
}

export async function sendCityActivityEmail(userId: number, cityName: string, activityType: string, activityTitle: string): Promise<EmailResult> {
  try {
    const prefs = await getUserEmailPreferences(userId);
    if (!prefs.emailNotifications || !prefs.cityActivityAlerts) {
      return { success: true, skipped: true, reason: "User disabled city activity alerts" };
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    if (!user || !user.email) {
      return { success: false, reason: "User not found or no email" };
    }

    const displayName = user.name?.split(" ")[0] || user.username;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Activity in ${cityName}! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">Hi ${displayName}!</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                There's new ${activityType} happening in ${cityName}:
              </p>
              <div style="background-color: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
                <h3 style="color: #333333; margin: 0; font-size: 18px;">${activityTitle}</h3>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/city/${encodeURIComponent(cityName)}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Check it Out</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                <a href="${APP_URL}/settings" style="color: #ec4899;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const result = await sendBrevoEmail({
      toEmail: user.email,
      subject: `New ${activityType} in ${cityName}!`,
      textContent: `Hi ${displayName}! There's new ${activityType} happening in ${cityName}: ${activityTitle}. Check it out at ${APP_URL}/city/${encodeURIComponent(cityName)}`,
      htmlContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send city activity email:", error);
    return { success: false, reason: error.message };
  }
}
