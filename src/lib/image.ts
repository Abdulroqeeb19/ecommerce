export const MAX_IMAGE_DATA_URL = 4 * 1024 * 1024;

const MAX_DIM = 1280;
const BASE_QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode the image"));
    img.src = src;
  });
}

function scaleDown(src: string, maxDim: number, quality: number): Promise<string> {
  return loadImage(src).then(
    (img) =>
      new Promise<string>((resolve) => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      })
  );
}

/**
 * Turns an uploaded image file into a data URL that fits the server's 4MB
 * cap. Source images are downscaled to at most 1280px and re-encoded as JPEG
 * so phone photos (which can be several MB) sync reliably.
 */
export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  return compressDataUrl(raw);
}

/**
 * Downscales an existing data URL so it fits under the server's 4MB cap.
 * Used both for new uploads and to self-heal queued sync payloads that were
 * created before compression existed.
 */
export async function compressDataUrl(raw: string): Promise<string> {
  if (raw.length <= MAX_IMAGE_DATA_URL) return raw;
  let url = await scaleDown(raw, MAX_DIM, BASE_QUALITY);
  if (url.length > MAX_IMAGE_DATA_URL) {
    url = await scaleDown(raw, 900, 0.7);
  }
  if (url.length > MAX_IMAGE_DATA_URL) {
    url = await scaleDown(raw, 640, 0.6);
  }
  return url;
}
