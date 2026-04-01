/**
 * Connector program: activity rules and status updates.
 *
 * Activity requirement to stay active:
 * - Must earn at least 200 points every 6 months to stay active.
 * - If inactive for 6 months → status "Inactive" (points frozen but not deleted).
 * - If inactive for 12 months → status "Revoked" (points stop counting toward equity).
 * - Connector can reapply after 12 months and start fresh (admin may set status back to active).
 *
 * Admin override: admins can manually reactivate or revoke any connector regardless of
 * activity score via PATCH /api/admin/connectors/:userId/status (sets connectorStatusSetByAdmin).
 */

import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;
const MIN_POINTS_PER_PERIOD = 200;

/**
 * Apply connector points and update activity window.
 * Call this whenever we award connector points (e.g. referral, event hosted).
 */
export async function addConnectorPoints(
  userId: number,
  points: number
): Promise<void> {
  const [u] = await db
    .select({
      connectorPoints: users.connectorPoints,
      connectorLastEarnedAt: users.connectorLastEarnedAt,
      connectorPeriodStartAt: users.connectorPeriodStartAt,
      connectorPointsInPeriod: users.connectorPointsInPeriod,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return;

  const now = new Date();
  const newTotal = (u.connectorPoints || 0) + points;

  const periodStart = u.connectorPeriodStartAt ? new Date(u.connectorPeriodStartAt) : null;
  const inNewPeriod =
    !periodStart || now.getTime() - periodStart.getTime() >= SIX_MONTHS_MS;

  const newPeriodStart = inNewPeriod ? now : periodStart;
  const newPointsInPeriod = inNewPeriod ? points : (u.connectorPointsInPeriod || 0) + points;

  await db
    .update(users)
    .set({
      connectorPoints: newTotal,
      connectorLastEarnedAt: now,
      connectorPeriodStartAt: newPeriodStart,
      connectorPointsInPeriod: newPointsInPeriod,
    })
    .where(eq(users.id, userId));

  await recomputeConnectorStatusForUser(userId);

  // 5% referral chain bonus: if this connector was referred by another connector, award 5% to the referrer
  try {
    const chainRows = await db.execute(sql`
      SELECT referrer_id FROM connector_referral_chains WHERE referred_id = ${userId}
    `);
    for (const row of chainRows.rows as any[]) {
      const bonusPoints = Math.floor(points * 0.05);
      if (bonusPoints > 0 && row.referrer_id) {
        await db.update(users).set({
          connectorPoints: sql`COALESCE(connector_points, 0) + ${bonusPoints}`,
          connectorLastEarnedAt: new Date(),
        }).where(eq(users.id, row.referrer_id));
      }
    }
  } catch (e) { console.error('Connector 5% chain bonus error:', e); }
}

/**
 * Recompute connector status for one user based on 6/12 month rules.
 * Skips if connectorStatusSetByAdmin is true.
 * @returns true if status was changed, false otherwise (or if skipped).
 */
export async function recomputeConnectorStatusForUser(userId: number): Promise<boolean> {
  const [u] = await db
    .select({
      connectorStatus: users.connectorStatus,
      connectorStatusSetByAdmin: users.connectorStatusSetByAdmin,
      connectorLastEarnedAt: users.connectorLastEarnedAt,
      connectorPeriodStartAt: users.connectorPeriodStartAt,
      connectorPointsInPeriod: users.connectorPointsInPeriod,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u || u.connectorStatusSetByAdmin) return false;
  const status = u.connectorStatus as string | null;
  if (status !== "active" && status !== "inactive") return false;

  const now = Date.now();
  const lastEarned = u.connectorLastEarnedAt ? new Date(u.connectorLastEarnedAt).getTime() : 0;
  const periodStart = u.connectorPeriodStartAt ? new Date(u.connectorPeriodStartAt).getTime() : 0;
  const pointsInPeriod = u.connectorPointsInPeriod || 0;

  let newStatus: "active" | "inactive" | "revoked" | null = status as "active" | "inactive";

  if (now - lastEarned >= TWELVE_MONTHS_MS) {
    newStatus = "revoked";
  } else if (
    status === "active" &&
    (periodStart === 0 || now - periodStart >= SIX_MONTHS_MS) &&
    pointsInPeriod < MIN_POINTS_PER_PERIOD
  ) {
    newStatus = "inactive";
  } else if (status === "inactive" && pointsInPeriod >= MIN_POINTS_PER_PERIOD) {
    newStatus = "active";
  }

  if (newStatus !== status) {
    await db.update(users).set({ connectorStatus: newStatus }).where(eq(users.id, userId));
    return true;
  }
  return false;
}

export interface ConnectorRecomputeResult {
  checked: number;
  statusChanges: number;
}

/**
 * Recompute status for all connectors (e.g. for a cron job).
 * Skips users with connectorStatusSetByAdmin = true.
 * @returns Number of connectors checked and number of status changes made.
 */
export async function recomputeAllConnectorStatuses(): Promise<ConnectorRecomputeResult> {
  const list = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        inArray(users.connectorStatus, ["active", "inactive"]),
        eq(users.connectorStatusSetByAdmin, false)
      )
    );

  let statusChanges = 0;
  for (const row of list) {
    const changed = await recomputeConnectorStatusForUser(row.id);
    if (changed) statusChanges++;
  }
  return { checked: list.length, statusChanges };
}

export type ConnectorStatusValue = "active" | "inactive" | "revoked" | null;

/**
 * Admin override: set connector status and optionally lock it (setByAdmin = true).
 * When setByAdmin is true, recomputeConnectorStatusForUser will skip this user.
 */
export async function setConnectorStatusByAdmin(
  userId: number,
  status: ConnectorStatusValue,
  setByAdmin: boolean
): Promise<void> {
  await db
    .update(users)
    .set({
      connectorStatus: status,
      connectorStatusSetByAdmin: setByAdmin,
    })
    .where(eq(users.id, userId));
}
