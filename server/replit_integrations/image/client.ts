import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { Buffer } from "node:buffer";

/**
 * Provider-agnostic Anthropic client using ANTHROPIC_API_KEY.
 * Replaces OpenAI image generation with Claude-generated SVG data URLs.
 */
function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

type Dalle3Size = "1024x1024" | "1792x1024" | "1024x1792";

// NOTE: OpenAI image generation has been replaced with Anthropic Claude.
// OpenAI references intentionally kept (commented) for rollback.
// import OpenAI from "openai";
// function getOpenAI(): OpenAI {
//   const apiKey = process.env.OPENAI_API_KEY?.trim();
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
//   return new OpenAI({ apiKey });
// }

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function svgToDataUrl(svg: string): string {
  const cleaned = svg.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`;
}

async function generateSvg(prompt: string, size: Dalle3Size): Promise<string> {
  const anthropic = getAnthropic();
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
          `\n\nConstraints:\n- Use viewBox sized for ${size}\n- No text\n- Output only <svg> markup`,
      },
    ],
  });
  return response.content?.[0]?.text ?? "";
}

/**
 * Generate an image and return as Buffer (SVG).
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const dalleSize: Dalle3Size = size === "1024x1024" ? "1024x1024" : "1024x1024";
  const svg = await generateSvg(prompt, dalleSize);
  if (!svg || !svg.includes("<svg")) return Buffer.from("", "utf8");
  return Buffer.from(svg, "utf8");
}

/**
 * Edit/combine images - not supported by DALL-E 3.
 * Kept for API compatibility; uses generate with prompt only (ignores image inputs).
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  void imageFiles;
  const svg = await generateSvg(prompt || "Create an image based on the described edits.", "1024x1024");
  const imageBytes = Buffer.from(svgToDataUrl(svg), "utf8");
  if (outputPath) fs.writeFileSync(outputPath, imageBytes);
  return imageBytes;
}
