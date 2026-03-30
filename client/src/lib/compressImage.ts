/**
 * Client-side image compression using Canvas API.
 * Runs in the browser before upload — reduces file size dramatically.
 */
export async function compressImageFile(
  file: File,
  maxDim: number = 1200,
  quality: number = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        let { width, height } = img;
        // Scale down if larger than maxDim
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Compress for profile avatar: 400x400, quality 0.75 */
export function compressAvatar(file: File): Promise<string> {
  return compressImageFile(file, 400, 0.75);
}

/** Compress for gallery photo: 1200x1200, quality 0.8 */
export function compressPhoto(file: File): Promise<string> {
  return compressImageFile(file, 1200, 0.8);
}
