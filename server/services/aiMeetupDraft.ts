// AI Meetup Draft Service
// Extracts structured meetup data from natural language descriptions using OpenAI

import OpenAI from "openai";

export interface AiMeetupDraft {
  title: string;
  description?: string;
  meetingPoint?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  responseTime?: string;
  organizerNotes?: string;
  missing?: string[];
  confidence?: number;
}

interface MeetupDraftResult {
  draft: AiMeetupDraft | null;
  success: boolean;
  error?: string;
}

const RESPONSE_TIME_OPTIONS = [
  "1hour",
  "2hours", 
  "3hours",
  "6hours",
  "12hours",
  "24hours"
];

export class AiMeetupDraftService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    if (apiKey && apiKey.length > 20 && !apiKey.toLowerCase().startsWith("dum-") && !apiKey.includes("your_")) {
      this.openai = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
      });
    }
  }

  async extractMeetupFromText(
    text: string,
    userTimezone?: string,
    defaultCity?: string
  ): Promise<MeetupDraftResult> {
    if (!text || text.trim().length < 5) {
      return {
        draft: null,
        success: false,
        error: "Please provide more details about your meetup."
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
      const systemPrompt = `You are an expert at extracting structured quick meetup details from casual user descriptions.
A "quick meetup" is a spontaneous, same-day or very soon hangout - like "let's grab coffee now" or "anyone want to hike this afternoon?"

Your job is to parse free-form text and return ONLY valid JSON with meetup information.

CRITICAL RULES:
1. Do NOT invent or guess addresses that aren't clearly stated
2. ONLY add to "missing" array if these ESSENTIAL fields are missing: title or city. Everything else is optional.
3. Quick meetups are SPONTANEOUS - they don't need specific times, just response windows
4. responseTime should be how long someone has to respond: "1hour", "2hours", "3hours", "6hours", "12hours", "24hours"
5. Default responseTime is "2hours" for urgent meetups, "24hours" for casual ones
6. CAPTURE EVERYTHING IN organizerNotes: contact info, "call me at", "text me", "I'll be wearing X", "look for me at", "in front of X", parking info, what to bring, any extra details
7. meetingPoint should be a recognizable location name (e.g., "Starbucks on Main St", "Central Park fountain", "Beach volleyball courts")
8. LOCATION PRIORITY: ALWAYS extract the location from the user's description. Only use default city as last resort.
9. CALIFORNIA CITIES: Venice, Santa Monica, Culver City, Playa del Rey are in CALIFORNIA, not other states.
10. Be creative with titles - make them catchy and descriptive (e.g., "Coffee & Conversation", "Beach Volleyball Anyone?", "Taco Tuesday Crew")

Return ONLY a JSON object with these fields:
{
  "title": "Catchy meetup name (REQUIRED - infer from activity if not explicit)",
  "description": "Brief description of what you'll do together",
  "meetingPoint": "Where to meet (name of place, landmark, etc.)",
  "streetAddress": "Street address if given",
  "city": "City name (REQUIRED)",
  "state": "State/region if applicable",
  "country": "Country (default to 'United States' if unclear but in US)",
  "zipcode": "Zip code if explicitly given only",
  "responseTime": "One of: 1hour, 2hours, 3hours, 6hours, 12hours, 24hours",
  "organizerNotes": "Contact info, what to bring, how to find organizer, any extra details",
  "missing": ["ONLY essential missing fields: title, city"],
  "confidence": 0.0-1.0 confidence score
}`;

      const userPrompt = `User timezone: ${userTimezone || "America/Los_Angeles"}
Default city hint: ${defaultCity || "none provided"}

User's meetup description:
"${text}"

Extract the meetup details and return ONLY valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          draft: null,
          success: false,
          error: "AI returned empty response"
        };
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      }

      const parsed = JSON.parse(jsonStr) as AiMeetupDraft;

      // Validate required fields
      if (!parsed.title) {
        return {
          draft: null,
          success: false,
          error: "Could not determine meetup title from your description. Please include what activity you want to do."
        };
      }

      // Set defaults
      if (!parsed.responseTime || !RESPONSE_TIME_OPTIONS.includes(parsed.responseTime)) {
        parsed.responseTime = "2hours";
      }

      if (!parsed.country && parsed.city) {
        parsed.country = "United States";
      }

      return {
        draft: parsed,
        success: true
      };

    } catch (error: any) {
      console.error("AI meetup draft error:", error);
      
      if (error.message?.includes("JSON")) {
        return {
          draft: null,
          success: false,
          error: "Failed to parse AI response. Please try rephrasing your description."
        };
      }

      return {
        draft: null,
        success: false,
        error: "Failed to process your description. Please try again."
      };
    }
  }
}

export const aiMeetupDraftService = new AiMeetupDraftService();
