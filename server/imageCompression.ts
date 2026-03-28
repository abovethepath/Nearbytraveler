let sharpLib: typeof import('sharp') | null = null;

async function getSharp() {
  if (sharpLib !== null) return sharpLib;
  try {
    sharpLib = (await import('sharp')).default as unknown as typeof import('sharp');
  } catch {
    sharpLib = null as any;
  }
  return sharpLib;
}

/**
 * Compress a base64 data-URL image using sharp (if available).
 * Falls back to returning the original data URL unchanged if sharp is not installed.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxDim: number,
  quality: number,
  maxBytes: number = 0,
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  if (maxBytes > 0 && dataUrl.length <= maxBytes) return dataUrl;

  const sharp = await getSharp();
  if (!sharp) return dataUrl;

  try {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) return dataUrl;

    const inputBuffer = Buffer.from(match[1], 'base64');

    let q = quality;
    let outputBuffer = await (sharp as any)(inputBuffer)
      .rotate()
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();

    if (maxBytes > 0) {
      const overhead = 'data:image/jpeg;base64,'.length;
      while (q > 20 && (overhead + Math.ceil(outputBuffer.length * 4 / 3)) > maxBytes) {
        q -= 10;
        outputBuffer = await (sharp as any)(inputBuffer)
          .rotate()
          .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: q, mozjpeg: true })
          .toBuffer();
      }
    }

    return `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
  } catch (err) {
    console.warn('Image compression failed, using original:', (err as Error)?.message?.slice(0, 80));
    return dataUrl;
  }
}

export function compressAvatar(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 400, 75, 100_000);
}

export function compressPhoto(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 800, 80, 200_000);
}

export function compressCoverPhoto(dataUrl: string): Promise<string> {
  return compressBase64Image(dataUrl, 1200, 80, 250_000);
}
