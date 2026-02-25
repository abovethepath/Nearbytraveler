/**
 * Ambassador program: activity rules and status updates.
 *
 * Activity requirement to stay active:
 * - Must earn at least 50 points every 6 months to stay active.
 * - If inactive for 6 months → status "Inactive" (points frozen but not deleted).
 * - If inactive for 12 months → status "Revoked" (points stop counting toward equity).
 * - Ambassador can reapply after 12 months and start fresh (admin may set status back to active).
 *
 * Admin override: admins can manually reactivate or revoke any ambassador regardless of
 * activity score via PATCH /api/admin/ambassadors/:userId/status (sets ambassadorStatusSetByAdmin).
 */

import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;
const MIN_POINTS_PER_PERIOD = 50;

/**
 * Apply ambassador points and update activity window.
 * Call this whenever we award ambassador points (e.g. referral, event hosted).
 */
export async function addAmbassadorPoints(
  userId: number,
  points: number
): Promise<void> {
  const [u] = await db
    .select({
      ambassadorPoints: users.ambassadorPoints,
      ambassadorLastEarnedAt: users.ambassadorLastEarnedAt,
      ambassadorPeriodStartAt: users.ambassadorPeriodStartAt,
      ambassadorPointsInPeriod: users.ambassadorPointsInPeriod,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return;

  const now = new Date();
  const newTotal = (u.ambassadorPoints || 0) + points;

  const periodStart = u.ambassadorPeriodStartAt ? new Date(u.ambassadorPeriodStartAt) : null;
  const inNewPeriod =
    !periodStart || now.getTime() - periodStart.getTime() >= SIX_MONTHS_MS;

  const newPeriodStart = inNewPeriod ? now : periodStart;
  const newPointsInPeriod = inNewPeriod ? points : (u.ambassadorPointsInPeriod || 0) + points;

  await db
    .update(users)
    .set({
      ambassadorPoints: newTotal,
      ambassadorLastEarnedAt: now,
      ambassadorPeriodStartAt: newPeriodStart,
      ambassadorPointsInPeriod: newPointsInPeriod,
    })
    .where(eq(users.id, userId));

  await recomputeAmbassadorStatusForUser(userId);
}

/**
 * Recompute ambassador status for one user based on 6/12 month rules.
 * Skips if ambassadorStatusSetByAdmin is true.
 * @returns true if status was changed, false otherwise (or if skipped).
 */
export async function recomputeAmbassadorStatusForUser(userId: number): Promise<boolean> {
  const [u] = await db
    .select({
      ambassadorStatus: users.ambassadorStatus,
      ambassadorStatusSetByAdmin: users.ambassadorStatusSetByAdmin,
      ambassadorLastEarnedAt: users.ambassadorLastEarnedAt,
      ambassadorPeriodStartAt: users.ambassadorPeriodStartAt,
      ambassadorPointsInPeriod: users.ambassadorPointsInPeriod,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u || u.ambassadorStatusSetByAdmin) return false;
  const status = u.ambassadorStatus as string | null;
  if (status !== "active" && status !== "inactive") return false;

  const now = Date.now();
  const lastEarned = u.ambassadorLastEarnedAt ? new Date(u.ambassadorLastEarnedAt).getTime() : 0;
  const periodStart = u.ambassadorPeriodStartAt ? new Date(u.ambassadorPeriodStartAt).getTime() : 0;
  const pointsInPeriod = u.ambassadorPointsInPeriod || 0;

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
    await db.update(users).set({ ambassadorStatus: newStatus }).where(eq(users.id, userId));
    return true;
  }
  return false;
}

export interface AmbassadorRecomputeResult {
  checked: number;
  statusChanges: number;
}

/**
 * Recompute status for all ambassadors (e.g. for a cron job).
 * Skips users with ambassadorStatusSetByAdmin = true.
 * @returns Number of ambassadors checked and number of status changes made.
 */
export async function recomputeAllAmbassadorStatuses(): Promise<AmbassadorRecomputeResult> {
  const list = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        inArray(users.ambassadorStatus, ["active", "inactive"]),
        eq(users.ambassadorStatusSetByAdmin, false)
      )
    );

  let statusChanges = 0;
  for (const row of list) {
    const changed = await recomputeAmbassadorStatusForUser(row.id);
    if (changed) statusChanges++;
  }
  return { checked: list.length, statusChanges };
}

export type AmbassadorStatusValue = "active" | "inactive" | "revoked" | null;

/**
 * Admin override: set ambassador status and optionally lock it (setByAdmin = true).
 * When setByAdmin is true, recomputeAmbassadorStatusForUser will skip this user.
 */
export async function setAmbassadorStatusByAdmin(
  userId: number,
  status: AmbassadorStatusValue,
  setByAdmin: boolean
): Promise<void> {
  await db
    .update(users)
    .set({
      ambassadorStatus: status,
      ambassadorStatusSetByAdmin: setByAdmin,
    })
    .where(eq(users.id, userId));
}
