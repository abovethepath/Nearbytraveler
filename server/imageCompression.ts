import sharp from 'sharp';

/**
 * Compress a base64 data-URL image using sharp.
 *
 * @param dataUrl  Full data URL, e.g. "data:image/png;base64,iVBOR..."
 * @param maxDim   Max width/height in pixels (maintains aspect ratio)
 * @param quality  JPEG quality 1-100
 * @param maxBytes Hard cap on the output base64 string length (0 = no cap)
 * @returns        Compressed data URL (always JPEG), or the original if it's
 *                 already under maxBytes / not a data URL.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxDim: number,
  quality: number,
  maxBytes: number = 0,
): Promise<string> {
  // Only process base64 data URLs
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;

  // Already small enough? Skip compression.
  if (maxBytes > 0 && dataUrl.length <= maxBytes) return dataUrl;

  try {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) return dataUrl;

    const inputBuffer = Buffer.from(match[1], 'base64');

    let q = quality;
    let outputBuffer = await sharp(inputBuffer)
      .rotate() // auto-rotate based on EXIF
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();

    // If still over maxBytes, reduce quality in steps
    if (maxBytes > 0) {
      const overhead = 'data:image/jpeg;base64,'.length;
      while (q > 20 && (overhead + Math.ceil(outputBuffer.length * 4 / 3)) > maxBytes) {
        q -= 10;
        outputBuffer = await sharp(inputBuffer)
          .rotate()
          .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: q, mozjpeg: true })
          .toBuffer();
      }
    }

    const compressed = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
    return compressed;
  } catch (err) {
    // If sharp fails (corrupt image, unsupported format), return original
    console.warn('Image compression failed, using original:', (err as Error)?.message?.slice(0, 80));
    return dataUrl;
  }
}

/** Compress a profile avatar: 400x400, quality 75, max 100KB */
export function compressAvatar(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 400, 75, 100_000);
}

/** Compress a gallery photo: 800x800, quality 80, max 200KB */
export function compressPhoto(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 800, 80, 200_000);
}

/** Compress a cover photo: 1200x600, quality 80, max 250KB */
export function compressCoverPhoto(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 1200, 80, 250_000);
}
