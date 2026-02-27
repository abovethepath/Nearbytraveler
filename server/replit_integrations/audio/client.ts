// NOTE: OpenAI audio (Whisper/TTS) has been disabled in favor of Anthropic-only usage.
// OpenAI references intentionally kept (commented) for rollback.
// import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Provider-agnostic OpenAI client using OPENAI_API_KEY.
 * Works on Render or any standard hosting (no Replit-specific APIs).
 */
// function getOpenAI(): OpenAI {
//   const apiKey = process.env.OPENAI_API_KEY?.trim();
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
//   return new OpenAI({ apiKey });
// }

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";

/**
 * Detect audio format from buffer magic bytes.
 * Supports: WAV, MP3, WebM (Chrome/Firefox), MP4/M4A/MOV (Safari/iOS), OGG
 */
export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 12) return "unknown";

  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "wav";
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "webm";
  if (
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
  ) return "mp3";
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "mp4";
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) return "ogg";
  return "unknown";
}

/**
 * Convert any audio/video format to WAV using ffmpeg.
 */
export async function convertToWav(audioBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);

  try {
    await writeFile(inputPath, audioBuffer);
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-vn", "-f", "wav", "-ar", "16000", "-ac", "1",
        "-acodec", "pcm_s16le", "-y", outputPath,
      ]);
      ffmpeg.stderr.on("data", () => {});
      ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
      ffmpeg.on("error", reject);
    });
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Auto-detect and convert audio to Whisper-compatible format.
 * Whisper accepts mp3, mp4, mpeg, mpga, m4a, wav, webm.
 */
export async function ensureCompatibleFormat(
  audioBuffer: Buffer
): Promise<{ buffer: Buffer; format: "wav" | "mp3" }> {
  const detected = detectAudioFormat(audioBuffer);
  if (detected === "wav") return { buffer: audioBuffer, format: "wav" };
  if (detected === "mp3") return { buffer: audioBuffer, format: "mp3" };
  const wavBuffer = await convertToWav(audioBuffer);
  return { buffer: wavBuffer, format: "wav" };
}

/**
 * Speech-to-Text using OpenAI Whisper API (whisper-1).
 * Provider-agnostic; works on Render with OPENAI_API_KEY.
 */
export async function speechToText(
  audioBuffer: Buffer,
  format: "wav" | "mp3" | "webm" = "wav"
): Promise<string> {
  void audioBuffer;
  void format;
  throw new Error("Speech-to-text is not available (OpenAI Whisper removed; Anthropic is text-only).");
}

/**
 * Text-to-Speech using OpenAI TTS API (tts-1).
 * Returns audio as Buffer (mp3).
 */
export async function textToSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  _format: "wav" | "mp3" | "flac" | "opus" | "pcm16" = "mp3"
): Promise<Buffer> {
  void text;
  void voice;
  void _format;
  throw new Error("Text-to-speech is not available (OpenAI TTS removed; Anthropic is text-only).");
}

/**
 * Streaming TTS: returns async iterable of base64 mp3 chunks.
 * OpenAI TTS streaming returns a single stream; we yield it in one chunk for compatibility.
 */
export async function textToSpeechStream(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<AsyncIterable<string>> {
  const buffer = await textToSpeech(text, voice, "mp3");
  const b64 = buffer.toString("base64");
  return (async function* () {
    yield b64;
  })();
}
