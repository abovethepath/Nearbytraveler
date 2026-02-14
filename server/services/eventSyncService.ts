import { db } from "../db";
import { eventIntegrations, externalEvents } from "../../shared/schema";
import { eq, and, gte, asc, inArray } from "drizzle-orm";
import { LumaClient } from "./lumaClient";
import { ICSParser } from "./icsParser";

const MAX_EVENTS_PER_INTEGRATION = 30;

export class EventSyncService {
  async syncIntegration(integrationId: number): Promise<{ synced: number; errors: string[] }> {
    const [integration] = await db
      .select()
      .from(eventIntegrations)
      .where(eq(eventIntegrations.id, integrationId));

    if (!integration) {
      return { synced: 0, errors: ["Integration not found"] };
    }

    if (integration.provider === "luma") {
      return this.syncLuma(integration);
    } else if (integration.provider === "partiful") {
      return this.syncPartiful(integration);
    }

    return { synced: 0, errors: [`Unknown provider: ${integration.provider}`] };
  }

  private async syncLuma(integration: any): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    if (!integration.apiKey) {
      return { synced: 0, errors: ["No API key configured"] };
    }

    try {
      const client = new LumaClient(integration.apiKey);
      const lumaEvents = await client.fetchAllEvents();

      for (const lumaEvent of lumaEvents) {
        try {
          const mapped = LumaClient.mapToExternalEvent(lumaEvent, integration.id);

          const existing = await db
            .select()
            .from(externalEvents)
            .where(
              and(
                eq(externalEvents.integrationId, integration.id),
                eq(externalEvents.providerEventId, mapped.providerEventId)
              )
            );

          if (existing.length > 0) {
            await db
              .update(externalEvents)
              .set({
                title: mapped.title,
                description: mapped.description,
                startTime: mapped.startTime,
                endTime: mapped.endTime,
                venueName: mapped.venueName,
                address: mapped.address,
                city: mapped.city,
                state: mapped.state,
                country: mapped.country,
                latitude: mapped.latitude,
                longitude: mapped.longitude,
                imageUrl: mapped.imageUrl,
                url: mapped.url,
                rawPayload: mapped.rawPayload,
                lastSyncedAt: new Date(),
                syncStatus: "synced",
              })
              .where(eq(externalEvents.id, existing[0].id));
          } else {
            await db.insert(externalEvents).values(mapped);
          }
          synced++;
        } catch (err: any) {
          errors.push(`Failed to sync event ${lumaEvent.api_id}: ${err.message}`);
        }
      }

      const pruned = await this.enforceEventCap(integration.id);
      if (pruned > 0) {
        synced = Math.min(synced, MAX_EVENTS_PER_INTEGRATION);
      }

      await db
        .update(eventIntegrations)
        .set({
          lastSyncAt: new Date(),
          nextSyncAt: new Date(Date.now() + (integration.syncIntervalMinutes || 60) * 60000),
          eventCount: synced,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(eventIntegrations.id, integration.id));
    } catch (err: any) {
      errors.push(`Luma sync failed: ${err.message}`);
      await db
        .update(eventIntegrations)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(eventIntegrations.id, integration.id));
    }

    return { synced, errors };
  }

  private async syncPartiful(integration: any): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    if (!integration.icsUrl) {
      return { synced: 0, errors: ["No ICS URL configured"] };
    }

    try {
      const icsEvents = await ICSParser.fetchAndParse(integration.icsUrl);

      for (const icsEvent of icsEvents) {
        try {
          const mapped = ICSParser.mapToExternalEvent(icsEvent, integration.id);

          const existing = await db
            .select()
            .from(externalEvents)
            .where(
              and(
                eq(externalEvents.integrationId, integration.id),
                eq(externalEvents.providerEventId, mapped.providerEventId)
              )
            );

          if (existing.length > 0) {
            await db
              .update(externalEvents)
              .set({
                title: mapped.title,
                description: mapped.description,
                startTime: mapped.startTime,
                endTime: mapped.endTime,
                address: mapped.address,
                city: mapped.city,
                state: mapped.state,
                country: mapped.country,
                url: mapped.url,
                organizerName: mapped.organizerName,
                rawPayload: mapped.rawPayload,
                lastSyncedAt: new Date(),
                syncStatus: "synced",
              })
              .where(eq(externalEvents.id, existing[0].id));
          } else {
            await db.insert(externalEvents).values(mapped);
          }
          synced++;
        } catch (err: any) {
          errors.push(`Failed to sync ICS event ${icsEvent.uid}: ${err.message}`);
        }
      }

      const pruned = await this.enforceEventCap(integration.id);
      if (pruned > 0) {
        synced = Math.min(synced, MAX_EVENTS_PER_INTEGRATION);
      }

      await db
        .update(eventIntegrations)
        .set({
          lastSyncAt: new Date(),
          nextSyncAt: new Date(Date.now() + (integration.syncIntervalMinutes || 60) * 60000),
          eventCount: synced,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(eventIntegrations.id, integration.id));
    } catch (err: any) {
      errors.push(`Partiful sync failed: ${err.message}`);
      await db
        .update(eventIntegrations)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(eventIntegrations.id, integration.id));
    }

    return { synced, errors };
  }

  private async enforceEventCap(integrationId: number): Promise<number> {
    const futureEvents = await db
      .select({ id: externalEvents.id })
      .from(externalEvents)
      .where(
        and(
          eq(externalEvents.integrationId, integrationId),
          eq(externalEvents.syncStatus, "synced"),
          gte(externalEvents.startTime, new Date())
        )
      )
      .orderBy(asc(externalEvents.startTime));

    if (futureEvents.length <= MAX_EVENTS_PER_INTEGRATION) {
      return 0;
    }

    const keepIds = futureEvents.slice(0, MAX_EVENTS_PER_INTEGRATION).map(e => e.id);
    const excessIds = futureEvents.slice(MAX_EVENTS_PER_INTEGRATION).map(e => e.id);

    if (excessIds.length > 0) {
      await db
        .delete(externalEvents)
        .where(
          and(
            eq(externalEvents.integrationId, integrationId),
            inArray(externalEvents.id, excessIds)
          )
        );
    }

    return excessIds.length;
  }

  async syncAllDue(): Promise<void> {
    const now = new Date();
    const dueIntegrations = await db
      .select()
      .from(eventIntegrations)
      .where(eq(eventIntegrations.status, "active"));

    for (const integration of dueIntegrations) {
      if (!integration.nextSyncAt || integration.nextSyncAt <= now) {
        try {
          await this.syncIntegration(integration.id);
        } catch (err) {
          console.error(`Auto-sync failed for integration ${integration.id}:`, err);
        }
      }
    }
  }
}

export const eventSyncService = new EventSyncService();
