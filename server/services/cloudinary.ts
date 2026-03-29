import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/** Upload an audio buffer (voice message) to Cloudinary. */
export async function uploadAudio(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "voice-messages",
        resource_type: "raw",
        public_id: filename.replace(/\.[^.]+$/, ""), // strip extension
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("No result"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/** Delete an audio file from Cloudinary by public ID. */
export async function deleteAudio(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

/** Upload an image buffer (profile photo, gallery) to Cloudinary. */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "profile-images",
        resource_type: "image",
        public_id: filename.replace(/\.[^.]+$/, ""),
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("No result"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
