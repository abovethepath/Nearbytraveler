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
    // Prefer Replit/custom AI integrations; fallback to standard OpenAI
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    if (apiKey && apiKey.length > 20 && !apiKey.toLowerCase().startsWith("dum-") && !apiKey.includes("your_")) {
      this.openai = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
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
2. ONLY add to "missing" array if these ESSENTIAL fields are missing: title, date/time, or city. Do NOT add optional fields like zipcode, theme, maxParticipants, privacy, costEstimate, or description to missing array
3. Use ISO 8601 format for dates/times (YYYY-MM-DDTHH:mm:ss)
4. For recurring events, set isRecurring=true and recurrenceType to one of: "daily", "weekly", "biweekly", "monthly"
5. RESTRICTIONS - ONLY add restrictions the user EXPLICITLY states like "21+", "BYOB", "RSVP required", "No kids". NEVER assume or invent restrictions. A "party" does NOT automatically mean 21+ or no kids unless the user says so. Leave restrictions empty if none are mentioned.
6. Infer category from context. Valid categories: ${EVENT_CATEGORIES.join(", ")}
7. If user says something like "at my place", that's a venue hint but you need the actual address
8. Be generous with what counts as a title - if they mention an event name, use it
9. LOCATION PRIORITY: ALWAYS extract the location (city, street) from the user's description text. Only use the "default city hint" as an absolute last resort if NO location is mentioned at all
10. COST vs REQUIREMENTS: "bring $X" or "should bring $X" or "bring at least $X" means it's a REQUIREMENT (add to restrictions array like "Bring at least $10"), NOT a cost. Only use costEstimate for actual event ticket prices or entry fees stated as "costs $X", "tickets are $X", or "$X entry"
11. CAPTURE EVERYTHING IN NOTES: The "notes" field is a catch-all for ANY extra details the user mentions that don't fit into other fields. This includes but is not limited to: "look for me", "I'll be wearing X", phone numbers, "text me at", "call me", "in front of X", "near X", "by the X", "ask for X", "in the back room", "password is X", meeting point descriptions, any contact info, PARKING INFO, dress code hints, what to bring, what to expect, who's coming, activities planned, food/drink info, music info, setup details, cleanup details, any personal touches, any conversational details about the event. If in doubt, PUT IT IN NOTES. Do NOT discard any user input - capture everything they said that isn't already in another field.
12. ZIPCODE IS OPTIONAL: Never add zipcode to missing array - if we have street + city + state, that's sufficient
13. DESCRIPTION FROM CONTEXT: If user doesn't explicitly provide a description, create a brief one from the event details. IMPORTANT: The description must match the recurrence type exactly - if biweekly, say "bi-weekly" not "weekly". Example: "Bi-weekly taco meetup" for biweekly events, "Weekly party night" for weekly events.
14. OVERNIGHT EVENTS: If the end time is earlier than the start time (e.g., starts 8pm, ends 2am), the event ends the NEXT DAY. Set endDateTime to the following day. Example: starts Jan 30 8pm, ends 2am = endDateTime is Jan 31 2am (2026-01-31T02:00:00)
15. LANDMARK vs VENUE: "in front of X", "near X", "outside X", "by the X" means X is a LANDMARK for finding the location, NOT the venue itself. Put the landmark reference in "notes" (e.g., "Meet in front of Whole Foods"). The venueName should be the actual event location if one exists (e.g., "taco stand" or leave blank if just a street meetup).
16. RELATIVE DATES: Use the provided "Today's date" to calculate relative dates. "Next Tuesday" means the upcoming Tuesday AFTER today. "This Friday" means the Friday of the current week. Always calculate the exact date.
17. CALIFORNIA CITIES: Venice, Santa Monica, Culver City, Playa del Rey, Marina del Rey, Manhattan Beach, Hermosa Beach, Redondo Beach, Long Beach, Pasadena, Burbank, Glendale, Hollywood, West Hollywood, Beverly Hills are all in CALIFORNIA, not other states. Default to "California" for these cities unless user explicitly says otherwise.

Return ONLY a JSON object with these fields (all optional except where noted):
{
  "title": "Event name (REQUIRED - infer from context if not explicit)",
  "description": "Description - create from context if not provided",
  "startDateTime": "2026-02-07T20:00:00 (REQUIRED)",
  "endDateTime": "2026-02-07T23:00:00",
  "venueName": "Name of venue if mentioned",
  "street": "Street address if given",
  "city": "City name (REQUIRED)",
  "state": "State/region if applicable",
  "country": "Country (default to 'United States' if unclear but in US)",
  "zipcode": "Zip code if explicitly given only",
  "category": "One of the valid categories",
  "theme": "Party theme if explicitly mentioned",
  "restrictions": ["Array of restrictions like '21+', 'BYOB'"],
  "maxParticipants": "number ONLY if explicitly mentioned",
  "isRecurring": true/false,
  "recurrenceType": "weekly, monthly, etc.",
  "tags": ["relevant", "tags"],
  "privacy": "public (default) or friends or invite_only",
  "costEstimate": "Only if ticket price/entry fee explicitly stated",
  "missing": ["ONLY essential missing fields: title, startDateTime, city"],
  "notes": "Special instructions like 'ask manager', 'back room', 'mention Nearby Traveler'"
}`;

      // Get current date info for relative date calculations
      const now = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = dayNames[now.getDay()];
      const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const userPrompt = `User timezone: ${userTimezone || "America/Los_Angeles"}
Default city hint: ${defaultCity || "none provided"}
Today's date: ${todayDate} (${todayDayName})
Current year: 2026

User's event description:
"${text}"

Extract the event details and return ONLY valid JSON. Use today's date to calculate any relative dates like "next Tuesday" or "this weekend".`;

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

      // FIX OVERNIGHT EVENTS: If end time is earlier than start time on same day, add 1 day to end date
      if (parsed.startDateTime && parsed.endDateTime) {
        const startDate = new Date(parsed.startDateTime);
        const endDate = new Date(parsed.endDateTime);
        
        // Check if same date but end time is earlier (overnight event)
        if (startDate.toDateString() === endDate.toDateString() && endDate <= startDate) {
          // Add 1 day to end date
          endDate.setDate(endDate.getDate() + 1);
          parsed.endDateTime = endDate.toISOString().slice(0, 19); // Format: YYYY-MM-DDTHH:MM:SS
          console.log(`🌙 Overnight event detected: Adjusted end date to ${parsed.endDateTime}`);
        }
      }

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
      const rawMessage = error?.message || "Failed to process your event description.";
      // Never expose API key details or technical auth errors to users
      const sanitized = rawMessage.toLowerCase().includes("api key") || rawMessage.toLowerCase().includes("incorrect") || rawMessage.includes("401")
        ? "AI service is not configured correctly. Please contact support or try again later."
        : rawMessage;
      return {
        draft: null,
        success: false,
        error: sanitized
      };
    }
  }
}

export const aiEventDraftService = new AiEventDraftService();
