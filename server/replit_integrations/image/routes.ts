import type { Express, Request, Response } from "express";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const openai = getOpenAI();
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: size === "1792x1024" || size === "1024x1792" ? size : "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });

      const imageData = response.data[0] as { url?: string; b64_json?: string } | undefined;
      res.json({
        url: imageData?.url ?? null,
        b64_json: imageData?.b64_json ?? null,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}
