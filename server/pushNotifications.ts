/**
 * OneSignal push notification helper.
 * Sends push notifications via the OneSignal REST API.
 * Gracefully no-ops when ONESIGNAL_APP_ID / ONESIGNAL_API_KEY are not set.
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_API_KEY || '';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

// In-memory dedup: prevent sending the same push to the same user within 5 minutes
// Key: `${userId}:${type}:${fromUserId}` → timestamp
const recentPushes = new Map<string, number>();
const DEDUP_MS = 5 * 60 * 1000; // 5 minutes

function cleanupDedup() {
  const now = Date.now();
  for (const [key, ts] of recentPushes.entries()) {
    if (now - ts > DEDUP_MS) recentPushes.delete(key);
  }
}

/** Notification preference categories */
export type NotifCategory = 'messages' | 'meet_requests' | 'connections' | 'events' | 'vouches';

/** Map notification types to preference categories */
const TYPE_TO_CATEGORY: Record<string, NotifCategory> = {
  message: 'messages',
  dm: 'messages',
  chatroom_message: 'messages',
  group_message: 'messages',
  event_chat_message: 'messages',
  available_now_request: 'meet_requests',
  available_now_accepted: 'meet_requests',
  quick_meetup_request: 'meet_requests',
  quick_meetup_accepted: 'meet_requests',
  connection_request: 'connections',
  connection_accepted: 'connections',
  event_rsvp: 'events',
  event_invite: 'events',
  traveler_arriving: 'events',
  vouch: 'vouches',
  vouch_received: 'vouches',
  reference_received: 'vouches',
};

/** Parse stored notification preferences JSON, return defaults if missing */
function parsePrefs(raw: string | null | undefined): Record<NotifCategory, boolean> {
  const defaults: Record<NotifCategory, boolean> = {
    messages: true,
    meet_requests: true,
    connections: true,
    events: true,
    vouches: true,
  };
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

/**
 * Send a push notification to a user.
 * @param playerId    OneSignal player/subscription ID (from users.onesignal_player_id)
 * @param title       Notification title
 * @param message     Notification body
 * @param url         URL to open when tapped (absolute or relative)
 * @param notifType   In-app notification type (for dedup + preference gating)
 * @param fromUserId  Who triggered it (for self-send guard)
 * @param toUserId    Who receives it (for dedup key)
 * @param notifPrefsRaw  Raw JSON string from users.notification_preferences
 */
export async function sendPushNotification(opts: {
  playerId: string | null | undefined;
  title: string;
  message: string;
  url: string;
  notifType?: string;
  fromUserId?: number | null;
  toUserId?: number | null;
  notifPrefsRaw?: string | null;
}): Promise<void> {
  const { playerId, title, message, url, notifType, fromUserId, toUserId, notifPrefsRaw } = opts;

  // Skip if OneSignal not configured
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;

  // Skip if no player ID
  if (!playerId) return;

  // Guard: don't send to self
  if (fromUserId && toUserId && fromUserId === toUserId) return;

  // Check notification preferences
  if (notifType) {
    const category = TYPE_TO_CATEGORY[notifType];
    if (category) {
      const prefs = parsePrefs(notifPrefsRaw);
      if (!prefs[category]) return;
    }
  }

  // Dedup: don't spam same type from same sender within 5 min
  cleanupDedup();
  const dedupKey = `${toUserId}:${notifType || 'generic'}:${fromUserId || 0}`;
  const lastSent = recentPushes.get(dedupKey);
  if (lastSent && Date.now() - lastSent < DEDUP_MS) return;
  recentPushes.set(dedupKey, Date.now());

  // Build absolute URL for the web push action
  const webUrl = url.startsWith('http') ? url : `https://nearbytraveler.org${url}`;

  try {
    const body = {
      app_id: ONESIGNAL_APP_ID,
      include_subscription_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
      web_url: webUrl,
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      priority: 10,
    };

    const resp = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn('[push] OneSignal error:', resp.status, err);
    }
  } catch (e) {
    console.warn('[push] Failed to send push notification:', e);
  }
}

/** Convenience wrapper that looks up the player ID from the DB and sends */
export async function pushToUser(opts: {
  db: any;
  users: any;
  eq: any;
  toUserId: number;
  title: string;
  message: string;
  url: string;
  notifType?: string;
  fromUserId?: number | null;
}): Promise<void> {
  const { db, users, eq, toUserId, title, message, url, notifType, fromUserId } = opts;

  // Guard: don't send to self
  if (fromUserId && fromUserId === toUserId) return;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;

  try {
    const [user] = await db
      .select({ playerId: users.onesignalPlayerId, prefs: users.notificationPreferences })
      .from(users)
      .where(eq(users.id, toUserId))
      .limit(1);

    if (!user?.playerId) return;

    await sendPushNotification({
      playerId: user.playerId,
      title,
      message,
      url,
      notifType,
      fromUserId,
      toUserId,
      notifPrefsRaw: user.prefs,
    });
  } catch (e) {
    console.warn('[push] pushToUser error:', e);
  }
}
