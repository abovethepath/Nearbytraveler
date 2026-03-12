import { db } from "../db";
import { notifications } from "../../shared/schema";
import { sql } from "drizzle-orm";
import { sendPushNotification } from "./pushNotificationService";

/**
 * Checks for saved travelers who have arrived (or are arriving today) and sends
 * a push + in-app notification to the saver — once per saver + traveler + trip.
 *
 * Deduplication: embedded NOT EXISTS in the main query filters out pairs where
 * a `notifications` row of type "saved_traveler_arrived" with the same travelPlanId
 * and userId already exists. Zero schema changes required.
 *
 * Notification settings used: push_notifications + city_activity_alerts from
 * user_notification_settings. Defaults to true if no settings row exists.
 *
 * Trigger: hourly setInterval in server/index.ts (same cadence as travel status check).
 *
 * Works for both:
 * - Locals who saved an incoming traveler
 * - Travelers who saved another traveler coming to the same city
 */
export async function checkSavedTravelerArrivals(): Promise<void> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    // Include trips that started up to 24h ago to handle hourly-check boundary gaps
    const windowStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const arrivingRows = await db.execute(sql`
      SELECT
        st.user_id           AS "saverUserId",
        st.saved_user_id     AS "savedUserId",
        st.city_name         AS "cityName",
        tp.id                AS "travelPlanId",
        tp.destination_city  AS "destinationCity",
        traveler.first_name  AS "firstName",
        traveler.username    AS "username"
      FROM saved_travelers st
      JOIN travel_plans tp
        ON  tp.user_id     = st.saved_user_id
        AND tp.start_date >= ${windowStart.toISOString()}
        AND tp.start_date  < ${todayEnd.toISOString()}
        AND tp.end_date   >= ${now.toISOString()}
        AND (
          st.city_name IS NULL
          OR LOWER(tp.destination_city) = LOWER(st.city_name)
        )
      JOIN users traveler ON traveler.id = st.saved_user_id
      JOIN users saver
        ON  saver.id = st.user_id
        AND saver.expo_push_token IS NOT NULL
        AND saver.expo_push_token != ''
      LEFT JOIN user_notification_settings uns ON uns.user_id = st.user_id
      WHERE st.user_id != st.saved_user_id
        AND (uns.push_notifications   IS NULL OR uns.push_notifications   = true)
        AND (uns.city_activity_alerts IS NULL OR uns.city_activity_alerts = true)
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = st.user_id
            AND n.type    = 'saved_traveler_arrived'
            AND n.data::jsonb->>'travelPlanId' = tp.id::text
        )
    `);

    const rows = (arrivingRows as any).rows as Array<{
      saverUserId: number;
      savedUserId: number;
      cityName: string | null;
      travelPlanId: number;
      destinationCity: string | null;
      firstName: string | null;
      username: string | null;
    }>;

    if (!rows || rows.length === 0) return;

    console.log(`[savedTravelerArrival] Found ${rows.length} arrival(s) to notify`);

    for (const row of rows) {
      const city = row.destinationCity || row.cityName || "your city";
      const displayName = row.firstName || (row.username ? `@${row.username}` : null);

      const pushTitle = "Your saved traveler arrived 🛬";
      const pushBody = displayName
        ? `${displayName} just arrived in ${city}.`
        : `A traveler you saved just arrived in ${city}.`;

      const notifData = JSON.stringify({
        travelPlanId: row.travelPlanId,
        savedUserId: row.savedUserId,
        city,
      });

      // Insert in-app notification FIRST — this is also the dedup record.
      // If a concurrent run already inserted it, the insert will fail (no unique key,
      // but the NOT EXISTS in the main query prevents concurrent races on the first check).
      try {
        await db.insert(notifications).values({
          userId: row.saverUserId,
          fromUserId: row.savedUserId,
          type: "saved_traveler_arrived",
          title: pushTitle,
          message: pushBody,
          data: notifData,
        } as any);
      } catch (insertErr: any) {
        console.warn(
          `[savedTravelerArrival] Skipping — notification already recorded for saver ${row.saverUserId} / plan ${row.travelPlanId}`
        );
        continue;
      }

      // Send push (token validity and format checked inside sendPushNotification)
      try {
        await sendPushNotification(
          row.saverUserId,
          pushTitle,
          pushBody,
          {
            type: "saved_traveler_arrived",
            travelPlanId: row.travelPlanId,
            savedUserId: row.savedUserId,
            city,
          },
          { priority: "normal" }
        );
        console.log(`[savedTravelerArrival] ✅ Notified user ${row.saverUserId} — ${displayName} arrived in ${city}`);
      } catch (pushErr) {
        console.warn(`[savedTravelerArrival] Push failed for saver ${row.saverUserId}:`, pushErr);
      }
    }
  } catch (err) {
    console.error("[savedTravelerArrivalService] Error:", err);
  }
}
