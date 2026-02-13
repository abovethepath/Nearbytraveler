import axios from "axios";

const LUMA_API_BASE = "https://api.lu.ma/public/v1";

interface LumaEvent {
  api_id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at?: string;
  cover_url?: string;
  url?: string;
  geo_address_json?: {
    city?: string;
    region?: string;
    country?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
    description?: string;
  };
  geo_latitude?: number;
  geo_longitude?: number;
  timezone?: string;
  event_type?: string;
  meeting_url?: string;
  visibility?: string;
}

interface LumaEventListResponse {
  entries: Array<{ event: LumaEvent }>;
  next_cursor?: string;
  has_more: boolean;
}

export class LumaClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      "x-luma-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async listEvents(options?: {
    cursor?: string;
    limit?: number;
    sortDirection?: string;
    filterBefore?: string;
  }): Promise<LumaEventListResponse> {
    const params: Record<string, any> = {};
    if (options?.cursor) params.pagination_cursor = options.cursor;
    if (options?.limit) params.number_of_items_to_return = options.limit;
    if (options?.sortDirection) params.event_sort_direction = options.sortDirection;
    if (options?.filterBefore) params.filter_events_before = options.filterBefore;

    const response = await axios.get(`${LUMA_API_BASE}/event/get-events-hosting`, {
      headers: this.headers,
      params,
    });
    return response.data;
  }

  async getEvent(eventId: string): Promise<LumaEvent> {
    const response = await axios.get(`${LUMA_API_BASE}/event/get`, {
      headers: this.headers,
      params: { event_api_id: eventId },
    });
    return response.data.event;
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.listEvents({ limit: 1 });
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      throw error;
    }
  }

  async fetchAllEvents(): Promise<LumaEvent[]> {
    const allEvents: LumaEvent[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listEvents({
        cursor,
        limit: 50,
        sortDirection: "desc",
      });

      for (const entry of response.entries) {
        allEvents.push(entry.event);
      }

      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return allEvents;
  }

  static mapToExternalEvent(event: LumaEvent, integrationId: number) {
    const geo = event.geo_address_json;
    return {
      integrationId,
      provider: "luma" as const,
      providerEventId: event.api_id,
      title: event.name,
      description: event.description || null,
      startTime: new Date(event.start_at),
      endTime: event.end_at ? new Date(event.end_at) : null,
      venueName: geo?.description || null,
      address: geo?.address || null,
      city: geo?.city || null,
      state: geo?.region || null,
      country: geo?.country || null,
      latitude: (geo?.latitude || event.geo_latitude)?.toString() || null,
      longitude: (geo?.longitude || event.geo_longitude)?.toString() || null,
      imageUrl: event.cover_url || null,
      url: event.url ? `https://lu.ma/${event.url}` : null,
      organizerName: null,
      category: event.event_type || "social",
      tags: null,
      ticketUrl: event.url ? `https://lu.ma/${event.url}` : null,
      isFree: null,
      priceInfo: null,
      capacity: null,
      attendeeCount: null,
      rawPayload: event as any,
      syncStatus: "synced",
      importedEventId: null,
    };
  }
}
