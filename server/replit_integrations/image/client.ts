import fs from "node:fs";
import OpenAI from "openai";
import { Buffer } from "node:buffer";

/**
 * Provider-agnostic OpenAI client using OPENAI_API_KEY.
 * Uses DALL-E 3 for image generation. Works on Render or any standard hosting.
 */
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

type Dalle3Size = "1024x1024" | "1792x1024" | "1024x1792";

/**
 * Generate an image and return as Buffer (DALL-E 3).
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const openai = getOpenAI();
  const dalleSize: Dalle3Size = size === "1024x1024" ? "1024x1024" : "1024x1024";
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: dalleSize,
    quality: "standard",
    response_format: "b64_json",
    n: 1,
  });
  const base64 = (response.data[0] as { b64_json?: string })?.b64_json ?? "";
  return Buffer.from(base64, "base64");
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
  const openai = getOpenAI();
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt || "Create an image based on the described edits.",
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json",
    n: 1,
  });
  const base64 = (response.data[0] as { b64_json?: string })?.b64_json ?? "";
  const imageBytes = Buffer.from(base64, "base64");
  if (outputPath) fs.writeFileSync(outputPath, imageBytes);
  return imageBytes;
}
