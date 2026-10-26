/**
 * Returns true for image URLs already stored as compressed WebP in `/api/media/*`,
 * legacy `/uploads/*`, or inline `data:` URLs so `next/image` serves them directly
 * from Edge Cache without consuming Vercel Free Image Optimization transformations.
 */
export function isUnoptimizedImageSrc(src: string | undefined | null): boolean {
  if (!src) return false;
  return (
    src.startsWith("/api/media/") ||
    src.startsWith("data:") ||
    src.startsWith("/uploads/")
  );
}

/**
 * Client-side WebP image resizer/compressor for `/admin` uploads.
 * Keeps uploads well below Vercel Hobby's 4.5MB Serverless Function body limit
 * and minimizes free PostgreSQL storage usage (~80KB–200KB per portrait/cover).
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1280,
  quality = 0.84
): Promise<File> {
  if (typeof window === "undefined" || file.type === "image/gif") {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else if (file.size <= 320 * 1024 && file.type === "image/webp") {
        // Already compact WebP
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, "") || "fpoly";
          const compressed = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
