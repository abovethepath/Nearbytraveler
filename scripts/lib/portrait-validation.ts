// scripts/lib/portrait-validation.ts
//
// Shared helper used by every script that pulls a fresh face from TPDNE
// (seed-realistic-users, seed-daily-users, dedupe-seed-photos). Loads
// face-api.js with the pure-JS tfjs backend (no native compilation needed
// on Render), decodes the JPEG via sharp → tf.tensor3d (no `canvas` dep),
// and runs TinyFaceDetector + AgeGenderNet in one pass.
//
// Model files are auto-downloaded from the @vladmandic/face-api GitHub
// repo into ./face-models on first call and cached there. Total weight
// download is ~600KB. The cache directory is .gitignored.
//
// Contract:
//   validatePortrait(buf, expectedGender) → { ok, gender?, age?, reason? }
//   fetchAndValidateTpdne(expectedGender, maxRetries=10) → Buffer
//     throws after maxRetries consecutive validation failures.
//
// Tunables (constants below): ADULT_MIN_AGE, GENDER_CONFIDENCE_MIN,
// FACE_SCORE_THRESHOLD, INPUT_SIZE. Adjust if the cron output looks off.

import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

// ───────────── tunables ─────────────
const ADULT_MIN_AGE = 22;             // face-api age estimates are ±5y noisy; 22 keeps us clear of 18
const GENDER_CONFIDENCE_MIN = 0.7;
const FACE_SCORE_THRESHOLD = 0.5;
const INPUT_SIZE = 416;                // TinyFaceDetector input; 416 is the sweet spot for clarity vs. speed
const TPDNE_URL = "https://thispersondoesnotexist.com/";

// ───────────── model setup ─────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, "face-models");

const MODEL_FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  "age_gender_model-weights_manifest.json",
  "age_gender_model.bin",
];

const MODEL_CDN_BASE = "https://raw.githubusercontent.com/vladmandic/face-api/master/model/";

async function fileExists(p: string): Promise<boolean> {
  try { await access(p, fsConstants.F_OK); return true; } catch { return false; }
}

async function ensureModels(): Promise<void> {
  await mkdir(MODELS_DIR, { recursive: true });
  for (const f of MODEL_FILES) {
    const dest = path.join(MODELS_DIR, f);
    if (await fileExists(dest)) continue;
    console.log(`📦 downloading face-api model: ${f}`);
    const res = await fetch(MODEL_CDN_BASE + f);
    if (!res.ok) throw new Error(`download ${f} failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
  }
}

let loaded = false;
async function ensureLoaded(): Promise<{ faceapi: any; tf: any }> {
  // Lazy imports — keep dry-runs and unrelated scripts from paying the cost.
  // @ts-ignore — resolved at install time on Render; no @types available
  const faceapi: any = await import("@vladmandic/face-api");
  // @ts-ignore — same as above
  const tf: any = await import("@tensorflow/tfjs");
  if (!loaded) {
    await ensureModels();
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODELS_DIR);
    await faceapi.nets.ageGenderNet.loadFromDisk(MODELS_DIR);
    loaded = true;
    console.log("✓ face-api ready (tinyFaceDetector + ageGenderNet)");
  }
  return { faceapi, tf };
}

// ───────────── validation ─────────────

export type ExpectedGender = "male" | "female";

export interface ValidationResult {
  ok: boolean;
  gender?: "male" | "female";
  age?: number;
  reason?: string;
}

async function bufToTensor(buf: Buffer, tf: any): Promise<any> {
  // Decode JPEG → raw RGB. sharp's `removeAlpha` strips alpha if present
  // so we always have a 3-channel HxWxC tensor face-api can consume.
  const sharpMod: any = await import("sharp");
  const sharp = sharpMod.default ?? sharpMod;
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], "int32");
}

export async function validatePortrait(buf: Buffer, expectedGender: ExpectedGender): Promise<ValidationResult> {
  const { faceapi, tf } = await ensureLoaded();
  let input: any = null;
  try {
    input = await bufToTensor(buf, tf);
    const detections = await faceapi
      .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: INPUT_SIZE, scoreThreshold: FACE_SCORE_THRESHOLD }))
      .withAgeAndGender();
    if (detections.length === 0) return { ok: false, reason: "no face detected" };
    if (detections.length > 1) return { ok: false, reason: `${detections.length} faces detected` };
    const d = detections[0];
    const age = Math.round(d.age);
    const gender = d.gender as "male" | "female";
    const conf = d.genderProbability as number;
    if (age < ADULT_MIN_AGE) return { ok: false, gender, age, reason: `est. age ${age} < ${ADULT_MIN_AGE}` };
    if (conf < GENDER_CONFIDENCE_MIN) return { ok: false, gender, age, reason: `gender confidence ${conf.toFixed(2)} < ${GENDER_CONFIDENCE_MIN}` };
    if (gender !== expectedGender) return { ok: false, gender, age, reason: `gender mismatch: got ${gender}, want ${expectedGender}` };
    return { ok: true, gender, age };
  } finally {
    if (input) input.dispose();
  }
}

// ───────────── TPDNE retry loop ─────────────

async function fetchTpdneOnce(): Promise<Buffer> {
  const res = await fetch(`${TPDNE_URL}?t=${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if (!res.ok) throw new Error(`TPDNE → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchAndValidateTpdne(expectedGender: ExpectedGender, maxRetries = 10): Promise<Buffer> {
  const reasons: string[] = [];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const buf = await fetchTpdneOnce();
    const v = await validatePortrait(buf, expectedGender);
    if (v.ok) return buf;
    reasons.push(`attempt ${attempt}: ${v.reason}`);
  }
  throw new Error(
    `TPDNE validation exhausted after ${maxRetries} attempts for expectedGender=${expectedGender}: ${reasons.join("; ")}`,
  );
}
