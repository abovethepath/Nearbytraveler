import axios from "axios";
import * as ical from "node-ical";

interface ParsedICSEvent {
  uid: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  url?: string;
  organizer?: string;
}

export class ICSParser {
  static async fetchAndParse(icsUrl: string): Promise<ParsedICSEvent[]> {
    const response = await axios.get(icsUrl, {
      timeout: 15000,
      maxRedirects: 3,
      headers: {
        "User-Agent": "NearbyTraveler/1.0",
      },
    });

    const parsed = ical.parseICS(response.data);
    const events: ParsedICSEvent[] = [];

    for (const key of Object.keys(parsed)) {
      const component = parsed[key];
      if (component.type !== "VEVENT") continue;

      const vevent = component as ical.VEvent;
      if (!vevent.summary || !vevent.start) continue;

      events.push({
        uid: vevent.uid || key,
        title: vevent.summary,
        description: vevent.description || undefined,
        startTime: new Date(vevent.start),
        endTime: vevent.end ? new Date(vevent.end) : undefined,
        location: vevent.location || undefined,
        url: vevent.url?.toString() || undefined,
        organizer: typeof vevent.organizer === "string"
          ? vevent.organizer
          : (vevent.organizer as any)?.val || undefined,
      });
    }

    return events;
  }

  static mapToExternalEvent(event: ParsedICSEvent, integrationId: number) {
    let city: string | null = null;
    let state: string | null = null;
    let country: string | null = null;
    let address: string | null = event.location || null;

    if (event.location) {
      const parts = event.location.split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        city = parts[parts.length - 3] || null;
        state = parts[parts.length - 2] || null;
        country = parts[parts.length - 1] || null;
        address = parts.slice(0, -2).join(", ");
      } else if (parts.length === 2) {
        city = parts[0] || null;
        country = parts[1] || null;
      }
    }

    return {
      integrationId,
      provider: "partiful" as const,
      providerEventId: event.uid,
      title: event.title,
      description: event.description || null,
      startTime: event.startTime,
      endTime: event.endTime || null,
      venueName: null,
      address,
      city,
      state,
      country,
      latitude: null,
      longitude: null,
      imageUrl: null,
      url: event.url || null,
      organizerName: event.organizer || null,
      category: "social",
      tags: null,
      ticketUrl: event.url || null,
      isFree: null,
      priceInfo: null,
      capacity: null,
      attendeeCount: null,
      rawPayload: event as any,
      syncStatus: "synced",
      importedEventId: null,
    };
  }

  static async validateUrl(icsUrl: string): Promise<boolean> {
    try {
      const response = await axios.head(icsUrl, { timeout: 10000, maxRedirects: 3 });
      const contentType = response.headers["content-type"] || "";
      return (
        contentType.includes("text/calendar") ||
        contentType.includes("text/plain") ||
        icsUrl.endsWith(".ics")
      );
    } catch {
      try {
        const response = await axios.get(icsUrl, { timeout: 10000, maxRedirects: 3, maxContentLength: 1024 });
        const data = response.data as string;
        return data.includes("BEGIN:VCALENDAR");
      } catch {
        return false;
      }
    }
  }
}
