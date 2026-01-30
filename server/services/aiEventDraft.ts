// AI Event Draft Service
// Extracts structured event data from natural language descriptions using OpenAI

import OpenAI from "openai";

export interface AiEventDraft {
  title: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  venueName?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  category?: string;
  theme?: string;
  restrictions?: string[];
  maxParticipants?: number;
  isRecurring?: boolean;
  recurrenceType?: string;
  tags?: string[];
  privacy?: "public" | "friends" | "invite_only";
  costEstimate?: string;
  missing?: string[];
  notes?: string;
  confidence?: number;
}

interface EventDraftResult {
  draft: AiEventDraft | null;
  success: boolean;
  error?: string;
}

const EVENT_CATEGORIES = [
  "Meetup",
  "Party",
  "Sports",
  "Food & Drink",
  "Arts & Culture",
  "Music",
  "Outdoor",
  "Networking",
  "Workshop",
  "Tour",
  "Festival",
  "Other"
];

export class AiEventDraftService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      this.openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
    }
  }

  async extractEventFromText(
    text: string,
    userTimezone?: string,
    defaultCity?: string
  ): Promise<EventDraftResult> {
    if (!text || text.trim().length < 5) {
      return {
        draft: null,
        success: false,
        error: "Please provide more details about your event."
      };
    }

    if (!this.openai) {
      return {
        draft: null,
        success: false,
        error: "AI service temporarily unavailable."
      };
    }

    try {
      const systemPrompt = `You are an expert at extracting structured event details from casual user descriptions.
Your job is to parse free-form text and return ONLY valid JSON with event information.

CRITICAL RULES:
1. Do NOT invent or guess addresses, dates, or times that aren't clearly stated
2. If a field is missing or ambiguous, OMIT it from the output and add the field name to the "missing" array
3. Use ISO 8601 format for dates/times (YYYY-MM-DDTHH:mm:ss)
4. For recurring events, set isRecurring=true and recurrenceType to one of: "daily", "weekly", "biweekly", "monthly"
5. Parse restrictions like "21+", "BYOB", "RSVP required", "No kids" into the restrictions array
6. Infer category from context. Valid categories: ${EVENT_CATEGORIES.join(", ")}
7. If user says something like "at my place", that's a venue hint but you need the actual address
8. Be generous with what counts as a title - if they mention an event name, use it

Return ONLY a JSON object with these optional fields:
{
  "title": "Event name",
  "description": "Description of the event",
  "startDateTime": "2026-02-07T20:00:00",
  "endDateTime": "2026-02-07T23:00:00",
  "venueName": "Name of venue if mentioned",
  "street": "Street address if given",
  "city": "City name",
  "state": "State/region if applicable",
  "country": "Country (default to 'United States' if unclear but in US)",
  "zipcode": "Zip code if given",
  "category": "One of the valid categories",
  "theme": "Party theme if mentioned",
  "restrictions": ["Array of restrictions like '21+', 'BYOB'"],
  "maxParticipants": number if mentioned,
  "isRecurring": true/false,
  "recurrenceType": "weekly, monthly, etc.",
  "tags": ["relevant", "tags"],
  "privacy": "public or friends or invite_only",
  "costEstimate": "Free, $10-20, etc.",
  "missing": ["fields that couldn't be determined"],
  "notes": "Any clarifying questions or warnings",
  "confidence": 0.0 to 1.0 how confident you are
}`;

      const userPrompt = `User timezone: ${userTimezone || "America/Los_Angeles"}
Default city hint: ${defaultCity || "none provided"}
Current year: 2026

User's event description:
"${text}"

Extract the event details and return ONLY valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          draft: null,
          success: false,
          error: "AI returned empty response."
        };
      }

      const parsed = JSON.parse(content) as AiEventDraft;

      // Validate we got at least a title
      if (!parsed.title) {
        return {
          draft: {
            ...parsed,
            missing: [...(parsed.missing || []), "title"],
            notes: "Could not determine an event name from your description. Please include what you'd like to call this event."
          },
          success: true,
          error: undefined
        };
      }

      // Ensure missing array exists and add truly missing required fields (deduplicated)
      const missingSet = new Set(parsed.missing || []);
      if (!parsed.startDateTime) missingSet.add("startDateTime");
      if (!parsed.street) missingSet.add("street");
      if (!parsed.city) missingSet.add("city");
      const missing = Array.from(missingSet);

      return {
        draft: {
          ...parsed,
          missing: missing.length > 0 ? missing : undefined
        },
        success: true
      };

    } catch (error: any) {
      console.error("AI event draft extraction failed:", error);
      return {
        draft: null,
        success: false,
        error: error?.message || "Failed to process your event description."
      };
    }
  }
}

export const aiEventDraftService = new AiEventDraftService();
