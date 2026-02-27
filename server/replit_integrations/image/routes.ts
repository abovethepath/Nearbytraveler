import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

// NOTE: OpenAI image generation has been replaced with Anthropic Claude.
// OpenAI references intentionally kept (commented) for rollback.
// import OpenAI from "openai";
// function getOpenAI(): OpenAI {
//   const apiKey = process.env.OPENAI_API_KEY?.trim();
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
//   return new OpenAI({ apiKey });
// }

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function svgToDataUrl(svg: string): string {
  const cleaned = svg.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`;
}

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const anthropic = getAnthropic();
      const resolvedSize = size === "1792x1024" || size === "1024x1792" ? size : "1024x1024";
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system:
          "You generate a single safe inline SVG image (no scripts). Output ONLY the raw <svg>...</svg> markup. " +
          "No external images, no foreignObject, no embedded fonts.",
        messages: [
          {
            role: "user",
            content:
              "Create an SVG image that matches this prompt:\n\n" +
              prompt +
              `\n\nConstraints:\n- Use viewBox sized for ${resolvedSize}\n- No text\n- Output only <svg> markup`,
          },
        ],
      });
      const svg = response.content?.[0]?.text ?? "";
      const url = svg && svg.includes("<svg") ? svgToDataUrl(svg) : null;
      res.json({
        url,
        b64_json: url ? Buffer.from(url, "utf8").toString("base64") : null,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}
